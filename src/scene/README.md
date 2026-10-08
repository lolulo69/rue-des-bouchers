# src/scene: night director

`createDirector({ scene, world, art, audio })` turns the simulation into what you see. The game calls only:

| Call | When |
|---|---|
| `director.update(sim, campaign?.state, dt)` | Every frame (`tick`) |
| `director.onEvent(e)` | For each event from `sim.drainEvents()` (`splash`, `art` from night actions, …) |
| `director.hitTargets()` | Photo raycast: peeing people and police officers (`userData.target`) |
| `director.toggleLegalView()` | L key: terrace zones, passage corridor, encroachment rings |

What it drives (the sim stays the source of truth; the director only shows it):
- **Terraces**: out / cleared, number of guests, recentring out of the corridor, guests' heads.
- **Waiter**: Théo, or his replacement (`CAST.nouveau`: red ponytail, glasses, same apron) when `sim.waiterId === 'nouveau'` (Théo fired); `sim.waiterPos()`, which includes his **cigarette breaks** (`src/sim/schedule.js`: the witnesses see him there too).
- **Ghislain**: on his stepladder while `sim.ghislainCleaning()`.
- **Klaas**: binoculars while `sim.klaasWatching()`, notebook otherwise; Klaas and Hilde go to bed with `klaasAwake()`.
- **Balcony**: the cat, Seb and Nico follow `catPresent()`.
- **The 22:00 round**: Biloute at `sim.dogPos()`, Jérémie behind on the leash, a bark when `dogSpotted` grows. At the door before the round, back upstairs afterwards.
- **Saturday**: standing groups (`sim.state.standing`) and peeing in doorways (`activePees()`).
- **Police**: `art.cast` officers (Lemaire / Benali / the Commandant + a partner, **by bike on Saturdays**), placed at `sim.policePositions()` (route computed by the sim), including the visit at Pilou's door. At the estaminet: Dédé welcomes them; on `complaisance` the coffee table and coffees appear; on `activeBribe()` the envelope changes hands.
- **Exhaust**: steam, and the cardboard + smoke backing into the kitchen while `S.exhaustBlocked`.
- **Campaign flags**: `banners_up` (banners), `cm_counter_banner` (« ICI ON VIT, HEIN ! » on the estaminet), `uritrottoir_installed` / `cm_uritrottoir_terrace`, `camera_window` / `camera_awning` / `camera_found` / `power_stolen` (generic gadget + line).
- **Journal**: an act that was seen **and filmed** (`night-action` with `filmed`) makes customers within 9 m raise their phones for 4 game minutes.
- **Night action events**: `fx`, `prop`, `terrace`, `anim` as written in `nightActions.js` (the props that also have a flag are placed only once).

Scheduled presences live in the sim (`src/sim/schedule.js`); `src/scene/schedule.js` only keeps visual knobs.
