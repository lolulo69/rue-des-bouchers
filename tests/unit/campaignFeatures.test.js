// Mécaniques de journée de la campagne : travail Koddex, projets perso, licenciement, AG du J7, téléphone.
import { describe, it, expect } from 'vitest';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createCampaign, normalizeContent, runCampaign, CAMPAIGN_BOTS, playNight, POLICIES } from '../../src/sim/index.js';
import { CONFIG } from '../../src/config.js';
import * as narrative from '../../src/sim/narrative.js';

const DIR = join(import.meta.dirname, '..', '..', 'src', 'content');
const K = normalizeContent(await Promise.all(readdirSync(DIR).filter((f) => f.endsWith('.js')).map((f) => import(join(DIR, f)))));
const C = CONFIG.CAMPAIGN;

// Avance jusqu'à une étape : cartes → premier choix dispo, Koddex → travail, après-midi → fin, nuit → passive
function advance(c, until, { koddex = ['work', 'work', 'work'], choose = (card, ok) => ok[0] } = {}) {
  for (let i = 0; i < 2000 && !until(c) && !c.ended; i++) {
    if (c.step === 'cards') { const card = c.card(); const ok = card.choices.map((x, j) => (x.available ? j : -1)).filter((j) => j >= 0); c.resolveCard(ok.length ? choose(card, ok) : 0); }
    else if (c.step === 'koddex') c.koddex(koddex);
    else if (c.step === 'actions') c.endAfternoon();
    else if (c.step === 'night') { const sim = c.createNight(); playNight(sim, POLICIES.passive(), c); c.finishNight(sim); }
    else if (c.step === 'recap') c.nextDay();
  }
  return c;
}
const fresh = (seed = 4) => createCampaign({ seed, content: K, narrative });

describe('Koddex : travail et gags pilotés par le contenu', () => {
  it('un travail n\'est proposé que si son `requires` / `when` est rempli, et rapporte son propre `job`', () => {
    const c = advance(fresh(), (x) => x.step === 'koddex');
    const gated = K.KODDEX.work.find((w) => w.requires?.flags?.length);
    expect(c.koddexOptions().work.some((w) => w.id === gated.id)).toBe(false);
    c.apply({ setFlags: gated.requires.flags }, 'engine', 'test');
    expect(c.koddexOptions().work.some((w) => w.id === gated.id)).toBe(true);
    const job = c.state.stats.job;
    c.koddex([gated.id, 'side_todo_rust', 'side_todo_rust']);
    expect(c.state.counts.koddex[gated.id]).toBe(1);
    expect(c.state.stats.job).toBeGreaterThan(job - 10);
  });

  it('un gag n\'apparaît que si son `when` est rempli', () => {
    const c = advance(fresh(), (x) => x.step === 'koddex');
    const g = c.koddexOptions().gag;
    if (g?.when) expect(c.check(g.when, false)).toBe(true);
    const gatedGags = K.KODDEX.gags.filter((x) => typeof x === 'object' && x.when?.flags?.length);
    for (const x of gatedGags) if (!x.when.flags.every((f) => c.has(f))) expect(g?.id).not.toBe(x.id);
  });
});

