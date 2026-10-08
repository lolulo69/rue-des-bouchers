#!/usr/bin/env node
// Transcription d'une campagne (QA de cohérence) : joue UNE campagne entière sans rendu, avec narrative.js,
// et l'écrit comme une histoire lisible, jour par jour (matin, cartes, après-midi, nuit, bilan, commission, fin).
//   npm run story -- --bot legal --seed 3 [--out qa/stories/legal-3.md]
// Bots : passive, legal, reckless, stealthy, mixed, diplomat (src/sim/campaignBots.js).
import { readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeContent, createCampaign, CAMPAIGN_BOTS } from '../src/sim/index.js';
import { createRng } from '../src/sim/rng.js';
import { fmt } from '../src/sim/time.js';
import * as narrative from '../src/sim/narrative.js';
import { CHARACTERS, PLACES } from '../src/content/characters.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1]; };
const BOT = arg('bot', 'legal');
const SEED = Number(arg('seed', 1));
const OUT = arg('out', null);
if (!CAMPAIGN_BOTS[BOT]) throw new Error(`bot inconnu : ${BOT} (${Object.keys(CAMPAIGN_BOTS).join(', ')})`);

const dir = join(ROOT, 'src', 'content');
const K = normalizeContent(await Promise.all(readdirSync(dir).filter((f) => f.endsWith('.js')).map((f) => import(join(dir, f)))));
const WITNESS = { klaas: 'Klaas', seb_nico: 'Seb et Nico', waiter: 'le serveur', customers: 'des clients', biloute: 'Biloute', jeremie: 'Jérémie', dede: 'Dédé', ghislain: 'Ghislain', police: 'la police' };
let c = null; // la campagne (déclarée plus bas) : le serveur reste « le serveur » tant que met_waiter n'est pas posé
const who = (id) => (id === 'serveur' && !c?.has('met_waiter') ? 'Le serveur' : CHARACTERS[id]?.name ?? PLACES[id]?.name ?? WITNESS[id] ?? id);
const DAYS = { mon: 'lundi', tue: 'mardi', wed: 'mercredi', thu: 'jeudi', fri: 'vendredi', sat: 'samedi', sun: 'dimanche' };

const out = [];
const w = (s = '') => out.push(s);
const quote = (t) => String(t).split('\n').map((l) => `> ${l}`).join('\n');
const stats = (S) => `Sommeil ${Math.round(S.stats.sleep)} · Asso ${Math.round(S.stats.asso)} · Risque ${Math.round(S.stats.risk)} · Job ${Math.round(S.stats.job)} · Dossier ${Math.round(S.stats.dossier)}`
  + ` · (caché) hostilité ${Math.round(S.hidden.hostility)}, corruption ${Math.round(S.hidden.corruption)}`;

// ── Le narrateur de la nuit, comme dans main.js (RNG à part : le texte ne change pas l'issue) ────────────
const bot = CAMPAIGN_BOTS[BOT]();
c = createCampaign({ seed: SEED, content: K, narrative });
const narrRng = createRng((SEED ^ 0x5bd1e995) >>> 0);
function narrator(kind, s, a) {
  switch (kind) {
    case 'police': return narrative.policeLine(a.outcome, a.patrolId, { ...narrative.nightCtx.police(s, a.entry ?? {}), asso: !!a.asso }, narrRng);
    case 'waiter': return narrative.pickNightLine('waiter', s, narrRng, { result: a.result, metWaiter: c.has('met_waiter') });
    case 'witness': return narrative.pickNightLine('witness', s, narrRng, a.witness ? { witness: a.witness } : {});
    case 'end': return narrative.pickNightLine('end', s, narrRng, { reason: a.reason });
    case 'klaas': { const e = narrative.klaasEntry(a.event, a.detection, narrRng); return e ? `📓 Carnet de Klaas : ${e.text}` : null; }
    default: return null;
  }
}

w(`# Rue des Bouchers · transcription · bot « ${bot.name} » · graine ${SEED}`);
w();
w(`_Générée par \`npm run story -- --bot ${BOT} --seed ${SEED}\`. Contenu réel, narrative.js, mêmes règles que le jeu._`);
w();
for (const card of c.introCards()) { w(`**${card.title}**`); w(quote(card.text)); w(); }

let day = 0;
function header() {
  if (c.state.day === day) return;
  day = c.state.day;
  w(`## Jour ${day} · ${DAYS[c.weekday()]}${c.isSaturday() ? ' (sans voitures)' : ''}`);
  w(`_${stats(c.state)}_`);
  w();
}

