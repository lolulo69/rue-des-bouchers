import { describe, it, expect } from 'vitest';
import os from 'node:os';
import { createCampaign, runCampaign, playNight, CAMPAIGN_BOTS, checkCampaignInvariants, evalCondition, makeConfig, POLICIES, SAVE_VERSION, checkSave } from '../../src/sim/index.js';
import * as content from '../fixtures/content.js';

const ctx = (o = {}) => ({ day: 3, phase: 'afternoon', flags: new Set(['a']), stats: { asso: 50, risk: 10 }, hidden: { corruption: 60 }, ...o });

// Avance une campagne jusqu'à une étape donnée avec un bot (sans finir la campagne)
function drive(c, bot, until) {
  for (let i = 0; i < 2000 && !c.ended && !until(c); i++) {
    if (c.step === 'cards') { const card = c.card(); const ok = card.choices.filter((x) => x.available); c.resolveCard(card.type === 'event' && ok.length ? bot.choose(c, card, ok) : 0); }
    else if (c.step === 'koddex') c.koddex(bot.morning(c, c.koddexOptions()));
    else if (c.step === 'actions') { const id = bot.afternoon(c, c.availableActions()); if (id) c.doAction(id); else c.endAfternoon(); }
    else if (c.step === 'night') { const sim = c.createNight(); playNight(sim, bot.night(c, sim), c); c.finishNight(sim); }
    else if (c.step === 'recap') c.nextDay();
  }
  return c;
}

describe('conditions et effets (§14)', () => {
  it('compare, drapeaux, jours, phase, caché', () => {
    expect(evalCondition({ stats: { asso: '>=50', risk: '<30' } }, ctx())).toBe(true);
    expect(evalCondition({ stats: { asso: '>50' } }, ctx())).toBe(false);
    expect(evalCondition({ flags: ['a'], notFlags: ['b'], day: [2, 4], phase: 'afternoon', hidden: { corruption: '!=0' } }, ctx())).toBe(true);
    expect(evalCondition({ notFlags: ['a'] }, ctx())).toBe(false);
    expect(evalCondition({ day: [5, 14] }, ctx())).toBe(false);
    expect(evalCondition({ phase: ['morning', 'night'] }, ctx())).toBe(false);
  });

  it('effets bornés 0–100, drapeaux posés et retirés, preuve légale au dossier', () => {
    const c = createCampaign({ seed: 1, content });
    c.apply({ asso: 500, hostility: -500, setFlags: ['met_klaas'], evidence: { kind: 'x', quality: 0.5, legal: true, label: 'Test' } }, 'story', 'test');
    expect(c.state.stats.asso).toBe(100);
    expect(c.state.hidden.hostility).toBe(0);
    expect(c.has('met_klaas')).toBe(true);
    expect(c.state.stats.dossier).toBeCloseTo(c.cfg.CAMPAIGN.contentEvidenceValue * 0.5);
    c.apply({ clearFlags: ['met_klaas'], evidence: { kind: 'y', legal: false, label: 'Volée' } }, 'story', 'test');
    expect(c.has('met_klaas')).toBe(false);
    expect(c.state.stats.dossier).toBeCloseTo(c.cfg.CAMPAIGN.contentEvidenceValue * 0.5); // l'illégal ne va pas au dossier
  });
});

