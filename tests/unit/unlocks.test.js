import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { UNLOCKS } from '../../src/content/unlocks.js';
import { ACTIONS } from '../../src/content/actions.js';
import { FLAGS } from '../../src/content/flags.js';
import { ENGINE_SET_FLAGS } from '../../src/sim/contentLint.js';
import * as events from '../../src/content/events.js';
import * as countermoves from '../../src/content/countermoves.js';
import * as dialogue from '../../src/content/dialogue.js';
import * as koddex from '../../src/content/koddex.js';
import * as media from '../../src/content/media.js';

// Les verbes de départ (§12b.B) ne sont jamais verrouillés
const STARTING_ACTIONS = ['night_photo', 'night_police', 'night_ask_waiter', 'night_bucket'];
const KEYS = ['B', 'L'];
const actionIds = new Set(ACTIONS.map((a) => a.id));

const settable = new Set(ENGINE_SET_FLAGS);
const walk = (v) => {
  if (Array.isArray(v)) v.forEach(walk);
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) {
    if (k === 'setFlags' && Array.isArray(x)) x.forEach((f) => settable.add(f));
    else if (k === 'unlocks' && typeof x === 'string') settable.add(x);
    else walk(x);
  }
};
[{ ACTIONS }, events, countermoves, dialogue, koddex, media].forEach(walk);
for (const m of readFileSync(join(import.meta.dirname, '..', '..', 'src/sim/campaign.js'), 'utf8').matchAll(/setFlag\('(\w+)'\)/g)) settable.add(m[1]);

describe('unlocks.js (§12b.B, contrat §14)', () => {
  it('ids uniques, carte « Nouveau » complète et courte', () => {
    const ids = UNLOCKS.map((u) => u.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const u of UNLOCKS) {
      expect(u.card.title, u.id).toMatch(/^Nouveau : /);
      expect(u.card.text.length, u.id).toBeLessThanOrEqual(160);
      expect(u.card.hint, u.id).toBeTruthy();
    }
  });

  it('touches et actions connues ; un verbe de départ n’est jamais verrouillé', () => {
    for (const u of UNLOCKS) {
      for (const k of u.unlocks.keys ?? []) expect(KEYS, `${u.id} → ${k}`).toContain(k);
      for (const a of u.unlocks.actions ?? []) {
        expect(actionIds.has(a), `${u.id} → ${a}`).toBe(true);
        expect(STARTING_ACTIONS, `${u.id} verrouille ${a}`).not.toContain(a);
      }
    }
  });

  it('une action n’est débloquée que par une seule entrée', () => {
    const seen = new Map();
    for (const u of UNLOCKS) for (const a of u.unlocks.actions ?? []) {
      expect(seen.has(a), `${a} : ${seen.get(a)} et ${u.id}`).toBe(false);
      seen.set(a, u.id);
    }
  });

  it('drapeaux déclarés et réellement posés quelque part', () => {
    for (const u of UNLOCKS) for (const f of [...(u.when?.flags ?? []), ...(u.when?.notFlags ?? [])]) {
      expect(FLAGS, `${u.id} → ${f}`).toHaveProperty(f);
      expect(settable.has(f), `${u.id} → ${f} jamais posé`).toBe(true);
    }
  });

  it('§12b : au moins un nouveau verbe toutes les deux nuits jusqu’au J10 (par le seul calendrier)', () => {
    // Une entrée « au calendrier » : pas de drapeau requis, ou seulement des rencontres du premier jour
    const scheduled = UNLOCKS.filter((u) => u.when?.day && (u.unlocks.keys?.length || u.unlocks.actions?.length)
      && (u.when.flags ?? []).every((f) => ['met_jeremie', 'called_police'].includes(f)));
    for (const [lo, hi] of [[1, 2], [3, 4], [5, 6], [7, 8], [9, 10]]) {
      const hit = scheduled.filter((u) => u.when.day[0] >= lo && u.when.day[0] <= hi).map((u) => u.id);
      expect(hit.length, `nuits ${lo}–${hi}`).toBeGreaterThan(0);
    }
  });
});
