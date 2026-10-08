# Coherence review: src/content

Cross-file review of every narrative file against the story bible (`src/content/README.md`) and GAME_DESIGN §0, §1, §1b, §2, §3, §8, §9, §14.
Owned by the content-review agent. Each pass: date, commit, method, then one table. **Status**: `fixed` (done in this commit) ·
`open` (fix listed for the file's owner) · `engine` (waits for the campaign engine) · `doc` (doc-only fix).

## 2026-10-08 · pass 1 · base 95c06db, re-audited on dac41da

**Method.** (1) A script loads every content module and walks every `when` / `requires` / `effects` / `unlocks` / `speaker` / `by`. It lists
undeclared flags, unknown speakers, duplicate ids, day ranges outside 1–14, flags read but never set, flags set but never read.
(2) Each file was read line by line for names, geography, timeline, voices, facts and the spoiler rule.

**Files reviewed:** characters.js, flags.js, actions.js, events.js, countermoves.js, endings.js, koddex.js, dialogue.js.
media.js, night.js and intro.js landed during the pass: mechanical audit only for now (see pass 1b).

**Clean, no finding:** no undeclared flag, no unknown dialogue/event/countermove speaker, no duplicate id, no day range outside 1–14.
Every fixed event (D1, D4, D6, D7, D9, D11, D13, D14) sits on its day and has a `requires`-free fallback choice. Names, house numbers and
addresses match `characters.js` everywhere. Colette is always the *ex*-mayor and pro-bloc, Lescaut always the current mayor and pro-residents,
Delphine always married to Stéphane. No real person or business, and no real-world how-to for an illegal act.

### Findings

| File | Id | Problem | Fix | Status |
|---|---|---|---|---|
| **Cross-file: flags** | | | | |
| flags.js / dialogue.js | `joined_rounds` | Read by `r_biloute_chairs`, 3 endings and dialogue, but no content set it. | `jeremie_rounds_invite` now sets it (dac41da, plus `once` here). Owners may still add an explicit « faire la ronde » action. | fixed |
| flags.js / endings.js | `tatie_leaked_plan` | Read by 3 endings, never set. The §2 « Tatie leaks your real plan » risk is not implemented. | countermoves owner: add a countermove (e.g. `tatie_wavering` + a plan flag such as `petition_started` → leak), or endings owner drops the parts. | fixed by the engine (`src/sim/campaign.js` sets it) |
| flags.js / endings.js / koddex.js / media.js | `custody` | Read by the `custody` ending, `night_ask_waiter`, `stephane_custody`, `wa_custody`, `press_end_custody(_sugar)`, never set. The night sim ends with reason `custody` (`src/sim/sim.js:117`) but sets no flag, and its risk scale isn't the campaign's. | Engine: set `custody` when a night ends that way (or merge the risk scales). Until then only `risk >= 90` reaches the ending. | fixed by the engine (`src/sim/campaign.js` sets it) |
| flags.js | engine block (`night_photo`, `night_db`, `bucket_used`, `talked_waiter`, `video_viral`, `seen_complaisance`, `corridor_measured`, …) | No campaign engine yet, so no engine flag is ever set. `r_waiter_smoke`, `cm_fake_post_viral`, the scandal route and several epilogue parts are unreachable until then. `night_db`, `bucket_used` are never read. | Engine to-do. Optionally read the 2 unused flags (e.g. dossier epilogue). | engine (forwarded to build) |
| flags.js | `kitchen_fire`, `hate_wave_answered` | Declared, never set or read. | actions/countermoves owners: set them (cardboard consequence → `kitchen_fire`; an answer choice on `cm_fake_post` → `hate_wave_answered`), or remove. | fixed: `kitchen_fire` removed; `hate_wave_answered` set by the new `pm_answer_hate_wave`, read in dialogue |
| all files | 22 flags set but never read (`reported_mairie`, `filmed_faces`, `police_flooded`, `cardboard_exhaust`, `complaint_filed`, `hygiene_visit`, `asso_meeting`, `met_delphine`, `bloc_fooled`, `fake_reviews`, `read_reservations`, `read_emails`, `colette_dinner_ignored`, `ag_held`, `stance_legal`, `inspector_surprise`, `inspector_announced`, `ac_case_stalled`, `exhaust_meeting_lost`, `saturday2_done`, `proj_db_report`, `proj_klaas_ocr`) | Set, then nothing reacted to them. | Each now has at least one reaction line in dialogue.js. Re-run of the audit: 0 flags set-but-never-read. | fixed |
| actions.js / src/config.js | `witnessed.by` | actions use witness ids `seb_nico`, `waiter`, `customers`, `police`; the sim's `WITNESS` keys are `klaas`, `gaystapo`, `waiter`, `customers`. `seb_nico` and `police` match nothing. | Build agent: pick one id set (suggest `seb_nico`, since the group label must stay a constant; the `gaystapo` key bakes the release name into code) and map `police` or drop it. | fixed (`seb_nico` everywhere; `police` handled by the engine) |
| **Tatie's thread (now 12 promises)** | | | | |
| README.md | decisions log | Says promises #1 → #7; countermoves has 12. | Write #1 → #12. | fixed |
| flags.js | `tatie_mail_7` | Description says « (la dernière) ». | Move « (la dernière) » to `tatie_mail_12`. | fixed |
| GAME_DESIGN.md §2 | Tatie row | « promise #14 ». | « promise #12 ». | doc (design agent: GAME_DESIGN §2) |
| endings.js | `ASSO_FATES` `tatie_mail_7`, `legal_victory` `tatie_emails_shared` | « les sept promesses » although mails 8–12 usually arrive by D14. | Gate on `tatie_mail_12` (« douze ») or say « toutes les promesses ». | fixed |
| countermoves.js | `tatie_mail_06` | « depuis l'an dernier » vs `tatie_mail_01` (since 2023), `tatie_mail_02` (2024) and `d11_exhaust_meeting` (since 2019). | « depuis des années ». Also align d11's 2019 with 2023. | fixed |
| dialogue.js | `tatie_mail_7` | Mid-thread line, fine; added `tatie_mail_12` (« la dernière, c'est une réponse automatique »). | Done. | fixed |
| **Timeline** | | | | |
| countermoves.js | `cm_regis_courted` | `day: [2, 8]` but Klaas reads a « Mardi, 21h10 » entry: on D2 afternoon that dinner hasn't happened. | `day: [3, 8]`, or « Avant-hier… Hier… ». | fixed (text: « Avant-hier… Hier… »; `when` untouched) |
| countermoves.js | `cm_harassment_hostility` | `day: [5, 14]` jokes about the olfactory consultant, first seen in `tatie_mail_07` (≥ D7). | Add `flags: ['tatie_mail_7']`, or drop the consultant. | fixed (text: « une friteuse »; `when` untouched) |
| events.js | `r_suitcases` | Set at « 2h07 »; nights end ~01:30 (§3). `speaker: 'regis'` though he isn't in the scene. | « 1h07 »; drop the speaker. | fixed |
| events.js | `d4_colette_dinner` (« Prévenir le groupe ») | D4 is Thursday; Tatie says « Je la vois jeudi pour le thé » while Colette dines downstairs that Thursday. | « jeudi prochain ». | fixed |
| events.js | `r_colette_interview` | Only random event with no `phase`: can fire at night. | `phase: 'morning'`. | fixed |
| actions.js | `pm_delphine_channel` | No day cap; « announced visits are useless » is dead text after D9. | `day: [3, 8]` or `notFlags: ['inspector_announced', 'inspector_surprise']`. | fixed |
| endings.js | `scandal`, `seen_complaisance` + `met_klaas` part | « sur trois semaines »: the campaign lasts 14 nights. | « deux semaines ». | fixed |
| dialogue.js | `delphine_visit` | Was `day: [9, 9]` and stated the AC was found, but on the « announced » branches the AC is hidden (« constat : néant »). | Now gated on `ac_violation_confirmed`, once. | fixed |
| dialogue.js | `hippolyte_inspector_announced`, `seb_inspector_surprise` | First drafts said « débranchée » / « mètre ruban »; d9 says disguised as a « jardinière » / « mètre laser ». | Aligned with d9. | fixed |
| **Spoiler rule** | | | | |
| actions.js | `pm_klaas_roster` | « Le café, c'est toujours les mêmes jours » reveals Lemaire's free meals without `seen_complaisance`. | Cut the café sentence. | fixed |
| events.js | `r_klaas_roster` | « moustache. Lent. Café. » same hint, requires only `called_police`. | Drop « Café. ». | fixed |
| actions.js | `pm_waiter_debrief` | Théo's « les jours où le brigadier mange » reveals the free meals ungated. | Since the informant is the source, add `seen_complaisance` to its `setFlags`. | fixed |
| endings.js | `ASSO_FATES`, `traitor_recruited` without `traitor_known` | Names Régis right after « Vous n'avez jamais su qui ». | Drop the name, or log the end-screen reveal as an exception in README. | fixed |
| **False claims (text asserts something no flag proves)** | | | | |
| actions.js | `pm_igpn_report` | Always mentions the back-room proof, even if only the legal window photo exists. | Neutral text, or a variant per `bribe_photo` / `bribe_photo_illegal`. | fixed |
| actions.js | `pm_press_scandal` | Puts Klaas's notebook on the front page without `met_klaas`. | Drop the notebook or require `met_klaas`. | fixed |
| actions.js | `pm_read_reservations` | Evidence label « 9 couverts par table » vs result « table 4 : 11 pers. ». | « jusqu'à 11 couverts par table ». | fixed |
| countermoves.js | `cm_regis_leak_petition` | « Dans l'atelier » without `hippolyte_room`; « sa contre-pétition » without `cm_happy_petition`. | Require `cm_happy_petition`; « à la réunion ». | fixed (text rewritten; `when` untouched) |
| countermoves.js | `cm_regis_blunder` | « ils déposent la pétition jeudi » requires only `whatsapp_rally`. | Add `petition_started`. | fixed (text rewritten; `when` untouched) |
| endings.js | `the_return`, `won_legal` part | « la gaine part en toiture » without `exhaust_meeting_won`; « Les tables rentrent à 21h55 » while the AOT is suspended. | Split the gaine sentence; « Les tables de l'estaminet ont disparu ». | fixed |
| endings.js | `the_return`, `bombance_rumour` part | Claims Pilou answered « un problème à la fois », false if he warned Hippolyte. | Flag that choice and gate the line, or reword. | fixed (new flag `bombance_wait` on the « On verra » choice gates the part) |
| endings.js | `the_return`, `knows_trou` part | « en le répétant partout »: the flag only means Pilou knows the nickname. | « Vous auriez dû garder ce surnom pour vous. » | fixed |
| endings.js | `custody`, first part | Dawn raid by the national police vs §9 (caught red-handed) and the sim summary (night at the station). | Arrest at night, in the street or at the window. | fixed |
| endings.js | `custody`, `backroom_sneak` part | « retrouvé caché dans l'arrière-salle »: `backroom_sneak` is set when the sneak *succeeds*. | Add `backroom_caught` in the witnessed effects; gate on it. | fixed (new flag `backroom_caught`) |
| endings.js | `INSTITUTIONS` `conflict_exposed` in `legal_victory` | « dossier confié à un collègue qui part à la retraite » can show next to « La clim a été démontée ». | `notFlags: ['ac_violation_confirmed']` on that sentence. | fixed |
| endings.js / koddex.js | `KODDEX` `todo_app_rust` part, `work_todo_rewrite_again` | « cinquième réécriture / version » on a repeatable task; README says never count precisely. | « énième », or `once: true`. | fixed |
| **Voices / character rules** | | | | |
| actions.js | `night_wifi`, `pm_fake_reviews` | Clode Kode does the illegal work; the bible says he politely refuses and Pilou finishes alone. | Rewrite: Clode refuses (cites art. 323-1), Pilou does it himself. | fixed (Clode refuses, Pilou finishes alone) |
| **Reachability / mechanics** | | | | |
| endings.js | `scandal` | Only route is `corruption_proof`, set only by two actions that need `seen_complaisance` (engine flag, never set yet). README promises other routes (waiter testimony, Klaas log + tip-off). | actions owner: a `waiter_informant` testimony action and a `seen_tipoff` + `proj_klaas_ocr` action that set `corruption_proof`. | fixed: `pm_waiter_testimony` and `pm_klaas_notebook` (see Build note) |
| events.js / endings.js | `the_return` | Chain rumour (35%) → project (50%) → choice → win may fall under the 2% target (§13.F). | Raise chances, or make the D12 event fixed once the rumour is set. Check in the simulator. | balance (see Build note) |
| koddex.js | `proj_db_logger`, `proj_whatsapp_bot` | §3 says passive dB evidence / cheaper mobilisation, but nothing mechanical reads them. | Engine: nightly dB evidence when set; `pm_whatsapp_rally` cheaper when set. | engine (forwarded to build) |
| koddex.js | `clode_farewell`, Stéphane gags, work tasks | Koddex mornings stay eligible after `unemployed`. | Engine skips the Koddex phase when `unemployed`, or add `notFlags: ['unemployed']`; drop `clode_farewell`. | engine: `clode_farewell` kept on purpose (it is the « fired, continue » goodbye); the engine skips the other Koddex content once `unemployed` |
| koddex.js | `stephane_custody` | Dead until `custody` is set; from D5 custody ends the game anyway. | Remove, or keep for D < 5 once the engine sets the flag. | engine: kept, it fires once the engine sets `custody` before D5 |
| actions.js | `night_cardboard_exhaust` | Firefighter joke hints at a real fire risk to staff. Not a how-to. | Low priority: route the consequence through `hygiene_visit` / `kitchen_fire`. | fixed (firefighter joke replaced by Ghislain with a tape measure) |
| **Cast coverage (dialogue.js)** | | | | |
| dialogue.js | journaliste, avocat, regis, biloute, gaufre | No contextual lines. | Added: Régis 7 (traitor only after `traitor_known`; before, just « dans la nuance »), Anne-Sophie Lepoutre 6, Maître Vandamme 6, Biloute 6 and Gaufre 5 (didascalies only). | fixed |
| dialogue.js | chef | Commandant Desmet *is* `chef` (no separate id). Never named in his lines. | Added `chef_complaint` (introduces himself by name) and `chef_flooded`: 6 lines. | fixed |

**Counts after this pass (dialogue.js, 177 entries):** Jérémie 19 · Klaas 15 · Tatie 14 · Seb 13 · Hilde 12 · Nico 12 · Hippolyte 11 · Régis 7 · Ghislain 7 ·
chef 6 · Stéphane 6 · journaliste 6 · avocat 6 · Biloute 6 · Dédé 5 · serveur 5 · Lemaire 5 · Delphine 5 · Gaufre 5 · Benali 4 · Colette 4 · Lescaut 4.
Only `pilou` and `clode` have none (Pilou is the player; Clode speaks in koddex.js).

## 2026-10-08 · pass 1b · night.js, intro.js, media.js

**Clean, no finding:** the group name always comes from `WHATSAPP_GROUP`. Théo is only named under `met_waiter`, and Régis is only a traitor under `traitor_known`.
The roster, `read_*`, La Bombance and the zones are gated. Rule facts are right (22:00, 6/table, corridor, Saturdays, 20:30–01:30, Klaas asleep at 01:00), voices match, and no illegal act is described as a how-to.

| File | Id | Problem | Fix | Status |
|---|---|---|---|---|
| night.js / src/config.js / src/sim/witness.js | `WITNESS_LINES.gaystapo`, `WITNESS.gaystapo` | The witness id is `gaystapo` while actions.js uses `seb_nico` (13×), so the `by` lookups never match. It also bakes the v1.0 group label into code, although §2 and the README say the label lives only in `WHATSAPP_GROUP`. | Rename the key to `seb_nico` (sim, config, night.js). The display label stays `WHATSAPP_GROUP`. | fixed: sim/config by the build agent; `WITNESS_LINES.seb_nico` + `narrative.js` alias + test by content-fixes |
| intro.js | `tuto_night_end` | « Treize nuits avant la commission »: the commission is on the D14 afternoon, so 12 nights remain after night 1. | « Douze nuits ». | fixed |
| intro.js | `card_street` | Reveals « le Trou » on day 1, so `knows_trou` (Hippolyte, the guided tour, `press_trou`, an ending) becomes pointless. | « Une rue pavée de 150 mètres, ouverte en 1729. » | fixed |
| intro.js | `card_exhaust` | « On lui répond que c'est en cours » has no antecedent, and the open AC case isn't stated. | « Une inspectrice est passée ; le dossier est ouvert. L'estaminet, lui, répond que « c'est en cours de résolution ». » | fixed |
| night.js | `POLICE_LINES.call.asso[1]` | « un téléphone vibre chez Dédé » hints at the tip-off before `seen_tipoff`. | Keep only « le bloc saura qui a appelé ». | fixed |
| night.js | `POLICE_LINES.lemaire.never_came[1]`, `BARKS.police_passing[0]` | Hints at Lemaire's free meals (« il dîne… pas au hasard », « il est sympa ») without `seen_complaisance`. | Neutral wording. | fixed |
| night.js | `KLAAS_NOTEBOOK.complaisance.precise[1]`, `lemaire/benali/chief.act[1]` | Name Dédé while `{rest}` can be any restaurant. | « le patron », or only for `bernadette`. | fixed |
| night.js | `POLICE_LINES.benali.act[0]` | Always cites the 22:00 rule, even when the fine is for capacity or the corridor. | « Vous êtes en infraction. » + `{detail}`. | fixed |
| night.js | `KLAAS_NOTEBOOK.pilou.precise[0]`, `.vague[0]` | Every act is placed at « fenêtre du n°10 », including street-level ones. | « devant le n°10 », or pick the line by location. | fixed |
| night.js | `KLAAS_NOTEBOOK.pee.precise[1]`, `POLICE_LINES.lemaire.for_pilou[1]` | Uncounted « Troisième » and « pour la première fois de la semaine ». | `{n}` / « Encore un. »; « pour une fois ». | fixed |
| night.js | `RECAP_HEADLINES.h_bucket_seen`, `h_scandal` | « la vidéo circule » without `video_viral`; « le commissaire » (the chief is Commandant Desmet, municipal police). | « des témoins parlent »; « la hiérarchie de la police municipale ». | fixed |
| media.js | `wa_tipoff` | Tables in at 22h01 is just the legal closing, not a tip-off. Klaas, on the square, can't hear a phone at n°10. | §7 timing (22h14 tables in, 22h19 police, 22h30 out again); drop the phone. | fixed |
| media.js | `wa_cat_2`, `press_petition`, `rv_carbonnade_good` | Mention petition leaflets / the bloc's petition / banners without `petition_started` / `cm_happy_petition` / `banners_up`. | Add the flags. | fixed (`wa_cat_2`, `rv_carbonnade_good` reworded; `press_petition` split into `press_petition` / `press_petition_duel`) |
| media.js | `wa_cardboard` | Klaas « a vu un pyjama » at a fixed 0h52 with no witness flag. | Gate on `klaas_noted_pilou`, or « constaté le matin ». | fixed (« constaté ce matin, 7h10 ») |
| media.js | `press_scandal`, `press_igpn` | Claims documented tip-offs / « nos révélations » when the source can be the bribe photo alone. | Add `seen_tipoff` / `press_scandal`, or reword. | fixed (reworded) |
| media.js | `press_rule_2200` | « contre minuit rue de Gand » on Mon–Tue (elsewhere it's 23:00 Sun–Wed); this is the journalist's voice, not the bloc's. | « contre 23h ou minuit ailleurs dans le Vieux-Lille ». | fixed |
| media.js | `so_bloemkool` | « carte d'automne »; the campaign is in summer (d9 « en plein été »). | « carte d'été ». | fixed |
| media.js | `rv_boast_3` | Customers at n°10 see Klaas writing from the far square. | « un vieux monsieur barbu, tout au bout, nous regardait en écrivant ». | fixed |
| night.js / media.js | `BARKS` « Uber », `h_bucket_unseen` « Météo-France », `press_bombance` « boules Quies » | Real brands/bodies, harmless. | Optional: « VTC », « les météorologues », « bouchons d'oreille ». | fixed |
| dialogue.js | (cross-check) | `hippolyte_trou` already stays silent once `knows_trou` is set; nothing in dialogue.js contradicts night/intro/media. | — | fixed |

## 2026-10-08 · pass 2 · content-fixes

Every content-side row above is now `fixed`. Rows still marked `engine` or `balance` are waiting on those agents, and the GAME_DESIGN §2 wording is the design agent's.
Boundaries respected: no ending-level `when` / `whenAny` / `priority`, no countermove `when`, and no existing effect number was changed. Countermove findings were fixed in the text.
Epilogue *part* gates were changed only where the text claimed something false (`backroom_caught`, `bombance_wait`, the scandal parts).
New content: actions `pm_waiter_testimony`, `pm_klaas_notebook`, `pm_answer_hate_wave`; flags `waiter_testimony`, `klaas_log_certified`, `backroom_caught`, `bombance_wait`;
media `press_petition_duel`; dialogue `nico_hate_wave_answered`, `klaas_certified`, `serveur_testimony`, `serveur_backroom`, `hilde_laxative`, `avocat_backroom_caught`.
Audit re-run: 0 flags set-but-never-read; read-but-never-set = `custody`, `tatie_leaked_plan` (engine).

## 2026-10-08 · pass 2 (transcripts) · design agent, task `story-transcripts`

**Method.** `npm run story -- --bot <name> --seed N --out qa/stories/<bot>-<N>.md` (new `scripts/story.js`) plays one full campaign
headless, with `narrative.js` and the same night narrator as `main.js`. It prints the campaign day by day: Koddex picks and results,
event cards and the bot's choice, counter-moves, dialogue, afternoon actions, the night log (actions, police, witnesses, Klaas's notebook,
bell, barks), the recap headline, the phone, then the commission scene, the ending and its epilogue. There are 12 transcripts in
`qa/stories/` (2 seeds per bot). They were read like a player would, by the design agent (`legal-3`) plus 4 parallel readers, and every
finding was checked against the transcript before being logged here. About 140 raw findings came out, many duplicated across runs;
they are grouped below. The transcripts were then regenerated after the fixes (the diplomat runs now reach **negotiated peace** through the
new negotiation event, where they used to end in « the return » with a charter nobody had negotiated).

**Tone:** no break found. The satire stays on the institutions, the bloc and Pilou; Ch'ti stays light, tu/vous is consistent, and the
only English is deliberate (`rv_tourist`, the « OPENING » sign).

| File | Id | Problem (seen in) | Fix | Status |
|---|---|---|---|---|
| **Biggest: the run ignores what happened** | | | | |
| campaign.js | D14 | After the commission's verdict the day goes on: dialogue, afternoon actions, counter-moves, a full night with the suspended terrace still out, and the recap « La commission du jour 14 va devoir l'écouter » (all 12). A lost commission ends at once instead, flagged `early: true`. | End the campaign right after `d14_commission` for every outcome, with `early: false`. | engine |
| events.js / sim | `r_drache` | « Les terrasses se vident en quatre minutes » but the night log keeps every table out until midnight (6 runs). | The sim should read `random_drache` (clear the terraces around 21:15, or start the night rained-out). | engine |
| campaign.js | night-phase events (`r_suitcases` 1h07, `r_waiter_smoke` 0h20, `r_fire_brigade` 22h35, `r_bachelor_party` 23h40, `d4_colette_dinner`) | Shown as cards before the night, so a 1h07 scene comes before 20:30. On D4, Colette sits at « LA table » the stink bomb emptied at 20:33. | Show night-phase cards at their clock time inside the night (or right after it), and let the D4 dinner put a table out. | engine |
| actions.js | `klaas_noted_pilou` in 8 `witnessed.effects` | Any witness (a customer, Dédé) set « Klaas noted it », so Klaas, Jérémie and the epilogue reacted to things Klaas never saw (reckless-12). | Removed from content: the engine already sets it only when Klaas is a witness (campaign.js day witnesses, night memories, nightActions.js). | fixed |
| events.js | `d14_commission` charter pitch | The diplomat won with « une charte… signée par les deux camps » that was never negotiated (diplomat ×2). | New event `r_charter_talks` (D8–13, after an AG « dialogue » vote): negotiate article by article (sets `charter_drafted`) or walk out. The pitch now requires `charter_drafted`. | fixed |
| **Fixed texts that contradict the sim** | | | | |
| media.js / dialogue.js | `wa_tipoff`, `seb_tipoff` | Hard-coded « 22h14 / 22h19 / 22h30 » and « 22h38 / 22h43 », and « l'estaminet », against the real tip-off of the night (all runs). | Rewritten without clock times. | fixed |
| dialogue.js | `klaas_complaisance` | « 22h40 … un café … 23h10 » against the night log. | Rewrite without times. | open (dialogue owner) |
| actions.js | `night_ronde_jeremie` result | « À 22h04, trois terrasses sont encore dehors » printed at 21:30, every night. | Rewritten, no clock time. | fixed |
| koddex.js | `clode_db_logger_pride`, `standup_three` | « 81 dB à 0h12 », « 82 dB » (never measured; the passive bot has no logger). | No numbers. | fixed |
| koddex.js | `proj_db_report` | « six pages, un graphe par nuit » after 1–2 nights. | « Un PDF, un graphe par nuit ». | fixed |
| koddex.js | `clode_scraper_find` | « Nouvel avis » quoted the D1 review `rv_boast_1`. | A new review quote. | fixed |
| media.js | `wa_pee_door` « vers 1h », `wa_drache` « trois minutes » vs the card's « quatre », `wa_banners` « trois » vs `pm_banners` « six ». | Aligned (« hier soir », « quatre », « six »). | fixed |
| events.js | `d14_commission` | Ghislain's « 412 clients… Bruges » vs `cm_happy_petition`'s 2 300 / « Jean Bon (Bruxelles) ». Delphine's « constaté au jour 9 », « réunion du jour 11 », and the pitch « depuis le J9 »: game jargon in a hearing. | 2 300 + Jean Bon; « mardi », « jeudi ». | fixed |
| events.js | `d13_saturday`, `r_biloute_chairs`, `r_bachelor_party`, `r_tatie_proverb`, `d4` (« jeudi prochain »), `d9` (« jardinière ») | « 21h58. Une première » (it wasn't); « pendant la ronde, à 20h45 » (the round starts at 21:30); « Klaas appellera ça mardi » on a Wednesday; Tatie's tea day changing; the AC « jardinière » vs « bâche ». | Times, weekdays and « firsts » removed or aligned. | fixed |
| endings.js | `legal_victory` (`ac_violation_confirmed`), `the_return` | « une jardinière de géraniums » after a surprise visit (no jardinière); « Vous auriez dû garder ce surnom pour vous » (Pilou never told anyone); « Pendant une semaine » vs the front page « À peine la commission passée ». | Fixed in each part. | fixed |
| events.js | `r_influencer` | Someone urinates on Pilou's door on a weekday (Saturday-only in the bible). | The door is blocked by a chair instead. | fixed |
| **Characters reacting to what didn't happen, or ignoring what did** | | | | |
| dialogue.js | `lemaire_order`, `lemaire_priorities` | Lemaire speaks after his transfer (mixed-6). | `notFlags: ['lemaire_transferred']`. | fixed |
| dialogue.js / media.js / events.js | `seb_traitor`, `wa_regis_unmasked`, `r_traitor_gossip` | Régis « a quitté le groupe » even when Pilou told Jérémie discreetly; then Seb wants to remove him from the group he already left. | New flag `traitor_public` (set by the « balancer sur le groupe » choice), which gates `wa_regis_unmasked`; `seb_traitor` is excluded once it's set. | fixed |
| dialogue.js | `tatie_resist`, `tatie_wavering`, `delphine_ac`, `biloute_stairs`, `seb_hello`, `regis_after`, `klaas_saturday`, `seb_group_activity`, `hippolyte_hello` | « Pas moi » while wavering; « hier » three days later; « Je ne vous promets rien » after the violation was confirmed; Biloute smells carbonnade on a Pilou who never ate any; Seb « adds » Pilou to the group he joined on D1 and mentions a sound meter he doesn't have; Régis in Pilou's stairs (he lives at n°27); « deux pipis » after a Saturday of a dozen; « depuis 22h » said in the afternoon; 1832 vs 1827. | Gated or reworded. | fixed |
| countermoves.js | `cm_regis_leak_petition` | « Une heure avant que votre pétition soit imprimée » after it was delivered. | `notFlags: ['petition_delivered']`. | fixed |
| countermoves.js | `cm_table_dance_again` | Same text up to 8 times in a run, including after the commission. | `once: true`. | fixed |
| events.js | `r_colette_interview` | Anne-Sophie asks « Vous avez des éléments ? » after publishing the interview. | `notFlags: ['press_article']`. | fixed |
| actions.js | `pm_press_contact` | « une ex-maire ? » on D2, before Colette's dinner ties her to the case. | Removed. | fixed |
| actions.js | `night_stink_bomb` result | « Personne n'accuse le farceur » right after customers point at Pilou's window; « un record » every night. | Neutral wording. | fixed |
| events.js | `r_bombance_project` | Both anti-bar options greyed for a player who has Hippolyte's workshop (`hippolyte_room`) and his support. | The Hippolyte option needs `hippolyte_room` (was `heritage_angle`). | fixed |
| dialogue.js | `regis_courted`, `journaliste_first` / `journaliste_solid`, `nico_hello`, `serveur_named` | Régis half-confesses before he is unmasked; the journalist's first contact after « Ça, c'est un dossier »; Nico's group rules differ from `wa_welcome`; « Tu m'appelles Théo maintenant ? » days after first naming him. | Gate on order (`once` + flags) and align the rules. | open (dialogue owner) |
| actions.js / dialogue.js | `pm_bloc_fooled`, `tatie_bloc_fooled` | The fake « manif samedi » plan is « foiled » the same Monday, and told twice. | Needs a delay (day gate) and one telling. | open (actions owner) |
| endings.js | `legal_victory`, endings without `video_viral` | The « Waterzooi-gate » scandal, the viral video and the hate wave are missing from the epilogues of runs that had them. | New shared `AFTERMATH` parts (press scandal, Lemaire's postcard, viral video, hate wave answered or not) in moving out, the return, scandal, legal victory, peace. | fixed |
| **Night text** | | | | |
| night.js | police `nothing` / `tipoff` | « Rien à constater » / « une rue d'une sagesse exemplaire » while other restaurants are still out. | The lines name the one restaurant the patrol checked (`{rest}`). | fixed |
| night.js | `POLICE_LINES.ignored` | « votre 14e appel » counted the carried-over fatigue, not tonight's calls. | No ordinal. | fixed (the counter itself: engine) |
| night.js | bark « Il est 22h10 » | Said at 20:45. | Rewritten without a time. | fixed |
| night.js | `WAITER_LINES.theo.refused` | One line, said 4–12 times a night. | 4 variants (the repeats themselves: engine). | fixed |
| night.js / narrative.js | recap | Stink-bomb or sabotage nights read « Une nuit ordinaire, quelques photos de plus », even with no photo. | Headlines `h_kitchen`, `h_stink`, `h_sabotage` (fed by the `night-action` journal); the quiet headline no longer mentions photos. | fixed |
| nightActions.js | `night_bribe_photo_window` | The envelope is photographed at 20:30 with no patrol in the street. | Needs a patrol on site (`policeOnsite`). | fixed |
| **Engine (for the build agent)** | | | | |
| campaign.js | Koddex « travail » | Each generic `'work'` pick resolves to the same work item, so the same result prints 2–3 times a morning, every day (all 12). Weekends have stand-ups too. | Resolve each `'work'` to a different available item (or rotate); decide on weekend mornings. | engine |
| campaign.js | afternoon | The same repeatable action twice in one afternoon (`pm_whatsapp_rally`, `pm_fake_reviews` ×7). | One use per afternoon for repeatable actions. | engine |
| sim / main.js narrator | repeats | The same witness line for each witness of one act (« C'est lui ! Là-haut ! » ×4), the same bark twice a night, Théo's refusal every 10 minutes. | De-duplicate by witness kind per act; keep a short « recently said » memory per pool. | engine |
| summary.js | verdict | The nightly verdict scores only that night (« Pas grand-chose à montrer » at Dossier 62, « Dossier solide » on D1 at 17); the custody verdict always blames « le seau d'eau ». | Score on the campaign's Dossier; say what actually caused the custody. | engine |
| police.js / campaign.js | call counter | « appel n°2 » again each night (the counter carries the fatigue). | Count tonight's calls for display. | engine |
| sim.js | photo dB | Every 20:30 photo reads 36 dB (`noiseBed` is only computed after 22:00). | Measure at the table when the photo is taken. | engine |
| ui (`nameOf`) | « Théo » | The speaker label shows « Théo » before `met_waiter` (the transcript script now uses « Le serveur »). | Use `CHARACTERS.serveur.title` until `met_waiter`. | engine (UI) |
| dialogue scheduling | `*_hello` | Klaas introduces himself on D12 after reading his notebook to Pilou on D2. | Show a character's hello before any other line of theirs. | engine |
| campaign.js | `press_scandal` / `bribe_photo` | The press scandal changes nothing (no inquiry), while a bribe photo opens an inquiry on its own on night 1 with no transmission. | Tie the inquiry to an actual transmission (IGPN report or the press). | engine |
| **Balance (for the balance agent)** | | | | |
| | legal / mixed | Asso 100 by D4 and Dossier 100 by D5: the last 9 days have no stakes. | Diminishing returns on Asso / Dossier. | balance |
| | reckless / stealthy | Stink bombs raise Sleep (they empty the terrace under the window); Risk sits at 84 for days, then custody on a morning with no act; nine buckets leave Risk at 33. | Review the Risk decay and the custody trigger. | balance |
| | diplomat | Now reaches negotiated peace through `r_charter_talks` (chance 0.6, D8–13). | Re-run `npm run sim`; the peace ≥ 40 % target may be met now. | balance |

### Pass 2 (transcripts) · follow-up, task `story-fixes`
Status changes for the rows above (re-checked on fresh `legal-3` and `diplomat-8` transcripts):

| Row | Now |
|---|---|
| D14: the day went on after the verdict | **fixed** by 10a1dfd (build agent): the campaign ends right after `d14_commission`, `early: false`. Both refreshed transcripts end at the commission. |
| `r_drache` had no effect on the night | **fixed**: `simEffect: 'rain'` clears every terrace within about 4 minutes; nothing comes back out. |
| Night-phase events shown before the night | **fixed**: events get an `at` hour and play inside the night (`campaign.nightEventDue` / `resolveNightEvent`, `main.js` overlay, `playNight`). |
| Koddex « travail » repeated / repeats in general | **fixed**: 3b36eac (build agent) avoids duplicates within a morning. A `repeatCooldownDays` (4) cooldown now applies to dialogue, counter-moves, random events, Koddex work items and gags, unless the entry is marked `repeatable: true`. The same work result now comes back every 4 days at most. |
| Witness line repeated per witness | **fixed**: one narrated line per witness kind and act. |
| `klaas_complaisance`, `journaliste_first` / `journaliste_solid`, `nico_hello`, `regis_courted`, `pm_bloc_fooled` / `tatie_bloc_fooled` | **fixed**: no clock times; the journalist's first contact only while the dossier is thin; Nico's rules match `wa_welcome`; Régis deflects instead of half-confessing; the bloc's reaction to the fake « manif samedi » comes after the first Saturday, in the past tense. |
| Still open | Engine: nightly verdict score, custody verdict text, the police call counter, the 20:30 photo dB, the « Théo » UI label, hello-line ordering, the IGPN trigger. Balance: the rows above. `serveur_named` (« Tu m'appelles Théo maintenant ? » days late) is still open for the dialogue owner. |
