// Captures « rendues par le jeu lui-même » : captures du README, carte de partage 1200×630, favicon.
//   npm run dev (ou vite preview), puis : node scripts/capture-art.mjs [http://localhost:5173]
// Sorties : qa/screens/readme/*.png, public/social-card.png, public/favicon.png, public/apple-touch-icon.png
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://localhost:5173';
const OUT = 'qa/screens/readme';
mkdirSync(OUT, { recursive: true });
mkdirSync('public', { recursive: true });
const save = (path, dataUrl) => { writeFileSync(path, Buffer.from(dataUrl.split(',')[1], 'base64')); console.log('→', path); };

const browser = await chromium.launch({ args: ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-gpu'] });
const ctx = await browser.newContext();
ctx.setDefaultTimeout(240_000); // serveur de dev : premier chargement lent
ctx.setDefaultNavigationTimeout(240_000);

// Une nuit libre, la caméra posée à la main, rendu puis lecture du canvas dans la même tâche
async function night(page, query, setup) {
  await page.goto(`${BASE}/?nolock=1&seed=7${query}`);
  await page.waitForFunction(() => window.__rdb?.world);
  await page.evaluate(() => { localStorage.setItem('rdb.quality', 'haut'); document.querySelector('#start')?.click(); });
  await page.waitForTimeout(500);
  return page.evaluate(setup);
}
const shot = `(() => { const R = window.__rdb; for (let i = 0; i < 40; i++) R.step(1); return document.querySelector('canvas').toDataURL('image/png'); })()`;
const aim = `window.aim = (px, py, pz, tx, ty, tz, loc = 'street') => { const R = window.__rdb; R.player.loc = loc; R.player.pos.set(px, py - 1.65, pz); const dx = tx - px, dy = ty - py, dz = tz - pz; R.player.yaw = Math.atan2(-dx, -dz); R.player.pitch = Math.atan2(dy, Math.hypot(dx, dz)); };`;

{
  const page = await ctx.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
  // 1. La rue au crépuscule, terrasses pleines
  await night(page, '', new Function(`${aim}; const R = window.__rdb; const S = R.sim.state; while (S.min < 20 * 60 + 50) R.sim.tick(0.5); const z = R.world.anchors.bernadetteDoor.z; aim(1.4, 1.75, z - 14, -0.6, 1.6, z + 10);`));
  save(`${OUT}/01-rue-au-crepuscule.png`, await page.evaluate(shot));
  // 2. Depuis la fenêtre de Pilou, penché sur la terrasse
  await page.evaluate(new Function(`${aim}; const R = window.__rdb; const S = R.sim.state; while (S.min < 21 * 60 + 50) R.sim.tick(0.5); const w = R.world.window.pos, apt = R.world.apt; R.player.loc = 'apt'; R.player.pos.set(-3.6, apt.floor, w.z); R.player.yaw = -Math.PI / 2 + 0.25; R.player.pitch = -1.0;`));
  save(`${OUT}/02-depuis-la-fenetre.png`, await page.evaluate(shot));
  // 3. Samedi, la drache : la terrasse se vide sous la pluie
  await night(page, '&day=sat', new Function(`${aim}; const R = window.__rdb; const S = R.sim.state; while (S.min < 21 * 60) R.sim.tick(0.5); S.weather = { kind: 'drache', start: S.min + 0.5, end: S.min + 70, applied: false }; while (S.min < 21 * 60 + 2.5) R.sim.tick(0.25); const z = R.world.anchors.bernadetteDoor.z; aim(1.5, 1.75, z - 10, -1.4, 1.2, z + 2);`));
  save(`${OUT}/03-samedi-sous-la-drache.png`, await page.evaluate(shot));
  // Carte de partage : la rue au crépuscule + titre, composée dans la page
  await page.setViewportSize({ width: 1200, height: 630 });
  await night(page, '', new Function(`${aim}; const R = window.__rdb; const S = R.sim.state; while (S.min < 20 * 60 + 40) R.sim.tick(0.5); const z = R.world.anchors.bernadetteDoor.z; aim(1.2, 2.2, z - 16, -0.4, 2.6, z + 12);`));
  const card = await page.evaluate(`(() => {
    const R = window.__rdb; for (let i = 0; i < 40; i++) R.step(1);
    const gl = document.querySelector('canvas');
    const c = document.createElement('canvas'); c.width = 1200; c.height = 630;
    const g = c.getContext('2d');
    g.drawImage(gl, 0, 0, 1200, 630);
    const grd = g.createLinearGradient(0, 0, 0, 630); grd.addColorStop(0, 'rgba(10,10,18,0.15)'); grd.addColorStop(0.55, 'rgba(10,10,18,0.35)'); grd.addColorStop(1, 'rgba(10,10,18,0.85)');
    g.fillStyle = grd; g.fillRect(0, 0, 1200, 630);
    g.fillStyle = '#e9c46a'; g.font = '800 104px system-ui, -apple-system, Segoe UI, sans-serif'; g.textAlign = 'left';
    g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 18; g.fillText('Rue des Bouchers', 60, 470);
    g.shadowBlur = 8; g.fillStyle = '#f6efe0'; g.font = '600 34px system-ui, -apple-system, Segoe UI, sans-serif';
    g.fillText('Les terrasses doivent rentrer à 22 h. En théorie.', 64, 528);
    g.font = '400 22px system-ui, -apple-system, Segoe UI, sans-serif'; g.fillStyle = '#d9d2c4';
    g.fillText('Un jeu 3D dans le navigateur · Vieux-Lille · œuvre de fiction', 64, 574);
    return c.toDataURL('image/png');
  })()`);
  save("public/social-card.png", card); // puis converti en JPEG (sips) : public/social-card.jpg
  await page.close();
}
{
  // 4. Le casting : planche de portraits (art.portrait), et le favicon (Biloute)
  const page = await ctx.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
  await page.goto(`${BASE}/src/art/gallery/`);
  await page.waitForFunction(() => window.__gallery);
  const board = await page.evaluate(`(async () => {
    const art = window.__gallery.art;
    const cast = [['pilou','happy'],['jeremie','neutral'],['biloute','happy'],['klaas','suspicious'],['hilde','happy'],['tatie','surprised'],['seb','happy'],['nico','suspicious'],['gaufre','neutral'],['hippolyte','neutral'],['dede','happy'],['ghislain','angry'],['serveur','sad'],['lemaire','happy'],['benali','neutral'],['delphine','suspicious']];
    const NAMES = { pilou: 'Pilou', jeremie: 'Jérémie', biloute: 'Biloute', klaas: 'Klaas', hilde: 'Hilde', tatie: 'Tatie Bouchon', seb: 'Seb', nico: 'Nico', gaufre: 'Gaufre', hippolyte: 'Hippolyte', dede: 'Dédé', ghislain: 'Ghislain', serveur: 'Théo', lemaire: 'Lemaire', benali: 'Benali', delphine: 'Delphine' };
    const c = document.createElement('canvas'); c.width = 1600; c.height = 760;
    const g = c.getContext('2d'); g.fillStyle = '#1d2027'; g.fillRect(0, 0, 1600, 760);
    const load = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = src; });
    for (let i = 0; i < cast.length; i++) {
      const [id, e] = cast[i];
      const img = await load(art.portrait(id, e, { size: 256 }));
      const x = 40 + (i % 8) * 192, y = 115 + Math.floor(i / 8) * 300;
      g.save(); g.beginPath(); g.roundRect(x, y, 176, 176, 22); g.clip(); g.drawImage(img, x, y, 176, 176); g.restore();
      g.fillStyle = '#f6efe0'; g.font = '600 22px system-ui, sans-serif'; g.textAlign = 'center'; g.fillText(NAMES[id] ?? id, x + 88, y + 210);
    }
    g.fillStyle = '#e9c46a'; g.font = '800 46px system-ui, sans-serif'; g.textAlign = 'left'; g.fillText('Le casting', 40, 80);
    return c.toDataURL('image/png');
  })()`);
  save(`${OUT}/04-le-casting.png`, board);
  const icon = await page.evaluate(`window.__gallery.art.portrait('biloute', 'happy', { size: 64 })`);
  save('public/favicon.png', icon);
  save('public/apple-touch-icon.png', await page.evaluate(`window.__gallery.art.portrait('biloute', 'happy', { size: 180 })`));
  // 5. Fin de partie : un tableau (bonus)
  await page.evaluate(`[...document.querySelectorAll('button')].find((b) => b.textContent === 'fin : turncoat').click()`);
  save(`${OUT}/05-fin-le-transfuge.png`, await page.evaluate(`(() => { window.__gallery.step(10); return document.getElementById('view').toDataURL('image/png'); })()`));
  await page.close();
}
{
  // Contrôle visuel de l'écran titre (travelling) : capture d'écran de la page entière
  const page = await ctx.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(BASE);
  await page.waitForTimeout(6000);
  await page.screenshot({ path: `${OUT}/00-ecran-titre.png` });
  console.log('→', `${OUT}/00-ecran-titre.png`);
  await page.close();
}
await browser.close();
