# Rue des Bouchers — Game Design

> Living document. Lucas and the design agent own this file; the build agent implements from it.
> **[OPEN]** = not decided. **[CHECK]** = Lucas to confirm against reality.
> The game targets realism + satire, with a light touch of Ch'ti humour (only when it lands).

## 0. Fiction policy (public repo)
**This game is a work of fiction set on a real street** (rue des Bouchers, Vieux-Lille, with its real geography and its real
2026 terrace rules). **Every character, business, police officer, official and politician in it is fictional.** They are
invented people with invented actions. No real person or business is depicted, named, or accused of anything. The satire is
about a *situation* (terraces vs residents, complacent institutions, neighbourhood politics), not about real individuals.
- Use only the fictional names below, in code, assets and text. A test (`tests/unit/names.test.js`) guards against real names.
- Never write anything that presents a fictional character's misdeeds as a real person's.
- The title screen and README carry a fiction disclaimer.

| In game | Role |
|---|---|
| **Estaminet La Ch'tite Bernadette** | The main antagonist restaurant, directly under Pilou |
| **Les Bouchers Mal Lunés** | Steakhouse next door |
| **Bloemkool** | Flemish neo-bistro, the "chic" one |
| **Le Goulot** | Bistro, fish burger |
| **L'Endroit** | Bistro toward the square |
| **Truffe et Ficelle** | Street corner |
| **Mug** | Takeaway, customers drink standing in the street |
| **La Bombance** (closed) | Empty premises. Late-game threat: a new bar wants to open there |
| **Colette Verhaeghe** | Former mayor, still influential, protects the restaurants. Tatie Bouchon's contact |
| **Bertrand Lescaut** | Current mayor, **leans toward the residents** (brought in the 22:00 rule) |
| **Clode Kode** | Pilou's AI coding tool at Koddex (wink) |
| **La Voix du Nordiste** | Local newspaper |

## 1. Setting and rules (reality)
- After Covid, Lille extended terraces onto the street to help restaurants recover.
- **Terraces close at 22:00, every day**: a rule **specific to rue des Bouchers, new in 2026** (elsewhere in the
  Vieux-Lille: 23:00 Sun–Wed, midnight Thu–Sat). Satire material: the restaurants say "but rue de Gand closes at midnight!".
- **Max 6 people per table**. This applies **only on rue des Bouchers**.
- **Terrace zone**: each restaurant has an authorised zone, **not marked on the ground**, and a **free passage corridor** must
  stay open in the middle of the street (pedestrians, prams, wheelchairs, fire brigade). The restaurants overflow regularly.
  Gameplay: tables/chairs encroaching on the corridor = evidence (needs a measurement: Pilou's tape measure, or Klaas's paces).
  The zone is invisible by default. A "legal view" (unlocked via the association / the AOT permit document) shows it as a ghost overlay.
- **Cobblestone street (pavés)**. Gameplay: metal chairs dragged on cobbles = signature noise of terrace set-up and pack-up (the 22:00 clatter), heels and wheeled suitcases (Airbnb) at night, glass bottles that shatter. Low-poly cobble texture is enough.
- **No vehicles on Saturdays** → biggest crowds, people drinking standing up, and **people peeing in the street**
  (in doorways, including Pilou's).
- Enforcement: **municipal police**, who come especially when the caller mentions the Association.
  The **mayor's office** can also send its inspector.
- **Bernadette's kitchen exhaust**: talks with the city are under way, nothing decided. Ongoing conflict.
- **Unpermitted works**: Bernadette installed **air conditioning without authorisation**. A mayor's office
  inspector came, and the dispute is ongoing.

## 1b. Geography (real layout, scaled for the game)
- Rue des Bouchers is **~150 m long**, a narrow cobbled street created in **1729**, running from **rue de la Barre** (end A)
  to **place Maurice-Schumann** (end B, a small square also reached by rue de la Baignerie, rue Thiers,
  rue des Poissonceaux, rue de l'Hôpital-Militaire and rue de Tenremonde). Game scale can compress it to ~90–120 m, but keep the two ends.
- Numbering: low numbers near rue de la Barre. Bernadette (n°10) and Les Bouchers Mal Lunés (n°14) sit in the first third (end A),
  Bloemkool (n°22) mid-street, Le Goulot (n°33) and L'Endroit (n°34 bis) toward the square. La Bombance (n°4) and Mug (n°3) near end A.
- Pilou: **2nd floor** above Bernadette (the exhaust duct climbs the façade to just under his window).
  Jérémie: **3rd floor**, same building (his dachshund on the stairs).
- Seb & Nico: opposite Pilou, balcony with the cat.
- Tatie Bouchon: **in the middle of the street**.
- Klaas & Hilde: at the **far end, on place Maurice-Schumann**, with a window looking straight down the whole street
  (a long line of sight: he sees everything, but from far away. Details at night need his binoculars).
- Hippolyte: also by **place Maurice-Schumann**, on **rue de la Baignerie**, a small street at 90° off the square: the old carriage building
  (big wooden carriage door, cobbled courtyard). Meeting room for the association.
- Lore nuggets: the street was nicknamed **"le Trou"** for centuries because it was so filthy (satire: the bloc says
  "it's always been a party street", the residents answer "it's always been a hole"). A **canal ran under the street until 1912**.
  Number 40 is a listed historic house.

## 2. Characters

### Pilou: Pierre-Louis Dubeton (player)
Lives above Bernadette's; the exhaust is right under his window. Rust developer at **Koddex**, a startup
where his job amounts to prompting **Clode Kode** all day and building silly side projects.

### The Association de la rue des Bouchers
| Character | Who | Gameplay role |
|---|---|---|
| **Jérémie** | President, Pilou's neighbour, has a **dachshund** | Leads the evening **rounds** (dog walk = patrol). Unlocks official channels. The dachshund barks: it helps (spots things) and hurts (draws attention when you sneak). |
| **Klaas** | Elderly, Santa Claus look (big, not fat, white beard). **Sees everything, writes everything down.** | Passive **evidence engine**: his notebook logs infractions automatically. **Double-edged**: he also writes down what *Pilou* does. Only a lie or a bribe keeps an illegal act out of his notebook. |
| **Hilde**, Klaas's wife | Very kind | Brings food and tisane → restores Sleep and morale. Calms Klaas. |
| **Tatie Bouchon** | Old lady in the middle of the street who hands out wisdom: *« Si vous voulez quelque chose dans la vie, faut résister et se battre pour. »* Emails Bernadette about the smell. They always answer "it's being fixed"; she doesn't believe it. Also chats with **Colette Verhaeghe**. | Email thread = running gag and evidence ("promise #12 that it's being fixed", the 12-step thread). Her Colette connection makes her an unreliable channel: she can open a door at the mayor's office or leak your plan. |
| **Seb & Nico** (couple across the street, facing Pilou) | Know all the gossip, talk a lot, run the association's WhatsApp group (**« Radio Balcon »**, provisional name, one constant in `src/content/characters.js`). Their **cat** sits on the balcony. Written by their *role*: no humour based on orientation | The **WhatsApp group** is the association's nervous system: rally the troops, share photos, gossip. **Cat on the balcony = they are home and watching**: allies witness legal actions (+evidence) but also see illegal ones. |
| **Hippolyte** | Owns an old building where **carriages (calèches)** were made since the 1800s | Old money, knows the old families and the city's heritage department. Late game: heritage-protection angle (exhaust and AC on a historic façade), a meeting room in the former carriage workshop. |

### The restaurants ("restaurants vs residents")
The restaurants form a **bloc**: Bernadette's leads it, and the others back her.
- **Bernadette's owners**: two men, **business partners (not a couple)**. Bernadette is a fake name, there's no real Bernadette.
  - **Dédé**: short and stout, jovial in public, a fixer. Handles the police ("a coffee, a waterzooi, on the house").
  - **Ghislain**: skinny man with a **huge chignon (man bun)**, cold, does the paperwork and the emails ("it's being fixed").
- **The waiter**: young, overworked, sympathetic. Can become an informant.

### Institutions
- **Municipal police**: three patrols with different personalities.
  - **Brigadier Lemaire** [proposal]: eats for free at Bernadette's. Slow on the night's first call, and tips the restaurant off five minutes before arriving.
  - **Agent Benali** [proposal]: young, by the book, really comes. Is transferred if he is "too zealous".
  - **The chief**: only shows up after a scandal or a call from the mayor's office.
  - The **duty roster** is a hidden variable. Klaas can deduce it from his notebook ("Tuesdays and Fridays, it's Lemaire").
- **The mayor's office inspector** **Delphine Vermeersch**: handles the AC case. **Married to
  Pilou's boss.** Real but compromising lever: a dinner at the boss's place = an informal channel to her
  (a conflict of interest that can come out).
- **Colette Verhaeghe**: ex-mayor, still influential, protects the restaurants. Reached through Tatie Bouchon.
- **Bertrand Lescaut**: current mayor, **more on the residents' side** (he brought in the 22:00 rule). City hall is split:
  the new mayor and the inspector lean toward the residents, while the old Colette network and parts of the municipal police protect the bloc.
  Getting a meeting with Lescaut is a mid-campaign goal. Colette works to undermine him.
- **Koddex boss**: **Stéphane**, startup founder who is never there and talks about "vibes".

## 3. Structure: a 14-night campaign
Each **day** = 3 phases:
1. **Koddex (morning, 2D/menu, short)**. Pilou has 3 "prompts" a day to give Clode Kode. Options: real work
   (keeps the job), or secretly building side projects that help the fight:
   - a Rust dB-meter daemon → **automatic noise logging** (passive evidence);
   - a WhatsApp bot for Radio Balcon → association mobilisation costs less;
   - a review scraper → finds customers boasting about "terrace until 1am at Bernadette's 🍻";
   - a deepfake / fake reviews → **illegal**, big Risk.
   The boss notices if work output drops (Job meter). Gags: Clode Kode replies too politely, and it rewrote
   the boss's to-do app in Rust for the fourth time.
2. **Afternoon (menu)**: association actions (meeting, mayor's office, emails, press, lawyer, petition,
   recruiting residents), and the restaurants' counter-moves are revealed.
3. **Night (3D, ≈10 min)**: the street from 20:30 to ~01:30. Watch, gather evidence, act.

**Calendar** (two weeks, starting on a Monday):
- **Saturdays (days 6, 13)**: no vehicles → crowds, standing drinkers, peeing.
- **Day 4**: Colette Verhaeghe comes to dinner at Bernadette's (event).
- **Day 7**: association general meeting (vote on strategy: legal or "direct action").
- **Day 9**: the inspector comes back about the AC.
- **Day 11**: the exhaust meeting at the city (result depends on the dossier).
- **Day 14**: the **terrace commission** at the mayor's office → final ruling + endings.

## 4. Stats
| Stat | Effect |
|---|---|
| **Sleep** | Drained by noise and the exhaust after 22:00. Low Sleep = blurry photos, irritable dialogue, Koddex mistakes. |
| **Dossier** | Evidence. Each piece has a **quality** (timestamp, dB, headcount, witnesses) and a **legality** (illegally obtained = unusable officially, but usable for the press). |
| **Association** | Members' support. Some actions shock some members (Hilde doesn't like violence, Seb & Nico love drama, Tatie Bouchon is a fence-sitter). |
| **Risk** | Pilou's legal exposure. Grows with *witnessed* illegal acts. Thresholds: warning → complaint → police custody → trial. |
| **Job** | Koddex. Too low = fired (bad ending, or a twist: unemployed = free all day to fight). |
| **Bloc hostility** (hidden) | How much the restaurants target Pilou. |
| **Corruption** (hidden) | Strength of the restaurant–police–mayor's office links. Drops when it's exposed. |

## 5. Stealth: illegal = OK if no one sees you
Every illegal act checks for **witnesses** in line of sight + hearing:
- **Klaas** (window, almost always there; asleep ~01:00–05:00), **Seb & Nico** (cat on the balcony = present),
  the **waiter/owners**, **customers** (may film → viral video), Jérémie's **dachshund** (barks if you're nearby and nervous),
  **no CCTV on the street** (confirmed): the only cameras are the ones Pilou installs himself.
