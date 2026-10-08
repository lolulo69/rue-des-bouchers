// Façades flamandes : briques, pignons à gradins, encadrements de pierre blanche, devantures en bois peint.
// Tout ce qui est créé ici est statique et fusionné par matériau ensuite (mergeStatic dans world.js).
import * as THREE from 'three';
import { brickTex, signTex, stripeTex, panelTex, shopGlassTex } from './textures.js';

export const GROUND = 3.6;           // haut du rez-de-chaussée
export const FLOOR = 3.0;            // hauteur d'étage
export const winY = (k) => 5.1 + FLOOR * k; // centre des fenêtres de l'étage k (k = 0 : 1er étage)
const WW = 1.05, WH = 1.8;

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.9, ...o });

const cache = new Map(); // matériaux partagés entre tous les kits (une seule texture de brique par teinte)
export function makeKit(city, W, rng) {
  const M = (key, make) => { if (!cache.has(key)) cache.set(key, make()); return cache.get(key); };
  const brick = (name, ...args) => M('brick:' + name, () => { const m = std(0xffffff, { map: brickTex(...args) }); m.userData.worldUV = 1.7; return m; });
  const mats = {
    walls: {
      red: () => brick('red', 9, 50, 42, 3),
      orange: () => brick('orange', 16, 52, 48, 4),
      yellow: () => brick('yellow', 36, 46, 62, 5),
      dark: () => brick('dark', 4, 38, 34, 6),
      cream: () => M('p:cream', () => std(0xeadfc6)),
      blue: () => M('p:blue', () => std(0xb7c7d3)),
      sage: () => M('p:sage', () => std(0xb9c7a8)),
    },
    stone: M('stone', () => std(0xefe7d8)),
    slate: M('slate', () => std(0x3b4152, { flatShading: true })),
    frame: M('frame', () => std(0xf6f2ea)),
    iron: M('iron', () => std(0x1e2126, { roughness: 0.6, metalness: 0.4 })),
    lit: [
      M('lit0', () => std(0x3a2414, { emissive: 0xffb45c, emissiveIntensity: 0.95 })),
      M('lit1', () => std(0x3a2414, { emissive: 0xffd08a, emissiveIntensity: 0.8 })),
      M('lit2', () => std(0x1a2440, { emissive: 0x8fb0ff, emissiveIntensity: 0.55 })), // télé
    ],
    dark: M('dark', () => std(0x1b2030, { roughness: 0.25, metalness: 0.35 })),
    shopLit: M('shopLit', () => { const t = shopGlassTex(); return std(0x2a1a10, { emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.6, roughness: 0.3 }); }),
    shopDim: M('shopDim', () => std(0x1a1d24, { emissive: 0x403020, emissiveIntensity: 0.35 })),
    whitewash: M('whitewash', () => std(0xd9d4c8, { emissive: 0x2a2620, emissiveIntensity: 0.3 })),
    glow: M('glow', () => std(0xffe2a8, { emissive: 0xffc46b, emissiveIntensity: 2.2 })),
    curtains: [M('cur0', () => std(0xc0504d, { emissive: 0x5a2010, emissiveIntensity: 0.5 })), M('cur1', () => std(0xe8d8b0, { emissive: 0x6a5030, emissiveIntensity: 0.5 })), M('cur2', () => std(0x5b8a72, { emissive: 0x203a28, emissiveIntensity: 0.4 }))],
    leaf: M('leaf', () => std(0x4f8a4a, { flatShading: true })),
    wood: (c) => M('wood:' + c, () => std(c, { roughness: 0.75 })),
  };
  const X = (side, d) => side * (W - d); // d > 0 : vers la rue
  const geoCache = new Map();
  const boxGeo = (w, h, d) => {
    const k = `${w.toFixed(3)}|${h.toFixed(3)}|${d.toFixed(3)}`;
    if (!geoCache.has(k)) geoCache.set(k, new THREE.BoxGeometry(w, h, d));
    return geoCache.get(k);
  };
  // box en coordonnées "façade" : épaisseur (vers la rue), hauteur, largeur (le long de la rue)
  const fbox = (side, d, y, z, t, h, w, mat) => {
    const m = new THREE.Mesh(boxGeo(t, h, w), mat);
    m.position.set(X(side, d), y, z);
    city.add(m);
    return m;
  };
  const add = (geo, mat, x, y, z, ry = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z); m.rotation.y = ry;
    city.add(m);
    return m;
  };
  const faceRot = (side) => -side * Math.PI / 2; // plan (normale +Z) tourné vers la rue

  function windowAt(side, z, y, { lit = rng() < 0.4, open = false, noPane = false, noSill = false, w = WW, h = WH, curtains = rng() < 0.5 } = {}) {
    const pane = lit ? mats.lit[rng() < 0.15 ? 2 : rng() < 0.5 ? 1 : 0] : mats.dark;
    if (!noPane) fbox(side, 0.0, y, z, 0.04, h, w, pane);
    fbox(side, 0.04, y, z - w / 2 - 0.06, 0.1, h + 0.08, 0.12, mats.stone);
    fbox(side, 0.04, y, z + w / 2 + 0.06, 0.1, h + 0.08, 0.12, mats.stone);
    if (!noSill) fbox(side, 0.08, y - h / 2 - 0.045, z, 0.2, 0.09, w + 0.36, mats.stone);
    fbox(side, 0.05, y + h / 2 + 0.12, z, 0.12, 0.24, w + 0.32, mats.stone);
    fbox(side, 0.07, y + h / 2 + 0.14, z, 0.16, 0.3, 0.18, mats.stone);
    if (open) return;
    fbox(side, 0.02, y, z, 0.05, h, 0.05, mats.frame);
    fbox(side, 0.02, y + h * 0.22, z, 0.05, 0.05, w, mats.frame);
    if (lit && curtains) {
      const cm = mats.curtains[Math.floor(rng() * 3)];
      fbox(side, 0.005, y + 0.05, z - w * 0.36, 0.02, h * 0.85, w * 0.24, cm);
      fbox(side, 0.005, y + 0.05, z + w * 0.36, 0.02, h * 0.85, w * 0.24, cm);
    }
  }

  function bays(z0, z1, n) {
    const w = z1 - z0;
    n ??= Math.max(1, Math.floor((w - 0.8) / 2.1));
    return Array.from({ length: n }, (_, i) => z0 + (w * (i + 0.5)) / n);
  }

  function stringCourse(side, z0, z1, y) { fbox(side, 0.04, y, (z0 + z1) / 2, 0.1, 0.14, z1 - z0, mats.stone); }

  // Toit en bâtière derrière un pignon : deux pans d'ardoise
  function roofPrism(side, z0, z1, y0, rise, depth = 5.6) {
    const w = z1 - z0, x0 = side * (W + 0.25), x1 = side * (W + 0.25 + depth);
    const zc = (z0 + z1) / 2, yt = y0 + rise;
    const p = [
      x0, y0, z0, x1, y0, z0, x1, yt, zc, x0, y0, z0, x1, yt, zc, x0, yt, zc,
      x0, y0, z1, x0, yt, zc, x1, yt, zc, x0, y0, z1, x1, yt, zc, x1, y0, z1,
    ];
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(new Array(24).fill(0), 2));
    g.computeVertexNormals();
    mats.slate.side = THREE.DoubleSide;
    city.add(new THREE.Mesh(g, mats.slate));
  }

  // Pignon à gradins (trapgevel)
  function steppedGable(side, z0, z1, y0, wall) {
    const w = z1 - z0, zc = (z0 + z1) / 2;
    const n = w > 6.5 ? 5 : 4;
    const rise = Math.min(w * 0.72, 5.2), sh = rise / n;
    for (let i = 0; i < n; i++) {
      const hw = (w / 2) * (1 - i / (n + 0.15));
      fbox(side, -0.15, y0 + i * sh + sh / 2, zc, 0.4, sh, hw * 2, wall);
      fbox(side, -0.1, y0 + (i + 1) * sh + 0.05, zc, 0.52, 0.12, hw * 2 + 0.12, mats.stone);
      // petits fleurons de pierre aux épaulements
      if (i > 0) for (const s of [-1, 1]) fbox(side, -0.1, y0 + (i + 1) * sh + 0.2, zc + s * (hw - 0.12), 0.22, 0.2, 0.22, mats.stone);
    }
    fbox(side, -0.1, y0 + rise + 0.35, zc, 0.24, 0.5, 0.24, mats.stone); // pinacle
    // oculus
    const oc = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.06, 10), rng() < 0.35 ? mats.lit[0] : mats.dark);
    oc.rotation.set(0, 0, Math.PI / 2); oc.position.set(X(side, 0.06), y0 + sh * 1.4, zc); city.add(oc);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.06, 3, 10), mats.stone);
    ring.rotation.y = Math.PI / 2; ring.position.set(X(side, 0.08), y0 + sh * 1.4, zc); city.add(ring);
    roofPrism(side, z0, z1, y0, rise * 0.92);
  }

  function corniceTop(side, z0, z1, y0) {
    const w = z1 - z0, zc = (z0 + z1) / 2;
    fbox(side, 0.12, y0 + 0.15, zc, 0.4, 0.3, w, mats.stone);
    // mansarde d'ardoise inclinée + lucarne
    const r = new THREE.Mesh(boxGeo(0.3, 2.2, w), mats.slate);
    r.position.set(side * (W + 0.9), y0 + 1.15, zc); r.rotation.z = side * 0.42; city.add(r);
    const top = new THREE.Mesh(boxGeo(4.5, 0.2, w), mats.slate);
    top.position.set(side * (W + 3.6), y0 + 2.1, zc); city.add(top);
    for (const z of bays(z0, z1, Math.max(1, Math.floor(w / 3.2)))) {
      fbox(side, -0.75, y0 + 1.1, z, 0.9, 1.3, 1.0, mats.walls.cream());
      fbox(side, -0.32, y0 + 1.05, z, 0.04, 0.85, 0.6, rng() < 0.4 ? mats.lit[1] : mats.dark);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.75, 0.55, 4), mats.slate);
      cap.rotation.y = Math.PI / 4; cap.scale.set(1, 1, 0.9); cap.position.set(X(side, -0.6), y0 + 2.0, z); city.add(cap);
    }
  }

  function door(side, z, color, { w = 1.15 } = {}) {
    fbox(side, 0.04, 1.4, z, 0.12, 2.8, w + 0.36, mats.stone);
    fbox(side, 0.08, 1.15, z, 0.06, 2.3, w, mats.wood(color));
    for (const dz of [-0.24, 0.24]) for (const y of [0.6, 1.55]) fbox(side, 0.11, y, z + dz * w / 1.15, 0.02, 0.7, 0.36 * w / 1.15, mats.wood(new THREE.Color(color).multiplyScalar(0.8).getHex()));
    fbox(side, 0.07, 2.55, z, 0.04, 0.3, w - 0.1, mats.lit[1]); // imposte
    fbox(side, 0.2, 0.07, z, 0.45, 0.14, w + 0.4, mats.stone); // marche
    fbox(side, 0.13, 1.1, z + w * 0.35, 0.05, 0.06, 0.06, mats.glow);
  }

  function lantern(side, z, y = 4.4) {
    fbox(side, 0.25, y + 0.3, z, 0.5, 0.05, 0.05, mats.iron);
    fbox(side, 0.45, y, z, 0.2, 0.3, 0.2, mats.glow);
    fbox(side, 0.45, y - 0.17, z, 0.24, 0.04, 0.24, mats.iron);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.19, 0.18, 4), mats.iron);
    cap.rotation.y = Math.PI / 4; cap.position.set(X(side, 0.45), y + 0.24, z); city.add(cap);
    return new THREE.Vector3(X(side, 0.45), y, z);
  }

  // Devanture en applique (bois peint) avec vitrines, porte, bandeau d'enseigne
  function shopfront(side, z0, z1, color, { glass = mats.shopDim, doorAt = 0.5, sign = null, signColor = null, faded = false } = {}) {
    const w = z1 - z0, zc = (z0 + z1) / 2;
    const wood = mats.wood(color), dark = mats.wood(new THREE.Color(color).multiplyScalar(0.7).getHex());
    fbox(side, 0.0, 1.7, zc, 0.08, 3.4, w, dark);
    fbox(side, 0.1, 3.05, zc, 0.22, 0.6, w, wood);
    fbox(side, 0.16, 3.4, zc, 0.32, 0.1, w + 0.1, wood);
    const nb = Math.max(1, Math.round((w - 0.6) / 2.2));
    const bw = (w - 0.3) / nb;
    const di = Math.min(nb - 1, Math.floor(doorAt * nb));
    for (let i = 0; i <= nb; i++) fbox(side, 0.09, 1.4, z0 + 0.15 + i * bw, 0.18, 2.8, 0.24, wood);
    for (let i = 0; i < nb; i++) {
      const z = z0 + 0.15 + (i + 0.5) * bw;
      if (i === di) {
        fbox(side, 0.03, 1.2, z, 0.04, 2.35, Math.min(1.1, bw - 0.3), glass);
        fbox(side, 0.05, 2.58, z, 0.06, 0.1, bw - 0.24, wood);
        fbox(side, 0.03, 2.67, z, 0.04, 0.12, bw - 0.3, glass);
        if (bw > 1.6) for (const s of [-1, 1]) fbox(side, 0.02, 1.4, z + s * (bw / 2 - 0.3), 0.05, 2.8, 0.4, wood);
      } else {
        fbox(side, 0.07, 0.38, z, 0.12, 0.76, bw - 0.24, wood);
        fbox(side, 0.03, 1.66, z, 0.04, 1.8, bw - 0.24, glass);
        fbox(side, 0.05, 1.66, z, 0.05, 1.8, 0.04, wood);
      }
    }
    if (sign) {
      const t = signTex(sign, signColor ?? '#' + new THREE.Color(color).multiplyScalar(0.55).getHexString(), '#f6e7c1', { faded });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(w - 0.6, 7), 0.48),
        new THREE.MeshStandardMaterial({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: faded ? 0.12 : 0.45 }));
      m.position.set(X(side, 0.215), 3.05, zc); m.rotation.y = faceRot(side);
      city.add(m);
    }
    return { bays: Array.from({ length: nb }, (_, i) => z0 + 0.15 + (i + 0.5) * bw), door: z0 + 0.15 + (di + 0.5) * bw };
  }

  // Store court et incliné (ne masque pas la terrasse vue d'en haut), avec lambrequin festonné
  function awning(side, z0, z1, { proj = 0.5, tilt = 0.85, y = 2.75, a = '#a83232', b = '#f3e6cc' } = {}) {
    const len = z1 - z0, zc = (z0 + z1) / 2;
    const t = stripeTex(a, b, Math.round(len * 2));
    const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.85, side: THREE.DoubleSide });
    const slope = proj / Math.sin(tilt);
    const cloth = new THREE.Mesh(new THREE.PlaneGeometry(len, slope), m);
    // plan incliné : haut contre le mur, bas vers la rue
    cloth.rotation.set(0, faceRot(side), 0);
    cloth.rotateX(-(Math.PI / 2 - tilt));
    cloth.position.set(X(side, proj / 2), y - (Math.cos(tilt) * slope) / 2, zc);
    city.add(cloth);
    const yb = y - Math.cos(tilt) * slope;
    const vm = new THREE.MeshStandardMaterial({ color: new THREE.Color(a), roughness: 0.85 });
    const scal = new THREE.SphereGeometry(0.12, 6, 3);
    for (let z = z0 + 0.12; z < z1; z += 0.24) {
      const s = new THREE.Mesh(scal, vm);
      s.scale.set(0.1, 1, 1);
      s.position.set(X(side, proj), yb, z);
      city.add(s);
    }
    fbox(side, proj, yb + 0.06, zc, 0.02, 0.12, len, vm);
    return yb;
  }

  function sign3D(side, z, y, text, bg, w = 1.2, h = 0.5) {
    // Enseigne-drapeau perpendiculaire à la façade
    const t = signTex(text, bg, '#f6e7c1');
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.4, side: THREE.DoubleSide }));
    m.position.set(X(side, 0.2 + w / 2), y, z);
    city.add(m);
    fbox(side, 0.2 + w / 2, y + h / 2 + 0.05, z, w + 0.3, 0.04, 0.04, mats.iron);
  }

  function panel(side, z, y, lines, w = 1.2, h = 0.6, bg, fg) {
    const t = panelTex(lines, bg, fg);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.18 }));
    m.position.set(X(side, 0.06), y, z); m.rotation.y = faceRot(side);
    city.add(m);
  }

  function flowerBox(side, z, y, len = 1.3) {
    fbox(side, 0.3, y, z, 0.3, 0.26, len, mats.wood(0x6b4a2b));
    const leafG = new THREE.IcosahedronGeometry(0.13, 0);
    const colors = [0xe0475f, 0xf28cb1, 0xf5d04a, 0xf6f2ea];
    for (let i = 0; i < Math.round(len * 5); i++) {
      const zz = z - len / 2 + 0.12 + (i / (len * 5)) * (len - 0.2);
      add(leafG, mats.leaf, X(side, 0.3 + (rng() - 0.5) * 0.12), y + 0.16 + rng() * 0.06, zz);
      add(new THREE.IcosahedronGeometry(0.05, 0), M('flower' + (i % 4), () => std(colors[i % 4], { emissive: colors[i % 4], emissiveIntensity: 0.15, flatShading: true })), X(side, 0.32 + (rng() - 0.5) * 0.15), y + 0.27 + rng() * 0.05, zz + 0.05);
    }
  }

  function balcony(side, z0, z1, y) {
    const len = z1 - z0, zc = (z0 + z1) / 2;
    fbox(side, 0.4, y, zc, 0.8, 0.12, len, mats.stone);
    fbox(side, 0.78, y + 0.95, zc, 0.05, 0.05, len, mats.iron);
    fbox(side, 0.78, y + 0.15, zc, 0.04, 0.04, len, mats.iron);
    for (let z = z0 + 0.06; z <= z1; z += 0.13) fbox(side, 0.78, y + 0.53, z, 0.022, 0.8, 0.022, mats.iron);
    for (const s of [z0 + 0.02, z1 - 0.02]) for (let d = 0.1; d < 0.78; d += 0.13) fbox(side, d, y + 0.53, s, 0.022, 0.8, 0.022, mats.iron);
    for (const s of [z0 + 0.02, z1 - 0.02]) fbox(side, 0.4, y + 0.95, s, 0.8, 0.05, 0.05, mats.iron);
    // consoles
    for (const s of [z0 + 0.3, z1 - 0.3]) fbox(side, 0.3, y - 0.22, s, 0.5, 0.3, 0.16, mats.stone);
    return y + 0.06;
  }

  // Porte cochère de l'ancienne carrosserie d'Hippolyte
  function carriageDoor(side, z, { w = 3.2, h = 3.0 } = {}) {
    const green = mats.wood(0x2f4a3a), dk = mats.wood(0x22362a);
    fbox(side, 0.0, h / 2, z, 0.08, h, w, green);
    const half = new THREE.Shape();
    half.moveTo(w / 2, 0); half.absarc(0, 0, w / 2, 0, Math.PI, false);
    const hg = new THREE.ExtrudeGeometry(half, { depth: 0.08, bevelEnabled: false, curveSegments: 14 });
    const top = new THREE.Mesh(hg, green);
    top.rotation.y = faceRot(side); top.position.set(X(side, side < 0 ? 0.04 : -0.04), h, z); city.add(top);
    const arch = new THREE.Mesh(new THREE.TorusGeometry(w / 2 + 0.18, 0.2, 4, 16, Math.PI), mats.stone);
    arch.rotation.y = faceRot(side); arch.position.set(X(side, 0.08), h, z); city.add(arch);
    for (const s of [-1, 1]) fbox(side, 0.08, h / 2, z + s * (w / 2 + 0.18), 0.2, h, 0.4, mats.stone);
    fbox(side, 0.06, h / 2, z, 0.04, h, 0.06, dk); // jointure des battants
    for (let y = 0.4; y < h; y += 0.5) for (let dz = -w / 2 + 0.3; dz < w / 2 - 0.1; dz += 0.5) fbox(side, 0.05, y, z + dz, 0.03, 0.05, 0.05, mats.iron);
    fbox(side, 0.07, 1.2, z + 0.4, 0.05, 1.9, 0.75, dk); // portillon
    fbox(side, 0.1, h + w / 2 + 0.5, z, 0.12, 0.6, 0.6, mats.stone); // clef
  }

  return { mats, X, fbox, add, windowAt, bays, stringCourse, steppedGable, corniceTop, roofPrism, door, lantern, shopfront, awning, sign3D, panel, flowerBox, balcony, carriageDoor, faceRot };
}

