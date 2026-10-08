import { describe, it, expect } from 'vitest';
import { createSim, createCampaign, runCampaign, playNight, CAMPAIGN_BOTS, POLICIES, makeConfig, checkCampaignInvariants, SAVE_VERSION } from '../../src/sim/index.js';
import { nightTwist, pickTwist } from '../../src/sim/twists.js';
import { restaurants, H } from './helpers.js';
import * as base from '../fixtures/content.js';
import * as tw from '../fixtures/twists.js';

const content = { ...base, TWISTS: tw.TWISTS, UNLOCKS: tw.UNLOCKS };
const T = (id) => nightTwist(tw.TWISTS.find((t) => t.id === id));
const cfg = makeConfig({ RESTAURANTS: restaurants({ compliance: 0 }) });
// Même graine avec et sans twist : seule la différence du twist compte
const pair = (id, extra = {}) => [createSim({ seed: 7, cfg, ...extra }), createSim({ seed: 7, cfg, twist: T(id), ...extra })];
const advance = (sim, min) => { while (sim.state.min < min && !sim.state.ended) sim.tick(0.5); };

// Avance une campagne jusqu'à une étape (sans la finir)
function drive(c, bot, until) {
  for (let i = 0; i < 3000 && !c.ended && !until(c); i++) {
    if (c.step === 'cards') { const card = c.card(); const ok = card.choices.filter((x) => x.available); c.resolveCard(card.type === 'event' && ok.length ? bot.choose(c, card, ok) : 0); }
    else if (c.step === 'koddex') c.koddex(bot.morning(c, c.koddexOptions()));
    else if (c.step === 'actions') { const id = bot.afternoon(c, c.availableActions()); if (id) c.doAction(id); else c.endAfternoon(); }
    else if (c.step === 'night') { const sim = c.createNight(); playNight(sim, bot.night(c, sim), c); c.finishNight(sim); }
    else if (c.step === 'recap') c.nextDay();
  }
  return c;
}

describe('twists de nuit : choix', () => {
  it('200 campagnes : chaque nuit jouée a un twist, jamais deux fois le même, le fixe du J4 tombe le J4', { timeout: 300_000 }, () => {
    for (let seed = 1; seed <= 200; seed++) {
      const { c } = runCampaign({ seed, content, bot: CAMPAIGN_BOTS.passive() });
      const h = c.state.twistHistory;
      expect(h.length, `graine ${seed}`).toBe(c.state.nightCount);
      expect(new Set(h.map((x) => x.id)).size, `graine ${seed} : twist répété`).toBe(h.length);
      const d4 = h.find((x) => x.day === 4);
      if (d4) expect(d4.id).toBe('fx_colette');
      if (d4) expect(c.has('twist_colette_seen')).toBe(true); // conséquence `after`
    }
  });

  it('les conditions §14 comptent (weekday, flags) et le pool épuisé ne renvoie rien', () => {
    const rng = { next: () => 0.5 };
    expect(pickTwist(tw.TWISTS, { day: 2, weekday: 'tue', flags: new Set(), stats: {}, hidden: {} }, tw.TWISTS.map((t) => t.id).filter((id) => id !== 'fx_van'), rng)).toBeNull();
    expect(pickTwist(tw.TWISTS, { day: 6, weekday: 'sat', flags: new Set(), stats: {}, hidden: {} }, tw.TWISTS.map((t) => t.id).filter((id) => id !== 'fx_van'), rng).id).toBe('fx_van');
  });

  it('le twist est choisi à l\'entrée de la nuit (c.tonightTwist() pour l\'interface), et le choix survit à un rechargement', () => {
    const c = drive(createCampaign({ seed: 3, content }), CAMPAIGN_BOTS.passive(), (x) => x.state.phase === 'night');
    expect(c.tonightTwist().id).toBe(c.state.tonightTwist.id);
    expect(c.tonightTwist().intro).toBeTruthy();
    const again = createCampaign({ content, save: JSON.parse(JSON.stringify(c.save())) });
    expect(again.twistTonight().id).toBe(c.twistTonight().id);
  });
});

