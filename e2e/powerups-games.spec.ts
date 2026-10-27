import { test, expect } from '@playwright/test';
import { LIBRARY } from '../src/data/library';
import { finishSetup, openSetup } from './setup';

const answers = new Map(LIBRARY.flatMap((s) => s.questions.map((q) => [q.prompt.trim(), q.choices[q.correctIndex]] as const)));

// With luck forced on (every roll low), a right answer brings a power-up
// and it pops up with its picture, name and what it does.
for (const g of [
  { id: 'peg-drop', name: /(Golden Ball|Prize Bag|Twin Ball)/ },
  { id: 'lunch-rush', name: /(Extra Plate|Tip Jar|Double Star)/ },
]) {
  test(`${g.id}: a right answer can bring a power-up`, async ({ page }, info) => {
    await page.addInitScript(() => { Math.random = () => 0.05; if (!localStorage.getItem('gamify:settings')) localStorage.setItem('gamify:settings', JSON.stringify({ tier: 'plus' })); });
    const problems: string[] = [];
    page.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()); });
    await openSetup(page, `/games/${g.id}`);
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await page.getByRole('radio', { name: 'Just me' }).click();
    await expect(page.getByRole('switch', { name: /Power-ups/ })).toHaveAttribute('aria-checked', 'true');
    await finishSetup(page);
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Read the question')).toBeHidden({ timeout: 8000 });
    const prompt = (await dialog.getByRole('heading', { level: 2 }).innerText()).trim();
    const buttons = dialog.getByRole('button', { name: /^[A-D] / });
    const labels = (await buttons.allInnerTexts()).map((l) => l.trim());
    await buttons.nth(labels.findIndex((l) => l.endsWith(answers.get(prompt)!))).click();
    await expect(page.getByRole('status').filter({ hasText: g.name })).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: `test-results/powerup-${g.id}-${info.project.name}.png` });
    expect(problems).toEqual([]);
  });
}
