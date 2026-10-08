// Effets : particules (eau, fumée, nuage puant, aboiements), flaques sur les pavés.
// Un seul petit système de particules (Points + shader : taille et opacité par particule), mis à jour par onFrame.
import * as THREE from 'three';
import { canvasTexture, puffTex } from './textures.js';

const VERT = `
attribute float aSize; attribute float aAlpha; attribute vec3 aColor;
varying float vAlpha; varying vec3 vColor;
uniform float uScale;
void main() {
  vAlpha = aAlpha; vColor = aColor;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * uScale / max(0.1, -mv.z);
  gl_Position = projectionMatrix * mv;
}`;
const FRAG = `
uniform sampler2D uMap; varying float vAlpha; varying vec3 vColor;
void main() {
  vec4 t = texture2D(uMap, gl_PointCoord);
  gl_FragColor = vec4(vColor * t.rgb, t.a * vAlpha);
  if (gl_FragColor.a < 0.01) discard;
  #include <colorspace_fragment>
}`;

const dropTex = () => canvasTexture(32, 32, (g, w, h) => {
  const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
});

// Système de particules générique (CPU, quelques centaines max)
class Particles {
  constructor(scene, { max = 400, map = puffTex(), additive = false, gravity = 0, drag = 0.5, depthTest = true } = {}) {
    this.max = max; this.n = 0; this.gravity = gravity; this.drag = drag;
    this.pos = new Float32Array(max * 3); this.vel = new Float32Array(max * 3);
    this.life = new Float32Array(max); this.age = new Float32Array(max);
    this.size0 = new Float32Array(max); this.size1 = new Float32Array(max); this.a0 = new Float32Array(max);
    this.onGround = null; // (x, z) appelé quand une particule touche le sol
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    this.aSize = new THREE.BufferAttribute(new Float32Array(max), 1).setUsage(THREE.DynamicDrawUsage);
    this.aAlpha = new THREE.BufferAttribute(new Float32Array(max), 1).setUsage(THREE.DynamicDrawUsage);
    this.aColor = new THREE.BufferAttribute(new Float32Array(max * 3), 3).setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('aSize', this.aSize); geo.setAttribute('aAlpha', this.aAlpha); geo.setAttribute('aColor', this.aColor);
    geo.setDrawRange(0, 0);
    this.mat = new THREE.ShaderMaterial({
      uniforms: { uMap: { value: map }, uScale: { value: 400 } }, vertexShader: VERT, fragmentShader: FRAG,
      transparent: true, depthWrite: false, depthTest, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    this.points = new THREE.Points(geo, this.mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 5;
    scene.add(this.points);
  }
  spawn(p, v, life, s0, s1, alpha, color) {
    if (this.n >= this.max) return;
    const i = this.n++;
    this.pos.set([p.x, p.y, p.z], i * 3); this.vel.set([v.x, v.y, v.z], i * 3);
    this.life[i] = life; this.age[i] = 0; this.size0[i] = s0; this.size1[i] = s1; this.a0[i] = alpha;
    color.toArray(this.aColor.array, i * 3);
  }
  update(dt, camera, renderer) {
    if (renderer && camera.isPerspectiveCamera) this.mat.uniforms.uScale.value = renderer.domElement.height / (2 * Math.tan((camera.fov * Math.PI) / 360));
    const P = this.pos, V = this.vel, S = this.aSize.array, A = this.aAlpha.array, C = this.aColor.array;
    const damp = Math.exp(-this.drag * dt);
    for (let i = 0; i < this.n; i++) {
      this.age[i] += dt;
      if (this.age[i] >= this.life[i]) { // on remplace par la dernière
        const j = --this.n;
        if (i !== j) {
          P.copyWithin(i * 3, j * 3, j * 3 + 3); V.copyWithin(i * 3, j * 3, j * 3 + 3); C.copyWithin(i * 3, j * 3, j * 3 + 3);
          this.life[i] = this.life[j]; this.age[i] = this.age[j]; this.size0[i] = this.size0[j]; this.size1[i] = this.size1[j]; this.a0[i] = this.a0[j];
          i--;
        }
        continue;
      }
      V[i * 3 + 1] -= this.gravity * dt;
      V[i * 3] *= damp; V[i * 3 + 1] *= this.gravity ? 1 : damp; V[i * 3 + 2] *= damp;
      P[i * 3] += V[i * 3] * dt; P[i * 3 + 1] += V[i * 3 + 1] * dt; P[i * 3 + 2] += V[i * 3 + 2] * dt;
      if (this.gravity && P[i * 3 + 1] < 0.02) {
        this.onGround?.(P[i * 3], P[i * 3 + 2]);
        this.life[i] = 0;
      }
      const k = this.age[i] / this.life[i];
      S[i] = this.size0[i] + (this.size1[i] - this.size0[i]) * k;
      A[i] = this.a0[i] * Math.min(1, k * 8) * (1 - k * k);
    }
    this.points.geometry.setDrawRange(0, this.n);
    for (const a of [this.points.geometry.attributes.position, this.aSize, this.aAlpha, this.aColor]) a.needsUpdate = true;
  }
}

// Flaque : disque sombre et brillant au sol, qui sèche (s'estompe) en `seconds`
const wetTex = () => canvasTexture(128, 128, (g, w, h) => {
  const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  gr.addColorStop(0, 'rgba(255,255,255,0.95)'); gr.addColorStop(0.7, 'rgba(255,255,255,0.7)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.beginPath();
  for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.3) { const r = w / 2 * (0.75 + 0.25 * Math.sin(a * 3 + 1) * Math.cos(a * 2)); g.lineTo(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r); }
  g.fill();
});

const wavyTex = () => canvasTexture(64, 64, (g, w, h) => {
  g.strokeStyle = 'rgba(255,255,255,0.95)'; g.lineWidth = 5; g.lineCap = 'round';
  for (const x of [18, 32, 46]) { g.beginPath(); for (let y = 54; y > 10; y -= 2) g.lineTo(x + Math.sin(y * 0.25 + x) * 5, y); g.stroke(); }
});

export function createFx(scene, world, { onFrame, audio, react }) {
  const drops = new Particles(scene, { max: 500, map: dropTex(), gravity: 9.8, drag: 0.2 });
  const smoke = new Particles(scene, { max: 500, map: puffTex(), drag: 0.6 });
  const lines = new Particles(scene, { max: 80, map: wavyTex(), drag: 1.5 });
  const puddles = [];
  const wetMap = wetTex();
  const emitters = new Set();
  const v = new THREE.Vector3(), p = new THREE.Vector3(), c = new THREE.Color();

  function puddle(x, z, r = 1.2, seconds = 90) {
    if (typeof x === 'object' && x) { const v = toV(x); x = v.x; z = v.z; } // puddle(pos) accepté aussi
    const m = new THREE.MeshStandardMaterial({ color: 0x0a0d14, roughness: 0.08, metalness: 0.6, transparent: true, opacity: 0.6, alphaMap: wetMap, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
    const mesh = new THREE.Mesh(new THREE.CircleGeometry(r, 20), m);
    mesh.rotation.x = -Math.PI / 2; mesh.rotation.z = Math.random() * 6;
    mesh.position.set(x, 0.012, z);
    scene.add(mesh);
    puddles.push({ mesh, t: 0, seconds });
    return mesh;
  }

  onFrame((dt, t, camera, renderer) => {
    for (const e of emitters) {
      e.acc += dt * e.rate;
      e.t += dt;
      while (e.acc >= 1) { e.acc -= 1; e.emit(); }
      if (e.duration && e.t > e.duration) emitters.delete(e);
    }
    drops.update(dt, camera, renderer); smoke.update(dt, camera, renderer); lines.update(dt, camera, renderer);
    for (let i = puddles.length - 1; i >= 0; i--) {
      const pd = puddles[i];
      pd.t += dt;
      pd.mesh.material.opacity = 0.6 * Math.max(0, 1 - pd.t / pd.seconds);
      if (pd.t >= pd.seconds) { scene.remove(pd.mesh); pd.mesh.geometry.dispose(); pd.mesh.material.dispose(); puddles.splice(i, 1); }
    }
  });

  const emitter = (rate, emit, duration = 0) => {
    const e = { rate, emit, duration, acc: 0, t: 0 };
    emitters.add(e);
    return { stop: () => emitters.delete(e), set rate(r) { e.rate = r; } };
  };
  const toV = (q) => (q?.isVector3 ? q : new THREE.Vector3(q.x, q.y ?? 0, q.z));

  // Seau d'eau : gerbe qui tombe de la fenêtre, éclaboussures et pavés mouillés
  let splashHits = 0;
  drops.onGround = (x, z) => {
    if (splashHits++ % 3 === 0) for (let k = 0; k < 2; k++) smoke.spawn(p.set(x, 0.05, z), v.set((Math.random() - 0.5) * 1.5, 0.6 + Math.random(), (Math.random() - 0.5) * 1.5), 0.35, 0.06, 0.14, 0.7, c.set(0xbfe3ff));
  };
  function splash(from = world.window.pos.clone().setX(world.window.pos.x + 0.3), { towardX = null, radius = 1.6, wetSeconds = 90 } = {}) {
    const o = toV(from);
    const tx = towardX ?? (o.x < 0 ? 1.2 : -1.2);
    for (let i = 0; i < 260; i++) {
      const s = 0.4 + Math.random();
      drops.spawn(p.set(o.x + (Math.random() - 0.5) * 0.3, o.y + Math.random() * 0.2, o.z + (Math.random() - 0.5) * 0.3),
        v.set(tx * s + (Math.random() - 0.5) * 1.2, 0.6 + Math.random() * 1.2, (Math.random() - 0.5) * 2.2), 3, 0.08 + Math.random() * 0.08, 0.05, 0.85, c.set(0xd8efff));
    }
    const fallT = Math.sqrt((2 * o.y) / 9.8);
    const gx = o.x + tx * 0.9 * fallT, gz = o.z;
    setTimeout(() => {
      puddle(gx, gz, radius, wetSeconds);
      puddle(gx + (Math.random() - 0.5) * 1.5, gz + (Math.random() - 0.5) * 2, radius * 0.55, wetSeconds * 0.7);
      react?.(new THREE.Vector3(gx, 0, gz), radius + 1.2, 'surprised', 4);
    }, fallT * 1000);
    audio?.play('splash', { pos: new THREE.Vector3(gx, 1, gz), delay: fallT * 0.9 });
    return { ground: new THREE.Vector3(gx, 0, gz) };
  }

  // Fumée générique (continue) : renvoie { stop() }
  function smokeAt(at, { rate = 14, life = 4, color = 0x8a8a8a, rise = 0.6, spread = 0.25, size = [0.4, 1.6], alpha = 0.55, duration = 30, dir = null } = {}) {
    const o = toV(at).clone(), col = new THREE.Color(color), d = dir ? toV(dir) : null;
    return emitter(rate, () => smoke.spawn(p.set(o.x + (Math.random() - 0.5) * spread, o.y, o.z + (Math.random() - 0.5) * spread),
      v.set((d?.x ?? 0) + (Math.random() - 0.5) * 0.3, rise + (d?.y ?? 0) + Math.random() * 0.2, (d?.z ?? 0) + (Math.random() - 0.5) * 0.3), life * (0.7 + Math.random() * 0.6), size[0], size[1], alpha, col), duration);
  }

  // Boule puante : nuage vert-jaune qui stagne + lignes ondulées, les clients autour font la grimace
  function stink(at = world.anchors.bernadetteDoor.clone().setX(world.anchors.bernadetteDoor.x + 1.5), { seconds = 25, radius = 3 } = {}) {
    const o = toV(at);
    const a = smokeAt(o.clone().setY(0.3), { rate: 10, life: 6, color: 0x9fbf3a, rise: 0.12, spread: radius, size: [0.8, 2.6], alpha: 0.35, duration: seconds });
    const b = emitter(3, () => lines.spawn(p.set(o.x + (Math.random() - 0.5) * radius * 1.5, 0.8 + Math.random(), o.z + (Math.random() - 0.5) * radius * 1.5), v.set(0, 0.35, 0), 2.2, 0.35, 0.5, 0.9, c.set(0xc8e05a)), seconds);
    react?.(o, radius + 1, 'sick', seconds * 0.8, 'fan');
    audio?.play('pfff', { pos: o });
    return { stop() { a.stop(); b.stop(); } };
  }

  // Hotte bouchée au carton : la vapeur s'arrête, la fumée ressort par la porte et les fenêtres de la cuisine
  let blocked = null;
  function exhaustBlocked(on = true, { door = world.anchors.bernadetteDoor } = {}) {
    if (on === false) { blocked?.forEach((e) => e.stop()); blocked = null; world.steam.blocked = false; return; }
    if (blocked) return;
    world.steam.blocked = true;
    const d = door.clone();
    const out = d.x < 0 ? 1 : -1;
    blocked = [
      smokeAt(d.clone().setY(2.2), { duration: 0, rate: 16, life: 5, color: 0x7a7a7e, rise: 0.35, spread: 0.6, size: [0.5, 2.2], alpha: 0.6, dir: { x: out * 0.6, y: 0, z: 0 } }),
      smokeAt(d.clone().setY(2.6).setZ(d.z + 2.5), { duration: 0, rate: 8, life: 5, color: 0x8a8a8e, rise: 0.4, spread: 1.4, size: [0.4, 1.8], alpha: 0.45, dir: { x: out * 0.4, y: 0, z: 0 } }),
      smokeAt(world.exhaust.clone(), { duration: 0, rate: 2, life: 2, color: 0x9a9a9a, rise: 0.2, spread: 0.2, size: [0.2, 0.5], alpha: 0.4 }), // fuite autour du carton
    ];
    react?.(d, 5, 'sick', 20, 'fan');
  }

  // « Ouaf » : petites bouffées blanches devant le museau
  function barkPuff(at) {
    const o = toV(at);
    for (let i = 0; i < 4; i++) smoke.spawn(p.set(o.x, o.y, o.z), v.set((Math.random() - 0.5) * 0.6, 0.4 + Math.random() * 0.3, (Math.random() - 0.5) * 0.6), 0.6, 0.1, 0.35, 0.8, c.set(0xffffff));
  }

  return { splash, smoke: smokeAt, stink, exhaustBlocked, puddle, barkPuff, particles: { drops, smoke, lines } };
}
