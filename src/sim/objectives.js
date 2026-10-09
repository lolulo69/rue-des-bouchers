// Objectifs du soir (GAME_DESIGN §12c.5, §13.M ; données : src/content/objectives.js, format au §14).
// Pur, sans DOM. Le moteur de campagne (campaign.js) choisit 2 à 4 objectifs à l'entrée de la nuit, puis les coche :
//   · depuis le journal de la nuit (sim.state.journal) : photo, relevé, appel, action de nuit, serveur — bots et tests compris ;
//   · depuis les événements du jeu 3D (tutoEvent de game.js : dossier ouvert, menu de nuit, déplacement…) ;
//   · depuis les drapeaux de campagne (done: { flag }).
// Le conseil « au lit » (bedtime, §12c.5) se calcule ici aussi : bedtimeHint().

const NIGHT_KEYS = ['twist', 'newTool', 'onDuty'];
const prio = (o) => o.priority ?? 5;

// when + clés de nuit → vrai/faux. ctx : { check(cond), twist, newTools: [], onDuty: [] }
export function objectiveFits(o, ctx) {
  const w = o.when ?? {};
  if (w.twist && w.twist !== ctx.twist) return false;
  if (w.newTool && !(ctx.newTools ?? []).includes(w.newTool)) return false;
  if (w.onDuty && !(ctx.onDuty ?? []).includes(w.onDuty)) return false;
  const rest = Object.fromEntries(Object.entries(w).filter(([k]) => !NIGHT_KEYS.includes(k)));
  return ctx.check(rest);
}

// 2 à 4 objectifs : priorité décroissante (ordre du fichier à égalité), un seul par `group`, au plus `maxInfo` infos.
// Moins de `min` possibles : on rend ce qu'il y a.
export function pickObjectives(list, ctx, { max = 4, maxInfo = 1 } = {}) {
  const fit = list.map((o, i) => [o, i]).filter(([o]) => objectiveFits(o, ctx)).sort((a, b) => prio(b[0]) - prio(a[0]) || a[1] - b[1]);
  const out = [];
  const groups = new Set();
  let infos = 0;
  for (const [o] of fit) {
    if (out.length >= max) break;
    if (o.group && groups.has(o.group)) continue;
    if (o.stance === 'info' && infos >= maxInfo) continue;
    if (o.group) groups.add(o.group);
    if (o.stance === 'info') infos++;
    out.push(o);
  }
  return out;
}

// done = { event, ...filtres } contre ev = { name, ...charge }
export function matchDone(done, ev) {
  if (!done?.event || done.event !== ev.name) return false;
  for (const k of ['overLimit', 'late', 'corridor']) if (done[k] && !ev[k]) return false;
  if (done.table !== undefined && ev.table !== done.table) return false;
  if (done.min !== undefined && !((ev.db ?? -Infinity) >= done.min)) return false;
  if (done.patrol !== undefined && ev.patrol !== done.patrol) return false;
  if (done.asso !== undefined && !!ev.asso !== !!done.asso) return false;
  return true;
}

// Journal de la nuit → événements au format de TUTORIAL_EVENTS, avec la charge que les filtres demandent.
// from : index de départ dans le journal ; → { events, cursor }
export function journalEvents(sim, from = 0) {
  const S = sim.state;
  const late = sim.cfg.RULES.terraceCloseHour * 60;
  const events = [];
  for (let i = from; i < S.journal.length; i++) {
    const e = S.journal[i];
    if (e.type === 'evidence') {
      const ev = S.evidence.find((x) => x.id === e.evidenceId) ?? {};
      if (e.evType === 'photo') {
        const corridor = e.kind === 'corridor' || e.kind === 'corridor_blocked';
        events.push({ name: 'photo_taken', overLimit: e.kind === 'over', late: e.t >= late, corridor, table: e.tableId ? sim.table(e.tableId)?.label : undefined });
        if (e.kind === 'corridor') events.push({ name: 'corridor_measured' });
      } else if (e.evType === 'db') events.push({ name: 'db_taken', db: ev.db });
    } else if (e.type === 'call') events.push({ name: 'police_called', patrol: e.patrolId, asso: !!e.asso });
    else if (e.type === 'night-action') events.push({ name: `action:${e.id}` });
    else if (e.type === 'action' && e.action === 'waiter') events.push({ name: 'waiter_asked' });
  }
  return { events, cursor: S.journal.length };
}

// ── Conseil « au lit » (§12c.5) ─────────────────────────────────────────
// Après fastAfter (22h30), quand l'essentiel de la nuit est fait (objectifs cochables cochés, rien en cours : pas de
// patrouille en route, pas de moment de twist imminent) ou dès que le Sommeil est bas. Pas plus d'une fois toutes les
// `every` minutes de jeu ; s'efface si quelque chose de neuf arrive (busy).
// hints = BEDTIME de objectives.js : [{ id, why: 'done' | 'tired', text }] ; mem = { lastAt, lastId } (état de la nuit)
export function bedtimeHint(sim, { objectives = [], busy = null, hints = [], mem = {}, sleeping = sim.state.sleeping } = {}) {
  const B = sim.cfg.RULES.bedtime;
  const S = sim.state;
  if (sleeping || S.ended || S.min < B.after || busy) return null;
  const tired = S.sleep <= B.tiredSleep;
  const todo = objectives.filter((o) => o.stance !== 'info' && !o.done);
  const why = tired ? 'tired' : !todo.length ? 'done' : null;
  if (!why) return null;
  const pool = hints.filter((h) => h.why === why);
  if (!pool.length) return null;
  // Nouvelle apparition (au plus une toutes les `every` minutes, ou quand la raison change) : une autre variante
  if (mem.lastAt === undefined || mem.why !== why || S.min - mem.lastAt >= B.every) {
    const i = Math.floor(S.min) % pool.length;
    const pick = pool[i].id === mem.lastId && pool.length > 1 ? pool[(i + 1) % pool.length] : pool[i];
    Object.assign(mem, { lastAt: S.min, why, lastId: pick.id });
  }
  if (S.min - mem.lastAt > B.show) return null; // affiché `show` minutes, puis discret jusqu'à la prochaine fois
  const h = pool.find((x) => x.id === mem.lastId) ?? pool[0];
  return { id: h.id, why, text: h.text };
}
