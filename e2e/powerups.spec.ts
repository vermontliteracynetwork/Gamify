import { test, expect } from '@playwright/test';

test('Theme Builder: a Game Show theme gets power-ups with art, a power, a motion and how often', async ({ page }, info) => {
  await page.addInitScript(() => { if (!localStorage.getItem('gamify:settings')) localStorage.setItem('gamify:settings', JSON.stringify({ tier: 'plus' })); });
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(m.text()); });
  page.on('pageerror', (e) => problems.push(e.message));
  await page.goto('/teacher/themes/game-show');
  await page.getByLabel('Theme name').fill('Silly Lanes');
  await page.getByRole('tablist', { name: 'Ways to design' }).getByRole('tab', { name: 'Power-ups' }).click();
  // Every theme starts with the Classic power-ups, one per ability.
  await expect(page.getByLabel('Name', { exact: true }).first()).toHaveValue('Double Star');
  // No custom actions (teacher, 2026-11-20): actions are fixed, and Add only
  // brings back one of the game's own power-ups after it is removed.
  await expect(page.getByRole('button', { name: 'Add a power-up' })).toHaveCount(0);
  await expect(page.getByLabel('Action')).toHaveCount(0);
  await page.getByRole('button', { name: 'Next page' }).click().catch(() => {});
  await page.getByRole('button', { name: 'Remove power-up' }).last().click();
  await page.getByRole('button', { name: 'Add a power-up' }).click();
  await page.getByLabel('Name', { exact: true }).first().fill('Lucky strike');
  const points = page.getByLabel(/^Points: /).first();
  if (await points.count()) await points.fill(await points.getAttribute('min') ?? '1');
  await page.getByLabel('Animation').first().selectOption({ label: 'Sparkles' });
  await page.getByLabel('Frequency').first().selectOption({ label: 'Rarely' });
  const png = await page.evaluate(() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d')!; x.fillStyle = '#f6a5c0'; x.fillRect(0, 0, 64, 64); return c.toDataURL('image/png').split(',')[1]; });
  await page.getByLabel('Add a picture for Lucky strike').locator('input[type=file]').setInputFiles({ name: 'strike.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
  await page.screenshot({ path: `test-results/powerups-${info.project.name}.png` });
  await page.getByRole('button', { name: 'Save theme' }).click();
  await expect(page.getByText('Saved Silly Lanes.', { exact: false })).toBeVisible();
  const saved = await page.evaluate(() => JSON.stringify(localStorage));
  expect(saved).toContain('Lucky strike');
  expect(problems).toEqual([]);
});
