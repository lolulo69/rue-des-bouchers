// Objectifs du soir (GAME_DESIGN §12c.5, §13.M, contrat §14). Données pures : aucune logique, aucun DOM.
// Au début de la nuit, le moteur en choisit 2 à 4 parmi ceux dont `when` est vrai (priorité décroissante, un seul par
// `group`), les montre dans le briefing « Ce soir » sous la carte du twist, puis dans la liste « Objectifs du soir » du HUD,
// et coche ceux dont `done` arrive pendant la nuit.
//
// { id, text, stance, when?, done, priority?, group? }
//   text     : ≤ 90 caractères, concret (où, quand, quoi). Les illégaux sont des options avec leur risque, jamais des ordres.
//   stance   : 'legal' | 'grey' | 'illegal' | 'info' (info = une information utile, rien à cocher : done = null)
//   when     : conditions §14 (day, flags, notFlags, stats, hidden, chance), plus trois clés propres à la nuit :
//              twist: '<id de TWISTS>'     le twist de ce soir
//              newTool: '<id d'UNLOCKS>'   l'outil est débloqué ce soir (sa première nuit)
//              onDuty: 'lemaire' | 'benali'  la patrouille de service (au moins une partie de la nuit)
//   done     : ce que le moteur coche, au choix
//              { event: '<id>', ...filtres }  un événement de TUTORIAL_EVENTS (tutorials.js) ou `action:<id d'ACTIONS>` ;
//                filtres : photo_taken { overLimit, late (après 22h), table (libellé), corridor } ·
//                          db_taken { min (dB) } · police_called { patrol, asso }
//              { flag: '<drapeau>' }        le drapeau est posé pendant la nuit
//              null                          (stance 'info')
//   priority : 1–10 (défaut 5) ; le twist et l'outil du jour passent avant le générique
//   group    : objectifs interchangeables (le moteur n'en prend qu'un par groupe)

