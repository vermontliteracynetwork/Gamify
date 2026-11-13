import { test, expect } from '@playwright/test';
import { answerShare, finishSetup, openSetup, noPowerUps, startTurn } from './setup';


test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { if (!localStorage.getItem('gamify:settings')) localStorage.setItem('gamify:settings', JSON.stringify({ tier: 'plus' })); });
});

test('Bowling: a right answer earns a roll; point to aim, tap to throw, and the pins scatter', async ({ page }, info) => {
  test.setTimeout(60_000);
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(m.text()); });
  page.on('pageerror', (e) => problems.push(e.message));
  await openSetup(page, '/games/bowling');
  await finishSetup(page);
  await answerShare(page, true);
  // Aim follows the pointer over the lane; one tap throws (teacher, 2026-11-13: no meters).
  const lane = page.getByRole('button', { name: 'Tap the lane to throw' });
  await expect(lane).toBeVisible({ timeout: 8000 });
  const box = (await lane.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.6);
  await page.screenshot({ path: `test-results/bowling-aim-${info.project.name}.png` });
  await lane.click({ position: { x: box.width * 0.6, y: box.height * 0.6 } });
  if (info.project.name === 'ipad-portrait') for (let f = 0; f < 12; f++) { await page.screenshot({ path: `test-results/bowling-frame-${f}.png` }); await page.waitForTimeout(160); }
  await expect(page.getByRole('status').filter({ hasText: /Strike!|Spare!|Gutter ball!|Split!|So close!|pins?!/ })).toBeVisible({ timeout: 9000 });
  await page.screenshot({ path: `test-results/bowling-result-${info.project.name}.png` });
  // Then the same team's second roll, or the next team's turn: a new question either way.
  await startTurn(page);
  await expect(page.getByRole('dialog').getByRole('button', { name: /^[A-D] / }).first()).toBeVisible({ timeout: 6000 });
  expect(problems).toEqual([]);
});

// Last, so a test's own settings (like the plan) are written first.
test.beforeEach(async ({ page }) => { await noPowerUps(page, 'bowling'); });

test('Bowling with calm motion: sliders aim and spin, then Throw', async ({ page }) => {
  test.setTimeout(60_000);
  // Still motion (Settings) swaps the swinging aim for sliders.
  await page.addInitScript(() => { const s = JSON.parse(localStorage.getItem('gamify:settings') ?? '{}'); localStorage.setItem('gamify:settings', JSON.stringify({ ...s, 'motion-reviewed': true, 'player-settings': { ...(s['player-settings'] ?? {}), motion: 'still', calm: true } })); });
  await openSetup(page, '/games/bowling');
  await finishSetup(page);
  await answerShare(page, true);
  await expect(page.getByLabel('Aim')).toBeVisible();
  await expect(page.getByLabel('Spin')).toBeVisible();
  await page.getByRole('button', { name: 'Throw', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: /Strike!|Spare!|Gutter ball!|Split!|So close!|pins?!/ })).toBeVisible({ timeout: 9000 });
});
