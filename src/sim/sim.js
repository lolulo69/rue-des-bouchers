// Simulation d'une soirée, sans DOM ni three.js : horloge, terrasses, police, preuves, stats, actions.
// Tout passe par sim.act(action) (joueur ou bot) et sim.tick(minutes). Les messages sortent par sim.events,
// et sim.state.journal garde la trace structurée de tout ce qui s'est passé (vérifiée par invariants.js).
import { CONFIG } from '../config.js';
import { createRng } from './rng.js';
import { generateLayout } from './layout.js';
import { noiseAt } from './noise.js';
import { potentialWitnesses, rollWitnesses, klaasDetection } from './witness.js';
import { callPolice, updatePolice, patrolOnDuty } from './police.js';
import { dist3, lineOfSight, corridorEncroachment } from './geometry.js';
import { buildSummary } from './summary.js';
import { fmt } from './time.js';
import { SCHEDULE, inWindow, smokeSpot, patrolPositions } from './schedule.js';
import { planWeather, weatherNow, applyWeather } from './weather.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// carry : ce que la campagne apporte à la nuit (stats, police, drapeaux…). Sans carry : une soirée isolée (v0.2).
//   { asso, risk, hostility, corruption, calls, serialComplainer, benaliTransferred, lemaireTransferred,
//     flags: [], earlyEndings: bool, reversal: bool, enemyMemories: n }
// narrator(kind, sim, args) → texte ou null : la narration (src/sim/narrative.js) injectée par main.js. Sans narrateur
// (tests, simulateur), les textes par défaut ci-dessous. Elle doit utiliser son propre RNG pour ne rien changer à la nuit.
export function createSim({ seed = 1, day = 'mon', weekday, cfg = CONFIG, carry = {}, narrator = null } = {}) {
  const rng = createRng(seed);
  const dayCfg = cfg.DAYS[day] ?? cfg.DAYS.mon;
  const { RULES, NOISE, SLEEP, EVIDENCE, WAITER, WITNESS, BUCKET, RISK, ASSO, ANCHORS, ZONES, STREET, DOG, DISGUISE, POLICE, CAMPAIGN } = cfg;
  const flags = new Set(carry.flags ?? []);
  const close = RULES.terraceCloseHour * 60;
  const late = close + RULES.lateGraceMinutes;
  const restaurants = cfg.RESTAURANTS.map((r) => ({ ...r }));
  const restById = Object.fromEntries(restaurants.map((r) => [r.id, r]));
  const { tables, standing } = generateLayout(cfg, rng, dayCfg);

  const S = {
    min: RULES.nightStart,
    sleep: SLEEP.start, asso: carry.asso ?? ASSO.start, risk: carry.risk ?? RISK.start, hostility: carry.hostility ?? 0,
    corruption: carry.corruption ?? 50, riskStart: carry.risk ?? RISK.start, assoGainTonight: 0, sharedTonight: 0,
    dogSpotted: {}, bribes: [], visit: null,
    tables, standing, pees: [], nextPeeAt: dayCfg.pee ? 21 * 60 + 30 : Infinity, peeCount: 0,
    evidence: [], clatters: [],
    police: null, policeLog: [], calls: carry.calls ?? 0, benaliActs: 0, benaliTransferred: !!carry.benaliTransferred,
    lemaireTransferred: !!carry.lemaireTransferred,
    scandal: false, blocKnows: false, serialComplainer: !!carry.serialComplainer, tipoffs: [],
    bucketUses: 0, bucketReadyAt: 0, waiterReadyAt: 0, waiterAsks: [], mairieSent: false,
    witnessMemories: [], sleeping: false, ended: false, endReason: null,
    catLeaveAt: rng.range(...WITNESS.seb_nico.catLeave),
    lastClatterLog: {},
    journal: [],
    noiseBed: NOISE.ambientDb,
  };

  // Klaas sort ses jumelles de temps en temps (créneaux tirés d'avance), et dès qu'il entend du grabuge (sim.klaasAlert)
  S.klaasWatch = [];
  {
    const b = WITNESS.klaas.binoculars;
    for (let t = RULES.nightStart + rng.range(...b.every); t < WITNESS.klaas.sleepAt; ) {
      const d = rng.range(...b.duration);
      S.klaasWatch.push([t, t + d]);
      t += d + rng.range(...b.every);
    }
  }
  S.weather = planWeather(seed, carry, cfg); // drache (événement de campagne) ou bruine d'ambiance : src/sim/weather.js
  if (carry.reversal) S.visit = { at: rng.range(...CAMPAIGN.reversal.window), phase: 'pending', enemyMemories: carry.enemyMemories ?? 0 };
  const earlyEndings = carry.earlyEndings ?? true;

  const sim = {
    cfg, rng, day: dayCfg, weekday: weekday ?? dayCfg.key, state: S, restaurants, close, late, flags,
    events: [],
    seed,
    // Déguisement : le plus efficace de ceux que Pilou possède
    disguise: Math.min(1, ...Object.entries(DISGUISE).filter(([f]) => flags.has(f)).map(([, m]) => m)),

    // ---------- requêtes ----------
    rest: (id) => restById[id],
    table: (id) => S.tables.find((t) => t.id === id),
    isLate: () => S.min >= late,
    legalX: () => STREET.halfWidth - ZONES.wallGap - ZONES.tableFootprint,
    encroachment: (t) => corridorEncroachment(t, ZONES),
    tableInfractions(t) {
      if (!t.out) return [];
      const k = [];
      if (t.count > RULES.maxPeoplePerTable) k.push('over');
      if (sim.isLate()) k.push('late');
      if (sim.encroachment(t) > 0) k.push('corridor');
      return k;
    },
    infractions: (restId) => S.tables.filter((t) => t.restId === restId && sim.tableInfractions(t).length),
    // Dossier officiel : pièces légales seulement (l'illégal ne sert qu'à la presse / l'IGPN)
    dossierScore: (restId) => S.evidence.reduce((s, e) => s + (e.legal !== false && (!restId || e.restId === restId) ? e.value : 0), 0),
    klaasAwake: () => S.min < WITNESS.klaas.sleepAt,
    // Klaas consigne ce qu'il distingue nettement (détection > 0 à cette distance, à cette heure)
    klaasCanSee: (pos) => sim.klaasAwake() && lineOfSight(ANCHORS.klaasWindow, pos, STREET.halfWidth) && klaasDetection(sim, dist3(ANCHORS.klaasWindow, pos)) > 0,
    klaasWatching: () => sim.klaasAwake() && S.klaasWatch.some(([a, b]) => S.min >= a && S.min < b),
    klaasAlert() {
      if (!sim.klaasAwake()) return;
      const until = Math.min(S.min + WITNESS.klaas.binoculars.react, WITNESS.klaas.sleepAt);
      const last = S.klaasWatch.at(-1);
      if (last && last[0] <= S.min && last[1] >= S.min) last[1] = Math.max(last[1], until);
      else S.klaasWatch.push([S.min, until]);
    },
    catPresent: () => S.min < S.catLeaveAt,
    waiterOnDuty: () => S.min < WAITER.offDutyAt,
    // Pause clope (src/sim/schedule.js) : le serveur fume contre la façade, la 3D et les témoins le voient là
    waiterOnBreak: (min = S.min) => min < WAITER.offDutyAt && inWindow(min, (cfg.SCHEDULE ?? SCHEDULE).waiterBreaks),
    waiterPos: (min = S.min) => (sim.waiterOnBreak(min) ? smokeSpot(cfg)
      : { x: ANCHORS.waiter.x, z: ANCHORS.waiter.z + Math.sin(min * ANCHORS.waiter.speed) * ANCHORS.waiter.amplitude }),
    weather: () => weatherNow(S),
    ghislainCleaning: (min = S.min) => inWindow(min, (cfg.SCHEDULE ?? SCHEDULE).ghislainClean),
    policePositions: () => patrolPositions(sim),
    activeStanding: () => S.standing.filter((g) => S.min >= g.arriveAt && S.min < g.leaveAt),
    activePees: () => S.pees.filter((p) => S.min < p.end),
    noiseAt: (p, indoor) => noiseAt(sim, p, indoor),
    potentialWitnesses: (pos) => potentialWitnesses(sim, pos),
    patrolOnDuty: () => patrolOnDuty(sim),
    restCenter: (r) => ({ x: r.side * 2, y: 1, z: (r.z0 + r.z1) / 2 }),
    // Ronde de Jérémie et du teckel : une traversée de la rue entre DOG.start et DOG.end
    dogActive: () => S.min >= DOG.start && S.min < DOG.end,
    dogPos: () => ({ x: DOG.x, y: 0.4, z: DOG.z0 + (DOG.z1 - DOG.z0) * clamp((S.min - DOG.start) / (DOG.end - DOG.start), 0, 1) }),
    activeBribe: () => S.bribes.find((b) => S.min >= b.from && S.min < b.until),
    // Valeur d'une pièce : pleine pour la 1re de ce resto et de ce type cette nuit, ×repeatFactor ensuite
    pieceValue(restId, kind, value) {
      const repeat = S.evidence.some((e) => e.restId === restId && e.kind === kind);
      return repeat ? value * EVIDENCE.repeatFactor : value;
    },

    // ---------- sorties ----------
    log(text, cls = '') { if (text) sim.events.push({ type: 'log', min: S.min, text, cls }); },
    // Texte narratif (narrator) ou texte par défaut
    say(kind, args, fallback) {
      if (!narrator) return fallback;
      try { return narrator(kind, sim, args) ?? fallback; } catch { return fallback; }
    },
    // Une entrée du carnet de Klaas, s'il peut voir `pos` (narrateur seulement)
    klaasNote(event, pos) {
      if (!narrator || !sim.klaasAwake()) return;
      const det = klaasDetection(sim, dist3(ANCHORS.klaasWindow, pos));
      const text = sim.say('klaas', { event, detection: det }, null);
      if (text) sim.log(text);
    },
    note(type, data = {}) { S.journal.push({ t: S.min, type, ...data }); },
    drainEvents() { const e = sim.events; sim.events = []; return e; },

    addEvidence(e) {
      const ev = { id: S.evidence.length + 1, time: S.min, shared: false, legal: true, ...e };
      S.evidence.push(ev);
      sim.note('evidence', { evidenceId: ev.id, evType: ev.type, kind: ev.kind, tableId: ev.tableId, callId: ev.callId, tipoffId: ev.tipoffId, peeId: ev.peeId, byKlaas: !!ev.byKlaas, pos: ev.pos });
      return ev;
    },

    clearTable(t, by, { silent = false } = {}) {
      if (!t.out) return;
      t.out = false;
      t.clearedAt = S.min;
      t.clearedBy = by;
      S.clatters.push({ x: t.x, y: 0.5, z: t.z, until: S.min + NOISE.clatterMinutes });
      sim.events.push({ type: 'clatter', tableId: t.id });
      sim.note('table-clear', { tableId: t.id, by });
      sim.klaasAlert(); // le fracas des chaises : Klaas prend ses jumelles
      if (silent || by !== 'resto') return;
      // Raclement de chaises : "une table" (au plus toutes les 5 min par resto), "sa terrasse" quand c'est la dernière.
      const r = sim.rest(t.restId);
      const remaining = S.tables.filter((x) => x.restId === r.id && (x.out || x.hiddenUntil !== null)).length;
      const enfin = sim.isLate() ? '… enfin' : '';
      if (!remaining) {
        S.lastClatterLog[r.id] = S.min;
        sim.log(`Raclement de chaises sur les pavés : ${r.name} rentre sa terrasse${enfin}.`);
      } else if (!(S.lastClatterLog[r.id] > S.min - 5)) {
        S.lastClatterLog[r.id] = S.min;
        sim.log(`Raclement de chaises sur les pavés : ${r.name} rentre une table${enfin}.`);
      }
    },

    addRisk(amount, act, witnesses) {
      // Invariant : le Risque ne monte que pour un acte vu par quelqu'un.
      if (!witnesses.length || amount <= 0) return;
      const before = S.risk;
      S.risk = clamp(S.risk + amount, 0, earlyEndings ? 100 : CAMPAIGN.preGate.riskCap);
      sim.note('risk', { amount: S.risk - before, act, witnesses: witnesses.map((w) => w.id) });
      if (before < RISK.warning && S.risk >= RISK.warning) sim.log('Ça circule déjà dans le quartier.', 'bad');
      if (before < RISK.complaint && S.risk >= RISK.complaint) sim.log('Dédé crie qu’il va porter plainte. Il le fera.', 'bad');
      if (earlyEndings && S.risk >= RISK.custody) sim.end('custody');
    },

    end(reason) {
      if (S.ended) return;
      S.ended = true;
      S.endReason = reason;
      sim.note('end', { reason });
      sim.log(sim.say('end', { reason }, null));
      sim.events.push({ type: 'end', reason });
    },

    // ---------- temps ----------
    tick(dMin) {
      if (S.ended) return;
      S.min += dMin;
      applyWeather(sim);
      for (const t of S.tables) {
        if (t.hiddenUntil !== null && S.min >= t.hiddenUntil) returnTable(t);
        if (t.out && S.min >= t.clearAt) sim.clearTable(t, t.pendingBy || 'resto');
      }
      for (let i = S.clatters.length - 1; i >= 0; i--) if (S.clatters[i].until < S.min) S.clatters.splice(i, 1);
      updatePolice(sim);
      updateVisit();
      updateDog();
      updatePees();
      if (S.min >= SLEEP.drainAfter || S.sleeping) {
        S.noiseBed = sim.noiseAt(ANCHORS.bed, true);
        let d = 0;
        if (S.min >= SLEEP.drainAfter) {
          d -= Math.max(0, S.noiseBed - SLEEP.thresholdDb) * SLEEP.drainPerDbMinute;
          if (S.min < NOISE.exhaustOffMinute && !S.exhaustBlocked) d -= SLEEP.exhaustDrainPerMinute; // carton sur la gaine (nightActions.js)
        }
        if (S.sleeping && S.noiseBed < SLEEP.thresholdDb) d += SLEEP.recoverPerMinute;
        S.sleep = clamp(S.sleep + d * dMin, earlyEndings ? 0 : CAMPAIGN.preGate.sleepFloor, 100);
        if (S.sleep <= 0) sim.end('sleep');
      }
      if (S.min >= RULES.nightEnd) sim.end('time');
    },

    // ---------- actions (joueur ou bot) ----------
    act(a) {
      if (S.ended) return { ok: false, reason: 'ended' };
      sim.note('action', { action: a.type });
      switch (a.type) {
        case 'photo': return photo(a);
        case 'police': return callPolice(sim, { asso: !!a.asso });
        case 'asso': return callAsso();
        case 'mairie': return callMairie();
        case 'waiter': return askWaiter();
        case 'bucket': return bucket();
        case 'db': return dbReading(a);
        case 'sleep': S.sleeping = !!a.on; return { ok: true };
        default: throw new Error(`action inconnue : ${a.type}`);
      }
    },

    summary: () => buildSummary(sim),
  };

  const tipCtx = (tip) => ({ time: fmt(tip.tippedAt), tipTime: fmt(tip.tippedAt), arriveTime: fmt(tip.arrivedAt), returnTime: fmt(tip.returned ?? tip.returnAt), rest: sim.rest(tip.restId).name, n: tip.tableIds.length });
  function returnTable(t) {
    const tip = S.tipoffs.findLast((x) => x.tableIds.includes(t.id));
    t.hiddenUntil = null;
    if (S.min >= t.clearAt) return; // l'heure de rangement est passée entre-temps : elle reste rentrée
    t.out = true;
    t.clearedAt = null;
    t.clearedBy = null;
    sim.note('table-return', { tableId: t.id, tipoffId: tip?.id });
    S.clatters.push({ x: t.x, y: 0.5, z: t.z, until: S.min + NOISE.clatterMinutes }); // on ressort les chaises : ça racle
    sim.events.push({ type: 'clatter', tableId: t.id });
    sim.klaasAlert();
    if (tip && !tip.returned) {
      tip.returned = S.min;
      const r = sim.rest(tip.restId);
      const pos = sim.restCenter(r);
      if (sim.klaasCanSee(pos)) {
        sim.note('klaas-note', { about: 'tipoff', pos });
        sim.klaasNote({ about: 'tipoff', ...tipCtx(tip) }, pos);
        sim.addEvidence({
          type: 'tipoff', restId: r.id, tipoffId: tip.id, quality: 1, value: EVIDENCE.tipoffValue, byKlaas: true, pos,
          text: `Carnet de Klaas : ${r.name} rentre ses tables à ${fmt(tip.tippedAt)}, police à ${fmt(tip.arrivedAt)}, tout ressort à ${fmt(S.min)}`,
        });
        sim.log(`Les tables de ${r.name} ressortent. Klaas a tout noté.`, 'good');
      } else {
        sim.log(`Les tables de ${r.name} ressortent, comme si de rien n’était.`, 'bad');
      }
    }
  }

  function updatePees() {
    const pee = dayCfg.pee;
    if (!pee) return;
    if (S.min >= S.nextPeeAt && S.min < RULES.nightEnd - 15) {
      const pilouDoor = ANCHORS.doorways.find((d) => d.pilou);
      const doorway = rng.chance(pee.pilouDoorChance) ? pilouDoor : rng.pick(ANCHORS.doorways.filter((d) => !d.pilou));
      const p = { id: `pipi-${++S.peeCount}`, doorway, start: S.min, end: S.min + pee.duration };
      S.pees.push(p);
      sim.note('pee', { peeId: p.id, pos: { x: doorway.x, z: doorway.z } });
      if (doorway.pilou) sim.log('Quelqu’un urine contre votre porte d’entrée. Classique du samedi.', 'bad');
      S.nextPeeAt = S.min + rng.range(...pee.interval);
    }
  }

  // target : { kind: 'table', id } | { kind: 'pee', id } ; distance en m ; fromWindow : depuis chez Pilou
  function photo({ target, distance = 10, fromWindow = false, noiseDb = S.noiseBed }) {
    if (!target) { sim.log('Photo… rien d’exploitable dans le cadre.'); return { ok: false, found: [] }; }
    const base = EVIDENCE.minQuality + (1 - EVIDENCE.minQuality) * (S.sleep / 100);
    const quality = clamp(base * (distance > EVIDENCE.sharpRange ? 0.75 : 1), EVIDENCE.minQuality, 1);
    const db = Math.round(noiseDb);
    const found = [];
    if (target.kind === 'police') return photoPolice(distance, quality);
    if (target.kind === 'pee') {
      const p = S.pees.find((x) => x.id === target.id && S.min < x.end);
      if (!p || p.photographed) { sim.log('Photo… rien d’exploitable dans le cadre.'); return { ok: false, found }; }
      p.photographed = true;
      found.push(sim.addEvidence({ type: 'photo', kind: 'pee', restId: null, peeId: p.id, quality, value: sim.pieceValue(null, 'pee', EVIDENCE.peeValue) * quality, pos: { x: p.doorway.x, z: p.doorway.z }, text: `Un client urine contre ${p.doorway.label}` }));
    } else {
      const t = sim.table(target.id);
      if (!t || !t.out) { sim.log('Photo… rien d’exploitable dans le cadre.'); return { ok: false, found }; }
      const max = RULES.maxPeoplePerTable;
      const pos = { x: t.x, z: t.z };
      const add = (kind, text, value, extra = {}) => {
        t.evidence.add(kind);
        found.push(sim.addEvidence({ type: 'photo', kind, restId: t.restId, tableId: t.id, quality, value: sim.pieceValue(t.restId, kind, value) * quality, pos, text, ...extra }));
      };
      if (t.count > max && !t.evidence.has('over')) add('over', `${t.label} : ${t.count} personnes (max ${max}), ${db} dB`, EVIDENCE.overLimitValue, { count: t.count });
      if (sim.isLate() && !t.evidence.has('late')) add('late', `${t.label} encore dehors à ${fmt(S.min)}, ${db} dB`, EVIDENCE.lateValue);
      const enc = sim.encroachment(t);
      if (enc > 0 && !t.evidence.has('corridor')) {
        if (!fromWindow && distance <= EVIDENCE.measureRange) {
          add('corridor', `${t.label} empiète de ${Math.round(enc * 100)} cm sur le passage libre (mesuré)`, EVIDENCE.corridorValue, { encroach: enc });
        } else if (!found.length) {
          sim.log(`${t.label} déborde sur le passage ? Il faut mesurer : approchez-vous à moins de ${EVIDENCE.measureRange} m, dans la rue.`);
          return { ok: false, found };
        }
      }
      if (!found.length) {
        sim.log(t.evidence.size ? `${t.label} : déjà dans le dossier.` : `${t.label} : rien d’illégal (pour l’instant).`);
        return { ok: false, found };
      }
    }
    const q = quality >= 0.85 ? 'nette' : quality >= 0.6 ? 'correcte' : 'floue';
    sim.log(`📸 Preuve ajoutée (${q}) : ${found.map((f) => f.text).join(' · ')}`, 'good');
    return { ok: true, found };
  }

  function checkScandal() {
    const police = S.evidence.filter((e) => (e.type === 'complaisance' || e.type === 'tipoff') && e.shared);
    if (!S.scandal && police.length >= cfg.POLICE.scandalThreshold) {
      S.scandal = true;
      sim.note('scandal');
      sim.log('Ça remonte jusqu’au commissariat. Le Commandant Desmet veut voir ça lui-même.', 'good');
    }
  }

  function callAsso() {
    const fresh = S.evidence.filter((e) => !e.shared && e.type !== 'mairie');
    if (!fresh.length) {
      S.asso = clamp(S.asso - ASSO.spamPenalty, 0, 100);
      sim.log('WhatsApp de l’asso : « Des photos, Pilou. Des PHOTOS. » 🐈', 'bad');
      return { ok: false };
    }
    fresh.forEach((e) => { e.shared = true; });
    // Rendements décroissants dans la nuit, et plafond de gain par nuit
    let gain = 0;
    for (let i = 0; i < fresh.length; i++) gain += ASSO.shareGainPerPiece * ASSO.shareDecay ** (S.sharedTonight + i);
    S.sharedTonight += fresh.length;
    gain = Math.min(gain, Math.max(0, ASSO.nightGainCap - S.assoGainTonight));
    S.assoGainTonight += gain;
    S.asso = clamp(S.asso + gain, 0, 100);
    sim.log(`WhatsApp : ${fresh.length} pièce(s) partagée(s). Seb : « 😱 On imprime tout pour la commission ! »`, 'good');
    checkScandal();
    return { ok: true, shared: fresh.length };
  }

  function callMairie() {
    if (S.mairieSent) { sim.log('Mairie : « Votre signalement est en cours de traitement (délai : 15 jours ouvrés). »'); return { ok: false }; }
    S.mairieSent = true;
    const pieces = S.evidence.filter((e) => e.type !== 'mairie');
    if (!pieces.length) { sim.log('Signalement envoyé sans pièce jointe. Accusé de réception automatique.'); return { ok: true, pieces: 0 }; }
    pieces.forEach((e) => { e.shared = true; });
    sim.addEvidence({ type: 'mairie', restId: null, quality: 1, value: EVIDENCE.mairieValue, text: `Signalement à la mairie avec ${pieces.length} pièce(s) jointe(s)` });
    sim.log(`Signalement envoyé à la mairie avec ${pieces.length} pièce(s) jointe(s). Le service ouvre à 8h30.`, 'good');
    checkScandal();
    return { ok: true, pieces: pieces.length };
  }

  function askWaiter() {
    const r = sim.rest('bernadette');
    const said = (result, text, cls = '') => { sim.log(sim.say('waiter', { result }, text), cls); return result; };
    if (S.min < close) return said({ ok: false, reason: 'early' }, `Le serveur : « Il est pas encore ${RULES.terraceCloseHour}h, monsieur. On rentre à ${RULES.terraceCloseHour}h. »`);
    if (!sim.waiterOnDuty()) return said({ ok: false, reason: 'offduty' }, 'Le serveur est parti. Il ne reste que Dédé, qui fait semblant de ne pas te voir.');
    if (S.min < S.waiterReadyAt) return said({ ok: false, reason: 'cooldown' }, 'Le serveur : « Je vous ai dit, je vais voir avec le patron… »');
    const out = S.tables.filter((t) => t.restId === r.id && t.out);
    if (!out.length) return said({ ok: false, reason: 'none' }, 'Le serveur : « C’est déjà rentré, monsieur. Bonne nuit ! »');
    const p = clamp(WAITER.base + WAITER.complianceWeight * r.compliance + WAITER.assoWeight * (S.asso / 100) - WAITER.hostilityWeight * (S.hostility / 100), 0.05, 0.95);
    const ok = rng.chance(p);
    S.waiterReadyAt = S.min + WAITER.cooldownMinutes;
    S.waiterAsks.push({ time: S.min, ok });
    if (ok) {
      out.forEach((t, i) => { t.clearAt = S.min + 1 + i * 1.5; t.pendingBy = 'waiter'; });
      return said({ ok }, 'Le serveur soupire : « OK, OK… je rentre tout. » (demande légale et polie)', 'good');
    }
    return said({ ok }, S.blocKnows ? 'Le serveur, gêné : « Le patron sait que c’est vous qui appelez la police… »' : 'Le serveur revient : « Le patron dit que les clients finissent leur verre. »', 'bad');
  }

  function bucket() {
    if (S.min < S.bucketReadyAt) { sim.log(`Le seau se remplit… (prêt à ${fmt(S.bucketReadyAt)})`); return { ok: false, reason: 'refill' }; }
    const win = ANCHORS.pilouWindow;
    const below = S.tables.filter((t) => t.out && Math.sign(t.x) === Math.sign(win.x) && Math.abs(t.z - win.z) < BUCKET.radius);
    // Les témoins sont tirés AVANT d'évacuer les tables : les clients arrosés lèvent la tête.
    const seen = sim.witnessAct(win, 'seau d’eau', { wetTableIds: below.map((t) => t.id) });
    below.forEach((t) => sim.clearTable(t, 'bucket'));
    S.bucketUses++;
    S.bucketReadyAt = S.min + BUCKET.refillMinutes;
    sim.events.push({ type: 'splash' });
    sim.log(`SPLASH ! ${below.length} table(s) évacuée(s). (illégal)`, 'bad');
    sim.punish(seen, 'bucket', BUCKET.risk, BUCKET.assoPenalty);
    return { ok: true, seen };
  }

  // Un acte illégal en `pos` : tire les témoins (aboiement du teckel compris), les mémorise, sans encore punir.
  sim.witnessAct = (pos, label, opts = {}) => {
    const dog = sim.dogActive() && Math.hypot(sim.dogPos().x - pos.x, sim.dogPos().z - pos.z) <= DOG.barkRange;
    if (dog) { sim.log('Biloute, le teckel de Jérémie, aboie comme un fou ! Toute la rue lève la tête.', 'bad'); sim.klaasAlert(); }
    const seen = rollWitnesses(sim, pos, { ...opts, bark: dog ? DOG.barkBonus : 0 });
    for (const w of seen) {
      S.witnessMemories.push({ time: S.min, who: w.id, kind: w.kind, ally: !!w.ally, name: w.name, act: label, filmed: w.filmed });
      sim.note('witness', { act: label, who: w.id, kind: w.kind, pos: w.pos, filmed: w.filmed });
      if (w.kind === 'klaas') { sim.note('klaas-note', { about: label, pos }); sim.klaasNote({ about: 'pilou', act: label, time: fmt(S.min) }, pos); }
    }
    return seen;
  };
  // Conséquences d'un acte vu : Risque × poids des témoins (plafonné), Asso si un allié a vu ou si ça a été filmé.
  sim.punish = (seen, act, baseRisk, assoPenalty = 0) => {
    if (!seen.length) { sim.log(sim.say('witness', {}, 'Personne n’a rien vu… a priori.'), 'good'); return 0; }
    if (narrator) for (const w of seen.filter((x, k) => seen.findIndex((y) => y.kind === x.kind && !!y.filmed === !!x.filmed) === k)) sim.log(sim.say('witness', { witness: w }, null), 'bad'); // une réplique par type de témoin
    const filmed = seen.some((w) => w.filmed);
    const weight = Math.min(WITNESS.riskCap, seen.reduce((s, w) => s + w.weight + (w.filmed ? WITNESS.customers.filmWeight : 0), 0));
    const names = [...new Set(seen.map((w) => (w.kind === 'customers' ? 'des clients' : w.name)))];
    sim.log(`Vu par : ${names.join(', ')}${filmed ? ' · quelqu’un a filmé !' : ''}`, 'bad');
    if (seen.some((w) => w.kind === 'klaas')) sim.log('Au bout de la rue, Klaas écrit quelque chose dans son carnet…', 'bad');
    if (seen.some((w) => w.ally) || filmed) S.asso = clamp(S.asso - assoPenalty, 0, 100);
    sim.addRisk(baseRisk * weight, act, seen);
    return weight;
  };

  // Relevé en dB : une pièce par demi-heure si c'est du tapage nocturne (après 22:00, au-dessus du seuil)
  function dbReading({ noiseDb, fromWindow = true } = {}) {
    const db = Math.round(noiseDb ?? sim.noiseAt(fromWindow ? ANCHORS.pilouWindow : sim.restCenter(sim.rest('bernadette')), false));
    if (S.min < SLEEP.drainAfter || db < EVIDENCE.dbThreshold) { sim.log(`📟 ${db} dB. ${S.min < SLEEP.drainAfter ? 'Avant 22h, ça ne compte pas.' : 'Pénible, mais pas assez pour un dossier.'}`); return { ok: false, db }; }
    if (S.lastDbAt !== undefined && S.min - S.lastDbAt < EVIDENCE.dbEvery) { sim.log(`📟 ${db} dB. Déjà un relevé il y a moins de ${EVIDENCE.dbEvery} min.`); return { ok: false, db }; }
    S.lastDbAt = S.min;
    const ev = sim.addEvidence({ type: 'db', kind: 'db', restId: null, quality: 0.8, value: sim.pieceValue(null, 'db', EVIDENCE.dbValue), db, text: `Relevé sonore à ${fmt(S.min)} : ${db} dB${fromWindow ? ' à la fenêtre de Pilou' : ' dans la rue'}` });
    sim.log(`📟 ${db} dB relevés et horodatés.`, 'good');
    return { ok: true, db, found: [ev] };
  }

  // Photo de la patrouille : le jackpot si l'enveloppe passe à ce moment-là, d'un endroit légal et d'assez près.
  function photoPolice(distance, quality) {
    const b = sim.activeBribe();
    if (!b) { sim.log('Les agents… rien d’illégal à photographier. Pour l’instant.'); return { ok: false, found: [] }; }
    if (b.photographed) { sim.log('L’enveloppe est déjà dans le dossier.'); return { ok: false, found: [] }; }
    if (distance > POLICE.bribePhotoRange) { sim.log('Trop loin : on voit une main, pas une enveloppe. Rapprochez-vous.'); return { ok: false, found: [] }; }
    b.photographed = true;
    const ev = sim.addEvidence({
      type: 'photo', kind: 'bribe', restId: b.restId, callId: b.callId, bribeId: b.id, quality, value: EVIDENCE.bribeValue * quality,
      text: `${b.patrolName} reçoit une enveloppe de Dédé devant ${sim.rest(b.restId).name}`,
    });
    sim.log('📸 JACKPOT : l’enveloppe, en pleine main. (photo légale)', 'good');
    return { ok: true, found: [ev] };
  }

  // La police vient pour Pilou (plainte du bloc), planifiée par la campagne.
  function updateVisit() {
    const v = S.visit;
    if (!v || v.phase === 'done') return;
    if (v.phase === 'pending' && S.min >= v.at) {
      v.phase = 'onsite';
      v.until = S.min + POLICE.visitMinutes;
      sim.note('police-scheduled', { reason: 'pilou' });
      sim.note('police-arrive', { visit: true, reason: 'pilou' });
      if (v.enemyMemories > 0) {
        sim.log('On sonne : la police, pour vous. Plainte du bloc pour « harcèlement ». Rappel à la loi.', 'bad');
        sim.addRisk(POLICE.visitRisk ?? 10, 'plainte', [{ id: 'memoire-ennemie' }]);
      } else {
        sim.log('On sonne : la police, pour vous. Contrôle d’identité… rien à vous reprocher. Le bloc a essayé.', 'bad');
      }
    } else if (v.phase === 'onsite' && S.min >= v.until) v.phase = 'done';
  }

  // Ronde de Jérémie : le teckel s'arrête aux tables en infraction ; une pièce par resto et par nuit.
  function updateDog() {
    if (!sim.dogActive()) return;
    const d = sim.dogPos();
    for (const t of S.tables) {
      if (S.dogSpotted[t.restId] || Math.hypot(t.x - d.x, t.z - d.z) > DOG.spotRange + cfg.ZONES.tableFootprint) continue;
      const kinds = sim.tableInfractions(t);
      if (!kinds.length) continue;
      S.dogSpotted[t.restId] = true;
      sim.addEvidence({ type: 'round', kind: kinds[0], restId: t.restId, tableId: t.id, quality: 0.8, value: sim.pieceValue(t.restId, kinds[0], EVIDENCE.roundValue), pos: { x: t.x, z: t.z }, count: t.count, encroach: sim.encroachment(t), text: `Ronde de Jérémie : ${t.label} (${kinds.join(', ')}). Le teckel grogne.` });
      sim.log(`Jérémie passe avec le teckel et note ${t.label}.`, 'good');
    }
  }

  return sim;
}
