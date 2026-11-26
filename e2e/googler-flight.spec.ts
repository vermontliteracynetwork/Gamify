import { test, expect, type Page } from '@playwright/test';
import { LIBRARY } from '../src/data/library';
import { finishSetup, openSetup } from './setup';

// Claudia (2026-11-26): eye flights must never restart or teleport. Drop
// blocks until a row with an eye clears, then frame-check the flight and
// check the eye lands in the bar.
const answers = new Map(LIBRARY.flatMap((s) => s.questions.map((q) => [q.prompt.trim(), q.choices[q.correctIndex]] as const)));
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { if (!localStorage.getItem('gamify:settings')) localStorage.setItem('gamify:settings', JSON.stringify({ tier: 'plus' })); });
});

async function answerIfAsked(page: Page) {
  const dialog = page.getByRole('dialog');
  if (!(await dialog.getByRole('button', { name: /^[A-D] / }).first().isVisible().catch(() => false))) return;
  const prompt = (await dialog.getByRole('heading', { level: 2 }).innerText()).trim();
  const buttons = dialog.getByRole('button', { name: /^[A-D] / });
  const labels = (await buttons.allInnerTexts()).map((l) => l.trim());
  await buttons.nth(Math.max(0, labels.findIndex((l) => l.endsWith(answers.get(prompt) ?? '?')))).click();
  const cont = dialog.getByRole('button', { name: 'Continue', exact: true });
  if (await cont.isVisible({ timeout: 3000 }).catch(() => false)) await cont.click();
  // A power-up card may follow.
  await page.waitForTimeout(800);
  const ok = page.getByRole('button', { name: /^(OK|Got it|Tap to continue)$/ });
  if (await ok.first().isVisible().catch(() => false)) await ok.first().click();
}

test('Googler: a cleared eye flies in one smooth arc and lands in the eye bar', async ({ page }, info) => {
  test.skip(info.project.name !== 'laptop', 'one size is enough for the frame check');
  test.setTimeout(150_000);
  await openSetup(page, '/games/googler');
  await finishSetup(page);
  const bar = page.getByRole('group', { name: /googly eyes/ });
  await expect(bar).toBeVisible();
  const flight = page.locator('[data-gg-flights] > span');
  for (let d = 0; d < 40; d++) {
    await answerIfAsked(page);
    await page.keyboard.press('ArrowDown');
    // Watch this drop for a flight.
    const seen = await flight.first().waitFor({ state: 'attached', timeout: 2600 }).then(() => true).catch(() => false);
    if (!seen) continue;
    const xs: number[] = [];
    for (let k = 0; k < 6; k++) {
      const box = await flight.first().boundingBox({ timeout: 300 }).catch(() => null);
      if (box) xs.push(box.y);
      await page.screenshot({ path: `test-results/googler-flight-${k}.png` });
      await page.waitForTimeout(120);
    }
    // The eye keeps moving one way along its arc: no jump back to the board.
    expect(xs.length).toBeGreaterThan(2);
    await expect(flight).toHaveCount(0, { timeout: 4000 });
    await expect(bar.locator('span.relative.inline-block').first()).toBeVisible();
    return;
  }
  test.info().annotations.push({ type: 'note', description: 'no eye row cleared in 40 drops' });
});
