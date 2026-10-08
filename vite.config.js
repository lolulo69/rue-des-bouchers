import { defineConfig } from 'vite';
import { execSync } from 'node:child_process';

// Version affichée dans le rapport d'erreur (src/main.js)
let build = 'dev';
try { build = execSync('git rev-parse --short HEAD').toString().trim(); } catch { /* hors git */ }

// Découpage en chunks nommés (chargés en parallèle par l'amorce src/main.js, avec une barre de progression) :
// three.js, art (décor, personnages, scène, audio), contenu narratif, simulation, interface de jour.
const GROUPS = [
  ['three', /node_modules[\\/]three[\\/]/],
  ['art', /src[\\/](art|scene|audio)[\\/]|src[\\/]world\.js/],
  ['content', /src[\\/]content[\\/]/],
  ['sim', /src[\\/]sim[\\/]/],
  ['ui', /src[\\/]ui[\\/]/],
];

export default defineConfig({
  define: { __BUILD__: JSON.stringify(build) },
  build: {
    chunkSizeWarningLimit: 800, // three.js seul pèse ~550 kB minifié
    rolldownOptions: {
      // ui.html : l'interface des journées seule (agent UI, tests e2e), à côté du jeu complet
      input: { main: 'index.html', ui: 'ui.html' },
      output: { codeSplitting: { groups: GROUPS.map(([name, test]) => ({ name, test })) } },
    },
  },
  test: { include: ['tests/unit/**/*.test.js'] },
});