// Une maison complète (sauf exceptions gérées par world.js)
export function house(kit, side, z0, z1, o = {}) {
  const { W, rng } = o;
  const floors = o.floors ?? 2 + Math.floor(rng() * 2);
  const H = GROUND + FLOOR * floors + 0.4;
  const wallKey = o.wall ?? ['red', 'red', 'orange', 'yellow', 'dark', 'cream', 'blue', 'red', 'sage'][Math.floor(rng() * 9)];
  const wall = kit.mats.walls[wallKey]();
  if (!o.noBody) kit.add(new THREE.BoxGeometry(6, H, z1 - z0), wall, side * (W + 3), H / 2, (z0 + z1) / 2);
  const bays = o.bays ?? kit.bays(z0, z1);
  for (let k = 0; k < floors; k++) {
    kit.stringCourse(side, z0, z1, winY(k) - WH / 2 - 0.12);
    for (const z of bays) if (!o.skip?.(k, z)) kit.windowAt(side, z, winY(k), o.windowOpts?.(k, z) ?? {});
  }
  const top = o.top ?? (rng() < 0.7 ? 'stepped' : 'cornice');
  if (top === 'stepped') kit.steppedGable(side, z0, z1, H, wall);
  else if (top === 'double') { const m = o.split ?? (z0 + z1) / 2; kit.steppedGable(side, z0, m, H, wall); kit.steppedGable(side, m, z1, H, wall); }
  else kit.corniceTop(side, z0, z1, H);
  return { H, wall, bays, floors };
}
