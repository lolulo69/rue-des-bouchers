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


// ---------- Expressions (os eyeL/eyeR/browL/browR/mouth) ----------
// eye : ouverture verticale · by : hauteur des sourcils (× r) · bt : inclinaison (positif = bout intérieur bas)
// bLift : sourcil gauche en plus (suspicion) · ms : bouche [largeur, hauteur] · mx : décalage de la bouche (× r)
export const EXPRESSIONS = {
  neutral: { eye: 1, by: 0, bt: 0, ms: [1, 0.35], mx: 0 },
  happy: { eye: 0.4, by: 0.08, bt: -0.15, ms: [0.4, 0.3], mx: 0 },
  angry: { eye: 0.7, by: -0.08, bt: 0.6, ms: [0.4, 0.3], mx: 0 },
  suspicious: { eye: 0.38, by: -0.02, bt: 0.2, bLift: 0.12, ms: [0.8, 0.3], mx: 0.18, look: 0.09 },
  surprised: { eye: 1.4, by: 0.14, bt: -0.15, ms: [0.8, 2.1], mx: 0 },
  sick: { eye: 0.6, by: 0.04, bt: -0.5, ms: [1.3, 0.4], mx: 0.05 },
  sad: { eye: 0.8, by: 0.03, bt: -0.55, ms: [0.4, 0.3], mx: 0 },
};

// ---------- Objets tenus : un morceau n'apparaît que si rig.held (ou rig.anim) vaut son nom ----------
function heldItems(addW, k, o) {
  const r = k.r, cy = 0.92 * r;
  addW('beer', 'cyl', 'handR', [0, 0.05, 0.03], [0.08, 0.13, 0.08], 0xf0a830);
  addW('beer', 'cyl', 'handR', [0, 0.125, 0.03], [0.084, 0.03, 0.084], 0xfff6e0);
  addW('wine', 'cyl', 'handR', [0, 0.0, 0.03], [0.012, 0.08, 0.012], 0xdfe8ee);
  addW('wine', 'sphere', 'handR', [0, 0.07, 0.03], [0.045, 0.05, 0.045], o.wine ?? 0x8e1b3a);
  addW('mug', 'cyl', 'handR', [0, 0.05, 0.03], [0.09, 0.1, 0.09], o.mugColor ?? 0xf3efe6);
  addW('coffee', 'cyl', 'handR', [0, 0.04, 0.03], [0.07, 0.07, 0.07], 0xf3efe6);
  addW('coffee', 'cyl', 'handR', [0, 0.0, 0.03], [0.12, 0.012, 0.12], 0xf3efe6);
  addW('cig', 'cyl', 'handR', [0, 0.02, 0.06], [0.012, 0.012, 0.09], 0xf3efe6, [Math.PI / 2, 0, 0]);
  addW('cig', 'ball', 'handR', [0, 0.02, 0.105], 0.014, 0xff6a1a, null, true, true);
  addW('phone', 'box', 'handR', [0, 0.05, 0.03], [0.07, 0.13, 0.015], 0x9fd0ff, [-0.4, 0, 0], true, true);
  addW('film', 'box', 'handR', [0, 0.07, 0.02], [0.13, 0.075, 0.012], 0x2a2a2e, [0, 0, 0]);
  addW('film', 'box', 'handR', [0, 0.07, -0.008], [0.11, 0.06, 0.004], 0xbfe0ff, [0, 0, 0], true, true);
  addW('film', 'ball', 'handR', [0.045, 0.095, 0.03], 0.012, 0xff3030, null, true, true);
  addW('envelope', 'box', 'handR', [0, 0.04, 0.05], [0.2, 0.13, 0.015], 0xf6f0dc, [-0.3, 0, 0]);
  addW('envelope', 'box', 'handR', [0, 0.065, 0.06], [0.2, 0.012, 0.02], 0xd9c79a, [-0.3, 0, 0]);
  // parapluie ouvert au-dessus de la tête (pluie)
  addW('umbrella', 'cyl', 'handR', [0, 0.45, 0.02], [0.025, 0.95, 0.025], 0x2a2a2a);
  addW('umbrella', 'cone', 'handR', [0, 0.98, 0.02], [1.15, 0.32, 1.15], o.umbrella ?? 0x2b4d7a, null, false, true);
  addW('umbrella', 'ball', 'handR', [0, 1.16, 0.02], 0.03, 0x2a2a2a);
  addW('fork', 'cyl', 'handR', [0, 0.06, 0.04], [0.012, 0.16, 0.012], 0xc0c4ca, [0.3, 0, 0]);
  addW('fork', 'ball', 'handR', [0, 0.14, 0.07], [0.03, 0.025, 0.03], 0x8a4a22);
  addW('key', 'cyl', 'handR', [0, 0.03, 0.07], [0.02, 0.1, 0.02], 0xe8c45a, [Math.PI / 2, 0, 0]);
  addW('clipboard', 'box', 'handL', [0, 0.02, 0.06], [0.2, 0.015, 0.26], 0x8a5a35, [0.3, 0, 0]);
  addW('clipboard', 'box', 'handL', [0, 0.03, 0.06], [0.17, 0.012, 0.21], 0xf6f2ea, [0.3, 0, 0]);
  addW('notebook', 'box', 'handL', [0, 0.03, 0.05], [0.14, 0.02, 0.18], 0x2b4d7a);
  addW('brush', 'cyl', 'handR', [0, 0.35, 0.02], [0.03, 0.8, 0.03], 0x8a5a35);
  addW('brush', 'box', 'handR', [0, 0.78, 0.02], [0.3, 0.08, 0.1], 0xe8c45a);
  addW('tape', 'box', 'handL', [0, 0.02, 0.04], [0.1, 0.1, 0.06], 0xf2c230);
  addW('tape', 'box', 'tape', [0, 0, 0.5], [0.025, 0.004, 1], 0xf7d84a, null, true, true);
  // jumelles : devant les yeux (os de la tête), mains levées par la pose
  addW('binoculars', 'cyl', 'head', [0.1 * r / 0.26, cy + 0.06 * r, 1.12 * r], [0.07, 0.13, 0.07], 0x1e2126, [Math.PI / 2, 0, 0]);
  addW('binoculars', 'cyl', 'head', [-0.1 * r / 0.26, cy + 0.06 * r, 1.12 * r], [0.07, 0.13, 0.07], 0x1e2126, [Math.PI / 2, 0, 0]);
  addW('binoculars', 'cyl', 'head', [0, cy + 0.06 * r, 1.08 * r], [0.12, 0.04, 0.04], 0x3a3d42, [0, 0, Math.PI / 2]);
  // la goutte de sueur (laxatif) : comique, pas dégoûtant
  addW('rush', 'ball', 'head', [0.75 * r, cy + 0.6 * r, 0.5 * r], [0.07, 0.1, 0.05], 0x9fd8ff, null, true, true);
  // radio d'épaule (police)
  addW('radio', 'box', 'body', [0.15, k.th * 0.8, 0.14], [0.06, 0.1, 0.04], 0x111111);
}

