import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import { RULES } from '../../src/config.js';
import { ENDINGS } from '../../src/content/endings.js';
import { watchErrors, hhmm } from './helpers.js';

// Campagnes complètes de 14 jours par la vraie interface de jour (src/ui) : chaque carte, prompt Koddex et action
// d'après-midi est un clic sur l'interface. Seules les nuits 3D sont accélérées par les hooks window.__rdb.
// Trois styles scriptés : légal prudent, casse-cou (garde à vue attendue), diplomate.
// Vérifie (§13.A, B, F) : événements fixes à leur jour, scène de la commission (J14), écran de fin avec un épilogue
// qui reflète la partie, « Fins découvertes » (la fin secrète reste cachée), sauvegarde / reprise en cours de partie.
// Mesure aussi la durée « humaine » estimée (lecture à 200 mots/min + 2 s par clic + 14 nuits réelles) → qa/duration.md.
// Lent (≈ 10–20 min par style en CI) : tourne dans le workflow « Full runs » (nightly + manuel), pas à chaque push.
test.skip(!process.env.QA_FULLRUN, 'campagnes complètes : `npm run test:fullrun` (workflow nightly « Full runs »)');

const WPM = 200;
const CLICK_S = 2;
const NIGHT_S = (RULES.nightEnd - RULES.nightStart) / RULES.gameMinutesPerSecond; // durée réelle d'une nuit, en s
const FIXED = { 1: 'd1_monday', 4: 'd4_colette_dinner', 6: 'd6_saturday', 7: 'd7_general_meeting', 9: 'd9_inspector', 11: 'd11_exhaust_meeting', 13: 'd13_saturday', 14: 'd14_commission' };
const OUT = 'test-results/fullrun';

// ── Styles de jeu ────────────────────────────────────────────────────────────
const STYLES = {
  legal: {
    title: 'légal prudent',
    seed: 101,
    choices: [/voie légale/i, /dossier complet/i, /Plaider la clim/i, /Plaider l’extraction/i, /Photographier/i, /Noter/i, /mairie/i, /dossier/i],
    avoid: [/action directe/i, /habitué/i, /carbonnade/i],
    koddex: (opts) => pickProjects(opts, (p) => (p.legality ?? 'legal') === 'legal', 1),
    actions: { groups: ['legal'] },
    night: 'legal',
  },
  reckless: {
    title: 'casse-cou',
    seed: 202,
    choices: [/action directe/i, /Brandir/i, /Improviser/i],
    avoid: [/habitué/i],
    koddex: (opts) => pickProjects(opts, (p) => p.legality === 'illegal', 2, (p) => true),
    actions: { groups: ['illegal', 'grey', 'legal'] },
    night: 'reckless',
  },
  diplomat: {
    title: 'diplomate',
    seed: 303,
    choices: [/dialogue/i, /charte/i, /Tendre la main/i, /soupe/i, /poliment/i, /Accepter/i],
    avoid: [/action directe/i, /habitué/i],
    koddex: (opts) => pickProjects(opts, (p) => /whatsapp|bot/i.test(p.id), 1),
    actions: { prefer: /meeting|reunion|réunion|dialog|delphine|dinner|tatie|hippolyte|petition|whatsapp|recruit|lescaut|waiter|charte|media/i, groups: ['legal', 'grey'] },
    night: 'diplomat',
  },
};
// Choisit jusqu'à `n` projets perso (filtre principal, puis repli), complète avec du vrai travail
function pickProjects(opts, main, n, fallback = () => false) {
  const avail = opts.sideProjects.filter((p) => p.available && (p.cost?.prompts ?? 1) === 1);
  const chosen = [...avail.filter(main), ...avail.filter((p) => !main(p) && fallback(p))].slice(0, n).map((p) => p.id);
  while (chosen.length < opts.prompts) chosen.splice(1, 0, 'work');
  return chosen.slice(0, opts.prompts);
}

