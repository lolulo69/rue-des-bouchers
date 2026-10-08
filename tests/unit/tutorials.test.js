import { describe, it, expect } from 'vitest';
import { TOOL_TUTORIALS, TUTORIAL_EVENTS } from '../../src/content/tutorials.js';
import { UNLOCKS } from '../../src/content/unlocks.js';
import { ACTIONS } from '../../src/content/actions.js';

const STARTING = ['move', 'window', 'photo', 'police', 'waiter', 'bucket', 'dossier', 'night_menu'];
const actionIds = new Set(ACTIONS.map((a) => a.id));

describe('tutorials.js (§12b.B : un repère en main par outil)', () => {
  it('ids uniques ; 1 à 3 étapes de 2 lignes au plus ; une félicitation', () => {
    const ids = TOOL_TUTORIALS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of TOOL_TUTORIALS) {
      expect(t.steps.length, t.id).toBeGreaterThanOrEqual(1);
      expect(t.steps.length, t.id).toBeLessThanOrEqual(3);
      for (const s of t.steps) {
        expect(s.text.length, t.id).toBeLessThanOrEqual(140);
        if (/\{key\}/.test(s.text)) expect(s.key, t.id).toBeTruthy();
        if (/\{pad\}/.test(s.text)) expect(s.pad, t.id).toBeTruthy();
        expect(s.text, t.id).not.toMatch(/\{(?!key\}|pad\})\w+\}/);
      }
      expect(t.congrats?.length, t.id).toBeGreaterThan(0);
      expect(t.congrats.length, t.id).toBeLessThanOrEqual(120);
    }
  });

  it('chaque étape se valide par un événement connu (TUTORIAL_EVENTS ou action:<id d’ACTIONS>)', () => {
    for (const t of TOOL_TUTORIALS) for (const s of t.steps) {
      if (s.done.startsWith('action:')) expect(actionIds.has(s.done.slice(7)), `${t.id} → ${s.done}`).toBe(true);
      else expect(TUTORIAL_EVENTS, `${t.id} → ${s.done}`).toHaveProperty(s.done);
    }
  });

  it('les outils de départ et chaque outil verrouillable ont leur repère', () => {
    const tools = new Set(TOOL_TUTORIALS.map((t) => t.tool));
    for (const s of STARTING) expect(tools.has(s), s).toBe(true);
    for (const u of UNLOCKS.filter((x) => x.unlocks.keys?.length || x.unlocks.actions?.length)) {
      const t = TOOL_TUTORIALS.find((x) => x.trigger.unlock === u.id);
      expect(t, u.id).toBeTruthy();
      expect(t.tool).toBe(u.id);
    }
  });

  it('la première nuit est étalée : au moins 10 minutes entre deux repères', () => {
    const n1 = TOOL_TUTORIALS.filter((t) => t.trigger.night === 1 || t.trigger.unlock === 'db_reading').map((t) => t.trigger.after).sort((a, b) => a - b);
    expect(n1.length).toBeGreaterThanOrEqual(8);
    for (let i = 1; i < n1.length; i++) expect(n1[i] - n1[i - 1], `${n1[i - 1]} → ${n1[i]}`).toBeGreaterThanOrEqual(10);
  });
});
