// Bots de stratégie à l'échelle de la campagne (§13.H). Ils ne connaissent pas le contenu par cœur : ils lisent
// la légalité et les effets des actions / choix et les notent selon leurs poids. Interface :
//   { name, morning(c, opts) → picks[], afternoon(c, actions) → id | null, choose(c, card, choices) → i,
//     night(c, sim) → politique de nuit { decide(sim), content(sim, c) }, continueAfterFired?(c) }
// `weights` peut être une fonction de la campagne (le bot change d'avis en cours de route, ex. le diplomate qui craque).
import { POLICIES } from './policies.js';
import { availableNightActions, LOCATIONS, NIGHT_ACTION_SPECS } from './nightActions.js';

const STATS = ['sleep', 'asso', 'risk', 'job', 'dossier', 'hostility', 'corruption'];

// Note d'un bloc d'effets (+ effets si vu, pondérés par l'exposition) selon les poids du bot.
// Avec la campagne `c`, le bot compte le gain réel : échelle de la config et marge restante (l'Asso à 100 ne monte plus).
function score(effects = {}, w, witnessed, c) {
  let s = 0;
  for (const k of STATS) s += gain(k, effects[k] ?? 0, c) * (w[k] ?? 0);
  for (const f of effects.setFlags ?? []) if (!c?.has(f)) s += w.flags?.[f] ?? (w.anyFlag ?? 0.5); // un drapeau déjà posé ne rapporte plus
  if (effects.evidence) s += (effects.evidence.legal === false ? w.illegalEvidence ?? 1 : w.legalEvidence ?? 4) * (effects.evidence.quality ?? 1);
  if (witnessed) s += score(witnessed.effects, w, null, c) * (witnessed.exposure ?? 0.4) * (w.caution ?? 1);
  return s;
}
function gain(k, v, c) {
  if (!c || !v) return v;
  const C = c.cfg.CAMPAIGN;
  const scaled = v > 0 && k === 'dossier' ? v * (C.contentDossierScale ?? 1) : v > 0 && k === 'asso' ? v * (C.contentAssoScale ?? 1) : v;
  const cur = c.state.stats[k] ?? c.state.hidden[k] ?? 0;
  return Math.max(-cur, Math.min(100 - cur, scaled));
}

// Valeurs communes : gagner la commission (de préférence par le dossier), prouver la corruption, bloquer le bar de La Bombance ; ne pas devenir un habitué
const flagWeights = (prefix) => ({
  won_legal: 60, won_peace: 55, won_scandal: 40, commission_won: 30, // dans l'ordre des fins (ENDING_SCORE) corruption_proof: 15, press_contacted: 10, bombance_blocked: 30,
  carbonnade_1: -20, carbonnade_2: -30, carbonnade_3: -60, commission_lost: -20, ...prefix,
});

