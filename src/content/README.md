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
| `endings.js` | `ENDINGS` | The 8 endings + modular epilogues |

## Tone
- Satire aimed at **institutions, the bloc's tactics, bureaucracy and Pilou himself**. Never at the residents' identities.
- Ch'ti touches sparingly: *hein*, *biloute*, *drache*, *estaminet*, *allez va*, *min p'tit*. One per scene at most.
- Seb & Nico are defined by their **role**: the couple across the street, the gossip, the admins of the WhatsApp group. No humour about who they are.
- Work of fiction (§0): no real people, no real businesses. Nothing that harms anyone's health: the kitchen sabotage is a salt/sugar swap (« la carbonnade sucrée »).

## Cast quick reference
| id | Who | Where (§1b) |
|---|---|---|
| pilou | Pierre-Louis Dubeton, Rust dev at Koddex | n°10, 2nd floor, above the estaminet. Exhaust under his window |
| jeremie (+ biloute, dachshund) | Association president | n°10, 3rd floor |
| klaas, hilde | Notebook man (Santa look) and his kind wife | Place Maurice-Schumann, window looking down the whole street |
| tatie | Tatie Bouchon, proverbs and emails, tea with Colette | n°19, mid-street |
| seb, nico (+ gaufre, the cat) | The couple across the street, run the WhatsApp group | n°13, opposite Pilou, balcony |
| hippolyte | Carriage-building heir, heritage network | Rue de la Baignerie, off the square |
| regis | Régis Dewaele, holiday-let landlord, the bloc's recruit | n°27 |
| dede, ghislain | Estaminet co-owners (partners, not a couple). No real Bernadette | n°10 |
| serveur | Théo, the waiter | n°10 |
| lemaire, benali, chef | Police: free-meal brigadier, by-the-book agent, Commandant Desmet | |
| delphine | Inspector, AC case, married to Stéphane | Mairie |
| colette | Colette Verhaeghe, ex-mayor, pro-bloc | |
| lescaut | Bertrand Lescaut, current mayor, brought in the 22:00 rule, leans residents | Hôtel de ville |
| stephane | Koddex founder, "vibes", never there | |
| clode | Clode Kode, too polite | |
| journaliste, avocat | Anne-Sophie Lepoutre (La Voix du Nordiste), Maître Vandamme | |

## Facts every text must respect
- Terraces close at **22:00 every day** on rue des Bouchers (new in 2026). Elsewhere in the Vieux-Lille it's 23:00 / midnight: the bloc's favourite argument (« rue de Gand ferme à minuit ! »).
- **6 per table max**, rue des Bouchers only. Zones are **not marked** on the ground; a free **passage corridor** stays open in the middle.
- **Cobbles**: chairs dragged at 22:00, heels and suitcases at night, shattering bottles.
- **Saturdays (D6, D13)**: no vehicles → crowds, standing drinkers, people peeing in doorways (Pilou's too).
- **AC** installed without permission: an inspector (Delphine) came, the case is open. **Exhaust**: talks with the city, nothing decided.
- Colette Verhaeghe = **ex**-mayor, pro-bloc. Bertrand Lescaut = **current** mayor, leans residents. Delphine is **married to Stéphane**.
- No CCTV on the street. Only Pilou's cameras.
- Lore: built in **1729**, nicknamed **« le Trou »**, a **canal** under it until 1912, **n°40** is listed.

## Spoiler rule (flags)
A line may only mention a fact once the player has unlocked it. Pilou knows from the start: the 22:00 rule, the 6-per-table rule, the AC case, the exhaust talks, that Delphine is his boss's wife, that Colette is the ex-mayor. Everything else is gated: Lemaire's free meals (`seen_complaisance`), the tip-offs (`seen_tipoff`), the patrol roster (`roster_known`), Régis's betrayal (`traitor_known`), anything read on the wifi (`read_*`), the waiter's name (`met_waiter`), the zones (`legal_view`), the bar at La Bombance (`bombance_rumour`).

## Decisions log
- **WhatsApp group name**: `WHATSAPP_GROUP` constant, provisionally « Radio Balcon ». Never hard-code it in text.
- **The dachshund is Biloute**; the cat is **Gaufre**. Seb & Nico live at **n°13** (odd side, opposite n°10). Tatie at **n°19**.
- **The traitor** (§8 "recruiting a resident") is **Régis Dewaele**, n°27, an association member who rents two holiday flats. His guests like the terraces, and the bloc courts him with free meals.
- **The chief** of the municipal police is **Commandant Desmet**.
- **The waiter** is **Théo**; text says « le serveur » until `met_waiter`.
- **Tatie's email thread**: Ghislain's answers are numbered promises (#1 → #7), driven by `tatie_mail_N` flags, each more absurd. She keeps every one; `tatie_emails_shared` turns the thread into evidence.
- **Scandal proof**: any police-corruption proof sets the summary flag `corruption_proof` (the bribe photo, Klaas's complaisance log + tip-off, the waiter's testimony…). The scandal path needs it plus `press_contacted`.
- **Commission (D14)**: the player picks their pitch; each pitch's `requires` encodes the thresholds. Pitches set `won_*` + `commission_won`, or `commission_lost`. Endings then read these flags, so « The return » (La Bombance) and « Turncoat » can override a win.
- **Moving out** is both the Sleep-0 early ending and the "lost commission" ending (`whenAny`).
- **Turncoat** = eating the carbonnade three times (`carbonnade_1..3`). Klaas writes each one down.
