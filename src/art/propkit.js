// Accessoires des actions de nuit (§6), posés à la demande : chacun renvoie { kind, object, remove(), set(opts) }.
// Quelques objets à la fois, non instanciés ; leurs petites animations passent par onFrame.
import * as THREE from 'three';
import { canvasTexture, panelTex } from './textures.js';

const mats = new Map();
const M = (color, o = {}) => {
  const k = color + JSON.stringify(o);
  if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o }));
  return mats.get(k);
};
const mesh = (geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z); m.rotation.set(rx, ry, rz);
  return m;
};
const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const C = (r0, r1, h, s = 10) => new THREE.CylinderGeometry(r0, r1, h, s);

// Banderole peinte à la main sur un drap
function bannerTex(text) {
  return canvasTexture(1024, 200, (g, w, h) => {
    g.fillStyle = '#f7f2e6'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#c0262d'; g.textBaseline = 'middle';
    let size = 110;
    do g.font = `900 ${size}px "Arial Black", Arial, sans-serif`; while (g.measureText(text).width > w - 60 && (size -= 6) > 30);
    let x = (w - g.measureText(text).width) / 2;
    text.split(' ').forEach((wd, i) => {
      g.save(); g.translate(x, h / 2 + Math.sin(i * 2.1) * 6); g.rotate(Math.sin(i * 1.7) * 0.035); g.fillText(wd, 0, 0); g.restore();
      x += g.measureText(wd + ' ').width;
    });
  });
}
function cardboardTex() {
  return canvasTexture(128, 128, (g, w, h) => {
    g.fillStyle = '#b98a52'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(90,60,30,0.35)'; g.lineWidth = 2;
    for (let y = 6; y < h; y += 9) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.fillStyle = 'rgba(230,225,210,0.85)'; // scotch en croix
    g.save(); g.translate(w / 2, h / 2); g.rotate(0.7); g.fillRect(-w, -9, w * 2, 18); g.rotate(-1.4); g.fillRect(-w, -9, w * 2, 18); g.restore();
    g.fillStyle = '#5a3a1a'; g.font = 'bold 18px Arial'; g.fillText('FRAGILE', 30, 110);
  });
}