function make({ name, weights: w, legality, sideProjects = 1, jobFloor = 35, naps = () => 0, lazyWork = false, nightPolicy, nightContent, maxRisk = 100, continueFired = false, alsoLegal = [] }) {
  const W = (c) => (typeof w === 'function' ? w(c) : w);
  const allowed = (a, c) => (legality.includes(a.legality ?? 'legal') || alsoLegal.includes(a.id)) && (a.legality === 'legal' || c.state.stats.risk < maxRisk);
  return {
    name,
    morning(c, o) {
      const weights = W(c);
      const picks = [];
      const projects = o.sideProjects.filter((p) => p.available && (p.risk ?? 0) <= (legality.includes('illegal') ? 100 : 0))
        .map((p) => ({ p, s: score({ ...p.effects, setFlags: [...(p.effects?.setFlags ?? []), ...(p.unlocks ? [p.unlocks] : [])] }, weights, null, c) }))
        .sort((a, b) => b.s - a.s).map((x) => x.p);
      for (let i = 0; i < o.prompts; i++) picks.push(i < sideProjects && projects[i] && c.state.stats.job > jobFloor ? projects[i].id : 'work');
      // La sieste pendant que Clode Kode « réfléchit » (work_nap) : du Sommeil contre du Job
      const nap = o.work.find((x) => x.id === 'work_nap');
      for (let i = picks.length - 1, n = nap ? naps(c) : 0; i >= 0 && n > 0; i--) if (picks[i] === 'work') { picks[i] = nap.id; n--; }
      // Le tire-au-flanc prend le travail le moins productif (chaque item une fois par matin)
      if (lazyWork) {
        const lazy = o.work.filter((x) => x.id !== 'work_nap').sort((a, b) => (a.job ?? c.cfg.CAMPAIGN.workJob) - (b.job ?? c.cfg.CAMPAIGN.workJob)).map((x) => x.id);
        for (let i = 0; i < picks.length; i++) if (picks[i] === 'work' && lazy.length) picks[i] = lazy.shift();
      }
      return picks;
    },
    afternoon(c, actions) {
      const weights = W(c);
      // Rendements décroissants : une action déjà faite intéresse moins (sinon le bot répète la même tous les jours)
      const done = (id) => c.state.counts.actions[id] ?? 0;
      const best = actions.filter((a) => allowed(a, c))
        .map((a) => ({ a, s: score(a.effects, weights, a.witnessed, c) / (a.cost?.time ?? 1) / (1 + done(a.id)) }))
        .filter((x) => x.s > 0)
        .sort((x, y) => y.s - x.s)[0];
      return best?.a.id ?? null;
    },
    choose(c, card, choices) {
      const weights = W(c);
      const data = card.data?.choices ?? [];
      return choices.map((ch) => ({ i: ch.i, s: score(data[ch.i]?.effects, weights, null, c) }))
        .sort((x, y) => y.s - x.s)[0].i;
    },
    night(c, sim) {
      // Si aucun des témoins de l'acte n'est en vue, il ne reste que l'aléa Dédé / Ghislain / patrouille : risque × 0.3
      const nightScore = (a, camp, s) => {
        const weights = W(camp);
        const w = a.witnessed && s && a.legality !== 'legal' && unseen(s, a, camp) ? { ...a.witnessed, exposure: (a.witnessed.exposure ?? 0.4) * 0.3 } : a.witnessed;
        const sc = score(a.effects, weights, w, camp);
        return a.legality === 'legal' ? sc : sc / (1 + (camp.state.counts.actions[a.id] ?? 0)) - 1;
      };
      const base = nightPolicy(c);
      return {
        decide: (s) => base.decide(s),
        // Actions de nuit du contenu : seulement celles qui valent quelque chose pour ce bot (pas la carbonnade, etc.) ;
        // un acte gris / illégal déjà commis intéresse moins (rendements décroissants, comme l'après-midi)
        // Seulement ce qui est faisable ici et maintenant (créneau, scène), et `nightContent(sim, a, c, entrée du menu)`
        content: (s, camp) => {
          if (!nightContent || s.state.sleeping) return [];
          const ACT = Object.fromEntries(camp.content.ACTIONS.map((a) => [a.id, a]));
          return availableNightActions(s, camp).filter((x) => x.available).map((x) => [ACT[x.id], x])
            .filter(([a, x]) => allowed(a, camp) && nightScore(a, camp, s) > 0 && nightContent(s, a, camp, x)).map(([a]) => a.id);
        },
      };
    },
    continueAfterFired: () => continueFired,
  };
}

// Politique de nuit légale + relevés en dB + photo du pot-de-vin
// maxCalls : appels à la police par nuit (le diplomate rationne : chaque PV agace le bloc)
// tiredBedAt : si le Sommeil de campagne est bas (< tiredBelow), Pilou se couche plus tôt
function legalNight({ asso = false, bedAt = 24.25 * 60, maxCalls = Infinity, tiredBelow = 0, tiredBedAt = bedAt } = {}) {
  return (c) => {
    const bed = c && c.state.stats.sleep < tiredBelow ? tiredBedAt : bedAt;
    const p = POLICIES[asso ? 'legalAsso' : 'legal']();
    let lastDb = -Infinity;
    let calls = 0;
    return {
      decide(sim) {
        const st = sim.state;
        const acts = (st.min >= bed ? [{ type: 'sleep', on: true }] : p.decide(sim))
          .filter((a) => a.type !== 'police' || calls++ < maxCalls);
        const b = sim.activeBribe();
        if (b && !b.photographed && !st.sleeping) acts.push({ type: 'photo', target: { kind: 'police' }, distance: 8 });
        if (!st.sleeping && st.min >= 22 * 60 + 30 && st.min - lastDb >= 30) { lastDb = st.min; acts.push({ type: 'db', fromWindow: true }); }
        return acts;
      },
    };
  };
}
// Illégal et discret : debout pour un seul appel à la police en début de soirée (de quoi provoquer la complaisance,
// filmée par la caméra du store ou photographiée en douce), au lit de 23:15 à 00:30, puis le seau quand il n'y a plus
// de témoin (Klaas dort à 01:00, le serveur est parti, le chat est rentré).
function stealthyNight() {
  return (c) => {
    const bucket = POLICIES.stealthy();
    // Une patrouille sur place : d'abord pour voir la complaisance, puis (serveur retourné) pour la photo de l'arrière-salle
    const needComplaisance = !c.has('seen_complaisance') || (c.has('waiter_informant') && !c.has('backroom_sneak'));
    const needWaiter = !c.has('asked_waiter');
    let called = false;
    let asked = false;
    return {
      decide(sim) {
        const st = sim.state;
        const m = st.min;
        if (m >= 23.25 * 60 && m < 24.5 * 60) return st.sleeping ? [] : [{ type: 'sleep', on: true }];
        if (m >= 24.5 * 60 && st.sleeping) return [{ type: 'sleep', on: false }]; // 00:30, avant que le serveur parte (00:45)
        if (needComplaisance && !called && m >= 22.25 * 60 && !st.police && sim.restaurants.some((r) => sim.infractions(r.id).length)) {
          called = true;
          return [{ type: 'police' }];
        }
        if (needWaiter && !asked && sim.isLate() && m >= st.waiterReadyAt && sim.infractions('bernadette').length) {
          asked = true;
          return [{ type: 'waiter' }];
        }
        return m >= 24.83 * 60 ? bucket.decide(sim) : [];
      },
    };
  };
}
// Imprudent : le seau dès que possible, et il demande au serveur (pour pouvoir le soudoyer ensuite)
function recklessNight() {
  return (c) => {
    const bucket = POLICIES.reckless();
    let asked = c.has('asked_waiter');
    return {
      decide(sim) {
        const st = sim.state;
        if (!asked && sim.isLate() && st.min >= st.waiterReadyAt && sim.infractions('bernadette').length) { asked = true; return [{ type: 'waiter' }]; }
        return bucket.decide(sim);
      },
    };
  };
}

