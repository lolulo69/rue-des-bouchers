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

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function createSim({ seed = 1, day = 'mon', cfg = CONFIG } = {}) {
  const rng = createRng(seed);
  const dayCfg = cfg.DAYS[day] ?? cfg.DAYS.mon;
  const { RULES, NOISE, SLEEP, EVIDENCE, WAITER, WITNESS, BUCKET, RISK, ASSO, ANCHORS, ZONES, STREET } = cfg;
  const close = RULES.terraceCloseHour * 60;
  const late = close + RULES.lateGraceMinutes;
  const restaurants = cfg.RESTAURANTS.map((r) => ({ ...r }));
  const restById = Object.fromEntries(restaurants.map((r) => [r.id, r]));
  const { tables, standing } = generateLayout(cfg, rng, dayCfg);

  const S = {
    min: RULES.nightStart,
    sleep: SLEEP.start, asso: ASSO.start, risk: RISK.start, hostility: 0,
    tables, standing, pees: [], nextPeeAt: dayCfg.pee ? 21 * 60 + 30 : Infinity, peeCount: 0,
    evidence: [], clatters: [],
    police: null, policeLog: [], calls: 0, benaliActs: 0, benaliTransferred: false,
    scandal: false, blocKnows: false, serialComplainer: false, tipoffs: [],
    bucketUses: 0, bucketReadyAt: 0, waiterReadyAt: 0, waiterAsks: [], mairieSent: false,
    witnessMemories: [], sleeping: false, ended: false, endReason: null,
    catLeaveAt: rng.range(...WITNESS.gaystapo.catLeave),
    lastClatterLog: {},
    journal: [],
    noiseBed: NOISE.ambientDb,
  };

  const sim = {
    cfg, rng, day: dayCfg, state: S, restaurants, close, late,
    events: [],
    seed,

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
    dossierScore: (restId) => S.evidence.reduce((s, e) => s + (!restId || e.restId === restId ? e.value : 0), 0),
    klaasAwake: () => S.min < WITNESS.klaas.sleepAt,
    // Klaas consigne ce qu'il distingue nettement (détection > 0 à cette distance, à cette heure)
    klaasCanSee: (pos) => sim.klaasAwake() && lineOfSight(ANCHORS.klaasWindow, pos, STREET.halfWidth) && klaasDetection(sim, dist3(ANCHORS.klaasWindow, pos)) > 0,
    catPresent: () => S.min < S.catLeaveAt,
    waiterOnDuty: () => S.min < WAITER.offDutyAt,
    waiterPos: (min = S.min) => ({ x: ANCHORS.waiter.x, z: ANCHORS.waiter.z + Math.sin(min * ANCHORS.waiter.speed) * ANCHORS.waiter.amplitude }),
    activeStanding: () => S.standing.filter((g) => S.min >= g.arriveAt && S.min < g.leaveAt),
    activePees: () => S.pees.filter((p) => S.min < p.end),
    noiseAt: (p, indoor) => noiseAt(sim, p, indoor),
    potentialWitnesses: (pos) => potentialWitnesses(sim, pos),
    patrolOnDuty: () => patrolOnDuty(sim),
    restCenter: (r) => ({ x: r.side * 2, y: 1, z: (r.z0 + r.z1) / 2 }),

    // ---------- sorties ----------
    log(text, cls = '') { sim.events.push({ type: 'log', min: S.min, text, cls }); },
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
      if (silent || by !== 'resto') return;
      // Raclement de chaises : "une table" (au plus toutes les 5 min par resto), "sa terrasse" quand c'est la dernière.
      const r = sim.rest(t.restId);
      const remaining = S.tables.filter((x) => x.restId === r.id && (x.out || x.hiddenUntil !== null)).length;
      const enfin = sim.isLate() ? '… enfin' : '';
      if (!remaining) {
        S.lastClatterLog[r.id] = S.min;
        sim.log(`Raclement de chaises sur les pavés : ${r.name} rentre sa terrasse${enfin}.`);
      } else if (!(S.lastClatterLog[r.id] > S.min - 5)) {
        S.lastClatterLog[r.id] = S.min;
        sim.log(`Raclement de chaises sur les pavés : ${r.name} rentre une table${enfin}.`);
      }
    },

    addRisk(amount, act, witnesses) {
      // Invariant : le Risque ne monte que pour un acte vu par quelqu'un.
      if (!witnesses.length || amount <= 0) return;
      const before = S.risk;
      S.risk = clamp(S.risk + amount, 0, 100);
      sim.note('risk', { amount: S.risk - before, act, witnesses: witnesses.map((w) => w.id) });
      if (before < RISK.warning && S.risk >= RISK.warning) sim.log('Ça circule déjà dans le quartier.', 'bad');
      if (before < RISK.complaint && S.risk >= RISK.complaint) sim.log('Dédé crie qu\'il va porter plainte. Il le fera.', 'bad');
      if (S.risk >= RISK.custody) sim.end('custody');
    },

    end(reason) {
      if (S.ended) return;
      S.ended = true;
      S.endReason = reason;
      sim.note('end', { reason });
      sim.events.push({ type: 'end', reason });
    },

    // ---------- temps ----------
    tick(dMin) {
      if (S.ended) return;
      S.min += dMin;
      for (const t of S.tables) {
        if (t.hiddenUntil !== null && S.min >= t.hiddenUntil) returnTable(t);
        if (t.out && S.min >= t.clearAt) sim.clearTable(t, t.pendingBy || 'resto');
      }
      for (let i = S.clatters.length - 1; i >= 0; i--) if (S.clatters[i].until < S.min) S.clatters.splice(i, 1);
      updatePolice(sim);
      updatePees();
      if (S.min >= SLEEP.drainAfter || S.sleeping) {
        S.noiseBed = sim.noiseAt(ANCHORS.bed, true);
        let d = 0;
        if (S.min >= SLEEP.drainAfter) {
          d -= Math.max(0, S.noiseBed - SLEEP.thresholdDb) * SLEEP.drainPerDbMinute;
          if (S.min < NOISE.exhaustOffMinute) d -= SLEEP.exhaustDrainPerMinute;
        }
        if (S.sleeping && S.noiseBed < SLEEP.thresholdDb) d += SLEEP.recoverPerMinute;
        S.sleep = clamp(S.sleep + d * dMin, 0, 100);
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
        case 'sleep': S.sleeping = !!a.on; return { ok: true };
        default: throw new Error(`action inconnue : ${a.type}`);
      }
    },

    summary: () => buildSummary(sim),
  };

  function returnTable(t) {
    const tip = S.tipoffs.find((x) => x.tableIds.includes(t.id));
    t.hiddenUntil = null;
    if (S.min >= t.clearAt) return; // l'heure de rangement est passée entre-temps : elle reste rentrée
    t.out = true;
    t.clearedAt = null;
    t.clearedBy = null;
    sim.note('table-return', { tableId: t.id, tipoffId: tip?.id });
    if (tip && !tip.returned) {
      tip.returned = S.min;
      const r = sim.rest(tip.restId);
      const pos = sim.restCenter(r);
      if (sim.klaasCanSee(pos)) {
        sim.note('klaas-note', { about: 'tipoff', pos });
        sim.addEvidence({
          type: 'tipoff', restId: r.id, tipoffId: tip.id, quality: 1, value: EVIDENCE.tipoffValue, byKlaas: true, pos,
          text: `Carnet de Klaas : ${r.name} rentre ses tables à ${fmt(tip.tippedAt)}, police à ${fmt(tip.arrivedAt)}, tout ressort à ${fmt(S.min)}`,
        });
        sim.log(`Les tables de ${r.name} ressortent. Klaas a tout noté.`, 'good');
      } else {
        sim.log(`Les tables de ${r.name} ressortent, comme si de rien n'était.`, 'bad');
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
      if (doorway.pilou) sim.log('Quelqu\'un urine contre ta porte d\'entrée. Classique du samedi.', 'bad');
      S.nextPeeAt = S.min + rng.range(...pee.interval);
    }
  }

  // target : { kind: 'table', id } | { kind: 'pee', id } ; distance en m ; fromWindow : depuis chez Pilou
  function photo({ target, distance = 10, fromWindow = false, noiseDb = S.noiseBed }) {
    if (!target) { sim.log('Photo… rien d\'exploitable dans le cadre.'); return { ok: false, found: [] }; }
    const base = EVIDENCE.minQuality + (1 - EVIDENCE.minQuality) * (S.sleep / 100);
    const quality = clamp(base * (distance > EVIDENCE.sharpRange ? 0.75 : 1), EVIDENCE.minQuality, 1);
    const db = Math.round(noiseDb);
    const found = [];
    if (target.kind === 'pee') {
      const p = S.pees.find((x) => x.id === target.id && S.min < x.end);
      if (!p || p.photographed) { sim.log('Photo… rien d\'exploitable dans le cadre.'); return { ok: false, found }; }
      p.photographed = true;
      found.push(sim.addEvidence({ type: 'photo', kind: 'pee', restId: null, peeId: p.id, quality, value: EVIDENCE.peeValue * quality, pos: { x: p.doorway.x, z: p.doorway.z }, text: `Un client urine contre ${p.doorway.label}` }));
    } else {
      const t = sim.table(target.id);
      if (!t || !t.out) { sim.log('Photo… rien d\'exploitable dans le cadre.'); return { ok: false, found }; }
      const max = RULES.maxPeoplePerTable;
      const pos = { x: t.x, z: t.z };
      const add = (kind, text, value, extra = {}) => {
        t.evidence.add(kind);
        found.push(sim.addEvidence({ type: 'photo', kind, restId: t.restId, tableId: t.id, quality, value: value * quality, pos, text, ...extra }));
      };
      if (t.count > max && !t.evidence.has('over')) add('over', `${t.label} : ${t.count} personnes (max ${max}), ${db} dB`, EVIDENCE.overLimitValue, { count: t.count });
      if (sim.isLate() && !t.evidence.has('late')) add('late', `${t.label} encore dehors à ${fmt(S.min)}, ${db} dB`, EVIDENCE.lateValue);
      const enc = sim.encroachment(t);
      if (enc > 0 && !t.evidence.has('corridor')) {
        if (!fromWindow && distance <= EVIDENCE.measureRange) {
          add('corridor', `${t.label} empiète de ${Math.round(enc * 100)} cm sur le passage libre (mesuré)`, EVIDENCE.corridorValue, { encroach: enc });
        } else if (!found.length) {
          sim.log(`${t.label} déborde sur le passage ? Il faut mesurer : approche-toi à moins de ${EVIDENCE.measureRange} m, dans la rue.`);
          return { ok: false, found };
        }
      }
      if (!found.length) {
        sim.log(t.evidence.size ? `${t.label} : déjà dans le dossier.` : `${t.label} : rien d'illégal (pour l'instant).`);
        return { ok: false, found };
      }
    }
    const q = quality >= 0.85 ? 'nette' : quality >= 0.6 ? 'correcte' : 'floue';
    sim.log(`📸 Preuve ajoutée (${q}) : ${found.map((f) => f.text).join(' · ')}`, 'good');
    return { ok: true, found };
  }

  function checkScandal() {
    const police = S.evidence.filter((e) => (e.type === 'complaisance' || e.type === 'tipoff') && e.shared);
    if (!S.scandal && police.length >= cfg.POLICE.scandalThreshold) {
      S.scandal = true;
      sim.note('scandal');
      sim.log('Ça remonte jusqu\'au commissariat. Le commissaire veut voir ça lui-même.', 'good');
    }
  }

  function callAsso() {
    const fresh = S.evidence.filter((e) => !e.shared && e.type !== 'mairie');
    if (!fresh.length) {
      S.asso = clamp(S.asso - ASSO.spamPenalty, 0, 100);
      sim.log('WhatsApp de l\'asso : « Des photos, Pilou. Des PHOTOS. » 🐈', 'bad');
      return { ok: false };
    }
    fresh.forEach((e) => { e.shared = true; });
    S.asso = clamp(S.asso + fresh.length * ASSO.shareGainPerPiece, 0, 100);
    sim.log(`WhatsApp : ${fresh.length} pièce(s) partagée(s). Seb : « 😱 On imprime tout pour la commission ! »`, 'good');
    checkScandal();
    return { ok: true, shared: fresh.length };
  }

  function callMairie() {
    if (S.mairieSent) { sim.log('Mairie : « Votre signalement est en cours de traitement (délai : 15 jours ouvrés). »'); return { ok: false }; }
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
    if (S.min < close) { sim.log(`Le serveur : « Il est pas encore ${RULES.terraceCloseHour}h, monsieur. On rentre à ${RULES.terraceCloseHour}h. »`); return { ok: false, reason: 'early' }; }
    if (!sim.waiterOnDuty()) { sim.log('Le serveur est parti. Il ne reste que Dédé, qui fait semblant de ne pas te voir.'); return { ok: false, reason: 'offduty' }; }
    if (S.min < S.waiterReadyAt) { sim.log('Le serveur : « Je vous ai dit, je vais voir avec le patron… »'); return { ok: false, reason: 'cooldown' }; }
    const out = S.tables.filter((t) => t.restId === r.id && t.out);
    if (!out.length) { sim.log('Le serveur : « C\'est déjà rentré, monsieur. Bonne nuit ! »'); return { ok: false, reason: 'none' }; }
    const p = clamp(WAITER.base + WAITER.complianceWeight * r.compliance + WAITER.assoWeight * (S.asso / 100) - WAITER.hostilityWeight * (S.hostility / 100), 0.05, 0.95);
    const ok = rng.chance(p);
    S.waiterReadyAt = S.min + WAITER.cooldownMinutes;
    S.waiterAsks.push({ time: S.min, ok });
    if (ok) {
      out.forEach((t, i) => { t.clearAt = S.min + 1 + i * 1.5; t.pendingBy = 'waiter'; });
      sim.log('Le serveur soupire : « OK, OK… je rentre tout. » (demande légale et polie)', 'good');
    } else {
      sim.log(S.blocKnows ? 'Le serveur, gêné : « Le patron sait que c\'est vous qui appelez la police… »' : 'Le serveur revient : « Le patron dit que les clients finissent leur verre. »', 'bad');
    }
    return { ok };
  }

  function bucket() {
    if (S.min < S.bucketReadyAt) { sim.log(`Le seau se remplit… (prêt à ${fmt(S.bucketReadyAt)})`); return { ok: false, reason: 'refill' }; }
    const win = ANCHORS.pilouWindow;
    const below = S.tables.filter((t) => t.out && Math.sign(t.x) === Math.sign(win.x) && Math.abs(t.z - win.z) < BUCKET.radius);
    // Les témoins sont tirés AVANT d'évacuer les tables : les clients arrosés lèvent la tête.
    const seen = rollWitnesses(sim, win, { wetTableIds: below.map((t) => t.id) });
    below.forEach((t) => sim.clearTable(t, 'bucket'));
    S.bucketUses++;
    S.bucketReadyAt = S.min + BUCKET.refillMinutes;
    sim.events.push({ type: 'splash' });
    sim.log(`SPLASH ! ${below.length} table(s) évacuée(s). (illégal)`, 'bad');
    for (const w of seen) {
      S.witnessMemories.push({ time: S.min, who: w.id, name: w.name, act: 'seau d\'eau', filmed: w.filmed });
      sim.note('witness', { act: 'bucket', who: w.id, kind: w.kind, pos: w.pos, filmed: w.filmed });
      if (w.kind === 'klaas') sim.note('klaas-note', { about: 'bucket', pos: win });
    }
    if (!seen.length) {
      sim.log('Personne n\'a rien vu… a priori.', 'good');
      return { ok: true, seen };
    }
    const filmed = seen.some((w) => w.filmed);
    const weight = Math.min(WITNESS.riskCap, seen.reduce((s, w) => s + w.weight + (w.filmed ? WITNESS.customers.filmWeight : 0), 0));
    const names = [...new Set(seen.map((w) => (w.kind === 'customers' ? 'des clients' : w.name)))];
    sim.log(`Vu par : ${names.join(', ')}${filmed ? ' · quelqu\'un a filmé !' : ''}`, 'bad');
    if (seen.some((w) => w.kind === 'klaas')) sim.log('En face, Klaas écrit quelque chose dans son carnet…', 'bad');
    if (seen.some((w) => w.ally) || filmed) S.asso = clamp(S.asso - BUCKET.assoPenalty, 0, 100);
    sim.addRisk(BUCKET.risk * weight, 'bucket', seen);
    return { ok: true, seen };
  }

  return sim;
}
