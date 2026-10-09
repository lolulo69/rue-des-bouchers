// Boucles procédurales : 'lofi' (phase de jour, chill), 'night' (nappe nocturne, très douce), 'hall' (salle de la
// commission, J14), 'typing' (Koddex), 'musette' (accordéon de rue, branché sur un émetteur de l'ambiance).
// Ordonnanceur classique : setInterval qui programme les notes ~0.4 s à l'avance sur l'horloge audio.
export const LOOP_NAMES = ['lofi', 'night', 'hall', 'typing', 'musette'];

const mtof = (m) => 440 * 2 ** ((m - 69) / 12);

export function makeMusic(ctx, out, noise, makeReverbBus) {
  const running = new Map();
  const noiseSrc = (dest, t, dur, type, f, q = 1) => {
    const s = ctx.createBufferSource(); s.buffer = noise;
    const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
    s.connect(fl); fl.connect(dest);
    s.start(t, Math.random() * 3); s.stop(t + dur);
    return fl;
  };
  const envGain = (dest, t, a, peak, d) => {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
    g.connect(dest);
    return g;
  };
  function scheduler(step, stepDur, onStep) {
    let next = ctx.currentTime + 0.1, i = 0;
    const id = setInterval(() => {
      if (next < ctx.currentTime - 0.3) next = ctx.currentTime + 0.05; // onglet ralenti : on saute les notes en retard, pas de rafale
      while (next < ctx.currentTime + 0.4) { onStep(i, next); i = (i + 1) % step; next += stepDur(i); }
    }, 90);
    return () => clearInterval(id);
  }

  // ---------- Lo-fi : piano électrique, basse ronde, batterie feutrée, craquements de vinyle ----------
  function lofi(out) {
    const bus = ctx.createGain(); bus.gain.value = 0;
    bus.gain.linearRampToValueAtTime(1.3, ctx.currentTime + 2);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200;
    const wow = ctx.createOscillator(); wow.frequency.value = 0.3; const wg = ctx.createGain(); wg.gain.value = 400;
    wow.connect(wg).connect(lp.frequency); wow.start();
    bus.connect(lp).connect(out);
    const trem = ctx.createGain(); trem.gain.value = 0.8;
    const tl = ctx.createOscillator(); tl.frequency.value = 4.2; const tg = ctx.createGain(); tg.gain.value = 0.15;
    tl.connect(tg).connect(trem.gain); tl.start();
    const ep = ctx.createBiquadFilter(); ep.type = 'lowpass'; ep.frequency.value = 1900; ep.connect(trem); trem.connect(bus);
    // vinyle
    const hiss = ctx.createBufferSource(); hiss.buffer = noise; hiss.loop = true;
    const hf = ctx.createBiquadFilter(); hf.type = 'bandpass'; hf.frequency.value = 3500; hf.Q.value = 0.6;
    const hgain = ctx.createGain(); hgain.gain.value = 0.025;
    hiss.connect(hf).connect(hgain).connect(bus); hiss.start();

    const chords = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]]; // Fmaj7 Em7 Dm7 Cmaj7
    const bpm = 76, s16 = 60 / bpm / 4;
    const penta = [72, 74, 76, 79, 81, 84];
    const stop = scheduler(64, (i) => s16 * (i % 2 ? 0.88 : 1.12), (i, t) => { // swing
      const bar = Math.floor(i / 16), st = i % 16, ch = chords[bar];
      if (st === 0 || (st === 10 && Math.random() < 0.6)) ch.forEach((m, k) => {
        const tt = t + k * 0.018;
        for (const [type, mul, pk] of [['sine', 1, 0.07], ['triangle', 2, 0.018]]) {
          const o = ctx.createOscillator(); o.type = type; o.frequency.value = mtof(m) * mul * (1 + (Math.random() - 0.5) * 0.003);
          o.connect(envGain(ep, tt, 0.015, pk * (st ? 0.6 : 1), 2.6)); o.start(tt); o.stop(tt + 2.8);
        }
      });
      if (st === 0 || st === 7 || st === 10) { // basse
        const o = ctx.createOscillator(); o.frequency.value = mtof(ch[0] - 12);
        o.connect(envGain(bus, t, 0.01, 0.22, st === 0 ? 0.9 : 0.4)); o.start(t); o.stop(t + 1);
      }
      if (st === 0 || st === 7 || st === 10) { // grosse caisse
        const o = ctx.createOscillator(); o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
        o.connect(envGain(bus, t, 0.003, 0.35, 0.18)); o.start(t); o.stop(t + 0.25);
      }
      if (st === 4 || st === 12) noiseSrc(envGain(bus, t, 0.002, 0.12, 0.16), t, 0.2, 'bandpass', 1800, 0.8); // caisse claire feutrée
      if (st % 2 === 0) noiseSrc(envGain(bus, t, 0.001, 0.03 + Math.random() * 0.025, 0.04), t, 0.06, 'highpass', 7000); // charleston
      if (st % 4 === 2 && bar >= 2 && Math.random() < 0.35) { // petite mélodie
        const o = ctx.createOscillator(); o.frequency.value = mtof(penta[Math.floor(Math.random() * penta.length)]);
        const vib = ctx.createOscillator(); vib.frequency.value = 5; const vg = ctx.createGain(); vg.gain.value = 3;
        vib.connect(vg).connect(o.frequency); vib.start(t); vib.stop(t + 1.2);
        o.connect(envGain(ep, t, 0.02, 0.05, 1.0)); o.start(t); o.stop(t + 1.2);
      }
      if (Math.random() < 0.08) noiseSrc(envGain(bus, t, 0.001, 0.05, 0.01), t, 0.02, 'highpass', 2000); // craquement
    });
    return () => {
      bus.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
      stop();
      setTimeout(() => { hiss.stop(); wow.stop(); tl.stop(); bus.disconnect(); }, 2500);
    };
  }

  // ---------- Salle de la commission (J14) : grande salle, murmures, toux, chaises, papiers, sono ----------
  function hall(out) {
    const room = makeReverbBus(5, 0.65, out);
    const bus = ctx.createGain(); bus.gain.value = 0; bus.gain.linearRampToValueAtTime(0.7, ctx.currentTime + 2);
    bus.connect(room.input);
    const voices = [];
    for (let i = 0; i < 5; i++) {
      const s = ctx.createBufferSource(); s.buffer = noise; s.loop = true;
      const f1 = ctx.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 300 + Math.random() * 400; f1.Q.value = 3;
      const g = ctx.createGain(); g.gain.value = 0;
      s.connect(f1).connect(g).connect(bus); s.start(0, Math.random() * 3);
      voices.push({ s, g, ph: Math.random() * 10, rate: 2.5 + Math.random() * 2 });
    }
    const hum = ctx.createOscillator(); hum.frequency.value = 50; const hg = ctx.createGain(); hg.gain.value = 0.012; hum.connect(hg).connect(bus); hum.start();
    const stop = scheduler(1, () => 0.25, (i, t) => {
      for (const v of voices) {
        v.ph += 0.25 * v.rate;
        v.g.gain.setTargetAtTime(0.06 * Math.max(0, Math.sin(v.ph * 6.28)) * (0.3 + 0.7 * Math.max(0, Math.sin(v.ph * 0.2))), t, 0.04);
      }
      const r = Math.random();
      if (r < 0.02) { noiseSrc(envGain(bus, t, 0.01, 0.25, 0.12), t, 0.2, 'bandpass', 500, 1.5); noiseSrc(envGain(bus, t + 0.25, 0.01, 0.18, 0.1), t + 0.25, 0.2, 'bandpass', 450, 1.5); } // toux
      else if (r < 0.035) { // chaise qui grince
        const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(140, t); o.frequency.linearRampToValueAtTime(220, t + 0.35);
        const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 8;
        o.connect(bp).connect(envGain(bus, t, 0.05, 0.05, 0.3)); o.start(t); o.stop(t + 0.4);
      } else if (r < 0.05) for (let k = 0; k < 4; k++) noiseSrc(envGain(bus, t + k * 0.05, 0.002, 0.05, 0.05), t + k * 0.05, 0.08, 'highpass', 2500); // papiers
    });
    return () => {
      bus.gain.setTargetAtTime(0, ctx.currentTime, 0.5);
      stop();
      setTimeout(() => { voices.forEach((v) => v.s.stop()); hum.stop(); bus.disconnect(); }, 2500);
    };
  }

  // ---------- Frappe au clavier en continu (bureau Koddex), avec des pauses de réflexion ----------
  function typing(out) {
    const bus = ctx.createGain(); bus.gain.value = 0.6; bus.connect(out);
    let pause = 0;
    const stop = scheduler(1, () => 0.07 + Math.random() * 0.06, (i, t) => {
      if (pause > 0) { pause--; return; }
      if (Math.random() < 0.02) { pause = 15 + Math.floor(Math.random() * 25); return; }
      noiseSrc(envGain(bus, t, 0.001, 0.08 + Math.random() * 0.05, 0.015), t, 0.03, 'highpass', 2500 + Math.random() * 1500);
    });
    return () => { stop(); setTimeout(() => bus.disconnect(), 500); };
  }

  // ---------- Musette : accordéon de rue (valse à 3 temps), un peu désaccordé, sous la fenêtre ----------
  function musette(out) {
    const bus = ctx.createGain(); bus.gain.value = 0; bus.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 1.5);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600;
    const trem = ctx.createGain(); trem.gain.value = 0.85;
    const tl = ctx.createOscillator(); tl.frequency.value = 6; const tg = ctx.createGain(); tg.gain.value = 0.15; tl.connect(tg).connect(trem.gain); tl.start();
    bus.connect(trem).connect(lp).connect(out);
    const chords = [[57, 60, 64], [57, 60, 64], [52, 56, 59], [52, 56, 59], [57, 60, 64], [50, 53, 57], [52, 56, 59], [57, 60, 64]]; // la m · mi · ré m
    const tune = [76, 74, 72, 71, 72, 74, 76, 79, 77, 76, 74, 72, 71, 69, 71, 72, 74, 72, 71, 69, 68, 69, 71, 72];
    const beat = 60 / 150;
    const reed = (m, t, d, pk) => { for (const det of [-0.004, 0.004]) { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m) * (1 + det); o.connect(envGain(bus, t, 0.03, pk, d)); o.start(t); o.stop(t + d + 0.1); } };
    const stop = scheduler(24, () => beat, (i, t) => {
      const ch = chords[Math.floor(i / 3) % chords.length];
      if (i % 3 === 0) reed(ch[0] - 12, t, beat * 0.9, 0.05); // basse
      else ch.forEach((m) => reed(m, t, beat * 0.5, 0.018)); // accord « pom-pom »
      reed(tune[i % tune.length], t, beat * 0.95, 0.045); // mélodie
    });
    return () => { bus.gain.setTargetAtTime(0, ctx.currentTime, 0.4); stop(); setTimeout(() => { tl.stop(); bus.disconnect(); }, 2000); };
  }


  // ---------- Nuit : nappe très douce (accords tenus, filtre fermé) et quelques notes de célesta, loin derrière la rue ----------
  function night(out) {
    const bus = ctx.createGain(); bus.gain.value = 0; bus.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 4);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = 0.3;
    const sweep = ctx.createOscillator(); sweep.frequency.value = 0.05; const sg = ctx.createGain(); sg.gain.value = 250;
    sweep.connect(sg).connect(lp.frequency); sweep.start();
    const room = makeReverbBus(3.5, 0.5, out);
    bus.connect(lp).connect(room.input);
    const chords = [[45, 52, 57, 60, 64], [41, 48, 53, 57, 64], [43, 50, 55, 59, 62], [40, 47, 52, 55, 59]]; // la m9 · fa maj7 · sol 6 · mi m7
    const bell = [69, 71, 72, 76, 79, 81];
    const BAR = 7.5;
    const stop = scheduler(8, () => BAR / 2, (i, t) => {
      if (i % 2 === 0) chords[(i / 2) % 4].forEach((m, k) => { // accord tenu, attaque lente
        for (const det of [-0.003, 0.003]) {
          const o = ctx.createOscillator(); o.type = k ? 'triangle' : 'sine'; o.frequency.value = mtof(m) * (1 + det);
          const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime((k ? 0.022 : 0.05), t + 2.2);
          g.gain.setValueAtTime(k ? 0.022 : 0.05, t + BAR - 1.5); g.gain.linearRampToValueAtTime(0, t + BAR + 1.5);
          o.connect(g).connect(bus); o.start(t); o.stop(t + BAR + 1.6);
        }
      });
      if (Math.random() < 0.55) { // une note de célesta, pas toujours
        const tt = t + Math.random() * 2;
        const o = ctx.createOscillator(); o.frequency.value = mtof(bell[Math.floor(Math.random() * bell.length)]);
        o.connect(envGain(room.input, tt, 0.004, 0.035, 3.2)); o.start(tt); o.stop(tt + 3.4);
      }
    });
    return () => { bus.gain.setTargetAtTime(0, ctx.currentTime, 0.8); stop(); setTimeout(() => { sweep.stop(); bus.disconnect(); room.input.disconnect(); }, 4000); };
  }

  const makers = { lofi, night, hall, typing, musette };
  return {
    // dest : bus de sortie (par défaut celui de la musique) ; une boucle ne tourne qu'une fois à la fois
    loop(name, on = true, dest = out) {
      if (!makers[name]) { console.warn(`audio.loop : boucle inconnue « ${name} »`); return; }
      if (on && !running.has(name)) running.set(name, makers[name](dest));
      else if (!on && running.has(name)) { running.get(name)(); running.delete(name); }
    },
    playing: (name) => running.has(name),
    get running() { return [...running.keys()]; },
  };
}
