import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { openSetup } from './setup';

// Automated WCAG 2.1 A and AA checks (Stage 8 accessibility audit). A
// passing scan is the floor, not the whole audit: keyboard, screen reader
// and zoom checks are done by hand too.
const scan = async (page: import('@playwright/test').Page) => {
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  return r.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`);
};

for (const path of ['/play', '/teacher/classes', '/teacher/sets', '/teacher/reports', '/teacher/themes', '/teacher/account']) {
  test(`no automated accessibility violations on ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForTimeout(400);
    expect(await scan(page)).toEqual([]);
  });
}

test('no automated accessibility violations in a game start-up and setup', async ({ page }) => {
  await page.goto('/games/game-show');
  await page.waitForTimeout(400);
  expect(await scan(page)).toEqual([]);
  await openSetup(page, '/games/game-show');
  expect(await scan(page)).toEqual([]);
});

test.describe('public pages', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  for (const path of ['/', '/features', '/themes', '/challenge', '/pricing', '/login', '/join', '/it', '/help']) {
    test(`no automated accessibility violations on ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.waitForTimeout(400);
      expect(await scan(page)).toEqual([]);
    });
  }
});

test('no automated accessibility violations on the question screen and a game board', async ({ page }) => {
  await openSetup(page, '/games/match-three');
  for (;;) { const n = page.getByRole('button', { name: 'Next', exact: true }); if (!(await n.isVisible())) break; await n.click(); }
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('gridcell').first()).toBeVisible();
  expect(await scan(page)).toEqual([]);
  await openSetup(page, '/games/star-quiz');
  for (;;) { const n = page.getByRole('button', { name: 'Next', exact: true }); if (!(await n.isVisible())) break; await n.click(); }
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.waitForTimeout(3500);
  expect(await scan(page)).toEqual([]);
});
