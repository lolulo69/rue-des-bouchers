import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { REAL } from './realNames.js';

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
