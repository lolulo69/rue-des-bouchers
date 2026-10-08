import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Contraste AA (WCAG 2.1) des couleurs de l'interface de jour : texte ≥ 4,5, éléments non textuels (focus) ≥ 3.
const css = readFileSync(join(import.meta.dirname, '..', '..', 'src', 'ui', 'ui.css'), 'utf8');
const tok = Object.fromEntries([...css.matchAll(/--(ui-[\w-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2]]));
const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const v = (x) => (x.startsWith('#') ? x : tok[x]);

// [texte, fond, minimum, où]
const PAIRS = [
  ['ui-ink', 'ui-card', 4.5, 'texte des cartes'],
  ['ui-mute', 'ui-card', 4.5, 'texte secondaire, raisons grisées'],
  ['ui-mute', 'ui-card2', 4.5, 'texte secondaire sur fond crème foncé'],
  ['ui-mute', '#eadfcd', 4.5, 'raison d’une action grisée'],
  ['ui-brick-ink', 'ui-card', 4.5, 'surtitres (kicker), noms dans les bulles'],
  ['#ffffff', 'ui-legal', 4.5, 'étiquette « Légal »'],
  ['#ffffff', 'ui-grey', 4.5, 'étiquette « Zone grise »'],
  ['#ffffff', 'ui-illegal', 4.5, 'étiquette « Illégal »'],
  ['ui-ink', 'ui-gold', 4.5, 'boutons principaux'],
  ['#4a5e3d', 'ui-card', 4.5, 'indices d’effets'],
  ['ui-focus', 'ui-card', 3, 'anneau de focus sur carte'],
  ['ui-gold', '#2a1714', 3, 'anneau de focus (halo doré) sur fond sombre'],
  ['#ffffff', '#c0392b', 4.5, 'pastilles de non-lus'],
];

describe('ui : contrastes AA', () => {
  it('les jetons existent', () => {
    for (const k of ['ui-ink', 'ui-card', 'ui-card2', 'ui-mute', 'ui-gold', 'ui-legal', 'ui-grey', 'ui-illegal', 'ui-brick-ink', 'ui-focus']) expect(tok[k], k).toMatch(/^#/);
  });
  it.each(PAIRS)('%s sur %s ≥ %s (%s)', (fg, bg, min) => {
    expect(ratio(v(fg), v(bg))).toBeGreaterThanOrEqual(min);
  });
});
