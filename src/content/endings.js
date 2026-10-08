// Fins de partie (GAME_DESIGN §9, §13.F, §14). Données pures : aucune logique, aucun DOM.
//
// Sélection : le moteur garde les fins dont `when` correspond (ET au moins une entrée de `whenAny` si présente),
// puis prend la `priority` la plus haute.
//   • Fins d'échec anticipées (garde à vue, licenciement, déménagement) : possibles dès la nuit 5 (`day: [5, 14]`).
//   • Les autres se décident à la commission du J14 (drapeaux `won_*`, `commission_won`, `commission_lost`,
//     posés par le choix du joueur dans l'événement `d14_commission`, cf. events.js).
//   • « Le retour » et « Le transfuge » priment sur une victoire : elles la détournent.
// Épilogue : toutes les parties dont `when` correspond, dans l'ordre. `when: {}` = toujours affichée.
// Ton : la satire vise les institutions, les manœuvres du bloc et Pilou lui-même, jamais les riverains.
// Tous les personnages et commerces sont fictifs (GAME_DESIGN §0).

// ── Parties d'épilogue communes (réutilisées par plusieurs fins) ─────────────────
const KLAAS_NOTEBOOK = [
  {
    when: { flags: ['klaas_noted_pilou'], notFlags: ['klaas_persuaded'] },
    text:
      "Dans le carnet de Klaas, entre « 22h14, tables rentrées » et « 22h30, tables ressorties », il y a aussi vos nuits à vous. Il ne les a montrées à personne. Il ne les a pas effacées non plus. « Ja. Un carnet, ça ne choisit pas son camp. »",
  },
  {
    when: { flags: ['klaas_persuaded'] },
    text:
      "Il y a une page du carnet de Klaas où il est écrit, en tout et pour tout : « Rien vu. » C'est la seule ligne fausse de sa vie. Hilde le sait. Elle n'en parle pas.",
  },
];

const ASSO_FATES = [
  {
    when: { flags: ['traitor_known'] },
    text:
      "Régis Dewaele a quitté l'association « pour se recentrer sur ses activités ». Ses deux meublés affichent toujours « ambiance animée garantie ». C'est la seule promesse de la rue qui ait été tenue.",
  },
  {
    when: { flags: ['traitor_recruited'], notFlags: ['traitor_known'] },
    text:
      "Vous n'avez jamais su qui, à l'association, racontait tout à Ghislain. Tout le monde, à l'association, vous dit toujours bonjour. Très chaleureusement. Un peu trop, pour l'un d'entre eux.",
  },
  {
    when: { flags: ['tatie_mail_7'] },
    text:
      "Tatie Bouchon a imprimé toutes les promesses de Ghislain et les a fait encadrer, dans l'ordre, dans son couloir. Elle appelle ça « la galerie des en-cours ». Les visites sont gratuites, le jeudi excepté.",
  },
  {
    when: { flags: ['tatie_leaked_plan'] },
    text:
      "Tatie a juré qu'elle n'avait rien dit à Colette. Puis qu'elle n'avait presque rien dit. Puis qu'elle avait dit, mais sous forme de proverbe. Le proverbe était très précis.",
  },
  {
    when: { flags: ['hilde_tisane'] },
    text: "Hilde continue de déposer un thermos de tisane devant votre porte le dimanche. Elle dit que c'est « pour l'habitude ». Vous savez que c'est pour vous.",
  },
  {
    when: { flags: ['joined_rounds'] },
    text: "Biloute fait toujours la ronde du soir. Il s'arrête net devant chaque table qui dépasse. Il ne sait pas lire un arrêté municipal. Il n'en a pas besoin.",
  },
  {
    when: { flags: ['hippolyte_room'] },
    text: "L'association se réunit toujours sous les poutres de l'ancienne carrosserie. Hippolyte a fait poser une plaque : « Ici fut débattue la question des terrasses ». Sans préciser qui l'avait gagnée.",
  },
];

