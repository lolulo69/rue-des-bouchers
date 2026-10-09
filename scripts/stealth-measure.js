#!/usr/bin/env node
// Discrétion jouable (GAME_DESIGN §12d.6, §13.N) : part des actes illégaux de nuit réussis SANS être vus,
// sans aide / juste après une diversion / dans une « fenêtre propice » (si le moteur en expose).
// Cibles : ≥ 30 % avec une diversion ou dans une fenêtre, ≤ 10 % sans.
//   npm run measure:stealth                 (200 graines)
//   npm run measure:stealth -- --runs 500 --write --label "stealth-v2"   → qa/stealth.md
//   npm run measure:stealth -- --set WITNESS.attention.away=0.03      surcharge de config (réglage)
// Protocole, pour chaque graine : une campagne sans 3D jusqu'à la nuit du J3 (jeu passif) ; on y débloque tous les outils
// et on pose les drapeaux exigés par les actes visés (on mesure la discrétion, pas la progression) ; puis pour chaque essai une NUIT
// NEUVE de cette campagne (même état de départ), avancée jusqu'à une heure tirée au hasard où l'acte est faisable, où l'on tente :
//   • l'acte seul ;
//   • chaque diversion disponible, puis l'acte dans la minute qui suit ;
//   • (si sim.windowNow existe) l'acte pendant la première fenêtre propice de la nuit.
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { normalizeContent, makeConfig, createCampaign } from '../src/sim/index.js';
import { createRng } from '../src/sim/rng.js';
import * as narrative from '../src/sim/narrative.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true; };
const RUNS = Number(arg('runs', 200));
const WRITE = !!arg('write', false);
const LABEL = String(arg('label', 'mesure'));
const DAY = Number(arg('day', 3));

// --set A.b=1,C.d=[1,2] : chemins pointés vers des valeurs JSON (comme npm run sim)
const overrides = {};
for (const kv of String(arg('set', '')).split(',').filter((x) => x.includes('='))) {
  const [path, raw] = kv.split('=');
  const keys = path.split('.');
  let o = overrides;
  for (const k of keys.slice(0, -1)) o = o[k] ??= {};
  o[keys.at(-1)] = JSON.parse(raw);
}
const cfg = makeConfig(overrides);
const dir = join(ROOT, 'src/content');
const content = normalizeContent(await Promise.all(readdirSync(dir).filter((f) => f.endsWith('.js')).map((f) => import(join(dir, f)))));
const ACTIONS = Object.fromEntries(content.ACTIONS.map((a) => [a.id, a]));
const DIVERSIONS = content.ACTIONS.filter((a) => a.phase === 'night' && a.diversion).map((a) => a.id);
// Actes illégaux visés : ceux qu'on fait dans la rue / sur la terrasse et qu'on peut rater parce qu'on est vu
const TARGETS = ['night_stink_bomb', 'night_sabotage_chairs', 'night_sabotage_parasols', 'night_sabotage_locks', 'night_cardboard_exhaust']
  .filter((id) => ACTIONS[id]);

function campaignAtNight(seed) {
  const c = createCampaign({ seed, content, cfg, narrative });
  for (let i = 0; i < 4000 && !c.ended && !(c.step === 'night' && c.state.day >= DAY); i++) {
    if (c.step === 'cards') c.resolveCard(c.card().choices.find((x) => x.available)?.i ?? 0);
    else if (c.step === 'koddex') c.koddex(['work', 'work', 'work']);
    else if (c.step === 'actions') c.endAfternoon();
    else if (c.step === 'night') { const sim = c.createNight(); for (let k = 0; !sim.state.ended && k < 3000; k++) sim.tick(1); c.finishNight(sim); }
    else if (c.step === 'recap') c.nextDay();
  }
  if (c.step !== 'night') return null;
  // On mesure la discrétion, pas la progression : tous les outils débloqués, et les drapeaux exigés par les actes visés
  for (const u of content.UNLOCKS ?? []) if (!c.state.unlocked.includes(u.id)) c.state.unlocked.push(u.id);
  for (const id of [...TARGETS, ...DIVERSIONS]) for (const f of ACTIONS[id].requires?.flags ?? []) if (!c.state.flags.includes(f)) c.state.flags.push(f);
  return c;
}

