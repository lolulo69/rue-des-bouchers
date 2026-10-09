// Règles du jeu. Tout ce qui est "réglementaire" ou "réglable" est ici, pour pouvoir le caler sur la réalité
// (arrêté municipal terrasses de Lille, AOT, etc.) et équilibrer sans toucher au code.
// Heures exprimées en minutes depuis minuit du jour de la partie (25 * 60 = 01:00 le lendemain).
// La simulation (src/sim) ne lit que ce fichier : les tests passent des variantes via makeConfig().

export const RULES = {
  terraceCloseHour: 22,          // règle propre à la rue des Bouchers depuis 2026
  lateGraceMinutes: 5,           // tolérance avant qu'une table dehors devienne une infraction "après 22h"
  maxPeoplePerTable: 6,          // spécifique à la rue des Bouchers
  nightStart: 20 * 60 + 30,      // début de partie (20:30)
  nightEnd: 26 * 60 + 30,        // fin de partie (02:30 ; §12d.4 : la fenêtre tardive, l'horloge ×3 la garde courte)
  streetEmptyAt: 25 * 60,        // 01:00 : terrasses rentrées, buveurs partis (§12d.4) ; Klaas dort (WITNESS.klaas.sleepAt)
  gameMinutesPerSecond: 0.5,     // 1 s réelle = 30 s de jeu → ~10 min de jeu réel pour la nuit
  sleepTimeMultiplier: 40,       // accélération du temps quand Pilou essaie de dormir (§12c.5 : ×12 → ×40)
  // Horloge adaptative (§12c.5, src/sim/nightClock.js) : après fastAfter, ×fastScale sauf si quelque chose se passe ou
  // va se passer (patrouille en route ou sur place, moment de twist / événement de nuit dans les lookahead minutes,
  // témoin / preuve / action dans les calmMinutes dernières minutes). « Accélérer » (manuel) : ×fastScale dès 20h30.
  clock: { fastAfter: 22 * 60 + 30, fastScale: 3, lookahead: 10, calmMinutes: 5, easeSeconds: 1.2 },
  // Conseil « au lit » (§12c.5, objectives.js bedtimeHint) : après `after`, quand tout est fait ou Sommeil ≤ tiredSleep ;
  // visible `show` minutes de jeu, au plus une fois toutes les `every` minutes
  bedtime: { after: 22 * 60 + 30, tiredSleep: 25, show: 8, every: 20 },
  objectives: { max: 4, maxInfo: 1 },
  skipMinutesPerFrame: 30,      // « Passer à demain matin » : minutes de nuit simulées par image (même sim, minute par minute)
};

// Variantes de soirée (?day=sat). Le lundi est la soirée de référence.
export const DAYS = {
  mon: {
    key: 'mon', label: 'Lundi · nuit 1',
    overLimitChance: 0.4, extraPeople: 0, extraTables: 0,
    crowdDb: 0,                  // bonus de bruit global (foule)
    standingGroups: 0,
    pee: null,
  },
  sat: {
    key: 'sat', label: 'Samedi · nuit 6 (sans voitures)',
    overLimitChance: 0.65, extraPeople: 1, extraTables: 1,
    crowdDb: 3,
    standingGroups: 6,           // buveurs debout dans la rue
    standingSize: [3, 6],
    standingLeave: [24 * 60, 25 * 60 + 10],
    pee: { interval: [7, 16], duration: 1.5, pilouDoorChance: 0.3 },
  },
};

// Ciel : crépuscule → nuit
export const SKY = {
  duskStart: 20 * 60 + 30,
  nightFull: 22 * 60 + 15,
};

export const STREET = { halfWidth: 3.2, length: 90 };

// Zone de terrasse autorisée (non marquée au sol) + couloir de passage libre au milieu de la rue.
// Une table "occupe" un disque de rayon tableFootprint (chaises comprises).
export const ZONES = {
  corridorHalfWidth: 1.0,        // passage libre de 2 m au centre (pompiers, poussettes, fauteuils)
  tableFootprint: 1.05,
  wallGap: 0.05,
  encroach: [0.15, 0.55],        // de combien une table qui déborde mord sur le couloir (m)
};

