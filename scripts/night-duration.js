// Durée réelle d'une nuit avec l'horloge adaptative (GAME_DESIGN §12c.5) : node scripts/night-duration.js [graines]
// Les bots de campagne jouent leurs 14 jours ; à chaque minute de nuit on lit nightClock (la même que game.js) et on
// additionne le temps réel qu'elle prend. Trois façons de finir la nuit :
//   · éveillé    : Pilou ne se couche pas (plafond ; avant §12c.5, 10 min fixes par nuit)
//   · au conseil : il se couche quand le conseil « au lit » apparaît (bedtimeHint), puis la nuit file à ×40
//   · + passer   : il se couche au conseil et « Passe à demain matin » (le reste de la nuit ne coûte rien)
//   · 23h30 + passer : il se couche à 23h30 quoi qu'il arrive et passe à demain matin (le plancher réaliste)
// Puis la durée des campagnes (qa/fullrun/*.json : temps de jour mesuré) avec ces nuits-là.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createCampaign, normalizeContent, playNight, CAMPAIGN_BOTS, nightClock, busyReason } from '../src/sim/index.js';
import { RULES } from '../src/config.js';
import * as narrative from '../src/sim/narrative.js';

const ROOT = join(import.meta.dirname, '..');
const DIR = join(ROOT, 'src', 'content');
const K = normalizeContent(await Promise.all(readdirSync(DIR).filter((f) => f.endsWith('.js')).map((f) => import(join(DIR, f)))));
const SEEDS = Number(process.argv[2] ?? 6);
const BASE = RULES.gameMinutesPerSecond;
const BED_AT = 23 * 60 + 30;

function measureNight(sim, c) {
  const r = { awake: 0, atHint: 0, skip: 0, early: 0, hintAt: null };
  const tick = sim.tick.bind(sim);
  sim.tick = (dt) => {
    if (!sim.state.ended) {
      const awake = nightClock(sim, c, { sleeping: false }).scale;
      if (r.hintAt === null && c.bedtimeHint(sim, { busy: busyReason(sim, c) })) r.hintAt = sim.state.min;
      r.awake += dt / (BASE * awake);
      r.atHint += dt / (BASE * (r.hintAt === null ? awake : RULES.sleepTimeMultiplier));
      if (r.hintAt === null) r.skip += dt / (BASE * awake);
      if (sim.state.min < BED_AT) r.early += dt / (BASE * awake);
    }
    return tick(dt);
  };
  return r;
}

const stats = {};
for (const [name, mk] of Object.entries(CAMPAIGN_BOTS)) {
  const nights = [];
  for (let seed = 1; seed <= SEEDS; seed++) {
    const bot = mk();
    const c = createCampaign({ seed, content: K, narrative });
    for (let i = 0; i < 5000 && !c.ended; i++) {
      if (c.step === 'cards') { const card = c.card(); const ok = card.choices.filter((x) => x.available); c.resolveCard(card.type === 'event' && ok.length ? bot.choose(c, card, ok) : 0); }
      else if (c.step === 'koddex') c.koddex(bot.morning(c, c.koddexOptions()));
      else if (c.step === 'actions') { const id = bot.afternoon(c, c.availableActions()); if (id) c.doAction(id); else c.endAfternoon(); }
      else if (c.step === 'night') {
        const sim = c.createNight();
        const m = measureNight(sim, c);
        playNight(sim, bot.night(c, sim), c, 1, 10, (card, ok) => bot.choose(c, card, ok));
        nights.push(m);
        c.finishNight(sim);
      } else if (c.step === 'recap') { for (const [feed, items] of Object.entries(c.mediaFeed())) for (const x of items) c.readMedia(feed, x.id); c.nextDay(); }
      if (c.ended && c.state.ending?.canContinue && bot.continueAfterFired?.(c)) c.continueAfterEnding();
    }
  }
  const avg = (k) => nights.reduce((s, n) => s + n[k], 0) / nights.length;
  const hinted = nights.filter((n) => n.hintAt !== null);
  stats[name] = {
    nights: nights.length, awake: avg('awake'), atHint: avg('atHint'), skip: avg('skip'), early: avg('early'),
    hintShare: hinted.length / nights.length,
    hintAt: hinted.length ? hinted.reduce((s, n) => s + n.hintAt, 0) / hinted.length : null,
  };
}

const mmss = (x) => { const s = Math.round(x); return `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')} s`; };
const hhmm = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}h${String(Math.round(m % 60)).padStart(2, '0')}`;
console.log(`| Bot | Nuits | Éveillé (plafond) | Couché au conseil | Au conseil + passer | 23h30 + passer | Conseil vu | Heure moyenne du conseil |`);
console.log('|---|---|---|---|---|---|---|---|');
for (const [name, s] of Object.entries(stats)) {
  console.log(`| ${name} | ${s.nights} | ${mmss(s.awake)} | ${mmss(s.atHint)} | ${mmss(s.skip)} | ${mmss(s.early)} | ${Math.round(s.hintShare * 100)} % | ${s.hintAt ? hhmm(s.hintAt) : '—'} |`);
}
const all = Object.values(stats);
const mean = (k) => all.reduce((s, x) => s + x[k] * x.nights, 0) / all.reduce((s, x) => s + x.nights, 0);
const N = { awake: mean('awake'), atHint: mean('atHint'), skip: mean('skip'), early: mean('early') };
console.log(`\nMoyenne par nuit : éveillé ${mmss(N.awake)} · couché au conseil ${mmss(N.atHint)} · au conseil + passer ${mmss(N.skip)} · 23h30 + passer ${mmss(N.early)} (avant §12c.5 : 10 min 00 s).`);

// Campagnes : temps de jour mesuré par fullrun + nuits recalculées
const FR = join(ROOT, 'qa', 'fullrun');
if (existsSync(FR)) {
  const m = (s) => { const t = Math.round(s / 60); return `${Math.floor(t / 60)}h${String(t % 60).padStart(2, '0')}`; };
  console.log('\n| Style | Fin | Nuits | Jour | Total avant (nuits 10 min) | Éveillé | Couché au conseil | Au conseil + passer | 23h30 + passer |');
  console.log('|---|---|---|---|---|---|---|---|---|');
  for (const f of readdirSync(FR).filter((x) => x.endsWith('.json'))) {
    const r = JSON.parse(readFileSync(join(FR, f), 'utf8'));
    const t = (k) => m(r.daySeconds + r.nights * N[k]);
    console.log(`| ${r.title} | ${r.ending} (jour ${r.lastDay}) | ${r.nights} | ${m(r.daySeconds)} | ${m(r.totalSeconds)} | ${t('awake')} | ${t('atHint')} | ${t('skip')} | ${t('early')} |`);
  }
}
