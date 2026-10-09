// Bibliothèque de scènes de rue (§12e.6 « ça existe ou ça n'existe pas ») : tout ce que la nuit raconte se VOIT et
// s'ENTEND au moment où la ligne s'affiche. stage(id, opts) fait apparaître qui / quoi, le fait bouger sur son chemin
// pendant quelques secondes réelles, avec son propre son, puis nettoie tout.
//
//   const stage = createStage({ scene, world, art, audio });
//   stage.play('scooter')                       // ou stage.play({ id: 'window_opens', who: 'klaas' })
//   stage.update(dt)                            // à chaque image de la nuit (le metteur en scène s'en charge)
//   STAGE_IDS                                   // la liste, pour le contenu et le vérificateur de cohérence
//   AMBIENT_STAGE                               // id de ligne d'ambiance (content/night.js › AMBIENT) → repère de scène
//
// Le metteur en scène joue le repère d'une ligne : event.stage (chaîne ou { id, …opts }) sur un événement de la sim,
// ou, pour les lignes d'ambiance, la note 'ambient' { id } du journal via AMBIENT_STAGE.
import * as THREE from 'three';
import { humanoid, customer, setState, bike as makeBike, dachshund, cat as makeCat, CAST } from '../art/characters.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const mats = new Map();
const M = (color, o = {}) => {
  const k = `${color}|${JSON.stringify(o)}`;
  if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...o }));
  return mats.get(k);
};
const glow = (color, i = 2) => M(0x222222, { emissive: color, emissiveIntensity: i });
const box = (g, w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); g.add(o); return o; };
const cyl = (g, r, h, m, x, y, z, s = 10) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, s), m); o.position.set(x, y, z); g.add(o); return o; };

// Ligne d'ambiance → scène (les ids viennent de src/content/night.js › AMBIENT)
export const AMBIENT_STAGE = {
  scooter: 'scooter', couple_argue: 'couple_argue', tourist_grand_place: 'tourist_lost', window_opens: 'window_opens',
  gaufre_balcony: 'gaufre_balcony', bottle_rolls: 'bottle_rolls', quinquin: 'drunk_singer', delivery_lost: 'delivery_rider',
  bell_maurice: { id: 'bells', n: 1 }, dog_bark_far: 'dog_far', heels_cobbles: { id: 'passerby', heels: true, swear: true },
  suitcase: { id: 'passerby', suitcase: true }, birthday_far: 'birthday_far', phone_loud: 'phone_loud', toast_loud: 'toast',
  smoker_ghislain: 'ghislain_smoke', dede_laugh: 'dede_laugh', klaas_light: { id: 'window_opens', who: 'klaas' },
  hilde_curtain: { id: 'window_opens', who: 'hilde' }, tatie_window: { id: 'window_opens', who: 'tatie' },
  jeremie_light: { id: 'window_opens', who: 'jeremie' }, seb_nico_laugh: 'seb_nico_laugh', tram_bell: { id: 'bike', bell: 3 },
  glass_breaks: 'glass_breaks', chair_falls: 'chair_falls', guitar: 'guitarist', guitar_leaves: { id: 'guitarist', leave: true },
  police_car_far: 'police_car_far', taxi_waits: 'taxi', group_photo: 'group_photo', student_choir: 'student_choir',
  pigeon: 'pigeon', kid_scooter: 'kid_scooter', menu_board: 'waiter_board', exhaust_cough: 'exhaust_cough', ac_drip: 'ac_drip',
  neighbour_shout: { id: 'window_opens', who: 'neighbour', shout: true }, wedding_horn: 'wedding_car', bike_bell_drunk: { id: 'bike', sing: true, bell: 2 },
  fries_smell: { id: 'exhaust_cough', big: true }, umbrella: 'umbrella_flap', lost_keys: { id: 'passerby', lostKeys: true },
  cat_fight: 'cat_fight', binoculars_glint: 'binoculars_glint', rain_drops: 'rain_look', rain_umbrellas: 'rain_umbrellas',
  rain_gutter: 'gutter', sat_crowd_song: { id: 'crowd_song' }, sat_bachelor: 'bachelor_party', sat_glass_stack: 'glass_stack',
  sat_ambulance: 'ambulance', weekday_quiet: 'quiet', weekday_jogger: { id: 'passerby', jogger: true }, late_street_sweeper: { id: 'street_sweeper', pass: 'end' },
  late_last_bus: { id: 'passerby', run: true, shout: true }, late_owl: 'owl', late_waiter_smoke: 'waiter_smoke', late_snore: 'snore',
  early_setup: 'waiter_setup', early_happy_hour: 'ardoise', early_sunset: 'sunset', bell_22_after: { id: 'bells', n: 1, soft: true },
  chti_drunk: { id: 'drunk_singer', shout: true }, window_lamp: 'desk_lamp',
};

