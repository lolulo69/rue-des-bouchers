// Rebondissements de nuit (GAME_DESIGN §12b « no two nights alike », contrat §14). Données pures : aucune logique, aucun DOM.
// Chaque nuit de la campagne a un rebondissement : fixe pour les nuits du calendrier (`day`), tiré au sort dans le
// réservoir sinon (`pool: true`), jamais deux fois le même dans une campagne. Le moteur (src/sim/twists.js, build agent)
// applique `sim` à cette nuit seulement, montre `intro` avant 20h30, glisse `lines` dans la narration, fait poser `props`
// par le directeur de scène, puis applique `after` les jours suivants.
//
// sim : crowd / noise (multiplicateurs), closeDelay (minutes ajoutées au rangement, négatif = plus tôt),
//       tables (tables ajoutées ou modifiées), witnesses (témoins en plus, ids listés dans la Build note),
//       darkness (0–1), rain, exhaustOff, corridorBlocked, events ({ at, text, simEffect }), opportunities (ids d'actions).
// Plusieurs rebondissements fixes peuvent partager un jour : le premier dont `when` correspond l'emporte (variantes J9, J11).
// Règle d'écriture : satire des institutions, du bloc et de Pilou ; jamais des riverains. Fiction (§0).

const H = (h, m = 0) => h * 60 + m;

