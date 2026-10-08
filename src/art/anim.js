// Mise en scène : états des personnages, trajets, petites séquences (ronde de 22h, patrouille, enveloppe,
// course aux toilettes, chaise qui s'effondre, foule qui filme). Tout est mis à jour par onFrame (temps réel).
import * as THREE from 'three';
import { CAST, setState, relook, bike as makeBike } from './characters.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

export function createDirector(scene, world, { onFrame, audio, fx, props }) {
  const cast = world.cast;
  const A = world.anchors;
  const tasks = new Set(); // { update(dt) -> true quand fini }
  const timers = [];
  let clock = 0;
  onFrame((dt) => {
    clock += dt;
    for (const t of tasks) if (t.update(dt)) { tasks.delete(t); t.done?.(); }
    for (let i = timers.length - 1; i >= 0; i--) if (timers[i].at <= clock) { const f = timers[i].fn; timers.splice(i, 1); f(); }
  });
  const after = (sec, fn) => { timers.push({ at: clock + sec, fn }); };

  // ---------- Personnages ----------
  function get(id) {
    if (id?.isObject3D) return id;
    return cast[id] ?? spawn(id);
  }
  // Fait entrer en scène un personnage qui n'est pas dans la rue par défaut (police, mairie, presse...)
  function spawn(id, { at = null, face = null, visible = true } = {}) {
    if (cast[id] && !at) return cast[id];
    const make = CAST[id];
    if (!make) throw new Error(`art.anim : personnage inconnu « ${id} »`);
    const p = cast[id] ?? make();
    cast[id] = p;
    if (!p.parent) scene.add(p);
    if (at) p.position.copy(toV(at));
    if (face != null) p.rotation.y = typeof face === 'number' ? face : headingTo(p.position, toV(face));
    p.visible = visible;
    p.updateMatrixWorld();
    return p;
  }
  const toV = (q) => {
    const p = typeof q === 'string' ? A[q] ?? world[q]?.pos ?? world[q] : q;
    if (!p) throw new Error(`art.anim : point inconnu « ${q} »`);
    return p.isVector3 ? p.clone() : V(p.x, p.y ?? 0, p.z);
  };
  const headingTo = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);
  const rigOf = (p) => p.userData.rig;
  const remember = (p) => {
    const r = rigOf(p);
    r.st.def ??= { anim: r.anim, held: r.held, expr: r.expr, talk: r.talk, pos: p.position.clone(), rot: p.rotation.y, parent: p.parent };
    return r.st.def;
  };

  // Trajet : liste de points (Vector3, {x,z} ou noms d'ancres). follower = { proxy, offset: Vector3 } suit en formation.
  function walk(who, path, { speed = 1.3, loop = false, faceEnd = null, follower = null, onDone = null } = {}) {
    const p = get(who);
    remember(p);
    const pts = path.map(toV);
    let i = 0;
    const task = {
      p,
      update(dt) {
        const tgt = pts[i];
        const dx = tgt.x - p.position.x, dz = tgt.z - p.position.z, d = Math.hypot(dx, dz);
        if (d < 0.05) {
          i++;
          if (i >= pts.length) { if (!loop) return true; i = 0; }
          return false;
        }
        const step = Math.min(d, speed * dt);
        p.position.x += (dx / d) * step; p.position.z += (dz / d) * step;
        const want = Math.atan2(dx, dz);
        let da = want - p.rotation.y;
        da = Math.atan2(Math.sin(da), Math.cos(da));
        p.rotation.y += da * Math.min(1, dt * 8);
        p.updateMatrixWorld();
        if (follower) {
          const o = follower.offset.clone().applyAxisAngle(V(0, 1, 0), p.rotation.y);
          follower.proxy.position.set(p.position.x + o.x, follower.proxy.position.y, p.position.z + o.z);
          follower.proxy.rotation.y = p.rotation.y + (follower.turn ?? 0);
          follower.proxy.updateMatrixWorld();
        }
        return false;
      },
      done() { if (faceEnd != null) p.rotation.y = typeof faceEnd === 'number' ? faceEnd : headingTo(p.position, toV(faceEnd)); onDone?.(p); },
    };
    for (const t of tasks) if (t.p === p) tasks.delete(t); // un seul trajet à la fois par personnage
    tasks.add(task);
    return { stop: () => tasks.delete(task), promise: new Promise((res) => { const d = task.done; task.done = () => { d(); res(p); }; }) };
  }

  function tween(seconds, fn, done) {
    let t = 0;
    tasks.add({ update(dt) { t += dt; fn(Math.min(1, t / seconds)); return t >= seconds; }, done });
  }

  function expr(who, e, seconds = 0) {
    const p = get(who), r = rigOf(p);
    const prev = r.expr;
    r.expr = e;
    if (seconds) after(seconds, () => { if (r.expr === e) r.expr = prev; });
    return p;
  }

  // ---------- États prêts à l'emploi : art.anim.play(id, état, opts) ----------
  const presets = {
    binoculars: (p) => setState(p, { anim: 'binoculars', held: null }),
    write: (p) => setState(p, { anim: 'write', held: 'notebook' }),
    bark: (p, o) => {
      setState(p, { anim: 'bark' });
      const secs = o.seconds ?? 2.5;
      for (let k = 0; k < Math.ceil(secs / 0.55); k++) after(k * 0.55, () => {
        if (rigOf(p).anim !== 'bark') return;
        audio?.play('bark', { pos: p.position });
        fx?.barkPuff(p.localToWorld(V(0, 0.3, 0.35)));
      });
      after(secs, () => { if (rigOf(p).anim === 'bark') setState(p, { anim: 'idle' }); });
    },
    smoke: (p, o) => {
      setState(p, { anim: 'smoke', held: 'cig' });
      if (o.move !== false && A.smokeSpot) walk(p, [A.smokeSpot], { speed: 1.1, faceEnd: A.smokeSpot.x < 0 ? Math.PI / 2 : -Math.PI / 2 });
    },
    clean: (p, o) => {
      const spot = toV(o.at ?? 'awningCleanSpot');
      const stool = props.place('stool', spot);
      p.userData.artStool = stool;
      p.position.set(spot.x, 0.42, spot.z);
      p.rotation.y = spot.x < 0 ? -Math.PI / 2 : Math.PI / 2; // face au store (dos à la rue)
      p.updateMatrixWorld();
      setState(p, { anim: 'clean', held: 'brush', expr: 'neutral' });
    },
    struggle: (p, o) => {
      const spot = toV(o.at ?? 'chainSpot');
      p.position.set(spot.x + (spot.x < 0 ? 0.45 : -0.45), 0, spot.z);
      p.rotation.y = headingTo(p.position, spot);
      p.updateMatrixWorld();
      setState(p, { anim: 'struggle', held: 'key', expr: 'angry' });
      audio?.play('rattle', { pos: spot, repeat: 4 });
    },
    greet: (p) => { setState(p, { anim: 'greet', expr: 'happy' }); },
    window: (p) => setState(p, { anim: 'idle', held: 'phone', talk: 0.9 }),
    measure: (p, o) => {
      setState(p, { anim: 'measure', held: 'tape', expr: 'neutral', tapeLen: 0.05 });
      const L = o.length ?? 2.2;
      tween(2.5, (k) => { rigOf(p).tapeLen = 0.05 + (L - 0.05) * k; });
    },
    clipboard: (p) => setState(p, { anim: 'clipboard', held: 'clipboard' }),
    film: (p) => setState(p, { anim: 'film', held: 'film' }),
    type: (p) => setState(p, { anim: 'type', held: null }),
    coffee: (p) => setState(p, { anim: 'idle', held: 'coffee', talk: 0.8, expr: 'happy' }),
    round: () => round(true),
    patrol: (p, o) => patrol(p, o),
  };
  function play(who, state, opts = {}) {
    const p = get(who);
    remember(p);
    p.visible = true;
    const f = presets[state];
    if (f) f(p, opts); else setState(p, { anim: state, ...opts });
    if (opts.expr) rigOf(p).expr = opts.expr;
    if (opts.seconds && state !== 'bark') after(opts.seconds, () => stop(p));
    return p;
  }
  // Retour à l'état et à la place d'origine
  function stop(who, { place = true } = {}) {
    const p = get(who), r = rigOf(p), d = r.st.def;
    for (const t of tasks) if (t.p === p) tasks.delete(t);
    p.userData.artStool?.remove(); p.userData.artStool = null;
    p.userData.artBike && (p.remove(p.userData.artBike), p.userData.artBike = null);
    if (!d) return p;
    setState(p, { anim: d.anim, held: d.held, expr: d.expr, talk: d.talk });
    if (place) { p.position.copy(d.pos); p.rotation.y = d.rot; p.updateMatrixWorld(); }
    return p;
  }

  // ---------- Séquences ----------
  // La ronde de 22h : Jérémie et Biloute descendent la rue jusqu'aux Mal Lunés, remontent jusqu'à La Bombance, rentrent.
  let roundTask = null;
  function round(on = true, { loop = false, speed = 1.0 } = {}) {
    const j = get('jeremie'), dog = get('biloute');
    if (!on) { roundTask?.stop(); roundTask = null; stop(j); stop(dog); return; }
    remember(dog);
    setState(j, { anim: 'leash' });
    roundTask = walk(j, A.roundPath, { speed, loop, follower: { proxy: dog, offset: V(0.32, 0, 0.75) }, onDone: () => { stop(j); stop(dog); roundTask = null; } });
    return roundTask;
  }

  // Patrouille à pied, ou à vélo (samedi : pas de voitures). who = id ('lemaire', 'benali', 'chef') ou proxy.
  function patrol(who = 'lemaire', { path = A.patrolPath, bike = false, speed = bike ? 3.2 : 1.2, loop = false, onDone = null } = {}) {
    const p = get(who);
    remember(p);
    p.visible = true;
    if (bike && !p.userData.artBike) { const b = makeBike(); p.add(b); p.userData.artBike = b; setState(p, { anim: 'ride' }); }
    if (!bike) setState(p, { anim: 'idle', held: null });
    audio?.play('radio', { pos: p.position });
    const w = walk(p, path, { speed, loop, onDone });
    return w;
  }

  // L'enveloppe : Dédé glisse une enveloppe à un policier (silhouettes lisibles, regards furtifs)
  function envelope(giver = 'dede', receiver = 'lemaire', { at = null } = {}) {
    const g = get(giver);
    const rv = receiver?.isObject3D ? receiver : spawn(receiver);
    if (at) { const s = toV(at); g.position.copy(s); rv.position.set(s.x + (s.x < 0 ? 0.9 : -0.9), 0, s.z + 0.2); }
    g.rotation.y = headingTo(g.position, rv.position); rv.rotation.y = headingTo(rv.position, g.position);
    g.updateMatrixWorld(); rv.updateMatrixWorld();
    remember(g); remember(rv);
    setState(g, { anim: 'give', held: 'envelope', expr: 'suspicious' });
    setState(rv, { anim: 'idle', held: null, expr: 'suspicious' });
    after(1.8, () => { setState(g, { held: null, anim: 'idle' }); setState(rv, { anim: 'give', held: 'envelope' }); audio?.play('paper', { pos: g.position }); });
    after(3.0, () => { setState(rv, { anim: 'idle', held: null, expr: 'happy' }); setState(g, { anim: 'greet', expr: 'happy' }); });
    after(5.0, () => { stop(g, { place: false }); stop(rv, { place: false }); });
    return { giver: g, receiver: rv, handoverAt: 1.8 };
  }

  // Laxatifs : n clients d'une table se lèvent et filent aux toilettes de l'estaminet, mains sur le ventre.
  // Comique, pas dégoûtant : petits pas pressés, goutte de sueur, file d'attente, panneau « OCCUPÉ ».
  function rush(table, n = 3, { door = A.bernadetteDoor, returnAfter = 40 } = {}) {
    const seated = table.people.filter((p) => p.visible && !rigOf(p).hidden).slice(0, n);
    const d = toV(door);
    const out = d.x < 0 ? 1 : -1;
    const sign = props.place('occupied', d);
    const runners = seated.map((p, i) => {
      const r = relook(p, 'stand', { anim: 'rush', held: null });
      const wp = p.getWorldPosition(V(0, 0, 0));
      r.position.copy(wp); scene.add(r);
      rigOf(p).hidden = true;
      after(i * 0.6, () => walk(r, [V(wp.x + out * 0.4, 0, wp.z), V(d.x + out * (0.6 + i * 0.55), 0, d.z + 0.3 * (i % 2))], { speed: 2.2, faceEnd: d }));
      return { seated: p, r };
    });
    // l'un après l'autre, ils disparaissent dans l'estaminet
    runners.forEach(({ r }, i) => after(5 + i * 4, () => walk(r, [d], { speed: 2, onDone: () => scene.remove(r) })));
    after(5 + runners.length * 4 + returnAfter, () => {
      sign.remove();
      for (const { seated: s, r } of runners) { rigOf(s).hidden = false; rigOf(s).expr = 'sad'; if (r.parent) scene.remove(r); }
    });
    audio?.play('rumble', { pos: table.group.position });
    return runners.map((x) => x.r);
  }

  // Chaise dévissée qui s'effondre sous son client
  function collapse(table, seat = 0, { recover = 0 } = {}) {
    const ch = table.chairs?.[seat], p = table.people[seat];
    if (!ch || !p) return;
    rigOf(ch).flags.collapsed = true;
    remember(p);
    setState(p, { anim: 'fallen', held: null });
    audio?.play('crash', { pos: table.group.position });
    react(table.group.position, 2.5, 'surprised', 4);
    if (recover) after(recover, () => { rigOf(ch).flags.collapsed = false; stop(p, { place: false }); });
  }

  // Parasols volés (ou rendus) : par resto ou liste de tables
  function parasols(tablesOrRest, present) {
    const list = typeof tablesOrRest === 'string' ? world.tables.filter((t) => (t.rest?.id ?? t.restId) === tablesOrRest || t.id.startsWith(tablesOrRest)) : tablesOrRest;
    for (const t of list) if (t.top) rigOf(t.top).flags.parasol = present;
  }

  // La foule filme : une part des clients lève le téléphone (écran allumé)
  function film(on = true, { tables = world.tables, share = 0.5 } = {}) {
    for (const t of tables) for (const p of t.people) {
      const r = rigOf(p);
      if (on && Math.random() < share) { r.st.preFilm ??= { anim: r.anim, held: r.held }; setState(p, { anim: 'film', held: 'film' }); }
      else if (!on && r.st.preFilm) { setState(p, r.st.preFilm); r.st.preFilm = null; }
    }
  }

  // Réaction des gens autour d'un point (éclaboussure, odeur, fracas)
  function react(pos, radius = 3, e = 'surprised', seconds = 3, anim = null) {
    const c = toV(pos), w = V(0, 0, 0);
    const people = [...world.tables.flatMap((t) => t.people), ...Object.values(cast)].filter((p, i, a) => a.indexOf(p) === i && p.userData.kind === 'human');
    for (const p of people) {
      p.getWorldPosition(w);
      if (Math.hypot(w.x - c.x, w.z - c.z) > radius) continue;
      const r = rigOf(p);
      const prev = { expr: r.expr, anim: r.anim };
      r.expr = e;
      if (anim) r.anim = anim;
      after(seconds * (0.7 + Math.random() * 0.6), () => { r.expr = prev.expr; if (anim && r.anim === anim) r.anim = prev.anim; });
    }
  }

  return { get, spawn, play, stop, expr, walk, tween, after, round, patrol, envelope, rush, collapse, parasols, film, react };
}
