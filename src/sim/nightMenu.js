// Menu de nuit (N, GAME_DESIGN §12c.4) : les lignes du menu, calculées des données seules — aucune action nommée ici.
// Pur, sans DOM, sans hasard (n'utilise pas sim.rng) : le jeu (game.js) ne fait qu'afficher ce que ceci renvoie.
//   nightMenu(sim, c, player) → { here: [row], elsewhere: [row] }
//   row = { id, label, legality, tag, icon, color, minutes, time, risk: { level, label, p, who }, hint, reason, available }
// here : faisable là où se tient Pilou, maintenant ; elsewhere : possible ce soir, avec la raison du moteur
// (où aller, ce qu'il faut d'abord : nightActions.js availableNightActions).
import { availableNightActions, LOCATIONS, NIGHT_ACTION_SPECS, EXTRA_WITNESSES, SIM_KIND } from './nightActions.js';
import { NIGHT_MENU } from '../config.js';
import { attentionFactor } from './witness.js';

const dist2 = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
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
    if (kinds.has(w.kind)) seers.push({ name: shortName(w), p: Math.min(1, exposure * (w.p / (w.baseP || 1))) });
  }
  for (const id of by.filter((w) => EXTRA_WITNESSES[w])) {
    const w = EXTRA_WITNESSES[id];
    if (!w.present(sim)) continue;
    const at = id === 'police' ? { x: sim.cfg.ANCHORS.waiter.x, z: sim.restCenter(sim.rest(sim.state.police.restId)).z } : sim.restCenter(sim.rest('bernadette'));
    if (dist2(at, pos) <= w.range) seers.push({ name: w.name, p: Math.min(1, exposure * sim.disguise * attentionFactor(sim, id)) });
  }
  const p = 1 - seers.reduce((q, s) => q * (1 - s.p), 1);
  const level = p >= M.risk.high ? 'high' : p >= M.risk.medium ? 'medium' : 'low';
  const who = [...new Set(seers.sort((x, y) => y.p - x.p).map((s) => s.name))];
  return { level, label: L[level], p, who };
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
    };
    (x.available ? here : elsewhere).push(row);
  }
  return { here, elsewhere };
}