describe('calendrier de 14 jours', () => {
  it('matin → après-midi → nuit, jour après jour, samedis 6 et 13, événements fixes à leur jour', () => {
    const { c } = runCampaign({ seed: 2, content, bot: CAMPAIGN_BOTS.legal() });
    const phases = c.state.journal.filter((e) => e.type === 'phase');
    expect(phases.slice(0, 3).map((e) => e.phase)).toEqual(['morning', 'afternoon', 'night']);
    const evDays = Object.fromEntries(c.state.journal.filter((e) => e.type === 'event').map((e) => [e.id, [e.day, e.phase]]));
    expect(evDays.martine_dinner).toEqual([4, 'night']);
    expect(evDays.ag).toEqual([7, 'afternoon']);
    if (c.state.ending.id !== 'custody') expect(evDays.commission).toEqual([14, 'afternoon']);
    expect(c.has('saturday1_done')).toBe(true);
    expect(checkCampaignInvariants(c)).toEqual([]);
  });

  it('la nuit des samedis est la variante "sans voitures", et le roster suit le jour de la semaine', () => {
    const c = drive(createCampaign({ seed: 3, content }), CAMPAIGN_BOTS.passive(), (x) => x.state.day === 6 && x.step === 'night');
    const sim = c.createNight();
    expect(sim.day.key).toBe('sat');
    expect(sim.weekday).toBe('sat');
  });

  it('A1 : la campagne se termine juste après la commission du J14 (13 nuits, fin non anticipée)', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const { c } = runCampaign({ seed, content, bot: CAMPAIGN_BOTS.diplomat() });
      if (c.state.ending.early) continue; // garde à vue, licenciement… avant le J14
      expect(c.state.ending.day).toBe(14);
      expect(c.state.nightCount).toBe(13);
      expect(c.state.phase).toBe('afternoon');
      expect(c.has('commission_done')).toBe(true);
      expect(c.state.journal.filter((e) => e.type === 'night-start' && e.day === 14)).toHaveLength(0);
    }
  });

  it('A1 : commission perdue → fin à la commission (early: false), pas la fin anticipée « déménagement »', () => {
    let c;
    for (let seed = 1; seed <= 20 && !c; seed++) {
      const x = drive(createCampaign({ seed, content }), CAMPAIGN_BOTS.diplomat(), (y) => y.state.day === 14 && y.step === 'cards' && y.card()?.id === 'commission');
      if (!x.ended) c = x;
    }
    const lose = c.card().choices.find((ch) => ch.label === 'Improviser').i;
    c.resolveCard(lose);
    expect(c.ended).toBe(true);
    expect(c.state.ending).toMatchObject({ id: 'moving_out', early: false, day: 14 });
  });
});

describe('fins', () => {
  it('pas de fin anticipée avant la nuit 5 : le Risque plafonne à 89', () => {
    const c = createCampaign({ seed: 5, content });
    c.apply({ risk: 100, ending: 'custody' }, 'story', 'test');
    expect(c.state.stats.risk).toBe(c.cfg.CAMPAIGN.preGate.riskCap);
    expect(c.ended).toBe(false);
  });

  it('le bot imprudent finit en garde à vue, jamais avant la nuit 5', () => {
    const nights = [];
    for (let seed = 1; seed <= 20; seed++) {
      const { c } = runCampaign({ seed, content, bot: CAMPAIGN_BOTS.reckless() });
      expect(c.state.ending.id).toBe('custody');
      expect(c.state.ending.day).toBeGreaterThanOrEqual(5);
      nights.push(c.state.ending.day);
    }
    expect(Math.max(...nights)).toBeLessThanOrEqual(10);
  });

  it('épilogue : seulement les parties qui collent, variables remplies', () => {
    // Échelle des gains du contenu à 1 : on teste le remplissage de l'épilogue, pas l'équilibrage
    const c = createCampaign({ seed: 6, content, cfg: makeConfig({ CAMPAIGN: { contentDossierScale: 1 } }) });
    c.apply({ setFlags: ['won_legal', 'met_klaas'], dossier: 70 }, 'story', 'test');
    while (c.state.day < 14) { c.state.day++; }
    c.state.step = 'recap';
    c.nextDay();
    expect(c.state.ending.id).toBe('legal_victory');
    expect(c.state.epilogue).toEqual(['Dossier 70/100, 0 pièces.', 'Klaas sourit.']);
  });

  it('viré : on peut continuer au chômage (plus de Koddex, après-midi plus long)', () => {
    const c = createCampaign({ seed: 7, content });
    for (let d = 1; d < 5; d++) c.state.day++;
    c.state.stats.job = 0;
    c.apply({ job: -1 }, 'story', 'test');
    c.state.step = 'cards'; c.state.cards = [{ type: 'info', id: 'x', title: 'x', text: 'x' }];
    c.resolveCard(0);
    expect(c.state.ending?.id).toBe('fired');
    expect(c.state.ending.canContinue).toBe(true);
    expect(c.continueAfterEnding()).toBe(true);
    expect(c.has('unemployed')).toBe(true);
    expect(c.ended).toBe(false);
  });
});