describe('projets perso', () => {
  it('proj_db_logger : relevés sonores automatiques et horodatés pendant la nuit', () => {
    const c = advance(fresh(), (x) => x.step === 'night');
    c.apply({ setFlags: ['proj_db_logger'] }, 'engine', 'test');
    const sim = c.createNight();
    playNight(sim, POLICIES.passive(), c);
    const auto = sim.state.evidence.filter((e) => e.auto && e.type === 'db');
    expect(auto.length).toBeGreaterThan(0);
    for (const e of auto) expect(e.time).toBeGreaterThanOrEqual(sim.cfg.SLEEP.drainAfter);
    const gaps = auto.slice(1).map((e, i) => e.time - auto[i].time);
    for (const g of gaps) expect(g).toBeGreaterThanOrEqual(C.dbLogger.every - 1);
    // Sans le démon : rien d'automatique
    const c2 = advance(fresh(), (x) => x.step === 'night');
    const s2 = c2.createNight();
    playNight(s2, POLICIES.passive(), c2);
    expect(s2.state.evidence.some((e) => e.auto)).toBe(false);
  });

  it('proj_whatsapp_bot : la mobilisation coûte moins de temps et rapporte plus d\'Asso', () => {
    const c = advance(fresh(), (x) => x.step === 'actions');
    const recruit = K.ACTIONS.find((a) => a.id === 'pm_recruit');
    expect(c.actionCost(recruit)).toBe(recruit.cost.time);
    c.apply({ setFlags: ['proj_whatsapp_bot'] }, 'engine', 'test');
    expect(c.actionCost(recruit)).toBe(Math.max(1, recruit.cost.time - C.whatsappBot.timeDiscount));
    // Gain d'Asso du même ralliement, avec et sans le bot (les gains peuvent être dégressifs : on compare, on ne calcule pas)
    const gain = (withBot) => {
      const x = advance(fresh(), (y) => y.step === 'actions');
      if (withBot) x.apply({ setFlags: ['proj_whatsapp_bot'] }, 'engine', 'test');
      const before = x.state.stats.asso;
      x.doAction('pm_whatsapp_rally');
      return x.state.stats.asso - before;
    };
    expect(gain(true)).toBeGreaterThan(gain(false));
  });

  it('les coûts en Job des projets perso viennent du contenu', () => {
    const c = advance(fresh(), (x) => x.step === 'koddex');
    const p = K.KODDEX.sideProjects.find((x) => x.id === 'side_db_logger');
    const job = c.state.stats.job;
    c.koddex([p.id, p.id, p.id]); // un projet ne se débloque qu'une fois : les deux autres prompts deviennent du travail
    expect(c.has('proj_db_logger')).toBe(true);
    const pen = c.state.workplace === 'home' ? C.workdays.homeJobPenalty : 0; // télétravail (§12b.D) : un peu moins de travail fait
    expect(c.state.stats.job).toBe(Math.max(0, Math.min(100, job + p.job + 2 * (C.workJob - pen))));
  });
});

describe('licenciement et rebond', () => {
  it('Job à 0 dès la nuit 5 : fin « virée », puis on continue sans Koddex et avec plus de temps l\'après-midi', () => {
    const c = advance(fresh(), (x) => x.state.day >= 5 && x.step === 'koddex');
    c.apply({ job: -100, sleep: 100 }, 'engine', 'test');
    c.koddex(['side_db_logger', 'side_whatsapp_bot', 'side_scraper']); // trois projets perso, aucun vrai travail
    advance(c, (x) => x.ended);
    expect(c.state.ending?.id).toBe('fired');
    expect(c.state.ending.canContinue).toBe(true);
    expect(c.continueAfterEnding()).toBe(true);
    expect(c.has('unemployed')).toBe(true);
    advance(c, (x) => x.step === 'actions' || x.step === 'koddex');
    expect(c.step).toBe('actions');
    expect(c.state.timeLeft).toBe(C.afternoonTime + C.unemployedBonusTime);
    advance(c, (x) => x.step === 'koddex' || x.state.day >= c.state.day + 1);
    expect(c.step).not.toBe('koddex');
  });
});

describe('AG du J7', () => {
  it('le vote pose le drapeau de stratégie choisi (et un seul)', () => {
    for (const flag of ['stance_legal', 'stance_dialogue', 'stance_direct']) {
      const c = fresh(7);
      advance(c, (x) => x.step === 'cards' && x.card()?.id === 'd7_general_meeting');
      const card = c.card();
      const i = card.choices.findIndex((ch, j) => ch.available && K.EVENTS.find((e) => e.id === 'd7_general_meeting').choices[j].effects?.setFlags?.includes(flag));
      expect(i, flag).toBeGreaterThanOrEqual(0);
      c.resolveCard(i);
      const stances = ['stance_legal', 'stance_dialogue', 'stance_direct'].filter((f) => c.has(f));
      expect(stances).toEqual([flag]);
    }
  });
});

