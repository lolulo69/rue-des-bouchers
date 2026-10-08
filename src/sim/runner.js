// Joue une soirée entière sans rendu, à pas fixe, en demandant ses actions à un bot.
import { createSim } from './sim.js';

export function runNight({ seed = 1, day = 'mon', cfg, policy, dt = 0.5, onTick } = {}) {
  const sim = createSim({ seed, day, cfg });
  while (!sim.state.ended) {
    if (policy) for (const a of policy.decide(sim)) { sim.act(a); if (sim.state.ended) break; }
    sim.tick(dt);
    sim.events.length = 0;
    onTick?.(sim);
  }
  return sim;
}
