import { test, expect } from '@playwright/test';
import { answerShare, finishSetup, openSetup, noPowerUps, startTurn } from './setup';

// Pinball replaced Peg Drop (teacher, 2026-10-31).
test('Pinball: a right answer earns a shot; pick a lane and the ball shoots at once into a top pocket or rolls back', async ({ page }, info) => {
  test.setTimeout(60_000);
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(m.text()); });
  await page.goto('/games/peg-drop');
  await expect(page).toHaveURL(/\/games\/pinball/);
  await openSetup(page, '/games/pinball');
  await finishSetup(page);
  // Round 1 starts with three pockets.
  await expect(page.getByRole('img', { name: 'Pinball table with 3 pockets' })).toBeVisible();
  await answerShare(page, true);
  await expect(page.getByRole('button', { name: 'Shoot up lane 4' })).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)).toBeLessThanOrEqual(1);
  await page.screenshot({ path: `test-results/pinball-lanes-${info.project.name}.png` });
  // Picking a lane hides the lanes and shoots at the same power every time (teacher, 2026-11-13: no power bar).
  await expect(page.getByText('Pick a lane')).toHaveCount(0);
  await page.getByRole('button', { name: 'Shoot up lane 4' }).click();
  await expect(page.getByRole('button', { name: 'Shoot up lane 4' })).toHaveCount(0);
  await expect(page.getByRole('meter')).toHaveCount(0);
  if (info.project.name === 'ipad-landscape') for (let f = 0; f < 8; f++) { await page.screenshot({ path: `test-results/pinball-frame-${f}.png` }); await page.waitForTimeout(150); }
  await expect(page.getByText(/^(\+\d+|So close!)$/).first()).toBeVisible({ timeout: 5000 });
  await page.screenshot({ path: `test-results/pinball-landed-${info.project.name}.png` });
  // Next team's question.
  await startTurn(page);
  await expect(page.getByRole('dialog').getByRole('button', { name: /^[A-D] / }).first()).toBeVisible({ timeout: 6000 });
  expect(problems).toEqual([]);
});

// Last, so a test's own settings (like the plan) are written first.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { const s = JSON.parse(localStorage.getItem('gamify:settings') ?? '{}'); if (!s['setup:pinball']) localStorage.setItem('gamify:settings', JSON.stringify({ ...s, 'setup:pinball': { powerUps: false, rounds: 5, questions: 1 } })); });
  await noPowerUps(page, 'pinball');
});

// The computer takes real shots (Claudia, 2026-10-31: its timer used to reset
// every frame of the power bar, so it never shot; the bar is gone since 2026-11-13).
test('Pinball Versus: the computer shoots and play comes back to the player', async ({ page }, info) => {
  test.setTimeout(90_000);
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()); });
  page.on('pageerror', (e) => problems.push(e.message));
  await openSetup(page, '/games/pinball', /^Versus/);
  for (;;) {
    if (await page.getByRole('heading', { name: /Players/ }).isVisible()) break;
    await page.getByRole('button', { name: 'Next', exact: true }).click();
  }
  await page.getByRole('button', { name: 'Person' }).click(); // player 2 becomes the computer
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await answerShare(page, true);
  await page.getByRole('button', { name: 'Shoot up lane 2' }).click();
  // The computer's turn: its question, its lane, its shot, then back to us.
  await expect(page.getByText('2/5').locator('visible=true').first()).toBeVisible({ timeout: 40_000 });
  await answerShare(page, true);
  await expect(page.getByRole('button', { name: 'Shoot up lane 2' })).toBeEnabled({ timeout: 10_000 });
  await page.screenshot({ path: `test-results/pinball-cpu-${info.project.name}.png` });
  expect(problems).toEqual([]);
});
