import { test, expect } from '@playwright/test';
import { watchErrors } from './helpers.js';

// Playtest 1 de Lucas (GAME_DESIGN §12c, §13.K) : son, musique, pastilles, menu de nuit.
// Écrits avant les correctifs : chaque test détecte sa fonction et se désactive (test.skip, avec la raison) tant
// qu'elle n'est pas sur main. Contrats attendus (Build note « qa-playtest1 ») :
//   • audio.debug() (src/audio/index.js) : state, buses.<bus>.effective, street.hum.motor (la gaine) ;
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
  const dbg = (page) => page.evaluate(() => window.__rdb.world?.audio?.debug?.() ?? null);

  test('audio vivant au jour 5 et plus : contexte « running », bus maître audible, dans la nuit puis au retour dans la journée', async ({ page }) => {
    test.setTimeout(300_000);
    const errors = watchErrors(page);
    await newCampaign(page);
    expect((await playUntil(page, (c) => c.step === 'night' && c.state.day >= 5)).day).toBeGreaterThanOrEqual(5);
    await enterNight(page);
    const d = await dbg(page);
    expect(d, 'audio.debug() disponible').not.toBeNull();
    expect(d.state, 'la nuit 5 a un graphe audio actif').toBe('running');
    // Bus music / ambience / sfx (src/audio/mix.js) : l'ambiance de la rue est audible
    expect(d.mix.muted, 'son coupé').toBe(false);
    expect(d.buses.ambience.effective, `bus ambiance : ${JSON.stringify(d.buses)}`).toBeGreaterThan(0);
    expect(d.street.attached, 'la rue est branchée sur l’audio').toBe(true);
    await page.evaluate(() => { const r = window.__rdb; for (let i = 0; !r.sim.state.ended && i < 6000; i++) { r.sim.tick(0.5); if (i % 60 === 0) r.step(1); } r.step(2); });
    await expect(page.locator('[data-testid=recap]')).toBeVisible({ timeout: 60_000 });
    await page.mouse.click(10, 10);
    const day = await dbg(page);
    expect(day.state, 'audio vivant dans la journée après la nuit 5').toBe('running');
    expect(errors).toEqual([]);
  });

  test('la gaine ne s’entend que chez Pilou : moteur ≈ 0 dans la rue loin du conduit, nettement plus à la fenêtre', async ({ page }) => {
    test.setTimeout(300_000);
    await newCampaign(page);
    await playUntil(page, (c) => c.step === 'night');
    await enterNight(page);
    const at = async (where) => {
      await page.evaluate((w) => {
        const r = window.__rdb, { sim, player, world } = r;
        const W = sim.cfg.STREET.halfWidth, win = sim.cfg.ANCHORS.pilouWindow;
        if (w === 'street') { player.loc = 'street'; player.pos.set(0, 0, win.z + 40); player.yaw = 0; }
        else { player.loc = 'apt'; player.pos.set(-W - 0.2, world.apt.floor, win.z); player.yaw = -Math.PI / 2; }
        r.step(10);
      }, where);
      await page.waitForTimeout(1500); // les gains audio glissent en temps réel (setTargetAtTime)
      await page.evaluate(() => window.__rdb.step(10));
      await page.waitForTimeout(800);
      return (await dbg(page)).street.hum;
    };
    const street = await at('street');
    const win = await at('window');
    expect(street.motor, `moteur de la gaine dans la rue, à 40 m du conduit : ${JSON.stringify(street)}`).toBeLessThan(0.02);
    expect(win.motor, `moteur de la gaine à la fenêtre : ${JSON.stringify(win)}`).toBeGreaterThan(0.01);
    expect(win.motor).toBeGreaterThan(street.motor * 5);
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
  test('« Ici, maintenant » en tête ; « Ailleurs ce soir » dit pourquoi (📍 où aller / ce qu’il faut) ; le temps se lit', async ({ page }) => {
    test.setTimeout(300_000);
    await newCampaign(page);
    await playUntil(page, (c) => c.step === 'night' && c.state.day >= 2);
    await enterNight(page);
    await page.evaluate(() => { window.__rdb.key('KeyN'); window.__rdb.step(1); });
    const menu = page.locator('#nightmenu');
    await expect(menu).toBeVisible();
    await expect(menu.locator('h3').first()).toContainText('Ici, maintenant');
    const toggle = menu.locator('.nm-toggle');
    if (await toggle.count()) {
      await expect(toggle).toContainText('Ailleurs ce soir');
      await toggle.click();
    }
    const items = await menu.locator('#nightmenu-list button:not(.nm-toggle)').evaluateAll((bs) => bs.map((b) => ({
      text: b.innerText, disabled: b.disabled || b.getAttribute('aria-disabled') === 'true' || b.classList.contains('off'), reason: b.querySelector('.nm-reason')?.innerText ?? null,
    })));
    expect(items.length, 'des actions listées').toBeGreaterThan(0);
    const away = items.filter((x) => x.reason);
    for (const it of away) expect(it.reason, it.text).toMatch(/📍\s*\S/);
    for (const it of items.filter((x) => x.disabled)) expect(it.reason, `action grisée sans raison : ${it.text}`).toBeTruthy();
    expect(items.some((x) => /min/.test(x.text)), 'le coût en temps se lit').toBe(true);
  });
});

