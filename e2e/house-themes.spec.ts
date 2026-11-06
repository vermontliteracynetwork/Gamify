import { test, expect, type Page } from '@playwright/test';
import { LIBRARY } from '../src/data/library';
import { finishSetup } from './setup';

const answers = new Map(LIBRARY.flatMap((s) => s.questions.map((q) => [q.prompt.trim(), q.choices[q.correctIndex]] as const)));
async function answer(page: Page) {
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Read the question')).toBeHidden({ timeout: 8000 });
  const prompt = (await dialog.getByRole('heading', { level: 2 }).innerText()).trim();
  const buttons = dialog.getByRole('button', { name: /^[A-D] / });
  const labels = (await buttons.allInnerTexts()).map((l) => l.trim());
  await buttons.nth(labels.findIndex((l) => l.endsWith(answers.get(prompt)!))).click();
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { const s = JSON.parse(localStorage.getItem('gamify:settings') ?? '{}'); localStorage.setItem('gamify:settings', JSON.stringify({ ...s, tier: 'pro' })); });
});

// Gamify's designed themes (teacher, 2026-10-31).
test('Question Tracker Pet Room: a pet joins the room for every right answer', async ({ page }, info) => {
  test.setTimeout(90_000);
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()); });
  await page.goto('/games/star-quiz');
  await page.getByRole('button', { name: 'Set up and play' }).click();
  await page.getByRole('radio', { name: /Pet Room/ }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await finishSetup(page);
  for (let k = 1; k <= 3; k++) { await answer(page); await expect(page.getByText(`Question ${k + 1} of`)).toBeAttached({ timeout: 8000 }); }
  await expect.poll(() => page.locator('img[src^="/themes/pets/"]').count()).toBeGreaterThanOrEqual(2);
  await page.waitForTimeout(800);
  await page.screenshot({ path: `test-results/pet-room-${info.project.name}.png` });
  expect(problems).toEqual([]);
});

test('Four in a Row Animal Friends', async ({ page }, info) => {
  await page.goto('/games/four-in-a-row');
  await page.getByRole('button', { name: 'Set up and play' }).click();
  await page.getByRole('radio', { name: /Animal Friends/ }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  // The team picture is the player's piece, picked on the player card (teacher, 2026-11-06).
  await page.getByRole('button', { name: /^Pick a player piece for / }).first().click();
  await page.getByRole('dialog').getByRole('button', { name: /^Elephant/ }).click();
  await page.getByRole('button', { name: /^Pick a player piece for / }).first().click();
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Elephant', exact: true })).toHaveAttribute('aria-pressed', 'true');
});
