// Câblage narratif : transforme l'état du moteur en texte (src/content/night.js, intro.js, media.js, dialogue.js,
// events.js d14 `scene`). Pur, sans DOM, déterministe : tout tirage passe par le rng fourni (sim.rng ou campagne).
// Owner : design/content agent. Le moteur (sim.js, campaign.js) ne fait qu'appeler ces fonctions.
//
// Points d'appel : voir GAME_DESIGN.md, Build notes « narrative-wiring ».
import { evalCondition, compare } from './conditions.js';
import { KLAAS_NOTEBOOK, POLICE_LINES, WITNESS_LINES, BARKS, BELL, WAITER_LINES, RECAP_HEADLINES, NIGHT_END } from '../content/night.js';
import { INTRO_CARDS, TUTORIAL } from '../content/intro.js';
import { MEDIA } from '../content/media.js';
import { DIALOGUE } from '../content/dialogue.js';
import { EVENTS } from '../content/events.js';
import { CHARACTERS } from '../content/characters.js';

// ════════════════════════════════════════════════════════════════════════════
// Outils
// ════════════════════════════════════════════════════════════════════════════

// Minutes depuis minuit → « 22h14 » (format des textes, ≠ fmt() du HUD « 22:14 »)
export const hhmm = (m) => {
  const h = Math.floor(m / 60) % 24, mm = Math.floor(m % 60);
  return `${String(h).padStart(2, '0')}h${String(mm).padStart(2, '0')}`;
};

const PLACEHOLDER = /\{(\w+)\}/g;
export const placeholders = (template) => [...String(template).matchAll(PLACEHOLDER)].map((m) => m[1]);

// Remplace les {variables}. Une variable absente de ctx n'est jamais laissée telle quelle :
// elle est remplacée par `fallback` (par défaut « … ») et signalée dans `missing` si fourni.
export function fill(template, ctx = {}, { fallback = '…', missing } = {}) {
  return String(template).replace(PLACEHOLDER, (_, k) => {
    if (ctx[k] !== undefined && ctx[k] !== null) return String(ctx[k]);
    missing?.push(k);
    return fallback;
  });
}

// Tirage déterministe : rng (sim.rng / campagne) ou, sans rng, la première ligne.
const pick = (list, rng) => (!list?.length ? null : rng ? rng.pick(list) : list[0]);

// État de campagne ({ day, phase, flags: [] | Set, stats, hidden }) → contexte de conditions §14
export function toCtx(state = {}) {
  const flags = state.flags instanceof Set ? state.flags : new Set(state.flags ?? []);
  return { day: state.day ?? 1, phase: state.phase ?? 'night', flags, stats: state.stats ?? {}, hidden: state.hidden ?? {} };
}
const matches = (cond, state, rng) => evalCondition(cond, toCtx(state), rng ?? null);

// ════════════════════════════════════════════════════════════════════════════
// Contextes de variables, construits depuis l'état de la nuit (sim)
// ════════════════════════════════════════════════════════════════════════════
const restName = (sim, id) => sim.rest?.(id)?.name ?? id ?? 'la terrasse';

export const nightCtx = {
  // Une table (over / late / corridor)
  table(sim, t, min = sim.state.min) {
    const max = sim.cfg.RULES.maxPeoplePerTable;
    return {
      time: hhmm(min), rest: restName(sim, t.restId), table: t.label, count: t.count, max,
      n: Math.max(0, t.count - max), cm: Math.round(Math.max(0, sim.encroachment(t)) * 100), db: Math.round(sim.state.noiseBed),
    };
  },
  // Un tuyau : sim.state.tipoffs[i] (tippedAt / arrivedAt / returned ?? returnAt)
  tipoff(sim, tip) {
    return {
      time: hhmm(tip.tippedAt), tipTime: hhmm(tip.tippedAt), arriveTime: hhmm(tip.arrivedAt),
      returnTime: hhmm(tip.returned ?? tip.returnAt), rest: restName(sim, tip.restId), n: tip.tableIds.length,
    };
  },
  // Une visite de police : sim.state.policeLog[i] (ou sim.state.police pendant l'appel)
  police(sim, entry) {
    return {
      time: hhmm(entry.arrivedAt ?? entry.calledAt ?? sim.state.min), rest: entry.rest ?? restName(sim, entry.restId),
      patrol: entry.patrol ?? entry.patrolName ?? sim.cfg.POLICE.patrols[entry.patrolId]?.name,
      detail: entry.detail || 'tables rentrées', calls: entry.callId ?? sim.state.calls, n: entry.callId ?? sim.state.calls,
    };
  },
  // Un passant qui urine : sim.state.pees[i]
  pee(sim, p) { return { time: hhmm(p.start), door: p.doorway.label }; },
  // Raclement de chaises : n tables rentrées d'un coup
  clatter(sim, restId, n = 1, min = sim.state.min) { return { time: hhmm(min), rest: restName(sim, restId), n }; },
  // Un acte de Pilou vu par Klaas
  pilou(sim, act, min = sim.state.min) { return { time: hhmm(min), act }; },
  // Le serveur avant 22h : minutes restantes
  waiter(sim) { return { n: Math.max(1, Math.ceil(sim.cfg.RULES.terraceCloseHour * 60 - sim.state.min)) }; },
};