export const RESTAURANTS = [
  // compliance : probabilité de rentrer la terrasse à l'heure
  // influence  : capacité à "arranger" les choses avec la police municipale
  // lateClear  : fenêtre [min, max] où une terrasse non conforme finit par rentrer
  // encroachChance : probabilité qu'une table déborde sur le couloir
  // Géographie §1b (z = −45 rue de la Barre → +45 place Maurice-Schumann) : Bernadette (n°10) et les Mal Lunés (n°14)
  // dans le premier tiers côté pair, Le Goulot (n°33) vers la place côté impair. Bloemkool et L'Endroit = décor (world.js).
  // world.js cale l'immeuble de Pilou, le balcon d'en face et les commerces de décor sur ces positions.
  { id: 'bernadette', name: "Estaminet La Ch’tite Bernadette", side: -1, z0: -30, z1: -18, tables: 6, compliance: 0.2, influence: 0.6, encroachChance: 0.35, lateClear: [23 * 60, 25 * 60 + 15], color: 0x8a2b2b },
  { id: 'goulot', name: 'Le Goulot', side: 1, z0: 22, z1: 32, tables: 4, compliance: 0.6, influence: 0.15, encroachChance: 0.2, lateClear: [22 * 60 + 20, 23 * 60 + 30], color: 0x2b4a8a },
  { id: 'malunes', name: 'Les Bouchers Mal Lunés', side: -1, z0: -15, z1: -5, tables: 4, compliance: 0.45, influence: 0.35, encroachChance: 0.25, lateClear: [22 * 60 + 30, 24 * 60 + 30], color: 0x2b6a3a },
];

// Points du décor dont la simulation a besoin (géographie §1b : z < 0 = côté rue de la Barre, z > 0 = place
// Maurice-Schumann). Dans le navigateur, main.js écrase pilouWindow / streetDoor / bed / exhaust avec les valeurs
// renvoyées par buildWorld() (world.js, passe art) ; ces valeurs-ci servent aux tests et au simulateur headless.
export const ANCHORS = {
  pilouWindow: { x: -3.4, y: 8.4, z: -24 },  // 2e étage au-dessus de Bernadette (aplomb du milieu de sa terrasse)
  streetDoor: { x: -2.6, y: 0, z: -18.2 },   // devant la porte de l'immeuble de Pilou
  bed: { x: -11, y: 7.8, z: -25.6 },         // oreille de Pilou au lit : la chambre côté cour (appartement art-v1.1, §12b.D)
  sofa: { x: -4.75, y: 7.75, z: -21.5 },     // tête de Pilou allongé sur le canapé d'angle du séjour, côté rue (§12b.D) ; world.sofa fait foi dans le jeu
  exhaust: { x: -2.9, y: 7.0, z: -23 },      // la gaine monte jusque sous sa fenêtre
  klaasWindow: { x: 0, y: 5.7, z: 67.6 },    // au fond de la place Maurice-Schumann, en enfilade sur toute la rue
  balcony: { x: 3.0, y: 7.8, z: -22.5 },     // Seb & Nico, juste en face de Pilou
  waiter: { x: -0.7, z: -24.5, amplitude: 6, speed: 0.24 }, // va-et-vient devant la terrasse
  policeSpawn: { x: 0, z: -43 },
  van: { x: 0.3, y: 1, z: -11 },              // twist corridorBlocked : la camionnette de livraison au milieu du passage             // le commissariat est côté rue de la Barre
  doorways: [
    { x: -3.0, z: -18.2, label: 'la porte de Pilou', pilou: true },
    { x: 2.95, z: -36, label: 'une porte cochère en face' },
    { x: -2.95, z: -4.5, label: 'l’entrée des Mal Lunés' },
    { x: 2.95, z: 8, label: 'un porche en face' },
    { x: -2.95, z: 12, label: 'une porte au milieu de la rue' },
  ],
  standingSpots: [-36, -33, -12, -9, -2, 18, 35], // z où se forment les groupes debout (samedi)
};