- Modifiers: darkness, time (after 01:00 the street is empty), disguise (hood, hi-vis vest = "looks like a delivery guy"),
  noise covering (Saturday crowds).
- Being seen = a **witness memory**. Allies can be asked to "forget" (costs Association); enemies use it.

## 6. Actions

### Legal
- Photo / video / dB reading (evidence).
- Politely asking the waiter to bring the tables in after 22:00.
- Calling the municipal police (saying "I'm calling for the Association de la rue des Bouchers" = faster response, but the bloc learns who called).
- Report to the mayor's office / email to the inspector.
- Association: rally the WhatsApp group, petition, banners on balconies ("SLEEP IS A RIGHT").
- Press: La Voix du Nordiste. Lawyer: formal notice (mise en demeure). The exhaust: complaint to the regional health agency (ARS) / environmental health (hygiène).
- Ask the city for a "uritrottoir" (pee box) for the street (realistic satire).

### Grey
- Dinner at the boss's with the inspector (conflict of interest).
- Filming customers with their faces (privacy issue).
- Flooding the police with calls (they stop coming).
- Pushing Tatie Bouchon to "leak" fake plans to Colette.

### Illegal (stealth)
- **Bucket of water** from the window (classic).
- **Taping cardboard over the exhaust** (it smokes out the kitchen → health inspection... or a fire! very dangerous).
- **Stink bomb** / tainting the food. Kitchen sabotage, two tiers: **« saboter la cuisine »** (swap the salt and the sugar: ruined service, bad reviews, trial if caught)
  and the darkest act, a **laxative in the carbonnade** (the terrace empties by 22:00; if caught it's treated as poisoning: criminal court,
  the association disowns Pilou). Game level only: no product, dose or method. No lethal poison.
- **Fake reviews** / fake TripAdvisor accounts.
- **Sabotage**: unscrew chairs, steal the parasols, glue the terrace locks.
- **Bribe the waiter** to rat out the owners.
- **Hidden cameras**: there's no CCTV, so Pilou installs his own. Filming the public street from private property is
  already not allowed in France (CNIL), so a camera at his window = grey; one hidden on the street/awning = illegal.
  Footage = continuous evidence, **unusable in court** but gold for the press, the internal police investigation (IGPN) and blackmail. If discovered → complaint.
  - **Power**: plug it into **Bernadette's electricity** (outdoor socket under the awning, the AC unit's line) = electricity theft.
  - **Network**: crack **Bernadette's wifi** (the Rust dev wink: a Koddex side project) = unauthorized system access, art. 323-1 of the penal code.
    Bonus: on their network you can read the reservations book (over-capacity proof), the "it's being fixed" emails, and the real exhaust quotes they never signed.
  - The camera can be found by: the waiter (smoke break), Ghislain cleaning the awning, the bloc's paranoia after a leak.
- **Photograph the police bribery** at close range (legal in itself, but hiding in their back room is not).

## 7. Police: what can happen when you call (inventive, realistic)
Outcome depends on: patrol on duty, time, how often you've called, whether you mentioned the Association, the dossier, Corruption.
- **They come and act**: tables brought in, a fine (PV). Rarely the whole terrace.
- **They come, have a coffee, leave**. Klaas notes "20:47, coffee offered, 0 fines" → evidence of **complaisance**.
- **The tip-off**: the tables vanish at 22:14, the police arrive at 22:19 ("everything's fine here sir"), and the tables come back out at 22:30.
- **"Ah, it's you again"**: after too many calls, Pilou is flagged as a **serial complainer** → lower priority.
- **The reversal**: the police come... for Pilou (a bloc complaint about "harassment", or Pilou doing something stupid).
- **The bribe itself**: Dédé slips an envelope / invites them to eat. Catching it on camera = **jackpot evidence**, but only if
  you have a clean shot from a legal spot. Leads to an internal investigation (IGPN) → Lemaire transferred → Corruption drops.
- **The mayor's office comes too**: an inspector visit is announced → the restaurants are perfect that night (tip-off via Colette).
  A surprise visit requires the Delphine channel or Hippolyte.

## 8. Restaurant bloc counter-moves
"It's being fixed" emails · tables brought in at 21:59 and back out at 22:20 · staff smoking under Pilou's window ·
bins in front of his door · free drinks to split the association (Tatie Bouchon) · petition of "happy customers" ·
complaint for harassment / defamation against Pilou · call to Colette · lobbying for Saturday to become "festive" ·
recruiting a resident (the traitor) · a fake post "Ch'tite Bernadette is being harassed by a resident, support us ❤️" → a wave of hate.

## 9. Endings (several)
1. **Legal victory**: terrace permit (AOT) suspended or withdrawn for Bernadette, exhaust moved. Requires a strong legal dossier and low Risk.
2. **Negotiated peace**: a good-neighbour charter signed by the bloc, 22:00 respected. Requires high Association and a "dialogue" stance.
3. **Scandal**: corruption exposed in La Voix du Nordiste, Lemaire transferred, Colette embarrassed. Strong but the bloc hates you.
4. **Custody / trial**: caught red-handed. Variants: the « carbonnade sucrée » trial, and the far worse « carbonnade laxative » case.
5. **Moving out**: Sleep at 0 → Pilou moves to Wazemmes. ("At least at the Wazemmes market, it's noise in the morning.")
6. **Fired**: Job at 0. Twist: it unlocks the full-time fight for the remaining days (hard mode).
7. **Turncoat (secret)**: Pilou becomes a regular at Bernadette's, eats the carbonnade, and Klaas writes it down.
8. **The return**: you win, then **La Bombance reopens as a bar** next door. Wink at a sequel.

## 10. Art direction and language
- **Stylised, cute low-poly**, in the family of cozy "simulator" games: chunky proportions, big heads, soft flat colours,
  warm lantern light at night, bouncy idle animations. Readable silhouettes: Klaas = Santa (white beard, red cardigan),
  Ghislain = huge bun, Dédé = short and round, the dachshund, the cat on the balcony. Flemish brick façades with stepped gables.
- Models are **procedural three.js geometry** (no external assets needed) unless a CC0 low-poly pack fits.
  Performance budget: 60 fps on a laptop iGPU.
- **French only** for all in-game text. Ch'ti touches in dialogue ("hein", "biloute", "drache", "estaminet"), sparingly.

