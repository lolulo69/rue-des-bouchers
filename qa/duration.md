# Durée d'une campagne (GAME_DESIGN §13.A : 2h30 à 4h)

Généré par `tests/e2e/fullrun.e2e.js` (`npm run test:fullrun`). Estimation, pas un chronométrage :
- **phases de jour** : texte affiché à l'écran (hors en-tête de stats) lu à **200 mots/min**, plus **2 s par clic** ;
- **nuits** : 10 min réelles chacune (`RULES` : 20.5h → 1.5h, 0.5 min de jeu par seconde),
  sans « dormir » (qui accélère ×12) : c'est donc un **plafond** pour la nuit.
- Une fin anticipée (garde à vue, déménagement, licenciement) raccourcit la partie : marquée ⏹, elle n'est pas comparée à la cible.
- ⚠️ trop court = campagne menée jusqu'au J14 en moins de 2h30.

| Style | Fin | Nuits | Mots lus | Clics | Jour | Nuits | Total | Cible | Mesuré le |
|---|---|---|---|---|---|---|---|---|---|
| diplomate | negotiated_peace (jour 14) | 13 | 11351 | 270 | 1h06 | 2h10 | **3h16** | ✅ | 2026-10-09 |
| légal prudent | moving_out (jour 14) | 13 | 12388 | 313 | 1h12 | 2h10 | **3h22** | ✅ | 2026-10-09 |
| mixte malin | moving_out (jour 14) | 13 | 12547 | 316 | 1h13 | 2h10 | **3h23** | ✅ | 2026-10-09 |
| passif | moving_out (jour 14) | 13 | 10561 | 207 | 1h00 | 2h10 | **3h10** | ✅ | 2026-10-09 |
| casse-cou | custody (jour 5) | 4 | 6207 | 118 | 0h35 | 0h40 | **1h15** | ⏹ fin anticipée (jour 5) | 2026-10-09 |
| illégal discret | custody (jour 7) | 7 | 7684 | 144 | 0h43 | 1h10 | **1h53** | ⏹ fin anticipée (jour 7) | 2026-10-09 |

**v1.1** (2026-10-09) : casse-cou, illégal discret et passif à fe57180 ; légal prudent, diplomate et mixte malin à ab94929 (après les correctifs BUG-010 et BUG-007 ; 0 résultat de carte perdu, scène de la commission affichée en entier). Les quatre campagnes menées au J14 tiennent dans 3h10–3h23. À noter : dans ces parties scriptées, légal prudent et mixte malin perdent la commission (déménagement) ; c'est un seul passage par style, l'équilibrage se lit dans `qa/balance.md` (simulateur, 200 campagnes par bot).

Résumés par style : `qa/fullrun/*.json` (date du dernier passage dans `at`). Dernière mise à jour : 2026-10-09 05:53 UTC.

## §12c.5 night pacing (build agent, 2026-10-09): nights re-measured

`npm run measure:nights` (scripts/night-duration.js, 6 seeds × 7 campaign bots): each night minute goes through `nightClock` (the same function game.js uses: ×1 until 22:30, then ×3 unless a patrol, a twist moment / night event within 10 min, or a witness / evidence / action in the last 5 min), and the real time is summed. The day time is the one fullrun measured (`qa/fullrun/*.json`); only the nights change. The table above (fixed 10-minute nights) is now an over-estimate; QA: `fullrun.e2e.js` `NIGHT_S` should take the « éveillé » average below (or call the script) on the next full run.

| Bot | Nuits | Éveillé (plafond) | Couché au conseil | Au conseil + passer | 23h30 + passer | Conseil vu | Heure moyenne du conseil |
|---|---|---|---|---|---|---|---|
| passive | 78 | 6 min 34 s | 6 min 28 s | 6 min 28 s | 4 min 56 s | 10 % | 00h42 |
| legal | 78 | 7 min 35 s | 7 min 35 s | 7 min 35 s | 5 min 28 s | 0 % | — |
| reckless | 26 | 6 min 07 s | 6 min 07 s | 6 min 07 s | 4 min 38 s | 0 % | — |
| stealthy | 66 | 7 min 03 s | 7 min 00 s | 7 min 00 s | 5 min 13 s | 6 % | 00h45 |
| mixed | 78 | 7 min 36 s | 7 min 36 s | 7 min 36 s | 5 min 28 s | 0 % | — |
| diplomat | 78 | 6 min 56 s | 6 min 55 s | 6 min 55 s | 5 min 14 s | 1 % | 00h45 |
| slacker | 49 | 7 min 23 s | 7 min 23 s | 7 min 23 s | 5 min 30 s | 0 % | — |

Moyenne par nuit : éveillé 7 min 07 s · couché au conseil 7 min 05 s · au conseil + passer 7 min 05 s · 23h30 + passer 5 min 15 s (avant §12c.5 : 10 min 00 s).

| Style | Fin | Nuits | Jour | Total avant (nuits 10 min) | Éveillé | Couché au conseil | Au conseil + passer | 23h30 + passer |
|---|---|---|---|---|---|---|---|---|
| diplomate | negotiated_peace (jour 14) | 13 | 1h06 | 3h16 | 2h38 | 2h38 | 2h38 | 2h14 |
| légal prudent | moving_out (jour 14) | 13 | 1h12 | 3h22 | 2h45 | 2h45 | 2h45 | 2h21 |
| mixte malin | moving_out (jour 14) | 13 | 1h13 | 3h23 | 2h46 | 2h45 | 2h45 | 2h22 |
| passif | moving_out (jour 14) | 13 | 1h00 | 3h10 | 2h32 | 2h32 | 2h32 | 2h08 |
| casse-cou | custody (jour 5) | 4 | 0h35 | 1h15 | 1h03 | 1h03 | 1h03 | 0h56 |
| illégal discret | custody (jour 7) | 7 | 0h43 | 1h53 | 1h33 | 1h33 | 1h33 | 1h20 |
