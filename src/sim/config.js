import { CONFIG } from '../config.js';

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
function merge(base, over) {
  for (const [k, v] of Object.entries(over)) base[k] = isObj(v) && isObj(base[k]) ? merge(base[k], v) : v;
  return base;
}

// Copie profonde de la config du jeu, avec des surcharges (les tableaux sont remplacés, pas fusionnés).
export function makeConfig(overrides = {}) {
  return merge(structuredClone(CONFIG), overrides);
}
