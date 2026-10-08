// Personnages et accessoires "instanciés" : chaque personnage est un simple Object3D (proxy) que le gameplay
// peut déplacer, tourner, cacher (visible = false) ou retirer de la scène comme avant. Ses morceaux (tête, yeux,
// bras, chaises...) sont dessinés par des InstancedMesh partagés : une trentaine de draw calls pour toute la rue,
// quel que soit le nombre de clients. Mise à jour juste avant chaque rendu (scene.onBeforeRender), donc aucun
// appel à ajouter dans la boucle de jeu.
import * as THREE from 'three';

const limbGeo = () => {
  // Capsule dont le pivot est en haut (épaule / hanche) et qui descend sur 1 unité, diamètre 1.
  const g = new THREE.CapsuleGeometry(0.5, 1, 4, 8);
  g.translate(0, -1, 0);
  g.scale(1, 0.5, 1);
  return g;
};
const torsoGeo = () => new THREE.LatheGeometry(
  [[0, 0], [0.4, 0], [0.5, 0.12], [0.52, 0.42], [0.48, 0.72], [0.36, 0.92], [0.16, 1], [0, 1]].map(([x, y]) => new THREE.Vector2(x, y)),
  14,
);

export const GEO = {
  head: new THREE.SphereGeometry(1, 16, 11),
  sphere: new THREE.SphereGeometry(1, 11, 8),
  ball: new THREE.SphereGeometry(1, 8, 6),
  hemi: new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
  limb: limbGeo(),
  torso: torsoGeo(),
  cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 12),
  cone: new THREE.ConeGeometry(0.5, 1, 12),
  skirt: new THREE.CylinderGeometry(0.3, 0.5, 1, 14),
  box: new THREE.BoxGeometry(1, 1, 1),
  torus: new THREE.TorusGeometry(1, 0.16, 6, 18),
};
export const defineGeo = (name, geo) => { GEO[name] = geo; };

const MATS = {
  solid: new THREE.MeshLambertMaterial({ color: 0xffffff }),
  glow: new THREE.MeshBasicMaterial({ color: 0xffffff }),
};
// Un peu d'auto-éclairage proportionnel à la couleur (style "cozy") : persos lisibles la nuit sans lumière en plus
MATS.solid.onBeforeCompile = (sh) => {
  sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n\ttotalEmissiveRadiance += diffuseColor.rgb * 0.2;');
};

// ---------- Construction ----------
const _e = new THREE.Euler(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
export function matrix(pos = [0, 0, 0], scale = 1, rot) {
  rot ??= [0, 0, 0];
  const s = typeof scale === 'number' ? [scale, scale, scale] : scale;
  return new THREE.Matrix4().compose(_p.set(...pos), _q.setFromEuler(_e.set(...rot)), _s.set(...s));
}
// Un morceau : géométrie partagée + os + transformation locale + couleur. glow = non éclairé (bougies, braises, yeux de chat).
export function part(geo, bone, pos, scale, color, rot, glow = false) {
  return { key: geo + (glow ? '*' : ''), geo, glow, bone, m: matrix(pos, scale, rot), c: new THREE.Color(color) };
}

const registry = new Set();
// Crée le proxy d'un "rig" : parts + fonction d'animation qui remplit rig.bones (Matrix4 relatives au proxy).
export function makeRig(parts, { bones = ['root'], animate = null, data = {} } = {}) {
  const proxy = new THREE.Object3D();
  const rig = { parts, animate, bones: {}, boneW: {}, seed: Math.random(), st: {}, ...data };
  for (const b of bones) { rig.bones[b] = new THREE.Matrix4(); rig.boneW[b] = new THREE.Matrix4(); }
  proxy.userData.rig = rig;
  proxy.userData.phase = rig.seed * 10;
  registry.add(proxy);
  proxy.addEventListener('removed', () => registry.delete(proxy));
  proxy.addEventListener('added', () => registry.add(proxy));
  return proxy;
}

// ---------- Rendu ----------
class Pool {
  constructor(root, geo, glow, cap = 128) {
    this.root = root; this.geo = geo; this.glow = glow; this.n = 0;
    this.alloc(cap);
  }
  alloc(cap) {
    const old = this.mesh;
    const mesh = new THREE.InstancedMesh(GEO[this.geo], this.glow ? MATS.glow : MATS.solid, cap);
    mesh.frustumCulled = false; // les instances bougent : la sphère englobante serait fausse
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.setColorAt(0, new THREE.Color());
    mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
    mesh.count = 0;
    if (old) {
      // Agrandissement en cours de frame : on garde les instances déjà écrites
      mesh.instanceMatrix.array.set(old.instanceMatrix.array);
      mesh.instanceColor.array.set(old.instanceColor.array);
      this.root.remove(old);
      old.dispose();
    }
    this.root.add(mesh);
    this.mesh = mesh; this.cap = cap;
  }
  push(m, c) {
    if (this.n >= this.cap) this.alloc(this.cap * 2);
    m.toArray(this.mesh.instanceMatrix.array, this.n * 16);
    c.toArray(this.mesh.instanceColor.array, this.n * 3);
    this.n++;
  }
  flush() {
    this.mesh.count = this.n;
    this.mesh.instanceMatrix.needsUpdate = true;
    this.mesh.instanceColor.needsUpdate = true;
    this.n = 0;
  }
}

function shown(o) {
  for (let p = o; p; p = p.parent) {
    if (!p.visible) return false;
    if (p.isScene) return true;
  }
  return false;
}

const _m = new THREE.Matrix4();
const frameHooks = [];
// Appelé à chaque frame (dt, t, camera) juste avant le rendu : animations du décor, audio.
export const onFrame = (fn) => frameHooks.push(fn);

export function attachRigs(scene) {
  const root = new THREE.Group();
  root.name = 'rigs';
  scene.add(root);
  const pools = new Map();
  const pool = (p) => {
    let pl = pools.get(p.key);
    if (!pl) pools.set(p.key, (pl = new Pool(root, p.geo, p.glow)));
    return pl;
  };
  let last = performance.now();
  const prev = scene.onBeforeRender;
  scene.onBeforeRender = function (renderer, sc, camera, target) {
    prev.call(this, renderer, sc, camera, target);
    const nowMs = performance.now();
    const dt = Math.min(0.1, (nowMs - last) / 1000);
    last = nowMs;
    const t = nowMs / 1000;
    for (const proxy of registry) {
      if (!shown(proxy)) continue;
      const rig = proxy.userData.rig;
      if (rig.animate) rig.animate(rig, t, dt, proxy);
      for (const b in rig.bones) rig.boneW[b].multiplyMatrices(proxy.matrixWorld, rig.bones[b]);
      for (const p of rig.parts) pool(p).push(_m.multiplyMatrices(rig.boneW[p.bone], p.m), p.c);
    }
    for (const pl of pools.values()) pl.flush();
    for (const fn of frameHooks) fn(dt, t, camera);
  };
}

// Petits outils d'animation
export const smooth = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
export const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
