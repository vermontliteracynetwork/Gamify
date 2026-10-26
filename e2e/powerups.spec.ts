import { test, expect } from '@playwright/test';

test('Theme Builder: a Cast and Catch theme gets power-up catches with art, a power, a motion and how often', async ({ page }, info) => {
  await page.addInitScript(() => { if (!localStorage.getItem('gamify:settings')) localStorage.setItem('gamify:settings', JSON.stringify({ tier: 'plus' })); });
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(m.text()); });
  page.on('pageerror', (e) => problems.push(e.message));
  await page.goto('/teacher/themes/cast-catch');
  await page.getByLabel('Theme name').fill('Silly Lake');
  await page.getByRole('tab', { name: 'Power-ups' }).click();
  // Every theme starts with the Classic power-ups, one per ability.
  await expect(page.getByLabel('Name', { exact: true }).first()).toHaveValue('Rainbow Fish');
  await page.getByRole('button', { name: 'Add a power-up' }).click();
  // A new power-up must be named before the theme saves.
  await expect(page.getByText('Give every power-up its own name.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save theme' })).toBeDisabled();
  await page.getByLabel('Name', { exact: true }).first().fill('Rainbow fish'.replace('fish', 'trout'));
  await page.getByLabel('What it does').first().selectOption({ label: 'Gives points' });
  await page.getByLabel(/^Points: /).first().fill('1000');
  await page.getByLabel('How it moves').first().selectOption({ label: 'Sparkles' });
  await page.getByLabel('How often').first().selectOption({ label: 'Rarely' });
  const png = await page.evaluate(() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d')!; x.fillStyle = '#f6a5c0'; x.fillRect(0, 0, 64, 64); return c.toDataURL('image/png').split(',')[1]; });
  await page.getByLabel('Add a picture for Rainbow trout').locator('input[type=file]').setInputFiles({ name: 'fish.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
  await expect(page.getByText('Classic example: Rainbow Fish').first()).toBeVisible();
  await page.screenshot({ path: `test-results/powerups-${info.project.name}.png` });
  await page.getByRole('button', { name: 'Save theme' }).click();
  await expect(page.getByText('Saved Silly Lake.', { exact: false })).toBeVisible();
  const saved = await page.evaluate(() => JSON.stringify(localStorage));
  expect(saved).toContain('Rainbow trout');
  expect(saved).toContain('Message in a Bottle');
  expect(saved).toMatch(/amount\W+1000/);
  expect(problems).toEqual([]);
});