describe('twists de nuit : chaque champ `sim` a un effet', () => {
  const people = (s) => s.state.tables.reduce((a, t) => a + t.count, 0);
  it('crowd : plus (ou moins) de monde', () => {
    const [a, b] = pair('fx_evjf');
    expect(people(b)).toBeGreaterThan(people(a));
    const [c, d] = pair('fx_quiet');
    expect(people(d)).toBeLessThan(people(c));
  });
  it('noise : plus de bruit partout', () => {
    const [a, b] = pair('fx_match');
    advance(a, H(21)); advance(b, H(21));
    expect(b.noiseAt(b.cfg.ANCHORS.bed, true)).toBeGreaterThan(a.noiseAt(a.cfg.ANCHORS.bed, true) + 1);
  });
  it('closeDelay : les terrasses rentrent plus tard', () => {
    const [a, b] = pair('fx_heat');
    a.state.tables.forEach((t, i) => expect(b.state.tables[i].clearAt).toBeCloseTo(t.clearAt + 30));
  });
  it('tables : table modifiée (11 à la table 4) ou ajoutée au bout de la terrasse', () => {
    const [, b] = pair('fx_birthday');
    expect(b.state.tables.find((t) => t.restId === 'bernadette' && t.label.endsWith('table 4')).count).toBe(11);
    const [a2, b2] = pair('fx_ladies');
    expect(b2.state.tables.length).toBe(a2.state.tables.length + 1);
    expect(b2.state.tables.at(-1)).toMatchObject({ restId: 'malunes', count: 9, out: true });
  });
  it('witnesses : un témoin de plus, qui filme', () => {
    const [, b] = pair('fx_influencer');
    advance(b, H(22, 30));
    const w = b.potentialWitnesses(b.cfg.ANCHORS.pilouWindow).find((x) => x.twistWitness === 'influencer');
    expect(w).toBeDefined();
    const seen = b.witnessAct(b.cfg.ANCHORS.pilouWindow, 'test');
    expect(seen.find((x) => x.twistWitness === 'influencer')?.filmed).toBe(true);
    const [, g] = pair('fx_guide'); // présent seulement 21h–22h
    advance(g, H(22, 30));
    expect(g.potentialWitnesses(g.cfg.ANCHORS.pilouWindow).some((x) => x.twistWitness === 'guide')).toBe(false);
  });
  it('darkness : tout le monde voit moins', () => {
    const [a, b] = pair('fx_blackout');
    advance(a, H(22, 30)); advance(b, H(22, 30));
    const p = (s) => s.potentialWitnesses(s.cfg.ANCHORS.pilouWindow).filter((w) => w.kind === 'customers').reduce((x, w) => x + w.p, 0);
    expect(p(b)).toBeLessThan(p(a) * 0.7);
  });
  it('exhaustOff : la hotte se tait (bruit et sommeil)', () => {
    const [a, b] = pair('fx_blackout');
    advance(a, H(22, 30)); advance(b, H(22, 30));
    expect(b.noiseAt(b.cfg.ANCHORS.exhaust, false)).toBeLessThan(a.noiseAt(a.cfg.ANCHORS.exhaust, false));
    expect(b.state.sleep).toBeGreaterThan(a.state.sleep);
  });
  it('rain : les terrasses rentrent tôt, sauf sous le store de l\'estaminet', () => {
    const [a, b] = pair('fx_drache');
    advance(a, H(22, 20)); advance(b, H(22, 20));
    expect(b.state.tables.filter((t) => t.restId !== 'bernadette' && t.out)).toHaveLength(0);
    expect(b.state.tables.filter((t) => t.restId === 'bernadette' && t.out).length).toBeGreaterThan(0);
    expect(a.state.tables.filter((t) => t.restId !== 'bernadette' && t.out).length).toBeGreaterThan(0);
  });
  it('corridorBlocked : la camionnette se photographie (preuve), la police met plus longtemps', () => {
    const [a, b] = pair('fx_van');
    advance(a, H(22, 10)); advance(b, H(22, 10));
    expect(a.act({ type: 'photo', target: { kind: 'van' } }).ok).toBe(false);
    const r = b.act({ type: 'photo', target: { kind: 'van' } });
    expect(r.ok).toBe(true);
    expect(r.found[0].kind).toBe('corridor_blocked');
    a.act({ type: 'police' }); b.act({ type: 'police' });
    expect(b.state.police.arriveAt - b.state.police.calledAt).toBeCloseTo((a.state.police.arriveAt - a.state.police.calledAt) * 1.5);
  });
  it('events : le moment arrive à son heure (texte + pic de bruit)', () => {
    const [a, b] = pair('fx_birthday');
    advance(a, H(23, 39)); advance(b, H(23, 39));
    b.drainEvents();
    const before = b.noiseAt(b.cfg.ANCHORS.bed, true) - a.noiseAt(a.cfg.ANCHORS.bed, true);
    advance(a, H(23, 41)); advance(b, H(23, 41));
    expect(b.drainEvents().some((e) => e.text?.includes('anniversaire'))).toBe(true);
    const after = b.noiseAt(b.cfg.ANCHORS.bed, true) - a.noiseAt(a.cfg.ANCHORS.bed, true);
    expect(after).toBeGreaterThan(before + 3);
    expect(b.state.journal.some((e) => e.type === 'twist-event')).toBe(true);
  });
  it('opportunities : une action verrouillée est ouverte pour cette nuit seulement', () => {
    const K = { ...content, TWISTS: [{ id: 'opp', pool: true, title: 'Opportunité', sim: { opportunities: ['stink_bomb'] } }] };
    const c = drive(createCampaign({ seed: 2, content: K }), CAMPAIGN_BOTS.passive(), (x) => x.step === 'night');
    expect(c.actionAllowed('stink_bomb')).toBe(false); // u_stink pas encore acquis
    const sim = c.createNight();
    expect(c.nightActions(sim).map((a) => a.id)).toContain('stink_bomb');
    const plain = createCampaign({ seed: 2, content: { ...content, TWISTS: [] } });
    drive(plain, CAMPAIGN_BOTS.passive(), (x) => x.step === 'night');
    expect(plain.nightActions(plain.createNight()).map((a) => a.id)).not.toContain('stink_bomb');
  });
  it('le bilan de la nuit parle du twist', () => {
    const [, b] = pair('fx_colette');
    advance(b, H(25, 30));
    expect(b.summary().twist).toMatchObject({ id: 'fx_colette' });
    expect(b.summary().verdict[0]).toBe('Colette a dîné jusqu’à minuit.');
  });
});

