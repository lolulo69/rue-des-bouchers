import { describe, it, expect } from 'vitest';
import { humMix, sceneFrom, loadMix, saveMix, busGain, DEFAULT_MIX, MIX_KEY, MUSIC_FOR } from '../../src/audio/mix.js';

// GAME_DESIGN §12c.1 / §13.K : la hotte ne s'entend que chez Pilou ; mélangeur Musique / Ambiance / Effets persisté.
const mem = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)) }; };
const loud = (o) => { const h = humMix(o); return h.motor + h.hiss; };

describe('audio · la hotte (humMix)', () => {
  it('fort à LA fenêtre du séjour, de moins en moins vers le fond de l’appartement', () => {
    const order = [
      loud({ room: 'window', dWindow: 0.3 }),
      loud({ room: 'living', dWindow: 0.8 }),
      loud({ room: 'living', dWindow: 4.5 }),
      loud({ room: 'corridor' }),
      loud({ room: 'bedroom' }),
      loud({ room: 'daughter' }),
    ];
    for (let i = 1; i < order.length; i++) expect(order[i], `rang ${i}`).toBeLessThan(order[i - 1]);
    expect(humMix({ room: 'bedroom' }).cutoff, 'étouffée dans la chambre').toBeLessThan(humMix({ room: 'living', dWindow: 0.8 }).cutoff);
  });
  it('dans la rue : un léger souffle juste sous la gaine, rien ailleurs', () => {
    const under = humMix({ room: null, dDuct: 0.5 });
    expect(under.hiss).toBeGreaterThan(0);
    expect(under.hiss + under.motor).toBeLessThan(loud({ room: 'daughter' }) * 3);
    expect(loud({ room: null, dDuct: 3.6 })).toBe(0);
    expect(loud({ room: null, dDuct: 20 })).toBe(0);
  });
  it('jamais à l’écran titre ni le jour ; rien quand la hotte est arrêtée', () => {
    for (const scene of ['title', 'day', 'off']) expect(loud({ scene, room: 'window', dWindow: 0 })).toBe(0);
    expect(loud({ room: 'window', on: 0 })).toBe(0);
    expect(loud({ room: 'living', on: Number.NaN })).toBe(0);
  });
});

describe('audio · scène sonore (sceneFrom)', () => {
  it('suit l’écran : titre, jour (interface ou scène 3D), nuit rendue', () => {
    expect(sceneFrom({ titleVisible: true, nightFresh: true })).toBe('title'); // la rue se dessine derrière le titre
    expect(sceneFrom({ dayUiVisible: true, nightFresh: true })).toBe('day');
    expect(sceneFrom({ dayActive: true, titleVisible: true })).toBe('day');
    expect(sceneFrom({ nightFresh: true })).toBe('night');
    expect(sceneFrom({})).toBe('day');
    expect(sceneFrom({ forced: 'hall', nightFresh: true })).toBe('hall');
  });
  it('lo-fi le jour, nappe douce la nuit', () => {
    expect(MUSIC_FOR.day).toBe('lofi');
    expect(MUSIC_FOR.night).toBe('night');
  });
});

describe('audio · mélangeur', () => {
  it('défauts, valeurs bornées et persistées', () => {
    const s = mem();
    expect(loadMix(s)).toEqual(DEFAULT_MIX);
    saveMix(s, { ...DEFAULT_MIX, music: 0.2, enabled: { ...DEFAULT_MIX.enabled, music: false } });
    const m = loadMix(s);
    expect(m.music).toBe(0.2);
    expect(m.enabled.music).toBe(false);
    expect(busGain(m, 'music')).toBe(0);
    expect(busGain(m, 'ambience')).toBe(DEFAULT_MIX.ambience);
    s.setItem(MIX_KEY, JSON.stringify({ music: 7, sfx: -1, ambience: 'x', muted: 'oui' }));
    const b = loadMix(s);
    expect([b.music, b.sfx, b.ambience, b.muted]).toEqual([1, 0, DEFAULT_MIX.ambience, false]);
    s.setItem(MIX_KEY, '{abîmé');
    expect(loadMix(s)).toEqual(DEFAULT_MIX);
    expect(busGain({ ...DEFAULT_MIX, muted: true }, 'sfx')).toBe(0);
  });
});
