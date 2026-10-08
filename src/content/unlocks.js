// Outils qui arrivent au fil de la campagne (GAME_DESIGN §12b.B, contrat §14 v1.1). Données pures : aucune logique, aucun DOM.
// Moteur : src/sim/unlocks.js (agent build). Une entrée :
//   { id, unlocks: { keys?: [...], actions?: [...] }, when, card: { title, text, hint } }
//   unlocks.keys    : touches de la nuit (B, L…) qui ne marchent qu'une fois l'entrée débloquée
//   unlocks.actions : ids d'ACTIONS (actions.js) qui n'apparaissent qu'une fois l'entrée débloquée
//   when            : conditions §14 ; dès qu'elles sont vraies, l'outil est acquis pour le reste de la campagne
//   card            : la carte « Nouveau » montrée la première fois (titre, deux lignes, touche clavier / bouton manette)
// Lecture du contrat par le contenu (à confirmer par le moteur) : une touche ou une action citée ici est verrouillée tant que
// son entrée ne l'a pas débloquée ; tout ce qui n'est cité nulle part est disponible d'emblée. Les `requires` propres à chaque
// action (actions.js) s'ajoutent : une entrée « histoire » se contente de les reprendre, pour que la carte tombe au bon moment.
//
// Dès la première nuit (rien à débloquer) : la montre, la photo (P / X), le téléphone et la police (T / LB), demander au
// serveur (E / A), le dossier (Tab / RS), le menu de nuit (N / Y), et le seau d'eau (F / RT), parce que c'est la tentation.
// Règle §12b : au moins un nouveau verbe toutes les deux nuits jusqu'au J10 (vérifié par tests/unit/unlocks.test.js).
// Rien de ce dont les bots ou les cibles d'équilibrage ont besoin n'est retiré : seul le « quand » change (§13.H à re-vérifier).

