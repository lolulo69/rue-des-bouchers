// Application d'un twist (§14 twists.js, bloc `sim`) à une nuit. Pur, sans DOM. Appelé par sim.js :
//   setupTwist(sim) après la disposition des terrasses, updateTwist(sim) à chaque tick.
// Un RNG à part (dérivé de la graine) : une nuit sans twist reste identique à avant la v1.1.
import { createRng } from './rng.js';
import { fmt } from './time.js';

// `noise` multiplie l'amplitude des sources extérieures : en dB, +20·log10(noise) (×1.15 → +1,2 dB, ×1.3 → +2,3 dB).
// Les pics des moments (`events[].simEffect.noise`, en dB) durent 5 minutes par défaut (un but, une chanson).
export const noiseOffsetDb = (noise = 1) => (noise > 0 ? 20 * Math.log10(noise) : 0);
export const EVENT_NOISE_MINUTES = 5;

export function setupTwist(sim, twist) {
  const S = sim.state;
  const T = twist?.sim ?? {};
  const { RULES, STREET, ZONES } = sim.cfg;
  S.twist = twist ? { id: twist.id, title: twist.title ?? twist.id } : null;
  S.noiseBoosts = [];                       // { db, until } : moments de fête, buts du match…
  S.exhaustOff = !!T.exhaustOff;            // coupure de courant : la hotte s'arrête
  S.darkness = Math.max(0, Math.min(1, T.darkness ?? 0));
  S.corridorBlocked = !!T.corridorBlocked;  // camionnette dans le couloir de passage
  S.twistEvents = (T.events ?? []).map((e, i) => ({ ...e, i, done: false }));
  if (!twist) return;
  const rng = createRng((sim.seed ^ 0x7157a) >>> 0);
  // Foule : plus (ou moins) de monde à chaque table et dans les groupes debout
  if (T.crowd && T.crowd !== 1) {
    for (const t of S.tables) t.count = Math.max(1, Math.round(t.count * T.crowd));
    for (const g of S.standing) g.size = Math.max(1, Math.round(g.size * T.crowd));
  }
  // Tables modifiées (même libellé « table N » dans ce resto) ou ajoutées au bout de la terrasse
  let extra = 0;
  for (const spec of T.tables ?? []) {
    const r = sim.rest(spec.rest);
    if (!r) continue;
    const label = spec.label ?? `table ${S.tables.filter((t) => t.restId === r.id).length + 1}`;
    const existing = S.tables.find((t) => t.restId === r.id && t.label.endsWith(`, ${label}`));
    if (existing) { existing.count = spec.count ?? existing.count; existing.twist = true; continue; }
    extra++;
    const close = RULES.terraceCloseHour * 60;
    S.tables.push({
      id: `${r.id}-x${extra}`, restId: r.id, label: `${r.name}, ${label}`, twist: true,
      x: r.side * (STREET.halfWidth - ZONES.wallGap - ZONES.tableFootprint), z: r.z1 + 1.1 * extra,
      count: spec.count ?? 6, out: true,
      clearAt: rng.chance(r.compliance) ? close + rng.range(0, RULES.lateGraceMinutes) : rng.range(...r.lateClear),
      clearedAt: null, clearedBy: null, pendingBy: null, hiddenUntil: null, evidence: new Set(),
    });
  }
  // Les restos rangent plus tard ce soir-là
  if (T.closeDelay) for (const t of S.tables) t.clearAt += T.closeDelay;
  // La drache (twist) : elle tombe entre 21:00 et 22:00 ; sous le store de Bernadette, on reste
  if (T.rain) S.twistRainAt = rng.range(21 * 60, 22 * 60);
}

// Pluie : les terrasses rentrent en quatre minutes (sauf, au besoin, sous le store), les buveurs debout s'abritent
export function startRain(sim, { spareAwning = true } = {}) {
  const S = sim.state;
  if (S.twistRained) return;
  S.twistRained = true;
  const out = S.tables.filter((t) => t.out && !(spareAwning && t.restId === 'bernadette'));
  out.forEach((t, k) => { t.clearAt = Math.min(t.clearAt, S.min + 0.5 + (4 * k) / Math.max(1, out.length)); t.pendingBy = 'rain'; });
  for (const g of S.standing) if (g.leaveAt > S.min) g.leaveAt = S.min + 2;
  sim.note('twist-rain', { spared: spareAwning ? 'bernadette' : null });
  sim.log('La drache ! Les terrasses rentrent en courant… sauf sous le store de l’estaminet.');
}

export function updateTwist(sim) {
  const S = sim.state;
  if (!sim.twist && !S.noiseBoosts.length) return;
  if (S.twistRainAt !== undefined && S.min >= S.twistRainAt) startRain(sim);
  for (const e of S.twistEvents) {
    if (e.done || S.min < e.at) continue;
    e.done = true;
    sim.note('twist-event', { twistId: S.twist?.id, i: e.i });
    // Pour le metteur en scène (art.twists.trigger) : l'accessoire et le moment (ex. { prop: 'tv_screen', moment: 'goal' })
    sim.events.push({ type: 'twist-moment', twistId: S.twist?.id, i: e.i, prop: e.prop ?? null, moment: e.moment ?? `moment${e.i}`, at: e.at, text: e.text ?? null });
    if (e.text) sim.log(e.text);
    const fx = e.simEffect ?? {};
    if (fx.noise) S.noiseBoosts.push({ db: fx.noise, until: S.min + (fx.minutes ?? EVENT_NOISE_MINUTES) });
    if (fx.rain) startRain(sim, { spareAwning: fx.rain !== 'all' });
    if (fx.exhaustOff) S.exhaustOff = true;
    if (typeof fx.darkness === 'number') S.darkness = Math.max(0, Math.min(1, fx.darkness));
  }
  if (S.noiseBoosts.length) S.noiseBoosts = S.noiseBoosts.filter((b) => b.until > S.min);
}

// Bonus de bruit courant (dB) : multiplicateur du twist + moments en cours
export function twistNoiseDb(sim, twist) {
  const boosts = sim.state.noiseBoosts;
  if (!twist && !boosts?.length) return 0; // chemin chaud (bruit calculé à chaque tick) : rien à faire sans twist
  let db = noiseOffsetDb(twist?.sim?.noise);
  for (const b of boosts ?? []) db += b.db;
  return db;
}

// Témoins ajoutés par le twist (influenceuse, guide…), au format de witness.js
export function twistWitnesses(sim, twist) {
  if (!twist?.sim?.witnesses?.length) return [];
  const A = sim.cfg.ANCHORS;
  return (twist?.sim?.witnesses ?? []).filter((w) => sim.state.min >= (w.from ?? 0) && sim.state.min < (w.to ?? Infinity)).map((w) => {
    const at = typeof w.at === 'object' ? w.at
      : A[w.at] ?? (w.at === 'street' || !w.at ? sim.restCenter(sim.rest(w.rest ?? 'bernadette')) : sim.restCenter(sim.rest('bernadette')));
    return { id: `twist:${w.id}`, kind: 'twist', twistWitness: w.id, def: { name: w.name ?? w.id, p: w.p ?? 0.6, weight: w.weight ?? 0.8, ally: !!w.ally }, pos: { ...at, y: at.y ?? 1.6 }, filming: !!w.filming };
  });
}

export const twistTime = (m) => fmt(m);
