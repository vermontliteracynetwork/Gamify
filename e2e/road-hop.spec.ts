import { test, expect } from '@playwright/test';
import { answerShare, finishSetup, openSetup } from './setup';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { if (!localStorage.getItem('gamify:settings')) localStorage.setItem('gamify:settings', JSON.stringify({ tier: 'plus' })); });
});

test('Road Hop: a right answer earns 3 hops; the hopper hops and the cars move', async ({ page }, info) => {
  test.setTimeout(60_000);
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(m.text()); });
  page.on('pageerror', (e) => problems.push(e.message));
  await openSetup(page, '/games/road-hop');
  await finishSetup(page);
  await answerShare(page, true);
  const up = page.getByRole('button', { name: 'Hop up' });
  await expect(up).toBeEnabled();
  await expect(page.getByLabel('3 hops left')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight - (document.getElementById('teacher-footer')?.getBoundingClientRect().height ?? 0))).toBeLessThanOrEqual(1);
  await page.screenshot({ path: `test-results/road-hop-ready-${info.project.name}.png` });
  await up.click();
  if (info.project.name === 'ipad-portrait') for (let f = 0; f < 5; f++) { await page.screenshot({ path: `test-results/road-hop-frame-${f}.png` }); await page.waitForTimeout(60); }
  await expect(page.getByLabel(/^[12] hops? left$/)).toBeVisible();
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: 'Wait a moment and let the cars move' }).click();
  await page.waitForTimeout(1000);
  await page.keyboard.press('ArrowUp');
  await page.screenshot({ path: `test-results/road-hop-after-${info.project.name}.png` });
  // Out of hops: the next team gets a question.
  await expect(page.getByRole('dialog').getByRole('button', { name: /^[A-D] / }).first()).toBeVisible({ timeout: 6000 });
  expect(problems).toEqual([]);
});
