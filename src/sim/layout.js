// Terrasses et foule de la soirée, tirées au sort avec le RNG de la partie.
export function generateLayout(cfg, rng, day) {
  const { STREET, ZONES, RULES, RESTAURANTS, ANCHORS } = cfg;
  const W = STREET.halfWidth;
  const close = RULES.terraceCloseHour * 60;
  const max = RULES.maxPeoplePerTable;
  const tables = [];
  for (const r of RESTAURANTS) {
    const n = r.tables + day.extraTables;
    const step = (r.z1 - r.z0) / n;
    for (let i = 0; i < n; i++) {
      const over = rng.chance(day.overLimitChance);
      const count = over ? max + rng.int(1, 3) : Math.min(max, rng.int(2, max) + day.extraPeople);
      // Dans la zone : collée à la façade. Débordement : le bord intérieur mord sur le couloir.
      const encroach = rng.chance(r.encroachChance) ? rng.range(...ZONES.encroach) : 0;
      const absX = encroach
        ? ZONES.corridorHalfWidth - encroach + ZONES.tableFootprint
        : W - ZONES.wallGap - ZONES.tableFootprint;
      const onTime = rng.chance(r.compliance);
      tables.push({
        id: `${r.id}-${i + 1}`,
        restId: r.id,
        label: `${r.name}, table ${i + 1}`,
        x: r.side * absX,
        z: r.z0 + step * (i + 0.5),
        count,
        out: true,
        clearAt: onTime ? close - 5 + rng.range(0, 5 + RULES.lateGraceMinutes) : rng.range(...r.lateClear),
        clearedAt: null,
        clearedBy: null,
        pendingBy: null,
        hiddenUntil: null,       // rentrée par un tuyau de la police : ressort à cette heure
        evidence: new Set(),
      });
    }
  }

  const standing = [];
  const spots = [...ANCHORS.standingSpots];
  for (let i = 0; i < day.standingGroups && spots.length; i++) {
    const z = spots.splice(rng.int(0, spots.length - 1), 1)[0];
    standing.push({
      id: `debout-${i + 1}`,
      x: rng.range(-0.8, 0.8),
      z,
      size: rng.int(...day.standingSize),
      arriveAt: rng.range(RULES.nightStart, close),
      leaveAt: rng.range(...day.standingLeave),
    });
  }
  return { tables, standing };
}
