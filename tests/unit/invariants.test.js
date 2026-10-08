import { describe, it, expect } from 'vitest';
import os from 'node:os';
import { runNight, POLICIES, checkInvariants } from '../../src/sim/index.js';

describe('invariants de cohérence sur des soirées simulées (§13.G)', () => {
  for (const day of ['mon', 'sat']) {
    for (const [name, make] of Object.entries(POLICIES)) {
      it(`${day} · bot ${name} · 40 graines`, () => {
        for (let seed = 1; seed <= 40; seed++) {
          const sim = runNight({ seed, day, policy: make() });
          expect(sim.state.ended).toBe(true);
          expect(checkInvariants(sim), `graine ${seed}`).toEqual([]);
        }
      });
    }
  }

  it('le vérificateur attrape une incohérence fabriquée', () => {
    const sim = runNight({ seed: 3, policy: POLICIES.passive() });
    sim.state.journal.push({ t: 1300, type: 'police-arrive', callId: 99 });
    sim.state.journal.push({ t: 1301, type: 'risk', amount: 10, witnesses: [] });
    sim.state.journal.push({ t: 1302, type: 'klaas-note', pos: { x: 0, y: 1, z: -500 } });
    const errs = checkInvariants(sim);
    expect(errs.some((e) => e.startsWith('police sans appel'))).toBe(true);
    expect(errs.some((e) => e.startsWith('Risque sans témoin'))).toBe(true);
    expect(errs.some((e) => e.startsWith('Klaas note ce qu\'il ne peut pas voir'))).toBe(true);
  });

  it('même graine = même soirée (RNG déterministe)', () => {
    const a = runNight({ seed: 42, policy: POLICIES.legal() });
    const b = runNight({ seed: 42, policy: POLICIES.legal() });
    expect(JSON.stringify(a.state.journal)).toBe(JSON.stringify(b.state.journal));
  });
});

describe('performance du simulateur', () => {
  it('au moins 100 soirées par seconde, sans DOM ni three.js', () => {
    const load = Math.max(1, os.loadavg()[0] / os.cpus().length); // machine partagée : la limite suit la charge
    const t0 = performance.now();
    for (let seed = 1; seed <= 100; seed++) runNight({ seed, day: 'sat', policy: POLICIES.legal() });
    expect(performance.now() - t0).toBeLessThan(1000 * load);
  });
});
