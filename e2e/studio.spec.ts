import { test, expect } from '@playwright/test';

// The drawing studio in the Theme Builder: brush, fill bucket, a searched
// sticker, then the drawing becomes the piece's picture.
test('Theme Builder studio: draw, fill, sticker search, use the picture', async ({ page }, info) => {
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()); });
  page.on('pageerror', (e) => problems.push(e.message));
  await page.goto('/teacher/themes/game-show');
  await page.getByRole('button', { name: 'Fold the get started steps into the menu' }).click();
  await page.getByRole('tab', { name: 'Upload' }).click();
  await page.getByLabel('Find a piece').fill('trophy');
  await page.getByRole('button', { name: /^Draw the Winner trophy/ }).click();
  const studio = page.getByRole('dialog', { name: 'Draw: Winner trophy' });
  await expect(studio).toBeVisible();
  const canvas = studio.getByLabel(/^Drawing of the Winner trophy/);
  const box = (await canvas.boundingBox())!;
  const at = (fx: number, fy: number) => [box.x + box.width * fx, box.y + box.height * fy] as const;

  // A crayon circle, then fill inside it.
  await studio.getByRole('radio', { name: 'Crayon' }).click();
  await page.mouse.move(...at(0.5, 0.2));
  await page.mouse.down();
  for (let i = 0; i <= 36; i++) { const a = (i / 36) * Math.PI * 2; await page.mouse.move(...at(0.5 + Math.sin(a) * 0.3, 0.5 - Math.cos(a) * 0.3)); }
  await page.mouse.up();
  await studio.getByRole('button', { name: '#fdd835' }).click();
  await studio.getByRole('radio', { name: 'Fill' }).click();
  await page.mouse.click(...at(0.5, 0.5));
  // A sticker found by search.
  await studio.getByRole('button', { name: '#000000' }).click();
  await studio.getByRole('radio', { name: 'Stickers' }).click();
  await studio.getByLabel('Search stickers').fill('crown');
  await studio.getByRole('button', { name: 'crown', exact: true }).click();
  await page.mouse.click(...at(0.5, 0.45));
  await page.screenshot({ path: `test-results/studio-${info.project.name}.png` });
  expect(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)).toBeLessThanOrEqual(1);
  // Undo and redo the sticker.
  await studio.getByRole('button', { name: 'Undo' }).click();
  await studio.getByRole('button', { name: 'Redo' }).click();
  await studio.getByRole('button', { name: 'Use this picture' }).click();
  await expect(studio).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Add a picture for Winner trophy' }).locator('img')).toHaveCount(1);
  expect(problems).toEqual([]);
});
