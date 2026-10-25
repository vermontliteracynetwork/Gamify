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
  await expect(page.getByRole('heading', { name: 'Get Started in Five Steps' })).toBeVisible();
  await expect(page.getByText('0 of 5 done')).toBeVisible();
  await page.getByLabel('New class name').fill('Room 3');
  await page.getByRole('button', { name: 'Make class' }).click();
  await page.getByLabel('Add students (type or paste names, one per line)').fill('Kai');
  await page.getByRole('button', { name: 'Add 1 student' }).click();
  const code = (await page.getByText(/Join code [A-Z]{5}/).innerText()).match(/[A-Z]{5}/)![0];
  await page.goto('/teacher/classes');
  await expect(page.getByText('2 of 5 done')).toBeVisible();
  await page.screenshot({ path: `test-results/get-started.png` });
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

test('teacher hosts one set with a game code; a student joins by link and plays that set', async ({ page }, info) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Continue on this device' }).click();
  await page.goto('/teacher/sets');
  await page.getByRole('tab', { name: 'Ready-made sets' }).click();
  await page.getByLabel('Search titles and tags').fill('habitats');
  await page.getByRole('button', { name: 'Play or share' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('radio', { name: /Question Tracker/ }).click();
  await dialog.getByRole('button', { name: 'Make a game code' }).click();
  const code = (await dialog.getByLabel(/^Game code /).innerText()).trim();
  expect(code).toMatch(/^[A-Z]{5}$/);
  await page.screenshot({ path: `test-results/host-${info.project.name}.png` });
  await page.goto('/play');
  await page.getByRole('button', { name: 'Log out' }).click();

  await page.goto(`/join/${code}`);
  await expect(page.getByRole('heading', { name: 'Pick Your Game Name' })).toBeVisible();
  await page.getByRole('button', { name: 'Roll a new name' }).click();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.getByRole('button', { name: 'Set up and play' }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByRole('heading', { name: /^Step 1 of 1:/ })).toBeVisible();
});

test('join page: five wrong codes means a short wait; the code screen shows a QR code', async ({ page }, info) => {
  await page.goto('/join');
  for (let i = 0; i < 5; i++) {
    await page.getByLabel('Class code').fill('QQQQQ');
    await page.getByRole('button', { name: 'Go' }).click();
    await page.waitForTimeout(150);
  }
  await expect(page.getByText(/Too many tries\. Wait \d+ seconds/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Go' })).toBeDisabled();
});

test.describe('signed in', () => {
  test.use({ storageState: 'e2e/teacher-session.json' });
  test('projector code screen', async ({ page }, info) => {
    await page.goto('/show/BKDFT');
    await expect(page.getByRole('img', { name: /QR code/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Read the code aloud: B K D F T/ })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)).toBeLessThanOrEqual(1);
    await page.screenshot({ path: `test-results/code-screen-${info.project.name}.png` });
  });
});

test.describe('signed out', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test('Ways to use Gamify: idea list and a post with a Just try it box', async ({ page }, info) => {
    await page.goto('/');
    await page.getByRole('contentinfo').getByRole('link', { name: 'Ways to use Gamify' }).click();
    await expect(page.getByRole('heading', { name: /Ways to use Gamify/i })).toBeVisible();
    await page.getByRole('button', { name: '9-12' }).click();
    await expect(page.getByRole('link', { name: /Unit Review Tournament/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Two-Tap Exit Tickets/ })).toHaveCount(0);
    await page.getByRole('button', { name: 'All grades' }).click();
    await page.screenshot({ path: `test-results/ways-${info.project.name}.png`, fullPage: true });
    await page.getByRole('link', { name: /Design a Theme as a Class/ }).click();
    await expect(page.getByRole('heading', { name: /Just try it/i })).toBeVisible();
    await expect(page).toHaveTitle('Ways to use Gamify | Gamify');
    await page.screenshot({ path: `test-results/ways-post-${info.project.name}.png`, fullPage: true });
  });
});

test.describe('research', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test('Research tab: findings with caveats, critics and our answers, measuring plan, sources', async ({ page }, info) => {
    await page.goto('/');
    if (info.project.name !== 'ipad-portrait') await page.getByRole('navigation', { name: 'Site' }).getByRole('link', { name: 'Research' }).click();
    else await page.getByRole('contentinfo').getByRole('link', { name: 'The Research' }).click();
    await expect(page.getByRole('heading', { level: 1, name: /The Research/i })).toBeVisible();
    await expect(page.getByText('Fair to know:', { exact: false }).first()).toBeVisible();
    await expect(page.getByRole('article')).toHaveCount(10);
    await page.waitForTimeout(800);
    await page.screenshot({ path: `test-results/research-${info.project.name}.png`, fullPage: true });
    await page.getByRole('tab', { name: 'Fair to know' }).click();
    await expect(page.getByRole('heading', { name: /What we won't claim/i })).toBeVisible();
    await page.waitForTimeout(800);
    await page.screenshot({ path: `test-results/research-fair-${info.project.name}.png`, fullPage: true });
    await page.getByRole('tab', { name: 'How we will measure' }).click();
    await expect(page.getByText('A comparison study with a university partner', { exact: false })).toBeVisible();
    await page.getByRole('tab', { name: 'Sources' }).click();
    expect(await page.getByRole('link', { name: /Psychological Bulletin/ }).count()).toBeGreaterThan(1);
    await expect(page).toHaveTitle('Research | Gamify');
    // Hover motion on a laptop: a card lifts (frame-checked).
    if (info.project.name === 'laptop') {
      await page.goto('/');
      const card = page.locator('.hover-lift').first();
      await card.scrollIntoViewIfNeeded();
      const before = await card.boundingBox();
      await card.hover();
      for (let f = 0; f < 5; f++) { await card.screenshot({ path: `test-results/hover-frame-${f}.png` }); await page.waitForTimeout(50); }
      const after = await card.boundingBox();
      expect(after!.y).toBeLessThan(before!.y - 3);
    }
  });
});

test.describe('beta kit', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test('beta classroom kit: lesson and poster, printable', async ({ page }, info) => {
    await page.goto('/help');
    await page.getByRole('link', { name: /print the classroom kit/ }).click();
    await expect(page.getByRole('region', { name: 'Tell Gamify: A 10-Minute Lesson' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Tell Gamify!' })).toBeVisible();
    if (info.project.name === 'laptop') {
      await page.emulateMedia({ media: 'print' });
      await page.setViewportSize({ width: 816, height: 1056 });
      await page.screenshot({ path: 'test-results/beta-kit-print.png', fullPage: true });
    }
  });
});

test.describe('footer and legal pages', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test('footer has the copyright and legal links; the Common Core notice is on Credits', async ({ page }, info) => {
    await page.goto('/');
    const footer = page.getByRole('contentinfo');
    await expect(footer.getByText(/© 20\d\d Gamify\. All rights reserved\./)).toBeVisible();
    await expect(footer.getByText('Common Core', { exact: false })).toHaveCount(0);
    await footer.screenshot({ path: `test-results/footer-${info.project.name}.png` });
    for (const [link, heading] of [['Privacy', /^Privacy$/i], ['Terms of Service', /Terms of Service/i], ['Accessibility', /^Accessibility$/i]] as const) {
      await page.getByRole('contentinfo').getByRole('link', { name: link, exact: true }).click();
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    }
    await page.getByRole('contentinfo').getByRole('link', { name: 'Credits and Attributions' }).click();
    await expect(page.getByText('National Governors Association Center', { exact: false })).toBeVisible();
    if (info.project.name !== 'ipad-portrait') {
      await page.getByRole('navigation', { name: 'Site' }).getByRole('link', { name: 'Home' }).click();
      await expect(page).toHaveURL(/\/$/);
    }
  });
});
