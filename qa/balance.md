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
`npm run sim -- --runs 1000 --detail` on CT 106, 1000 campaigns × 7 bots. Invariants ✅. **68/68 actions, 28/28 events, 8/8 endings, 42/42 counter-moves** reached; 12/184 dialogue lines never shown (see below).

| bot | custody | fired | legal_victory | moving_out | negotiated_peace | scandal | the_return | turncoat | score | sommeil | asso | risque | job | dossier | garde à vue (nuit méd.) | cibles §13.H |
| passif | · | · | · | 100% | · | · | · | · | 0 | 42 | 40 | 0 | 97 | 12 | – | ✅ ≥ 90 % déménagement / défaite |
| légal prudent | · | · | 52% | 5% | · | 43% | · | · | 82 | 60 | 77 | 0 | 99 | 50 | – | ✅ victoire légale 35–60 %<br>✅ jamais de garde à vue |
| illégal imprudent | 100% | · | · | · | · | · | · | · | -20 | 78 | 1 | 95 | 37 | 14 | 5 | ✅ ≥ 70 % garde à vue / procès |
| illégal discret | 30% | · | · | 45% | · | 19% | 6% | · | 12 | 18 | 15 | 55 | 78 | 25 | 6 | ✅ ≤ 40 % garde à vue<br>✅ scandale atteignable |
| mixte malin | · | · | 83% | 5% | · | 12% | · | · | 92 | 30 | 77 | 0 | 84 | 55 | – | ✅ meilleur score moyen |
| diplomate | · | · | · | 20% | 24% | 3% | 38% | 15% | 60 | 67 | 74 | 0 | 100 | 34 | – | ✅ paix négociée ≥ 40 % |
| tire-au-flanc | · | 40% | 18% | 14% | · | 28% | · | · | 42 | 76 | 73 | 1 | 50 | 40 | – | ✅ licenciement atteignable (≥ 2 %, §13.F) |

### Counter-moves
- `cm_regis_leak_petition` (`when`): it needed Régis recruited (day ≥ 4) while a petition was started but not yet delivered. Every bot starts and delivers its petition the same afternoon (day 1–2), so that window never existed. Its text says the plan leaked from the closed-door meeting (« On n’en avait parlé qu’à la réunion »), so it now needs `traitor_recruited` + `asso_meeting`, before any petition is delivered (`notFlags: petition_delivered`). Mostly reached by the diplomat, who holds meetings and petitions late.
- `cm_camera_found_paranoia` (needs the awning camera **and** the press scandal): no bot had both. The stealthy bot can now publish the scandal (`pm_press_scandal`, a legal stepping stone like the press contact). It plants the awning camera from day 9, while its Risk is < 10. Planting it early pushed custody to 39 % (the camera's consequences pile up over the campaign); late → 30 %.

### Night evidence
`CAMPAIGN.nightEvidenceScale` 0.073 → 0.068: on the current main the legal bot was at 59 % (edge of 35–60). Now 52 %.

### Dialogue never surfaced (12) → routed (Build notes)
- **Content conflicts (content agent)**: `jeremie_hello` needs `notFlags: met_jeremie` on days 1–2, but the day-1 morning event sets `met_jeremie` in every choice, before the first afternoon. `tatie_hello` needs `notFlags: met_tatie`, but `tatie_mail_01` (day 1 morning, live since the morning counter-move fix) sets `met_tatie`.
- **Selection (build agent)**: at most 2 dialogues per phase, and the selection weights lines by precision (number of conditions) + jitter. Broad lines like `dede_threat_smile` (`hostility >= 50`, true in most runs) always lose. So do late-campaign lines competing with many others on days 13–14 (`klaas_saturday2`, `tatie_mail_12`, `dede_carbonnade`). Suggestion: a never-seen line whose condition has been true for N phases gets a boost, or « hello » / first-meeting lines get priority.
- **Rare states (fine as is)**: `benali_transferred`, `chef_scandal` / `chef_warning` (the chief's patrol), `avocat_*` (a lawyer **and** illegal acts / a complaint: a mix no single strategy plays).

No dominant action (`--ablate mixed`, 1000 runs, base 95 %): `pm_klaas_roster` −10, `pm_klaas_notebook` −9, `pm_press_contact` −4, the rest ≤ 2. Max 10 < 25 ✅.
