import { test, expect, type Page } from '@playwright/test';
import { finishSetup, openSetup } from './setup';

function watch(page: Page) {
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(m.text()); });
  page.on('pageerror', (e) => problems.push(e.message));
  return problems;
}

// A small solid-color PNG made in the page (stands in for a student drawing).
async function png(page: Page, color: string): Promise<Buffer> {
  const data = await page.evaluate((c) => {
    const cv = document.createElement('canvas'); cv.width = 300; cv.height = 220;
    const x = cv.getContext('2d')!; x.fillStyle = c; x.fillRect(0, 0, 300, 220); x.fillStyle = '#222'; x.fillRect(100, 60, 100, 100);
    return cv.toDataURL('image/png').split(',')[1];
  }, color);
  return Buffer.from(data, 'base64');
}

test('Free plays Classic; starter themes show locked on the game\'s own theme screen', async ({ page }, info) => {
  await page.goto('/games/match-three');
  await page.getByRole('button', { name: 'Set up and play' }).click();
  await expect(page.getByRole('heading', { name: 'Pick a Theme' })).toBeVisible();
  await expect(page.getByRole('radiogroup', { name: 'Theme' }).getByRole('radio')).toHaveCount(2);
  await expect(page.getByRole('radio', { name: /Candy Shop/ })).toHaveAccessibleName(/locked/i);
  await expect(page.getByRole('radio', { name: 'Classic' })).toHaveAttribute('aria-checked', 'true');
  await page.screenshot({ path: `test-results/theme-screen-${info.project.name}.png` });
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByRole('heading', { name: /^Step 1 of 2:/ })).toBeVisible();
});

test('Theme Builder: upload a piece, save, and play the game in it', async ({ page }, info) => {
  test.setTimeout(90_000);
  const problems = watch(page);
  await page.goto('/teacher/themes');
  await page.screenshot({ path: `test-results/builder-games-${info.project.name}.png`, fullPage: true });
  await page.getByRole('link', { name: /Game Show/ }).click();
  await page.getByLabel('Theme name').fill('Ocean Party');
  await page.getByLabel('Student first name or nickname (optional)').fill('Ava');
  const cardBack = page.locator('input[type=file]').nth(2); // Upload tab: page photos, background, then card back
  await cardBack.setInputFiles({ name: 'card.png', mimeType: 'image/png', buffer: await png(page, '#2a9df4') });
  await expect(page.getByLabel('Added')).toHaveCount(1);
  await page.getByRole('tab', { name: 'Colors' }).click();
  await page.getByLabel('Main color hex code').fill('#7ad3f5');
  await page.getByRole('tab', { name: 'Font and sound' }).click();
  await page.getByRole('radio', { name: 'Storybook' }).click();
  await page.getByRole('radio', { name: 'Chimes' }).click();
  await page.screenshot({ path: `test-results/builder-style-${info.project.name}.png` });
  await page.screenshot({ path: `test-results/builder-edit-${info.project.name}.png`, fullPage: true });
  await page.getByRole('button', { name: 'Save theme' }).click();
  await expect(page.getByText('Saved Ocean Party.', { exact: false })).toBeVisible();

  await page.goto('/games/game-show');
  await page.getByRole('button', { name: 'Set up and play' }).click();
  await page.getByRole('radio', { name: 'Ocean Party' }).click();
  await expect(page.getByText('Made by Test Teacher, designed by Ava')).toBeVisible();
  await expect(page).toHaveTitle('Game Show | Gamify');
  await page.screenshot({ path: `test-results/theme-screen-made-${info.project.name}.png` });
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByRole('heading', { name: /^Step 1 of 4:/ })).toBeVisible();
  await finishSetup(page);
  expect(await page.locator('h1, h2').first().evaluate((el) => getComputedStyle(el).fontFamily)).toContain('Georgia');
  const bg = await page.getByRole('button', { name: 'Card 1', exact: true }).evaluate((el) => getComputedStyle(el).backgroundImage);
  expect(bg).toContain('url(');
  await page.screenshot({ path: `test-results/builder-played-${info.project.name}.png` });
  expect(problems).toEqual([]);
});

test('Theme Builder: a photo of a drawn template page fills its piece', async ({ page }, info) => {
  test.setTimeout(90_000);
  const problems = watch(page);
  await page.goto('/teacher/themes/game-show/template');
  const sheet = page.locator('.template-sheet').first();
  await expect(sheet).toBeVisible();
  if (info.project.name === 'ipad-portrait') await page.screenshot({ path: 'test-results/builder-template.png', fullPage: false });
  // A student "draws" inside page 1's outline.
  await sheet.evaluate((svg) => {
    const ns = 'http://www.w3.org/2000/svg';
    const r = document.createElementNS(ns, 'circle');
    r.setAttribute('cx', '850'); r.setAttribute('cy', '1200'); r.setAttribute('r', '300'); r.setAttribute('fill', '#e85d75');
    svg.appendChild(r);
  });
  await page.addStyleTag({ content: 'header { display: none !important; }' }); // the sticky nav would cover the page top
  const photo = await sheet.screenshot();
  await page.goto('/teacher/themes/game-show');
  await page.getByRole('tab', { name: 'Upload' }).click();
  await page.getByLabel('Add photos of the pages').setInputFiles({ name: 'page1.png', mimeType: 'image/png', buffer: photo });
  await expect(page.getByText('1 piece added.')).toBeVisible({ timeout: 20_000 });
  await page.getByRole('tab', { name: 'Upload' }).click();
  await expect(page.getByLabel('Added')).toHaveCount(1);
  await page.screenshot({ path: `test-results/builder-scanned-${info.project.name}.png`, fullPage: true });
  expect(problems).toEqual([]);
});

