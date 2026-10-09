// Page autonome des journées (ui.html) : l'interface jour seule, nuits simulées sans 3D.
// Sert aux tests e2e et au travail sur l'UI sans lancer la rue. ?seed=N fixe la campagne, ?fresh=1 efface la sauvegarde.
import { mount, SAVE_KEY, UI_KEY } from './index.js';

const q = new URLSearchParams(location.search);
if (q.has('fresh')) { try { localStorage.removeItem(SAVE_KEY); localStorage.removeItem(UI_KEY); } catch { /* rien */ } }
if (q.has('fast')) globalThis.__rdbUiSpeed = 0;
// La 3D de jour (art.day : rue complète, bureau…) appartient au jeu ; ici, banc d'essai 2D, sauf ?artday=1
if (!q.has('artday')) globalThis.__rdbNoArtDay = true;
const seed = q.has('seed') ? Number(q.get('seed')) : undefined;
window.__rdbUi = mount({}, { seed });
