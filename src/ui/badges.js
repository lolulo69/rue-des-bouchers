// Pastilles de nouveautés (téléphone, Carnet) — GAME_DESIGN §12c.3 : ne compter que ce qui est vraiment nouveau
// et jamais vu, et tout effacer quand on ouvre. Les « vus » sont dans la sauvegarde, sous un espace propre à l'UI :
// c.state.uiSeen = { phone: [ids], carnet: [clés], init } (le moteur le recopie tel quel dans save()).
import { phoneHistory } from './phone.js';
import { CARNET_TABS, carnetEntries } from './codex.js';

export function seenOf(c) {
  const S = c.state;
  S.uiSeen ??= { phone: [], carnet: [], init: false };
  // Début de campagne : les fiches du Carnet connues d'emblée (sans `when`) ne sont pas des nouveautés
  if (!S.uiSeen.init) {
    S.uiSeen.init = true;
    S.uiSeen.carnet = [...new Set([...S.uiSeen.carnet, ...carnetKeys(c, { startOnly: true })])];
  }
  return S.uiSeen;
}

// Téléphone : tout ce qui est arrivé (messages reçus, répliques entendues), tous fils confondus
export const phoneUnread = (c, meta) => { const seen = new Set(seenOf(c).phone); return phoneHistory(c, meta).filter((m) => !seen.has(m.id)); };
export function markPhoneSeen(c, meta) {
  const s = seenOf(c);
  s.phone = [...new Set([...s.phone, ...phoneHistory(c, meta).map((m) => m.id)])];
}

// Carnet : chaque fiche visible et chacune de ses mises à jour visibles, tous onglets confondus
export function carnetKeys(c, { startOnly = false } = {}) {
  const keys = [];
  for (const t of CARNET_TABS) {
    for (const e of carnetEntries(c, t.id)) {
      if (startOnly && e.card.when) continue;
      keys.push(e.key);
      for (const u of e.updates) if (!startOnly || !u.when) keys.push(u.key);
    }
  }
  return keys;
}
export const carnetUnread = (c) => { const seen = new Set(seenOf(c).carnet); return carnetKeys(c).filter((k) => !seen.has(k)); };
// Ouvre le Carnet : renvoie ce qui était déjà vu (pour les étiquettes « nouveau »), puis marque tout comme vu
export function openCarnet(c) {
  const s = seenOf(c);
  const before = new Set(s.carnet);
  s.carnet = [...new Set([...s.carnet, ...carnetKeys(c)])];
  return before;
}
