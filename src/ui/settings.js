// Réglages du joueur : volume, son coupé, vitesse du texte, grand texte. Persistés (localStorage), appliqués partout.
// Audio : src/audio (agent art). On utilise audio.setVolume(v) / audio.setMuted(b) s'ils existent ; sinon le son
// coupé passe par la touche M que l'audio écoute déjà, et le volume est mémorisé en attendant l'API.
import { audio } from '../audio/index.js';

export const SETTINGS_KEY = 'rdb.settings.v1';
export const TEXT_SPEEDS = {
  slow: { label: 'Lente', cps: 35 },
  normal: { label: 'Normale', cps: 90 },
  fast: { label: 'Rapide', cps: 220 },
  instant: { label: 'Instantanée', cps: 0 },
};
export const DEFAULTS = { volume: 0.9, muted: false, textSpeed: 'normal', bigText: false };

export function loadSettings() {
  try { return { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(SETTINGS_KEY)) ?? {}) }; } catch { return { ...DEFAULTS }; }
}
export function saveSettings(s) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch { /* stockage indisponible */ }
  applySettings(s);
  return s;
}
export const audioCan = () => ({ volume: typeof audio?.setVolume === 'function', mute: typeof audio?.setMuted === 'function' || 'muted' in (audio ?? {}) });

export function applySettings(s = loadSettings()) {
  // Vitesse du texte : lue par typewrite() (dom.js). Les tests forcent __rdbUiSpeed = 0, qui reste prioritaire.
  globalThis.__rdbUiCps = TEXT_SPEEDS[s.textSpeed]?.cps ?? 90;
  document.documentElement.classList.toggle('rdb-big-text', !!s.bigText);
  if (!audio) return;
  if (typeof audio.setVolume === 'function') audio.setVolume(s.volume);
  if (typeof audio.setMuted === 'function') audio.setMuted(s.muted);
  else if ('muted' in audio && audio.muted !== s.muted) window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyM', key: 'm' }));
}
