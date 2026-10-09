import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { OBJECTIVES } from '../../src/content/objectives.js';
import { TUTORIAL_EVENTS } from '../../src/content/tutorials.js';
import { TWISTS } from '../../src/content/twists.js';
import { UNLOCKS } from '../../src/content/unlocks.js';
import { ACTIONS } from '../../src/content/actions.js';
import { FLAGS } from '../../src/content/flags.js';
import { ENGINE_SET_FLAGS } from '../../src/sim/contentLint.js';
import * as events from '../../src/content/events.js';
import * as countermoves from '../../src/content/countermoves.js';
import * as dialogue from '../../src/content/dialogue.js';
import * as koddex from '../../src/content/koddex.js';
import * as media from '../../src/content/media.js';

const STANCES = ['legal', 'grey', 'illegal', 'info'];
const FILTERS = { photo_taken: ['overLimit', 'late', 'table', 'corridor'], db_taken: ['min'], police_called: ['patrol', 'asso'] };
const actionIds = new Set(ACTIONS.map((a) => a.id));
const tableLabels = new Set(TWISTS.flatMap((t) => (t.sim?.tables ?? []).map((x) => x.label)));

const settable = new Set(ENGINE_SET_FLAGS);
const walk = (v) => {
  if (Array.isArray(v)) v.forEach(walk);
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) {
    if (k === 'setFlags' && Array.isArray(x)) x.forEach((f) => settable.add(f));
    else if (k === 'unlocks' && typeof x === 'string') settable.add(x);
    else walk(x);
  }
};
[{ ACTIONS }, { TWISTS }, events, countermoves, dialogue, koddex, media].forEach(walk);
for (const m of readFileSync(join(import.meta.dirname, '..', '..', 'src/sim/campaign.js'), 'utf8').matchAll(/setFlag\('(\w+)'\)/g)) settable.add(m[1]);

describe('objectives.js (§12c.5 : « Objectifs du soir »)', () => {
  it('au moins 40, ids uniques, ≤ 90 caractères, posture valide', () => {
    expect(OBJECTIVES.length).toBeGreaterThanOrEqual(40);
    const ids = OBJECTIVES.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const o of OBJECTIVES) {
      expect(o.text.length, o.id).toBeLessThanOrEqual(90);
      expect(STANCES, o.id).toContain(o.stance);
    }
  });

  it('chaque objectif se coche par un événement connu ou un drapeau posable ; une info ne se coche pas', () => {
    for (const o of OBJECTIVES) {
      if (o.stance === 'info') { expect(o.done, o.id).toBeNull(); continue; }
      const d = o.done;
      if (d.flag) {
        expect(FLAGS, `${o.id} → ${d.flag}`).toHaveProperty(d.flag);
        expect(settable.has(d.flag), `${o.id} → ${d.flag} jamais posé`).toBe(true);
        continue;
      }
      if (d.event.startsWith('action:')) expect(actionIds.has(d.event.slice(7)), `${o.id} → ${d.event}`).toBe(true);
      else expect(TUTORIAL_EVENTS, `${o.id} → ${d.event}`).toHaveProperty(d.event);
      for (const k of Object.keys(d).filter((x) => x !== 'event')) expect(FILTERS[d.event] ?? [], `${o.id} → filtre ${k}`).toContain(k);
      if (d.table) expect(tableLabels.has(d.table), `${o.id} → table « ${d.table} »`).toBe(true);
    }
  });

  it('conditions : twist, nouvel outil, patrouille et drapeaux connus', () => {
    const twists = new Set(TWISTS.map((t) => t.id));
    const unlocks = new Set(UNLOCKS.map((u) => u.id));
    for (const o of OBJECTIVES) {
      const w = o.when ?? {};
      if (w.twist) expect(twists.has(w.twist), o.id).toBe(true);
      if (w.newTool) expect(unlocks.has(w.newTool), o.id).toBe(true);
      if (w.onDuty) expect(['lemaire', 'benali'], o.id).toContain(w.onDuty);
      for (const f of [...(w.flags ?? []), ...(w.notFlags ?? [])]) expect(FLAGS, `${o.id} → ${f}`).toHaveProperty(f);
    }
  });

  it('chaque twist et chaque outil verrouillable a son objectif', () => {
    for (const t of TWISTS) expect(OBJECTIVES.some((o) => o.when?.twist === t.id), t.id).toBe(true);
    for (const u of UNLOCKS.filter((x) => x.unlocks.keys?.length || x.unlocks.actions?.length)) {
      expect(OBJECTIVES.some((o) => o.when?.newTool === u.id), u.id).toBe(true);
    }
  });

  it('les objectifs illégaux sont des options, avec leur risque', () => {
    for (const o of OBJECTIVES.filter((x) => x.stance === 'illegal')) expect(o.text, o.id).toMatch(/option|illégal|prix|risque/i);
  });
});
