// Menu de nuit (N, GAME_DESIGN §12c.4) : les lignes du menu, calculées des données seules — aucune action nommée ici.
// Pur, sans DOM, sans hasard (n'utilise pas sim.rng) : le jeu (game.js) ne fait qu'afficher ce que ceci renvoie.
//   nightMenu(sim, c, player) → { here: [row], elsewhere: [row] }
//   row = { id, label, legality, tag, icon, color, minutes, time, risk: { level, label, p, who }, hint, reason, available }
// here : faisable là où se tient Pilou, maintenant ; elsewhere : possible ce soir, avec la raison du moteur
// (où aller, ce qu'il faut d'abord : nightActions.js availableNightActions).
import { availableNightActions, LOCATIONS, NIGHT_ACTION_SPECS, EXTRA_WITNESSES, SIM_KIND, TURN_NAMES } from './nightActions.js';
import { NIGHT_MENU } from '../config.js';
import { attentionFactor } from './witness.js';
import { aroundCorner } from './schedule.js';

const dist2 = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
// kind de témoin (witness.js) → id de `diversion.turns`
const TURN_OF_KIND = { klaas: 'klaas', seb_nico: 'seb_nico', waiter: 'waiter', customers: 'customers', jeremie: 'jeremie' };
const shortName = (w) => (w.kind === 'customers' ? 'des clients' : String(w.name).split(' (')[0]);

// Probabilité qu'au moins un des témoins possibles de l'acte (witnessed.by) le voie, maintenant, à cet endroit.
// Même modèle que le tirage (nightActions.js rollAll + witness.js rollWitnesses), sans tirer au sort.
export function witnessRisk(sim, a, pos, M = NIGHT_MENU) {
  const L = M.risk.labels;
  if (a.legality === 'legal') return { level: 'none', label: L.none, p: 0, who: [] };
  const exposure = a.witnessed?.exposure ?? 0.5;
  const by = a.witnessed?.by ?? Object.keys(SIM_KIND);
  const kinds = new Set(by.map((w) => SIM_KIND[w]).filter(Boolean));
  const seers = [];
  for (const w of sim.potentialWitnesses(pos)) {
    if (kinds.has(w.kind)) seers.push({ name: shortName(w), p: Math.min(1, exposure * (w.p / (w.baseP || 1))), turn: TURN_OF_KIND[w.kind] ?? null });
  }
  for (const id of by.filter((w) => EXTRA_WITNESSES[w])) {
    const w = EXTRA_WITNESSES[id];
    if (!w.present(sim)) continue;
    const at = id === 'police' ? { x: sim.cfg.ANCHORS.waiter.x, z: sim.restCenter(sim.rest(sim.state.police.restId)).z } : sim.restCenter(sim.rest('bernadette'));
    if (dist2(at, pos) <= w.range && !aroundCorner(sim.cfg, pos)) seers.push({ name: w.name, p: Math.min(1, exposure * sim.disguise * attentionFactor(sim, id)), turn: id === 'police' ? 'patrol' : id });
  }
  const p = 1 - seers.reduce((q, s) => q * (1 - s.p), 1);
  const level = p >= M.risk.high ? 'high' : p >= M.risk.medium ? 'medium' : 'low';
  const who = [...new Set(seers.sort((x, y) => y.p - x.p).map((s) => s.name))];
  // turns : qui une diversion devrait détourner pour cet acte, ici et maintenant (§12e.7, « Faire diversion »)
  const turns = [...new Set(seers.filter((x) => x.turn && x.p >= (M.divertFrom ?? 0.03)).map((x) => x.turn))];
  return { level, label: L[level], p, who, turns };
}

// Indice d'effets, sans tout dévoiler (modèle : hintOf de src/ui/index.js) : ce que l'action fait bouger
export function effectHint(a, M = NIGHT_MENU) {
  const e = a.effects ?? {};
  const parts = Object.entries(M.stats).filter(([k]) => typeof e[k] === 'number' && e[k] && k !== 'risk').map(([k, l]) => `${l} ${e[k] > 0 ? '▲' : '▼'}`);
  if (e.evidence) parts.push(M.evidence);
  return parts.join(' · ');
}

export function nightMenu(sim, c, player, M = NIGHT_MENU) {
  const byId = new Map(c.content.ACTIONS.map((a) => [a.id, a]));
  const here = [];
  const elsewhere = [];
  for (const x of availableNightActions(sim, c, player)) {
    const a = byId.get(x.id);
    const spec = NIGHT_ACTION_SPECS[x.id] ?? { at: 'street' };
    const pos = (LOCATIONS[spec.at] ?? LOCATIONS.street).pos(sim, player);
    const L = M.legality[x.legality] ?? M.legality.grey;
    const row = {
      id: x.id, label: x.label, legality: x.legality, tag: L.tag, icon: L.icon, color: L.color,
      minutes: x.minutes, time: `${x.minutes} min`, where: x.where,
      risk: witnessRisk(sim, a, pos, M), hint: effectHint(a, M), reason: x.reason, available: x.available,
      divert: null,
    };
    // « Faire diversion » (§12e.7) : pour un acte faisable ici que quelqu'un verrait
    if (x.available && row.risk.turns?.length) {
      const plan = diversionPlan(sim, c, x.id, player, M);
      if (plan) row.divert = { ...plan, names: plan.covered.map((t) => TURN_NAMES[t] ?? t), missingNames: plan.missing.map((t) => TURN_NAMES[t] ?? t) };
    }
    (x.available ? here : elsewhere).push(row);
  }
  return { here, elsewhere };
}

