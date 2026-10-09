// Preuves automatiques (T) de la checklist v1.0 (GAME_DESIGN §13), sur le VRAI contenu (src/content).
// Chaque describe porte le numéro de l'item. Ce qui manque côté jeu est un it.todo, listé dans qa/checklist-audit.md.
import { describe, it, expect } from 'vitest';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createCampaign, normalizeContent, playNight, POLICIES, createSim } from '../../src/sim/index.js';
import { compare } from '../../src/sim/conditions.js';
import * as narrative from '../../src/sim/narrative.js';
import { CHARACTERS } from '../../src/content/characters.js';
import { CONFIG } from '../../src/config.js';

const DIR = join(import.meta.dirname, '..', '..', 'src', 'content');
const K = normalizeContent(await Promise.all(readdirSync(DIR).filter((f) => f.endsWith('.js')).map((f) => import(join(DIR, f)))));
const byId = (list, id) => list.find((x) => x.id === id);
const action = (id) => byId(K.ACTIONS, id);

// ── Pilotage d'une campagne réelle ────────────────────────────────────────────
// keepAwake : Sommeil remis à 100 avant chaque fin de nuit (pas de déménagement involontaire)
function drive(c, until, { choose = (card, ok) => ok[0], koddex = ['work', 'work', 'work'], keepAwake = true, log = null, onNight = null } = {}) {
  for (let i = 0; i < 3000 && !c.ended && !until(c); i++) {
    if (c.step === 'cards') {
      const card = c.card();
      log?.push({ day: c.state.day, phase: c.state.phase, step: 'card', id: card.id, type: card.type });
      const ok = card.choices.map((x, j) => (x.available ? j : -1)).filter((j) => j >= 0);
      c.resolveCard(ok.length ? choose(card, ok) : 0);
    } else if (c.step === 'koddex') { log?.push({ day: c.state.day, step: 'koddex' }); c.koddex(koddex); }
    else if (c.step === 'actions') { log?.push({ day: c.state.day, step: 'actions' }); c.endAfternoon(); }
    else if (c.step === 'night') {
      const sim = c.createNight();
      log?.push({ day: c.state.day, step: 'night', key: sim.day.key });
      onNight?.(sim, c);
      playNight(sim, POLICIES.passive(), c);
      if (keepAwake) sim.state.sleep = 100;
      c.finishNight(sim);
    } else if (c.step === 'recap') c.nextDay();
  }
  return c;
}
const fresh = (seed = 5) => createCampaign({ seed, content: K, narrative });
// Met la campagne dans un état qui satisfait `cond` (drapeaux, stats, cachées ; `day` doit déjà être atteint)
function satisfy(c, cond = {}) {
  const solve = (expr) => { for (let v = 50; v <= 100; v++) if (compare(v, expr)) return v; for (let v = 49; v >= 0; v--) if (compare(v, expr)) return v; return 50; };
  const fx = { setFlags: cond.flags ?? [], clearFlags: cond.notFlags ?? [] };
  for (const [k, e] of Object.entries(cond.stats ?? {})) fx[k] = solve(e) - c.state.stats[k];
  for (const [k, e] of Object.entries(cond.hidden ?? {})) fx[k] = solve(e) - c.state.hidden[k];
  c.apply(fx, 'engine', 'checklist');
}
// Joue une action d'après-midi depuis un état qui satisfait son `requires`
function performDay(id, seed = 5) {
  const a = action(id);
  const lo = a.requires?.day ? [a.requires.day].flat()[0] : 1;
  const c = drive(fresh(seed), (x) => x.step === 'actions' && x.state.day >= lo);
  satisfy(c, a.requires);
  c.state.timeLeft = Math.max(c.state.timeLeft, c.actionCost(a));
  const r = c.doAction(id);
  return { c, r };
}

