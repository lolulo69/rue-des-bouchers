// Tableaux de fin : une petite vignette 3D derrière chaque écran de fin (art.scenes.ending(id, flags)).
// Même contrat que les vignettes de jour : { scene, camera, update(dt), setAspect(a), dispose() }.
import * as THREE from 'three';
import { M, vignette, codeTex } from './scenes.js';
import { CAST, setState, humanoid } from './characters.js';
import { canvasTexture, brickTex, cobbleTex, panelTex } from './textures.js';
import { bistroTable, chair as bistroChair } from './props.js';

// ---------- petits décors partagés (créés à l'appel, jamais au chargement du module) ----------
const brickMat = () => { const m = new THREE.MeshStandardMaterial({ map: brickTex(9, 50, 42, 31), roughness: 0.9 }); m.map.repeat.set(3, 3); return m; };
const cobbleMat = (repeat = [3, 3]) => { const t = cobbleTex(); t.repeat.set(...repeat); return new THREE.MeshStandardMaterial({ map: t, roughness: 0.95 }); };
function night(scene, { moon = 0.7, warm = 1 } = {}) {
  scene.background = new THREE.Color(0x141a2e);
  scene.add(new THREE.HemisphereLight(0x8fa8ff, 0x3a2a20, 0.7));
  const m = new THREE.DirectionalLight(0x9fb4ff, moon); m.position.set(-3, 6, 4); scene.add(m);
  const l = new THREE.PointLight(0xffc27a, 6 * warm, 9, 1.5); l.position.set(1.5, 3, 2); scene.add(l);
  return l;
}
function day(scene, sky = 0xbfe0f5) {
  scene.background = new THREE.Color(sky);
  scene.add(new THREE.HemisphereLight(0xfff4e0, 0x8a6a50, 1.6));
  const s = new THREE.DirectionalLight(0xffe8c8, 2.2); s.position.set(4, 6, 3); scene.add(s);
}
// Façade de brique avec une fenêtre (éclairée ou non) : plan x/y face à +z
function facade(k, { w = 8, h = 7, z = -2, win = [], color = null } = {}) {
  const bm = color ? M(color) : brickMat();
  k.box(w, h, 0.3, bm, 0, h / 2, z);
  for (const [x, y, lit, ww = 1, wh = 1.6] of win) {
    k.box(ww, wh, 0.05, lit ? M(0x3a2414, { emissive: 0xffb45c, emissiveIntensity: 0.9 }) : M(0x1b2030, { roughness: 0.3 }), x, y, z + 0.16);
    k.box(ww + 0.3, 0.12, 0.2, M(0xefe7d8), x, y - wh / 2 - 0.06, z + 0.2);
    k.box(ww + 0.3, 0.2, 0.15, M(0xefe7d8), x, y + wh / 2 + 0.1, z + 0.18);
  }
}
const neonTex = (text, color = '#ff5fa2') => canvasTexture(1024, 256, (g, w, h) => {
  g.fillStyle = '#100a14'; g.fillRect(0, 0, w, h);
  let size = 130;
  do g.font = `italic 900 ${size}px "Arial Black", Arial, sans-serif`; while (g.measureText(text).width > w - 120 && (size -= 6) > 40);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.shadowColor = color; g.shadowBlur = 40; g.fillStyle = color;
  for (let i = 0; i < 3; i++) g.fillText(text, w / 2, h / 2);
  g.shadowBlur = 0; g.fillStyle = '#fff2fa'; g.fillText(text, w / 2, h / 2);
});
const frontPage = (headline, sub) => canvasTexture(512, 640, (g, w, h) => {
  g.fillStyle = '#f4efe2'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#111'; g.textAlign = 'center';
  g.font = 'bold 44px Georgia, serif'; g.fillText('La Voix du Nordiste', w / 2, 60);
  g.fillRect(20, 78, w - 40, 3);
  g.font = 'bold 40px Georgia, serif';
  const words = headline.split(' ');
  let line = '', y = 140;
  for (const wd of words) { if (g.measureText(line + wd).width > w - 60) { g.fillText(line, w / 2, y); line = ''; y += 46; } line += wd + ' '; }
  g.fillText(line, w / 2, y);
  g.fillStyle = '#7a7a7a'; g.fillRect(40, y + 30, w - 80, 220); // photo
  g.fillStyle = '#333'; g.fillRect(150, y + 120, 80, 130); g.fillRect(270, y + 140, 70, 110); // silhouettes
  g.fillStyle = '#e8c45a'; g.fillRect(220, y + 160, 60, 40); // l'enveloppe
  g.fillStyle = '#222'; g.font = 'italic 22px Georgia, serif'; g.fillText(sub, w / 2, y + 285);
  g.fillStyle = '#bbb'; for (let i = 0; i < 6; i++) g.fillRect(40, y + 310 + i * 18, w - 80, 8);
});