// Portées d'interaction : la même valeur sert pour l'invite [E] et pour l'action.
export const INTERACT = { door: 1.6, aptDoor: 1.4, bed: 1.7, waiter: 2.2, window: 1.5 };

// Bruit (dB). Chaque source : niveau à 1 m, atténuation géométrique 20·log10(d).
export const NOISE = {
  ambientDb: 36,
  personDb: 58,                  // une personne attablée qui parle fort en terrasse
  standingDb: 60,                // debout, verre à la main
  lateBoostDb: 3,
  lateBoostAfter: 22 * 60,
  drunkBoostDb: 3,
  drunkAfter: 23 * 60,
  clatterDb: 80,                 // chaises métalliques traînées sur les pavés au rangement
  clatterMinutes: 1.25,          // durée du fracas (minutes de jeu)
  exhaustDb: 64,
  exhaustOffMinute: 23 * 60 + 30,
  indoorAttenuationDb: 8,        // fenêtre ouverte (l'été, pas le choix)
  hudMinDb: 30,
  hudMaxDb: 90,
};

export const SLEEP = {
  start: 100,
  drainAfter: 22 * 60,
  thresholdDb: 35,
  drainPerDbMinute: 0.02,
  exhaustDrainPerMinute: 0.04,
  recoverPerMinute: 0.25,
  sofaRecover: 0.6,              // s'assoupir sur le canapé (salon, côté rue) récupère moins que la chambre côté cour
};

export const EVIDENCE = {
  photoRange: 35,
  sharpRange: 18,
  measureRange: 5,               // pour prouver un débordement, il faut mesurer (mètre ruban) : être dans la rue, tout près
  overLimitValue: 1,
  lateValue: 1,
  corridorValue: 1.5,
  peeValue: 0.5,
  complaisanceValue: 2,
  tipoffValue: 2.5,              // carnet de Klaas : tables rentrées juste avant la police, ressorties après
  vanValue: 1.5,                 // twist : photo de la camionnette qui bloque le couloir (sécurité incendie)
  dbValue: 0.6,                  // relevé sonore horodaté (sonomètre du téléphone, ou le démon Rust de Pilou)
  dbThreshold: 55,               // au-dessus, après 22:00 : tapage nocturne documenté
  dbEvery: 30,                   // un relevé utile par demi-heure
  bribeValue: 5,                 // l'enveloppe de Dédé photographiée : le jackpot
  roundValue: 0.5,               // infraction repérée pendant la ronde de Jérémie et du teckel
  repeatFactor: 0.2,             // même resto + même type d'infraction, même nuit : la 2e pièce et les suivantes comptent ×0.2 (QA balance #2)
  mairieValue: 0.5,
  dossierTarget: 14,
  minQuality: 0.4,
};

