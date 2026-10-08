// Les phases de jour en 3D (v1.1, §12b.C) :
//   const ok = art.day.start('koddex', { host })   // false = qualité « Bas » : garder les vignettes 2D
//   art.day.screenRect()   → { x, y, width, height, corners } en px CSS : l'écran du moniteur (Koddex, maison)
//   art.day.onScreenRect(fn) → appelé à chaque frame avec ce rectangle (aligner le terminal HTML dessus)
//   art.day.stop()
// Scènes : 'koddex' (assis au bureau, vue subjective), 'street' (la rue de jour), 'atelier', 'mairie'.
// Un renderer et un canvas à part, plein écran derrière l'UI, 60 images/s au plus, en pause quand l'onglet est caché.
import * as THREE from 'three';
import { attachRigs } from './rig.js';
import { CAST, humanoid, setState, clodeBot } from './characters.js';
import { canvasTexture, panelTex } from './textures.js';
import { scenes as vignettes, M, kit as makeKit, codeTex, roofsTex } from './scenes.js';
import { QUALITY_PRESETS } from './quality.js';
import { createTwists } from './twists.js';

const level = () => { try { return localStorage.getItem('rdb.quality') ?? 'moyen'; } catch { return 'moyen'; } };

// ---------- Koddex : assis au bureau de Pilou, deux écrans, collègues, Stéphane qui passe ----------
function koddexScene() {
  const scene = new THREE.Scene();
  attachRigs(scene, { lod: false });
  const k = makeKit(scene);
  scene.background = new THREE.Color(0xe9dcc4);
  scene.add(new THREE.HemisphereLight(0xfff4e0, 0x8a6a50, 1.5));
  const sun = new THREE.DirectionalLight(0xffe8c8, 1.8); sun.position.set(3, 4, -2); scene.add(sun);
  const glowL = new THREE.PointLight(0x7fe0ff, 2.2, 2.5, 1.5); glowL.position.set(0.55, 1.15, -0.35); scene.add(glowL);
  // la pièce : plateau ouvert, grande fenêtre au fond sur les toits de Lille
  k.box(14, 0.1, 12, M(0x9a7a5a), 0, -0.05, -2);
  k.box(14, 3.4, 0.1, M(0xf2e6d2), 0, 1.7, -5.5);
  k.lit(roofsTex(), 1.2, 1.9, -5.44, 4.2, 1.9, 0, 0.95);
  for (const x of [-0.9, 1.2, 3.3]) k.box(0.1, 1.95, 0.12, M(0xffffff), x, 1.9, -5.4);
  k.box(4.3, 0.1, 0.14, M(0xffffff), 1.2, 0.9, -5.4); k.box(4.3, 0.1, 0.14, M(0xffffff), 1.2, 2.9, -5.4);
  k.box(0.1, 3.4, 12, M(0xe9dcc4), -5, 1.7, -2);
  k.lit(panelTex([['SHIP IT', 72], ['— Stéphane', 30]], '#ffcf5a', '#2b2b2b'), -2.6, 2.1, -5.44, 0.9, 0.55, 0, 0.3);
  k.lit(panelTex([['KODDEX', 64], ['on est une famille qui ship', 22]], '#2a2d36', '#7fe0ff'), -4.94, 2.0, -2.5, 1.6, 0.6, Math.PI / 2, 0.4);
  // le bureau de Pilou
  k.box(1.6, 0.05, 0.8, M(0xb08a62), 0, 0.74, -0.3);
  for (const x of [-0.75, 0.75]) k.box(0.05, 0.74, 0.7, M(0x6b4a2b), x, 0.37, -0.3);
  // écran principal (le terminal de l'UI s'aligne dessus) : face à la caméra
  k.box(0.66, 0.4, 0.035, M(0x22252b), -0.12, 1.08, -0.52);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.36), new THREE.MeshBasicMaterial({ map: codeTex(), color: 0x6a7080 }));
  screen.position.set(-0.12, 1.08, -0.5); scene.add(screen);
  k.box(0.05, 0.22, 0.05, M(0x22252b), -0.12, 0.86, -0.55); k.box(0.22, 0.015, 0.16, M(0x22252b), -0.12, 0.76, -0.55);
  // second écran, de biais : Clode Kode
  const clode = clodeBot(); clode.scale.setScalar(0.85); clode.position.set(0.48, 0.82, -0.45); clode.rotation.y = -0.45; scene.add(clode);
  clode.userData.rig.talk = 0.4;
  k.box(0.46, 0.022, 0.15, M(0x3a3d48), -0.12, 0.77, -0.12); // clavier
  k.box(0.06, 0.02, 0.1, M(0x3a3d48), 0.24, 0.77, -0.1); // souris
  k.box(0.08, 0.1, 0.08, M(0xf3b3c8), -0.62, 0.8, -0.25); // mug
  k.plant(0.62, 0.77, -0.55, 0.5); k.plant(-3.6, 0, -4.6, 1.5); k.plant(4.2, 0, -4.4, 1.3);
  for (let i = 0; i < 3; i++) k.box(0.002, 0.06, 0.06, M([0xf5d04a, 0xf28cb1, 0x9fe0c0][i]), -0.455, 1.2 - i * 0.07, -0.49 - i * 0.004); // post-it collés sur le bord de l'écran
  // collègues à leurs bureaux
  const colleagues = [[-2.4, -2.2, 0.4], [2.6, -2.6, -0.3], [-2.2, -4.0, 0.2], [2.4, -4.1, -0.2]].map(([x, z, ry], i) => {
    k.box(1.4, 0.05, 0.7, M(0xb08a62), x, 0.74, z - 0.45);
    k.box(0.55, 0.34, 0.03, M(0x22252b), x, 1.05, z - 0.65);
    k.lit(codeTex(), x, 1.05, z - 0.63, 0.5, 0.3, 0, 0.6);
    const p = humanoid({ pose: 'sit', anim: 'type', talk: 0.1, hair: ['bun', 'short', 'long', 'quiff'][i], shirt: [0x7fb685, 0x6c9bd2, 0xe3826f, 0xb48ed1][i] });
    p.position.set(x, 0, z); p.rotation.y = Math.PI + ry; scene.add(p);
    k.chair(x, z, Math.PI + ry, 0x3a3d48);
    return p;
  });
  void colleagues;
  // Stéphane traverse le plateau de temps en temps, téléphone à l'oreille
  const steph = CAST.stephane({ held: 'phone', expr: 'happy', talk: 1 }); scene.add(steph);
  const camera = new THREE.PerspectiveCamera(58, 16 / 9, 0.03, 60);
  const eye = new THREE.Vector3(-0.08, 1.16, 0.32), look = new THREE.Vector3(-0.08, 1.02, -0.5);
  return {
    scene, camera, screen,
    update(dt, t) {
      // tête qui bouge à peine (respiration, petits coups d'œil)
      camera.position.set(eye.x + Math.sin(t * 0.3) * 0.01, eye.y + Math.sin(t * 1.1) * 0.006, eye.z);
      camera.lookAt(look.x + Math.sin(t * 0.13) * 0.04, look.y + Math.sin(t * 0.17) * 0.015, look.z);
      // Stéphane : passe derrière les écrans toutes les ~35 s
      const u = (t % 35) / 9;
      steph.visible = u < 1;
      if (steph.visible) { steph.position.set(-4.5 + u * 9, 0, -1.6); steph.rotation.y = Math.PI / 2; }
      glowL.intensity = 2.0 + Math.sin(t * 2) * 0.2;
    },
  };
}

