import { test, expect } from '@playwright/test';
import { watchErrors } from './helpers.js';

// v1.1 « no two nights alike » (GAME_DESIGN §12b, §13.J, contrat §14 + build note ui-v1.1).
// Écrits AVANT que les fonctions arrivent : chaque test détecte la sienne et se désactive (test.skip, avec la raison)
// tant qu'elle n'est pas sur main. Quand une fonction atterrit, le test tourne tout seul.
//   • twist de la nuit : c.tonightTwist() → { id, title, intro } à l'étape 'night', montré sur la carte de nuit ;
//   • cartes « Nouveau » : { type: 'unlock', id, data: { title, text, hint } } dans la file de cartes ;
//   • matin Koddex en 3D : le terminal posé sur l'écran du bureau (CSS matrix3d) ;
//   • jours au bureau / en télétravail : c.workplace() ou c.state.workplace ('office' | 'home'), visible dans l'en-tête.

async function newCampaign(page, seed = 5) {
  await page.goto(`/?nolock=1&seed=${seed}`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.click('#campaign');
  await page.click('[data-testid=title-new]');
  if (await page.locator('[data-testid=intro-skip]').count()) await page.click('[data-testid=intro-skip]');
  await expect(page.locator('[data-testid=day-header]')).toHaveAttribute('data-day', '1');
}

// Joue la campagne par l'API jusqu'à `stop(c)` (nuits simulées sans 3D), en notant ce que chaque jour montre.
// Retourne le journal (par jour : twist, cartes « Nouveau », lieu de travail) et redessine l'interface.
const playUntil = (page, stopSrc, { maxDay = 14 } = {}) => page.evaluate(({ stopSrc, maxDay }) => {
  const { ui } = window.__rdb, c = ui.campaign;
  const stop = new Function('c', `return (${stopSrc})(c);`);
  const days = {};
  const at = (d) => (days[d] ??= { night: false, twist: null, unlocks: [], workplace: null });
  const workplace = () => c.workplace?.() ?? c.state.workplace ?? null;
  for (let i = 0; i < 4000 && !c.ended && c.state.day <= maxDay; i++) {
    if (stop(c)) break;
    if (c.step === 'cards') {
      const k = c.card();
      if (k.type === 'unlock' || k.unlock) at(c.state.day).unlocks.push(k.unlock ?? k.id);
      c.resolveCard(k.choices.find((x) => x.available)?.i ?? 0);
    } else if (c.step === 'koddex') { at(c.state.day).workplace = workplace(); c.koddex(['work', 'work', 'work']); }
    else if (c.step === 'actions') c.endAfternoon();
    else if (c.step === 'night') {
      at(c.state.day).night = true;
      at(c.state.day).twist = (c.twistTonight ?? c.tonightTwist)?.()?.id ?? null;
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
  return { days, step: c.step, day: c.state.day, ended: c.ended };
}, { stopSrc: stopSrc.toString(), maxDay });

test.describe('v1.1 · twists de nuit', () => {
  test('la carte de nuit annonce le twist du soir (titre + intro) avant « Descendre dans la rue »', async ({ page }) => {
    const errors = watchErrors(page);
    await newCampaign(page);
    test.skip(!(await page.evaluate(() => { const c = window.__rdb.ui.campaign; return typeof (c.twistTonight ?? c.tonightTwist) === 'function'; })), 'twists pas encore sur main');
    expect((await playUntil(page, (c) => c.step === 'night')).step).toBe('night');
    const tw = await page.evaluate(() => { const c = window.__rdb.ui.campaign; return (c.twistTonight ?? c.tonightTwist)(); });
    expect(tw, 'chaque nuit a son twist (§13.J)').not.toBeNull();
    const card = page.locator('[data-testid=night]');
    await expect(card).toBeVisible();
    await expect(card).toContainText(tw.title);
    await expect(card).toContainText(tw.intro.slice(0, 40));
    expect(tw.intro.length, 'intro ≤ 300 caractères (§14)').toBeLessThanOrEqual(300);
    await expect(page.locator('[data-testid=night-go]')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('14 nuits : un twist chaque nuit, jamais deux fois le même dans une campagne', async ({ page }) => {
    test.setTimeout(240_000);
    await newCampaign(page, 3); // la graine 3 va jusqu'au J14 en jeu passif (101 déménage au J11 depuis l'équilibrage v1.1)
    test.skip(!(await page.evaluate(() => { const c = window.__rdb.ui.campaign; return typeof (c.twistTonight ?? c.tonightTwist) === 'function'; })), 'twists pas encore sur main');
    const r = await playUntil(page, () => false);
    const ids = Object.values(r.days).filter((d) => d.night).map((d) => d.twist);
    expect(ids.length, 'des nuits jouées').toBeGreaterThanOrEqual(13);
    expect(ids.filter((x) => x === null).length, `nuits sans twist : ${JSON.stringify(r.days)}`).toBe(0);
    expect(new Set(ids).size, `twists répétés : ${ids.join(', ')}`).toBe(ids.length);
  });
});

test.describe('v1.1 · outils débloqués au fil des jours', () => {
  test('une carte « Nouveau » s’affiche (titre, texte, touche), et s’acquitte d’un clic', async ({ page }) => {
    const errors = watchErrors(page);
    await newCampaign(page);
    const r = await playUntil(page, (c) => c.step === 'cards' && (c.card()?.type === 'unlock' || !!c.card()?.unlock), { maxDay: 4 });
    const card = await page.evaluate(() => { const c = window.__rdb.ui.campaign; const k = c.step === 'cards' ? c.card() : null; return k && (k.type === 'unlock' || k.unlock) ? { id: k.id, data: k.data && typeof k.data === 'object' && k.data.title ? k.data : { title: k.title, text: k.text, hint: k.hint } } : null; });
    test.skip(!card, `cartes « Nouveau » pas encore dans la file (aucune sur les jours 1–4 ; étape ${r.step}, jour ${r.day})`);
    const el = page.locator('[data-testid=card][data-type=unlock]');
    await expect(el).toBeVisible();
    await expect(el).toContainText(/Nouveau/i);
    await expect(el).toContainText(card.data.title.replace(/^Nouveau\s*:\s*/i, '').slice(0, 30));
    await expect(el).toContainText(card.data.text.slice(0, 30));
    await page.locator('[data-testid=card-choice]').first().click();
    if (await page.locator('[data-testid=result-next]').count()) await page.click('[data-testid=result-next]');
    expect(await page.evaluate((id) => { const c = window.__rdb.ui.campaign; return c.step === 'cards' && c.card()?.id === id; }, card.id), 'la carte est acquittée').toBe(false);
    expect(errors).toEqual([]);
  });

  test('au moins un nouvel outil toutes les deux nuits jusqu’au J10 (§12b.B)', async ({ page }) => {
    test.setTimeout(240_000);
    await newCampaign(page, 101);
    const r = await playUntil(page, () => false, { maxDay: 10 });
    const total = Object.values(r.days).reduce((s, d) => s + d.unlocks.length, 0);
    test.skip(!total, 'cartes « Nouveau » pas encore dans la file');
    for (let d = 1; d <= Math.min(9, r.day - 1); d++) {
      const n = (r.days[d]?.unlocks.length ?? 0) + (r.days[d + 1]?.unlocks.length ?? 0);
      expect(n, `aucun outil débloqué les jours ${d}–${d + 1} : ${JSON.stringify(Object.fromEntries(Object.entries(r.days).map(([k, v]) => [k, v.unlocks])))}`).toBeGreaterThan(0);
    }
  });
});

test.describe('v1.1 · le jour en 3D', () => {
  test('matin Koddex : le terminal est posé sur l’écran du bureau (3D) et reste lisible', async ({ page }) => {
    await newCampaign(page);
    await playUntil(page, (c) => c.step === 'koddex');
    await expect(page.locator('[data-testid=terminal]')).toBeVisible();
    const t = await page.evaluate(() => {
      const el = document.querySelector('[data-testid=terminal]');
      let n = el, m = '';
      for (; n && n !== document.body; n = n.parentElement) { const tr = getComputedStyle(n).transform; if (tr && tr.startsWith('matrix3d')) { m = tr; break; } }
      const box = el.getBoundingClientRect();
      return { matrix3d: !!m, w: box.width, h: box.height, fontPx: parseFloat(getComputedStyle(el).fontSize) };
    });
    test.skip(!t.matrix3d, 'matin 3D pas encore sur main : le terminal n’est pas projeté sur l’écran du bureau (pas de matrix3d)');
    expect(t.w, 'terminal assez large pour être lu').toBeGreaterThan(320);
    expect(t.h).toBeGreaterThan(180);
    expect(t.fontPx).toBeGreaterThanOrEqual(11);
    await page.screenshot({ path: 'test-results/v11-koddex-3d.png', timeout: 90_000 });
  });

  test('bureau ou télétravail : l’en-tête du matin le dit, les deux arrivent, jamais à la maison le J14', async ({ page }) => {
    test.setTimeout(240_000);
    await newCampaign(page, 101);
    const has = await page.evaluate(() => { const c = window.__rdb.ui.campaign; return typeof c.workplace === 'function' || c.state.workplace !== undefined; });
    test.skip(!has, 'jours bureau / télétravail pas encore sur main (ni c.workplace() ni state.workplace)');
    // L'en-tête du jour 1 (matin) affiche le lieu
    await playUntil(page, (c) => c.step === 'koddex');
    const wp = await page.evaluate(() => { const c = window.__rdb.ui.campaign; return c.workplace?.() ?? c.state.workplace; });
    expect(['office', 'home']).toContain(wp);
    await expect(page.locator('[data-testid=day-header]')).toContainText(wp === 'home' ? /télétravail|maison/i : /bureau|Koddex/i);
    const r = await playUntil(page, () => false);
    const places = Object.entries(r.days).map(([d, v]) => [Number(d), v.workplace]).filter(([, w]) => w);
    expect(new Set(places.map(([, w]) => w)).size, `les deux lieux sur la campagne : ${JSON.stringify(places)}`).toBe(2);
    expect(places.find(([d]) => d === 14)?.[1] ?? 'office').not.toBe('home');
  });
});

// BUG-010 (qa/bugs.md) : les tables ajoutées par un twist (id « bernadette-x1 ») n'ont pas de vue 3D sous leur id
// (world.js dérive l'index de l'id → « bernadette-NaN ») ; une photo (P) cette nuit-là plante le jeu. Le J4 en a une.
test('BUG-010 · nuit à twist (J4) : photographier les tables ne plante pas le jeu', async ({ page }) => {
  test.setTimeout(240_000);
  const errors = watchErrors(page);
  await newCampaign(page, 3);
  expect((await playUntil(page, (c) => c.step === 'night' && c.state.day === 4)).day).toBe(4);
  await Promise.all([page.waitForURL(/mode=night/), page.click('[data-testid=night-go]')]);
  await page.locator('#hud:visible, #start:visible').first().waitFor({ timeout: 60_000 });
  if (await page.locator('#start').isVisible()) await page.click('#start');
  // Jusqu'à 22h10, en jouant au clic les événements de nuit (le dîner de Martine met le jeu en pause sur sa carte)
  for (let k = 0; k < 10; k++) {
    const due = await page.evaluate(() => {
      const r = window.__rdb, { sim } = r, c = r.campaign;
      for (let i = 0; sim.state.min < 22 * 60 + 10 && i < 4000; i++) {
        if (c.nightEventDue?.(sim)) { r.step(1); return true; }
        sim.tick(0.5); if (i % 60 === 0) r.step(1);
      }
      r.step(1);
      return false;
    });
    if (!due) break;
    await page.locator('#nightmenu-list button:not([disabled])').first().click();
  }
  const twistTables = await page.evaluate(() => {
    const r = window.__rdb, { sim } = r;
    const ids = sim.state.tables.filter((t) => t.twist && t.out).map((t) => t.id);
    for (const t of sim.state.tables.filter((x) => x.out)) { r.aimAt(t.id); r.step(1); r.key('KeyP'); r.step(1); }
    return ids;
  });
  expect(twistTables.length, 'le twist du J4 ajoute une table').toBeGreaterThan(0);
  await expect(page.locator('#fatal')).toBeHidden();
  expect(errors).toEqual([]);
});
