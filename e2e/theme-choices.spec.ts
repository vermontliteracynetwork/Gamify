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

  // Games wear only Classic for now; a theme the teacher designs can be offered.
  await page.goto('/teacher/classes/c1');
  await page.getByRole('tab', { name: 'Assigned sets' }).click();
  await page.getByRole('radio', { name: /^Animals and habitats/ }).click();
  await expect(page.getByText('Every game plays Classic for now.', { exact: false })).toBeVisible();
  await page.goto('/teacher/themes/game-show');
  await page.getByRole('button', { name: 'Fold the get started steps into the menu' }).click();
  await page.getByLabel('Theme name').fill('Room 7 Look');
  await page.getByRole('button', { name: 'Save theme' }).click();
  await expect(page.getByText('Saved Room 7 Look.', { exact: false })).toBeVisible();
  await page.goto('/teacher/classes/c1');
  await page.getByRole('tab', { name: 'Assigned sets' }).click();
  await page.getByRole('radio', { name: /^Animals and habitats/ }).click();
  await page.getByRole('checkbox', { name: /Room 7 Look/ }).click();
  await expect(page.getByText('1 of 10 themes picked.')).toBeVisible();
  await page.getByRole('button', { name: 'Assign', exact: true }).click();

  // Ava sees Classic plus the theme her teacher offered.
  await page.evaluate(() => { localStorage.removeItem('gamify:teacher-session'); sessionStorage.setItem('gamify:arcade-session', JSON.stringify({ classroomId: 'c1', studentId: 's1', name: 'Ava' })); });
  await page.goto('/games/game-show');
  await page.getByRole('button', { name: 'Set up and play' }).click();
  const radios = page.getByRole('radiogroup', { name: /theme/i }).getByRole('radio');
  await expect(radios).toHaveCount(2);
  await expect(page.getByRole('radio', { name: /Room 7 Look/ })).toBeVisible();
  await page.screenshot({ path: `test-results/theme-choices-student-${info.project.name}.png` });
});

test('share a class theme in the gallery: owner approves, and it shows on the Themes page', async ({ page }, info) => {
  await page.goto('/teacher/themes/game-show');
  await page.getByRole('button', { name: 'Fold the get started steps into the menu' }).click();
  await page.getByLabel('Theme name').fill('Rainbow Room');
  await page.getByLabel('Student first name or nickname (optional)').fill('Ava');
  await page.getByRole('button', { name: 'Save theme' }).click();
  await expect(page.getByText('Saved Rainbow Room.', { exact: false })).toBeVisible();
  await page.getByRole('tab', { name: 'Share' }).click();
  await page.getByRole('radio', { name: 'Share in the public gallery' }).click();
  await expect(page.getByText('Sent to the gallery.', { exact: false })).toBeVisible();
  await expect(page.getByLabel('Enter it in the Theme Building Challenge')).toBeDisabled();
  await page.screenshot({ path: `test-results/builder-share-${info.project.name}.png` });
  expect(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight - (document.getElementById('teacher-footer')?.getBoundingClientRect().height ?? 0))).toBeLessThanOrEqual(1);

  await page.goto('/owner');
  for (const d of '2468') await page.getByRole('button', { name: d, exact: true }).click();
  await expect(page.getByText('Type the same PIN again', { exact: false })).toBeVisible();
  for (const d of '2468') await page.getByRole('button', { name: d, exact: true }).click();
  await page.getByRole('button', { name: 'Approve' }).click();
  await expect(page.getByText('No themes waiting for review.')).toBeVisible();

  await page.goto('/themes');
  await expect(page.getByRole('heading', { name: 'Rainbow Room' })).toBeVisible();
  await expect(page.getByText('Made by Test Teacher, designed by Ava')).toBeVisible();
});
