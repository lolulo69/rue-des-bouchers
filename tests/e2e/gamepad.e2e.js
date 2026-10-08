import { test, expect } from '@playwright/test';

// Fausse manette « standard » injectée avant le chargement : navigator.getGamepads() la renvoie, le test appuie dessus.
const IDX = { A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5, LT: 6, RT: 7, VIEW: 8, START: 9, LS: 10, RS: 11, UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15 };
async function injectPad(page, id = 'Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 0b13)') {
  await page.addInitScript((padId) => {
    globalThis.__rdbUiSpeed = 0;
    window.__pad = { id: padId, index: 0, connected: true, mapping: 'standard', timestamp: 0, axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })) };
    navigator.getGamepads = () => [window.__pad, null, null, null];
  }, id);
}
// Appui : maintenu jusqu'à ce que la boucle de la manette l'ait lu deux fois (sous SwiftShader, quelques images/s)
const polls = (page) => page.evaluate(() => window.__rdbPadPolls ?? 0);
async function waitPolls(page, n = 2) { const p0 = await polls(page); await expect.poll(() => polls(page), { timeout: 20_000 }).toBeGreaterThanOrEqual(p0 + n); }
async function tap(page, b) {
  await page.evaluate((i) => { window.__pad.buttons[i] = { pressed: true, touched: true, value: 1 }; }, IDX[b]);
  await waitPolls(page);
  await page.evaluate((i) => { window.__pad.buttons[i] = { pressed: false, touched: false, value: 0 }; }, IDX[b]);
  await waitPolls(page);
}
const step = (page) => page.locator('#ui-root').getAttribute('data-step');

test('manette : une journée jouée à la croix et à Ⓐ, glyphes Xbox puis PlayStation', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await injectPad(page);
  await page.goto('/ui.html?fresh=1&seed=14');
  await expect(page.locator('[data-testid=title-new]')).toBeFocused();
  await tap(page, 'A');
  await expect(page.locator('html')).toHaveAttribute('data-input', 'pad');
  await expect(page.locator('html')).toHaveAttribute('data-pad', 'xbox');
  // Intro : Ⓐ sur « Suivant » jusqu'à la première carte
  await expect(page.locator('[data-testid=intro]')).toBeVisible();
  for (let i = 0; i < 10 && await page.locator('[data-testid=intro]').count(); i++) await tap(page, 'A');
  // Glyphes dans l'interface : le téléphone s'annonce « LB »
  await expect(page.locator('[data-testid=phone-open]')).toHaveAttribute('title', /LB/);
  // LB ouvre le téléphone, Ⓑ le referme
  await tap(page, 'LB');
  await expect(page.locator('[data-testid=phone]')).toBeVisible();
  await tap(page, 'B');
  await expect(page.locator('[data-testid=phone]')).toHaveCount(0);
  // Cartes : Ⓐ sur le choix focalisé, jusqu'au terminal Koddex
  for (let i = 0; i < 30 && (await step(page)) !== 'koddex'; i++) await tap(page, 'A');
  await expect(page.locator('[data-testid=terminal]')).toBeVisible();
  const first = page.locator('[data-testid=koddex-option]').first();
  await expect(first).toBeFocused();
  // La croix déplace le focus (visible : anneau de focus du mode manette)
  await tap(page, 'DOWN');
  await expect(first).not.toBeFocused();
  const outline = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
  expect(outline).toBe('solid');
  await tap(page, 'A');
  await expect(page.locator('.ui-prompts i.used')).toHaveCount(1);
  // Start ouvre le menu pause, la croix y navigue, Ⓑ le referme
  await tap(page, 'START');
  await expect(page.locator('[data-testid=menu]')).toBeVisible();
  await tap(page, 'DOWN');
  await tap(page, 'B');
  await expect(page.locator('[data-testid=menu]')).toHaveCount(0);
  // Aide : la carte des touches montre la manette
  await tap(page, 'START');
  await page.locator('[data-testid=menu-help]').focus();
  await tap(page, 'A');
  await expect(page.locator('[data-help=h_touches]')).toContainText('Ⓐ');
  await tap(page, 'B');
  await tap(page, 'B');
  expect(errors).toEqual([]);
});

