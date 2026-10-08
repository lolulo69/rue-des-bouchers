import * as THREE from 'three';
import { buildWorld, person, mat } from './world.js';
import { RULES, SKY, RESTAURANTS, STREET, NOISE, SLEEP, EVIDENCE, POLICE, WAITER, BUCKET, RISK, ASSO } from './config.js';

const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);
const fmt = (m) => {
  const h = Math.floor(m / 60) % 24, mm = Math.floor(m % 60);
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
};
const CLOSE = RULES.terraceCloseHour * 60;
const LATE = CLOSE + RULES.lateGraceMinutes;
// ?nolock=1 : pas de pointer lock (tests automatisés, captures d'écran)
const NOLOCK = new URLSearchParams(location.search).has('nolock');

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

const world = buildWorld(scene);
const { tables, apt } = world;
const W = STREET.halfWidth;
const HALF = STREET.length / 2;
const REST = Object.fromEntries(RESTAURANTS.map((r) => [r.id, { ...r }]));
for (const t of tables) t.rest = REST[t.rest.id];

// ---------- État ----------
const S = {
  started: false, ended: false, overlay: null, sleeping: false,
  min: RULES.nightStart,
  sleep: SLEEP.start, asso: ASSO.start, risk: RISK.start,
  evidence: [], calls: 0, police: null, policeLog: [],
  bucketUses: 0, bucketReadyAt: 0, waiterReadyAt: 0, waiterAsks: [], mairieSent: false,
  loc: 'street', noiseDb: NOISE.ambientDb,
};

const player = { pos: new THREE.Vector3(1.2, 0, 12), yaw: 0, pitch: 0 };
window.__rdb = { S, tables, player, world }; // debug console
const keys = new Set();
let locked = false;
const timer = new THREE.Timer();
let now = 0; // secondes réelles depuis le chargement

// Planning de rangement : chaque table, selon la conformité de son resto, rentre à l'heure ou bien plus tard.
for (const t of tables) {
  t.clearAt = Math.random() < t.rest.compliance ? CLOSE - 5 + rand(0, 5 + RULES.lateGraceMinutes) : rand(...t.rest.lateClear);
}

