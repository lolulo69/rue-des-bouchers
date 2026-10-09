import { describe, it, expect } from 'vitest';
import { createSim, makeConfig } from '../../src/sim/index.js';
import { SCHEDULE, smokeSpot } from '../../src/sim/schedule.js';

// Les présences programmées (src/sim/schedule.js) sont la source de vérité : la 3D et les témoins lisent la même chose.
const at = (sim, min) => { while (sim.state.min < min) sim.tick(0.5); };

describe('présences programmées (schedule)', () => {
  it('pendant sa pause clope, le serveur fume au coin de la rue de la Barre : vu de tout près, pas de la terrasse (§12e.7)', () => {
    const cfg = makeConfig();
    const sim = createSim({ seed: 3, cfg });
    const [a] = SCHEDULE.waiterBreaks[0];
    at(sim, a + 1);
    expect(sim.waiterOnBreak()).toBe(true);
    const spot = smokeSpot(cfg);
    expect(sim.waiterPos()).toEqual(spot);
    expect(Math.abs(spot.z)).toBeGreaterThan(cfg.STREET.length / 2); // hors de la rue des Bouchers
    const near = sim.potentialWitnesses({ x: spot.x + 1, y: 1, z: spot.z - 1 }).find((x) => x.kind === 'waiter');
    expect(near?.pos).toMatchObject({ x: spot.x, z: spot.z });
    const terrace = sim.restCenter(sim.rest('bernadette'));
    expect(sim.potentialWitnesses(terrace).some((x) => x.kind === 'waiter')).toBe(false);
  });

  it('hors pause, le serveur fait ses allers-retours devant la terrasse', () => {
    const sim = createSim({ seed: 3 });
    at(sim, SCHEDULE.waiterBreaks[0][1] + 2);
    expect(sim.waiterOnBreak()).toBe(false);
    expect(sim.waiterPos().x).toBe(sim.cfg.ANCHORS.waiter.x);
  });

  it('la config peut changer les horaires (pas de pause = pas de déplacement)', () => {
    const sim = createSim({ seed: 3, cfg: makeConfig({ SCHEDULE: { ...SCHEDULE, waiterBreaks: [] } }) });
    at(sim, SCHEDULE.waiterBreaks[0][0] + 1);
    expect(sim.waiterOnBreak()).toBe(false);
  });

  it('Ghislain nettoie le store en début de soirée seulement', () => {
    const sim = createSim({ seed: 3 });
    at(sim, SCHEDULE.ghislainClean[0][0] + 1);
    expect(sim.ghislainCleaning()).toBe(true);
    at(sim, SCHEDULE.ghislainClean[0][1] + 1);
    expect(sim.ghislainCleaning()).toBe(false);
  });

  it('la patrouille : personne sans appel, deux agents qui avancent vers le resto une fois appelés', () => {
    const sim = createSim({ seed: 3 });
    expect(sim.policePositions()).toEqual([]);
    let r = null;
    for (let k = 0; k < 5 && !sim.state.police; k++) r = sim.act({ type: 'police' });
    expect(sim.state.police, JSON.stringify(r)).toBeTruthy();
    at(sim, sim.state.police.enterAt + 0.5);
    const p = sim.policePositions();
    expect(p).toHaveLength(2);
    expect(p[0].moving).toBe(true);
  });
});
