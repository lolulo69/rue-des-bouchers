// Objectifs du soir (§12c.5) : choix à l'entrée de la nuit, coches depuis la nuit, conseil « au lit ».
import { describe, it, expect } from 'vitest';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createCampaign, normalizeContent, playNight, POLICIES, runCampaign, CAMPAIGN_BOTS } from '../../src/sim/index.js';
import { pickObjectives, matchDone, bedtimeHint } from '../../src/sim/objectives.js';
import { createSim } from '../../src/sim/sim.js';
import { RULES } from '../../src/config.js';
import * as narrative from '../../src/sim/narrative.js';

const DIR = join(import.meta.dirname, '..', '..', 'src', 'content');
const K = normalizeContent(await Promise.all(readdirSync(DIR).filter((f) => f.endsWith('.js')).map((f) => import(join(DIR, f)))));

function toNight(c) {
  for (let i = 0; i < 400 && c.step !== 'night'; i++) {
    if (c.step === 'cards') c.resolveCard(c.card().choices.find((x) => x.available)?.i ?? 0);
    else if (c.step === 'koddex') c.koddex(['work', 'work', 'work']);
    else if (c.step === 'actions') c.endAfternoon();
    else if (c.step === 'recap') c.nextDay();
    else if (c.step === 'night') break;
  }
  return c;
}

describe('pickObjectives', () => {
  const L = [
    { id: 'a', stance: 'legal', priority: 3, group: 'photo', done: { event: 'photo_taken' } },
    { id: 'b', stance: 'legal', priority: 9, group: 'photo', done: { event: 'photo_taken', late: true } },
    { id: 'c', stance: 'info', priority: 8, done: null },
    { id: 'd', stance: 'info', priority: 7, done: null },
    { id: 'e', stance: 'legal', when: { twist: 'x' }, done: { event: 'db_taken' } },
    { id: 'f', stance: 'legal', when: { newTool: 't' }, priority: 10, done: { event: 'db_taken' } },
    { id: 'g', stance: 'legal', when: { onDuty: 'benali' }, done: { event: 'police_called', patrol: 'benali' } },
  ];
  it('priorité, un seul par groupe, une seule info, clés de nuit', () => {
    const ids = pickObjectives(L, { check: () => true, twist: 'x', newTools: ['t'], onDuty: ['lemaire'] }).map((o) => o.id);
    expect(ids).toEqual(['f', 'b', 'c', 'e']);
  });
  it('matchDone : filtres de charge', () => {
    expect(matchDone({ event: 'photo_taken', late: true }, { name: 'photo_taken', late: false })).toBe(false);
    expect(matchDone({ event: 'db_taken', min: 65 }, { name: 'db_taken', db: 70 })).toBe(true);
    expect(matchDone({ event: 'db_taken', min: 65 }, { name: 'db_taken', db: 60 })).toBe(false);
    expect(matchDone({ event: 'police_called', asso: true }, { name: 'police_called', asso: false })).toBe(false);
    expect(matchDone({ event: 'photo_taken', table: 'table 4' }, { name: 'photo_taken', table: 'table 4' })).toBe(true);
  });
});

