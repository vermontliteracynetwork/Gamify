import { test, expect } from '@playwright/test';

// WCAG 1.4.10 Reflow: at 400 percent zoom a laptop screen is 320 CSS pixels
// wide. Menus, teacher pages and public pages must not scroll sideways.
// (Game boards are two-dimensional content and are exempt, but they still
// fit because they size to the screen.)
const PAGES = ['/', '/features', '/themes', '/challenge', '/beta', '/faq', '/schools', '/homeschool', '/student-data', '/pricing', '/ways', '/help', '/it', '/join', '/login', '/teacher/classes', '/teacher/sets', '/teacher/reports', '/teacher/themes', '/teacher/account', '/play'];

test.beforeEach(({}, info) => { test.skip(info.project.name !== 'laptop', 'one size is enough'); });

test('no sideways scrolling at 400 percent zoom (320 px wide)', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 320, height: 640 });
  const wide: string[] = [];
  for (const path of PAGES) {
    await page.goto(path);
    await page.waitForTimeout(500);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (over > 1) {
      const culprit = await page.evaluate(() => [...document.querySelectorAll('body *')].filter((e) => e.getBoundingClientRect().right > window.innerWidth + 1).slice(-1).map((e) => `${e.tagName}.${String((e as HTMLElement).className).slice(0, 60)}`)[0]);
      wide.push(`${path} (+${over}px: ${culprit})`);
      await page.screenshot({ path: `test-results/zoom${path.replace(/\//g, '-')}.png`, fullPage: true });
    }
  }
  await page.goto('/teacher/reports');
  await page.screenshot({ path: 'test-results/zoom-reports.png', fullPage: true });
  expect(wide).toEqual([]);
});
