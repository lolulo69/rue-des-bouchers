import { describe, it, expect } from 'vitest';
import { simAt, advance, restaurants, H } from './helpers.js';
import { lineOfSight } from '../../src/sim/geometry.js';

// Tout le monde voit à coup sûr (p = 1) sauf ceux qu'on coupe ; tables sous la fenêtre garanties dehors.
const cfgWith = (p = {}) => ({
  RESTAURANTS: restaurants({ compliance: 0 }),
  WITNESS: {
    darkFactor: 1,
    klaas: { p: p.klaas ?? 0, near: [200, 200], far: [300, 300] }, seb_nico: { p: p.seb_nico ?? 0, catLeave: [H(24), H(24)] },
    waiter: { p: p.waiter ?? 0 }, customers: { p: p.customers ?? 0, wetBonus: 0, filmChance: 0 },
  },
});

describe('ligne de vue', () => {
  it('la rue est un canyon : même façade = pas de vue, en face = vue', () => {
    const W = 3.2;
    expect(lineOfSight({ x: -3.4, y: 5, z: 0 }, { x: -3.1, y: 1, z: 6 }, W)).toBe(false);
    expect(lineOfSight({ x: -3.4, y: 5, z: 0 }, { x: 3.15, y: 7, z: -3 }, W)).toBe(true);
    expect(lineOfSight({ x: -3.4, y: 5, z: 0 }, { x: -0.7, y: 1.6, z: 3 }, W)).toBe(true);
  });
});

describe('témoins du seau d\'eau', () => {
  it('Klaas voit tout depuis sa fenêtre… tant qu\'il ne dort pas (01:00)', () => {
    const sim = simAt(H(22, 30), { cfg: cfgWith({ klaas: 1 }) });
    const r = sim.act({ type: 'bucket' });
    expect(r.seen.map((w) => w.kind)).toEqual(['klaas']);
    expect(sim.state.risk).toBeGreaterThan(0);
    expect(sim.state.journal.some((e) => e.type === 'klaas-note')).toBe(true);

    const night = simAt(H(25, 5), { cfg: cfgWith({ klaas: 1 }) });
    expect(night.potentialWitnesses(night.cfg.ANCHORS.pilouWindow).some((w) => w.kind === 'klaas')).toBe(false);
  });

  it('Klaas, au fond de la place : à l\'œil nu de près seulement, aux jumelles toute la rue', () => {
    const naked = { WITNESS: { klaas: { binoculars: { every: [999, 999] } } } };
    const dusk = simAt(H(20, 31), { cfg: naked });
    const night = simAt(H(23), { cfg: naked });
    const k = (s, z) => s.potentialWitnesses({ x: -3.4, y: 8, z }).find((w) => w.kind === 'klaas')?.p ?? 0;
    expect(k(dusk, 0)).toBeGreaterThan(k(night, 0));
    expect(k(night, 30)).toBeGreaterThan(k(night, 0));
    expect(k(night, -24)).toBe(0); // la fenêtre de Pilou, de nuit, à l'œil nu : trop loin
    night.klaasAlert(); // grabuge → jumelles
    expect(night.klaasWatching()).toBe(true);
    expect(k(night, -24)).toBeGreaterThan(0.5);
    expect(night.potentialWitnesses({ x: -3.4, y: 8, z: -24 }).find((w) => w.kind === 'klaas').name).toContain('jumelles');
  });

  it('la police dans la rue ou le fracas des chaises font sortir les jumelles', () => {
    const sim = simAt(H(21), { cfg: { WITNESS: { klaas: { binoculars: { every: [999, 999] } } } } });
    expect(sim.klaasWatching()).toBe(false);
    sim.clearTable(sim.state.tables[0], 'resto');
    expect(sim.klaasWatching()).toBe(true);
  });

  it('le chat sur le balcon = Seb & Nico sont là ; chat rentré = personne', () => {
    const sim = simAt(H(23), { cfg: cfgWith({ seb_nico: 1 }) });
    expect(sim.catPresent()).toBe(true);
    expect(sim.act({ type: 'bucket' }).seen.map((w) => w.kind)).toEqual(['seb_nico']);
    const later = simAt(H(24, 30), { cfg: cfgWith({ seb_nico: 1 }) });
    expect(later.catPresent()).toBe(false);
  });

  it('le serveur et les clients arrosés peuvent voir, et filmer', () => {
    const cfg = cfgWith({ waiter: 1, customers: 1 });
    cfg.WITNESS.customers.filmChance = 1;
    const sim = simAt(H(22, 30), { cfg });
    const { seen } = sim.act({ type: 'bucket' });
    expect(seen.some((w) => w.kind === 'waiter')).toBe(true);
    expect(seen.some((w) => w.kind === 'customers' && w.filmed)).toBe(true);
    expect(sim.state.witnessMemories.length).toBe(seen.length);
  });

  it('Risque seulement si quelqu\'un a vu', () => {
    const sim = simAt(H(22, 30), { cfg: cfgWith() });
    const r = sim.act({ type: 'bucket' });
    expect(r.seen).toEqual([]);
    expect(sim.state.risk).toBe(0);
    expect(sim.state.tables.some((t) => t.clearedBy === 'bucket')).toBe(true);
  });

  it('la nuit, les gens de la rue remarquent moins (obscurité)', () => {
    const cfg = { RESTAURANTS: restaurants({ compliance: 0 }) };
    const dusk = simAt(H(20, 31), { cfg });
    const night = simAt(H(23), { cfg });
    const p = (s) => s.potentialWitnesses(s.cfg.ANCHORS.pilouWindow).find((w) => w.kind === 'customers').p;
    expect(p(night)).toBeLessThan(p(dusk));
  });

  it('le seau se remplit : pas deux seaux de suite', () => {
    const sim = simAt(H(22, 30), { cfg: cfgWith() });
    sim.act({ type: 'bucket' });
    expect(sim.act({ type: 'bucket' })).toMatchObject({ ok: false, reason: 'refill' });
    advance(sim, H(22, 46));
    expect(sim.act({ type: 'bucket' }).ok).toBe(true);
  });
});