// ---------- Humanoïde ----------
/**
 * o: { skin, shirt, pants, shoes, hair, hairColor, height, girth, headR, pose: 'stand'|'sit'|'lean',
 *      skirt, belly, glasses, beard, mustache, blush, held, anim, expr, talk (0..1), extras(add, k) }
 * held : 'beer'|'wine'|'mug'|'coffee'|'cig'|'phone'|'envelope'|'key'|'clipboard'|'notebook'|'brush'|null
 * anim : voir STATES (animHuman). On peut tout changer à chaud : setState(proxy, { anim, held, expr }).
 */
export function humanoid(o = {}) {
  const h = o.height ?? 1, g = o.girth ?? 1, r = o.headR ?? 0.26;
  const pose = o.pose ?? 'stand';
  const sit = pose === 'sit', lean = pose === 'lean';
  const legLen = 0.37 * h;
  const hipY = sit ? 0.5 : legLen + 0.075;
  const th = 0.48 * h, tw = 0.46 * g, td = 0.36 * g;
  const k = { h, g, r, pose, hipY, standHip: legLen + 0.075, th, neck: th - 0.03, shX: tw * 0.46, shY: th * 0.78, armLen: 0.33 * h, legX: 0.1 * Math.min(g, 1.2), legLen };
  const look = { ...o };
  look.skin = o.skin ?? pick(SKIN);
  look.shirt = o.shirt ?? pick(SHIRTS);
  look.pants = o.pants ?? pick(PANTS);
  look.hairColor = o.hairColor ?? pick(HAIR);
  const { skin, shirt, pants } = look;
  const shoes = o.shoes ?? 0x2b2522;
  const parts = [];
  const add = (geo, bone, pos, scale, color, rot, glow, keep) => { const p = part(geo, bone, pos, scale, color, rot, glow, keep); parts.push(p); return p; };
  const addW = (when, ...a) => { add(...a).when = when; };

  // Corps en poire
  add('torso', 'body', [0, -0.03, 0], [tw, th, td], shirt);
  add('ball', 'body', [0, 0.05, 0], [tw * 0.5, 0.12, td * 0.52], o.skirt && !sit ? o.skirt : pants);
  if (o.belly) add('sphere', 'body', [0, th * 0.4, td * 0.22], [tw * 0.42 * o.belly, th * 0.42 * o.belly, td * 0.45 * o.belly], shirt);
  if (o.skirt && !sit) add('skirt', 'body', [0, -0.13, 0], [tw * 1.15, 0.36, td * 1.25], o.skirt);
  // Tête et visage
  const cy = 0.92 * r;
  add('head', 'head', [0, cy, 0], r, skin);
  for (const [sx, eb, bb] of [[1, 'eyeL', 'browL'], [-1, 'eyeR', 'browR']]) {
    add('ball', eb, [0, 0, 0], [0.1 * r, 0.15 * r, 0.07 * r], DARK);
    add('dot', eb, [-sx * 0.03 * r, 0.06 * r, 0.06 * r], [0.035 * r, 0.035 * r, 0.02 * r], 0xffffff, null, true);
    add('box', bb, [0, 0, 0], [0.28 * r, 0.07 * r, 0.08 * r], o.brows ?? new THREE.Color(look.hairColor).multiplyScalar(0.7).getHex());
    if (o.blush !== false) add('dot', 'head', [sx * 0.56 * r, cy - 0.2 * r, 0.77 * r], [0.15 * r, 0.08 * r, 0.05 * r], new THREE.Color(skin).lerp(new THREE.Color(0xff7f86), 0.45).getHex());
    add('dot', 'head', [sx * 0.97 * r, cy, 0], [0.12 * r, 0.2 * r, 0.12 * r], skin); // oreilles
  }
  add('dot', 'head', [0, cy - 0.1 * r, 0.98 * r], 0.1 * r, new THREE.Color(skin).multiplyScalar(0.88).getHex());
  add('dot', 'mouth', [0, 0, 0], [0.11 * r, 0.06 * r, 0.04 * r], 0x6a2a2a);
  // marques d'expression (visibles selon rig.expr)
  addW('happy', 'arc', 'head', [0, cy - 0.38 * r, 0.93 * r], [0.17 * r, 0.13 * r, 0.12 * r], 0x6a2a2a, [0, 0, Math.PI]);
  for (const ex of ['angry', 'sad']) addW(ex, 'arc', 'head', [0, cy - 0.5 * r, 0.92 * r], [0.14 * r, 0.09 * r, 0.12 * r], 0x6a2a2a);
  addW('angry', 'box', 'head', [0.45 * r, cy + 0.62 * r, 0.75 * r], [0.04, 0.14 * r, 0.02], 0xe0353a, [0.5, 0, 0.6], true, true);
  addW('angry', 'box', 'head', [0.45 * r, cy + 0.62 * r, 0.75 * r], [0.04, 0.14 * r, 0.02], 0xe0353a, [0.5, 0, -0.6], true, true);
  addW('sad', 'dot', 'head', [0.36 * r, cy - 0.18 * r, 0.93 * r], [0.05 * r, 0.09 * r, 0.04 * r], 0x8fd0ff, null, true);
  addW('sick', 'dot', 'head', [0.75 * r, cy + 0.55 * r, 0.55 * r], [0.07, 0.1, 0.05], 0x9fd8ff, null, true);
  for (const sx of [-1, 1]) addW('sick', 'dot', 'head', [sx * 0.56 * r, cy - 0.2 * r, 0.8 * r], [0.16 * r, 0.09 * r, 0.05 * r], 0x9ccf6a);
  hair(add, o.hair ?? 'short', r, look.hairColor);
  if (o.beard) { // grosse barbe (blanche pour Klaas)
    const bs = o.beardSize ?? 1; // 1 = barbe de Père Noël, < 1 = barbe courte
    add('sphere', 'head', [0, cy - (0.45 + 0.1 * bs) * r, 0.42 * r], [0.95 * r, 0.9 * r * bs, 0.62 * r], o.beard);
    if (bs >= 0.9) add('sphere', 'head', [0, cy - 1.1 * r, 0.5 * r], [0.55 * r, 0.5 * r, 0.4 * r], o.beard);
  }
  if (o.mustache) for (const sx of [-1, 1]) add('sphere', 'head', [sx * 0.2 * r, cy - 0.27 * r, 0.93 * r], [0.24 * r, 0.1 * r, 0.1 * r], o.mustache, [0, 0, sx * 0.25]);
  if (o.glasses) for (const sx of [-1, 1]) add('torus', 'head', [sx * 0.34 * r, cy + 0.06 * r, 1.0 * r], 0.2 * r, o.glasses);
  if (o.cap) { // casquette de police municipale
    add('cyl', 'head', [0, cy + 0.8 * r, -0.04 * r], [2.05 * r, 0.42 * r, 2.05 * r], o.cap);
    add('cyl', 'head', [0, cy + 1.04 * r, -0.04 * r], [2.2 * r, 0.1 * r, 2.2 * r], o.cap);
    add('cyl', 'head', [0, cy + 0.7 * r, -0.04 * r], [2.08 * r, 0.14 * r, 2.08 * r], o.capBand ?? 0x8fb3e8);
    add('box', 'head', [0, cy + 0.6 * r, 0.95 * r], [1.2 * r, 0.06 * r, 0.6 * r], 0x111317, [0.35, 0, 0]);
    add('ball', 'head', [0, cy + 0.85 * r, 1.02 * r], 0.12 * r, 0xe8c45a, null, true);
  }
  // Bras (manches + mains)
  for (const [b, hb] of [['armL', 'handL'], ['armR', 'handR']]) {
    add('limb', b, [0, 0, 0], [0.13 * Math.sqrt(g), k.armLen, 0.13 * Math.sqrt(g)], o.sleeves ?? shirt);
    add('dot', hb, [0, 0, 0], 0.068, o.gloves ?? skin);
  }
  // Jambes (cuisse + tibia : assis, debout, à vélo, tombé)
  if (!lean) for (const b of ['legL', 'legR']) {
    const lc = o.skirt ? skin : pants;
    add('limb', b, [0, 0, 0], [0.15 * Math.min(g, 1.2), 0.36 * h, 0.15 * Math.min(g, 1.2)], o.skirt ?? pants);
    add('limb', b === 'legL' ? 'shinL' : 'shinR', [0, 0, 0], [0.13, 0.36 * h, 0.13], lc);
    add('dot', b === 'legL' ? 'shinL' : 'shinR', [0, -0.36 * h + 0.01, 0.04], [0.08, 0.06, 0.12], shoes);
  }
  heldItems(addW, k, o);
  o.extras?.(add, k, addW);

  const bones = ['root', 'hips', 'body', 'head', 'mouth', 'eyeL', 'eyeR', 'browL', 'browR', 'armL', 'armR', 'handL', 'handR', 'legL', 'legR', 'shinL', 'shinR', 'tape'];
  const proxy = makeRig(parts, { bones, animate: animHuman, data: { k, anim: o.anim ?? 'idle', held: o.held ?? null, expr: o.expr ?? 'neutral', talk: o.talk ?? 0.6, drinkPeriod: rnd(7, 13), flags: {}, tapeLen: 1.5 } });
  proxy.userData.kind = 'human';
  proxy.userData.look = look;
  return proxy;
}
// Change l'état d'un personnage (anim, objet tenu, expression, bavardage) à chaud
export function setState(proxy, s = {}) {
  const rig = proxy.userData.rig;
  for (const key of ['anim', 'held', 'expr', 'talk', 'tapeLen']) if (s[key] !== undefined) rig[key] = s[key];
  if (s.flags) Object.assign(rig.flags, s.flags);
  return proxy;
}
// Même personne, autre pose (un client assis qui se lève pour courir aux toilettes)
export const relook = (proxy, pose, extra = {}) => humanoid({ ...proxy.userData.look, pose, ...extra });

