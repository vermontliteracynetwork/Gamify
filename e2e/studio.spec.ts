import { test, expect } from '@playwright/test';

// The drawing studio in the Theme Builder: brush, fill bucket, a searched
// sticker, then the drawing becomes the piece's picture.
test('Theme Builder studio: draw, fill, sticker search, use the picture', async ({ page }, info) => {
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()); });
  page.on('pageerror', (e) => problems.push(e.message));
  await page.goto('/teacher/themes/game-show');
  await page.getByRole('tab', { name: 'Upload' }).click();
  await page.getByLabel('Find a piece').fill('cover');
  await page.getByRole('button', { name: /^Draw the Cover/ }).click();
  const studio = page.getByRole('dialog', { name: 'Draw: Cover' });
  await expect(studio).toBeVisible();
  const canvas = studio.getByLabel(/^Drawing of the Cover/);
  const box = (await canvas.boundingBox())!;
  const at = (fx: number, fy: number) => [box.x + box.width * fx, box.y + box.height * fy] as const;

  // A crayon circle, then fill inside it.
  await studio.getByRole('radio', { name: 'Crayon' }).click();
  await page.mouse.move(...at(0.5, 0.2));
  await page.mouse.down();
  for (let i = 0; i <= 36; i++) { const a = (i / 36) * Math.PI * 2; await page.mouse.move(...at(0.5 + Math.sin(a) * 0.3, 0.5 - Math.cos(a) * 0.3)); }
  await page.mouse.up();
  await studio.getByRole('button', { name: '#fdd835', exact: true }).click();
  await studio.getByRole('radio', { name: 'Fill' }).click();
  await page.mouse.click(...at(0.5, 0.5));
  // A sticker found by search.
  await studio.getByRole('button', { name: '#000000', exact: true }).click();
  await studio.getByRole('radio', { name: 'Stickers' }).click();
  await studio.getByLabel('Search stickers').fill('crown');
  await studio.getByRole('button', { name: 'crown', exact: true }).click();
  await page.mouse.click(...at(0.5, 0.45));
  // The sticker is a piece: chosen, with handles; drag it, then add words.
  const crown = studio.getByRole('button', { name: 'Move crown' });
  await expect(crown).toHaveAttribute('aria-pressed', 'true');
  const c0 = (await crown.boundingBox())!;
  await page.mouse.move(c0.x + c0.width / 2, c0.y + c0.height / 2);
  await page.mouse.down();
  await page.mouse.move(c0.x + c0.width / 2 + 40, c0.y + c0.height / 2 - 30, { steps: 5 });
  await page.mouse.up();
  const c1 = (await crown.boundingBox())!;
  expect(c1.x).toBeGreaterThan(c0.x + 20);
  // Dragged near the middle, it snaps to the exact center.
  const cv = (await studio.getByLabel(/^Drawing of the Cover/).boundingBox())!;
  await page.mouse.move(c1.x + c1.width / 2, c1.y + c1.height / 2);
  await page.mouse.down();
  await page.mouse.move(cv.x + cv.width / 2 + 3, cv.y + cv.height / 2 - 4, { steps: 6 });
  await page.mouse.up();
  const c2 = (await crown.boundingBox())!;
  expect(Math.abs(c2.x + c2.width / 2 - (cv.x + cv.width / 2))).toBeLessThan(2);
  await studio.getByRole('radio', { name: 'Words' }).click();
  await page.mouse.click(...at(0.5, 0.8));
  await studio.getByLabel('Words', { exact: true }).fill('Champs');
  await expect(studio.getByRole('button', { name: 'Move Champs' })).toBeVisible();
  await studio.getByLabel('Search stickers').fill('');
  await studio.getByRole('radio', { name: 'Animals' }).click();
  await expect(studio.getByRole('button', { name: 'cat', exact: true })).toBeVisible();
  await expect(studio.getByRole('button', { name: 'pizza', exact: true })).toHaveCount(0);
  await page.screenshot({ path: `test-results/studio-${info.project.name}.png` });
  expect(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight - (document.getElementById('teacher-footer')?.getBoundingClientRect().height ?? 0))).toBeLessThanOrEqual(1);
  // Undo and redo the sticker.
  await studio.getByRole('button', { name: 'Undo' }).click();
  await studio.getByRole('button', { name: 'Redo' }).click();
  await studio.getByRole('button', { name: 'Use this picture' }).click();
  await expect(studio).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Add a picture for Cover' }).locator('img')).toHaveCount(1);
  expect(problems).toEqual([]);
});

