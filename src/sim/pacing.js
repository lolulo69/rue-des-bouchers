// Rythme de la nuit (GAME_DESIGN §12b, qa/fun-audit.md) : contre les nuits répétitives et les temps morts.
//   • lignes variées : choose(list) évite les lignes déjà dites cette nuit ou la nuit précédente ;
//   • raclements de chaises regroupés : les tables rentrées en ~2 min de jeu font UNE ligne (« Le Goulot et les Mal Lunés rentrent trois tables ») ;
//   • vie de la rue : après un silence de 10 à 14 min de jeu (20 à 28 s réelles), un micro-moment ambiant (content/night.js › AMBIENT),
//     jamais deux fois dans la même nuit, et pas deux fois dans la campagne tant qu'il en reste d'autres.
// RNG propre (graine dérivée de la nuit) : n'altère pas les tirages de la simulation. Désactivable : cfg.PACING.enabled = false.
// Mémoire d'une nuit à l'autre : sim.pacing.memory() → carry.pacing de la nuit suivante (campaign.js).
import { createRng } from './rng.js';
import { weatherNow } from './weather.js';
import { CLATTER, AMBIENT, PHONE_PINGS } from '../content/night.js';
import { WHATSAPP_GROUP } from '../content/characters.js';
import { streetLine } from './narrative.js';
import { usable, textOf, holds } from './stateGuard.js';

