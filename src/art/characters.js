// Personnages "cute low-poly" : grosse tête, corps en poire, yeux en grains de café, couleurs douces.
// Tous les builders renvoient un proxy Object3D (voir rig.js) ; l'avant du personnage est +Z local.
import * as THREE from 'three';
import { makeRig, part, smooth, clamp01 } from './rig.js';

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const SKIN = [0xf6d2b4, 0xeebf98, 0xd9a072, 0xb87a4b, 0x8a5636, 0xfbe0c8];
export const HAIR = [0x3b2a20, 0x5a3b26, 0x1f1a17, 0x8a5a2b, 0xd9b26a, 0xa0522d, 0x9a9a9a, 0x2d2420];
export const SHIRTS = [0x6c9bd2, 0xe3826f, 0xf0c36a, 0x7fb685, 0xb48ed1, 0xf2a7b8, 0x5fb3b3, 0xe8e2d0, 0x8fa3c2, 0xd98c5f, 0x4f6d8f, 0xc94f4f];
export const PANTS = [0x3d4a63, 0x4a3f35, 0x2f3542, 0x6b5b4b, 0x55617a, 0x3a3a3a];
const DARK = 0x231a16;

const _e = new THREE.Euler(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
const _t = new THREE.Matrix4();
function trs(out, x, y, z, rx = 0, ry = 0, rz = 0, order = 'XYZ', sx = 1, sy = 1, sz = 1) {
  return out.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz, order)), _s.set(sx, sy, sz));
}
const lerp = (a, b, t) => a + (b - a) * t;

// ---------- Coiffures (sur l'os "head", r = rayon de la tête, tête centrée en y = 0.92 r) ----------
function hair(add, style, r, c) {
  const cy = 0.92 * r;
  const cap = (s = 1.07, back = -0.38) => add('hemi', 'head', [0, cy, 0], [s * r, s * r, s * r], c, [back, 0, 0]);
  switch (style) {
    case 'none': break;
    case 'short': cap(); break;
    case 'spiky': cap(1.06, -0.3); for (let i = 0; i < 5; i++) add('cone', 'head', [(i - 2) * 0.2 * r, cy + 0.95 * r, 0.25 * r - Math.abs(i - 2) * 0.08 * r], [0.3 * r, 0.42 * r, 0.3 * r], c, [0.4, 0, (i - 2) * 0.25]); break;
    case 'long': cap(1.08, -0.2); add('sphere', 'head', [0, cy - 0.35 * r, -0.42 * r], [0.98 * r, 1.05 * r, 0.62 * r], c); break;
    case 'bob': cap(1.1, -0.15); add('sphere', 'head', [0, cy - 0.12 * r, -0.12 * r], [1.1 * r, 0.92 * r, 0.98 * r], c); break;
    case 'ponytail': cap(1.07, -0.25); add('sphere', 'head', [0, cy + 0.2 * r, -1.0 * r], [0.32 * r, 0.6 * r, 0.32 * r], c, [0.6, 0, 0]); break;
    case 'bun': cap(1.06, -0.3); add('sphere', 'head', [0, cy + 0.85 * r, -0.35 * r], 0.36 * r, c); break;
    case 'manbun': // Ghislain : chignon énorme
      cap(1.05, -0.3);
      add('sphere', 'head', [0, cy + 1.2 * r, -0.45 * r], [0.85 * r, 0.78 * r, 0.85 * r], c);
      add('torus', 'head', [0, cy + 0.62 * r, -0.36 * r], [0.38 * r, 0.38 * r, 0.38 * r], 0xc0392b, [Math.PI / 2 - 0.5, 0, 0]);
      break;
    case 'curly': // permanente
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2;
        add('sphere', 'head', [Math.cos(a) * 0.62 * r, cy + 0.55 * r + Math.sin(i * 1.7) * 0.08 * r, Math.sin(a) * 0.62 * r - 0.1 * r], 0.4 * r, c);
      }
      add('sphere', 'head', [0, cy + 0.75 * r, -0.1 * r], 0.6 * r, c);
      break;
    case 'bald': // couronne de cheveux sur les côtés et derrière
      add('sphere', 'head', [0, cy - 0.05 * r, -0.28 * r], [1.04 * r, 0.62 * r, 0.82 * r], c);
      break;
    case 'side': // raie sur le côté, coiffé en arrière (Hippolyte)
      cap(1.07, -0.45);
      add('sphere', 'head', [0.3 * r, cy + 0.72 * r, 0.25 * r], [0.55 * r, 0.3 * r, 0.6 * r], c, [0, 0, -0.35]);
      break;
    case 'quiff':
      cap(1.06, -0.35);
      add('sphere', 'head', [0, cy + 0.85 * r, 0.45 * r], [0.55 * r, 0.32 * r, 0.42 * r], c, [-0.4, 0, 0]);
      break;
  }
}

