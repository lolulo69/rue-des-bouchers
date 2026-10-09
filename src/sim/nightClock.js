// Horloge de nuit adaptative (GAME_DESIGN §12c.5). Pur, sans DOM, sans hasard : dit à quelle vitesse la nuit doit
// passer maintenant ; le jeu (game.js) lisse la transition (easeSeconds) et l'affiche (⏩).
//   nightClock(sim, c, { manual, sleeping }) → { scale, fast, reason }
//   scale : multiplicateur de RULES.gameMinutesPerSecond ; reason : 'sleep' | 'busy:<cause>' | 'late' | 'manual' | 'normal'
// La nuit est la même à toutes les vitesses : seul le pas de temps réel change (sim.tick reste l'unique chemin).

// Ce qui « se passe » : entrées du journal récentes qui méritent qu'on ralentisse
import { activeAttention } from './witness.js';

const LIVELY = new Set(['witness', 'evidence', 'night-action', 'night-event', 'twist-event', 'police-arrive', 'tipoff', 'bribe', 'table-return', 'pee', 'scandal']);

// Pourquoi il ne faut pas accélérer maintenant (null = rien en vue)
export function busyReason(sim, c, R = sim.cfg.RULES.clock) {
  const S = sim.state;
  const P = S.police;
  if (P && (P.phase === 'pending' || P.phase === 'walking' || P.phase === 'onsite')) return 'police';
  if (activeAttention(sim).length) return 'window'; // §12d : fenêtre propice (diversion, moment du twist) → ×1
  const soon = (at) => at >= S.min - 1 && at <= S.min + R.lookahead;
  if ((S.twistEvents ?? []).some((e) => !e.done && soon(e.at))) return 'twist';
  if (S.twistRainAt !== undefined && soon(S.twistRainAt)) return 'twist';
  if ((c?.state?.nightEvents ?? []).some((e) => !e.done && soon(e.at))) return 'event';
  const J = S.journal;
  for (let i = J.length - 1; i >= 0 && J[i].t >= S.min - R.calmMinutes; i--) {
    if (LIVELY.has(J[i].type) || (J[i].type === 'action' && J[i].action !== 'sleep')) return J[i].type === 'witness' ? 'witness' : 'action';
  }
  return null;
}

export function nightClock(sim, c, { manual = false, sleeping = sim.state.sleeping } = {}) {
  const RULES = sim.cfg.RULES;
  const R = RULES.clock;
  if (sleeping) return { scale: RULES.sleepTimeMultiplier, fast: true, reason: 'sleep' };
  const late = sim.state.min >= R.fastAfter;
  if (!late && !manual) return { scale: 1, fast: false, reason: 'normal' };
  const busy = busyReason(sim, c, R);
  if (busy) return { scale: 1, fast: false, reason: `busy:${busy}` };
  return { scale: R.fastScale, fast: true, reason: manual && !late ? 'manual' : 'late' };
}
