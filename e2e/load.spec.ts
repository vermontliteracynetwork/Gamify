import { test, expect } from '@playwright/test';

// Stage 6 load test: 30 students in one live game, messages arriving with
// network-style jitter. The host must let them in, start, keep the board
// right and stay responsive (no long freezes).
test('live load: 30 students join and answer; the host keeps up', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'laptop', 'one run is enough; the host is the teacher computer');
  test.setTimeout(120_000);
  await page.addInitScript(() => { if (!localStorage.getItem('gamify:settings')) localStorage.setItem('gamify:settings', JSON.stringify({ tier: 'pro' })); });
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()); });
  await page.goto('/teacher/sets');
  await page.getByRole('tab', { name: 'Ready-made sets' }).click();
  await page.getByRole('button', { name: 'Play or share' }).first().click();
  await page.getByRole('radio', { name: /Cast and Catch/ }).click();
  await page.getByRole('button', { name: 'Host a live game' }).click();
  const code = (await page.getByLabel(/^Game code [A-Z]{5}$/).getAttribute('aria-label'))!.replace(/\W/g, '').slice(-5);
  // Long tasks on the host (main thread busy over 50 ms).
  await page.evaluate(() => { (window as unknown as { longTasks: number[] }).longTasks = []; new PerformanceObserver((l) => l.getEntries().forEach((e) => (window as unknown as { longTasks: number[] }).longTasks.push(e.duration))).observe({ type: 'longtask', buffered: false }); });

  // One page plays all 30 students over the same channel real devices use.
  const crowd = await context.newPage();
  await crowd.goto('/');
  const send = (msgs: unknown[], jitter: number) => crowd.evaluate(async ([c, list, j]) => {
    const ch = new BroadcastChannel(`gamify-live-${c}`);
    await Promise.all((list as unknown[]).map((m) => new Promise<void>((done) => setTimeout(() => { ch.postMessage({ id: crypto.randomUUID(), m }); done(); }, Math.random() * (j as number)))));
    ch.close();
  }, [code, msgs, jitter] as const);

  const kids = Array.from({ length: 30 }, (_, i) => ({ pid: `p${i}`, name: `Student ${String(i + 1).padStart(2, '0')}` }));
  await send(kids.map((k) => ({ t: 'join', ...k })), 1500);
  await expect(page.getByText('30 waiting to come in')).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'Let everyone in' }).click();
  await expect(page.getByText('30 players in')).toBeVisible();
  await page.getByRole('button', { name: /Start the game/ }).click();

  // Ten answers each over about eight seconds; student k gets k % 11 right.
  const t0 = Date.now();
  const rounds = Array.from({ length: 10 }, (_, a) => kids.map((k, i) => ({ t: 'progress', pid: k.pid, round: 1, answered: a + 1, right: Math.min(a + 1, i % 11), askedAt: null })));
  for (const r of rounds) await send(r, 800);
  // Student 11 (index 10) and student 22 (index 21) end with 10 right.
  const board = page.getByRole('list', { name: 'Leaderboard' });
  await expect(board.getByText('Student 11')).toBeVisible({ timeout: 5000 });
  await expect(board.locator('li').first()).toContainText('10');
  const caughtUp = Date.now() - t0;
  await page.getByRole('tab', { name: 'My monitor' }).click();
  await expect(page.getByRole('list', { name: 'Players' }).getByRole('listitem')).toHaveCount(30);
  const longest = await page.evaluate(() => Math.max(0, ...(window as unknown as { longTasks: number[] }).longTasks));
  console.log(`load: 30 students, 330 messages, host caught up in ${caughtUp} ms, longest main-thread task ${Math.round(longest)} ms`);
  await page.screenshot({ path: 'test-results/load-monitor.png' });
  expect(longest).toBeLessThan(500);
  expect(problems).toEqual([]);
});
