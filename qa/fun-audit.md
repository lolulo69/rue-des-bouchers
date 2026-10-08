# Audit de répétition (§12b, §13.J)

Généré par `scripts/fun-audit.js` (`npm run audit:fun -- --write --label "…"`). Une section par passage ; la plus récente en haut.

**Définitions.** Un *moment* = une ligne du journal de nuit (narration, tuyau, police, témoins, raclements…), un événement de nuit,
ou une entrée du journal du moteur (évacuation d'une table, pièce au dossier, appel, arrivée de police…). Le **temps mort** d'une nuit
est la somme des silences de plus de 30 s réelles entre deux moments (1 min de jeu = 2 s réelles ; une nuit ≈ 10 min réelles).
Une *situation* = le gabarit d'une ligne (sans heures ni nombres) ou un type d'événement ; la **similarité** de deux nuits consécutives
est l'indice de Jaccard de leurs ensembles de situations. Les bots sont ceux du simulateur (`src/sim/campaignBots.js`).

## Référence v1.0 (avant les twists) · 2026-10-08 · main @ f5db49b

20 campagnes par bot (graines 1000…1019).

| Bot | Nuits | Temps mort moyen / nuit | Nuits > 90 s | Situations distinctes / nuit | Similarité moyenne (nuits consécutives) | Similarité max | Paires > 0,7 | Twists distincts |
|---|---|---|---|---|---|---|---|---|
| passive | 260 | 430 s | 100 % | 4.9 | 0.67 | 1.00 | 77/240 | 0 |
| legal | 260 | 166 s | 100 % | 21.9 | 0.71 | 1.00 | 131/240 | 0 |
| reckless | 85 | 441 s | 94 % | 15.8 | 0.41 | 0.87 | 2/65 | 0 |
| stealthy | 232 | 355 s | 100 % | 12.8 | 0.48 | 1.00 | 28/212 | 0 |
| mixed | 260 | 162 s | 99 % | 22.1 | 0.71 | 1.00 | 122/240 | 0 |
| diplomat | 260 | 158 s | 100 % | 20.1 | 0.70 | 1.00 | 135/240 | 0 |
| slacker | 199 | 175 s | 100 % | 19.9 | 0.70 | 1.00 | 88/179 | 0 |

- Cible v1.1 temps mort : ❌ 252 s en moyenne (cible < 90 s)
- Cible v1.1 similarité : ❌ 583 paire(s) de nuits consécutives au-dessus de 0.7 (cible : 0)

Lignes les plus répétées (lignes vues au moins 2 fois dans une même campagne ; total de leurs occurrences sur ce passage) :
- 1920 × « Raclement de chaises sur les pavés : Les Bouchers Mal Lunés rentre une table… enfin. »
- 1886 × « Raclement de chaises sur les pavés : Estaminet La Ch’tite Bernadette rentre une table… enfin. »
- 1778 × « Raclement de chaises sur les pavés : Le Goulot rentre une table. »
- 1716 × « Le serveur, gêné : « Le patron sait que c’est vous qui appelez la police… » »
- 1529 × « Raclement de chaises sur les pavés : Les Bouchers Mal Lunés rentre une table. »
- 1362 × « Raclement de chaises sur les pavés : Les Bouchers Mal Lunés rentre sa terrasse… enfin. »
- 1326 × « Le serveur revient : « Le patron dit que les clients finissent leur verre. » »
- 1295 × « Raclement de chaises sur les pavés : Le Goulot rentre sa terrasse… enfin. »
- 1292 × « Quelqu’un urine contre votre porte d’entrée. Classique du samedi. »
- 1183 × « Raclement de chaises sur les pavés : Le Goulot rentre une table… enfin. »
- 1092 × « Raclement de chaises sur les pavés : Estaminet La Ch’tite Bernadette rentre une table. »
- 973 × « Jérémie compte les tables à voix haute, Biloute renifle chaque pied de chaise, vous notez. Biloute s’arrête net devant chaque table qui débo… »
