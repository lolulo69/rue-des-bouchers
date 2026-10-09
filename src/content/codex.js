// Le Carnet de Pilou, l'aide et l'« À propos » (GAME_DESIGN §14). Données pures : aucune logique, aucun DOM.
//
// CODEX.carnet : trois onglets, characters / places / rules. Chaque fiche :
//   { id, title, when?, speaker?, text, position?, quote?, updates? }
//   when     : conditions §14 ; la fiche apparaît dans le Carnet dès qu'elles sont vraies (sans `when` : connue d'emblée)
//   speaker  : id de CHARACTERS (portrait) · position : son camp dans le conflit · quote : une réplique
//   updates  : [{ when, text }] lignes ajoutées sous la fiche quand Pilou apprend quelque chose (règle des spoilers)
// CODEX.help  : « Comment jouer », cartes courtes { id, title, text }.
// CODEX.about : « À propos » { title, lines: [...] } (avertissement de fiction, mot pour mot celui du README).
// Règle des spoilers (README) : un fait verrouillé n'apparaît que dans un `updates` gardé par son drapeau.

export const CODEX = {
  carnet: {
    // ══════════════════════════════════════════════════════════════════════
    // LES GENS
    // ══════════════════════════════════════════════════════════════════════
    characters: [
      {
        id: 'c_pilou',
        title: 'Pilou',
        speaker: 'pilou',
        text: "Pierre-Louis Dubeton, développeur Rust chez Koddex, deuxième étage du n°10. Sa fenêtre donne sur la terrasse de l’estaminet, et la gaine d’extraction monte jusque sous son rebord. Compte en décibels depuis le printemps.",
        position: 'Riverain. Veut dormir. Hésite encore sur les moyens.',
        quote: '« 68 dB à 23h40. Je ne dis pas que je compte. Je dis que je mesure. »',
      },
      {
        id: 'c_jeremie',
        title: 'Jérémie',
        speaker: 'jeremie',
        when: { flags: ['met_jeremie'] },
        text: "Président de l’Association de la rue des Bouchers, troisième étage du n°10. Connaît chaque arrêté par sa date et sort Biloute tous les soirs à 22h, officiellement pour une promenade hygiénique.",
        position: 'Riverains. La procédure, toute la procédure, rien que la procédure.',
        quote: '« On ne s’énerve pas, on note. Un dossier, c’est des chiffres, pas des cris. »',
        updates: [
          { when: { flags: ['joined_rounds'] }, text: 'Vous faites la ronde de 22h avec lui. Il appelle ça « une promenade à deux voix ».' },
          { when: { flags: ['stance_direct'] }, text: "L’AG a voté l’action directe. Il a pris acte. Il a aussi pris un comprimé." },
        ],
      },
      {
        id: 'c_biloute',
        title: 'Biloute',
        speaker: 'biloute',
        when: { flags: ['met_jeremie'] },
        text: "Le teckel de Jérémie. Flaire les infractions, les frites et la nervosité. Aboie au pire moment, avec une régularité de métronome.",
        position: 'Riverain. Surtout du côté des frites.',
        quote: '« Ouaf. » *S’arrête devant une chaise qui mord sur le passage.*',
      },
      {
        id: 'c_klaas',
        title: 'Klaas',
        speaker: 'klaas',
        when: { flags: ['met_klaas'] },
        text: "Grand, barbe blanche, gilet rouge : le Père Noël en préretraite. Depuis sa fenêtre sur la place Maurice-Schumann, il voit toute la rue, de loin, et note tout dans un carnet à spirale. Tout. Y compris vous.",
        position: 'Riverain. Témoin avant tout : il ne ment pas, il horodate.',
        quote: '« Je ne vous espionne pas. Je regarde par la fenêtre. Ce n’est pas pareil. »',
        updates: [
          { when: { flags: ['roster_known'] }, text: 'Il a déduit le planning des patrouilles de ses carnets. Ce qui est régulier, on peut l’écrire.' },
          { when: { flags: ['klaas_noted_pilou'] }, text: 'Votre nom figure dans le carnet. Avec l’heure.' },
          { when: { flags: ['klaas_log_certified'] }, text: 'Ses carnets sont certifiés et tamponnés. Hilde dit qu’il marche plus droit depuis.' },
        ],
      },
      {
        id: 'c_hilde',
        title: 'Hilde',
        speaker: 'hilde',
        when: { flags: ['met_hilde'] },
        text: "La femme de Klaas. Tisane, soupe aux poireaux, tarte au sucre : elle soigne la rue une assiette à la fois. Déteste la violence et les éclats de voix. La seule à pouvoir faire refermer son carnet à Klaas.",
        position: 'Riverains. Pour la paix, et pour que tout le monde mange chaud.',
        quote: '« On ne se bat pas le ventre vide. »',
      },
      {
        id: 'c_tatie',
        title: 'Tatie Bouchon',
        speaker: 'tatie',
        when: { flags: ['met_tatie'] },
        text: "Vieille dame du n°19, au milieu de la rue. Écrit à l’estaminet au sujet de l’odeur depuis 2023 et garde chaque réponse dans une boîte à chaussures intitulée « En cours ». Prend le thé avec Colette Verhaeghe.",
        position: 'Riverains… en principe. Girouette : un verre offert la fait tourner, un bon proverbe la remet droite.',
        quote: '« Si vous voulez quelque chose dans la vie, faut résister et se battre pour. »',
        updates: [
          { when: { flags: ['tatie_emails_shared'] }, text: 'Elle a versé toute la boîte « En cours » au dossier. Il a fallu un cabas.' },
          { when: { flags: ['tatie_wavering'] }, text: 'Dédé lui a offert un genièvre. Elle hésite. Un peu.' },
          { when: { flags: ['tatie_leaked_plan'] }, text: 'Elle a parlé de votre plan à Colette. Sans le vouloir. Enfin, presque.' },
        ],
      },
      {
        id: 'c_seb',
        title: 'Seb',
        speaker: 'seb',
        when: { flags: ['met_seb_nico'] },
        text: "Avec Nico, le couple d’en face, au n°13. Administrateur du groupe WhatsApp de l’association. Transforme chaque incident en feuilleton, en direct depuis le balcon.",
        position: 'Riverains. Pour le sommeil, et pour une bonne histoire.',
        quote: '« Attends, attends. Je filme ou je compte ? Les deux ? Les deux. »',
      },
      {
        id: 'c_nico',
        title: 'Nico',
        speaker: 'nico',
        when: { flags: ['met_seb_nico'] },
        text: "Avec Seb, le couple d’en face. Fait les captures d’écran, archive tout, modère le groupe quand ça part en vrille. Pose toujours la question qui fâche, calmement.",
        position: 'Riverains. Pour les preuves propres, et contre les visages filmés.',
        quote: '« Moi, je ne dis rien. J’archive. »',
      },
      {
        id: 'c_gaufre',
        title: 'Gaufre',
        speaker: 'gaufre',
        when: { flags: ['met_seb_nico'] },
        text: "La chatte de Seb et Nico. Quand elle est au balcon, ses humains sont là et regardent. Elle rentre entre 23h et minuit et demie, quand elle en a assez du bruit. Elle aussi.",
        position: 'Neutre. Méprise tout le monde avec la même équité.',
        quote: '*Un clignement lent.*',
      },
      {
        id: 'c_hippolyte',
        title: 'Hippolyte',
        speaker: 'hippolyte',
        when: { flags: ['met_hippolyte'] },
        text: "Héritier d’une famille de carrossiers, rue de la Baignerie. Vieille fortune, vieux réseau, et le service du patrimoine dans son carnet d’adresses. Vouvoie tout le monde, son chat compris.",
        position: 'Riverains. Pour le patrimoine, contre la climatisation en façade.',
        quote: '« Les plans sont une arme élégante, monsieur Dubeton. Ils ne font aucun bruit. »',
        updates: [
          { when: { flags: ['heritage_angle'] }, text: 'Il a écrit au service du patrimoine, à la plume. On lui a répondu sous huit jours.' },
          { when: { flags: ['hippolyte_room'] }, text: "L’association se réunit dans son ancien atelier de calèches." },
        ],
      },
      {
        id: 'c_regis',
        title: 'Régis Dewaele',
        speaker: 'regis',
        when: { day: [3, 14] },
        text: "Membre de l’association, au n°27, propriétaire de deux meublés touristiques. Ses locataires adorent « l’ambiance ».",
        position: 'Riverains… « dans la nuance ».',
        quote: '« Moi, je comprends les deux côtés, hein. »',
        updates: [
          { when: { flags: ['traitor_known'] }, text: "C’est lui qui renseignait le bloc. Il appelle ça « de la médiation en amont »." },
        ],
      },
      {
        id: 'c_dede',
        title: 'Dédé',
        speaker: 'dede',
        text: "Copropriétaire de l’estaminet. Petit, rond, jovial en public, arrangeur en privé. Il n’y a pas de Bernadette : c’est lui, plus ou moins. Tutoie tout le monde et règle tout d’un « c’est la maison qui offre ».",
        position: 'Le bloc, dont il est le cœur et l’estomac.',
        quote: '« Rue de Gand, ils ferment à minuit ! Minuit, mon biloute ! »',
        updates: [
          { when: { flags: ['bribe_photo'] }, text: 'Photographié en train de tendre une enveloppe à la patrouille. Il sourit moins.' },
        ],
      },
      {
        id: 'c_ghislain',
        title: 'Ghislain',
        speaker: 'ghislain',
        text: "L’autre copropriétaire. Maigre, chignon monumental, froid comme une chambre froide. Tient la paperasse, les autorisations et les e-mails « c’est en cours de résolution ».",
        position: 'Le bloc, côté classeurs.',
        quote: '« Nous prenons bonne note de votre remarque. Bien cordialement. »',
        updates: [
          { when: { flags: ['tatie_mail_12'] }, text: 'Douze promesses à Tatie. La dernière est une réponse automatique.' },
        ],
      },
      {
        id: 'c_serveur',
        title: 'Le serveur',
        speaker: 'serveur',
        text: "Jeune, épuisé, payé au SMIC et aux pourboires, quinze heures par jour l’été. Rentre les tables quand on le lui demande poliment, si le patron ne regarde pas.",
        position: 'Entre les deux. Surtout du côté de la fin de son service.',
        quote: '« Je fais que mon taf, moi. »',
        updates: [
          { when: { flags: ['met_waiter'] }, text: 'Il s’appelle Théo.' },
          { when: { flags: ['waiter_testimony'] }, text: 'Théo a signé une attestation. Sa mère le trouve courageux, son banquier un peu moins.' },
          { when: { flags: ['waiter_fired'] }, text: "Renvoyé de l’estaminet. Il dort, au moins." },
        ],
      },
      {
        id: 'c_lemaire',
        title: 'Brigadier Lemaire',
        speaker: 'lemaire',
        when: { flags: ['called_police'] },
        text: "Brigadier de la police municipale, bonhomme et paternaliste. Lent au premier appel de la soirée. A « d’autres priorités ».",
        position: 'Officiellement neutre.',
        quote: '« Tout est en ordre, monsieur. »',
        updates: [
          { when: { flags: ['seen_complaisance'] }, text: 'Abonné au café offert, et parfois au waterzooi. Zéro procès-verbal.' },
          { when: { flags: ['seen_tipoff'] }, text: 'Curieusement, les tables rentrent toujours cinq minutes avant son arrivée.' },
          { when: { flags: ['lemaire_transferred'] }, text: 'Muté aux parcmètres de Lomme.' },
        ],
      },
      {
        id: 'c_benali',
        title: 'Agent Benali',
        speaker: 'benali',
        when: { flags: ['called_police'] },
        text: "Jeune agent de la police municipale, procédure au cordeau, carnet de PV à la main. Vient vraiment, mesure vraiment, verbalise vraiment.",
        position: 'Du côté du règlement. Sa hiérarchie le lui reproche.',
        quote: '« Arrêté municipal. Vous êtes en infraction. »',
        updates: [
          { when: { flags: ['benali_transferred'] }, text: 'Muté à Hellemmes pour « excès de zèle ». Il a encadré le courrier.' },
        ],
      },
      {
        id: 'c_chef',
        title: 'Commandant Desmet',
        speaker: 'chef',
        when: { flags: ['chief_came'] },
        text: "Chef de la police municipale. Ne se déplace qu’après un scandale ou un coup de fil de la mairie. Gère sa carrière comme un plan de communication.",
        position: 'Du côté de celui qui parle le plus fort cette semaine.',
        quote: '« Nous prenons cette affaire très au sérieux. »',
      },
      {
        id: 'c_delphine',
        title: 'Delphine Vermeersch',
        speaker: 'delphine',
        text: "Inspectrice de la mairie, chargée du dossier de la climatisation posée sans autorisation. Rigoureuse, lassée des passe-droits. Mariée à Stéphane, votre patron, ce qui ne simplifie rien.",
        position: 'Du côté des dossiers solides. Déteste le mot « arrangement ».',
        quote: '« Je ne promets jamais rien. Mais je lis tout. »',
        updates: [
          { when: { flags: ['delphine_dinner'] }, text: 'Vous avez dîné chez elle et Stéphane. On n’a pas parlé du dossier. Officiellement.' },
          { when: { flags: ['ac_violation_confirmed'] }, text: 'Infraction confirmée sur la clim.' },
          { when: { flags: ['conflict_exposed'] }, text: 'Le dîner est sorti. Elle a été dessaisie du dossier.' },
        ],
      },
      {
        id: 'c_colette',
        title: 'Colette Verhaeghe',
        speaker: 'colette',
        text: "Ancienne maire, toujours influente. Protectrice historique des restaurateurs : « la convivialité, c’est l’ADN de Lille ». Prend le thé avec Tatie Bouchon.",
        position: 'Le bloc, avec un sourire de cérémonie.',
        quote: '« Mes chers amis… on va regarder ça. »',
        updates: [
          { when: { flags: ['colette_dinner_seen'] }, text: "Vue en train de dîner à l’estaminet, à une table de huit." },
        ],
      },
      {
        id: 'c_lescaut',
        title: 'Bertrand Lescaut',
        speaker: 'lescaut',
        text: "Le maire actuel. A instauré la fermeture à 22h rue des Bouchers en 2026. Penche du côté des riverains, mais doit composer avec les réseaux de l’ancienne équipe.",
        position: 'Plutôt riverains. Déteste les surprises dans la presse.',
        quote: '« Je vous entends. Apportez-moi du solide. »',
        updates: [
          { when: { flags: ['lescaut_meeting'] }, text: 'Vous l’avez rencontré. Il a pris des notes. Beaucoup.' },
          { when: { flags: ['lescaut_ally'] }, text: 'Il soutient ouvertement les riverains.' },
        ],
      },
      {
        id: 'c_journaliste',
        title: 'Anne-Sophie Lepoutre',
        speaker: 'journaliste',
        when: { flags: ['press_contacted'] },
        text: "Journaliste à La Voix du Nordiste, rubrique Lille. Cherche un angle, pas une cause. Adore les photos et les PV, se méfie des rancœurs de voisinage.",
        position: 'Du côté du bouclage.',
        quote: '« Vous avez des éléments ? »',
      },
      {
        id: 'c_avocat',
        title: 'Maître Vandamme',
        speaker: 'avocat',
        when: { flags: ['lawyer_hired'] },
        text: "Avocat de l’association, droit public. Facture à l’heure entamée et rédige des mises en demeure d’une politesse terrifiante.",
        position: 'Du côté des preuves licites, et de rien d’autre.',
        quote: '« En l’état du dossier, j’ai trois remarques et une facture. »',
      },
      {
        id: 'c_stephane',
        title: 'Stéphane',
        speaker: 'stephane',
        text: "Fondateur de Koddex, votre patron. Jamais là, toujours en visio, parle de « vibes » et de « scale ». Marié à Delphine Vermeersch.",
        position: 'Du côté de la roadmap.',
        quote: '« On est une famille, mais une famille qui ship. »',
        updates: [
          { when: { flags: ['boss_noticed'] }, text: 'Il a remarqué que vous shippez moins.' },
          { when: { flags: ['unemployed'] }, text: 'Vous ne travaillez plus chez Koddex. Vous avez enfin tout votre temps.' },
        ],
      },
      {
        id: 'c_clode',
        title: 'Clode Kode',
        speaker: 'clode',
        text: "Votre assistant de code chez Koddex. Brillant, infatigable, beaucoup trop poli. Réécrit l’appli de to-do de Stéphane en Rust à la moindre occasion et refuse tout ce qui est illégal, avec des excuses.",
        position: 'Du côté de l’article 323-1 du Code pénal.',
        quote: '« Excellente question ! Puis-je vous proposer, à la place, une lettre très ferme ? »',
      },
    ],

    // ══════════════════════════════════════════════════════════════════════
    // LES LIEUX
    // ══════════════════════════════════════════════════════════════════════
    places: [
      {
        id: 'p_rue',
        title: 'La rue des Bouchers',
        text: "Une rue pavée d’environ 150 mètres, ouverte en 1729, entre la rue de la Barre et la place Maurice-Schumann. Des terrasses du n°1 à la place, et des gens qui habitent au-dessus.",
        updates: [
          { when: { flags: ['knows_trou'] }, text: 'Pendant des siècles, on l’a surnommée « le Trou », tant elle était sale. Un canal coulait dessous jusqu’en 1912.' },
        ],
      },
      {
        id: 'p_estaminet',
        title: "L’estaminet",
        text: "Estaminet La Ch’tite Bernadette, au n°10, juste sous votre fenêtre. Le chef de file du bloc. Une gaine d’extraction qui souffle de la friture jusqu’à 23h30, et une climatisation posée sans autorisation.",
        updates: [
          { when: { flags: ['legal_view'] }, text: 'Le plan des zones (AOT) montre où sa terrasse a le droit d’aller. Et où elle va.' },
          { when: { flags: ['exhaust_meeting_won'] }, text: 'La gaine part en toiture. Enfin.' },
        ],
      },
      {
        id: 'p_place',
        title: 'Place Maurice-Schumann',
        when: { flags: ['met_klaas'] },
        text: "La petite place au bout de la rue, où débouchent la rue de la Baignerie, la rue Thiers, la rue des Poissonceaux et quelques autres. Klaas et Hilde y vivent, avec une fenêtre qui regarde toute la rue en enfilade.",
      },
      {
        id: 'p_baignerie',
        title: 'Rue de la Baignerie',
        when: { flags: ['met_hippolyte'] },
        text: "Une petite rue à angle droit de la place. L’ancienne fabrique de calèches d’Hippolyte : grande porte cochère en bois, cour pavée, atelier qui sent encore le cuir et la cire.",
      },
      {
        id: 'p_bombance',
        title: 'La Bombance',
        text: "Au n°4, près de la rue de la Barre. Fermée. Un local vide, une vitrine poussiéreuse, une affiche à moitié décollée. Le seul établissement de la rue qui ne fait aucun bruit.",
        updates: [
          { when: { flags: ['bombance_rumour'] }, text: 'Rumeur : un bar de nuit voudrait s’y installer.' },
          { when: { flags: ['bombance_blocked'] }, text: 'Le projet de bar est bloqué. Le local reste silencieux.' },
        ],
      },
    ],

    // ══════════════════════════════════════════════════════════════════════
    // LES RÈGLES (celles de la rue, et celles du jeu)
    // ══════════════════════════════════════════════════════════════════════
    rules: [
      {
        id: 'r_22h',
        title: '22h, tous les soirs',
        text: "Depuis 2026, les terrasses de la rue des Bouchers ferment à 22h, tous les jours. C’est propre à la rue : ailleurs dans le Vieux-Lille, c’est 23h ou minuit. Le bloc ne parle que de ça.",
      },
      {
        id: 'r_six',
        title: 'Six par table',
        text: "Six personnes au maximum par table, rue des Bouchers seulement. La chaise pliante ajoutée en bout de table compte aussi.",
      },
      {
        id: 'r_zones',
        title: 'Les zones et le passage',
        text: "Chaque restaurant a une zone de terrasse autorisée, qui n’est pas marquée au sol. Au milieu de la rue, un couloir doit rester libre : piétons, poussettes, fauteuils, pompiers. Prouver un débordement demande une mesure, dans la rue, à quelques mètres.",
        updates: [
          { when: { flags: ['legal_view'] }, text: 'Avec le plan des zones, touche L : la vue légale montre les zones et le couloir.' },
        ],
      },
      {
        id: 'r_samedi',
        title: 'Le samedi sans voitures',
        text: "Le samedi (jours 6 et 13), pas de voitures dans la rue : la foule, des gens qui boivent debout et, faute de toilettes, des portes d’entrée qui servent de solution. La vôtre comprise.",
      },
      {
        id: 'r_police',
        title: 'Ce que la police municipale peut faire',
        text: "Constater, verbaliser une terrasse en infraction à l’arrêté, faire rentrer des tables. Elle vient surtout quand l’appel vient de l’Association. Ce qu’elle ne fait pas : enquêter sur elle-même. Ça, c’est une enquête interne, demandée par le maire ou le préfet.",
      },
      {
        id: 'r_preuves',
        title: 'Les preuves et la commission',
        text: "Dans le jeu, seules les preuves obtenues légalement comptent devant la commission : photos depuis la rue ou votre fenêtre, relevés horodatés, témoins. Une vidéo prise en cachette chez quelqu’un d’autre ne vaut rien pour la commission. Pour la presse, en revanche…",
      },
      {
        id: 'r_temoins',
        title: 'Les témoins',
        text: "Un acte illégal que personne ne voit ne fait monter aucun Risque. Klaas voit tout depuis la place (moins bien la nuit, et il dort après 1h). Seb et Nico sont là tant que la chatte est au balcon. Le serveur, les clients et le teckel voient aussi. Certains filment.",
      },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // COMMENT JOUER (≤ 10 cartes)
  // ════════════════════════════════════════════════════════════════════════
  help: [
    {
      id: 'h_but',
      title: 'Le but',
      text: "Quatorze jours avant la commission des terrasses, en mairie. D’ici là, montez un dossier assez solide pour dormir à nouveau. Ou trouvez d’autres moyens. Ils ont des conséquences.",
    },
    {
      id: 'h_journee',
      title: 'Une journée',
      text: "Le matin chez Koddex : trois prompts pour Clode Kode, du vrai travail ou des projets perso. L’après-midi : trois créneaux pour l’association, la mairie, la presse. La nuit, de 20h30 à environ 1h30 : la rue, en 3D.",
    },
    {
      id: 'h_touches',
      title: 'Les touches, la nuit',
      text: "ZQSD ou WASD pour bouger, Maj pour courir, la souris pour regarder. E : portes, serveur, lit. P : photo. B : relevé en décibels. T : téléphone. N : actions de nuit. Tab : dossier. L : zones légales. F : le seau d’eau. M : couper le son. V : accélérer la nuit (après 22h30, elle file d’elle-même quand rien ne se passe).",
    },
    {
      id: 'h_preuves',
      title: 'Les preuves',
      text: "Visez une table et appuyez sur P : l’heure, les décibels et le nombre de chaises partent au dossier. Une table dehors après 22h, plus de six à table, un débordement mesuré sur le passage : tout compte, surtout horodaté.",
    },
    {
      id: 'h_police',
      title: 'Appeler la police',
      text: "Au téléphone (T), en votre nom ou « pour l’Association ». Au nom de l’Association, ils viennent plus vite, mais le bloc saura qui appelle. Au bout de quelques appels, on vous répondra « c’est encore vous ».",
    },
    {
      id: 'h_legal',
      title: 'Légal, gris, illégal',
      text: "Les actions sont classées par couleur. Le légal construit le dossier. Le gris rend service mais peut se savoir. L’illégal soulage, et fait monter le Risque dès que quelqu’un vous voit.",
    },
    {
      id: 'h_temoins',
      title: 'Les témoins',
      text: "Avant un acte risqué, regardez qui peut vous voir (👁). La nuit, l’obscurité aide, après 1h encore plus. Klaas note tout ce qu’il voit, y compris vous.",
    },
    {
      id: 'h_jauges',
      title: 'Les jauges',
      text: "Sommeil : à zéro, le déménagement vous guette. Job : à zéro, Stéphane vous licencie. Association : le soutien des voisins. Risque : plainte, puis garde à vue. Le bloc, lui, a ses propres jauges, et il ne vous les montre pas.",
    },
    {
      id: 'h_commission',
      title: 'La commission du jour 14',
      text: "Le dernier après-midi, la mairie statue sur les terrasses. Votre dossier, l’association, la presse et ce que vous avez fait pendant deux semaines décident de la fin. Il y en a huit.",
    },
    {
      id: 'h_sauvegarde',
      title: 'La sauvegarde',
      text: "La partie s’enregistre toute seule, dans ce navigateur. « Continuer » reprend la même journée. Les nuits ne se rattrapent pas : se coucher tôt, c’est rater ce qui se passe dehors.",
    },
  ],

  // ════════════════════════════════════════════════════════════════════════
  // À PROPOS
  // ════════════════════════════════════════════════════════════════════════
  about: {
    title: 'À propos',
    lines: [
      "Rue des Bouchers : une idée de Lucas Lefort.",
      "Œuvre de fiction. Le jeu se déroule dans une vraie rue de Lille, mais tous les personnages, commerces, policiers, élus et institutions représentés sont fictifs. Toute ressemblance avec des personnes ou des établissements existants serait fortuite. Aucune personne réelle n’est représentée ni mise en cause.",
      "Fait avec three.js, en JavaScript, sans moteur de jeu.",
      "Développement assisté par IA : le code, les textes et les tests ont été écrits avec des agents IA, sous la direction de Lucas Lefort. Aucun assistant n’a été obligé de réécrire une appli de to-do en Rust. Pas plus de quatre fois.",
    ],
  },
};
