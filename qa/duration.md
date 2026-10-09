# Durée d'une campagne (GAME_DESIGN §13.A : 2h30 à 4h)

Généré par `tests/e2e/fullrun.e2e.js` (`npm run test:fullrun`). Estimation, pas un chronométrage :
- **phases de jour** : texte affiché à l'écran (hors en-tête de stats) lu à **200 mots/min**, plus **2 s par clic** ;
- **nuits** : 10 min réelles chacune (`RULES` : 20.5h → 1.5h, 0.5 min de jeu par seconde),
  sans « dormir » (qui accélère ×12) : c'est donc un **plafond** pour la nuit.
- Une fin anticipée (garde à vue, déménagement, licenciement) raccourcit la partie : marquée ⏹, elle n'est pas comparée à la cible.
- ⚠️ trop court = campagne menée jusqu'au J14 en moins de 2h30.

| Style | Fin | Nuits | Mots lus | Clics | Jour | Nuits | Total | Cible | Mesuré le |
|---|---|---|---|---|---|---|---|---|---|
| diplomate | negotiated_peace (jour 14) | 13 | 11358 | 270 | 1h06 | 2h10 | **3h16** | ✅ | 2026-10-09 |
| légal prudent | moving_out (jour 14) | 13 | 12389 | 313 | 1h12 | 2h10 | **3h22** | ✅ | 2026-10-09 |
| mixte malin | moving_out (jour 14) | 13 | 12547 | 316 | 1h13 | 2h10 | **3h23** | ✅ | 2026-10-09 |
| passif | moving_out (jour 14) | 13 | 10561 | 207 | 1h00 | 2h10 | **3h10** | ✅ | 2026-10-09 |
| casse-cou | custody (jour 5) | 4 | 6207 | 118 | 0h35 | 0h40 | **1h15** | ⏹ fin anticipée (jour 5) | 2026-10-09 |
| illégal discret | custody (jour 7) | 7 | 7684 | 144 | 0h43 | 1h10 | **1h53** | ⏹ fin anticipée (jour 7) | 2026-10-09 |

**v1.1** (2026-10-09) : casse-cou, illégal discret et passif à fe57180 ; légal prudent, diplomate et mixte malin à ab94929 (après les correctifs BUG-010 et BUG-007 ; 0 résultat de carte perdu, scène de la commission affichée en entier). Les quatre campagnes menées au J14 tiennent dans 3h10–3h23. À noter : dans ces parties scriptées, légal prudent et mixte malin perdent la commission (déménagement) ; c'est un seul passage par style, l'équilibrage se lit dans `qa/balance.md` (simulateur, 200 campagnes par bot).

Résumés par style : `qa/fullrun/*.json` (date du dernier passage dans `at`). Dernière mise à jour : 2026-10-09 05:53 UTC.
