import { describe, it, expect } from 'vitest';
import { simAt, advance, restaurants, H } from './helpers.js';
import { checkInvariants } from '../../src/sim/index.js';

const late = { RESTAURANTS: restaurants({ compliance: 0, encroachChance: 0 }) };
const untilGone = (sim) => { while (sim.state.police && !sim.state.ended) advance(sim, sim.state.min + 1); };

describe('police municipale', () => {
  it('roster caché : Benali avant 23h le lundi, Lemaire après, le commissaire après un scandale', () => {
    const sim = simAt(H(22));
    expect(sim.patrolOnDuty()).toBe('benali');
    advance(sim, H(23, 1));
    expect(sim.patrolOnDuty()).toBe('lemaire');
    sim.state.scandal = true;
    expect(sim.patrolOnDuty()).toBe('chief');
  });

  it('Benali verbalise : tables rentrées par la police', () => {
    const sim = simAt(H(22, 20), { cfg: { ...late, POLICE: { minAct: 1 } } });
    sim.act({ type: 'police' });
    untilGone(sim);
    expect(sim.state.policeLog[0]).toMatchObject({ patrolId: 'benali', outcome: 'act' });
    expect(sim.state.tables.some((t) => t.clearedBy === 'police')).toBe(true);
  });

  it('complaisance : café offert, consigné comme preuve liée au passage', () => {
    const sim = simAt(H(22, 20), { cfg: { ...late, POLICE: { maxAct: 0, minAct: 0, roster: { mon: ['lemaire', 'lemaire'] }, patrols: { lemaire: { tipoff: { bernadette: 0, default: 0 } } } } } });
    sim.act({ type: 'police' });
    untilGone(sim);
    const ev = sim.state.evidence.find((e) => e.type === 'complaisance');
    expect(ev).toBeDefined();
    expect(ev.callId).toBe(1);
    expect(checkInvariants(sim)).toEqual([]);
  });

  it('complaisance non consignée si Pilou dort et que Klaas ne peut pas voir', () => {
    const sim = simAt(H(22, 20), { cfg: { ...late, POLICE: { maxAct: 0, minAct: 0, roster: { mon: ['lemaire', 'lemaire'] }, patrols: { lemaire: { tipoff: { bernadette: 0, default: 0 } } } }, WITNESS: { klaas: { sleepAt: 0 } } } });
    sim.act({ type: 'police' });
    sim.act({ type: 'sleep', on: true });
    untilGone(sim);
    expect(sim.state.policeLog[0].outcome).toBe('complaisance');
    expect(sim.state.evidence.filter((e) => e.type === 'complaisance')).toHaveLength(0);
  });

  it('le tuyau : tables rentrées juste avant l\'arrivée, ressorties après, et Klaas note tout', () => {
    const sim = simAt(H(22, 20), {
      cfg: { ...late, POLICE: { roster: { mon: ['lemaire', 'lemaire'] }, patrols: { lemaire: { tipoff: { bernadette: 1, default: 1 } } } } },
    });
    sim.act({ type: 'police' });
    const P = sim.state.police;
    advance(sim, P.arriveAt - 0.5);
    const tipped = sim.state.tables.filter((t) => t.clearedBy === 'tipoff');
    expect(tipped.length).toBeGreaterThan(0);
    untilGone(sim);
    expect(sim.state.policeLog[0].outcome).toBe('tipoff');
    advance(sim, sim.state.tipoffs[0].returnAt + 1);
    expect(tipped.every((t) => t.out)).toBe(true);
    expect(sim.state.evidence.some((e) => e.type === 'tipoff' && e.byKlaas)).toBe(true);
    expect(checkInvariants(sim)).toEqual([]);
  });

  it('"c\'est encore vous" : au-delà de 3 appels, plus personne ne vient', () => {
    const sim = simAt(H(22, 10), { cfg: late });
    for (let i = 0; i < 3; i++) {
      expect(sim.act({ type: 'police' }).ok).toBe(true);
      untilGone(sim);
    }
    const r = sim.act({ type: 'police' });
    expect(r).toMatchObject({ ok: false, reason: 'ignored' });
    expect(sim.state.serialComplainer).toBe(true);
    expect(sim.state.police).toBeNull();
  });

  it('un appel pendant qu\'une patrouille est en route ne compte pas', () => {
    const sim = simAt(H(22, 10), { cfg: late });
    sim.act({ type: 'police' });
    expect(sim.act({ type: 'police' })).toMatchObject({ ok: false, reason: 'busy' });
    expect(sim.state.calls).toBe(1);
  });

  it('au nom de l\'Association : plus rapide, mais le bloc le sait', () => {
    const a = simAt(H(22, 10), { cfg: late });
    const b = simAt(H(22, 10), { cfg: late });
    a.act({ type: 'police' });
    b.act({ type: 'police', asso: true });
    const delay = (s) => s.state.police.arriveAt - s.state.police.calledAt;
    expect(delay(b)).toBeCloseTo(delay(a) * a.cfg.POLICE.assoDelayMult);
    expect(b.state.blocKnows).toBe(true);
    expect(b.state.hostility).toBeGreaterThan(0);
    expect(a.state.blocKnows).toBe(false);
  });

  it('Benali est muté après trop de PV', () => {
    const sim = simAt(H(21), { cfg: { DAYS: { mon: { overLimitChance: 1 } }, POLICE: { minAct: 1, maxCalls: 9, patrols: { benali: { transferAfterActs: 2 } } } } });
    for (let i = 0; i < 2; i++) { sim.act({ type: 'police' }); untilGone(sim); }
    expect(sim.state.benaliTransferred).toBe(true);
    expect(sim.patrolOnDuty()).toBe('lemaire');
  });

  it('la police n\'arrive jamais sans appel', () => {
    const sim = simAt(H(25, 30));
    expect(sim.state.journal.some((e) => e.type === 'police-arrive')).toBe(false);
  });
});


