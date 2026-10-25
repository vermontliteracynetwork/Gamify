import { test, expect } from '@playwright/test';

test('join page reads aloud, and teachers can share a class or game link to the class stream', async ({ page }) => {
  await page.addInitScript(() => {
    if (localStorage.getItem('gamify:seeded-codes')) return;
    localStorage.setItem('gamify:seeded-codes', '1');
    localStorage.setItem('gamify:classrooms', JSON.stringify([{ id: 'k1', name: 'Room 3', ownerId: 'local-teacher', createdAt: '', joinCode: 'BCDFG' }]));
  });
  await page.goto('/teacher/classes/k1');
  const share = page.getByRole('link', { name: 'Share to Google Classroom' });
  await expect(share).toHaveAttribute('href', /classroom\.google\.com\/share\?url=.*join%2FBCDFG/);
  await page.goto('/join');
  await expect(page.getByRole('button', { name: 'Listen' })).toBeVisible();
  await page.getByLabel('Class or game code', { exact: false }).or(page.getByRole('textbox')).first().fill('bcd');
  await expect(page.getByRole('button', { name: 'Hear my code' })).toBeVisible();
});
