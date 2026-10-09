#!/usr/bin/env node
// Audit de répétition (GAME_DESIGN §12b, §13.J) : sur N campagnes par bot, mesure pour chaque nuit
//   • le temps mort : secondes RÉELLES passées dans des silences de plus de 30 s (aucune ligne de journal, aucun
//     événement de nuit, aucune arrivée de police, aucun moment de twist, aucune entrée du journal du moteur) ;
//   • le nombre de situations distinctes (gabarits de lignes + types d'événements du moteur) ;
//   • la similarité avec la nuit précédente (Jaccard des ensembles de situations) ;
// et pour chaque campagne les lignes les plus répétées.
//   npm run audit:fun                         (20 campagnes par bot)
//   npm run audit:fun -- --runs 50 --bots legal,mixed
//   npm run audit:fun -- --write --label "baseline v1.0"   ajoute/remplace la section dans qa/fun-audit.md
// Cibles v1.1 : temps mort moyen < 90 s par nuit ; aucune paire de nuits consécutives avec une similarité > 0,7.
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { normalizeContent, makeConfig, createCampaign, CAMPAIGN_BOTS } from '../src/sim/index.js';
import { createRng } from '../src/sim/rng.js';
import * as narrative from '../src/sim/narrative.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true; };
const RUNS = Number(arg('runs', 20));
const BOTS = String(arg('bots', Object.keys(CAMPAIGN_BOTS).join(','))).split(',');
const WRITE = !!arg('write', false);
const LABEL = String(arg('label', 'mesure'));
const QUIET_S = 30; // un silence plus long que ça compte comme temps mort (en entier)
const TARGET_DEAD_S = 90;
const TARGET_SIM = 0.7;
const TARGET_LPM = 6; // ~1 ligne visible toutes les 10 s réelles, en moyenne sur la nuit

const cfg = makeConfig();
const REAL_S_PER_GAME_MIN = 1 / cfg.RULES.gameMinutesPerSecond; // 1 min de jeu = 2 s réelles
const dir = join(ROOT, 'src/content');
const content = normalizeContent(await Promise.all(readdirSync(dir).filter((f) => f.endsWith('.js')).map((f) => import(join(dir, f)))));

