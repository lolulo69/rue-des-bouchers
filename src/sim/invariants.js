// Invariants de cohérence (GAME_DESIGN §13.G), vérifiés sur le journal d'une soirée simulée.
// Renvoie la liste des violations (vide = OK).
import { dist3, lineOfSight } from './geometry.js';

export function checkInvariants(sim) {
  const S = sim.state;
  const { WITNESS, ANCHORS, STREET, RULES } = sim.cfg;
  const J = S.journal;
  const errors = [];
  const fail = (msg, e) => errors.push(`${msg} @${e ? e.t.toFixed(1) : '?'} ${e ? JSON.stringify(e) : ''}`);

  // 1. La police n'arrive qu'après un appel (et une seule fois par appel).
  const calls = new Map();
  const arrived = new Set();
  let scheduled = 0;
  // 2. Une table rentrée ne ressort qu'après un tuyau.
  const tipped = new Map(); // tableId -> tipoffId
  const tableOut = new Map(S.tables.map((t) => [t.id, true]));
  // 4. Le Risque ne monte que sur acte vu.
  // 5. Klaas ne note que ce qu'il pouvait voir.
  const seenEvents = { tipoff: new Set(), pee: new Set() };
  for (const e of J) {
    switch (e.type) {
      case 'call': calls.set(e.callId, e); break;
      case 'police-scheduled': scheduled++; break;
      case 'police-arrive':
        // Visite planifiée (la police vient pour Pilou) : pas d'appel, mais une planification juste avant
        if (e.visit) { if (scheduled-- <= 0) fail('visite de police non planifiée', e); break; }
        if (!calls.has(e.callId) || calls.get(e.callId).ignored) fail('police sans appel', e);
        if (arrived.has(e.callId)) fail('police arrivée deux fois pour le même appel', e);
        arrived.add(e.callId);
        break;
      case 'tipoff':
        if (!calls.has(e.callId)) fail('tuyau sans appel', e);
        for (const id of e.tableIds) tipped.set(id, e.tipoffId);
        seenEvents.tipoff.add(e.tipoffId);
        break;
      case 'table-clear':
        if (!tableOut.get(e.tableId)) fail('table rentrée alors qu\'elle n\'était pas dehors', e);
        tableOut.set(e.tableId, false);
        break;
      case 'table-return':
        if (tableOut.get(e.tableId)) fail('table ressortie alors qu\'elle était dehors', e);
        if (!tipped.has(e.tableId) || tipped.get(e.tableId) !== e.tipoffId) fail('table ressortie sans tuyau', e);
        tipped.delete(e.tableId);
        tableOut.set(e.tableId, true);
        break;
      case 'pee': seenEvents.pee.add(e.peeId); break;
      case 'risk':
        if (!e.witnesses?.length) fail('Risque sans témoin', e);
        break;
      case 'klaas-note':
        if (e.t >= WITNESS.klaas.sleepAt) fail('Klaas note en dormant', e);
        if (!lineOfSight(ANCHORS.klaasWindow, e.pos, STREET.halfWidth) || dist3(ANCHORS.klaasWindow, e.pos) > Math.max(...WITNESS.klaas.far, WITNESS.klaas.binoculars.far)) fail('Klaas note ce qu\'il ne peut pas voir', e);
        break;
      case 'evidence': {
        // 3. Une preuve renvoie à un fait réel.
        if (e.tableId) {
          if (!tableOut.get(e.tableId)) fail('photo d\'une table rentrée', e);
          if (e.kind === 'late' && e.t < sim.late) fail('preuve "après 22h" avant l\'heure', e);
        }
        if (e.evType === 'complaisance' && !arrived.has(e.callId)) fail('complaisance sans passage de police', e);
        if (e.evType === 'tipoff' && !seenEvents.tipoff.has(e.tipoffId)) fail('tuyau inventé', e);
        if (e.kind === 'pee' && !seenEvents.pee.has(e.peeId)) fail('pipi inventé', e);
        if (e.byKlaas && !J.some((k) => k.type === 'klaas-note' && k.t === e.t)) fail('preuve de Klaas sans note', e);
        break;
      }
      default:
    }
  }
  // Valeurs des preuves cohérentes avec l'état final des tables.
  for (const ev of S.evidence) {
    if (ev.kind === 'over' && !(ev.count > RULES.maxPeoplePerTable)) fail(`preuve "plus de ${RULES.maxPeoplePerTable}" sans dépassement`, { t: ev.time, ...ev });
    if (ev.kind === 'corridor' && !(ev.encroach > 0)) fail('preuve de débordement sans débordement', { t: ev.time, ...ev });
  }
  if (S.risk > (S.riskStart ?? 0) && !J.some((e) => e.type === 'risk')) fail('Risque en hausse sans acte vu', null);
  return errors;
}
