import { test, expect } from '@playwright/test';
import { LIBRARY } from '../src/data/library';
import { finishSetup, openSetup } from './setup';

const answers = new Map(LIBRARY.flatMap((s) => s.questions.map((q) => [q.prompt, q.choices[q.correctIndex]] as const)));

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { if (!localStorage.getItem('gamify:settings')) localStorage.setItem('gamify:settings', JSON.stringify({ tier: 'plus' })); });
});

test('Bubble Pop: a right answer loads bubbles; aim, shoot, and the bubble lands', async ({ page }, info) => {
  test.setTimeout(60_000);
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(m.text()); });
  page.on('pageerror', (e) => problems.push(e.message));
  await openSetup(page, '/games/bubble-pop');
  await finishSetup(page);
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Read the question')).toBeHidden({ timeout: 8000 });
  const prompt = (await dialog.getByRole('heading', { level: 2 }).innerText()).trim();
  const buttons = dialog.getByRole('button', { name: /^[A-D] / });
  const labels = await buttons.allInnerTexts();
  await buttons.nth(labels.findIndex((l) => l.trim().endsWith(answers.get(prompt)!))).click();
  const shoot = page.getByRole('button', { name: 'Shoot the bubble' });
  await expect(shoot).toBeEnabled({ timeout: 8000 });
  await expect(page.getByRole('img', { name: '5 bubbles left' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)).toBeLessThanOrEqual(1);
  await page.getByRole('button', { name: 'Aim left' }).click();
  await page.screenshot({ path: `test-results/bubble-aim-${info.project.name}.png` });
  // Tap on the board to aim there and shoot.
  const board = page.getByRole('img', { name: /^Bubble board/ });
  const box = (await board.boundingBox())!;
  await page.mouse.click(box.x + box.width * 0.7, box.y + box.height * 0.3);
  if (info.project.name === 'ipad-portrait') for (let f = 0; f < 5; f++) { await page.screenshot({ path: `test-results/bubble-frame-${f}.png` }); await page.waitForTimeout(90); }
  await expect(page.getByRole('img', { name: '4 bubbles left' })).toBeVisible({ timeout: 5000 });
  await shoot.click();
  await expect(page.getByRole('img', { name: '3 bubbles left' })).toBeVisible({ timeout: 5000 });
  await page.screenshot({ path: `test-results/bubble-shot-${info.project.name}.png` });
  expect(problems).toEqual([]);
});
