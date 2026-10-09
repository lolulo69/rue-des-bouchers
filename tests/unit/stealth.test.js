// Discrétion jouable (GAME_DESIGN §12d, §13.N) : attention des témoins, diversions, fenêtres des twists, déguisement,
// rue vide après 1h. Les taux « vu / pas vu » sont mesurés sur des graines (même chemin que le joueur : c.doNightAction).
import { describe, it, expect } from 'vitest';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createCampaign, normalizeContent, createSim, busyReason, whoWatches, nightClock } from '../../src/sim/index.js';
import { divertAttention, attentionFactor, activeAttention } from '../../src/sim/witness.js';
import { RULES, WITNESS } from '../../src/config.js';
import * as narrative from '../../src/sim/narrative.js';

const DIR = join(import.meta.dirname, '..', '..', 'src', 'content');
const K = normalizeContent(await Promise.all(readdirSync(DIR).filter((f) => f.endsWith('.js')).map((f) => import(join(DIR, f)))));
const ALL = ['klaas', 'seb_nico', 'waiter', 'dede', 'ghislain', 'customers', 'patrol'];
const TURN_IDS = [...ALL, 'jeremie', 'biloute', 'tatie']; // §12e.4 : les alliés aussi

// Une nuit de campagne (jour 5, tous les outils, Seb & Nico et la ronde connus) jusqu'à `at`
function night(seed, at, flags = []) {
  const c = createCampaign({ seed, content: K, narrative });
  for (let i = 0; i < 400 && c.step !== 'night'; i++) {
    if (c.step === 'cards') c.resolveCard(c.card().choices.find((x) => x.available)?.i ?? 0);
    else if (c.step === 'koddex') c.koddex(['work', 'work', 'work']);
    else if (c.step === 'actions') c.endAfternoon();
  }
  c.state.unlocked = K.UNLOCKS.map((u) => u.id);
  c.state.day = 5;
  c.apply({ setFlags: ['met_seb_nico', 'joined_rounds', ...flags] }, 'engine', 'test');
  const sim = c.createNight();
  while (sim.state.min < at) sim.tick(1);
  return { c, sim };
}
// Part des essais où l'acte n'est vu par personne
function unseenRate(act, at, prep, seeds = 120) {
  let n = 0, unseen = 0;
  for (let seed = 1; seed <= seeds; seed++) {
    const { c, sim } = night(seed, at);
    if (prep && prep(c, sim) === false) continue;
    const r = c.doNightAction(sim, act);
    if (!r.ok) continue;
    n++;
    if (!r.seen.length) unseen++;
  }
  return { n, rate: unseen / Math.max(1, n) };
}

describe('attention des témoins', () => {
  it('un témoin détourné voit beaucoup moins, le temps de la fenêtre, puis revient', () => {
    const sim = createSim({ seed: 3, day: 1 });
    while (sim.state.min < 22 * 60 + 10) sim.tick(1);
    const pos = { x: -2, y: 1.2, z: -24 };
    const before = sim.potentialWitnesses(pos).filter((w) => w.kind === 'customers');
    expect(before.length).toBeGreaterThan(0);
    divertAttention(sim, { source: 'diversion', id: 'test', turns: ['customers'], minutes: 2 });
    const during = sim.potentialWitnesses(pos).filter((w) => w.kind === 'customers');
    for (const [i, w] of during.entries()) {
      expect(w.distracted).toBe(true);
      expect(w.p).toBeCloseTo(before[i].p * WITNESS.attention.away, 6);
    }
    expect(attentionFactor(sim, 'klaas')).toBe(1); // pas visé : inchangé
    expect(busyReason(sim)).toBe('window'); // l'horloge ralentit pendant la fenêtre
    expect(nightClock(sim).scale).toBe(RULES.clock.windowScale);
    const w = activeAttention(sim)[0];
    expect(w.until - w.from).toBe(WITNESS.attention.minutes[0]); // §12e.1 : 2 min demandées → 5 min au moins
    while (sim.state.min < w.until + 0.01) sim.tick(0.5);
    expect(activeAttention(sim)).toEqual([]);
    expect(sim.potentialWitnesses(pos).some((w) => w.distracted)).toBe(false);
  });

  it('« patrol » vise la patrouille (Dédé, Ghislain, la police : témoins tirés par nightActions)', () => {
    const sim = createSim({ seed: 3, day: 1 });
    divertAttention(sim, { source: 'window', id: 'w', turns: ['patrol', 'dede'], minutes: 3 });
    expect(attentionFactor(sim, 'police')).toBe(WITNESS.attention.away);
    expect(attentionFactor(sim, 'dede')).toBe(WITNESS.attention.away);
    expect(attentionFactor(sim, 'ghislain')).toBe(1);
    divertAttention(sim, { source: 'diversion', id: 'b', turns: ['biloute', 'tatie'], minutes: 5 });
    expect(attentionFactor(sim, 'jeremie')).toBe(WITNESS.attention.away); // le teckel emmène Jérémie
  });
});

