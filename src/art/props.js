// Mobilier de terrasse (instancié via rig.js) : chaises bistrot, tables rondes avec bougie, tonneaux mange-debout.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { defineGeo, makeRig, part } from './rig.js';

function chairGeo() {
  const parts = [];
  const add = (g, x, y, z, rx = 0, rz = 0) => {
    g.rotateX(rx); g.rotateZ(rz); g.translate(x, y, z);
    parts.push(g.index ? g.toNonIndexed() : g);
  };
  add(new THREE.CylinderGeometry(0.21, 0.2, 0.04, 10), 0, 0.46, 0); // assise
  for (const [x, z] of [[0.13, 0.13], [-0.13, 0.13], [0.13, -0.13], [-0.13, -0.13]]) {
    add(new THREE.CylinderGeometry(0.016, 0.014, 0.46, 4), x * 1.05, 0.23, z * 1.05, z * 0.15, -x * 0.15);
  }
  for (const x of [0.15, -0.15]) add(new THREE.CylinderGeometry(0.016, 0.016, 0.42, 4), x, 0.67, -0.17, -0.12);
  add(new THREE.TorusGeometry(0.15, 0.024, 4, 8, Math.PI), 0, 0.84, -0.195, -0.12); // dossier arrondi
  add(new THREE.TorusGeometry(0.15, 0.014, 3, 8, Math.PI), 0, 0.7, -0.18, -0.12);
  for (const g of parts) g.deleteAttribute('uv');
  return mergeGeometries(parts);
}
defineGeo('chair', chairGeo());

export function chair(color) {
  return makeRig([part('chair', 'root', [0, 0, 0], 1, color)]);
}

// Table bistrot ronde : plateau, pied, bougie (émissive), parfois une carafe
export function bistroTable({ top = 0x8a5a35, metal = 0x2b2b2e, cloth = null } = {}) {
  const p = [
    part('cyl', 'root', [0, 0.75, 0], [1.1, 0.045, 1.1], cloth ?? top),
    part('cyl', 'root', [0, 0.38, 0], [0.07, 0.72, 0.07], metal),
    part('cyl', 'root', [0, 0.02, 0], [0.5, 0.04, 0.5], metal),
    part('cyl', 'root', [0, 0.805, 0], [0.08, 0.07, 0.08], 0xffb347, null, true),
    part('cyl', 'root', [0, 0.85, 0], [0.012, 0.03, 0.012], 0xfff2c0, null, true),
  ];
  if (cloth) p.push(part('cyl', 'root', [0, 0.72, 0], [1.16, 0.08, 1.16], cloth));
  if (Math.random() < 0.5) p.push(part('cyl', 'root', [0.22, 0.86, 0.1], [0.1, 0.18, 0.1], 0xcfe6e0), part('cyl', 'root', [0.22, 0.85, 0.1], [0.085, 0.12, 0.085], 0x9c2a3a));
  return makeRig(p);
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
