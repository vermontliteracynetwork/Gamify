import { teacherSession } from './session';
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
  await signUpTeacher(page, 'miss.jen', { trial: false });
  // The teacher lands on Home: the first-day steps and empty states (batch 6).
  await expect(page.getByRole('heading', { name: 'Welcome to Gamify' })).toBeVisible();
  await expect(page.getByText('Get started, 0 of 4 done').first()).toBeVisible();
  // Free has no class or student list (owner, 2026-11-26): the Students page says so.
  await page.getByRole('navigation', { name: 'Teacher pages' }).getByRole('link', { name: 'Students' }).click();
  await expect(page.getByRole('heading', { name: 'My Students' })).toBeVisible();
  await expect(page.getByText(/Upgrade to keep a student list/)).toBeVisible();
  // Students get in only with a game code (teacher, 2026-10-31).
  await expect(page.getByText(/Join code/)).toHaveCount(0);
  const code = 'BKDFG';
  await seedGameCode(page, code);
  await page.goto('/teacher/classes');
  // Making a game code finishes a step (Create an activity counts codes).
  await expect(page.getByRole('button', { name: /^Get started [1-4]\/4$/ })).toBeVisible();
  await page.screenshot({ path: `test-results/get-started.png` });
  await page.getByRole('button', { name: 'Log out' }).click();

  // Student types the code and reaches the class sign-in; the Arcade is gone.
  await page.goto('/arcade');
  await expect(page).toHaveURL(/\/join$/);
  await page.goto('/join');
  // A code is checked as it is typed; Go stays off until one works (teacher, 2026-10-31; mockup 17, 2026-11-25).
  await page.getByLabel('Game code').fill('ZZZZZ');
  await expect(page.getByText('That code did not match.', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Go' })).toHaveCount(0);
  await page.getByLabel('Game code').fill(code.toLowerCase());
  await page.getByRole('button', { name: 'Go' }).click();
  // No student list on Free: the student rolls a name or types their own.
  await expect(page.getByRole('heading', { name: /pick your game name/i })).toBeVisible();
  // Blocked words (owner, 2026-11-26): a rude name is refused.
  await page.getByLabel('Or type your first name').fill('Sh1ttt');
  await expect(page.getByText('Please pick a different name.')).toBeVisible();
  await expect(page.getByRole('button', { name: /Play/ }).last()).toBeDisabled();
  await page.getByLabel('Or type your first name').fill('Kai');
  await expect(page.getByText('Kai', { exact: true })).toBeVisible();
});

