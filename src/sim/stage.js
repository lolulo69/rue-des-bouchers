// Repères de mise en scène des lignes de nuit (GAME_DESIGN §12e.6 « ça existe ou ça n'existe pas »).
// Une ligne de nuit porte `stage: { cue, at?, dur? }` (src/scene/stageCues.js) ; les lignes des réserves de night.js
// (chaînes) prennent celui de leur groupe dans LINE_STAGES. Quand la ligne s'affiche, la nuit émet aussi un événement
// { type: 'stage', cue, at, dur, text, min } que le metteur en scène joue (src/scene). 'sim' = déjà joué par la nuit
// elle-même (chaises, patrouille).
import { LINE_STAGES } from '../content/night.js';

// group : clé de LINE_STAGES (BARKS, BELL, WITNESS_LINES…) ; sub : sous-clé (weekday, before, customers…)
export function lineStage(group, sub = 'default') {
  const g = LINE_STAGES[group];
  if (!g) return null;
  const cue = typeof g === 'string' ? g : g[sub] ?? g.default ?? null;
  return cue ? { cue } : null;
}
// Le repère d'une ligne écrite { text, stage } ou d'une chaîne (null)
export const stageOf = (line) => (line && typeof line === 'object' ? line.stage ?? null : null);
export const textOf = (line) => (line && typeof line === 'object' ? line.text ?? null : line ?? null);
