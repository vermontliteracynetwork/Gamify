import { test, expect } from '@playwright/test';

// The live lobby (teacher, 2026-10-26): how the class plays, groups with
// their own game, and each student's own question set. Two tabs on one
// device here; the same messages cross devices through the cloud.
test('lobby: play together toward a goal, a second group with its own game, a set for each student', async ({ page, context }, info) => {
  test.setTimeout(90_000);
  await page.addInitScript(() => { if (!localStorage.getItem('gamify:settings')) localStorage.setItem('gamify:settings', JSON.stringify({ tier: 'plus' })); });
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()); });

  await page.goto('/teacher/sets');
  await page.getByRole('tab', { name: 'Ready-made sets' }).click();
  await page.getByRole('button', { name: 'Play or share' }).first().click();
  await page.getByRole('radio', { name: /Cast and Catch/ }).click();
  await page.getByRole('button', { name: 'Host a live game' }).click();
  const code = (await page.getByLabel(/^Game code [A-Z]{5}$/).getAttribute('aria-label'))!.replace(/\W/g, '').slice(-5);

  const kid = await context.newPage();
  kid.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()); });
  await kid.goto(`/join/${code}`);
  await kid.getByRole('button', { name: /Play/ }).last().click();
  await page.getByRole('button', { name: /^Let (?!everyone).* in$/ }).click();
  await expect(kid.getByRole('heading', { name: 'You Are In!' })).toBeVisible();

  await page.getByRole('radio', { name: /^Together/ }).click();
  await page.getByLabel('Class goal (right answers)').fill('25');
  await page.getByRole('button', { name: 'Add a group' }).click();
  await page.getByLabel('Game for group 2').selectOption({ label: 'Flashcards' });
  const name = (await page.getByLabel(/^Question set for /).getAttribute('aria-label'))!.replace('Question set for ', '');
  await page.getByLabel(`Group for ${name}`).selectOption({ label: 'Group 2' });
  const sets = page.getByLabel(`Question set for ${name}`);
  const other = (await sets.locator('option').nth(2).getAttribute('value'))!;
  await sets.selectOption(other);
  await page.screenshot({ path: `test-results/lobby-${info.project.name}.png`, fullPage: true });
  await page.getByRole('button', { name: /Start the game/ }).click();
  // The student lands in their group's game with their own set.
  await expect(kid).toHaveURL(new RegExp(`/games/flashcards\\?set=${other}`));
  await expect(page.getByText('Together: 0 of 25 right answers')).toBeVisible();
  expect(problems).toEqual([]);
});
