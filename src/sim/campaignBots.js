// Bots de stratégie à l'échelle de la campagne (§13.H). Ils ne connaissent pas le contenu par cœur : ils lisent
// la légalité et les effets des actions / choix et les notent selon leurs poids. Interface :
//   { name, morning(c, opts) → picks[], afternoon(c, actions) → id | null, choose(c, card, choices) → i,
//     night(c, sim) → politique de nuit { decide(sim), content(sim, c) }, continueAfterFired?(c) }
import { POLICIES } from './policies.js';

const STATS = ['sleep', 'asso', 'risk', 'job', 'dossier', 'hostility', 'corruption'];

// Note d'un bloc d'effets (+ effets si vu, pondérés par l'exposition) selon les poids du bot
function score(effects = {}, w, witnessed) {
  let s = 0;
  for (const k of STATS) s += (effects[k] ?? 0) * (w[k] ?? 0);
  for (const f of effects.setFlags ?? []) s += w.flags?.[f] ?? (w.anyFlag ?? 0.5);
  if (effects.evidence) s += (effects.evidence.legal === false ? w.illegalEvidence ?? 1 : w.legalEvidence ?? 4) * (effects.evidence.quality ?? 1);
  if (witnessed) s += score(witnessed.effects, w) * (witnessed.exposure ?? 0.4) * (w.caution ?? 1);
  return s;
}

// Valeurs communes : gagner la commission, prouver la corruption, bloquer le bar de La Bombance ; ne pas devenir un habitué
const flagWeights = (prefix) => ({
  won_legal: 50, won_peace: 50, won_scandal: 50, commission_won: 30, corruption_proof: 15, press_contacted: 10, bombance_blocked: 30,
  carbonnade_1: -20, carbonnade_2: -30, carbonnade_3: -60, ...prefix,
});

function make({ name, weights, legality, sideProjects = 1, nightPolicy, nightContent, maxRisk = 100, continueFired = false }) {
  const allowed = (a, c) => legality.includes(a.legality ?? 'legal') && (a.legality === 'legal' || c.state.stats.risk < maxRisk);
  return {
    name,
    morning(c, o) {
      const picks = [];
      const projects = o.sideProjects.filter((p) => p.available && (p.risk ?? 0) <= (legality.includes('illegal') ? 100 : 0))
        .sort((a, b) => score(b.effects, weights) - score(a.effects, weights));
      for (let i = 0; i < o.prompts; i++) picks.push(i < sideProjects && projects[i] && c.state.stats.job > 35 ? projects[i].id : 'work');
      return picks;
    },
    afternoon(c, actions) {
      // Rendements décroissants : une action déjà faite intéresse moins (sinon le bot répète la même tous les jours)
      const done = (id) => c.state.counts.actions[id] ?? 0;
      const best = actions.filter((a) => allowed(a, c))
        .map((a) => ({ a, s: score(a.effects, weights, a.witnessed) / (a.cost?.time ?? 1) / (1 + done(a.id)) }))
        .filter((x) => x.s > 0)
        .sort((x, y) => y.s - x.s)[0];
      return best?.a.id ?? null;
    },
    choose(c, card, choices) {
      const data = card.data?.choices ?? [];
      return choices.map((ch) => ({ i: ch.i, s: score(data[ch.i]?.effects, weights) }))
        .sort((x, y) => y.s - x.s)[0].i;
    },
    night(c, sim) {
      const base = nightPolicy();
      return {
        decide: (s) => base.decide(s),
        // Actions de nuit du contenu : seulement celles qui valent quelque chose pour ce bot (pas la carbonnade, etc.)
        content: (s, camp) => (nightContent ? camp.nightActions(s).filter((a) => allowed(a, camp) && score(a.effects, weights, a.witnessed) > 0 && nightContent(s, a, camp)).map((a) => a.id) : []),
      };
    },
    continueAfterFired: () => continueFired,
  };
}

// Politique de nuit légale + relevés en dB + photo du pot-de-vin
function legalNight({ asso = false, bedAt = 24.25 * 60 } = {}) {
  return () => {
    const p = POLICIES[asso ? 'legalAsso' : 'legal']();
    let lastDb = -Infinity;
    return {
      decide(sim) {
        const st = sim.state;
        const acts = st.min >= bedAt ? [{ type: 'sleep', on: true }] : p.decide(sim);
        const b = sim.activeBribe();
        if (b && !b.photographed && !st.sleeping) acts.push({ type: 'photo', target: { kind: 'police' }, distance: 8 });
        if (!st.sleeping && st.min >= 22 * 60 + 30 && st.min - lastDb >= 30) { lastDb = st.min; acts.push({ type: 'db', fromWindow: true }); }
        return acts;
      },
    };
  };
}
const stealthyOk = (sim) => !sim.potentialWitnesses(sim.cfg.ANCHORS.pilouWindow).some((w) => w.kind !== 'customers');

