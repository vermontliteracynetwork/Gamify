import { test, expect } from '@playwright/test';
import { answerShare, finishSetup, openSetup, showSetting } from './setup';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { const s = JSON.parse(localStorage.getItem('gamify:settings') ?? '{}'); localStorage.setItem('gamify:settings', JSON.stringify({ ...s, tier: 'pro' })); });
});

// Board Game (teacher redesign, 2026-11-08): a flat classic board of squares.
test('Board Game: a right answer earns a roll, the die tumbles, the round piece hops square by square, and nothing scrolls', async ({ page }, info) => {
  test.setTimeout(90_000);
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(m.text()); });
  page.on('pageerror', (e) => problems.push(e.message));
  await openSetup(page, '/games/castle-quest');
  await finishSetup(page);
  const board = page.getByRole('img', { name: 'A game board of 40 squares from Start to Finish' });
  await expect(board).toBeVisible();
  await page.screenshot({ path: `test-results/castle-quest-board-${info.project.name}.png` });
  await answerShare(page, true);
  const rollBtn = page.getByRole('button', { name: /^Roll/ }).first();
  await expect(rollBtn).toBeVisible({ timeout: 8000 });
  expect(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight - (document.getElementById('teacher-footer')?.getBoundingClientRect().height ?? 0))).toBeLessThanOrEqual(1);
  await page.screenshot({ path: `test-results/castle-quest-roll-${info.project.name}.png` });
  await rollBtn.click();
  if (info.project.name === 'ipad-landscape') for (let f = 0; f < 14; f++) { await page.screenshot({ path: `test-results/castle-quest-hop-${f}.png` }); await page.waitForTimeout(170); }
  await expect(page.getByRole('img', { name: /^The die shows [1-6]$/ }).first()).toBeVisible();
  await page.waitForTimeout(3000);
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
  await expect(page.getByRole('img', { name: /^A game board of \d+ squares/ })).toBeVisible();
  await expect(page.getByText('Computer').first()).toBeVisible();
});

test('Board Game short board: fewer squares', async ({ page }, info) => {
  test.setTimeout(60_000);
  await openSetup(page, '/games/castle-quest');
  await showSetting(page, page.getByRole('radio', { name: /^Short( About|$)/ }));
  await page.getByRole('radio', { name: /^Short( About|$)/ }).click();
  await finishSetup(page);
  await expect(page.getByRole('img', { name: 'A game board of 28 squares from Start to Finish' })).toBeVisible();
  await page.screenshot({ path: `test-results/castle-quest-short-${info.project.name}.png` });
});
