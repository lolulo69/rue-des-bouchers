// Textes de la nuit 3D (GAME_DESIGN §5, §7, §13.C). Données pures : aucune logique, aucun DOM.
// Le moteur choisit une ligne au hasard dans chaque liste (rng seedé) et remplace les {variables}.
//
// Variables disponibles (selon le contexte) :
//   {time}        heure de l'événement, « 22h14 »          {rest}     nom du restaurant
//   {table}       libellé de la table (t.label)            {count}    personnes à la table
//   {max}         maximum légal par table (6)              {cm}       empiètement sur le couloir, en cm
//   {db}          décibels mesurés                         {patrol}   nom de la patrouille
//   {calls}       numéro de l'appel de la nuit             {n}        nombre (tables, pièces…)
//   {tipTime} {arriveTime} {returnTime}   horaires d'un tuyau (tables rentrées / police / tables ressorties)
//   {door}        libellé du seuil (ANCHORS.doorways[].label)
//   {act}         libellé de l'acte vu (« seau d'eau »…)    {detail}   détail du PV (sim : entry.detail)
//
// Identifiants alignés sur src/sim :
//   police outcomes (police.js) : act · complaisance · tipoff · nothing · ignored · busy
//     + never_came (patrouille jamais arrivée, summary.js) + for_pilou (la police vient pour Pilou, v0.5)
//   patrouilles (config POLICE.patrols) : lemaire · benali · chief
//   témoins (witness.js kind) : klaas · seb_nico (balcon de Seb & Nico) · waiter · customers
//     + biloute · dede · ghislain · police (ids `witnessed.by` d'actions.js)
//   serveur (sim.askWaiter reasons) : early · offduty · cooldown · none · ok · refused · refused_bloc_knows
//   fins de nuit (sim.end reason) : time · sleep · custody
//
// Règle d'écriture : les actes illégaux de Pilou ne sont jamais décrits, seulement nommés ({act}) et commentés.
import { WHATSAPP_GROUP } from './characters.js';

// ════════════════════════════════════════════════════════════════════════════
// CARNET DE KLAAS
// precise : la cible est proche, ou Klaas a ses jumelles (détection forte).
// vague   : loin, de nuit, sans jumelles (détection faible mais > 0). Le moteur choisit selon klaasDetection().
// Ton : sec, horodaté, phrases courtes, quelques mots de flamand.
// ════════════════════════════════════════════════════════════════════════════
export const KLAAS_NOTEBOOK = {
  over: {
    precise: [
      '{time}. {rest}, {table} : {count} personnes. Le maximum est {max}. Je les ai comptés deux fois.',
      '{time}. {table} ({rest}) : {count} couverts. Arrêté : {max}. Différence : {n}. Ja.',
      '{time}. {rest}. {count} à une table. Une chaise de jardin ajoutée en bout. Elle compte aussi.',
    ],
    vague: [
      '{time}. {rest}. Beaucoup de monde à une table. Plus que {max}, à vue de nez. Mon nez est fiable.',
      '{time}. Côté {rest}, une table pleine. Très pleine. Je n’ai pas pu compter les têtes, elles bougeaient.',
    ],
  },
  late: {
    precise: [
      '{time}. {rest}, {table} toujours dehors. Fermeture : 22h00. Retard : constaté.',
      '{time}. {table} ({rest}) : verres pleins, pas de mouvement de rangement. Allee.',
      '{time}. {rest}. Le serveur apporte une nouvelle tournée. Il est {time}. Je note l’heure deux fois.',
    ],
    vague: [
      '{time}. Lumières et voix côté {rest}. Des tables, encore. Combien : trop loin.',
      '{time}. Ça boit toujours, là-bas, vers {rest}. Je mettrai mes jumelles demain.',
    ],
  },
  corridor: {
    precise: [
      '{time}. {table} ({rest}) mord sur le passage. Une poussette a dû passer de biais.',
      '{time}. {rest}. Couloir rétréci. Un monsieur en fauteuil a fait demi-tour. Noté.',
    ],
    vague: [
      '{time}. Côté {rest}, la rue paraît plus étroite que le plan. Je ne mesure pas d’ici. Pilou a un mètre.',
    ],
  },
  complaisance: {
    precise: [
      '{time}. {patrol} chez {rest}. Café. Deux sucres. Zéro PV. Tables : inchangées.',
      '{time}. {patrol} arrive. Le patron serre la main. Assiette offerte. {patrol} repart. Tables : toujours là.',
      '{time}. Contrôle de {rest} par {patrol}. Durée : un café. Résultat : un café.',
    ],
    vague: [
      '{time}. Une patrouille chez {rest}. Quelque chose dans une tasse. Rien dans le carnet à souches.',
    ],
  },
  tipoff: {
    precise: [
      '{tipTime}. {rest} rentre ses tables. Toutes. D’un coup. {arriveTime} : police. « Tout est en ordre. » {returnTime} : tout ressort.',
      '{tipTime} : rangement soudain chez {rest}, sans client parti. {arriveTime} : patrouille. {returnTime} : les tables reviennent. Le hasard est très ponctuel.',
    ],
    vague: [
      '{tipTime}. Agitation côté {rest}, on range. {arriveTime}, des uniformes. {returnTime}, on déplie. Je n’ai pas tout vu. J’en ai vu assez.',
    ],
  },
  police_act: {
    precise: [
      '{time}. {patrol} verbalise {rest}. {detail}. Je souligne. Je ne souligne jamais.',
      '{time}. PV pour {rest}. {patrol} a sorti le carnet à souches. Événement rare. Noté en rouge.',
    ],
    vague: ['{time}. Une patrouille côté {rest}. Des tables rentrent. Bon.'],
  },
  pee: {
    precise: [
      '{time}. Un client contre {door}. Durée : longue. Je ne note pas le visage. Je note la porte.',
      '{time}. {door}. Encore un. Je ne tiens plus le compte, je tiens le carnet.',
    ],
    vague: ['{time}. Un homme immobile contre une façade, côté {door}. Je préfère croire qu’il réfléchit.'],
  },
  clatter: {
    precise: ['{time}. Raclement de chaises chez {rest}. {n} table(s). Dans les temps. Ça arrive.'],
    vague: ['{time}. Chaises sur les pavés, quelque part au milieu. Musique connue.'],
  },
  // Pilou lui-même (seulement si Klaas voit l'acte, cf. witness). Klaas ne juge pas : il horodate.
  pilou: {
    precise: [
      '{time}. Côté n°10. Pilou. {act}. Je note. Je note tout.',
      '{time}. Pilou, {act}. Hilde dirait que ce n’est pas bien. Je l’écris, elle le dira.',
    ],
    vague: ['{time}. Mouvement du côté du n°10. Ça ressemblait à Pilou. Ça ressemblait à : {act}.'],
  },
  // Dernière ligne avant que Klaas aille dormir (~01:00).
  bedtime: [
    '01h00. Fin de veille. Ce qui se passe après, la rue le garde pour elle.',
    '01h00. Hilde éteint la lampe. Je pose le crayon. Trois pages, ce soir.',
    '01h00. Je vais dormir. Eux, non. Ja.',
  ],
};

