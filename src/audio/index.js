// Moteur audio procédural (WebAudio, aucun fichier), singleton `audio`.
//   master ─ compresseur ─ sortie
//     ├─ music    (Musique)  : lo-fi le jour, nappe nocturne la nuit et sous l'écran titre ; s'efface sous les événements
//     ├─ ambience (Ambiance) : la rue la nuit (ambience.js : brouhaha, hotte chez Pilou, cloche, pluie, twists),
//     │                        le clavier de Koddex le jour
//     └─ sfx      (Effets)   : bruitages ponctuels (sfx.js), interface (téléphone, coach…), pas de Pilou
// La scène sonore suit l'écran tout seul (mix.js › sceneFrom) : titre, jour (interface ou art.day), nuit (rue rendue).
// Survit à tout : contexte créé au premier geste et relancé à chaque geste / retour d'onglet / changement d'état,
// aucune valeur non finie ne part vers WebAudio, une erreur de son ne casse jamais la boucle de jeu.
// Réglages joueur : audio.setVolume('music' | 'ambience' | 'sfx', v) · setVolume(v) (général) · setEnabled(bus, b)
// · setMuted(b) · touche M. Persistés (localStorage rdb.audio.v1). Diagnostic : audio.debug().
import * as THREE from 'three';
import { makeSfx, SFX_NAMES } from './sfx.js';
import { makeMusic, LOOP_NAMES } from './music.js';
import { makeAmbience } from './ambience.js';
import { BUSES, MUSIC_FOR, busGain, clamp01, loadMix, saveMix, sceneFrom } from './mix.js';

const storage = () => { try { return window.localStorage; } catch { return null; } };
// Ces bruitages font s'effacer la musique quelques secondes
const DUCKS = { cheer: 3, megaphone: 2.5, radio: 2.5, birthday: 8, crash: 2, splash: 2, bell: 4, whatsapp: 1.5, notify: 1.2 };
const GESTURES = ['pointerdown', 'mousedown', 'touchend', 'click', 'keydown'];

