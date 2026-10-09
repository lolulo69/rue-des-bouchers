// Ambiance de la rue la nuit (WebAudio, tout synthétisé) — branchée par world.js (attach) et animée à chaque image
// de la nuit (update). Tout passe par `out` (le bus d'ambiance de la rue, coupé le jour et à l'écran titre).
//   • terrasses : PAS de brouhaha continu (§12e.5) — des bruits rares et discrets près de soi : une phrase en babil
//     tonal, un rire, des verres, des couverts ; chaises sur les pavés (une table qui rentre :
//     toutes les chaises raclent ; un convive qui s'en va : une chaise) ;
//   • pas : ceux de Pilou (pavés dans la rue, parquet / carrelage chez lui), des passants au loin ;
//   • la ville au loin (rumeur grave, une voiture de temps en temps), la cloche de 22:00, la pluie de la drache ;
//   • la hotte : seulement chez Pilou (loi dans mix.js › humMix), un souffle juste sous la gaine dans la rue ;
//   • sources positionnées (audio.emitter) pour les scènes de la rue et les twists : moteur, sono, accordéon,
//     guide qui parle, balayeuse, groupe électrogène pendant la coupure…
// Chez Pilou, la rue est étouffée (passe-bas) et plus basse ; penché à la fenêtre, on l'entend comme dehors.
import * as THREE from 'three';
import { humMix } from './mix.js';

const BELL_MINUTE = 22 * 60;
const STREET_ROOM = { living: [0.4, 1100], corridor: [0.16, 520], bathroom: [0.14, 480], bedroom: [0.12, 420], daughter: [0.1, 400] };