// ════════════════════════════════════════════════════════════════════════════
// POLICE MUNICIPALE : une liste par patrouille et par issue (police.js)
// call : ce que dit le standard au moment de l'appel · arrive : quand la patrouille entre dans la rue
// ════════════════════════════════════════════════════════════════════════════
export const POLICE_LINES = {
  call: {
    normal: [
      'Police municipale : « On envoie quelqu’un. » (appel n°{calls})',
      'Police municipale : « C’est noté, monsieur. Une patrouille va passer. » (appel n°{calls})',
      'Police municipale : « Rue des Bouchers ? On connaît. On arrive. » (appel n°{calls})',
    ],
    asso: [
      'Police : « Ah, pour l’Association… On fait au plus vite. » (Le bloc saura qui a appelé.)',
      'Police : « L’Association de la rue des Bouchers, très bien. Une patrouille part. »',
    ],
  },
  lemaire: {
    arrive: [
      'Le brigadier Lemaire remonte la rue sans se presser, les mains dans le dos.',
      'Lemaire arrive, salue les terrasses de loin avant de saluer qui que ce soit d’autre.',
    ],
    act: [
      'Lemaire, l’air de quelqu’un qu’on dérange : « Bon. Allez, on rentre ça. » PV pour {rest} : {detail}.',
      'Contre toute attente, Lemaire sort son carnet. Le patron le regarde comme on regarde un ami qui vous trahit. PV : {detail}.',
    ],
    complaisance: [
      'Lemaire chez {rest} : un café, une tape dans le dos, « bonne soirée messieurs-dames ». 0 PV.',
      'Lemaire s’assoit « deux minutes ». Il y reste dix-sept. Une assiette apparaît. 0 PV.',
      '« Tout est sous contrôle », dit Lemaire, une serviette en papier encore au col. 0 PV.',
    ],
    tipoff: [
      'Lemaire devant {rest} : « Tout est en ordre ici, monsieur. » Comme par hasard, les tables viennent d’être rentrées.',
      'Lemaire arrive devant {rest}, soudain d’une sagesse exemplaire. Il ne s’en étonne même pas.',
    ],
    nothing: [
      'Lemaire, devant {rest} : « Je ne vois rien d’anormal, monsieur. » Pour une fois, c’est vrai.',
      'Lemaire : « Tout est en ordre. Vous devriez dormir, vous. »',
    ],
    never_came: [
      'Lemaire n’est jamais arrivé. Le standard parle d’une « intervention prioritaire ». Rue de Gand, peut-être.',
      'Pas de Lemaire ce soir. Klaas note l’absence. Il note aussi l’heure de l’absence.',
    ],
    for_pilou: [
      'On sonne. C’est Lemaire, avec un sourire triste : « Monsieur Dubeton ? On a reçu une plainte. Vous. »',
      'Lemaire, sur votre palier, carnet ouvert, pour une fois : « On va discuter un peu, monsieur. »',
    ],
  },
  benali: {
    arrive: [
      'L’agent Benali remonte la rue au pas réglementaire, carnet de PV déjà sorti.',
      'Benali arrive vite. Il regarde les tables avant de regarder les gens.',
    ],
    act: [
      'Benali : « Arrêté municipal. Vous êtes en infraction. » PV pour {rest} : {detail}.',
      'Benali verbalise {rest} sans hausser le ton : {detail}. Le patron appelle quelqu’un en s’éloignant.',
      'Benali mesure, compte, écrit. {detail}. Le serveur l’aide à rentrer les tables, presque soulagé.',
    ],
    complaisance: [
      'Benali hésite, regarde son téléphone, reçoit un appel. « Consigne de la hiérarchie. » Il repart. 0 PV.',
      'Benali constate, note… et repart sans verbaliser. Il a l’air de quelqu’un à qui on vient de rappeler sa mutation possible.',
    ],
    tipoff: [
      'Benali trouve la terrasse de {rest} vide et regarde l’heure. « Intéressant. » Il le note. Ça ne servira à rien, mais il le note.',
    ],
    warning: [
      'Benali, devant {rest} : « Je repasse dans une demi-heure. Je préfère ne pas avoir à sortir le carnet. » Il regarde sa montre. Le serveur aussi.',
      'Benali sermonne {rest}, calmement, article par article. Pas de PV ce soir. « Ce soir. » Il insiste sur « ce soir ».',
    ],
    nothing: ['Benali, devant {rest} : « Rien à constater ici, monsieur. Rappelez si ça reprend. » Il le pense vraiment.'],
    never_came: ['Benali n’est pas venu. On l’a envoyé ailleurs. Il n’a pas choisi.'],
    for_pilou: [
      'Benali, sur votre palier, très poli : « Monsieur Dubeton, une plainte a été déposée à votre encontre. Je dois vous entendre. » Il a l’air désolé. Il le fera quand même.',
    ],
  },
  chief: {
    arrive: [
      'Une voiture banalisée. Le Commandant Desmet descend en personne, cravate, regard de conférence de presse.',
      'Le Commandant Desmet arrive, entouré de deux agents et d’un sentiment d’urgence très soudain.',
    ],
    act: [
      'Le Commandant Desmet : « Nous prenons cette affaire très au sérieux. » PV pour {rest} : {detail}. Il regarde s’il y a un photographe.',
      'Desmet fait tout rentrer, tout mesurer, tout verbaliser : {detail}. Le patron ne trouve personne à qui offrir un café.',
    ],
    complaisance: [
      'Desmet constate « une situation en voie de normalisation » et repart. 0 PV. Il a au moins refusé le café.',
    ],
    tipoff: ['Desmet trouve une rue impeccable. Il félicite les restaurateurs pour « leur esprit de responsabilité ». Klaas tourne une page.'],
    nothing: ['Le Commandant Desmet : « Rien à signaler. Nous resterons vigilants. » Il n’est déjà plus là.'],
    never_came: ['Le Commandant Desmet était attendu. Il avait une réunion. Sur la vigilance.'],
    for_pilou: ['Le Commandant Desmet en personne, sur votre palier : « Monsieur Dubeton. Nous prenons cette plainte très au sérieux. » Vous aussi, soudain.'],
  },
  // Issues communes, quelle que soit la patrouille
  ignored: [
    'Police : « Ah, c’est encore vous… On note, monsieur. » Personne ne viendra.',
    'Police : « Monsieur, encore vous ? On a d’autres priorités. » Personne ne viendra.',
    'Le standard soupire avant de décrocher. Vous l’avez entendu soupirer. Personne ne viendra.',
  ],
  busy: [
    'Police : « Une patrouille est déjà en route, monsieur. »',
    'Police : « On vous a déjà envoyé quelqu’un. Il arrive. Il arrive toujours. »',
  ],
};

// ════════════════════════════════════════════════════════════════════════════
// RÉACTIONS DES TÉMOINS (quand un acte illégal est vu)
// ════════════════════════════════════════════════════════════════════════════
export const WITNESS_LINES = {
  klaas: [
    'Sur la place, Klaas écrit quelque chose dans son carnet.',
    'Au bout de la rue, une lampe s’allume, puis un crayon bouge. Klaas.',
    'Klaas ne détourne pas les yeux. Il ne détourne jamais les yeux.',
  ],
  seb_nico: [
    `Sur le balcon d’en face, Seb a la bouche ouverte. Nico, lui, a le téléphone levé. Ce sera sur « ${WHATSAPP_GROUP} » dans trois minutes.`,
    'En face, Gaufre vous fixe, impassible. Derrière elle, Seb et Nico aussi. Moins impassibles.',
    'Seb, depuis le balcon : « Attends, attends… il a vraiment fait ça ? » Nico : « Il a vraiment fait ça. »',
  ],
  waiter: [
    'Le serveur lève les yeux vers votre fenêtre, plateau en l’air. Il ne dit rien. Il retient.',
    'Le serveur vous a vu. Il secoue la tête, mi-scandalisé, mi-admiratif.',
  ],
  customers: [
    'Une table entière lève la tête vers votre fenêtre.',
    '« C’est lui ! Là-haut ! » Un doigt pointé. Plusieurs.',
    'Des clients se retournent, se parlent, se retournent encore.',
  ],
  customers_filmed: [
    'Un téléphone est levé. Puis deux. La lumière rouge clignote.',
    'Quelqu’un a filmé. Ce soir, vous allez exister sur Internet.',
    '« J’ai tout ! » crie quelqu’un en terrasse. Il a tout.',
  ],
  biloute: [
    '*Biloute aboie trois fois dans l’escalier.* Jérémie, d’en haut : « Qu’est-ce qu’il y a, mon chien ? »',
    '*Biloute grogne vers vous, déçu.*',
  ],
  dede: [
    'Dédé vous a vu. Il sourit. Le sourire de quelqu’un qui note une dette.',
    'Dédé, les bras croisés sous le store : « Ah ben bravo, le voisin. » Il sort son téléphone.',
  ],
  ghislain: [
    'Ghislain vous regarde, impassible, et tape quelque chose sur son téléphone. Une plainte se rédige en temps réel.',
    'Ghislain ne dit rien. Ghislain archive.',
  ],
  police: [
    'Un uniforme, au bout de la rue, s’est arrêté de marcher.',
    'La patrouille a tout vu. C’est la première fois de la soirée qu’elle regarde dans la bonne direction.',
  ],
  nobody: [
    'Personne n’a rien vu… a priori.',
    'La rue n’a pas levé la tête. Cette fois.',
    { text: 'Silence. Même Gaufre regardait ailleurs.', state: { present: ['chat'] } },
  ],
};

