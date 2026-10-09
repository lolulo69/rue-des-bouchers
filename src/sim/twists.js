// Twists de nuit (§12b A, contrat §14 « twists.js ») : une situation par nuit, posée sur la nuit normale.
// Choix : la nuit fixe de son jour (`day`), sinon tirage pondéré (`weight`, 1 par défaut) dans le pool (`pool: true`)
// parmi ceux dont la condition §14 tient, jamais deux fois le même dans une campagne. La sim reçoit seulement
// `twist.sim` (sim.js l'applique) ; la narration et le metteur en scène lisent `sim.twist` (intro, lines, props).
import { evalCondition } from './conditions.js';

// Champs de `sim` compris par le moteur (le linter signale les autres)
export const TWIST_SIM_KEYS = ['crowd', 'noise', 'closeDelay', 'tables', 'witnesses', 'darkness', 'rain', 'exhaustOff', 'corridorBlocked', 'events', 'opportunities', 'dog'];

// ctx : contexte de conditions de la campagne (c.ctx()) ; history : ids déjà joués ; rng : RNG de la campagne
export function pickTwist(TWISTS, ctx, history, rng) {
  const used = new Set(history);
  const ok = (t) => !used.has(t.id) && evalCondition(t.when, ctx, null);
  const fixed = TWISTS.filter((t) => t.day !== undefined && [t.day].flat().includes(ctx.day) && ok(t));
  if (fixed.length) return fixed[0];
  const pool = TWISTS.filter((t) => t.pool !== false && t.day === undefined && ok(t));
  if (!pool.length) return null;
  const total = pool.reduce((s, t) => s + (t.weight ?? 1), 0);
  let r = rng.next() * total;
  for (const t of pool) { r -= t.weight ?? 1; if (r <= 0) return t; }
  return pool.at(-1);
}

// Ce que la nuit sait du twist (sim.twist) : copie sans les champs de campagne
export const nightTwist = (t) => (t ? { id: t.id, title: t.title, intro: t.intro, lines: t.lines ?? {}, props: t.props ?? [], sim: t.sim ?? {} } : null);
