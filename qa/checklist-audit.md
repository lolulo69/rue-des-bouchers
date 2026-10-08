# Checklist audit (GAME_DESIGN §13, proof **T**)

2026-10-08 · design agent · task `checklist-audit`. Every unticked §13 box whose proof includes **T** has been audited.
New proofs: `tests/unit/checklist.test.js` (real content, one `describe` per item) and `tests/e2e/checklist-perf.e2e.js` (§13.I4).
Rule applied: a **T-only** item is ticked when its test passes. A **T Q** item keeps its box open (Q is the design agent's
Chrome session, L is Lucas) and gets `T: <file>` appended. Nothing in the app code was changed. Gaps are `it.todo` and listed below.

| § | Item | Status | Proof | Owner / next step |
|---|---|---|---|---|
| A1 | 14-day calendar, morning → afternoon → night | **T done**, Q pending | `checklist.test.js` §13.A1 (real content: days 1–13 = Koddex → afternoon → night, D14 = Koddex → commission, Monday → Sunday); `campaign.test.js` « calendrier de 14 jours » | Build agent: **a lost commission ends the campaign on the D14 afternoon as an *early* ending** (`moving_out`, `early: true`), so night 14 is skipped, while a won commission plays night 14 and ends at the recap. Pick one rule (I suggest: always end right after the commission, `early: false`). Q: design agent. |
| A2 | Save / continue, reload resumes same day and state | **T done**, Q pending | `checklist.test.js` §13.A2 (real content: save on D3, JSON reload, identical state on D6); `campaign.test.js` « sauvegarde »; `tests/e2e/campaign.e2e.js` (reload in the browser) | Q: design agent |
| A5 | Fixed events on their day (D4, D6, D7, D9, D11, D13, D14; Saturday nights) | **T done**, Q pending | `checklist.test.js` §13.A5 (each fixed event exactly once, on its day and phase; nights 6 and 13 are the Saturday variant) | Q: design agent |
| B3 | Each association member ≥ 8 contextual lines + ≥ 1 action/event | **T done**, Q pending | `checklist.test.js` §13.B3 (the 7 members of §2) | Content (dialogue): **Régis** (added later as the traitor, group `asso`) has only 7 entries. Add 1 if he counts as a member. |
| C3 | Witnesses / line of sight, darkness, time, disguise | **T done**, Q pending | `witness.test.js` (Klaas asleep at 01:00, binoculars, cat = Seb & Nico, waiter/customers filming, darkness, Risk only if seen); `campaign.test.js` « déguisement », « la ronde de Jérémie » (dachshund) | Q: design agent |
| C5 | Mayor's office: reports, announced vs surprise inspector visit | **✅ ticked** | `checklist.test.js` §13.C5 (night report → evidence, afternoon report; D9: surprise only via `delphine_channel` / `heritage_angle`, announced path stalls the case) | — |
| D1 | Koddex: 3 prompts, work vs side projects, Job, gags | **T done**, Q pending | `koddex.test.js`, `campaignFeatures.test.js` (work gating, side projects incl. dB logger / WhatsApp bot, Job costs, gags' `when`) | Q: design agent |
| D2 | Afternoon actions (meeting, mairie, emails, press, lawyer, petition, ARS, recruiting, uritrottoir, dinner) | **✅ ticked** | `checklist.test.js` §13.D2 (each one played by the engine from a state that allows it) | — |
| D3 | All §8 counter-moves can trigger | **❌ open** (10/12 proven) | `checklist.test.js` §13.D3: 10 counter-moves proven by the engine; 2 `it.todo` | **Bug** (engine/content): `buildCards()` only reveals counter-moves in the **afternoon**, but `tatie_mail_01…12`, `cm_bins`, `cm_bins_again` (and any `when.phase: 'morning'` entry) are morning ones, so they **never trigger**. This is also why they are unreachable in `coverage.test.js`. Fix: build agent (honour `when.phase` for counter-moves, like dialogue), or countermoves writer (move them to the afternoon). The todos turn into tests once fixed. |
| E1 | Legal actions of §6 | **✅ ticked** | `checklist.test.js` §13.E (cost, effect, consequence; afternoon ones played); night ones: `nightActions.test.js`, `rules.test.js`, `police.test.js`, `campaign.test.js` « relevé dB » | — |
| E2 | Grey actions of §6 | **✅ ticked** | same; a grey act's consequence = effects if seen, Risk, or content that reacts to its flag | — |
| E3 | Illegal actions of §6 | **✅ ticked** | same (incl. wifi → reading reservations / emails / quotes, back-room photo; the laxative variant is also in content) | — |
| F1 | All 8 endings reachable | **T done (engine)**, Q pending | `checklist.test.js` §13.F1 (each ending reached by a seeded campaign in the matching state; epilogue filled; fired = early + can continue) | Reachability **by the bots** is F3 (balance): today the bots never reach `fired`, `turncoat`, `scandal` (`coverage.test.js`) |
| F2 | Epilogue references what the player did | **T done**, Q pending | `checklist.test.js` §13.F2 (legal victory: Colette dinner photo and formal notice parts appear only if the player did them; every ending has ≥ 2 conditional parts) | Q: design agent |
| F3 | Simulator reaches every ending, ≥ 2 % of 1000 runs of its target bot | **Balance agent** | `qa/balance.md` (latest run: legal 100 % legal victory, mixed 95 % turncoat, diplomat 0 % peace) · `coverage.test.js` (unreached endings) | Balance agent |
| G1 | Invariants on every simulated night and campaign | **✅ ticked** | `invariants.test.js` (police after a call, table return only after tip-off, evidence → real event, Risk only if witnessed, Klaas only logs what he sees); `campaign.test.js` « 6 bots × 15 campagnes »; `checklist.test.js` §13.G1 (Pilou's night actions never overlap in time, one patrol at a time, La Bombance has no terrace and only an event opens it) | The two new G1 checks are proxies: the sim has no free-moving actors or shops to check more directly. |
| G2 | No spoilers; flags checked by the content linter | **✅ ticked** | `content-lint.test.js` (every flag declared and settable); `checklist.test.js` §13.G2 (locked facts of the story bible's spoiler rule: Théo, Régis's betrayal, Lemaire's free meals, the Bombance bar, reservations book, unsigned quotes, are only mentioned behind their flag, or by the entry that reveals them; self-test on a fabricated leak) | Content writers: extend `GATES` when the spoiler rule grows |
| H1 | Balance targets met, logged in `qa/balance.md` | **Balance agent** | `qa/balance.md` | Balance agent (3 targets ❌ in the last run) |
| H2 | No dominant action (< 25 points) | **Balance agent** | — (no test yet) | Balance agent |
| I4 | 60 fps on an iGPU, loads < 5 s, bundle < 3 MB | **T partly**, Q pending | `checklist-perf.e2e.js`: bundle **1.1 MB total** (✅ < 3 MB); title screen 147 ms in CI (✅ < 5 s); frame time (median / p95) logged | 60 fps on a laptop iGPU = Q (CI renders on CPU with SwiftShader). Q: time to the first night frame. |

## Notes for Q / L (observed while writing the tests, not ticked)
- Coverage by the 6 bots (`coverage.test.js`, 12 seeds): 324/448 content ids. The morning counter-moves (D3 bug) account for 14 of them.
- **Load time**: 6.4–6.7 s locally (Mac mini at load 10–20) versus 147 ms in CI: the local figure was machine contention.

## CI status of the new tests
Probe run on a scratch branch (CI run 37810080114, green): `checklist.test.js` ✅; `checklist-perf.e2e.js` ✅ with
**bundle 1.1 MB**, **title screen 147 ms after navigation**, frame time median 1.17 s / p95 2.5 s under SwiftShader with the other
e2e tests running in parallel (meaningless for 60 fps: Q on a real iGPU). The load check stops at the title screen. The time to the
first rendered frame of a night (3D world + sim) is worth checking in the Q session.
