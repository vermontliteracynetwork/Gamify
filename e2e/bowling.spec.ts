import { test, expect } from '@playwright/test';
import { answerShare, finishSetup, openSetup, noPowerUps, startTurn } from './setup';


test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { if (!localStorage.getItem('gamify:settings')) localStorage.setItem('gamify:settings', JSON.stringify({ tier: 'plus' })); });
});

test('Bowling: a right answer earns a roll; tap to aim, tap to spin, and the pins scatter', async ({ page }, info) => {
  test.setTimeout(60_000);
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(m.text()); });
  page.on('pageerror', (e) => problems.push(e.message));
  await openSetup(page, '/games/bowling');
  await finishSetup(page);
  await answerShare(page, true);
  const meter = page.getByRole('button', { name: 'Tap to aim!' });
  await expect(meter).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight - (document.getElementById('teacher-footer')?.getBoundingClientRect().height ?? 0))).toBeLessThanOrEqual(1);
  await page.screenshot({ path: `test-results/bowling-aim-${info.project.name}.png` });
  await meter.click();
  const spin = page.getByRole('button', { name: 'Tap to spin!' });
  await expect(spin).toBeEnabled();
  await page.screenshot({ path: `test-results/bowling-spin-${info.project.name}.png` });
  // A quick double tap never skips the spin meter, so wait a moment like a player would.
  await page.waitForTimeout(500);
  await spin.click();
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
  // A device set to reduce motion starts in calm mode.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openSetup(page, '/games/bowling');
  await finishSetup(page);
  await answerShare(page, true);
  await expect(page.getByLabel('Aim')).toBeVisible();
  await expect(page.getByLabel('Spin')).toBeVisible();
  await page.getByRole('button', { name: 'Throw' }).click();
  await expect(page.getByRole('status').filter({ hasText: /Strike!|Spare!|Gutter ball!|Split!|So close!|pins?!/ })).toBeVisible({ timeout: 9000 });
});