// ── Lecture « humaine » : temps de lecture du texte affiché (hors en-tête) ─────
// Un lecteur ne relit pas ce qu'il a déjà lu : chaque ligne (paragraphe, libellé de bouton) ne compte qu'une fois.
function makeClock() {
  const t = { words: 0, clicks: 0, screens: 0 };
  const seen = new Set();
  return {
    t,
    async read(page) {
      const text = await page.evaluate(() => {
        const root = window.__rdb?.ui?.root;
        if (!root) return '';
        const head = root.querySelector('[data-testid=day-header]');
        return root.innerText.replace(head?.innerText ?? '', '');
      });
      for (const line of text.split('\n').map((l) => l.trim()).filter(Boolean)) {
        if (seen.has(line)) continue;
        seen.add(line);
        t.words += line.split(/\s+/).length;
      }
      t.screens++;
    },
    click() { t.clicks++; },
    seconds() { return (t.words / WPM) * 60 + t.clicks * CLICK_S; },
  };
}

// ── Pilote ───────────────────────────────────────────────────────────────────
const state = (page) => page.evaluate(() => {
  const c = window.__rdb?.ui?.campaign;
  if (!c) return null;
  const root = window.__rdb.ui.root;
  const card = c.step === 'cards' ? c.card() : null;
  return {
    step: c.step, day: c.state.day, phase: c.state.phase, stats: { ...c.state.stats }, flags: [...c.state.flags],
    timeLeft: c.state.timeLeft, evidence: c.state.evidence.length, ending: c.state.ending ?? null,
    card: card ? { id: card.id, type: card.type, scene: (card.scene ?? []).map((s) => s.text) } : null,
    result: !!root.querySelector('[data-testid=result]'),
    hidden: root.classList.contains('ui-hidden'),
  };
});

async function clickTestId(page, clock, sel) {
  await clock.read(page);
  clock.click();
  await page.click(sel);
}

async function playCard(page, clock, style, log, s) {
  const choices = page.locator('[data-testid=card-choice]');
  await choices.first().waitFor();
  const labels = await choices.evaluateAll((bs) => bs.map((b) => ({ i: b.dataset.i, label: b.querySelector('.lbl')?.textContent ?? '', ok: !b.disabled })));
  const ok = labels.filter((l) => l.ok && !style.avoid.some((r) => r.test(l.label)));
  const pick = style.choices.map((r) => ok.find((l) => r.test(l.label))).find(Boolean) ?? ok[0] ?? labels.find((l) => l.ok);
  log.cards.push({ day: s.day, phase: s.phase, id: s.card.id, type: s.card.type, choice: pick.label });
  if (s.card.id === 'd14_commission') {
    log.commission = { sceneFromEngine: s.card.scene.length, shownSpeeches: 0 };
    const shown = await page.evaluate(() => window.__rdb.ui.root.innerText);
    log.commission.shownSpeeches = s.card.scene.filter((t) => shown.includes(t.slice(0, 40))).length;
  }
  // Le choix a-t-il un texte de résultat dans le contenu ? (sinon, passer directement à la suite est normal)
  const hasResult = await page.evaluate((i) => !!window.__rdb.ui.campaign.card()?.data?.choices?.[i]?.result, Number(pick.i));
  const before = s.step;
  await clickTestId(page, clock, `[data-testid=card-choice][data-i="${pick.i}"]`);
  const after = await state(page);
  if (hasResult && after && !after.result && after.step !== before) log.lostResults.push({ day: s.day, id: s.card.id, step: after.step });
}

async function playKoddex(page, clock, style, log) {
  const opts = await page.evaluate(() => window.__rdb.ui.campaign.koddexOptions());
  const picks = style.koddex(opts);
  log.koddex.push(picks);
  for (const id of picks) {
    const btn = page.locator(`[data-testid=koddex-option][data-id="${id}"]`).first();
    if (!(await btn.count())) continue; // l'écran a déjà changé (BUG-002)
    for (let i = 0; i < 60 && await btn.isDisabled(); i++) await page.click('[data-testid=terminal]');
    await clickTestId(page, clock, `[data-testid=koddex-option][data-id="${id}"]`);
  }
  if (await page.locator('[data-testid=koddex-done]').count()) {
    for (let i = 0; i < 60 && await page.locator('[data-testid=koddex-done]').isDisabled(); i++) await page.click('[data-testid=terminal]');
    await clickTestId(page, clock, '[data-testid=koddex-done]');
  }
}

