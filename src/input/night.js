// La manette dans la nuit 3D. Le jeu (game.js, build agent) garde sa gestion du clavier et de la souris :
// on lui envoie les mêmes touches (E, P, N, T, B, L, Tab, ZQSD/WASD, Maj) et on tourne la caméra (player.yaw/pitch).
//
// Branchement (game.js) :
//   import { bindNight } from './input/night.js';
//   const pad = bindNight({ player, getOverlay: () => overlay });
//   …  const running = started && !S.ended && !overlay && pad.allows(locked || NOLOCK);
//
// Seau d'eau (F) : RT à MAINTENIR (HOLD_SECONDS), parce que c'est illégal et irréversible ; le jeu vérifie la fenêtre.
import { NIGHT_MAP } from './gamepad.js';
import { setNightHandler, sendKey, inputMode, padGlyph } from './index.js';
import { currentSettings } from '../ui/settings.js';
import { startHints } from './hints.js';
import { skipActiveCoach } from '../ui/coach.js';

export const HOLD_SECONDS = 1.2;
const LOOK_SPEED = 2.6; // rad/s au stick plein, sensibilité 1
const MOVE_KEYS = { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD' };
// action → touche du jeu
const KEY_OF = { interact: 'KeyE', photo: 'KeyP', nightMenu: 'KeyN', phone: 'KeyT', db: 'KeyB', legal: 'KeyL', dossier: 'Tab' };

// Logique pure (testable) : dispatch(code, 'down'|'up'|'both'), openMenu(page?), onHold(progress 0..1 | null)
export function createNightHandler({ player, dispatch, openMenu = () => {}, onHold = () => {}, onBack = () => {}, settings = () => ({ padLook: 1 }) }) {
  const held = new Set(); // touches de déplacement maintenues de notre fait
  let hold = 0;
  let fired = false;
  const btn = (action) => NIGHT_MAP[action];
  function sync(want) {
    for (const k of held) if (!want.has(k)) { dispatch(k, 'up'); held.delete(k); }
    for (const k of want) if (!held.has(k)) { dispatch(k, 'down'); held.add(k); }
  }
  function idle() { sync(new Set()); if (hold) { hold = 0; fired = false; onHold(null); } }
  function handle(s, dt) {
    if (!s.connected) return idle();
    // Déplacement : le stick gauche (ou la croix) tient les touches ZQSD/WASD ; L3 ou stick à fond = courir
    const want = new Set();
    const { x, y, m } = s.move;
    if (y < -0.35 || s.held.has('UP')) want.add(MOVE_KEYS.up);
    if (y > 0.35 || s.held.has('DOWN')) want.add(MOVE_KEYS.down);
    if (x < -0.35 || s.held.has('LEFT')) want.add(MOVE_KEYS.left);
    if (x > 0.35 || s.held.has('RIGHT')) want.add(MOVE_KEYS.right);
    if (want.size && (s.held.has(btn('run')) || m > 0.97)) want.add('ShiftLeft');
    sync(want);
    // Regard : stick droit (sensibilité réglable)
    if (player && s.look.m > 0) {
      const k = LOOK_SPEED * (settings().padLook ?? 1) * dt;
      player.yaw -= s.look.x * k;
      player.pitch = Math.max(-1.45, Math.min(1.45, player.pitch - s.look.y * k));
    }
    // Boutons : un appui = une touche
    for (const [action, code] of Object.entries(KEY_OF)) if (s.pressed.has(btn(action))) dispatch(code, 'both');
    if (s.pressed.has(btn('back'))) onBack(); // hors overlay : passer le tutoriel affiché
    if (s.pressed.has(btn('pause'))) openMenu();
    if (s.pressed.has(btn('carnet'))) openMenu('carnet');
    // Seau : maintenir RT
    if (s.held.has(btn('bucket'))) {
      hold += dt;
      onHold(Math.min(1, hold / HOLD_SECONDS));
      if (hold >= HOLD_SECONDS && !fired) { fired = true; dispatch('KeyF', 'both'); }
    } else if (hold) { hold = 0; fired = false; onHold(null); }
  }
  return { handle, idle, get holding() { return hold; } };
}

// ── Branchement réel (DOM) ──────────────────────────────────────────
function holdIndicator() {
  let el = null;
  return (p) => {
    if (p === null) { el?.remove(); el = null; return; }
    if (!el) {
      el = document.createElement('div');
      el.id = 'ui-pad-hold';
      el.setAttribute('role', 'status');
      el.innerHTML = '<span></span><i><b></b></i>';
      document.body.append(el);
    }
    el.querySelector('span').textContent = `Maintenez ${padGlyph('RT')} : seau d’eau (illégal, irréversible)`;
    el.querySelector('b').style.width = `${Math.round(p * 100)}%`;
  };
}
function openPauseMenu(page) {
  import('../ui/menu.js').then((m) => {
    if (m.isMenuOpen()) return;
    m.openMenu({
      campaign: window.__rdb?.campaign ?? null,
      art: window.__rdb?.art ?? null,
      page,
      onQuit: () => { const q = new URLSearchParams(location.search); q.delete('mode'); location.search = q.toString(); },
    });
  });
}

export function bindNight({ player, getOverlay = () => null } = {}) {
  startHints(); // glyphes de manette dans l'invite du HUD et les blocs de touches
  const h = createNightHandler({
    player,
    dispatch: (code, type) => sendKey(code, code === 'Tab' ? 'Tab' : code.replace(/^Key/, '').toLowerCase(), type),
    openMenu: openPauseMenu,
    onHold: holdIndicator(),
    onBack: skipActiveCoach,
    settings: currentSettings,
  });
  let menuOpen = () => !!document.querySelector('#ui-menu .ui-menu-box');
  setNightHandler({
    handle: h.handle,
    idle: h.idle,
    pause: () => openPauseMenu(),
    overlayEl: () => { const o = getOverlay(); return o && o !== 'menu' ? document.getElementById(o) : null; },
  });
  return {
    // Le jeu tourne si la souris est capturée (ou NOLOCK) OU si la manette est l'entrée active ; jamais sous le menu pause
    allows: (lockedOrNolock) => !menuOpen() && (lockedOrNolock || inputMode().mode === 'pad'),
    get active() { return inputMode().mode === 'pad'; },
  };
}
