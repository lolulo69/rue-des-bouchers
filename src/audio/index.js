// Ambiance sonore procédurale (WebAudio, aucun fichier) : brouhaha des terrasses proportionnel au nombre de
// clients, raclement des chaises métalliques sur les pavés quand une table rentre (ou ressort), ronronnement de
// la hotte (plus fort chez Pilou), cloche lointaine à 22:00. Démarre au premier geste (règle des navigateurs).
// Touche M : couper / remettre le son.
import * as THREE from 'three';

const BELL_MINUTE = 22 * 60;

export function createAudio({ tables, exhaust, steam, apt, getMinutes }) {
  let ctx = null, master = null, muted = false;
  let crowd = null, hum = null, bellBus = null, sfx = null, noise = null;
  // Une table est "dehors" tant que son groupe est visible (le gameplay le cache quand elle rentre)
  const isOut = (t) => t.group.visible && t.out !== false;
  const prevOut = new Map(tables.map((t) => [t, isOut(t)]));
  let lastMin = null, chatterT = 0;
  const tmp = new THREE.Vector3(), right = new THREE.Vector3();

  // --- Toast "son coupé" ---
  const toast = document.createElement('div');
  Object.assign(toast.style, { position: 'fixed', right: '16px', bottom: '16px', padding: '6px 12px', borderRadius: '8px', background: 'rgba(10,12,20,.75)', color: '#f6e7c1', font: '14px system-ui, sans-serif', pointerEvents: 'none', opacity: '0', transition: 'opacity .3s', zIndex: 50 });
  document.body.appendChild(toast);
  let toastTimer;
  const say = (txt) => { toast.textContent = txt; toast.style.opacity = '1'; clearTimeout(toastTimer); toastTimer = setTimeout(() => { toast.style.opacity = '0'; }, 1600); };

  function start() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.9;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4;
    master.connect(comp).connect(ctx.destination);
    // Bruit blanc partagé (4 s, en boucle)
    noise = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    sfx = ctx.createGain(); sfx.connect(master);
    crowd = makeCrowd();
    hum = makeHum();
    bellBus = makeReverbBus(4.5, 0.55);
  }
  for (const ev of ['pointerdown', 'keydown']) addEventListener(ev, start, { capture: true });
  addEventListener('keydown', (e) => {
    if (e.code !== 'KeyM' || e.repeat) return;
    muted = !muted;
    if (master) master.gain.setTargetAtTime(muted ? 0 : 0.9, ctx.currentTime, 0.05);
    say(muted ? '🔇 Son coupé (M)' : '🔊 Son (M)');
  });
  document.addEventListener('visibilitychange', () => { if (!ctx) return; document.hidden ? ctx.suspend() : ctx.resume(); });

  const loopNoise = () => {
    const s = ctx.createBufferSource();
    s.buffer = noise; s.loop = true;
    s.start(0, Math.random() * 3.5);
    return s;
  };

  // --- Brouhaha : plusieurs "voix" de bruit filtré en formants, modulées au rythme des syllabes ---
  function makeCrowd() {
    const out = ctx.createGain(); out.gain.value = 0;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200;
    const pan = ctx.createStereoPanner();
    out.connect(lp).connect(pan).connect(master);
    const voices = [];
    for (let i = 0; i < 6; i++) {
      const src = loopNoise();
      const f1 = ctx.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 350 + Math.random() * 500; f1.Q.value = 3;
      const f2 = ctx.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 1200 + Math.random() * 900; f2.Q.value = 5;
      const g = ctx.createGain(); g.gain.value = 0;
      const mix = ctx.createGain(); mix.gain.value = 0.5;
      src.connect(f1).connect(g); src.connect(f2).connect(mix).connect(g);
      g.connect(out);
      voices.push({ g, f1, f2, rate: 3 + Math.random() * 3, ph: Math.random() * 10, base: 0.5 + Math.random() * 0.5 });
    }
    // un fond plus grave et continu
    const bed = loopNoise();
    const bf = ctx.createBiquadFilter(); bf.type = 'bandpass'; bf.frequency.value = 450; bf.Q.value = 0.7;
    const bg = ctx.createGain(); bg.gain.value = 0.25;
    bed.connect(bf).connect(bg).connect(out);
    return { out, lp, pan, voices };
  }

  // --- La hotte : moteur 50 Hz + souffle ---
  function makeHum() {
    const out = ctx.createGain(); out.gain.value = 0;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
    const pan = ctx.createStereoPanner();
    out.connect(lp).connect(pan).connect(master);
    for (const [f, a] of [[50, 0.35], [100, 0.25], [150, 0.12], [300, 0.05]]) {
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f * (1 + (Math.random() - 0.5) * 0.004);
      const g = ctx.createGain(); g.gain.value = a * 0.25;
      o.connect(g).connect(out); o.start();
    }
    const src = loopNoise();
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 650; bp.Q.value = 0.8;
    const g = ctx.createGain(); g.gain.value = 0.35;
    // battement des pales
    const lfo = ctx.createOscillator(); lfo.frequency.value = 7.5;
    const lg = ctx.createGain(); lg.gain.value = 0.12;
    lfo.connect(lg).connect(g.gain); lfo.start();
    src.connect(bp).connect(g).connect(out);
    return { out, lp, pan };
  }

  function makeReverbBus(seconds, wet) {
    const len = Math.floor(ctx.sampleRate * seconds);
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
    }
    const conv = ctx.createConvolver(); conv.buffer = ir;
    const input = ctx.createGain();
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200;
    const dry = ctx.createGain(); dry.gain.value = 1 - wet;
    const w = ctx.createGain(); w.gain.value = wet;
    input.connect(lp);
    lp.connect(dry).connect(master);
    lp.connect(conv).connect(w).connect(master);
    return { input, lp };
  }

  // --- Cloche (partiels inharmoniques d'une cloche d'église) ---
  function bell(when, inApt) {
    const f0 = 196;
    const out = ctx.createGain(); out.gain.value = inApt ? 0.45 : 0.6;
    out.connect(bellBus.input);
    for (const [r, a, dec] of [[0.5, 0.5, 7], [1, 0.8, 5], [1.183, 0.5, 3.5], [1.506, 0.35, 3], [2, 0.4, 2.5], [2.514, 0.25, 1.8], [2.662, 0.2, 1.6], [3.011, 0.15, 1.3], [4.166, 0.1, 0.9]]) {
      const o = ctx.createOscillator(); o.frequency.value = f0 * r;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(a * 0.18, when + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, when + dec);
      o.connect(g).connect(out);
      o.start(when); o.stop(when + dec + 0.1);
    }
  }
  function ringBells(strokes, inApt) {
    const t0 = ctx.currentTime + 0.1;
    for (let i = 0; i < strokes; i++) bell(t0 + i * 2.4, inApt);
  }

  // --- Chaises métalliques raclées sur les pavés : bruit résonant haché (stick-slip) ---
  function scrape(when, gain, panV) {
    const dur = 0.35 + Math.random() * 0.5;
    const src = ctx.createBufferSource(); src.buffer = noise;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 6;
    const f = 900 + Math.random() * 1500;
    bp.frequency.setValueAtTime(f, when); bp.frequency.linearRampToValueAtTime(f * (0.8 + Math.random() * 0.5), when + dur);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, when);
    env.gain.linearRampToValueAtTime(gain, when + 0.03);
    env.gain.setValueAtTime(gain, when + dur * 0.7);
    env.gain.linearRampToValueAtTime(0, when + dur);
    // cliquetis des pieds sur les joints des pavés
    const am = ctx.createGain(); am.gain.value = 0.5;
    const lfo = ctx.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 18 + Math.random() * 30;
    const lg = ctx.createGain(); lg.gain.value = 0.5;
    lfo.connect(lg).connect(am.gain);
    const p = ctx.createStereoPanner(); p.pan.value = panV;
    src.connect(bp).connect(am).connect(env).connect(p).connect(sfx);
    src.start(when, Math.random() * 3); src.stop(when + dur + 0.05);
    lfo.start(when); lfo.stop(when + dur + 0.05);
    // "clonk" métallique quand on empile
    const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = 380 + Math.random() * 500;
    const og = ctx.createGain();
    og.gain.setValueAtTime(0, when + dur); og.gain.linearRampToValueAtTime(gain * 0.5, when + dur + 0.005); og.gain.exponentialRampToValueAtTime(0.0001, when + dur + 0.25);
    o.connect(og).connect(p); o.start(when + dur); o.stop(when + dur + 0.3);
  }

  // Petits bruits de terrasse : verres qui trinquent, éclats de rire
  function clink(when, gain, panV) {
    const p = ctx.createStereoPanner(); p.pan.value = panV; p.connect(sfx);
    for (const f of [2600 + Math.random() * 1500, 3900 + Math.random() * 1200]) {
      const o = ctx.createOscillator(); o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(gain, when); g.gain.exponentialRampToValueAtTime(0.0001, when + 0.25);
      o.connect(g).connect(p); o.start(when); o.stop(when + 0.3);
    }
  }
  function laugh(when, gain, panV) {
    const p = ctx.createStereoPanner(); p.pan.value = panV; p.connect(sfx);
    const o = ctx.createOscillator(); o.type = 'sawtooth';
    const f = 160 + Math.random() * 200;
    const n = 3 + Math.floor(Math.random() * 4);
    o.frequency.setValueAtTime(f * 1.15, when); o.frequency.linearRampToValueAtTime(f * 0.9, when + n * 0.16);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 2;
    const g = ctx.createGain(); g.gain.value = 0;
    for (let i = 0; i < n; i++) {
      const t = when + i * 0.16;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + 0.03); g.gain.linearRampToValueAtTime(0, t + 0.12);
    }
    o.connect(bp).connect(g).connect(p); o.start(when); o.stop(when + n * 0.16 + 0.1);
  }

  function relPan(pos, camera) {
    right.set(1, 0, 0).applyQuaternion(camera.quaternion);
    tmp.copy(pos).sub(camera.position);
    const d = Math.max(1, tmp.length());
    return { d, pan: Math.max(-1, Math.min(1, tmp.dot(right) / d)) };
  }

  return {
    get muted() { return muted; },
    get state() { return ctx ? ctx.state : 'off'; },
    update(dt, camera) {
      if (!ctx || ctx.state !== 'running') return;
      const now = ctx.currentTime;
      const inApt = camera.position.x < apt.x1 + 0.3 && camera.position.y > apt.floor;
      // Terrasses : niveau ~ somme des têtes / distance², panoramique pondéré
      let L = 0, P = 0, heads = 0;
      for (const t of tables) {
        const out = isOut(t);
        if (out) {
          const n = t.people.filter((p) => p.visible).length;
          heads += n;
          const { d, pan } = relPan(t.group.position, camera);
          const w = n / (1 + d * d * 0.04);
          L += w; P += w * pan;
        }
        const was = prevOut.get(t);
        if (was !== out) { // rangement (ou retour en douce) de la table : les chaises raclent
          prevOut.set(t, out);
          const { d, pan } = relPan(t.group.position, camera);
          const g = Math.min(0.5, 2.2 / (1 + d * 0.35)) * (inApt ? 0.6 : 1);
          const chairs = Math.min(8, t.people.length);
          for (let i = 0; i < chairs; i++) scrape(now + i * 0.22 + Math.random() * 0.15, g * (0.6 + Math.random() * 0.4), pan);
        }
      }
      const level = Math.min(1, Math.sqrt(L) / 6) * (inApt ? 0.55 : 1);
      crowd.out.gain.setTargetAtTime(level * 0.55, now, 0.4);
      crowd.pan.pan.setTargetAtTime(L ? Math.max(-0.8, Math.min(0.8, P / L)) : 0, now, 0.5);
      crowd.lp.frequency.setTargetAtTime(inApt ? 1100 : 3200, now, 0.3);
      for (const v of crowd.voices) {
        v.ph += dt * v.rate;
        const syl = Math.max(0, Math.sin(v.ph * 6.28)) * (0.4 + 0.6 * Math.max(0, Math.sin(v.ph * 0.37 + v.base * 9)));
        v.g.gain.setTargetAtTime(syl * v.base * (0.4 + Math.min(1, heads / 40)), now, 0.03);
      }
      // Rires, verres qui trinquent : plus il y a de monde, plus c'est fréquent
      chatterT -= dt;
      if (chatterT <= 0 && heads > 0) {
        chatterT = 0.4 + Math.random() * 6 / Math.sqrt(heads);
        const outT = tables.filter(isOut);
        const t = outT[Math.floor(Math.random() * outT.length)];
        const { d, pan } = relPan(t.group.position, camera);
        const g = Math.min(0.12, 0.6 / (1 + d * 0.4)) * (inApt ? 0.5 : 1);
        Math.random() < 0.5 ? clink(now + 0.01, g * 0.5, pan) : laugh(now + 0.01, g, pan);
      }
      // Hotte : plus fort chez Pilou (la gaine passe juste sous sa fenêtre et la pièce résonne)
      const on = steam?.intensity ?? 1;
      const { d: dh, pan: ph } = relPan(exhaust, camera);
      const hl = on * Math.min(1, 3 / (1 + dh * 0.5)) * (inApt ? 1.5 : 0.8);
      hum.out.gain.setTargetAtTime(hl * 0.35, now, 0.3);
      hum.pan.pan.setTargetAtTime(inApt ? ph * 0.3 : ph, now, 0.3);
      hum.lp.frequency.setTargetAtTime(inApt ? 600 : 1000, now, 0.3);
      // Cloche de 22:00
      const min = getMinutes?.();
      if (typeof min === 'number') {
        if (lastMin !== null && lastMin < BELL_MINUTE && min >= BELL_MINUTE && min - lastMin < 30) ringBells(10, inApt);
        lastMin = min;
      }
    },
    bell: (n = 1) => ctx && ringBells(n, false), // pour tester : __rdb.world.audio.bell(3)
  };
}
