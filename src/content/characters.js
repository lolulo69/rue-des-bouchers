// Distribution complète (GAME_DESIGN §2). Données pures : aucune logique, aucun DOM.
// Clé = id utilisé partout comme `speaker` (dialogue.js, events.js, countermoves.js…).
// group : 'player' | 'asso' | 'animal' | 'bloc' | 'police' | 'city' | 'koddex' | 'other'
// home  : où le personnage vit / travaille (géographie §1b), pour le placement et la cohérence.
// voice : notes de ton pour l'écriture (pas affichées en jeu).

// Nom du groupe WhatsApp de l'association (provisoire : une seule constante, à changer ici si besoin).
export const WHATSAPP_GROUP = 'La Gaystapo';

export const CHARACTERS = {
  // ── Le joueur ────────────────────────────────────────────────────────────
  pilou: {
    name: 'Pilou',
    fullName: 'Pierre-Louis Dubeton',
    group: 'player',
    home: "2e étage du n°10, au-dessus de l’estaminet. La gaine d’extraction monte jusque sous sa fenêtre.",
    bio: "Développeur Rust chez Koddex, où son travail consiste surtout à écrire des prompts à Clode Kode. Dort mal depuis que les terrasses ont débordé sur la rue, et encore moins depuis que l’estaminet a installé sa clim.",
    voice: 'Ironique, fatigué, précis. Compte en décibels. Devient sec quand le Sommeil est bas.',
  },

  // ── L'Association de la rue des Bouchers ────────────────────────────────
  jeremie: {
    name: 'Jérémie',
    group: 'asso',
    home: '3e étage du n°10, juste au-dessus de Pilou.',
    bio: "Président de l’Association de la rue des Bouchers. Connaît chaque arrêté municipal par sa date. Mène la ronde du soir avec Biloute, son teckel, sous couvert de promenade hygiénique.",
    voice: 'Posé, procédurier, optimiste par devoir. Parle en « on » et en « dossier ». Ne crie jamais, cite les textes.',
  },
  biloute: {
    name: 'Biloute',
    group: 'animal',
    home: "Le n°10, dans l’escalier, et partout où traîne une frite.",
    bio: "Le teckel de Jérémie. Flaire les infractions et les croquettes. Aboie quand Pilou est nerveux, ce qui n’aide pas les opérations discrètes.",
    voice: 'Ouaf. Grognements. Didascalies entre astérisques.',
  },
  klaas: {
    name: 'Klaas',
    group: 'asso',
    home: "Place Maurice-Schumann, au bout de la rue : sa fenêtre enfile toute la rue d’un seul regard.",
    bio: "Grand, barbe blanche, gilet rouge : le Père Noël en préretraite. Voit tout, note tout, dans un carnet à spirale qui ferait pâlir un greffier. Y compris ce que fait Pilou.",
    voice: "Lent, exact, horodaté. Phrases courtes. Lit son carnet à voix haute. Quelques mots de flamand (« ja », « allee »). Ne ment jamais, mais peut accepter de ne pas avoir regardé.",
  },
  hilde: {
    name: 'Hilde',
    group: 'asso',
    home: 'Place Maurice-Schumann, avec Klaas.',
    bio: "La femme de Klaas. D’une gentillesse inépuisable. Apporte tisane, soupe et tarte au sucre à qui a mal dormi. Déteste la violence et les éclats de voix. La seule à pouvoir faire refermer son carnet à Klaas.",
    voice: 'Douce, maternelle, inquiète. Propose toujours à manger. Désapprouve sans jamais hausser le ton.',
  },
  tatie: {
    name: 'Tatie Bouchon',
    group: 'asso',
    home: 'Au milieu de la rue, n°19, fenêtre au premier.',
    bio: "Vieille dame du milieu de la rue, distributrice de sagesse et d’e-mails. Écrit à l’estaminet pour l’odeur depuis des années ; on lui répond toujours que « c’est en cours de résolution ». Prend le thé avec Martine Aubrac, l’ancienne maire : une porte ouverte sur la mairie… dans les deux sens.",
    voice: "Proverbes maison, souvent bancals et toujours définitifs : « Si vous voulez quelque chose dans la vie, faut résister et se battre pour. » Girouette : flattée par un verre offert, revigorée par un bon proverbe.",
  },
  seb: {
    name: 'Seb',
    group: 'asso',
    home: 'En face de Pilou, n°13, le balcon avec le chat.',
    bio: `Avec Nico, le couple d’en face. Administrateur du groupe WhatsApp « ${WHATSAPP_GROUP} », la radio libre de la rue. Sait qui a dit quoi à qui, et à quelle heure.`,
    voice: 'Rapide, enthousiaste, adore une bonne histoire. Transforme chaque incident en feuilleton. Ponctue de « attends, attends ».',
  },
  nico: {
    name: 'Nico',
    group: 'asso',
    home: 'En face de Pilou, n°13, le balcon avec le chat.',
    bio: `Avec Seb, le couple d’en face. Fait les captures d’écran, archive tout, modère « ${WHATSAPP_GROUP} » quand ça part en vrille. Plus prudent que Seb, mais tout aussi curieux.`,
    voice: 'Pince-sans-rire, organisé. Ramène Seb sur terre. Pose la question qui fâche.',
  },
  gaufre: {
    name: 'Gaufre',
    group: 'animal',
    home: 'Le balcon du n°13.',
    bio: "La chatte de Seb et Nico. Quand elle est au balcon, ses humains sont là et regardent. Rentre entre 23h et minuit et demie, quand elle en a assez du bruit (elle aussi).",
    voice: 'Silence méprisant. Un clignement lent.',
  },
  hippolyte: {
    name: 'Hippolyte',
    group: 'asso',
    home: "Rue de la Baignerie, à deux pas de la place Maurice-Schumann : l’ancienne fabrique de calèches, grande porte cochère en bois, cour pavée.",
    bio: "Héritier d’une famille de carrossiers installée là depuis le XIXe siècle. Vieille fortune, vieux réseau : connaît les familles, l’évêché et surtout le service du patrimoine. Prête l’atelier aux réunions de l’association.",
    voice: "Vouvoie tout le monde, y compris son chat. Références historiques (1729, le canal, « le Trou »). Mépris poli pour la clim en façade.",
  },
  regis: {
    name: 'Régis Dewaele',
    group: 'asso',
    home: 'N°27, deux appartements loués en meublé touristique.',
    bio: "Membre de l’association, propriétaire de deux meublés touristiques. Ses locataires adorent « l’ambiance ». La cible idéale pour un bloc qui cherche un traître.",
    voice: "Conciliant en apparence, toujours « dans la nuance ». Dit « je comprends les deux côtés » juste avant de choisir le mauvais.",
  },

  // ── Le bloc des restaurants ─────────────────────────────────────────────
  dede: {
    name: 'Dédé',
    group: 'bloc',
    home: "Estaminet La Ch’tite Bernadette, n°10.",
    bio: "Copropriétaire de l’estaminet. Petit, rond, jovial en public, arrangeur en privé. Règle tout avec « un petit café, un waterzooi, c’est la maison qui offre ». Il n’y a pas de Bernadette : c’est lui, plus ou moins.",
    voice: 'Tutoie tout le monde, tape dans le dos, « mon biloute », « allez va ». Menace en souriant.',
  },
  ghislain: {
    name: 'Ghislain',
    group: 'bloc',
    home: "Estaminet La Ch’tite Bernadette, n°10 (le bureau du fond).",
    bio: "L’autre copropriétaire. Maigre, chignon monumental, froid comme une chambre froide. Tient la paperasse, les autorisations et les e-mails « c’est en cours de résolution ».",
    voice: "Formules administratives, « bien cordialement », « nous prenons note ». Ne s’énerve jamais : il archive.",
  },
  serveur: {
    name: 'Théo',
    title: 'le serveur',
    group: 'bloc',
    home: "Estaminet La Ch’tite Bernadette. Pause clope sous le store.",
    bio: "Jeune serveur de l’estaminet, payé au SMIC et aux pourboires, quinze heures par jour l’été. Sympathique, épuisé, lucide. Peut devenir un informateur… ou se faire virer pour ça.",
    voice: '« Je fais que mon taf, moi. » Familier, fatigué, honnête quand on lui parle normalement.',
  },

  // ── Police municipale ───────────────────────────────────────────────────
  lemaire: {
    name: 'Brigadier Lemaire',
    group: 'police',
    home: 'Police municipale de Lille. Table du fond de l’estaminet, côté radiateur.',
    bio: "Brigadier bonhomme, abonné au waterzooi gratuit. Lent au premier appel de la soirée, et curieusement toujours annoncé cinq minutes avant d’arriver.",
    voice: '« Tout est en ordre, monsieur. » Paternaliste, las, se retranche derrière « on a d’autres priorités ».',
  },
  benali: {
    name: 'Agent Benali',
    group: 'police',
    home: 'Police municipale de Lille.',
    bio: "Jeune agent, procédure au cordeau, carnet de PV à la main. Vient vraiment, verbalise vraiment. Risque la mutation pour excès de zèle.",
    voice: 'Vouvoiement strict, phrases réglementaires, une pointe de lassitude face à sa hiérarchie.',
  },
  chef: {
    name: 'Commandant Desmet',
    title: 'le chef de la police municipale',
    group: 'police',
    home: 'Hôtel de police municipale.',
    bio: "Le chef. Ne se déplace qu’après un scandale ou un coup de fil de la mairie. Gère sa carrière comme un dossier de communication.",
    voice: '« Nous prenons cette affaire très au sérieux. » Langue de bois parfaitement polie.',
  },

  // ── Institutions ────────────────────────────────────────────────────────
  delphine: {
    name: 'Delphine Vermeersch',
    title: "l’inspectrice de la mairie",
    group: 'city',
    home: 'Mairie de Lille, service urbanisme et domaine public.',
    bio: "Inspectrice chargée du dossier de la clim posée sans autorisation. Rigoureuse et lassée des passe-droits. Mariée à Stéphane, le patron de Pilou, ce qui rend tout canal informel aussi utile que compromettant.",
    voice: 'Nette, technique, humour sec. Ne promet rien, note tout. Déteste le mot « arrangement ».',
  },
  martine: {
    name: 'Martine Aubrac',
    group: 'city',
    home: 'Ancienne maire. Toujours une table réservée à l’estaminet et un carnet d’adresses plus épais qu’un PLU.',
    bio: "Ancienne maire, toujours influente, protectrice historique des restaurateurs : « la convivialité, c’est l’ADN de Lille ». Prend le thé avec Tatie Bouchon. Travaille à saper son successeur.",
    voice: 'Grande dame, phrases de discours, « mes chers amis ». Ne dit jamais non, dit « on va regarder ça ».',
  },
  delandre: {
    name: 'Arnaud Delandre',
    group: 'city',
    home: "Maire de Lille, à l’hôtel de ville.",
    bio: "Le maire actuel, successeur de Martine Aubrac. A instauré la fermeture à 22h rue des Bouchers. Penche du côté des riverains, mais doit composer avec les réseaux de l’ancienne équipe.",
    voice: 'Courtois, prudent, technocrate sincère. « Je vous entends. » Aime les dossiers solides et déteste les surprises dans la presse.',
  },
  journaliste: {
    name: 'Anne-Sophie Lepoutre',
    group: 'other',
    home: 'La Voix du Nordiste, rubrique Lille.',
    bio: "Journaliste locale à La Voix du Nordiste. Cherche un angle, pas une cause. Adore les photos et les PV, se méfie des rancœurs de voisinage.",
    voice: '« Vous avez des éléments ? » Vive, sceptique, toujours pressée par le bouclage.',
  },
  avocat: {
    name: 'Maître Vandamme',
    group: 'other',
    home: 'Cabinet rue Royale.',
    bio: "Avocat de l’association, spécialiste du droit public. Facture à l’heure entamée, rédige des mises en demeure d’une politesse terrifiante.",
    voice: 'Juridique, prudent, « en l’état du dossier ». Aime les preuves licites et rien d’autre.',
  },

  // ── Koddex ──────────────────────────────────────────────────────────────
  stephane: {
    name: 'Stéphane',
    group: 'koddex',
    home: 'Koddex, en télétravail permanent depuis un lieu non communiqué.',
    bio: "Fondateur de Koddex. N’est jamais là, parle de « vibes » et de « scale ». Marié à Delphine Vermeersch, l’inspectrice de la mairie.",
    voice: 'Anglicismes, enthousiasme creux, messages vocaux de quatre minutes. « On est une famille, mais une famille qui ship. »',
  },
  clode: {
    name: 'Clode Kode',
    group: 'koddex',
    home: "Le terminal de Pilou.",
    bio: "L’assistant de code de Pilou. Brillant, infatigable, beaucoup trop poli. Réécrit tout en Rust à la moindre occasion.",
    voice: "Excès de politesse, excuses préventives, « Excellente question ! ». Refuse poliment l’illégal en proposant une alternative conforme.",
  },
};

// Commerces de la rue (noms fictifs, GAME_DESIGN §0). L'id correspond à RESTAURANTS dans src/config.js quand il existe.
export const PLACES = {
  bernadette: { name: "Estaminet La Ch’tite Bernadette", number: '10', note: 'Chef de file du bloc. Sous Pilou.' },
  malunes: { name: 'Les Bouchers Mal Lunés', number: '14', note: 'Grill, voisin de l’estaminet. Suit le bloc.' },
  bloemkool: { name: 'Bloemkool', number: '22', note: 'Néo-bistrot flamand, le « chic ». Suit le bloc du bout des lèvres.' },
  goulot: { name: 'Le Goulot', number: '33', note: 'Bistrot, burger de poisson. Le plus conciliant.' },
  endroit: { name: "L’Endroit", number: '34 bis', note: 'Côté place.' },
  truffe: { name: 'Truffe et Ficelle', number: '1', note: "À l’angle de la rue de la Barre." },
  mug: { name: 'Mug', number: '3', note: 'Vente à emporter : on boit debout dans la rue.' },
  bombance: { name: 'La Bombance', number: '4', note: 'Fermée. Local vide. Menace de fin de partie : un bar veut s’y installer.' },
};
