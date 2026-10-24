import { test, expect, type Page } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

function watch(page: Page) {
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(m.text()); });
  page.on('pageerror', (e) => problems.push(e.message));
  return problems;
}

test('public pages: home, features, pricing, and no horizontal scroll', async ({ page }, info) => {
  const problems = watch(page);
  for (const [path, heading] of [['/', 'Every Question Becomes a Game'], ['/features', 'Features'], ['/pricing', 'Plans and Pricing']] as const) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    await page.screenshot({ path: `test-results/public${path.replace('/', '-') || '-home'}-${info.project.name}.png`, fullPage: true });
  }
  await expect(page.getByText('$144 per teacher a year, $1,440 in all')).toBeVisible();
  expect(problems).toEqual([]);
});

test('the games need sign-in; a student joins with a class code', async ({ page }) => {
  await page.goto('/play');
  await expect(page.getByRole('heading', { name: 'Sign in to Play' })).toBeVisible();
  await page.goto('/games/game-show');
  await expect(page.getByRole('heading', { name: 'Sign in to Play' })).toBeVisible();
  await page.goto('/teacher/classes');
  await expect(page.getByRole('heading', { name: 'Teachers, Please Log In' })).toBeVisible();

  // Teacher logs in on this device and makes a class with a join code.
  await page.goto('/login');
  await page.getByLabel('Your name (what students see)').fill('Ms. Rivera');
  await page.getByRole('button', { name: 'Continue on this device' }).click();
  await page.getByLabel('New class name').fill('Room 3');
  await page.getByRole('button', { name: 'Make class' }).click();
  await page.getByLabel('Add students (type or paste names, one per line)').fill('Kai');
  await page.getByRole('button', { name: 'Add 1 student' }).click();
  const code = (await page.getByText(/Join code [A-Z]{5}/).innerText()).match(/[A-Z]{5}/)![0];
  await page.getByRole('button', { name: 'Log out' }).click();

  // Student types the code and reaches the class sign-in.
  await page.goto('/join');
  await page.getByLabel('Class code').fill('ZZZZZ');
  await page.getByRole('button', { name: 'Go' }).click();
  await expect(page.getByText('That code did not match.', { exact: false })).toBeVisible();
  await page.getByLabel('Class code').fill(code.toLowerCase());
  await page.getByRole('button', { name: 'Go' }).click();
  await expect(page.getByRole('button', { name: 'Kai', exact: true })).toBeVisible();
});
