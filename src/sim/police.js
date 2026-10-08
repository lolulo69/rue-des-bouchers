// Police municipale : patrouilles à personnalité, roster caché, tuyau, "c'est encore vous", complaisance.
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function patrolOnDuty(sim) {
  const { POLICE } = sim.cfg;
  const S = sim.state;
  if (S.scandal) return 'chief';
  const shift = POLICE.roster[sim.day.key] ?? POLICE.roster.mon;
  const id = shift[S.min < POLICE.shiftChange ? 0 : 1];
  return id === 'benali' && S.benaliTransferred ? 'lemaire' : id;
}

export function callPolice(sim, { asso = false } = {}) {
  const { POLICE } = sim.cfg;
  const S = sim.state;
  if (S.police) {
    sim.log('Police : « Une patrouille est déjà en route, monsieur. »');
    return { ok: false, reason: 'busy' };
  }
  S.calls++;
  if (asso) {
    S.blocKnows = true;
    S.hostility = clamp(S.hostility + POLICE.assoHostility, 0, 100);
  }
  const callId = S.calls;
  if (S.calls > POLICE.maxCalls) {
    S.serialComplainer = true;
    sim.note('call', { callId, asso, ignored: true });
    S.policeLog.push({ callId, calledAt: S.min, asso, outcome: 'ignored' });
    sim.log('Police : « Ah, c\'est encore vous… On note, monsieur. » Personne ne viendra.', 'bad');
    return { ok: false, reason: 'ignored' };
  }
  const patrolId = patrolOnDuty(sim);
  const patrol = POLICE.patrols[patrolId];
  // La patrouille va vers le resto qui a le plus d'infractions au moment de l'appel (Bernadette en cas d'égalité)
  const rest = [...sim.restaurants].sort((a, b) => sim.infractions(b.id).length - sim.infractions(a.id).length)[0];
  const firstCall = !S.policeLog.some((p) => p.outcome !== 'ignored');
  const delay = sim.rng.range(POLICE.delayMin, POLICE.delayMax) * patrol.delayMult
    * (1 + POLICE.delayPerExtraCall * (S.calls - 1)) * (asso ? POLICE.assoDelayMult : 1)
    + (firstCall ? patrol.firstCallExtra : 0);
  const arriveAt = S.min + delay;
  const tipoffP = patrol.tipoff[rest.id] ?? patrol.tipoff.default;
  sim.note('call', { callId, asso, patrolId });
  S.police = {
    callId, patrolId, patrolName: patrol.name, restId: rest.id, calledAt: S.min, asso,
    enterAt: Math.max(S.min, arriveAt - POLICE.walkInMinutes), arriveAt, leaveAt: null, exitAt: null,
    phase: 'pending',
    tipoffAt: sim.rng.chance(tipoffP) ? Math.max(S.min, arriveAt - patrol.tipoffLead) : null,
    tipped: [],
  };
  sim.log(asso
    ? 'Police : « Ah, pour l\'Association… On fait au plus vite. » (Le bloc saura qui a appelé.)'
    : `Police municipale : « On envoie quelqu'un. » (appel n°${S.calls})`);
  return { ok: true, police: S.police };
}

function tipoff(sim, P) {
  const { POLICE } = sim.cfg;
  const patrol = POLICE.patrols[P.patrolId];
  const returnAt = P.arriveAt + POLICE.stayMinutes + sim.rng.range(...patrol.tipoffReturn);
  for (const t of sim.infractions(P.restId)) {
    sim.clearTable(t, 'tipoff', { silent: true });
    t.hiddenUntil = returnAt;
    P.tipped.push(t.id);
  }
  if (P.tipped.length) {
    const tip = { id: sim.state.tipoffs.length + 1, callId: P.callId, restId: P.restId, tableIds: [...P.tipped], tippedAt: sim.state.min, arrivedAt: P.arriveAt, returnAt, returned: null };
    sim.state.tipoffs.push(tip);
    sim.note('tipoff', { tipoffId: tip.id, callId: P.callId, restId: P.restId, tableIds: tip.tableIds });
    sim.log(`Tiens ? ${sim.rest(P.restId).name} rentre ${P.tipped.length} table(s) d'un coup…`);
  }
}

