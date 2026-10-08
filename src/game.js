// Le jeu (chargé par main.js, l'amorce : écran de chargement, écran d'erreur). Rendu + entrées + HUD. Toute la logique de jeu vit dans src/sim (testée sans navigateur) :
// main.js lit sim.state pour dessiner, et envoie les actions du joueur via sim.act().
import * as THREE from 'three';
import { buildWorld } from './world.js';
import { createDirector } from './scene/director.js';
import { RULES, SKY, STREET, NOISE, EVIDENCE, INTERACT, ZONES, POLICE } from './config.js';
import { createSim, makeConfig, fmt, createCampaign, contentFromGlob, checkSave } from './sim/index.js';
import * as narrative from './sim/narrative.js';
import { createRng } from './sim/rng.js';
import { WHATSAPP_GROUP } from './content/characters.js';

const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const params = new URLSearchParams(location.search);
// ?nolock=1 : pas de pointer lock (tests automatisés) · ?day=sat : samedi · ?seed=42 : soirée rejouable
const NOLOCK = params.has('nolock');
const SEED = Number(params.get('seed')) || (Date.now() % 1e9);
const cfg = makeConfig();
const ANCHORS = cfg.ANCHORS; // même objet que celui de la simulation (recalé sur le décor plus bas)
// ---------- Campagne (§3) ----------
// Le jour (matin, après-midi, récap) est une interface 2D au-dessus de la scène (src/ui, agent UI ; repli : dayFallback.js).
// Chaque nuit démarre d'une sauvegarde et d'un rechargement (?mode=night) : nouvelle disposition, nouveau décor.
// Emplacement de sauvegarde fixe (partagé avec src/ui) ; la version du schéma est DANS la sauvegarde (saveMigrations.js)
const SAVE_KEY = 'rdb.save.v1';
const content = contentFromGlob(import.meta.glob('./content/*.js', { eager: true }));
const loadSave = () => { try { return JSON.parse(localStorage.getItem(SAVE_KEY)); } catch { return null; } };
const storeSave = (c) => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(c.save())); } catch { /* stockage indisponible */ } };
const openCampaign = (save) => { try { return createCampaign({ content, cfg, save, narrative }); } catch { return null; } };

// Narration de la nuit (src/sim/narrative.js), avec son propre RNG : le texte ne change jamais l'issue de la nuit.
const narrRng = createRng((SEED ^ 0x5bd1e995) >>> 0);
function narrator(kind, s, a) {
  switch (kind) {
    case 'police': return narrative.policeLine(a.outcome, a.patrolId, { ...narrative.nightCtx.police(s, a.entry ?? {}), asso: !!a.asso }, narrRng);
    case 'waiter': return narrative.pickNightLine('waiter', s, narrRng, { result: a.result, metWaiter: !!campaign?.has('met_waiter') });
    case 'witness': return narrative.pickNightLine('witness', s, narrRng, a.witness ? { witness: a.witness } : {});
    case 'end': return narrative.pickNightLine('end', s, narrRng, { reason: a.reason });
    case 'klaas': { const e = narrative.klaasEntry(a.event, a.detection, narrRng); return e ? `📓 Carnet de Klaas : ${e.text}` : null; }
    default: return null;
  }
}
let campaign = null;
{
  const saved = loadSave();
  if (params.get('mode') === 'night' && saved?.step === 'night') campaign = openCampaign(saved);
}
// Nuit libre : ?day= accepte les 7 jours (mon…sun, ou lundi…dimanche). Le jour choisit le roster de police ;
// le samedi joue la variante « sans voitures ».
const FREE_DAY = (() => {
  const d = (params.get('day') || 'mon').toLowerCase();
  const fr = { lundi: 'mon', mardi: 'tue', mercredi: 'wed', jeudi: 'thu', vendredi: 'fri', samedi: 'sat', dimanche: 'sun' };
  const k = fr[d] ?? d;
  return cfg.CAMPAIGN.weekdays.includes(k) ? k : 'mon';
})();
const sim = campaign ? campaign.createNight({ narrator }) : createSim({ seed: SEED, day: FREE_DAY === 'sat' ? 'sat' : 'mon', weekday: FREE_DAY, cfg, narrator });
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
  ...(world.anchors?.balcony && { balcony: { ...xyz(world.anchors.balcony), y: world.anchors.balcony.y + 1.5 } }), // [art v0.3] yeux de Seb & Nico
});
for (const v of world.tables) v.hit.userData.target = { kind: 'table', id: v.id };

