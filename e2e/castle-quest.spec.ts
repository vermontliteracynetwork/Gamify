import { test, expect } from '@playwright/test';
import { answerShare, finishSetup, openSetup, showSetting } from './setup';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { const s = JSON.parse(localStorage.getItem('gamify:settings') ?? '{}'); localStorage.setItem('gamify:settings', JSON.stringify({ ...s, tier: 'pro' })); });
});

// Board Game (teacher design, 2026-10-31; rebuilt after her review).
test('Board Game: a right answer earns a roll, the die tumbles, the pawn hops along the winding trail, and nothing scrolls', async ({ page }, info) => {
  test.setTimeout(90_000);
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(m.text()); });
  page.on('pageerror', (e) => problems.push(e.message));
  await openSetup(page, '/games/castle-quest');
  // Players pick from 20 animals (teacher, 2026-10-31); picking a taken one swaps.
  await showSetting(page, page.getByRole('button', { name: /^Pick an animal for / }));
  await page.getByRole('button', { name: /^Pick an animal for / }).first().click();
  const animals = page.getByRole('dialog').getByRole('group', { name: /^Pick an animal for / });
  await expect(animals.getByRole('button')).toHaveCount(20);
  await page.screenshot({ path: `test-results/castle-quest-animals-${info.project.name}.png` });
  await animals.getByRole('button', { name: 'Unicorn', exact: true }).click();
  await finishSetup(page);
  await expect(page.getByRole('img', { name: 'A winding forest trail of 53 spaces to the castle' })).toBeVisible();
  await page.screenshot({ path: `test-results/castle-quest-board-${info.project.name}.png` });
  await answerShare(page, true);
  const rollBtn = page.getByRole('button', { name: /^Roll/ }).first();
  await expect(rollBtn).toBeVisible({ timeout: 8000 });
  expect(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)).toBeLessThanOrEqual(1);
  await page.screenshot({ path: `test-results/castle-quest-roll-${info.project.name}.png` });
  await rollBtn.click();
  // The die is thrown over the board, then the pawn hops space by space.
  if (info.project.name === 'ipad-landscape') for (let f = 0; f < 14; f++) { await page.screenshot({ path: `test-results/castle-quest-hop-${f}.png` }); await page.waitForTimeout(170); }
  await expect(page.getByRole('img', { name: /^The die shows [1-6]$/ }).first()).toBeVisible();
  await page.waitForTimeout(3000);
  // Spaces never show numbers (teacher, 2026-10-31).
  expect(await page.locator('svg text').count()).toBe(0);
  await page.screenshot({ path: `test-results/castle-quest-moved-${info.project.name}.png` });
  expect(problems).toEqual([]);
});

test('Board Game Versus: one player against the computer', async ({ page }) => {
  test.setTimeout(60_000);
  await openSetup(page, '/games/castle-quest', /^Versus/);
  for (;;) {
    if (await page.getByRole('heading', { name: /Players/ }).isVisible()) break;
    await page.getByRole('button', { name: 'Next', exact: true }).click();
  }
  await page.getByRole('button', { name: 'Person' }).click(); // player 2 becomes the computer
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('img', { name: 'A winding forest trail of 53 spaces to the castle' })).toBeVisible();
  await expect(page.getByText('Computer').first()).toBeVisible();
});

test('Board Game short trail: pieces start at the second bend, the skipped part fades', async ({ page }, info) => {
  test.setTimeout(60_000);
  await openSetup(page, '/games/castle-quest');
  await showSetting(page, page.getByRole('radio', { name: /^Short/ }));
  await page.getByRole('radio', { name: /^Short/ }).click();
  await finishSetup(page);
  await expect(page.getByRole('img', { name: 'A winding forest trail of 53 spaces to the castle' })).toBeVisible();
  await page.screenshot({ path: `test-results/castle-quest-short-${info.project.name}.png` });
});
