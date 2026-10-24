import { defineConfig } from '@playwright/test';

// iPad is the primary device (CLAUDE.md): smoke tests run in both orientations.
export default defineConfig({
  testDir: 'e2e',
  webServer: { command: 'npm run build && npx vite preview --port 4173 --strictPort', port: 4173, reuseExistingServer: true },
  use: { baseURL: 'http://localhost:4173' },
  projects: [
    { name: 'ipad-portrait', use: { viewport: { width: 820, height: 1180 }, hasTouch: true } },
    { name: 'ipad-landscape', use: { viewport: { width: 1180, height: 820 }, hasTouch: true } },
  ],
});
