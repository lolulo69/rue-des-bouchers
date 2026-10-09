// Moteur de campagne (§3, §14) : 14 jours × matin (Koddex) → après-midi → nuit (sim.js), pur et déterministe.
// Le contenu narratif (src/content) est de la donnée : ce module l'évalue (conditions, effets), le joue dans l'ordre
// du calendrier et tient un journal vérifié par campaignInvariants.js. Tout l'état est sérialisable (JSON).
//
// Pas à pas (UI ou bot) :
//   c.card()                 → carte en attente (événement / dialogue / contre-offensive / info) ou null
//   c.resolveCard(i)         → choix i d'un événement (ou "OK")
//   c.step                   → 'cards' | 'koddex' | 'actions' | 'night' | 'recap' | 'ended'
//   matin     : c.koddexOptions(), c.koddex(['work', 'proj_db_logger', 'work'])
//   après-midi: c.availableActions(), c.doAction(id), c.endAfternoon()
//   nuit      : c.createNight() → sim ; (jouer la nuit) ; c.nightActions(sim), c.doNightAction(sim, id) ; c.finishNight(sim)
//   récap     : c.nextDay()
import { CONFIG } from '../config.js';
import { createRng } from './rng.js';
import { createSim } from './sim.js';
import { evalCondition, STAT_KEYS, HIDDEN_KEYS } from './conditions.js';
import { normalizeContent } from './content.js';
import { pickTwist, nightTwist } from './twists.js';
import { createUnlocks } from './unlocks.js';
import { performNightAction } from './nightActions.js';
import { pickObjectives, matchDone, journalEvents, bedtimeHint } from './objectives.js';
import { fmt } from './time.js';

import { SAVE_VERSION, migrateSave, sanitizeSave } from './saveMigrations.js';

export { SAVE_VERSION };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const ALLIES = new Set(['klaas', 'seb_nico', 'biloute', 'jeremie', 'hilde', 'tatie']);
// Présence en journée (actions de l'après-midi) des témoins nommés par le contenu
const DAY_PRESENCE = { klaas: 0.8, seb_nico: 0.6, waiter: 0.7, customers: 0.8, biloute: 0.3, jeremie: 0.3, dede: 0.6, ghislain: 0.5, police: 0.1 };

// Bureau ou maison chaque jour (§12b.D) : homePerWeek jours de semaine à la maison, jamais le dernier jour, tirés à la graine
export function workplacePlan(seed, cfg = CONFIG) {
  const C = cfg.CAMPAIGN;
  const rng = createRng((seed ^ 0xb1cc1e) >>> 0);
  const plan = Array.from({ length: C.days }, () => 'office');
  for (let w = 0; w * 7 < C.days; w++) {
    const days = [];
    for (let d = w * 7 + 1; d <= Math.min(C.days - 1, w * 7 + 7); d++) if (!['sat', 'sun'].includes(C.weekdays[(d - 1) % 7])) days.push(d);
    for (let k = 0; k < (C.workdays?.homePerWeek ?? 2) && days.length; k++) plan[days.splice(rng.int(0, days.length - 1), 1)[0] - 1] = 'home';
  }
  return plan;
}

export function initialState(seed, cfg = CONFIG) {
  const C = cfg.CAMPAIGN;
  return {
    version: SAVE_VERSION,
    seed,
    rng: seed >>> 0,
    day: 1,
    phase: 'morning',
    step: 'cards',
    stats: Object.fromEntries(STAT_KEYS.map((k) => [k, C.start[k] ?? 0])),
    hidden: Object.fromEntries(HIDDEN_KEYS.map((k) => [k, C.start[k] ?? 0])),
    flags: [],
    evidence: [],
    witnessMemories: [],
    police: { fatigue: 0, serialComplainer: false, benaliTransferred: false, lemaireTransferred: false },
    igpn: null,
    seen: { events: [], dialogue: [], countermoves: [], actions: [], tutorial: [], media: [] },
    counts: { actions: {}, events: {}, dialogue: {}, countermoves: {}, koddex: {} },
    cards: [],
    lastCard: null,
    timeLeft: 0,
    koddexDone: false,
    nightCount: 0,
    nights: [],
    pendingEnding: null,
    workplaces: workplacePlan(seed, cfg), // §12b.D : 'office' | 'home' pour chaque jour
    workplace: 'office',
    tutorials: { seen: [], done: [], step: {} }, // v1.1 : tutoriels pratiques des outils (vus, terminés, étape en cours)
    twistHistory: [],    // v1.1 : [{ day, id }], jamais deux fois le même twist
    tonightTwist: null,  // { day, id } : choisi à l'entrée de la nuit, rejoué tel quel après un rechargement
    unlocked: [],        // v1.1 : ids de UNLOCKS acquis
    pushedMedia: [],     // ids de médias poussés par les conséquences d'un twist (after.media)
    ending: null,
    epilogue: [],
    journal: [],
  };
}

