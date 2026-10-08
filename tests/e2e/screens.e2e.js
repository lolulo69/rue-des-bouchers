import { test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { startNight, tickTo, goToWindow, hhmm } from './helpers.js';

// Captures des vues clés pour la revue du design (qa/screens/). Lancement : npm run qa:screens.
// Désactivé dans la suite normale (CI) : c'est une commande de revue, pas un test.
test.skip(!process.env.QA_SCREENS, 'captures QA : lancer `npm run qa:screens`');

const DIR = 'qa/screens';
const shot = (page, name) => page.screenshot({ path: `${DIR}/${name}.jpg`, type: 'jpeg', quality: 80, timeout: 90_000 });
test.beforeAll(() => mkdirSync(DIR, { recursive: true }));
test.setTimeout(240_000);

test('écran titre', async ({ page }) => {
  await page.goto('/?nolock=1&seed=7');
  await page.locator('#start').waitFor();
  await shot(page, '01-title');
});

test('rue au crépuscule, 20h45, devant la porte de Pilou', async ({ page }) => {
  await startNight(page, 'seed=7');
  await tickTo(page, hhmm(20, 45));
  await page.evaluate(() => { const { player, sim, step } = window.__rdb; const d = sim.cfg.ANCHORS.streetDoor; player.loc = 'street'; player.pos.set(d.x + 0.6, 0, d.z); player.yaw = Math.PI; player.pitch = 0; step(6); });
  await shot(page, '02-street-dusk');
});

test('vue de la fenêtre de Pilou, 22h15', async ({ page }) => {
  await startNight(page, 'seed=7');
  await tickTo(page, hhmm(22, 15));
  await goToWindow(page);
  // Regard plongeant : les tables de l'estaminet doivent rester visibles sous le store (§1b, QA v0.2 c)
  await page.evaluate(() => { window.__rdb.player.pitch = -1.05; window.__rdb.step(6); });
  await shot(page, '03-window-2215');
});

test('penché à la fenêtre : les tables de l’estaminet juste en dessous, 22h15', async ({ page }) => {
  await startNight(page, 'seed=7');
  await tickTo(page, hhmm(22, 15));
  await page.evaluate(() => {
    const { player, world, sim, step } = window.__rdb;
    const W = sim.cfg.STREET.halfWidth, win = sim.cfg.ANCHORS.pilouWindow;
    const eye = { x: -W - 0.2, y: world.apt.floor + 1.65, z: win.z };
    const t = sim.state.tables.filter((x) => x.out && x.restId === 'bernadette').sort((p, q) => Math.abs(p.z - win.z) - Math.abs(q.z - win.z))[0];
    player.loc = 'apt';
    player.pos.set(eye.x, world.apt.floor, eye.z);
    if (t) {
      player.yaw = Math.atan2(-(t.x - eye.x), -(t.z - eye.z));
      player.pitch = -Math.atan2(eye.y - 0.8, Math.hypot(t.x - eye.x, t.z - eye.z));
    }
    step(6);
  });
  await shot(page, '03b-window-lean');
});

test('vue légale (L) : zones et couloir, 22h30', async ({ page }) => {
  await startNight(page, 'seed=7');
  await tickTo(page, hhmm(22, 30));
  await page.evaluate(() => { const r = window.__rdb; r.player.loc = 'street'; r.player.pos.set(0, 0, -30); r.player.yaw = Math.PI; r.player.pitch = -0.35; r.key('KeyL'); r.step(6); });
  await shot(page, '04-legal-view');
});

test('photo d’une table + dossier (Tab)', async ({ page }) => {
  await startNight(page, 'seed=7');
  await tickTo(page, hhmm(22, 20));
  await page.evaluate(() => {
    const r = window.__rdb;
    const t = r.sim.state.tables.find((x) => x.out);
    if (t) { r.aimAt(t.id); r.step(2); r.key('KeyP'); }
    r.step(12); // après le flash
  });
  await shot(page, '05-photo');
  await page.evaluate(() => { window.__rdb.key('Tab'); window.__rdb.step(1); });
  await shot(page, '06-dossier');
});

test('téléphone', async ({ page }) => {
  await startNight(page, 'seed=7');
  await tickTo(page, hhmm(22, 10));
  await page.evaluate(() => { window.__rdb.key('KeyT'); window.__rdb.step(1); });
  await shot(page, '07-phone');
});

test('samedi 23h : la foule', async ({ page }) => {
  await startNight(page, 'seed=3&day=sat');
  await tickTo(page, hhmm(23, 0));
  await page.evaluate(() => { const r = window.__rdb; r.player.loc = 'street'; r.player.pos.set(0, 0, -35); r.player.yaw = Math.PI; r.player.pitch = -0.08; r.step(6); });
  await shot(page, '08-saturday-crowd');
});

test('place Maurice-Schumann vue depuis la rue (Klaas à sa fenêtre), 21h30', async ({ page }) => {
  await startNight(page, 'seed=7');
  await tickTo(page, hhmm(21, 30));
  await page.evaluate(() => { const r = window.__rdb; r.player.loc = 'street'; r.player.pos.set(0, 0, 30); r.player.yaw = Math.PI; r.player.pitch = 0.1; r.step(6); });
  await shot(page, '09-square-klaas');
});

test('seau d’eau depuis la fenêtre (éclaboussure)', async ({ page }) => {
  await startNight(page, 'seed=61');
  await tickTo(page, hhmm(22, 15));
  await goToWindow(page);
  await page.evaluate(() => { const r = window.__rdb; r.player.pitch = -1.05; r.key('KeyF'); r.step(8); });
  await shot(page, '10-bucket');
});

test('bilan de fin de nuit', async ({ page }) => {
  await startNight(page, 'seed=7');
  await tickTo(page, hhmm(22, 15));
  await page.evaluate(() => window.__rdb.sim.act({ type: 'police' }));
  await page.evaluate(() => { const { sim, step } = window.__rdb; for (let i = 0; !sim.state.ended && i < 4000; i++) { sim.tick(0.5); if (i % 60 === 0) step(1); } step(1); });
  await page.locator('#end').waitFor();
  await shot(page, '11-end-of-night');
});
