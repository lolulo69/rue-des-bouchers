// Rendu + entrées + HUD. Toute la logique de jeu vit dans src/sim (testée sans navigateur) :
// main.js lit sim.state pour dessiner, et envoie les actions du joueur via sim.act().
import * as THREE from 'three';
import { buildWorld, person, mat } from './world.js';
import { RULES, SKY, STREET, NOISE, EVIDENCE, INTERACT, ZONES, POLICE } from './config.js';
import { createSim, makeConfig, fmt } from './sim/index.js';

const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const params = new URLSearchParams(location.search);
// ?nolock=1 : pas de pointer lock (tests automatisés) · ?day=sat : samedi · ?seed=42 : soirée rejouable
const NOLOCK = params.has('nolock');
const SEED = Number(params.get('seed')) || (Date.now() % 1e9);
const cfg = makeConfig();
const ANCHORS = cfg.ANCHORS; // même objet que celui de la simulation (recalé sur le décor plus bas)
const sim = createSim({ seed: SEED, day: params.get('day') || 'mon', cfg });
const S = sim.state;
const CLOSE = sim.close;
const W = STREET.halfWidth;
const HALF = STREET.length / 2;

// ---------- Rendu ----------
const canvas = $('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x000000, 18, 95);
const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.05, 400);
camera.rotation.order = 'YXZ';

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});

// Ciel en dégradé : crépuscule → nuit
const skyU = { top: { value: new THREE.Color() }, bottom: { value: new THREE.Color() } };
const sky = new THREE.Mesh(
  new THREE.SphereGeometry(300, 16, 12),
  new THREE.ShaderMaterial({
    uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false, toneMapped: false,
    vertexShader: 'varying float h; void main(){ h = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform vec3 top; uniform vec3 bottom; varying float h; void main(){ gl_FragColor = vec4(mix(bottom, top, smoothstep(-0.05, 0.45, h)), 1.0);\n#include <colorspace_fragment>\n}',
  }),
);
sky.renderOrder = -1;
scene.add(sky);
const hemi = new THREE.HemisphereLight(0x9fb4ff, 0x3a2a20, 1);
scene.add(hemi);
const PAL = {
  dusk: { top: new THREE.Color(0x2c3e74), bottom: new THREE.Color(0xe08a5a), fog: new THREE.Color(0x5e5068), hemi: 1.1 },
  night: { top: new THREE.Color(0x04060d), bottom: new THREE.Color(0x151a2c), fog: new THREE.Color(0x0c0e1a), hemi: 0.3 },
};
function updateSky() {
  const t = clamp((S.min - SKY.duskStart) / (SKY.nightFull - SKY.duskStart), 0, 1);
  skyU.top.value.lerpColors(PAL.dusk.top, PAL.night.top, t);
  skyU.bottom.value.lerpColors(PAL.dusk.bottom, PAL.night.bottom, t);
  scene.fog.color.lerpColors(PAL.dusk.fog, PAL.night.fog, t);
  hemi.intensity = THREE.MathUtils.lerp(PAL.dusk.hemi, PAL.night.hemi, t);
  sky.position.copy(camera.position);
}

// Le décor (world.js, art) dessine les terrasses tirées par la simulation
const world = buildWorld(scene, { tables: S.tables });
const { apt } = world;
const viewTables = new Map(world.tables.map((v) => [v.id, v]));
// Les positions du décor font foi : la simulation lit les mêmes points que ce qu'on voit (étages, fenêtre, porte, lit).
const xyz = (p) => ({ x: p.x, y: p.y, z: p.z });
Object.assign(ANCHORS, {
  pilouWindow: xyz(world.window.pos),
  streetDoor: xyz(world.streetDoor),
  bed: { ...xyz(world.bed), y: world.bed.y + 0.6 },
  ...(world.exhaust && { exhaust: xyz(world.exhaust) }),
});
for (const v of world.tables) v.hit.userData.target = { kind: 'table', id: v.id };

// ---------- Acteurs de gameplay (placeholders : person() de world.js, restylés par la passe art) ----------
const v3 = (p, y = p.y ?? 0) => new THREE.Vector3(p.x, y, p.z);
const COLORS = [0x264653, 0x2a9d8f, 0xe9c46a, 0xf4a261, 0xe76f51, 0x6d597a, 0x355070, 0xb5838d, 0x3d405b];

