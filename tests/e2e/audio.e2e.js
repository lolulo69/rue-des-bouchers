import { test, expect } from '@playwright/test';
import { watchErrors } from './helpers.js';

// §12c.1 / §13.K : le son survit à toutes les transitions. Au jour 5 d'une campagne : le contexte audio tourne,
// la musique (lo-fi) et l'ambiance sont branchées et produisent du son ; la nuit 5 (après rechargement) : rue + nappe
// de nuit ; retour au jour 6 sans rechargement : lo-fi, rue coupée. Mesures par audio.debug() (analyseurs par bus).

// Joue la campagne par l'API (nuits simulées sans 3D) jusqu'à l'étape 'night' du jour `day`
const playTo = (page, day) => page.evaluate((day) => {
  const { ui } = window.__rdb, c = ui.campaign;
  for (let i = 0; i < 4000 && !c.ended && !(c.state.day >= day && c.step === 'night'); i++) {
    if (c.step === 'cards') c.resolveCard(c.card().choices.find((x) => x.available)?.i ?? 0);
    else if (c.step === 'koddex') c.koddex(['work', 'work', 'work']);
    else if (c.step === 'actions') c.endAfternoon();
    else if (c.step === 'night') {
      const sim = c.createNight();
      for (let k = 0; !sim.state.ended && k < 2000; k++) {
        for (let ev = c.nightEventDue?.(sim); ev; ev = c.nightEventDue(sim)) c.resolveNightEvent(sim, ev.choices.find((x) => x.available)?.i ?? 0);
        sim.tick(1);
      }
      c.finishNight(sim);
    } else if (c.step === 'recap') c.nextDay();
  }
  localStorage.setItem(window.__rdb.saveKey, JSON.stringify(c.save()));
  ui.render();
  return { day: c.state.day, step: c.step, ended: c.ended };
}, day);

// Attend que le moteur soit dans la scène voulue et que les bus demandés aient du signal (RMS moyen sur ~1 s)
async function audible(page, scene, buses) {
  let last = null;
  for (let tries = 0; tries < 12; tries++) {
    last = await page.evaluate(async () => {
      const a = window.__rdb.world.audio, acc = {};
      for (let i = 0; i < 10; i++) { if (window.__rdb.campaign && !window.__rdb.ui) window.__rdb.step(1); const r = a.debug().rms; for (const k in r) acc[k] = Math.max(acc[k] ?? 0, r[k]); await new Promise((res) => setTimeout(res, 100)); }
      const d = a.debug();
      return { state: d.state, scene: d.scene, music: d.music, gate: d.street.gate, attached: d.street.attached, buses: d.buses, peak: acc };
    });
    if (last.state === 'running' && last.scene === scene && buses.every((b) => last.peak[b] > 0) && (scene !== 'night' || last.gate > 0.5)) return last;
    await page.mouse.click(4, 4); // un geste de plus (relance du contexte si le navigateur l'a suspendu)
  }
  return last;
}

test('audio vivant au jour 5+ : jour → nuit (rechargement) → jour, contexte et bus branchés', async ({ page }) => {
  test.setTimeout(240_000);
  const errors = watchErrors(page);
  await page.goto('/?nolock=1&seed=5');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.click('#campaign');
  await page.click('[data-testid=title-new]');
  if (await page.locator('[data-testid=intro-skip]').count()) await page.click('[data-testid=intro-skip]');
  await expect(page.locator('[data-testid=day-header]')).toHaveAttribute('data-day', '1');

  const r = await playTo(page, 5);
  test.skip(r.ended, `campagne terminée avant le jour 5 (${JSON.stringify(r)})`);
  expect(r.day).toBeGreaterThanOrEqual(5);

  // Jour 5 : lo-fi, rue coupée
  const day = await audible(page, 'day', ['music', 'master']);
  expect(day.state, JSON.stringify(day)).toBe('running');
  expect(day.scene).toBe('day');
  expect(day.music).toBe('lofi');
  expect(day.buses.music.effective).toBeGreaterThan(0);
  expect(day.peak.music, `musique muette le jour 5 : ${JSON.stringify(day)}`).toBeGreaterThan(0);

  // Nuit 5 (la page se recharge) : il faut un geste pour relancer le son, comme un joueur
  await Promise.all([page.waitForURL(/mode=night/), page.evaluate(() => { setTimeout(() => window.__rdb.goNight(), 0); })]);
  await page.waitForFunction(() => window.__rdb?.world && window.__rdb.campaign);
  await page.mouse.click(640, 360);
  await page.evaluate(() => window.__rdb.step(30));
  const night = await audible(page, 'night', ['ambience', 'master']);
  expect(night.state, JSON.stringify(night)).toBe('running');
  expect(night.scene).toBe('night');
  expect(night.music).toBe('night');
  expect(night.attached, 'la rue est branchée sur le moteur').toBe(true);
  expect(night.gate, 'la rue s’entend la nuit').toBeGreaterThan(0.3);
  expect(night.peak.ambience, `ambiance muette la nuit 5 : ${JSON.stringify(night)}`).toBeGreaterThan(0);

  // Fin de nuit → bilan → jour 6, sur la même page : la musique du jour revient, la rue se tait
  await page.evaluate(() => {
    const { sim, step } = window.__rdb;
    for (let i = 0; !sim.state.ended && i < 4000; i++) { sim.tick(0.5); if (i % 60 === 0) step(1); }
    step(2);
  });
  await expect(page.locator('[data-testid=recap]')).toBeVisible({ timeout: 30_000 });
  const after = await audible(page, 'day', ['music']);
  expect(after.state, JSON.stringify(after)).toBe('running');
  expect(after.scene).toBe('day');
  expect(after.music).toBe('lofi');
  expect(after.gate, 'la rue est coupée le jour').toBeLessThan(0.1);
  expect(after.peak.music).toBeGreaterThan(0);
  expect(errors.filter((e) => /audio/i.test(e))).toEqual([]);
});
