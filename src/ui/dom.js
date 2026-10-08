// Petits utilitaires DOM de l'interface jour. Aucune dépendance, aucun état global.
import { CHARACTERS } from '../content/characters.js';

// art.portrait(id, expression) → dataURL (src/art/portraits.js, agent art). Import explicite : ne jamais glober src/art/*
// (gallery.js touche au DOM dès son import). Surcharge possible : setPortraitProvider(fn).
import { portrait as artPortrait } from '../art/portraits.js';
let portraitFn = artPortrait;
export const setPortraitProvider = (fn) => { portraitFn = typeof fn === 'function' ? fn : portraitFn; };

// h('div.ui-card#x', { onclick, disabled, dataset: {...} }, ...enfants) → HTMLElement
export function h(tag, props, ...kids) {
  const [, name = 'div', rest = ''] = tag.match(/^([a-z0-9]*)(.*)$/i);
  const node = document.createElement(name || 'div');
  for (const part of rest.match(/[.#][^.#]+/g) || []) {
    if (part[0] === '.') node.classList.add(part.slice(1));
    else node.id = part.slice(1);
  }
  if (props && (typeof props !== 'object' || props instanceof Node || Array.isArray(props))) { kids.unshift(props); props = null; }
  for (const [k, v] of Object.entries(props || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
    else if (k === 'html') node.innerHTML = v;
    else if (k in node && k !== 'list') node[k] = v;
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat(Infinity)) {
    if (kid === null || kid === undefined || kid === false) continue;
    node.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  }
  return node;
}

export const clear = (node) => { while (node.firstChild) node.firstChild.remove(); return node; };

const PALETTE = ['#c4553f', '#5f9e6e', '#4f6d8f', '#b48ed1', '#d98c5f', '#5fb3b3', '#8a5a35', '#e76f8a'];
const hash = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

export const nameOf = (id) => CHARACTERS[id]?.name || id || '';

// Portrait : art.portrait(id, expression) s'il existe (canvas, image ou URL), sinon des initiales colorées.
export function portrait(id, expression = 'neutral', size = '') {
  const box = h(`div.ui-portrait${size ? '.' + size : ''}`, { title: nameOf(id), dataset: { who: id || '' } });
  const fn = portraitFn;
  if (fn) {
    try {
      const p = fn(id, expression);
      if (p instanceof Node) { box.append(p); return box; }
      if (typeof p === 'string') { box.append(h('img', { src: p, alt: nameOf(id) })); return box; }
    } catch { /* repli sur les initiales */ }
  }
  const name = nameOf(id);
  const initials = name.split(/[\s-]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
  box.style.background = PALETTE[hash(id || '?') % PALETTE.length];
  box.textContent = initials;
  return box;
}

// Effet machine à écrire. Retourne une promesse ; `skip()` termine immédiatement.
// La vitesse est globale (UI_SPEED) pour que les tests puissent l'accélérer.
// Vitesse : réglage du joueur (globalThis.__rdbUiCps, settings.js ; 0 = instantané), sauf forçage des tests (__rdbUiSpeed).
export function typewrite(node, text, { cps: cpsDefault = 60, caret = true } = {}) {
  const setting = globalThis.__rdbUiCps;
  const speed = globalThis.__rdbUiSpeed ?? (setting === 0 ? 0 : 1);
  const cps = setting || cpsDefault;
  let i = 0; let done; let timer;
  const p = new Promise((res) => { done = res; });
  const finish = () => { clearTimeout(timer); node.textContent = text; node.classList.remove('ui-caret'); done(); };
  if (speed <= 0 || !text) { finish(); return Object.assign(p, { skip: finish }); }
  if (caret) node.classList.add('ui-caret');
  const step = () => {
    i = Math.min(text.length, i + Math.max(1, Math.round(speed)));
    node.textContent = text.slice(0, i);
    if (i >= text.length) finish();
    else timer = setTimeout(step, 1000 / cps);
  };
  step();
  return Object.assign(p, { skip: finish });
}

// Libellés des statistiques et des effets
export const STAT_LABELS = { sleep: 'Sommeil', asso: 'Asso', dossier: 'Dossier', risk: 'Risque', job: 'Job' };
export function effectChips(effects = {}) {
  const out = [];
  for (const [k, label] of Object.entries(STAT_LABELS)) {
    const v = effects[k];
    if (!v) continue;
    const good = k === 'risk' ? v < 0 : v > 0;
    out.push(h(`span.${good ? 'up' : 'down'}`, `${label} ${v > 0 ? '+' : ''}${v}`));
  }
  return out.length ? h('div.ui-fx', out) : null;
}
