# src/sim: simulation (owner: build agent)

Pure, seeded, DOM-free. Everything the UI needs goes through `src/sim/index.js`.
The night (`sim.js`) runs inside a campaign (`campaign.js`), and the campaign evaluates `src/content/*` (§14).

## Load the content (browser)
```js
import { contentFromGlob, createCampaign } from './sim/index.js';
const content = contentFromGlob(import.meta.glob('../content/*.js', { eager: true }));
```

## Campaign: create / save / load
```js
const c = createCampaign({ seed, content });           // new campaign (day 1, morning)
const save = c.save();                                  // plain JSON (state + RNG): store it as is
localStorage.setItem('rdb.save.v1', JSON.stringify(save));
const c2 = createCampaign({ content, save: JSON.parse(localStorage.getItem('rdb.save.v1')) });
// A save from another version throws (/incompatible/): offer « Nouvelle campagne ».
```
Save at every step boundary (after each call below). A night is never saved in progress: reloading during the
`night` step replays that night from the start (`c.createNight()` again). `SAVE_VERSION` is the key's version.

## The step machine: `c.step`
| `c.step` | What to show | Calls |
|---|---|---|
| `'cards'` | `c.card()` → `{ type: 'event'\|'dialogue'\|'countermove'\|'info', id, data, choices: [{ i, label, available }] }`. `data` is the content entry (`title`, `text`, `speaker`, `lines`…). An `info` card has `title`/`text` (engine news, e.g. IGPN). | `c.resolveCard(i)` → the choice's `result` text (or `null`). A greyed choice (`available: false`) throws if picked. Shows the next card, or moves the step on. |
| `'koddex'` (morning) | `c.koddexOptions()` → `{ prompts: 3, work: [texts], sideProjects: [{ id, label, lines, job, risk, available }], gag }` | `c.koddex(['work', 'proj_id', 'work'])` (3 picks; `'work'` = real work) → the side projects' `lines` (terminal output). Then the afternoon starts. |
| `'actions'` (afternoon) | `c.availableActions()` (filtered by `requires`, `once`, remaining time) and `c.state.timeLeft` (slots) | `c.doAction(id)` → `{ result, seen: [{ id, ally }] }` (`seen` = who noticed an illegal or grey act). `c.endAfternoon()` → night. |
| `'night'` | the 3D night (main.js) | `const sim = c.createNight()` ; during the night `c.nightActions(sim)` / `c.doNightAction(sim, id)` ; at the end `c.finishNight(sim)` → night summary |
| `'recap'` | `c.state.lastNight` (same shape as `sim.summary()`) + `c.state.nights.at(-1)` (`{ day, sleep, risk, evidence, gained }`) | `c.nextDay()` (after day 14: final resolution → `'ended'`) |
| `'ended'` | `c.state.ending` = `{ id, title, early, day, canContinue, continueLabel }`, `c.state.epilogue` = matching parts of the ending's epilogue (`{dossier}`, `{pieces}`, `{best}`… already filled in) | if `canContinue` (fired): `c.continueAfterEnding()` continues jobless |

`c.ended` is a shortcut for `step === 'ended'`. **Secret endings** (`secret: true`, e.g. the turncoat) must not appear in any list until reached.

## Read-only state for the HUD / menus (`c.state`)
- `day` (1–14), `phase` (`morning` | `afternoon` | `night`), `c.weekday()` (`'mon'`…), `c.isSaturday()`
- `stats`: `sleep, asso, risk, job, dossier` (0–100). `hidden`: `hostility, corruption` (don't display them).
- `flags` (array), `c.has(flag)`. `evidence`: `[{ id, day, kind, label, quality, legal, value }]`. Only legal pieces count towards `dossier`, while `c.pressFile()` counts everything (press / IGPN).
- `witnessMemories`, `nights`, `journal` (debug), `timeLeft`, `cards` (queue).
- Don't mutate `c.state` from the UI: always go through the calls above (that is what the invariants check).

## The night (main.js, build agent)
`sim.state`, `sim.act({ type: 'photo' | 'db' | 'police' | 'asso' | 'mairie' | 'waiter' | 'bucket' | 'sleep', … })`,
`sim.drainEvents()` (`log` / `clatter` / `splash` / `end`), `sim.summary()`. See `sim.js`.

## Tools
- `npm test`: unit tests (sim, campaign, invariants, linter, names).
- `npm run sim -- --runs 1000 [--write] [--strict] [--fixture] [--bots legal,reckless]`: campaign simulator (§13.H).
- `tests/fixtures/content.js`: minimal content to test the engine without depending on the writing.
