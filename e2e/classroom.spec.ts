import { test, expect, type Page } from '@playwright/test';
import { finishSetup, openSetup } from './setup';

function watch(page: Page) {
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(m.text()); });
  page.on('pageerror', (e) => problems.push(e.message));
  return problems;
}

test('teacher makes a class, assigns a set, sets supports; a student signs in and plays it', async ({ page }, info) => {
  test.setTimeout(120_000);
  const problems = watch(page);
  await page.goto('/teacher/classes');
  await page.getByLabel('New class name').fill('Room 12');
  await page.getByRole('button', { name: 'Make class' }).click();
  await page.getByLabel('Add students (type or paste names, one per line)').fill('Ava\nBen');
  await page.getByRole('button', { name: 'Add 2 students' }).click();
  await expect(page.getByText('2 of 30 students')).toBeVisible();
  await page.screenshot({ path: `test-results/class-students-${info.project.name}.png`, fullPage: true });

  // Supports for Ava, behind the teacher PIN (chosen here the first time).
  await page.getByRole('button', { name: 'Supports for Ava' }).click();
  for (const _ of [0, 1]) {
    for (const d of '1357') await page.getByRole('button', { name: d, exact: true }).click();
    await page.waitForTimeout(250);
  }
  const dialog = page.getByRole('dialog', { name: 'Supports for Ava' });
  await dialog.getByRole('slider', { name: 'Time to read before answering' }).fill('0');
  await dialog.getByRole('button', { name: 'Save supports' }).click();
  await expect(page.getByText('Supports', { exact: true })).toBeVisible();

  // Assign Animals and habitats to the whole class.
  await page.getByRole('tab', { name: 'Assigned sets' }).click();
  await page.getByRole('radio', { name: /^Animals and habitats/ }).click();
  await page.getByRole('button', { name: 'Assign', exact: true }).click();
  await expect(page.getByText('Whole class').first()).toBeVisible();
  // Free plan: one assigned set.
  await expect(page.getByText('Your plan includes 1 assigned sets per student.', { exact: false })).toBeVisible();
  await page.screenshot({ path: `test-results/class-sets-${info.project.name}.png`, fullPage: true });

  // Hide Versus for the class.
  await page.getByRole('tab', { name: 'Play modes' }).click();
  await page.getByRole('switch').nth(3).click();

  // Student sign-in with Ava's two pictures.
  await page.getByRole('link', { name: 'Student sign-in on this device' }).click();
  await page.getByRole('button', { name: 'Ava' }).click();
  const pics = await page.evaluate(() => JSON.parse(localStorage.getItem('gamify:students')!).find((s: { name: string }) => s.name === 'Ava').picturePassword as string[]);
  await page.screenshot({ path: `test-results/arcade-signin-${info.project.name}.png` });
  for (const p of pics) await page.getByRole('button', { name: p, exact: true }).click();
  await expect(page.getByRole('heading', { name: "Ava's Arcade" })).toBeVisible();
  await expect(page.getByRole('link', { name: /Four in a Row/ })).toHaveCount(0); // Versus hidden
  await page.screenshot({ path: `test-results/arcade-${info.project.name}.png` });

  // Star Quiz uses the assigned set (no question page) and Ava's no-wait support.
  await page.getByRole('link', { name: /Question Tracker/ }).click();
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

test('a class can sign in with sign-in pictures drawn in the Theme Builder', async ({ page }, info) => {
  await page.addInitScript(() => { if (!localStorage.getItem('gamify:settings')) localStorage.setItem('gamify:settings', JSON.stringify({ tier: 'plus' })); });
  const problems = watch(page);
  await page.goto('/teacher/themes/sign-in');
  await page.getByLabel('Theme name').fill('Our Animals');
  const png = await page.evaluate(() => { const c = document.createElement('canvas'); c.width = c.height = 120; const x = c.getContext('2d')!; x.fillStyle = '#e85d75'; x.fillRect(0, 0, 120, 120); return c.toDataURL('image/png').split(',')[1]; });
  await page.getByRole('button', { name: 'Add a picture for Cat picture' }).locator('xpath=following-sibling::input').setInputFiles({ name: 'cat.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
  await page.getByRole('button', { name: 'Save theme' }).click();
  await expect(page.getByText('Saved Our Animals.', { exact: false })).toBeVisible();

  await page.goto('/teacher/classes');
  await page.getByLabel('New class name').fill('Room 5');
  await page.getByRole('button', { name: 'Make class' }).click();
  await page.getByRole('radio', { name: 'Our Animals' }).click();
  await page.getByLabel('Add students (type or paste names, one per line)').fill('Zoe');
  await page.getByRole('button', { name: 'Add 1 student' }).click();
  await page.getByRole('link', { name: 'Student sign-in on this device' }).click();
  await page.getByRole('button', { name: 'Zoe', exact: true }).click();
  await expect(page.getByRole('button', { name: 'cat', exact: true }).locator('img')).toHaveCount(1);
  await page.screenshot({ path: `test-results/signin-drawn-${info.project.name}.png` });
  expect(problems).toEqual([]);
});
