// Actions de nuit du contenu (src/content/actions.js, phase 'night', sans champ `sim`) jouées dans la nuit 3D.
// Pur, sans DOM, seedé (sim.rng). Owner : design/content agent. Le moteur et l'UI n'appellent que :
//   availableNightActions(sim, c, player)   → liste stable pour le menu (N), avec raisons grisées
//   performNightAction(sim, c, id, player)  → joue l'action (coût, témoins, effets, journal, crochet art)
// `c` = la campagne (createCampaign) ; `sim` = la nuit (c.createNight()) ; `player` = où est Pilou (voir LIEUX).
// Sans `player` (bots, tests sans 3D) le lieu n'est pas vérifié : le bot « est » là où l'action a du sens (v0.2).
//
// Règle d'écriture : un acte illégal n'est qu'un libellé, une conséquence et un crochet visuel. Aucun mode d'emploi.

import { attentionFactor, divertAttention } from './witness.js';
import { smokeSpot, aroundCorner } from './schedule.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const H = (h, m = 0) => h * 60 + m; // 1h30 du matin = H(25, 30)
const END = Infinity; // jusqu'à la fin de la nuit (RULES.nightEnd, 02h30 depuis §12d.4)

// ════════════════════════════════════════════════════════════════════════════
// LIEUX : où l'acte a lieu (position pour les témoins) et où Pilou doit se trouver.
// player = { where: 'apartment' | 'window' | 'street', pos?: { x, z } } (main.js : player.loc, nearWindow(), position caméra)
//   window       à la fenêtre de Pilou (ANCHORS.pilouWindow)                       ← player.where === 'window'
//   apartment    chez Pilou, n'importe où (téléphone, ordinateur)                   ← 'apartment' ou 'window'
//   street       dans la rue, n'importe où ; l'acte a lieu là où il est               ← 'street'
//   terrace      au bord de la terrasse de l'estaminet (≤ 8 m de son centre)        ← 'street'
//   awning       sous le store de l'estaminet (≤ 3 m du store)                      ← 'street'
//   kitchen_door porte de service de l'estaminet, côté rue de la Barre (≤ 3 m)       ← 'street'
//   estaminet    à l'intérieur (on entre par la porte, ≤ 4 m)                       ← 'street'
// Positions dérivées de config (RESTAURANTS.bernadette, STREET, ANCHORS) : elles suivent si la rue bouge.
// ════════════════════════════════════════════════════════════════════════════
const bern = (sim) => sim.rest('bernadette');
const wallX = (sim) => bern(sim).side * sim.cfg.STREET.halfWidth;

export const LOCATIONS = {
  window: { label: 'à la fenêtre', pos: (sim) => sim.cfg.ANCHORS.pilouWindow, player: ['window'] },
  apartment: { label: 'chez vous', pos: (sim) => sim.cfg.ANCHORS.pilouWindow, player: ['apartment', 'window'], indoor: true },
  street: { label: 'dans la rue', pos: (sim, p) => (p?.pos ? { x: p.pos.x, y: 1.2, z: p.pos.z } : { ...sim.cfg.ANCHORS.streetDoor, y: 1.2 }), player: ['street'] },
  terrace: { label: 'près de la terrasse', pos: (sim) => sim.restCenter(bern(sim)), player: ['street'], range: 8 },
  awning: { label: 'sous le store', pos: (sim) => ({ x: wallX(sim) * 0.8, y: 2.6, z: (bern(sim).z0 + bern(sim).z1) / 2 }), player: ['street'], range: 3 },
  kitchen_door: { label: 'à la porte de service', pos: (sim) => ({ x: wallX(sim), y: 1, z: bern(sim).z0 + 0.5 }), player: ['street'], range: 3 },
  // §12e.7 : la pause cigarette du serveur, au coin de la rue de la Barre (hors de vue de la terrasse)
  smoke: { label: 'au coin, à la pause du serveur', pos: (sim) => ({ ...smokeSpot(sim.cfg), y: 1.2 }), player: ['street'], range: 3 },
  estaminet: { label: "à l’estaminet", pos: (sim) => ({ x: wallX(sim), y: 1, z: (bern(sim).z0 + bern(sim).z1) / 2 }), player: ['street'], range: 4 },
};