const _sm = new THREE.Matrix4();
function animHuman(rig, t, dt, proxy) {
  const { k, st, bones: B } = rig;
  const still = rig.still; // portraits : pose figée, sans bavardage
  const ph = still ? 0.6 : t + rig.seed * 37;
  // Vitesse au sol (le gameplay déplace le proxy, on en déduit la marche)
  const e = proxy.matrixWorld.elements;
  const sp = st.px === undefined ? 0 : Math.hypot(e[12] - st.px, e[14] - st.pz) / Math.max(dt, 1e-3);
  st.px = e[12]; st.pz = e[14];
  st.walk = lerp(st.walk ?? 0, sp > 0.25 && dt > 0 ? 1 : 0, Math.min(1, dt * 8));
  st.wp = (st.wp ?? 0) + dt * (5 + Math.min(sp, 4) * 2.2) * st.walk;
  const anim = rig.anim;
  const ride = anim === 'ride', fallen = anim === 'fallen';
  const sit = k.pose === 'sit' || anim === 'type' || anim === 'meeting';
  const lean = k.pose === 'lean';
  const walk = k.pose === 'stand' && !ride ? st.walk : 0;

  let hipY = k.pose === 'sit' ? k.hipY : sit ? 0.5 : k.hipY;
  let bob = still ? 0 : Math.sin(ph * 2.1) * 0.008, br = still ? 0 : Math.sin(ph * 1.7) * 0.018;
  let nod = 0, turn = still ? 0 : Math.sin(ph * 0.43) * 0.3, tilt = still ? 0 : Math.sin(ph * 0.71) * 0.05, leanX = lean ? 0.35 : 0;
  const armRest = sit ? -1.05 : lean ? -1.35 : -0.08;
  let raiseL = armRest, raiseR = armRest, yawL = 0, yawR = 0, spreadL = sit || lean ? 0.05 : 0.14, spreadR = spreadL, tipL = 0, tipR = 0;
  let mouth = 0;
  // jambes : cuisse (rotation X à la hanche) et tibia (rotation X au genou, relative à la cuisse)
  let thighL = sit ? -Math.PI / 2 : 0, thighR = thighL, kneeL = sit ? Math.PI / 2 : 0, kneeR = kneeL;
  const talk = still ? 0 : rig.talk;

  // Bavardage : la moitié du temps, hochements de tête, bouche qui bouge, main qui gesticule
  const tk = clamp01(Math.sin(ph * 0.31 + rig.seed * 7) * 1.6) * talk;
  nod += Math.sin(ph * 9) * 0.07 * tk;
  mouth += tk * Math.abs(Math.sin(ph * 11)) * 1.6;
  raiseL += -0.55 * tk * (0.5 + 0.5 * Math.sin(ph * 2.7));
  bob += Math.abs(Math.sin(ph * 7)) * 0.012 * tk;
  // Fou rire de temps en temps
  const la = smooth((Math.sin(ph * 0.17 + rig.seed * 3) - 0.93) / 0.07) * talk;
  nod -= 0.4 * la; bob += Math.abs(Math.sin(ph * 22)) * 0.02 * la; mouth += la * 1.8; br += la * 0.03;

  // Boire / fumer : la main droite monte à la bouche
  const held = rig.held;
  if (!still && (held === 'beer' || held === 'wine' || held === 'mug' || held === 'coffee' || held === 'cig' || held === 'fork')) {
    const P = held === 'cig' ? 6 : rig.drinkPeriod;
    const u = (ph + rig.seed * 20) % P;
    const s = u < 0.8 ? smooth(u / 0.8) : u < 2.0 ? 1 : u < 2.8 ? 1 - smooth((u - 2.0) / 0.8) : 0;
    raiseR = lerp(raiseR, -2.3, s); yawR = 0.75 * s; spreadR = lerp(spreadR, 0.05, s);
    tipR = s * (held === 'cig' ? 0 : 1.0);
    nod = lerp(nod, held === 'cig' ? -0.1 : -0.45, s); turn *= 1 - s; mouth = lerp(mouth, 0.5, s);
    if (held !== 'cig' && !sit && !lean) raiseR = Math.min(raiseR, lerp(-0.7, -2.3, s)); // debout : verre à hauteur de poitrine
  } else if (held === 'phone') {
    raiseR = -1.3; yawR = 0.5; nod = 0.35; turn *= 0.2;
  } else if (held === 'umbrella') {
    raiseR = -0.95; yawR = 0.55; spreadR = 0; turn *= 0.3;
  } else if (held === 'envelope' || held === 'key') {
    raiseR = -1.2; yawR = 0.3;
  }
  switch (anim) {
    case 'write': // Klaas note tout dans son carnet
      raiseR = -1.25 + Math.sin(ph * 15) * 0.05; yawR = 0.5 + Math.sin(ph * 4) * 0.08;
      raiseL = -1.35; yawL = -0.45;
      if (Math.sin(ph * 0.4) > 0) { nod = 0.32; turn *= 0.2; mouth = 0; }
      break;
    case 'binoculars': // les deux mains aux jumelles, balayage lent de la rue
      raiseL = raiseR = -2.35; yawL = -0.85; yawR = 0.85; spreadL = spreadR = 0.15;
      nod = 0.12 + Math.sin(ph * 0.5) * 0.05; turn = Math.sin(ph * 0.3) * 0.25; mouth = 0;
      break;
    case 'film': // téléphone levé à hauteur des yeux
      raiseR = -2.0; yawR = 0.55; spreadR = 0.05; nod = -0.05; turn *= 0.2;
      break;
    case 'tray': raiseL = -1.45; yawL = -0.2; break;
    case 'leash': raiseL = -0.6; spreadL = 0.25; break;
    case 'cane': raiseL = -0.35; spreadL = 0.2; break;
    case 'clipboard': raiseL = -1.3; yawL = -0.5; raiseR = -1.1 + Math.sin(ph * 12) * 0.05; yawR = 0.6; nod = 0.25; break;
    case 'measure': // mètre ruban déroulé jusqu'au sol, devant elle
      raiseL = -0.9; yawL = -0.2; nod = 0.45; turn = 0; raiseR = -0.6;
      break;
    case 'wave': raiseL = -2.6 + Math.sin(ph * 8) * 0.25; spreadL = 0.4; break;
    case 'greet': // Dédé accueille la police : grand sourire, main tendue, petits sauts
      raiseR = -1.35 + Math.sin(ph * 9) * 0.15; yawR = 0.15; raiseL = -2.4 + Math.sin(ph * 7) * 0.3; spreadL = 0.35;
      bob += Math.abs(Math.sin(ph * 4.5)) * 0.04; mouth = Math.max(mouth, 0.9);
      break;
    case 'give': // tend l'enveloppe, en regardant autour (furtif)
      raiseR = -1.45; yawR = 0.25; turn = Math.sin(ph * 2.5) * 0.7; nod = 0.1; leanX = 0.15;
      break;
    case 'smoke': // pause clope : main gauche dans la poche, épaule au mur
      raiseL = 0.15; spreadL = 0.05; tilt += 0.08;
      break;
    case 'clean': // Ghislain frotte le store au balai-brosse, bras levés
      raiseR = -2.7 + Math.sin(ph * 6) * 0.25; yawR = 0.2 + Math.sin(ph * 6) * 0.2; raiseL = -2.3 + Math.sin(ph * 6) * 0.2; yawL = -0.5;
      nod = -0.5; turn = 0; mouth = 0;
      break;
    case 'struggle': // serrure collée : penché, clé qui ne tourne pas, bras qui tremblent
      leanX = 0.35; raiseR = -1.5 + Math.sin(ph * 25) * 0.08; raiseL = -1.4 + Math.sin(ph * 23) * 0.08; yawL = -0.35; yawR = 0.2;
      bob += Math.abs(Math.sin(ph * 25)) * 0.01; nod = 0.2;
      break;
    case 'rush': // laxatif : mains sur le ventre, petits pas pressés (comique)
      raiseL = raiseR = -0.55; yawL = -0.95; yawR = 0.95; spreadL = spreadR = -0.05; leanX = 0.18;
      bob += Math.abs(Math.sin(ph * 14)) * 0.02; turn = 0;
      break;
    case 'type': // Pilou au clavier
      raiseL = raiseR = -1.3 + Math.sin(ph * 18) * 0.04; yawL = -0.35; yawR = 0.35; nod = 0.12; turn = Math.sin(ph * 0.4) * 0.1; mouth = 0;
      raiseL += Math.max(0, Math.sin(ph * 13)) * 0.06; raiseR += Math.max(0, Math.sin(ph * 13 + 1.7)) * 0.06;
      break;
    case 'meeting': break;
    case 'fan': // s'évente devant le nez (odeur)
      raiseR = -2.1 + Math.sin(ph * 14) * 0.3; yawR = 0.7; spreadR = 0.1; nod = -0.15; turn = Math.sin(ph * 2) * 0.4;
      break;
    case 'ride': // à vélo : assis sur la selle, mains au guidon, pédalage selon la vitesse
      hipY = 0.86; leanX = 0.3; raiseL = raiseR = -1.25; yawL = -0.15; yawR = 0.15; spreadL = spreadR = 0.12; turn *= 0.3;
      break;
    case 'fallen': // chaise dévissée : sur les fesses, jambes en l'air, bras qui moulinent
      hipY = 0.12; leanX = -0.35; raiseL = -2.6 + Math.sin(ph * 10) * 0.4; raiseR = -2.6 + Math.cos(ph * 10) * 0.4; spreadL = spreadR = 0.6;
      thighL = thighR = -1.25; kneeL = kneeR = 0.3; mouth = 1.8;
      break;
  }
  if (anim === 'ride') {
    st.crank = (st.crank ?? 0) + dt * Math.min(sp, 6) * 2.2;
    thighL = -1.15 + Math.sin(st.crank) * 0.45; thighR = -1.15 - Math.sin(st.crank) * 0.45;
    kneeL = 1.2 - Math.sin(st.crank) * 0.3; kneeR = 1.2 + Math.sin(st.crank) * 0.3;
  }
  // Marche
  if (walk > 0.01) {
    const sw = Math.sin(st.wp);
    const rush = anim === 'rush' ? 0.5 : 1;
    bob += Math.abs(Math.cos(st.wp)) * 0.035 * walk;
    if (anim !== 'tray' && anim !== 'rush' && anim !== 'leash' && anim !== 'binoculars') raiseL = lerp(raiseL, -0.45 * sw, walk);
    if (!held && anim !== 'rush' && anim !== 'film') raiseR = lerp(raiseR, 0.45 * sw, walk);
    thighL = 0.55 * sw * walk * rush; thighR = -thighL;
    kneeL = Math.max(0, -Math.cos(st.wp)) * 0.6 * walk; kneeR = Math.max(0, Math.cos(st.wp)) * 0.6 * walk;
    turn *= 1 - walk;
  }
  // Expression
  const X = EXPRESSIONS[anim === 'rush' ? 'sick' : anim === 'fallen' ? 'surprised' : rig.expr] ?? EXPRESSIONS.neutral;
  const r = k.r, cy = 0.92 * r;
  const blink = still ? 1 : (ph * 0.9 + rig.seed * 5) % 4.3 < 0.12 ? 0.1 : 1;
  trs(B.hips, 0, hipY + bob, 0, leanX);
  B.body.copy(B.hips).multiply(_sm.makeScale(1 + br * 0.5, 1 + br, 1 + br * 0.5));
  B.head.copy(B.hips).multiply(trs(_t, 0, k.neck * (1 + br), 0, nod, turn, tilt, 'YXZ'));
  const ms = X.ms;
  B.mouth.copy(B.head).multiply(trs(_t, X.mx * r, cy - 0.42 * r, 0.9 * r, 0, 0, 0, 'XYZ', ms[0], Math.min(2.4, ms[1] + mouth), 1));
  for (const [sx, eb, bb] of [[1, 'eyeL', 'browL'], [-1, 'eyeR', 'browR']]) {
    B[eb].copy(B.head).multiply(trs(_t, sx * 0.34 * r + (X.look ?? 0) * r, cy + 0.06 * r, 0.9 * r, 0, 0, 0, 'XYZ', 1, X.eye * blink, 1));
    const lift = (X.by + (sx > 0 ? X.bLift ?? 0 : 0)) * r;
    B[bb].copy(B.head).multiply(trs(_t, sx * 0.33 * r, cy + 0.3 * r + lift, 0.94 * r, -0.3, 0, sx * X.bt));
  }
  B.armL.copy(B.hips).multiply(trs(_t, k.shX, k.shY, 0, raiseL, yawL, spreadL, 'YZX'));
  B.armR.copy(B.hips).multiply(trs(_t, -k.shX, k.shY, 0, raiseR, yawR, -spreadR, 'YZX'));
  B.handL.copy(B.armL).multiply(trs(_t, 0, -k.armLen, 0, -raiseL - tipL));
  B.handR.copy(B.armR).multiply(trs(_t, 0, -k.armLen, 0, -raiseR - tipR));
  const lh = 0.36 * k.h;
  for (const [sx, lb, sb, th, kn] of [[1, 'legL', 'shinL', thighL, kneeL], [-1, 'legR', 'shinR', thighR, kneeR]]) {
    B[lb].copy(B.hips).multiply(trs(_t, sx * k.legX, -0.03 - (hipY - k.hipY) * 0, 0, th - leanX));
    B[sb].copy(B[lb]).multiply(trs(_t, 0, -lh, 0, kn));
  }
  // mètre ruban : du pied de Delphine vers l'avant, longueur rig.tapeLen
  trs(B.tape, 0.1, 0.02, 0.2, 0, 0, 0, 'XYZ', 1, 1, rig.tapeLen);
}

