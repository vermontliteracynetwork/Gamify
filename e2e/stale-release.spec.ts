import { test, expect } from '@playwright/test';

// A tab open across a new release asks for an old file that is gone; the host
// answers with the HTML page. The app loads the new release instead of going
// blank (teacher, 2026-10-31).
test('a missing page file after a release reloads instead of a blank page', async ({ page }) => {
  let failed = 0;
  await page.route(/\/assets\/ClassesPage-[^/]+\.js$/, async (route) => {
    if (failed++ === 0) await route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><html></html>' });
    else await route.continue();
  });
  await page.goto('/teacher/classes');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });
  expect(failed).toBeGreaterThan(1);
});
