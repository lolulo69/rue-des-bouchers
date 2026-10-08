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
    'Silence. Même Gaufre regardait ailleurs.',
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
  ],
  offduty: [
    'Le serveur est parti. Il ne reste que Dédé, qui fait semblant de ne pas vous voir.',
    'Plus de serveur. Ghislain ferme la caisse et ne lève pas les yeux.',
  ],
  cooldown: [
    'Le serveur : « Je vous ai dit, je vais voir avec le patron… »',
    'Le serveur : « Deux minutes, monsieur, j’ai six tables. »',
  ],
  none: [
    'Le serveur : « C’est déjà rentré, monsieur. Bonne nuit ! »',
  ],
  ok: [
    'Le serveur soupire : « OK, OK… je rentre tout. »',
    'Le serveur : « Vous avez raison. Allez, messieurs-dames, on rentre ! » Il a l’air presque content.',
    'Le serveur : « Je fais que mon taf, moi. Et là, mon taf, c’est de rentrer les tables. »',
  ],
  refused: [
    'Le serveur revient : « Le patron dit que les clients finissent leur verre. »',
    'Le serveur, gêné : « Dédé dit que c’est réglé avec la mairie. » Ça ne l’est pas.',
    'Le serveur : « J’peux pas, monsieur. Si je rentre sans qu’on me le dise, c’est moi qui sors. »',
  ],
  refused_bloc_knows: [
    'Le serveur, gêné : « Le patron sait que c’est vous qui appelez la police… »',
    'Le serveur, à voix basse : « Désolé. On m’a dit de ne plus vous répondre. »',
  ],
  // Variantes une fois `met_waiter` (le moteur peut les préférer)
  theo: {
    ok: ['Théo : « Pour toi, je rentre. Mais tu m’as pas vu, hein. »'],
    refused: [
      'Théo : « Pas ce soir, Pilou. Dédé est sur les nerfs. Demain, peut-être. »',
      'Théo, sans s’arrêter : « J’ai six tables et un patron. Plus tard. »',
      'Théo hausse les épaules vers la vitrine, où Dédé le regarde. Ça veut dire non.',
      'Théo : « Je te jure, j’ai essayé. Il m’a répondu ‹ encore une tournée ›. »',
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
  ],
  sleep: [
    'Vous ne savez plus si vous dormez ou si la rue rêve à votre place. Ça suffit.',
  ],
  custody: [
    'Gyrophares bleus dans la vitrine de l’estaminet. Cette fois, la patrouille est venue vite. Pour vous.',
  ],
};
