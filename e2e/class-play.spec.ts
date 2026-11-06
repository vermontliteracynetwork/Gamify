import { test, expect } from '@playwright/test';
import { openSetup } from './setup';

// How the class plays is chosen in the setup menus before the lobby opens
// (teacher, 2026-10-31), and the lobby starts with those choices.
for (const game of ['star-quiz', 'cast-catch']) {
  test(`${game}: Live setup asks how the class plays, the lobby keeps it`, async ({ page }, info) => {
    await page.addInitScript(() => { if (!localStorage.getItem('gamify:settings')) localStorage.setItem('gamify:settings', JSON.stringify({ tier: 'plus' })); });
    const problems: string[] = [];
    page.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()); });
    await openSetup(page, `/games/${game}`, /Live/);
    await expect(page.getByRole('heading', { name: /How the class plays/i })).toBeVisible();
    await page.getByRole('radio', { name: /^Compete/ }).click();
    await page.getByRole('radio', { name: 'First to a number right' }).click();
    await page.getByLabel('Right answers').fill('7');
    await page.screenshot({ path: `test-results/class-play-${game}-${info.project.name}.png` });
    expect(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight - (document.getElementById('teacher-footer')?.getBoundingClientRect().height ?? 0))).toBeLessThanOrEqual(1);
    for (;;) {
      const next = page.getByRole('button', { name: 'Next', exact: true });
      if (!(await next.isVisible())) break;
      await next.click();
    }
    await page.getByRole('button', { name: 'Open the live lobby' }).click();
    await expect(page).toHaveURL(/\/teacher\/live\/[A-Z]{5}\?mode=compete&end=right%3A7/);
    // Lobby settings sit behind the gear (teacher, 2026-11-06).
    await page.getByRole('button', { name: 'Game settings' }).click();
    await expect(page.getByRole('radio', { name: 'First to a number right' })).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByLabel('Right answers')).toHaveValue('7');
    expect(problems).toEqual([]);
  });
}

test('Together: the class goal carries into the lobby', async ({ page }) => {
  await page.addInitScript(() => { if (!localStorage.getItem('gamify:settings')) localStorage.setItem('gamify:settings', JSON.stringify({ tier: 'plus' })); });
  await openSetup(page, '/games/star-quiz', /Live/);
  await page.getByRole('radio', { name: /^Together/ }).click();
  await page.getByLabel(/Class goal/).fill('40');
  for (;;) {
    const next = page.getByRole('button', { name: 'Next', exact: true });
    if (!(await next.isVisible())) break;
    await next.click();
  }
  await page.getByRole('button', { name: 'Open the live lobby' }).click();
  await expect(page).toHaveURL(/mode=together&goal=40/);
  await page.getByRole('button', { name: 'Game settings' }).click();
  await expect(page.getByRole('radio', { name: /^Together/ })).toHaveAttribute('aria-checked', 'true');
});
