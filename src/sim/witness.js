import { dist3, lineOfSight } from './geometry.js';
import { twistWitnesses } from './twistNight.js';

export function nightFactor(sim) {
  const { SKY } = sim.cfg;
  return Math.min(1, Math.max(0, (sim.state.min - SKY.duskStart) / (SKY.nightFull - SKY.duskStart)));
}

// Probabilité que Klaas distingue un acte à `d` mètres : pleine jusqu'à near, nulle au-delà de far.
export function klaasDetection(sim, d) {
  const k = sim.cfg.WITNESS.klaas;
  if (sim.klaasWatching()) {
    const b = k.binoculars;
    return b.p * Math.min(1, Math.max(0, (b.far - d) / (b.far - b.near)));
  }
  const n = nightFactor(sim);
  const near = k.near[0] + (k.near[1] - k.near[0]) * n;
  const far = k.far[0] + (k.far[1] - k.far[0]) * n;
  return k.p * Math.min(1, Math.max(0, (far - d) / (far - near)));
}

// ── Attention (§12d) ──────────────────────────────────────────────────
// Chaque témoin regarde la rue (son point d'attention par défaut). Une diversion (action `diversion`) ou une fenêtre
// naturelle d'un twist (`sim.windows`) détourne certains témoins pendant quelques minutes : ils regardent ailleurs
// (le pétard côté place) ou s'en vont (le téléphone de l'estaminet). Leur probabilité de voir Pilou tombe alors à
// WITNESS.attention.away (un coup d'œil reste possible). S.attention = [{ source, id, turns, from, until, text }].
// turns : 'klaas' | 'seb_nico' | 'waiter' | 'dede' | 'ghislain' | 'customers' | 'patrol' (= le kind 'police'),
// 'jeremie' / 'biloute' (§12e.4 : Jérémie emmène Biloute au bout de la rue) et 'tatie'.
// Alias de `turns` : le teckel suit Jérémie ; Tatie n'est pas un témoin de la sim (accepté, sans effet pour l'instant)
const TURN_OF = { police: 'patrol' };
const TURN_ALIAS = { biloute: 'jeremie' };
export const activeAttention = (sim) => (sim.state.attention ?? []).filter((a) => sim.state.min >= a.from && sim.state.min < a.until);
export function attentionFactor(sim, kind) {
  const t = TURN_OF[kind] ?? kind;
  return activeAttention(sim).some((a) => a.turns.some((x) => (TURN_ALIAS[x] ?? x) === t)) ? (sim.cfg.WITNESS.attention?.away ?? 0.08) : 1;
}
// Ouvre une fenêtre d'attention détournée (diversion ou moment du twist), pour `minutes` minutes de jeu à partir de maintenant
export function divertAttention(sim, { source, id, turns, minutes, text = null }) {
  const S = sim.state;
  const [lo, hi] = sim.cfg.WITNESS.attention?.minutes ?? [0, Infinity];
  const a = { source, id, turns: [...turns], from: S.min, until: S.min + Math.min(hi, Math.max(lo, minutes)), text };
  (S.attention ??= []).push(a);
  sim.note('attention', { source, id, turns: a.turns, until: a.until });
  sim.events.push({ type: 'attention', ...a });
  return a;
}

