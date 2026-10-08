# Contribuer à Rue des Bouchers

Merci de passer par ici. Avant tout texte ou tout code, trois lectures : la politique de fiction ci-dessous, la bible de
l'histoire ([src/content/README.md](../src/content/README.md)) et le contrat du contenu ([GAME_DESIGN.md](../GAME_DESIGN.md), §14).

## 1. La politique de fiction (non négociable)

Le jeu se déroule dans une **vraie rue** de Lille, avec sa vraie géographie et ses vraies règles de terrasse en 2026. **Tout le
reste est inventé** : personnages, commerces, policiers, élus, institutions.

- N'utilisez que les noms fictifs déjà établis (`src/content/characters.js`, `PLACES`). Jamais le nom d'une vraie personne
  ou d'un vrai commerce, même pour une blague. `tests/unit/names.test.js` et le linter refusent une liste de noms réels.
- Ne présentez jamais les méfaits d'un personnage comme ceux d'une personne réelle.
- La satire vise une **situation** (les terrasses contre les riverains, les institutions complaisantes, la bureaucratie,
  Pilou lui-même), jamais l'identité des gens. Seb et Nico sont écrits par leur rôle (les voisins d'en face, les admins du
  groupe WhatsApp), sans humour sur qui ils sont.
- Les actes illégaux restent au niveau du jeu : un libellé, une conséquence, une réplique. **Jamais de mode d'emploi réel.**

## 2. Le format du contenu (§14 en bref)

Tout le texte du jeu est dans `src/content/*.js`, en **données pures** (pas de logique, pas de DOM), et tout est en français.
Le moteur (`src/sim/`) les lit et les évalue.

| Fichier | Export | Quoi |
|---|---|---|
| `characters.js` | `CHARACTERS`, `PLACES`, `WHATSAPP_GROUP` | Le casting (par id), les commerces, le nom du groupe WhatsApp |
| `flags.js` | `FLAGS` | Le registre des drapeaux : **tout drapeau utilisé doit y être déclaré** |
| `dialogue.js` | `DIALOGUE` | Les répliques contextuelles |
| `events.js` | `EVENTS` | Les événements fixes du calendrier et les événements aléatoires |
| `actions.js` | `ACTIONS` | Les actions du jour et de la nuit (légal, gris, illégal) |
| `countermoves.js` | `COUNTERMOVES` | Les contre-offensives du bloc des restaurants |
| `endings.js` | `ENDINGS` | Les huit fins et leurs épilogues modulaires |
| `koddex.js`, `media.js`, `night.js`, `intro.js`, `codex.js` | | Les matins chez Koddex, le téléphone, les lignes de la nuit, l'intro et le tutoriel, le Carnet |

**Conditions** (`when`, `requires`), toutes facultatives et combinées en ET :
`{ day: [min, max], phase: 'morning' | 'afternoon' | 'night', flags: [...], notFlags: [...], stats: { asso: '>=40' }, hidden: { corruption: '>50' }, chance: 0.3 }`

**Effets**, bornés de 0 à 100 par le moteur :
`{ sleep: -10, asso: +5, risk: +20, job: -5, dossier: +1, hostility: +10, corruption: -15, setFlags: [...], clearFlags: [...], evidence: { kind, quality, legal, label } }`

Les stats visibles sont `sleep`, `asso`, `risk`, `job`, `dossier`. `hostility` et `corruption` sont cachées.

## 3. Ajouter une réplique de dialogue

```js
// src/content/dialogue.js, dans la section du personnage
{
  id: 'hilde_drache',                 // unique dans le fichier
  speaker: 'hilde',                   // un id de CHARACTERS
  when: { flags: ['met_hilde', 'random_drache'], phase: 'afternoon' },
  lines: [
    'La pluie a vidé la terrasse en quatre minutes. J’ai fait une soupe pour fêter ça.',
  ],
  once: true,                         // une seule fois par partie
},
```

