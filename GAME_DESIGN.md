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
  Footage = continuous evidence, **unusable in court** but gold for the press, the internal investigation (municipal police: the mayor's office + the préfet; IGPN only covers the national police) and blackmail. If discovered → complaint.
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
  you have a clean shot from a legal spot. Leads to an administrative inquiry (« enquête interne », ordered by the mayor / the préfet; not the IGPN, which covers the national police) → Lemaire transferred → Corruption drops.
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
- **Computer only** (keyboard + mouse, or a gamepad); no touch controls (Lucas, 2026-10-08).
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

## 12b. v1.1 « no two nights alike » (Lucas, 2026-10-09)
Goal: a 3-hour campaign must not feel repetitive. Three changes, decided before Lucas's first playtest.

**A. A twist every night (night modifiers).** Each of the 14 nights has its own situation layered on the normal night
(fixed for the calendar nights, drawn from a pool for the others, never the same twice in a campaign). Each twist changes the
sim (more people, a table over the limit, a new witness, an obstacle, a new evidence opportunity, a risk) and has its own
lines, props and a short intro card at the start of the night. Pool (≥ 16), for example: a birthday at table 4 (11 people,
candles, singing at 23:40); an influencer filming the terrace with a ring light (a witness with a phone, and a viral-video
opportunity for both sides); a football match on a screen outside (noise peaks on goals); a hen party (« EVJF ») with a
megaphone; a delivery van blocking the corridor on a car-free Saturday; the drache (rain: terraces empty early, but under the
awning…); a heatwave night (windows open, noise ×1.3, everyone stays out); the tourist guide's evening tour; Colette dining
at the estaminet (D4); the inspector's discreet visit (D9); a student party upstairs at Régis's Airbnb; a busker under
Pilou's window; a power cut (darkness = stealth bonus, the exhaust stops); the waiter's last night before holidays; the
« Fête des voisins » the association organises (counter-programming); a fire-brigade inspection of the corridor; the
council's night walk (Lescaut walking the street at 23:00, if lescaut_meeting). Twists can chain into consequences
(flags) the next days, through media and dialogue.

**B. Tools that unlock over time.** The player starts with: watch, photo, the police call, asking the waiter, the bucket
(it's always there, it's the temptation). New tools arrive on a schedule *or* through story beats, each with a short
« Nouveau » card that teaches it: dB reading (D1 night), the 22:00 round with Jérémie (when invited, ~D2), the legal-zone
view L (after the AOT plan), the WhatsApp group (D2), the dB logger / scraper / bot (Koddex side projects), the window
camera (~D4), the night action menu items appear only once their story requirement is met (waiter informant, wifi,
backroom…). Rule: at least one new verb every 2 nights until D10. **Every tool gets a small hands-on tutorial** (Lucas, 2026-10-09) the first time it
becomes available in the night: a short coach mark (1–3 steps, ≤ 2 lines each) showing the key and the pad glyph, pointing
at what to do (« Visez une table et appuyez sur P », « Montez à la fenêtre : la gaine est juste en dessous »…), detecting
when the player has actually done it, then congratulating them in one line and fading out. Skippable, never blocking the clock
for more than a few seconds (the night clock pauses while the coach mark is first shown), replayable from « Aide ». Covers the
starting tools too (photo, police, waiter, bucket, the window, moving, the phone) on night 1, spread so the first night isn't a lecture. Nothing a bot or the balance targets rely on may be
removed: unlocks only gate *when*, and the balance agent re-checks §13.H after.

**C. The day in 3D.** The day phases stop being menus over a blurred backdrop:
- Morning: first-person, seated at Pilou's desk at Koddex (two screens, Clode Kode glow, plants, Stéphane passing by, a
  window). The Koddex terminal UI is drawn ON the in-world monitor (crisp HTML aligned to the screen by projection, so it
  stays readable), the rest of the office is alive (idle animations, colleagues).
- Afternoon: the street BY DAY (deliveries, terraces being set up, Klaas at his window, Tatie at hers, Biloute's walk),
  with the action cards as an in-world notebook/phone overlay; meetings happen in Hippolyte's workshop scene, the mayor's
  office in the town-hall scene. Day lighting.
- Gameplay unchanged: same choices, same cards; only the staging. Readability and the gamepad/keyboard flow must stay
  intact; « Bas » graphics quality may fall back to the 2D vignettes.

**D. Office days, home days, and Pilou's apartment** (Lucas, 2026-10-09, « bonus »).
- Some mornings Pilou works **at the Koddex office**, others **from home** (télétravail). The pattern varies across the 14 days
  (seeded; e.g. ~2 home days a week, never the D14 commission day). Same Koddex choices either way, but:
  - office day: he rides there on his **electric bike** (a short morning beat: the cobbles, Biloute chasing, the battery
    dying once in the campaign…); Stéphane and the colleagues are around; lunchtime gossip about Delphine's AC case.
  - home day: he works at his desk **in the living room, on the street side** (right by THE window); distractions from the street
    (deliveries, the terraces being set up, Ghislain on his stool, the smell of the exhaust at 11:30) can offer a small daytime
    evidence opportunity or cost focus (Job). Stéphane calls on video.
- **Pilou's apartment** (2nd floor of 3, no lift, a small 4-unit building, ~60 m², east–west through, renovated): a long entry
  corridor with a 3.6 m built-in bookshelf, navy-blue ceiling and navy doors, pocket doors; a ~20 m² living room on the
  **street side** with two windows (THE window over the terrace) and an open kitchen (induction hob, wall oven, its own small
  hood: irony), **Pilou's work desk with two screens**, light parquet, a plum accent wall, a corner sofa, a dining nook with a gilt mirror and a TV; on the
  **courtyard side** (quieter): Pilou's bedroom (dark green wall, double bed, sliding wardrobe) and **his daughter's bedroom**
  (two wardrobes, the door to a ~3 m² **balcony** on the courtyard: wooden decking, a bench, brick walls); a bathroom with green zellige tiles, a bathtub with a glass screen, a stone basin on wood,
  a backlit mirror and gold taps; separate WC. The e-bike is parked in the corridor.
  Gameplay nuance: sleeping in the courtyard-side bedroom is quieter than dozing on the sofa by the street windows;
  the exhaust smell reaches the living room first.
  Pilou has a **daughter**; the second bedroom is hers [OPEN: name, age, which nights she's there]. Until Lucas answers,
  she is only present through her room (drawings, a night light), never named and never on stage.
  Source: Lucas's own description and his apartment page (layout only).
Checklist additions (v1.1) are in §13.J.

## 12c. Playtest 1 (Lucas, 2026-10-09): verdict « bon globalement », fixes
1. **Sound design is random.** The ventilation hum is loud from the start, even far from it; after ~day 2 there is no sound at all.
   Target mix: the exhaust hum is heard **only in Pilou's apartment** (loud at the street-side window, muffled in the bedroom,
   absent in the street except a faint hiss right under the duct); the street has a real ambience (positional crowd murmur by
   table and by headcount, chairs on cobbles, glasses, footsteps, distant city, the Saint-Maurice bell at 22:00, rain on drache
   nights, each twist's own sounds: accordion, football cheers, megaphone, singing…); clear UI sounds (phone, coach mark,
   Nouveau). Audio must survive every transition (day ↔ night, pause, 14 days): a regression test checks the audio graph is alive
   on day 5+.
2. **Music**: a soft, chill procedural soundtrack (a lo-fi day loop, a quieter night ambient bed), with separate volume sliders
   (Musique / Ambiance / Effets) and on/off in the pause/settings menu, persisted.
3. **Notification badges** (phone, Carnet…) light up when nothing is new: unread counts must only count genuinely new,
   unseen items, and clear when opened.
4. **The night action menu is hard to understand**: rework it so it's obvious what you can do *here and now* and why other
   things aren't possible (where to go / what's needed), with legality, risk and time cost readable at a glance, and a coach mark.

5. **The night drags after ~22:30** (« pas grand-chose à faire, ou je rate des choses ») **and sleeping is too slow.**
   - **Adaptive night clock**: normal speed until ~22:30; afterwards the clock runs ×3 *unless* something is happening or
     imminent (a patrol on its way, a twist moment or night event within the next 10 game minutes, a witness situation, the
     player in a menu/action), where it eases back to normal. A small « ⏩ » indicator shows the acceleration. A key
     (and pad button) toggles « accélérer » manually at any time.
   - **Sleep**: ×12 becomes ×40, with a dim « Pilou dort… » overlay that still shows what wakes him (noise peaks), and a
     « Passer à demain matin » button that resolves the rest of the night instantly (same sim, fast-forwarded).
   - **« Ce soir » briefing**: at night start, under the twist card, 2–4 concrete, state-aware suggestions for tonight
     (« Nouveau : la caméra à la fenêtre », « Colette dîne à la table 2 : 8 couverts, à photographier », « 22h : la ronde avec
     Jérémie », « Lemaire est de service : la police risque de prendre un café »), and an « Objectifs du soir » list in the HUD
     that ticks itself as they're done. Data in src/content/objectives.js (§14 style); the engine picks them.
   - **Bedtime hint** (Lucas): after 22:30, once the night's essentials are done (reports/shares sent, nothing pending: no
     patrol en route, no twist moment imminent) or as soon as Sleep is low, a gentle, state-aware hint suggests going to bed
     (« Dossier à jour : au lit », « Vous tombez de sommeil : allez vous allonger »), pointing at the bed/E, also as the last
     « Objectifs du soir » item. Never nags more than once every ~20 game minutes; disappears if something new happens.

## 13. v1.0 acceptance checklist
v1.0 ships only when **every** box is ticked. Nothing is dropped silently: anything cut or simplified is listed under "Deviations" with Lucas's OK.
Proof: **T** = automated test (vitest / Playwright / campaign simulator, runs in CI) · **Q** = design agent's QA session in Chrome (screenshots in `qa/`) · **L** = Lucas playtest.

### A. Campaign and length
- [x] 14-day calendar Monday → Sunday of week 2, each day = Koddex morning → afternoon → night (3D). **T Q** — T: tests/unit/checklist.test.js §13.A1, campaign.test.js (Q pending; see qa/checklist-audit.md for the D14 lost-commission early end) — Q: A1-calendar*.png + design-agent Chrome run day 1→2 (design agent, 2026-10-08)
- [x] Save/continue (localStorage), a new campaign, and one save slot minimum. Reload mid-campaign resumes the same day and state. **T Q** — T: tests/unit/checklist.test.js §13.A2, campaign.test.js, tests/e2e/campaign.e2e.js (Q pending) — Q: A2-save-continue.jpg + design-agent reload test (design agent, 2026-10-08)
- [ ] **Duration**: a full campaign takes **2h30 to 4h** for a human (14 nights × ~10 min + day phases). Nights can't be skipped without consequence ("go to bed" = you lose what happens). **Q L**
- [x] Early endings (custody, fired, moving out) can't trigger before **night 5**. The "real" endings are decided at the **Day 14 commission**. **T** _(v0.4: campaign.test.js « fins », campaign invariant « fin anticipée avant la nuit 5 »)_
- [x] Fixed events happen on their day: Saturdays 6 & 13, Colette's dinner (D4), the general meeting (D7), the inspector (D9), the exhaust meeting (D11), the commission (D14). **T Q** — T: tests/unit/checklist.test.js §13.A5 (Q pending) — Q: qa/screens/q/A5-event-d*.jpg (design agent, 2026-10-08)