// ---------- Humanoïde ----------
/**
 * o: { skin, shirt, pants, shoes, hair, hairColor, height, girth, headR, pose: 'stand'|'sit'|'lean',
 *      skirt, belly, glasses, beard, mustache, blush, held: 'beer'|'wine'|'mug'|'cig'|'phone'|null,
 *      anim: 'chat'|'idle'|'write'|'tray'|'leash'|'smoke'|'cane'|'clipboard', talk (0..1), extras(add, k) }
 */
export function humanoid(o = {}) {
  const h = o.height ?? 1, g = o.girth ?? 1, r = o.headR ?? 0.26;
  const pose = o.pose ?? 'stand';
  const sit = pose === 'sit', lean = pose === 'lean';
  const legLen = 0.37 * h;
  const hipY = sit ? 0.5 : legLen + 0.075;
  const th = 0.48 * h, tw = 0.46 * g, td = 0.36 * g;
  const k = { h, g, r, pose, hipY, th, neck: th - 0.03, shX: tw * 0.46, shY: th * 0.78, armLen: 0.33 * h, legX: 0.1 * Math.min(g, 1.2), legLen };
  const skin = o.skin ?? pick(SKIN);
  const shirt = o.shirt ?? pick(SHIRTS);
  const pants = o.pants ?? pick(PANTS);
  const shoes = o.shoes ?? 0x2b2522;
  const parts = [];
  const add = (geo, bone, pos, scale, color, rot, glow) => parts.push(part(geo, bone, pos, scale, color, rot, glow));

  // Corps en poire
  add('torso', 'body', [0, -0.03, 0], [tw, th, td], shirt);
  add('sphere', 'body', [0, 0.05, 0], [tw * 0.5, 0.12, td * 0.52], o.skirt && !sit ? o.skirt : pants);
  if (o.belly) add('sphere', 'body', [0, th * 0.4, td * 0.22], [tw * 0.42 * o.belly, th * 0.42 * o.belly, td * 0.45 * o.belly], shirt);
  if (o.skirt && !sit) add('skirt', 'body', [0, -0.13, 0], [tw * 1.15, 0.36, td * 1.25], o.skirt);
  // Tête
  const cy = 0.92 * r;
  add('head', 'head', [0, cy, 0], r, skin);
  for (const sx of [-1, 1]) {
    add('ball', 'head', [sx * 0.34 * r, cy + 0.06 * r, 0.9 * r], [0.1 * r, 0.15 * r, 0.07 * r], DARK);
    add('ball', 'head', [sx * 0.31 * r, cy + 0.12 * r, 0.96 * r], [0.035 * r, 0.035 * r, 0.02 * r], 0xffffff, null, true);
    if (o.blush !== false) add('ball', 'head', [sx * 0.56 * r, cy - 0.2 * r, 0.77 * r], [0.15 * r, 0.08 * r, 0.05 * r], new THREE.Color(skin).lerp(new THREE.Color(0xff7f86), 0.45).getHex());
    add('ball', 'head', [sx * 0.97 * r, cy, 0], [0.12 * r, 0.2 * r, 0.12 * r], skin); // oreilles
  }
  add('ball', 'head', [0, cy - 0.1 * r, 0.98 * r], 0.1 * r, new THREE.Color(skin).multiplyScalar(0.88).getHex());
  add('ball', 'mouth', [0, 0, 0], [0.11 * r, 0.06 * r, 0.04 * r], 0x6a2a2a);
  hair(add, o.hair ?? 'short', r, o.hairColor ?? pick(HAIR));
  if (o.beard) { // grosse barbe blanche de Père Noël
    add('sphere', 'head', [0, cy - 0.55 * r, 0.42 * r], [0.95 * r, 0.9 * r, 0.62 * r], o.beard);
    add('sphere', 'head', [0, cy - 1.1 * r, 0.5 * r], [0.55 * r, 0.5 * r, 0.4 * r], o.beard);
  }
  if (o.mustache) for (const sx of [-1, 1]) add('sphere', 'head', [sx * 0.2 * r, cy - 0.27 * r, 0.93 * r], [0.24 * r, 0.1 * r, 0.1 * r], o.mustache, [0, 0, sx * 0.25]);
  if (o.glasses) for (const sx of [-1, 1]) add('torus', 'head', [sx * 0.34 * r, cy + 0.06 * r, 1.0 * r], 0.2 * r, o.glasses);
  if (o.cap) { // casquette de police municipale
    add('cyl', 'head', [0, cy + 0.8 * r, -0.04 * r], [2.05 * r, 0.42 * r, 2.05 * r], o.cap);
    add('cyl', 'head', [0, cy + 1.04 * r, -0.04 * r], [2.2 * r, 0.1 * r, 2.2 * r], o.cap);
    add('cyl', 'head', [0, cy + 0.7 * r, -0.04 * r], [2.08 * r, 0.14 * r, 2.08 * r], 0x8fb3e8);
    add('box', 'head', [0, cy + 0.6 * r, 0.95 * r], [1.2 * r, 0.06 * r, 0.6 * r], 0x111317, [0.35, 0, 0]);
    add('ball', 'head', [0, cy + 0.85 * r, 1.02 * r], 0.12 * r, 0xe8c45a, null, true);
  }
  // Bras (manches + mains)
  for (const [b, hb] of [['armL', 'handL'], ['armR', 'handR']]) {
    add('limb', b, [0, 0, 0], [0.13 * Math.sqrt(g), k.armLen, 0.13 * Math.sqrt(g)], shirt);
    add('ball', hb, [0, 0, 0], 0.068, skin);
  }
  // Jambes
  if (!lean) for (const b of ['legL', 'legR']) {
    const lc = o.skirt ? (sit ? o.skirt : skin) : pants;
    if (sit) {
      add('limb', b, [0, 0, 0], [0.15 * Math.min(g, 1.2), 0.36, 0.15 * Math.min(g, 1.2)], o.skirt ?? pants, [-Math.PI / 2, 0, 0]);
      add('limb', b, [0, 0, 0.34], [0.13, hipY - 0.07, 0.13], o.skirt ? skin : pants);
      add('ball', b, [0, -(hipY - 0.06), 0.39], [0.075, 0.055, 0.11], shoes);
    } else {
      add('limb', b, [0, 0, 0], [0.15 * Math.min(g, 1.2), legLen, 0.15 * Math.min(g, 1.2)], lc);
      add('ball', b, [0, -legLen, 0.035], [0.08, 0.06, 0.12], shoes);
    }
  }
  // Objet tenu en main droite
  const held = o.held;
  if (held === 'beer') { add('cyl', 'handR', [0, 0.05, 0.03], [0.08, 0.13, 0.08], 0xf0a830); add('cyl', 'handR', [0, 0.125, 0.03], [0.084, 0.03, 0.084], 0xfff6e0); }
  else if (held === 'wine') { add('cyl', 'handR', [0, 0.0, 0.03], [0.012, 0.08, 0.012], 0xdfe8ee); add('sphere', 'handR', [0, 0.07, 0.03], [0.045, 0.05, 0.045], o.wine ?? 0x8e1b3a); }
  else if (held === 'mug') { add('cyl', 'handR', [0, 0.05, 0.03], [0.09, 0.1, 0.09], o.mugColor ?? 0xf3efe6); }
  else if (held === 'cig') { add('cyl', 'handR', [0, 0.02, 0.06], [0.012, 0.012, 0.09], 0xf3efe6, [Math.PI / 2, 0, 0]); add('ball', 'handR', [0, 0.02, 0.105], 0.012, 0xff6a1a, null, true); }
  else if (held === 'phone') { add('box', 'handR', [0, 0.04, 0.03], [0.07, 0.13, 0.015], 0x9fd0ff, [-0.4, 0, 0], true); }
  o.extras?.(add, k);

  const bones = ['root', 'hips', 'body', 'head', 'mouth', 'armL', 'armR', 'handL', 'handR', 'legL', 'legR'];
  const proxy = makeRig(parts, { bones, animate: animHuman, data: { k, anim: o.anim ?? 'idle', held, talk: o.talk ?? 0.6, drinkPeriod: rnd(7, 13) } });
  proxy.userData.kind = 'human';
  return proxy;
}

