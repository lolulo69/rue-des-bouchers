import { test, expect } from '@playwright/test';

test('chargement : la barre progresse puis l\'écran s\'efface, le titre est là', async ({ page }) => {
  await page.goto('/?nolock=1&seed=2');
  await expect(page.locator('#loader')).toBeHidden({ timeout: 60_000 });
  await expect(page.locator('#title')).toBeVisible();
  expect(await page.locator('#loader-bar').evaluate((e) => e.style.width)).toBe('80%');
});

test('erreur globale : écran en français, rapport copiable, rechargement', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/?nolock=1&seed=2');
  await expect(page.locator('#loader')).toBeHidden({ timeout: 60_000 });
  // Une erreur non attrapée (comme un bug réel dans une boucle de jeu)
  await page.evaluate(() => setTimeout(() => { throw new Error('boum de test'); }, 0));
  await expect(page.locator('#fatal')).toBeVisible();
  await expect(page.locator('#fatal')).toContainText('La rue des Bouchers a planté');
  await expect(page.locator('#fatal-detail')).toContainText('boum de test');
  await page.click('#fatal-copy');
  await expect(page.locator('#fatal-copy')).toContainText(/copié|impossible/);
  const clip = await page.evaluate(() => navigator.clipboard.readText().catch(() => ''));
  if (clip) {
    expect(clip).toContain('boum de test');
    expect(clip).toMatch(/Sauvegarde\s:/);
  }
  await Promise.all([page.waitForEvent('load'), page.click('#fatal-reload')]);
  await expect(page.locator('#fatal')).toBeHidden();
});

test('promesse rejetée non attrapée : même écran', async ({ page }) => {
  await page.goto('/?nolock=1&seed=2');
  await expect(page.locator('#loader')).toBeHidden({ timeout: 60_000 });
  await page.evaluate(() => { Promise.reject(new Error('promesse de test')); });
  await expect(page.locator('#fatal')).toBeVisible();
  await expect(page.locator('#fatal-detail')).toContainText('promesse de test');
});