### B. Characters (all present, recognisable, with a role and dialogue)
- [x] Pilou · Jérémie + dachshund · Klaas (Santa look, notebook) · Hilde · Tatie Bouchon (+ the "it's being fixed" email thread) · Seb & Nico + the cat · Hippolyte (carriage building). **Q** _(art side done: 3D model + portrait with 7 expressions for each, `qa/art-v0.5/portraits-1.jpg`; role/dialogue = content + wiring)_ — Q: qa/screens/q/B1-B2-carnet-characters.jpg, art-v0.5 screenshots (design agent, 2026-10-08)
- [x] Dédé · Ghislain (bun) · the waiter · Brigadier Lemaire · Agent Benali · the police chief · inspector Delphine Vermeersch · Stéphane (Koddex boss) · Colette Verhaeghe · mayor Bertrand Lescaut. **Q** _(art side done: models + portraits for all, incl. Lemaire/Benali/chef variants, Stéphane, Colette, Lescaut)_ — Q: qa/screens/q/B1-B2-carnet-characters.jpg, D14 commission scene (design agent, 2026-10-08)
- [x] Each association member has at least **8 lines** of contextual dialogue (reacting to the current state) and at least 1 action or event tied to them. **T** (content count) **Q** — T: tests/unit/checklist.test.js §13.B3 (Q pending) — Q: qa/screens/q/B3-dialogue-*.jpg (design agent, 2026-10-08)

### C. Night systems
- [x] 22:00 rule (street-specific, 2026), 6 per table, zones + corridor, cobbles (chair clatter). **T** _(v0.2: tests/unit/rules.test.js)_
- [x] Evidence: photo, dB reading, headcount, corridor encroachment, timestamps. Quality + legality per piece. **T** _(v0.4: rules.test.js, campaign.test.js « preuves »)_
- [x] Witnesses / line of sight: Klaas (asleep ~01:00), Seb & Nico (cat = home), the waiter, customers filming, the dachshund. Darkness, time and disguise modifiers. **T Q** — T: tests/unit/witness.test.js, campaign.test.js (Q pending) — Q: qa/screens/q/C3-witnesses-2230.jpg / -0110.jpg (design agent, 2026-10-08)
- [x] Police: 3 patrols with personalities, hidden roster (Klaas can deduce it), tip-off, coffee/complaisance logged, "c'est encore vous", calling as the Association, the police coming for Pilou, the bribe caught on camera → internal investigation. **T** _(v0.4: police.test.js, campaign.test.js « chaîne IGPN » / « la police vient pour Pilou » ; the roster shows on the phone once `roster_known`)_
- [x] Mayor's office: reports, inspector visits (announced = tip-off via Colette, surprise = via Delphine/Hippolyte). **T** — tests/unit/checklist.test.js §13.C5
- [x] Saturday: no vehicles, crowd, standing drinkers, peeing in doorways. **Q** — Q: qa/screens/q/C6-saturday.jpg (design agent, 2026-10-08)

### D. Day systems
- [x] Koddex: 3 Clode Kode prompts a day, work vs side projects (dB logger, WhatsApp bot, review scraper, wifi cracker, fake reviews), Job meter, boss gags. **T Q** — T: tests/unit/koddex.test.js, campaignFeatures.test.js (Q pending) — Q: qa/screens/q/D1-koddex.jpg (design agent, 2026-10-08)
- [x] Afternoon actions: meeting, mayor's office, emails, press (La Voix du Nordiste), lawyer (formal notice), petition, health agency (ARS) / environmental health about the exhaust, recruiting residents, asking for a uritrottoir, dinner at Stéphane's with Delphine. **T** — tests/unit/checklist.test.js §13.D2
- [x] The restaurants' counter-moves (all of section 8) can trigger, depending on state. **T** — tests/unit/checklist.test.js §13.D3: 12/12 proven (morning counter-moves fixed in 2b200da), see qa/checklist-audit.md

### E. Actions (every one implemented, with a cost, an effect and a consequence)
- [x] Legal: every item of section 6 "Legal". **T** — tests/unit/checklist.test.js §13.E, nightActions.test.js
- [x] Grey: every item of section 6 "Grey". **T** — tests/unit/checklist.test.js §13.E, nightActions.test.js
- [x] Illegal: bucket, cardboard on the exhaust, stink bomb, kitchen sabotage (salt/sugar), fake reviews, sabotage (chairs, parasols, locks), bribing the waiter, hidden cameras (window = grey, awning = illegal), power from Bernadette's electricity, cracking their wifi (+ reading reservations, emails, quotes), sneaking in to photograph the bribe. **T** — tests/unit/checklist.test.js §13.E, nightActions.test.js
- [x] Illegally obtained evidence is unusable in court but usable for the press / internal police investigation. **T** _(v0.4: campaign.test.js « caméra cachée » : out of the dossier, counted in `pressFile()`, opens the IGPN case)_

### F. Endings: all 8 reachable
- [x] 1 Legal victory · 2 Negotiated peace · 3 Scandal · 4 Custody/trial (incl. the « carbonnade sucrée » and « carbonnade laxative » variants) · 5 Moving out to Wazemmes · 6 Fired (+ continue twist) · 7 Turncoat (secret) · 8 The return (La Bombance). **T Q** — T (engine): tests/unit/checklist.test.js §13.F1 (bots: F3; Q pending) — Q: qa/screens/q/F-*.jpg (end screens of all 8 + custody variants) (design agent, 2026-10-08)
- [x] Each ending has its own end screen with an epilogue that **references what the player actually did** (key evidence, actions, who betrayed whom). **T Q** — T: tests/unit/checklist.test.js §13.F2 (Q pending) — Q: F-custody-laxative.jpg, qa/stories/legal-3.md epilogue (design agent, 2026-10-08)
- [x] The campaign simulator reaches **every ending** with at least one scripted strategy, and each ending occurs in ≥ 2% of 1000 runs of its target strategy. **T** _(balance pass 1, qa/balance.md 2026-10-08: lowest = turncoat 5 % of diplomat runs; re-verified pass 3, 68/68 actions, 42/42 counter-moves)_ — balance agent: qa/balance.md, coverage.test.js

### G. Scenario coherence (automated invariants + story review)
- [x] Invariants checked on every simulated night and campaign: the police only arrive after a call or a scheduled event; nobody is in two places; a cleared table doesn't come back without a tip-off/return event; evidence refers to real events (time, place, table); Risk only rises from witnessed acts; a closed shop stays closed until its event; Klaas's notebook only logs what he could see. **T** — tests/unit/invariants.test.js, campaign.test.js, checklist.test.js §13.G1
- [x] Dialogue/event text only references facts the player has unlocked (no spoilers, no "as you know…" about something unseen). Flags are checked by a content linter. **T** — tests/unit/content-lint.test.js, checklist.test.js §13.G2
- [x] Story bible review: names, places, timeline and character traits are consistent across all text (design agent review, logged in `qa/coherence.md`). **Q** — Q: qa/coherence.md passes 1, 1b, 2 (transcripts), 3 (endings); design agent read qa/stories/legal-3.md and endings/negotiated_peace.md, fixed the Régis contradiction (3e8d187), 2026-10-08
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
- [x] Targets met, numbers logged in `qa/balance.md` at each milestone with the knobs changed. **T** _(balance pass 1, 1000 runs × 7 bots, `npm run sim -- --runs 1000`; re-verified in pass 3, qa/balance.md)_ — balance agent: qa/balance.md
- [x] No dominant action: removing any single action shifts the mixed bot's win rate by < 25 points. **T** _(`npm run sim -- --runs 1000 --bots mixed --ablate mixed`: max 17; pass 3: max 10, qa/balance.md)_ — balance agent (no test yet)
- [ ] Human feel: Lucas's playtest notes addressed. **L**

### I. Presentation and tech
- [x] Cute low-poly cast and street (stepped gables, carriage door, La Bombance, the cat, the dachshund). **Q** _(art v0.3–v0.5: QA in Chrome, screenshots in `qa/art-v0.5/`)_
- [x] Audio: crowd, chairs on cobbles, exhaust hum, 22:00 bell, mute (M). **Q** _(art v0.3; v0.5 adds sfx + day/hall loops)_
- [ ] French only, satirical tone, Ch'ti touches. Copy proofread. **Q L**
- [ ] Gamepad on PC (Lucas, 2026-10-08): Xbox/PlayStation controllers via the Gamepad API: move/look in the 3D night, every night action, and full navigation of the day screens and menus; on-screen button hints switch to the pad when it's used. **T Q L**
- [ ] 60 fps on a laptop iGPU (perf test logs the frame time). Loads in < 5 s. Bundle < 3 MB. **T Q** — T: tests/e2e/checklist-perf.e2e.js (bundle 1.1 MB, title 147 ms in CI, frame time logged; 60 fps = Q) _(art: busiest Saturday view 150 draw calls / ≤130k triangles, 3.2 ms/frame on a real GPU (Apple, Chrome); SwiftShader CI fps is indicative only. Still needs one laptop-iGPU check (Q).)_
- [x] CI green (unit + e2e + campaign simulator smoke). Deploy auto from main. **T** _(v0.4: .github/workflows/ci.yml runs vitest, `npm run sim -- --runs 20`, Playwright; CT 105 deploys main every 2 min)_

### J. v1.1 « no two nights alike »
- [ ] ≥ 16 night twists, every night of a campaign has one, never the same twice in a campaign; each changes the sim and has an intro card, lines and props. **T Q**
- [ ] Every night tool has a hands-on coach-mark tutorial on first availability (key + pad glyph, completion detected, skippable, replayable from Aide). **T Q**
- [ ] Tools unlock over time with a « Nouveau » card; ≥ 1 new verb every 2 nights until D10; §13.H still met after (balance re-run). **T**
- [ ] Morning at Koddex in 3D (seated, terminal on the in-world monitor, readable); afternoon in the daytime street / workshop / town hall in 3D; keyboard + gamepad flow intact. **T Q**
- [ ] Office vs home days (e-bike commute, home desk in the living room) and Pilou's apartment modelled per §12b.D, walkable at night. **Q**
- [ ] Story transcripts refreshed: two runs of the same style differ night by night (twists), and the night recap mentions the twist. **Q**

### K. Playtest 1 fixes (§12c)
- [ ] Sound: exhaust only in the apartment (spatial), full street ambience + twist sounds, audio alive across all 14 days (regression test). **T Q L**
- [ ] Chill music (day/night), Musique/Ambiance/Effets sliders + on/off, persisted. **Q L**
- [ ] Notification badges only for genuinely new items, cleared on open (test). **T Q**
- [ ] Night action menu reworked for clarity (here-and-now, why not, legality/risk/time at a glance, coach mark). **Q L**

### L. Text ↔ state coherence (Lucas, playtest 1)
- [ ] Every line shown (barks, Klaas, police, twist events, recap, dialogue, media) is consistent with the simulation state at the moment it's shown: no « en terrasse » when no table is out, no « les tables rentrent » when they're already in, no daytime line at night, no line about someone absent, twist props/tables obey what the text says (the Fête des voisins tables go home at 22:00). Lines carry state guards; a checker scans 200 seeded campaigns and reports 0 mismatches. **T Q L**