// Police municipale. Le roster est caché : [avant shiftChange, après]. Klaas pourra le deviner (v0.4).
export const POLICE = {
  delayMin: 10,
  delayMax: 22,
  delayPerExtraCall: 0.5,
  maxCalls: 3,                   // au-delà : "Ah, c'est encore vous" → plus personne ne vient
  fatiguePerCall: 0.08,          // chaque rappel baisse la probabilité de verbaliser
  assoDelayMult: 0.6,            // "j'appelle pour l'Association" : plus rapide…
  assoHostility: 25,             // …mais le bloc sait qui appelle
  fineHostility: 11,             // un PV après un appel : le bloc enrage (aléa : dépend de la patrouille)
  walkInMinutes: 3,              // les agents apparaissent au bout de la rue 3 min avant d'arriver
  walkOutMinutes: 3,
  stayMinutes: 6,
  dossierWeight: 0.07,
  assoWeight: 0.2,
  influenceWeight: 0.6,
  minAct: 0.03,
  maxAct: 0.97,
  complianceAfterAct: 1,         // le resto se tient à carreau après un PV
  corruptionWeight: 0.4,         // corruption (cachée, 0–100) : −0.4 × (corruption − 50) / 100 sur la probabilité de verbaliser
  bribeChance: 0.5,              // Lemaire + café offert : Dédé glisse une enveloppe…
  bribeMinutes: 3,               // …pendant 3 minutes, photographiable
  bribePhotoRange: 15,           // une photo nette depuis un endroit légal (rue ou fenêtre)
  visitMinutes: 6,               // la police vient pour Pilou (plainte du bloc) : durée de la visite
  visitRisk: 10,                 // …et s'il y a des témoins ennemis d'actes passés : rappel à la loi
  warningClearMinutes: 30,       // un agent non complaisant qui ne verbalise pas avertit : tables rentrées dans les 30 min
  scandalThreshold: 2,           // pièces "police" (complaisance, tuyau) diffusées → scandale → le commissaire
  shiftChange: 23 * 60,
  roster: {
    mon: ['benali', 'lemaire'], tue: ['lemaire', 'lemaire'], wed: ['benali', 'benali'], thu: ['benali', 'lemaire'],
    fri: ['lemaire', 'lemaire'], sat: ['lemaire', 'benali'], sun: ['benali', 'benali'],
  },
  patrols: {
    lemaire: {
      // complaisant : le café offert (complaisance) est le trait de Lemaire, et de lui seul (qa/coherence.md pass 3)
      name: 'Brigadier Lemaire', complaisant: true, actBase: 0.12, delayMult: 1.3, firstCallExtra: 8,
      tipoff: { bernadette: 0.85, default: 0.4 }, tipoffLead: 5, tipoffReturn: [5, 12],
    },
    benali: { name: 'Agent Benali', actBase: 0.8, delayMult: 1, firstCallExtra: 0, tipoff: { default: 0 }, transferAfterActs: 3 },
    chief: { name: 'Le commissaire', actBase: 0.95, delayMult: 0.7, firstCallExtra: 0, tipoff: { default: 0 } },
  },
};

export const WAITER = {
  base: 0.15,
  complianceWeight: 0.5,
  assoWeight: 0.25,
  hostilityWeight: 0.3,          // × hostilité du bloc / 100
  cooldownMinutes: 10,
  offDutyAt: 24 * 60 + 45,
};

// Témoins des actes illégaux : ligne de vue (la rue est un canyon : deux points sur la même façade ne se voient pas)
// + portée selon l'obscurité + probabilité de remarquer. weight = poids dans le Risque, ally = membre de l'asso.
export const WITNESS = {
  sightDusk: 45,
  sightNight: 26,
  // Klaas voit toute la rue depuis la place, mais de loin : sa détection baisse avec la distance (pleine jusqu'à near,
  // nulle au-delà de far), et la nuit il lui faut ses jumelles (portées réduites). [crépuscule, nuit]
  // Klaas regarde la rue en enfilade depuis la place (~90 m de Pilou). À l'œil nu il distingue peu de chose de loin,
  // surtout la nuit ; quand il a ses jumelles (de temps en temps, et dès qu'il entend du grabuge), il voit tout.
  klaas: {
    name: 'Klaas (place Maurice-Schumann)', p: 0.9, weight: 0.5, ally: true, sleepAt: 25 * 60, near: [35, 15], far: [130, 75],
    binoculars: { p: 0.95, near: 80, far: 170, every: [12, 25], duration: [4, 8], react: 8 },
  },
  seb_nico: { name: 'Seb & Nico (balcon)', p: 0.7, weight: 0.3, ally: true, catLeave: [23 * 60, 24 * 60 + 30] },
  waiter: { name: 'le serveur', p: 0.6, weight: 1, ally: false },
  newWaiter: { name: 'le nouveau serveur', p: 0.7, weight: 1, ally: false }, // remplace Théo une fois renvoyé (waiter_fired)
  customers: { name: 'des clients', p: 0.25, weight: 0.8, ally: false, filmChance: 0.35, filmWeight: 0.5, wetBonus: 0.3 },
  darkFactor: 0.5,              // la nuit, dans la rue, on distingue mal une fenêtre éteinte (serveur, clients)
  saturdayCover: 0.7,
  jeremie: { name: 'Jérémie et son teckel', p: 0.8, weight: 0.3, ally: true },            // la foule du samedi couvre : chaque client remarque moins
  riskCap: 1.6,                  // plafond de la somme des poids
};