async function playAfternoon(page, clock, style, log, day) {
  for (let n = 0; n < 6; n++) {
    if ((await state(page))?.step !== 'actions') return;
    if (await page.locator('[data-testid=result]').count()) { await clickTestId(page, clock, '[data-testid=result-next]'); continue; }
    const left = Number(await page.locator('[data-testid=slots]').getAttribute('data-left'));
    if (!left) break;
    const acts = await page.locator('[data-testid=action]').evaluateAll((bs) => bs.map((b) => ({
      id: b.dataset.id, ok: !b.disabled, group: b.closest('[data-testid^=group-]')?.dataset.testid.slice(6),
    })));
    const ok = acts.filter((a) => a.ok);
    const pick = (style.actions.prefer && ok.find((a) => style.actions.prefer.test(a.id) && style.actions.groups.includes(a.group)))
      ?? style.actions.groups.map((g) => ok.find((a) => a.group === g)).find(Boolean);
    if (!pick) break;
    log.actions.push({ day, id: pick.id, group: pick.group });
    await clickTestId(page, clock, `[data-testid=action][data-id="${pick.id}"]`);
    if (await page.locator('[data-testid=result-next]').count()) await clickTestId(page, clock, '[data-testid=result-next]');
  }
  if ((await state(page))?.step === 'actions') await clickTestId(page, clock, '[data-testid=action-end]');
}

// La nuit 3D, accélérée : quelques actes typiques du style, puis la fin de nuit (l'interface reprend sur le bilan).
async function playNight(page, clock, style, log, day) {
  await clickTestId(page, clock, '[data-testid=night-go]');
  await page.waitForURL(/mode=night/);
  // La nuit de campagne démarre seule (HUD visible) ; les anciennes versions demandaient « Commencer la nuit »
  await page.locator('#hud:visible, #start:visible').first().waitFor({ timeout: 60_000 });
  if (await page.locator('#start').isVisible()) await page.click('#start');
  await page.waitForFunction(() => window.__rdb?.sim && window.__rdb.campaign, null, { timeout: 60_000 });
  const acts = await page.evaluate(({ kind, t1, t2 }) => {
    const r = window.__rdb, { sim } = r, c = r.campaign;
    const run = (min) => { for (let i = 0; sim.state.min < min && !sim.state.ended && i < 4000; i++) { sim.tick(0.5); if (i % 60 === 0) r.step(1); } };
    const done = [];
    run(t1);
    if (kind === 'legal' || kind === 'diplomat') {
      for (const t of sim.state.tables.filter((x) => x.out).slice(0, kind === 'legal' ? 4 : 1)) { r.aimAt(t.id); r.step(1); r.key('KeyP'); done.push('photo'); }
      if (kind === 'legal' && sim.state.calls < 1) { sim.act({ type: 'police' }); done.push('police'); }
      if (kind === 'diplomat') { sim.act({ type: 'waiter' }); done.push('waiter'); }
    } else {
      const W = sim.cfg.STREET.halfWidth, win = sim.cfg.ANCHORS.pilouWindow;
      r.player.loc = 'apt'; r.player.pos.set(-W - 0.2, r.world.apt.floor, win.z); r.step(1);
      r.key('KeyF'); done.push('bucket');
      for (const a of (c?.nightActions(sim) ?? []).filter((x) => x.legality === 'illegal' && x.available !== false).slice(0, 2)) {
        try { c.doNightAction(sim, a.id); done.push(a.id); } catch { /* indisponible ici */ }
      }
      sim.act({ type: 'police' }); done.push('police');
    }
    run(t2);
    if (kind === 'reckless' && !sim.state.ended) { r.key('KeyF'); done.push('bucket'); }
    for (let i = 0; !sim.state.ended && i < 6000; i++) { sim.tick(0.5); if (i % 60 === 0) r.step(1); }
    r.step(2);
    return done;
  }, { kind: style.night, t1: hhmm(22, 12), t2: hhmm(23, 30) });
  log.nights.push({ day, acts });
  await page.waitForFunction(() => window.__rdb?.ui?.campaign && !window.__rdb.ui.root.classList.contains('ui-hidden'), null, { timeout: 60_000 });
}