describe('Risque et témoins', () => {
  it('une action illégale ne coûte du Risque que si quelqu\'un la voit', () => {
    let seenRuns = 0, cleanRuns = 0;
    for (let seed = 1; seed <= 30; seed++) {
      const c = drive(createCampaign({ seed, content }), CAMPAIGN_BOTS.passive(), (x) => x.step === 'actions');
      const before = c.state.stats.risk;
      const { seen } = c.doAction('fake_reviews');
      if (seen.length) { seenRuns++; expect(c.state.stats.risk).toBeGreaterThan(before); } else { cleanRuns++; expect(c.state.stats.risk).toBe(before); }
    }
    expect(seenRuns).toBeGreaterThan(0);
    expect(cleanRuns).toBeGreaterThan(0);
  });

  it('le Risque persiste d\'un jour à l\'autre et décroît lentement', () => {
    const c = drive(createCampaign({ seed: 9, content }), CAMPAIGN_BOTS.passive(), (x) => x.step === 'recap');
    c.apply({ risk: 40 }, 'story', 'test');
    c.nextDay();
    expect(c.state.stats.risk).toBe(40 - c.cfg.CAMPAIGN.riskDecayPerDay);
  });
});

describe('chaîne IGPN', () => {
  it('pot-de-vin photographié et transmis → enquête → Lemaire muté 3 jours plus tard', () => {
    const cfg = makeConfig({ POLICE: { roster: { mon: ['lemaire', 'lemaire'], tue: ['lemaire', 'lemaire'] }, maxAct: 0, minAct: 0, bribeChance: 1, patrols: { lemaire: { tipoff: { bernadette: 0, default: 0 } } } }, RESTAURANTS: makeConfig().RESTAURANTS.map((r) => ({ ...r, compliance: 0 })) });
    const c = drive(createCampaign({ seed: 11, content, cfg }), CAMPAIGN_BOTS.passive(), (x) => x.step === 'night');
    const sim = c.createNight();
    while (sim.state.min < 22 * 60 + 20) sim.tick(0.5);
    sim.act({ type: 'police' });
    while (!sim.activeBribe() && !sim.state.ended) sim.tick(0.25);
    expect(sim.act({ type: 'photo', target: { kind: 'police' }, distance: 6 }).ok).toBe(true);
    sim.act({ type: 'mairie' });
    while (!sim.state.ended) sim.tick(0.5);
    c.finishNight(sim);
    expect(c.has('bribe_photo')).toBe(true);
    expect(c.has('corruption_proof')).toBe(true);
    expect(c.has('inquiry_open')).toBe(true);
    const corr = c.state.hidden.corruption;
    drive(c, CAMPAIGN_BOTS.passive(), (x) => x.has('lemaire_transferred'));
    expect(c.state.day).toBe(1 + c.cfg.CAMPAIGN.igpn.transferAfterDays);
    expect(c.state.hidden.corruption).toBeLessThan(corr);
  });
});

describe('sauvegarde', () => {
  it('sauvegarder / recharger en cours de campagne donne exactement la même suite', () => {
    const bot = CAMPAIGN_BOTS.mixed;
    const a = drive(createCampaign({ seed: 21, content }), bot(), (x) => x.state.day === 3 && x.step === 'actions');
    const save = JSON.parse(JSON.stringify(a.save()));
    const b = createCampaign({ content, save });
    drive(a, bot(), () => false);
    drive(b, bot(), () => false);
    expect(b.state.ending).toEqual(a.state.ending);
    expect(JSON.stringify(b.state.journal)).toBe(JSON.stringify(a.state.journal));
  });

  it('une sauvegarde illisible ou d\'une version plus récente est refusée avec un message clair', () => {
    expect(() => createCampaign({ content, save: { version: 0 } })).toThrow(/illisible/);
    const future = { ...createCampaign({ seed: 1, content }).save(), version: SAVE_VERSION + 1 };
    expect(() => createCampaign({ content, save: future })).toThrow(/plus récente/);
    expect(checkSave(future)).toMatchObject({ ok: false, reason: 'future' });
    expect(checkSave(future).message).toMatch(/nouvelle campagne/);
    expect(checkSave(createCampaign({ seed: 1, content }).save())).toMatchObject({ ok: true });
  });

  it('migration v1 → v2 : ids renommés suivis, contenu disparu ignoré, la partie continue jusqu\'au bout', () => {
    const a = drive(createCampaign({ seed: 22, content }), CAMPAIGN_BOTS.legal(), (x) => x.state.day === 3 && x.step === 'cards');
    const v1 = JSON.parse(JSON.stringify(a.save()));
    v1.version = 1;
    delete v1.seen.tutorial; delete v1.seen.media;
    v1.flags.push('igpn_open', 'martine_dinner_seen', 'flag_supprime_depuis');
    v1.cards.unshift({ type: 'event', id: 'evenement_supprime' }, { type: 'dialogue', id: 'dialogue_supprime' });
    v1.pendingEnding = 'fin_supprimee';
    const b = createCampaign({ content, save: v1 });
    expect(b.state.version).toBe(SAVE_VERSION);
    expect(b.has('inquiry_open')).toBe(true);
    expect(b.has('colette_dinner_seen')).toBe(true);
    expect(b.has('igpn_open')).toBe(false);
    expect(b.state.seen.tutorial).toEqual([]);
    expect(b.state.pendingEnding).toBeNull();
    expect(b.state.migrationNotes.join(' ')).toMatch(/v1 → v2/);
    expect(b.card()?.id).not.toBe('evenement_supprime');
    drive(b, CAMPAIGN_BOTS.legal(), () => false);
    expect(b.ended).toBe(true);
  });
});

