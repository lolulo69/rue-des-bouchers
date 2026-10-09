#!/usr/bin/env node
// Vérificateur texte ↔ état (GAME_DESIGN §13.L) : joue N campagnes seedées × les bots, enregistre chaque ligne de nuit
// affichée avec un instantané de l'état juste avant et juste après, et signale les contradictions :
//   • heuristiques sur la formulation (« en terrasse », « rentrent », « 22h », « pluie », « serveur », « patrouille »,
//     « Klaas », « Biloute », « gaine », « chat », « debout »…) ;
//   • gardes d'état (`state`) qui ne tiennent pas au moment de l'affichage.
// Une ligne passe si l'un des deux instantanés (avant / après le pas) lui donne raison (une table rentrée pendant le pas…).
// Écrit qa/coherence-state.md. Sortie 1 si --strict et au moins une contradiction.
//   npm run check:coherence -- [--runs 200] [--bots legal,reckless] [--strict] [--quiet] [--no-write]
import { readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeContent, createCampaign, CAMPAIGN_BOTS } from '../src/sim/index.js';
import { createRng } from '../src/sim/rng.js';
import { fmt } from '../src/sim/time.js';
import * as narrative from '../src/sim/narrative.js';
import { nightSnapshot } from '../src/sim/stateGuard.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true; };
const RUNS = Number(arg('runs', 200));
const BOTS = String(arg('bots', Object.keys(CAMPAIGN_BOTS).join(','))).split(',');
const STRICT = !!arg('strict', false);
const QUIET = !!arg('quiet', false);
const WRITE = !arg('no-write', false);
const dir = join(ROOT, 'src', 'content');
const K = normalizeContent(await Promise.all(readdirSync(dir).filter((f) => f.endsWith('.js')).map((f) => import(join(dir, f)))));

