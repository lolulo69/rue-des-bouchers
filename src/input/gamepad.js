// Manette (Gamepad API, disposition « standard » : Xbox et PlayStation). Pur : aucun DOM, testable avec un faux
// navigator.getGamepads(). Le reste (navigation des menus, nuit 3D, glyphes) est dans src/input/index.js, night.js, hints.js.
//
//   const reader = createPadReader({ getPads: () => navigator.getGamepads() });
//   const s = reader.poll();  // { connected, kind, id, move, look, held, pressed, released, active }
//
// Disposition standard (W3C) : 0 A/✕ · 1 B/○ · 2 X/□ · 3 Y/△ · 4 LB/L1 · 5 RB/R1 · 6 LT/L2 · 7 RT/R2 · 8 View/Create
// 9 Menu/Options · 10 L3 · 11 R3 · 12–15 croix (haut, bas, gauche, droite) · axes 0/1 stick gauche, 2/3 stick droit.

export const BUTTONS = ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT', 'VIEW', 'START', 'LS', 'RS', 'UP', 'DOWN', 'LEFT', 'RIGHT', 'HOME'];

// Actions de la nuit 3D → bouton (§ « gamepad » de la demande de Lucas)
export const NIGHT_MAP = {
  interact: 'A', // E : portes, serveur, lit
  back: 'B', // fermer / retour
  photo: 'X', // P
  nightMenu: 'Y', // N : actions de nuit
  phone: 'LB', // T
  db: 'RB', // B : relevé en décibels
  carnet: 'VIEW', // le Carnet
  pause: 'START', // menu pause / réglages
  bucket: 'RT', // F : seau d'eau, maintenir pour confirmer (illégal, irréversible)
  legal: 'LT', // L : zones légales
  run: 'LS', // Maj : courir (clic du stick gauche)
  dossier: 'RS', // Tab : dossier (clic du stick droit)
};
// Navigation des écrans de jour et des menus
export const UI_MAP = { confirm: 'A', back: 'B', phone: 'LB', carnet: 'VIEW', menu: 'START', up: 'UP', down: 'DOWN', left: 'LEFT', right: 'RIGHT' };

export const GLYPHS = {
  xbox: { A: 'Ⓐ', B: 'Ⓑ', X: 'Ⓧ', Y: 'Ⓨ', LB: 'LB', RB: 'RB', LT: 'LT', RT: 'RT', VIEW: '⧉', START: '☰', LS: 'L3', RS: 'R3', DPAD: '✚', LSTICK: 'Ⓛ', RSTICK: 'Ⓡ' },
  playstation: { A: '✕', B: '○', X: '□', Y: '△', LB: 'L1', RB: 'R1', LT: 'L2', RT: 'R2', VIEW: 'Create', START: 'Options', LS: 'L3', RS: 'R3', DPAD: '✚', LSTICK: 'Ⓛ', RSTICK: 'Ⓡ' },
};
export const glyph = (kind, button) => (GLYPHS[kind] ?? GLYPHS.xbox)[button] ?? button;

// Xbox d'abord (« Xbox Wireless Controller » contient « wireless controller ») ; Sony : vendeur 054c ou nom du modèle
export const padKind = (id = '') => (/xbox|xinput|045e/i.test(id) ? 'xbox' : /054c|playstation|dualshock|dualsense|wireless controller|ps[345]/i.test(id) ? 'playstation' : 'xbox');

// Zone morte radiale, puis remise à l'échelle 0..1 au-delà (pas de saut à la sortie de la zone morte)
export function deadzone(x, y, dz = 0.2) {
  const m = Math.hypot(x, y);
  if (m < dz || !Number.isFinite(m)) return { x: 0, y: 0, m: 0 };
  const k = Math.min(1, (m - dz) / (1 - dz)) / m;
  return { x: x * k, y: y * k, m: Math.min(1, (m - dz) / (1 - dz)) };
}

const pressedValue = (b) => (typeof b === 'object' ? (b?.pressed || (b?.value ?? 0) > 0.5) : b > 0.5);

// getPads : () => tableau (ou GamepadList) ; options lues à chaque poll (réglages modifiables à chaud)
export function createPadReader({ getPads = () => globalThis.navigator?.getGamepads?.() ?? [], options = () => ({}) } = {}) {
  let prev = new Set();
  let lastId = null;
  return {
    poll() {
      const { deadzone: dz = 0.2 } = options();
      const pads = [...(getPads() ?? [])].filter(Boolean).filter((p) => p.connected !== false);
      // la manette utilisée en dernier, sinon la première
      const pad = pads.find((p) => p.id === lastId) ?? pads[0];
      if (!pad) { prev = new Set(); return { connected: false, kind: null, id: null, move: { x: 0, y: 0, m: 0 }, look: { x: 0, y: 0, m: 0 }, held: new Set(), pressed: new Set(), released: new Set(), active: false }; }
      const held = new Set();
      (pad.buttons ?? []).forEach((b, i) => { if (BUTTONS[i] && pressedValue(b)) held.add(BUTTONS[i]); });
      const ax = pad.axes ?? [];
      const move = deadzone(ax[0] ?? 0, ax[1] ?? 0, dz);
      const look = deadzone(ax[2] ?? 0, ax[3] ?? 0, dz);
      const pressed = new Set([...held].filter((b) => !prev.has(b)));
      const released = new Set([...prev].filter((b) => !held.has(b)));
      prev = held;
      const active = pressed.size > 0 || move.m > 0 || look.m > 0;
      if (active) lastId = pad.id;
      return { connected: true, kind: padKind(pad.id), id: pad.id, move, look, held, pressed, released, active };
    },
    reset() { prev = new Set(); },
  };
}

// Répétition d'une direction tenue (croix ou stick) : 1er pas immédiat, puis après `delay`, puis tous les `every` (ms)
export function createRepeater({ delay = 320, every = 130 } = {}) {
  let dir = null;
  let next = 0;
  return (d, now) => {
    if (!d) { dir = null; return null; }
    if (d !== dir) { dir = d; next = now + delay; return d; }
    if (now >= next) { next = now + every; return d; }
    return null;
  };
}

// Direction dominante (croix prioritaire sur le stick gauche) : 'up' | 'down' | 'left' | 'right' | null
export function direction(s, threshold = 0.5) {
  if (s.held.has('UP')) return 'up';
  if (s.held.has('DOWN')) return 'down';
  if (s.held.has('LEFT')) return 'left';
  if (s.held.has('RIGHT')) return 'right';
  const { x, y } = s.move;
  if (Math.max(Math.abs(x), Math.abs(y)) < threshold) return null;
  return Math.abs(x) > Math.abs(y) ? (x > 0 ? 'right' : 'left') : (y > 0 ? 'down' : 'up');
}
