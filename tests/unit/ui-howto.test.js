import { describe, it, expect } from 'vitest';
import { createCampaign, normalizeContent } from '../../src/sim/index.js';
import { afternoonMenu, howToFor } from '../../src/ui/rules.js';

const base = normalizeContent(Object.values(import.meta.glob('../../src/content/*.js', { eager: true })));

describe('ui : « comment l’obtenir » des actions verrouillées (§12e.3)', () => {
  it('une action qui attend une conversation affiche le texte howTo de l’auteur, pas la condition brute', () => {
    const extra = { id: 'pm_test_talk', label: 'Test', phase: 'afternoon', legality: 'legal', cost: { time: 1 }, requires: { flags: ['talked_waiter'] }, howTo: 'Parlez au serveur pendant la nuit (E)', effects: {} };
    const content = { ...base, ACTIONS: [...base.ACTIONS, extra] };
    const c = createCampaign({ seed: 3, content });
    expect(howToFor(extra, c)).toBe('Parlez au serveur pendant la nuit (E)');
    const row = afternoonMenu(c).find((m) => m.action.id === 'pm_test_talk');
    expect(row.available).toBe(false);
    expect(row.why[0]).toBe('💬 Parlez au serveur pendant la nuit (E)');
    expect(row.why.some((w) => w.startsWith('D’abord'))).toBe(false);
  });
  it('howTo par drapeau ({ drapeau: texte }) ; rien si la condition est remplie', () => {
    const a = { requires: { flags: ['met_klaas', 'talked_waiter'] }, howTo: { talked_waiter: 'Parlez au serveur (E)' } };
    const c = createCampaign({ seed: 3, content: base });
    expect(howToFor(a, c)).toBe('Parlez au serveur (E)');
    expect(howToFor({ requires: {} }, c)).toBe(null);
  });
});