// ════════════════════════════════════════════════════════════════════════════
// BRIBES DE TERRASSE (ambiance, sous-titres au passage de Pilou)
// ════════════════════════════════════════════════════════════════════════════
export const BARKS = {
  weekday: [
    '« Encore une tournée et on y va. »',
    '« Il est quelle heure ? … Ah, ça va, il est tôt. »',
    '« La carbonnade, elle est à tomber. »',
    '« Rue de Gand, ils ferment à minuit, eux ! »',
    '« On rajoute une chaise ? Ils diront rien. »',
    '« Moi, je dis, l’ambiance, c’est l’ADN de Lille. »',
    '« Tu crois qu’il y a des gens qui habitent au-dessus ? »',
    '« Chut… non, je rigole. »',
    '« Mon VTC arrive dans quarante minutes, on a le temps. »',
    '« Monsieur ! Monsieur ! Une autre bière, s’il vous plaît ! »',
    '« Il fait tellement bon, c’est criminel de rentrer. »',
    '« Attends, je mets une story. »',
    '« C’est le plus vieux quartier, ici, non ? Tout est vieux. »',
    '« Les gens qui se plaignent du bruit, ils ont qu’à habiter à la campagne. »',
    '« Il a dit que les tables rentraient à quelle heure ? Bah, on verra. »',
    '« Une dernière, une vraie dernière. »',
    '« J’adore cette rue, elle est vivante. »',
    '« Tu sens la friture ? J’adore cette odeur. »',
    '« On se fait un welsh ? À cette heure-ci ? Oui. »',
    '« L’addition ? Rien ne presse. »',
    '« Il y a un monsieur à la fenêtre qui nous regarde. »',
    '« Serveur, on peut pousser la table un peu plus au milieu ? »',
  ],
  saturday: [
    '« ALLEZ LILLE ! »',
    '« ON EST SAMEDIIII ! »',
    '« Qui veut un shot ? Tout le monde veut un shot. »',
    '« Il est où, Kevin ? KEVIN ! »',
    '« Les toilettes ? Bah… là, la porte, ça fera l’affaire. »',
    '« On est quatorze mais on se serre ! »',
    '« Personne ne rentre avant le lever du soleil ! »',
    '« C’est la rue la plus festive de France, frère. »',
    '« Musique ! Quelqu’un a une enceinte ? »',
    '« Chante avec nous, le monsieur de la fenêtre ! »',
    '« Un pas de danse sur les pavés ! … Aïe. »',
    '« On a cassé un verre, c’est pas grave, c’est samedi ! »',
    '« Hé, la police, elle passe jamais ici ? Ah si. Bon, elle repart. »',
  ],
  // Murmures quand une patrouille passe
  police_passing: [
    '« Chut, les flics. » « Mais non, c’est juste une ronde. »',
    '« Rentre ton verre, rentre ton verre ! »',
  ],
};

// ════════════════════════════════════════════════════════════════════════════
// 22H00 : LA CLOCHE
// before : vers 21h55 · strike : à 22h00 · after : à 22h05 selon l'état de la rue
// ════════════════════════════════════════════════════════════════════════════
export const BELL = {
  before: [
    '21h55. Dans cinq minutes, la loi s’applique. En théorie.',
    '21h55. Le serveur regarde l’horloge. Dédé regarde le serveur.',
  ],
  strike: [
    'Au loin, une cloche sonne dix coups. 22h00. Rue des Bouchers, les terrasses doivent fermer.',
    'Dix coups de cloche. 22h00. Les chaises vont racler les pavés… ou pas.',
    'Dong. Dong. Dong… Dix. 22h00, rue des Bouchers. Le reste de Lille a encore une heure, ou deux. Pas vous.',
  ],
  after: {
    all_cleared: [
      'Raclement de chaises généralisé. Pour une fois, la rue range à l’heure. Profitez-en, ça ne durera pas.',
    ],
    some_out: [
      'Une partie des chaises racle les pavés. L’autre partie reste assise, verre levé.',
      'Quelques tables rentrent, pour la forme. Les autres font semblant de ne pas avoir entendu la cloche.',
    ],
    none_cleared: [
      'Personne ne bouge. La cloche a sonné pour rien. Elle a l’habitude, elle aussi.',
      '22h05 : toutes les tables sont encore dehors. Quelqu’un commande une nouvelle tournée.',
    ],
    saturday: [
      'La cloche est couverte par une chanson. Personne n’a entendu 22h00. Personne ne veut l’avoir entendu.',
    ],
  },
};

