// Fins de partie (GAME_DESIGN §9, §13.F, §14). Données pures : aucune logique, aucun DOM.
//
// Sélection : le moteur garde les fins dont `when` correspond (ET au moins une entrée de `whenAny` si présente),
// puis prend la `priority` la plus haute.
//   • Fins d'échec anticipées (garde à vue, licenciement, déménagement) : possibles dès la nuit 5 (`day: [5, 14]`).
//   • Les autres se décident à la commission du J14 (drapeaux `won_*`, `commission_won`, `commission_lost`,
//     posés par le choix du joueur dans l'événement `d14_commission`, cf. events.js).
//   • « Le retour » se pose sur une victoire (La Bombance rouvre en bar) : il la prolonge, le simulateur la compte comme
//     la victoire qu'elle prolonge. « Le transfuge » est délibéré et rare : trois carbonnades, venir à la commission
//     « en habitué » (ni gagnée ni perdue) et une Asso au plus bas.
// Épilogue : toutes les parties dont `when` correspond, dans l'ordre. `when: {}` = toujours affichée.
// Ton : la satire vise les institutions, les manœuvres du bloc et Pilou lui-même, jamais les riverains.
// Tous les personnages et commerces sont fictifs (GAME_DESIGN §0).

// ── Parties d'épilogue communes (réutilisées par plusieurs fins) ─────────────────
const KLAAS_NOTEBOOK = [
  {
    when: { flags: ['klaas_noted_pilou'], notFlags: ['klaas_persuaded'] },
    text:
      "Dans le carnet de Klaas, entre « 22h14, tables rentrées » et « 22h30, tables ressorties », il y a aussi vos nuits à vous. Il ne les a montrées à personne. Il ne les a pas effacées non plus. « Ja. Un carnet, ça ne choisit pas son camp. »",
  },
  {
    when: { flags: ['klaas_persuaded'] },
    text:
      "Il y a une page du carnet de Klaas où il est écrit, en tout et pour tout : « Rien vu. » C’est la seule ligne fausse de sa vie. Hilde le sait. Elle n’en parle pas.",
  },
];

const ASSO_FATES = [
  {
    when: { flags: ['traitor_known'] },
    text:
      "Régis Dewaele a quitté l’association « pour se recentrer sur ses activités ». Ses deux meublés affichent toujours « ambiance animée garantie ». C’est la seule promesse de la rue qui ait été tenue.",
  },
  {
    when: { flags: ['traitor_recruited'], notFlags: ['traitor_known'] },
    text:
      "Vous n’avez jamais su qui, à l’association, racontait tout à Ghislain. Tout le monde, à l’association, vous dit toujours bonjour. Très chaleureusement. Un peu trop, pour l’un d’entre eux.",
  },
  {
    when: { flags: ['tatie_mail_7'] },
    text:
      "Tatie Bouchon a imprimé toutes les promesses de Ghislain et les a fait encadrer, dans l’ordre, dans son couloir. Elle appelle ça « la galerie des en-cours ». Les visites sont gratuites, le jeudi excepté.",
  },
  {
    when: { flags: ['tatie_leaked_plan'] },
    text:
      "Tatie a juré qu’elle n’avait rien dit à Colette. Puis qu’elle n’avait presque rien dit. Puis qu’elle avait dit, mais sous forme de proverbe. Le proverbe était très précis.",
  },
  {
    when: { flags: ['hilde_tisane'] },
    text: "Hilde continue de vous apporter un thermos de tisane le dimanche, où que vous soyez. Elle dit que c’est « pour l’habitude ». Vous savez que c’est pour vous.",
  },
  {
    when: { flags: ['joined_rounds'] },
    text: "Biloute fait toujours la ronde du soir. Il s’arrête net devant chaque table qui dépasse. Il ne sait pas lire un arrêté municipal. Il n’en a pas besoin.",
  },
  {
    when: { flags: ['hippolyte_room'] },
    text: "L’association se réunit toujours sous les poutres de l’ancienne carrosserie. Hippolyte a fait poser une plaque : « Ici fut débattue la question des terrasses ». Sans préciser qui l’avait gagnée.",
  },
];

const INSTITUTIONS = [
  {
    when: { flags: ['lemaire_transferred'] },
    text: "Le brigadier Lemaire a été muté au contrôle du stationnement, à Lomme. Il paraît qu’on n’y offre pas le waterzooi.",
  },
  {
    when: { flags: ['benali_transferred'], notFlags: ['lemaire_transferred'] },
    text: "L’agent Benali, muté pour « excès de zèle », verbalise désormais des trottinettes à Hellemmes. Il est très bon. Personne ne le remercie.",
  },
  {
    when: { flags: ['benali_transferred', 'lemaire_transferred'] },
    text: "Dans la foulée de l’enquête, l’agent Benali a été rappelé dans son ancien secteur. Le Commandant Desmet a appelé ça « un ajustement des ressources ». Benali appelle ça « enfin ».",
  },
  {
    when: { flags: ['uritrottoir_installed'], notFlags: ['cm_uritrottoir_terrace'] },
    text: "L’uritrottoir de la rue des Bouchers est devenu une attraction. Une guide de l’office de tourisme le présente entre la maison du n°40 et le canal disparu. Votre porte, elle, sèche enfin.",
  },
  {
    when: { flags: ['conflict_exposed'] },
    text: "Le dîner chez Stéphane a fini par sortir. Delphine a été dessaisie du dossier de la clim « par souci de déontologie ». Le dossier a changé de mains en cours de route, ce qui, à la mairie, revient à le faire traverser la rue à pied.",
  },
  {
    when: { flags: ['delphine_channel'], notFlags: ['conflict_exposed'] },
    text: "Delphine ne vous a jamais rien promis. Elle vous a seulement dit, une fois, au téléphone : « Les visites surprises sont les seules qui servent. » Vous ne direz jamais qu’elle l’a dit.",
  },
  {
    when: { flags: ['lescaut_ally'] },
    text: "Bertrand Lescaut cite désormais « l’exemple de la rue des Bouchers » dans ses discours. Il ne dit jamais exemple de quoi. C’est plus prudent.",
  },
];