const MIXED = { dossier: 5, asso: 1.5, sleep: 0.5, risk: -3, hostility: -0.2, job: 0.3, legalEvidence: 8, illegalEvidence: 2, flags: flagWeights({ stance_legal: 20, tatie_fake_leak: 5, bloc_fooled: 5, lawyer_hired: 8, formal_notice: 8, delandre_requested: 6, delandre_meeting: 8 }), caution: 2 };
const MIXED_TIRED = { ...MIXED, sleep: 3 };
const STEALTHY = { dossier: 1, risk: -2, hostility: 0.3, illegalEvidence: 3, anyFlag: 2, flags: flagWeights({ stance_direct: 15, disguise_hood: 20, disguise_vest: 20, waiter_bribed: 15, waiter_informant: 15, proj_wifi_cracker: 15, wifi_cracked: 15, kitchen_sabotaged: 25, laxative_done: 15, backroom_sneak: 30, camera_awning: 8, press_scandal: 20, sabotage_chairs: 12, sabotage_parasols: 12, sabotage_locks: 12, power_stolen: 12, stink_bomb: 8 }), caution: 2 };
const STEALTHY_CAMERA = { ...STEALTHY, flags: { ...STEALTHY.flags, camera_awning: 14 } };
const DIPLOMAT = { asso: 3, hostility: -1.5, dossier: 1, sleep: 0.5, risk: -5, flags: flagWeights({ stance_dialogue: 30, won_peace: 80, bombance_blocked: -5 }) }; // pas de recours contre un nouveau voisin
const DIPLOMAT_TURNCOAT = { ...DIPLOMAT, asso: 0, flags: flagWeights({ carbonnade_1: 40, carbonnade_2: 40, carbonnade_3: 40, won_scandal: 0, commission_won: 0 }) };
const diplomatNight = legalNight({ bedAt: 23 * 60, maxCalls: 1 });
const diplomatGaveUp = (c) => c.has('carbonnade_1') || (c.state.day >= 8 && c.state.hidden.hostility >= 70);

// Aucun des témoins que l'acte redoute (`witnessed.by`) ne peut voir l'endroit, sauf des clients
// (le serveur ne « témoigne » pas du pot-de-vin qu'il reçoit ; Dédé / Ghislain restent un aléa qu'on ne voit pas venir)
const SIM_KIND = { klaas: 'klaas', seb_nico: 'seb_nico', waiter: 'waiter', customers: 'customers', biloute: 'jeremie', jeremie: 'jeremie' };
function unseen(sim, a, c) {
  const kinds = new Set((a.witnessed?.by ?? Object.keys(SIM_KIND)).map((w) => SIM_KIND[w]).filter(Boolean));
  if (c?.has('waiter_informant')) kinds.delete('waiter'); // le serveur retourné est complice (le vrai tirage, lui, le garde)
  const pos = LOCATIONS[(NIGHT_ACTION_SPECS[a.id] ?? { at: 'street' }).at].pos(sim);
  const seen = sim.potentialWitnesses(pos).filter((w) => kinds.has(w.kind));
  return !seen.some((w) => w.kind !== 'customers') && seen.length <= 1; // au plus une tablée de clients en vue
}

