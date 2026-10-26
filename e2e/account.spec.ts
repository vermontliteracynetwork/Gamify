import { test, expect } from '@playwright/test';
import { signUpTeacher } from './setup';

test('downgrade keeps extra sets read-only; account exports and deletes everything', async ({ page }) => {
  await page.addInitScript(() => {
    if (localStorage.getItem('gamify:sets')) return;
    const q = [{ id: 'q1', kind: 'mc', prompt: 'One plus one?', choices: ['2', '3'], correctIndex: 0 }];
    localStorage.setItem('gamify:sets', JSON.stringify([1, 2, 3, 4].map((n) => ({ id: `s${n}`, name: `Set ${n}`, questions: q, ownerId: 'local-teacher', visibility: 'private', createdAt: `2026-01-0${n}`, updatedAt: '' }))));
  });
  await page.goto('/teacher/sets/s4');
  await expect(page.getByText('so this one is read-only. Nothing was deleted.', { exact: false })).toBeVisible();
  await page.goto('/teacher/sets/s1');
  await expect(page.getByLabel('Set name')).toBeEditable();

  await page.goto('/teacher/account');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download my data' }).click();
  expect((await download).suggestedFilename()).toMatch(/^gamify-export-/);
  await expect(page.getByRole('button', { name: 'Delete all my data' })).toBeDisabled();
  await page.getByLabel('Type DELETE to confirm').fill('DELETE');
  await page.getByRole('button', { name: 'Delete all my data' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Every Question Becomes a Game' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('gamify:sets'))).toBeNull();
});

test('teacher accounts: sign up checks every field, then log in with username and password', async ({ page }) => {
  await page.addInitScript(() => { if (!sessionStorage.getItem('cleared')) { sessionStorage.setItem('cleared', '1'); localStorage.removeItem('gamify:teacher-session'); } });
  await page.goto('/login');
  await page.getByRole('tab', { name: 'Sign up' }).click();
  await page.getByLabel('Username').fill('a');
  await page.getByLabel('Password', { exact: true }).fill('short');
  await page.getByLabel('Confirm password').fill('different');
  await page.getByRole('button', { name: 'Create my free account' }).click();
  await expect(page.getByText('Enter an email like name@school.org.')).toBeVisible();
  await expect(page.getByText('Use 3 to 20 letters, numbers, periods or underscores.')).toBeVisible();
  await expect(page.getByText('Use at least 8 characters.')).toBeVisible();
  await expect(page.getByText('The two passwords do not match.')).toBeVisible();
  await signUpTeacher(page, 'miss.jen');
  await expect(page).toHaveURL(/\/teacher/);
  await page.getByRole('button', { name: /Log out/ }).click();
  await page.goto('/login');
  await page.getByLabel('Username').fill('miss.jen');
  await page.getByLabel('Password', { exact: true }).fill('wrong-one');
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page.getByText('That username and password do not match. Check both and try again.')).toBeVisible();
  await page.getByLabel('Password', { exact: true }).fill('apples123');
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page).toHaveURL(/\/teacher/);
});
