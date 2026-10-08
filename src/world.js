// La rue des Bouchers, version "cute low-poly" (art v0.3).
// Géographie (GAME_DESIGN §1b) : extrémité A (z = -HALF) = rue de la Barre, extrémité B (z = +HALF) = place
// Maurice-Schumann. L'immeuble de Pilou suit la position de Bernadette dans config.js (Pilou au 2e étage).
// Les personnages et le mobilier sont instanciés (art/rig.js) ; le décor statique est fusionné par matériau.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RESTAURANTS, RULES, STREET } from './config.js';
import { attachRigs, onFrame } from './art/rig.js';
import { CAST, customer, dachshund, cat, person as artPerson } from './art/characters.js';
import { chair, bistroTable, barrelTable } from './art/props.js';
import { makeKit, house, GROUND, FLOOR, winY } from './art/buildings.js';
import { cobbleTex, slabTex, seeded, puffTex } from './art/textures.js';
import { audio } from './audio/index.js';
import { attachArt } from './art/index.js';

const W = STREET.halfWidth;
const HALF = STREET.length / 2;
const SQUARE = { z0: HALF, z1: HALF + 22, x: 12 }; // place Maurice-Schumann

export { CAST };
// Ancienne API conservée : person(color) renvoie un personnage instancié (uniforme bleu = policier municipal).
export const person = artPerson;
const matCache = new Map();
export function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshStandardMaterial({ color, ...opts }));
  return matCache.get(key);
}

// Habillage des terrasses par resto (les autres prennent la couleur de config.js)
const REST_STYLE = {
  bernadette: { chair: 0xc49152, top: 0x8a5a35, cloth: 0xc4473d, parasol: 0xa83232, awning: ['#a83232', '#f3e6cc'], proj: 0.32, tilt: 1.15 },
  goulot: { chair: 0x3a5a8c, top: 0xe8e4dc, awning: ['#2b4a8a', '#f3eee0'], proj: 0.75, tilt: 0.75 },
  malunes: { chair: 0x4c8a55, top: 0x5b3a1e, awning: ['#2b6a3a', '#efe6cc'], proj: 0.6, tilt: 0.85 },
};
const styleOf = (r) => REST_STYLE[r.id] ?? { chair: r.color, top: 0x6b4a2b, awning: ['#' + new THREE.Color(r.color).getHexString(), '#f3eee0'], proj: 0.7, tilt: 0.8 };

const HIT_GEO = new THREE.CylinderGeometry(1.2, 1.2, 1.6, 8);
const HIT_MAT = new THREE.MeshBasicMaterial({ visible: false });

function buildTable(rest, x, z, idx, scene, fixedCount) {
  const st = styleOf(rest);
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  const top = bistroTable({ top: st.top, cloth: st.cloth, parasol: st.parasol });
  group.add(top);
  const chairs = [];

  // Nombre de convives : parfois au-dessus de la limite
  const over = Math.random() < RULES.overLimitChance;
  const count = fixedCount ?? (over ? RULES.maxPeoplePerTable + 1 + Math.floor(Math.random() * 3) : 2 + Math.floor(Math.random() * (RULES.maxPeoplePerTable - 1)));
  const people = [];
  const R = count > 6 ? 0.95 : 0.88;
  const a0 = Math.random() * Math.PI;
  for (let i = 0; i < count; i++) {
    const a = a0 + (i / count) * Math.PI * 2;
    // Le "siège" oriente chaise et client vers la table ; le gameplay peut tourner/cacher le client librement.
    const seat = new THREE.Object3D();
    seat.position.set(Math.cos(a) * R, 0, Math.sin(a) * R);
    seat.rotation.y = Math.atan2(-Math.cos(a), -Math.sin(a));
    const p = customer('sit');
    const ch = chair(st.chair);
    chairs.push(ch);
    seat.add(ch, p);
    group.add(seat);
    people.push(p);
  }
  const hit = new THREE.Mesh(HIT_GEO, HIT_MAT);
  hit.position.y = 0.8;
  group.add(hit);

  scene.add(group);
  const table = { id: `${rest.id}-${idx + 1}`, label: `${rest.name}, table ${idx + 1}`, rest, group, hit, people, chairs, top, count, out: true, clearAt: null, clearedAt: null, clearedBy: null, evidence: new Set() };
  hit.userData.table = table;
  return table;
}

// Samedi : buveurs debout autour d'un tonneau (ou sans tonneau, en grappe)
export function standingCrowd(scene, { x = 0, z = 0, n = 5, barrel = true } = {}) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  if (barrel) group.add(barrelTable());
  const people = [];
  const a0 = Math.random() * Math.PI;
  for (let i = 0; i < n; i++) {
    const a = a0 + (i / n) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
    const r = (barrel ? 0.72 : 0.55) + Math.random() * 0.15;
    const p = customer('stand');
    p.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
    p.rotation.y = Math.atan2(-Math.cos(a), -Math.sin(a));
    group.add(p);
    people.push(p);
  }
  scene.add(group);
  return { group, people };
}

// Façades "tournées" (place, rue de la Barre) : un kit dont la façade est le plan local x = 0, face vers +x local.
function rotatedKit(parent, rng, x, z, faceDir) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = Math.atan2(-faceDir.z, faceDir.x);
  parent.add(g);
  const kit = makeKit(g, 0, rng);
  return { g, kit, house: (z0, z1, o = {}) => house(kit, -1, z0, z1, { W: 0, rng, ...o }) };
}