describe('campagne : objectifs du soir', () => {
  it('2 à 4 objectifs par nuit, sur 14 jours, à chaque graine ; ceux du twist et du nouvel outil passent devant', () => {
    for (const seed of [1, 2, 3]) {
      const { c } = runCampaign({ seed, content: K, bot: CAMPAIGN_BOTS.legal(), narrative });
      const nights = c.state.journal.filter((e) => e.type === 'night-start').length;
      const picked = new Set(c.state.journal.filter((e) => e.type === 'objective').map((e) => e.day));
      expect(nights).toBeGreaterThan(5);
      expect(picked.size, `graine ${seed} : des objectifs cochés certaines nuits`).toBeGreaterThan(2);
    }
    const c = toNight(createCampaign({ seed: 4, content: K, narrative }));
    const list = c.tonightObjectives();
    expect(list.length).toBeGreaterThanOrEqual(2);
    expect(list.length).toBeLessThanOrEqual(4);
    const tw = c.tonightTwist();
    if (tw && K.OBJECTIVES.some((o) => o.when?.twist === tw.id)) expect(list.some((o) => K.OBJECTIVES.find((x) => x.id === o.id).when?.twist === tw.id)).toBe(true);
    expect(c.tonightObjectives()).toEqual(list); // stable
  });

  it('le même tirage après une sauvegarde rechargée ; les coches survivent au rechargement', () => {
    const c = toNight(createCampaign({ seed: 5, content: K, narrative }));
    const a = c.tonightObjectives();
    const sim = c.createNight();
    playNight(sim, POLICIES.legal ? POLICIES.legal() : POLICIES.passive(), c);
    const done = c.tonightObjectives().filter((o) => o.done).map((o) => o.id);
    const c2 = createCampaign({ seed: 5, content: K, narrative, save: JSON.parse(JSON.stringify(c.save())) });
    expect(c2.tonightObjectives().map((o) => o.id)).toEqual(a.map((o) => o.id));
    expect(c2.tonightObjectives().filter((o) => o.done).map((o) => o.id)).toEqual(done);
  });

  it('se cochent depuis le journal de la nuit (photo après 22h) et depuis un événement du jeu', () => {
    const c = toNight(createCampaign({ seed: 6, content: K, narrative }));
    c.tonightObjectives();
    c.state.objectives.ids = ['o_gen_late', 'o_d13_last_dossier'];
    const sim = c.createNight();
    while (sim.state.min < 22 * 60 + 20) sim.tick(1);
    const t = sim.state.tables.find((x) => x.out);
    expect(t).toBeTruthy();
    sim.act({ type: 'photo', target: { kind: 'table', id: t.id }, distance: 3, fromWindow: false });
    expect(c.objectivesTick(sim).map((o) => o.id)).toEqual(['o_gen_late']);
    expect(c.objectiveEvent('dossier_opened').map((o) => o.id)).toEqual(['o_d13_last_dossier']);
    expect(c.tonightObjectives().every((o) => o.done)).toBe(true);
  });
});

describe('conseil « au lit »', () => {
  const H = [{ id: 'd1', why: 'done', text: 'D1' }, { id: 'd2', why: 'done', text: 'D2' }, { id: 't1', why: 'tired', text: 'T1' }];
  const B = RULES.bedtime;
  const at = (min) => { const sim = createSim({ seed: 2, day: 1 }); while (sim.state.min < min) sim.tick(1); return sim; };
  it('jamais avant 22h30, ni s’il reste un objectif à faire et que Pilou est en forme', () => {
    expect(bedtimeHint(at(22 * 60), { objectives: [], hints: H })).toBeNull();
    const sim = at(23 * 60);
    sim.state.sleep = 80;
    expect(bedtimeHint(sim, { objectives: [{ stance: 'legal', done: false }], hints: H })).toBeNull();
    expect(bedtimeHint(sim, { objectives: [{ stance: 'legal', done: true }, { stance: 'info', done: false }], hints: H })?.why).toBe('done');
  });
  it('fatigué : dès que le Sommeil est bas, même avec des objectifs ; rien si quelque chose se passe', () => {
    const sim = at(23 * 60);
    sim.state.sleep = B.tiredSleep - 1;
    expect(bedtimeHint(sim, { objectives: [{ stance: 'legal', done: false }], hints: H })?.text).toBe('T1');
    expect(bedtimeHint(sim, { hints: H, busy: 'police' })).toBeNull();
  });
  it('affiché `show` minutes, puis pas avant `every` minutes, avec une autre variante', () => {
    const sim = at(23 * 60);
    sim.state.sleep = 80;
    const mem = {};
    const first = bedtimeHint(sim, { hints: H, mem });
    expect(first).not.toBeNull();
    while (sim.state.min < 23 * 60 + B.show + 1) sim.tick(1);
    expect(bedtimeHint(sim, { hints: H, mem })).toBeNull();
    while (sim.state.min < 23 * 60 + B.every) sim.tick(1);
    const again = bedtimeHint(sim, { hints: H, mem });
    expect(again).not.toBeNull();
    expect(again.id).not.toBe(first.id);
  });
});
