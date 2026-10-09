# Durée d'une campagne (GAME_DESIGN §13.A : 2h30 à 4h)

Généré par `tests/e2e/fullrun.e2e.js` (`npm run test:fullrun`). Estimation, pas un chronométrage :
- **phases de jour** : texte affiché à l'écran (hors en-tête de stats) lu à **200 mots/min**, plus **2 s par clic** ;
- **nuits** : 10 min réelles chacune (`RULES` : 20.5h → 1.5h, 0.5 min de jeu par seconde),
  sans « dormir » (qui accélère ×12) : c'est donc un **plafond** pour la nuit.
- Une fin anticipée (garde à vue, déménagement, licenciement) raccourcit la partie : marquée ⏹, elle n'est pas comparée à la cible.
- ⚠️ trop court = campagne menée jusqu'au J14 en moins de 2h30.

| Style | Fin | Nuits | Mots lus | Clics | Jour | Nuits | Total | Cible | Mesuré le |
|---|---|---|---|---|---|---|---|---|---|
| légal prudent | the_return (jour 14) | 14 | 7385 | 287 | 0h47 | 2h20 | **3h07** | ✅ | 2026-10-08 |
| diplomate | negotiated_peace (jour 14) | 14 | 7075 | 248 | 0h44 | 2h20 | **3h04** | ✅ | 2026-10-08 |
| mixte malin | scandal (jour 14) | 13 | 10296 | 272 | 1h01 | 2h10 | **3h11** | ✅ | 2026-10-08 |
| passif | moving_out (jour 14) | 13 | 10561 | 207 | 1h00 | 2h10 | **3h10** | ✅ | 2026-10-09 |
| casse-cou | custody (jour 5) | 4 | 6207 | 118 | 0h35 | 0h40 | **1h15** | ⏹ fin anticipée (jour 5) | 2026-10-09 |
| illégal discret | custody (jour 7) | 7 | 7684 | 144 | 0h43 | 1h10 | **1h53** | ⏹ fin anticipée (jour 7) | 2026-10-09 |

**v1.1 (main vert fe57180, 2026-10-09)** : casse-cou, illégal discret et passif rejoués. Légal prudent, diplomate et mixte malin datent de v1.0 (2026-10-08) : leur passage v1.1 attend **BUG-010** (une photo la nuit du J4 plante le jeu ; ces trois styles photographient).

Résumés par style : `qa/fullrun/*.json`. Dernière mise à jour : 2026-10-09 03:29 UTC.
