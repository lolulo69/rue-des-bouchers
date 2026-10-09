// Horloge de nuit adaptative (§12c.5) : ×1 jusqu'à 22h30, ×3 ensuite sauf si quelque chose se passe ou va se passer.
import { describe, it, expect } from 'vitest';
import { createSim, nightClock, busyReason } from '../../src/sim/index.js';
import { RULES } from '../../src/config.js';

const R = RULES.clock;
// Une nuit de lundi calme : on retire les entrées « vivantes » du journal pour isoler chaque cause
function at(min, seed = 3) {
  const sim = createSim({ seed, day: 1 });
  while (sim.state.min < min) sim.tick(1);
  sim.state.journal = sim.state.journal.filter((e) => e.t < min - R.calmMinutes - 1);
  return sim;
}

describe('nightClock', () => {
  it('×1 avant 22h30, ×3 après quand rien ne se passe', () => {
    expect(nightClock(at(21 * 60)).scale).toBe(1);
    const late = nightClock(at(23 * 60 + 10));
    expect(late).toMatchObject({ scale: R.fastScale, fast: true, reason: 'late' });
  });

  it('« accélérer » à la main : ×3 dès le début de soirée', () => {
    expect(nightClock(at(21 * 60), null, { manual: true })).toMatchObject({ scale: R.fastScale, reason: 'manual' });
  });

  it('dormir : ×40', () => {
    const sim = at(21 * 60);
    sim.act({ type: 'sleep', on: true });
    expect(nightClock(sim).scale).toBe(RULES.sleepTimeMultiplier);
    expect(RULES.sleepTimeMultiplier).toBe(40);
  });

  it('une patrouille appelée ralentit jusqu’à son départ', () => {
    const sim = at(23 * 60 + 10);
    sim.act({ type: 'police' });
    expect(busyReason(sim)).toBe('police');
    expect(nightClock(sim, null, { manual: true }).scale).toBe(1);
    while (sim.state.police.phase !== 'leaving' && !sim.state.ended) sim.tick(1);
    sim.state.journal = [];
    expect(busyReason(sim)).toBeNull();
  });

  it('moment de twist ou événement de nuit dans les 10 minutes : ×1', () => {
    const sim = at(23 * 60 + 10);
    sim.state.twistEvents = [{ i: 0, at: sim.state.min + R.lookahead - 1, done: false }];
    expect(busyReason(sim)).toBe('twist');
    sim.state.twistEvents[0].at = sim.state.min + R.lookahead + 5;
    expect(busyReason(sim)).toBeNull();
    const c = { state: { nightEvents: [{ id: 'x', at: sim.state.min + 3 }] } };
    expect(busyReason(sim, c)).toBe('event');
  });

  it('témoin ou preuve dans les dernières minutes : ×1, puis ça repart', () => {
    const sim = at(23 * 60 + 10);
    sim.note('witness', { who: 'klaas' });
    expect(nightClock(sim).reason).toBe('busy:witness');
    for (let i = 0; i <= R.calmMinutes + 1; i++) sim.tick(1);
    sim.state.journal = sim.state.journal.filter((e) => e.type === 'witness');
    expect(nightClock(sim).fast).toBe(true);
  });
});
