import { test, expect } from '@playwright/test';

test('student design mode: a student sends a theme, the teacher approves it, it is playable and credited to the class', async ({ page }, info) => {
  test.setTimeout(90_000);
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(m.text()); });
  page.on('pageerror', (e) => problems.push(e.message));
  await page.addInitScript(() => {
    if (localStorage.getItem('gamify:classrooms')) return;
    localStorage.setItem('gamify:classrooms', JSON.stringify([{ id: 'c1', name: 'Room 7', ownerId: 'local-teacher', createdAt: '', joinCode: 'BCDFG' }]));
    localStorage.setItem('gamify:students', JSON.stringify([{ id: 's1', classroomId: 'c1', name: 'Ava', picturePassword: ['cat', 'dog'] }]));
    localStorage.setItem('gamify:settings', JSON.stringify({ tier: 'pro' }));
  });
  // Teacher opens the class for designing.
  await page.goto('/teacher/classes/c1');
  await page.getByRole('tab', { name: 'Play modes' }).click();
  await page.getByRole('switch').last().click();
  await expect(page.getByRole('switch').last()).toHaveAttribute('aria-checked', 'true');

  // A student, signed in on this device, designs a Match Three theme.
  await page.evaluate(() => sessionStorage.setItem('gamify:arcade-session', JSON.stringify({ classroomId: 'c1', studentId: 's1', name: 'Ava' })));
  await page.goto('/arcade');
  await page.getByRole('link', { name: /Design a Theme/ }).click();
  await page.getByRole('button', { name: /Match Three/ }).click();
  const shot = await page.evaluate(() => { const c = document.createElement('canvas'); c.width = 200; c.height = 200; const x = c.getContext('2d')!; x.fillStyle = '#f6a5c0'; x.fillRect(0, 0, 200, 200); return c.toDataURL('image/png').split(',')[1]; });
  await page.getByLabel('Add a picture').setInputFiles({ name: 'drawing.png', mimeType: 'image/png', buffer: Buffer.from(shot, 'base64') });
  await page.screenshot({ path: `test-results/design-piece-${info.project.name}.png` });
  // The next piece, drawn right here in the studio.
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: 'Draw it' }).click();
  const studio = page.getByRole('dialog', { name: /^Draw: / });
  await expect(studio.getByRole('radio', { name: 'Words' })).toHaveCount(0);
  await studio.getByRole('radio', { name: 'Fill' }).click();
  await studio.getByRole('button', { name: '#43a047' }).click();
  const box = (await studio.getByLabel(/^Drawing of the /).boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.screenshot({ path: `test-results/design-studio-${info.project.name}.png` });
  await studio.getByRole('button', { name: 'Use this picture' }).click();
  await expect(page.getByText('Done! Draw again or go on.')).toBeVisible();
  while (await page.getByText(/^Picture \d+ of \d+$/).isVisible()) await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('radio', { name: '#ddfcc6' }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByLabel('Name your theme').fill('Pink Party');
  await page.getByRole('button', { name: 'Send to my teacher' }).click();
  await expect(page.getByText('Sent! Your teacher will take a look.')).toBeVisible();

  // The teacher approves it in the Theme Builder.
  await page.evaluate(() => sessionStorage.removeItem('gamify:arcade-session'));
  await page.goto('/teacher/themes');
  await expect(page.getByRole('heading', { name: /Student designs waiting/i })).toBeVisible();
  await page.screenshot({ path: `test-results/design-requests-${info.project.name}.png`, fullPage: true });
  await page.getByRole('button', { name: 'Approve' }).click();
  await expect(page.getByText('Approved Pink Party.', { exact: false })).toBeVisible();

  await page.goto('/games/match-three');
  await page.getByRole('button', { name: 'Set up and play' }).click();
  await expect(page.getByRole('radio', { name: /Pink Party/ })).toBeVisible();
  await expect(page.getByText('Made by Test Teacher')).toBeVisible();
  expect(problems).toEqual([]);
});
