import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RESTAURANTS, RULES, STREET } from './config.js';

const W = STREET.halfWidth;
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function canvasTexture(w, h, draw, repeat = [1, 1]) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeat);
  t.anisotropy = 4;
  return t;
}

// Brique rouge flamande avec joints clairs
const brickTex = () => canvasTexture(256, 256, (g, w, h) => {
  g.fillStyle = '#d9cfc0'; g.fillRect(0, 0, w, h);
  const bh = 16, bw = 48;
  for (let y = 0; y < h; y += bh) {
    const off = (y / bh) % 2 ? bw / 2 : 0;
    for (let x = -bw; x < w + bw; x += bw) {
      const l = 30 + Math.random() * 14;
      g.fillStyle = `hsl(${8 + Math.random() * 10}, 45%, ${l}%)`;
      g.fillRect(x + off + 2, y + 2, bw - 4, bh - 4);
    }
  }
});

// Pavés
const cobbleTex = () => canvasTexture(256, 256, (g, w, h) => {
  g.fillStyle = '#2a2a2e'; g.fillRect(0, 0, w, h);
  const s = 32;
  for (let y = 0; y < h; y += s / 2) for (let x = 0; x < w; x += s) {
    const off = (y / (s / 2)) % 2 ? s / 2 : 0;
    const l = 30 + Math.random() * 14;
    g.fillStyle = `hsl(30, 6%, ${l}%)`;
    g.beginPath(); g.roundRect(x + off + 2, y + 2, s - 4, s / 2 - 4, 4); g.fill();
  }
}, [2, 28]);

function signTex(text, bg, fg = '#f6e7c1') {
  return canvasTexture(1024, 160, (g, w, h) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.strokeStyle = fg; g.lineWidth = 6; g.strokeRect(10, 10, w - 20, h - 20);
    g.fillStyle = fg;
    let size = 84;
    do g.font = `italic bold ${size}px Georgia, serif`; while (g.measureText(text).width > w - 60 && (size -= 4) > 30);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, w / 2, h / 2 + 4);
  });
}

const box = (w, h, d, mat) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);

let winMats;
function addWindows(group, side, z0, z1, height, skip) {
  winMats ??= {
    lit: new THREE.MeshStandardMaterial({ color: 0x332211, emissive: 0xffb45c, emissiveIntensity: 0.9 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x1a1d24, roughness: 0.2, metalness: 0.4 }),
    stone: new THREE.MeshStandardMaterial({ color: 0xe8dfcf, roughness: 0.9 }),
  };
  const { lit, dark, stone } = winMats;
  for (let y = 4.4; y < height - 1.5; y += 3.2) {
    for (let z = z0 + 1.4; z < z1 - 1; z += 2.4) {
      if (skip && skip(y, z)) continue;
      const win = box(0.05, 1.6, 1.0, Math.random() < 0.35 ? lit : dark);
      win.position.set(side * (W + 0.02), y, z);
      const lintel = box(0.12, 0.18, 1.3, stone);
      lintel.position.set(side * (W + 0.04), y + 0.9, z);
      group.add(win, lintel);
    }
  }
}

// Géométries et matériaux partagés pour tout ce qui bouge (gens, tables) : moins de mémoire GPU.
const SHARED = {
  body: new THREE.CapsuleGeometry(0.2, 0.45, 3, 8),
  head: new THREE.SphereGeometry(0.14, 10, 8),
  chair: new THREE.BoxGeometry(0.4, 0.45, 0.4),
  top: new THREE.CylinderGeometry(0.5, 0.5, 0.05, 16),
  leg: new THREE.CylinderGeometry(0.04, 0.04, 0.75, 6),
  hit: new THREE.CylinderGeometry(1.2, 1.2, 1.6, 8),
};
const matCache = new Map();
export function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshStandardMaterial({ color, ...opts }));
  return matCache.get(key);
}
const SKIN = [0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524, 0xffdbac];