// Klaas à sa fenêtre sur la place Maurice-Schumann, face à la rue (barbe blanche, gilet rouge) : allumée tant qu'il veille
const klaas = new THREE.Group();
{
  const facade = new THREE.Mesh(new THREE.BoxGeometry(5, ANCHORS.klaasWindow.y + 3, 0.4), mat(0xb9a58c));
  facade.position.set(0, -ANCHORS.klaasWindow.y + (ANCHORS.klaasWindow.y + 3) / 2, 0.25);
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.5), new THREE.MeshStandardMaterial({ color: 0x332211, emissive: 0xffc070, emissiveIntensity: 0.9 }));
  pane.rotation.y = Math.PI;
  const k = person(0xb3261e);
  k.position.set(0, -1.25, 0.1);
  k.rotation.y = Math.PI;
  const beard = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), mat(0xf4f4f4));
  beard.position.set(0, 1.1, 0.08);
  k.add(beard);
  klaas.add(facade, pane, k);
  klaas.userData = { pane, figure: k };
  klaas.position.copy(v3(ANCHORS.klaasWindow));
  scene.add(klaas);
}
// Balcon de Seb & Nico : le chat = ils sont là
const balcony = new THREE.Group();
const cat = new THREE.Group();
{
  const slab = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.1, 2.2), mat(0xcfc6b8));
  const rail = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.9, 2.2), mat(0x1c1c1c, { metalness: 0.6 }));
  rail.position.set(-0.43, 0.45, 0);
  const fur = mat(0x2b2b2b);
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.2, 0.18), fur);
  body.position.y = 0.2;
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.15), fur);
  head.position.set(-0.22, 0.32, 0);
  for (const dz of [-0.05, 0.05]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.08, 4), fur);
    ear.position.set(-0.22, 0.43, dz);
    cat.add(ear);
  }
  cat.add(body, head);
  balcony.add(slab, rail, cat);
  balcony.position.copy(v3(ANCHORS.balcony)).setX(W - 0.45);
  scene.add(balcony);
}
// Buveurs debout (samedi)
const standingViews = S.standing.map((g) => {
  const grp = new THREE.Group();
  for (let i = 0; i < g.size; i++) {
    const p = person(COLORS[(i * 3 + g.size) % COLORS.length]);
    const a = (i / g.size) * Math.PI * 2;
    p.position.set(Math.cos(a) * 0.45, 0.25, Math.sin(a) * 0.45);
    p.rotation.y = -a + Math.PI / 2;
    grp.add(p);
  }
  grp.position.set(g.x, 0, g.z);
  grp.visible = false;
  scene.add(grp);
  return { g, grp };
});
// Pipis dans les portes : une petite réserve de silhouettes
const peeViews = Array.from({ length: 4 }, (_, i) => {
  const p = person(COLORS[(i * 2 + 1) % COLORS.length]);
  p.position.y = 0.25;
  const hit = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.8, 6), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.y = 0.9;
  p.add(hit);
  p.visible = false;
  scene.add(p);
  return { p, hit };
});
// Patrouille
const officers = [-0.4, 0.4].map(() => {
  const o = person(0x1b2847);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.08, 10), mat(0x0d1426));
  cap.position.y = 1.33;
  o.add(cap);
  o.scale.setScalar(1.1);
  o.visible = false;
  scene.add(o);
  return o;
});
// Vue "légale" (L) : zones de terrasse (vert) et couloir de passage (rouge), invisibles par défaut
const ghost = new THREE.Group();
{
  const ghostMat = (color) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.22, depthWrite: false });
  const corridor = new THREE.Mesh(new THREE.PlaneGeometry(ZONES.corridorHalfWidth * 2, STREET.length), ghostMat(0xff4040));
  corridor.rotation.x = -Math.PI / 2;
  corridor.position.y = 0.03;
  ghost.add(corridor);
  for (const r of sim.restaurants) {
    const depth = W - ZONES.corridorHalfWidth;
    const zone = new THREE.Mesh(new THREE.PlaneGeometry(depth, r.z1 - r.z0), ghostMat(0x40ff70));
    zone.rotation.x = -Math.PI / 2;
    zone.position.set(r.side * (ZONES.corridorHalfWidth + depth / 2), 0.035, (r.z0 + r.z1) / 2);
    ghost.add(zone);
  }
  const ringGeo = new THREE.RingGeometry(ZONES.tableFootprint - 0.06, ZONES.tableFootprint, 24);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xff2020, transparent: true, opacity: 0.8, depthWrite: false });
  for (const t of S.tables) {
    if (sim.encroachment(t) <= 0) continue;
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.userData.tableId = t.id;
    ghost.add(ring);
  }
  ghost.visible = false;
  scene.add(ghost);
}