Les règles qui comptent :
- **La voix.** Relisez le champ `voice` du personnage dans `characters.js`. Hilde ne crie jamais, Klaas horodate et ne ment pas,
  Hippolyte vouvoie tout le monde, Dédé tutoie tout le monde.
- **Tu ou vous avec Pilou.** La narration dit *vous*. Jérémie, Seb, Nico, Dédé et Stéphane disent *tu*. Le serveur dit *vous*
  tant que `met_waiter` n'est pas posé, *tu* ensuite. Tous les autres disent *vous*.
- **Pas de spoiler.** Une réplique ne mentionne un fait qu'une fois débloqué : les repas offerts à Lemaire après
  `seen_complaisance`, le prénom du serveur après `met_waiter`, Régis comme traître après `traitor_known`, « le Trou » après
  `knows_trou`… (liste complète dans la bible, « Spoiler rule »).
- **220 caractères au plus par réplique** : au-delà, coupez en deux éléments de `lines`.
- **Le ch'ti avec parcimonie** : une touche par scène au maximum (biloute, drache, estaminet, allez va, min p’tit, hein).
- **La typographie française** : apostrophe ’, « guillemets » avec une espace insécable à l'intérieur, espace fine insécable
  avant ; ! ?, insécable avant :, points de suspension …. Le test vous indiquera la ligne fautive.
- Le nom du groupe WhatsApp vient toujours de la constante `WHATSAPP_GROUP`, jamais écrit en dur.

## 4. Ajouter un événement

```js
// src/content/events.js
{
  id: 'r_brocante',
  speaker: 'tatie',
  when: { phase: 'afternoon', day: [3, 12], flags: ['met_tatie'], chance: 0.2 },  // avec `chance` : événement aléatoire
  once: true,
  title: 'Brocante sur la place',
  text: 'Tatie Bouchon a sorti une table pliante sur la place Maurice-Schumann…',
  choices: [
    { label: 'Aider Tatie', effects: { asso: +2, sleep: -3 }, result: '…' },
    { label: 'Passer son chemin', result: '…' },        // un choix sans `requires` : toujours proposé
  ],
},
```

- Un événement **fixe** a un `day` et une `phase`, et se déclenche toujours ce jour-là. Un événement **aléatoire** a une
  condition `when` avec `chance`. Un événement joué pendant la nuit à une heure précise prend `at` (minutes depuis minuit).
- Chaque événement garde **au moins un choix sans `requires`**, pour ne jamais bloquer le joueur.
- Un nouveau drapeau se déclare dans `flags.js`, dans un bloc commenté à votre nom. **Il doit être posé quelque part**
  (`setFlags`), sinon le linter refuse toute condition qui l'attend, **et lu quelque part** (`flags` / `notFlags`), sinon il ne
  sert à rien.
- Ne touchez pas aux seuils d'équilibrage (`when` des fins et des contre-offensives, nombres des effets existants) sans en
  parler : ils sont réglés par le simulateur. Signalez plutôt le besoin dans les Build notes de `GAME_DESIGN.md`.

## 5. Vérifier avant d'envoyer

```sh
npx vitest run tests/unit/content-lint.test.js   # drapeaux déclarés et atteignables, locuteurs, conditions possibles, noms réels
npx vitest run tests/unit/typography.test.js     # typographie française du texte affiché
npx vitest run tests/unit/checklist.test.js      # la checklist v1.0 (§13), dont les quotas de répliques
npm test                                         # toute la suite unitaire
npm run sim -- --runs 200                         # vos ajouts sont-ils atteints ? (le simulateur liste le contenu jamais vu)
npm run story -- --bot legal --seed 3             # lire une partie entière en texte, pour juger du rythme
```

Puis jouez la scène pour de vrai (`npm run dev`). [qa/q-kit.md](../qa/q-kit.md) explique comment aller droit à un jour ou à un
état précis depuis la console du navigateur.