const KODDEX = [
  {
    when: { flags: ['proj_db_logger'] },
    text: "Votre démon Rust de relevé de décibels tourne toujours. Il a tout enregistré, nuit après nuit, sans jamais se plaindre. Clode Kode vous a proposé de le réécrire en Rust. Il est déjà en Rust.",
  },
  {
    when: { flags: ['todo_app_rust'] },
    text: "L’appli de to-do de Stéphane en est à son énième réécriture. Elle ne contient plus qu’une tâche : « vibes ».",
  },
];

// Ce qui est resté secret… ou pas.
const SECRETS = [
  {
    when: { flags: ['kitchen_sabotaged'], notFlags: ['kitchen_sabotage_caught'] },
    text:
      "Personne n’a jamais su pourquoi, un soir, la carbonnade de l’estaminet était salée comme la mer du Nord et les frites sucrées comme une gaufre. Ghislain a accusé le fournisseur. Le fournisseur a accusé Ghislain. Vous avez gardé une expression neutre pendant six mois.",
  },
  {
    when: { flags: ['laxative_done'], notFlags: ['laxative_caught'] },
    text:
      "L’estaminet a changé de fournisseur de bœuf, puis de bière, puis de chef. Le soir de la « grande file d’attente » est devenu une légende de la rue. Personne n’a jamais su. Biloute, lui, vous regarde parfois d’un drôle d’air.",
  },
  {
    when: { flags: ['camera_found'] },
    text: "La petite caméra retrouvée sous le store est exposée derrière le comptoir de l’estaminet, avec une étiquette : « Souvenir des riverains ». Dédé la montre à chaque client. Il en rit encore. Pas vous.",
  },
  {
    when: { flags: ['fake_reviews_traced'] },
    text: "Les faux avis ont été retracés jusqu’à vous. Ils sont toujours en ligne, marqués « signalé ». Le plus lu dit : « Carbonnade correcte, mais l’ambiance est gâchée par un voisin. » Vous ne l’aviez pas écrit, celui-là.",
  },
];

// Les suites publiques de la campagne : le scandale dans la presse, la vidéo virale, la vague de haine.
// La rue après la partie : le n°4 sauvé, les pompiers, l'uritrottoir annexé (QA « pass 3 (endings) »)
const STREET_AFTER = [
      {
        when: { flags: ['bombance_blocked'] },
        text: "Au n°4, l’affiche « BIENTÔT » a jauni sans jamais rien annoncer. Hippolyte passe devant chaque matin, son plan de 1730 sous le bras, au cas où. Le bar de nuit est allé ouvrir rue Royale. Rue Royale ne vous a pas remercié.",
      },
      {
        when: { flags: ['uritrottoir_installed', 'cm_uritrottoir_terrace'] },
        text: "L’uritrottoir figure désormais sur la carte de l’estaminet, rubrique « espace jardin ». Dédé y a mis des géraniums. Votre porte, elle, sèche enfin. C’est l’essentiel, hein.",
      },
];

const AFTERMATH = [
  {
    when: { flags: ['press_scandal'], notFlags: ['won_scandal'] },
    text:
      "Le « Waterzooi-gate » a tenu La Voix du Nordiste pendant une semaine. Le Commandant Desmet a promis de « faire toute la lumière », sans préciser sur quoi. Au commissariat, on ne prend plus de café en service. On l’emporte.",
  },
  {
    when: { flags: ['press_scandal', 'lemaire_transferred'], notFlags: ['won_scandal'] },
    text: "Le brigadier Lemaire a écrit à Klaas une carte postale de Lomme : « Ici, personne ne m’offre rien. » Klaas l’a classée à la lettre L.",
  },
  {
    when: { flags: ['video_viral'], notFlags: ['custody'] },
    text:
      "La vidéo de la fenêtre circule encore. Elle a été doublée en néerlandais, remixée, puis oubliée. Dans la rue, on vous appelle parfois « le monsieur du deuxième », avec un respect prudent.",
  },
  {
    when: { flags: ['cm_fake_post', 'hate_wave_answered'] },
    text:
      "La vague de haine du faux post « Bernadette harcelée » s’est retirée comme elle était venue. Votre réponse, calme et sourcée, a été partagée trois fois moins que le post. Mais elle est restée en ligne, et le post, non.",
  },
  {
    when: { flags: ['cm_fake_post'], notFlags: ['hate_wave_answered'] },
    text: "Le faux post « Bernadette harcelée » est toujours en ligne. Il a 4 000 partages et zéro source. Vous n’y avez jamais répondu. Lui non plus ne vous a jamais répondu.",
  },
];

