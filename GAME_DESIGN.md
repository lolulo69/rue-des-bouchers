# Rue des Bouchers — Game Design

> Living document. Lucas and the design agent own this file; the build agent implements from it.
> **[OPEN]** = not decided. **[CHECK]** = Lucas to confirm against reality.
> The game targets realism + satire, with a light touch of Ch'ti humour (only when it lands).

## 0. Naming policy (public repo)
The **street is real** (rue des Bouchers, Vieux-Lille). **Businesses get fictional names that resemble the
real ones.** Never use a real restaurant name in code, assets, or text. Public figures are parodied under
altered names.

| Real (do NOT use) | In game | Notes |
|---|---|---|
| Estaminet La Ch'tite Brigitte (n°10) | **Estaminet La Ch'tite Bernadette** | Main antagonist, directly under Pilou |
| Les Bouchers Bien Élevés (n°14) | **Les Bouchers Mal Lunés** | Steakhouse next door |
| Bloempot (n°22) | **Bloemkool** | Flemish neo-bistro, the "chic" one |
| Bocal (n°33) | **Le Goulot** | Bistro, fish burger |
| L'Adresse (n°34 bis) | **L'Endroit** | |
| Truffe et Baguette (n°1) | **Truffe et Ficelle** | Street corner |
| Cup (n°3) | **Mug** | Takeaway, customers drink standing in the street |
| La Ripaille (n°4, closed) | **La Bombance** (closed) | Empty premises. Late-game threat: a new bar wants to open there |
| Martine Aubry (ex-mayor) | **Martine Aubrac** | Tatie Bouchon's contact. Sides with the restaurants |
| Current mayor (A. Deslandes) | **Arnaud Delandre** | Martine's successor, but **leans toward the residents** |
| Claude Code | **Clode Kode** | Pilou's work tool (wink) |
| Real neighbours Jérémy, Klaus | **Jérémie**, **Klaas** | First names slightly altered (Klaas = Flemish, fits Lille) |
| La Voix du Nord | **La Voix du Nordiste** | Local newspaper |

Sources: listings (PagesJaunes, Yelp, TheFork), the city's summer pedestrianisation page (zoomsurlille.fr, 2025).

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

## 2. Characters

### Pilou: Pierre-Louis Dubois (player)
Lives above Bernadette's; the exhaust is right under his window. Rust developer at **Koddex**, a startup
where his job amounts to prompting **Clode Kode** all day and building silly side projects.

### The Association de la rue des Bouchers
| Character | Who | Gameplay role |
|---|---|---|
| **Jérémie** | President, Pilou's neighbour, has a **dachshund** | Leads the evening **rounds** (dog walk = patrol). Unlocks official channels. The dachshund barks: it helps (spots things) and hurts (draws attention when you sneak). |
| **Klaas** | Elderly, Santa Claus look (big, not fat, white beard). **Sees everything, writes everything down.** | Passive **evidence engine**: his notebook logs infractions automatically. **Double-edged**: he also writes down what *Pilou* does. Only a lie or a bribe keeps an illegal act out of his notebook. |
| **Hilde**, Klaas's wife | Very kind | Brings food and tisane → restores Sleep and morale. Calms Klaas. |
| **Tatie Bouchon** | Emails Bernadette about the smell. They always answer "it's being fixed"; she doesn't believe it. Also chats with **Martine Aubrac**. | Email thread = running gag and evidence ("promise #14 that it's fixed"). Her Martine connection makes her an unreliable channel: she can open a door at the mayor's office or leak your plan. |
| **The Gaystapo** (WhatsApp group of the gay members, across the street, facing Pilou) **Seb & Nico** | Talk a lot. Their **cat** sits on the balcony | The **WhatsApp group** is the association's nervous system: rally the troops, share photos, gossip. **Cat on the balcony = they are home and watching**: allies witness legal actions (+evidence) but also see illegal ones. |
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
- **Martine Aubrac**: ex-mayor, still influential, protects the restaurants. Reached through Tatie Bouchon.
- **Arnaud Delandre**: current mayor, **more on the residents' side** (he brought in the 22:00 rule). City hall is split:
  the new mayor and the inspector lean toward the residents, while the old Martine network and parts of the municipal police protect the bloc.
  Getting a meeting with Delandre is a mid-campaign goal. Martine works to undermine him.