describe('téléphone et dialogue surfacés par la campagne', () => {
  it('le bot lit son fil chaque soir (effets appliqués, compté), et des répliques sortent en cartes', () => {
    const { c } = runCampaign({ seed: 2, content: K, bot: CAMPAIGN_BOTS.legal(), narrative });
    expect(Object.keys(c.state.counts.media ?? {}).length).toBeGreaterThan(10);
    expect(c.state.seen.media.length).toBe(Object.keys(c.state.counts.media).length);
    expect(Object.keys(c.state.counts.dialogue).length).toBeGreaterThan(5);
  });
});

describe('événements de nuit et redites (QA « pass 2 (transcripts) »)', () => {
  it('le dîner de Martine (J4) n\'est plus une carte avant la nuit : il se joue pendant la nuit, à 20h50', () => {
    const c = fresh(12);
    const preNight = [];
    for (let i = 0; i < 2000 && !(c.state.day === 4 && c.step === 'night'); i++) {
      if (c.step === 'cards') { const card = c.card(); if (c.state.day === 4 && c.state.phase === 'night') preNight.push(card.id); const ok = card.choices.findIndex((x) => x.available); c.resolveCard(Math.max(0, ok)); }
      else advance(c, (x) => x.step === 'cards' || (x.state.day === 4 && x.step === 'night'));
    }
    expect(preNight).not.toContain('d4_martine_dinner');
    expect(c.state.nightEvents.map((x) => x.id)).toContain('d4_martine_dinner');
    const sim = c.createNight();
    expect(c.nightEventDue(sim)).toBeNull(); // 20h30 : pas encore
    playNight(sim, POLICIES.passive(), c);
    const ev = sim.state.journal.find((e) => e.type === 'night-event' && e.id === 'd4_martine_dinner');
    expect(ev?.t).toBeGreaterThanOrEqual(20 * 60 + 50);
    expect(c.state.seen.events).toContain('d4_martine_dinner');
  });

  it('la drache vide toutes les terrasses en quelques minutes, et rien ne ressort', () => {
    const c = advance(fresh(13), (x) => x.step === 'night');
    c.state.nightEvents.push({ id: 'r_drache', at: 21 * 60 + 15 });
    const sim = c.createNight();
    while (sim.state.min < 21 * 60 + 15) sim.tick(0.5);
    expect(sim.state.tables.some((t) => t.out)).toBe(true);
    c.resolveNightEvent(sim, 0);
    while (sim.state.min < 21 * 60 + 21) sim.tick(0.5);
    expect(sim.state.tables.filter((t) => t.out)).toEqual([]);
    while (!sim.state.ended) sim.tick(1);
    expect(sim.state.journal.some((e) => e.type === 'table-return' && e.t > 21 * 60 + 15)).toBe(false);
  });

  it('pas de redite : la même réplique, contre-offensive, événement ou tâche Koddex ne revient pas avant le délai', () => {
    const cooldown = C.repeatCooldownDays;
    const repeatable = new Set([...K.DIALOGUE, ...K.COUNTERMOVES, ...K.EVENTS, ...K.KODDEX.work.filter((w) => typeof w === 'object')].filter((x) => x.repeatable).map((x) => x.id));
    for (const bot of ['legal', 'reckless', 'diplomat']) {
      for (const seed of [1, 2, 3]) {
        const { c } = runCampaign({ seed, content: K, bot: CAMPAIGN_BOTS[bot](), narrative });
        const last = {};
        for (const e of c.state.journal) {
          const id = e.type === 'event' ? e.id : e.type === 'koddex' && K.KODDEX.work.some((w) => w.id === e.id) ? e.id : e.type === 'countermove' ? e.id : null;
          if (!id || repeatable.has(id)) continue;
          if (last[id] !== undefined) expect(e.day - last[id], `${bot}#${seed} ${id} jours ${last[id]} et ${e.day}`).toBeGreaterThanOrEqual(cooldown);
          last[id] = e.day;
        }
      }
    }
  });
});
