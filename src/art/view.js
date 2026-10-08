// Ajustements de caméra faits juste avant le rendu (après le placement de la caméra par le jeu) :
//  - « se pencher » : chez Pilou, à moins d'un mètre de la fenêtre et en regardant vers le bas, la caméra glisse
//    de ~0,4 m vers la rue et descend un peu : on voit la terrasse juste en dessous sans coller au chambranle ;
//  - écran titre : pendant que #title est affiché, lent travelling le long de la rue au crépuscule.
// Le jeu remet sa caméra à chaque frame, donc ces décalages ne s'accumulent pas.
import * as THREE from 'three';

const smooth = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

export function createView(world, { onFrame }) {
  const win = world.window.pos;          // centre de la fenêtre de Pilou (côté appartement)
  const apt = world.apt;
  const dir = win.x < 0 ? 1 : -1;        // vers la rue
  const opts = { lean: true, leanForward: 0.4, leanDown: 0.15, title: true };
  let lean = 0;
  let titleEl = null, titleT = 0;
  const look = new THREE.Vector3(), from = new THREE.Vector3();
  // Le titre laisse voir la rue : fond dégradé translucide au lieu du voile presque opaque (classe ajoutée par l'art)
  if (typeof document !== 'undefined' && !document.getElementById('art-title-style')) {
    const st = document.createElement('style');
    st.id = 'art-title-style';
    st.textContent = '#title.art-backdrop{background:radial-gradient(ellipse at 50% 45%,#0d0d1288 0%,#0d0d12a8 55%,#0d0d12dd 100%)}#title.art-backdrop h1{text-shadow:0 3px 18px #000c}';
    document.head.appendChild(st);
  }

  onFrame((dt, t, camera) => {
    if (!camera?.isPerspectiveCamera) return;
    // ---- écran titre : travelling de la place vers la rue de la Barre, au crépuscule ----
    titleEl ??= typeof document !== 'undefined' ? document.getElementById('title') : null;
    if (opts.title && titleEl && !titleEl.classList.contains('hidden') && titleEl.offsetParent !== null) {
      titleEl.classList.add('art-backdrop');
      titleT += dt;
      const L = 85, u = (titleT * 0.9) % (2 * L); // aller-retour lent
      const z = u < L ? 38 - u : 38 - (2 * L - u);
      const sway = Math.sin(titleT * 0.13) * 0.6;
      from.set(0.4 + sway, 2.6 + Math.sin(titleT * 0.21) * 0.25, z);
      look.set(-0.6 - sway * 0.5, 2.2, z - 12);
      camera.position.copy(from);
      camera.lookAt(look);
      camera.updateMatrixWorld();
      return;
    }
    titleT = 0;
    // ---- se pencher à la fenêtre ----
    const p = camera.position;
    const inApt = p.y > apt.floor + 0.5 && p.x < apt.x1 + 0.4 && p.x > apt.x0;
    const nearWin = inApt && Math.abs(p.z - win.z) < 1.0 && Math.abs(p.x - win.x) < 1.0;
    const pitch = camera.rotation.order === 'YXZ' ? camera.rotation.x : 0;
    const want = opts.lean && nearWin && pitch < -0.5 ? smooth((-0.5 - pitch) / 0.35) * smooth(1 - Math.abs(p.z - win.z)) : 0;
    lean += (want - lean) * Math.min(1, dt * 6);
    if (lean > 0.002) {
      p.x += dir * opts.leanForward * lean;
      p.y -= opts.leanDown * lean;
      camera.updateMatrixWorld();
    }
  });

  return {
    get leaning() { return lean; },
    set(o) { Object.assign(opts, o); },
    options: opts,
  };
}