- **Koddex boss**: **Stéphane**, startup founder who is never there and talks about "vibes".

## 3. Structure: a 14-night campaign
Each **day** = 3 phases:
1. **Koddex (morning, 2D/menu, short)**. Pilou has 3 "prompts" a day to give Clode Kode. Options: real work
   (keeps the job), or secretly building side projects that help the fight:
   - a Rust dB-meter daemon → **automatic noise logging** (passive evidence);
   - a WhatsApp bot for the Gaystapo → association mobilisation costs less;
   - a review scraper → finds customers boasting about "terrace until 1am at Bernadette's 🍻";
   - a deepfake / fake reviews → **illegal**, big Risk.
   The boss notices if work output drops (Job meter). Gags: Clode Kode replies too politely, and it rewrote
   the boss's to-do app in Rust for the fourth time.
2. **Afternoon (menu)**: association actions (meeting, mayor's office, emails, press, lawyer, petition,
   recruiting residents), and the restaurants' counter-moves are revealed.
3. **Night (3D, ≈10 min)**: the street from 20:30 to ~01:30. Watch, gather evidence, act.

**Calendar** (two weeks, starting on a Monday):
- **Saturdays (days 6, 13)**: no vehicles → crowds, standing drinkers, peeing.
- **Day 4**: Martine Aubrac comes to dinner at Bernadette's (event).
- **Day 7**: association general meeting (vote on strategy: legal or "direct action").
- **Day 9**: the inspector comes back about the AC.
- **Day 11**: the exhaust meeting at the city (result depends on the dossier).
- **Day 14**: the **terrace commission** at the mayor's office → final ruling + endings.

## 4. Stats
| Stat | Effect |
|---|---|
| **Sleep** | Drained by noise and the exhaust after 22:00. Low Sleep = blurry photos, irritable dialogue, Koddex mistakes. |
| **Dossier** | Evidence. Each piece has a **quality** (timestamp, dB, headcount, witnesses) and a **legality** (illegally obtained = unusable officially, but usable for the press). |
| **Association** | Members' support. Some actions shock some members (Hilde doesn't like violence, the Gaystapo love drama, Tatie Bouchon is a fence-sitter). |
| **Risk** | Pilou's legal exposure. Grows with *witnessed* illegal acts. Thresholds: warning → complaint → police custody → trial. |
| **Job** | Koddex. Too low = fired (bad ending, or a twist: unemployed = free all day to fight). |
| **Bloc hostility** (hidden) | How much the restaurants target Pilou. |
| **Corruption** (hidden) | Strength of the restaurant–police–mayor's office links. Drops when it's exposed. |

## 5. Stealth: illegal = OK if no one sees you
Every illegal act checks for **witnesses** in line of sight + hearing:
- **Klaas** (window, almost always there; asleep ~01:00–05:00), the **Gaystapo** (cat on the balcony = present),
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
- Pushing Tatie Bouchon to "leak" fake plans to Martine.

### Illegal (stealth)
- **Bucket of water** from the window (classic).
- **Taping cardboard over the exhaust** (it smokes out the kitchen → health inspection... or a fire! very dangerous).
- **Stink bomb** / tainting the food. Darkest option: a **laxative in the carbonnade** (ruined service, catastrophic reviews,
  but it counts as **deliberately poisoning customers** if caught → prison ending). We keep it to laxatives, no lethal poison:
  that would break the satirical tone.
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
- **The mayor's office comes too**: an inspector visit is announced → the restaurants are perfect that night (tip-off via Martine).
  A surprise visit requires the Delphine channel or Hippolyte.

## 8. Restaurant bloc counter-moves
"It's being fixed" emails · tables brought in at 21:59 and back out at 22:20 · staff smoking under Pilou's window ·
bins in front of his door · free drinks to split the association (Tatie Bouchon) · petition of "happy customers" ·
complaint for harassment / defamation against Pilou · call to Martine · lobbying for Saturday to become "festive" ·
recruiting a resident (the traitor) · a fake post "Ch'tite Bernadette is being harassed by a resident, support us ❤️" → a wave of hate.

