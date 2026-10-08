import { test, expect } from '@playwright/test';
import { watchErrors, GL_COUNTER, startNight, tickTo, goToWindow, frameStats, hhmm } from './helpers.js';

// Systèmes de la nuit (GAME_DESIGN §13.C, items Q) contre le build de prod (vite preview).
// Chaque test part d'une graine fixe (?seed=N) : mêmes tables, mêmes tirages.

test.describe('nuit : preuves', () => {
  test('photo : une table dehors après 22h05 devient une pièce horodatée, de qualité et légale', async ({ page }) => {
    const errors = watchErrors(page);
    await startNight(page, 'seed=11');
    await tickTo(page, hhmm(22, 10));
    const id = await page.evaluate(() => window.__rdb.sim.state.tables.find((t) => t.out)?.id);
    test.skip(id == null, 'aucune table dehors à 22h10 avec cette graine');
    await page.evaluate((tid) => { window.__rdb.aimAt(tid); window.__rdb.step(2); window.__rdb.key('KeyP'); window.__rdb.step(1); }, id);
    const ev = await page.evaluate(() => window.__rdb.sim.state.evidence);
    expect(ev.length).toBeGreaterThan(0);
    for (const e of ev) {
      expect(e.value, 'chaque pièce compte dans le dossier').toBeGreaterThan(0);
      expect(typeof e.text).toBe('string');
    }
    // Dossier (Tab) : la pièce y est listée
    await page.evaluate(() => window.__rdb.key('Tab'));
    await expect(page.locator('#dossier')).toBeVisible();
    await expect(page.locator('#dossier-list li').first()).toBeVisible();
    await page.evaluate(() => window.__rdb.key('Tab'));
    await expect(page.locator('#dossier')).toBeHidden();
    expect(errors).toEqual([]);
  });

  test('photo : la même table ne donne pas deux fois la même pièce', async ({ page }) => {
    await startNight(page, 'seed=11');
    await tickTo(page, hhmm(22, 10));
    const id = await page.evaluate(() => window.__rdb.sim.state.tables.find((t) => t.out)?.id);
    test.skip(id == null, 'aucune table dehors à 22h10 avec cette graine');
    const counts = await page.evaluate((tid) => {
      const r = window.__rdb;
      r.aimAt(tid); r.step(2); r.key('KeyP'); r.step(1);
      const a = r.sim.state.evidence.length;
      r.key('KeyP'); r.step(1);
      return [a, r.sim.state.evidence.length];
    }, id);
    expect(counts[1]).toBe(counts[0]);
  });

  test('photo : depuis l’appartement, loin de la fenêtre, rien n’est pris', async ({ page }) => {
    await startNight(page, 'seed=11');
    await tickTo(page, hhmm(22, 10));
    // (la ronde de Jérémie ajoute ses propres pièces : on compare avant / après)
    const [before, after] = await page.evaluate(() => {
      const { player, world, step, key, sim } = window.__rdb;
      player.loc = 'apt';
      player.pos.set(world.apt.x0 + 0.8, world.apt.floor, (world.apt.z0 + world.apt.z1) / 2);
      step(1);
      const n0 = sim.state.evidence.length;
      key('KeyP'); step(1);
      return [n0, sim.state.evidence.length];
    });
    expect(after).toBe(before);
    await expect(page.locator('#log')).toContainText('il faut être à la fenêtre');
  });
});

