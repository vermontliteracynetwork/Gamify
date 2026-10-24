import { expect, type Page } from '@playwright/test';
import { LIBRARY } from '../src/data/library';

const answers = new Map(LIBRARY.flatMap((s) => s.questions.map((q) => [q.prompt, q.choices[q.correctIndex]] as const)));

// Taps an answer on the big team question: the right one, or a wrong one.
export async function answerShare(page: Page, right = true) {
  const dialog = page.getByRole('dialog');
  const prompt = (await dialog.getByRole('heading', { level: 2 }).innerText()).trim();
  const buttons = dialog.getByRole('button', { name: /^[A-D] / });
  const labels = (await buttons.allInnerTexts()).map((l) => l.trim());
  const correct = labels.findIndex((l) => l.endsWith(answers.get(prompt)!));
  await buttons.nth(right ? correct : (correct + 1) % labels.length).click();
  await expect(page.getByRole('heading', { level: 2, name: prompt, exact: true })).toHaveCount(0, { timeout: 5000 });
}

// Every game opens on its cover welcome screen, then the theme screen; this
// goes past both to the setup pages.
export async function openSetup(page: Page, path: string) {
  await page.goto(path);
  await page.getByRole('button', { name: 'Set up and play' }).click();
  await expect(page.getByRole('heading', { name: 'Pick a Theme' })).toBeVisible();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByRole('heading', { name: /^Step 1 of \d+:/ })).toBeVisible();
}

// Next through the remaining setup pages, then Play.
export async function finishSetup(page: Page) {
  for (;;) {
    const next = page.getByRole('button', { name: 'Next', exact: true });
    if (!(await next.isVisible())) break;
    await next.click();
  }
  await page.getByRole('button', { name: 'Play', exact: true }).click();
}
