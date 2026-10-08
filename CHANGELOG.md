# Journal des versions

Les grandes étapes de *Rue des Bouchers*, de la première nuit jouable à la v1.0. Le détail est dans l'historique git et dans
la checklist de [GAME_DESIGN.md](GAME_DESIGN.md) (§13).

## v1.0 · en préparation
La campagne complète, ses huit fins, équilibrée et relue. Reste la session de QA finale et le test de Lucas.
- **Les huit fins** ont chacune leur écran : une une de *La Voix du Nordiste*, un tableau en 3D, un épilogue construit à
  partir de ce que vous avez vraiment fait, et une galerie des fins découvertes (la fin secrète reste cachée).
- **L'équilibrage** : un simulateur joue 1000 campagnes par style de jeu (prudent, casse-cou, discret, diplomate…) et mesure
  la distribution des fins à chaque réglage ([qa/balance.md](qa/balance.md)).
- **Le Carnet** (touche C) : les gens, les lieux et les règles de la rue, qui se remplissent au fil des rencontres. Une aide
  « Comment jouer » et un écran « À propos ».
- **La relecture** : typographie française partout (apostrophes, guillemets, espaces insécables), tutoiement et vouvoiement
  cohérents, touches de ch'ti dosées, et un test qui garde tout ça en l'état.
- **La météo** : la drache vide les terrasses en quatre minutes, les pavés brillent sous la bruine.
- **Les finitions** : un écran de chargement, un écran d'erreur avec un rapport à copier, des réglages (vitesse du texte, grand
  texte, son, qualité graphique Bas/Moyen/Haut), et des sauvegardes qui survivent aux mises à jour.

## v0.8 · art
- Le regard se penche à la fenêtre de Pilou, et les tables de l'estaminet apparaissent juste en dessous.
- Qualité graphique réglable, détectée automatiquement au premier lancement.

## v0.7 · l'interface des journées
- Une vraie interface pour le jour : le terminal de Clode Kode le matin, les actions de l'après-midi groupées par couleur avec
  leur coût et la raison quand elles sont grisées, des portraits dans les dialogues, et un bilan de nuit riche (manchette, carnet
  de Klaas, main courante de la police, aperçu du téléphone).
- Le téléphone : le groupe WhatsApp de l'association, la presse et les réseaux, avec des notifications.

## v0.5 · les coups bas
- Caméras cachées, wifi et électricité de l'estaminet, carton sur l'extraction, boule puante, sabotage de la cuisine (sel et
  sucre inversés), faux avis, chaises dévissées, serveur soudoyé, pot-de-vin photographié.
- Le Risque monte avec chaque acte vu : avertissement, plainte, garde à vue.
- Une preuve obtenue illégalement ne compte pas devant la commission, mais intéresse la presse et l'enquête interne.
- Les personnages ont des expressions, des états et des portraits. Un metteur en scène fait vivre la rue la nuit (la pause
  cigarette du serveur, les jumelles de Klaas, la chatte au balcon, les patrouilles).

## v0.4 · la campagne
- Quatorze jours, du lundi au dimanche de la semaine suivante. Chaque jour : Koddex le matin, l'association l'après-midi, la
  rue la nuit.
- Les rendez-vous fixes : le dîner de Colette Verhaeghe (J4), les samedis sans voitures (J6, J13), l'assemblée générale (J7),
  l'inspectrice (J9), la réunion sur l'extraction (J11), la commission (J14).
- Les contre-offensives du bloc des restaurants, les e-mails « c'est en cours de résolution » de Tatie Bouchon, 184 dialogues
  contextuels (près de 300 répliques), le fil du téléphone, la sauvegarde dans le navigateur.
- Tout le texte vit dans `src/content/` comme des données, vérifié par un linter (drapeaux, conditions, spoilers).

## v0.3 · le style
- Les personnages en low-poly mignon, les façades flamandes à pignons, la place Maurice-Schumann, la chatte et le teckel.
- Des sons générés dans le navigateur : la foule, les chaises sur les pavés, le ronron de l'extraction, la cloche de 22h.

## v0.2 · la tension
- La simulation de la nuit est séparée du rendu, et testée.
- Les témoins et les lignes de vue : Klaas depuis la place, Seb et Nico au balcon, le serveur, les clients qui filment.
- La police municipale et ses trois patrouilles : le brigadier lent qui prévient l'estaminet, l'agent qui verbalise vraiment,
  le chef qui ne vient qu'après un scandale. Et « c'est encore vous » au quatrième appel.
- Les zones de terrasse invisibles, le couloir de passage, la vue « zones légales ».
- Le samedi : la foule, les gens qui boivent debout, les portes d'entrée arrosées.

## v0.1 · la première nuit
- Une nuit, un lundi, une rue. À la première personne : l'appartement de Pilou, la gaine sous la fenêtre, les tables trop
  remplies, le serveur, l'horloge, le téléphone, le dossier, le seau d'eau, et un bilan au petit matin.