function createEngine() {
  let ctx = null, master = null, noise = null, sounds = null, music = null, street = null;
  const bus = {}, meters = {};
  let duckG = null, streetGate = null, dayAmb = null;
  let mix = loadMix(storage());
  let forced = null, dayPlace = null, scene = null, track = null, dayLoop = null;
  let lastNight = -1e9, lastCamera = null, streetOpts = null, warned = false;
  const pending = new Map(); // boucles demandées avant le premier geste
  const rnow = () => (typeof performance !== 'undefined' ? performance.now() / 1000 : Date.now() / 1000);

  // --- Toast « son coupé » ---
  const toast = document.createElement('div');
  Object.assign(toast.style, { position: 'fixed', right: '16px', bottom: '16px', padding: '6px 12px', borderRadius: '8px', background: 'rgba(10,12,20,.75)', color: '#f6e7c1', font: '14px system-ui, sans-serif', pointerEvents: 'none', opacity: '0', transition: 'opacity .3s', zIndex: 50 });
  document.body.appendChild(toast);
  let toastTimer;
  const say = (txt) => { toast.textContent = txt; toast.style.opacity = '1'; clearTimeout(toastTimer); toastTimer = setTimeout(() => { toast.style.opacity = '0'; }, 1600); };

  const setT = (param, v, tc = 0.1) => { if (ctx && Number.isFinite(v)) param.setTargetAtTime(v, ctx.currentTime, tc); };
  const resume = () => { if (ctx && ctx.state !== 'running' && ctx.state !== 'closed' && !document.hidden) ctx.resume().catch(() => {}); };

  function makeReverbBus(seconds, wet, dest = bus.ambience) {
    const len = Math.floor(ctx.sampleRate * seconds);
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5); }
    const conv = ctx.createConvolver(); conv.buffer = ir;
    const input = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200;
    const dry = ctx.createGain(); dry.gain.value = 1 - wet; const w = ctx.createGain(); w.gain.value = wet;
    input.connect(lp); lp.connect(dry).connect(dest); lp.connect(conv).connect(w).connect(dest);
    return { input, lp };
  }
  const meter = (node) => { const a = ctx.createAnalyser(); a.fftSize = 1024; node.connect(a); return a; };

  function create() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { ctx = new AC({ latencyHint: 'interactive' }); } catch { ctx = new AC(); }
    master = ctx.createGain(); master.gain.value = mix.muted ? 0 : mix.master;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
    master.connect(comp).connect(ctx.destination);
    meters.master = meter(comp);
    noise = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    for (const b of BUSES) { bus[b] = ctx.createGain(); bus[b].gain.value = mix.enabled[b] === false ? 0 : mix[b]; bus[b].connect(master); meters[b] = meter(bus[b]); }
    duckG = ctx.createGain(); duckG.connect(bus.music);
    streetGate = ctx.createGain(); streetGate.gain.value = 0; streetGate.connect(bus.ambience);
    dayAmb = ctx.createGain(); dayAmb.gain.value = 0; dayAmb.connect(bus.ambience);
    const bellBus = makeReverbBus(4.5, 0.55, bus.sfx);
    sounds = makeSfx(ctx, bus.sfx, noise, bellBus.input);
    music = makeMusic(ctx, duckG, noise, makeReverbBus);
    street = makeAmbience(ctx, { out: streetGate, sfxOut: bus.sfx, noise, makeReverbBus, music, play: (n, o) => api.play(n, o), duck: (s) => api.duck(s) });
    if (streetOpts) street.attach(streetOpts);
    ctx.onstatechange = () => { if (ctx.state === 'suspended' || ctx.state === 'interrupted') resume(); };
    for (const [name, on] of pending) music.loop(name, on);
    pending.clear();
    scene = null; // la scène sera (ré)appliquée par le chien de garde
    watch();
  }
  // Démarre (ou relance) au moindre geste : les navigateurs n'autorisent le son qu'après une interaction
  function ensure() { if (!ctx) create(); else resume(); }
  for (const ev of GESTURES) addEventListener(ev, ensure, { capture: true, passive: true });
  document.addEventListener('visibilitychange', () => { if (!ctx) return; if (document.hidden) ctx.suspend().catch(() => {}); else resume(); });

  // Touche M (la lettre, quel que soit le clavier), sauf en tapant dans un champ
  addEventListener('keydown', (e) => {
    if (e.repeat || (e.key !== 'm' && e.key !== 'M') || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target?.closest?.('input, textarea, select, [contenteditable=""], [contenteditable=true]')) return;
    api.setMuted(!mix.muted);
    say(mix.muted ? '🔇 Son coupé (M)' : '🔊 Son (M)');
  });

  // --- Scène sonore : on regarde l'écran 4 fois par seconde (même quand la nuit ne se dessine pas) ---
  const shown = (id) => { const el = document.getElementById(id); return !!el && !el.classList.contains('hidden') && !el.classList.contains('ui-hidden'); };
  function currentScene() {
    return sceneFrom({ forced, dayActive: !!dayPlace, titleVisible: shown('title'), dayUiVisible: shown('ui-root'), nightFresh: rnow() - lastNight < 3 }); // 3 s : une image très lente (iGPU, SwiftShader) ne coupe pas la nuit
  }
  function applyScene(s) {
    scene = s;
    setT(streetGate.gain, s === 'night' ? 1 : 0, s === 'night' ? 0.8 : 0.3);
    const want = MUSIC_FOR[s] ?? null;
    if (want !== track) { if (track) music.loop(track, false); if (want) music.loop(want, true); track = want; }
    const dl = s === 'day' && dayPlace === 'koddex' ? 'typing' : null; // le clavier des collègues à Koddex
    if (dl !== dayLoop) { if (dayLoop) music.loop(dayLoop, false); if (dl) music.loop(dl, true, dayAmb); dayLoop = dl; }
    setT(dayAmb.gain, s === 'day' ? 0.45 : 0, 0.5);
  }
  let watchId = null;
  function watch() {
    if (watchId) return;
    const tick = () => {
      try {
        if (!ctx) return;
        if (ctx.state !== 'running' && !document.hidden && (navigator.userActivation?.hasBeenActive ?? true)) resume();
        const s = currentScene();
        if (s !== scene) applyScene(s);
      } catch (err) { if (!warned) { warned = true; console.warn('audio :', err); } }
    };
    tick();
    watchId = setInterval(tick, 250);
  }
  function applyMix() {
    if (!ctx) return;
    setT(master.gain, mix.muted ? 0 : mix.master, 0.05);
    for (const b of BUSES) setT(bus[b].gain, mix.enabled[b] === false ? 0 : mix[b], 0.05);
  }
  const persist = () => saveMix(storage(), mix);

  // Position → gain et panoramique relatifs à la dernière caméra de la nuit ; étouffé si l'on est chez Pilou
  const tmp = new THREE.Vector3(), right = new THREE.Vector3();
  function spatial(pos) {
    if (!pos || !lastCamera || scene !== 'night') return { gain: 1, pan: 0 };
    tmp.set(pos.x, pos.y ?? 1, pos.z);
    if (![tmp.x, tmp.y, tmp.z].every(Number.isFinite)) return { gain: 1, pan: 0 };
    right.set(1, 0, 0).applyQuaternion(lastCamera.quaternion);
    tmp.sub(lastCamera.position);
    const d = Math.max(1, tmp.length());
    const room = street?.room;
    return { gain: Math.min(1, 4 / (1 + d * 0.3)) * (room && room !== 'window' ? 0.45 : 1), pan: Math.max(-1, Math.min(1, tmp.dot(right) / d)) };
  }

  const api = {
    get muted() { return mix.muted; },
    get state() { return ctx ? ctx.state : 'off'; },
    get scene() { return scene ?? currentScene(); },
    get mix() { return { ...mix, enabled: { ...mix.enabled } }; },
    sounds: SFX_NAMES,
    loops: LOOP_NAMES,
    buses: BUSES,
    // ---- mélangeur (réglages du joueur) ----
    // setVolume('music' | 'ambience' | 'sfx', 0..1) ou setVolume(0..1) = volume général
    setVolume(a, b) {
      if (typeof a === 'number') mix.master = clamp01(a);
      else if (BUSES.includes(a)) mix[a] = clamp01(b);
      else return false;
      applyMix(); persist(); return true;
    },
    getVolume: (b = 'master') => mix[b],
    setEnabled(b, on = true) { if (!BUSES.includes(b)) return false; mix.enabled[b] = !!on; applyMix(); persist(); return true; },
    isEnabled: (b) => mix.enabled[b] !== false,
    setMuted(m) { mix.muted = !!m; applyMix(); persist(); },
    // ---- la rue (world.js) ----
    attachStreet(o) { streetOpts = o; street?.attach(o); return this; },
    // Appelé à chaque image de la nuit (world.js › onFrame) : c'est aussi ce qui dit « la nuit est à l'écran »
    update(dt, camera) {
      lastCamera = camera; lastNight = rnow();
      if (!ctx || ctx.state !== 'running' || !street) return;
      try { street.update(Number.isFinite(dt) ? Math.min(dt, 0.1) : 0, camera); } catch (err) { if (!warned) { warned = true; console.warn('audio :', err); } }
    },
    // État de la nuit fourni par le metteur en scène : { twist, exhaust (0..1.4), darkness (0..1) }
    street(st) { try { street?.state(st); } catch (err) { if (!warned) { warned = true; console.warn('audio :', err); } } },
    twistMoment(e) { street?.moment(e); },
    rain(level = 0) { street?.rain(level); },
    // ---- bruitages et boucles ----
    // play(name, { pos (Vector3, spatialisé), gain, delay (s), … }) — voir sfx.js
    play(name, opts = {}) {
      if (!sounds || ctx.state !== 'running') return false;
      try {
        const sp = spatial(opts.pos);
        const gain = (Number.isFinite(opts.gain) ? opts.gain : 1) * sp.gain;
        const pan = Number.isFinite(opts.pan) ? opts.pan : sp.pan;
        if (DUCKS[name]) api.duck(DUCKS[name]);
        return sounds.play(name, { ...opts, gain, pan, when: ctx.currentTime + Math.max(0, Number.isFinite(opts.delay) ? opts.delay : 0) });
      } catch (err) { if (!warned) { warned = true; console.warn('audio :', err); } return false; }
    },
    // Boucle à la demande (galerie, J14 : 'hall') ; la musique de fond, elle, suit la scène toute seule
    loop(name, on = true) { if (!music) { pending.set(name, on); return; } music.loop(name, on); },
    // La musique s'efface quelques secondes (événement, carte, cloche…)
    duck(seconds = 3, depth = 0.3) {
      if (!duckG) return;
      const t = ctx.currentTime;
      duckG.gain.cancelScheduledValues(t); duckG.gain.setTargetAtTime(depth, t, 0.15); duckG.gain.setTargetAtTime(1, t + seconds, 1.2);
    },
    // ---- scène ----
    // Forcer une scène ('title' | 'day' | 'night' | 'hall' | 'off'), null = automatique (recommandé)
    setScene(s = null) { forced = s; if (ctx) applyScene(currentScene()); },
    mode(m) { api.setScene(m === 'night' || m == null ? null : m); }, // compatibilité v0.5
    // art.day : la scène de jour en 3D en cours ('koddex', 'home', 'commute'…) ou null
    day(place = null) { dayPlace = place; if (ctx) applyScene(currentScene()); },
    bell: (n = 1) => street?.bell(n),
    start: ensure,
    // ---- diagnostic (tests) ----
    debug() {
      const rms = {};
      const buf = new Float32Array(1024);
      for (const [k, a] of Object.entries(meters)) { a.getFloatTimeDomainData(buf); let s = 0; for (const x of buf) s += x * x; rms[k] = +Math.sqrt(s / buf.length).toFixed(5); }
      return {
        state: this.state, scene: scene ?? currentScene(), music: track, dayLoop, mix: this.mix,
        buses: Object.fromEntries(BUSES.map((b) => [b, { gain: bus[b] ? +bus[b].gain.value.toFixed(3) : null, effective: busGain(mix, b) }])),
        street: { attached: !!streetOpts, gate: streetGate ? +streetGate.gain.value.toFixed(3) : null, room: street?.room ?? null, twist: street?.twist ?? null, emitters: street?.emitters ?? 0, hum: street?.hum ?? null },
        rms, time: ctx ? +ctx.currentTime.toFixed(2) : 0,
      };
    },
  };
  return api;
}

export const audio = createEngine();
// Compatibilité v0.3
export const createAudio = (o) => audio.attachStreet(o);
