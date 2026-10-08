// Bots de stratégie (GAME_DESIGN §13.H). Interface : { name, decide(sim) → actions[] }, appelée à chaque tick.
// Le bot lit sim (lecture seule) et renvoie des actions au même format que le joueur (sim.act).
// Pas de déplacement en headless : un bot "est" là où l'action a du sens (dans la rue pour mesurer, à la fenêtre pour le seau).

const every = (period) => { let next = -Infinity; return (min) => (min >= next ? ((next = min + period), true) : false); };

function photographInfractions(sim) {
  const acts = [];
  for (const t of sim.state.tables) {
    const kinds = sim.tableInfractions(t).filter((k) => !t.evidence.has(k));
    if (kinds.length) acts.push({ type: 'photo', target: { kind: 'table', id: t.id }, distance: 3, fromWindow: false });
  }
  for (const p of sim.activePees()) if (!p.photographed) acts.push({ type: 'photo', target: { kind: 'pee', id: p.id }, distance: 6 });
  return acts;
}

export const passive = () => ({ name: 'passif', decide: () => [] });

// Légal et prudent : photos, police (au nom de l'asso ou non), serveur, WhatsApp, mairie, puis dodo.
export function legal({ asso = false } = {}) {
  const shoot = every(5);
  const S = { policeCalls: 0, shared: false };
  return {
    name: asso ? 'légal (au nom de l’asso)' : 'légal',
    decide(sim) {
      const st = sim.state;
      const acts = [];
      if (st.sleeping) return acts;
      if (shoot(st.min)) acts.push(...photographInfractions(sim));
      const anyInfraction = sim.restaurants.some((r) => sim.infractions(r.id).length);
      if (sim.isLate() && !st.police && anyInfraction && S.policeCalls < 2 && st.min >= sim.late + 5 + S.policeCalls * 60) {
        S.policeCalls++;
        acts.push({ type: 'police', asso });
      }
      if (sim.isLate() && st.min >= st.waiterReadyAt && sim.infractions('bernadette').length) acts.push({ type: 'waiter' });
      if (st.min >= 22.5 * 60 && !S.shared) { S.shared = true; acts.push({ type: 'asso' }); }
      if (st.min >= 23.75 * 60 && !st.mairieSent) acts.push({ type: 'asso' }, { type: 'mairie' });
      if (st.min >= 24.25 * 60) acts.push({ type: 'sleep', on: true });
      return acts;
    },
  };
}

// Illégal et imprudent : le seau dès qu'il est plein et qu'il y a des tables dessous.
export function reckless() {
  return {
    name: 'seau (imprudent)',
    decide(sim) {
      const st = sim.state;
      if (st.min >= st.bucketReadyAt && st.min >= 21 * 60 && tablesBelow(sim)) return [{ type: 'bucket' }];
      return [];
    },
  };
}

// Illégal et discret : le seau seulement quand personne ne peut voir la fenêtre.
export function stealthy() {
  return {
    name: 'seau (discret)',
    decide(sim) {
      const st = sim.state;
      if (st.min < st.bucketReadyAt || !tablesBelow(sim)) return [];
      // Attend que Klaas dorme, que le chat soit rentré et que le serveur soit parti : ne restent que des clients, dans le noir.
      return sim.potentialWitnesses(sim.cfg.ANCHORS.pilouWindow).some((w) => w.kind !== 'customers') ? [] : [{ type: 'bucket' }];
    },
  };
}

function tablesBelow(sim) {
  const w = sim.cfg.ANCHORS.pilouWindow;
  return sim.state.tables.some((t) => t.out && Math.sign(t.x) === Math.sign(w.x) && Math.abs(t.z - w.z) < sim.cfg.BUCKET.radius);
}

export const POLICIES = { passive, legal, legalAsso: () => legal({ asso: true }), reckless, stealthy };
