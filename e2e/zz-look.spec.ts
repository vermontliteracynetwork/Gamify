import { test } from '@playwright/test';
const D = '/tmp/claude-0/-home-user/5177f4cc-aba3-5a68-9935-b500799ece3e/scratchpad';
test('look', async ({ page }, info) => {
  test.setTimeout(120_000);
  const n = info.project.name;
  await page.addInitScript(() => { if (!localStorage.getItem('gamify:settings')) localStorage.setItem('gamify:settings', JSON.stringify({ tier: 'pro' })); });
  await page.goto('/teacher/themes/game-show');
  await page.getByRole('button', { name: 'Fold the get started steps into the menu' }).click().catch(() => {});
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${D}/l-builder-${n}.png` });
  await page.getByRole('tab', { name: 'Power-ups' }).click();
  await page.screenshot({ path: `${D}/l-powers-${n}.png` });
  await page.getByRole('tab', { name: 'Download' }).click();
  await page.screenshot({ path: `${D}/l-download-${n}.png` });
  await page.getByRole('tab', { name: 'Upload' }).click();
  await page.getByLabel('Find a piece').fill('cover');
  await page.getByRole('button', { name: /^Draw the Cover/ }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${D}/l-studio-${n}.png` });
  await page.goto('/play');
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${D}/l-play-${n}.png` });
  await page.evaluate(() => localStorage.removeItem('gamify:teacher-session'));
  await page.goto('/join');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${D}/l-join-${n}.png` });
});
test.describe('home', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test('home ways', async ({ page }, info) => {
    await page.goto('/');
    await page.getByRole('heading', { name: /Four Ways to Play/i }).scrollIntoViewIfNeeded();
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${D}/l-home-${info.project.name}.png` });
  });
});
