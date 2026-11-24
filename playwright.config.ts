import { defineConfig } from '@playwright/test';
import { E2E_PORT as port, teacherSession } from './e2e/session';

// E2E_PORT lets two runs share a machine without stopping each other's server.

// Students and teachers use iPads, other tablets and computers: every test
// runs on iPad portrait, iPad landscape and a laptop screen.
export default defineConfig({
  testDir: 'e2e',
  // CI: one retry for a busy runner, and a short report in the job log.
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['line']] : 'list',
  webServer: { command: `npm run build && npx vite preview --port ${port} --strictPort`, port, reuseExistingServer: true, timeout: 180_000 },
  // Tests start as a signed-in teacher; public-page tests sign out.
  use: { baseURL: `http://localhost:${port}`, storageState: teacherSession },
  projects: [
    { name: 'ipad-portrait', use: { viewport: { width: 820, height: 1180 }, hasTouch: true } },
    { name: 'ipad-landscape', use: { viewport: { width: 1180, height: 820 }, hasTouch: true } },
    { name: 'laptop', use: { viewport: { width: 1440, height: 900 } } },
  ],
});