// Une nuit neuve, avancée jusqu'à `min` (les événements de nuit sont résolus au premier choix)
function nightAt(c, min) {
  const save = c.save();
  const cc = createCampaign({ content, cfg, narrative, save });
  const sim = cc.createNight();
  for (let k = 0; sim.state.min < min && !sim.state.ended && k < 3000; k++) {
    for (let ev = cc.nightEventDue?.(sim); ev; ev = cc.nightEventDue(sim)) cc.resolveNightEvent(sim, ev.choices.find((x) => x.available)?.i ?? 0);
    sim.tick(1);
  }
  return { cc, sim };
}
const usable = (cc, sim, id) => cc.nightActions(sim).some((a) => a.id === id);
const unseen = (res) => res && res.ok !== false && !(res.seen ?? []).length;

const tally = { none: [0, 0], noneEarly: [0, 0], noneLate: [0, 0], diversion: [0, 0], window: [0, 0] };
const LATE = 25 * 60; // après 1h : la rue se vide (§12d.4), c'est une fenêtre voulue
const byDiversion = Object.fromEntries(DIVERSIONS.map((d) => [d, [0, 0]]));
const seenBy = { none: {}, diversion: {}, window: {} }; // qui a vu, quand l'essai rate
const noteSeen = (k, res) => { for (const w of res?.seen ?? []) seenBy[k][w.kind ?? w.id] = (seenBy[k][w.kind ?? w.id] ?? 0) + 1; };
const pair = {}; // acte × diversion
const byTargetEarly = Object.fromEntries(TARGETS.map((t) => [t, [0, 0]]));
let skipped = 0, windowsSeen = false;
for (let r = 0; r < RUNS; r++) {
  const seed = 5000 + r;
  const c = campaignAtNight(seed);
  if (!c) { skipped++; continue; }
  const rng = createRng(seed * 31 + 7);
  const target = TARGETS[r % TARGETS.length];
  // Une heure où l'acte est faisable (fenêtre de nightActions.js)
  let at = null;
  for (let tries = 0; tries < 12 && at === null; tries++) {
    const m = Math.round(rng.range(21 * 60, 26 * 60));
    const { cc, sim } = nightAt(c, m);
    if (!sim.state.ended && usable(cc, sim, target)) at = m;
  }
  if (at === null) { skipped++; continue; }
  // 1) sans aide
  {
    const { cc, sim } = nightAt(c, at); const res = cc.doNightAction(sim, target); const k = at >= LATE ? 'noneLate' : 'noneEarly';
    tally.none[1]++; tally[k][1]++; if (at < LATE) { byTargetEarly[target][1]++; noteSeen('none', res); }
    if (unseen(res)) { tally.none[0]++; tally[k][0]++; if (at < LATE) byTargetEarly[target][0]++; }
  }
  // 2) juste après chaque diversion disponible à cette heure
  for (const d of DIVERSIONS) {
    const { cc, sim } = nightAt(c, at);
    if (!usable(cc, sim, d)) continue;
    cc.doNightAction(sim, d);
    sim.tick(0.5);
    if (!usable(cc, sim, target)) continue;
    const res = cc.doNightAction(sim, target);
    tally.diversion[1]++; byDiversion[d][1]++; noteSeen('diversion', res);
    const pk = `${target}|${d}`; pair[pk] ??= [0, 0]; pair[pk][1]++; if (unseen(res)) pair[pk][0]++;
    if (unseen(res)) { tally.diversion[0]++; byDiversion[d][0]++; }
  }
  // 3) dans une fenêtre propice (si le moteur l'expose : sim.windowNow() → { id, until } | null)
  {
    const { cc, sim } = nightAt(c, 21 * 60);
    // Fenêtre du twist ouverte (attention détournée, source 'window', stealth-v2 fa0dce5)
    const windowNow = () => (sim.state.attention ?? []).some((a) => a.source === 'window' && sim.state.min >= a.from && sim.state.min < a.until);
    if (Array.isArray(sim.state.twistWindows) && sim.state.twistWindows.length) {
      for (let k = 0; !sim.state.ended && k < 400 && !windowNow(); k++) {
        for (let ev = cc.nightEventDue?.(sim); ev; ev = cc.nightEventDue(sim)) cc.resolveNightEvent(sim, 0);
        sim.tick(0.5);
      }
      if (windowNow() && usable(cc, sim, target)) {
        windowsSeen = true;
        const res = cc.doNightAction(sim, target);
        tally.window[1]++; noteSeen('window', res); if (unseen(res)) tally.window[0]++;
      }
    }
  }
}

