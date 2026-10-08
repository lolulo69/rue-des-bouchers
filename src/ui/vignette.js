// Scènes 3D des phases de jour, derrière l'interface.
//   v1.1 (§12b C/D) : art.day (agent art) — `await art.day.start(name, { host })` → true, ou false sur « Bas » ;
//   il dessine sur son propre canvas et publie le moniteur (`art.day.onScreenRect(fn)` : { x, y, width, height, corners }
//   en px CSS) pour y poser le terminal. Scènes : art.day.scenes ('koddex', 'street', 'atelier', 'mairie', puis 'home'…).
//   Repli : les vignettes art.scenes sur notre propre canvas (qualité « Bas », scène pas encore livrée, pas de WebGL).
import * as THREE from 'three';
import { scenes } from '../art/scenes.js';
import { art } from '../art/index.js';

// art.day de l'agent art (tests : globalThis.__rdbArtDay le remplace)
const artDay = () => globalThis.__rdbArtDay ?? art?.day ?? null;
const dayHas = (kind) => { const d = artDay(); return !!d?.start && (!d.scenes || d.scenes.includes(kind)); };
// Vignette 2D de repli pour chaque écran
const FALLBACK = { koddex: 'koddex', home: 'koddex', street: 'atelier', atelier: 'atelier', mairie: 'mairie' };

export function createVignette(host) {
  const canvas = document.createElement('canvas');
  canvas.className = 'ui-vignette';
  canvas.setAttribute('aria-hidden', 'true');
  host.prepend(canvas);
  let renderer = null;
  let current = null; // vignette 2D de repli
  let name = null;
  let raf = 0;
  let last = 0;
  let broken = false;
  let frameHook = null;
  let day = false; // art.day est actif pour l'écran courant
  let token = 0;
  let offRect = null;

  const size = () => ({ w: canvas.clientWidth || window.innerWidth, h: canvas.clientHeight || window.innerHeight });
  function resize() {
    const { w, h } = size();
    renderer?.setSize(w, h, false);
    current?.setAspect?.(w / Math.max(h, 1));
  }
  function frame(t) {
    raf = requestAnimationFrame(frame);
    if (!current || document.hidden) return;
    if (last && t - last < 1000 / 30) return;
    const dt = last ? Math.min(0.1, (t - last) / 1000) : 0;
    last = t;
    current.update?.(dt);
    renderer?.render(current.scene, current.camera);
  }
  function stop() { cancelAnimationFrame(raf); raf = 0; last = 0; }
  function stopFallback() { stop(); current?.dispose?.(); current = null; canvas.classList.remove('on'); }
  function stopDay() { if (day) { try { artDay()?.stop?.(); } catch { /* rien */ } } day = false; offRect?.(); offRect = null; }

  function startFallback(kind, arg) {
    const make = kind === 'ending'
      ? (typeof scenes.ending === 'function' ? () => scenes.ending(arg?.id, arg?.flags ?? []) : scenes.mairie)
      : scenes[FALLBACK[kind] ?? kind];
    if (!make || broken) return;
    try {
      current = make();
      renderer ??= new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.setPixelRatio(1);
      canvas.classList.add('on');
      resize();
      if (!raf) raf = requestAnimationFrame(frame);
    } catch { broken = true; current = null; canvas.classList.remove('on'); }
  }

  return {
    // name : 'koddex' | 'home' | 'street' | 'atelier' | 'mairie' | 'ending' | null
    set(next, arg) {
      const key = next === 'ending' ? `ending:${arg?.id ?? ''}` : next;
      if (key === name) return;
      name = key;
      const my = ++token;
      stopFallback();
      host.dataset.stage = '2d';
      if (!next) { stopDay(); return; }
      if (next !== 'ending' && dayHas(next)) {
        // art.day d'abord ; s'il refuse (« Bas ») ou échoue : la vignette 2D
        Promise.resolve().then(() => artDay().start(next, { host })).then((ok) => {
          if (my !== token) return;
          if (!ok) { stopDay(); startFallback(next, arg); return; }
          day = true;
          host.dataset.stage = 'day3d';
          offRect ??= artDay().onScreenRect?.(() => frameHook?.()) ?? null;
          frameHook?.();
        }).catch(() => { if (my === token) { stopDay(); startFallback(next, arg); } });
      } else {
        stopDay();
        startFallback(next, arg);
      }
    },
    // Le moniteur projeté : [TL, TR, BR, BL] en px CSS, ou null (pas de scène de jour 3D ou pas d'écran)
    screenQuad() {
      if (!day) return null;
      const r = artDay()?.screenRect?.();
      if (!r) return null;
      if (r.corners?.length === 4) return r.corners;
      return [{ x: r.x, y: r.y }, { x: r.x + r.width, y: r.y }, { x: r.x + r.width, y: r.y + r.height }, { x: r.x, y: r.y + r.height }];
    },
    get is3d() { return day; },
    onFrame(fn) { frameHook = fn; },
    resize() { resize(); },
    // UI cachée (la nuit 3D) : tout s'arrête, art.day compris ; au retour, le prochain set() relance la scène
    pause() { stopFallback(); stopDay(); name = null; token++; },
    resume() {},
    dispose() { stopFallback(); stopDay(); renderer?.dispose(); canvas.remove(); },
  };
}