describe('simulateur de campagne', () => {
  it('6 bots × 15 campagnes : invariants de nuit et de campagne respectés', { timeout: 120_000 }, () => {
    for (const [name, make] of Object.entries(CAMPAIGN_BOTS)) {
      for (let seed = 1; seed <= 15; seed++) {
        const { c, nightErrors } = runCampaign({ seed, content, bot: make() });
        expect([...nightErrors, ...checkCampaignInvariants(c)], `${name} graine ${seed}`).toEqual([]);
      }
    }
  });

  it('assez rapide : 50 campagnes en moins de 3 s (machine au repos)', { timeout: 120_000 }, () => {
    // La machine peut être partagée (autres agents, CI) : la limite suit la charge
    const load = Math.max(1, os.loadavg()[0] / os.cpus().length);
    const t0 = performance.now();
    for (let seed = 1; seed <= 50; seed++) runCampaign({ seed, content, bot: CAMPAIGN_BOTS.legal() });
    expect(performance.now() - t0).toBeLessThan(3000 * load);
  });
});

describe('nouveautés de la nuit (v0.4)', () => {
  it('déguisement : les non-alliés remarquent moins', () => {
    const plain = createCampaign({ seed: 1, content });
    const a = drive(plain, CAMPAIGN_BOTS.passive(), (x) => x.step === 'night').createNight();
    const hooded = createCampaign({ seed: 1, content });
    hooded.apply({ setFlags: ['disguise_hood'] }, 'story', 't');
    const b = drive(hooded, CAMPAIGN_BOTS.passive(), (x) => x.step === 'night').createNight();
    for (const s of [a, b]) while (s.state.min < 22 * 60 + 30) s.tick(0.5);
    const p = (s) => s.potentialWitnesses(s.cfg.ANCHORS.pilouWindow).find((w) => w.kind === 'customers')?.p ?? 0;
    expect(b.disguise).toBe(a.cfg.DISGUISE.disguise_hood);
    expect(p(b)).toBeLessThan(p(a));
  });

  it('la ronde de Jérémie : le teckel repère une infraction, et aboie près d\'un acte illégal', () => {
    const { runNight } = { runNight: (o) => { const c = createCampaign({ seed: 2, content }); return drive(c, CAMPAIGN_BOTS.passive(), (x) => x.step === 'night').createNight(); } };
    const sim = runNight();
    while (sim.state.min < sim.cfg.DOG.start + 30) sim.tick(0.5);
    expect(sim.state.evidence.some((e) => e.type === 'round')).toBe(true);
    const logs = [];
    sim.drainEvents();
    sim.witnessAct({ ...sim.dogPos(), y: 1 }, 'test');
    for (const e of sim.drainEvents()) logs.push(e.text);
    expect(logs.some((l) => l?.includes('teckel'))).toBe(true);
  });

  it('la police vient pour Pilou quand le bloc est très hostile (visite planifiée, pas d\'appel)', () => {
    const cfg = makeConfig({ CAMPAIGN: { reversal: { minHostility: 0, chance: 1 } } });
    const c = drive(createCampaign({ seed: 3, content, cfg }), CAMPAIGN_BOTS.passive(), (x) => x.step === 'night');
    const sim = c.createNight();
    playNight(sim, POLICIES.passive(), c);
    expect(sim.state.journal.some((e) => e.type === 'police-arrive' && e.visit)).toBe(true);
    expect(sim.state.journal.some((e) => e.type === 'call')).toBe(false);
  });
});

