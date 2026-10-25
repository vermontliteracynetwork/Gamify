import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (localStorage.getItem('gamify:seeded-themes')) return;
    localStorage.setItem('gamify:seeded-themes', '1');
    localStorage.setItem('gamify:settings', JSON.stringify({ tier: 'pro' }));
    localStorage.setItem('gamify:classrooms', JSON.stringify([{ id: 'c1', name: 'Room 7', ownerId: 'local-teacher', createdAt: '' }]));
    localStorage.setItem('gamify:students', JSON.stringify([{ id: 's1', classroomId: 'c1', name: 'Ava', picturePassword: ['cat', 'sun'] }]));
  });
});

test('Themes page: sort, filter and favorite; favorites come first when assigning', async ({ page }, info) => {
  await page.goto('/themes');
  await page.getByRole('combobox', { name: /^Game/ }).selectOption({ label: 'Match Three' });
  await expect(page.getByRole('heading', { name: 'Candy Shop' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Ocean Friends' })).toHaveCount(0);
  await page.getByRole('combobox', { name: /^Game/ }).selectOption({ label: 'All games' });
  await page.getByRole('button', { name: 'Add Night Arcade to my favorites' }).click();
  await page.getByRole('button', { name: /My favorites/ }).click();
  await expect(page.getByRole('heading', { level: 2 })).toHaveCount(1);
  await page.screenshot({ path: `test-results/themes-favs-${info.project.name}.png` });

  await page.goto('/teacher/classes/c1');
  await page.getByRole('tab', { name: 'Assigned sets' }).click();
  await page.getByRole('radio', { name: /^Animals and habitats/ }).click();
  const first = page.getByRole('group', { name: /Themes students can pick/ }).getByRole('checkbox').first();
  await expect(first).toContainText('Night Arcade');
  await first.click();
  await page.getByRole('checkbox', { name: /Ocean Friends/ }).click();
  await expect(page.getByText('2 of 10 themes picked.')).toBeVisible();
  await page.getByRole('button', { name: 'Assign', exact: true }).click();
  await expect(page.getByText('2 themes', { exact: false })).toBeVisible();

  // Ava sees Classic plus the two themes her teacher offered.
  await page.evaluate(() => { localStorage.removeItem('gamify:teacher-session'); sessionStorage.setItem('gamify:arcade-session', JSON.stringify({ classroomId: 'c1', studentId: 's1', name: 'Ava' })); });
  await page.goto('/games/game-show');
  await page.getByRole('button', { name: 'Set up and play' }).click();
  const radios = page.getByRole('radiogroup', { name: /theme/i }).getByRole('radio');
  await expect(radios).toHaveCount(3);
  await expect(page.getByRole('radio', { name: 'Ocean Friends' })).toBeVisible();
  await expect(page.getByRole('radio', { name: 'Night Arcade' })).toBeVisible();
  await page.screenshot({ path: `test-results/theme-choices-student-${info.project.name}.png` });
});
