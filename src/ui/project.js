// Projection d'un écran du monde 3D sur l'interface : le terminal Koddex est un élément HTML net, déformé par une
// homographie CSS (matrix3d) pour coller au moniteur de la scène (art.day, screenCorners()). Pur : testable sans DOM.

// Coins du monde [TL, TR, BR, BL] (THREE.Vector3) → points CSS px [{x, y}] ; null si un coin est derrière la caméra
export function projectCorners(corners, camera, width, height) {
  const out = [];
  for (const c of corners) {
    const p = c.clone().project(camera);
    if (!(p.z > -1 && p.z < 1)) return null;
    out.push({ x: (p.x + 1) / 2 * width, y: (1 - p.y) / 2 * height });
  }
  return out;
}

// Homographie qui envoie le rectangle (0,0)-(w,h) sur le quadrilatère q = [TL, TR, BR, BL] (Heckbert).
// → les 9 coefficients { a, b, c, d, e, f, g, h } de X = (a·x + b·y + c) / (g·x + h·y + 1), Y = (d·x + e·y + f) / (…)
export function homography(w, h, q) {
  const [p0, p1, p2, p3] = q;
  const dx1 = p1.x - p2.x, dx2 = p3.x - p2.x, dx3 = p0.x - p1.x + p2.x - p3.x;
  const dy1 = p1.y - p2.y, dy2 = p3.y - p2.y, dy3 = p0.y - p1.y + p2.y - p3.y;
  let g = 0, k = 0;
  if (Math.abs(dx3) > 1e-9 || Math.abs(dy3) > 1e-9) {
    const det = dx1 * dy2 - dx2 * dy1;
    if (Math.abs(det) < 1e-12) return null;
    g = (dx3 * dy2 - dx2 * dy3) / det;
    k = (dx1 * dy3 - dx3 * dy1) / det;
  }
  const a = p1.x - p0.x + g * p1.x, b = p3.x - p0.x + k * p3.x, c = p0.x;
  const d = p1.y - p0.y + g * p1.y, e = p3.y - p0.y + k * p3.y, f = p0.y;
  return { a: a / w, b: b / h, c, d: d / w, e: e / h, f, g: g / w, h: k / h };
}
export const applyHomography = (H, x, y) => {
  const z = H.g * x + H.h * y + 1;
  return { x: (H.a * x + H.b * y + H.c) / z, y: (H.d * x + H.e * y + H.f) / z };
};
// CSS matrix3d (colonne par colonne), avec transform-origin: 0 0 sur l'élément
export const toMatrix3d = (H) => `matrix3d(${[H.a, H.d, 0, H.g, H.b, H.e, 0, H.h, 0, 0, 1, 0, H.c, H.f, 0, 1].map((v) => +v.toFixed(8)).join(',')})`;

// Taille apparente du quadrilatère (largeur moyenne des bords haut/bas, hauteur moyenne gauche/droite)
export function quadSize(q) {
  const len = (u, v) => Math.hypot(u.x - v.x, u.y - v.y);
  return { w: (len(q[0], q[1]) + len(q[3], q[2])) / 2, h: (len(q[0], q[3]) + len(q[1], q[2])) / 2 };
}
