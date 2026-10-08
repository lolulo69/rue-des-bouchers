// Amorce du jeu : écran d'erreur global (jamais d'écran noir), écran de chargement avec progression,
// puis le jeu lui-même (game.js), dont les gros morceaux (three.js, art, simulation, textes) sont des chunks séparés.
const $ = (id) => document.getElementById(id);

// ---------- Écran d'erreur ----------
// Le navigateur remonte ici toute erreur non attrapée et toute promesse rejetée. On affiche un écran en français
// avec « Recharger » et « Copier le rapport » (erreur, pile, état de la sauvegarde, version, navigateur).
const IGNORED = [/ResizeObserver loop/i, /Script error\.?$/];
let fatalShown = false;
function saveSummary() {
  try {
    const s = JSON.parse(localStorage.getItem('rdb.save.v1') ?? 'null');
    return s ? `jour ${s.day}, ${s.phase}, étape ${s.step}, schéma v${s.version}, graine ${s.seed}` : 'aucune';
  } catch { return 'illisible'; }
}
function buildReport(err) {
  const e = err instanceof Error ? err : new Error(String(err?.message ?? err));
  return [
    'Rue des Bouchers · rapport d’erreur',
    `Date : ${new Date().toISOString()}`,
    `Version : ${typeof __BUILD__ !== 'undefined' ? __BUILD__ : 'dev'}`,
    `Page : ${location.href}`,
    `Navigateur : ${navigator.userAgent}`,
    `Sauvegarde : ${saveSummary()}`,
    '',
    `${e.name}: ${e.message}`,
    e.stack ?? '(pas de pile)',
  ].join('\n');
}
async function copy(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch { /* repli ci-dessous */ }
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.append(ta);
  ta.select();
  const ok = document.execCommand?.('copy');
  ta.remove();
  return !!ok;
}
function showFatal(err) {
  if (fatalShown) return;
  fatalShown = true;
  const report = buildReport(err);
  console.error(report);
  document.exitPointerLock?.();
  $('loader')?.classList.add('hidden');
  const box = $('fatal');
  $('fatal-detail').textContent = String(err?.message ?? err).slice(0, 300);
  $('fatal-reload').onclick = () => location.reload();
  $('fatal-copy').onclick = async () => { $('fatal-copy').textContent = (await copy(report)) ? 'Rapport copié ✓' : 'Copie impossible : voir la console'; };
  box.classList.remove('hidden');
}
addEventListener('error', (e) => {
  if (IGNORED.some((re) => re.test(e.message ?? ''))) return;
  if (e.filename && !e.filename.startsWith(location.origin)) return; // extensions du navigateur
  showFatal(e.error ?? e.message);
});
addEventListener('unhandledrejection', (e) => showFatal(e.reason));
window.__rdbFatal = showFatal; // pour les tests

// ---------- Écran de chargement ----------
let shown = 0;
function progress(p, label) {
  shown = Math.max(shown, p);
  $('loader-bar').style.width = `${Math.round(shown * 100)}%`;
  if (label) $('loader-label').textContent = label;
}
window.__rdbLoading = progress;
window.__rdbLoaded = () => $('loader').classList.add('hidden');

// Les chunks se chargent en parallèle ; chacun fait avancer la barre. game.js les retrouve ensuite en cache.
const CHUNKS = [
  ['moteur 3D', () => import('three')],
  ['décor et personnages', () => import('./world.js')],
  ['simulation', () => import('./sim/index.js')],
  ['textes', () => import('./sim/narrative.js')],
];
progress(0.05, 'Chargement…');
let done = 0;
await Promise.all(CHUNKS.map(([label, load]) => load().then(() => { done++; progress(0.05 + 0.7 * (done / CHUNKS.length), `Chargement : ${label}…`); })));
progress(0.8, 'Construction de la rue…');
await import('./game.js');
