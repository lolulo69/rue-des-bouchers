// Vignettes 3D des phases de jour (art.scenes.koddex / atelier / mairie), rendues dans un canvas derrière les cartes.
// Un petit renderer à part, créé à la demande, en pause quand l'UI est cachée. En cas d'échec WebGL : rien (fond chaud seul).
import * as THREE from 'three';
import { scenes } from '../art/scenes.js';

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

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const hgt = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, hgt, false);
    current?.setAspect(w / Math.max(hgt, 1));
  }
  // Fond décoratif : 30 images/s au plus, densité de pixels 1 (le budget GPU va d'abord à la rue)
  function frame(t) {
    raf = requestAnimationFrame(frame);
    if (!current || !renderer || document.hidden) return;
    if (last && t - last < 1000 / 30) return;
    const dt = last ? Math.min(0.1, (t - last) / 1000) : 0;
    last = t;
    current.update(dt);
    renderer.render(current.scene, current.camera);
  }
  function stop() { cancelAnimationFrame(raf); raf = 0; last = 0; }

  return {
    // name : 'koddex' | 'atelier' | 'mairie' | null
    set(next) {
      if (broken || next === name) return;
      current?.dispose?.();
      current = null;
      name = next;
      canvas.classList.toggle('on', !!next);
      if (!next || !scenes[next]) { stop(); return; }
      try {
        renderer ??= new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setPixelRatio(1);
        current = scenes[next]();
        resize();
        if (!raf) raf = requestAnimationFrame(frame);
      } catch {
        broken = true;
        canvas.classList.remove('on');
      }
    },
    resize() { if (renderer) resize(); },
    pause() { stop(); },
    resume() { if (current && !raf) raf = requestAnimationFrame(frame); },
    dispose() { stop(); current?.dispose?.(); renderer?.dispose(); canvas.remove(); },
  };
}