test.describe('§12c.5 · rythme de la nuit', () => {
  test('objectifs du soir : 2 à 4 affichés, et ils se cochent quand on les fait', async ({ page }) => {
    test.setTimeout(300_000);
    await newCampaign(page);
    await playUntil(page, (c) => c.step === 'night');
    await enterNight(page);
    const box = page.locator('#objectives');
    await expect(box).toBeVisible();
    const n = await box.locator('li:not(.info)').count();
    expect(n, 'objectifs du soir').toBeGreaterThanOrEqual(2);
    expect(await box.locator('li').count()).toBeLessThanOrEqual(5); // 4 objectifs + le conseil « au lit »
    // On joue la soirée comme un joueur appliqué : relevé, photos, police, serveur
    await page.evaluate(() => {
      const r = window.__rdb, { sim } = r;
      for (let i = 0; sim.state.min < 22 * 60 + 10 && i < 4000; i++) { sim.tick(0.5); if (i % 30 === 0) r.step(1); }
      for (const t of sim.state.tables.filter((x) => x.out).slice(0, 4)) { r.aimAt(t.id); r.step(1); r.key('KeyP'); r.step(1); }
      r.key('KeyB'); r.step(1);
      sim.act({ type: 'police' }); sim.act({ type: 'waiter' });
      for (let i = 0; sim.state.min < 23 * 60 && i < 4000; i++) { sim.tick(0.5); if (i % 20 === 0) r.step(1); }
      r.step(4);
    });
    const done = await box.locator('li.done').count();
    const logged = await page.locator('#log').innerText();
    expect(done + (/✓ Objectif/.test(logged) ? 1 : 0), `aucun objectif coché : ${await box.innerText()}`).toBeGreaterThan(0);
  });

  test('après 22h30, si rien ne se passe, l’horloge file à ×3 avec ⏩ (et plus vite qu’à 21h)', async ({ page }) => {
    test.setTimeout(300_000);
    await newCampaign(page);
    await playUntil(page, (c) => c.step === 'night');
    await enterNight(page);
    // Déterministe : l'échelle cible de nightClock() (window.__rdb.clock), pas une vitesse mesurée
    const at = (until) => page.evaluate((u) => {
      const r = window.__rdb, { sim } = r;
      for (let i = 0; sim.state.min < u && i < 4000; i++) { sim.tick(0.5); if (i % 60 === 0) r.step(1); }
      r.step(4);
      const fast = document.getElementById('fast'), k = r.clock;
      return { scale: k.scale, reason: k.reason ?? null, fastShown: !fast.classList.contains('hidden'), fastText: fast.textContent };
    }, until);
    const early = await at(21 * 60);
    const late = await at(22 * 60 + 40);
    expect(early.scale, `21h : ${JSON.stringify(early)}`).toBeLessThan(1.2);
    test.skip(late.scale < 1.2 && /busy/.test(late.reason ?? ''), `ce soir-là, quelque chose garde l’horloge à ×1 à 22h40 (${late.reason})`);
    expect(late.scale, `22h40 : ${JSON.stringify(late)}`).toBeGreaterThan(2.5);
    await page.evaluate(() => window.__rdb.step(60)); // l'indicateur suit la vitesse amortie
    await expect(page.locator('#fast')).toBeVisible();
    await expect(page.locator('#fast')).toContainText(/⏩ ×[23]/);
  });

  test('au lit : ×40, voile « Pilou dort… », puis « Passer à demain matin » mène au bilan', async ({ page }) => {
    test.setTimeout(300_000);
    await newCampaign(page);
    await playUntil(page, (c) => c.step === 'night');
    await enterNight(page);
    const r1 = await page.evaluate(() => {
      const r = window.__rdb, { sim, player, world } = r;
      for (let i = 0; sim.state.min < 22 * 60 + 15 && i < 4000; i++) { sim.tick(0.5); if (i % 60 === 0) r.step(1); }
      player.loc = 'apt'; player.pos.set(world.bed.x + 0.3, world.apt.floor, world.bed.z); r.step(2);
      r.key('KeyE'); r.step(1);
      r.step(4);
      return { sleeping: sim.state.sleeping, scale: r.clock.scale, mult: sim.cfg.RULES.sleepTimeMultiplier };
    });
    expect(r1.sleeping, 'Pilou est couché').toBe(true);
    expect(r1.mult).toBe(40);
    expect(r1.scale, `échelle de l'horloge au lit (nightClock) : ${JSON.stringify(r1)}`).toBeGreaterThan(30); // ×40, déterministe
    await expect(page.locator('#sleepveil')).toBeVisible();
    await expect(page.locator('[data-testid=sleep-skip]')).toContainText('Passer à demain matin');
    await page.keyboard.press('Enter');
    // La même nuit, minute par minute ; les événements de nuit éventuels s'arrêtent sur leur carte
    for (let k = 0; k < 40; k++) {
      if (await page.locator('[data-testid=recap]').isVisible()) break;
      if (await page.locator('#nightmenu').isVisible()) await page.locator('#nightmenu-list button:not([disabled])').first().click();
      await page.evaluate(() => window.__rdb.step(20));
    }
    await expect(page.locator('[data-testid=recap]')).toBeVisible({ timeout: 60_000 });
  });

  test('conseil « au lit » après 22h30 quand Pilou est épuisé, avec la touche et la direction du lit', async ({ page }) => {
    test.setTimeout(300_000);
    await newCampaign(page);
    await playUntil(page, (c) => c.step === 'night');
    await enterNight(page);
    await page.evaluate(() => {
      const r = window.__rdb, { sim } = r;
      for (let i = 0; sim.state.min < 22 * 60 + 35 && i < 4000; i++) { sim.tick(0.5); if (i % 60 === 0) r.step(1); }
      sim.state.sleep = 15; // épuisé (seuil RULES.bedtime.tiredSleep)
      r.step(6);
    });
    const box = page.locator('#objectives');
    await expect(box).toBeVisible();
    await expect(box).toContainText('🛏');
    await expect(box).toContainText(/\[E\]|montez chez vous/);
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
