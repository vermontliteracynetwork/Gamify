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

test('Upgrade is one tap from a limit: a locked game opens right after choosing Plus', async ({ page }, info) => {
  await page.goto('/games/memory-match');
  await page.getByRole('button', { name: 'Upgrade' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `test-results/upgrade-dialog-${info.project.name}.png` });
  await dialog.getByRole('button', { name: /Plus now/ }).click();
  await dialog.getByRole('button', { name: 'Keep going' }).click();
  await expect(page.getByRole('button', { name: 'Set up and play' })).toBeVisible();
});

test('Upgrade from the Question sets limit lifts the cap', async ({ page }) => {
  await page.addInitScript(() => {
    if (localStorage.getItem('gamify:sets-seeded')) return;
    localStorage.setItem('gamify:sets-seeded', '1');
    const sets = Array.from({ length: 3 }, (_, i) => ({ id: `s${i}`, name: `Set ${i}`, questions: [], ownerId: 'local-teacher', visibility: 'private', createdAt: '', updatedAt: '' }));
    localStorage.setItem('gamify:sets', JSON.stringify(sets));
  });
  await page.goto('/teacher/sets');
  const note = page.getByText(/You have made \d+ sets!/);
  await expect(note).toBeVisible();
  await page.getByRole('button', { name: 'Upgrade' }).first().click();
  await page.getByRole('dialog').getByRole('button', { name: /Plus now/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Keep going' }).click();
  await expect(note).toHaveCount(0);
});
