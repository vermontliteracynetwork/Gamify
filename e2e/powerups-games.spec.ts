import { test, expect } from '@playwright/test';
import { LIBRARY } from '../src/data/library';
import { finishSetup, openSetup, showSetting, startTurn } from './setup';

const answers = new Map(LIBRARY.flatMap((s) => s.questions.map((q) => [q.prompt.trim(), q.choices[q.correctIndex]] as const)));

// With luck forced on (every roll low), a right answer brings a power-up
// and it pops up with its picture, name and what it does, until closed.
// Pinball is not here: since 2026-11-13 its power-ups come from stars the
// ball collects, not from a right answer.
for (const g of [
  { id: 'lunch-rush', way: /^Solo/, first: 'Extra Plate', name: /(Extra Plate|Tip Jar|Double Star)/ },
  // Bowling has no Solo (2026-11-20): it plays Share, one team.
  { id: 'bowling', way: undefined, first: 'Golden Pin', name: /(Golden Pin|Pin Magnet|Pin Twister|Bumper Rails|Fireball|Mystery Box|Sneaky Swipe)/ },
]) {
  test(`${g.id}: a right answer can bring a power-up`, async ({ page }, info) => {
    await page.addInitScript(() => { Math.random = () => 0.05; if (!localStorage.getItem('gamify:settings')) localStorage.setItem('gamify:settings', JSON.stringify({ tier: 'plus' })); });
    const problems: string[] = [];
    page.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()); });
    await openSetup(page, `/games/${g.id}`, g.way);
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    // Each power-up has its own switch (teacher, 2026-11-01); the first starts on.
    const first = page.getByRole('switch', { name: new RegExp(g.first) });
    await showSetting(page, first);
    await expect(first).toHaveAttribute('aria-checked', 'true');
    await finishSetup(page);
    await startTurn(page);
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Read the question')).toBeHidden({ timeout: 8000 });
    const prompt = (await dialog.getByRole('heading', { level: 2 }).innerText()).trim();
    const buttons = dialog.getByRole('button', { name: /^[A-D] / });
    const labels = (await buttons.allInnerTexts()).map((l) => l.trim());
    await buttons.nth(labels.findIndex((l) => l.endsWith(answers.get(prompt)!))).click();
    // The power-up card stays until it is closed (2026-11-13), as a dialog
    // named for the power-up.
    const card = page.getByRole('dialog', { name: g.name });
    await expect(card).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: `test-results/powerup-${g.id}-${info.project.name}.png` });
    await card.getByRole('button', { name: 'Close' }).click();
    await expect(card).toBeHidden();
    expect(problems).toEqual([]);
  });
}
