import { test, expect } from '@playwright/test';
import { startNight, tickTo, hhmm } from './helpers.js';

// Cohérence rendu ↔ simulation (§13.G « personne à deux endroits », §13.C témoins : le teckel).
// Bugs connus : test.fixme + qa/bugs.md. Retirer le fixme quand c'est corrigé (le test garde alors la régression).

test('BUG-001 (corrigé) · le teckel en 3D suit la ronde de la simulation (21h30–22h30)', async ({ page }) => {
  await startNight(page, 'seed=7');
  const at = async (min) => {
    await tickTo(page, min);
    return page.evaluate(() => {
      const { sim, world } = window.__rdb;
      const d = world.cast.dog.position, s = sim.dogPos();
      return { active: sim.dogActive(), gap: Math.hypot(d.x - s.x, d.z - s.z), drawn: { x: d.x, z: d.z }, sim: { x: s.x, z: s.z } };
    });
  };
  for (const min of [hhmm(21, 45), hhmm(22, 0), hhmm(22, 20)]) {
    const r = await at(min);
    expect(r.active).toBe(true);
    expect(r.gap, `à ${min} : teckel dessiné en ${JSON.stringify(r.drawn)}, simulé en ${JSON.stringify(r.sim)}`).toBeLessThan(2);
  }
});
