// Vignettes 3D des phases de jour, rendues derrière l'UI 2D :
//   const v = art.scenes.koddex();  // { scene, camera, update(dt), setAspect(a), dispose() }
//   renderer.render(v.scene, v.camera) à chaque frame (le gameplay garde son renderer).
import * as THREE from 'three';
import { attachRigs } from './rig.js';
import { CAST, setState, humanoid } from './characters.js';
import { canvasTexture, panelTex, brickTex } from './textures.js';

const mats = new Map();
const M = (color, o = {}) => {
  const k = color + JSON.stringify(o);
  if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o }));
  return mats.get(k);
};
function kit(scene) {
  const add = (geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z); m.rotation.set(rx, ry, rz);
    scene.add(m);
    return m;
  };
  const box = (w, h, d, mat, x, y, z, ry = 0) => add(new THREE.BoxGeometry(w, h, d), mat, x, y, z, 0, ry);
  const plant = (x, y, z, s = 1) => {
    box(0.3 * s, 0.3 * s, 0.3 * s, M(0xc4714f), x, y + 0.15 * s, z);
    const leaf = M(0x5a9a52, { flatShading: true });
    add(new THREE.IcosahedronGeometry(0.28 * s, 0), leaf, x, y + 0.5 * s, z);
    add(new THREE.IcosahedronGeometry(0.2 * s, 0), leaf, x + 0.15 * s, y + 0.75 * s, z - 0.05);
  };
  const lit = (tex, x, y, z, w, h, ry = 0, intensity = 1) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: intensity }));
    m.position.set(x, y, z); m.rotation.y = ry; scene.add(m);
    return m;
  };
  const chair = (x, z, ry, color = 0x8a5a35) => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.05, 0.42), M(color)));
    g.children[0].position.y = 0.46;
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.45, 0.05), M(color)); back.position.set(0, 0.7, -0.2); g.add(back);
    for (const [a, b] of [[0.18, 0.18], [-0.18, 0.18], [0.18, -0.18], [-0.18, -0.18]]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.46, 0.04), M(color)); l.position.set(a, 0.23, b); g.add(l); }
    g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
    return g;
  };
  const seat = (p, x, z, ry) => { chair(x, z, ry); p.position.set(x, 0, z); p.rotation.y = ry; scene.add(p); return p; };
  return { add, box, plant, lit, chair, seat };
}
function vignette(build, { fov = 38, pos, look }) {
  const scene = new THREE.Scene();
  attachRigs(scene, { lod: false });
  const camera = new THREE.PerspectiveCamera(fov, 16 / 9, 0.05, 100);
  camera.position.set(...pos); camera.lookAt(...look);
  const hooks = [];
  build(scene, kit(scene), (fn) => hooks.push(fn));
  let t = 0;
  return {
    scene, camera,
    update(dt) { t += dt; for (const h of hooks) h(dt, t); },
    setAspect(a) { camera.aspect = a; camera.updateProjectionMatrix(); },
    dispose() { scene.traverse((o) => { if (o.isMesh && !o.isInstancedMesh) o.geometry.dispose(); }); },
  };
}

// Écran de code et écran Clode Kode
const codeTex = () => canvasTexture(256, 160, (g, w, h) => {
  g.fillStyle = '#1b1f2a'; g.fillRect(0, 0, w, h);
  const cols = ['#c792ea', '#82aaff', '#c3e88d', '#f78c6c', '#89ddff', '#eeffff'];
  for (let y = 10; y < h - 6; y += 9) {
    let x = 8 + (Math.floor(y / 9) % 4) * 10;
    while (x < w - 20 && Math.random() < 0.85) { const l = 8 + Math.random() * 34; g.fillStyle = cols[Math.floor(Math.random() * cols.length)]; g.fillRect(x, y, l, 4); x += l + 5; }
  }
});
const clodeTex = (blink = false) => canvasTexture(256, 160, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#16324a'); gr.addColorStop(1, '#0d1d2c');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = '#7fe0ff';
  if (blink) g.fillRect(84, 62, 26, 5), g.fillRect(146, 62, 26, 5);
  else g.fillRect(88, 44, 18, 30), g.fillRect(150, 44, 18, 30);
  g.beginPath(); g.arc(128, 92, 22, 0.15 * Math.PI, 0.85 * Math.PI); g.lineWidth = 6; g.strokeStyle = '#7fe0ff'; g.stroke();
  g.font = 'bold 18px ui-monospace, monospace'; g.fillText('Clode Kode', 76, 140);
});
const skyTex = (top, bottom) => canvasTexture(16, 128, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, top); gr.addColorStop(1, bottom); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
// Toits de Lille vus par la fenêtre : pignons à gradins en silhouette
const roofsTex = () => canvasTexture(512, 256, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#9fd0f2'); gr.addColorStop(1, '#fbe6c8');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  let x = -10;
  while (x < w) {
    const bw = 50 + Math.random() * 50, top = 110 + Math.random() * 60;
    g.fillStyle = ['#b5553f', '#c46a4a', '#a8483a', '#d08a5a'][Math.floor(Math.random() * 4)];
    g.fillRect(x, top, bw, h - top);
    for (let s = 0; s < 4; s++) g.fillRect(x + (s * bw) / 9, top - (s + 1) * 12, bw - (2 * s * bw) / 9, 12);
    g.fillStyle = '#f2e4c8';
    for (let wy = top + 14; wy < h - 10; wy += 26) for (let wx = x + 8; wx < x + bw - 10; wx += 16) g.fillRect(wx, wy, 7, 12);
    x += bw + 2;
  }
});

