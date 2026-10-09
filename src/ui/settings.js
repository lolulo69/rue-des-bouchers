// Réglages du joueur : volumes (général, musique, ambiance, effets), musique oui/non, son coupé, vitesse du texte, grand texte. Persistés (localStorage), appliqués partout.
// Audio : src/audio (agent art). On utilise audio.setVolume(v) / audio.setMuted(b) s'ils existent ; sinon le son
// coupé passe par la touche M que l'audio écoute déjà, et le volume est mémorisé en attendant l'API.
// Le moteur audio est chargé à la demande (navigateur seulement) : ce module reste importable sous Node (tests).
let audio = null;
if (typeof window !== 'undefined') import('../audio/index.js').then((m) => { audio = m.audio; applySettings(); }).catch(() => {});

export const SETTINGS_KEY = 'rdb.settings.v1';
export const TEXT_SPEEDS = {
  slow: { label: 'Lente', cps: 35 },
  normal: { label: 'Normale', cps: 90 },
  fast: { label: 'Rapide', cps: 220 },
  instant: { label: 'Instantanée', cps: 0 },
};
export const DEFAULTS = { volume: 0.9, muted: false, musicVolume: 0.6, musicOn: true, ambienceVolume: 0.9, sfxVolume: 0.9, textSpeed: 'normal', bigText: false, padDeadzone: 0.2, padLook: 1 };
// Bus audio (agent art, §12c.1–2) : audio.setVolume(bus, 0..1) et audio.setEnabled('music', bool)
export const AUDIO_BUSES = { master: 'volume', music: 'musicVolume', ambience: 'ambienceVolume', sfx: 'sfxVolume' };
// Copie en mémoire (lue à chaque image par la manette : pas de JSON.parse par frame)
let cache = null;
export const currentSettings = () => (cache ??= loadSettings());

export function loadSettings() {
  try { return { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(SETTINGS_KEY)) ?? {}) }; } catch { return { ...DEFAULTS }; }
}
export function saveSettings(s) {
  cache = { ...s };
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch { /* stockage indisponible */ }
  applySettings(s);
  return s;
}
export const audioCan = () => ({ volume: typeof audio?.setVolume === 'function', music: typeof audio?.setEnabled === 'function', mute: typeof audio?.setMuted === 'function' || 'muted' in (audio ?? {}) });

export function applySettings(s = loadSettings()) {
  // Vitesse du texte : lue par typewrite() (dom.js). Les tests forcent __rdbUiSpeed = 0, qui reste prioritaire.
  globalThis.__rdbUiCps = TEXT_SPEEDS[s.textSpeed]?.cps ?? 90;
  if (typeof document !== 'undefined') document.documentElement.classList.toggle('rdb-big-text', !!s.bigText);
  if (!audio) return;
  if (typeof audio.setVolume === 'function') for (const [bus, key] of Object.entries(AUDIO_BUSES)) audio.setVolume(bus, s[key]);
  if (typeof audio.setEnabled === 'function') audio.setEnabled('music', !!s.musicOn);
  if (typeof audio.setMuted === 'function') audio.setMuted(s.muted);
  else if ('muted' in audio && audio.muted !== s.muted) window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyM', key: 'm' }));
}
