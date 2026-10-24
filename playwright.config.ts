import { defineConfig } from '@playwright/test';

// Students and teachers use iPads, other tablets and computers: every test
// runs on iPad portrait, iPad landscape and a laptop screen.
export default defineConfig({
  testDir: 'e2e',
  webServer: { command: 'npm run build && npx vite preview --port 4173 --strictPort', port: 4173, reuseExistingServer: true },
  // Tests start as a signed-in teacher; public-page tests sign out.
  use: { baseURL: 'http://localhost:4173', storageState: 'e2e/teacher-session.json' },
  projects: [
    { name: 'ipad-portrait', use: { viewport: { width: 820, height: 1180 }, hasTouch: true } },
    { name: 'ipad-landscape', use: { viewport: { width: 1180, height: 820 }, hasTouch: true } },
    { name: 'laptop', use: { viewport: { width: 1440, height: 900 } } },
  ],
});
