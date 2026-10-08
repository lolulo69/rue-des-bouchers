#!/usr/bin/env node
// Simulateur de campagne (§13.H) : joue N campagnes par bot de stratégie, imprime la distribution des fins,
// vérifie les cibles et les invariants, et liste le contenu jamais atteint.
//   npm run sim -- --runs 1000            (défaut 200)
//   npm run sim -- --runs 1000 --write    ajoute le tableau à qa/balance.md
//   npm run sim -- --strict               code de sortie 1 si une cible n'est pas atteinte
//   npm run sim -- --fixture              contenu de test au lieu de src/content
//   npm run sim -- --bots legal,reckless
import { readdirSync, existsSync, appendFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { normalizeContent, runCampaign, CAMPAIGN_BOTS, TARGETS, ENDING_SCORE, checkCampaignInvariants } from '../src/sim/index.js';
import * as fixture from '../tests/fixtures/content.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true; };
const RUNS = Number(arg('runs', 200));
const WRITE = !!arg('write', false);
const STRICT = !!arg('strict', false);
const FIXTURE = !!arg('fixture', false);
const BOTS = String(arg('bots', Object.keys(CAMPAIGN_BOTS).join(','))).split(',');

// Contenu : src/content, complété par le contenu de test pour les collections encore vides (signalé)
async function loadContent() {
  const fx = normalizeContent(fixture);
  if (FIXTURE) return { K: fx, filled: ['tout (--fixture)'] };
  const dir = join(ROOT, 'src', 'content');
  const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.js')) : [];
  const K = normalizeContent(await Promise.all(files.map((f) => import(join(dir, f)))));
  const filled = [];
  for (const k of ['DIALOGUE', 'EVENTS', 'ACTIONS', 'COUNTERMOVES', 'ENDINGS']) if (!K[k].length) { K[k] = fx[k]; filled.push(k); }
  if (!K.KODDEX.sideProjects.length) { K.KODDEX = fx.KODDEX; filled.push('KODDEX'); }
  if (filled.length) Object.assign(K.FLAGS, fx.FLAGS);
  return { K, filled };
}

const pct = (x) => `${Math.round(x * 100)}%`;
const { K, filled } = await loadContent();
const t0 = performance.now();
const results = {};
const used = { actions: new Set(), events: new Set(), endings: new Set(), countermoves: new Set(), dialogue: new Set() };
let invariantErrors = [];
for (const name of BOTS) {
  const make = CAMPAIGN_BOTS[name];
  if (!make) throw new Error(`bot inconnu : ${name}`);
  const ends = {};
  const acc = { sleep: 0, asso: 0, risk: 0, job: 0, dossier: 0, score: 0, earlyDay: [], custodyDay: [] };
  for (let seed = 1; seed <= RUNS; seed++) {
    const { c, nightErrors } = runCampaign({ seed, content: K, bot: make() });
    const S = c.state;
    const id = S.ending?.id ?? 'none';
    ends[id] = (ends[id] ?? 0) + 1;
    for (const k of ['sleep', 'asso', 'risk', 'job', 'dossier']) acc[k] += S.stats[k];
    acc.score += ENDING_SCORE[id] ?? 0;
    if (S.ending?.early) acc.earlyDay.push(S.ending.day);
    if (id === 'custody') acc.custodyDay.push(S.ending.day);
    for (const k of Object.keys(used)) for (const x of Object.keys(S.counts[k] ?? {})) used[k].add(x);
    used.endings.add(id);
    const errs = [...nightErrors, ...checkCampaignInvariants(c)];
    if (errs.length) invariantErrors.push(...errs.slice(0, 3).map((e) => `${name}#${seed} ${e}`));
  }
  const dist = Object.fromEntries(Object.entries(ends).map(([k, v]) => [k, v / RUNS]));
  const avg = (k) => Math.round(acc[k] / RUNS);
  const median = (a) => (a.length ? [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)] : null);
  results[name] = { dist, score: acc.score / RUNS, avg: { sleep: avg('sleep'), asso: avg('asso'), risk: avg('risk'), job: avg('job'), dossier: avg('dossier') }, custodyDay: median(acc.custodyDay) };
}
for (const name of BOTS) {
  results[name].targets = (TARGETS[name] ?? []).map((t) => ({ label: t.label, ok: t.ok(results[name].dist, results, name) }));
}
const secs = ((performance.now() - t0) / 1000).toFixed(1);

