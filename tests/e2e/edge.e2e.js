import { test, expect } from '@playwright/test';
import { watchErrors, hhmm } from './helpers.js';

// Cas limites (QA passe 2) : écraser une sauvegarde, recharger en pleine nuit, jouer une journée au clavier, touche M.

async function newCampaign(page, seed = 5) {
  await page.goto(`/?nolock=1&seed=${seed}`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.click('#campaign');
  await page.click('[data-testid=title-new]');
  if (await page.locator('[data-testid=intro-skip]').count()) await page.click('[data-testid=intro-skip]');
  await expect(page.locator('[data-testid=day-header]')).toHaveAttribute('data-day', '1');
}
// Avance par l'API du moteur jusqu'à l'étape voulue (nuits simulées sans 3D), sauvegarde, redessine
const driveTo = (page, target, { day = 0 } = {}) => page.evaluate(({ target, day }) => {
  const { ui } = window.__rdb, c = ui.campaign;
  for (let i = 0; i < 3000 && !c.ended && !(c.step === target && c.state.day >= day); i++) {
    if (c.step === 'cards') { const k = c.card(); c.resolveCard(k.choices.find((x) => x.available)?.i ?? 0); }
    else if (c.step === 'koddex') c.koddex(['work', 'work', 'work']);
    else if (c.step === 'actions') c.endAfternoon();
    else if (c.step === 'night') { const sim = c.createNight(); for (let k = 0; !sim.state.ended && k < 2000; k++) sim.tick(1); c.finishNight(sim); }
    else if (c.step === 'recap') c.nextDay();
  }
  localStorage.setItem(window.__rdb.saveKey, JSON.stringify(c.save()));
  ui.render();
  return { step: c.step, day: c.state.day };
}, { target, day });
const saved = (page) => page.evaluate(() => JSON.parse(localStorage.getItem(window.__rdb.saveKey) ?? 'null'));

test('« Nouvelle campagne » avec une sauvegarde : demande confirmation, n’écrase qu’au 2e clic', async ({ page }) => {
  const errors = watchErrors(page);
  await newCampaign(page);
  expect(await driveTo(page, 'actions', { day: 2 })).toEqual({ step: 'actions', day: 2 });
  const before = await saved(page);
  await page.goto('/?nolock=1&seed=5');
  await page.click('#campaign');
  await expect(page.locator('[data-testid=title-continue]')).toContainText('jour 2');
  await page.click('[data-testid=title-new]');
  await expect(page.locator('[data-testid=title-new]')).toContainText(/Écraser|confirm/i);
  expect(await saved(page), 'un seul clic ne touche pas à la sauvegarde').toEqual(before);
  await page.click('[data-testid=title-new]');
  if (await page.locator('[data-testid=intro-skip]').count()) await page.click('[data-testid=intro-skip]');
  await expect(page.locator('[data-testid=day-header]')).toHaveAttribute('data-day', '1');
  expect((await saved(page))?.state?.day ?? 1).toBe(1);
  expect(errors).toEqual([]);
});

test('recharger en pleine nuit : on reprend cette nuit-là à son début (ou au bilan), pas un autre jour', async ({ page }) => {
  test.setTimeout(240_000);
  await newCampaign(page);
  expect((await driveTo(page, 'night', { day: 2 })).day).toBe(2);
  await Promise.all([page.waitForURL(/mode=night/), page.click('[data-testid=night-go]')]);
  await page.locator('#hud:visible, #start:visible').first().waitFor({ timeout: 60_000 });
  if (await page.locator('#start').isVisible()) await page.click('#start');
  await page.evaluate((t) => { const r = window.__rdb; for (let i = 0; r.sim.state.min < t && i < 4000; i++) r.sim.tick(0.5); r.step(2); }, hhmm(23, 0));
  await page.reload();
  await page.waitForFunction(() => window.__rdb && (window.__rdb.sim || window.__rdb.ui), null, { timeout: 60_000 });
  await page.locator('#hud:visible, #start:visible, [data-testid=recap], #campaign:visible').first().waitFor({ timeout: 60_000 });
  const r = await page.evaluate(() => ({
    url: location.search, step: window.__rdb.campaign?.step ?? null, day: window.__rdb.campaign?.state.day ?? null,
    min: window.__rdb.sim?.state.min ?? null, recap: !!document.querySelector('[data-testid=recap]'),
  }));
  if (r.recap) expect(r.day).toBe(2);
  else {
    expect(r.url, `rechargement : ${JSON.stringify(r)}`).toContain('mode=night');
    expect(r.day).toBe(2);
    expect(r.step).toBe('night');
    expect(r.min, 'la nuit repart de son début').toBeLessThan(hhmm(21, 0));
  }
});

// BUG-005 (qa/bugs.md) : main.js annule Tab partout (preventDefault global pour le dossier de nuit) → navigation clavier impossible le jour.
(process.env.QA_RUN_FIXME ? test : test.fixme)('BUG-005 · une journée au clavier seul (Tab / Entrée) : Koddex puis après-midi', async ({ page }) => {
  await newCampaign(page);
  expect((await driveTo(page, 'koddex')).step).toBe('koddex');
  const focusOn = async (testid, max = 60) => {
    for (let i = 0; i < max; i++) {
      await page.keyboard.press('Tab');
      const f = await page.evaluate(() => ({ id: document.activeElement?.dataset?.testid ?? null, disabled: !!document.activeElement?.disabled }));
      if (f.id === testid && !f.disabled) return true;
    }
    return false;
  };
  // Koddex : 3 prompts au clavier (l'effet machine à écrire désactive les boutons un instant)
  for (let k = 0; k < 3; k++) {
    await page.waitForFunction(() => [...document.querySelectorAll('[data-testid=koddex-option]')].some((b) => !b.disabled) || document.querySelector('[data-testid=koddex-done]'), null, { timeout: 30_000 });
    if (await page.locator('[data-testid=koddex-done]').count()) break;
    expect(await focusOn('koddex-option'), `prompt ${k + 1} atteignable au clavier`).toBe(true);
    const outline = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
    expect(outline, 'le focus clavier est visible').not.toBe('none');
    await page.keyboard.press('Enter');
  }
  await page.waitForFunction(() => { const b = document.querySelector('[data-testid=koddex-done]'); return b && !b.disabled; }, null, { timeout: 60_000 });
  expect(await focusOn('koddex-done')).toBe(true);
  await page.keyboard.press('Enter');
  // Après-midi (les cartes éventuelles se résolvent aussi au clavier)
  for (let i = 0; i < 10 && (await page.evaluate(() => window.__rdb.ui.campaign.step)) === 'cards'; i++) {
    const target = (await page.locator('[data-testid=result-next]').count()) ? 'result-next' : 'card-choice';
    expect(await focusOn(target)).toBe(true);
    await page.keyboard.press('Enter');
  }
  expect(await page.evaluate(() => window.__rdb.ui.campaign.step)).toBe('actions');
  const left0 = Number(await page.locator('[data-testid=slots]').getAttribute('data-left'));
  expect(await focusOn('action'), 'une action atteignable au clavier').toBe(true);
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-testid=result]')).toBeVisible();
  expect(await focusOn('result-next')).toBe(true);
  await page.keyboard.press('Enter');
  expect(Number(await page.locator('[data-testid=slots]').getAttribute('data-left'))).toBeLessThan(left0);
  expect(await focusOn('action-end')).toBe(true);
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => window.__rdb.ui.campaign.step)).not.toBe('actions');
});

test('M coupe et rétablit le son (avec un message à l’écran)', async ({ page }) => {
  await page.goto('/?nolock=1&seed=7');
  await page.click('#start');
  await page.locator('#hud').waitFor({ state: 'visible' });
  await page.keyboard.press('KeyM');
  await expect(page.getByText('Son coupé (M)')).toBeVisible();
  await page.keyboard.press('KeyM');
  await expect(page.getByText(/🔊 Son \(M\)/)).toBeVisible();
});
