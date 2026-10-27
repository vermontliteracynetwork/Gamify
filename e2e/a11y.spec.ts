import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { openSetup } from './setup';

// Automated WCAG 2.1 A and AA checks (Stage 8 accessibility audit). A
// passing scan is the floor, not the whole audit: keyboard, screen reader
// and zoom checks are done by hand too.
const scan = async (page: import('@playwright/test').Page) => {
  // Let page fades finish first: half-faded text reads as low contrast.
  await page.evaluate(() => Promise.race([Promise.all(document.getAnimations().filter((a) => a.effect?.getTiming().iterations !== Infinity).map((a) => a.finished.catch(() => undefined))), new Promise((r) => setTimeout(r, 2000))]));
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
  for (const path of ['/', '/features', '/themes', '/challenge', '/beta', '/check', '/faq', '/schools', '/homeschool', '/student-data', '/pricing', '/login', '/join', '/it', '/help']) {
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

// Full sweep for the conformance report (Stage 8): every listed game's start
// screen, the newer teacher screens and dialogs, and the rest of the site.
test.describe('full sweep', () => {
  for (const g of ['peg-drop', 'cast-catch', 'match-three', 'four-in-a-row', 'bubble-pop', 'bowling', 'lunch-rush', 'castle-guard', 'farm-grow', 'star-quiz']) {
    test(`no automated accessibility violations on the ${g} start screen`, async ({ page }) => {
      await page.addInitScript(() => { if (!localStorage.getItem('gamify:settings')) localStorage.setItem('gamify:settings', JSON.stringify({ tier: 'pro' })); });
      await page.goto(`/games/${g}`);
      await page.waitForTimeout(400);
      expect(await scan(page)).toEqual([]);
    });
  }
  test('no automated accessibility violations in Play or share, the live lobby, the Theme Builder and its studio', async ({ page }) => {
    await page.addInitScript(() => { if (!localStorage.getItem('gamify:settings')) localStorage.setItem('gamify:settings', JSON.stringify({ tier: 'pro' })); });
    await page.goto('/teacher/sets');
    await page.getByRole('tab', { name: 'Ready-made sets' }).click();
    await page.getByRole('button', { name: 'Play or share' }).first().click();
    await page.getByRole('radio', { name: /Cast and Catch/ }).click();
    expect(await scan(page)).toEqual([]);
    await page.getByRole('button', { name: 'Host a live game' }).click();
    await page.waitForTimeout(400);
    expect(await scan(page)).toEqual([]);
    await page.goto('/teacher/themes/game-show');
    await page.getByRole('button', { name: 'Fold the get started steps into the menu' }).click();
    expect(await scan(page)).toEqual([]);
    await page.getByRole('tab', { name: 'Upload' }).click();
    await page.getByRole('button', { name: /^Draw the / }).first().click();
    await page.waitForTimeout(400);
    expect(await scan(page)).toEqual([]);
  });
  test.describe('more public pages', () => {
    test.use({ storageState: { cookies: [], origins: [] } });
    for (const path of ['/blog', '/research', '/credits', '/privacy', '/terms', '/accessibility', '/challenge/permission', '/owner', '/status', '/accessibility/report']) {
      test(`no automated accessibility violations on ${path}`, async ({ page }) => {
        await page.goto(path);
        await page.waitForTimeout(400);
        expect(await scan(page)).toEqual([]);
      });
    }
  });
});
