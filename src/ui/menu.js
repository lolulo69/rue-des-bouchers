// Menu pause / réglages (Échap) : reprendre, volume, son, vitesse du texte, grand texte, Aide, Carnet, À propos,
// Quitter vers le titre. Autonome : l'interface de jour l'ouvre sur Échap, et la nuit 3D (main.js) peut l'ouvrir aussi :
//   const { openMenu } = await import('./ui/menu.js');
//   openMenu({ campaign, onResume: () => lock(), onQuit: () => { location.search = ''; } });
// Le menu vit dans son propre conteneur (#ui-menu), au-dessus de tout. Clavier : Tab / Maj+Tab, Entrée, Échap.
import './ui.css';
import { h, clear } from './dom.js';
import { carnetView, helpView, aboutView } from './codex.js';
import { loadSettings, saveSettings, applySettings, TEXT_SPEEDS, audioCan } from './settings.js';

let current = null;

export const isMenuOpen = () => !!current;
export function closeMenu() { current?.close(); }

export function openMenu({ campaign = null, meta = {}, onResume, onQuit, quitLabel = 'Quitter vers le titre' } = {}) {
  if (current) return current;
  let root = document.getElementById('ui-menu');
  if (!root) { root = h('div#ui-menu.ui-root'); document.body.append(root); }
  root.classList.remove('ui-hidden');
  const before = document.activeElement;
  let page = 'main';
  let carnetTab = 'characters';
  let settings = loadSettings();
  let armedQuit = false;

  function set(k, v) { settings = saveSettings({ ...settings, [k]: v }); render(); }

  function mainPage() {
    const can = audioCan();
    const speed = h('div.ui-seg', { role: 'radiogroup', 'aria-label': 'Vitesse du texte' },
      Object.entries(TEXT_SPEEDS).map(([id, t]) => h(`button${settings.textSpeed === id ? '.on' : ''}`, {
        role: 'radio', 'aria-checked': String(settings.textSpeed === id), dataset: { speed: id }, onclick: () => set('textSpeed', id),
      }, t.label)));
    const vol = h('input', { type: 'range', min: '0', max: '1', step: '0.05', value: String(settings.volume), id: 'ui-volume', 'aria-describedby': can.volume ? undefined : 'ui-volume-note' });
    vol.addEventListener('change', () => set('volume', Number(vol.value)));
    const toggle = (k, label, testid) => h('button.ui-switch', { role: 'switch', 'aria-checked': String(!!settings[k]), dataset: { testid }, onclick: () => set(k, !settings[k]) },
      h('span', label), h('i', settings[k] ? 'Oui' : 'Non'));
    const quit = h('button.ui-btn.light.center', { dataset: { testid: 'menu-quit' } }, quitLabel);
    quit.onclick = () => {
      if (!armedQuit) { armedQuit = true; quit.textContent = 'Vraiment ? La partie est sauvegardée au début de la phase.'; return; }
      close(); onQuit?.();
    };
    return [
      h('h2#ui-menu-title', 'Pause'),
      h('button.ui-btn.center', { dataset: { testid: 'menu-resume', autofocus: '1' }, onclick: () => { close(); onResume?.(); } }, 'Reprendre'),
      h('section.ui-menu-settings', { 'aria-label': 'Réglages' },
        h('label.ui-field', { for: 'ui-volume' }, h('span', 'Volume'), vol),
        can.volume ? null : h('p.ui-note#ui-volume-note', 'Le volume sera appliqué dès que le moteur audio le permettra.'),
        toggle('muted', 'Son coupé (M)', 'menu-mute'),
        h('div.ui-field', h('span', 'Vitesse du texte'), speed),
        toggle('bigText', 'Grand texte', 'menu-bigtext')),
      h('div.ui-menu-links',
        h('button.ui-btn.ghost', { dataset: { testid: 'menu-help' }, onclick: () => go('help') }, '❓ Aide'),
        campaign ? h('button.ui-btn.ghost', { dataset: { testid: 'menu-carnet' }, onclick: () => go('carnet') }, '📓 Carnet') : null,
        h('button.ui-btn.ghost', { dataset: { testid: 'menu-about' }, onclick: () => go('about') }, 'À propos')),
      onQuit ? quit : null,
    ];
  }
  function go(p) { page = p; render(); }
  const back = () => go('main');

  function render() {
    clear(root);
    let body;
    if (page === 'help') body = helpView({ onClose: back });
    else if (page === 'about') body = aboutView({ onClose: back });
    else if (page === 'carnet' && campaign) body = carnetView(campaign, meta, { tab: carnetTab, onTab: (t) => { carnetTab = t; render(); }, onClose: back });
    else body = h('div.ui-card.ui-menu', mainPage());
    root.append(h('div.ui-menu-backdrop', { onclick: (e) => { if (e.target === e.currentTarget) { close(); onResume?.(); } } },
      h('div.ui-menu-box', { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'ui-menu-title', dataset: { testid: 'menu' } }, body)));
    (root.querySelector('[data-autofocus]') ?? root.querySelector('button, input'))?.focus();
  }

  // Échap : revenir au menu, ou fermer. Tab reste dans la boîte (piège de focus).
  function onKey(e) {
    if (e.code === 'Escape') {
      e.preventDefault(); e.stopImmediatePropagation();
      if (page !== 'main') back(); else { close(); onResume?.(); }
      return;
    }
    if (e.key === 'Tab') {
      const f = [...root.querySelectorAll('button:not([disabled]), input:not([disabled])')];
      if (!f.length) return;
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f.at(-1).focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
    e.stopPropagation();
  }
  window.addEventListener('keydown', onKey, true);

  function close() {
    window.removeEventListener('keydown', onKey, true);
    clear(root);
    root.classList.add('ui-hidden');
    current = null;
    if (before?.isConnected) before.focus?.();
  }

  applySettings(settings);
  render();
  current = { close, root };
  return current;
}
