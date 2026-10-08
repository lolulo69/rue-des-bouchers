import { test, expect } from '@playwright/test';

// Interface des journées (src/ui) sur sa page autonome ui.html : nuits simulées, tout passe par des clics.
function watchErrors(page) {
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  return errors;
}
const step = (page) => page.locator('#ui-root').getAttribute('data-step');
const day = async (page) => Number(await page.locator('[data-testid=day-header]').getAttribute('data-day').catch(() => 0));

// Avance d'un écran en cliquant comme un joueur prudent. Renvoie l'étape traitée.
async function advance(page, seen) {
  const s = await step(page);
  seen.add(s);
  const result = page.locator('[data-testid=result-next]');
  if (await result.count()) { await result.click(); return s; }
  switch (s) {
    case 'cards': {
      await page.locator('[data-testid=card-choice]:enabled').first().click();
      break;
    }
    case 'koddex': {
      const done = page.locator('[data-testid=koddex-done]');
      if (await done.count()) { await done.click(); break; }
      await expect(page.locator('[data-testid=terminal]')).toBeVisible();
      // un projet perso légal s'il y en a, sinon le vrai travail
      const side = page.locator('[data-testid=koddex-option]:enabled:not([data-id=work])').first();
      const work = page.locator('[data-testid=koddex-option][data-id=work]:enabled');
      await ((await side.count()) ? side : work).click();
      break;
    }
    case 'actions': {
      const left = Number(await page.locator('[data-testid=slots]').getAttribute('data-left'));
      const legal = page.locator('[data-testid=group-legal] [data-testid=action]:enabled').first();
      if (left > 0 && await legal.count()) await legal.click();
      else await page.locator('[data-testid=action-end]').click();
      break;
    }
    case 'night': await page.locator('[data-testid=night-go]').click(); break;
    case 'recap': await page.locator('[data-testid=recap-next]').click(); break;
    default: throw new Error(`étape inattendue : ${s}`);
  }
  return s;
}

test('jours 1 à 3 joués dans l’interface : Koddex, après-midi, nuit, bilan, sauvegarde', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/ui.html?fresh=1&fast=1&seed=7');
  await expect(page.getByRole('heading', { name: 'Rue des Bouchers' })).toBeVisible();
  await page.click('[data-testid=title-new]');

  // Intro du jour 1
  await expect(page.locator('[data-testid=intro]')).toBeVisible();
  await page.click('[data-testid=intro-next]');
  await page.click('[data-testid=intro-skip]');
  await expect(page.locator('[data-testid=day-header]')).toHaveAttribute('data-day', '1');
  await expect(page.locator('.ui-upcoming')).toContainText('Aujourd’hui');

  await expect(page.locator('[data-testid=card]')).toBeVisible();
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test-results/ui-card.png', fullPage: true });
  const seen = new Set();
  let checkedMenu = false;
  let checkedPhone = false;
  let reloaded = false;
  for (let i = 0; i < 300 && (await day(page)) < 4; i++) {
    const s = await step(page);
    // Après-midi : les actions indisponibles sont grisées avec une raison
    if (s === 'actions' && !checkedMenu && !(await page.locator('[data-testid=result-next]').count())) {
      await expect(page.locator('[data-testid=group-legal]')).toBeVisible();
      await expect(page.locator('[data-testid=group-illegal]')).toBeVisible();
      const locked = page.locator('[data-testid=action]:disabled .why').first();
      await expect(locked).not.toBeEmpty();
      await page.waitForTimeout(400);
      await page.screenshot({ path: 'test-results/ui-afternoon.png', fullPage: true });
      await page.locator('[data-testid=group-illegal]').screenshot({ path: 'test-results/ui-illegal.png' });
      checkedMenu = true;
    }
    // Téléphone : s'ouvre et se referme depuis l'en-tête
    if (s === 'actions' && !checkedPhone && (await day(page)) >= 2) {
      await page.click('[data-testid=phone-open]');
      await expect(page.locator('[data-testid=phone]')).toBeVisible();
      await page.click('[data-tab=press]');
      await page.click('[data-testid=phone-close]');
      checkedPhone = true;
    }
    // Rechargement au jour 2 : « Continuer » reprend la même journée
    if (!reloaded && (await day(page)) === 2 && s === 'koddex') {
      await page.goto('/ui.html?fast=1');
      await page.click('[data-testid=title-continue]');
      await expect(page.locator('[data-testid=day-header]')).toHaveAttribute('data-day', '2');
      reloaded = true;
      continue;
    }
    await advance(page, seen);
  }
  expect(await day(page)).toBe(4);
  for (const s of ['cards', 'koddex', 'actions', 'night', 'recap']) expect(seen, `étape ${s} jamais vue`).toContain(s);
  expect(checkedMenu && checkedPhone && reloaded).toBe(true);
  await page.screenshot({ path: 'test-results/ui-day4.png', fullPage: true });
  expect(errors).toEqual([]);
});

test('mobile : la journée tient sur un écran de téléphone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto('/ui.html?fresh=1&fast=1&seed=3');
  await page.click('[data-testid=title-new]');
  await page.click('[data-testid=intro-skip]');
  const seen = new Set();
  for (let i = 0; i < 40 && (await step(page)) !== 'koddex'; i++) await advance(page, seen);
  await expect(page.locator('[data-testid=terminal]')).toBeVisible();
  const overflow = await page.evaluate(() => document.getElementById('ui-root').scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await page.screenshot({ path: 'test-results/ui-mobile-koddex.png', fullPage: true });
});