// ════════════════════════════════════════════════════════════════════════════
// Lignes de nuit
// ════════════════════════════════════════════════════════════════════════════

// Alias des témoins : ids d'actions.js / campagne → clés de WITNESS_LINES
const WITNESS_ALIAS = { jeremie: 'biloute' };

// Raison du serveur depuis le retour de sim.act({ type: 'waiter' })
export function waiterReason(result, simState) {
  if (result?.ok) return 'ok';
  if (result?.reason) return result.reason;
  return simState?.blocKnows ? 'refused_bloc_knows' : 'refused';
}

// État de la rue juste après la cloche : outAt22 = nb de tables dehors à 22h00 (optionnel)
export function bellAfterKey(sim, outAt22) {
  if (sim.day?.key === 'sat') return 'saturday';
  const out = sim.state.tables.filter((t) => t.out).length;
  if (!out) return 'all_cleared';
  const before = outAt22 ?? sim.state.tables.length;
  return out >= before ? 'none_cleared' : 'some_out';
}

// La réserve de lignes d'un `kind` (exportée pour les tests et l'outillage)
//   'bark' · 'bark:saturday' · 'bark:police' · 'bell:before' · 'bell:strike' · 'bell:after:<key>'
//   'waiter:<reason>' (+ 'waiter:theo:<ok|refused>') · 'witness:<kind>' · 'end:<reason>'
export function nightPool(kind) {
  const [head, a, b] = kind.split(':');
  switch (head) {
    case 'bark': return a === 'saturday' ? BARKS.saturday : a === 'police' ? BARKS.police_passing : BARKS.weekday;
    case 'bell': return a === 'after' ? BELL.after[b] : BELL[a];
    case 'waiter': return a === 'theo' ? WAITER_LINES.theo[b] : WAITER_LINES[a];
    case 'witness': return WITNESS_LINES[WITNESS_ALIAS[a] ?? a];
    case 'end': return NIGHT_END[a];
    default: return undefined;
  }
}

// Une ligne de nuit, remplie. kind :
//   'bark'                     bribe de terrasse (samedi : 70 % de bribes du samedi ; police sur place : parfois un murmure)
//   'bell:before' | 'bell:strike' | 'bell:after'   (after : choisit all_cleared / some_out / none_cleared / saturday)
//   'waiter'                   extra.result = retour de sim.act({ type: 'waiter' }) ; extra.metWaiter → variantes « Théo »
//   'witness'                  extra.witness = { kind, filmed } (rollWitnesses) ; kind absent → « personne »
//   'end'                      extra.reason = sim.state.endReason
// sim : l'objet nuit (createSim) ; rng : sim.rng par défaut. Renvoie une chaîne (jamais de {variable} non remplie).
export function pickNightLine(kind, sim, rng = sim?.rng, extra = {}) {
  let pool;
  let ctx = {};
  if (kind === 'bark') {
    if (sim.state.police?.phase === 'onsite' && rng?.chance(0.25)) pool = BARKS.police_passing;
    else pool = sim.day?.key === 'sat' && (!rng || rng.chance(0.7)) ? BARKS.saturday : BARKS.weekday;
  } else if (kind === 'bell:after') {
    pool = BELL.after[bellAfterKey(sim, extra.outAt22)];
  } else if (kind === 'waiter') {
    const reason = waiterReason(extra.result, sim.state);
    const theoKey = reason === 'ok' ? 'ok' : reason.startsWith('refused') ? 'refused' : null;
    pool = extra.metWaiter && theoKey && WAITER_LINES.theo[theoKey] ? WAITER_LINES.theo[theoKey] : WAITER_LINES[reason];
    if (reason === 'early') ctx = nightCtx.waiter(sim);
  } else if (kind === 'witness') {
    const w = extra.witness;
    const k = !w ? 'nobody' : w.kind === 'customers' && w.filmed ? 'customers_filmed' : WITNESS_ALIAS[w.kind] ?? w.kind;
    pool = WITNESS_LINES[k] ?? WITNESS_LINES.nobody;
  } else if (kind === 'end') {
    pool = NIGHT_END[extra.reason ?? sim.state.endReason ?? 'time'];
  } else {
    pool = nightPool(kind);
  }
  const line = pick(pool, rng);
  return line === null ? null : fill(line, { ...ctx, ...extra.ctx });
}

