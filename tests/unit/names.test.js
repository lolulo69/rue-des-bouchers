import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// GAME_DESIGN §0 : aucun nom réel (commerces, personnalités, voisins) dans le code ni la page.
const REAL = [
  /Ch'tite Brigitte/i, /Bouchers Bien [ÉE]lev[ée]s/i, /Bloempot/i, /\bBocal\b/, /\bL'Adresse\b/, /Truffe et Baguette/i,
  /\bCup\b/, /La Ripaille/i, /Martine Aubry/i, /Deslandes/i, /La Voix du Nord(?!iste)/i, /Claude Code/i,
  /J[ée]r[ée]my\b/, /\bKlaus\b/,
];

const ROOT = join(import.meta.dirname, '..', '..');
const files = (dir) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? files(p) : [p];
});

describe('politique de noms (§0)', () => {
  const targets = [...files(join(ROOT, 'src')), join(ROOT, 'index.html')];
  it.each(targets.map((p) => [p.slice(ROOT.length + 1), p]))('%s', (_, path) => {
    const text = readFileSync(path, 'utf8');
    for (const re of REAL) expect(text, `${re} trouvé`).not.toMatch(re);
  });
});
