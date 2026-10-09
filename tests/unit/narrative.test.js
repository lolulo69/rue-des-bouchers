import { describe, it, expect } from 'vitest';
import {
  fill, placeholders, hhmm, nightCtx, nightPool, pickNightLine, policePool, policeLine, klaasEntry, KLAAS_PRECISE_AT,
  pickHeadline, recapHeadline, recapMetrics, tutorialPrompt, TUTORIAL_TRIGGERS, introCards, commissionScene,
  dialogueFor, mediaFeed, mediaEnding, mediaEndingFeed, waiterReason, bellAfterKey,
} from '../../src/sim/narrative.js';
import { compare } from '../../src/sim/conditions.js';
import { holds, guardOf, textOf } from '../../src/sim/stateGuard.js';
import { runNight } from '../../src/sim/runner.js';
import { POLICIES } from '../../src/sim/policies.js';
import { KLAAS_NOTEBOOK, POLICE_LINES, WITNESS_LINES, BARKS, BELL, WAITER_LINES, RECAP_HEADLINES, NIGHT_END } from '../../src/content/night.js';
import { INTRO_CARDS, TUTORIAL } from '../../src/content/intro.js';
import { MEDIA } from '../../src/content/media.js';
import { DIALOGUE } from '../../src/content/dialogue.js';
import { EVENTS } from '../../src/content/events.js';

// Un état de campagne qui satisfait `cond` (preuve d'atteignabilité, hors `chance`)
function ctxSatisfying(cond = {}) {
  const solve = (expr) => { for (let v = 0; v <= 100; v++) if (compare(v, expr)) return v; throw new Error(`insatisfiable ${expr}`); };
  const day = cond.day ? (Array.isArray(cond.day) ? cond.day[0] : cond.day) : 1;
  return {
    day,
    phase: cond.phase ? [cond.phase].flat()[0] : 'afternoon',
    flags: [...(cond.flags ?? [])],
    stats: Object.fromEntries(Object.entries(cond.stats ?? {}).map(([k, e]) => [k, solve(e)])),
    hidden: Object.fromEntries(Object.entries(cond.hidden ?? {}).map(([k, e]) => [k, solve(e)])),
  };
}

// rng scripté : pick parcourt la liste dans l'ordre, chance renvoie `yes`
const cycler = (yes = true) => { let i = 0; return { pick: (a) => a[i++ % a.length], chance: () => yes }; };
const reachAll = (pool, draw) => {
  const got = new Set();
  for (let i = 0; i < pool.length * 2; i++) got.add(draw());
  return pool.filter((l) => ![...got].some((g) => g === fill(l, {}) || g === l || g?.text === l));
};

// Quelques vraies nuits, pour remplir les gabarits avec un état réel
const NIGHTS = [];
for (const day of ['mon', 'tue', 'fri', 'sat']) {
  for (const p of ['legal', 'legalAsso', 'reckless']) {
    for (let seed = 1; seed <= 6; seed++) NIGHTS.push(runNight({ seed, day, policy: POLICIES[p]() }));
  }
}

describe('narrative.js : outils', () => {
  it('fill remplace, et ne laisse jamais fuir une {variable}', () => {
    expect(fill('{a} et {b}', { a: 1, b: 'deux' })).toBe('1 et deux');
    const missing = [];
    expect(fill('{a} {zz}', { a: 1 }, { missing })).toBe('1 …');
    expect(missing).toEqual(['zz']);
    expect(placeholders('{time}. {rest} : {count}')).toEqual(['time', 'rest', 'count']);
    expect(hhmm(25 * 60 + 5)).toBe('01h05');
  });
});