export const scenes = {
  // Matin chez Koddex : Pilou à son bureau, deux écrans, plantes, la lueur de Clode Kode
  koddex: () => vignette((scene, k, onUpdate) => {
    scene.background = new THREE.Color(0xf3e3c8);
    scene.add(new THREE.HemisphereLight(0xfff4e0, 0x8a6a50, 1.6));
    const sun = new THREE.DirectionalLight(0xffe0b0, 2.2); sun.position.set(3, 4, 2); scene.add(sun);
    const glow = new THREE.PointLight(0x7fe0ff, 3, 4, 1.5); glow.position.set(0.5, 1.3, -0.6); scene.add(glow);
    k.box(8, 0.1, 6, M(0xb08058), 0, -0.05, 0); // parquet
    k.box(8, 3.2, 0.1, M(0xf2d9b3), 0, 1.6, -1.6); // mur du fond
    k.box(0.1, 3.2, 6, M(0xe9cfa6), -3.2, 1.6, 0.9);
    k.lit(roofsTex(), 2.2, 1.9, -1.54, 1.8, 1.2, 0, 0.9); // fenêtre
    k.box(1.95, 0.08, 0.1, M(0xffffff), 2.2, 1.27, -1.5); k.box(1.95, 0.08, 0.1, M(0xffffff), 2.2, 2.53, -1.5);
    k.box(0.08, 1.3, 0.1, M(0xffffff), 2.2, 1.9, -1.5);
    k.lit(panelTex([['SHIP IT', 72], ['— Stéphane', 30]], '#ffcf5a', '#2b2b2b'), -1.6, 2.1, -1.54, 0.9, 0.55, 0, 0.3); // affiche du patron
    k.box(2.2, 0.06, 0.9, M(0x9a6b42), 0.2, 0.75, -0.9); // bureau
    for (const x of [-0.8, 1.2]) k.box(0.06, 0.75, 0.8, M(0x7a5232), x, 0.375, -0.9);
    const code = k.lit(codeTex(), -0.25, 1.22, -1.17, 0.62, 0.38, 0.12, 0.9);
    const clode = k.lit(clodeTex(), 0.6, 1.22, -1.17, 0.62, 0.38, -0.12, 1.0);
    for (const [x, ry] of [[-0.25, 0.12], [0.6, -0.12]]) { k.box(0.66, 0.42, 0.04, M(0x22252b), x, 1.22, -1.2, ry); k.box(0.06, 0.25, 0.06, M(0x22252b), x, 0.93, -1.2); }
    k.box(0.5, 0.025, 0.16, M(0x3a3d48), 0.15, 0.79, -0.65); // clavier
    k.box(0.08, 0.1, 0.08, M(0xf3b3c8), 0.75, 0.83, -0.6); // tasse
    k.plant(-0.75, 0.78, -1.05, 0.7); k.plant(-2.6, 0, -1.2, 1.4); k.plant(2.9, 0, 0.2, 1.1);
    const pilou = CAST.pilou({ pose: 'sit' });
    k.seat(pilou, 0.15, -0.25, Math.PI);
    setState(pilou, { anim: 'type', expr: 'neutral' });
    pilou.rotation.y = Math.PI; // dos à la caméra, face aux écrans
    const blinkA = clodeTex(false), blinkB = clodeTex(true);
    onUpdate((dt, t) => {
      const b = t % 4 < 0.12;
      clode.material.emissiveMap = clode.material.map = b ? blinkB : blinkA;
      glow.intensity = 2.6 + Math.sin(t * 2) * 0.4;
      code.material.emissiveIntensity = 0.85 + Math.sin(t * 7) * 0.05;
    });
  }, { pos: [2.3, 1.9, 2.9], look: [0.1, 1.0, -0.8] }),

  // Après-midi : l'ancienne carrosserie d'Hippolyte, salle de réunion de l'association
  atelier: () => vignette((scene, k, onUpdate) => {
    scene.background = new THREE.Color(0x2a1d16);
    scene.add(new THREE.HemisphereLight(0xffe2b8, 0x3a2418, 1.2));
    const bulbs = [];
    for (const x of [-1.5, 0, 1.5]) {
      const l = new THREE.PointLight(0xffc27a, 4, 6, 1.6); l.position.set(x, 2.4, 0); scene.add(l);
      k.add(new THREE.SphereGeometry(0.08, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffe2a8 }), x, 2.45, 0);
      k.add(new THREE.CylinderGeometry(0.005, 0.005, 1.1, 4), M(0x222222), x, 3.05, 0);
      bulbs.push(l);
    }
    const brick = new THREE.MeshStandardMaterial({ map: brickTex(12, 40, 40, 9), roughness: 0.9 });
    brick.map.repeat.set(4, 2);
    k.box(10, 4, 0.2, brick, 0, 2, -3); k.box(0.2, 4, 8, brick, -4.5, 2, 0);
    k.box(10, 0.1, 8, M(0x6b5a4a), 0, -0.05, 0); // pavés de la cour intérieure
    for (const x of [-3, -1, 1, 3]) k.box(0.25, 0.25, 8, M(0x5a3a24), x, 3.6, 0); // poutres
    // la vieille calèche en restauration, au fond
    const wood = M(0x2f4a3a), gold = M(0xc9a227, { metalness: 0.6, roughness: 0.3 });
    const cx = -2.6, cz = -1.9;
    k.box(1.6, 0.9, 1.0, wood, cx, 1.05, cz); k.box(1.2, 0.4, 0.95, wood, cx, 1.7, cz);
    k.box(1.65, 0.05, 1.05, gold, cx, 1.5, cz);
    for (const [dx, r] of [[-0.6, 0.45], [0.65, 0.35]]) for (const dz of [-0.55, 0.55]) {
      k.add(new THREE.TorusGeometry(r, 0.04, 5, 16), M(0x3a2a1a), cx + dx, r, cz + dz);
      for (let s = 0; s < 6; s++) k.add(new THREE.BoxGeometry(0.02, r * 2, 0.02), M(0x8a5a35), cx + dx, r, cz + dz, 0, 0, (s * Math.PI) / 6);
    }
    k.lit(panelTex([['ASSOCIATION DE LA', 34], ['RUE DES BOUCHERS', 46]], '#f4efe2', '#2b4d7a'), 1.4, 2.4, -2.88, 2.2, 0.75, 0, 0.25);
    // grande table et les membres
    k.box(3.2, 0.07, 1.1, M(0x8a5a35), 0.3, 0.76, 0);
    for (const x of [-1.1, 1.7]) k.box(0.08, 0.76, 0.9, M(0x6b4423), x, 0.38, 0);
    for (let i = 0; i < 5; i++) k.box(0.21, 0.01, 0.3, M(0xf6f2ea), -0.8 + i * 0.6, 0.8, (i % 2 ? 0.2 : -0.15), (i - 2) * 0.2);
    k.box(0.08, 0.1, 0.08, M(0xf3b3c8), 0.9, 0.85, 0.1); // la tisane de Hilde
    const cast = [
      [CAST.jeremie({ pose: 'sit', anim: 'meeting', held: 'clipboard' }), -0.6, -0.75, 0],
      [CAST.klaas('sit'), 0.3, -0.75, 0],
      [CAST.hilde('sit'), 1.2, -0.75, 0],
      [CAST.tatie('sit'), -0.6, 0.75, Math.PI],
      [CAST.seb('sit'), 0.3, 0.75, Math.PI],
      [CAST.nico('sit'), 1.2, 0.75, Math.PI],
      [CAST.pilou({ pose: 'sit' }), -1.5, 0, Math.PI / 2],
    ];
    for (const [p, x, z, ry] of cast) { k.seat(p, x, z, ry); if (p.userData.rig.anim === 'write') setState(p, { anim: 'write' }); else if (p.userData.rig.anim !== 'meeting') setState(p, { anim: 'idle' }); }
    const hip = CAST.hippolyte({ anim: 'cane' }); hip.position.set(2.35, 0, 0.1); hip.rotation.y = -Math.PI / 2; scene.add(hip);
    const dog = CAST.biloute(); dog.position.set(-0.9, 0, -1.3); dog.rotation.y = 0.6; scene.add(dog);
    onUpdate((dt, t) => { bulbs.forEach((l, i) => { l.intensity = 4 + Math.sin(t * 3 + i * 2) * 0.15; }); });
  }, { pos: [4.2, 2.7, 4.0], look: [-0.4, 0.9, -0.8] }),

  // Mairie : salle de la commission des terrasses (J14)
  mairie: () => vignette((scene, k) => {
    scene.background = new THREE.Color(0x3a2a22);
    scene.add(new THREE.HemisphereLight(0xfff0dc, 0x4a3020, 1.4));
    const sun = new THREE.DirectionalLight(0xfff0d0, 1.5); sun.position.set(-3, 5, 3); scene.add(sun);
    k.box(12, 0.1, 10, M(0x7a4a2e), 0, -0.05, 0); // parquet
    k.box(12, 5, 0.2, M(0x8a5a35), 0, 2.5, -3.5); // boiseries
    for (const x of [-4, -1.3, 1.3, 4]) k.box(0.15, 5, 0.25, M(0x6b4423), x, 2.5, -3.35);
    for (const x of [-2.65, 2.65]) { // hautes fenêtres
      k.lit(skyTex('#9fd0f2', '#fbe6c8'), x, 3.0, -3.38, 1.1, 2.4, 0, 0.8);
      k.box(1.2, 0.08, 0.1, M(0xf6f2ea), x, 1.8, -3.35); k.box(0.08, 2.5, 0.1, M(0xf6f2ea), x, 3.0, -3.35);
    }
    // drapeaux : France et Lille (rouge, fleur de lys blanche stylisée)
    const flag = (x, cols) => { cols.forEach((c, i) => k.box(0.25, 1.2, 0.02, M(c), x - 0.25 + i * 0.25, 3.0, -3.3)); k.box(0.03, 2.6, 0.03, M(0xc9a227, { metalness: 0.6 }), x - 0.4, 2.3, -3.3); };
    flag(-0.8, [0x1f3a8a, 0xf6f2ea, 0xd2232a]);
    flag(0.9, [0xc0262d, 0xc0262d, 0xc0262d]);
    k.lit(panelTex([['COMMISSION DES TERRASSES', 40], ['Rue des Bouchers · séance publique', 26]], '#f4efe2', '#7a2a2a'), 0, 4.3, -3.38, 3.4, 0.7, 0, 0.3);
    // estrade et table des élus
    k.box(6, 0.3, 1.6, M(0x6b4423), 0, 0.15, -2.2);
    k.box(4.4, 0.08, 0.8, M(0x5a3a24), 0, 1.06, -2.1); k.box(4.4, 0.7, 0.05, M(0x7a2a2a), 0, 0.7, -1.72);
    const dais = [[CAST.delphine({ pose: 'sit', held: 'clipboard', anim: 'clipboard' }), -1.4], [CAST.lescaut({ pose: 'sit', anim: 'meeting' }), 0], [CAST.chef({ pose: 'sit', anim: 'meeting' }), 1.4]];
    for (const [p, x] of dais) {
      k.chair(x, -2.6, 0, 0x4a2a1a).position.y = 0.3;
      p.position.set(x, 0.3, -2.6); scene.add(p);
      k.box(0.4, 0.16, 0.04, M(0xf6f2ea), x, 1.18, -1.72);
      k.add(new THREE.CylinderGeometry(0.008, 0.008, 0.3, 4), M(0x222222), x + 0.2, 1.25, -1.95, 0.4);
    }
    // le public : association à gauche, le bloc à droite, chacun sur sa chaise
    const pub = [
      [CAST.jeremie({ pose: 'sit', anim: 'meeting' }), -2.2, 0.4], [CAST.tatie('sit'), -1.4, 0.4], [CAST.klaas('sit'), -2.2, 1.5], [CAST.hilde('sit'), -1.4, 1.5],
      [CAST.seb('sit'), -2.2, 2.6], [CAST.nico('sit'), -1.4, 2.6], [CAST.pilou({ pose: 'sit' }), -0.6, 0.4],
      [CAST.dede({ pose: 'sit', anim: 'meeting' }), 1.2, 0.4], [CAST.ghislain({ pose: 'sit', held: null }), 2.0, 0.4], [CAST.colette({ pose: 'sit' }), 2.0, 1.5],
      [humanoid({ pose: 'sit', talk: 0.3 }), 1.2, 1.5], [humanoid({ pose: 'sit', talk: 0.3 }), 1.2, 2.6], [humanoid({ pose: 'sit', talk: 0.3 }), 2.0, 2.6],
    ];
    for (const [p, x, z] of pub) { k.seat(p, x, z, Math.PI); if (!['write', 'meeting'].includes(p.userData.rig.anim)) setState(p, { anim: 'idle' }); p.userData.rig.talk = 0.25; }
  }, { pos: [0, 2.6, 6.2], look: [0, 1.2, -1.5] }),
};
