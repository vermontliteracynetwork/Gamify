import { test, expect } from '@playwright/test';
import { finishSetup, openSetup } from './setup';

// A 64 px colored square as a PNG data URL, made in the page.
const square = (color: string) => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="${color}"/></svg>`)}`;

test.beforeEach(async ({ page }) => {
  await page.addInitScript(([cat, dog, sky]) => {
    if (localStorage.getItem('gamify:sets')) return;
    const qs = Array.from({ length: 3 }, (_, i) => ({ id: `p${i}`, kind: 'mc', prompt: `Which one is the cat? (${i + 1})`, choices: ['cat', 'dog'], correctIndex: 0,
      imageUrl: sky, imageAlt: 'A blue sky', choiceImages: [cat, dog], choiceAlts: ['an orange cat', null] }));
    localStorage.setItem('gamify:sets', JSON.stringify([{ id: 'pic1', name: 'Picture pets', questions: qs, ownerId: 'local-teacher', visibility: 'private', createdAt: '', updatedAt: '',
      subject: 'Science', grades: ['K', '1'], tags: ['animals'], noStandard: true }]));
  }, [square('#f39a6b'), square('#8a6b4f'), square('#6aa9e9')]);
});

test('editor: question picture above the question, answer pictures beside the letter, double-click to describe', async ({ page }, info) => {
  await page.goto('/teacher/sets/pic1');
  const sky = page.getByRole('img', { name: 'A blue sky' }).first();
  await expect(sky).toBeVisible();
  const prompt = page.getByLabel('Question 1', { exact: true });
  expect((await sky.boundingBox())!.y).toBeLessThan((await prompt.boundingBox())!.y);
  await sky.dblclick();
  await page.getByLabel('Describe the picture').fill('A clear blue sky');
  await page.keyboard.press('Enter');
  await expect(page.getByText('A clear blue sky').first()).toBeVisible();
  // Answer B gets a description the same way.
  await page.locator('figure img').nth(2).dblclick();
  await page.getByLabel('Describe the picture').fill('a brown dog');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('img', { name: 'a brown dog' }).first()).toBeVisible();
  // Remove and add an answer picture.
  await page.getByRole('button', { name: 'Remove the picture from answer B' }).first().click();
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Add a picture to answer B' }).first().click();
  await (await chooser).setFiles({ name: 'dog.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64') });
  await expect(page.getByRole('button', { name: 'Remove the picture from answer B' }).first()).toBeVisible();
  await page.screenshot({ path: `test-results/pictures-editor-${info.project.name}.png` });
});

test('play: the question picture sits above the question and answer pictures beside each letter, no scrolling', async ({ page }, info) => {
  await openSetup(page, '/games/star-quiz');
  await page.getByRole('radio', { name: /^Picture pets/ }).click();
  await finishSetup(page);
  const dialog = page.getByRole('dialog');
  const sky = dialog.getByRole('img', { name: 'A blue sky' });
  await expect(sky).toBeVisible();
  expect((await sky.boundingBox())!.y).toBeLessThan((await dialog.getByRole('heading', { level: 2 }).boundingBox())!.y);
  // The cat's picture stays with the word cat, wherever it lands.
  await expect(dialog.getByRole('button', { name: /cat$/ }).getByRole('img', { name: 'an orange cat' })).toBeVisible();
  await expect(dialog.getByText('Read the question')).toBeHidden({ timeout: 8000 });
  await page.screenshot({ path: `test-results/pictures-play-${info.project.name}.png` });
  expect(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)).toBeLessThanOrEqual(1);
});