export function person(color) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(SHARED.body, mat(color));
  body.position.y = 0.75;
  const head = new THREE.Mesh(SHARED.head, mat(pick(SKIN)));
  head.position.y = 1.2;
  g.add(body, head);
  g.userData.phase = Math.random() * 10;
  return g;
}

const HIT_MAT = new THREE.MeshBasicMaterial({ visible: false });

function buildTable(rest, x, z, idx, scene, fixedCount) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  const wood = mat(0x5b3a1e, { roughness: 0.7 });
  const metal = mat(0x222222, { metalness: 0.6, roughness: 0.4 });
  const top = new THREE.Mesh(SHARED.top, wood);
  top.position.y = 0.75;
  const leg = new THREE.Mesh(SHARED.leg, metal);
  leg.position.y = 0.375;
  group.add(top, leg);

  // Nombre de convives : parfois au-dessus de la limite
  const over = Math.random() < RULES.overLimitChance;
  const count = fixedCount ?? (over ? RULES.maxPeoplePerTable + 1 + Math.floor(Math.random() * 3) : 2 + Math.floor(Math.random() * (RULES.maxPeoplePerTable - 1)));
  const people = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const chair = new THREE.Mesh(SHARED.chair, metal);
    chair.position.set(Math.cos(a) * 0.85, 0.225, Math.sin(a) * 0.85);
    const p = person(pick([0x264653, 0x2a9d8f, 0xe9c46a, 0xf4a261, 0xe76f51, 0x6d597a, 0x355070, 0xb5838d, 0x3d405b]));
    p.position.set(Math.cos(a) * 0.85, 0.05, Math.sin(a) * 0.85);
    group.add(chair, p);
    people.push(p);
  }
  const hit = new THREE.Mesh(SHARED.hit, HIT_MAT);
  hit.position.y = 0.8;
  group.add(hit);

  scene.add(group);
  const table = { id: `${rest.id}-${idx + 1}`, label: `${rest.name}, table ${idx + 1}`, rest, group, hit, people, count, out: true, clearAt: null, clearedAt: null, clearedBy: null, evidence: new Set() };
  hit.userData.table = table;
  return table;
}