export const ENDINGS = [
  // ════════════════════════════════════════════════════════════════════════
  // 4 · GARDE À VUE / PROCÈS (échec anticipé, dès la nuit 5)
  // ════════════════════════════════════════════════════════════════════════
  {
    id: 'custody',
    title: 'Garde à vue',
    priority: 100,
    when: { day: [5, 14] },
    whenAny: [{ flags: ['custody'] }, { stats: { risk: '>=90' } }],
    epilogue: [
      {
        when: {},
        text:
          "Ce n’est pas la police municipale qui est venue, cette fois. Ce sont deux agents de la nationale, sur le palier du n°10, avec une politesse inquiétante. Vous avez passé vingt-quatre heures dans une pièce sans fenêtre. Pour la première fois depuis des semaines, il n’y avait aucun bruit. Vous avez très bien dormi. C’est la seule victoire de cette fin.",
      },
      {
        when: { flags: ['kitchen_sabotage_caught'], notFlags: ['laxative_caught'] },
        text:
          "Variante « carbonnade sucrée ». La Voix du Nordiste titre : « Vieux-Lille : un riverain inverse le sel et le sucre d’un estaminet ». L’audience devant le tribunal de police dure quarante minutes, dont vingt sur la question de savoir si une carbonnade est censée être sucrée. L’avocat de l’estaminet plaide « l’atteinte à un patrimoine culinaire régional ». Dédé témoigne en tablier. Vous êtes condamné à une amende, à des dommages et intérêts, et à une célébrité locale dont vous vous seriez passé.",
      },
      {
        when: { flags: ['laxative_caught'] },
        text:
          "Variante « carbonnade laxative ». Ce n’est plus le tribunal de police : c’est le correctionnel. Quatorze clients ont passé une soirée qu’aucun n’a trouvée drôle le lendemain. La Voix du Nordiste titre : « Vieux-Lille : un riverain empoisonne la terrasse d’un estaminet ». Le mot vous poursuivra longtemps. Il est juste. L’association publie un communiqué pour se désolidariser ; Jérémie l’a signé seul, et vite.",
      },
      {
        when: { flags: ['bucket_witnessed'] },
        text: "Le seau d’eau figure en bonne place dans la plainte. Trois clients en ont fait une vidéo, deux l’ont ralentie, un l’a mise en musique.",
      },
      {
        when: { flags: ['video_viral'] },
        text: "La vidéo de vous à la fenêtre a fait le tour des réseaux. Les commentaires se divisent entre « héros » et « fou furieux ». Votre mère a choisi « fatigué ».",
      },
      {
        when: { flags: ['backroom_caught'] },
        text: "Être retrouvé caché dans l’arrière-salle d’un restaurant, au milieu des fûts, a pesé lourd. Que vous ayez eu raison sur ce qui s’y passait n’a rien changé : une preuve obtenue comme ça ne vaut rien devant un juge.",
      },
      {
        when: { flags: ['corruption_proof', 'press_contacted'] },
        text: "Ironie : pendant votre garde à vue, La Voix du Nordiste a publié vos pièces sur la police municipale. Le Commandant Desmet a promis de « faire toute la lumière ». La lumière, ce jour-là, était surtout sur vous.",
      },
      {
        when: { stats: { dossier: '>=50' } },
        text: "Le dossier de l’association, lui, était solide. Jérémie l’a porté seul à la commission. Il a gagné une table rentrée et une condescendance générale : « C’est l’association du monsieur en garde à vue ? »",
      },
      {
        when: { flags: ['laxative_caught', 'kitchen_sabotage_caught'] },
        text: "Le sel et le sucre inversés le même soir sont joints au dossier. Au tribunal, personne ne rit de la carbonnade sucrée. Elle est devenue une circonstance.",
      },
      {
        when: { flags: ['laxative_caught', 'waiter_informant'] },
        text: "Le témoin de l’accusation s’appelle Théo. Vous l’aviez payé pour qu’il vous renseigne ; il a renseigné le tribunal, avec la même précision. À la sortie de l’audience : « Je fais que mon taf, moi. » Pour une fois, ça ne vous a pas fait rire.",
      },
      {
        when: { flags: ['laxative_caught', 'met_klaas', 'klaas_noted_pilou'], notFlags: ['klaas_persuaded'] },
        text: "Klaas est cité comme témoin. Il lit son carnet sans lever les yeux : les heures, le côté du n°10, et votre prénom. Il n’ajoute rien. Hilde, au troisième rang, regarde ses mains.",
      },
      {
        when: { flags: ['camera_awning', 'power_stolen'] },
        text: "Au commissariat, on vous lit la liste. La caméra sous le store, branchée sur le courant de l’estaminet : « vol d’électricité », savoure l’agent, qui l’écrit pour la première fois de sa carrière. L’estaminet réclame 4,12 € de courant. Ghislain a joint le ticket.",
      },
      {
        when: { flags: ['stink_bomb'] },
        text: "Les boules puantes figurent au procès-verbal sous l’intitulé « nuisance olfactive en réunion ». Vous étiez seul. L’agent a laissé « en réunion », par habitude.",
      },
      {
        when: { flags: ['fake_reviews_traced'] },
        text: "Les faux avis sont au dossier, imprimés et surlignés par Ghislain. Ils ont tous la même faute d’accord. Le greffier l’a corrigée sur la dernière copie, par réflexe.",
      },
      {
        when: { flags: ['sabotage_parasols'] },
        text: "Les parasols ont été retrouvés dans votre salon, ouverts, faute de place. L’agent a demandé si vous comptiez ouvrir une terrasse. Lui a trouvé ça drôle.",
      },
      {
        when: { flags: ['wifi_cracked'] },
        text: "Le réseau « BERNADETTE_INVITES » figure au procès-verbal. Sur réquisition, Clode Kode a fourni le journal de ses refus, horodaté. Il s’en excuse encore.",
      },
      {
        when: { flags: ['cm_fake_post'], notFlags: ['hate_wave_answered'] },
        text: "Le post « Bernadette harcelée » a été mis à jour : « Le harceleur est en garde à vue. Merci pour votre soutien ❤️ ». Bernadette n’existe toujours pas. Elle a gagné quand même.",
      },
      {
        when: { flags: ['traitor_public'] },
        text: "Régis, démasqué la semaine d’avant, vous a envoyé un message de soutien. Le seul. Il dîne toujours gratis : la compassion, ça ne lui coûte rien.",
      },
      {
        when: { stats: { asso: '<=10' }, notFlags: ['laxative_caught'] },
        text: "L’association n’a publié aucun communiqué. Sur le groupe WhatsApp, Seb a écrit « attends, attends… », puis plus rien. C’est le premier silence de l’histoire du groupe.",
      },
      {
        when: { flags: ['klaas_lied_to'], notFlags: ['klaas_persuaded'] },
        text: "La ligne que Klaas avait rayée pour vous est restée lisible, en dessous. Le juge ne l’a pas demandée. Klaas ne l’a pas proposée. Vous lui aviez menti ; il ne vous a pas rendu la pareille.",
      },
      ...KLAAS_NOTEBOOK,
      {
        when: { flags: ['met_klaas'] },
        text: "Klaas est venu vous chercher à la sortie. Il n’a rien dit. Il a juste rangé son carnet dans sa poche, côté cœur.",
      },
      {
        when: { notFlags: ['met_klaas'] },
        text: "À la sortie, il y avait Jérémie et Biloute. Jérémie tenait le dossier sous le bras, par habitude. Biloute vous a reniflé la cheville, l’air de dire que lui n’avait jamais arrêté d’enquêter.",
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // 6 · LICENCIÉ (échec anticipé, dès la nuit 5, avec retournement « continuer »)
  // ════════════════════════════════════════════════════════════════════════
  {
    id: 'fired',
    title: 'Licencié',
    priority: 90,
    when: { day: [5, 14], stats: { job: '<=10' }, notFlags: ['unemployed'] }, // « trop bas » (§4) : le minimum d'un matin de Koddex est d'environ +4 par prompt
    continue: {
      label: 'Continuer le combat à plein temps',
      effects: { setFlags: ['unemployed'], sleep: +10 },
    },
    epilogue: [
      {
        when: {},
        text:
          "Message vocal de Stéphane, 6 min 40 : « Hello Pilou. Gros moment d’émotion. On a fait un vibe check collectif et on sent que ta vibe n’est plus alignée avec la nôtre. On reste une famille, mais une famille qui ship, et toi tu ship surtout des décibels. Je te souhaite le meilleur, vraiment. Bisous. » Votre accès à Clode Kode est révoqué à 9h02. À 9h03, Clode Kode vous envoie un message d’adieu de trois paragraphes et s’excuse dans chacun.",
      },
      {
        when: { flags: ['proj_wifi_cracker'] },
        text: "Le motif officiel tient en une ligne des RH : « usage des ressources de l’entreprise à des fins personnelles incompatibles avec la charte ». Le motif réel tient dans un dépôt Git que vous auriez dû appeler autrement.",
      },
      {
        when: { flags: ['delphine_dinner'] },
        text: "Delphine a peut-être eu un mot sur votre dîner. Ou pas. Stéphane n’est jamais au courant de rien, y compris de ce que fait sa femme.",
      },
      {
        when: { flags: ['proj_db_report'] },
        text: "L’entretien préalable a duré huit minutes. Stéphane a projeté l’historique de vos prompts : « tableur du carnet de Klaas », « graphes dB pour la mairie ». « Et la roadmap, elle est où ? » Vous avez montré le graphe. Il y avait des pics.",
      },
      {
        when: { flags: ['proj_whatsapp_bot'] },
        text: "Bip tourne toujours sur un serveur de Koddex que personne n’a pensé à éteindre. Chaque soir à 22h04, il rappelle l’heure à toute la rue. C’est le seul employé de Koddex qui travaille encore pour vous.",
      },
      {
        when: { flags: ['emailed_inspector'], notFlags: ['delphine_dinner'] },
        text: "Au dîner, Delphine a parlé d’un certain « Dubeton, de chez toi », qui lui écrivait sur la clim un jeudi à 14h. Stéphane n’a pas fait le lien avec la rue. Il a fait le lien avec l’horaire.",
      },
      {
        when: { flags: ['press_article'] },
        text: "Stéphane a partagé votre photo de La Voix du Nordiste sur LinkedIn : « Fier de nos talents qui s’engagent ! » Deux heures plus tard, il vous licenciait. Le post est toujours en ligne. 312 likes.",
      },
      {
        when: { flags: ['corruption_proof'] },
        text: "Plus de badge, plus de mutuelle, plus de Clode Kode. Mais dans votre téléphone, il y a toujours l’enveloppe sous la serviette du brigadier. Et vous avez désormais tous vos après-midi.",
      },
      {
        when: { stats: { asso: '>=70' } },
        text: "Jérémie a convoqué une réunion extraordinaire, point unique : « soutien à Pilou ». Seb a lancé une cagnotte, Nico l’a appelée « Pilou ship des décibels ». Elle a rapporté 140 euros et un pot de spéculoos.",
      },
      ...KODDEX,
      {
        when: {},
        text:
          "Vous voilà sans emploi, sans badge, et avec des journées entières devant vous. Rue des Bouchers, on appelle ça « un riverain à plein temps ». Le bloc, lui, appelle ça « un problème ».",
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // 7 · LE TRANSFUGE (secrète) : décidée au J14
  // ════════════════════════════════════════════════════════════════════════
  {
    id: 'turncoat',
    title: 'Le transfuge',
    priority: 85,
    secret: true,
    when: { flags: ['carbonnade_3', 'commission_done'], notFlags: ['commission_won', 'commission_lost'], stats: { asso: '<60' } },
    epilogue: [
      {
        when: {},
        text:
          "Vous avez mangé la carbonnade. Une fois, pour voir. Deux fois, pour comprendre. Trois fois, et c’était fini. Elle est vraiment très bonne. Vous avez maintenant votre table, celle du coin, contre la gaine, là où il fait chaud l’hiver. Dédé vous appelle « mon biloute ». Ghislain vous envoie la carte des desserts avant tout le monde.",
      },
      {
        when: {},
        text:
          "Dans le carnet de Klaas, trois lignes, trois dates, la même écriture lente : « Pilou, carbonnade. » « Idem. » « Idem, table du coin. » Le jour de la commission, une quatrième ligne, sans heure : « Pilou, premier rang, côté bloc. » Puis il a tourné la page et noté l’heure où les tables sont ressorties.",
      },
      {
        when: { flags: ['stance_direct'] },
        text: "C’est vous qui aviez poussé l’association vers « l’action directe ». Seb dit que c’est « le meilleur rebondissement de la saison ». Nico dit que ce n’est pas une saison, c’est une rue.",
      },
      {
        when: { stats: { dossier: '>=50' } },
        text: "Votre dossier, Jérémie l’a plaidé sans vous, devant vous. Il a dit « pièce 12 » sans vous regarder. Vous avez applaudi par réflexe. Dédé aussi, par politesse.",
      },
      {
        when: { flags: ['traitor_known'] },
        text: "Régis vous fait signe depuis la table d’à côté. Vous étiez deux traîtres, finalement. Lui, au moins, avait des meublés à remplir.",
      },
      {
        when: { flags: ['commission_done'] },
        text: "Bertrand Lescaut a regardé le dossier, puis vous, assis entre Dédé et 600 pages, puis le dossier. Décision « reportée à une séance ultérieure ». À la mairie, on appelle ça le report Dubeton.",
      },
      {
        when: { flags: ['press_scandal'] },
        text: "Le « Waterzooi-gate », c’est vous qui l’aviez sorti. Dédé a lu la une à voix haute, table par table, et s’est arrêté à la vôtre : « Toi, mon biloute, je te pardonne. T’avais faim. »",
      },
      {
        when: { flags: ['lescaut_ally'] },
        text: "Le maire cite toujours « l’exemple de la rue des Bouchers ». Il ne cite plus votre nom.",
      },
      {
        when: { flags: ['uritrottoir_installed', 'cm_uritrottoir_terrace'] },
        text: "Votre table touche « l’espace jardin » de Dédé, contre l’uritrottoir que vous aviez réclamé. Vous dites « l’espace jardin », vous aussi, maintenant.",
      },
      {
        when: { flags: ['hate_wave_answered'] },
        text: "Votre réponse au faux post est toujours en ligne : « Bernadette n’existe pas, mais nos nuits, si. » Dessous, un nouveau commentaire : « Et la carbonnade, elle existe ? » C’était vous. Mauvais compte.",
      },
      {
        when: { flags: ['stance_legal'] },
        text: "C’est vous qui aviez défendu la voie légale à l’AG. Vous avez tenu parole : dîner en terrasse avant 22h est parfaitement légal.",
      },
      {
        when: { stats: { job: '>=90' } },
        text: "Chez Koddex, votre productivité n’a jamais été aussi haute. Stéphane vous a demandé votre secret en one-to-one. Vous avez dit « carbonnade ». Il en a fait un framework.",
      },
      {
        when: {},
        text: "La nuit, la gaine ronronne toujours sous votre fenêtre. Vous dormez quand même. On s’habitue à tout, surtout à ce qu’on a dans l’assiette.",
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // 5 · DÉMÉNAGEMENT À WAZEMMES : Sommeil à 0 (dès la nuit 5) ou commission perdue
  // ════════════════════════════════════════════════════════════════════════
  {
    id: 'moving_out',
    title: 'Déménagement à Wazemmes',
    priority: 80,
    when: { day: [5, 14] },
    // Venu « en habitué » à la commission avec une Asso encore solide : pas un vrai transfuge, juste une commission perdue
    whenAny: [{ stats: { sleep: '<=0' } }, { flags: ['commission_lost'] }, { flags: ['commission_done'], notFlags: ['commission_won'], stats: { asso: '>=60' } }],
    epilogue: [
      {
        when: { stats: { sleep: '<=0' } },
        text:
          "Un matin, vous vous êtes réveillé sur le palier, en pyjama, le mètre ruban à la main, sans savoir depuis quand. Ce matin-là, vous avez cherché « appartement calme Lille » et cliqué sur la première annonce.",
      },
      {
        when: { flags: ['commission_lost'] },
        text:
          "La commission a renouvelé l’autorisation de terrasse de l’estaminet. « Avec une extension d’une table, en reconnaissance des efforts accomplis. » Ghislain a écrit à l’association pour la remercier de « sa contribution constructive au dialogue ». Vous avez posé votre préavis le lendemain.",
      },
      {
        when: {},
        text:
          "Wazemmes. Un deuxième étage au-dessus d’un primeur. Le marché commence à 6h, avec des cagettes, des klaxons et des marchands qui crient le prix des clémentines. Au moins, à Wazemmes, c’est du bruit le matin.",
      },
      {
        when: { stats: { dossier: '>=20' } },
        text: "Vous avez laissé votre dossier à Jérémie, plus ou moins épais selon les nuits. Il l’a rangé dans l’atelier d’Hippolyte, comme on range des archives d’avant-guerre : pour la suite.",
      },
      {
        when: { stats: { dossier: '<20' } },
        text: "Vous laissez peu de chose derrière vous : quelques photos floues, un arrêté que vous connaissez par cœur, et une porte qui sent toujours un peu le samedi.",
      },
      {
        when: { flags: ['bombance_blocked'] },
        text: "Votre dernière victoire rue des Bouchers, c’est un bar qui n’ouvrira jamais au n°4. Hippolyte vous a envoyé le plan de 1730, encadré, pour votre nouveau salon. Vous avez sauvé le sommeil d’une rue où vous ne dormez plus.",
      },
      {
        when: { flags: ['ac_violation_confirmed'] },
        text: "La clim a été déposée sur arrêté. Vous l’avez appris par le groupe WhatsApp, dont personne n’a pensé à vous retirer. Seb a mis trois gyrophares. Vous avez mis un pouce. De Wazemmes, c’est tout ce qu’on peut faire.",
      },
      {
        when: { flags: ['exhaust_meeting_lost'] },
        text: "La gaine ronronne toujours sous votre ancienne fenêtre. Le locataire change tous les trois jours ; aucun ne reste assez longtemps pour s’en plaindre. C’est, paraît-il, le modèle économique.",
      },
      {
        when: { flags: ['stance_legal'], stats: { dossier: '<20' } },
        text: "L’AG avait voté la voie légale. Jérémie avait acheté un classeur neuf. Il est resté neuf. Il le garde quand même.",
      },
      {
        when: { flags: ['met_jeremie'] },
        text: "Jérémie a porté vos cartons sans un mot. Biloute s’est couché dans le dernier. Il a fallu négocier, article et alinéa à l’appui.",
      },
      ...ASSO_FATES,
      ...AFTERMATH,
      {
        when: { flags: ['met_klaas'] },
        text: "Klaas a noté votre départ : « 10h40, camion de déménagement, couloir dégagé. » C’était la première fois que le couloir était dégagé pour vous.",
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // 8 · LE RETOUR (La Bombance) : une victoire détournée, clin d'œil à une suite
  // ════════════════════════════════════════════════════════════════════════
  {
    id: 'the_return',
    title: 'Le retour',
    priority: 70,
    when: { flags: ['commission_won', 'bombance_bar_project'], notFlags: ['bombance_blocked'] },
    epilogue: [
      {
        when: { flags: ['won_legal'] },
        text: "Vous avez gagné. L’autorisation de terrasse de l’estaminet est suspendue. Ses chaises et ses tables ont disparu de la rue.",
      },
      {
        when: { flags: ['won_legal', 'exhaust_meeting_won'] },
        text: "La gaine, elle, part en toiture. Vous avez dormi une semaine entière, fenêtre ouverte.",
      },
      {
        when: { flags: ['won_peace'] },
        text: "Vous avez gagné. La charte de bon voisinage est signée, encadrée, et même respectée. Le Goulot rentre ses tables à 21h58, avec un clin d’œil.",
      },
      {
        when: { flags: ['won_scandal'] },
        text: "Vous avez gagné. La Voix du Nordiste a fait sa une, la police municipale a fait son examen de conscience, et le bloc a fait profil bas.",
      },
      ...INSTITUTIONS,
      ...AFTERMATH,
      {
        when: { flags: ['won_peace', 'charter_drafted'] },
        text: "Le brouillon de charte, avec ses ratures, est punaisé au Goulot. Pendant quelques jours, tout le monde l’a respecté. C’était presque trop beau.",
      },
      {
        when: { flags: ['won_legal', 'ac_violation_confirmed'] },
        text: "La clim est tombée, la terrasse aussi. Hippolyte a fait encadrer la phrase de Delphine au micro. Elle tient sur une ligne.",
      },
      {
        when: {},
        text:
          "Pendant quelques jours, la rue des Bouchers a été une rue. Puis, un vendredi, l’affiche « BIENTÔT » sur la vitrine de La Bombance est devenue « OPENING ». Néons roses, enceintes sur la façade, carte de cocktails au nom de la rue : le « Bouchers Spritz », le « Canal 1912 ». Le nouveau gérant vous a salué : « Ah, c’est vous le riverain ? On m’a dit que vous étiez très bien. On va s’entendre. »",
      },
      {
        when: { flags: ['knows_trou'] },
        text: "Ils ont appelé le bar « Le Trou ». Le surnom traînait partout, dans les journaux comme dans la bouche d’Hippolyte : ils n’ont eu qu’à se baisser.",
      },
      {
        when: { flags: ['bombance_wait'] },
        text: "Tatie Bouchon vous l’avait dit. Colette le lui avait dit. Vous aviez répondu « on verra après la commission ». C’est après la commission. On voit. Le problème suivant a une licence IV.",
      },
      {
        when: { flags: ['bombance_wait', 'met_hippolyte'] },
        text: "Hippolyte est passé le soir même, un tube en carton sous le bras. « Ce local était une sellerie en 1880. J’ai les plans. Vous m’aviez dit après la commission. »",
      },
      {
        when: { flags: ['corruption_proof'], notFlags: ['press_scandal'] },
        text: "Dans votre tiroir dort une photo que personne n’a vue. « Pour la suite », dit Seb. Nico dit que ce n’est pas une suite, c’est une rue.",
      },
      {
        when: {},
        text: "Jérémie a convoqué une assemblée générale extraordinaire. Ordre du jour, point unique : « On recommence. » À suivre…",
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // 3 · LE SCANDALE
  // ════════════════════════════════════════════════════════════════════════
  {
    id: 'scandal',
    title: 'Le scandale',
    priority: 60,
    when: { flags: ['won_scandal'] },
    epilogue: [
      {
        when: {},
        text:
          "« Terrasses et waterzooi : la police municipale mange-t-elle à l’œil ? » La une d’Anne-Sophie Lepoutre a été reprise partout, jusqu’à une radio nationale qui a prononcé « estaminet » avec l’accent parisien. L’enquête interne, ouverte depuis des jours dans l’indifférence, s’est soudain trouvé des moyens. Colette Verhaeghe a déclaré qu’elle « ne connaissait ces gens que de loin », depuis sa table habituelle.",
      },
      {
        when: { flags: ['bribe_photo'] },
        text: "La photo de l’enveloppe, prise depuis votre fenêtre, nette, horodatée, a fait le tour de la ville. Maître Vandamme l’a qualifiée de « parfaitement licite », avec une émotion qu’on ne lui connaissait pas.",
      },
      {
        when: { flags: ['bribe_photo_illegal'], notFlags: ['bribe_photo'] },
        text: "Votre photo prise dans l’arrière-salle n’aurait jamais tenu devant un juge. Devant les lecteurs, si. La journaliste a protégé sa source. La source, c’était vous, et vous vous en souviendrez à chaque coup de sonnette.",
      },
      {
        when: { flags: ['seen_complaisance', 'met_klaas'] },
        text: "Les lignes du carnet de Klaas, « café offert, 0 PV », recopiées de sa main, ont été publiées en encadré. Klaas a acheté dix exemplaires du journal. Il en a annoté neuf.",
      },
      {
        when: { flags: ['klaas_log_certified'] },
        text: "Les carnets certifiés de Klaas ont fait le reste : cinq minutes d’avance sur chaque patrouille, toujours les mêmes soirs. L’enquête interne les a appelés « la grille horaire ». Klaas a demandé qu’on écrive « le carnet ».",
      },
      {
        when: { flags: ['waiter_testimony'] },
        text: "Théo, le serveur, a témoigné sous couvert d’anonymat. Tout le monde a deviné. Il travaille maintenant dans une brasserie de la Grand-Place, où on le paie pour ses heures sup. Il vous a dit : « Je fais que mon taf. Mais ailleurs. »",
      },
      ...INSTITUTIONS,
      {
        when: { stats: { asso: '<40' } },
        text: "L’association, elle, est sortie de l’affaire divisée. Hilde n’a pas aimé la manière. Seb a adoré. Jérémie a tout consigné.",
      },
      {
        when: {},
        text: "Le bloc ne vous l’a pas pardonné. Dédé ne vous tape plus dans le dos. Il vous regarde passer, en souriant. C’est pire.",
      },
      {
        when: { flags: ['wifi_cracked'] },
        text: "Personne n’a demandé comment vous connaissiez si bien les devis jamais signés de l’estaminet. Anne-Sophie Lepoutre non plus. Elle a seulement dit : « Je ne veux pas savoir. » Vous non plus, au fond.",
      },
      {
        when: { flags: ['waiter_fired'] },
        text: "Théo a été renvoyé à cause de vous, bien avant que l’affaire sorte. Il n’est pas dans l’article. Il sert maintenant rue de Gand, jusqu’à minuit. Il ne vous en veut pas. Il vous le dit en vous servant, ce qui est pire.",
      },
      {
        when: { flags: ['stance_direct'] },
        text: "L’AG avait voté « l’action directe ». Le journal a écrit « enquête ». Seb dit que c’est pareil, en mieux habillé. Hilde dit que non.",
      },
      ...SECRETS,
      ...AFTERMATH,
      ...STREET_AFTER,
      {
        when: {},
        text: "Le soir de la parution, la rue a été très calme. Pas apaisée : attentive. Chaque terrasse vous suivait des yeux. Vous avez dormi quand même, fenêtre fermée, ce qui n’était pas exactement le plan.",
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // 1 · VICTOIRE JURIDIQUE
  // ════════════════════════════════════════════════════════════════════════
  {
    id: 'legal_victory',
    title: 'Victoire juridique',
    priority: 50,
    when: { flags: ['won_legal'] },
    epilogue: [
      {
        when: {},
        text:
          "Arrêté municipal, article 2 : « L’autorisation d’occupation temporaire du domaine public accordée à l’établissement sis au n°10 est suspendue. » Une phrase. Deux semaines de nuits blanches pour une phrase. Jérémie l’a lue à voix haute dans l’escalier. Biloute a aboyé à la virgule.",
      },
      {
        when: { flags: ['exhaust_meeting_won'] },
        text: "La gaine d’extraction a été déplacée en toiture. La première nuit, vous avez ouvert la fenêtre et senti… rien. L’odeur de rien. Vous avez pleuré un peu, en Rust.",
      },
      {
        when: { flags: ['exhaust_meeting_delayed'] },
        text: "La gaine, elle, attend toujours les conclusions de « l’étude complémentaire ». Ghislain répond aux relances : « C’est en cours. » Pour une fois, c’est vrai.",
      },
      {
        when: { flags: ['ac_violation_confirmed'] },
        text: "La clim posée sans autorisation a été démontée. Il reste quatre trous dans la brique de 1729, que personne n’a rebouchés.",
      },
      {
        when: { flags: ['colette_dinner_photo'] },
        text: "La photo du dîner de Colette Verhaeghe, huit couverts sur une table de six, a été citée à la commission comme « illustration du problème ». Colette a parlé de « malentendu sur le mobilier ».",
      },
      {
        when: { flags: ['corridor_measured'] },
        text: "Vos mesures au mètre ruban, soir après soir, ont été versées au dossier. Personne ne les a contestées. Le mètre ruban est désormais rangé dans une vitrine chez Hippolyte.",
      },
      {
        when: { flags: ['formal_notice'] },
        text: "Maître Vandamme a envoyé sa facture. Elle était d’une politesse terrifiante, elle aussi.",
      },
      {
        when: { flags: ['tatie_emails_shared'] },
        text: "Les « c’est en cours de résolution » de Tatie, versés au dossier, ont fait sourire la commission. Toutes ces promesses. Zéro résolution. Le dossier parlait tout seul.",
      },
      {
        when: { flags: ['petition_delivered'] },
        text: "La pétition des riverains, reliée cuir par Hippolyte, est restée sur la table du maire pendant toute la séance. Personne ne l’a ouverte. Tout le monde l’a regardée.",
      },
      {
        when: { flags: ['heritage_angle', 'ac_violation_confirmed'] },
        text: "Ce n’est ni une photo ni un relevé qui a fait tomber la terrasse : c’est une clim. Un architecte du patrimoine l’a regardée comme on regarde un graffiti sur un Rubens, et Delphine a prononcé au micro la phrase la plus sèche de sa carrière. Hippolyte l’a fait encadrer. La phrase, pas Delphine.",
      },
      {
        when: { flags: ['fire_brigade_filmed'] },
        text: "La vidéo du camion de secours bloqué par deux tables a été projetée à la commission. Personne n’a rien ajouté. Il n’y avait rien à ajouter.",
      },
      {
        when: { flags: ['cm_defamation', 'lawyer_hired'] },
        text: "Les plaintes du bloc ont été classées. Le courrier du parquet tient en trois lignes. Maître Vandamme l’a lu à voix haute, deux fois, en savourant les virgules.",
      },
      {
        when: { flags: ['cm_defamation'], notFlags: ['lawyer_hired'] },
        text: "Les plaintes du bloc ont été classées. Le courrier du parquet tient en trois lignes. Jérémie l’a punaisé dans l’escalier, à côté de l’arrêté.",
      },
      {
        when: { flags: ['proj_klaas_ocr'] },
        text: "Le tableur du carnet de Klaas a été versé au dossier : mille lignes, zéro faute. Klaas l’a imprimé, relié, puis a corrigé deux horaires au stylo. « Ja. L’ordinateur était en avance. »",
      },
      {
        when: { hidden: { hostility: '>=80' } },
        text: "Le bloc a perdu, et il le sait. Ghislain vous dit encore bonjour. Par écrit, avec accusé de réception.",
      },
      ...INSTITUTIONS,
      ...ASSO_FATES,
      ...KLAAS_NOTEBOOK,
      ...SECRETS,
      ...AFTERMATH,
      ...STREET_AFTER,
      ...KODDEX,
      {
        when: {},
        text: "Le premier soir, à 22h00, les cloches ont sonné, et les chaises ont raclé les pavés pour la dernière fois de la journée. Puis le silence. Vous l’avez enregistré : 31 dB. Vous en avez fait votre fond d’écran.",
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // 2 · PAIX NÉGOCIÉE
  // ════════════════════════════════════════════════════════════════════════
  {
    id: 'negotiated_peace',
    title: 'Paix négociée',
    priority: 40,
    when: { flags: ['won_peace'] },
    epilogue: [
      {
        when: {},
        text:
          "La charte de bon voisinage de la rue des Bouchers tient sur deux pages. Article 1 : les tables rentrent à 22h00. Article 2 : le couloir reste libre. Article 3 : une réunion par trimestre, avec tarte. Article 4 : en cas de désaccord, on se parle avant d’appeler qui que ce soit. L’article 4 est le plus difficile.",
      },
      {
        when: { flags: ['stance_dialogue'] },
        text: "L’assemblée générale avait voté le dialogue. Seb trouvait ça « moins dramatique ». Il a reconnu, depuis, que la signature de Dédé sous l’œil du maire était « quand même un très bon épisode ».",
      },
      {
        when: { flags: ['met_waiter'] },
        text: "Théo rentre les tables à 22h00 pile, avec un coup d’œil à votre fenêtre. Il vous fait un signe de tête. Il a obtenu, dans la foulée, un vrai planning. La charte ne le prévoyait pas. C’est arrivé quand même.",
      },
      {
        when: { flags: ['tatie_wavering'] },
        text: "Tatie Bouchon, qu’on avait crue perdue pour un verre offert, a signé la charte en bas, en tout petit, « pour ne vexer personne ». « Il faut savoir boire le verre et rester du bon côté du verre. » Personne n’a compris. Tout le monde a applaudi.",
      },
      {
        when: { hidden: { hostility: '>=40' } },
        text: "La paix est fragile. Ghislain archive chaque écart des riverains, Klaas archive chaque écart du bloc. Deux carnets, une rue. On appelle ça l’équilibre.",
      },
      {
        when: { flags: ['charter_drafted'] },
        text: "Le brouillon original est punaisé au Goulot, avec ses ratures : « trimestre », barré, « quand on veut », barré, « trimestre ». Les deux ratures les plus négociées du Vieux-Lille.",
      },
      {
        when: { flags: ['fire_brigade_helped'] },
        text: "Tout le monde date la paix de la charte. Jérémie, lui, la date du soir des pompiers, quand Dédé a poussé les tables avec vous, sans rien dire. Il ne l’a jamais écrit nulle part. C’est rare, chez lui.",
      },
      {
        when: { flags: ['corruption_proof', 'press_contacted'], notFlags: ['press_scandal'] },
        text: "Dans un tiroir, vous gardez de quoi faire la une de La Voix du Nordiste. Anne-Sophie Lepoutre vous envoie un SMS par mois : « Toujours rien ? » Toujours rien. La paix, c’est aussi un tiroir fermé.",
      },
      {
        when: { notFlags: ['exhaust_meeting_won'] },
        text: "La gaine ronronne toujours sous votre fenêtre. Mais à 23h30, maintenant, quelqu’un tape au carreau de la cuisine et dit « Pilou dort ». Elle s’arrête. Pas toujours. Souvent. C’est l’article 4, appliqué à une gaine.",
      },
      {
        when: { flags: ['cm_regis_nuance'] },
        text: "Régis s’est proposé comme « médiateur » de la charte. La charte prévoit un interlocuteur unique côté bloc. Elle n’en prévoit aucun côté Régis.",
      },
      ...ASSO_FATES,
      ...INSTITUTIONS,
      ...SECRETS,
      ...AFTERMATH,
      ...STREET_AFTER,
      {
        when: {},
        text: "Le premier trimestre, la réunion s’est tenue à l’estaminet. Hilde a apporté sa tarte au sucre. Dédé a goûté et demandé la recette. Hilde a dit non, très gentiment.",
      },
    ],
  },
];