// ---------- Animaux ----------
export function dachshund() {
  const parts = [];
  const add = (geo, bone, pos, scale, color, rot, glow) => parts.push(part(geo, bone, pos, scale, color, rot, glow));
  const fur = 0x8a4b26, dark = 0x5a2e16;
  add('sphere', 'body', [0, 0, 0], [0.11, 0.1, 0.27], fur);
  add('sphere', 'body', [0, 0.01, 0.16], [0.115, 0.11, 0.12], fur);
  add('torus', 'body', [0, 0.05, 0.25], [0.075, 0.075, 0.075], 0xd23c3c);
  for (const [b, x, z] of [['fl', 0.065, 0.17], ['fr', -0.065, 0.17], ['bl', 0.065, -0.17], ['br', -0.065, -0.17]]) {
    parts.push(part('limb', b, [0, 0, 0], [0.06, 0.13, 0.06], dark));
    parts.push(part('ball', b, [0, -0.14, 0.02], [0.04, 0.025, 0.05], dark));
    void x; void z;
  }
  add('sphere', 'head', [0, 0.04, 0.02], 0.1, fur);
  add('sphere', 'head', [0, 0.0, 0.12], [0.055, 0.045, 0.09], fur);
  add('sphere', 'jaw', [0, 0, 0.06], [0.045, 0.02, 0.07], dark);
  add('ball', 'head', [0, 0.025, 0.205], 0.025, 0x1a1412);
  for (const sx of [-1, 1]) {
    add('sphere', 'head', [sx * 0.085, -0.01, 0.0], [0.028, 0.085, 0.055], dark, [0, 0, sx * 0.25]);
    add('ball', 'head', [sx * 0.045, 0.075, 0.085], 0.018, 0x1a1412);
  }
  add('limb', 'tail', [0, 0, 0], [0.035, 0.15, 0.035], fur);
  const proxy = makeRig(parts, { bones: ['root', 'body', 'head', 'jaw', 'tail', 'fl', 'fr', 'bl', 'br'], animate: animDog, radius: 0.5, data: { anim: 'idle' } });
  proxy.userData.kind = 'dog';
  return proxy;
}
function animDog(rig, t, dt, proxy) {
  const B = rig.bones, st = rig.st, ph = rig.still ? 0.5 : t + rig.seed * 20;
  const e = proxy.matrixWorld.elements;
  const sp = st.px === undefined ? 0 : Math.hypot(e[12] - st.px, e[14] - st.pz) / Math.max(dt, 1e-3);
  st.px = e[12]; st.pz = e[14];
  st.walk = lerp(st.walk ?? 0, sp > 0.2 ? 1 : 0, Math.min(1, dt * 8));
  st.wp = (st.wp ?? 0) + dt * 16 * st.walk;
  const bark = rig.anim === 'bark' ? 1 : 0;
  const barkPulse = bark * Math.max(0, Math.sin(ph * 9));
  const sniff = (1 - bark) * (1 - st.walk) * smooth((Math.sin(ph * 0.6) - 0.3) / 0.4);
  const bob = Math.abs(Math.sin(ph * 3)) * 0.006 + Math.abs(Math.sin(st.wp)) * 0.02 * st.walk + barkPulse * 0.03;
  trs(B.body, 0, 0.2 + bob, 0, -barkPulse * 0.15);
  B.head.copy(B.body).multiply(trs(_t, 0, 0.07, 0.27, 0.15 + sniff * 0.6 + Math.sin(ph * 12) * 0.04 * sniff - bark * 0.45, Math.sin(ph * 0.8) * 0.5 * (1 - sniff) * (1 - bark), 0, 'YXZ'));
  B.jaw.copy(B.head).multiply(trs(_t, 0, -0.035, 0.08, barkPulse * 0.6));
  B.tail.copy(B.body).multiply(trs(_t, 0, 0.04, -0.26, 2.3, Math.sin(ph * (14 + bark * 10)) * 0.6, 0, 'YXZ'));
  const sw = Math.sin(st.wp) * 0.6 * st.walk;
  trs(B.fl, 0.065, 0.16 + bob, 0.17, sw); trs(B.br, -0.065, 0.16 + bob, -0.17, sw);
  trs(B.fr, -0.065, 0.16 + bob, 0.17, -sw); trs(B.bl, 0.065, 0.16 + bob, -0.17, -sw);
}

