import { test, expect } from '@playwright/test';

// Create an activity (teacher, 2026-10-31): who, game, how, questions, start.
test('Create an activity: pick the game, how they play and the set, then get a code', async ({ page }, info) => {
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(m.text()); });
  page.on('pageerror', (e) => problems.push(e.message));
  await page.goto('/teacher/sets');
  await page.getByRole('button', { name: 'Create an Activity' }).click();
  await expect(page.getByRole('heading', { level: 1, name: /Create an Activity/ })).toBeVisible();
  await expect(page.getByRole('radio', { name: /Anyone with the code/ })).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('button', { name: 'Next' })).toBeDisabled();
  await page.getByRole('radio', { name: /A code to play on their own/ }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('radio', { name: /Cast and Catch/ }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('searchbox', { name: 'Search titles and tags' }).fill('Animals');
  await page.getByRole('radio', { name: /^Animals and habitats/ }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByText('Ready to start')).toBeVisible();
  await page.getByRole('button', { name: 'Make the code' }).click();
  await expect(page.getByLabel(/^Game code [A-Z]{5}/)).toBeVisible();
  await page.screenshot({ path: `test-results/activity-${info.project.name}.png`, fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  expect(problems).toEqual([]);
});

// Pro (teacher, 2026-10-31): a choice board for a class; a student joins with
// the fresh code and picks one of the chosen games, and only those.
test('Pro choice board: the class code opens a board of the chosen games', async ({ page }, info) => {
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(m.text()); });
  page.on('pageerror', (e) => problems.push(e.message));
  await page.addInitScript(() => { if (!localStorage.getItem('gamify:settings')) localStorage.setItem('gamify:settings', JSON.stringify({ tier: 'pro' })); });
  await page.goto('/teacher/classes');
  await page.getByRole('button', { name: 'Make class' }).click();
  await page.getByLabel('New class name').fill('Room 9');
  await page.getByRole('button', { name: 'Make class' }).last().click();
  await page.getByLabel('Add students (type or paste names, one per line)').fill('Ava');
  await page.getByRole('button', { name: 'Add 1 student' }).click();
  await page.goto('/teacher/activity');
  await page.getByRole('radio', { name: /Room 9/ }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('radio', { name: /Choice board/ }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('checkbox', { name: /Cast and Catch/ }).click();
  await expect(page.getByRole('button', { name: 'Next' })).toBeDisabled();
  await page.getByRole('checkbox', { name: /Match Three/ }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('searchbox', { name: 'Search titles and tags' }).fill('Animals');
  await page.getByRole('radio', { name: /^Animals and habitats/ }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Make the choice board code' }).click();
  const code = ((await page.getByLabel(/^Game code [A-Z]{5}/).getAttribute('aria-label')) ?? '').slice(-5);
  await page.screenshot({ path: `test-results/activity-board-${info.project.name}.png` });

  await page.evaluate(() => localStorage.removeItem('gamify:teacher-session'));
  await page.goto('/join');
  await page.getByLabel('Game code').fill(code);
  await page.getByRole('button', { name: 'Go' }).click();
  await page.getByRole('button', { name: "I'm not on the list" }).click();
  await page.getByRole('button', { name: /Play/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: /Pick a game/ })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Cast and Catch' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Match Three' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Game Show' })).toHaveCount(0);
  await page.screenshot({ path: `test-results/choose-${info.project.name}.png` });
  await page.getByRole('link', { name: 'Match Three' }).click();
  await expect(page).toHaveURL(/\/games\/match-three/);
  await expect(page.getByRole('heading', { name: 'Ask for a Code' })).toHaveCount(0);
  expect(problems).toEqual([]);
});
