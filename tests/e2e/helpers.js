// Outils partagés des tests e2e (QA). Pas de modification du code de l'app : tout passe par les hooks
// window.__rdb (sim, player, world, step, aimAt, key) et par un compteur WebGL injecté avant le chargement.

// Collecte les erreurs console / exceptions de la page
export function watchErrors(page) {
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  return errors;
}

// Compteur d'appels de dessin WebGL (draw calls + triangles), sans toucher au renderer de l'app.
// window.__gl = { calls, triangles } cumulés ; window.__glReset() les remet à zéro.
export const GL_COUNTER = () => {
  const stats = { calls: 0, triangles: 0 };
  window.__gl = stats;
  window.__glReset = () => { stats.calls = 0; stats.triangles = 0; };
  const TRI = 4, STRIP = 5, FAN = 6;
  const tris = (mode, count, inst = 1) => (mode === TRI ? count / 3 : mode === STRIP || mode === FAN ? Math.max(0, count - 2) : 0) * inst;
  for (const C of [window.WebGLRenderingContext, window.WebGL2RenderingContext].filter(Boolean)) {
    const P = C.prototype;
    const wrap = (name, f) => {
      const orig = P[name];
      if (!orig) return;
      P[name] = function (...a) { stats.calls++; stats.triangles += f(...a); return orig.apply(this, a); };
    };
    wrap('drawArrays', (mode, first, count) => tris(mode, count));
    wrap('drawElements', (mode, count) => tris(mode, count));
    wrap('drawArraysInstanced', (mode, first, count, inst) => tris(mode, count, inst));
    wrap('drawElementsInstanced', (mode, count, type, offset, inst) => tris(mode, count, inst));
    wrap('drawRangeElements', (mode, start, end, count) => tris(mode, count));
  }
};

// Ouvre une nuit (?nolock=1) et clique « Commencer ».
export async function startNight(page, query = '') {
  await page.goto(`/?nolock=1${query ? `&${query}` : ''}`);
  await page.locator('#start').click();
  await page.locator('#hud').waitFor({ state: 'visible' });
  await page.evaluate(() => window.__rdb.step(2));
}

// Avance la simulation jusqu'à la minute `min` (minutes depuis minuit, > 24*60 après minuit), en vidant les événements
// par une frame de temps en temps (sinon le journal HUD ne se met pas à jour).
export function tickTo(page, min) {
  return page.evaluate((target) => {
    const { sim, step } = window.__rdb;
    for (let i = 0; sim.state.min < target && !sim.state.ended && i < 5000; i++) {
      sim.tick(Math.min(0.5, target - sim.state.min));
      if (i % 40 === 0) step(1);
    }
    step(1);
    return sim.state.min;
  }, min);
}

// Place Pilou à sa fenêtre (dans l'appartement), regard vers la rue en contrebas.
export function goToWindow(page) {
  return page.evaluate(() => {
    const { player, world, sim, step } = window.__rdb;
    const w = sim.cfg.ANCHORS.pilouWindow;
    player.loc = 'apt';
    player.pos.set(world.apt.x1 - 0.5, world.apt.floor, w.z);
    player.yaw = -Math.PI / 2;
    player.pitch = -0.6;
    step(2);
  });
}

// Draw calls / triangles d'UNE frame rendue via step(1)
export function frameStats(page) {
  return page.evaluate(() => {
    window.__glReset();
    window.__rdb.step(1);
    return { ...window.__gl };
  });
}

export const hhmm = (h, m = 0) => h * 60 + m;
