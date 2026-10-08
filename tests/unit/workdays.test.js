// Bureau ou télétravail (§12b.D) côté moteur ; le contenu (src/content/workdays.js) a son propre test de forme.
import { describe, it, expect } from 'vitest';
import { createCampaign, createSim, makeConfig, SAVE_VERSION } from '../../src/sim/index.js';
import { workplacePlan } from '../../src/sim/campaign.js';
import { evalCondition } from '../../src/sim/conditions.js';
import * as base from '../fixtures/content.js';

const WORKDAYS = {
  commute: [{ id: 'ride', lines: ['Le vélo démarre.'], effects: { sleep: 1 } }],
  office: [{ id: 'coffee', speaker: 'stephane', lines: ['Des vibes.'] }],
  home: { distractions: [{ id: 'terrace_1130', title: 'La terrasse à 11h30', text: 'On installe déjà.', choices: [{ label: 'Photo', effects: { dossier: 1 } }, { label: 'Rester concentré' }] }], calls: [] },
  koddex: { office: [], home: [{ id: 'clode_home', speaker: 'clode', lines: ['Bonjour depuis le salon.'] }] },
};
const content = { ...base, WORKDAYS };
const morningCards = (c) => { const ids = []; while (c.step === 'cards') { const k = c.card(); ids.push(k.id); c.resolveCard(k.choices.find((x) => x.available)?.i ?? 0); } return ids; };

describe('bureau ou télétravail (§12b.D)', () => {
  it('2 jours à la maison par semaine, en semaine, jamais le J14, déterministe à la graine', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const plan = workplacePlan(seed);
      expect(plan).toHaveLength(14);
      expect(plan.slice(0, 7).filter((w) => w === 'home')).toHaveLength(2);
      expect(plan.slice(7).filter((w) => w === 'home')).toHaveLength(2);
      expect(plan[13]).toBe('office');
      plan.forEach((w, i) => { if (w === 'home') expect([6, 7, 13, 14]).not.toContain(i + 1); }); // samedis et dimanches
      expect(workplacePlan(seed)).toEqual(plan);
    }
  });

  it('jour de bureau : le trajet ouvre la matinée (et ses effets s\'appliquent) ; jour à la maison : une distraction à choix', () => {
    const office = Array.from({ length: 40 }, (_, i) => i + 1).find((s) => workplacePlan(s)[0] === 'office');
    const home = Array.from({ length: 40 }, (_, i) => i + 1).find((s) => workplacePlan(s)[0] === 'home');
    const a = createCampaign({ seed: office, content });
    expect(a.state.workplace).toBe('office');
    expect(a.card().id).toBe('commute:ride');
    expect(morningCards(a)).toContain('commute:ride');
    const b = createCampaign({ seed: home, content });
    expect(b.state.workplace).toBe('home');
    expect(b.card().id).toBe('terrace_1130');
    expect(b.card().choices.map((x) => x.label)).toEqual(['Photo', 'Rester concentré']);
    b.resolveCard(0);
    expect(b.state.stats.dossier).toBeGreaterThan(0);
    while (b.step === 'cards') b.resolveCard(0);
    expect(b.koddexOptions().gag?.id).toBe('clode_home');
  });

  it('les conditions peuvent dépendre du lieu (`workplace`)', () => {
    const ctx = { day: 2, phase: 'morning', workplace: 'home', flags: new Set(), stats: {}, hidden: {} };
    expect(evalCondition({ workplace: 'home' }, ctx)).toBe(true);
    expect(evalCondition({ workplace: 'office' }, ctx)).toBe(false);
  });

  it('dormir sur le canapé (côté rue) repose moins que la chambre côté cour', () => {
    const cfg = makeConfig();
    const night = (where) => { const s = createSim({ seed: 3, cfg }); while (s.state.min < 23 * 60) s.tick(0.5); s.act({ type: 'sleep', on: true, where }); while (!s.state.ended) s.tick(0.5); return s.state.sleep; };
    expect(night('sofa')).toBeLessThan(night('bed'));
  });

  it('une sauvegarde v3 reçoit son plan bureau / maison à la graine', () => {
    const c = createCampaign({ seed: 9, content });
    const v3 = JSON.parse(JSON.stringify(c.save()));
    v3.version = 3; delete v3.workplaces; delete v3.workplace;
    const d = createCampaign({ content, save: v3 });
    expect(d.state.version).toBe(SAVE_VERSION);
    expect(d.state.workplaces).toEqual(workplacePlan(9));
  });
});