describe('cohérence des patrouilles (qa/coherence.md pass 3)', () => {
  it('Benali ne prend jamais de café : sans PV, c\'est un avertissement, jamais une complaisance', () => {
    const outcomes = new Set();
    for (let seed = 1; seed <= 40; seed++) {
      const sim = simAt(H(22, 20), { seed, cfg: { ...late, POLICE: { maxAct: 0, minAct: 0, roster: { mon: ['benali', 'benali'] } } } });
      sim.act({ type: 'police' });
      untilGone(sim);
      const p = sim.state.policeLog[0];
      expect(p.patrolId).toBe('benali');
      outcomes.add(p.outcome);
      expect(sim.state.evidence.some((e) => e.type === 'complaisance')).toBe(false);
      expect(sim.state.bribes).toHaveLength(0);
    }
    expect(outcomes.has('complaisance')).toBe(false);
    expect(outcomes.has('warning')).toBe(true);
  });

  it('l\'avertissement de Benali fait rentrer les tables dans la demi-heure', () => {
    const sim = simAt(H(22, 20), { seed: 3, cfg: { ...late, POLICE: { maxAct: 0, minAct: 0, roster: { mon: ['benali', 'benali'] } } } });
    sim.act({ type: 'police' });
    while (!sim.state.policeLog.length) advance(sim, sim.state.min + 1);
    const at = sim.state.policeLog[0].arrivedAt;
    advance(sim, at + sim.cfg.POLICE.warningClearMinutes + 1);
    expect(sim.state.tables.filter((t) => t.restId === sim.state.policeLog[0].restId && t.out)).toHaveLength(0);
  });

  it('seul Lemaire est complaisant (config)', () => {
    const { patrols } = simAt(H(21)).cfg.POLICE;
    expect(Object.entries(patrols).filter(([, p]) => p.complaisant).map(([id]) => id)).toEqual(['lemaire']);
  });
});
