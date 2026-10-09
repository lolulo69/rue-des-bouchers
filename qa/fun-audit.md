# Audit de répétition (§12b, §13.J)

Généré par `scripts/fun-audit.js` (`npm run audit:fun -- --write --label "…"`). Une section par passage ; la plus récente en haut.

**Définitions.** Un *moment* = une ligne du journal de nuit (narration, tuyau, police, témoins, raclements…), un événement de nuit,
ou une entrée du journal du moteur (évacuation d'une table, pièce au dossier, appel, arrivée de police…). Le **temps mort** d'une nuit
est la somme des silences de plus de 30 s réelles entre deux moments (1 min de jeu = 2 s réelles ; une nuit ≈ 10 min réelles).
Une *situation* = le gabarit d'une ligne (sans heures ni nombres) ou un type d'événement ; la **similarité** de deux nuits consécutives
est l'indice de Jaccard de leurs ensembles de situations. Les bots sont ceux du simulateur (`src/sim/campaignBots.js`).

## v1.1 finale (main vert fe57180) · 2026-10-09 · main @ fe57180

20 campagnes par bot (graines 1000…1019).

| Bot | Nuits | Temps mort moyen / nuit | Nuits > 90 s | Situations distinctes / nuit | Similarité moyenne (nuits consécutives) | Similarité max | Paires > 0,7 | Twists distincts | Lignes / min réelle | Pic sur 1 min | 3 ambiances d’affilée |
|---|---|---|---|---|---|---|---|---|---|---|---|
| passive | 260 | 0 s | 0 % | 37.8 | 0.16 | 0.28 | 0/240 | 22 | 3.3 | 8 | 0 |
| legal | 260 | 0 s | 0 % | 47.6 | 0.22 | 0.34 | 0/240 | 22 | 5.8 | 30 | 0 |
| reckless | 92 | 0 s | 0 % | 44.1 | 0.14 | 0.23 | 0/72 | 14 | 3.5 | 17 | 0 |
| stealthy | 248 | 79 s | 45 % | 39.5 | 0.16 | 0.30 | 0/228 | 21 | 3.1 | 12 | 0 |
| mixed | 260 | 0 s | 0 % | 47.6 | 0.22 | 0.33 | 0/240 | 22 | 5.9 | 30 | 0 |
| diplomat | 260 | 0 s | 0 % | 40.6 | 0.22 | 0.39 | 0/240 | 22 | 4.7 | 32 | 0 |
| slacker | 105 | 0 s | 0 % | 43.5 | 0.20 | 0.28 | 0/85 | 16 | 5.0 | 28 | 0 |

- Cible v1.1 temps mort : ✅ 13 s en moyenne (cible < 90 s)
- Cible v1.1 similarité : ✅ 0 paire(s) de nuits consécutives au-dessus de 0.7 (cible : 0)
- Anti-spam : ✅ 4.5 lignes par minute réelle en moyenne (cible ≤ 6, soit ~1 ligne / 10 s) ; 0 fois 3 ambiances d’affilée (cible : 0)

Lignes les plus répétées (lignes vues au moins 2 fois dans une même campagne ; total de leurs occurrences sur ce passage) :
- 259 × « Les Mal Lunés rentre enfin sa terrasse. Vous notez l’heure, par principe. »
- 256 × « Plus une chaise dehors chez les Mal Lunés. Il aura fallu le temps. »
- 248 × « WhatsApp : 3 pièce(s) partagée(s). Seb : « 😱 On imprime tout pour la commission ! » »
- 243 × « Raclement de chaises sur les pavés : les Mal Lunés rentre sa terrasse… enfin. »
- 241 × « « À la nôtre ! » Une table entière se lève pour trinquer. Les verres tintent jusqu’à votre fenêtre. »
- 241 × « Police : « Ah, c’est encore vous… On note, monsieur. » Personne ne viendra. »
- 240 × « Le standard soupire avant de décrocher. Vous l’avez entendu soupirer. Personne ne viendra. »
- 237 × « Un touriste demande « la Grand-Place ? » à toute la terrasse. Six doigts pointent dans six directions. »
- 237 × « Le Goulot rentre enfin sa terrasse. Vous notez l’heure, par principe. »
- 237 × « Police : « Monsieur, encore vous ? On a d’autres priorités. » Personne ne viendra. »
- 235 × « Des talons sur les pavés : clac, clac, clac, puis un juron, puis plus de clac. »
- 233 × « Une sirène passe rue de la Barre, sans tourner. Ce n’est pas pour vous. Ce n’est jamais pour vous. »

## pacing-2 (lignes de la rue, anti-spam) · 2026-10-09 · main @ 2ffc2af

20 campagnes par bot (graines 1000…1019).

| Bot | Nuits | Temps mort moyen / nuit | Nuits > 90 s | Situations distinctes / nuit | Similarité moyenne (nuits consécutives) | Similarité max | Paires > 0,7 | Twists distincts | Lignes / min réelle | Pic sur 1 min | 3 ambiances d’affilée |
|---|---|---|---|---|---|---|---|---|---|---|---|
| passive | 259 | 0 s | 0 % | 37.9 | 0.16 | 0.28 | 0/239 | 22 | 3.3 | 8 | 0 |
| legal | 260 | 0 s | 0 % | 47.6 | 0.22 | 0.37 | 0/240 | 22 | 5.8 | 30 | 0 |
| reckless | 92 | 0 s | 0 % | 44.1 | 0.14 | 0.23 | 0/72 | 14 | 3.5 | 17 | 0 |
| stealthy | 241 | 79 s | 46 % | 39.4 | 0.16 | 0.28 | 0/221 | 21 | 3.1 | 14 | 0 |
| mixed | 260 | 0 s | 0 % | 47.5 | 0.22 | 0.36 | 0/240 | 23 | 5.8 | 30 | 0 |
| diplomat | 260 | 0 s | 0 % | 40.6 | 0.22 | 0.39 | 0/240 | 22 | 4.7 | 32 | 0 |
| slacker | 105 | 0 s | 0 % | 43.5 | 0.20 | 0.28 | 0/85 | 16 | 5.0 | 28 | 0 |

- Cible v1.1 temps mort : ✅ 13 s en moyenne (cible < 90 s)
- Cible v1.1 similarité : ✅ 0 paire(s) de nuits consécutives au-dessus de 0.7 (cible : 0)
- Anti-spam : ✅ 4.5 lignes par minute réelle en moyenne (cible ≤ 6, soit ~1 ligne / 10 s) ; 0 fois 3 ambiances d’affilée (cible : 0)

Lignes les plus répétées (lignes vues au moins 2 fois dans une même campagne ; total de leurs occurrences sur ce passage) :
- 260 × « Les Mal Lunés rentre enfin sa terrasse. Vous notez l’heure, par principe. »
- 260 × « Plus une chaise dehors chez les Mal Lunés. Il aura fallu le temps. »
- 250 × « WhatsApp : 3 pièce(s) partagée(s). Seb : « 😱 On imprime tout pour la commission ! » »
- 242 × « Le standard soupire avant de décrocher. Vous l’avez entendu soupirer. Personne ne viendra. »
- 241 × « Raclement de chaises sur les pavés : les Mal Lunés rentre sa terrasse… enfin. »
- 238 × « Police : « Ah, c’est encore vous… On note, monsieur. » Personne ne viendra. »
- 228 × « Des talons sur les pavés : clac, clac, clac, puis un juron, puis plus de clac. »
- 228 × « Un homme cherche ses clés à la lumière de son téléphone, entre deux pavés. Il les trouve dans sa poche. »
- 228 × « Police : « Monsieur, encore vous ? On a d’autres priorités. » Personne ne viendra. »
- 227 × « Au bout de la rue, la lampe de Klaas s’allume. Il a entendu quelque chose. »
- 226 × « Un touriste demande « la Grand-Place ? » à toute la terrasse. Six doigts pointent dans six directions. »
- 221 × « « À la nôtre ! » Une table entière se lève pour trinquer. Les verres tintent jusqu’à votre fenêtre. »

## v1.1 + pacing (variantes, raclements regroupés, vie de la rue) · 2026-10-08 · main @ 250f53a

20 campagnes par bot (graines 1000…1019).

| Bot | Nuits | Temps mort moyen / nuit | Nuits > 90 s | Situations distinctes / nuit | Similarité moyenne (nuits consécutives) | Similarité max | Paires > 0,7 | Twists distincts |
|---|---|---|---|---|---|---|---|---|
| passive | 260 | 0 s | 0 % | 34.3 | 0.20 | 0.40 | 0/240 | 22 |
| legal | 260 | 0 s | 0 % | 42.0 | 0.32 | 0.54 | 0/240 | 22 |
| reckless | 88 | 0 s | 0 % | 43.7 | 0.16 | 0.25 | 0/68 | 14 |
| stealthy | 230 | 81 s | 50 % | 36.3 | 0.19 | 0.36 | 0/210 | 21 |
| mixed | 260 | 0 s | 0 % | 42.0 | 0.31 | 0.46 | 0/240 | 22 |
| diplomat | 260 | 0 s | 0 % | 36.6 | 0.30 | 0.46 | 0/240 | 21 |
| slacker | 217 | 0 s | 0 % | 38.2 | 0.30 | 0.50 | 0/197 | 21 |

- Cible v1.1 temps mort : ✅ 12 s en moyenne (cible < 90 s)
- Cible v1.1 similarité : ✅ 0 paire(s) de nuits consécutives au-dessus de 0.7 (cible : 0)

Lignes les plus répétées (lignes vues au moins 2 fois dans une même campagne ; total de leurs occurrences sur ce passage) :
- 1288 × « Quelqu’un urine contre votre porte d’entrée. Classique du samedi. »
- 919 × « Jérémie passe avec le teckel et note Estaminet La Ch’tite Bernadette, table 1. »
- 914 × « Jérémie compte les tables à voix haute, Biloute renifle chaque pied de chaise, vous notez. Biloute s’arrête net devant chaque table qui débo… »
- 842 × « Jérémie passe avec le teckel et note Les Bouchers Mal Lunés, table 1. »
- 796 × « Jérémie passe avec le teckel et note Le Goulot, table 1. »
- 572 × « 📟 59 dB relevés et horodatés. »
- 522 × « La rue s’éteint. Une bouteille roule quelque part sur les pavés, puis plus rien. »
- 513 × « 01h30. La dernière chaise a raclé. La gaine s’est tue. Il reste quatre heures de nuit, en théorie. »
- 496 × « Les derniers clients remontent vers la place, en chantant faux. La rue se tait, à regret. »
- 400 × « 📟 36 dB. Pénible, mais pas assez pour un dossier. »
- 370 × « 📟 60 dB relevés et horodatés. »
- 347 × « Une table de les Mal Lunés rentre en traînant des pieds, comme un ado à l’heure du coucher. »

## v1.1 twists + variantes du serveur · 2026-10-08 · main @ 165b61e

20 campagnes par bot (graines 1000…1019).

| Bot | Nuits | Temps mort moyen / nuit | Nuits > 90 s | Situations distinctes / nuit | Similarité moyenne (nuits consécutives) | Similarité max | Paires > 0,7 | Twists distincts |
|---|---|---|---|---|---|---|---|---|
| passive | 260 | 432 s | 100 % | 7.5 | 0.48 | 0.71 | 30/240 | 0 |
| legal | 260 | 160 s | 98 % | 24.2 | 0.65 | 0.91 | 88/240 | 0 |
| reckless | 87 | 394 s | 92 % | 15.4 | 0.41 | 0.63 | 0/67 | 0 |
| stealthy | 229 | 351 s | 100 % | 15.2 | 0.43 | 0.85 | 7/209 | 0 |
| mixed | 260 | 168 s | 98 % | 24.6 | 0.62 | 0.92 | 72/240 | 0 |
| diplomat | 260 | 160 s | 98 % | 22.7 | 0.62 | 0.83 | 68/240 | 0 |
| slacker | 217 | 164 s | 99 % | 22.4 | 0.60 | 0.89 | 44/197 | 0 |

- Cible v1.1 temps mort : ❌ 248 s en moyenne (cible < 90 s)
- Cible v1.1 similarité : ❌ 309 paire(s) de nuits consécutives au-dessus de 0.7 (cible : 0)

Lignes les plus répétées (lignes vues au moins 2 fois dans une même campagne ; total de leurs occurrences sur ce passage) :
- 2559 × « Raclement de chaises sur les pavés : Les Bouchers Mal Lunés rentre une table… enfin. »
- 2272 × « Raclement de chaises sur les pavés : Estaminet La Ch’tite Bernadette rentre une table… enfin. »
- 1897 × « Raclement de chaises sur les pavés : Le Goulot rentre une table… enfin. »
- 1767 × « Le serveur, gêné : « Le patron sait que c’est vous qui appelez la police… » »
- 1478 × « Le serveur revient : « Le patron dit que les clients finissent leur verre. » »
- 1344 × « Raclement de chaises sur les pavés : Les Bouchers Mal Lunés rentre sa terrasse… enfin. »
- 1291 × « Raclement de chaises sur les pavés : Le Goulot rentre sa terrasse… enfin. »
- 1277 × « Quelqu’un urine contre votre porte d’entrée. Classique du samedi. »
- 997 × « Raclement de chaises sur les pavés : Le Goulot rentre une table. »
- 939 × « Police : « Ah, c’est encore vous… On note, monsieur. » Personne ne viendra. »
- 916 × « Jérémie passe avec le teckel et note Estaminet La Ch’tite Bernadette, table 1. »
- 914 × « Jérémie compte les tables à voix haute, Biloute renifle chaque pied de chaise, vous notez. Biloute s’arrête net devant chaque table qui débo… »

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
