// Tutoriels « en main » des outils de la nuit (GAME_DESIGN §12b.B, §13.J). Données pures : aucune logique, aucun DOM.
// Un repère (coach mark) de 1 à 3 étapes la première fois qu'un outil est disponible : il montre la touche et le bouton de
// manette, attend que le joueur l'ait vraiment fait, le félicite en une ligne, puis s'efface. Passable, rejouable depuis l'Aide.
//
// { id, tool, trigger, steps: [{ text, key, pad, done }], congrats }
//   tool    : l'outil (id d'UNLOCKS dans unlocks.js, ou un outil de départ : move, window, photo, police, waiter, bucket,
//             phone, dossier, night_menu, bed)
//   trigger : quand le repère peut apparaître
//             { night: 1, after: minutes, where?: 'street' | 'apt' | 'window' } : outils de départ, étalés sur la 1re nuit
//             { unlock: '<id d'UNLOCKS>', after?, where? } : à la première nuit où l'outil est débloqué
//   steps   : text ≤ 2 lignes, avec {key} et {pad} remplacés par `key` (clavier) et `pad` (bouton de manette, NIGHT_MAP
//             de src/input/gamepad.js) ; `done` = id d'événement moteur qui valide l'étape (liste dans la Build note)
//   congrats: une ligne, affichée quand la dernière étape est faite
// Les actions du menu de nuit valident par `action:<id d'ACTIONS>` (ex. action:night_ronde_jeremie).
// Règle d'écriture : le repère montre comment faire, jamais pourquoi il faudrait le faire quand c'est illégal.