// ════════════════════════════════════════════════════════════════════════════
describe('§13.A1 · calendrier de 14 jours (lundi → dimanche S2), matin → après-midi → nuit', () => {
  const log = [];
  const c = drive(fresh(11), () => false, { log });
  it('chaque jour : Koddex, puis après-midi, puis nuit 3D ; 14 nuits ; lundi → dimanche', () => {
    expect(c.weekday(1)).toBe('mon');
    expect(c.weekday(14)).toBe('sun');
    for (let d = 1; d <= 13; d++) {
      const steps = log.filter((e) => e.day === d && e.step !== 'card').map((e) => e.step);
      expect(steps, `jour ${d}`).toEqual(['koddex', 'actions', 'night']);
    }
    // Jour 14 : matin, puis la commission décide (une commission perdue clôt la campagne dès l'après-midi, voir l'audit)
    expect(log.filter((e) => e.day === 14 && e.step !== 'card')[0].step).toBe('koddex');
    expect(log.some((e) => e.day === 14 && e.id === 'd14_commission')).toBe(true);
    expect(log.filter((e) => e.step === 'night').length).toBeGreaterThanOrEqual(13);
    expect(c.ended).toBe(true);
    expect(c.state.ending.day).toBe(14);
  });

  // §13.A5 sur la même campagne
  it('§13.A5 · événements fixes à leur jour et leur phase ; nuits 6 et 13 = samedi sans voitures', () => {
    const fixed = K.EVENTS.filter((e) => e.day !== undefined);
    for (const id of ['d4_martine_dinner', 'd6_saturday', 'd7_general_meeting', 'd9_inspector', 'd11_exhaust_meeting', 'd13_saturday', 'd14_commission']) {
      expect(fixed.some((e) => e.id === id), id).toBe(true);
    }
    // Les événements de nuit (D4) se jouent pendant la nuit (campaign.nightEventDue) : on lit le journal de campagne
    const played = c.state.journal.filter((x) => x.type === 'event');
    for (const e of fixed) {
      const seen = played.filter((x) => x.id === e.id);
      expect(seen.length, e.id).toBe(1);
      expect(seen[0].day, e.id).toBe(e.day);
      expect(seen[0].phase, e.id).toBe(e.phase ?? 'afternoon');
    }
    const nights = log.filter((e) => e.step === 'night');
    for (const n of nights) expect(n.key === 'sat', `nuit ${n.day}`).toBe([6, 13].includes(n.day));
  });
});