const _sm = new THREE.Matrix4();
function animHuman(rig, t, dt, proxy) {
  const { k, st, bones: B } = rig;
  const ph = t + rig.seed * 37;
  // Vitesse au sol (le gameplay déplace le proxy, on en déduit la marche)
  const e = proxy.matrixWorld.elements;
  const sp = st.px === undefined ? 0 : Math.hypot(e[12] - st.px, e[14] - st.pz) / Math.max(dt, 1e-3);
  st.px = e[12]; st.pz = e[14];
  st.walk = lerp(st.walk ?? 0, sp > 0.25 && dt > 0 ? 1 : 0, Math.min(1, dt * 8));
  st.wp = (st.wp ?? 0) + dt * (5 + Math.min(sp, 3) * 2) * st.walk;
  const walk = k.pose === 'stand' ? st.walk : 0;

  const sit = k.pose === 'sit', lean = k.pose === 'lean';
  let bob = Math.sin(ph * 2.1) * 0.008, br = Math.sin(ph * 1.7) * 0.018;
  let nod = 0, turn = Math.sin(ph * 0.43) * 0.3, tilt = Math.sin(ph * 0.71) * 0.05, leanX = lean ? 0.35 : 0;
  const armRest = sit ? -1.05 : lean ? -1.35 : -0.08;
  let raiseL = armRest, raiseR = armRest, yawL = 0, yawR = 0, spreadL = sit || lean ? 0.05 : 0.14, spreadR = spreadL, tipL = 0, tipR = 0;
  let mouth = 0.35;

  // Bavardage : la moitié du temps, hochements de tête, bouche qui bouge, main qui gesticule
  const tk = clamp01(Math.sin(ph * 0.31 + rig.seed * 7) * 1.6) * rig.talk;
  nod += Math.sin(ph * 9) * 0.07 * tk;
  mouth += tk * Math.abs(Math.sin(ph * 11)) * 1.6;
  raiseL += -0.55 * tk * (0.5 + 0.5 * Math.sin(ph * 2.7));
  bob += Math.abs(Math.sin(ph * 7)) * 0.012 * tk;
  // Fou rire de temps en temps
  const la = smooth((Math.sin(ph * 0.17 + rig.seed * 3) - 0.93) / 0.07) * rig.talk;
  nod -= 0.4 * la; bob += Math.abs(Math.sin(ph * 22)) * 0.02 * la; mouth += la * 1.8; br += la * 0.03;

  // Boire / fumer : la main droite monte à la bouche
  if (rig.held && rig.held !== 'phone') {
    const P = rig.held === 'cig' ? 6 : rig.drinkPeriod;
    const u = (ph + rig.seed * 20) % P;
    const s = u < 0.8 ? smooth(u / 0.8) : u < 2.0 ? 1 : u < 2.8 ? 1 - smooth((u - 2.0) / 0.8) : 0;
    raiseR = lerp(raiseR, -2.3, s); yawR = 0.75 * s; spreadR = lerp(spreadR, 0.05, s);
    tipR = s * (rig.held === 'cig' ? 0 : 1.0);
    nod = lerp(nod, rig.held === 'cig' ? -0.1 : -0.45, s); turn *= 1 - s; mouth = lerp(mouth, 0.5, s);
    if (rig.held !== 'cig' && sit === false && !lean) raiseR = Math.min(raiseR, lerp(-0.7, -2.3, s)); // debout : verre à hauteur de poitrine
  } else if (rig.held === 'phone') {
    raiseR = -1.3; yawR = 0.5; nod = 0.35; turn *= 0.2;
  }
  switch (rig.anim) {
    case 'write': // Klaas note tout dans son carnet
      raiseR = -1.25 + Math.sin(ph * 15) * 0.05; yawR = 0.5 + Math.sin(ph * 4) * 0.08;
      raiseL = -1.35; yawL = -0.45; tipL = 0.0;
      if (Math.sin(ph * 0.4) > 0) { nod = 0.32; turn *= 0.2; mouth = 0.3; }
      break;
    case 'tray': raiseL = -1.45; yawL = -0.2; break;
    case 'leash': raiseL = -0.6; spreadL = 0.25; break;
    case 'cane': raiseL = -0.35; spreadL = 0.2; break;
    case 'clipboard': raiseL = -1.3; yawL = -0.5; break;
    case 'wave': raiseL = -2.6 + Math.sin(ph * 8) * 0.25; spreadL = 0.4; break;
  }
  // Marche
  if (walk > 0.01) {
    const sw = Math.sin(st.wp);
    bob += Math.abs(Math.cos(st.wp)) * 0.035 * walk;
    raiseL = lerp(raiseL, -0.45 * sw, walk * (rig.anim === 'tray' ? 0 : 1));
    raiseR = lerp(raiseR, 0.45 * sw, walk * (rig.held ? 0.3 : 1));
    turn *= 1 - walk;
  }
  const r = k.r;
  trs(B.hips, 0, k.hipY + bob, 0, leanX);
  B.body.copy(B.hips).multiply(_sm.makeScale(1 + br * 0.5, 1 + br, 1 + br * 0.5));
  B.head.copy(B.hips).multiply(trs(_t, 0, k.neck * (1 + br), 0, nod, turn, tilt, 'YXZ'));
  B.mouth.copy(B.head).multiply(trs(_t, 0, 0.92 * r - 0.42 * r, 0.9 * r, 0, 0, 0, 'XYZ', 1, Math.min(2.2, mouth), 1));
  B.armL.copy(B.hips).multiply(trs(_t, k.shX, k.shY, 0, raiseL, yawL, spreadL, 'YZX'));
  B.armR.copy(B.hips).multiply(trs(_t, -k.shX, k.shY, 0, raiseR, yawR, -spreadR, 'YZX'));
  B.handL.copy(B.armL).multiply(trs(_t, 0, -k.armLen, 0, -raiseL - tipL));
  B.handR.copy(B.armR).multiply(trs(_t, 0, -k.armLen, 0, -raiseR - tipR));
  const swing = walk * Math.sin(st.wp) * 0.55;
  trs(B.legL, k.legX, k.hipY - 0.03 + bob * 0.5, 0, sit ? 0 : swing);
  trs(B.legR, -k.legX, k.hipY - 0.03 + bob * 0.5, 0, sit ? 0 : -swing);
}

