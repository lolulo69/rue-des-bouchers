// L'appartement de Pilou (§12b.D) : ~60 m² traversant, 2e étage. Côté rue (x près de la façade) le séjour avec LA
// fenêtre, la cuisine ouverte, le mur prune, le canapé d'angle, le coin repas et le bureau de Pilou (deux écrans) ;
// le couloir bleu marine (bibliothèque, vélo électrique, portes à galandage) ; côté cour la chambre de Pilou (vert
// sombre), la salle de bain (zellige vert) et la chambre de sa fille (dessins, veilleuse, peluche, porte du balcon).
// Repère : la façade côté rue est en x = xs (≈ -3,5), le fond côté cour en x = xb ; z de za à zb autour de la fenêtre.
import * as THREE from 'three';
import { canvasTexture, panelTex } from './textures.js';

const M = (() => {
  const c = new Map();
  return (color, o = {}) => { const k = color + JSON.stringify(o); if (!c.has(k)) c.set(k, new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...o })); return c.get(k); };
})();
// Pièces du fond : un peu d'auto-éclairage (une seule vraie lumière, dans le séjour)
const S = (color, o = {}) => M(color, { emissive: color, emissiveIntensity: 0.38, ...o });

const zelligeTex = () => canvasTexture(128, 128, (g, w, h) => {
  g.fillStyle = '#cfe2d4'; g.fillRect(0, 0, w, h);
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
    const l = 32 + Math.random() * 14;
    g.fillStyle = `hsl(${150 + Math.random() * 12}, 45%, ${l}%)`;
    g.fillRect(x * 16 + 1, y * 16 + 1, 14, 14);
    g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(x * 16 + 2, y * 16 + 2, 6, 3);
  }
}, [3, 2]);
const drawingTex = (seed) => canvasTexture(128, 160, (g, w, h) => {
  g.fillStyle = '#fbf8f0'; g.fillRect(0, 0, w, h);
  g.lineWidth = 5; g.lineCap = 'round';
  if (seed === 0) { // le soleil et la maison
    g.strokeStyle = '#f5b82e'; g.beginPath(); g.arc(96, 34, 16, 0, 7); g.stroke();
    for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.28; g.beginPath(); g.moveTo(96 + Math.cos(a) * 22, 34 + Math.sin(a) * 22); g.lineTo(96 + Math.cos(a) * 30, 34 + Math.sin(a) * 30); g.stroke(); }
    g.strokeStyle = '#d9483b'; g.strokeRect(24, 82, 56, 52); g.beginPath(); g.moveTo(18, 84); g.lineTo(52, 54); g.lineTo(86, 84); g.stroke();
    g.strokeStyle = '#3b7d4a'; g.beginPath(); g.moveTo(0, 140); g.lineTo(128, 140); g.stroke();
  } else if (seed === 1) { // un chat
    g.strokeStyle = '#e39548'; g.beginPath(); g.arc(64, 96, 30, 0, 7); g.stroke(); g.beginPath(); g.arc(64, 54, 20, 0, 7); g.stroke();
    g.beginPath(); g.moveTo(48, 40); g.lineTo(46, 22); g.lineTo(58, 36); g.moveTo(80, 40); g.lineTo(82, 22); g.lineTo(70, 36); g.stroke();
    g.strokeStyle = '#333'; g.beginPath(); g.arc(57, 52, 2, 0, 7); g.arc(71, 52, 2, 0, 7); g.stroke();
  } else { // un arc-en-ciel
    ['#d9483b', '#f5b82e', '#3b7d4a', '#3b6fb6', '#8a4fb0'].forEach((c, i) => { g.strokeStyle = c; g.beginPath(); g.arc(64, 120, 54 - i * 8, Math.PI, 0); g.stroke(); });
  }
});

