// Contre-offensives du bloc des restaurants (GAME_DESIGN §8, contrat §14). Données pures : aucune logique, aucun DOM.
// Chaque entrée : { id, title, speaker?, when, text, effects, once? }
//   when    : conditions §14 (day, phase, flags, notFlags, stats, hidden, chance), évaluées par le moteur
//   effects : effets §14, dont setFlags ; les drapeaux cm_* servent aux événements, dialogues et fins
//   once    : true par défaut ici sauf mention contraire (once: false = peut revenir)
// Règle anti-spoiler : Régis n'est nommé comme traître qu'après `traitor_known` ; le serveur reste « le serveur »
// tant que `met_waiter` n'est pas posé. Fiction : aucun personnage ni commerce réel.

export const COUNTERMOVES = [
  // ════════════════════════════════════════════════════════════════════════
  // LE FIL DE TATIE : « c'est en cours de réparation » (12 promesses, J1 → J14)
  // Chaque e-mail de Ghislain arrive le matin, Tatie le transfère à Pilou.
  // ════════════════════════════════════════════════════════════════════════
  {
    id: 'tatie_mail_01',
    title: 'Fil Tatie · promesse n°1',
    speaker: 'ghislain',
    when: { day: [1, 14], phase: 'morning', notFlags: ['tatie_mail_1'] },
    text: "« Chère Madame, nous avons bien pris en compte votre remarque concernant l'odeur. C'est en cours de réparation. Bien cordialement, Ghislain. » Tatie, en transférant : « C'est le 31e e-mail identique depuis 2023. Je les garde tous. »",
    effects: { setFlags: ['tatie_mail_1', 'met_tatie'] },
    once: true,
  },
  {
    id: 'tatie_mail_02',
    title: 'Fil Tatie · promesse n°2',
    speaker: 'ghislain',
    when: { day: [2, 14], phase: 'morning', flags: ['tatie_mail_1'], notFlags: ['tatie_mail_2'] },
    text: "« Chère Madame, un technicien passera cette semaine. C'est en cours. » Tatie : « Le technicien de 2024 n'est jamais venu. Celui de 2025 non plus. On dirait un fantôme qu'on promet aux enfants. »",
    effects: { setFlags: ['tatie_mail_2'] },
    once: true,
  },
  {
    id: 'tatie_mail_03',
    title: 'Fil Tatie · promesse n°3',
    speaker: 'ghislain',
    when: { day: [3, 14], phase: 'morning', flags: ['tatie_mail_2'], notFlags: ['tatie_mail_3'] },
    text: "« Chère Madame, la pièce est commandée en Belgique. C'est en cours d'acheminement. » Tatie : « Courtrai, c'est à quarante minutes. À pied, ça fait trois ans ? »",
    effects: { setFlags: ['tatie_mail_3'] },
    once: true,
  },
  {
    id: 'tatie_mail_04',
    title: 'Fil Tatie · promesse n°4',
    speaker: 'ghislain',
    when: { day: [4, 14], phase: 'morning', flags: ['tatie_mail_3'], notFlags: ['tatie_mail_4'] },
    text: "« Chère Madame, la pièce est bloquée à la douane de Rekkem. C'est en cours de dédouanement. » Tatie : « Il n'y a plus de douane à Rekkem depuis 1993. J'y suis allée. J'ai acheté du tabac. »",
    effects: { setFlags: ['tatie_mail_4'] },
    once: true,
  },
  {
    id: 'tatie_mail_05',
    title: 'Fil Tatie · promesse n°5',
    speaker: 'ghislain',
    when: { day: [5, 14], phase: 'morning', flags: ['tatie_mail_4'], notFlags: ['tatie_mail_5'] },
    text: "« Chère Madame, le technicien vient d'être papa. Toutes nos félicitations à lui. Le dossier est en cours de reprise par un collègue. » Tatie : « Je lui ai envoyé une brassière. On verra bien si elle arrive. »",
    effects: { setFlags: ['tatie_mail_5'] },
    once: true,
  },
  {
    id: 'tatie_mail_06',
    title: 'Fil Tatie · promesse n°6',
    speaker: 'ghislain',
    when: { day: [6, 14], phase: 'morning', flags: ['tatie_mail_5'], notFlags: ['tatie_mail_6'] },
    text: "« Chère Madame, après analyse, l'odeur proviendrait peut-être de l'ancien canal sous la rue. C'est en cours de vérification historique. » Tatie : « Le canal est couvert depuis 1912. Il sent la carbonnade depuis des années. Drôle de canal. »",
    effects: { setFlags: ['tatie_mail_6'] },
    once: true,
  },
  {
    id: 'tatie_mail_07',
    title: 'Fil Tatie · promesse n°7',
    speaker: 'ghislain',
    when: { day: [7, 14], phase: 'morning', flags: ['tatie_mail_6'], notFlags: ['tatie_mail_7'] },
    text: "« Chère Madame, nous avons mandaté un consultant olfactif. Son rapport préliminaire parle d'une odeur ‹ chaleureuse, conviviale, typiquement nordiste ›. C'est en cours d'interprétation. » Tatie : « Moi aussi je peux être consultante. L'odeur est ‹ dégoûtante ›. C'est gratuit. »",
    effects: { setFlags: ['tatie_mail_7'] },
    once: true,
  },
  {
    id: 'tatie_mail_08',
    title: 'Fil Tatie · promesse n°8',
    speaker: 'ghislain',
    when: { day: [8, 14], phase: 'morning', flags: ['tatie_mail_7'], notFlags: ['tatie_mail_8'] },
    text: "« Chère Madame, une nouvelle gaine fabriquée à Roubaix est en cours de conception. Elle sera inaugurée. » Tatie : « Inaugurée. Avec un ruban. Il veut que je vienne couper le ruban de ma propre nuisance. »",
    effects: { setFlags: ['tatie_mail_8'] },
    once: true,
  },
  {
    id: 'tatie_mail_09',
    title: 'Fil Tatie · promesse n°9',
    speaker: 'ghislain',
    when: { day: [10, 14], phase: 'morning', flags: ['tatie_mail_8'], notFlags: ['tatie_mail_9'] },
    text: "« Chère Madame, nous préparons un dossier pour faire reconnaître l'odeur de carbonnade comme patrimoine immatériel des Hauts-de-France. C'est en cours de candidature. » Tatie : « Hippolyte a failli s'étouffer avec son thé. Pour une fois, c'était pas la gaine. »",
    effects: { setFlags: ['tatie_mail_9'] },
    once: true,
  },
  {
    id: 'tatie_mail_10',
    title: 'Fil Tatie · promesse n°10',
    speaker: 'ghislain',
    when: { day: [11, 14], phase: 'morning', flags: ['tatie_mail_9'], notFlags: ['tatie_mail_10'] },
    text: "« Chère Madame, c'est réparé. » Tatie, une heure plus tard : « J'ai ouvert la fenêtre. Ce n'est pas réparé. J'ai répondu ‹ non ›. Il m'a répondu ‹ c'est en cours de re-réparation ›. »",
    effects: { setFlags: ['tatie_mail_10'] },
    once: true,
  },
  {
    id: 'tatie_mail_11',
    title: 'Fil Tatie · promesse n°11',
    speaker: 'ghislain',
    when: { day: [12, 14], phase: 'morning', flags: ['tatie_mail_10'], notFlags: ['tatie_mail_11'] },
    text: "« Chère Madame, Clode Kode nous aide désormais à rédiger nos réponses. Nous sommes sincèrement désolés pour la gêne occasionnée et nous nous engageons à… [Réponse générée automatiquement. Je ne peux pas promettre une réparation que je ne peux pas vérifier.] » Tatie : « Même la machine ne le croit plus. »",
    effects: { setFlags: ['tatie_mail_11'] },
    once: true,
  },
  {
    id: 'tatie_mail_12',
    title: 'Fil Tatie · promesse n°12',
    speaker: 'ghislain',
    when: { day: [13, 14], phase: 'morning', flags: ['tatie_mail_11'], notFlags: ['tatie_mail_12'] },
    text: "Réponse automatique : « Ghislain est absent jusqu'au lendemain de la commission des terrasses. Pour toute urgence olfactive, merci de patienter. C'est en cours. » Tatie imprime, agrafe, et classe. « Douze. Une douzaine, comme les huîtres. Et ça sent pareil. »",
    effects: { setFlags: ['tatie_mail_12'] },
    once: true,
  },

  // ════════════════════════════════════════════════════════════════════════
  // LA DANSE DES TABLES, LA FUMÉE, LES POUBELLES (harcèlement du quotidien)
  // ════════════════════════════════════════════════════════════════════════
  {
    id: 'cm_table_dance',
    title: 'La danse des tables',
    speaker: 'dede',
    when: { day: [2, 14], phase: 'afternoon', flags: ['called_police'], notFlags: ['cm_table_dance'] },
    text: "Hier soir : tables rentrées à 21h59 pile, sous l'œil d'un passant qui filmait. Ressorties à 22h20, sous l'œil de personne. Dédé appelle ça « une respiration de la terrasse ». Le règlement appelle ça autrement.",
    effects: { sleep: -5, setFlags: ['cm_table_dance'] },
    once: true,
  },
  {
    id: 'cm_table_dance_again',
    title: 'La danse des tables (reprise)',
    speaker: 'dede',
    when: { phase: 'afternoon', flags: ['cm_table_dance'], hidden: { hostility: '>=30' }, chance: 0.3 },
    text: "Rebelote : 21h59, rentrées. 22h17, ressorties. Le chorégraphe progresse, il a gagné trois minutes.",
    effects: { sleep: -4, dossier: +1 },
    once: false,
  },
  {
    id: 'cm_smokers',
    title: 'Pause clope sous la fenêtre',
    speaker: 'ghislain',
    when: { day: [2, 14], phase: 'afternoon', hidden: { hostility: '>=25' }, notFlags: ['cm_smokers'] },
    text: "Depuis hier, toute la brigade de cuisine fume juste sous votre fenêtre, en rang, comme pour une photo de classe. Ghislain, la cigarette au bout des doigts, lève les yeux et vous salue. Il a refait son chignon pour l'occasion.",
    effects: { sleep: -6, setFlags: ['cm_smokers'] },
    once: true,
  },
  {
    id: 'cm_bins',
    title: 'Les poubelles devant la porte',
    speaker: 'dede',
    when: { day: [3, 14], phase: 'morning', hidden: { hostility: '>=35' }, notFlags: ['cm_bins'] },
    text: "Ce matin, quatre bacs de l'estaminet bloquent votre porte. « Le camion passe de ce côté », assure Dédé. Le camion passe de l'autre côté depuis 1987. Biloute, lui, est ravi.",
    effects: { sleep: -3, job: -2, setFlags: ['cm_bins'] },
    once: true,
  },
  {
    id: 'cm_bins_again',
    title: 'Les poubelles, saison 2',
    speaker: 'dede',
    when: { phase: 'morning', flags: ['cm_bins'], hidden: { hostility: '>=50' }, chance: 0.25 },
    text: "Les bacs sont revenus. Quelqu'un a collé dessus une étiquette « Pilou » au feutre. L'administration des déchets n'a jamais été aussi personnalisée.",
    effects: { sleep: -2, job: -2 },
    once: false,
  },
  {
    id: 'cm_air_freshener',
    title: 'Désodorisant de combat',
    speaker: 'ghislain',
    when: { phase: 'afternoon', flags: ['stink_bomb'], notFlags: ['cm_air_freshener'] },
    text: "Après la boule puante, l'estaminet a installé un diffuseur « parfum frites fraîches » sous le store. Il tourne jusqu'à minuit. Vous regrettez presque la boule puante.",
    effects: { sleep: -4, hostility: +5, setFlags: ['cm_air_freshener'] },
    once: true,
  },

  // ════════════════════════════════════════════════════════════════════════
  // DIVISER L'ASSOCIATION
  // ════════════════════════════════════════════════════════════════════════
  {
    id: 'cm_free_drinks',
    title: 'Tournée générale (pour certains)',
    speaker: 'dede',
    when: { day: [3, 12], phase: 'afternoon', stats: { asso: '>=30' }, notFlags: ['cm_free_drinks'] },
    text: "Dédé offre « un petit genièvre aux voisins sympas ». Tatie Bouchon a accepté le sien, puis un deuxième, « par politesse ». Ce soir, elle trouve que « le monsieur jovial n'est pas si méchant, hein ».",
    effects: { asso: -6, setFlags: ['cm_free_drinks', 'tatie_wavering'] },
    once: true,
  },
  {
    id: 'cm_counter_banner',
    title: 'Contre-banderole',
    speaker: 'ghislain',
    when: { phase: 'afternoon', flags: ['banners_up'], notFlags: ['cm_counter_banner'] },
    text: "Réponse à vos banderoles : une bâche géante sur la façade de l'estaminet, « ICI ON VIT, HEIN ! ». Elle cache en partie la clim installée sans permis. Ce n'est sûrement pas un hasard.",
    effects: { hostility: +5, setFlags: ['cm_counter_banner'] },
    once: true,
  },
  {
    id: 'cm_happy_petition',
    title: 'La pétition des clients heureux',
    speaker: 'ghislain',
    when: { phase: 'afternoon', flags: ['petition_started'], notFlags: ['cm_happy_petition'] },
    text: "Le bloc lance sa propre pétition : « Pour une rue des Bouchers vivante ». 2 300 signatures en deux jours, dont 1 900 hors métropole, un certain « Jean Bon (Bruxelles) » et trois fois Dédé. La mairie compte quand même les deux piles.",
    effects: { asso: -3, dossier: -1, setFlags: ['cm_happy_petition'] },
    once: true,
  },

  // ════════════════════════════════════════════════════════════════════════
  // LE TRAÎTRE : le bloc recrute Régis Dewaele (n°27, deux meublés touristiques)
  // ════════════════════════════════════════════════════════════════════════
  {
    id: 'cm_regis_courted',
    title: 'Un tarif « riverain »',
    speaker: 'klaas',
    when: { day: [2, 8], phase: 'afternoon', hidden: { hostility: '>=15' }, notFlags: ['regis_courted'] },
    text: "Klaas lit son carnet : « Avant-hier, 21h05 : un membre de l'association dîne à l'estaminet. Hier, 21h10 : idem. On ne lui apporte pas d'addition. » Il referme le carnet. « Je ne dis pas qui. Pas encore. Ja. »",
    effects: { setFlags: ['regis_courted'] },
    once: true,
  },
  {
    id: 'cm_traitor_recruited',
    title: 'Fuite dans l\'association',
    speaker: 'nico',
    when: { day: [4, 11], phase: 'afternoon', flags: ['regis_courted'], hidden: { hostility: '>=30' }, notFlags: ['traitor_recruited'] },
    text: "Nico, sur le groupe : « Quelqu'un peut m'expliquer comment Ghislain connaît l'ordre du jour de notre réunion ? Il l'a cité mot pour mot à la boulangerie. » Personne ne répond. Tout le monde regarde tout le monde.",
    effects: { asso: -5, setFlags: ['traitor_recruited'] },
    once: true,
  },
  {
    id: 'cm_regis_leak_petition',
    title: 'Coup de vitesse',
    speaker: 'seb',
    when: { phase: 'afternoon', flags: ['traitor_recruited', 'petition_started'], notFlags: ['regis_leak_petition'] },
    text: "Une heure avant que votre pétition soit imprimée, chaque table du bloc avait déjà sa pile de cartes « Soutenez votre estaminet ». « Attends, attends », dit Seb. « On n'en avait parlé qu'à la réunion. À douze. Portes fermées. »",
    effects: { asso: -3, hostility: +5, setFlags: ['regis_leak_petition'] },
    once: true,
  },
  {
    id: 'cm_regis_leak_lawyer',
    title: 'Ils savaient pour l\'avocat',
    speaker: 'jeremie',
    when: { phase: 'afternoon', flags: ['traitor_recruited', 'lawyer_hired'], notFlags: ['regis_leak_lawyer'] },
    text: "L'estaminet a pris un avocat la veille du jour où vous avez mandaté Maître Vandamme. Jérémie relit le compte rendu de réunion, puis la liste des présents. « Ce n'est pas une coïncidence. C'est un procès-verbal qui a des jambes. »",
    effects: { hostility: +5, setFlags: ['regis_leak_lawyer'] },
    once: true,
  },
  {
    id: 'cm_regis_blunder',
    title: 'Mauvais groupe',
    speaker: 'regis',
    when: { phase: 'afternoon', flags: ['traitor_recruited', 'whatsapp_rally'], notFlags: ['traitor_known'], chance: 0.35 },
    text: "14h32, sur le groupe de l'association, un message de Régis Dewaele : « Dédé, ils ressortent les photos samedi soir, je te garde une table pour 8 ? » Supprimé à 14h33. Nico a fait une capture à 14h32 et 30 secondes.",
    effects: { asso: +4, dossier: +1, setFlags: ['traitor_known'] },
    once: true,
  },
  {
    id: 'cm_regis_known_vote',
    title: 'Régis « dans la nuance »',
    speaker: 'regis',
    when: { phase: 'afternoon', flags: ['traitor_known'], notFlags: ['cm_regis_nuance'] },
    text: "Démasqué, Régis ne s'excuse pas : il « comprend les deux côtés ». Ses locataires aiment l'ambiance, ses voisins aiment dormir, et lui aime les deux loyers. Il propose une « médiation ». Avec lui comme médiateur.",
    effects: { asso: +2, hostility: +5, setFlags: ['cm_regis_nuance'] },
    once: true,
  },

  // ════════════════════════════════════════════════════════════════════════
  // PLAINTES ET JURIDIQUE
  // ════════════════════════════════════════════════════════════════════════
  {
    id: 'cm_harassment_calls',
    title: 'Plainte pour harcèlement',
    speaker: 'ghislain',
    when: { phase: 'afternoon', flags: ['serial_caller'], notFlags: ['cm_harassment_complaint'] },
    text: "Le bloc dépose plainte pour « harcèlement téléphonique par voie de police interposée ». Le commissariat a joint la liste de vos appels, horodatés. Pour une fois, l'administration a été rapide.",
    effects: { risk: +10, setFlags: ['cm_harassment_complaint'] },
    once: true,
  },
  {
    id: 'cm_harassment_hostility',
    title: 'Plainte pour harcèlement',
    speaker: 'ghislain',
    when: { day: [5, 14], phase: 'afternoon', hidden: { hostility: '>=70' }, notFlags: ['cm_harassment_complaint'] },
    text: "Lettre recommandée de l'estaminet : plainte pour « harcèlement moral d'un établissement familial ». La famille, ce sont deux associés et une friteuse.",
    effects: { risk: +10, setFlags: ['cm_harassment_complaint'] },
    once: true,
  },
  {
    id: 'cm_defamation_press',
    title: 'Plainte pour diffamation',
    speaker: 'ghislain',
    when: { phase: 'afternoon', flags: ['press_article'], notFlags: ['cm_defamation'] },
    text: "Après l'article, le bloc porte plainte pour diffamation. Maître Vandamme lit la plainte, sourit, et dit : « La vérité est une excellente défense. Vous avez gardé les photos horodatées, n'est-ce pas ? »",
    effects: { risk: +5, setFlags: ['cm_defamation'] },
    once: true,
  },
  {
    id: 'cm_defamation_reviews',
    title: 'Les faux avis, vrai problème',
    speaker: 'ghislain',
    when: { phase: 'afternoon', flags: ['fake_reviews_traced'], notFlags: ['cm_defamation'] },
    text: "Ghislain a imprimé les douze faux avis, surligné les tournures communes et retrouvé votre façon unique de dire « en l'état ». Plainte pour dénigrement. Cette fois, la vérité n'est pas de votre côté.",
    effects: { risk: +15, asso: -5, setFlags: ['cm_defamation'] },
    once: true,
  },
  {
    id: 'cm_lawyer_reply',
    title: 'Réponse à la mise en demeure',
    speaker: 'ghislain',
    when: { phase: 'afternoon', flags: ['formal_notice'], notFlags: ['cm_lawyer_reply'] },
    text: "Réponse de l'avocat de l'estaminet, quatre pages : la mise en demeure est « sans objet », la terrasse est « conforme dans l'esprit », et la gaine « est en cours d'étude ». Maître Vandamme encadre la dernière phrase.",
    effects: { dossier: +1, setFlags: ['cm_lawyer_reply'] },
    once: true,
  },

  // ════════════════════════════════════════════════════════════════════════
  // LE RÉSEAU DE COLETTE VERHAEGHE
  // ════════════════════════════════════════════════════════════════════════
  {
    id: 'cm_colette_call',
    title: 'Un coup de fil à l\'ancienne maire',
    speaker: 'tatie',
    when: { phase: 'afternoon', flags: ['lescaut_requested'], notFlags: ['cm_colette_call'] },
    text: "Tatie, gênée : « Colette m'a dit au thé que ‹ certains riverains veulent voir le maire ›. Elle l'a su avant moi. » Le rendez-vous avec Bertrand Lescaut est soudain « à reprogrammer, agenda chargé ».",
    effects: { corruption: +5, setFlags: ['cm_colette_call'] },
    once: true,
  },
  {
    id: 'cm_colette_call_notice',
    title: 'Colette s\'en mêle',
    speaker: 'tatie',
    when: { phase: 'afternoon', flags: ['formal_notice'], notFlags: ['cm_colette_call'] },
    text: "Le lendemain de la mise en demeure, Colette Verhaeghe déjeune à l'estaminet, en terrasse, à midi, bien en vue. Une ancienne maire qui mange une carbonnade, c'est un message. Tout le monde l'a reçu.",
    effects: { corruption: +5, setFlags: ['cm_colette_call'] },
    once: true,
  },
  {
    id: 'cm_festive_saturday',
    title: 'Le samedi « festif »',
    speaker: 'dede',
    when: { day: [7, 12], phase: 'afternoon', hidden: { hostility: '>=30' }, notFlags: ['cm_festive_saturday'] },
    text: "Le bloc envoie à la mairie un dossier glacé : « Samedi festif rue des Bouchers : terrasses jusqu'à minuit, comme rue de Gand ». Colette Verhaeghe aurait « trouvé l'idée sympathique ». La photo de couverture date d'avant la règle des 22h.",
    effects: { corruption: +5, setFlags: ['cm_festive_saturday'] },
    once: true,
  },

  // ════════════════════════════════════════════════════════════════════════
  // LA VAGUE DE HAINE EN LIGNE
  // ════════════════════════════════════════════════════════════════════════
  {
    id: 'cm_fake_post_viral',
    title: '« Bernadette harcelée »',
    speaker: 'seb',
    when: { phase: 'afternoon', flags: ['video_viral'], notFlags: ['cm_fake_post'] },
    text: "Sur les réseaux de l'estaminet : « La Ch'tite Bernadette est harcelée par UN riverain. Soutenez-nous ❤️ » avec la vidéo de vous. 4 000 partages. Bernadette n'existe pas, mais elle a désormais 4 000 défenseurs.",
    effects: { asso: -5, sleep: -5, hostility: +5, setFlags: ['cm_fake_post'] },
    once: true,
  },
  {
    id: 'cm_fake_post_press',
    title: '« Bernadette harcelée »',
    speaker: 'seb',
    when: { phase: 'afternoon', flags: ['press_article'], hidden: { hostility: '>=45' }, notFlags: ['cm_fake_post'] },
    text: "Riposte à l'article : un post larmoyant de l'estaminet, « harcelé par un riverain qui déteste la convivialité ». Commentaires : « Honte à lui », « Il a qu'à habiter à la campagne », et un « Vous fermez à quelle heure ? » resté sans réponse.",
    effects: { asso: -3, sleep: -5, setFlags: ['cm_fake_post'] },
    once: true,
  },

  // ════════════════════════════════════════════════════════════════════════
  // RIPOSTES AUX COUPS BAS DE PILOU
  // ════════════════════════════════════════════════════════════════════════
  {
    id: 'cm_camera_found_waiter',
    title: 'La caméra est découverte',
    speaker: 'ghislain',
    when: { phase: 'afternoon', flags: ['camera_awning'], notFlags: ['camera_found'], hidden: { hostility: '>=30' }, chance: 0.2 },
    text: "En nettoyant le store, Ghislain a trouvé un petit œil noir. Il l'a posé sur le comptoir comme un trophée. Plainte déposée l'après-midi même, photo du trophée à l'appui.",
    effects: { risk: +15, hostility: +15, setFlags: ['camera_found'] },
    once: true,
  },
  {
    id: 'cm_camera_found_paranoia',
    title: 'Fouille générale',
    speaker: 'dede',
    when: { phase: 'afternoon', flags: ['camera_awning', 'press_scandal'], notFlags: ['camera_found'], chance: 0.6 },
    text: "Après l'article, le bloc fouille tout : les stores, les jardinières, les pots de fleurs. Ils trouvent votre caméra, et aussi un nid de pigeons et un vieux téléphone de 2009.",
    effects: { risk: +15, hostility: +10, setFlags: ['camera_found'] },
    once: true,
  },
  {
    id: 'cm_waiter_suspected',
    title: 'Le serveur sous surveillance',
    speaker: 'dede',
    when: { phase: 'afternoon', flags: ['waiter_bribed'], notFlags: ['waiter_fired'], hidden: { hostility: '>=60' }, chance: 0.3 },
    text: "Dédé a remarqué que le serveur sourit en regardant votre fenêtre. Il le renvoie « pour raisons économiques », en lui offrant une dernière carbonnade. Votre informateur est désormais au chômage, et vous avez mauvaise conscience.",
    effects: { asso: -3, setFlags: ['waiter_fired'] },
    once: true,
  },
  {
    id: 'cm_sugar_blame',
    title: 'La carbonnade sucrée',
    speaker: 'dede',
    when: { phase: 'afternoon', flags: ['kitchen_sabotaged'], notFlags: ['kitchen_sabotage_caught', 'cm_sugar_blame'] },
    text: "Après le service sucré, Dédé accuse publiquement « un concurrent de la rue de Gand ». La rue de Gand accuse le bloc. Pour la première fois depuis des mois, on parle d'une autre rue que la vôtre.",
    effects: { hostility: -5, setFlags: ['cm_sugar_blame'] },
    once: true,
  },
  {
    id: 'cm_uritrottoir_terrace',
    title: 'Annexion',
    speaker: 'dede',
    when: { phase: 'afternoon', flags: ['uritrottoir_installed'], notFlags: ['cm_uritrottoir_terrace'] },
    text: "Dédé a posé deux tables hautes contre l'uritrottoir et l'appelle « l'espace jardin ». Il demande une extension d'AOT pour « valoriser le mobilier urbain ». La mairie ne sait pas si c'est une blague. Dédé non plus.",
    effects: { dossier: +1, setFlags: ['cm_uritrottoir_terrace'] },
    once: true,
  },
];
