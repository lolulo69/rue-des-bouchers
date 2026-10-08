// Météo : pluie (drache) ou bruine. art.weather.set(kind, intensity, wetness) — piloté par le metteur en scène
// depuis sim.weather(). Stries de pluie autour de la caméra (un seul draw call), pavés mouillés et brillants,
// petites éclaboussures au sol, passants sous leurs parapluies.
import * as THREE from 'three';
import { humanoid, setState } from './characters.js';

export function createWeather(scene, world, { onFrame, fx, particles = () => 1 }) {
  const N = 1800;
  const pos = new Float32Array(N * 6);
  const seeds = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { seeds[i * 3] = Math.random(); seeds[i * 3 + 1] = Math.random(); seeds[i * 3 + 2] = Math.random(); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  const mat = new THREE.LineBasicMaterial({ color: 0xbfd6ee, transparent: true, opacity: 0, depthWrite: false });
  const rain = new THREE.LineSegments(geo, mat);
  rain.frustumCulled = false;
  rain.visible = false;
  scene.add(rain);

  // Pavés : on garde les valeurs « sec » pour y revenir
  const ground = (world.groundMaterials ?? []).map((m) => ({ m, rough: m.roughness, metal: m.metalness, color: m.color.clone() }));
  const W = Math.abs(world.window.pos.x) - 0.3;

  // Passants sous la pluie, parapluie ouvert, d'un bout à l'autre de la rue
  const umbrellaColors = [0x2b4d7a, 0xc0262d, 0x1f1f24, 0xe9c46a, 0x5a9a52];
  const walkers = umbrellaColors.map((c, i) => {
    const p = humanoid({ held: 'umbrella', umbrella: c, talk: 0, pose: 'stand' });
    setState(p, { held: 'umbrella', anim: 'idle' });
    p.visible = false;
    p.userData.walk = { x: (i % 2 ? 1 : -1) * (0.4 + Math.random() * 0.8), dir: i % 2 ? 1 : -1, speed: 1.3 + Math.random() * 0.6, z: -40 + Math.random() * 80 };
    scene.add(p);
    return p;
  });

  const st = { kind: null, intensity: 0, wet: 0 };
  let splashAcc = 0;
  onFrame((dt, t, camera) => {
    const k = st.intensity;
    rain.visible = k > 0.01;
    if (rain.visible) {
      const drizzle = st.kind === 'drizzle';
      const len = drizzle ? 0.25 : 0.7, speed = drizzle ? 4 : 14;
      const cx = camera.position.x, cy = camera.position.y, cz = camera.position.z;
      const visibleN = Math.floor(N * (drizzle ? 0.45 : 1) * Math.min(1, k * 1.2) * particles());
      for (let i = 0; i < N; i++) {
        const o = i * 6;
        if (i >= visibleN) { pos[o + 1] = pos[o + 4] = -100; continue; }
        const sx = seeds[i * 3], sz = seeds[i * 3 + 1], sy = seeds[i * 3 + 2];
        const x = cx + (sx - 0.5) * 16, z = cz + (sz - 0.5) * 30;
        const y = ((((sy * 18 - t * speed) % 18) + 18) % 18) + cy - 6;
        pos[o] = x + 0.03; pos[o + 1] = y + len; pos[o + 2] = z;
        pos[o + 3] = x; pos[o + 4] = y; pos[o + 5] = z;
      }
      geo.attributes.position.needsUpdate = true;
      mat.opacity = (drizzle ? 0.25 : 0.45) * Math.min(1, k * 1.5);
      // petites éclaboussures sur les pavés autour de la caméra
      splashAcc += dt * 40 * k * (drizzle ? 0.3 : 1);
      while (splashAcc >= 1 && fx) {
        splashAcc -= 1;
        const x = Math.max(-W, Math.min(W, camera.position.x + (Math.random() - 0.5) * 8)), z = camera.position.z + (Math.random() - 0.5) * 16;
        fx.particles.smoke.spawn(new THREE.Vector3(x, 0.04, z), new THREE.Vector3(0, 0.25, 0), 0.25, 0.03, 0.08, 0.5, new THREE.Color(0xd8ecff));
      }
    }
    // pavés mouillés : plus sombres, plus lisses, reflets des lanternes
    for (const g of ground) {
      g.m.roughness = THREE.MathUtils.lerp(g.rough, 0.22, st.wet);
      g.m.metalness = THREE.MathUtils.lerp(g.metal, 0.35, st.wet);
      g.m.color.copy(g.color).multiplyScalar(1 - 0.3 * st.wet);
    }
    // passants à parapluie (seulement sous la drache)
    const showWalkers = st.kind === 'drache' && k > 0.3;
    for (const p of walkers) {
      p.visible = showWalkers;
      if (!showWalkers) continue;
      const w = p.userData.walk;
      w.z += w.dir * w.speed * dt;
      if (w.z > 44) w.z = -44; else if (w.z < -44) w.z = 44;
      p.position.set(w.x, 0, w.z);
      p.rotation.y = w.dir > 0 ? 0 : Math.PI;
      p.updateMatrixWorld();
    }
  });

  return {
    // kind : 'drache' | 'drizzle' | null · intensity 0..1 · wetness 0..1 (les pavés sèchent après la pluie)
    set(kind, intensity = 0, wetness = intensity) {
      st.kind = kind; st.intensity = kind ? intensity : 0; st.wet = Math.max(0, Math.min(1, wetness));
    },
    get state() { return { ...st }; },
  };
}
