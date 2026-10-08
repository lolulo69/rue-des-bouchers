// Galerie de debug (dev uniquement : http://localhost:5173/src/art/gallery.html, ajouter ?perf=1 pour le HUD).
// Montre tous les accessoires, effets, états des personnages, portraits, vignettes de jour et sons.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildWorld } from '../world.js';
import { art } from './index.js';
import { audio } from '../audio/index.js';

const canvas = document.getElementById('view');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a2036);
scene.fog = new THREE.Fog(0x1a2036, 25, 110);
scene.add(new THREE.HemisphereLight(0x9fb4ff, 0x3a2a20, 0.6));
const camera = new THREE.PerspectiveCamera(60, 1, 0.05, 400);
const controls = new OrbitControls(camera, canvas);
const world = buildWorld(scene);
window.__gallery = { world, art, scene, camera };
const A = world.anchors;
let vignette = null;

function resize() {
  const r = canvas.getBoundingClientRect();
  renderer.setSize(r.width, r.height, false);
  camera.aspect = r.width / r.height; camera.updateProjectionMatrix();
  vignette?.setAspect(camera.aspect);
}
addEventListener('resize', resize);
resize();

const note = (t) => { document.getElementById('note').textContent = t; };
const look = (from, to) => { vignette = null; camera.position.set(...from); controls.target.set(...to); controls.update(); };
const at = (p, d = [2.5, 1.8, 3]) => look([p.x + (p.x < 0 ? d[0] : -d[0]), d[1], p.z + d[2]], [p.x, p.y + 1, p.z]);
look([2.6, 2.2, -4], [-2.4, 1.2, 4]);

const side = document.getElementById('side');
function section(title, items) {
  const h = document.createElement('h2'); h.textContent = title; side.appendChild(h);
  for (const [label, fn] of items) {
    const b = document.createElement('button'); b.textContent = label;
    b.onclick = () => { document.getElementById('portraits').style.display = 'none'; try { fn(); note(label); } catch (e) { note('Erreur : ' + e.message); console.error(e); } };
    side.appendChild(b);
  }
}
const t0 = world.tables.find((t) => t.rest.id === 'bernadette') ?? world.tables[0];