// ── Police ─────────────────────────────────────────────────────────────────
// outcome : 'call' | 'arrive' | 'act' | 'complaisance' | 'tipoff' | 'nothing' | 'ignored' | 'busy' | 'never_came' | 'for_pilou'
// patrol  : 'lemaire' | 'benali' | 'chief' (ignoré pour call / ignored / busy)
// ctx     : nightCtx.police(sim, entry) (+ { asso: true } pour 'call')
export function policePool(outcome, patrol, { asso = false } = {}) {
  if (outcome === 'call') return asso ? POLICE_LINES.call.asso : POLICE_LINES.call.normal;
  if (outcome === 'ignored' || outcome === 'busy') return POLICE_LINES[outcome];
  return (POLICE_LINES[patrol] ?? POLICE_LINES.lemaire)[outcome];
}
export function policeLine(outcome, patrol, ctx = {}, rng) {
  const line = pick(policePool(outcome, patrol, ctx), rng);
  return line === null ? null : fill(line, ctx);
}

// ── Klaas ──────────────────────────────────────────────────────────────────
// Seuil : klaasDetection(sim, d) (witness.js) vaut au plus WITNESS.klaas.p (0.9). Au-dessus de KLAAS_PRECISE_AT,
// il distingue les détails (le crayon compte les têtes) : ligne `precise`. Entre 0 et ce seuil : `vague`.
// À 0 (hors de vue, endormi) : rien. Avec la config v0.2 la nuit (near 15 m, far 75 m), 0.6 ≈ 35 m de la fenêtre.
export const KLAAS_PRECISE_AT = 0.6;

// event : { about, ...ctx }. about : 'over' | 'late' | 'corridor' | 'complaisance' | 'tipoff' | 'police_act' | 'pee'
//         | 'clatter' | 'pilou' | 'bedtime' | 'bucket' (alias de pilou, act = « seau d'eau »)
// ctx   : le nightCtx correspondant (table / tipoff / police / pee / clatter / pilou)
// Renvoie { text, precise } ou null si Klaas ne peut pas voir.
export function klaasEntry(event, detection, rng) {
  if (event.about === 'bedtime') return { text: pick(KLAAS_NOTEBOOK.bedtime, rng), precise: true };
  if (!(detection > 0)) return null;
  const about = event.about === 'bucket' ? 'pilou' : event.about;
  const pools = KLAAS_NOTEBOOK[about];
  if (!pools) return null;
  const precise = detection >= KLAAS_PRECISE_AT;
  const line = pick(precise ? pools.precise : pools.vague, rng);
  const ctx = event.about === 'bucket' ? { act: 'seau d\'eau', ...event } : event;
  return { text: fill(line, ctx), precise };
}

// ════════════════════════════════════════════════════════════════════════════
// Bilan de nuit : manchette
// ════════════════════════════════════════════════════════════════════════════
const OUTCOME_OF = (label = '') => (label.startsWith('PV') ? 'act' : label.startsWith('café') ? 'complaisance'
  : label.startsWith('tout rangé') ? 'tipoff' : label.includes('encore vous') ? 'ignored' : 'other');

// Mesures de la nuit pour RECAP_HEADLINES.when, depuis sim.summary() (ou c.state.lastNight).
// simState (facultatif, sim.state) affine : scandal, blocKnows, pees, outcomes exacts.
export function recapMetrics(summary, simState) {
  const outcomes = simState ? simState.policeLog.map((p) => p.outcome) : (summary.police ?? []).map((p) => OUTCOME_OF(p.outcome));
  const count = (o) => outcomes.filter((x) => x === o).length;
  const verdict = (summary.verdict ?? []).join(' ');
  return {
    reason: summary.reason ?? 'time',
    saturday: /samedi/i.test(summary.dayLabel ?? ''),
    ratio: summary.dossier?.target ? summary.dossier.score / summary.dossier.target : 0,
    acts: count('act'), complaisance: count('complaisance'), tipoffs: count('tipoff'), ignored: count('ignored'),
    pees: simState ? simState.pees.length : 0,
    bucket: summary.bucketUses ?? 0,
    pieces: summary.dossier?.pieces ?? 0,
    witnesses: (summary.witnesses ?? []).length,
    scandal: simState ? !!simState.scandal : /commissaire/i.test(verdict),
    blocKnows: simState ? !!simState.blocKnows : /bloc sait/i.test(verdict),
    allOnTime: (summary.restaurants ?? []).length > 0 && summary.restaurants.every((r) => r.onTime === r.total),
  };
}

