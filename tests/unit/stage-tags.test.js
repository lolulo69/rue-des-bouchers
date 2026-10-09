import { describe, it, expect } from 'vitest';
import { stageCueError } from '../../src/scene/stageCues.js';
import * as night from '../../src/content/night.js';
import { TWISTS } from '../../src/content/twists.js';
import { EVENTS } from '../../src/content/events.js';

// §12e.6 « ça existe ou ça n'existe pas » : chaque ligne de nuit porte un repère de scène valide (src/scene/stageCues.js).
const ok = (stage, where) => expect(stageCueError(stage), where).toBeNull();

describe('repères de scène sur les lignes de nuit (§12e.6)', () => {
  it('chaque ligne AMBIENT', () => {
    for (const a of night.AMBIENT) ok(a.stage, `AMBIENT.${a.id}`);
  });
  it('chaque moment de twist (événements puis fenêtres, numérotés à la suite)', () => {
    for (const t of TWISTS) {
      [...(t.sim?.events ?? []), ...(t.sim?.windows ?? [])].forEach((x, i) => {
        ok(x.stage, `${t.id}[${i}]`);
        expect(x.stage.cue, t.id).toBe(`twist:${t.id}:${i}`);
      });
    }
  });
  it('chaque événement de nuit à heure fixe', () => {
    for (const e of EVENTS.filter((x) => x.at != null)) {
      ok(e.stage, e.id);
      expect(e.stage.cue).toBe(`event:${e.id}`);
    }
  });
  it('chaque réserve de lignes a son repère (LINE_STAGES), sous-clé par sous-clé', () => {
    for (const [group, rule] of Object.entries(night.LINE_STAGES)) {
      const pool = night[group];
      expect(pool, group).toBeTruthy();
      const keys = Array.isArray(pool) ? [] : Object.keys(pool).filter((k) => k !== 'names');
      const cueOf = (k) => (typeof rule === 'string' ? rule : rule[k] ?? rule.default);
      for (const k of keys.length ? keys : ['*']) {
        const cue = cueOf(k);
        expect(cue, `${group}.${k}`).toBeTruthy();
        if (cue !== 'sim') ok({ cue }, `${group}.${k}`);
      }
    }
    for (const g of ['BARKS', 'KLAAS_NOTEBOOK', 'WITNESS_LINES', 'WAITER_LINES', 'BELL', 'POLICE_LINES', 'STREET_LINES', 'PHONE_PINGS', 'CLATTER']) {
      expect(night.LINE_STAGES, g).toHaveProperty(g);
    }
  });
});
