import { test, expect, type Page } from '@playwright/test';
import { finishSetup, openSetup } from './setup';

const KINDS = ['Cookie', 'Cake', 'Ice cream', 'Pizza', 'Popcorn', 'Cocoa'];

async function readGrid(page: Page): Promise<number[][]> {
  const labels = await page.getByRole('gridcell').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label') ?? ''));
  const grid: number[][] = [];
  for (const l of labels) {
    const m = /^(.+), row (\d+), column (\d+)/.exec(l)!;
    (grid[+m[2] - 1] ??= [])[+m[3] - 1] = KINDS.indexOf(m[1]);
  }
  return grid;
}

function findSwap(g: number[][]): [[number, number], [number, number]] | null {
  const runs = (x: number[][]) => {
    for (let r = 0; r < x.length; r++) for (let c = 0; c < x[0].length; c++) {
      if (c + 2 < x[0].length && x[r][c] === x[r][c + 1] && x[r][c] === x[r][c + 2]) return true;
      if (r + 2 < x.length && x[r][c] === x[r + 1][c] && x[r][c] === x[r + 2][c]) return true;
    }
    return false;
  };
  for (let r = 0; r < g.length; r++) for (let c = 0; c < g[0].length; c++) {
    for (const [dr, dc] of [[0, 1], [1, 0]]) {
      const r2 = r + dr, c2 = c + dc;
      if (r2 >= g.length || c2 >= g[0].length) continue;
      const x = g.map((row) => [...row]);
      [x[r][c], x[r2][c2]] = [x[r2][c2], x[r][c]];
      if (runs(x)) return [[r, c], [r2, c2]];
    }
  }
  return null;
}

test('Match Three: swaps make matches, a round ends in a question break', async ({ page }, info) => {
  test.setTimeout(90_000);
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(m.text()); });
  page.on('pageerror', (e) => problems.push(e.message));
  await page.goto('/games/match-three');
  await page.screenshot({ path: `test-results/bakery-welcome-${info.project.name}.png` });
  await openSetup(page, '/games/match-three');
  await finishSetup(page);
  await expect(page.getByRole('gridcell')).toHaveCount(49);
  await page.screenshot({ path: `test-results/bakery-start-${info.project.name}.png`, fullPage: true });

  for (let move = 0; move < 3; move++) {
    await expect(page.getByLabel(`Moves left this round: ${3 - move}`)).toBeVisible({ timeout: 8000 });
    const swap = findSwap(await readGrid(page))!;
    const cell = (r: number, c: number) => page.getByRole('gridcell', { name: new RegExp(`row ${r + 1}, column ${c + 1}(,|$)`) });
    await cell(...swap[0]).click();
    await cell(...swap[1]).click();
    if (move === 0 && info.project.name === 'ipad-portrait') {
      // Frame check of the swap, pop and fall.
      for (let f = 0; f < 8; f++) {
        await page.screenshot({ path: `test-results/bakery-frame-${f}.png`, clip: { x: 24, y: 160, width: 532, height: 532 } });
        await page.waitForTimeout(90);
      }
    }
  }
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('Read the question')).toBeVisible();
  expect(Number(await page.locator('p.tabular-nums').first().innerText())).toBeGreaterThan(0);
  expect(problems).toEqual([]);
});
