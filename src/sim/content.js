// Chargement du contenu narratif (src/content/*.js, §14). Le moteur ne fait que normaliser :
// accepte un objet { FLAGS, CHARACTERS, DIALOGUE, EVENTS, ACTIONS, COUNTERMOVES, KODDEX, ENDINGS } ou une liste de modules.
const KEYS = ['FLAGS', 'CHARACTERS', 'DIALOGUE', 'EVENTS', 'ACTIONS', 'COUNTERMOVES', 'KODDEX', 'ENDINGS'];

export function normalizeContent(modules) {
  const merged = {};
  for (const m of Array.isArray(modules) ? modules : [modules]) {
    for (const k of KEYS) if (m?.[k] !== undefined) merged[k] = m[k];
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
  };
}

// Vite : import.meta.glob('../content/*.js', { eager: true }) → { chemin: module }
export const contentFromGlob = (glob) => normalizeContent(Object.values(glob));
export const isEmptyContent = (c) => !c.ENDINGS.length && !c.ACTIONS.length && !c.EVENTS.length;
