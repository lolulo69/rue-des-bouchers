import { test, expect } from '@playwright/test';

function watchErrors(page) {
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  return errors;
}

// Avance la campagne de l'interface de jour (src/ui) par l'API du moteur jusqu'à l'étape voulue, puis la redessine
const driveTo = (page, step) => page.evaluate((target) => {
  const { ui } = window.__rdb;
  const c = ui.campaign;
  for (let i = 0; i < 200 && c.step !== target && !c.ended; i++) {
    if (c.step === 'cards') { const card = c.card(); c.resolveCard(card.choices.find((x) => x.available)?.i ?? 0); }
    else if (c.step === 'koddex') c.koddex(['work', 'work', 'work']);
    else if (c.step === 'actions') c.endAfternoon();
    else if (c.step === 'recap') c.nextDay();
  }
  localStorage.setItem(window.__rdb.saveKey, JSON.stringify(c.save()));
  ui.render();
  return c.step;
}, step);

test('campagne : titre → interface de jour → nuit 3D → bilan → jour 2, sauvegarde et reprise', async ({ page }) => {
  test.setTimeout(240_000);
  const errors = watchErrors(page);
  await page.goto('/?nolock=1&seed=5');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.click('#campaign');
  await page.click('[data-testid=title-new]');
  if (await page.locator('[data-testid=intro-skip]').count()) await page.click('[data-testid=intro-skip]');
  await expect(page.locator('[data-testid=day-header]')).toHaveAttribute('data-day', '1');
  await page.screenshot({ path: 'test-results/campaign-day1.png', timeout: 60_000 });

  expect(await driveTo(page, 'night')).toBe('night');
  await Promise.all([page.waitForURL(/mode=night/), page.click('[data-testid=night-go]')]);
  await expect(page.locator('#start')).toContainText('Commencer la nuit');
  await page.click('#start');
  await page.evaluate(() => {
    const { sim, step } = window.__rdb;
    for (let i = 0; !sim.state.ended && i < 2000; i++) { sim.tick(0.5); if (i % 60 === 0) step(1); }
    step(2);
  });
  await expect(page.locator('[data-testid=recap]')).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem(window.__rdb.saveKey)));
  expect(saved.step).toBe('recap');
  expect(saved.nights).toHaveLength(1);
  await page.screenshot({ path: 'test-results/campaign-recap.png', timeout: 60_000 });

  await page.click('[data-testid=recap-next]');
  await expect(page.locator('[data-testid=day-header]')).toHaveAttribute('data-day', '2');

  // Recharger : « Continuer »
  await page.goto('/?nolock=1&seed=5');
  await page.click('#campaign');
  await page.click('[data-testid=title-continue]');
  await expect(page.locator('[data-testid=day-header]')).toHaveAttribute('data-day', '2');
  expect(errors).toEqual([]);
});
