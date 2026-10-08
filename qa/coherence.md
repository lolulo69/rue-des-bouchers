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
| flags.js / endings.js | `tatie_leaked_plan` | Read by 3 endings, never set. The §2 « Tatie leaks your real plan » risk is not implemented. | countermoves owner: add a countermove (e.g. `tatie_wavering` + a plan flag such as `petition_started` → leak), or endings owner drops the parts. | open |
| flags.js / endings.js / koddex.js / media.js | `custody` | Read by the `custody` ending, `night_ask_waiter`, `stephane_custody`, `wa_custody`, `press_end_custody(_sugar)`, never set. The night sim ends with reason `custody` (`src/sim/sim.js:117`) but sets no flag, and its risk scale isn't the campaign's. | Engine: set `custody` when a night ends that way (or merge the risk scales). Until then only `risk >= 90` reaches the ending. | engine |
| flags.js | engine block (`night_photo`, `night_db`, `bucket_used`, `talked_waiter`, `video_viral`, `seen_complaisance`, `corridor_measured`, …) | No campaign engine yet, so no engine flag is ever set. `r_waiter_smoke`, `cm_fake_post_viral`, the scandal route and several epilogue parts are unreachable until then. `night_db`, `bucket_used` are never read. | Engine to-do. Optionally read the 2 unused flags (e.g. dossier epilogue). | engine |
| flags.js | `kitchen_fire`, `hate_wave_answered` | Declared, never set or read. | actions/countermoves owners: set them (cardboard consequence → `kitchen_fire`; an answer choice on `cm_fake_post` → `hate_wave_answered`), or remove. | open |
| all files | 22 flags set but never read (`reported_mairie`, `filmed_faces`, `police_flooded`, `cardboard_exhaust`, `complaint_filed`, `hygiene_visit`, `asso_meeting`, `met_delphine`, `bloc_fooled`, `fake_reviews`, `read_reservations`, `read_emails`, `colette_dinner_ignored`, `ag_held`, `stance_legal`, `inspector_surprise`, `inspector_announced`, `ac_case_stalled`, `exhaust_meeting_lost`, `saturday2_done`, `proj_db_report`, `proj_klaas_ocr`) | Set, then nothing reacted to them. | Each now has at least one reaction line in dialogue.js. Re-run of the audit: 0 flags set-but-never-read. | fixed |
| actions.js / src/config.js | `witnessed.by` | actions use witness ids `seb_nico`, `waiter`, `customers`, `police`; the sim's `WITNESS` keys are `klaas`, `gaystapo`, `waiter`, `customers`. `seb_nico` and `police` match nothing. | Build agent: pick one id set (suggest `seb_nico`, since the group label must stay a constant; the `gaystapo` key bakes the release name into code) and map `police` or drop it. | open |
| **Tatie's thread (now 12 promises)** | | | | |
| README.md | decisions log | Says promises #1 → #7; countermoves has 12. | Write #1 → #12. | doc |
| flags.js | `tatie_mail_7` | Description says « (la dernière) ». | Move « (la dernière) » to `tatie_mail_12`. | open |
| GAME_DESIGN.md §2 | Tatie row | « promise #14 ». | « promise #12 ». | doc |
| endings.js | `ASSO_FATES` `tatie_mail_7`, `legal_victory` `tatie_emails_shared` | « les sept promesses » although mails 8–12 usually arrive by D14. | Gate on `tatie_mail_12` (« douze ») or say « toutes les promesses ». | open |
| countermoves.js | `tatie_mail_06` | « depuis l'an dernier » vs `tatie_mail_01` (since 2023), `tatie_mail_02` (2024) and `d11_exhaust_meeting` (since 2019). | « depuis des années ». Also align d11's 2019 with 2023. | open |
| dialogue.js | `tatie_mail_7` | Mid-thread line, fine; added `tatie_mail_12` (« la dernière, c'est une réponse automatique »). | Done. | fixed |
| **Timeline** | | | | |
| countermoves.js | `cm_regis_courted` | `day: [2, 8]` but Klaas reads a « Mardi, 21h10 » entry: on D2 afternoon that dinner hasn't happened. | `day: [3, 8]`, or « Avant-hier… Hier… ». | open |
| countermoves.js | `cm_harassment_hostility` | `day: [5, 14]` jokes about the olfactory consultant, first seen in `tatie_mail_07` (≥ D7). | Add `flags: ['tatie_mail_7']`, or drop the consultant. | open |
| events.js | `r_suitcases` | Set at « 2h07 »; nights end ~01:30 (§3). `speaker: 'regis'` though he isn't in the scene. | « 1h07 »; drop the speaker. | open |
| events.js | `d4_colette_dinner` (« Prévenir le groupe ») | D4 is Thursday; Tatie says « Je la vois jeudi pour le thé » while Colette dines downstairs that Thursday. | « jeudi prochain ». | open |
| events.js | `r_colette_interview` | Only random event with no `phase`: can fire at night. | `phase: 'morning'`. | open |
| actions.js | `pm_delphine_channel` | No day cap; « announced visits are useless » is dead text after D9. | `day: [3, 8]` or `notFlags: ['inspector_announced', 'inspector_surprise']`. | open |
| endings.js | `scandal`, `seen_complaisance` + `met_klaas` part | « sur trois semaines »: the campaign lasts 14 nights. | « deux semaines ». | open |
| dialogue.js | `delphine_visit` | Was `day: [9, 9]` and stated the AC was found, but on the « announced » branches the AC is hidden (« constat : néant »). | Now gated on `ac_violation_confirmed`, once. | fixed |
| dialogue.js | `hippolyte_inspector_announced`, `seb_inspector_surprise` | First drafts said « débranchée » / « mètre ruban »; d9 says disguised as a « jardinière » / « mètre laser ». | Aligned with d9. | fixed |
| **Spoiler rule** | | | | |
| actions.js | `pm_klaas_roster` | « Le café, c'est toujours les mêmes jours » reveals Lemaire's free meals without `seen_complaisance`. | Cut the café sentence. | open |
| events.js | `r_klaas_roster` | « moustache. Lent. Café. » same hint, requires only `called_police`. | Drop « Café. ». | open |
| actions.js | `pm_waiter_debrief` | Théo's « les jours où le brigadier mange » reveals the free meals ungated. | Since the informant is the source, add `seen_complaisance` to its `setFlags`. | open |
| endings.js | `ASSO_FATES`, `traitor_recruited` without `traitor_known` | Names Régis right after « Vous n'avez jamais su qui ». | Drop the name, or log the end-screen reveal as an exception in README. | open |
| **False claims (text asserts something no flag proves)** | | | | |
| actions.js | `pm_igpn_report` | Always mentions the back-room proof, even if only the legal window photo exists. | Neutral text, or a variant per `bribe_photo` / `bribe_photo_illegal`. | open |
| actions.js | `pm_press_scandal` | Puts Klaas's notebook on the front page without `met_klaas`. | Drop the notebook or require `met_klaas`. | open |
| actions.js | `pm_read_reservations` | Evidence label « 9 couverts par table » vs result « table 4 : 11 pers. ». | « jusqu'à 11 couverts par table ». | open |
| countermoves.js | `cm_regis_leak_petition` | « Dans l'atelier » without `hippolyte_room`; « sa contre-pétition » without `cm_happy_petition`. | Require `cm_happy_petition`; « à la réunion ». | open |
| countermoves.js | `cm_regis_blunder` | « ils déposent la pétition jeudi » requires only `whatsapp_rally`. | Add `petition_started`. | open |
| endings.js | `the_return`, `won_legal` part | « la gaine part en toiture » without `exhaust_meeting_won`; « Les tables rentrent à 21h55 » while the AOT is suspended. | Split the gaine sentence; « Les tables de l'estaminet ont disparu ». | open |
| endings.js | `the_return`, `bombance_rumour` part | Claims Pilou answered « un problème à la fois », false if he warned Hippolyte. | Flag that choice and gate the line, or reword. | open |
| endings.js | `the_return`, `knows_trou` part | « en le répétant partout »: the flag only means Pilou knows the nickname. | « Vous auriez dû garder ce surnom pour vous. » | open |
| endings.js | `custody`, first part | Dawn raid by the national police vs §9 (caught red-handed) and the sim summary (night at the station). | Arrest at night, in the street or at the window. | open |
| endings.js | `custody`, `backroom_sneak` part | « retrouvé caché dans l'arrière-salle »: `backroom_sneak` is set when the sneak *succeeds*. | Add `backroom_caught` in the witnessed effects; gate on it. | open |
| endings.js | `INSTITUTIONS` `conflict_exposed` in `legal_victory` | « dossier confié à un collègue qui part à la retraite » can show next to « La clim a été démontée ». | `notFlags: ['ac_violation_confirmed']` on that sentence. | open |
| endings.js / koddex.js | `KODDEX` `todo_app_rust` part, `work_todo_rewrite_again` | « cinquième réécriture / version » on a repeatable task; README says never count precisely. | « énième », or `once: true`. | open |
| **Voices / character rules** | | | | |
| actions.js | `night_wifi`, `pm_fake_reviews` | Clode Kode does the illegal work; the bible says he politely refuses and Pilou finishes alone. | Rewrite: Clode refuses (cites art. 323-1), Pilou does it himself. | open |
| **Reachability / mechanics** | | | | |
| endings.js | `scandal` | Only route is `corruption_proof`, set only by two actions that need `seen_complaisance` (engine flag, never set yet). README promises other routes (waiter testimony, Klaas log + tip-off). | actions owner: a `waiter_informant` testimony action and a `seen_tipoff` + `proj_klaas_ocr` action that set `corruption_proof`. | open |
| events.js / endings.js | `the_return` | Chain rumour (35%) → project (50%) → choice → win may fall under the 2% target (§13.F). | Raise chances, or make the D12 event fixed once the rumour is set. Check in the simulator. | open |
| koddex.js | `proj_db_logger`, `proj_whatsapp_bot` | §3 says passive dB evidence / cheaper mobilisation, but nothing mechanical reads them. | Engine: nightly dB evidence when set; `pm_whatsapp_rally` cheaper when set. | engine |
| koddex.js | `clode_farewell`, Stéphane gags, work tasks | Koddex mornings stay eligible after `unemployed`. | Engine skips the Koddex phase when `unemployed`, or add `notFlags: ['unemployed']`; drop `clode_farewell`. | open |
| koddex.js | `stephane_custody` | Dead until `custody` is set; from D5 custody ends the game anyway. | Remove, or keep for D < 5 once the engine sets the flag. | open |
| actions.js | `night_cardboard_exhaust` | Firefighter joke hints at a real fire risk to staff. Not a how-to. | Low priority: route the consequence through `hygiene_visit` / `kitchen_fire`. | open |
| **Cast coverage (dialogue.js)** | | | | |
| dialogue.js | journaliste, avocat, regis, biloute, gaufre | No contextual lines. | Added: Régis 7 (traitor only after `traitor_known`; before, just « dans la nuance »), Anne-Sophie Lepoutre 6, Maître Vandamme 6, Biloute 6 and Gaufre 5 (didascalies only). | fixed |
| dialogue.js | chef | Commandant Desmet *is* `chef` (no separate id). Never named in his lines. | Added `chef_complaint` (introduces himself by name) and `chef_flooded`: 6 lines. | fixed |

**Counts after this pass (dialogue.js, 177 entries):** Jérémie 19 · Klaas 15 · Tatie 14 · Seb 13 · Hilde 12 · Nico 12 · Hippolyte 11 · Régis 7 · Ghislain 7 ·
chef 6 · Stéphane 6 · journaliste 6 · avocat 6 · Biloute 6 · Dédé 5 · serveur 5 · Lemaire 5 · Delphine 5 · Gaufre 5 · Benali 4 · Colette 4 · Lescaut 4.
Only `pilou` and `clode` have none (Pilou is the player; Clode speaks in koddex.js).
