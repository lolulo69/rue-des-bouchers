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
