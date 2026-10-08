# Rue des Bouchers — Game Design

> Living document. Lucas and the design agent own this file; the build agent implements from it.
> Anything marked **[OPEN]** is not decided yet. Don't hard-code a guess in a way that's hard to undo.

## Pitch
3D browser game (three.js). You play **Pierre-Louis "Pilou" Dubois**, a resident of rue des Bouchers in
Vieux-Lille and a member of the **Association de la rue des Bouchers**. You live right above
**La Ch'tite Brigitte**, and its kitchen exhaust vents just under your window. You want their terrace gone.
The game aims to be **as close to reality as possible**.

## Lore (confirmed by Lucas)
- After Covid, Lille let restaurants put tables out in the street (terraces) to rebuild revenue.
- Residents organized as the *Association de la rue des Bouchers* to defend their rights.
- Rules restaurants must follow:
  - terraces close at **22:00** every day, everyone moves inside;
  - noise limits;
  - a **maximum number of people per table** outside.
- Restaurants have their own ways of handling conflict, including **bribing the local police**.
  They have also worked the **mayor's office**.
- La Ch'tite Brigitte is the main antagonist. Pilou's apartment is directly above it.
- Actions can be **legal or illegal**. Each comes with benefits and consequences.

## Open lore questions (to ask Lucas)
See the "Open questions" section at the end. Answers get folded into "Lore" above.

## Core loop (draft, [OPEN])
One **night = one level** (≈20:30 → 01:30 game time, ≈10 min real time).
1. Watch the street: tables, headcount per table, noise (dB), closing time.
2. Gather **evidence** (photos, dB readings, timestamps) into the association's **dossier**.
3. Act: legal levers (complaint, police call, mayor's office, association) or illegal ones.
4. Take the consequences: Sleep, Association support, legal Risk, restaurant hostility, police goodwill.
5. Between nights: a **campaign layer** (meetings, mayor's office, press, court) where the dossier is spent.

## Stats (draft)
| Stat | Meaning |
|---|---|
| Sleep | Pilou's health. Drained by noise and the exhaust after 22:00. Low sleep = slower, worse decisions. |
| Dossier | Quality and quantity of evidence. Only *timestamped, legally obtained* evidence counts in official channels. |
| Association | Support from the other members. Drops with illegal or embarrassing actions. |
| Risk | Legal exposure for Pilou (fines, police custody, a defamation suit). |
| Hostility | How much Brigitte's staff targets you (hidden). |

## Actions (draft)
**Legal**: photo or dB evidence; politely asking the waiter to bring tables in after 22:00; calling the
municipal police; filing a report with the mayor's office; mobilizing the association; later: press,
a lawyer, the préfecture, a petition, the council meeting.

**Illegal / grey**: bucket of water from the window, sabotaging the exhaust, fake reviews, noise
retaliation, etc. Big immediate effect, high Risk and loss of association support.

**Restaurant counter-moves**: favors to the police (the call gets "lost" or officers leave after a
coffee), lobbying the mayor's office, pressure on residents, a defamation complaint against Pilou.

## Prototype v0.1 (current build target)
A single night on one street. First person, ZQSD/WASD + mouse. Pilou's apartment reachable via the
building door. Tables with headcounts (some over the limit), a waiter, the exhaust duct with steam
under the window, a clock, the stats HUD, a phone (police / association / mayor's office), the dossier
(Tab), a bucket of water (illegal), and an end-of-night summary.
Tunable rules live in `src/config.js`.

## Open questions
1. Exact terrace closing rule: 22:00 every day, or later on weekends or in summer? Does it come from a
   municipal decree (arrêté) or from the terms of each restaurant's permit?
2. Real headcount limit per table? Is there also a cap on the number of tables or on terrace area (marked on the ground)?
3. Who enforces it: municipal police, national police, or the mayor's office's public-space department?
   What sanctions really exist (fine, suspended permit, permit withdrawn)?
4. Exhaust duct: is it legally compliant? (Rules on how high an outlet must sit relative to windows are a real angle.)
5. The association: real members and characters to adapt (president, the elderly neighbor, the one who
   overreacts, the turncoat who eats at Brigitte's)? How many?
6. Brigitte: owner and staff names and personalities? Is there a "Brigitte"?
7. Other restaurants on the street: how many, are they allies of Brigitte or neutral, and could they become allies of the association?
8. Mayor's office: is there a specific elected official in charge? Did the association already get a meeting or an answer?
9. Tone: realistic and dry, satirical, or Ch'ti humor (patois lines)?
10. Ending: what does winning look like? The terrace removed, the rules enforced, a negotiated peace, or Pilou moving out?
11. Real place names (the real street and restaurant name): ok to use publicly, or should names be fictionalized for legal reasons (defamation)?