// opts.tables : disposition des terrasses tirée par la simulation (src/sim/layout.js) : { id, restId, x, z, count }
// opts.role = 'day' : une seconde copie de la rue pour la phase de jour (art.day) — sans audio ni art global,
// rendue par son propre renderer ; world.onFrame accroche des animations à cette scène seulement.
export function buildWorld(scene, opts = {}) {
  const dayRole = opts.role === 'day';
  const rigHooks = attachRigs(scene, { main: !dayRole });
  const rng = seeded(1729); // la rue date de 1729
  const city = new THREE.Group();
  scene.add(city);
  const kit = makeKit(city, W, rng);
  const { mats } = kit;

  // ---------- Sol : pavés + caniveau central en pierre bleue ----------
  const cobble = new THREE.MeshStandardMaterial({ map: cobbleTex(), roughness: 0.95 });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(W * 2, STREET.length), cobble);
  ground.rotation.x = -Math.PI / 2;
  ground.userData.keepUV = true;
  city.add(ground);
  const gutter = new THREE.Mesh(new THREE.PlaneGeometry(0.5, STREET.length), new THREE.MeshStandardMaterial({ map: slabTex(), roughness: 0.8 }));
  gutter.rotation.x = -Math.PI / 2; gutter.position.y = 0.006; gutter.userData.keepUV = true;
  city.add(gutter);
  const groundMaterials = [cobble, gutter.material]; // la pluie les rend sombres et brillants (art/weather.js)
  const plaza = (x0, x1, z0, z1) => {
    const t = cobbleTex(); t.repeat.set((x1 - x0) / 3.2, (z1 - z0) / 3.4);
    const pm = new THREE.MeshStandardMaterial({ map: t, roughness: 0.95 });
    groundMaterials.push(pm);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), pm);
    m.rotation.x = -Math.PI / 2; m.position.set((x0 + x1) / 2, -0.002, (z0 + z1) / 2); m.userData.keepUV = true;
    city.add(m);
  };
  plaza(-SQUARE.x - 6, SQUARE.x + 6, SQUARE.z0 - 0.01, SQUARE.z1 + 1); // place Maurice-Schumann
  plaza(SQUARE.x, SQUARE.x + 16, SQUARE.z0 + 7, SQUARE.z0 + 12); // petite rue d'Hippolyte
  plaza(-30, 30, -HALF - 8, -HALF + 0.01); // rue de la Barre

  // ---------- Implantation : lots (immeubles) et rez-de-chaussée ----------
  const bern = RESTAURANTS.find((r) => r.id === 'bernadette') ?? { z0: -6, z1: 6 };
  const bz = (bern.z0 + bern.z1) / 2; // aplomb de la fenêtre de Pilou
  const P0 = bz - 6, P1 = bz + 8; // immeuble de Pilou (et de Jérémie)
  const SN0 = bz - 4.5, SN1 = bz + 5.5; // en face : Seb & Nico
  const covers = { [-1]: [], [1]: [] }; // rez-de-chaussée déjà occupés
  for (const r of RESTAURANTS) covers[r.side].push([r.z0, r.z1]);
  covers[-1].push([bz + 4.9, P1]); // porte de l'immeuble de Pilou
  const free = (side, a, b) => a > -HALF + 0.5 && b < HALF - 0.5 && covers[side].every(([c0, c1]) => b <= c0 - 0.3 || a >= c1 + 0.3);
  // Commerces de décor, placés au plus près de leur numéro (ils glissent si config.js occupe déjà la place)
  const place = (side, center, w) => {
    for (let k = 0; k < 200; k++) {
      const c = center + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 0.5;
      if (free(side, c - w / 2, c + w / 2)) { covers[side].push([c - w / 2, c + w / 2]); return [c - w / 2, c + w / 2]; }
    }
    return null;
  };
  const decor = { // ordre des numéros : Mug (3) et La Bombance (4) côté rue de la Barre, Bloemkool (22), L'Endroit (34 bis) vers la place
    mug: { side: 1, at: place(1, -20, 4.6), color: 0xd9a441, sign: 'Mug', lit: true },
    bombance: { side: -1, at: place(-1, -12.5, 7), color: 0x6e3b3b, sign: 'La Bombance', closed: true },
    bloemkool: { side: -1, at: place(-1, 29, 6), color: 0x5f7f5a, sign: 'Bloemkool', lit: true },
    endroit: { side: -1, at: place(-1, 38.5, 5.5), color: 0x3c3c48, sign: "L’Endroit", lit: true },
  };

  const lots = { [-1]: [], [1]: [] };
  const fill = (side, a, b) => {
    const n = Math.max(1, Math.round((b - a) / 6.3));
    let z = a;
    for (let i = 0; i < n; i++) {
      const w = i === n - 1 ? b - z : ((b - a) / n) * (0.85 + rng() * 0.3);
      lots[side].push({ z0: z, z1: z + w });
      z += w;
    }
  };
  const fixed = { [-1]: [{ z0: P0, z1: P1, pilou: true }], [1]: [{ z0: SN0, z1: SN1, sebnico: true }] };
  for (const side of [-1, 1]) {
    let cur = -HALF;
    for (const f of fixed[side]) { fill(side, cur, f.z0); lots[side].push(f); cur = f.z1; }
    fill(side, cur, HALF);
  }
  // Tatie Bouchon : au milieu de la rue, côté impair (pas l'immeuble de Seb & Nico)
  const tatieLot = lots[1].filter((l) => !l.sebnico && l.z1 - l.z0 > 3.5).sort((a, b) => Math.abs((a.z0 + a.z1) / 2 - 8) - Math.abs((b.z0 + b.z1) / 2 - 8))[0];
  tatieLot.tatie = true;

  const anchors = {};
  const castSpots = [];

  for (const side of [-1, 1]) {
    for (const lot of lots[side]) {
      if (lot.pilou) continue;
      const o = { W, rng };
      if (lot.sebnico) {
        o.floors = 3; o.wall = 'orange'; o.top = 'stepped';
        o.bays = kit.bays(lot.z0, lot.z1, 4);
        o.windowOpts = (k, z) => (k === 1 && Math.abs(z - bz) < 2.6 ? { lit: true, h: 2.3, curtains: false } : {});
      }
      if (lot.tatie) { o.floors = 2; o.wall = 'cream'; o.bays = kit.bays(lot.z0, lot.z1); o.skip = (k, z) => k === 0 && z === o.bays[0]; }
      const hs = house(kit, side, lot.z0, lot.z1, o);
      lot.bays = hs.bays;
      if (lot.tatie) {
        // fenêtre ouverte au 1er étage (on refait l'encadrement sans meneaux)
        const z = hs.bays[0];
        kit.windowAt(side, z, winY(0), { lit: true, open: true });
        kit.flowerBox(side, z, winY(0) - 1.0, 1.3);
        castSpots.push(['tatie', side, z, winY(0)]);
        anchors.tatieWindow = new THREE.Vector3(kit.X(side, 0.4), winY(0) + 0.3, z);
      }
      if (lot.sebnico) {
        // balcon du 2e étage, juste en face de la fenêtre de Pilou
        const zb0 = bz - 1.8, zb1 = bz + 2.6;
        const top = kit.balcony(side, zb0, zb1, winY(1) - 0.95);
        anchors.balcony = new THREE.Vector3(kit.X(side, 0.45), top, bz + 0.4);
      }
      // Rez-de-chaussée libre : porte d'entrée, ou vieille boutique fermée
      const gaps = [];
      let a = lot.z0 + 0.2;
      for (const [c0, c1] of [...covers[side]].sort((p, q) => p[0] - q[0])) {
        if (c1 <= a || c0 >= lot.z1 - 0.2) continue;
        if (c0 > a) gaps.push([a, c0]);
        a = Math.max(a, c1);
      }
      if (a < lot.z1 - 0.2) gaps.push([a, lot.z1 - 0.2]);
      for (const [g0, g1] of gaps) {
        const gw = g1 - g0;
        if (gw >= 3.4 && rng() < 0.45) kit.shopfront(side, g0, g1, [0x4a6b7d, 0x7d5a4a, 0x5a6b4a, 0x8a7a5a, 0x6b4a6b][Math.floor(rng() * 5)], {});
        else if (gw >= 1.7) {
          const dz = g0 + Math.min(gw / 2, 1.2);
          kit.door(side, dz, [0x2f4a3a, 0x5a2a2a, 0x2b3a5a, 0x3a2a1a][Math.floor(rng() * 4)]);
          if (gw > 3.4) kit.windowAt(side, (dz + 0.9 + g1) / 2, 1.75, { h: 1.6, w: 0.9 });
        }
      }
    }
  }

  // ---------- Immeuble de Pilou (2e étage) et Jérémie (3e), au-dessus de La Ch'tite Bernadette ----------
  const F = winY(1) - 0.9; // plancher de Pilou
  const PH = GROUND + FLOOR * 3 + 0.4;
  const brickP = mats.walls.red();
  const fx = -(W + 0.15);
  const hz0 = bz - 1, hz1 = bz + 1, hy0 = F, hy1 = F + 1.8; // ouverture de la fenêtre de Pilou
  // Sous la fenêtre de Pilou, l'allège est en retrait (presque au nu intérieur) : depuis la fenêtre on voit les
  // tables juste en dessous, ce qui est la vue principale du jeu (pas de garde-corps : il barrait la vue).
  const ry0 = winY(0) + 1.45; // juste au-dessus de la clé de la fenêtre du 1er étage
  for (const [h, d, y, z] of [
    [ry0, P1 - P0, ry0 / 2, (P0 + P1) / 2],
    [hy0 - ry0, hz0 - P0, (ry0 + hy0) / 2, (P0 + hz0) / 2],
    [hy0 - ry0, P1 - hz1, (ry0 + hy0) / 2, (hz1 + P1) / 2],
    [PH - hy1, P1 - P0, (hy1 + PH) / 2, (P0 + P1) / 2],
    [hy1 - hy0, hz0 - P0, (hy0 + hy1) / 2, (P0 + hz0) / 2],
    [hy1 - hy0, P1 - hz1, (hy0 + hy1) / 2, (hz1 + P1) / 2],
  ]) kit.add(new THREE.BoxGeometry(0.3, h, d), brickP, fx, y, z);
  kit.add(new THREE.BoxGeometry(0.08, hy0 - ry0, hz1 - hz0), brickP, -(W + 0.26), (ry0 + hy0) / 2, bz); // allège en retrait
  kit.fbox(-1, -0.2, hy0 - 0.02, bz, 0.08, 0.04, hz1 - hz0, mats.iron); // seuil en fer, au nu intérieur
  const pBays = [bz - 4.6, bz - 2.4, bz, bz + 2.4, bz + 4.6, bz + 6.8];
  for (let k = 0; k < 3; k++) {
    if (k === 1) { kit.stringCourse(-1, P0, hz0 - 0.2, winY(k) - 1.02); kit.stringCourse(-1, hz1 + 0.2, P1, winY(k) - 1.02); } // pas de bandeau sous la fenêtre de Pilou
    else kit.stringCourse(-1, P0, P1, winY(k) - 1.02);
    for (const z of pBays) {
      if (k === 1 && z === bz) kit.windowAt(-1, z, winY(k), { noPane: true, open: true, noSill: true, w: 2.0, h: 1.8 });
      else kit.windowAt(-1, z, winY(k), k === 2 && z === bz ? { lit: true } : {});
    }
  }
  kit.steppedGable(-1, P0, bz + 1, PH, brickP);
  kit.steppedGable(-1, bz + 1, P1, PH, brickP);
  anchors.pilouWindow = new THREE.Vector3(-(W + 0.3), F + 1.0, bz);
  anchors.jeremieWindow = new THREE.Vector3(-(W - 0.1), winY(2), bz);

  // La Ch'tite Bernadette : devanture rouge, store court et très incliné (Pilou doit voir les tables)
  const bern3 = kit.shopfront(-1, P0, bz + 4.9, 0x8a2b2b, { glass: mats.shopLit, doorAt: 0.1, sign: "Estaminet La Ch’tite Bernadette", signColor: '#5a1414' });
  anchors.bernadetteDoor = new THREE.Vector3(-(W - 0.4), 0, bern3.door);
  const bs = REST_STYLE.bernadette;
  kit.awning(-1, bern3.bays[1] - 1.1, bz + 4.7, { proj: bs.proj, tilt: bs.tilt, y: 2.7, a: bs.awning[0], b: bs.awning[1] });
  kit.sign3D(-1, P0 - 0.2, 3.1, 'Estaminet', '#5a1414', 1.0, 0.42);
  // Porte de l'immeuble + plaque de l'Association
  kit.door(-1, bz + 5.8, 0x1f3b2d, { w: 1.2 });
  kit.fbox(-1, 0.06, 1.5, bz + 6.7, 0.04, 0.25, 0.35, mat(0xc9a227, { metalness: 0.8, roughness: 0.3 }));
  // Climatisation installée sans autorisation (litige en cours avec la mairie)
  kit.fbox(-1, 0.22, 3.93, P0 + 1.0, 0.42, 0.5, 0.8, mat(0xe9e4d6, { roughness: 0.6 }));
  const grill = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.02, 14), mat(0x3a3d42));
  grill.rotation.z = Math.PI / 2; grill.position.set(-(W - 0.44), 3.93, P0 + 1.1); city.add(grill);
  // La hotte : gaine inox qui grimpe le long de la façade jusque sous la fenêtre de Pilou
  const steel = mat(0xb8bcc2, { metalness: 0.9, roughness: 0.35 });
  kit.fbox(-1, 0.25, (2.4 + F - 0.1) / 2, bz + 1.6, 0.45, F - 0.1 - 2.4, 0.45, steel);
  for (let y = 3.2; y < F - 0.3; y += 1.2) kit.fbox(-1, 0.25, y, bz + 1.6, 0.5, 0.06, 0.5, steel);
  kit.fbox(-1, 0.3, F - 0.12, bz + 1.25, 0.5, 0.35, 0.7, steel);
  const exhaust = new THREE.Vector3(-(W - 0.3), F - 0.1, bz + 1.0);
  const steam = makeSteam(exhaust.clone());
  city.add(steam.points);

  // ---------- Appartement de Pilou (pièce visible de l'intérieur) ----------
  const apt = { x0: -9.2, x1: -W - 0.3, z0: bz - 3, z1: bz + 3, floor: F, ceil: F + 2.8 };
  const roomMat = mat(0xe6d6b8, { roughness: 1 });
  const floorMat = mat(0x8a5f3a, { roughness: 0.8 });
  const rw = apt.x1 - apt.x0 + 0.2, rh = apt.ceil - apt.floor, rd = apt.z1 - apt.z0, cx = (apt.x0 + apt.x1) / 2 + 0.1, cy = (apt.floor + apt.ceil) / 2;
  const abox = (w, h, d, x, y, z, m) => kit.add(new THREE.BoxGeometry(w, h, d), m, x, y, z);
  for (const [w, h, d, x, y, z, m] of [
    [rw, 0.1, rd, cx, apt.floor - 0.05, bz, floorMat],
    [rw, 0.1, rd, cx, apt.ceil + 0.05, bz, roomMat],
    [0.1, rh, rd, apt.x0 - 0.05, cy, bz, roomMat],
    [rw, rh, 0.1, cx, cy, apt.z0 - 0.05, roomMat],
    [rw, rh, 0.1, cx, cy, apt.z1 + 0.05, roomMat],
  ]) abox(w, h, d, x, y, z, m);
  const aptLight = new THREE.PointLight(0xffd9a0, 6, 8, 1.5);
  aptLight.position.set(-7, F + 2.3, bz);
  city.add(aptLight);
  const bed = new THREE.Vector3(-8.2, F, bz - 1.6);
  abox(1.6, 0.35, 2.1, bed.x, F + 0.25, bed.z, mat(0x6b4a2b));
  abox(1.5, 0.18, 2.0, bed.x, F + 0.5, bed.z + 0.05, mat(0x5b7fb0)); // couette
  abox(1.3, 0.14, 0.4, bed.x, F + 0.62, bed.z - 0.75, mat(0xffffff));
  abox(2.4, 0.02, 1.6, -6.4, F + 0.01, bz + 0.2, mat(0xc4614f)); // tapis
  // bureau de dev : écran de Clode Kode allumé
  abox(0.7, 0.05, 1.3, -8.7, F + 0.75, bz + 1.0, mat(0x9a6b42));
  for (const dz of [-0.55, 0.55]) abox(0.05, 0.75, 0.05, -8.7, F + 0.37, bz + 1.0 + dz, mat(0x3a3a3a));
  abox(0.04, 0.42, 0.7, -8.95, F + 1.05, bz + 1.0, mat(0x111111, { emissive: 0x7fb0ff, emissiveIntensity: 0.6 }));
  abox(0.05, 0.6, 0.6, apt.x0 + 0.03, F + 1.6, bz - 0.4, mat(0x2b4d7a, { emissive: 0x2b4d7a, emissiveIntensity: 0.2 })); // affiche
  const plant = new THREE.Mesh(new THREE.IcosahedronGeometry(0.32, 0), mats.leaf);
  plant.position.set(-4.0, F + 0.6, bz + 2.5); city.add(plant);
  abox(0.3, 0.3, 0.3, -4.0, F + 0.15, bz + 2.5, mat(0xc4714f));
  const aptDoor = new THREE.Vector3(apt.x0 + 0.6, F, bz + 1.8);
  abox(0.08, 2.1, 1, apt.x0 + 0.05, F + 1.05, bz + 1.8, mat(0x6b4423));

  // ---------- Enseignes et stores des restos de config.js ----------
  for (const r of RESTAURANTS) {
    if (r.id === 'bernadette') continue;
    const st = styleOf(r);
    kit.shopfront(r.side, r.z0, r.z1, r.color, { glass: mats.shopLit, sign: r.name, doorAt: 0.5 });
    kit.awning(r.side, r.z0 + 0.3, r.z1 - 0.3, { proj: st.proj, tilt: st.tilt, y: 2.7, a: st.awning[0], b: st.awning[1] });
  }
  // Commerces de décor
  for (const [id, d] of Object.entries(decor)) {
    if (!d.at) continue;
    const [z0, z1] = d.at;
    const f = kit.shopfront(d.side, z0, z1, d.color, { glass: d.closed ? mats.whitewash : d.lit ? mats.shopLit : mats.shopDim, sign: d.sign, faded: !!d.closed });
    anchors[id] = new THREE.Vector3(kit.X(d.side, 0.5), 0, f.door);
    if (d.closed) {
      kit.panel(d.side, (z0 + z1) / 2 - 1.1, 1.7, [['À LOUER', 64], ['Local commercial · 120 m²', 26], ['06 ·· ·· ·· ··', 26]], 1.3, 0.65);
      kit.panel(d.side, (z0 + z1) / 2 + 1.4, 1.5, [['FERMÉ', 70]], 0.8, 0.35, '#e8dcc0', '#333333');
    }
    if (id === 'mug') kit.awning(d.side, z0 + 0.2, z1 - 0.2, { proj: 0.8, tilt: 0.7, y: 2.7, a: '#d9a441', b: '#3a2a1a' });
  }

  // ---------- Place Maurice-Schumann (extrémité B) ----------
  const sq = SQUARE;
  // côtés de la place (avec les rues qui y débouchent : trous dans les façades)
  const left = rotatedKit(city, rng, -sq.x, 0, new THREE.Vector3(1, 0, 0));
  left.house(sq.z0 + 0.0, sq.z0 + 5.5, { floors: 3 });
  left.house(sq.z0 + 5.5, sq.z0 + 10, { floors: 2 });
  left.house(sq.z0 + 14, sq.z1 + 1, { floors: 3, top: 'cornice' }); // rue de Tenremonde entre les deux
  for (const z of [sq.z0 + 2.7, sq.z0 + 7.6, sq.z0 + 17]) left.kit.door(-1, z, 0x2b3a5a);
  const rightK = rotatedKit(city, rng, sq.x, 0, new THREE.Vector3(-1, 0, 0)); // z local = -z monde
  rightK.house(-(sq.z0 + 7), -sq.z0, { floors: 3 });
  rightK.house(-(sq.z1 + 1), -(sq.z0 + 12), { floors: 3, wall: 'yellow' }); // rue de la Baignerie (Hippolyte) entre les deux
  rightK.kit.door(-1, -(sq.z0 + 3.5), 0x5a2a2a);
  rightK.kit.shopfront(-1, -(sq.z1 - 1), -(sq.z0 + 13), 0x7a4a6b, { glass: mats.shopDim, sign: 'Bouquiniste' });
  // fond de la place : Klaas & Hilde, fenêtre qui regarde toute la rue en enfilade
  const far = rotatedKit(city, rng, 0, sq.z1 + 1, new THREE.Vector3(0, 0, -1)); // z local = x monde
  far.house(-sq.x - 6, -7, { floors: 2, top: 'cornice' });
  const kh = far.house(-7, 7, { floors: 3, wall: 'yellow', top: 'double', split: 0, bays: [-4.8, -2.4, 0, 2.4, 4.8], skip: (k, z) => k === 0 && z === 0 });
  far.house(7, sq.x + 6, { floors: 3 }); // rue Thiers / rue des Poissonceaux s'ouvrent derrière
  far.kit.windowAt(-1, 0, winY(0), { lit: true, open: true, w: 1.9 });
  far.kit.flowerBox(-1, 0, winY(0) - 1.02, 2.1);
  far.kit.door(-1, -2.4, 0x2f4a3a);
  far.kit.shopfront(-1, 1.2, 6.6, 0x2b5a6b, { glass: mats.shopDim, sign: 'Estaminet du Coin' });
  far.kit.lantern(-1, -4, 4.3);
  void kh;
  // angles rue / place
  const cornerR = rotatedKit(city, rng, 0, sq.z0, new THREE.Vector3(0, 0, 1)); // z local = -x monde
  cornerR.house(-sq.x, -(W + 0.01), { floors: 3, top: 'cornice', noBody: false });
  cornerR.house(W + 0.01, sq.x, { floors: 3, top: 'cornice' });
  // rue de la Baignerie, à 90° de la place : l'ancienne carrosserie d'Hippolyte (grande porte cochère)
  const hip = rotatedKit(city, rng, 0, sq.z0 + 12, new THREE.Vector3(0, 0, -1)); // façade nord de la petite rue, z local = x monde
  hip.house(sq.x + 0.2, sq.x + 14, { floors: 2, wall: 'dark', top: 'stepped', skip: (k, z) => k === 0 && Math.abs(z - (sq.x + 5)) < 2 });
  hip.kit.carriageDoor(-1, sq.x + 5, { w: 3.2, h: 3.0 });
  hip.kit.panel(-1, sq.x + 5, 5.3, [['ANCIENNE CARROSSERIE', 40], ['· fondée en 1827 ·', 28]], 3.4, 0.7, '#efe7d8', '#2f4a3a');
  hip.kit.lantern(-1, sq.x + 2.7, 3.6);
  const hipSouth = rotatedKit(city, rng, 0, sq.z0 + 7, new THREE.Vector3(0, 0, 1));
  hipSouth.house(-(sq.x + 14), -(sq.x + 0.2), { floors: 2 });
  anchors.hippolyteDoor = new THREE.Vector3(sq.x + 5, 0, sq.z0 + 11.4);
  const bEnd = rotatedKit(city, rng, sq.x + 16, 0, new THREE.Vector3(-1, 0, 0)); // fond de la rue de la Baignerie (z local = -z monde)
  bEnd.house(-(sq.z0 + 14), -(sq.z0 + 5), { floors: 2, top: 'cornice' });
  // Plaques de rue (émail bleu, lettres blanches)
  const plaque = (k, side, z, lines, w = 1.5) => k.panel(side, z, 3.3, lines, w, 0.42, '#1f3f8a', '#ffffff');
  plaque(hip.kit, -1, sq.x + 1.0, [['RUE DE LA BAIGNERIE', 46]]);
  plaque(rightK.kit, -1, -(sq.z0 + 1.2), [['RUE DE LA BAIGNERIE', 46]]);
  plaque(far.kit, -1, -5.5, [['PLACE MAURICE-SCHUMANN', 40]], 1.7);
  plaque(left.kit, -1, sq.z0 + 1, [['PLACE MAURICE-SCHUMANN', 40]], 1.7);
  plaque(kit, -1, -HALF + 1.2, [['RUE DES BOUCHERS', 48]]);
  plaque(kit, 1, HALF - 1.2, [['RUE DES BOUCHERS', 48]]);

  // mobilier de la place : arbres, banc, réverbère, beffroi au loin (la cloche de 22h)
  const trunkM = mat(0x5a3f2a, { flatShading: true });
  for (const [x, z, s] of [[-6.5, sq.z0 + 9, 1.1], [6.5, sq.z0 + 11, 1], [-2, sq.z1 - 4, 0.8]]) {
    kit.add(new THREE.CylinderGeometry(0.15 * s, 0.2 * s, 2.6 * s, 6), trunkM, x, 1.3 * s, z);
    const c = kit.add(new THREE.IcosahedronGeometry(1.7 * s, 0), mats.leaf, x, 3.3 * s, z);
    c.scale.set(1, 0.9, 1);
    kit.add(new THREE.IcosahedronGeometry(1.1 * s, 0), mats.leaf, x + 0.6, 4.2 * s, z - 0.4);
  }
  kit.add(new THREE.BoxGeometry(1.8, 0.08, 0.5), mats.wood(0x7a5a3a), -6.5, 0.45, sq.z0 + 6.5);
  kit.add(new THREE.BoxGeometry(1.8, 0.45, 0.06), mats.wood(0x7a5a3a), -6.5, 0.7, sq.z0 + 6.25);
  kit.add(new THREE.CylinderGeometry(0.06, 0.08, 3.8, 6), mats.iron, 1.5, 1.9, sq.z0 + 6);
  kit.add(new THREE.SphereGeometry(0.25, 10, 8), mats.glow, 1.5, 3.95, sq.z0 + 6);
  const belfry = new THREE.Group();
  belfry.position.set(-5, 0, sq.z1 + 18);
  city.add(belfry);
  const by = mats.walls.yellow();
  for (const [g, m, y] of [[new THREE.BoxGeometry(5, 26, 5), by, 13], [new THREE.BoxGeometry(5.6, 0.5, 5.6), mats.stone, 26.2], [new THREE.BoxGeometry(4, 5, 4), by, 29]]) {
    const o = new THREE.Mesh(g, m); o.position.y = y; belfry.add(o);
  }
  const spire = new THREE.Mesh(new THREE.ConeGeometry(3.2, 9, 4), mats.slate); spire.rotation.y = Math.PI / 4; spire.position.y = 36; belfry.add(spire);
  const clock = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.1, 20), mats.glow); clock.rotation.x = Math.PI / 2; clock.position.set(0, 22, -2.55); belfry.add(clock);

  // ---------- Rue de la Barre (extrémité A) ----------
  const barre = rotatedKit(city, rng, 0, -HALF - 8, new THREE.Vector3(0, 0, 1));
  for (const [a, b] of [[-30, -18], [-18, -11], [-11, -4], [-4, 4], [4, 11], [11, 19], [19, 30]]) {
    barre.house(a, b, {});
    barre.kit.door(-1, (a + b) / 2, [0x2f4a3a, 0x5a2a2a, 0x2b3a5a][Math.floor(rng() * 3)]);
  }
  plaque(barre.kit, -1, 7, [['RUE DE LA BARRE', 50]]);

  // ---------- Lanternes : 4 vraies lumières (terrasses + place), le reste en émissif ----------
  const lamps = [];
  for (let z = -HALF + 5, i = 0; z < HALF - 2; z += 9.5, i++) lamps.push(kit.lantern(i % 2 ? 1 : -1, z, 4.3));
  const lit = [];
  const streetLights = []; // les qualités basses n'en gardent que deux (art/quality.js)
  for (const r of RESTAURANTS.slice(0, 3)) {
    const c = (r.z0 + r.z1) / 2;
    lit.push(new THREE.Vector3(r.side * (W - 1.0), 3.3, c + (r.id === 'bernadette' ? -2.5 : 0)));
  }
  lit.push(new THREE.Vector3(1.5, 3.8, sq.z0 + 6));
  for (const p of lit) {
    const pl = new THREE.PointLight(0xffb866, 12, 15, 1.6);
    streetLights.push(pl);
    pl.position.copy(p);
    city.add(pl);
  }
  void lamps;
  // Clair de lune froid, sans ombres (contraste chaud/froid)
  const moon = new THREE.DirectionalLight(0x8ea6ff, 0.6);
  moon.position.set(-30, 50, 20);
  city.add(moon);

  // ---------- Terrasses ----------
  const tables = [];
  if (opts.tables) {
    for (const l of opts.tables) {
      const r = RESTAURANTS.find((x) => x.id === l.restId);
      tables.push(buildTable(r, l.x, l.z, Number(l.id.split('-').pop()) - 1, scene, l.count));
    }
  } else for (const r of RESTAURANTS) {
    const x = r.side * (W - 1.25);
    const step = (r.z1 - r.z0) / r.tables;
    for (let i = 0; i < r.tables; i++) tables.push(buildTable(r, x, r.z0 + step * (i + 0.5), i, scene));
  }

  // ---------- Le casting ----------
  const cast = {};
  const putChar = (name, obj, parent, pos, ry) => { obj.position.copy(pos); obj.rotation.y = ry; parent.add(obj); cast[name] = obj; return obj; };
  const toward = (side) => (side < 0 ? Math.PI / 2 : -Math.PI / 2); // regarde la rue depuis une façade
  // Le serveur de Bernadette (le gameplay le fait aller et venir)
  const waiter = CAST.waiter();
  waiter.position.set(-(W - 2.5), 0, bz - 6.8);
  waiter.scale.setScalar(1.1);
  scene.add(waiter);
  cast.waiter = cast.serveur = waiter;
  // Dédé et Ghislain devant l'estaminet
  putChar('dede', CAST.dede(), scene, new THREE.Vector3(-(W - 0.75), 0, P0 - 1.0), toward(-1) + 0.3);
  putChar('ghislain', CAST.ghislain(), scene, new THREE.Vector3(-(W - 0.4), 0, P0 - 1.9), toward(-1) - 0.5);
  anchors.dede = cast.dede.position; anchors.ghislain = cast.ghislain.position;
  // Jérémie et son teckel (la ronde du soir), devant la porte de l'immeuble
  putChar('jeremie', CAST.jeremie(), scene, new THREE.Vector3(-(W - 0.9), 0, bz + 9.3), Math.PI * 0.75);
  putChar('dog', dachshund(), scene, new THREE.Vector3(-(W - 1.35), 0, bz + 8.7), Math.PI * 0.8);
  anchors.jeremie = cast.jeremie.position;
  cast.biloute = cast.dog;
  // Fenêtres : Tatie (milieu de rue), Klaas & Hilde (fond de la place, vue en enfilade)
  const leanAt = (name, obj, side, z, wy, parent = scene, kitX = kit.X) => {
    const hip = obj.userData.rig.k.hipY;
    return putChar(name, obj, parent, new THREE.Vector3(kitX(side, 0.12), wy - 0.98 - hip + 0.28, z), toward(side));
  };
  for (const [name, side, z, wy] of castSpots) if (name === 'tatie') leanAt('tatie', CAST.tatie(), side, z, wy);
  leanAt('klaas', CAST.klaas(), -1, -0.45, winY(0), far.g, far.kit.X);
  leanAt('hilde', CAST.hilde(), -1, 0.5, winY(0), far.g, far.kit.X);
  far.g.updateMatrixWorld(true);
  anchors.klaasWindow = far.g.localToWorld(new THREE.Vector3(0.4, winY(0) + 0.3, -0.45));
  anchors.hildeWindow = far.g.localToWorld(new THREE.Vector3(0.4, winY(0) + 0.3, 0.5));
  // Seb & Nico et le chat sur le balcon d'en face
  const bal = anchors.balcony;
  putChar('seb', CAST.seb(), scene, new THREE.Vector3(bal.x - 0.05, bal.y, bz - 0.5), toward(1) + 0.25);
  putChar('nico', CAST.nico(), scene, new THREE.Vector3(bal.x - 0.05, bal.y, bz + 0.6), toward(1) - 0.25);
  putChar('cat', cat(), scene, new THREE.Vector3(W - 0.78, bal.y + 0.95, bz + 2.0), toward(1) + 0.2);
  anchors.cat = cast.cat.position;
  cast.gaufre = cast.cat;
  // Hippolyte devant sa porte cochère
  putChar('hippolyte', CAST.hippolyte(), scene, new THREE.Vector3(sq.x + 3, 0, sq.z0 + 10.6), -Math.PI * 0.7);
  // Pas encore en scène : Pilou (vue subjective) et l'inspectrice Delphine
  putChar('pilou', CAST.pilou(), scene, new THREE.Vector3(-(W - 0.6), 0, bz + 6.6), Math.PI / 2).visible = false;
  putChar('delphine', CAST.delphine(), scene, new THREE.Vector3(0, 0, -HALF + 3), 0).visible = false;
  anchors.endA = new THREE.Vector3(0, 0, -HALF);
  // Points de mise en scène (art v0.5) : accessoires et états des personnages (voir src/art/README.md)
  const P = (x, y, z) => new THREE.Vector3(x, y, z);
  Object.assign(anchors, {
    pilouSill: P(-(W - 0.12), F + 0.05, bz + 0.6),          // rebord de la fenêtre de Pilou
    pilouBanner: P(-(W - 0.02), F - 0.45, bz),               // sous sa fenêtre
    balconyRail: P(W - 0.83, anchors.balcony.y + 0.55, bz + 0.4), // devant la rambarde de Seb & Nico
    smokeSpot: P(-(W - 0.5), 0, bz + 4.4),                  // pause clope du serveur, sous le store
    awningCleanSpot: P(-(W - 0.55), 0, bz - 2),             // escabeau de Ghislain sous le store
    awning: P(-(W - 0.3), 2.45, bz - 3.5),                  // sous le bord du store (petit objet discret)
    awningSocket: P(-(W - 0.04), 2.2, bz + 4.3),            // sur la façade, sous le store
    chainSpot: P(-(W - 0.6), 0, P0 + 0.6),                  // pile de chaises cadenassée la nuit
    coffeeSpot: P(-(W - 1.4), 0, P0 - 2.6),                 // table des policiers, devant l'estaminet
    petitionSpot: P(-(W - 0.7), 0, bz + 10.5),              // table de pétition, devant chez Pilou et Jérémie
    uritrottoirSpot: P(W - 0.45, 0, -12),                   // si la ville l'installe (face au porche)
    roundPath: [P(-(W - 0.9), 0, bz + 9.3), P(-1.0, 0, bz + 14), P(-1.0, 0, bz + 26), P(0.9, 0, bz + 27), P(0.9, 0, bz - 14), P(-0.9, 0, bz - 16), P(-0.9, 0, bz + 6), P(-(W - 0.9), 0, bz + 9.3)],
    patrolPath: [P(0, 0, -HALF + 2), P(0.4, 0, bz - 8), P(0.4, 0, bz + 3), P(-0.4, 0, bz + 20), P(0, 0, HALF - 3)],
  });
  anchors.square = new THREE.Vector3(0, 0, (sq.z0 + sq.z1) / 2);

  mergeStatic(city);
  // Matériaux qui brillent la nuit (fenêtres, vitrines, lanternes, enseignes) : la panne de courant les éteint
  const emissiveMaterials = [];
  city.traverse((o) => { const m = o.material; if (o.isMesh && m?.emissiveIntensity > 0 && !emissiveMaterials.some((e) => e.m === m)) emissiveMaterials.push({ m, base: m.emissiveIntensity }); });

  const world = {
    tables,
    steam,
    apt,
    waiter,
    window: { pos: anchors.pilouWindow.clone() },
    streetDoor: new THREE.Vector3(-(W - 0.6), 0, bz + 5.8),
    aptDoor,
    bed,
    exhaust,
    // art v0.3
    cast,
    anchors,
    gameMinutes: null, // le gameplay peut renseigner l'heure ici (sinon lue dans window.__rdb.sim.state.min) : cloche de 22h
    setCatVisible(v) { cast.cat.visible = v; },
    groundMaterials,
    streetLights,
    emissiveMaterials,
    windowSpots: kit.windows,
    standingCrowd: (o) => standingCrowd(scene, o),
  };
  world.onFrame = rigHooks.onFrame;
  if (dayRole) return world;
  world.audio = audio.attachStreet({ tables, exhaust, steam, apt, getMinutes: () => world.gameMinutes ?? window.__rdb?.sim?.state?.min ?? window.__rdb?.S?.min });
  onFrame((dt, t, camera) => audio.update(dt, camera));
  world.art = attachArt(scene, world);
  return world;
}

