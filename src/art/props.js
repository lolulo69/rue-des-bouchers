// Mobilier de terrasse (instancié via rig.js) : chaises bistrot, tables rondes avec bougie et parasol replié,
// tonneaux mange-debout. Les chaises peuvent s'effondrer (sabotage : vis retirées).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { defineGeo, makeRig, part, smooth } from './rig.js';

function merged(list) {
  const parts = list.map(([g, x, y, z, rx = 0, rz = 0]) => {
    g.rotateX(rx); g.rotateZ(rz); g.translate(x, y, z);
    const n = g.index ? g.toNonIndexed() : g;
    n.deleteAttribute('uv');
    return n;
  });
  return mergeGeometries(parts);
}
function chairGeo() {
  const l = [[new THREE.CylinderGeometry(0.21, 0.2, 0.04, 8, 1), 0, 0.46, 0]]; // assise
  for (const [x, z] of [[0.13, 0.13], [-0.13, 0.13], [0.13, -0.13], [-0.13, -0.13]]) l.push([new THREE.CylinderGeometry(0.016, 0.014, 0.46, 3, 1, true), x * 1.05, 0.23, z * 1.05, z * 0.15, -x * 0.15]);
  for (const x of [0.15, -0.15]) l.push([new THREE.CylinderGeometry(0.016, 0.016, 0.42, 3, 1, true), x, 0.67, -0.17, -0.12]);
  l.push([new THREE.TorusGeometry(0.15, 0.024, 3, 6, Math.PI), 0, 0.84, -0.195, -0.12]); // dossier arrondi
  l.push([new THREE.BoxGeometry(0.3, 0.025, 0.025), 0, 0.72, -0.185, -0.12]);
  return merged(l);
}
defineGeo('chair', chairGeo());
// De loin : une assise et un dossier en boîtes
defineGeo('chairLo', merged([[new THREE.BoxGeometry(0.4, 0.46, 0.4), 0, 0.23, 0], [new THREE.BoxGeometry(0.34, 0.4, 0.04), 0, 0.68, -0.18]]));

function animChair(rig, t, dt) {
  const st = rig.st;
  st.c = Math.min(1, (st.c ?? 0) + (rig.flags.collapsed ? dt * 4 : -dt * 4));
  if (st.c <= 0) { st.c = 0; rig.bones.root.identity(); return; }
  // l'assise tombe, la chaise se couche en arrière, les pieds s'écartent (écrasement)
  const c = smooth(st.c);
  rig.bones.root.compose(new THREE.Vector3(0, -0.05 * c, -0.1 * c), new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.5 * c, 0, 0.25 * c)), new THREE.Vector3(1 + 0.3 * c, 1 - 0.65 * c, 1 + 0.3 * c));
}
export function chair(color) {
  return makeRig([part('chair', 'root', [0, 0, 0], 1, color)], { animate: animChair, radius: 0.6, data: { flags: {} } });
}

// Table bistrot ronde : plateau, pied, bougie (émissive), parfois une carafe ; parasol replié (drapeau "parasol")
export function bistroTable({ top = 0x8a5a35, metal = 0x2b2b2e, cloth = null, parasol = null } = {}) {
  const p = [
    part('cyl', 'root', [0, 0.75, 0], [1.1, 0.045, 1.1], cloth ?? top),
    part('cyl', 'root', [0, 0.38, 0], [0.07, 0.72, 0.07], metal),
    part('cyl', 'root', [0, 0.02, 0], [0.5, 0.04, 0.5], metal),
    part('cyl', 'root', [0, 0.805, 0], [0.08, 0.07, 0.08], 0xffb347, null, true, true),
    part('cyl', 'root', [0, 0.85, 0], [0.012, 0.03, 0.012], 0xfff2c0, null, true),
  ];
  if (cloth) p.push(part('cyl', 'root', [0, 0.72, 0], [1.16, 0.08, 1.16], cloth));
  if (Math.random() < 0.5) p.push(part('cyl', 'root', [0.22, 0.86, 0.1], [0.1, 0.18, 0.1], 0xcfe6e0), part('cyl', 'root', [0.22, 0.85, 0.1], [0.085, 0.12, 0.085], 0x9c2a3a));
  if (parasol) {
    const pp = [
      part('cyl', 'root', [0, 1.4, 0], [0.04, 2.6, 0.04], 0xe8e2d0),
      part('cone', 'root', [0, 2.15, 0], [0.32, 1.2, 0.32], parasol, [Math.PI, 0, 0]),
      part('ball', 'root', [0, 2.75, 0], 0.05, 0xe8e2d0),
    ];
    for (const q of pp) { q.when = 'parasol'; p.push(q); }
  }
  return makeRig(p, { radius: 1.6, data: { flags: { parasol: !!parasol } } });
}

// Tonneau mange-debout (samedi : on boit debout)
export function barrelTable() {
  return makeRig([
    part('cyl', 'root', [0, 0.5, 0], [0.62, 1.0, 0.62], 0x7a4a26),
    part('torus', 'root', [0, 0.2, 0], [0.31, 0.31, 0.12], 0x3a3a3a, [Math.PI / 2, 0, 0]),
    part('torus', 'root', [0, 0.8, 0], [0.31, 0.31, 0.12], 0x3a3a3a, [Math.PI / 2, 0, 0]),
    part('cyl', 'root', [0, 1.02, 0], [0.7, 0.04, 0.7], 0x8a5a35),
    part('cyl', 'root', [0.12, 1.1, 0.05], [0.08, 0.13, 0.08], 0xf0a830),
  ]);
}
