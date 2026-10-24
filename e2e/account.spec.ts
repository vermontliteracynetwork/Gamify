import { test, expect } from '@playwright/test';

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