describe('narrative.js : chaque entrée de contenu est atteignable', () => {
  it('night.js : chaque réserve de lignes a une clé', () => {
    const kinds = [
      'bark', 'bark:saturday', 'bark:police', 'bell:before', 'bell:strike',
      ...Object.keys(BELL.after).map((k) => `bell:after:${k}`),
      ...Object.keys(WAITER_LINES).filter((k) => k !== 'theo').map((k) => `waiter:${k}`),
      ...Object.keys(WAITER_LINES.theo).map((k) => `waiter:theo:${k}`),
      ...Object.keys(WITNESS_LINES).map((k) => `witness:${k}`),
      ...Object.keys(NIGHT_END).map((k) => `end:${k}`),
    ];
    const reached = new Set(kinds.map((k) => nightPool(k)));
    const pools = [
      BARKS.weekday, BARKS.saturday, BARKS.police_passing, BELL.before, BELL.strike, ...Object.values(BELL.after),
      ...Object.entries(WAITER_LINES).filter(([k]) => k !== 'theo').map(([, v]) => v), ...Object.values(WAITER_LINES.theo),
      ...Object.values(WITNESS_LINES), ...Object.values(NIGHT_END),
    ];
    for (const p of pools) expect(reached.has(p), p[0]).toBe(true);
  });

  it('pickNightLine atteint chaque ligne par un état de nuit', () => {
    const night = (key, extraState = {}) => ({ day: { key }, state: { tables: [], police: null, endReason: 'time', ...extraState }, cfg: { RULES: { terraceCloseHour: 22 } } });
    const cases = [
      [BARKS.weekday, 'bark', night('mon'), cycler(false), {}],
      [BARKS.saturday, 'bark', night('sat'), cycler(true), {}],
      [BARKS.police_passing, 'bark', night('mon', { police: { phase: 'onsite' } }), cycler(true), {}],
      [BELL.before, 'bell:before', night('mon'), cycler(), {}],
      [BELL.strike, 'bell:strike', night('mon'), cycler(), {}],
      [BELL.after.all_cleared, 'bell:after', night('mon', { tables: [{ out: false }] }), cycler(), {}],
      [BELL.after.some_out, 'bell:after', night('mon', { tables: [{ out: true }, { out: false }] }), cycler(), { outAt22: 2 }],
      [BELL.after.none_cleared, 'bell:after', night('mon', { tables: [{ out: true }] }), cycler(), {}],
      [BELL.after.saturday, 'bell:after', night('sat'), cycler(), {}],
      [WITNESS_LINES.nobody, 'witness', night('mon'), cycler(), {}],
      [WITNESS_LINES.customers_filmed, 'witness', night('mon'), cycler(), { witness: { kind: 'customers', filmed: true } }],
      ...['klaas', 'seb_nico', 'waiter', 'customers', 'biloute', 'dede', 'ghislain', 'police']
        .map((k) => [WITNESS_LINES[k], 'witness', night('mon'), cycler(), { witness: { kind: k } }]),
      ...Object.keys(NIGHT_END).map((r) => [NIGHT_END[r], 'end', night('mon'), cycler(), { reason: r }]),
      ...['early', 'offduty', 'cooldown', 'none'].map((r) => [WAITER_LINES[r], 'waiter', night('mon', { min: 21 * 60 + 50 }), cycler(), { result: { ok: false, reason: r } }]),
      [WAITER_LINES.ok, 'waiter', night('mon'), cycler(), { result: { ok: true } }],
      [WAITER_LINES.refused, 'waiter', night('mon'), cycler(), { result: { ok: false } }],
      [WAITER_LINES.refused_bloc_knows, 'waiter', night('mon', { blocKnows: true }), cycler(), { result: { ok: false } }],
      [WAITER_LINES.theo.ok, 'waiter', night('mon'), cycler(), { result: { ok: true }, metWaiter: true }],
      [WAITER_LINES.theo.refused, 'waiter', night('mon'), cycler(), { result: { ok: false }, metWaiter: true }],
    ];
    for (const [pool, kind, sim, rng, extra] of cases) {
      const outs = new Set();
      for (let i = 0; i < pool.length * 3; i++) outs.add(pickNightLine(kind, sim, rng, extra));
      for (const l of pool) {
        if (guardOf(l) && !holds(guardOf(l), sim)) continue; // ligne gardée (§13.L) : hors de cet état de nuit
        const tl = textOf(l);
        const ok = [...outs].some((o) => o === tl || o === fill(tl, { n: 10 }));
        expect(ok, `${kind} → ${l}`).toBe(true);
      }
    }
    expect(waiterReason({ ok: false }, { blocKnows: true })).toBe('refused_bloc_knows');
  });

  it('police : chaque ligne, chaque patrouille, chaque issue', () => {
    for (const patrol of ['lemaire', 'benali', 'chief']) {
      for (const outcome of Object.keys(POLICE_LINES[patrol])) {
        const pool = policePool(outcome, patrol);
        expect(pool, `${patrol}/${outcome}`).toBe(POLICE_LINES[patrol][outcome]);
        const rng = cycler();
        const outs = new Set(pool.map(() => policeLine(outcome, patrol, {}, rng)));
        expect(outs.size, `${patrol}/${outcome}`).toBe(new Set(pool).size);
      }
    }
    expect(policePool('call', null)).toBe(POLICE_LINES.call.normal);
    expect(policePool('call', null, { asso: true })).toBe(POLICE_LINES.call.asso);
    expect(policePool('ignored', 'benali')).toBe(POLICE_LINES.ignored);
    expect(policePool('busy', 'lemaire')).toBe(POLICE_LINES.busy);
  });

  it('carnet de Klaas : precise au-dessus du seuil, vague en dessous, rien à 0', () => {
    for (const about of Object.keys(KLAAS_NOTEBOOK).filter((k) => k !== 'bedtime')) {
      for (const [det, key] of [[0.9, 'precise'], [KLAAS_PRECISE_AT - 0.01, 'vague']]) {
        const pool = KLAAS_NOTEBOOK[about][key];
        const rng = cycler();
        const got = pool.map(() => klaasEntry({ about }, det, rng));
        expect(got.every((g) => g.precise === (key === 'precise'))).toBe(true);
        expect(new Set(got.map((g) => g.text)).size, `${about}/${key}`).toBe(new Set(pool).size);
      }
      expect(klaasEntry({ about }, 0)).toBeNull();
    }
    expect(klaasEntry({ about: 'bedtime' }, 0).text).toBe(KLAAS_NOTEBOOK.bedtime[0]);
    expect(klaasEntry({ about: 'bucket', time: '23h00' }, 0.9).text).toContain('seau');
  });

  it('manchettes : chacune gagne pour au moins un bilan', () => {
    const base = { reason: 'time', saturday: false, ratio: 0, acts: 0, complaisance: 0, tipoffs: 0, ignored: 0, pees: 0, bucket: 0, pieces: 0, witnesses: 0, scandal: false, blocKnows: false, allOnTime: false };
    for (const h of RECAP_HEADLINES) {
      const m = { ...base };
      for (const [k, v] of Object.entries(h.when)) {
        if (typeof v === 'boolean' || k === 'reason') m[k] = v;
        else { let x = 0; while (!compare(x, v) && x < 100) x += 0.25; m[k] = x; }
      }
      expect(pickHeadline(m).id).toBe(h.id);
    }
  });

  it('tutoriel : chaque invite sort sur son déclencheur ; intro ≤ 6 cartes', () => {
    expect(introCards()).toBe(INTRO_CARDS);
    expect(INTRO_CARDS.length).toBeLessThanOrEqual(6);
    for (const t of TUTORIAL) {
      const earlier = TUTORIAL.filter((x) => x.trigger === t.trigger && x !== t && TUTORIAL.indexOf(x) < TUTORIAL.indexOf(t)).map((x) => x.id);
      expect(tutorialPrompt(t.trigger, { ...ctxSatisfying(t.when), seenTutorial: earlier })?.id).toBe(t.id);
    }
    expect(TUTORIAL_TRIGGERS).toContain('bell_22');
    const seenAll = { day: 1, seenTutorial: TUTORIAL.map((t) => t.id) };
    for (const tr of TUTORIAL_TRIGGERS) expect(tutorialPrompt(tr, seenAll)).toBeNull();
  });

  it('J14 : chaque réplique de la scène sort pour au moins un état', () => {
    const scene = EVENTS.find((e) => e.id === 'd14_commission').scene;
    expect(scene.length).toBeGreaterThan(10);
    for (const p of scene) {
      const out = commissionScene(ctxSatisfying(p.when));
      expect(out.some((x) => x.text === p.text && x.name), p.text.slice(0, 40)).toBe(true);
    }
    // Un dossier vide n'a pas les mêmes discours qu'un dossier plein
    const weak = commissionScene({ day: 14, stats: { dossier: 10 }, flags: ['bucket_witnessed'] }).map((x) => x.text);
    const strong = commissionScene({ day: 14, stats: { dossier: 80 }, flags: ['corridor_measured', 'ac_violation_confirmed'] }).map((x) => x.text);
    expect(weak).not.toEqual(strong);
  });

  it('dialogue.js : chaque entrée est proposée par dialogueFor', () => {
    for (const d of DIALOGUE) {
      expect(dialogueFor(d.speaker, ctxSatisfying(d.when)).includes(d), d.id).toBe(true);
    }
    const d0 = DIALOGUE.find((d) => d.once !== false);
    expect(dialogueFor(d0.speaker, ctxSatisfying(d0.when), { seen: [d0.id] }).includes(d0)).toBe(false);
  });

  it('media.js : chaque message sort dans mediaFeed, chaque une de fin dans mediaEnding', () => {
    for (const feed of ['whatsapp', 'press', 'social']) {
      for (const x of MEDIA[feed]) {
        if (x.ending) {
          const st = ctxSatisfying(x.when);
          expect(mediaEndingFeed(x.ending, st)[feed].includes(x), x.id).toBe(true);
          if (feed === 'press') expect(mediaEnding(x.ending, st), x.id).toBe(x);
          continue;
        }
        const st = ctxSatisfying(x.when);
        expect(mediaFeed(st, st.day)[feed].includes(x), x.id).toBe(true);
      }
    }
  });
});