// ── Heuristiques : (texte en minuscules, catégorie, instantané) → la ligne colle-t-elle ? ──────────────────────
const NEG = /\b(vide|vides|rangée|rangé|rentrée|rentrées|personne n|plus personne|plus une table|aucune table|rien dehors)\b/;
const RULES = [
  { id: 'terrasse', why: 'parle de clients en terrasse alors que personne n’est dehors',
    test: (t, cat) => cat === 'bark' || (/\ben terrasse\b|\battablé|\btrinqu|\bencore une tournée\b|\bverre levé\b/.test(t) && !NEG.test(t)),
    ok: (s) => s.customers > 0 },
  { id: 'rentrer', why: 'dit que des tables rentrent alors qu’aucune n’est dehors',
    test: (t, cat) => cat !== 'bell' && /\b(rentre|rentrent|rangent|range)\b[^.]*\b(table|tables|terrasse|chaises)\b|raclement/.test(t) && !/ressort|pas encore|ne (rentre|range)/.test(t), // la cloche de 22h05 lit déjà l’état
    // une table de la rue rentrait, ou c'est la table d'un accessoire du twist (la fête des voisins) qui part à son heure
    ok: (s, pre, r) => pre.tablesOut > 0 || r.clearedNear || pre.props?.includes('trestle_table') },
  { id: 'ressortir', why: 'dit que des tables ressortent alors qu’aucune n’est dehors', test: (t) => /\bressort(ent)?\b/.test(t) && !/ne ressort/.test(t), ok: (s) => s.tablesOut > 0 },
  { id: 'apres22', why: 'parle de l’après-22h avant 22h', test: (t) => /encore dehors à|toujours dehors|il est 22h\d|après 22 ?h/.test(t), ok: (s) => s.min >= 22 * 60 },
  { id: 'avant22', why: 'parle de l’avant-22h après 22h', test: (t) => /pas encore 22 ?h|avant (la cloche|22 ?h)/.test(t), ok: (s) => s.min < 22 * 60 + 10 },
  { id: 'pluie', why: 'parle de pluie par temps sec', test: (t) => /\b(il pleut|la pluie|sous la pluie|drache|averse|pavés mouillés)\b/.test(t) && !/annonc|si (il|la)|comme une drache/.test(t), ok: (s) => s.rain },
  { id: 'serveur', why: 'met en scène le serveur alors qu’il n’est plus là', test: (t, cat) => cat !== 'waiter' && /\b(le serveur|théo)\b/.test(t) && !/parti|vacances|plus de serveur|est rentré|train/.test(t), ok: (s) => s.present.serveur },
  { id: 'patrouille', why: 'parle de la patrouille alors qu’elle n’est pas dans la rue', test: (t, cat) => ['bark', 'ambient', 'twist'].includes(cat) && /\b(patrouille|les flics|uniforme|la police (passe|est là))\b/.test(t), ok: (s) => s.present.patrouille },
  { id: 'klaas', why: 'Klaas note alors qu’il dort', test: (t) => /carnet de klaas/.test(t) && !/01h00|je vais dormir|fin de veille|pose le crayon/.test(t), ok: (s) => s.present.klaas },
  { id: 'biloute', why: 'parle de la ronde de Biloute hors de la ronde', test: (t, cat) => cat !== 'twist' && /ronde (de|du|avec)|la ronde\b|passe avec le teckel|biloute (renifle|aboie|s’arrête)/.test(t) && !/fugu|disparu|retrouvé|échappé|pas de ronde|porte de jérémie|plancher/.test(t), ok: (s) => s.present.biloute },
  { id: 'gaine', why: 'parle de la gaine qui tourne alors qu’elle est arrêtée', test: (t, cat) => ['bark', 'ambient', 'twist'].includes(cat) && /\b(la gaine (ronronne|souffle|tourne)|ça sent la frite|odeur de friture)\b/.test(t), ok: (s) => s.exhaust },
  { id: 'chat', why: 'parle du chat au balcon alors qu’il est rentré', test: (t) => /\b(gaufre|le chat|la chatte)\b/.test(t) && !/rentr/.test(t), ok: (s) => s.present.chat },
  { id: 'debout', why: 'parle de buveurs debout alors qu’il n’y en a pas', test: (t, cat) => cat !== 'twist' && /\b(buveurs debout|on boit debout|groupes debout)\b/.test(t), ok: (s) => s.present.debout },
];