export function makeAmbience(ctx, { out, sfxOut, noise, makeReverbBus, music, play, duck }) {
  const now = () => ctx.currentTime;
  const ok = Number.isFinite;
  const setT = (param, v, tc = 0.1) => { if (ok(v)) param.setTargetAtTime(v, now(), tc); };
  const att = (d, ref) => 1 / (1 + (d / ref) ** 2);
  const tmp = new THREE.Vector3(), right = new THREE.Vector3(), V = (x, y, z) => new THREE.Vector3(x, y, z);
  let cam = null;
  let listenerRoom = null, exhaustOn = null, chatterT = 0, walkerT = 8, lastMin = null, stepAcc = 0, stepSide = 1, lastY = 0;
  const lastPos = new THREE.Vector3();
  const rel = (pos) => {
    if (!cam) return { d: 10, pan: 0 };
    right.set(1, 0, 0).applyQuaternion(cam.quaternion);
    tmp.copy(pos).sub(cam.position);
    const d = Math.max(0.5, tmp.length());
    return { d, pan: Math.max(-1, Math.min(1, tmp.dot(right) / d)) };
  };
  const loopNoise = (into) => { const s = ctx.createBufferSource(); s.buffer = noise; s.loop = true; s.start(0, Math.random() * 3.5); if (into) s.connect(into); return s; };
  const filt = (type, f, q = 1) => { const b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; };
  const gainN = (v = 0) => { const g = ctx.createGain(); g.gain.value = v; return g; };

  // ---------- chaînes : rue (étouffée chez Pilou) et hotte ----------
  const streetIn = gainN(1), streetLp = filt('lowpass', 8000, 0.5), streetG = gainN(1);
  streetIn.connect(streetLp).connect(streetG).connect(out);
  const bellBus = makeReverbBus(4.5, 0.55, out);

  // ---------- rumeur de la ville au loin ----------
  const cityG = gainN(0.03); // rumeur grave très basse (pas de souffle aigu)
  loopNoise(filt('lowpass', 190, 0.7)).connect(cityG);
  cityG.connect(streetIn);
  let carT = 6 + Math.random() * 10;
  function farCar(t) { // une voiture passe au bout de la rue : souffle qui monte, glisse d'un côté à l'autre, retombe
    const s = ctx.createBufferSource(); s.buffer = noise; const bp = filt('bandpass', 380, 1.2);
    bp.frequency.setValueAtTime(380, t); bp.frequency.linearRampToValueAtTime(900, t + 1.6); bp.frequency.linearRampToValueAtTime(420, t + 3.4);
    const g = gainN(0); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.05, t + 1.6); g.gain.linearRampToValueAtTime(0, t + 3.5);
    const p = ctx.createStereoPanner(); const side = Math.random() < 0.5 ? -1 : 1;
    p.pan.setValueAtTime(-0.8 * side, t); p.pan.linearRampToValueAtTime(0.8 * side, t + 3.4);
    s.connect(bp).connect(g).connect(p).connect(streetIn); s.start(t, Math.random() * 2); s.stop(t + 3.6);
  }

  // ---------- voix : « babil » tonal (pas de bruit filtré : ça sonnait comme la pluie, §12e.5) ----------
  // une courte phrase : quelques syllabes chantées (source glottale douce + deux formants de voyelle), contour de
  // hauteur montant puis descendant, filtrée, très bas. f0 ~ 110 (voix grave) à 230 (voix aiguë).
  const VOWELS = [[730, 1090], [270, 2290], [300, 870], [530, 1840], [570, 840], [440, 1020]];
  function babble(t, g, pan, { f0 = 110 + Math.random() * 120, n = 3 + Math.floor(Math.random() * 6), dest = streetIn, rate = 1 } = {}) {
    const p = ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); p.connect(dest);
    const lp = filt('lowpass', 2400, 0.4); lp.connect(p);
    const o = ctx.createOscillator(); o.type = 'sawtooth';
    const soft = filt('lowpass', 900, 0.5); // adoucit la scie : une voix, pas un buzzer
    const f1 = filt('bandpass', 600, 5), f2 = filt('bandpass', 1300, 7), m2 = gainN(0.45), e = gainN(0);
    o.connect(soft); soft.connect(f1).connect(e); soft.connect(f2).connect(m2).connect(e); e.connect(lp);
    let tt = t;
    for (let i = 0; i < n; i++) {
      const [a, b] = VOWELS[Math.floor(Math.random() * VOWELS.length)];
      const syl = (0.09 + Math.random() * 0.09) / rate, gap = (0.03 + Math.random() * 0.07) / rate;
      const k = i / Math.max(1, n - 1), contour = 1 + 0.12 * Math.sin(k * Math.PI) - (i === n - 1 ? 0.08 : 0);
      o.frequency.setTargetAtTime(f0 * contour * (1 + (Math.random() - 0.5) * 0.06), tt, 0.02);
      f1.frequency.setTargetAtTime(a, tt, 0.015); f2.frequency.setTargetAtTime(b, tt, 0.015);
      e.gain.setTargetAtTime(g * (0.7 + Math.random() * 0.3), tt, 0.018); e.gain.setTargetAtTime(0, tt + syl, 0.025);
      tt += syl + gap;
    }
    o.start(t); o.stop(tt + 0.2);
    return tt - t;
  }


  // ---------- petits bruits de terrasse ----------
  function clink(t, g, pan) {
    const p = ctx.createStereoPanner(); p.pan.value = pan; p.connect(streetIn);
    for (const f of [2600 + Math.random() * 1500, 3900 + Math.random() * 1200]) {
      const o = ctx.createOscillator(); o.frequency.value = f; const e = gainN(0);
      e.gain.setValueAtTime(g, t); e.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
      o.connect(e).connect(p); o.start(t); o.stop(t + 0.3);
    }
  }
  function cutlery(t, g, pan) { // fourchette / couteau sur l'assiette : deux ou trois « tic » métalliques
    const p = ctx.createStereoPanner(); p.pan.value = pan; p.connect(streetIn);
    const n = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      const ti = t + i * (0.09 + Math.random() * 0.12);
      const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = 4200 + Math.random() * 2400; const e = gainN(0);
      e.gain.setValueAtTime(g * 0.6, ti); e.gain.exponentialRampToValueAtTime(0.0001, ti + 0.06);
      o.connect(e).connect(p); o.start(ti); o.stop(ti + 0.08);
      const s = ctx.createBufferSource(); s.buffer = noise; const hp = filt('highpass', 3000); const e2 = gainN(0);
      e2.gain.setValueAtTime(g * 0.5, ti); e2.gain.exponentialRampToValueAtTime(0.0001, ti + 0.02);
      s.connect(hp).connect(e2).connect(p); s.start(ti, Math.random() * 3); s.stop(ti + 0.03);
    }
  }
  function laugh(t, g, pan) {
    const p = ctx.createStereoPanner(); p.pan.value = pan; p.connect(streetIn);
    const o = ctx.createOscillator(); o.type = 'sawtooth'; const f = 160 + Math.random() * 200, n = 3 + Math.floor(Math.random() * 4);
    o.frequency.setValueAtTime(f * 1.15, t); o.frequency.linearRampToValueAtTime(f * 0.9, t + n * 0.16);
    const bp = filt('bandpass', 900, 2), e = gainN(0);
    for (let i = 0; i < n; i++) { const ti = t + i * 0.16; e.gain.setValueAtTime(0, ti); e.gain.linearRampToValueAtTime(g, ti + 0.03); e.gain.linearRampToValueAtTime(0, ti + 0.12); }
    o.connect(bp).connect(e).connect(p); o.start(t); o.stop(t + n * 0.16 + 0.1);
  }
  // Chaise métallique raclée sur les pavés (stick-slip) + « clonk » quand on l'empile
  function scrape(t, g, pan, stack = true) {
    const dur = 0.35 + Math.random() * 0.5, f = 900 + Math.random() * 1500;
    const s = ctx.createBufferSource(); s.buffer = noise; const bp = filt('bandpass', f, 6);
    bp.frequency.setValueAtTime(f, t); bp.frequency.linearRampToValueAtTime(f * (0.8 + Math.random() * 0.5), t + dur);
    const e = gainN(0); e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(g, t + 0.03); e.gain.setValueAtTime(g, t + dur * 0.7); e.gain.linearRampToValueAtTime(0, t + dur);
    const am = gainN(0.5), lfo = ctx.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 18 + Math.random() * 30; const lg = gainN(0.5);
    lfo.connect(lg).connect(am.gain);
    const p = ctx.createStereoPanner(); p.pan.value = pan; p.connect(streetIn);
    s.connect(bp).connect(am).connect(e).connect(p); s.start(t, Math.random() * 3); s.stop(t + dur + 0.05); lfo.start(t); lfo.stop(t + dur + 0.05);
    if (!stack) return;
    const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = 380 + Math.random() * 500; const og = gainN(0);
    og.gain.setValueAtTime(0, t + dur); og.gain.linearRampToValueAtTime(g * 0.5, t + dur + 0.005); og.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.25);
    o.connect(og).connect(p); o.start(t + dur); o.stop(t + dur + 0.3);
  }
  // Un pas : pavés (talon + pierre), parquet (sourd), carrelage (clic)
  function step(t, g, pan, floor, dest) {
    const p = ctx.createStereoPanner(); p.pan.value = pan; p.connect(dest);
    const o = ctx.createOscillator(); const e = gainN(0);
    const [f0, f1] = floor === 'wood' ? [95, 55] : floor === 'tile' ? [160, 90] : [120, 60];
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + 0.08);
    e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(g, t + 0.004); e.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
    o.connect(e).connect(p); o.start(t); o.stop(t + 0.12);
    const s = ctx.createBufferSource(); s.buffer = noise;
    const bp = floor === 'wood' ? filt('lowpass', 700) : filt('bandpass', floor === 'tile' ? 3200 : 2200, 2); const e2 = gainN(0);
    e2.gain.setValueAtTime(g * (floor === 'wood' ? 0.35 : 0.5), t); e2.gain.exponentialRampToValueAtTime(0.0001, t + (floor === 'wood' ? 0.06 : 0.035));
    s.connect(bp).connect(e2).connect(p); s.start(t, Math.random() * 3); s.stop(t + 0.08);
  }

  // ---------- la hotte (moteur 50 Hz + souffle) ----------
  const humLp = filt('lowpass', 600, 0.7), humPan = ctx.createStereoPanner(), motorG = gainN(0), hissG = gainN(0);
  humLp.connect(humPan).connect(out);
  for (const [f, a] of [[50, 0.35], [100, 0.25], [150, 0.12], [300, 0.05]]) {
    const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f * (1 + (Math.random() - 0.5) * 0.004);
    const g = gainN(a * 0.25); o.connect(g).connect(motorG); o.start();
  }
  motorG.connect(humLp);
  { const g = gainN(0.35), lfo = ctx.createOscillator(), lg = gainN(0.12); lfo.frequency.value = 7.5; lfo.connect(lg).connect(g.gain); lfo.start();
    loopNoise(filt('bandpass', 650, 0.8)).connect(g).connect(hissG); hissG.connect(humLp); }

  // ---------- pluie (souffle large + crépitement), étouffée chez Pilou par la chaîne de la rue ----------
  const rainG = gainN(0);
  { const am = gainN(0.85), lfo = ctx.createOscillator(), lg = gainN(0.15); lfo.type = 'square'; lfo.frequency.value = 23; lfo.connect(lg).connect(am.gain); lfo.start();
    loopNoise(filt('bandpass', 2800, 0.4)).connect(am).connect(filt('lowpass', 6000)).connect(rainG).connect(streetIn); }

  // ---------- cloche de Saint-Maurice ----------
  function bell(t, g) {
    const o0 = gainN(g); o0.connect(bellBus.input);
    for (const [r, a, dec] of [[0.5, 0.5, 7], [1, 0.8, 5], [1.183, 0.5, 3.5], [1.506, 0.35, 3], [2, 0.4, 2.5], [2.514, 0.25, 1.8], [2.662, 0.2, 1.6], [3.011, 0.15, 1.3], [4.166, 0.1, 0.9]]) {
      const o = ctx.createOscillator(); o.frequency.value = 196 * r; const e = gainN(0);
      e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(a * 0.18, t + 0.008); e.gain.exponentialRampToValueAtTime(0.0001, t + dec);
      o.connect(e).connect(o0); o.start(t); o.stop(t + dec + 0.1);
    }
  }
  const ringBells = (n, g) => { const t0 = now() + 0.1; for (let i = 0; i < n; i++) bell(t0 + i * 2.4, g); };

  // ---------- émetteurs positionnés (sons des twists) ----------
  const emitters = new Set();
  function emitter(pos, { gain = 1, ref = 4, life = Infinity } = {}) {
    const input = gainN(1), g = gainN(0), p = ctx.createStereoPanner();
    input.connect(g).connect(p).connect(streetIn);
    const e = {
      input, g, p, pos: V(pos.x, pos.y ?? 1.2, pos.z), gain, ref, life, srcs: [], ticks: [], ends: [],
      src(n) { e.srcs.push(n); return n; },
      stop() {
        if (!emitters.delete(e)) return;
        setT(g.gain, 0, 0.3);
        setTimeout(() => { for (const n of e.srcs) { try { n.stop(); } catch { /* déjà arrêté */ } } for (const f of e.ends) f(); g.disconnect(); }, 1500);
      },
    };
    emitters.add(e);
    return e;
  }
  const osc = (e, type, f, into, a = 1) => { const o = ctx.createOscillator(); o.type = type; o.frequency.value = f; const g = gainN(a); o.connect(g).connect(into); o.start(); return e.src(o); };
  const am = (e, into, rate, depth, type = 'sine') => { const g = gainN(1 - depth), lfo = ctx.createOscillator(), lg = gainN(depth); lfo.type = type; lfo.frequency.value = rate; lfo.connect(lg).connect(g.gain); lfo.start(); e.src(lfo); g.connect(into); return g; };
  // une voix qui parle sans s'arrêter (guide, commentateur, présentateur) : des phrases de babil tonal, des respirations
  function talker(e, { f0 = 150, rate = 1, gain = 0.5 } = {}) {
    let next = 0.2;
    e.ticks.push((dt) => { if ((next -= dt) > 0) return; next = babble(now() + 0.02, gain * 0.35, 0, { f0: f0 * (0.95 + Math.random() * 0.1), n: 4 + Math.floor(Math.random() * 8), dest: e.input, rate }) + 0.25 + Math.random() * 0.7; });
  }
  function engine(e, { f = 30, putter = 15, gain = 0.5, lp = 380 } = {}) { // moteur diesel / groupe électrogène au ralenti
    const l = filt('lowpass', lp, 0.8); const a = am(e, l, putter, 0.6, 'square');
    osc(e, 'sawtooth', f, a, 0.5 * gain); osc(e, 'sawtooth', f * 2.02, a, 0.25 * gain);
    e.src(loopNoise(filt('lowpass', 260))).connect(gainN(0.5 * gain)).connect(a);
    l.connect(e.input);
  }
  function every(e, [a, b], fn) { let t = a + Math.random() * (b - a); e.ticks.push((dt) => { if ((t -= dt) <= 0) { t = a + Math.random() * (b - a); fn(); } }); }

  // ---------- état de la rue (attach) ----------
  let S = null; // { tables, exhaust, steam, apt, roomAt, anchors, W, window, getMinutes }
  const isOut = (t) => t.group.visible && t.out !== false;
  const heads = (t) => t.people.reduce((n, p) => n + (p.visible ? 1 : 0), 0);
  let prevOut = new Map(), prevHeads = new Map();
  const restOf = (t) => t.rest?.id ?? t.restId;
  const restPos = (id) => {
    const ts = (S?.tables ?? []).filter((t) => restOf(t) === id);
    if (!ts.length) return V(0, 1.2, S?.window?.z ?? 0);
    const p = ts.reduce((a, t) => a.add(t.group.position), V(0, 0, 0)).multiplyScalar(1 / ts.length);
    return p.setY(1.2);
  };
  const zRange = () => { const zs = (S?.tables ?? []).map((t) => t.group.position.z); return zs.length ? [Math.min(...zs) - 4, Math.max(...zs) + 4] : [-30, 30]; };

  // ---------- sources positionnées réutilisables (scènes de la rue, twists) : audio.emitter(kind, pos, opts) ----------
  // Le metteur en scène (src/scene/stage.js, twists) déplace e.pos et appelle e.stop() ; le son suit tout seul.
  const KINDS = {
    engine: (e, o) => engine(e, { f: o.f ?? 30, putter: o.putter ?? 15, gain: 0.7, lp: o.lp ?? 380 }), // diesel / scooter au ralenti
    generator: (e) => engine(e, { f: 25, putter: 12.5, gain: 0.8, lp: 450 }),
    talker: (e, o) => talker(e, { f0: o.f0 ?? 160, rate: o.rate ?? 1, gain: o.voice ?? 0.6 }), // guide, commentateur, présentateur
    musette: (e) => { music.loop('musette', true, e.input); e.ends.push(() => music.loop('musette', false)); },
    speakers: (e, o) => { // une sono derrière des fenêtres : grosse caisse et basse étouffées
      const l = filt('lowpass', o.lp ?? 320, 0.7); l.connect(e.input);
      let next = now() + 0.2; const beat = 60 / (o.bpm ?? 118), bass = [55, 55, 65.4, 49];
      e.ticks.push(() => {
        if (next < now()) next = now() + 0.05;
        while (next < now() + 0.3) {
          const k = ctx.createOscillator(); k.frequency.setValueAtTime(120, next); k.frequency.exponentialRampToValueAtTime(48, next + 0.12);
          const g = gainN(0); g.gain.setValueAtTime(0.5, next); g.gain.exponentialRampToValueAtTime(0.0001, next + 0.2);
          k.connect(g).connect(l); k.start(next); k.stop(next + 0.22);
          const b = ctx.createOscillator(); b.type = 'sawtooth'; b.frequency.value = bass[Math.floor(next / beat) % 4];
          const bg = gainN(0); bg.gain.setValueAtTime(0, next + beat / 2); bg.gain.linearRampToValueAtTime(0.12, next + beat / 2 + 0.01); bg.gain.exponentialRampToValueAtTime(0.0001, next + beat * 0.95);
          b.connect(bg).connect(l); b.start(next + beat / 2); b.stop(next + beat);
          next += beat;
        }
      });
    },
    fans: (e) => { const a = am(e, e.input, 22, 0.3); e.src(loopNoise(filt('bandpass', 420, 0.8))).connect(gainN(0.25)).connect(a); },
    sweeper: (e) => { // balayeuse-laveuse : moteur, brosses, jets d'eau
      const l = filt('lowpass', 900); l.connect(e.input); osc(e, 'sawtooth', 92, l, 0.18); osc(e, 'sawtooth', 184, l, 0.08);
      const br = am(e, e.input, 7, 0.5); e.src(loopNoise(filt('bandpass', 3000, 0.7))).connect(gainN(0.3)).connect(br);
      e.src(loopNoise(filt('highpass', 5000))).connect(gainN(0.06)).connect(e.input);
    },
    hazard: (e) => { let tk = 0; e.ticks.push((dt) => { if ((tk -= dt) > 0) return; tk = 0.75; const t = now() + 0.01, o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = 2600; const g = gainN(0); g.gain.setValueAtTime(0.03, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.02); o.connect(g).connect(e.input); o.start(t); o.stop(t + 0.03); }); },
    ac: (e) => { const l = filt('lowpass', 300); l.connect(e.input); osc(e, 'sawtooth', 60, l, 0.05); e.src(loopNoise(filt('bandpass', 900, 0.6))).connect(gainN(0.12)).connect(e.input); },
  };
  function spawnEmitter(kind, pos, o = {}) {
    if (!KINDS[kind]) { console.warn(`audio.emitter : source inconnue « ${kind} »`); return null; }
    const e = emitter(pos, { gain: o.gain ?? 0.7, ref: o.ref ?? 5 });
    KINDS[kind](e, o);
    return e;
  }
  let power = false, generator = null;

  return {
    attach(o) {
      S = o; prevOut = new Map(o.tables.map((t) => [t, isOut(t)])); prevHeads = new Map(o.tables.map((t) => [t, heads(t)]));
    },
    get emitters() { return emitters.size; },
    get room() { return listenerRoom; },
    get hum() { return { motor: +motorG.gain.value.toFixed(3), hiss: +hissG.gain.value.toFixed(3), cutoff: Math.round(humLp.frequency.value) }; },
    rain(level) { setT(rainG.gain, Math.max(0, Math.min(1, level || 0)) * 0.4, 0.6); },
    // État fourni par le metteur en scène à chaque image : { exhaust (0..1.4) } (les sons des twists : audio.emitter / play)
    state(st = {}) { exhaustOn = ok(st.exhaust) ? st.exhaust : null; },
    // Coupure de courant : la hotte s'arrête, la rue baisse la voix, un groupe électrogène tourne près du Goulot
    setPower(on) {
      const cut = !on;
      if (cut === power) return;
      power = cut;
      if (cut) { generator = spawnEmitter('generator', restPos('goulot').add(V(0, -0.6, -2)), { gain: 0.45, ref: 5 }); duck(5); }
      else { generator?.stop(); generator = null; }
    },
    emitter: spawnEmitter,
    bell: (n = 1) => ringBells(n, 0.6),
    update(dt, camera) {
      cam = camera;
      if (!S) return;
      const t = now();
      // où est l'auditeur ? (chez Pilou, à la fenêtre, dans la rue)
      const room = S.roomAt?.(camera.position) ?? (camera.position.x < S.apt.x1 + 0.3 && camera.position.y > S.apt.floor ? 'living' : null);
      listenerRoom = room;
      const [sg, slp] = STREET_ROOM[room] ?? [1, 9000];
      setT(streetG.gain, sg * (power ? 0.75 : 1), 0.25); setT(streetLp.frequency, slp, 0.25);
      // terrasses : qui est dehors, à quelle distance (pour les petits bruits) ; chaises qui raclent
      const outT = [];
      let near = 0;
      for (const tb of S.tables) {
        const isout = isOut(tb), n = isout ? heads(tb) : 0;
        if (prevOut.get(tb) !== isout) { // la table rentre (ou ressort en douce) : toutes ses chaises raclent
          prevOut.set(tb, isout);
          const { d, pan } = rel(tb.group.position);
          const g = Math.min(0.5, 2.2 / (1 + d * 0.35));
          for (let i = 0, c = Math.min(8, tb.people.length); i < c; i++) scrape(t + i * 0.22 + Math.random() * 0.15, g * (0.6 + Math.random() * 0.4), pan);
        } else if (isout && prevHeads.get(tb) !== n && Math.random() < 0.7) { // quelqu'un se lève ou s'assoit
          const { d, pan } = rel(tb.group.position);
          scrape(t + Math.random() * 0.3, Math.min(0.25, 1.2 / (1 + d * 0.4)), pan, false);
        }
        prevHeads.set(tb, n);
        if (!n) continue;
        const { d, pan } = rel(tb.group.position);
        outT.push({ tb, n, d, pan, w: Math.sqrt(n) * att(d, 4) });
        near += n * att(d, 5);
      }
      // verres, couverts, rires : plus il y a de monde près de soi, plus c'est fréquent
      chatterT -= dt;
      if (chatterT <= 0 && outT.length) {
        // rare et discret : une phrase, un rire, un verre, des couverts — jamais un fond continu
        chatterT = 1.2 + Math.random() * 7 / Math.sqrt(near + 0.5);
        outT.sort((a, b) => b.w - a.w);
        const x = outT[Math.floor(Math.random() ** 2 * Math.min(outT.length, 6))];
        const g = Math.min(0.12, 0.6 / (1 + x.d * 0.45)), r = Math.random(), tt = t + 0.01;
        if (r < 0.3) babble(tt, g * 0.45, x.pan);
        else if (r < 0.5) { laugh(tt, g * 0.8, x.pan); if (x.n > 3 && Math.random() < 0.5) laugh(tt + 0.12, g * 0.6, x.pan * 0.8); }
        else if (r < 0.75) clink(tt, g * 0.45, x.pan); else cutlery(tt, g * 0.6, x.pan);
      }
      // la ville au loin, une voiture parfois
      if ((carT -= dt) <= 0) { carT = 12 + Math.random() * 25; farCar(t + 0.05); }
      // passants au loin
      if ((walkerT -= dt) <= 0) {
        walkerT = 14 + Math.random() * 24;
        const pan = Math.random() * 1.6 - 0.8, g = 0.05 + Math.random() * 0.04, n = 4 + Math.floor(Math.random() * 6), iv = 0.45 + Math.random() * 0.15;
        for (let i = 0; i < n; i++) step(t + 0.05 + i * iv, g * (1 - i / (n + 2)), pan, 'stone', streetIn);
      }
      // les pas de Pilou
      const dx = camera.position.x - lastPos.x, dz = camera.position.z - lastPos.z, moved = Math.hypot(dx, dz);
      lastPos.copy(camera.position);
      if (moved < 1.5 && dt > 0 && moved / dt > 0.6 && Math.abs(camera.position.y - lastY) < 0.5) {
        stepAcc += moved;
        if (stepAcc > 0.68) { stepAcc = 0; stepSide = -stepSide; step(t + 0.01, 0.16, stepSide * 0.08, room === 'bathroom' ? 'tile' : room ? 'wood' : 'stone', sfxOut); }
      } else if (moved / Math.max(dt, 1e-3) < 0.2) stepAcc = 0.5; // premier pas rapide après un arrêt
      lastY = camera.position.y;
      // la hotte : seulement chez Pilou (et un souffle sous la gaine)
      const on = exhaustOn ?? (S.steam?.intensity ?? 1);
      // dDuct : « juste sous la gaine », la hauteur compte peu
      const hm = humMix({ scene: 'night', room, dWindow: S.window ? camera.position.distanceTo(S.window) : 99, dDuct: Math.hypot(camera.position.x - S.exhaust.x, camera.position.z - S.exhaust.z, (camera.position.y - S.exhaust.y) * 0.35), on: power ? 0 : on });
      setT(motorG.gain, hm.motor * 0.4, 0.3); setT(hissG.gain, hm.hiss * 0.5, 0.3); setT(humLp.frequency, hm.cutoff, 0.3);
      setT(humPan.pan, room ? 0 : rel(S.exhaust).pan * 0.8, 0.3);
      // émetteurs des twists
      for (const e of emitters) {
        for (const f of e.ticks) f(dt);
        const { d, pan } = rel(e.pos);
        setT(e.g.gain, e.gain * att(d, e.ref), 0.15); setT(e.p.pan, pan * 0.9, 0.15);
      }
      // cloche de 22:00 (dix coups)
      const min = S.getMinutes?.();
      if (ok(min)) {
        if (lastMin !== null && lastMin < BELL_MINUTE && min >= BELL_MINUTE && min - lastMin < 30) { ringBells(10, room && room !== 'window' ? 0.4 : 0.6); duck(24); }
        lastMin = min;
      }
    },
  };
}
