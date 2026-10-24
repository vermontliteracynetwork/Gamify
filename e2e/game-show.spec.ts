import { test, expect, type Page } from '@playwright/test';
import { answerShare, finishSetup, openSetup } from './setup';

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

  // Team 1: pick card 1, then tap the right answer; the card turns over.
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Card 1', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('button', { name: /^[A-D] / }).first()).toBeVisible();
  await page.screenshot({ path: `test-results/gameshow-question-${info.project.name}.png` });
  await answerShare(page, true);
  const reveal = page.getByRole('dialog');
  await expect(reveal).toBeVisible();
  // Swap/steal with nobody else scoring falls through to OK; points too.
  await reveal.getByRole('button', { name: 'OK' }).click();
  await page.screenshot({ path: `test-results/gameshow-board-${info.project.name}.png`, fullPage: true });

  // Team 2: a wrong tap keeps the card closed and the turn passes back.
  await page.getByRole('button', { name: 'Card 2', exact: true }).click();
  await answerShare(page, false);
  await expect(page.getByRole('button', { name: 'Card 2', exact: true })).toBeEnabled();
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
  await answerShare(page, true);
  await expect(page.getByLabel('300 points', { exact: true })).toBeVisible();
  // The computer takes its turn on its own.
  await expect(page.getByText('The computer is thinking...')).toBeVisible({ timeout: 8000 });
  await page.screenshot({ path: `test-results/gameshow-grid-${info.project.name}.png`, fullPage: true });
  await expect(page.getByText(/The computer (got it|missed)!/)).toBeVisible({ timeout: 8000 });
  expect(problems).toEqual([]);
});

test('Game Show: teams from the class list, balanced, and saved', async ({ page }, info) => {
  await page.addInitScript(() => {
    if (localStorage.getItem('gamify:classrooms')) return;
    localStorage.setItem('gamify:classrooms', JSON.stringify([{ id: 'c1', name: 'Room 7', ownerId: 'local-teacher', createdAt: '', joinCode: 'BCDFG' }]));
    localStorage.setItem('gamify:students', JSON.stringify(['Ava', 'Ben', 'Cal', 'Dee'].map((n, i) => ({ id: `s${i}`, classroomId: 'c1', name: n, picturePassword: ['cat', 'dog'] }))));
  });
  await openSetup(page, '/games/game-show');
  await page.getByRole('radio', { name: 'Surprise cards' }).click();
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByLabel('Class list').selectOption('c1');
  await page.getByRole('button', { name: 'Balanced teams' }).click();
  await expect(page.getByRole('group').first().getByRole('button')).toHaveCount(2);
  await page.getByLabel('Name these teams').fill('Reading groups');
  await page.getByRole('button', { name: 'Save teams' }).click();
  await expect(page.getByRole('button', { name: 'Reading groups' })).toBeVisible();
  await page.screenshot({ path: `test-results/gameshow-class-teams-${info.project.name}.png`, fullPage: true });
  await finishSetup(page);
  await page.getByRole('button', { name: 'Card 1', exact: true }).click();
  await expect(page.getByRole('dialog').getByText(/(Ava|Ben|Cal|Dee), (Ava|Ben|Cal|Dee)/)).toBeVisible();
});
