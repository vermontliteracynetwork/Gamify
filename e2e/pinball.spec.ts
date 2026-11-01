import { test, expect } from '@playwright/test';
import { answerShare, finishSetup, openSetup, noPowerUps, startTurn } from './setup';

// Pinball replaced Peg Drop (teacher, 2026-10-31).
test('Pinball: a right answer earns a shot; pick a lane, stop the power bar, and the ball lands in a top pocket or rolls back', async ({ page }, info) => {
  test.setTimeout(60_000);
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(m.text()); });
  await page.goto('/games/peg-drop');
  await expect(page).toHaveURL(/\/games\/pinball/);
  await openSetup(page, '/games/pinball');
  await finishSetup(page);
  // Round 1 starts with three pockets.
  await expect(page.getByRole('img', { name: 'Pinball table with 3 pockets' })).toBeVisible();
  await answerShare(page, true);
  await expect(page.getByRole('button', { name: 'Shoot up lane 4' })).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)).toBeLessThanOrEqual(1);
  await page.screenshot({ path: `test-results/pinball-lanes-${info.project.name}.png` });
  // Picking a lane hides the lanes and starts the power bar (teacher, 2026-10-31).
  await page.getByRole('button', { name: 'Shoot up lane 4' }).click();
  await expect(page.getByRole('button', { name: 'Shoot up lane 4' })).toHaveCount(0);
  await expect(page.getByRole('meter', { name: 'Power' })).toBeVisible();
  await page.screenshot({ path: `test-results/pinball-aim-${info.project.name}.png` });
  await page.waitForTimeout(700);
  await page.getByRole('button', { name: 'Shoot!' }).click();
  if (info.project.name === 'ipad-landscape') for (let f = 0; f < 8; f++) { await page.screenshot({ path: `test-results/pinball-frame-${f}.png` }); await page.waitForTimeout(150); }
  await expect(page.getByText(/^(\+\d+|So close!)$/).first()).toBeVisible({ timeout: 5000 });
  await page.screenshot({ path: `test-results/pinball-landed-${info.project.name}.png` });
  // Next team's question.
  await startTurn(page);
  await expect(page.getByRole('dialog').getByRole('button', { name: /^[A-D] / }).first()).toBeVisible({ timeout: 6000 });
  expect(problems).toEqual([]);
});

// Last, so a test's own settings (like the plan) are written first.
test.beforeEach(async ({ page }) => { await noPowerUps(page, 'pinball'); });

// Held power-ups (teacher, 2026-10-31): earned now, shown under the scores on
// the player's next turn, used with a tap, gone after that turn.
test('Pinball: a power-up waits for your next turn under the scores', async ({ page }, info) => {
  test.setTimeout(90_000);
  await page.addInitScript(() => { Math.random = () => 0.05; const st = JSON.parse(localStorage.getItem('gamify:settings') ?? '{}'); localStorage.setItem('gamify:settings', JSON.stringify({ ...st, tier: 'plus', 'setup:pinball': { ...(st['setup:pinball'] ?? {}), powerUps: true } })); });
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()); });
  const { LIBRARY } = await import('../src/data/library');
  const answers = new Map(LIBRARY.flatMap((s) => s.questions.map((q) => [q.prompt.trim(), q.choices[q.correctIndex]] as const)));
  const answer = async () => {
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Read the question')).toBeHidden({ timeout: 8000 });
    const prompt = (await dialog.getByRole('heading', { level: 2 }).innerText()).trim();
    const buttons = dialog.getByRole('button', { name: /^[A-D] / });
    const labels = (await buttons.allInnerTexts()).map((l) => l.trim());
    await buttons.nth(labels.findIndex((l) => l.endsWith(answers.get(prompt)!))).click();
  };
  await openSetup(page, '/games/pinball', /^Solo/);
  await finishSetup(page);
  await answer();
  await expect(page.getByRole('status').filter({ hasText: 'Ready on your next turn' })).toBeVisible({ timeout: 8000 });
  // Not usable this turn.
  await expect(page.getByRole('button', { name: /^Use Golden Ball/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Shoot up lane 3' }).click();
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: 'Shoot!' }).click();
  await answer();
  const use = page.getByRole('button', { name: /^Use Golden Ball: Double points: / });
  await expect(use).toBeVisible({ timeout: 8000 });
  await page.screenshot({ path: `test-results/pinball-held-${info.project.name}.png` });
  await use.click();
  await expect(use).toHaveCount(0);
  await expect(page.getByText('Double points', { exact: true })).toBeVisible();
  expect(problems).toEqual([]);
});

// The computer takes real shots (Claudia, 2026-10-31: its timer used to reset
// every frame of the power bar, so it never shot).
test('Pinball Versus: the computer shoots and play comes back to the player', async ({ page }, info) => {
  test.setTimeout(90_000);
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()); });
  page.on('pageerror', (e) => problems.push(e.message));
  await openSetup(page, '/games/pinball', /^Versus/);
  for (;;) {
    if (await page.getByRole('heading', { name: /Players/ }).isVisible()) break;
    await page.getByRole('button', { name: 'Next', exact: true }).click();
  }
  await page.getByRole('button', { name: 'Person' }).click(); // player 2 becomes the computer
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await answerShare(page, true);
  await page.getByRole('button', { name: 'Shoot up lane 2' }).click();
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'Shoot!' }).click();
  // The computer's turn: its question, its lane, its shot, then back to us.
  await expect(page.getByText('Round 2 of 5').locator('visible=true').first()).toBeVisible({ timeout: 40_000 });
  await answerShare(page, true);
  await expect(page.getByRole('button', { name: 'Shoot up lane 2' })).toBeEnabled({ timeout: 10_000 });
  await page.screenshot({ path: `test-results/pinball-cpu-${info.project.name}.png` });
  expect(problems).toEqual([]);
});