// ---------- HUD / log ----------
function log(msg, cls = '') {
  const el = document.createElement('div');
  el.className = cls;
  el.textContent = `${fmt(S.min)} · ${msg}`;
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
function updateHud() {
  $('clock').textContent = fmt(S.min);
  $('clock').classList.toggle('late', S.min >= CLOSE);
  bar('bar-noise', ((S.noiseDb - NOISE.hudMinDb) / (NOISE.hudMaxDb - NOISE.hudMinDb)) * 100);
  $('val-noise').textContent = `${Math.round(S.noiseDb)} dB`;
  bar('bar-sleep', S.sleep);
  bar('bar-dossier', (dossierScore() / EVIDENCE.dossierTarget) * 100);
  bar('bar-asso', S.asso);
  bar('bar-risk', S.risk);
  $('where').textContent = S.loc === 'apt' ? (nearWindow() ? 'Chez Pilou · à la fenêtre' : 'Chez Pilou') : 'Rue des Bouchers';
  const hints = [];
  const it = interaction();
  if (S.sleeping) hints.push('Pilou essaie de dormir…  [E] se relever');
  else if (it) hints.push(`[E] ${it.label}`);
  if (S.loc === 'apt' && nearWindow() && !S.sleeping) hints.push('[P] photo · [F] seau d\'eau (illégal)');
  $('prompt').textContent = hints.join('   ');
}

// ---------- Bruit ----------
const tmpV = new THREE.Vector3();
const dbAt = (L, p, src) => L - 20 * Math.log10(Math.max(1, p.distanceTo(src)));
const clatters = [];
function noiseAt(p, indoor) {
  const boost = (S.min >= NOISE.lateBoostAfter ? NOISE.lateBoostDb : 0) + (S.min >= NOISE.drunkAfter ? NOISE.drunkBoostDb : 0);
  let outside = 0;
  for (const t of tables) {
    if (!t.out) continue;
    tmpV.copy(t.group.position).setY(1.1);
    outside += 10 ** (dbAt(NOISE.personDb + boost + 10 * Math.log10(t.count), p, tmpV) / 10);
  }
  for (const c of clatters) outside += 10 ** (dbAt(NOISE.clatterDb, p, c.pos) / 10);
  if (S.min < NOISE.exhaustOffMinute) outside += 10 ** (dbAt(NOISE.exhaustDb, p, world.exhaust) / 10);
  const att = indoor ? 10 ** (-NOISE.indoorAttenuationDb / 10) : 1;
  return 10 * Math.log10(10 ** (NOISE.ambientDb / 10) + outside * att);
}
const bedEar = world.bed.clone().setY(apt.floor + 0.6);

// ---------- Dossier ----------
const dossierScore = (restId) => S.evidence.filter((e) => !restId || e.restId === restId).reduce((s, e) => s + e.value, 0);
function addEvidence(e) {
  S.evidence.push({ time: S.min, shared: false, legal: true, ...e });
  if (S.overlay === 'dossier') renderDossier();
}
const qualityLabel = (q) => (q >= 0.85 ? 'nette' : q >= 0.6 ? 'correcte' : 'floue');
function renderDossier() {
  const items = S.evidence.map((e) => `<li><b>${fmt(e.time)}</b> ${e.text} <span class="q">· ${e.type === 'photo' || e.photo ? `photo ${qualityLabel(e.quality)}` : 'pièce'}${e.legal ? ' · légale' : ' · illégale'}</span></li>`);
  $('dossier-list').innerHTML = items.length ? items.join('') : '<li>Rien pour l\'instant. Visez une table et appuyez sur P.</li>';
  $('dossier-score').textContent = `Score : ${dossierScore().toFixed(1)} / ${EVIDENCE.dossierTarget} · ${S.evidence.length} pièce(s)`;
}

const raycaster = new THREE.Raycaster();
const CENTER = new THREE.Vector2(0, 0);
function photo() {
  if (S.loc === 'apt' && !nearWindow()) return log('Depuis l\'appartement, il faut être à la fenêtre.');
  flash();
  syncCamera();
  scene.updateMatrixWorld();
  raycaster.setFromCamera(CENTER, camera);
  raycaster.far = EVIDENCE.photoRange;
  const hit = raycaster.intersectObjects(tables.filter((t) => t.out).map((t) => t.hit), false)[0];
  if (!hit) return log('Photo… rien d\'exploitable dans le cadre.');
  const t = hit.object.userData.table;
  const base = EVIDENCE.minQuality + (1 - EVIDENCE.minQuality) * (S.sleep / 100);
  const quality = clamp(base * (hit.distance > EVIDENCE.sharpRange ? 0.75 : 1), EVIDENCE.minQuality, 1);
  const db = Math.round(S.noiseDb);
  const found = [];
  if (t.count > RULES.maxPeoplePerTable && !t.evidence.has('over')) {
    found.push({ kind: 'over', text: `${t.label} : ${t.count} personnes (max ${RULES.maxPeoplePerTable}), ${db} dB`, value: EVIDENCE.overLimitValue });
  }
  if (S.min >= LATE && !t.evidence.has('late')) {
    found.push({ kind: 'late', text: `${t.label} encore dehors à ${fmt(S.min)}, ${db} dB`, value: EVIDENCE.lateValue });
  }
  if (!found.length) {
    return log(t.evidence.size ? `${t.label} : déjà dans le dossier.` : `${t.label} : rien d'illégal (pour l'instant).`);
  }
  for (const f of found) {
    t.evidence.add(f.kind);
    addEvidence({ type: 'photo', kind: f.kind, restId: t.rest.id, text: f.text, quality, value: f.value * quality });
  }
  log(`📸 Preuve ajoutée (${qualityLabel(quality)}) : ${found.map((f) => f.text).join(' · ')}`, 'good');
}

// ---------- Terrasses ----------
function infractions(rest) {
  return tables.filter((t) => t.rest === rest && t.out && (S.min >= LATE || t.count > RULES.maxPeoplePerTable));
}
function clearTable(t, by) {
  if (!t.out) return;
  t.out = false;
  t.group.visible = false;
  t.clearedAt = S.min;
  t.clearedBy = by;
  clatters.push({ pos: t.group.position.clone().setY(0.5), until: now + NOISE.clatterSeconds });
  // Raclement des chaises métalliques sur les pavés : un message par resto, pas un par table
  if (by === 'resto' && !(t.rest.lastClatterLog > S.min - 5)) {
    t.rest.lastClatterLog = S.min;
    log(`Raclement de chaises sur les pavés : ${t.rest.name} rentre sa terrasse${S.min >= LATE ? '… enfin' : ''}.`);
  }
}
function updateTerraces() {
  for (const t of tables) if (t.out && S.min >= t.clearAt) clearTable(t, t.pendingBy || 'resto');
  for (let i = clatters.length - 1; i >= 0; i--) if (clatters[i].until < now) clatters.splice(i, 1);
}

// ---------- Serveur ----------
function askWaiter() {
  const rest = REST.bernadette;
  if (S.min < CLOSE) return log(`Le serveur : « Il est pas encore ${RULES.terraceCloseHour}h, monsieur. On rentre à ${RULES.terraceCloseHour}h. »`);
  if (S.min < S.waiterReadyAt) return log('Le serveur : « Je vous ai dit, je vais voir avec le patron… »');
  const late = tables.filter((t) => t.rest === rest && t.out);
  if (!late.length) return log('Le serveur : « C\'est déjà rentré, monsieur. Bonne nuit ! »');
  const p = clamp(WAITER.base + WAITER.complianceWeight * rest.compliance + WAITER.assoWeight * (S.asso / 100), 0.05, 0.95);
  const ok = Math.random() < p;
  S.waiterReadyAt = S.min + WAITER.cooldownMinutes;
  S.waiterAsks.push({ time: S.min, ok });
  if (ok) {
    late.forEach((t, i) => { t.clearAt = S.min + 1 + i * 1.5; t.pendingBy = 'waiter'; });
    log('Le serveur soupire : « OK, OK… je rentre tout. » (demande légale et polie)', 'good');
  } else {
    log('Le serveur revient : « Le patron dit que les clients finissent leur verre. »', 'bad');
  }
}

// ---------- Téléphone ----------
function callPolice() {
  if (S.police) return log('Police : « Une patrouille est déjà en route, monsieur. »');
  S.calls++;
  if (S.calls > POLICE.maxCalls) {
    S.policeLog.push({ calledAt: S.min, outcome: 'ignored' });
    return log('Police : « Ah, c\'est encore vous… On note. » Personne ne viendra.', 'bad');
  }
  // La patrouille va vers le resto qui a le plus d'infractions au moment de l'appel
  const target = Object.values(REST).sort((a, b) => infractions(b).length - infractions(a).length)[0];
  const delay = rand(POLICE.delayMin, POLICE.delayMax) * (1 + POLICE.delayPerExtraCall * (S.calls - 1));
  S.police = { rest: target, calledAt: S.min, arriveAt: S.min + delay, phase: 'pending', officers: [] };
  log(`Police municipale : « On envoie quelqu'un. » (appel n°${S.calls}, pour ${target.name})`);
}
function callAsso() {
  const fresh = S.evidence.filter((e) => !e.shared && e.type === 'photo');
  if (!fresh.length) {
    S.asso = clamp(S.asso - ASSO.spamPenalty, 0, 100);
    return log('WhatsApp de l\'asso : « Des photos, Pilou. Des PHOTOS. » 🐈', 'bad');
  }
  fresh.forEach((e) => { e.shared = true; });
  S.asso = clamp(S.asso + fresh.length * ASSO.shareGainPerPiece, 0, 100);
  log(`WhatsApp : ${fresh.length} photo(s) partagée(s). « 😱 On imprime tout pour la commission ! »`, 'good');
}
function callMairie() {
  if (S.mairieSent) return log('Mairie : « Votre signalement est en cours de traitement (délai : 15 jours ouvrés). »');
  S.mairieSent = true;
  const n = S.evidence.filter((e) => e.type === 'photo').length;
  if (!n) return log('Signalement envoyé sans pièce jointe. Accusé de réception automatique.');
  addEvidence({ type: 'mairie', restId: null, text: `Signalement à la mairie avec ${n} pièce(s) jointe(s)`, quality: 1, value: EVIDENCE.mairieValue });
  log(`Signalement envoyé à la mairie avec ${n} pièce(s) jointe(s). Le service ouvre à 8h30.`, 'good');
}

// ---------- Police ----------
const POLICE_SPAWN = new THREE.Vector3(0, 0, -HALF + 2);
function spawnOfficers(rest) {
  const out = [];
  for (const dx of [-0.4, 0.4]) {
    const o = person(0x1b2847);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.08, 10), mat(0x0d1426));
    cap.position.y = 1.33;
    o.add(cap);
    o.scale.setScalar(1.1);
    o.position.copy(POLICE_SPAWN).setX(dx);
    o.userData.target = new THREE.Vector3(rest.side * 0.4 + dx, 0, (rest.z0 + rest.z1) / 2);
    scene.add(o);
    out.push(o);
  }
  return out;
}
function walk(o, target, dt) {
  const d = tmpV.copy(target).sub(o.position).setY(0);
  const len = d.length();
  if (len < 0.1) return true;
  o.position.addScaledVector(d.normalize(), Math.min(len, POLICE.walkSpeed * dt));
  o.rotation.y = Math.atan2(d.x, d.z);
  o.position.y = Math.abs(Math.sin(now * 8)) * 0.04;
  return false;
}
function resolvePolice(P) {
  const rest = P.rest;
  const inf = infractions(rest);
  const entry = { calledAt: P.calledAt, arrivedAt: S.min, rest: rest.name };
  S.policeLog.push(entry);
  if (!inf.length) {
    entry.outcome = 'nothing';
    return log(`Les agents passent devant ${rest.name} : « Tout est en ordre, monsieur. »`);
  }
  const p = clamp(POLICE.baseAct + POLICE.dossierWeight * dossierScore(rest.id) + POLICE.assoWeight * (S.asso / 100) - POLICE.influenceWeight * rest.influence, 0.05, 0.95);
  if (Math.random() < p) {
    entry.outcome = 'act';
    let fined = 0, cleared = 0;
    for (const t of inf) {
      if (S.min >= LATE) { t.clearAt = S.min + 0.5 + cleared * 0.8; t.pendingBy = 'police'; cleared++; }
      else if (t.count > RULES.maxPeoplePerTable) {
        t.people.slice(RULES.maxPeoplePerTable).forEach((q) => { q.visible = false; });
        t.count = RULES.maxPeoplePerTable;
        fined++;
      }
    }
    rest.compliance = Math.max(rest.compliance, POLICE.complianceAfterAct);
    for (const t of tables) if (t.rest === rest && t.out && t.clearAt > LATE) t.clearAt = Math.max(S.min + 1, CLOSE);
    entry.detail = `${cleared} table(s) rentrée(s), ${fined} table(s) ramenée(s) à ${RULES.maxPeoplePerTable}`;
    log(`PV pour ${rest.name} : ${entry.detail}.`, 'good');
  } else {
    entry.outcome = 'complaisance';
    addEvidence({ type: 'complaisance', restId: rest.id, quality: 1, value: EVIDENCE.complaisanceValue, text: `Police venue chez ${rest.name}, café offert, 0 PV (${inf.length} infraction(s) visibles)` });
    log(`Les agents prennent un café chez ${rest.name}… 0 PV. Noté dans le dossier (complaisance).`, 'bad');
  }
}
function updatePolice(dt) {
  const P = S.police;
  if (!P) return;
  if (P.phase === 'pending' && S.min >= P.arriveAt) {
    P.officers = spawnOfficers(P.rest);
    P.phase = 'walkIn';
    log('Une patrouille entre dans la rue.');
  } else if (P.phase === 'walkIn') {
    const done = P.officers.map((o) => walk(o, o.userData.target, dt)).every(Boolean);
    if (done) { resolvePolice(P); P.phase = 'stay'; P.leaveAt = S.min + POLICE.stayMinutes; }
  } else if (P.phase === 'stay' && S.min >= P.leaveAt) {
    P.phase = 'walkOut';
  } else if (P.phase === 'walkOut') {
    const done = P.officers.map((o, i) => walk(o, POLICE_SPAWN.clone().setX(i ? 0.4 : -0.4), dt)).every(Boolean);
    if (done) { P.officers.forEach((o) => scene.remove(o)); S.police = null; }
  }
}