## 9. Endings (several)
1. **Legal victory**: terrace permit (AOT) suspended or withdrawn for Bernadette, exhaust moved. Requires a strong legal dossier and low Risk.
2. **Negotiated peace**: a good-neighbour charter signed by the bloc, 22:00 respected. Requires high Association and a "dialogue" stance.
3. **Scandal**: corruption exposed in La Voix du Nordiste, Lemaire transferred, Martine embarrassed. Strong but the bloc hates you.
4. **Custody / trial**: caught red-handed. Variant: the "laxatives" trial in the newspaper.
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
| **v0.2: core tension** | Sim logic split out of rendering + tests. Witnesses and line-of-sight stealth (Klaas, the Gaystapo + cat, waiter, customers filming). Police patrols with personalities, tip-off, "c'est encore vous", complaisance logging. Terrace zone + passage corridor evidence. Saturday variant (crowd, standing drinkers, peeing). |
| **v0.3: art pass** | Cute low-poly restyle: characters (Pilou, the association, Dédé & Ghislain, the waiter, police, customers), stepped gables, the cat, the dachshund, animations, ambient audio (WebAudio: crowd murmur, chairs on cobbles, the exhaust hum). |
| **v0.4: campaign** | The 14-day calendar, day phase (Koddex / Clode Kode prompts, afternoon association actions), save in localStorage, scripted events (Martine's dinner, general meeting, inspector, exhaust meeting, commission), bloc counter-moves, dialogue system with the association members. |
| **v0.5: dirty tricks** | Hidden cameras + electricity/wifi hijack, cardboard on the exhaust, stink bomb, laxatives, fake reviews, sabotage, bribing the waiter, photographing the bribe. Risk thresholds → complaint, custody, trial. |
| **v1.0: endings + polish** | The 8 endings, balancing via simulated runs, French copy pass, performance, a full QA run in Chrome. |

## 13. v1.0 acceptance checklist
v1.0 ships only when **every** box is ticked. Nothing is dropped silently: anything cut or simplified is listed under "Deviations" with Lucas's OK.
Proof: **T** = automated test (vitest / Playwright / campaign simulator, runs in CI) · **Q** = design agent's QA session in Chrome (screenshots in `qa/`) · **L** = Lucas playtest.

### A. Campaign and length
- [ ] 14-day calendar Monday → Sunday of week 2, each day = Koddex morning → afternoon → night (3D). **T Q**
- [ ] Save/continue (localStorage), a new campaign, and one save slot minimum. Reload mid-campaign resumes the same day and state. **T Q**
- [ ] **Duration**: a full campaign takes **2h30 to 4h** for a human (14 nights × ~10 min + day phases). Nights can't be skipped without consequence ("go to bed" = you lose what happens). **Q L**
- [ ] Early endings (custody, fired, moving out) can't trigger before **night 5**. The "real" endings are decided at the **Day 14 commission**. **T**
- [ ] Fixed events happen on their day: Saturdays 6 & 13, Martine's dinner (D4), the general meeting (D7), the inspector (D9), the exhaust meeting (D11), the commission (D14). **T Q**

### B. Characters (all present, recognisable, with a role and dialogue)
- [ ] Pilou · Jérémie + dachshund · Klaas (Santa look, notebook) · Hilde · Tatie Bouchon (+ the "it's being fixed" email thread) · Seb & Nico + the cat · Hippolyte (carriage building). **Q**
- [ ] Dédé · Ghislain (bun) · the waiter · Brigadier Lemaire · Agent Benali · the police chief · inspector Delphine Vermeersch · Stéphane (Koddex boss) · Martine Aubrac · mayor Arnaud Delandre. **Q**
- [ ] Each association member has at least **8 lines** of contextual dialogue (reacting to the current state) and at least 1 action or event tied to them. **T** (content count) **Q**

### C. Night systems
- [ ] 22:00 rule (street-specific, 2026), 6 per table, zones + corridor, cobbles (chair clatter). **T**
- [ ] Evidence: photo, dB reading, headcount, corridor encroachment, timestamps. Quality + legality per piece. **T**
- [ ] Witnesses / line of sight: Klaas (asleep ~01:00), Seb & Nico (cat = home), the waiter, customers filming, the dachshund. Darkness, time and disguise modifiers. **T Q**
- [ ] Police: 3 patrols with personalities, hidden roster (Klaas can deduce it), tip-off, coffee/complaisance logged, "c'est encore vous", calling as the Association, the police coming for Pilou, the bribe caught on camera → internal investigation. **T**
- [ ] Mayor's office: reports, inspector visits (announced = tip-off via Martine, surprise = via Delphine/Hippolyte). **T**
- [ ] Saturday: no vehicles, crowd, standing drinkers, peeing in doorways. **Q**

### D. Day systems
- [ ] Koddex: 3 Clode Kode prompts a day, work vs side projects (dB logger, WhatsApp bot, review scraper, wifi cracker, fake reviews), Job meter, boss gags. **T Q**
- [ ] Afternoon actions: meeting, mayor's office, emails, press (La Voix du Nordiste), lawyer (formal notice), petition, health agency (ARS) / environmental health about the exhaust, recruiting residents, asking for a uritrottoir, dinner at Stéphane's with Delphine. **T**
- [ ] The restaurants' counter-moves (all of section 8) can trigger, depending on state. **T**

### E. Actions (every one implemented, with a cost, an effect and a consequence)
- [ ] Legal: every item of section 6 "Legal". **T**
- [ ] Grey: every item of section 6 "Grey". **T**
- [ ] Illegal: bucket, cardboard on the exhaust, stink bomb, laxatives, fake reviews, sabotage (chairs, parasols, locks), bribing the waiter, hidden cameras (window = grey, awning = illegal), power from Bernadette's electricity, cracking their wifi (+ reading reservations, emails, quotes), sneaking in to photograph the bribe. **T**
- [ ] Illegally obtained evidence is unusable in court but usable for the press / internal police investigation. **T**

### F. Endings: all 8 reachable
- [ ] 1 Legal victory · 2 Negotiated peace · 3 Scandal · 4 Custody/trial (incl. the laxatives variant) · 5 Moving out to Wazemmes · 6 Fired (+ continue twist) · 7 Turncoat (secret) · 8 The return (La Bombance). **T Q**
- [ ] Each ending has its own end screen with an epilogue that **references what the player actually did** (key evidence, actions, who betrayed whom). **T Q**
- [ ] The campaign simulator reaches **every ending** with at least one scripted strategy, and each ending occurs in ≥ 2% of 1000 runs of its target strategy. **T**

### G. Scenario coherence (automated invariants + story review)
- [ ] Invariants checked on every simulated night and campaign: the police only arrive after a call or a scheduled event; nobody is in two places; a cleared table doesn't come back without a tip-off/return event; evidence refers to real events (time, place, table); Risk only rises from witnessed acts; a closed shop stays closed until its event; Klaas's notebook only logs what he could see. **T**
- [ ] Dialogue/event text only references facts the player has unlocked (no spoilers, no "as you know…" about something unseen). Flags are checked by a content linter. **T**
- [ ] Story bible review: names, places, timeline and character traits are consistent across all text (design agent review, logged in `qa/coherence.md`). **Q**
- [ ] No real restaurant name anywhere (grep test against the section 0 list). **T**

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
- [ ] Cute low-poly cast and street (stepped gables, carriage door, La Bombance, the cat, the dachshund). **Q**
- [ ] Audio: crowd, chairs on cobbles, exhaust hum, 22:00 bell, mute (M). **Q**
- [ ] French only, satirical tone, Ch'ti touches. Copy proofread. **Q L**
- [ ] 60 fps on a laptop iGPU (perf test logs the frame time). Loads in < 5 s. Bundle < 3 MB. **T Q**
- [ ] CI green (unit + e2e + campaign simulator smoke). Deploy auto from main. **T**

### Deviations
_(none yet)_

## 14. Still open
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
