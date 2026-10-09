# Discrétion jouable (§12d.6, §13.N)

Généré par `scripts/stealth-measure.js` (`npm run measure:stealth -- --write --label "…"`). Une section par passage, la plus récente en haut.
Un essai est **réussi** quand l'acte illégal visé n'est vu par personne (`doNightAction(...).seen` vide). La diversion est jouée juste avant
l'acte (½ minute de jeu). Chaque essai repart d'une nuit neuve de la même campagne.

## après la passe d’équilibrage (2c55c77) · 2026-10-09 · main @ 7974dc8

200 graines (0 sans essai possible), nuit du J3, actes visés : night_stink_bomb, night_sabotage_chairs, night_sabotage_parasols, night_sabotage_locks, night_cardboard_exhaust.

| Situation | Essais | Réussis sans être vu | Cible |
|---|---|---|---|
| Sans aide, avant 1h (rue pleine) | 158 | 8 % | ✅ ≤ 10 % |
| Sans aide, après 1h (la rue s’est vidée : fenêtre voulue, §12d.4) | 42 | 64 % | (pas de cible) |
| Juste après une diversion | 1200 | 30 % | ✅ ≥ 30 % |
| Dans une fenêtre propice | 186 | 34 % | ✅ ≥ 30 %  |

Sans aide avant 1h, par acte : stink_bomb 13 % (31) · sabotage_chairs 7 % (30) · sabotage_parasols 10 % (31) · sabotage_locks 9 % (32) · cardboard_exhaust 3 % (34)

Qui voit quand c'est raté (nombre d'essais) : none → customers 62, seb_nico 24, klaas 20, ghislain 17, waiter 16, dede 10, jeremie 2 · diversion → customers 183, klaas 80, waiter 70, seb_nico 53, ghislain 53, dede 46, jeremie 10 · window → customers 9, seb_nico 4, dede 4, klaas 2, ghislain 2, waiter 2

Acte × diversion :
  stink_bomb         firecracker 48 % · call_landline 13 % · fake_alert 18 % · biloute_bark 18 % · wrong_pizza 40 % · ally_seb_nico – · ally_tatie – · ally_jeremie – · owner_delivery_call 13 % · owner_hygiene_rumour –
  sabotage_chairs    firecracker 57 % · call_landline 35 % · fake_alert 33 % · biloute_bark 30 % · wrong_pizza 35 % · ally_seb_nico – · ally_tatie – · ally_jeremie – · owner_delivery_call 35 % · owner_hygiene_rumour –
  sabotage_parasols  firecracker 43 % · call_landline 30 % · fake_alert 33 % · biloute_bark 30 % · wrong_pizza 33 % · ally_seb_nico – · ally_tatie – · ally_jeremie – · owner_delivery_call 30 % · owner_hygiene_rumour –
  sabotage_locks     firecracker 48 % · call_landline 28 % · fake_alert 33 % · biloute_bark 28 % · wrong_pizza 28 % · ally_seb_nico – · ally_tatie – · ally_jeremie – · owner_delivery_call 28 % · owner_hygiene_rumour –
  cardboard_exhaust  firecracker 35 % · call_landline 23 % · fake_alert 23 % · biloute_bark 13 % · wrong_pizza 30 % · ally_seb_nico – · ally_tatie – · ally_jeremie – · owner_delivery_call 18 % · owner_hygiene_rumour –

Par diversion : firecracker 46 % (200) · call_landline 26 % (200) · fake_alert 28 % (200) · biloute_bark 24 % (200) · wrong_pizza 33 % (200) · ally_seb_nico – (0) · ally_tatie – (0) · ally_jeremie – (0) · owner_delivery_call 25 % (200) · owner_hygiene_rumour – (0)

## balance-stealth · 2026-10-09 · main @ 58305ad

2000 graines (0 sans essai possible), nuit du J3, actes visés : night_stink_bomb, night_sabotage_chairs, night_sabotage_parasols, night_sabotage_locks, night_cardboard_exhaust.

| Situation | Essais | Réussis sans être vu | Cible |
|---|---|---|---|
| Sans aide, avant 1h (rue pleine) | 1595 | 9 % | ✅ ≤ 10 % |
| Sans aide, après 1h (la rue s’est vidée : fenêtre voulue, §12d.4) | 405 | 62 % | (pas de cible) |
| Juste après une diversion | 12000 | 31 % | ✅ ≥ 30 % |
| Dans une fenêtre propice | 1830 | 34 % | ✅ ≥ 30 %  |

Sans aide avant 1h, par acte : stink_bomb 8 % (318) · sabotage_chairs 8 % (311) · sabotage_parasols 10 % (311) · sabotage_locks 11 % (328) · cardboard_exhaust 10 % (327)

Qui voit quand c'est raté (nombre d'essais) : none → customers 680, seb_nico 270, waiter 206, klaas 188, ghislain 167, dede 95, jeremie 30 · diversion → customers 1903, klaas 727, waiter 581, seb_nico 559, ghislain 540, dede 393, jeremie 76 · window → customers 79, seb_nico 46, klaas 27, ghislain 24, waiter 24, dede 15, jeremie 11

Acte × diversion :
  stink_bomb         firecracker 47 % · call_landline 14 % · fake_alert 19 % · biloute_bark 23 % · wrong_pizza 35 % · ally_seb_nico – · ally_tatie – · ally_jeremie – · owner_delivery_call 14 % · owner_hygiene_rumour –
  sabotage_chairs    firecracker 50 % · call_landline 35 % · fake_alert 35 % · biloute_bark 29 % · wrong_pizza 35 % · ally_seb_nico – · ally_tatie – · ally_jeremie – · owner_delivery_call 34 % · owner_hygiene_rumour –
  sabotage_parasols  firecracker 49 % · call_landline 33 % · fake_alert 36 % · biloute_bark 30 % · wrong_pizza 35 % · ally_seb_nico – · ally_tatie – · ally_jeremie – · owner_delivery_call 33 % · owner_hygiene_rumour –
  sabotage_locks     firecracker 42 % · call_landline 28 % · fake_alert 31 % · biloute_bark 27 % · wrong_pizza 28 % · ally_seb_nico – · ally_tatie – · ally_jeremie – · owner_delivery_call 28 % · owner_hygiene_rumour –
  cardboard_exhaust  firecracker 43 % · call_landline 27 % · fake_alert 28 % · biloute_bark 24 % · wrong_pizza 33 % · ally_seb_nico – · ally_tatie – · ally_jeremie – · owner_delivery_call 20 % · owner_hygiene_rumour –

Par diversion : firecracker 46 % (2000) · call_landline 27 % (2000) · fake_alert 30 % (2000) · biloute_bark 26 % (2000) · wrong_pizza 33 % (2000) · ally_seb_nico – (0) · ally_tatie – (0) · ally_jeremie – (0) · owner_delivery_call 26 % (2000) · owner_hygiene_rumour – (0)

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
