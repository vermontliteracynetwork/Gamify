import { test, expect } from '@playwright/test';

test('Free plan: a Plus game opened by its address shows a lock, never the game', async ({ page }, info) => {
  await page.goto('/games/memory-match');
  await expect(page.getByText('Memory Match is ready for you on Plus and Pro', { exact: false })).toBeVisible();
  await expect(page.getByRole('link', { name: 'See the plans' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Set up and play' })).toHaveCount(0);
  await page.screenshot({ path: `test-results/gate-teacher-${info.project.name}.png` });
  // A student sees only the lock and "ask your teacher": no plans or prices.
  await page.addInitScript(() => {
    localStorage.removeItem('gamify:teacher-session');
    if (!localStorage.getItem('gamify:classrooms')) localStorage.setItem('gamify:classrooms', JSON.stringify([{ id: 'c1', name: 'Room 7', ownerId: 'local-teacher', createdAt: '' }]));
    sessionStorage.setItem('gamify:arcade-session', JSON.stringify({ classroomId: 'c1', studentId: 's1', name: 'Ava' }));
  });
  await page.goto('/games/memory-match');
  await expect(page.getByText('This game is locked. Ask your teacher!')).toBeVisible();
  await expect(page.getByText(/plan|price|\$/i)).toHaveCount(0);
});
