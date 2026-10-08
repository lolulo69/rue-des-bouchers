// Météo de la nuit (source de vérité pour la 3D) :
//  - la drache (événement de campagne r_drache, carry.weather = 'drache') : pluie forte à 21h15, les terrasses se vident
//    en quelques minutes et les buveurs debout s'en vont ;
//  - la bruine (quelques nuits au hasard) : purement d'ambiance, aucun effet de jeu.
// Tirée avec son propre générateur (dérivé de la graine) : elle ne décale aucun autre tirage de la soirée.
import { createRng } from './rng.js';

export const WEATHER = {
  drache: { start: 21 * 60 + 15, minutes: 70, clearMinutes: 4 },
  drizzle: { chance: 0.12, start: [20 * 60 + 40, 23 * 60 + 30], minutes: [20, 55] },
};

export function planWeather(seed, carry = {}, cfg = {}) {
  const W = cfg.WEATHER ?? WEATHER;
  if (carry.weather === 'drache') return { kind: 'drache', start: W.drache.start, end: W.drache.start + W.drache.minutes, applied: false };
  if (carry.weather === 'dry') return null;
  const rng = createRng((seed ^ 0x5eed) >>> 0);
  if (carry.weather !== 'drizzle' && !rng.chance(W.drizzle.chance)) return null;
  const start = rng.range(...W.drizzle.start);
  return { kind: 'drizzle', start, end: start + rng.range(...W.drizzle.minutes), applied: false };
}

// État courant : { kind, intensity 0..1 } (montée et descente sur ~3 minutes), ou null quand il fait sec
export function weatherNow(S) {
  const w = S.weather;
  if (!w || S.min < w.start || S.min >= w.end) return null;
  const ramp = Math.min(1, (S.min - w.start) / 3, (w.end - S.min) / 3);
  return { kind: w.kind, intensity: (w.kind === 'drache' ? 1 : 0.35) * Math.max(0, ramp) };
}

// Appelé à chaque tick : la drache fait rentrer toutes les tables dehors en quelques minutes
export function applyWeather(sim) {
  const S = sim.state, w = S.weather;
  if (!w || w.applied || w.kind !== 'drache' || S.min < w.start) return;
  w.applied = true;
  const W = sim.cfg.WEATHER ?? WEATHER;
  const out = S.tables.filter((t) => t.out);
  out.forEach((t, i) => {
    t.clearAt = Math.min(t.clearAt, S.min + (W.drache.clearMinutes * (i + 1)) / Math.max(1, out.length));
    t.pendingBy = 'rain';
  });
  for (const t of S.tables) if (!t.out && t.hiddenUntil !== null) t.hiddenUntil = S.min + W.drache.minutes + 30; // pas de retour sous la pluie
  for (const g of S.standing ?? []) g.leaveAt = Math.min(g.leaveAt, S.min + 2);
  sim.note('weather', { kind: 'drache' });
  sim.log('Une drache tombe d’un coup sur la rue des Bouchers. Les terrasses se vident en quatre minutes.');
}