// ════════════════════════════════════════════════════════════════════════════
// LE SERVEUR (sim askWaiter) : avant/après met_waiter, il est « le serveur » puis « Théo »
// ════════════════════════════════════════════════════════════════════════════
export const WAITER_LINES = {
  early: [
    'Le serveur : « Il est pas encore 22h, monsieur. On rentre à 22h. »',
    'Le serveur, regardant sa montre : « Encore {n} minutes, monsieur. Promis. »',
    'Le serveur : « À 22h pile, je rentre tout. Là, c’est encore légal. »',
    'Le serveur montre l’horloge de l’église : « Pas encore, monsieur. Elle va sonner, vous verrez. »',
    'Le serveur : « {n} minutes. Je les compte, moi aussi, vous savez. »',
    'Le serveur, poli mais ferme : « Avant 22h, c’est une terrasse. Après, c’est un problème. On n’y est pas. »',
    'Le serveur : « Revenez à 22h, je serai le premier à plier les chaises. Enfin, le deuxième. »',
    'Le serveur jette un œil à son téléphone : « Il reste {n} minutes. Profitez-en, c’est calme. »',
  ],
  offduty: [
    'Le serveur est parti. Il ne reste que Dédé, qui fait semblant de ne pas vous voir.',
    'Plus de serveur. Ghislain ferme la caisse et ne lève pas les yeux.',
    'Le serveur a fini son service. Sa veste est sur la chaise, la chaise est sur la terrasse.',
    'Personne en tablier. Dédé compte des billets derrière la vitre et ne lève pas la tête.',
    'Le serveur a pris le dernier métro. Les tables, elles, sont restées.',
    'À cette heure-ci, il n’y a plus que Ghislain et son chignon, occupés à ne pas vous entendre.',
    'Le serveur est rentré chez lui. Vous parlez à une pile de chaises. Elle ne répond pas non plus.',
    'Plus personne pour prendre une commande ni une remarque. La terrasse tourne toute seule.',
  ],
  cooldown: [
    'Le serveur : « Je vous ai dit, je vais voir avec le patron… »',
    'Le serveur : « Deux minutes, monsieur, j’ai six tables. »',
    'Le serveur, un plateau dans chaque main : « Oui, oui, j’ai entendu. »',
    'Le serveur : « Vous m’avez déjà demandé il y a cinq minutes. La réponse n’a pas changé. »',
    'Le serveur passe sans s’arrêter : « J’arrive, j’arrive ! » Il n’arrive pas.',
    'Le serveur : « Laissez-moi le temps de demander, hein. »',
    'Le serveur lève un doigt : « Une seconde. » La seconde dure.',
    'Le serveur : « Je transmets, monsieur. Je transmets. »',
  ],
  none: [
    'Le serveur : « C’est déjà rentré, monsieur. Bonne nuit ! »',
    'Le serveur : « Il n’y a plus rien dehors. Vous pouvez dormir. En théorie. »',
    'Le serveur, en empilant la dernière chaise : « C’est bon, c’est fini. »',
    'Le serveur : « Tout est rangé. Même le parasol. Surtout le parasol. »',
    'Le serveur : « Regardez : plus une table. On a même passé le balai. »',
    'Le serveur : « Rien à rentrer, monsieur. Vous avez gagné, ce soir. »',
    'Le serveur sourit : « Vous arrivez après la bataille. Tout est dedans. »',
    'Le serveur : « Il n’y a plus que le cendrier, et il est à la ville. »',
  ],
  ok: [
    'Le serveur soupire : « OK, OK… je rentre tout. »',
    'Le serveur : « Vous avez raison. Allez, messieurs-dames, on rentre ! » Il a l’air presque content.',
    'Le serveur : « Je fais que mon taf, moi. Et là, mon taf, c’est de rentrer les tables. »',
    'Le serveur : « D’accord. Mais c’est moi qui me fais engueuler, hein. »',
    'Le serveur tape dans ses mains : « Dernière tournée à l’intérieur ! » Les clients râlent, les chaises suivent.',
    'Le serveur : « Bon. Vous m’avez convaincu. Ou c’est la fatigue. »',
    'Le serveur, à mi-voix : « Franchement, ça m’arrange. J’ai mal aux pieds. »',
    'Le serveur : « Allez, on plie. » Il plie. Les clients aussi, à regret.',
  ],
  refused: [
    'Le serveur revient : « Le patron dit que les clients finissent leur verre. »',
    'Le serveur, gêné : « Dédé dit que c’est réglé avec la mairie. » Ça ne l’est pas.',
    'Le serveur : « J’peux pas, monsieur. Si je rentre sans qu’on me le dise, c’est moi qui sors. »',
    'Le serveur : « Le patron dit : ‹ rue de Gand, c’est minuit ›. » Vous n’habitez pas rue de Gand.',
    'Le serveur revient de la cuisine : « Il a dit non. Enfin, il a dit autre chose, mais ça voulait dire non. »',
    'Le serveur : « Ils ont commandé des desserts. On ne rentre pas une table avec des desserts. »',
    'Le serveur hausse les épaules : « C’est pas moi qui décide. C’est Dédé. Et Dédé est en terrasse. »',
    'Le serveur : « Une dernière tournée, et après promis. » Il ne précise pas après quoi.',
  ],
  refused_bloc_knows: [
    'Le serveur, gêné : « Le patron sait que c’est vous qui appelez la police… »',
    'Le serveur, à voix basse : « Désolé. On m’a dit de ne plus vous répondre. »',
    'Le serveur évite votre regard : « Vous savez bien que je peux pas, avec vous. »',
    'Le serveur : « Dédé m’a montré votre fenêtre. ‹ Le monsieur du deuxième, tu l’écoutes pas. › »',
    'Le serveur, très vite : « On m’a interdit de vous parler. Bonne soirée. »',
    'Le serveur : « Depuis l’association, ici, vous êtes ‹ le voisin ›. Ça veut dire non. »',
    'Le serveur fait semblant de prendre une commande à une table vide plutôt que de vous répondre.',
    'Le serveur, désolé : « Ghislain a un dossier sur vous aussi. Je vous jure. »',
  ],
  // Variantes une fois `met_waiter` (le moteur peut les préférer)
  theo: {
    ok: [
      'Théo : « Pour toi, je rentre. Mais tu m’as pas vu, hein. »',
      'Théo : « Allez, je plie. Tu me dois un café. Un vrai, pas celui d’ici. »',
      'Théo, en riant : « Si Dédé demande, c’est le vent. »',
      'Théo : « Je rentre deux tables, je dis que c’est les clients qui ont froid. »',
      'Théo : « T’as de la chance, il est au téléphone. Vite. »',
      'Théo : « Ça marche. Mais demain tu descends pas, sinon ça se voit. »',
      'Théo fait signe à la table du fond : « Messieurs-dames, on vous attend à l’intérieur ! »',
      'Théo : « Pour ce soir, c’est bon. Dors, toi. T’as une tête de lundi. »',
    ],
    refused: [
      'Théo : « Pas ce soir, Pilou. Dédé est sur les nerfs. Demain, peut-être. »',
      'Théo, sans s’arrêter : « J’ai six tables et un patron. Plus tard. »',
      'Théo hausse les épaules vers la vitrine, où Dédé le regarde. Ça veut dire non.',
      'Théo : « Je te jure, j’ai essayé. Il m’a répondu ‹ encore une tournée ›. »',
      'Théo : « Il y a un anniversaire à la 4. Si je les rentre, c’est moi qu’on enterre. »',
      'Théo, à voix basse : « Ghislain compte les couverts ce soir. Je peux rien faire. »',
      'Théo : « Désolé, vieux. Ce soir, c’est la caisse qui commande. »',
      'Théo te tend un verre d’eau au lieu d’une réponse. C’est déjà ça.',
    ],
  },
};

// ════════════════════════════════════════════════════════════════════════════
// BILAN DE NUIT : manchettes façon La Voix du Nordiste
// when (conditions sur le bilan de nuit, toutes facultatives, en ET) :
//   reason: 'time'|'sleep'|'custody' · saturday: bool · ratio: '>=0.75' (dossierScore / target)
//   acts, complaisance, tipoffs, ignored, pees, bucket, pieces, witnesses, stink, kitchen, sabotage : comparaisons numériques ('>=1')
//   scandal, blocKnows, allOnTime : bool
// Le moteur affiche la manchette de plus haute `priority` qui correspond, puis éventuellement une seconde ligne.
// ════════════════════════════════════════════════════════════════════════════
export const RECAP_HEADLINES = [
  { id: 'h_custody', priority: 100, when: { reason: 'custody' }, text: 'VIEUX-LILLE · Un riverain passe la nuit au poste après une soirée « animée »' },
  { id: 'h_sleep', priority: 95, when: { reason: 'sleep' }, text: 'TÉMOIGNAGE · « Je ne dors plus » : un habitant de la rue des Bouchers jette l’éponge' },
  { id: 'h_scandal', priority: 90, when: { scandal: true }, text: 'POLICE MUNICIPALE · La hiérarchie de la police municipale s’intéresse aux cafés offerts rue des Bouchers' },
  { id: 'h_tipoff_complaisance', priority: 80, when: { tipoffs: '>=1', complaisance: '>=1' }, text: 'RUE DES BOUCHERS · Les tables rentrent avant la police, ressortent après le café' },
  { id: 'h_tipoff', priority: 75, when: { tipoffs: '>=1' }, text: 'COÏNCIDENCE · Une terrasse se range cinq minutes avant la patrouille' },
  { id: 'h_complaisance', priority: 70, when: { complaisance: '>=1' }, text: 'CONVIVIALITÉ · Contrôle de terrasse : un café, zéro procès-verbal' },
  { id: 'h_bucket_seen', priority: 68, when: { bucket: '>=1', witnesses: '>=1' }, text: 'FAITS DIVERS · Une terrasse arrosée depuis un deuxième étage, des témoins parlent' },
  { id: 'h_bucket_unseen', priority: 66, when: { bucket: '>=1', witnesses: '<1' }, text: 'MYSTÈRE · Une averse localisée sur une seule terrasse, les météorologues perplexes' },
  // Actions de nuit du contenu (journal « night-action » de nightActions.js, via recapMetrics(summary, sim.state))
  { id: 'h_kitchen', priority: 69, when: { kitchen: '>=1' }, text: 'GASTRONOMIE · Soirée « salé-sucré » involontaire dans un estaminet du Vieux-Lille' },
  { id: 'h_stink', priority: 67, when: { stink: '>=1' }, text: 'FAITS DIVERS · Une odeur suspecte vide une terrasse du Vieux-Lille' },
  { id: 'h_sabotage', priority: 65, when: { sabotage: '>=1' }, text: 'MYSTÈRE · Chaises dévissées, parasols envolés : une terrasse se réveille sabotée' },
  { id: 'h_act', priority: 60, when: { acts: '>=1' }, text: 'ÉVÉNEMENT · Un procès-verbal dressé rue des Bouchers, les anciens n’en reviennent pas' },
  { id: 'h_ignored', priority: 55, when: { ignored: '>=1' }, text: 'SERVICE PUBLIC · « C’est encore vous » : la police municipale ne décroche plus pour la rue des Bouchers' },
  { id: 'h_saturday_pee', priority: 50, when: { saturday: true, pees: '>=3' }, text: 'SAMEDI PIÉTON · Les porches du Vieux-Lille transformés en sanitaires publics' },
  { id: 'h_saturday', priority: 45, when: { saturday: true }, text: 'SAMEDI PIÉTON · Foule, chants et pavés : la rue des Bouchers déborde' },
  { id: 'h_all_on_time', priority: 40, when: { allOnTime: true }, text: 'INSOLITE · Toutes les terrasses rentrées à 22h, les riverains soupçonnent un piège' },
  { id: 'h_strong_dossier', priority: 35, when: { ratio: '>=0.75' }, text: 'DOSSIER · Les riverains de la rue des Bouchers affûtent leurs arguments avant la commission' },
  { id: 'h_bloc_knows', priority: 30, when: { blocKnows: true }, text: 'TENSIONS · Le bloc des restaurateurs sait désormais qui appelle' },
  { id: 'h_quiet_pieces', priority: 20, when: { pieces: '>=1' }, text: 'RUE DES BOUCHERS · Une nuit ordinaire. Le dossier s’épaissit quand même.' },
  { id: 'h_default', priority: 0, when: {}, text: 'RUE DES BOUCHERS · Une nuit comme les autres. C’est bien le problème.' },
];

