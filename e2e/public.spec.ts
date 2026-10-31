import { test, expect, type Page } from '@playwright/test';
import { seedGameCode, signUpTeacher } from './setup';

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
  // School prices are not on the page: the quote comes by email.
  await expect(page.getByText(/per teacher a year/)).toHaveCount(0);
  await expect(page.getByText('School savings start at 5 teachers', { exact: false })).toBeVisible();
  expect(problems).toEqual([]);
});

test('the games need sign-in; a student joins with a game code', async ({ page }) => {
  await page.goto('/play');
  await expect(page.getByRole('heading', { name: 'Sign in to Play' })).toBeVisible();
  await page.goto('/games/game-show');
  await expect(page.getByRole('heading', { name: 'Sign in to Play' })).toBeVisible();
  await page.goto('/teacher/classes');
  await expect(page.getByRole('heading', { name: 'Teachers, Please Log In' })).toBeVisible();

  // Teacher logs in on this device and makes a class with a join code.
  await page.goto('/login');
  await signUpTeacher(page);
  await expect(page.getByRole('heading', { name: 'Get Started' })).toBeVisible();
  await expect(page.getByText('0 of 4 done')).toBeVisible();
  // Free has no classes: the teacher lands on their student list.
  await expect(page.getByRole('heading', { name: 'My Students' })).toBeVisible();
  await page.getByLabel('Add students (type or paste names, one per line)').fill('Kai');
  await page.getByRole('button', { name: 'Add 1 student' }).click();
  // Students get in only with a game code (teacher, 2026-10-31).
  await expect(page.getByText(/Join code/)).toHaveCount(0);
  const code = 'BKDFG';
  await seedGameCode(page, code);
  await page.goto('/teacher/classes');
  // Adding Kai and making a game code finish two steps (Create an activity counts codes).
  await expect(page.getByText('2 of 4 done')).toBeVisible();
  await page.screenshot({ path: `test-results/get-started.png` });
  await page.getByRole('button', { name: 'Log out' }).click();

  // Student types the code and reaches the class sign-in; the Arcade is gone.
  await page.goto('/arcade');
  await expect(page).toHaveURL(/\/join$/);
  await page.goto('/join');
  // A code is checked as it is typed; Go shows only for one that works (teacher, 2026-10-31).
  await page.getByLabel('Game code').fill('ZZZZZ');
  await expect(page.getByText('That code did not match.', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Go' })).toHaveCount(0);
  await page.getByLabel('Game code').fill(code.toLowerCase());
  await page.getByRole('button', { name: 'Go' }).click();
  await expect(page.getByRole('button', { name: 'Kai', exact: true })).toBeVisible();
});

test('teacher hosts one set with a game code; a student joins by link and plays that set', async ({ page }, info) => {
  await page.goto('/login');
  await signUpTeacher(page);
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
  await expect(page.getByRole('heading', { name: /^Step 1 of 1:/ })).toBeVisible();
});

test('join page: five wrong codes means a short wait; the code screen shows a QR code', async ({ page }, info) => {
  await page.goto('/join');
  for (const c of ['QQQQQ', 'QQQQW', 'QQQWQ', 'QQWQQ', 'QWQQQ']) {
    await page.getByLabel('Game code').fill(c);
    await page.waitForTimeout(250);
  }
  await expect(page.getByText(/Too many tries\. Wait \d+ seconds/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Go' })).toHaveCount(0);
});

test.describe('signed in', () => {
  test.use({ storageState: 'e2e/teacher-session.json' });
  test('projector code screen', async ({ page }, info) => {
    await page.goto('/show/BKDFT');
    await expect(page.getByRole('img', { name: /QR code/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Read the code aloud: B K D F T/ })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight - (document.getElementById('teacher-footer')?.getBoundingClientRect().height ?? 0))).toBeLessThanOrEqual(1);
    await page.screenshot({ path: `test-results/code-screen-${info.project.name}.png` });
  });
});

test.describe('signed out', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test('Blog: post list with grade and homeschool filters, and a post with a Just try it box', async ({ page }, info) => {
    await page.goto('/');
    await page.getByRole('contentinfo').getByRole('link', { name: 'Blog' }).click();
    await expect(page.getByRole('heading', { name: /The Gamify Blog/i })).toBeVisible();
    await page.getByRole('button', { name: '9-12' }).click();
    await expect(page.getByRole('link', { name: /Unit Review Tournament/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Two-Tap Exit Tickets/ })).toHaveCount(0);
    await page.getByRole('button', { name: 'Homeschool' }).click();
    await expect(page.getByRole('link', { name: /Siblings at Different Grades/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Design a Theme as a Class/ })).toHaveCount(0);
    await page.getByRole('button', { name: 'All grades' }).click();
    await page.screenshot({ path: `test-results/ways-${info.project.name}.png`, fullPage: true });
    await page.getByRole('link', { name: /Design a Theme as a Class/ }).click();
    await expect(page.getByRole('heading', { name: /Just try it/i })).toBeVisible();
    await expect(page).toHaveTitle('Blog | Gamify');
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
    await expect(page.getByText('Good to know:', { exact: false }).first()).toBeVisible();
    await expect(page.getByRole('article')).toHaveCount(14);
    await page.waitForTimeout(800);
    await page.screenshot({ path: `test-results/research-${info.project.name}.png`, fullPage: true });
    await expect(page.getByRole('heading', { name: /Designed around what works/i })).toBeVisible();
    await page.getByRole('tab', { name: 'The beta test' }).click();
    await expect(page.getByRole('heading', { name: /Gamify is just getting started/i })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Join the beta test' }).first()).toHaveAttribute('href', '/beta');
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
    await page.getByRole('link', { name: 'See the classroom kit' }).click();
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

test.describe('features page', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test('three pillars to try: a question with supports, sample themes, and the four ways to play', async ({ page }) => {
    await page.goto('/features');
    await page.getByRole('link', { name: /Theme creation/ }).click();
    await expect(page).toHaveURL(/#themes/);
    await page.getByRole('radio', { name: /Night Arcade/ }).click();
    await expect(page.getByRole('radio', { name: /Night Arcade/ })).toHaveAttribute('aria-checked', 'true');
    await page.getByRole('button', { name: 'Bigger text' }).click();
    await expect(page.getByRole('button', { name: 'Bigger text' })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'A 1/4' }).click();
    await expect(page.getByText('You got it!', { exact: false })).toBeVisible();
    await page.getByRole('tab', { name: 'Live' }).click();
    await expect(page.getByText('lock screens with one tap', { exact: false })).toBeVisible();
  });
});

test.describe('buyer pages', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test('beta test page says exactly what we ask, and the application needs the agreement', async ({ page }, info) => {
    await page.goto('/beta');
    await expect(page.getByRole('heading', { level: 1, name: /Join the Gamify Beta Test/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Play at least twice a week' })).toBeVisible();
    await page.getByLabel('Your name').fill('Ms. Rivera');
    await page.getByLabel('Your email').fill('rivera@school.org');
    const send = page.getByRole('button', { name: 'Apply for the beta test' });
    await expect(send).toBeDisabled();
    await page.getByLabel(/I can play Gamify with my students/).check();
    await send.click();
    await expect(page.getByText('Your application is in.', { exact: false })).toBeVisible();
    await page.screenshot({ path: `test-results/beta-page-${info.project.name}.png`, fullPage: true });
  });
  test('FAQ: tabs for each buyer and a search across all of them', async ({ page }) => {
    await page.goto('/faq');
    await page.getByRole('tab', { name: 'Homeschool families' }).click();
    await page.getByText('I teach several ages at once. Does that work?').click();
    await expect(page.getByText('six-year-old practices letters', { exact: false })).toBeVisible();
    await page.getByLabel('Search every question').fill('purchase order');
    await expect(page.getByText(/answers? found/)).toBeVisible();
    await expect(page.getByText('Can we pay with a purchase order?')).toBeVisible();
  });
  test('schools, homeschool and student data pages link the way buyers need', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Schools and districts/ }).first().click();
    await expect(page.getByRole('heading', { level: 1, name: /Gamify for Schools and Districts/i })).toBeVisible();
    await page.getByRole('link', { name: /Student data promise/ }).first().click();
    await expect(page.getByRole('heading', { level: 1, name: /Our Student Data Promise/i })).toBeVisible();
    await page.goto('/homeschool');
    // The Homeschool plan lives on the Homeschool page, linked from Pricing.
    await expect(page.getByRole('link', { name: 'Start the Homeschool plan' })).toBeVisible();
    await page.goto('/pricing');
    await page.getByRole('link', { name: /Homeschooling\? See the Homeschool plan/ }).click();
    await expect(page).toHaveURL(/homeschool/);
  });
});

test.describe('device check', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test('check this device: every check shows a result in plain words', async ({ page }, info) => {
    await page.goto('/check');
    await expect(page.getByText(/Everything looks good|Gamify will work, with a note|Something here will stop/)).toBeVisible();
    await expect(page.getByText('Modern browser', { exact: false })).toBeVisible();
    await expect(page.getByText('This browser has everything Gamify needs.')).toBeVisible();
    await page.screenshot({ path: `test-results/device-check-${info.project.name}.png`, fullPage: true });
  });
});

test('Theme Building Challenge: two tracks, and a printable permission slip for hand-drawn entries', async ({ page }, info) => {
  await page.goto('/challenge');
  await expect(page.getByRole('heading', { name: 'Two Ways to Enter' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Drawn by Hand' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Built in the Theme Builder' })).toBeVisible();
  await page.getByRole('link', { name: 'Print the permission slip' }).click();
  await expect(page.getByRole('heading', { name: /Permission Slip/ })).toBeVisible();
  await expect(page.getByText('Parent or guardian name')).toBeVisible();
  await page.screenshot({ path: `test-results/permission-${info.project.name}.png`, fullPage: true });
});

test('Status page checks each part; the accessibility report prints as a VPAT-style table', async ({ page }) => {
  await page.goto('/status');
  await expect(page.getByRole('heading', { name: 'Is Gamify Working?' })).toBeVisible();
  await expect(page.getByText('The Gamify app and games')).toBeVisible();
  await expect(page.getByRole('status').first()).toHaveText('Working');
  await page.goto('/accessibility/report');
  await expect(page.getByRole('heading', { name: 'WCAG 2.1 Level A', exact: true })).toBeVisible();
  await expect(page.getByText(/Of 50 WCAG 2.1 A and AA criteria/)).toBeVisible();
  await expect(page.getByRole('cell', { name: /^1\.4\.3 Contrast/ })).toBeVisible();
});
