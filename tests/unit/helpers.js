import { createSim, makeConfig } from '../../src/sim/index.js';

// Restaurants avec des champs surchargés (les tableaux de config sont remplacés en bloc)
export function restaurants(patch) {
  return makeConfig().RESTAURANTS.map((r) => ({ ...r, ...(typeof patch === 'function' ? patch(r) : patch) }));
}

// Crée une soirée et avance l'horloge jusqu'à `min` (par pas de 0.25 min), en gardant les événements.
export function simAt(min, { seed = 1, day = 'mon', cfg = {} } = {}) {
  const sim = createSim({ seed, day, cfg: makeConfig(cfg) });
  advance(sim, min);
  return sim;
}
export function advance(sim, min, dt = 0.25) {
  const logs = [];
  while (sim.state.min < min && !sim.state.ended) {
    sim.tick(Math.min(dt, min - sim.state.min));
    for (const e of sim.drainEvents()) if (e.type === 'log') logs.push(e.text);
  }
  return logs;
}
export const logsOf = (sim) => sim.drainEvents().filter((e) => e.type === 'log').map((e) => e.text);
export const H = (h, m = 0) => h * 60 + m;