// Une ligne de journal → son gabarit (« situation ») : sans heures, nombres, guillemets ni noms de tables
const template = (t) => t.replace(/\d+[h:]\d+/g, '#h').replace(/\d+([.,]\d+)?/g, '#').replace(/«[^»]*»/g, '«…»')
  .replace(/table #/g, 'table').split(/\s+/).slice(0, 6).join(' ');
const jaccard = (a, b) => { const u = new Set([...a, ...b]); let i = 0; for (const x of a) if (b.has(x)) i++; return u.size ? i / u.size : 1; };

// La narration de la nuit comme dans le jeu (src/game.js › narrator) : sans elle, la sim retombe sur ses lignes de repli
function gameNarrator(c, seed) {
  const narrRng = createRng(((seed * 7919 + c.state.day) ^ 0x5bd1e995) >>> 0);
  return (kind, s, a) => {
    switch (kind) {
      case 'police': return narrative.policeLine(a.outcome, a.patrolId, { ...narrative.nightCtx.police(s, a.entry ?? {}), asso: !!a.asso }, narrRng, s);
      case 'waiter': return narrative.pickNightLine('waiter', s, narrRng, { result: a.result, metWaiter: c.has('met_waiter') && s.waiterId === 'theo' });
      case 'witness': return narrative.pickNightLine('witness', s, narrRng, a.witness ? { witness: a.witness } : {});
      case 'end': return narrative.pickNightLine('end', s, narrRng, { reason: a.reason });
      case 'klaas': { const e = narrative.klaasEntry(a.event, a.detection, narrRng); return e ? `📓 Carnet de Klaas : ${e.text}` : null; }
      default: return null;
    }
  };
}

// Joue la nuit comme campaignRunner.playNight, mais garde chaque « moment » horodaté avant que les événements soient vidés
function playNightAudited(sim, policy, c, choose) {
  const moments = []; // { min, key, text }
  let nextContent = -Infinity;
  const take = () => {
    for (const e of sim.events) if (e.type === 'log' && e.text) moments.push({ min: e.min ?? sim.state.min, key: `log:${template(e.text)}`, text: e.text, visible: true, ambient: e.cls === 'ambient' });
    sim.events.length = 0;
  };
  while (!sim.state.ended) {
    if (policy) {
      for (const a of policy.decide(sim)) { sim.act(a); if (sim.state.ended) break; }
      if (c && policy.content && !sim.state.ended && sim.state.min >= nextContent) {
        nextContent = sim.state.min + 10;
        for (const id of policy.content(sim, c)) c.doNightAction(sim, id);
      }
    }
    for (let ev = c?.nightEventDue?.(sim); ev; ev = c.nightEventDue(sim)) {
      moments.push({ min: sim.state.min, key: `event:${ev.id}`, text: ev.data?.title ?? ev.id, visible: true });
      const ok = ev.choices.filter((x) => x.available);
      c.resolveNightEvent(sim, ok.length ? choose(ev, ok) : 0);
    }
    take();
    sim.tick(1);
    take();
  }
  for (const j of sim.state.journal) if (j.type !== 'end') moments.push({ min: j.t, key: `sim:${j.type}`, text: null });
  return moments;
}

function nightStats(moments, start, end) {
  const times = [start, ...moments.map((m) => m.min).filter((t) => t >= start && t <= end).sort((a, b) => a - b), end];
  let dead = 0;
  for (let i = 1; i < times.length; i++) {
    const gapS = (times[i] - times[i - 1]) * REAL_S_PER_GAME_MIN;
    if (gapS > QUIET_S) dead += gapS;
  }
  // Débit du journal (anti-spam) : lignes visibles par minute réelle, pic sur une minute réelle glissante, ambiances d'affilée
  const vis = moments.filter((m) => m.visible).sort((a, b) => a.min - b.min);
  const realMin = ((end - start) * REAL_S_PER_GAME_MIN) / 60;
  const win = 60 / REAL_S_PER_GAME_MIN; // une minute réelle, en minutes de jeu
  let peak = 0;
  for (let i = 0, j = 0; i < vis.length; i++) { while (vis[i].min - vis[j].min >= win) j++; peak = Math.max(peak, i - j + 1); }
  let run = 0, triples = 0;
  for (const m of vis) { run = m.ambient ? run + 1 : 0; if (run === 3) triples++; }
  return { dead, situations: new Set(moments.map((m) => m.key)), lpm: realMin ? vis.length / realMin : 0, peak, triples };
}

function auditCampaign(seed, botName) {
  const bot = CAMPAIGN_BOTS[botName](); // fabrique : un bot neuf par campagne
  const c = createCampaign({ seed, content, cfg, narrative });
  const nights = [];
  const lines = new Map();
  for (let i = 0; i < 5000 && !c.ended; i++) {
    switch (c.step) {
      case 'cards': {
        const card = c.card();
        const ok = card.choices.filter((ch) => ch.available);
        c.resolveCard(card.type === 'event' && ok.length ? bot.choose(c, card, ok) : 0);
        break;
      }
      case 'koddex': c.koddex(bot.morning(c, c.koddexOptions())); break;
      case 'actions': { const id = bot.afternoon(c, c.availableActions()); if (id) c.doAction(id); else c.endAfternoon(); break; }
      case 'night': {
        const twist = (c.twistTonight ?? c.tonightTwist)?.()?.id ?? null; // v1.1 : c.twistTonight() (moteur), lu avant la nuit
        const sim = c.createNight({ narrator: gameNarrator(c, seed) });
        const start = sim.state.min;
        const moments = playNightAudited(sim, bot.night(c, sim), c, (card, ok) => bot.choose(c, card, ok));
        const end = sim.state.min;
        nights.push({ day: c.state.day, twist, ...nightStats(moments, start, end), minutes: end - start });
        for (const m of moments) if (m.text) lines.set(m.text, (lines.get(m.text) ?? 0) + 1);
        c.finishNight(sim);
        break;
      }
      case 'recap':
        // comme campaignRunner : le bot lit son téléphone en fin de journée (effets des messages)
        for (const [feed, items] of Object.entries(c.mediaFeed?.() ?? {})) for (const m of items) c.readMedia(feed, m.id);
        c.nextDay();
        break;
      default: throw new Error(`étape inconnue ${c.step}`);
    }
    if (c.ended && c.state.ending?.canContinue && bot.continueAfterFired?.(c)) c.continueAfterEnding();
  }
  const sims = nights.slice(1).map((n, i) => jaccard(nights[i].situations, n.situations));
  return { nights, sims, lines, ending: c.state.ending?.id ?? 'none' };
}

// ── Mesure ──────────────────────────────────────────────────────────────────
const fmtS = (s) => `${Math.round(s)} s`;
const pct = (x) => `${Math.round(x * 100)} %`;
const rows = [];
const topLines = new Map();
for (const botName of BOTS) {
  if (!CAMPAIGN_BOTS[botName]) { console.error(`bot inconnu : ${botName}`); process.exit(2); }
  let nN = 0, deadSum = 0, sitSum = 0, simSum = 0, simN = 0, simMax = 0, over = 0, pairs = 0, overDead = 0, lpmSum = 0, peakMax = 0, triples = 0;
  const twists = new Set();
  for (let r = 0; r < RUNS; r++) {
    const a = auditCampaign(1000 + r, botName);
    for (const n of a.nights) { nN++; deadSum += n.dead; sitSum += n.situations.size; if (n.dead > TARGET_DEAD_S) overDead++; if (n.twist) twists.add(n.twist); lpmSum += n.lpm; peakMax = Math.max(peakMax, n.peak); triples += n.triples; }
    for (const s of a.sims) { simSum += s; simN++; simMax = Math.max(simMax, s); pairs++; if (s > TARGET_SIM) over++; }
    for (const [t, k] of a.lines) if (k > 1) topLines.set(t, (topLines.get(t) ?? 0) + k);
  }
  rows.push({
    bot: botName, nights: nN, dead: deadSum / nN, overDead: overDead / nN, situations: sitSum / nN,
    sim: simN ? simSum / simN : 0, simMax, over, pairs, twists: twists.size, lpm: lpmSum / nN, peak: peakMax, triples,
  });
}
const worst = [...topLines].sort((a, b) => b[1] - a[1]).slice(0, 12);

// ── Rapport ─────────────────────────────────────────────────────────────────
let sha = 'inconnu';
try { sha = execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch { /* hors git */ }
const ok = (b, t) => (b ? `✅ ${t}` : `❌ ${t}`);
const table = [
  '| Bot | Nuits | Temps mort moyen / nuit | Nuits > 90 s | Situations distinctes / nuit | Similarité moyenne (nuits consécutives) | Similarité max | Paires > 0,7 | Twists distincts | Lignes / min réelle | Pic sur 1 min | 3 ambiances d’affilée |',
  '|---|---|---|---|---|---|---|---|---|---|---|---|',
  ...rows.map((r) => `| ${r.bot} | ${r.nights} | ${fmtS(r.dead)} | ${pct(r.overDead)} | ${r.situations.toFixed(1)} | ${r.sim.toFixed(2)} | ${r.simMax.toFixed(2)} | ${r.over}/${r.pairs} | ${r.twists} | ${r.lpm.toFixed(1)} | ${r.peak} | ${r.triples} |`),
].join('\n');
const allDead = rows.reduce((s, r) => s + r.dead * r.nights, 0) / rows.reduce((s, r) => s + r.nights, 0);
const allOver = rows.reduce((s, r) => s + r.over, 0);
const allLpm = rows.reduce((s, r) => s + r.lpm * r.nights, 0) / rows.reduce((s, r) => s + r.nights, 0);
const allTriples = rows.reduce((s, r) => s + r.triples, 0);
const section = `## ${LABEL} · ${new Date().toISOString().slice(0, 10)} · main @ ${sha}

${RUNS} campagnes par bot (graines 1000…${999 + RUNS}).

${table}

- Cible v1.1 temps mort : ${ok(allDead < TARGET_DEAD_S, `${fmtS(allDead)} en moyenne (cible < ${TARGET_DEAD_S} s)`)}
- Cible v1.1 similarité : ${ok(allOver === 0, `${allOver} paire(s) de nuits consécutives au-dessus de ${TARGET_SIM} (cible : 0)`)}
- Anti-spam : ${ok(allLpm <= TARGET_LPM && allTriples === 0, `${allLpm.toFixed(1)} lignes par minute réelle en moyenne (cible ≤ ${TARGET_LPM}, soit ~1 ligne / 10 s) ; ${allTriples} fois 3 ambiances d’affilée (cible : 0)`)}

Lignes les plus répétées (lignes vues au moins 2 fois dans une même campagne ; total de leurs occurrences sur ce passage) :
${worst.map(([t, k]) => `- ${k} × « ${t.length > 140 ? `${t.slice(0, 140)}…` : t} »`).join('\n')}
`;
console.log(section);

if (WRITE) {
  const file = join(ROOT, 'qa/fun-audit.md');
  const head = `# Audit de répétition (§12b, §13.J)

Généré par \`scripts/fun-audit.js\` (\`npm run audit:fun -- --write --label "…"\`). Une section par passage ; la plus récente en haut.

**Définitions.** Un *moment* = une ligne du journal de nuit (narration, tuyau, police, témoins, raclements…), un événement de nuit,
ou une entrée du journal du moteur (évacuation d'une table, pièce au dossier, appel, arrivée de police…). Le **temps mort** d'une nuit
est la somme des silences de plus de ${QUIET_S} s réelles entre deux moments (1 min de jeu = ${REAL_S_PER_GAME_MIN} s réelles ; une nuit ≈ ${Math.round(((cfg.RULES.nightEnd - cfg.RULES.nightStart) * REAL_S_PER_GAME_MIN) / 60)} min réelles).
Une *situation* = le gabarit d'une ligne (sans heures ni nombres) ou un type d'événement ; la **similarité** de deux nuits consécutives
est l'indice de Jaccard de leurs ensembles de situations. Les bots sont ceux du simulateur (\`src/sim/campaignBots.js\`).

`;
  let body = existsSync(file) ? readFileSync(file, 'utf8') : head;
  if (!body.startsWith('# Audit de répétition')) body = head;
  const marker = `## ${LABEL} ·`;
  const start = body.indexOf(marker);
  if (start >= 0) {
    const next = body.indexOf('\n## ', start + 1);
    body = body.slice(0, start) + section + (next >= 0 ? body.slice(next + 1) : '');
  } else {
    const first = body.indexOf('\n## ');
    body = first >= 0 ? `${body.slice(0, first + 1)}${section}\n${body.slice(first + 1)}` : `${body}${section}`;
  }
  writeFileSync(file, body);
  console.log(`→ qa/fun-audit.md (${LABEL})`);
}