export const TOOL_TUTORIALS = [
  // ════════════════════════════════════════════════════════════════════════
  // PREMIÈRE NUIT : les outils de départ, étalés de 20h30 à minuit
  // ════════════════════════════════════════════════════════════════════════
  {
    id: 'tuto_move',
    tool: 'move',
    trigger: { night: 1, after: 20 * 60 + 30, where: 'street' },
    steps: [
      { text: 'Marchez avec {key}, regardez à la souris. La rue fait 150 mètres : prenez votre temps, la nuit commence.', key: 'ZQSD / WASD', pad: 'stick gauche', done: 'moved' },
      { text: 'Pressé ? {key} pour courir. Sur les pavés, les chaises entendent tout.', key: 'Maj', pad: 'LS', done: 'ran' },
    ],
    congrats: 'Vous marchez dans votre propre rue. Premier exploit de la soirée.',
  },
  {
    id: 'tuto_photo',
    tool: 'photo',
    trigger: { night: 1, after: 20 * 60 + 40, where: 'street' },
    steps: [
      { text: 'Visez une table de terrasse et appuyez sur {key} / {pad}. L’heure et le nombre de chaises partent au dossier.', key: 'P', pad: 'X', done: 'photo_taken' },
    ],
    congrats: 'Première pièce au dossier. Elle est horodatée : Jérémie va l’adorer.',
  },
  {
    id: 'tuto_window',
    tool: 'window',
    trigger: { night: 1, after: 21 * 60 },
    steps: [
      { text: 'Rentrez chez vous : {key} / {pad} devant la porte du n°10, puis l’escalier jusqu’au deuxième.', key: 'E', pad: 'A', done: 'entered_building' },
      { text: 'Allez à la fenêtre du salon : la terrasse est juste en dessous, et la gaine aussi.', key: 'E', pad: 'A', done: 'at_window' },
    ],
    congrats: 'Le meilleur point de vue de la rue. Et le plus bruyant.',
  },
  {
    id: 'tuto_waiter',
    tool: 'waiter',
    trigger: { night: 1, after: 22 * 60 + 5, where: 'street' },
    steps: [
      { text: 'Il est plus de 22h et des tables traînent. Approchez du serveur et demandez poliment avec {key} / {pad}.', key: 'E', pad: 'A', done: 'waiter_asked' },
    ],
    congrats: 'Demandé poliment. Il dira peut-être oui. Le patron, c’est une autre histoire.',
  },
  {
    id: 'tuto_police',
    tool: 'police',
    trigger: { night: 1, after: 22 * 60 + 20 },
    steps: [
      { text: 'Sortez le téléphone : {key} / {pad}.', key: 'T', pad: 'LB', done: 'phone_opened' },
      { text: 'Appelez la police municipale. Elle viendra… à son rythme.', key: 'Entrée', pad: 'A', done: 'police_called' },
    ],
    congrats: 'Appel enregistré. Regardez bien qui arrive, et ce que font les tables juste avant.',
  },
  {
    id: 'tuto_db_first',
    tool: 'db_reading',
    trigger: { unlock: 'db_reading', after: 21 * 60 + 30 }, // 1re nuit : après la photo et la fenêtre
    steps: [
      { text: 'Après 22h, le bruit compte. Faites un relevé : {key} / {pad}.', key: 'B', pad: 'RB', done: 'db_taken' },
    ],
    congrats: 'Mesuré, daté, rangé. Le bruit devient un chiffre, et un chiffre se discute moins.',
  },
  {
    id: 'tuto_bucket',
    tool: 'bucket',
    trigger: { night: 1, after: 22 * 60 + 40, where: 'window' },
    steps: [
      { text: 'Le seau d’eau est là, sur le rebord. {key} (manette : maintenir {pad}). C’est illégal, et ça ne s’efface pas.', key: 'F', pad: 'RT', done: 'bucket_noticed' },
      { text: 'Avant toute bêtise, lisez la ligne 👁 : ce sont les gens qui pourraient vous voir.', key: '', pad: '', done: 'witnesses_read' },
    ],
    congrats: 'Vous savez qui regarde. Ce que vous en faites ne regarde que vous.',
  },
  {
    id: 'tuto_dossier',
    tool: 'dossier',
    trigger: { night: 1, after: 23 * 60 },
    steps: [
      { text: 'Ouvrez le dossier : {key} / {pad}. Tout ce que vous avez prouvé ce soir y est, avec l’heure.', key: 'Tab', pad: 'RS', done: 'dossier_opened' },
    ],
    congrats: 'Un vrai dossier. Maître Vandamme aurait presque souri.',
  },
  {
    id: 'tuto_night_menu',
    tool: 'night_menu',
    trigger: { night: 1, after: 23 * 60 + 20 },
    steps: [
      { text: 'Le menu de nuit : {key} / {pad}. Il s’enrichira au fil des jours, selon ce que vous aurez appris et osé.', key: 'N', pad: 'Y', done: 'night_menu_opened' },
    ],
    congrats: 'Vous avez vu le menu. Il va grossir.',
  },
  {
    id: 'tuto_bed',
    tool: 'bed',
    trigger: { night: 1, after: 24 * 60 + 15, where: 'apt' },
    steps: [
      { text: 'Fatigué ? Le lit, {key} / {pad}, fait passer le temps. Mais ce qui se passe dehors pendant ce temps-là, vous le ratez.', key: 'E', pad: 'A', done: 'bed_tried' },
    ],
    congrats: 'Dormir est aussi une stratégie. La rue, elle, ne dort pas.',
  },

  // ════════════════════════════════════════════════════════════════════════
  // OUTILS DÉBLOQUÉS : à la première nuit où ils arrivent (unlocks.js)
  // ════════════════════════════════════════════════════════════════════════
  {
    id: 'tuto_whatsapp',
    tool: 'whatsapp_group',
    trigger: { unlock: 'whatsapp_group' },
    steps: [
      { text: 'Téléphone ({key} / {pad}), puis le groupe de l’association : partagez vos photos de la soirée.', key: 'T', pad: 'LB', done: 'action:night_whatsapp' },
    ],
    congrats: 'Partagé. Seb a déjà répondu trois émojis.',
  },
  {
    id: 'tuto_round',
    tool: 'round_jeremie',
    trigger: { unlock: 'round_jeremie', where: 'street' },
    steps: [
      { text: 'Jérémie et Biloute font la ronde à 22h. Rejoignez-les depuis le menu de nuit : {key} / {pad}.', key: 'N', pad: 'Y', done: 'action:night_ronde_jeremie' },
    ],
    congrats: 'Vous êtes de la ronde. Biloute vous a accepté. Presque.',
  },
  {
    id: 'tuto_police_asso',
    tool: 'police_asso',
    trigger: { unlock: 'police_asso' },
    steps: [
      { text: 'Au téléphone ({key} / {pad}), une nouvelle ligne : la police « pour l’Association ». Plus rapide, moins discret.', key: 'T', pad: 'LB', done: 'action:night_police_asso' },
    ],
    congrats: 'Ils arrivent plus vite. Le bloc, lui, a noté votre numéro.',
  },
  {
    id: 'tuto_mairie',
    tool: 'mairie_report',
    trigger: { unlock: 'mairie_report' },
    steps: [
      { text: 'Téléphone ({key} / {pad}), « Mairie » : un signalement avec vos photos en pièces jointes.', key: 'T', pad: 'LB', done: 'action:night_mairie' },
    ],
    congrats: 'Signalé. Délai de traitement : « les meilleurs délais ».',
  },
  {
    id: 'tuto_legal_view',
    tool: 'legal_view',
    trigger: { unlock: 'legal_view', where: 'street' },
    steps: [
      { text: 'Le plan de la mairie est arrivé. Appuyez sur {key} / {pad} : les zones et le couloir apparaissent.', key: 'L', pad: 'LT', done: 'legal_view_toggled' },
      { text: 'Une table rouge mord sur le couloir. Approchez-vous à moins de cinq mètres et photographiez-la ({key} / {pad}).', key: 'P', pad: 'X', done: 'corridor_measured' },
    ],
    congrats: 'Débordement mesuré, au centimètre. Les géomètres de la mairie vous envieraient.',
  },
  {
    id: 'tuto_window_camera',
    tool: 'window_camera',
    trigger: { unlock: 'window_camera', where: 'window' },
    steps: [
      { text: 'À la fenêtre, menu de nuit ({key} / {pad}) : installez la webcam sur le rebord.', key: 'N', pad: 'Y', done: 'action:night_camera_window' },
    ],
    congrats: 'Elle filme. Vous pouvez dormir… en théorie.',
  },
  {
    id: 'tuto_pranks',
    tool: 'pranks',
    trigger: { unlock: 'pranks' },
    steps: [
      { text: 'Deux nouvelles lignes rouges dans le menu de nuit ({key} / {pad}). Rouge veut dire illégal : regardez la ligne 👁 d’abord.', key: 'N', pad: 'Y', done: 'night_menu_opened' },
    ],
    congrats: 'Vous savez où elles sont. Le Risque aussi.',
  },
  {
    id: 'tuto_film',
    tool: 'film_crowd',
    trigger: { unlock: 'film_crowd', where: 'street' },
    steps: [
      { text: 'Menu de nuit ({key} / {pad}), « Filmer » : gris, donc permis mais délicat. Les visages des clients, eux, ont des droits.', key: 'N', pad: 'Y', done: 'night_menu_opened' },
    ],
    congrats: 'Noté. Floutez, ou gardez-le pour vous.',
  },
  {
    id: 'tuto_flood',
    tool: 'flood_police',
    trigger: { unlock: 'flood_police' },
    steps: [
      { text: 'Menu de nuit ({key} / {pad}) : rappeler la police, encore et encore. Gris, et le standard a de la mémoire.', key: 'N', pad: 'Y', done: 'night_menu_opened' },
    ],
    congrats: 'Vous connaissez le numéro par cœur. Eux aussi, le vôtre.',
  },
  {
    id: 'tuto_sabotage',
    tool: 'sabotage',
    trigger: { unlock: 'sabotage', where: 'street' },
    steps: [
      { text: 'Trois actions rouges dans le menu de nuit ({key} / {pad}), à faire dans la rue. La nuit noire aide, les témoins non.', key: 'N', pad: 'Y', done: 'night_menu_opened' },
    ],
    congrats: 'Vous savez faire. Reste à savoir si vous ferez.',
  },
  {
    id: 'tuto_awning_camera',
    tool: 'awning_camera',
    trigger: { unlock: 'awning_camera', where: 'street' },
    steps: [
      { text: 'Devant l’estaminet, menu de nuit ({key} / {pad}) : la caméra sous le store. Illégale, et utile seulement à la presse.', key: 'N', pad: 'Y', done: 'night_menu_opened' },
    ],
    congrats: 'Vous avez vu l’option. Klaas, peut-être, vous a vu la regarder.',
  },
  {
    id: 'tuto_carbonnade',
    tool: 'carbonnade',
    trigger: { unlock: 'carbonnade', where: 'street' },
    steps: [
      { text: 'Dédé vous invite. Menu de nuit ({key} / {pad}) devant l’estaminet : la carbonnade, c’est la maison qui offre.', key: 'N', pad: 'Y', done: 'night_menu_opened' },
    ],
    congrats: 'L’invitation est là. Klaas aussi.',
  },
  {
    id: 'tuto_bribe_waiter',
    tool: 'bribe_waiter',
    trigger: { unlock: 'bribe_waiter', where: 'street' },
    steps: [
      { text: 'Près du serveur, menu de nuit ({key} / {pad}) : un billet glissé. Illégal ; Dédé n’est jamais loin.', key: 'N', pad: 'Y', done: 'night_menu_opened' },
    ],
    congrats: 'L’option existe. Le serveur, lui, n’a rien vu. Pour l’instant.',
  },
  {
    id: 'tuto_informant',
    tool: 'informant',
    trigger: { unlock: 'informant' },
    steps: [
      { text: 'Théo vous a parlé. De nouvelles lignes rouges dans le menu de nuit ({key} / {pad}). Chacune a un prix.', key: 'N', pad: 'Y', done: 'night_menu_opened' },
    ],
    congrats: 'Vous en savez trop. C’est souvent comme ça que ça commence.',
  },
  {
    id: 'tuto_bribe_photo',
    tool: 'bribe_photo',
    trigger: { unlock: 'bribe_photo', where: 'window' },
    steps: [
      { text: 'À la fenêtre, menu de nuit ({key} / {pad}) : guetter le pot-de-vin. Long, légal, et décisif si ça marche.', key: 'N', pad: 'Y', done: 'action:night_bribe_photo_window' },
    ],
    congrats: 'Vous avez guetté. La patience, c’est aussi une preuve.',
  },
  {
    id: 'tuto_borrow_power',
    tool: 'borrow_power',
    trigger: { unlock: 'borrow_power', where: 'street' },
    steps: [
      { text: 'Menu de nuit ({key} / {pad}), devant l’estaminet : brancher votre caméra sur leur électricité. Illégal, et un peu culotté.', key: 'N', pad: 'Y', done: 'night_menu_opened' },
    ],
    congrats: 'Noté. L’estaminet paiera la facture, sans le savoir.',
  },
  {
    id: 'tuto_wifi',
    tool: 'wifi',
    trigger: { unlock: 'wifi', where: 'window' },
    steps: [
      { text: 'À la fenêtre, menu de nuit ({key} / {pad}) : leur réseau est à portée. Très illégal ; Clode Kode désapprouve.', key: 'N', pad: 'Y', done: 'night_menu_opened' },
    ],
    congrats: 'Le réseau est là. Ce que vous y lirez ne pourra pas servir devant la commission.',
  },
];

