import { test, expect } from '@playwright/test';
import { LIBRARY } from '../src/data/library';

const answers = new Map(LIBRARY.flatMap((s) => s.questions.map((q) => [q.prompt.trim(), q.choices[q.correctIndex]] as const)));

// Territory (teacher, 2026-11-24): the class screen opens the live lobby, a
// student joins and answers on their own device, and a cat catches a mouse
// on the big screen.
test('Territory: the class screen opens the lobby, a student answers, a mouse is caught', async ({ page, context }, info) => {
  test.setTimeout(120_000);
  await page.addInitScript(() => { if (!localStorage.getItem('gamify:settings')) localStorage.setItem('gamify:settings', JSON.stringify({ tier: 'plus' })); });
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()); });
  page.on('pageerror', (e) => problems.push(e.message));

  await page.goto('/games/territory');
  await page.getByRole('button', { name: 'Set up and play' }).click();
  if (await page.getByRole('heading', { name: 'Pick a Theme' }).isVisible()) await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByRole('heading', { name: /^Step 1 of \d+:/ })).toBeVisible();
  // How the class plays starts unpicked (2026-11-24): tap Cooperative first.
  await page.getByRole('radio', { name: /^Cooperative/ }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  // Mice come out quickly, so the test does not wait long for one.
  await page.getByRole('radio', { name: 'Fast' }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: 'Open the live lobby' }).click();
  await expect(page).toHaveURL(/\/teacher\/live\/[A-Z]{5}/);
  const code = (await page.getByLabel(/^Game code [A-Z]{5}$/).getAttribute('aria-label'))!.replace(/\W/g, '').slice(-5);

  const kid = await context.newPage();
  kid.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()); });
  kid.on('pageerror', (e) => problems.push(e.message));
  await kid.goto(`/join/${code}`);
  await kid.getByRole('button', { name: /Play/ }).last().click();
  await page.getByRole('button', { name: /^Let (?!everyone).* in$/ }).click();
  await expect(kid.getByRole('heading', { name: 'You Are In!' })).toBeVisible();
  await page.getByRole('button', { name: /Start the game/ }).click();
  await expect(kid).toHaveURL(/\/games\/territory/);

  // The student answers right on their own device; the card waits for a tap.
  const dialog = kid.getByRole('dialog');
  await expect(dialog.getByText('Read the question')).toBeHidden({ timeout: 10_000 });
  const prompt = (await dialog.getByRole('heading', { level: 2 }).innerText()).trim();
  const buttons = dialog.getByRole('button', { name: /^[A-D] / });
  const labels = (await buttons.allInnerTexts()).map((l) => l.trim());
  await buttons.nth(labels.findIndex((l) => l.endsWith(answers.get(prompt)!))).click();
  const reward = kid.getByRole('dialog', { name: 'Your cat is chasing a mouse!' });
  await expect(reward).toBeVisible({ timeout: 10_000 });
  await kid.screenshot({ path: `test-results/territory-kid-${info.project.name}.png` });

  // On the class screen a cat catches a mouse (one comes out if none is in yet).
  await expect(page.getByRole('progressbar', { name: 'Mice caught toward the class goal' })).toHaveAttribute('aria-valuenow', '1', { timeout: 30_000 });
  await page.screenshot({ path: `test-results/territory-host-${info.project.name}.png` });
  await reward.getByRole('button', { name: 'Next question' }).click();
  await expect(reward).toHaveCount(0);
  expect(problems).toEqual([]);
});
