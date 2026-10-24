import { test, expect } from '@playwright/test';
import { LIBRARY } from '../src/data/library';

const answers = new Map(LIBRARY.flatMap((s) => s.questions.map((q) => [q.prompt, q.choices[q.correctIndex]] as const)));

test('Star Quiz plays start to finish through the shared engine', async ({ page }, info) => {
  test.setTimeout(120_000);
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(m.text()); });
  page.on('pageerror', (e) => problems.push(e.message));

  await page.goto('/games/star-quiz');
  await page.getByLabel('Question set').selectOption('lib-animals');
  for (let i = 0; i < 5; i++) await page.getByRole('button', { name: 'Fewer Questions' }).click();
  await expect(page.getByText('5', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Play' }).click();

  // Read first: answers can't be tapped yet.
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Read the question')).toBeVisible();
  await page.screenshot({ path: `test-results/question-readfirst-${info.project.name}.png` });

  // Miss once on purpose, then answer right 5 times.
  let missedOnce = false;
  let rights = 0;
  while (rights < 5) {
    await expect(dialog.getByText('Read the question')).toBeHidden({ timeout: 6000 });
    const prompt = (await dialog.getByRole('heading', { level: 2 }).innerText()).trim();
    const right = answers.get(prompt)!;
    const buttons = dialog.getByRole('button', { name: /^Answer [A-D]:/ });
    const labels = await buttons.allInnerTexts();
    const rightIdx = labels.findIndex((l) => l.trim().endsWith(right));
    if (!missedOnce) {
      await buttons.nth(rightIdx === 0 ? 1 : 0).click();
      await expect(dialog.getByText('Not this one. Here comes a new question.')).toBeVisible();
      await page.screenshot({ path: `test-results/question-miss-${info.project.name}.png` });
      missedOnce = true;
      await expect(dialog.getByText('Not this one. Here comes a new question.')).toBeHidden({ timeout: 4000 });
      continue;
    }
    await buttons.nth(rightIdx).click();
    await expect(dialog.getByText('You got it!')).toBeVisible();
    rights++;
    if (rights < 5) await expect(dialog.getByText('You got it!')).toBeHidden({ timeout: 4000 });
  }

  await expect(page.getByText('You caught 5 stars!')).toBeVisible({ timeout: 5000 });
  await expect(page.getByRole('heading', { name: "Let's look back" })).toBeVisible();
  await expect(page.getByText(/^Right answer:/)).toHaveCount(1);
  await page.screenshot({ path: `test-results/lookback-${info.project.name}.png`, fullPage: true });
  expect(problems).toEqual([]);
});

test('settings panel opens from the gear and changes text size', async ({ page }, info) => {
  await page.goto('/games/star-quiz');
  await page.getByRole('button', { name: 'Settings' }).click();
  const panel = page.getByRole('dialog', { name: 'Settings' });
  await expect(panel).toBeVisible();
  await panel.getByRole('radiogroup', { name: 'Text size' }).getByRole('radio', { name: 'Larger' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-text-size', 'larger');
  await panel.getByRole('switch', { name: 'Calm mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'still');
  await page.screenshot({ path: `test-results/settings-${info.project.name}.png` });
  await panel.getByRole('radio', { name: 'I have an idea' }).click();
  await panel.getByLabel('Tell us more (you can skip this)').fill('More space games please');
  await panel.getByRole('button', { name: 'Send' }).click();
  await expect(panel.getByText('Thank you! We read every message.')).toBeVisible();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-text-size', 'larger');
});