// ---------- Animaux ----------
export function dachshund() {
  const parts = [];
  const add = (geo, bone, pos, scale, color, rot, glow) => parts.push(part(geo, bone, pos, scale, color, rot, glow));
  const fur = 0x8a4b26, dark = 0x5a2e16;
  add('sphere', 'body', [0, 0, 0], [0.11, 0.1, 0.27], fur);
  add('sphere', 'body', [0, 0.01, 0.16], [0.115, 0.11, 0.12], fur);
  add('torus', 'body', [0, 0.05, 0.25], [0.075, 0.075, 0.075], 0xd23c3c, [0, 0, 0]);
  for (const [x, z] of [[0.065, 0.17], [-0.065, 0.17], [0.065, -0.17], [-0.065, -0.17]]) {
    add('limb', 'root', [x, 0.16, z], [0.06, 0.13, 0.06], dark);
    add('ball', 'root', [x, 0.02, z + 0.02], [0.04, 0.025, 0.05], dark);
  }
  add('sphere', 'head', [0, 0.04, 0.02], 0.1, fur);
  add('sphere', 'head', [0, 0.0, 0.12], [0.055, 0.05, 0.09], fur);
  add('ball', 'head', [0, 0.025, 0.205], 0.025, 0x1a1412);
  for (const sx of [-1, 1]) {
    add('sphere', 'head', [sx * 0.085, -0.01, 0.0], [0.028, 0.085, 0.055], dark, [0, 0, sx * 0.25]);
    add('ball', 'head', [sx * 0.045, 0.075, 0.085], 0.018, 0x1a1412);
  }
  add('limb', 'tail', [0, 0, 0], [0.035, 0.15, 0.035], fur);
  const proxy = makeRig(parts, { bones: ['root', 'body', 'head', 'tail'], animate: animDog });
  proxy.userData.kind = 'dog';
  return proxy;
}
function animDog(rig, t, dt, proxy) {
  const B = rig.bones, ph = t + rig.seed * 20;
  const sniff = smooth((Math.sin(ph * 0.6) - 0.3) / 0.4);
  const bob = Math.abs(Math.sin(ph * 3)) * 0.006;
  trs(B.body, 0, 0.2 + bob, 0);
  B.head.copy(B.body).multiply(trs(_t, 0, 0.07, 0.27, 0.15 + sniff * 0.6 + Math.sin(ph * 12) * 0.04 * sniff, Math.sin(ph * 0.8) * 0.5 * (1 - sniff), 0, 'YXZ'));
  B.tail.copy(B.body).multiply(trs(_t, 0, 0.04, -0.26, 2.3, Math.sin(ph * 14) * 0.6, 0, 'YXZ'));
}

