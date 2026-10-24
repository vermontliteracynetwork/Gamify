import { test, expect, type Page } from '@playwright/test';
import { finishSetup, openSetup } from './setup';

function watch(page: Page) {
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(m.text()); });
  page.on('pageerror', (e) => problems.push(e.message));
  return problems;
}

test('Game Show: surprise cards with two teams', async ({ page }, info) => {
  test.setTimeout(90_000);
  const problems = watch(page);
  await page.goto('/games/game-show');
  await page.screenshot({ path: `test-results/gameshow-welcome-${info.project.name}.png` });
  await openSetup(page, '/games/game-show');
  await page.getByRole('radio', { name: 'Surprise cards' }).click();
  await page.screenshot({ path: `test-results/gameshow-setup-board-${info.project.name}.png` });
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.screenshot({ path: `test-results/gameshow-setup-sets-${info.project.name}.png` });
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('radio', { name: '12' }).click();
  await page.screenshot({ path: `test-results/gameshow-setup-options-${info.project.name}.png` });
  await finishSetup(page);

  // Team 1: right answer, pick card 1.
  const q = page.getByRole('dialog');
  await expect(q.getByRole('button', { name: 'Right' })).toBeVisible();
  await page.screenshot({ path: `test-results/gameshow-question-${info.project.name}.png` });
  await q.getByRole('button', { name: 'Right' }).click();
  await page.getByRole('button', { name: 'Card 1', exact: true }).click();
  const reveal = page.getByRole('dialog');
  await expect(reveal).toBeVisible();
  // Swap/steal with nobody else scoring falls through to OK; points too.
  await reveal.getByRole('button', { name: 'OK' }).click();
  await page.screenshot({ path: `test-results/gameshow-board-${info.project.name}.png`, fullPage: true });

  // Team 2: not yet -> turn passes back to team 1.
  await page.getByRole('dialog').getByRole('button', { name: 'Not yet' }).click();
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Right' })).toBeVisible();
  expect(problems).toEqual([]);
});

test('Game Show: category grid, class vs the computer', async ({ page }, info) => {
  test.setTimeout(90_000);
  const problems = watch(page);
  await openSetup(page, '/games/game-show');
  await page.getByRole('radio', { name: 'Category grid' }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('checkbox', { name: /^Rhyming words/ }).click();
  await page.getByRole('checkbox', { name: /^Shapes/ }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: 'Fewer teams' }).click();
  await expect(page.getByRole('radiogroup', { name: 'Who is the other side?' })).toBeVisible();
  await page.screenshot({ path: `test-results/gameshow-setup-teams-${info.project.name}.png` });
  await finishSetup(page);
  await page.getByRole('button', { name: 'Shapes, 300 points' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Right' }).click();
  await expect(page.getByLabel('300 points', { exact: true })).toBeVisible();
  // The computer takes its turn on its own.
  await expect(page.getByText('The computer is thinking...')).toBeVisible({ timeout: 8000 });
  await page.screenshot({ path: `test-results/gameshow-grid-${info.project.name}.png`, fullPage: true });
  await expect(page.getByText(/The computer (got it|missed)!/)).toBeVisible({ timeout: 8000 });
  expect(problems).toEqual([]);
});
