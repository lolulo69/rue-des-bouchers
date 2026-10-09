// Photos inutiles (§12e.8) : « on peut spammer la photo » — plus maintenant.
import { describe, it, expect } from 'vitest';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createSim, createCampaign, normalizeContent, runCampaign, CAMPAIGN_BOTS } from '../../src/sim/index.js';
import { PHOTO_SPAM, RULES } from '../../src/config.js';
import { checkInvariants } from '../../src/sim/invariants.js';
import { isStageCue } from '../../src/scene/stageCues.js';
import * as narrative from '../../src/sim/narrative.js';

const DIR = join(import.meta.dirname, '..', '..', 'src', 'content');
const K = normalizeContent(await Promise.all(readdirSync(DIR).filter((f) => f.endsWith('.js')).map((f) => import(join(DIR, f)))));
// Une table dehors, en règle (pas trop de monde, avant 22h, pas sur le couloir)
function legalTable(sim) {
  return sim.state.tables.find((t) => t.out && t.count <= RULES.maxPeoplePerTable && !sim.isLate() && sim.encroachment(t) <= 0);
}
const shoot = (sim, t) => sim.act({ type: 'photo', target: { kind: 'table', id: t.id }, distance: 3, fromWindow: false });

describe('photo d’une table en règle', () => {
  it('pas de pièce, un client l’a vu (témoin + hostilité), un retour clair et mis en scène', () => {
    const sim = createSim({ seed: 3, day: 1 });
    while (sim.state.min < 21 * 60) sim.tick(1);
    const t = legalTable(sim);
    expect(t).toBeTruthy();
    const h0 = sim.state.hostility;
    const r = shoot(sim, t);
    expect(r).toMatchObject({ ok: false, useless: true, n: 1 });
    expect(sim.state.evidence.length).toBe(0);
    expect(sim.state.hostility).toBe(h0 + PHOTO_SPAM.hostility);
    expect(sim.state.witnessMemories.some((w) => w.act === 'photo sans intérêt')).toBe(true);
    const log = sim.drainEvents().find((e) => e.type === 'log' && e.cls === 'bad');
    expect(log.text).toMatch(/en règle|rien|inutile|n’a rien fait/i);
    expect(isStageCue(log.stage?.cue)).toBe(true);
    expect(sim.state.risk).toBe(sim.state.riskStart ?? sim.state.risk); // une photo : pas encore de Risque
  });

  it('à la 3e de la nuit : harcèlement (Risque, avec témoin), et Seb & Nico râlent une seule fois (Asso)', () => {
    const sim = createSim({ seed: 4, day: 1 });
    while (sim.state.min < 21 * 60) sim.tick(1);
    const t = legalTable(sim);
    const risk0 = sim.state.risk, asso0 = sim.state.asso;
    for (let k = 0; k < PHOTO_SPAM.harassFrom - 1; k++) shoot(sim, t);
    expect(sim.state.risk).toBe(risk0);
    shoot(sim, t); shoot(sim, t);
    expect(sim.state.risk).toBe(risk0 + 2 * PHOTO_SPAM.harassRisk);
    expect(sim.state.asso).toBe(asso0 - PHOTO_SPAM.grumbleAsso);
    expect(sim.drainEvents().filter((e) => e.type === 'log' && e.cls === 'phone').length).toBe(1);
    expect(checkInvariants(sim)).toEqual([]);
  });

  it('une vraie photo reste gratuite', () => {
    const sim = createSim({ seed: 5, day: 1 });
    while (sim.state.min < 22 * 60 + 15) sim.tick(1);
    const t = sim.state.tables.find((x) => x.out);
    const h0 = sim.state.hostility;
    expect(shoot(sim, t).ok).toBe(true);
    expect(sim.state.hostility).toBe(h0);
    expect(sim.state.uselessPhotos ?? 0).toBe(0);
  });
});

describe('campagne : harcèlement et crédibilité', () => {
  it('le drapeau photo_harassment après une nuit de mitraillage, et un malus de Dossier à la commission', () => {
    const c = createCampaign({ seed: 6, content: K, narrative });
    for (let i = 0; i < 400 && c.step !== 'night'; i++) {
      if (c.step === 'cards') c.resolveCard(c.card().choices.find((x) => x.available)?.i ?? 0);
      else if (c.step === 'koddex') c.koddex(['work', 'work', 'work']);
      else if (c.step === 'actions') c.endAfternoon();
    }
    const sim = c.createNight();
    while (sim.state.min < 21 * 60) sim.tick(1);
    const t = legalTable(sim);
    for (let k = 0; k < 8; k++) shoot(sim, t);
    while (!sim.state.ended) sim.tick(1);
    c.finishNight(sim);
    expect(c.has('photo_harassment')).toBe(true);
    expect(c.state.uselessPhotos).toBe(8);
  });

  it('les bots ne mitraillent pas : §13.H tient (pas de harcèlement chez les bots)', () => {
    for (const bot of ['legal', 'diplomat', 'mixed']) {
      const { c } = runCampaign({ seed: 2, content: K, bot: CAMPAIGN_BOTS[bot](), narrative });
      expect(c.state.uselessPhotos ?? 0, bot).toBeLessThanOrEqual(PHOTO_SPAM.credibility.free);
      expect(c.has('photo_harassment'), bot).toBe(false);
    }
  });
});
