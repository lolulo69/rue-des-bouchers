// Linter du contenu narratif (§14) : drapeaux déclarés, locuteurs existants, conditions satisfiables, ids uniques,
// fins canoniques, Risque seulement sur acte vu. Renvoie { errors, warnings } (le test échoue sur errors).
// La liste des noms réels interdits vit dans les tests (tests/unit/realNames.js), pas dans src/.
import { unsatisfiable, PHASES } from './conditions.js';
import { CONFIG } from '../config.js';

// Drapeaux que le moteur pose lui-même (nuit, Koddex, IGPN, chômage)
export const ENGINE_SET_FLAGS = [
  'night_photo', 'night_db', 'corridor_measured', 'called_police', 'called_as_asso', 'seen_complaisance', 'seen_tipoff',
  'serial_caller', 'benali_fined', 'benali_transferred', 'chief_came', 'saw_pee', 'pee_at_door', 'bucket_used',
  'bucket_witnessed', 'video_viral', 'klaas_noted_pilou', 'talked_waiter', 'bribe_photo', 'bribe_photo_illegal',
  'corruption_proof', 'igpn_open', 'lemaire_transferred', 'unemployed', 'custody', 'saturday1_done', 'saturday2_done', 'boss_noticed',
];

const conds = (x) => [x.when, x.requires, ...(x.whenAny ?? [])].filter(Boolean);
const effectsOf = (x) => [x.effects, x.witnessed?.effects, x.continue?.effects, ...(x.choices ?? []).map((c) => c.effects)].filter(Boolean);

// Tous les textes affichés d'une entrée (pour la recherche de noms réels)
export function textsOf(content) {
  const out = [];
  const walk = (v) => {
    if (typeof v === 'string') out.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  };
  walk(content);
  return out;
}