test('teacher hosts one set with a game code; a student joins by link and plays that set', async ({ page }, info) => {
  await page.goto('/login');
  await signUpTeacher(page);
  await page.goto('/teacher/sets');
  await page.getByRole('tab', { name: 'Public sets' }).click();
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
  await expect(page.getByRole('heading', { name: /pick your game name/i })).toBeVisible();
  await page.getByRole('button', { name: 'Roll a new name' }).click();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.getByRole('button', { name: 'Set up and play' }).click();
  // Free plays every library theme (owner, 2026-11-24), so the theme step comes first.
  await page.getByRole('heading', { name: 'Pick a Theme' }).or(page.getByRole('heading', { name: /^Step 1 of 1:/ })).first().waitFor();
  if (await page.getByRole('heading', { name: 'Pick a Theme' }).isVisible()) await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByRole('heading', { name: /^Step 1 of 1:/ })).toBeVisible();
  // The code opens one game only: no game list, no other games (teacher, 2026-10-31).
  await page.goto('/play');
  await expect(page).toHaveURL(/\/join$/);
  await page.goto('/games/bowling');
  await expect(page.getByRole('heading', { name: 'Ask for a Code' })).toBeVisible();
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
  test.use({ storageState: teacherSession });
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
    await expect(page.getByRole('heading', { name: /^Blog$/i })).toBeVisible();
    // Topic pills and a grades dropdown (the /brand Blog index mockup, 2026-11-25).
    const grades = page.getByRole('combobox', { name: /^Grades/ });
    await grades.selectOption('912');
    await expect(page.getByRole('link', { name: /Unit Review Tournament/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Two-Tap Exit Tickets/ })).toHaveCount(0);
    await grades.selectOption('all');
    await page.getByRole('button', { name: 'Homeschool' }).click();
    await expect(page.getByRole('link', { name: /Siblings at Different Grades/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Design a Theme as a Class/ })).toHaveCount(0);
    await page.getByRole('button', { name: 'All', exact: true }).click();
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
    // The beta test moved from Research to Home (owner, 2026-11-27).
    await expect(page.getByRole('tab', { name: 'The beta test' })).toHaveCount(0);
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
  test('real game pictures cycle every theme, a look to try, a question with supports, and the ways to play', async ({ page }) => {
    await page.goto('/features');
    // The real games: pick one, and its live picture flips through every theme it can wear.
    const games = page.locator('#games');
    await games.getByRole('button', { name: 'Four in a Row', exact: true }).click();
    const pictures = games.getByRole('group', { name: 'Four in a Row in every theme' });
    await expect(pictures.getByRole('img', { name: 'Four in a Row in the Classic theme' })).toBeVisible();
    await pictures.getByRole('button', { name: 'Next theme' }).click();
    await expect(pictures.getByRole('img', { name: 'Four in a Row in the Animal Friends theme' })).toBeVisible();
    await pictures.getByRole('button', { name: 'Previous theme' }).click();
    await expect(pictures.getByRole('img', { name: 'Four in a Row in the Classic theme' })).toBeVisible();
    // A game with only Classic says class themes show up there too.
    await games.getByRole('button', { name: 'Territory', exact: true }).click();
    await expect(games.getByText('Themes your class makes for this game show up here too.')).toBeVisible();
    // Try a look: the picture redraws from the colors picked.
    await page.locator('#themes').scrollIntoViewIfNeeded();
    await page.getByRole('radio', { name: 'Night' }).click();
    await expect(page.getByRole('radio', { name: 'Night' })).toHaveAttribute('aria-checked', 'true');
    await page.getByRole('button', { name: 'Bigger text' }).click();
    await expect(page.getByRole('button', { name: 'Bigger text' })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'A 1/4' }).click();
    await expect(page.getByText('You got it!', { exact: false })).toBeVisible();
    await expect(page.getByText('lock screens with one tap', { exact: false }).first()).toBeAttached();
  });
  test('a theme made in the Theme Builder joins the game picture cycle', async ({ page }) => {
    await page.goto('/features');
    await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem('gamify:settings') || '{}');
      s['made-themes'] = [{ id: 'custom:e2e-bowl', gameId: 'bowling', name: 'Space Lanes', source: 'custom', designedBy: 'msrivera', studentDesigner: 'Ava',
        colors: { background: '#1d1a33', backgroundText: '#ffffff', surface: '#fffaf0', text: '#1d1a33', accent: '#fdfd94', accentText: '#1d1a33', success: '#22b04a', miss: '#f055a5' },
        fonts: { display: 'Grow Year', body: 'Inclusive Sans' }, backdrop: { kind: 'pattern', pattern: 'dots' }, celebration: 'stars', pieces: { lane: { color: '#4ba3e8' } } }];
      localStorage.setItem('gamify:settings', JSON.stringify(s));
    });
    await page.reload();
    const games = page.locator('#games');
    await games.getByRole('button', { name: 'Bowling', exact: true }).click();
    const pictures = games.getByRole('group', { name: 'Bowling in every theme' });
    await pictures.getByRole('button', { name: 'Next theme' }).click();
    await expect(pictures.getByRole('img', { name: 'Bowling in the Space Lanes theme' })).toBeVisible();
    await expect(pictures.getByText('Made by your class')).toBeVisible();
  });
  test('Game Show wears its studio in every theme, and Try it redraws the studio from the colors picked', async ({ page }) => {
    await page.goto('/features');
    const games = page.locator('#games');
    await games.getByRole('button', { name: 'Game Show', exact: true }).click();
    const pictures = games.getByRole('group', { name: 'Game Show in every theme' });
    await pictures.getByRole('button', { name: 'Next theme' }).click();
    // A sample theme: curtains, stage and the bulb marquee round card backs, no numbered grid.
    const pic = pictures.getByRole('img', { name: /^Game Show in the .+ theme$/ });
    await expect(pic.locator('[data-studio]')).toBeVisible();
    await expect(pic.getByText(/^[1-4]$/)).toHaveCount(0);
    const tryIt = page.getByRole('img', { name: 'Game Show in the Your look theme' });
    await expect(tryIt.locator('[data-studio]')).toBeVisible();
    const before = await tryIt.locator('[data-studio] rect').first().getAttribute('fill');
    await page.getByRole('radio', { name: 'Night' }).click();
    await expect(tryIt.locator('[data-studio] rect').first()).not.toHaveAttribute('fill', before!);
  });
});

