import { test, expect } from '@playwright/test';
import { watchErrors } from './helpers.js';

// Playtest 1 de Lucas (GAME_DESIGN §12c, §13.K) : son, musique, pastilles, menu de nuit.
// Écrits avant les correctifs : chaque test détecte sa fonction et se désactive (test.skip, avec la raison) tant
// qu'elle n'est pas sur main. Contrats attendus (Build note « qa-playtest1 ») :
//   • window.__rdb.world.audio.state ('running') et, pour le mixage, audio.levels() → { master, music, ambience, sfx, exhaust, crowd }
//     (gains effectifs 0–1 à cet instant, après spatialisation) ;
//   • messages du téléphone : data-media sur chaque message (phone.js)
//   • menu Échap : trois curseurs input[type=range] (Musique / Ambiance / Effets) + on/off, mémorisés ;
//   • menu de nuit (N) : un groupe « Ici, maintenant », et pour les actions indisponibles une raison lisible.

async function newCampaign(page, seed = 3) {
  await page.goto(`/?nolock=1&seed=${seed}`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.click('#campaign');
  await page.click('[data-testid=title-new]');
  if (await page.locator('[data-testid=intro-skip]').count()) await page.click('[data-testid=intro-skip]');
  await expect(page.locator('[data-testid=day-header]')).toHaveAttribute('data-day', '1');
}
// Joue par l'API jusqu'à `stop(c)` (nuits simulées sans 3D), sauvegarde et redessine
const playUntil = (page, stopSrc) => page.evaluate((src) => {
  const { ui } = window.__rdb, c = ui.campaign;
  const stop = new Function('c', `return (${src})(c);`);
  for (let i = 0; i < 4000 && !c.ended && !stop(c); i++) {
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
  return { step: c.step, day: c.state.day };
}, stopSrc.toString());
// Descend dans la nuit 3D de la campagne et y fait un geste (le navigateur n'ouvre l'audio qu'après un geste)
async function enterNight(page) {
  await Promise.all([page.waitForURL(/mode=night/), page.click('[data-testid=night-go]')]);
  await page.locator('#hud:visible, #start:visible, #pause:visible').first().waitFor({ timeout: 60_000 });
  if (await page.locator('#start').isVisible()) await page.click('#start');
  if (await page.locator('#pause').isVisible()) await page.click('#pause');
  await page.mouse.click(640, 360);
  await page.evaluate(() => window.__rdb.step(4));
}

test.describe('§12c.1 · le son', () => {
  test('audio vivant au jour 5 et plus : contexte « running » dans la nuit, puis encore au retour dans la journée', async ({ page }) => {
    test.setTimeout(300_000);
    const errors = watchErrors(page);
    await newCampaign(page);
    expect((await playUntil(page, (c) => c.step === 'night' && c.state.day >= 5)).day).toBeGreaterThanOrEqual(5);
    await enterNight(page);
    const st = await page.evaluate(() => window.__rdb.world?.audio?.state ?? 'absent');
    expect(st, 'la nuit 5 a un graphe audio actif').toBe('running');
    const lv = await page.evaluate(() => window.__rdb.world.audio.levels?.() ?? null);
    if (lv) expect(lv.master, 'volume maître non nul').toBeGreaterThan(0);
    // Fin de nuit → retour à l'interface de jour (bilan) sur la même page : l'audio reste vivant
    await page.evaluate(() => { const r = window.__rdb; for (let i = 0; !r.sim.state.ended && i < 6000; i++) { r.sim.tick(0.5); if (i % 60 === 0) r.step(1); } r.step(2); });
    await expect(page.locator('[data-testid=recap]')).toBeVisible({ timeout: 60_000 });
    await page.mouse.click(10, 10);
    expect(await page.evaluate(() => window.__rdb.world?.audio?.state ?? 'absent'), 'audio vivant dans la journée après la nuit 5').toBe('running');
    expect(errors).toEqual([]);
  });

  test('la gaine ne s’entend que chez Pilou : ≈ 0 dans la rue loin du conduit, nettement plus à la fenêtre', async ({ page }) => {
    test.setTimeout(300_000);
    await newCampaign(page);
    await playUntil(page, (c) => c.step === 'night');
    await enterNight(page);
    const has = await page.evaluate(() => typeof window.__rdb.world?.audio?.levels === 'function');
    test.skip(!has, 'mixage spatial pas encore sur main : audio.levels() absent (Build note qa-playtest1)');
    const at = (where) => page.evaluate((w) => {
      const r = window.__rdb, { sim, player, world } = r;
      const W = sim.cfg.STREET.halfWidth, win = sim.cfg.ANCHORS.pilouWindow;
      if (w === 'street') { player.loc = 'street'; player.pos.set(0, 0, win.z + 40); player.yaw = 0; }
      else { player.loc = 'apt'; player.pos.set(-W - 0.2, world.apt.floor, win.z); player.yaw = -Math.PI / 2; }
      r.step(30); // laisse les rampes de gain se poser
      return world.audio.levels();
    }, where);
    const street = await at('street');
    const window_ = await at('window');
    expect(street.exhaust, `gaine dans la rue, loin du conduit : ${JSON.stringify(street)}`).toBeLessThan(0.05);
    expect(window_.exhaust, `gaine à la fenêtre : ${JSON.stringify(window_)}`).toBeGreaterThan(0.1);
    expect(window_.exhaust).toBeGreaterThan(street.exhaust * 5);
  });
});

test.describe('§12c.3 · pastilles de notification', () => {
  // §12c.3 (Lucas) : reproduit sur main avant le correctif (pastille du téléphone à 4 après lecture) ; corrigé par l'agent UI (95104dd).
  test('ouvrir le téléphone et le carnet les vide ; elles restent vides après rechargement ; rien de neuf = pas de pastille', async ({ page }) => {
    const errors = watchErrors(page);
    await newCampaign(page);
    await playUntil(page, (c) => c.step === 'koddex');
    const phone = page.locator('[data-testid=phone-open]');
    const carnetBadge = page.locator('[data-testid=carnet-open] .ui-badge');
    const unread = async () => Number((await phone.getAttribute('data-unread')) ?? 0);
    // Téléphone : ouvrir puis fermer → 0
    await phone.click();
    await expect(page.locator('[data-testid=phone]')).toBeVisible();
    await page.click('[data-testid=phone-close]');
    expect(await unread(), 'pastille du téléphone après lecture').toBe(0);
    await expect(phone.locator('.ui-badge')).toHaveCount(0);
    // Carnet : ouvrir puis fermer → plus de pastille
    await page.click('[data-testid=carnet-open]');
    await page.click('[data-testid=carnet-close]');
    await expect(carnetBadge, 'pastille du carnet après lecture').toHaveCount(0);
    // Rechargement (« Continuer ») : toujours rien de neuf
    await page.goto('/?nolock=1&seed=3');
    await page.click('#campaign');
    await page.click('[data-testid=title-continue]');
    await expect(page.locator('[data-testid=day-header]')).toBeVisible();
    expect(await unread(), 'pastille du téléphone après rechargement, sans nouveau message').toBe(0);
    await expect(carnetBadge, 'pastille du carnet après rechargement').toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('à la phase suivante, la pastille ne compte que les messages arrivés depuis', async ({ page }) => {
    await newCampaign(page);
    await playUntil(page, (c) => c.step === 'koddex');
    // Les ids de tous les messages visibles, onglet par onglet (WhatsApp, presse, réseaux)
    const allIds = async () => {
      const ids = [];
      for (const tab of await page.locator('[data-testid=phone] [data-tab]').all()) {
        await tab.click();
        ids.push(...await page.evaluate(() => [...document.querySelectorAll('[data-testid=phone] [data-media]')].map((e) => e.dataset.media)));
      }
      return [...new Set(ids)];
    };
    await page.click('[data-testid=phone-open]');
    const seenIds = await allIds();
    await page.click('[data-testid=phone-close]');
    await playUntil(page, (c) => c.step === 'actions');
    const n = Number((await page.locator('[data-testid=phone-open]').getAttribute('data-unread')) ?? 0);
    await page.click('[data-testid=phone-open]');
    const nowIds = await allIds();
    const fresh = nowIds.filter((id) => !seenIds.includes(id));
    test.skip(!nowIds.length, 'les messages du téléphone n’exposent pas data-media (impossible de compter les nouveaux)');
    expect(n, `pastille ${n}, nouveaux messages ${fresh.length}`).toBeLessThanOrEqual(fresh.length);
  });
});

test.describe('§12c.4 · menu de nuit', () => {
  test('« Ici, maintenant » en tête, et chaque action indisponible dit pourquoi (où aller, ce qu’il faut)', async ({ page }) => {
    test.setTimeout(300_000);
    await newCampaign(page);
    await playUntil(page, (c) => c.step === 'night' && c.state.day >= 2);
    await enterNight(page);
    await page.evaluate(() => { window.__rdb.key('KeyN'); window.__rdb.step(1); });
    const menu = page.locator('#nightmenu');
    await expect(menu).toBeVisible();
    const text = await menu.innerText();
    test.skip(!/Ici, maintenant/i.test(text), 'menu de nuit refondu pas encore sur main (pas de groupe « Ici, maintenant »)');
    // Légalité, risque et temps lisibles d'un coup d'œil, et une raison pour chaque action grisée
    const items = await menu.locator('button').evaluateAll((bs) => bs.map((b) => ({ label: b.innerText, disabled: b.disabled || b.getAttribute('aria-disabled') === 'true' })));
    expect(items.length).toBeGreaterThan(0);
    for (const it of items.filter((x) => x.disabled)) expect(it.label, `raison absente : ${it.label}`).toMatch(/\n|·|—|:/);
    expect(text).toMatch(/min/); // le temps que ça coûte
    expect(text).toMatch(/légal|gris|illégal/i);
  });
});

test.describe('§12c.2 · musique et réglages', () => {
  test('Musique / Ambiance / Effets : trois curseurs, réglages gardés après rechargement', async ({ page }) => {
    await newCampaign(page);
    await page.click('[data-testid=menu-open]');
    const sliders = page.locator('#ui-menu input[type=range]');
    const labels = await page.locator('#ui-menu').innerText();
    test.skip(!/Musique/i.test(labels) || !/Ambiance/i.test(labels) || !/Effets/i.test(labels) || (await sliders.count()) < 3,
      'curseurs Musique / Ambiance / Effets pas encore sur main');
    const set = await sliders.evaluateAll((els) => els.slice(0, 3).map((el, i) => {
      const v = String(Math.round(Number(el.min || 0) + (Number(el.max || 100) - Number(el.min || 0)) * [0.2, 0.5, 0.8][i]));
      el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
      return v;
    }));
    await page.goto('/?nolock=1&seed=3');
    await page.click('#campaign');
    await page.click('[data-testid=title-continue]');
    await page.click('[data-testid=menu-open]');
    const after = await page.locator('#ui-menu input[type=range]').evaluateAll((els) => els.slice(0, 3).map((el) => el.value));
    expect(after).toEqual(set);
  });
});
