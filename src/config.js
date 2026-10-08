// Règles du jeu. Tout ce qui est "réglementaire" ou "réglable" est ici, pour pouvoir le caler sur la réalité
// (arrêté municipal terrasses de Lille, AOT, etc.) et équilibrer sans toucher au code.
// Heures exprimées en minutes depuis minuit du jour de la partie (25 * 60 = 01:00 le lendemain).

export const RULES = {
  terraceCloseHour: 22,          // heure de fermeture des terrasses (voir [CHECK] du GAME_DESIGN)
  lateGraceMinutes: 5,           // tolérance avant qu'une table dehors devienne une infraction "après 22h"
  maxPeoplePerTable: 6,          // spécifique à la rue des Bouchers
  overLimitChance: 0.4,          // probabilité qu'une table soit au-dessus de la limite
  nightStart: 20 * 60 + 30,      // début de partie (20:30)
  nightEnd: 25 * 60 + 30,        // fin de partie (01:30)
  gameMinutesPerSecond: 0.5,     // 1 s réelle = 30 s de jeu → ~10 min de jeu réel pour la nuit
  sleepTimeMultiplier: 12,       // accélération du temps quand Pilou essaie de dormir
  dayLabel: 'Lundi · nuit 1',
};

// Ciel : crépuscule → nuit
export const SKY = {
  duskStart: 20 * 60 + 30,
  nightFull: 22 * 60 + 15,
};

export const RESTAURANTS = [
  // compliance : probabilité de rentrer la terrasse à l'heure
  // influence  : capacité à "arranger" les choses avec la police municipale
  // lateClear  : fenêtre [min, max] où une terrasse non conforme finit par rentrer
  { id: 'bernadette', name: "Estaminet La Ch'tite Bernadette", short: 'Bernadette', side: -1, z0: -6, z1: 6, tables: 6, compliance: 0.2, influence: 0.6, lateClear: [23 * 60, 25 * 60 + 15], color: 0x8a2b2b },
  { id: 'goulot', name: 'Le Goulot', short: 'Le Goulot', side: 1, z0: -4, z1: 6, tables: 4, compliance: 0.6, influence: 0.15, lateClear: [22 * 60 + 20, 23 * 60 + 30], color: 0x2b4a8a },
  { id: 'malunes', name: 'Les Bouchers Mal Lunés', short: 'Mal Lunés', side: -1, z0: 14, z1: 24, tables: 4, compliance: 0.45, influence: 0.35, lateClear: [22 * 60 + 30, 24 * 60 + 30], color: 0x2b6a3a },
];

export const STREET = { halfWidth: 3.2, length: 90 };

// Bruit (dB). Chaque source : niveau à 1 m, atténuation géométrique 20·log10(d).
export const NOISE = {
  ambientDb: 36,
  personDb: 58,                  // une personne attablée qui parle fort en terrasse
  lateBoostDb: 3,                // après lateBoostAfter (ça boit)
  lateBoostAfter: 22 * 60,
  drunkBoostDb: 3,               // en plus, après drunkAfter
  drunkAfter: 23 * 60,
  clatterDb: 80,                 // chaises métalliques traînées sur les pavés au rangement
  clatterSeconds: 2.5,           // durée réelle du fracas
  exhaustDb: 64,                 // la hotte, à 1 m de la sortie
  exhaustOffMinute: 23 * 60 + 30,// la cuisine ferme, la hotte s'arrête
  indoorAttenuationDb: 8,        // fenêtre ouverte (l'été, pas le choix)
  hudMinDb: 30,
  hudMaxDb: 90,
};

export const SLEEP = {
  start: 100,
  drainAfter: 22 * 60,           // le bruit ne compte qu'après 22:00
  thresholdDb: 35,               // niveau mesuré au lit au-delà duquel le sommeil fond
  drainPerDbMinute: 0.02,        // perte par dB au-dessus du seuil et par minute de jeu
  exhaustDrainPerMinute: 0.04,   // odeur de la hotte, tant qu'elle tourne
  recoverPerMinute: 0.25,        // au lit, quand c'est calme
};

export const EVIDENCE = {
  photoRange: 35,                // portée du raycast photo (m)
  sharpRange: 18,                // au-delà, la photo est moins nette
  overLimitValue: 1,             // valeur d'une photo "plus de 6 à table"
  lateValue: 1,                  // valeur d'une photo "table dehors après 22h"
  complaisanceValue: 2,          // police venue, café offert, 0 PV
  mairieValue: 0.5,              // signalement mairie envoyé avec pièces jointes
  dossierTarget: 12,             // score qui remplit la barre "Dossier"
  minQuality: 0.4,               // qualité plancher (sommeil bas = photos floues)
};

export const POLICE = {
  delayMin: 10,                  // minutes de jeu avant l'arrivée
  delayMax: 22,
  delayPerExtraCall: 0.5,        // +50 % de délai par appel supplémentaire
  maxCalls: 3,                   // au-delà : "Ah, c'est encore vous" → ils ne viennent plus
  stayMinutes: 6,
  walkSpeed: 2.2,                // m/s réels
  baseAct: 0.3,                  // probabilité de base de verbaliser
  dossierWeight: 0.07,           // par point de dossier sur ce resto
  assoWeight: 0.2,               // × soutien asso / 100
  influenceWeight: 0.6,          // × influence du resto
  complianceAfterAct: 1,         // le resto se tient à carreau après un PV
};

export const WAITER = {
  base: 0.15,
  complianceWeight: 0.5,
  assoWeight: 0.25,
  cooldownMinutes: 10,
  range: 2.2,
};

export const BUCKET = {
  radius: 3.5,                   // tables touchées autour de l'aplomb de la fenêtre (m, axe de la rue)
  risk: 45,
  assoPenalty: 20,
  refillMinutes: 15,
};

export const RISK = { start: 0, warning: 30, complaint: 60, custody: 90 };

export const ASSO = {
  start: 50,
  shareGainPerPiece: 3,          // par pièce partagée sur le groupe WhatsApp
  spamPenalty: 3,                // message sans photo
};