const pct = ([a, n]) => (n ? `${Math.round((a / n) * 100)} %` : '–');
const rate = ([a, n]) => (n ? a / n : NaN);
const okNone = rate(tally.noneEarly) <= 0.1, okDiv = rate(tally.diversion) >= 0.3;
let sha = 'inconnu';
try { sha = execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch { /* hors git */ }
const section = `## ${LABEL} · ${new Date().toISOString().slice(0, 10)} · main @ ${sha}

${RUNS} graines (${skipped} sans essai possible), nuit du J${DAY}, actes visés : ${TARGETS.join(', ')}.

| Situation | Essais | Réussis sans être vu | Cible |
|---|---|---|---|
| Sans aide, avant 1h (rue pleine) | ${tally.noneEarly[1]} | ${pct(tally.noneEarly)} | ${okNone ? '✅' : '❌'} ≤ 10 % |
| Sans aide, après 1h (la rue s’est vidée : fenêtre voulue, §12d.4) | ${tally.noneLate[1]} | ${pct(tally.noneLate)} | (pas de cible) |
| Juste après une diversion | ${tally.diversion[1]} | ${pct(tally.diversion)} | ${okDiv ? '✅' : '❌'} ≥ 30 % |
| Dans une fenêtre propice | ${tally.window[1]} | ${pct(tally.window)} | ${windowsSeen ? (rate(tally.window) >= 0.3 ? '✅' : '❌') : '–'} ≥ 30 % ${windowsSeen ? '' : '(aucune nuit avec une fenêtre de twist utilisable)'} |

Sans aide avant 1h, par acte : ${TARGETS.map((t) => `${t.replace('night_', '')} ${pct(byTargetEarly[t])} (${byTargetEarly[t][1]})`).join(' · ')}

Qui voit quand c'est raté (nombre d'essais) : ${Object.entries(seenBy).map(([k, o]) => `${k} → ${Object.entries(o).sort((a, b) => b[1] - a[1]).map(([w, n]) => `${w} ${n}`).join(', ') || '–'}`).join(' · ')}

Acte × diversion :\n${TARGETS.map((t) => `  ${t.replace('night_', '').padEnd(18)} ${DIVERSIONS.map((d) => `${d.replace('night_', '')} ${pct(pair[`${t}|${d}`] ?? [0, 0])}`).join(' · ')}`).join('\n')}

Par diversion : ${DIVERSIONS.map((d) => `${d.replace('night_', '')} ${pct(byDiversion[d])} (${byDiversion[d][1]})`).join(' · ')}
`;
console.log(section);
if (WRITE) {
  const file = join(ROOT, 'qa/stealth.md');
  const head = `# Discrétion jouable (§12d.6, §13.N)

Généré par \`scripts/stealth-measure.js\` (\`npm run measure:stealth -- --write --label "…"\`). Une section par passage, la plus récente en haut.
Un essai est **réussi** quand l'acte illégal visé n'est vu par personne (\`doNightAction(...).seen\` vide). La diversion est jouée juste avant
l'acte (½ minute de jeu). Chaque essai repart d'une nuit neuve de la même campagne.

`;
  let body = existsSync(file) ? readFileSync(file, 'utf8') : head;
  const marker = `## ${LABEL} ·`;
  const s = body.indexOf(marker);
  if (s >= 0) { const n = body.indexOf('\n## ', s + 1); body = body.slice(0, s) + section + (n >= 0 ? body.slice(n + 1) : ''); }
  else { const f = body.indexOf('\n## '); body = f >= 0 ? `${body.slice(0, f + 1)}${section}\n${body.slice(f + 1)}` : `${body}${section}`; }
  writeFileSync(file, body);
  console.log('→ qa/stealth.md');
}
