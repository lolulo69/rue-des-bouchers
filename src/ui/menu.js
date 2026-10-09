// Menu pause / réglages (Échap) : reprendre, volume, son, vitesse du texte, grand texte, Aide, Carnet, À propos,
// Quitter vers le titre. Autonome : l'interface de jour l'ouvre sur Échap, et la nuit 3D (main.js) peut l'ouvrir aussi :
//   const { openMenu } = await import('./ui/menu.js');
//   openMenu({ campaign, onResume: () => lock(), onQuit: () => { location.search = ''; } });
// Le menu vit dans son propre conteneur (#ui-menu), au-dessus de tout. Clavier : Tab / Maj+Tab, Entrée, Échap.
import './ui.css';
import { h, clear } from './dom.js';
import { carnetView, helpView, aboutView } from './codex.js';
import { loadSettings, saveSettings, applySettings, TEXT_SPEEDS, audioCan } from './settings.js';
import { QUALITY_PRESETS, QUALITY_LEVELS } from '../art/quality.js';

// Qualité graphique (agent art) : mémorisée dans localStorage['rdb.quality'] ; appliquée tout de suite si l'hôte
// passe l'instance art de la rue (art.setQuality), sinon à la prochaine nuit.
const QUALITY_KEY = 'rdb.quality';
const getQuality = (art) => art?.quality?.level ?? (() => { try { return localStorage.getItem(QUALITY_KEY); } catch { return null; } })() ?? 'moyen';

let current = null;

export const isMenuOpen = () => !!current;
export function closeMenu() { current?.close(); }

export function openMenu({ campaign = null, meta = {}, art = null, page: startPage = 'main', onResume, onQuit, quitLabel = 'Quitter vers le titre' } = {}) {
  if (current) return current;
  let root = document.getElementById('ui-menu');
  if (!root) { root = h('div#ui-menu.ui-root'); document.body.append(root); }
  root.classList.remove('ui-hidden');
  const before = document.activeElement;
  let page = startPage === 'carnet' && !campaign ? 'main' : startPage;
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
    const q = getQuality(art);
    const quality = h('div.ui-seg.q3', { role: 'radiogroup', 'aria-label': 'Qualité graphique' },
      QUALITY_LEVELS.map((lv) => h(`button${q === lv ? '.on' : ''}`, {
        role: 'radio', 'aria-checked': String(q === lv), dataset: { quality: lv },
        onclick: () => {
          try { localStorage.setItem(QUALITY_KEY, lv); } catch { /* navigation privée */ }
          art?.setQuality?.(lv);
          render();
        },
      }, QUALITY_PRESETS[lv]?.label ?? lv)));
    const slider = (k, label, min, max, step) => {
      const id = `ui-${k}`;
      const inp = h('input', { type: 'range', min: String(min), max: String(max), step: String(step), value: String(settings[k]), id, dataset: { setting: k } });
      inp.addEventListener('change', () => set(k, Number(inp.value)));
      return h('label.ui-field', { for: id }, h('span', label, h('em', ` ${Number(settings[k]).toFixed(2)}`)), inp);
    };
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
        toggle('bigText', 'Grand texte', 'menu-bigtext'),
        h('div.ui-field', h('span', 'Qualité graphique'), quality),
        h('h3.ui-menu-sub', '🎮 Manette'),
        slider('padLook', 'Sensibilité du regard', 0.4, 2.5, 0.1),
        slider('padDeadzone', 'Zone morte des sticks', 0.05, 0.45, 0.05),
        art ? null : h('p.ui-note', 'Appliquée à la rue dès la prochaine nuit.')),
      h('div.ui-menu-links',
        h('button.ui-btn.ghost', { dataset: { testid: 'menu-help' }, onclick: () => go('help') }, '❓ Aide'),
        campaign ? h('button.ui-btn.ghost', { dataset: { testid: 'menu-carnet' }, onclick: () => go('carnet') }, '📓 Carnet') : null,
        h('button.ui-btn.ghost', { dataset: { testid: 'menu-about' }, onclick: () => go('about') }, 'À propos')),
      onQuit ? quit : null,
    ];
  }
  function go(p) { page = p; render(); }
  const back = () => go('main');

  // Après un réglage, le menu est redessiné : on garde le focus sur le même contrôle (clavier et manette)
  const focusKey = (el) => (el && root.contains(el) ? el.id || ['testid', 'speed', 'quality', 'setting', 'tab'].map((k) => el.dataset?.[k] && `${k}:${el.dataset[k]}`).find(Boolean) : null);
  const findKey = (key) => (key.includes(':') ? root.querySelector(`[data-${key.split(':')[0]}="${key.split(':')[1]}"]`) : root.querySelector(`#${key}`));
  function render() {
    const keep = focusKey(document.activeElement);
    clear(root);
    let body;
    if (page === 'help') body = helpView({ onClose: back, campaign });
    else if (page === 'about') body = aboutView({ onClose: back });
    else if (page === 'carnet' && campaign) body = carnetView(campaign, meta, { tab: carnetTab, onTab: (t) => { carnetTab = t; render(); }, onClose: back });
    else body = h('div.ui-card.ui-menu', mainPage());
    root.append(h('div.ui-menu-backdrop', { onclick: (e) => { if (e.target === e.currentTarget) { close(); onResume?.(); } } },
      h('div.ui-menu-box', { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'ui-menu-title', dataset: { testid: 'menu' } }, body)));
    ((keep && findKey(keep)) ?? root.querySelector('[data-autofocus]') ?? root.querySelector('button, input'))?.focus();
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
