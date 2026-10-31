import { test, expect } from '@playwright/test';
import { answerShare, finishSetup, openSetup, noPowerUps } from './setup';

// Pinball replaced Peg Drop (teacher, 2026-10-31).
test('Pinball: a right answer earns a shot; aim through a zone, stop the power bar, and the ball lands in a pocket or rolls back', async ({ page }, info) => {
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
  await expect(page.getByRole('button', { name: 'Aim through zone 4' })).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)).toBeLessThanOrEqual(1);
  await page.getByRole('button', { name: 'Aim through zone 4' }).click();
  await expect(page.getByRole('button', { name: 'Aim through zone 4' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Launch' }).click();
  await expect(page.getByRole('meter', { name: 'Power' })).toBeVisible();
  await page.screenshot({ path: `test-results/pinball-aim-${info.project.name}.png` });
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'Shoot!' }).click();
  if (info.project.name === 'ipad-landscape') for (let f = 0; f < 8; f++) { await page.screenshot({ path: `test-results/pinball-frame-${f}.png` }); await page.waitForTimeout(150); }
  await expect(page.getByText(/^(\+\d+|So close!)$/)).toBeVisible({ timeout: 5000 });
  await page.screenshot({ path: `test-results/pinball-landed-${info.project.name}.png` });
  // Next team's question.
  await expect(page.getByRole('dialog').getByRole('button', { name: /^[A-D] / }).first()).toBeVisible({ timeout: 6000 });
  expect(problems).toEqual([]);
});

// Last, so a test's own settings (like the plan) are written first.
test.beforeEach(async ({ page }) => { await noPowerUps(page, 'pinball'); });
