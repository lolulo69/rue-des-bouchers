// Rebondissements de nuit (GAME_DESIGN §12b, contrat §14, §13.J) : forme du contenu de src/content/twists.js.
import { describe, it, expect } from 'vitest';
import { TWISTS } from '../../src/content/twists.js';
import { FLAGS } from '../../src/content/flags.js';
import { ACTIONS } from '../../src/content/actions.js';
import { MEDIA } from '../../src/content/media.js';

const SIM_KEYS = ['crowd', 'noise', 'closeDelay', 'tables', 'witnesses', 'darkness', 'rain', 'exhaustOff', 'corridorBlocked', 'events', 'opportunities', 'dog', 'windows'];
const GAMEPLAY = ['crowd', 'noise', 'closeDelay', 'tables', 'witnesses', 'darkness', 'rain', 'exhaustOff', 'corridorBlocked'];
const NIGHT = [20 * 60 + 30, 25 * 60 + 30];
const FIXED_DAYS = [4, 6, 9, 10, 11, 13];
// Verbes natifs de la nuit sans entrée dans actions.js (même id que l'exemple unlocks.js du §14)
const NATIVE = ['night_db'];
const flagsOf = (c = {}) => [...(c.flags ?? []), ...(c.notFlags ?? [])];
const mediaIds = new Set([...MEDIA.whatsapp, ...MEDIA.press, ...MEDIA.social].map((m) => m.id));

describe('twists.js', () => {
  it('≥ 16 rebondissements dans le réservoir, ids uniques', () => {
    expect(TWISTS.filter((t) => t.pool).length).toBeGreaterThanOrEqual(16);
    const ids = TWISTS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('nuits fixes du calendrier (J4, J6, J9, J10, J11, J13) : chacune a au moins une variante sans condition', () => {
    for (const d of FIXED_DAYS) {
      const fixed = TWISTS.filter((t) => t.day === d);
      expect(fixed.length, `J${d}`).toBeGreaterThan(0);
      expect(fixed.some((t) => !t.when), `J${d} : repli sans condition`).toBe(true);
    }
    for (const t of TWISTS) expect(!!t.pool !== (t.day !== undefined), t.id).toBe(true);
  });

  it('assez de rebondissements sans condition pour remplir toutes les autres nuits sans répétition', () => {
    const nights = 13 - FIXED_DAYS.length; // la nuit 14 n'a pas lieu (la campagne finit à la commission)
    expect(TWISTS.filter((t) => t.pool && !t.when).length).toBeGreaterThanOrEqual(nights);
  });

  it.each(TWISTS.map((t) => [t.id, t]))('%s : contrat §14 (intro, sim qui change la nuit, lignes, props, suites)', (id, t) => {
    expect(t.title, id).toBeTruthy();
    expect(t.intro.length, `${id} intro`).toBeLessThanOrEqual(300);
    expect(Object.keys(t.sim).every((k) => SIM_KEYS.includes(k)), `${id} : clés sim`).toBe(true);
    // §12d : fenêtres naturelles { at, minutes, turns, text }, dans la nuit, témoins connus du contrat
    for (const w of t.sim.windows ?? []) {
      expect(w.at >= 20 * 60 + 30 && w.at <= 26 * 60 + 30, `${id} : fenêtre à ${w.at}`).toBe(true);
      expect(w.minutes > 0 && w.minutes <= 5, `${id} : durée de fenêtre`).toBe(true);
      for (const x of w.turns) expect(['klaas', 'seb_nico', 'waiter', 'dede', 'ghislain', 'customers', 'patrol'], `${id} : ${x}`).toContain(x);
      expect(w.text.length > 0 && w.text.length <= 100, `${id} : texte de fenêtre`).toBe(true);
    }
    expect(GAMEPLAY.some((k) => t.sim[k] !== undefined) || (t.sim.events ?? []).some((e) => e.simEffect), `${id} : la nuit change`).toBe(true);
    for (const e of t.sim.events ?? []) {
      expect(e.at, `${id} heure`).toBeGreaterThanOrEqual(NIGHT[0]);
      expect(e.at, `${id} heure`).toBeLessThanOrEqual(NIGHT[1]);
      expect(e.text, id).toBeTruthy();
    }
    for (const o of t.sim.opportunities ?? []) expect(NATIVE.includes(o) || ACTIONS.some((a) => a.id === o), `${id} → ${o}`).toBe(true);
    for (const w of t.sim.witnesses ?? []) expect(w.id && ['street', 'terrace', 'window'].includes(w.at), `${id} témoin`).toBe(true);
    for (const k of ['barks', 'klaas', 'recap']) expect(t.lines[k]?.length, `${id} lines.${k}`).toBeGreaterThan(0);
    expect(t.props.length, `${id} props`).toBeGreaterThan(0);
    for (const f of [...flagsOf(t.when), ...(t.after?.setFlags ?? [])]) expect(FLAGS, `${id} → ${f}`).toHaveProperty(f);
    for (const m of t.after?.media ?? []) expect(mediaIds.has(m), `${id} → média ${m}`).toBe(true);
  });
});
