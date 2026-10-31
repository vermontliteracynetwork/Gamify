import { test, expect } from '@playwright/test';
import { GAMES } from '../src/games/registry';

// Theme guides in the blog (teacher, 2026-10-28): every game has one; each
// piece shows the Classic look marked Example (on screen only), its size and
// tips; the downloads are blank templates.
test('Blog theme guides: one per game, every piece with its size, blank downloads only', async ({ page }, info) => {
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(m.text()); });
  page.on('pageerror', (e) => problems.push(e.message));
  await page.goto('/blog');
  await page.getByRole('link', { name: /Design a theme: a guide for every game/ }).click();
  for (const g of GAMES) await expect(page.getByRole('link', { name: new RegExp(`Theme Guide: ${g.name}`) })).toBeVisible();
  await expect(page.getByRole('link', { name: /Designing a Theme File, Step by Step/ })).toBeVisible();
  await page.screenshot({ path: `test-results/guide-list-${info.project.name}.png` });

  await page.getByRole('link', { name: /Theme Guide: Peg Drop/ }).click();
  const peg = GAMES.find((g) => g.id === 'peg-drop')!;
  for (const p of peg.themePieces) await expect(page.getByRole('heading', { level: 3, name: new RegExp(p.label) }).first()).toBeVisible();
  await expect(page.getByText(`${peg.themePieces[0].width} x ${peg.themePieces[0].height} px`).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Power-ups' })).toBeVisible();
  await expect(page.getByText('transparent', { exact: false }).first()).toBeVisible();
  await page.screenshot({ path: `test-results/guide-peg-${info.project.name}.png`, fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);

  // Free plan: Peg Drop templates are locked behind Plus (teacher, 2026-10-31).
  await expect(page.getByText('The templates for this game come with Plus', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: /Canva file/ })).toHaveCount(0);
  await page.goto('/blog/themes/peg-drop/print');
  await expect(page.getByText('The templates for this game come with Plus', { exact: false })).toBeVisible();
  await page.evaluate(() => localStorage.setItem('gamify:settings', JSON.stringify({ ...JSON.parse(localStorage.getItem('gamify:settings') ?? '{}'), tier: 'plus' })));
  await page.goto('/blog/themes/peg-drop');
  const wait = page.waitForEvent('download');
  await page.getByRole('button', { name: /Canva file/ }).click();
  const file = await wait;
  expect(file.suggestedFilename()).toBe('peg-drop-theme-for-canva.pdf');

  await page.getByRole('link', { name: /Printable pages/ }).click();
  await expect(page.getByText('pages, one for each piece', { exact: false })).toBeVisible();
  await expect(page.getByText('EXAMPLE')).toHaveCount(0);
  await page.getByRole('link', { name: 'Back to the theme guide' }).click();
  await expect(page.getByRole('heading', { level: 1, name: /Theme Guide: Peg Drop/ })).toBeVisible();
  expect(problems).toEqual([]);
});
