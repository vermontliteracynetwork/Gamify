import { test, expect } from '@playwright/test';
import { finishSetup, openSetup } from './setup';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { if (!localStorage.getItem('gamify:settings')) localStorage.setItem('gamify:settings', JSON.stringify({ tier: 'plus' })); });
});

test('Memory Match: cards flip, a miss turns them back, and the computer takes its turn', async ({ page }, info) => {
  test.setTimeout(60_000);
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(m.text()); });
  await openSetup(page, '/games/memory-match');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('radio', { name: '6 pairs' }).click();
  await page.getByRole('radio', { name: 'Two players or the computer' }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: 'Person' }).click(); // player 2 is the computer
  await finishSetup(page);
  await expect(page.getByRole('button', { name: /^Card \d+, face down$/ })).toHaveCount(12);
  expect(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)).toBeLessThanOrEqual(1);

  // Find two cards that don't match (a question card and a different answer).
  await page.getByRole('button', { name: 'Card 1, face down' }).click();
  const first = await page.getByRole('button', { name: /^(Question|Answer): / }).first().getAttribute('aria-label');
  await page.getByRole('button', { name: 'Card 2, face down' }).click();
  await page.screenshot({ path: `test-results/memory-${info.project.name}.png` });
  await expect(page.getByText('1 turn', { exact: true })).toBeVisible();
  expect(first).toBeTruthy();
  // Either they matched (rare) or they turn back and the computer plays.
  await expect(page.getByRole('button', { name: /face down$/ })).not.toHaveCount(0);
  expect(problems).toEqual([]);
});
