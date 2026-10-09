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
      const work = page.locator('[data-testid=koddex-option][data-id=work]:enabled').first();
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
  test.setTimeout(480_000); // trois journées au clic : long sous SwiftShader sur une machine chargée
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
  // U3 : portrait rendu par art.portrait (image), pas les initiales
  // (la 1re carte peut être une carte « Nouveau » sans personnage : le portrait n'est exigé que s'il y en a un)
  const face = page.locator('[data-testid=card] .ui-portrait');
  if (await face.count()) await expect(face.first().locator('img')).toBeVisible();
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test-results/ui-card.png', fullPage: true });
  const seen = new Set();
  let checkedMenu = false;
  let checkedPhone = false;
  let reloaded = false;
  let checkedRecap = false;
  let sawNotif = false;
  const dialoguesAt = new Map(); // U4 : au plus une boîte de dialogue par transition
  for (let i = 0; i < 300 && (await day(page)) < 4; i++) {
    const s = await step(page);
    const d = await day(page);
    if (await page.locator('[data-testid=phone-notif]').count()) sawNotif = true;
    if (s === 'cards' && await page.locator('[data-testid=card][data-type=dialogue]').count()) {
      const key = `${d}:${await page.locator('.ui-phase span.on').textContent()}`;
      const id = await page.locator('[data-testid=card]').getAttribute('data-id');
      dialoguesAt.set(key, new Set([...(dialoguesAt.get(key) ?? []), id]));
      expect(dialoguesAt.get(key).size, `deux boîtes de dialogue en ${key}`).toBe(1);
    }
    // U1 : jamais deux fois le même vrai travail proposé
    if (s === 'koddex' && await page.locator('[data-testid=koddex-option][data-id=work]').count()) {
      const ids = await page.locator('[data-testid=koddex-option][data-id=work]').evaluateAll((els) => els.map((e) => e.dataset.work));
      expect(new Set(ids).size).toBe(ids.length);
    }
    // U7 : bilan de nuit riche
    if (s === 'recap' && !checkedRecap) {
      await expect(page.locator('[data-testid=recap-headline]')).not.toBeEmpty();
      await expect(page.locator('[data-testid=recap-deltas] .ui-delta')).toHaveCount(5);
      await expect(page.locator('[data-testid=recap-klaas]')).toBeVisible();
      await page.waitForTimeout(400);
      await page.screenshot({ path: 'test-results/ui-recap.png', fullPage: true });
      checkedRecap = true;
    }
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
  expect(checkedMenu && checkedPhone && reloaded && checkedRecap).toBe(true);
  expect(sawNotif, 'aucune notification du téléphone').toBe(true);
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

test('dans le jeu : « Campagne » monte l’interface des journées (src/ui)', async ({ page }) => {
  const errors = watchErrors(page);
  await page.addInitScript(() => { globalThis.__rdbUiSpeed = 0; });
  await page.goto('/?nolock=1&seed=5');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.click('#campaign');
  await page.click('[data-testid=title-new]');
  await expect(page.locator('[data-testid=intro]')).toBeVisible({ timeout: 30_000 });
  await page.click('[data-testid=intro-skip]');
  await expect(page.locator('[data-testid=day-header]')).toHaveAttribute('data-day', '1');
  // T ouvre et ferme le téléphone
  await page.keyboard.press('KeyT');
  await expect(page.locator('[data-testid=phone]')).toBeVisible();
  await page.keyboard.press('KeyT');
  await expect(page.locator('[data-testid=card]')).toBeVisible();
  await page.waitForTimeout(2500);
  await page.screenshot({ path: 'test-results/ui-game-day1.png' });
  expect(errors).toEqual([]);
});

test('Carnet (C), Aide et À propos (U10)', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/ui.html?fresh=1&fast=1&seed=9');
  await page.click('[data-testid=title-help]');
  await expect(page.locator('[data-testid=help] article')).toHaveCount(10);
  await page.click('[data-testid=help-close]');
  await page.click('[data-testid=title-about]');
  await expect(page.locator('[data-testid=about]')).toContainText('fiction');
  await page.keyboard.press('Escape');
  await page.click('[data-testid=title-new]');
  await page.click('[data-testid=intro-skip]');
  await expect(page.locator('[data-testid=carnet-open] .ui-badge')).toBeVisible();
  await page.keyboard.press('KeyC');
  await expect(page.locator('[data-testid=carnet]')).toBeVisible();
  await expect(page.locator('[data-testid=carnet] [data-codex=c_pilou]')).toBeVisible();
  await expect(page.locator('[data-testid=carnet] [data-codex=c_pilou] .ui-new')).toBeVisible();
  await page.click('[data-testid=carnet] [data-tab=rules]');
  await expect(page.locator('[data-testid=carnet] .ui-codex-card').first()).toBeVisible();
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'test-results/ui-carnet.png', fullPage: true });
  await page.keyboard.press('KeyC');
  await expect(page.locator('[data-testid=carnet]')).toHaveCount(0);
  // rouvert : les fiches déjà lues ne sont plus « nouveau »
  await page.click('[data-testid=carnet-open]');
  await expect(page.locator('[data-testid=carnet] [data-codex=c_pilou] .ui-new')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('menu (Échap) : réglages persistés, aide, carnet, quitter vers le titre', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/ui.html?fresh=1&fast=1&seed=12');
  await page.evaluate(() => localStorage.removeItem('rdb.settings.v1'));
  await page.click('[data-testid=title-new]');
  await page.click('[data-testid=intro-skip]');
  await page.keyboard.press('Escape');
  const menu = page.locator('[data-testid=menu]');
  await expect(menu).toBeVisible();
  await expect(page.locator('[data-testid=menu-resume]')).toBeFocused();
  await page.click('[data-testid=menu-bigtext]');
  await expect(page.locator('html')).toHaveClass(/rdb-big-text/);
  await page.click('[data-speed=instant]');
  await expect(page.locator('[data-speed=instant]')).toHaveAttribute('aria-checked', 'true');
  await page.click('[data-testid=menu-mute]');
  await expect(page.locator('[data-testid=menu-mute]')).toHaveAttribute('aria-checked', 'true');
  await page.click('[data-quality=haut]');
  await expect(page.locator('[data-quality=haut]')).toHaveAttribute('aria-checked', 'true');
  expect(await page.evaluate(() => localStorage.getItem('rdb.quality'))).toBe('haut');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('rdb.settings.v1')));
  expect(saved).toMatchObject({ bigText: true, textSpeed: 'instant', muted: true });
  await page.click('[data-testid=menu-carnet]');
  await expect(page.locator('#ui-menu [data-testid=carnet]')).toBeVisible();
  await page.keyboard.press('Escape'); // retour au menu
  await page.click('[data-testid=menu-help]');
  await expect(page.locator('#ui-menu [data-testid=help]')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape'); // ferme le menu
  await expect(menu).toHaveCount(0);
  await page.click('[data-testid=menu-open]');
  await page.click('[data-testid=menu-quit]');
  await page.click('[data-testid=menu-quit]');
  await expect(page.locator('[data-testid=title-continue]')).toBeVisible();
  // les réglages survivent au rechargement
  await page.reload();
  await expect(page.locator('html')).toHaveClass(/rdb-big-text/);
  await page.evaluate(() => localStorage.removeItem('rdb.settings.v1'));
  expect(errors).toEqual([]);
});

