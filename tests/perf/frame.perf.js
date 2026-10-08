import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { GL_COUNTER, startNight, tickTo, hhmm } from '../e2e/helpers.js';

// §13.I : 60 fps sur un iGPU de portable, chargement < 5 s.
// En CI, Chromium rend via SwiftShader (CPU) : les fps y sont indicatifs. Le budget 60 fps est donc un avertissement
// (annotation + console), bloquant seulement avec PERF_STRICT=1 (machine avec GPU).
const STRICT = !!process.env.PERF_STRICT;
const OUT = 'test-results/perf';

test.beforeEach(async ({ page }) => { await page.addInitScript(GL_COUNTER); });

test('chargement < 5 s (titre visible et première frame rendue)', async ({ page }) => {
  const t0 = Date.now();
  await page.goto('/?nolock=1&seed=3');
  await page.locator('#start').waitFor({ state: 'visible' });
  await page.waitForFunction(() => window.__rdb && window.__gl.calls > 0);
  const ms = Date.now() - t0;
  const nav = await page.evaluate(() => {
    const n = performance.getEntriesByType('navigation')[0];
    return { domContentLoaded: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd), transferKB: Math.round(n.transferSize / 1024) };
  });
  console.log(`[perf] chargement : ${ms} ms jusqu'à la 1re frame`, nav);
  test.info().annotations.push({ type: 'perf', description: `chargement ${ms} ms` });
  expect(ms).toBeLessThan(5000);
});

test('samedi, rue pleine : frame time sur 10 s, draw calls, triangles', async ({ page }) => {
  test.setTimeout(180_000);
  await startNight(page, 'seed=3&day=sat');
  await tickTo(page, hhmm(23, 0));
  // Vue la plus chargée : au milieu de la rue, regard vers la place (terrasses, foule debout, façades)
  await page.evaluate(() => {
    const { player, step } = window.__rdb;
    player.loc = 'street';
    player.pos.set(0, 0, -35);
    player.yaw = Math.PI;
    player.pitch = -0.08;
    step(2);
  });
  const r = await page.evaluate(() => new Promise((resolve) => {
    const times = [];
    let last = performance.now();
    window.__glReset();
    const end = last + 10_000;
    const loop = (ts) => {
      times.push(ts - last);
      last = ts;
      if (ts < end) requestAnimationFrame(loop);
      else {
        const frames = times.length;
        const sorted = [...times].sort((a, b) => a - b);
        resolve({
          frames,
          fps: Math.round((frames / 10) * 10) / 10,
          avgMs: Math.round((times.reduce((s, t) => s + t, 0) / frames) * 10) / 10,
          p95Ms: Math.round(sorted[Math.floor(frames * 0.95)] * 10) / 10,
          drawCalls: Math.round(window.__gl.calls / frames),
          triangles: Math.round(window.__gl.triangles / frames),
        });
      }
    };
    requestAnimationFrame(loop);
  }));
  r.renderer = await page.evaluate(() => {
    const gl = document.createElement('canvas').getContext('webgl2');
    const ext = gl?.getExtension('WEBGL_debug_renderer_info');
    return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'inconnu';
  });
  mkdirSync(OUT, { recursive: true });
  writeFileSync(`${OUT}/saturday-street.json`, JSON.stringify({ ...r, at: new Date().toISOString(), ci: !!process.env.CI }, null, 2));
  console.log('[perf] samedi, rue :', r);
  test.info().annotations.push({ type: 'perf', description: `${r.fps} fps · p95 ${r.p95Ms} ms · ${r.drawCalls} draw calls · ${r.triangles} triangles · ${r.renderer}` });
  expect(r.frames, "la boucle de rendu tourne").toBeGreaterThanOrEqual(2);
  if (r.fps < 60) {
    const msg = `budget 60 fps non tenu : ${r.fps} fps (${r.renderer})`;
    test.info().annotations.push({ type: 'warning', description: msg });
    console.warn(`[perf] ⚠ ${msg}`);
    if (STRICT) expect(r.fps).toBeGreaterThanOrEqual(60);
  }
});
