import { test, expect } from '@playwright/test';
import { answerShare, finishSetup, openSetup } from './setup';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { if (!localStorage.getItem('gamify:settings')) localStorage.setItem('gamify:settings', JSON.stringify({ tier: 'plus' })); });
});

test('Lunch Rush: a right answer earns 2 serves; serving a wanted food scores', async ({ page }, info) => {
  test.setTimeout(60_000);
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(m.text()); });
  page.on('pageerror', (e) => problems.push(e.message));
  await openSetup(page, '/games/lunch-rush');
  await finishSetup(page);
  await answerShare(page, true);
  await expect(page.getByLabel('2 serves left')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight - (document.getElementById('teacher-footer')?.getBoundingClientRect().height ?? 0))).toBeLessThanOrEqual(1);
  await page.screenshot({ path: `test-results/lunch-rush-ready-${info.project.name}.png` });
  // Serve what the first guest asked for.
  const guest = await page.getByRole('img', { name: /^Guest 1 wants / }).getAttribute('aria-label');
  const food = guest!.match(/wants (.+?)\./)![1];
  await page.getByRole('button', { name: `Serve ${food}` }).click();
  if (info.project.name === 'ipad-portrait') for (let f = 0; f < 6; f++) { await page.screenshot({ path: `test-results/lunch-rush-frame-${f}.png` }); await page.waitForTimeout(120); }
  await expect(page.getByRole('status').filter({ hasText: /Yum! \+\d+/ })).toBeVisible({ timeout: 3000 });
  await expect(page.getByLabel('1 serve left')).toBeVisible({ timeout: 4000 });
  await page.getByRole('button', { name: /^Serve / }).first().click();
  await expect(page.getByRole('dialog').getByRole('button', { name: /^[A-D] / }).first()).toBeVisible({ timeout: 6000 });
  expect(problems).toEqual([]);
});
