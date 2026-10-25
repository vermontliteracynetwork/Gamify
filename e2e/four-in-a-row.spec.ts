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
    const buttons = dialog.getByRole('button', { name: /^[A-D] / });
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

test('Four in a Row on two devices: the friend joins with the code and moves show on both', async ({ page, context }, info) => {
  test.setTimeout(90_000);
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()); });
  await openSetup(page, '/games/four-in-a-row');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  if (await page.getByRole('heading', { name: /Questions/ }).isVisible().catch(() => false)) await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('radio', { name: 'On another device' }).click();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Waiting for Your Friend' })).toBeVisible();
  const code = (await page.getByLabel(/^Game code [A-Z]{5}$/).getAttribute('aria-label'))!.slice(-5);
  await page.screenshot({ path: `test-results/four-two-waiting-${info.project.name}.png` });

  const friend = await context.newPage();
  friend.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()); });
  await friend.goto(`/join/${code}`);
  await friend.getByRole('button', { name: /Play/ }).last().click();
  await expect(friend.getByText(/is playing on their device/)).toBeVisible();

  // Player 1 (this device) answers and drops; the friend sees the piece land.
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Read the question')).toBeHidden({ timeout: 8000 });
  const prompt = (await dialog.getByRole('heading', { level: 2 }).innerText()).trim();
  const buttons = dialog.getByRole('button', { name: /^[A-D] / });
  const labels = await buttons.allInnerTexts();
  await buttons.nth(labels.findIndex((l) => l.trim().endsWith(answers.get(prompt)!))).click();
  await page.getByRole('button', { name: 'Drop in column 3' }).click();
  await expect(friend.getByRole('gridcell', { name: /: (?!empty)/ })).toHaveCount(1);
  await expect(page.getByText(/is playing on their device/)).toBeVisible();
  await expect(friend.getByRole('dialog').getByRole('heading', { level: 2 })).toBeVisible({ timeout: 8000 });
  await friend.screenshot({ path: `test-results/four-two-friend-${info.project.name}.png` });
  expect(problems).toEqual([]);
});