export const BUCKET = {
  radius: 3.5,
  risk: 20,                      // ×poids des témoins (≤1.6) : ~32 par seau vu ; le Risque s'accumule sur la campagne (QA balance #3)
  assoPenalty: 20,               // seulement si un allié a vu ou si une vidéo circule
  refillMinutes: 15,
};

export const RISK = { start: 0, warning: 30, complaint: 60, custody: 90 };

export const ASSO = {
  start: 50,
  shareGainPerPiece: 3,
  shareDecay: 0.7,               // rendements décroissants : chaque pièce partagée le même soir vaut ×0.7 de la précédente
  nightGainCap: 4,               // gain d'Asso max par nuit (QA balance #1)
  diminishFrom: 55,              // campagne : au-dessus, chaque gain d'Asso vaut ×(100 − asso) / (100 − diminishFrom)
  spamPenalty: 3,
};

// La ronde du soir de Jérémie et de son teckel : il repère des infractions (preuve), voit ce qui se passe (allié),
// et aboie si Pilou fait quelque chose d'illégal à proximité (tous les témoins de la rue remarquent davantage).
export const DOG = {
  start: 21 * 60 + 30, end: 22 * 60 + 30,
  x: 0.8, z0: -42, z1: 42,
  spotRange: 2.5,
  barkRange: 10,
  barkBonus: 0.25,
};

// Déguisements (drapeaux de campagne) : multiplicateur sur la probabilité que des non-alliés reconnaissent Pilou.
export const DISGUISE = { disguise_hood: 0.6, disguise_vest: 0.5 };

// Drapeaux lus par le moteur : le contenu (src/content/flags.js) doit les déclarer s'il les utilise.
export const ENGINE_FLAGS = {
  disguise_hood: 'Pilou a une capuche (moins reconnaissable)',
  disguise_vest: 'Pilou a un gilet jaune « livreur » (encore moins reconnaissable)',
  camera_awning: 'Caméra cachée sous le store de Bernadette (filme tout, preuves illégales)',
  inquiry_open: 'Enquête interne ouverte (pot-de-vin photographié)',
  lemaire_transferred: 'Le brigadier Lemaire est muté',
  unemployed: 'Pilou est viré de Koddex et continue la lutte à plein temps',
};

