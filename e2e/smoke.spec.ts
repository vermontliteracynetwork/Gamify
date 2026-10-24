import { test, expect } from '@playwright/test';

test('home renders with no console errors', async ({ page }) => {
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(m.text()); });
  page.on('pageerror', (e) => problems.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('img', { name: 'Gamify' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(problems).toEqual([]);
  // No sideways scrolling on iPad.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