describe('preuves : relevé dB, horodatage, légalité', () => {
  it('relevé dB : une pièce horodatée par demi-heure, seulement en tapage après 22h', () => {
    const c = drive(createCampaign({ seed: 31, content }), CAMPAIGN_BOTS.passive(), (x) => x.step === 'night');
    const sim = c.createNight();
    while (sim.state.min < 21 * 60) sim.tick(0.5);
    expect(sim.act({ type: 'db', noiseDb: 70 }).ok).toBe(false); // avant 22h
    while (sim.state.min < 22 * 60 + 10) sim.tick(0.5);
    expect(sim.act({ type: 'db', noiseDb: 40 }).ok).toBe(false); // trop calme
    const r = sim.act({ type: 'db', noiseDb: 68 });
    expect(r.ok).toBe(true);
    expect(r.found[0]).toMatchObject({ kind: 'db', legal: true, db: 68, time: sim.state.min });
    expect(r.found[0].text).toMatch(/22:1\d : 68 dB/);
    expect(sim.act({ type: 'db', noiseDb: 70 }).ok).toBe(false); // déjà un relevé dans la demi-heure
  });

  it('caméra cachée : le pot-de-vin filmé est illégal (hors dossier) mais ouvre l\'enquête IGPN', () => {
    const cfg = makeConfig({ POLICE: { roster: { mon: ['lemaire', 'lemaire'] }, maxAct: 0, minAct: 0, bribeChance: 1, patrols: { lemaire: { tipoff: { bernadette: 0, default: 0 } } } }, RESTAURANTS: makeConfig().RESTAURANTS.map((r) => ({ ...r, compliance: 0 })) });
    const c = drive(createCampaign({ seed: 12, content, cfg }), CAMPAIGN_BOTS.passive(), (x) => x.step === 'night');
    c.apply({ setFlags: ['camera_awning'] }, 'story', 'test');
    const sim = c.createNight();
    while (sim.state.min < 22 * 60 + 20) sim.tick(0.5);
    sim.act({ type: 'police' });
    while (!sim.state.ended) sim.tick(0.5);
    const cam = sim.state.evidence.find((e) => e.kind === 'bribe');
    expect(cam).toMatchObject({ type: 'camera', legal: false });
    c.finishNight(sim);
    expect(c.has('bribe_photo_illegal')).toBe(true);
    expect(c.has('inquiry_open')).toBe(true);
    const bribe = c.state.evidence.find((e) => e.kind === 'bribe');
    expect(bribe.legal).toBe(false);
    expect(bribe.value).toBeGreaterThan(0);
    // l'illégal compte pour la presse / l'IGPN, pas au dossier officiel
    expect(c.pressFile() - c.legalFile()).toBeCloseTo(bribe.value);
  });
});

describe('Koddex : un travail ou un projet perso au plus une fois par matin', () => {
  it('un doublon devient un travail ordinaire : le résultat ne s\'affiche qu\'une fois', () => {
    const K = { ...content, KODDEX: { ...content.KODDEX, work: [{ id: 'w_slides', label: 'Slides', job: 4, result: '42 diapositives.' }, { id: 'w_tests', label: 'Tests', job: 4, result: 'Tests verts.' }] } };
    const c = createCampaign({ seed: 3, content: K });
    while (c.step === 'cards') c.resolveCard(0);
    const lines = c.koddex(['w_slides', 'w_slides', 'w_slides']);
    expect(lines.filter((l) => l === '42 diapositives.')).toHaveLength(1);
    expect(c.state.counts.koddex.w_slides).toBe(1);
    expect(c.state.counts.koddex.w_tests).toBe(1); // le 2e doublon prend le travail suivant
  });

  it('les bots ("work" ×3) obtiennent des travaux distincts', () => {
    const K = { ...content, KODDEX: { ...content.KODDEX, work: [{ id: 'a', label: 'A', result: 'A' }, { id: 'b', label: 'B', result: 'B' }] } };
    const c = createCampaign({ seed: 4, content: K });
    while (c.step === 'cards') c.resolveCard(0);
    expect(c.koddex(['work', 'work', 'work'])).toEqual(['A', 'B']);
  });

  it('un projet perso en double ne s\'applique qu\'une fois', () => {
    const c = createCampaign({ seed: 5, content });
    while (c.step === 'cards') c.resolveCard(0);
    const job = c.state.stats.job;
    c.koddex(['db_logger', 'db_logger', 'db_logger']);
    expect(c.state.counts.koddex.db_logger).toBe(1);
    expect(c.state.stats.job).toBe(Math.min(100, job - 10 + 2 * c.cfg.CAMPAIGN.workJob));
  });
});
