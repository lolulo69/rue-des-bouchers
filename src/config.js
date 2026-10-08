// Règles du jeu. Tout ce qui est "réglementaire" ou "réglable" est ici, pour pouvoir le caler sur la réalité
// (arrêté municipal terrasses de Lille, AOT, etc.) et équilibrer sans toucher au code.
// Heures exprimées en minutes depuis minuit du jour de la partie (25 * 60 = 01:00 le lendemain).
// La simulation (src/sim) ne lit que ce fichier : les tests passent des variantes via makeConfig().

export const RULES = {
  terraceCloseHour: 22,          // règle propre à la rue des Bouchers depuis 2026
  lateGraceMinutes: 5,           // tolérance avant qu'une table dehors devienne une infraction "après 22h"
  maxPeoplePerTable: 6,          // spécifique à la rue des Bouchers
  nightStart: 20 * 60 + 30,      // début de partie (20:30)
  nightEnd: 25 * 60 + 30,        // fin de partie (01:30)
  gameMinutesPerSecond: 0.5,     // 1 s réelle = 30 s de jeu → ~10 min de jeu réel pour la nuit
  sleepTimeMultiplier: 12,       // accélération du temps quand Pilou essaie de dormir
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
  { id: 'bernadette', name: "Estaminet La Ch'tite Bernadette", side: -1, z0: -6, z1: 6, tables: 6, compliance: 0.2, influence: 0.6, encroachChance: 0.35, lateClear: [23 * 60, 25 * 60 + 15], color: 0x8a2b2b },
  { id: 'goulot', name: 'Le Goulot', side: 1, z0: -4, z1: 6, tables: 4, compliance: 0.6, influence: 0.15, encroachChance: 0.2, lateClear: [22 * 60 + 20, 23 * 60 + 30], color: 0x2b4a8a },
  { id: 'malunes', name: 'Les Bouchers Mal Lunés', side: -1, z0: 14, z1: 24, tables: 4, compliance: 0.45, influence: 0.35, encroachChance: 0.25, lateClear: [22 * 60 + 30, 24 * 60 + 30], color: 0x2b6a3a },
];

// Points du décor dont la simulation a besoin (géographie §1b : z < 0 = côté rue de la Barre, z > 0 = place
// Maurice-Schumann). Dans le navigateur, main.js écrase pilouWindow / streetDoor / bed / exhaust avec les valeurs
// renvoyées par buildWorld() (world.js, passe art) ; ces valeurs-ci servent aux tests et au simulateur headless.
export const ANCHORS = {
  pilouWindow: { x: -3.4, y: 8.4, z: 0 },    // 2e étage au-dessus de Bernadette
  streetDoor: { x: -2.6, y: 0, z: 5.8 },     // devant la porte de l'immeuble de Pilou
  bed: { x: -8.2, y: 7.8, z: -1.6 },         // oreille de Pilou au lit
  exhaust: { x: -2.9, y: 7.0, z: 1.0 },      // la gaine monte jusque sous sa fenêtre
  klaasWindow: { x: 0, y: 9, z: 48 },        // au bout de la rue, sur la place Maurice-Schumann, face à la rue
  balcony: { x: 3.0, y: 7.9, z: 1.5 },       // Seb & Nico, juste en face de Pilou
  waiter: { x: -0.7, z: -0.5, amplitude: 6, speed: 0.24 }, // va-et-vient devant la terrasse
  policeSpawn: { x: 0, z: -43 },
  doorways: [
    { x: -3.0, z: 5.8, label: 'la porte de Pilou', pilou: true },
    { x: 2.95, z: -12, label: 'une porte cochère en face' },
    { x: -2.95, z: 18, label: 'l\'entrée des Mal Lunés' },
    { x: 2.95, z: 11, label: 'un porche en face' },
    { x: -2.95, z: -14, label: 'la vitrine de La Bombance (fermée)' },
  ],
  standingSpots: [-10, -7, 8, 10, 12, 26, 29],  // z où se forment les groupes debout (samedi)
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
  walkInMinutes: 3,              // les agents apparaissent au bout de la rue 3 min avant d'arriver
  walkOutMinutes: 3,
  stayMinutes: 6,
  dossierWeight: 0.07,
  assoWeight: 0.2,
  influenceWeight: 0.6,
  minAct: 0.03,
  maxAct: 0.97,
  complianceAfterAct: 1,         // le resto se tient à carreau après un PV
  scandalThreshold: 2,           // pièces "police" (complaisance, tuyau) diffusées → scandale → le commissaire
  shiftChange: 23 * 60,
  roster: {
    mon: ['benali', 'lemaire'], tue: ['lemaire', 'lemaire'], wed: ['benali', 'benali'], thu: ['benali', 'lemaire'],
    fri: ['lemaire', 'lemaire'], sat: ['lemaire', 'benali'], sun: ['benali', 'benali'],
  },
  patrols: {
    lemaire: {
      name: 'Brigadier Lemaire', actBase: 0.12, delayMult: 1.3, firstCallExtra: 8,
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
  klaas: { name: 'Klaas (place Maurice-Schumann)', p: 0.9, weight: 0.5, ally: true, sleepAt: 25 * 60, near: [35, 15], far: [130, 75] },
  gaystapo: { name: 'Seb & Nico (balcon)', p: 0.7, weight: 0.3, ally: true, catLeave: [23 * 60, 24 * 60 + 30] },
  waiter: { name: 'le serveur', p: 0.6, weight: 1, ally: false },
  customers: { name: 'des clients', p: 0.25, weight: 0.8, ally: false, filmChance: 0.35, filmWeight: 0.5, wetBonus: 0.3 },
  darkFactor: 0.5,              // la nuit, dans la rue, on distingue mal une fenêtre éteinte (serveur, clients)
  saturdayCover: 0.7,            // la foule du samedi couvre : chaque client remarque moins
  riskCap: 1.6,                  // plafond de la somme des poids
};

export const BUCKET = {
  radius: 3.5,
  risk: 45,
  assoPenalty: 20,               // seulement si un allié a vu ou si une vidéo circule
  refillMinutes: 15,
};

export const RISK = { start: 0, warning: 30, complaint: 60, custody: 90 };

export const ASSO = {
  start: 50,
  shareGainPerPiece: 3,
  spamPenalty: 3,
};

export const CONFIG = { RULES, DAYS, SKY, STREET, ZONES, RESTAURANTS, ANCHORS, INTERACT, NOISE, SLEEP, EVIDENCE, POLICE, WAITER, WITNESS, BUCKET, RISK, ASSO };