const spawn = v3(ANCHORS.policeSpawn);
const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3();
function syncActors() {
  for (const t of S.tables) {
    const v = viewTables.get(t.id);
    v.group.visible = t.out;
    v.group.position.x = t.x; // la police peut recaler une table hors du couloir
    v.people.forEach((p, i) => { p.visible = i < t.count; });
  }
  for (const r of ghost.children) {
    if (!r.userData.tableId) continue;
    const t = sim.table(r.userData.tableId);
    r.visible = t.out && sim.encroachment(t) > 0;
    r.position.set(t.x, 0.04, t.z);
  }
  const wp = sim.waiterPos();
  world.waiter.visible = sim.waiterOnDuty();
  world.waiter.position.set(wp.x, 0, wp.z);
  world.waiter.rotation.y = Math.cos(S.min * ANCHORS.waiter.speed) > 0 ? 0 : Math.PI;
  klaas.userData.figure.visible = sim.klaasAwake();
  cat.visible = sim.catPresent();
  for (const { g, grp } of standingViews) grp.visible = S.min >= g.arriveAt && S.min < g.leaveAt;
  const pees = sim.activePees();
  peeViews.forEach((v, i) => {
    const p = pees[i];
    v.p.visible = !!p;
    v.hit.userData.target = p ? { kind: 'pee', id: p.id } : null;
    if (!p) return;
    const side = Math.sign(p.doorway.x);
    v.p.position.set(p.doorway.x - side * 0.45, 0.25, p.doorway.z);
    v.p.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
  });
  // Patrouille : position interpolée sur l'horloge de la simulation
  const P = S.police;
  officers.forEach((o, i) => {
    o.visible = !!P && P.phase !== 'pending';
    if (!o.visible) return;
    const r = sim.rest(P.restId);
    const dx = i ? 0.4 : -0.4;
    let a = tmpA.set(spawn.x + dx, 0, spawn.z), b = tmpB.set(r.side * 0.4 + dx, 0, (r.z0 + r.z1) / 2), k = 1;
    if (P.phase === 'walking') k = (S.min - P.enterAt) / Math.max(0.01, P.arriveAt - P.enterAt);
    if (P.phase === 'leaving') { [a, b] = [b, a]; k = (S.min - P.leaveAt) / Math.max(0.01, P.exitAt - P.leaveAt); }
    k = clamp(k, 0, 1);
    o.position.lerpVectors(a, b, k);
    o.position.y = k < 1 ? Math.abs(Math.sin(now * 8)) * 0.04 : 0;
    o.rotation.y = Math.atan2(b.x - a.x, b.z - a.z);
  });
}

// ---------- Joueur ----------
const player = { pos: new THREE.Vector3(1.2, 0, 12), yaw: 0, pitch: 0, loc: 'street' };
const keys = new Set();
let locked = false;
let started = false;
let overlay = null;
const timer = new THREE.Timer();
let now = 0;

// ---------- HUD / log ----------
function log(msg, cls = '', min = S.min) {
  const el = document.createElement('div');
  el.className = cls;
  el.textContent = `${fmt(min)} · ${msg}`;
  const box = $('log');
  box.append(el);
  while (box.children.length > 5) box.firstChild.remove();
  setTimeout(() => el.remove(), 8000);
}
function flash() {
  const f = $('flash');
  f.classList.remove('on'); void f.offsetWidth; f.classList.add('on');
}
const bar = (id, v) => { $(id).style.width = `${clamp(v, 0, 100)}%`; };
let noiseDb = NOISE.ambientDb;
function updateHud() {
  $('clock').textContent = fmt(S.min);
  $('clock').classList.toggle('late', S.min >= CLOSE);
  bar('bar-noise', ((noiseDb - NOISE.hudMinDb) / (NOISE.hudMaxDb - NOISE.hudMinDb)) * 100);
  $('val-noise').textContent = `${Math.round(noiseDb)} dB`;
  bar('bar-sleep', S.sleep);
  bar('bar-dossier', (sim.dossierScore() / EVIDENCE.dossierTarget) * 100);
  bar('bar-asso', S.asso);
  bar('bar-risk', S.risk);
  $('where').textContent = player.loc === 'apt' ? (nearWindow() ? 'Chez Pilou · à la fenêtre' : 'Chez Pilou') : 'Rue des Bouchers';
  const hints = [];
  const it = interaction();
  if (S.sleeping) hints.push('Pilou essaie de dormir…  [E] se relever');
  else if (it) hints.push(`[E] ${it.label}`);
  if (nearWindow() && !S.sleeping) hints.push('[P] photo · [F] seau d\'eau (illégal)');
  $('prompt').textContent = hints.join('   ');
  // À la fenêtre : qui pourrait me voir ?
  let wit = '';
  if (nearWindow() && !S.sleeping) {
    const ws = sim.potentialWitnesses(ANCHORS.pilouWindow);
    const named = [...new Set(ws.filter((w) => w.kind !== 'customers').map((w) => w.name))];
    const groups = ws.filter((w) => w.kind === 'customers').length;
    if (groups) named.push(`${groups} groupe(s) de clients`);
    wit = named.length ? `👁 Témoins possibles : ${named.join(', ')}` : '👁 Personne ne regarde.';
  }
  $('witness').textContent = wit;
}