test('clavier seul : de l’écran titre au matin, focus visible', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/ui.html?fresh=1&fast=1&seed=4');
  // L'action principale est focalisée d'office : Entrée suffit pour commencer
  await expect(page.locator('[data-testid=title-new]')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-testid=intro-next]')).toBeFocused();
  for (let i = 0; i < 8 && await page.locator('[data-testid=intro]').count(); i++) await page.keyboard.press('Enter');
  // Cartes : touches 1–9 ou Entrée sur le choix focalisé, jusqu'au terminal Koddex
  for (let i = 0; i < 20 && (await step(page)) !== 'koddex'; i++) {
    const focused = await page.evaluate(() => document.activeElement?.dataset?.testid ?? document.activeElement?.tagName);
    expect(focused, 'le focus a été perdu').not.toBe('BODY');
    if (await page.locator('[data-testid=card-choice]').count() && !(await page.locator('[data-testid=result-next]').count())) await page.keyboard.press('Digit1');
    else await page.keyboard.press('Enter');
  }
  await expect(page.locator('[data-testid=terminal]')).toBeVisible();
  await expect(page.locator('[data-testid=koddex-option]').first()).toBeFocused();
  const ring = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
  expect(ring).toBe('solid');
  await page.keyboard.press('Enter');
  await expect(page.locator('.ui-prompts i.used')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('écran de fin : une du journal, épilogue, galerie de 8 fins avec la secrète en « ??? », persistance', async ({ page }) => {
  test.setTimeout(480_000);
  const errors = watchErrors(page);
  await page.goto('/ui.html?fresh=1&fast=1&seed=21');
  await page.evaluate(() => localStorage.removeItem('rdb.endings.v1'));
  await page.click('[data-testid=title-new]');
  await page.click('[data-testid=intro-skip]');
  await page.evaluate(async () => {
    const ui = window.__rdbUi; const c = ui.campaign;
    for (let i = 0; i < 5000 && !c.ended; i++) {
      if (c.step === 'cards') { const card = c.card(); c.resolveCard(card.choices.find((x) => x.available)?.i ?? 0); }
      else if (c.step === 'koddex') c.koddex(['work', 'work', 'work']);
      else if (c.step === 'actions') { const a = c.availableActions().find((x) => x.legality === 'legal'); if (a && c.state.timeLeft) c.doAction(a.id); else c.endAfternoon(); }
      else if (c.step === 'night') { const sim = c.createNight(); while (!sim.state.ended) { sim.tick(2); sim.events.length = 0; } c.finishNight(sim); }
      else if (c.step === 'recap') c.nextDay();
    }
    ui.render();
  });
  await expect(page.locator('#ui-root')).toHaveAttribute('data-step', 'ended');
  await expect(page.locator('[data-testid=ending-hero] .ui-big')).not.toBeEmpty();
  await expect(page.locator('[data-testid=ending] .ui-epilogue p').first()).toBeVisible();
  const slots = page.locator('[data-testid=endings] > div');
  await expect(slots).toHaveCount(8);
  const id = await page.locator('[data-testid=ending]').getAttribute('data-id');
  if (id !== 'turncoat') await expect(page.locator('[data-testid=endings] [data-slot=secret]')).toHaveText('???');
  await expect(page.locator(`[data-testid=endings] [data-ending="${id}"]`)).not.toHaveClass(/locked/);
  if (await page.locator('[data-testid=ending-paper]').count()) await expect(page.locator('[data-testid=ending-paper] .ui-paper-mast')).toContainText('La Voix du Nordiste');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'test-results/ui-ending.png', fullPage: true });
  // Nouvelle campagne : la galerie reste sur l'écran titre
  await page.click('[data-testid=end-new]');
  await expect(page.locator(`[data-testid=endings] [data-ending="${id}"]`)).toBeVisible();
  expect(errors).toEqual([]);
});

