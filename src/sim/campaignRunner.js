// Joue une campagne entière sans rendu, en demandant ses décisions à un bot de campagne (campaignBots.js).
// Vérifie les invariants de chaque nuit au passage (nightErrors) pour campaignInvariants.js.
import { createCampaign } from './campaign.js';
import { checkInvariants } from './invariants.js';

// Joue une nuit déjà créée avec une politique de nuit { decide(sim) → actions[], content?(sim, c) → ids[] }
export function playNight(sim, policy, c, dt = 1) {
  while (!sim.state.ended) {
    if (policy) {
      for (const a of policy.decide(sim)) { sim.act(a); if (sim.state.ended) break; }
      if (c && policy.content && !sim.state.ended) for (const id of policy.content(sim, c)) c.doNightAction(sim, id);
    }
    sim.tick(dt);
    sim.events.length = 0;
  }
  return sim;
}

export function runCampaign({ seed = 1, content, cfg, bot, maxSteps = 5000 } = {}) {
  const c = createCampaign({ seed, content, cfg });
  const nightErrors = [];
  for (let i = 0; i < maxSteps && !c.ended; i++) {
    switch (c.step) {
      case 'cards': {
        const card = c.card();
        const ok = card.choices.filter((ch) => ch.available);
        c.resolveCard(card.type === 'event' && ok.length ? bot.choose(c, card, ok) : 0);
        break;
      }
      case 'koddex': c.koddex(bot.morning(c, c.koddexOptions())); break;
      case 'actions': {
        const id = bot.afternoon(c, c.availableActions());
        if (id) c.doAction(id); else c.endAfternoon();
        break;
      }
      case 'night': {
        const sim = c.createNight();
        playNight(sim, bot.night(c, sim), c);
        for (const e of checkInvariants(sim)) nightErrors.push(`J${c.state.day}: ${e}`);
        c.finishNight(sim);
        break;
      }
      case 'recap': c.nextDay(); break;
      default: throw new Error(`étape inconnue ${c.step}`);
    }
    // Le rebond du licenciement : certains bots continuent au chômage
    if (c.ended && c.state.ending?.canContinue && bot.continueAfterFired?.(c)) c.continueAfterEnding();
  }
  if (!c.ended) throw new Error(`campagne non terminée (graine ${seed}, ${bot.name})`);
  return { c, nightErrors };
}
