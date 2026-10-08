import { describe, it, expect } from 'vitest';
import * as characters from '../../src/content/characters.js';
import * as flags from '../../src/content/flags.js';
import * as actions from '../../src/content/actions.js';
import * as events from '../../src/content/events.js';
import * as countermoves from '../../src/content/countermoves.js';
import * as dialogue from '../../src/content/dialogue.js';
import * as endings from '../../src/content/endings.js';
import * as koddex from '../../src/content/koddex.js';
import * as media from '../../src/content/media.js';
import * as night from '../../src/content/night.js';
import * as intro from '../../src/content/intro.js';

// Typographie française du texte affiché (README « Typography ») : apostrophe ’, guillemets « » avec espace insécable,
// espace fine insécable avant ; ! ?, insécable avant :, points de suspension …
const MODULES = { characters, flags, actions, events, countermoves, dialogue, endings, koddex, media, night, intro };
const RULES = [
  [/[A-Za-zÀ-ÿ]'[A-Za-zÀ-ÿ]/, "apostrophe droite (utiliser ’)"],
  [/« |«(?![ ])/, '« sans espace insécable après'],
  [/ »|(?<![ ])»/, '» sans espace insécable avant'],
  [/[ ][;!?:]/, 'espace ordinaire avant ; ! ? : (insécable attendue)'],
  [/[A-Za-zÀ-ÿ»)][;!?](?=\s|$)/, 'pas d’espace avant ; ! ?'],
  [/\.\.\./, '... (utiliser …)'],
];

function strings(value, path, out) {
  if (typeof value === 'string') out.push([path, value]);
  else if (Array.isArray(value)) value.forEach((v, i) => strings(v, `${path}[${i}]`, out));
  else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) strings(v, `${path}.${k}`, out);
  return out;
}

describe('typographie du contenu', () => {
  for (const [name, mod] of Object.entries(MODULES)) {
    it(name, () => {
      const bad = [];
      for (const [path, s] of strings(mod, name, [])) {
        if (!/[ ]/.test(s) && !/'/.test(s) && !/\.\.\./.test(s)) continue; // ids, conditions, clés
        for (const [re, why] of RULES) if (re.test(s)) bad.push(`${path} : ${why} · ${s.slice(0, 80)}`);
      }
      expect(bad).toEqual([]);
    });
  }
});
