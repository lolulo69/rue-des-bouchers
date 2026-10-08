import { test, expect } from '@playwright/test';
import { watchErrors } from './helpers.js';

// Parcours de campagne par la vraie interface de jour (src/ui), en complément de campaign.e2e.js (agent build :
// titre → nuit 3D → bilan → jour 2 → « Continuer »). Ici : matin Koddex au clic, action d'après-midi, carte d'événement,
// rechargement en pleine journée, et écran de fin après 14 jours joués rapidement (§13.A, D, F, items Q).

async function newCampaign(page, seed = 5) {
  await page.goto(`/?nolock=1&seed=${seed}`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.click('#campaign');
  await page.click('[data-testid=title-new]');
  if (await page.locator('[data-testid=intro-skip]').count()) await page.click('[data-testid=intro-skip]');
  await expect(page.locator('[data-testid=day-header]')).toHaveAttribute('data-day', '1');
}

// Avance par l'API du moteur jusqu'à l'étape voulue (les nuits sont simulées sans 3D), sauvegarde, redessine.
const driveTo = (page, target, { maxDays = 14 } = {}) => page.evaluate(({ target, maxDays }) => {
  const { ui } = window.__rdb;
  const c = ui.campaign;
  for (let i = 0; i < 2000 && c.step !== target && !c.ended && c.state.day <= maxDays; i++) {
    if (c.step === 'cards') { const card = c.card(); c.resolveCard(card.choices.find((x) => x.available)?.i ?? 0); }
    else if (c.step === 'koddex') c.koddex(['work', 'work', 'work']);
    else if (c.step === 'actions') c.endAfternoon();
    else if (c.step === 'night') { const sim = c.createNight(); for (let k = 0; !sim.state.ended && k < 2000; k++) sim.tick(1); c.finishNight(sim); }
    else if (c.step === 'recap') c.nextDay();
  }
  localStorage.setItem(window.__rdb.saveKey, JSON.stringify(c.save()));
  ui.render();
  return c.step;
}, { target, maxDays });

// Les boutons Koddex sont désactivés pendant l'effet machine à écrire : un clic sur le terminal le saute.
async function clickKoddex(page, id) {
  const btn = page.locator(`[data-testid=koddex-option][data-id="${id}"]`).first();
  for (let i = 0; i < 40 && await btn.isDisabled(); i++) await page.click('[data-testid=terminal]');
  await btn.click();
}

test.describe('campagne (interface de jour)', () => {
  test.setTimeout(240_000);

  test('carte d’événement : un choix affiche son résultat, puis la carte suivante ou le matin', async ({ page }) => {
    const errors = watchErrors(page);
    await newCampaign(page);
    const card = page.locator('[data-testid=card]');
    test.skip(!(await card.count()), 'pas de carte au début du jour 1 avec cette graine');
    const id = await card.getAttribute('data-id');
    await page.locator('[data-testid=card-choice]:not([disabled])').first().click();
    // Soit une carte de résultat, soit directement l'écran suivant
    if (await page.locator('[data-testid=result]').count()) {
      await expect(page.locator('[data-testid=result]')).toBeVisible();
      await page.click('[data-testid=result-next]');
    }
    expect(await page.evaluate(() => window.__rdb.ui.campaign.state.cards?.[0]?.id ?? null)).not.toBe(id);
    expect(errors).toEqual([]);
  });

  test('matin Koddex au clic : 3 prompts dont un projet perso, journal du terminal, drapeau débloqué', async ({ page }) => {
    const errors = watchErrors(page);
    await newCampaign(page);
    expect(await driveTo(page, 'koddex')).toBe('koddex');
    await expect(page.locator('[data-testid=terminal]')).toBeVisible();
    const proj = await page.evaluate(() => window.__rdb.ui.campaign.koddexOptions().sideProjects.find((p) => p.available && (p.cost?.prompts ?? 1) === 1) ?? null);
    test.skip(!proj, 'aucun projet perso disponible au jour 1');
    const job0 = await page.evaluate(() => window.__rdb.ui.campaign.state.stats.job);
    await clickKoddex(page, 'work');
    await clickKoddex(page, proj.id);
    await clickKoddex(page, 'work');
    const s = await page.evaluate((u) => ({ has: window.__rdb.ui.campaign.has(u), job: window.__rdb.ui.campaign.state.stats.job, step: window.__rdb.ui.campaign.step }), proj.unlocks);
    expect(s.has).toBe(true);
    expect(s.job).not.toBe(job0);
    expect(s.step).not.toBe('koddex');
    expect(errors).toEqual([]);
  });

  // BUG-002 (qa/bugs.md), corrigé : après le 3e prompt, le bilan de la matinée (« ✔ Livré », Job ±, « Quitter Koddex »)
  // reste affiché jusqu'au clic, même si le moteur est déjà passé à l'après-midi. Garde-fou de régression.
  test('BUG-002 · le bilan de la matinée Koddex reste affiché jusqu’à « Quitter Koddex »', async ({ page }) => {
    await newCampaign(page);
    await driveTo(page, 'koddex');
    const proj = await page.evaluate(() => window.__rdb.ui.campaign.koddexOptions().sideProjects.find((p) => p.available && (p.cost?.prompts ?? 1) === 1) ?? null);
    await clickKoddex(page, 'work');
    if (proj) await clickKoddex(page, proj.id); else await clickKoddex(page, 'work');
    await clickKoddex(page, 'work');
    await expect(page.locator('[data-testid=terminal]')).toContainText('Fin de matinée', { timeout: 30_000 });
    if (proj?.result) await expect(page.locator('[data-testid=terminal]')).toContainText('Livré');
    await page.click('[data-testid=terminal]');
    await page.click('[data-testid=koddex-done]');
    await expect(page.locator('[data-testid=terminal]')).toHaveCount(0);
  });

  test('après-midi : une action coûte un créneau et affiche son résultat, « fin d’après-midi » mène à la nuit', async ({ page }) => {
    const errors = watchErrors(page);
    await newCampaign(page);
    expect(await driveTo(page, 'actions')).toBe('actions');
    const slots = page.locator('[data-testid=slots]');
    const left0 = Number(await slots.getAttribute('data-left'));
    expect(left0).toBeGreaterThan(0);
    const action = page.locator('[data-testid=action]:not([disabled])').first();
    const label = await action.locator('.lbl').textContent();
    await action.click();
    await expect(page.locator('[data-testid=result]')).toContainText(label);
    await page.click('[data-testid=result-next]');
    expect(Number(await slots.getAttribute('data-left'))).toBeLessThan(left0);
    await page.click('[data-testid=action-end]');
    // Des cartes du soir peuvent s'intercaler avant la nuit
    expect(await driveTo(page, 'night')).toBe('night');
    await expect(page.locator('[data-testid=night-go]')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('rechargement en plein après-midi : même jour, même étape, même temps restant', async ({ page }) => {
    await newCampaign(page);
    await driveTo(page, 'actions');
    await page.locator('[data-testid=action]:not([disabled])').first().click();
    await page.click('[data-testid=result-next]');
    const before = await page.evaluate(() => { const c = window.__rdb.ui.campaign; return { day: c.state.day, step: c.step, left: c.state.timeLeft }; });
    await page.goto('/?nolock=1&seed=5');
    await page.click('#campaign');
    await page.click('[data-testid=title-continue]');
    await expect(page.locator('[data-testid=day-header]')).toHaveAttribute('data-day', String(before.day));
    const after = await page.evaluate(() => { const c = window.__rdb.ui.campaign; return { day: c.state.day, step: c.step, left: c.state.timeLeft }; });
    expect(after).toEqual(before);
    await expect(page.locator('[data-testid=slots]')).toHaveAttribute('data-left', String(before.left));
  });

  test('fin de campagne : écran de fin avec titre, une de La Voix du Nordiste, épilogue et fins découvertes', async ({ page }) => {
    const errors = watchErrors(page);
    await newCampaign(page, 9);
    expect(await driveTo(page, 'ended')).toBe('ended');
    const end = await page.evaluate(() => window.__rdb.ui.campaign.state.ending);
    const ending = page.locator('[data-testid=ending]');
    await expect(ending).toBeVisible();
    await expect(ending).toHaveAttribute('data-id', end.id);
    await expect(ending).toContainText(end.title);
    // UI v0.7 : la une est un article à part (ending-paper), à côté de la carte d'épilogue
    await expect(page.locator('[data-testid=ending-paper]')).toContainText('La Voix du Nordiste');
    await expect(page.locator('.ui-epilogue p').first()).toBeVisible();
    await expect(page.locator(`[data-testid=endings] [data-ending="${end.id}"]`)).not.toHaveClass(/locked/);
    // Les fins secrètes ne sont pas listées tant qu'elles n'ont pas été atteintes
    if (end.id !== 'turncoat') await expect(page.locator('[data-testid=endings] [data-ending="turncoat"]')).toHaveCount(0);
    await page.screenshot({ path: 'test-results/campaign-ending.png', timeout: 60_000 });
    expect(errors).toEqual([]);
  });

  test('BUG-004 (corrigé) · la dernière carte d’une phase affiche son résultat avant la phase suivante', async ({ page }) => {
    await newCampaign(page, 101);
    let checked = 0;
    for (let guard = 0; guard < 80 && checked < 2; guard++) {
      // Avance par l'API jusqu'à la dernière carte d'une phase dont le choix a un texte de résultat
      const last = await page.evaluate(() => {
        const { ui } = window.__rdb, c = ui.campaign;
        for (let i = 0; i < 3000 && !c.ended && c.state.day <= 14; i++) {
          if (c.step === 'cards') {
            const k = c.card(), ch = k.choices.find((x) => x.available) ?? k.choices[0];
            if (c.state.cards.length === 1 && k.data?.choices?.[ch.i]?.result) { ui.render(); return { i: ch.i, result: k.data.choices[ch.i].result }; }
            c.resolveCard(ch.i);
          } else if (c.step === 'koddex') c.koddex(['work', 'work', 'work']);
          else if (c.step === 'actions') c.endAfternoon();
          else if (c.step === 'night') { const sim = c.createNight(); for (let k = 0; !sim.state.ended && k < 2000; k++) sim.tick(1); c.finishNight(sim); }
          else if (c.step === 'recap') c.nextDay();
        }
        return null;
      });
      if (!last) break;
      await page.click(`[data-testid=card-choice][data-i="${last.i}"]`);
      await expect(page.locator('[data-testid=result]')).toContainText(last.result.slice(0, 30));
      await page.click('[data-testid=result-next]');
      await expect(page.locator('[data-testid=result]')).toHaveCount(0);
      checked++;
    }
    test.skip(!checked, 'aucune fin de phase avec un texte de résultat sur toute la campagne (graine 101)');
  });

  test('BUG-003 (corrigé) · la commission du J14 joue sa scène (répliques) avant les plaidoiries', async ({ page }) => {
    await newCampaign(page, 101); // la graine 101 atteint le J14 en jeu passif
    const scene = await page.evaluate(() => {
      const { ui } = window.__rdb;
      const c = ui.campaign;
      for (let i = 0; i < 2000 && !c.ended; i++) {
        if (c.step === 'cards') { const k = c.card(); if (k.id === 'd14_commission') break; c.resolveCard(k.choices.find((x) => x.available)?.i ?? 0); }
        else if (c.step === 'koddex') c.koddex(['work', 'work', 'work']);
        else if (c.step === 'actions') c.endAfternoon();
        else if (c.step === 'night') { const sim = c.createNight(); for (let k = 0; !sim.state.ended && k < 2000; k++) sim.tick(1); c.finishNight(sim); }
        else if (c.step === 'recap') c.nextDay();
      }
      ui.render();
      const k = c.step === 'cards' ? c.card() : null;
      return k?.id === 'd14_commission' ? (k.scene ?? []).map((s) => s.text) : null;
    });
    test.skip(!scene, 'campagne terminée avant la commission avec cette graine');
    expect(scene.length).toBeGreaterThan(1);
    const shown = await page.locator('[data-testid=card]').innerText();
    for (const t of scene) expect(shown).toContain(t.slice(0, 40));
  });
});
