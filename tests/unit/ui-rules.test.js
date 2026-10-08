import { describe, it, expect } from 'vitest';
import { createCampaign, normalizeContent } from '../../src/sim/index.js';
import * as FLAGS from '../../src/content/flags.js';
import * as CHARACTERS from '../../src/content/characters.js';
import * as ACTIONS from '../../src/content/actions.js';
import * as EVENTS from '../../src/content/events.js';
import * as KODDEX from '../../src/content/koddex.js';
import * as ENDINGS from '../../src/content/endings.js';
import * as COUNTERMOVES from '../../src/content/countermoves.js';
import * as DIALOGUE from '../../src/content/dialogue.js';
import { explain, afternoonMenu, upcomingEvent } from '../../src/ui/rules.js';

const content = normalizeContent([FLAGS, CHARACTERS, ACTIONS, EVENTS, KODDEX, ENDINGS, COUNTERMOVES, DIALOGUE]);

describe('ui/rules : lecture humaine de l’état', () => {
  const c = createCampaign({ seed: 5, content });

  it('explique une condition non remplie, sans dévoiler les drapeaux secrets', () => {
    expect(explain({ stats: { asso: '>=99' } }, c)[0]).toMatch(/^Asso ≥ 99 \(vous : \d+\)$/);
    expect(explain({ day: [5, 14] }, c)).toEqual(['À partir du jour 5']);
    expect(explain({ flags: ['traitor_known'] }, c)).toEqual(['Il vous manque encore quelque chose']);
    expect(explain({ flags: ['press_contacted'] }, c)[0]).toMatch(/^D'abord : /);
    expect(explain({ stats: { asso: '>=0' } }, c)).toEqual([]);
  });

  it('le menu d’après-midi liste toutes les actions, chaque indisponible avec une raison', () => {
    const menu = afternoonMenu(c);
    expect(menu.length).toBe(content.ACTIONS.filter((a) => (a.phase ?? 'afternoon') === 'afternoon').length);
    for (const m of menu) if (!m.available) expect(m.why.length).toBeGreaterThan(0);
  });

  it('prochain événement fixe', () => {
    expect(upcomingEvent(c)?.day).toBe(1);
  });
});
