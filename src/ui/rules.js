// Lecture « humaine » de l'état de campagne : raisons d'indisponibilité, libellés, calendrier.
// Pur (pas de DOM) : testable en unitaire.
import { FLAGS } from '../content/flags.js';
import { CHARACTERS } from '../content/characters.js';
import { parseComparison } from '../sim/conditions.js';

export const WEEKDAYS = { mon: 'lundi', tue: 'mardi', wed: 'mercredi', thu: 'jeudi', fri: 'vendredi', sat: 'samedi', sun: 'dimanche' };
export const WEEKDAYS_SHORT = { mon: 'lun.', tue: 'mar.', wed: 'mer.', thu: 'jeu.', fri: 'ven.', sat: 'sam.', sun: 'dim.' };
export const PHASE_LABELS = { morning: 'Matin', afternoon: 'Après-midi', night: 'Nuit' };
export const LEGALITY = {
  legal: { label: 'Légal', hint: 'Ça ne coûte que du temps.' },
  grey: { label: 'Zone grise', hint: 'Légal… à peu près. Ça peut se savoir.' },
  illegal: { label: 'Illégal', hint: 'Seulement si personne ne vous voit.' },
};
const STAT_NAMES = { sleep: 'Sommeil', asso: 'Asso', risk: 'Risque', job: 'Job', dossier: 'Dossier' };
const OP_WORDS = { '>=': '≥', '<=': '≤', '>': '>', '<': '<', '==': '=', '=': '=', '!=': '≠' };

// Drapeaux dont le simple nom dévoilerait un secret (README « Spoiler rule ») : on reste vague.
const SPOILERS = new Set([
  'seen_complaisance', 'seen_tipoff', 'roster_known', 'traitor_known', 'traitor_recruited', 'met_waiter',
  'legal_view', 'bombance_rumour', 'corruption_proof', 'regis_courted', 'waiter_informant',
]);
const isSpoiler = (f) => SPOILERS.has(f) || f.startsWith('read_') || f.startsWith('tatie_mail_');

export const WITNESS_NAMES = {
  klaas: 'Klaas', hilde: 'Hilde', seb_nico: 'Seb et Nico', gaystapo: 'Seb et Nico', waiter: 'le serveur', serveur: 'le serveur',
  customers: 'des clients', biloute: 'Biloute', dede: 'Dédé', ghislain: 'Ghislain', police: 'la police', koddex: 'Stéphane',
};
export const witnessName = (id) => WITNESS_NAMES[id] || CHARACTERS[id]?.name || id;

// Pourquoi cette condition n'est pas remplie ? → liste de phrases courtes (vide = ok)
export function explain(cond, c) {
  const why = [];
  if (!cond) return why;
  const S = c.state;
  if (cond.day) {
    const [lo, hi] = Array.isArray(cond.day) ? cond.day : [cond.day, cond.day];
    if (S.day < lo) why.push(`À partir du jour ${lo}`);
    else if (S.day > hi) why.push(`Trop tard (jusqu’au jour ${hi})`);
  }
  for (const f of cond.flags ?? []) {
    if (c.has(f)) continue;
    why.push(isSpoiler(f) || !FLAGS[f] ? 'Il vous manque encore quelque chose' : `D’abord : ${FLAGS[f]}`);
  }
  if ((cond.notFlags ?? []).some((f) => c.has(f))) why.push('Plus possible, ou déjà fait');
  for (const [k, e] of Object.entries(cond.stats ?? {})) {
    const { op, value } = parseComparison(e);
    const v = Math.round(S.stats[k] ?? 0);
    if (!c.check({ stats: { [k]: e } }, false)) why.push(`${STAT_NAMES[k] ?? k} ${OP_WORDS[op]} ${value} (vous : ${v})`);
  }
  if (cond.hidden && !c.check({ hidden: cond.hidden }, false)) why.push("Le moment n’est pas venu");
  return [...new Set(why)];
}

// Toutes les actions d'après-midi, disponibles ou non, avec la raison.
// « Comment l'obtenir » (§12e.3) : texte de l'auteur pour une condition qui est une conversation à avoir (ou un fait à
// provoquer) : le champ `howTo` de l'action, ou une table HOWTO { drapeau: texte } exportée par un fichier de contenu.
const HOWTO = Object.assign({}, ...Object.values(import.meta.glob('../content/*.js', { eager: true })).map((m) => m.HOWTO ?? {}));
export function howToFor(a, c) {
  const missing = (a.requires?.flags ?? []).filter((f) => !c.has(f));
  if (!missing.length) return null;
  if (typeof a.howTo === 'string') return a.howTo;
  if (a.howTo && typeof a.howTo === 'object') return missing.map((f) => a.howTo[f]).find(Boolean) ?? null;
  return missing.map((f) => HOWTO[f]).find(Boolean) ?? null;
}

export function afternoonMenu(c) {
  const S = c.state;
  const avail = new Set(c.availableActions().map((a) => a.id));
  return c.content.ACTIONS.filter((a) => (a.phase ?? 'afternoon') === 'afternoon').map((a) => {
    const cost = a.cost?.time ?? 1;
    let why = [];
    if (!avail.has(a.id)) {
      if (a.once && S.seen.actions.includes(a.id)) why = ['Déjà fait'];
      else {
        why = explain(a.requires, c);
        // une conversation à avoir : on dit comment, à la place de la condition brute
        const how = howToFor(a, c);
        if (how) why = [`💬 ${how}`, ...why.filter((w) => !/^D’abord|^Il vous manque/.test(w))];
      }
      if (!why.length && cost > S.timeLeft) why = [`Il faut ${cost} créneau${cost > 1 ? 'x' : ''} (reste ${S.timeLeft})`];
      if (!why.length) why = ['Indisponible pour le moment'];
    }
    return { action: a, cost, available: avail.has(a.id), why };
  });
}

// Prochain événement fixe du calendrier (aujourd'hui compris)
export function upcomingEvent(c) {
  const fixed = c.content.EVENTS.filter((e) => typeof e.day === 'number').sort((a, b) => a.day - b.day);
  return fixed.find((e) => e.day > c.state.day || (e.day === c.state.day && !c.state.seen.events.includes(e.id))) ?? null;
}
export const eventDays = (c) => new Set(c.content.EVENTS.filter((e) => typeof e.day === 'number').map((e) => e.day));
