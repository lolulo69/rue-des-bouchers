// Chargement du contenu narratif (src/content/*.js, §14). Le moteur ne fait que normaliser :
// accepte un objet { FLAGS, CHARACTERS, DIALOGUE, EVENTS, ACTIONS, COUNTERMOVES, KODDEX, ENDINGS } ou une liste de modules.
const KEYS = ['FLAGS', 'CHARACTERS', 'DIALOGUE', 'EVENTS', 'ACTIONS', 'COUNTERMOVES', 'KODDEX', 'ENDINGS', 'MEDIA', 'INTRO_CARDS', 'TUTORIAL', 'PROMPTS_PER_MORNING', 'WHATSAPP_GROUP', 'PLACES', 'TWISTS', 'UNLOCKS'];
// night.js : textes de la nuit (aboiements, cloche, carnet de Klaas…), regroupés sous NIGHT
const NIGHT_KEYS = ['BARKS', 'BELL', 'KLAAS_NOTEBOOK', 'NIGHT_END', 'POLICE_LINES', 'RECAP_HEADLINES', 'WAITER_LINES', 'WITNESS_LINES'];

export function normalizeContent(modules) {
  const merged = {};
  for (const m of Array.isArray(modules) ? modules : [modules]) {
    for (const k of KEYS) if (m?.[k] !== undefined) merged[k] = m[k];
    for (const k of NIGHT_KEYS) if (m?.[k] !== undefined) (merged.NIGHT ??= {})[k] = m[k];
  }
  const chars = merged.CHARACTERS ?? {};
  return {
    FLAGS: merged.FLAGS ?? {},
    // characters.js : objet { id: {...} } ou tableau [{ id, ... }]
    CHARACTERS: Array.isArray(chars) ? Object.fromEntries(chars.map((c) => [c.id, c])) : chars,
    DIALOGUE: merged.DIALOGUE ?? [],
    EVENTS: merged.EVENTS ?? [],
    ACTIONS: merged.ACTIONS ?? [],
    COUNTERMOVES: merged.COUNTERMOVES ?? [],
    KODDEX: { work: [], sideProjects: [], gags: [], ...(merged.KODDEX ?? {}) },
    ENDINGS: merged.ENDINGS ?? [],
    MEDIA: { whatsapp: [], press: [], social: [], ...(merged.MEDIA ?? {}) },
    INTRO_CARDS: merged.INTRO_CARDS ?? [],
    TUTORIAL: merged.TUTORIAL ?? [],
    NIGHT: merged.NIGHT ?? {},
    PROMPTS_PER_MORNING: merged.PROMPTS_PER_MORNING,
    WHATSAPP_GROUP: merged.WHATSAPP_GROUP,
    PLACES: merged.PLACES,
    TWISTS: merged.TWISTS ?? [], // v1.1 (§12b) : rebondissements de nuit
    UNLOCKS: merged.UNLOCKS ?? [], // v1.1 (§12b) : outils débloqués
  };
}

// Vite : import.meta.glob('../content/*.js', { eager: true }) → { chemin: module }
export const contentFromGlob = (glob) => normalizeContent(Object.values(glob));
export const isEmptyContent = (c) => !c.ENDINGS.length && !c.ACTIONS.length && !c.EVENTS.length;