const DEFAULTS = { enabled: true, quietMin: 10, quietMax: 13, clatterWindow: 2 };
const NUM = ['zéro', 'une', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze'];
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const fill = (t, ctx) => t.replace(/\{(\w+)\}/g, (_, k) => (ctx[k] ?? `{${k}}`));

export function attachPacing(sim, { carry = {} } = {}) {
  const P = { ...DEFAULTS, ...(sim.cfg.PACING ?? {}) };
  if (!P.enabled) return null;
  const S = sim.state;
  const rng = createRng(((sim.seed ?? 1) ^ 0x9e3779b9) >>> 0);
  const prev = new Set(carry.lines ?? []);       // lignes (et gabarits) de la nuit précédente
  const seen = new Set();                         // lignes (et gabarits) de cette nuit
  const lastUse = new Map();                      // gabarit → minute de dernier usage (repli quand une liste est épuisée)
  const usedAmbient = new Set(carry.ambient ?? []); // micro-moments déjà joués dans la campagne
  let lastMoment = S.min;
  let nextGap = rng.range(P.quietMin, P.quietMax);
  let pending = []; // raclements à regrouper : { restId, terrace, at }

  // Ce que le joueur VOIT compte comme « il se passe quelque chose » : une ligne du journal de nuit
  const log = sim.log;
  let ambientRun = 0; // micro-moments d'affilée sans autre ligne (jamais 3 de suite : anti-spam)
  sim.log = (text, cls) => { if (text) { lastMoment = S.min; seen.add(text); ambientRun = cls === 'ambient' ? ambientRun + 1 : 0; } return log(text, cls); };

  // Choisit un gabarit pas encore dit cette nuit ni la précédente ; liste épuisée : celui qui a servi il y a le plus longtemps
  // Garde d'état (§13.L, stateGuard.js) : seules les lignes qui collent à la situation ; la mémoire porte sur le TEXTE
  const choose = (list, r = rng) => {
    const ok = usable(list ?? [], sim).map(textOf);
    if (!ok.length) return null;
    const fresh = ok.filter((l) => !seen.has(l) && !prev.has(l));
    const notTonight = fresh.length ? fresh : ok.filter((l) => !seen.has(l));
    const line = notTonight.length ? r.pick(notTonight) : [...ok].sort((a, b) => (lastUse.get(a) ?? -1) - (lastUse.get(b) ?? -1))[0];
    seen.add(line);
    lastUse.set(line, S.min);
    return line;
  };

  function flushClatter() {
    if (!pending.length) return;
    const byRest = new Map();
    for (const p of pending) {
      const e = byRest.get(p.restId) ?? { n: 0, terrace: false };
      e.n++; e.terrace ||= p.terrace;
      byRest.set(p.restId, e);
    }
    pending = [];
    const ids = [...byRest.keys()];
    const n = [...byRest.values()].reduce((s, e) => s + e.n, 0);
    const name = (id) => CLATTER.names[id] ?? sim.rest(id)?.name ?? id;
    const who = ids.length === 1 ? name(ids[0]) : `${ids.slice(0, -1).map(name).join(', ')} et ${name(ids.at(-1))}`;
    const late = sim.isLate();
    let key;
    if (ids.length > 1) key = 'many';
    else if (byRest.get(ids[0]).terrace) key = late ? 'terrace_late' : 'terrace';
    else key = n > 1 ? (late ? 'some_late' : 'some') : (late ? 'one_late' : 'one');
    // Variantes de circonstance, de temps en temps (une seule enseigne)
    if (ids.length === 1 && !byRest.get(ids[0]).terrace) {
      if (weatherNow(S) && rng.chance(0.5)) key = 'rain';
      else if (sim.day?.key === 'sat' && rng.chance(0.35)) key = 'saturday';
    }
    const line = choose(CLATTER[key]) ?? choose(CLATTER.one);
    if (!line) return;
    sim.log(fill(line, { who, Who: cap(who), n: NUM[n] ?? String(n) }));
  }

  function ambient() {
    const rain = !!weatherNow(S);
    const sat = sim.day?.key === 'sat';
    const ok = (a) => {
      const w = a.when ?? {};
      if (w.from !== undefined && S.min < w.from) return false;
      if (w.to !== undefined && S.min >= w.to) return false;
      if (w.sat !== undefined && w.sat !== sat) return false;
      if (w.rain !== undefined && w.rain !== rain) return false;
      if (a.state && !holds(a.state, sim)) return false; // garde d'état (§13.L)
      return !seen.has(a.text);
    };
    const pool = AMBIENT.filter(ok);
    if (!pool.length) return;
    const fresh = pool.filter((a) => !usedAmbient.has(a.id));
    const a = rng.pick(fresh.length ? fresh : pool);
    usedAmbient.add(a.id);
    sim.log(a.text, 'ambient');
    sim.note('ambient', { id: a.id });
    if (a.effects?.noise) {
      // Un bref pic de bruit dans la rue, comme un raclement (même modèle de bruit, même durée)
      const x = (rng.next() - 0.5) * 2 * (sim.cfg.STREET.halfWidth - 0.5);
      const z = (rng.next() - 0.5) * sim.cfg.STREET.length * 0.6;
      S.clatters.push({ x, y: 0.5, z, until: S.min + sim.cfg.NOISE.clatterMinutes });
    }
    if (a.effects?.klaas) sim.klaasAlert?.();
  }

  function phonePing() {
    const texts = PHONE_PINGS.filter((p) => !p.state || holds(p.state, sim)).map((p) => p.text.replace('{group}', WHATSAPP_GROUP)); // garde d'état (§13.L)
    const fresh = texts.filter((t) => !seen.has(t) && !prev.has(t));
    const pool = fresh.length ? fresh : texts.filter((t) => !seen.has(t));
    if (!pool.length) return;
    sim.log(rng.pick(pool), 'phone');
    sim.note('phone-ping', {});
  }

  // Appelé après chaque pas de simulation (on enveloppe sim.tick, comme campaign.js › autoDbLogger)
  const tick = sim.tick;
  sim.tick = (dMin) => {
    tick(dMin);
    if (pending.length && (S.ended || S.min - pending[0].at >= P.clatterWindow)) flushClatter();
    if (S.ended || S.sleeping) { lastMoment = S.min; return; }
    if (S.min - lastMoment >= nextGap) {
      // anti-spam : après deux micro-moments d'affilée, un message du groupe plutôt qu'une 3e ambiance
      if (ambientRun >= 2) phonePing(); else ambient();
      lastMoment = S.min;
      nextGap = rng.range(P.quietMin, P.quietMax);
    }
  };

  const api = {
    choose,
    // Une ligne de la rue (narrative.streetLine) : sim.pacing?.line('pee_door') ?? texte de repli
    line: (kind, ctx = {}) => streetLine(kind, sim, ctx),
    // sim.js › clearTable : une table rentrée par son resto (regroupée avec les voisines)
    clatter(restId, { terrace = false } = {}) { pending.push({ restId, terrace, at: S.min }); },
    // À reporter dans carry.pacing de la nuit suivante
    memory: () => ({ lines: [...seen], ambient: [...usedAmbient] }),
  };
  sim.pacing = api;
  return api;
}
