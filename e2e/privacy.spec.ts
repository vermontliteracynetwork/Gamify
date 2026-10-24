import { test, expect } from '@playwright/test';
import { finishSetup, openSetup } from './setup';

// Student pages: no ads, no trackers, no cookies (product plan, Stage 8).
// Every request must stay on Gamify's own address.
test('student pages make no third-party requests and set no cookies', async ({ page, context }) => {
  const outside: string[] = [];
  page.on('request', (r) => { const u = new URL(r.url()); if (!['localhost', '127.0.0.1'].includes(u.hostname) && u.protocol.startsWith('http')) outside.push(r.url()); });
  await page.goto('/play');
  await openSetup(page, '/games/star-quiz');
  await finishSetup(page);
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.goto('/join');
  await page.goto('/games/cast-catch');
  expect(outside).toEqual([]);
  expect(await context.cookies()).toEqual([]);
});
