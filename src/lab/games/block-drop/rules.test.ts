import { describe, expect, it } from 'vitest';
import { bag, bestPlace, cells, clearRows, COLS, dropped, emptyGrid, explode, fits, fullRows, height, merge, rotate, ROWS, spawn, squish } from './rules';

describe('block drop', () => {
  it('spawns pieces that fit and fall to the floor', () => {
    const g = emptyGrid();
    for (let k = 0; k < 7; k++) {
      const p = spawn(k);
      expect(fits(g, p)).toBe(true);
      const d = dropped(g, p);
      expect(Math.max(...cells(d).map(([, y]) => y))).toBe(ROWS - 1);
    }
  });
  it('rotates and kicks off the wall', () => {
    const g = emptyGrid();
    const stick = { kind: 0, rot: 1, x: -2, y: 5 };
    expect(fits(g, stick)).toBe(true);
    const r = rotate(g, stick);
    expect(r).not.toBeNull();
    expect(cells(r!).every(([x]) => x >= 0 && x < COLS)).toBe(true);
  });
  it('clears a full row and drops the rest', () => {
    let g = emptyGrid();
    g[ROWS - 1] = Array(COLS).fill(3);
    g[ROWS - 2][0] = 5;
    expect(fullRows(g)).toEqual([ROWS - 1]);
    g = clearRows(g, fullRows(g));
    expect(g[ROWS - 1][0]).toBe(5);
    expect(height(g)).toBe(1);
  });
  it('bombs blow a 3x3 hole and squish fills holes', () => {
    let g = emptyGrid();
    for (let y = ROWS - 3; y < ROWS; y++) g[y] = Array(COLS).fill(2);
    g = explode(g, 4, ROWS - 2);
    expect(g[ROWS - 2][4]).toBe(0);
    expect(g[ROWS - 2][6]).toBe(2);
    g = emptyGrid(); g[5][2] = 1;
    expect(squish(g)[ROWS - 1][2]).toBe(1);
  });
  it('the computer fills a gap that clears a line', () => {
    const g = emptyGrid();
    g[ROWS - 1] = [1, 1, 1, 1, 1, 1, 0, 0, 0, 0];
    const p = spawn(0);
    const place = bestPlace(g, p);
    const land = dropped(g, { ...p, ...place });
    expect(fullRows(merge(g, land)).length).toBe(1);
  });
  it('a bag holds every shape once', () => {
    expect([...bag()].sort()).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });
});