export function cat(color = 0xe39548) {
  const parts = [];
  const add = (geo, bone, pos, scale, c, rot, glow) => parts.push(part(geo, bone, pos, scale, c, rot, glow));
  add('sphere', 'body', [0, 0.13, -0.02], [0.12, 0.15, 0.13], color);
  add('sphere', 'body', [0, 0.12, 0.07], [0.07, 0.1, 0.06], 0xfff4e6);
  add('sphere', 'body', [0.07, 0.05, -0.04], [0.06, 0.06, 0.1], color);
  add('sphere', 'body', [-0.07, 0.05, -0.04], [0.06, 0.06, 0.1], color);
  for (const sx of [-1, 1]) add('ball', 'body', [sx * 0.04, 0.02, 0.09], [0.03, 0.025, 0.04], 0xfff4e6);
  add('sphere', 'head', [0, 0, 0], [0.105, 0.095, 0.095], color);
  for (const sx of [-1, 1]) {
    add('cone', 'head', [sx * 0.06, 0.09, -0.01], [0.055, 0.075, 0.04], color, [0, 0, -sx * 0.25]);
    add('ball', 'head', [sx * 0.04, 0.015, 0.085], [0.021, 0.028, 0.012], 0xd8f06a, null, true);
    add('ball', 'head', [sx * 0.04, 0.015, 0.093], [0.006, 0.022, 0.006], 0x111111);
  }
  add('ball', 'head', [0, -0.015, 0.095], [0.014, 0.01, 0.01], 0xf08ca0);
  add('limb', 'tail', [0, 0, 0], [0.04, 0.24, 0.04], color);
  const proxy = makeRig(parts, { bones: ['root', 'body', 'head', 'tail'], animate: animCat });
  proxy.userData.kind = 'cat';
  return proxy;
}
function animCat(rig, t, dt) {
  const B = rig.bones, ph = t + rig.seed * 20;
  const br = Math.sin(ph * 1.5) * 0.02;
  trs(B.body, 0, 0, 0, 0, 0, 0, 'XYZ', 1 + br, 1 + br, 1 + br);
  trs(B.head, 0, 0.31 + br * 0.1, 0.03, Math.sin(ph * 0.5) * 0.1, Math.sin(ph * 0.27) * 0.7, Math.sin(ph * 0.9) * 0.12, 'YXZ');
  trs(B.tail, 0, 0.05, -0.13, 1.9, 0, Math.sin(ph * 1.3) * 0.5, 'XZY');
}

