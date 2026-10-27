import { test, expect } from '@playwright/test';

test('a class check-in counts picture taps, with no names', async ({ page }, info) => {
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(m.text()); });
  await page.addInitScript(() => {
    if (localStorage.getItem('gamify:classrooms')) return;
    localStorage.setItem('gamify:classrooms', JSON.stringify([{ id: 'c1', name: 'Room 7', ownerId: 'local-teacher', createdAt: '', joinCode: 'BCDFG' }]));
  });
  await page.goto('/teacher/classes/c1/check-in');
  await expect(page.getByRole('heading', { name: /How did today feel/i })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight - (document.getElementById('teacher-footer')?.getBoundingClientRect().height ?? 0))).toBeLessThanOrEqual(1);
  await page.waitForTimeout(700);
  await page.screenshot({ path: `test-results/checkin-${info.project.name}.png` });
  for (const [a, b] of [['Great', 'Just right'], ['Okay', 'Tricky']]) {
    await page.getByRole('button', { name: a, exact: true }).click();
    await page.getByRole('button', { name: b, exact: true }).click();
    await expect(page.getByText('Thank you! Next friend!')).toBeVisible();
    await expect(page.getByRole('heading', { name: /How did today feel/i })).toBeVisible({ timeout: 4000 });
  }
  await expect(page.getByText('2 students checked in')).toBeVisible();
  await page.getByRole('button', { name: 'Finish (teacher)' }).click();
  await expect(page.getByRole('heading', { name: /Check-in Results/i })).toBeVisible();
  await page.screenshot({ path: `test-results/checkin-results-${info.project.name}.png` });
  expect(problems).toEqual([]);
});

test('the week 1 teacher survey appears in the menu, and its answers reach the owner dashboard', async ({ page }, info) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    const s = JSON.parse(localStorage.getItem('gamify:settings') ?? '{}');
    s['beta-first-use'] = new Date(Date.now() - 8 * 86400000).toISOString();
    localStorage.setItem('gamify:settings', JSON.stringify(s));
  });
  await page.goto('/teacher/reports');
  await page.getByRole('button', { name: 'Quick survey' }).click();
  await expect(page.getByRole('heading', { name: /One week in/i })).toBeVisible();
  await page.getByRole('radio', { name: 'Really well' }).click();
  await page.getByRole('radio', { name: '9', exact: true }).click();
  await page.getByLabel('What would make Gamify better for you? (optional)').fill('More science sets');
  await page.screenshot({ path: `test-results/survey-${info.project.name}.png` });
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(page.getByText('Thank you!')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Quick survey' })).toHaveCount(0, { timeout: 4000 });
  await page.goto('/owner');
  for (const d of '2468') await page.getByRole('button', { name: d, exact: true }).click();
  await expect(page.getByText('Type the same PIN again', { exact: false })).toBeVisible();
  for (const d of '2468') await page.getByRole('button', { name: d, exact: true }).click();
  const card = page.getByRole('region', { name: 'Beta and surveys' });
  await expect(card.getByText('More science sets')).toBeVisible();
  await expect(card.getByText('5.0 / 5')).toBeVisible();
  await card.screenshot({ path: `test-results/owner-beta-${info.project.name}.png` });
});

test('owner dashboard shows growth tips from the numbers', async ({ page }) => {
  await page.goto('/owner');
  for (const d of '2468') await page.getByRole('button', { name: d, exact: true }).click();
  await expect(page.getByText('Type the same PIN again', { exact: false })).toBeVisible();
  for (const d of '2468') await page.getByRole('button', { name: d, exact: true }).click();
  const card = page.getByRole('region', { name: 'Growth tips' });
  await expect(card.getByText(/no class or set yet|Nothing to act on/)).toBeVisible();
  await card.screenshot({ path: `test-results/owner-growth-${test.info().project.name}.png` });
});

test('a teacher asks for help with Tell Gamify, and it reaches the owner dashboard', async ({ page }) => {
  await page.goto('/teacher/classes');
  await page.getByRole('button', { name: 'Tell Gamify about a problem or an idea' }).click();
  await page.getByRole('radio', { name: 'I need help' }).click();
  await page.getByLabel('Tell us more (you can skip this)').fill('How do I print the theme template?');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.getByText('Thank you! We read every message.')).toBeVisible();
  await page.goto('/owner');
  for (const d of '2468') await page.getByRole('button', { name: d, exact: true }).click();
  await expect(page.getByText('Type the same PIN again', { exact: false })).toBeVisible();
  for (const d of '2468') await page.getByRole('button', { name: d, exact: true }).click();
  const card = page.getByRole('region', { name: 'Tell Gamify reports' });
  await card.getByRole('radio', { name: /Help requests \(1\)/ }).click();
  await expect(card.getByText('How do I print the theme template?')).toBeVisible();
});

test('developer dashboard: bookkeeping with totals and CSV, plan preview with a banner', async ({ page }, info) => {
  await page.goto('/owner');
  for (const d of '2468') await page.getByRole('button', { name: d, exact: true }).click();
  await expect(page.getByText('Type the same PIN again', { exact: false })).toBeVisible();
  for (const d of '2468') await page.getByRole('button', { name: d, exact: true }).click();
  await expect(page.getByRole('region', { name: 'Subscriptions' })).toContainText('Real numbers show here once the cloud is connected.');
  const books = page.getByRole('region', { name: 'Bookkeeping' });
  await books.getByLabel('Category').selectOption('Hosting');
  await books.getByLabel('What it was').fill('Vercel Pro');
  await books.getByLabel('Amount ($)').fill('20');
  await books.getByRole('button', { name: 'Add' }).click();
  await books.getByLabel('In or out').first().selectOption('in');
  await books.getByLabel('Category').selectOption('Subscriptions');
  await books.getByLabel('What it was').fill('Plus, Miss Jen');
  await books.getByLabel('Amount ($)').fill('96');
  await books.getByRole('button', { name: 'Add' }).click();
  await expect(books.getByText('In $96.00, out $20.00, net $76.00')).toBeVisible();
  const wait = page.waitForEvent('download');
  await books.getByRole('button', { name: 'Download CSV' }).click();
  expect((await wait).suggestedFilename()).toMatch(/^gamify-books-\d{4}\.csv$/);
  await books.screenshot({ path: `test-results/owner-books-${info.project.name}.png` });

  const preview = page.getByRole('region', { name: 'Plan preview' });
  await preview.getByRole('radio', { name: 'Pro' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Previewing the Pro plan' })).toBeVisible();
  await page.goto('/teacher/account');
  await expect(page.getByRole('status').filter({ hasText: 'Previewing the Pro plan' })).toBeVisible();
  await page.getByRole('button', { name: 'Stop preview' }).click();
  await expect(page.getByText('Previewing the Pro plan')).toHaveCount(0);
});
