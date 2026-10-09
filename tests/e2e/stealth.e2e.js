import { test, expect } from '@playwright/test';
import { watchErrors } from './helpers.js';

// Discrétion jouable (playtest 2 de Lucas, GAME_DESIGN §12d, §13.N), dans la vraie nuit 3D d'une campagne.
// Ce qui n'est pas encore sur main se désactive (test.skip, avec la raison) :
//   • modèle d'attention : une diversion détourne des témoins pendant quelques minutes (« Qui regarde ? » se met à jour) ;
//   • fenêtres propices des twists (« Fenêtre propice », horloge à ×1) ;
//   • conseil « au lit » qui respecte les plans illégaux (« la rue se vide après 1h… »).
// La mesure chiffrée (≥ 30 % sans être vu avec une diversion, ≤ 10 % sans) : scripts/stealth-measure.js → qa/stealth.md.

async function newCampaign(page, seed = 3) {
  await page.goto(`/?nolock=1&seed=${seed}`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.click('#campaign');
  await page.click('[data-testid=title-new]');
  if (await page.locator('[data-testid=intro-skip]').count()) await page.click('[data-testid=intro-skip]');
  await expect(page.locator('[data-testid=day-header]')).toHaveAttribute('data-day', '1');
}
// Jusqu'à la nuit du jour `day` par l'API (nuits simulées sans 3D) ; `prep(c)` peut poser l'état de départ de la nuit
const nightOf = (page, day, prepSrc = '() => {}') => page.evaluate(({ day, prepSrc }) => {
  const { ui } = window.__rdb, c = ui.campaign;
  for (let i = 0; i < 4000 && !c.ended && !(c.step === 'night' && c.state.day >= day); i++) {
    if (c.step === 'cards') c.resolveCard(c.card().choices.find((x) => x.available)?.i ?? 0);
    else if (c.step === 'koddex') c.koddex(['work', 'work', 'work']);
    else if (c.step === 'actions') c.endAfternoon();
    else if (c.step === 'night') { const sim = c.createNight(); for (let k = 0; !sim.state.ended && k < 3000; k++) { for (let ev = c.nightEventDue?.(sim); ev; ev = c.nightEventDue(sim)) c.resolveNightEvent(sim, 0); sim.tick(1); } c.finishNight(sim); }
    else if (c.step === 'recap') c.nextDay();
  }
  new Function('c', `return (${prepSrc})(c);`)(c);
  localStorage.setItem(window.__rdb.saveKey, JSON.stringify(c.save()));
  ui.render();
  return c.state.day;
}, { day, prepSrc: prepSrc.toString() });
async function enterNight(page) {
  await Promise.all([page.waitForURL(/mode=night/), page.click('[data-testid=night-go]')]);
  await page.locator('#hud:visible, #start:visible').first().waitFor({ timeout: 60_000 });
  if (await page.locator('#start').isVisible()) await page.click('#start');
  await page.evaluate(() => window.__rdb.step(4));
}
// Avance la nuit 3D jusqu'à `min`, en jouant au premier choix les événements de nuit (overlay)
async function advance(page, min) {
  for (let k = 0; k < 20; k++) {
    const due = await page.evaluate((m) => {
      const r = window.__rdb, { sim } = r, c = r.campaign;
      for (let i = 0; sim.state.min < m && !sim.state.ended && i < 8000; i++) {
        if (c.nightEventDue?.(sim)) { r.step(1); return true; }
        sim.tick(0.5); if (i % 60 === 0) r.step(1);
      }
      r.step(2);
      return false;
    }, min);
    if (!due) return;
    await page.locator('#nightmenu-list button:not([disabled])').first().click();
  }
}

test.describe('§12d.4 · la fenêtre tardive', () => {
  test('à 1h la rue se vide pour de bon ; la nuit va jusqu’à 2h30, puis le bilan', async ({ page }) => {
    test.setTimeout(300_000);
    const errors = watchErrors(page);
    await newCampaign(page);
    await nightOf(page, 2);
    await enterNight(page);
    expect(await page.evaluate(() => window.__rdb.sim.cfg.RULES.nightEnd)).toBe(26 * 60 + 30);
    await advance(page, 25 * 60 + 5);
    const at1 = await page.evaluate(() => { const { sim } = window.__rdb; return { out: sim.state.tables.filter((t) => t.out).length, standing: sim.activeStanding().length, min: sim.state.min }; });
    expect(at1, `à 1h05 : ${JSON.stringify(at1)}`).toMatchObject({ out: 0, standing: 0 });
    await advance(page, 26 * 60 + 20);
    const late = await page.evaluate(() => ({ out: window.__rdb.sim.state.tables.filter((t) => t.out).length, ended: window.__rdb.sim.state.ended }));
    expect(late, 'aucune table ne ressort après 1h, et la nuit n’est pas finie à 2h20').toEqual({ out: 0, ended: false });
    await advance(page, 27 * 60);
    await expect(page.locator('[data-testid=recap]')).toBeVisible({ timeout: 60_000 });
    expect(errors).toEqual([]);
  });
});

test.describe('§12d.5 · le déguisement', () => {
  // BUG-011 (qa/bugs.md) : le déguisement mis pendant la nuit ne change pas sim.disguise (calculé une fois, au début de la nuit).
  (process.env.QA_RUN_FIXME ? test : test.fixme)('BUG-011 · dans l’appartement, le menu de nuit propose la capuche ; la mettre rend Pilou moins reconnaissable', async ({ page }) => {
    test.setTimeout(300_000);
    await newCampaign(page);
    await nightOf(page, 3);
    await enterNight(page);
    await advance(page, 21 * 60);
    await page.evaluate(() => {
      const r = window.__rdb, { sim, player, world } = r;
      player.loc = 'apt'; player.pos.set((world.apt.x0 + world.apt.x1) / 2, world.apt.floor, (world.apt.z0 + world.apt.z1) / 2); r.step(2);
      r.key('KeyN'); r.step(1);
    });
    const menu = page.locator('#nightmenu');
    await expect(menu).toBeVisible();
    const here = menu.locator('#nightmenu-list');
    const hood = here.locator('button', { hasText: 'capuche' }).first();
    await expect(hood, 'la capuche est proposée chez Pilou').toBeVisible();
    const before = await page.evaluate(() => window.__rdb.sim.disguise);
    await hood.click();
    await page.evaluate(() => window.__rdb.step(4));
    const after = await page.evaluate(() => ({ disguise: window.__rdb.sim.disguise, flag: window.__rdb.campaign.has('disguise_hood') }));
    expect(after.flag, 'drapeau disguise_hood').toBe(true);
    expect(after.disguise, `déguisement ${before} → ${after.disguise}`).toBeLessThan(before);
  });
});

test.describe('§12d.1–3 · diversions, fenêtres, « Qui regarde ? »', () => {
  test('une diversion retire ses témoins de « Qui regarde ? » pour sa durée, puis ils reviennent', async ({ page }) => {
    test.setTimeout(300_000);
    await newCampaign(page);
    await nightOf(page, 3, (c) => { for (const f of ['met_seb_nico']) if (!c.state.flags.includes(f)) c.state.flags.push(f); });
    await enterNight(page);
    await advance(page, 22 * 60 + 15);
    const hud = page.locator('#watchers, [data-testid=watchers]');
    test.skip(!(await hud.count()), '« Qui regarde ? » pas encore sur main (#watchers absent)');
    await page.evaluate(() => { const r = window.__rdb; r.player.loc = 'street'; r.player.pos.set(0, 0, r.sim.cfg.ANCHORS.pilouWindow.z + 3); r.step(4); });
    const before = await hud.innerText();
    const res = await page.evaluate(() => window.__rdb.campaign.doNightAction(window.__rdb.sim, 'night_fake_alert'));
    expect(res?.ok, JSON.stringify(res)).not.toBe(false);
    await page.evaluate(() => window.__rdb.step(4));
    const during = await hud.innerText();
    expect(before, 'Seb & Nico regardaient avant').toMatch(/Seb|Nico|🐈/);
    expect(during, 'Seb & Nico ne regardent plus pendant la fausse alerte').not.toMatch(/Seb|Nico|🐈/);
    await advance(page, (await page.evaluate(() => window.__rdb.sim.state.min)) + 6);
    await page.evaluate(() => { const r = window.__rdb; r.player.loc = 'street'; r.player.pos.set(0, 0, r.sim.cfg.ANCHORS.pilouWindow.z + 3); r.step(4); });
    const back = await hud.innerText();
    const catHome = await page.evaluate(() => window.__rdb.sim.catPresent?.() ?? true);
    if (catHome) expect(back, 'Seb & Nico reviennent après la diversion').toMatch(/Seb|Nico|🐈/);
  });

  test('un moment de twist ouvre une « Fenêtre propice » (et l’horloge repasse à ×1)', async ({ page }) => {
    test.setTimeout(300_000);
    await newCampaign(page);
    await nightOf(page, 3);
    await enterNight(page);
    const has = await page.evaluate(() => typeof window.__rdb.sim.windowNow === 'function');
    test.skip(!has, 'fenêtres propices pas encore sur main (sim.windowNow absent)');
    const found = await page.evaluate(() => {
      const r = window.__rdb, { sim } = r;
      for (let i = 0; !sim.state.ended && i < 8000; i++) { if (sim.windowNow()) { r.step(2); return true; } sim.tick(0.25); if (i % 60 === 0) r.step(1); }
      return false;
    });
    test.skip(!found, 'pas de fenêtre propice cette nuit-là (twist sans moment)');
    await expect(page.locator('body')).toContainText('Fenêtre propice');
    await expect(page.locator('#fast')).toBeHidden();
  });

  test('conseil « au lit » : avec des plans illégaux et une stratégie non légale, il annonce plutôt que la rue se vide après 1h', async ({ page }) => {
    test.setTimeout(300_000);
    await newCampaign(page);
    await nightOf(page, 3, (c) => {
      for (const f of ['stance_direct']) if (!c.state.flags.includes(f)) c.state.flags.push(f);
      for (const u of c.content?.UNLOCKS ?? []) if (!c.state.unlocked.includes(u.id)) c.state.unlocked.push(u.id);
    });
    await enterNight(page);
    await advance(page, 22 * 60 + 35);
    await page.evaluate(() => { window.__rdb.sim.state.sleep = 15; window.__rdb.step(6); });
    const text = await page.locator('#objectives').innerText().catch(() => '');
    // Détection : une 3e raison de conseil dans le contenu (BEDTIME : aujourd'hui seulement « tired » et « done »)
    const aware = await page.evaluate(() => (window.__rdb.campaign.content?.BEDTIME ?? []).some((h) => !['tired', 'done'].includes(h.why)));
    test.skip(!aware, 'conseil « au lit » pas encore conscient des plans illégaux sur main (BEDTIME n’a que tired / done)');
    expect(text, text).toMatch(/se vide|après 1h/);
    expect(text).not.toMatch(/\[E\] au lit/);
  });
});
