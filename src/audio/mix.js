// Règles du mixage, sans WebAudio (testées sous Node : tests/unit/audio-mix.test.js).
//   • le mélangeur du joueur (Musique / Ambiance / Effets, volume général, son coupé), persisté ;
//   • la loi de la hotte : on ne l'entend QUE chez Pilou (fort à la fenêtre du séjour, étouffée au fond),
//     dans la rue un léger souffle juste sous la gaine, rien ailleurs, jamais à l'écran titre ni le jour ;
//   • quelle « scène » sonore jouer (titre, jour, nuit) d'après ce qui est à l'écran.

export const BUSES = ['music', 'ambience', 'sfx'];
export const MIX_KEY = 'rdb.audio.v1';
export const DEFAULT_MIX = { master: 0.9, muted: false, music: 0.6, ambience: 0.85, sfx: 0.9, enabled: { music: true, ambience: true, sfx: true } };

export const clamp01 = (v) => (Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0);

// Lit le mélangeur (localStorage ou tout objet { getItem }) ; valeurs absurdes → défauts
export function loadMix(storage) {
  let raw = null;
  try { raw = JSON.parse(storage?.getItem?.(MIX_KEY) ?? 'null'); } catch { raw = null; }
  const m = { ...DEFAULT_MIX, enabled: { ...DEFAULT_MIX.enabled } };
  if (!raw || typeof raw !== 'object') return m;
  for (const k of ['master', ...BUSES]) if (Number.isFinite(raw[k])) m[k] = clamp01(raw[k]);
  if (typeof raw.muted === 'boolean') m.muted = raw.muted;
  for (const k of BUSES) if (typeof raw.enabled?.[k] === 'boolean') m.enabled[k] = raw.enabled[k];
  return m;
}
export function saveMix(storage, mix) {
  try { storage?.setItem?.(MIX_KEY, JSON.stringify(mix)); } catch { /* navigation privée */ }
  return mix;
}
// Gain effectif d'un bus (0 si coupé ou désactivé)
export const busGain = (mix, bus) => (mix.muted ? 0 : (mix.enabled[bus] === false ? 0 : clamp01(mix[bus])));

// La hotte. room : apartment.roomAt() ('living' | 'corridor' | 'bathroom' | 'bedroom' | 'daughter' | 'window' | null)
// dWindow : distance (m) à LA fenêtre du séjour · dDuct : distance à la bouche de la gaine · on : 0..1.4 (hotte en marche)
// → { motor, hiss, cutoff } : moteur grave, souffle, filtre passe-bas (Hz) ; 0 partout ailleurs
const ROOM = { corridor: [0.2, 0.05, 320], bathroom: [0.16, 0.04, 300], bedroom: [0.14, 0.03, 260], daughter: [0.08, 0.02, 220] };
export function humMix({ scene = 'night', room = null, dWindow = 99, dDuct = 99, on = 1 } = {}) {
  const k = scene === 'night' ? Math.max(0, Math.min(1.4, Number.isFinite(on) ? on : 0)) : 0;
  if (!k) return { motor: 0, hiss: 0, cutoff: 400 };
  if (room === 'window') return { motor: k, hiss: 0.8 * k, cutoff: 1400 }; // penché dehors, juste au-dessus de la gaine
  if (room === 'living') { // la vitre vibre : fort près de la fenêtre, encore présent au fond du séjour
    const near = clamp01(1 - (dWindow - 0.6) / 4.5);
    return { motor: k * (0.5 + 0.45 * near), hiss: k * (0.12 + 0.3 * near), cutoff: 520 + 420 * near };
  }
  if (ROOM[room]) { const [m, h, c] = ROOM[room]; return { motor: k * m, hiss: k * h, cutoff: c }; }
  // dans la rue : seulement un souffle juste sous la gaine
  const under = clamp01(1 - dDuct / 3.5);
  return { motor: k * 0.05 * under, hiss: k * 0.22 * under * under, cutoff: 2600 };
}

// Scène sonore d'après l'écran : forcée > scène de jour 3D > écran titre > interface du jour > nuit (rendue) > jour
export function sceneFrom({ forced = null, dayActive = false, titleVisible = false, dayUiVisible = false, nightFresh = false } = {}) {
  if (forced) return forced;
  if (dayActive) return 'day';
  if (titleVisible) return 'title';
  if (dayUiVisible) return 'day';
  return nightFresh ? 'night' : 'day';
}
// Musique de chaque scène : lo-fi le jour, nappe nocturne la nuit (et sous l'écran titre, qui montre la rue de nuit)
export const MUSIC_FOR = { title: 'night', day: 'lofi', night: 'night', hall: 'hall', off: null };