// Share screens wear a Big screen design: draw its lobby picture, save, and
// the live lobby shows it with a picker for the look.
test('Big screen design: lobby picture shows in the live lobby; teacher pages have a footer', async ({ page }, info) => {
  await page.addInitScript(() => { if (!localStorage.getItem('gamify:settings')) localStorage.setItem('gamify:settings', JSON.stringify({ tier: 'pro' })); });
  // Teacher pages have a footer; the full-screen Theme Builder has none (teacher, 2026-10-31).
  await page.goto('/teacher/sets');
  await expect(page.getByRole('contentinfo')).toContainText('Help Center');
  await page.goto('/teacher/themes/big-screen');
  await page.getByLabel('Theme name').fill('Party');
  await page.getByRole('tab', { name: 'Upload' }).click();
  await page.getByRole('button', { name: /^Draw the Lobby picture/ }).click();
  const studio = page.getByRole('dialog');
  await studio.getByRole('radio', { name: 'Stickers' }).click();
  await studio.getByLabel('Search stickers').fill('balloon');
  await studio.getByRole('button', { name: 'balloon', exact: true }).click();
  const box = (await studio.getByLabel(/^Drawing of the Lobby picture/).boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await studio.getByRole('button', { name: 'Use this picture' }).click();
  await page.getByRole('button', { name: 'Save theme' }).click();
  await expect(page.getByText('Saved Party.', { exact: false })).toBeVisible();

  await page.goto('/teacher/sets');
  await page.getByRole('tab', { name: 'Ready-made sets' }).click();
  await page.getByRole('button', { name: 'Play or share' }).first().click();
  await page.getByRole('radio', { name: /Cast and Catch/ }).click();
  await page.getByRole('button', { name: 'Host a live game' }).click();
  await page.getByLabel('Big screen look').selectOption({ label: 'Party' });
  await expect(page.locator('main img[src^="data:image"]').first()).toBeVisible();
  await expect(page.getByRole('contentinfo')).toHaveCount(0);
  await page.screenshot({ path: `test-results/bigscreen-lobby-${info.project.name}.png` });
});

test('studio: drag a sticker from the shelf onto the picture', async ({ page }, info) => {
  test.skip(info.project.name !== 'laptop', 'mouse drag; iPads tap to place');
  await page.goto('/teacher/themes/game-show');
  await page.getByRole('tab', { name: 'Upload' }).click();
  await page.getByLabel('Find a piece').fill('cover');
  await page.getByRole('button', { name: /^Draw the Cover/ }).click();
  const studio = page.getByRole('dialog', { name: 'Draw: Cover' });
  await studio.getByRole('radio', { name: 'Stickers' }).click();
  await studio.getByRole('button', { name: 'rocket', exact: true }).dragTo(studio.getByLabel(/^Drawing of the Cover/));
  await expect(studio.getByRole('button', { name: 'Move rocket' })).toBeVisible();
});

test('studio: flip a piece, and a warning for words that are hard to read', async ({ page }) => {
  await page.goto('/teacher/themes/game-show');
  await page.getByRole('tab', { name: 'Upload' }).click();
  await page.getByLabel('Find a piece').fill('cover');
  await page.getByRole('button', { name: /^Draw the Cover/ }).click();
  const studio = page.getByRole('dialog', { name: 'Draw: Cover' });
  const box = (await studio.getByLabel(/^Drawing of the Cover/).boundingBox())!;
  // Fill the whole picture yellow, then yellow words on it.
  await studio.getByRole('button', { name: '#fdd835', exact: true }).click();
  await studio.getByRole('radio', { name: 'Fill' }).click();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await studio.getByRole('radio', { name: 'Words' }).click();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await studio.getByRole('button', { name: 'Flip' }).click();
  expect(await studio.getByRole('button', { name: 'Move Hello!' }).getAttribute('style')).toContain('scaleX(-1)');
  await studio.getByRole('button', { name: 'Use this picture' }).click();
  await expect(studio.getByRole('alert')).toContainText('hard to read');
  await studio.getByRole('button', { name: '#000000', exact: true }).click();
  await studio.getByRole('button', { name: 'Use this picture' }).click();
  await expect(studio).toHaveCount(0);
});

// Two colors (teacher, 2026-10-31): the main color fills a shape, the second
// color is its outline; outlines change width or go away; a made color joins
// the list after the rainbow button.
test('studio: two colors, shape outlines, and a made color joins the list', async ({ page }, info) => {
  await page.goto('/teacher/themes/game-show');
  await page.getByRole('tab', { name: 'Upload' }).click();
  await page.getByLabel('Find a piece').fill('cover');
  await page.getByRole('button', { name: /^Draw the Cover/ }).click();
  const studio = page.getByRole('dialog', { name: 'Draw: Cover' });
  const box = (await studio.getByLabel(/^Drawing of the Cover/).boundingBox())!;
  await studio.getByRole('button', { name: '#fdd835', exact: true }).click();
  await studio.getByRole('button', { name: /^Second color/ }).click();
  await studio.getByRole('button', { name: '#e53935', exact: true }).click();
  await studio.getByRole('button', { name: /^Main color #fdd835/ }).click();
  await studio.getByRole('radio', { name: 'Shapes' }).click();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  const shape = studio.getByRole('button', { name: /^Move / }).last();
  const img = shape.locator('img');
  expect(decodeURIComponent((await img.getAttribute('src')) ?? '')).toContain('stroke="#e53935"');
  await studio.getByRole('button', { name: 'Remove the outline' }).click();
  await expect(studio.getByText('No outline')).toBeVisible();
  expect(decodeURIComponent((await img.getAttribute('src')) ?? '')).toContain('stroke="none"');
  await studio.getByRole('button', { name: 'Swap the two colors' }).click();
  await expect(studio.getByRole('button', { name: /^Main color #e53935/ })).toBeVisible();
  // A made color: the rainbow button opens the color picker; the new color joins the list.
  await studio.locator('input[type=color]').evaluate((el: HTMLInputElement) => { el.value = '#123456'; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); });
  await expect(studio.getByRole('button', { name: '#123456', exact: true })).toBeVisible();
  await expect(studio.getByRole('button', { name: 'Make a color' })).toBeVisible();
  if (info.project.name === 'laptop') await page.screenshot({ path: 'test-results/studio-colors.png' });
});