// ── Une nuit jouée comme dans game.js, en enregistrant chaque ligne ─────────────────────────────────────────
function playRecorded(c, bot, seed, rec) {
  const narrRng = createRng((seed * 7919 + c.state.day) >>> 0);
  const narrator = (kind, s, a) => {
    switch (kind) {
      case 'police': return narrative.policeLine(a.outcome, a.patrolId, { ...narrative.nightCtx.police(s, a.entry ?? {}), asso: !!a.asso }, narrRng, s);
      case 'waiter': return narrative.pickNightLine('waiter', s, narrRng, { result: a.result, metWaiter: c.has('met_waiter') });
      case 'witness': return narrative.pickNightLine('witness', s, narrRng, a.witness ? { witness: a.witness } : {});
      case 'end': return narrative.pickNightLine('end', s, narrRng, { reason: a.reason });
      case 'klaas': { const e = narrative.klaasEntry(a.event, a.detection, narrRng); return e ? `📓 Carnet de Klaas : ${e.text}` : null; }
      default: return null;
    }
  };
  const sim = c.createNight({ narrator });
  const policy = bot.night(c, sim);
  const day = c.state.day;
  const twist = sim.twist?.id ?? null;
  const emit = (text, cat, pre, post, at = post.min) => {
    if (!text) return;
    // une action de nuit longue fait tourner la sim minute par minute : ses lignes sont relevées après coup, on les juge à leur heure
    const J = sim.state.journal;
    let clearedNear = false;
    for (let i = J.length - 1; i >= 0 && J[i].t >= at - 5; i--) if (J[i].type === 'table-clear' && J[i].t <= at) { clearedNear = true; break; }
    rec.push({ text, cat, day, twist, min: at, pre, post, clearedNear });
  };
  const now = () => nightSnapshot(sim);
  const CLOSE = sim.cfg.RULES.terraceCloseHour * 60;
  const bell = {};
  let nextContent = -Infinity, nextBark = sim.state.min + 10;
  while (!sim.state.ended) {
    const pre = now();
    for (const a of policy.decide(sim)) { sim.act(a); if (sim.state.ended) break; }
    if (!sim.state.ended && policy.content && sim.state.min >= nextContent) {
      nextContent = sim.state.min + 10;
      for (const id of policy.content(sim, c)) c.doNightAction(sim, id);
    }
    for (let ev = c.nightEventDue(sim); ev; ev = c.nightEventDue(sim)) {
      const ok = ev.choices.filter((x) => x.available);
      c.resolveNightEvent(sim, ok.length ? bot.choose(c, ev, ok) : 0);
    }
    // La cloche de 22h et les bribes de terrasse, comme game.js › ambientLines
    const m = sim.state.min;
    if (!bell.before && m >= CLOSE - 5) { bell.before = true; const s = now(); emit(narrative.pickNightLine('bell:before', sim, narrRng), 'bell', s, s); }
    if (!bell.strike && m >= CLOSE) { bell.strike = true; bell.outAt22 = sim.state.tables.filter((t) => t.out).length; const s = now(); emit(narrative.pickNightLine('bell:strike', sim, narrRng), 'bell', s, s); }
    if (!bell.after && m >= CLOSE + 5) { bell.after = true; const s = now(); emit(narrative.pickNightLine('bell:after', sim, narrRng, { outAt22: bell.outAt22 }), 'bell', s, s); }
    if (m >= nextBark) {
      nextBark = m + 10 + narrRng.next() * 10;
      if (sim.state.tables.some((t) => t.out)) {
        const s = now();
        const tw = narrRng.chance(0.5) && narrative.twistLine('barks', sim, narrRng);
        if (tw) emit(tw, 'twist', s, s); else emit(narrative.pickNightLine('bark', sim, narrRng), 'bark', s, s);
      }
    }
    sim.tick(1);
    const post = now();
    for (const e of sim.drainEvents()) if (e.type === 'log') emit(e.text, e.cls === 'ambient' ? 'ambient' : twistText(sim, e.text) ? 'twist' : e.cls || 'log', pre, post, e.min);
  }
  c.finishNight(sim);
}
const twistText = (sim, text) => (sim.twist ? (K.TWISTS.find((t) => t.id === sim.twist.id)?.sim?.events ?? []).some((e) => e.text === text || e.else === text) : false);

// ── Les campagnes ─────────────────────────────────────────────────────────────────────────────────────────
const t0 = performance.now();
const mismatches = [];
const counts = { lines: 0, night: 0, day: 0, byCat: {} };
for (const name of BOTS) {
  for (let seed = 1; seed <= RUNS; seed++) {
    const bot = CAMPAIGN_BOTS[name]();
    const c = createCampaign({ seed, content: K, narrative });
    for (let guard = 0; guard < 5000 && !c.ended; guard++) {
      if (c.step === 'cards') { const card = c.card(); const ok = card.choices.filter((x) => x.available); counts.day++; c.resolveCard(card.type === 'event' && ok.length ? bot.choose(c, card, ok) : 0); }
      else if (c.step === 'koddex') c.koddex(bot.morning(c, c.koddexOptions()));
      else if (c.step === 'actions') { const id = bot.afternoon(c, c.availableActions()); if (id) { counts.day++; c.doAction(id); } else c.endAfternoon(); }
      else if (c.step === 'night') {
        const rec = [];
        playRecorded(c, bot, seed, rec);
        for (const r of rec) {
          counts.night++;
          counts.byCat[r.cat] = (counts.byCat[r.cat] ?? 0) + 1;
          const t = r.text.toLowerCase();
          for (const rule of RULES) {
            if (!rule.test(t, r.cat)) continue;
            if (rule.ok(r.post, r.pre, r) || rule.ok(r.pre, r.pre, r)) continue;
            mismatches.push({ rule: rule.id, why: rule.why, bot: name, seed, ...r });
          }
        }
      } else if (c.step === 'recap') { const f = c.mediaFeed(); for (const [feed, items] of Object.entries(f)) for (const m of items) { counts.day++; c.readMedia(feed, m.id); } c.nextDay(); }
      if (c.ended && c.state.ending?.canContinue && bot.continueAfterFired?.(c)) c.continueAfterEnding();
    }
  }
  if (!QUIET) console.log(`${name} : ${RUNS} campagnes, ${mismatches.length} contradiction(s) cumulées`);
}
counts.lines = counts.night + counts.day;
const secs = ((performance.now() - t0) / 1000).toFixed(0);

