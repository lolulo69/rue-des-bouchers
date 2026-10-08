import { test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { startNight, tickTo, goToWindow, hhmm } from './helpers.js';

// Q-kit : captures pour les sessions de QA de Lucas dans Chrome (§13, items « Q » non cochés). Voir qa/q-kit.md.
// Ce n'est PAS une suite d'assertions : une capture par item dans qa/screens/q/<item>.png.
// Lancement : npm run qa:qkit (hors CI : sauté sans QA_QKIT=1).
test.skip(!process.env.QA_QKIT, 'captures Q-kit : lancer `npm run qa:qkit`');
test.describe.configure({ mode: 'serial' });
test.setTimeout(600_000);

const DIR = 'qa/screens/q';
const SEED = 11;
test.beforeAll(() => mkdirSync(DIR, { recursive: true }));
const shot = (page, name, opts = {}) => page.screenshot({ path: `${DIR}/${name}.png`, timeout: 120_000, ...opts });

// ── qk : avance rapide de la campagne par l'API du moteur (mêmes appels que l'interface), copiée dans qa/q-kit.md ──
// Garde Sommeil / Job / Risque dans une zone sûre pendant l'avance rapide (sinon la partie finit avant le jour voulu).
const QK = () => {
  window.qk = {
    c: () => window.__rdb.ui.campaign,
    safe(c) { const s = c.state.stats; s.sleep = Math.max(s.sleep, 60); s.job = Math.max(s.job, 60); s.risk = Math.min(s.risk, 30); },
    night(c) {
      const sim = c.createNight();
      for (let k = 0; !sim.state.ended && k < 20000; k++) { if (sim.state.sleep < 30) sim.state.sleep = 50; sim.tick(1); sim.events.length = 0; }
      c.finishNight(sim);
    },
    advance(c, prefer) {
      switch (c.step) {
        case 'cards': {
          const ok = c.card().choices.filter((x) => x.available);
          const pick = (prefer && ok.find((x) => prefer.test(x.label))) || ok.find((x) => !/action directe|habitué|carbonnade/i.test(x.label)) || ok[0];
          c.resolveCard(pick ? pick.i : 0);
          break;
        }
        case 'koddex': c.koddex(['work', 'work', 'work']); break;
        case 'actions': c.endAfternoon(); break;
        case 'night': this.night(c); break;
        case 'recap': c.nextDay(); break;
        default: break;
      }
    },
    // Avance jusqu'au jour `day`, à l'étape `step` ('cards' | 'koddex' | 'actions' | 'night' | 'recap'),
    // ou jusqu'à la carte `card` (id) si elle est donnée. Sauvegarde et redessine l'interface.
    to(day, step = 'cards', { card = null, prefer = null } = {}) {
      const c = this.c();
      const re = prefer ? new RegExp(prefer, 'i') : null;
      for (let i = 0; i < 5000 && !c.ended && c.state.day <= day; i++) {
        if (c.state.day === day && c.step === step && (!card || (c.step === 'cards' && c.card().id === card))) break;
        this.safe(c);
        this.advance(c, re);
      }
      return this.done(c);
    },
    // Avance jusqu'à la prochaine carte de dialogue d'un des `speakers` (au plus jusqu'au jour `maxDay`).
    toDialogue(speakers, maxDay = 14) {
      const c = this.c();
      for (let i = 0; i < 5000 && !c.ended && c.state.day <= maxDay; i++) {
        if (c.step === 'cards') { const k = c.card(); if (k.type === 'dialogue' && speakers.includes(k.data.speaker)) break; }
        this.safe(c);
        this.advance(c, null);
      }
      return this.done(c);
    },
    done(c) {
      localStorage.setItem(window.__rdb.saveKey, JSON.stringify(c.save()));
      window.__rdb.ui.render();
      const card = c.step === 'cards' ? c.card() : null;
      return { day: c.state.day, step: c.step, card: card?.id ?? null, speaker: card?.data?.speaker ?? null, ended: c.ended };
    },
    // Modifie la sauvegarde (puis recharger et « Continuer ») : seul moyen propre de forcer un état
    patchSave(fn) { const k = window.__rdb.saveKey; const s = JSON.parse(localStorage.getItem(k)); fn(s); localStorage.setItem(k, JSON.stringify(s)); },
  };
};

// Nouvelle campagne dans le jeu complet (index.html), intro passée
async function newCampaign(page, seed = SEED) {
  await page.addInitScript(QK);
  await page.goto(`/?nolock=1&seed=${seed}`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.click('#campaign');
  await page.click('[data-testid=title-new]');
  if (await page.locator('[data-testid=intro-skip]').count()) await page.click('[data-testid=intro-skip]');
  await page.locator('[data-testid=day-header]').waitFor();
}
// Recharge la sauvegarde courante et clique « Continuer »
async function continueSave(page, seed = SEED) {
  await page.goto(`/?nolock=1&seed=${seed}`);
  await page.click('#campaign');
  await page.click('[data-testid=title-continue]');
  await page.locator('#ui-root, [data-testid=day-header]').first().waitFor();
}
const qk = (page, fn, arg) => page.evaluate(fn, arg);
const settle = (page) => page.waitForTimeout(600);

// ── A. Campagne et durée ─────────────────────────────────────────────────────
test('A1 calendrier : matin, après-midi, nuit, bilan, jour 14', async ({ page }) => {
  await newCampaign(page);
  await qk(page, () => window.qk.to(1, 'koddex'));
  await settle(page);
  await shot(page, 'A1-calendar');
  await qk(page, () => window.qk.to(1, 'actions'));
  await settle(page);
  await shot(page, 'A1-calendar-afternoon');
  await qk(page, () => window.qk.to(14, 'cards'));
  await settle(page);
  await shot(page, 'A1-calendar-day14');
});

test('A2 sauvegarde : jour 3 après-midi, rechargement, « Continuer »', async ({ page }) => {
  await newCampaign(page);
  await qk(page, () => window.qk.to(3, 'actions'));
  await continueSave(page);
  await settle(page);
  await shot(page, 'A2-save-continue');
});

test('A3 durée : début de la première nuit de campagne', async ({ page }) => {
  await newCampaign(page);
  await qk(page, () => window.qk.to(1, 'night'));
  await Promise.all([page.waitForURL(/mode=night/), page.click('[data-testid=night-go]')]);
  await page.locator('#hud').waitFor({ state: 'visible' });
  await page.evaluate(() => window.__rdb.step(4));
  await shot(page, 'A3-duration-night-start');
});

test('A5 événements fixes : une carte par jour fixe', async ({ page }) => {
  await newCampaign(page);
  const FIXED = [[1, 'd1_monday'], [4, 'd4_colette_dinner'], [6, 'd6_saturday'], [7, 'd7_general_meeting'], [9, 'd9_inspector'], [11, 'd11_exhaust_meeting'], [13, 'd13_saturday'], [14, 'd14_commission']];
  for (const [day, id] of FIXED) {
    const r = await qk(page, ([d, card]) => window.qk.to(d, 'cards', { card }), [day, id]);
    await settle(page);
    await shot(page, r.card === id ? `A5-event-d${day}` : `A5-event-d${day}-MISSING`);
    await qk(page, () => { const c = window.qk.c(); window.qk.advance(c, null); return window.qk.done(c); });
  }
});

// ── B. Personnages ───────────────────────────────────────────────────────────
test('B1 + B2 casting : le Carnet, tout le monde rencontré', async ({ page }) => {
  await newCampaign(page);
  await qk(page, () => window.qk.to(2, 'actions'));
  await qk(page, () => window.qk.patchSave((s) => {
    s.flags.push('met_jeremie', 'met_klaas', 'met_hilde', 'met_tatie', 'met_seb_nico', 'met_hippolyte', 'met_waiter',
      'called_police', 'chief_came', 'press_contacted', 'lawyer_hired');
  }));
  await continueSave(page);
  await page.setViewportSize({ width: 1280, height: 4200 });
  await page.click('[data-testid=carnet-open]');
  await settle(page);
  await shot(page, 'B1-B2-carnet-characters');
});

test('B3 dialogues de l’association : la première réplique de chacun', async ({ page }) => {
  await newCampaign(page);
  // Rencontres déjà faites : la plupart des répliques demandent met_* (sinon Hilde, Seb, Nico se taisent en avance rapide)
  await qk(page, () => window.qk.to(1, 'koddex'));
  await qk(page, () => window.qk.patchSave((s) => s.flags.push('met_jeremie', 'met_klaas', 'met_hilde', 'met_tatie', 'met_seb_nico', 'met_hippolyte')));
  await continueSave(page);
  const left = ['jeremie', 'klaas', 'hilde', 'tatie', 'seb', 'nico', 'hippolyte', 'regis'];
  while (left.length) {
    const r = await qk(page, (sp) => window.qk.toDialogue(sp), left);
    if (r.ended || !r.speaker || !left.includes(r.speaker)) break;
    await settle(page);
    await shot(page, `B3-dialogue-${r.speaker}`);
    left.splice(left.indexOf(r.speaker), 1);
    await qk(page, () => { const c = window.qk.c(); window.qk.advance(c, null); return window.qk.done(c); });
  }
});

// ── C. Nuit ──────────────────────────────────────────────────────────────────
test('C3 témoins : à la fenêtre, 22h30 (chat au balcon), 1h10 (Klaas dort)', async ({ page }) => {
  await startNight(page, `seed=${SEED}`);
  await tickTo(page, hhmm(22, 30));
  await goToWindow(page);
  await shot(page, 'C3-witnesses-2230');
  await tickTo(page, hhmm(25, 10));
  await goToWindow(page);
  await shot(page, 'C3-witnesses-0110');
});

test('C6 samedi : foule, buveurs debout, 23h, depuis la rue', async ({ page }) => {
  await startNight(page, `seed=${SEED}&day=sat`);
  await tickTo(page, hhmm(23, 0));
  await page.evaluate(() => {
    const { player, step } = window.__rdb;
    player.loc = 'street'; player.pos.set(0, 0, -10); player.yaw = 0; player.pitch = -0.05; step(8);
  });
  await shot(page, 'C6-saturday');
});

// ── D. Koddex ────────────────────────────────────────────────────────────────
test('D1 Koddex : le matin du jour 3 (projets perso proposés)', async ({ page }) => {
  await newCampaign(page);
  await qk(page, () => window.qk.to(3, 'koddex'));
  await settle(page);
  await shot(page, 'D1-koddex');
});

// ── F. Les 8 fins (état forcé au J14 : on vérifie l'écran de fin, pas l'accessibilité, couverte par le simulateur) ──
const ENDINGS = [
  { id: 'legal_victory', choice: 0, patch: { stats: { dossier: 85, risk: 10 }, flags: ['ac_violation_confirmed', 'exhaust_meeting_won', 'tatie_emails_shared', 'met_klaas'] } },
  { id: 'negotiated_peace', choice: 4, patch: { stats: { asso: 85 }, hidden: { hostility: 20 }, flags: ['met_hilde', 'hate_wave_answered'] } },
  { id: 'scandal', choice: 5, patch: { flags: ['corruption_proof', 'press_contacted', 'seen_complaisance', 'bribe_photo', 'met_klaas', 'waiter_testimony', 'klaas_log_certified'] } },
  { id: 'custody', choice: 7, patch: { stats: { risk: 95 }, flags: ['custody', 'bucket_witnessed', 'video_viral'] } },
  { id: 'custody-sucree', choice: 7, patch: { stats: { risk: 95 }, flags: ['custody', 'kitchen_sabotaged', 'kitchen_sabotage_caught'] } },
  { id: 'custody-laxative', choice: 7, patch: { stats: { risk: 95 }, flags: ['custody', 'laxative_done', 'laxative_caught'] } },
  { id: 'moving_out', choice: 7, patch: { stats: { sleep: 15, asso: 40 }, flags: [] } },
  { id: 'fired', choice: 7, patch: { stats: { job: 0 }, flags: ['boss_noticed'] } },
  { id: 'turncoat', choice: 6, patch: { stats: { asso: 40 }, flags: ['carbonnade_1', 'carbonnade_2', 'carbonnade_3'] } },
  { id: 'the_return', choice: 0, patch: { stats: { dossier: 85, risk: 10 }, flags: ['bombance_rumour', 'bombance_bar_project', 'knows_trou', 'bombance_wait'] } },
];

test('F1 + F2 les fins : écran de fin et épilogue', async ({ page }) => {
  await newCampaign(page);
  const r = await qk(page, () => window.qk.to(14, 'cards', { card: 'd14_commission' }));
  const base = await page.evaluate(() => localStorage.getItem(window.__rdb.saveKey));
  for (const e of ENDINGS) {
    await page.evaluate(([b, patch]) => {
      localStorage.setItem(window.__rdb.saveKey, b);
      window.qk.patchSave((s) => {
        Object.assign(s.stats, patch.stats ?? {});
        Object.assign(s.hidden, patch.hidden ?? {});
        for (const f of patch.flags ?? []) if (!s.flags.includes(f)) s.flags.push(f);
      });
    }, [base, e.patch]);
    await continueSave(page);
    const btn = page.locator(`[data-testid=card-choice][data-i="${e.choice}"]`);
    if (r.card !== 'd14_commission' || !(await btn.count()) || await btn.isDisabled()) { await shot(page, `F-${e.id}-UNREACHED`); continue; }
    await btn.click();
    for (let i = 0; i < 6 && !(await page.locator('[data-testid=ending]').count()); i++) {
      const next = page.locator('[data-testid=result-next], [data-testid=card-choice]:enabled').first();
      if (await next.count()) await next.click(); else await page.waitForTimeout(500);
    }
    await page.setViewportSize({ width: 1280, height: 2000 });
    await settle(page);
    await shot(page, `F-${e.id}`);
    await page.setViewportSize({ width: 1280, height: 720 });
  }
});

// ── G, I. Texte, aide, performances ──────────────────────────────────────────
test('G3 + I3 texte : Carnet (lieux, règles), aide, à propos', async ({ page }) => {
  await newCampaign(page);
  await qk(page, () => window.qk.to(2, 'actions'));
  await qk(page, () => window.qk.patchSave((s) => s.flags.push('met_klaas', 'met_hippolyte', 'knows_trou', 'legal_view', 'bombance_rumour')));
  await continueSave(page);
  await page.setViewportSize({ width: 1280, height: 2400 });
  await page.click('[data-testid=carnet-open]');
  await page.click('[data-tab=places]');
  await settle(page);
  await shot(page, 'G3-carnet-places');
  await page.click('[data-tab=rules]');
  await settle(page);
  await shot(page, 'G3-carnet-rules');
  await page.click('[data-testid=carnet-close]');
  await page.click('[data-testid=help-open]');
  await settle(page);
  await shot(page, 'I3-help');
});

test('I4 performances : samedi, vue la plus chargée, HUD ?perf=1', async ({ page }) => {
  await startNight(page, `seed=${SEED}&day=sat&perf=1`);
  await tickTo(page, hhmm(22, 45));
  await page.evaluate(() => {
    const { player, step } = window.__rdb;
    player.loc = 'street'; player.pos.set(0, 0, -40); player.yaw = 0; player.pitch = -0.02; step(30);
  });
  await shot(page, 'I4-perf-saturday');
});
