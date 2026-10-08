// Horaires des petits moments de vie que la simulation ne modélise pas (purement visuels).
// Minutes depuis minuit (25 * 60 = 01:00). [OPEN] si le gameplay veut en tenir compte (témoins), la sim peut lire ces fenêtres.
export const WAITER_BREAKS = [[21 * 60 + 12, 21 * 60 + 18], [22 * 60 + 24, 22 * 60 + 30], [23 * 60 + 36, 23 * 60 + 42], [24 * 60 + 30, 24 * 60 + 38]];
export const GHISLAIN_CLEAN = [[20 * 60 + 34, 20 * 60 + 50]];
export const FILM_MINUTES = 4; // les clients filment ~4 min de jeu après un acte vu et filmé
// id de patrouille de la sim → personnage de l'art
export const PATROL_CAST = { lemaire: 'lemaire', benali: 'benali', chief: 'chef' };
export const inWindow = (min, windows) => windows.some(([a, b]) => min >= a && min < b);