// Fin de nuit : une phrase d'ambiance selon la raison (complète summary.verdict)
export const NIGHT_END = {
  time: [
    '01h30. La dernière chaise a raclé. La gaine s’est tue. Il reste quatre heures de nuit, en théorie.',
    'Les derniers clients remontent vers la place, en chantant faux. La rue se tait, à regret.',
    'La rue s’éteint. Une bouteille roule quelque part sur les pavés, puis plus rien.',
    'Le dernier store descend avec un grincement. La rue des Bouchers redevient une rue.',
    'Dédé éteint l’enseigne. Pendant une seconde, on entend la ville respirer.',
    'Plus un bruit, sauf la clim qui goutte. Vous comptez les gouttes au lieu des moutons.',
    'Les pavés sèchent, les chaises dorment empilées. Vous, pas encore.',
    'Un dernier « bonne nuiiit ! » résonne vers la place. Il ne vous est pas adressé, mais vous le prenez.',
    'La gaine s’arrête net. Le silence est si soudain qu’il vous réveille.',
    'Klaas éteint sa lampe au bout de la rue. Fin de service pour tout le monde.',
  ],
  sleep: [
    'Vous ne savez plus si vous dormez ou si la rue rêve à votre place. Ça suffit.',
    'Vos paupières ont voté. La rue continuera sans vous.',
    'Vous vous endormez debout, le front contre la vitre. La terrasse ne s’en aperçoit pas.',
    'Le téléphone vous glisse des mains. Le dossier attendra demain.',
    'Vous comptez les chaises pour vous endormir. Vous arrivez à onze. Noir.',
    'Le sommeil gagne par K.-O., pas aux points. Rideau.',
    'La dernière chose que vous entendez : un rire, en bas. La première de demain sera le réveil.',
    'Vous fermez les yeux « deux secondes ». Elles durent jusqu’au matin.',
  ],
  custody: [
    'Gyrophares bleus dans la vitrine de l’estaminet. Cette fois, la patrouille est venue vite. Pour vous.',
    'Pour une fois, la police arrive en moins de cinq minutes. Elle demande Pierre-Louis Dubeton.',
    'La terrasse applaudit pendant qu’on vous emmène. Dédé offre une tournée. Pas à vous.',
    'Le brigadier vous tient la porte de la voiture, poliment. Klaas note l’heure.',
    'Vous descendez l’escalier entre deux agents. Biloute aboie à la porte de Jérémie.',
    'Une nuit au commissariat : enfin un endroit calme. Ce n’est pas une consolation.',
    'Seb filme depuis le balcon d’en face. Nico lui dit d’arrêter. Il continue.',
    'La voiture tourne rue de la Barre. Derrière vous, une chaise racle, comme pour dire au revoir.',
  ],
};

// ════════════════════════════════════════════════════════════════════════════
// RACLEMENTS DE CHAISES (pacing.js) : les tables qu'on rentre, regroupées sur ~2 min de jeu.
// {who} / {Who} = qui rentre (« Le Goulot », « les Mal Lunés et l’estaminet »), {n} = nombre de tables en toutes lettres.
// one : une table · some : plusieurs tables d'un même resto · terrace : la dernière (« sa terrasse ») · many : plusieurs restos
// late : après 22h05 (« enfin ») · saturday / rain : remplacent parfois les autres (samedi sans voitures, pluie).
// Une même ligne ne revient ni dans la même nuit ni la suivante (pacing.js).
// ════════════════════════════════════════════════════════════════════════════
export const CLATTER = {
  names: {
    bernadette: 'l’estaminet', malunes: 'le grill des Mal Lunés', goulot: 'Le Goulot', bloemkool: 'Bloemkool',
    endroit: 'L’Endroit', truffe: 'Truffe et Ficelle', mug: 'Mug',
  },
  one: [
    'Raclement de chaises sur les pavés : {who} rentre une table.',
    'Une table de {who} disparaît à l’intérieur, dans un concert de pieds métalliques.',
    'Quatre chaises raclent les pavés : {who} rentre une table.',
    '{Who} plie une table. Le bruit monte jusqu’à votre fenêtre, puis plus rien.',
    'Crrrrr. Une table de {who} rentre, en traînant les pieds.',
    '{Who} rentre une table, deux chaises sous chaque bras.',
    'Une table de {who} glisse vers l’intérieur dans un raclement aigu.',
    '{Who} replie une table pliante, qui se défend.',
  ],
  one_late: [
    'Raclement de chaises sur les pavés : {who} rentre une table… enfin.',
    '{Who} rentre une table, avec le retard réglementaire.',
    'Une table de {who} se décide à rentrer. Il était temps.',
    'Les chaises de {who} raclent les pavés : une table de moins, enfin.',
    'Une table de {who} rentre en traînant des pieds, comme un ado à l’heure du coucher.',
    'Une table de {who} rentre à contrecœur, longtemps après la cloche.',
    '{Who} rentre une table en faisant semblant de ne pas regarder l’heure.',
    'Une table de {who} quitte le pavé, en retard d’un bon quart d’heure.',
    'Les pieds d’une table de {who} grincent jusqu’à la porte. Il était plus que temps.',
  ],
  some: [
    '{Who} rentre {n} tables d’un coup. Les pavés s’en souviendront.',
    'Raclement en série : {who}, {n} tables.',
    'Un vacarme de chaises empilées : {who} rentre {n} tables.',
    '{Who} débarrasse {n} tables, au pas de course et au bruit maximal.',
  ],
  some_late: [
    '{Who} rentre {n} tables… enfin.',
    '{n} tables de {who} rentrent, bien après l’heure. Mieux vaut tard.',
    'Grand raclement tardif : {who}, {n} tables.',
    '{Who} se réveille et rentre {n} tables à la file.',
    '{Who} rattrape le retard d’un coup : {n} tables, et tout le voisinage le sait.',
    '{n} tables de {who} rentrent enfin, en procession bruyante.',
  ],
  terrace: [
    'Raclement de chaises sur les pavés : {who} rentre sa terrasse.',
    '{Who} rentre ses dernières chaises. Sa terrasse est vide.',
    'Dernier raclement chez {who} : la terrasse est rentrée.',
    '{Who} a tout rentré. Le pavé respire.',
  ],
  terrace_late: [
    'Raclement de chaises sur les pavés : {who} rentre sa terrasse… enfin.',
    '{Who} rentre enfin sa terrasse. Vous notez l’heure, par principe.',
    'Plus une chaise dehors chez {who}. Il aura fallu le temps.',
    '{Who} plie sa terrasse, enfin. Les derniers clients finissent debout.',
  ],
  many: [
    '{Who} rentrent {n} tables en même temps : un orchestre de chaises sur les pavés.',
    'Raclements croisés : {who}, {n} tables en tout.',
    'Toute la rue racle en même temps : {who} rentrent {n} tables.',
    '{Who} rangent {n} tables à l’unisson. La rue des Bouchers fait son bruit de fin de service.',
  ],
  saturday: [
    { text: 'Samedi oblige, {who} rentre les chaises en slalomant entre les buveurs debout.', state: { present: ['debout'] } },
    { text: 'Les chaises de {who} raclent, couvertes par la foule du samedi.', state: { present: ['debout'] } },
    '{Who} tente de rentrer une table ; un groupe debout s’assoit dessus pour l’empêcher.',
  ],
  rain: [
    'Sous la pluie, {who} rentre les chaises au pas de course.',
    'Les chaises mouillées de {who} glissent sur les pavés luisants.',
    '{Who} rentre ses tables en jurant contre la drache.',
  ],
};

