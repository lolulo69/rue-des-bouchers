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