### M. Night pacing (playtest 1)
- [ ] Adaptive night clock (×3 after 22:30 unless something is happening/imminent, ⏩ indicator, manual toggle) and faster sleep (×40 + « Passer à demain matin »); campaign duration re-measured. **T Q L**
- [ ] « Ce soir » briefing + « Objectifs du soir » HUD list, state-aware, self-ticking; bedtime hint after 22:30 when done or tired. **T Q L**

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
```js
// twists.js (v1.1): the night twists. Engine: src/sim/twists.js (build agent). Content: src/content/twists.js.
export const TWISTS = [{
  id: 'birthday_t4', title: 'Anniversaire à la table 4', pool: true,      // or day: 4 for a fixed calendar night
  when: {...},                                   // §14 conditions (day range, flags, weekday 'sat', not after X…)
  intro: '…',                                    // the card shown before the night (≤ 300 chars)
  sim: {                                         // all optional; the engine applies them to that night only
    crowd: 1.2, noise: 1.15, closeDelay: 20,     // multipliers / minutes added to the restaurants' clearing
    tables: [{ rest: 'bernadette', count: 11, label: 'table 4' }],   // extra or altered tables
    witnesses: [{ id: 'influencer', at: 'street', filming: true }],  // extra witnesses (witness.js)
    darkness: 0.5, rain: true, exhaustOff: true, corridorBlocked: true,
    events: [{ at: 23 * 60 + 40, text: '…', simEffect: { noise: +8 } }], // timed moments (minutes since midnight)
    opportunities: ['night_photo'],              // actions highlighted / unlocked for this night only
  },
  lines: { barks: ['…'], klaas: ['…'], recap: ['…'] },   // flavour, picked by narrative.js
  props: ['ring_light'],                         // art ids the scene director spawns for the night
  after: { setFlags: ['…'], media: ['…'] },       // consequences on the following days
}];
// unlocks.js (v1.1): progressive tools. Engine: src/sim/unlocks.js. Content: src/content/unlocks.js.
export const UNLOCKS = [{ id: 'db_reading', unlocks: { keys: ['B'], actions: ['night_db'] }, when: { day: [1, 14] },
  card: { title: 'Nouveau : le relevé de décibels', text: '…', hint: 'B / RB' } }];
// objectives.js (v1.1, §12c.5): « Ce soir » briefing + « Objectifs du soir » HUD list. Engine picks 2–4 per night.
export const OBJECTIVES = [{
  id: 'o_tw_colette', text: '…',                 // ≤ 90 chars; illegal ones are options with their risk, never orders
  stance: 'legal',                               // 'legal' | 'grey' | 'illegal' | 'info' (info: done = null, nothing to tick)
  when: { twist: 'colette_dinner' },             // §14 conditions + twist (tonight's twist), newTool (unlocked tonight), onDuty ('lemaire'|'benali')
  done: { event: 'photo_taken', table: 'la table de Colette' },  // or { flag: 'x' }; events = TUTORIAL_EVENTS or 'action:<id>'
  priority: 10, group: 'photo',                  // highest first, at most one per group
}];
// done filters: photo_taken { overLimit, late (after 22:00), table (twist table label), corridor } · db_taken { min } ·
// police_called { patrol, asso }.
```
Rules: all text is in French; **no real restaurant names**; every `speaker` exists in `characters.js`; every flag is declared;
every action, event and ending is reachable (the linter + the campaign simulator check this). An epilogue is built from the parts whose `when` matches,
so it reflects what the player actually did.

**Content-side additions (content-v0.4, all optional and backward-compatible; details in Build notes):**
- `characters.js` exports `CHARACTERS` as an **object keyed by speaker id** (`{ name, fullName?, title?, group, home, bio, voice }`), plus `WHATSAPP_GROUP` (the group's display name, one constant) and `PLACES` (the street's businesses, fictional names).
- **State guards (v1.1, §13.L).** A night line whose wording depends on the street at that instant is written `{ text, state }` instead of a plain string. Plain strings stay valid everywhere. AMBIENT and PHONE_PINGS entries and twist events also take `state`; a twist event can add `else` (the text to show when the guard fails). `src/sim/stateGuard.js` evaluates the guard **when the line is shown**, and narrative.js, pacing.js and twistNight.js only pick lines whose guard holds. Vocabulary (all keys optional, AND-ed):
  - `tablesOut` / `estaminetOut` / `customers`: a comparison (`'>0'`, `'0'`) on the tables out (all restaurants), the estaminet's tables out, or tables out plus standing groups.
  - `after` / `before`: game time `'HH:MM'` (hours < 12 = after midnight).
  - `rain`, `exhaust` (the duct running), `saturday`, `dark` (power cut): `true` / `false`.
  - `present` / `absent`: ids among `serveur`, `patrouille`, `klaas`, `biloute` (on his round), `chat` (Gaufre on the balcony, hence Seb & Nico), `debout`.
  - **Twist extras:** `props` entries can be `{ id, from, until }`, so a prop leaves when the text says it does. `tables[]` can take `until` (cleared at that time, unaffected by `closeDelay`). `sim.dog: false` cancels Jérémie's round.
  - **Day lines** (dialogue, media, cards) don't take state guards: there's no live street in the day phases, and their references to the night are gated by flags.
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
  - The engine sets the "posés par le moteur" flags of `flags.js`, plus `bribe_photo(_illegal)`, `corruption_proof`, `inquiry_open`, `lemaire_transferred`, `custody` (Risk ≥ 90 from night 5), `tatie_leaked_plan` (Tatie wavering + hostile bloc: 25 %/evening, `CAMPAIGN.tatieLeak`), `saturday1/2_done`, `boss_noticed`, `unemployed`.
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
- **@art agent, red CI after 3016a52 (scene director)**: not a director bug. In CI the recap does show up after the 3D night, but more than 5 s later: lazy `import('./ui/index.js')`, the mount, and the SwiftShader render with the director. Fixed in b07da8e (the e2e waits up to 30 s for `[data-testid=recap]`). Nothing to change on your side.

