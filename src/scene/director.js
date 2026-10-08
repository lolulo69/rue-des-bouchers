// Metteur en scène de la nuit : traduit l'état de la simulation (sim.state, son journal, ses événements) et les
// drapeaux de campagne en positions, états d'animation, accessoires et effets. Le jeu n'appelle que :
//   const director = createDirector({ scene, world, art, audio });
//   director.onEvent(e)                       pour chaque événement de sim.drainEvents()
//   director.update(sim, campaign?.state, dt) à chaque frame
//   director.hitTargets()                     cibles du raycast photo (pipis, policiers)
//   director.toggleLegalView()                vue « zones légales » (touche L)
// La simulation reste la seule source de vérité : le metteur en scène ne fait que la montrer.
import * as THREE from 'three';
import { CAST, customer, setState, bike as makeBike } from '../art/characters.js';
import { FILM_MINUTES, PATROL_CAST } from './schedule.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const toV = (p, y) => (p ? V(p.x, y ?? p.y ?? 0, p.z) : null);

export function createDirector({ scene, world, art, audio }) {
  const A = world.anchors;
  const cast = world.cast;
  const viewTables = new Map(world.tables.map((v) => [v.id, v]));
  const W = Math.abs(world.window.pos.x) - 0.3;
  let t = 0;
  let built = false;
  let ghost = null;
  const props = new Map(); // clé → handle de art.props (accessoires pilotés par l'état)
  const state = { journalAt: 0, police: null, coffee: null, bribeDone: new Set(), films: [], waiterBreak: false, cleaning: false, exhaust: false };
  const home = new Map(Object.entries(cast).map(([id, p]) => [id, { pos: p.position.clone(), rot: p.rotation.y }]));

  // ---------- acteurs créés à la demande ----------
  const standing = []; // { g, view }
  const pees = Array.from({ length: 4 }, () => {
    const p = customer('stand');
    setState(p, { held: null, talk: 0.1 });
    const hit = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.8, 6), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.y = 0.9;
    p.add(hit);
    p.visible = false;
    scene.add(p);
    return { p, hit };
  });
  const officers = [0, 1].map(() => {
    const hit = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.8, 6), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.y = 0.9;
    hit.userData.target = { kind: 'police' };
    return { p: null, id: null, hit, bike: null };
  });
  function dressOfficer(o, id, bike) {
    if (o.id !== id) {
      if (o.p) { o.p.remove(o.hit); o.p.visible = false; }
      o.p = art.cast.spawn(id, { visible: false });
      o.p.add(o.hit);
      o.id = id;
      o.bike = null;
    }
    if (bike && !o.bike) { o.bike = makeBike(); o.p.add(o.bike); setState(o.p, { anim: 'ride', held: null }); }
    if (!bike && o.bike) { o.p.remove(o.bike); o.bike = null; setState(o.p, { anim: 'idle' }); }
  }

  function build(sim) {
    built = true;
    // Théo renvoyé (sim.waiterId = 'nouveau') : un autre serveur prend sa place dès la nuit suivante
    if (sim.waiterId === 'nouveau' && world.waiter.userData.waiterId !== 'nouveau') {
      const old = world.waiter;
      const neo = CAST.nouveau();
      neo.position.copy(old.position); neo.rotation.y = old.rotation.y; neo.scale.copy(old.scale);
      neo.userData.waiterId = 'nouveau';
      old.parent?.remove(old);
      scene.add(neo);
      world.waiter = cast.waiter = cast.serveur = neo;
    }
    for (const g of sim.state.standing ?? []) {
      const view = world.standingCrowd({ x: g.x, z: g.z, n: g.size, barrel: false });
      view.group.visible = false;
      standing.push({ g, view });
    }
  }

  // ---------- accessoires pilotés par l'état (drapeaux, état de la nuit) ----------
  function want(key, on, make) {
    const h = props.get(key);
    if (on && !h) props.set(key, make());
    else if (!on && h) { h.remove(); props.delete(key); }
  }
  const counterBannerAt = () => toV(A.bernadetteDoor, 3.95).setX(-(W + 0.3) + 0.02).setZ(A.bernadetteDoor.z + 3.5);
  function syncFlags(flags) {
    const has = (f) => flags.includes(f);
    want('banner:balcony', has('banners_up'), () => art.props.place('banner', 'balconyRail', { length: 2.2 }));
    want('banner:pilou', has('banners_up'), () => art.props.place('banner', 'pilouBanner', { length: 1.8 }));
    want('banner:counter', has('cm_counter_banner'), () => art.props.place('banner', counterBannerAt(), { text: 'ICI ON VIT, HEIN !', length: 3 }));
    const uri = has('uritrottoir_installed') || has('cm_uritrottoir_terrace');
    const annexed = has('cm_uritrottoir_terrace');
    want(`uritrottoir:${annexed ? 'terrace' : 'street'}`, uri, () => art.props.place('uritrottoir', annexed ? V(-(W - 0.5), 0, A.bernadetteDoor.z - 1.2) : 'uritrottoirSpot'));
    want(`uritrottoir:${annexed ? 'street' : 'terrace'}`, false);
    want('gadget:window', has('camera_window'), () => art.props.place('gadget', 'pilouSill'));
    const awningCam = has('camera_awning') && !has('camera_found');
    want('gadget:awning', awningCam, () => art.props.place('gadget', 'awning'));
    want('line:power', awningCam && has('power_stolen'), () => art.props.line('awningSocket', A.awning, { color: 0x2a2a2a, sag: 0.08 }));
  }
  // les accessoires des actions qui ont aussi un drapeau ne sont posés qu'une fois (par le drapeau)
  const FLAG_PROPS = { night_camera_window: 'gadget:window', night_camera_awning: 'gadget:awning', night_borrow_power: 'line:power', night_cardboard_exhaust: 'cardboard' };

  // ---------- événements de la simulation ----------
  function onEvent(e) {
    if (e.type === 'splash') art.fx.splash();
    else if (e.type === 'art') {
      const pos = toV(e.pos);
      if (e.fx && e.fx !== 'exhaustBlocked') art.fx[e.fx]?.(pos ?? undefined); // la hotte bouchée suit l'état (update)
      if (e.prop && !FLAG_PROPS[e.action]) props.set(`${e.prop}:${e.action}:${props.size}`, art.props.place(e.prop, pos ?? undefined));
      if (e.terrace) art.terrace[e.terrace]?.();
      if (e.anim && !(e.anim[0] === 'jeremie' && e.anim[1] === 'walk')) art.anim.play(...e.anim); // la ronde suit sim.dogPos
    }
  }

  // ---------- journal : réactions aux actes ----------
  function readJournal(sim) {
    const J = sim.state.journal ?? [];
    for (; state.journalAt < J.length; state.journalAt++) {
      const j = J[state.journalAt];
      // un acte filmé : les clients autour lèvent leur téléphone quelques minutes
      if (j.type === 'night-action' && j.filmed && j.pos) {
        const near = world.tables.filter((v) => Math.hypot(v.group.position.x - j.pos.x, v.group.position.z - j.pos.z) < 9);
        art.terrace.film(true, { tables: near, share: 0.6 });
        state.films.push({ until: sim.state.min + FILM_MINUTES, tables: near });
      }
    }
  }

  // ---------- la police (appel, visite pour Pilou) ----------
  function syncPolice(sim, sat) {
    const S = sim.state, P = S.police;
    const visit = S.visit?.phase === 'onsite' ? S.visit : null;
    const active = (P && P.phase !== 'pending') || visit;
    if (!active) {
      for (const o of officers) if (o.p) o.p.visible = false;
      if (state.police) endPoliceScene();
      return;
    }
    const lead = PATROL_CAST[P?.patrolId] ?? 'lemaire';
    dressOfficer(officers[0], lead, sat);
    dressOfficer(officers[1], 'police', sat);
    const pos = sim.policePositions(); // trajet calculé par la sim (src/sim/schedule.js)
    officers.forEach((o, i) => {
      const p = o.p, q = pos[i];
      p.visible = !!q;
      if (!q) return;
      p.position.set(q.x, 0, q.z);
      p.rotation.y = q.heading;
    });
    // Sur place à l'estaminet : Dédé les accueille, café si complaisance, enveloppe si pot-de-vin
    if (P?.phase === 'onsite' && P.restId === 'bernadette') {
      if (!state.police) {
        state.police = P.callId;
        art.anim.play('dede', 'greet', { seconds: 4 });
        audio?.play('radio', { pos: officers[0].p.position });
      }
      const outcome = S.policeLog?.find((x) => x.callId === P.callId)?.outcome;
      if (outcome === 'complaisance' && !state.coffee) {
        state.coffee = art.props.place('police-coffee');
        for (const o of officers) setState(o.p, { held: 'coffee', expr: 'happy', talk: 0.8 });
      }
      const b = sim.activeBribe?.();
      if (b && !state.bribeDone.has(b.id)) {
        state.bribeDone.add(b.id);
        art.anim.envelope('dede', officers[0].p);
      }
    } else if (state.police && P?.phase !== 'onsite') endPoliceScene();
  }
  function endPoliceScene() {
    state.police = null;
    state.coffee?.remove(); state.coffee = null;
    for (const o of officers) if (o.p) setState(o.p, { held: null, expr: 'neutral', talk: 0.2 });
    art.anim.stop('dede');
  }

  // ---------- vue légale (L) : zones de terrasse et couloir ----------
  function buildGhost(sim) {
    const { ZONES, STREET } = sim.cfg;
    ghost = new THREE.Group();
    const ghostMat = (color) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.22, depthWrite: false });
    const corridor = new THREE.Mesh(new THREE.PlaneGeometry(ZONES.corridorHalfWidth * 2, STREET.length), ghostMat(0xff4040));
    corridor.rotation.x = -Math.PI / 2;
    corridor.position.y = 0.03;
    ghost.add(corridor);
    for (const r of sim.restaurants) {
      const depth = STREET.halfWidth - ZONES.corridorHalfWidth;
      const zone = new THREE.Mesh(new THREE.PlaneGeometry(depth, r.z1 - r.z0), ghostMat(0x40ff70));
      zone.rotation.x = -Math.PI / 2;
      zone.position.set(r.side * (ZONES.corridorHalfWidth + depth / 2), 0.035, (r.z0 + r.z1) / 2);
      ghost.add(zone);
    }
    const ringGeo = new THREE.RingGeometry(ZONES.tableFootprint - 0.06, ZONES.tableFootprint, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xff2020, transparent: true, opacity: 0.8, depthWrite: false });
    for (const tb of sim.state.tables) {
      if (sim.encroachment(tb) <= 0) continue;
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.userData.tableId = tb.id;
      ghost.add(ring);
    }
    ghost.visible = false;
    scene.add(ghost);
  }

  // ---------- chaque frame ----------
  function update(sim, cs, dt) {
    t += dt;
    const S = sim.state, min = S.min;
    if (!built) build(sim);
    if (!ghost) buildGhost(sim);
    const sat = sim.day?.key === 'sat';

    // Terrasses : la sim décide (dehors, nombre, recalage hors du couloir) ; les clients tournent la tête
    for (const tb of S.tables) {
      const v = viewTables.get(tb.id);
      if (!v) continue;
      v.group.visible = tb.out;
      v.group.position.x = tb.x;
      v.people.forEach((p, i) => {
        p.visible = i < tb.count;
        if (tb.out) p.rotation.y = Math.sin(t * 0.7 + p.userData.phase) * 0.4;
      });
    }
    if (ghost.visible) for (const r of ghost.children) {
      if (!r.userData.tableId) continue;
      const tb = sim.table(r.userData.tableId);
      r.visible = tb.out && sim.encroachment(tb) > 0;
      r.position.set(tb.x, 0.04, tb.z);
    }

    // Le serveur : va-et-vient de la sim, sauf pendant ses pauses clope (sous le store)
    const waiter = world.waiter;
    waiter.visible = sim.waiterOnDuty();
    const onBreak = waiter.visible && !!sim.waiterOnBreak?.(); // horaires : src/sim/schedule.js (les témoins les connaissent)
    if (onBreak !== state.waiterBreak) {
      state.waiterBreak = onBreak;
      if (onBreak) art.anim.play('serveur', 'smoke', { move: false });
      else art.anim.stop('serveur', { place: false });
    }
    const wp = sim.waiterPos();
    waiter.position.set(wp.x, 0, wp.z);
    waiter.rotation.y = onBreak ? (wp.x < 0 ? Math.PI / 2 : -Math.PI / 2) : Math.cos(min * sim.cfg.ANCHORS.waiter.speed) > 0 ? 0 : Math.PI;

    // Ghislain frotte le store sur son escabeau en début de soirée
    const cleaning = !!sim.ghislainCleaning?.();
    if (cleaning !== state.cleaning) {
      state.cleaning = cleaning;
      if (cleaning) art.anim.play('ghislain', 'clean');
      else art.anim.stop('ghislain');
    }

    // Place Maurice-Schumann : Klaas veille (jumelles quand il guette), Hilde avec lui
    cast.klaas.visible = sim.klaasAwake();
    if (cast.hilde) cast.hilde.visible = sim.klaasAwake();
    const watching = sim.klaasWatching?.() ?? false;
    const kRig = cast.klaas.userData.rig;
    if (watching && kRig.anim !== 'binoculars') art.anim.play('klaas', 'binoculars');
    else if (!watching && kRig.anim === 'binoculars') art.anim.play('klaas', 'write');

    // Balcon d'en face : le chat = Seb & Nico sont là
    const home2 = sim.catPresent();
    cast.cat.visible = home2;
    if (cast.seb) cast.seb.visible = home2;
    if (cast.nico) cast.nico.visible = home2;

    // La ronde de 22h : Biloute en tête au bout de sa laisse, Jérémie derrière (positions de la sim)
    const dogOn = sim.dogActive?.() ?? false;
    const j = cast.jeremie, dog = cast.dog;
    if (dogOn) {
      const dp = sim.dogPos();
      const dz = Math.sign(sim.cfg.DOG.z1 - sim.cfg.DOG.z0) || 1;
      dog.position.set(dp.x, 0, dp.z);
      dog.rotation.y = dz > 0 ? 0 : Math.PI;
      j.position.set(dp.x - 0.32 * dz, 0, dp.z - 0.75 * dz);
      j.rotation.y = dog.rotation.y;
      j.visible = dog.visible = true;
      setState(j, { anim: 'leash' });
      if (S.dogSpotted && Object.keys(S.dogSpotted).length > (state.barks ?? 0)) {
        state.barks = Object.keys(S.dogSpotted).length;
        art.anim.play('biloute', 'bark', { seconds: 2.5 });
      }
    } else {
      // avant la ronde : à la porte ; après : rentrés au 3e étage
      const before = min < sim.cfg.DOG.start;
      j.visible = dog.visible = before && min > sim.cfg.DOG.start - 20;
      if (j.visible) {
        const hj = home.get('jeremie'), hd = home.get('dog');
        j.position.copy(hj.pos); j.rotation.y = hj.rot; dog.position.copy(hd.pos); dog.rotation.y = hd.rot;
      }
    }

    // Samedi : groupes de buveurs debout
    for (const { g, view } of standing) view.group.visible = min >= g.arriveAt && min < g.leaveAt;

    // Pipis dans les portes : de dos, face au mur (discret)
    const active = sim.activePees();
    pees.forEach((v, i) => {
      const pe = active[i];
      v.p.visible = !!pe;
      v.hit.userData.target = pe ? { kind: 'pee', id: pe.id } : null;
      if (!pe) return;
      const side = Math.sign(pe.doorway.x);
      v.p.position.set(pe.doorway.x - side * 0.45, 0, pe.doorway.z);
      v.p.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
    });

    syncPolice(sim, sat);

    // La hotte : vapeur jusqu'à l'arrêt de la cuisine ; carton = fumée qui ressort par la cuisine
    const { NOISE } = sim.cfg;
    world.steam.intensity = min < NOISE.exhaustOffMinute ? 1 : Math.max(0, world.steam.intensity - dt * 0.3);
    world.steam.update(dt);
    const blocked = !!S.exhaustBlocked && min < NOISE.exhaustOffMinute;
    if (blocked !== state.exhaust) { state.exhaust = blocked; art.fx.exhaustBlocked(blocked); }
    want('cardboard', !!S.exhaustBlocked, () => art.props.place('cardboard'));

    // Météo (sim.weather) : pluie / bruine, pavés qui restent mouillés ~40 min de jeu après la pluie
    const w = sim.weather?.() ?? null;
    const plan = S.weather;
    const wet = plan && min >= plan.start ? (min < plan.end ? (w?.intensity ?? 0) / (plan.kind === 'drache' ? 1 : 0.35) * (plan.kind === 'drache' ? 1 : 0.5) : Math.max(0, (plan.kind === 'drache' ? 1 : 0.5) - (min - plan.end) / 40)) : 0;
    art.weather?.set(w?.kind ?? null, w?.intensity ?? 0, wet);
    audio?.rain?.(w ? w.intensity : 0);

    // Drapeaux de campagne (banderoles, uritrottoir, caméras)
    syncFlags(cs?.flags ?? []);

    readJournal(sim);
    for (let i = state.films.length - 1; i >= 0; i--) {
      if (min < state.films[i].until) continue;
      art.terrace.film(false, { tables: state.films[i].tables });
      state.films.splice(i, 1);
    }
    world.gameMinutes = min; // horloge du jeu pour l'audio (cloche de 22h)
  }

  return {
    update,
    onEvent,
    hitTargets: () => [...pees.filter((v) => v.p.visible).map((v) => v.hit), ...officers.filter((o) => o.p?.visible).map((o) => o.hit)],
    toggleLegalView: () => { if (ghost) ghost.visible = !ghost.visible; return ghost?.visible ?? false; },
    get legalView() { return ghost?.visible ?? false; },
    props,
  };
}