// « Qui regarde ? » (§12d, HUD) : qui pourrait voir Pilou maintenant, en `pos`, et d'où.
// → [{ key, label, icon, count, distracted, p }] trié par probabilité ; les clients d'une même rue sont regroupés.
// Témoins de la sim (witness.js : Klaas, balcon, serveur, clients, teckel, twist) + ceux tirés par nightActions
// (Dédé, Ghislain, la patrouille sur place), avec l'attention (diversions, fenêtres) déjà appliquée.
const WHO = {
  klaas: { label: 'Klaas', icon: '🔭' }, seb_nico: { label: 'Seb & Nico', icon: '🐈' }, waiter: { label: 'le serveur', icon: '' },
  customers: { label: 'des clients', icon: '👥' }, jeremie: { label: 'Jérémie', icon: '🐕' }, twist: { label: '', icon: '📱' },
  dede: { label: 'Dédé', icon: '' }, ghislain: { label: 'Ghislain', icon: '' }, police: { label: 'la patrouille', icon: '🚓' },
};
export function whoWatches(sim, pos) {
  const by = new Map();
  const add = (key, w, label = WHO[key]?.label || shortName(w)) => {
    const e = by.get(key) ?? { key, label, icon: WHO[key]?.icon ?? '', count: 0, distracted: true, p: 0 };
    e.count++;
    e.distracted &&= !!w.distracted;
    e.p = 1 - (1 - e.p) * (1 - Math.min(1, w.p));
    by.set(key, e);
  };
  for (const w of sim.potentialWitnesses(pos)) add(w.kind === 'twist' ? `twist:${w.id}` : w.kind, w, w.kind === 'twist' ? shortName(w) : undefined);
  for (const [id, w] of Object.entries(EXTRA_WITNESSES)) {
    if (!w.present(sim)) continue;
    const at = id === 'police' ? { x: sim.cfg.ANCHORS.waiter.x, z: sim.restCenter(sim.rest(sim.state.police.restId)).z } : sim.restCenter(sim.rest('bernadette'));
    if (dist2(at, pos) > w.range || aroundCorner(sim.cfg, pos)) continue;
    const f = attentionFactor(sim, id);
    add(id, { name: w.name, p: sim.disguise * f, distracted: f < 1 });
  }
  return [...by.values()].sort((a, b) => b.p - a.p);
}

// « Faire diversion » (§12e.7) : la ou les diversions les moins chères (au plus `maxSteps`) qui détournent exactement ceux
// qui verraient l'acte `actionId` d'ici, maintenant. → null s'il n'y a personne à détourner ou rien de disponible, sinon
// { needed, covered, missing, steps: [{ id, label, minutes, window, traceRisk, asso }], minutes, traceRisk }
// Coût d'une diversion : son temps + son risque d'être tracé + l'Asso qu'elle coûte (poids dans NIGHT_MENU.divertCost).
export function diversionPlan(sim, c, actionId, player, M = NIGHT_MENU) {
  const a = c.content.ACTIONS.find((x) => x.id === actionId);
  if (!a || a.legality === 'legal' || a.diversion) return null;
  const spec = NIGHT_ACTION_SPECS[actionId] ?? { at: 'street' };
  const needed = witnessRisk(sim, a, (LOCATIONS[spec.at] ?? LOCATIONS.street).pos(sim, player), M).turns;
  if (!needed.length) return null;
  const W = M.divertCost ?? { minute: 1, trace: 10, asso: 2 };
  const byId = new Map(c.content.ACTIONS.map((x) => [x.id, x]));
  // Les diversions faisables maintenant (créneau, délai, conditions) ; le lieu n'est pas exigé (appels, messages…)
  const cands = availableNightActions(sim, c).filter((x) => x.available && byId.get(x.id)?.diversion).map((x) => {
    const d = byId.get(x.id);
    const asso = Math.max(0, -(d.effects?.asso ?? 0));
    return { id: x.id, label: x.label, minutes: x.minutes, window: d.diversion.minutes, traceRisk: d.diversion.traceRisk ?? 0, asso,
      turns: (d.diversion.turns ?? []).map((t) => (t === 'biloute' ? 'jeremie' : t)),
      cost: x.minutes * W.minute + (d.diversion.traceRisk ?? 0) * W.trace + asso * W.asso };
  });
  const steps = [];
  let left = [...needed];
  while (left.length && steps.length < (M.divertMaxSteps ?? 2)) {
    const best = cands.filter((d) => !steps.includes(d)).map((d) => ({ d, gain: d.turns.filter((t) => left.includes(t)).length }))
      .filter((x) => x.gain > 0).sort((x, y) => y.gain / y.d.cost - x.gain / x.d.cost || x.d.cost - y.d.cost)[0];
    if (!best) break;
    steps.push(best.d);
    left = left.filter((t) => !best.d.turns.includes(t));
  }
  if (!steps.length) return null;
  // La plus longue fenêtre d'abord : elle couvre encore l'acte pendant que la suivante se prépare
  steps.sort((x, y) => y.window - x.window);
  return {
    needed, covered: needed.filter((t) => !left.includes(t)), missing: left,
    steps: steps.map(({ id, label, minutes, window, traceRisk, asso }) => ({ id, label, minutes, window, traceRisk, asso })),
    minutes: steps.reduce((m, d) => m + d.minutes, 0),
    traceRisk: 1 - steps.reduce((q, d) => q * (1 - d.traceRisk), 1),
  };
}
