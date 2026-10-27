import { test, expect } from '@playwright/test';
import { signUpTeacher } from './setup';

test('Free plan: a Plus game opened by its address shows a lock, never the game', async ({ page }, info) => {
  await page.goto('/games/memory-match');
  await expect(page.getByText('Memory Match is ready for you on Plus', { exact: false })).toBeVisible();
  await expect(page.getByRole('link', { name: 'See the plans' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Set up and play' })).toHaveCount(0);
  await page.screenshot({ path: `test-results/gate-teacher-${info.project.name}.png` });
  // A student sees only the lock and "ask your teacher": no plans or prices.
  await page.addInitScript(() => {
    localStorage.removeItem('gamify:teacher-session');
    if (!localStorage.getItem('gamify:classrooms')) localStorage.setItem('gamify:classrooms', JSON.stringify([{ id: 'c1', name: 'Room 7', ownerId: 'local-teacher', createdAt: '' }]));
    sessionStorage.setItem('gamify:arcade-session', JSON.stringify({ classroomId: 'c1', studentId: 's1', name: 'Ava' }));
  });
  await page.goto('/games/memory-match');
  await expect(page.getByText('This game is locked. Ask your teacher!')).toBeVisible();
  await expect(page.getByText(/plan|price|\$/i)).toHaveCount(0);
});

test('Upgrade is one tap from a limit: a locked game opens right after choosing Plus', async ({ page }, info) => {
  await page.goto('/games/memory-match');
  await page.getByRole('button', { name: 'Upgrade' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `test-results/upgrade-dialog-${info.project.name}.png` });
  await dialog.getByRole('button', { name: /Plus now/ }).click();
  await dialog.getByRole('button', { name: 'Keep going' }).click();
  await expect(page.getByRole('button', { name: 'Set up and play' })).toBeVisible();
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
  await expect(page.getByText('Only $8')).toBeVisible();
  await page.getByLabel('Number of teachers').fill('25');
  await expect(page.getByText('Save 30%')).toHaveCount(0);
  await page.getByLabel('Your name').fill('Ms. Rivera');
  await page.getByLabel('Your school email').fill('rivera@school.org');
  await page.getByLabel('School or district').fill('Maple Elementary');
  await page.getByRole('button', { name: 'Email me my quote' }).click();
  // Without the email service (as here) the request is kept and the quote follows by email.
  await expect(page.getByText(/rivera@school\.org/)).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: /quote/i })).toBeVisible();
  await page.getByRole('link', { name: 'Start with Pro' }).click();
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
