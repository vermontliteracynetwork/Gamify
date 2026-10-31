import { test, expect } from '@playwright/test';
import { LIBRARY } from '../src/data/library';
import { HOW_TO_PLAY } from '../src/public/howToPlay';
import { finishSetup, openSetup } from './setup';

// Screenshots for the How to Play articles (public/help/<game>-<shot>.png),
// taken from the real games at a laptop size. Run on purpose only:
//   HELP_SHOTS=1 npx playwright test e2e/help-shots.spec.ts --project=laptop
const answers = new Map(LIBRARY.flatMap((s) => s.questions.map((q) => [q.prompt.trim(), q.choices[q.correctIndex]] as const)));

for (const h of HOW_TO_PLAY) {
  test(`help shots: ${h.gameId}`, async ({ page }, info) => {
    test.skip(!process.env.HELP_SHOTS || info.project.name !== 'laptop', 'made on purpose, at laptop size');
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript((id) => { if (!localStorage.getItem('gamify:settings')) localStorage.setItem('gamify:settings', JSON.stringify({ tier: 'pro', [`setup:${id}`]: { powerUps: false } })); }, h.gameId);
    const shot = (name: string) => page.screenshot({ path: `public/help/${h.gameId}-${name}.png` });
    await page.goto(`/games/${h.gameId}`);
    await page.waitForTimeout(700);
    await shot('welcome');
    await openSetup(page, `/games/${h.gameId}`);
    await page.waitForTimeout(400);
    await shot('setup');
    if (h.gameId === 'four-in-a-row') await page.getByRole('button', { name: 'Person' }).click().catch(() => {});
    await finishSetup(page);
    await page.waitForTimeout(800);
    if (h.gameId === 'game-show') await page.getByRole('button', { name: 'Card 1', exact: true }).click();
    if (h.gameId === 'cast-catch') {
      await page.getByRole('button', { name: /^Cast/ }).click();
      await page.waitForTimeout(700);
      await page.getByRole('button', { name: /^Stop/ }).click().catch(() => {});
    }
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('button', { name: /^[A-D] / }).first()).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1800);
    await shot('question');
    const prompt = (await dialog.getByRole('heading', { level: 2 }).innerText()).trim();
    const buttons = dialog.getByRole('button', { name: /^[A-D] / });
    const labels = (await buttons.allInnerTexts()).map((l) => l.trim());
    await buttons.nth(Math.max(0, labels.findIndex((l) => l.endsWith(answers.get(prompt) ?? '\u0000')))).click();
    await page.waitForTimeout(2500);
    if (await page.getByRole('dialog').getByRole('button', { name: 'OK' }).isVisible()) await page.getByRole('dialog').getByRole('button', { name: 'OK' }).click();
    await page.waitForTimeout(600);
    await shot('play');
  });
}