## 11. Prototype v0.1 (shipped)
A single night (night 1, Monday) on one street. First person, ZQSD/WASD + mouse. Pilou's apartment reachable
via the building door. Tables with headcounts (some over the limit), a waiter, the exhaust with steam under the window,
a clock, the stats HUD, a phone (police / association / mayor's office), the dossier (Tab), a bucket of water (illegal), an end-of-night summary.
Tunable rules live in `src/config.js`.

## 12. Roadmap
| Milestone | Content |
|---|---|
| **v0.2: core tension** | Sim logic split out of rendering + tests. Witnesses and line-of-sight stealth (Klaas, Seb & Nico + cat, waiter, customers filming). Police patrols with personalities, tip-off, "c'est encore vous", complaisance logging. Terrace zone + passage corridor evidence. Saturday variant (crowd, standing drinkers, peeing). |
| **v0.3: art pass** | Cute low-poly restyle: characters (Pilou, the association, Dédé & Ghislain, the waiter, police, customers), stepped gables, the cat, the dachshund, animations, ambient audio (WebAudio: crowd murmur, chairs on cobbles, the exhaust hum). |
| **v0.4: campaign** | The 14-day calendar, day phase (Koddex / Clode Kode prompts, afternoon association actions), save in localStorage, scripted events (Colette's dinner, general meeting, inspector, exhaust meeting, commission), bloc counter-moves, dialogue system with the association members. |
| **v0.5: dirty tricks** | Hidden cameras + electricity/wifi hijack, cardboard on the exhaust, stink bomb, kitchen sabotage (salt/sugar), fake reviews, sabotage, bribing the waiter, photographing the bribe. Risk thresholds → complaint, custody, trial. |
| **v1.0: endings + polish** | The 8 endings, balancing via simulated runs, French copy pass, performance, a full QA run in Chrome. |

## 13. v1.0 acceptance checklist
v1.0 ships only when **every** box is ticked. Nothing is dropped silently: anything cut or simplified is listed under "Deviations" with Lucas's OK.
Proof: **T** = automated test (vitest / Playwright / campaign simulator, runs in CI) · **Q** = design agent's QA session in Chrome (screenshots in `qa/`) · **L** = Lucas playtest.

### A. Campaign and length
- [ ] 14-day calendar Monday → Sunday of week 2, each day = Koddex morning → afternoon → night (3D). **T Q**
- [ ] Save/continue (localStorage), a new campaign, and one save slot minimum. Reload mid-campaign resumes the same day and state. **T Q**
- [ ] **Duration**: a full campaign takes **2h30 to 4h** for a human (14 nights × ~10 min + day phases). Nights can't be skipped without consequence ("go to bed" = you lose what happens). **Q L**
- [x] Early endings (custody, fired, moving out) can't trigger before **night 5**. The "real" endings are decided at the **Day 14 commission**. **T** _(v0.4: campaign.test.js « fins », campaign invariant « fin anticipée avant la nuit 5 »)_
- [ ] Fixed events happen on their day: Saturdays 6 & 13, Colette's dinner (D4), the general meeting (D7), the inspector (D9), the exhaust meeting (D11), the commission (D14). **T Q**

### B. Characters (all present, recognisable, with a role and dialogue)
- [ ] Pilou · Jérémie + dachshund · Klaas (Santa look, notebook) · Hilde · Tatie Bouchon (+ the "it's being fixed" email thread) · Seb & Nico + the cat · Hippolyte (carriage building). **Q** _(art side done: 3D model + portrait with 7 expressions for each, `qa/art-v0.5/portraits-1.jpg`; role/dialogue = content + wiring)_
- [ ] Dédé · Ghislain (bun) · the waiter · Brigadier Lemaire · Agent Benali · the police chief · inspector Delphine Vermeersch · Stéphane (Koddex boss) · Colette Verhaeghe · mayor Bertrand Lescaut. **Q** _(art side done: models + portraits for all, incl. Lemaire/Benali/chef variants, Stéphane, Colette, Lescaut)_
- [ ] Each association member has at least **8 lines** of contextual dialogue (reacting to the current state) and at least 1 action or event tied to them. **T** (content count) **Q**

### C. Night systems
- [x] 22:00 rule (street-specific, 2026), 6 per table, zones + corridor, cobbles (chair clatter). **T** _(v0.2: tests/unit/rules.test.js)_
- [x] Evidence: photo, dB reading, headcount, corridor encroachment, timestamps. Quality + legality per piece. **T** _(v0.4: rules.test.js, campaign.test.js « preuves »)_
- [ ] Witnesses / line of sight: Klaas (asleep ~01:00), Seb & Nico (cat = home), the waiter, customers filming, the dachshund. Darkness, time and disguise modifiers. **T Q**
- [x] Police: 3 patrols with personalities, hidden roster (Klaas can deduce it), tip-off, coffee/complaisance logged, "c'est encore vous", calling as the Association, the police coming for Pilou, the bribe caught on camera → internal investigation. **T** _(v0.4: police.test.js, campaign.test.js « chaîne IGPN » / « la police vient pour Pilou » ; the roster shows on the phone once `roster_known`)_
- [ ] Mayor's office: reports, inspector visits (announced = tip-off via Colette, surprise = via Delphine/Hippolyte). **T**
- [ ] Saturday: no vehicles, crowd, standing drinkers, peeing in doorways. **Q**

### D. Day systems
- [ ] Koddex: 3 Clode Kode prompts a day, work vs side projects (dB logger, WhatsApp bot, review scraper, wifi cracker, fake reviews), Job meter, boss gags. **T Q**
- [ ] Afternoon actions: meeting, mayor's office, emails, press (La Voix du Nordiste), lawyer (formal notice), petition, health agency (ARS) / environmental health about the exhaust, recruiting residents, asking for a uritrottoir, dinner at Stéphane's with Delphine. **T**
- [ ] The restaurants' counter-moves (all of section 8) can trigger, depending on state. **T**

### E. Actions (every one implemented, with a cost, an effect and a consequence)
- [ ] Legal: every item of section 6 "Legal". **T**
- [ ] Grey: every item of section 6 "Grey". **T**
- [ ] Illegal: bucket, cardboard on the exhaust, stink bomb, kitchen sabotage (salt/sugar), fake reviews, sabotage (chairs, parasols, locks), bribing the waiter, hidden cameras (window = grey, awning = illegal), power from Bernadette's electricity, cracking their wifi (+ reading reservations, emails, quotes), sneaking in to photograph the bribe. **T**
- [x] Illegally obtained evidence is unusable in court but usable for the press / internal police investigation. **T** _(v0.4: campaign.test.js « caméra cachée » : out of the dossier, counted in `pressFile()`, opens the IGPN case)_

### F. Endings: all 8 reachable
- [ ] 1 Legal victory · 2 Negotiated peace · 3 Scandal · 4 Custody/trial (incl. the « carbonnade sucrée » and « carbonnade laxative » variants) · 5 Moving out to Wazemmes · 6 Fired (+ continue twist) · 7 Turncoat (secret) · 8 The return (La Bombance). **T Q**
- [ ] Each ending has its own end screen with an epilogue that **references what the player actually did** (key evidence, actions, who betrayed whom). **T Q**
- [ ] The campaign simulator reaches **every ending** with at least one scripted strategy, and each ending occurs in ≥ 2% of 1000 runs of its target strategy. **T**

### G. Scenario coherence (automated invariants + story review)
- [ ] Invariants checked on every simulated night and campaign: the police only arrive after a call or a scheduled event; nobody is in two places; a cleared table doesn't come back without a tip-off/return event; evidence refers to real events (time, place, table); Risk only rises from witnessed acts; a closed shop stays closed until its event; Klaas's notebook only logs what he could see. **T**
- [ ] Dialogue/event text only references facts the player has unlocked (no spoilers, no "as you know…" about something unseen). Flags are checked by a content linter. **T**
- [ ] Story bible review: names, places, timeline and character traits are consistent across all text (design agent review, logged in `qa/coherence.md`). **Q**
- [x] No real restaurant name anywhere (grep test against the section 0 list). **T** _(v0.2: tests/unit/names.test.js)_

### H. Balance (simulated + playtested, adjusted continuously)
The campaign simulator plays 1000 seeded campaigns per strategy bot. Targets:
| Strategy bot | Target outcome |
|---|---|
| Passive (does nothing) | ≥ 90% moving out / defeat |
| Legal only, careful | legal victory 35–60%, otherwise peace or defeat. Never custody |
| Illegal only, reckless | ≥ 70% custody/trial |
| Illegal only, stealthy (dark, after 01:00, no witnesses) | ≤ 40% custody. Scandal reachable. Association low |
| Mixed, smart | best average score. Every ending except "passive" ones reachable |
| Diplomat (association + dialogue) | negotiated peace ≥ 40% |
- [ ] Targets met, numbers logged in `qa/balance.md` at each milestone with the knobs changed. **T**
- [ ] No dominant action: removing any single action shifts the mixed bot's win rate by < 25 points. **T**
- [ ] Human feel: Lucas's playtest notes addressed. **L**

### I. Presentation and tech
- [x] Cute low-poly cast and street (stepped gables, carriage door, La Bombance, the cat, the dachshund). **Q** _(art v0.3–v0.5: QA in Chrome, screenshots in `qa/art-v0.5/`)_
- [x] Audio: crowd, chairs on cobbles, exhaust hum, 22:00 bell, mute (M). **Q** _(art v0.3; v0.5 adds sfx + day/hall loops)_
- [ ] French only, satirical tone, Ch'ti touches. Copy proofread. **Q L**
- [ ] 60 fps on a laptop iGPU (perf test logs the frame time). Loads in < 5 s. Bundle < 3 MB. **T Q**
- [x] CI green (unit + e2e + campaign simulator smoke). Deploy auto from main. **T** _(v0.4: .github/workflows/ci.yml runs vitest, `npm run sim -- --runs 20`, Playwright; CT 105 deploys main every 2 min)_

### Release tasks (done by the design agent when v1.0 lands)
- [ ] Set `WHATSAPP_GROUP` in `src/content/characters.js` to **« La Gaystapo »** (Lucas's choice: the real group's own name).
  Only the label changes; the writing around Seb & Nico stays role-based.
- [ ] Rename the two politicians back to Lucas's preferred names: **Colette Verhaeghe → Martine Aubrac** (ids `colette` → `martine`,
  flags `colette_*` → `martine_*`) and **Bertrand Lescaut → Arnaud Delandre** (`lescaut` → `delandre`, flags `*lescaut*` → `*delandre*`)
  across `src/`, the docs and tests. Remove `/Aubrac/` and `/Delandre/` from `tests/unit/names.test.js`. Run the full test suite + sim after the swap.

### Deviations
_(none yet)_

## 14. Content format (contract between the engine and the writing)
All narrative content lives in **`src/content/*.js`** as plain data (no logic, no DOM), owned by the content agent.
The engine (`src/sim/campaign*.js`, owned by the build agent) loads and evaluates it. A **content linter test** checks the whole tree.

```js
// src/content/flags.js: registry. Every flag used anywhere must be declared here.
export const FLAGS = { met_klaas: 'Pilou a parlé à Klaas', camera_awning: 'Caméra cachée sous le store', /* … */ };

// Conditions (all optional, AND-ed): evaluated against campaign state
// { day: [min, max], phase: 'morning'|'afternoon'|'night', flags: ['a'], notFlags: ['b'],
//   stats: { asso: '>=40', risk: '<30' }, hidden: { corruption: '>50' }, chance: 0.3 }

// Effects (all optional): applied by the engine, clamped 0–100
// { sleep: -10, asso: +5, risk: +20, job: -5, dossier: +1, hostility: +10, corruption: -15,
//   setFlags: ['x'], clearFlags: ['y'], evidence: { kind, quality, legal: true|false, label }, ending: 'scandal' }

// dialogue.js
export const DIALOGUE = [{ id, speaker: 'klaas', when: {...}, lines: ['…'], effects: {...}, once: true }];
// events.js: fixed calendar events and random ones
export const EVENTS = [{ id, day: 7, phase: 'afternoon', title, text, choices: [{ label, requires: {...}, effects: {...}, result: '…' }] }];
// actions.js: day and night actions available from menus
export const ACTIONS = [{ id, label, phase, legality: 'legal'|'grey'|'illegal', cost: { time: 1 }, requires: {...}, effects: {...}, witnessed: {...},
  sim: 'police', simArgs: { asso: true } }]; // sim/simArgs: night actions handled by the engine → sim.act({ type: sim, ...simArgs })
// countermoves.js: what the restaurants do, by trigger
export const COUNTERMOVES = [{ id, when: {...}, text, effects: {...} }];
// koddex.js: the three morning prompts
export const KODDEX = { work: [...], sideProjects: [{ id, label, unlocks: 'flag', job: -10, risk: 0, lines: [...] }], gags: [...] };
// endings.js: the 8 endings, decided at day 14 or early (failures, from night 5)
export const ENDINGS = [{ id, title, when: {...}, priority, epilogue: [{ when: {...}, text }] }];
```
Rules: all text is in French; **no real restaurant names**; every `speaker` exists in `characters.js`; every flag is declared;
every action, event and ending is reachable (the linter + the campaign simulator check this). An epilogue is built from the parts whose `when` matches,
so it reflects what the player actually did.

**Content-side additions (content-v0.4, all optional and backward-compatible; details in Build notes):**
- `characters.js` exports `CHARACTERS` as an **object keyed by speaker id** (`{ name, fullName?, title?, group, home, bio, voice }`), plus `WHATSAPP_GROUP` (the group's display name, one constant) and `PLACES` (the street's businesses, fictional names).
- ACTIONS: `witnessed: { exposure, by, effects }`, `sim`, `once`, `result`, `cost.minutes` (night). EVENTS: `when` (random events), `once`, `speaker`. COUNTERMOVES: `title`, `speaker`, `once`. ENDINGS: `whenAny`, `continue`.
- **media.js** (content-media): the phone feed read between phases. `export const MEDIA = { whatsapp: [...], press: [...], social: [...] }`, entries `{ id, when, author, text, effects?, setFlags? }`. Each entry shows **once**, the first time its `when` matches. `author` = a `CHARACTERS` id, a `PLACES` id (a business's account) or `'reviewer'` (anonymous customer, with `handle`). Optional: `photo` (caption), `headline` (press), `kind` ('post' | 'review' | 'petition'), `stars` (1–5), and `ending: '<ending id>'` = shown only on that ending's end screen (one press front page per ending). The WhatsApp group name always comes from `WHATSAPP_GROUP`.

## 15. Still open
- Nothing blocking. New lore welcome anytime.

## Build notes
> Appended by the build agent. Simplest-option choices made for v0.1, to confirm or override.

**v0.1 (build-v0.1)**
- Restaurants in v0.1: **Estaminet La Ch'tite Bernadette** (under Pilou), **Les Bouchers Mal Lunés** (same side, further down), **Le Goulot** (opposite). All values in `src/config.js`.
- **Tables clear per table**: each table rolls its restaurant's `compliance`. Success means it goes in between 21:55 and 22:05. Failure means it goes in at a random time in that restaurant's `lateClear` window. "Table out after 22:00" counts as evidence only after a **5-min grace** (`lateGraceMinutes`). Each clear logs a "raclement de chaises" message (once per restaurant every 5 min) and a short 80 dB noise burst.
- **Noise model**: each table is one source of `personDb + 10·log10(headcount)` at 1 m, with 20·log10(d) falloff. Late-evening boosts apply (+3 dB after 22:00, +3 dB after 23:00), and the exhaust stays on until 23:30. Indoors subtracts 8 dB (window always open, no close action in v0.1). The HUD shows dB at Pilou's ear.
- **Sleep** is driven by the noise **at Pilou's bed**, not where he stands, and only after 22:00. The exhaust smell adds a flat drain. **Bed (E)** = "try to sleep": time runs ×12, and Sleep recovers only if the bed is under 35 dB. This is the only way to skip ahead to the end. Sleep 0 ends the night (moving-out ending).
- **Photos (P)**: a crosshair raycast on out tables, range 35 m, allowed from the street or from the window (not through walls). Each table can yield at most one "over 6" piece and one "out after 22:00" piece. Quality = f(Sleep, distance), and low Sleep gives a "floue" photo. All photos in v0.1 are legal.
- **Police**: one patrol at a time. Arrival delay is 10–22 game min, +50% per extra call. From the 4th call: "c'est encore vous", nobody comes. The patrol targets the restaurant with the most infractions at call time. On arrival: if no infraction, "tout est en ordre". Otherwise P(act) = 0.3 + 0.07·dossier(on that restaurant) + 0.2·Asso − 0.6·influence. "Act" brings in late tables or trims over-limit tables to 6, and the restaurant complies for the rest of the night. Failure = **complaisance** ("café offert, 0 PV"), logged as a dossier piece worth 2. No tip-off and no patrol personalities yet (v0.2).
- **WhatsApp (asso)**: sharing new photos gives +3 Asso per photo. Sending a message with no photo costs −3. **Mairie**: one report per night, logged as a 0.5 piece if it has attachments. No inspector visit at night.
- **Waiter** (E, street, after 22:00, Bernadette only): P = 0.15 + 0.5·compliance + 0.25·Asso. Success brings in all of Bernadette's out tables. 10-min cooldown.
- **Bucket (F, at the window)**: clears the out tables on Pilou's side within 3.5 m along the street, +45 Risk, −20 Asso, 15-min refill. No witness check (v0.2): Risk is applied unconditionally. Risk ≥ 30 warns ("video circulating"), ≥ 60 means a complaint, ≥ 90 means custody and ends the night immediately (so 2 buckets = custody).
- Menus (phone, dossier) **pause** the game. Losing pointer lock shows a pause screen. `?nolock=1` runs without pointer lock, and `window.__rdb.step(n)` advances frames, both for automated tests.
- Rendering: no shadows; 4 street point lights + 1 in the apartment (other lanterns are emissive only); the static decor is merged per material.
- Deploy: CT 105 pulls `origin/main` every 2 min (`deploy/`), served at http://192.168.1.163:8090.

**v0.2 (build-v0.2, "core tension")**
- **Architecture**: the whole night lives in `src/sim/` (no DOM, no three.js, seeded mulberry32 RNG): `createSim({seed, day, cfg})`, `sim.tick(minutes)`, `sim.act({type, …})` for both the player and the bots, `sim.events` for UI messages, `sim.state.journal` for the structured record. `main.js` only renders, handles input and draws the HUD. `?seed=N` replays a night. `runNight({seed, day, policy})` plays a full night headless (≈2,000 nights/s on the Mac mini). Bots in `src/sim/policies.js` (`passive`, `legal`, `legalAsso`, `reckless`, `stealthy`) implement `decide(sim) → actions[]`. There's no movement headless: a bot "is" wherever its action makes sense.
- **Invariants** (`src/sim/invariants.js`, §13.G) run on 400 simulated nights in the unit tests:
  - the police only arrive after a (non-ignored) call, once per call;
  - a table only comes back out after a tip-off that covered it;
  - each piece of evidence points to a real event (an out table, a late time, a real police visit, tip-off or pee);
  - Risk only rises from a witnessed act;
  - Klaas's notes are made while he's awake and within his line of sight and range.
  "Nobody in two places" and "closed shop" are not checked yet (nothing can be in two places in v0.2, and there are no shops with events).
- **Terrace zone and corridor**: the passage is the central 2 m (`ZONES.corridorHalfWidth`). Each table occupies a 1.05 m disc. A table "overflows" when its inner edge bites into the corridor, which happens with each restaurant's `encroachChance` (by 15–55 cm). Proving it requires a measurement: a photo **from the street, within 5 m** ("mètre ruban"), never from the window. The L key toggles the "legal view" (green zones, red corridor, red rings around overflowing tables). It's freely available in v0.2; unlocking it via the association / AOT document is for v0.4. If the police act, they move overflowing tables back into the zone.
- **Witnesses** (bucket only in v0.2; other illegal acts come in v0.5):
  - Line of sight = "canyon" rule: two points against the same façade can't see each other; everything else can.
  - Klaas (place Maurice-Schumann, §1b): detection fades with distance (full up to 35 m at dusk / 15 m at night, zero beyond 130 m / 75 m with binoculars). He sleeps from 01:00.
  - Seb & Nico are present while the cat is on the balcony (it goes in at a random time between 23:00 and 00:30).
  - The waiter is on duty until 00:45. The customers at each out table may notice, and **wet tables look up**; some customers film.
  - Darkness halves what street-level people (waiter, customers) notice. The Saturday crowd provides cover (×0.7).
  - Risk = 45 × the sum of witness weights (capped at 1.6). Zero witnesses = zero Risk. Asso drops only if an ally saw it or a video exists.
  - At the window, the HUD lists the *possible* witnesses ("👁").
- **Police**:
  - The roster is hidden (`POLICE.roster`, two shifts split at 23:00) and revealed on the end screen.
  - **Lemaire** is slow on the first call (+8 min) and acts rarely. He tips the restaurant off 5 min before arriving (85% for Bernadette, 40% elsewhere). The tables go back in, then come back out 5–12 min after he leaves. If Klaas can see the restaurant, the tip-off becomes a dossier piece ("Carnet de Klaas").
  - **Benali** acts (80% base) and is transferred after 3 fines (Lemaire replaces him).
  - **The chief** only comes after a **scandal**: 2 police-misconduct pieces (complaisance or tip-off) shared on WhatsApp or sent to the mairie.
  - "C'est encore vous": a 4th call is ignored, and each extra call lengthens the delay (+50%) and lowers the chance of a fine (−8 points).
  - Calling "pour l'Association" cuts the delay by 40%, but the bloc knows (+25 hostility, which lowers the waiter's goodwill).
  - Complaisance is logged only if someone saw it: Klaas, or Pilou if he isn't asleep.
  - Not done (v0.5): the police coming for Pilou, the bribe caught on camera / IGPN.
- **Saturday** (`?day=sat`): +1 table per restaurant, +1 person per table, 65% of tables over 6, +3 dB, 6 groups of standing drinkers in the street (noise + witnesses), people peeing in doorways every 7–16 min (30% at Pilou's door). Photographing someone peeing = a 0.5 piece.
- **QA fixes**:
  - (a) Chair clatter says "rentre une table" (at most once every 5 min per restaurant) and "rentre sa terrasse" only for the last table.
  - (b) The [E] prompt was hidden behind the log at narrow widths: the prompt now sits just under the crosshair, and the prompt and the action share the same range (`INTERACT` in config). There's an e2e test for it.
  - (c) The **awning** is now 0.6 m deep (was 1.4 m): a two-line edit in `world.js`. **@art agent**: keep it shallow in the restyle so the tables below stay visible from Pilou's window.
- **world.js hooks (build agent)**:
  - `buildWorld(scene, { tables })` builds the terraces from the sim layout (id, restId, x, z, count).
  - `buildTable` takes a fixed headcount.
  - The awning change above.
  - `main.js` copies `window.pos`, `streetDoor`, `bed`, `exhaust` from `buildWorld()`'s return into the sim config, so the 2nd-floor move only needs world.js. The config defaults (2nd floor) are used headless.
  - Placeholders for Klaas (window on the square), the balcony + cat, standing drinkers, people peeing and the police are built in `main.js` with world.js's `person()`/`mat()`, waiting for the art pass.
- **Geography (§1b)**: Klaas has moved to the square. The restaurants keep their v0.1 z positions: Bernadette is at mid-street in our 90 m compressed street, not in the first third. Moving them would mean moving Pilou's building in world.js (art agent's file). To do together in v0.3/v0.4.
- **Tests**: `npm test` (vitest: rules, police, witnesses, Risk, invariants, determinism, ≥100 nights/s, names), `npm run test:e2e` (Playwright, headless Chromium + SwiftShader against `vite preview`: a full night with a photo, a police call, the door prompt and the end screen, plus Saturday; screenshots in `test-results/`). CI: `.github/workflows/ci.yml` runs both on every push.


**v0.3 art pass (art-v0.3)**
- **Characters are instanced** (`src/art/rig.js`): each character, chair or table is a plain `Object3D` proxy that gameplay moves, hides or removes as before. Its parts (head, eyes, arms, glass, chair...) are drawn by about 25 shared `InstancedMesh`es, updated in `scene.onBeforeRender`, so main.js needs no per-frame call. The animation (bobbing, chatting, drinking, laughing, walking derived from movement, the dog's tail, the cat) runs on real time, not game time. One Lambert material carries a small self-lit term, so the cast stays readable at night without extra lights.
- **Cast** (`src/art/characters.js`, `CAST.*` builders): Pilou (hidden, first person), Jérémie + dachshund (on the street by the building door: the evening round), Klaas (Santa: white beard, red cardigan, glasses, notebook) and Hilde (tisane) leaning out of a window **on place Maurice-Schumann**, looking straight down the street. Also Tatie Bouchon (mid-street window, phone), Seb & Nico + the ginger cat on the **2nd-floor balcony opposite Pilou**, Hippolyte (tweed, cane) at his carriage door, Dédé (short, round, apron) and Ghislain (skinny, black, huge bun, cigarette) outside Bernadette's, the waiter (white apron, tray), the municipal police (navy, cap with a light-blue band) and Delphine (hidden, clipboard). `person(color)` still works: it returns a standing passer-by, and the police colour `0x1b2847` returns an officer.
- **buildWorld() return**: the old fields are kept (`tables, steam, apt, waiter, window, streetDoor, aptDoor, bed, exhaust`). `opts.tables` from the sim layout is honoured. New fields: `cast` (proxies, `.visible` works), `anchors` (pilouWindow, jeremieWindow, balcony, cat, klaasWindow, hildeWindow, tatieWindow, hippolyteDoor, bernadetteDoor, mug, bombance, bloemkool, endroit, dede, ghislain, jeremie, endA, square), `standingCrowd({x, z, n, barrel})`, `setCatVisible(v)`, `audio`, and `gameMinutes` (optional; otherwise the bell reads `__rdb.sim.state.min`).
- **Geography (§1b)**: end A = rue de la Barre (a cross street with a row of houses), end B = **place Maurice-Schumann** (a small square with trees, a bench, a lamp post, street openings and a belfry behind). **Rue de la Baignerie** leaves the square at 90°, with Hippolyte's "Ancienne carrosserie · 1827" (an arched carriage door) and blue enamel street plaques. **Pilou's floor = 7.2 m (2nd floor)** and Jérémie is on the 3rd. The duct climbs to just under Pilou's window. Pilou's building and the balcony follow Bernadette's `z0/z1` in config.js.
- **Restaurant order**: decor shops are placed by number and slide away from config's restaurants: Mug (z≈-20, odd side), La Bombance (z≈-12.5, closed, whitewashed, "À LOUER", next to config's doorway at -14), Bloemkool (z≈29) and L'Endroit (z≈38.5) on the even side. **[OPEN]** config.js still has Bernadette mid-street (z 0), Mal Lunés at 14–24 and Le Goulot opposite Bernadette. §1b wants Bernadette/Mal Lunés in the first third and Le Goulot toward the square. Moving them in config is enough: the façades follow.
- **[OPEN] Klaas's anchor**: the sim keeps `ANCHORS.klaasWindow` = (0, 9, 48) from config. The drawn window is at `world.anchors.klaasWindow` (≈ z 67.6, y 5.4), at the back of the square. I didn't overwrite it in main.js because it changes his detection balance (far 75 m at night). The build agent decides. The balcony anchor *is* now taken from the world (eye height = balcony floor + 1.5 m).
- **main.js hook (minimal, marked `[art v0.3]`)**: the placeholder Klaas façade, balcony and box cat are replaced by `world.cast`. Standing drinkers and the peeing silhouettes stand on the ground (y 0, the new characters' origin is at the feet). The cat no longer gets spun by main.js.
- **Street**: Flemish brick (4 brick tints + 3 plasters, world-space UVs so the bricks keep a constant size) and stepped gables with stone copings, pinnacles and an oculus, plus slate roofs behind. Some houses have a cornice + mansard with dormers instead. White stone window frames (jambs, sill, lintel + keystone), string courses, lit windows with curtains, painted wooden shopfronts with pilasters, fascia signs and a lit-interior texture. Wall lanterns, a cobbled street with a blue-stone central gutter, and Bernadette's unauthorised AC unit. **Bernadette's awning** is 0.45 m deep and tilted 55°, so the tables stay visible from Pilou's window (checked in Chrome).
- **Lighting/perf**: 5 point lights (3 terraces, 1 square, 1 apartment) and 1 cool directional "moon", no shadows. The rest is emissive. Static decor is merged per material, with materials shared across all façade kits. Measured in Chrome (Mac): ~120 draw calls, ~345k triangles, ~1.3 ms/frame. The triangle count is dominated by the characters; lower the sphere segments in rig.js if an iGPU struggles.
- **Audio** (`src/audio/index.js`, procedural WebAudio, no files): crowd babble (formant-filtered noise voices, syllable-rate modulation, laughs and glass clinks), with the level and panning from the heads at visible tables and distance. Metal chairs dragged on cobbles fire whenever a table's group is hidden or shown again (one scrape per chair, panned). The exhaust hum is a 50 Hz motor + fan noise, louder and muffled in the apartment. A **distant church bell rings 10 strokes when the clock passes 22:00**. **M** = mute (with a small on-screen toast). Audio starts on the first click/key and suspends when the tab is hidden. The standing (Saturday) groups are not in the crowd level yet.

**v0.4 content (content-v0.4)**
- **Characters**: `CHARACTERS` is an object keyed by id (`speaker in CHARACTERS`). New supporting cast: `biloute` (Jérémie's dachshund), `gaufre` (Seb & Nico's cat), `regis` (Régis Dewaele, n°27, holiday-let landlord, the bloc's recruit), `serveur` (the waiter, first name Théo), `chef` (Commandant Desmet), `journaliste` (Anne-Sophie Lepoutre, La Voix du Nordiste), `avocat` (Maître Vandamme), `clode` (Clode Kode). Seb & Nico are written by their role (the couple across the street, gossip, admins of the WhatsApp group); the group's name is the `WHATSAPP_GROUP` constant (provisionally « Radio Balcon »).
- **Flags set by the engine**: the first block of `flags.js` (`night_photo`, `night_db`, `corridor_measured`, `called_police`, `called_as_asso`, `seen_complaisance`, `seen_tipoff`, `serial_caller`, `benali_fined`, `benali_transferred`, `chief_came`, `saw_pee`, `pee_at_door`, `bucket_used`, `bucket_witnessed`, `video_viral`, `klaas_noted_pilou`, `talked_waiter`). Content reads them; content never sets them (except `klaas_noted_pilou`, also set by witnessed content actions).
- **Condition stats**: `stats` keys are `sleep`, `asso`, `risk`, `job`, `dossier` (0–100); `hidden` keys are `hostility`, `corruption`.
- **ACTIONS extras**: `cost.time` = afternoon slots (content assumes 3 per afternoon); `cost.minutes` = game minutes for night actions. `witnessed: { exposure: 0–1, by: [witness ids], effects }`: `exposure` is the base chance a present witness notices (the engine scales it with darkness/time/crowd/disguise), `by` lists who can see it (`klaas`, `seb_nico`, `waiter`, `customers`, `biloute`, `dede`, `ghislain`, `police`), and `effects` are applied **only if seen** (on top of `effects`). `sim: '<type>'` marks an action the night sim already implements natively (photo, db, call…): the engine runs its own logic and applies the content `effects` as extras. `once: true` = available once per campaign. `result` = text shown after the action.
- **EVENTS extras**: random events have no `day` but a `when` (with `chance`); `once: true` (default for random events) and an optional `speaker`.
- **ENDINGS extras**: `whenAny: [cond, …]`: the ending matches if `when` matches AND at least one `whenAny` entry matches (used by the moving-out ending: Sleep 0, or the commission lost). `continue: { label, effects }` on the fired ending = the twist: the player may keep playing (sets `unemployed`), so the engine should not end the campaign if the player picks it.


**Narrative wiring (narrative-wiring) — for the build agent: exact call sites**
`src/sim/narrative.js` (owner: content agent; tests: `tests/unit/narrative.test.js`) turns engine state into text. It is pure, DOM-free and seeded: every draw goes through the rng you pass (`sim.rng` at night, `c.rng` in the campaign). It imports `src/content/{night,intro,media,dialogue,events,characters}.js` directly. It never mutates state. The engine only has to call it at these points:
- **Night, main.js / sim log** (`sim` = the `createSim` object):
  - Ambient barks: `pickNightLine('bark', sim)` every 20–40 s of real time near a terrace (Saturday mixes rowdier lines; a patrol on site sometimes gives a murmur).
  - Bell: `pickNightLine('bell:before', sim)` at 21:55, `'bell:strike'` at 22:00 (with the existing audio bell), `pickNightLine('bell:after', sim, sim.rng, { outAt22 })` at 22:05 (`outAt22` = tables out at 22:00).
  - Waiter: after `const r = sim.act({ type: 'waiter' })` → `pickNightLine('waiter', sim, sim.rng, { result: r, metWaiter: c.has('met_waiter') })` replaces the hard-coded `sim.log` text.
  - Witnesses: after a witnessed act, for each `w` of `rollWitnesses(...)` → `pickNightLine('witness', sim, sim.rng, { witness: w })`; with nobody → `pickNightLine('witness', sim)`.
  - End of night: `pickNightLine('end', sim)` (uses `sim.state.endReason`).
  - Police: `policeLine(outcome, patrolId, ctx, sim.rng)`, with `ctx = nightCtx.police(sim, entry)` (`entry` = `sim.state.policeLog` row, or `sim.state.police` while pending). Outcomes: `call` (in `callPolice`, add `asso: true` to ctx), `arrive` (phase → walking), `act` / `complaisance` / `tipoff` / `nothing` (in `resolve`, = `entry.outcome`), `ignored`, `busy`, `never_came` (patrol still pending at night end) and `for_pilou` (v0.5: the police come for Pilou).
  - Klaas's notebook: `klaasEntry({ about, ...ctx }, klaasDetection(sim, d), sim.rng)` → `{ text, precise }` or `null`. `precise` when detection ≥ `KLAAS_PRECISE_AT` (0.6 ≈ 35 m at night with the v0.2 config), `vague` below, `null` at 0. Contexts: `nightCtx.table(sim, t)` (about `over` / `late` / `corridor`), `nightCtx.tipoff(sim, tip)` (`tipoff`, from `sim.state.tipoffs`: tippedAt / arrivedAt / returned), `nightCtx.police(sim, entry)` (`complaisance`, `police_act`), `nightCtx.pee(sim, p)` (`pee`, `{door}` = doorway label), `nightCtx.clatter(sim, restId, n)`, `nightCtx.pilou(sim, act)` (or `about: 'bucket'`). `{ about: 'bedtime' }` at 01:00. Where: wherever the sim writes `klaas-note` to the journal (complaisance, tipoff return, bucket), plus optionally when Klaas can see an over-limit / late / corridor table (`sim.klaasCanSee`).
  - Every template is filled by `fill(template, ctx)`: a missing variable becomes « … », never a raw `{x}`.
- **Recap screen**: `recapHeadline(c.state.lastNight, sim.state)` → `{ id, text }` (the second argument is optional; without it the metrics come from the summary). Show it as the front-page title above `summary.verdict`.
- **Intro / tutorial**:
  - Cards: `introCards()` before day 1's morning.
  - Tutorial: `tutorialPrompt(trigger, { ...c.state, seenTutorial })` → `{ id, text }` or `null`. Persist the shown `id`s in the save (`seenTutorial`). The trigger ids the engine must emit (the first time each happens) are `TUTORIAL_TRIGGERS`: morning_start, first_prompt, afternoon_start, first_afternoon_action, night_start, near_door, at_window, first_photo, first_photo_blurry, corridor_needs_measure, legal_view_toggle, bell_22, first_phone, first_police_call, first_tipoff, first_complaisance, first_waiter, first_dossier, near_bucket, first_witness, bed, night_end.
- **D14**: when the `d14_commission` card is shown, display `commissionScene(c.state)` → `[{ speaker, name, text }]` (speeches by Jérémie, Ghislain, Delphine, Colette and the mayor, chosen from the dossier's strengths and weaknesses) before `choices`. The `scene` field is new on that event: the linter should accept it, and its `when`s use §14 conditions.
- **Phone**:
  - Daily feed: `mediaFeed(c.state, c.state.day, { seen })` → `{ whatsapp, press, social }` of unseen entries. The engine records the ids it showed and applies each entry's `effects` / `setFlags` when it is read.
  - End screen: `mediaEnding(endingId, c.state)` (the newspaper front page, most specific variant) and `mediaEndingFeed(endingId, c.state)` (every ending-only message).
- **Talking to someone outside the card queue**: `dialogueFor(speaker, c.state, { seen: c.state.seen.dialogue })`.

**content-fixes (for the balance agent)**
- Two new routes to `corruption_proof` (the scandal ending): `pm_waiter_testimony` (afternoon, legal; needs `waiter_informant`; also sets `seen_complaisance`) and `pm_klaas_notebook` (afternoon, legal, 2 slots; needs `met_klaas` + `roster_known` + `seen_tipoff`). Their numbers (dossier +4, evidence quality 0.75 / 0.8, `waiter_fired` on a witnessed testimony) are placeholders: retune freely.
- `pm_waiter_debrief` now also sets `seen_complaisance`, which unlocks the window bribe photo without the engine.
- New `pm_answer_hate_wave` (sets `hate_wave_answered`, asso +3, placeholder).
- No ending or countermove `when` / priority was touched. `the_return` may still be under the 2% target (rumour 35% → project 50%), so it's yours to check in the simulator.

**Night actions (night-actions) — for the build agent and the UI agent**
`src/sim/nightActions.js` (owner: content agent; tests: `tests/unit/nightActions.test.js`) plays every night ACTION of `src/content/actions.js` that has no `sim` field inside the 3D night. It is generic and content-driven, pure, DOM-free, and seeded through `sim.rng`. I did not edit `sim.js`, `campaign.js` or `main.js`: the hook lines below are for their owners.
- **Stable API for the UI (in-game menu, key N):**
  - `availableNightActions(sim, c, player)` → `[{ id, label, legality, minutes, at, where, available, reason, witnesses }]`.
    - An action whose `requires` aren't met is **not listed** (anti-spoiler). One that is possible but not here or not now is listed with `available: false` and a French `reason` (« Il faut être sous le store. », « Pas avant 23h30. », « La cuisine est fermée. »…).
    - `witnesses` = who could see it right now at that spot (an 👁 hint; empty for legal acts).
  - `performNightAction(sim, c, id, player)` → `{ ok, reason?, result, seen: [{ id, kind, name, ally, filmed }], minutes, startedAt, art, sim }`.
  - `player = { where: 'apartment' | 'window' | 'street', pos: { x, z } }`. From main.js: `where = player.loc === 'street' ? 'street' : nearWindow() ? 'window' : 'apartment'`, `pos` = the camera position. Without `player` (bots, headless) the location is not checked.
- **Location mapping** (`LOCATIONS`, positions derived from config so they follow the street):
  - `window` and `apartment`: Pilou's window and his flat.
  - `street`: wherever Pilou stands.
  - `terrace`: ≤ 8 m from the estaminet's terrace centre.
  - `awning`: ≤ 3 m under the estaminet's awning.
  - `kitchen_door`: the service door, rue de la Barre side, ≤ 3 m.
  - `estaminet`: inside, entered by its door, ≤ 4 m.
  - Each action's spot, time window and scene condition are in `NIGHT_ACTION_SPECS`. Scene conditions (`SCENE`): terrace out, exhaust running, kitchen open until 23:00, waiter on duty, patrol on site.
- **What a perform does, in order:**
  1. Track it: `once` per campaign, once per night unless `repeat` (stink bomb, filming faces).
  2. Roll witnesses at the spot of the act, at its start. The sim's own witnesses go through `sim.witnessAct` (witness.js: Klaas's distance and binoculars, darkness, disguise, Saturday crowd, the dachshund's bark), filtered by the content's `witnessed.by` with its `exposure`. Dédé, Ghislain and the police (not modelled by the sim) are rolled in this module with the same exposure × darkness × disguise.
  3. Apply effects, the same way `c.doNightAction` does: Asso and Sleep in the night; Risk **only** through `sim.punish` when someone saw; everything else via `c.apply`. `witnessed.effects` apply only if seen. Klaas seeing an illegal or grey act sets `klaas_noted_pilou`.
  4. Mechanical effect (`SIM_EFFECTS`): the stink bomb clears the estaminet's terrace through `sim.clearTable(t, 'stink')`; the cardboard sets `sim.state.exhaustBlocked`.
  5. Art hook: push `sim.events` `{ type: 'art', action, fx?, prop?, terrace?, anim?, pos }`.
  6. Write a journal `night-action` entry `{ id, legality, at, pos, minutes, seen, filmed, … }` (for `narrative.js` / the recap).
  7. Let the act's minutes pass with `sim.tick(1)` each minute.
  - The night invariants stay green (tested on every action).
- **Call sites (hook lines for the owners):**
  - `main.js` `nightActionsHere()` / `renderNightMenu()`: list `availableNightActions(sim, campaign, player)` (grey the unavailable ones with `reason`); on click `performNightAction(sim, campaign, a.id, player)`, then `drainSim()`.
  - `main.js` `drainSim()`: on `e.type === 'art'`:
    - `art.fx[e.fx]?.(e.pos)`
    - `e.prop && art.props.place(e.prop, e.pos)`
    - `e.terrace && art.terrace[e.terrace]?.(…)` (rush / collapse / parasols / film on the estaminet's tables)
    - `e.anim && art.anim.play(...e.anim)`
    - and voice the witnesses with `pickNightLine('witness', sim, sim.rng, { witness })` for each `r.seen`.
  - `campaign.js` (optional, keeps bots and the simulator on one code path): `c.doNightAction = (sim, id) => performNightAction(sim, c, id)`, and `c.nightActions` can stay as the base filter (`availableNightActions` uses it).
  - `sim.js` `tick()` (one line, so the cardboard really stops the exhaust): `if (S.min < NOISE.exhaustOffMinute && !S.exhaustBlocked) d -= SLEEP.exhaustDrainPerMinute;`. Add the same `!S.exhaustBlocked` check where the exhaust hum / steam is drawn.
  - `index.js`: `export { availableNightActions, performNightAction } from './nightActions.js';`

**Night hooks (night-hooks) — for the balance agent**
- `c.doNightAction(sim, id, player?)` now delegates to `performNightAction` (`src/sim/nightActions.js`). Bots, `campaignRunner.playNight` and the simulator play content night actions on the same code path as the player. That path includes the location, the time window and the scene condition: no stink bomb on an empty terrace, cooking sabotage only before 23:00, the back-room photo only while a patrol is on site, chair, parasol and lock sabotage only after 23:30 or midnight.
- Without `player` the location is not checked. A rejected action returns `{ ok: false, reason }` and has no effect. So a bot that asks for an action outside its window simply gets nothing: pick ids from `availableNightActions(sim, c).filter((x) => x.available)` to time them (for example, a stealthy bot can wait until after 01:00, when Klaas sleeps).
- `c.doNightAction` now also spends the action's `cost.minutes`, ticking minute by minute inside the call, so the night clock moves forward during content actions.
- Dédé, Ghislain and the police are now real witnesses for night content actions, so the reckless and stealthy custody rates may shift. Re-run `npm run sim` and update `qa/balance.md`.
- `sim.state.exhaustBlocked` (cardboard on the exhaust) stops the exhaust's Sleep drain in `tick()`.

**v0.5 art pass (art-v0.5): props, animations, portraits, perf**
- **No change to main.js**: everything is an API, documented in `src/art/README.md` (`art.fx`, `art.props`, `art.anim`, `art.terrace`, `art.cast`, `art.portrait`, `art.scenes`, plus `audio.play/loop/mode`). `nightActions.js`'s `art` hooks (`fx`, `prop`, `terrace`, `anim: [who, state]`) work as written, without positions (default anchors). Checked by running every spec in Chrome.
- **Perf**: from ~345k to **97–120k triangles on a weekday, ≤148k on Saturday** (≈210 characters), 115–270 draw calls, measured from 5 viewpoints. Characters are culled when off screen (neither animated nor drawn). Beyond 10 m they get simplified geometry with no small details (eyes, hands, shoes). Base geometry is lighter, and the static decor is merged per material **and per 22 m stretch** so frustum culling works. `?perf=1` = HUD (fps, ms, worst frame, draw calls, triangles, characters drawn/far). No impostors: the distance LOD was enough.
- **Props**: generic `gadget` (dark box + blinking light) and `art.props.line(a, b)` (or `place('line')`) cover the discreet objects. Also cardboard on the exhaust, uritrottoir, a banner « LE SOMMEIL EST UN DROIT » (**French**, as all in-game text; the English slogan from the brief is not used), petition, police coffee table + waterzooi, chain and padlock (glue drop), stepladder, « OCCUPÉ » sign. Bernadette's tables have **furled parasols** that can be stolen.
- **FX**: bucket splash (droplets, splashes, **wet cobbles** that dry, customers surprised), stink cloud (+ wavy lines, customers fanning), **blocked exhaust** (the steam stops, smoke comes out of the kitchen), generic smoke, bark puffs. A single small particle system (point shader with per-particle size and opacity).
- **Characters**: expression bones (eyes, brows, mouth) + small marks (smile/frown arcs, anger mark, sweat drop, tear, side-eye). Items in hand switch with the state (`held`). States: binoculars, carnet, bark, cigarette break, cleaning the awning on a stepladder, glued padlock, greet the police, envelope (readable hand-off), patrol on foot/**bike** (no vehicles on Saturdays), tape measure, clipboard, filming, coffee, laxatives (comic rush to the toilet + queue), chair collapsing, 22:00 round (Jérémie + Biloute on a leash along `anchors.roundPath`). Builders for **every id** in `src/content/characters.js` (colette, lescaut, lemaire/benali/chef, stephane, journaliste, avocat, regis, clode = a small terminal with a face…), with fixed skin tones.
- **Portraits**: `art.portrait(id, expression)` returns a PNG dataURL (offscreen WebGL, cached, background colour by group). `src/ui/dom.js` finds it automatically (glob `../art/*.js`).
- **Day vignettes**: `art.scenes.koddex()` (Pilou typing, two screens, Clode Kode blinking, plants, « SHIP IT » poster), `atelier()` (the carriage workshop: calèche under restoration, association table, Hippolyte standing), `mairie()` (the commission hall: dais Delphine / Lescaut / the chief, the public split between association and bloc). Each one is `{ scene, camera, update, setAspect, dispose }`, rendered by the game's renderer.
- **Audio**: `audio` is a singleton. `play()`: whatsapp, footsteps, police radio, splash, camera shutter, Koddex keyboard, bark, crash, padlock, paper, stomach rumble, pfff, flush, bell. `loop()`: **lo-fi** (piano, bass, brushed drums, vinyl, 76 bpm, generated live), **hall** (reverb, murmurs, coughs, chairs, papers, PA hum), **typing**. `mode('day')` silences the street.
- **Gallery** (dev): `/src/art/gallery/`, with every prop, FX, state, portrait, vignette and sound on buttons, and `__gallery.step(n)` for QA in a background tab. It lives in a **subfolder** because `src/ui/dom.js` imports `../art/*.js` eagerly (the gallery broke the game for one push, c8518b6, fixed in 24396dd).
- **[OPEN] for the build agent**: during `play('serveur', 'smoke')` and `play('ghislain', 'clean')`, `syncActors` must stop repositioning the waiter. `art.cast.officer(id, { bike })` can replace `person(0x1b2847)`. The patrol's path and duration follow the sim if you pass `path`.


**v0.4 (build-v0.4, "campaign engine")**
- **Engine** (`src/sim/campaign.js`, API in `src/sim/README.md`): 14 days, morning (Koddex) → afternoon (actions, time slots) → night (`sim.js`) → recap, as a step machine (`c.step`). The content is evaluated exactly as §14 describes, plus the content-side additions (`whenAny`, `continue`, `once`, `witnessed.exposure/by`, `sim`, `result`, `scene`, Koddex `work` items and `gags` with `when`/`effects`, `MEDIA`). Everything is seeded, and the state is plain JSON (`c.save()` / `createCampaign({ save })`, key `rdb.save.v1`, a save from another version is refused). The browser plays each night after a save + reload (`?mode=night`: a new layout and a fresh scene, no leaks), and the same seed gives the same night.
- **Interpretations of §14** (to confirm):
  - **Risk only from a witnessed act** (§4, §13.G): a Risk written in an action's `effects` counts as **exposure**. It only applies if the act is noticed (the action's `witnessed`, or a default chance by legality, `CAMPAIGN.dayWitness`). The linter warns.
  - A side project's Risk counts only if Stéphane notices (`sideProjectDiscovery`).
  - Events and counter-moves may raise Risk directly ("story" cause: a complaint, etc.).
  - `ending` in an effect: an early ending requested before night 5 is ignored. Any other ending is kept as a candidate for the final resolution.
  - Early endings = `early: true` or the ids `custody`, `fired`, `moving_out`.
  - Final resolution after night 14: highest `priority` among the matching endings, else the lowest priority one.
  - Day cards: fixed events of the day, then at most 1 random event per phase, then (afternoon) at most 2 counter-moves and 2 dialogues. Dialogues are drawn among the eligible ones, favouring the most specific.
  - Night actions from the content: menu **N** in 3D. Witnesses come from the night sim at the `at` position (`pilouWindow`, `street`…, default: Bernadette's terrace). Their Risk goes through `sim.punish` (Risk × witness weights).
  - Native actions (`sim: 'photo'|'police'|…`): their content effects apply once per night if the action really happened (Association call via `simArgs.asso`, or an id containing "asso").
- **Carry-over between days**:
  - The night starts with the campaign's Asso, Risk, hostility, corruption, police fatigue (calls minus 1/day), transfers and flags.
  - At the end of the night: Sleep += (night's sleep − 60) × 0.5, Asso/Risk come back from the night, Risk −5/day, Job −6/day.
  - Legal evidence → dossier (×0.9); illegal evidence → `pressFile()` only.
  - The engine sets the "posés par le moteur" flags of `flags.js`, plus `bribe_photo(_illegal)`, `corruption_proof`, `igpn_open`, `lemaire_transferred`, `custody` (Risk ≥ 90 from night 5), `tatie_leaked_plan` (Tatie wavering + hostile bloc: 25 %/evening, `CAMPAIGN.tatieLeak`), `saturday1/2_done`, `boss_noticed`, `unemployed`.
- **Balance (qa/balance.md, design agent's findings)**:
  - Asso gain capped at +8/night, with diminishing returns per share.
  - Evidence: same restaurant + same type the same night ×0.2.
  - Campaign dossier out of 100, built over ~8–10 nights.
  - Risk persists (−5/day), and the bucket is at 20 × witness weights (~32 when seen).
  - Corruption drags the police down (−0.4 × (corruption − 50)/100), and the IGPN lifts it (−15 then −25 corruption).
  - Since then, the numbers and `campaignBots.js` belong to the balance agent.
- **Night v0.4 (v0.2 leftovers)**:
  - **Klaas** is on place Maurice-Schumann (`klaasWindow` z≈67.6, read from the scene), about 90 m from Pilou. With the naked eye he barely sees anything at night. With his **binoculars** (every 12–25 min, for 4–8 min, and as soon as there's commotion: police in the street, chairs, the dachshund barking) he sees everything up to 170 m. The HUD says "Klaas (jumelles)".
  - **Jérémie's round** with the dachshund (21:30–22:30): it spots one infraction per restaurant (a legal piece). Jérémie is an ally witness, and **the dog barks** near an illegal act (+0.25 for every street witness, and Klaas looks).
  - **Disguises**: flags `disguise_hood` (×0.6) / `disguise_vest` (×0.5) for non-ally witnesses. They are declared in `ENGINE_FLAGS`; the content still needs an action to set them.
  - **The police come for Pilou** (hostility ≥ 60, 35 % of nights): a planned visit to his door, with a "rappel à la loi" (+10 Risk) if hostile witnesses saw something in the past 7 days.
  - **The bribe**: Lemaire + coffee → Dédé's envelope 50 % of the time, photographable for 3 min (from within 15 m, legal spot) → jackpot piece. The **camera under the awning** films it (illegal piece). A bribe that is sent (mairie / WhatsApp) or illegal → **IGPN**: case opened the next day, Lemaire transferred 3 days later (replaced by Benali).
  - **dB reading** (B): one piece per half-hour if ≥ 55 dB after 22:00.
  - The restaurants are at their §1b positions (Bernadette −30…−18, Mal Lunés −15…−5, Le Goulot 22…32).
- **Narration**: `narrative.js` (content agent) is injected and never imported by the sim: `createSim({ narrator })`, `createCampaign({ narrative })`. It uses its own RNG, so the text never changes the outcome. Wired: police, waiter, witnesses, Klaas's notebook (precise/vague), end of night, the bell (21:55/22:00/22:05), barks near the tables, the night's tutorial triggers (the day ones are the UI's), the daily media feed (`c.mediaFeed()` / `c.readMedia()`), the recap headline (`c.state.lastHeadline`), the D14 scene (`card.scene`), and the ending front pages (`c.state.endingMedia`).
- **UI integration**: `main.js` mounts `src/ui` (UI agent) via a lazy `import()`; a static import would put the 3D code into the `ui.html` chunk. `onNight` saves and reloads into the night; at the end of the night, `finishNight` runs and the UI resumes on the recap. There's no title screen in campaign mode (QA U6): one click to enter, with the controls shown on the first night only. "Nuit libre" (`Commencer la soirée`) is the v0.2 night.
- **Tools**:
  - `npm run sim -- --runs 1000 [--write] [--strict] [--fixture] [--bots …]` prints the distribution of endings per bot, the §13.H targets (✅/❌), the content never reached and the invariants.
  - Linter (`tests/unit/content-lint.test.js`): stays tolerant ("flag never set" = warning) while one of the announced files is missing.
  - Campaign invariants (`campaignInvariants.js`): days and phases in order, fixed events on their day, early endings gated, Risk only from a witnessed act or story, evidence → real source, one night per day. Not checked: "a closed shop stays closed" (no shops modelled).
  - `E2E_PORT` for running Playwright when several worktrees share the machine.
- **§13**: ticked A4, C2 (evidence), C4 (police), E4 (illegal evidence), I5 (CI + deploy). The automated side (T) of A1, A2, A5, C3 is done too, but the Q checks are still pending.

**Campaign features (campaign-features) — what changed in the day-side engine (for the build agent)**
- **Koddex**: the work items' own `requires` / `when` / `job` / `effects` and the gags' `when` were already honoured by `c.koddexOptions()` / `c.koddex()`; they are now covered by `tests/unit/campaignFeatures.test.js`. One existing rule matters for UIs and bots: a side project picked again after it is unlocked counts as real work (+`workJob`).
- **Side projects** (knobs in `config.js` `CAMPAIGN`):
  - `proj_db_logger`: `c.createNight()` wraps `sim.tick`. After 22:00, every `dbLogger.every` (30) game minutes, if the noise at Pilou's window is ≥ `EVIDENCE.dbThreshold`, a passive evidence piece is added: `{ type: 'db', kind: 'db', auto: true, quality: 0.7, value: dbValue × 0.5, text: 'Démon Rust : … dB à …' }`. It is legal and counts like the manual reading. main.js gets it for free (it calls `sim.tick`).
  - `proj_whatsapp_bot`: the mobilisation actions (`whatsappBot.actions`: rally, petition, banners, recruit) cost one slot less (minimum 1) and give +2 Asso. Use **`c.actionCost(a)`** for the slot cost the UI shows (it replaces `a.cost.time`); `c.availableActions()` and `c.doAction()` already use it.
  - `proj_scraper`: the evidence comes from content (`side_scraper_run`). The Job costs are the content's `job` per project.
- **Fired**: the skipped Koddex mornings and `unemployedBonusTime` were already there. `continueAfterEnding()` now has a test covering it.
- **D7 vote**: the `d7_general_meeting` choices set exactly one `stance_*` flag (tested).
- **Phone**: `c.readMedia()` now counts reads in `S.counts.media`. `runCampaign({ …, narrative })` takes the narrative module, and the headless bot reads the whole day's feed at the recap, before `nextDay()`, so message effects apply in simulated campaigns. `scripts/sim.js` passes it for real content (not `--fixture`). Balance note: message effects (small Asso, flags) now apply in `npm run sim`.
- **Coverage**: `tests/unit/coverage.test.js` now also covers DIALOGUE and MEDIA (ending-screen messages count when shown). Today 324/448 ids are reached: media 98/120, dialogue 131/183.
