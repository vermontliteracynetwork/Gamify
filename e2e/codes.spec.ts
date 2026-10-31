import { test, expect } from '@playwright/test';

test('join page reads aloud; classes have no join code of their own', async ({ page }) => {
  await page.addInitScript(() => {
    if (localStorage.getItem('gamify:seeded-codes')) return;
    localStorage.setItem('gamify:seeded-codes', '1');
    localStorage.setItem('gamify:classrooms', JSON.stringify([{ id: 'k1', name: 'Room 3', ownerId: 'local-teacher', createdAt: '', joinCode: 'BCDFG' }]));
  });
  await page.goto('/teacher/classes/k1');
  // Students get in only with a game code or link (teacher, 2026-10-31).
  await expect(page.getByText(/Join code/)).toHaveCount(0);
  await page.goto('/join');
  await expect(page.getByRole('button', { name: 'Listen' })).toBeVisible();
  await page.getByLabel('Class or game code', { exact: false }).or(page.getByRole('textbox')).first().fill('bcd');
  await expect(page.getByRole('button', { name: 'Hear my code' })).toBeVisible();
});
