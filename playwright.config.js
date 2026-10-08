import { defineConfig } from '@playwright/test';

// e2e : chromium headless contre `vite preview` (build de prod), WebGL via SwiftShader.
export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: '**/*.e2e.js',
  timeout: 240_000,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4174',
    viewport: { width: 1280, height: 720 },
    launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] },
  },
  webServer: {
    command: 'npm run build && npx vite preview --port 4174 --strictPort',
    url: 'http://localhost:4174',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