// ---------- Photo ----------
const raycaster = new THREE.Raycaster();
const CENTER = new THREE.Vector2(0, 0);
function photo() {
  if (player.loc === 'apt' && !nearWindow()) return log('Depuis l\'appartement, il faut être à la fenêtre.');
  flash();
  syncCamera();
  scene.updateMatrixWorld();
  raycaster.setFromCamera(CENTER, camera);
  raycaster.far = EVIDENCE.photoRange;
  const hits = [
    ...S.tables.filter((t) => t.out).map((t) => viewTables.get(t.id).hit),
    ...peeViews.filter((v) => v.p.visible).map((v) => v.hit),
  ];
  const hit = raycaster.intersectObjects(hits, false)[0];
  sim.act({ type: 'photo', target: hit?.object.userData.target, distance: hit?.distance, fromWindow: player.loc === 'apt', noiseDb });
}

// ---------- Interactions (la même portée sert à l'invite et à l'action) ----------
const flat = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const nearWindow = () => player.loc === 'apt' && player.pos.x > apt.x1 - 1.6 && Math.abs(player.pos.z - ANCHORS.pilouWindow.z) < INTERACT.window;
function interaction() {
  if (player.loc === 'street') {
    if (flat(player.pos, ANCHORS.streetDoor) < INTERACT.door) return { label: 'Monter chez Pilou', act: () => teleport('apt') };
    if (sim.waiterOnDuty() && flat(player.pos, sim.waiterPos()) < INTERACT.waiter) return { label: 'Demander au serveur de rentrer les tables', act: () => sim.act({ type: 'waiter' }) };
  } else {
    if (flat(player.pos, world.aptDoor) < INTERACT.aptDoor) return { label: 'Descendre dans la rue', act: () => teleport('street') };
    if (flat(player.pos, world.bed) < INTERACT.bed) return { label: S.sleeping ? 'Se relever' : 'Essayer de dormir (accélère la nuit)', act: toggleSleep };
  }
  return null;
}
function teleport(where) {
  player.loc = where;
  if (where === 'apt') player.pos.set(world.aptDoor.x + 0.5, apt.floor, world.aptDoor.z);
  else player.pos.set(ANCHORS.streetDoor.x + 0.6, 0, ANCHORS.streetDoor.z);
  player.yaw = -Math.PI / 2;
  player.pitch = 0;
}
function toggleSleep() {
  sim.act({ type: 'sleep', on: !S.sleeping });
  player.pitch = S.sleeping ? 0.9 : 0;
  if (S.sleeping) log('Pilou se couche. Le temps file…');
}