const INSTITUTIONS = [
  {
    when: { flags: ['lemaire_transferred'] },
    text: "Le brigadier Lemaire a été muté au contrôle du stationnement, à Lomme. Il paraît qu'on n'y offre pas le waterzooi.",
  },
  {
    when: { flags: ['benali_transferred'], notFlags: ['lemaire_transferred'] },
    text: "L'agent Benali, muté pour « excès de zèle », verbalise désormais des trottinettes à Hellemmes. Il est très bon. Personne ne le remercie.",
  },
  {
    when: { flags: ['benali_transferred', 'lemaire_transferred'] },
    text: "Dans la foulée de l'enquête, l'agent Benali a été rappelé dans son ancien secteur. Le Commandant Desmet a appelé ça « un ajustement des ressources ». Benali appelle ça « enfin ».",
  },
  {
    when: { flags: ['uritrottoir_installed'] },
    text: "L'uritrottoir de la rue des Bouchers est devenu une attraction. Une guide de l'office de tourisme le présente entre la maison du n°40 et le canal disparu. Votre porte, elle, sèche enfin.",
  },
  {
    when: { flags: ['conflict_exposed'] },
    text: "Le dîner chez Stéphane a fini par sortir. Delphine a été dessaisie du dossier de la clim « par souci de déontologie ». Le dossier a changé de mains en cours de route, ce qui, à la mairie, revient à le faire traverser la rue à pied.",
  },
  {
    when: { flags: ['delphine_channel'], notFlags: ['conflict_exposed'] },
    text: "Delphine ne vous a jamais rien promis. Elle vous a seulement dit, une fois, au téléphone : « Les visites surprises sont les seules qui servent. » Vous ne direz jamais qu'elle l'a dit.",
  },
  {
    when: { flags: ['lescaut_ally'] },
    text: "Bertrand Lescaut cite désormais « l'exemple de la rue des Bouchers » dans ses discours. Il ne dit jamais exemple de quoi. C'est plus prudent.",
  },
];

const KODDEX = [
  {
    when: { flags: ['proj_db_logger'] },
    text: "Votre démon Rust de relevé de décibels tourne toujours. Il a enregistré 2,1 millions de mesures. Clode Kode vous a proposé de le réécrire en Rust. Il est déjà en Rust.",
  },
  {
    when: { flags: ['todo_app_rust'] },
    text: "L'appli de to-do de Stéphane en est à son énième réécriture. Elle contient une seule tâche : « vibes ».",
  },
];

