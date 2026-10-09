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

## Audio (`audio` or `art.audio`)
- `audio.play(name, { pos, gain, delay })`. `pos` (Vector3) = panned and attenuated relative to the camera. `audio.sounds` gives the list: `whatsapp · notify · footsteps ({steps, interval}) · radio · splash · shutter · keyboard ({seconds}) · bark · crash · rattle ({repeat}) · paper · rumble · pfff · flush · bell · click`.
- `audio.loop(name, true|false)`: `lofi` (day phase, procedural), `hall` (commission hall, day 14), `typing` (Koddex keyboard).
- `audio.mode('night' | 'day' | 'hall' | 'off')`: in any mode other than `night`, the street ambience (murmur, exhaust) falls silent. The loops are separate.
- Always on: M = mute. It starts on the first click/key, and the 22:00 bell reads `world.gameMinutes`, or otherwise `__rdb.sim.state.min`.

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

## The day in 3D (`art.day`, v1.1)
```js
const ok = await art.day.start('koddex', { host });  // false at quality « Bas »: keep the 2D vignettes (opts.force to ignore)
art.day.onScreenRect((r) => place(terminal, r));     // every frame: { x, y, width, height, corners[4] } in CSS px
art.day.screenRect();                                // the last rectangle (null when the scene has no screen)
art.day.stop();
```
Scenes: **`koddex`** (seated first-person at Pilou's desk: the main monitor faces the camera, which is the rectangle the terminal aligns to; Clode Kode on the second, angled screen; colleagues typing; Stéphane walking past every ~35 s; the window over Lille's rooftops), **`street`** (the street by day: daylight, terraces being set up, a delivery, Klaas and Tatie at their windows, Jérémie and Biloute walking, a slow camera move; it's a second copy of the street, built once, `buildWorld(scene, { role: 'day' })`), **`atelier`** and **`mairie`** (the existing vignettes, same loop). `home` and `commute` follow (§12b.D).
Its own renderer and canvas (fixed, full screen, `z-index: 0`, `pointer-events: none`) at the quality's pixel ratio, up to 60 fps, paused when the tab is hidden. Measured: 2–6 ms per frame (Chrome, Mac).

