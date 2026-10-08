// Mise en scène des « twists » de la nuit (v1.1, §12b.A) : un id d'accessoire = une petite scène posée dans la rue.
//   const h = art.twists.spawn('birthday_cake') ; h.trigger('song') ; h.remove()
//   art.twists.ids → liste des ids connus. Le metteur en scène les pose d'après sim.twist.props.
// Les personnages sont instanciés (rig.js) ; les objets sont de petits meshes non fusionnés (quelques-uns par nuit).
import * as THREE from 'three';
import { humanoid, setState, customer } from './characters.js';
import { canvasTexture, panelTex } from './textures.js';

const mats = new Map();
const M = (color, o = {}) => {
  const k = color + JSON.stringify(o);
  if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o }));
  return mats.get(k);
};
const glow = (color, i = 2) => M(0x222222, { emissive: color, emissiveIntensity: i });
const mesh = (g, m, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); return o; };
const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const C = (a, b, h, s = 10) => new THREE.CylinderGeometry(a, b, h, s);
const pick = (a) => a[Math.floor(Math.random() * a.length)];

export function createTwists(scene, world, { onFrame, audio, anim }) {
  const A = world.anchors;
  const W = Math.abs(world.window.pos.x) - 0.3;
  const bz = A.pilouWindow.z;
  const live = new Set();
  onFrame((dt, t) => { for (const h of live) h.tick?.(dt, t); });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const tableNo = (rest, n) => world.tables.filter((t) => (t.rest?.id ?? t.restId) === rest)[n - 1] ?? world.tables[0];

  function handle(id, objs, { tick = null, trigger = null, cleanup = null } = {}) {
    for (const o of objs) scene.add(o);
    const h = {
      id, objects: objs, tick,
      trigger: (moment, o) => trigger?.(moment, o),
      remove() { for (const o of objs) scene.remove(o); cleanup?.(); live.delete(h); },
    };
    live.add(h);
    return h;
  }
  // Petit groupe de personnages autour d'un point, tournés vers lui
  function people(n, center, r, make = () => customer('stand')) {
    return Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.4;
      const p = make(i);
      p.position.set(center.x + Math.cos(a) * r, 0, center.z + Math.sin(a) * r);
      p.rotation.y = Math.atan2(center.x - p.position.x, center.z - p.position.z);
      return p;
    });
  }

  const builders = {
    // Anniversaire à la table 4 : gâteau à bougies (qui vacillent), ballons attachés à une chaise ; « song » : tout le monde chante
    birthday_cake: () => {
      const t = tableNo('bernadette', 4);
      const p = t.group.position;
      const g = new THREE.Group(); g.position.set(p.x, 0, p.z);
      g.add(mesh(C(0.16, 0.16, 0.12, 16), M(0xf3e2c8), 0.08, 0.84, -0.05), mesh(C(0.165, 0.165, 0.03, 16), M(0xf28cb1), 0.08, 0.9, -0.05));
      const flames = [];
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        g.add(mesh(C(0.006, 0.006, 0.06, 4), M(0xf6f2ea), 0.08 + Math.cos(a) * 0.1, 0.94, -0.05 + Math.sin(a) * 0.1));
        const f = mesh(new THREE.SphereGeometry(0.012, 5, 4), glow(0xffb347, 3), 0.08 + Math.cos(a) * 0.1, 0.985, -0.05 + Math.sin(a) * 0.1);
        flames.push(f); g.add(f);
      }
      const balloons = [];
      for (let i = 0; i < 5; i++) {
        const b = new THREE.Group();
        const col = [0xe0475f, 0xf5d04a, 0x6c9bd2, 0x7fb685, 0xf28cb1][i];
        b.add(mesh(new THREE.SphereGeometry(0.16, 12, 10), M(col, { roughness: 0.25 }), 0, 1.75 + i * 0.06, 0));
        b.add(mesh(C(0.004, 0.004, 1.0, 3), M(0xeeeeee), 0, 1.2, 0));
        b.position.set(0.7 + (i - 2) * 0.13, 0, 0.55 + (i % 2) * 0.1);
        balloons.push(b); g.add(b);
      }
      let song = 0;
      return handle('birthday_cake', [g], {
        tick(dt, tt) {
          flames.forEach((f, i) => { f.scale.setScalar(0.8 + Math.sin(tt * 17 + i * 3) * 0.25); });
          balloons.forEach((b, i) => { b.rotation.z = Math.sin(tt * 0.9 + i) * 0.08; b.rotation.x = Math.cos(tt * 0.7 + i) * 0.06; });
          if (song > 0 && (song -= dt) <= 0) for (const q of t.people) setState(q, { anim: 'idle' });
        },
        trigger(m) {
          if (m === 'song') { song = 20; for (const q of t.people) setState(q, { anim: 'sing' }); audio?.play('birthday', { pos: p }); }
          if (m === 'blow') flames.forEach((f) => { f.visible = false; });
        },
      });
    },

    // L'influenceuse : anneau lumineux sur trépied, téléphone au centre, elle prend la pose devant la terrasse
    ring_light: () => {
      const at = V(0.5, 0, A.bernadetteDoor.z + 2.5);
      const g = new THREE.Group(); g.position.copy(at); g.rotation.y = -Math.PI / 2;
      g.add(mesh(C(0.015, 0.015, 1.5, 5), M(0x222222), 0, 0.75, 0));
      for (const a of [0, 2.1, 4.2]) g.add(mesh(C(0.01, 0.01, 0.5, 4), M(0x222222), Math.cos(a) * 0.15, 0.2, Math.sin(a) * 0.15, Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5));
      const ring = mesh(new THREE.TorusGeometry(0.22, 0.03, 6, 24), glow(0xf6f6ff, 2.5), 0, 1.6, 0);
      g.add(ring, mesh(B(0.07, 0.13, 0.01), glow(0x9fd0ff, 1.2), 0, 1.6, 0.01));
      const inf = humanoid({ hair: 'long', hairColor: 0xd9b26a, shirt: 0xf28cb1, skirt: 0x2a2a35, glasses: null, talk: 1, anim: 'wave', expr: 'happy' });
      inf.position.set(at.x - 1.6, 0, at.z); inf.rotation.y = Math.PI / 2;
      return handle('ring_light', [g, inf], {
        tick(dt, tt) { ring.material.emissiveIntensity = 2.2 + Math.sin(tt * 2) * 0.2; setState(inf, { anim: (tt % 8) < 4 ? 'wave' : 'film', held: (tt % 8) < 4 ? null : 'film' }); },
      });
    },

    // Match de foot sur un écran dehors (façade des Mal Lunés) ; « goal » : score, « BUT ! », la terrasse exulte
    tv_screen: () => {
      const r = world.tables.find((t) => (t.rest?.id ?? t.restId) === 'malunes')?.group.position ?? V(-W + 1, 0, bz + 18);
      const cv = document.createElement('canvas'); cv.width = 256; cv.height = 144;
      const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
      const g = new THREE.Group(); g.position.set(r.x < 0 ? -W + 0.2 : W - 0.2, 4.05, r.z + 1.5); g.rotation.y = r.x < 0 ? Math.PI / 2 : -Math.PI / 2; g.rotation.x = 0; // au-dessus du store
      g.add(mesh(B(0.5, 0.05, 0.05), M(0x2a2a2a), 0, -0.55, -0.25));
      g.add(mesh(B(1.7, 1.0, 0.08), M(0x111111), 0, 0, -0.05));
      g.add(mesh(new THREE.PlaneGeometry(1.6, 0.9), new THREE.MeshBasicMaterial({ map: tex }), 0, 0, 0));
      const state = { home: 0, away: 0, flash: 0, acc: 0 };
      const players = Array.from({ length: 12 }, (_, i) => ({ x: Math.random(), y: Math.random(), side: i % 2 }));
      const draw = (tt) => {
        const c = cv.getContext('2d');
        c.fillStyle = '#2f8a3a'; c.fillRect(0, 0, 256, 144);
        c.strokeStyle = '#d8f0d8'; c.lineWidth = 2; c.strokeRect(8, 18, 240, 118); c.beginPath(); c.moveTo(128, 18); c.lineTo(128, 136); c.stroke();
        c.beginPath(); c.arc(128, 77, 16, 0, 7); c.stroke();
        for (const p of players) { p.x += Math.sin(tt * 0.7 + p.y * 9) * 0.004; p.y += Math.cos(tt * 0.5 + p.x * 7) * 0.004; c.fillStyle = p.side ? '#e0353a' : '#f2f2f2'; c.fillRect(10 + ((p.x % 1) + 1) % 1 * 230, 22 + ((p.y % 1) + 1) % 1 * 108, 5, 5); }
        c.fillStyle = '#fff'; c.beginPath(); c.arc(128 + Math.sin(tt * 1.3) * 80, 77 + Math.cos(tt * 1.7) * 40, 2.5, 0, 7); c.fill();
        c.fillStyle = 'rgba(0,0,0,0.65)'; c.fillRect(0, 0, 256, 16);
        c.fillStyle = '#fff'; c.font = 'bold 12px Arial'; c.textAlign = 'center'; c.fillText(`LILLE ${state.home} – ${state.away} LENS`, 128, 12);
        if (state.flash > 0) { c.fillStyle = 'rgba(255,210,63,0.9)'; c.font = '900 48px Arial'; c.fillText('BUT !', 128, 92); }
        tex.needsUpdate = true;
      };
      draw(0);
      const fans = () => world.tables.filter((t) => (t.rest?.id ?? t.restId) === 'malunes' || (t.rest?.id ?? t.restId) === 'bernadette').flatMap((t) => t.people);
      return handle('tv_screen', [g], {
        tick(dt, tt) {
          state.acc += dt; if (state.acc > 0.1) { state.acc = 0; draw(tt); }
          if (state.flash > 0 && (state.flash -= dt) <= 0) for (const q of fans()) if (q.userData.rig.anim === 'cheer') setState(q, { anim: 'idle' });
        },
        trigger(m, o = {}) {
          if (m !== 'goal') return;
          if (o.away) state.away++; else state.home++;
          state.flash = 5;
          for (const q of fans()) setState(q, { anim: 'cheer' });
          audio?.play('cheer', { pos: V(g.position.x, 1, g.position.z) });
        },
      });
    },

    // EVJF : la future mariée (voile, diadème) et ses amies en écharpes roses, une au mégaphone
    evjf: () => {
      const c = V(0.4, 0, bz + 13);
      const sash = (add, k) => add('box', 'body', [0, k.th * 0.55, 0.0], [0.5 * k.g, 0.07, 0.4 * k.g], 0xff5fa2, [0, 0, 0.7]);
      const group = people(5, c, 0.9, (i) => humanoid({
        hair: pick(['long', 'bob', 'ponytail', 'bun']), skirt: pick([0x2a2a35, 0xb5527a, 0x6d597a]), shirt: i === 0 ? 0xf6f2ea : pick([0xff5fa2, 0xf28cb1, 0xe9c46a]),
        held: i === 1 ? 'megaphone' : i === 2 ? 'wine' : null, anim: i === 1 ? 'megaphone' : 'idle', talk: 1, expr: 'happy',
        extras: (add, k) => {
          sash(add, k);
          if (i === 0) { add('hemi', 'head', [0, 0.92 * k.r, -0.35 * k.r], [1.25 * k.r, 1.6 * k.r, 0.9 * k.r], 0xffffff, [-1.9, 0, 0]); add('torus', 'head', [0, 1.85 * k.r, 0], [0.5 * k.r, 0.5 * k.r, 0.5 * k.r], 0xe8c45a, [Math.PI / 2, 0, 0]); }
        },
      }));
      let shout = 4;
      return handle('evjf', group, {
        tick(dt) { if ((shout -= dt) <= 0) { shout = 9 + Math.random() * 10; audio?.play('megaphone', { pos: c }); } },
      });
    },

    // Camionnette de livraison garée dans le couloir (feux de détresse)
    delivery_van: () => {
      const g = new THREE.Group(); g.position.set(0.1, 0, bz + 9); g.rotation.y = Math.PI;
      const add = (geo, m, x, y, z) => { const o = mesh(geo, m, x, y, z); g.add(o); return o; };
      add(B(1.8, 1.7, 3.2), M(0xf2f2ee), 0, 1.15, -0.3); add(B(1.8, 1.2, 1.2), M(0xf2f2ee), 0, 0.9, 1.75);
      add(B(1.6, 0.55, 0.05), M(0x9fd0f2, { roughness: 0.1 }), 0, 1.25, 2.36);
      const label = canvasTexture(512, 128, (c, w, h) => { c.fillStyle = '#f2f2ee'; c.fillRect(0, 0, w, h); c.fillStyle = '#c0262d'; c.font = 'bold 54px Arial'; c.textAlign = 'center'; c.fillText('BRASSERIE DU NORD', w / 2, 60); c.font = '30px Arial'; c.fillText('livraisons', w / 2, 104); });
      for (const sx of [-1, 1]) { const s = add(new THREE.PlaneGeometry(2.8, 0.7), new THREE.MeshStandardMaterial({ map: label }), sx * 0.91, 1.4, -0.3); s.rotation.y = sx * Math.PI / 2; }
      for (const [x, z] of [[0.85, 1.6], [-0.85, 1.6], [0.85, -1.3], [-0.85, -1.3]]) add(C(0.36, 0.36, 0.22, 14), M(0x1a1a1a), x, 0.36, z).rotation.z = Math.PI / 2;
      const hazard = [add(B(0.12, 0.08, 0.04), glow(0xff9a1a, 0), 0.75, 0.75, 2.36), add(B(0.12, 0.08, 0.04), glow(0xff9a1a, 0), -0.75, 0.75, 2.36), add(B(0.12, 0.1, 0.04), glow(0xff9a1a, 0), 0.8, 0.9, -1.92), add(B(0.12, 0.1, 0.04), glow(0xff9a1a, 0), -0.8, 0.9, -1.92)];
      for (let i = 0; i < 3; i++) add(C(0.22, 0.22, 0.55, 12), M(0xb8bcc2, { metalness: 0.7, roughness: 0.3 }), -0.5 + i * 0.45, 0.28, -2.4); // fûts de bière
      return handle('delivery_van', [g], { tick(dt, tt) { const on = (tt % 1) < 0.5; for (const h of hazard) h.material.emissiveIntensity = on ? 2.2 : 0; } });
    },

    // Musicien de rue sous la fenêtre de Pilou : accordéon, chapeau retourné, quelques pièces ; musette tant qu'il est là
    busker: () => {
      const p = humanoid({ hair: 'bald', hairColor: 0x6b5b4b, mustache: 0x6b5b4b, shirt: 0x2b4d7a, pants: 0x3a3a3a, held: 'accordion', anim: 'accordion', talk: 0, expr: 'happy',
        extras: (add, k) => add('cyl', 'head', [0, 1.75 * k.r, 0], [1.9 * k.r, 0.35 * k.r, 1.9 * k.r], 0x2a2a2a) });
      p.position.set(-W + 1.1, 0, bz - 1.4); p.rotation.y = Math.PI / 2 + 0.3;
      const hat = new THREE.Group(); hat.position.set(-W + 1.6, 0, bz - 0.8);
      hat.add(mesh(C(0.16, 0.12, 0.09, 12), M(0x2a2a2a), 0, 0.045, 0), mesh(C(0.22, 0.22, 0.015, 14), M(0x2a2a2a), 0, 0.005, 0));
      for (let i = 0; i < 6; i++) hat.add(mesh(C(0.02, 0.02, 0.004, 8), M(0xe8c45a, { metalness: 0.8, roughness: 0.3 }), (Math.random() - 0.5) * 0.15, 0.06, (Math.random() - 0.5) * 0.15));
      audio?.loop('musette', true);
      return handle('busker', [p, hat], { cleanup: () => audio?.loop('musette', false) });
    },

    // Panne de courant : lanternes et lumières de la rue éteintes, fenêtres presque noires, bougies aux fenêtres
    power_cut: () => {
      const em = world.emissiveMaterials ?? [];
      for (const e of em) e.m.emissiveIntensity = e.base * 0.06;
      const lights = (world.streetLights ?? []).map((l) => [l, l.intensity]);
      for (const [l] of lights) l.intensity = 0;
      const spots = (world.windowSpots ?? []).filter(() => Math.random() < 0.25).slice(0, 30);
      const candles = spots.map((s) => mesh(new THREE.SphereGeometry(0.035, 6, 4), glow(0xffb347, 3), s.x + (s.side < 0 ? 0.08 : -0.08), s.y - 0.75, s.z + (Math.random() - 0.5) * 0.4));
      const steam = world.steam;
      const prevSteam = steam.blocked;
      steam.blocked = true; // la hotte s'arrête
      return handle('power_cut', candles, {
        tick(dt, tt) { candles.forEach((c, i) => c.scale.setScalar(0.85 + Math.sin(tt * 13 + i * 2.3) * 0.2)); },
        cleanup() { for (const e of em) e.m.emissiveIntensity = e.base; for (const [l, i] of lights) l.intensity = i; steam.blocked = prevSteam; },
      });
    },

    // Canicule : ventilateurs aux fenêtres (pales qui tournent), et une partie des clients s'éventent
    heatwave: () => {
      const spots = (world.windowSpots ?? []).filter((s) => Math.abs(s.z - bz) < 30 && Math.random() < 0.3).slice(0, 10);
      const blades = [];
      const fans = spots.map((s) => {
        const g = new THREE.Group(); g.position.set(s.x + (s.side < 0 ? 0.18 : -0.18), s.y - 0.72, s.z); g.rotation.y = s.side < 0 ? Math.PI / 2 : -Math.PI / 2;
        g.add(mesh(C(0.05, 0.08, 0.04, 8), M(0xe8e4dc), 0, 0, 0), mesh(C(0.015, 0.015, 0.22, 4), M(0xe8e4dc), 0, 0.12, 0));
        const head = new THREE.Group(); head.position.y = 0.3;
        head.add(mesh(new THREE.TorusGeometry(0.15, 0.01, 4, 16), M(0xe8e4dc), 0, 0, 0));
        const bl = new THREE.Group();
        for (let i = 0; i < 3; i++) bl.add(mesh(B(0.04, 0.13, 0.008), M(0x6c9bd2), Math.cos((i * 2 * Math.PI) / 3) * 0.06, Math.sin((i * 2 * Math.PI) / 3) * 0.06, 0, 0, 0, (i * 2 * Math.PI) / 3 + Math.PI / 2));
        head.add(bl); g.add(head); blades.push(bl);
        return g;
      });
      let acc = 0;
      return handle('heatwave', fans, {
        tick(dt) {
          for (const b of blades) b.rotation.z += dt * 18;
          if ((acc -= dt) > 0) return;
          acc = 4;
          for (const t of world.tables) for (const q of t.people) if (Math.random() < 0.08) { anim?.react(q.getWorldPosition(V(0, 0, 0)), 0.2, 'sick', 3, 'fan'); }
        },
      });
    },

    // Fête des voisins (l'association contre-programme) : tables à nappe vichy, guirlande de fanions, banderole, voisins
    fete_voisins: () => {
      const z0 = bz + 9.5;
      const vichy = canvasTexture(64, 64, (c) => { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { c.fillStyle = (x + y) % 2 ? '#f4efe2' : '#c0262d'; c.fillRect(x * 8, y * 8, 8, 8); } }, [6, 2]);
      const objs = [];
      const g = new THREE.Group(); g.position.set(0.9, 0, z0); objs.push(g);
      for (let i = 0; i < 2; i++) {
        g.add(mesh(B(0.8, 0.04, 2.0), new THREE.MeshStandardMaterial({ map: vichy }), 0, 0.75, i * 2.2));
        for (const dz of [-0.85, 0.85]) g.add(mesh(B(0.7, 0.72, 0.04), M(0x8a8f96), 0, 0.36, i * 2.2 + dz));
        for (let j = 0; j < 4; j++) g.add(mesh(C(0.05, 0.04, 0.1, 8), M(j % 2 ? 0xf6f2ea : 0xf0a830), (Math.random() - 0.5) * 0.4, 0.82, i * 2.2 + (j - 1.5) * 0.4));
      }
      // guirlande de fanions d'une façade à l'autre
      const flagsG = new THREE.Group(); flagsG.position.set(0, 0, z0 + 1.1); objs.push(flagsG);
      const cols = [0xe0475f, 0xf5d04a, 0x2b4d7a, 0x7fb685, 0xf28cb1];
      for (let i = 0; i < 18; i++) {
        const x = -W + 0.1 + (i / 17) * (2 * W - 0.2), y = 4.2 - Math.sin((i / 17) * Math.PI) * 0.6;
        const f = mesh(new THREE.ConeGeometry(0.11, 0.24, 3), M(cols[i % 5], { side: THREE.DoubleSide }), x, y - 0.12, 0, Math.PI, 0, 0);
        f.scale.z = 0.15; flagsG.add(f);
      }
      const ban = mesh(new THREE.PlaneGeometry(2.4, 0.5), new THREE.MeshStandardMaterial({ map: panelTex([['FÊTE DES VOISINS', 56], ['Association de la rue des Bouchers', 26]], '#f7f2e6', '#2b4d7a'), side: THREE.DoubleSide, emissive: 0xffffff, emissiveMap: null, emissiveIntensity: 0 }), 0, 3.3, z0 + 1.1);
      objs.push(ban);
      const crowd = people(7, V(0.9, 0, z0 + 1.1), 1.2, (i) => customer('stand'));
      crowd.forEach((q, i) => setState(q, { held: i % 3 === 0 ? 'wine' : i % 3 === 1 ? 'beer' : null, expr: 'happy' }));
      return handle('fete_voisins', [...objs, ...crowd]);
    },

    // Inspection des pompiers : deux sapeurs-pompiers mesurent le couloir de passage
    firefighters: () => {
      const z = A.bernadetteDoor.z + 3;
      const sapeur = (o) => humanoid({ hair: 'short', shirt: 0x1f2a44, pants: 0x1f2a44, shoes: 0x111111, talk: 0.3, height: 1.08, ...o,
        extras: (add, k) => {
          for (const y of [0.35, 0.55]) add('box', 'body', [0, k.th * y, 0], [0.48 * k.g, 0.035, 0.38 * k.g], y < 0.5 ? 0xd8c040 : 0xc0262d, null, true);
          add('sphere', 'head', [0, 1.25 * k.r, -0.05 * k.r], [1.18 * k.r, 0.95 * k.r, 1.2 * k.r], 0xd8dce2); // casque F1 chromé
          add('box', 'head', [0, 1.0 * k.r, 1.02 * k.r], [1.3 * k.r, 0.35 * k.r, 0.08 * k.r], 0xc8a040, [0.3, 0, 0], true);
        } });
      const a = sapeur({ anim: 'measure', held: 'tape', expr: 'neutral', tapeLen: 2.6 });
      a.position.set(-0.9, 0, z); a.rotation.y = Math.PI / 2;
      const b = sapeur({ anim: 'clipboard', held: 'clipboard', expr: 'suspicious' });
      b.position.set(1.0, 0, z + 0.4); b.rotation.y = -Math.PI / 2;
      return handle('firefighters', [a, b]);
    },

    // Visite guidée nocturne : la guide lève son parapluie fermé, le groupe la suit d'un bout à l'autre de la rue
    tour_group: () => {
      const guide = humanoid({ hair: 'bob', hairColor: 0x8a5a2b, shirt: 0x2b9d8f, pants: 0x3d4a63, held: 'guide', anim: 'guide', talk: 1, expr: 'happy' });
      const tourists = Array.from({ length: 8 }, (_, i) => {
        const q = customer('stand');
        setState(q, { held: i % 3 === 0 ? 'film' : null, anim: i % 3 === 0 ? 'film' : 'idle', talk: 0.5 });
        return q;
      });
      const path = [V(0.5, 0, -40), V(0.3, 0, 40)];
      const state = { s: 0, dir: 1, pause: 0 };
      const at = (s) => V(path[0].x + (path[1].x - path[0].x) * s, 0, path[0].z + (path[1].z - path[0].z) * s);
      const len = path[0].distanceTo(path[1]);
      return handle('tour_group', [guide, ...tourists], {
        tick(dt) {
          if (state.pause > 0) state.pause -= dt;
          else {
            state.s += state.dir * (dt * 0.7) / len;
            if (state.s > 1 || state.s < 0) { state.dir *= -1; state.s = Math.max(0, Math.min(1, state.s)); }
            if (Math.abs(state.s * len - (bz + 40)) < 0.4) state.pause = 12; // arrêt devant l'estaminet : explications
          }
          const gp = at(state.s);
          guide.position.copy(gp); guide.rotation.y = state.dir > 0 ? 0 : Math.PI;
          guide.updateMatrixWorld();
          tourists.forEach((q, i) => {
            const back = (1.2 + Math.floor(i / 2) * 0.8) / len;
            const tp = at(Math.max(0, Math.min(1, state.s - state.dir * back)));
            q.position.set(tp.x + (i % 2 ? 0.45 : -0.45), 0, tp.z); q.rotation.y = guide.rotation.y;
            q.updateMatrixWorld();
          });
        },
      });
    },
  };

  // Plusieurs ids de contenu pour la même petite scène
  const ALIAS = { balloons: 'birthday_cake', candles: 'birthday_cake', influencer: 'ring_light', phone: 'ring_light', football: 'tv_screen', megaphone: 'evjf', sashes: 'evjf', accordion: 'busker', fire_brigade: 'firefighters', tape_measure: 'firefighters', tour_guide: 'tour_group', guide_umbrella: 'tour_group', candles_windows: 'power_cut', fans: 'heatwave', bunting: 'fete_voisins' };
  const norm = (id) => ALIAS[id] ?? id;
  const active = new Map(); // id → { h, managed }
  return {
    ids: Object.keys(builders),
    aliases: ALIAS,
    spawn(id, opts = {}) {
      const b = builders[norm(id)];
      if (!b) { console.warn(`art.twists : accessoire inconnu « ${id} »`); return null; }
      return b(opts);
    },
    // Pose / enlève à la main (galerie, scripts) ; sync() ne touche pas à ces accessoires
    show(id) { id = norm(id); if (!active.has(id) && builders[id]) active.set(id, { h: this.spawn(id), managed: false }); return active.get(id)?.h ?? null; },
    hide(id) { id = norm(id); active.get(id)?.h?.remove(); active.delete(id); },
    // Le metteur en scène y passe sim.twist.props à chaque frame : ne pose / n'enlève que les siens
    sync(ids = []) {
      const want = new Set(ids.map(norm).filter((id) => builders[id]));
      for (const [id, a] of active) if (a.managed && !want.has(id)) { a.h?.remove(); active.delete(id); }
      for (const id of want) if (!active.has(id)) active.set(id, { h: this.spawn(id), managed: true });
    },
    trigger(id, moment, o) { for (const [k, a] of active) if (!id || k === norm(id)) a.h?.trigger(moment, o); },
    clear() { for (const a of active.values()) a.h?.remove(); active.clear(); },
    get active() { return [...active.keys()]; },
  };
}
