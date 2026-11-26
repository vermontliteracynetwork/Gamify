import { test, expect } from '@playwright/test';
import { finishSetup, openSetup } from './setup';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { if (!localStorage.getItem('gamify:settings')) localStorage.setItem('gamify:settings', JSON.stringify({ tier: 'plus' })); });
});

test('Googler: pick a spot, drop blocks, a new row rises, questions come after the drops', async ({ page }, info) => {
  test.setTimeout(90_000);
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(m.text()); });
  page.on('pageerror', (e) => problems.push(e.message));
  await page.goto('/games/googler');
  await page.screenshot({ path: `test-results/googler-welcome-${info.project.name}.png` });
  await openSetup(page, '/games/googler');
  await finishSetup(page);
  const board = page.getByRole('application', { name: /Googler board/ });
  await expect(board).toBeVisible();
  // The eyes look at the pointer.
  await page.mouse.move(40, 300);
  await page.waitForTimeout(900);
  await page.screenshot({ path: `test-results/googler-start-${info.project.name}.png` });
  // The short laptop window: nothing scrolls or is cut off (teacher, 2026-11-16).
  if (info.project.name === 'laptop') {
    await page.setViewportSize({ width: 1190, height: 540 });
    await page.waitForTimeout(400);
    expect(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight + 1)).toBe(true);
    await page.screenshot({ path: 'test-results/googler-short-laptop.png' });
    await page.setViewportSize({ width: 1440, height: 900 });
  }
  // Arrow keys move between the three spots.
  await expect(board).toHaveAttribute('aria-label', /of 3 picked/);
  const before = await board.getAttribute('aria-label');
  await page.keyboard.press('ArrowRight');
  await expect(board).not.toHaveAttribute('aria-label', before!);
  // Four drops, then the question break.
  for (let d = 0; d < 4; d++) {
    await expect(page.getByText(`Drops left before questions: ${4 - d}`)).toBeAttached({ timeout: 10000 });
    await page.keyboard.press('ArrowDown');
    if (d === 0) { await page.waitForTimeout(350); await page.screenshot({ path: `test-results/googler-drop-${info.project.name}.png` }); }
    await page.waitForTimeout(2600);
  }
  await expect(page.getByRole('dialog').first()).toBeVisible({ timeout: 15000 });
  await page.screenshot({ path: `test-results/googler-question-${info.project.name}.png` });
  expect(problems).toEqual([]);
});
