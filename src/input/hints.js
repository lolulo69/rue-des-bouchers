// Indications de touches → glyphes de manette quand la dernière entrée vient d'une manette (<html data-input="pad">).
//   · l'invite du HUD (#prompt, écrite par game.js : « [E] Monter chez Pilou ») : [E] → Ⓐ, [P] → Ⓧ, [F] → RT maintenu…
//   · les blocs .keys (écran titre, pause) : remplacés par leur version manette (le bloc clavier est masqué en CSS)
//   · l'Aide (codex.js h_touches) : padControlsText()
// Les textes d'origine sont restaurés au retour au clavier.
import '../ui/ui.css';
import { inputMode, onInputMode, padGlyph, startPad } from './index.js';

// touche du jeu → bouton de la manette
const KEY_TO_PAD = { E: 'A', P: 'X', F: 'RT', N: 'Y', T: 'LB', B: 'RB', L: 'LT', Tab: 'RS', C: 'VIEW', 'Échap': 'START', V: 'B' };
export const keyHint = (key) => {
  if (inputMode().mode !== 'pad' || !KEY_TO_PAD[key]) return key;
  const g = padGlyph(KEY_TO_PAD[key]);
  return key === 'F' ? `${g} maintenu` : g;
};
export const translatePrompt = (text) => text.replace(/\[(Tab|[A-Z])\]/g, (m, k) => (KEY_TO_PAD[k] ? `[${keyHint(k)}]` : m));

export function padControlsText() {
  const g = padGlyph;
  return `Stick gauche ou croix pour bouger, ${g('LS')} pour courir, stick droit pour regarder. ${g('A')} : portes, serveur, lit. ${g('X')} : photo. ${g('RB')} : relevé en décibels. ${g('LB')} : téléphone. ${g('Y')} : actions de nuit. ${g('RS')} : dossier. ${g('LT')} : zones légales. ${g('RT')} maintenu : le seau d’eau, depuis la fenêtre. ${g('VIEW')} : carnet. ${g('START')} : pause et réglages. Dans les menus : croix pour choisir, ${g('A')} pour valider, ${g('B')} pour revenir.`;
}
function padKeysNode() {
  const g = padGlyph;
  const div = document.createElement('div');
  div.className = 'ui-pad-keys';
  div.innerHTML = [
    `<div><kbd>Stick gauche</kbd> se déplacer · <kbd>${g('LS')}</kbd> courir · <kbd>Stick droit</kbd> regarder</div>`,
    `<div><kbd>${g('A')}</kbd> portes, serveur, lit · <kbd>${g('X')}</kbd> photo (preuve) · <kbd>${g('LB')}</kbd> téléphone · <kbd>${g('RB')}</kbd> relevé dB</div>`,
    `<div><kbd>${g('RT')}</kbd> maintenu : seau d’eau (depuis la fenêtre, illégal) · <kbd>${g('Y')}</kbd> actions de nuit · <kbd>${g('RS')}</kbd> dossier · <kbd>${g('LT')}</kbd> zones légales · <kbd>${g('B')}</kbd> accélérer · <kbd>${g('START')}</kbd> pause</div>`,
  ].join('');
  return div;
}

let observer = null;
function apply() {
  const pad = inputMode().mode === 'pad';
  // Invite du HUD
  const p = document.getElementById('prompt');
  if (p) {
    const t = p.textContent;
    if (pad && t !== p.__padText) { p.__kbdText = t; p.__padText = translatePrompt(t); if (p.__padText !== t) p.textContent = p.__padText; }
    else if (!pad && p.__padText && t === p.__padText) { p.textContent = p.__kbdText; p.__padText = null; }
  }
  // Blocs de touches : version manette juste après chaque bloc clavier
  for (const k of document.querySelectorAll('.keys')) {
    let next = k.nextElementSibling;
    if (!next?.classList.contains('ui-pad-keys')) { next = padKeysNode(); k.after(next); }
    else if (next.dataset.kind !== inputMode().kind) next.replaceWith((next = padKeysNode()));
    next.dataset.kind = inputMode().kind;
  }
}

export function startHints() {
  if (observer || typeof document === 'undefined') return;
  startPad();
  let queued = false;
  const schedule = () => { if (!queued) { queued = true; queueMicrotask(() => { queued = false; observer.disconnect(); apply(); observe(); }); } };
  observer = new MutationObserver(schedule);
  const observe = () => observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  onInputMode(schedule);
  apply();
  observe();
}
