import { defineConfig } from '@playwright/test';

// E2E_PORT : port du serveur de test (plusieurs worktrees peuvent tourner sur la même machine)
const PORT = Number(process.env.E2E_PORT) || 4174;

// e2e : chromium headless contre `vite preview` (build de prod), WebGL via SwiftShader.
export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: '**/*.e2e.js',
  timeout: 240_000,
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
