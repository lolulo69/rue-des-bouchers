// Tutoriels « en main » de la nuit (§12b.B) : le moteur (campaign.toolTutorialDue / tutorialEvent…) et le jeu (game.js,
// élément #coach) les gèrent. Ici, seulement ce que l'interface y ajoute :
//   · Ⓑ (manette) passe le repère affiché, comme « Passer » / Retour arrière ;
//   · « Revoir les tutoriels » dans l'Aide, si le moteur sait les rejouer (c.replayTutorials).
// Le style de #coach (et des classes optionnelles : data-anchor, .coach-step, .congrats) est dans ui.css.

// Le repère affiché par le jeu, s'il y en a un : on clique son bouton « Passer »
export function skipActiveCoach() {
  const b = typeof document !== 'undefined' ? document.getElementById('coach-skip') : null;
  if (!b || b.closest('.hidden')) return false;
  b.click();
  return true;
}
export const canReplayTutorials = (c) => typeof c?.replayTutorials === 'function';
export const replayTutorials = (c) => (canReplayTutorials(c) ? (c.replayTutorials(), true) : false);
