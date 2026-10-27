import { test, expect, type Page } from '@playwright/test';
import { finishSetup, openSetup } from './setup';

const noScroll = async (page: Page) =>
  expect(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight - (document.getElementById('teacher-footer')?.getBoundingClientRect().height ?? 0))).toBeLessThanOrEqual(1);

test('game boards fit the screen without scrolling', async ({ page }) => {
  for (const g of ['game-show', 'match-three', 'four-in-a-row', 'star-quiz']) {
    await page.goto(`/games/${g}`);
    await expect(page.getByRole('button', { name: 'Set up and play' })).toBeInViewport();
    await noScroll(page);
  }
  await openSetup(page, '/games/match-three');
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
  await page.getByRole('radiogroup', { name: 'Card grid' }).getByRole('radio', { name: '6 x 6' }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  for (let i = 0; i < 4; i++) await page.getByRole('button', { name: 'More teams' }).click();
  await finishSetup(page);
  await expect(page.getByRole('button', { name: 'Card 36', exact: true })).toBeVisible();
  await page.screenshot({ path: `test-results/gameshow-6x6-${test.info().project.name}.png` });
  await noScroll(page);
});
