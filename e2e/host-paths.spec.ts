import { test, expect } from '@playwright/test';

// Play or share: how will you play? Big screen (teams), own devices
// (compete or together), or homework with a due date.
test('Play or share: big screen teams, own devices, homework with a due date', async ({ page }, info) => {
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()); });
  // Homework codes are Pro (owner, 2026-11-26).
  await page.addInitScript(() => { if (!localStorage.getItem('gamify:settings')) localStorage.setItem('gamify:settings', JSON.stringify({ tier: 'pro' })); });
  await page.goto('/teacher/sets');
  await page.getByRole('tab', { name: 'Public sets' }).click();
  await page.getByRole('button', { name: 'Play or share' }).first().click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('radio', { name: /Game Show/ }).click();
  await expect(dialog.getByRole('radio', { name: /On the big screen/ })).toHaveAttribute('aria-checked', 'true');
  await dialog.getByRole('radio', { name: /Whole class together/ }).click();
  await page.screenshot({ path: `test-results/host-screen-${info.project.name}.png` });

  await dialog.getByRole('radio', { name: /On their own devices/ }).click();
  await dialog.getByRole('radio', { name: /^Cooperative/ }).click();
  await page.screenshot({ path: `test-results/host-devices-${info.project.name}.png` });

  await dialog.getByRole('radio', { name: /As homework/ }).click();
  const date = dialog.getByLabel('Due');
  await expect(date).toBeVisible(); // Pro: any date ahead.
  await dialog.getByRole('button', { name: 'Make the homework link' }).click();
  await expect(dialog.getByText(/^Works through /)).toBeVisible();
  await page.screenshot({ path: `test-results/host-homework-${info.project.name}.png` });

  // Big screen, whole class: one team plus the computer.
  await dialog.getByRole('radio', { name: /On the big screen/ }).click();
  await dialog.getByRole('button', { name: 'Play now' }).click();
  await expect(page).toHaveURL(/teams=class/);
  await page.getByRole('button', { name: 'Set up and play' }).click();
  for (let i = 0; i < 6; i++) {
    await page.waitForTimeout(150);
    if (await page.getByRole('heading', { name: /Teams$/ }).isVisible()) break;
    const next = page.getByRole('button', { name: 'Next', exact: true });
    // Card-choice pages start unpicked (2026-11-24): Share keeps the teams path.
    if (await next.isDisabled()) await ((await page.getByRole('radio', { name: /^Share/ }).count()) ? page.getByRole('radio', { name: /^Share/ }) : page.getByRole('radio')).first().click();
    await next.click();
  }
  await expect(page.getByRole('radiogroup', { name: 'Who is the other side?' })).toBeVisible();
  expect(problems).toEqual([]);
});

test('Play or share: together on own devices opens the lobby on Together', async ({ page }) => {
  await page.addInitScript(() => { if (!localStorage.getItem('gamify:settings')) localStorage.setItem('gamify:settings', JSON.stringify({ tier: 'plus' })); });
  await page.goto('/teacher/sets');
  await page.getByRole('tab', { name: 'Public sets' }).click();
  await page.getByRole('button', { name: 'Play or share' }).first().click();
  await page.getByRole('radio', { name: /Question Tracker/ }).click();
  await page.getByRole('radio', { name: /^Cooperative/ }).click();
  await page.getByRole('button', { name: 'Host a live game' }).click();
  await expect(page).toHaveURL(/mode=together/);
  await expect(page.getByRole('radio', { name: /^Cooperative/ })).toHaveAttribute('aria-checked', 'true');
});