describe('narrative.js : aucune {variable} non remplie', () => {
  const ctxKeys = (o) => new Set(Object.keys(o));
  const sim0 = NIGHTS[0];
  const table0 = sim0.state.tables[0];
  const KEYS = {
    table: ctxKeys(nightCtx.table(sim0, table0)),
    tipoff: ctxKeys(nightCtx.tipoff(sim0, { tippedAt: 1300, arrivedAt: 1305, returnAt: 1320, restId: 'bernadette', tableIds: [1] })),
    police: ctxKeys(nightCtx.police(sim0, { calledAt: 1300, arrivedAt: 1310, restId: 'bernadette', patrolId: 'lemaire', callId: 1 })),
    pee: ctxKeys(nightCtx.pee(sim0, { start: 1300, doorway: { label: 'la porte de Pilou' } })),
    clatter: ctxKeys(nightCtx.clatter(sim0, 'bernadette', 2)),
    pilou: ctxKeys(nightCtx.pilou(sim0, 'seau d\'eau')),
    waiter: ctxKeys(nightCtx.waiter(sim0)),
    none: new Set(),
  };
  const KLAAS_CTX = { over: 'table', late: 'table', corridor: 'table', complaisance: 'police', tipoff: 'tipoff', police_act: 'police', pee: 'pee', clatter: 'clatter', pilou: 'pilou', bedtime: 'none' };
  const lines = (x) => (Array.isArray(x) ? x : Object.values(x).flatMap(lines));
  const covered = (text, keys) => placeholders(text).filter((k) => !keys.has(k));

  it('gabarits : chaque variable est fournie par le contexte de son point d\'appel', () => {
    for (const [about, ctx] of Object.entries(KLAAS_CTX)) for (const l of lines(KLAAS_NOTEBOOK[about])) expect(covered(l, KEYS[ctx]), l).toEqual([]);
    const policeKeys = new Set([...KEYS.police]);
    for (const l of lines(POLICE_LINES)) expect(covered(l, policeKeys), l).toEqual([]);
    for (const l of lines(WAITER_LINES)) expect(covered(l, KEYS.waiter), l).toEqual([]);
    for (const l of [...lines(BARKS), ...lines(BELL), ...lines(WITNESS_LINES), ...lines(NIGHT_END)]) expect(placeholders(l), l).toEqual([]);
    for (const h of RECAP_HEADLINES) expect(placeholders(h.text), h.id).toEqual([]);
    for (const t of [...INTRO_CARDS, ...TUTORIAL]) expect(placeholders(t.text), t.id).toEqual([]);
    for (const p of EVENTS.find((e) => e.id === 'd14_commission').scene) expect(placeholders(p.text)).toEqual([]);
  });

  it('nuits réelles : police, tuyaux, tables, pipis, serveur remplis sans trou', () => {
    let tipoffs = 0, visits = 0, pees = 0;
    const check = (text) => { const missing = []; fill(text, {}, { missing }); return missing; };
    for (const sim of NIGHTS) {
      for (const e of sim.state.policeLog) {
        if (e.outcome === 'ignored') continue;
        visits++;
        const ctx = nightCtx.police(sim, e);
        for (const out of ['arrive', e.outcome === 'act' ? 'act' : e.outcome]) {
          for (const l of policePool(out, e.patrolId) ?? []) {
            const missing = [];
            expect(fill(l, ctx, { missing })).not.toMatch(/\{\w+\}/);
            expect(missing, l).toEqual([]);
          }
        }
        for (const l of lines(KLAAS_NOTEBOOK.complaisance)) expect(check(fill(l, ctx))).toEqual([]);
      }
      for (const tip of sim.state.tipoffs) {
        tipoffs++;
        const ctx = nightCtx.tipoff(sim, tip);
        for (const l of lines(KLAAS_NOTEBOOK.tipoff)) { const m = []; fill(l, ctx, { missing: m }); expect(m, l).toEqual([]); }
      }
      for (const p of sim.state.pees) {
        pees++;
        const ctx = nightCtx.pee(sim, p);
        for (const l of lines(KLAAS_NOTEBOOK.pee)) { const m = []; fill(l, ctx, { missing: m }); expect(m, l).toEqual([]); }
      }
      for (const t of sim.state.tables) {
        const ctx = nightCtx.table(sim, t);
        for (const k of ['over', 'late', 'corridor']) for (const l of lines(KLAAS_NOTEBOOK[k])) { const m = []; fill(l, ctx, { missing: m }); expect(m, l).toEqual([]); }
      }
      const h = recapHeadline(sim.summary(), sim.state);
      expect(h.text).toBeTruthy();
      expect(recapHeadline(sim.summary()).id).toBeTruthy();
      expect(['all_cleared', 'some_out', 'none_cleared', 'saturday']).toContain(bellAfterKey(sim));
      expect(pickNightLine('bark', sim)).not.toMatch(/\{\w+\}/);
    }
    expect(visits).toBeGreaterThan(0);
    expect(tipoffs).toBeGreaterThan(0);
    expect(pees).toBeGreaterThan(0);
  });

  it('recapMetrics : le bilan seul ou avec sim.state donne les mêmes issues de police', () => {
    for (const sim of NIGHTS.slice(0, 20)) {
      const a = recapMetrics(sim.summary()), b = recapMetrics(sim.summary(), sim.state);
      for (const k of ['acts', 'complaisance', 'tipoffs', 'ignored']) expect(a[k], k).toBe(b[k]);
    }
  });
});

describe('narrative.js : le rebondissement de la nuit dans le bilan', () => {
  it('nuit calme : la ligne du rebondissement devient la manchette ; sinon elle vient en sous-titre', async () => {
    const { TWISTS } = await import('../../src/content/twists.js');
    const quiet = { reason: 'time', dayLabel: 'Lundi', dossier: { score: 0, target: 10, pieces: 0 }, police: [], verdict: [], restaurants: [] };
    const t = TWISTS.find((x) => x.pool);
    const a = recapHeadline(quiet, undefined, t);
    expect(a.text).toBe(t.lines.recap[0]);
    expect(a.twist).toBe(t.id);
    const busy = { ...quiet, police: [{ outcome: 'café offert, 0 PV' }] };
    const b = recapHeadline(busy, undefined, t.id);
    expect(b.id).toBe('h_complaisance');
    expect(b.sub).toBe(t.lines.recap[0]);
    expect(recapHeadline(quiet).sub).toBeUndefined();
  });
});

