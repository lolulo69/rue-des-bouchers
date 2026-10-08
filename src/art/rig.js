// Personnages et accessoires "instanciés" : chaque personnage est un simple Object3D (proxy) que le gameplay
// peut déplacer, tourner, cacher (visible = false) ou retirer de la scène comme avant. Ses morceaux (tête, yeux,
// bras, chaises...) sont dessinés par des InstancedMesh partagés : une trentaine de draw calls pour toute la rue,
// quel que soit le nombre de clients. Mise à jour juste avant chaque rendu (scene.onBeforeRender), donc aucun
// appel à ajouter dans la boucle de jeu.
// Perf (v0.5) : les proxies hors champ ne sont ni animés ni dessinés ; au-delà de LOD_DIST, un personnage n'est
// plus dessiné qu'avec ses gros volumes en géométrie simplifiée (yeux, mains, oreilles... disparaissent).
import * as THREE from 'three';

const limbGeo = (cap, radial) => {
  // Capsule dont le pivot est en haut (épaule / hanche) et qui descend sur 1 unité, diamètre 1.
  const g = new THREE.CapsuleGeometry(0.5, 1, cap, radial);
  g.translate(0, -1, 0);
  g.scale(1, 0.5, 1);
  return g;
};
const torsoGeo = (seg) => new THREE.LatheGeometry(
  [[0, 0], [0.4, 0], [0.5, 0.12], [0.52, 0.42], [0.48, 0.72], [0.36, 0.92], [0.16, 1], [0, 1]].map(([x, y]) => new THREE.Vector2(x, y)),
  seg,
);

export const GEO = {
  head: new THREE.SphereGeometry(1, 10, 7),
  sphere: new THREE.SphereGeometry(1, 9, 6),
  ball: new THREE.SphereGeometry(1, 6, 4),
  dot: new THREE.SphereGeometry(1, 5, 3), // détails du visage (reflet, joues, nez)
  arc: new THREE.TorusGeometry(1, 0.22, 3, 8, Math.PI), // sourire / moue
  hemi: new THREE.SphereGeometry(1, 12, 5, 0, Math.PI * 2, 0, Math.PI / 2),
  limb: limbGeo(2, 5),
  torso: torsoGeo(10),
  cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 10),
  cone: new THREE.ConeGeometry(0.5, 1, 8),
  skirt: new THREE.CylinderGeometry(0.3, 0.5, 1, 10),
  box: new THREE.BoxGeometry(1, 1, 1),
  torus: new THREE.TorusGeometry(1, 0.16, 3, 10),
  // versions lointaines (LOD)
  headLo: new THREE.SphereGeometry(1, 7, 5),
  hemiLo: new THREE.SphereGeometry(1, 7, 3, 0, Math.PI * 2, 0, Math.PI / 2),
  limbLo: new THREE.CylinderGeometry(0.5, 0.5, 1, 3, 1, true).translate(0, -0.5, 0),
  torsoLo: torsoGeo(6),
  cylLo: new THREE.CylinderGeometry(0.5, 0.5, 1, 5),
};
export const defineGeo = (name, geo) => { GEO[name] = geo; };
// Géométrie de remplacement au-delà de LOD_DIST (null = morceau omis de loin)
const FAR = { dot: null, head: 'headLo', sphere: 'ball', hemi: 'hemiLo', limb: 'limbLo', torso: 'torsoLo', cyl: 'cylLo', skirt: 'cylLo', chair: 'chairLo', ball: 'ball', box: 'box', cone: 'cone' };
export const LOD_DIST = 10;
export const defineFar = (geo, farGeo) => { FAR[geo] = farGeo; };

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
// keep = gardé de loin même s'il est petit (ex. la braise d'une cigarette).
export function part(geo, bone, pos, scale, color, rot, glow = false, keep = false) {
  const s = typeof scale === 'number' ? scale : Math.max(...scale);
  const farGeo = keep ? geo : s < 0.1 || geo === 'torus' ? null : geo in FAR ? FAR[geo] : geo;
  return { key: geo + (glow ? '*' : ''), farKey: farGeo && farGeo + (glow ? '*' : ''), geo, farGeo, glow, bone, m: matrix(pos, scale, rot), c: new THREE.Color(color) };
}

