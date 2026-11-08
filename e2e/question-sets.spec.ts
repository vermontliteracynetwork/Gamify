import { test, expect, type Page } from '@playwright/test';
import { openSetup } from './setup';

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
  await page.goto('/teacher/sets');
  await expect(page.getByRole('heading', { name: 'Weather Words' })).toBeVisible();
  await expect(page.getByText('1 of 3 sets saved')).toBeVisible();
  await page.screenshot({ path: `test-results/sets-${info.project.name}.png`, fullPage: true });
  expect(problems).toEqual([]);
});

test('teacher copies a ready-made set and imports a CSV', async ({ page }, info) => {
  const problems = watchConsole(page);
  await page.goto('/teacher/sets');
  await page.getByRole('tab', { name: 'Public sets' }).click();
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
  await openSetup(page, '/games/star-quiz');
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
  // Ready-made sets live on the Public sets tab (teacher, 2026-11-06).
  await page.getByRole('tab', { name: 'Public sets' }).click();
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

// Market gaps (2026-11-01): true or false in one tap, the teacher's own
// voice for a question, and a teach card shown before play.
test('set editor: true or false, a sound clip for the question, and a teach card before play', async ({ page }, info) => {
  const problems = watchConsole(page);
  await page.goto('/teacher/sets');
  await page.getByRole('button', { name: 'New set' }).click();
  await page.getByLabel('Set name').fill('Fact or fiction');
  await page.getByLabel('Question 1', { exact: true }).fill('A cat is a mammal.');
  await page.getByRole('button', { name: 'Make question 1 true or false' }).click();
  await expect(page.getByLabel('Question 1, Answer A')).toHaveValue('True');
  await expect(page.getByLabel('Question 1, Answer B')).toHaveValue('False');
  // A short WAV clip stands in for the teacher's recording.
  const rate = 8000, n = rate / 4, wav = Buffer.alloc(44 + n * 2);
  wav.write('RIFF', 0); wav.writeUInt32LE(36 + n * 2, 4); wav.write('WAVEfmt ', 8); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(rate, 24); wav.writeUInt32LE(rate * 2, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(n * 2, 40);
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Add a sound clip for question 1' }).click();
  await (await chooser).setFiles({ name: 'q1.wav', mimeType: 'audio/wav', buffer: wav });
  await expect(page.getByRole('button', { name: 'Play your recording of question 1' })).toBeVisible();
  await page.getByLabel('Teach card (optional)').fill('A fact is true. Fiction is made up.');
  await page.getByLabel('Subject').selectOption('Science');
  await page.getByLabel('From', { exact: true }).selectOption('1');
  await page.getByLabel('To', { exact: true }).selectOption('2');
  await page.getByLabel('Tags').fill('facts');
  await page.getByRole('button', { name: 'Add tag' }).click();
  await page.getByLabel('No Common Core standard applies', { exact: false }).check();
  await expect(page.getByText('Saved')).toBeVisible();
  await page.screenshot({ path: `test-results/editor-tf-voice-teach-${info.project.name}.png`, fullPage: true });

  await openSetup(page, '/games/game-show');
  for (let k = 0; k < 6 && !(await page.getByRole('radio', { name: /^Fact or fiction/ }).isVisible()); k++) await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('radio', { name: /^Fact or fiction/ }).click();
  for (let k = 0; k < 8 && await page.getByRole('button', { name: 'Next', exact: true }).isVisible(); k++) await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  const card = page.getByRole('dialog', { name: 'Before we play' });
  await expect(card).toBeVisible();
  await expect(card.getByText('A fact is true. Fiction is made up.')).toBeVisible();
  await page.screenshot({ path: `test-results/teach-card-${info.project.name}.png` });
  await card.getByRole('button', { name: "Let's play!" }).click();
  await expect(card).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Tap to start' })).toBeVisible();
  expect(problems).toEqual([]);
});
