import { describe, it, expect } from 'vitest';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createCampaign, normalizeContent, checkInvariants } from '../../src/sim/index.js';
import { availableNightActions, performNightAction, NIGHT_ACTION_SPECS, LOCATIONS, SCENE } from '../../src/sim/nightActions.js';

const DIR = join(import.meta.dirname, '..', '..', 'src', 'content');
const content = normalizeContent(await Promise.all(readdirSync(DIR).filter((f) => f.endsWith('.js')).map((f) => import(join(DIR, f)))));
const NIGHT = content.ACTIONS.filter((a) => a.phase === 'night' && !a.sim);

// Campagne réelle amenée jusqu'à la nuit du jour 1, avec un état de départ préparé (drapeaux, stats)
function night({ seed = 3, flags = [], stats = {}, day } = {}) {
  const c = createCampaign({ seed, content });
  for (let guard = 0; c.step !== 'night' && guard < 200; guard++) {
    if (c.step === 'cards') { const card = c.card(); const ok = card.choices.findIndex((x) => x.available); c.resolveCard(Math.max(0, ok)); }
    else if (c.step === 'koddex') c.koddex(['work', 'work', 'work']);
    else if (c.step === 'actions') c.endAfternoon();
  }
  if (day) c.state.day = day;
  c.apply({ setFlags: flags, ...stats }, 'engine', 'test');
  return { c, sim: c.createNight() };
}
const tickTo = (sim, min) => { while (sim.state.min < min && !sim.state.ended) sim.tick(0.5); };

// Un état qui satisfait `requires` (drapeaux + stats), sans `chance`
const setup = (a) => {
  const r = a.requires ?? {};
  const stats = {};
  for (const [k, e] of Object.entries(r.stats ?? {})) { const v = Number(String(e).replace(/[^\d.]/g, '')); stats[k] = v + 5; }
  return { flags: r.flags ?? [], stats, day: r.day ? [r.day].flat()[0] : undefined };
};

describe('nightActions : couverture du contenu', () => {
  it('chaque action de nuit du contenu (sans `sim`) a une fiche, un lieu connu et un créneau', () => {
    expect(NIGHT.length).toBeGreaterThan(10);
    for (const a of NIGHT) {
      const s = NIGHT_ACTION_SPECS[a.id];
      expect(s, a.id).toBeTruthy();
      expect(LOCATIONS[s.at], `${a.id} → ${s.at}`).toBeTruthy();
      expect(s.window[0]).toBeLessThan(s.window[1]);
      if (s.needs) expect(SCENE[s.needs], s.needs).toBeTruthy();
    }
    for (const id of Object.keys(NIGHT_ACTION_SPECS)) expect(NIGHT.some((a) => a.id === id), id).toBe(true);
  });

  it('chaque action est jouable depuis au moins un état (bon moment, bon endroit)', () => {
    for (const a of NIGHT) {
      const spec = NIGHT_ACTION_SPECS[a.id];
      const { c, sim } = night(setup(a));
      tickTo(sim, Math.max(spec.window[0], sim.state.min) + 1);
      if (spec.needs === 'policeOnsite') {
        sim.act({ type: 'police' });
        for (let i = 0; i < 300 && sim.state.police?.phase !== 'onsite'; i++) sim.tick(0.5);
      }
      const player = { where: LOCATIONS[spec.at].player[0], pos: LOCATIONS[spec.at].pos(sim) };
      const item = availableNightActions(sim, c, player).find((x) => x.id === a.id);
      expect(item, a.id).toBeTruthy();
      expect(item.available, `${a.id} : ${item.reason}`).toBe(true);
      const before = sim.state.min;
      const r = performNightAction(sim, c, a.id, player);
      expect(r.ok, `${a.id} : ${r.reason}`).toBe(true);
      expect(sim.state.min - before).toBeGreaterThanOrEqual(Math.min(r.minutes, sim.cfg.RULES.nightEnd - before) - 0.01);
      expect(sim.state.journal.some((e) => e.type === 'night-action' && e.id === a.id)).toBe(true);
      expect(checkInvariants(sim), a.id).toEqual([]);
    }
  });
});

