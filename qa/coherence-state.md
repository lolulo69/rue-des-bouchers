# Cohérence texte ↔ état (§13.L)

Généré par `npm run check:coherence -- --runs 200` (scripts/coherence-check.js) : 200 campagnes × 7 bots (passive, legal, reckless, stealthy, mixed, diplomat, slacker), 40 s.
Chaque ligne de nuit est vérifiée contre l'état juste avant et juste après son affichage (une ligne passe si l'un des deux lui donne raison) ; les lignes de jour (cartes, actions, dialogue, téléphone) sont comptées, leurs gardes vérifiées à la sélection.

**Lignes vues : 1196565** (nuit 922668, jour 273897) · **contradictions : 0**

| Catégorie | Lignes |
|---|---|
| good | 280092 |
| log | 150366 |
| ambient | 138258 |
| twist | 122185 |
| bark | 99140 |
| bad | 64194 |
| bell | 44546 |
| phone | 23887 |

| Règle | Contradictions | Textes distincts |
|---|---|---|
| terrasse : parle de clients en terrasse alors que personne n’est dehors | 0 | 0 |
| rentrer : dit que des tables rentrent alors qu’aucune n’est dehors | 0 | 0 |
| ressortir : dit que des tables ressortent alors qu’aucune n’est dehors | 0 | 0 |
| apres22 : parle de l’après-22h avant 22h | 0 | 0 |
| avant22 : parle de l’avant-22h après 22h | 0 | 0 |
| pluie : parle de pluie par temps sec | 0 | 0 |
| serveur : met en scène le serveur alors qu’il n’est plus là | 0 | 0 |
| patrouille : parle de la patrouille alors qu’elle n’est pas dans la rue | 0 | 0 |
| klaas : Klaas note alors qu’il dort | 0 | 0 |
| biloute : parle de la ronde de Biloute hors de la ronde | 0 | 0 |
| gaine : parle de la gaine qui tourne alors qu’elle est arrêtée | 0 | 0 |
| chat : parle du chat au balcon alors qu’il est rentré | 0 | 0 |
| debout : parle de buveurs debout alors qu’il n’y en a pas | 0 | 0 |