// Événements que le moteur (build) émet et que l'interface (UI) attend pour valider une étape. `action:<id>` : une action
// du menu de nuit (ACTIONS) a été jouée.
export const TUTORIAL_EVENTS = {
  moved: 'le joueur a marché quelques mètres',
  ran: 'le joueur a couru (Maj / LS)',
  entered_building: 'le joueur est entré au n°10 (porte de la rue)',
  at_window: 'le joueur est à la fenêtre du salon',
  photo_taken: 'une photo a été prise (avec ou sans pièce au dossier)',
  db_taken: 'un relevé de décibels a été fait (B / RB)',
  phone_opened: 'le téléphone a été ouvert (T / LB)',
  police_called: 'la police a été appelée (n’importe quelle ligne)',
  waiter_asked: 'le serveur a été sollicité (E / A près de lui)',
  bucket_noticed: 'le joueur est à la fenêtre avec le seau à portée (indice F affiché)',
  witnesses_read: 'la ligne 👁 des témoins possibles a été affichée au moins 3 s',
  dossier_opened: 'le dossier a été ouvert (Tab / RS)',
  night_menu_opened: 'le menu de nuit a été ouvert (N / Y)',
  legal_view_toggled: 'la vue des zones légales a été activée (L / LT)',
  corridor_measured: 'un débordement sur le couloir a été mesuré (photo dans la rue, < 5 m)',
  bed_tried: 'le joueur s’est mis au lit (E / A près du lit)',
};

