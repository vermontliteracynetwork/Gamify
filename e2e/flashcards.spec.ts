import { test, expect } from '@playwright/test';
import { finishSetup, openSetup } from './setup';

test('Flashcards: flip, practice again brings the card back, then know them all', async ({ page }, info) => {
  test.setTimeout(60_000);
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(m.text()); });
  await openSetup(page, '/games/flashcards');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('slider', { name: 'Cards' }).fill('5');
  await finishSetup(page);
  const card = page.getByRole('button', { name: /^Question: / });
  await expect(card).toBeVisible();
  const firstQ = await card.getAttribute('aria-label');
  await card.click();
  await expect(page.getByRole('button', { name: /^Answer: / })).toBeVisible();
  await page.screenshot({ path: `test-results/flashcards-${info.project.name}.png` });
  await page.getByRole('button', { name: 'Practice again' }).click();
  await expect(page.getByText('0/5')).toBeVisible();
  for (let i = 0; i < 6; i++) {
    await page.getByRole('button', { name: /^Question: / }).click();
    await page.getByRole('button', { name: 'I knew it' }).click();
    if (await page.getByText('You know all 5 cards!').isVisible()) break;
  }
  await expect(page.getByText('You know all 5 cards!')).toBeVisible();
  await expect(page.getByText('You practiced 1 card until you knew it.')).toBeVisible();
  expect(firstQ).toBeTruthy();
  expect(problems).toEqual([]);
});