// ════════════════════════════════════════════════════════════════════════════
// LA VIE DE LA RUE (pacing.js) : micro-moments injectés quand rien ne s'est passé depuis une vingtaine de secondes.
// when (facultatif, en ET) : from / to (minutes depuis minuit) · sat: true|false · rain: true|false
// state (facultatif) : garde d'état évaluée à l'affichage (src/sim/stateGuard.js, vocabulaire au §14) ; les réserves de chaînes acceptent aussi { text, state }
// effects (facultatif) : noise (un bref pic de bruit dans la rue) · klaas (Klaas prend ses jumelles)
// Jamais deux fois le même dans une campagne tant qu'il en reste d'autres ; jamais dans la même nuit.
// ════════════════════════════════════════════════════════════════════════════
export const AMBIENT = [
  { id: 'scooter', text: 'Un scooter remonte la rue en zigzag. Les pavés le secouent comme un shaker.', effects: { noise: true } },
  { id: 'couple_argue', text: 'Un couple se dispute sous votre fenêtre. Le sujet : qui a eu l’idée de venir ici.' },
  { id: 'tourist_grand_place', text: 'Un touriste demande « la Grand-Place ? » à toute la terrasse. Six doigts pointent dans six directions.', state: { customers: '>0' } },
  { id: 'window_opens', text: 'En face, une fenêtre s’ouvre, quelqu’un regarde la rue, soupire, et la referme.' },
  { id: 'gaufre_balcony', text: 'Gaufre s’installe au bord du balcon d’en face et fixe la terrasse, comme un huissier.', when: { to: 24 * 60 }, state: { present: ['chat'], tablesOut: '>0' } },
  { id: 'bottle_rolls', text: 'Une bouteille vide roule sur les pavés pendant une éternité, puis heurte un pied de chaise.', effects: { noise: true } },
  { id: 'quinquin', text: 'Un passant éméché entonne « Le P’tit Quinquin ». Il ne connaît que le premier vers, qu’il chante quatre fois.', effects: { noise: true }, when: { from: 22 * 60 } },
  { id: 'delivery_lost', text: 'Un livreur à vélo tourne trois fois dans la rue, téléphone à la main, perdu entre deux numéros 10.' },
  { id: 'bell_maurice', text: 'Au loin, la cloche de Saint-Maurice sonne le quart. Personne en terrasse ne l’entend.', when: { from: 22 * 60 + 10 }, state: { customers: '>0' } },
  { id: 'dog_bark_far', text: 'Un chien aboie quelque part vers la place, puis se ravise.' },
  { id: 'heels_cobbles', text: 'Des talons sur les pavés : clac, clac, clac, puis un juron, puis plus de clac.' },
  { id: 'suitcase', text: 'Une valise à roulettes traverse la rue pavée. Vous entendez chaque pavé, un par un.', effects: { noise: true } },
  { id: 'birthday_far', text: 'Plus loin, une terrasse chante « Joyeux anniversaire ». Trois fois, pour trois prénoms différents.', effects: { noise: true }, state: { tablesOut: '>0' } },
  { id: 'phone_loud', text: 'Un client parle au téléphone en haut-parleur. Toute la rue sait maintenant que Kevin ne vient pas.', state: { customers: '>0' } },
  { id: 'toast_loud', text: '« À la nôtre ! » Une table entière se lève pour trinquer. Les verres tintent jusqu’à votre fenêtre.', effects: { noise: true }, state: { tablesOut: '>0' } },
  { id: 'smoker_ghislain', text: 'Ghislain sort fumer sur le pas de la porte, regarde votre fenêtre, et rentre sans finir sa cigarette.' },
  { id: 'dede_laugh', text: 'Le rire de Dédé traverse la vitrine. Il a dû raconter la même blague qu’hier.' },
  { id: 'klaas_light', text: 'Au bout de la rue, la lampe de Klaas s’allume. Il a entendu quelque chose.', effects: { klaas: true }, state: { present: ['klaas'] } },
  { id: 'hilde_curtain', text: 'Le rideau de Hilde bouge, place Maurice-Schumann. Une silhouette, une tasse, puis plus rien.', when: { to: 23 * 60 + 30 } },
  { id: 'tatie_window', text: 'Tatie Bouchon ouvre sa fenêtre, renifle l’air, et la referme avec la dignité d’un e-mail recommandé.' },
  { id: 'jeremie_light', text: 'Au troisième, chez Jérémie, une lumière s’allume. Biloute grogne contre le plancher.', state: { absent: ['biloute'] } },
  { id: 'seb_nico_laugh', text: 'Sur le balcon d’en face, Seb raconte quelque chose à Nico en montrant la terrasse. Ils rient.', when: { to: 23 * 60 + 30 }, state: { present: ['chat'], tablesOut: '>0' } },
  { id: 'tram_bell', text: 'Une cloche de vélo insiste à l’entrée de la rue : un cycliste découvre la terrasse au milieu du passage.', state: { tablesOut: '>0' } },
  { id: 'glass_breaks', text: 'Un verre se brise. Une salve d’applaudissements suit, par réflexe.', effects: { noise: true }, state: { customers: '>0' } },
  { id: 'chair_falls', text: 'Une chaise vide tombe toute seule sur les pavés. Le serveur la relève sans y croire.', effects: { noise: true }, state: { present: ['serveur'] } },
  { id: 'guitar', text: 'Un musicien de rue s’installe à l’angle avec une guitare. Il commence par « Wonderwall ». Évidemment.', effects: { noise: true }, when: { to: 23 * 60 } },
  { id: 'guitar_leaves', text: 'Le guitariste range son étui. Il a gagné trois euros et un sandwich.', when: { from: 23 * 60 } },
  { id: 'police_car_far', text: 'Une sirène passe rue de la Barre, sans tourner. Ce n’est pas pour vous. Ce n’est jamais pour vous.' },
  { id: 'taxi_waits', text: 'Un taxi attend au bout de la rue, warnings allumés, pendant que des clients se disent au revoir douze fois.' },
  { id: 'group_photo', text: 'Une tablée fait une photo de groupe au flash. Vous voyez des étoiles pendant dix secondes.', state: { tablesOut: '>0' } },
  { id: 'student_choir', text: 'Une bande d’étudiants passe en chantant l’hymne d’une fac. Ils ne sont pas d’accord sur les paroles.', effects: { noise: true }, when: { from: 22 * 60 + 30 } },
  { id: 'pigeon', text: 'Un pigeon atterrit sur une table, prend une frite et repart. Personne n’ose protester.', when: { to: 22 * 60 + 30 }, state: { tablesOut: '>0' } },
  { id: 'kid_scooter', text: 'Un enfant en trottinette traverse la terrasse, suivi d’un père qui s’excuse auprès de chaque chaise.', when: { to: 21 * 60 + 45 }, state: { tablesOut: '>0' } },
  { id: 'menu_board', text: 'Le serveur efface l’ardoise. « Waterzooi » disparaît, il ne reste que « Carbonnade ». Comme d’habitude.', state: { present: ['serveur'] } },
  { id: 'exhaust_cough', text: 'La gaine d’extraction tousse, crache une bouffée de friture, et reprend son ronron.', when: { to: 23 * 60 + 30 }, state: { exhaust: true } },
  { id: 'ac_drip', text: 'La clim de l’estaminet goutte sur le pavé, juste sous votre fenêtre. Plic. Plic. Plic.' },
  { id: 'neighbour_shout', text: 'Une voix, quelque part en hauteur : « IL Y A DES GENS QUI DORMENT ! » Ce n’est pas vous. Pour une fois.', when: { from: 23 * 60 } },
  { id: 'wedding_horn', text: 'Un klaxon de mariage résonne depuis la rue de la Barre. La terrasse applaudit sans savoir pourquoi.', state: { customers: '>0' } },
  { id: 'bike_bell_drunk', text: 'Un V’Lille passe, son cycliste chante plus fort que sa sonnette.', when: { from: 22 * 60 } },
  { id: 'fries_smell', text: 'Une odeur de frites monte, puis une odeur de frites plus forte. La gaine fait des heures sup.', state: { exhaust: true } },
  { id: 'umbrella', text: 'Un parasol claque dans le vent. Le serveur le referme en se battant avec lui.', effects: { noise: true }, state: { present: ['serveur'], tablesOut: '>0' } },
  { id: 'lost_keys', text: 'Un homme cherche ses clés à la lumière de son téléphone, entre deux pavés. Il les trouve dans sa poche.' },
  { id: 'cat_fight', text: 'Deux chats se disputent une poubelle dans l’impasse. Gaufre regarde, très intéressée.', effects: { noise: true }, when: { from: 23 * 60 }, state: { present: ['chat'] } },
  { id: 'binoculars_glint', text: 'Un reflet au bout de la rue : les jumelles de Klaas. Il compte.', effects: { klaas: true }, when: { to: 25 * 60 }, state: { present: ['klaas'] } },
  { id: 'rain_drops', text: 'Quelques gouttes tombent. Toute la terrasse lève les yeux au ciel, puis commande une autre tournée.', when: { rain: false, to: 23 * 60 }, state: { customers: '>0' } },
  { id: 'rain_umbrellas', text: 'Les parapluies s’ouvrent sous les parasols. Une terrasse à deux étages.', when: { rain: true }, state: { tablesOut: '>0' } },
  { id: 'rain_gutter', text: 'La gouttière d’en face déborde sur le pavé. Un client y met le pied et jure en flamand.', when: { rain: true }, state: { customers: '>0' } },
  { id: 'sat_crowd_song', text: 'Samedi soir : un groupe debout reprend « Les Corons » en chœur, à peu près juste.', effects: { noise: true }, when: { sat: true }, state: { present: ['debout'] } },
  { id: 'sat_bachelor', text: 'Un enterrement de vie de garçon passe, déguisé en Schtroumpfs. Le futur marié porte la crête.', effects: { noise: true }, when: { sat: true } },
  { id: 'sat_glass_stack', text: 'Quelqu’un a construit une tour de gobelets sur le rebord de votre porte. Elle tient. Pour l’instant.', when: { sat: true } },
  { id: 'sat_ambulance', text: 'Une ambulance remonte la rue au pas, la foule s’écarte en levant les verres.', when: { sat: true, from: 23 * 60 }, state: { present: ['debout'] } },
  { id: 'weekday_quiet', text: 'Un instant, la rue se tait. On entend presque le canal qui coulait dessous jusqu’en 1912.', when: { sat: false } },
  { id: 'weekday_jogger', text: 'Un joggeur frontale allumée traverse la terrasse en s’excusant à chaque foulée.', when: { sat: false, to: 22 * 60 + 30 }, state: { tablesOut: '>0' } },
  { id: 'late_street_sweeper', text: 'La balayeuse de la ville passe au bout de la rue, regarde les tables encore dehors, et fait demi-tour.', when: { from: 24 * 60 }, state: { tablesOut: '>0' } },
  { id: 'late_last_bus', text: 'Quelqu’un court vers le dernier bus en criant « attendez ! » à un bus qui n’attend pas.', when: { from: 24 * 60 } },
  { id: 'late_owl', text: 'Un hibou, ou un client qui imite un hibou. Difficile à dire à cette heure.', when: { from: 24 * 60 + 30 } },
  { id: 'late_waiter_smoke', text: 'Le serveur s’assoit enfin sur une chaise de la terrasse, une cigarette, et regarde le vide.', when: { from: 24 * 60 }, state: { present: ['serveur'] } },
  { id: 'late_snore', text: 'Un ronflement monte d’un balcon voisin. Quelqu’un, quelque part, a réussi à dormir.', when: { from: 24 * 60 + 30 } },
  { id: 'early_setup', text: 'Le serveur aligne les verres sur le comptoir extérieur. Ils brillent comme une promesse non tenue.', when: { to: 21 * 60 + 15 }, state: { present: ['serveur'] } },
  { id: 'early_happy_hour', text: 'Ardoise des Mal Lunés : « Happy hour jusqu’à 22h ». Vous lisez « 22h » et vous souriez, naïf.', when: { to: 21 * 60 + 30 } },
  { id: 'early_sunset', text: 'Le soleil couchant allume les pignons à gradins. Pendant une minute, la rue est belle. Puis une chaise racle.', when: { to: 21 * 60 + 15, rain: false } },
  { id: 'bell_22_after', text: 'La dernière note de la cloche de 22h flotte encore. Personne en terrasse n’a bougé.', when: { from: 22 * 60, to: 22 * 60 + 20 }, state: { tablesOut: '>0' } },
  { id: 'chti_drunk', text: '« Allez, biloute, on rinte ! » crie quelqu’un. Personne ne rentre.', when: { from: 23 * 60 }, state: { customers: '>0' } },
  { id: 'window_lamp', text: 'Votre lampe de bureau fait un reflet dans la vitre : votre propre visage, très fatigué, vous regarde.' },
];

