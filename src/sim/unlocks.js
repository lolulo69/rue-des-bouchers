// Outils qui se débloquent (§12b B, contrat §14 « unlocks.js ») : UNLOCKS = [{ id, unlocks: { keys, actions }, when, card }].
// Un id d'action ou une touche cité par au moins un déblocage est verrouillé tant qu'aucun de ses déblocages n'est acquis ;
// tout le reste est toujours disponible. Sans UNLOCKS dans le contenu, rien n'est verrouillé.
import { evalCondition } from './conditions.js';

export function createUnlocks(UNLOCKS = []) {
  const gatedActions = new Map(); // actionId → [unlock ids]
  const gatedKeys = new Map();
  for (const u of UNLOCKS) {
    for (const a of u.unlocks?.actions ?? []) gatedActions.set(a, [...(gatedActions.get(a) ?? []), u.id]);
    for (const k of u.unlocks?.keys ?? []) gatedKeys.set(k.toUpperCase(), [...(gatedKeys.get(k.toUpperCase()) ?? []), u.id]);
  }
  const has = (unlocked, ids) => ids.some((id) => unlocked.includes(id));
  return {
    // Nouveaux déblocages dont la condition tient maintenant (dans l'ordre du contenu)
    due: (ctx, unlocked) => UNLOCKS.filter((u) => !unlocked.includes(u.id) && evalCondition(u.when, ctx, null)),
    action: (id, unlocked, opportunities = []) => !gatedActions.has(id) || has(unlocked, gatedActions.get(id)) || opportunities.includes(id),
    key: (k, unlocked, opportunityKeys = []) => !gatedKeys.has(k.toUpperCase()) || has(unlocked, gatedKeys.get(k.toUpperCase())) || opportunityKeys.includes(k.toUpperCase()),
    gatedActions, gatedKeys,
  };
}
