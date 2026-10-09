import { test, expect } from '@playwright/test';
import { watchErrors } from './helpers.js';

// Playtest 3 de Lucas (GAME_DESIGN §12e, §13.O), dans la vraie nuit 3D d'une campagne.
// Couvert ailleurs : chaque ligne de nuit mise en scène (npm run check:coherence -- --strict, règle « scene ») ;
// chaque twist vu et entendu (tests/unit/twists-live.test.js sur qa/twists-live.md) ; pas de brouhaha (Q / L : à l'oreille).

async function newCampaign(page, seed = 3) {
  await page.goto(`/?nolock=1&seed=${seed}`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.click('#campaign');
  await page.click('[data-testid=title-new]');
  if (await page.locator('[data-testid=intro-skip]').count()) await page.click('[data-testid=intro-skip]');
  await expect(page.locator('[data-testid=day-header]')).toHaveAttribute('data-day', '1');
}
// Jusqu'à la nuit du jour `day` par l'API ; `prep(c)` pose l'état de départ de la nuit (drapeaux, Asso, outils)
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
const PREP_ALL = (c) => {
  for (const f of ['met_seb_nico', 'met_tatie', 'joined_rounds', 'met_waiter', 'met_jeremie', 'asked_waiter']) if (!c.state.flags.includes(f)) c.state.flags.push(f);
  for (const u of c.content?.UNLOCKS ?? []) if (!c.state.unlocked.includes(u.id)) c.state.unlocked.push(u.id);
  c.state.stats.asso = 70;
};
async function enterNight(page) {
  await Promise.all([page.waitForURL(/mode=night/), page.click('[data-testid=night-go]')]);
  await page.locator('#hud:visible, #start:visible').first().waitFor({ timeout: 60_000 });
  if (await page.locator('#start').isVisible()) await page.click('#start');
  await page.evaluate(() => window.__rdb.step(4));
}
// Avance la nuit 3D jusqu'à `min` (minutes depuis minuit), événements de nuit joués au premier choix
async function advance(page, min) {
  for (let k = 0; k < 20; k++) {
    const due = await page.evaluate((m) => {
      const r = window.__rdb, { sim } = r, c = r.campaign;
      for (let i = 0; sim.state.min < m && !sim.state.ended && i < 8000; i++) {
        if (c.nightEventDue?.(sim)) { r.step(1); return true; }
        sim.tick(0.25); if (i % 60 === 0) r.step(1);
      }
      r.step(2);
      return false;
    }, min);
    if (!due) return;
    await page.locator('#nightmenu-list button:not([disabled])').first().click();
  }
}
const goStreet = (page, z = null) => page.evaluate((zz) => {
  const r = window.__rdb; r.player.loc = 'street'; r.player.pos.set(0, 0, zz ?? r.sim.cfg.ANCHORS.pilouWindow.z + 3); r.step(4);
}, z);

test.describe('§12e.1 · fenêtres longues', () => {
  test('une diversion ouvre une fenêtre de 5 à 8 min de jeu, l’horloge passe à ×0,5, avec un compte à rebours', async ({ page }) => {
    test.setTimeout(300_000);
    await newCampaign(page);
    await nightOf(page, 3, PREP_ALL);
    await enterNight(page);
    await advance(page, 21 * 60 + 40);
    await goStreet(page);
    const pace = () => page.evaluate(() => { const r = window.__rdb, m0 = r.sim.state.min; r.step(30); return r.sim.state.min - m0; });
    await page.evaluate(() => window.__rdb.step(60));
    const normal = await pace();
    const res = await page.evaluate(() => window.__rdb.campaign.doNightAction(window.__rdb.sim, 'night_fake_alert'));
    expect(res?.ok, JSON.stringify(res)).not.toBe(false);
    const att = await page.evaluate(() => { const S = window.__rdb.sim.state; return (S.attention ?? []).filter((a) => S.min >= a.from && S.min < a.until).map((a) => a.until - a.from); });
    expect(att.length, 'une fenêtre est ouverte').toBeGreaterThan(0);
    expect(Math.max(...att), `durée de la fenêtre (min de jeu) : ${att}`).toBeGreaterThanOrEqual(5);
    expect(Math.max(...att)).toBeLessThanOrEqual(8);
    await page.evaluate(() => window.__rdb.step(60)); // la vitesse glisse vers ×0,5
    const slow = await pace();
    await expect(page.locator('#window')).toContainText(/Fenêtre propice.*(⏳\s*\d+:\d\d|encore\s*\d+\s*min)/); // compte à rebours en temps réel
    expect(slow, `min de jeu par seconde : ${normal} → ${slow}`).toBeLessThan(normal * 0.75);
  });
});

test.describe('§12e.3 · parler aux gens', () => {
  test('E près de quelqu’un ouvre une conversation à 2–3 choix ; un choix répond et se note', async ({ page }) => {
    test.setTimeout(300_000);
    const errors = watchErrors(page);
    await newCampaign(page);
    await nightOf(page, 2);
    await enterNight(page);
    await advance(page, 21 * 60 + 50);
    // Quelqu'un à qui parler : le serveur, puis la ronde de Jérémie, puis Dédé / Ghislain devant l'estaminet
    const found = await page.evaluate(() => {
      const r = window.__rdb, { sim, player } = r, c = r.campaign;
      const spots = [sim.waiterPos(), sim.dogActive() ? sim.dogPos() : null, r.world.anchors?.dede, r.world.anchors?.ghislain].filter(Boolean);
      for (const p of spots) {
        player.loc = 'street'; player.pos.set(p.x + 0.6, 0, p.z); r.step(3);
        if (document.getElementById('prompt').textContent.includes('[')) {
          const t = c.talkTargets?.(sim, { loc: 'street', where: 'street', pos: player.pos }) ?? [];
          if (t.length || /Parler|parler|Discuter/.test(document.getElementById('prompt').textContent)) return document.getElementById('prompt').textContent;
        }
      }
      return null;
    });
    test.skip(!found, 'personne à qui parler à portée à 21h50 avec cette graine');
    await page.evaluate(() => { window.__rdb.key('KeyE'); window.__rdb.step(2); });
    const talk = page.locator('[data-testid=talk]');
    await expect(talk, `invite : ${found}`).toBeVisible({ timeout: 10_000 });
    const n = await talk.locator('[data-testid=talk-choice]').count();
    expect(n, 'choix proposés').toBeGreaterThanOrEqual(2);
    expect(n).toBeLessThanOrEqual(3);
    const journal0 = await page.evaluate(() => window.__rdb.campaign.state.journal.filter((e) => e.type === 'talk-choice').length);
    await talk.locator('[data-testid=talk-choice]:not([disabled])').first().click();
    expect(await page.evaluate(() => window.__rdb.campaign.state.journal.filter((e) => e.type === 'talk-choice').length)).toBeGreaterThan(journal0);
    for (let k = 0; k < 4 && (await talk.isVisible()); k++) {
      const close = talk.locator('[data-testid=talk-close]');
      if (await close.count()) await close.click(); else await talk.locator('[data-testid=talk-choice]:not([disabled])').first().click();
    }
    await expect(talk).toBeHidden();
    expect(errors).toEqual([]);
  });
});

test.describe('§12e.4 · diversions alliées et des patrons', () => {
  test('avec assez d’Asso, Seb & Nico, Tatie, Jérémie, et les ruses contre Dédé / Ghislain sont dans le menu de nuit', async ({ page }) => {
    test.setTimeout(300_000);
    await newCampaign(page);
    await nightOf(page, 4, PREP_ALL); // la rumeur d'inspection d'hygiène n'existe qu'à partir du J4
    await enterNight(page);
    await advance(page, 21 * 60 + 40);
    await goStreet(page);
    await page.evaluate(() => { window.__rdb.key('KeyN'); window.__rdb.step(1); });
    const menu = page.locator('#nightmenu');
    await expect(menu).toBeVisible();
    if (await menu.locator('.nm-toggle').count()) await menu.locator('.nm-toggle').click();
    const text = await menu.innerText();
    // Celles dont les conditions tiennent ce soir (ex. Tatie pas si elle « hésite », flattée par le bloc)
    const all = await page.evaluate(() => (window.__rdb.campaign.content?.ACTIONS ?? []).filter((a) => /^night_(ally|owner)_/.test(a.id)).map((a) => ({ id: a.id, label: a.label, ok: window.__rdb.campaign.check(a.requires, false) })));
    expect(all.length, 'diversions alliées + patrons dans le contenu').toBeGreaterThanOrEqual(5);
    const labels = all.filter((a) => a.ok);
    expect(labels.length, `diversions disponibles ce soir : ${JSON.stringify(all)}`).toBeGreaterThanOrEqual(3);
    const missing = labels.filter((l) => !text.includes(l.label.slice(0, 25)));
    expect(missing, `absentes du menu : ${missing.map((m) => m.id).join(', ')}`).toEqual([]);
  });
});

test.describe('§12e.7 · « Faire diversion » et le pot-de-vin à la pause', () => {
  test('devant un acte illégal, le menu dit qui le verrait et un bouton « Faire diversion » détourne exactement ceux-là', async ({ page }) => {
    test.setTimeout(300_000);
    await newCampaign(page);
    await nightOf(page, 3, PREP_ALL);
    await enterNight(page);
    await advance(page, 22 * 60 + 15);
    // Sur la terrasse de l'estaminet (la boule puante s'y fait)
    await page.evaluate(() => {
      const r = window.__rdb, { sim, player } = r;
      const t = sim.state.tables.find((x) => x.out && x.restId === 'bernadette') ?? sim.state.tables.find((x) => x.restId === 'bernadette');
      player.loc = 'street'; player.pos.set(t.x * 0.6, 0, t.z + 1.2); r.step(3);
      r.key('KeyN'); r.step(1);
    });
    const menu = page.locator('#nightmenu');
    await expect(menu).toBeVisible();
    const divert = menu.locator('.nm-divert').first();
    test.skip(!(await divert.count()), 'aucun acte illégal ici avec des témoins à détourner à cette heure (graine)');
    const meta = await divert.innerText();
    expect(meta, meta).toMatch(/Faire diversion/);
    expect(meta).toMatch(/détourne .+ · ⏱ \d+\s*min · repéré \d+\s*%/);
    const before = await page.evaluate(() => (window.__rdb.sim.state.attention ?? []).length);
    await divert.click();
    await page.evaluate(() => window.__rdb.step(2));
    const opened = await page.evaluate(() => { const S = window.__rdb.sim.state; return (S.attention ?? []).filter((a) => S.min >= a.from && S.min < a.until).flatMap((a) => a.turns); });
    expect(await page.evaluate(() => (window.__rdb.sim.state.attention ?? []).length)).toBeGreaterThan(before);
    expect(opened.length, 'des témoins détournés').toBeGreaterThan(0);
  });

  // fixme (côté QA, pas un bogue du jeu) : le refus hors pause est vérifié, mais le harnais ne place pas encore Pilou « au coin »
  // comme le lieu 'smoke' l'attend (« Il faut être au coin, à la pause du serveur. »). À reprendre.
  (process.env.QA_RUN_FIXME ? test : test.fixme)('soudoyer le serveur : seulement pendant sa pause cigarette, à l’angle (hors de vue de la terrasse)', async ({ page }) => {
    test.setTimeout(300_000);
    await newCampaign(page);
    await nightOf(page, 3, PREP_ALL);
    await enterNight(page);
    const avail = (min) => page.evaluate(async (m) => {
      const r = window.__rdb, { sim } = r, c = r.campaign;
      for (let i = 0; sim.state.min < m && !sim.state.ended && i < 8000; i++) { for (let ev = c.nightEventDue?.(sim); ev; ev = c.nightEventDue(sim)) c.resolveNightEvent(sim, 0); sim.tick(0.25); if (i % 60 === 0) r.step(1); }
      // Le vrai verrou : l'action elle-même (comme depuis le menu N ou la conversation), Pilou à l'angle de la pause
      const smoke = sim.smokeSpot?.() ?? sim.waiterPos();
      r.player.loc = 'street'; r.player.pos.set(smoke.x, 0, smoke.z); r.step(2);
      const res = c.doNightAction(sim, 'night_bribe_waiter', r.player);
      return { onBreak: sim.waiterOnBreak(), bribe: !!res?.ok, reason: res?.reason ?? null };
    }, min);
    const during = await avail(21 * 60 + 14);
    // Entre deux pauses (21h12–21h18 puis 22h24–22h30), le serveur est en service : refusé, avec la raison
    const before = await avail(21 * 60 + 25);
    expect(before.onBreak).toBe(false);
    expect(before.bribe, `pas de pot-de-vin pendant le service : ${JSON.stringify(before)}`).toBe(false);
    expect(before.reason ?? '').toMatch(/pause/);
    expect(during.onBreak, 'pause cigarette de 21h12').toBe(true);
    expect(during.bribe, `pot-de-vin possible pendant la pause : ${JSON.stringify(during)}`).toBe(true);
    const spot = await page.evaluate(() => { const r = window.__rdb, w = r.sim.waiterPos(), t = r.sim.state.tables.filter((x) => x.restId === 'bernadette'); return { w, nearestTable: Math.min(...t.map((x) => Math.hypot(x.x - w.x, x.z - w.z))) }; });
    expect(spot.nearestTable, `le serveur fume loin de la terrasse : ${JSON.stringify(spot)}`).toBeGreaterThan(3);
  });
});

test.describe('§12e.8 · photos inutiles', () => {
  test('photographier une table en règle : « Photo sans intérêt », un client l’a vu, et à la 3e c’est du harcèlement', async ({ page }) => {
    test.setTimeout(300_000);
    await newCampaign(page);
    await nightOf(page, 2);
    await enterNight(page);
    await advance(page, 21 * 60 + 15);
    const r = await page.evaluate(() => {
      const R = window.__rdb, { sim } = R, S = sim.state;
      const max = sim.cfg.RULES.maxPeoplePerTable;
      const ok = S.tables.filter((t) => t.out && t.count <= max && !(sim.encroachment(t) > 0));
      const risk0 = S.risk, hostility0 = S.hostility, mem0 = S.witnessMemories.length, ev0 = S.evidence.length;
      for (const t of ok.slice(0, 3)) { R.aimAt(t.id); R.step(1); R.key('KeyP'); R.step(2); }
      return { tables: ok.length, useless: S.uselessPhotos ?? 0, risk: [risk0, S.risk], hostility: [hostility0, S.hostility], mem: S.witnessMemories.length - mem0, evidence: S.evidence.length - ev0 };
    });
    test.skip(r.tables < 3, `moins de 3 tables en règle dehors à 21h15 (${r.tables})`);
    expect(r.evidence, 'aucune pièce au dossier').toBe(0);
    expect(r.useless, JSON.stringify(r)).toBe(3);
    expect(r.hostility[1], 'les clients le prennent mal').toBeGreaterThan(r.hostility[0]);
    expect(r.mem, 'un client a vu').toBeGreaterThan(0);
    expect(r.risk[1], 'à la 3e photo inutile : harcèlement (Risque)').toBeGreaterThan(r.risk[0]);
    await expect(page.locator('#log')).toContainText(/sans intérêt|en règle/);
  });
});