describe('diversions (contrat §14 : diversion { turns, minutes, cooldown, traceRisk })', () => {
  const divs = K.ACTIONS.filter((a) => a.diversion);
  it('au moins cinq diversions dans le contenu, aux témoins connus', () => {
    expect(divs.length).toBeGreaterThanOrEqual(5);
    for (const a of divs) for (const t of a.diversion.turns) expect(TURN_IDS, a.id).toContain(t);
  });

  it('une diversion ouvre une fenêtre après sa préparation, puis attend son délai avant de resservir', () => {
    const { c, sim } = night(4, 22 * 60 + 15);
    const a = K.ACTIONS.find((x) => x.id === 'night_firecracker');
    const r = c.doNightAction(sim, a.id);
    expect(r.ok).toBe(true);
    const w = activeAttention(sim).find((x) => x.id === a.id);
    expect(w).toMatchObject({ source: 'diversion', turns: a.diversion.turns });
    const [lo, hi] = WITNESS.attention.minutes;
    expect(w.until - w.from).toBe(Math.min(hi, Math.max(lo, a.diversion.minutes)));
    const again = c.doNightAction(sim, a.id);
    expect(again.ok).toBe(false);
    expect(again.reason).toMatch(/Trop tôt pour recommencer/);
    while (sim.state.min < w.from + a.diversion.cooldown) sim.tick(1);
    expect(c.doNightAction(sim, a.id).ok).toBe(true);
  });

  it('traceRisk : on remonte parfois jusqu’à Pilou (≈ traceRisk × déguisement), avec les effets de witnessed', () => {
    const a = K.ACTIONS.find((x) => x.id === 'night_fake_alert');
    let traced = 0, n = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const { c, sim } = night(seed, 21 * 60);
      const r = c.doNightAction(sim, a.id);
      if (!r.ok) continue;
      n++;
      if (r.traced) traced++;
    }
    expect(n).toBeGreaterThan(150);
    expect(traced / n).toBeGreaterThan(a.diversion.traceRisk - 0.12);
    expect(traced / n).toBeLessThan(a.diversion.traceRisk + 0.12);
  });
});

describe('vu ou pas vu : une diversion ou une fenêtre rend l’illégal faisable (§12d.6)', () => {
  // 22h15, terrasse pleine : la boule puante sans préparation est presque toujours vue
  const AT = 22 * 60 + 15;
  const without = unseenRate('night_stink_bomb', AT);
  const withDiversion = unseenRate('night_stink_bomb', AT, (c, sim) => c.doNightAction(sim, 'night_firecracker').ok);
  const inWindow = unseenRate('night_stink_bomb', AT, (c, sim) => { divertAttention(sim, { source: 'window', id: 't', turns: ALL, minutes: 2 }); });
  it(`sans rien : ≤ 10 % pas vu (mesuré ${Math.round(without.rate * 100)} %)`, () => {
    expect(without.n).toBeGreaterThan(100);
    expect(without.rate).toBeLessThanOrEqual(0.1);
  });
  it(`après un pétard : ≥ 30 % pas vu (mesuré ${Math.round(withDiversion.rate * 100)} %)`, () => {
    expect(withDiversion.n).toBeGreaterThan(100);
    expect(withDiversion.rate).toBeGreaterThanOrEqual(0.3);
  });
  it(`dans une fenêtre du twist : ≥ 30 % pas vu (mesuré ${Math.round(inWindow.rate * 100)} %)`, () => {
    expect(inWindow.rate).toBeGreaterThanOrEqual(0.3);
  });
});

