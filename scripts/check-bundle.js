// §13.I : le build de prod (dist/) doit peser moins de 3 Mo. Usage : npm run check:bundle (build puis vérification).
import { readdirSync, statSync, existsSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';

const DIST = join(import.meta.dirname, '..', 'dist');
const BUDGET = 3 * 1024 * 1024;
if (!existsSync(DIST)) {
  console.error('check-bundle : dist/ absent. Lancer `npm run build` avant (ou `npm run check:bundle`).');
  process.exit(2);
}
const files = (dir) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? files(p) : [p];
});
const rows = files(DIST).map((p) => ({ file: relative(DIST, p), bytes: statSync(p).size, gzip: gzipSync(readFileSync(p)).length }))
  .sort((a, b) => b.bytes - a.bytes);
const total = rows.reduce((s, r) => s + r.bytes, 0);
const gz = rows.reduce((s, r) => s + r.gzip, 0);
const kb = (b) => `${(b / 1024).toFixed(1)} Ko`;
for (const r of rows.slice(0, 10)) console.log(`${kb(r.bytes).padStart(11)}  (gzip ${kb(r.gzip).padStart(10)})  ${r.file}`);
console.log(`Total : ${kb(total)} (gzip ${kb(gz)}) pour ${rows.length} fichier(s) · budget ${kb(BUDGET)}`);
if (total > BUDGET) {
  console.error(`check-bundle : ÉCHEC, le build dépasse 3 Mo de ${kb(total - BUDGET)}.`);
  process.exit(1);
}
console.log('check-bundle : OK');