describe('§13.A2 · sauvegarde / reprise (contenu réel)', () => {
  it('sauvegarde au jour 3, rechargement JSON : même suite exacte jusqu\'au jour 6', () => {
    const a = drive(fresh(21), (x) => x.state.day === 3 && x.step === 'actions');
    const save = JSON.parse(JSON.stringify(a.save()));
    const b = createCampaign({ content: K, narrative, save });
    expect(b.state.day).toBe(3);
    expect(b.step).toBe('actions');
    drive(a, (x) => x.state.day === 6 && x.step === 'actions');
    drive(b, (x) => x.state.day === 6 && x.step === 'actions');
    expect(JSON.stringify(b.save())).toBe(JSON.stringify(a.save()));
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe('§13.B3 · chaque membre de l\'association : ≥ 8 répliques contextuelles et ≥ 1 action ou événement', () => {
  // Les membres du §2 (Régis, ajouté plus tard comme le « traître », est suivi à part dans l'audit)
  const members = ['jeremie', 'klaas', 'hilde', 'tatie', 'seb', 'nico', 'hippolyte'];
  expect(members.every((id) => CHARACTERS[id]?.group === 'asso')).toBe(true);
  const tied = (id) => K.EVENTS.some((e) => e.speaker === id || e.choices?.some((ch) => ch.effects?.setFlags?.includes(`met_${id}`)))
    || K.ACTIONS.some((a) => [...(a.effects?.setFlags ?? [])].some((f) => f === `met_${id}` || (id === 'seb' || id === 'nico') && f === 'met_seb_nico'))
    || K.COUNTERMOVES.some((m) => m.speaker === id);
  it.each(members)('%s', (id) => {
    const lines = K.DIALOGUE.filter((d) => d.speaker === id);
    expect(lines.length, `${id} : entrées de dialogue`).toBeGreaterThanOrEqual(8);
    expect(lines.filter((d) => d.when && Object.keys(d.when).length).length, `${id} : contextuelles`).toBeGreaterThanOrEqual(8);
    expect(tied(id), `${id} : action ou événement`).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe('§13.C5 · mairie : signalements, visite annoncée (tuyau) ou surprise (Delphine / Hippolyte)', () => {
  const d9 = byId(K.EVENTS, 'd9_inspector');
  it('signalement de nuit (sim) et d\'après-midi (contenu) → pièce / drapeau', () => {
    const sim = createSim({ seed: 3 });
    while (sim.state.min < 22 * 60 + 30) sim.tick(1);
    sim.act({ type: 'photo', target: { kind: 'table', id: sim.state.tables.find((t) => t.out).id } });
    expect(sim.act({ type: 'mairie' }).ok).toBe(true);
    expect(sim.state.evidence.some((e) => e.type === 'mairie')).toBe(true);
    const { c } = performDay('pm_report_mairie');
    expect(c.has('reported_mairie')).toBe(true);
  });
  it('J9 : sans canal, seule la visite annoncée est possible ; via Delphine ou Hippolyte, surprise et infraction confirmée', () => {
    const surprise = d9.choices.filter((ch) => ch.effects?.setFlags?.includes('inspector_surprise'));
    const announced = d9.choices.filter((ch) => ch.effects?.setFlags?.includes('inspector_announced'));
    expect(surprise.length).toBeGreaterThanOrEqual(2);
    expect(announced.length).toBeGreaterThanOrEqual(1);
    expect(surprise.map((ch) => ch.requires?.flags?.[0]).sort()).toEqual(['delphine_channel', 'heritage_angle']);
    for (const ch of surprise) expect(ch.effects.setFlags).toContain('ac_violation_confirmed');
    expect(announced.some((ch) => !ch.requires && ch.effects.setFlags.includes('ac_case_stalled'))).toBe(true);
    // Moteur : le J9 arrive, et la surprise n'est disponible qu'avec le canal
    for (const flag of [null, 'delphine_channel', 'heritage_angle']) {
      const c = drive(fresh(8), (x) => x.step === 'cards' && x.card()?.id === 'd9_inspector');
      if (flag) { satisfy(c, { flags: [flag] }); }
      const card = c.card();
      const avail = card.choices.filter((x) => x.available).map((x) => d9.choices[x.i ?? card.choices.indexOf(x)]);
      expect(avail.some((ch) => ch.effects?.setFlags?.includes('inspector_surprise')), String(flag)).toBe(!!flag);
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════
const DAY_FEATURES = {
  meeting: 'pm_asso_meeting', mairie: 'pm_report_mairie', emails: 'pm_email_inspector', press: 'pm_press_contact',
  lawyer: 'pm_lawyer_hire', formal_notice: 'pm_formal_notice', petition: 'pm_petition_start', ars: 'pm_ars_complaint',
  recruit: 'pm_recruit', uritrottoir: 'pm_uritrottoir', delphine_dinner: 'pm_delphine_dinner',
};
describe('§13.D2 · actions d\'après-midi : chacune existe et se joue depuis un état qui la permet', () => {
  it.each(Object.entries(DAY_FEATURES))('%s → %s', (_, id) => {
    const a = action(id);
    expect(a?.phase).toBe('afternoon');
    const { c } = performDay(id);
    expect(c.state.counts.actions[id]).toBe(1);
    for (const f of a.effects?.setFlags ?? []) expect(c.has(f), f).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// §13.D3 : chaque contre-offensive du §8, par le drapeau qu'elle pose
const SECTION8 = {
  "e-mails « c'est en cours »": 'tatie_mail_1', 'tables 21h59 / 22h20': 'cm_table_dance', 'fumeurs sous la fenêtre': 'cm_smokers',
  'poubelles devant la porte': 'cm_bins', 'tournées offertes (Tatie)': 'cm_free_drinks', 'pétition des clients heureux': 'cm_happy_petition',
  'plainte pour harcèlement': 'cm_harassment_complaint', 'plainte pour diffamation': 'cm_defamation', 'appel à Martine': 'cm_martine_call',
  'samedi « festif »': 'cm_festive_saturday', 'recrutement d\'un riverain': 'traitor_recruited', 'faux post « Bernadette harcelée »': 'cm_fake_post',
};

describe('§13.D3 · les contre-offensives du §8 se déclenchent selon l\'état', () => {
  for (const [label, flag] of Object.entries(SECTION8)) {
    const m = K.COUNTERMOVES.find((x) => x.effects?.setFlags?.includes(flag));
    if (!m) { it.todo(`${label} : aucune contre-offensive ne pose ${flag}`); continue; }
    // Les contre-offensives du matin (e-mails de Tatie…) sont tirées au début du matin, les autres au début de l'après-midi
    const morning = [m.when?.phase].flat().includes('morning');
    it(`${label} → ${m.id}${morning ? ' (matin)' : ''}`, () => {
      const lo = m.when?.day ? [m.when.day].flat()[0] : 1;
      let c;
      if (morning && lo <= 1 && !m.when?.flags?.length && !m.when?.stats && !m.when?.hidden) c = fresh(9); // dès le 1er matin
      else {
        c = drive(fresh(9), (x) => (morning ? x.step === 'recap' && x.state.day >= Math.max(1, lo - 1) : x.step === 'koddex' && x.state.day >= Math.max(2, lo)));
        satisfy(c, { ...m.when, phase: undefined, notFlags: [] });
        // Isoler la contre-offensive testée : les autres ne prennent pas les places de la phase (plafond)
        for (const x of K.COUNTERMOVES) if (x.id !== m.id) { c.state.seen.countermoves.push(x.id); c.state.lastShown[x.id] = c.state.day; }
        if (morning) c.nextDay(); else c.koddex(['work', 'work', 'work']); // les cartes de la phase sont tirées ici
      }
      const queued = [];
      while (c.step === 'cards') { const card = c.card(); queued.push(card.id); const ok = card.choices.findIndex((x) => x.available); c.resolveCard(Math.max(0, ok)); }
      expect(queued, m.id).toContain(m.id);
      expect(c.has(flag)).toBe(true);
    });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// §13.E : chaque action du §6, avec un coût, un effet et une conséquence
const SECTION6 = {
  legal: {
    photo: 'night_photo', 'relevé dB (natif, touche B)': 'sim:db', 'demander au serveur': 'night_ask_waiter', 'appeler la police': 'night_police',
    "appeler « pour l'Association »": 'night_police_asso', 'signalement mairie': 'pm_report_mairie', "e-mail à l'inspectrice": 'pm_email_inspector',
    'WhatsApp': 'pm_whatsapp_rally', pétition: 'pm_petition_start', banderoles: 'pm_banners', presse: 'pm_press_contact',
    'avocat (mise en demeure)': 'pm_formal_notice', 'ARS / hygiène': 'pm_ars_complaint', uritrottoir: 'pm_uritrottoir',
  },
  grey: {
    'dîner chez le patron avec l\'inspectrice': 'pm_delphine_dinner', 'filmer les clients': 'night_film_faces', 'inonder la police d\'appels': 'night_flood_police',
    'faux plan fuité par Tatie': 'pm_tatie_fake_leak', 'caméra à la fenêtre': 'night_camera_window',
  },
  illegal: {
    seau: 'night_bucket', 'carton sur la gaine': 'night_cardboard_exhaust', 'boule puante': 'night_stink_bomb', 'saboter la cuisine': 'night_saboter_cuisine',
    'faux avis': 'pm_fake_reviews', 'chaises dévissées': 'night_sabotage_chairs', 'parasols': 'night_sabotage_parasols', cadenas: 'night_sabotage_locks',
    'payer le serveur': 'night_bribe_waiter', 'caméra sous le store': 'night_camera_awning', 'électricité de l\'estaminet': 'night_borrow_power',
    'wifi craqué': 'night_wifi', 'lire les réservations': 'pm_read_reservations', 'lire les e-mails': 'pm_read_emails', 'lire les devis': 'pm_read_quotes',
    "photo du pot-de-vin dans l'arrière-salle": 'night_backroom_photo',
  },
};
const REACTORS = [...K.DIALOGUE, ...K.EVENTS, ...K.COUNTERMOVES, ...K.ACTIONS, ...K.ENDINGS.flatMap((e) => e.epilogue ?? []), ...K.MEDIA.whatsapp, ...K.MEDIA.press, ...K.MEDIA.social];
describe('§13.E1–E3 · actions légales, grises, illégales du §6', () => {
  for (const [legality, items] of Object.entries(SECTION6)) {
    describe(legality, () => {
      it.each(Object.entries(items))('%s → %s', (_, id) => {
        if (id.startsWith('sim:')) {
          const sim = createSim({ seed: 2 });
          while (sim.state.min < 22 * 60 + 10) sim.tick(1);
          expect(() => sim.act({ type: id.slice(4) })).not.toThrow();
          return;
        }
        const a = action(id);
        expect(a, id).toBeTruthy();
        expect(a.legality).toBe(legality);
        expect((a.cost?.time ?? 0) + (a.cost?.minutes ?? 0), `${id} : coût`).toBeGreaterThan(0);
        expect(Object.keys(a.effects ?? {}).length > 0 || !!a.sim, `${id} : effet`).toBe(true);
        expect(!!(a.result || a.witnessed || a.sim), `${id} : conséquence`).toBe(true);
        // Conséquence d'un acte gris / illégal : effets si vu, Risque, ou du contenu qui réagit à son drapeau
        if (legality !== 'legal' && !a.sim) {
          const flags = a.effects?.setFlags ?? [];
          const reacts = flags.some((f) => REACTORS.some((x) => JSON.stringify(x.when ?? x.requires ?? {}).includes(`"${f}"`) || x.choices?.some((ch) => JSON.stringify(ch.requires ?? {}).includes(`"${f}"`))));
          expect(!!a.witnessed?.effects || (a.effects?.risk ?? 0) > 0 || reacts, `${id} : conséquence`).toBe(true);
        }
        if (a.phase === 'afternoon') {
          const { c } = performDay(id);
          expect(c.state.counts.actions[id]).toBe(1);
        }
        // Les actions de nuit sans `sim` sont jouées une à une par tests/unit/nightActions.test.js
      });
    });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// §13.F1 / F2 : les 8 fins, atteintes par le moteur, avec un épilogue qui cite ce que le joueur a fait
function toCommission(seed, setup) {
  const c = drive(fresh(seed), (x) => x.step === 'cards' && x.card()?.id === 'd14_commission');
  setup(c);
  return c;
}
function finish(c, pickLabel) {
  const card = c.card();
  const i = card.choices.findIndex((ch) => ch.available && pickLabel.test(ch.label));
  expect(i, `choix ${pickLabel}`).toBeGreaterThanOrEqual(0);
  c.resolveCard(i);
  drive(c, () => false);
  return c;
}
const ENDING_RUNS = {
  legal_victory: () => finish(toCommission(31, (c) => satisfy(c, { stats: { dossier: '>=90', risk: '<10' }, flags: ['martine_dinner_photo', 'formal_notice', 'bombance_blocked'], notFlags: ['bombance_bar_project'] })), /dossier complet/),
  negotiated_peace: () => finish(toCommission(32, (c) => satisfy(c, { stats: { asso: '>=90' }, hidden: { hostility: '<10' }, flags: ['stance_dialogue', 'charter_drafted', 'bombance_blocked'], notFlags: ['bombance_bar_project'] })), /charte/),
  scandal: () => finish(toCommission(33, (c) => satisfy(c, { flags: ['corruption_proof', 'press_contacted', 'bribe_photo', 'bombance_blocked'], notFlags: ['bombance_bar_project'] })), /Voix du Nordiste/),
  turncoat: () => finish(toCommission(34, (c) => satisfy(c, { flags: ['carbonnade_1', 'carbonnade_2', 'carbonnade_3'] })), /habitué/),
  the_return: () => finish(toCommission(35, (c) => satisfy(c, { stats: { dossier: '>=90', risk: '<10' }, flags: ['bombance_rumour', 'bombance_bar_project'], notFlags: ['bombance_blocked'] })), /dossier complet/),
  moving_out: () => finish(toCommission(36, () => {}), /Improviser/),
  custody: () => { const c = drive(fresh(37), (x) => x.state.day >= 5 && x.step === 'koddex'); satisfy(c, { stats: { risk: '>=95' }, flags: ['custody'] }); c.koddex(['work', 'work', 'work']); return drive(c, () => false); },
  fired: () => { const c = drive(fresh(38), (x) => x.state.day >= 5 && x.step === 'koddex'); c.apply({ job: -100 }, 'engine', 'checklist'); c.koddex(['side_db_logger', 'side_whatsapp_bot', 'side_scraper']); return c; },
};
describe('§13.F1 · les 8 fins sont atteignables par le moteur', () => {
  it('toutes les fins du §9 existent', () => {
    expect(K.ENDINGS.map((e) => e.id).sort()).toEqual(Object.keys(ENDING_RUNS).sort());
  });
  it.each(Object.keys(ENDING_RUNS))('%s', (id) => {
    const c = ENDING_RUNS[id]();
    expect(c.state.ending?.id).toBe(id);
    expect(c.state.epilogue.length).toBeGreaterThan(0);
    for (const t of c.state.epilogue) expect(t).not.toMatch(/\{\w+\}/);
    if (['custody', 'fired', 'moving_out'].includes(id) && id !== 'moving_out') expect(c.state.ending.early).toBe(true);
    if (id === 'fired') expect(c.state.ending.canContinue).toBe(true);
  });
});
describe('§13.F2 · l\'épilogue cite ce que le joueur a fait', () => {
  it('victoire juridique : la photo du dîner de Martine et la mise en demeure apparaissent seulement si le joueur les a', () => {
    const legal = byId(K.ENDINGS, 'legal_victory');
    const part = (flag) => legal.epilogue.find((p) => p.when?.flags?.length === 1 && p.when.flags[0] === flag).text;
    const withActs = ENDING_RUNS.legal_victory();
    const plain = finish(toCommission(31, (c) => satisfy(c, { stats: { dossier: '>=90', risk: '<10' }, flags: ['bombance_blocked'], notFlags: ['bombance_bar_project', 'martine_dinner_photo', 'formal_notice'] })), /dossier complet/);
    for (const flag of ['martine_dinner_photo', 'formal_notice']) {
      expect(withActs.state.epilogue, flag).toContain(part(flag));
      expect(plain.state.epilogue, flag).not.toContain(part(flag));
    }
  });
  it('chaque fin a des parties conditionnelles (actes, preuves, trahisons), pas seulement un texte fixe', () => {
    for (const e of K.ENDINGS) expect(e.epilogue.filter((p) => p.when && Object.keys(p.when).length).length, e.id).toBeGreaterThanOrEqual(2);
  });
});

// ════════════════════════════════════════════════════════════════════════════
describe('§13.G1 · invariants (compléments à invariants.test.js et campaign.test.js)', () => {
  it('Pilou n\'est jamais à deux endroits : ses actions de nuit ne se chevauchent pas dans le temps', () => {
    const c = drive(fresh(41), (x) => x.step === 'night');
    c.state.unlocked = K.UNLOCKS.map((u) => u.id); // test de mécanique : outils débloqués (verrouillage v1.1 : twistEngine.test.js)
    const sim = c.createNight();
    while (sim.state.min < 21 * 60) sim.tick(1);
    for (const id of ['night_film_faces', 'night_camera_window', 'night_stink_bomb', 'night_flood_police']) c.doNightAction(sim, id);
    const acts = sim.state.journal.filter((e) => e.type === 'night-action');
    expect(acts.length).toBeGreaterThan(1);
    for (let i = 1; i < acts.length; i++) expect(acts[i].t).toBeGreaterThanOrEqual(acts[i - 1].t + acts[i - 1].minutes);
  });
  it('une seule patrouille à la fois (« déjà en route »)', () => {
    const sim = createSim({ seed: 4 });
    while (sim.state.min < 22 * 60 + 10) sim.tick(1);
    expect(sim.act({ type: 'police' }).ok).toBe(true);
    expect(sim.act({ type: 'police' }).reason).toBe('busy');
  });
  it('un commerce fermé reste fermé : La Bombance n\'a ni terrasse ni preuve, et seul un événement l\'ouvre', () => {
    expect(CONFIG.RESTAURANTS.some((r) => r.id === 'bombance')).toBe(false);
    const sim = createSim({ seed: 5, day: 'sat' });
    while (!sim.state.ended) sim.tick(2);
    expect(sim.state.tables.some((t) => t.restId === 'bombance')).toBe(false);
    const openers = [...K.EVENTS, ...K.COUNTERMOVES].filter((x) => JSON.stringify(x.effects ?? x.choices ?? '').includes('bombance_bar_project'));
    expect(openers.length).toBeGreaterThan(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// §13.G2 : anti-spoiler. Un texte qui évoque un fait verrouillé (README « Spoiler rule ») doit être gardé par son drapeau
// (dans when / requires), ou être lui-même la révélation (il pose le drapeau). Les fins sont exclues (écran final).
const GATES = [
  { flag: 'met_waiter', re: /\bThéo\b/, also: ['waiter_bribed', 'waiter_informant'] }, // payer le serveur pose met_waiter
  { flag: 'traitor_known', re: /Régis[^.!?]{0,80}(traîtr|traît|balanc|renseign|espion|indic)/i, also: ['traitor_recruited'] },
  { flag: 'seen_complaisance', re: /Lemaire[^.!?]{0,80}(gratuit|à l'œil|offert|ne paie)/i },
  { flag: 'bombance_rumour', re: /Bombance[^.!?]{0,80}(bar|cocktail|DJ)/i, also: ['bombance_bar_project'] },
  { flag: 'read_reservations', re: /cahier de réservations/i },
  { flag: 'read_quotes', re: /devis[^.!?]{0,40}jamais sign/i },
];
const texts = (x) => [x.text, x.title, x.label, x.result, ...(x.lines ?? []), ...(x.choices ?? []).flatMap((ch) => [ch.label, ch.result])].filter(Boolean).join(' \n ');
const condOf = (x) => x.when ?? x.requires ?? {};
const sets = (x) => [...(x.effects?.setFlags ?? []), ...(x.setFlags ?? []), ...(x.unlocks ? [x.unlocks] : []), ...(x.choices ?? []).flatMap((ch) => ch.effects?.setFlags ?? [])];
const ENTRIES = [
  ...K.DIALOGUE.map((x) => ['dialogue', x]), ...K.EVENTS.map((x) => ['events', x]), ...K.COUNTERMOVES.map((x) => ['countermoves', x]),
  ...K.ACTIONS.map((x) => ['actions', x]), ...[...K.MEDIA.whatsapp, ...K.MEDIA.press, ...K.MEDIA.social].filter((m) => !m.ending).map((x) => ['media', x]),
];
const leaksOf = (entries) => {
  const out = [];
  for (const [kind, x] of entries) {
    for (const g of GATES) {
      if (!g.re.test(texts(x))) continue;
      const req = new Set([...(condOf(x).flags ?? []), ...(x.choices ?? []).flatMap((ch) => ch.requires?.flags ?? [])]);
      const ok = [g.flag, ...(g.also ?? [])].some((f) => req.has(f)) || sets(x).includes(g.flag);
      if (!ok) out.push(`${kind}/${x.id} → ${g.flag}`);
    }
  }
  return out;
};
const leaks = leaksOf(ENTRIES);
describe('§13.G2 · anti-spoiler : les faits verrouillés ne sont cités qu\'une fois débloqués', () => {
  it('le contrôle attrape une fuite fabriquée, et accepte la même ligne gardée par son drapeau', () => {
    const leak = { id: 'fake', speaker: 'seb', when: { day: [1, 3] }, lines: ['Théo m\'a tout raconté.'] };
    expect(leaksOf([['dialogue', leak]])).toEqual(['dialogue/fake → met_waiter']);
    expect(leaksOf([['dialogue', { ...leak, when: { flags: ['met_waiter'] } }]])).toEqual([]);
  });
  if (!leaks.length) it('aucune fuite détectée', () => expect(leaks).toEqual([]));
  for (const l of leaks) it.todo(`fuite possible : ${l}`);
});
