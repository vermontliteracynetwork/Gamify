import { test, expect } from '@playwright/test';
import { LIBRARY } from '../src/data/library';

// The teacher's play clock (2026-10-31): a 3-minute and 1-minute heads-up,
// the game ends the normal way with points so far, then "Look at your
// teacher". Driven with a fake clock so the test runs in seconds.
test('play clock: warnings, a normal ending, then the look-at-your-teacher screen', async ({ page }, info) => {
  test.setTimeout(90_000);
  await page.clock.install();
  await page.goto('/join');
  await page.evaluate(({ setId }) => {
    const s = JSON.parse(localStorage.getItem('gamify:settings') ?? '{}');
    s['game-codes'] = [{ code: 'BKDFH', gameId: 'star-quiz', setId, createdAt: new Date().toISOString(), minutes: 4 }];
    localStorage.setItem('gamify:settings', JSON.stringify(s));
    localStorage.removeItem('gamify:teacher-session');
  }, { setId: LIBRARY[0].id });
  await page.goto('/join');
  await page.getByLabel('Game code').fill('BKDFH');
  await page.getByRole('button', { name: 'Go' }).click();
  await page.getByRole('button', { name: /Play/ }).click();
  await expect(page).toHaveURL(/\/games\/star-quiz/);
  // Start the game.
  for (let i = 0; i < 30; i++) {
    const play = page.getByRole('button', { name: /^(Set up and play|Next|Play)$/ });
    if (await page.getByRole('dialog').isVisible()) break;
    if (await play.first().isVisible()) await play.first().click();
    await page.clock.runFor(500);
  }
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.clock.runFor(61_000);
  await expect(page.getByText('Three minutes left!')).toBeVisible();
  await page.clock.runFor(120_000);
  await expect(page.getByText('One minute left!')).toBeVisible();
  await page.screenshot({ path: `test-results/clock-warning-${info.project.name}.png` });
  await page.clock.runFor(61_000);
  await expect(page.getByRole('heading', { level: 2 }).filter({ hasText: /star/i }).first()).toBeVisible();
  await page.screenshot({ path: `test-results/clock-end-${info.project.name}.png` });
  await page.clock.runFor(21_000);
  await expect(page).toHaveURL(/\/look-up/);
  await page.clock.resume();
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: /Look at Your Teacher/i })).toBeVisible();
  await page.screenshot({ path: `test-results/clock-lookup-${info.project.name}.png` });
});
