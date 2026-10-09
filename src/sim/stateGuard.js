// Garde d'état des lignes de nuit (GAME_DESIGN §13.L, vocabulaire documenté au §14) : une ligne dont le texte dépend de
// la situation porte `state: {…}` ; elle n'est choisie que si la garde tient À L'INSTANT où elle s'affiche.
// Pur, sans DOM. Utilisé par narrative.js, pacing.js et twistNight.js.
//
// Vocabulaire (toutes les clés sont facultatives, en ET) :
//   tablesOut      comparaison sur le nombre de tables dehors (tous restos)        ex. '>0', '0', '>=3'
//   estaminetOut   comparaison sur les tables dehors de l'estaminet
//   customers      comparaison sur les clients dehors (tables dehors + groupes debout)
//   after / before heure de jeu 'HH:MM' (une heure < 12 = après minuit)            ex. after: '22:00'
//   rain           true : il pleut (ou a plu il y a moins de 30 min) · false : sec
//   exhaust        true : la gaine tourne · false : elle est arrêtée (après 23h30, panne, carton)
//   saturday       true / false
//   dark           true : rue dans le noir (panne) · false
//   present        [ids] tous présents · absent : [ids] tous absents
//                  ids : serveur, patrouille, klaas, biloute, chat, debout
import { compare } from './conditions.js';
import { weatherNow } from './weather.js';

export const textOf = (line) => (line == null ? line : typeof line === 'string' ? line : line.text);
export const guardOf = (line) => (line && typeof line === 'object' ? line.state ?? null : null);

const clock = (hhmm) => { const [h, m] = String(hhmm).split(':').map(Number); return (h < 12 ? h + 24 : h) * 60 + (m || 0); };

// Instantané de la nuit (ce que les gardes regardent) ; aussi utilisé par le vérificateur (scripts/coherence-check.js)
export function nightSnapshot(sim) {
  const S = sim.state;
  const tables = (S.tables ?? []).filter((t) => t.out);
  const standing = sim.activeStanding ? sim.activeStanding().length : 0;
  const raining = !!weatherNow?.(S) || (S.twistRainedAt !== undefined && S.min - S.twistRainedAt < 30);
  const exhaust = S.min < (sim.cfg?.NOISE?.exhaustOffMinute ?? 23 * 60 + 30) && !S.exhaustOff && !S.exhaustBlocked;
  const police = S.police?.phase;
  return {
    min: S.min,
    tablesOut: tables.length,
    estaminetOut: tables.filter((t) => t.restId === 'bernadette').length,
    props: sim.twist?.props ?? [], // accessoires du twist présents (sim.twist.props, datés par twistNight.js)
    standing,
    customers: tables.length + standing,
    rain: raining,
    exhaust,
    saturday: sim.day?.key === 'sat',
    dark: (S.darkness ?? 0) >= 0.5,
    present: {
      serveur: !!sim.waiterOnDuty?.(),
      patrouille: police === 'walking' || police === 'onsite',
      klaas: !!sim.klaasAwake?.(),
      biloute: !!sim.dogActive?.(),
      chat: !!sim.catPresent?.(),
      debout: standing > 0,
    },
  };
}

// La garde tient-elle ? `at` : un sim (createSim) ou un instantané (nightSnapshot)
export function holds(guard, at) {
  if (!guard) return true;
  const s = at?.present ? at : nightSnapshot(at);
  for (const k of ['tablesOut', 'estaminetOut', 'customers']) if (guard[k] !== undefined && !compare(s[k], guard[k])) return false;
  if (guard.after !== undefined && s.min < clock(guard.after)) return false;
  if (guard.before !== undefined && s.min >= clock(guard.before)) return false;
  for (const k of ['rain', 'exhaust', 'saturday', 'dark']) if (guard[k] !== undefined && !!guard[k] !== s[k]) return false;
  for (const id of guard.present ?? []) if (!s.present[id]) return false;
  for (const id of guard.absent ?? []) if (s.present[id]) return false;
  return true;
}

// Les lignes d'une réserve dont la garde tient (sans sim : toutes)
export function usable(list, sim) {
  if (!list || !sim?.state || !list.some(guardOf)) return list; // aucune ligne gardée : rien à évaluer (chemin courant)
  const snap = nightSnapshot(sim);
  return list.filter((l) => holds(guardOf(l), snap));
}