describe('outils débloqués (unlocks)', () => {
  const K = { ...content, ACTIONS: [...content.ACTIONS, { id: 'night_db', label: 'Relevé dB', phase: 'night', legality: 'legal', sim: 'db', effects: {} }] };
  it('une action est verrouillée jusqu\'à sa condition, avec une seule carte « Nouveau »', () => {
    const c = createCampaign({ seed: 4, content: K });
    drive(c, CAMPAIGN_BOTS.passive(), (x) => x.step === 'actions');
    expect(c.availableActions().map((a) => a.id)).not.toContain('petition'); // jour 1
    const cards = [];
    for (let i = 0; i < 3000 && !(c.state.day === 3 && c.step === 'actions') && !c.ended; i++) {
      if (c.step === 'cards') { const k = c.card(); cards.push(k.id); c.resolveCard(k.choices.find((x) => x.available)?.i ?? 0); }
      else drive(c, CAMPAIGN_BOTS.passive(), (x) => x.step === 'cards' || (x.state.day === 3 && x.step === 'actions'));
    }
    expect(c.availableActions().map((a) => a.id)).toContain('petition');
    expect(cards.filter((id) => id === 'unlock:u_petition')).toHaveLength(1);
    expect(c.state.journal.some((e) => e.type === 'unlock' && e.id === 'u_petition')).toBe(true);
    drive(c, CAMPAIGN_BOTS.passive(), () => false);
    expect(c.state.journal.filter((e) => e.type === 'unlock' && e.id === 'u_petition')).toHaveLength(1);
  });

  it('touches et verbes natifs : B (relevé dB) verrouillé le jour 1, ouvert à partir du jour 2 — les bots aussi', () => {
    const c = createCampaign({ seed: 5, content: K });
    drive(c, CAMPAIGN_BOTS.passive(), (x) => x.step === 'night');
    expect(c.keyAllowed('B')).toBe(false);
    expect(c.nativeAllowed('db')).toBe(false);
    const sim = c.createNight();
    playNight(sim, CAMPAIGN_BOTS.legal().night(c, sim), c);
    expect(sim.state.evidence.some((e) => e.kind === 'db')).toBe(false); // le bot n'a pas pu mesurer
    c.finishNight(sim);
    drive(c, CAMPAIGN_BOTS.passive(), (x) => x.state.day === 2 && x.step === 'night');
    expect(c.keyAllowed('B')).toBe(true);
    expect(c.nativeAllowed('db')).toBe(true);
    expect(c.keyAllowed('P')).toBe(true); // jamais verrouillée
  });

  it('sans UNLOCKS dans le contenu, rien n\'est verrouillé', () => {
    const c = createCampaign({ seed: 6, content: { ...K, UNLOCKS: [] } });
    expect(c.keyAllowed('B')).toBe(true);
    expect(c.actionAllowed('stink_bomb')).toBe(true);
  });
});