export const OBJECTIVES = [
  // ════════════════════════════════════════════════════════════════════════
  // LE NOUVEL OUTIL DU SOIR (unlocks.js, sa première nuit)
  // ════════════════════════════════════════════════════════════════════════
  { id: 'o_new_db', stance: 'legal', priority: 9, when: { newTool: 'db_reading' }, done: { event: 'db_taken', min: 60 },
    text: 'Nouveau : faites un relevé de décibels après 22h (B). Au-dessus de 60, c’est une pièce.' },
  { id: 'o_new_whatsapp', stance: 'legal', priority: 9, when: { newTool: 'whatsapp_group' }, done: { event: 'action:night_whatsapp' },
    text: 'Nouveau : partagez une photo sur le groupe de l’association. Seb attend.' },
  { id: 'o_new_round', stance: 'legal', priority: 9, when: { newTool: 'round_jeremie' }, done: { event: 'action:night_ronde_jeremie' },
    text: 'Nouveau : 22h, la ronde avec Jérémie et Biloute. Le teckel compte aussi.' },
  { id: 'o_new_police_asso', stance: 'legal', priority: 8, when: { newTool: 'police_asso' }, done: { event: 'police_called', asso: true },
    text: 'Nouveau : appelez la police « pour l’Association ». Plus rapide, moins discret.' },
  { id: 'o_new_mairie', stance: 'legal', priority: 8, when: { newTool: 'mairie_report' }, done: { event: 'action:night_mairie' },
    text: 'Nouveau : un signalement à la mairie, photos jointes. Ils ouvrent à 8h30.' },
  { id: 'o_new_window_camera', stance: 'grey', priority: 9, when: { newTool: 'window_camera' }, done: { event: 'action:night_camera_window' },
    text: 'Nouveau : installez la webcam à votre fenêtre. Elle filme pendant que vous dormez.' },
  { id: 'o_new_legal_view', stance: 'legal', priority: 9, when: { newTool: 'legal_view' }, done: { flag: 'corridor_measured' },
    text: 'Nouveau : L pour les zones. Mesurez une table qui mord sur le couloir.' },
  { id: 'o_new_film', stance: 'grey', priority: 7, when: { newTool: 'film_crowd' }, done: { event: 'action:night_film_faces' },
    text: 'Option : filmer la foule. Ça prouve tout, mais les visages, c’est délicat.' },
  { id: 'o_new_flood', stance: 'grey', priority: 6, when: { newTool: 'flood_police' }, done: { event: 'action:night_flood_police' },
    text: 'Option : saturer le standard de la police. Efficace, mal vu, très mal vu.' },
  { id: 'o_new_pranks', stance: 'illegal', priority: 7, when: { newTool: 'pranks' }, done: { event: 'night_menu_opened' },
    text: 'Option : carton sur la gaine ou boule puante. Illégal : regardez d’abord le 👁.' },
  { id: 'o_new_sabotage', stance: 'illegal', priority: 7, when: { newTool: 'sabotage' }, done: { event: 'night_menu_opened' },
    text: 'Option : le sabotage (chaises, parasols, cadenas). Tard, sans témoin, ou pas du tout.' },
  { id: 'o_new_awning', stance: 'illegal', priority: 7, when: { newTool: 'awning_camera' }, done: { event: 'night_menu_opened' },
    text: 'Option : une caméra sous le store. Preuve illégale : la presse, pas la commission.' },
  { id: 'o_new_carbonnade', stance: 'legal', priority: 5, when: { newTool: 'carbonnade' }, done: { event: 'action:night_eat_carbonnade_1' },
    text: 'Dédé vous invite à goûter la carbonnade. Klaas, lui, notera qui s’assoit.' },
  { id: 'o_new_bribe_waiter', stance: 'illegal', priority: 6, when: { newTool: 'bribe_waiter' }, done: { event: 'night_menu_opened' },
    text: 'Option : un billet au serveur pour qu’il parle. Illégal, et Dédé n’est jamais loin.' },
  { id: 'o_new_informant', stance: 'illegal', priority: 7, when: { newTool: 'informant' }, done: { event: 'night_menu_opened' },
    text: 'Théo vous a tout raconté. Le menu rouge s’allonge ; chaque ligne a un prix.' },
  { id: 'o_new_bribe_photo', stance: 'legal', priority: 9, when: { newTool: 'bribe_photo' }, done: { flag: 'bribe_photo' },
    text: 'Guettez la patrouille depuis votre fenêtre : la photo de l’enveloppe serait légale.' },
  { id: 'o_new_power', stance: 'illegal', priority: 6, when: { newTool: 'borrow_power' }, done: { event: 'night_menu_opened' },
    text: 'Option : brancher votre caméra chez eux. Illégal, et un peu culotté.' },
  { id: 'o_new_wifi', stance: 'illegal', priority: 6, when: { newTool: 'wifi' }, done: { event: 'night_menu_opened' },
    text: 'Option : leur wifi, depuis la fenêtre. Très illégal ; rien d’utilisable en commission.' },

  // ════════════════════════════════════════════════════════════════════════
  // LE TWIST DU SOIR (twists.js) : son occasion propre
  // ════════════════════════════════════════════════════════════════════════
  { id: 'o_tw_martine', stance: 'legal', priority: 10, when: { twist: 'martine_dinner' }, done: { event: 'photo_taken', table: 'la table de Martine' },
    text: 'Martine Aubrac dîne à huit sur une table de six. À photographier, horodaté.' },
  { id: 'o_tw_van', stance: 'legal', priority: 10, when: { twist: 'saturday_van' }, done: { event: 'photo_taken', corridor: true },
    text: 'Une camionnette dans le couloir un samedi piéton : la photo, avec la plaque.' },
  { id: 'o_tw_inspector', stance: 'legal', priority: 10, when: { twist: 'inspector_surprise_night' }, done: { event: 'action:night_mairie' },
    text: 'L’inspectrice est au Goulot, incognito. Un signalement ce soir tomberait à pic.' },
  { id: 'o_tw_model_street', stance: 'legal', priority: 9, when: { twist: 'inspector_announced_night' }, done: { event: 'db_taken', min: 55 },
    text: 'Rue modèle ce soir. Relevez le dB après 23h30, quand « la dame est partie ».' },
  { id: 'o_tw_ac', stance: 'legal', priority: 9, when: { twist: 'inspector_quiet_night' }, done: { event: 'photo_taken', late: true },
    text: '22h30 : la clim redémarre. Une photo de la façade, l’heure faisant foi.' },
  { id: 'o_tw_exhaust_eve', stance: 'legal', priority: 9, when: { twist: 'exhaust_eve' }, done: { event: 'db_taken', min: 0 },
    text: 'Veille de la réunion : la gaine se tait. Mesurez le silence, pour comparer.' },
  { id: 'o_tw_exhaust_won', stance: 'legal', priority: 8, when: { twist: 'exhaust_won_night' }, done: { event: 'db_taken', min: 65 },
    text: '« Soirée hommage à la friture » : un dernier relevé, pour l’histoire.' },
  { id: 'o_tw_exhaust_lost', stance: 'legal', priority: 9, when: { twist: 'exhaust_lost_night' }, done: { event: 'db_taken', min: 65 },
    text: 'La gaine tourne « pour tester un filtre » qui n’existe pas. Relevez-la.' },
  { id: 'o_tw_football', stance: 'legal', priority: 10, when: { twist: 'football_match' }, done: { event: 'db_taken', min: 85 },
    text: 'Écran géant : un relevé sur le but de 21h12. Au-dessus de 85 dB, c’est historique.' },
  { id: 'o_tw_birthday', stance: 'legal', priority: 10, when: { twist: 'birthday_t4' }, done: { event: 'photo_taken', table: 'table 4' },
    text: 'Table 4 : onze personnes pour un anniversaire. Photo avant le chant de 23h40.' },
  { id: 'o_tw_influencer', stance: 'grey', priority: 9, when: { twist: 'influencer_night' }, done: { event: 'photo_taken', corridor: true },
    text: 'Une ring light dans le couloir. Photographiez les tables derrière elle… et souriez.' },
  { id: 'o_tw_hen', stance: 'legal', priority: 10, when: { twist: 'hen_party' }, done: { event: 'db_taken', min: 80 },
    text: 'EVJF au mégaphone : un relevé pendant la sirène (22h30). Marion comprendra.' },
  { id: 'o_tw_drache', stance: 'legal', priority: 10, when: { twist: 'drache_night' }, done: { event: 'photo_taken', overLimit: true },
    text: 'Drache : tout le monde se serre sous le store. Quatorze sur trois tables, en photo.' },
  { id: 'o_tw_heatwave', stance: 'legal', priority: 8, when: { twist: 'heatwave' }, done: { event: 'db_taken', min: 60 },
    text: 'Canicule, fenêtres ouvertes : un relevé après minuit, depuis votre fenêtre.' },
  { id: 'o_tw_guide', stance: 'legal', priority: 7, when: { twist: 'guide_tour' }, done: { event: 'photo_taken', late: true },
    text: '22h15 : trente touristes devant la terrasse. Le moment de compter les chaises.' },
  { id: 'o_tw_regis', stance: 'legal', priority: 9, when: { twist: 'regis_party' }, done: { event: 'db_taken', min: 70 },
    text: 'Le bruit vient du 27, pas d’une terrasse. Un relevé, et c’est l’affaire de Régis.' },
  { id: 'o_tw_carbonnade', stance: 'legal', priority: 9, when: { twist: 'carbonnade_contest' }, done: { event: 'photo_taken', table: 'la table du jury' },
    text: 'Le jury de la carbonnade est à neuf. Six par table, même pour les gourmets.' },
  { id: 'o_tw_busker', stance: 'legal', priority: 8, when: { twist: 'busker' }, done: { event: 'db_taken', min: 60 },
    text: 'L’accordéoniste joue sous votre fenêtre. Un relevé… et une pensée pour le seau.' },
  { id: 'o_tw_power_cut', stance: 'info', priority: 8, when: { twist: 'power_cut' }, done: null,
    text: '22h40, panne de courant : le noir aide les discrets. Et les témoins voient moins.' },
  { id: 'o_tw_waiter', stance: 'legal', priority: 8, when: { twist: 'waiter_last_night' }, done: { event: 'waiter_asked' },
    text: 'Dernière nuit du serveur avant ses vacances : il rentrera les tables si on demande.' },
  { id: 'o_tw_fete', stance: 'legal', priority: 9, when: { twist: 'fete_voisins' }, done: { event: 'photo_taken', late: true },
    text: '22h pile, la fête des voisins range. Photographiez les terrasses qui, elles, restent.' },
  { id: 'o_tw_fire', stance: 'legal', priority: 10, when: { twist: 'fire_inspection' }, done: { event: 'photo_taken', corridor: true },
    text: '22h20 : les pompiers mesurent le couloir. Une photo de la mesure vaut de l’or.' },
  { id: 'o_tw_delandre', stance: 'legal', priority: 10, when: { twist: 'delandre_walk' }, done: { event: 'photo_taken', late: true },
    text: 'Le maire passe à 23h. Photographiez la rue à 22h50, avant le grand ménage.' },
  { id: 'o_tw_lost_dog', stance: 'legal', priority: 8, when: { twist: 'lost_dog' }, done: { event: 'moved' },
    text: 'Biloute a fugué. Aidez Jérémie à chercher sous les tables (indice : la table 3).' },
  { id: 'o_tw_tv', stance: 'legal', priority: 9, when: { twist: 'tv_crew' }, done: { event: 'photo_taken', late: true },
    text: 'La télé part à 22h30. Photographiez la terrasse cinq minutes après le « coupez ».' },
  { id: 'o_tw_sweeper', stance: 'info', priority: 6, when: { twist: 'street_sweeper' }, done: null,
    text: '23h30 : la balayeuse passe. Tout ce qui doit être prouvé, prouvez-le avant.' },

  // ════════════════════════════════════════════════════════════════════════
  // LES JOURS FIXES (en plus du twist)
  // ════════════════════════════════════════════════════════════════════════
  { id: 'o_d1_first_photo', stance: 'legal', priority: 8, group: 'photo', when: { day: [1, 1] }, done: { event: 'photo_taken', late: true },
    text: 'Première nuit : une photo d’une table encore dehors après 22h.' },
  { id: 'o_saturday', stance: 'legal', priority: 8, group: 'photo', when: { day: [6, 6] }, done: { event: 'photo_taken', overLimit: true },
    text: 'Samedi sans voitures : une table à plus de six, il y en a forcément une.' },
  { id: 'o_saturday2', stance: 'legal', priority: 8, group: 'photo', when: { day: [13, 13] }, done: { event: 'photo_taken', overLimit: true },
    text: 'Dernier samedi avant la commission : une dernière table trop pleine, horodatée.' },
  { id: 'o_d9_mairie', stance: 'legal', priority: 7, when: { day: [9, 9] }, done: { event: 'action:night_mairie' },
    text: 'Jour de l’inspectrice : un signalement ce soir arrive sur son bureau demain.' },
  { id: 'o_d13_last_dossier', stance: 'legal', priority: 7, when: { day: [13, 13] }, done: { event: 'dossier_opened' },
    text: 'Dernière nuit avant la commission : relisez le dossier (Tab). Il manque quoi ?' },

  // ════════════════════════════════════════════════════════════════════════
  // GÉNÉRIQUES, selon l'état
  // ════════════════════════════════════════════════════════════════════════
  { id: 'o_gen_over', stance: 'legal', priority: 4, group: 'photo', when: { day: [2, 14] }, done: { event: 'photo_taken', overLimit: true },
    text: 'Une table à plus de six : comptez, photographiez, c’est une pièce.' },
  { id: 'o_gen_late', stance: 'legal', priority: 4, group: 'photo', when: { day: [2, 14] }, done: { event: 'photo_taken', late: true },
    text: 'Une table encore dehors après 22h : la photo prend l’heure toute seule.' },
  { id: 'o_gen_db', stance: 'legal', priority: 3, group: 'db', when: { day: [2, 14] }, done: { event: 'db_taken', min: 65 },
    text: 'Un relevé au-dessus de 65 dB après 22h. Votre fenêtre suffit.' },
  { id: 'o_gen_corridor', stance: 'legal', priority: 5, when: { flags: ['legal_view'] }, done: { flag: 'corridor_measured' },
    text: 'Mesurez un débordement sur le couloir : dans la rue, à moins de cinq mètres.' },
  { id: 'o_gen_round', stance: 'legal', priority: 5, when: { flags: ['joined_rounds'] }, done: { event: 'action:night_ronde_jeremie' },
    text: '22h, la ronde avec Jérémie : à deux, on compte plus vite.' },
  { id: 'o_gen_share', stance: 'legal', priority: 3, when: { flags: ['joined_whatsapp'] }, done: { event: 'action:night_whatsapp' },
    text: 'Partagez vos photos de la soirée sur le groupe. L’association aime les preuves.' },
  { id: 'o_gen_waiter', stance: 'legal', priority: 3, when: { notFlags: ['waiter_fired'] }, done: { event: 'waiter_asked' },
    text: 'Après 22h, demandez poliment au serveur de rentrer les tables. Ça arrive.' },
  { id: 'o_gen_benali', stance: 'legal', priority: 7, when: { onDuty: 'benali' }, done: { event: 'police_called', patrol: 'benali' },
    text: 'Benali est de service : si vous appelez, c’est lui qui viendra. Il verbalise, lui.' },
  { id: 'o_gen_klaas_sleep', stance: 'info', priority: 4, when: { flags: ['met_klaas'] }, done: null,
    text: 'Klaas dort vers 1h. Après, plus de carnet… et plus de témoin sur la place.' },
  { id: 'o_gen_lemaire', stance: 'info', priority: 6, when: { onDuty: 'lemaire', flags: ['seen_complaisance'] }, done: null,
    text: 'Lemaire est de service : la police risque de prendre un café plutôt qu’un PV.' },
  { id: 'o_gen_roster', stance: 'info', priority: 5, when: { flags: ['roster_known'], onDuty: 'lemaire' }, done: null,
    text: 'Le carnet de Klaas l’avait prévu : soir de Lemaire. Gardez la photo pour la fenêtre.' },
  { id: 'o_gen_sleep', stance: 'info', priority: 6, when: { stats: { sleep: '<30' } }, done: null,
    text: 'Sommeil au plus bas : une vraie nuit vaut parfois mieux qu’une photo de plus.' },
  { id: 'o_gen_risk', stance: 'info', priority: 7, when: { stats: { risk: '>=60' } }, done: null,
    text: 'Risque élevé : une plainte de plus et c’est la garde à vue. Ce soir, rien d’illégal ?' },
  { id: 'o_gen_bucket', stance: 'illegal', priority: 2, when: { day: [3, 14], stats: { sleep: '<40' } }, done: { event: 'witnesses_read' },
    text: 'Le seau vous fait de l’œil. Option illégale : lisez d’abord la ligne 👁.' },
  { id: 'o_gen_dossier', stance: 'legal', priority: 2, when: { day: [5, 12], stats: { dossier: '<20' } }, done: { event: 'dossier_opened' },
    text: 'Le dossier est maigre pour la commission. Ouvrez-le (Tab) : qu’est-ce qui manque ?' },
];

