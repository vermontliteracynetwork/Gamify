import { test, expect } from '@playwright/test';
import { LIBRARY } from '../src/data/library';
import { finishSetup, noPowerUps, openSetup } from './setup';

const answers = new Map(LIBRARY.flatMap((s) => s.questions.map((q) => [q.prompt.trim(), q.choices[q.correctIndex]] as const)));

test('Castle Guard: right answers earn gems, a tower goes up, and the wave sends critters home', async ({ page }, info) => {
  test.setTimeout(120_000);
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(m.text()); });
  page.on('pageerror', (e) => problems.push(e.message));
  await openSetup(page, '/games/castle-guard');
  await finishSetup(page);
  const dialog = page.getByRole('dialog');
  for (let n = 0; n < 2; n++) {
    await expect(dialog.getByText('Read the question')).toBeHidden({ timeout: 8000 });
    const prompt = (await dialog.getByRole('heading', { level: 2 }).innerText()).trim();
    const buttons = dialog.getByRole('button', { name: /^[A-D] / });
    const labels = (await buttons.allInnerTexts()).map((l) => l.trim());
    await buttons.nth(labels.findIndex((l) => l.endsWith(answers.get(prompt)!))).click();
    await expect(dialog.getByRole('heading', { level: 2, name: prompt, exact: true })).toHaveCount(0, { timeout: 8000 });
  }
  await expect(page.getByLabel('6 gems')).toBeVisible({ timeout: 8000 });
  await page.getByRole('button', { name: 'Empty spot 2: build a tower' }).click();
  await page.getByRole('dialog', { name: 'Pick a tower' }).getByRole('button', { name: /Bubble Tower/ }).click();
  await expect(page.getByLabel('3 gems')).toBeVisible();
  await page.getByRole('button', { name: 'Empty spot 1: build a tower' }).click();
  await page.getByRole('dialog', { name: 'Pick a tower' }).getByRole('button', { name: /Snow Tower/ }).click();
  await page.screenshot({ path: `test-results/castle-build-${info.project.name}.png` });
  expect(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)).toBeLessThanOrEqual(1);
  await page.getByRole('button', { name: 'Start the wave' }).click();
  if (info.project.name === 'ipad-landscape') for (let f = 0; f < 6; f++) { await page.waitForTimeout(700); await page.screenshot({ path: `test-results/castle-frame-${f}.png` }); }
  await expect(page.getByRole('status').filter({ hasText: /sent home!/ })).toBeVisible({ timeout: 60000 });
  await expect(page.getByText(/^Sent home: [1-9]/)).toBeVisible();
  expect(problems).toEqual([]);
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { if (!localStorage.getItem('gamify:settings')) localStorage.setItem('gamify:settings', JSON.stringify({ tier: 'pro' })); });
});
// Last, so the plan above is written first.
test.beforeEach(async ({ page }) => { await noPowerUps(page, 'castle-guard'); });