// ── Rapport ───────────────────────────────────────────────────────────────────────────────────────────────
const byRule = {};
for (const m of mismatches) (byRule[m.rule] ??= []).push(m);
const byText = (list) => { const g = new Map(); for (const m of list) { const k = m.text; g.set(k, [...(g.get(k) ?? []), m]); } return [...g.entries()].sort((a, b) => b[1].length - a[1].length); };
const snap = (s) => `${fmt(s.min)} · tables ${s.tablesOut} (estaminet ${s.estaminetOut}) · debout ${s.standing} · ${s.rain ? 'pluie' : 'sec'} · gaine ${s.exhaust ? 'on' : 'off'} · ${Object.entries(s.present).filter(([, v]) => v).map(([k]) => k).join(', ') || 'personne'}`;
let md = `# Cohérence texte ↔ état (§13.L)\n\nGénéré par \`npm run check:coherence -- --runs ${RUNS}\` (scripts/coherence-check.js) : ${RUNS} campagnes × ${BOTS.length} bots (${BOTS.join(', ')}), ${secs} s.\n`
  + `Chaque ligne de nuit est vérifiée contre l'état juste avant et juste après son affichage (une ligne passe si l'un des deux lui donne raison) ; `
  + `les lignes de jour (cartes, actions, dialogue, téléphone) sont comptées, leurs gardes vérifiées à la sélection.\n\n`
  + `**Lignes vues : ${counts.lines}** (nuit ${counts.night}, jour ${counts.day}) · **contradictions : ${mismatches.length}**\n\n`
  + `| Catégorie | Lignes |\n|---|---|\n${Object.entries(counts.byCat).sort((a, b) => b[1] - a[1]).map(([k, v]) => `| ${k} | ${v} |`).join('\n')}\n\n`
  + `| Règle | Contradictions | Textes distincts |\n|---|---|---|\n${RULES.map((r) => `| ${r.id} : ${r.why} | ${byRule[r.id]?.length ?? 0} | ${byRule[r.id] ? byText(byRule[r.id]).length : 0} |`).join('\n')}\n`;
for (const [rule, list] of Object.entries(byRule)) {
  md += `\n## ${rule}\n\n`;
  for (const [text, ms] of byText(list).slice(0, 15)) md += `- ×${ms.length} \`${ms[0].cat}\`${ms[0].twist ? ` (twist ${ms[0].twist})` : ''} « ${text.slice(0, 160)} » · ex. ${ms[0].bot}#${ms[0].seed} J${ms[0].day} : ${snap(ms[0].post)}\n`;
}
if (WRITE) writeFileSync(join(ROOT, 'qa', 'coherence-state.md'), md);
console.log(`\n${counts.lines} lignes, ${mismatches.length} contradiction(s) · qa/coherence-state.md (${secs} s)`);
for (const [rule, list] of Object.entries(byRule)) console.log(`  ${rule} : ${list.length} (${byText(list).length} textes)`);
if (STRICT && mismatches.length) process.exit(1);