// ════════════════════════════════════════════════════════════════════════════
// FICHES : pour chaque action de nuit du contenu, lieu, créneau, condition de scène et crochets.
//   at       : un des LIEUX
//   window   : [début, fin] en minutes depuis minuit (nuit : 20h30 → 2h30 ; END = jusqu'à la fin de la nuit)
//   needs    : condition de scène (voir SCENE) · repeat : rejouable dans la même nuit
//   art      : crochets 3D émis tels quels (sim event { type: 'art', ... }) :
//              fx : 'splash'|'smoke'|'stink'|'exhaustBlocked'|'puddle'|'barkPuff' (art.fx.*)
//              prop : 'gadget'|'cardboard'|'line'|… (art.props.place) · terrace : 'rush'|'collapse'|'parasols'|'film'
//              anim : [qui, état] (art.anim.play)
//   simEffect: effet mécanique dans la nuit (voir SIM_EFFECTS)
// Une action de nuit du contenu sans fiche reste jouable : lieu 'street', toute la nuit, sans crochet.
// ════════════════════════════════════════════════════════════════════════════
export const NIGHT_ACTION_SPECS = {
  night_ronde_jeremie: { at: 'street', window: [H(21, 30), H(22, 30)], needs: 'roundTonight', art: { anim: ['jeremie', 'walk'] } },
  night_camera_window: { at: 'window', window: [H(20, 30), END], art: { prop: 'gadget' } },
  night_film_faces: { at: 'street', window: [H(20, 30), H(25)], needs: 'terraceOut', repeat: true, art: { terrace: 'film' } },
  night_flood_police: { at: 'apartment', window: [H(20, 30), H(25)] },
  night_camera_awning: { at: 'awning', window: [H(21, 30), END], art: { prop: 'gadget' } },
  night_borrow_power: { at: 'awning', window: [H(21, 30), END], art: { prop: 'line' } },
  night_wifi: { at: 'apartment', window: [H(20, 30), END] },
  night_cardboard_exhaust: { at: 'window', window: [H(20, 30), H(23, 30)], needs: 'exhaustOn', art: { prop: 'cardboard', fx: 'exhaustBlocked' }, simEffect: 'exhaustBlocked' },
  night_stink_bomb: { at: 'terrace', window: [H(20, 30), H(25)], needs: 'terraceOut', repeat: true, art: { fx: 'stink', terrace: 'rush' }, simEffect: 'clearBernadette' },
  night_saboter_cuisine: { at: 'kitchen_door', window: [H(20, 30), H(23)], needs: 'kitchenOpen', art: { fx: 'smoke' } },
  night_laxatif_carbonnade: { at: 'kitchen_door', window: [H(20, 30), H(23)], needs: 'kitchenOpen', art: { terrace: 'rush' } },
  night_sabotage_chairs: { at: 'terrace', window: [H(23, 30), END], art: { terrace: 'collapse' } },
  night_sabotage_parasols: { at: 'terrace', window: [H(23, 30), END], art: { terrace: 'parasols' } },
  night_sabotage_locks: { at: 'terrace', window: [H(24), END] },
  night_bribe_waiter: { at: 'smoke', window: [H(21, 12), H(24, 38)], needs: 'waiterOnBreak', art: { anim: ['serveur', 'give'] } }, // §12e.7 : à sa pause, hors de vue
  night_backroom_photo: { at: 'estaminet', window: [H(20, 30), H(24, 30)], needs: 'policeOnsite', art: { anim: ['dede', 'give'] } },
  night_bribe_photo_window: { at: 'window', window: [H(20, 30), H(24, 30)], needs: 'policeOnsite' }, // pas d'enveloppe sans patrouille
  night_eat_carbonnade_1: { at: 'estaminet', window: [H(20, 30), H(22, 30)], needs: 'kitchenOpen', art: { anim: ['pilou', 'eat'] } },
  night_eat_carbonnade_2: { at: 'estaminet', window: [H(20, 30), H(22, 30)], needs: 'kitchenOpen', art: { anim: ['pilou', 'eat'] } },
  night_eat_carbonnade_3: { at: 'estaminet', window: [H(20, 30), H(22, 30)], needs: 'kitchenOpen', art: { anim: ['pilou', 'eat'] } },
  // §12d : diversions (sans fiche = dans la rue, toute la nuit) et déguisements (au portemanteau du couloir)
  night_firecracker: { at: 'street', window: [H(21), H(26)], repeat: true },
  night_call_landline: { at: 'street', window: [H(20, 30), H(24)], needs: 'waiterOnDuty', repeat: true },
  night_fake_alert: { at: 'street', window: [H(20, 30), H(24, 30)], repeat: true },
  night_wrong_pizza: { at: 'street', window: [H(20, 30), H(24)], needs: 'terraceOut', repeat: true },
  night_biloute_bark: { at: 'street', window: [H(21, 30), H(23)], needs: 'roundTonight', repeat: true, art: { fx: 'barkPuff' } },
  night_ally_seb_nico: { at: 'street', window: [H(20, 30), H(24, 30)], repeat: true },
  night_ally_tatie: { at: 'street', window: [H(20, 30), H(24)], repeat: true },
  night_ally_jeremie: { at: 'street', window: [H(21, 30), H(23)], needs: 'roundTonight', repeat: true },
  night_owner_delivery_call: { at: 'street', window: [H(20, 30), H(24)], repeat: true },
  night_owner_hygiene_rumour: { at: 'street', window: [H(20, 30), H(23)], needs: 'kitchenOpen', repeat: true },
  night_disguise: { at: 'apartment', window: [H(20, 30), H(26, 30)] },
  night_disguise_vest: { at: 'apartment', window: [H(20, 30), H(26, 30)] },
};