export function cat(color = 0xe39548) {
  const parts = [];
  const add = (geo, bone, pos, scale, c, rot, glow, keep) => parts.push(part(geo, bone, pos, scale, c, rot, glow, keep));
  add('sphere', 'body', [0, 0.13, -0.02], [0.12, 0.15, 0.13], color);
  add('sphere', 'body', [0, 0.12, 0.07], [0.07, 0.1, 0.06], 0xfff4e6);
  add('sphere', 'body', [0.07, 0.05, -0.04], [0.06, 0.06, 0.1], color);
  add('sphere', 'body', [-0.07, 0.05, -0.04], [0.06, 0.06, 0.1], color);
  for (const sx of [-1, 1]) add('ball', 'body', [sx * 0.04, 0.02, 0.09], [0.03, 0.025, 0.04], 0xfff4e6);
  add('sphere', 'head', [0, 0, 0], [0.105, 0.095, 0.095], color, null, false, true);
  for (const sx of [-1, 1]) {
    add('cone', 'head', [sx * 0.06, 0.09, -0.01], [0.055, 0.075, 0.04], color, [0, 0, -sx * 0.25], false, true);
    add('ball', 'head', [sx * 0.04, 0.015, 0.085], [0.021, 0.028, 0.012], 0xd8f06a, null, true, true);
    add('ball', 'head', [sx * 0.04, 0.015, 0.093], [0.006, 0.022, 0.006], 0x111111);
  }
  add('ball', 'head', [0, -0.015, 0.095], [0.014, 0.01, 0.01], 0xf08ca0);
  add('limb', 'tail', [0, 0, 0], [0.04, 0.24, 0.04], color);
  const proxy = makeRig(parts, { bones: ['root', 'body', 'head', 'tail'], animate: animCat, radius: 0.4 });
  proxy.userData.kind = 'cat';
  return proxy;
}
function animCat(rig, t) {
  const B = rig.bones, ph = rig.still ? 0.5 : t + rig.seed * 20;
  const br = Math.sin(ph * 1.5) * 0.02;
  trs(B.body, 0, 0, 0, 0, 0, 0, 'XYZ', 1 + br, 1 + br, 1 + br);
  trs(B.head, 0, 0.31 + br * 0.1, 0.03, Math.sin(ph * 0.5) * 0.1, rig.still ? 0 : Math.sin(ph * 0.27) * 0.7, Math.sin(ph * 0.9) * 0.12, 'YXZ');
  trs(B.tail, 0, 0.05, -0.13, 1.9, 0, Math.sin(ph * 1.3) * 0.5, 'XZY');
}

