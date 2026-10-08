import { test, expect } from '@playwright/test';

// Collecte les erreurs console / exceptions de la page
function watchErrors(page) {
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  return errors;
}

test('une nuit complète : chargement, photo, police, porte, bilan', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/?nolock=1&seed=7');
  await expect(page.locator('#title')).toBeVisible();
  await page.click('#start');
  await expect(page.locator('#hud')).toBeVisible();
  await page.evaluate(() => window.__rdb.step(5));

  // Photo d'une table en infraction (après 22h05, toute table dehors l'est)
  const tableId = await page.evaluate(() => {
    const { sim } = window.__rdb;
    while (sim.state.min < sim.late + 5) sim.tick(0.5);
    sim.drainEvents();
    return sim.state.tables.find((t) => t.out).id;
  });
  await page.evaluate((id) => { window.__rdb.aimAt(id); window.__rdb.step(2); window.__rdb.key('KeyP'); }, tableId);
  const evidence = await page.evaluate(() => window.__rdb.sim.state.evidence.map((e) => e.text));
  expect(evidence.length).toBeGreaterThan(0);

  // Téléphone → police municipale
  await page.evaluate(() => window.__rdb.key('KeyT'));
  await expect(page.locator('#phone')).toBeVisible();
  await page.click('[data-call=police]');
  await expect(page.locator('#phone')).toBeHidden();
  expect(await page.evaluate(() => window.__rdb.sim.state.calls)).toBe(1);

  // QA (b) : devant la porte, l'invite [E] s'affiche et E fonctionne
  await page.evaluate(() => {
    const { player, sim } = window.__rdb;
    const d = sim.cfg.ANCHORS.streetDoor;
    player.loc = 'street';
    player.pos.set(d.x + 0.6, 0, d.z);
    window.__rdb.step(5);
  });
  await expect(page.locator('#prompt')).toContainText('Monter chez Pilou');
  await page.evaluate(() => { window.__rdb.key('KeyE'); window.__rdb.step(1); });
  expect(await page.evaluate(() => window.__rdb.player.loc)).toBe('apt');
  await page.screenshot({ path: 'test-results/apartment.png' });

  // Jusqu'au bout de la nuit
  await page.evaluate(() => { for (let i = 0; i < 400 && !window.__rdb.sim.state.ended; i++) window.__rdb.step(1, 2); });
  await expect(page.locator('#end')).toBeVisible();
  await expect(page.locator('#end-body')).toContainText('Terrasses');
  await expect(page.locator('#end-body')).toContainText('Police municipale');
  await expect(page.locator('#end-title')).toContainText('la rue se tait');
  await page.screenshot({ path: 'test-results/end.png' });
  expect(errors).toEqual([]);
});

test('samedi : la foule se charge sans erreur', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/?nolock=1&seed=3&day=sat');
  await page.click('#start');
  const s = await page.evaluate(() => {
    const { sim } = window.__rdb;
    while (sim.state.min < 23 * 60) sim.tick(0.5);
    window.__rdb.step(3);
    return { label: document.getElementById('day').textContent, standing: sim.activeStanding().length, pees: sim.state.pees.length };
  });
  expect(s.label).toContain('Samedi');
  expect(s.standing).toBeGreaterThan(0);
  expect(s.pees).toBeGreaterThan(0);
  await page.screenshot({ path: 'test-results/saturday.png' });
  expect(errors).toEqual([]);
});
