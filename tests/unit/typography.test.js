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
import * as codex from '../../src/content/codex.js';
import * as unlocks from '../../src/content/unlocks.js';
import * as workdays from '../../src/content/workdays.js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Typographie française du texte affiché (README « Typography ») : apostrophe ’, guillemets « » avec espace insécable,
// espace fine insécable avant ; ! ?, insécable avant :, points de suspension …
const MODULES = { characters, flags, actions, events, countermoves, dialogue, endings, koddex, media, night, intro, codex, unlocks, workdays };
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

// ── Code : chaînes affichées de l'interface, du HUD et des journaux de la nuit ──────────────────────────────────
// On lit les littéraux de chaîne du source (hors commentaires et hors ${…}) et on ne garde que le texte français affiché :
// pas les sélecteurs, le CSS, les shaders ni les identifiants.
const ROOT = join(import.meta.dirname, '..', '..');
const CODE_FILES = [
  'src/ui/index.js', 'src/ui/rules.js', 'src/ui/phone.js', 'src/ui/codex.js', 'src/ui/vignette.js', 'src/main.js', 'src/config.js',
  'src/sim/sim.js', 'src/sim/summary.js', 'src/sim/police.js', 'src/sim/campaign.js', 'src/sim/nightActions.js', 'src/sim/narrative.js',
];
const CODEY = /void main|gl_|precision |px\b|rgba?\(|var\(--|!important|=>|querySelector|^[#.[][\w-]|^[\w.:/#[\]=-]+$/;
const FRENCHY = /[A-Za-zÀ-ÿ]\\?'[A-Za-zÀ-ÿ]| [:;!?]|« | »|\.\.\.|[A-Za-zÀ-ÿ»)][!?;](?=\s|$)/;

// Littéraux de chaîne d'un source JS : [{ text, line }] (les morceaux de gabarit sont séparés par ${…}).
function stringLiterals(src) {
  const out = [];
  const stack = [];
  let i = 0;
  const line = (k) => src.slice(0, k).split('\n').length;
  const template = (start) => {
    let j = start;
    let buf = '';
    for (;;) {
      if (src[j] === '\\') { buf += src.slice(j, j + 2); j += 2; continue; }
      if (src[j] === '`') { out.push({ text: buf, line: line(start) }); return j + 1; }
      if (src.startsWith('${', j)) { out.push({ text: buf, line: line(start) }); stack.push(0); return j + 2; }
      buf += src[j++];
    }
  };
  while (i < src.length) {
    const c = src[i];
    if (src.startsWith('//', i)) { const j = src.indexOf('\n', i); i = j < 0 ? src.length : j; continue; }
    if (src.startsWith('/*', i)) { i = src.indexOf('*/', i) + 2; continue; }
    if (c === "'" || c === '"') {
      let j = i + 1;
      while (j < src.length && src[j] !== c && src[j] !== '\n') j += src[j] === '\\' ? 2 : 1;
      out.push({ text: src.slice(i + 1, j), line: line(i) });
      i = j + 1;
      continue;
    }
    if (c === '`') { i = template(i + 1); continue; }
    if (c === '}' && stack.length && stack.at(-1) === 0) { stack.pop(); i = template(i + 1); continue; }
    if (c === '{' && stack.length) stack[stack.length - 1]++;
    if (c === '}' && stack.length) stack[stack.length - 1]--;
    i++;
  }
  return out;
}

const CODE_RULES = [[/[A-Za-zÀ-ÿ]\\?'[A-Za-zÀ-ÿ]/, "apostrophe droite (utiliser ’)"], ...RULES.slice(1)];

describe('typographie des chaînes affichées par le code', () => {
  for (const file of CODE_FILES) {
    it(file, () => {
      const bad = [];
      for (const { text, line } of stringLiterals(readFileSync(join(ROOT, file), 'utf8'))) {
        if (!/[A-Za-zÀ-ÿ]/.test(text) || !FRENCHY.test(text) || CODEY.test(text)) continue;
        for (const [re, why] of CODE_RULES) if (re.test(text)) bad.push(`${file}:${line} : ${why} · ${text.slice(0, 80)}`);
      }
      expect(bad).toEqual([]);
    });
  }
  it('index.html', () => {
    const html = readFileSync(join(ROOT, 'index.html'), 'utf8').replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '');
    const text = html.replace(/<[^>]+>/g, ' ');
    const bad = CODE_RULES.filter(([re]) => re.test(text)).map(([, why]) => why);
    expect(bad).toEqual([]);
  });
});
