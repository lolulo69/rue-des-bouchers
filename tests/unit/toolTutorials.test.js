// Tutoriels pratiques des outils (v1.1, §12b.B) : état et progression côté moteur (game.js affiche et émet les gestes)
import { describe, it, expect } from 'vitest';
import { createCampaign } from '../../src/sim/index.js';
import * as base from '../fixtures/content.js';
import * as tw from '../fixtures/twists.js';

const TOOL_TUTORIALS = [
  { id: 't_move', tool: 'move', trigger: { night: 1, after: 1230, where: 'street' }, steps: [{ text: 'Marchez {key}', key: 'ZQSD', pad: 'LS', done: 'moved' }, { text: 'Courez {key}', key: 'Maj', done: 'ran' }], congrats: 'Bravo.' },
  { id: 't_photo', tool: 'photo', trigger: { night: 1, after: 1240 }, steps: [{ text: 'Photo {key}', key: 'P', done: 'photo_taken' }], congrats: 'Pièce.' },
  { id: 't_db', tool: 'db', trigger: { unlock: 'u_db' }, steps: [{ text: 'Relevé {key}', key: 'B', done: 'db_taken' }] },
];
const content = { ...base, UNLOCKS: tw.UNLOCKS, TOOL_TUTORIALS };
const toNight = (c) => { for (let i = 0; i < 300 && c.step !== 'night'; i++) { if (c.step === 'cards') c.resolveCard(c.card().choices.find((x) => x.available)?.i ?? 0); else if (c.step === 'koddex') c.koddex(['work', 'work', 'work']); else if (c.step === 'actions') c.endAfternoon(); } return c; };

describe('tutoriels pratiques des outils', () => {
  it('dus dans l\'ordre, à l\'heure et au bon endroit ; étapes au geste ; terminé une fois', () => {
    const c = toNight(createCampaign({ seed: 1, content }));
    expect(c.toolTutorialDue({ min: 1225, where: 'street' })).toBeNull(); // avant 20:30
    expect(c.toolTutorialDue({ min: 1231, where: 'apt' })).toBeNull(); // pas au bon endroit
    const t = c.toolTutorialDue({ min: 1231, where: 'street' });
    expect(t.id).toBe('t_move');
    expect(c.tutorialSeen('t_move')).toBe(true);
    expect(c.tutorialSeen('t_move')).toBe(false); // la pause d'horloge n'a lieu qu'à la 1re apparition
    expect(c.tutorialEvent('photo_taken')).toEqual([]); // pas l'étape en cours
    expect(c.tutorialEvent('moved')).toEqual([]);
    expect(c.tutorialStep('t_move')).toBe(1);
    expect(c.tutorialEvent('ran').map((x) => x.id)).toEqual(['t_move']);
    expect(c.state.tutorials.done).toContain('t_move');
    expect(c.toolTutorialDue({ min: 1245, where: 'street' }).id).toBe('t_photo');
    c.tutorialSkip('t_photo');
    expect(c.toolTutorialDue({ min: 1245, where: 'street' })).toBeNull();
  });

  it('un outil débloqué plus tard a son tutoriel à son arrivée ; la progression est sauvegardée', () => {
    const c = toNight(createCampaign({ seed: 2, content }));
    expect(c.toolTutorialDue({ min: 1300 })?.id).not.toBe('t_db'); // u_db : jour 2
    c.state.unlocked.push('u_db');
    for (const id of ['t_move', 't_photo']) c.tutorialSkip(id);
    expect(c.toolTutorialDue({ min: 1300 }).id).toBe('t_db');
    c.tutorialSeen('t_db');
    const again = createCampaign({ content, save: JSON.parse(JSON.stringify(c.save())) });
    expect(again.state.tutorials.seen).toContain('t_db');
    expect(again.tutorialEvent('db_taken').map((x) => x.id)).toEqual(['t_db']);
  });
});
