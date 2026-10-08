// Bilan de fin de nuit : données pures, mises en forme par main.js.
import { fmt } from './time.js';

const OUTCOME = {
  act: 'PV', complaisance: 'café offert, 0 PV', nothing: 'rien à signaler', tipoff: 'tout rangé juste avant (tuyau ?)',
  ignored: '« c’est encore vous », personne',
};
const BY = { police: 'la police', waiter: 'le serveur', bucket: 'le seau', tipoff: 'un tuyau' };

export function buildSummary(sim) {
  const S = sim.state;
  const { EVIDENCE, RISK, POLICE } = sim.cfg;
  const reason = S.endReason ?? 'time';
  const score = sim.dossierScore();
  const restaurants = sim.restaurants.map((r) => {
    const ts = S.tables.filter((t) => t.restId === r.id);
    const cleared = ts.filter((t) => t.clearedAt !== null);
    return {
      name: r.name,
      total: ts.length,
      onTime: cleared.filter((t) => t.clearedAt < sim.late && t.clearedBy === 'resto').length,
      by: Object.entries(BY).map(([k, label]) => [label, ts.filter((t) => t.clearedBy === k).length]).filter(([, n]) => n),
      stillOut: ts.filter((t) => t.out).length,
      last: cleared.length ? fmt(Math.max(...cleared.map((t) => t.clearedAt))) : null,
    };
  });
  const police = S.policeLog.map((p) => ({
    called: fmt(p.calledAt), arrived: p.arrivedAt ? fmt(p.arrivedAt) : null, rest: p.rest, patrol: p.patrol,
    asso: p.asso, outcome: OUTCOME[p.outcome], detail: p.detail,
  }));
  if (S.police && !S.policeLog.some((p) => p.callId === S.police.callId)) {
    police.push({ called: fmt(S.police.calledAt), arrived: null, outcome: 'la patrouille n’est jamais arrivée' });
  }
  const shifts = (POLICE.roster[sim.day.key] ?? POLICE.roster.mon).map((id) => POLICE.patrols[id].name);

  const verdict = [];
  const ratio = score / EVIDENCE.dossierTarget;
  if (reason === 'custody') verdict.push('Le seau d’eau de trop. Pilou passe la nuit au commissariat. Klaas a tout noté.');
  else if (reason === 'sleep') verdict.push('Sommeil à zéro. Pilou cherche un appart à Wazemmes. « Au moins au marché de Wazemmes, le bruit c’est le matin. »');
  else if (ratio >= 0.75) verdict.push('Dossier solide. La commission du jour 14 va devoir l’écouter.');
  else if (ratio >= 0.35) verdict.push('Ça avance. Il faudra plus de preuves pour la commission.');
  else verdict.push('Pas grand-chose à montrer à la commission. Demain, sortez l’appareil photo.');
  if (reason !== 'custody') {
    if (S.risk >= RISK.complaint) verdict.push('Dédé a porté plainte. Ça va revenir.');
    else if (S.risk >= RISK.warning) verdict.push('Une vidéo de la fenêtre circule sur les réseaux.');
  }
  if (S.scandal) verdict.push('La hiérarchie de la police municipale s’intéresse aux cafés offerts. Lemaire transpire.');
  if (S.blocKnows) verdict.push('Le bloc sait que c’est vous qui appelez au nom de l’Association.');
  if (S.asso < 30) verdict.push('L’Association prend ses distances.');

  return {
    reason,
    time: fmt(S.min),
    dayLabel: sim.day.label,
    stats: { sleep: Math.round(S.sleep), asso: Math.round(S.asso), risk: Math.round(S.risk) },
    dossier: { score, target: EVIDENCE.dossierTarget, pieces: S.evidence.length },
    waiter: { asks: S.waiterAsks.length, ok: S.waiterAsks.filter((a) => a.ok).length },
    bucketUses: S.bucketUses,
    mairie: S.mairieSent,
    restaurants,
    police,
    shifts,
    witnesses: S.witnessMemories.map((w) => ({ time: fmt(w.time), name: w.name, act: w.act, filmed: w.filmed })),
    verdict,
  };
}
