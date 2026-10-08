// Portraits pour les boîtes de dialogue et les cartes d'événement : art.portrait(id, expression) → dataURL (PNG).
// Rendu dans un petit WebGL hors écran, mis en cache. Les ids viennent de src/content/characters.js.
import * as THREE from 'three';
import { attachRigs } from './rig.js';
import { CAST, CAST_IDS, EXPRESSIONS } from './characters.js';
import { CHARACTERS } from '../content/characters.js';
import { canvasTexture } from './textures.js';

// Fond par camp (dégradé doux)
const BG = {
  player: ['#fbe3a8', '#e59a62'], asso: ['#ffe9c4', '#f2a96b'], animal: ['#fff1d6', '#e8c07a'], bloc: ['#f7c2b4', '#b04a3c'],
  police: ['#c7d8f5', '#3f5f9e'], city: ['#e3d5f5', '#7a5c96'], koddex: ['#c9f2ea', '#2a8f84'], other: ['#ece6d6', '#8a7a5a'],
};
const POSE_ARG = new Set(['klaas', 'hilde', 'tatie', 'seb', 'nico']);

let R = null;
function setup(size) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setSize(size, size, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  attachRigs(scene, { lod: false });
  scene.add(new THREE.HemisphereLight(0xfff4e6, 0x6a5040, 2.2));
  const key = new THREE.DirectionalLight(0xffe2c0, 2.2); key.position.set(-1.5, 2, 3); scene.add(key);
  const rim = new THREE.DirectionalLight(0xbfd8ff, 1.6); rim.position.set(2, 1.5, -2.5); scene.add(rim);
  const camera = new THREE.PerspectiveCamera(28, 1, 0.05, 20);
  R = { canvas, renderer, scene, camera, size, chars: new Map(), bgs: new Map(), cache: new Map() };
}

function bgTex(group) {
  if (!R.bgs.has(group)) {
    const [a, b] = BG[group] ?? BG.other;
    R.bgs.set(group, canvasTexture(64, 64, (g, w, h) => {
      const gr = g.createRadialGradient(w * 0.5, h * 0.35, 4, w * 0.5, h * 0.5, w * 0.75);
      gr.addColorStop(0, a); gr.addColorStop(1, b);
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    }));
  }
  return R.bgs.get(group);
}

function character(id) {
  if (!R.chars.has(id)) {
    const make = CAST[id];
    if (!make) throw new Error(`art.portrait : personnage inconnu « ${id} »`);
    const p = POSE_ARG.has(id) ? make('stand') : make();
    const rig = p.userData.rig;
    rig.still = true; rig.talk = 0;
    if (rig.anim && !['tray', 'cane', 'clipboard'].includes(rig.anim)) rig.anim = 'idle';
    p.visible = false;
    R.scene.add(p);
    R.chars.set(id, p);
  }
  return R.chars.get(id);
}

// Cadrage « tête et épaules » selon le type de personnage
function frame(p) {
  const rig = p.userData.rig, kind = p.userData.kind;
  let head, dist = 1.45;
  if (kind === 'human') { const k = rig.k; head = new THREE.Vector3(0, k.hipY + k.neck + 0.92 * k.r, 0); dist = 1.55 + k.r * 2; }
  else if (kind === 'dog') { head = new THREE.Vector3(0, 0.3, 0.28); dist = 0.95; }
  else if (kind === 'cat') { head = new THREE.Vector3(0, 0.3, 0.03); dist = 0.85; }
  else { head = new THREE.Vector3(0, 0.3, 0); dist = 1.3; }
  R.camera.position.set(head.x + dist * 0.28, head.y + 0.05, head.z + dist);
  R.camera.lookAt(head.x, head.y - (kind === 'human' ? 0.08 : 0.02), head.z);
}

/**
 * art.portrait(id, expression = 'neutral', { size = 256 }) → 'data:image/png;base64,...'
 * expression : neutral | happy | angry | suspicious | surprised | sad | sick
 */
export function portrait(id, expression = 'neutral', { size = 256 } = {}) {
  const key = `${id}|${expression}|${size}`;
  if (R?.cache.has(key)) return R.cache.get(key);
  if (!R || R.size !== size) { R?.renderer.dispose(); setup(size); }
  const p = character(id);
  for (const c of R.chars.values()) c.visible = c === p;
  const rig = p.userData.rig;
  rig.expr = EXPRESSIONS[expression] ? expression : 'neutral';
  R.scene.background = bgTex(CHARACTERS[id]?.group ?? 'other');
  p.updateMatrixWorld(true);
  frame(p);
  // deux rendus : le premier calcule les os (animate), le second dessine la pose à jour
  R.renderer.render(R.scene, R.camera);
  R.renderer.render(R.scene, R.camera);
  const url = R.canvas.toDataURL('image/png');
  R.cache.set(key, url);
  return url;
}
export const portraitIds = () => CAST_IDS.filter((id) => CAST[id]);
export const portraitExpressions = Object.keys(EXPRESSIONS);
