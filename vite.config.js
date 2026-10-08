import { defineConfig } from 'vite';

// three.js seul pèse ~550 kB minifié : on relève le seuil d'alerte plutôt que de découper.
export default defineConfig({
  build: { chunkSizeWarningLimit: 800 },
  test: { include: ['tests/unit/**/*.test.js'] },
});