// Fusionne toutes les meshes statiques du décor par matériau ET par tronçon de rue (z), pour que le frustum
// culling écarte les tronçons hors champ. Les matériaux briquetés reçoivent des UV "monde" (taille de brique constante).
const CHUNK = 22;
const LIGHT_TRIS = 4000; // en dessous : pas de découpage par tronçon
function mergeStatic(group) {
  group.updateMatrixWorld(true);
  const byKey = new Map();
  const meshes = [];
  group.traverse((o) => { if (o.isMesh) meshes.push(o); });
  const n = new THREE.Vector3(), c = new THREE.Vector3();
  for (const o of meshes) {
    let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    g.applyMatrix4(o.matrixWorld);
    if (!g.attributes.normal) g.computeVertexNormals();
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    const s = o.material.userData.worldUV;
    if (s && !o.userData.keepUV) {
      const pos = g.attributes.position, nor = g.attributes.normal, uv = g.attributes.uv;
      for (let i = 0; i < pos.count; i++) {
        n.fromBufferAttribute(nor, i);
        const ax = Math.abs(n.x), ay = Math.abs(n.y), az = Math.abs(n.z);
        const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
        if (ax >= ay && ax >= az) uv.setXY(i, z / s, y / s);
        else if (az >= ay) uv.setXY(i, x / s, y / s);
        else uv.setXY(i, x / s, z / s);
      }
    }
    g.computeBoundingBox();
    g.boundingBox.getCenter(c);
    // les très grandes pièces (sol, longues façades) restent dans un tronçon à part
    const big = g.boundingBox.max.z - g.boundingBox.min.z > CHUNK;
    const key = o.material.uuid + (big ? ':big' : ':' + Math.floor(c.z / CHUNK));
    if (!byKey.has(key)) byKey.set(key, { m: o.material, geos: [] });
    byKey.get(key).geos.push(g);
    o.parent.remove(o);
  }
  // Matériaux légers (enseignes, petits décors) : un seul mesh pour toute la rue, le découpage ne paierait pas
  const tris = new Map();
  for (const { m, geos } of byKey.values()) tris.set(m, (tris.get(m) ?? 0) + geos.reduce((a, g) => a + g.attributes.position.count / 3, 0));
  const merged = new Map();
  for (const { m, geos } of byKey.values()) {
    if (tris.get(m) < LIGHT_TRIS) { if (!merged.has(m)) merged.set(m, []); merged.get(m).push(...geos); }
    else group.add(new THREE.Mesh(mergeGeometries(geos), m));
  }
  for (const [m, geos] of merged) group.add(new THREE.Mesh(mergeGeometries(geos), m));
}


function makeSteam(origin) {
  const N = 60;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(N * 3);
  const life = new Float32Array(N);
  for (let i = 0; i < N; i++) life[i] = Math.random();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color: 0xd8d4cc, size: 0.7, map: puffTex(), transparent: true, opacity: 0.35, depthWrite: false });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
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
      mat.opacity = 0.35 * (this.blocked ? 0 : this.intensity); // blocked : carton sur la hotte (art.fx.exhaustBlocked)
      geo.attributes.position.needsUpdate = true;
    },
  };
}