export const TWISTS = [
  // ════════════════════════════════════════════════════════════════════════
  // NUITS FIXES DU CALENDRIER
  // ════════════════════════════════════════════════════════════════════════
  {
    id: 'colette_dinner',
    title: 'Une ancienne maire en terrasse',
    day: 4,
    intro: "Ce soir, l’estaminet a sorti la nappe blanche et la table qui mord sur le couloir. Colette Verhaeghe vient dîner. Huit couverts, une table de six. Dédé a ciré ses chaussures.",
    sim: {
      tables: [{ rest: 'bernadette', count: 8, label: 'la table de Colette' }],
      closeDelay: 25,
      witnesses: [{ id: 'colette', at: 'terrace', filming: false }],
      events: [
        { at: H(20, 50), text: "Une berline se gare rue de la Barre, là où rien ne se gare. Colette descend, foulard au vent." },
        { at: H(23, 5), text: "Colette lève son verre : « À la convivialité, mes chers amis ! » Toute la terrasse trinque. Les fenêtres aussi, à leur façon.", simEffect: { noise: 6 } },
      ],
      opportunities: ['night_photo'],
    },
    lines: {
      barks: ["« Madame la maire ! Enfin, l’ancienne, mais quand même ! »", "« On peut faire une photo avec vous ? »", "« Elle a eu un dessert. Personne d’autre n’a eu de dessert. »"],
      klaas: ['Ex-maire. Huit couverts. Table un. Couloir : rétréci. Mon nez est fiable.', "La berline est restée garée deux heures. Personne n’a mis de papillon."],
      recap: ['Colette Verhaeghe a dîné à huit sur une table de six. La convivialité a des privilèges.'],
    },
    props: ['white_tablecloth', 'black_sedan'],
    after: { setFlags: ['twist_colette_dinner'] },
  },
  {
    id: 'saturday_van',
    title: 'Le camion du samedi sans voitures',
    day: 6,
    intro: "Samedi piéton : pas une voiture dans la rue. Sauf une camionnette de livraison de fûts, garée en plein couloir de passage, warnings allumés, « cinq minutes ». Elle restera jusqu’à 23h.",
    sim: {
      crowd: 1.3,
      noise: 1.1,
      corridorBlocked: true,
      events: [
        { at: H(21, 10), text: "Le chauffeur décharge douze fûts, puis disparaît « boire un café ». Les warnings clignotent sur les pavés." },
        { at: H(23, 0), text: "La camionnette repart en marche arrière, klaxon compris, au milieu de la foule. Trois verres en moins.", simEffect: { noise: 8 } },
      ],
      opportunities: ['night_photo', 'night_police'],
    },
    lines: {
      barks: ["« Il a le droit de se garer là, lui ? »", "« C’est un samedi sans voitures, pas sans camionnettes ! »", "« Pousse-toi, il recule ! »"],
      klaas: ['Camionnette. Couloir de passage. Warnings. Un samedi piéton. Je note la plaque.', 'Une poussette a fait demi-tour. Un fauteuil aussi.'],
      recap: ['Un samedi « sans voitures », avec une camionnette au milieu du couloir. La règle a des horaires de livraison.'],
    },
    props: ['delivery_van', 'beer_kegs', 'hazard_lights'],
    after: { setFlags: ['twist_van_corridor'], media: ['wa_twist_van'] },
  },
  {
    id: 'inspector_surprise_night',
    title: "L’inspectrice repasse, incognito",
    day: 9,
    when: { flags: ['inspector_surprise'] },
    intro: "Ce soir, une femme en imperméable boit un thé au Goulot, un carnet à la main. Delphine Vermeersch « ne travaille pas ». Elle regarde juste les tables. Très attentivement.",
    sim: {
      witnesses: [{ id: 'delphine', at: 'street', filming: false }],
      closeDelay: 10,
      events: [{ at: H(22, 10), text: "Delphine note quelque chose, sans lever les yeux. L’estaminet n’a pas reconnu l’imperméable." }],
      opportunities: ['night_photo', 'night_mairie'],
    },
    lines: {
      barks: ['« Qui c’est, la dame au carnet ? »', "« Une touriste. Elle écrit des cartes postales. »"],
      klaas: ['Une dame seule, un thé, un carnet. Elle note plus vite que moi. Ja. Une collègue.'],
      recap: ["L’inspectrice a passé la soirée au Goulot « en simple cliente ». Elle a pris des notes en simple cliente."],
    },
    props: ['trench_coat', 'notebook'],
    after: { setFlags: ['twist_inspector_seen'] },
  },
  {
    id: 'inspector_announced_night',
    title: 'La rue modèle',
    day: 9,
    when: { flags: ['inspector_announced'] },
    intro: "La visite de l’inspectrice était annoncée. Ce soir, la rue des Bouchers est un dépliant touristique : tables alignées, six par table, couloir dégagé, géraniums neufs. Ça ne durera pas. Mais ce soir…",
    sim: {
      crowd: 0.85,
      noise: 0.85,
      closeDelay: -20,
      events: [{ at: H(23, 30), text: "La rumeur court que « la dame de la mairie est rentrée chez elle ». Deux tables ressortent, timidement.", simEffect: { noise: 5 } }],
      opportunities: ['night_db'],
    },
    lines: {
      barks: ['« Pourquoi on est que six ? On est toujours dix. »', "« Le serveur a dit qu’on rentrait à 21h40. Je comprends pas. »"],
      klaas: ['21h40 : toutes les tables rentrées. Première fois. Je souligne. Ce n’est pas un compliment.'],
      recap: ["Une nuit exemplaire, pour cause d’inspection annoncée. Même Colette n’aurait pas mieux organisé."],
    },
    props: ['new_geraniums'],
    after: { setFlags: ['twist_model_street'] },
  },
  {
    id: 'inspector_quiet_night',
    title: 'Nuit sans nouvelles',
    day: 9,
    intro: "La contre-visite de la clim s’est jouée cet après-midi. Ce soir, Dédé arrose les géraniums du store en sifflotant. Il siffle faux, mais il siffle. C’est rarement bon signe.",
    sim: {
      closeDelay: 15,
      events: [{ at: H(22, 30), text: "Dédé allume la clim, à fond, pour « vérifier qu’elle marche toujours ». Elle marche.", simEffect: { noise: 4 } }],
      opportunities: ['night_photo'],
    },
    lines: {
      barks: ['« Il fait frais sous le store, c’est agréable. »'],
      klaas: ['22h30 : la clim démarre. Elle ronronne comme si de rien n’était. Comme ses propriétaires.'],
      recap: ['La clim a tourné toute la soirée. Elle a de la suite dans les idées.'],
    },
    props: ['ac_unit_running'],
  },
  {
    id: 'exhaust_eve',
    title: 'La veille de la réunion « gaine »',
    day: 10,
    intro: "Demain, réunion sur la gaine d’extraction à la mairie annexe. Ce soir, miracle : la gaine est éteinte. Ghislain a affiché « maintenance préventive ». La cuisine fait des salades.",
    sim: {
      exhaustOff: true,
      noise: 0.95,
      events: [{ at: H(21, 30), text: "Un client commande une carbonnade. Le serveur répond « ce soir, c’est salade ». Le client ne comprend pas. Vous, si." }],
      opportunities: ['night_db', 'night_photo'],
    },
    lines: {
      barks: ['« Pas de frites ce soir ? C’est la fin du monde. »', '« Ça sent rien. C’est bizarre, ça sent rien. »'],
      klaas: ['Gaine : arrêtée. Odeur : aucune. Coïncidence : non. Je note la date de la réunion à côté.'],
      recap: ["La gaine s’est tue la veille de la réunion. Elle sait lire un ordre du jour."],
    },
    props: ['maintenance_sign', 'exhaust_off'],
    after: { setFlags: ['twist_exhaust_silent'] },
  },
  {
    id: 'exhaust_won_night',
    title: 'La dernière friture',
    day: 11,
    when: { flags: ['exhaust_meeting_won'] },
    intro: "La ville a acté le déplacement de la gaine. Ce soir, l’estaminet organise une « soirée hommage à la friture » : tout ce qui peut frire frira. La gaine donne tout, une dernière fois.",
    sim: {
      noise: 1.1,
      crowd: 1.15,
      closeDelay: 15,
      events: [{ at: H(22, 15), text: "Dédé sort sur la terrasse avec une baraque à frites en carton : « Adieu, ma belle. » Applaudissements.", simEffect: { noise: 6 } }],
      opportunities: ['night_db'],
    },
    lines: {
      barks: ['« C’est la dernière soirée frites ? Pourquoi ? »', '« Pour la gaine ! » « Pour la gaine ! »'],
      klaas: ['Soirée « hommage à la friture ». La gaine souffle comme un cétacé. Elle sait qu’elle part.'],
      recap: ["L’estaminet a fait ses adieux à sa gaine. La rue, elle, a fait ses adieux à une nuit de sommeil de plus."],
    },
    props: ['cardboard_fries_stand', 'exhaust_full_steam'],
  },
  {
    id: 'exhaust_lost_night',
    title: 'La gaine fête sa victoire',
    day: 11,
    intro: "Réunion « gaine » : étude complémentaire, ou statu quo. Ce soir, la gaine tourne à plein régime « pour tester le nouveau filtre ». Le nouveau filtre n’existe pas. Le test, si.",
    sim: {
      noise: 1.1,
      closeDelay: 10,
      events: [{ at: H(23, 20), text: "Ghislain sort fumer sous votre fenêtre et lève les yeux vers la gaine, puis vers vous. Il hoche la tête, satisfait." }],
      opportunities: ['night_db'],
    },
    lines: {
      barks: ['« Ça sent la frite jusqu’à la place, c’est génial. »'],
      klaas: ["La vapeur monte jusqu’au deuxième étage. Je la vois d’ici. Je ne la sens pas d’ici. Pilou, si."],
      recap: ['« Étude complémentaire. » La gaine, elle, ne fait pas d’étude : elle souffle.'],
    },
    props: ['exhaust_full_steam'],
  },
  {
    id: 'football_match',
    title: 'Le match sur écran géant',
    day: 13,
    intro: "Dernier samedi avant la commission, et Lille joue un match décisif. L’estaminet a installé un écran géant sous le store, tourné vers la rue. Cent cinquante supporters debout, trois tables de six, et vous au deuxième.",
    sim: {
      crowd: 1.45,
      noise: 1.25,
      closeDelay: 30,
      witnesses: [{ id: 'supporters', at: 'street', filming: true }],
      events: [
        { at: H(21, 12), text: 'BUT ! Cent cinquante personnes hurlent en même temps. Le carnet de Klaas tremble.', simEffect: { noise: 12 } },
        { at: H(21, 47), text: "Penalty raté. Un silence absolu, puis cent cinquante soupirs. C’est presque pire.", simEffect: { noise: 4 } },
        { at: H(22, 50), text: 'Coup de sifflet final, victoire. La rue chante. Toute la rue. Pendant quarante minutes.', simEffect: { noise: 10 } },
      ],
      opportunities: ['night_db', 'night_photo'],
    },
    lines: {
      barks: ['« ALLEZ LILLE ! »', '« Arbitre, au trou ! Le Trou ! C’est le nom de la rue ! »', '« On reste pour la troisième mi-temps ! »'],
      klaas: ['21h12 : but. 94 décibels à la place. Je n’ai pas compté les têtes. Il n’y a que des têtes.'],
      recap: ['Lille a gagné. La rue des Bouchers, elle, a perdu la nuit.'],
    },
    props: ['big_screen', 'supporter_scarves', 'flares_smoke'],
    after: { setFlags: ['twist_match_night'], media: ['press_twist_match'] },
  },

  // ════════════════════════════════════════════════════════════════════════
  // RÉSERVOIR (une fois chacun par campagne)
  // ════════════════════════════════════════════════════════════════════════
  {
    id: 'birthday_t4',
    title: 'Anniversaire à la table 4',
    pool: true,
    intro: "Ce soir, la table 4 de l’estaminet fête les quarante ans de « Jojo ». Onze personnes, deux tables collées, un gâteau caché sous une nappe. Le chant est prévu pour 23h40. Tout le monde le sait. Sauf Jojo.",
    sim: {
      tables: [{ rest: 'bernadette', count: 11, label: 'table 4' }],
      closeDelay: 20,
      events: [{ at: H(23, 40), text: "Les lumières de la terrasse s’éteignent. « Joyeux anniversaire » à onze voix, puis à quarante : toute la rue s’y met. Jojo pleure.", simEffect: { noise: 9 } }],
      opportunities: ['night_photo'],
    },
    lines: {
      barks: ['« Chut, il arrive ! » « Qui ? » « Jojo ! »', '« On est onze, mais Jojo compte double, c’est son anniversaire. »', '« Encore une bougie et on appelle les pompiers. »'],
      klaas: ['Table 4 : onze personnes, quarante bougies, un gâteau. Le gâteau ne compte pas dans la limite. Les invités, si.'],
      recap: ['Joyeux anniversaire, Jojo. Toute la rue s’en souviendra. Surtout le deuxième étage.'],
    },
    props: ['birthday_cake', 'balloons'],
    after: { setFlags: ['twist_birthday'] },
  },
  {
    id: 'influencer_night',
    title: 'La ring light',
    pool: true,
    intro: "Une influenceuse tourne « la vraie nuit lilloise » au milieu du couloir de passage, ring light allumée. Tout ce qui se passe ce soir peut finir sur Internet. Tout. Y compris ce qui se passe à votre fenêtre.",
    sim: {
      witnesses: [{ id: 'influencer', at: 'street', filming: true }],
      events: [{ at: H(21, 30), text: "« Coucou les loulous ! Ce soir je vous emmène dans la rue la plus authentique de Lille ! » Prise une. Prise deux. Prise trois." }],
      opportunities: ['night_photo', 'night_film_faces'],
    },
    lines: {
      barks: ['« On passe dans sa vidéo ! Souris ! »', '« C’est qui ? » « Une influenceuse. » « Elle influence quoi ? »'],
      klaas: ['Une lumière ronde au milieu du couloir. Elle filme tout. Moi aussi, mais sans lumière.'],
      recap: ['« La vraie nuit lilloise » a fait 80 000 vues. Dans le fond de chaque plan : les tables dans le couloir.'],
    },
    props: ['ring_light', 'phone_tripod'],
    after: { setFlags: ['twist_influencer'], media: ['so_twist_influencer'] },
  },
  {
    id: 'hen_party',
    title: 'EVJF au mégaphone',
    pool: true,
    intro: "Ce soir, Marion enterre sa vie de jeune fille aux Bouchers Mal Lunés. Neuf amies en t-shirts roses, un voile, un mégaphone. Le mégaphone, c’est le cadeau de la témoin. Elle s’en sert.",
    sim: {
      tables: [{ rest: 'malunes', count: 9, label: "la table de l’EVJF" }],
      noise: 1.15,
      closeDelay: 15,
      events: [
        { at: H(22, 30), text: "Au mégaphone : « MARION, ON T’AIME ! » Le mégaphone a une option sirène. Elle l’a trouvée.", simEffect: { noise: 12 } },
        { at: H(23, 15), text: "Gage : Marion doit faire signer un serment à un inconnu. L’inconnu, c’est Biloute." },
      ],
      opportunities: ['night_db', 'night_ask_waiter'],
    },
    lines: {
      barks: ['« MARION ! MARION ! »', '« On lui a dit de pas boire de genièvre, elle a bu du genièvre. »'],
      klaas: ['Un mégaphone. Neuf t-shirts roses. Une mariée. Je note le mégaphone.'],
      recap: ['Marion se marie samedi. La rue des Bouchers lui souhaite d’être très heureuse, très loin.'],
    },
    props: ['megaphone', 'bride_veil', 'pink_tshirts'],
    after: { setFlags: ['twist_hen_party'] },
  },
  {
    id: 'drache_night',
    title: 'Drache annoncée',
    pool: true,
    intro: "La météo annonce des averses à partir de 21h. L’estaminet a déplié tous ses parasols, collé les tables sous le store, et prévu une bâche. Ici, on ne rentre pas une terrasse pour si peu.",
    sim: {
      rain: true,
      crowd: 0.65,
      events: [{ at: H(21, 15), text: 'La drache tombe, droite, épaisse. Les tables du milieu se vident ; celles sous le store se serrent, à quatorze sur trois tables.' }],
      opportunities: ['night_photo'],
    },
    lines: {
      barks: ['« On reste ! On est sous le store ! »', '« J’ai les pieds dans une flaque, mais c’est une bonne flaque. »'],
      klaas: ['Pluie. Les tables du milieu rentrent. Celles du store se tassent. La règle des six ne prend pas l’eau.'],
      recap: ["Il a plu des cordes. La terrasse s’est réfugiée sous le store, à quatorze sur trois tables. Sec, mais pas légal."],
    },
    props: ['rain', 'tarpaulin', 'umbrellas'],
    after: { setFlags: ['twist_drache'] },
  },
  {
    id: 'heatwave',
    title: 'Nuit de canicule',
    pool: true,
    intro: "Vingt-neuf degrés à 22h. Toutes les fenêtres de la rue sont ouvertes, y compris la vôtre. Personne n’a envie de rentrer, ni les clients, ni les serveurs, ni la chaleur.",
    sim: {
      noise: 1.3,
      crowd: 1.2,
      closeDelay: 25,
      events: [{ at: H(24, 30), text: 'Il fait encore vingt-sept degrés. Un client dort sur sa chaise. Un autre commande un sorbet. Un troisième chante.' }],
      opportunities: ['night_db'],
    },
    lines: {
      barks: ['« On peut pas rentrer, il fait plus chaud dedans. »', '« Un rosé bien frais, et après on y va. Promis. »'],
      klaas: ['Fenêtres ouvertes partout. J’entends la rue comme si j’étais assis à une table. Je ne suis assis à aucune table.'],
      recap: ['Canicule : fenêtres ouvertes, terrasses pleines, nuit blanche. Le thermomètre a gagné.'],
    },
    props: ['fans', 'ice_buckets', 'open_windows'],
    after: { setFlags: ['twist_heatwave'] },
  },
  {
    id: 'guide_tour',
    title: 'La visite guidée nocturne',
    pool: true,
    intro: "L’office de tourisme lance sa « balade nocturne du Vieux-Lille ». Point d’orgue à 22h15 : la rue des Bouchers, « autrefois surnommée le Trou ». Le guide a un micro-cravate et une voix qui porte.",
    sim: {
      witnesses: [{ id: 'guide', at: 'street', filming: false }],
      events: [{ at: H(22, 15), text: "« Mesdames et messieurs, voici le Trou. Un canal coulait ici jusqu’en 1912. » Trente touristes regardent les pavés, puis les terrasses, puis votre fenêtre." }],
      opportunities: ['night_photo'],
    },
    lines: {
      barks: ['« C’est ici, le Trou ? Ça a bien changé. » « Pas tant que ça. »', '« On peut s’asseoir ? » « Vous êtes trente. »'],
      klaas: ['Trente touristes. Un guide. Il s’est trompé de date pour le canal. Je ne le corrige pas : il est loin.'],
      recap: ['Trente touristes ont appris que la rue s’appelait « le Trou ». Ils sont repartis convaincus que c’était toujours le cas.'],
    },
    props: ['tour_group_flag'],
    after: { setFlags: ['knows_trou', 'twist_guide_tour'] },
  },
  {
    id: 'regis_party',
    title: 'Soirée étudiante au 27',
    pool: true,
    intro: "Ce soir, l’un des deux meublés de Régis est loué à « un groupe calme pour un anniversaire ». Ils sont dix-neuf. Ils ont des enceintes. Le calme, c’est le nom de leur playlist.",
    sim: {
      noise: 1.15,
      events: [
        { at: H(24, 10), text: 'Au 27, la basse traverse trois murs et deux siècles. Les fenêtres vibrent jusqu’à la place.', simEffect: { noise: 8 } },
        { at: H(25, 0), text: 'Dix-neuf étudiants descendent dans la rue « prendre l’air ». Avec les enceintes.', simEffect: { noise: 6 } },
      ],
      opportunities: ['night_db', 'night_police'],
    },
    lines: {
      barks: ['« C’est où, la soirée ? » « Au 27, l’appart avec l’ambiance ! »', '« Le proprio a dit qu’on pouvait. »'],
      klaas: ['N°27 : musique, minuit dix. Ce n’est pas une terrasse. C’est un membre de l’association. Je note quand même.'],
      recap: ['Le bruit de la nuit venait du 27, pas des terrasses. Régis « comprend les deux côtés ». Surtout le sien.'],
    },
    props: ['party_lights_27', 'speakers'],
    after: { setFlags: ['twist_regis_party'], media: ['wa_twist_regis_party'] },
  },
  {
    id: 'busker',
    title: "L’accordéoniste",
    pool: true,
    intro: "Un accordéoniste s’est installé juste sous votre fenêtre, entre la porte du n°10 et la terrasse. Répertoire : trois chansons. Il les joue dans l’ordre. Puis il recommence.",
    sim: {
      noise: 1.1,
      witnesses: [{ id: 'busker', at: 'window', filming: false }],
      events: [
        { at: H(21, 0), text: 'Première chanson : « Le P’tit Quinquin ». La terrasse chante le refrain.' },
        { at: H(23, 0), text: "Vingt-troisième fois « Le P’tit Quinquin ». Dédé lui offre une bière pour qu’il change. Il change : il passe à la deuxième.", simEffect: { noise: 3 } },
      ],
      opportunities: ['night_db'],
    },
    lines: {
      barks: ['« Dors, min p’tit quinquin… »', '« Une autre ! » « Il en connaît que trois. »'],
      klaas: ['Un accordéon sous la fenêtre de Pilou. Un témoin de plus, juste sous la fenêtre. Pilou devrait le savoir.'],
      recap: ['« Le P’tit Quinquin », trente fois. Personne n’a dormi, mais tout le monde connaît les paroles.'],
    },
    props: ['accordion', 'hat_with_coins'],
    after: { setFlags: ['twist_busker'] },
  },
  {
    id: 'power_cut',
    title: 'Panne de courant',
    pool: true,
    intro: "À 22h40, tout le quartier s’éteint. Plus de lampadaires, plus de néons, plus de gaine. Les terrasses allument des bougies. Pour la première fois depuis des mois, on voit des étoiles au-dessus de la rue.",
    sim: {
      darkness: 0.8,
      exhaustOff: true,
      events: [
        { at: H(22, 40), text: 'Noir total. La gaine s’arrête dans un dernier soupir. Le silence est tellement épais qu’on entend la clim… ne pas tourner.' },
        { at: H(23, 25), text: 'Le courant revient. La gaine redémarre comme un tracteur. Une table applaudit, une autre râle.', simEffect: { noise: 4 } },
      ],
      opportunities: ['night_db'],
    },
    lines: {
      barks: ['« C’est romantique, en fait. »', '« Quelqu’un a une lampe ? » « J’ai mon téléphone. » « Il a plus de batterie. »'],
      klaas: ["Panne. Je ne vois plus rien. Je n’écris plus rien. C’est la première page blanche de mon carnet."],
      recap: ['Quarante-cinq minutes de panne : la nuit la plus calme de la saison. La gaine a dû être réparée. Hélas.'],
    },
    props: ['candles', 'streetlights_off'],
    after: { setFlags: ['twist_power_cut'] },
  },
  {
    id: 'waiter_last_night',
    title: 'La dernière nuit de Théo',
    pool: true,
    when: { day: [6, 13] },
    intro: "Demain, le serveur part en vacances : dix jours, ses premiers depuis deux ans. Ce soir, il sert en chantant, rentre les tables à l’heure « parce qu’il a un train », et dit au revoir à tout le monde. Même à vous.",
    sim: {
      closeDelay: -10,
      events: [{ at: H(24, 30), text: "Le serveur pose son tablier sur une chaise, lève les yeux vers votre fenêtre et fait un petit signe. Puis il part en courant vers la gare." }],
      opportunities: ['night_ask_waiter'],
    },
    lines: {
      barks: ['« Il est de bonne humeur, le serveur, ce soir. » « Il part en vacances. » « Ah, voilà. »'],
      klaas: ['22h00 : toutes les tables de l’estaminet rentrées. Le serveur a un train. Les trains font plus que la police.'],
      recap: ['Le serveur est parti en vacances. Ce soir, les tables sont rentrées à l’heure. Il faudrait l’envoyer en vacances plus souvent.'],
    },
    props: ['suitcase_by_door'],
    after: { setFlags: ['twist_waiter_holidays'] },
  },
  {
    id: 'fete_voisins',
    title: 'La fête des voisins',
    pool: true,
    when: { day: [3, 13], stats: { asso: '>=40' } },
    intro: "L’association contre-programme : « fête des voisins », place Maurice-Schumann. Une table à tréteaux, la tarte de Hilde, les guirlandes de Seb. Déclarée en mairie, finie à 22h. Le bloc regarde de loin, vexé.",
    sim: {
      crowd: 1.05,
      witnesses: [{ id: 'neighbours', at: 'street', filming: false }],
      events: [
        { at: H(20, 45), text: 'Hilde coupe la tarte au sucre. Jérémie fait un discours de trois minutes. Biloute vole une part.' },
        { at: H(22, 0), text: "À 22h00 pile, l’association range sa table. Ostensiblement. Avec des raclements de chaises très pédagogiques." },
      ],
      opportunities: ['night_photo'],
    },
    lines: {
      barks: ['« C’est quoi, cette fête, là-bas ? » « Les voisins. » « Ils ont des voisins ? »', '« Ils rangent à 22h. C’est de la provocation. »'],
      klaas: ['Fête des voisins. 22h00 : rangée. Je l’écris en gros, pour qu’on puisse comparer.'],
      recap: ["La fête des voisins s’est terminée à 22h00 pile. Les terrasses, elles, ont continué. La comparaison était le but."],
    },
    props: ['trestle_table', 'bunting', 'sugar_tart'],
    after: { setFlags: ['twist_fete_voisins'], media: ['wa_twist_fete_voisins'] },
  },
  {
    id: 'fire_inspection',
    title: 'Contrôle du couloir par les pompiers',
    pool: true,
    when: { day: [5, 13] },
    intro: "Ce soir, une équipe de pompiers fait un « exercice de passage » dans les rues piétonnes du Vieux-Lille. Avec un mètre ruban. Ils passeront rue des Bouchers vers 22h20. Les terrasses ne sont pas au courant.",
    sim: {
      witnesses: [{ id: 'firefighters', at: 'street', filming: false }],
      events: [{ at: H(22, 20), text: "Le camion s’engage, s’arrête, recule. Un pompier mesure le couloir : « 1,40 m. Il en faut 3. » Dédé découvre ce que veut dire « procès-verbal »." }],
      opportunities: ['night_photo', 'night_police'],
    },
    lines: {
      barks: ['« C’est un exercice ? » « Pour eux, oui. Pour la terrasse, non. »', '« Ils sont mignons, les pompiers. » « Ils mesurent ta chaise. »'],
      klaas: ['22h20 : les pompiers mesurent. 1,40 m. Ils ont un meilleur mètre que Pilou. Je le note pour Pilou.'],
      recap: ["Les pompiers ont mesuré le couloir de passage : 1,40 m sur 3 exigés. Leur rapport ira plus vite que nos e-mails."],
    },
    props: ['fire_truck', 'tape_measure'],
    after: { setFlags: ['twist_fire_inspection'], media: ['press_twist_fire'] },
  },
  {
    id: 'lescaut_walk',
    title: 'Le maire fait sa ronde',
    pool: true,
    when: { flags: ['lescaut_meeting'] },
    intro: "Bertrand Lescaut a promis de « venir voir par lui-même ». Ce soir, à 23h, il remonte la rue à pied, sans écharpe, avec un conseiller et un parapluie. Le bloc l’a appris à 22h55.",
    sim: {
      witnesses: [{ id: 'lescaut', at: 'street', filming: false }],
      closeDelay: -15,
      events: [{ at: H(23, 0), text: "Le maire remonte la rue. Dédé range trois tables en courant, les bras pleins de chaises. Le maire le regarde faire. « Je vous en prie, ne vous dérangez pas pour moi. »" }],
      opportunities: ['night_photo', 'night_db'],
    },
    lines: {
      barks: ['« C’est le maire ? » « L’actuel ou l’ancienne ? » « L’actuel. Range ton verre. »'],
      klaas: ['23h00 : le maire. À pied. Il regarde les bonnes tables. Je l’aime bien.'],
      recap: ['Le maire est passé à 23h. Pendant dix minutes, la rue des Bouchers a été exemplaire. Il a vu les dix minutes d’avant.'],
    },
    props: ['mayor_umbrella'],
    after: { setFlags: ['twist_lescaut_walk'] },
  },
  {
    id: 'lost_dog',
    title: 'Biloute a disparu',
    pool: true,
    when: { flags: ['met_jeremie'] },
    intro: "Ce soir, pas de ronde : Biloute s’est échappé à 21h30, sa laisse à la patte. Jérémie fait toute la rue en criant son nom, d’une voix de président. Toutes les terrasses cherchent sous les tables.",
    sim: {
      witnesses: [{ id: 'jeremie_searching', at: 'street', filming: false }],
      events: [
        { at: H(21, 30), text: 'Jérémie, au milieu du couloir : « BILOUTE ! » Trois clients répondent « oui ? ».' },
        { at: H(22, 50), text: "Biloute est retrouvé sous la table 3 de l’estaminet, une frite dans la gueule, entouré de clients ravis. Dédé : « Il a bon goût, ton chien. »" },
      ],
      opportunities: ['night_photo'],
    },
    lines: {
      barks: ['« Un teckel ? Il était là ! Non, c’était un sac. »', '« On l’appelle comment ? » « Biloute. » « Comme nous tous, quoi. »'],
      klaas: ['21h30 : un teckel en fuite. 22h50 : retrouvé à l’estaminet. Même le chien passe à l’ennemi.'],
      recap: ['Biloute a fugué deux heures. Il a été retrouvé sous la table 3, en pleine infiltration. Rapport attendu.'],
    },
    props: ['lost_dog_poster', 'leash'],
    after: { setFlags: ['twist_lost_dog'] },
  },
  {
    id: 'tv_crew',
    title: 'Le reportage télé',
    pool: true,
    intro: "Une chaîne régionale tourne « Les pépites du Vieux-Lille ». Ce soir, la pépite, c’est l’estaminet. Jusqu’à 22h30, terrasse parfaite et Dédé au micro. Après 22h30, la caméra s’en va. La terrasse, non.",
    sim: {
      witnesses: [{ id: 'tv_crew', at: 'terrace', filming: true }],
      closeDelay: 20,
      events: [
        { at: H(21, 0), text: "Dédé, au micro : « Ici, on respecte nos voisins. C’est notre ADN. » Il fait un clin d’œil à votre fenêtre, à l’antenne." },
        { at: H(22, 30), text: 'Fin du tournage. En trois minutes, deux tables ressortent et le couloir disparaît.', simEffect: { noise: 6 } },
      ],
      opportunities: ['night_photo', 'night_db'],
    },
    lines: {
      barks: ['« On passe à la télé ! Fais semblant d’être sobre ! »', '« Coupez ! Ça tourne encore ? Non ? Alors on ressort ! »'],
      klaas: ['21h00 : caméra. Terrasse parfaite. 22h33 : plus de caméra. Terrasse habituelle. Je note les deux.'],
      recap: ["« Les pépites du Vieux-Lille » : l’estaminet, impeccable à l’antenne. Hors antenne, la pépite a repris ses habitudes."],
    },
    props: ['tv_camera', 'boom_mic'],
    after: { setFlags: ['twist_tv_crew'], media: ['press_twist_tv'] },
  },
  {
    id: 'street_sweeper',
    title: 'La balayeuse de 23h30',
    pool: true,
    intro: "La ville a changé ses horaires de nettoyage : la balayeuse-laveuse passe désormais rue des Bouchers à 23h30, gyrophare orange et jets d’eau. Les terrasses l’ont appris par un papier scotché sur un lampadaire. Personne ne lit les lampadaires.",
    sim: {
      closeDelay: -20,
      events: [{ at: H(23, 30), text: 'La balayeuse entre dans la rue, jets à fond. Les clients sautent sur leurs chaises, les chaises sautent sur les pavés. En deux minutes, plus une table dehors.', simEffect: { noise: 10 } }],
      opportunities: ['night_photo'],
    },
    lines: {
      barks: ['« C’est quoi ce bruit ? » « La mairie. » « À cette heure-ci ? »', '« Mes chaussures ! »'],
      klaas: ["23h30 : la balayeuse. Elle a fait en deux minutes ce que la police ne fait pas en deux semaines."],
      recap: ['Une balayeuse a fait rentrer toutes les terrasses à 23h30. Le meilleur agent de la ville a quatre roues et un gyrophare.'],
    },
    props: ['street_sweeper', 'orange_beacon', 'wet_cobbles'],
    after: { setFlags: ['twist_street_sweeper'] },
  },
];
