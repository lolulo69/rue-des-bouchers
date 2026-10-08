// Invariants de campagne (GAME_DESIGN §13.G), vérifiés sur le journal après chaque campagne simulée.
// Les invariants de nuit (police, tables, preuves, Risque, carnet de Klaas) sont vérifiés nuit par nuit (invariants.js).
const ORDER = ['morning', 'afternoon', 'night'];

export function checkCampaignInvariants(c) {
  const S = c.state;
  const C = c.cfg.CAMPAIGN;
  const K = c.content;
  const errors = [];
  const fail = (msg, e) => errors.push(`${msg} ${e ? JSON.stringify(e) : ''}`);
  const events = Object.fromEntries(K.EVENTS.map((e) => [e.id, e]));
  let day = 0;
  let phaseIdx = -1;
  for (const e of S.journal) {
    // Le temps avance dans l'ordre : jour après jour, matin → après-midi → nuit (personne n'est à deux endroits à la fois)
    if (e.type === 'day') {
      if (e.day !== day + 1) fail('jour sauté ou répété', e);
      day = e.day;
      phaseIdx = -1;
    }
    if (e.day !== day) fail('entrée hors de son jour', e);
    if (e.type === 'phase') {
      const i = ORDER.indexOf(e.phase);
      if (i !== phaseIdx + 1) fail('phases dans le désordre', e);
      phaseIdx = i;
    }
    if (e.type === 'action' && (e.night ? e.phase !== 'night' : e.phase !== 'afternoon')) fail('action hors de sa phase', e);
    // Les événements fixes ont lieu leur jour, dans leur phase
    if (e.type === 'event' && events[e.id]?.day !== undefined) {
      const ev = events[e.id];
      if (ev.day !== e.day || (ev.phase ?? 'afternoon') !== e.phase) fail('événement fixe hors de son jour', e);
    }
    // Le Risque ne monte que sur acte vu (nuit, découverte d'un side project, action vue) ou par l'histoire (plainte du bloc…)
    if (e.type === 'effects' && e.deltas?.risk > 0 && !['witnessed', 'story'].includes(e.cause)) fail('Risque sans témoin', e);
    // Fins anticipées verrouillées avant la nuit 5
    if (e.type === 'ending' && e.early && e.day < C.earlyFromDay) fail('fin anticipée avant la nuit 5', e);
    // Une preuve renvoie à un fait réel : une pièce de la nuit, ou un contenu existant
    if (e.type === 'evidence' && !e.night && e.source && !String(e.source).split('#')[0].split(':')[0]
      .split(',').every((id) => K.ACTIONS.some((a) => a.id === id) || events[id] || K.COUNTERMOVES.some((m) => m.id === id) || K.DIALOGUE.some((d) => d.id === id) || K.KODDEX.sideProjects.some((p) => p.id === id) || (K.WORKDAYS?.home?.distractions ?? []).some((d) => d.id === id) || String(id).includes('commute') || (K.TWISTS ?? []).some((t) => `twist:${t.id}` === id || t.id === id))) {
      fail('preuve sans source', e);
    }
  }
  // Une nuit par jour joué, ni plus ni moins
  const nights = S.journal.filter((e) => e.type === 'night-end').map((e) => e.day);
  if (new Set(nights).size !== nights.length) fail('deux nuits le même jour', nights);
  // Le Risque final ne dépasse pas le plafond avant la nuit 5
  if (S.day < C.earlyFromDay && S.stats.risk > C.preGate.riskCap) fail('Risque au-delà du plafond avant la nuit 5', S.stats);
  if (S.step !== 'ended') fail('campagne non terminée', { step: S.step });
  return errors;
}
