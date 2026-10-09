// Les twists en vrai (§12e.2, §12e.6) : chaque soirée spéciale se VOIT et s'ENTEND dans la rue, et chacun de ses moments
// (sim.events[n] du twist, à son heure `at`) se joue à l'écran à cette heure-là. Piloté par les données du twist :
// l'id choisit la mise en scène, les heures viennent de tw.sim.events, les accessoires génériques de tw.props
// (chaîne ou { id, from?, until? }) quand le twist n'a pas sa propre mise en scène.
//
//   const live = createTwistLive({ world, art, audio, stage });
//   live.update(sim.twist, min)    // à chaque image de la nuit (le metteur en scène)
//   live.fired                     // moments déjà joués (QA)
// Les répliques d'un moment repère `twist:<id>:<n>` (stageCues.js) sont jouées ici, à l'heure, sans autre donnée.
import * as THREE from 'three';
import { humanoid, customer, setState, CAST } from '../art/characters.js';
import { panelTex } from '../art/textures.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const mats = new Map();
const M = (color, o = {}) => { const k = `${color}|${JSON.stringify(o)}`; if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...o })); return mats.get(k); };
const glow = (color, i = 2) => M(0x222222, { emissive: color, emissiveIntensity: i });
const box = (g, w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); g.add(o); return o; };
const cyl = (g, r, h, m, x, y, z, s = 10) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, s), m); o.position.set(x, y, z); g.add(o); return o; };
const ball = (g, r, m, x, y, z) => { const o = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), m); o.position.set(x, y, z); g.add(o); return o; };
const sign = (g, lines, w, h, x, y, z, bg = '#f7f2e6', fg = '#2a2a35') => { const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: panelTex(lines, bg, fg), emissive: 0xffffff, emissiveIntensity: 0.05, side: THREE.DoubleSide })); o.position.set(x, y, z); g.add(o); return o; };
const scarf = (add, k, a = 0xc0262d, b = 0xf2f2ee) => { add('box', 'body', [0, k.th * 0.92, 0.05], [0.42 * k.g, 0.08, 0.36 * k.g], a); add('box', 'body', [0.08, k.th * 0.7, 0.2 * k.g], [0.07, 0.3, 0.03], b); };

