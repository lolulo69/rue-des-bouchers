import { test, expect } from '@playwright/test';

function watchErrors(page) {
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  return errors;
}

// Avance la campagne par son API (indépendant de l'interface de jour montée) jusqu'à l'étape voulue
const driveTo = (page, step) => page.evaluate((target) => {
  const c = window.__rdb.campaign;
  for (let i = 0; i < 200 && c.step !== target && !c.ended; i++) {
    if (c.step === 'cards') { const card = c.card(); c.resolveCard(card.choices.find((x) => x.available)?.i ?? 0); }
    else if (c.step === 'koddex') c.koddex(['work', 'work', 'work']);
    else if (c.step === 'actions') c.endAfternoon();
    else if (c.step === 'recap') c.nextDay();
  }
  localStorage.setItem(window.__rdb.saveKey, JSON.stringify(c.save()));
  return c.step;
}, step);

test('campagne : nouveau jeu → jour 1 → nuit → récap → jour 2, sauvegarde et reprise', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/?nolock=1&seed=5');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.click('#new-campaign');
  await expect(page.locator('#dayui')).toBeVisible();
  await expect(page.locator('#dayui')).toContainText('Jour 1');
  await page.screenshot({ path: 'test-results/campaign-day1.png', timeout: 60_000 });

  expect(await driveTo(page, 'night')).toBe('night');
  await Promise.all([page.waitForURL(/mode=night/), page.evaluate(() => window.__rdb.goNight())]);
  await expect(page.locator('#start')).toContainText('Commencer la nuit');
  await page.click('#start');
  await page.evaluate(() => {
    const { sim, step } = window.__rdb;
    for (let i = 0; !sim.state.ended && i < 2000; i++) { sim.tick(0.5); if (i % 60 === 0) step(1); }
    step(2);
  });
  await expect(page.locator('#dayui')).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem(window.__rdb.saveKey)));
  expect(saved.step).toBe('recap');
  expect(saved.nights).toHaveLength(1);
  await page.screenshot({ path: 'test-results/campaign-recap.png', timeout: 60_000 });

  await page.evaluate(() => { window.__rdb.campaign.nextDay(); localStorage.setItem(window.__rdb.saveKey, JSON.stringify(window.__rdb.campaign.save())); });
  expect(await page.evaluate(() => window.__rdb.campaign.state.day)).toBe(2);

  // Recharger : « Continuer (jour 2) »
  await page.goto('/?nolock=1&seed=5');
  await expect(page.locator('#continue')).toBeVisible();
  await expect(page.locator('#continue')).toContainText('jour 2');
  await page.click('#continue');
  await expect(page.locator('#dayui')).toContainText('Jour 2');
  expect(errors).toEqual([]);
});