export function createStage({ scene, world, art, audio }) {
  const A = world.anchors;
  const W = Math.abs(A.pilouWindow.x) - 0.3;
  const bz = A.pilouWindow.z;
  const zA = A.endA?.z ?? -45, zB = -zA; // rue de la Barre ↔ place Maurice-Schumann
  const runs = new Set();
  const lane = () => rnd(-0.5, 0.9);
  const tablesOf = (rest) => world.tables.filter((t) => (t.rest?.id ?? t.restId) === rest && t.group.visible);
  const outTables = () => world.tables.filter((t) => t.group.visible && t.people.some((p) => p.visible));
  const nearTable = (z = bz) => outTables().sort((a, b) => Math.abs(a.group.position.z - z) - Math.abs(b.group.position.z - z))[0];
  const sound = (name, pos, o = {}) => { try { audio?.play?.(name, { pos, ...o }); } catch { /* son indisponible */ } };
  const WATER = new THREE.Color(0xaad4ff);
  // une goutte / un jet d'eau (particules de art.fx)
  const drop = (p, v, life = 0.8, size = 0.05) => art?.fx?.particles?.drops?.spawn?.(p, v, life, size, size * 0.6, 0.75, WATER);
  const opposite = () => (world.windowSpots ?? []).filter((s) => s.side > 0 && Math.abs(s.z - bz) < 14);

  // ---------- outils d'une scène ----------
  function run(id, dur, setup) {
    const r = { id, t: 0, dur, objs: [], ems: [], ticks: [], ends: [], at: [] };
    r.add = (o) => { scene.add(o); r.objs.push(o); return o; };
    r.em = (kind, pos, o) => { const e = audio?.emitter?.(kind, pos, o); if (e) r.ems.push(e); return e; };
    r.tick = (f) => r.ticks.push(f);
    r.later = (s, f) => r.at.push({ s, f });
    r.end = (f) => r.ends.push(f);
    // un personnage qui suit un chemin (marche automatique), puis reste ; renvoie l'état du trajet
    r.walk = (p, pts, { speed = 1.2, onArrive = null, face = null } = {}) => {
      const tr = { i: 0, done: false };
      r.tick((dt) => {
        if (tr.done) return;
        const q = pts[tr.i], d = V(q.x - p.position.x, 0, q.z - p.position.z), L = d.length();
        if (L < speed * dt + 0.02) { p.position.set(q.x, p.position.y, q.z); if (++tr.i >= pts.length) { tr.done = true; if (face != null) p.rotation.y = face; onArrive?.(); } return; }
        d.multiplyScalar((speed * dt) / L); p.position.add(d); p.rotation.y = Math.atan2(d.x, d.z);
      });
      return tr;
    };
    // un acteur de la distribution, emprunté puis rendu tel quel
    r.borrow = (p) => {
      if (!p) return null;
      const save = { pos: p.position.clone(), rot: p.rotation.y, vis: p.visible, st: { ...(p.userData.rig ? { anim: p.userData.rig.anim, held: p.userData.rig.held, expr: p.userData.rig.expr } : {}) } };
      r.end(() => { p.position.copy(save.pos); p.rotation.y = save.rot; p.visible = save.vis; if (p.userData.rig) setState(p, save.st); });
      return p;
    };
    setup(r);
    return r;
  }
  const person = (o = {}) => humanoid({ talk: 0.6, expr: 'neutral', ...o });
  const walkerPath = (from, to, x = lane()) => [V(x, 0, from), V(x + rnd(-0.3, 0.3), 0, to)];
  const across = () => (Math.random() < 0.5 ? [zA - 2, zB + 2] : [zB + 2, zA - 2]);
  function vehicle(kind) {
    const g = new THREE.Group();
    if (kind === 'scooter') {
      box(g, 0.32, 0.35, 1.2, M(pick([0xc0262d, 0xf2f2ee, 0x2b4d7a])), 0, 0.45, 0); box(g, 0.08, 0.6, 0.08, M(0x222222), 0, 0.85, 0.5);
      for (const z of [-0.45, 0.45]) cyl(g, 0.2, 0.1, M(0x111111), 0, 0.2, z, 12).rotation.z = Math.PI / 2;
      box(g, 0.12, 0.08, 0.04, glow(0xfff2c8, 3), 0, 0.85, 0.58);
    } else if (kind === 'sweeper') {
      box(g, 1.4, 1.6, 2.6, M(0xf2f2ee), 0, 1.1, 0); box(g, 1.3, 0.7, 0.05, M(0x9fd0f2, { roughness: 0.1 }), 0, 1.5, 1.31);
      box(g, 1.42, 0.25, 2.62, M(0x2b9d8f), 0, 0.55, 0);
      for (const x of [-0.6, 0.6]) { const b = cyl(g, 0.3, 0.08, M(0x6b5b4b), x, 0.08, 1.5, 12); b.userData.brush = true; }
      for (const [x, z] of [[0.6, 0.8], [-0.6, 0.8], [0.6, -0.9], [-0.6, -0.9]]) cyl(g, 0.3, 0.2, M(0x111111), x, 0.3, z, 12).rotation.z = Math.PI / 2;
      const beacon = cyl(g, 0.09, 0.14, glow(0xff8a1a, 3), 0, 1.98, 0.2, 10); beacon.userData.beacon = true;
    } else { // voiture : taxi, ambulance, police, mariage
      const col = { taxi: 0x1f1f24, ambulance: 0xf2f2ee, police: 0xf2f2ee, wedding: 0xe8e4dc }[kind] ?? 0x5a6b7d;
      box(g, 1.7, 0.7, 4.0, M(col), 0, 0.65, 0); box(g, 1.5, 0.55, kind === 'ambulance' ? 3.6 : 2.0, M(col), 0, 1.25, kind === 'ambulance' ? -0.2 : -0.2);
      box(g, 1.45, 0.45, 0.05, M(0x9fd0f2, { roughness: 0.1 }), 0, 1.25, 0.82);
      for (const [x, z] of [[0.8, 1.3], [-0.8, 1.3], [0.8, -1.3], [-0.8, -1.3]]) cyl(g, 0.33, 0.22, M(0x111111), x, 0.33, z, 12).rotation.z = Math.PI / 2;
      for (const x of [-0.6, 0.6]) box(g, 0.25, 0.12, 0.04, glow(0xfff2c8, 2.5), x, 0.75, 2.01);
      for (const x of [-0.65, 0.65]) { const h = box(g, 0.2, 0.1, 0.04, glow(0xff9a1a, 0), x, 0.8, -2.01); h.userData.hazard = true; }
      if (kind === 'taxi') box(g, 0.5, 0.16, 0.25, glow(0xfff2a0, 2), 0, 1.6, -0.2);
      if (kind === 'ambulance' || kind === 'police') for (const x of [-0.35, 0.35]) { const b = box(g, 0.3, 0.12, 0.25, glow(0x3a6bff, 0), x, 1.6, 0.5); b.userData.blue = true; }
      if (kind === 'wedding') for (let i = 0; i < 4; i++) box(g, 0.05, 0.3, 0.05, M(0xffffff), -0.5 + i * 0.33, 1.65, -1.0);
    }
    return g;
  }
  const blink = (r, g, rate = 1.5) => r.tick((dt) => { const on = (r.t * rate) % 1 < 0.5; g.traverse((o) => { if (o.userData.hazard) o.material = glow(0xff9a1a, on ? 2.2 : 0); if (o.userData.blue) o.material = glow(0x3a6bff, (r.t * 3) % 1 < 0.5 ? 3 : 0); if (o.userData.beacon) o.rotation.y += dt * 8; if (o.userData.brush) o.rotation.y += dt * 12; }); });
  const moveAlong = (r, g, z0, z1, x, speed) => {
    g.position.set(x, 0, z0); g.rotation.y = z1 > z0 ? 0 : Math.PI;
    r.tick((dt) => { const s = Math.sign(z1 - z0); if ((g.position.z - z1) * s < 0) g.position.z += s * speed * dt; });
  };
  const winLight = (r, at, color = 0xffd890, peak = 1.6, holdS = 6) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.3), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0 }));
    const side = Math.sign(at.x) || 1;
    m.position.set(side * (W - 0.03), at.y, at.z); m.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
    r.add(m);
    r.tick(() => { const k = r.t < 0.6 ? r.t / 0.6 : r.t > holdS ? Math.max(0, 1 - (r.t - holdS) / 1.2) : 1; m.material.opacity = 0.85 * k * Math.min(1, peak); });
    return m;
  };

  // ---------- la bibliothèque ----------
  const STAGES = {
    // Un passant : talons, valise, téléphone, clés perdues, joggeur, coureur après le bus
    passerby: (o) => run('passerby', o.lostKeys ? 16 : 22, (r) => {
      const [z0, z1] = across();
      const p = r.add(person({ hair: o.heels ? 'long' : pick(['short', 'bob', 'quiff']), skirt: o.heels ? 0x2a2a35 : undefined, held: o.lostKeys ? 'phone' : o.suitcase ? null : Math.random() < 0.4 ? 'phone' : null, anim: o.lostKeys ? 'film' : 'idle' }));
      const speed = o.run || o.jogger ? 3.2 : 1.3;
      if (o.lostKeys) { // il cherche ses clés entre deux pavés, à la lumière du téléphone, sous la fenêtre
        p.position.set(0.6, 0, bz + 3); const light = new THREE.PointLight(0xdfe8ff, 1.2, 2.5); light.position.set(0.6, 0.6, bz + 3.3); r.add(light);
        r.tick(() => { p.rotation.y = Math.sin(r.t * 0.7) * 1.2; });
        r.later(5, () => sound('voice', p.position, { mood: 'angry', n: 4, f0: 120, gain: 0.6 }));
        return;
      }
      if (o.suitcase) { const s = new THREE.Group(); box(s, 0.4, 0.55, 0.22, M(0x3a5a8c), 0, 0.32, 0); r.add(s); r.tick(() => { s.position.copy(p.position).add(V(0.3, 0, -0.45 * Math.sign(z1 - z0))); s.rotation.y = p.rotation.y; }); }
      if (o.jogger) { const l = new THREE.PointLight(0xffffff, 1.5, 4); r.add(l); r.tick(() => l.position.copy(p.position).setY(1.6)); }
      r.walk(p, walkerPath(z0, z1), { speed });
      const step = o.heels ? 'heels' : o.suitcase ? 'wheels' : null;
      if (step) { let k = 0; r.tick(() => { if (Math.abs(p.position.z - bz) < 16 && r.t > k) { k = r.t + 3.6; sound(step, p.position, { gain: 0.8, steps: 8, seconds: 3.5 }); } }); }
      if (o.swear) r.later(Math.abs(bz - z0) / speed, () => { sound('voice', p.position, { mood: 'angry', n: 3, f0: 210, gain: 0.7 }); });
      if (o.shout) r.later(2, () => sound('voice', p.position, { mood: 'shout', n: 5, f0: 140, gain: 0.8 }));
    }),
    scooter: () => run('scooter', 14, (r) => {
      const [z0, z1] = across(), g = r.add(vehicle('scooter'));
      const rider = person({ anim: 'ride', held: null }); rider.position.set(0, 0.25, -0.1); g.add(rider);
      moveAlong(r, g, z0, z1, 0.3, 7.5);
      r.tick(() => { g.position.x = 0.3 + Math.sin(r.t * 2.2) * 0.9; g.rotation.z = Math.cos(r.t * 2.2) * 0.12; }); // en zigzag
      r.later(Math.max(0, Math.abs(bz - z0) / 7.5 - 2), () => sound('scooter', g.position, { gain: 1, seconds: 4.5 }));
    }),
    // Un cycliste (V'Lille), sonnette, éventuellement qui chante
    bike: (o) => run('bike', 16, (r) => {
      const [z0, z1] = across(), g = new THREE.Group(); r.add(g);
      const b = makeBike(pick([0x8ab4d8, 0x2b9d8f, 0xc0262d])); g.add(b);
      const p = person({ anim: 'ride' }); g.add(p);
      moveAlong(r, g, z0, z1, lane(), 4.2);
      r.later(Math.max(0, Math.abs(bz - z0) / 4.2 - 1.5), () => { sound('bikebell', g.position, { rings: o.bell ?? 2 }); if (o.sing) sound('sing', g.position, { f0: 150 }); });
    }),
    // Le livreur à vélo perdu entre deux n°10 : trois tours dans la rue, téléphone à la main, caisse isotherme
    delivery_rider: () => run('delivery_rider', 30, (r) => {
      const g = new THREE.Group(); r.add(g);
      g.add(makeBike(0x1f1f24));
      const p = person({ anim: 'ride', held: 'phone', shirt: 0x2b9d8f }); g.add(p);
      box(g, 0.45, 0.45, 0.45, M(0x2b9d8f), 0, 1.45, -0.35);
      const c = V(0.4, 0, bz + 4);
      r.tick(() => { const a = r.t * 0.55; g.position.set(c.x + Math.cos(a) * 1.4, 0, c.z + Math.sin(a) * 4.5); g.rotation.y = Math.atan2(-Math.sin(a) * 1.4, Math.cos(a) * 4.5); });
      r.later(3, () => sound('bikebell', g.position, { rings: 1 }));
      r.later(14, () => sound('voice', g.position, { mood: 'ask', n: 5, f0: 140 }));
    }),
    kid_scooter: () => run('kid_scooter', 16, (r) => {
      const [z0, z1] = across();
      const kid = r.add(person({ height: 0.62, hair: 'short', shirt: 0xf0c36a, anim: 'ride' }));
      const dad = r.add(person({ hair: 'short', shirt: 0x6c9bd2 }));
      r.walk(kid, walkerPath(z0, z1, -1.4), { speed: 3 }); r.walk(dad, walkerPath(z0 - Math.sign(z1 - z0) * 4, z1, -1.2), { speed: 2.6 });
      r.later(Math.abs(bz - z0) / 2.6, () => sound('voice', dad.position, { mood: 'calm', n: 5, f0: 120 }));
    }),
    // Un touriste demande « la Grand-Place ? » à la terrasse : six doigts dans six directions
    tourist_lost: () => run('tourist_lost', 16, (r) => {
      const t = nearTable(), tp = t ? t.group.position : V(-W + 2, 0, bz + 4);
      const p = r.add(person({ held: 'phone', shirt: 0xe9c46a, hair: 'bob' }));
      p.position.set(0.8, 0, tp.z + 12);
      r.walk(p, [V(tp.x + Math.sign(-tp.x || 1) * 1.6, 0, tp.z)], { speed: 1.4, face: tp.x < 0 ? -Math.PI / 2 : Math.PI / 2, onArrive: () => {
        setState(p, { anim: 'meeting' }); sound('voice', p.position, { mood: 'ask', n: 4, f0: 200 });
        for (const q of t?.people ?? []) if (q.visible && Math.random() < 0.8) { r.borrow(q); setState(q, { anim: 'wave' }); }
        r.later(r.t + 4, () => { for (const q of t?.people ?? []) if (q.visible) setState(q, { anim: 'idle' }); r.walk(p, [V(0.6, 0, zA - 3)], { speed: 1.4 }); });
      } });
    }),
    // Un couple se dispute sous la fenêtre de Pilou
    couple_argue: () => run('couple_argue', 18, (r) => {
      const a = r.add(person({ hair: 'long', skirt: 0x6d597a, expr: 'angry', anim: 'meeting' })), b = r.add(person({ hair: 'short', shirt: 0x5fb3b3, expr: 'angry' }));
      a.position.set(-W + 1.3, 0, bz - 0.4); b.position.set(-W + 1.9, 0, bz + 0.5);
      a.rotation.y = Math.atan2(b.position.x - a.position.x, b.position.z - a.position.z); b.rotation.y = a.rotation.y + Math.PI;
      for (let k = 0; k < 6; k++) r.later(0.5 + k * 2.2, () => sound('voice', (k % 2 ? b : a).position, { mood: 'angry', n: 4 + (k % 3), f0: k % 2 ? 115 : 205, gain: 0.8 }));
      r.later(14, () => { r.walk(a, [V(0.4, 0, zB)], { speed: 1.5 }); r.walk(b, [V(0.2, 0, zA)], { speed: 1.5 }); });
    }),
    // Le passant éméché qui chante le P'tit Quinquin (ou crie « Allez biloute, on rinte ! »)
    drunk_singer: (o) => run('drunk_singer', 24, (r) => {
      const [z0, z1] = across();
      const p = r.add(person({ held: 'beer', expr: 'happy', anim: o.shout ? 'cheer' : 'sing' }));
      r.walk(p, walkerPath(z0, z1), { speed: 0.9 });
      r.tick(() => { p.position.x += Math.sin(r.t * 1.7) * 0.01; });
      for (let k = 0; k < (o.shout ? 2 : 4); k++) r.later(4 + k * 4, () => sound(o.shout ? 'voice' : 'sing', p.position, o.shout ? { mood: 'shout', n: 7, f0: 120 } : { f0: 140 }));
    }),
    student_choir: () => run('student_choir', 22, (r) => {
      const [z0, z1] = across();
      const g = Array.from({ length: 6 }, (_, i) => { const p = r.add(person({ anim: 'sing', held: i % 2 ? 'beer' : null, expr: 'happy', shirt: pick([0xe3826f, 0x6c9bd2, 0xf0c36a]) })); p.position.set(rnd(-0.6, 0.9), 0, z0 - Math.sign(z1 - z0) * i * 0.6); return p; });
      g.forEach((p) => r.walk(p, [V(p.position.x, 0, z1)], { speed: 1.2 }));
      for (let k = 0; k < 4; k++) r.later(3 + k * 4, () => sound('chant', g[0].position, { voices: 5, gain: 0.8 }));
    }),
    // Enterrement de vie de garçon déguisé en Schtroumpfs (le futur marié en Grand Schtroumpf)
    bachelor_party: () => run('bachelor_party', 22, (r) => {
      const [z0, z1] = across();
      const g = Array.from({ length: 7 }, (_, i) => {
        const p = r.add(humanoid({ skin: 0x5aa0e0, shirt: 0xf2f2f2, pants: i === 0 ? 0xc0262d : 0xf2f2f2, hair: 'bald', expr: 'happy', anim: i % 3 ? 'cheer' : 'idle', extras: (add, k) => add('cyl', 'head', [0, 1.4 * k.r, -0.1 * k.r], [0.9 * k.r, 1.0 * k.r, 0.9 * k.r], i === 0 ? 0xc0262d : 0xf2f2f2) }));
        p.position.set(rnd(-0.6, 0.9), 0, z0 - Math.sign(z1 - z0) * i * 0.7); return p;
      });
      g.forEach((p) => r.walk(p, [V(p.position.x, 0, z1)], { speed: 1.3 }));
      for (let k = 0; k < 3; k++) r.later(4 + k * 5, () => sound('chant', g[0].position, { voices: 6, gain: 0.8 }));
    }),
    // Un groupe debout reprend « Les Corons » (samedi) : la terrasse la plus proche chante
    crowd_song: () => run('crowd_song', 14, (r) => {
      const t = nearTable(); if (!t) return;
      for (const q of t.people) if (q.visible) { r.borrow(q); setState(q, { anim: 'sing', expr: 'happy' }); }
      for (let k = 0; k < 3; k++) r.later(k * 4, () => sound('chant', t.group.position, { voices: 7, gain: 0.9, notes: [[0, 0.5], [2, 0.5], [3, 1], [2, 0.5], [0, 0.5], [-2, 1]] }));
    }),
    dog_walker: () => run('dog_walker', 24, (r) => {
      const [z0, z1] = across();
      const p = r.add(person({ hair: 'bob', anim: 'leash' })), d = r.add(dachshund());
      r.walk(p, walkerPath(z0, z1, 1.0), { speed: 1.0 });
      r.tick(() => { d.position.copy(p.position).add(V(0.3, 0, 0.8 * Math.sign(z1 - z0))); d.rotation.y = p.rotation.y; });
      r.later(8, () => sound('bark', d.position, { gain: 0.5 }));
    }),
    // Un chien aboie vers la place (on le voit, petit, au bout de la rue, avec sa maîtresse)
    dog_far: () => run('dog_far', 14, (r) => {
      const z = zB + 4, p = r.add(person({ anim: 'leash' })), d = r.add(dachshund());
      p.position.set(1.5, 0, z); d.position.set(1.2, 0, z - 0.8); d.rotation.y = Math.PI;
      r.later(1, () => sound('bark', d.position, { gain: 1 })); r.later(2.5, () => sound('bark', d.position, { gain: 0.7 }));
    }),
    // La balayeuse : toute la rue (pass 'full') ou seulement le bout (pass 'end')
    street_sweeper: (o) => run('street_sweeper', o.pass === 'end' ? 18 : 70, (r) => {
      const g = r.add(vehicle('sweeper')); blink(r, g);
      if (o.pass === 'end') moveAlong(r, g, zA - 6, zA + 6, -3.5, 1.5);
      else moveAlong(r, g, zA - 4, zB + 6, -0.3, (zB - zA + 10) / 66);
      const e = r.em('sweeper', g.position, { gain: 0.8, ref: 6 }); r.tick(() => e?.pos.copy(g.position).setY(0.8));
      if (o.pass !== 'end' && art?.fx?.smoke) r.tick(() => { if (Math.random() < 0.25) drop(g.position.clone().add(V(rnd(-0.6, 0.6), 0.15, 1.6)), V(rnd(-1, 1), 0.8, 1.2), 0.6, 0.05); });
    }),
    taxi: () => run('taxi', 28, (r) => {
      const g = r.add(vehicle('taxi')); blink(r, g, 1.4); g.position.set(0.2, 0, zA + 1.5);
      const e = r.em('engine', g.position.clone().setY(0.6), { gain: 0.35, ref: 6, f: 33, putter: 16 });
      r.later(8, () => sound('voice', g.position, { mood: 'calm', n: 6, f0: 180 }));
      r.later(22, () => { r.tick((dt) => { g.position.z -= dt * 3; e?.pos.copy(g.position).setY(0.6); }); });
    }),
    ambulance: () => run('ambulance', 40, (r) => {
      const g = r.add(vehicle('ambulance')); blink(r, g);
      moveAlong(r, g, zA - 4, zB + 6, 0.2, 1.4);
      const e = r.em('engine', g.position, { gain: 0.4, ref: 6, f: 30 }); r.tick(() => e?.pos.copy(g.position).setY(0.6));
      r.later(Math.max(0, (bz - zA) / 1.4 - 4), () => sound('cheer', g.position, { gain: 0.4, n: 6 }));
    }),
    // Une sirène passe rue de la Barre : on voit le gyrophare bleu traverser le bout de la rue
    police_car_far: () => run('police_car_far', 9, (r) => {
      const g = r.add(vehicle('police')); blink(r, g); g.rotation.y = Math.PI / 2; g.position.set(-14, 0, zA - 5);
      r.tick((dt) => { g.position.x += dt * 4; });
      r.later(0.5, () => sound('carsiren', g.position, { gain: 0.9 }));
    }),
    wedding_car: () => run('wedding_car', 9, (r) => {
      const g = r.add(vehicle('wedding')); g.rotation.y = Math.PI / 2; g.position.set(-14, 0, zA - 5);
      r.tick((dt) => { g.position.x += dt * 4; });
      r.later(2, () => sound('horn', g.position, { beeps: 5, gain: 1 })); r.later(3.5, () => sound('applause', nearTable()?.group.position ?? V(0, 1, bz), { gain: 0.5, n: 30 }));
    }),
    // Une fenêtre s'allume (en face, chez Klaas, Hilde, Tatie, Jérémie, un voisin qui crie) : la lumière, une silhouette
    window_opens: (o) => run('window_opens', o.who === 'klaas' || o.who === 'hilde' ? 12 : 9, (r) => {
      const spot = pick(opposite());
      const at = { klaas: A.klaasWindow, hilde: A.hildeWindow, tatie: A.tatieWindow, jeremie: A.jeremieWindow }[o.who] ?? (spot ? V(spot.x, spot.y, spot.z) : V(W, 6, bz + 2));
      if (!at) return;
      if (o.who === 'klaas' || o.who === 'hilde') { // fenêtres de la place : une lampe s'allume (point lumineux visible de loin)
        const l = new THREE.PointLight(0xffd890, 0, 6); l.position.copy(at); r.add(l);
        const s = r.add(new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffe0a0, transparent: true, opacity: 0 }))); s.position.copy(at);
        r.tick(() => { const k = Math.min(1, r.t / 0.5) * (r.t > 10 ? Math.max(0, 1 - (r.t - 10)) : 1); l.intensity = 2.5 * k; s.material.opacity = 0.9 * k; });
        return;
      }
      winLight(r, at);
      const p = r.add(person({ hair: o.who === 'tatie' ? 'bun' : pick(['short', 'bob']), hairColor: o.who === 'tatie' ? 0xd8d8d8 : undefined, shirt: o.who === 'tatie' ? 0xb48ed1 : 0xe8e2d0 }));
      const side = Math.sign(at.x) || 1; p.position.set(side * (W - 0.15), at.y - 1.35, at.z); p.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
      r.tick(() => { p.visible = r.t > 0.8 && r.t < 7.5; });
      sound('window', at, { gain: 0.8 }); r.later(7.4, () => sound('window', at, { gain: 0.6 }));
      if (o.shout) r.later(1.2, () => sound('voice', at, { mood: 'shout', n: 8, f0: 120, gain: 1 }));
    }),
    gaufre_balcony: () => run('gaufre_balcony', 18, (r) => {
      const c = world.cast?.cat; if (!c || !A.balcony) return;
      r.borrow(c); c.visible = true; c.position.set(A.balcony.x - 0.15, A.balcony.y, A.balcony.z + 0.3); c.rotation.y = -Math.PI / 2;
    }),
    // Une bouteille vide roule sur les pavés, puis tinte contre un pied de chaise
    bottle_rolls: () => run('bottle_rolls', 8, (r) => {
      const b = new THREE.Group(); cyl(b, 0.035, 0.24, M(0x2f6b3a, { roughness: 0.15, transparent: true, opacity: 0.85 }), 0, 0, 0, 8); b.children[0].rotation.z = Math.PI / 2; r.add(b);
      const t = nearTable(), end = t ? t.group.position.clone().add(V(0.6, 0, 0)) : V(-1, 0, bz + 2), start = end.clone().add(V(3.5, 0, -2));
      b.position.copy(start).setY(0.04);
      r.tick((dt) => { const k = Math.min(1, r.t / 3); b.position.lerpVectors(start, end, 1 - (1 - k) ** 2).setY(0.04); b.rotation.x += dt * 6 * (1 - k); });
      sound('bottle', end, { seconds: 3, gain: 1 });
    }),
    glass_breaks: () => run('glass_breaks', 5, (r) => {
      const t = nearTable(); const p = t ? t.group.position.clone().setY(0.4) : V(-1, 0.4, bz + 3);
      sound('glassbreak', p, { gain: 1 }); r.later(0.7, () => sound('applause', p, { gain: 0.6, n: 30, seconds: 1.6 }));
      for (const q of t?.people ?? []) if (q.visible) { r.borrow(q); setState(q, { anim: 'cheer' }); }
      for (let i = 0; i < 8; i++) { const s = r.add(new THREE.Mesh(new THREE.TetrahedronGeometry(0.03), M(0xdff2ff, { roughness: 0.1, transparent: true, opacity: 0.8 }))); s.position.set(p.x + rnd(-0.4, 0.4), 0.01, p.z + rnd(-0.4, 0.4)); }
    }),
    chair_falls: () => run('chair_falls', 8, (r) => {
      const t = nearTable(); const p = t ? t.group.position.clone().add(V(0.9, 0, 0.6)) : V(-1, 0, bz + 3);
      const c = new THREE.Group(); box(c, 0.42, 0.04, 0.42, M(0x8a8f96, { metalness: 0.6 }), 0, 0.45, 0); box(c, 0.42, 0.45, 0.04, M(0x8a8f96, { metalness: 0.6 }), 0, 0.68, -0.2);
      for (const [x, z] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) box(c, 0.03, 0.45, 0.03, M(0x8a8f96, { metalness: 0.6 }), x, 0.22, z);
      c.position.copy(p); r.add(c);
      r.tick(() => { c.rotation.x = r.t < 0.6 ? -(r.t / 0.6) * (Math.PI / 2) : -Math.PI / 2; if (r.t > 4.5) c.rotation.x = 0; });
      r.later(0.6, () => sound('crash', p, { gain: 0.7 }));
      if (world.waiter) r.later(3.5, () => { r.borrow(world.waiter); world.waiter.position.copy(p).add(V(0.6, 0, 0)); setState(world.waiter, { anim: 'give' }); });
    }),
    toast: () => run('toast', 7, (r) => {
      const t = nearTable(); if (!t) return;
      for (const q of t.people) if (q.visible) { r.borrow(q); setState(q, { anim: 'cheer', held: 'beer', expr: 'happy' }); }
      r.later(0.3, () => sound('voice', t.group.position, { mood: 'shout', n: 4, f0: 150 }));
      for (let i = 0; i < 4; i++) r.later(0.9 + i * 0.15, () => sound('click', t.group.position, { gain: 0.5 }));
    }),
    group_photo: () => run('group_photo', 6, (r) => {
      const t = nearTable(); if (!t) return;
      const p = t.group.position.clone().add(V(Math.sign(-t.group.position.x || 1) * 1.6, 1.2, 0));
      const l = new THREE.PointLight(0xffffff, 0, 8); l.position.copy(p); r.add(l);
      const ph = r.add(person({ held: 'film', anim: 'film' })); ph.position.copy(p).setY(0); ph.rotation.y = Math.atan2(t.group.position.x - p.x, 0);
      r.tick(() => { l.intensity = r.t > 2 && r.t < 2.12 ? 40 : 0; });
      r.later(2, () => sound('shutter', p, { gain: 1 }));
      for (const q of t.people) if (q.visible) { r.borrow(q); setState(q, { anim: 'wave', expr: 'happy' }); }
    }),
    phone_loud: () => run('phone_loud', 12, (r) => {
      const t = nearTable(); const q = t?.people.find((p) => p.visible); if (!q) return;
      r.borrow(q); setState(q, { anim: 'idle', held: 'phone' });
      for (let k = 0; k < 4; k++) r.later(0.5 + k * 2.6, () => sound('voice', q.getWorldPosition(V()), { mood: k % 2 ? 'calm' : 'ask', n: 6, f0: k % 2 ? 120 : 170, gain: 0.7 }));
    }),
    birthday_far: () => run('birthday_far', 10, (r) => {
      const t = world.tables.filter((x) => x.group.visible).sort((a, b) => Math.abs(b.group.position.z - bz) - Math.abs(a.group.position.z - bz))[0];
      if (!t) return;
      for (const q of t.people) if (q.visible) { r.borrow(q); setState(q, { anim: 'sing' }); }
      sound('birthday', t.group.position, { gain: 0.8 });
    }),
    dede_laugh: () => run('dede_laugh', 5, (r) => {
      const d = world.cast?.dede; if (!d) return;
      r.borrow(d); setState(d, { anim: 'greet', expr: 'happy' });
      sound('voice', d.position, { mood: 'shout', n: 6, f0: 110, gain: 0.8 });
    }),
    ghislain_smoke: () => run('ghislain_smoke', 20, (r) => {
      const g = world.cast?.ghislain; if (!g) return;
      r.borrow(g); g.visible = true;
      g.position.set(A.bernadetteDoor.x + Math.sign(-A.bernadetteDoor.x || 1) * 0.6, 0, A.bernadetteDoor.z + 0.4);
      g.rotation.y = A.bernadetteDoor.x < 0 ? Math.PI / 2 : -Math.PI / 2;
      setState(g, { anim: 'smoke', held: 'cig' });
      r.later(6, () => { g.rotation.y += 0.6; }); // il lève les yeux vers la fenêtre
      if (art?.fx?.smoke) art.fx.smoke(g.position.clone().setY(1.6), { rate: 3, life: 3, duration: 15, size: [0.2, 0.6], alpha: 0.3 });
    }),
    seb_nico_laugh: () => run('seb_nico_laugh', 7, (r) => {
      for (const id of ['seb', 'nico']) { const p = world.cast?.[id]; if (!p) continue; r.borrow(p); p.visible = true; setState(p, { anim: id === 'seb' ? 'wave' : 'idle', expr: 'happy' }); }
      sound('voice', A.balcony ?? V(W, 6, bz), { mood: 'calm', n: 6, f0: 130 }); r.later(2.2, () => sound('voice', A.balcony ?? V(W, 6, bz), { mood: 'ask', n: 3, f0: 150 }));
    }),
    exhaust_cough: (o) => run('exhaust_cough', 8, (r) => {
      const at = world.exhaust ?? V(-W, 6, bz + 1);
      art?.fx?.smoke?.(at.clone().add(V(0.3, 0.2, 0)), { rate: o.big ? 30 : 18, life: 3, color: 0xb0a080, rise: 0.8, duration: 2.5, size: [0.4, 1.4], alpha: 0.5 });
      sound('pfff', at, { gain: 1 });
    }),
    ac_drip: () => run('ac_drip', 10, (r) => {
      const at = V(-W + 0.25, 3.2, bz + 0.6);
      const ac = new THREE.Group(); box(ac, 0.3, 0.45, 0.7, M(0xd8d4cc), 0, 0, 0); ac.position.copy(at); r.add(ac);
      r.tick(() => { if (Math.random() < 0.06) drop(at.clone().add(V(0.1, -0.25, 0)), V(0, -0.5, 0), 0.8, 0.03); });
      sound('drip', V(at.x, 0.2, at.z), { n: 6, gain: 1 });
    }),
    umbrella_flap: () => run('umbrella_flap', 6, (r) => {
      art?.terrace?.parasols?.(false); r.later(4, () => art?.terrace?.parasols?.(true));
      sound('paper', nearTable()?.group.position ?? V(-1, 2, bz), { gain: 1 });
    }),
    cat_fight: () => run('cat_fight', 9, (r) => {
      const z = zA + 3, a = r.add(makeCat(0x333333)), b = r.add(makeCat(0xe39548));
      a.position.set(W - 0.6, 0, z); b.position.set(W - 1.2, 0, z + 0.4); a.rotation.y = -1.2; b.rotation.y = 2;
      r.tick(() => { a.position.x = W - 0.6 + Math.sin(r.t * 9) * 0.08; b.position.z = z + 0.4 + Math.cos(r.t * 8) * 0.08; });
      sound('cats', a.position, { gain: 1 }); r.later(3, () => sound('cats', a.position, { gain: 0.8 }));
    }),
    binoculars_glint: () => run('binoculars_glint', 4, (r) => {
      const at = A.klaasWindow ?? V(0, 3, zB); const s = r.add(new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 }))); s.position.copy(at);
      r.tick(() => { s.material.opacity = Math.max(0, Math.sin(r.t * 5)) * (r.t < 3 ? 1 : 0); });
    }),
    rain_look: () => run('rain_look', 6, (r) => { for (const t of outTables().slice(0, 4)) for (const q of t.people) if (q.visible && Math.random() < 0.6) { r.borrow(q); setState(q, { anim: 'binoculars' }); } }),
    rain_umbrellas: () => run('rain_umbrellas', 20, (r) => { for (const t of outTables()) for (const q of t.people) if (q.visible && Math.random() < 0.5) { r.borrow(q); setState(q, { held: 'umbrella' }); } }),
    gutter: () => run('gutter', 12, (r) => {
      const at = V(W - 0.1, 3.5, bz + 3);
      r.tick(() => { for (let i = 0; i < 2; i++) drop(at.clone().add(V(rnd(-0.05, 0.05), 0, rnd(-0.1, 0.1))), V(-0.4, 0, 0), 1, 0.04); });
      r.later(3, () => sound('splash', V(at.x - 0.6, 0.2, at.z), { gain: 0.4 })); r.later(4, () => sound('voice', V(at.x - 0.8, 1, at.z), { mood: 'angry', n: 3, f0: 130 }));
    }),
    // Une tour de gobelets sur le rebord de la porte de Pilou, qui tient
    glass_stack: () => run('glass_stack', 40, (r) => {
      const at = V(-W + 0.35, 0.5, bz + 1.4), g = new THREE.Group(); g.position.copy(at); r.add(g);
      for (let row = 0; row < 4; row++) for (let i = 0; i <= 3 - row; i++) cyl(g, 0.04, 0.1, M(0xdff2ff, { transparent: true, opacity: 0.7, roughness: 0.1 }), 0, row * 0.1 + 0.05, (i - (3 - row) / 2) * 0.085, 8);
    }),
    owl: () => run('owl', 4, () => sound('owl', V(W - 1, 9, bz + 8), { gain: 1 })),
    snore: () => run('snore', 6, () => sound('snore', A.balcony ?? V(W, 6, bz), { gain: 0.8 })),
    quiet: () => run('quiet', 9, () => { audio?.duck?.(8, 0.15); }),
    sunset: () => run('sunset', 20, (r) => {
      const l = new THREE.DirectionalLight(0xff9a4a, 0); l.position.set(-20, 12, zA); r.add(l);
      r.tick(() => { l.intensity = 1.6 * Math.sin(Math.min(1, r.t / 20) * Math.PI); });
    }),
    desk_lamp: () => run('desk_lamp', 6, (r) => { const s = world.homeScreen; if (!s) return; const l = new THREE.PointLight(0xfff0d0, 0, 3); l.position.copy(s.position).add(V(-0.4, 0.3, 0)); r.add(l); r.tick(() => { l.intensity = r.t < 5 ? 1.2 : 0; }); }),
    // L'ardoise des Mal Lunés / le serveur efface « Waterzooi »
    ardoise: () => run('ardoise', 30, (r) => {
      const rp = tablesOf('malunes')[0]?.group.position ?? V(W - 2, 0, bz + 15);
      const g = new THREE.Group(); g.position.set(Math.sign(rp.x || 1) * (W - 0.9), 0, rp.z - 1.5); r.add(g);
      box(g, 0.6, 0.9, 0.05, M(0x1f2a24), 0, 0.85, 0); box(g, 0.05, 0.9, 0.4, M(0x5b3a1e), 0, 0.45, -0.2);
    }),
    waiter_board: () => run('waiter_board', 10, (r) => {
      const w = world.waiter; if (!w) return;
      r.borrow(w); w.visible = true; w.position.set(A.bernadetteDoor.x + 0.9 * Math.sign(-A.bernadetteDoor.x || 1), 0, A.bernadetteDoor.z - 1.2); setState(w, { anim: 'clean' });
      const g = new THREE.Group(); g.position.copy(w.position).add(V(0.4 * Math.sign(-A.bernadetteDoor.x || 1), 0, -0.6)); r.add(g);
      box(g, 0.6, 0.9, 0.05, M(0x1f2a24), 0, 0.85, 0);
    }),
    waiter_setup: () => run('waiter_setup', 10, (r) => {
      const w = world.waiter; if (!w) return;
      r.borrow(w); w.visible = true; w.position.set(A.bernadetteDoor.x + 0.8 * Math.sign(-A.bernadetteDoor.x || 1), 0, A.bernadetteDoor.z + 0.8); setState(w, { anim: 'tray', held: null });
      for (let i = 0; i < 4; i++) r.later(1 + i * 1.5, () => sound('click', w.position, { gain: 0.6 }));
    }),
    waiter_smoke: () => run('waiter_smoke', 20, (r) => {
      const w = world.waiter, t = nearTable(); if (!w || !t) return;
      r.borrow(w); w.visible = true; w.position.copy(t.group.position).add(V(0.7, 0, 0.7)); setState(w, { anim: 'smoke', held: 'cig' });
    }),
    guitarist: (o) => run('guitarist', o.leave ? 10 : 120, (r) => {
      const at = V(W - 0.8, 0, zA + 4);
      const p = r.add(person({ held: 'accordion', anim: 'accordion', hair: 'long', shirt: 0x3a5a3a, expr: 'happy' }));
      p.position.copy(at); p.rotation.y = -Math.PI / 2;
      if (o.leave) { r.later(4, () => r.walk(p, [V(W - 0.8, 0, zA - 6)], { speed: 1.2 })); return; }
      for (let k = 0; k < 8; k++) r.later(2 + k * 14, () => sound('sing', at.clone().setY(1.4), { f0: 180, gain: 0.7, notes: [[0, 0.5], [4, 0.5], [7, 0.5], [9, 1], [7, 0.5], [4, 1]] }));
    }),
    pigeon: () => run('pigeon', 7, (r) => {
      const t = nearTable(); const p = t ? t.group.position.clone().setY(0.8) : V(-1, 0.8, bz + 3);
      const b = new THREE.Group(); const body = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), M(0x7a8088)); body.scale.set(1, 0.8, 1.4); b.add(body);
      const wg = box(b, 0.32, 0.01, 0.12, M(0x6a7078), 0, 0.03, 0); r.add(b);
      const from = p.clone().add(V(4, 4, -3)), to = p.clone().add(V(-3, 5, 4));
      r.tick(() => { const k = r.t; b.position.copy(k < 2 ? from.clone().lerp(p, k / 2) : k < 3.5 ? p : p.clone().lerp(to, (k - 3.5) / 3)); wg.scale.x = k > 2 && k < 3.5 ? 0.4 : 0.6 + Math.abs(Math.sin(k * 20)) * 0.6; });
    }),
    // Les cloches de Saint-Maurice (n coups) — le son, et un vol de pigeons au-dessus des toits vers la place
    bells: (o) => run('bells', 6, () => { if (!o.soft) audio?.bell?.(o.n ?? 1); else audio?.duck?.(3, 0.5); }),
    talk: (o) => run('talk', 4, () => sound('voice', o.pos ?? V(0, 1.5, bz + 3), { mood: o.mood ?? 'calm', n: o.n ?? 6, f0: o.f0 ?? 150 })),
  };

  return {
    ids: Object.keys(STAGES),
    get active() { return [...runs].map((r) => r.id); },
    has: (id) => !!STAGES[typeof id === 'string' ? id : id?.id],
    // Joue un repère : 'id' ou { id, …opts }. Une même scène ne se joue pas deux fois en même temps.
    play(cue, extra = {}) {
      const c = typeof cue === 'string' ? { id: cue } : { ...cue };
      const f = STAGES[c.id];
      if (!f) { console.warn(`stage : scène inconnue « ${c.id} »`); return null; }
      if ([...runs].some((r) => r.id === c.id)) return null;
      if ([...runs].filter((r) => !r.long).length >= 8) return null;
      try { const r = f({ ...c, ...extra }); runs.add(r); return r; } catch (err) { console.warn('stage :', err); return null; }
    },
    // Une scène sur mesure (twists) avec les mêmes outils : r.add / walk / borrow / em / later / tick / end. dur en s (Infinity : à arrêter)
    run(id, dur, setup) { const r = run(id, dur, setup); r.long = true; runs.add(r); return r; },
    get anchors() { return { W, bz, zA, zB }; },
    update(dt) {
      for (const r of runs) {
        r.t += dt;
        try {
          for (const a of r.at) if (!a.done && r.t >= a.s) { a.done = true; a.f(); }
          for (const f of r.ticks) f(dt);
        } catch (err) { console.warn('stage :', err); r.t = r.dur; }
        if (r.t >= r.dur) this.stop(r);
      }
    },
    stop(r) {
      if (!runs.delete(r)) return;
      for (const f of r.ends) { try { f(); } catch { /* acteur déjà parti */ } }
      for (const o of r.objs) scene.remove(o);
      for (const e of r.ems) e.stop?.();
    },
    clear() { for (const r of [...runs]) this.stop(r); },
  };
}

export const STAGE_IDS = ['passerby', 'scooter', 'bike', 'delivery_rider', 'kid_scooter', 'tourist_lost', 'couple_argue', 'drunk_singer', 'student_choir', 'bachelor_party', 'crowd_song', 'dog_walker', 'dog_far', 'street_sweeper', 'taxi', 'ambulance', 'police_car_far', 'wedding_car', 'window_opens', 'gaufre_balcony', 'bottle_rolls', 'glass_breaks', 'chair_falls', 'toast', 'group_photo', 'phone_loud', 'birthday_far', 'dede_laugh', 'ghislain_smoke', 'seb_nico_laugh', 'exhaust_cough', 'ac_drip', 'umbrella_flap', 'cat_fight', 'binoculars_glint', 'rain_look', 'rain_umbrellas', 'gutter', 'glass_stack', 'owl', 'snore', 'quiet', 'sunset', 'desk_lamp', 'ardoise', 'waiter_board', 'waiter_setup', 'waiter_smoke', 'guitarist', 'pigeon', 'bells', 'talk'];