// ════════════════════════════════════════════════════════════════════════════
// CONSEIL « AU LIT » (§12c.5, bloc de l'agent build) : après 22h30, quand l'essentiel est fait (why: 'done') ou dès que
// le Sommeil est bas (why: 'tired') ; 'late' (§12d) : dit une fois, à qui prépare un coup illégal, que la rue se vide
// après 1h. Le moteur (src/sim/objectives.js bedtimeHint) en montre un au plus toutes les ~20 minutes de jeu, en
// dernière ligne des « Objectifs du soir » ; le jeu ajoute la touche (E / Ⓐ) et la direction du lit.
// ════════════════════════════════════════════════════════════════════════════
export const BEDTIME = [
  { id: 'bed_done_dossier', why: 'done', text: 'Dossier à jour : au lit. La rue continuera sans vous.' },
  { id: 'bed_done_enough', why: 'done', text: 'Vous avez fait votre part ce soir. La chambre côté cour vous attend.' },
  { id: 'bed_done_klaas', why: 'done', text: 'Klaas veille encore à sa fenêtre : vous pouvez dormir, lui note tout.' },
  { id: 'bed_tired_fall', why: 'tired', text: 'Vous tombez de sommeil : allez vous allonger, même mal, même tard.' },
  { id: 'bed_tired_eyes', why: 'tired', text: 'Les yeux qui piquent, la nuque qui lâche. Le lit, maintenant ?' },
  { id: 'bed_late_street', why: 'late', text: 'La rue se vide après 1h. Si vous avez un plan, c’est là qu’il se joue.' },
  { id: 'bed_late_klaas', why: 'late', text: 'Patience : après 1h, terrasses rentrées et Klaas couché. Le lit attendra un peu.' },
  { id: 'bed_tired_tomorrow', why: 'tired', text: 'Demain, Koddex vous attend à 9h. Une heure de sommeil vaut une photo.' },

  // ════════════════════════════════════════════════════════════════════════
  // DISCRÉTION (§12d) : pour qui n'a pas choisi la voie strictement légale
  // ════════════════════════════════════════════════════════════════════════
  { id: 'o_st_disguise', stance: 'grey', priority: 5, group: 'stealth', when: { day: [3, 14], notFlags: ['stance_legal', 'disguise_hood'] }, done: { event: 'action:night_disguise' },
    text: 'Option : la capuche du portemanteau avant de descendre. De loin, vous êtes « un jeune ».' },
  { id: 'o_st_landline', stance: 'grey', priority: 5, group: 'stealth', when: { day: [3, 14], notFlags: ['stance_legal'] }, done: { event: 'action:night_call_landline' },
    text: 'Option : un appel au fixe de l’estaminet rentre le personnel trois minutes.' },
  { id: 'o_st_pizza', stance: 'grey', priority: 4, group: 'stealth', when: { day: [4, 14], notFlags: ['stance_legal'] }, done: { event: 'action:night_wrong_pizza' },
    text: 'Option : des pizzas à la mauvaise porte. Une table entière se lève pour aider.' },
  { id: 'o_st_firecracker', stance: 'illegal', priority: 5, group: 'stealth', when: { day: [5, 14], flags: ['stance_direct'] }, done: { event: 'action:night_firecracker' },
    text: 'Option illégale : un pétard côté place, deux minutes de regards ailleurs. Et un risque.' },
  { id: 'o_st_window', stance: 'info', priority: 6, when: { flags: ['stance_direct'] }, done: null,
    text: 'Guettez « Fenêtre propice » : une minute où toute la rue regarde ailleurs.' },
  { id: 'o_st_late', stance: 'info', priority: 5, when: { day: [3, 14], flags: ['stance_direct'] }, done: null,
    text: 'Après 1h : terrasses vides, Klaas endormi. La rue est à vous… et au Risque.' },
];
