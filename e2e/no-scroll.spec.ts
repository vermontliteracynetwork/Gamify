import { test, expect, type Page } from '@playwright/test';

const noScroll = async (page: Page) =>
  expect(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)).toBeLessThanOrEqual(1);

test('game boards fit the screen without scrolling', async ({ page }) => {
  await page.goto('/games/bakery-match');
  await page.getByRole('button', { name: 'Play' }).click();
  await expect(page.getByRole('gridcell')).toHaveCount(49);
  await noScroll(page);

  await page.goto('/games/four-in-a-row');
  await page.getByRole('button', { name: 'Person' }).click();
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(page.getByRole('gridcell')).toHaveCount(42);
  await noScroll(page);

  await page.goto('/games/game-show');
  await page.getByRole('radiogroup', { name: 'Cards' }).getByRole('radio', { name: '20' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  for (let i = 0; i < 4; i++) await page.getByRole('button', { name: 'More teams' }).click();
  await page.getByRole('button', { name: 'Start' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Not yet' }).click();
  await expect(page.getByRole('button', { name: 'Card 20', exact: true })).toBeVisible();
  await noScroll(page);
});