export function createTwistLive({ world, art, audio, stage }) {
  const A = world.anchors;
  const { W, bz, zA, zB } = stage.anchors;
  const door = A.bernadetteDoor;
  const side = Math.sign(door.x) || -1; // l'estaminet est côté x < 0
  const rest = (id) => world.tables.filter((t) => (t.rest?.id ?? t.restId) === id);
  const restC = (id) => { const ts = rest(id); return ts.length ? ts.reduce((a, t) => a.add(t.group.position), V()).multiplyScalar(1 / ts.length) : door.clone(); };
  const sound = (name, pos, o = {}) => { try { audio?.play?.(name, { pos, ...o }); } catch { /* son indisponible */ } };
  const say = (pos, mood = 'calm', o = {}) => sound('voice', pos, { mood, ...o });
  const people = (ts) => ts.flatMap((t) => t.people.filter((p) => p.visible));
  let cur = null; // { id, tw, r, fired:Set, shown:Set, c }

  function start(tw) {
    const def = DEFS[tw.id];
    const c = { tw, min: 0, shown: new Set(), at: (i) => tw.sim?.events?.[i]?.at ?? Infinity };
    c.during = (a, b) => c.min >= a && c.min < b;
    c.show = (id) => { const h = art?.twists?.show?.(id); if (h) c.shown.add(id); return h; };
    c.hide = (id) => { art?.twists?.hide?.(id); c.shown.delete(id); };
    const r = stage.run(`twist:${tw.id}`, Infinity, (r) => {
      c.r = r;
      r.end(() => { for (const id of c.shown) art?.twists?.hide?.(id); });
      if (def?.setup) def.setup(r, c);
      else genericProps(r, c); // pas de mise en scène dédiée : les accessoires listés, à leurs heures
    });
    return { id: tw.id, tw, r, c, def, fired: new Set() };
  }
  // tw.props : 'id' ou { id, from?, until? } → art.twists.show/hide selon l'heure
  function genericProps(r, c) {
    const list = (c.tw.props ?? []).map((p) => (typeof p === 'string' ? { id: p } : p)).filter((p) => p?.id);
    r.tick(() => { for (const p of list) { const on = c.during(p.from ?? 0, p.until ?? Infinity); if (on && !p.on) { p.on = !!c.show(p.id); } else if (!on && p.on) { c.hide(p.id); p.on = false; } } });
  }

  // ---------- les mises en scène, twist par twist ----------
  // setup(r, c) : ce qui est là toute la soirée (ou à partir d'une heure) ; moments[n](c) : à l'heure du n-ième événement
  const DEFS = {
    martine_dinner: {
      setup(r, c) { // la nappe blanche sur la table qui mord sur le couloir ; Martine et sa berline à partir de 20h50
        const t = rest('bernadette').sort((a, b) => Math.abs(b.group.position.x) - Math.abs(a.group.position.x))[0];
        if (t) { const cl = new THREE.Group(); box(cl, 1.25, 0.02, 1.25, M(0xfbf8f0), 0, 0.79, 0); box(cl, 1.27, 0.25, 0.01, M(0xfbf8f0), 0, 0.67, 0.63); cl.position.copy(t.group.position); r.add(cl); }
        const car = new THREE.Group(); box(car, 1.75, 0.65, 4.2, M(0x0d0d10, { metalness: 0.6, roughness: 0.3 }), 0, 0.62, 0); box(car, 1.5, 0.5, 2.2, M(0x0d0d10, { metalness: 0.6, roughness: 0.3 }), 0, 1.18, -0.3);
        for (const [x, z] of [[0.82, 1.4], [-0.82, 1.4], [0.82, -1.4], [-0.82, -1.4]]) cyl(car, 0.33, 0.22, M(0x111111), x, 0.33, z, 12).rotation.z = Math.PI / 2;
        car.position.set(1.2, 0, zA + 2.5); r.add(car);
        const seated = CAST.martine ? CAST.martine({ pose: 'sit', expr: 'happy', held: 'wine' }) : customer('sit');
        const sp = t ? t.group.position.clone().add(V(0.75 * -side, 0, 0.75)) : door.clone().add(V(2, 0, 2));
        seated.position.copy(sp); seated.rotation.y = side < 0 ? -Math.PI / 2 : Math.PI / 2; r.add(seated);
        r.tick(() => { car.visible = c.min >= c.at(0) - 1; seated.visible = c.min >= c.at(0) + 6; });
        c.seated = seated;
      },
      moments: {
        0(c) { // la berline se gare, Martine descend et remonte la rue jusqu'à la terrasse
          stage.run('twist:martine_arrive', 30, (r) => {
            const p = r.add(CAST.martine ? CAST.martine({ expr: 'happy' }) : humanoid({ hair: 'bob' }));
            p.position.set(0.4, 0, zA + 4);
            r.walk(p, [V(0.4, 0, c.seated.position.z - 1.5), c.seated.position.clone().add(V(-side * 0.6, 0, -0.6))], { speed: 1.3 });
            r.later(1, () => sound('window', p.position, { gain: 0.6 })); // portière
            r.tick(() => { if (c.seated.visible) p.visible = false; });
          });
        },
        1(c) { // « À la convivialité ! » toute la terrasse trinque
          stage.run('twist:martine_toast', 9, (r) => {
            for (const q of [...people(rest('bernadette')), c.seated]) { r.borrow(q); setState(q, { anim: 'cheer', held: 'wine', expr: 'happy' }); }
            say(c.seated.position.clone().setY(1.2), 'shout', { n: 8, f0: 190, gain: 1 });
            for (let i = 0; i < 8; i++) r.later(1.4 + i * 0.12, () => sound('click', c.seated.position, { gain: 0.6 }));
            r.later(2, () => sound('cheer', c.seated.position, { gain: 0.6, n: 10 }));
          });
        },
      },
    },
    saturday_van: {
      setup(r, c) {
        r.tick(() => { const on = c.min < c.at(1) + 2; if (on && !c.van) { c.van = c.show('delivery_van'); if (c.van) c.vanE = r.em('hazard', c.van.objects[0].position.clone().setY(1), { gain: 0.6, ref: 5 }); } });
        c.engine = null;
      },
      moments: {
        0(c) { // le chauffeur décharge ses fûts puis part « boire un café »
          stage.run('twist:van_driver', 40, (r) => {
            const vp = c.van?.objects[0].position ?? V(0.1, 0, bz + 9);
            const d = r.add(humanoid({ shirt: 0xc0262d, pants: 0x2f3542, hair: 'short', anim: 'tray' })); d.position.copy(vp).add(V(0.9, 0, -2.6));
            for (let i = 0; i < 4; i++) r.later(1 + i * 2.5, () => sound('rattle', d.position, { repeat: 1, gain: 0.5 }));
            r.later(12, () => { setState(d, { anim: 'idle' }); r.walk(d, [V(0.6, 0, zB + 4)], { speed: 1.4 }); });
          });
        },
        1(c) { // la camionnette repart en marche arrière, klaxon, au milieu de la foule
          const g = c.van?.objects[0]; if (!g) return;
          stage.run('twist:van_leaves', 16, (r) => {
            const e = r.em('engine', g.position.clone().setY(0.6), { gain: 0.6, ref: 6, f: 34 });
            for (let i = 0; i < 8; i++) r.later(i * 0.7, () => sound('notify', g.position, { gain: 0.5 })); // bip de recul
            r.later(3, () => sound('horn', g.position, { beeps: 2, gain: 1 }));
            r.later(5, () => sound('glassbreak', g.position.clone().add(V(-1.5, 0.6, 0)), { gain: 0.6 }));
            r.tick((dt) => { if (r.t > 1) g.position.z -= dt * 2.2; e?.pos.copy(g.position).setY(0.6); });
            r.end(() => c.hide('delivery_van'));
          });
        },
      },
    },
    inspector_surprise_night: {
      setup(r) { // Delphine en imperméable au Goulot, un thé, un carnet
        const t = rest('goulot')[0], p = t ? t.group.position.clone() : V(2, 0, bz - 10);
        const d = CAST.delphine ? CAST.delphine({ pose: 'sit', shirt: 0xb89a6a, anim: 'write', held: 'notebook', expr: 'suspicious' }) : customer('sit');
        d.position.copy(p).add(V(Math.sign(p.x || 1) * -0.8, 0, -0.9)); d.rotation.y = Math.atan2(door.x - d.position.x, door.z - d.position.z); r.add(d);
        const tea = new THREE.Group(); cyl(tea, 0.045, 0.07, M(0xf2f2ee), 0, 0.82, 0, 10); tea.position.copy(d.position).add(V(0.2, 0, 0.35)); r.add(tea);
        this.d = d;
      },
      moments: { 0() { const d = DEFS.inspector_surprise_night.d; if (!d) return; setState(d, { anim: 'write' }); sound('paper', d.position, { gain: 0.6 }); } },
    },
    inspector_announced_night: {
      setup(r) { // géraniums neufs alignés devant la terrasse
        const ts = rest('bernadette');
        for (const t of ts) {
          const g = new THREE.Group(); g.position.copy(t.group.position).add(V(-side * 0.95, 0, 0)); r.add(g);
          box(g, 0.35, 0.3, 0.6, M(0x8a5a35), 0, 0.15, 0);
          for (let i = 0; i < 5; i++) ball(g, 0.07, M(i % 2 ? 0xd63a3a : 0xe85d75), rnd(-0.1, 0.1), 0.38 + rnd(0, 0.06), -0.24 + i * 0.12);
          for (let i = 0; i < 4; i++) ball(g, 0.08, M(0x3f7a3a), rnd(-0.1, 0.1), 0.33, -0.2 + i * 0.13);
        }
      },
      moments: { 0() { say(door.clone().add(V(-side * 2, 1.2, 1)), 'calm', { n: 6, f0: 120 }); sound('crash', door.clone().add(V(-side * 2, 0.5, 3)), { gain: 0.4 }); } },
    },
    inspector_quiet_night: {
      setup(r, c) { // la clim de l'estaminet sur la façade ; arrosage des géraniums en début de soirée
        const g = new THREE.Group(); g.position.set(side * (W - 0.25), 3.1, door.z - 1.5); r.add(g);
        box(g, 0.45, 0.6, 0.9, M(0xd8d4cc), 0, 0, 0); const fan = new THREE.Group(); fan.position.set(-side * 0.24, 0, 0); g.add(fan);
        for (let i = 0; i < 3; i++) { const b = box(fan, 0.01, 0.38, 0.08, M(0x6b7078), 0, 0, 0); b.rotation.x = (i * Math.PI * 2) / 3; }
        c.fan = fan; c.speed = 0;
        r.tick((dt) => { fan.rotation.x += dt * c.speed; });
        const d = world.cast?.dede;
        if (d) stage.run('twist:dede_waters', 25, (r2) => { r2.borrow(d); setState(d, { anim: 'clean', expr: 'happy' }); for (let i = 0; i < 4; i++) r2.later(2 + i * 5, () => sound('whistle', d.position, { gain: 0.7 })); });
      },
      moments: { 0(c) { c.speed = 30; c.r.em('ac', V(side * (W - 0.4), 3.1, door.z - 1.5), { gain: 0.5, ref: 5 }); const d = world.cast?.dede; if (d) stage.run('twist:ac_on', 5, (r) => { r.borrow(d); setState(d, { anim: 'give' }); }); } },
    },
    exhaust_eve: {
      setup(r) { const g = new THREE.Group(); r.add(g); sign(g, [['MAINTENANCE', 40], ['PRÉVENTIVE', 40], ['— la direction', 22]], 0.5, 0.42, side * (W - 0.12), 1.5, door.z + 0.9).rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2; },
      moments: { 0() { // « Ce soir, c'est salade » : un client proteste, le serveur hausse les épaules
        stage.run('twist:salade', 8, (r) => {
          const t = rest('bernadette')[1] ?? rest('bernadette')[0]; const q = t?.people.find((p) => p.visible);
          if (q) { r.borrow(q); setState(q, { anim: 'meeting', expr: 'surprised' }); say(t.group.position.clone().setY(1.2), 'ask', { n: 5, f0: 130 }); }
          const w = world.waiter; if (w && t) { r.borrow(w); w.position.copy(t.group.position).add(V(-side * 0.9, 0, 0.6)); setState(w, { anim: 'give' }); r.later(1.8, () => say(w.position.clone().setY(1.5), 'calm', { n: 4, f0: 125 })); }
        });
      } },
    },
    exhaust_won_night: {
      setup(r, c) {
        const g = new THREE.Group(); g.position.copy(door).add(V(-side * 1.2, 0, 1.6)); r.add(g); g.visible = false; c.stand = g;
        box(g, 0.9, 0.9, 0.6, M(0xc8a46a), 0, 0.45, 0); box(g, 1.0, 0.05, 0.7, M(0xc0262d), 0, 1.25, 0);
        for (const x of [-0.45, 0.45]) box(g, 0.03, 0.4, 0.03, M(0xc8a46a), x, 1.05, 0.3);
        sign(g, [['FRITES', 60], ['adieu ma belle', 24]], 0.8, 0.32, 0, 0.6, 0.31, '#f7e7b0', '#a32020');
      },
      moments: { 0(c) {
        c.stand.visible = true;
        const d = world.cast?.dede;
        stage.run('twist:fries', 12, (r) => { if (d) { r.borrow(d); d.position.copy(c.stand.position).add(V(-side * 0.7, 0, -0.4)); setState(d, { anim: 'greet', expr: 'happy' }); say(d.position.clone().setY(1.1), 'shout', { n: 5, f0: 110 }); } r.later(2, () => sound('applause', c.stand.position, { gain: 0.8 })); });
        art?.fx?.smoke?.((world.exhaust ?? door).clone().add(V(0.3, 0.2, 0)), { rate: 30, life: 3, color: 0xb0a080, rise: 0.8, duration: 4, size: [0.4, 1.4], alpha: 0.5 });
      } },
    },
    exhaust_lost_night: {
      moments: { 0() { // Ghislain fume sous la fenêtre, lève les yeux vers la gaine, vers vous, hoche la tête
        const g = world.cast?.ghislain; if (!g) return;
        stage.run('twist:ghislain_nods', 40, (r) => {
          r.borrow(g); g.visible = true; setState(g, { anim: 'smoke', held: 'cig', expr: 'happy' });
          g.position.set(side * (W - 0.9), 0, bz + 0.6); g.rotation.y = side < 0 ? -Math.PI / 2 : Math.PI / 2;
          r.later(8, () => { g.rotation.y += Math.PI; }); // il se tourne vers la façade de Pilou
          art?.fx?.smoke?.(g.position.clone().setY(1.6), { rate: 3, life: 3, duration: 30, size: [0.2, 0.6], alpha: 0.3 });
        });
      } },
    },
    football_match: {
      setup(r, c) { // l'écran géant sous le store de l'estaminet, tourné vers la rue ; des supporters debout avec écharpes
        const h = c.show('tv_screen');
        if (h) { const g = h.objects[0]; g.position.set(side * (W - 0.35), 1.95, door.z + 3.2); g.rotation.set(0, side < 0 ? Math.PI / 2 : -Math.PI / 2, 0); g.scale.setScalar(1.35); }
        c.tv = h;
        if (h) r.em('talker', h.objects[0].position.clone(), { gain: 0.45, ref: 6, f0: 135, rate: 1.4 }); // le commentateur
        const sup = Array.from({ length: 18 }, (_, i) => {
          const p = r.add(humanoid({ hair: pick(['short', 'bald', 'quiff', 'long']), shirt: pick([0xc0262d, 0xc0262d, 0xf2f2ee, 0x1f2a44]), held: i % 3 ? 'beer' : null, expr: 'happy', talk: 0.8, extras: (add, k) => scarf(add, k) }));
          p.position.set(-side * rnd(0.6, 2.6), 0, door.z + 3.2 + rnd(-3, 3)); p.rotation.y = side < 0 ? -Math.PI / 2 : Math.PI / 2; return p;
        });
        c.sup = sup;
        r.later(2, () => sound('chant', sup[0].position, { voices: 8, gain: 0.7 }));
        let chant = 25; r.tick((dt) => { if ((chant -= dt) <= 0) { chant = 25 + Math.random() * 25; sound('chant', pick(sup).position, { voices: 7, gain: 0.6 }); } });
      },
      moments: {
        0(c) { c.tv?.trigger?.('goal'); goal(c); },
        1(c) { c.tv?.trigger?.('miss'); stage.run('twist:penalty', 8, (r) => { for (const p of c.sup) { r.borrow(p); setState(p, { anim: 'idle', expr: 'sad' }); } sound('sigh', c.sup[0].position, { gain: 1 }); }); },
        2(c) { c.tv?.trigger?.('final'); goal(c, true); stage.run('twist:victory', 80, (r) => { for (const p of c.sup) { r.borrow(p); setState(p, { anim: 'sing', expr: 'happy' }); } for (let k = 0; k < 8; k++) r.later(3 + k * 9, () => sound('chant', c.sup[0].position, { voices: 9, gain: 0.9 })); }); },
      },
    },
    birthday_t4: {
      setup(r, c) { // ballons à la table 4 toute la soirée ; le gâteau reste caché jusqu'à 23h40
        const t = rest('bernadette')[3] ?? rest('bernadette').at(-1); c.t = t; if (!t) return;
        const g = new THREE.Group(); g.position.copy(t.group.position); r.add(g);
        const cols = [0xe0475f, 0xf5d04a, 0x6c9bd2, 0x7fb685, 0xf28cb1];
        c.balloons = cols.map((col, i) => { const b = new THREE.Group(); ball(b, 0.16, M(col, { roughness: 0.25 }), 0, 1.75 + i * 0.06, 0); cyl(b, 0.004, 1.0, M(0xeeeeee), 0, 1.2, 0, 3); b.position.set(-side * 0.7 + (i - 2) * 0.13, 0, 0.55 + (i % 2) * 0.1); g.add(b); return b; });
        r.tick(() => c.balloons.forEach((b, i) => { b.rotation.z = Math.sin(c.r.t * 0.9 + i) * 0.08; }));
      },
      moments: { 0(c) { // lumières éteintes, le gâteau aux bougies arrive, onze voix puis toute la rue
        const t = c.t; if (!t) return;
        stage.run('twist:birthday', 40, (r) => {
          const lights = (world.streetLights ?? []).filter((l) => Math.abs(l.position.z - t.group.position.z) < 12).map((l) => [l, l.intensity]);
          for (const [l] of lights) l.intensity *= 0.2; r.end(() => { for (const [l, i] of lights) l.intensity = i; });
          const carrier = r.add(humanoid({ shirt: 0x1f1f24, hair: 'quiff', anim: 'tray', expr: 'happy' })); carrier.position.copy(door).add(V(-side * 0.6, 0, 0));
          const cake = new THREE.Group(); cyl(cake, 0.18, 0.13, M(0xf3e2c8), 0, 0, 0, 16); cyl(cake, 0.185, 0.03, M(0xf28cb1), 0, 0.07, 0, 16);
          const flames = Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * Math.PI * 2; cyl(cake, 0.006, 0.06, M(0xf6f2ea), Math.cos(a) * 0.12, 0.11, Math.sin(a) * 0.12, 4); return ball(cake, 0.014, glow(0xffb347, 3), Math.cos(a) * 0.12, 0.155, Math.sin(a) * 0.12); });
          const candle = new THREE.PointLight(0xffb060, 1.6, 3); cake.add(candle); candle.position.y = 0.3; r.add(cake);
          r.tick(() => { cake.position.copy(carrier.position).add(V(0, 1.12, 0)); flames.forEach((f, i) => f.scale.setScalar(0.8 + Math.sin(r.t * 17 + i * 3) * 0.25)); });
          r.walk(carrier, [t.group.position.clone().add(V(-side * 0.8, 0, 0))], { speed: 0.8, onArrive: () => {
            for (const q of people([t])) { r.borrow(q); setState(q, { anim: 'sing', expr: 'happy' }); }
            sound('birthday', t.group.position, { gain: 1 });
            r.later(r.t + 6, () => { sound('birthday', t.group.position, { gain: 1 }); for (const q of people(rest('bernadette'))) { r.borrow(q); setState(q, { anim: 'sing' }); } });
            r.later(r.t + 13, () => { flames.forEach((f) => { f.visible = false; }); candle.intensity = 0; sound('cheer', t.group.position, { gain: 0.9 }); });
          } });
        });
      } },
    },
    influencer_night: {
      setup(r, c) { c.h = c.show('ring_light'); },
      moments: { 0(c) { // « Coucou les loulous ! » prise une, deux, trois ; la terrasse prend la pose
        const at = c.h?.objects[0]?.position ?? door.clone().add(V(-side * 3, 0, 2.5));
        stage.run('twist:influencer', 14, (r) => {
          for (let k = 0; k < 3; k++) { r.later(k * 4, () => say(at.clone().setY(1.5), 'ask', { n: 8, f0: 230 })); r.later(k * 4 + 2.5, () => sound('shutter', at, { gain: 0.7 })); }
          r.later(8, () => { for (const q of people(rest('bernadette'))) if (Math.random() < 0.7) { r.borrow(q); setState(q, { anim: 'wave', expr: 'happy' }); } });
        });
      } },
    },
    hen_party: {
      setup(r, c) { // l'EVJF à la table des Mal Lunés : écharpes roses, voile, mégaphone
        const h = c.show('evjf'); c.h = h; if (!h) return;
        const m = restC('malunes'), dz = m.z + 2.5 - (h.objects[0]?.position.z ?? m.z), dx = (m.x || 2) * 0.55 - (h.objects[0]?.position.x ?? 0);
        for (const o of h.objects) { o.position.x += dx; o.position.z += dz; }
        let shout = 20; r.tick((dt) => { if ((shout -= dt) <= 0) { shout = 25 + Math.random() * 25; sound('megaphone', h.objects[1].position, { gain: 0.6 }); } });
      },
      moments: {
        0(c) { const g = c.h?.objects; if (!g) return; stage.run('twist:evjf_siren', 10, (r) => { for (const p of g) { r.borrow(p); setState(p, { anim: 'cheer' }); } sound('siren', g[1].position, { gain: 1 }); r.later(3, () => sound('megaphone', g[1].position, { gain: 1 })); r.later(4, () => sound('cheer', g[0].position, { gain: 0.5, n: 8 })); }); },
        1(c) { // gage : Marion fait signer un serment à… Biloute
          const g = c.h?.objects; const dog = world.cast?.dog; if (!g) return;
          stage.run('twist:evjf_oath', 25, (r) => {
            const bride = g[0]; r.borrow(bride);
            if (dog) { r.borrow(dog); dog.visible = true; dog.position.set(0.3, 0, bride.position.z - 3); }
            r.walk(bride, [V(0.6, 0, bride.position.z - 2.4)], { speed: 1, onArrive: () => { setState(bride, { anim: 'give', held: 'clipboard' }); sound('cheer', bride.position, { gain: 0.5, n: 8 }); r.later(r.t + 2, () => sound('bark', dog?.position ?? bride.position, { gain: 0.8 })); } });
          });
        },
      },
    },
    drache_night: {
      setup(r) { // la bâche au-dessus de la terrasse de l'estaminet
        const ts = rest('bernadette'); if (!ts.length) return;
        const z0 = Math.min(...ts.map((t) => t.group.position.z)) - 1, z1 = Math.max(...ts.map((t) => t.group.position.z)) + 1;
        const tarp = new THREE.Mesh(new THREE.PlaneGeometry(2.6, z1 - z0), M(0x2b5d8a, { transparent: true, opacity: 0.75, side: THREE.DoubleSide, roughness: 0.4 }));
        tarp.rotation.set(-Math.PI / 2, 0, 0); tarp.rotation.order = 'YXZ'; tarp.rotation.z = 0; tarp.position.set(side * (W - 1.4), 2.55, (z0 + z1) / 2);
        const piv = new THREE.Group(); piv.add(tarp); piv.rotation.z = side * 0.12; r.add(piv);
        for (const z of [z0 + 0.2, z1 - 0.2]) { const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.4, 6), M(0x8a8f96)); pole.position.set(side * (W - 2.6), 1.2, z); r.add(pole); }
      },
      moments: { 0() { stage.play('rain_umbrellas'); stage.run('twist:drache_rush', 12, (r) => { sound('voice', door.clone().add(V(-side * 2, 1.2, 2)), { mood: 'shout', n: 4, f0: 140 }); for (let i = 0; i < 6; i++) r.later(i * 0.4, () => sound('crash', door.clone().add(V(-side * rnd(1, 3), 0.5, rnd(-4, 4))), { gain: 0.3 })); }); } },
    },
    heatwave: {
      setup(r, c) { // ventilateurs, fenêtres ouvertes éclairées, seaux à glace sur les tables
        c.show('heatwave');
        r.em('fans', door.clone().add(V(-side * 1.5, 1.2, 1)), { gain: 0.35, ref: 4 });
        for (const s of (world.windowSpots ?? []).filter((s) => Math.abs(s.z - bz) < 25 && Math.random() < 0.35).slice(0, 12)) {
          const m = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 1.2), new THREE.MeshBasicMaterial({ color: 0xffd28a })); m.position.set(Math.sign(s.x) * (W - 0.03), s.y, s.z); m.rotation.y = s.x > 0 ? -Math.PI / 2 : Math.PI / 2; r.add(m);
        }
        for (const t of world.tables.filter((t) => t.group.visible).slice(0, 10)) { const b = new THREE.Group(); cyl(b, 0.11, 0.2, M(0xb8bcc2, { metalness: 0.8, roughness: 0.3 }), 0, 0.88, 0, 12); cyl(b, 0.025, 0.25, M(0x2f6b3a), 0.03, 1.0, 0.02, 6); b.position.copy(t.group.position).add(V(0.15, 0, -0.1)); r.add(b); }
      },
      moments: { 0() { // 00h30 : un client dort sur sa chaise, un autre chante
        stage.run('twist:heat_late', 30, (r) => {
          const ps = people(world.tables.filter((t) => t.group.visible)); if (ps.length < 2) return;
          const a = ps[0], b = ps[Math.min(ps.length - 1, 5)];
          r.borrow(a); setState(a, { anim: 'idle', expr: 'sad', talk: 0 }); for (let i = 0; i < 3; i++) r.later(i * 7, () => sound('snore', a.getWorldPosition(V()), { gain: 0.8 }));
          r.borrow(b); setState(b, { anim: 'sing', expr: 'happy' }); r.later(3, () => sound('sing', b.getWorldPosition(V()), { f0: 150, gain: 0.8 }));
        });
      } },
    },
    guide_tour: {
      setup(r, c) { // le groupe arrive vers 22h, s'arrête à 22h15 sous la fenêtre (le canal), repart vers 22h30
        const stopZ = bz + 2, t0 = c.at(0);
        const guide = r.add(humanoid({ hair: 'bob', hairColor: 0x8a5a2b, shirt: 0x2b9d8f, pants: 0x3d4a63, anim: 'guide', held: null, talk: 1, expr: 'happy' }));
        const flag = new THREE.Group(); cyl(flag, 0.012, 2.3, M(0x5b3a1e), 0, 1.15, 0, 5); const f = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.42), M(0xf2c14e, { side: THREE.DoubleSide, emissive: 0xf2c14e, emissiveIntensity: 0.45 })); f.position.set(0.3, 2.15, 0); flag.add(f); r.add(flag);
        const tourists = Array.from({ length: 14 }, (_, i) => r.add(Object.assign(customer('stand'), {})));
        tourists.forEach((q, i) => setState(q, { held: i % 3 === 0 ? 'film' : null, anim: i % 3 === 0 ? 'film' : 'idle', talk: 0.4 }));
        const talk = r.em('talker', guide.position.clone().setY(1.6), { gain: 0.7, ref: 6, f0: 200 });
        const zOf = (m) => (m < t0 ? zA - 4 + (stopZ - zA + 4) * Math.max(0, (m - (t0 - 15)) / 15) : m < t0 + 15 ? stopZ : stopZ + (zB + 6 - stopZ) * Math.min(1, (m - t0 - 15) / 15));
        r.tick(() => {
          const on = c.during(t0 - 15, t0 + 30); guide.visible = flag.visible = on; tourists.forEach((q) => { q.visible = on; });
          if (talk) talk.gain = on ? 0.7 : 0;
          if (!on) return;
          const z = zOf(c.min), x = 0.3;
          guide.position.set(x, 0, z); guide.rotation.y = c.min < t0 || c.min >= t0 + 15 ? 0 : Math.PI;
          flag.position.copy(guide.position).add(V(0.25, 0, 0));
          talk?.pos.copy(guide.position).setY(1.6);
          tourists.forEach((q, i) => {
            const back = 1.3 + Math.floor(i / 3) * 0.7, lat = ((i % 3) - 1) * 0.6;
            q.position.set(x + lat, 0, z - back);
            q.rotation.y = c.min >= t0 && c.min < t0 + 15 ? (c.min < t0 + 6 ? 0 : Math.atan2(-W - q.position.x, bz - q.position.z)) : 0; // vers le guide, puis vers votre fenêtre
          });
        });
      },
      moments: { 0() { audio?.duck?.(6, 0.4); } },
    },
    regis_party: {
      setup(r, c) { // le 27 (côté impair) : fenêtres éclairées de couleurs, basse étouffée, étudiants qui fument sur le pas de la porte
        const z27 = bz + 20, wins = (world.windowSpots ?? []).filter((s) => s.x > 0 && Math.abs(s.z - z27) < 2.6);
        const g = new THREE.Group(); r.add(g);
        const plaque = sign(g, [['27', 64]], 0.24, 0.2, W - 0.03, 2.4, z27 + 1.3, '#1f2a44', '#f2f2ee'); plaque.rotation.y = -Math.PI / 2;
        const panes = wins.map((s) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 1.2), new THREE.MeshBasicMaterial({ color: 0xff4fa0 })); m.position.set(W - 0.03, s.y, s.z); m.rotation.y = -Math.PI / 2; g.add(m); return m; });
        const cols = [0xff4fa0, 0x4fd2ff, 0xb44fff, 0xffd24f];
        r.tick(() => { const beat = Math.floor(c.r.t * (118 / 60)); panes.forEach((m, i) => m.material.color.setHex(cols[(beat + i) % 4])); });
        c.music = r.em('speakers', V(W - 0.5, 5, z27), { gain: 0.5, ref: 9, lp: 300 });
        const smokers = [0, 1, 2].map((i) => { const p = r.add(humanoid({ hair: pick(['long', 'quiff', 'bun']), shirt: pick([0x1f1f24, 0xe3826f, 0x5fb3b3]), held: i === 1 ? 'beer' : 'cig', anim: i === 1 ? 'idle' : 'smoke', expr: 'happy' })); p.position.set(W - 0.7 - i * 0.35, 0, z27 + 0.4 + i * 0.5); p.rotation.y = -Math.PI / 2 + rnd(-0.5, 0.5); return p; });
        art?.fx?.smoke?.(smokers[0].position.clone().setY(1.6), { rate: 2, life: 3, size: [0.2, 0.6], alpha: 0.25 });
        for (let i = 0; i < 5; i++) { const b = new THREE.Group(); cyl(b, 0.035, 0.24, M(0x2f6b3a, { roughness: 0.2 }), 0, 0.12, 0, 6); b.position.set(W - 0.3 - Math.random() * 0.5, 0, z27 + rnd(-0.6, 1.2)); r.add(b); }
        c.z27 = z27;
      },
      moments: {
        0(c) { if (c.music) c.music.gain = 0.9; for (let i = 0; i < 3; i++) setTimeout(() => sound('window', V(W, 6, c.z27), { gain: 0.6 }), i * 600); },
        1(c) { // dix-neuf étudiants descendent « prendre l'air », avec les enceintes
          stage.run('twist:students_down', 240, (r) => {
            const box2 = new THREE.Group(); box(box2, 0.35, 0.6, 0.35, M(0x111111), 0, 0.3, 0); box(box2, 0.2, 0.2, 0.02, glow(0x4fd2ff, 2), 0, 0.42, 0.18); box2.position.set(W - 1.5, 0, c.z27 - 1); r.add(box2);
            const em = r.em('speakers', box2.position.clone().setY(0.6), { gain: 0.8, ref: 6, lp: 700 });
            for (let i = 0; i < 16; i++) { const p = r.add(humanoid({ hair: pick(['long', 'quiff', 'bun', 'short']), shirt: pick([0x1f1f24, 0xe3826f, 0x5fb3b3, 0xf0c36a]), held: pick(['beer', 'cig', null]), anim: pick(['cheer', 'idle', 'sing']), expr: 'happy' })); p.position.set(W - 0.8, 0, c.z27); r.walk(p, [V(rnd(-0.5, W - 1.2), 0, c.z27 + rnd(-3, 3))], { speed: rnd(0.8, 1.4) }); }
            r.later(3, () => sound('cheer', box2.position, { gain: 0.6, n: 12 }));
            void em;
          });
        },
      },
    },
    carbonnade_contest: {
      setup(r, c) { c.show('jury_table'); c.show('trophy'); },
      moments: {
        0() { audio?.duck?.(10, 0.2); art?.twists?.trigger?.('jury_table', 'moment0'); },
        1() { art?.twists?.trigger?.('jury_table', 'moment1'); art?.twists?.trigger?.('trophy', 'moment1'); sound('cheer', world.cast?.dede?.position ?? door, { gain: 0.9 }); sound('applause', door, { gain: 0.8, delay: 1 }); },
      },
    },
    busker: {
      setup(r, c) { // l'accordéoniste arrive à 21h sous la fenêtre ; musette tant qu'il joue
        r.tick(() => { if (!c.h && c.min >= c.at(0) - 1) { c.h = c.show('busker'); const p = c.h?.objects[0]; if (p) c.music = r.em('musette', p.position.clone().setY(1.3), { gain: 1, ref: 5 }); } });
      },
      moments: {
        0() { stage.run('twist:quinquin', 14, (r) => { for (const q of people(rest('bernadette'))) if (Math.random() < 0.7) { r.borrow(q); setState(q, { anim: 'sing', expr: 'happy' }); } r.later(2, () => sound('chant', door, { voices: 6, gain: 0.6 })); }); },
        1(c) { // Dédé lui apporte une bière pour qu'il change de chanson
          const d = world.cast?.dede, p = c.h?.objects[0]; if (!d || !p) return;
          stage.run('twist:busker_beer', 20, (r) => { r.borrow(d); r.borrow(p); setState(d, { held: 'beer' }); r.walk(d, [p.position.clone().add(V(0.7, 0, 0.3))], { speed: 1.1, onArrive: () => { setState(d, { anim: 'give' }); r.later(r.t + 1.5, () => { setState(d, { held: null }); setState(p, { held: 'beer', anim: 'idle' }); }); r.later(r.t + 6, () => setState(p, { held: 'accordion', anim: 'accordion' })); } }); });
        },
      },
    },
    power_cut: {
      setup(r, c) { r.end(() => { audio?.setPower?.(true); }); },
      moments: {
        0(c) { // noir total : lampadaires, enseignes et gaine s'éteignent, bougies aux fenêtres et sur les tables
          c.show('power_cut'); audio?.setPower?.(false);
          c.candles = new THREE.Group(); c.r.add(c.candles);
          for (const t of world.tables.filter((t) => t.group.visible)) { const g = new THREE.Group(); cyl(g, 0.025, 0.08, M(0xf6f2ea), 0, 0.84, 0, 6); ball(g, 0.015, glow(0xffb347, 3), 0, 0.9, 0); g.position.copy(t.group.position); c.candles.add(g); }
          const l = new THREE.PointLight(0xffa850, 2.5, 9); l.position.copy(door).add(V(-side * 1.5, 1.2, 1)); c.candles.add(l);
        },
        1(c) { // le courant revient : la gaine redémarre « comme un tracteur », une table applaudit, une autre râle
          c.hide('power_cut'); audio?.setPower?.(true); if (c.candles) c.r.objs.includes(c.candles) && (c.candles.visible = false);
          stage.play({ id: 'exhaust_cough', big: true }); sound('applause', restC('bernadette'), { gain: 0.6, delay: 1 }); say(restC('goulot').setY(1.2), 'angry', { n: 5, f0: 120, delay: 2 });
        },
      },
    },
    waiter_last_night: {
      setup(r, c) { // sa valise près de la porte ; il sert en sifflotant
        const s = new THREE.Group(); box(s, 0.45, 0.6, 0.25, M(0x8a2b2b), 0, 0.32, 0); cyl(s, 0.015, 0.3, M(0x222222), 0, 0.75, 0, 5); s.position.copy(door).add(V(-side * 0.5, 0, -0.9)); r.add(s); c.case = s;
        let wt = 8; r.tick((dt) => { if (c.gone) return; if ((wt -= dt) <= 0) { wt = 20 + Math.random() * 20; if (world.waiter?.visible) sound('whistle', world.waiter.position.clone().setY(1.5), { gain: 0.8 }); } });
      },
      moments: { 0(c) { // tablier sur une chaise, un signe vers votre fenêtre, et il part en courant vers la gare
        const w = world.waiter; if (!w) return;
        const apron = new THREE.Group(); box(apron, 0.4, 0.5, 0.02, M(0xf2f2ee), 0, 0.75, 0); apron.position.copy(door).add(V(-side * 1.2, 0, 0.5)); c.r.add(apron);
        stage.run('twist:waiter_leaves', 30, (r) => {
          r.borrow(w); w.visible = true; w.position.copy(door).add(V(-side * 1.6, 0, 0)); w.rotation.y = side < 0 ? -Math.PI / 2 : Math.PI / 2; setState(w, { anim: 'wave', held: null, expr: 'happy' });
          r.later(4, () => { setState(w, { anim: 'idle' }); r.walk(w, [V(0.4, 0, zB + 8)], { speed: 3 }); });
          r.tick(() => { if (r.t > 4) c.case.position.copy(w.position).add(V(0.3, 0, -0.2)); });
          r.end(() => { c.gone = true; c.case.visible = false; });
        });
      } },
    },
    fete_voisins: {
      setup(r, c) { // place Maurice-Schumann, jusqu'à 22h : tréteaux, guirlandes, tarte de Hilde
        const h = c.show('fete_voisins'); c.h = h; if (!h) return;
        const dz = zB + 3 - (bz + 9.5); for (const o of h.objects) o.position.z += dz;
        c.until = 22 * 60;
        r.tick(() => { const on = c.min < c.until + 2; for (const o of h.objects) o.visible = on; });
      },
      moments: {
        0(c) { const o = c.h?.objects ?? []; const p = o[o.length - 1]; if (!p) return; stage.run('twist:tarte', 200, (r) => { r.borrow(p); setState(p, { anim: 'meeting', expr: 'happy' }); for (let k = 0; k < 6; k++) r.later(2 + k * 7, () => say(p.position.clone().setY(1.5), 'calm', { n: 10, f0: 125 })); r.later(46, () => sound('applause', p.position, { gain: 0.5 })); }); },
        1(c) { const o = c.h?.objects ?? []; const at = o[0]?.position ?? V(0, 0, zB); for (let i = 0; i < 8; i++) sound('crash', at.clone().add(V(rnd(-1, 1), 0.5, rnd(-1, 2))), { gain: 0.25, delay: i * 0.5 }); },
      },
    },
    fire_inspection: {
      setup(r, c) { // le camion s'engage vers 22h15, s'arrête, recule ; mètre ruban à 22h20 ; repart vers 22h40
        const g = new THREE.Group(); box(g, 2.0, 2.2, 6, M(0xc0262d), 0, 1.4, 0); box(g, 1.9, 0.6, 0.05, M(0x9fd0f2, { roughness: 0.1 }), 0, 2.0, 3.01);
        box(g, 0.4, 0.15, 5.5, M(0xc8ccd2, { metalness: 0.7 }), 0, 2.6, -0.3);
        for (const [x, z] of [[0.95, 2], [-0.95, 2], [0.95, -2], [-0.95, -2]]) cyl(g, 0.45, 0.3, M(0x111111), x, 0.45, z, 12).rotation.z = Math.PI / 2;
        const b1 = box(g, 0.3, 0.12, 0.3, glow(0x3a6bff, 0), -0.5, 2.56, 2.6), b2 = box(g, 0.3, 0.12, 0.3, glow(0x3a6bff, 0), 0.5, 2.56, 2.6);
        r.add(g); const t0 = c.at(0);
        const e = r.em('engine', V(0, 1, zA), { gain: 0.6, ref: 7, f: 28 });
        r.tick(() => {
          const on = c.during(t0 - 5, t0 + 20); g.visible = on; if (e) e.gain = on ? 0.6 : 0; if (!on) return;
          const z = c.min < t0 ? zA - 3 + (door.z - 6 - zA + 3) * ((c.min - t0 + 5) / 5) : c.min < t0 + 1 ? door.z - 6 - (c.min - t0) * 3 : door.z - 9;
          g.position.set(0.2, 0, z); e?.pos.set(0.2, 1, z);
          const blink = (c.r.t * 3) % 1 < 0.5; b1.material = glow(0x3a6bff, blink ? 3 : 0); b2.material = glow(0x3a6bff, blink ? 0 : 3);
        });
      },
      moments: { 0(c) {
        stage.run('twist:fire_measure', 40, (r) => {
          const h = c.show('firefighters'); r.end(() => c.hide('firefighters'));
          r.later(3, () => say(door.clone().add(V(-side * 2.5, 1.5, 3)), 'calm', { n: 7, f0: 120 }));
          r.later(1, () => sound('radio', door.clone().add(V(0, 1.5, -5)), { gain: 0.8 }));
          const d = world.cast?.dede; if (d) { r.borrow(d); setState(d, { anim: 'idle', held: 'clipboard', expr: 'surprised' }); }
          void h;
        });
      } },
    },
    delandre_walk: {
      moments: { 0() { // le maire remonte la rue avec un conseiller et un parapluie ; Dédé range trois tables en courant
        stage.run('twist:mayor', 75, (r) => {
          const m = r.add(CAST.delandre ? CAST.delandre({ expr: 'neutral' }) : humanoid({ hair: 'side' }));
          const adv = r.add(humanoid({ hair: 'short', shirt: 0x2b3550, pants: 0x2b3550, held: 'umbrella' }));
          m.position.set(0.5, 0, zA - 2); adv.position.set(1.1, 0, zA - 3);
          const stop = door.clone().add(V(-side * 2.2, 0, 0));
          r.walk(m, [V(0.5, 0, stop.z - 1), stop, V(0.5, 0, zB + 6)], { speed: 1.1 });
          r.tick(() => { adv.position.copy(m.position).add(V(0.6, 0, -0.9)); adv.rotation.y = m.rotation.y; });
          r.later((stop.z - zA) / 1.1 - 1, () => say(m.position.clone().setY(1.6), 'calm', { n: 9, f0: 115 }));
          const d = world.cast?.dede; if (d) { r.borrow(d); setState(d, { anim: 'rush', expr: 'surprised' }); r.tick(() => { if (r.t < 25) d.position.copy(door).add(V(-side * (0.8 + Math.abs(Math.sin(r.t * 0.8)) * 2), 0, Math.sin(r.t * 0.5))); }); }
          for (let i = 0; i < 6; i++) r.later(2 + i * 3, () => sound('crash', door.clone().add(V(-side * 1.5, 0.5, 0)), { gain: 0.35 }));
        });
      } },
    },
    lost_dog: {
      setup(r, c) { // affiches « PERDU » ; Jérémie fait toute la rue en criant son nom (de 21h30 jusqu'aux retrouvailles)
        const g = new THREE.Group(); r.add(g);
        for (const [x, z] of [[W - 0.03, bz - 6], [-W + 0.03, bz + 12], [W - 0.03, bz + 22]]) { const p = sign(g, [['PERDU', 52], ['BILOUTE', 34], ['teckel, très poli', 18]], 0.42, 0.55, x, 1.6, z, '#fbf8f0', '#2a2a35'); p.rotation.y = x > 0 ? -Math.PI / 2 : Math.PI / 2; }
        const j = world.cast?.jeremie;
        if (j) {
          let call = 4;
          r.tick((dt) => {
            if (!c.during(c.at(0), c.at(1) + 1)) return;
            if (!c.jb) { c.jb = stage.run('twist:jeremie_search', Infinity, (rr) => { rr.borrow(j); j.visible = true; setState(j, { anim: 'idle', held: null }); }); }
            const s = (c.r.t * 0.05) % 2, k = s < 1 ? s : 2 - s;
            j.position.set(0.2, 0, zA + 6 + (zB - zA - 12) * k); j.rotation.y = s < 1 ? 0 : Math.PI;
            if ((call -= dt) <= 0) { call = 10 + Math.random() * 6; say(j.position.clone().setY(1.6), 'shout', { n: 3, f0: 120, gain: 1 }); }
          });
          r.end(() => c.jb && stage.stop(c.jb));
        }
      },
      moments: {
        0() { stage.run('twist:customers_reply', 6, (r) => { const ps = people(rest('bernadette')).slice(0, 3); ps.forEach((q, i) => { r.borrow(q); setState(q, { anim: 'wave' }); r.later(0.6 + i * 0.4, () => say(q.getWorldPosition(V()), 'ask', { n: 2, f0: 140 + i * 30 })); }); }); },
        1(c) { // Biloute retrouvé sous la table 3, une frite dans la gueule
          const dog = world.cast?.dog, t = rest('bernadette')[2] ?? rest('bernadette')[0]; if (!dog || !t) return;
          if (c.jb) { stage.stop(c.jb); c.jb = null; }
          c.found = true;
          stage.run('twist:dog_found', 40, (r) => {
            r.borrow(dog); dog.visible = true; dog.position.copy(t.group.position).add(V(0, 0, 0.1)); dog.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
            const fry = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.14), M(0xf2c14e)); r.add(fry); r.tick(() => fry.position.copy(dog.position).add(V(-side * 0.32, 0.2, 0)));
            for (const q of people([t])) { r.borrow(q); setState(q, { anim: 'cheer', expr: 'happy' }); }
            r.later(1, () => sound('cheer', t.group.position, { gain: 0.6, n: 8 })); r.later(2.5, () => sound('bark', dog.position, { gain: 0.8 }));
            const d = world.cast?.dede; if (d) r.later(4, () => { r.borrow(d); setState(d, { anim: 'greet', expr: 'happy' }); say(d.position.clone().setY(1.1), 'calm', { n: 7, f0: 110 }); });
          });
        },
      },
    },
    tv_crew: {
      setup(r, c) { // caméra sur pied, cadreur, perchiste, panneau LED, face à Dédé à sa porte, jusqu'à 22h30
        const g = new THREE.Group(); const at = door.clone().add(V(-side * 3.2, 0, 0.8)); g.position.copy(at); g.rotation.y = side < 0 ? -Math.PI / 2 : Math.PI / 2; r.add(g);
        for (const a of [0, 2.1, 4.2]) { const l = box(g, 0.02, 1.4, 0.02, M(0x222222), Math.cos(a) * 0.18, 0.7, Math.sin(a) * 0.18); l.rotation.z = Math.cos(a) * 0.18; l.rotation.x = -Math.sin(a) * 0.18; }
        box(g, 0.25, 0.28, 0.5, M(0x1f1f24), 0, 1.5, 0); cyl(g, 0.08, 0.2, M(0x111111), 0, 1.52, 0.33, 12).rotation.x = Math.PI / 2;
        sign(g, [['GRAND NORD TV', 22]], 0.24, 0.07, 0.13, 1.5, 0, '#c0262d', '#ffffff').rotation.y = Math.PI / 2;
        const cam = humanoid({ hair: 'short', shirt: 0x2f3542, anim: 'film', held: null }); cam.position.set(0, 0, -0.5); g.add(cam);
        const boomOp = humanoid({ hair: 'bun', shirt: 0x5a6b4a, anim: 'film' }); boomOp.position.set(1.0, 0, -0.2); g.add(boomOp);
        const pole = box(g, 0.025, 0.025, 2.6, M(0x8a8f96, { metalness: 0.6 }), 0.6, 2.2, 0.9); pole.rotation.x = -0.35;
        const mic = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.35, 10), M(0x6b6b6b, { roughness: 1 })); mic.rotation.x = Math.PI / 2; mic.position.set(0.6, 2.6, 2.1); g.add(mic);
        const panel = box(g, 0.6, 0.4, 0.04, glow(0xfff6e0, 2.5), -1.1, 1.8, 0.3); const pl = new THREE.PointLight(0xfff0d8, 2.2, 6); pl.position.set(-1.1, 1.8, 0.8); g.add(pl); void panel;
        const d = world.cast?.dede;
        if (d) c.db = stage.run('twist:dede_interview', Infinity, (rr) => { rr.borrow(d); setState(d, { anim: 'meeting', expr: 'happy', talk: 1 }); });
        r.tick(() => { const on = c.min < c.at(1); g.visible = on; if (!on && c.db) { stage.stop(c.db); c.db = null; } });
        r.end(() => c.db && stage.stop(c.db));
        let talk = 6; r.tick((dt) => { if (!c.db) return; if ((talk -= dt) <= 0) { talk = 6 + Math.random() * 5; say(door.clone().add(V(-side * 0.6, 1.2, 0)), 'calm', { n: 10, f0: 110 }); } });
      },
      moments: {
        0() { const d = world.cast?.dede; if (d) { d.rotation.y += side < 0 ? 0.6 : -0.6; setTimeout(() => { d.rotation.y -= side < 0 ? 0.6 : -0.6; }, 2500); } }, // le clin d'œil à votre fenêtre
        1() { stage.run('twist:tables_back', 10, (r) => { for (let i = 0; i < 8; i++) r.later(i * 0.6, () => sound('crash', door.clone().add(V(-side * rnd(1, 3), 0.5, rnd(-2, 4))), { gain: 0.3 })); }); },
      },
    },
    street_sweeper: {
      moments: { 0() { // 23h30 : la balayeuse entre, jets à fond ; les clients sautent sur leurs chaises
        stage.play({ id: 'street_sweeper', pass: 'full' });
        stage.run('twist:sweeper_jump', 25, (r) => {
          for (const q of people(world.tables.filter((t) => t.group.visible))) if (Math.random() < 0.6) { r.borrow(q); setState(q, { anim: 'cheer', expr: 'surprised' }); }
          for (let i = 0; i < 10; i++) r.later(3 + i * 1.2, () => sound('crash', door.clone().add(V(-side * rnd(1, 3), 0.4, rnd(-8, 8))), { gain: 0.3 }));
          for (let i = 0; i < 8; i++) r.later(5 + i * 6, () => art?.fx?.puddle?.(rnd(-1.5, 1.5), zA + (zB - zA) * (i / 8), rnd(0.8, 1.6), 240));
        });
      } },
    },
  };
  function goal(c, final = false) { // but : la rue exulte, fumigènes rouges
    stage.run('twist:goal', final ? 14 : 10, (r) => {
      for (const p of c.sup ?? []) { r.borrow(p); setState(p, { anim: 'cheer', expr: 'happy' }); }
      sound('cheer', c.sup?.[0]?.position ?? door, { gain: 1, n: 18 }); r.later(1.5, () => sound('chant', c.sup?.[0]?.position ?? door, { voices: 10, gain: 0.9 }));
      const at = (c.sup?.[3]?.position ?? door).clone();
      const l = new THREE.PointLight(0xff3020, 0, 10); l.position.copy(at).setY(2); r.add(l);
      r.tick(() => { l.intensity = 3 + Math.sin(r.t * 25) * 1.2; });
      art?.fx?.smoke?.(at.clone().setY(2.1), { rate: 16, life: 2.6, color: 0xc8402e, rise: 1.1, spread: 0.12, duration: final ? 10 : 7, size: [0.2, 0.8], alpha: 0.35 });
    });
  }

  return {
    get id() { return cur?.id ?? null; },
    get fired() { return cur ? [...cur.fired] : []; },
    // À chaque image : le twist de la nuit (sim.twist) et l'heure du jeu (minutes)
    update(tw, min) {
      if ((tw?.id ?? null) !== (cur?.id ?? null)) { if (cur) stage.stop(cur.r); cur = tw?.id ? start(tw) : null; }
      if (!cur) return;
      cur.c.min = min;
      const evs = cur.tw.sim?.events ?? [];
      for (let i = 0; i < evs.length; i++) {
        if (cur.fired.has(i) || !(min >= evs[i].at)) continue;
        cur.fired.add(i);
        try { cur.def?.moments?.[i]?.(cur.c, evs[i]); } catch (err) { console.warn(`twist ${cur.id} moment ${i} :`, err); }
      }
    },
    stop() { if (cur) stage.stop(cur.r); cur = null; },
    // Twists et moments mis en scène (pour qa/twists-live.md et les tests) : { id: [n…] }
    coverage: () => Object.fromEntries(Object.entries(DEFS).map(([id, d]) => [id, Object.keys(d.moments ?? {}).map(Number)])),
  };
}
