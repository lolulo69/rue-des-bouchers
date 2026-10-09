// Gestionnaire de la manette : une seule boucle lit la manette et l'envoie au bon endroit.
//   1. menu pause ouvert (#ui-menu)       → navigation dans le menu
//   2. overlay de la nuit (téléphone…)    → navigation dans l'overlay (le gestionnaire de nuit le déclare)
//   3. écran 2D visible (jour, titre, fin) → navigation au focus : croix/stick, Ⓐ valider, Ⓑ retour, LB téléphone,
//                                             View carnet, Start menu, stick droit pour faire défiler
//   4. sinon                               → la nuit 3D (night.js)
// Il suit aussi le dernier périphérique utilisé : <html data-input="pad|kbd" data-pad="xbox|playstation">,
// pour que les indications de touches deviennent des glyphes de manette (hints.js).
import { createPadReader, createRepeater, direction, glyph } from './gamepad.js';
import { currentSettings } from '../ui/settings.js';

let mode = 'kbd';
let kind = 'xbox';
const listeners = new Set();
let night = null; // gestionnaire de nuit (night.js) : { handle(s, dt), idle(), overlayEl() }
let started = false;
const reader = createPadReader({ options: () => ({ deadzone: currentSettings().padDeadzone }) });
const repeat = createRepeater();

export const inputMode = () => ({ mode, kind });
export const onInputMode = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
// Glyphe du bouton pour la manette en cours (Xbox par défaut)
export const padGlyph = (button) => glyph(kind, button);

function setMode(m, k = kind) {
  if (m === mode && k === kind) return;
  mode = m;
  kind = k;
  const html = document.documentElement;
  html.dataset.input = m;
  html.dataset.pad = k;
  for (const fn of listeners) { try { fn({ mode, kind }); } catch { /* un abonné défaillant ne bloque pas les autres */ } }
}

export function setNightHandler(h) { night = h; startPad(); }

// Touche synthétique (même chemin que le clavier : aucun code dupliqué dans le jeu ni dans l'interface)
export function sendKey(code, key = code, type = 'both') {
  const opts = { code, key, bubbles: true, cancelable: true };
  if (type !== 'up') window.dispatchEvent(new KeyboardEvent('keydown', opts));
  if (type !== 'down') window.dispatchEvent(new KeyboardEvent('keyup', opts));
}

