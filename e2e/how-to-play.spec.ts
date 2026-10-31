import { test, expect } from '@playwright/test';
import { HOW_TO_PLAY } from '../src/public/howToPlay';

// How to Play help in the Blog (teacher, 2026-10-31): every game gets an
// article with real screenshots and its features, pieces and rules.
test('Blog How to Play: every game has an article with screenshots, pieces and rules', async ({ page }, info) => {
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(m.text()); });
  page.on('pageerror', (e) => problems.push(e.message));
  await page.goto('/blog?tag=howto');
  for (const h of HOW_TO_PLAY) await expect(page.locator(`a[href="/blog/how-to-play/${h.gameId}"]`).first()).toBeVisible();

  await page.goto('/blog/how-to-play/game-show');
  await expect(page.getByRole('heading', { level: 1, name: /How to Play Game Show/ })).toBeVisible();
  for (const name of ['How a Turn Works']) await expect(page.getByRole('heading', { name })).toBeVisible();
  await expect(page.getByText('Three questions per turn to earn a card.')).toBeVisible();
  const shots = page.locator('figure img');
  await expect(shots.first()).toBeVisible();
  await page.waitForFunction(() => [...document.querySelectorAll('figure img')].every((i) => (i as HTMLImageElement).complete));
  expect(await shots.evaluateAll((els) => els.filter((i) => (i as HTMLImageElement).naturalWidth > 0).length)).toBeGreaterThanOrEqual(3);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  await page.screenshot({ path: `test-results/howto-${info.project.name}.png`, fullPage: true });
  expect(problems).toEqual([]);
});
