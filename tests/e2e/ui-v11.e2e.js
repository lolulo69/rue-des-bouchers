import { test, expect } from '@playwright/test';

// v1.1 (§12b) : scènes de jour en 3D, terminal sur le moniteur, bureau/télétravail, trajet, carnet de l'après-midi,
// cartes « Nouveau » et rebondissement de la nuit. art.day et les nouvelles fonctions de campagne sont simulées
// (globalThis.__rdbArtDay, c.workPlace / c.tonightTwist…) : l'interface ne fait que les détecter.
async function setup(page, { quality } = {}) {
  await page.addInitScript((q) => {
    globalThis.__rdbUiSpeed = 0;
    if (q) localStorage.setItem('rdb.quality', q); else localStorage.removeItem('rdb.quality');
    // Fausse art.day (même API que src/art/day.js) : pas de rendu, un moniteur en px CSS publié à chaque « image »
    const listeners = new Set();
    let active = null;
    const rect = () => (active === 'koddex' || active === 'home'
      ? { x: innerWidth * 0.22, y: innerHeight * 0.2, width: innerWidth * 0.57, height: innerHeight * 0.58,
        corners: [{ x: innerWidth * 0.22, y: innerHeight * 0.2 }, { x: innerWidth * 0.8, y: innerHeight * 0.23 }, { x: innerWidth * 0.79, y: innerHeight * 0.78 }, { x: innerWidth * 0.23, y: innerHeight * 0.8 }] }
      : null);
    setInterval(() => { const r = rect(); if (r) for (const fn of listeners) fn(r); }, 50);
    globalThis.__rdbArtDay = {
      scenes: ['koddex', 'street', 'atelier', 'mairie', 'home'],
      async start(kind) { if (localStorage.getItem('rdb.quality') === 'bas') return false; active = kind; return true; },
      stop() { active = null; },
      screenRect: rect,
      onScreenRect(fn) { listeners.add(fn); return () => listeners.delete(fn); },
      get active() { return active; },
    };
  }, quality ?? null);
  await page.goto('/ui.html?fresh=1&seed=41');
  await page.click('[data-testid=title-new]');
  await page.click('[data-testid=intro-skip]');
}
const patch = (page, fn, arg) => page.evaluate(fn, arg);
const toMorningKoddex = (page) => page.evaluate(() => {
  const ui = window.__rdbUi; const c = ui.campaign;
  for (let i = 0; i < 50 && c.step === 'cards'; i++) c.resolveCard(c.card().choices.find((x) => x.available)?.i ?? 0);
  ui.render();
  return c.step;
});

