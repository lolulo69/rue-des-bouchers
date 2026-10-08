export const flatDist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
export const dist3 = (a, b) => Math.hypot(a.x - b.x, (a.y ?? 0) - (b.y ?? 0), a.z - b.z);

// La rue est un canyon : deux points collés à la même façade ne se voient pas ; tout le reste, si.
export function lineOfSight(a, b, halfWidth) {
  const onFacade = (p) => Math.abs(p.x) > halfWidth - 0.6;
  return !(onFacade(a) && onFacade(b) && Math.sign(a.x) === Math.sign(b.x));
}

// Zone de terrasse et couloir de passage, à partir de la config.
export function tableInnerEdge(table, zones) {
  return Math.abs(table.x) - zones.tableFootprint;
}
export function corridorEncroachment(table, zones) {
  return Math.max(0, zones.corridorHalfWidth - tableInnerEdge(table, zones));
}
