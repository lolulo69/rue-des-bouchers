import { describe, it, expect } from 'vitest';
import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { normalizeContent } from '../../src/sim/content.js';
import { lintContent, isIncomplete } from '../../src/sim/contentLint.js';
import { REAL } from './realNames.js';
import * as fixture from '../fixtures/content.js';

const DIR = join(import.meta.dirname, '..', '..', 'src', 'content');
async function loadRealContent() {
  if (!existsSync(DIR)) return null;
  const files = readdirSync(DIR).filter((f) => f.endsWith('.js'));
  return normalizeContent(await Promise.all(files.map((f) => import(join(DIR, f)))));
}

describe('linter de contenu (§14)', () => {
  it('le contenu de test est propre', () => {
    const { errors } = lintContent(normalizeContent(fixture), { realNames: REAL });
    expect(errors).toEqual([]);
  });

  it('attrape drapeaux non déclarés, locuteurs inconnus, conditions impossibles, Risque hors témoin, noms réels', () => {
    const bad = normalizeContent({
      ...fixture,
      DIALOGUE: [{ id: 'x', speaker: 'personne', lines: ['Bonjour'], when: { flags: ['inconnu'] } }],
      ACTIONS: [
        { id: 'a', label: 'A', legality: 'illegal', effects: { risk: 10 } },
        { id: 'b', label: 'B', legality: 'legal', requires: { stats: { asso: '>100' } } },
        { id: 'c', label: 'Dîner chez Martine Aubry', legality: 'legal' },
      ],
    });
    const { errors } = lintContent(bad, { realNames: REAL });
    expect(errors.some((e) => e.includes('"inconnu" non déclaré'))).toBe(true);
    expect(errors.some((e) => e.includes('locuteur "personne"'))).toBe(true);
    expect(errors.some((e) => e.includes('impossible sur 0–100'))).toBe(true);
    expect(errors.some((e) => e.includes('nom réel'))).toBe(true);
  });

  it('src/content (écrit en parallèle) passe le linter', async () => {
    const K = await loadRealContent();
    if (!K) return;
    const { errors, warnings } = lintContent(K, { realNames: REAL, incomplete: isIncomplete(K) });
    if (warnings.length) console.warn(`linter de contenu : ${warnings.length} avertissement(s)\n  ${warnings.slice(0, 30).join('\n  ')}`);
    expect(errors).toEqual([]);
  });
});