// Conditions de scène (état de la nuit) + raison affichée quand elle manque
export const SCENE = {
  terraceOut: { test: (sim) => sim.state.tables.some((t) => t.out && t.restId === 'bernadette'), reason: "La terrasse de l’estaminet est vide." },
  exhaustOn: { test: (sim) => sim.state.min < sim.cfg.NOISE.exhaustOffMinute, reason: 'La gaine est arrêtée.' },
  kitchenOpen: { test: (sim) => sim.state.min < H(23), reason: 'La cuisine est fermée.' },
  waiterOnDuty: { test: (sim) => sim.waiterOnDuty(), reason: 'Le serveur est parti.' },
  waiterOnBreak: { test: (sim) => sim.waiterOnBreak(), reason: 'Le serveur est en service : attendez sa pause cigarette.' },
  policeOnsite: { test: (sim) => sim.state.police?.phase === 'onsite', reason: 'Aucune patrouille sur place.' },
  roundTonight: { test: (sim) => !sim.state.dogOff, reason: 'Pas de ronde ce soir : Biloute a disparu.' }, // twist lost_dog (dog: false)
};

// Effets mécaniques sur la nuit (sim). Ils passent par les fonctions de la sim (journal + invariants respectés).
export const SIM_EFFECTS = {
  // La terrasse se vide (boule puante) : tables rentrées, comme un rangement, sans retour possible
  clearBernadette(sim) {
    const out = sim.state.tables.filter((t) => t.out && t.restId === 'bernadette');
    out.forEach((t) => sim.clearTable(t, 'stink'));
    return { cleared: out.length };
  },
  // Carton sur la gaine : elle cesse de souffler sous la fenêtre (le reste se joue côté campagne : drapeaux, risque)
  exhaustBlocked(sim) {
    sim.state.exhaustBlocked = true;
    return {};
  },
};

// Noms pour le journal (« le serveur, Dédé regardent ailleurs »)
export const TURN_NAMES = { klaas: 'Klaas', seb_nico: 'Seb & Nico', waiter: 'le serveur', dede: 'Dédé', ghislain: 'Ghislain', customers: 'les clients', patrol: 'la patrouille' };