// ---------- Overlays ----------
function openOverlay(name) {
  overlay = name;
  $(name).classList.remove('hidden');
  if (name === 'dossier') renderDossier();
  if (name === 'phone') {
    const P = S.police;
    $('phone-status').textContent = P ? `Patrouille ${P.phase === 'pending' ? 'en route' : 'sur place'} (appel de ${fmt(P.calledAt)})` : `${S.calls} appel(s) à la police ce soir`;
  }
  document.exitPointerLock?.();
}
function closeOverlay() {
  if (!overlay) return;
  $(overlay).classList.add('hidden');
  overlay = null;
  lock();
}
function lock() {
  if (NOLOCK || S.ended) return;
  try { canvas.requestPointerLock()?.catch?.(() => {}); } catch { /* geste utilisateur requis */ }
}
const qualityLabel = (q) => (q >= 0.85 ? 'nette' : q >= 0.6 ? 'correcte' : 'floue');
function renderDossier() {
  const items = S.evidence.map((e) => `<li><b>${fmt(e.time)}</b> ${e.text} <span class="q">· ${e.type === 'photo' ? `photo ${qualityLabel(e.quality)}` : 'pièce'}${e.legal ? ' · légale' : ' · illégale'}${e.shared ? ' · partagée' : ''}</span></li>`);
  $('dossier-list').innerHTML = items.length ? items.join('') : '<li>Rien pour l\'instant. Visez une table et appuyez sur P.</li>';
  $('dossier-score').textContent = `Score : ${sim.dossierScore().toFixed(1)} / ${EVIDENCE.dossierTarget} · ${S.evidence.length} pièce(s)`;
}
for (const b of document.querySelectorAll('#phone button')) {
  b.addEventListener('click', () => {
    const c = b.dataset.call;
    closeOverlay();
    if (c === 'police') sim.act({ type: 'police' });
    else if (c === 'police-asso') sim.act({ type: 'police', asso: true });
    else if (c === 'asso') sim.act({ type: 'asso' });
    else if (c === 'mairie') sim.act({ type: 'mairie' });
    drainSim();
  });
}

// ---------- Entrées ----------
$('day').textContent = sim.day.label;
$('start').addEventListener('click', () => {
  $('title').classList.add('hidden');
  $('hud').classList.remove('hidden');
  started = true;
  timer.update();
  log(`${sim.day.label.split(' ·')[0]} soir. Les terrasses doivent rentrer à ${RULES.terraceCloseHour}h. En théorie.`);
  lock();
});
canvas.addEventListener('click', () => { if (started && !overlay) lock(); });
$('pause').addEventListener('click', () => lock());
document.addEventListener('pointerlockchange', () => { locked = document.pointerLockElement === canvas; });
let dragging = false;
canvas.addEventListener('mousedown', () => { dragging = true; });
addEventListener('mouseup', () => { dragging = false; });
addEventListener('mousemove', (e) => {
  if (!(locked || (NOLOCK && dragging)) || S.sleeping) return;
  player.yaw -= e.movementX * 0.0022;
  player.pitch = clamp(player.pitch - e.movementY * 0.0022, -1.45, 1.45);
});
const MOVE = { KeyW: 'f', ArrowUp: 'f', KeyS: 'b', ArrowDown: 'b', KeyA: 'l', ArrowLeft: 'l', KeyD: 'r', ArrowRight: 'r' };
addEventListener('keydown', (e) => {
  // e.code = position physique : Z/Q/S/D sur AZERTY = W/A/S/D sur QWERTY.
  if (e.code === 'Tab') e.preventDefault();
  if (!started || S.ended) return;
  if (e.code === 'Escape') return closeOverlay();
  if (e.code === 'Tab') return overlay === 'dossier' ? closeOverlay() : !overlay && openOverlay('dossier');
  if (e.code === 'KeyT') return overlay === 'phone' ? closeOverlay() : !overlay && openOverlay('phone');
  if (overlay || e.repeat) return keys.add(e.code);
  keys.add(e.code);
  if (e.code === 'KeyE') interaction()?.act();
  else if (e.code === 'KeyL') ghost.visible = !ghost.visible;
  else if (S.sleeping) return;
  else if (e.code === 'KeyP') photo();
  else if (e.code === 'KeyF') {
    if (!nearWindow()) log('Le seau, c\'est depuis la fenêtre.');
    else sim.act({ type: 'bucket' });
  }
  drainSim();
});
addEventListener('keyup', (e) => keys.delete(e.code));
addEventListener('blur', () => keys.clear());

