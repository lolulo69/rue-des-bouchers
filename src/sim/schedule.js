// Présences programmées de la nuit (source de vérité pour la scène 3D ET pour les témoins) :
// pauses clope du serveur, Ghislain sur son escabeau, trajet de la patrouille. Minutes depuis minuit.
// La config peut les surcharger : makeConfig({ SCHEDULE: { waiterBreaks: [...] } }).
export const SCHEDULE = {
  waiterBreaks: [[21 * 60 + 12, 21 * 60 + 18], [22 * 60 + 24, 22 * 60 + 30], [23 * 60 + 36, 23 * 60 + 42], [24 * 60 + 30, 24 * 60 + 38]],
  ghislainClean: [[20 * 60 + 34, 20 * 60 + 50]],
  smokeSpot: { wallGap: 0.5, dz: 4.4 }, // sous le store de l'estaminet, près de la porte de l'immeuble de Pilou
  patrolSpacing: 0.4, // les deux agents marchent côte à côte
};

export const inWindow = (min, windows) => windows.some(([a, b]) => min >= a && min < b);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Où se trouve le serveur pendant sa pause (contre la façade de l'estaminet)
export function smokeSpot(cfg) {
  const S = cfg.SCHEDULE ?? SCHEDULE;
  const b = cfg.RESTAURANTS.find((r) => r.id === 'bernadette') ?? cfg.RESTAURANTS[0];
  return { x: b.side * (cfg.STREET.halfWidth - S.smokeSpot.wallGap), z: (b.z0 + b.z1) / 2 + S.smokeSpot.dz };
}

// Positions des deux agents de la patrouille en cours (ou de la visite pour Pilou), [] si personne dans la rue.
// → [{ x, z, heading, moving }] : la 3D les place là, et rien d'autre.
export function patrolPositions(sim) {
  const S = sim.state, P = S.police, cfg = sim.cfg;
  const sp = (cfg.SCHEDULE ?? SCHEDULE).patrolSpacing;
  if (P && P.phase !== 'pending') {
    const r = sim.rest(P.restId);
    const spawn = cfg.ANCHORS.policeSpawn;
    return [-sp, sp].map((dx) => {
      let a = { x: spawn.x + dx, z: spawn.z }, b = { x: r.side * sp + dx, z: (r.z0 + r.z1) / 2 }, k = 1;
      if (P.phase === 'walking') k = (S.min - P.enterAt) / Math.max(0.01, P.arriveAt - P.enterAt);
      if (P.phase === 'leaving') { [a, b] = [b, a]; k = (S.min - P.leaveAt) / Math.max(0.01, P.exitAt - P.leaveAt); }
      k = clamp(k, 0, 1);
      const moving = k < 1;
      return { x: a.x + (b.x - a.x) * k, z: a.z + (b.z - a.z) * k, heading: moving ? Math.atan2(b.x - a.x, b.z - a.z) : r.side < 0 ? -Math.PI / 2 : Math.PI / 2, moving };
    });
  }
  if (S.visit?.phase === 'onsite') { // la police vient pour Pilou : devant sa porte
    const d = cfg.ANCHORS.streetDoor;
    return [-0.5, 0.5].map((dz) => ({ x: d.x + 0.9, z: d.z + dz, heading: -Math.PI / 2, moving: false }));
  }
  return [];
}
