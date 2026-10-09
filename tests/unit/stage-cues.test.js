import { describe, it, expect } from 'vitest';
import { STAGE_CUES, STAGE_ANCHORS, isStageCue, stageCueError } from '../../src/scene/stageCues.js';

// §12e.6 : chaque ligne de nuit porte un repère de scène ; la liste des repères est publiée par src/scene.
describe('repères de scène (STAGE_CUES)', () => {
  it('chaque repère dit quelle scène il joue, avec une description', () => {
    for (const [id, c] of Object.entries(STAGE_CUES)) {
      expect(typeof c.stage, id).toBe('string');
      expect(c.desc.length, id).toBeGreaterThan(5);
      expect(['live', 'stub'], id).toContain(c.status);
    }
  });
  it('valide les repères des lignes (motifs twist / event / witness, ancres, durée)', () => {
    expect(isStageCue('pass:scooter')).toBe(true);
    expect(isStageCue('twist:busker:0')).toBe(true);
    expect(isStageCue('event:r_influencer')).toBe(true);
    expect(isStageCue('witness:klaas')).toBe(true);
    expect(isStageCue('pass:licorne')).toBe(false);
    expect(stageCueError({ cue: 'npc:couple_argue', at: 'under_window', dur: 20 })).toBeNull();
    expect(stageCueError({ cue: 'npc:couple_argue', at: 'lune' })).toMatch(/ancre/);
    expect(stageCueError({ cue: 'pass:scooter', dur: -1 })).toMatch(/durée/);
    expect(stageCueError(undefined)).toMatch(/pas de repère/);
    expect(STAGE_ANCHORS).toContain('end_A');
  });
});
