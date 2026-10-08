import { describe, it, expect } from 'vitest';
import { createSim } from '../../src/sim/index.js';
import { WEATHER } from '../../src/sim/weather.js';
import { checkInvariants } from '../../src/sim/invariants.js';

const at = (sim, min) => { while (sim.state.min < min && !sim.state.ended) sim.tick(0.25); };

describe('météo (src/sim/weather.js)', () => {
  it('la drache vide les terrasses en quelques minutes, les buveurs debout partent', () => {
    const sim = createSim({ seed: 4, day: 'sat', carry: { weather: 'drache' } });
    const start = WEATHER.drache.start;
    at(sim, start - 1);
    expect(sim.state.tables.some((t) => t.out)).toBe(true);
    expect(sim.weather()).toBe(null);
    at(sim, start + WEATHER.drache.clearMinutes + 0.5);
    expect(sim.state.tables.filter((t) => t.out)).toHaveLength(0);
    expect(sim.state.tables.filter((t) => t.clearedBy === 'rain').length).toBeGreaterThan(0);
    expect(sim.activeStanding()).toHaveLength(0);
    expect(sim.weather()?.kind).toBe('drache');
    at(sim, 26 * 60);
    expect(checkInvariants(sim)).toEqual([]);
  });

  it('la bruine est purement d’ambiance : la soirée est la même qu’au sec', () => {
    const run = (weather) => {
      const sim = createSim({ seed: 9, carry: { weather } });
      at(sim, 23 * 60);
      return sim.state.tables.map((t) => [t.id, t.out, t.count]);
    };
    expect(run('drizzle')).toEqual(run('dry'));
    const s = createSim({ seed: 9, carry: { weather: 'drizzle' } });
    expect(s.state.weather.kind).toBe('drizzle');
  });

  it('même graine, même météo (et sans drache, la plupart des nuits sont sèches)', () => {
    const kinds = Array.from({ length: 60 }, (_, i) => createSim({ seed: i + 1 }).state.weather?.kind ?? 'sec');
    expect(kinds).toEqual(Array.from({ length: 60 }, (_, i) => createSim({ seed: i + 1 }).state.weather?.kind ?? 'sec'));
    expect(kinds.filter((k) => k === 'drizzle').length).toBeLessThan(20);
    expect(kinds).not.toContain('drache');
  });
});