// ════════════════════════════════════════════════════════════════════════════
// LIGNES DE LA RUE (pacing-2) : choisies par narrative.streetLine (pas deux fois dans la nuit ni la suivante).
// pee_door : quelqu'un urine contre la porte de Pilou (samedi) · round_note : {table} / {Table} repérée par Biloute
// db.* : relevé en dB ({db}, {every}) · round_action : résultats de l'action « ronde de 22h avec Jérémie »
// ════════════════════════════════════════════════════════════════════════════
export const STREET_LINES = {
  pee_door: [
    'Quelqu’un urine contre votre porte d’entrée. Classique du samedi.',
    'Un client de la terrasse a choisi votre porte comme toilettes. Elle n’a rien demandé.',
    'Bruit de ruisseau contre votre porte. Ce n’est pas le canal de 1912.',
    'Un homme, face à votre porte, siffle « Le P’tit Quinquin ». Il ne fait pas que siffler.',
    'Votre seuil vient de servir d’urinoir. Le samedi sans voitures a ses traditions.',
    'Un passant soulage sa vessie contre votre porte, en s’excusant auprès d’elle.',
    'Contre votre porte : un dos, une flaque, une odeur. Le samedi, dans l’ordre.',
    'Encore un. Votre porte d’entrée a vu plus de vessies cette nuit qu’un urologue.',
    'Quelqu’un tient votre porte d’entrée d’une main. L’autre main est occupée.',
  ],
  round_note: [
    'Jérémie passe avec le teckel et note {table}.',
    'Biloute s’arrête net devant {table} et grogne. Jérémie note.',
    'Jérémie compte à voix basse devant {table}, crayon en l’air.',
    'Le teckel renifle {table}, pose les fesses et attend. Jérémie écrit.',
    'Jérémie photographie {table} « pour le dossier ». Biloute pose pour la photo.',
    '{Table} : Biloute aboie une fois. Jérémie hoche la tête et note.',
    'Jérémie mesure à grands pas l’écart entre {table} et le couloir. Biloute suit.',
    'Devant {table}, Jérémie murmure « recevable ». Le teckel approuve.',
  ],
  db: {
    recorded: [
      '📟 {db} dB relevés et horodatés.',
      '📟 {db} dB, horodaté, enregistré. Une pièce de plus.',
      '📟 {db} dB. Le téléphone garde l’heure, le dossier garde le reste.',
      '📟 Relevé à {db} dB : pièce au dossier.',
      { text: '📟 {db} dB. Vous enregistrez, la terrasse trinque.', state: { customers: '>0' } },
      '📟 {db} dB mesurés depuis la fenêtre. Jérémie dirait « recevable ».',
      '📟 L’aiguille monte à {db} dB. Capture faite.',
      '📟 {db} dB, noté à la seconde près. Klaas serait fier.',
    ],
    early: [
      '📟 {db} dB. Avant 22h, ça ne compte pas.',
      '📟 {db} dB, mais il n’est pas encore 22h. Patience.',
      '📟 {db} dB. La loi dort jusqu’à 22h, vous pas.',
      '📟 {db} dB. Trop tôt : avant la cloche, c’est encore « l’ambiance ».',
      '📟 {db} dB. Gardez votre batterie pour après 22h.',
      '📟 {db} dB. Avant 22h, la commission appellera ça « de la vie ».',
      '📟 {db} dB. Revenez après la cloche de 22h.',
      '📟 {db} dB. Bruyant, mais légal. Pour l’instant.',
    ],
    low: [
      '📟 {db} dB. Pénible, mais pas assez pour un dossier.',
      '📟 {db} dB. Sous le seuil. Le tapage, ce sera pour plus tard.',
      '📟 {db} dB : agaçant, pas recevable.',
      '📟 {db} dB. Un murmure, à l’échelle de la rue.',
      '📟 {db} dB. Même Ghislain dirait que c’est calme.',
      '📟 {db} dB. Pas de quoi déranger un huissier.',
      '📟 {db} dB. Vous avez connu pire. Hier, par exemple.',
      '📟 {db} dB. Le dossier veut plus fort.',
    ],
    again: [
      '📟 {db} dB. Déjà un relevé il y a moins de {every} min.',
      '📟 {db} dB. Le dernier relevé date de moins de {every} min : inutile de doubler.',
      '📟 {db} dB. Un relevé toutes les {every} min, pas plus : ça fait sérieux.',
      '📟 {db} dB. Doublon : le précédent a moins de {every} min.',
      '📟 {db} dB. Attendez un peu : {every} min entre deux relevés.',
      '📟 {db} dB. Trop rapproché du précédent (moins de {every} min).',
      '📟 {db} dB. La commission n’aime pas les doublons. Encore quelques minutes.',
      '📟 {db} dB. Noté, mais pas compté : moins de {every} min depuis le dernier.',
    ],
  },
  round_action: [
    'Jérémie compte les tables à voix haute, Biloute renifle chaque pied de chaise, vous notez. Biloute s’arrête net devant chaque table qui déborde et la fixe, comme un huissier. Personne ne sait comment il fait, mais il a raison.',
    'La ronde part de la rue de la Barre. Jérémie récite l’arrêté, Biloute fait les pauses. Vous notez ce qui dépasse.',
    'Jérémie salue chaque terrasse d’un « bonsoir » de notaire. Biloute, lui, ne salue personne et repère tout.',
    'Trois pas, un arrêt, un chiffre. Jérémie compte, Biloute grogne, vous écrivez. La ronde avance comme une procession.',
    'Jérémie porte son gilet « Association » et sa lampe frontale. Le teckel porte sa dignité. Les tables en trop, elles, sont notées.',
    'Biloute tire sur la laisse vers chaque table qui mord sur le couloir. Jérémie le laisse faire : « il a le flair juridique ».',
    'Dédé vous regarde passer et lève son verre. Jérémie note l’heure du verre levé. Biloute note Dédé.',
    'La ronde du soir : Jérémie mesure les distances à grandes enjambées, Biloute vérifie au ras du sol, vous tenez le carnet.',
  ],
};

