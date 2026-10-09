# Copy proofread: French text (§13.I « French copy proofread »)

Owned by the content agent. Content files (`src/content/*.js`) are fixed directly; strings in code files are listed here for their owners.

## Conventions (all player-facing text)
- **Typography**: apostrophe ’ · « guillemets » with a no-break space (U+00A0) inside · narrow no-break space (U+202F) before ; ! ? · no-break space (U+00A0) before : · ellipsis … · inner quotes ‹ ›.
  Content is checked by `tests/unit/typography.test.js`. Code owners can reuse the same rules (the regexes are in that test). The content agent converted
  content with a string-literal-only script (it never touches code, comments, ids or conditions) and can run it on a code file on request.
- **Narration addresses Pilou as « vous »** (results, logs, recaps, tutorial, HUD).
- **Tu / vous with Pilou**: *tu* = Jérémie, Seb, Nico, Dédé, Stéphane. Théo the waiter: *vous* until `met_waiter`, *tu* after. Everyone else: *vous*.
- **Ch'ti**: at most one touch per scene (biloute, drache, estaminet, allez va, min p’tit, hein…).
- **Names**: the dachshund is Biloute, the chief is Commandant Desmet (municipal police: never « le commissaire », never the IGPN).
- **Length**: bubble / HUD strings ≤ 220 characters.

## Code strings (for their owners)

Line numbers re-checked on `main` at e46d826.

