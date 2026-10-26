import { test, expect, type Page } from '@playwright/test';
import { LIBRARY } from '../src/data/library';

const answers = new Map(LIBRARY.flatMap((s) => s.questions.map((q) => [q.prompt.trim(), q.choices[q.correctIndex]] as const)));

async function answerRight(page: Page) {
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Read the question')).toBeHidden({ timeout: 8000 });
  const prompt = (await dialog.getByRole('heading', { level: 2 }).innerText()).trim();
  const buttons = dialog.getByRole('button', { name: /^[A-D] / });
  const labels = (await buttons.allInnerTexts()).map((l) => l.trim());
  await buttons.nth(labels.findIndex((l) => l.endsWith(answers.get(prompt)!))).click();
  await expect(dialog.getByRole('heading', { level: 2, name: prompt, exact: true })).toHaveCount(0, { timeout: 8000 });
}

// Question Tracker with the class: each student's stars in their own color
// fill one sky on the big screen; first to 2 right ends it.
test('Question Tracker class sky: star colors, first to a number right ends it', async ({ page, context }, info) => {
  test.setTimeout(120_000);
  await page.addInitScript(() => { if (!localStorage.getItem('gamify:settings')) localStorage.setItem('gamify:settings', JSON.stringify({ tier: 'plus' })); });
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()); });
  await page.goto('/teacher/sets');
  await page.getByRole('tab', { name: 'Ready-made sets' }).click();
  await page.getByRole('button', { name: 'Play or share' }).first().click();
  await page.getByRole('radio', { name: /Question Tracker/ }).click();
  await page.getByRole('button', { name: 'Host a live game' }).click();
  const code = (await page.getByLabel(/^Game code [A-Z]{5}$/).getAttribute('aria-label'))!.replace(/\W/g, '').slice(-5);
  await page.getByRole('radio', { name: 'First to a number right' }).click();
  await page.getByLabel('Right answers').fill('2');

  const kid = await context.newPage();
  kid.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()); });
  await kid.goto(`/join/${code}`);
  await kid.getByRole('button', { name: /Play/ }).last().click();
  await page.getByRole('button', { name: /^Let (?!everyone).* in$/ }).click();
  await expect(kid.getByText('Your star color')).toBeVisible();
  await kid.screenshot({ path: `test-results/sky-kid-lobby-${info.project.name}.png` });
  await page.getByRole('button', { name: /Start the game/ }).click();
  await expect(kid).toHaveURL(/\/games\/star-quiz\?set=/);
  await kid.getByRole('button', { name: 'Set up and play' }).click();
  for (;;) {
    const next = kid.getByRole('button', { name: 'Next', exact: true });
    if (!(await next.isVisible())) break;
    await next.click();
  }
  await kid.getByRole('button', { name: 'Play', exact: true }).click();
  await answerRight(kid);
  await expect(page.getByRole('img', { name: '1 stars in the class sky' })).toBeVisible({ timeout: 8000 });
  await page.screenshot({ path: `test-results/sky-host-${info.project.name}.png` });
  expect(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)).toBeLessThanOrEqual(1);
  await kid.screenshot({ path: `test-results/sky-kid-${info.project.name}.png` });
  await answerRight(kid);
  await expect(page.getByRole('heading', { name: 'The Winners' })).toBeVisible({ timeout: 8000 });
  expect(problems).toEqual([]);
});