test.describe('nuit : police municipale', () => {
  // Attend la fin de la visite en cours (le standard refuse un appel tant qu'une patrouille est en route)
  const waitPolice = (page) => page.evaluate(() => {
    const { sim, step } = window.__rdb;
    for (let i = 0; sim.state.police && !sim.state.ended && i < 4000; i++) { sim.tick(0.5); if (i % 40 === 0) step(1); }
    step(1);
    return sim.state.policeLog.at(-1);
  });

  test('un appel aboutit à une issue connue, journalisée et affichée au bilan', async ({ page }) => {
    const errors = watchErrors(page);
    await startNight(page, 'seed=21'); // lundi : Benali avant 23h
    await tickTo(page, hhmm(22, 15));
    await page.evaluate(() => window.__rdb.key('KeyT'));
    await page.click('[data-call=police]');
    const entry = await waitPolice(page);
    expect(['act', 'complaisance', 'nothing', 'tipoff']).toContain(entry.outcome);
    expect(entry.arrivedAt).toBeGreaterThan(entry.calledAt);
    if (entry.outcome === 'act') {
      const still = await page.evaluate((rid) => window.__rdb.sim.infractions(rid).length, entry.restId);
      expect(still, 'après un PV, plus d’infraction chez ce resto').toBe(0);
    }
    await tickTo(page, hhmm(26, 0));
    await page.evaluate(() => { const { sim, step } = window.__rdb; while (!sim.state.ended) sim.tick(0.5); step(1); });
    await expect(page.locator('#end')).toBeVisible();
    await expect(page.locator('#end-body')).toContainText(entry.patrol);
    expect(errors).toEqual([]);
  });

  test('tuyau : les tables rentrent juste avant la police, puis ressortent (lundi après 23h, Lemaire)', async ({ page }) => {
    let tip = null;
    // Le lundi, Lemaire prend le service à 23h (roster de config.js). En nuit seule, ?day= ne connaît que mon et sat.
    for (const seed of [2, 3, 4]) {
      await startNight(page, `seed=${seed}`);
      await tickTo(page, hhmm(23, 5));
      await page.evaluate(() => window.__rdb.sim.act({ type: 'police' }));
      await waitPolice(page);
      tip = await page.evaluate(() => window.__rdb.sim.state.tipoffs[0] ?? null);
      if (tip) break;
    }
    test.skip(!tip, 'aucun tuyau sur 3 graines (38/40 en headless)');
    expect(tip.tippedAt).toBeLessThan(tip.arrivedAt);
    expect(tip.tippedAt).toBeGreaterThanOrEqual(tip.arrivedAt - 6);
    const log = await page.evaluate(() => window.__rdb.sim.state.policeLog.at(-1));
    expect(log.outcome).toBe('tipoff');
    await expect(page.locator('#log')).toContainText('Tiens');
    // Les tables reviennent après le départ de la patrouille (invariant §13.G : seulement après un tuyau)
    await tickTo(page, tip.returnAt + 2);
    const back = await page.evaluate((ids) => ids.filter((id) => window.__rdb.sim.table(id).out).length, tip.tableIds);
    expect(back).toBeGreaterThan(0);
  });

  test('« c’est encore vous » : au 4e appel, personne ne vient', async ({ page }) => {
    await startNight(page, 'seed=31');
    await tickTo(page, hhmm(22, 5));
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.__rdb.sim.act({ type: 'police' }));
      await waitPolice(page);
    }
    await page.evaluate(() => window.__rdb.key('KeyT'));
    await page.click('[data-call=police]');
    await page.evaluate(() => window.__rdb.step(1));
    const s = await page.evaluate(() => ({ last: window.__rdb.sim.state.policeLog.at(-1), serial: window.__rdb.sim.state.serialComplainer }));
    expect(s.last.outcome).toBe('ignored');
    expect(s.serial).toBe(true); // (le texte du standard passe par le narrateur : il varie, on teste l'état)
  });

  test('appel « pour l’Association » : plus rapide, mais le bloc sait qui appelle', async ({ page }) => {
    await startNight(page, 'seed=41');
    await tickTo(page, hhmm(22, 10));
    const before = await page.evaluate(() => window.__rdb.sim.state.hostility);
    await page.evaluate(() => window.__rdb.key('KeyT'));
    await page.click('[data-call=police-asso]');
    const s = await page.evaluate(() => ({ knows: window.__rdb.sim.state.blocKnows, h: window.__rdb.sim.state.hostility }));
    expect(s.knows).toBe(true);
    expect(s.h).toBeGreaterThan(before);
  });
});

test.describe('nuit : le serveur', () => {
  test('l’invite [E] apparaît près du serveur et la demande est enregistrée (cooldown respecté)', async ({ page }) => {
    await startNight(page, 'seed=51');
    await tickTo(page, hhmm(22, 15));
    await page.evaluate(() => {
      const { player, sim, step } = window.__rdb;
      const w = sim.waiterPos();
      player.loc = 'street';
      player.pos.set(w.x + (w.x > 0 ? -0.8 : 0.8), 0, w.z);
      step(2);
    });
    await expect(page.locator('#prompt')).toContainText('serveur');
    const asks = await page.evaluate(() => {
      const r = window.__rdb;
      r.key('KeyE'); r.step(1);
      const a = r.sim.state.waiterAsks.length;
      r.key('KeyE'); r.step(1); // cooldown de 10 min : pas de 2e demande
      return [a, r.sim.state.waiterAsks.length];
    });
    expect(asks[0]).toBe(1);
    expect(asks[1]).toBe(1);
  });

  test('après 00h45 le serveur n’est plus de service : pas d’invite', async ({ page }) => {
    await startNight(page, 'seed=51');
    await tickTo(page, hhmm(24, 50));
    await page.evaluate(() => {
      const { player, sim, step } = window.__rdb;
      const w = sim.waiterPos();
      player.loc = 'street';
      player.pos.set(w.x + (w.x > 0 ? -0.8 : 0.8), 0, w.z);
      step(2);
    });
    await expect(page.locator('#prompt')).not.toContainText('serveur');
  });
});

