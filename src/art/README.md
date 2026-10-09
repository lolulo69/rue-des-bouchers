# src/art: art API (for the build agent)

Everything visual and audio is exposed as functions. **No change to `main.js` is required**: the build agent wires the calls.
The debug page is `http://localhost:5173/src/art/gallery/` (dev server only). Every button there is an example call.
`?perf=1` on the game or the gallery shows FPS, draw calls, triangles and characters drawn / far.

```js
import { art } from './art/index.js';   // filled by buildWorld(); also world.art
import { audio } from './audio/index.js';
```
`art.portrait`, `art.scenes` and `art.audio` work **without** the street (day phases). Everything else needs `buildWorld()`.

## Characters
Every character is an `Object3D` proxy: gameplay can move it, rotate it, hide it (`.visible`) or remove it, as before.
Front = local +Z. Animation runs on real time (`rig.timeSource`; it can be replaced for QA).

| Call | Effect |
|---|---|
| `art.cast.get(id)` | Proxy of a street character (`world.cast[id]`). If they aren't in the street, they're **spawned** (police, mayor's office, press…) |
| `art.cast.spawn(id, { at, face, visible })` | Places a character. `at` = Vector3, `{x,z}` or an anchor name; `face` = angle or point |
| `art.cast.officer('lemaire' \| 'benali' \| 'chef', { bike })` | Officer ready to patrol (on a bike on Saturdays). Replaces `person(0x1b2847)` |
| `art.anim.play(id, state, opts)` | Ready-made state (table below). `opts.seconds` = return to normal afterwards. `opts.expr` = expression |
| `art.anim.stop(id)` | Back to the default state and place |
| `art.anim.expr(id, expr, seconds?)` | `neutral · happy · angry · suspicious · surprised · sick · sad` |
| `art.anim.walk(id, [points], { speed, loop, faceEnd, onDone })` | Walks a path. Returns `{ stop(), promise }` |
| `art.anim.round(true \| false, { loop })` | **The 22:00 round**: Jérémie + Biloute on a leash (`anchors.roundPath`) |
| `art.anim.patrol(idOrProxy, { path, bike, speed, loop, onDone })` | Patrol on foot or by bike (`anchors.patrolPath` by default), plus the radio sound |
| `art.anim.envelope('dede', 'lemaire', { at })` | **The envelope**: Dédé holds out a big envelope with furtive glances; it changes hands at 1.8 s, then both smile. Returns `{ giver, receiver, handoverAt }` |
| `art.anim.react(pos, radius, expr, seconds, anim?)` | People nearby react (e.g. `'sick'`, `'fan'`) |
| `art.anim.after(sec, fn)` / `art.anim.tween(sec, fn(k))` | Small timers on the art clock |

States for `play` (any character can take most of them):

| State | Who (typically) | What it looks like |
|---|---|---|
| `binoculars` / `write` | klaas | Binoculars to his eyes, scanning the street / notebook |
| `bark` | biloute | Barks (`opts.seconds`), small white puffs + sound |
| `smoke` | serveur | Cigarette break, walks to `anchors.smokeSpot` (`{ move: false }` to stay put). **Stop syncing his position** during the break |
| `clean` | ghislain | On a stepladder under the awning, scrubbing brush (`anchors.awningCleanSpot`) |
| `struggle` | ghislain | Bent over the padlock, key that won't turn, angry face, rattling (`anchors.chainSpot`) |
| `greet` | dede | Big smile, hand out, little hops (welcoming the police) |
| `window` | tatie | At her window mid-street, phone in hand, chatting |
| `measure` | delphine | Tape measure unrolled on the ground (`{ length: 2.2 }` m, animated) |
| `clipboard` | delphine | Writing on her clipboard |
| `film` | anyone | Phone raised, screen lit, red REC dot |
| `coffee` | police | Coffee cup, chatting, happy (the coffee table) |
| `type` | pilou | At the keyboard (day vignette) |
| `patrol` / `round` | see above | |
| `fan`, `rush`, `fallen`, `ride`, `give`, `wave`, `tray`, `leash`, `cane`, `idle`, `meeting` | | Raw poses, also usable |

## Terraces
| Call | Effect |
|---|---|
| `art.terrace.collapse(table, seat, { recover })` | The **unscrewed chair** collapses, the customer ends up on their backside (crash sound) |
| `art.terrace.rush(table, n, { door, returnAfter })` | **Laxatives** (comic): n customers get up, hands on their bellies, sweat drop, queue at the estaminet door, « OCCUPÉ » sign, then come back |
| `art.terrace.film(true \| false, { tables, share })` | The crowd films with their phones |
| `art.terrace.parasols('bernadette' \| tables, present)` | **Parasols** gone / back (Bernadette's tables have furled parasols) |

`world.tables[i]` now also has `chairs` (one per guest) and `top` (the table).

## Props
`const h = art.props.place(kind, at?, opts?)` returns `{ kind, object, remove(), set(opts) }`. `at` is optional (default anchor).

| kind | Default anchor | Notes |
|---|---|---|
| `gadget` | `pilouSill` | Small dark box with a blinking light. Generic for any discreet object (`set({ on })`, `opts.color`, `opts.period`) |
| `cardboard` | `exhaust` | Cardboard taped over the exhaust outlet. Pair it with `art.fx.exhaustBlocked(true)` |
| `uritrottoir` | `uritrottoirSpot` | Green planter-urinal, if the city installs it |
| `banner` | `balconyRail` | « LE SOMMEIL EST UN DROIT » (in French; `opts.text`, `opts.length`). Also `pilouBanner` |
| `petition` | `petitionSpot` | Folding table + clipboard + sign |
| `police-coffee` | `coffeeSpot` | Coffees + steaming waterzooi (`opts.rotation`) |
| `chain-lock` | `chainSpot` | Chain and padlock on the chair stack. `set({ glued: true })` = glue drop |
| `stool` | `awningCleanSpot` | Stepladder (used by `clean`) |
| `occupied` | `bernadetteDoor` | « OCCUPÉ » sign (used by `rush`) |

`art.props.line(a, b, { color, radius, sag })` = a thin line with a slight sag from A to B, reusable for anything. `art.props.clear()` removes everything.

## Effects
| Call | Effect |
|---|---|
| `art.fx.splash(from, { wetSeconds })` | Bucket from the window: spray, splashes, **wet cobbles** that dry, customers surprised, sound |
| `art.fx.stink(pos, { seconds, radius })` | Green-yellow cloud + wavy lines, customers fanning themselves |
| `art.fx.exhaustBlocked(true \| false)` | The steam stops, **smoke comes back out through the kitchen** (estaminet door and windows) |
| `art.fx.smoke(pos, opts)` | Generic smoke, returns `{ stop() }` |
| `art.fx.puddle(x, z, r, seconds)` | A puddle on its own |

## Portraits and day vignettes
- `art.portrait(id, expression = 'neutral', { size = 256 })` returns a PNG **dataURL** (cached). Ids come from `src/content/characters.js` (`art.portraitIds()`); expressions are `art.portraitExpressions`. Background colour by group (asso, bloc, police, city, koddex…).
- **Ending tableaux**: `art.scenes.ending(endingId, flags)` (ids from `src/content/endings.js`: legal_victory, negotiated_peace, scandal, custody, moving_out, fired, turncoat, the_return; `flags` = `campaign.state.flags`, e.g. `banners_up` adds the banner). No-argument variants `art.scenes.ending_<id>()` also exist, so `src/ui/vignette.js`'s `set('ending_scandal')` works as is.
- **Weather**: `art.weather.set(kind, intensity, wetness)`, driven by the scene director from `sim.weather()`.
- `art.scenes.koddex()`, `art.scenes.atelier()`, `art.scenes.mairie()` return `{ scene, camera, update(dt), setAspect(a), dispose() }`. Render them with the game's renderer behind the 2D UI: `v.update(dt); renderer.render(v.scene, v.camera)`.

## Audio (`audio` or `art.audio`, v2)
Three buses under a master: **music** (lo-fi by day, a quiet night bed at night and under the title), **ambience** (the street at night: `src/audio/ambience.js`; the Koddex keyboard by day), **sfx** (one-shots, UI sounds, Pilou's footsteps).
- **Scenes are automatic**: the engine looks at the screen 4×/s (`#title` visible → title, `#ui-root` visible or `art.day` running → day, the night street rendering → night). The street and the exhaust hum are only heard at night; never on the title screen. `audio.setScene('hall' | 'off' | …)` forces one, `audio.setScene(null)` goes back to automatic. `audio.mode()` still works (legacy).
- **Mixer (for the settings menu)**: `audio.setVolume('music' | 'ambience' | 'sfx', 0..1)`, `audio.setVolume(0..1)` (master), `audio.setEnabled('music', bool)`, `audio.setMuted(bool)`, getters `audio.mix`, `audio.getVolume(bus)`, `audio.isEnabled(bus)`, `audio.muted`. Persisted in localStorage `rdb.audio.v1`. M (the letter, any keyboard layout, not while typing in a field) toggles mute.
- `audio.play(name, { pos, gain, delay })`. `pos` (Vector3) = panned and attenuated relative to the night camera, muffled when Pilou is indoors. `audio.sounds` gives the list: `cheer · megaphone · birthday · whatsapp · notify · footsteps ({steps, interval}) · radio · splash · shutter · keyboard ({seconds}) · bark · crash · rattle ({repeat}) · paper · rumble · pfff · flush · bell · click`. Loud ones (cheer, megaphone, radio, bell, notifications…) duck the music for a few seconds; `audio.duck(seconds)` does it by hand.
- `audio.loop(name, true|false)`: on-demand loops (`hall` for the day-14 commission, gallery tests). Background music follows the scene by itself.
- **The night street** (wired by `world.js` and `src/scene/director.js`): no continuous crowd murmur (§12e.5: it sounded like rain); sparse discrete cues near you instead: a short tonal « babble » phrase, a laugh, glasses, cutlery, chairs on cobbles (a table going in: all its chairs; a customer leaving: one), Pilou's footsteps (cobbles / parquet / tiles), distant passers-by and cars, the 22:00 bell, rain (`audio.rain(level)`). The **exhaust hum is only in Pilou's flat** (loud at the living-room window, muffled in the back rooms; in the street only a faint hiss right under the duct): rules in `src/audio/mix.js › humMix`, rooms from `world.aptRoomAt(p)`.
- **Positional sources**: `audio.emitter(kind, pos, opts)` → `{ pos, gain, stop() }` for `engine`, `generator`, `talker` (a tonal voice talking), `musette`, `speakers`, `fans`, `sweeper`, `hazard`, `ac`; used by the stage library and the twist staging (src/scene), which also play the one-shots (`voice` {mood calm|ask|angry|shout}, `sing`, `chant`, `cheer`, `sigh`, `applause`, `siren`, `carsiren`, `horn`, `scooter`, `bikebell`, `heels`, `wheels`, `bottle`, `glassbreak`, `snore`, `owl`, `cats`, `window`, `drip`, `whistle`…). `audio.setPower(false)` = power cut (hum off, generator). The director passes `audio.street({ exhaust })` each frame.
- **Robust**: the AudioContext starts on the first gesture and is resumed on every gesture, tab return or state change; no non-finite value reaches WebAudio; a sound error never breaks the game loop. `audio.debug()` returns `{ state, scene, music, mix, buses, street: { gate, room, twist, emitters, hum }, rms }` (tests: `tests/e2e/audio.e2e.js`, `tests/unit/audio-mix.test.js`).

## Anchors (`world.anchors`)
`pilouWindow, pilouSill, pilouBanner, jeremieWindow, balcony, balconyRail, cat, klaasWindow, hildeWindow, tatieWindow, hippolyteDoor, bernadetteDoor, smokeSpot, awningCleanSpot, chainSpot, coffeeSpot, petitionSpot, uritrottoirSpot, roundPath[], patrolPath[], mug, bombance, bloemkool, endroit, dede, ghislain, jeremie, endA, square`.
Everything follows Bernadette's position in `config.js`.

## Performance
Off-screen characters are neither animated nor drawn. Beyond 10 m (`LOD_DIST`) they use simplified geometry with no small details.
The static decor is merged per material **and per 22 m stretch of street**, so frustum culling works.
Measured (Chrome, Mac): weekday 97–120k triangles, Saturday (≈210 characters) ≤ 148k, 115–270 draw calls.

## Graphics quality (`art.setQuality`)
`art.setQuality('bas' | 'moyen' | 'haut')` applies a preset immediately and remembers it (`localStorage` `rdb.quality`). `art.quality.level` is the current level, `art.qualityPresets` holds the labels and values (for the Settings menu), and `art.quality.onChange(fn)` notifies on changes.
On first launch: the level is guessed from the GPU name (software renderer → Bas, integrated Intel/AMD → Moyen, Apple M / NVIDIA / Radeon RX → Haut). A probe of ~120 real frames then drops one level if the average exceeds 21 ms. The probe is off under automation (`?nolock`, `navigator.webdriver`), so tests stay stable.

| | Bas | Moyen | Haut |
|---|---|---|---|
| Rendering resolution (pixel ratio) | 0.75 × (max 1) | 1 | up to 1.5 on dense screens |
| View distance (camera.far) / fog | 60 m / 55 m | 110 m / 95 m | 400 m / 95 m |
| Simplified characters from | 6 m | 10 m | 14 m |
| Distant characters animated | every 4th frame | every 3rd | every 2nd |
| Street point lights | 2 (+ apartment) | 4 | 4 |
| Particles (smoke, rain, splashes) | 40 % | 75 % | 100 % |

Target: 60 fps on a laptop iGPU at « Moyen ».

## Camera (`art.view`)
- **Leaning out**: in the apartment, within ~1 m of the window and looking down (pitch < −0.5), the camera eases 0.4 m towards the street and 0.15 m down. `art.view.set({ lean: false })` turns it off.
- **Title screen**: while `#title` is shown, a slow camera move down the street at dusk, with a more transparent title backdrop (`#title.art-backdrop` class). `art.view.set({ title: false })` turns it off.
Both are applied right before rendering (the game resets its camera every frame, so nothing accumulates); `main.js` doesn't change.

## Night twists (`art.twists`, v1.1)
Props and small scenes for the night twists (§12b.A). The scene director places `sim.twist.props` every frame, i.e. `twist.props` from `src/content/twists.js`.

| id (aliases) | What appears | Moments (`trigger`) |
|---|---|---|
| `birthday_cake` (`balloons`, `candles`) | cake with flickering candles + 5 balloons at Bernadette's table 4 | `song` (the table sings, « Joyeux anniversaire » sound), `blow` |
| `ring_light` (`influencer`, `phone`) | ring light on a tripod + the influencer posing / filming | — |
| `tv_screen` (`football`) | screen above Mal Lunés' awning, a live match, score | `goal` (`{ away }`): « BUT ! », the terraces cheer, crowd roar |
| `evjf` (`megaphone`, `sashes`) | the bride (veil, tiara) and 4 friends with pink sashes, one with a megaphone (shouts) | — |
| `delivery_van` | brewery van in the corridor, hazard lights, beer kegs | — |
| `busker` (`accordion`) | accordion player under Pilou's window, hat and coins; musette while he's there | — |
| `power_cut` (`candles_windows`) | lanterns, street lights and windows off, candles in ~30 windows, the exhaust stops | — |
| `heatwave` (`fans`) | fans in windows, customers fanning themselves | — |
| `fete_voisins` (`bunting`) | gingham tables, bunting across the street, banner, neighbours | — |
| `firefighters` (`fire_brigade`, `tape_measure`) | two sapeurs-pompiers measuring the corridor (tape measure, clipboard) | — |
| `tour_group` (`tour_guide`, `guide_umbrella`) | the guide with her raised umbrella, 8 tourists, back and forth, a stop at the estaminet | — |
| `jury_table` | carbonnade contest: long table at the edge of the estaminet terrace, 3 seated jurors writing (name cards, notebooks, casseroles) | `moment0` / `taste` (writing), `moment1` / `award` / `win` (jury cheers) |
| `trophy` | golden cup on the jury table (or on estaminet table 1); at 22:10 Dédé raises it for 25 s, then it goes back on the table | `moment1` / `award` / `win` |

Manual: `art.twists.show(id)` / `hide(id)` / `trigger(id, moment)` / `clear()`. `sync(ids)` (director) only touches what it placed itself, and silently skips ids it has no builder for (e.g. `white_tablecloth`), so content can list props before art ships them; `trigger` on an unknown id is a no-op.

## Night staging (`src/scene/stage.js`, `src/scene/stageCues.js`, `src/scene/twistLive.js`, §12e.6)
- **Stage library**: `world.stage.play('scooter')` / `play({ id: 'window_opens', who: 'klaas' })` spawns who/what, moves it along its path for a few real seconds with its own positional sound, then cleans up (cast members are borrowed and given back). `STAGE_IDS` lists them: passers-by (heels, suitcase, jogger, lost keys, runner), scooter, bikes, the lost delivery rider, kid on a scooter, tourist asking the way, couple arguing, drunk singer, student choir, bachelor party, dog walkers, street sweeper, taxi, ambulance, police car at the end, wedding car, windows lighting up (opposite, Klaas, Hilde, Tatie, Jérémie, a shouting neighbour), Gaufre on the balcony, rolling bottle, glass breaking, chair falling, toasts, group photo flash, phone on speaker, Dédé's laugh, Ghislain smoking, Seb & Nico laughing, exhaust puff, AC drip, parasol, cat fight, Klaas's binocular glint, rain cues, glass tower, owl, snore, a quiet dip, sunset, the board, the waiter (board, setup, smoke), guitarist, pigeon, bells, a voice.
- **Line cues**: content tags each night line `stage: { cue, at?, dur? }` with a key of `STAGE_CUES` (or `twist:<id>:<n>`, `event:<id>`, `witness:<kind>`); `stageCueError(stage)` validates. The director plays `event.stage` on any sim event, and ambient lines from the journal's `ambient` note (the line's own `stage`, else `AMBIENT_STAGE`).
- **Twists live**: `twistLive.update(sim.twist, min)` stages every twist all evening and fires each moment at its `sim.events[n].at` (audit: `qa/twists-live.md`).
- **The waiter's smoke break** is just around the rue de la Barre corner on the estaminet side (`src/sim/schedule.js › smokeSpot`, out of the terrace's sight); the director walks him there and back via the corner.

## The day in 3D (`art.day`, v1.1)
```js
const ok = await art.day.start('koddex', { host });  // false at quality « Bas »: keep the 2D vignettes (opts.force to ignore)
art.day.onScreenRect((r) => place(terminal, r));     // every frame: { x, y, width, height, corners[4] } in CSS px
art.day.screenRect();                                // the last rectangle (null when the scene has no screen)
art.day.stop();
```
Scenes: **`koddex`** (seated first-person at Pilou's desk: the main monitor faces the camera, which is the rectangle the terminal aligns to; Clode Kode on the second, angled screen; colleagues typing; Stéphane walking past every ~35 s; the window over Lille's rooftops), **`street`** (the street by day: daylight, terraces being set up, a delivery, Klaas and Tatie at their windows, Jérémie and Biloute walking, a slow camera move; it's a second copy of the street, built once, `buildWorld(scene, { role: 'day' })`), **`atelier`** and **`mairie`** (the existing vignettes, same loop). `home` and `commute` follow (§12b.D).
Its own renderer and canvas (fixed, full screen, `z-index: 0`, `pointer-events: none`) at the quality's pixel ratio, up to 60 fps, paused when the tab is hidden. Measured: 2–6 ms per frame (Chrome, Mac).

