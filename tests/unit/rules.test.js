import { describe, it, expect } from 'vitest';
import { simAt, advance, restaurants, H } from './helpers.js';

describe('22:00 : fermeture des terrasses', () => {
  it('les restos conformes rentrent tout avant 22:05', () => {
    const sim = simAt(H(22, 5), { cfg: { RESTAURANTS: restaurants({ compliance: 1 }) } });
    expect(sim.state.tables.every((t) => !t.out && t.clearedBy === 'resto' && t.clearedAt <= sim.late)).toBe(true);
  });

  it('une table dehors après 22:05 devient une preuve "après 22h", pas avant', () => {
    const cfg = { RESTAURANTS: restaurants({ compliance: 0 }) };
    const sim = simAt(H(22, 0), { cfg });
    const t = sim.state.tables[0];
    expect(t.out).toBe(true);
    sim.act({ type: 'photo', target: { kind: 'table', id: t.id }, distance: 3 });
    expect(sim.state.evidence.some((e) => e.kind === 'late')).toBe(false);
    advance(sim, H(22, 6));
    sim.act({ type: 'photo', target: { kind: 'table', id: t.id }, distance: 3 });
    expect(sim.state.evidence.filter((e) => e.kind === 'late')).toHaveLength(1);
  });

  it('on ne photographie pas une table déjà rentrée', () => {
    const sim = simAt(H(22, 30), { cfg: { RESTAURANTS: restaurants({ compliance: 1 }) } });
    const r = sim.act({ type: 'photo', target: { kind: 'table', id: sim.state.tables[0].id }, distance: 3 });
    expect(r.ok).toBe(false);
    expect(sim.state.evidence.filter((e) => e.type === 'photo')).toHaveLength(0);
  });

  it('raclement de chaises : "une table" tant qu\'il en reste, "sa terrasse" pour la dernière', () => {
    const sim = simAt(H(21, 50), { cfg: { RESTAURANTS: restaurants({ compliance: 1 }) } });
    sim.drainEvents();
    const goulot = sim.state.tables.filter((t) => t.restId === 'goulot');
    sim.clearTable(goulot[0], 'resto');
    expect(sim.drainEvents().map((e) => e.text).filter(Boolean)).toEqual(['Raclement de chaises sur les pavés : Le Goulot rentre une table.']);
    goulot.slice(1, -1).forEach((t) => sim.clearTable(t, 'resto'));
    expect(sim.drainEvents().some((e) => e.text?.includes('sa terrasse'))).toBe(false);
    sim.clearTable(goulot.at(-1), 'resto');
    expect(sim.drainEvents().map((e) => e.text).filter(Boolean)).toEqual(['Raclement de chaises sur les pavés : Le Goulot rentre sa terrasse.']);
  });

  it('chaque resto annonce "sa terrasse" une seule fois, quand tout est rentré', () => {
    const sim = simAt(H(21, 50), { cfg: { RESTAURANTS: restaurants({ compliance: 1 }) } });
    const logs = advance(sim, H(22, 10));
    for (const r of sim.restaurants) expect(logs.filter((l) => l.includes(`${r.name} rentre sa terrasse`))).toHaveLength(1);
  });
});

describe('6 personnes max par table', () => {
  it('au-dessus de 6 = preuve, avec l\'effectif', () => {
    const sim = simAt(H(21), { cfg: { DAYS: { mon: { overLimitChance: 1 } } } });
    expect(sim.state.tables.every((t) => t.count > 6)).toBe(true);
    const t = sim.state.tables[0];
    sim.act({ type: 'photo', target: { kind: 'table', id: t.id }, distance: 3 });
    const ev = sim.state.evidence.find((e) => e.kind === 'over');
    expect(ev.count).toBe(t.count);
  });

  it('6 ou moins = rien à signaler (avant 22h)', () => {
    const sim = simAt(H(21), { cfg: { DAYS: { mon: { overLimitChance: 0 } }, RESTAURANTS: restaurants({ encroachChance: 0 }) } });
    expect(sim.state.tables.every((t) => t.count <= 6)).toBe(true);
    for (const t of sim.state.tables) sim.act({ type: 'photo', target: { kind: 'table', id: t.id }, distance: 3 });
    expect(sim.state.evidence).toHaveLength(0);
  });
});

describe('zone de terrasse et couloir de passage', () => {
  it('sans débordement, toutes les tables restent hors du couloir', () => {
    const sim = simAt(H(21), { cfg: { RESTAURANTS: restaurants({ encroachChance: 0 }) } });
    for (const t of sim.state.tables) expect(sim.encroachment(t)).toBe(0);
  });

  it('un débordement se prouve en mesurant, dans la rue et de près', () => {
    const sim = simAt(H(21), { cfg: { RESTAURANTS: restaurants({ encroachChance: 1 }), DAYS: { mon: { overLimitChance: 0 } } } });
    const t = sim.state.tables[0];
    expect(sim.encroachment(t)).toBeGreaterThan(0.1);
    sim.act({ type: 'photo', target: { kind: 'table', id: t.id }, distance: 3, fromWindow: true });
    sim.act({ type: 'photo', target: { kind: 'table', id: t.id }, distance: 12 });
    expect(sim.state.evidence).toHaveLength(0);
    sim.act({ type: 'photo', target: { kind: 'table', id: t.id }, distance: 3 });
    const ev = sim.state.evidence.find((e) => e.kind === 'corridor');
    expect(ev.encroach).toBeCloseTo(sim.encroachment(t));
    expect(ev.text).toMatch(/empiète de \d+ cm/);
  });
});

describe('samedi', () => {
  it('plus de monde, des buveurs debout, des pipis dans les portes', () => {
    const mon = simAt(H(23), { day: 'mon' });
    const sat = simAt(H(23), { day: 'sat' });
    const people = (s) => s.state.tables.reduce((a, t) => a + t.count, 0);
    expect(people(sat)).toBeGreaterThan(people(mon));
    expect(sat.state.standing.length).toBeGreaterThan(0);
    expect(sat.state.pees.length).toBeGreaterThan(0);
    expect(mon.state.pees).toHaveLength(0);
  });
});