// ════════════════════════════════════════════════════════════════════════════
// LE GROUPE WHATSAPP LA NUIT (pacing-2) : un message court quand la rue a déjà eu deux micro-moments d'affilée
// (jamais 3 ambiances de suite). {group} = WHATSAPP_GROUP. Pas deux fois dans la nuit, ni la suivante.
// ════════════════════════════════════════════════════════════════════════════
export const PHONE_PINGS = [
  { speaker: 'seb', text: '📱 {group} · Seb : « Vous entendez ça ? On dirait un mariage. C’est un mardi. »' },
  { speaker: 'nico', text: '📱 {group} · Nico : « Capture faite. Table du fond, 9 personnes. Je classe. »', state: { tablesOut: '>0' } },
  { speaker: 'seb', text: '📱 {group} · Seb : « Gaufre vient de rentrer. Elle a abandonné. Moi pas. »', state: { absent: ['chat'] } },
  { speaker: 'jeremie', text: '📱 {group} · Jérémie : « Rappel : photos horodatées, pas de commentaires sur les clients. Merci. »' },
  { speaker: 'tatie', text: '📱 {group} · Tatie Bouchon : « Ça sent la friture jusque dans ma salle de bains. Faut résister. »', state: { exhaust: true } },
  { speaker: 'hilde', text: '📱 {group} · Hilde : « Il reste de la soupe. Qui ne dort pas ? »' },
  { speaker: 'klaas', text: '📱 {group} · Klaas : « 22h47. Noté. »' },
  { speaker: 'seb', text: '📱 {group} · Seb : « Attends, attends : le serveur vient de s’asseoir avec les clients. »', state: { present: ['serveur'], customers: '>0' } },
  { speaker: 'nico', text: '📱 {group} · Nico : « Seb, on avait dit pas de vidéos de passants. »' },
  { speaker: 'seb', text: '📱 {group} · Seb : « C’est pas un passant, c’est Dédé. »' },
  { speaker: 'jeremie', text: '📱 {group} · Jérémie : « Qui a le décibelmètre ? Le mien affiche ‹ LO BAT ›. »' },
  { speaker: 'tatie', text: '📱 {group} · Tatie Bouchon : « Qui dort dîne. Personne ne dort, donc ils dînent tous. »' },
  { speaker: 'nico', text: '📱 {group} · Nico : « Quelqu’un a vu une patrouille ce soir ? Non ? Moi non plus. »' },
  { speaker: 'klaas', text: '📱 {group} · Klaas : « Ja. Je vois tout. Même vos photos floues. »' },
  { speaker: 'seb', text: '📱 {group} · Seb : « La table 4 chante. Faux. Très faux. »', state: { tablesOut: '>0' } },
  { speaker: 'hilde', text: '📱 {group} · Hilde : « Klaas a repris ses jumelles. Je vais faire une tisane. »', state: { present: ['klaas'] } },
  { speaker: 'jeremie', text: '📱 {group} · Jérémie : « Je rappelle que la commission lit nos messages. Enfin, pas celui-là. »' },
  { speaker: 'nico', text: '📱 {group} · Nico : « J’archive. Dans dix ans, ce groupe sera au musée. »' },
  { speaker: 'seb', text: '📱 {group} · Seb : « Quelqu’un a commandé une deuxième carbonnade. À cette heure-ci. »', state: { present: ['serveur'] } },
  { speaker: 'tatie', text: '📱 {group} · Tatie Bouchon : « Ghislain m’a encore écrit ‹ c’est en cours ›. Je l’ai encadré. »' },
  { speaker: 'klaas', text: '📱 {group} · Klaas : « Le couloir fait 1,40 m. Je l’ai mesuré deux fois. Avec Hilde. »' },
  { speaker: 'nico', text: '📱 {group} · Nico : « Pilou, ta lumière est allumée. On te voit. Dors. »' },
  { speaker: 'seb', text: '📱 {group} · Seb : « Ils ont sorti une table de plus. Je la vois. Elle est neuve. »', state: { tablesOut: '>0' } },
  { speaker: 'jeremie', text: '📱 {group} · Jérémie : « Biloute dort. Biloute a raison. »', state: { absent: ['biloute'] } },
  { speaker: 'hilde', text: '📱 {group} · Hilde : « Pensez à fermer vos fenêtres côté rue. Ou à les ouvrir côté cour. »' },
  { speaker: 'tatie', text: '📱 {group} · Tatie Bouchon : « Petit à petit, l’oiseau fait son nid. Et la terrasse fait son bruit. »' },
  { speaker: 'seb', text: '📱 {group} · Seb : « Je viens de voir le guitariste repasser. Il joue la même. »' },
  { speaker: 'nico', text: '📱 {group} · Nico : « Rappel : le groupe n’est pas un chat de nuit. (Il l’est.) »' },
  { speaker: 'klaas', text: '📱 {group} · Klaas : « Ronflement au numéro 27. Ce n’est pas une infraction. Je note quand même. »' },
  { speaker: 'jeremie', text: '📱 {group} · Jérémie : « Bonne nuit à tous. Je dis ça pour la forme. »' },
];
