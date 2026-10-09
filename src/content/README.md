# src/content: story bible

Narrative content for « Rue des Bouchers » (GAME_DESIGN §14). Plain data, all in-game text in French.
This file records the writing decisions so that every text stays consistent. Read it before adding a line.

## Files
| File | Export | What |
|---|---|---|
| `characters.js` | `CHARACTERS`, `WHATSAPP_GROUP`, `PLACES` | Cast (keyed by speaker id), the WhatsApp group name, the street's businesses |
| `flags.js` | `FLAGS` | Flag registry. First block = flags the **engine** sets from the night sim |
| `dialogue.js` | `DIALOGUE` | Contextual lines |
| `events.js` | `EVENTS` | Fixed calendar + random events |
| `actions.js` | `ACTIONS` | Every legal / grey / illegal action of §6 |
| `countermoves.js` | `COUNTERMOVES` | The bloc's counter-moves (§8) + Tatie's email thread |
| `koddex.js` | `KODDEX` | Morning prompts, side projects, gags |
| `media.js` | `MEDIA` | The phone feed: WhatsApp group, La Voix du Nordiste, the bloc's posts + online reviews |
| `endings.js` | `ENDINGS` | The 8 endings + modular epilogues |

## Tone
- Satire aimed at **institutions, the bloc's tactics, bureaucracy and Pilou himself**. Never at the residents' identities.
- Ch'ti touches sparingly: *hein*, *biloute*, *drache*, *estaminet*, *allez va*, *min p'tit*. One per scene at most.
- Seb & Nico are defined by their **role**: the couple across the street, the gossip, the admins of the WhatsApp group. No humour about who they are.
- Work of fiction (§0): no real people, no real businesses. Kitchen sabotage has two tiers: the salt/sugar swap (« carbonnade sucrée », police court) and, darkest, a laxative in the carbonnade (comedic in play, treated as poisoning if caught → criminal court, the association disowns Pilou). Game level only: no product, no dose, no method.

## Typography (checked by `tests/unit/typography.test.js`)
French typography in every displayed string: apostrophe **’** (never `'` between letters); guillemets **« … »** with a no-break space (U+00A0) inside;
a narrow no-break space (U+202F) before **; ! ?** and a no-break space (U+00A0) before **:**; ellipsis **…** (never `...`).
Inner quotes inside « » use ‹ › . Code strings (ids, conditions, `{placeholders}`) are untouched.

## Cast quick reference
| id | Who | Where (§1b) |
|---|---|---|
| pilou | Pierre-Louis Dubeton, Rust dev at Koddex | n°10, 2nd floor, above the estaminet. Exhaust under his window |
| jeremie (+ biloute, dachshund) | Association president | n°10, 3rd floor |
| klaas, hilde | Notebook man (Santa look) and his kind wife | Place Maurice-Schumann, window looking down the whole street |
| tatie | Tatie Bouchon, proverbs and emails, tea with Martine | n°19, mid-street |
| seb, nico (+ gaufre, the cat) | The couple across the street, run the WhatsApp group | n°13, opposite Pilou, balcony |
| hippolyte | Carriage-building heir, heritage network | Rue de la Baignerie, off the square |
| regis | Régis Dewaele, holiday-let landlord, the bloc's recruit | n°27 |
| dede, ghislain | Estaminet co-owners (partners, not a couple). No real Bernadette | n°10 |
| serveur | Théo, the waiter | n°10 |
| lemaire, benali, chef | Police: free-meal brigadier, by-the-book agent, Commandant Desmet | |
| delphine | Inspector, AC case, married to Stéphane | Mairie |
| martine | Martine Aubrac, ex-mayor, pro-bloc | |
| delandre | Arnaud Delandre, current mayor, brought in the 22:00 rule, leans residents | Hôtel de ville |
| stephane | Koddex founder, "vibes", never there | |
| clode | Clode Kode, too polite | |
| journaliste, avocat | Anne-Sophie Lepoutre (La Voix du Nordiste), Maître Vandamme | |