test('matin en télétravail : 🏠 dans l’en-tête, terminal posé sur le moniteur, prompts cliquables', async ({ page }) => {
  await setup(page);
  await patch(page, () => { window.__rdbUi.campaign.workPlace = () => 'home'; });
  expect(await toMorningKoddex(page)).toBe('koddex');
  await expect(page.locator('[data-testid=workplace]')).toHaveAttribute('data-place', 'home');
  await expect(page.locator('[data-testid=workplace]')).toContainText('🏠');
  await expect(page.locator('#ui-root')).toHaveAttribute('data-stage', 'day3d');
  await expect(page.locator('#ui-root')).toHaveClass(/on-monitor/);
  await expect(page.locator('[data-testid=commute]')).toHaveCount(0);
  const tf = await page.locator('[data-testid=monitor]').evaluate((el) => getComputedStyle(el).transform);
  expect(tf).toMatch(/^matrix3d\(/);
  // le terminal déformé reste cliquable : un prompt
  await page.locator('[data-testid=koddex-option]').first().click();
  await expect(page.locator('.ui-prompts i.used')).toHaveCount(1);
  await page.screenshot({ path: 'test-results/v11-monitor.png' });
});

test('matin au bureau : 🏢, trajet en vélo qu’on peut passer, puis le terminal', async ({ page }) => {
  await setup(page);
  await patch(page, () => { const c = window.__rdbUi.campaign; c.workPlace = () => 'office'; c.commuteBeat = () => ({ title: 'La batterie lâche rue de la Barre', text: 'Dernier kilomètre à la force des mollets.' }); });
  await toMorningKoddex(page);
  await expect(page.locator('[data-testid=workplace]')).toContainText('🏢');
  await expect(page.locator('[data-testid=commute]')).toContainText('La batterie lâche');
  await expect(page.locator('[data-testid=commute-next]')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-testid=terminal]')).toBeVisible();
  await expect(page.locator('#ui-root')).toHaveClass(/on-monitor/);
});

test('qualité « Bas » : pas de 3D de jour, le terminal en mise en page 2D', async ({ page }) => {
  await setup(page, { quality: 'bas' });
  await toMorningKoddex(page);
  await expect(page.locator('[data-testid=terminal]')).toBeVisible();
  await expect(page.locator('#ui-root')).not.toHaveClass(/on-monitor/);
  await expect(page.locator('#ui-root')).toHaveAttribute('data-stage', '2d');
});

test('après-midi : carnet sur la rue de jour, résultat à la mairie ; carte « Nouveau » ; rebondissement de la nuit', async ({ page }) => {
  await setup(page);
  await page.evaluate(() => {
    const ui = window.__rdbUi; const c = ui.campaign;
    for (let i = 0; i < 80 && c.step !== 'actions'; i++) {
      if (c.step === 'cards') c.resolveCard(c.card().choices.find((x) => x.available)?.i ?? 0);
      else if (c.step === 'koddex') c.koddex(['work', 'work', 'work']);
    }
    ui.render();
  });
  await expect(page.locator('[data-testid=notebook]')).toBeVisible();
  await expect(page.locator('#ui-root')).toHaveAttribute('data-scene', 'street');
  await page.click('[data-testid=action][data-id=pm_request_delandre]');
  await expect(page.locator('[data-testid=result]')).toBeVisible();
  await expect(page.locator('#ui-root')).toHaveAttribute('data-scene', 'mairie');
  await page.click('[data-testid=result-next]');
  await expect(page.locator('#ui-root')).toHaveAttribute('data-scene', 'street');
  // « Nouveau : … » (forme prévue pour src/sim/unlocks.js)
  await page.evaluate(() => {
    const ui = window.__rdbUi;
    ui.campaign.endAfternoon();
    ui.campaign.state.cards.unshift({ type: 'info', id: 'unlock:test_tool', unlock: 'test_tool', title: 'Nouveau : le relevé de décibels', text: 'Visez la rue et mesurez.', hint: 'B / RB' });
    ui.campaign.state.step = 'cards';
    ui.render();
  });
  await expect(page.locator('[data-testid=card][data-type=unlock]')).toContainText('relevé de décibels');
  await expect(page.locator('[data-testid=unlock-hint] kbd')).toHaveText('B');
  await page.keyboard.press('Digit1');
  await expect(page.locator('[data-testid=card][data-id="unlock:test_tool"]')).toHaveCount(0);
  // Le rebondissement de la nuit, en carte d'ouverture
  await page.evaluate(() => {
    const ui = window.__rdbUi;
    ui.campaign.state.step = 'night';
    ui.campaign.tonightTwist = () => ({ id: 'birthday_t4', title: 'Anniversaire à la table 4', intro: 'Onze personnes, des bougies, et une chanson prévue à 23h40.' });
    ui.render();
  });
  await expect(page.locator('[data-testid=night]')).toHaveAttribute('data-twist', 'birthday_t4');
  await expect(page.locator('[data-testid=twist-title]')).toHaveText('Anniversaire à la table 4');
  await expect(page.locator('[data-testid=night-go]')).toBeFocused();
});

// Avec la vraie art.day (agent art) dans le jeu : le matin Koddex en 3D, le terminal sur le moniteur
test('dans le jeu, avec la vraie art.day : terminal posé sur le moniteur de Koddex', async ({ page }) => {
  test.setTimeout(300_000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.addInitScript(() => { globalThis.__rdbUiSpeed = 0; localStorage.setItem('rdb.quality', 'moyen'); });
  await page.goto('/?nolock=1&seed=5');
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('rdb.quality', 'moyen'); });
  await page.reload();
  await page.click('#campaign');
  await page.click('[data-testid=title-new]');
  await page.click('[data-testid=intro-skip]');
  await page.evaluate(() => {
    const ui = window.__rdb.ui; const c = ui.campaign;
    for (let i = 0; i < 50 && c.step === 'cards'; i++) c.resolveCard(c.card().choices.find((x) => x.available)?.i ?? 0);
    ui.render();
  });
  await expect(page.locator('[data-testid=terminal]')).toBeVisible();
  await expect(page.locator('#ui-root')).toHaveAttribute('data-stage', 'day3d', { timeout: 60_000 });
  await expect(page.locator('#ui-root')).toHaveClass(/on-monitor/, { timeout: 60_000 });
  // la scène de jour est vraiment dessinée (QA v1.1 : fond orange seul, rien derrière)
  const day = await page.evaluate(() => { const d = window.__rdb.world.art.day; return { active: d.active, rect: !!d.screenRect() }; });
  expect(['koddex', 'home']).toContain(day.active);
  expect(day.rect).toBe(true);
    // le terminal garde sa hauteur sur le moniteur (régression : une grille l'écrasait à 0 px)
  expect(await page.locator('[data-testid=terminal]').evaluate((el) => el.getBoundingClientRect().height)).toBeGreaterThan(60);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'test-results/v11-real-koddex.png' });
  expect(errors).toEqual([]);
});

