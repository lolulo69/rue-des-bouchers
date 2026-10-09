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

test('Échap pendant la nuit : le menu de pause / réglages de l\'interface s\'ouvre, « Reprendre » le ferme', async ({ page }) => {
  await page.goto('/?nolock=1&seed=2');
  await page.click('#start');
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-testid=menu]')).toBeVisible();
  await page.click('[data-testid=menu-resume]');
  await expect(page.locator('[data-testid=menu]')).toBeHidden();
  // le jeu reprend : le temps avance de nouveau
  const t = await page.evaluate(() => { const before = window.__rdb.sim.state.min; window.__rdb.step(10); return window.__rdb.sim.state.min - before; });
  expect(t).toBeGreaterThan(0);
});

test('tutoriel pratique, nuit 1 : la marque apparaît, l\'horloge se fige un instant, marcher fait avancer l\'étape', async ({ page }) => {
  test.setTimeout(240_000);
  await page.goto('/?nolock=1&seed=12');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.click('#campaign');
  await page.click('[data-testid=title-new]');
  if (await page.locator('[data-testid=intro-skip]').count()) await page.click('[data-testid=intro-skip]');
  await page.evaluate(() => {
    const c = window.__rdb.ui.campaign;
    for (let i = 0; i < 200 && c.step !== 'night'; i++) {
      if (c.step === 'cards') c.resolveCard(c.card().choices.find((x) => x.available)?.i ?? 0);
      else if (c.step === 'koddex') c.koddex(['work', 'work', 'work']);
      else if (c.step === 'actions') c.endAfternoon();
    }
    localStorage.setItem(window.__rdb.saveKey, JSON.stringify(c.save()));
  });
  await page.goto('/?nolock=1&mode=night&seed=12');
  await page.locator('#hud').waitFor({ state: 'visible' });
  const r = await page.evaluate(() => {
    const { sim, step } = window.__rdb;
    step(6); // la marque s'affiche au rafraîchissement du HUD
    const t0 = sim.state.min;
    step(30); // 1 s : horloge figée
    const paused = sim.state.min - t0;
    return { coach: !document.getElementById('coach').classList.contains('hidden'), text: document.getElementById('coach-text').textContent, paused };
  });
  expect(r.coach, 'marque de tutoriel visible').toBe(true);
  expect(r.paused).toBe(0);
  // Marcher : l'étape « marcher » est validée (le texte change ou la marque se termine)
  const after = await page.evaluate(() => {
    const { player, step } = window.__rdb;
    for (let i = 0; i < 30; i++) { player.pos.z += 0.2; window.__rdb.key('KeyW'); }
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' }));
    step(40);
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW' }));
    step(6);
    return { text: document.getElementById('coach-text').textContent, step: window.__rdb.campaign.tutorialStep('tuto_move') };
  });
  expect(after.step).toBeGreaterThanOrEqual(1);
  await page.click('#coach-skip');
  expect(await page.evaluate(() => window.__rdb.campaign.state.tutorials.done.length)).toBeGreaterThan(0);
});

test('twist « camionnette dans le couloir » : la photo de la camionnette entre au dossier', async ({ page }) => {
  await page.goto('/?nolock=1&seed=4');
  await page.click('#start');
  const r = await page.evaluate(() => {
    const { sim, player, step } = window.__rdb;
    sim.state.corridorBlocked = true; // nuit libre : on pose le twist à la main
    const v = sim.cfg.ANCHORS.van;
    player.loc = 'street';
    player.pos.set(v.x, 0, v.z + 6);
    player.yaw = 0; // regarde vers -z, la camionnette
    player.pitch = -0.1;
    step(2);
    window.__rdb.key('KeyP');
    return sim.state.evidence.map((e) => e.kind);
  });
  expect(r).toContain('corridor_blocked');
});

test('une scène de jour en 3D (art.day) met en pause le rendu de la nuit', async ({ page }) => {
  await page.goto('/?nolock=1&seed=2');
  await expect(page.locator('#loader')).toBeHidden({ timeout: 60_000 });
  const r = await page.evaluate(async () => {
    const R = window.__rdb;
    const day = R.world.art?.day;
    if (!day) return { skip: true };
    const before = R.renderCount; R.step(3); const running = R.renderCount - before;
    const ok = await day.start('street', { host: document.body });
    const b2 = R.renderCount; R.step(5); const paused = R.renderCount - b2;
    day.stop();
    const b3 = R.renderCount; R.step(3); const resumed = R.renderCount - b3;
    return { ok, running, paused, resumed };
  });
  if (r.skip) return;
  expect(r.running).toBe(3);
  if (r.ok) expect(r.paused).toBe(0);
  expect(r.resumed).toBe(3);
});