// incomplete : tant que des fichiers de contenu manquent, "drapeau jamais posé" n'est qu'un avertissement.
export function lintContent(K, { cfg = CONFIG, realNames = [], incomplete = false } = {}) {
  const errors = [];
  const warnings = [];
  const declared = new Set(Object.keys(K.FLAGS));
  const speakers = new Set(Object.keys(K.CHARACTERS));

  // Drapeaux que quelqu'un sait poser
  const settable = new Set(ENGINE_SET_FLAGS);
  const koddexWork = K.KODDEX.work.filter((w) => typeof w === 'object');
  const koddexGags = K.KODDEX.gags.filter((g) => typeof g === 'object');
  const media = Object.values(K.MEDIA ?? {}).flat();
  const all = [...K.DIALOGUE, ...K.EVENTS, ...K.ACTIONS, ...K.COUNTERMOVES, ...K.ENDINGS, ...K.KODDEX.sideProjects, ...koddexWork, ...koddexGags, ...media, ...(K.TUTORIAL ?? [])];
  for (const x of all) {
    for (const e of effectsOf(x)) for (const f of e.setFlags ?? []) settable.add(f);
    if (x.unlocks) settable.add(x.unlocks);
  }
  for (const f of ENGINE_SET_FLAGS) if (!declared.has(f)) warnings.push(`drapeau moteur "${f}" non déclaré dans FLAGS`);

  const check = (where, x) => {
    // Drapeaux déclarés
    const used = [];
    for (const c of conds(x)) used.push(...(c.flags ?? []), ...(c.notFlags ?? []));
    for (const ch of x.choices ?? []) if (ch.requires) used.push(...(ch.requires.flags ?? []), ...(ch.requires.notFlags ?? []));
    for (const p of x.epilogue ?? []) if (p.when) used.push(...(p.when.flags ?? []), ...(p.when.notFlags ?? []));
    for (const e of effectsOf(x)) used.push(...(e.setFlags ?? []), ...(e.clearFlags ?? []));
    if (x.unlocks) used.push(x.unlocks);
    for (const f of used) if (!declared.has(f)) errors.push(`${where} : drapeau "${f}" non déclaré`);
    // Locuteur
    if (x.speaker && !speakers.has(x.speaker)) errors.push(`${where} : locuteur "${x.speaker}" absent de characters.js`);
    // Satisfiabilité statique
    for (const c of conds(x)) for (const why of unsatisfiable(c, settable, { days: cfg.CAMPAIGN.days })) errors.push(`${where} : condition impossible (${why})`);
    if (x.whenAny && x.whenAny.every((c) => unsatisfiable(c, settable).length)) errors.push(`${where} : aucune branche de whenAny satisfiable`);
    // Fin demandée par un effet : doit exister
    for (const e of effectsOf(x)) if (e.ending && !K.ENDINGS.some((n) => n.id === e.ending)) errors.push(`${where} : fin "${e.ending}" inconnue`);
    // Noms réels
    for (const t of textsOf(x)) for (const re of realNames) if (re.test(t)) errors.push(`${where} : nom réel ${re} dans « ${t.slice(0, 60)} »`);
  };

  const ids = new Map();
  const uniq = (kind, x) => {
    if (!x.id) { errors.push(`${kind} sans id`); return; }
    const k = `${kind}:${x.id}`;
    if (ids.has(k)) errors.push(`${kind} "${x.id}" en double`);
    ids.set(k, true);
  };

  for (const d of K.DIALOGUE) {
    uniq('dialogue', d); check(`dialogue ${d.id}`, d);
    if (!d.lines?.length) errors.push(`dialogue ${d.id} : aucune réplique`);
  }
  for (const e of K.EVENTS) {
    uniq('event', e); check(`event ${e.id}`, e);
    if (e.day !== undefined && (e.day < 1 || e.day > cfg.CAMPAIGN.days)) errors.push(`event ${e.id} : jour ${e.day} hors calendrier`);
    if (e.phase && !PHASES.includes(e.phase)) errors.push(`event ${e.id} : phase "${e.phase}" inconnue`);
    if (e.day === undefined && !e.when) warnings.push(`event ${e.id} : aléatoire sans "when" (toujours éligible)`);
    if (e.choices?.length && e.choices.every((ch) => unsatisfiable(ch.requires, settable).length)) errors.push(`event ${e.id} : aucun choix satisfiable`);
    for (const [i, ch] of (e.choices ?? []).entries()) {
      for (const why of unsatisfiable(ch.requires, settable)) errors.push(`event ${e.id} choix ${i} : impossible (${why})`);
      if (!ch.label) errors.push(`event ${e.id} choix ${i} : sans libellé`);
    }
  }
  for (const a of K.ACTIONS) {
    uniq('action', a); check(`action ${a.id}`, a);
    if (!['legal', 'grey', 'illegal'].includes(a.legality)) errors.push(`action ${a.id} : légalité "${a.legality}" inconnue`);
    if (a.phase && !['afternoon', 'night'].includes(a.phase)) errors.push(`action ${a.id} : phase "${a.phase}" (attendu afternoon | night)`);
    // §4 / §13.G : le Risque ne vient que d'un acte vu → dans witnessed.effects, pas dans effects
    if ((a.effects?.risk ?? 0) > 0) warnings.push(`action ${a.id} : Risque dans effects (traité comme exposition : compte seulement si l'acte est vu ; préférer witnessed.effects)`);
    if (a.legality === 'illegal' && !a.witnessed) warnings.push(`action ${a.id} : illégale sans "witnessed" (aucune conséquence possible)`);
    if ((a.cost?.time ?? 1) > cfg.CAMPAIGN.afternoonTime + cfg.CAMPAIGN.unemployedBonusTime) errors.push(`action ${a.id} : coût ${a.cost.time} > créneaux disponibles`);
  }
  for (const m of K.COUNTERMOVES) { uniq('countermove', m); check(`countermove ${m.id}`, m); }
  for (const p of K.KODDEX.sideProjects) { uniq('koddex', p); check(`koddex ${p.id}`, p); }
  for (const w of koddexWork) { uniq('koddex', w); check(`koddex travail ${w.id}`, w); }
  for (const g of koddexGags) { uniq('gag', g); check(`gag ${g.id}`, g); }
  for (const [feed, items] of Object.entries(K.MEDIA ?? {})) {
    for (const m of items) {
      uniq(`media:${feed}`, m);
      check(`media ${feed} ${m.id}`, { ...m, speaker: undefined });
      if (m.author && !speakers.has(m.author)) warnings.push(`media ${feed} ${m.id} : auteur "${m.author}" absent de characters.js`);
    }
  }
  for (const t of K.TUTORIAL ?? []) { uniq('tutorial', t); check(`tutoriel ${t.id}`, t); }
  for (const e of K.ENDINGS) {
    uniq('ending', e); check(`ending ${e.id}`, e);
    if (!cfg.CAMPAIGN.endings.includes(e.id)) warnings.push(`ending ${e.id} : id non canonique (${cfg.CAMPAIGN.endings.join(', ')})`);
    if (!e.epilogue?.length) warnings.push(`ending ${e.id} : pas d'épilogue`);
  }
  for (const id of cfg.CAMPAIGN.endings) if (K.ENDINGS.length && !K.ENDINGS.some((e) => e.id === id)) warnings.push(`fin canonique "${id}" absente`);
  // Drapeaux déclarés mais jamais posés ni lus : du bruit
  const read = new Set(all.flatMap((x) => [...conds(x), ...(x.choices ?? []).map((c) => c.requires).filter(Boolean), ...(x.epilogue ?? []).map((p) => p.when).filter(Boolean)].flatMap((c) => [...(c.flags ?? []), ...(c.notFlags ?? [])])));
  for (const f of declared) if (!settable.has(f) && !read.has(f)) warnings.push(`drapeau "${f}" déclaré mais jamais utilisé`);
  if (incomplete) {
    const soft = errors.filter((e) => e.includes('jamais posé') || e.includes('aucune branche') || e.includes('aucun choix satisfiable'));
    return { errors: errors.filter((e) => !soft.includes(e)), warnings: [...soft.map((e) => `(contenu incomplet) ${e}`), ...warnings] };
  }
  return { errors, warnings };
}

// Contenu incomplet : une des collections du §14 est encore vide
export const isIncomplete = (K) => !K.DIALOGUE.length || !K.EVENTS.length || !K.ACTIONS.length || !K.COUNTERMOVES.length || !K.ENDINGS.length || !K.KODDEX.sideProjects.length;
