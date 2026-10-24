import { test, expect } from '@playwright/test';
import { LIBRARY } from '../src/data/library';
import { finishSetup, openSetup } from './setup';

const answers = new Map(LIBRARY.flatMap((s) => s.questions.map((q) => [q.prompt, q.choices[q.correctIndex]] as const)));

test('Match Up: link questions to answers; a wrong link wobbles; finish with a time', async ({ page }, info) => {
  test.setTimeout(60_000);
  await page.addInitScript(() => { if (!localStorage.getItem('gamify:settings')) localStorage.setItem('gamify:settings', JSON.stringify({ tier: 'plus' })); });
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(m.text()); });
  await openSetup(page, '/games/match-up');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('radiogroup', { name: 'Pairs each round' }).getByRole('radio', { name: '4' }).click();
  await page.getByRole('radiogroup', { name: 'Rounds' }).getByRole('radio', { name: '1' }).click();
  await finishSetup(page);
  expect(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)).toBeLessThanOrEqual(1);
  const tiles = page.locator('main button[aria-pressed]');
  await expect(tiles).toHaveCount(8);
  await page.screenshot({ path: `test-results/matchup-${info.project.name}.png` });
  const texts = await tiles.allInnerTexts();
  const qs = texts.slice(0, 4), as = texts.slice(4);
  // One wrong link first.
  const wrong = as.find((a) => a !== answers.get(qs[0].trim()))!;
  await tiles.nth(0).click();
  await tiles.nth(4 + as.indexOf(wrong)).click();
  await expect(page.getByText('0 of 4 matched')).toBeVisible();
  for (let i = 0; i < 4; i++) {
    await tiles.nth(i).click();
    await tiles.nth(4 + as.findIndex((a) => a.trim() === answers.get(qs[i].trim()))).click();
  }
  if (info.project.name === 'ipad-portrait') await page.screenshot({ path: 'test-results/matchup-done.png' });
  await expect(page.getByText(/^All Matched in \d+:\d\d!$/)).toBeVisible();
  await expect(page.getByText('1 try missed.', { exact: false })).toBeVisible();
  expect(problems).toEqual([]);
});