function cards() {
  while (c.step === 'cards') {
    const card = c.card();
    const d = card.data ?? {};
    const ok = card.choices.filter((x) => x.available);
    let i = 0;
    if (card.type === 'event' && ok.length) i = bot.choose(c, card, ok);
    if (card.type === 'event') {
      w(`### 🃏 ${d.title ?? card.id} \`${card.id}\``);
      if (d.text) w(quote(d.text));
      for (const p of card.scene ?? []) w(`> **${p.name}** : ${p.text}`);
      w();
      w(`Choix possibles : ${card.choices.map((x) => `${x.i === i ? '**→ ' : ''}${x.label}${x.i === i ? '**' : ''}${x.available ? '' : ' _(grisé)_'}`).join(' · ')}`);
    } else if (card.type === 'countermove') {
      w(`### 🍺 Contre-offensive : ${d.title ?? card.id} \`${card.id}\``);
      if (d.text) w(quote(d.text));
    } else if (card.type === 'dialogue') {
      w(`**💬 ${who(d.speaker)}** \`${card.id}\``);
      for (const l of d.lines ?? []) w(quote(l));
    } else {
      w(`**ℹ️ ${card.title ?? card.id}**`);
      if (card.text) w(quote(card.text));
    }
    const res = c.resolveCard(i);
    if (res) w(`_→ ${res}_`);
    w();
  }
}

const NATIVE = { police: 'appelle la police municipale', waiter: 'demande au serveur de rentrer les tables', bucket: 'vide un seau d’eau par la fenêtre', asso: 'partage ses pièces sur le groupe WhatsApp', mairie: 'envoie un signalement à la mairie' };
function night() {
  const sim = c.createNight({ narrator });
  const policy = bot.night(c, sim);
  w(`### 🌙 Nuit ${c.state.day} (${sim.day.key === 'sat' ? 'samedi, foule' : 'semaine'})`);
  const log = [];
  const say = (min, text) => log.push(`- \`${fmt(min)}\` ${text}`);
  let outAt22 = null, nextContent = -Infinity, barks = 0, nextBark = 20 * 60 + 45;
  const bells = { [21 * 60 + 55]: 'bell:before', [22 * 60]: 'bell:strike', [22 * 60 + 5]: 'bell:after' };
  while (!sim.state.ended) {
    for (const a of policy.decide(sim)) {
      if (NATIVE[a.type]) say(sim.state.min, `**Pilou** : ${NATIVE[a.type]}${a.asso ? ' (« pour l’Association »)' : ''}`);
      sim.act(a);
      if (sim.state.ended) break;
    }
    if (!sim.state.ended && policy.content && sim.state.min >= nextContent) {
      nextContent = sim.state.min + 10;
      for (const id of policy.content(sim, c)) {
        const r = c.doNightAction(sim, id);
        if (r.ok) say(r.startedAt, `**Pilou** : ${K.ACTIONS.find((x) => x.id === id)?.label ?? id}${r.seen.length ? ` (vu par ${r.seen.map((s) => s.name).join(', ')})` : ''}`);
      }
    }
    // Événements de nuit à leur heure (campaign.nightEventDue), choix du bot
    for (let ev = c.nightEventDue(sim); ev; ev = c.nightEventDue(sim)) {
      const ok = ev.choices.filter((x) => x.available);
      const i = ok.length ? bot.choose(c, ev, ok) : 0;
      const r = c.resolveNightEvent(sim, i);
      say(sim.state.min, `🃏 **${ev.data.title}** \`${ev.id}\` : ${ev.data.text}`);
      say(sim.state.min, `→ **${ev.choices[i]?.label ?? 'OK'}**${r ? ` : ${r}` : ''}`);
    }
    for (const e of sim.drainEvents()) if (e.type === 'log') say(e.min, e.text);
    const m = sim.state.min;
    for (const [t, kind] of Object.entries(bells)) {
      if (m >= Number(t) && !bells[`done${t}`]) {
        bells[`done${t}`] = true;
        if (kind === 'bell:before') outAt22 = null;
        if (kind === 'bell:strike') outAt22 = sim.state.tables.filter((x) => x.out).length;
        say(Number(t), `🔔 ${narrative.pickNightLine(kind, sim, narrRng, { outAt22 })}`);
      }
    }
    if (m >= nextBark && barks < 3) { barks++; nextBark = m + 45; say(m, `🍻 ${narrative.pickNightLine('bark', sim, narrRng)}`); }
    sim.tick(1);
  }
  for (const e of sim.drainEvents()) if (e.type === 'log') say(e.min, e.text);
  out.push(...log.map((l, i) => [l, i]).sort((a, b) => (a[0].slice(3, 8) < b[0].slice(3, 8) && a[0].slice(3, 5) >= '20') - 0 || 0).map(([l]) => l));
  const summary = c.finishNight(sim);
  w();
  const h = narrative.recapHeadline(c.state.lastNight ?? summary, sim.state);
  w(`**📰 ${h.text}**`);
  for (const v of (c.state.lastNight ?? summary)?.verdict ?? []) w(`- ${v}`);
  w();
}

