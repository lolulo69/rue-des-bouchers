// Bruitages ponctuels, tous synthétisés (aucun fichier). play(name, { when, gain, pan, ... }).
export const SFX_NAMES = ['cheer', 'megaphone', 'birthday', 'whatsapp', 'notify', 'footsteps', 'radio', 'splash', 'shutter', 'keyboard', 'bark', 'crash', 'rattle', 'paper', 'rumble', 'pfff', 'flush', 'bell', 'click'];

export function makeSfx(ctx, out, noise, reverbIn) {
  const env = (g, t, a, peak, d) => { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); };
  const chain = (pan) => { const p = ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan ?? 0)); p.connect(out); return p; };
  function tone(dest, t, { type = 'sine', f, f2 = null, a = 0.005, d = 0.2, peak = 0.3 }) {
    const o = ctx.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + a + d);
    const g = ctx.createGain(); env(g, t, a, peak, d);
    o.connect(g).connect(dest); o.start(t); o.stop(t + a + d + 0.05);
  }
  function burst(dest, t, { type = 'bandpass', f = 1000, q = 1, a = 0.002, d = 0.1, peak = 0.3, f2 = null }) {
    const s = ctx.createBufferSource(); s.buffer = noise;
    const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, t); fl.Q.value = q;
    if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + a + d);
    const g = ctx.createGain(); env(g, t, a, peak, d);
    s.connect(fl).connect(g).connect(dest);
    s.start(t, Math.random() * 3); s.stop(t + a + d + 0.05);
  }

  const S = {
    // « Ploc-ploc » de message reçu (groupe WhatsApp de l'asso)
    whatsapp(t, o, dest) { tone(dest, t, { type: 'triangle', f: 1175, d: 0.09, peak: 0.25 * o.gain }); tone(dest, t + 0.1, { type: 'triangle', f: 1568, d: 0.16, peak: 0.25 * o.gain }); },
    notify(t, o, dest) { tone(dest, t, { f: 880, d: 0.25, peak: 0.2 * o.gain }); },
    // Pas sur les pavés : talon sourd + petit claquement de pierre
    footsteps(t, o, dest) {
      const n = o.steps ?? 8, dt = o.interval ?? 0.5;
      for (let i = 0; i < n; i++) {
        const ti = t + i * dt + (Math.random() - 0.5) * 0.04, k = (i % 2 ? 0.85 : 1) * o.gain;
        tone(dest, ti, { f: 110, f2: 60, d: 0.08, peak: 0.25 * k });
        burst(dest, ti, { f: 2200, q: 2, d: 0.03, peak: 0.12 * k });
      }
    },
    // Radio de la police : grésillement, voix nasillarde incompréhensible, bip de fin
    radio(t, o, dest) {
      const hp = ctx.createBiquadFilter(); hp.type = 'bandpass'; hp.frequency.value = 1400; hp.Q.value = 1.2; hp.connect(dest);
      burst(hp, t, { f: 2000, q: 0.5, d: 0.15, peak: 0.25 * o.gain });
      const syl = 5 + Math.floor(Math.random() * 5);
      for (let i = 0; i < syl; i++) {
        const ti = t + 0.2 + i * 0.14;
        tone(hp, ti, { type: 'sawtooth', f: 160 + Math.random() * 90, f2: 140 + Math.random() * 60, a: 0.02, d: 0.1, peak: 0.12 * o.gain });
      }
      burst(hp, t + 0.25 + syl * 0.14, { f: 2500, q: 0.5, d: 0.12, peak: 0.2 * o.gain });
      tone(dest, t + 0.4 + syl * 0.14, { type: 'square', f: 1800, d: 0.05, peak: 0.05 * o.gain });
    },
    // Seau d'eau : grosse gerbe qui claque puis ruisselle
    splash(t, o, dest) {
      burst(dest, t, { type: 'lowpass', f: 4000, f2: 500, a: 0.01, d: 0.7, peak: 0.6 * o.gain });
      burst(dest, t + 0.03, { f: 900, q: 0.7, a: 0.005, d: 0.25, peak: 0.4 * o.gain });
      for (let i = 0; i < 14; i++) burst(dest, t + 0.2 + Math.random() * 1.2, { f: 2500 + Math.random() * 2500, q: 6, d: 0.03, peak: 0.08 * o.gain });
    },
    // Déclencheur d'appareil photo du téléphone : « ka-chak »
    shutter(t, o, dest) {
      burst(dest, t, { type: 'highpass', f: 3000, d: 0.02, peak: 0.35 * o.gain });
      burst(dest, t + 0.07, { f: 1800, q: 3, d: 0.04, peak: 0.3 * o.gain });
    },
    // Clavier mécanique (Koddex) : rafale de frappes
    keyboard(t, o, dest) {
      let ti = t;
      const end = t + (o.seconds ?? 1.5);
      while (ti < end) {
        burst(dest, ti, { type: 'highpass', f: 2500 + Math.random() * 1500, d: 0.012, peak: (0.1 + Math.random() * 0.06) * o.gain });
        tone(dest, ti, { f: 300 + Math.random() * 100, d: 0.02, peak: 0.03 * o.gain });
        ti += Math.random() < 0.12 ? 0.25 + Math.random() * 0.3 : 0.06 + Math.random() * 0.08;
      }
    },
    // Teckel : deux petits jappements aigus
    bark(t, o, dest) {
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1300; bp.Q.value = 1.5; bp.connect(dest);
      for (const dt of [0, 0.18]) {
        tone(bp, t + dt, { type: 'sawtooth', f: 720, f2: 430, a: 0.01, d: 0.1, peak: 0.45 * o.gain });
        burst(bp, t + dt, { f: 1500, q: 1, d: 0.06, peak: 0.15 * o.gain });
      }
    },
    // Chaise métallique qui s'effondre : bang, cliquetis, poum
    crash(t, o, dest) {
      for (const f of [310, 523, 847, 1290]) tone(dest, t, { type: 'triangle', f, d: 0.5 + Math.random() * 0.4, peak: 0.12 * o.gain });
      burst(dest, t, { f: 1200, q: 0.8, d: 0.2, peak: 0.35 * o.gain });
      tone(dest, t + 0.12, { f: 90, f2: 45, d: 0.25, peak: 0.4 * o.gain });
      for (let i = 0; i < 5; i++) burst(dest, t + 0.2 + i * 0.07, { f: 3500, q: 5, d: 0.03, peak: 0.1 * o.gain });
    },
    // Cadenas qui ne s'ouvre pas : cliquetis répétés
    rattle(t, o, dest) {
      const n = (o.repeat ?? 3) * 4;
      for (let i = 0; i < n; i++) burst(dest, t + i * 0.09 + (i % 4 === 0 ? 0.3 * (i / 4) : 0), { f: 3200, q: 8, d: 0.03, peak: 0.12 * o.gain });
    },
    paper(t, o, dest) { for (let i = 0; i < 6; i++) burst(dest, t + i * 0.06, { type: 'highpass', f: 2500, d: 0.06, peak: 0.08 * o.gain }); },
    // Ventre qui gargouille (laxatif, version comique)
    rumble(t, o, dest) {
      const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = 85;
      const lfo = ctx.createOscillator(); lfo.frequency.value = 7; const lg = ctx.createGain(); lg.gain.value = 30;
      lfo.connect(lg).connect(osc.frequency);
      const g = ctx.createGain(); env(g, t, 0.15, 0.35 * o.gain, 1.2);
      osc.connect(g).connect(dest); osc.start(t); lfo.start(t); osc.stop(t + 1.5); lfo.stop(t + 1.5);
      tone(dest, t + 0.9, { f: 140, f2: 70, d: 0.3, peak: 0.15 * o.gain });
    },
    pfff(t, o, dest) { burst(dest, t, { type: 'lowpass', f: 1500, f2: 400, a: 0.2, d: 1.2, peak: 0.25 * o.gain }); },
    flush(t, o, dest) { burst(dest, t, { type: 'bandpass', f: 600, q: 0.5, f2: 300, a: 0.1, d: 1.6, peak: 0.3 * o.gain }); },
    // But ! clameur de la terrasse qui monte puis retombe
    cheer(t, o, dest) {
      burst(dest, t, { type: 'bandpass', f: 900, q: 0.6, a: 0.25, d: 2.2, peak: 0.5 * o.gain });
      burst(dest, t + 0.1, { type: 'bandpass', f: 2200, q: 0.8, a: 0.3, d: 1.6, peak: 0.25 * o.gain });
      for (let i = 0; i < 6; i++) tone(dest, t + 0.2 + i * 0.12, { type: 'sawtooth', f: 260 + Math.random() * 200, f2: 400 + Math.random() * 200, a: 0.05, d: 0.35, peak: 0.04 * o.gain });
    },
    // Mégaphone : voix nasillarde saturée, quelques syllabes (« WOUHOU ! »)
    megaphone(t, o, dest) {
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1500; bp.Q.value = 2; bp.connect(dest);
      const ws = ctx.createWaveShaper(); const curve = new Float32Array(256); for (let i = 0; i < 256; i++) { const x = i / 128 - 1; curve[i] = Math.tanh(x * 4); } ws.curve = curve; ws.connect(bp);
      for (let i = 0; i < 4; i++) tone(ws, t + i * 0.22, { type: 'sawtooth', f: 330 + Math.random() * 120, f2: 260 + Math.random() * 80, a: 0.03, d: 0.18, peak: 0.25 * o.gain });
    },
    // « Joyeux anniversaire » chanté faux par une tablée (voix en formants, un peu désaccordées)
    birthday(t, o, dest) {
      const notes = [[0, 0.75], [0, 0.25], [2, 1], [0, 1], [5, 1], [4, 2], [0, 0.75], [0, 0.25], [2, 1], [0, 1], [7, 1], [5, 2]];
      const base = 392 / 2 ** (7 / 12); // do grave
      const f1 = ctx.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 700; f1.Q.value = 3; f1.connect(dest);
      let tt = t;
      for (const [n, d] of notes) {
        for (let v = 0; v < 4; v++) tone(f1, tt + Math.random() * 0.04, { type: 'sawtooth', f: base * 2 ** ((n + (Math.random() - 0.5) * 0.5) / 12), a: 0.06, d: d * 0.42, peak: 0.05 * o.gain });
        tt += d * 0.42;
      }
    },
    click(t, o, dest) { burst(dest, t, { type: 'highpass', f: 4000, d: 0.015, peak: 0.2 * o.gain }); },
    // Une cloche (le moteur principal sonne les 10 coups de 22h)
    bell(t, o) {
      const g = ctx.createGain(); g.gain.value = 0.5 * o.gain; g.connect(reverbIn);
      for (const [r, a, d] of [[0.5, 0.5, 6], [1, 0.8, 4], [1.183, 0.5, 3], [1.506, 0.35, 2.5], [2, 0.4, 2]]) tone(g, t, { f: 196 * r, a: 0.008, d, peak: a * 0.18 });
    },
  };

  return {
    play(name, o = {}) {
      const f = S[name];
      if (!f) { console.warn(`audio.play : son inconnu « ${name} »`); return false; }
      f(o.when ?? ctx.currentTime, { gain: 1, ...o }, chain(o.pan));
      return true;
    },
  };
}
