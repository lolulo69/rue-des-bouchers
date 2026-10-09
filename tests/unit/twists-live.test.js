import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { TWISTS } from '../../src/content/twists.js';

// §12e.2 / §13.O : chaque twist est vu et entendu dans la rue 3D. L'audit de l'agent art (qa/twists-live.md) doit couvrir
// TOUS les twists du contenu, marqués ✔, avec leur capture d'avant le premier moment (qa/art-live/twist-<id>-setup.jpg).
const ROOT = join(import.meta.dirname, '..', '..');
const audit = existsSync(join(ROOT, 'qa/twists-live.md')) ? readFileSync(join(ROOT, 'qa/twists-live.md'), 'utf8') : '';
const rows = Object.fromEntries(audit.split('\n').filter((l) => l.startsWith('| ') && !l.startsWith('| Twist') && !l.startsWith('|---'))
  .map((l) => [l.split('|')[1].trim(), l]));

describe('twists vus et entendus (qa/twists-live.md)', () => {
  it('l’audit annonce 0 twist « texte seulement »', () => {
    expect(audit).toMatch(/Text-only twists: 0 \//);
  });
  it.each(TWISTS.map((t) => [t.id]))('%s : dans l’audit, ✔, avec sa capture', (id) => {
    expect(rows[id], `${id} absent du tableau de qa/twists-live.md`).toBeTruthy();
    expect(rows[id], `${id} pas marqué ✔`).toMatch(/✔/);
    expect(existsSync(join(ROOT, `qa/art-live/twist-${id}-setup.jpg`)), `capture qa/art-live/twist-${id}-setup.jpg`).toBe(true);
  });
});
