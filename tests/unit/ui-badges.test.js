import { describe, it, expect } from 'vitest';
import { createCampaign, normalizeContent } from '../../src/sim/index.js';
import * as narrative from '../../src/sim/narrative.js';
import { pullFeed } from '../../src/ui/phone.js';
import { phoneUnread, markPhoneSeen, carnetUnread, openCarnet, carnetKeys } from '../../src/ui/badges.js';

const content = normalizeContent(Object.values(import.meta.glob('../../src/content/*.js', { eager: true })));
const meta = { overheard: [] };
// Avance jusqu'au matin suivant (nuits simulées)
function nextMorning(c) {
  const day = c.state.day;
  for (let i = 0; i < 400 && !(c.state.day > day && c.state.phase === 'morning'); i++) {
    if (c.step === 'cards') c.resolveCard(c.card().choices.find((x) => x.available)?.i ?? 0);
    else if (c.step === 'koddex') c.koddex(['work', 'work', 'work']);
    else if (c.step === 'actions') c.endAfternoon();
    else if (c.step === 'night') { const sim = c.createNight(); for (let k = 0; !sim.state.ended && k < 3000; k++) sim.tick(1); c.finishNight(sim); }
    else if (c.step === 'recap') c.nextDay();
  }
}

describe('ui : pastilles de nouveautés (§12c.3)', () => {
  it('téléphone : seuls les messages jamais vus comptent ; ouvrir efface ; le lendemain, seulement les nouveaux', () => {
    const c = createCampaign({ seed: 3, content, narrative });
    pullFeed(c);
    const first = phoneUnread(c, meta).length;
    expect(first).toBeGreaterThan(0);
    markPhoneSeen(c, meta);
    expect(phoneUnread(c, meta)).toHaveLength(0);
    pullFeed(c); // rien de neuf dans la même phase
    expect(phoneUnread(c, meta)).toHaveLength(0);
    nextMorning(c);
    const got = pullFeed(c);
    expect(phoneUnread(c, meta).map((m) => m.id).sort()).toEqual(got.map((g) => g.id).sort());
  });
  it('Carnet : les fiches connues d’emblée ne sont pas « nouvelles » ; ouvrir efface, et ça survit à la sauvegarde', () => {
    const c = createCampaign({ seed: 3, content, narrative });
    const startNew = carnetUnread(c);
    expect(startNew.length).toBeLessThan(carnetKeys(c).length);
    const before = openCarnet(c);
    expect(before.size).toBeGreaterThan(0);
    expect(carnetUnread(c)).toHaveLength(0);
    const c2 = createCampaign({ content, narrative, save: c.save() });
    expect(carnetUnread(c2)).toHaveLength(0);
    expect(c2.state.uiSeen.carnet.length).toBe(c.state.uiSeen.carnet.length);
  });
});
