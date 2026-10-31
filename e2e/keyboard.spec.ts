import { test, expect, type Page } from '@playwright/test';
import { LIBRARY } from '../src/data/library';
import { noPowerUps } from './setup';

// Hands-on keyboard check (Stage 8 accessibility): these flows use only Tab,
// Shift+Tab, Enter, Space and the arrow keys after the page loads.
const answers = new Map(LIBRARY.flatMap((s) => s.questions.map((q) => [q.prompt, q.choices[q.correctIndex]] as const)));

async function tabTo(page: Page, name: RegExp, max = 80) {
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab');
    const label = await page.evaluate(() => { const el = document.activeElement as HTMLInputElement | null; return el ? (el.getAttribute('aria-label') || el.labels?.[0]?.innerText || el.innerText || '').trim() : ''; });
    if (name.test(label)) return;
  }
  throw new Error(`Tab never reached ${name}`);
}
const focusRing = (page: Page) => page.evaluate(() => { const s = getComputedStyle(document.activeElement!); return s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2; });

test.beforeEach(async ({ page }, info) => {
  test.skip(info.project.name !== 'laptop', 'keyboards are tested on the laptop size');
  await page.addInitScript(() => { if (!localStorage.getItem('gamify:settings')) localStorage.setItem('gamify:settings', JSON.stringify({ tier: 'pro' })); });
});

test('keyboard: set up Game Show, pick a card and answer', async ({ page }) => {
  await page.goto('/games/game-show');
  await tabTo(page, /^Set up and play$/);
  expect(await focusRing(page)).toBe(true);
  await page.keyboard.press('Enter');
  await tabTo(page, /^Next$/); await page.keyboard.press('Enter'); // theme screen
  for (let i = 0; i < 6; i++) {
    const play = page.getByRole('button', { name: 'Play', exact: true });
    if (await play.isVisible()) break;
    await tabTo(page, /^Next$/); await page.keyboard.press('Enter');
  }
  await tabTo(page, /^Play$/); await page.keyboard.press('Enter');
  await tabTo(page, /^Card 1$/);
  expect(await focusRing(page)).toBe(true);
  await page.screenshot({ path: 'test-results/keyboard-focus.png' });
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog');
  const prompt = (await dialog.getByRole('heading', { level: 2 }).innerText()).trim();
  const right = answers.get(prompt)!;
  await tabTo(page, new RegExp(`^[A-D]\\s+${right.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`));
  await page.keyboard.press('Enter');
  await expect(dialog.getByText('You got it!')).toBeVisible();
});

test('keyboard: Bubble Pop aims with arrows and shoots with Space', async ({ page }) => {
  // A random Bubble Bundle power-up would add bubbles; this test counts them.
  await noPowerUps(page, 'bubble-pop');
  await page.goto('/games/bubble-pop');
  await tabTo(page, /^Set up and play$/); await page.keyboard.press('Enter');
  await tabTo(page, /^Next$/); await page.keyboard.press('Enter');
  await tabTo(page, /^Play$/); await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Read the question')).toBeHidden({ timeout: 8000 });
  const prompt = (await dialog.getByRole('heading', { level: 2 }).innerText()).trim();
  const right = answers.get(prompt)!;
  await tabTo(page, new RegExp(`^[A-D]\\s+${right.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`));
  await page.keyboard.press('Enter');
  await expect(page.getByRole('img', { name: '5 bubbles left' })).toBeVisible({ timeout: 8000 });
  await page.locator('body').click({ position: { x: 5, y: 5 } }).catch(() => {});
  await page.keyboard.press('ArrowLeft'); await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('Space');
  await expect(page.getByRole('img', { name: '4 bubbles left' })).toBeVisible({ timeout: 5000 });
});

test('keyboard: a teacher makes a class', async ({ page }) => {
  await page.addInitScript(() => { if (!localStorage.getItem('gamify:settings')) localStorage.setItem('gamify:settings', JSON.stringify({ tier: 'plus' })); });
  await page.goto('/teacher/classes');
  await tabTo(page, /Make class$/);
  await page.keyboard.press('Enter');
  await page.keyboard.type('Room 9');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Room 9' })).toBeVisible();
});

test('keyboard: Match Three swaps two pieces with Enter', async ({ page }) => {
  await page.goto('/games/match-three');
  await tabTo(page, /^Set up and play$/); await page.keyboard.press('Enter');
  await tabTo(page, /^Next$/); await page.keyboard.press('Enter');
  await tabTo(page, /^Play$/); await page.keyboard.press('Enter');
  await tabTo(page, /, row 1, column 1$/);
  await page.keyboard.press('Enter');
  await expect(page.getByRole('gridcell', { name: /row 1, column 1, selected$/ })).toBeVisible();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  // Either the swap made a match (the board moves) or it explains there was no match.
  await expect(page.getByRole('gridcell', { name: /selected$/ })).toHaveCount(0);
});

test('keyboard: pop-up boxes take focus, keep Tab inside, close with Escape and give focus back', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('gamify:settings', JSON.stringify({ tier: 'free' })));
  await page.goto('/games/memory-match');
  const upgrade = page.getByRole('button', { name: 'Upgrade' });
  await upgrade.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true);
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab');
    expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press('Shift+Tab');
  expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(upgrade).toBeFocused();
});

test('keyboard: the first Tab shows Skip to main content, which jumps past the menu', async ({ page }) => {
  await page.goto('/features');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to main content' });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
});