// ---------- sortie ----------
const endings = [...new Set(BOTS.flatMap((b) => Object.keys(results[b].dist)))].sort();
const lines = [];
lines.push(`| bot | ${endings.join(' | ')} | score | sommeil | asso | risque | job | dossier | garde à vue (nuit méd.) | cibles §13.H |`);
lines.push(`|---|${endings.map(() => '---').join('|')}|---|---|---|---|---|---|---|---|`);
for (const name of BOTS) {
  const r = results[name];
  const tg = r.targets.map((t) => `${t.ok ? '✅' : '❌'} ${t.label}`).join('<br>') || '–';
  lines.push(`| ${CAMPAIGN_BOTS[name]().name} | ${endings.map((e) => (r.dist[e] ? pct(r.dist[e]) : '·')).join(' | ')} | ${Math.round(r.score)} | ${r.avg.sleep} | ${r.avg.asso} | ${r.avg.risk} | ${r.avg.job} | ${r.avg.dossier} | ${r.custodyDay ?? '–'} | ${tg} |`);
}
const unreached = {
  actions: K.ACTIONS.map((a) => a.id).filter((id) => !used.actions.has(id)),
  events: K.EVENTS.map((e) => e.id).filter((id) => !used.events.has(id)),
  endings: K.ENDINGS.map((e) => e.id).filter((id) => !used.endings.has(id)),
  countermoves: K.COUNTERMOVES.map((m) => m.id).filter((id) => !used.countermoves.has(id)),
  dialogue: K.DIALOGUE.map((d) => d.id).filter((id) => !used.dialogue.has(id)),
};
const table = lines.join('\n');
console.log(`\n${RUNS} campagnes × ${BOTS.length} bots en ${secs} s${filled.length ? ` · contenu de test pour : ${filled.join(', ')}` : ''}\n`);
console.log(table);
console.log('\nJamais atteint :');
for (const [k, ids] of Object.entries(unreached)) console.log(`  ${k} (${ids.length}/${(k === 'actions' ? K.ACTIONS : k === 'events' ? K.EVENTS : k === 'endings' ? K.ENDINGS : k === 'countermoves' ? K.COUNTERMOVES : K.DIALOGUE).length}) : ${ids.slice(0, 25).join(', ')}${ids.length > 25 ? '…' : ''}`);
console.log(`\nInvariants : ${invariantErrors.length ? `❌ ${invariantErrors.length} violation(s)\n  ${invariantErrors.slice(0, 10).join('\n  ')}` : '✅ aucune violation'}`);

if (WRITE) {
  let commit = '?';
  try { commit = execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch { /* hors git */ }
  const date = new Date().toISOString().slice(0, 10);
  appendFileSync(join(ROOT, 'qa', 'balance.md'), `\n## ${date} · campagne · commit ${commit} (npm run sim)\n${RUNS} campagnes de 14 jours par bot, graines 1–${RUNS}.${filled.length ? ` Contenu de test pour : ${filled.join(', ')}.` : ''}\n\n${table}\n\nJamais atteint : ${Object.entries(unreached).map(([k, ids]) => `${k} ${ids.length}`).join(', ')}. Invariants : ${invariantErrors.length ? `${invariantErrors.length} violation(s)` : 'OK'}.\n`);
  console.log('\n→ ajouté à qa/balance.md');
}
const failedTargets = BOTS.flatMap((b) => results[b].targets.filter((t) => !t.ok));
if (invariantErrors.length || (STRICT && failedTargets.length)) process.exit(1);