// Témoins du contenu (`witnessed.by`) → témoins de la sim (witness.js kind). Dédé, Ghislain et la police ne sont pas
// modélisés par la sim : ils sont tirés ici (EXTRA_WITNESSES).
export const SIM_KIND = { klaas: 'klaas', seb_nico: 'seb_nico', waiter: 'waiter', customers: 'customers', biloute: 'jeremie', jeremie: 'jeremie' };
export const EXTRA_WITNESSES = {
  dede: { name: 'Dédé', weight: 0.6, range: 14, present: (sim) => sim.state.min < (sim.cfg.RULES.streetEmptyAt ?? H(25)) }, // il ferme à 1h
  ghislain: { name: 'Ghislain', weight: 0.6, range: 10, present: (sim) => sim.state.min < H(25) },
  police: { name: 'la patrouille', weight: 1, range: 25, present: (sim) => sim.state.police?.phase === 'onsite' },
};

// ════════════════════════════════════════════════════════════════════════════
// API
// ════════════════════════════════════════════════════════════════════════════
const specOf = (id) => NIGHT_ACTION_SPECS[id] ?? { at: 'street', window: null };
const dist2 = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const hhmm = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}h${String(Math.floor(m % 60)).padStart(2, '0')}`;

// Pourquoi l'action n'est pas faisable ici et maintenant (null = faisable)
function blocked(sim, a, spec, player) {
  const S = sim.state;
  const minutes = a.cost?.minutes ?? 5;
  if (S.ended) return 'La nuit est finie.';
  if (spec.window) {
    if (S.min < spec.window[0]) return `Pas avant ${hhmm(spec.window[0])}.`;
    if (S.min > spec.window[1]) return 'Trop tard pour ça ce soir.';
  }
  if (S.min + minutes > sim.cfg.RULES.nightEnd) return 'Pas le temps avant la fin de la nuit.';
  // Diversion (§12d) : pas deux fois de suite, il faut laisser retomber l'attention
  const ready = S.diversionReadyAt?.[a.id];
  if (a.diversion && ready !== undefined && S.min < ready) return `Trop tôt pour recommencer\u00a0: encore ${Math.ceil(ready - S.min)}\u00a0min.`;
  if (spec.needs && !SCENE[spec.needs].test(sim)) return SCENE[spec.needs].reason;
  if (player) {
    const loc = LOCATIONS[spec.at];
    if (!loc.player.includes(player.where)) return `Il faut être ${loc.label}.`;
    if (loc.range && player.pos && dist2(player.pos, loc.pos(sim, player)) > loc.range) return `Approchez-vous : il faut être ${loc.label}.`;
  }
  return null;
}

// Liste pour le menu de nuit. Une action dont les `requires` (drapeaux, stats) ne sont pas remplis n'apparaît pas
// (anti-spoiler) ; une action possible mais pas ici / pas maintenant apparaît grisée avec sa raison.
// → [{ id, label, legality, minutes, at, where, available, reason, witnesses }]
//   witnesses : qui pourrait voir, maintenant, à cet endroit (indice pour l'UI : « 👁 Klaas, des clients »)
export function availableNightActions(sim, c, player) {
  const base = c.nightActions(sim);
  const done = new Set(sim.state.nightActionsDone ?? []);
  const list = [];
  for (const a of c.content.ACTIONS) {
    if ((a.phase ?? 'afternoon') !== 'night' || a.sim) continue;
    const spec = specOf(a.id);
    const repeatable = spec.repeat && done.has(a.id) && !a.once;
    if (!base.includes(a) && !repeatable) continue;
    const reason = blocked(sim, a, spec, player);
    // witnesses : calculé seulement si on le lit (le menu) ; les bots et le simulateur n'en ont pas besoin (chemin chaud)
    let witnesses = null;
    list.push({
      id: a.id, label: a.label, legality: a.legality, minutes: a.cost?.minutes ?? 5, at: spec.at, where: LOCATIONS[spec.at].label,
      available: !reason, reason,
      get witnesses() {
        if (witnesses) return witnesses;
        const pos = LOCATIONS[spec.at].pos(sim, player);
        return (witnesses = a.legality === 'legal' ? [] : [...new Set(sim.potentialWitnesses(pos).map((w) => (w.kind === 'customers' ? 'des clients' : w.name)))]);
      },
    });
  }
  return list;
}

// Tire les témoins : ceux de la sim (witness.js : distance de Klaas, obscurité, déguisement, foule du samedi,
// aboiement du teckel) via sim.witnessAct, puis Dédé / Ghislain / la police tirés ici avec la même exposition.
function rollAll(sim, a, pos) {
  const by = a.witnessed?.by ?? Object.keys(SIM_KIND);
  const exposure = a.witnessed?.exposure ?? 0.5;
  const kinds = [...new Set(by.map((w) => SIM_KIND[w]).filter(Boolean))];
  const seen = kinds.length ? sim.witnessAct(pos, a.label, { exposure, kinds }) : [];
  const night = sim.cfg.WITNESS.darkFactor ? Math.min(1, Math.max(0, (sim.state.min - sim.cfg.SKY.duskStart) / (sim.cfg.SKY.nightFull - sim.cfg.SKY.duskStart))) : 0;
  const dark = 1 + ((sim.cfg.WITNESS.darkFactor ?? 1) - 1) * night;
  for (const id of by.filter((w) => EXTRA_WITNESSES[w])) {
    const w = EXTRA_WITNESSES[id];
    if (!w.present(sim)) continue;
    const at = id === 'police' ? { x: sim.cfg.ANCHORS.waiter.x, z: sim.restCenter(sim.rest(sim.state.police.restId)).z } : sim.restCenter(bern(sim));
    if (dist2(at, pos) > w.range || aroundCorner(sim.cfg, pos)) continue; // au coin de la rue : hors de leur vue
    if (!sim.rng.chance(Math.min(1, exposure * dark * sim.disguise * attentionFactor(sim, id)))) continue;
    const hit = { id, kind: id, name: w.name, pos: at, weight: w.weight, ally: false, filmed: false };
    seen.push(hit);
    sim.state.witnessMemories.push({ time: sim.state.min, who: id, kind: id, ally: false, name: w.name, act: a.label, filmed: false });
    sim.note('witness', { act: a.label, who: id, kind: id, pos: at, filmed: false });
  }
  return seen;
}

// Effets côté nuit / campagne, comme c.doNightAction : Asso et Sommeil vivent dans la sim pendant la nuit,
// le Risque ne vient que des témoins (sim.punish), tout le reste passe par la campagne (c.apply).
export function applyEffects(sim, c, effects, cause, id) {
  if (!effects) return;
  const N = sim.state;
  if (typeof effects.asso === 'number') N.asso = clamp(N.asso + effects.asso, 0, 100);
  if (typeof effects.sleep === 'number') N.sleep = clamp(N.sleep + effects.sleep, 0, 100);
  const rest = { ...effects, asso: undefined, sleep: undefined, risk: undefined };
  if (Object.values(rest).some((v) => v !== undefined)) c.apply(rest, cause, id);
}

// Joue l'action `id`. → { ok, reason?, result, seen: [{ id, kind, name, ally, filmed }], minutes, art, sim }
// Ordre : témoins (au début de l'acte, au lieu de l'acte) → effets → effet mécanique → crochet art → le temps passe.
export function performNightAction(sim, c, id, player) {
  const a = c.content.ACTIONS.find((x) => x.id === id);
  const listed = a && availableNightActions(sim, c, player).find((x) => x.id === id);
  if (!listed) return { ok: false, reason: 'indisponible' };
  if (!listed.available) return { ok: false, reason: listed.reason };
  const spec = specOf(id);
  const S = sim.state;
  const CS = c.state;
  const minutes = listed.minutes;
  const pos = LOCATIONS[spec.at].pos(sim, player);
  const startedAt = S.min;

  // Suivi : une fois par campagne (`once`), une fois par nuit sauf `repeat`
  (S.nightActionsDone ??= []).push(id);
  sim.contentActions?.push(id);
  CS.seen.actions.push(id);
  CS.counts.actions[id] = (CS.counts.actions[id] ?? 0) + 1;
  c.note('action', { id, legality: a.legality, night: true });

  // Témoins : seulement pour ce qui n'est pas légal, ou ce qu'un contenu déclare observable (`witnessed`)
  const risky = a.legality !== 'legal' || (a.effects?.risk ?? 0) > 0;
  const seen = risky || a.witnessed ? rollAll(sim, a, pos) : [];

  applyEffects(sim, c, a.effects, 'action', id);
  if (seen.length) {
    const we = a.witnessed?.effects ?? {};
    if (risky) sim.punish(seen, id, (we.risk ?? 0) + Math.max(0, a.effects?.risk ?? 0), -(we.asso ?? 0));
    for (const w of seen) {
      CS.witnessMemories.push({ day: CS.day, who: w.kind, ally: !!w.ally, act: id, night: true });
      if (w.kind === 'klaas' && a.legality !== 'legal' && !CS.flags.includes('klaas_noted_pilou')) c.apply({ setFlags: ['klaas_noted_pilou'] }, 'witnessed', id);
    }
    c.note('witness', { act: id, by: seen.map((w) => w.id), night: true });
    applyEffects(sim, c, { ...we, risk: undefined, asso: undefined }, 'witnessed', id);
  } else if (risky) {
    sim.log('Personne n’a rien vu… a priori.', 'good', { cue: 'witness:nobody' });
  }

  const simResult = spec.simEffect ? SIM_EFFECTS[spec.simEffect](sim) : {};
  const art = spec.art ? { ...spec.art, pos } : null;
  if (art) sim.events.push({ type: 'art', action: id, ...art });
  sim.note('night-action', {
    id, legality: a.legality, at: spec.at, pos, minutes, seen: seen.map((w) => w.kind), filmed: seen.some((w) => w.filmed), ...simResult,
  });
  // resultLines : variantes du résultat (night.js › STREET_LINES, via pacing : pas deux fois dans la nuit ni la suivante)
  const resultText = (a.resultLines && sim.pacing?.line(a.resultLines)) || a.result;
  if (resultText) sim.log(resultText, a.legality === 'legal' ? 'good' : 'bad');

  // Déguisement mis en pleine nuit (night_disguise…) : la nuit en tient compte tout de suite
  const worn = (a.effects?.setFlags ?? []).filter((f) => f in sim.cfg.DISGUISE);
  if (worn.length) {
    worn.forEach((f) => sim.flags.add(f));
    sim.disguise = Math.min(1, ...Object.entries(sim.cfg.DISGUISE).filter(([f]) => sim.flags.has(f)).map(([, m]) => m));
  }

  // Le temps de l'acte passe (minute par minute : police, tables et sommeil continuent de tourner)
  for (let m = 0; m < minutes && !S.ended; m++) sim.tick(1);

  // Diversion (§12d) : une fois l'acte préparé, les témoins visés regardent ailleurs (ou s'en vont) pendant `minutes`.
  // traceRisk : on remonte jusqu'à Pilou (le déguisement aide) → les conséquences de `witnessed.effects`.
  let traced = false;
  if (a.diversion && !S.ended) {
    const d = a.diversion;
    divertAttention(sim, { source: 'diversion', id, turns: d.turns ?? [], minutes: d.minutes ?? 2, text: a.label });
    (S.diversionReadyAt ??= {})[id] = S.min + (d.cooldown ?? 0);
    sim.log(`👀 Fenêtre propice\u00a0: ${d.minutes ?? 2}\u00a0min où ${(d.turns ?? []).map((t) => TURN_NAMES[t] ?? t).join(', ')} regarde${(d.turns ?? []).length > 1 ? 'nt' : ''} ailleurs.`, 'good');
    if (d.traceRisk && sim.rng.chance(Math.min(1, d.traceRisk * sim.disguise))) {
      traced = true;
      const we = a.witnessed?.effects ?? {};
      sim.punish([{ id: 'trace', kind: 'trace', name: 'on remonte jusqu’à vous', weight: 1, ally: false, filmed: false }], id, we.risk ?? 0, -(we.asso ?? 0));
      applyEffects(sim, c, { ...we, risk: undefined, asso: undefined }, 'witnessed', id);
      c.note('witness', { act: id, by: ['trace'], night: true });
      sim.note('traced', { id });
    }
  }

  return {
    ok: true, result: resultText ?? null, minutes, startedAt, art, sim: simResult, traced,
    seen: seen.map((w) => ({ id: w.id, kind: w.kind, name: w.name, ally: !!w.ally, filmed: !!w.filmed })),
  };
}