function resolve(sim, P) {
  const { POLICE, EVIDENCE, RULES } = sim.cfg;
  const S = sim.state;
  const rest = sim.rest(P.restId);
  const inf = sim.infractions(rest.id);
  sim.note('police-arrive', { callId: P.callId, restId: rest.id, patrolId: P.patrolId });
  const entry = { callId: P.callId, calledAt: P.calledAt, arrivedAt: S.min, restId: rest.id, rest: rest.name, patrolId: P.patrolId, patrol: P.patrolName, asso: P.asso };
  S.policeLog.push(entry);
  if (!inf.length) {
    entry.outcome = P.tipped.length ? 'tipoff' : 'nothing';
    sim.log(`${P.patrolName} devant ${rest.name} : « Tout est en ordre ici, monsieur. »${P.tipped.length ? ' Comme par hasard.' : ''}`);
    return entry;
  }
  const p = clamp(
    POLICE.patrols[P.patrolId].actBase + POLICE.dossierWeight * sim.dossierScore(rest.id) + POLICE.assoWeight * (S.asso / 100)
      - POLICE.influenceWeight * rest.influence - POLICE.fatiguePerCall * (S.calls - 1),
    POLICE.minAct, POLICE.maxAct,
  );
  entry.pAct = p;
  if (sim.rng.chance(p)) {
    entry.outcome = 'act';
    let cleared = 0, trimmed = 0, moved = 0;
    for (const t of inf) {
      if (sim.isLate()) { t.clearAt = S.min + 0.5 + cleared * 0.8; t.pendingBy = 'police'; cleared++; continue; }
      if (t.count > RULES.maxPeoplePerTable) { t.count = RULES.maxPeoplePerTable; trimmed++; }
      if (sim.encroachment(t) > 0) { t.x = Math.sign(t.x) * sim.legalX(); moved++; }
    }
    rest.compliance = Math.max(rest.compliance, POLICE.complianceAfterAct);
    for (const t of S.tables) if (t.restId === rest.id && t.out && t.clearAt > sim.close) t.clearAt = Math.max(S.min + 1, sim.close);
    entry.detail = [cleared && `${cleared} table(s) rentrée(s)`, trimmed && `${trimmed} ramenée(s) à ${RULES.maxPeoplePerTable}`, moved && `${moved} recalée(s) hors du passage`].filter(Boolean).join(', ');
    sim.log(`PV pour ${rest.name} (${P.patrolName}) : ${entry.detail}.`, 'good');
    if (P.patrolId === 'benali' && ++S.benaliActs >= POLICE.patrols.benali.transferAfterActs && !S.benaliTransferred) {
      S.benaliTransferred = true;
      sim.log('Rumeur : l\'agent Benali serait muté. « Trop zélé. »', 'bad');
    }
  } else {
    entry.outcome = 'complaisance';
    // Consigné seulement si quelqu'un l'a vu : Klaas depuis sa fenêtre, ou Pilou s'il ne dort pas.
    const pos = sim.restCenter(rest);
    const byKlaas = sim.klaasCanSee(pos);
    if (byKlaas || !S.sleeping) {
      if (byKlaas) sim.note('klaas-note', { about: 'complaisance', pos });
      sim.addEvidence({
        type: 'complaisance', restId: rest.id, callId: P.callId, quality: 1, value: EVIDENCE.complaisanceValue, byKlaas, pos,
        text: `${P.patrolName} chez ${rest.name} : café offert, 0 PV (${inf.length} infraction(s) visibles)${byKlaas ? ' · noté par Klaas' : ''}`,
      });
      sim.log(`${P.patrolName} prend un café chez ${rest.name}… 0 PV. Noté dans le dossier (complaisance).`, 'bad');
    } else {
      sim.log(`${P.patrolName} prend un café chez ${rest.name}… et personne n'était là pour le noter.`, 'bad');
    }
  }
  return entry;
}

export function updatePolice(sim) {
  const { POLICE } = sim.cfg;
  const S = sim.state;
  const P = S.police;
  if (!P) return;
  if (P.phase === 'pending' && P.tipoffAt !== null && !P.tipoffDone && S.min >= P.tipoffAt) {
    P.tipoffDone = true;
    tipoff(sim, P);
  }
  if (P.phase === 'pending' && S.min >= P.enterAt) {
    P.phase = 'walking';
    sim.log('Une patrouille entre dans la rue.');
  }
  if (P.phase === 'walking' && S.min >= P.arriveAt) {
    resolve(sim, P);
    P.phase = 'onsite';
    P.leaveAt = S.min + POLICE.stayMinutes;
  }
  if (P.phase === 'onsite' && S.min >= P.leaveAt) {
    P.phase = 'leaving';
    P.exitAt = S.min + POLICE.walkOutMinutes;
  }
  if (P.phase === 'leaving' && S.min >= P.exitAt) S.police = null;
}
