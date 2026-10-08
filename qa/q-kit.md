# Q-kit: fast Chrome QA for the « Q » items of §13

One step per unticked §13 item marked **Q**: URL, console calls to reach the state fast, what to look at, expected result.
Headless captures of the same steps: `npm run qa:qkit` (not part of CI) → `qa/screens/q/<item>.jpg`.

**Server**: http://192.168.1.163:8090 (deployed `main`). Locally: `npm run build && npx vite preview` → http://localhost:4173.
Every URL below takes `?nolock=1` (no pointer lock, so the console stays usable) and a fixed `seed` (replayable).

## 0. Setup (once per tab): the `qk` helper

**Campaign items** (A, B, D, F, G): open http://192.168.1.163:8090/?nolock=1&seed=11, click **Campagne (14 jours)** → **Nouvelle campagne** → **Passer l'intro**.
Then paste this in the DevTools console (same code as `QK` in `tests/e2e/qkit.e2e.js`):

```js
window.qk = {
  c: () => window.__rdb.ui.campaign,
  safe(c) { const s = c.state.stats; s.sleep = Math.max(s.sleep, 60); s.job = Math.max(s.job, 60); s.risk = Math.min(s.risk, 30); },
  night(c) { const sim = c.createNight(); for (let k = 0; !sim.state.ended && k < 20000; k++) { if (sim.state.sleep < 30) sim.state.sleep = 50; sim.tick(1); sim.events.length = 0; } c.finishNight(sim); },
  advance(c, prefer) {
    switch (c.step) {
      case 'cards': { const ok = c.card().choices.filter((x) => x.available); const pick = (prefer && ok.find((x) => prefer.test(x.label))) || ok.find((x) => !/action directe|habitué|carbonnade/i.test(x.label)) || ok[0]; c.resolveCard(pick ? pick.i : 0); break; }
      case 'koddex': c.koddex(['work', 'work', 'work']); break;
      case 'actions': c.endAfternoon(); break;
      case 'night': this.night(c); break;
      case 'recap': c.nextDay(); break;
    }
  },
  to(day, step = 'cards', { card = null, prefer = null } = {}) {
    const c = this.c(); const re = prefer ? new RegExp(prefer, 'i') : null;
    for (let i = 0; i < 5000 && !c.ended && c.state.day <= day; i++) { if (c.state.day === day && c.step === step && (!card || (c.step === 'cards' && c.card().id === card))) break; this.safe(c); this.advance(c, re); }
    return this.done(c);
  },
  toDialogue(speakers, maxDay = 14) {
    const c = this.c();
    for (let i = 0; i < 5000 && !c.ended && c.state.day <= maxDay; i++) { if (c.step === 'cards') { const k = c.card(); if (k.type === 'dialogue' && speakers.includes(k.data.speaker)) break; } this.safe(c); this.advance(c, null); }
    return this.done(c);
  },
  done(c) { localStorage.setItem(window.__rdb.saveKey, JSON.stringify(c.save())); window.__rdb.ui.render(); const k = c.step === 'cards' ? c.card() : null; return { day: c.state.day, step: c.step, card: k?.id ?? null, speaker: k?.data?.speaker ?? null, ended: c.ended }; },
  patchSave(fn) { const k = window.__rdb.saveKey; const s = JSON.parse(localStorage.getItem(k)); fn(s); localStorage.setItem(k, JSON.stringify(s)); },
};
```
- `qk.to(day, step)` fast-forwards a **real** campaign through the engine API (first sensible choice on each card, real work at Koddex, empty afternoons, nights simulated headless) and redraws the UI. `step` = `'cards' | 'koddex' | 'actions' | 'night' | 'recap'`; `{ card: 'd9_inspector' }` stops on that card.
- While fast-forwarding, `qk` keeps Sleep ≥ 60, Job ≥ 60 and Risk ≤ 30, otherwise a passive run ends before the target day. Once you play by hand, nothing is forced.
- `qk.patchSave(fn)` edits the save. Then **reload** and click **Campagne → Continuer**: it is the only clean way to force flags or stats (the engine caches flags).

**Free-night items** (C, I4): http://192.168.1.163:8090/?nolock=1&seed=11&day=sat → **Nuit libre**. Console: `__rdb.step(n)` advances n frames,
`__rdb.sim.tick(m)` advances m game minutes, `__rdb.player` moves the camera (see the C steps).

