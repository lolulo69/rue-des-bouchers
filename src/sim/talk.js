// Parler aux gens, la nuit (GAME_DESIGN §12e.3). Pur, sans DOM. Le contenu : src/content/talk.js (TALK, §14).
//   talkTargets(sim, player, at?) → [{ who, label, prompt, dist, far }] : qui est assez près pour qu'on lui parle, le plus
//     proche d'abord. `at(who)` (facultatif, game.js) donne la position 3D réelle du personnage ; sinon celle de la sim.
//   PEOPLE[who] : présence (sim) et portée. Le dialogue lui-même vient de la campagne (c.talkFor / c.talk).
// player = { where: 'street' | 'window' | 'apartment', pos: { x, z } } (comme nightActions.js)
import { patrolPositions, smokeSpot } from './schedule.js';

const flat = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const bern = (sim) => sim.rest('bernadette');
const door = (sim) => ({ x: bern(sim).side * (sim.cfg.STREET.halfWidth - 0.6), z: (bern(sim).z0 + bern(sim).z1) / 2 });
const nearestTable = (sim, p) => sim.state.tables.filter((t) => t.out).sort((a, b) => flat(a, p) - flat(b, p))[0] ?? null;

// from : où Pilou doit se tenir (street | window) ; range : distance au sol (m) ; far : de loin (un signe, un coup de fil)
export const PEOPLE = {
  jeremie: { label: 'Jérémie', from: ['street'], range: 3, present: (sim) => sim.dogActive(), pos: (sim) => sim.dogPos() },
  tatie: { label: 'Tatie', from: ['street'], range: 5, present: (sim) => sim.state.min < (sim.cfg.TALK?.tatieUntil ?? 23 * 60), pos: (sim) => sim.cfg.ANCHORS.tatieWindow },
  // Le balcon d'en face : depuis la rue, en levant la tête, ou depuis la fenêtre de Pilou
  seb_nico: { label: 'Seb & Nico', from: ['street', 'window'], range: 8, present: (sim) => sim.catPresent(), pos: (sim) => sim.cfg.ANCHORS.balcony },
  waiter: { label: 'le serveur', from: ['street'], range: 2.5, present: (sim) => sim.waiterOnDuty(), pos: (sim) => sim.waiterPos() },
  dede: { label: 'Dédé', from: ['street'], range: 3, present: (sim) => sim.state.min < (sim.cfg.RULES.streetEmptyAt ?? Infinity), pos: (sim) => door(sim) },
  ghislain: { label: 'Ghislain', from: ['street'], range: 3, present: (sim) => sim.state.min < (sim.cfg.RULES.streetEmptyAt ?? Infinity), pos: (sim) => ({ ...door(sim), z: door(sim).z + 1.5 }) },
  customers: { label: 'des clients', from: ['street'], range: 2.5, present: (sim) => sim.state.tables.some((t) => t.out), pos: (sim, p) => nearestTable(sim, p) },
  patrol: { label: 'la patrouille', from: ['street'], range: 3, present: (sim) => patrolPositions(sim).length > 0, pos: (sim, p) => patrolPositions(sim).sort((a, b) => flat(a, p) - flat(b, p))[0] },
  // Klaas est au fond de la place : on ne lui parle que de loin (un signe de la main, un coup de fil), côté place
  klaas: { label: 'Klaas', from: ['street'], range: 45, far: true, present: (sim) => sim.klaasAwake(), pos: (sim) => sim.cfg.ANCHORS.klaasWindow },
};

// Le serveur en pause cigarette (§12e.7) : au coin, hors de vue de la terrasse
export const waiterOnBreakSpot = (sim) => (sim.waiterOnBreak() ? smokeSpot(sim.cfg) : null);

export function talkTargets(sim, player, at = null, hasTalk = () => true) {
  if (!player || sim.state.ended || sim.state.sleeping) return [];
  const out = [];
  for (const [who, p] of Object.entries(PEOPLE)) {
    if (!p.from.includes(player.where) || !p.present(sim) || !hasTalk(who)) continue;
    const pos = at?.(who) ?? p.pos(sim, player.pos);
    if (!pos) continue;
    const dist = flat(pos, player.pos);
    if (dist > p.range) continue;
    const label = p.far ? `Faire signe à ${p.label}` : `Parler à ${p.label}`;
    out.push({ who, label, prompt: label, dist: p.far ? Infinity : dist, far: !!p.far });
  }
  return out.sort((a, b) => a.dist - b.dist);
}

// ── Conversations (contenu : TALK, §14) ─────────────────────────────────
// Archétype d'une tablée pour `when.table` (touristes, habitués, étudiants) : stable dans la nuit, sans toucher au hasard
const TABLE_KINDS = ['touristes', 'habitues', 'etudiants'];
export function tableKind(sim, t) {
  let h = sim.seed >>> 0;
  for (const ch of String(t.id)) h = Math.imul(h ^ ch.charCodeAt(0), 0x9e3779b1) >>> 0;
  return sim.day?.key === 'sat' && h % 4 === 0 ? 'etudiants' : TABLE_KINDS[h % TABLE_KINDS.length];
}
const onDuty = (sim) => sim.state.police?.patrolId ?? null;

// Conditions propres à la nuit : time [début, fin], patrol (la patrouille sur place), table (archétype de la tablée visée)
export function talkFits(cond, sim, { table = null } = {}) {
  if (!cond) return true;
  const m = sim.state.min;
  if (cond.time && (m < cond.time[0] || m > cond.time[1])) return false;
  if (cond.patrol && onDuty(sim) !== cond.patrol) return false;
  if (cond.table && (!table || tableKind(sim, table) !== cond.table)) return false;
  return true;
}
export const stripNightKeys = (cond) => (cond ? Object.fromEntries(Object.entries(cond).filter(([k]) => !['time', 'patrol', 'table'].includes(k))) : cond);
// La tablée la plus proche de Pilou (pour `customers`)
export const tableNear = (sim, pos) => nearestTable(sim, pos);