describe('nightActions : règles', () => {
  it('lieu : depuis la fenêtre, pas de sabotage de terrasse ; trop loin dans la rue, grisé', () => {
    const { c, sim } = night();
    tickTo(sim, 24 * 60 + 10);
    const atWindow = availableNightActions(sim, c, { where: 'window' }).find((x) => x.id === 'night_sabotage_locks');
    expect(atWindow.available).toBe(false);
    expect(atWindow.reason).toMatch(/Il faut être/);
    const far = availableNightActions(sim, c, { where: 'street', pos: { x: 0, z: 40 } }).find((x) => x.id === 'night_sabotage_locks');
    expect(far.reason).toMatch(/Approchez-vous/);
    expect(performNightAction(sim, c, 'night_sabotage_locks', { where: 'window' }).ok).toBe(false);
    // Sans `player` (bots), le lieu n'est pas vérifié
    expect(availableNightActions(sim, c).find((x) => x.id === 'night_sabotage_locks').available).toBe(true);
  });

  it('créneau et scène : pas de sabotage de chaises à 21h, pas de cuisine après 23h', () => {
    const { c, sim } = night({ flags: ['waiter_informant'] });
    tickTo(sim, 21 * 60);
    expect(availableNightActions(sim, c).find((x) => x.id === 'night_sabotage_chairs').reason).toMatch(/Pas avant/);
    tickTo(sim, 23 * 60 + 5);
    const k = availableNightActions(sim, c).find((x) => x.id === 'night_saboter_cuisine');
    expect(k.available).toBe(false);
  });

  it('anti-spoiler : une action dont les drapeaux requis manquent n\'est pas listée', () => {
    const { c, sim } = night();
    expect(availableNightActions(sim, c).some((x) => x.id === 'night_borrow_power')).toBe(false);
  });

  it('once par campagne, repeat dans la nuit', () => {
    const { c, sim } = night();
    tickTo(sim, 22 * 60);
    expect(performNightAction(sim, c, 'night_camera_awning').ok).toBe(true);
    expect(availableNightActions(sim, c).some((x) => x.id === 'night_camera_awning')).toBe(false);
    const { c: c2, sim: s2 } = night({ seed: 5 });
    tickTo(s2, 20 * 60 + 40);
    expect(performNightAction(s2, c2, 'night_film_faces').ok).toBe(true);
    expect(availableNightActions(s2, c2).find((x) => x.id === 'night_film_faces')?.available).toBe(true);
  });

  it('sans témoin, le Risque ne bouge pas ; avec témoins, il monte et les mémoires sont notées', () => {
    let quiet = 0, seenRuns = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const { c, sim } = night({ seed });
      tickTo(sim, 25 * 60 + 10); // 1h10 : Klaas dort, la terrasse est rangée
      const risk = sim.state.risk;
      const r = performNightAction(sim, c, 'night_sabotage_locks');
      expect(r.ok).toBe(true);
      if (!r.seen.length) { quiet++; expect(sim.state.risk).toBe(risk); }
      expect(checkInvariants(sim)).toEqual([]);
    }
    for (let seed = 1; seed <= 40; seed++) {
      const { c, sim } = night({ seed });
      tickTo(sim, 21 * 60 + 45); // terrasse pleine, serveur là, teckel en ronde
      const risk = sim.state.risk;
      const r = performNightAction(sim, c, 'night_stink_bomb');
      if (r.seen.length) {
        seenRuns++;
        expect(sim.state.risk).toBeGreaterThan(risk);
        expect(sim.state.witnessMemories.length).toBeGreaterThan(0);
        expect(c.state.witnessMemories.some((w) => w.act === 'night_stink_bomb')).toBe(true);
      }
      expect(checkInvariants(sim)).toEqual([]);
    }
    expect(quiet).toBeGreaterThan(20);
    expect(seenRuns).toBeGreaterThan(20);
  });

  it('effet mécanique et crochet art : la boule puante vide la terrasse et émet fx stink', () => {
    const { c, sim } = night();
    tickTo(sim, 21 * 60);
    sim.events.length = 0;
    const r = performNightAction(sim, c, 'night_stink_bomb');
    expect(r.ok).toBe(true);
    expect(sim.state.tables.filter((t) => t.restId === 'bernadette' && t.out).length).toBe(0);
    expect(r.art).toMatchObject({ fx: 'stink', terrace: 'rush' });
    expect(sim.events.some((e) => e.type === 'art' && e.fx === 'stink')).toBe(true);
    expect(sim.state.journal.find((e) => e.type === 'night-action').cleared).toBeGreaterThan(0);
  });

  it('déterministe : même graine, mêmes témoins', () => {
    const run = () => { const { c, sim } = night({ seed: 11 }); tickTo(sim, 22 * 60 + 15); return performNightAction(sim, c, 'night_stink_bomb').seen; };
    expect(run().length).toBeGreaterThanOrEqual(0);
    expect(run()).toEqual(run());
  });

  it('les drapeaux du contenu passent à la campagne (setFlags), le Sommeil/Asso restent dans la nuit', () => {
    const { c, sim } = night();
    tickTo(sim, 22 * 60);
    performNightAction(sim, c, 'night_camera_awning');
    expect(c.has('camera_awning')).toBe(true);
  });
});