describe('sauvegarde v3 et invariants', () => {
  it('une sauvegarde v2 (avant la v1.1) garde tous ses verbes, et l\'aller-retour reste identique', () => {
    const a = drive(createCampaign({ seed: 8, content }), CAMPAIGN_BOTS.passive(), (x) => x.state.day === 2 && x.step === 'actions');
    const v2 = JSON.parse(JSON.stringify(a.save()));
    v2.version = 2;
    delete v2.twistHistory; delete v2.unlocked; delete v2.tonightTwist; delete v2.pushedMedia;
    const b = createCampaign({ content, save: v2 });
    expect(b.state.version).toBe(SAVE_VERSION);
    expect(b.state.unlocked.sort()).toEqual(tw.UNLOCKS.map((u) => u.id).sort());
    expect(b.state.twistHistory).toEqual([]);
    const again = JSON.stringify(b.save());
    expect(JSON.stringify(createCampaign({ content, save: JSON.parse(again) }).save())).toBe(again);
  });

  it('invariants de nuit et de campagne verts avec les twists (6 bots × 6 graines)', { timeout: 300_000 }, () => {
    for (const [name, make] of Object.entries(CAMPAIGN_BOTS)) {
      for (let seed = 1; seed <= 6; seed++) {
        const { c, nightErrors } = runCampaign({ seed, content, bot: make() });
        expect([...nightErrors, ...checkCampaignInvariants(c)], `${name} graine ${seed}`).toEqual([]);
      }
    }
  });
});

// La nuit isolée (v0.2, runNight) n'a pas de twist : elle reste identique
describe('nuit sans twist', () => {
  it('une nuit sans twist est identique à avant (même graine, même journal)', () => {
    const a = createSim({ seed: 11, cfg });
    const b = createSim({ seed: 11, cfg, twist: null });
    const p = POLICIES.legal();
    for (let i = 0; i < 400 && !a.state.ended; i++) { for (const x of p.decide(a)) a.act(x); a.tick(0.5); }
    const p2 = POLICIES.legal();
    for (let i = 0; i < 400 && !b.state.ended; i++) { for (const x of p2.decide(b)) b.act(x); b.tick(0.5); }
    expect(JSON.stringify(b.state.journal)).toBe(JSON.stringify(a.state.journal));
  });
});