test.describe('nuit : seau d’eau et témoins', () => {
  test('vu (22h15, rue pleine) : le Risque monte, les témoins sont mémorisés et listés au bilan', async ({ page }) => {
    await startNight(page, 'seed=61');
    await tickTo(page, hhmm(22, 15));
    await goToWindow(page);
    await expect(page.locator('#witness')).not.toBeEmpty();
    const r = await page.evaluate(() => {
      const { sim, key, step } = window.__rdb;
      const risk0 = sim.state.risk;
      key('KeyF'); step(1);
      return { risk0, risk: sim.state.risk, seen: sim.state.witnessMemories.length, uses: sim.state.bucketUses };
    });
    expect(r.uses).toBe(1);
    if (r.seen > 0) expect(r.risk).toBeGreaterThan(r.risk0);
    else expect(r.risk).toBe(r.risk0); // (la ligne « SPLASH » peut déjà avoir défilé derrière celles des témoins)
  });

  test('invariant : le Risque ne monte que si quelqu’un a vu (1h10, Klaas couché, chat rentré, serveur parti)', async ({ page }) => {
    await startNight(page, 'seed=61');
    await tickTo(page, hhmm(25, 10));
    await goToWindow(page);
    const r = await page.evaluate(() => {
      const { sim, key, step } = window.__rdb;
      const risk0 = sim.state.risk, mem0 = sim.state.witnessMemories.length;
      key('KeyF'); step(1);
      return { risk0, risk: sim.state.risk, newWitnesses: sim.state.witnessMemories.length - mem0 };
    });
    if (r.newWitnesses === 0) expect(r.risk).toBe(r.risk0);
    else expect(r.risk).toBeGreaterThan(r.risk0);
  });

  test('le seau se recharge : un 2e seau immédiat est refusé', async ({ page }) => {
    await startNight(page, 'seed=61');
    await tickTo(page, hhmm(25, 10));
    await goToWindow(page);
    const uses = await page.evaluate(() => { const r = window.__rdb; r.key('KeyF'); r.step(1); r.key('KeyF'); r.step(1); return r.sim.state.bucketUses; });
    expect(uses).toBe(1);
    await expect(page.locator('#log')).toContainText('se remplit');
  });

  test('le seau depuis la rue est refusé', async ({ page }) => {
    await startNight(page, 'seed=61');
    await tickTo(page, hhmm(22, 15));
    const uses = await page.evaluate(() => {
      const r = window.__rdb;
      r.player.loc = 'street'; r.player.pos.set(0, 0, 0); r.step(1); r.key('KeyF'); r.step(1);
      return r.sim.state.bucketUses;
    });
    expect(uses).toBe(0);
    await expect(page.locator('#log')).toContainText('depuis la fenêtre');
  });
});

test.describe('nuit : vue légale (L)', () => {
  test.beforeEach(async ({ page }) => { await page.addInitScript(GL_COUNTER); });

  test('L affiche puis masque les zones et le couloir (draw calls en plus, puis comme avant)', async ({ page }) => {
    await startNight(page, 'seed=71');
    await tickTo(page, hhmm(22, 30));
    await page.evaluate(() => { const r = window.__rdb; r.player.loc = 'street'; r.player.pos.set(0, 0, -30); r.player.yaw = Math.PI; r.player.pitch = -0.35; r.step(2); });
    const off = await frameStats(page);
    await page.evaluate(() => window.__rdb.key('KeyL'));
    const on = await frameStats(page);
    await page.evaluate(() => window.__rdb.key('KeyL'));
    const off2 = await frameStats(page);
    expect(on.calls, 'la vue légale ajoute ses calques').toBeGreaterThan(off.calls);
    expect(off2.calls).toBeLessThan(on.calls);
  });

  test('un débordement sur le couloir se prouve depuis la rue à moins de 5 m (mètre ruban)', async ({ page }) => {
    let found = null;
    for (const seed of [71, 72, 73, 74]) {
      await startNight(page, `seed=${seed}`);
      await tickTo(page, hhmm(22, 10));
      found = await page.evaluate(() => window.__rdb.sim.state.tables.find((t) => t.out && window.__rdb.sim.encroachment(t) > 0)?.id ?? null);
      if (found != null) break;
    }
    test.skip(found == null, 'aucune table sur le couloir avec ces graines');
    const kinds = await page.evaluate((id) => {
      const r = window.__rdb;
      r.aimAt(id); r.step(2); r.key('KeyP'); r.step(1);
      return r.sim.state.evidence.map((e) => e.kind);
    }, found);
    expect(kinds).toContain('corridor');
  });
});

test.describe('samedi (?day=sat)', () => {
  test('foule debout, tables à plus de 6, gens qui urinent, et plus de bruit qu’un lundi', async ({ page }) => {
    const errors = watchErrors(page);
    const noiseAt23 = async (q) => {
      await startNight(page, q);
      await tickTo(page, hhmm(23, 0));
      return page.evaluate(() => {
        const { sim } = window.__rdb;
        const pos = { x: 0, y: 1.6, z: 0 };
        return {
          db: sim.noiseAt(pos, false),
          standing: sim.activeStanding().length,
          over6: sim.state.tables.filter((t) => t.out && t.count > 6).length,
          pees: sim.state.pees.length,
          label: document.getElementById('day').textContent,
        };
      });
    };
    const sat = await noiseAt23('seed=81&day=sat');
    const mon = await noiseAt23('seed=81');
    expect(sat.label).toContain('Samedi');
    expect(sat.standing).toBeGreaterThan(0);
    expect(sat.over6).toBeGreaterThan(0);
    expect(sat.pees).toBeGreaterThan(0);
    expect(mon.standing).toBe(0);
    expect(sat.db).toBeGreaterThan(mon.db);
    expect(errors).toEqual([]);
  });
});