test('fin anticipée : la garde à vue au jour 5 affiche son vrai jour, pas la commission', async ({ page }) => {
  test.setTimeout(300_000);
  await page.goto('/ui.html?fresh=1&fast=1&seed=31');
  await page.click('[data-testid=title-new]');
  await page.click('[data-testid=intro-skip]');
  await page.evaluate(() => {
    const ui = window.__rdbUi; const c = ui.campaign;
    for (let i = 0; i < 3000 && !c.ended && !(c.state.day === 5 && c.step === 'koddex'); i++) {
      if (c.step === 'cards') { const card = c.card(); c.resolveCard(card.choices.find((x) => x.available)?.i ?? 0); }
      else if (c.step === 'koddex') c.koddex(['work', 'work', 'work']);
      else if (c.step === 'actions') c.endAfternoon();
      else if (c.step === 'night') { const sim = c.createNight(); while (!sim.state.ended) { sim.tick(2); sim.events.length = 0; } c.finishNight(sim); }
      else if (c.step === 'recap') c.nextDay();
    }
    c.apply({ ending: 'custody' }, 'engine', 'test');
    c.koddex(['work', 'work', 'work']); // le moteur vérifie les fins anticipées après chaque appel
    ui.render();
  });
  await expect(page.locator('#ui-root')).toHaveAttribute('data-step', 'ended');
  await expect(page.locator('[data-testid=ending]')).toHaveAttribute('data-id', 'custody');
  await expect(page.locator('[data-testid=ending-kicker]')).toContainText('Jour 5 · Fin anticipée');
  await expect(page.locator('[data-testid=ending-kicker]')).not.toContainText('Commission');
});

// BUG-007 (qa/bugs.md) : le verdict de la commission du J14 (le résultat du choix) s'affiche avant l'écran de fin
test('BUG-007 · le verdict de la commission du J14 est affiché avant l’écran de fin', async ({ page }) => {
  test.setTimeout(300_000);
  await page.goto('/ui.html?fresh=1&fast=1&seed=3');
  await page.click('[data-testid=title-new]');
  await page.click('[data-testid=intro-skip]');
  const reached = await page.evaluate(() => {
    const ui = window.__rdbUi; const c = ui.campaign;
    for (let i = 0; i < 6000 && !c.ended; i++) {
      if (c.step === 'cards') { const k = c.card(); if (k.id === 'd14_commission') break; c.resolveCard(k.choices.find((x) => x.available)?.i ?? 0); }
      else if (c.step === 'koddex') c.koddex(['work', 'work', 'work']);
      else if (c.step === 'actions') c.endAfternoon();
      else if (c.step === 'night') { const sim = c.createNight(); for (let k = 0; !sim.state.ended && k < 3000; k++) { for (let ev = c.nightEventDue?.(sim); ev; ev = c.nightEventDue(sim)) c.resolveNightEvent(sim, ev.choices.find((x) => x.available)?.i ?? 0); sim.tick(1); } c.finishNight(sim); }
      else if (c.step === 'recap') c.nextDay();
    }
    ui.render();
    return c.card()?.id ?? null;
  });
  test.skip(reached !== 'd14_commission', 'cette graine n’atteint pas la commission');
  // une plaidoirie disponible qui a un texte de résultat
  const i = await page.evaluate(() => { const c = window.__rdbUi.campaign; const k = c.card(); return k.choices.find((ch) => ch.available && k.data.choices?.[ch.i]?.result)?.i ?? null; });
  test.skip(i === null, 'aucune plaidoirie avec un résultat');
  await page.click(`[data-testid=card-choice][data-i="${i}"]`);
  await expect(page.locator('[data-testid=result]')).toBeVisible();
  await expect(page.locator('[data-testid=ending]')).toHaveCount(0);
  await page.click('[data-testid=result-next]');
  await expect(page.locator('[data-testid=ending]')).toBeVisible();
});