// ---------- Acteurs, accessoires, effets : le metteur en scène (src/scene/director.js) ----------
const director = createDirector({ scene, world, art: world.art, audio: world.audio });

// ---------- Joueur ----------
const player = { pos: new THREE.Vector3(1.2, 0, ANCHORS.streetDoor.z + 6), yaw: 0, pitch: 0, loc: 'street' };
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
// Tutoriel (campagne) : chaque déclencheur ne s'affiche qu'une fois (mémorisé dans la sauvegarde)
const tutoDone = new Set();
function tuto(trigger) {
  if (!campaign || tutoDone.has(trigger)) return;
  tutoDone.add(trigger);
  const t = campaign.tutorial(trigger);
  if (t) log(`💡 ${t.text}`, 'tuto');
}
// Cloche de 22h (21:55, 22:00, 22:05) et bribes de terrasse quand Pilou est près des tables
const bell = { before: false, strike: false, after: false, outAt22: null };
let nextBark = 20;
function ambientLines(dt) {
  const m = S.min;
  if (!bell.before && m >= CLOSE - 5) { bell.before = true; log(narrative.pickNightLine('bell:before', sim, narrRng)); }
  if (!bell.strike && m >= CLOSE) { bell.strike = true; bell.outAt22 = S.tables.filter((t) => t.out).length; log(narrative.pickNightLine('bell:strike', sim, narrRng)); tuto('bell_22'); }
  if (!bell.after && m >= CLOSE + 5) { bell.after = true; log(narrative.pickNightLine('bell:after', sim, narrRng, { outAt22: bell.outAt22 })); }
  nextBark -= dt;
  if (nextBark <= 0) {
    nextBark = 20 + narrRng.next() * 20;
    const near = S.tables.some((t) => t.out && Math.hypot(t.x - player.pos.x, t.z - player.pos.z) < (player.loc === 'apt' ? 10 : 6));
    if (near) log(narrative.pickNightLine('bark', sim, narrRng), 'bark');
  }
  if (S.tipoffs.length) tuto('first_tipoff');
  if (S.policeLog.some((p) => p.outcome === 'complaisance')) tuto('first_complaisance');
  if (S.witnessMemories.length) tuto('first_witness');
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
  if (it?.label === 'Monter chez Pilou') tuto('near_door');
  if (it?.label?.startsWith('Essayer de dormir')) tuto('bed');
  if (nearWindow()) { tuto('at_window'); if (S.min >= CLOSE) tuto('near_bucket'); }
  if (nearWindow() && !S.sleeping) hints.push('[P] photo · [F] seau d’eau (illégal)');
  $('prompt').textContent = hints.join('   ');
  // À la fenêtre : qui pourrait me voir ?
  let wit = '';
  if (nearWindow() && !S.sleeping) {
    const ws = sim.potentialWitnesses(ANCHORS.pilouWindow);
    const named = [...new Set(ws.filter((w) => w.kind !== 'customers').map((w) => w.name))];
    const groups = ws.filter((w) => w.kind === 'customers').length;
    if (groups) named.push(`${groups} groupe(s) de clients`);
    wit = named.length ? `👁 Témoins possibles : ${named.join(', ')}` : '👁 Personne ne regarde.';
  }
  $('witness').textContent = wit;
}

