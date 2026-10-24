import { test, expect } from '@playwright/test';

test('Free plan: other themes show a lock and open a preview only', async ({ page }) => {
  await page.goto('/games/bakery-match');
  await expect(page.getByRole('radio', { name: 'Classic' })).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('radio', { name: 'Space theme (locked)' }).click();
  await expect(page.getByRole('dialog', { name: 'Preview of the Space theme' })).toBeVisible();
  await page.getByRole('button', { name: 'Close preview' }).click();
  await expect(page.getByRole('radio', { name: 'Classic' })).toHaveAttribute('aria-checked', 'true');
});

test('Paid plan: picking Space re-skins the game and is remembered', async ({ page }, info) => {
  await page.addInitScript(() => { if (!localStorage.getItem('gamify:settings')) localStorage.setItem('gamify:settings', JSON.stringify({ tier: 'plus' })); });
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(m.text()); });
  await page.goto('/games/bakery-match');
  await page.getByRole('radio', { name: 'Space', exact: true }).click();
  await page.screenshot({ path: `test-results/theme-space-start-${info.project.name}.png`, fullPage: true });
  await page.getByRole('button', { name: 'Play' }).click();
  await page.screenshot({ path: `test-results/theme-space-board-${info.project.name}.png`, fullPage: true });
  await page.goto('/games/four-in-a-row');
  await page.getByRole('radio', { name: 'Garden', exact: true }).click();
  await page.goto('/games/four-in-a-row');
  await expect(page.getByRole('radio', { name: 'Garden', exact: true })).toHaveAttribute('aria-checked', 'true');
  expect(problems).toEqual([]);
});