test('manette PlayStation : glyphes ✕ ○ □ △ (id DualSense)', async ({ page }) => {
  await injectPad(page, 'DualSense Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 0ce6)');
  await page.goto('/ui.html?fresh=1&seed=15');
  await tap(page, 'A');
  await expect(page.locator('html')).toHaveAttribute('data-pad', 'playstation');
  for (let i = 0; i < 10 && await page.locator('[data-testid=intro]').count(); i++) await tap(page, 'A');
  await expect(page.locator('[data-testid=phone-open]')).toHaveAttribute('title', /L1/);
  await tap(page, 'START');
  await page.locator('[data-testid=menu-help]').focus();
  await tap(page, 'A');
  await expect(page.locator('[data-help=h_touches]')).toContainText('✕');
  await expect(page.locator('[data-help=h_touches]')).toContainText('△');
  // Le clavier reprend la main : retour aux touches
  await page.keyboard.press('Escape');
  await expect(page.locator('html')).toHaveAttribute('data-input', 'kbd');
});

// Nuit de campagne (?mode=night) jouée à la manette : glyphes de l'invite du HUD, menu des actions de nuit à la croix,
// seau à maintenir (barre de confirmation), le tout avec la fausse manette.
test('manette dans la nuit 3D : invite Ⓐ, actions de nuit à la croix, seau à maintenir', async ({ page }) => {
  test.setTimeout(480_000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await injectPad(page);
  // Une campagne amenée jusqu'à la nuit 1, sauvegardée, puis la page de nuit
  await page.goto('/?nolock=1&seed=5');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.click('#campaign');
  await page.click('[data-testid=title-new]');
  await page.click('[data-testid=intro-skip]');
  await page.evaluate(() => {
    const c = window.__rdb.campaign;
    for (let i = 0; i < 200 && c.step !== 'night'; i++) {
      if (c.step === 'cards') c.resolveCard(c.card().choices.find((x) => x.available)?.i ?? 0);
      else if (c.step === 'koddex') c.koddex(['work', 'work', 'work']);
      else if (c.step === 'actions') c.endAfternoon();
    }
    localStorage.setItem(window.__rdb.saveKey, JSON.stringify(c.save()));
  });
  await page.goto('/?nolock=1&mode=night&seed=5');
  await page.locator('#hud').waitFor({ state: 'visible' });
  await tap(page, 'A'); // la manette devient l'entrée active
  await expect(page.locator('html')).toHaveAttribute('data-input', 'pad');

  // 1. Devant la porte : l'invite du HUD montre Ⓐ, plus [E]
  await page.evaluate(() => {
    const { player, sim, step } = window.__rdb;
    const d = sim.cfg.ANCHORS.streetDoor;
    player.loc = 'street';
    player.pos.set(d.x + 0.6, 0, d.z);
    step(3);
  });
  await expect(page.locator('#prompt')).toContainText('[Ⓐ]', { timeout: 20_000 });
  await expect(page.locator('#prompt')).not.toContainText('[E]');

  // 2. Ⓨ ouvre les actions de nuit ; la croix déplace le focus dans la liste ; Ⓑ referme
  await tap(page, 'Y');
  await expect(page.locator('#nightmenu')).toBeVisible();
  const n = await page.locator('#nightmenu button:visible').count();
  expect(n, 'des actions de nuit à choisir').toBeGreaterThan(1);
  await tap(page, 'DOWN');
  const first = await page.evaluate(() => document.activeElement?.textContent);
  expect(await page.evaluate(() => document.getElementById('nightmenu').contains(document.activeElement))).toBe(true);
  await tap(page, 'DOWN');
  expect(await page.evaluate(() => document.activeElement?.textContent)).not.toBe(first);
  await tap(page, 'B');
  await expect(page.locator('#nightmenu')).toBeHidden();

  // 3. À la fenêtre : RT bref = rien ; RT maintenu = barre de confirmation, puis le seau
  await page.evaluate(() => {
    const { player, world, sim, step } = window.__rdb;
    const w = sim.cfg.ANCHORS.pilouWindow;
    player.loc = 'apt';
    player.pos.set(world.apt.x1 - 0.5, world.apt.floor, w.z);
    player.yaw = -Math.PI / 2;
    step(2);
  });
  const buckets = () => page.evaluate(() => window.__rdb.sim.state.bucketUses);
  const b0 = await buckets();
  await tap(page, 'RT');
  expect(await buckets(), 'un appui bref ne vide pas le seau').toBe(b0);
  await page.evaluate((i) => { window.__pad.buttons[i] = { pressed: true, touched: true, value: 1 }; }, IDX.RT);
  await expect(page.locator('#ui-pad-hold')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('#ui-pad-hold')).toContainText('RT');
  await expect.poll(buckets, { timeout: 60_000 }).toBe(b0 + 1);
  await page.evaluate((i) => { window.__pad.buttons[i] = { pressed: false, touched: false, value: 0 }; }, IDX.RT);
  await expect(page.locator('#ui-pad-hold')).toHaveCount(0, { timeout: 20_000 });
  expect(errors).toEqual([]);
});