function phone() {
  const feed = c.mediaFeed();
  const items = Object.entries(feed).flatMap(([f, list]) => list.map((m) => [f, m]));
  if (!items.length) return;
  w(`### 📱 Téléphone`);
  for (const [f, m] of items) {
    const name = m.author === 'reviewer' ? m.handle : who(m.author);
    const tag = f === 'whatsapp' ? `WhatsApp · ${name}` : f === 'press' ? 'La Voix du Nordiste' : m.kind === 'review' ? `Avis${m.stars ? ` ${'★'.repeat(m.stars)}` : ''} · ${m.handle ?? name}` : name;
    w(`- **${tag}** \`${m.id}\` ${m.headline ? `**${m.headline}** ` : ''}${m.text}`);
    c.readMedia(f, m.id);
  }
  w();
}

for (let guard = 0; guard < 5000 && !c.ended; guard++) {
  header();
  switch (c.step) {
    case 'cards': cards(); break;
    case 'koddex': {
      const o = c.koddexOptions();
      const picks = bot.morning(c, o);
      if (o.gag) { w(`**☕ Koddex · ${who(o.gag.speaker ?? 'clode')}** \`${o.gag.id}\``); for (const l of o.gag.lines ?? []) w(quote(typeof l === 'string' ? l : `${who(l.speaker)} : ${l.text}`)); }
      const lines = c.koddex(picks);
      w(`**💻 Clode Kode, 3 prompts** : ${picks.map((p) => (p === 'work' ? 'travail' : o.sideProjects.find((x) => x.id === p)?.label ?? o.work.find((x) => x.id === p)?.label ?? p)).join(' · ')}`);
      for (const l of lines ?? []) w(quote(typeof l === 'string' ? l : `${who(l.speaker)} : ${l.text}`));
      w();
      break;
    }
    case 'actions': {
      const id = bot.afternoon(c, c.availableActions());
      if (!id) { c.endAfternoon(); break; }
      const a = K.ACTIONS.find((x) => x.id === id);
      const r = c.doAction(id);
      w(`**🗂 Après-midi : ${a.label}** \`${id}\`${r.seen?.length ? ` _(vu par ${r.seen.map((s) => who(s.id)).join(', ')})_` : ''}`);
      if (r.result) w(quote(r.result));
      w();
      break;
    }
    case 'night': night(); break;
    case 'recap': phone(); c.nextDay(); break;
    default: throw new Error(`étape ${c.step}`);
  }
  if (c.ended && c.state.ending?.canContinue && bot.continueAfterFired?.(c)) {
    w(`**↩️ ${c.state.ending.continueLabel}** (fin « ${c.state.ending.title} » refusée, on continue au chômage)`);
    w();
    c.continueAfterEnding();
  }
}

const E = c.state.ending;
w(`## 🏁 Fin : ${E?.title ?? '?'} \`${E?.id}\`${E?.early ? ` (anticipée, jour ${E.day})` : ''}`);
w(`_${stats(c.state)}_`);
w();
const front = c.state.endingMedia?.front;
if (front) { w(`**📰 ${front.headline ?? 'La Voix du Nordiste'}**`); w(quote(front.text)); w(); }
for (const p of c.state.epilogue ?? []) { w(quote(p)); w('>'); }
w();
w(`Drapeaux en fin de partie : ${[...c.state.flags].sort().join(', ')}`);

const text = out.join('\n') + '\n';
if (OUT) { mkdirSync(dirname(join(ROOT, OUT)), { recursive: true }); writeFileSync(join(ROOT, OUT), text); console.log(`${OUT} : ${E?.id}, ${out.length} lignes`); }
else process.stdout.write(text);
