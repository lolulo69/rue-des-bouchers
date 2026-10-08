import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { homography, applyHomography, toMatrix3d, projectCorners, quadSize } from '../../src/ui/project.js';

describe('ui : terminal projeté sur le moniteur 3D', () => {
  it('l’homographie envoie les 4 coins du rectangle sur le quadrilatère (même en perspective)', () => {
    const q = [{ x: 120, y: 80 }, { x: 620, y: 110 }, { x: 600, y: 420 }, { x: 140, y: 380 }];
    const H = homography(800, 500, q);
    const corners = [[0, 0], [800, 0], [800, 500], [0, 500]].map(([x, y]) => applyHomography(H, x, y));
    corners.forEach((p, i) => { expect(p.x).toBeCloseTo(q[i].x, 6); expect(p.y).toBeCloseTo(q[i].y, 6); });
    expect(toMatrix3d(H)).toMatch(/^matrix3d\((-?[\d.e-]+,){15}-?[\d.e-]+\)$/);
  });
  it('un rectangle aligné donne une transformation affine (g = h = 0)', () => {
    const H = homography(100, 50, [{ x: 10, y: 20 }, { x: 210, y: 20 }, { x: 210, y: 120 }, { x: 10, y: 120 }]);
    expect(H.g).toBeCloseTo(0);
    expect(H.h).toBeCloseTo(0);
    expect(H.a).toBeCloseTo(2);
  });
  it('projette des coins du monde avec la caméra de la scène, refuse ceux derrière elle', () => {
    const cam = new THREE.PerspectiveCamera(50, 16 / 9, 0.1, 100);
    cam.position.set(0, 0, 2);
    cam.updateMatrixWorld();
    const screen = [new THREE.Vector3(-0.5, 0.3, 0), new THREE.Vector3(0.5, 0.3, 0), new THREE.Vector3(0.5, -0.3, 0), new THREE.Vector3(-0.5, -0.3, 0)];
    const q = projectCorners(screen, cam, 1600, 900);
    expect(q[0].x).toBeLessThan(q[1].x);
    expect(q[0].y).toBeLessThan(q[3].y);
    expect(quadSize(q).w).toBeGreaterThan(300);
    const behind = screen.map((v) => v.clone().setZ(5));
    expect(projectCorners(behind, cam, 1600, 900)).toBe(null);
  });
});