export const CAMPAIGN_BOTS = {
  passive: () => make({
    name: 'passif', legality: [], sideProjects: 0,
    weights: { sleep: 1 }, nightPolicy: () => POLICIES.passive(),
  }),
  legal: () => make({
    name: 'légal prudent', legality: ['legal'],
    weights: { dossier: 3, asso: 1.5, sleep: 0.5, risk: -5, hostility: -0.2, job: 0.3, legalEvidence: 6, flags: flagWeights({ stance_legal: 20, lawyer_hired: 8, formal_notice: 8, delandre_requested: 6, delandre_meeting: 8, delandre_ally: 8, inquiry_open: 10, lemaire_transferred: 10 }) },
    nightPolicy: legalNight({ asso: true }), nightContent: () => true,
  }),
  reckless: () => make({
    name: 'illégal imprudent', legality: ['illegal', 'grey'], sideProjects: 3,
    weights: { dossier: 1, risk: 0, hostility: 0.5, illegalEvidence: 3, anyFlag: 2, flags: flagWeights({ stance_direct: 20, waiter_bribed: 10, waiter_informant: 10 }), caution: 0 },
    // d'abord parler au serveur (pour le soudoyer les nuits suivantes), ensuite le reste
    nightPolicy: recklessNight(), nightContent: (sim, a, camp) => camp.has('asked_waiter') || sim.state.min >= 23 * 60,
  }),
  stealthy: () => make({
    name: 'illégal discret', legality: ['illegal', 'grey'], sideProjects: 2, maxRisk: 40,
    // La caméra sous le store : en fin de campagne (J9+) et casier vierge (Risque < 10), pour qu'elle filme la commission
    weights: (c) => (c.state.day >= 9 && c.state.stats.risk < 10 ? STEALTHY_CAMERA : STEALTHY),
    nightPolicy: stealthyNight(), nightContent: (sim, a, camp) => unseen(sim, a, camp),
    alsoLegal: ['pm_press_contact', 'pm_press_scandal', 'pm_waiter_testimony'], // marchepieds légaux du plan illégal (la presse pour le scandale, le serveur retourné)
  }),
  mixed: () => make({
    name: 'mixte malin', legality: ['legal', 'grey', 'illegal'], sideProjects: 1, maxRisk: 40,
    weights: (c) => (c.state.stats.sleep < 40 ? MIXED_TIRED : MIXED), // fatigué : le sommeil passe avant la preuve
    naps: (c) => (c.state.stats.sleep < 35 && c.state.stats.job > 45 ? 1 : 0),
    nightPolicy: legalNight({ asso: true }), nightContent: (sim, a, camp, x) => a.legality === 'legal' || (camp.state.stats.risk < 30 && unseen(sim, a, camp)),
    continueFired: true,
  }),
  diplomat: () => make({
    name: 'diplomate', legality: ['legal'],
    // La paix devient impossible (bloc trop hostile, tard dans la campagne) : il craque et passe à table, pour de bon
    weights: (c) => (diplomatGaveUp(c) ? DIPLOMAT_TURNCOAT : DIPLOMAT),
    // …et, passé de l'autre côté, il ne documente plus rien la nuit (il dîne)
    nightPolicy: (c) => (diplomatGaveUp(c) ? POLICIES.passive() : diplomatNight(c)), nightContent: () => true,
  }),
  // Tire-au-flanc : tout Koddex part en side projects, le boulot attend. Ne prend pas le rebond « au chômage ».
  slacker: () => make({
    name: 'tire-au-flanc', legality: ['legal'], sideProjects: 3, jobFloor: -Infinity, naps: () => 1, lazyWork: true,
    weights: { dossier: 3, asso: 1.5, sleep: 0.5, risk: -5, legalEvidence: 6, flags: flagWeights({ stance_legal: 20, lawyer_hired: 8, formal_notice: 8 }) },
    nightPolicy: legalNight({ bedAt: 23.5 * 60 }), nightContent: () => true,
  }),
};

// Cibles §13.H, exprimées en part de campagnes par fin (ids canoniques de CONFIG.CAMPAIGN.endings ; « le retour » compté via baseEnding)
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
  slacker: [{ label: 'licenciement atteignable (≥ 2 %, §13.F)', ok: (d) => (d.fired ?? 0) >= 0.02 }],
};

// « Le retour » (La Bombance rouvre en bar) se pose sur une victoire à la commission : pour les cibles et le score,
// il compte comme la victoire qu'il prolonge (won_legal / won_peace / won_scandal).
export function baseEnding(S) {
  const id = S.ending?.id ?? 'none';
  if (id !== 'the_return') return id;
  return S.flags.includes('won_legal') ? 'legal_victory' : S.flags.includes('won_peace') ? 'negotiated_peace' : S.flags.includes('won_scandal') ? 'scandal' : id;
}

// Score de fin (pour "meilleur score moyen") : les bonnes fins valent plus
export const ENDING_SCORE = { legal_victory: 100, negotiated_peace: 90, scandal: 70, the_return: 60, turncoat: 20, fired: 10, moving_out: 0, custody: -20, none: 0 };
