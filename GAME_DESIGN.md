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
| Current mayor (A. Deslandes) | **Arnaud Delandre** | Martine's successor and protégé |
| Claude Code | **Clode Kode** | Pilou's work tool (wink) |
| La Voix du Nord | **La Voix du Nordiste** | Local newspaper |

Sources: listings (PagesJaunes, Yelp, TheFork), the city's summer pedestrianisation page (zoomsurlille.fr, 2025).

## 1. Setting and rules (reality)
- After Covid, Lille extended terraces onto the street to help restaurants recover.
- **Terraces close at 22:00, every day** (per Lucas). [CHECK] The city's 2025 summer
  pedestrianisation page lists terraces until 23:00 Sun–Wed and midnight Thu–Sat for pedestrianised streets.
  Is 22:00 a street-specific rule for rue des Bouchers (like the 6-per-table rule)?
- **Max 6 people per table**. This applies **only on rue des Bouchers**.
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
| **Jérémy** | President, Pilou's neighbour, has a **dachshund** | Leads the evening **rounds** (dog walk = patrol). Unlocks official channels. The dachshund barks: it helps (spots things) and hurts (draws attention when you sneak). |
| **Klaus** | Elderly, Santa Claus look (big, not fat, white beard). **Sees everything, writes everything down.** | Passive **evidence engine**: his notebook logs infractions automatically. **Double-edged**: he also writes down what *Pilou* does. Only a lie or a bribe keeps an illegal act out of his notebook. |
| **Klaus's wife** [name OPEN, proposal: **Hilde**] | Very kind | Brings food and tisane → restores Sleep and morale. Calms Klaus. |
| **Tatie Bouchon** | Emails Bernadette about the smell. They always answer "it's being fixed"; she doesn't believe it. Also chats with **Martine Aubrac**. | Email thread = running gag and evidence ("promise #14 that it's fixed"). Her Martine connection makes her an unreliable channel: she can open a door at the mayor's office or leak your plan. |
| **The Gaystapo** (WhatsApp group of the gay members, across the street, facing Pilou) [names OPEN, proposal: **Seb & Nico**] | Talk a lot. Their **cat** sits on the balcony | The **WhatsApp group** is the association's nervous system: rally the troops, share photos, gossip. **Cat on the balcony = they are home and watching**: allies witness legal actions (+evidence) but also see illegal ones. |
| **Hippolyte** [name proposal] | Owns an old building where **carriages (calèches)** were made since the 1800s | Old money, knows the old families and the city's heritage department. Late game: heritage-protection angle (exhaust and AC on a historic façade), a meeting room in the former carriage workshop. |

### The restaurants ("restaurants vs residents")
The restaurants form a **bloc**: Bernadette's leads it, and the others back her.
- **Bernadette's owners** (Bernadette is a fake name, there's no real Bernadette):
  - **Dédé** [name proposal]: short and stout, jovial in public, a fixer. Handles the police ("a coffee, a waterzooi, on the house").
  - **Ghislaine** [name proposal]: skinny, **huge chignon**, cold, does the paperwork and the emails ("it's being fixed").
  - [OPEN] Couple or business partners?
- **The waiter**: young, overworked, sympathetic. Can become an informant.

### Institutions
- **Municipal police**: three patrols with different personalities.
  - **Brigadier Lemaire** [proposal]: eats for free at Bernadette's. Slow on the night's first call, and tips the restaurant off five minutes before arriving.
  - **Agent Benali** [proposal]: young, by the book, really comes. Is transferred if he is "too zealous".
  - **The chief**: only shows up after a scandal or a call from the mayor's office.
  - The **duty roster** is a hidden variable. Klaus can deduce it from his notebook ("Tuesdays and Fridays, it's Lemaire").
- **The mayor's office inspector** [name proposal: **Delphine Vermeersch**]: handles the AC case. **Married to
  Pilou's boss.** Real but compromising lever: a dinner at the boss's place = an informal channel to her
  (a conflict of interest that can come out).
- **Martine Aubrac**: ex-mayor, still influential, protects the restaurants. Reached through Tatie Bouchon.
- **Koddex boss** [name proposal: **Bastien**]: startup founder who is never there and talks about "vibes".

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
- **Klaus** (window, almost always there; asleep ~01:00–05:00), the **Gaystapo** (cat on the balcony = present),
  the **waiter/owners**, **customers** (may film → viral video), Jérémy's **dachshund** (barks if you're nearby and nervous),
  **street CCTV** at the ends of the street [CHECK whether there are cameras].
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
- **Photograph the police bribery** at close range (legal in itself, but hiding in their back room is not).

## 7. Police: what can happen when you call (inventive, realistic)
Outcome depends on: patrol on duty, time, how often you've called, whether you mentioned the Association, the dossier, Corruption.
- **They come and act**: tables brought in, a fine (PV). Rarely the whole terrace.
- **They come, have a coffee, leave**. Klaus notes "20:47, coffee offered, 0 fines" → evidence of **complaisance**.
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
7. **Turncoat (secret)**: Pilou becomes a regular at Bernadette's, eats the carbonnade, and Klaus writes it down.
8. **The return**: you win, then **La Bombance reopens as a bar** next door. Wink at a sequel.

## 10. Prototype v0.1 (current build target)
A single night (night 1, Monday) on one street. First person, ZQSD/WASD + mouse. Pilou's apartment reachable
via the building door. Tables with headcounts (some over the limit), a waiter, the exhaust with steam under the window,
a clock, the stats HUD, a phone (police / association / mayor's office), the dossier (Tab), a bucket of water (illegal), an end-of-night summary.
Tunable rules live in `src/config.js`.

### Next (v0.2, after v0.1 ships)
- Witnesses + line-of-sight stealth (Klaus's window, the Gaystapo balcony with the cat).
- Police patrols with personalities, tip-off mechanic.
- Saturday variant (crowd, standing drinkers, peeing).
- Day/Koddex menu phase + 14-night calendar with save (localStorage).

## 11. Still open
- [CHECK] 22:00 vs the city's summer hours (23:00 / midnight).
- [CHECK] Are there city cameras on the street?
- Names: Klaus's wife, the Gaystapo members, the last member (Hippolyte?), the owners (Dédé & Ghislaine?), the inspector, the boss.
- Are the real neighbours OK with appearing (first names in a public repo)? Change first names slightly?
- Is Bernadette's terrace marked on the ground (the area is checkable)?
