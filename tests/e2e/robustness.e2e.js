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

test('s’assoupir sur le canapé (world.sofa) : invite et sommeil « canapé »', async ({ page }) => {
  await page.goto('/?nolock=1&seed=2');
  await page.click('#start');
  const r = await page.evaluate(() => {
    const { world, player, step, sim } = window.__rdb;
    if (!world.sofa?.position) return { skip: true };
    player.loc = 'apt';
    player.pos.set(world.sofa.position.x, world.apt.floor, world.sofa.position.z - 1.2);
    step(5);
    const prompt = document.getElementById('prompt').textContent;
    window.__rdb.key('KeyE');
    step(1);
    return { prompt, spot: sim.state.sleepSpot, sleeping: sim.state.sleeping };
  });
  if (r.skip) return;
  expect(r.prompt).toContain('canapé');
  expect(r).toMatchObject({ spot: 'sofa', sleeping: true });
});

test('menu de nuit (N, §12c.4) : « Ici, maintenant », « Ailleurs ce soir » replié, une raison par action indisponible', async ({ page }) => {
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
    c.state.unlocked = c.content.UNLOCKS.map((u) => u.id); // tous les outils acquis
    c.state.tutorials.done = c.content.TOOL_TUTORIALS?.map((t) => t.id) ?? []; // pas de marque par-dessus le menu
    localStorage.setItem(window.__rdb.saveKey, JSON.stringify(c.save()));
  });
  await page.goto('/?nolock=1&mode=night&seed=12');
  await page.locator('#hud').waitFor({ state: 'visible' });
  await page.evaluate(() => { window.__rdb.step(2); window.__rdb.key('KeyN'); window.__rdb.step(1); });
  const menu = page.locator('#nightmenu');
  await expect(menu).toBeVisible();
  await expect(menu.locator('[data-group=here] h3')).toContainText('Ici, maintenant');
  const toggle = menu.locator('.nm-toggle');
  await expect(toggle).toContainText('Ailleurs ce soir');
  const away = menu.locator('[data-group=elsewhere]');
  if ((await menu.locator('[data-group=here] .nm-row').count()) > 0) {
    await expect(away).toBeHidden(); // replié tant qu'il y a quelque chose à faire ici
    await toggle.click();
  }
  await expect(away).toBeVisible();
  await page.screenshot({ path: 'test-results/night-menu.png' });
  const rows = await away.locator('.nm-row').evaluateAll((bs) => bs.map((b) => ({
    disabled: b.getAttribute('aria-disabled'), reason: b.querySelector('.nm-reason')?.textContent ?? '', text: b.innerText,
  })));
  expect(rows.length).toBeGreaterThan(0);
  for (const r of rows) {
    expect(r.disabled).toBe('true');
    expect(r.reason, r.text).toMatch(/📍 \S.{4,}/);
    expect(r.text).toMatch(/\d+ min/);
    expect(r.text).toMatch(/légal|limite|illégal/);
    expect(r.text).toMatch(/👁 (sans risque|risque (faible|moyen|élevé))/);
  }
  // Clavier : les flèches déplacent le focus d'une ligne à l'autre
  const f0 = await page.evaluate(() => document.activeElement?.className);
  await page.evaluate(() => { window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowDown', bubbles: true })); });
  const f1 = await page.evaluate(() => ({ cls: document.activeElement?.className, inMenu: document.getElementById('nightmenu').contains(document.activeElement) }));
  expect(f1.inMenu).toBe(true);
  expect(f0).toBeTruthy();
});