// opts.tables : disposition des terrasses tirée par la simulation (src/sim/layout.js) : { id, restId, x, z, count }
export function buildWorld(scene, opts = {}) {
  const city = new THREE.Group();
  scene.add(city);

  // Sol
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(W * 2, STREET.length), new THREE.MeshStandardMaterial({ map: cobbleTex(), roughness: 0.95 }));
  ground.rotation.x = -Math.PI / 2;
  city.add(ground);

  const brickMap = brickTex();
  const brickMat = (tint) => new THREE.MeshStandardMaterial({ map: brickMap, color: tint, roughness: 0.9 });

  // Immeubles génériques des deux côtés
  const half = STREET.length / 2;
  for (const side of [-1, 1]) {
    let z = -half;
    while (z < half) {
      const width = rand(5, 8);
      const z0 = z, z1 = Math.min(z + width, half);
      z = z1;
      if (side === -1 && z1 > -6.5 && z0 < 8.5) continue; // emplacement de l'immeuble de Pilou
      const height = rand(9, 15);
      const b = box(6, height, z1 - z0, brickMat(new THREE.Color().setHSL(0.03, 0.2, rand(0.7, 1))));
      b.position.set(side * (W + 3), height / 2, (z0 + z1) / 2);
      city.add(b);
      addWindows(city, side, z0, z1, height);
      // Rez-de-chaussée : vitrine
      const shop = box(0.06, 2.4, (z1 - z0) - 1, new THREE.MeshStandardMaterial({ color: 0x15171c, emissive: 0x403020, emissiveIntensity: Math.random() < 0.5 ? 0.6 : 0 }));
      shop.position.set(side * (W - 0.02), 1.5, (z0 + z1) / 2);
      city.add(shop);
    }
  }
  // Comble les trous laissés autour de l'immeuble de Pilou
  for (const [z0, z1] of [[-12, -6], [8, 14]]) {
    const b = box(6, 12, z1 - z0, brickMat(0xcfc4b5));
    b.position.set(-(W + 3), 6, (z0 + z1) / 2);
    city.add(b);
  }

  // --- Immeuble de Pilou, au-dessus de La Ch'tite Bernadette (côté gauche, z -6..8) ---
  const pz0 = -6, pz1 = 8, ph = 13;
  const facadeMat = brickMat(0xffffff);
  // Façade en plusieurs morceaux pour laisser une vraie ouverture de fenêtre (z -1..1, y 4.2..6)
  const fx = -(W + 0.15);
  const facadePieces = [
    [0.3, 3.8, pz1 - pz0, 1.9, (pz0 + pz1) / 2],          // RDC
    [0.3, ph - 6, pz1 - pz0, 6 + (ph - 6) / 2, (pz0 + pz1) / 2], // au-dessus de la fenêtre
    [0.3, 2.2, -1 - pz0, 3.8 + 1.1, (pz0 - 1) / 2],        // gauche de la fenêtre
    [0.3, 2.2, pz1 - 1, 3.8 + 1.1, (1 + pz1) / 2],         // droite de la fenêtre
    [0.3, 0.4, 2, 4.0, 0],                                 // allège
  ];
  for (const [w, h, d, y, z] of facadePieces) {
    const m = box(w, h, d, facadeMat);
    m.position.set(fx, y, z);
    city.add(m);
  }
  const roof = box(8, 0.3, pz1 - pz0, brickMat(0x8c8c8c));
  roof.position.set(-(W + 4), ph, (pz0 + pz1) / 2);
  city.add(roof);
  addWindows(city, -1, pz0, pz1, ph, (y, z) => y < 6.5 && Math.abs(z) < 2);
  // Rebord de fenêtre en pierre
  const sill = box(0.5, 0.12, 2.3, new THREE.MeshStandardMaterial({ color: 0xe8dfcf }));
  sill.position.set(-(W - 0.05), 4.25, 0);
  city.add(sill);

  // Appartement de Pilou (pièce visible de l'intérieur)
  const apt = { x0: -9.2, x1: -W - 0.3, z0: -3, z1: 3, floor: 4.2, ceil: 7 };
  // Murs intérieurs en panneaux (pas de mur côté rue : c'est la façade percée de la fenêtre qui ferme la pièce)
  const roomMat = new THREE.MeshStandardMaterial({ color: 0xd8cbb3, roughness: 1 });
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x7a5534, roughness: 0.8 });
  const rw = apt.x1 - apt.x0 + 0.2, rh = apt.ceil - apt.floor, rd = apt.z1 - apt.z0, cx = (apt.x0 + apt.x1) / 2 + 0.1, cy = (apt.floor + apt.ceil) / 2;
  for (const [w, h, d, x, y, z, m] of [
    [rw, 0.1, rd, cx, apt.floor - 0.05, 0, floorMat],
    [rw, 0.1, rd, cx, apt.ceil + 0.05, 0, roomMat],
    [0.1, rh, rd, apt.x0 - 0.05, cy, 0, roomMat],
    [rw, rh, 0.1, cx, cy, apt.z0 - 0.05, roomMat],
    [rw, rh, 0.1, cx, cy, apt.z1 + 0.05, roomMat],
  ]) {
    const m2 = box(w, h, d, m);
    m2.position.set(x, y, z);
    city.add(m2);
  }
  const aptLight = new THREE.PointLight(0xffd9a0, 6, 8, 1.5);
  aptLight.position.set(-7, 6.5, 0);
  city.add(aptLight);
  const bed = box(1.6, 0.5, 2.1, new THREE.MeshStandardMaterial({ color: 0x3d5a80 }));
  bed.position.set(-8.2, apt.floor + 0.25, -1.6);
  const pillow = box(1.4, 0.15, 0.4, new THREE.MeshStandardMaterial({ color: 0xffffff }));
  pillow.position.set(-8.2, apt.floor + 0.57, -2.4);
  const aptDoor = box(0.08, 2.1, 1, new THREE.MeshStandardMaterial({ color: 0x6b4423 }));
  aptDoor.position.set(apt.x0 + 0.05, apt.floor + 1.05, 1.8);
  city.add(bed, pillow, aptDoor);

  // La Ch'tite Bernadette : devanture, store, enseigne
  const front = box(0.08, 2.8, 9.4, new THREE.MeshStandardMaterial({ color: 0x2a1a10, emissive: 0xffa24a, emissiveIntensity: 0.55 }));
  front.position.set(-(W + 0.02 - 0.01), 1.5, -1.2);
  // Store peu profond : depuis la fenêtre de Pilou, on doit voir les tables en dessous (QA v0.2)
  const awning = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.08, 10), new THREE.MeshStandardMaterial({ color: 0x8a2b2b }));
  awning.position.set(-(W - 0.25), 3.3, -1.2);
  awning.rotation.z = -0.25;
  const bTex = signTex("Estaminet La Ch'tite Bernadette", '#5a1414');
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(6, 0.95), new THREE.MeshStandardMaterial({ map: bTex, emissive: 0xffffff, emissiveMap: bTex, emissiveIntensity: 0.5 }));
  sign.position.set(-(W - 0.04), 3.75, -1.2);
  sign.rotation.y = Math.PI / 2;
  city.add(front, awning, sign);
  // Porte de l'immeuble résidentiel
  const resDoor = box(0.1, 2.3, 1.2, new THREE.MeshStandardMaterial({ color: 0x1f3b2d }));
  resDoor.position.set(-(W + 0.0), 1.15, 5.8);
  const resPlate = box(0.04, 0.25, 0.35, new THREE.MeshStandardMaterial({ color: 0xc9a227, metalness: 0.8, roughness: 0.3 }));
  resPlate.position.set(-(W - 0.06), 1.5, 6.7);
  city.add(resDoor, resPlate);

  // La hotte : gaine en inox qui remonte le long de la façade jusque sous la fenêtre
  const steel = new THREE.MeshStandardMaterial({ color: 0xb8bcc2, metalness: 0.9, roughness: 0.35 });
  const duct = box(0.45, 1.6, 0.45, steel);
  duct.position.set(-(W - 0.25), 3.2, 1.6);
  const ductOut = box(0.5, 0.35, 0.7, steel);
  ductOut.position.set(-(W - 0.3), 4.05, 1.25);
  city.add(duct, ductOut);
  const steam = makeSteam(new THREE.Vector3(-(W - 0.3), 4.1, 1.0));
  city.add(steam.points);

  // Enseignes des autres restos
  for (const r of RESTAURANTS.filter((r) => r.id !== 'bernadette')) {
    const t = signTex(r.name, '#' + new THREE.Color(r.color).multiplyScalar(0.6).getHexString());
    const s = new THREE.Mesh(new THREE.PlaneGeometry(5, 0.8), new THREE.MeshStandardMaterial({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.4 }));
    s.position.set(r.side * (W - 0.04), 3.4, (r.z0 + r.z1) / 2);
    s.rotation.y = -r.side * Math.PI / 2;
    city.add(s);
  }

  // Lanternes murales. Seules quelques-unes portent une vraie PointLight (iGPU) ; les autres sont émissives.
  const LIT_LAMPS = [-15, -5, 5, 15];
  const lampMat = new THREE.MeshStandardMaterial({ color: 0xffe2a8, emissive: 0xffc46b, emissiveIntensity: 2 });
  let li = 0;
  for (let z = -35; z <= 35; z += 10) {
    const side = li++ % 2 ? 1 : -1;
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), lampMat);
    lamp.position.set(side * (W - 0.35), 4.6, z);
    city.add(lamp);
    if (LIT_LAMPS.includes(z)) {
      const pl = new THREE.PointLight(0xffc46b, 14, 16, 1.6);
      pl.position.copy(lamp.position);
      city.add(pl);
    }
  }

  // Terrasses
  const tables = [];
  if (opts.tables) {
    for (const l of opts.tables) {
      const r = RESTAURANTS.find((x) => x.id === l.restId);
      tables.push(buildTable(r, l.x, l.z, Number(l.id.split('-').pop()) - 1, scene, l.count));
    }
  }
  else for (const r of RESTAURANTS) {
    const x = r.side * (W - 1.25);
    const step = (r.z1 - r.z0) / r.tables;
    for (let i = 0; i < r.tables; i++) {
      tables.push(buildTable(r, x, r.z0 + step * (i + 0.5), i, scene));
    }
  }

  // Le serveur de Bernadette, devant la porte
  const waiter = person(0x111111);
  const apron = box(0.3, 0.5, 0.42, new THREE.MeshStandardMaterial({ color: 0xffffff }));
  apron.position.set(0.12, 0.65, 0);
  waiter.add(apron);
  waiter.position.set(-(W - 2.5), 0, -6.8);
  waiter.scale.setScalar(1.15);
  scene.add(waiter);

  mergeStatic(city);

  return {
    tables,
    steam,
    apt,
    waiter,
    window: { pos: new THREE.Vector3(-(W + 0.3), 5.2, 0) },
    streetDoor: new THREE.Vector3(-(W - 0.6), 0, 5.8),
    aptDoor: new THREE.Vector3(apt.x0 + 0.6, apt.floor, 1.8),
    bed: new THREE.Vector3(-8.2, apt.floor, -1.6),
    exhaust: new THREE.Vector3(-(W - 0.3), 4.1, 1.0),
  };
}