const registry = new Set();
// Crée le proxy d'un "rig" : parts + fonction d'animation qui remplit rig.bones (Matrix4 relatives au proxy).
// radius : rayon de la sphère englobante (culling), centrée à 0.8 m au-dessus de l'origine du proxy.
export function makeRig(parts, { bones = ['root'], animate = null, data = {}, radius = 1.2 } = {}) {
  const proxy = new THREE.Object3D();
  const rig = { parts, animate, bones: {}, boneW: {}, seed: Math.random(), st: {}, radius, ...data };
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
  constructor(root, geo, glow, cap = 64) {
    this.root = root; this.geo = geo; this.glow = glow; this.n = 0;
    this.alloc(cap);
  }
  alloc(cap) {
    const old = this.mesh;
    const mesh = new THREE.InstancedMesh(GEO[this.geo], this.glow ? MATS.glow : MATS.solid, cap);
    mesh.frustumCulled = false; // les instances bougent : culling fait à la main, par proxy
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
    this.mesh.visible = this.n > 0;
    this.mesh.instanceMatrix.needsUpdate = true;
    this.mesh.instanceColor.needsUpdate = true;
    this.n = 0;
  }
}

// La scène à laquelle appartient le proxy (null s'il est caché ou détaché)
function sceneOf(o) {
  for (let p = o; p; p = p.parent) {
    if (!p.visible) return null;
    if (p.isScene) return p;
  }
  return null;
}

const _m = new THREE.Matrix4(), _pm = new THREE.Matrix4(), _fr = new THREE.Frustum(), _sph = new THREE.Sphere(), _cam = new THREE.Vector3();
const mainHooks = [];
// Appelé à chaque frame (dt, t, camera) juste avant le rendu de la scène principale : animations du décor, audio.
export const onFrame = (fn) => mainHooks.push(fn);
export const stats = { proxies: 0, drawn: 0, far: 0 };
// Horloge des animations de l'art (temps réel). Remplaçable pour la QA : timeSource.now = () => tempsVirtuelMs
export const timeSource = { now: () => performance.now() };

/**
 * Branche le rendu instancié sur une scène. main: true = la rue (reçoit les onFrame globaux).
 * Renvoie { onFrame(fn) } pour des crochets propres à cette scène (vignettes, portraits).
 */
export function attachRigs(scene, { main = false, lod = true } = {}) {
  const root = new THREE.Group();
  root.name = 'rigs';
  scene.add(root);
  const pools = new Map();
  const pool = (key, geo, glow) => {
    let pl = pools.get(key);
    if (!pl) pools.set(key, (pl = new Pool(root, geo, glow)));
    return pl;
  };
  const hooks = main ? mainHooks : [];
  let last = timeSource.now();
  const prev = scene.onBeforeRender;
  scene.onBeforeRender = function (renderer, sc, camera, target) {
    prev.call(this, renderer, sc, camera, target);
    const nowMs = timeSource.now();
    const dt = Math.min(0.1, (nowMs - last) / 1000);
    last = nowMs;
    const t = nowMs / 1000;
    for (const fn of hooks) fn(dt, t, camera, renderer);
    _fr.setFromProjectionMatrix(_pm.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
    camera.getWorldPosition(_cam);
    let n = 0, drawn = 0, far = 0;
    for (const proxy of registry) {
      if (sceneOf(proxy) !== sc) continue;
      n++;
      const rig = proxy.userData.rig;
      if (rig.hidden) continue; // caché par l'art (ex. client parti aux toilettes) sans toucher à .visible du gameplay
      const e = proxy.matrixWorld.elements;
      const sy = Math.hypot(e[4], e[5], e[6]);
      _sph.center.set(e[12] + e[4] * 0.8, e[13] + e[5] * 0.8, e[14] + e[6] * 0.8);
      _sph.radius = rig.radius * sy;
      if (!_fr.intersectsSphere(_sph)) continue;
      drawn++;
      const isFar = lod && _sph.center.distanceTo(_cam) > LOD_DIST * Math.max(1, rig.radius);
      if (isFar) far++;
      if (rig.animate) rig.animate(rig, t, dt, proxy, isFar);
      for (const b in rig.bones) rig.boneW[b].multiplyMatrices(proxy.matrixWorld, rig.bones[b]);
      for (const p of rig.parts) {
        // morceau conditionnel : visible seulement si l'état (anim / objet tenu / drapeau) correspond
        if (p.when !== undefined && p.when !== rig.anim && p.when !== rig.held && p.when !== rig.expr && !rig.flags?.[p.when]) continue;
        if (isFar) { if (p.farKey) pool(p.farKey, p.farGeo, p.glow).push(_m.multiplyMatrices(rig.boneW[p.bone], p.m), p.c); }
        else pool(p.key, p.geo, p.glow).push(_m.multiplyMatrices(rig.boneW[p.bone], p.m), p.c);
      }
    }
    for (const pl of pools.values()) pl.flush();
    if (main) Object.assign(stats, { proxies: n, drawn, far });
  };
  return { onFrame: (fn) => hooks.push(fn), root };
}

// Petits outils d'animation
export const smooth = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
export const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
