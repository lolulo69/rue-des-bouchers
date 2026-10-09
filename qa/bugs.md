# QA: bug list

Maintained by the QA agent. Each bug has a failing test marked `test.fixme` (run them anyway with `QA_RUN_FIXME=1`).
When a bug is fixed, remove the `fixme` (the test then guards against regressions) and move the entry to "Fixed".

## Open

### BUG-010 · CRITICAL · A photo on a twist night with an extra table crashes the game (every campaign's night 4)
- **Test**: `tests/e2e/v11.e2e.js` › « BUG-010 · nuit à twist (J4) : photographier les tables ne plante pas le jeu » (`QA_RUN_FIXME=1` to run it; fails on main).
- **Files**: `src/sim/twistNight.js:40` adds twist tables with ids like `bernadette-x1`; `src/world.js:421` builds each table's view with `Number(l.id.split('-').pop()) - 1` as its index, so the view's id becomes `bernadette-NaN`; `src/game.js:276` (`photo()`) then does `viewTables.get(t.id).hit` on the sim's id → `undefined.hit` → « Cannot read properties of undefined (reading 'hit') » → the fatal error screen.
- **Steps**: new campaign (seed 3), play to night 4 (the D4 twist adds « la table de Colette » at the estaminet), answer the dinner night event, press P on the terrace.
- **Expected**: a photo (or « rien d'exploitable »).
- **Actual**: « Oups. La rue des Bouchers a planté. » (fatal screen). Any twist with `sim.tables` (D4 Colette, the birthday at table 4, the EVJF, the jury table) crashes the night the moment the player takes a photo; other code paths that look up `viewTables` by sim id may too. Found by the flow album at fe57180 (it crashed at the end of night 4).
- **Owner guess**: art agent (`world.js`) with the build agent: in `buildWorld`, keep the sim's id on the view (`const v = buildTable(r, l.x, l.z, i, scene, l.count); v.id = l.id; tables.push(v)`, with `i` the position in `opts.tables`), and make `game.js` tolerate a missing view (`viewTables.get(t.id)?.hit` + `.filter(Boolean)`). Two lines.


### BUG-007 · The D14 commission's verdict text is skipped: the screen jumps straight to the ending
- **Test**: `tests/e2e/fullrun.e2e.js` › « BUG-004 (corrigé) · le résultat de la dernière carte d’une phase est affiché » (fails after a full run whose commission choice has a `result`: `lostResults: [{ day: 14, id: 'd14_commission', step: 'ended' }]`).
- **Files**: `src/ui/index.js` › `shown()`: `c.step === 'ended'` takes priority over `view.cardResult` (my BUG-004 fix, b0677ae), so `choose()`'s result card is never drawn when that choice ends the campaign.
- **Steps**: full run « mixte malin » (seed 505): D14, pick « Faire sortir l’affaire de corruption le matin même dans La Voix du Nordiste ».
- **Expected**: the choice's `result` (« La une du journal : « Terrasses et waterzooi : la police municipale mange-t-elle à l’œil ? » La salle bruisse. Colette se découvre un rendez-vous urgent… ») shows, then « Continuer » → the ending screen.
- **Actual**: the ending screen appears immediately; the commission's verdict narration, the climax of the campaign, is never seen. Same for every D14 pitch with a `result`.
- **Owner guess**: UI agent (src/ui): in `shown()`, test `view.cardResult` before `ended` (`view.cardResult ? 'cards' : c.step === 'ended' ? …`); `result-next` then clears the view and the ending renders. One line. (Not fixed by QA: the gamepad agent is editing src/ui.)


## Notes (not bugs, for the design agent)
- **`?day=`** in the standalone night now accepts all 7 days (`mon…sun` or `lundi…dimanche`), which picks the police roster. The night e2e still tests tip-offs on Monday after 23:00 (Lemaire's shift).
- **Window view**: standing at the window, the sill and Bernadette's awning hide the tables right below. Leaning out (forward to the window frame) shows them (`qa/screens/03b-window-lean.jpg`), and a photo of the nearest Bernadette table from the window works. The raycast ignores the awning, so the photo works even when the table looks hidden. Worth a look in the art pass. → **Fixed (art-v0.7)**: no protruding sill or string course under Pilou's window, recessed panel below it, shallower awning, slimmer parasols (`qa/art-v0.7/window-view.jpg`).
- **Campaign UI** landed (aaa8b88): `tests/e2e/campaign-flow.e2e.js` drives it through the real UI (`data-testid` hooks) and plays nights headless through `c.createNight()` for the 14-day end-screen test.
- **Perf locally** is meaningless at the moment (the Mac mini is overloaded, SwiftShader: 0.3 fps, 133 draw calls, 186k triangles in the Saturday street view). CI's `npm run test:perf` is the reference; the 60 fps budget is a warning there unless `PERF_STRICT=1`.

- **Duration (§13.A)**: see `qa/duration.md`. Both full campaigns land at ~3h05 (target 2h30–4h); the custody run stops at day 5 (1h16), as expected for an early ending.

## Fixed
- **BUG-008** · the night card never showed the twist (UI called `c.tonightTwist()`, the engine had `c.twistTonight()`). Fixed by the build agent in 13e6ec1 (the engine answers `c.tonightTwist()`). Test: `v11.e2e.js` › « la carte de nuit annonce le twist du soir ».
- **BUG-009** · « Nouveau » cards lost their title/text/hint (the UI read them from the unlock id string). Fixed in 13e6ec1 / fe57180 (object payload, UI falls back to the card). Test: `v11.e2e.js` › « une carte « Nouveau » s’affiche ».
- **BUG-005** · Tab was swallowed in the day UI (the 3D game's global `keydown` cancels Tab for the night dossier). Fixed in `src/ui/index.js` (UI agent, ui-v0.9): while the day UI is on screen, a capture listener stops Tab before the game's handler without cancelling it; Enter/Space (or a click) now also skip the Koddex typewriter. Test un-fixme'd: `edge.e2e.js` › « BUG-005 ».
- **BUG-006** · the production build bundled `ui.html`'s `standalone.js` into the game's `ui` chunk, mounting a second, engine-less day UI (campaigns ran without the 3D night). Fixed by the build agent in c70745b. Guard test: `edge.e2e.js` › « BUG-006 (corrigé) » (one `.ui-layer`, no `window.__rdbUi`, the campaign belongs to the game's UI).
- **BUG-002** · the Koddex end-of-morning was never shown. Fixed in 69aaa7e (UI agent): `shown()` keeps the Koddex screen until « Quitter Koddex ». Test un-fixme'd in `tests/e2e/campaign-flow.e2e.js`.
- **BUG-003** · the D14 commission speeches were never shown. Fixed by the UI agent's card polish (`cardScreen()` renders `card.scene` as `.ui-scene` bubbles). Regression tests: `campaign-flow.e2e.js` › « BUG-003 (corrigé) » (seed 101 reaches D14, every speech on screen) and the nightly full run.
- **BUG-004** · the last card of a phase lost its result. Fixed in `src/ui/index.js`: `choose()` tags `view.cardResult`, and `shown()` keeps the cards screen while that result is pending (same mechanism as BUG-002). Regression test: `campaign-flow.e2e.js` › « BUG-004 (corrigé) » (fails on the old code, passes now) and the nightly full run's `lostResults` check.
- **BUG-001** · the 3D dachshund and Jérémie didn't follow the sim's evening round. Fixed by the scene director (`src/scene/director.js`, 41c649e/3016a52), which places them on `sim.dogPos()`. The test in `tests/e2e/coherence.e2e.js` is now a regular regression test.
