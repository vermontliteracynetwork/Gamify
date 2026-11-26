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

  // Gamify's designed themes and a theme the teacher designs can be offered.
  await page.goto('/teacher/classes/c1');
  await page.getByRole('tab', { name: 'Assigned sets' }).click();
  await page.getByRole('searchbox', { name: 'Search titles and tags' }).fill('Animals');
  await page.getByRole('radio', { name: /^Animals and habitats/ }).click();
  // Gamify's own designed themes (Animal Friends, 2026-10-31) are offered too.
  await expect(page.getByText('Animal Friends', { exact: false }).first()).toBeVisible();
  await page.goto('/teacher/themes/game-show');
  await page.getByLabel('Theme name').fill('Room 7 Look');
  await page.getByRole('button', { name: 'Save theme' }).click();
  await expect(page.getByText('Saved Room 7 Look.', { exact: false })).toBeVisible();
  await page.goto('/teacher/classes/c1');
  await page.getByRole('tab', { name: 'Assigned sets' }).click();
  await page.getByRole('searchbox', { name: 'Search titles and tags' }).fill('Animals');
  await page.getByRole('radio', { name: /^Animals and habitats/ }).click();
  await page.getByRole('checkbox', { name: /Room 7 Look/ }).click();
  await expect(page.getByText('1 of 10 themes picked.')).toBeVisible();
  await page.getByRole('button', { name: 'Assign', exact: true }).click();

  // Ava sees Classic plus the theme her teacher offered.
  await page.evaluate(() => { localStorage.removeItem('gamify:teacher-session'); sessionStorage.setItem('gamify:arcade-session', JSON.stringify({ classroomId: 'c1', studentId: 's1', name: 'Ava', gameId: 'game-show' })); });
  await page.goto('/games/game-show');
  await page.getByRole('button', { name: 'Set up and play' }).click();
  const radios = page.getByRole('radiogroup', { name: /theme/i }).getByRole('radio');
  await expect(radios).toHaveCount(2);
  await expect(page.getByRole('radio', { name: /Room 7 Look/ })).toBeVisible();
  await page.screenshot({ path: `test-results/theme-choices-student-${info.project.name}.png` });
});

test('share a class theme in the gallery: owner approves, and it shows on the Themes page', async ({ page }, info) => {
  await page.goto('/teacher/themes/game-show');
  await page.getByLabel('Theme name').fill('Rainbow Room');
  await page.getByRole('button', { name: 'Save theme' }).click();
  await expect(page.getByText('Saved Rainbow Room.', { exact: false })).toBeVisible();
  await page.getByRole('tab', { name: 'Share' }).click();
  // Tags come first (owner, 2026-11-26), then sharing enters the challenge by default.
  await expect(page.getByRole('radio', { name: 'Share in the public gallery' })).toBeDisabled();
  await page.getByPlaceholder('Search tags').fill('pizza');
  await page.getByRole('button', { name: 'Pizza Day', exact: true }).click();
  await page.getByRole('radio', { name: 'Share in the public gallery' }).click();
  await expect(page.getByText('Sent to the gallery.', { exact: false })).toBeVisible();
  await expect(page.getByLabel('Enter it in the Theme Building Challenge')).toBeChecked();
  await expect(page.getByText('Pick a special day so your theme is entered.')).toBeVisible();
  await page.getByLabel('Which special day are you entering?').selectOption('pizza-day');
  await page.screenshot({ path: `test-results/builder-share-${info.project.name}.png` });
  expect(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight - (document.getElementById('teacher-footer')?.getBoundingClientRect().height ?? 0))).toBeLessThanOrEqual(1);

  await page.goto('/owner');
  await page.locator('input[autocomplete="one-time-code"]').last().fill('2468');
  await expect(page.getByText('Type the same PIN again', { exact: false })).toBeVisible();
  await page.locator('input[autocomplete="one-time-code"]').last().fill('2468');
  await page.getByRole('navigation', { name: 'Dashboard sections' }).getByRole('button', { name: 'Gallery review' }).click();
  await page.getByLabel('Theme Building Challenge: special day').selectOption('pizza-day');
  await expect(page.getByText(/Rainbow Room · Test Teacher · Pizza Day/)).toBeVisible();
  await page.getByRole('button', { name: 'Approve' }).click();
  await expect(page.getByText('No themes waiting for review.')).toBeVisible();

  await page.goto('/themes');
  await expect(page.getByRole('heading', { name: 'Rainbow Room' })).toBeVisible();
  await expect(page.getByText('Made by Test Teacher')).toBeVisible();
  await page.getByPlaceholder('Search by name or tag').fill('pizza');
  await expect(page.getByRole('heading', { name: 'Rainbow Room' })).toBeVisible();

  // The ongoing public vote: the Feb tab lists the entry; pick it and vote once a day.
  await page.clock.setFixedTime(new Date('2027-01-10T15:00:00Z'));
  await page.goto('/challenge');
  await page.getByRole('tab', { name: 'Feb' }).click();
  const entry = page.getByRole('tabpanel').getByRole('listitem').filter({ has: page.getByRole('heading', { name: 'Rainbow Room' }) });
  await entry.getByRole('button', { name: 'Pick' }).click();
  await page.getByRole('button', { name: 'Vote', exact: true }).click();
  await expect(page.getByText('Thanks for voting! Come back tomorrow to vote again.')).toBeVisible();
  await expect(entry.getByText('1 vote', { exact: true })).toBeVisible();
  await page.screenshot({ path: `test-results/challenge-vote-${info.project.name}.png`, fullPage: true });
});