section('Vues', [
  ['Terrasse Bernadette', () => look([2.6, 2.2, A.bernadetteDoor.z - 3], [-2.4, 1.2, A.bernadetteDoor.z + 5])],
  ['Fenêtre de Pilou', () => look([world.window.pos.x + 0.2, world.window.pos.y + 0.8, world.window.pos.z], [-1.5, 0.5, world.window.pos.z - 2])],
  ['Balcon Seb & Nico', () => at(A.balcony, [2.5, A.balcony.y + 0.5, 1])],
  ['Place Maurice-Schumann', () => look([0, 3, A.square.z - 18], [0, 4, A.square.z + 8])],
  ['Klaas (fenêtre sur la place)', () => look([A.klaasWindow.x, A.klaasWindow.y, A.klaasWindow.z - 3], [A.klaasWindow.x, A.klaasWindow.y - 0.2, A.klaasWindow.z])],
]);
section('Accessoires (art.props.place)', [
  ...art.props.kinds.map((k) => [k, () => { const h = art.props.place(k); at(h.object.position); }]),
  ['line (A → B)', () => { art.props.line('pilouSill', A.bernadetteDoor.clone().setY(2.3), { color: 0xff7a1a }); at(A.pilouSill, [3, 4, 2]); }],
  ['tout enlever', () => art.props.clear()],
]);
section('Effets (art.fx)', [
  ['splash (seau)', () => { at(A.bernadetteDoor, [3, 3, 4]); setTimeout(() => art.fx.splash(world.window.pos.clone().setX(world.window.pos.x + 0.3)), 300); }],
  ['stink (boule puante)', () => { at(t0.group.position); art.fx.stink(t0.group.position); }],
  ['hotte bouchée (carton)', () => { art.props.place('cardboard'); art.fx.exhaustBlocked(true); at(A.bernadetteDoor, [3.5, 3, 3]); }],
  ['hotte débouchée', () => art.fx.exhaustBlocked(false)],
  ['fumée', () => art.fx.smoke(t0.group.position.clone().setY(1), { duration: 6 })],
]);
const play = (id, st, o) => () => { art.anim.play(id, st, o); const p = art.anim.get(id); at(p.getWorldPosition(new THREE.Vector3())); };
section('Personnages (art.anim)', [
  ['Klaas : jumelles', () => { art.anim.play('klaas', 'binoculars'); look([A.klaasWindow.x, A.klaasWindow.y, A.klaasWindow.z - 3], [A.klaasWindow.x, A.klaasWindow.y - 0.2, A.klaasWindow.z]); }],
  ['Klaas : carnet', () => art.anim.play('klaas', 'write')],
  ['Ronde de 22h (Jérémie + Biloute)', () => { art.anim.round(true); at(A.roundPath[0], [3, 3, -3]); }],
  ['Biloute aboie', play('biloute', 'bark', { seconds: 4 })],
  ['Serveur : pause clope', play('serveur', 'smoke')],
  ['Ghislain nettoie le store', play('ghislain', 'clean')],
  ['Ghislain : cadenas collé', () => { art.props.place('chain-lock').set({ glued: true }); play('ghislain', 'struggle')(); }],
  ['Dédé accueille la police', play('dede', 'greet')],
  ['Enveloppe Dédé → Lemaire', () => { art.props.place('police-coffee'); const s = art.anim.envelope('dede', 'lemaire'); at(s.giver.position); }],
  ['Patrouille à pied (Benali)', () => { const p = art.anim.spawn('benali', { at: A.patrolPath[0] }); art.anim.patrol(p); look([2, 3, A.patrolPath[0].z + 10], [0, 1, A.patrolPath[0].z + 2]); }],
  ['Patrouille à vélo (samedi)', () => { const p = art.anim.spawn('lemaire', { at: A.patrolPath[0] }); art.anim.patrol(p, { bike: true }); look([2, 3, A.patrolPath[0].z + 12], [0, 1, A.patrolPath[0].z + 2]); }],
  ['Delphine : mètre ruban', () => { art.anim.spawn('delphine', { at: { x: -1.2, z: A.bernadetteDoor.z + 3 }, face: Math.PI / 2 }); play('delphine', 'measure', { length: 2.2 })(); }],
  ['Delphine : porte-bloc', play('delphine', 'clipboard')],
  ['Tatie à sa fenêtre', play('tatie', 'window')],
  ['Expressions Dédé (en boucle)', () => { const ex = art.expressions; let i = 0; const p = art.anim.get('dede'); at(p.position, [1.6, 1.4, 0]); const id = setInterval(() => { art.anim.expr('dede', ex[i++ % ex.length]); note('Dédé : ' + ex[(i - 1) % ex.length]); if (i > ex.length * 2) clearInterval(id); }, 1200); }],
  ['tout remettre', () => { for (const id of Object.keys(world.cast)) try { art.anim.stop(id); } catch { /* */ } art.anim.round(false); }],
]);
section('Terrasses (art.terrace)', [
  ['chaise qui s\'effondre', () => { art.terrace.collapse(t0, 0, { recover: 8 }); at(t0.group.position); }],
  ['laxatifs : course aux toilettes', () => { art.terrace.rush(t0, 3, { returnAfter: 10 }); at(A.bernadetteDoor, [3, 2.4, 3]); }],
  ['la foule filme', () => { art.terrace.film(true, { share: 0.6 }); at(t0.group.position); }],
  ['la foule arrête de filmer', () => art.terrace.film(false)],
  ['parasols volés', () => { art.terrace.parasols('bernadette', false); at(t0.group.position); }],
  ['parasols rendus', () => art.terrace.parasols('bernadette', true)],
]);
section('Portraits (art.portrait)', [['grille de tous les portraits', () => {
  const box = document.getElementById('portraits');
  box.style.display = 'block';
  const ex = art.portraitExpressions;
  box.innerHTML = `<table><tr><th></th>${ex.map((e) => `<th>${e}</th>`).join('')}</tr>${art.portraitIds().map((id) => `<tr><th>${id}</th>${ex.map((e) => `<td><img src="${art.portrait(id, e)}" alt="${id} ${e}"></td>`).join('')}</tr>`).join('')}</table>`;
}]]);
section('Vignettes de jour (art.scenes)', [
  ['Koddex (matin)', () => { vignette = art.scenes.koddex(); resize(); }],
  ['Atelier d\'Hippolyte (après-midi)', () => { vignette = art.scenes.atelier(); resize(); }],
  ['Mairie (commission J14)', () => { vignette = art.scenes.mairie(); resize(); }],
  ['retour à la rue', () => { vignette = null; }],
]);
section('Sons (audio.play / loop)', [
  ...audio.sounds.map((s) => [s, () => audio.play(s, { gain: 1 })]),
  ...audio.loops.flatMap((l) => [[`${l} ▶`, () => audio.loop(l, true)], [`${l} ■`, () => audio.loop(l, false)]]),
  ['mode jour', () => audio.mode('day')], ['mode nuit', () => audio.mode('night')],
]);

const clock = new THREE.Clock();
function frame() {
  const dt = Math.min(0.1, clock.getDelta());
  world.steam.update(dt);
  if (vignette) { vignette.update(dt); renderer.render(vignette.scene, vignette.camera); }
  else { controls.update(); renderer.render(scene, camera); }
  requestAnimationFrame(frame);
}
frame();
