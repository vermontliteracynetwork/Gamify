import { test, expect } from '@playwright/test';
import { GAMES } from '../src/games/registry';
import { finishSetup, openSetup } from './setup';

// Device check (development plan Stage 8): the oldest iPads we support (768 x
// 1024, both ways), a Chromebook (1366 x 768) and a classroom smart board
// (1920 x 1080). Every game must reach play with nothing to scroll.
const SIZES = [
  { name: 'old-ipad-portrait', width: 768, height: 1024 },
  { name: 'old-ipad-landscape', width: 1024, height: 768 },
  { name: 'chromebook', width: 1366, height: 768 },
  { name: 'smart-board', width: 1920, height: 1080 },
];

test.beforeEach(async ({ page }, info) => {
  test.skip(info.project.name !== 'laptop', 'sizes are set inside the test');
  await page.addInitScript(() => { if (!localStorage.getItem('gamify:settings')) localStorage.setItem('gamify:settings', JSON.stringify({ tier: 'pro' })); });
});

for (const size of SIZES) {
  test(`every game fits a ${size.name} screen`, async ({ page }) => {
    test.setTimeout(180_000);
    const problems: string[] = [];
    page.on('pageerror', (e) => problems.push(e.message));
    await page.setViewportSize({ width: size.width, height: size.height });
    for (const g of GAMES) {
      await openSetup(page, `/games/${g.id}`);
      await finishSetup(page);
      await page.waitForTimeout(600);
      const over = await page.evaluate(() => ({ y: document.documentElement.scrollHeight - window.innerHeight, x: document.documentElement.scrollWidth - window.innerWidth }));
      expect(over.y, `${g.id} scrolls down on ${size.name}`).toBeLessThanOrEqual(1);
      expect(over.x, `${g.id} scrolls sideways on ${size.name}`).toBeLessThanOrEqual(1);
      await page.screenshot({ path: `test-results/device-${size.name}-${g.id}.png` });
    }
    expect(problems).toEqual([]);
  });
}
