import { defineConfig } from 'vite';

// three.js seul pèse ~550 kB minifié : on relève le seuil d'alerte plutôt que de découper.
export default defineConfig({
  build: {
    chunkSizeWarningLimit: 800,
    // ui.html : l'interface des journées seule (agent UI, tests e2e), à côté du jeu complet
    rollupOptions: { input: { main: 'index.html', ui: 'ui.html' } },
  },
  test: { include: ['tests/unit/**/*.test.js'] },
});