test('horloge adaptative (§12c.5) : ⏩ après 22h30 quand rien ne se passe, retour à ×1 quand la police arrive, V accélère', async ({ page }) => {
  await page.goto('/?nolock=1&seed=4');
  await page.click('#start');
  const r = await page.evaluate(() => {
    const { sim, step, key } = window.__rdb;
    const early = (step(60), window.__rdb.clock);
    key('KeyV'); step(90);
    const manual = window.__rdb.clock;
    key('KeyV');
    while (sim.state.min < 23 * 60 + 10) sim.tick(1);
    sim.state.journal = [];
    step(120);
    const late = { ...window.__rdb.clock, shown: !document.getElementById('fast').classList.contains('hidden'), text: document.getElementById('fast').textContent };
    const t0 = sim.state.min; step(30); const fastMinutes = sim.state.min - t0;
    sim.act({ type: 'police' });
    step(120);
    const police = window.__rdb.clock;
    return { early, manual, late, fastMinutes, police };
  });
  expect(r.early).toMatchObject({ fast: false, reason: 'normal' });
  expect(r.early.scale).toBeCloseTo(1, 2);
  expect(r.manual).toMatchObject({ fast: true, manual: true, reason: 'manual' });
  expect(r.late.reason).toBe('late');
  expect(r.late.scale).toBeGreaterThan(2.5);
  expect(r.late.shown).toBe(true);
  expect(r.late.text).toMatch(/⏩ ×3/);
  expect(r.fastMinutes).toBeGreaterThan(1.3); // 1 s réelle ≈ 1,5 min de jeu à ×3 (0,5 à ×1)
  expect(r.police.reason).toBe('busy:police');
  expect(r.police.scale).toBeLessThan(1.2);
});

test('dormir (§12c.5) : voile « Pilou dort… », ×40, puis « Passer à demain matin » joue la fin de la nuit minute par minute', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/?nolock=1&seed=2');
  await page.click('#start');
  const r = await page.evaluate(() => {
    const { world, player, step, sim, key } = window.__rdb;
    player.loc = 'apt';
    player.pos.set(world.bed.x, world.apt.floor, world.bed.z + 0.6);
    step(3);
    key('KeyE');
    step(90); // 3 s réelles
    const veil = !document.getElementById('sleepveil').classList.contains('hidden');
    const scale = window.__rdb.clock.scale;
    const status = document.getElementById('sleep-status').textContent;
    return { veil, scale, status };
  });
  await page.screenshot({ path: 'test-results/sleep-veil.png' });
  Object.assign(r, await page.evaluate(() => {
    const { sim, step } = window.__rdb;
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', bubbles: true }));
    for (let i = 0; i < 40 && !sim.state.ended; i++) step(1);
    return { end: sim.state.min, ended: sim.state.ended, endShown: !document.getElementById('end').classList.contains('hidden') };
  }));
  expect(r.veil).toBe(true);
  expect(r.status).toMatch(/Pilou dort/);
  expect(r.scale).toBeGreaterThan(30); // vers ×40
  expect(r.ended).toBe(true);
  expect(r.end).toBeGreaterThanOrEqual(25 * 60 + 30);
  expect(r.endShown).toBe(true);
});

test('objectifs du soir (§12c.5) : « Ce soir » sous le twist à l’entrée, liste du HUD qui se coche', async ({ page }) => {
  test.setTimeout(240_000);
  await page.goto('/?nolock=1&seed=12');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.click('#campaign');
  await page.click('[data-testid=title-new]');
  if (await page.locator('[data-testid=intro-skip]').count()) await page.click('[data-testid=intro-skip]');
  const picked = await page.evaluate(() => {
    const c = window.__rdb.ui.campaign;
    for (let i = 0; i < 200 && c.step !== 'night'; i++) {
      if (c.step === 'cards') c.resolveCard(c.card().choices.find((x) => x.available)?.i ?? 0);
      else if (c.step === 'koddex') c.koddex(['work', 'work', 'work']);
      else if (c.step === 'actions') c.endAfternoon();
    }
    c.state.tutorials.done = c.content.TOOL_TUTORIALS?.map((t) => t.id) ?? [];
    const list = c.tonightObjectives();
    localStorage.setItem(window.__rdb.saveKey, JSON.stringify(c.save()));
    return list;
  });
  expect(picked.length).toBeGreaterThanOrEqual(2);
  await page.goto('/?nolock=1&mode=night&seed=12');
  await page.locator('#hud').waitFor({ state: 'visible' });
  await expect(page.locator('#pause-keys .tonight')).toContainText(picked[0].text.slice(0, 30));
  await page.evaluate(() => window.__rdb.step(4)); // ?nolock : pas d'overlay de pause à cliquer
  const items = page.locator('#objectives li');
  await expect(items).toHaveCount(picked.length);
  await page.screenshot({ path: 'test-results/objectives-hud.png' });
  // Un objectif cochable, coché par l'événement du jeu qui le termine
  const todo = await page.evaluate(() => {
    const c = window.__rdb.campaign;
    const o = c.tonightObjectives().find((x) => !x.info && !x.done);
    const d = o && c.content.OBJECTIVES.find((x) => x.id === o.id).done;
    if (!d?.event) return null;
    c.objectiveEvent(d.event, { db: 120, overLimit: true, late: true, corridor: true, table: d.table, patrol: d.patrol, asso: d.asso });
    window.__rdb.step(4);
    return o.id;
  });
  if (todo) await expect(page.locator(`#objectives li[data-id="${todo}"]`)).toHaveClass(/done/);
});

