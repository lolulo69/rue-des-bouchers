// Règles du jeu. Tout ce qui est "réglementaire" est ici pour pouvoir le caler sur la réalité
// (arrêté municipal terrasses de Lille, AOT, etc.). Valeurs marquées TODO = à confirmer.

export const RULES = {
  terraceCloseHour: 22,          // heure de fermeture des terrasses
  maxPeoplePerTable: 6,          // TODO: limite réelle par table en terrasse
  nightStart: 20 * 60 + 30,      // début de partie, en minutes depuis minuit (20:30)
  nightEnd: 25 * 60 + 30,        // fin de partie (01:30)
  gameMinutesPerSecond: 0.5,     // 1 seconde réelle = 30 secondes de jeu → ~10 min la nuit
};

export const RESTAURANTS = [
  // compliance: probabilité de respecter l'heure de fermeture
  // influence: capacité à "arranger" les choses avec la police municipale
  { id: 'brigitte', name: "La Ch'tite Brigitte", side: -1, z0: -6, z1: 6, tables: 6, compliance: 0.25, influence: 0.45, color: 0x8a2b2b },
  { id: 'estaminet', name: "L'Estaminet d'en face", side: 1, z0: -4, z1: 6, tables: 4, compliance: 0.6, influence: 0.15, color: 0x2b4a8a },
  { id: 'pizzeria', name: 'Pizzeria du Vieux', side: -1, z0: 14, z1: 24, tables: 4, compliance: 0.5, influence: 0.2, color: 0x2b7a3a },
];

export const STREET = { halfWidth: 3.2, length: 90 };