// ---------- Déplacement ----------
const fwd = new THREE.Vector3(), right = new THREE.Vector3(), mv = new THREE.Vector3();
function move(dt) {
  if (S.sleeping) return;
  const dir = { f: 0, b: 0, l: 0, r: 0 };
  for (const k of keys) if (MOVE[k]) dir[MOVE[k]] = 1;
  fwd.set(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));
  right.set(Math.cos(player.yaw), 0, -Math.sin(player.yaw));
  mv.set(0, 0, 0).addScaledVector(fwd, dir.f - dir.b).addScaledVector(right, dir.r - dir.l);
  if (mv.lengthSq() === 0) return;
  const speed = keys.has('ShiftLeft') || keys.has('ShiftRight') ? 5.5 : 3.2;
  player.pos.addScaledVector(mv.normalize(), speed * dt);
  const p = player.pos;
  if (player.loc === 'street') {
    p.x = clamp(p.x, -W + 0.35, W - 0.35);
    p.z = clamp(p.z, -HALF + 1, HALF - 1);
    const r = ZONES.tableFootprint + 0.1;
    for (const t of S.tables) {
      if (!t.out) continue;
      const dx = p.x - t.x, dz = p.z - t.z, d = Math.hypot(dx, dz);
      if (d < r && d > 0.001) { p.x = t.x + (dx / d) * r; p.z = t.z + (dz / d) * r; }
    }
  } else {
    // On peut s'avancer dans l'embrasure de la fenêtre pour regarder en bas
    const atWindow = Math.abs(p.z - ANCHORS.pilouWindow.z) < 0.75;
    p.x = clamp(p.x, apt.x0 + 0.3, atWindow ? -W - 0.2 : apt.x1 - 0.25);
    p.z = clamp(p.z, apt.z0 + 0.3, apt.z1 - 0.3);
  }
}

// ---------- Événements de la simulation ----------
const splash = (() => {
  const N = 140;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(N * 3), vel = new Float32Array(N * 3);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const points = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0x9fd3ff, size: 0.12, transparent: true, opacity: 0.8, depthWrite: false }));
  points.visible = false;
  points.frustumCulled = false;
  scene.add(points);
  let life = 0;
  const rnd = (a, b) => a + Math.random() * (b - a); // purement visuel, hors simulation
  return {
    fire(o) {
      for (let i = 0; i < N; i++) {
        pos.set([o.x + rnd(-0.2, 0.2), o.y, o.z + rnd(-0.3, 0.3)], i * 3);
        vel.set([rnd(0.8, 2.2), rnd(-0.5, 1), rnd(-1.2, 1.2)], i * 3);
      }
      life = 1.6;
      points.visible = true;
    },
    update(dt) {
      if (life <= 0) return;
      life -= dt;
      for (let i = 0; i < N; i++) {
        vel[i * 3 + 1] -= 9.8 * dt;
        for (let k = 0; k < 3; k++) pos[i * 3 + k] += vel[i * 3 + k] * dt;
        if (pos[i * 3 + 1] < 0.02) { pos[i * 3 + 1] = 0.02; vel[i * 3] *= 0.5; vel[i * 3 + 1] = 0; vel[i * 3 + 2] *= 0.5; }
      }
      geo.attributes.position.needsUpdate = true;
      if (life <= 0) points.visible = false;
    },
  };
})();
function drainSim() {
  for (const e of sim.drainEvents()) {
    if (e.type === 'log') log(e.text, e.cls, e.min);
    else if (e.type === 'splash') splash.fire(v3(ANCHORS.pilouWindow).setX(-W - 0.1));
    else if (e.type === 'end') showEnd();
  }
  if (overlay === 'dossier') renderDossier();
}