describe('seuils de Risque', () => {
  const who = [{ id: 'test' }];
  it('avertissement, plainte, puis garde à vue (fin de nuit)', () => {
    const sim = simAt(H(22));
    sim.addRisk(sim.cfg.RISK.warning, 'test', who);
    expect(sim.drainEvents().some((e) => e.text?.includes('circule'))).toBe(true);
    sim.addRisk(sim.cfg.RISK.complaint - sim.cfg.RISK.warning, 'test', who);
    expect(sim.drainEvents().some((e) => e.text?.includes('plainte'))).toBe(true);
    expect(sim.state.ended).toBe(false);
    sim.addRisk(sim.cfg.RISK.custody, 'test', who);
    expect(sim.state).toMatchObject({ ended: true, endReason: 'custody' });
  });

  it('sans témoin, le Risque ne bouge pas', () => {
    const sim = simAt(H(22));
    sim.addRisk(50, 'test', []);
    expect(sim.state.risk).toBe(0);
  });
});

describe('le serveur renvoyé (qa/coherence.md pass 3)', () => {
  it('Théo renvoyé : un nouveau serveur le remplace (témoin et nom différents), Théo n\'est plus là', async () => {
    const { createSim, makeConfig } = await import('../../src/sim/index.js');
    const cfg = makeConfig({ RESTAURANTS: restaurants({ compliance: 0 }) });
    const theo = createSim({ seed: 1, cfg });
    const fired = createSim({ seed: 1, cfg, carry: { flags: ['waiter_fired'] } });
    expect(theo.waiterId).toBe('theo');
    expect(fired.waiterId).toBe('nouveau');
    for (const s of [theo, fired]) while (s.state.min < H(22, 30)) s.tick(0.5);
    const waiterOf = (s) => s.potentialWitnesses(s.cfg.ANCHORS.pilouWindow).find((w) => w.kind === 'waiter');
    expect(waiterOf(theo).name).toBe(cfg.WITNESS.waiter.name);
    expect(waiterOf(fired).name).toBe(cfg.WITNESS.newWaiter.name);
    expect(waiterOf(fired).waiterId).toBe('nouveau');
    // le nouveau serveur répond toujours (on peut lui demander de rentrer les tables)
    expect(fired.act({ type: 'waiter' }).reason).not.toBe('offduty');
  });
});
