import { describe, it, expect } from 'vitest';
import { KODDEX, PROMPTS_PER_MORNING } from '../../src/content/koddex.js';
import { FLAGS } from '../../src/content/flags.js';
import { CHARACTERS } from '../../src/content/characters.js';

// Drapeaux cités dans une condition ou des effets §14
const flagsOf = (o = {}) => [...(o.flags ?? []), ...(o.notFlags ?? []), ...(o.setFlags ?? []), ...(o.clearFlags ?? [])];

describe('koddex.js (§3, §14)', () => {
  const all = [...KODDEX.work, ...KODDEX.sideProjects, ...KODDEX.gags];

  it('ids uniques', () => {
    const ids = all.map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('chaque drapeau est déclaré', () => {
    for (const x of all) {
      const used = [...flagsOf(x.requires), ...flagsOf(x.when), ...flagsOf(x.effects), ...(x.unlocks ? [x.unlocks] : [])];
      for (const f of used) expect(FLAGS, `${x.id} → ${f}`).toHaveProperty(f);
    }
  });

  it('chaque speaker existe', () => {
    const speakers = [...KODDEX.gags.map((g) => g.speaker), ...KODDEX.sideProjects.flatMap((p) => p.lines.map((l) => l.speaker))];
    for (const s of speakers) expect(CHARACTERS, s).toHaveProperty(s);
  });

  it('travail : gain de Job + résultat', () => {
    for (const w of KODDEX.work) {
      expect(typeof w.job, w.id).toBe('number');
      expect(w.result, w.id).toBeTruthy();
    }
    expect(KODDEX.work.filter((w) => w.job > 0 && !w.once && !w.requires).length).toBeGreaterThanOrEqual(PROMPTS_PER_MORNING);
  });

  it('projets perso : coût tenable en une matinée, drapeau, répliques', () => {
    for (const p of KODDEX.sideProjects) {
      expect(p.cost.prompts, p.id).toBeGreaterThanOrEqual(1);
      expect(p.cost.prompts, p.id).toBeLessThanOrEqual(PROMPTS_PER_MORNING);
      expect(p.job, p.id).toBeLessThan(0);
      expect(['legal', 'grey', 'illegal']).toContain(p.legality);
      if (p.legality === 'illegal') expect(p.risk, p.id).toBeGreaterThan(0);
      expect(p.lines.length, p.id).toBeGreaterThan(0);
      expect(p.result, p.id).toBeTruthy();
    }
  });

  it('les projets du §3 sont tous là', () => {
    const unlocked = KODDEX.sideProjects.map((p) => p.unlocks);
    for (const f of ['proj_db_logger', 'proj_whatsapp_bot', 'proj_scraper', 'scraper_boasts', 'proj_wifi_cracker', 'proj_fake_reviews']) {
      expect(unlocked).toContain(f);
    }
  });

  it('les gags récurrents sont là (politesse, to-do en Rust, vibes)', () => {
    const text = KODDEX.gags.flatMap((g) => g.lines).join(' ');
    expect(text).toMatch(/excuse/);
    expect(text).toMatch(/Rust/);
    expect(text).toMatch(/vibe/);
  });
});
