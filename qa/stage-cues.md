# Stage cues: content's proposal (§12e.6 « it exists or it doesn't »)

Content agent → art agent (owner of `src/scene`). Every night line will carry `stage: { cue, at?, dur? }`, and the director plays
the cue when the line is shown. This table proposes the cue ids the night text needs. **Please publish the ids you accept in
`src/scene` (a `STAGE_CUES` export: id → what you play).** Content will then add a `stage` to every line and delete the lines
you can't stage. The coherence checker can then fail on an unstaged line.

Proposed cue format: `stage: { cue: '<id>', at?: '<anchor>', dur?: seconds }`, where `at` is an existing anchor (`under_window`,
`terrace`, `door_10`, `end_A` = rue de la Barre, `end_B` = the place, `balcony_13`, `window_19`, `window_klaas`, `corner`).
Audio-only cues (`audio:*`) count as staged: they are heard, at a position.

## Twists: one generic rule, no per-line data
Each `TWISTS[i].sim.events[n]` and `sim.windows[n]` plays **`twist:<twistId>:<n>`** at its `at` (the director already forwards
twist-moment events and places twist props: `art.twists`). Barks and Klaas lines of a twist use the generic cues below
(`bark` from a customer with a speech bubble, `klaas_writes`).

## Night lines (`src/content/night.js`)
| Group | Proposed cue | Notes |
|---|---|---|
| `BARKS` (customers) | `bark` at a random out table (speech bubble + voice blip) | police_passing: `bark` near the patrol |
| `KLAAS_NOTEBOOK` | `klaas_writes` (Klaas at his window, notebook, pen) | bedtime: `klaas_lamp_off` |
| `WITNESS_LINES` | `witness:<kind>` (that witness turns and looks; customers raise phones when filmed) | nobody: no cue needed (nothing happens) |
| `POLICE_LINES` | already staged by the police actors (arrive, act, café, tip-off) | add `police_cafe` (cup, Dédé) and `police_tipoff` (tables rushed in) if missing |
| `WAITER_LINES` | `waiter_reply` (waiter turns to Pilou, gesture per outcome: shrug, nod, points at Dédé) | |
| `BELL` | `bell_22` (audio, the 22:00 bell) | |
| `CLATTER` | already staged (chairs dragged per table) | |
| `STREET_LINES` | `pee` (existing), `round_note` (Jérémie writes), `db_meter` (Pilou's phone shows dB) | |
| `PHONE_PINGS` | `phone_buzz` (Pilou's phone vibrates, HUD) | the phone is staged on screen |
| `RECAP_HEADLINES`, `NIGHT_END` | none (end screens, not night lines) | |

## `AMBIENT` (64 street-life lines): one cue each
| id | proposed cue | id | proposed cue |
|---|---|---|---|
| scooter | `pass:scooter` | couple_argue | `npc:couple_argue` at under_window |
| tourist_grand_place | `npc:tourist_asks` at terrace | window_opens | `win:opposite_opens` |
| gaufre_balcony | `char:gaufre_edge` | bottle_rolls | `prop:bottle_roll` |
| quinquin | `pass:drunk_singer` | delivery_lost | `pass:delivery_rider` (circles twice) |
| bell_maurice | `audio:bell_far` | dog_bark_far | `audio:dog_far` at end_B |
| heels_cobbles | `pass:heels` | suitcase | `pass:suitcase` |
| birthday_far | `audio:song_far` | phone_loud | `table:phone_loud` |
| toast_loud | `table:toast` (stand, glasses clink) | smoker_ghislain | `char:ghislain_smoke` at door_10 |
| dede_laugh | `char:dede_laugh` (inside, window glow + audio) | klaas_light | `char:klaas_lamp_on` |
| hilde_curtain | `char:hilde_curtain` | tatie_window | `char:tatie_window` |
| jeremie_light | `char:jeremie_light` (3rd floor) | seb_nico_laugh | `char:seb_nico_laugh` |
| tram_bell | `pass:cyclist_bell` | glass_breaks | `table:glass_break` (+ applause) |
| chair_falls | `table:chair_falls` (waiter picks it up) | guitar | `npc:guitarist` at corner |
| guitar_leaves | `npc:guitarist_leaves` | police_car_far | `audio:siren_far` at end_A |
| taxi_waits | `npc:taxi_waits` at end_A (hazard lights) | group_photo | `table:group_photo` (flash) |
| student_choir | `pass:student_group` | pigeon | `table:pigeon` |
| kid_scooter | `pass:kid_scooter` | menu_board | `char:waiter_board` |
| exhaust_cough | `fx:exhaust_puff` | ac_drip | `prop:ac_drip` (drops + audio) |
| neighbour_shout | `audio:shout_high` | wedding_horn | `audio:wedding_horn` at end_A |
| bike_bell_drunk | `pass:bike_singer` | fries_smell | `fx:exhaust_puff` (big) |
| umbrella | `prop:parasol_snap` | lost_keys | `npc:lost_keys` |
| cat_fight | `audio:cat_fight` + `char:gaufre_edge` | binoculars_glint | `char:klaas_glint` |
| rain_drops | `rain:drops` | rain_umbrellas | `rain:umbrellas` |
| rain_gutter | `rain:gutter` | sat_crowd_song | `crowd:sing` |
| sat_bachelor | `pass:bachelor_party` | sat_glass_stack | `prop:glass_tower` at door_10 |
| sat_ambulance | `pass:ambulance` | weekday_quiet | `audio:quiet_dip` (ambience drops for a few seconds) |
| weekday_jogger | `pass:jogger` | late_street_sweeper | `pass:street_sweeper` (turns back) |
| late_last_bus | `pass:runner` toward end_A | late_owl | `audio:owl` |
| late_waiter_smoke | `char:waiter_sits_smoke` | late_snore | `audio:snore` |
| early_setup | `char:waiter_glasses` | early_happy_hour | `prop:board_malunes` (read at the terrace) |
| early_sunset | `light:sunset_gables` | bell_22_after | `audio:bell_22_tail` |
| chti_drunk | `bark` (shouted) | window_lamp | **unstageable**: a reflection of Pilou's face. Delete, or only when Pilou is at the window (`state: { at: 'window' }`) |

## Night events with popups (`events.js` entries with `at`)
Each gets a cue named after its id, `event:<id>` (e.g. `event:r_influencer`), unless a twist cue already covers it.