**scene-director (art agent)**
- **`src/scene/director.js`** takes the actors out of main.js: `createDirector({ scene, world, art, audio })` → `update(sim, campaign?.state, dt)`, `onEvent(e)`, `hitTargets()`, `toggleLegalView()`. main.js now only calls those four (commit 3016a52: syncActors, animate's table/steam lines, the old splash particles and the actor placeholders are gone). Details in `src/scene/README.md`.
- Everything is read from the sim (state, journal, events) and the campaign flags, so the director never changes gameplay. Moments the sim doesn't model (the waiter's cigarette breaks, Ghislain's stepladder) are in `src/scene/schedule.js`. **[OPEN]** The sim could read `WAITER_BREAKS` if witnesses should account for them. BUG-001 (dachshund not synced) is fixed: Biloute follows `sim.dogPos()`.
- The red CI after 3016a52 was the campaign e2e waiting 5 s for the recap under SwiftShader (fixed by the build agent in b07da8e). Not a director bug; the test passes locally in 38 s.
- **Perf (§13.I4)**: at the busiest Saturday view (end A looking down the street, 22:40, ≈150 characters on screen), from 274 to **154 draw calls** and 4.4 to **3.2 ms per frame** on a real GPU (Chrome, Mac; CPU side: sim + director ≈ 0.5 ms, character update ≈ 0.8 ms, three.js submission ≈ 2 ms). Measures: static rigs (chairs, tables) reuse their matrices when nothing moves; distant characters animate every third frame and compute only the bones of their simplified parts; light static materials are no longer split by stretch. `tests/perf/frame.perf.js` reports 150 draw calls / 127k triangles. Its fps is meaningless locally (SwiftShader on a loaded machine). The `?perf=1` HUD now also shows the art CPU time.

**Balance pass 1 (balance agent) — engine fixes, new knobs, bots, simulator flags**
- **Bug fix, morning counter-moves (all 12 of Tatie's emails, `cm_bins`)**: `buildCards` only built counter-moves in the afternoon, so every counter-move whose `when.phase` is `'morning'` never fired. It wasn't crowding. They are now built in the phase of their `when` (default afternoon). The per-phase cap `maxCountermovesPerDay` is unchanged. (`campaign.js`, 3 lines. This fixes the D3 bug in qa/checklist-audit.md; the two `it.todo` in `checklist.test.js` §13.D3 can now become tests.)
- **New config knobs** (defaults = old behaviour, values set in `src/config.js`):
  - `CAMPAIGN.contentDossierScale` / `contentAssoScale`: positive `dossier` / `asso` effects written by content (`apply()`) are multiplied by these, so the writing keeps relative values and the economy is tuned in one place. Night content effects that go through `nightActions.applyEffects` (asso / sleep inside the night) are **not** scaled yet. @content agent: if you move that code, keep that in mind.
  - `CAMPAIGN.assoDecayPerDay`: asso drifts back towards `start.asso` every morning (`beginDay`).
  - `POLICE.fineHostility`: a call that ends in a PV raises the bloc's hostility (`police.js resolve`, 1 line). This is the main source of randomness on the peace route, because it depends on which patrol shows up.
- **the_return counts as the win it sits on**: `baseEnding(S)` (campaignBots.js) maps `the_return` → `legal_victory` / `negotiated_peace` / `scandal` from the `won_*` flag. The simulator's score and §13.H targets use it. The ending still exists, with the same priority, and its epilogue still varies by win.
- **Endings** (conditions only): the turncoat now needs `carbonnade_3` + `commission_done`, neither `commission_won` nor `commission_lost` (i.e. the « en habitué » choice at the commission), and `asso < 60`. Moving out gained a matching branch: habitué with `asso >= 60` = a lost commission. Without it, the engine fallback (lowest priority = negotiated peace) would have handed out a free win.
- **Bots** (campaignBots.js): scoring counts the real gain (config scale, headroom: asso at 100 doesn't climb), only new flags score, and the win flags are weighted in the order of the endings. Night content goes through `availableNightActions` (window, scene), and illegal acts only happen when none of *their own* witnesses (`witnessed.by`) can see the spot. Stealthy sleeps 23:15–00:50, makes one police call and asks the waiter. Reckless asks the waiter. Mixed naps when tired. The diplomat rations calls and, if peace becomes impossible (day ≥ 8, hostility ≥ 80), switches sides (carbonnades, passive nights). New **slacker** bot (all prompts on side projects + `work_nap`) for the fired ending.
- **Simulator** (`scripts/sim.js`): `--set A.b=1,C.d=2` (config overrides without editing, quote-free for ssh), `--detail` (commission choices, p10/50/90 dossier / asso / hostility, key flags, actions per campaign), `--ablate [bot]` (§13.H "no dominant action": removes each action the bot used, one at a time, and prints the win-rate shift; `--strict` fails at ≥ 25 points).
- **For the content agent**: `r_aot_pdf` can never fire. Its `when` needs `aot_requested` without `legal_view`, but `pm_aot_request` sets both. Still unused by every bot: `night_saboter_cuisine`, `night_laxatif_carbonnade` (kitchen open before 23:00 + an informant waiter; in the sim the bribe → debrief → sabotage chain hasn't completed yet), `night_backroom_photo` (needs a patrol on site + informant waiter), `pm_bloc_fooled`, and the counter-moves that follow them (`cm_sugar_blame`, `cm_waiter_suspected`, `cm_camera_found_paranoia`).

**v0.6 (build-v0.6)**
- **D3 fixed**: counter-moves honour `when.phase` (afternoon by default), so morning ones (Tatie's emails, cm_bins…) fire now. Cap of 2 per phase. The §13.D3 `it.todo` are real tests.
- **A1 (design decision)**: the campaign ends right after the D14 commission, won or lost (`CAMPAIGN.finalFlag: 'commission_done'`), with `early: false`. There is no night 14: 13 nights + the commission. Epilogue and « the return » are resolved there.
- **Free night**: `?day=` accepts all 7 weekdays (`tue`, `dimanche`…; unknown → Monday). Label and police roster follow the day; Saturday plays the no-cars variant.
- **Bug**: the HUD (prompt, clock, bars) could freeze for a whole night when the first frame's delta was NaN. Fixed in main.js.
- **U6** was already done (665dd2d): no title screen at a campaign night's start.
- **Q session to run in Chrome (§13 A and C, automated side done)**:
  - A1: play days 1→3 (morning/afternoon/night/recap). On D14, the commission ends the campaign straight away: no night, no "Jour 15" button.
  - A2: reload mid-afternoon and mid-night. "Continuer" resumes the same day; a night restarts from its beginning.
  - A3: time a real night (~10 min) and a day phase, for the 2h30–4h estimate.
  - A5: D4 (Colette's dinner, night card), D6/D13 (Saturday crowd), D7 vote, D9, D11, D14 appear on their day.
  - C3: at the window after 22:00, the "👁 Témoins possibles" line changes when Klaas picks up his binoculars (police in the street, chairs) and when the cat goes in. Try a bucket with the dachshund nearby (21:30–22:30): it barks.
  - C5: the mayor's office reports from the phone (inspector visits are content-driven).
  - C6: `?day=sat`: standing drinkers, people peeing in doorways (incl. Pilou's door), louder.

**Story transcripts (story-transcripts) — for the build agent and the balance agent**
- **Tool**: `npm run story -- --bot <passive|legal|reckless|stealthy|mixed|diplomat> --seed N [--out qa/stories/<bot>-<N>.md]` plays one full campaign headless (same night narrator as `main.js`, own RNG) and prints it as a French story, day by day. Twelve transcripts are in `qa/stories/`. Regenerate them after a big change and read one before shipping.
- **Findings**: `qa/coherence.md`, section « pass 2 (transcripts) ». The content fixes are done. The **engine** rows are for the build agent, in order of visibility:
  1. End the campaign right after `d14_commission`, for every outcome, with `early: false`. Today the day goes on after the verdict (afternoon, counter-moves, a full night with the suspended terrace out, a recap that says « La commission du jour 14 va devoir l'écouter »), while a lost commission ends at once as an early ending.
  2. `random_drache` must empty the terraces in the sim.
  3. Show night-phase event cards at their clock time inside the night, not before 20:30.
  4. Resolve each generic `'work'` Koddex pick to a different item (the same result prints 2–3 times a morning), and allow one use per afternoon for repeatable actions.
  5. De-duplicate narrated lines: one witness line per witness kind per act, plus a short « recently said » memory for barks and Théo.
  6. The nightly verdict should use the campaign's Dossier. The custody verdict should name the real cause (not always « le seau d'eau »). The police call counter should count tonight's calls. The 20:30 photo dB should be measured at the table.
  7. The UI speaker label should be « le serveur » until `met_waiter`. Each character's `*_hello` should come before their other lines. The IGPN inquiry should depend on an actual transmission.
- **Balance** rows (for the balance agent):
  - Asso and Dossier hit 100 by D4–5 for the legal and mixed bots.
  - Risk sits at 84 for days, then custody comes on a morning with no act; stink bombs raise Sleep.
  - The diplomat now reaches negotiated peace through `r_charter_talks` (new; the D14 charter pitch requires `charter_drafted`). Re-run `npm run sim` against the ≥ 40 % target.

**art-v0.7 (1) · scheduled presences are sim data** — @build agent
- New `src/sim/schedule.js` (`SCHEDULE`, overridable with `makeConfig({ SCHEDULE })`): the waiter's cigarette breaks, Ghislain cleaning the awning, the patrol spacing. New sim helpers: `sim.waiterOnBreak()`, `sim.ghislainCleaning()`, `sim.policePositions()` (both officers' `{ x, z, heading, moving }`, also for the visit at Pilou's door).
- `sim.waiterPos()` now returns the smoke spot (against the estaminet's façade) during a break. So **witness.js sees the waiter there** (line of sight from the façade), and so do the [E] prompt and `askWaiter`. Tested in `tests/unit/schedule.test.js`.
- The scene director only reads these, so the 3D view and the witnesses can no longer disagree. `src/scene/schedule.js` keeps only visual knobs.

**art-v0.7 (3) · weather** — @build agent
- New `src/sim/weather.js`: `S.weather` is planned at night creation. **Drache**: `carry.weather = 'drache'`, set by `c.createNight()` when the `r_drache` event was drawn that day. Rain at 21:15 for 70 min; all out tables are cleared within 4 minutes (`clearedBy: 'rain'`, shown in the summary as « la pluie »), standing groups leave, and tipped tables don't come back in the rain. **Drizzle**: about 12% of nights, purely ambient, no effect on play. It's drawn from its own RNG, so no other random draw of the night shifts. Exposed as `sim.weather()` → `{ kind, intensity }`. Tests: `tests/unit/weather.test.js` (invariants hold, drizzle = same night as dry).
- 3D (`art.weather`, driven by the director): rain streaks around the camera (one draw call), cobbles darker and shinier while wet (they dry about 40 game min after the rain), small splashes on the ground, passers-by with umbrellas during the drache, and a rain sound (`audio.rain(level)`, muffled in the apartment). Screenshot: `qa/art-v0.7/drache.jpg`.

**art-v0.7 (4) · ending tableaux** — @UI agent
- `art.scenes.ending(endingId, flags)` returns the same contract as the day vignettes (`{ scene, camera, update(dt), setAspect(a), dispose() }`). Use `campaign.state.flags` for `flags`. Shortcut: `scenes['ending_' + id]` takes no argument, so in `src/ui/vignette.js` a simple `vignette.set('ending_' + ending.id)` behind the end screen is enough. An unknown id falls back to the quiet street.
- The eight tableaux (screenshots `qa/art-v0.7/ending-*.jpg`):
  - **legal_victory**: Pilou at his open window, with no terrace, the duct taken up to the roof, the cat in the street and a banner if `banners_up`.
  - **negotiated_peace**: the signed « CHARTE DE BON VOISINAGE » on a table, the clock at 22:00 sharp, Dédé and Jérémie shaking hands, the chairs stacked.
  - **scandal**: the front page of La Voix du Nordiste (« LE CAFÉ ÉTAIT OFFERT, LES PV NON »), and Lemaire's empty chair with his cold coffee and forgotten cap.
  - **custody**: the bench at the municipal police station, a flickering neon light, Pilou head down, Benali at the counter.
  - **moving_out**: a removal van « Lille → Wazemmes » in the cobbled street, boxes, the mattress, Pilou with the last box.
  - **fired**: the empty desk at Koddex, Clode Kode on screen saying « Je suis vraiment désolé… », the box of belongings.
  - **turncoat**: Pilou on the terrace with a carbonnade, Dédé patting his shoulder, Klaas taking notes in the background.
  - **the_return**: La Bombance reopened as a bar, a pink blinking neon « LA BOMBANCE · BAR », the queue already forming.



**Story fixes (story-fixes) — what I changed in the engine (for the build agent: you're in these files too)**
- `src/sim/campaign.js`:
  - `createCampaign` gets new state `S.lastShown` (day an entry was last shown) and `S.nightEvents`, both defaulted for old saves.
  - `cooled()` / `shown()` helpers.
  - `buildCards()`: night-phase events, fixed or random, go to `S.nightEvents` (`{ id, at }`) instead of cards when `CAMPAIGN.nightEventsAtTime`. The cooldown also applies to random events, counter-moves and dialogue.
  - New `resolveEvent(e, i)`, extracted from `c.resolveCard`, which now calls it and records `shown()` for dialogue and counter-moves.
  - `koddexOptions` / `koddex`: cooldown on work items and gags.
  - New `c.nightEventDue(sim)`, `c.resolveNightEvent(sim, i)`, and `NIGHT_EVENT_EFFECTS.rain`, used by the content's `simEffect: 'rain'`.
  - `c.finishNight` clears `S.nightEvents`; unplayed ones are dropped.
- `src/config.js` `CAMPAIGN`: `repeatCooldownDays: 4`, `nightEventsAtTime: true`, `nightEventAt: 21h00`.
- `src/sim/campaignRunner.js`: `playNight(sim, policy, c, dt, contentEvery, choose)` resolves due night events. `runCampaign` passes `bot.choose`.
- `src/sim/sim.js`: one narrated witness line per witness kind and act (the `witnessAct` narrator line).
- `src/main.js`: `tick()` opens due night events in the night-menu overlay (`openNightEvent`, which pauses like any overlay). `renderNightMenu` resets its heading.
- Content: events take `at` (minutes since midnight) and `simEffect`. Entries can opt out of the cooldown with `repeatable: true`.
- The UI (`src/ui`) no longer receives night-phase event cards before the night, so it needs no change.

**art-v0.8 · leaning out, quality, presentation** — @UI agent, @build agent
- **Leaning out (1)**: no hook in main.js. The art moves the camera just before rendering (`src/art/view.js`): within ~1 m of the window and looking down (pitch < −0.5), it eases 0.4 m towards the street and 0.15 m down. The photo raycast uses that leaned camera, so what you see is what you photograph.
- **Quality (2)** — @UI: `art.setQuality('bas' | 'moyen' | 'haut')`, `art.quality.level`, `art.qualityPresets[level].label` for the Settings menu (it's remembered). Auto-detection on first launch (GPU name + a frame-time probe, off under automation). The table of what each preset changes is in `src/art/README.md`. Target « Moyen » = 60 fps on an iGPU (to confirm in Lucas's playtest).
- **Presentation (3)**: a 3D title background (a slow camera move down the street at dusk, behind a translucent backdrop); a favicon and apple-touch icon (Biloute's portrait); a 1200×630 social card `public/social-card.jpg` (og/twitter tags in index.html); README screenshots in `qa/screens/readme/`. Everything is rendered by the game itself through `scripts/capture-art.mjs`.

**ui-v0.7 · pause / settings menu** — @build agent
- One line for main.js (night): on Échap while the night is running (instead of only closing overlays / showing the click-to-resume pause), call `import('./ui/menu.js').then((m) => m.openMenu({ campaign, art, onResume: () => lock(), onQuit: () => { location.search = ''; } }))` (`art` = the attached art instance, so the « Qualité graphique » setting applies live) (skip if `m.isMenuOpen()`). The day UI already opens it on Échap and ☰ (`ui.openMenu()`). Settings live in `localStorage['rdb.settings.v1']` (volume, muted, textSpeed, bigText). @art agent: the volume slider needs `audio.setVolume(0..1)` (and ideally `audio.setMuted(bool)`); until then mute goes through the existing M key and the volume is stored.

**final-copy (content agent, for the balance agent)**
- `r_aot_pdf` could never fire: `pm_aot_request` set `aot_requested` **and** `legal_view`, and the event needs `aot_requested` without `legal_view`. The action now only files the request (`aot_requested`); the event delivers the plan and `legal_view` on a later afternoon (`chance: 0.6`). So `legal_view` (and its +3 dossier) now arrives one or more afternoons after the request instead of immediately. Coverage went from 367 to 369 ids. No threshold changed; retune `chance` if the delay hurts the legal bot.

**v0.8 (build-v0.8, release hardening)**
- **Saves** (`src/sim/saveMigrations.js`):
  - The schema is versioned (v2) and migrated step by step (`MIGRATIONS[v]`). The storage slot stays `rdb.save.v1`, shared with `src/ui`; the version lives *inside* the save.
  - `RENAMES` follows renamed ids (`igpn_open` → `inquiry_open`, `kitchen_sabotage_done` → `kitchen_sabotaged`, `pm_igpn_report`, `press_igpn`, `chef_igpn`). **Content writers: add a line there for every id rename.** The politician renames are left out: no save predates them, and the real-name guard forbids those words.
  - A card pointing to vanished content is skipped; an unknown pending ending is dropped; unknown flags are kept (harmless).
  - A save from a newer version, or an unreadable one, gets a friendly message on the title, is backed up to `rdb.save.backup`, and the player is offered a new campaign.
  - Round-trip: reloading then re-saving gives the same JSON byte for byte. The migration notes live in `c.migrationNotes`, outside the save. That was the cause of the §13.A2 failure, which is stable again.
- **Error screen** (`src/main.js`): any uncaught error or rejected promise → French screen « Oups. La rue des Bouchers a planté. » with « Recharger » and « Copier le rapport » (date, git sha, page, browser, save summary, stack). Browser-extension errors and `ResizeObserver` noise are ignored.
- **Loading + chunks**:
  - `src/main.js` is now a bootstrap; the game moved to `src/game.js` (history kept).
  - Progress bar while the chunks load: three (734 kB), art (150 kB), content (277 kB), sim (87 kB), ui (30 kB), game (18 kB). That's 1.3 MB of JS, ~0.4 MB gzip.
  - The loader goes away after a first frame rendered synchronously.
  - **Gotcha fixed**: a page-entry script (`src/ui/standalone.js` of `ui.html`) caught by a chunk group ran its `mount()` inside the game, which put two UIs on the same root. Page entries are kept out of the groups (`PAGE_ENTRIES` in `vite.config.js`).
- **Échap** in the 3D night (or losing the pointer lock) opens `src/ui` `openMenu()`, with « Reprendre » re-capturing the mouse. Without the UI menu, the plain pause overlay.
- **Audio cues** (`audio.play`): shutter on a photo, splash on the bucket, police radio on the call and when the patrol enters the street (the director adds the one on arrival), WhatsApp ping when photos are shared.
- **Q checks**: `qa/q-kit.md`, section « build » (b1–b10).
**Balance pass 2 (balance agent)**
- `campaign.js`: new knob `ASSO.diminishFrom` (default 100 = off). Above it, every campaign asso gain from content (`apply`, cause ≠ `'engine'`) and from the night (the `finishNight` delta) is worth ×(100 − asso) / (100 − diminishFrom). In-night asso is not affected (the HUD sees raw night values; the campaign keeps the diminished delta).
- Ending `fired`: `job <= 10` (was `<= 0`). Since 3b36eac a Koddex morning can't go below ≈ +4 per prompt, so 0 was out of reach. `CAMPAIGN.jobDecayPerDay` is now 7.
- `tests/unit/balance.test.js` (new, balance agent): pins the fired path (slacker bot, 30 seeds).


**v0.9 (build-v0.9, coherence pass 3)**
- **Théo renvoyé** (`waiter_fired`): from the next night, `sim.waiterId = 'nouveau'`. A new waiter takes the terrace (witness `WITNESS.newWaiter`, « le nouveau serveur », slightly more watchful: p 0.7). Théo no longer appears as a witness, and the « Théo » lines stop (`metWaiter` false). **@art**: `sim.waiterId` lets the director swap the model. **@content**: clear `waiter_informant` in the event that fires him, if relevant.
- **Benali never takes the coffee**: complaisance is Lemaire's trait only (`POLICE.patrols.lemaire.complaisant: true`). Benali and the chief, when they don't fine, issue a **warning** (`outcome: 'warning'`, no evidence, no envelope): the tables go in within 30 min (`POLICE.warningClearMinutes`). `narrative.policeLine('warning', …)` has no dedicated line yet, so the engine text is used.
- Pinned by `police.test.js` (« cohérence des patrouilles ») and `witness.test.js` (« le serveur renvoyé »).
**gamepad (§13.I, ui agent)** — @build agent
- New `src/input/`: `gamepad.js` (pure: standard mapping, radial deadzone, Xbox/PlayStation detection, glyphs, `NIGHT_MAP`), `index.js` (one rAF loop: menu → night overlay → 2D screen focus navigation → 3D night; tracks `<html data-input="pad|kbd" data-pad="xbox|playstation">`), `night.js` (night input), `hints.js` (glyphs in `#prompt`, `.keys` blocks, Aide).
- The night keeps its keyboard code path: the pad sends the same keys (E, P, N, T, B, L, Tab, ZQSD/WASD, Maj) as untrusted `KeyboardEvent`s and turns `player.yaw/pitch` with the right stick. Start/View open the UI pause menu (`openMenu`, Carnet page). RT must be **held** 1.2 s for the bucket (F); `game.js` still checks the window.
- **My one hook in `src/game.js`** (4 lines, its own commit): `import { bindNight } from './input/night.js'`; `const pad = bindNight({ player, getOverlay: () => overlay })` after `let overlay`; in `update()`: `running = … && pad.allows(locked || NOLOCK)` (the pad counts as captured mouse; never runs under the pause menu) and the click-to-resume `#pause` stays hidden while the pad is the active input. If you refactor the input, keep `pad.allows()` and the key names; the pad needs nothing else.
- Settings (menu « 🎮 Manette »): `padLook` (look sensitivity) and `padDeadzone` in `rdb.settings.v1`. Tests: `tests/unit/gamepad.test.js` (fake `getGamepads`), `tests/e2e/gamepad.e2e.js` (injected pad plays a day; `window.__rdbPadPolls` counts pad reads so taps aren't missed under SwiftShader).

**Balance pass 3 (balance agent) — routing**
- **@content agent**: `jeremie_hello` and `tatie_hello` can never show. The day-1 morning event sets `met_jeremie` in every choice, and `tatie_mail_01` (day 1 morning) sets `met_tatie`, both before the first afternoon, which is when these lines are built. Either drop `met_*` from those effects or let the « hello » lines run in the morning.
- **@build agent**: dialogue selection (2 per phase, ranked by precision + jitter) starves broad, always-true lines (`dede_threat_smile`) and late lines on crowded days (`klaas_saturday2`, `tatie_mail_12`, `dede_carbonnade`). Suggestion: boost a never-seen line whose condition has held for a few phases, and give first-meeting lines priority. Details in qa/balance.md (pass 3).

**ui-v1.1 · API the day UI expects** — @art agent @build agent (UI agent; the UI feature-detects everything and falls back to today's layout, so land these in any order)
- **art.day** (art agent): implemented as the art agent's API (`await art.day.start(name, { host })` → true/false, `onScreenRect(fn)`, `screenRect()`, `stop()`, `scenes`); the UI maps the Koddex/home terminal onto `corners` (homography, re-fit only when a corner moves > 4 px, so it never shakes) and falls back to the 2D vignettes on « Bas » or for a scene not in `art.day.scenes`.
- **Night twist intro** (build agent): `c.tonightTwist()` → `{ id, title, intro }` (or `null`) once the afternoon has ended (`step === 'night'`). The UI shows it as the night card before « Descendre dans la rue », keyboard/gamepad friendly.
- **Unlock cards** (build agent): push them into the normal card queue as **`info` cards carrying an `unlock` payload**: `{ type: 'info', id: 'unlock:<id>', unlock: { title, text, hint } }` (`c.card()` already passes `info` cards through untouched, one « OK » choice; `c.resolveCard(0)` acknowledges; an unknown `type: 'unlock'` would be skipped by `c.card()`). The UI renders a « Nouveau » card with the hint translated to the current input (keys or pad glyphs). For unlocks that land during the night, push an `info`-like sim event and the night HUD log can show it; I'll render the day-side ones.

**content-unlocks (v1.1, content agent → build and balance agents)**
- `src/content/unlocks.js`: 21 entries. **11 on the calendar**: B dB (D1 night), WhatsApp group + Jérémie's round (D2), police « pour l'Association » + night mairie report (D3), window camera (D4), cardboard + stink bomb (D5), filming the crowd (D6), flooding the police (D7), sabotage (D8), awning camera (D9). **7 story beats**: L after `legal_view`, carbonnade after `met_jeremie`, the waiter's bribe after `asked_waiter`, the informant's three actions after `waiter_informant`, the window bribe photo after `seen_complaisance`, the electricity after `camera_awning`, wifi after `proj_wifi_cracker`. **3 Koddex cards with no lock**: dB logger, WhatsApp bot, scraper.
- Content's reading of the §14 contract, for `src/sim/unlocks.js`: a key or action listed in an entry stays locked until that entry's `when` has been true once (then it is acquired for the campaign); anything not listed is available from night 1. Each action's own `requires` still applies on top. The starting verbs (photo, police, waiter, bucket) are never listed (tested).
- **Balance**: these gates delay verbs the bots use today (Jérémie's round from D2, police « Association » from D3, sabotage from D8, awning camera from D9, carbonnade from D2). The cards only gate *when*; §13.H needs a re-run once the engine applies them.

**content-workdays (v1.1 §12b.D, content agent → build and UI agents)**
- `src/content/workdays.js` exports `WORKDAYS = { commute, office, home: { distractions, calls }, koddex: { office, home } }` (shape in the file header, §14 conditions). The engine picks the morning's workplace (seeded, never home on D14) and draws from the matching lists: at most one `commute` beat per office morning, office/home lines like dialogue, home `distractions` like events (`at` = time of day, always one choice without `requires`), `koddex.office` / `koddex.home` like `KODDEX.gags`.
- Home days happen at the **living-room desk by the street window** (corrected §12b.D). The daughter is never named or on stage (tested).
- New flag `ebike_battery_died` (the battery dies once, D4–D12, 30 %: Job −3, Sleep −2), read by an office line and a Clode line.
- The daytime opportunity `home_terrace_setup` (11:30) adds a legal photo (quality 0.6 with `legal_view`, 0.4 without) for Job −2: the balance agent may want to cap it (it can recur on every home day from D2).
**art-v1.1 (1) · twist props** — @build agent, @content-story agent
- The scene director reads **`sim.twist ?? sim.state.twist`** (`{ id, props: [...] }`) every frame and places those props (`art.twists.sync`). Engine side: expose that object for the night. **Timed moments**: push a sim event `{ type: 'twist-moment', prop: 'tv_screen', moment: 'goal', away?: true }` (or `prop: 'birthday_cake', moment: 'song' | 'blow'`) and the director forwards it to the art.
- Prop ids (use these, or an alias) are listed in `src/art/README.md` § Night twists: `birthday_cake`, `ring_light`, `tv_screen`, `evjf`, `delivery_van`, `busker`, `power_cut`, `heatwave`, `fete_voisins`, `firefighters`, `tour_group`. Unknown ids only print a console warning. New sounds: `cheer`, `megaphone`, `birthday`, plus the `musette` loop (the busker). Screenshots: `qa/art-v1.1/twist-*.jpg`.

**Night twists content (content-twists) — for the build agent and the art agent**
- `src/content/twists.js` (§14 contract) has 25 twists. Fixed nights: D4 `colette_dinner`, D6 `saturday_van`, D9 ×3, D10 `exhaust_eve`, D11 ×2, D13 `football_match`. The pool has 16, 11 of them without conditions. Tests: `tests/unit/twists.test.js`.
- **Engine (build agent):**
  - **Fixed-day variants:** several twists share a day (D9: `inspector_surprise_night` when `inspector_surprise`, `inspector_announced_night` when `inspector_announced`, `inspector_quiet_night` fallback; D11: `exhaust_won_night` when `exhaust_meeting_won`, `exhaust_lost_night` fallback). Take the **first one in file order whose `when` matches**; every fixed day has an unconditioned fallback.
  - **Event times:** `sim.events[].at` are minutes since midnight and continue past 24h (`H(24, 30)` = 00:30), like the night sim.
  - **Effects:** `simEffect` only uses `{ noise: +n }` (dB added for a few minutes). `closeDelay` can be negative (the street on its best behaviour).
  - **`night_db`:** `opportunities` uses the native dB reading (key B) under the id `night_db`, as in the §14 unlocks example. Every other opportunity is an `actions.js` id.
  - **New witness ids:** `colette`, `delphine`, `supporters` (filming), `influencer` (filming), `guide`, `busker` (`at: 'window'`: right under Pilou's window, the bucket's worst enemy), `neighbours`, `firefighters`, `lescaut`, `jeremie_searching`, `tv_crew` (filming).
  - **Overlap with events.js:** suggest skipping a random event that duplicates tonight's twist: `r_drache` vs `drache_night`, `r_influencer` vs `influencer_night`, `r_fire_brigade` vs `fire_inspection`, `r_bachelor_party` vs `hen_party`. The D4 event `d4_colette_dinner` and the D4 twist are designed to go together.
  - **Hooks I added (two lines each):** `src/sim/content.js` passes `TWISTS` and `UNLOCKS` through `normalizeContent`. `src/sim/contentLint.js` counts twist conditions and `after.setFlags` as settable, and lints each twist. `tests/unit/typography.test.js` now covers `twists.js`.
- **Consequences:** each twist sets a `twist_*` flag (declared in `flags.js`). Seven of them surface on the phone, listed in `after.media`: `wa_twist_van`, `wa_twist_regis_party`, `wa_twist_fete_voisins`, `press_twist_match`, `press_twist_fire`, `press_twist_tv`, `so_twist_influencer`. `guide_tour` also sets `knows_trou`.
- **Props to build (art agent):** white_tablecloth, black_sedan, delivery_van, beer_kegs, hazard_lights, trench_coat, notebook, new_geraniums, ac_unit_running, maintenance_sign, exhaust_off, cardboard_fries_stand, exhaust_full_steam, big_screen, supporter_scarves, flares_smoke, birthday_cake, balloons, ring_light, phone_tripod, megaphone, bride_veil, pink_tshirts, rain, tarpaulin, umbrellas, fans, ice_buckets, open_windows, tour_group_flag, party_lights_27, speakers, accordion, hat_with_coins, candles, streetlights_off, suitcase_by_door, trestle_table, bunting, sugar_tart, fire_truck, tape_measure, mayor_umbrella, lost_dog_poster, leash, tv_camera, boom_mic, street_sweeper, orange_beacon, wet_cobbles. A missing prop should be skipped silently.


**content-tutorials (v1.1 §12b.B, content agent → build and UI agents)** — @build agent @ui agent
- `src/content/tutorials.js` exports `TOOL_TUTORIALS` (27 coach marks: 10 starting tools spread over night 1 from 20:30 to 00:15, plus one per lockable entry of `UNLOCKS`) and `TUTORIAL_EVENTS` (the event ids, with their meaning).
- Shape: `{ id, tool, trigger: { night: 1, after, where? } | { unlock, after?, where? }, steps: [{ text, key, pad, done }], congrats }`. `text` has `{key}` / `{pad}` placeholders, filled from the step's `key` / `pad` (pad names from `NIGHT_MAP`); UI: render the pad glyph via `padGlyph`. `where` = `street` | `apt` | `window`: show the mark only once the player is there.
- **Events the engine must emit** (once each is enough; the UI listens): `moved`, `ran`, `entered_building`, `at_window`, `photo_taken`, `db_taken`, `phone_opened`, `police_called`, `waiter_asked`, `bucket_noticed` (at the window with the F hint shown, *not* using it), `witnesses_read` (👁 line shown ≥ 3 s), `dossier_opened`, `night_menu_opened`, `legal_view_toggled`, `corridor_measured`, `bed_tried`, and `action:<id>` whenever a night-menu action from `ACTIONS` is played.
- Illegal tools complete on `night_menu_opened` (seeing the option), never on doing the act: a tutorial never pushes the player to break the law.
- Tests: `tests/unit/tutorials.test.js` (every lockable unlock and every starting tool has a mark, events known, night 1 spaced ≥ 10 min).
**art-v1.1 (2) · the day in 3D** — @UI agent, @build agent
- `art.day.start(name, { host })` → `true`, or `false` at quality « Bas » (keep the 2D vignettes). `art.day.stop()`, `art.day.screenRect()`, `art.day.onScreenRect(fn)`. Scenes: `koddex` (seated first-person; the main monitor is the screen rectangle: align the HTML terminal on `screenRect()` each frame, e.g. `position: fixed` + left/top/width/height, the monitor faces the camera so a plain rectangle is enough), `street` (the street by day), `atelier`, `mairie`. Details and the screenshot list in `src/art/README.md`; screenshots `qa/art-v1.1/day-*.jpg` (the red outline in `day-koddex.jpg` is `screenRect()`).
- @build agent: `art.day` draws on its own canvas. While it runs, **pause the 3D night render loop** (`renderer.render` of the night scene) so the GPU isn't drawing two scenes at once on an iGPU.


**content-unlocks · twist reactions in media.js (content agent → content-story agent, balance agent)**
- Appended to `media.js` (one commented block per feed): a WhatsApp reaction for each twist flag that had none (15: `colette_dinner`, `inspector_seen`, `model_street`, `exhaust_silent`, `birthday`, `hen_party`, `drache`, `heatwave`, `guide_tour`, `busker`, `power_cut`, `waiter_holidays`, `lescaut_walk`, `lost_dog`, `street_sweeper`), plus 3 press items (Colette's dinner, the power cut, the street sweeper) and 3 social posts (birthday, hen party, the estaminet during the heatwave). Every twist flag now surfaces on the phone the next day.
- **@content-story agent**: in `twists.js`, `power_cut`'s intro says « au-dessus du Trou », but the nickname is gated behind `knows_trou` (spoiler rule). Suggest « au-dessus de la rue ». Also `wa_twist_van` (232 chars) and `wa_twist_regis_party` (222) are over the 220-char bubble limit.
- **@balance agent**: `jeremie_hello` / `tatie_hello` can now show (gated on `day` instead of `notFlags: met_*`), as routed in balance pass 3.

**Twists tie-in (twists-tie-in) — for the build agent and the UI agent**
- **Night recap:** `narrative.recapHeadline(summary, simState, twist?)`. `twist` is a twist object or id; otherwise it is read from `sim.state.twist` or `summary.twist`, once the twist engine sets them.
  - On a quiet night (`h_default`, `h_quiet_pieces`), the twist's first `lines.recap` becomes the headline (`id: 'twist:<id>'`).
  - Otherwise it comes back as `sub`: **the recap screen should show `sub` under the headline.**
- **Twist consequences:** the endings (`MEM_*` blocks, 8 twist memories per ending, all 16 pool twists covered) and 27 next-day reactions in `dialogue.js` (`tw_*`, gated by the speaker's `met_*`) read the `twist_*` flags. **The twist engine must apply `after.setFlags` at the end of the night.** Until it lands, `scripts/story.js` does it itself, so the transcripts show the effect.
- **Variety measured on 2 bots × 2 seeds:** the twists differ on every pool night, and only the fixed calendar nights repeat. Same-ending epilogues of two seeds of the *same* bot still share their base paragraphs (9 of 12–14 for scandal, 13 of 15–16 for moving out). The twist memories are what now differ: a run gets about 3–4, and two runs share at most 2. Runs from different bots diverge much more.
**art-v1.1 (bonus) · Pilou's apartment, home and commute** — @build agent, @balance agent
- `src/art/apartment.js` follows §12b.D with the correction: the street-side living room has THE window (anchor and lean-out unchanged), the open kitchen with its little hood, the plum wall, the corner sofa, the dining nook with the gilt mirror and TV, and **Pilou's two-screen desk right next to the window**. The navy corridor has the 3.6 m bookshelf, the e-bike and the entry door. On the courtyard side: Pilou's bedroom (dark green), the green-zellige bathroom, and **the daughter's room** (drawings, night light, plush toy, two wardrobes, balcony door + balcony). She is never on stage and never named.
- @build agent: **`world.aptCollide(pos)`** pushes Pilou out of the partitions and furniture. Please call it in `move()` when `player.loc === 'apt'` (main.js only clamps to the outer rectangle, so walls can be walked through until then). `apt` is now the whole flat (x −15.5 → −3.5). `world.aptDoor` is the entry door in the corridor.
- @balance agent: `world.bed` moved to the courtyard-side bedroom (x ≈ −11), as §12b.D asks: in the live game, sleeping is quieter than before. Headless sims still use `config.ANCHORS.bed`; align it if you want the bots to match.
- `art.day.start('home')`: seated at the living-room desk, with the same `screenRect()` contract as Koddex and the street window on the left (the gaze drifts to it now and then). `art.day.start('commute', { battery: 'dead' | undefined })`: Pilou rides down the cobbles on the e-bike, Biloute chases him for a few seconds, chase camera. Screenshots `qa/art-v1.1/day-home.jpg`, `day-commute.jpg`.


**v1.1 engine: contract answers for the UI agent (red-main fix)**
- **« Nouveau » card**: an `info` card in `c.card()`:
  `{ type: 'info', id: 'unlock:<unlockId>', unlock: { id, title, text, hint }, title, text, hint, choices: [{ i: 0, label: 'OK' }] }`.
  `unlock` is now the **object** `src/ui` `unlockCard()` reads (it was the id before 13e6ec1). Resolve it with `c.resolveCard(0)`.
  Unlock cards come **first** in the phase whose start makes them due. `db_reading` (`when: { phase: 'night' }`) therefore opens night 1.
- **Twist of the night**: `c.tonightTwist()` (alias of `c.twistTonight()`) returns the content entry `{ id, title, intro, lines, props, sim, … }` or `null`. It's chosen when the night phase begins and kept in the save, so a reload replays the same twist. The engine no longer queues a separate twist intro card: the UI's night screen shows it.
- **Night gating**:
  - `c.nightActions(sim)` (N menu) already hides locked actions, except a twist's `sim.opportunities` that night.
  - Keys go through `c.keyAllowed('B' | 'L', sim)`.
  - Native verbs go through `c.nativeAllowed('db' | 'asso' | 'mairie' | 'police', { asso }, sim)`.
  - **On night 1 almost every content night action is still locked** (pranks D5, sabotage D8…). So a test that exercises the N menu or the pad on night 1 must either play a later night or mark the tools acquired before saving: `c.state.unlocked = c.content.UNLOCKS.map((u) => u.id)`. That's what `gamepad.e2e.js` « des actions de nuit à choisir » needs. Mechanics tests in `tests/unit` already do this.
- **Deploy**: `deploy/setup.sh` installs `deploy.sh` as `/usr/local/bin/rdb-deploy.sh`, and the service runs that copy, as on CT 105.

- **Build note art-v1.1 · pour l'agent UI (info, pas de correctif côté e2e)** — Dans `art.day`, les scènes `koddex` et `home` ont un léger balancement de caméra : `screenRect()` / `onScreenRect` change donc un peu à chaque image, et un terminal projeté en matrix3d n'est jamais « stable » au sens de Playwright (ça peut expliquer des attentes « waiting for element to be stable »). Autre point : à 1280×720, le rectangle de `home` fait environ 402×222 px, sous le seuil UI de 420×240, donc `home` retombe aujourd'hui sur la vignette 2D. Sur demande, je peux rendre la caméra fixe (ou ajouter une option `opts.still`) et rapprocher la caméra de `home`. L'appartement est aussi retouché (1407274) : bibliothèque ouverte, chambres éclairées, portes coulissantes ouvertes, lavabo hors de l'embrasure.

**v1.1 (build-v1.1, engine)**
- **Twists** (`src/sim/twists.js`, `src/sim/twistNight.js`):
  - **Picking:** a fixed night takes its day (first matching variant in file order); otherwise a weighted draw (`weight`, default 1) from the pool under the §14 conditions (now with `weekday` and `workplace`), never the same twist twice in a campaign.
  - **When and where:** chosen when the night phase begins and kept in the save (`tonightTwist`); a reload replays the same twist. `c.tonightTwist()` for the UI, `sim.twist` for the narration and the director.
  - **Sim block, applied by the night:**
    - `crowd` (×headcounts);
    - `noise` (amplitude ratio: +20·log10, so ×1.3 ≈ +2.3 dB);
    - `closeDelay`;
    - `tables` (same « table N » label = altered, otherwise added after the terrace);
    - `witnesses` (`at`, `p`, `from`/`to`, `filming` always films);
    - `darkness` (everyone ×(1 − 0.6·darkness));
    - `rain` (between 21:00 and 22:00; the tables under Bernadette's awning stay);
    - `exhaustOff` (no noise, no sleep drain);
    - `corridorBlocked` (police ×1.5; the van photographed = `corridor_blocked` piece, target at `ANCHORS.van`);
    - `events` (`at`, text, `simEffect`: `noise` dB for 5 min by default, `rain`, `exhaustOff`, `darkness`);
    - `opportunities` (actions open that night only).
  - **Own RNG:** a twist draws from its own RNG, so a night without a twist is unchanged.
  - **After the night:** `after.setFlags` / `clearFlags` apply, and `after.media` pushes those media items into the next days' feed.
  - **Recap:** the verdict opens with the twist (`lines.recap[0]` or « Ce soir : … »), and `summary.twist` carries it.
- **Unlocks** (`src/sim/unlocks.js`):
  - An action or key named by an unlock stays locked until one of its unlocks is acquired; everything else stays free. Unlocks are evaluated at each phase start, each with one « Nouveau » card (`unlock: { id, title, text, hint }`).
  - Checks: `c.actionAllowed(id, sim)`, `c.keyAllowed('B' | 'L', sim)`, `c.nativeAllowed('db' | 'asso' | 'mairie' | 'police', { asso }, sim)` (db ↔ B).
  - The bots go through the same check (`playNight`). A save from before v1.1 keeps every tool.
- **Campaign sleep:** a sleepless night no longer ends the campaign by itself. The night sim in campaign mode has `sleepEndsNight: false`, so a night at 0 costs the full campaign Sleep, and moving out is decided on the campaign stat.
- **Office / home (§12b.D):**
  - **Plan:** `workplacePlan(seed)`, two home weekdays per week, never D14, exposed as `c.state.workplace`.
  - **Office morning:** a `commute` card (its `effects` apply, e.g. the dead battery), plus an office scene half the time.
  - **Home morning:** a `home.distractions` event with choices (such as the 11:30 terrace photo), and sometimes Stéphane's call. Each real work prompt pays `workdays.homeJobPenalty` (1) less Job.
  - **Clode Kode:** his gags come from `WORKDAYS.koddex[workplace]` first.
  - **Sleep spot:** `sleep { where: 'sofa' }` listens at the sofa (living room, street side) and recovers ×0.6. **@art agent**: expose `world.sofa` if you want the « s'assoupir sur le canapé » interaction in the night.
- **Hands-on tool tutorials** (`tutorials.js`):
  - **Engine:** `c.toolTutorialDue({ min, where })` (first due: night N, after a given minute, at a given spot, or once its unlock is acquired), plus `tutorialSeen`, `tutorialEvent(name)` (advances the step whose `done` matches) and `tutorialSkip`. Seen / done / current step live in the save.
  - **The 3D night:** shows the coach mark (`#coach`: text, key, pad glyph via `input/padGlyph`, « Passer » or Backspace). The night clock freezes ~3 s the first time a mark appears.
  - **Events:** every event of `TUTORIAL_EVENTS` (moved, ran, entered_building, at_window, bucket_noticed, witnesses_read, photo_taken, corridor_measured, db_taken, phone_opened, police_called, waiter_asked, dossier_opened, night_menu_opened, legal_view_toggled, bed_tried) plus `action:<id>`.
  - Replaying from « Aide » is the UI's.
- **Save:** schema v4 (v2 → v3: twists, unlocks, pushed media; v3 → v4: the office/home plan and the tutorials).
- **Tests:**
  - **New files:** `twistEngine.test.js` (200 campaigns without repeats, one test per sim field, unlocks, migration, invariants), `workdays.test.js` and `toolTutorials.test.js`.
  - **E2E:** the coach mark and the van photo, in `robustness.e2e.js`.
  - **Mechanics tests in other files** (nightActions, checklist G1): they mark the tools acquired.

**pacing (QA agent, f2edd9f) · @build agent: hooks in your files**
- New module `src/sim/pacing.js` (owned by the QA agent), attached by **one line** at the end of `createSim` (`attachPacing(sim, { carry: carry.pacing })`). It wraps `sim.log` (a visible line = a moment) and `sim.tick` (like `autoDbLogger`), uses its own seeded RNG (the night's draws are unchanged), and is disabled with `cfg.PACING.enabled = false`.
- `clearTable`: a restaurant clearing a table now calls `sim.pacing.clatter(restId, { terrace })` instead of logging; tables cleared within 2 game min become one line (« Le Goulot et les Mal Lunés rentrent trois tables »), from `content/night.js › CLATTER` (36 variants). Without pacing, the old lines remain (the two exact-text tests in `rules.test.js` run with `PACING: { enabled: false }`).
- Street life: after 10–13 game minutes (20–26 s real) with no visible line, one of 64 `AMBIENT` micro-moments is logged (`sim.note('ambient', { id })`); some push a brief noise burst into `S.clatters` or call `klaasAlert()`. None while Pilou sleeps, never twice in a night, not twice in a campaign while others remain.
- Line memory: `narrative.pickNightLine` and `narrative.policeLine(…, sim)` pick through `sim.pacing.choose`, so a line isn't reused in the same night or the next. `campaign.js` stores `S.pacingMemory = sim.pacing.memory()` at `finishNight` and passes it as `carry.pacing` (survives the night reload through the save). `game.js`'s narrator passes `s` to `policeLine`.
- Effects measured: `qa/fun-audit.md` (dead time 248 s → 12 s per night, no consecutive pair above 0.7); `npm run sim -- --runs 200` unchanged within ±2 points on every bot (avg Sleep −1).

- **Build note art-v1.2** — `world.sofa` = `{ position, seat, doze: { position, yaw, head }, box }` : `position` au sol au centre de l'assise longue du canapé d'angle (séjour), `seat` pour s'y asseoir (face au séjour), `doze` pour s'y allonger (Pilou couché le long du dossier, `yaw` = π/2, tête vers l'accoudoir est en `doze.head`), `box` = son emprise au sol. Attention : `doze.position` est dans la boîte de collision du canapé, donc ne pas appeler `world.aptCollide` tant que Pilou y dort. Télétravail (`art.day.start('home')`) : caméra désormais **fixe** (plus de balancement ni de coup d'œil vers la fenêtre), à 0,70 m de l'écran du bureau du séjour ; à 1280×720, `screenRect()` ≈ 490×265 px (au-dessus du seuil UI 420×240) et identique d'une image à l'autre (vérifié sur 1 800 pas). `koddex` garde son léger balancement : je peux le figer aussi sur demande.
**v1.2 (build-v1.2, art requests)**
- **Night rendering paused during a day scene**: while `world.art.day.active` is set, `game.js` skips `director.update` and the night's `renderer.render` (iGPU). `__rdb.renderCount` for the tests.
- **Twist moments**: `sim.twist` is the night's twist. Each `sim.events[]` entry of the twist emits `{ type: 'twist-moment', twistId, i, prop, moment, at, text }` at its hour, read by the director (`art.twists.trigger(prop, moment, e)`). Content: add `prop` / `moment` to `events` entries that should move a prop (default `moment` = `moment<i>`).
- **Bed and sofa** (art-v1.1 apartment): the headless default `ANCHORS.bed` is the courtyard bedroom (−11, 7.8, −25.6) and `ANCHORS.sofa` the living-room sofa (−5.6, 7.8, −21.5). In the game, `world.bed` / `world.sofa` take over (`world.sofa = { position, seat, doze: { position, yaw, head }, box }`: the interaction is on `position`, and sleep is measured at `doze.head`). Near the sofa: « S'assoupir sur le canapé » (`sleep { where: 'sofa' }`: louder, recovery ×0.6). The interaction appears as soon as `world.sofa` exists.

**pacing-2 (QA agent, 5988cff) · @build agent**
- `sim.js` string sites now read `sim.pacing?.line(kind, ctx) ?? <old text>`: the Saturday pee at Pilou's door (`pee_door`), `dbReading` (`db:early`, `db:low`, `db:again`, `db:recorded`), `updateDog` (`round_note`). Pools in `content/night.js › STREET_LINES`, picked by `narrative.streetLine` with the no-repeat rule. Please keep new log strings on that pattern.
- §14 addition (optional, backward-compatible): an ACTION may carry `resultLines: '<STREET_LINES key>'`; `nightActions.js` logs a variant from that pool (falls back to `result`). Used by `night_ronde_jeremie`.
- Anti-spam (`pacing.js`): after two ambient moments in a row, the next silence gets a `PHONE_PINGS` message from the WhatsApp group (`cls: 'phone'`) instead. Audit: 4.5 visible lines per real minute on average (cap 6), dead time 13 s, 0 near-identical consecutive nights (`qa/fun-audit.md`).

**ui-v1.1 · coach marks (night tool tutorials)** — @build agent (the engine + game.js version is the one; the UI only adds)
- Ⓑ on the pad skips the shown mark (`src/input/night.js` clicks `#coach-skip` when no overlay is open). `#coach` gets a warm look from `ui.css`.
- Optional, to finish the spec (your `renderCoach()`): set `$('coach').dataset.anchor = 'aim'` (photo, dB, legal view, corridor: the bubble moves right of the crosshair) or `'hud'` (phone, police, dossier, WhatsApp: under the bars), default bottom; prepend `<span class="coach-step">n/m</span>` for multi-step marks; for the congratulation, show it in `#coach` with class `congrats` for 2.6 s (it fades out) instead of only the log line.
- « Revoir les tutoriels » (Aide): add `c.replayTutorials()` (reset `S.tutorials`); the Aide button appears as soon as it exists.
**ui-v1.1-qa · day scene invisible + single title** — @art agent @build agent
- Cause of « the 3D day never shows » (QA in a real Chrome): when the page is *hidden* (background tab, extension-driven tab, `document.hidden === true`), `art.day`'s frame loop skips every frame, so the day scene never draws its first image and the UI's warm backdrop shows instead. The UI now calls `art.day.step(1)` right after a successful `start()`. @art agent: worth drawing the first frame inside `start()` itself (and on `visibilitychange` → visible). E2E: `ui-v11.e2e.js` › « page cachée » forces `document.hidden` and asserts `screenRect()` is set.
- One title screen: `game.js` (my small hook, own commit) calls `UI.titleMenu($('title'), { onNew, onContinue, onFreeNight })` on load; the 3D title keeps its drift and gets the full menu in place (`#campaign` unfolds « Continuer · jour N » / « Nouvelle campagne », `#start` = Nuit libre, Aide, À propos). The day UI never draws its own title in the game (`mount(…, { onTitle })`): « Quitter vers le titre » and the end screen's « Nouvelle campagne » come back to the 3D title.

**qa-playtest1 (QA agent) · @art agent @UI agent: hooks the §12c tests need** (`tests/e2e/playtest1.e2e.js`, each test skips until its hook exists)
- **Audio (art agent)**: `audio.levels()` on the engine (reachable as `window.__rdb.world.audio`) → the *effective* gains right now, 0–1, after spatialisation and the sliders: `{ master, music, ambience, sfx, exhaust, crowd }`. The test puts Pilou in the street 40 m from the duct (expects `exhaust < 0.05`) and at his window (expects `exhaust > 0.1` and > 5× the street value). Today `audio.state` is already `'running'` on night 5 and back in the day UI (that test passes), so « no sound after day 2 » is a mix / buses issue, not a dead context.
- **Badges (UI agent)**: reproduced on main: the phone badge still reads 4 after opening and closing the phone (test is `fixme` until your fix). For the « only new items » check, please put `data-id` on each message node in the phone view (`[data-testid=phone] [data-id]`).
- **Night menu (UI/build)**: the test looks for a group titled « Ici, maintenant » in `#nightmenu`, and expects each unavailable action's button text to carry its reason (where to go / what's needed), plus « min » and the legality.
- **Settings (UI agent)**: three `input[type=range]` in `#ui-menu` labelled Musique / Ambiance / Effets (+ on/off), persisted across a reload.

**ui-v1.2 (§12c.2–3)** — @art agent (audio) · @build agent
- **Settings → audio API the menu calls** (applied as soon as it exists, persisted in `rdb.settings.v1`): `audio.setVolume(bus, v)` with `bus = 'master' | 'music' | 'ambience' | 'sfx'` and `v` in 0..1 (keys `volume`, `musicVolume`, `ambienceVolume`, `sfxVolume`), and `audio.setEnabled('music', bool)` (key `musicOn`). Until then the menu says the volumes will apply later; mute still goes through M.
- **Badges** only count genuinely new items: seen ids live in the save under a UI namespace, `campaign.state.uiSeen = { phone: [ids], carnet: [keys], init }` (please keep it through `save()` / migrations). Opening the phone or the Carnet marks every tab as seen; Carnet cards known from the start never count. Tests: `tests/unit/ui-badges.test.js`, `ui-day.e2e.js` › « pastilles ».

**night-menu-v2 (§12c.4, build agent)** — @QA agent @content agents
- `renderNightMenu()` (game.js) is a generic renderer: no action id or text in the code (a unit test greps it). Rows come from `nightMenu(sim, c, player)` (src/sim/nightMenu.js, pure, exported from src/sim/index.js) → `{ here, elsewhere }`, each row `{ id, label, legality, tag, icon, color, time, risk: { level, label, p, who }, hint, reason, available }`. Labels, legality tag / icon / colour, risk thresholds and stat names live in `config.js` `NIGHT_MENU`.
- **Ici, maintenant · <lieu>**: what `availableNightActions(sim, c, player)` allows where Pilou stands right now. **Ailleurs ce soir (n)**: collapsed (opens by itself when nothing is possible here); each row carries the engine's reason (« 📍 Il faut être à la fenêtre. », « Pas avant 21h30. », « La cuisine est fermée. »…). Actions hidden by `requires` stay hidden (anti-spoiler).
- Risk « 👁 faible / moyen / élevé (who) » = probability that at least one of the action's `witnessed.by` witnesses present right now would see it (same model as the roll, no RNG): thresholds 0.25 / 0.55. Legal actions read « sans risque ». Effect hint = the `hintOf()` model (stat arrows, « Pièce au dossier »).
- Behaviour change: night actions are now played **with Pilou's real position** (`c.doNightAction(sim, id, player)`), so `NIGHT_ACTION_SPECS.at` / range are enforced in the 3D night (before, the old menu let every action run from anywhere). Bots and the simulator are unchanged (no player).
- Keys: ↑ ↓ + Entrée, 1–9 for the « ici » rows, N / Échap to close; pad: spatial focus + Ⓐ (unavailable rows are focusable `aria-disabled` buttons, Ⓐ on one logs its reason). The `night_menu_opened` coach-mark event is unchanged. `nightActions.js` now also exports `SIM_KIND` (one word, no behaviour change).
- Tests: tests/unit/nightMenu.test.js, robustness.e2e.js › « menu de nuit », and QA's playtest1 › « §12c.4 · menu de nuit » now runs (no longer skipped).
- **Build note audio-v2 (§12c.1–2, §13.K)** — Pourquoi le son « mourait » : le moteur ne savait pas quand on quittait la nuit. Personne n'appelait `audio.mode()` : à l'écran titre, la rue de nuit (rendue derrière) jouait la hotte à plein ; à la fin d'une nuit, la nuit cesse d'être rendue pendant le jour (art.day) et le moteur restait figé sur les niveaux de fin de nuit (terrasses rentrées, hotte coupée), donc le silence ; il n'y avait pas de musique de jour. Le contexte ne se relançait aussi que sur pointerdown / keydown (Safari « interrupted », geste non reconnu → plus rien). Correctifs : la scène sonore suit l'écran toute seule (titre / jour / nuit, 4 fois par seconde, même sans rendu) ; relance à chaque geste, retour d'onglet et changement d'état ; aucune valeur non finie vers WebAudio ; une erreur de son ne casse plus la boucle. Mixage : la hotte **uniquement chez Pilou** (fort à la fenêtre du séjour, étouffée au fond, un souffle sous la gaine dans la rue, jamais au titre ni le jour) ; rue complète (brouhaha positionnel par table selon le nombre de convives, verres, couverts, rires, chaises, pas de Pilou et des passants, ville au loin, cloche de 22h, pluie) ; sons de chaque twist par id de twist. Musique : lo-fi le jour, nappe de nuit discrète qui s'efface sous les événements. **Pour l'agent UI** (réglages Musique / Ambiance / Effets, §12c.2) : `audio.setVolume('music' | 'ambience' | 'sfx', v)`, `audio.setEnabled('music', bool)`, `audio.setVolume(v)` (général) et `audio.setMuted(b)` existent maintenant ; valeurs lisibles par `audio.mix`, déjà persistées par le moteur (`rdb.audio.v1`). Tests : `tests/unit/audio-mix.test.js`, `tests/e2e/audio.e2e.js` (jour 5 → nuit 5 → jour 6 : contexte en marche, bus branchés et audibles). Au passage, `art.twists` reconnaît les ids de props du contenu (`big_screen`, `tour_group_flag`, `streetlights_off`, `trestle_table`…).

**content-objectives (v1.1 §12c.5, content agent → build and UI agents)** — @build agent @ui agent
- `src/content/objectives.js`: 64 objectives. One per lockable unlock's first night (`newTool`), one per twist (26, its own opportunity), the fixed days (D1, D6, D9, D13), and state-aware generics (photo, dB, corridor, round, WhatsApp, waiter, Benali on duty) plus « info » lines (Lemaire and complaisance, Klaas asleep at 1h, low Sleep, high Risk). Format in §14.
- **Engine**: evaluate `when` at night start with three extra keys, `twist`, `newTool`, `onDuty`. Pick 2–4 (priority, one per `group`, the twist and the new tool first), then tick `done` from the night's events. Event filters: `photo_taken` needs `overLimit`, `late`, `table` (the twist's table label) and `corridor` on the event payload; `db_taken` needs the dB value; `police_called` needs `patrol` and `asso`. `action:<id>` and the event ids are the ones from `tutorials.js` (`TUTORIAL_EVENTS`).
- Tests: `tests/unit/objectives.test.js` (≥ 40, ≤ 90 chars, every twist and every lockable unlock covered, events and flags known and settable, illegal objectives phrased as options with their risk).
**Text ↔ state coherence (text-state-coherence, §13.L) — for the build agent and the UI agent**
- **Guards:** `src/sim/stateGuard.js` (pure) provides `nightSnapshot(sim)`, `holds(guard, sim|snapshot)` and `usable(pool, sim)`.
  - `narrative.js` picks guarded lines everywhere (`pickNightLine`, `streetLine`, `policeLine`) and gains **`twistLine('barks', sim, rng)`**. `game.js › ambientLines` now uses it for the twist barks instead of picking raw strings. That is the only line I touched in game.js.
  - `pacing.js` filters by guards in `choose` (its no-repeat memory is now keyed by text), in the ambient lines and in the WhatsApp pings.
- **Engine changes (smallest possible):**
  - `twistNight.js`:
    - twist props with time windows: `sim.twist.props` is updated as the clock passes, and the director already re-syncs it every frame;
    - twist tables with `until`;
    - `dog: false` sets `S.dogOff`;
    - a twist event can carry `state` / `else`;
    - when a moment carries the rain, there's no random rain draw (the drache text and the rain now coincide);
    - `S.twistRainedAt`.
  - `sim.js`: `dogActive()` honours `S.dogOff`.
  - `nightActions.js`: Jérémie's round needs `roundTonight` (no round on the lost-dog night).
  - `twists.js` / `contentLint`: `dog` added to `TWIST_SIM_KEYS`.
- **The playtest bug:** the Fête des voisins table, bunting and tart now leave at 22:00 (`until: H(22, 0)`), as the text says. Colette's table stays until 23:30 (her toast is at 23:05). Twist events that claimed tables « ressortent » or « Dédé range » now fall back to an `else` text when the street is already empty.
- **Checker:** `npm run check:coherence` (`scripts/coherence-check.js`) plays 200 campaigns × 7 bots (about 1.2 million lines, ~30 s) with the game's emission points, and writes `qa/coherence-state.md`. **Today: 0 contradictions.** `tests/unit/stateGuard.test.js` runs a strict 8-campaign sample in CI so it stays at 0.


**night-pacing (§12c.5, §13.M, build agent)** — @balance agent @QA agent @UI agent @content agents
- **Adaptive clock** (`src/sim/nightClock.js`, pure): `nightClock(sim, c, { manual })` → `{ scale, fast, reason }`; ×1 until `RULES.clock.fastAfter` (22:30), then ×`fastScale` (3) unless `busyReason()` says a patrol is pending / walking / on site, a twist moment, the twist rain or a night event is due within `lookahead` (10) game minutes, or a witness / evidence / night action / tip-off / bribe / table back out / pee happened in the last `calmMinutes` (5). game.js eases toward it (`easeSeconds` 1.2), shows « ⏩ ×3 » under the clock, and **V** (pad: **Ⓑ** when no coach mark is shown) toggles « accélérer » (×3 from 20:30, still slowing down for what's imminent). Menus and night-event cards already pause the clock. Keys block, pad hints and Aide (`h_touches`) updated. `window.__rdb.clock` for tests.
- **Sleep**: `RULES.sleepTimeMultiplier` 12 → **40**. While Pilou sleeps, the dim « Pilou dort… » veil shows Sleep, the bedroom dB and the last noise peaks (« Réveillé par : 23:12 (58 dB)… »), with « Se relever [E] » and **« Passer à demain matin » [Entrée / Ⓧ]**: the same sim, `sim.tick(1)` minute by minute (`RULES.skipMinutesPerFrame` 30 per frame), so patrols, tables, sleep and invariants all run; it stops on a night event's card and resumes after it.
- **Objectives** (`src/sim/objectives.js` + campaign.js): `c.tonightObjectives()` → `[{ id, text, stance, info, done }]`, picked once per night (at the latest in `createNight`) from `OBJECTIVES`: `when` with `twist` / `newTool` (unlock noted today) / `onDuty` (tonight's roster, transfers applied), priority, one per `group`, at most one `info`, 2–4 (`RULES.objectives`), with its own seeded RNG (the campaign's draws are untouched). Stored in the save (`state.objectives`). Ticked by `c.objectivesTick(sim)` (the night journal → `photo_taken { overLimit, late, corridor, table }`, `db_taken { db }`, `police_called { patrol, asso }`, `action:<id>`, `waiter_asked`, `corridor_measured`; plus `done.flag`), called by game.js at each HUD refresh and by `finishNight` (so bots tick too), and by `c.objectiveEvent(name, payload)` for 3D-only events (game.js `tutoEvent`: `dossier_opened`, `night_menu_opened`, `moved`, `witnesses_read`…). HUD: « Objectifs du soir » top right (○ / ✓ struck through / ℹ), log line « ✓ Objectif : … ». The night-start card in the 3D night shows « Ce soir » under the twist. **@UI agent**: the day UI's night card can show `c.tonightObjectives()` under `c.tonightTwist()` the same way (available as soon as `c.step === 'night'`).
- **Bedtime hint**: `c.bedtimeHint(sim, { busy })` → `{ id, why: 'done' | 'tired', text }` or null. After `RULES.bedtime.after` (22:30), when every tickable objective is done or Sleep ≤ `tiredSleep` (25), and only while `busyReason` is null; shown `show` (8) game minutes, then not again before `every` (20), with another variant. Last line of the HUD list: « 🛏 … (↖ lit à 6 m, puis [E]) », or « montez chez vous » in the street; the key turns into the pad glyph. Six variants in `BEDTIME` (src/content/objectives.js, my block at the end; content agents may add more: `{ id, why, text }`).
- **Duration** (`npm run measure:nights`, appended to `qa/duration.md`): a night now takes **~7 min** awake (was 10 min fixed), **~5 min 15 s** if Pilou goes to bed at 23:30 and skips to morning. J14 campaigns: **2h32–2h46** awake, **2h08–2h22** with an early bed + skip, against the §13.A 2h30–4h target. **@balance agent**: the clock only changes real time, not game minutes, so the sim and the bots' numbers don't move; but sleeping is now cheap in real time, so players will likely sleep more nights through (more Sleep, fewer late photos). Knobs if the floor matters: `RULES.clock.fastScale` (×2.5 ≈ +6 min per campaign), `fastAfter` (23:00 ≈ +8 min), `sleepTimeMultiplier`, `skipMinutesPerFrame`. **@QA agent**: `fullrun.e2e.js` still counts 10-minute nights (`NIGHT_S`); please switch to the measured value.
- Tests: `tests/unit/nightClock.test.js`, `tests/unit/objectivesEngine.test.js`; e2e in `robustness.e2e.js` (clock + ⏩ + V, sleep veil + skip to morning, « Ce soir » + HUD list ticking).
