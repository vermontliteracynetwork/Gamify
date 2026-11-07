import { test, expect } from '@playwright/test';
import { LIBRARY } from '../src/data/library';
import { finishSetup, openSetup, startTurn } from './setup';

const answers = new Map(LIBRARY.flatMap((s) => s.questions.map((q) => [q.prompt, q.choices[q.correctIndex]] as const)));

test('Four in a Row: a player answers, drops a piece, and the computer moves', async ({ page }, info) => {
  test.setTimeout(150_000);
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(m.text()); });
  page.on('pageerror', (e) => problems.push(e.message));
  await openSetup(page, '/games/four-in-a-row');
  await page.getByRole('button', { name: 'Person' }).click(); // player 2 becomes the computer
  await page.getByRole('combobox', { name: 'Computer level' }).selectOption('easy');
  await finishSetup(page);

  for (let turn = 0; turn < 2; turn++) {
    const dialog = page.getByRole('dialog');
    await startTurn(page); // the player's turn card (icon only), then the question
    await expect(dialog.getByText('Read the question')).toBeHidden({ timeout: 15000 });
    const prompt = (await dialog.getByRole('heading', { level: 2 }).innerText()).trim();
    const buttons = dialog.getByRole('button', { name: /^[A-D] / });
    const labels = await buttons.allInnerTexts();
    await buttons.nth(labels.findIndex((l) => l.trim().endsWith(answers.get(prompt)!))).click();
    await page.getByRole('button', { name: 'Drop in column 4' }).click();
    if (turn === 1 && info.project.name === 'ipad-landscape') for (let f = 0; f < 6; f++) { await page.screenshot({ path: `test-results/four-drop-${f}.png` }); await page.waitForTimeout(70); }
    await expect(page.getByText('The computer is choosing...')).toBeVisible();
    // Back to the player: their turn card comes up (no turn bar; the scores glow).
    await expect(page.getByRole('button', { name: 'Tap to start' })).toBeVisible({ timeout: 15000 });
  }
  await expect(page.getByRole('gridcell', { name: /: (?!empty)/ })).toHaveCount(4);
  await page.screenshot({ path: `test-results/four-${info.project.name}.png`, fullPage: true });
  expect(problems).toEqual([]);
});

test('Four in a Row on two devices: the friend joins with the code and moves show on both', async ({ page, context }, info) => {
  test.setTimeout(150_000);
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()); });
  await openSetup(page, '/games/four-in-a-row');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  // Next until the "On another device" choice shows (the Ball Collection
  // pieces page may come first, 2026-11-01).
  for (let i = 0; i < 4 && !(await page.getByRole('radio', { name: 'On another device' }).isVisible()); i++) await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('radio', { name: 'On another device' }).click();
  await finishSetup(page);
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
  await startTurn(page);
  await expect(dialog.getByText('Read the question')).toBeHidden({ timeout: 15000 });
  const prompt = (await dialog.getByRole('heading', { level: 2 }).innerText()).trim();
  const buttons = dialog.getByRole('button', { name: /^[A-D] / });
  const labels = await buttons.allInnerTexts();
  await buttons.nth(labels.findIndex((l) => l.trim().endsWith(answers.get(prompt)!))).click();
  await page.getByRole('button', { name: 'Drop in column 3' }).click();
  await expect(friend.getByRole('gridcell', { name: /: (?!empty)/ })).toHaveCount(1);
  await expect(page.getByText(/is playing on their device/)).toBeVisible();
  await expect(friend.getByRole('button', { name: 'Tap to start' })).toBeVisible({ timeout: 15000 });
  await friend.screenshot({ path: `test-results/four-two-friend-${info.project.name}.png` });
  expect(problems).toEqual([]);
});

test('Four in a Row: a right answer can bring Double Drop, and it drops two pieces', async ({ page }, info) => {
  test.setTimeout(150_000);
  await page.addInitScript(() => { Math.random = () => 0.05; if (!localStorage.getItem('gamify:settings')) localStorage.setItem('gamify:settings', JSON.stringify({ tier: 'plus' })); });
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()); });
  page.on('pageerror', (e) => problems.push(e.message));
  await openSetup(page, '/games/four-in-a-row');
  await page.getByRole('button', { name: 'Person' }).click();
  await page.getByRole('combobox', { name: 'Computer level' }).selectOption('easy');
  await finishSetup(page);
  const answer = async () => {
    const dialog = page.getByRole('dialog');
    await startTurn(page); // the player's turn card (icon only), then the question
    await expect(dialog.getByText('Read the question')).toBeHidden({ timeout: 15000 });
    const prompt = (await dialog.getByRole('heading', { level: 2 }).innerText()).trim();
    const buttons = dialog.getByRole('button', { name: /^[A-D] / });
    const labels = await buttons.allInnerTexts();
    await buttons.nth(labels.findIndex((l) => l.trim().endsWith(answers.get(prompt)!))).click();
  };
  await answer();
  await expect(page.getByRole('status').filter({ hasText: /Double Drop|Pop Out/ })).toBeVisible({ timeout: 15000 });
  // Held power-ups show on the player's next turn.
  await page.getByRole('button', { name: 'Drop in column 4' }).click();
  await expect(page.getByText('The computer is choosing...')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tap to start' })).toBeVisible({ timeout: 15000 });
  await answer();
  const use = page.getByRole('button', { name: /^Use Double Drop/ });
  await expect(use).toBeEnabled({ timeout: 15000 });
  await page.screenshot({ path: `test-results/four-power-${info.project.name}.png` });
  // The board never runs off the screen.
  const box = (await page.getByRole('grid').first().boundingBox())!;
  expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  await use.click();
  await page.getByRole('button', { name: 'Drop in column 3' }).click();
  await expect(page.getByRole('button', { name: 'Drop in column 5' })).toBeEnabled({ timeout: 4000 });
  await page.getByRole('button', { name: 'Drop in column 5' }).click();
  await expect(page.getByText('The computer is choosing...')).toBeVisible();
  await expect(page.getByRole('gridcell', { name: /: (?!empty)/ })).toHaveCount(5, { timeout: 15000 });
  expect(problems).toEqual([]);
});
