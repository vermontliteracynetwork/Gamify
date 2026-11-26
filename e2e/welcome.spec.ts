import { test, expect, type Page } from '@playwright/test';

// The welcome screen after sign-up and the 7-day Plus reverse trial (owner,
// 2026-11-26). Teacher pages only; students never see any of it.

async function signUp(page: Page, username = 'ms.rivera') {
  await page.addInitScript(() => { if (!sessionStorage.getItem('cleared')) { sessionStorage.setItem('cleared', '1'); localStorage.removeItem('gamify:teacher-session'); } });
  await page.goto('/login?mode=signup');
  await page.getByLabel('Email').fill(`${username}@school.org`);
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password', { exact: true }).fill('apples123');
  await page.getByLabel('Confirm password').fill('apples123');
  await page.getByRole('button', { name: 'Create my free account' }).click();
  await expect(page).toHaveURL(/\/teacher\/welcome$/);
  await expect(page.getByRole('heading', { level: 1, name: 'How Do You Want to Start?' })).toBeVisible();
}

test('sign-up opens the welcome screen once; Start Free keeps the 7 days of Plus', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await signUp(page);
  // Plus, Pro, and Free as one clear tap. No label picks for her, no timer.
  await expect(page.getByText('Your 7 days of Plus start now')).toBeVisible();
  await expect(page.getByText('$76.80 a year. Renews every year until you cancel.')).toBeVisible();
  await expect(page.getByText('$144 a year. Renews every year until you cancel.')).toBeVisible();
  await expect(page.getByText(/Best fit|Recommended/)).toHaveCount(0);
  // Billing is plain under both Get buttons; the leads are h3s.
  await expect(page.getByText('Billing starts when your free days end.')).toHaveCount(2);
  await expect(page.getByRole('heading', { level: 3, name: /What Plus Adds To Free/i })).toBeVisible();
  const free = page.getByRole('button', { name: 'Start Free' });
  await expect(free).toBeInViewport();
  // The beta strip asks before it gives, and links to the application.
  await expect(page.getByRole('link', { name: 'Apply to the beta' })).toHaveAttribute('href', '/beta/apply');
  await page.screenshot({ path: `test-results/welcome-${info.project.name}.png` });
  await free.click();
  await expect(page).toHaveURL(/\/teacher$/);
  await expect(page.getByText('Plus trial: 7 days left')).toBeVisible();
  // The trial is real Plus: a Plus game opens.
  await page.goto('/games/bubble-pop');
  await expect(page.getByRole('button', { name: 'Set up and play' })).toBeVisible();
  // Shown once: Home does not send her back.
  await page.goto('/teacher');
  await expect(page).toHaveURL(/\/teacher$/);
  expect(errors).toEqual([]);
});

test('Get Plus on the welcome screen opens the plan box with Plus ready', async ({ page }) => {
  await signUp(page, 'mr.lee');
  await page.getByRole('button', { name: 'Get Plus' }).click();
  await expect(page).toHaveURL(/\/teacher$/);
  const dialog = page.getByRole('dialog');
  // During the trial Get Plus still works (it keeps Plus after the 7 days).
  await expect(dialog.getByRole('heading', { name: 'Pick Your Plan' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Get Plus now' })).toBeEnabled();
  await expect(dialog.getByText('Billing starts when your free days end.').first()).toBeVisible();
  await expect(dialog.getByText(/Only \$/)).toHaveCount(0);
  await expect(dialog.getByText('$76.80 a year. Renews every year until you cancel.')).toBeVisible();
  await dialog.getByRole('button', { name: 'Get Plus now' }).click();
  await dialog.getByRole('button', { name: 'Keep going' }).click();
  // Paid: no trial banner.
  await expect(page.getByText(/Plus trial:/)).toHaveCount(0);
});

test('day 8: one card says what Free leaves out; Stay on Free locks Plus games again', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    const s = JSON.parse(localStorage.getItem('gamify:settings') ?? '{}');
    localStorage.setItem('gamify:settings', JSON.stringify({ ...s, 'trial-start': new Date(Date.now() - 8 * 86400000).toISOString(), 'welcome-seen': true }));
  });
  // Never on a screen the class can see, and not by itself away from Home and Account.
  await page.goto('/teacher/activity');
  await expect(page.getByRole('heading', { name: 'Create an Activity', exact: false }).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Your Plus Trial Has Ended' })).toHaveCount(0);
  await page.goto('/teacher/sets');
  await expect(page.getByRole('heading', { name: 'Your Plus Trial Has Ended' })).toHaveCount(0);
  await page.goto('/teacher');
  const card = page.getByRole('dialog');
  await expect(card.getByRole('heading', { name: 'Your Plus Trial Has Ended' })).toBeVisible();
  await expect(card.getByText('Board Game, Bubble Pop, Bowling and Territory')).toBeVisible();
  await card.getByRole('button', { name: 'Stay on Free' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Your Plus Trial Has Ended' })).toHaveCount(0);
  await page.goto('/games/bubble-pop');
  await expect(page.getByText('Bubble Pop is ready for you on Plus', { exact: false })).toBeVisible();
});

test('3 days left: the reminder shows once, on teacher pages only', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    const s = JSON.parse(localStorage.getItem('gamify:settings') ?? '{}');
    localStorage.setItem('gamify:settings', JSON.stringify({ ...s, 'trial-start': new Date(Date.now() - 4.5 * 86400000).toISOString(), 'welcome-seen': true }));
  });
  await page.goto('/teacher/sets');
  await expect(page.getByText('3 days of Plus left')).toBeVisible();
  await page.getByRole('button', { name: 'Got it' }).click();
  await expect(page.getByText('Plus trial: 3 days left')).toBeVisible();
  // Not on Create an Activity: the class can see the code there.
  await page.goto('/teacher/activity');
  await expect(page.locator('[data-trial-banner]')).toHaveCount(0);
  // Students never see the trial, a price or a plan.
  await page.goto('/join');
  await expect(page.getByText(/trial|Plus|\$/)).toHaveCount(0);
});

test('phones: after the full banner once, other pages fold it into a Plus chip; Home keeps the banner', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    const s = JSON.parse(localStorage.getItem('gamify:settings') ?? '{}');
    localStorage.setItem('gamify:settings', JSON.stringify({ ...s, 'trial-start': new Date(Date.now() - 1 * 86400000).toISOString(), 'welcome-seen': true }));
  });
  await page.goto('/teacher');
  await expect(page.locator('[data-trial-banner]')).toBeVisible();
  await page.goto('/teacher/sets');
  const chip = page.locator('[data-trial-chip]');
  await expect(chip).toHaveText('Plus: 6 days');
  await expect(page.locator('[data-trial-banner]')).toBeHidden();
  await chip.click();
  await expect(page.locator('[data-trial-banner]')).toBeVisible();
  await page.goto('/teacher');
  await expect(page.locator('[data-trial-banner]')).toBeVisible();
  await expect(page.locator('[data-trial-chip]')).toHaveCount(0);
});