// Campagne de 14 jours (§3). Les identifiants de fins sont ceux attendus dans src/content/endings.js.
export const CAMPAIGN = {
  days: 14,
  weekdays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'], // le jour 1 est un lundi
  saturdays: [6, 13],
  start: { sleep: 70, asso: 40, risk: 0, job: 70, dossier: 0, hostility: 20, corruption: 60 },
  endings: ['legal_victory', 'negotiated_peace', 'scandal', 'custody', 'moving_out', 'fired', 'turncoat', 'the_return'], // ids de src/content/endings.js
  earlyEndings: ['custody', 'fired', 'moving_out'], // ou `early: true` sur la fin
  earlyFromDay: 5,               // aucune fin anticipée avant la nuit 5
  finalFlag: 'commission_done',  // posé par la commission du J14 : la campagne se termine là (pas de 14e nuit)
  preGate: { riskCap: 89, sleepFloor: 5, jobFloor: 5 }, // avant la nuit 5 : on frôle, on ne tombe pas
  riskDecayPerDay: 5,            // le Risque persiste et ne baisse que lentement (QA balance #3)
  sleepNeutral: 60,              // une nuit qui finit au-dessus repose Pilou, en dessous elle l'use
  sleepCarry: 0.5,
  jobDecayPerDay: 7,
  workJob: 5,                    // un prompt de vrai travail
  sideProjectDiscovery: 0.5,     // le risque d'un side project ne compte que si Stéphane / Clode Kode le remarque
  prompts: 3,
  afternoonTime: 3,              // créneaux d'actions l'après-midi
  unemployedBonusTime: 2,
  repeatCooldownDays: 4,        // une entrée rejouable ne revient pas avant 4 jours (sauf `repeatable: true`)
  nightEventsAtTime: true,      // les événements de nuit se jouent à leur heure pendant la nuit, pas en cartes avant
  nightEventAt: 21 * 60,        // heure par défaut d'un événement de nuit sans `at`
  // Projets perso de Koddex (koddex.js) qui changent la mécanique
  dbLogger: { every: 30, quality: 0.7, valueScale: 0.5 }, // proj_db_logger : relevé auto à la fenêtre, toutes les 30 min après 22h
  whatsappBot: { actions: ['pm_whatsapp_rally', 'pm_petition_start', 'pm_banners', 'pm_recruit'], timeDiscount: 1, assoBonus: 2 }, // proj_whatsapp_bot
  nightEvidenceScale: 0.067,     // pièce légale de la nuit → points de dossier de campagne (les mêmes infractions reviennent chaque nuit : balance 2026-10-08)
  contentEvidenceValue: 3,       // effet { evidence } du contenu : valeur × qualité
  contentDossierScale: 0.3,       // gains de Dossier écrits par le contenu (`dossier: +N`) × ce facteur
  contentAssoScale: 0.5,         // gains d'Asso écrits par le contenu (`asso: +N`) × ce facteur
  assoDecayPerDay: 4,            // l'Asso redescend chaque matin vers son niveau de départ si on ne la nourrit pas
  dossierTarget: 100,            // ~8–10 bonnes nuits (QA balance #2)
  maxCountermovesPerDay: 2,
  maxDialoguesPerPhase: 2,
  randomEventsPerPhase: 1,
  policeFatigueDecay: 1,         // les appels de la veille comptent encore ("c'est encore vous"), −1 par jour
  dayWitness: { grey: 0.25, illegal: 0.45 }, // actions de jour : chance d'être vu (avant déguisement)
  reversal: { minHostility: 60, chance: 0.35, window: [22 * 60, 24 * 60] }, // la police vient pour Pilou
  igpn: { openCorruption: -15, transferAfterDays: 3, transferCorruption: -25 },
  tatieLeak: { flag: 'tatie_wavering', minHostility: 40, chance: 0.25 },
  // Bureau ou télétravail (§12b.D) : ~2 jours à la maison par semaine (jamais le J14), tirés à la graine de campagne
  workdays: { homePerWeek: 2, homeJobPenalty: 1, officeSceneChance: 0.5 }, // Tatie, flattée par le bloc, peut laisser fuiter le vrai plan à Martine
};

// Menu de nuit (N, §12c.4) : tout ce que le menu affiche vient d'ici et des données (actions.js, nightActions.js)
export const NIGHT_MENU = {
  // Légalité → étiquette, icône de catégorie, couleur (le rouge = illégal, le gris = limite : tutorials.js le dit ainsi)
  legality: {
    legal: { tag: 'légal', icon: '⚖', color: '#7bd88f' },
    grey: { tag: 'limite', icon: '◐', color: '#b8b8c8' },
    illegal: { tag: 'illégal', icon: '⚠', color: '#ff6b5b' },
  },
  // Risque d'être vu : probabilité qu'au moins un témoin possible voie l'acte, maintenant, à cet endroit
  risk: { medium: 0.25, high: 0.55, labels: { none: 'sans risque', low: 'faible', medium: 'moyen', high: 'élevé' } },
  stats: { sleep: 'Sommeil', asso: 'Asso', dossier: 'Dossier', risk: 'Risque', job: 'Job' }, // comme src/ui/dom.js STAT_LABELS
  evidence: 'Pièce au dossier',
  maxWho: 3, // témoins nommés au plus, puis « … »
};

export const CONFIG = { RULES, DAYS, SKY, STREET, ZONES, RESTAURANTS, ANCHORS, INTERACT, NOISE, SLEEP, EVIDENCE, POLICE, WAITER, WITNESS, BUCKET, RISK, ASSO, DOG, DISGUISE, ENGINE_FLAGS, CAMPAIGN, NIGHT_MENU };
