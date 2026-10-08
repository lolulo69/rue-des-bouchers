import { dist3 } from './geometry.js';
import { twistNoiseDb } from './twistNight.js';

const dbAt = (L, p, src) => L - 20 * Math.log10(Math.max(1, dist3(p, src)));

// Niveau sonore (dB) en un point. indoor : chez Pilou, fenêtre ouverte.
export function noiseAt(sim, p, indoor) {
  const { NOISE } = sim.cfg;
  const S = sim.state;
  const boost = (S.min >= NOISE.lateBoostAfter ? NOISE.lateBoostDb : 0) + (S.min >= NOISE.drunkAfter ? NOISE.drunkBoostDb : 0) + sim.day.crowdDb
    + twistNoiseDb(sim, sim.twist); // twist v1.1 : multiplicateur de bruit, moments (buts, chansons…)
  let outside = 0;
  for (const t of S.tables) {
    if (!t.out) continue;
    outside += 10 ** (dbAt(NOISE.personDb + boost + 10 * Math.log10(t.count), p, { x: t.x, y: 1.1, z: t.z }) / 10);
  }
  for (const g of sim.activeStanding()) {
    outside += 10 ** (dbAt(NOISE.standingDb + boost + 10 * Math.log10(g.size), p, { x: g.x, y: 1.5, z: g.z }) / 10);
  }
  for (const c of S.clatters) outside += 10 ** (dbAt(NOISE.clatterDb, p, c) / 10);
  if (S.min < NOISE.exhaustOffMinute && !S.exhaustOff) outside += 10 ** (dbAt(NOISE.exhaustDb, p, sim.cfg.ANCHORS.exhaust) / 10);
  const att = indoor ? 10 ** (-NOISE.indoorAttenuationDb / 10) : 1;
  return 10 * Math.log10(10 ** (NOISE.ambientDb / 10) + outside * att);
}
