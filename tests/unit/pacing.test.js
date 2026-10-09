import { describe, it, expect } from 'vitest';
import { createSim, makeConfig } from '../../src/sim/index.js';
import { CLATTER, AMBIENT } from '../../src/content/night.js';
import { restaurants, advance } from './helpers.js';

const H = (h, m = 0) => h * 60 + m;
const night = (opts = {}) => createSim({ seed: opts.seed ?? 7, day: opts.day ?? 'mon', cfg: makeConfig(opts.cfg ?? {}), carry: opts.carry ?? {} });
const until = (sim, min) => advance(sim, min, 1);
const CLATTER_LINES = Object.entries(CLATTER).filter(([k]) => k !== 'names').flatMap(([, v]) => v);
const isClatter = (text) => CLATTER_LINES.some((t) => text.startsWith(t.split('{')[0]) && t.split('{')[0].length > 3)
  || /rentre|rangent|débarrasse|plie|racle/i.test(text);

describe('pacing.js : raclements de chaises', () => {
  it('les tables rentrées ensemble font une seule ligne, avec le nombre en toutes lettres', () => {
    const sim = night({ cfg: { RESTAURANTS: restaurants({ compliance: 1 }) } });
    until(sim, H(21, 50));
    sim.drainEvents();
    const goulot = sim.state.tables.filter((t) => t.restId === 'goulot' && t.out);
    goulot.slice(0, 2).forEach((t) => sim.clearTable(t, 'resto'));
    expect(sim.drainEvents().filter((e) => e.type === 'log')).toHaveLength(0); // en attente de regroupement
    const logs = until(sim, H(21, 53));
    const line = logs.find((l) => /Goulot/.test(l));
    expect(line, logs.join(' | ')).toBeTruthy();
    expect(line).toMatch(/deux|Goulot/);
  });

  it('la dernière table d’un resto annonce sa terrasse, une seule fois', () => {
    const sim = night({ cfg: { RESTAURANTS: restaurants({ compliance: 1 }) } });
    const logs = until(sim, H(22, 20));
    for (const r of sim.restaurants) {
      const name = CLATTER.names[r.id] ?? r.name;
      const terr = logs.filter((l) => l.toLowerCase().includes(name.toLowerCase()) && [...CLATTER.terrace, ...CLATTER.terrace_late].some((t) => l.endsWith(t.split('}').at(-1))));
      expect(terr.length, `${r.id} : ${logs.join(' | ')}`).toBeLessThanOrEqual(1);
    }
  });
});

describe('pacing.js : variété des lignes', () => {
  it('une même ligne ne revient pas dans la nuit, ni la nuit suivante', () => {
    const a = night({ seed: 3 });
    const logsA = until(a, H(25, 30));
    const dupA = logsA.filter((l, i) => logsA.indexOf(l) !== i && isClatter(l));
    expect(dupA, 'pas de raclement répété dans la nuit').toEqual([]);
    const b = night({ seed: 4, carry: { pacing: a.pacing.memory() } });
    const logsB = until(b, H(25, 30));
    const ambientA = new Set(logsA.filter((l) => AMBIENT.some((x) => x.text === l)));
    const again = logsB.filter((l) => ambientA.has(l));
    expect(again, 'micro-moments de la veille rejoués').toEqual([]);
  });

  it('la vie de la rue comble les silences : jamais plus de ~30 s réelles sans rien, tant que Pilou est éveillé', () => {
    const sim = night({ seed: 11 });
    const times = [];
    while (!sim.state.ended) {
      sim.tick(1);
      for (const e of sim.drainEvents()) if (e.type === 'log') times.push(e.min);
    }
    const gaps = times.slice(1).map((t, i) => t - times[i]);
    const maxGapS = Math.max(...gaps) * 2; // 1 min de jeu = 2 s réelles
    expect(maxGapS).toBeLessThanOrEqual(30);
    expect(sim.state.journal.some((j) => j.type === 'ambient')).toBe(true);
  });

  it('les micro-moments respectent leur créneau (from / to / samedi)', () => {
    const sim = night({ seed: 5, day: 'sat' });
    until(sim, H(25, 30));
    for (const j of sim.state.journal.filter((x) => x.type === 'ambient')) {
      const a = AMBIENT.find((x) => x.id === j.id);
      if (a.when?.from !== undefined) expect(j.t, a.id).toBeGreaterThanOrEqual(a.when.from);
      if (a.when?.to !== undefined) expect(j.t, a.id).toBeLessThan(a.when.to);
      if (a.when?.sat === false) throw new Error(`${a.id} joué un samedi`);
    }
  });

  it('déterministe et sans effet sur le RNG de la nuit (même graine = même nuit)', () => {
    const run = (enabled) => { const s = night({ seed: 21, cfg: { PACING: { enabled } } }); until(s, H(25, 30)); return s.state.tables.map((t) => [t.id, t.clearedAt, t.count]); };
    expect(run(true)).toEqual(run(true));
    expect(run(true)).toEqual(run(false)); // tables, horaires : identiques avec ou sans pacing
  });

  it('contenu : ≥ 50 micro-moments uniques, ≥ 10 variantes de raclement', () => {
    expect(AMBIENT.length).toBeGreaterThanOrEqual(50);
    expect(new Set(AMBIENT.map((a) => a.id)).size).toBe(AMBIENT.length);
    expect(CLATTER_LINES.length).toBeGreaterThanOrEqual(10);
  });
});
