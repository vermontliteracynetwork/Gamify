import { test, expect } from '@playwright/test';

// Create an activity (teacher, 2026-10-31): who, game, how, questions, start.
test('Create an activity: pick the game, how they play and the set, then get a code', async ({ page }, info) => {
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(m.text()); });
  page.on('pageerror', (e) => problems.push(e.message));
  await page.goto('/teacher/sets');
  await page.getByRole('button', { name: 'Create an Activity' }).click();
  await expect(page.getByRole('heading', { level: 1, name: /Create an Activity/ })).toBeVisible();
  await expect(page.getByRole('radio', { name: /Anyone with the code/ })).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('button', { name: 'Next' })).toBeDisabled();
  await page.getByRole('radio', { name: /Cast and Catch/ }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('radio', { name: /A code to play on their own/ }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('searchbox', { name: 'Search titles and tags' }).fill('Animals');
  await page.getByRole('radio', { name: /^Animals and habitats/ }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByText('Ready to start')).toBeVisible();
  await page.getByRole('button', { name: 'Make the code' }).click();
  await expect(page.getByLabel(/^Game code [A-Z]{5}/)).toBeVisible();
  await page.screenshot({ path: `test-results/activity-${info.project.name}.png`, fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  expect(problems).toEqual([]);
});