test.describe('buyer pages', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test('beta test page says exactly what we ask, and its Apply card opens the application or Free', async ({ page }, info) => {
    await page.goto('/beta');
    await expect(page.getByRole('heading', { level: 1, name: /Join the Gamify Beta Test/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Play every game at least once' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Apply to be a beta tester' }).first()).toHaveAttribute('href', '/beta/apply');
    const card = page.locator('#apply');
    await expect(card.getByRole('heading', { name: /Ready to apply/i })).toBeVisible();
    await expect(card.getByRole('link', { name: 'Not ready to commit? Start free' })).toHaveAttribute('href', '/login?mode=signup');
    await page.screenshot({ path: `test-results/beta-page-${info.project.name}.png`, fullPage: true });
    await card.getByRole('link', { name: 'Apply to be a beta tester' }).click();
    await expect(page).toHaveURL(/\/beta\/apply$/);
  });
  // The formal application (owner, 2026-11-26; five steps, Design Chair):  every ask a
  // required tick, a 30-character reason, then the owner sees it with a score.
  test('beta application: five steps with inline checks, then the owner reads it with a score', async ({ page }, info) => {
    const problems: string[] = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(m.text()); });
    await page.goto('/beta/apply');
    await expect(page.getByRole('heading', { level: 1, name: /Apply for the Beta Test/i })).toBeVisible();
    await expect(page.getByText('Step 1 of 5', { exact: false })).toBeVisible();
    await expect(page.getByRole('link', { name: /Start free/ }).first()).toHaveAttribute('href', '/login?mode=signup');
    const next = page.getByRole('button', { name: 'Next' });
    // Choice chips: tap the chip, as a finger would; the real input inside it changes.
    const tick = async (role: 'checkbox' | 'radio', name: string) => {
      const input = page.getByRole(role, { name, exact: true });
      await page.locator('label').filter({ has: input }).click();
      await expect(input).toBeChecked();
    };
    await next.click();
    await expect(page.getByText('Type your name.')).toBeVisible();
    await expect(page.getByLabel(/Your name/)).toBeFocused();
    await page.getByLabel(/Your name/).fill('Ms. Rivera');
    await page.getByLabel(/Your school email/).fill('rivera@lincoln.k12.vt.us');
    await page.getByLabel(/School name, or Homeschool/).fill('Lincoln Elementary');
    await page.getByLabel(/^State/).selectOption('Vermont');
    await tick('checkbox', 'K-2');
    await page.getByLabel(/About how many students/).fill('22');
    await next.click();
    await expect(page.getByText('Step 2 of 5', { exact: false })).toBeVisible();
    await next.click();
    await expect(page.getByText('Pick at least one device.')).toBeVisible();
    await tick('checkbox', 'Chromebooks');
    await tick('radio', '3 or more times a week');
    await tick('checkbox', 'Bubble Pop');
    await next.click();
    await expect(page.getByText('Step 3 of 5', { exact: false })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'The Asks' })).toBeVisible();
    const asks = page.locator('fieldset[data-field="asks"] input[type=checkbox]');
    await expect(asks).toHaveCount(9);
    await asks.first().check();
    await next.click();
    await expect(page.getByText('Tick every ask.', { exact: false })).toBeVisible();
    for (const c of await asks.all()) await c.check();
    await next.click();
    await expect(page.getByText('Step 4 of 5', { exact: false })).toBeVisible();
    await page.getByLabel(/Why do you want to test Gamify/).fill('Fun!');
    await next.click();
    await expect(page.getByText('Write at least 30 characters.')).toBeVisible();
    // No "earned" or "kept by check-ins" wording: Pro stays as promised (owner, 2026-11-26).
    await expect(page.getByText(/earned|kept by/i)).toHaveCount(0);
    const why = 'My first graders love games, and I want to help build one that really teaches reading. We play every morning.';
    await page.getByLabel(/Why do you want to test Gamify/).fill(why);
    await page.getByLabel(/I agree to do the asks above/).check();
    await next.click();
    await expect(page.getByRole('heading', { name: 'Review and send' })).toBeVisible();
    await expect(page.getByText('Lincoln Elementary')).toBeVisible();
    await page.screenshot({ path: `test-results/beta-apply-review-${info.project.name}.png`, fullPage: true });
    await page.getByRole('button', { name: 'Send my application' }).click();
    await expect(page.getByRole('heading', { name: /Application Sent/i })).toBeVisible();
    await expect(page.getByText('If you are approved', { exact: false })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Start free', exact: true })).toHaveAttribute('href', '/login?mode=signup');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    expect(problems).toEqual([]);
    await page.goto('/owner');
    await page.locator('input[autocomplete="one-time-code"]').last().fill('2468');
    await expect(page.getByText('Type the same PIN again', { exact: false })).toBeVisible();
    await page.locator('input[autocomplete="one-time-code"]').last().fill('2468');
    await page.getByRole('navigation', { name: 'Dashboard sections' }).getByRole('button', { name: 'Beta test' }).click();
    const app = page.locator('[data-beta-app]').first();
    await expect(app.getByText('Ms. Rivera')).toBeVisible();
    await expect(app.getByText('Lincoln Elementary')).toBeVisible();
    await expect(app.getByText('9/9, agreed')).toBeVisible();
    await expect(app.getByText('3 of 3 signals')).toBeVisible();
    await app.screenshot({ path: `test-results/owner-beta-app-${info.project.name}.png` });
  });
  // Closed (Design Chair, 2026-11-26): after Feb 28, 2027 Eastern the form
  // is gone, Start free stays, and /beta hides its Apply links.
  test('beta closed: after the end date /beta/apply shows a closed card and /beta hides Apply', async ({ page }, info) => {
    await page.clock.setFixedTime(new Date('2027-03-02T12:00:00-05:00'));
    await page.goto('/beta/apply');
    const closed = page.locator('[data-beta-closed]');
    await expect(closed.getByRole('heading', { level: 1, name: /The Beta Has Ended/i })).toBeVisible();
    await expect(closed.getByRole('link', { name: 'Start free' })).toHaveAttribute('href', '/login?mode=signup');
    await expect(page.getByRole('button', { name: 'Next' })).toHaveCount(0);
    await page.screenshot({ path: `test-results/beta-closed-${info.project.name}.png` });
    await page.goto('/beta');
    await expect(page.getByRole('heading', { level: 1, name: /Join the Gamify Beta Test/i })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Apply to be a beta tester' })).toHaveCount(0);
    await expect(page.locator('#apply')).toHaveCount(0);
  });
  // The FAQ is merged into Help (owner 2026-11-26): /faq opens Help at Quick answers.
  test('Help: the old FAQ link lands on Quick answers, with tabs for each buyer and one search for tips and answers', async ({ page }) => {
    await page.goto('/faq?for=schools');
    await expect(page).toHaveURL(/\/help\?for=schools#faq$/);
    await expect(page.getByRole('heading', { level: 1, name: /^Help$/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Schools and districts' })).toHaveAttribute('aria-selected', 'true');
    await page.getByRole('tab', { name: 'Homeschool families' }).click();
    await page.getByText('I teach several ages at once. Does that work?').click();
    await expect(page.getByText('six-year-old practices letters', { exact: false })).toBeVisible();
    await page.getByLabel('Search help').fill('purchase order');
    await expect(page.getByText(/answers? found/)).toBeVisible();
    await expect(page.getByText('Can we pay with a purchase order?')).toBeVisible();
    await page.getByLabel('Search help').fill('');
    await page.getByRole('link', { name: /Question sets/ }).first().click();
    await expect(page).toHaveURL(/\/help\/question-sets$/);
  });
  test('schools, homeschool and student data pages link the way buyers need', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Schools and districts/ }).first().click();
    await expect(page.getByRole('heading', { level: 1, name: /Gamify for Schools and Districts/i })).toBeVisible();
    await page.getByRole('link', { name: /Student data promise/ }).first().click();
    await expect(page.getByRole('heading', { level: 1, name: /Our Student Data Promise/i })).toBeVisible();
    await page.goto('/homeschool');
    // The Homeschool plan lives on the Homeschool page, linked from Pricing.
    await expect(page.getByRole('link', { name: 'Get Homeschool' })).toBeVisible();
    // Three homeschool posts, then View all blog (owner 2026-11-26); no five-day week.
    await expect(page.locator('main a[href^="/blog/"]')).toHaveCount(3);
    await expect(page.getByText('One Question Set, Five Different Days')).toHaveCount(0);
    await page.getByRole('link', { name: 'View all blog' }).click();
    await expect(page).toHaveURL(/\/blog$/);
    await page.goto('/homeschool');
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

test('Theme Building Challenge: two tracks, and a printable permission slip for physical entries', async ({ page }, info) => {
  await page.goto('/challenge');
  await expect(page.getByRole('heading', { name: 'Two Ways to Enter' })).toBeVisible();
  // Physical or digital, any medium (owner, 2026-11-27).
  await expect(page.getByRole('heading', { name: 'Create physically' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Design digitally' })).toBeVisible();
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

test('every new page opens at the top, and the comparison chart lists every plan highlight', async ({ page }, info) => {
  const problems = watch(page);
  await page.goto('/blog');
  await expect(page.locator('main a[href^="/blog/"]').last()).toBeVisible();
  // Scroll down, follow a link: the next page opens at the top (teacher, 2026-10-31).
  await page.evaluate(() => window.scrollTo(0, 1500));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(200);
  await page.locator('main a[href^="/blog/"]').last().click();
  // No visual breadcrumb trail (teacher, 2026-11-08).
  await expect(page.getByRole('navigation', { name: 'You are here' })).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await page.goto('/pricing');
  // Short cards (teacher, 2026-11-25: "shorten each plan and then have a very
  // detailed comparison chart"): four lines each, then the chart has a row for
  // every highlight of every plan.
  await expect(page.getByText('A game for each student: pick the game and the questions, one student at a time')).toHaveCount(0);
  // The chart is "Compare Features", topics fold open (owner, 2026-11-27).
  await page.getByRole('link', { name: 'Compare features' }).first().click();
  await expect(page.getByRole('heading', { name: 'Compare Features' })).toBeVisible();
  for (const topic of ['Games and ways to play', 'Classes and students', 'Question sets', 'Themes and the Theme Builder', 'Live games and reports', 'Privacy and data']) {
    await expect(page.locator('#compare').getByText(topic, { exact: true }).first()).toBeAttached();
  }
  await page.screenshot({ path: `test-results/pricing-plans-${info.project.name}.png`, fullPage: true });
  expect(problems).toEqual([]);
});