export const CAMPAIGN_BOTS = {
  passive: () => make({
    name: 'passif', legality: [], sideProjects: 0,
    weights: { sleep: 1 }, nightPolicy: () => POLICIES.passive(),
  }),
  legal: () => make({
    name: 'légal prudent', legality: ['legal'],
    weights: { dossier: 3, asso: 1.5, sleep: 0.5, risk: -5, hostility: -0.2, job: 0.3, legalEvidence: 6, flags: flagWeights({ stance_legal: 20 }) },
    nightPolicy: legalNight(), nightContent: () => true,
  }),
  reckless: () => make({
    name: 'illégal imprudent', legality: ['illegal', 'grey'], sideProjects: 3,
    weights: { dossier: 1, risk: 0, hostility: 0.5, illegalEvidence: 3, anyFlag: 2, flags: flagWeights({ stance_direct: 20 }), caution: 0 },
    nightPolicy: () => POLICIES.reckless(), nightContent: () => true,
  }),
  stealthy: () => make({
    name: 'illégal discret', legality: ['illegal', 'grey'], sideProjects: 2, maxRisk: 60,
    weights: { dossier: 1, risk: -2, hostility: 0.3, illegalEvidence: 3, anyFlag: 2, flags: flagWeights({ stance_direct: 15, disguise_hood: 20, disguise_vest: 20 }), caution: 2 },
    nightPolicy: () => POLICIES.stealthy(), nightContent: (sim) => stealthyOk(sim),
  }),
  mixed: () => make({
    name: 'mixte malin', legality: ['legal', 'grey', 'illegal'], sideProjects: 1, maxRisk: 40,
    weights: { dossier: 3, asso: 1.5, sleep: 0.5, risk: -3, hostility: -0.1, legalEvidence: 6, illegalEvidence: 2, flags: flagWeights({ stance_legal: 10 }), caution: 2 },
    nightPolicy: legalNight({ asso: true }), nightContent: (sim, a, camp) => camp.state.stats.risk < 30 && stealthyOk(sim),
    continueFired: true,
  }),
  diplomat: () => make({
    name: 'diplomate', legality: ['legal'],
    weights: { asso: 3, hostility: -1.5, dossier: 1, sleep: 0.5, risk: -5, flags: flagWeights({ stance_dialogue: 30, won_peace: 80 }) },
    nightPolicy: legalNight({ bedAt: 23 * 60 }), nightContent: () => true,
  }),
};

// Cibles §13.H, exprimées en part de campagnes par fin (ids canoniques de CONFIG.CAMPAIGN.endings)
export const TARGETS = {
  passive: [{ label: '≥ 90 % déménagement / défaite', ok: (d) => (d.moving_out ?? 0) + (d.fired ?? 0) + (d.custody ?? 0) + (d.none ?? 0) >= 0.9 }],
  legal: [
    { label: 'victoire légale 35–60 %', ok: (d) => (d.legal_victory ?? 0) >= 0.35 && (d.legal_victory ?? 0) <= 0.6 },
    { label: 'jamais de garde à vue', ok: (d) => !(d.custody > 0) },
  ],
  reckless: [{ label: '≥ 70 % garde à vue / procès', ok: (d) => (d.custody ?? 0) >= 0.7 }],
  stealthy: [
    { label: '≤ 40 % garde à vue', ok: (d) => (d.custody ?? 0) <= 0.4 },
    { label: 'scandale atteignable', ok: (d) => (d.scandal ?? 0) > 0 },
  ],
  mixed: [{ label: 'meilleur score moyen', ok: (d, all, name) => Object.entries(all).every(([k, v]) => k === name || v.score <= all[name].score) }],
  diplomat: [{ label: 'paix négociée ≥ 40 %', ok: (d) => (d.negotiated_peace ?? 0) >= 0.4 }],
};

// Score de fin (pour "meilleur score moyen") : les bonnes fins valent plus
export const ENDING_SCORE = { legal_victory: 100, negotiated_peace: 90, scandal: 70, the_return: 60, turncoat: 20, fired: 10, moving_out: 0, custody: -20, none: 0 };