test('« Qui regarde ? » et « Fenêtre propice » (§12d) : en direct dans la rue, les regards détournés passent « ailleurs », l’horloge ralentit', async ({ page }) => {
  await page.goto('/?nolock=1&seed=3');
  await page.click('#start');
  const r = await page.evaluate(() => {
    const { sim, player, step } = window.__rdb;
    while (sim.state.min < 22 * 60 + 40) sim.tick(1);
    sim.state.journal = [];
    player.loc = 'street';
    player.pos.set(-1.5, 0, -22);
    step(4);
    const before = document.getElementById('witness').textContent;
    const shownBefore = !document.getElementById('window').classList.contains('hidden');
    sim.state.attention = [{ source: 'window', id: 'test', turns: ['customers', 'waiter', 'klaas'], from: sim.state.min, until: sim.state.min + 2, text: null }];
    step(4);
    return {
      before, shownBefore,
      during: document.getElementById('witness').textContent,
      window: document.getElementById('window').textContent,
      clock: window.__rdb.clock.reason,
    };
  });
  expect(r.before).toMatch(/Qui regarde/);
  expect(r.before).toMatch(/clients/);
  expect(r.shownBefore).toBe(false);
  expect(r.during).toMatch(/ailleurs :.*clients/);
  expect(r.window).toMatch(/Fenêtre propice · ⏳ \d:\d\d/);
  expect(r.clock).toBe('window'); // §12e.1 : ×0.5 pendant la fenêtre
  await page.screenshot({ path: 'test-results/who-watches.png' });
});

test('parler aux gens (§12e.3) : « Parler à Jérémie » près de lui, E ouvre le dialogue, un choix pose ses drapeaux', async ({ page }) => {
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
    c.apply({ clearFlags: ['met_jeremie', 'joined_rounds'] }, 'engine', 'test');
    c.state.tutorials.done = c.content.TOOL_TUTORIALS?.map((t) => t.id) ?? [];
    localStorage.setItem(window.__rdb.saveKey, JSON.stringify(c.save()));
  });
  await page.goto('/?nolock=1&mode=night&seed=12');
  await page.locator('#hud').waitFor({ state: 'visible' });
  const prompt = await page.evaluate(() => {
    const { sim, player, step } = window.__rdb;
    while (sim.state.min < 22 * 60) sim.tick(1);
    const d = sim.dogPos();
    player.loc = 'street';
    player.pos.set(d.x + 0.8, 0, d.z);
    step(4);
    return document.getElementById('prompt').textContent;
  });
  expect(prompt).toMatch(/Parler à Jérémie/);
  await page.evaluate(() => { window.__rdb.key('KeyE'); window.__rdb.step(1); });
  const box = page.locator('[data-testid=talk]'); // boîte de l'agent UI (src/ui/talk.js), chargée à la première conversation
  await expect(box).toBeVisible({ timeout: 30_000 });
  await expect(box).toContainText('Jérémie');
  const t0 = await page.evaluate(() => { window.__rdb.step(30); return window.__rdb.sim.state.min; });
  expect(await page.evaluate(() => { window.__rdb.step(30); return window.__rdb.sim.state.min; })).toBe(t0); // la nuit attend
  const choices = box.locator('[data-testid=talk-choice]');
  expect(await choices.count()).toBeGreaterThanOrEqual(2);
  await choices.first().click();
  await expect(box.locator('.ui-talk-reply')).toBeVisible();
  expect(await page.evaluate(() => window.__rdb.campaign.has('met_jeremie'))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(box).toHaveCount(0);
  expect(await page.evaluate(() => { const a = window.__rdb.sim.state.min; window.__rdb.step(30); return window.__rdb.sim.state.min > a; })).toBe(true);
});
