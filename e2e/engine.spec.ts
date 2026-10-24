import { test, expect } from '@playwright/test';
import { LIBRARY } from '../src/data/library';
import { finishSetup, openSetup } from './setup';

const answers = new Map(LIBRARY.flatMap((s) => s.questions.map((q) => [q.prompt, q.choices[q.correctIndex]] as const)));

test('Star Quiz plays start to finish through the shared engine', async ({ page }, info) => {
  test.setTimeout(120_000);
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(m.text()); });
  page.on('pageerror', (e) => problems.push(e.message));

  await openSetup(page, '/games/star-quiz');
  await page.getByRole('radio', { name: /^Animals and habitats/ }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('slider', { name: 'Questions' }).fill('5');
  await finishSetup(page);

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
    const buttons = dialog.getByRole('button', { name: /^[A-D] / });
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
    if (rights === 3 && info.project.name === 'ipad-portrait') {
      // Frame check: the new star pops in and the sky's items slowly turn.
      for (let f = 0; f < 6; f++) { await page.screenshot({ path: `test-results/sky-frame-${f}.png` }); await page.waitForTimeout(120); }
    }
    if (rights < 5) await expect(dialog.getByText('You got it!')).toBeHidden({ timeout: 4000 });
  }

  await expect(page.getByText('You caught 5 stars!')).toBeVisible({ timeout: 5000 });
  await page.screenshot({ path: `test-results/sky-end-${info.project.name}.png` });
  await expect(page.getByRole('heading', { name: "Let's Look Back" })).toBeVisible();
  await expect(page.getByText(/^Right answer:/)).toHaveCount(1);
  await page.screenshot({ path: `test-results/lookback-${info.project.name}.png`, fullPage: true });
  expect(problems).toEqual([]);
});

test('settings panel opens from the gear and changes text size', async ({ page }, info) => {
  await page.goto('/games/star-quiz');
  await page.getByRole('button', { name: 'Settings' }).click();
  const panel = page.getByRole('dialog', { name: 'Settings' });
  await expect(panel).toBeVisible();
  await panel.getByRole('tab', { name: 'Reading' }).click();
  await panel.getByRole('radiogroup', { name: 'Text size' }).getByRole('radio', { name: 'Larger' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-text-size', 'larger');
  await panel.getByRole('tab', { name: 'Calm' }).click();
  await panel.getByRole('switch', { name: 'Calm mode' }).click();
  await panel.getByRole('tab', { name: 'Sound' }).click();
  await panel.getByLabel('Sound effects').fill('5');
  await expect(panel.getByText('5', { exact: true })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'still');
  await page.screenshot({ path: `test-results/settings-${info.project.name}.png` });
  await panel.getByRole('tab', { name: 'Tell us' }).click();
  await panel.getByRole('radio', { name: 'I have an idea' }).click();
  await panel.getByLabel('Tell us more (you can skip this)').fill('More space games please');
  await panel.getByRole('button', { name: 'Send' }).click();
  await expect(panel.getByText('Thank you! We read every message.')).toBeVisible();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-text-size', 'larger');
});

test('Question Tracker: every star stays in view around the question box', async ({ page }, info) => {
  test.setTimeout(120_000);
  await page.addInitScript(() => localStorage.setItem('gamify:settings', JSON.stringify({ readFirstSeconds: 0 })));
  await openSetup(page, '/games/star-quiz');
  await page.getByRole('radio', { name: /^Animals and habitats/ }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('slider', { name: 'Questions' }).fill('12');
  await finishSetup(page);
  const dialog = page.getByRole('dialog');
  for (let n = 0; n < 11; n++) {
    await expect(dialog.getByText('Read the question')).toBeHidden({ timeout: 6000 });
    const prompt = (await dialog.getByRole('heading', { level: 2 }).innerText()).trim();
    const buttons = dialog.getByRole('button', { name: /^[A-D] / });
    const labels = await buttons.allInnerTexts();
    await buttons.nth(labels.findIndex((l) => l.trim().endsWith(answers.get(prompt)!))).click();
    await expect(dialog.getByRole('heading', { level: 2, name: prompt, exact: true })).toHaveCount(0, { timeout: 6000 });
  }
  await expect(dialog.getByRole('heading', { level: 2 })).toBeVisible();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `test-results/sky-${info.project.name}.png` });
  const box = (await dialog.locator('> div').first().boundingBox())!;
  const stars = await page.locator('[role=img] svg, [role=img] > span > img').evaluateAll((els) => els.map((e) => e.getBoundingClientRect()).map((r) => ({ x: r.x, y: r.y, w: r.width, h: r.height })));
  expect(stars.length).toBe(11);
  for (const s of stars) {
    const overlap = s.x < box.x + box.width && s.x + s.w > box.x && s.y < box.y + box.height && s.y + s.h > box.y;
    expect(overlap, JSON.stringify({ s, box })).toBe(false);
  }
});
