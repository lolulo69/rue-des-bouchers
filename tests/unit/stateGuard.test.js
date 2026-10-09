// Gardes d'état des lignes (GAME_DESIGN §13.L) : vocabulaire, choix gardé, accessoires et tables datés des twists.
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { createSim } from '../../src/sim/index.js';
import { holds, nightSnapshot, usable, textOf } from '../../src/sim/stateGuard.js';
import * as narrative from '../../src/sim/narrative.js';
import { TWISTS } from '../../src/content/twists.js';
import { nightTwist } from '../../src/sim/twists.js';

const at = (sim, min) => { while (sim.state.min < min && !sim.state.ended) sim.tick(1); return sim; };
const twistSim = (id, seed = 3) => createSim({ seed, twist: nightTwist(TWISTS.find((t) => t.id === id)) });

describe('stateGuard : vocabulaire', () => {
  it('tables dehors, heure, présence, gaine, samedi', () => {
    const sim = at(createSim({ seed: 2 }), 21 * 60);
    const s = nightSnapshot(sim);
    expect(s.tablesOut).toBeGreaterThan(0);
    expect(holds({ tablesOut: '>0', before: '22:00', present: ['serveur', 'klaas'], exhaust: true, saturday: false }, sim)).toBe(true);
    expect(holds({ after: '22:00' }, sim)).toBe(false);
    expect(holds({ absent: ['serveur'] }, sim)).toBe(false);
    at(sim, 25 * 60 + 20);
    expect(holds({ present: ['klaas'] }, sim)).toBe(false);
    expect(holds({ exhaust: false, after: '01:00' }, sim)).toBe(true);
  });
  it('choix gardé : une ligne dont la garde ne tient pas n\'est jamais choisie', () => {
    const sim = at(createSim({ seed: 2 }), 25 * 60 + 10); // 1h10 : serveur parti
    const pool = ['neutre', { text: 'Le serveur passe.', state: { present: ['serveur'] } }];
    expect(usable(pool, sim).map(textOf)).toEqual(['neutre']);
    expect(usable(pool, null).length).toBe(2); // sans nuit (tests, outils) : tout passe
    expect(narrative.pickNightLine('witness', sim, sim.rng, {})).not.toMatch(/Gaufre/); // « Même Gaufre regardait ailleurs » : chat rentré
  });
});

describe('twists : le texte et la rue disent la même chose', () => {
  it('fête des voisins : la table de l\'association part à 22h00', () => {
    const sim = twistSim('fete_voisins');
    at(sim, 21 * 60 + 50);
    expect(sim.twist.props).toContain('trestle_table');
    at(sim, 22 * 60 + 1);
    expect(sim.twist.props).not.toContain('trestle_table');
  });
  it('dîner de Colette : sa table reste jusqu\'à 23h30, puis rentre', () => {
    const sim = twistSim('colette_dinner');
    const colette = () => sim.state.tables.find((t) => t.label.endsWith('la table de Colette'));
    at(sim, 23 * 60 + 5);
    expect(colette().out).toBe(true);
    at(sim, 23 * 60 + 40);
    expect(colette().out).toBe(false);
  });
  it('drache : la pluie tombe à l\'heure où le texte le dit', () => {
    const sim = twistSim('drache_night');
    at(sim, 21 * 60 + 16);
    expect(sim.state.twistRainedAt).toBe(21 * 60 + 15);
    expect(nightSnapshot(sim).rain).toBe(true);
  });
  it('Biloute a disparu : pas de ronde ce soir', () => {
    const sim = twistSim('lost_dog');
    at(sim, 21 * 60 + 45);
    expect(sim.dogActive()).toBe(false);
  });
});

describe('vérificateur texte ↔ état (scripts/coherence-check.js)', () => {
  it('0 contradiction sur un échantillon (CI) ; npm run check:coherence fait 200 campagnes × 7 bots', { timeout: 120_000 }, () => {
    const out = execFileSync('node', [join(import.meta.dirname, '..', '..', 'scripts', 'coherence-check.js'), '--runs', '8', '--quiet', '--no-write', '--strict'], { encoding: 'utf8' });
    expect(out).toMatch(/ 0 contradiction/);
  });
});