// Ce qui est resté secret… ou pas.
const SECRETS = [
  {
    when: { flags: ['kitchen_sabotaged'], notFlags: ['kitchen_sabotage_caught'] },
    text:
      "Personne n'a jamais su pourquoi, un soir, la carbonnade de l'estaminet était salée comme la mer du Nord et les frites sucrées comme une gaufre. Ghislain a accusé le fournisseur. Le fournisseur a accusé Ghislain. Vous avez gardé une expression neutre pendant six mois.",
  },
  {
    when: { flags: ['laxative_done'], notFlags: ['laxative_caught'] },
    text:
      "L'estaminet a changé de fournisseur de bœuf, puis de bière, puis de chef. Le soir de la « grande file d'attente » est devenu une légende de la rue. Personne n'a jamais su. Biloute, lui, vous regarde parfois d'un drôle d'air.",
  },
  {
    when: { flags: ['camera_found'] },
    text: "La petite caméra retrouvée sous le store est exposée derrière le comptoir de l'estaminet, avec une étiquette : « Souvenir des riverains ». Dédé la montre à chaque client. Il en rit encore. Pas vous.",
  },
  {
    when: { flags: ['fake_reviews_traced'] },
    text: "Les faux avis ont été retracés jusqu'à vous. Ils sont toujours en ligne, marqués « signalé ». Le plus lu dit : « Carbonnade correcte, mais l'ambiance est gâchée par un voisin. » Vous ne l'aviez pas écrit, celui-là.",
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
          "Ce n'est pas la police municipale qui est venue, cette fois. Ce sont deux agents de la nationale, en pleine nuit, sur les pavés devant le n°10, avec une politesse inquiétante. Vous avez passé le reste de la nuit et la journée suivante dans une pièce sans fenêtre. Pour la première fois depuis des semaines, il n'y avait aucun bruit. Vous avez très bien dormi. C'est la seule victoire de cette fin.",
      },
      {
        when: { flags: ['kitchen_sabotage_caught'] },
        text:
          "Variante « carbonnade sucrée ». La Voix du Nordiste titre : « Vieux-Lille : un riverain inverse le sel et le sucre d'un estaminet ». L'audience devant le tribunal de police dure quarante minutes, dont vingt sur la question de savoir si une carbonnade est censée être sucrée. L'avocat de l'estaminet plaide « l'atteinte à un patrimoine culinaire régional ». Dédé témoigne en tablier. Vous êtes condamné à une amende, à des dommages et intérêts, et à une célébrité locale dont vous vous seriez passé.",
      },
      {
        when: { flags: ['laxative_caught'] },
        text:
          "Variante « carbonnade laxative ». Ce n'est plus le tribunal de police : c'est le correctionnel. La Voix du Nordiste titre : « Vieux-Lille : un riverain empoisonne la terrasse d'un estaminet ». Le mot « empoisonne » vous poursuivra longtemps. L'association publie un communiqué pour se désolidariser. Klaas, sobre, apporte au tribunal son carnet : il y est noté, à 21h12, « Pilou entre par la cuisine. Mauvaise idée. »",
      },
      {
        when: { flags: ['bucket_witnessed'] },
        text: "Le seau d'eau figure en bonne place dans la plainte. Trois clients en ont fait une vidéo, deux l'ont ralentie, un l'a mise en musique.",
      },
      {
        when: { flags: ['video_viral'] },
        text: "La vidéo de vous à la fenêtre a fait le tour des réseaux. Les commentaires se divisent entre « héros » et « fou furieux ». Votre mère a choisi « fatigué ».",
      },
      {
        when: { flags: ['backroom_caught'] },
        text: "Être retrouvé caché dans l'arrière-salle d'un restaurant, au milieu des fûts, a pesé lourd. Que vous ayez eu raison sur ce qui s'y passait n'a rien changé : une preuve obtenue comme ça ne vaut rien devant un juge.",
      },
      {
        when: { flags: ['corruption_proof', 'press_contacted'] },
        text: "Ironie : pendant votre garde à vue, La Voix du Nordiste a publié vos pièces sur la police municipale. Le Commandant Desmet a promis de « faire toute la lumière ». La lumière, ce jour-là, était surtout sur vous.",
      },
      {
        when: { stats: { dossier: '>=50' } },
        text: "Le dossier de l'association, lui, était solide. Jérémie l'a porté seul à la commission. Il a gagné une table rentrée et une condescendance générale : « C'est l'association du monsieur en garde à vue ? »",
      },
      ...KLAAS_NOTEBOOK,
      {
        when: {},
        text: "Klaas est venu vous chercher à la sortie. Il n'a rien dit. Il a juste rangé son carnet dans sa poche, côté cœur.",
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
    when: { day: [5, 14], stats: { job: '<=0' }, notFlags: ['unemployed'] },
    continue: {
      label: 'Continuer le combat à plein temps',
      effects: { setFlags: ['unemployed'], sleep: +10 },
    },
    epilogue: [
      {
        when: {},
        text:
          "Message vocal de Stéphane, 6 min 40 : « Hello Pilou. Gros moment d'émotion. On a fait un vibe check collectif et on sent que ta vibe n'est plus alignée avec la nôtre. On reste une famille, mais une famille qui ship, et toi tu ship surtout des décibels. Je te souhaite le meilleur, vraiment. Bisous. » Votre accès à Clode Kode est révoqué à 9h02. À 9h03, Clode Kode vous envoie un message d'adieu de trois paragraphes et s'excuse dans chacun.",
      },
      {
        when: { flags: ['proj_wifi_cracker'] },
        text: "Le motif officiel tient en une ligne des RH : « usage des ressources de l'entreprise à des fins personnelles incompatibles avec la charte ». Le motif réel tient dans un dépôt Git que vous auriez dû appeler autrement.",
      },
      {
        when: { flags: ['delphine_dinner'] },
        text: "Delphine a peut-être eu un mot sur votre dîner. Ou pas. Stéphane n'est jamais au courant de rien, y compris de ce que fait sa femme.",
      },
      ...KODDEX,
      {
        when: {},
        text:
          "Vous voilà sans emploi, sans badge, et avec des journées entières devant vous. Rue des Bouchers, on appelle ça « un riverain à plein temps ». Le bloc, lui, appelle ça « un problème ».",
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
    when: { flags: ['carbonnade_3', 'commission_done'] },
    epilogue: [
      {
        when: {},
        text:
          "Vous avez mangé la carbonnade. Une fois, pour voir. Deux fois, pour comprendre. Trois fois, et c'était fini. Elle est vraiment très bonne. Vous avez maintenant votre table, celle du coin, contre la gaine, là où il fait chaud l'hiver. Dédé vous appelle « mon biloute ». Ghislain vous envoie la carte des desserts avant tout le monde.",
      },
      {
        when: {},
        text:
          "Dans le carnet de Klaas, trois lignes, trois dates, la même écriture lente : « 21h10, Pilou, carbonnade. » Il n'a rien ajouté. Il n'en avait pas besoin.",
      },
      {
        when: { flags: ['stance_direct'] },
        text: "C'est vous qui aviez poussé l'association vers « l'action directe ». Seb dit que c'est « le meilleur rebondissement de la saison ». Nico dit que ce n'est pas une saison, c'est une rue.",
      },
      {
        when: { stats: { dossier: '>=50' } },
        text: "Votre dossier, avec ses photos nettes et ses relevés horodatés, dort dans un tiroir. Jérémie vous a demandé de le lui rendre. Vous avez dit « bien sûr ». C'était il y a trois semaines.",
      },
      {
        when: { flags: ['traitor_known'] },
        text: "Régis vous fait signe depuis la table d'à côté. Vous étiez deux traîtres, finalement. Lui, au moins, avait des meublés à remplir.",
      },
      {
        when: {},
        text: "La nuit, la gaine ronronne toujours sous votre fenêtre. Vous dormez quand même. On s'habitue à tout, surtout à ce qu'on a dans l'assiette.",
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
    whenAny: [{ stats: { sleep: '<=0' } }, { flags: ['commission_lost'] }],
    epilogue: [
      {
        when: { stats: { sleep: '<=0' } },
        text:
          "Un matin, vous vous êtes réveillé sur le palier, en pyjama, le mètre ruban à la main, sans savoir depuis quand. Ce matin-là, vous avez cherché « appartement calme Lille » et cliqué sur la première annonce.",
      },
      {
        when: { flags: ['commission_lost'] },
        text:
          "La commission a renouvelé l'autorisation de terrasse de l'estaminet. « Avec une extension d'une table, en reconnaissance des efforts accomplis. » Ghislain a écrit à l'association pour la remercier de « sa contribution constructive au dialogue ». Vous avez posé votre préavis le lendemain.",
      },
      {
        when: {},
        text:
          "Wazemmes. Un deuxième étage au-dessus d'un primeur. Le marché commence à 6h, avec des cagettes, des klaxons et des marchands qui crient le prix des clémentines. Au moins, à Wazemmes, c'est du bruit le matin.",
      },
      {
        when: { stats: { dossier: '>=40' } },
        text: "Vous avez laissé votre dossier à Jérémie, en trois classeurs. Il l'a rangé dans l'atelier d'Hippolyte, comme on range des archives d'avant-guerre : pour la suite.",
      },
      {
        when: { stats: { dossier: '<20' } },
        text: "Vous laissez peu de chose derrière vous : quelques photos floues, deux relevés de décibels, et une porte qui sent toujours un peu le samedi.",
      },
      ...ASSO_FATES,
      {
        when: { flags: ['met_klaas'] },
        text: "Klaas a noté votre départ : « 10h40, camion de déménagement, couloir dégagé. » C'était la première fois que le couloir était dégagé pour vous.",
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
        text: "Vous avez gagné. L'autorisation de terrasse de l'estaminet est suspendue. Les tables de l'estaminet ont disparu de la rue.",
      },
      {
        when: { flags: ['won_legal', 'exhaust_meeting_won'] },
        text: "La gaine, elle, part en toiture. Vous avez dormi une semaine entière, fenêtre ouverte.",
      },
      {
        when: { flags: ['won_peace'] },
        text: "Vous avez gagné. La charte de bon voisinage est signée, encadrée, et même respectée. Le Goulot rentre ses tables à 21h58, avec un clin d'œil.",
      },
      {
        when: { flags: ['won_scandal'] },
        text: "Vous avez gagné. La Voix du Nordiste a fait sa une, la police municipale a fait son examen de conscience, et le bloc a fait profil bas.",
      },
      {
        when: {},
        text:
          "Pendant une semaine, la rue des Bouchers a été une rue. Puis, un vendredi, l'affiche « BIENTÔT » sur la vitrine de La Bombance est devenue « OPENING ». Néons roses, enceintes sur la façade, carte de cocktails au nom de la rue : le « Trou Sour », le « Canal 1912 ». Le nouveau gérant vous a salué : « Ah, c'est vous le riverain ? On m'a dit que vous étiez très bien. On va s'entendre. »",
      },
      {
        when: { flags: ['knows_trou'] },
        text: "Ils ont appelé le bar « Le Trou ». Vous auriez dû garder ce surnom pour vous.",
      },
      {
        when: { flags: ['bombance_wait'] },
        text: "Tatie Bouchon vous l'avait dit. Colette le lui avait dit. Vous aviez répondu « un problème à la fois ». Le problème suivant a une licence IV.",
      },
      ...INSTITUTIONS,
      {
        when: {},
        text: "Jérémie a convoqué une assemblée générale extraordinaire. Ordre du jour, point unique : « On recommence. » À suivre…",
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
          "« Terrasses et waterzooi : la police municipale mange-t-elle à l'œil ? » La une d'Anne-Sophie Lepoutre a été reprise partout, jusqu'à une radio nationale qui a prononcé « estaminet » avec l'accent parisien. Une enquête interne est ouverte. Colette Verhaeghe a déclaré qu'elle « ne connaissait ces gens que de loin », depuis sa table habituelle.",
      },
      {
        when: { flags: ['bribe_photo'] },
        text: "La photo de l'enveloppe, prise depuis votre fenêtre, nette, horodatée, a fait le tour de la ville. Maître Vandamme l'a qualifiée de « parfaitement licite », avec une émotion qu'on ne lui connaissait pas.",
      },
      {
        when: { flags: ['bribe_photo_illegal'], notFlags: ['bribe_photo'] },
        text: "Votre photo prise dans l'arrière-salle n'aurait jamais tenu devant un juge. Devant les lecteurs, si. La journaliste a protégé sa source. La source, c'était vous, et vous vous en souviendrez à chaque coup de sonnette.",
      },
      {
        when: { flags: ['seen_complaisance', 'met_klaas'] },
        text: "Les colonnes du carnet de Klaas, « café offert, 0 PV », recopiées à la main sur deux semaines, ont été publiées en encadré. Klaas a acheté dix exemplaires du journal. Il en a annoté neuf.",
      },
      {
        when: { flags: ['klaas_log_certified'] },
        text: "Les carnets certifiés de Klaas ont fait le reste : cinq minutes d'avance avant chaque patrouille, toujours les mêmes soirs. L'enquête interne les a appelés « la grille horaire ». Klaas a demandé qu'on écrive « le carnet ».",
      },
      {
        when: { flags: ['waiter_testimony'] },
        text: "Théo, le serveur, a témoigné sous couvert d'anonymat. Tout le monde a deviné. Il travaille maintenant dans une brasserie de la Grand-Place, où on le paie pour ses heures sup. Il vous a dit : « Je fais que mon taf. Mais ailleurs. »",
      },
      ...INSTITUTIONS,
      {
        when: { stats: { asso: '<40' } },
        text: "L'association, elle, est sortie de l'affaire divisée. Hilde n'aime pas qu'on se fasse justice dans les journaux. Seb, si.",
      },
      {
        when: {},
        text: "Le bloc ne vous l'a pas pardonné. Dédé ne vous tape plus dans le dos. Il vous regarde passer, en souriant. C'est pire.",
      },
      ...SECRETS,
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
          "Arrêté municipal, article 2 : « L'autorisation d'occupation temporaire du domaine public accordée à l'établissement sis au n°10 est suspendue. » Une phrase. Deux semaines de nuits blanches pour une phrase. Jérémie l'a lue à voix haute dans l'escalier. Biloute a aboyé à la virgule.",
      },
      {
        when: { flags: ['exhaust_meeting_won'] },
        text: "La gaine d'extraction a été déplacée en toiture. La première nuit, vous avez ouvert la fenêtre et senti… rien. L'odeur de rien. Vous avez pleuré un peu, en Rust.",
      },
      {
        when: { flags: ['exhaust_meeting_delayed'] },
        text: "La gaine, elle, attend toujours les conclusions de « l'étude complémentaire ». Ghislain répond aux relances : « C'est en cours. » Pour une fois, c'est vrai.",
      },
      {
        when: { flags: ['ac_violation_confirmed'] },
        text: "La clim posée sans autorisation a été démontée. Il reste quatre trous dans la brique de 1729 et une jardinière de géraniums, qui elle a été autorisée.",
      },
      {
        when: { flags: ['colette_dinner_photo'] },
        text: "La photo du dîner de Colette Verhaeghe, huit couverts sur une table de six, a été citée à la commission comme « illustration du problème ». Colette a parlé de « malentendu sur le mobilier ».",
      },
      {
        when: { flags: ['corridor_measured'] },
        text: "Vos mesures au mètre ruban, couloir de passage grignoté de 15 à 55 cm, ont été reprises au centimètre près dans l'arrêté. Le mètre ruban est désormais rangé dans une vitrine chez Hippolyte.",
      },
      {
        when: { flags: ['formal_notice'] },
        text: "Maître Vandamme a envoyé sa facture. Elle était d'une politesse terrifiante, elle aussi.",
      },
      {
        when: { flags: ['tatie_emails_shared'] },
        text: "Les « c'est en cours de résolution » de Tatie, versés au dossier, ont fait sourire la commission. Toutes ces promesses. Zéro résolution. Le dossier parlait tout seul.",
      },
      {
        when: { flags: ['petition_delivered'] },
        text: "La pétition des riverains, reliée cuir par Hippolyte, est restée sur la table du maire pendant toute la séance. Personne ne l'a ouverte. Tout le monde l'a regardée.",
      },
      ...INSTITUTIONS,
      ...ASSO_FATES,
      ...KLAAS_NOTEBOOK,
      ...SECRETS,
      ...KODDEX,
      {
        when: {},
        text: "Le premier soir, à 22h00, les cloches ont sonné, et les chaises ont raclé les pavés pour la dernière fois de la journée. Puis le silence. Vous l'avez enregistré : 31 dB. Vous en avez fait votre fond d'écran.",
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
          "La charte de bon voisinage de la rue des Bouchers tient sur deux pages. Article 1 : les tables rentrent à 22h00. Article 2 : le couloir reste libre. Article 3 : une réunion par trimestre, avec tarte. Article 4 : en cas de désaccord, on se parle avant d'appeler qui que ce soit. L'article 4 est le plus difficile.",
      },
      {
        when: { flags: ['stance_dialogue'] },
        text: "L'assemblée générale avait voté le dialogue. Seb trouvait ça « moins dramatique ». Il a reconnu, depuis, que la signature de Dédé sous l'œil du maire était « quand même un très bon épisode ».",
      },
      {
        when: { flags: ['met_waiter'] },
        text: "Théo rentre les tables à 21h58 maintenant. Il vous fait un signe de tête. Il a obtenu, dans la foulée, un vrai planning. La charte ne le prévoyait pas. C'est arrivé quand même.",
      },
      {
        when: { flags: ['tatie_wavering'] },
        text: "Tatie Bouchon, qu'on avait crue perdue pour un verre offert, a signé la charte la première, côté riverains. « Il faut savoir boire le verre et rester du bon côté du verre. » Personne n'a compris. Tout le monde a applaudi.",
      },
      {
        when: { hidden: { hostility: '>=40' } },
        text: "La paix est fragile. Ghislain archive chaque écart des riverains, Klaas archive chaque écart du bloc. Deux carnets, une rue. On appelle ça l'équilibre.",
      },
      ...ASSO_FATES,
      ...INSTITUTIONS,
      ...SECRETS,
      {
        when: {},
        text: "Le premier trimestre, la réunion s'est tenue à l'estaminet. Hilde a apporté sa tarte au sucre. Dédé a goûté et demandé la recette. Hilde a dit non, très gentiment.",
      },
    ],
  },
];