test('Free plan: the Theme Builder works on Game Show only', async ({ page }) => {
  await page.goto('/teacher/themes/match-three');
  await expect(page.getByText('Designing this game comes with Plus and Pro.', { exact: false })).toBeVisible();
  // Only the note shows: nothing to fill in that couldn't be saved.
  await expect(page.getByLabel('Theme name')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Save theme' })).toHaveCount(0);
});

test('developer view opens with the owner PIN and links to the Theme Builder', async ({ page }) => {
  await page.goto('/owner');
  for (const d of '2468') await page.getByRole('button', { name: d, exact: true }).click();
  await expect(page.getByText('Type the same PIN again', { exact: false })).toBeVisible();
  for (const d of '2468') await page.getByRole('button', { name: d, exact: true }).click();
  await expect(page.getByRole('region', { name: 'Tell Gamify reports' })).toBeVisible();
  await page.screenshot({ path: `test-results/owner-${test.info().project.name}.png`, fullPage: true });
  // Cards reorder and the layout is remembered.
  await page.getByRole('button', { name: 'Move Usage earlier' }).click();
  await page.getByRole('link', { name: 'Open the Theme Builder' }).click();
  await expect(page.getByRole('heading', { name: 'Library Themes' })).toBeVisible();
});

test('Theme Builder fits the screen: tabs and pages, no scrolling', async ({ page }, info) => {
  await page.goto('/teacher/themes/match-three');
  await page.addInitScript(() => localStorage.setItem('gamify:settings', JSON.stringify({ tier: 'pro' })));
  await page.reload();
  // The get started steps sit on top until done; fold them to check the builder itself fits.
  await page.getByRole('button', { name: 'Fold the get started steps into the menu' }).click();
  await expect(page.getByRole('tab', { name: 'Upload' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByText(/^Page 1 of \d/)).toBeVisible();
  await page.getByRole('button', { name: 'Next page' }).click();
  await expect(page.getByText(/^Page 2 of \d/)).toBeVisible();
  await page.screenshot({ path: `test-results/builder-tabs-${info.project.name}.png` });
  expect(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight - (document.getElementById('teacher-footer')?.getBoundingClientRect().height ?? 0))).toBeLessThanOrEqual(1);
  await page.getByRole('tab', { name: 'Colors' }).click();
  await page.screenshot({ path: `test-results/builder-colors-${info.project.name}.png` });
  expect(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight - (document.getElementById('teacher-footer')?.getBoundingClientRect().height ?? 0))).toBeLessThanOrEqual(1);
});

test('Download tab: blank printable pages and digital files; the Classic example is look-only', async ({ page }, info) => {
  await page.goto('/teacher/themes/game-show');
  await page.getByRole('button', { name: 'Fold the get started steps into the menu' }).click();
  await page.getByRole('tab', { name: 'Download' }).click();
  await page.screenshot({ path: `test-results/builder-download-${info.project.name}.png` });
  expect(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight - (document.getElementById('teacher-footer')?.getBoundingClientRect().height ?? 0))).toBeLessThanOrEqual(1);
  // Classic is seen, never handed out (teacher, 2026-10-28): no Classic files.
  await expect(page.getByRole('button', { name: 'Classic example (.zip)' })).toHaveCount(0);
  const wait = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Blank pages (.zip)' }).click();
  const file = await wait;
  expect(file.suggestedFilename()).toBe('game-show-theme-blank.zip');
  const zip = (await import('fflate')).unzipSync(new Uint8Array(await (await import('node:fs/promises')).readFile(await file.path())));
  const names = Object.keys(zip);
  expect(names).toContain('sizes.txt');
  expect(names.some((n) => /card-back-\d+x\d+\.png$/.test(n))).toBe(true);
  await page.getByRole('link', { name: 'Classic example' }).click();
  await expect(page.getByText('to look at only. Use the blank pages to draw.', { exact: false })).toBeVisible();
  // Look-only pages: stamped EXAMPLE, no corner squares or outline to scan back in.
  const sheet = page.locator('.template-sheet').first();
  await expect(sheet.locator('text', { hasText: 'EXAMPLE' }).first()).toBeAttached();
  expect(await sheet.locator('rect[width="90"]').count()).toBe(0);
  if (info.project.name === 'ipad-portrait') await page.screenshot({ path: 'test-results/builder-template-example.png', fullPage: true });
});