// ---------- La rue de jour : terrasses qu'on installe, livraison, Klaas et Tatie aux fenêtres, Biloute en promenade ----------
let dayStreet = null;
async function streetScene() {
  if (!dayStreet) {
    const { buildWorld } = await import('../world.js'); // import tardif : pas de cycle avec world.js
    const scene = new THREE.Scene();
    const world = buildWorld(scene, { role: 'day' });
    dayStreet = { scene, world };
  }
  const { scene, world } = dayStreet;
  // lumière du jour
  scene.background = canvasTexture(16, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#7fb6e8'); gr.addColorStop(1, '#e6eef2'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  scene.fog = new THREE.Fog(0xdfe8ee, 35, 120);
  if (!scene.userData.daylight) {
    scene.add(new THREE.HemisphereLight(0xdcecff, 0x8a7060, 1.4));
    const sun = new THREE.DirectionalLight(0xfff0d8, 2.6); sun.position.set(-20, 40, 15); scene.add(sun);
    scene.userData.daylight = true;
  }
  for (const l of world.streetLights ?? []) l.intensity = 0;
  const em = world.emissiveMaterials ?? [];
  // terrasses en cours d'installation : peu de monde, quelques cafés
  world.tables.forEach((t, i) => {
    t.group.visible = i % 3 !== 2;
    t.people.forEach((p, j) => { p.userData.rig.hidden = !(i % 4 === 0 && j < 2); setState(p, { held: 'coffee' }); });
  });
  const cast = world.cast;
  for (const id of ['dede', 'ghislain', 'seb', 'nico', 'hilde']) if (cast[id]) cast[id].visible = false;
  if (cast.cat) cast.cat.visible = true;
  const tw = createTwists(scene, world, { onFrame: world.onFrame, audio: null, anim: null });
  const van = tw.show('delivery_van');
  // un livreur fait des allers-retours avec un fût
  const porter = humanoid({ shirt: 0x2b4d7a, pants: 0x2f3542, anim: 'tray', talk: 0 }); scene.add(porter);
  const bz = world.anchors.pilouWindow.z;
  const W = Math.abs(world.window.pos.x) - 0.3;
  const camera = new THREE.PerspectiveCamera(55, 16 / 9, 0.05, 220);
  const j = cast.jeremie, dog = cast.dog;
  setState(j, { anim: 'leash' });
  return {
    scene, camera, screen: null,
    update(dt, t) {
      for (const e of em) e.m.emissiveIntensity = e.base * 0.25; // en plein jour, les vitrines brillent à peine
      world.steam.intensity = 1; world.steam.update(dt);
      // caméra : lent travelling à hauteur d'homme, de la place vers la rue de la Barre
      const z = 30 - ((t * 0.9) % 70);
      camera.position.set(0.8 + Math.sin(t * 0.1) * 0.4, 2.0, z);
      camera.lookAt(-0.6, 1.6, z - 10);
      // Jérémie et Biloute descendent la rue
      const dz = 34 - ((t * 1.1) % 80);
      dog.position.set(0.6, 0, dz); dog.rotation.y = Math.PI;
      j.position.set(0.9, 0, dz + 0.8); j.rotation.y = Math.PI;
      // le livreur : camionnette ↔ porte de l'estaminet
      const vz = bz + 9, u = (t % 12) / 6, k = u < 1 ? u : 2 - u;
      porter.position.set(0.1 + (-W + 0.9 - 0.1) * k, 0, vz - 2.6 + (world.anchors.bernadetteDoor.z - vz + 2.6) * k);
      porter.rotation.y = u < 1 ? Math.atan2(-W + 0.9 - 0.1, world.anchors.bernadetteDoor.z - vz + 2.6) : Math.atan2(0.1 + W - 0.9, vz - 2.6 - world.anchors.bernadetteDoor.z);
      void van;
    },
    dispose() { for (const e of em) e.m.emissiveIntensity = e.base; tw.clear(); },
  };
}

// Vignettes existantes (atelier, mairie) branchées dans la même boucle
const fromVignette = (make) => () => { const v = make(); return { scene: v.scene, camera: v.camera, screen: null, update: (dt) => v.update(dt), dispose: v.dispose }; };

export const DAY_SCENES = {
  koddex: koddexScene,
  street: streetScene,
  atelier: fromVignette(vignettes.atelier),
  mairie: fromVignette(vignettes.mairie),
};

export function createDay() {
  let renderer = null, canvas = null, current = null, name = null, raf = 0, last = 0, t = 0;
  let rect = null;
  const rectListeners = new Set();
  const v = new THREE.Vector3();

  function size() {
    const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
    renderer.setSize(w, h, false);
    if (current) { current.camera.aspect = w / Math.max(1, h); current.camera.updateProjectionMatrix(); }
  }
  function computeRect() {
    const s = current?.screen;
    if (!s) { rect = null; return; }
    s.updateMatrixWorld();
    const g = s.geometry.parameters, hw = g.width / 2, hh = g.height / 2;
    const r = canvas.getBoundingClientRect();
    const corners = [[-hw, hh], [hw, hh], [hw, -hh], [-hw, -hh]].map(([x, y]) => {
      v.set(x, y, 0).applyMatrix4(s.matrixWorld).project(current.camera);
      return { x: r.left + ((v.x + 1) / 2) * r.width, y: r.top + ((1 - v.y) / 2) * r.height };
    });
    const xs = corners.map((c) => c.x), ys = corners.map((c) => c.y);
    rect = { x: Math.min(...xs), y: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys), corners };
    for (const fn of rectListeners) fn(rect);
  }
  function frame(ts) {
    raf = requestAnimationFrame(frame);
    if (!current || document.hidden) return;
    if (last && ts - last < 1000 / 61) return;
    const dt = last ? Math.min(0.1, (ts - last) / 1000) : 0;
    last = ts; t += dt;
    current.update(dt, t);
    renderer.render(current.scene, current.camera);
    computeRect();
  }

  return {
    scenes: Object.keys(DAY_SCENES),
    // name : 'koddex' | 'street' | 'atelier' | 'mairie' (+ 'home', 'commute') · opts.host : l'élément où poser le canvas
    // (défaut : document.body, en fond) · opts.canvas : un canvas fourni par l'UI · opts.force : ignorer la qualité « Bas »
    async start(next, opts = {}) {
      if (!DAY_SCENES[next]) { console.warn(`art.day : scène inconnue « ${next} »`); return false; }
      const q = QUALITY_PRESETS[level()] ?? QUALITY_PRESETS.moyen;
      if (level() === 'bas' && !opts.force) return false; // « Bas » : l'UI garde ses vignettes 2D
      if (name === next && current) return true;
      this.stop({ keepCanvas: true });
      if (!canvas) {
        canvas = opts.canvas ?? document.createElement('canvas');
        if (!opts.canvas) {
          canvas.className = 'art-day';
          Object.assign(canvas.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', zIndex: '0', pointerEvents: 'none' });
          (opts.host ?? document.body).prepend(canvas);
        }
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        addEventListener('resize', () => renderer && size());
      }
      renderer.setPixelRatio(Math.min(q.maxPixelRatio, devicePixelRatio || 1) * q.pixelRatio);
      canvas.style.display = '';
      name = next; t = 0; last = 0;
      current = await DAY_SCENES[next]();
      size();
      if (!raf) raf = requestAnimationFrame(frame);
      return true;
    },
    stop({ keepCanvas = false } = {}) {
      cancelAnimationFrame(raf); raf = 0;
      current?.dispose?.(); current = null; name = null; rect = null;
      if (canvas && !keepCanvas) canvas.style.display = 'none';
    },
    screenRect: () => rect,
    onScreenRect(fn) { rectListeners.add(fn); return () => rectListeners.delete(fn); },
    get active() { return name; },
    // pour la QA : avance n frames sans requestAnimationFrame et rend
    step(n = 1) { for (let i = 0; i < n && current; i++) { t += 1 / 30; current.update(1 / 30, t); renderer.render(current.scene, current.camera); computeRect(); } return rect; },
    get canvas() { return canvas; },
  };
}
