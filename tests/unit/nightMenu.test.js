// Menu de nuit (§12c.4) : lignes calculées des données (nightMenu.js), rendu générique dans game.js.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createCampaign, normalizeContent, availableNightActions, nightMenu } from '../../src/sim/index.js';
import { NIGHT_MENU } from '../../src/config.js';
import * as narrative from '../../src/sim/narrative.js';

const ROOT = join(import.meta.dirname, '..', '..');
const DIR = join(ROOT, 'src', 'content');
const K = normalizeContent(await Promise.all(readdirSync(DIR).filter((f) => f.endsWith('.js')).map((f) => import(join(DIR, f)))));

// Une nuit où tout est débloqué, à 22h15 (terrasse pleine, serveur là)
function night(seed = 3) {
  const c = createCampaign({ seed, content: K, narrative });
  for (let i = 0; i < 400 && c.step !== 'night'; i++) {
    if (c.step === 'cards') c.resolveCard(c.card().choices.find((x) => x.available)?.i ?? 0);
    else if (c.step === 'koddex') c.koddex(['work', 'work', 'work']);
    else if (c.step === 'actions') c.endAfternoon();
  }
  c.state.unlocked = K.UNLOCKS.map((u) => u.id); // tous les outils acquis
  const sim = c.createNight();
  while (sim.state.min < 22 * 60 + 15) sim.tick(1);
  return { c, sim };
}
const AT = {
  window: (sim) => ({ where: 'window', pos: { x: sim.cfg.ANCHORS.pilouWindow.x, z: sim.cfg.ANCHORS.pilouWindow.z } }),
  street: (sim) => ({ where: 'street', pos: { x: sim.cfg.ANCHORS.streetDoor.x, z: sim.cfg.ANCHORS.streetDoor.z } }),
};

describe('nightMenu : « Ici, maintenant » et « Ailleurs ce soir »', () => {
  it.each(Object.keys(AT))('%s : chaque action listée est dans un seul groupe ; ailleurs = une raison lisible', (w) => {
    const { c, sim } = night();
    const player = AT[w](sim);
    const all = availableNightActions(sim, c, player);
    const m = nightMenu(sim, c, player);
    expect(all.length).toBeGreaterThan(0);
    expect([...m.here, ...m.elsewhere].map((r) => r.id).sort()).toEqual(all.map((x) => x.id).sort());
    for (const r of m.here) { expect(r.available).toBe(true); expect(r.reason).toBeNull(); }
    for (const r of m.elsewhere) { expect(r.available).toBe(false); expect(r.reason, r.id).toMatch(/\S.{4,}/); }
  });

  it('la fenêtre et la rue ne proposent pas la même chose ici', () => {
    const { c, sim } = night();
    const ids = (w) => nightMenu(sim, c, AT[w](sim)).here.map((r) => r.id).join();
    expect(ids('window')).not.toBe(ids('street'));
  });

  it('chaque ligne : libellé des données, étiquette et couleur de légalité, temps, risque, indice', () => {
    const { c, sim } = night();
    const m = nightMenu(sim, c, AT.street(sim));
    for (const r of [...m.here, ...m.elsewhere]) {
      const a = K.ACTIONS.find((x) => x.id === r.id);
      expect(r.label).toBe(a.label);
      expect(r.tag).toBe(NIGHT_MENU.legality[a.legality].tag);
      expect(r.color).toMatch(/^#/);
      expect(r.time).toMatch(/^\d+ min$/);
      if (a.legality === 'legal') expect(r.risk.level).toBe('none');
      else expect(['low', 'medium', 'high']).toContain(r.risk.level);
      if (r.risk.p > 0) expect(r.risk.who.length).toBeGreaterThan(0);
      expect(typeof r.hint).toBe('string');
    }
  });

  it('le risque monte avec l’exposition : rue pleine à 22h15 plutôt qu’à 1h20, rue vide', () => {
    const { c, sim } = night();
    const risky = (m) => [...m.here, ...m.elsewhere].filter((r) => r.legality !== 'legal');
    const early = risky(nightMenu(sim, c, AT.street(sim)));
    while (sim.state.min < 25 * 60 + 20) sim.tick(1);
    const late = risky(nightMenu(sim, c, AT.street(sim)));
    const sum = (rs) => rs.reduce((s, r) => s + r.risk.p, 0);
    expect(sum(late)).toBeLessThan(sum(early));
  });
});

describe('renderNightMenu (game.js) est générique', () => {
  it('aucun id ni libellé d’action dans le code du menu : tout vient de nightMenu()', () => {
    const src = readFileSync(join(ROOT, 'src', 'game.js'), 'utf8');
    const start = src.indexOf('function renderNightMenu');
    const body = src.slice(start, src.indexOf('\n}\n', start));
    expect(start).toBeGreaterThan(0);
    expect(body).toMatch(/nightMenu\(/);
    for (const a of K.ACTIONS.filter((x) => x.phase === 'night')) {
      expect(body.includes(a.id), a.id).toBe(false);
      expect(body.includes(a.label), a.label).toBe(false);
    }
  });
});