export function headlineMatches(when, m) {
  return Object.entries(when).every(([k, v]) => {
    if (typeof v === 'boolean' || k === 'reason') return m[k] === v;
    return compare(m[k] ?? 0, v);
  });
}

// → { id, text } : la manchette de plus haute priorité qui correspond (h_default sinon)
export function pickHeadline(metrics) {
  const best = [...RECAP_HEADLINES].sort((a, b) => b.priority - a.priority).find((h) => headlineMatches(h.when, metrics));
  return { id: best.id, text: best.text };
}
export const recapHeadline = (summary, simState) => pickHeadline(recapMetrics(summary, simState));

// ════════════════════════════════════════════════════════════════════════════
// Ouverture et tutoriel
// ════════════════════════════════════════════════════════════════════════════
export const introCards = () => INTRO_CARDS;

// Les déclencheurs que le moteur doit émettre (une fois suffit : le tutoriel est `once`).
export const TUTORIAL_TRIGGERS = [...new Set(TUTORIAL.map((t) => t.trigger))];

// triggerId : un des TUTORIAL_TRIGGERS. state : état de campagne + `seenTutorial: [ids]` (persisté par le moteur).
// → { id, text } ou null. Le moteur ajoute l'id à seenTutorial après affichage.
export function tutorialPrompt(triggerId, state = {}) {
  const seen = new Set(state.seenTutorial ?? []);
  const t = TUTORIAL.find((x) => x.trigger === triggerId && !seen.has(x.id) && matches(x.when, state));
  return t ? { id: t.id, text: t.text } : null;
}

// ════════════════════════════════════════════════════════════════════════════
// J14 : la scène de la commission
// ════════════════════════════════════════════════════════════════════════════
const COMMISSION = EVENTS.find((e) => e.id === 'd14_commission');

// → [{ speaker, name, text }] : les répliques de `scene` dont `when` correspond, dans l'ordre du fichier.
export function commissionScene(state, event = COMMISSION) {
  return (event?.scene ?? [])
    .filter((p) => matches(p.when, state))
    .map((p) => ({ speaker: p.speaker, name: CHARACTERS[p.speaker]?.name ?? p.speaker, text: p.text }));
}

// ════════════════════════════════════════════════════════════════════════════
// Dialogue et fil du téléphone (conditions §14)
// ════════════════════════════════════════════════════════════════════════════

// Répliques disponibles pour un personnage (parler à quelqu'un hors des cartes de campagne).
// opts.seen : ids déjà vus (S.seen.dialogue) ; une entrée `once` (par défaut) vue n'est plus proposée.
export function dialogueFor(speaker, state, { seen = [], rng } = {}) {
  const done = new Set(seen);
  return DIALOGUE.filter((d) => d.speaker === speaker && !(d.once !== false && done.has(d.id)) && matches(d.when, state, rng));
}

// Nouveaux messages du jour, par fil. Les entrées `ending` (unes de fin) sont exclues : voir mediaEnding().
// opts.seen : ids déjà lus (une entrée ne s'affiche qu'une fois) ; opts.feeds : sous-ensemble de fils.
export function mediaFeed(state, day = state.day, { seen = [], feeds = ['whatsapp', 'press', 'social'], rng } = {}) {
  const done = new Set(seen);
  const s = { ...state, day };
  return Object.fromEntries(feeds.map((f) => [f, (MEDIA[f] ?? []).filter((x) => !x.ending && !done.has(x.id) && matches(x.when, s, rng))]));
}
// La une de presse d'un écran de fin. Plusieurs variantes possibles (ex. custody / custody + carbonnade sucrée) :
// on garde celles dont `when` correspond à l'état final, et la plus spécifique (le plus de conditions) gagne.
const specificity = (w = {}) => (w.flags?.length ?? 0) + (w.notFlags?.length ?? 0) + Object.keys(w.stats ?? {}).length + Object.keys(w.hidden ?? {}).length;
export function mediaEnding(endingId, state) {
  const all = MEDIA.press.filter((p) => p.ending === endingId);
  const ok = state ? all.filter((p) => matches(p.when, state)) : all;
  return [...(ok.length ? ok : all)].sort((a, b) => specificity(b.when) - specificity(a.when))[0] ?? null;
}

// Tous les messages d'écran de fin (whatsapp / press / social) dont `when` correspond à l'état final.
export function mediaEndingFeed(endingId, state, { feeds = ['whatsapp', 'press', 'social'] } = {}) {
  return Object.fromEntries(feeds.map((f) => [f, (MEDIA[f] ?? []).filter((x) => x.ending === endingId && (!state || matches(x.when, state)))]));
}
