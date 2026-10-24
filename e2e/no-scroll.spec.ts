import { test, expect, type Page } from '@playwright/test';
import { finishSetup, openSetup } from './setup';

const noScroll = async (page: Page) =>
  expect(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)).toBeLessThanOrEqual(1);

test('game boards fit the screen without scrolling', async ({ page }) => {
  for (const g of ['game-show', 'bakery-match', 'four-in-a-row', 'star-quiz']) {
    await page.goto(`/games/${g}`);
    await expect(page.getByRole('button', { name: 'Set up and play' })).toBeInViewport();
    await noScroll(page);
  }
  await openSetup(page, '/games/bakery-match');
  await noScroll(page);
  await finishSetup(page);
  await expect(page.getByRole('gridcell')).toHaveCount(49);
  await noScroll(page);

  await openSetup(page, '/games/four-in-a-row');
  await page.getByRole('button', { name: 'Person' }).click();
  await finishSetup(page);
  await expect(page.getByRole('gridcell')).toHaveCount(42);
  await noScroll(page);

  await openSetup(page, '/games/game-show');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('radiogroup', { name: 'Cards' }).getByRole('radio', { name: '20' }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  for (let i = 0; i < 4; i++) await page.getByRole('button', { name: 'More teams' }).click();
  await finishSetup(page);
  await expect(page.getByRole('button', { name: 'Card 20', exact: true })).toBeVisible();
  await noScroll(page);
});