// Fusionne toutes les meshes statiques du décor par matériau : quelques dizaines de draw calls au lieu de ~1000.
function mergeStatic(group) {
  group.updateMatrixWorld(true);
  const byMat = new Map();
  for (const o of [...group.children]) {
    if (!o.isMesh) continue;
    const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    g.applyMatrix4(o.matrixWorld);
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    if (!byMat.has(o.material)) byMat.set(o.material, []);
    byMat.get(o.material).push(g);
    group.remove(o);
    o.geometry.dispose();
  }
  for (const [m, geos] of byMat) group.add(new THREE.Mesh(mergeGeometries(geos), m));
}

function makeSteam(origin) {
  const N = 60;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(N * 3);
  const life = new Float32Array(N);
  for (let i = 0; i < N; i++) life[i] = Math.random();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  // Sprite rond et flou (sinon les points sont des carrés)
  const puff = canvasTexture(64, 64, (g, w, h) => {
    const grad = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
  });
  const mat = new THREE.PointsMaterial({ color: 0xcfcfcf, size: 0.6, map: puff, transparent: true, opacity: 0.35, depthWrite: false });
  const points = new THREE.Points(geo, mat);
  return {
    points,
    intensity: 1,
    update(dt) {
      for (let i = 0; i < N; i++) {
        life[i] += dt * 0.5;
        if (life[i] > 1) life[i] = 0;
        const t = life[i];
        pos[i * 3] = origin.x + t * 0.6 + Math.sin(i * 7 + t * 4) * 0.1;
        pos[i * 3 + 1] = origin.y + t * 2.2;
        pos[i * 3 + 2] = origin.z - t * 0.4 + Math.cos(i * 3 + t * 5) * 0.15;
      }
      mat.opacity = 0.35 * this.intensity;
      geo.attributes.position.needsUpdate = true;
    },
  };
}