export const UNLOCKS = [
  // ════════════════════════════════════════════════════════════════════════
  // AU CALENDRIER : un nouvel outil tous les un ou deux soirs
  // ════════════════════════════════════════════════════════════════════════
  {
    id: 'db_reading',
    unlocks: { keys: ['B'] },
    when: { day: [1, 14], phase: 'night' },
    card: {
      title: 'Nouveau : le relevé de décibels',
      text: "Votre téléphone mesure le bruit, horodaté. Après 22h, chaque relevé pèse au dossier ; avant, ça ne compte pas.",
      hint: 'B / RB',
    },
  },
  {
    id: 'whatsapp_group',
    unlocks: { actions: ['night_whatsapp'] },
    when: { day: [2, 14] },
    card: {
      title: 'Nouveau : le groupe WhatsApp',
      text: "Seb et Nico vous ont ajouté au groupe de l’association. Partagez vos photos : les voisins suivent, l’association se mobilise.",
      hint: 'T / LB, puis « Groupe »',
    },
  },
  {
    id: 'round_jeremie',
    unlocks: { actions: ['night_ronde_jeremie'] },
    when: { day: [2, 14], flags: ['met_jeremie'] },
    card: {
      title: 'Nouveau : la ronde de 22h',
      text: "Jérémie sort Biloute à 22h pile. Faites le tour avec eux : il compte les tables, le teckel flaire ce qui déborde.",
      hint: 'N / Y, « La ronde avec Jérémie »',
    },
  },
  {
    id: 'police_asso',
    unlocks: { actions: ['night_police_asso'] },
    when: { day: [3, 14], flags: ['met_jeremie'] },
    card: {
      title: 'Nouveau : appeler « pour l’Association »',
      text: "Au nom de l’Association, la police vient plus vite. Mais le bloc saura qui appelle, et il a de la mémoire.",
      hint: 'T / LB, « Police (Association) »',
    },
  },
  {
    id: 'mairie_report',
    unlocks: { actions: ['night_mairie'] },
    when: { day: [3, 14] },
    card: {
      title: 'Nouveau : le signalement à la mairie',
      text: "Un signalement en ligne, avec vos photos en pièces jointes. La mairie ouvre à 8h30 ; le dossier, lui, se souvient de l’heure.",
      hint: 'T / LB, « Mairie »',
    },
  },
  {
    id: 'window_camera',
    unlocks: { actions: ['night_camera_window'] },
    when: { day: [4, 14] },
    card: {
      title: 'Nouveau : une caméra à la fenêtre',
      text: "Une vieille webcam, scotchée au rebord, qui filme la terrasse toute la nuit. C’est votre fenêtre ; les visages des clients, eux, non.",
      hint: 'N / Y, à la fenêtre',
    },
  },
  {
    id: 'pranks',
    unlocks: { actions: ['night_cardboard_exhaust', 'night_stink_bomb'] },
    when: { day: [5, 14] },
    card: {
      title: 'Nouveau : la boîte à farces',
      text: "Un carton pour la gaine, une boule puante pour la terrasse. Illégal, et ça soulage. Regardez d’abord qui regarde (👁).",
      hint: 'N / Y, catégorie rouge',
    },
  },
  {
    id: 'film_crowd',
    unlocks: { actions: ['night_film_faces'] },
    when: { day: [6, 14] },
    card: {
      title: 'Nouveau : filmer la foule',
      text: "Le samedi, la rue déborde : filmer prouve tout, d’un coup. Mais des visages à découvert, c’est une plainte qui attend son tour.",
      hint: 'N / Y, catégorie grise',
    },
  },
  {
    id: 'flood_police',
    unlocks: { actions: ['night_flood_police'] },
    when: { day: [7, 14], flags: ['called_police'] },
    card: {
      title: 'Nouveau : inonder le standard',
      text: "Appeler, rappeler, rappeler encore. Ça use la patrouille… et votre réputation au standard. « C’est encore vous. »",
      hint: 'N / Y, catégorie grise',
    },
  },
  {
    id: 'sabotage',
    unlocks: { actions: ['night_sabotage_chairs', 'night_sabotage_parasols', 'night_sabotage_locks'] },
    when: { day: [8, 14] },
    card: {
      title: 'Nouveau : le sabotage',
      text: "Chaises dévissées, parasols envolés, cadenas collés. Après une semaine sans dormir, l’idée vient toute seule. Le Risque aussi.",
      hint: 'N / Y, dans la rue, catégorie rouge',
    },
  },
  {
    id: 'awning_camera',
    unlocks: { actions: ['night_camera_awning'] },
    when: { day: [9, 14] },
    card: {
      title: 'Nouveau : la caméra sous le store',
      text: "Cachée sous le store de l’estaminet, elle verrait tout, même les cafés offerts. Une preuve illégale : bonne pour la presse, pas pour la commission.",
      hint: 'N / Y, devant l’estaminet',
    },
  },

  // ════════════════════════════════════════════════════════════════════════
  // PAR L'HISTOIRE : l'outil arrive quand le récit le permet
  // ════════════════════════════════════════════════════════════════════════
  {
    id: 'legal_view',
    unlocks: { keys: ['L'] },
    when: { flags: ['legal_view'] },
    card: {
      title: 'Nouveau : la vue des zones légales',
      text: "Le plan de la mairie est arrivé. Les zones de terrasse et le couloir de passage s’affichent en fantômes : vert, autorisé ; rouge, débordement.",
      hint: 'L / LT',
    },
  },
  {
    id: 'carbonnade',
    unlocks: { actions: ['night_eat_carbonnade_1', 'night_eat_carbonnade_2', 'night_eat_carbonnade_3'] },
    when: { day: [2, 14], flags: ['met_jeremie'] },
    card: {
      title: 'Nouveau : dîner à l’estaminet',
      text: "Dédé vous offre la carbonnade. Elle sent bon. Klaas, lui, note qui s’assoit à quelle table.",
      hint: 'N / Y, devant l’estaminet',
    },
  },
  {
    id: 'bribe_waiter',
    unlocks: { actions: ['night_bribe_waiter'] },
    when: { flags: ['asked_waiter'] },
    card: {
      title: 'Nouveau : un billet pour le serveur',
      text: "Le serveur vous a vu demander poliment. Un billet glissé et il parlera peut-être. Illégal, et Dédé n’est jamais loin.",
      hint: 'N / Y, près du serveur',
    },
  },
  {
    id: 'informant',
    unlocks: { actions: ['night_saboter_cuisine', 'night_laxatif_carbonnade', 'night_backroom_photo'] },
    when: { flags: ['waiter_informant'] },
    card: {
      title: 'Nouveau : les secrets de la cuisine',
      text: "Théo vous a raconté la cuisine, l’arrière-salle, les horaires. Ce que vous en ferez ne regarde que vous… et vos témoins.",
      hint: 'N / Y, catégorie rouge',
    },
  },
  {
    id: 'bribe_photo',
    unlocks: { actions: ['night_bribe_photo_window'] },
    when: { flags: ['seen_complaisance'] },
    card: {
      title: 'Nouveau : guetter le pot-de-vin',
      text: "Vous avez vu le café offert à la patrouille. Depuis votre fenêtre, une photo serait légale. Il faut de la patience.",
      hint: 'N / Y, à la fenêtre',
    },
  },
  {
    id: 'borrow_power',
    unlocks: { actions: ['night_borrow_power'] },
    when: { flags: ['camera_awning'] },
    card: {
      title: 'Nouveau : brancher la caméra chez eux',
      text: "La caméra du store a besoin de courant. L’estaminet en a. Illégal, évidemment.",
      hint: 'N / Y, devant l’estaminet',
    },
  },
  {
    id: 'wifi',
    unlocks: { actions: ['night_wifi'] },
    when: { flags: ['proj_wifi_cracker'] },
    card: {
      title: 'Nouveau : le wifi de l’estaminet',
      text: "Le programme que Clode Kode a refusé d’écrire est prêt. Le réseau « BERNADETTE_INVITES » est à portée. Très illégal.",
      hint: 'N / Y, à la fenêtre',
    },
  },

  // ════════════════════════════════════════════════════════════════════════
  // KODDEX : les projets perso livrés deviennent des outils (aucune touche, une carte)
  // ════════════════════════════════════════════════════════════════════════
  {
    id: 'db_logger',
    unlocks: {},
    when: { flags: ['proj_db_logger'] },
    card: {
      title: 'Nouveau : le démon de décibels',
      text: "Votre programme relève le bruit toute la nuit, seul, depuis la fenêtre. Chaque matin, des pièces horodatées vous attendent au dossier.",
      hint: 'Automatique',
    },
  },
  {
    id: 'whatsapp_bot',
    unlocks: {},
    when: { flags: ['proj_whatsapp_bot'] },
    card: {
      title: 'Nouveau : Bip, le bot du groupe',
      text: "Bip rappelle l’heure de fermeture et relaie vos photos. Mobiliser l’association vous coûte désormais moins de temps.",
      hint: 'Automatique',
    },
  },
  {
    id: 'review_scraper',
    unlocks: {},
    when: { flags: ['proj_scraper'] },
    card: {
      title: 'Nouveau : le scraper d’avis',
      text: "Il lit les avis publics de l’estaminet. Quand un client se vante de la terrasse à 1h du matin, il vous prévient.",
      hint: 'Automatique',
    },
  },
];
