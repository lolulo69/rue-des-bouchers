// « Ça existe ou ça n'existe pas » (§12e.6) : chaque ligne de nuit du contenu arrive avec son repère de mise en scène,
// porté par son événement 'log' : le metteur en scène le joue au moment où elle s'affiche.
import { describe, it, expect } from 'vitest';
import { createSim } from '../../src/sim/index.js';
import { nightNarrator, barkStage, bellStage } from '../../src/sim/narrative.js';
import { lineStage } from '../../src/sim/stage.js';
import { createRng } from '../../src/sim/rng.js';
import { isStageCue } from '../../src/scene/stageCues.js';

const night = (narrator) => {
  const sim = createSim({ seed: 3, day: 1, narrator });
  const events = [];
  while (!sim.state.ended) { sim.tick(1); events.push(...sim.drainEvents()); }
  return events;
};

describe('repères de mise en scène', () => {
  it('sim.log(ligne, cls, stage) : l’événement log porte le repère', () => {
    const sim = createSim({ seed: 1, day: 1 });
    sim.log('Un scooter passe.', 'ambient', { cue: 'pass:scooter' });
    sim.log({ text: 'Une ligne écrite.', stage: { cue: 'pass:jogger' } });
    sim.log('Les chaises raclent.', '', { cue: 'sim' }); // déjà joué par la nuit : pas d'événement stage
    const ev = sim.drainEvents();
    expect(ev.filter((e) => e.type === 'log').map((e) => e.stage?.cue)).toEqual(['pass:scooter', 'pass:jogger', 'sim']);
  });

  it('les micro-moments de la rue (AMBIENT) et les messages du groupe arrivent avec un repère connu', () => {
    const ev = night();
    const amb = ev.filter((e) => e.type === 'log' && (e.cls === 'ambient' || e.cls === 'phone'));
    expect(amb.length).toBeGreaterThan(3);
    for (const e of amb) expect(isStageCue(e.stage?.cue), e.text).toBe(true);
  });

  it('le narrateur rend { text, stage } (police, témoins, serveur, Klaas) ; la cloche et les bribes ont le leur', () => {
    const narrator = nightNarrator(createRng(7));
    const sim = createSim({ seed: 4, day: 1, narrator });
    while (sim.state.min < 22 * 60 + 10) sim.tick(1);
    sim.act({ type: 'police' });
    sim.act({ type: 'waiter' });
    const logs = [];
    while (!sim.state.ended && sim.state.min < 23 * 60 + 30) { sim.tick(1); logs.push(...sim.drainEvents().filter((e) => e.type === 'log' && e.stage)); }
    expect(logs.some((e) => /police|patrouille|agent/i.test(e.text) || e.stage.cue === 'phone_buzz')).toBe(true);
    const w = narrator('witness', sim, { witness: { kind: 'waiter' } });
    expect(isStageCue(w.stage.cue)).toBe(true);
    expect(narrator('witness', sim, { witness: { kind: 'trace' } })).toBeNull(); // pas de « personne n'a rien vu » quand on est tracé
    for (const st of [barkStage(sim), bellStage('before'), bellStage('strike'), lineStage('WITNESS_LINES', 'nobody')]) expect(isStageCue(st.cue) || st.cue.startsWith('audio:'), st.cue).toBe(true);
  });
});
