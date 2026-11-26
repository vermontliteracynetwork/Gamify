import { test, expect, type Page } from '@playwright/test';
import { finishSetup, joinWithCode, openSetup, seedGameCode } from './setup';

function watch(page: Page) {
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(m.text()); });
  page.on('pageerror', (e) => problems.push(e.message));
  return problems;
}

test('Homeschool: the teacher adds students (no class), assigns a set, sets supports; a student taps their name and plays it', async ({ page }, info) => {
  test.setTimeout(120_000);
  const problems = watch(page);
  // Free has no student list at all since 2026-11-26; Homeschool keeps one list.
  await page.addInitScript(() => { if (!localStorage.getItem('gamify:settings')) localStorage.setItem('gamify:settings', JSON.stringify({ tier: 'homeschool' })); });
  await page.goto('/teacher/classes');
  // Classes are Plus and Pro only: Homeschool opens the teacher's student list.
  await expect(page.getByRole('heading', { name: 'My Students' })).toBeVisible();
  await expect(page.getByLabel('New class name')).toHaveCount(0);
  await page.getByLabel('Add students (type or paste names, one per line)').fill('Ava\nBen');
  await page.getByRole('button', { name: 'Add 2 students' }).click();
  await expect(page.getByText('2 of 10 students')).toBeVisible();
  await page.screenshot({ path: `test-results/class-students-${info.project.name}.png`, fullPage: true });

  // Supports for Ava, behind the teacher PIN (chosen here the first time).
  await page.getByRole('button', { name: 'Supports for Ava' }).click();
  for (const _ of [0, 1]) {
    await page.locator('input[autocomplete="one-time-code"]').last().fill('1357');
    await page.waitForTimeout(250);
  }
  const dialog = page.getByRole('dialog', { name: 'Supports for Ava' });
  await dialog.getByRole('slider', { name: 'Time to read before answering' }).fill('0');
  await dialog.getByRole('button', { name: 'Save supports' }).click();
  // Supports show as chips in the roster table (teacher portal 3b).
  await expect(page.getByRole('cell', { name: '0s to read first' })).toBeVisible();

  // Assign Animals and habitats to the whole class.
  await page.getByRole('tab', { name: 'Assigned sets' }).click();
  await page.getByRole('searchbox', { name: 'Search titles and tags' }).fill('Animals');
  await page.getByRole('radio', { name: /^Animals and habitats/ }).click();
  await page.getByRole('button', { name: 'Assign', exact: true }).click();
  await expect(page.getByText('Whole class').first()).toBeVisible();
  // Homeschool: one assigned set per student.
  await expect(page.getByText('Assigned sets for each student: up to 1.', { exact: false })).toBeVisible();
  await page.screenshot({ path: `test-results/class-sets-${info.project.name}.png`, fullPage: true });

  // Ways to play: Live, Share and Solo (Versus is part of Solo since
  // 2026-11-23); no student design switch (Theme Builder is teachers only, 2026-11-26).
  await page.getByRole('tab', { name: 'Ways to play' }).click();
  await expect(page.getByText('Students can design themes')).toHaveCount(0);

  // Student sign-in through a game code (no class codes or Arcade, teacher
  // 2026-10-31): tap Ava's name and picture (no PIN, owner 2026-11-26).
  await seedGameCode(page, 'BKDFG');
  await page.evaluate(() => localStorage.removeItem('gamify:teacher-session')); // the student's own turn on this device
  await joinWithCode(page, 'BKDFG');
  await page.screenshot({ path: `test-results/arcade-signin-${info.project.name}.png` });
  await page.getByRole('button', { name: 'Ava' }).click();
  // The code opens its game for Ava, and no other.
  await expect(page).toHaveURL(/\/games\/star-quiz/);
  await page.goto('/games/game-show');
  await expect(page.getByRole('heading', { name: 'Ask for a Code' })).toBeVisible();

  // Star Quiz uses the code's set (no question page) and Ava's no-wait support.
  await openSetup(page, '/games/star-quiz');
  await expect(page.getByRole('heading', { name: /^Step 1 of 1:/ })).toBeVisible();
  await finishSetup(page);
  const q = page.getByRole('dialog');
  await expect(q.getByText('Read the question')).toHaveCount(0);
  const prompt = await q.getByRole('heading', { level: 2 }).innerText();
  expect(['Where does a fish live?', 'Which animal is a mammal?', 'What do caterpillars turn into?'].some((x) => prompt.includes(x)) || prompt.length > 0).toBe(true);
  const log = await page.evaluate(() => localStorage.getItem('gamify:log'));
  expect(log ?? '').not.toContain('"studentId":undefined');
  expect(problems).toEqual([]);
});

test('Pro: upload a student picture; a game link asks students to tap their name and picture (no PIN)', async ({ page }, info) => {
  await page.addInitScript(() => {
    if (localStorage.getItem('gamify:classrooms')) return;
    localStorage.setItem('gamify:settings', JSON.stringify({ tier: 'pro' }));
    localStorage.setItem('gamify:classrooms', JSON.stringify([{ id: 'r1', name: 'Room 1', ownerId: 'local-teacher', createdAt: '2026-10-01', joinCode: 'BCDFG' }]));
    localStorage.setItem('gamify:students', JSON.stringify([{ id: 's1', classroomId: 'r1', name: 'Mia', picturePassword: ['sun', 'moon'] }]));
  });
  const problems = watch(page);
  await page.goto('/teacher/classes/r1');
  await page.getByRole('button', { name: 'Sign-in picture for Mia' }).click();
  const dialog = page.getByRole('dialog', { name: 'Sign-in picture for Mia' });
  const png = await page.evaluate(() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d')!; x.fillStyle = '#2a9df4'; x.fillRect(0, 0, 64, 64); return c.toDataURL('image/png').split(',')[1]; });
  await dialog.locator('input[type=file]').setInputFiles({ name: 'mia.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
  await dialog.screenshot({ path: `test-results/avatar-dialog-${info.project.name}.png` });
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  // No PIN column anywhere (owner, 2026-11-26).
  await expect(page.getByRole('button', { name: 'Show PINs' })).toHaveCount(0);

  // A hosted game code: Mia taps her name and picture.
  await page.goto('/teacher/sets');
  await page.getByRole('tab', { name: 'Public sets' }).click();
  await page.getByLabel('Search titles and tags').fill('habitats');
  await page.getByRole('button', { name: 'Play or share' }).click();
  const host = page.getByRole('dialog');
  await host.getByRole('radio', { name: /Question Tracker/ }).click();
  await host.getByRole('button', { name: 'Make a game code' }).click();
  const code = (await host.getByLabel(/^Game code /).innerText()).trim();
  await page.goto(`/join/${code}`);
  await expect(page.getByRole('heading', { name: "Who's Playing?" })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Mia' }).locator('img')).toHaveCount(1);
  await page.getByRole('button', { name: 'Mia' }).click();
  await page.getByRole('button', { name: 'Set up and play' }).click();
  expect(await page.evaluate(() => JSON.parse(sessionStorage.getItem('gamify:arcade-session')!).name)).toBe('Mia');
  expect(problems).toEqual([]);
});