// narrative (facultatif) : le module src/sim/narrative.js (tutoriel, fil du téléphone, manchettes, scène du J14, unes de fin).
// Sans lui (tests, simulateur), ces textes sont simplement absents.
export function createCampaign({ seed = 1, content, cfg = CONFIG, save = null, narrative = null } = {}) {
  const K = normalizeContent(content ?? {});
  const C = cfg.CAMPAIGN;
  // Sauvegarde : migrée vers le schéma courant (SaveError si illisible ou d'une version plus récente), puis nettoyée
  // contre le contenu chargé (ids renommés suivis, contenus disparus ignorés). Notes dans c.migrationNotes.
  // Les notes restent hors de l'état : une sauvegarde rechargée puis resauvegardée est identique octet pour octet.
  let S;
  const migrationNotes = [];
  if (save) {
    const m = migrateSave(save);
    S = m.save;
    migrationNotes.push(...m.notes);
  } else S = initialState(seed, cfg);
  const rng = createRng(1);
  rng.setState(S.rng);
  S.seen.tutorial ??= [];
  S.seen.media ??= [];
  // Pas de redite (QA « pass 2 (transcripts) ») : une entrée rejouable (`once: false`, travail Koddex, gag…) ne revient pas
  // avant C.repeatCooldownDays jours, sauf `repeatable: true` dans le contenu. S.lastShown[id] = dernier jour montré.
  S.lastShown ??= {};
  const cooled = (x) => x.repeatable || S.lastShown[x.id] === undefined || S.day - S.lastShown[x.id] >= (C.repeatCooldownDays ?? 4);
  const shown = (id) => { S.lastShown[id] = S.day; };
  // Événements de nuit : joués pendant la nuit 3D à leur heure (`at`), plus en cartes avant 20h30 (c.nightEventDue)
  S.nightEvents ??= [];
  // Objectifs du soir (§12c.5) : { day, ids, done } de la nuit en cours (ou de la dernière, pour le bilan)
  S.objectives ??= null;
  // Ensemble des drapeaux, mis en cache (les conditions sont évaluées très souvent) ; invalidé à chaque modification
  let flagSet = null;
  const flags = () => (flagSet ??= new Set(S.flags));
  const byId = (list) => Object.fromEntries(list.map((x) => [x.id, x]));
  const EVENTS = byId(K.EVENTS), ACTIONS = byId(K.ACTIONS), DIALOGUE = byId(K.DIALOGUE), CMS = byId(K.COUNTERMOVES), ENDINGS = byId(K.ENDINGS);
  if (save) migrationNotes.push(...sanitizeSave(S, K));
  const U = createUnlocks(K.UNLOCKS);
  if (S.unlocked === null) S.unlocked = K.UNLOCKS.map((u) => u.id); // sauvegarde d'avant la v1.1 : rien ne disparaît
  if (S.workplaces === null) { S.workplaces = workplacePlan(S.seed, cfg); S.workplace = S.workplaces[S.day - 1] ?? 'office'; }
  const TWISTS = byId(K.TWISTS);
  // Distractions des jours de télétravail (§12b.D) : des événements à choix, comme les cartes d'événement
  const WORK_EVENTS = byId(K.WORKDAYS.home?.distractions ?? []);

  const c = {
    state: S, content: K, cfg, rng, migrationNotes,
    get step() { return S.step; },
    get ended() { return S.step === 'ended'; },
    ctx: () => ({ day: S.day, phase: S.phase, weekday: c.weekday(), workplace: S.workplace, flags: flags(), stats: S.stats, hidden: S.hidden }),
    check: (cond, useChance = true) => evalCondition(cond, c.ctx(), useChance ? rng : null),
    has: (f) => S.flags.includes(f),
    weekday: (day = S.day) => C.weekdays[(day - 1) % 7],
    isSaturday: (day = S.day) => C.saturdays.includes(day),
    gateOpen: () => S.day >= C.earlyFromDay,
    note(type, data = {}) { S.journal.push({ day: S.day, phase: S.phase, type, ...data }); },
    save() { S.rng = rng.getState(); return structuredClone(S); },
    // Le dossier de campagne : pièces légales (le reste ne sert qu'à la presse / l'IGPN)
    pressFile: () => S.evidence.reduce((s, e) => s + e.value, 0),
    legalFile: () => S.evidence.reduce((s, e) => s + (e.legal ? e.value : 0), 0),
  };

  // ---------- effets ----------
  // cause : 'action' | 'witnessed' | 'story' (événement, contre-offensive, dialogue) | 'koddex' | 'night' | 'engine'
  function apply(effects, cause, source) {
    if (!effects) return;
    const deltas = {};
    for (const k of STAT_KEYS) {
      if (typeof effects[k] !== 'number') continue;
      // Les gains écrits par le contenu sont relatifs : la config fixe l'échelle (équilibrage, qa/balance.md)
      const scale = effects[k] > 0 && cause !== 'engine' ? (k === 'dossier' ? C.contentDossierScale : k === 'asso' ? C.contentAssoScale : 1) ?? 1 : 1;
      const v = effects[k] * scale;
      deltas[k] = setStat(k, S.stats[k] + (k === 'asso' && cause !== 'engine' ? assoGain(v) : v));
    }
    for (const k of HIDDEN_KEYS) {
      if (typeof effects[k] !== 'number') continue;
      const before = S.hidden[k];
      S.hidden[k] = clamp(before + effects[k], 0, 100);
      deltas[k] = S.hidden[k] - before;
    }
    for (const f of effects.setFlags ?? []) setFlag(f);
    for (const f of effects.clearFlags ?? []) { S.flags = S.flags.filter((x) => x !== f); flagSet = null; }
    if (effects.evidence) addEvidence({ ...effects.evidence, source });
    if (effects.ending) {
      // Une fin anticipée demandée avant la nuit 5 est ignorée (on frôle, on ne tombe pas)
      const e = ENDINGS[effects.ending];
      if (e && isEarly(e) && !c.gateOpen()) c.note('ending-gated', { id: e.id });
      else S.pendingEnding = effects.ending;
    }
    c.note('effects', { cause, source, deltas });
  }
  function setStat(k, v) {
    const before = S.stats[k];
    let lo = 0;
    let hi = 100;
    // Avant la nuit 5, on frôle la catastrophe sans y tomber (fins anticipées verrouillées)
    if (!c.gateOpen()) {
      if (k === 'risk') hi = C.preGate.riskCap;
      if (k === 'sleep') lo = C.preGate.sleepFloor;
      if (k === 'job' && !c.has('unemployed')) lo = C.preGate.jobFloor;
    }
    S.stats[k] = clamp(v, lo, hi);
    // Le Risque franchit le seuil de garde à vue (à partir de la nuit 5) : le moteur pose le drapeau `custody`
    if (k === 'risk' && c.gateOpen() && S.stats.risk >= cfg.RISK.custody) setFlag('custody');
    return S.stats[k] - before;
  }
  // Rendements décroissants de l'Asso : au-dessus de ASSO.diminishFrom, un gain vaut ×(100 − asso) / (100 − diminishFrom)
  function assoGain(v) {
    const from = cfg.ASSO.diminishFrom ?? 100;
    if (v <= 0 || S.stats.asso <= from) return v;
    return v * Math.max(0, (100 - S.stats.asso) / (100 - from));
  }
  function setFlag(f) { if (!S.flags.includes(f)) { S.flags.push(f); flagSet = null; } }
  function addEvidence(e) {
    const legal = e.legal !== false;
    const quality = e.quality ?? 1;
    const value = e.value ?? C.contentEvidenceValue * quality;
    const ev = { id: S.evidence.length + 1, day: S.day, kind: e.kind ?? 'piece', label: e.label ?? e.text ?? '', quality, legal, value, source: e.source };
    S.evidence.push(ev);
    if (legal) setStat('dossier', S.stats.dossier + value);
    c.note('evidence', { evidenceId: ev.id, kind: ev.kind, legal, source: e.source });
    return ev;
  }
  c.apply = apply;

  // Témoins d'une action de jour (abstraits : présence × exposition × déguisement pour les non-alliés)
  function dayWitnesses(w, legality) {
    const by = w.by ?? ['customers', 'waiter'];
    const exposure = w.exposure ?? C.dayWitness[legality] ?? 0.3;
    const disguise = Math.min(1, ...Object.entries(cfg.DISGUISE).filter(([f]) => c.has(f)).map(([, m]) => m));
    const crowd = c.isSaturday() ? cfg.WITNESS.saturdayCover : 1;
    return by.filter((id) => rng.chance(DAY_PRESENCE[id] ?? 0.5))
      .filter((id) => rng.chance(exposure * (ALLIES.has(id) ? 1 : disguise * crowd)))
      .map((id) => ({ id, ally: ALLIES.has(id) }));
  }
  function witnessed(action, seen) {
    if (!seen.length) return;
    for (const w of seen) {
      S.witnessMemories.push({ day: S.day, who: w.id, ally: !!w.ally, act: action.id });
      if (w.id === 'klaas') setFlag('klaas_noted_pilou');
    }
    c.note('witness', { act: action.id, by: seen.map((w) => w.id) });
    apply(action.witnessed?.effects, 'witnessed', action.id);
  }

  // ---------- cartes (événements, dialogues, contre-offensives) ----------
  // Matin (§12b.D) : jour de bureau → le trajet (et parfois une scène au bureau) ; télétravail → une distraction à choix
  // et parfois la visio de Stéphane. Les entrées viennent de src/content/workdays.js.
  function workdayCards() {
    const W = K.WORKDAYS;
    const fresh = (x) => !(x.once && (S.seen.dialogue.includes(x.id) || S.seen.events.includes(x.id)));
    const pick = (list) => (list ?? []).find((x) => fresh(x) && c.check(x.when));
    const lineCard = (x, kind, title) => {
      if (x.once) S.seen.dialogue.push(x.id);
      return { type: 'info', id: `${kind}:${x.id}`, workday: kind, speaker: x.speaker ?? null, title, text: (x.lines ?? []).map((l) => (typeof l === 'string' ? l : l.text)).join(' '), lines: x.lines ?? [], effects: x.effects };
    };
    const out = [];
    if (S.workplace === 'office') {
      const ride = pick(W.commute);
      if (ride) out.push(lineCard(ride, 'commute', 'Le trajet'));
      const scene = rng.chance(C.workdays?.officeSceneChance ?? 0.5) ? pick(W.office) : null;
      if (scene) out.push(lineCard(scene, 'office', 'Chez Koddex'));
    } else {
      const d = (W.home?.distractions ?? []).find((x) => !S.seen.events.includes(x.id) && c.check(x.when));
      if (d) out.push({ type: 'event', id: d.id, workday: 'home' });
      const call = pick(W.home?.calls);
      if (call) out.push(lineCard(call, 'call', 'Visio avec Stéphane'));
    }
    return out;
  }

  function buildCards() {
    const cards = S.phase === 'morning' ? workdayCards() : [];
    const ph = S.phase;
    // Événements fixes du jour, puis aléatoires (sans `day`, avec `when`)
    for (const e of K.EVENTS) {
      if (e.day === undefined || e.day !== S.day || (e.phase ?? 'afternoon') !== ph) continue;
      if (S.seen.events.includes(e.id) || !c.check(e.when)) continue;
      if (ph === 'night' && C.nightEventsAtTime !== false) S.nightEvents.push({ id: e.id, at: e.at ?? C.nightEventAt });
      else cards.push({ type: 'event', id: e.id });
    }
    let random = 0;
    for (const e of K.EVENTS) {
      if (e.day !== undefined || random >= C.randomEventsPerPhase) continue;
      if (![e.phase ?? e.when?.phase ?? 'afternoon'].flat().includes(ph)) continue;
      if (e.once !== false && S.seen.events.includes(e.id)) continue;
      if (!cooled(e) || !c.check(e.when)) continue;
      if (ph === 'night' && C.nightEventsAtTime !== false) S.nightEvents.push({ id: e.id, at: e.at ?? C.nightEventAt });
      else cards.push({ type: 'event', id: e.id });
      random++;
    }
    // Contre-offensives du bloc : l'après-midi par défaut (§3), ou la phase de leur `when` (les e-mails de Tatie
    // arrivent le matin). Plafond par phase.
    let cm = 0;
    for (const m of K.COUNTERMOVES) {
      if (cm >= C.maxCountermovesPerDay) break;
      if (![m.when?.phase ?? 'afternoon'].flat().includes(ph)) continue;
      if (m.once !== false && S.seen.countermoves.includes(m.id)) continue;
      if (!cooled(m) || !c.check(m.when)) continue;
      cards.push({ type: 'countermove', id: m.id });
      cm++;
    }
    // Dialogues (par défaut l'après-midi, ou la phase de leur `when`) : on tire au sort parmi les éligibles, en
    // privilégiant les plus précis (plus de conditions) et les jamais vus, sinon les premiers du fichier monopolisent.
    const precision = (x) => Object.keys(x.when ?? {}).length + (x.when?.flags?.length ?? 0);
    const eligible = K.DIALOGUE.filter((x) => [x.when?.phase ?? 'afternoon'].flat().includes(ph)
      && !(x.once !== false && S.seen.dialogue.includes(x.id)) && cooled(x) && c.check(x.when))
      .map((x) => ({ x, k: precision(x) + rng.next() * 2 + (S.counts.dialogue[x.id] ? -3 : 0) }))
      .sort((a, b) => b.k - a.k);
    for (const { x } of eligible.slice(0, C.maxDialoguesPerPhase)) cards.push({ type: 'dialogue', id: x.id });
    return cards;
  }

  c.card = () => {
    const card = S.cards[0];
    if (!card) return null;
    const src = card.type === 'event' ? EVENTS[card.id] ?? WORK_EVENTS[card.id] : { dialogue: DIALOGUE, countermove: CMS }[card.type]?.[card.id];
    // Contenu disparu entre-temps (sauvegarde ancienne) : on saute la carte plutôt que de planter
    if (!src && card.type !== 'info') {
      S.cards.shift();
      if (!S.cards.length && S.step === 'cards') afterCards();
      return c.card();
    }
    if (card.type === 'info') return { ...card, choices: [{ i: 0, label: 'OK', available: true }] };
    const choices = card.type === 'event' && src.choices?.length
      ? src.choices.map((ch, i) => ({ i, label: ch.label, available: c.check(ch.requires, false) }))
      : [{ i: 0, label: 'OK', available: true }];
    const scene = card.type === 'event' && src.scene && narrative ? narrative.commissionScene(S, src) : undefined;
    return { ...card, data: src, choices, scene };
  };

  // ---------- narration (si narrative.js est fourni) ----------
  c.introCards = () => narrative?.introCards() ?? [];
  // Tutoriel : le moteur mémorise ce qui a été montré (S.seen.tutorial). Renvoie { id, text } ou null.
  c.tutorial = (trigger) => {
    const t = narrative?.tutorialPrompt(trigger, { ...S, seenTutorial: S.seen.tutorial });
    if (t) S.seen.tutorial.push(t.id);
    return t ?? null;
  };
  // Fil du téléphone du jour (non lus). c.readMedia(feed, id) : marque lu et applique ses effets.
  c.mediaFeed = () => {
    const feed = narrative?.mediaFeed(S, S.day, { seen: S.seen.media }) ?? { whatsapp: [], press: [], social: [] };
    // Médias poussés par un twist (after.media) : affichés même hors de leur `when`
    for (const [f, list] of Object.entries(K.MEDIA ?? {})) {
      for (const m of list ?? []) if (S.pushedMedia?.includes(m.id) && !S.seen.media.includes(m.id) && !(feed[f] ?? []).some((x) => x.id === m.id)) (feed[f] ??= []).push(m);
    }
    return feed;
  };
  c.readMedia = (feed, id) => {
    const m = (K.MEDIA?.[feed] ?? []).find((x) => x.id === id);
    if (!m || S.seen.media.includes(id)) return false;
    S.seen.media.push(id);
    (S.counts.media ??= {})[id] = 1;
    c.note('media', { feed, id });
    apply({ ...m.effects, setFlags: [...(m.effects?.setFlags ?? []), ...(m.setFlags ?? [])] }, 'story', id);
    return true;
  };

  // Résolution d'un événement (carte du jour ou événement de nuit) : vu, choix, effets. Renvoie le texte du choix.
  function resolveEvent(e, i) {
    shown(e.id);
    S.seen.events.push(e.id);
    S.counts.events[e.id] = (S.counts.events[e.id] ?? 0) + 1;
    c.note('event', { id: e.id, eventDay: e.day });
    let result = null;
    const ch = e.choices?.[i];
    if (ch) {
      if (!c.check(ch.requires, false)) throw new Error(`choix indisponible : ${e.id}[${i}]`);
      apply(ch.effects, 'story', `${e.id}#${i}`);
      result = ch.result ?? null;
      c.note('choice', { id: e.id, i });
    }
    apply(e.effects, 'story', e.id);
    return result;
  }

  c.resolveCard = (i = 0) => {
    const card = c.card();
    if (!card) return null;
    S.cards.shift();
    let result = null;
    if (card.type === 'event') {
      result = resolveEvent(card.data, i);
    } else if (card.type === 'dialogue') {
      shown(card.id);
      S.seen.dialogue.push(card.id);
      S.counts.dialogue[card.id] = (S.counts.dialogue[card.id] ?? 0) + 1;
      apply(card.data.effects, 'story', card.id);
    } else if (card.type === 'info' && card.effects) {
      apply(card.effects, 'story', card.id); // trajet en vélo (§12b.D) : batterie à plat, etc.
    } else if (card.type === 'countermove') {
      shown(card.id);
      S.seen.countermoves.push(card.id);
      S.counts.countermoves[card.id] = (S.counts.countermoves[card.id] ?? 0) + 1;
      c.note('countermove', { id: card.id });
      apply(card.data.effects, 'story', card.id);
    }
    S.lastCard = { ...card, data: undefined, result };
    // A1 (décision du design) : la campagne se termine juste après la commission du J14, gagnée ou perdue :
    // pas de 14e nuit, fin « normale » (early: false), épilogue et éventuel « retour » de La Bombance.
    if (S.day >= C.days && c.has(C.finalFlag)) { S.cards = []; finalResolution(); return result; }
    checkEarlyEnding();
    if (!S.cards.length && S.step === 'cards') afterCards();
    return result;
  };

  // ---------- phases ----------
  function beginPhase(phase) {
    S.phase = phase;
    c.note('phase', { phase });
    // Outils débloqués (v1.1) : une carte « Nouveau » la première fois, en tête de la phase
    const fresh = U.due(c.ctx(), S.unlocked);
    for (const u of fresh) { S.unlocked.push(u.id); c.note('unlock', { id: u.id }); }
    // Carte « Nouveau » : la charge `unlock` est celle que l'interface affiche (src/ui unlockCard)
    const unlockCards = fresh.map((u) => {
      const card = { id: u.id, title: u.card?.title ?? 'Nouveau', text: u.card?.text ?? '', hint: u.card?.hint ?? null };
      return { type: 'info', id: `unlock:${u.id}`, unlock: card, title: card.title, text: card.text, hint: card.hint };
    });
    // Le twist de la nuit (v1.1) : choisi à l'entrée de la nuit ; l'interface l'annonce sur l'écran de nuit (c.tonightTwist())
    if (phase === 'night') c.twistTonight();
    S.cards = [...unlockCards, ...S.cards.filter((x) => x.type === 'info'), ...buildCards()];
    S.step = 'cards';
    if (!S.cards.length) afterCards();
  }
  function afterCards() {
    if (S.step === 'ended') return;
    if (S.phase === 'morning') {
      // Viré : plus de Koddex, l'après-midi s'allonge
      if (c.has('unemployed')) { S.koddexDone = true; beginPhase('afternoon'); return; }
      S.step = 'koddex';
    } else if (S.phase === 'afternoon') {
      S.timeLeft = C.afternoonTime + (c.has('unemployed') ? C.unemployedBonusTime : 0);
      S.step = 'actions';
    } else {
      S.step = 'night';
    }
  }

  // Début de journée : décroissances lentes, puis cartes du matin
  function beginDay() {
    c.note('day', {});
    S.workplace = S.workplaces?.[S.day - 1] ?? 'office';
    setStat('risk', S.stats.risk - C.riskDecayPerDay);
    // Le soutien s'effrite si on ne le nourrit pas (vers le niveau de départ, pas en dessous)
    if (S.stats.asso > C.start.asso) setStat('asso', Math.max(C.start.asso, S.stats.asso - (C.assoDecayPerDay ?? 0)));
    if (!c.has('unemployed')) setStat('job', S.stats.job - C.jobDecayPerDay);
    S.police.fatigue = Math.max(0, S.police.fatigue - C.policeFatigueDecay);
    updateIgpn();
    S.koddexDone = false;
    beginPhase('morning');
    checkEarlyEnding();
  }

  // ---------- matin : Koddex ----------
  // KODDEX.work : objets { id, label, job, requires, effects, result } (ou chaînes, ancien format) ; 'work' = le premier dispo.
  // KODDEX.gags : { id, speaker, when, once, lines } ; un gag éligible par matin.
  const workItems = () => K.KODDEX.work.map((w, i) => (typeof w === 'string' ? { id: `work_${i}`, label: w } : w));
  const workAvailable = (w) => c.check(w.requires, false) && c.check(w.when, false) && !(w.once && S.seen.actions.includes(w.id)) && cooled(w);
  c.koddexOptions = () => {
    const seenGags = S.seen.gags ?? [];
    // Gags de Clode Kode : ceux du lieu de travail du jour d'abord (§12b.D, WORKDAYS.koddex)
    const gags = [...(K.WORKDAYS.koddex?.[S.workplace] ?? []), ...K.KODDEX.gags].map((g, i) => (typeof g === 'string' ? { id: `gag_${i}`, lines: [g] } : g))
      .filter((g) => !(g.once !== false && seenGags.includes(g.id)) && cooled(g) && c.check(g.when, false));
    return {
      prompts: K.PROMPTS_PER_MORNING ?? C.prompts,
      work: workItems().filter(workAvailable),
      sideProjects: K.KODDEX.sideProjects.map((p) => ({ ...p, available: !(p.unlocks && c.has(p.unlocks)) && c.check(p.requires, false) && c.check(p.when, false) })),
      gag: gags.length ? gags[0] : null,
    };
  };
  c.koddex = (picks) => {
    if (S.step !== 'koddex') throw new Error(`koddex hors du matin (${S.step})`);
    const o = c.koddexOptions();
    if (o.gag) { (S.seen.gags ??= []).push(o.gag.id); shown(o.gag.id); }
    const chosen = picks.slice(0, o.prompts);
    while (chosen.length < o.prompts) chosen.push('work');
    const lines = [];
    // Chaque travail / projet perso au plus une fois par matin : un doublon compte comme un 'work' générique,
    // qui prend le premier travail pas encore utilisé (sinon du travail ordinaire, sans texte répété).
    const used = new Set();
    for (let id of chosen) {
      if (id !== 'work' && used.has(id)) id = 'work';
      if (id === 'work') id = o.work.find((w) => !used.has(w.id) && !chosen.includes(w.id))?.id ?? 'work';
      used.add(id);
      S.counts.koddex[id] = (S.counts.koddex[id] ?? 0) + 1;
      const w = workItems().find((x) => x.id === id);
      if (id === 'work' || w) {
        // Télétravail : la rue à un mètre du clavier, un peu moins de travail fait (§12b.D)
        setStat('job', S.stats.job + (w?.job ?? C.workJob) - (S.workplace === 'home' ? C.workdays?.homeJobPenalty ?? 0 : 0));
        if (w) { shown(w.id); apply(w.effects, 'koddex', w.id); if (w.result) lines.push(w.result); if (w.once) S.seen.actions.push(w.id); }
        c.note('koddex', { id });
        continue;
      }
      const p = K.KODDEX.sideProjects.find((x) => x.id === id);
      if (!p || (p.unlocks && c.has(p.unlocks))) { setStat('job', S.stats.job + C.workJob); continue; }
      setStat('job', S.stats.job + (p.job ?? -10));
      if (p.unlocks) setFlag(p.unlocks);
      apply(p.effects, 'koddex', id);
      c.note('koddex', { id });
      lines.push(...(p.lines ?? []));
      if (p.result) lines.push(p.result);
      // Le risque d'un side project ne compte que si quelqu'un le remarque (Stéphane, un collègue, Clode Kode qui bavarde)
      if (p.risk > 0 && rng.chance(C.sideProjectDiscovery)) {
        c.note('witness', { act: id, by: ['koddex'] });
        const d = setStat('risk', S.stats.risk + p.risk);
        c.note('effects', { cause: 'witnessed', source: id, deltas: { risk: d } });
        setFlag('boss_noticed');
      }
    }
    S.koddexDone = true;
    checkEarlyEnding();
    if (S.step !== 'ended') beginPhase('afternoon');
    return lines;
  };

  // ---------- twists et déblocages (v1.1) ----------
  c.twistTonight = () => {
    if (S.tonightTwist?.day !== S.day) {
      const t = K.TWISTS.length ? pickTwist(K.TWISTS, { ...c.ctx(), phase: 'night' }, (S.twistHistory ?? []).map((x) => x.id), rng) : null;
      S.tonightTwist = { day: S.day, id: t?.id ?? null };
      if (t) c.note('twist', { id: t.id });
    }
    return S.tonightTwist.id ? TWISTS[S.tonightTwist.id] ?? null : null;
  };
  c.tonightTwist = () => c.twistTonight(); // nom utilisé par src/ui

  // ---------- objectifs du soir (§12c.5, src/sim/objectives.js, src/content/objectives.js) ----------
  // c.tonightObjectives() → [{ id, text, stance, info, done }] : choisis à l'entrée de la nuit (2 à 4), cochés au fil de la nuit
  // par c.objectivesTick(sim) (journal + drapeaux) et c.objectiveEvent(nom, charge) (événements du jeu 3D, tutoEvent).
  const POLICE_CFG = cfg.POLICE;
  const onDutyTonight = () => {
    const shift = POLICE_CFG.roster[c.weekday()] ?? POLICE_CFG.roster.mon;
    return [...new Set(shift.map((id) => (id === 'lemaire' && S.police.lemaireTransferred ? 'benali'
      : id === 'benali' && S.police.benaliTransferred ? (S.police.lemaireTransferred ? 'chief' : 'lemaire') : id)))];
  };
  const OBJ = byId(K.OBJECTIVES ?? []);
  const objDone = (id) => S.objectives.done.includes(id);
  const tickObjective = (o) => {
    if (objDone(o.id)) return false;
    S.objectives.done.push(o.id);
    c.note('objective', { id: o.id });
    return true;
  };
  const objList = () => (S.objectives?.ids ?? []).map((id) => OBJ[id]).filter(Boolean);
  c.tonightObjectives = () => {
    if (S.phase === 'night' && S.objectives?.day !== S.day && !c.ended) {
      const orng = createRng((S.seed ^ Math.imul(S.day, 0x9e3779b1)) >>> 0); // à part : n'use pas le hasard de la campagne
      const ctx = {
        check: (cond) => evalCondition(cond, c.ctx(), orng),
        twist: c.twistTonight()?.id ?? null,
        newTools: S.journal.filter((e) => e.type === 'unlock' && e.day === S.day).map((e) => e.id),
        onDuty: onDutyTonight(),
      };
      S.objectives = { day: S.day, ids: pickObjectives(K.OBJECTIVES ?? [], ctx, cfg.RULES.objectives ?? {}).map((o) => o.id), done: [] };
    }
    return objList().map((o) => ({ id: o.id, text: o.text, stance: o.stance, info: !o.done, done: objDone(o.id) }));
  };
  // Un événement du jeu (tutoEvent) : → objectifs cochés à l'instant [{ id, text }]
  c.objectiveEvent = (name, payload = {}) => {
    if (!S.objectives || S.objectives.day !== S.day) return [];
    const ev = { ...payload, name };
    return objList().filter((o) => o.done && !o.done.flag && matchDone(o.done, ev) && tickObjective(o)).map((o) => ({ id: o.id, text: o.text }));
  };
  // La nuit (journal depuis le dernier passage) et les drapeaux : → objectifs cochés à l'instant
  c.objectivesTick = (sim) => {
    if (!S.objectives || S.objectives.day !== S.day) return [];
    const { events, cursor } = journalEvents(sim, sim.objectivesCursor ?? 0);
    sim.objectivesCursor = cursor;
    const out = events.flatMap((ev) => c.objectiveEvent(ev.name, ev));
    for (const o of objList()) if (o.done?.flag && c.has(o.done.flag) && tickObjective(o)) out.push({ id: o.id, text: o.text });
    return out;
  };
  // Conseil « au lit » (§12c.5) : { id, why, text } ou null ; busy = nightClock.busyReason (rien d'imminent)
  c.bedtimeHint = (sim, { busy = null } = {}) => bedtimeHint(sim, {
    objectives: c.tonightObjectives(), busy, hints: K.BEDTIME ?? [], mem: (sim.bedtimeMemory ??= {}),
  });

  // ---------- tutoriels pratiques des outils de nuit (v1.1, §12b.B, src/content/tutorials.js) ----------
  // trigger : { night: n, after?, where? } (la n-ième nuit jouée) ou { unlock: id, after?, where? } (dès que l'outil est acquis).
  // Le jeu (game.js) affiche la marque, appelle tutorialSeen à la 1re apparition (l'horloge se fige quelques secondes),
  // puis tutorialEvent(nom) à chaque geste du joueur : l'étape dont `done` correspond avance ; la dernière termine le tutoriel.
  const T8 = () => (S.tutorials ??= { seen: [], done: [], step: {} });
  c.toolTutorialDue = ({ min, where } = {}) => {
    const t = T8();
    const night = S.nightCount + 1;
    return K.TOOL_TUTORIALS.find((x) => {
      if (t.done.includes(x.id)) return false;
      const g = x.trigger ?? {};
      if (g.night !== undefined && g.night !== night) return false;
      if (g.unlock && !S.unlocked.includes(g.unlock)) return false;
      if (g.after !== undefined && min !== undefined && min < g.after) return false;
      if (g.where && where && g.where !== where) return false;
      return true;
    }) ?? null;
  };
  c.tutorialSeen = (id) => { const t = T8(); if (t.seen.includes(id)) return false; t.seen.push(id); c.note('tutorial', { id, seen: true }); return true; };
  c.tutorialStep = (id) => T8().step[id] ?? 0;
  c.tutorialSkip = (id) => { const t = T8(); if (!t.done.includes(id)) { t.done.push(id); c.note('tutorial', { id, skipped: true }); } };
  // → les tutoriels terminés par ce geste (pour le « bravo »)
  c.tutorialEvent = (name) => {
    const t = T8();
    const finished = [];
    for (const x of K.TOOL_TUTORIALS) {
      if (!t.seen.includes(x.id) || t.done.includes(x.id)) continue;
      const k = t.step[x.id] ?? 0;
      if (x.steps?.[k]?.done !== name) continue;
      t.step[x.id] = k + 1;
      if (t.step[x.id] >= (x.steps?.length ?? 0)) { t.done.push(x.id); finished.push(x); c.note('tutorial', { id: x.id, done: true }); }
    }
    return finished;
  };
  const opportunities = (sim) => sim?.twist?.sim?.opportunities ?? [];
  c.actionAllowed = (id, sim) => U.action(id, S.unlocked, opportunities(sim));
  c.keyAllowed = (key, sim) => {
    const opp = opportunities(sim);
    const viaOpp = K.UNLOCKS.filter((u) => (u.unlocks?.actions ?? []).some((a) => opp.includes(a))).flatMap((u) => (u.unlocks?.keys ?? []).map((k) => k.toUpperCase()));
    return U.key(key, S.unlocked, viaOpp);
  };
  // Verbe natif de la nuit (photo, db, police…) : verrouillé si toutes les actions du contenu qui le portent le sont
  // Verbes natifs portés par une touche (db ↔ B) : la touche verrouillée verrouille aussi le verbe (joueur et bots)
  const NATIVE_KEYS = { db: 'B' };
  c.nativeAllowed = (type, { asso = false } = {}, sim) => {
    if (NATIVE_KEYS[type] && !c.keyAllowed(NATIVE_KEYS[type], sim)) return false;
    const carriers = K.ACTIONS.filter((a) => a.sim === type && (type !== 'police' || !!(a.simArgs?.asso ?? /asso/.test(a.id)) === !!asso));
    return !carriers.length || carriers.some((a) => c.actionAllowed(a.id, sim));
  };

  // ---------- après-midi : actions ----------
  const usable = (a, phase, sim) => (a.phase ?? 'afternoon') === phase
    && !(a.once && S.seen.actions.includes(a.id))
    && c.actionAllowed(a.id, sim)
    && c.check(a.requires, false);
  // Bot WhatsApp (proj_whatsapp_bot) : la mobilisation coûte un créneau de moins (minimum 1) et rapporte plus d'Asso
  const botHelps = (a) => c.has('proj_whatsapp_bot') && C.whatsappBot.actions.includes(a.id);
  c.actionCost = (a) => { const t = a.cost?.time ?? 1; return botHelps(a) ? Math.max(1, t - C.whatsappBot.timeDiscount) : t; };
  c.availableActions = (phase = 'afternoon') => K.ACTIONS.filter((a) => usable(a, phase) && (phase !== 'afternoon' || c.actionCost(a) <= S.timeLeft));
  c.doAction = (id) => {
    if (S.step !== 'actions') throw new Error(`action hors de l’après-midi (${S.step})`);
    const a = ACTIONS[id];
    if (!a || !usable(a, 'afternoon')) throw new Error(`action indisponible : ${id}`);
    const cost = c.actionCost(a);
    if (cost > S.timeLeft) throw new Error(`plus assez de temps pour ${id}`);
    S.timeLeft -= cost;
    S.seen.actions.push(a.id);
    S.counts.actions[a.id] = (S.counts.actions[a.id] ?? 0) + 1;
    c.note('action', { id: a.id, legality: a.legality });
    // Un Risque écrit dans `effects` est une exposition : il ne compte que si l'acte est remarqué (§4, §13.G)
    const { risk: exposedRisk = 0, ...effects } = a.effects ?? {};
    apply(effects, 'action', a.id);
    if (botHelps(a)) apply({ asso: C.whatsappBot.assoBonus }, 'engine', 'proj_whatsapp_bot'); // bonus de config : pas remis à l'échelle du contenu
    let seen = [];
    if (a.witnessed || exposedRisk > 0) {
      seen = dayWitnesses(a.witnessed ?? {}, a.legality);
      witnessed(a, seen);
      if (seen.length && exposedRisk > 0) apply({ risk: exposedRisk }, 'witnessed', a.id);
    }
    checkEarlyEnding();
    return { result: a.result ?? null, seen };
  };
  c.endAfternoon = () => {
    if (S.step !== 'actions') throw new Error(`fin d’après-midi hors de l’après-midi (${S.step})`);
    // Tatie hésite (flattée par le bloc) : elle peut laisser fuiter le vrai plan à Colette
    const L = C.tatieLeak;
    if (L && c.has(L.flag) && !c.has('tatie_leaked_plan') && S.hidden.hostility >= L.minHostility && rng.chance(L.chance)) {
      setFlag('tatie_leaked_plan');
      c.note('engine-flag', { flag: 'tatie_leaked_plan' });
      S.cards.push({ type: 'info', id: 'tatie_leak', title: 'Fuite', text: 'Tatie Bouchon a pris le thé avec Colette Verhaeghe. Le bloc connaît vos plans.' });
    }
    beginPhase('night');
  };

  // ---------- nuit ----------
  function enemyMemories() { return S.witnessMemories.filter((m) => !m.ally && S.day - m.day <= 7).length; }
  c.createNight = ({ narrator } = {}) => {
    if (S.step !== 'night') throw new Error(`nuit hors de la nuit (${S.step})`);
    const reversal = S.hidden.hostility >= C.reversal.minHostility && rng.chance(C.reversal.chance);
    const sim = createSim({
      seed: rng.int(1, 2 ** 31 - 2),
      day: c.isSaturday() ? 'sat' : 'mon',
      weekday: c.weekday(),
      cfg,
      carry: {
        asso: S.stats.asso, risk: S.stats.risk, hostility: S.hidden.hostility, corruption: S.hidden.corruption,
        calls: S.police.fatigue, serialComplainer: S.police.serialComplainer,
        benaliTransferred: S.police.benaliTransferred, lemaireTransferred: S.police.lemaireTransferred,
        flags: S.flags, earlyEndings: c.gateOpen(), reversal, enemyMemories: enemyMemories(), sleepEndsNight: false,
        // la drache du soir (événement r_drache tiré ce jour-là) : la sim fait pleuvoir et vider les terrasses
        weather: S.journal.some((e) => e.day === S.day && e.type === 'event' && e.id === 'r_drache') ? 'drache' : undefined,
        pacing: S.pacingMemory ?? undefined, // pacing.js : lignes de la nuit précédente, micro-moments déjà joués
      },
      narrator,
      twist: nightTwist(c.twistTonight()),
    });
    sim.campaignDay = S.day;
    sim.contentActions = [];
    if (c.has('proj_db_logger')) autoDbLogger(sim);
    c.note('night-start', { reversal });
    c.tonightObjectives(); // §12c.5 : choisis au plus tard à l'entrée de la nuit
    return sim;
  };
  // Démon Rust de relevé (proj_db_logger) : à chaque pas de la nuit, un relevé horodaté à la fenêtre de Pilou
  // toutes les C.dbLogger.every minutes après 22h, s'il y a tapage (même seuil que le relevé manuel). Preuve passive.
  function autoDbLogger(sim) {
    const { EVIDENCE, SLEEP, ANCHORS } = sim.cfg;
    const tick = sim.tick;
    let next = SLEEP.drainAfter;
    sim.tick = (dMin) => {
      tick(dMin);
      const N = sim.state;
      if (N.ended || N.min < next) return;
      next = N.min + C.dbLogger.every;
      const db = Math.round(sim.noiseAt(ANCHORS.pilouWindow, false));
      if (db < EVIDENCE.dbThreshold) return;
      sim.addEvidence({
        type: 'db', kind: 'db', auto: true, restId: null, quality: C.dbLogger.quality, db,
        value: sim.pieceValue(null, 'db', EVIDENCE.dbValue) * C.dbLogger.valueScale,
        text: `Démon Rust : ${db} dB à ${fmt(N.min)}, fenêtre de Pilou (relevé automatique)`,
      });
    };
  }
  c.nightActions = (sim) => K.ACTIONS.filter((a) => (a.phase ?? 'afternoon') === 'night' && !a.sim && usable(a, 'night', sim) && !sim.contentActions.includes(a.id));
  // Action de nuit du contenu (hors actions natives de la sim) : lieu, créneau, témoins, effets → nightActions.js
  // (même chemin pour le joueur, les bots et le simulateur ; `player` facultatif : sans lui, le lieu n'est pas vérifié)
  c.doNightAction = (sim, id, player) => performNightAction(sim, c, id, player);

  // Fin de nuit : on rapatrie stats, preuves, police, témoins ; drapeaux moteur ; fins anticipées.
  // ---------- événements de nuit (à leur heure, pendant la nuit 3D) ----------
  // c.nightEventDue(sim) → carte { type: 'event', id, data, choices, at } dès que l'horloge atteint `at`, sinon null.
  // c.resolveNightEvent(sim, i) → texte du choix ; l'effet `simEffect` du contenu agit sur la nuit (ex. 'rain').
  // Un événement dont l'heure n'arrive pas (fin de nuit avant) est abandonné à la fin de la nuit.
  c.nightEventDue = (sim) => {
    if (S.step !== 'night' || sim.state.ended) return null;
    const n = S.nightEvents.filter((x) => !x.done && sim.state.min >= x.at).sort((a, b) => a.at - b.at)[0];
    if (!n) return null;
    const e = EVENTS[n.id];
    const choices = (e.choices?.length ? e.choices : [{ label: 'OK' }]).map((ch, i) => ({ i, label: ch.label, available: c.check(ch.requires, false) }));
    return { type: 'event', id: e.id, data: e, choices, at: n.at };
  };
  c.resolveNightEvent = (sim, i = 0) => {
    const card = c.nightEventDue(sim);
    if (!card) return null;
    S.nightEvents.find((x) => x.id === card.id && !x.done).done = true;
    const result = resolveEvent(card.data, i);
    if (card.data.simEffect && NIGHT_EVENT_EFFECTS[card.data.simEffect]) NIGHT_EVENT_EFFECTS[card.data.simEffect](sim);
    sim.note('night-event', { id: card.id, i });
    return result;
  };
  const NIGHT_EVENT_EFFECTS = {
    // La drache : toutes les terrasses rentrent en quatre minutes, les buveurs debout s'abritent, rien ne ressort ce soir
    rain(sim) {
      const N = sim.state;
      const out = N.tables.filter((t) => t.out);
      out.forEach((t, k) => { t.clearAt = N.min + 0.5 + (4 * k) / Math.max(1, out.length); t.pendingBy = 'rain'; });
      for (const t of N.tables) if (t.hiddenUntil !== null && !t.out) t.hiddenUntil = null;
      for (const g of N.standing ?? []) if (g.leaveAt > N.min) g.leaveAt = N.min + 2;
      N.rained = true;
    },
  };

  c.finishNight = (sim) => {
    if (S.step !== 'night') throw new Error(`fin de nuit hors de la nuit (${S.step})`);
    const N = sim.state;
    c.objectivesTick(sim); // §12c.5 : ce qui s'est fait cette nuit, même sans le jeu 3D (bots, nuit passée)
    S.nightEvents = [];
    S.nightCount++;
    S.pacingMemory = sim.pacing?.memory() ?? S.pacingMemory ?? null;
    const sleepDelta = (N.sleep - C.sleepNeutral) * C.sleepCarry;
    setStat('sleep', S.stats.sleep + sleepDelta);
    setStat('asso', S.stats.asso + assoGain(N.asso - S.stats.asso));
    const riskBefore = S.stats.risk;
    setStat('risk', N.risk);
    if (S.stats.risk > riskBefore) c.note('effects', { cause: 'witnessed', source: 'nuit', deltas: { risk: S.stats.risk - riskBefore }, nightRisk: N.journal.filter((e) => e.type === 'risk').length });
    S.hidden.hostility = clamp(N.hostility, 0, 100);
    S.police.fatigue = N.calls;
    S.police.serialComplainer = N.serialComplainer;
    S.police.benaliTransferred = N.benaliTransferred;
    // Preuves de la nuit → dossier (légales) ou dossier presse/IGPN (illégales)
    let gained = 0;
    for (const e of N.evidence) {
      const value = e.value * C.nightEvidenceScale; // l'illégal garde sa valeur pour la presse, mais pas au dossier
      const ev = { id: S.evidence.length + 1, day: S.day, kind: e.kind ?? e.type, label: e.text, quality: e.quality, legal: e.legal, value, source: `nuit:${e.id}`, nightType: e.type };
      S.evidence.push(ev);
      c.note('evidence', { evidenceId: ev.id, kind: ev.kind, legal: ev.legal, source: ev.source, night: true });
      if (e.legal) gained += value;
    }
    setStat('dossier', S.stats.dossier + gained);
    for (const m of N.witnessMemories) S.witnessMemories.push({ day: S.day, who: m.who, ally: m.ally, act: m.act, filmed: m.filmed });
    // Drapeaux posés par le moteur (premier bloc de src/content/flags.js)
    const J = N.journal;
    const evk = (k) => N.evidence.some((e) => e.kind === k || e.type === k);
    const engineFlags = {
      night_photo: N.evidence.some((e) => e.type === 'photo'),
      night_db: evk('db'),
      corridor_measured: evk('corridor'),
      called_police: J.some((e) => e.type === 'call'),
      called_as_asso: J.some((e) => e.type === 'call' && e.asso),
      seen_complaisance: evk('complaisance'),
      seen_tipoff: evk('tipoff'),
      serial_caller: N.serialComplainer,
      benali_fined: N.policeLog.some((p) => p.patrolId === 'benali' && p.outcome === 'act'),
      benali_transferred: N.benaliTransferred,
      chief_came: N.policeLog.some((p) => p.patrolId === 'chief'),
      saw_pee: evk('pee'),
      pee_at_door: N.pees.some((p) => p.doorway.pilou),
      bucket_used: N.bucketUses > 0,
      bucket_witnessed: N.witnessMemories.some((w) => w.act === 'seau d’eau'),
      video_viral: N.witnessMemories.some((w) => w.filmed),
      klaas_noted_pilou: N.witnessMemories.some((w) => w.kind === 'klaas'),
      talked_waiter: N.waiterAsks.length > 0,
      bribe_photo: N.evidence.some((e) => e.kind === 'bribe' && e.legal),
      bribe_photo_illegal: N.evidence.some((e) => e.kind === 'bribe' && !e.legal),
    };
    for (const [f, on] of Object.entries(engineFlags)) if (on) setFlag(f);
    // Preuve de corruption : l'enveloppe, ou (complaisance + tuyau) au carnet de Klaas
    const klaasPolice = S.evidence.filter((e) => ['complaisance', 'tipoff'].includes(e.nightType));
    if (engineFlags.bribe_photo || engineFlags.bribe_photo_illegal || (klaasPolice.some((e) => e.nightType === 'tipoff') && klaasPolice.some((e) => e.nightType === 'complaisance'))) setFlag('corruption_proof');
    // Chaîne IGPN : un pot-de-vin documenté et transmis (mairie, ou partagé → presse) ouvre l'enquête
    const bribeSent = N.evidence.some((e) => e.kind === 'bribe' && (e.shared || !e.legal));
    if (bribeSent && !S.igpn) {
      S.igpn = { openedDay: S.day };
      setFlag('inquiry_open');
      apply({ corruption: C.igpn.openCorruption }, 'engine', 'inquiry');
    }
    // Contenu : actions natives de la sim (sim: 'photo' | 'db' | 'police' | …) → effets en bonus, une fois par nuit,
    // seulement si l'action a vraiment abouti. Police : `simArgs.asso` (ou un id contenant "asso") distingue l'appel « pour l'Association ».
    const calls = J.filter((e) => e.type === 'call');
    const done = {
      photo: N.evidence.some((e) => e.type === 'photo'),
      db: evk('db'),
      'police:plain': calls.some((e) => !e.asso),
      'police:asso': calls.some((e) => e.asso),
      waiter: N.waiterAsks.length > 0,
      asso: J.some((e) => e.type === 'action' && e.action === 'asso'),
      mairie: N.mairieSent,
      bucket: N.bucketUses > 0,
      sleep: J.some((e) => e.type === 'action' && e.action === 'sleep'),
    };
    const nativeKey = (a) => (a.sim === 'police' ? `police:${(a.simArgs?.asso ?? /asso/.test(a.id)) ? 'asso' : 'plain'}` : a.sim);
    for (const a of K.ACTIONS) {
      if (!a.sim || !done[nativeKey(a)] || !usable(a, a.phase ?? 'night')) continue;
      apply(a.effects, 'action', a.id);
      S.counts.actions[a.id] = (S.counts.actions[a.id] ?? 0) + 1;
    }
    const summary = sim.summary();
    S.nights.push({ day: S.day, reason: N.endReason, sleep: Math.round(N.sleep), risk: Math.round(N.risk), evidence: N.evidence.length, gained: Math.round(gained * 10) / 10, police: summary.police.length, witnesses: N.witnessMemories.length });
    S.lastNight = summary;
    S.lastHeadline = narrative ? narrative.recapHeadline(summary, sim.state) : null;
    // Twist joué : historique (jamais deux fois) et conséquences les jours suivants (after)
    if (sim.twist) {
      const t = TWISTS[sim.twist.id];
      S.twistHistory.push({ day: S.day, id: sim.twist.id });
      if (t?.after) {
        apply({ setFlags: t.after.setFlags, clearFlags: t.after.clearFlags }, 'story', `twist:${t.id}`);
        for (const m of t.after.media ?? []) if (!S.pushedMedia.includes(m)) S.pushedMedia.push(m);
      }
    }
    c.note('night-end', { reason: N.endReason, evidence: N.evidence.length });
    if (c.isSaturday()) setFlag(S.day === 6 ? 'saturday1_done' : 'saturday2_done');
    if (N.endReason === 'custody' && c.gateOpen()) { setFlag('custody'); S.pendingEnding = S.pendingEnding ?? 'custody'; }
    if (N.endReason === 'sleep' && c.gateOpen()) S.pendingEnding = S.pendingEnding ?? 'moving_out';
    checkEarlyEnding();
    if (S.step === 'ended') return summary;
    S.step = 'recap';
    return summary;
  };

  function updateIgpn() {
    if (!S.igpn || S.igpn.transferred) return;
    if (S.day - S.igpn.openedDay >= C.igpn.transferAfterDays) {
      S.igpn.transferred = S.day;
      S.police.lemaireTransferred = true;
      setFlag('lemaire_transferred');
      apply({ corruption: C.igpn.transferCorruption }, 'engine', 'inquiry');
      S.cards.push({ type: 'info', id: 'inquiry', title: 'Enquête interne', text: 'L’enquête interne est bouclée : le brigadier Lemaire est muté. Au commissariat, on regarde ses chaussures.' });
    }
  }

  c.nextDay = () => {
    if (S.step !== 'recap') throw new Error(`jour suivant hors du récap (${S.step})`);
    if (S.day >= C.days) return finalResolution();
    S.day++;
    beginDay();
  };

  // ---------- fins ----------
  const isEarly = (e) => e.early || C.earlyEndings.includes(e.id);
  const matches = (e) => c.check(e.when, false) && (!e.whenAny || e.whenAny.some((w) => c.check(w, false)));
  function checkEarlyEnding() {
    if (S.step === 'ended' || !c.gateOpen()) return;
    // Une fin anticipée s'applique si sa condition est vraie (ou si un effet l'a demandée)
    const cands = K.ENDINGS.filter((e) => isEarly(e) && (matches(e) || S.pendingEnding === e.id));
    if (!cands.length) return;
    const e = cands.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))[0];
    if (e.continue && c.has('unemployed')) return; // déjà choisi de continuer
    endWith(e, 'early');
  }
  function finalResolution() {
    // La commission du jour 14 a eu lieu (événement du contenu) : on prend la fin de plus haute priorité qui colle.
    const cands = K.ENDINGS.filter((e) => matches(e) || S.pendingEnding === e.id);
    const fallback = [...K.ENDINGS].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0))[0];
    const e = cands.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))[0] ?? fallback;
    if (!e) { S.step = 'ended'; S.ending = { id: 'none', title: 'Fin', early: false }; return S.ending; }
    return endWith(e, 'final');
  }
  function endWith(e, how) {
    S.resumeStep = S.step;
    S.ending = { id: e.id, title: e.title, early: how === 'early', day: S.day, canContinue: !!e.continue && !c.has('unemployed'), continueLabel: e.continue?.label };
    S.epilogue = (e.epilogue ?? []).filter((p) => c.check(p.when, false)).map((p) => fill(p.text));
    S.endingMedia = narrative ? { front: narrative.mediaEnding(e.id, S), feed: narrative.mediaEndingFeed(e.id, S) } : null;
    S.counts.endings = { [e.id]: 1 };
    c.note('ending', { id: e.id, early: how === 'early' });
    S.step = 'ended';
    return S.ending;
  }
  // Fin "virée" avec rebond : on continue au chômage, à plein temps dans la lutte
  c.continueAfterEnding = () => {
    const e = ENDINGS[S.ending?.id];
    if (!S.ending?.canContinue || !e?.continue) return false;
    apply(e.continue.effects, 'story', `${e.id}:continue`);
    setFlag('unemployed');
    c.note('continue', { id: e.id });
    S.ending = null;
    S.epilogue = [];
    S.pendingEnding = null;
    // On reprend là où la fin nous avait arrêtés ; plus de Koddex le matin
    S.step = S.resumeStep ?? 'recap';
    if (S.step === 'koddex' || (S.step === 'cards' && !S.cards.length)) { S.step = 'cards'; afterCards(); }
    return true;
  };

  // Variables d'épilogue : {dossier}, {asso}, {risk}, {sleep}, {job}, {pieces}, {nights}, {best}, {calls}, {buckets}
  function fill(text) {
    const best = [...S.evidence].filter((e) => e.legal).sort((a, b) => b.value - a.value)[0];
    const vars = {
      ...Object.fromEntries(STAT_KEYS.map((k) => [k, Math.round(S.stats[k])])),
      pieces: S.evidence.length, nights: S.nightCount, best: best?.label ?? 'rien de bien solide',
      calls: S.journal.filter((e) => e.type === 'night-end').length, buckets: S.flags.includes('bucket_used') ? 'oui' : 'non',
    };
    return String(text).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
  }

  // ---------- démarrage ----------
  if (!save) beginDay();
  else if (S.step === 'cards' && !S.cards.length) afterCards(); // cartes toutes retirées par le nettoyage
  return c;
}