// Vélo de la police municipale (samedi : pas de voitures). À ajouter comme enfant du policier (pose 'ride').
export function bike(color = 0x1d2f5c) {
  const parts = [];
  const add = (geo, bone, pos, scale, c, rot) => parts.push(part(geo, bone, pos, scale, c, rot));
  for (const [b, z] of [['wf', 0.5], ['wb', -0.5]]) {
    add('torus', b, [0, 0, 0], [0.32, 0.32, 0.5], 0x1a1a1a, [0, Math.PI / 2, 0]);
    add('cyl', b, [0, 0, 0], [0.05, 0.1, 0.05], 0xbfc4ca, [0, 0, Math.PI / 2]);
    void z;
  }
  add('cyl', 'root', [0, 0.55, 0], [0.04, 0.9, 0.04], color, [Math.PI / 2 - 0.15, 0, 0]);
  add('cyl', 'root', [0, 0.62, -0.25], [0.035, 0.45, 0.035], color, [0.3, 0, 0]);
  add('cyl', 'root', [0, 0.62, 0.4], [0.035, 0.5, 0.035], color, [-0.25, 0, 0]);
  add('box', 'root', [0, 0.88, -0.22], [0.12, 0.04, 0.22], 0x111111);
  add('cyl', 'root', [0, 0.95, 0.45], [0.03, 0.5, 0.03], 0x2a2a2a, [0, 0, Math.PI / 2]);
  add('box', 'root', [0, 0.45, -0.62], [0.28, 0.2, 0.22], 0xf2f2f2); // sacoche « POLICE »
  add('ball', 'root', [0, 0.8, 0.62], 0.05, 0xfff2c0, null);
  const proxy = makeRig(parts, { bones: ['root', 'wf', 'wb'], animate: animBike, radius: 1 });
  proxy.userData.kind = 'bike';
  return proxy;
}
function animBike(rig, t, dt, proxy) {
  const st = rig.st, e = proxy.matrixWorld.elements;
  const sp = st.px === undefined ? 0 : Math.hypot(e[12] - st.px, e[14] - st.pz) / Math.max(dt, 1e-3);
  st.px = e[12]; st.pz = e[14];
  st.a = (st.a ?? 0) + (dt * Math.min(sp, 8)) / 0.32;
  trs(rig.bones.wf, 0, 0.32, 0.5, st.a); trs(rig.bones.wb, 0, 0.32, -0.5, st.a);
}

