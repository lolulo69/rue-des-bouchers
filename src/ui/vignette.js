// Scènes 3D des phases de jour, rendues dans un canvas derrière l'interface.
//   v1.1 (§12b C/D) : art.day.start(kind) — Koddex en vue subjective au bureau ('koddex') ou au bureau de la maison
//   ('home'), la rue de jour, l'atelier, la mairie — avec screenCorners() / screenRect() pour poser le terminal sur le
//   moniteur. Repli : les vignettes art.scenes (et toujours sur la qualité « Bas »).
// Un petit renderer à part, créé à la demande, 30 i/s au plus, en pause quand l'UI est cachée. Sans WebGL : fond chaud seul.
import * as THREE from 'three';
import { scenes } from '../art/scenes.js';
import { art } from '../art/index.js';
import { projectCorners } from './project.js';

const DAY_KINDS = new Set(['koddex', 'home', 'street', 'atelier', 'mairie']);
const lowQuality = () => { try { return localStorage.getItem('rdb.quality') === 'bas'; } catch { return false; } };
// art.day de l'agent art (tests : globalThis.__rdbArtDay le remplace)
const artDay = () => globalThis.__rdbArtDay ?? art?.day ?? null;
const useDay = (kind) => DAY_KINDS.has(kind) && !!artDay()?.start && !lowQuality();

export function createVignette(host) {
  const canvas = document.createElement('canvas');
  canvas.className = 'ui-vignette';
  canvas.setAttribute('aria-hidden', 'true');
  host.prepend(canvas);
  let renderer = null;
  let current = null;
  let name = null;
  let raf = 0;
  let last = 0;
  let broken = false;
  let frameHook = null;

  const size = () => ({ w: canvas.clientWidth || window.innerWidth, h: canvas.clientHeight || window.innerHeight });
  function resize() {
    const { w, h } = size();
    renderer?.setSize(w, h, false);
    current?.setAspect?.(w / Math.max(h, 1));
  }
  // Fond : 30 images/s au plus, densité de pixels 1 (le budget GPU va d'abord à la rue)
  function frame(t) {
    raf = requestAnimationFrame(frame);
    if (!current || document.hidden) return;
    if (last && t - last < 1000 / 30) return;
    const dt = last ? Math.min(0.1, (t - last) / 1000) : 0;
    last = t;
    current.update?.(dt);
    if (renderer && current.scene && current.camera) renderer.render(current.scene, current.camera);
    frameHook?.();
  }
  function stop() { cancelAnimationFrame(raf); raf = 0; last = 0; }

  function maker(next, arg) {
    if (useDay(next)) return { make: () => artDay().start(next), day: true };
    if (next === 'ending') return { make: typeof scenes.ending === 'function' ? () => scenes.ending(arg?.id, arg?.flags ?? []) : scenes.mairie };
    if (next === 'home') return { make: scenes.koddex }; // pas encore de bureau à la maison : celui de Koddex
    if (next === 'street') return { make: scenes.atelier }; // pas encore de rue de jour : l'atelier
    return { make: scenes[next] };
  }

  return {
    // name : 'koddex' | 'home' | 'street' | 'atelier' | 'mairie' | 'ending' | null
    set(next, arg) {
      const key = next === 'ending' ? `ending:${arg?.id ?? ''}` : `${next}${useDay(next) ? ':day' : ''}`;
      if (broken || key === name) return;
      current?.dispose?.();
      current = null;
      name = key;
      const { make, day } = next ? maker(next, arg) : {};
      canvas.classList.toggle('on', !!(next && make));
      host.dataset.stage = next && make && day ? 'day3d' : '2d';
      if (!next || !make) { stop(); return; }
      try {
        current = make();
        current.__day = !!day;
        if (current.scene) {
          renderer ??= new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
          renderer.setPixelRatio(1);
        }
        resize();
        if (!raf) raf = requestAnimationFrame(frame);
      } catch {
        broken = true;
        current = null;
        canvas.classList.remove('on');
        host.dataset.stage = '2d';
      }
    },
    // Le moniteur projeté à l'écran : [TL, TR, BR, BL] en px CSS, ou null (pas de scène 3D de jour, coin hors champ)
    screenQuad() {
      if (!current?.__day) return null;
      const { w, h } = size();
      try {
        if (typeof current.screenCorners === 'function' && current.camera) return projectCorners(current.screenCorners(), current.camera, w, h);
        if (typeof current.screenRect === 'function') return current.screenRect(w, h);
      } catch { /* scène en cours de changement */ }
      return null;
    },
    get is3d() { return !!current?.__day; },
    onFrame(fn) { frameHook = fn; },
    resize() { resize(); },
    pause() { stop(); },
    resume() { if (current && !raf) raf = requestAnimationFrame(frame); },
    dispose() { stop(); current?.dispose?.(); renderer?.dispose(); canvas.remove(); },
  };
}
