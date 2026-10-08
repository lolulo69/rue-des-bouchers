import { describe, it, expect } from 'vitest';
import { WORKDAYS } from '../../src/content/workdays.js';
import { CHARACTERS } from '../../src/content/characters.js';
import { FLAGS } from '../../src/content/flags.js';

const { commute, office, home, koddex } = WORKDAYS;
const lined = [...commute, ...office, ...home.calls, ...koddex.office, ...koddex.home];
const all = [...lined, ...home.distractions];
const condFlags = (w = {}) => [...(w.flags ?? []), ...(w.notFlags ?? [])];

describe('workdays.js (§12b.D : bureau ou télétravail)', () => {
  it('ids uniques', () => {
    const ids = all.map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('répliques présentes, ≤ 220 caractères, locuteurs connus', () => {
    for (const x of lined) {
      expect(x.lines?.length, x.id).toBeGreaterThan(0);
      for (const l of x.lines) expect(l.length, x.id).toBeLessThanOrEqual(220);
      if (x.speaker) expect(CHARACTERS, x.id).toHaveProperty(x.speaker);
    }
    for (const x of [...koddex.office, ...koddex.home]) expect(x.speaker).toBe('clode');
    for (const x of home.calls) expect(x.speaker).toBe('stephane');
  });
  it('distractions : un choix toujours possible, titre et texte', () => {
    for (const d of home.distractions) {
      expect(d.title && d.text, d.id).toBeTruthy();
      expect(d.choices.some((c) => !c.requires), d.id).toBe(true);
    }
  });
  it('drapeaux déclarés', () => {
    for (const x of all) {
      const fs = [...condFlags(x.when), ...(x.effects?.setFlags ?? []), ...(x.choices ?? []).flatMap((c) => [...condFlags(c.requires), ...(c.effects?.setFlags ?? [])])];
      for (const f of fs) expect(FLAGS, `${x.id} → ${f}`).toHaveProperty(f);
    }
  });
  it('la fille de Pilou n’est jamais en scène (§12b.D)', () => {
    const text = JSON.stringify(WORKDAYS);
    expect(text).not.toMatch(/\bsa fille\b|\bma fille\b|\bvotre fille\b/i);
  });
});
