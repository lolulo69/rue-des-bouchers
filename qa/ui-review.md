# UI review (design agent, Chrome QA)

## 2026-10-08 18:15 · deployed ceb1aa8 · new campaign, seed 11, day 1 → day 2 + reload
Works end-to-end with no console errors: new campaign → event card → Koddex → afternoon actions → night (N menu, stink bomb, witness tutorial) → recap → day 2 → reload shows « Continuer (jour 2) ». 

| # | Where | Problem | Fix | Owner |
|---|---|---|---|---|
| U1 | Koddex | The 3 `<select>` default to the same work item, so the same result prints 3× | Default to 3 different items, forbid duplicates, and show prompts as clickable cards (cute terminal look), not native selects | ui |
| U2 | Campaign start | The 6 intro cards (intro.js / narrative.introCards) aren't shown before day 1 | Show them once on a new campaign (skippable) | ui |
| U3 | Dialogue boxes | No portraits | Use art.portrait(id, expression) (on main), with an initials fallback | ui |
| U4 | Flow | 4 dialogue boxes in a row (Régis, Dédé, Jérémie ×2) before the night: heavy | Max 1 dialogue box per phase transition; merge consecutive lines from the same speaker into one box; extras go to the phone feed or are skipped | ui (+ narrative selection) |
| U5 | Afternoon | The action list is flat: no legal/grey/illegal grouping, no cost/effects hint, no greyed unavailable actions with a reason | Group + colour by legality, show the cost in slots, grey out with « pourquoi » | ui |
| U6 | Night start | Double confirmation: « Descendre dans la nuit » then a title screen « Commencer la nuit » | Remove the second screen in campaign mode (keep the controls hint as a small overlay on the first night) | build (main.js) |
| U7 | Night recap | Bare (one sentence + numbers) | Add the recapHeadline, stat deltas (▲▼), a Klaas notebook excerpt, police log, and a phone feed preview | ui |
| U8 | Phone | The feed isn't surfaced in the day flow | A phone notification badge between phases + T opens it; the morning shows the overnight WhatsApp messages | ui |
| U9 | Look | Plain dark cards over the blurred 3D street; art.scenes.koddex/atelier/mairie vignettes are unused | Use the vignettes behind the Koddex/afternoon/commission screens; warmer card style matching §10 | ui (+ art API) |
| U10 | Carnet / Aide / À propos | `src/content/codex.js` (`CODEX`) has no screen yet | A **Carnet** screen on key **C** (and a 📓 button in the day header) with three tabs, Personnes / Lieux / Règles. Show only the cards whose `when` matches (`c.check(card.when)`), each with its portrait (`speaker`), `text`, `position`, `quote`, and under it every `updates[]` line whose `when` matches. Mark a card « nouveau » the first time it appears. Plus **Aide** (`CODEX.help`, ≤ 10 short cards, from the title screen and the pause menu) and **À propos** (`CODEX.about.lines`, from the title screen). Also bind **M** to mute: the help text doesn't mention it until it exists | ui |
