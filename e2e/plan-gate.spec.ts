import { test, expect } from '@playwright/test';
import { signUpTeacher } from './setup';

// Free plays every game but the few made for paid plans (owner, 2026-11-26).
// The paid-only lock is covered in src/config.test.ts until that game exists.
test('Free plan: every game opens, with no lock or upgrade', async ({ page }) => {
  for (const id of ['memory-match', 'bubble-pop']) {
    await page.goto(`/games/${id}`);
    await expect(page.getByRole('button', { name: 'Set up and play' })).toBeVisible();
    await expect(page.getByText(/ready for you on Plus/)).toHaveCount(0);
  }
});

test('Teacher Games tab: every game, each starts an activity with it picked', async ({ page }, info) => {
  await page.goto('/teacher/games');
  await expect(page.getByRole('heading', { name: 'Bubble Pop' })).toBeVisible();
  await expect(page.getByLabel(/is on paid plans/)).toHaveCount(0);
  await page.screenshot({ path: `test-results/teacher-games-${info.project.name}.png` });
  await page.getByRole('listitem').filter({ has: page.getByRole('heading', { name: 'Bubble Pop' }) }).getByRole('link', { name: 'Start an activity' }).click();
  await expect(page).toHaveURL(/\/teacher\/activity\?game=bubble-pop/);
});

test('Themes page: a Public themes tab shows the shared gallery', async ({ page }, info) => {
  await page.goto('/teacher/themes');
  await page.getByRole('tab', { name: 'Public themes' }).click();
  await expect(page).toHaveURL(/view=public/);
  await expect(page.getByRole('search').or(page.getByPlaceholder(/search/i)).first()).toBeVisible();
  await page.screenshot({ path: `test-results/teacher-public-themes-${info.project.name}.png` });
  await page.getByRole('tab', { name: 'Make a theme' }).click();
  await expect(page.getByRole('link', { name: /Game Show/ }).first()).toBeVisible();
});

test('Upgrade from the Question sets limit lifts the cap', async ({ page }) => {
  await page.addInitScript(() => {
    if (localStorage.getItem('gamify:sets-seeded')) return;
    localStorage.setItem('gamify:sets-seeded', '1');
    const sets = Array.from({ length: 3 }, (_, i) => ({ id: `s${i}`, name: `Set ${i}`, questions: [], ownerId: 'local-teacher', visibility: 'private', createdAt: '', updatedAt: '' }));
    localStorage.setItem('gamify:sets', JSON.stringify(sets));
  });
  await page.goto('/teacher/sets');
  const note = page.getByText(/You have made \d+ sets!/);
  await expect(note).toBeVisible();
  await page.getByRole('button', { name: 'Upgrade' }).first().click();
  await page.getByRole('dialog').getByRole('button', { name: /Plus now/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Keep going' }).click();
  await expect(note).toHaveCount(0);
});

test('Pricing: Start with Pro opens the plan box after sign-up, and a school gets a quote with no sales call', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('gamify:teacher-session'));
  await page.goto('/pricing');
  // Yearly Plus: $6.40 a month, or $5.60 with the Player One Sale stacked (until Jan 1, 2027).
  await expect(page.getByText(/^\$(5\.60|6\.40)$/).first()).toBeVisible();
  await page.getByLabel('Number of teachers').fill('25');
  await expect(page.getByText('Save 30%')).toHaveCount(0);
  await page.getByLabel('Your name').fill('Ms. Rivera');
  await page.getByLabel('Your school email').fill('rivera@school.org');
  await page.getByLabel('School or district').fill('Maple Elementary');
  await page.getByRole('button', { name: 'Email me my quote' }).click();
  // Without the email service (as here) the request is kept and the quote follows by email.
  await expect(page.getByText(/rivera@school\.org/)).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: /quote/i })).toBeVisible();
  await page.getByRole('link', { name: 'Go Pro' }).click();
  await expect(page).toHaveURL(/plan=pro/);
  await signUpTeacher(page);
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Get Pro now' })).toBeVisible();
});

test('Account: Your plan starts from value and upgrades in one tap', async ({ page }, info) => {
  await page.addInitScript(() => { if (!localStorage.getItem('gamify:settings')) localStorage.setItem('gamify:settings', JSON.stringify({ tier: 'free' })); });
  await page.goto('/teacher/account');
  await expect(page.getByRole('heading', { name: 'Your Plan: Free' })).toBeVisible();
  await expect(page.getByText('Get even more from Gamify, in one tap:')).toBeVisible();
  await page.screenshot({ path: `test-results/account-plan-${info.project.name}.png`, fullPage: true });
  await page.getByRole('button', { name: 'Get Plus now' }).click();
  await expect(page.getByRole('status').filter({ hasText: /Plus/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Your Plan: Plus' })).toBeVisible();
});

// Live mode comes with Plus, not Free (owner, 2026-11-26).
test('Free plan: Live mode (a class lobby) is locked', async ({ page }, info) => {
  await page.goto('/teacher/activity');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('radio', { name: /Question Tracker/ }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('radio', { name: /Open a class lobby/ }).click();
  await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeDisabled();
  await expect(page.getByText('Live mode, where everyone joins a class lobby on their own device, comes with Plus and Pro.')).toBeVisible();
  await page.screenshot({ path: `test-results/gate-live-${info.project.name}.png` });
  await page.goto('/teacher/live/ABCDE');
  await expect(page.getByText(/comes with Plus and Pro|no live game/i).first()).toBeVisible();
});
