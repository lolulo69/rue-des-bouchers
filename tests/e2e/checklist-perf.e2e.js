// §13.I4 (part T) : bundle < 3 Mo, chargement < 5 s, temps de frame mesuré et journalisé.
// Le 60 fps sur un iGPU de portable reste une vérification Q (le CI rend en SwiftShader, sur CPU).
import { test, expect } from '@playwright/test';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = join(import.meta.dirname, '..', '..', 'dist');
const sizeOf = (dir) => readdirSync(dir).reduce((s, f) => {
  const p = join(dir, f);
  const st = statSync(p);
  return s + (st.isDirectory() ? sizeOf(p) : st.size);
}, 0);

test('bundle de production < 3 Mo (JS + CSS + HTML de dist/)', async () => {
  const files = [];
  const walk = (dir) => readdirSync(dir).forEach((f) => { const p = join(dir, f); if (statSync(p).isDirectory()) walk(p); else files.push(p); });
  walk(DIST);
  const code = files.filter((p) => /\.(js|css|html)$/.test(p)).reduce((s, p) => s + statSync(p).size, 0);
  test.info().annotations.push({ type: 'bundle', description: `${(code / 1024 / 1024).toFixed(2)} Mo de code, ${(sizeOf(DIST) / 1024 / 1024).toFixed(2)} Mo au total` });
  expect(code).toBeLessThan(3 * 1024 * 1024);
});

test('chargement : écran titre en moins de 5 s, puis temps de frame mesuré', async ({ page }) => {
  await page.goto('/?nolock=1&seed=7', { waitUntil: 'commit' });
  await expect(page.locator('#title')).toBeVisible({ timeout: 15_000 });
  // Depuis le début de la navigation (performance.now() de la page), jusqu'à l'écran titre affiché
  const loadMs = Math.round(await page.evaluate(() => performance.now()));
  test.info().annotations.push({ type: 'load', description: `${loadMs} ms jusqu'à l'écran titre` });
  expect(loadMs).toBeLessThan(5000);

  // Temps de frame : 30 requestAnimationFrame après le titre (rendu SwiftShader en CI : indicatif, non asserté)
  const ft = await page.evaluate(() => new Promise((resolve) => {
    const ts = [];
    const loop = (t) => { ts.push(t); if (ts.length < 31) requestAnimationFrame(loop); else resolve(ts); };
    requestAnimationFrame(loop);
  }));
  const deltas = ft.slice(1).map((t, i) => t - ft[i]).sort((a, b) => a - b);
  const median = deltas[Math.floor(deltas.length / 2)];
  const p95 = deltas[Math.floor(deltas.length * 0.95)];
  test.info().annotations.push({ type: 'frame', description: `médiane ${median.toFixed(1)} ms, p95 ${p95.toFixed(1)} ms (SwiftShader)` });
  console.log(`[perf] chargement ${loadMs} ms · frame médiane ${median.toFixed(1)} ms · p95 ${p95.toFixed(1)} ms`);
  expect(median).toBeGreaterThan(0);
});
