import { defineConfig } from '@playwright/test';
import base from './playwright.config.js';

// Perf (npm run test:perf) : même build de prod que l'e2e, sur un port à part, un seul worker (mesures non concurrentes).
// Le budget 60 fps n'est qu'un avertissement, sauf avec PERF_STRICT=1. Le temps de chargement (< 5 s) est bloquant.
const PORT = 4176;
export default defineConfig({
  ...base,
  testDir: 'tests/perf',
  testMatch: '**/*.perf.js',
  workers: 1,
  use: { ...base.use, baseURL: `http://localhost:${PORT}` },
  webServer: { ...base.webServer, command: `npm run build && npx vite preview --port ${PORT} --strictPort`, url: `http://localhost:${PORT}` },
});