## A. Campaign and length
| Item | Reach it | Look at | Expected | Capture |
|---|---|---|---|---|
| **A1** 14-day calendar | Setup, then `qk.to(1, 'koddex')`, `qk.to(1, 'actions')`, `qk.to(1, 'night')` + click **Descendre dans la rue (nuit)**, then after the night `qk.to(14)` | The day header (day, weekday, phase) at each step; « samedi · sans voitures » on D6/D13 | Mon D1 → Sun D14. Each day is Koddex → afternoon → night 3D → recap, and the header always matches | `A1-calendar*.jpg` |
| **A2** Save / continue | `qk.to(3, 'actions')`, reload, **Campagne → Continuer** | Day header, slots left, stats | Same day, same step, same stats after reload. « Nouvelle campagne » asks for confirmation when a save exists | `A2-save-continue.jpg` |
| **A3** Duration (Q L) | Play D1 by hand with a stopwatch: morning, afternoon, a full night without skipping | Real minutes per phase; the HUD clock 20:30 → ~01:30 | Night ≈ 10 min, day phases a few minutes; 14 days ≈ 2h30–4h (compare `qa/duration.md`). « Se coucher » skips time but you miss what happens | `A3-duration-night-start.jpg` |
| **A5** Fixed events on their day | `qk.to(4, 'cards', { card: 'd4_colette_dinner' })`, then the same with 6 `d6_saturday`, 7 `d7_general_meeting`, 9 `d9_inspector`, 11 `d11_exhaust_meeting`, 13 `d13_saturday`, 14 `d14_commission` | The event card and the day header | Each event appears on its day, never another day. D14 shows the commission scene (speeches) before the choices | `A5-event-d<N>.jpg` |