// Clode Kode : l'assistant de code, un petit terminal à visage (portrait et vignette Koddex)
export function clodeBot() {
  const parts = [];
  const add = (geo, bone, pos, scale, c, rot, glow) => parts.push(part(geo, bone, pos, scale, c, rot, glow, true));
  add('box', 'head', [0, 0.3, 0], [0.62, 0.46, 0.12], 0x2a2d36);
  add('box', 'head', [0, 0.3, 0.062], [0.54, 0.38, 0.01], 0x24597a, null, true);
  for (const sx of [-1, 1]) add('box', 'eyeL', [sx * 0.12, 0, 0], [0.08, 0.13, 0.01], 0x9fefff, null, true);
  add('box', 'mouth', [0, 0, 0], [0.16, 0.035, 0.01], 0x9fefff, null, true);
  add('cyl', 'root', [0, 0.04, 0], [0.12, 0.08, 0.12], 0x3a3d48);
  add('cyl', 'root', [0, -0.05, 0], [0.3, 0.03, 0.2], 0x3a3d48);
  const proxy = makeRig(parts, { bones: ['root', 'head', 'eyeL', 'mouth'], animate: (rig, t) => {
    const ph = rig.still ? 0 : t;
    const X = { neutral: [1, 1], happy: [0.4, 2.5], angry: [0.6, 1.2], suspicious: [0.35, 0.8], surprised: [1.4, 1.5], sad: [0.7, 0.8], sick: [0.6, 1] }[rig.expr] ?? [1, 1];
    trs(rig.bones.head, 0, Math.sin(ph * 1.5) * 0.01, 0);
    rig.bones.eyeL.copy(rig.bones.head).multiply(trs(_t, 0, 0.33, 0.069, 0, 0, 0, 'XYZ', 1, X[0] * ((ph * 0.8) % 3.5 < 0.1 ? 0.1 : 1), 1));
    rig.bones.mouth.copy(rig.bones.head).multiply(trs(_t, 0, 0.2, 0.069, 0, 0, 0, 'XYZ', 1, X[1] + Math.abs(Math.sin(ph * 9)) * (rig.talk ?? 0), 1));
  }, radius: 0.5, data: { expr: 'neutral', talk: 0 } });
  proxy.userData.kind = 'bot';
  return proxy;
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

// ---------- Le casting (ids = src/content/characters.js) ----------
const police = (o = {}) => humanoid({ hair: 'short', hairColor: pick(HAIR), shirt: 0x1d2f5c, pants: 0x18233f, shoes: 0x111111, cap: 0x1a2648, height: 1.05, talk: 0.2,
  ...o,
  extras: (add, k, addW) => {
    add('box', 'body', [0, 0.1, 0], [0.48 * k.g, 0.06, 0.38 * k.g], 0x111111); // ceinturon
    add('box', 'body', [0, k.th * 0.55, 0.0], [0.47 * k.g, 0.05, 0.37 * k.g], 0x8fb3e8); // bande bleu clair
    add('box', 'body', [0.1, k.th * 0.65, 0.17 * k.g], [0.06, 0.07, 0.01], 0xe8c45a, null, true); // écusson
    add('box', 'body', [0, k.th * 0.45, -0.18 * k.g], [0.3, 0.06, 0.01], 0xf2f2f2); // « POLICE MUNICIPALE » au dos
    add('box', 'body', [0.15, k.th * 0.8, 0.14 * k.g], [0.06, 0.1, 0.04], 0x111111); // radio d'épaule
    o.extras?.(add, k, addW);
  } });
export const CAST = {
  pilou: (o = {}) => humanoid({ hair: 'spiky', hairColor: 0x5a3b26, shirt: 0x7d8790, pants: 0x2f3542, glasses: 0x222222, skin: 0xf6d2b4, ...o,
    extras: (add, k) => add('hemi', 'body', [0, k.th * 0.86, -0.12], [0.2, 0.12, 0.16], 0x6c757d, [-1.9, 0, 0]) }), // capuche
  jeremie: (o = {}) => humanoid({ skin: 0xeebf98, hair: 'short', hairColor: 0x3b2a20, shirt: 0xc9a46a, pants: 0x3d4a63, glasses: 0x3a2a1a, height: 1.05, anim: 'leash', ...o,
    extras: (add, k, addW) => addW('leash', 'box', 'handL', [0, -0.02, 0.35], [0.01, 0.01, 0.7], 0xd23c3c, [0.6, 0, 0]) }),
  biloute: () => dachshund(),
  klaas: (pose = 'lean') => humanoid({ pose, height: 1.12, girth: 1.18, headR: 0.29, skin: 0xf3cdb0, hair: 'bald', hairColor: 0xf7f5f0,
    beard: 0xf7f5f0, mustache: 0xf7f5f0, glasses: 0xc9a227, shirt: 0xc0392b, pants: 0x4a3f35, anim: 'write', held: 'notebook', talk: 0.2,
    extras: (add, k, addW) => {
      for (let i = 0; i < 3; i++) add('ball', 'body', [0, k.th * (0.35 + i * 0.18), k.g * 0.17], 0.025, 0xf7f5f0);
      addW('write', 'limb', 'handR', [0, 0.08, 0.04], [0.015, 0.12, 0.015], 0x222222, [0.6, 0, 0]);
      addW('write', 'box', 'handL', [0, 0.03, 0.05], [0.14, 0.02, 0.18], 0x2b4d7a);
    } }),
  hilde: (pose = 'lean') => humanoid({ pose, hair: 'bob', hairColor: 0xe6e6e6, shirt: 0xb39ddb, pants: 0x55617a, skin: 0xf6d2b4, held: 'mug', mugColor: 0xf3b3c8, talk: 0.5, height: 0.95, glasses: 0x8a6a9a }),
  tatie: (pose = 'lean') => humanoid({ skin: 0xfbe0c8, pose, hair: 'curly', hairColor: 0xa26cc4, shirt: 0xe85d9b, pants: 0x3d4a63, glasses: 0xd4af37, held: 'phone', talk: 0.9, height: 0.92, girth: 1.12 }),
  seb: (pose = 'stand') => humanoid({ skin: 0xd9a072, pose, hair: 'short', hairColor: 0x2d2018, beard: 0x3b2a20, beardSize: 0.55, shirt: 0x2a9d8f, pants: 0xe8e2d0, held: 'wine', height: 1.1, talk: 1 }),
  nico: (pose = 'stand') => humanoid({ skin: 0xfbe0c8, pose, hair: 'quiff', hairColor: 0xe0c070, shirt: 0xf2a7b8, pants: 0x3d4a63, held: 'wine', wine: 0xf0d080, talk: 1 }),
  gaufre: () => cat(),
  hippolyte: (o = {}) => humanoid({ skin: 0xf3cdb0, hair: 'side', hairColor: 0xd8d8d8, mustache: 0xd8d8d8, shirt: 0x6b5e3a, pants: 0x4a4436, height: 1.08, anim: 'cane', talk: 0.3, ...o,
    extras: (add, k, addW) => {
      add('sphere', 'body', [0, k.th * 0.86, 0.1], [0.08, 0.06, 0.06], 0x8e1b3a); // lavallière
      add('torso', 'body', [0, k.th * 0.25, 0.02], [0.47, k.th * 0.55, 0.37], 0x8c7a4a); // gilet
      addW('cane', 'cyl', 'handL', [0, -0.32, 0.02], [0.03, 0.7, 0.03], 0x2a1a10);
      addW('cane', 'ball', 'handL', [0, 0.02, 0.02], 0.035, 0xd4af37);
    } }),
  regis: (o = {}) => humanoid({ skin: 0xeebf98, hair: 'quiff', hairColor: 0x8a5a2b, shirt: 0xf0e6d0, pants: 0x55617a, height: 1.02, girth: 1.08, held: 'phone', talk: 0.7, ...o,
    extras: (add, k) => {
      for (const sx of [-1, 1]) add('ball', 'head', [sx * 0.1, 0.92 * k.r + 0.2, 0.1], [0.07, 0.035, 0.05], 0x1a1a1a); // lunettes de soleil sur la tête
      add('torus', 'body', [0, k.th * 0.85, 0.02], [0.13, 0.13, 0.2], 0x7fb3d5, [Math.PI / 2, 0, 0]); // pull sur les épaules
    } }),
  dede: (o = {}) => humanoid({ skin: 0xd9a072, hair: 'bald', hairColor: 0x3b2a20, mustache: 0x3b2a20, shirt: 0x24305e, pants: 0x2f3542, height: 0.84, girth: 1.55, headR: 0.29, talk: 0.9, ...o,
    extras: (add, k) => add('box', 'body', [0, k.th * 0.28, k.g * 0.19], [0.36, k.th * 0.5, 0.02], 0xf3efe6, [-0.12, 0, 0]) }), // tablier court
  ghislain: (o = {}) => humanoid({ skin: 0xf6d2b4, hair: 'manbun', hairColor: 0x2b1d14, shirt: 0x1d1d22, pants: 0x1d1d22, height: 1.22, girth: 0.72, headR: 0.24, held: 'cig', talk: 0.15, ...o }),
  serveur: (o = {}) => humanoid({ skin: 0xeebf98, hair: 'quiff', hairColor: 0x3b2a20, shirt: 0x1f1f24, pants: 0x1f1f24, height: 1.02, anim: 'tray', talk: 0.4, ...o,
    extras: (add, k, addW) => {
      add('box', 'body', [0, -0.08, 0.17], [0.34, 0.52, 0.02], 0xf6f2ea); // grand tablier blanc
      addW('tray', 'cyl', 'handL', [0, 0.02, 0], [0.4, 0.02, 0.4], 0xc0c4ca); // plateau
      addW('tray', 'cyl', 'handL', [0.07, 0.09, 0.04], [0.07, 0.12, 0.07], 0xf0a830);
      addW('tray', 'cyl', 'handL', [-0.07, 0.09, -0.03], [0.07, 0.12, 0.07], 0xf0a830);
    } }),
  // Le remplaçant de Théo (après son renvoi) : même tablier et même plateau, autre tête (roux, lunettes, queue de cheval)
  nouveau: (o = {}) => CAST.serveur({ skin: 0xfbe0c8, hair: 'ponytail', hairColor: 0xb5562a, glasses: 0x2a2a2a, height: 1.08, girth: 0.92, talk: 0.25, ...o }),
  // Police municipale : Lemaire (rond, moustache, bonhomme), Benali (jeune, carnet), le chef (galons dorés)
  lemaire: (o = {}) => police({ skin: 0xf3cdb0, hair: 'short', hairColor: 0x6b5b4b, mustache: 0x5a4a3a, height: 0.98, girth: 1.35, headR: 0.28, talk: 0.6, ...o }),
  benali: (o = {}) => police({ hair: 'short', hairColor: 0x1f1a17, skin: 0xc98e5f, height: 1.12, girth: 0.9, headR: 0.25, held: 'notebook', ...o }),
  chef: (o = {}) => police({ skin: 0xfbe0c8, hair: 'side', hairColor: 0xb0b0b0, height: 1.1, girth: 1.1, capBand: 0xe8c45a, glasses: 0x333333, ...o }),
  police: (o = {}) => police(o),
  delphine: (o = {}) => humanoid({ skin: 0xf6d2b4, hair: 'bob', hairColor: 0x2d2420, shirt: 0x2f3e5c, skirt: 0x2f3542, height: 1.05, girth: 0.92, glasses: 0x111111, anim: 'clipboard', held: 'clipboard', talk: 0.4, ...o,
    extras: (add, k) => add('box', 'body', [0, k.th * 0.6, 0.18], [0.05, 0.08, 0.01], 0xffffff) }), // badge
  colette: (o = {}) => humanoid({ skin: 0xf3cdb0, hair: 'bob', hairColor: 0xe8d39a, shirt: 0xb0283a, skirt: 0x2a2a35, height: 0.98, girth: 1.08, talk: 0.8, ...o,
    extras: (add, k) => { for (let i = 0; i < 9; i++) { const a = -0.9 + i * 0.225; add('ball', 'body', [Math.sin(a) * 0.15, k.th * 0.92 - Math.cos(a) * 0.06, 0.13 + Math.cos(a) * 0.03], 0.022, 0xf8f4ea); } } }), // collier de perles
  lescaut: (o = {}) => humanoid({ skin: 0xeebf98, hair: 'side', hairColor: 0x4a3f35, shirt: 0x2b3550, pants: 0x2b3550, glasses: 0x333333, height: 1.1, talk: 0.5, ...o,
    extras: (add, k) => { add('box', 'body', [0, k.th * 0.6, 0.17], [0.06, k.th * 0.55, 0.02], 0x9a2a3a); add('box', 'body', [0, k.th * 0.7, 0.165], [0.14, k.th * 0.4, 0.015], 0xf2f2f2); } }), // cravate
  journaliste: (o = {}) => humanoid({ skin: 0xfbe0c8, hair: 'ponytail', hairColor: 0xa0522d, shirt: 0xc9b48a, pants: 0x3d4a63, height: 1.0, held: 'notebook', talk: 0.8, ...o,
    extras: (add, k) => add('torus', 'body', [0, k.th * 0.9, 0.02], [0.14, 0.14, 0.25], 0x2a9d8f, [Math.PI / 2, 0, 0]) }), // écharpe
  avocat: (o = {}) => humanoid({ skin: 0xd9a072, hair: 'side', hairColor: 0x2d2420, shirt: 0x15151a, pants: 0x15151a, glasses: 0x222222, height: 1.08, talk: 0.5, ...o,
    extras: (add, k) => { add('box', 'body', [0, k.th * 0.78, 0.17], [0.12, 0.12, 0.015], 0xffffff); add('skirt', 'body', [0, -0.2, 0], [0.62, 0.5, 0.5], 0x15151a); } }), // robe et rabat
  stephane: (o = {}) => humanoid({ skin: 0xf6d2b4, hair: 'quiff', hairColor: 0xd9b26a, shirt: 0x3a3f4a, pants: 0x3d4a63, shoes: 0xf2f2f2, height: 1.06, held: 'phone', talk: 1, ...o,
    extras: (add, k) => { add('torso', 'body', [0, k.th * 0.2, 0.01], [0.48, k.th * 0.62, 0.38], 0x5a7a9a); for (const sx of [-1, 1]) add('ball', 'head', [sx * 0.98 * k.r, 0.85 * k.r, 0.1 * k.r], 0.05, 0xffffff); } }), // doudoune sans manches, écouteurs
  clode: () => clodeBot(),
};
// Anciens noms (v0.3) → ids de contenu
CAST.waiter = CAST.serveur;
CAST.dog = CAST.biloute;
CAST.cat = CAST.gaufre;
export const CAST_IDS = ['pilou', 'jeremie', 'biloute', 'klaas', 'hilde', 'tatie', 'seb', 'nico', 'gaufre', 'hippolyte', 'regis', 'dede', 'ghislain', 'serveur', 'nouveau', 'lemaire', 'benali', 'chef', 'delphine', 'colette', 'lescaut', 'journaliste', 'avocat', 'stephane', 'clode'];

// Ancienne API : person(color) = un passant debout. La couleur de l'uniforme de police donne un agent.
export function person(color) {
  if (color === 0x1b2847) return CAST.police();
  return humanoid({ shirt: color, hair: pick(['short', 'bob', 'long', 'spiky']), talk: 0.3 });
}