### Typography, everywhere in code strings (global row)
| File | Line | Current | Fixed | Owner |
|---|---|---|---|---|
| src/ui/*.js, src/main.js, src/sim/*.js (player-facing logs), src/config.js (names, labels), index.html | all | `'` between letters, plain spaces in « … » and before : ; ! ?, `...` | apply the conventions above (e.g. `Seau d'eau : ${n}` → `Seau d’eau : ${n}`) | UI / build · **applied** (copy-apply) |
| src/config.js | 61 | `Estaminet La Ch'tite Bernadette` (also in `PLACES` in content, now `Ch’tite`) | `Estaminet La Ch’tite Bernadette`, so the name renders the same in the HUD and on the cards | build · **applied** (copy-apply) |

### Wording, grammar, tu/vous, facts
| File | Line | Current | Fixed | Owner |
|---|---|---|---|---|
| src/sim/sim.js | 270 | Quelqu'un urine contre **ta** porte d'entrée. Classique du samedi. | Quelqu’un urine contre **votre** porte d’entrée. Classique du samedi. | build · **applied** (copy-apply) |
| src/sim/sim.js | 304 | … **approche-toi** à moins de ${…} m, dans la rue. | … Il faut mesurer : **approchez-vous** à moins de ${…} m, dans la rue. | build · **applied** (copy-apply) |
| src/sim/sim.js | 435 | Trop loin : on voit une main, pas une enveloppe. **Rapproche-toi.** | Trop loin : on voit une main, pas une enveloppe. **Rapprochez-vous.** | build · **applied** (copy-apply) |
| src/sim/sim.js | 455 | On sonne : la police, **pour toi**. Plainte du bloc pour « harcèlement ». Rappel à la loi. | On sonne : la police, **pour vous**. Plainte du bloc pour « harcèlement ». Rappel à la loi. | build · **applied** (copy-apply) |
| src/sim/sim.js | 458 | … Contrôle d'identité… rien à **te** reprocher. Le bloc a essayé. | … Contrôle d’identité… rien à **vous** reprocher. Le bloc a essayé. | build · **applied** (copy-apply) |
| src/sim/sim.js | 396 | Le teckel de Jérémie aboie comme un fou ! | Biloute, le teckel de Jérémie, aboie comme un fou ! | build · **applied** (copy-apply) |
| src/sim/summary.js | 47 | Le **commissaire** s'intéresse aux cafés offerts. Lemaire transpire. | La hiérarchie de la police municipale s’intéresse aux cafés offerts. Lemaire transpire. (Lemaire's meals are only known after `seen_complaisance`: keep it to that branch.) | build · **applied** (copy-apply) |
| src/sim/summary.js | 48 | Le bloc sait que c'est **toi qui appelles** au nom de l'Association. | Le bloc sait que c’est **vous qui appelez** au nom de l’Association. | build · **applied** (copy-apply) |
| src/sim/police.js | 124 | … café offert, 0 PV (${n} infraction(s) **visibles**) | … (${n} infraction(s) **visible(s)**) | build · **applied** (copy-apply) |
| src/sim/campaign.js | 559 | **L'IGPN** a bouclé son enquête : le brigadier Lemaire est muté. | L’enquête interne est bouclée : le brigadier Lemaire est muté. (The IGPN is national-police only; content says « enquête interne ».) | build · **applied** (copy-apply) |
| src/config.js | 245 | Enquête de **l'IGPN** ouverte (pot-de-vin photographié) | Enquête interne ouverte (pot-de-vin photographié) | build · **applied** (copy-apply) |
| src/config.js | 243 | Pilou a un gilet jaune **"livreur"** (encore moins reconnaissable) | Pilou a un gilet jaune « livreur » (encore moins reconnaissable) | build · **applied** (copy-apply) |
| src/ui/index.js | 147 | La rue existe ; les personnages… (plain space before ;) | La rue existe ; les personnages… (U+202F before ;) | UI · **applied** (copy-apply) |
| src/ui/index.js | 352 | 👁 Personne ne semble avoir **rien** vu. | 👁 Personne ne semble avoir vu quoi que ce soit. | UI · **applied** (copy-apply) |
| src/ui/rules.js | 39, 51 | `jusqu'au`, `n'est` | `jusqu’au`, `n’est` | UI · **applied** (copy-apply) |
| index.html | 35 | La **hotte du resto** souffle sous sa fenêtre. | La **gaine d’extraction** souffle sous sa fenêtre. (« gaine » everywhere else in the game) | build · **applied** (copy-apply) |
| index.html | 34 | `l'<b>Estaminet La Ch'tite Bernadette</b>` | `l’<b>Estaminet La Ch’tite Bernadette</b>` | build · **applied** (copy-apply) |
| index.html | 52 | 💬 Groupe WhatsApp de l'asso | 💬 Groupe WhatsApp « La Gaystapo » (read `WHATSAPP_GROUP` at runtime, so the v1.0 rename reaches this button) | build · **applied** (copy-apply) |
| index.html | 50–51 | Police municipale (en mon nom) / Police, « pour l'Association… » | fine, apart from the apostrophe | build · **applied** (copy-apply) |

## Applied (copy-apply)
Every code-string row above was applied by the content agent, changing **string literals only** (no logic):
- **tu → vous** in sim narration; « enquête interne » instead of the IGPN; « la hiérarchie de la police municipale » and « le Commandant Desmet » instead of « le commissaire » (including `sim.js` « Le commissaire veut voir ça »); Biloute named; « visible(s) »; « vu quoi que ce soit ».
- **index.html**: « gaine d’extraction »; typographic quotes and apostrophes. The phone's WhatsApp button now reads `WHATSAPP_GROUP` (`src/main.js`: one import + one `textContent`).
- **Typography** in `src/ui/*`, `src/main.js`, `src/sim/{sim,summary,police,campaign,nightActions,narrative,policies}.js`, `src/config.js`, `src/scene/director.js`, `src/art/portraits.js`, `src/world.js` (shop signs).
  String-literal-only conversion, reviewed change by change. GLSL, CSS, selectors and ids are excluded. The three `'seau d’eau'` comparisons were converted together.
- **Ids**: `igpn_open` → `inquiry_open`, `pm_igpn_report` → `pm_inquiry_report`, `press_igpn` → `press_inquiry`, `chef_igpn` → `chef_inquiry`, engine card/cause `'inquiry'`.
  The balance knob `CAMPAIGN.igpn` and code identifiers (`S.igpn`, `updateIgpn`) are unchanged. A save made before the rename keeps `igpn_open` in its flags, so an inquiry already open in such a save is forgotten (`SAVE_VERSION` not bumped: pre-1.0).
- **Test**: `tests/unit/typography.test.js` now also checks the displayed strings of `src/ui/{index,rules,phone}.js`, `src/main.js`, `src/config.js`, the sim's narration files and the text of `index.html`.
  Tests that matched the old spacing were updated (`rules`, `ui-rules`, `campaign`, `night.e2e`).

## Content (fixed directly)

| Pass | Commit | What |
|---|---|---|
| Typography | cb1b1f2 | Every content string converted to the conventions above by a string-literal-only script (1,128 lines in 11 files), plus `tests/unit/typography.test.js` and a README section. |
| Numbers | copy pass 2 | Thousands separated by a narrow no-break space (« 4 000 », « 80 000 »). |
| Proofread | copy pass 2 | 70+ text fixes across all 11 content files. Highlights below. Ids, flags, conditions, effects and `{placeholders}` are untouched. |

**Tu / vous**: Théo says *vous* before `met_waiter` (`serveur_suspicious`, `serveur_fired`) and *tu* after (`WAITER_LINES.theo.ok`). Hilde (`r_hilde_soup`) and Klaas (`r_klaas_roster`) said *tu* and now say *vous*.
Stage directions for Biloute and Gaufre now address Pilou as *vous*. Clode is consistently formal (« puis-je », « ce sont »). Pilou saying *tu* to Clode in a prompt is kept (it's a prompt).
**Ch'ti**: one double touch removed (`r_hilde_soup`: kept « chicon », dropped « min p’tit »). All others are spelled correctly and appear once per entry.
**Facts and coherence**: fixed counts of Tatie's promises removed (« sept réponses », « Troisième promesse »). Postings now agree everywhere: Lemaire → parcmètres de Lomme, Benali → Hellemmes.
« le Trou » is no longer revealed by `night_bucket` or by the `the_return` cocktail list without `knows_trou`. Vandamme bills « à l’heure entamée » as in his bio, and Lille has « quartiers », not « arrondissements ».
The braderie (September) became a summer-proof joke. Régis no longer offers Dédé a table at Dédé's own restaurant (`cm_regis_blunder`). The arithmetic in `r_consultation` is fixed.
**Grammar**: tense and mood fixes (`hilde_laxative`, `jeremie_ag_soon`, `pm_formal_notice`), agreement (`wa_cat_2`), « Il y reste dix-sept » (`lemaire.complaisance`), « me l’a dit », « à Tourcoing », « la une », missing commas.
**Length**: 9 press texts over 220 characters shortened to ≤ 220 (`press_inquiry`, `press_rule_2200`, `press_trou`, `press_saturday_1`, `press_residents`, `press_petition_duel`, `press_scandal`, `press_commission_eve`, `press_end_legal`).
No dialogue, Koddex, night or tutorial string is over 220 now. Intro cards and event/epilogue cards are paragraphs (all ≤ 600) and were left as they are.
**Tone**: no line is mean about a real group; Seb & Nico are written by their role throughout.

**Left as is, on purpose**: spoken « ne » dropped where it is the character's voice (Théo, Seb, Tatie); Tatie's lopsided proverbs (spelled correctly); « Le Commandant Desmet » capitalised as a name/title throughout.