## Facts every text must respect
- Terraces close at **22:00 every day** on rue des Bouchers (new in 2026). Elsewhere in the Vieux-Lille it's 23:00 / midnight: the bloc's favourite argument (« rue de Gand ferme à minuit ! »).
- **6 per table max**, rue des Bouchers only. Zones are **not marked** on the ground; a free **passage corridor** stays open in the middle.
- **Cobbles**: chairs dragged at 22:00, heels and suitcases at night, shattering bottles.
- **Saturdays (D6, D13)**: no vehicles → crowds, standing drinkers, people peeing in doorways (Pilou's too).
- **AC** installed without permission: an inspector (Delphine) came, the case is open. **Exhaust**: talks with the city, nothing decided.
- Martine Aubrac = **ex**-mayor, pro-bloc. Arnaud Delandre = **current** mayor, leans residents. Delphine is **married to Stéphane**.
- No CCTV on the street. Only Pilou's cameras.
- Lore: built in **1729**, nicknamed **« le Trou »**, a **canal** under it until 1912, **n°40** is listed.

## Spoiler rule (flags)
A line may only mention a fact once the player has unlocked it. Pilou knows from the start: the 22:00 rule, the 6-per-table rule, the AC case, the exhaust talks, that Delphine is his boss's wife, that Martine is the ex-mayor. Everything else is gated: Lemaire's free meals (`seen_complaisance`), the tip-offs (`seen_tipoff`), the patrol roster (`roster_known`), Régis's betrayal (`traitor_known`), anything read on the wifi (`read_*`), the waiter's name (`met_waiter`), the zones (`legal_view`), the bar at La Bombance (`bombance_rumour`).

## Decisions log
- **WhatsApp group name**: `WHATSAPP_GROUP` constant, provisionally « La Gaystapo ». Never hard-code it in text.
- **The dachshund is Biloute**; the cat is **Gaufre**. Seb & Nico live at **n°13** (odd side, opposite n°10). Tatie at **n°19**.
- **The traitor** (§8 "recruiting a resident") is **Régis Dewaele**, n°27, an association member who rents two holiday flats. His guests like the terraces, and the bloc courts him with free meals.
- **The chief** of the municipal police is **Commandant Desmet**.
- **The waiter** is **Théo**; text says « le serveur » until `met_waiter`.
- **Tatie's email thread**: Ghislain's answers are numbered promises (#1 → #12, one per morning at most; #12 is an auto-reply and the last), driven by `tatie_mail_N` flags, each more absurd. Never write a fixed count (« sept promesses ») in text that can show later: say « toutes les promesses ». She keeps every one; `tatie_emails_shared` turns the thread into evidence.
- **Scandal proof**: any police-corruption proof sets the summary flag `corruption_proof`. Four routes: the bribe photo from the window (`night_bribe_photo_window`, legal), the back-room photo (`night_backroom_photo`, illegal), Théo's signed testimony (`pm_waiter_testimony` → `waiter_testimony`, needs `waiter_informant`), and Klaas's certified notebooks (`pm_klaas_notebook` → `klaas_log_certified`, needs `met_klaas` + `roster_known` + `seen_tipoff`). The scandal path needs it plus `press_contacted`.
- **Clode Kode never does illegal work.** He refuses politely (article 323-1, a « vrai avis honnête » instead) and Pilou finishes alone. Results of illegal actions say so.
- **« le Trou »** is a discovery (`knows_trou`), never stated in the intro.
- **Back room**: `backroom_sneak` = the sneak happened; `backroom_caught` = Pilou was caught there (custody epilogue).
- **Commission (D14)**: the player picks their pitch; each pitch's `requires` encodes the thresholds. Pitches set `won_*` + `commission_won`, or `commission_lost`. Endings then read these flags, so « The return » (La Bombance) and « Turncoat » can override a win.
- **Moving out** is both the Sleep-0 early ending and the "lost commission" ending (`whenAny`).
- **Turncoat** = eating the carbonnade three times (`carbonnade_1..3`). Klaas writes each one down.
- **Koddex** (`koddex.js`): `PROMPTS_PER_MORNING = 3`. A side project's `cost.prompts` is spent in a single morning. Clode Kode **politely refuses** the illegal projects (wifi tool, fake reviews), so Pilou finishes them alone and the Risk is his. The WhatsApp bot is called **« Bip »**. The to-do app gag: the side project `side_todo_rust` sets `todo_app_rust` (the 4th Rust rewrite), and later rewrites are never counted precisely. Two extra legal projects: `proj_db_report` (dB graphs for the mairie, needs the logger) and `proj_klaas_ocr` (Klaas's notebook as a spreadsheet, needs `met_klaas`). `scraper_boasts` comes from running the scraper (public reviews, so it's **legal** evidence).
