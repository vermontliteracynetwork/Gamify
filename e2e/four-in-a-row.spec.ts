import { test, expect } from '@playwright/test';
import { LIBRARY } from '../src/data/library';
import { finishSetup, noPowerUps, openSetup, startTurn } from './setup';

const answers = new Map(LIBRARY.flatMap((s) => s.questions.map((q) => [q.prompt, q.choices[q.correctIndex]] as const)));

test('Four in a Row: a player answers, drops a piece, and the computer moves', async ({ page }, info) => {
  test.setTimeout(150_000);
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(m.text()); });
  page.on('pageerror', (e) => problems.push(e.message));
  // A power-up won on the answer would wait for a tap before the drop; this test is the plain turn.
  await noPowerUps(page, 'four-in-a-row');
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
    await expect(page.getByText(/ is choosing\.\.\.$/)).toBeVisible();
    if (turn === 0) {
      // The lightbulb by Settings opens the game's tips; Got it closes them (teacher, 2026-11-24).
      await page.getByRole('button', { name: 'Tips' }).click();
      const tips = page.getByRole('dialog', { name: 'Tips' });
      await expect(tips.getByRole('listitem').first()).toBeVisible();
      await page.waitForTimeout(700);
      await page.screenshot({ path: `test-results/four-tips-${info.project.name}.png` });
      await tips.getByRole('button', { name: 'Got it' }).click();
      await expect(tips).toHaveCount(0);
    }
    // Back to the player: their turn card comes up (no turn bar; the scores glow).
    await expect(page.getByRole('button', { name: 'Tap to start' })).toBeVisible({ timeout: 20000 });
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
  // "On another device" sits under Share on the way page (2026-11-23).
  await page.getByRole('button', { name: 'Back' }).click();
  await page.getByRole('radio', { name: 'Share a join code' }).click();
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
  // A power-up card stays until it is closed (teacher, 2026-11-13).
  const card = page.getByRole('dialog').filter({ hasText: /Double Drop|Pop Out/ });
  await expect(card).toBeVisible({ timeout: 15000 });
  await card.getByRole('button', { name: 'Close' }).click();
  // Held power-ups show on the player's next turn.
  await page.getByRole('button', { name: 'Drop in column 4' }).click();
  await expect(page.getByText(/ is choosing\.\.\.$/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tap to start' })).toBeVisible({ timeout: 20000 });
  await answer();
  // The power-up won on this answer shows first; close it.
  const won = page.getByRole('dialog').filter({ hasText: /Double Drop|Pop Out/ });
  await expect(won).toBeVisible({ timeout: 15000 });
  await won.getByRole('button', { name: 'Close' }).click();
  // Held power-ups wait in the tray for a tap (teacher, 2026-11-24): tap
  // Double Drop, read its card, then Use it!
  const tray = page.getByRole('group', { name: 'Power-ups' });
  await tray.getByRole('button', { name: /Double Drop/ }).click({ timeout: 15000 });
  await page.getByRole('button', { name: 'Use it!' }).click();
  await page.screenshot({ path: `test-results/four-power-${info.project.name}.png` });
  // Close every power-up card (a new one can stack on top).
  for (let k = 0; k < 4; k++) {
    const top = page.getByRole('dialog').filter({ has: page.getByRole('button', { name: 'Close' }) }).last();
    if (!(await top.isVisible().catch(() => false))) break;
    await top.getByRole('button', { name: 'Close' }).click({ force: true }); // the card keeps bobbing, so it is never "stable"
    await page.waitForTimeout(400);
  }
  // The board never runs off the screen.
  const box = (await page.getByRole('grid').first().boundingBox())!;
  expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  await page.getByRole('button', { name: 'Drop in column 3' }).click();
  await expect(page.getByRole('button', { name: 'Drop in column 5' })).toBeEnabled({ timeout: 4000 });
  await page.getByRole('button', { name: 'Drop in column 5' }).click();
  await expect(page.getByText(/ is choosing\.\.\.$/)).toBeVisible();
  await expect(page.getByRole('gridcell', { name: /: (?!empty)/ })).toHaveCount(5, { timeout: 15000 });
  expect(problems).toEqual([]);
});
