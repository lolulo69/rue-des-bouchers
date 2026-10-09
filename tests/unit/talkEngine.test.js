// Parler aux gens la nuit (§12e.3) : qui est abordable, quelle conversation, effets et drapeaux des choix.
import { describe, it, expect } from 'vitest';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createCampaign, normalizeContent, PEOPLE, tableKind } from '../../src/sim/index.js';
import * as narrative from '../../src/sim/narrative.js';

const DIR = join(import.meta.dirname, '..', '..', 'src', 'content');
const K = normalizeContent(await Promise.all(readdirSync(DIR).filter((f) => f.endsWith('.js')).map((f) => import(join(DIR, f)))));

function night(seed, at, { day = 3, flags = [] } = {}) {
  const c = createCampaign({ seed, content: K, narrative });
  for (let i = 0; i < 400 && c.step !== 'night'; i++) {
    if (c.step === 'cards') c.resolveCard(c.card().choices.find((x) => x.available)?.i ?? 0);
    else if (c.step === 'koddex') c.koddex(['work', 'work', 'work']);
    else if (c.step === 'actions') c.endAfternoon();
  }
  c.state.day = day;
  if (flags.length) c.apply({ setFlags: flags }, 'engine', 'test');
  const sim = c.createNight();
  while (sim.state.min < at) sim.tick(1);
  return { c, sim };
}
const street = (p) => ({ where: 'street', pos: { x: p.x, z: p.z } });

describe('qui est abordable', () => {
  it('chaque `who` du contenu a sa présence et sa portée dans le moteur', () => {
    for (const t of K.TALK) expect(PEOPLE, t.id).toHaveProperty(t.who);
  });

  it('Jérémie sur sa ronde : « Parler à Jérémie » tout près, rien à 10 m', () => {
    const { c, sim } = night(3, 22 * 60);
    const d = sim.dogPos();
    expect(c.talkTargets(sim, street(d)).map((x) => x.who)).toContain('jeremie');
    expect(c.talkTargets(sim, street(d))[0].label).toBe('Parler à Jérémie');
    expect(c.talkTargets(sim, street({ x: d.x, z: d.z + 10 })).map((x) => x.who)).not.toContain('jeremie');
  });

  it('Klaas : de loin, côté place seulement (un signe)', () => {
    const { c, sim } = night(3, 21 * 60 + 40);
    const k = sim.cfg.ANCHORS.klaasWindow;
    const near = c.talkTargets(sim, street({ x: 0, z: k.z - 30 })).find((x) => x.who === 'klaas');
    expect(near?.far).toBe(true);
    expect(near?.label).toMatch(/Faire signe à Klaas/);
    expect(c.talkTargets(sim, street({ x: 0, z: -20 })).some((x) => x.who === 'klaas')).toBe(false);
  });

  it('tablées : un archétype stable par table et par nuit', () => {
    const { sim } = night(3, 22 * 60);
    for (const t of sim.state.tables) {
      expect(['touristes', 'habitues', 'etudiants']).toContain(tableKind(sim, t));
      expect(tableKind(sim, t)).toBe(tableKind(sim, t));
    }
  });
});

describe('conversations', () => {
  it('première rencontre avec Jérémie : échanges dans l’ordre, drapeaux posés, puis plus jamais la même', () => {
    const { c, sim } = night(4, 22 * 60);
    c.apply({ clearFlags: ['met_jeremie', 'joined_rounds'] }, 'engine', 'test'); // jamais rencontré
    const p = street(sim.dogPos());
    const convo = c.talkStart(sim, 'jeremie', p);
    expect(convo.id).toBe('talk_jeremie_first');
    expect(convo.choices.length).toBeGreaterThanOrEqual(2);
    const join = convo.choices.findIndex((ch) => /venir/i.test(ch.label));
    const r = c.talkChoose(sim, convo, join);
    expect(r.reply).toBeTruthy();
    expect(c.has('met_jeremie') && c.has('joined_rounds')).toBe(true);
    expect(r.next?.k).toBe(1);
    expect(c.talkChoose(sim, r.next, 0).next).toBeNull();
    // le lendemain, c'est la conversation de la ronde
    const again = c.talkStart(sim, 'jeremie', p);
    expect(again?.id ?? null).not.toBe('talk_jeremie_first');
  });

  it('`end: true` clôt la conversation ; une conversation non `once` ne revient pas la même nuit', () => {
    const { c, sim } = night(5, 22 * 60, { flags: ['joined_rounds'] });
    const p = street(sim.dogPos());
    const convo = c.talkStart(sim, 'jeremie', p);
    expect(convo.id).toBe('talk_jeremie_round');
    const i = K.TALK.find((t) => t.id === convo.id).exchanges[0].choices.findIndex((ch) => ch.end);
    expect(c.talkChoose(sim, convo, i).next).toBeNull();
    expect(c.talkStart(sim, 'jeremie', p)).toBeNull();
  });

  it('le serveur : un choix `sim: \'waiter\'` joue la vraie demande (journal de la nuit)', () => {
    const t = K.TALK.find((x) => x.who === 'waiter' && x.exchanges.some((e) => e.choices.some((ch) => ch.sim === 'waiter')));
    expect(t).toBeTruthy();
    for (let seed = 1; seed <= 40; seed++) {
      const { c, sim } = night(seed, 22 * 60 + 20);
      if (!sim.waiterOnDuty()) continue;
      const convo = c.talkStart(sim, 'waiter', street(sim.waiterPos()));
      if (convo?.id !== t.id) continue;
      const i = t.exchanges[0].choices.findIndex((ch) => ch.sim === 'waiter');
      if (i < 0 || !convo.choices[i].available) continue;
      const before = sim.state.journal.filter((e) => e.type === 'action' && e.action === 'waiter').length;
      expect(c.talkChoose(sim, convo, i).sim).toBe('waiter');
      expect(sim.state.journal.filter((e) => e.type === 'action' && e.action === 'waiter').length).toBe(before + 1);
      return;
    }
    throw new Error('aucune nuit où la conversation du serveur avec sa demande se présente');
  });

  it('les conversations vues sont dans la sauvegarde', () => {
    const { c, sim } = night(6, 22 * 60);
    c.talkStart(sim, 'jeremie', street(sim.dogPos()));
    const c2 = createCampaign({ seed: 6, content: K, narrative, save: JSON.parse(JSON.stringify(c.save())) });
    expect(c2.state.seen.talk).toEqual(c.state.seen.talk);
  });
});