// ---------- Photo ----------
const raycaster = new THREE.Raycaster();
const CENTER = new THREE.Vector2(0, 0);
function photo() {
  if (player.loc === 'apt' && !nearWindow()) return log('Depuis l’appartement, il faut être à la fenêtre.');
  flash();
  syncCamera();
  scene.updateMatrixWorld();
  raycaster.setFromCamera(CENTER, camera);
  raycaster.far = EVIDENCE.photoRange;
  const hits = [
    ...S.tables.filter((t) => t.out).map((t) => viewTables.get(t.id).hit),
    ...director.hitTargets(), // pipis, policiers
  ];
  const hit = raycaster.intersectObjects(hits, false)[0];
  const target = hit?.object.userData.target;
  const r = sim.act({ type: 'photo', target, distance: hit?.distance, fromWindow: player.loc === 'apt', noiseDb });
  if (r.ok) { tuto('first_photo'); if (r.found.some((f) => f.quality < 0.6)) tuto('first_photo_blurry'); }
  else if (target?.kind === 'table' && sim.encroachment(sim.table(target.id)) > 0) tuto('corridor_needs_measure');
}

// ---------- Interactions (la même portée sert à l'invite et à l'action) ----------
const flat = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const nearWindow = () => player.loc === 'apt' && player.pos.x > apt.x1 - 1.6 && Math.abs(player.pos.z - ANCHORS.pilouWindow.z) < INTERACT.window;
function interaction() {
  if (player.loc === 'street') {
    if (flat(player.pos, ANCHORS.streetDoor) < INTERACT.door) return { label: 'Monter chez Pilou', act: () => teleport('apt') };
    if (sim.waiterOnDuty() && flat(player.pos, sim.waiterPos()) < INTERACT.waiter) return { label: 'Demander au serveur de rentrer les tables', act: () => { tuto('first_waiter'); sim.act({ type: 'waiter' }); } };
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
  if (name === 'nightmenu') renderNightMenu();
  if (name === 'phone') tuto('first_phone');
  if (name === 'dossier') tuto('first_dossier');
  if (name === 'phone') {
    const P = S.police;
    const status = P ? `Patrouille ${P.phase === 'pending' ? 'en route' : 'sur place'} (appel de ${fmt(P.calledAt)})` : `${S.calls} appel(s) à la police ce soir`;
    // Klaas a déduit le planning des patrouilles de son carnet (roster_known) : qui est de service ce soir
    const roster = campaign?.has('roster_known')
      ? ` · Carnet de Klaas : ${(cfg.POLICE.roster[sim.weekday] ?? []).map((id, i) => `${cfg.POLICE.patrols[id].name} ${i ? 'après' : 'avant'} ${fmt(cfg.POLICE.shiftChange)}`).join(', ')}`
      : '';
    $('phone-status').textContent = status + roster;
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
  $('dossier-list').innerHTML = items.length ? items.join('') : '<li>Rien pour l’instant. Visez une table et appuyez sur P.</li>';
  $('dossier-score').textContent = `Score : ${sim.dossierScore().toFixed(1)} / ${EVIDENCE.dossierTarget} · ${S.evidence.length} pièce(s)`;
}
document.querySelector('#phone [data-call=asso]').textContent = `💬 Groupe WhatsApp « ${WHATSAPP_GROUP} »`;
for (const b of document.querySelectorAll('#phone button')) {
  b.addEventListener('click', () => {
    const c = b.dataset.call;
    closeOverlay();
    if (c === 'police' || c === 'police-asso') tuto('first_police_call');
    if (c === 'police') sim.act({ type: 'police' });
    else if (c === 'police-asso') sim.act({ type: 'police', asso: true });
    else if (c === 'asso') sim.act({ type: 'asso' });
    else if (c === 'mairie') sim.act({ type: 'mairie' });
    drainSim();
  });
}

// ---------- Entrées ----------
const WEEKDAY = { mon: 'lundi', tue: 'mardi', wed: 'mercredi', thu: 'jeudi', fri: 'vendredi', sat: 'samedi', sun: 'dimanche' };
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const nightLabel = () => (campaign
  ? `Jour ${campaign.state.day} · ${WEEKDAY[campaign.weekday()]}${campaign.isSaturday() ? ' (sans voitures)' : ''}`
  : `${cap(WEEKDAY[sim.weekday])} · nuit libre${sim.day.key === 'sat' ? ' (sans voitures)' : ''}`);
$('day').textContent = nightLabel();
function startNight() {
  $('title').classList.add('hidden');
  $('hud').classList.remove('hidden');
  started = true;
  timer.update();
  log(`${nightLabel().split(' (')[0]}, le soir. Les terrasses doivent rentrer à ${RULES.terraceCloseHour}h. En théorie.`);
  tuto('night_start');
  lock();
}
$('start').addEventListener('click', startNight);

// Écran titre : « Campagne » ouvre l'interface de jour (src/ui, agent UI : nouvelle partie / continuer / intro) ;
// « Nuit libre » joue une soirée isolée. En mode nuit de campagne, juste « Commencer la nuit ».
// L'interface reçoit le moteur avec notre config (ancres recalées sur le décor) et la narration.
const engine = { content, createCampaign: (o) => createCampaign({ ...o, cfg, narrative }) };
let dayUI = null;
function goNight(c) {
  // La nuit se joue après un rechargement : nouvelle disposition des terrasses, nouveau décor
  localStorage.setItem(SAVE_KEY, JSON.stringify(c.save()));
  const q = new URLSearchParams(location.search);
  q.set('mode', 'night');
  location.search = q.toString();
  return new Promise(() => {}); // la page se recharge
}
// Chargée à la demande (import dynamique) : ui.html partage ce module, et un import statique ferait atterrir
// le code du jeu 3D dans le chunk commun (il s'exécuterait sur ui.html, sans canvas).
async function showDay({ resume = false } = {}) {
  $('title').classList.add('hidden');
  $('hud').classList.add('hidden');
  document.exitPointerLock?.();
  const UI = await import('./ui/index.js');
  dayUI ??= UI.mount(engine, { onNight: goNight, seed: SEED, autoContinue: resume });
  dayUI.show();
}
if (campaign) {
  // Pas d'écran titre en campagne (QA U6) : la nuit démarre tout de suite. Le navigateur exige un clic pour capturer
  // la souris et lancer le son : c'est l'overlay de pause, qui montre les commandes la première nuit seulement.
  $('title').classList.add('hidden');
  $('pause-text').textContent = `${nightLabel()} · cliquez pour descendre dans la rue`;
  if (campaign.state.nightCount === 0) $('pause-keys').append($('title').querySelector('.keys').cloneNode(true));
  $('pause').addEventListener('click', () => { $('pause-text').textContent = 'Pause. Cliquez pour reprendre.'; $('pause-keys').replaceChildren(); }, { once: true });
  startNight();
} else {
  // Sauvegarde impossible à reprendre (trop ancienne, d'une version plus récente, abîmée) : on le dit gentiment,
  // on la met de côté (rdb.save.backup) et l'interface propose une nouvelle campagne.
  const verdict = checkSave(loadSave());
  if (!verdict.ok && verdict.message) {
    try { localStorage.setItem('rdb.save.backup', localStorage.getItem(SAVE_KEY)); localStorage.removeItem(SAVE_KEY); } catch { /* stockage indisponible */ }
    $('save-notice').textContent = verdict.message;
    $('save-notice').classList.remove('hidden');
  }
  $('campaign').addEventListener('click', () => showDay());
  $('start').textContent = 'Nuit libre (une soirée isolée)';
}
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
  if (e.code === 'KeyN' && campaign) return overlay === 'nightmenu' ? closeOverlay() : !overlay && openOverlay('nightmenu');
  if (overlay || e.repeat) return keys.add(e.code);
  keys.add(e.code);
  if (e.code === 'KeyE') interaction()?.act();
  else if (e.code === 'KeyL') { director.toggleLegalView(); tuto('legal_view_toggle'); }
  else if (S.sleeping) return;
  else if (e.code === 'KeyP') photo();
  else if (e.code === 'KeyB') sim.act({ type: 'db', noiseDb, fromWindow: player.loc === 'apt' });
  else if (e.code === 'KeyF') {
    if (!nearWindow()) log('Le seau, c’est depuis la fenêtre.');
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
function drainSim() {
  for (const e of sim.drainEvents()) {
    director.onEvent(e); // éclaboussure, crochets art des actions de nuit…
    if (e.type === 'log') log(e.text, e.cls, e.min);
    else if (e.type === 'end') (campaign ? endCampaignNight : showEnd)();
  }
  if (overlay === 'dossier') renderDossier();
}

// ---------- Fin de nuit ----------
function endCampaignNight() {
  document.exitPointerLock?.();
  for (const id of ['phone', 'dossier', 'pause', 'nightmenu']) $(id).classList.add('hidden');
  overlay = null;
  campaign.finishNight(sim);
  storeSave(campaign);
  const q = new URLSearchParams(location.search);
  q.delete('mode');
  history.replaceState(null, '', `${location.pathname}${q.size ? `?${q}` : ''}`);
  showDay({ resume: true }); // l'interface reprend la sauvegarde : le bilan de la nuit
}

// Actions de nuit du contenu (N) : boule puante, carton sur la hotte… selon l'endroit où se trouve Pilou
function nightActionsHere() {
  if (!campaign) return [];
  return campaign.nightActions(sim).filter((a) => (a.at === 'pilouWindow' ? nearWindow() : a.at === 'street' ? player.loc === 'street' : true));
}
function openNightEvent(ev) {
  openOverlay('nightmenu');
  $('nightmenu').querySelector('h2').textContent = ev.data.title ?? 'Cette nuit';
  const list = $('nightmenu-list');
  list.innerHTML = '';
  const p = document.createElement('p');
  p.textContent = ev.data.text ?? '';
  list.append(p);
  for (const ch of ev.choices) {
    const b = document.createElement('button');
    b.textContent = ch.label;
    b.disabled = !ch.available;
    b.addEventListener('click', () => {
      const result = campaign.resolveNightEvent(sim, ch.i);
      closeOverlay();
      if (result) log(result, '', S.min);
      drainSim();
    });
    list.append(b);
  }
}
function renderNightMenu() {
  $('nightmenu').querySelector('h2').textContent = 'Actions de nuit';
  const list = $('nightmenu-list');
  list.innerHTML = '';
  const acts = nightActionsHere();
  if (!acts.length) list.innerHTML = '<p class="note">Rien à faire ici pour l’instant.</p>';
  for (const a of acts) {
    const b = document.createElement('button');
    b.textContent = `${a.label}${a.legality === 'illegal' ? ' (illégal)' : a.legality === 'grey' ? ' (limite)' : ''}`;
    b.addEventListener('click', () => { closeOverlay(); campaign.doNightAction(sim, a.id); drainSim(); });
    list.append(b);
  }
}

function showEnd() {
  document.exitPointerLock?.();
  for (const id of ['phone', 'dossier', 'pause']) $(id).classList.add('hidden');
  overlay = null;
  $('hud').classList.add('hidden');
  const R = sim.summary();
  const titles = { time: `${R.time} · la rue se tait (enfin)`, custody: 'Garde à vue', sleep: 'Pilou craque' };
  const li = (s) => `<li>${s}</li>`;
  const rest = R.restaurants.map((r) => li(`<b>${r.name}</b> : ${r.onTime}/${r.total} rentrée(s) à l’heure${r.by.length ? ` · ${r.by.map(([k, n]) => `${n} par ${k}`).join(', ')}` : ''}${r.stillOut ? ` · <span class="bad">${r.stillOut} encore dehors</span>` : r.last ? ` · dernière à ${r.last}` : ''}`));
  const police = R.police.map((p) => li(`Appel ${p.called}${p.asso ? ' (au nom de l’asso)' : ''}${p.arrived ? ` → ${p.patrol} chez ${p.rest} à ${p.arrived}` : ''} : ${p.outcome}${p.detail ? ` (${p.detail})` : ''}`));
  const wit = R.witnesses.map((w) => li(`${w.time} · ${w.name} a vu le ${w.act}${w.filmed ? ' (et a filmé)' : ''}`));
  $('end-title').textContent = titles[R.reason];
  $('end-body').innerHTML = `
    <p class="verdict">${R.verdict.join('<br/>')}</p>
    <h3>Pilou</h3>
    <ul>${li(`Sommeil ${R.stats.sleep}/100 · Association ${R.stats.asso}/100 · Risque ${R.stats.risk}/100`)}
    ${li(`Dossier : ${R.dossier.score.toFixed(1)}/${R.dossier.target} (${R.dossier.pieces} pièce(s))`)}
    ${li(`Serveur sollicité ${R.waiter.asks} fois (${R.waiter.ok} succès) · Seau d’eau : ${R.bucketUses} · Mairie : ${R.mairie ? 'signalée' : 'non'}`)}</ul>
    <h3>Terrasses</h3><ul>${rest.join('')}</ul>
    <h3>Police municipale</h3><ul>${police.join('') || li('Jamais appelée.')}${li(`<span class="q">De service ce soir : ${R.shifts[0]} jusqu’à ${fmt(POLICE.shiftChange)}, puis ${R.shifts[1]}</span>`)}</ul>
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
  ambientLines(dt);
  sim.tick(dt * RULES.gameMinutesPerSecond * (S.sleeping ? RULES.sleepTimeMultiplier : 1));
  camPos.set(player.pos.x, player.pos.y + 1.65, player.pos.z);
  noiseDb = sim.noiseAt(camPos, player.loc === 'apt');
}

function syncCamera() {
  camera.position.set(player.pos.x, player.pos.y + 1.65, player.pos.z);
  camera.rotation.set(player.pitch, player.yaw, 0);
  camera.updateMatrixWorld();
}

let firstFrame = true;
function frame(ts) {
  if (firstFrame) { firstFrame = false; window.__rdbLoaded?.(); } // l'écran de chargement s'efface après la 1re image
  timer.update(ts);
  const d = timer.getDelta();
  tick(Number.isFinite(d) ? Math.min(Math.max(d, 0), 0.1) : 0); // 1re frame : delta parfois NaN
  requestAnimationFrame(frame);
}
function tick(dt) {
  now += dt;
  update(dt);
  drainSim(); // à chaque frame, même en pause : aucun événement de la simulation n'est perdu
  // Événement de nuit à son heure (campaign.nightEventDue) : le jeu se met en pause sur la carte
  if (campaign && !overlay && !S.ended) { const ev = campaign.nightEventDue?.(sim); if (ev) openNightEvent(ev); }
  director.update(sim, campaign?.state, dt);
  syncCamera();
  updateSky();
  hudTimer -= dt;
  // !(> 0) plutôt que <= 0 : un NaN accidentel ne doit pas figer le HUD pour toute la nuit
  if (!(hudTimer > 0) && started && !S.ended) { updateHud(); hudTimer = 0.1; }
  renderer.render(scene, camera);
}

// Hooks de test (onglet en arrière-plan = pas de requestAnimationFrame) : step(n) avance n frames de 1/30 s ;
// aimAt(tableId) place Pilou dans la rue à 2,5 m de la table, en la regardant ; key(code) simule une touche.
window.__rdb = {
  sim, player, world, seed: SEED,
  get campaign() { return dayUI?.campaign ?? campaign; },
  get ui() { return dayUI; },
  goNight: () => goNight(dayUI.campaign),
  saveKey: SAVE_KEY,
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