export function createProps(scene, world, { onFrame }) {
  const live = new Set();
  const A = world.anchors;
  const W = Math.abs(world.window.pos.x) - 0.3; // demi-largeur de rue
  const resolve = (at, fallback) => {
    const v = at ?? fallback;
    const p = typeof v === 'string' ? A[v] ?? world[v]?.pos ?? world[v] : v;
    if (!p) throw new Error(`art.props : point inconnu « ${v} »`);
    return p.isVector3 ? p.clone() : new THREE.Vector3(p.x, p.y ?? 0, p.z);
  };
  // tourne l'objet (avant = +Z local) vers le milieu de la rue
  const faceStreet = (g, pos) => { g.rotation.y = Math.abs(pos.x) < 0.5 ? 0 : pos.x < 0 ? Math.PI / 2 : -Math.PI / 2; };

  function finish(kind, g, tick = null, extra = {}) {
    scene.add(g);
    const h = {
      kind, object: g, tick,
      remove() { scene.remove(g); live.delete(h); },
      set(o = {}) { if (o.visible !== undefined) g.visible = o.visible; extra.set?.(o); return h; },
    };
    live.add(h);
    return h;
  }
  onFrame((dt, t) => { for (const h of live) if (h.object.visible) h.tick?.(dt, t); });

  const builders = {
    // Boîtier générique : petite boîte sombre avec un voyant qui clignote (tout objet discret posé quelque part)
    gadget(at, o) {
      const g = new THREE.Group();
      g.add(mesh(B(0.12, 0.08, 0.1), M(0x24262b)));
      const led = mesh(new THREE.SphereGeometry(0.012, 6, 4), new THREE.MeshBasicMaterial({ color: o.color ?? 0xff3030 }), 0.035, 0.045, 0.04);
      g.add(led);
      g.position.copy(at); faceStreet(g, at);
      let on = true;
      return finish('gadget', g, (dt, t) => { led.visible = on && (t % (o.period ?? 1.6)) < 0.18; }, { set: (s) => { if (s.on !== undefined) on = s.on; } });
    },
    // Carton scotché sur la sortie de la hotte
    cardboard(at) {
      const g = new THREE.Group();
      const tex = cardboardTex();
      g.add(mesh(B(0.04, 0.42, 0.78), M(0xffffff, { map: tex, roughness: 0.95 })));
      for (const z of [-0.36, 0.36]) g.add(mesh(B(0.06, 0.5, 0.05), M(0xe6e1d2, { roughness: 0.4 }), 0, 0, z));
      g.position.copy(at);
      g.position.x += at.x < 0 ? 0.27 : -0.27;
      g.rotation.z = (at.x < 0 ? 1 : -1) * 0.05;
      return finish('cardboard', g);
    },
    // Uritrottoir : jardinière-urinoir vert sapin, fleurs sur le dessus (installé par la ville)
    uritrottoir(at) {
      const g = new THREE.Group();
      g.add(mesh(B(0.7, 0.9, 0.55), M(0x2f5a3a)), mesh(B(0.74, 0.08, 0.6), M(0x24452c), 0, 0.46, 0));
      g.add(mesh(B(0.5, 0.06, 0.3), M(0x1a1a1a), 0, 0.62, 0.22, -0.4)); // fente
      const leaf = M(0x4f8a4a, { flatShading: true });
      for (let i = 0; i < 6; i++) g.add(mesh(new THREE.IcosahedronGeometry(0.13, 0), leaf, -0.25 + i * 0.1, 0.56, -0.12 + (i % 2) * 0.1));
      for (let i = 0; i < 5; i++) g.add(mesh(new THREE.IcosahedronGeometry(0.05, 0), M([0xe0475f, 0xf5d04a, 0xf28cb1][i % 3], { emissive: 0x200808 }), -0.22 + i * 0.11, 0.66, -0.05));
      const t = panelTex([['URITROTTOIR', 54], ['Ville de Lille', 30]], '#2f5a3a', '#f4efe2');
      g.add(mesh(new THREE.PlaneGeometry(0.5, 0.25), new THREE.MeshStandardMaterial({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.15 }), 0, 0.2, 0.281));
      g.position.copy(at).setY(0); faceStreet(g, at);
      return finish('uritrottoir', g);
    },
    // Banderole « LE SOMMEIL EST UN DROIT » accrochée à un balcon ou une fenêtre (texte en français)
    banner(at, o) {
      const g = new THREE.Group();
      const len = o.length ?? 2.6;
      const cloth = new THREE.PlaneGeometry(len, 0.55, 12, 1);
      const pos = cloth.attributes.position;
      for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin((pos.getX(i) / len) * Math.PI * 3) * 0.03); // drap qui ondule
      cloth.computeVertexNormals();
      const t = bannerTex(o.text ?? 'LE SOMMEIL EST UN DROIT');
      g.add(mesh(cloth, new THREE.MeshStandardMaterial({ map: t, side: THREE.DoubleSide, roughness: 0.95, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.12 })));
      for (const x of [-len / 2, len / 2]) g.add(mesh(C(0.008, 0.008, 0.3, 4), M(0x8a7a5a), x, 0.38, 0));
      g.position.copy(at); faceStreet(g, at);
      g.position.x += at.x < 0 ? 0.06 : -0.06;
      return finish('banner', g, (dt, t2) => { g.children[0].rotation.x = Math.sin(t2 * 1.3) * 0.04; });
    },
    // Pétition : petite table pliante, porte-bloc, stylo, panneau
    petition(at) {
      const g = new THREE.Group();
      g.add(mesh(B(0.8, 0.03, 0.5), M(0xd8cdb4), 0, 0.72, 0));
      for (const x of [-0.35, 0.35]) g.add(mesh(B(0.03, 0.72, 0.45), M(0x6b6b6b), x, 0.36, 0));
      g.add(mesh(B(0.24, 0.015, 0.32), M(0x8a5a35), -0.1, 0.745, 0), mesh(B(0.2, 0.012, 0.26), M(0xf6f2ea), -0.1, 0.755, 0));
      g.add(mesh(C(0.006, 0.006, 0.14, 5), M(0x2b4d7a), 0.12, 0.75, 0.05, 0, 0, Math.PI / 2));
      const t = panelTex([['PÉTITION', 60], ['pour des nuits calmes', 28], ['Signez ici', 28]], '#f4efe2', '#2b4d7a');
      g.add(mesh(new THREE.PlaneGeometry(0.6, 0.3), new THREE.MeshStandardMaterial({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.2 }), 0, 0.55, 0.26));
      g.position.copy(at).setY(0); faceStreet(g, at);
      return finish('petition', g);
    },
    // Table de la police : deux cafés, un waterzooi fumant, deux chaises
    'police-coffee': (at, o) => {
      const g = new THREE.Group();
      g.add(mesh(C(0.4, 0.4, 0.04, 14), M(0xe8e4dc), 0, 0.74, 0), mesh(C(0.035, 0.035, 0.72, 6), M(0x2b2b2e), 0, 0.37, 0), mesh(C(0.22, 0.22, 0.03, 10), M(0x2b2b2e), 0, 0.015, 0));
      for (const [x, z] of [[0.15, 0.1], [-0.15, -0.05]]) {
        g.add(mesh(C(0.035, 0.03, 0.06, 8), M(0xf6f2ea), x, 0.79, z), mesh(C(0.06, 0.06, 0.008, 10), M(0xf6f2ea), x, 0.765, z));
        g.add(mesh(C(0.03, 0.03, 0.005, 8), M(0x3a2010), x, 0.82, z));
      }
      g.add(mesh(new THREE.SphereGeometry(0.11, 10, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M(0xf6f2ea, { side: THREE.DoubleSide }), 0, 0.88, -0.15));
      g.add(mesh(C(0.1, 0.1, 0.01, 10), M(0xe8c070), 0, 0.85, -0.15)); // waterzooi
      g.position.copy(at).setY(0);
      g.rotation.y = o.rotation ?? 0;
      return finish('police-coffee', g);
    },
    // Chaînes et cadenas sur la pile de chaises de la terrasse (la nuit)
    'chain-lock': (at) => {
      const g = new THREE.Group();
      const metal = M(0x8a8f96, { metalness: 0.7, roughness: 0.35 });
      for (let i = 0; i < 9; i++) g.add(mesh(new THREE.TorusGeometry(0.035, 0.009, 4, 8), metal, 0, 0.6 + i * 0.055, 0, i % 2 ? Math.PI / 2 : 0, i % 2 ? 0 : Math.PI / 2));
      g.add(mesh(B(0.09, 0.08, 0.04), M(0xd4a62a, { metalness: 0.6, roughness: 0.3 }), 0, 0.55, 0), mesh(new THREE.TorusGeometry(0.03, 0.008, 4, 10, Math.PI), metal, 0, 0.6, 0));
      const glue = mesh(new THREE.SphereGeometry(0.03, 6, 4), M(0xf0f0e0, { roughness: 0.1, transparent: true, opacity: 0.8 }), 0, 0.53, 0.025);
      glue.visible = false;
      g.add(glue);
      g.position.copy(at).setY(0);
      return finish('chain-lock', g, null, { set: (s) => { if (s.glued !== undefined) glue.visible = s.glued; } });
    },
    // Escabeau (Ghislain nettoie le store)
    stool(at) {
      const g = new THREE.Group();
      g.add(mesh(B(0.42, 0.04, 0.3), M(0xbfc4ca, { metalness: 0.5 }), 0, 0.4, 0));
      for (const [x, z] of [[0.18, 0.12], [-0.18, 0.12], [0.18, -0.12], [-0.18, -0.12]]) g.add(mesh(B(0.025, 0.4, 0.025), M(0xbfc4ca, { metalness: 0.5 }), x, 0.2, z));
      g.position.copy(at).setY(0);
      return finish('stool', g);
    },
    // Panneau « OCCUPÉ » sur la porte de l'estaminet (laxatifs : la file d'attente des toilettes)
    occupied(at) {
      const g = new THREE.Group();
      const t = panelTex([['OCCUPÉ', 80], ['merci de patienter', 30]], '#f4efe2', '#b0232a');
      g.add(mesh(new THREE.PlaneGeometry(0.5, 0.25), new THREE.MeshStandardMaterial({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.3 })));
      g.position.copy(at).setY(1.8); faceStreet(g, at);
      g.position.x += at.x < 0 ? 0.12 : -0.12;
      return finish('occupied', g, (dt, t2) => { g.rotation.z = Math.sin(t2 * 3) * 0.05; });
    },
  };
  // 'line' via place() : de opts.from (défaut : sous le store) jusqu'à `at`
  builders.line = (at, o) => line(o.from ?? 'awningSocket', at, o);
  // points par défaut (si `at` est omis)
  const defaults = {
    gadget: 'pilouSill', cardboard: 'exhaust', uritrottoir: 'uritrottoirSpot', banner: 'balconyRail', petition: 'petitionSpot',
    'police-coffee': 'coffeeSpot', 'chain-lock': 'chainSpot', stool: 'awningCleanSpot', occupied: 'bernadetteDoor', line: 'pilouSill',
  };

  // Fil fin générique de A à B, avec un léger ballant (réutilisable pour tout : câble, laisse, corde à linge...)
  function line(a, b, { color = 0x222222, radius = 0.01, sag = 0.15 } = {}) {
    const p0 = resolve(a), p1 = resolve(b);
    const mid = p0.clone().lerp(p1, 0.5); mid.y -= sag;
    const curve = new THREE.QuadraticBezierCurve3(p0, mid, p1);
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 24, radius, 5, false), M(color)));
    return finish('line', g);
  }

  return {
    kinds: Object.keys(builders),
    place(kind, at, opts = {}) {
      const b = builders[kind];
      if (!b) throw new Error(`art.props.place : type inconnu « ${kind} » (${Object.keys(builders).join(', ')})`);
      return b(resolve(at, defaults[kind]), opts);
    },
    line,
    clear() { for (const h of [...live]) h.remove(); },
    get live() { return [...live]; },
    W,
  };
}
