import { test, expect } from '@playwright/test';
import { LIBRARY } from '../src/data/library';
import { finishSetup, openSetup } from './setup';

const answers = new Map(LIBRARY.flatMap((s) => s.questions.map((q) => [q.prompt, q.choices[q.correctIndex]] as const)));

test('Four in a Row: a player answers, drops a piece, and the computer moves', async ({ page }, info) => {
  test.setTimeout(90_000);
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(m.text()); });
  page.on('pageerror', (e) => problems.push(e.message));
  await openSetup(page, '/games/four-in-a-row');
  await page.getByRole('button', { name: 'Person' }).click(); // player 2 becomes the computer
  await page.getByRole('radio', { name: 'Easy' }).click();
  await finishSetup(page);

  for (let turn = 0; turn < 2; turn++) {
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Read the question')).toBeHidden({ timeout: 8000 });
    const prompt = (await dialog.getByRole('heading', { level: 2 }).innerText()).trim();
    const buttons = dialog.getByRole('button', { name: /^Answer [A-D]:/ });
    const labels = await buttons.allInnerTexts();
    await buttons.nth(labels.findIndex((l) => l.trim().endsWith(answers.get(prompt)!))).click();
    await page.getByRole('button', { name: 'Drop in column 4' }).click();
    await expect(page.getByText('The computer is choosing...')).toBeVisible();
    await expect(page.getByText(/answer to drop a piece/)).toBeVisible({ timeout: 8000 });
  }
  await expect(page.getByRole('gridcell', { name: /: (?!empty)/ })).toHaveCount(4);
  await page.screenshot({ path: `test-results/four-${info.project.name}.png`, fullPage: true });
  expect(problems).toEqual([]);
});