// ---------- Clients ----------
export function customer(pose = 'sit') {
  const fem = Math.random() < 0.5;
  const style = fem ? pick(['long', 'bob', 'ponytail', 'bun', 'curly', 'short']) : pick(['short', 'short', 'spiky', 'quiff', 'bald', 'none']);
  const old = Math.random() < 0.15;
  return humanoid({
    pose,
    hair: style,
    hairColor: old ? pick([0xcfcfcf, 0xa8a8a8, 0xeeeeee]) : pick(HAIR),
    skirt: fem && Math.random() < 0.35 ? pick([0xb5527a, 0x3d5a80, 0xe9c46a, 0x6d597a, 0x2a9d8f]) : null,
    height: rnd(0.92, 1.1), girth: rnd(0.9, 1.25), headR: rnd(0.24, 0.28),
    glasses: Math.random() < 0.2 ? 0x2a2a2a : null,
    beard: !fem && Math.random() < 0.18 ? pick(HAIR) : null,
    held: pick(['beer', 'beer', 'wine', 'wine', null, 'beer']),
    talk: rnd(0.3, 1),
  });
}

// ---------- Le casting ----------
const notebook = (add) => add('box', 'handL', [0, 0.03, 0.05], [0.14, 0.02, 0.18], 0x2b4d7a);
export const CAST = {
  pilou: () => humanoid({ hair: 'spiky', hairColor: 0x5a3b26, shirt: 0x7d8790, pants: 0x2f3542, glasses: 0x222222, skin: 0xf6d2b4,
    extras: (add, k) => add('hemi', 'body', [0, k.th * 0.86, -0.12], [0.2, 0.12, 0.16], 0x6c757d, [-1.9, 0, 0]) }), // capuche
  jeremie: () => humanoid({ hair: 'short', hairColor: 0x3b2a20, shirt: 0xc9a46a, pants: 0x3d4a63, glasses: 0x3a2a1a, height: 1.05, anim: 'leash',
    extras: (add, k) => add('box', 'handL', [0, -0.02, 0.35], [0.01, 0.01, 0.7], 0xd23c3c, [0.6, 0, 0]) }),
  klaas: (pose = 'lean') => humanoid({ pose, height: 1.12, girth: 1.18, headR: 0.29, skin: 0xf3cdb0, hair: 'bald', hairColor: 0xf7f5f0,
    beard: 0xf7f5f0, mustache: 0xf7f5f0, glasses: 0xc9a227, shirt: 0xc0392b, pants: 0x4a3f35, anim: 'write', talk: 0.2,
    extras: (add, k) => { notebook(add); for (let i = 0; i < 3; i++) add('ball', 'body', [0, k.th * (0.35 + i * 0.18), k.g * 0.17], 0.025, 0xf7f5f0); add('limb', 'handR', [0, 0.08, 0.04], [0.015, 0.12, 0.015], 0x222222, [0.6, 0, 0]); } }),
  hilde: (pose = 'lean') => humanoid({ pose, hair: 'bob', hairColor: 0xe6e6e6, shirt: 0xb39ddb, pants: 0x55617a, skin: 0xf6d2b4, held: 'mug', mugColor: 0xf3b3c8, talk: 0.5, height: 0.95, glasses: 0x8a6a9a }),
  tatie: (pose = 'lean') => humanoid({ pose, hair: 'curly', hairColor: 0xa26cc4, shirt: 0xe85d9b, pants: 0x3d4a63, glasses: 0xd4af37, held: 'phone', talk: 0.9, height: 0.92, girth: 1.12 }),
  seb: (pose = 'stand') => humanoid({ pose, hair: 'short', hairColor: 0x1f1a17, beard: 0x1f1a17, shirt: 0x2a9d8f, pants: 0xe8e2d0, held: 'wine', height: 1.1, talk: 1 }),
  nico: (pose = 'stand') => humanoid({ pose, hair: 'quiff', hairColor: 0xe0c070, shirt: 0xf2a7b8, pants: 0x3d4a63, held: 'wine', wine: 0xf0d080, talk: 1 }),
  hippolyte: () => humanoid({ hair: 'side', hairColor: 0xd8d8d8, mustache: 0xd8d8d8, shirt: 0x6b5e3a, pants: 0x4a4436, height: 1.08, anim: 'cane', talk: 0.3,
    extras: (add, k) => {
      add('sphere', 'body', [0, k.th * 0.86, 0.1], [0.08, 0.06, 0.06], 0x8e1b3a); // lavallière
      add('torso', 'body', [0, k.th * 0.25, 0.02], [0.47, k.th * 0.55, 0.37], 0x8c7a4a); // gilet
      add('cyl', 'handL', [0, -0.32, 0.02], [0.03, 0.7, 0.03], 0x2a1a10); add('ball', 'handL', [0, 0.02, 0.02], 0.035, 0xd4af37);
    } }),
  dede: () => humanoid({ hair: 'bald', hairColor: 0x3b2a20, mustache: 0x3b2a20, shirt: 0x24305e, pants: 0x2f3542, height: 0.84, girth: 1.55, headR: 0.29, talk: 0.9,
    extras: (add, k) => add('box', 'body', [0, k.th * 0.28, k.g * 0.19], [0.36, k.th * 0.5, 0.02], 0xf3efe6, [-0.12, 0, 0]) }), // tablier court
  ghislain: () => humanoid({ hair: 'manbun', hairColor: 0x2b1d14, beard: null, shirt: 0x1d1d22, pants: 0x1d1d22, height: 1.22, girth: 0.72, headR: 0.24, held: 'cig', talk: 0.15 }),
  waiter: () => humanoid({ hair: 'quiff', hairColor: 0x3b2a20, shirt: 0x1f1f24, pants: 0x1f1f24, height: 1.02, anim: 'tray', talk: 0.4,
    extras: (add, k) => {
      add('box', 'body', [0, -0.08, 0.17], [0.34, 0.52, 0.02], 0xf6f2ea); // grand tablier blanc
      add('cyl', 'handL', [0, 0.02, 0], [0.4, 0.02, 0.4], 0xc0c4ca); // plateau
      add('cyl', 'handL', [0.07, 0.09, 0.04], [0.07, 0.12, 0.07], 0xf0a830);
      add('cyl', 'handL', [-0.07, 0.09, -0.03], [0.07, 0.12, 0.07], 0xf0a830);
    } }),
  police: () => humanoid({ hair: 'short', hairColor: pick(HAIR), shirt: 0x1d2f5c, pants: 0x18233f, shoes: 0x111111, cap: 0x1a2648, height: 1.05, talk: 0.2,
    extras: (add, k) => {
      add('box', 'body', [0, 0.1, 0], [0.48, 0.06, 0.38], 0x111111); // ceinturon
      add('box', 'body', [0, k.th * 0.55, 0.0], [0.47, 0.05, 0.37], 0x8fb3e8); // bande bleu clair
      add('box', 'body', [0.1, k.th * 0.65, 0.17], [0.06, 0.07, 0.01], 0xe8c45a, null, true); // écusson
    } }),
  delphine: () => humanoid({ hair: 'bob', hairColor: 0x2d2420, shirt: 0x2f3e5c, skirt: 0x2f3542, height: 1.05, girth: 0.92, glasses: 0x111111, anim: 'clipboard', talk: 0.4,
    extras: (add, k) => {
      add('box', 'handL', [0, 0.02, 0.06], [0.2, 0.015, 0.26], 0x8a5a35, [0.3, 0, 0]);
      add('box', 'body', [0, k.th * 0.6, 0.18], [0.05, 0.08, 0.01], 0xffffff); // badge
    } }),
};

// Ancienne API : person(color) = un passant debout. La couleur de l'uniforme de police donne un agent.
export function person(color) {
  if (color === 0x1b2847) return CAST.police();
  return humanoid({ shirt: color, hair: pick(['short', 'bob', 'long', 'spiky']), talk: 0.3 });
}
