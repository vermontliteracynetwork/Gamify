import { test, expect, type Page } from '@playwright/test';

function watchConsole(page: Page) {
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(m.text()); });
  page.on('pageerror', (e) => problems.push(e.message));
  return problems;
}

test('teacher makes a set by hand, and it saves', async ({ page }, info) => {
  const problems = watchConsole(page);
  await page.goto('/teacher');
  await page.getByRole('button', { name: 'New set' }).click();
  await page.getByLabel('Set name').fill('Weather words');
  await page.getByLabel('Question 1', { exact: true }).fill('What falls from clouds?');
  await page.getByLabel('Question 1, Answer A').fill('snow');
  await page.getByLabel('Question 1, Answer B').fill('sand');
  await page.getByRole('button', { name: 'Mark answer A as the right answer' }).click();
  await expect(page.getByText('1 of 1 questions ready to play')).toBeVisible();
  await expect(page.getByText('Saved')).toBeVisible();
  await page.screenshot({ path: `test-results/editor-${info.project.name}.png`, fullPage: true });
  await page.getByRole('link', { name: 'Back to question sets' }).click();
  await expect(page.getByRole('heading', { name: 'Weather Words' })).toBeVisible();
  await expect(page.getByText('1 of 3 sets saved')).toBeVisible();
  await page.screenshot({ path: `test-results/sets-${info.project.name}.png`, fullPage: true });
  expect(problems).toEqual([]);
});

test('teacher copies a ready-made set and imports a CSV', async ({ page }, info) => {
  const problems = watchConsole(page);
  await page.goto('/teacher/sets');
  await page.getByRole('tab', { name: 'Ready-made sets' }).click();
  await page.getByLabel('Search ready-made sets').fill('fractions');
  await page.screenshot({ path: `test-results/library-${info.project.name}.png`, fullPage: true });
  await page.getByRole('button', { name: 'Make my own copy' }).click();
  await expect(page.getByLabel('Set name')).toHaveValue('Fractions');

  await page.goto('/teacher/sets/import');
  await page.locator('input[type=file]').setInputFiles({
    name: 'spelling.csv', mimeType: 'text/csv',
    buffer: Buffer.from('Question #,Question Text,Answer 1,Answer 2,Answer 3,Answer 4,Correct Answer #\n1,Spell cat,cat,kat,,,1\n2,,a,b,,,1\n'),
  });
  await expect(page.getByText('1 question found')).toBeVisible();
  await expect(page.getByText('Row 3: Missing question text.')).toBeVisible();
  await page.screenshot({ path: `test-results/import-${info.project.name}.png`, fullPage: true });
  await page.getByRole('button', { name: 'Save 1 question' }).click();
  await expect(page.getByLabel('Set name')).toHaveValue('spelling');
  expect(problems).toEqual([]);
});