// ---------- Seau d'eau ----------
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
  return {
    fire(origin) {
      for (let i = 0; i < N; i++) {
        pos.set([origin.x + rand(-0.2, 0.2), origin.y, origin.z + rand(-0.3, 0.3)], i * 3);
        vel.set([rand(0.8, 2.2), rand(-0.5, 1), rand(-1.2, 1.2)], i * 3);
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
function addRisk(n) {
  const before = S.risk;
  S.risk = clamp(S.risk + n, 0, 100);
  if (before < RISK.warning && S.risk >= RISK.warning) log('Des clients ont filmé la fenêtre. Ça circule déjà.', 'bad');
  if (before < RISK.complaint && S.risk >= RISK.complaint) log('Dédé crie qu\'il va porter plainte. Il le fera.', 'bad');
  if (S.risk >= RISK.custody) endNight('custody');
}
function bucket() {
  if (S.loc !== 'apt' || !nearWindow()) return log('Le seau, c\'est depuis la fenêtre.');
  if (S.min < S.bucketReadyAt) return log(`Le seau se remplit… (prêt à ${fmt(S.bucketReadyAt)})`);
  const below = tables.filter((t) => t.out && t.rest.side === -1 && Math.abs(t.group.position.z - world.window.pos.z) < BUCKET.radius);
  splash.fire(world.window.pos.clone().setX(-W - 0.1));
  below.forEach((t) => clearTable(t, 'bucket'));
  S.bucketUses++;
  S.bucketReadyAt = S.min + BUCKET.refillMinutes;
  S.asso = clamp(S.asso - BUCKET.assoPenalty, 0, 100);
  log(`SPLASH ! ${below.length} table(s) évacuée(s). Cris, téléphones sortis. (illégal)`, 'bad');
  addRisk(BUCKET.risk);
}

// ---------- Interactions ----------
const flat = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const nearWindow = () => S.loc === 'apt' && player.pos.x > apt.x1 - 1.6 && Math.abs(player.pos.z - world.window.pos.z) < 1.5;
function interaction() {
  if (S.loc === 'street') {
    if (flat(player.pos, world.streetDoor) < 1.6) return { label: 'Monter chez Pilou', act: () => teleport('apt') };
    if (flat(player.pos, world.waiter.position) < WAITER.range) return { label: 'Demander au serveur de rentrer les tables', act: askWaiter };
  } else {
    if (flat(player.pos, world.aptDoor) < 1.4) return { label: 'Descendre dans la rue', act: () => teleport('street') };
    if (flat(player.pos, world.bed) < 1.7) return { label: S.sleeping ? 'Se relever' : 'Essayer de dormir (accélère la nuit)', act: toggleSleep };
  }
  return null;
}
function teleport(where) {
  S.loc = where;
  if (where === 'apt') player.pos.set(world.aptDoor.x + 0.5, apt.floor, world.aptDoor.z);
  else player.pos.set(world.streetDoor.x + 0.8, 0, world.streetDoor.z);
  player.yaw = -Math.PI / 2;
  player.pitch = 0;
}
function toggleSleep() {
  S.sleeping = !S.sleeping;
  if (S.sleeping) { player.pitch = 0.9; log('Pilou se couche. Le temps file…'); }
  else player.pitch = 0;
}

// ---------- Overlays ----------
function openOverlay(name) {
  S.overlay = name;
  $(name).classList.remove('hidden');
  if (name === 'dossier') renderDossier();
  if (name === 'phone') {
    const P = S.police;
    $('phone-status').textContent = P ? `Patrouille ${P.phase === 'pending' ? 'en route' : 'sur place'} (appel de ${fmt(P.calledAt)})` : `${S.calls} appel(s) à la police ce soir`;
  }
  document.exitPointerLock?.();
}
function closeOverlay() {
  if (!S.overlay) return;
  $(S.overlay).classList.add('hidden');
  S.overlay = null;
  lock();
}
function lock() {
  if (NOLOCK || S.ended) return;
  try { canvas.requestPointerLock()?.catch?.(() => {}); } catch { /* geste utilisateur requis */ }
}
for (const b of document.querySelectorAll('#phone button')) {
  b.addEventListener('click', () => {
    const c = b.dataset.call;
    closeOverlay();
    if (c === 'police') callPolice();
    else if (c === 'asso') callAsso();
    else if (c === 'mairie') callMairie();
  });
}

// ---------- Entrées ----------
$('start').addEventListener('click', () => {
  $('title').classList.add('hidden');
  $('hud').classList.remove('hidden');
  S.started = true;
  timer.update();
  log('Lundi soir. Les terrasses doivent rentrer à 22h. En théorie.');
  lock();
});
canvas.addEventListener('click', () => { if (S.started && !S.overlay) lock(); });
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
  if (!S.started || S.ended) return;
  if (e.code === 'Escape') return closeOverlay();
  if (e.code === 'Tab') return S.overlay === 'dossier' ? closeOverlay() : !S.overlay && openOverlay('dossier');
  if (e.code === 'KeyT') return S.overlay === 'phone' ? closeOverlay() : !S.overlay && openOverlay('phone');
  if (S.overlay || e.repeat) return keys.add(e.code);
  keys.add(e.code);
  if (e.code === 'KeyE') interaction()?.act();
  else if (S.sleeping) return;
  else if (e.code === 'KeyP') photo();
  else if (e.code === 'KeyF') bucket();
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
  if (S.loc === 'street') {
    p.x = clamp(p.x, -W + 0.35, W - 0.35);
    p.z = clamp(p.z, -HALF + 1, HALF - 1);
    for (const t of tables) {
      if (!t.out) continue;
      const dx = p.x - t.group.position.x, dz = p.z - t.group.position.z, d = Math.hypot(dx, dz);
      if (d < 1.15 && d > 0.001) { p.x = t.group.position.x + (dx / d) * 1.15; p.z = t.group.position.z + (dz / d) * 1.15; }
    }
  } else {
    // On peut s'avancer dans l'embrasure de la fenêtre pour regarder en bas
    const atWindow = Math.abs(p.z - world.window.pos.z) < 0.75;
    p.x = clamp(p.x, apt.x0 + 0.3, atWindow ? -W - 0.2 : apt.x1 - 0.25);
    p.z = clamp(p.z, apt.z0 + 0.3, apt.z1 - 0.3);
  }
}

// ---------- Fin de nuit ----------
function endNight(reason) {
  if (S.ended) return;
  S.ended = true;
  document.exitPointerLock?.();
  for (const id of ['phone', 'dossier', 'pause']) $(id).classList.add('hidden');
  $('hud').classList.add('hidden');
  const titles = {
    time: `${fmt(S.min)} · la rue se tait (enfin)`,
    custody: 'Garde à vue',
    sleep: 'Pilou craque',
  };
  const outcome = { act: 'PV', complaisance: 'café offert, 0 PV', nothing: 'rien à signaler', ignored: '« c\'est encore vous », personne' };
  const restLines = Object.values(REST).map((r) => {
    const ts = tables.filter((t) => t.rest === r);
    const onTime = ts.filter((t) => t.clearedAt !== null && t.clearedAt < LATE && t.clearedBy === 'resto').length;
    const still = ts.filter((t) => t.out).length;
    const last = Math.max(...ts.filter((t) => t.clearedAt !== null).map((t) => t.clearedAt), -1);
    const by = ['police', 'waiter', 'bucket'].map((k) => [k, ts.filter((t) => t.clearedBy === k).length]).filter(([, n]) => n)
      .map(([k, n]) => `${n} par ${{ police: 'la police', waiter: 'le serveur', bucket: 'le seau' }[k]}`);
    return `<li><b>${r.name}</b> : ${onTime}/${ts.length} rentrée(s) à l'heure${by.length ? ` · ${by.join(', ')}` : ''}${still ? ` · <span class="bad">${still} encore dehors</span>` : last >= 0 ? ` · dernière à ${fmt(last)}` : ''}</li>`;
  });
  const policeLines = S.policeLog.map((p) => `<li>Appel ${fmt(p.calledAt)}${p.arrivedAt ? ` → arrivée ${fmt(p.arrivedAt)} chez ${p.rest}` : ''} : ${outcome[p.outcome]}${p.detail ? ` (${p.detail})` : ''}</li>`);
  if (S.police && S.police.phase === 'pending') policeLines.push(`<li>Appel ${fmt(S.police.calledAt)} : la patrouille n'est jamais arrivée</li>`);

  const verdict = [];
  const ratio = dossierScore() / EVIDENCE.dossierTarget;
  if (reason === 'custody') verdict.push('Le seau d\'eau de trop. Pilou passe la nuit au commissariat. Klaas a tout noté.');
  else if (reason === 'sleep') verdict.push('Sommeil à zéro. Pilou cherche un appart à Wazemmes. « Au moins au marché de Wazemmes, le bruit c\'est le matin. »');
  else if (ratio >= 0.75) verdict.push('Dossier solide. La commission du jour 14 va devoir l\'écouter.');
  else if (ratio >= 0.35) verdict.push('Ça avance. Il faudra plus de preuves pour la commission.');
  else verdict.push('Pas grand-chose à montrer à la commission. Demain, sortez l\'appareil photo.');
  if (reason !== 'custody') {
    if (S.risk >= RISK.complaint) verdict.push('Dédé a porté plainte. Ça va revenir.');
    else if (S.risk >= RISK.warning) verdict.push('Une vidéo de la fenêtre circule sur les réseaux.');
  }
  if (S.asso < 30) verdict.push('L\'Association prend ses distances.');

  $('end-title').textContent = titles[reason];
  $('end-body').innerHTML = `
    <p class="verdict">${verdict.join('<br/>')}</p>
    <h3>Pilou</h3>
    <ul><li>Sommeil ${Math.round(S.sleep)}/100 · Association ${Math.round(S.asso)}/100 · Risque ${Math.round(S.risk)}/100</li>
    <li>Dossier : ${dossierScore().toFixed(1)}/${EVIDENCE.dossierTarget} (${S.evidence.length} pièce(s))</li>
    <li>Serveur sollicité ${S.waiterAsks.length} fois (${S.waiterAsks.filter((a) => a.ok).length} succès) · Seau d'eau : ${S.bucketUses} · Mairie : ${S.mairieSent ? 'signalée' : 'non'}</li></ul>
    <h3>Terrasses</h3><ul>${restLines.join('')}</ul>
    <h3>Police municipale</h3><ul>${policeLines.join('') || '<li>Jamais appelée.</li>'}</ul>`;
  $('end').classList.remove('hidden');
}

// ---------- Boucle ----------
let hudTimer = 0;
function update(dt) {
  const running = S.started && !S.ended && !S.overlay && (locked || NOLOCK);
  $('pause').classList.toggle('hidden', !S.started || S.ended || !!S.overlay || locked || NOLOCK);
  if (!running) return;
  const dMin = dt * RULES.gameMinutesPerSecond * (S.sleeping ? RULES.sleepTimeMultiplier : 1);
  S.min += dMin;

  move(dt);
  updateTerraces();
  updatePolice(dt);

  // Bruit à l'oreille de Pilou, et au lit (c'est lui qui compte pour le sommeil)
  camera.position.set(player.pos.x, player.pos.y + 1.65, player.pos.z);
  S.noiseDb = noiseAt(camera.position, S.loc === 'apt');
  if (S.min >= SLEEP.drainAfter) {
    const bedDb = noiseAt(bedEar, true);
    let d = -Math.max(0, bedDb - SLEEP.thresholdDb) * SLEEP.drainPerDbMinute;
    if (S.min < NOISE.exhaustOffMinute) d -= SLEEP.exhaustDrainPerMinute;
    if (S.sleeping && bedDb < SLEEP.thresholdDb) d += SLEEP.recoverPerMinute;
    S.sleep = clamp(S.sleep + d * dMin, 0, 100);
    if (S.sleep <= 0) endNight('sleep');
  }
  if (S.min >= RULES.nightEnd) endNight('time');
}

function animate(dt) {
  // Serveur : fait les cent pas devant la terrasse
  const w = world.waiter;
  const wz = -0.5 + Math.sin(now * 0.12) * 6;
  w.rotation.y = Math.cos(now * 0.12) > 0 ? 0 : Math.PI;
  w.position.z = wz;
  for (const t of tables) {
    if (!t.out) continue;
    for (const p of t.people) p.rotation.y = Math.sin(now * 0.7 + p.userData.phase) * 0.4;
  }
  world.steam.intensity = S.min < NOISE.exhaustOffMinute ? 1 : Math.max(0, world.steam.intensity - dt * 0.3);
  world.steam.update(dt);
  splash.update(dt);
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
  animate(dt);
  syncCamera();
  updateSky();
  hudTimer -= dt;
  if (hudTimer <= 0 && S.started && !S.ended) { updateHud(); hudTimer = 0.1; }
  renderer.render(scene, camera);
}
// Tests automatisés (onglet en arrière-plan = pas de requestAnimationFrame) : __rdb.step(n) avance n frames de 1/30 s
window.__rdb.step = (n = 1, dt = 1 / 30) => { for (let i = 0; i < n; i++) tick(dt); return S.min; };
updateSky();
requestAnimationFrame(frame);
