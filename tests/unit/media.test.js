import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { MEDIA } from '../../src/content/media.js';
import { FLAGS } from '../../src/content/flags.js';
import { CHARACTERS, PLACES, WHATSAPP_GROUP } from '../../src/content/characters.js';

const flagsOf = (o = {}) => [...(o.flags ?? []), ...(o.notFlags ?? []), ...(o.setFlags ?? []), ...(o.clearFlags ?? [])];
const ENDINGS = ['legal_victory', 'negotiated_peace', 'scandal', 'custody', 'moving_out', 'fired', 'turncoat', 'the_return'];

describe('media.js (fil du téléphone)', () => {
  const all = [...MEDIA.whatsapp, ...MEDIA.press, ...MEDIA.social];

  it('volumes minimum', () => {
    expect(MEDIA.whatsapp.length).toBeGreaterThanOrEqual(40);
    expect(MEDIA.press.length).toBeGreaterThanOrEqual(15);
    expect(MEDIA.social.length).toBeGreaterThanOrEqual(20);
  });

  it('ids uniques, texte présent', () => {
    const ids = all.map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const x of all) expect(x.text, x.id).toBeTruthy();
  });

  it('chaque drapeau est déclaré', () => {
    for (const x of all) {
      for (const f of [...flagsOf(x.when), ...flagsOf(x.effects), ...(x.setFlags ?? [])]) expect(FLAGS, `${x.id} → ${f}`).toHaveProperty(f);
    }
  });

  it('chaque auteur existe', () => {
    for (const x of all) {
      const ok = x.author in CHARACTERS || x.author in PLACES || (x.author === 'reviewer' && x.handle);
      expect(ok, `${x.id} → ${x.author}`).toBeTruthy();
    }
  });

  it('une une de presse par fin', () => {
    for (const e of ENDINGS) expect(MEDIA.press.some((p) => p.ending === e), e).toBe(true);
    for (const p of MEDIA.press) expect(p.headline, p.id).toBeTruthy();
  });

  it('le nom du groupe WhatsApp n’est jamais en dur', () => {
    const src = readFileSync(join(import.meta.dirname, '..', '..', 'src', 'content', 'media.js'), 'utf8');
    expect(src).not.toContain(WHATSAPP_GROUP);
  });
});
