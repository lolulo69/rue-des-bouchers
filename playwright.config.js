import { defineConfig } from '@playwright/test';

// E2E_PORT : port du serveur de test (plusieurs worktrees peuvent tourner sur la même machine)
const PORT = Number(process.env.E2E_PORT) || 4174;

// e2e : chromium headless contre `vite preview` (build de prod), WebGL via SwiftShader.
export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: '**/*.e2e.js',
  timeout: 240_000,
  // CI : un seul worker par shard (les 4 shards tournent déjà en parallèle). À deux workers, deux pages 3D sous SwiftShader
  // se disputaient le runner et un test attendait plus de 240 s son contexte navigateur (shard 3, 2026-10-09).
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 1280, height: 720 },
    launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] },
  },
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false, // jamais le serveur d'un autre worktree
    timeout: 120_000,
  },
});
