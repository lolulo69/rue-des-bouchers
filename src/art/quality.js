// Qualité graphique : 'bas' | 'moyen' | 'haut'. art.setQuality(niveau) depuis le menu Réglages de l'UI.
// Premier lancement : détection automatique (nom du GPU, puis une courte sonde de temps de frame) et mémorisation.
// Cible : 60 fps sur un iGPU de portable en « Moyen ».
import { setRigQuality } from './rig.js';

export const QUALITY_PRESETS = {
  bas: {
    label: 'Bas',
    pixelRatio: 0.75,       // rendu en 3/4 de la résolution, étiré (le plus gros gain sur un iGPU)
    maxPixelRatio: 1,
    viewDistance: 60,       // la caméra ne voit pas au-delà (la brume cache la coupure) : moins de tronçons dessinés
    fogFar: 55,
    lodDist: 6,             // persos simplifiés dès 6 m
    farAnimEvery: 4,        // persos lointains animés une frame sur 4
    streetLights: 2,        // lumières ponctuelles de la rue gardées (+ celle de l'appartement)
    particles: 0.4,         // fumée, pluie, éclaboussures
  },
  moyen: {
    label: 'Moyen',
    pixelRatio: 1,
    maxPixelRatio: 1,
    viewDistance: 110,
    fogFar: 95,
    lodDist: 10,
    farAnimEvery: 3,
    streetLights: 4,
    particles: 0.75,
  },
  haut: {
    label: 'Haut',
    pixelRatio: 1,
    maxPixelRatio: 1.5,     // écrans haute densité : jusqu'à 1,5
    viewDistance: 400,
    fogFar: 95,
    lodDist: 14,
    farAnimEvery: 2,
    streetLights: 4,
    particles: 1,
  },
};
export const QUALITY_LEVELS = ['bas', 'moyen', 'haut'];
const KEY = 'rdb.quality';

const store = {
  get() { try { return localStorage.getItem(KEY); } catch { return null; } },
  set(v) { try { localStorage.setItem(KEY, v); } catch { /* navigation privée */ } },
};

// Devine un niveau de départ à partir du nom du GPU
export function guessFromRenderer(name = '') {
  const n = name.toLowerCase();
  if (/swiftshader|llvmpipe|software|microsoft basic/.test(n)) return 'bas';
  if (/intel|uhd|iris|mali|adreno|powervr|videocore|vega [0-9] |radeon\(tm\) graphics|radeon graphics/.test(n)) return 'moyen';
  if (/apple m|nvidia|geforce|rtx|gtx|radeon rx|radeon pro/.test(n)) return 'haut';
  return 'moyen';
}
export function gpuName(renderer) {
  try {
    const gl = renderer.getContext();
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
  } catch { return ''; }
}

export function createQuality(scene, world, { onFrame }) {
  let level = null, preset = null, renderer = null, camera = null;
  let applied = { pixelRatio: 0, far: 0 };
  // Sonde : ~3 s de frames réelles juste après le lancement ; trop lent → on descend d'un cran (une seule fois)
  const automation = typeof navigator !== 'undefined' && (navigator.webdriver || new URLSearchParams(location.search).has('nolock'));
  let probe = null;
  const listeners = new Set();

  function apply() {
    if (!preset) return;
    setRigQuality({ lodDist: preset.lodDist, farAnimEvery: preset.farAnimEvery });
    const lights = world.streetLights ?? [];
    lights.forEach((l, i) => { l.visible = i < preset.streetLights; });
    applied = { pixelRatio: 0, far: 0 }; // réappliqués à la prochaine frame (renderer et caméra connus)
  }
  function set(next, { persist = true, reason = 'manuel' } = {}) {
    if (!QUALITY_PRESETS[next]) throw new Error(`art.setQuality : niveau inconnu « ${next} » (${QUALITY_LEVELS.join(', ')})`);
    level = next; preset = QUALITY_PRESETS[next];
    if (persist) store.set(next);
    apply();
    for (const fn of listeners) fn(level, reason);
    return level;
  }

  onFrame((dt, t, cam, rend) => {
    renderer = rend; camera = cam;
    if (!level && renderer) { // premier rendu : niveau mémorisé, ou deviné d'après le GPU
      const saved = store.get();
      if (QUALITY_PRESETS[saved]) set(saved, { persist: false, reason: 'mémorisé' });
      else { set(guessFromRenderer(gpuName(renderer)), { persist: false, reason: 'gpu' }); if (!automation) probe = { n: 0, sum: 0, skip: 30 }; }
    }
    if (!preset || !renderer) return;
    const dpr = typeof devicePixelRatio === 'number' ? devicePixelRatio : 1;
    const pr = Math.min(preset.maxPixelRatio, dpr) * preset.pixelRatio;
    if (Math.abs(applied.pixelRatio - pr) > 0.01) { applied.pixelRatio = pr; const r = renderer; queueMicrotask(() => r.setPixelRatio(pr)); } // après ce rendu, pas pendant
    if (camera?.isPerspectiveCamera && applied.far !== preset.viewDistance) {
      camera.far = preset.viewDistance; camera.updateProjectionMatrix(); applied.far = preset.viewDistance;
      if (scene.fog) scene.fog.far = preset.fogFar;
    }
    if (probe && dt > 0.001 && dt < 0.25) {
      if (probe.skip > 0) { probe.skip--; return; }
      probe.n++; probe.sum += dt;
      if (probe.n >= 120) {
        const ms = (probe.sum / probe.n) * 1000;
        const i = QUALITY_LEVELS.indexOf(level);
        if (ms > 21 && i > 0) set(QUALITY_LEVELS[i - 1], { reason: `sonde ${ms.toFixed(1)} ms` });
        else store.set(level);
        probe = null;
      }
    }
  });

  return {
    set,
    get level() { return level; },
    get preset() { return preset; },
    get particles() { return preset?.particles ?? 1; },
    onChange: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
    presets: QUALITY_PRESETS,
    levels: QUALITY_LEVELS,
  };
}
