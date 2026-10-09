# Balance log

Owned by the design agent. Every run: commit, bots, numbers, knobs changed and why.
Targets: GAME_DESIGN.md §13.H.

## 2026-10-08 · night-level baseline · commit 3f9810b (v0.2)
300 seeded nights per bot × day, `runNight` with the v0.2 bots (averages at the end of the night).

| bot | day | sleep | asso | risk | evidence pieces | custody | police acted / calls |
|---|---|---|---|---|---|---|---|
| passive | mon | 47 | 50 | 0 | 0 | 0% | – |
| passive | sat | 25 | 50 | 0 | 0 | 0% | – |
| legal | mon | 73 | 96 | 0 | 19.6 | 0% | 40% |
| legal | sat | 38 | 100 | 0 | 32.6 | 0% | 35% |
| legal (as the asso) | mon | 74 | 96 | 0 | 19.7 | 0% | 50% |
| reckless (bucket) | mon | 62 | 30 | 72 | 0 | 0% | – |
| stealthy (bucket) | mon | 48 | 49 | 5 | 0 | 0% | – |
| stealthy (bucket) | sat | 25 | 49 | 5 | 0 | 0% | – |

Perf: 0.3–1.3 ms per simulated night, so 1000 14-day campaigns × 6 bots ≈ 1–2 min. OK.

### Findings → to fix in the v0.4 campaign tuning
1. **Asso saturates in one night** (50 → 96–100 for the legal bot). Over 14 nights it must climb slowly: cap the asso gain per night (~+8)
   and give diminishing returns for photos shared on the same night.
2. **Evidence is far too generous**: 20–33 pieces a night vs a dossier target of 12. A single night completes the dossier. Fix: one piece per
   infraction *type* per table per night counts fully, repeats count ×0.2; the campaign dossier target must be built over ~8–10 nights;
   evidence quality matters at the commission.
3. **Reckless bucket: 72 Risk in one night but 0% custody**. At campaign level Risk must persist (slow decay, e.g. −5/day) so reckless play
   reaches custody by night 5–8 (target ≥70%).
4. **Stealthy bucket has no measurable effect** (sleep the same as passive, risk ~5). Expected at this stage: the stealth toolbox comes in v0.5.
   Make sure the stealthy bot has *impact* then (target: scandal reachable, custody ≤40%).
5. **The police act 35–50% of the time**: fine as a starting point; corruption must drag it down early and IGPN exposure must lift it.

## 2026-10-08 · first campaign-level run · commit 3d31dd7 (v0.4 engine + full content)
`npm run sim -- --runs 300` (300 campaigns × 6 bots, 201 s). Invariants: ✅ no violation.

| bot | outcome | §13.H target | verdict |
|---|---|---|---|
| passive | 100% moving out | ≥ 90% defeat | ✅ |
| legal careful | **100% legal victory**, dossier 100, asso 100 | legal victory 35–60%, never custody | ❌ far too easy |
| illegal reckless | 100% custody (median night 5) | ≥ 70% custody | ✅ (maybe too deterministic) |
| illegal stealthy | 79% moving out, 9% custody, 5% legal, 6% the return | ≤ 40% custody, scandal reachable | ⚠️ custody OK, **scandal 0%**, sleep collapses to 3 |
| mixed smart | **95% turncoat** | best average score | ❌ the secret ending dominates |
| diplomat | 58% the return, 42% legal victory | negotiated peace ≥ 40% | ❌ **peace 0%** |

