import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CODEX } from '../../src/content/codex.js';
import { FLAGS } from '../../src/content/flags.js';
import { CHARACTERS } from '../../src/content/characters.js';
import { ENGINE_SET_FLAGS } from '../../src/sim/contentLint.js';
import * as actions from '../../src/content/actions.js';
import * as events from '../../src/content/events.js';
import * as countermoves from '../../src/content/countermoves.js';
import * as dialogue from '../../src/content/dialogue.js';
import * as koddex from '../../src/content/koddex.js';
import * as media from '../../src/content/media.js';

const { characters, places, rules } = CODEX.carnet;
const cards = [...characters, ...places, ...rules];
const condFlags = (w = {}) => [...(w.flags ?? []), ...(w.notFlags ?? [])];
const cardFlags = (c) => [...condFlags(c.when), ...(c.updates ?? []).flatMap((u) => condFlags(u.when))];

// Drapeaux que le jeu peut réellement poser : setFlags / unlocks du contenu + ceux du moteur
const settable = new Set(ENGINE_SET_FLAGS);
const walk = (v) => {
  if (Array.isArray(v)) v.forEach(walk);
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) {
    if (k === 'setFlags' && Array.isArray(x)) x.forEach((f) => settable.add(f));
    else if (k === 'unlocks' && typeof x === 'string') settable.add(x);
    else walk(x);
  }
};
[actions, events, countermoves, dialogue, koddex, media].forEach(walk);
// … et ceux que le moteur de campagne pose en dur (ex. tatie_leaked_plan)
for (const m of readFileSync(join(import.meta.dirname, '..', '..', 'src/sim/campaign.js'), 'utf8').matchAll(/setFlag\('(\w+)'\)/g)) settable.add(m[1]);

describe('codex.js (Carnet, aide, à propos)', () => {
  it('fiches : ids uniques, titre et texte', () => {
    const ids = [...cards, ...CODEX.help].map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const c of [...cards, ...CODEX.help]) {
      expect(c.title, c.id).toBeTruthy();
      expect(c.text, c.id).toBeTruthy();
    }
  });

  it('une fiche par personnage, avec position et citation', () => {
    expect(characters.map((c) => c.speaker).sort()).toEqual(Object.keys(CHARACTERS).sort());
    for (const c of characters) {
      expect(c.position, c.id).toBeTruthy();
      expect(c.quote, c.id).toBeTruthy();
      expect(c.quote.length, c.id).toBeLessThanOrEqual(220);
    }
  });

  it('lieux et règles demandés', () => {
    expect(places.map((p) => p.id)).toEqual(expect.arrayContaining(['p_rue', 'p_place', 'p_baignerie', 'p_estaminet', 'p_bombance']));
    expect(rules.map((r) => r.id)).toEqual(expect.arrayContaining(['r_22h', 'r_six', 'r_zones', 'r_samedi', 'r_police', 'r_preuves']));
  });

  it('chaque drapeau est déclaré et peut être posé', () => {
    for (const c of cards) for (const f of cardFlags(c)) {
      expect(FLAGS, `${c.id} → ${f}`).toHaveProperty(f);
      expect(settable.has(f), `${c.id} → ${f} n'est jamais posé`).toBe(true);
    }
  });

  it('règle des spoilers : les faits verrouillés ne sont que dans des updates gardées', () => {
    const base = (id) => { const c = cards.find((x) => x.id === id); return [c.title, c.text, c.position, c.quote].join(' '); };
    expect(base('c_serveur')).not.toMatch(/Théo/);
    expect(base('c_regis')).not.toMatch(/traître|renseign|bloc/i);
    expect(base('c_lemaire')).not.toMatch(/café|waterzooi|cinq minutes/i);
    expect(base('p_rue')).not.toMatch(/Trou/);
    expect(base('p_bombance')).not.toMatch(/\bbar\b/i);
  });

  it('aide : au plus 10 cartes courtes', () => {
    expect(CODEX.help.length).toBeGreaterThan(0);
    expect(CODEX.help.length).toBeLessThanOrEqual(10);
    for (const h of CODEX.help) expect(h.text.length, h.id).toBeLessThanOrEqual(320);
  });

  it('à propos : l’avertissement de fiction du README, mot pour mot', () => {
    const norm = (s) => s.replace(/[’']/g, "'").replace(/[\s  ]+/g, ' ').replace(/\*\*/g, '').trim();
    const readme = readFileSync(join(import.meta.dirname, '..', '..', 'README.md'), 'utf8');
    const disclaimer = norm(readme.split('\n').filter((l) => l.startsWith('>')).map((l) => l.slice(1)).join(' '));
    expect(disclaimer).toMatch(/^Œuvre de fiction\./);
    expect(CODEX.about.lines.map(norm)).toContain(disclaimer);
    expect(CODEX.about.lines.join(' ')).toMatch(/Lucas Lefort/);
    expect(CODEX.about.lines.join(' ')).toMatch(/three\.js/);
    expect(CODEX.about.lines.join(' ')).toMatch(/IA/);
  });
});