export function buildApartment(city, scene, { F, bz, W }) {
  const xs = -(W + 0.3), xb = -15.5, za = bz - 3, zb = bz + 3, H = 2.8, zc = bz + 1.8; // zc : mur du couloir
  const add = (geo, mat, x, y, z, ry = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.y = ry; city.add(m); return m; };
  const box = (w, h, d, mat, x, y, z, ry = 0) => add(new THREE.BoxGeometry(w, h, d), mat, x, y, z, ry);
  const walls = []; // boîtes de collision { x0, x1, z0, z1 } (portes = trous)
  const wallX = (x, z0, z1, mat, coll = true) => { box(0.1, H, z1 - z0, mat, x, F + H / 2, (z0 + z1) / 2); if (coll) walls.push({ x0: x - 0.05, x1: x + 0.05, z0, z1 }); };
  const wallZ = (z, x0, x1, mat, coll = true) => { box(x1 - x0, H, 0.1, mat, (x0 + x1) / 2, F + H / 2, z); if (coll) walls.push({ x0, x1, z0: z - 0.05, z1: z + 0.05 }); };
  const navy = S(0x1f2a44), white = S(0xf2ede4), plum = S(0x6b2e4a), green = S(0x2f4a3a), parquet = M(0xc8a77e, { roughness: 0.6 });

  // ---- coque : sol, plafonds (bleu marine dans le couloir), murs extérieurs ----
  box(xs - xb, 0.1, zb - za, parquet, (xs + xb) / 2, F - 0.05, bz);
  box(xs - (-7), 0.1, zb - za, white, (xs - 7) / 2, F + H + 0.05, bz); // séjour
  box(-7 - xb, 0.1, zc - za, white, (-7 + xb) / 2, F + H + 0.05, (za + zc) / 2);
  box(-7 - xb, 0.1, zb - zc, navy, (-7 + xb) / 2, F + H + 0.05, (zc + zb) / 2); // plafond du couloir
  wallZ(za - 0.05, xb, xs, white); wallZ(zb + 0.05, xb, xs, white); wallX(xb - 0.05, za, zb, white);
  // ---- séjour (côté rue) ----
  // mur prune derrière le coin repas (cloison séjour / salle de bain), avec miroir doré et télé
  wallX(-7.0, za, zc, plum);
  box(0.04, 1.0, 0.7, M(0xc9a227, { metalness: 0.7, roughness: 0.3 }), -6.93, F + 1.5, bz - 1.4);
  box(0.03, 0.9, 0.6, M(0xdfe6ea, { metalness: 0.9, roughness: 0.05 }), -6.91, F + 1.5, bz - 1.4);
  box(0.05, 0.62, 1.05, M(0x111111, { roughness: 0.3 }), -6.93, F + 1.35, bz + 0.6); // la télé
  // la deuxième fenêtre côté rue (vitre sombre vue de l'intérieur)
  box(0.03, 1.6, 1.0, M(0x1b2433, { roughness: 0.15, metalness: 0.4 }), xs - 0.01, F + 0.95, bz - 2.4);
  box(0.06, 0.08, 1.2, white, xs - 0.03, F + 0.1, bz - 2.4); box(0.06, 0.08, 1.2, white, xs - 0.03, F + 1.8, bz - 2.4);
  // cuisine ouverte le long du mur za : plan de travail, plaque à induction, four en colonne, sa petite hotte (ironie)
  box(2.5, 0.9, 0.6, white, -5.55, F + 0.45, za + 0.3); box(2.5, 0.04, 0.62, M(0x3a3d42), -5.55, F + 0.92, za + 0.31);
  box(0.6, 0.01, 0.5, M(0x111111, { roughness: 0.1 }), -5.2, F + 0.945, za + 0.32);
  for (const [dx, dz] of [[-0.13, -0.1], [0.13, -0.1], [-0.13, 0.12], [0.13, 0.12]]) add(new THREE.TorusGeometry(0.08, 0.005, 3, 16), M(0x553333), -5.2 + dx, F + 0.952, za + 0.32 + dz).rotation.x = Math.PI / 2;
  box(0.6, 2.2, 0.6, white, -6.6, F + 1.1, za + 0.3); box(0.5, 0.45, 0.02, M(0x111111, { roughness: 0.2 }), -6.6, F + 1.25, za + 0.61);
  box(0.6, 0.3, 0.45, M(0xb8bcc2, { metalness: 0.7, roughness: 0.35 }), -5.2, F + 1.85, za + 0.23); // la petite hotte
  box(1.9, 0.6, 0.35, white, -5.3, F + 2.2, za + 0.18); // placards hauts
  // coin repas : table ronde, deux chaises
  add(new THREE.CylinderGeometry(0.45, 0.45, 0.04, 16), M(0xb08a62), -6.0, F + 0.74, bz - 1.4);
  add(new THREE.CylinderGeometry(0.05, 0.05, 0.72, 6), M(0x2a2a2a), -6.0, F + 0.36, bz - 1.4);
  for (const dz of [-0.6, 0.6]) box(0.4, 0.45, 0.4, M(0x2a2a2a), -6.0, F + 0.23, bz - 1.4 + dz);
  // canapé d'angle (vert sauge) et tapis
  const sofa = M(0x7a8f7a);
  box(2.2, 0.42, 0.85, sofa, -5.6, F + 0.21, zb - 0.45); box(2.2, 0.45, 0.2, sofa, -5.6, F + 0.65, zb - 0.1);
  box(0.85, 0.42, 1.3, sofa, -6.5, F + 0.21, zb - 1.5); box(0.2, 0.45, 1.3, sofa, -6.85, F + 0.65, zb - 1.5);
  // world.sofa : où Pilou s'écroule les soirs où il ne rejoint pas son lit (facteur qualité du sommeil)
  const sofaSpot = {
    position: new THREE.Vector3(-5.6, F, zb - 0.45), // centre de l'assise longue, au sol
    seat: new THREE.Vector3(-5.6, F + 0.42, zb - 0.5), // assis, face au séjour (-z)
    doze: { position: new THREE.Vector3(-5.5, F + 0.45, zb - 0.5), yaw: Math.PI / 2, head: new THREE.Vector3(-4.75, F + 0.55, zb - 0.5) }, // allongé le long du dossier, tête côté accoudoir est
    box: { x0: -6.95, x1: -4.5, z0: zb - 2.15, z1: zb },
  };
  for (const dx of [-0.5, 0.2]) box(0.45, 0.35, 0.12, M(0xe9c46a), -5.6 + dx, F + 0.62, zb - 0.28);
  box(2.2, 0.01, 1.6, M(0xc4614f), -5.4, F + 0.01, bz + 0.6);
  // LE bureau de Pilou, contre la façade, juste à côté de la fenêtre : deux écrans
  box(0.7, 0.04, 1.5, M(0xb08a62), xs - 0.38, F + 0.74, bz + 2.05);
  for (const dz of [-0.68, 0.68]) box(0.6, 0.72, 0.04, M(0x2a2a2a), xs - 0.38, F + 0.36, bz + 2.05 + dz);
  box(0.03, 0.34, 0.58, M(0x22252b), xs - 0.12, F + 1.08, bz + 1.75); // écran principal (cadre)
  box(0.03, 0.32, 0.52, M(0x22252b), xs - 0.17, F + 1.06, bz + 2.42, 0.45); // second écran, de biais
  const second = add(new THREE.PlaneGeometry(0.48, 0.28), M(0x1d3a4a, { emissive: 0x2a6a8a, emissiveIntensity: 0.9 }), xs - 0.19, F + 1.06, bz + 2.4, -Math.PI / 2 + 0.45);
  void second;
  box(0.16, 0.02, 0.44, M(0x3a3d48), xs - 0.5, F + 0.77, bz + 1.75); // clavier
  box(0.42, 0.05, 0.42, M(0x2a2a2a), xs - 0.95, F + 0.47, bz + 1.85); box(0.05, 0.5, 0.42, M(0x2a2a2a), xs - 1.15, F + 0.75, bz + 1.85); // chaise
  // l'écran principal : mesh à part (non fusionné) pour art.day.screenRect() en télétravail
  const homeScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.54, 0.3), new THREE.MeshBasicMaterial({ color: 0x1b2433 }));
  homeScreen.position.set(xs - 0.14, F + 1.08, bz + 1.75); homeScreen.rotation.y = -Math.PI / 2;
  scene.add(homeScreen);
  const homeSeat = new THREE.Vector3(xs - 0.95, F, bz + 1.85); // où s'assoit Pilou (vue subjective : la rue à gauche)
  // plante et lampadaire
  box(0.3, 0.3, 0.3, M(0xc4714f), xs - 0.35, F + 0.15, zb - 0.35);
  add(new THREE.IcosahedronGeometry(0.32, 0), M(0x5a9a52, { flatShading: true }), xs - 0.35, F + 0.6, zb - 0.35);
  add(new THREE.SphereGeometry(0.16, 10, 8), M(0xffe2a8, { emissive: 0xffc46b, emissiveIntensity: 1.5 }), -6.7, F + 1.6, zb - 0.3);
  // ---- couloir (bleu marine) : bibliothèque de 3,6 m, vélo électrique, porte d'entrée ----
  const bookCols = [0xc0392b, 0x2b4d7a, 0xe9c46a, 0x5a9a52, 0xf2ede4, 0x6d597a, 0xd98c5f];
  // bibliothèque ouverte : fond et étagères bleu marine, livres devant
  box(3.6, 2.4, 0.03, navy, -9.3, F + 1.2, zb - 0.02);
  for (let r = 0; r <= 5; r++) box(3.6, 0.03, 0.3, navy, -9.3, F + 0.12 + r * 0.46, zb - 0.16);
  for (const x of [-11.1, -9.3, -7.5]) box(0.03, 2.4, 0.3, navy, x, F + 1.2, zb - 0.16);
  for (let r = 0; r < 5; r++) for (let i = 0; i < 17; i++) {
    const h = 0.24 + Math.random() * 0.12;
    box(0.06 + Math.random() * 0.04, h, 0.22, S(bookCols[(i + r * 3) % bookCols.length]), -10.95 + i * 0.205, F + 0.135 + r * 0.46 + h / 2, zb - 0.15);
  }
  // le vélo électrique, garé le long du mur
  const bike = new THREE.Group(); bike.position.set(-12.4, F, zb - 0.25); city.add(bike);
  const bk = (geo, m, x, y, z, rx = 0, ry = 0, rz = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); bike.add(o); };
  for (const x of [-0.52, 0.52]) bk(new THREE.TorusGeometry(0.33, 0.035, 6, 20), M(0x1a1a1a), x, 0.34, 0);
  bk(new THREE.CylinderGeometry(0.025, 0.025, 0.9, 6), S(0x2b9d8f), 0, 0.6, 0, 0, 0, Math.PI / 2 - 0.25);
  bk(new THREE.CylinderGeometry(0.025, 0.025, 0.55, 6), S(0x2b9d8f), -0.2, 0.55, 0, 0, 0, 0.5);
  bk(new THREE.BoxGeometry(0.34, 0.1, 0.09), M(0x2a2a2a), 0.05, 0.47, 0, 0, 0, -0.25); // batterie
  bk(new THREE.BoxGeometry(0.22, 0.04, 0.1), M(0x111111), -0.3, 0.9, 0); bk(new THREE.CylinderGeometry(0.015, 0.015, 0.5, 5), M(0x2a2a2a), 0.45, 1.0, 0, Math.PI / 2);
  // porte d'entrée (bleu marine) et portes à galandage entrouvertes
  box(0.95, 2.1, 0.06, navy, -14.3, F + 1.05, zb + 0.0);
  const aptDoor = new THREE.Vector3(-14.3, F, zb - 0.6);
  // cloisons côté cour avec leurs portes (trous dans la collision)
  const door = (x0, x1) => { box(x0 - x1, 2.1, 0.04, navy, x0 + (x0 - x1) * 0.35, F + 1.05, zc + 0.08); }; // porte coulissante presque rentrée (glissée devant le mur)
  wallZ(zc, -7.0, -7.9, white); door(-7.9, -8.8); wallZ(zc, -8.8, -10.3, white); door(-10.3, -11.2); wallZ(zc, -11.2, -13.3, white); door(-13.3, -14.2); wallZ(zc, -14.2, xb, white);
  // ---- salle de bain (zellige vert) : baignoire à paroi vitrée, vasque en pierre sur bois, miroir rétroéclairé, robinets dorés ----
  wallX(-9.5, za, zc, white);
  const zel = new THREE.MeshStandardMaterial({ map: zelligeTex(), roughness: 0.25, metalness: 0.1, emissive: 0x2f4a3a, emissiveIntensity: 0.15 });
  box(2.4, 1.6, 0.04, zel, -8.25, F + 0.8, za + 0.03); box(0.04, 1.6, 4.7, zel, -7.07, F + 0.8, (za + zc) / 2);
  box(1.6, 0.55, 0.75, S(0xf2f2ee), -8.3, F + 0.28, za + 0.4); box(0.8, 1.2, 0.02, M(0xd8f0f0, { transparent: true, opacity: 0.35, roughness: 0.05 }), -7.9, F + 1.15, za + 0.78);
  box(0.4, 0.06, 0.6, M(0x8a5a35), -9.28, F + 0.82, zc - 1.0); add(new THREE.CylinderGeometry(0.17, 0.14, 0.1, 14), M(0xd8d4cc), -9.26, F + 0.9, zc - 1.0);
  box(0.03, 0.75, 0.6, M(0xdfe6ea, { metalness: 0.9, roughness: 0.05, emissive: 0xfff2d8, emissiveIntensity: 0.25 }), -9.46, F + 1.5, zc - 1.0);
  add(new THREE.CylinderGeometry(0.012, 0.012, 0.16, 6), M(0xd4a62a, { metalness: 0.9, roughness: 0.2 }), -9.4, F + 1.0, zc - 1.0);
  // ---- chambre de Pilou (côté cour, mur vert sombre) : lit double, placard coulissant ----
  wallX(-12.5, za, zc, green);
  box(1.6, 0.35, 2.05, M(0x6b4a2b), -11.0, F + 0.25, za + 1.1); box(1.5, 0.18, 1.95, S(0xe8e2d0), -11.0, F + 0.5, za + 1.15);
  for (const dx of [-0.38, 0.38]) box(0.6, 0.14, 0.35, S(0xffffff), -11.0 + dx, F + 0.62, za + 0.3);
  box(1.6, 0.9, 0.08, M(0x4a3a2a), -11.0, F + 0.75, za + 0.06); // tête de lit
  box(0.6, 2.2, 2.2, M(0xd8cdb4), -9.85, F + 1.1, za + 2.1); // placard coulissant
  const bed = new THREE.Vector3(-11.0, F, za + 1.4);
  // ---- chambre de la fille (côté cour) : petit lit, deux armoires, dessins, veilleuse, peluche, porte du balcon ----
  box(0.9, 0.35, 1.8, M(0xf2ede4), -13.3, F + 0.2, za + 1.0); box(0.85, 0.12, 1.7, S(0xf5b8c8), -13.3, F + 0.42, za + 1.05);
  box(0.5, 0.1, 0.3, S(0xffffff), -13.3, F + 0.52, za + 0.3);
  const bear = new THREE.Group(); bear.position.set(-13.1, F + 0.52, za + 0.75); city.add(bear); // la peluche
  for (const [x, y, z, r] of [[0, 0.12, 0, 0.1], [0, 0.27, 0, 0.075], [0.06, 0.33, 0, 0.03], [-0.06, 0.33, 0, 0.03], [0.07, 0.08, 0.05, 0.035], [-0.07, 0.08, 0.05, 0.035]]) {
    const o = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), S(0xb98a52)); o.position.set(x, y, z); bear.add(o);
  }
  add(new THREE.SphereGeometry(0.07, 10, 8), M(0xffe9b0, { emissive: 0xffc86b, emissiveIntensity: 1.6 }), -12.7, F + 0.62, za + 0.25); // veilleuse
  add(new THREE.CylinderGeometry(0.05, 0.06, 0.08, 10), M(0xf28cb1), -12.7, F + 0.54, za + 0.25);
  box(0.4, 0.5, 0.4, M(0xf2ede4), -12.7, F + 0.25, za + 0.25); // table de nuit
  for (const z of [zc - 0.4, zc - 1.1]) box(0.55, 1.9, 0.65, M(0xe8e2d0), -15.15, F + 0.95, z); // les deux armoires
  [0, 1, 2].forEach((i) => box(0.01, 0.4, 0.32, new THREE.MeshStandardMaterial({ map: drawingTex(i), emissive: 0xffffff, emissiveMap: null, emissiveIntensity: 0, roughness: 0.9 }), -12.56, F + 1.5 + (i % 2) * 0.12, za + 0.6 + i * 0.45)); // dessins au mur (scotchés)
  box(0.02, 1.6, 0.25, S(0xf28cb1), -12.56, F + 1.0, za + 2.0); // toise / guirlande
  // porte-fenêtre du balcon (côté cour) et le balcon : terrasse en bois, banc, murs de brique
  box(0.03, 2.1, 0.85, M(0xb8d4e0, { transparent: true, opacity: 0.35, roughness: 0.05 }), xb - 0.02, F + 1.05, za + 1.5);
  const brick = M(0x9a4a3a);
  box(1.4, 0.06, 2.2, M(0x9a6b42), xb - 0.7, F - 0.03, za + 1.5);
  box(1.4, 1.1, 0.12, brick, xb - 0.7, F + 0.55, za + 0.4); box(1.4, 1.1, 0.12, brick, xb - 0.7, F + 0.55, za + 2.6); box(0.12, 1.1, 2.2, brick, xb - 1.4, F + 0.55, za + 1.5);
  box(0.35, 0.42, 1.1, M(0x8a5a35), xb - 1.15, F + 0.21, za + 1.5); // le banc
  // plafonniers (émissifs) du couloir et des chambres
  for (const [x, z] of [[-8.5, (zc + zb) / 2], [-12.5, (zc + zb) / 2], [-11.0, bz - 0.8], [-14.0, bz - 0.8], [-8.3, bz - 0.8]]) add(new THREE.SphereGeometry(0.12, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), M(0xfff2d8, { emissive: 0xffe2b0, emissiveIntensity: 1.4, side: THREE.DoubleSide }), x, F + H - 0.02, z).rotation.x = Math.PI;
  // ---- lumière : une vraie lampe dans le séjour (le reste est légèrement auto-éclairé) ----
  const light = new THREE.PointLight(0xffd9a0, 7, 9, 1.4); light.position.set(-5.2, F + 2.4, bz - 0.4); city.add(light);
  const panel = panelTex([['WC', 60]], '#1f2a44', '#f2ede4');
  add(new THREE.PlaneGeometry(0.22, 0.12), new THREE.MeshStandardMaterial({ map: panel, emissive: 0xffffff, emissiveMap: panel, emissiveIntensity: 0.2 }), -14.9, F + 1.7, zc + 0.11);

  // meubles qu'on ne traverse pas non plus
  walls.push({ x0: xs - 0.75, x1: xs, z0: bz + 1.3, z1: bz + 2.8 }); // le bureau
  walls.push({ x0: -6.9, x1: -4.3, z0: za, z1: za + 0.62 }); // la cuisine
  walls.push({ x0: -6.95, x1: -4.5, z0: zb - 0.9, z1: zb }, { x0: -6.95, x1: -6.05, z0: zb - 2.15, z1: zb }); // le canapé d'angle
  walls.push({ x0: -11.8, x1: -10.2, z0: za, z1: za + 2.1 }, { x0: -13.75, x1: -12.85, z0: za, z1: za + 1.9 }); // les lits
  walls.push({ x0: -9.1, x1: -7.5, z0: za, z1: za + 0.8 }); // la baignoire
  const apt = { x0: xb, x1: xs, z0: za, z1: zb, floor: F, ceil: F + H };
  // Collision des cloisons (le jeu l'appelle sur la position de Pilou) : repousse hors des murs, rayon r
  function collide(p, r = 0.25) {
    if (p.y < F - 0.5 || p.y > F + H) return p;
    for (const w of walls) {
      if (p.x < w.x0 - r || p.x > w.x1 + r || p.z < w.z0 - r || p.z > w.z1 + r) continue;
      const dx = Math.min(p.x - (w.x0 - r), w.x1 + r - p.x), dz = Math.min(p.z - (w.z0 - r), w.z1 + r - p.z);
      if (dx < dz) p.x = p.x - (w.x0 - r) < w.x1 + r - p.x ? w.x0 - r : w.x1 + r;
      else p.z = p.z - (w.z0 - r) < w.z1 + r - p.z ? w.z0 - r : w.z1 + r;
    }
    return p;
  }
  return { apt, bed, aptDoor, homeScreen, homeSeat, sofa: sofaSpot, collide, light, rooms: { living: [xs, -7.0], corridor: [-7.0, xb], bedroom: [-9.5, -12.5], daughter: [-12.5, xb], bathroom: [-7.0, -9.5] } };
}
