import { test, expect } from '@playwright/test';

// Class Live across two tabs on one device (the same messages go across
// devices once the cloud connects).
test('live game: lobby with name approval, start, monitor and lock, pause, podium', async ({ page, context }, info) => {
  test.setTimeout(90_000);
  await page.addInitScript(() => { if (!localStorage.getItem('gamify:settings')) localStorage.setItem('gamify:settings', JSON.stringify({ tier: 'plus' })); });
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()); });

  await page.goto('/teacher/sets');
  await page.getByRole('tab', { name: 'Ready-made sets' }).click();
  await page.getByRole('button', { name: 'Play or share' }).first().click();
  await page.getByRole('radio', { name: /Cast and Catch/ }).click();
  await page.getByRole('button', { name: 'Host a live game' }).click();
  await expect(page.getByRole('heading', { name: /Live: Cast and Catch/ })).toBeVisible();
  const code = (await page.getByLabel(/^Game code [A-Z]{5}$/).getAttribute('aria-label'))!.replace(/\W/g, '').slice(-5);

  const kid = await context.newPage();
  kid.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()); });
  await kid.goto(`/join/${code}`);
  await kid.getByRole('button', { name: /Play/ }).last().click();
  await expect(kid.getByRole('heading', { name: 'Almost In!' })).toBeVisible();

  await expect(page.getByText('1 waiting to come in')).toBeVisible();
  await page.getByRole('button', { name: /^Let (?!everyone).* in$/ }).click();
  await expect(kid.getByRole('heading', { name: 'You Are In!' })).toBeVisible();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `test-results/live-lobby-${info.project.name}.png` });
  await page.getByRole('button', { name: /Start the game/ }).click();
  await expect(kid).toHaveURL(/\/games\/cast-catch\?set=/);

  await page.getByRole('tab', { name: 'My monitor' }).click();
  await page.getByRole('button', { name: 'Eyes on me, please.' }).click();
  await page.getByRole('button', { name: 'Lock all' }).click();
  await expect(kid.getByRole('dialog', { name: 'Eyes on Your Teacher' })).toBeVisible();
  await expect(kid.getByText('Eyes on me, please.')).toBeVisible();
  await kid.screenshot({ path: `test-results/live-locked-${info.project.name}.png` });
  await page.getByRole('button', { name: 'Unlock all' }).click();
  await expect(kid.getByRole('dialog', { name: 'Eyes on Your Teacher' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Pause all' }).click();
  await expect(kid.getByRole('dialog', { name: 'Paused' })).toBeVisible();
  await page.getByRole('button', { name: 'Resume' }).click();
  await expect(kid.getByRole('dialog', { name: 'Paused' })).toHaveCount(0);

  await page.getByRole('tab', { name: 'Big screen' }).click();
  await page.screenshot({ path: `test-results/live-screen-${info.project.name}.png` });
  await page.getByRole('button', { name: 'End game' }).click();
  await expect(page.getByRole('heading', { name: 'The Winners' })).toBeVisible();
  await expect(kid.getByRole('dialog', { name: 'Game Over!' })).toBeVisible();
  await kid.screenshot({ path: `test-results/live-podium-kid-${info.project.name}.png` });
  expect(problems).toEqual([]);
});