// ---------- Fin de nuit ----------
function showEnd() {
  document.exitPointerLock?.();
  for (const id of ['phone', 'dossier', 'pause']) $(id).classList.add('hidden');
  overlay = null;
  $('hud').classList.add('hidden');
  const R = sim.summary();
  const titles = { time: `${R.time} · la rue se tait (enfin)`, custody: 'Garde à vue', sleep: 'Pilou craque' };
  const li = (s) => `<li>${s}</li>`;
  const rest = R.restaurants.map((r) => li(`<b>${r.name}</b> : ${r.onTime}/${r.total} rentrée(s) à l'heure${r.by.length ? ` · ${r.by.map(([k, n]) => `${n} par ${k}`).join(', ')}` : ''}${r.stillOut ? ` · <span class="bad">${r.stillOut} encore dehors</span>` : r.last ? ` · dernière à ${r.last}` : ''}`));
  const police = R.police.map((p) => li(`Appel ${p.called}${p.asso ? ' (au nom de l\'asso)' : ''}${p.arrived ? ` → ${p.patrol} chez ${p.rest} à ${p.arrived}` : ''} : ${p.outcome}${p.detail ? ` (${p.detail})` : ''}`));
  const wit = R.witnesses.map((w) => li(`${w.time} · ${w.name} a vu le ${w.act}${w.filmed ? ' (et a filmé)' : ''}`));
  $('end-title').textContent = titles[R.reason];
  $('end-body').innerHTML = `
    <p class="verdict">${R.verdict.join('<br/>')}</p>
    <h3>Pilou</h3>
    <ul>${li(`Sommeil ${R.stats.sleep}/100 · Association ${R.stats.asso}/100 · Risque ${R.stats.risk}/100`)}
    ${li(`Dossier : ${R.dossier.score.toFixed(1)}/${R.dossier.target} (${R.dossier.pieces} pièce(s))`)}
    ${li(`Serveur sollicité ${R.waiter.asks} fois (${R.waiter.ok} succès) · Seau d'eau : ${R.bucketUses} · Mairie : ${R.mairie ? 'signalée' : 'non'}`)}</ul>
    <h3>Terrasses</h3><ul>${rest.join('')}</ul>
    <h3>Police municipale</h3><ul>${police.join('') || li('Jamais appelée.')}${li(`<span class="q">De service ce soir : ${R.shifts[0]} jusqu'à ${fmt(POLICE.shiftChange)}, puis ${R.shifts[1]}</span>`)}</ul>
    ${wit.length ? `<h3>Témoins</h3><ul>${wit.join('')}</ul>` : ''}`;
  $('end').classList.remove('hidden');
}

// ---------- Boucle ----------
let hudTimer = 0;
const camPos = new THREE.Vector3();
function update(dt) {
  const running = started && !S.ended && !overlay && (locked || NOLOCK);
  $('pause').classList.toggle('hidden', !started || S.ended || !!overlay || locked || NOLOCK);
  if (!running) return;
  move(dt);
  sim.tick(dt * RULES.gameMinutesPerSecond * (S.sleeping ? RULES.sleepTimeMultiplier : 1));
  drainSim();
  camPos.set(player.pos.x, player.pos.y + 1.65, player.pos.z);
  noiseDb = sim.noiseAt(camPos, player.loc === 'apt');
}

function animate(dt) {
  for (const t of S.tables) {
    if (!t.out) continue;
    for (const p of viewTables.get(t.id).people) p.rotation.y = Math.sin(now * 0.7 + p.userData.phase) * 0.4;
  }
  world.steam.intensity = S.min < NOISE.exhaustOffMinute ? 1 : Math.max(0, world.steam.intensity - dt * 0.3);
  world.steam.update(dt);
  splash.update(dt);
  cat.rotation.y = Math.sin(now * 0.5) * 0.25;
  klaas.userData.pane.material.emissiveIntensity = sim.klaasAwake() ? 0.9 : 0;
}

function syncCamera() {
  camera.position.set(player.pos.x, player.pos.y + 1.65, player.pos.z);
  camera.rotation.set(player.pitch, player.yaw, 0);
  camera.updateMatrixWorld();
}

function frame(ts) {
  timer.update(ts);
  tick(Math.min(timer.getDelta(), 0.1));
  requestAnimationFrame(frame);
}
function tick(dt) {
  now += dt;
  update(dt);
  syncActors();
  animate(dt);
  syncCamera();
  updateSky();
  hudTimer -= dt;
  if (hudTimer <= 0 && started && !S.ended) { updateHud(); hudTimer = 0.1; }
  renderer.render(scene, camera);
}

// Hooks de test (onglet en arrière-plan = pas de requestAnimationFrame) : step(n) avance n frames de 1/30 s ;
// aimAt(tableId) place Pilou dans la rue à 2,5 m de la table, en la regardant ; key(code) simule une touche.
window.__rdb = {
  sim, player, world, seed: SEED,
  step(n = 1, dt = 1 / 30) { for (let i = 0; i < n; i++) tick(dt); return S.min; },
  aimAt(tableId) {
    const t = sim.table(tableId);
    player.loc = 'street';
    player.pos.set(clamp(t.x - Math.sign(t.x) * 2.5, -W + 0.4, W - 0.4), 0, t.z);
    player.yaw = Math.atan2(-(t.x - player.pos.x), -(t.z - player.pos.z));
    player.pitch = -0.3;
  },
  key(code) {
    dispatchEvent(new KeyboardEvent('keydown', { code }));
    dispatchEvent(new KeyboardEvent('keyup', { code }));
  },
};
updateSky();
requestAnimationFrame(frame);
