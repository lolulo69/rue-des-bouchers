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
const WPM = 200;
const CLICK_S = 2;
const NIGHT_S = (RULES.nightEnd - RULES.nightStart) / RULES.gameMinutesPerSecond; // durée réelle d'une nuit, en s
const FIXED = { 1: 'd1_monday', 4: 'd4_colette_dinner', 6: 'd6_saturday', 7: 'd7_general_meeting', 9: 'd9_inspector', 11: 'd11_exhaust_meeting', 13: 'd13_saturday', 14: 'd14_commission' };
const OUT = 'test-results/fullrun'; // journaux complets (effacés par Playwright à chaque lancement)
const SUMMARY = 'qa/fullrun'; // résumés versionnés : qa/duration.md est reconstruit à partir de tous les styles déjà joués

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
  stealthy: {
    title: 'illégal discret',
    seed: 404,
    choices: [/Improviser/i, /Noter/i, /Photographier/i],
    avoid: [/action directe/i, /habitué/i],
    koddex: (opts) => pickProjects(opts, (p) => p.legality === 'illegal', 1, (p) => (p.legality ?? 'legal') !== 'legal'),
    actions: { groups: ['illegal', 'grey'] },
    night: 'stealthy',
  },
  mixed: {
    title: 'mixte malin',
    seed: 505,
    choices: [/voie légale/i, /dossier complet/i, /Plaider/i, /Brandir/i, /Photographier/i, /Noter/i, /soupe/i],
    avoid: [/action directe/i, /habitué/i],
    koddex: (opts) => pickProjects(opts, (p) => (p.legality ?? 'legal') === 'legal', 1),
    actions: { prefer: /mairie|press|lawyer|avocat|petition|delphine|inspector|lescaut|ars|hygiene/i, groups: ['legal', 'grey'] },
    night: 'mixed',
  },
  passive: {
    title: 'passif',
    seed: 606,
    choices: [],
    avoid: [],
    koddex: (opts) => Array(opts.prompts).fill('work'),
    actions: { groups: [] }, // n'agit jamais : « fin d'après-midi » tout de suite
    night: 'passive',
  },
};
// Ce que chaque style fait la nuit (minutes de jeu) : photos, appels, serveur, seau, actes illégaux du contenu
const NIGHT_PLANS = {
  legal: { at: hhmm(22, 12), photos: 4, police: 1 },
  diplomat: { at: hhmm(22, 12), photos: 1, waiter: true },
  reckless: { at: hhmm(22, 12), bucket: true, illegal: 2, police: 1, bucketAgain: hhmm(23, 30) },
  stealthy: { at: hhmm(25, 5), bucket: true, illegal: 1 }, // après 1h : Klaas couché, chat rentré, serveur parti
  mixed: { at: hhmm(22, 12), photos: 3, police: 1, late: { at: hhmm(25, 10), bucket: true } },
  passive: {},
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

async function playKoddex(page, clock, style, log, album) {
  if (album) await album.snap(page, 'koddex-start');
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
    if (album) await album.snap(page, 'koddex-end');
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
async function playNight(page, clock, style, log, day, album) {
  await clickTestId(page, clock, '[data-testid=night-go]');
  await page.waitForURL(/mode=night/);
  // La nuit de campagne démarre seule (HUD visible) ; les anciennes versions demandaient « Commencer la nuit »
  await page.locator('#hud:visible, #start:visible').first().waitFor({ timeout: 60_000 });
  if (await page.locator('#start').isVisible()) await page.click('#start');
  await page.waitForFunction(() => window.__rdb?.sim && window.__rdb.campaign, null, { timeout: 60_000 });
  if (album) {
    await page.evaluate((t) => { const r = window.__rdb; for (let i = 0; r.sim.state.min < t && i < 4000; i++) r.sim.tick(0.5); r.step(6); }, hhmm(22, 0));
    await album.snap(page, 'night-hud');
    await page.evaluate(() => { window.__rdb.key('KeyN'); window.__rdb.step(2); });
    if (await page.locator('#nightmenu').isVisible()) { await album.snap(page, 'night-menu'); await page.evaluate(() => { window.__rdb.key('KeyN'); window.__rdb.step(1); }); }
  }
  // Avance la nuit jusqu'à `to` ; s'arrête sur chaque événement de nuit dû (le jeu se met en pause sur sa carte),
  // le fait apparaître (une frame), et le joue au clic dans l'overlay comme un joueur.
  const advance = async (to) => {
    for (let k = 0; k < 20; k++) {
      const due = await page.evaluate((t) => {
        const r = window.__rdb, { sim } = r, c = r.campaign;
        for (let i = 0; sim.state.min < t && !sim.state.ended && i < 6000; i++) {
          const ev = c?.nightEventDue?.(sim);
          if (ev) { r.step(1); return ev.id; }
          sim.tick(0.5);
          if (i % 60 === 0) r.step(1);
        }
        r.step(1);
        return null;
      }, to);
      if (!due) return;
      await page.locator('#nightmenu').waitFor({ state: 'visible', timeout: 30_000 });
      if (album) await album.snap(page, 'night-event');
      await clock.read(page);
      const btns = page.locator('#nightmenu-list button:not([disabled])');
      const labels = await btns.allInnerTexts();
      const ok = labels.map((label, k2) => ({ label, k: k2 })).filter((l) => !style.avoid.some((r) => r.test(l.label)));
      const pick = style.choices.map((r) => ok.find((l) => r.test(l.label))).find(Boolean) ?? ok[0] ?? { k: 0, label: labels[0] };
      log.cards.push({ day, phase: 'night', id: due, type: 'night-event', choice: pick.label });
      clock.click();
      await btns.nth(pick.k).click();
    }
  };
  const plan = NIGHT_PLANS[style.night];
  const acts = [];
  const doActs = (p) => page.evaluate((p) => {
    const r = window.__rdb, { sim } = r, c = r.campaign;
    const done = [];
    const toWindow = () => { const W = sim.cfg.STREET.halfWidth, win = sim.cfg.ANCHORS.pilouWindow; r.player.loc = 'apt'; r.player.pos.set(-W - 0.2, r.world.apt.floor, win.z); r.step(1); };
    if (sim.state.ended) return done;
    for (const t of sim.state.tables.filter((x) => x.out).slice(0, p.photos ?? 0)) { r.aimAt(t.id); r.step(1); r.key('KeyP'); done.push('photo'); }
    if (p.waiter) { sim.act({ type: 'waiter' }); done.push('waiter'); }
    if (p.bucket) { toWindow(); r.key('KeyF'); done.push('bucket'); }
    for (const a of (c?.nightActions(sim) ?? []).filter((x) => x.legality === 'illegal').slice(0, p.illegal ?? 0)) {
      try { c.doNightAction(sim, a.id); done.push(a.id); } catch { /* indisponible ici */ }
    }
    for (let k = 0; k < (p.police ?? 0); k++) { sim.act({ type: 'police' }); done.push('police'); }
    return done;
  }, p);
  if (plan.at) { await advance(plan.at); acts.push(...await doActs(plan)); }
  if (plan.bucketAgain) { await advance(plan.bucketAgain); acts.push(...await doActs({ bucket: true })); }
  if (plan.late) { await advance(plan.late.at); acts.push(...await doActs(plan.late)); }
  await advance(hhmm(27, 0)); // jusqu'à la fin de la nuit
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
  const rows = readdirSync(SUMMARY).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(readFileSync(`${SUMMARY}/${f}`, 'utf8')));
  const m = (s) => { const t = Math.round(s / 60); return `${Math.floor(t / 60)}h${String(t % 60).padStart(2, '0')}`; };
  const lines = rows.map((r) => `| ${r.title} | ${r.ending} (jour ${r.lastDay}) | ${r.nights} | ${r.words} | ${r.clicks} | ${m(r.daySeconds)} | ${m(r.nightSeconds)} | **${m(r.totalSeconds)}** | ${r.early ? `⏹ fin anticipée (jour ${r.lastDay})` : r.totalSeconds < 9000 ? '⚠️ trop court' : r.totalSeconds > 14400 ? '⚠️ trop long' : '✅'} | ${r.at ?? ''} |`);
  writeFileSync('qa/duration.md', `# Durée d'une campagne (GAME_DESIGN §13.A : 2h30 à 4h)

Généré par \`tests/e2e/fullrun.e2e.js\` (\`npm run test:fullrun\`). Estimation, pas un chronométrage :
- **phases de jour** : texte affiché à l'écran (hors en-tête de stats) lu à **${WPM} mots/min**, plus **${CLICK_S} s par clic** ;
- **nuits** : ${NIGHT_S / 60} min réelles chacune (\`RULES\` : ${RULES.nightStart / 60}h → ${RULES.nightEnd / 60 - 24}h, ${RULES.gameMinutesPerSecond} min de jeu par seconde),
  sans « dormir » (qui accélère ×${RULES.sleepTimeMultiplier}) : c'est donc un **plafond** pour la nuit.
- Une fin anticipée (garde à vue, déménagement, licenciement) raccourcit la partie : marquée ⏹, elle n'est pas comparée à la cible.
- ⚠️ trop court = campagne menée jusqu'au J14 en moins de 2h30.

| Style | Fin | Nuits | Mots lus | Clics | Jour | Nuits | Total | Cible | Mesuré le |
|---|---|---|---|---|---|---|---|---|---|
${lines.join('\n')}

Résumés par style : \`qa/fullrun/*.json\` (date du dernier passage dans \`at\`). Dernière mise à jour : ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC.
`);
}

// ── Une campagne complète (partagée par les styles et l'album) ──────────────
async function runCampaign(page, key, style, album = null) {
  const errors = watchErrors(page);
  const clock = makeClock();
  const log = { cards: [], koddex: [], actions: [], nights: [], lostResults: [], commission: null, reload: null };

  await page.goto(`/?nolock=1&seed=${style.seed}`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  if (album) await album.snap(page, 'title', { mobile: true });
  await clickTestId(page, clock, '#campaign');
  if (album) await album.snap(page, 'title-campaign');
  await clickTestId(page, clock, '[data-testid=title-new]');
  if (album && await page.locator('[data-testid=intro]').count()) await album.snap(page, 'intro');
  while (await page.locator('[data-testid=intro-next]').count()) await clickTestId(page, clock, '[data-testid=intro-next]');

  let s;
  for (let guard = 0; guard < 800; guard++) {
    // L'écran d'erreur fatale (main.js) bloque tout : échouer tout de suite avec son rapport plutôt qu'attendre le délai
    if (await page.locator('#fatal').isVisible()) throw new Error(`écran d’erreur fatale au jour ${s?.day} (${s?.step}) : ${(await page.locator('#fatal').innerText()).slice(0, 1500)}`);
    s = await state(page);
    if (!s) { await page.waitForTimeout(200); continue; }
    // Le résultat d'une carte passe avant tout, même la fin (BUG-007 : le verdict du J14 s'affiche avant l'écran de fin)
    if (s.result) {
      if (album) await album.snap(page, s.step === 'ended' ? 'commission-verdict' : 'result', { mobile: s.step === 'ended' });
      await clickTestId(page, clock, '[data-testid=result-next]');
      continue;
    }
    if (s.step === 'ended') break;
    if (s.step === 'cards') {
      if (album) await album.snap(page, s.card.id === 'd14_commission' ? 'commission' : `card-${s.card.type}`, { mobile: s.card.type === 'event' });
      await playCard(page, clock, style, log, s);
    } else if (s.step === 'koddex') await playKoddex(page, clock, style, log, album);
    else if (s.step === 'actions') {
      // Sauvegarde / reprise au milieu de la partie (jour 8, début d'après-midi)
      if (s.day === 8 && !log.reload) await reloadAndCompare(page, style, log);
      if (album) {
        await album.snap(page, 'afternoon', { mobile: true });
        if (!album.has('phone')) { await page.click('[data-testid=phone-open]'); await album.snap(page, 'phone'); await page.click('[data-testid=phone-close]'); }
        if (!album.has('carnet') && await page.locator('[data-testid=carnet-open]').count()) { await page.click('[data-testid=carnet-open]'); await album.snap(page, 'carnet'); await page.click('[data-testid=carnet-close]'); }
      }
      await playAfternoon(page, clock, style, log, s.day);
    } else if (s.step === 'night') {
      if (album) await album.snap(page, 'night-card');
      await playNight(page, clock, style, log, s.day, album);
    } else if (s.step === 'recap') {
      if (album) await album.snap(page, 'recap', { mobile: true });
      await clickTestId(page, clock, '[data-testid=recap-next]');
    }
  }
  expect(s?.step, 'la campagne arrive à une fin').toBe('ended');

  // ── Écran de fin ──
  const ending = page.locator('[data-testid=ending]');
  await expect(ending).toBeVisible();
  await clock.read(page);
  const end = s.ending;
  await expect(ending).toHaveAttribute('data-id', end.id);
  await expect(ending).toContainText(end.title);
  // Épilogue : au moins 2 parties qui dépendent de ce que la partie a réellement fait (drapeaux)
  const def = ENDINGS.find((e) => e.id === end.id);
  const shown = await page.locator('.ui-epilogue p').allInnerTexts();
  const flags = new Set(s.flags);
  const specific = (def.epilogue ?? []).filter((p) => (p.when?.flags ?? []).length && p.when.flags.every((f) => flags.has(f)))
    .filter((p) => shown.some((t) => t.startsWith(p.text.split('{')[0].slice(0, 30))));
  if (key !== 'passive') expect(specific.length, `parties d'épilogue liées à la partie (${end.id})`).toBeGreaterThanOrEqual(2);
  // Fins découvertes : la fin atteinte est débloquée, les fins secrètes non atteintes restent cachées
  await expect(page.locator(`[data-testid=endings] [data-ending="${end.id}"]`)).not.toHaveClass(/locked/);
  for (const e of ENDINGS.filter((x) => x.secret && x.id !== end.id)) await expect(page.locator(`[data-testid=endings] [data-ending="${e.id}"]`)).toHaveCount(0);
  if (album) { await album.snap(page, 'ending', { mobile: true }); await page.locator('[data-testid=endings]').scrollIntoViewIfNeeded(); await album.snap(page, 'endings-list'); }
  mkdirSync(OUT, { recursive: true });
  await page.screenshot({ path: `${OUT}/${key}-ending.png`, timeout: 90_000 });

  // ── Calendrier : chaque événement fixe à son jour (jours atteints) ──
  for (const [day, id] of Object.entries(FIXED)) {
    // Fin anticipée : le dernier jour peut s'arrêter avant l'événement (ex. déménagement le matin du J11)
    if (Number(day) > s.day || (end.early && Number(day) === s.day)) continue;
    const seen = log.cards.filter((c) => c.id === id);
    expect(seen.length, `${id} vu`).toBeGreaterThan(0);
    for (const c of seen) expect(c.day, `${id} au jour ${day}`).toBe(Number(day));
  }
  if (!end.early) {
    expect(log.commission, 'la commission du J14 a eu lieu').not.toBeNull();
    expect(log.commission.sceneFromEngine, 'le moteur prépare la scène de la commission').toBeGreaterThan(1);
  } else {
    expect(s.day, 'pas de fin anticipée avant la nuit 5 (§13.A)').toBeGreaterThanOrEqual(5);
  }

  // ── Durée ──
  const nights = log.nights.length;
  const r = {
    title: style.title, ending: end.id, early: !!end.early, lastDay: s.day, nights, words: clock.t.words, clicks: clock.t.clicks,
    daySeconds: Math.round(clock.seconds()), nightSeconds: nights * NIGHT_S, totalSeconds: Math.round(clock.seconds() + nights * NIGHT_S),
  };
  console.log(`[fullrun] ${style.title} :`, r, 'résultats perdus :', log.lostResults.length, 'commission :', log.commission);
  expect(errors).toEqual([]);
  return { r, log, end };
}

// ── Les six campagnes ────────────────────────────────────────────────────────
for (const [key, style] of Object.entries(STYLES)) {
  test(`campagne complète · ${style.title}`, async ({ page }) => {
    test.skip(!process.env.QA_FULLRUN, 'campagnes complètes : `npm run test:fullrun` (workflow nightly « Full runs »)');
    test.setTimeout(60 * 60_000);
    const { r, log, end } = await runCampaign(page, key, style);
    writeFileSync(`${OUT}/${key}.json`, JSON.stringify({ ...r, log }, null, 2));
    mkdirSync(SUMMARY, { recursive: true });
    writeFileSync(`${SUMMARY}/${key}.json`, `${JSON.stringify({ ...r, at: new Date().toISOString().slice(0, 10) }, null, 2)}\n`);
    writeDuration();
    test.info().annotations.push({ type: 'duration', description: `${style.title} : ${Math.round(r.totalSeconds / 60)} min (${end.id})` });
    if (key === 'reckless') expect(end.id).toBe('custody');
    if (key === 'legal') expect(end.id).not.toBe('custody');
    // Passif : soit la campagne dure au moins 2h30, soit elle finit par un déménagement après la nuit 5
    if (key === 'passive') expect(r.totalSeconds >= 9000 || (end.id === 'moving_out' && r.lastDay >= 5), `passif : ${end.id} au jour ${r.lastDay}, ${Math.round(r.totalSeconds / 60)} min`).toBe(true);
    // Une campagne menée jusqu'au J14 en moins de 2h30 est signalée (§13.A)
    if (!r.early && r.totalSeconds < 9000) test.info().annotations.push({ type: 'warning', description: `${style.title} : campagne complète en ${Math.round(r.totalSeconds / 60)} min (< 2h30)` });
  });
}

// ── Album du parcours : chaque type d'écran, la première fois qu'il apparaît ────
test('album du parcours (légal, graine 3) → qa/screens/flow/', async ({ page }) => {
  test.skip(!process.env.QA_ALBUM, 'album : `npm run qa:album`');
  test.setTimeout(90 * 60_000);
  const DIR = 'qa/screens/flow';
  mkdirSync(DIR, { recursive: true });
  const taken = new Map();
  const album = {
    has: (name) => taken.has(name),
    async snap(pg, name, { mobile = false } = {}) {
      if (taken.has(name)) return;
      const n = String(taken.size + 1).padStart(2, '0');
      taken.set(name, n);
      await pg.waitForTimeout(300); // fin des transitions CSS
      await pg.screenshot({ path: `${DIR}/${n}-${name}.jpg`, type: 'jpeg', quality: 82, timeout: 90_000 });
      if (mobile) {
        const vp = pg.viewportSize();
        await pg.setViewportSize({ width: 390, height: 844 });
        await pg.waitForTimeout(300);
        await pg.screenshot({ path: `${DIR}/${n}-${name}-mobile.jpg`, type: 'jpeg', quality: 82, timeout: 90_000 });
        await pg.setViewportSize(vp);
      }
    },
  };
  await runCampaign(page, 'album', { ...STYLES.legal, seed: 3 }, album);
  console.log('[album]', [...taken].map(([k, n]) => `${n}-${k}`).join(' '));
  for (const must of ['title', 'koddex-start', 'koddex-end', 'card-event', 'card-dialogue', 'afternoon', 'phone', 'night-hud', 'recap', 'commission', 'ending']) {
    expect(taken.has(must), `écran « ${must} » capturé`).toBe(true);
  }
});

// BUG-003 (corrigé, qa/bugs.md) : la scène de la commission (répliques de Jérémie, Ghislain, Delphine, Colette, du maire)
// est calculée par le moteur (card.scene) mais l'interface ne l'affiche pas.
test('BUG-003 (corrigé) · la scène de la commission (J14) est affichée avant les plaidoiries', async () => {
  const f = `${OUT}/legal.json`;
  test.skip(!existsSync(f), 'lancer d’abord la campagne « légal prudent »');
  const { log } = JSON.parse(readFileSync(f, 'utf8'));
  expect(log.commission.shownSpeeches).toBe(log.commission.sceneFromEngine);
});

// BUG-004 (corrigé, qa/bugs.md) : le résultat de la dernière carte d'une phase n'est jamais affiché (l'écran passe à la phase suivante).
test('BUG-004 (corrigé) · le résultat de la dernière carte d’une phase est affiché', async () => {
  const files = existsSync(OUT) ? readdirSync(OUT).filter((f) => f.endsWith('.json')) : [];
  test.skip(!files.length, 'lancer d’abord les campagnes complètes');
  const lost = files.flatMap((f) => JSON.parse(readFileSync(`${OUT}/${f}`, 'utf8')).log.lostResults);
  expect(lost).toEqual([]);
});
