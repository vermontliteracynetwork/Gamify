import { test, expect } from '@playwright/test';
import { LIBRARY } from '../src/data/library';
import { finishSetup, noPowerUps, openSetup } from './setup';

const answers = new Map(LIBRARY.flatMap((s) => s.questions.map((q) => [q.prompt.trim(), q.choices[q.correctIndex]] as const)));

async function answerAll(page: import('@playwright/test').Page, n: number) {
  const dialog = page.getByRole('dialog');
  for (let k = 0; k < n; k++) {
    await expect(dialog.getByText('Read the question')).toBeHidden({ timeout: 8000 });
    const prompt = (await dialog.getByRole('heading', { level: 2 }).innerText()).trim();
    const buttons = dialog.getByRole('button', { name: /^[A-D] / });
    const labels = (await buttons.allInnerTexts()).map((l) => l.trim());
    await buttons.nth(labels.findIndex((l) => l.endsWith(answers.get(prompt)!))).click();
    await expect(dialog.getByRole('heading', { level: 2, name: prompt, exact: true })).toHaveCount(0, { timeout: 8000 });
  }
}

test('Farm Grow: answers earn jobs, a watered seed grows each night and gets picked', async ({ page }, info) => {
  test.setTimeout(150_000);
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(m.text()); });
  page.on('pageerror', (e) => problems.push(e.message));
  await openSetup(page, '/games/farm-grow');
  await finishSetup(page);
  await answerAll(page, 2);
  await expect(page.getByLabel('4 jobs left')).toBeVisible({ timeout: 8000 });
  await page.getByRole('radio', { name: /Pumpkin/ }).click();
  await page.getByRole('button', { name: 'Plot 5: empty, tap to plant' }).click();
  await page.getByRole('button', { name: 'Plot 5: Pumpkin, size 1, needs water' }).click();
  await expect(page.getByRole('button', { name: 'Plot 5: Pumpkin, size 1, watered' })).toBeVisible();
  await page.screenshot({ path: `test-results/farm-${info.project.name}.png` });
  expect(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)).toBeLessThanOrEqual(1);
  // Three nights of watering ripen it.
  for (let night = 1; night <= 3; night++) {
    await page.getByRole('button', { name: 'End the day' }).click();
    await answerAll(page, 2);
    if (night < 3) await page.getByRole('button', { name: `Plot 5: Pumpkin, size ${night + 1}, needs water` }).click();
  }
  await page.getByRole('button', { name: 'Plot 5: Pumpkin, ready to pick' }).click();
  await expect(page.getByRole('status').filter({ hasText: /vines/ })).toBeVisible();
  await expect(page.getByText('Picked: 1')).toBeVisible();
  expect(problems).toEqual([]);
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { if (!localStorage.getItem('gamify:settings')) localStorage.setItem('gamify:settings', JSON.stringify({ tier: 'pro' })); });
});
// Last, so the plan above is written first.
test.beforeEach(async ({ page }) => { await noPowerUps(page, 'farm-grow'); });