// ---------- les huit tableaux ----------
const ENDINGS = {
  // 1. Victoire légale : la terrasse a disparu, la gaine monte sur le toit, Pilou à sa fenêtre ouverte, la rue calme
  legal_victory: (flags) => vignette((scene, k, onUpdate) => {
    night(scene, { moon: 0.9, warm: 0.6 });
    facade(k, { w: 9, h: 7, win: [[-2.5, 5.2, false], [2.5, 5.2, false], [-2.5, 2.2, false], [2.5, 2.2, false]] });
    k.box(9.4, 0.3, 0.6, M(0xefe7d8), 0, 7.1, -1.8); // corniche (le toit, où va désormais la gaine)
    k.box(2.0, 1.8, 0.4, M(0x3a2414, { emissive: 0xffc070, emissiveIntensity: 0.9 }), 0, 5.2, -1.95); // fenêtre ouverte de Pilou
    const pilou = CAST.pilou({ pose: 'lean', expr: 'happy' }); pilou.position.set(0, 3.55, -1.65); scene.add(pilou);
    // la gaine part sur le toit (et non plus sous la fenêtre)
    k.box(0.35, 8.2, 0.35, M(0xd8dce2, { metalness: 0.6, roughness: 0.3, emissive: 0x30343a }), 3.6, 4.1, -1.6);
    k.box(0.6, 0.15, 0.6, M(0xd8dce2, { metalness: 0.6, roughness: 0.3 }), 3.6, 8.25, -1.6);
    const steam = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 8), new THREE.MeshBasicMaterial({ color: 0xdedede, transparent: true, opacity: 0.35 })); steam.position.set(3.6, 8.8, -1.6); scene.add(steam);
    onUpdate((dt, tt) => { steam.position.y = 8.6 + (tt * 0.4) % 1.2; steam.material.opacity = 0.35 * (1 - ((tt * 0.4) % 1.2) / 1.2); }); // la vapeur part au-dessus des toits
    k.add(new THREE.PlaneGeometry(12, 8), cobbleMat([4, 3]), 0, 0, 2, -Math.PI / 2);
    if (flags.includes('banners_up')) k.lit(panelTex([['LE SOMMEIL EST UN DROIT', 34]], '#f7f2e6', '#c0262d', 768, 160), 0, 3.95, -1.75, 3.0, 0.62, 0, 0.25);
    const cat = CAST.gaufre(); cat.position.set(1.4, 0, 0.6); cat.rotation.y = -0.6; scene.add(cat);
    k.add(new THREE.SphereGeometry(0.4, 16, 12), new THREE.MeshBasicMaterial({ color: 0xfff6d8 }), -5, 10, -6); // la lune
  }, { pos: [3.8, 2.6, 11.5], look: [0.8, 4.4, -1.5] }),

  // 2. Paix négociée : la charte signée sur une table, 22h00 pile à l'horloge, Dédé et Jérémie se serrent la main
  negotiated_peace: () => vignette((scene, k, onUpdate) => {
    night(scene, { moon: 0.6, warm: 1.2 });
    facade(k, { w: 9, h: 6, color: 0x8a2b2b, win: [[-2.5, 2, true, 1.6, 1.8], [2.5, 2, true, 1.6, 1.8]] });
    k.add(new THREE.PlaneGeometry(12, 8), cobbleMat([4, 3]), 0, 0, 2, -Math.PI / 2);
    const t = bistroTable({ cloth: 0xc4473d }); t.position.set(0, 0, 0.6); scene.add(t);
    k.lit(panelTex([['CHARTE DE BON VOISINAGE', 30], ['Fermeture 22h00 · 6 par table', 22], ['signé : Dédé · Jérémie', 22]], '#fbf6ea', '#2b4d7a'), 0, 0.81, 0.6, 0.62, 0.42, 0, 0.3).rotation.set(-Math.PI / 2, 0, 0.15);
    // horloge : 22h00
    const clock = canvasTexture(256, 256, (g, w, h) => {
      g.fillStyle = '#f6f2ea'; g.beginPath(); g.arc(w / 2, h / 2, 120, 0, 7); g.fill();
      g.strokeStyle = '#222'; g.lineWidth = 10; g.stroke(); g.lineCap = 'round';
      g.beginPath(); g.moveTo(128, 128); g.lineTo(128, 40); g.stroke(); // minutes : 00
      g.beginPath(); g.moveTo(128, 128); g.lineTo(128 - 60 * Math.sin(Math.PI / 3), 128 - 60 * Math.cos(Math.PI / 3)); g.stroke(); // 22h = 10h
    });
    const c = new THREE.Mesh(new THREE.CircleGeometry(0.45, 24), new THREE.MeshStandardMaterial({ map: clock, emissive: 0xffffff, emissiveMap: clock, emissiveIntensity: 0.25 }));
    c.position.set(0, 3.5, -1.8); scene.add(c);
    const dede = CAST.dede({ anim: 'greet', expr: 'happy' }); dede.position.set(-0.75, 0, 0.4); dede.rotation.y = Math.PI / 2; scene.add(dede);
    const jer = CAST.jeremie({ anim: 'greet', expr: 'happy', held: null }); jer.position.set(0.75, 0, 0.4); jer.rotation.y = -Math.PI / 2; scene.add(jer);
    for (let i = 0; i < 4; i++) { const ch = bistroChair(0xc49152); ch.position.set(3.2, i * 0.18, -1.2); ch.rotation.y = 0.2; scene.add(ch); } // chaises empilées
  }, { pos: [0.9, 2.5, 6.4], look: [0, 1.8, 0] }),

  // 3. Scandale : la une de La Voix du Nordiste, et la chaise vide de Lemaire devant son café froid
  scandal: () => vignette((scene, k, onUpdate) => {
    day(scene, 0xdfe9f2);
    facade(k, { w: 9, h: 6, color: 0x8a2b2b, win: [[-2.5, 2, false, 1.6, 1.8]] });
    k.add(new THREE.PlaneGeometry(12, 8), cobbleMat([4, 3]), 0, 0, 2, -Math.PI / 2);
    const t = bistroTable({ top: 0xe8e4dc }); t.position.set(-1.2, 0, 0.3); scene.add(t);
    const ch = bistroChair(0x3a5a8c); ch.position.set(-1.2, 0, 1.15); ch.rotation.y = Math.PI; scene.add(ch);
    k.add(new THREE.CylinderGeometry(0.035, 0.03, 0.06, 10), M(0xf6f2ea), -1.05, 0.8, 0.35); // café froid
    k.add(new THREE.CylinderGeometry(0.16, 0.16, 0.08, 14), M(0x1a2648), -1.4, 0.81, 0.2); // la casquette, oubliée
    const paper = k.lit(frontPage('LE CAFÉ ÉTAIT OFFERT, LES PV NON', 'La police municipale sous enquête interne'), 1.4, 1.45, 0.6, 1.3, 1.6, -0.35, 0.35);
    paper.rotation.x = -0.05;
    k.box(0.08, 1.4, 0.08, M(0x2b2b2e), 1.4, 0.7, 0.45); // présentoir du kiosque
    onUpdate((dt, tt) => { paper.rotation.z = Math.sin(tt * 0.8) * 0.02; });
  }, { pos: [0.4, 2.0, 5.4], look: [0.2, 1.1, 0.2] }),

  // 4. Garde à vue : le banc du commissariat, néon blafard, Pilou tête basse
  custody: () => vignette((scene, k, onUpdate) => {
    scene.background = new THREE.Color(0x1a1f22);
    scene.add(new THREE.HemisphereLight(0xd8f0e8, 0x2a3030, 0.9));
    const neon = new THREE.PointLight(0xd8fff0, 5, 8, 1.4); neon.position.set(0, 3, 0.5); scene.add(neon);
    k.box(8, 4, 0.2, M(0x9fb8a8), 0, 2, -1.6); // mur vert administration
    k.box(8, 0.1, 6, M(0x8a8f86), 0, -0.05, 0.6);
    k.box(1.6, 0.06, 0.12, M(0xf2fff8, { emissive: 0xe8fff4, emissiveIntensity: 1.5 }), 0, 3.4, -1.45); // le néon
    k.box(2.6, 0.08, 0.5, M(0x6b4a2b), -0.6, 0.45, -1.1); // le banc
    for (const x of [-1.7, 0.5]) k.box(0.08, 0.45, 0.4, M(0x2a2a2a), x, 0.22, -1.1);
    const pilou = CAST.pilou({ pose: 'sit', expr: 'sad', talk: 0 }); pilou.position.set(-0.6, -0.04, -1.05); scene.add(pilou);
    setState(pilou, { anim: 'idle' });
    k.lit(panelTex([['POLICE MUNICIPALE', 34], ['Merci de patienter', 24]], '#1f3f8a', '#ffffff'), 1.6, 2.4, -1.48, 1.4, 0.55, 0, 0.3);
    k.box(1.4, 0.06, 0.7, M(0x8a8f96), 2.4, 0.78, 0.2); // le guichet
    const ben = CAST.benali({ pose: 'sit', anim: 'clipboard', held: 'clipboard' }); ben.position.set(2.4, 0, 0.75); ben.rotation.y = Math.PI; scene.add(ben);
    onUpdate((dt, tt) => { neon.intensity = 5 + (Math.sin(tt * 37) > 0.97 ? -2 : 0); }); // le néon qui grésille
  }, { pos: [0.8, 1.6, 4.2], look: [0, 0.9, -0.8] }),

  // 5. Déménagement : un camion de déménagement dans la rue pavée, des cartons, Pilou avec le dernier
  moving_out: () => vignette((scene, k, onUpdate) => {
    day(scene, 0xcfe3f2);
    facade(k, { w: 10, h: 8, win: [[-3, 2.2, false], [0, 5.2, false], [3, 2.2, false]] });
    k.add(new THREE.PlaneGeometry(14, 9), cobbleMat([5, 3]), 0, 0, 2.5, -Math.PI / 2);
    // le camion
    const van = new THREE.Group();
    const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); van.add(m); return m; };
    add(new THREE.BoxGeometry(3.2, 2.1, 1.9), M(0xf2f2ee), 0, 1.45, 0);
    add(new THREE.BoxGeometry(1.2, 1.5, 1.9), M(0x2b6a9a), 2.2, 1.15, 0);
    add(new THREE.BoxGeometry(0.05, 0.6, 1.6), M(0x9fd0f2, { roughness: 0.1 }), 2.82, 1.45, 0);
    const label = canvasTexture(512, 128, (g, w, h) => { g.fillStyle = '#f2f2ee'; g.fillRect(0, 0, w, h); g.fillStyle = '#2b6a9a'; g.font = 'bold 56px Arial'; g.textAlign = 'center'; g.fillText('DÉMÉNAGEMENTS', w / 2, 60); g.font = '30px Arial'; g.fillText('Lille → Wazemmes', w / 2, 105); });
    const sign = add(new THREE.PlaneGeometry(2.8, 0.7), new THREE.MeshStandardMaterial({ map: label }), 0, 1.6, 0.96);
    void sign;
    for (const [x, z] of [[-1.1, 0.95], [-1.1, -0.95], [2.2, 0.95], [2.2, -0.95]]) { const w = add(new THREE.CylinderGeometry(0.38, 0.38, 0.25, 14), M(0x1a1a1a), x, 0.38, z); w.rotation.x = Math.PI / 2; }
    van.position.set(-1.2, 0, 0.2); van.rotation.y = 0.15; scene.add(van);
    const box = (x, y, z, s = 0.5) => k.box(s, s * 0.8, s, M(0xb98a52), x, y + s * 0.4, z);
    box(1.8, 0, 1.2); box(1.85, 0.4, 1.2, 0.42); box(2.5, 0, 0.8, 0.55); box(0.9, 0, 1.8, 0.45);
    k.box(1.4, 0.2, 1.9, M(0xe8e2d0), 3.2, 0.8, 0.4).rotation.z = 1.2; // le matelas contre le mur
    const pilou = CAST.pilou({ expr: 'sad' }); pilou.position.set(1.3, 0, 2.3); pilou.rotation.y = -2.4; scene.add(pilou);
    setState(pilou, { anim: 'tray' });
    const carried = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.35, 0.45), M(0xb98a52)); carried.position.set(1.25, 1.0, 2.05); scene.add(carried);
  }, { pos: [5.6, 2.7, 8.0], look: [0.5, 1.3, 0.5] }),

  // 6. Viré : le bureau vide chez Koddex, Clode Kode s'excuse à l'écran
  fired: () => vignette((scene, k, onUpdate) => {
    day(scene, 0xf3e3c8);
    k.box(8, 0.1, 6, M(0xb08058), 0, -0.05, 0);
    k.box(8, 3.2, 0.1, M(0xf2d9b3), 0, 1.6, -1.6);
    k.box(2.2, 0.06, 0.9, M(0x9a6b42), 0.2, 0.75, -0.9);
    for (const x of [-0.8, 1.2]) k.box(0.06, 0.75, 0.8, M(0x7a5232), x, 0.375, -0.9);
    const sorry = canvasTexture(256, 160, (g, w, h) => {
      g.fillStyle = '#16324a'; g.fillRect(0, 0, w, h); g.fillStyle = '#7fe0ff';
      g.fillRect(90, 50, 18, 18); g.fillRect(150, 50, 18, 18);
      g.beginPath(); g.arc(128, 112, 22, 1.15 * Math.PI, 1.85 * Math.PI); g.lineWidth = 6; g.strokeStyle = '#7fe0ff'; g.stroke();
      g.font = 'bold 15px ui-monospace, monospace'; g.textAlign = 'center'; g.fillText('Je suis vraiment désolé…', w / 2, 150);
    });
    k.lit(codeTex(), -0.25, 1.22, -1.17, 0.62, 0.38, 0.12, 0.25);
    const clode = k.lit(sorry, 0.6, 1.22, -1.17, 0.62, 0.38, -0.12, 1.0);
    for (const [x, ry] of [[-0.25, 0.12], [0.6, -0.12]]) { k.box(0.66, 0.42, 0.04, M(0x22252b), x, 1.22, -1.2, ry); k.box(0.06, 0.25, 0.06, M(0x22252b), x, 0.93, -1.2); }
    const ch = k.chair(0.6, 0.6, 2.6, 0x3a3d48); void ch; // la chaise repoussée, vide
    k.box(0.5, 0.35, 0.4, M(0xb98a52), -0.5, 0.95, -0.7); // le carton des affaires
    k.plant(-0.5, 1.12, -0.7, 0.45);
    k.lit(panelTex([['SHIP IT', 72], ['— Stéphane', 30]], '#ffcf5a', '#2b2b2b'), -1.6, 2.1, -1.54, 0.9, 0.55, 0, 0.3);
    const glow = new THREE.PointLight(0x7fe0ff, 2, 3, 1.5); glow.position.set(0.5, 1.3, -0.6); scene.add(glow);
    onUpdate((dt, tt) => { clode.material.emissiveIntensity = 0.8 + Math.sin(tt * 1.5) * 0.15; });
  }, { pos: [2.3, 1.9, 2.9], look: [0.1, 1.0, -0.8] }),

  // 7. Le transfuge : Pilou attablé en terrasse avec une carbonnade, Dédé lui tape sur l'épaule ; Klaas note, au loin
  turncoat: () => vignette((scene, k, onUpdate) => {
    night(scene, { moon: 0.5, warm: 1.4 });
    facade(k, { w: 10, h: 6, color: 0x8a2b2b, win: [[-2.8, 1.9, true, 2, 2], [2.8, 1.9, true, 2, 2]] });
    k.lit(panelTex([["Estaminet La Ch'tite Bernadette", 40]], '#5a1414', '#f6e7c1'), 0, 3.4, -1.83, 4.5, 0.6, 0, 0.5);
    k.add(new THREE.PlaneGeometry(14, 9), cobbleMat([5, 3]), 0, 0, 2.5, -Math.PI / 2);
    const t = bistroTable({ cloth: 0xc4473d }); t.position.set(0, 0, 0.5); scene.add(t);
    k.add(new THREE.CylinderGeometry(0.16, 0.11, 0.08, 14), M(0xf6f2ea), 0.1, 0.81, 0.75); // l'assiette creuse
    k.add(new THREE.CylinderGeometry(0.14, 0.14, 0.02, 14), M(0x6b3a1e), 0.1, 0.85, 0.75); // la carbonnade
    const pilou = CAST.pilou({ pose: 'sit', held: 'fork', expr: 'happy' }); scene.add(pilou);
    const c = bistroChair(0xc49152); c.position.set(0, 0, 1.4); c.rotation.y = Math.PI; scene.add(c);
    pilou.position.set(0, 0, 1.4); pilou.rotation.y = Math.PI;
    const dede = CAST.dede({ anim: 'greet', expr: 'happy' }); dede.position.set(0.9, 0, 1.6); dede.rotation.y = -2.2; scene.add(dede);
    const klaas = CAST.klaas('stand'); setState(klaas, { anim: 'write', held: 'notebook' }); klaas.position.set(-2.6, 0, 3.4); klaas.rotation.y = 2.4; scene.add(klaas); // au loin, il note
  }, { pos: [1.3, 1.75, -1.1], look: [0, 0.95, 1.3] }),

  // 8. Le retour : La Bombance rouvre en bar, néon rose tout neuf, la file d'attente commence déjà
  the_return: () => vignette((scene, k, onUpdate) => {
    night(scene, { moon: 0.4, warm: 0.6 });
    facade(k, { w: 10, h: 7, color: 0x6e3b3b, win: [[-3, 4.6, false], [0, 4.6, true], [3, 4.6, false]] });
    k.box(8, 2.6, 0.1, M(0x2a1a10, { emissive: 0xff7ac0, emissiveIntensity: 0.35 }), 0, 1.4, -1.8);
    const tex = neonTex('LA BOMBANCE · BAR');
    const neon = k.lit(tex, 0, 3.2, -1.7, 5.2, 1.3, 0, 1.6);
    const pink = new THREE.PointLight(0xff5fa2, 8, 8, 1.3); pink.position.set(0, 3.2, -0.6); scene.add(pink);
    k.add(new THREE.PlaneGeometry(14, 9), cobbleMat([5, 3]), 0, 0, 2.5, -Math.PI / 2);
    for (let i = 0; i < 6; i++) { const p = humanoid({ held: i % 2 ? 'beer' : 'phone', talk: 1 }); p.position.set(-2.4 + i * 0.8, 0, 0.4 + (i % 2) * 0.4); p.rotation.y = Math.PI + (i - 2.5) * 0.15; scene.add(p); }
    k.lit(panelTex([['OUVERTURE', 50], ['ce soir · happy hour 22h-2h', 22]], '#f4efe2', '#b0232a'), 3.6, 1.5, -1.72, 1.2, 0.6, 0, 0.3);
    onUpdate((dt, tt) => { const f = Math.sin(tt * 23) > 0.96 ? 0.5 : 1.6; neon.material.emissiveIntensity = f; pink.intensity = 8 * (f / 1.6); }); // le néon clignote
  }, { pos: [0.5, 2.2, 8.6], look: [0, 2.3, -1.2] }),
};

export const ENDING_IDS = Object.keys(ENDINGS);
// art.scenes.ending(endingId, flags = []) → vignette ; id inconnu : la rue calme (victoire légale)
export function endingScene(id, flags = []) {
  return (ENDINGS[id] ?? ENDINGS.legal_victory)(flags ?? []);
}
