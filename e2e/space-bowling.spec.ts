import { test, expect } from '@playwright/test';
import { answerShare, finishSetup, openSetup } from './setup';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { if (!localStorage.getItem('gamify:settings')) localStorage.setItem('gamify:settings', JSON.stringify({ tier: 'plus' })); });
});

test('Space Bowling: a right answer earns a roll; tap a lane and pins fall', async ({ page }, info) => {
  test.setTimeout(60_000);
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(m.text()); });
  page.on('pageerror', (e) => problems.push(e.message));
  await openSetup(page, '/games/space-bowling');
  await finishSetup(page);
  await answerShare(page, true);
  const lane3 = page.getByRole('button', { name: 'Roll down lane 3' });
  await expect(lane3).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)).toBeLessThanOrEqual(1);
  await page.screenshot({ path: `test-results/bowling-aim-${info.project.name}.png` });
  await lane3.click();
  if (info.project.name === 'ipad-portrait') for (let f = 0; f < 7; f++) { await page.screenshot({ path: `test-results/bowling-frame-${f}.png` }); await page.waitForTimeout(250); }
  await expect(page.getByRole('status').filter({ hasText: /Strike!|Spare!|Gutter ball!|pins?!/ })).toBeVisible({ timeout: 5000 });
  await page.screenshot({ path: `test-results/bowling-result-${info.project.name}.png` });
  // Then the same team's second roll, or the next team's turn: a new question either way.
  await expect(page.getByRole('dialog').getByRole('button', { name: /^[A-D] / }).first()).toBeVisible({ timeout: 6000 });
  expect(problems).toEqual([]);
});
