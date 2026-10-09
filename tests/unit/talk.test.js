import { describe, it, expect } from 'vitest';
import { TALK } from '../../src/content/talk.js';
import { CHARACTERS } from '../../src/content/characters.js';
import { FLAGS } from '../../src/content/flags.js';

const WHO = ['jeremie', 'tatie', 'seb_nico', 'waiter', 'dede', 'ghislain', 'customers', 'patrol', 'klaas'];
const condFlags = (w = {}) => [...(w.flags ?? []), ...(w.notFlags ?? [])];

describe('talk.js (§12e.3 : parler aux gens, la nuit)', () => {
  it('ids uniques, chaque personne a au moins une conversation', () => {
    const ids = TALK.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const w of WHO) expect(TALK.some((t) => t.who === w), w).toBe(true);
  });
  it('forme : 1 à 3 échanges, 2 à 3 choix, locuteurs connus, textes courts', () => {
    for (const t of TALK) {
      expect(WHO, t.id).toContain(t.who);
      expect(t.exchanges.length, t.id).toBeGreaterThanOrEqual(1);
      expect(t.exchanges.length, t.id).toBeLessThanOrEqual(3);
      for (const ex of t.exchanges) {
        if (ex.speaker !== null) expect(CHARACTERS, `${t.id} → ${ex.speaker}`).toHaveProperty(ex.speaker);
        else expect(t.who, t.id).toBe('customers');
        expect(ex.say.length, t.id).toBeLessThanOrEqual(220);
        expect(ex.choices.length, t.id).toBeGreaterThanOrEqual(2);
        expect(ex.choices.length, t.id).toBeLessThanOrEqual(3);
        for (const ch of ex.choices) {
          expect(ch.label.length, `${t.id} : ${ch.label}`).toBeLessThanOrEqual(70);
          if (ch.reply) expect(ch.reply.length, t.id).toBeLessThanOrEqual(220);
          if (ch.sim) expect(ch.sim, t.id).toBe('waiter');
        }
      }
    }
  });
  it('drapeaux déclarés', () => {
    for (const t of TALK) {
      const fs = [...condFlags(t.when), ...t.exchanges.flatMap((ex) => ex.choices.flatMap((c) => [...condFlags(c.requires), ...(c.effects?.setFlags ?? [])]))];
      for (const f of fs) expect(FLAGS, `${t.id} → ${f}`).toHaveProperty(f);
    }
  });
  it('parler permet de poser les drapeaux dont l’histoire a besoin', () => {
    const set = new Set(TALK.flatMap((t) => t.exchanges.flatMap((ex) => ex.choices.flatMap((c) => c.effects?.setFlags ?? []))));
    for (const f of ['met_jeremie', 'joined_rounds', 'met_tatie', 'met_seb_nico', 'talked_waiter', 'asked_waiter', 'met_waiter', 'met_klaas']) expect(set.has(f), f).toBe(true);
  });
});
