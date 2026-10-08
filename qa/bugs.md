# QA: bug list

Maintained by the QA agent. Each bug has a failing test marked `test.fixme` (run them anyway with `QA_RUN_FIXME=1`).
When a bug is fixed, remove the `fixme` (the test then guards against regressions) and move the entry to "Fixed".

## Open

### BUG-005 · Keyboard navigation is impossible in the day UI (Tab is swallowed)
- **Test**: `tests/e2e/edge.e2e.js` › « BUG-005 · une journée au clavier seul (Tab / Entrée) : Koddex puis après-midi »
- **Files**: `src/main.js:369`: the global `keydown` listener does `if (e.code === 'Tab') e.preventDefault();` **before** checking whether a night is running, so it also fires on the title screen and in the whole day UI.
- **Steps**: new campaign, reach the Koddex morning (or any day screen), press Tab repeatedly.
- **Expected**: focus moves through the buttons (prompts, actions, « Continuer », header buttons; `ui.css` already styles `:focus-visible`), Enter activates them.
- **Actual**: `document.activeElement` stays `<body>` after 25 Tabs; nothing in the day UI can be reached without a mouse. Secondary: the Koddex typewriter disables the buttons until it finishes and can only be skipped by clicking the terminal (no key for it).
- **Owner guess**: build agent (main.js): move the Tab `preventDefault` after `if (!started || S.ended) return;` (night only). Optionally the UI agent: let Enter/Space skip the typewriter.


## Notes (not bugs, for the design agent)
- **`?day=`** in the standalone night now accepts all 7 days (`mon…sun` or `lundi…dimanche`), which picks the police roster. The night e2e still tests tip-offs on Monday after 23:00 (Lemaire's shift).
- **Window view**: standing at the window, the sill and Bernadette's awning hide the tables right below. Leaning out (forward to the window frame) shows them (`qa/screens/03b-window-lean.jpg`), and a photo of the nearest Bernadette table from the window works. The raycast ignores the awning, so the photo works even when the table looks hidden. Worth a look in the art pass. → **Fixed (art-v0.7)**: no protruding sill or string course under Pilou's window, recessed panel below it, shallower awning, slimmer parasols (`qa/art-v0.7/window-view.jpg`).
- **Campaign UI** landed (aaa8b88): `tests/e2e/campaign-flow.e2e.js` drives it through the real UI (`data-testid` hooks) and plays nights headless through `c.createNight()` for the 14-day end-screen test.
- **Perf locally** is meaningless at the moment (the Mac mini is overloaded, SwiftShader: 0.3 fps, 133 draw calls, 186k triangles in the Saturday street view). CI's `npm run test:perf` is the reference; the 60 fps budget is a warning there unless `PERF_STRICT=1`.

- **Duration (§13.A)**: see `qa/duration.md`. Both full campaigns land at ~3h05 (target 2h30–4h); the custody run stops at day 5 (1h16), as expected for an early ending.

## Fixed
- **BUG-002** · the Koddex end-of-morning was never shown. Fixed in 69aaa7e (UI agent): `shown()` keeps the Koddex screen until « Quitter Koddex ». Test un-fixme'd in `tests/e2e/campaign-flow.e2e.js`.
- **BUG-003** · the D14 commission speeches were never shown. Fixed by the UI agent's card polish (`cardScreen()` renders `card.scene` as `.ui-scene` bubbles). Regression tests: `campaign-flow.e2e.js` › « BUG-003 (corrigé) » (seed 101 reaches D14, every speech on screen) and the nightly full run.
- **BUG-004** · the last card of a phase lost its result. Fixed in `src/ui/index.js`: `choose()` tags `view.cardResult`, and `shown()` keeps the cards screen while that result is pending (same mechanism as BUG-002). Regression test: `campaign-flow.e2e.js` › « BUG-004 (corrigé) » (fails on the old code, passes now) and the nightly full run's `lostResults` check.
- **BUG-001** · the 3D dachshund and Jérémie didn't follow the sim's evening round. Fixed by the scene director (`src/scene/director.js`, 41c649e/3016a52), which places them on `sim.dogPos()`. The test in `tests/e2e/coherence.e2e.js` is now a regular regression test.