// Page cachée (onglet en arrière-plan, automatisation) : la boucle d'art.day saute les images ; la première est dessinée quand même
test('dans le jeu, page cachée : la scène de jour 3D a sa première image (pas de fond vide)', async ({ page }) => {
  test.setTimeout(300_000);
  await page.addInitScript(() => {
    globalThis.__rdbUiSpeed = 0;
    Object.defineProperty(document, 'hidden', { get: () => true, configurable: true });
  });
  await page.goto('/?nolock=1&seed=5');
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('rdb.quality', 'moyen'); });
  await page.reload();
  await page.click('#campaign');
  await page.click('[data-testid=title-new]');
  await page.click('[data-testid=intro-skip]');
  await expect(page.locator('#ui-root')).toHaveAttribute('data-stage', 'day3d', { timeout: 60_000 });
  await expect.poll(() => page.evaluate(() => !!window.__rdb.world.art.day.screenRect()), { timeout: 30_000 }).toBe(true);
});

// Un seul écran titre : le titre 3D du jeu porte le menu complet (Continuer / Nouvelle campagne / Nuit libre / Aide)
test('un seul écran titre : le menu est sur le titre 3D, pas de second titre', async ({ page }) => {
  await page.goto('/?nolock=1&seed=5');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator('#title [data-testid=title-menu]')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('#title #start')).toContainText('Nuit libre');
  await expect(page.locator('#title [data-testid=title-new]')).toBeHidden();
  await page.click('#campaign');
  await expect(page.locator('#title [data-testid=title-new]')).toBeVisible();
  await expect(page.locator('#title [data-testid=title-continue]')).toHaveCount(0);
  await expect(page.locator('#ui-root .ui-title')).toHaveCount(0);
  await page.click('[data-testid=title-new]');
  await expect(page.locator('[data-testid=intro]')).toBeVisible();
  await expect(page.locator('#title')).toBeHidden();
  // Quitter vers le titre : retour au titre 3D (avec « Continuer »)
  await page.click('[data-testid=intro-skip]');
  await page.keyboard.press('Escape');
  await page.click('[data-testid=menu-quit]');
  await page.click('[data-testid=menu-quit]');
  await expect(page.locator('#title')).toBeVisible();
  await page.click('#campaign');
  await expect(page.locator('#title [data-testid=title-continue]')).toContainText('jour 1');
});
