# QA: bug list

Maintained by the QA agent. Each bug has a failing test marked `test.fixme` (run them anyway with `QA_RUN_FIXME=1`).
When a bug is fixed, remove the `fixme` (the test then guards against regressions) and move the entry to "Fixed".

## Open

### BUG-001 · The 3D dachshund (and Jérémie) never follow the evening round of the simulation
- **Test**: `tests/e2e/coherence.e2e.js` › « BUG-001 · le teckel en 3D suit la ronde de la simulation »
- **Files**: `src/main.js` (no sync of `world.cast.dog` / `world.cast.jeremie` with `sim.dogPos()`), `src/world.js:452-454` (static placement by the building door).
- **Steps**: `/?nolock=1&seed=7`, start, advance to 21:45, compare `world.cast.dog.position` with `sim.dogPos()`.
- **Expected**: between 21:30 and 22:30 (`DOG.start` → `DOG.end`) the drawn dog (and Jérémie) walk the round where the sim puts them. Outside it, they are indoors or by the door.
- **Actual**: both stay by the building door all night (drawn at x −1.85, z −15.3 while the sim has the dog at x 0.8, z −21.0 at 21:45: a 6.3 m gap, growing along the street). The log says « Jérémie passe avec le teckel et note … » and the dog's barks raise witnesses from a place where nothing is drawn. Breaks §13.G « nobody in two places » visually and the §13.C dachshund witness.
- **Owner guess**: build agent (main.js sync, like the waiter and the police) with the art agent's walk animation (the rig already derives walking from movement).

### BUG-002 · The end of the Koddex morning is never shown (« ✔ Livré », Job ±, « Quitter Koddex »)
- **Test**: `tests/e2e/campaign-flow.e2e.js` › « BUG-002 · le bilan de la matinée Koddex reste affiché jusqu’à « Quitter Koddex » »
- **Files**: `src/ui/index.js`: `pick()` calls `c.koddex(picks)`, which moves `c.step` to `cards`/`actions`, then `render()` → `screen()` dispatches on `c.step`, so `koddexScreen()` (with the end-of-morning log and the `koddex-done` button) is never drawn again.
- **Steps**: new campaign, reach the morning, click 3 prompts (one side project).
- **Expected**: the terminal stays up with the delivered projects (`✔ Livré : <result>`), « Fin de matinée. Job ±N » and the « Quitter Koddex (direction la rue) » button; the afternoon starts when the player clicks it.
- **Actual**: the screen jumps straight to the afternoon (or the next card) on the 3rd click: the player never sees the side project's `result` text, the Job change, or the Stéphane warning. `koddex-done` is unreachable.
- **Owner guess**: build agent (src/ui): keep `view.k.done` on screen while `view.k.day === c.state.day`, e.g. `if (view.k?.done && !view.k.left) return koddexScreen()` before the `c.step` switch.

## Notes (not bugs, for the design agent)
- **`?day=` only knows `mon` and `sat`** in the standalone night (`DAYS` in `src/config.js`); any other value silently plays Monday. Fine while the campaign passes the weekday itself, but a QA URL like `?day=tue` misleads (it still shows « Lundi »). The police roster is per weekday, so test tip-offs on Monday after 23:00 (Lemaire's shift).
- **Window view**: standing at the window, the sill and Bernadette's awning hide the tables right below. Leaning out (forward to the window frame) shows them (`qa/screens/03b-window-lean.jpg`), and a photo of the nearest Bernadette table from the window works. The raycast ignores the awning, so the photo works even when the table looks hidden. Worth a look in the art pass.
- **Campaign UI** landed (aaa8b88): `tests/e2e/campaign-flow.e2e.js` drives it through the real UI (`data-testid` hooks) and plays nights headless through `c.createNight()` for the 14-day end-screen test.
- **Perf locally** is meaningless at the moment (the Mac mini is overloaded, SwiftShader: 0.3 fps, 133 draw calls, 186k triangles in the Saturday street view). CI's `npm run test:perf` is the reference; the 60 fps budget is a warning there unless `PERF_STRICT=1`.

## Fixed
_(none yet)_
