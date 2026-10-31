import { test, expect } from '@playwright/test';
import { answerShare, finishSetup, openSetup } from './setup';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { const s = JSON.parse(localStorage.getItem('gamify:settings') ?? '{}'); localStorage.setItem('gamify:settings', JSON.stringify({ ...s, tier: 'pro' })); });
});

// Castle Quest (teacher design, 2026-10-31).
test('Castle Quest: a right answer earns a roll, the piece hops along the path, and nothing scrolls', async ({ page }, info) => {
  test.setTimeout(90_000);
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(m.text()); });
  page.on('pageerror', (e) => problems.push(e.message));
  await openSetup(page, '/games/castle-quest');
  await finishSetup(page);
  await expect(page.getByRole('img', { name: 'Forest path of 54 tiles to the castle' })).toBeVisible();
  await page.screenshot({ path: `test-results/castle-quest-board-${info.project.name}.png` });
  await answerShare(page, true);
  const rollBtn = page.getByRole('button', { name: /^Roll/ }).first();
  await expect(rollBtn).toBeVisible({ timeout: 8000 });
  expect(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)).toBeLessThanOrEqual(1);
  await rollBtn.click();
  // The first team leaves the start tile.
  await expect(page.getByLabel(/ is on tile ([1-9]|[1-5]\d)$/).first()).toBeAttached({ timeout: 10_000 });
  if (info.project.name === 'ipad-landscape') for (let f = 0; f < 6; f++) { await page.screenshot({ path: `test-results/castle-quest-hop-${f}.png` }); await page.waitForTimeout(160); }
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `test-results/castle-quest-moved-${info.project.name}.png` });
  expect(problems).toEqual([]);
});

test('Castle Quest Versus: one player against the computer', async ({ page }) => {
  test.setTimeout(60_000);
  await openSetup(page, '/games/castle-quest', /^Versus/);
  for (;;) {
    if (await page.getByRole('heading', { name: /Players/ }).isVisible()) break;
    await page.getByRole('button', { name: 'Next', exact: true }).click();
  }
  await page.getByRole('button', { name: 'Person' }).click(); // player 2 becomes the computer
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('img', { name: 'Forest path of 54 tiles to the castle' })).toBeVisible();
  await expect(page.getByText('Computer').first()).toBeVisible();
});