// Qui pourrait voir un acte commis en `pos` en ce moment (ligne de vue + portée selon l'obscurité) ?
export function potentialWitnesses(sim, pos) {
  const { WITNESS, STREET, ANCHORS } = sim.cfg;
  const S = sim.state;
  const night = nightFactor(sim);
  const range = WITNESS.sightDusk + (WITNESS.sightNight - WITNESS.sightDusk) * night;
  const W = STREET.halfWidth;
  // Les gens de la rue voient mal dans le noir ; Klaas et le balcon sont à hauteur de fenêtre, habitués.
  const dark = 1 + (WITNESS.darkFactor - 1) * night;
  // Obscurité du twist (coupure de courant…) : tout le monde voit moins (bonus de discrétion)
  const twistDark = 1 - 0.6 * (S.darkness ?? 0);
  const out = [];
  const add = (id, kind, def, at, extra = {}) => {
    if (dist3(at, pos) > range || !lineOfSight(at, pos, W)) return;
    // Obscurité : les gens de la rue ; déguisement : tous ceux qui ne sont pas des alliés (ils ne reconnaissent pas Pilou)
    const focus = attentionFactor(sim, kind); // §12d : détourné par une diversion ou une fenêtre du twist
    const p = def.p * (kind === 'waiter' || kind === 'customers' || kind === 'jeremie' || kind === 'twist' ? dark : 1) * (def.ally ? 1 : sim.disguise) * twistDark * focus;
    out.push({ id, kind, name: def.name, pos: at, p, baseP: def.p, weight: def.weight, ally: def.ally, distracted: focus < 1, ...extra });
  };
  // Klaas : pas de portée générique, mais une détection qui baisse avec la distance (jumelles la nuit)
  if (sim.klaasAwake() && lineOfSight(ANCHORS.klaasWindow, pos, W)) {
    const p = klaasDetection(sim, dist3(ANCHORS.klaasWindow, pos));
    const name = sim.klaasWatching() ? `${WITNESS.klaas.name.split(' (')[0]} (jumelles)` : WITNESS.klaas.name;
    const focus = attentionFactor(sim, 'klaas');
    if (p > 0) out.push({ id: 'klaas', kind: 'klaas', name, pos: ANCHORS.klaasWindow, p: p * twistDark * focus, baseP: WITNESS.klaas.p, weight: WITNESS.klaas.weight, ally: true, distracted: focus < 1 });
  }
  if (sim.catPresent()) add('seb_nico', 'seb_nico', WITNESS.seb_nico, ANCHORS.balcony);
  if (sim.dogActive()) add('jeremie', 'jeremie', WITNESS.jeremie, { ...sim.dogPos(), y: 1.6 });
  if (sim.waiterOnDuty()) add('waiter', 'waiter', sim.waiterId === 'theo' ? WITNESS.waiter : (WITNESS.newWaiter ?? WITNESS.waiter), { ...sim.waiterPos(), y: 1.6 }, { waiterId: sim.waiterId });
  const cover = sim.day.key === 'sat' ? WITNESS.saturdayCover : 1;
  const c = WITNESS.customers;
  for (const t of S.tables) {
    if (t.out) add(`clients:${t.id}`, 'customers', { ...c, name: `des clients (${t.label})`, p: c.p * cover }, { x: t.x, y: 1.2, z: t.z }, { tableId: t.id });
  }
  for (const g of sim.activeStanding()) {
    add(`clients:${g.id}`, 'customers', { ...c, name: 'des buveurs debout', p: c.p * cover }, { x: g.x, y: 1.6, z: g.z });
  }
  // Témoins du twist (influenceuse qui filme, guide et son groupe…)
  for (const tw of twistWitnesses(sim, sim.twist)) add(tw.id, 'twist', tw.def, tw.pos, { filming: tw.filming, twistWitness: tw.twistWitness });
  return out;
}

// Tire au sort qui a effectivement vu. wetTableIds : tables arrosées (elles lèvent la tête).
// bark : bonus d'attention pour les gens de la rue quand le teckel aboie.
// exposure / kinds (actions du contenu) : probabilité de base de l'acte (remplace celle du témoin, modulée pareil), témoins possibles.
export function rollWitnesses(sim, pos, { wetTableIds = [], bark = 0, exposure, kinds } = {}) {
  const c = sim.cfg.WITNESS.customers;
  const seen = [];
  for (const w of potentialWitnesses(sim, pos)) {
    if (kinds && !kinds.includes(w.kind)) continue;
    const street = w.kind === 'customers' || w.kind === 'waiter';
    const base = exposure !== undefined ? exposure * (w.p / w.baseP) : w.p;
    const p = base + (w.tableId && wetTableIds.includes(w.tableId) ? c.wetBonus * (w.p / c.p) : 0) + (street ? bark * sim.disguise : 0);
    if (!sim.rng.chance(Math.min(1, p))) continue;
    const filmed = !!w.filming || (w.kind === 'customers' && sim.rng.chance(c.filmChance));
    seen.push({ ...w, filmed });
  }
  return seen;
}
