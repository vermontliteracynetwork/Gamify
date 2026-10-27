import { test, expect } from '@playwright/test';
import { answerShare, finishSetup, openSetup, noPowerUps } from './setup';


test('Peg Drop: a right answer earns a drop; the ball bounces into a bucket and scores', async ({ page }, info) => {
  test.setTimeout(60_000);
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(m.text()); });
  await openSetup(page, '/games/peg-drop');
  await finishSetup(page);
  await answerShare(page, true);
  await expect(page.getByRole('button', { name: 'Drop the ball in spot 4' })).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight - (document.getElementById('teacher-footer')?.getBoundingClientRect().height ?? 0))).toBeLessThanOrEqual(1);
  await page.getByRole('button', { name: 'Drop the ball in spot 4' }).click();
  if (info.project.name === 'ipad-portrait') for (let f = 0; f < 6; f++) { await page.screenshot({ path: `test-results/peg-frame-${f}.png` }); await page.waitForTimeout(300); }
  await expect(page.getByText(/^\+(10|20|50|100)$/)).toBeVisible({ timeout: 5000 });
  await page.screenshot({ path: `test-results/peg-landed-${info.project.name}.png` });
  // Next team's question.
  await expect(page.getByRole('dialog').getByRole('button', { name: /^[A-D] / }).first()).toBeVisible({ timeout: 5000 });
  expect(problems).toEqual([]);
});

// Last, so a test's own settings (like the plan) are written first.
test.beforeEach(async ({ page }) => { await noPowerUps(page, 'peg-drop'); });