// ── Navigation au focus (spatiale) ───────────────────────────────────
const FOCUSABLE = 'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])';
const visible = (el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
export function focusables(container) {
  return [...container.querySelectorAll(FOCUSABLE)].filter((el) => !el.disabled && visible(el) && !el.closest('.hidden, .ui-hidden'));
}
export function moveFocus(container, dir) {
  const els = focusables(container);
  if (!els.length) return null;
  const cur = els.includes(document.activeElement) ? document.activeElement : null;
  if (!cur) { els[0].focus(); els[0].scrollIntoView?.({ block: 'nearest' }); return els[0]; }
  // Curseur de réglage : gauche/droite changent la valeur
  if (cur.type === 'range' && (dir === 'left' || dir === 'right')) {
    if (dir === 'left') cur.stepDown(); else cur.stepUp();
    cur.dispatchEvent(new Event('input', { bubbles: true }));
    cur.dispatchEvent(new Event('change', { bubbles: true }));
    return cur;
  }
  const r = cur.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  let best = null;
  let bestScore = Infinity;
  for (const el of els) {
    if (el === cur) continue;
    const b = el.getBoundingClientRect();
    const ex = b.left + b.width / 2;
    const ey = b.top + b.height / 2;
    const horiz = dir === 'left' || dir === 'right';
    const along = { up: cy - ey, down: ey - cy, left: cx - ex, right: ex - cx }[dir];
    if (along <= 4) continue;
    // recouvrement sur l'autre axe = même ligne / même colonne : pas de pénalité
    const overlap = horiz ? Math.min(r.bottom, b.bottom) - Math.max(r.top, b.top) : Math.min(r.right, b.right) - Math.max(r.left, b.left);
    const ortho = overlap > 0 ? 0 : (horiz ? Math.abs(ey - cy) : Math.abs(ex - cx));
    const score = along + ortho * 2.5;
    if (score < bestScore) { bestScore = score; best = el; }
  }
  if (best) { best.focus(); best.scrollIntoView?.({ block: 'nearest' }); }
  return best;
}

// Contexte d'interface actif (ou null : la nuit 3D a la main)
function uiContext() {
  // une boîte modale de l'interface (conversation de nuit…) : navigation comme un menu
  const modal = document.querySelector('[data-pad-context]');
  if (modal) return { el: modal, kind: 'menu' };
  const menu = document.querySelector('#ui-menu .ui-menu-box');
  if (menu) return { el: menu, kind: 'menu' };
  const ov = night?.overlayEl?.();
  if (ov) return { el: ov, kind: 'night-overlay' };
  const day = document.getElementById('ui-root');
  if (day && !day.classList.contains('ui-hidden') && !day.classList.contains('hidden') && visible(day) && day.querySelector('button')) return { el: day, kind: 'day' };
  for (const id of ['fatal', 'end', 'title']) {
    const el = document.getElementById(id);
    if (el && !el.classList.contains('hidden') && visible(el) && el.querySelector('button')) return { el, kind: id };
  }
  return null;
}

function handleUi(ctx, s, now, dt) {
  const d = repeat(direction(s), now);
  if (d) moveFocus(ctx.el, d);
  const p = s.pressed;
  const inCtx = ctx.el.contains(document.activeElement);
  if (p.has('A')) {
    if (inCtx && document.activeElement !== document.body) document.activeElement.click();
    else moveFocus(ctx.el, 'down');
  }
  if (p.has('B')) {
    // Retour : le menu et les overlays de la nuit se ferment sur Échap ; le jour ne ferme qu'un panneau ouvert
    const dayPanel = ctx.kind === 'day' && ctx.el.querySelector('[data-testid=phone], [data-testid=carnet], [data-testid=help], [data-testid=about]');
    if (ctx.kind !== 'day' || dayPanel) sendKey('Escape');
  }
  if (p.has('START')) {
    if (ctx.kind === 'menu') sendKey('Escape');
    else if (ctx.kind === 'day') { const ui = window.__rdbUi ?? window.__rdb?.ui; if (ui?.openMenu) ui.openMenu(); else sendKey('Escape'); }
    else if (ctx.kind === 'night-overlay') night?.pause?.();
  }
  if (ctx.kind === 'day') {
    if (p.has('LB')) sendKey('KeyT', 't');
    if (p.has('VIEW')) sendKey('KeyC', 'c');
  }
  // stick droit : faire défiler
  if (Math.abs(s.look.y) > 0) {
    const sc = ctx.el.closest('.ui-menu-backdrop') ?? (ctx.kind === 'day' ? ctx.el : ctx.el);
    sc.scrollTop += s.look.y * dt * 900;
  }
}

let last = 0;
function loop(t) {
  requestAnimationFrame(loop);
  const dt = last ? Math.min(0.1, (t - last) / 1000) : 1 / 60;
  last = t;
  const s = reader.poll();
  window.__rdbPadPolls = (window.__rdbPadPolls ?? 0) + 1; // tests : nombre de lectures de la manette
  if (!s.connected) { night?.idle?.(); return; }
  if (s.active) setMode('pad', s.kind);
  const ctx = uiContext();
  if (ctx) { night?.idle?.(); handleUi(ctx, s, t, dt); }
  else night?.handle(s, dt);
}

export function startPad() {
  if (started || typeof window === 'undefined') return;
  started = true;
  document.documentElement.dataset.input = mode;
  document.documentElement.dataset.pad = kind;
  // Retour au clavier / à la souris : uniquement sur de vrais événements (pas nos touches synthétiques)
  const toKbd = (e) => { if (e.isTrusted) setMode('kbd'); };
  window.addEventListener('keydown', toKbd, true);
  window.addEventListener('mousedown', toKbd, true);
  window.addEventListener('mousemove', (e) => { if (e.isTrusted && (Math.abs(e.movementX) + Math.abs(e.movementY) > 4)) setMode('kbd'); }, true);
  requestAnimationFrame(loop);
}
