import { test, expect, type Page } from '@playwright/test';

function watchConsole(page: Page) {
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(m.text()); });
  page.on('pageerror', (e) => problems.push(e.message));
  return problems;
}

test('teacher makes a set by hand, and it saves', async ({ page }, info) => {
  const problems = watchConsole(page);
  await page.goto('/teacher/sets');
  await page.getByRole('button', { name: 'New set' }).click();
  await page.getByLabel('Set name').fill('Weather words');
  await page.getByLabel('Question 1', { exact: true }).fill('What falls from clouds?');
  await page.getByLabel('Question 1, Answer A').fill('snow');
  await page.getByLabel('Question 1, Answer B').fill('sand');
  await page.getByRole('button', { name: 'Mark answer A as the right answer' }).click();
  await expect(page.getByText('1 of 1 questions ready to play')).toBeVisible();
  await expect(page.getByText('Saved')).toBeVisible();
  // Set details are required before the set can be played.
  await expect(page.getByText('Required')).toHaveCount(4);
  await page.getByLabel('Subject').selectOption('Science');
  await page.getByLabel('From', { exact: true }).selectOption('1');
  await page.getByLabel('To', { exact: true }).selectOption('2');
  await page.getByLabel('Tags').fill('weather');
  await page.getByRole('button', { name: 'Add tag' }).click();
  // Tags already in use are offered, most used first, and add in one tap.
  await expect(page.getByText('Popular tags:')).toBeVisible();
  await page.getByLabel('Tags').fill('vow');
  await page.getByRole('button', { name: 'Add the tag vowels' }).click();
  await expect(page.getByRole('button', { name: 'Remove the tag vowels' })).toBeVisible();
  await page.getByLabel('No Common Core standard applies', { exact: false }).check();
  await expect(page.getByText('All details added.', { exact: false })).toBeVisible();
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
  await page.getByLabel('Search titles and tags').fill('fractions');
  await page.getByLabel('Subject').selectOption('Math');
  await page.getByLabel('Grade', { exact: true }).selectOption('3');
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

test('game set picker: cover cards, filters, and only sets with details', async ({ page }, info) => {
  await page.addInitScript(() => {
    if (localStorage.getItem('gamify:sets')) return;
    const q = [{ id: 'q1', kind: 'mc', prompt: 'Two plus two?', choices: ['4', '5'], correctIndex: 0 }];
    localStorage.setItem('gamify:sets', JSON.stringify([
      { id: 's1', name: 'Mine, no details', questions: q, ownerId: 'local-teacher', visibility: 'private', createdAt: '', updatedAt: '' },
      { id: 's2', name: 'Doubles facts', questions: q, ownerId: 'local-teacher', visibility: 'private', createdAt: '', updatedAt: '', subject: 'Math', grades: ['1', '2'], tags: ['doubles'], standards: ['1.OA.6'] },
    ]));
  });
  await page.goto('/games/star-quiz');
  await page.getByRole('button', { name: 'Set up and play' }).click();
  await expect(page.getByText('1 of your sets needs its details', { exact: false })).toBeVisible();
  await expect(page.getByRole('radio', { name: /Mine, no details/ })).toHaveCount(0);
  await page.getByLabel('Search titles and tags').fill('doubles');
  await expect(page.getByRole('radio')).toHaveCount(1);
  // A matching tag is offered; picking it filters by that tag.
  await page.getByRole('button', { name: 'Show sets tagged doubles' }).click();
  await expect(page.getByRole('radio')).toHaveCount(1);
  await page.getByRole('button', { name: 'Stop filtering by doubles' }).click();
  await page.getByLabel('Search titles and tags').fill('');
  await page.getByLabel('Standard code').fill('1.OA');
  await expect(page.getByRole('radio', { name: /Doubles facts/ })).toBeVisible();
  await page.getByLabel('Standard code').fill('');
  await page.getByLabel('Subject').selectOption('Science');
  await expect(page.getByRole('radio', { name: /Animals and habitats/ })).toBeVisible();
  await expect(page.getByRole('radio', { name: /Doubles facts/ })).toHaveCount(0);
  await page.screenshot({ path: `test-results/set-picker-${info.project.name}.png` });
});

test('Common Core: descriptions in the menus and on hover; "no standard" clears added standards', async ({ page }, info) => {
  await page.addInitScript(() => {
    if (localStorage.getItem('gamify:sets')) return;
    const q = [{ id: 'q1', kind: 'mc', prompt: 'Count to ten?', choices: ['yes', 'no'], correctIndex: 0 }];
    localStorage.setItem('gamify:sets', JSON.stringify([{ id: 'cc1', name: 'Counting', questions: q, ownerId: 'local-teacher', visibility: 'private', createdAt: '', updatedAt: '', subject: 'Math', grades: ['K', 'K'], tags: ['counting'] }]));
  });
  await page.goto('/teacher/sets/cc1');
  await expect(page.locator('p', { hasText: 'K.CC.1: Count to 100 by ones and by tens.' })).toBeVisible();
  await expect(page.getByRole('combobox', { name: /^Number/ })).toContainText('1: Count to 100 by ones and by tens.');
  await page.getByRole('button', { name: 'Add K.CC.1' }).click();
  const chip = page.getByText('K.CC.1', { exact: true });
  // Mouse: hover. iPad: tap the code (it takes focus).
  if (info.project.name === 'laptop') await chip.hover(); else await chip.click();
  await expect(page.getByRole('tooltip')).toContainText('Count to 100 by ones and by tens.');
  await page.screenshot({ path: `test-results/standards-hover-${info.project.name}.png` });
  await page.getByLabel('No Common Core standard applies', { exact: false }).check();
  await expect(page.getByRole('button', { name: 'Remove K.CC.1', exact: false })).toHaveCount(0);
});

test('set editor: Upload CSV adds questions, Download CSV and Copy to Google Sheets are always there', async ({ page, context }, info) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
  await page.addInitScript(() => {
    if (localStorage.getItem('gamify:sets')) return;
    localStorage.setItem('gamify:sets', JSON.stringify([{ id: 'csv1', name: 'Spelling', questions: [{ id: 'a', kind: 'mc', prompt: 'Spell cat', choices: ['cat', 'kat'], correctIndex: 0 }], ownerId: 'local-teacher', visibility: 'private', createdAt: '', updatedAt: '' }]));
  });
  await page.goto('/teacher/sets/csv1');
  const csv = 'Question #,Question Text,Answer 1,Answer 2,Answer 3,Answer 4,Correct Answer #\n1,Spell dog,dog,dawg,,,1\n2,,a,b,,,1\n';
  await page.getByLabel('Upload CSV').setInputFiles({ name: 'more.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
  await expect(page.getByText('1 question added from the CSV.', { exact: false })).toBeVisible();
  await expect(page.getByText('row 3', { exact: false })).toBeVisible();
  await expect(page.getByLabel('Question 2', { exact: true })).toHaveValue('Spell dog');
  const wait = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download CSV' }).click();
  expect((await wait).suggestedFilename()).toBe('spelling.csv');
  const popup = page.context().waitForEvent('page').catch(() => null);
  await page.getByRole('button', { name: 'Copy to Google Sheets' }).click();
  await expect(page.getByText(/Copied!|Copying did not work/)).toBeVisible();
  await (await popup)?.close();
  await page.screenshot({ path: `test-results/editor-csv-${info.project.name}.png` });
});