async function reloadAndCompare(page, style, log) {
  const before = await state(page);
  await page.goto(`/?nolock=1&seed=${style.seed}`);
  await page.click('#campaign');
  await page.click('[data-testid=title-continue]');
  await expect(page.locator('[data-testid=day-header]')).toHaveAttribute('data-day', String(before.day));
  const after = await state(page);
  log.reload = { day: before.day, step: before.step, same: JSON.stringify([before.step, before.stats, before.flags, before.timeLeft]) === JSON.stringify([after.step, after.stats, after.flags, after.timeLeft]) };
  expect(after.step).toBe(before.step);
  expect(after.stats).toEqual(before.stats);
  expect(after.flags).toEqual(before.flags);
  expect(after.timeLeft).toBe(before.timeLeft);
}

function writeDuration() {
  const rows = readdirSync(OUT).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(readFileSync(`${OUT}/${f}`, 'utf8')));
  const m = (s) => `${Math.floor(s / 3600)}h${String(Math.round((s % 3600) / 60)).padStart(2, '0')}`;
  const lines = rows.map((r) => `| ${r.title} | ${r.ending} (jour ${r.lastDay}) | ${r.nights} | ${r.words} | ${r.clicks} | ${m(r.daySeconds)} | ${m(r.nightSeconds)} | **${m(r.totalSeconds)}** | ${r.totalSeconds >= 9000 && r.totalSeconds <= 14400 ? '✅' : '⚠️'} |`);
  writeFileSync('qa/duration.md', `# Durée d'une campagne (GAME_DESIGN §13.A : 2h30 à 4h)

Généré par \`tests/e2e/fullrun.e2e.js\` (\`npm run test:fullrun\`). Estimation, pas un chronométrage :
- **phases de jour** : texte affiché à l'écran (hors en-tête de stats) lu à **${WPM} mots/min**, plus **${CLICK_S} s par clic** ;
- **nuits** : ${NIGHT_S / 60} min réelles chacune (\`RULES\` : ${RULES.nightStart / 60}h → ${RULES.nightEnd / 60 - 24}h, ${RULES.gameMinutesPerSecond} min de jeu par seconde),
  sans « dormir » (qui accélère ×${RULES.sleepTimeMultiplier}) : c'est donc un **plafond** pour la nuit.
- La fin anticipée (casse-cou) raccourcit la partie : elle s'arrête à la garde à vue.

| Style | Fin | Nuits | Mots lus | Clics | Jour | Nuits | Total | Cible |
|---|---|---|---|---|---|---|---|---|
${lines.join('\n')}

Dernière mise à jour : ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC.
`);
}

