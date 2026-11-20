import { test, expect } from '@playwright/test';
import { openSetup } from './setup';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { if (!localStorage.getItem('gamify:settings')) localStorage.setItem('gamify:settings', JSON.stringify({ tier: 'pro' })); });
});

// Bowling and the Board Game can be played Live (teacher, 2026-11-20): the
// teacher opens the lobby, where students are put on teams; Bowling has no Solo.
for (const game of ['bowling', 'castle-quest']) {
  test(`${game}: Live opens the lobby with teams`, async ({ page }, info) => {
    await openSetup(page, `/games/${game}`, /^Live/);
    for (let k = 0; k < 6 && !(await page.getByRole('button', { name: 'Open the live lobby' }).isVisible()); k++) await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.getByRole('button', { name: 'Open the live lobby' }).click();
    await expect(page).toHaveURL(/\/teacher\/live\//);
    await page.getByRole('button', { name: 'Game settings' }).or(page.getByRole('button', { name: /settings/i })).first().click();
    await expect(page.getByRole('button', { name: 'Add a team' })).toBeVisible();
    await page.screenshot({ path: `test-results/live-teams-${game}-${info.project.name}.png` });
  });
}

test('Bowling has no Solo way to play', async ({ page }) => {
  await page.goto('/games/bowling');
  await page.getByRole('button', { name: 'Set up and play' }).click();
  const next = page.getByRole('button', { name: 'Next', exact: true });
  if (await page.getByRole('heading', { name: 'Pick a Theme' }).isVisible()) await next.click();
  await expect(page.getByRole('radio', { name: /^Live/ })).toBeVisible();
  await expect(page.getByRole('radio', { name: /^Solo/ })).toHaveCount(0);
});
