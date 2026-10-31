import { test, expect } from '@playwright/test';
import { openSetup } from './setup';

// Setup menus never scroll (teacher, 2026-10-31: "always do pages"): settings
// that do not fit flow onto another page. Bubble Pop counts in rounds.
for (const size of [{ width: 1480, height: 680 }, { width: 1180, height: 820 }, { width: 820, height: 1180 }]) {
  test(`Bubble Pop setup at ${size.width}x${size.height}: no scroll, rounds 10 and 3 shots by default`, async ({ page }, info) => {
    test.skip(info.project.name !== 'laptop');
    await page.addInitScript(() => { if (!localStorage.getItem('gamify:settings')) localStorage.setItem('gamify:settings', JSON.stringify({ tier: 'pro' })); });
    await page.setViewportSize(size);
    await openSetup(page, '/games/bubble-pop');
    // Next past the questions page.
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(page.getByText('Rounds', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Rounds')).toHaveAttribute('min', '3');
    await expect(page.getByLabel('Rounds')).toHaveAttribute('max', '20');
    await expect(page.getByLabel('Rounds')).toHaveValue('10');
    await expect(page.getByLabel('Shots each round')).toHaveValue('3');
    await expect(page.getByLabel('Shots each round')).toHaveAttribute('max', '5');
    const seen = new Set<string>();
    for (let k = 0; k < 4; k++) {
      const body = page.locator('section.setup-roomy > div').nth(1);
      expect(await body.evaluate((el) => el.scrollHeight - el.clientHeight)).toBeLessThanOrEqual(1);
      for (const l of ['Rounds', 'Shots each round', 'Questions each round']) if (await page.getByText(l, { exact: true }).isVisible()) seen.add(l);
      if (await page.getByRole('switch', { name: /Power-ups/ }).isVisible()) seen.add('Power-ups');
      await page.screenshot({ path: `test-results/setup-pages-${size.width}-${k}.png` });
      const next = page.getByRole('button', { name: 'Next', exact: true });
      if (!(await next.isVisible())) break;
      await next.click();
    }
    expect([...seen].sort()).toEqual(['Power-ups', 'Questions each round', 'Rounds', 'Shots each round']);
    await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
  });
}