// ── Les trois campagnes ──────────────────────────────────────────────────────
for (const [key, style] of Object.entries(STYLES)) {
  test(`campagne complète · ${style.title}`, async ({ page }) => {
    test.setTimeout(60 * 60_000);
    const errors = watchErrors(page);
    const clock = makeClock();
    const log = { cards: [], koddex: [], actions: [], nights: [], lostResults: [], commission: null, reload: null };

    await page.goto(`/?nolock=1&seed=${style.seed}`);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await clickTestId(page, clock, '#campaign');
    await clickTestId(page, clock, '[data-testid=title-new]');
    while (await page.locator('[data-testid=intro-next]').count()) await clickTestId(page, clock, '[data-testid=intro-next]');

    let s;
    for (let guard = 0; guard < 600; guard++) {
      s = await state(page);
      if (!s) { await page.waitForTimeout(200); continue; }
      if (s.step === 'ended') break;
      if (s.result) { await clickTestId(page, clock, '[data-testid=result-next]'); continue; }
      if (s.step === 'cards') await playCard(page, clock, style, log, s);
      else if (s.step === 'koddex') await playKoddex(page, clock, style, log);
      else if (s.step === 'actions') {
        // Sauvegarde / reprise au milieu de la partie (jour 8, début d'après-midi)
        if (s.day === 8 && !log.reload) await reloadAndCompare(page, style, log);
        await playAfternoon(page, clock, style, log, s.day);
      } else if (s.step === 'night') await playNight(page, clock, style, log, s.day);
      else if (s.step === 'recap') await clickTestId(page, clock, '[data-testid=recap-next]');
    }
    expect(s?.step, 'la campagne arrive à une fin').toBe('ended');

    // ── Écran de fin ──
    const ending = page.locator('[data-testid=ending]');
    await expect(ending).toBeVisible();
    await clock.read(page);
    const end = s.ending;
    await expect(ending).toHaveAttribute('data-id', end.id);
    await expect(ending).toContainText(end.title);
    // Épilogue : au moins 2 parties qui dépendent de ce que la partie a réellement fait (drapeaux / stats)
    const def = ENDINGS.find((e) => e.id === end.id);
    const shown = await page.locator('.ui-epilogue p').allInnerTexts();
    const flags = new Set(s.flags);
    const specific = (def.epilogue ?? []).filter((p) => (p.when?.flags ?? []).length && p.when.flags.every((f) => flags.has(f)))
      .filter((p) => shown.some((t) => t.startsWith(p.text.split('{')[0].slice(0, 30))));
    expect(specific.length, `parties d'épilogue liées à la partie (${end.id})`).toBeGreaterThanOrEqual(2);
    // Fins découvertes : la fin atteinte est débloquée, la fin secrète reste cachée
    await expect(page.locator(`[data-testid=endings] [data-ending="${end.id}"]`)).not.toHaveClass(/locked/);
    for (const e of ENDINGS.filter((x) => x.secret && x.id !== end.id)) await expect(page.locator(`[data-testid=endings] [data-ending="${e.id}"]`)).toHaveCount(0);
    await page.screenshot({ path: `${OUT}/${key}-ending.png`, timeout: 90_000 });

    // ── Calendrier : chaque événement fixe à son jour (jours atteints) ──
    for (const [day, id] of Object.entries(FIXED)) {
      if (Number(day) > s.day) continue;
      const seen = log.cards.filter((c) => c.id === id);
      expect(seen.length, `${id} vu`).toBeGreaterThan(0);
      for (const c of seen) expect(c.day, `${id} au jour ${day}`).toBe(Number(day));
    }
    if (!end.early) {
      expect(log.commission, 'la commission du J14 a eu lieu').not.toBeNull();
      expect(log.commission.sceneFromEngine, 'le moteur prépare la scène de la commission').toBeGreaterThan(1);
    }
    if (key === 'reckless') expect(end.id).toBe('custody');
    if (key === 'legal') expect(end.id).not.toBe('custody');

    // ── Durée ──
    const nights = log.nights.length;
    const r = {
      title: style.title, ending: end.id, lastDay: s.day, nights, words: clock.t.words, clicks: clock.t.clicks,
      daySeconds: Math.round(clock.seconds()), nightSeconds: nights * NIGHT_S, totalSeconds: Math.round(clock.seconds() + nights * NIGHT_S),
    };
    mkdirSync(OUT, { recursive: true });
    writeFileSync(`${OUT}/${key}.json`, JSON.stringify({ ...r, log }, null, 2));
    writeDuration();
    console.log(`[fullrun] ${style.title} :`, r, 'résultats perdus :', log.lostResults.length, 'commission :', log.commission);
    test.info().annotations.push({ type: 'duration', description: `${style.title} : ${Math.round(r.totalSeconds / 60)} min (${end.id})` });
    expect(errors).toEqual([]);
  });
}

// BUG-003 (qa/bugs.md) : la scène de la commission (répliques de Jérémie, Ghislain, Delphine, Colette, du maire)
// est calculée par le moteur (card.scene) mais l'interface ne l'affiche pas.
(process.env.QA_RUN_FIXME ? test : test.fixme)('BUG-003 · la scène de la commission (J14) est affichée avant les plaidoiries', async () => {
  const f = `${OUT}/legal.json`;
  test.skip(!existsSync(f), 'lancer d’abord la campagne « légal prudent »');
  const { log } = JSON.parse(readFileSync(f, 'utf8'));
  expect(log.commission.shownSpeeches).toBe(log.commission.sceneFromEngine);
});

// BUG-004 (qa/bugs.md) : le résultat de la dernière carte d'une phase n'est jamais affiché (l'écran passe à la phase suivante).
(process.env.QA_RUN_FIXME ? test : test.fixme)('BUG-004 · le résultat de la dernière carte d’une phase est affiché', async () => {
  const files = existsSync(OUT) ? readdirSync(OUT).filter((f) => f.endsWith('.json')) : [];
  test.skip(!files.length, 'lancer d’abord les campagnes complètes');
  const lost = files.flatMap((f) => JSON.parse(readFileSync(`${OUT}/${f}`, 'utf8')).log.lostResults);
  expect(lost).toEqual([]);
});