## B. Characters
| Item | Reach it | Look at | Expected | Capture |
|---|---|---|---|---|
| **B1** Association cast | `qk.to(2, 'actions')`, `qk.patchSave(s => s.flags.push('met_jeremie','met_klaas','met_hilde','met_tatie','met_seb_nico','met_hippolyte'))`, reload → Continuer → 📓 (or C) | Carnet › Personnes: portrait, bio, position, quote for Pilou, Jérémie + Biloute, Klaas, Hilde, Tatie, Seb, Nico, Gaufre, Hippolyte. 3D: models in the night street (Klaas at the place with binoculars, cat on the n°13 balcony) | Every portrait is recognisable (Klaas = Santa, Ghislain = bun…), and the text matches `characters.js` | `B1-B2-carnet-characters.jpg` |
| **B1** 3D models (dev only) | `npm run dev` → http://localhost:5173/src/art/gallery/ | Each model and its 7 expressions | Matches §2 descriptions | (manual) |
| **B2** Bloc, police, institutions | Same Carnet, plus flags `met_waiter`, `called_police`, `chief_came`, `press_contacted`, `lawyer_hired` | Dédé, Ghislain, Théo, Lemaire, Benali, Desmet, Delphine, Stéphane, Colette, Lescaut, the journalist, the lawyer, Clode | Every card present. Lemaire's free meals only appear with `seen_complaisance` (spoiler rule) | `B1-B2-carnet-characters.jpg` |
| **B3** 8+ contextual lines per member | First `qk.patchSave(s => s.flags.push('met_jeremie','met_klaas','met_hilde','met_tatie','met_seb_nico','met_hippolyte'))`, reload → Continuer (most lines need the meeting; a passive fast-forward never triggers Hilde, Seb or Nico). Then `qk.toDialogue(['jeremie','klaas','hilde','tatie','seb','nico','hippolyte','regis'])`, read, then `qk.advance(qk.c())` and repeat | The dialogue card: portrait, voice, does the line fit the current state (day, recent events)? | Each member speaks in their voice (Klaas timestamps, Tatie's proverbs, Hippolyte says vous). No line references something the player hasn't seen | `B3-dialogue-<id>.jpg` |

## C. Night
| Item | Reach it | Look at | Expected | Capture |
|---|---|---|---|---|
| **C3** Witnesses / line of sight | Free night ?seed=11, **Nuit libre**, console: `__rdb.sim.tick(120)` (≈ 22:30), go to the window (E on the stairs, or the `goToWindow` snippet below). Then `__rdb.sim.tick(160)` (≈ 01:10) | The « 👁 Témoins possibles » HUD line; the cat on the n°13 balcony; Klaas's lit window on the place | 22:30: Klaas + Seb & Nico (cat out) listed. After the cat goes in (23:00–00:30), Seb & Nico disappear. After 01:00, Klaas disappears (asleep). Darkness lowers the street witnesses | `C3-witnesses-2230.jpg`, `C3-witnesses-0110.jpg` |
| **C6** Saturday | http://192.168.1.163:8090/?nolock=1&seed=11&day=sat → **Nuit libre**, `__rdb.sim.tick(150)` (≈ 23:00), walk the street | No cars, crowd, people drinking standing up, someone peeing in a doorway (log: « urine contre… ») | Saturday reads as packed and rowdy; the pee event can hit Pilou's door | `C6-saturday.jpg` |

Window snippet: `(() => { const { player, world, sim, step } = __rdb; const w = sim.cfg.ANCHORS.pilouWindow; player.loc = 'apt'; player.pos.set(world.apt.x1 - 0.5, world.apt.floor, w.z); player.yaw = -Math.PI / 2; player.pitch = -0.6; step(2); })()`

## D. Day systems
| Item | Reach it | Look at | Expected | Capture |
|---|---|---|---|---|
| **D1** Koddex | `qk.to(3, 'koddex')`; pick a side project (dB logger), then the next mornings | 3 prompts, side projects with legality colours, Clode's lines, the Job meter, the « ✔ Livré » end of morning, boss gags | Clode refuses the illegal projects politely and Pilou finishes alone; Job drops when you skip real work | `D1-koddex.jpg` |

## F. Endings (forced state at D14: checks the end screen, not reachability, which the simulator covers)
Reach D14: `qk.to(14, 'cards', { card: 'd14_commission' })`. **Copy the save** (`copy(localStorage.getItem(__rdb.saveKey))`) so you can restore it between endings.
Then per ending: restore the save, `qk.patchSave(...)` with the patch below, reload → **Continuer**, click the choice, read the end screen.

| Ending | Patch (`s` = save) | Choice | Expected | Capture |
|---|---|---|---|---|
| Legal victory | `s.stats.dossier = 85; s.stats.risk = 10; s.flags.push('ac_violation_confirmed','exhaust_meeting_won','tatie_emails_shared')` | 1st « Plaider le dossier complet » | Victory screen; the epilogue cites the gaine moved and Tatie's promises | `F-legal_victory.jpg` |
| Negotiated peace | `s.stats.asso = 85; s.hidden.hostility = 20` | « Tendre la main au bloc » | Charter / peace epilogue | `F-negotiated_peace.jpg` |
| Scandal | `s.flags.push('corruption_proof','press_contacted','seen_complaisance','bribe_photo','waiter_testimony','klaas_log_certified')` | « Faire sortir l'affaire » | Front page; epilogue cites the window photo, Théo's testimony and Klaas's notebooks | `F-scandal.jpg` |
| Custody (+ variants) | `s.stats.risk = 95; s.flags.push('custody','bucket_witnessed','video_viral')`; variants: add `'kitchen_sabotaged','kitchen_sabotage_caught'` (« carbonnade sucrée ») or `'laxative_done','laxative_caught'` | « Improviser » | Custody screen; the variant paragraph appears only with its flags | `F-custody*.jpg` |
| Moving out | `s.stats.sleep = 15; s.stats.asso = 40` | « Improviser » | Wazemmes epilogue | `F-moving_out.jpg` |
| Fired | `s.stats.job = 0` | « Improviser » | Fired screen with the « continue » twist button | `F-fired.jpg` |
| Turncoat (secret) | `s.stats.asso = 40; s.flags.push('carbonnade_1','carbonnade_2','carbonnade_3')` | « Venir… en habitué » | Secret ending; absent from « Fins découvertes » until reached | `F-turncoat.jpg` |
| The return | `s.stats.dossier = 85; s.stats.risk = 10; s.flags.push('bombance_rumour','bombance_bar_project','knows_trou','bombance_wait')` | 1st « Plaider le dossier complet » | Win turned into « Le retour » (La Bombance) | `F-the_return.jpg` |

**F2** (epilogue reflects the playthrough): on each end screen, check that every paragraph matches a patched flag or stat, and that nothing describes something the save doesn't contain.
A file named `F-<id>-UNREACHED.jpg` means the choice was greyed out in the headless run: the patch didn't meet that choice's `requires`.

## G, I. Text and performance
| Item | Reach it | Look at | Expected | Capture |
|---|---|---|---|---|
| **G3** Story bible | 📓 Carnet › Lieux / Règles (flags `knows_trou`, `legal_view`, `bombance_rumour` to see the updates); read `qa/coherence.md` | Names, addresses, dates, rules versus `src/content/README.md` | Consistent with the bible (22:00 since 2026, n°10/13/19/27, the place, « le Trou » only after `knows_trou`) | `G3-carnet-*.jpg` |
| **I3** French copy (Q L) | ❔ Aide, À propos (title screen), plus any card / recap | Typography (’ « » no-break spaces), tu/vous, Ch'ti at most once per scene, tone | Matches `qa/copy.md` conventions; no straight quotes | `I3-help.jpg` |
| **I4** 60 fps | http://192.168.1.163:8090/?nolock=1&seed=11&day=sat&perf=1 → Nuit libre, `__rdb.sim.tick(135)` (≈ 22:45), stand mid-street looking down the street | The ?perf=1 HUD: fps, frame time, draw calls | ≥ 60 fps on the laptop iGPU (≤ 16.7 ms). The headless capture runs on SwiftShader, so its numbers are not meaningful: judge on real hardware | `I4-perf-saturday.jpg` |

## Not covered by a capture
- **A3 / I3 (L)**: the human-feel and duration parts need a real playthrough.
- **B1 gallery**: dev server only (`src/art/gallery/` is not in the production build).

## build (build agent, v0.8: release hardening)
Checks I'd like done in Chrome on http://192.168.1.163:8090 (real browser, pointer lock on: no `?nolock=1` unless stated).

| # | What | How | Expected |
|---|---|---|---|
| b1 | Loading screen | Hard reload (Cmd+Shift+R) with DevTools → Network → "Fast 4G" | Dark screen « Rue des Bouchers », gold bar advancing through « moteur 3D / décor / simulation / textes », then « Construction de la rue… », then the title. Never a black screen. |
| b2 | Chunks | DevTools → Network → JS | Separate `three-*.js`, `art-*.js`, `content-*.js`, `sim-*.js`, `ui-*.js`, `game-*.js`; total transferred < 1 MB gzip. |
| b3 | Error screen | Console: `setTimeout(() => { throw new Error('test QA') })` | French screen « Oups. La rue des Bouchers a planté. », the message under it. « Copier le rapport » → paste somewhere: date, version (git sha), page, browser, save summary, stack. « Recharger » reloads. |
| b4 | Unhandled promise | Console: `Promise.reject(new Error('promesse QA'))` | Same screen. |
| b5 | Old / broken save | Console on the title: `localStorage.setItem('rdb.save.v1', JSON.stringify({ version: 99, day: 3, stats: {} })); location.reload()` | A red notice on the title explains the save can't be resumed and to start a new campaign; `localStorage['rdb.save.backup']` holds the old one; « Campagne » → only « Nouvelle campagne ». |
| b6 | Migrated save | Play a campaign to day 2, then console: `s = JSON.parse(localStorage['rdb.save.v1']); s.version = 1; s.flags.push('igpn_open'); s.cards.unshift({ type: 'event', id: 'supprime' }); localStorage['rdb.save.v1'] = JSON.stringify(s); location.reload()` → Campagne → Continuer | Day 2 resumes without error; `__rdb.campaign.has('inquiry_open')` is true; `__rdb.campaign.migrationNotes` lists « migrée v1 → v2 » and the removed card. |
| b7 | Night start (U6) | Campaign → Descendre dans la rue | No second title screen: the street appears with « Jour N · … cliquez pour descendre dans la rue » (first night: the controls listed); one click captures the mouse. |
| b8 | Échap in the 3D night | Press Échap during a night | With the UI menu (`openMenu`, UI agent): the pause / settings menu opens; « Reprendre » recaptures the mouse. Without it: « Pause. Cliquez pour reprendre. » |
| b9 | Audio cues | Night, sound on (M toggles) | P (photo): shutter. Phone → police: radio crackle, and again when the patrol enters the street. Phone → WhatsApp with photos to share: WhatsApp ping. F at the window: splash. |
| b10 | Free night weekdays | `/?day=mardi` → « Nuit libre » | Header « Mardi · nuit libre »; `?day=sat` adds « (sans voitures) » and the crowd. |

### Design agent results (2026-10-08 23:20, public URL https://rue-des-bouchers.lucaslefort.dev, Chrome)
- b2 ✅ 13 JS chunks (three / world / art / sim / content / narrative / game…), **449 KB transferred** total; title screen interactive at ~5.2 s on a loaded Mac mini (CI measures 147 ms on a clean runner).
- b3 ✅ « Oups. La rue des Bouchers a planté. » with the message, « Recharger » and « Copier le rapport ».
- b5 ✅ a save from a newer version shows the red notice on the title and offers a new campaign; the old save is set aside.
- b10 ✅ `?day=mardi` accepted.
- b1, b4, b6–b9: covered by the e2e suites (robustness / campaign / edge); not repeated by hand.
