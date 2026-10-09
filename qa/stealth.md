# Discrétion jouable (§12d.6, §13.N)

Généré par `scripts/stealth-measure.js` (`npm run measure:stealth -- --write --label "…"`). Une section par passage, la plus récente en haut.
Un essai est **réussi** quand l'acte illégal visé n'est vu par personne (`doNightAction(...).seen` vide). La diversion est jouée juste avant
l'acte (½ minute de jeu). Chaque essai repart d'une nuit neuve de la même campagne.

## stealth-v2 + §12e (fenêtres 5–8 min, diversions alliées) · avant la passe d’équilibrage · 2026-10-09 · main @ 7a0d8d5

200 graines (0 sans essai possible), nuit du J3, actes visés : night_stink_bomb, night_sabotage_chairs, night_sabotage_parasols, night_sabotage_locks, night_cardboard_exhaust.

| Situation | Essais | Réussis sans être vu | Cible |
|---|---|---|---|
| Sans aide, avant 1h (rue pleine) | 158 | 17 % | ❌ ≤ 10 % |
| Sans aide, après 1h (la rue s’est vidée : fenêtre voulue, §12d.4) | 42 | 64 % | (pas de cible) |
| Juste après une diversion | 1200 | 32 % | ✅ ≥ 30 % |
| Dans une fenêtre propice | 186 | 19 % | ❌ ≥ 30 %  |

Par diversion : firecracker 44 % (200) · call_landline 28 % (200) · fake_alert 30 % (200) · biloute_bark 28 % (200) · wrong_pizza 33 % (200) · ally_seb_nico – (0) · ally_tatie – (0) · ally_jeremie – (0) · owner_delivery_call 28 % (200) · owner_hygiene_rumour – (0)

## stealth-v2 (build agent) : attention, diversions, fenêtres des twists · 2026-10-09 · main @ 437e20e

200 graines (0 sans essai possible), nuit du J3, actes visés : night_stink_bomb, night_sabotage_chairs, night_sabotage_parasols, night_sabotage_locks, night_cardboard_exhaust.

| Situation | Essais | Réussis sans être vu | Cible |
|---|---|---|---|
| Sans aide, avant 1h (rue pleine) | 158 | 17 % | ❌ ≤ 10 % |
| Sans aide, après 1h (la rue s’est vidée : fenêtre voulue, §12d.4) | 42 | 64 % | (pas de cible) |
| Juste après une diversion | 1000 | 32 % | ✅ ≥ 30 % |
| Dans une fenêtre propice | 186 | 20 % | ❌ ≥ 30 %  |

Par diversion : firecracker 44 % (200) · call_landline 28 % (200) · fake_alert 30 % (200) · biloute_bark 28 % (200) · wrong_pizza 33 % (200)

## Référence avant le modèle d’attention (stealth-v2 partiel : nuit à 2h30, diversions en contenu) · 2026-10-09 · main @ d9c39cb

200 graines (0 sans essai possible), nuit du J3, actes visés : night_stink_bomb, night_sabotage_chairs, night_sabotage_parasols, night_sabotage_locks, night_cardboard_exhaust.

| Situation | Essais | Réussis sans être vu | Cible |
|---|---|---|---|
| Sans aide, avant 1h (rue pleine) | 158 | 17 % | ❌ ≤ 10 % |
| Sans aide, après 1h (la rue s’est vidée : fenêtre voulue, §12d.4) | 42 | 64 % | (pas de cible) |
| Juste après une diversion | 1000 | 28 % | ❌ ≥ 30 % |
| Dans une fenêtre propice | 0 | – | – ≥ 30 % (pas de sim.windowNow : fenêtres pas encore exposées) |

Par diversion : firecracker 30 % (200) · call_landline 28 % (200) · fake_alert 28 % (200) · biloute_bark 27 % (200) · wrong_pizza 28 % (200)
