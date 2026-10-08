# Durée d'une campagne (GAME_DESIGN §13.A : 2h30 à 4h)

Généré par `tests/e2e/fullrun.e2e.js` (`npm run test:fullrun`). Estimation, pas un chronométrage :
- **phases de jour** : texte affiché à l'écran (hors en-tête de stats) lu à **200 mots/min**, plus **2 s par clic** ;
- **nuits** : 10 min réelles chacune (`RULES` : 20.5h → 1.5h, 0.5 min de jeu par seconde),
  sans « dormir » (qui accélère ×12) : c'est donc un **plafond** pour la nuit.
- Une fin anticipée (garde à vue, déménagement, licenciement) raccourcit la partie : marquée ⏹, elle n'est pas comparée à la cible.
- ⚠️ trop court = campagne menée jusqu'au J14 en moins de 2h30.

| Style | Fin | Nuits | Mots lus | Clics | Jour | Nuits | Total | Cible |
|---|---|---|---|---|---|---|---|---|
| diplomate | negotiated_peace (jour 14) | 14 | 7075 | 248 | 0h44 | 2h20 | **3h04** | ✅ |
| légal prudent | the_return (jour 14) | 14 | 7385 | 287 | 0h47 | 2h20 | **3h07** | ✅ |
| mixte malin | scandal (jour 14) | 13 | 10296 | 272 | 1h01 | 2h10 | **3h11** | ✅ |
| passif | moving_out (jour 14) | 13 | 8181 | 170 | 0h47 | 2h10 | **2h57** | ✅ |
| casse-cou | custody (jour 5) | 5 | 4441 | 109 | 0h26 | 0h50 | **1h16** | ⏹ fin anticipée (jour 5) |
| illégal discret | moving_out (jour 11) | 10 | 7752 | 160 | 0h44 | 1h40 | **2h24** | ⏹ fin anticipée (jour 11) |

Résumés par style : `qa/fullrun/*.json` (date du dernier passage dans `at`). Dernière mise à jour : 2026-10-08 21:47 UTC.