Never reached: endings **fired, scandal, negotiated_peace**. 9/64 actions (the whole mayor/Lescaut chain, internal police investigation (IGPN) report, Lemaire transfer, lawyer + formal notice, Tatie's emails, the uritrottoir follow-up), 2/27 events, 19/42 counter-moves (**all 12 Tatie emails**, the bins, the Colette call…), and 34/120 dialogue lines (the sim may not surface dialogue: check).

Diagnosis to confirm: dossier/asso still saturate (see the night baseline findings 1–2); "the return" should be an epilogue variant of a win, not an outcome that competes with it; the turncoat condition is too loose for a *secret* ending; the peace/scandal conditions are unreachable; the Tatie email triggers never match.
→ Assigned to the balance agent.

## 2026-10-08 · balance pass 1 (balance agent) · all §13.H targets met, all 8 endings reached
`npm run sim -- --runs 1000 --detail` on the sim box (CT 106), 1000 campaigns × 7 bots in 92 s. Invariants: ✅ no violation.
« le retour » is counted as the win it sits on (`baseEnding`): its column shows the twist; the score and targets use the underlying win.

| bot | custody | fired | legal_victory | moving_out | negotiated_peace | scandal | the_return | turncoat | score | sommeil | asso | risque | job | dossier | garde à vue (nuit méd.) | cibles §13.H |
| passif | · | · | · | 100% | · | · | · | · | 0 | 10 | 40 | 0 | 100 | 11 | – | ✅ ≥ 90 % déménagement / défaite |
| légal prudent | · | · | 50% | 4% | · | 47% | · | · | 82 | 43 | 100 | 0 | 92 | 51 | – | ✅ victoire légale 35–60 %<br>✅ jamais de garde à vue |
| illégal imprudent | 100% | · | · | · | · | · | · | · | -20 | 77 | 1 | 95 | 32 | 14 | 5 | ✅ ≥ 70 % garde à vue / procès |
| illégal discret | 1% | · | · | 97% | · | 1% | 1% | · | 1 | 0 | 13 | 27 | 53 | 21 | 9 | ✅ ≤ 40 % garde à vue<br>✅ scandale atteignable |
| mixte malin | · | · | 75% | 6% | · | 20% | · | · | 89 | 30 | 100 | 1 | 58 | 55 | – | ✅ meilleur score moyen |
| diplomate | · | · | · | 14% | 20% | 12% | 48% | 5% | 67 | 61 | 87 | 2 | 88 | 33 | – | ✅ paix négociée ≥ 40 % |
| tire-au-flanc | · | 100% | · | · | · | · | · | · | 10 | 99 | 74 | 0 | 0 | 21 | – | ✅ licenciement atteignable (≥ 2 %, §13.F) |

Commission choice (p10/50/90 dossier · asso · hostility at the end):
| bot | commission | dossier | asso | hostility |
|---|---|---|---|---|
| legal | #1 AC plea 50 %, #5 scandal 47 %, #7 improvise 4 % | 46/51/56 | 100/100/100 | 100/100/100 |
| mixed | #1 75 %, #5 20 %, #7 3 % | 49/55/60 | 100/100/100 | 100/100/100 |
| diplomat | #3 charter 50 %, #5 scandal 31 %, #6 « en habitué » 5 %, #7 14 % | 29/33/38 | 75/96/100 | 23/62/95 |

**§13.F (each ending ≥ 2 % of 1000 runs of its target strategy)**: legal victory 50 % (legal) · negotiated peace 20 % + 48 % with the Bombance twist (diplomat) ·
scandal 20 % (mixed), 47 % (legal) · custody 100 % (reckless) · moving out 100 % (passive) · fired 100 % (slacker) · turncoat 5 % (diplomat) · the return 48 % (diplomat). ✅

**§13.H no dominant action** (`--ablate mixed`, 1000 campaigns, win = legal / peace / scandal / return, base 95 %): biggest shifts
`pm_klaas_roster` −17, `pm_klaas_notebook` −15, `night_bribe_photo_window` −6, `pm_press_contact` −6, everything else ≤ 2. Max 17 < 25. ✅
(Before the bot fixes below, the 22:00 round alone was −33: mixed's dossier median sat exactly on the commission's ≥ 50 bar.)

### Knobs changed and why
| knob | was | now | why |
|---|---|---|---|
| `CAMPAIGN.nightEvidenceScale` | 1.2 | 0.065 | ~15 dossier points a night, every night, for any legal bot (the same infractions are re-photographed nightly): dossier 100 by night 4. Tuned so the careful legal bot's median lands on the commission's ≥ 50 bar (AC plea; its heritage route to `ac_violation_confirmed` is nearly always open). 0.07 → 59 %, 0.065 → 50 %. |
| `CAMPAIGN.contentDossierScale` (new) | – (1) | 0.3 | Content alone (`dossier: +N` on events, actions, Koddex) gave ~50 points: the commission bar was met without a single night. |
| `CAMPAIGN.contentAssoScale` (new) | – (1) | 0.5 | Asso hit 100 by night 3 from afternoon actions. |
| `CAMPAIGN.assoDecayPerDay` (new) | – (0) | 4 | Support erodes towards `start.asso` if not fed. |
| `ASSO.nightGainCap` | 8 | 4 | Same (finding #1). |
| `POLICE.fineHostility` (new) | – (0) | 11 | The diplomat ended at hostility 15 ± 2, so the charter (hostility < 60) was a sure thing and nothing else mattered. A PV after a call now angers the bloc, and whether a call ends in a PV depends on which patrol comes: the peace route gets real variance (hostility p10/50/90 23/62/95, peace ≈ 68 %). Earlier sweep, with an older diplomat bot: 4 → charter chosen in 87 % of runs, 13 → 33 %. |
| ending `turncoat` | `carbonnade_3` + `commission_done` | + not won, not lost (the « en habitué » choice) + `asso < 60` | Rare and deliberate (95 % of mixed runs before). Moving out got the matching habitué-with-asso-≥-60 branch, otherwise the engine fallback (lowest priority = peace) handed out a free win. |

### Engine / tooling (small diffs, see Build notes)
- Morning counter-moves were never built (all 12 Tatie emails, `cm_bins`): fixed in `buildCards`.
- `scripts/sim.js`: `--set`, `--detail`, `--ablate`; the_return scored as its win.

### Bots (they play their strategy competently, no cheating)
Scoring counts the real gain (config scale, headroom), only new flags score, and the win flags are weighted in ending order. Night content goes through `availableNightActions`, and illegal acts happen only when the act's own witnesses can't see.
Stealthy: sleeps 23:15–00:50, one police call, asks the waiter, uses press contact + waiter testimony as legal stepping stones.
Mixed = legal + naps when tired + safe grey/illegal + dossier focus. Diplomat: one call a night, gives up and changes sides if peace is out of reach late.
New **slacker** bot (side projects + naps) → fired.

### Still open
- **Asso still sits at 100** for legal / mixed / diplomat (finding #1 only half fixed). Lower asso (cap 2–3, decay 6–8) makes the police and the waiter less effective, so sleep collapses and every legal-ish bot moves out. The asso economy needs a design look (what asso *buys* beyond the peace charter), not just smaller numbers.
- **Legal bot: 47 % scandal**: when its dossier misses the bar, the careful legal player brings the press article (corruption proof via Klaas's notebook / the window photo is legal). §13.H says "otherwise peace or defeat"; scandal isn't custody, but if it should stay out of a careful legal run, `pm_klaas_notebook` / `pm_press_scandal` are the levers.
- **The return is common** (48 % of diplomat runs): the diplomat never gets the heritage angle or a lawyer, so it can't block the bar project. It's a twist on a win and scores as one, but as a "wink" it's frequent.
- **Stealthy moves out 97 %**: illegal-only has no tool against noise apart from the one-off cardboard. Its targets are met (custody 1 %, scandal reachable), but it's a weak strategy.
- **The legal win is a cliff** (dossier p10–p90 spans ~10 points around the bar): new content that adds or removes ~3 dossier points moves the legal rate by ~10 points. Re-run `npm run sim -- --runs 1000` after content changes.
- Never used: `night_saboter_cuisine`, `night_laxatif_carbonnade`, `night_backroom_photo`, `pm_bloc_fooled` (+3 counter-moves that follow them); `r_aot_pdf` can't fire (content condition, see Build notes).

## 2026-10-08 · balance pass 1b · retune after main moved (scheduled presences, Koddex once-per-morning, new events)
On main 3b36eac the pass-1 values gave: legal victory **33 %** ❌, turncoat 1 % ❌, the return **0 %** ❌ (the diplomat now gets the heritage angle and blocks the bar project).
`npm run sim -- --runs 1000 --detail` after the changes below, 1000 campaigns × 7 bots, invariants ✅:

| bot | custody | fired | legal_victory | moving_out | negotiated_peace | scandal | the_return | turncoat | score | sommeil | asso | risque | job | dossier | garde à vue (nuit méd.) | cibles §13.H |
| passif | · | · | · | 100% | · | · | · | · | 0 | 11 | 38 | 0 | 100 | 12 | – | ✅ ≥ 90 % déménagement / défaite |
| légal prudent | · | · | 48% | 6% | · | 45% | · | · | 80 | 51 | 96 | 0 | 100 | 50 | – | ✅ victoire légale 35–60 %<br>✅ jamais de garde à vue |
| illégal imprudent | 100% | · | · | · | · | · | · | · | -20 | 76 | 3 | 95 | 37 | 14 | 5 | ✅ ≥ 70 % garde à vue / procès |
| illégal discret | 2% | · | · | 91% | · | 5% | 2% | · | 4 | 1 | 12 | 28 | 77 | 22 | 10 | ✅ ≤ 40 % garde à vue<br>✅ scandale atteignable |
| mixte malin | · | · | 82% | 5% | · | 13% | · | · | 92 | 35 | 96 | 0 | 74 | 54 | – | ✅ meilleur score moyen |
| diplomate | · | · | · | 6% | 30% | 6% | 52% | 6% | 78 | 72 | 93 | 0 | 100 | 33 | – | ✅ paix négociée ≥ 40 % |
| tire-au-flanc | · | 99% | 0% | 0% | · | 0% | · | · | 10 | 82 | 90 | 2 | 0 | 30 | – | ✅ licenciement atteignable (≥ 2 %, §13.F) |

| change | was | now | why |
|---|---|---|---|
| `CAMPAIGN.nightEvidenceScale` | 0.065 | 0.073 | Legal median dossier fell to 49 (bar 50). 0.068 → 39 %, 0.07 → 43 %, 0.073 → 48 %, 0.076 → 52 %. |
| diplomat bot: `bombance_blocked` weight | +30 | −5 | A dialogue player doesn't file a heritage / legal objection against a new neighbour, so the bar opens on top of the peace (the return, 52 %). |
| diplomat bot: gives up at hostility | ≥ 80 | ≥ 70 (day ≥ 8) | Hostility is lower on the new main (median 27): the turncoat was at 1 %. Now 6 %. |

No dominant action (`--ablate mixed`, 1000 runs, base 96 %): `pm_klaas_roster` −14, `pm_klaas_notebook` −12, `pm_heritage` / `pm_press_contact` / `night_bribe_photo_window` −3, the rest smaller. Max 14 < 25 ✅.

## 2026-10-08 21:55 · design agent verification · main 72009e6 · 1000 runs × 7 bots on CT 106 (110 s)
Independent re-run after the balance agent's pass 1b. Invariants ✅.

| bot | outcome | verdict |
|---|---|---|
| passive | 100% moving out | ✅ |
| legal careful | 47% legal victory, 47% scandal, 6% moving out, never custody | ✅ (but asso 96: saturation persists) |
| reckless | 100% custody (median night 5) | ✅ |
| stealthy | 1% custody, 13% scandal, 80% moving out, 6% the return | ✅ |
| mixed smart | 82% legal victory, best score 92 | ✅ |
| diplomat | 29% peace + 56% the return (peace twist) + 6% turncoat | ✅ (counting the return as a peace variant) |
| **slacker** | **0% fired** (57% scandal, 23% moving out, 21% legal) | ❌ **regression**: the agent measured 99% fired before main moved |

Never reached on this commit: the ending **fired**; actions night_saboter_cuisine, night_laxatif_carbonnade, night_backroom_photo, pm_bloc_fooled; event r_aot_pdf; 4 counter-moves; 23 dialogue lines.
→ Back to the balance agent (fired regression, bots exercising the kitchen sabotages / backroom photo, asso saturation) and the content side (r_aot_pdf).

## 2026-10-08 · balance pass 2 (balance agent) · fired regression, the waiter chain, asso saturation
`npm run sim -- --runs 1000 --detail` on CT 106, 1000 campaigns × 7 bots (112 s). Invariants ✅. Every action is now used by at least one bot (68/68).

| bot | custody | fired | legal_victory | moving_out | negotiated_peace | scandal | the_return | turncoat | score | sommeil | asso | risque | job | dossier | garde à vue (nuit méd.) | cibles §13.H |
| passif | · | · | · | 100% | · | · | · | · | 0 | 42 | 40 | 0 | 97 | 12 | – | ✅ ≥ 90 % déménagement / défaite |
| légal prudent | · | · | 49% | 5% | · | 46% | · | · | 81 | 60 | 78 | 0 | 99 | 50 | – | ✅ victoire légale 35–60 %<br>✅ jamais de garde à vue |
| illégal imprudent | 100% | · | · | · | · | · | · | · | -20 | 78 | 1 | 95 | 37 | 14 | 5 | ✅ ≥ 70 % garde à vue / procès |
| illégal discret | 20% | · | · | 47% | · | 25% | 8% | · | 19 | 14 | 14 | 44 | 83 | 25 | 6 | ✅ ≤ 40 % garde à vue<br>✅ scandale atteignable |
| mixte malin | · | · | 86% | 3% | · | 11% | · | · | 93 | 30 | 77 | 0 | 85 | 55 | – | ✅ meilleur score moyen |
| diplomate | · | · | · | 15% | 27% | 3% | 41% | 14% | 65 | 68 | 75 | 0 | 100 | 34 | – | ✅ paix négociée ≥ 40 % |
| tire-au-flanc | · | 41% | 15% | 12% | · | 31% | · | · | 41 | 75 | 73 | 1 | 49 | 40 | – | ✅ licenciement atteignable (≥ 2 %, §13.F) |

### 1 · Fired regression (slacker 0 % → 41 %)
Cause: since 3b36eac each Koddex item can be picked at most once per morning, and work items rotate on the 4-day `repeatCooldownDays`. A slacker gets one nap (−3) a morning; its other prompts are real work at ≥ +4 each. Once the side projects run out (by day 3), its job climbs back.
- Slacker bot: one nap a morning + the **least productive** work items (`lazyWork`).
- `CAMPAIGN.jobDecayPerDay` 6 → 7 (with the lazy slacker: 6 → 0 % fired, 7 → 42 %). Other bots' outcomes are unchanged; their job ends 85–100.
- Ending `fired`: `job <= 0` → `job <= 10` ("too low", §4). The least a Koddex morning can give is ≈ +4 per prompt, so 0 is only reachable if the day-5 decay lands exactly on it.
- **CI guard**: `tests/unit/balance.test.js` pins ≥ 2 % fired for the slacker over 30 fixed seeds.

### 2 · The waiter chain (kitchen sabotage, laxative, backroom photo), with their real risks
Stealthy got the waiter fired in 100 % of runs: customers at the terrace saw the bribe every time, and the bot only looked at Klaas / Seb & Nico.
- Witness check (`unseen`): none of the act's own witnesses in view, **and at most one table of customers**. Once the waiter is an informant, he no longer counts as a witness *for the bot's decision*; the real witness roll still includes him.
- When the check passes, the bot weighs the witness penalty × 0.3 (only Dédé / Ghislain / the patrol remain, and it can't see them coming).
- Stealthy wakes at 00:30 (the waiter leaves at 00:45). It calls the police again once it has an informant, so a patrol is on site for the backroom photo. It wants the kitchen sabotage (25), the laxative (15) and the backroom photo (30), and stops illegal acts at risk 40 (was 60).
- Reckless talks to the waiter before its other night acts.
- Result: stealthy waiter informant 52 %, kitchen sabotage 52 %, backroom photo 42 %, custody **20 %** (≤ 40 ✅; 40 % with maxRisk 60). The laxative is reached by reckless (6 %).

### 3 · Asso saturation (legal / mixed 96 → 78)
- New `ASSO.diminishFrom` = 50: above it, every campaign asso gain (content and night) is worth ×(100 − asso) / (100 − 50). Engine-forced changes are not affected.
- `CAMPAIGN.assoDecayPerDay` 4 → 5.
- diminishFrom 60 → asso 86; 50 + decay 5 → **78** (p10/90 76/80). Outcomes didn't move (legal 49 %, mixed 86 %).
- Side effect: the diplomat's turncoat rose from 6 % to 14 %. A diplomat who gives up now falls under asso 60 more often. It's still deliberate (3 carbonnades + the habitué choice), but if 14 % feels too common, raise the give-up hostility (bot, 70) or lower the ending's `asso < 60`.

### Mixed bot
`tatie_fake_leak` weight 3 → 5: the fake leak scored exactly 0, so `pm_bloc_fooled` was never reached.

No dominant action (`--ablate mixed`, 1000 runs, base 97 %): `pm_klaas_roster` −13, `pm_klaas_notebook` −12, `pm_heritage` / `pm_press_contact` −4, the rest ≤ 3. Max 13 < 25 ✅.

## 2026-10-08 23:05 · design agent verification · main c24436b · 1000 × 7 on CT 106
All §13.H targets ✅ and §13.F (every ending ≥ 2% for its target bot) ✅. **Every action (68), event (28) and ending (8) is reached**; invariants ✅.
Legal careful 59% legal victory / 37% scandal · reckless 100% custody (night 5) · stealthy 22% custody, 23% scandal · mixed 88% legal, best score 94 · diplomat 26% peace + 42% the return + 14% turncoat · slacker 40% fired. Asso now ends at 73–77 (saturation fixed).
Decision (design): the turncoat at 14% of diplomat runs is **kept**. A diplomat who gives up and starts eating at the estaminet is in character, and it still needs 3 deliberate carbonnades + attending the commission as a regular.
Left (minor): counter-moves cm_regis_leak_petition, cm_camera_found_paranoia never reached; 13 dialogue lines never surfaced (incl. the « hello » lines).

## 2026-10-08 · balance pass 3 (balance agent) · last 2 counter-moves, unsurfaced dialogue
`npm run sim -- --runs 1000 --detail` on CT 106, 1000 campaigns × 7 bots, rebased on main with v0.9 (new waiter after a firing, Benali never complaisant). Invariants ✅. **68/68 actions, 28/28 events, 8/8 endings, 42/42 counter-moves** reached; 12/184 dialogue lines never shown (see below).

| bot | custody | fired | legal_victory | moving_out | negotiated_peace | scandal | the_return | turncoat | score | sommeil | asso | risque | job | dossier | garde à vue (nuit méd.) | cibles §13.H |
| passif | · | · | · | 100% | · | · | · | · | 0 | 42 | 40 | 0 | 97 | 12 | – | ✅ ≥ 90 % déménagement / défaite |
| légal prudent | · | · | 47% | 6% | · | 47% | · | · | 80 | 61 | 77 | 0 | 99 | 49 | – | ✅ victoire légale 35–60 %<br>✅ jamais de garde à vue |
| illégal imprudent | 100% | · | · | · | · | · | · | · | -20 | 78 | 1 | 95 | 37 | 14 | 5 | ✅ ≥ 70 % garde à vue / procès |
| illégal discret | 19% | · | · | 42% | · | 29% | 10% | · | 23 | 26 | 15 | 44 | 87 | 26 | 6 | ✅ ≤ 40 % garde à vue<br>✅ scandale atteignable |
| mixte malin | · | · | 83% | 5% | · | 12% | · | · | 91 | 31 | 77 | 0 | 85 | 54 | – | ✅ meilleur score moyen |
| diplomate | · | · | · | 21% | 26% | 2% | 36% | 15% | 59 | 68 | 74 | 0 | 100 | 33 | – | ✅ paix négociée ≥ 40 % |
| tire-au-flanc | · | 39% | 15% | 16% | · | 31% | · | · | 40 | 76 | 73 | 1 | 50 | 40 | – | ✅ licenciement atteignable (≥ 2 %, §13.F) |

### Counter-moves
- `cm_regis_leak_petition` (`when`): it needed Régis recruited (day ≥ 4) while a petition was started but not yet delivered. Every bot starts and delivers its petition the same afternoon (day 1–2), so that window never existed. Its text says the plan leaked from the closed-door meeting (« On n’en avait parlé qu’à la réunion »), so it now needs `traitor_recruited` + `asso_meeting`, before any petition is delivered (`notFlags: petition_delivered`). Mostly reached by the diplomat, who holds meetings and petitions late.
- `cm_camera_found_paranoia` (needs the awning camera **and** the press scandal): no bot had both. The stealthy bot can now publish the scandal (`pm_press_scandal`, a legal stepping stone like the press contact). It plants the awning camera from day 9, while its Risk is < 10. Planting it early pushed custody to 39 % (the camera's consequences pile up over the campaign); late → 30 % (19 % after the v0.9 rebase).

### Night evidence
`CAMPAIGN.nightEvidenceScale` 0.073 → 0.068: on the current main the legal bot was at 59 % (edge of 35–60). Now 52 % (47 % after the v0.9 rebase).

### Dialogue never surfaced (12) → routed (Build notes)
- **Content conflicts (content agent)**: `jeremie_hello` needs `notFlags: met_jeremie` on days 1–2, but the day-1 morning event sets `met_jeremie` in every choice, before the first afternoon. `tatie_hello` needs `notFlags: met_tatie`, but `tatie_mail_01` (day 1 morning, live since the morning counter-move fix) sets `met_tatie`.
- **Selection (build agent)**: at most 2 dialogues per phase, and the selection weights lines by precision (number of conditions) + jitter. Broad lines like `dede_threat_smile` (`hostility >= 50`, true in most runs) always lose. So do late-campaign lines competing with many others on days 13–14 (`klaas_saturday2`, `tatie_mail_12`, `dede_carbonnade`). Suggestion: a never-seen line whose condition has been true for N phases gets a boost, or « hello » / first-meeting lines get priority.
- **Rare states (fine as is)**: `benali_transferred`, `chef_scandal` / `chef_warning` (the chief's patrol), `avocat_*` (a lawyer **and** illegal acts / a complaint: a mix no single strategy plays).

No dominant action (`--ablate mixed`, 1000 runs, base 95 %): `pm_klaas_roster` −10, `pm_klaas_notebook` −9, `pm_press_contact` −4, the rest ≤ 2. Max 10 < 25 ✅.

## 2026-10-09 · balance pass v1.1 (balance agent) · twists every night + gated tools
Baseline on main 13e6ec1 (v1.1 engine: `src/sim/twists.js`, `src/sim/unlocks.js`, 25 twists, 21 unlocks), 1000 × 7 on CT 106:

| bot | custody | fired | legal_victory | moving_out | negotiated_peace | scandal | the_return | turncoat | score | sommeil | asso | risque | job | dossier | garde à vue (nuit méd.) | cibles §13.H |
| passif | · | · | · | 100% | · | · | · | · | 0 | 23 | 40 | 0 | 98 | 11 | – | ✅ ≥ 90 % déménagement / défaite |
| légal prudent | · | · | 34% | 7% | · | 59% | · | · | 75 | 45 | 68 | 0 | 100 | 48 | – | ❌ victoire légale 35–60 %<br>✅ jamais de garde à vue |
| illégal imprudent | 100% | · | · | · | · | · | · | · | -20 | 59 | 0 | 96 | 37 | 13 | 5 | ✅ ≥ 70 % garde à vue / procès |
| illégal discret | 17% | · | · | 61% | · | 19% | 4% | · | 12 | 17 | 19 | 41 | 85 | 25 | 7 | ✅ ≤ 40 % garde à vue<br>✅ scandale atteignable |
| mixte malin | · | · | 68% | 17% | · | 15% | · | · | 79 | 17 | 68 | 1 | 84 | 53 | – | ✅ meilleur score moyen |
| diplomate | · | · | · | 22% | 24% | 2% | 32% | 19% | 56 | 58 | 71 | 0 | 100 | 32 | – | ✅ paix négociée ≥ 40 % |
| tire-au-flanc | · | 41% | 15% | 13% | · | 31% | · | · | 40 | 68 | 72 | 1 | 49 | 39 | – | ✅ licenciement atteignable (≥ 2 %, §13.F) |

❌ Legal victory **34 %** (median dossier 48: the twists add crowds/noise but tools such as the dB key, the round and the asso call now arrive later). Never used: `night_sabotage_chairs` / `_parasols` / `_locks`, `night_borrow_power` (unlocked on days 8–9; their user, the reckless bot, is in custody by night 5). Unreached counter-moves: `cm_air_freshener` (stink bomb from day 5), `cm_colette_call_notice` (every formal notice came after a mayor request, which fires the other Colette call first). Mixed burned out (sleep 17, 17 % moving out) and tied with legal (80 / 80).

**Gating / no cheating**: the build agent's runner already filters every native bot act through `c.nativeAllowed` (unlocks + tonight's twist opportunities), and content night acts go through `availableNightActions`, which only lists unlocked actions or ones a twist opens tonight. So bots can't use a tool before it unlocks, and they use a twist's opportunity (mostly photo / dB / police / waiter, `night_film_faces` with the influencer) as soon as the engine allows it.

After this pass, 1000 × 7, invariants ✅, **68/68 actions, 28/28 events, 8/8 endings, 42/42 counter-moves**:

| bot | custody | fired | legal_victory | moving_out | negotiated_peace | scandal | the_return | turncoat | score | sommeil | asso | risque | job | dossier | garde à vue (nuit méd.) | cibles §13.H |
| passif | · | · | · | 100% | · | · | · | · | 0 | 23 | 40 | 0 | 98 | 11 | – | ✅ ≥ 90 % déménagement / défaite |
| légal prudent | · | · | 45% | 6% | · | 49% | · | · | 79 | 46 | 75 | 0 | 100 | 49 | – | ✅ victoire légale 35–60 %<br>✅ jamais de garde à vue |
| illégal imprudent | 100% | · | · | · | · | · | · | · | -20 | 59 | 0 | 96 | 37 | 13 | 5 | ✅ ≥ 70 % garde à vue / procès |
| illégal discret | 16% | · | · | 60% | · | 19% | 4% | · | 13 | 16 | 20 | 42 | 85 | 26 | 7 | ✅ ≤ 40 % garde à vue<br>✅ scandale atteignable |
| mixte malin | · | · | 86% | 3% | · | 11% | · | · | 94 | 28 | 73 | 1 | 84 | 55 | – | ✅ meilleur score moyen |
| diplomate | · | · | · | 24% | 23% | 3% | 33% | 18% | 55 | 59 | 77 | 0 | 100 | 34 | – | ✅ paix négociée ≥ 40 % |
| tire-au-flanc | · | 43% | 29% | 10% | · | 19% | · | · | 46 | 68 | 78 | 0 | 48 | 41 | – | ✅ licenciement atteignable (≥ 2 %, §13.F) |

| change | was | now | why |
|---|---|---|---|
| `CAMPAIGN.nightEvidenceScale` | 0.068 | 0.075 | Legal median dossier back on the bar: 0.072 → 42 %, 0.075 → 45–46 %. |
| `CAMPAIGN.assoDecayPerDay` | 5 | 4 | Twists cost asso (fewer shareable nights): legal / mixed fell to 68. |
| `ASSO.diminishFrom` | 50 | 55 | Same: legal 75, mixed 73 (target 70–85). |
| stealthy bot | – | wants the three sabotages, the power line, the stink bomb | Late tools (days 5–9) for the only bot awake after 00:30; custody stays 16 %. |
| slacker bot | – | lawyer + formal notice | A formal notice without a mayor request, so `cm_colette_call_notice` can fire. |
| mixed bot | dossier 5, flat sleep 0.5 | sleep weight 3 when sleep < 40; lawyer / formal notice / mayor meeting | Its dossier greed took every sleep-costly event choice (−11 sleep from events vs +11 for legal). A smart player rests when exhausted. The extra legal dossier actions give it margin above the commission bar. |

No dominant action (`--ablate mixed`, 1000 runs, base 97 %): `pm_klaas_roster` −24, `pm_klaas_notebook` −20, `pm_press_contact` −8, rest ≤ 6. **Max 24 < 25 ✅, but thin.** The roster is the gateway to the Klaas notebook (and `met_klaas`), and the notebook is the main legal route to `corruption_proof` plus ~3 dossier points next to the commission bar. Suggestion for the content agent: a second way to meet Klaas (the round, the D4 dinner…) would make the roster less of a single point of failure.

Duration: I did not touch night length, sleep acceleration or day text. qa/duration.md (~3h, 2h30–4h ✅) is unaffected by these values.
Dialogue never shown (15/211): the same crowding as pass 3 (routed to the build agent), plus `tw_match_tatie` (a v1.1 twist line for the football night, not reached by any bot in 1000 runs: to check with the content agent) and a few rare states (`ghislain_hygiene`, `delphine_conflict`, `hilde_laxative`, `nico_hate_wave_answered`).

**Addendum after rebasing on 24fa5d5** (the 6 intro cards now show again, which changes the opening state): legal jumped to 60 %, mixed 95 %, slacker fired 89 %. `CAMPAIGN.nightEvidenceScale` 0.075 → **0.067** (0.07 → 51 %, 0.067 → 47 %). Final, 1000 × 7, invariants ✅, 68/68 actions, 28/28 events, 8/8 endings, 42/42 counter-moves:

| bot | custody | fired | legal_victory | moving_out | negotiated_peace | scandal | the_return | turncoat | score | sommeil | asso | risque | job | dossier | garde à vue (nuit méd.) | cibles §13.H |
| passif | · | · | · | 100% | · | · | · | · | 0 | 44 | 40 | 0 | 97 | 13 | – | ✅ ≥ 90 % déménagement / défaite |
| légal prudent | · | · | 47% | 5% | · | 48% | · | · | 81 | 61 | 75 | 0 | 99 | 50 | – | ✅ victoire légale 35–60 %<br>✅ jamais de garde à vue |
| illégal imprudent | 100% | · | · | · | · | · | · | · | -20 | 65 | 0 | 96 | 32 | 14 | 5 | ✅ ≥ 70 % garde à vue / procès |
| illégal discret | 18% | · | · | 40% | · | 35% | 7% | · | 25 | 29 | 19 | 43 | 83 | 28 | 7 | ✅ ≤ 40 % garde à vue<br>✅ scandale atteignable |
| mixte malin | · | · | 90% | 2% | · | 8% | · | · | 95 | 36 | 74 | 1 | 76 | 55 | – | ✅ meilleur score moyen |
| diplomate | · | · | · | 24% | 23% | 2% | 34% | 17% | 55 | 68 | 78 | 0 | 92 | 34 | – | ✅ paix négociée ≥ 40 % |
| tire-au-flanc | · | 89% | 7% | 2% | · | 3% | · | · | 18 | 77 | 71 | 1 | 14 | 30 | – | ✅ licenciement atteignable (≥ 2 %, §13.F) |

No dominant action (1000 runs, base 98 %): `pm_klaas_roster` −17, `pm_klaas_notebook` −15, `night_whatsapp` / `pm_press_contact` −4. Max **17** < 25 ✅ (more margin than before the rebase, but the Klaas roster remains the biggest single dependency).
dialogue (20/211) : klaas_persuaded, klaas_saturday2, klaas_cardboard, tatie_mail_12, dede_threat_smile, dede_carbonnade, ghislain_hygiene, ghislain_lawyer, lemaire_transferred, benali_transferred, chef_scandal, chef_inquiry, chef_warning, delphine_conflict, avocat_illicit, avocat_complaint, nico_hate_wave_answered, hilde_laxative, avocat_backroom_caught, tw_match_tatie. Most are the crowding / rare states already routed in pass 3.

**Confirmation with the d285f66 twist set** (guide_tour fixed on night 1, new pool twist carbonnade_contest), main 2e5e705, no value changed. 1000 × 7, invariants ✅, 68/68 actions, 28/28 events, 8/8 endings, 42/42 counter-moves:

| bot | custody | fired | legal_victory | moving_out | negotiated_peace | scandal | the_return | turncoat | score | sommeil | asso | risque | job | dossier | garde à vue (nuit méd.) | cibles §13.H |
| passif | · | · | · | 100% | · | · | · | · | 0 | 45 | 40 | 0 | 97 | 13 | – | ✅ ≥ 90 % déménagement / défaite |
| légal prudent | · | · | 49% | 3% | · | 48% | · | · | 82 | 60 | 75 | 0 | 99 | 50 | – | ✅ victoire légale 35–60 %<br>✅ jamais de garde à vue |
| illégal imprudent | 100% | · | · | · | · | · | · | · | -20 | 64 | 0 | 96 | 31 | 14 | 5 | ✅ ≥ 70 % garde à vue / procès |
| illégal discret | 19% | · | · | 42% | · | 34% | 5% | · | 24 | 29 | 18 | 42 | 81 | 27 | 7 | ✅ ≤ 40 % garde à vue<br>✅ scandale atteignable |
| mixte malin | · | · | 89% | 2% | · | 8% | · | · | 95 | 36 | 75 | 1 | 76 | 55 | – | ✅ meilleur score moyen |
| diplomate | · | · | · | 21% | 27% | 3% | 35% | 14% | 60 | 68 | 80 | 0 | 92 | 34 | – | ✅ paix négociée ≥ 40 % |
| tire-au-flanc | · | 89% | 6% | 2% | · | 3% | · | · | 17 | 77 | 71 | 1 | 13 | 30 | – | ✅ licenciement atteignable (≥ 2 %, §13.F) |

No dominant action (1000 runs, base 98 %): `pm_klaas_roster` −18, `pm_klaas_notebook` −13, `pm_press_contact` −5. Max 18 < 25 ✅.
Twists over 48 campaigns (4 bots × 12 seeds): 25/26 come up (`carbonnade_contest` 19×, `guide_tour` every campaign). Never: **`inspector_quiet_night`**, day 9's fallback for when neither `inspector_surprise` nor `inspector_announced` is set. Every choice of `d9_inspector` sets one of the two, so it can only fire if the day-9 event is skipped (content agent's call: unreachable by design, or let choice 3 « laisser la procédure » lead to a quiet night).

## 2026-10-09 04:30 · design agent verification · v1.1 (twists + gated tools) · main fbe90b6 · 1000 × 7 on CT 106 (123 s)
All §13.H / §13.F targets ✅; every action (68), event (28), ending (8) and counter-move (42) reached; invariants ✅.
Legal careful 49% legal / 48% scandal, never custody · reckless 100% custody (night 5) · stealthy 19% custody, 34% scandal · mixed 89% legal, best score 95 · diplomat 27% peace + 35% the return + 14% turncoat · slacker 89% fired · passive 100% moving out.
17/211 dialogue lines never surface in simulation (rare combinations, by design or acceptable).
Note: inspector_quiet_night (D9 fallback twist) can't trigger because every D9 inspector choice sets a flag; kept as a safety fallback.
