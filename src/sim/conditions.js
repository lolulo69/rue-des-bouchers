// Conditions et effets du contenu narratif (GAME_DESIGN §14), évalués contre l'état de campagne.
//   condition : { day: [min, max], phase, flags: [], notFlags: [], stats: { asso: '>=40' }, hidden: { corruption: '>50' }, chance }
//   effets    : { sleep, asso, risk, job, dossier, hostility, corruption, setFlags, clearFlags, evidence, ending }

export const STAT_KEYS = ['sleep', 'asso', 'risk', 'job', 'dossier'];
export const HIDDEN_KEYS = ['hostility', 'corruption'];
export const PHASES = ['morning', 'afternoon', 'night'];
const OPS = {
  '>=': (a, b) => a >= b, '<=': (a, b) => a <= b, '>': (a, b) => a > b, '<': (a, b) => a < b,
  '==': (a, b) => a === b, '=': (a, b) => a === b, '!=': (a, b) => a !== b,
};

// "'>=40'" → { op: '>=', value: 40 } ; un nombre seul vaut '=='
export function parseComparison(expr) {
  if (typeof expr === 'number') return { op: '==', value: expr };
  const m = /^\s*(>=|<=|==|!=|=|>|<)\s*(-?\d+(?:\.\d+)?)\s*$/.exec(String(expr));
  if (!m) throw new Error(`comparaison invalide : ${JSON.stringify(expr)}`);
  return { op: m[1], value: Number(m[2]) };
}
export const compare = (v, expr) => { const { op, value } = parseComparison(expr); return OPS[op](v, value); };

// ctx : { day, phase, flags: Set, stats: {}, hidden: {} } ; rng optionnel pour `chance` (sans rng : chance ignorée)
export function evalCondition(cond, ctx, rng) {
  if (!cond) return true;
  if (cond.day) {
    const [lo, hi] = Array.isArray(cond.day) ? cond.day : [cond.day, cond.day];
    if (ctx.day < lo || ctx.day > hi) return false;
  }
  if (cond.phase) {
    const ph = Array.isArray(cond.phase) ? cond.phase : [cond.phase];
    if (!ph.includes(ctx.phase)) return false;
  }
  for (const f of cond.flags ?? []) if (!ctx.flags.has(f)) return false;
  for (const f of cond.notFlags ?? []) if (ctx.flags.has(f)) return false;
  for (const [k, e] of Object.entries(cond.stats ?? {})) if (!compare(ctx.stats[k] ?? 0, e)) return false;
  for (const [k, e] of Object.entries(cond.hidden ?? {})) if (!compare(ctx.hidden[k] ?? 0, e)) return false;
  if (cond.chance !== undefined && rng && !rng.chance(cond.chance)) return false;
  return true;
}

// Peut-on satisfaire cette condition sur [0, 100], avec les drapeaux qu'au moins un effet sait poser ?
// Renvoie la liste des raisons d'impossibilité (vide = satisfiable).
export function unsatisfiable(cond, settable, { days = 14 } = {}) {
  const why = [];
  if (!cond) return why;
  if (cond.day) {
    const [lo, hi] = Array.isArray(cond.day) ? cond.day : [cond.day, cond.day];
    if (lo > hi || hi < 1 || lo > days) why.push(`jours impossibles ${JSON.stringify(cond.day)}`);
  }
  if (cond.phase) for (const p of [cond.phase].flat()) if (!PHASES.includes(p)) why.push(`phase inconnue "${p}"`);
  for (const f of cond.flags ?? []) {
    if (!settable.has(f)) why.push(`drapeau "${f}" jamais posé`);
    if ((cond.notFlags ?? []).includes(f)) why.push(`drapeau "${f}" à la fois requis et interdit`);
  }
  for (const [k, e] of [...Object.entries(cond.stats ?? {}), ...Object.entries(cond.hidden ?? {})]) {
    if (![...STAT_KEYS, ...HIDDEN_KEYS].includes(k)) { why.push(`stat inconnue "${k}"`); continue; }
    let ok = false;
    try { for (let v = 0; v <= 100 && !ok; v++) ok = compare(v, e); } catch (err) { why.push(err.message); continue; }
    if (!ok) why.push(`${k} ${e} impossible sur 0–100`);
  }
  if (cond.chance !== undefined && !(cond.chance > 0)) why.push('chance nulle');
  return why;
}