describe('fenêtres naturelles des twists (sim.windows)', () => {
  it('à leur heure : les témoins visés regardent ailleurs, le texte s’affiche, puis ça se referme', () => {
    const twist = { id: 'tw_test', title: 'Test', sim: { windows: [{ at: 22 * 60 + 12, minutes: 2, turns: ['customers', 'waiter'], text: 'BUUUT ! Toute la terrasse regarde l’écran.' }] } };
    const sim = createSim({ seed: 5, day: 1, twist });
    while (sim.state.min < 22 * 60 + 12.5) sim.tick(0.5);
    expect(activeAttention(sim).map((a) => a.source)).toEqual(['window']);
    expect(attentionFactor(sim, 'customers')).toBe(WITNESS.attention.away);
    expect(sim.state.journal.some((e) => e.type === 'attention' && e.source === 'window')).toBe(true);
    while (sim.state.min < 22 * 60 + 12 + WITNESS.attention.minutes[0] + 0.5) sim.tick(0.5);
    expect(activeAttention(sim)).toEqual([]);
  });
});

describe('déguisement et fenêtre tardive', () => {
  it('night_disguise : la capuche compte tout de suite dans la nuit', () => {
    const { c, sim } = night(6, 21 * 60);
    expect(sim.disguise).toBe(1);
    expect(c.doNightAction(sim, 'night_disguise').ok).toBe(true);
    expect(sim.disguise).toBe(0.6);
    expect(c.has('disguise_hood')).toBe(true);
  });

  it('la nuit finit à 2h30 ; après 1h, plus de terrasse ni de buveurs, Klaas dort', () => {
    const sim = createSim({ seed: 7, day: 'sat' });
    while (sim.state.min < RULES.streetEmptyAt + 1) sim.tick(1);
    expect(sim.state.tables.filter((t) => t.out)).toEqual([]);
    expect(sim.activeStanding()).toEqual([]);
    expect(sim.klaasAwake()).toBe(false);
    while (!sim.state.ended) sim.tick(1);
    expect(sim.state.min).toBeGreaterThanOrEqual(26 * 60 + 30);
    expect(sim.state.journal.some((e) => e.type === 'table-return' && e.t > RULES.streetEmptyAt)).toBe(false);
  });
});

describe('« Qui regarde ? » (HUD) et conseil « au lit » (§12d)', () => {
  it('whoWatches : qui peut voir Pilou dans la rue, et qui regarde ailleurs pendant une diversion', () => {
    const { c, sim } = night(8, 22 * 60 + 15);
    const pos = { x: -1.5, y: 1.2, z: -22 };
    const before = whoWatches(sim, pos);
    expect(before.some((w) => w.key === 'customers' && w.count > 0 && !w.distracted)).toBe(true);
    expect(c.doNightAction(sim, 'night_call_landline').ok).toBe(true);
    const during = whoWatches(sim, pos);
    for (const k of ['waiter', 'dede', 'ghislain']) { const w = during.find((x) => x.key === k); if (w) expect(w.distracted, k).toBe(true); }
    expect(during.find((x) => x.key === 'customers')?.distracted).toBe(false);
  });

  it('pas de « au lit » à qui a de l’illégal possible sans être « légal » : une fois « la rue se vide après 1h »', () => {
    const { c, sim } = night(9, 22 * 60 + 40);
    sim.state.sleep = 10; // épuisé : d'ordinaire, « allez vous allonger »
    const h = c.bedtimeHint(sim);
    expect(h?.why).toBe('late');
    while (sim.state.min < 22 * 60 + 40 + RULES.bedtime.show + 2) sim.tick(1);
    expect(c.bedtimeHint(sim)).toBeNull(); // dit une fois
    c.apply({ setFlags: ['stance_legal'] }, 'engine', 'test');
    expect(c.bedtimeHint(sim)?.why).toBe('tired');
  });

  it('tutoriel « Fenêtre propice » : dû seulement quand une fenêtre est ouverte', () => {
    const { c } = night(10, 21 * 60);
    const t = K.TOOL_TUTORIALS.find((x) => x.trigger?.window);
    expect(t).toBeTruthy();
    c.state.tutorials.done = K.TOOL_TUTORIALS.filter((x) => x.id !== t.id).map((x) => x.id);
    expect(c.toolTutorialDue({ min: 22 * 60, where: 'street', window: false })).toBeNull();
    expect(c.toolTutorialDue({ min: 22 * 60, where: 'street', window: true })?.id).toBe(t.id);
  });
});
