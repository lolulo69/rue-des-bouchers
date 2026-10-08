import { describe, it, expect } from 'vitest';
import { createPadReader, deadzone, padKind, direction, glyph, NIGHT_MAP, createRepeater } from '../../src/input/gamepad.js';
import { createNightHandler, HOLD_SECONDS } from '../../src/input/night.js';

// Faux navigator.getGamepads() : une manette « standard » (17 boutons, 4 axes) qu'on manipule
function fakePad(id = 'Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 0b13)') {
  const pad = { id, connected: true, mapping: 'standard', buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })), axes: [0, 0, 0, 0] };
  const IDX = { A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5, LT: 6, RT: 7, VIEW: 8, START: 9, LS: 10, RS: 11, UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15 };
  return {
    pad,
    press(b, on = true) { pad.buttons[IDX[b]] = { pressed: on, value: on ? 1 : 0 }; },
    stick(side, x, y) { const o = side === 'left' ? 0 : 2; pad.axes[o] = x; pad.axes[o + 1] = y; },
  };
}

describe('manette : lecture et disposition standard', () => {
  it('zone morte radiale, remise à l’échelle sans saut', () => {
    expect(deadzone(0.1, 0.1, 0.2)).toEqual({ x: 0, y: 0, m: 0 });
    const d = deadzone(1, 0, 0.2);
    expect(d.x).toBeCloseTo(1);
    expect(deadzone(0.21, 0, 0.2).m).toBeLessThan(0.05);
  });
  it('Xbox par défaut, PlayStation par l’id (vendeur 054c, DualSense…)', () => {
    expect(padKind('Xbox 360 Controller (XInput STANDARD GAMEPAD)')).toBe('xbox');
    expect(padKind('Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 0b13)')).toBe('xbox');
    expect(padKind('DualSense Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 0ce6)')).toBe('playstation');
    expect(padKind('Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 09cc)')).toBe('playstation');
    expect(glyph('xbox', 'A')).toBe('Ⓐ');
    expect(glyph('playstation', 'A')).toBe('✕');
    expect(glyph('playstation', 'Y')).toBe('△');
  });
  it('fronts d’appui : « pressed » une seule fois, puis « released »', () => {
    const f = fakePad();
    const r = createPadReader({ getPads: () => [null, f.pad] });
    expect(r.poll().connected).toBe(true);
    f.press('A');
    let s = r.poll();
    expect(s.pressed.has('A')).toBe(true);
    expect(s.active).toBe(true);
    s = r.poll();
    expect(s.pressed.has('A')).toBe(false);
    expect(s.held.has('A')).toBe(true);
    f.press('A', false);
    expect(r.poll().released.has('A')).toBe(true);
  });
  it('sans manette : déconnecté, rien n’est tenu', () => {
    const s = createPadReader({ getPads: () => [] }).poll();
    expect(s.connected).toBe(false);
    expect(s.held.size).toBe(0);
  });
  it('direction : la croix prime sur le stick, et le répéteur espace les pas', () => {
    const f = fakePad();
    const r = createPadReader({ getPads: () => [f.pad] });
    f.stick('left', 0, -0.9);
    expect(direction(r.poll())).toBe('up');
    f.press('RIGHT');
    expect(direction(r.poll())).toBe('right');
    const rep = createRepeater({ delay: 300, every: 100 });
    expect(rep('down', 0)).toBe('down');
    expect(rep('down', 150)).toBe(null);
    expect(rep('down', 310)).toBe('down');
    expect(rep(null, 320)).toBe(null);
    expect(rep('down', 330)).toBe('down');
  });
  it('la nuit utilise la disposition demandée par Lucas', () => {
    expect(NIGHT_MAP).toMatchObject({ interact: 'A', back: 'B', photo: 'X', nightMenu: 'Y', phone: 'LB', db: 'RB', carnet: 'VIEW', pause: 'START', bucket: 'RT' });
  });
});

describe('manette : la nuit 3D (touches du jeu)', () => {
  function setup() {
    const f = fakePad();
    const r = createPadReader({ getPads: () => [f.pad] });
    const sent = [];
    const menus = [];
    const holds = [];
    const player = { yaw: 0, pitch: 0 };
    const h = createNightHandler({ player, dispatch: (code, type) => sent.push(`${code}:${type}`), openMenu: (p) => menus.push(p ?? 'main'), onHold: (p) => holds.push(p) });
    const step = (dt = 1 / 60) => h.handle(r.poll(), dt);
    return { f, sent, menus, holds, player, step, h };
  }
  it('Ⓐ = E, Ⓧ = P, Ⓨ = N, LB = T, RB = B (un appui = une touche)', () => {
    const t = setup();
    for (const b of ['A', 'X', 'Y', 'LB', 'RB']) { t.f.press(b); t.step(); t.step(); t.f.press(b, false); t.step(); }
    expect(t.sent).toEqual(['KeyE:both', 'KeyP:both', 'KeyN:both', 'KeyT:both', 'KeyB:both']);
  });
  it('Start = menu pause, View = carnet', () => {
    const t = setup();
    t.f.press('START'); t.step(); t.f.press('START', false); t.step();
    t.f.press('VIEW'); t.step();
    expect(t.menus).toEqual(['main', 'carnet']);
  });
  it('stick gauche : tient ZQSD/WASD, L3 fait courir, relâcher relâche les touches', () => {
    const t = setup();
    t.f.stick('left', 0, -0.8); t.step();
    expect(t.sent).toEqual(['KeyW:down']);
    t.f.press('LS'); t.step();
    expect(t.sent).toContain('ShiftLeft:down');
    t.f.stick('left', 0, 0); t.f.press('LS', false); t.step();
    expect(t.sent).toContain('KeyW:up');
    expect(t.sent).toContain('ShiftLeft:up');
  });
  it('stick droit : tourne la caméra (lacet et tangage bornés)', () => {
    const t = setup();
    t.f.stick('right', 1, -1);
    for (let i = 0; i < 120; i++) t.step(1 / 60);
    expect(t.player.yaw).toBeLessThan(-1);
    expect(t.player.pitch).toBeLessThanOrEqual(1.45);
    expect(t.player.pitch).toBeGreaterThan(1);
  });
  it('seau (RT) : il faut maintenir, un appui bref ne fait rien ; maintenu, une seule fois', () => {
    const t = setup();
    t.f.press('RT'); t.step(0.3); t.f.press('RT', false); t.step(0.1);
    expect(t.sent.filter((s) => s.startsWith('KeyF'))).toEqual([]);
    expect(t.holds.at(-1)).toBe(null);
    t.f.press('RT');
    for (let tm = 0; tm < HOLD_SECONDS + 1; tm += 0.1) t.step(0.1);
    expect(t.sent.filter((s) => s.startsWith('KeyF'))).toEqual(['KeyF:both']);
    expect(t.holds.at(-1)).toBe(1);
  });
  it('idle() relâche tout (passage dans un menu)', () => {
    const t = setup();
    t.f.stick('left', 0.9, 0); t.step();
    t.h.idle();
    expect(t.sent).toEqual(['KeyD:down', 'KeyD:up']);
  });
});
