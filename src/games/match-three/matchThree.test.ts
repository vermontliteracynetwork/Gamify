import { describe, expect, it } from 'vitest';
import { clearAndRefill, createGrid, findMatches, hasAnyValidMove, isAdjacent, pointsFor, rainbowSwap, resolveMatches, swapTiles, wouldMatch, type Grid } from './matchThree';

const g = (kinds: number[][]): Grid => kinds.map((row) => row.map((kind, i) => ({ id: i + kind * 100 + Math.random(), kind })));

describe('match three', () => {
  it('new boards have no matches and at least one move', () => {
    for (let i = 0; i < 20; i++) {
      const grid = createGrid(7, 7);
      expect(findMatches(grid).size).toBe(0);
      expect(hasAnyValidMove(grid)).toBe(true);
    }
  });
  it('finds rows and columns of 3+', () => {
    const grid = g([[1, 1, 1, 2], [3, 4, 5, 2], [0, 5, 4, 2]]);
    expect([...findMatches(grid)].sort()).toEqual(['0,0', '0,1', '0,2', '0,3', '1,3', '2,3'].sort());
  });
  it('swaps only neighbors', () => {
    expect(isAdjacent({ row: 0, col: 0 }, { row: 0, col: 1 })).toBe(true);
    expect(isAdjacent({ row: 0, col: 0 }, { row: 1, col: 1 })).toBe(false);
    const grid = g([[1, 2], [3, 4]]);
    expect(swapTiles(grid, { row: 0, col: 0 }, { row: 0, col: 1 })[0].map((t) => t.kind)).toEqual([2, 1]);
  });
  it('drops tiles down and refills the top, keeping survivors', () => {
    const grid = g([[5], [1], [1], [1]]);
    const next = clearAndRefill(grid, new Set(['1,0', '2,0', '3,0']));
    expect(next[3][0].kind).toBe(5);
    expect(next.flat()).toHaveLength(4);
  });
  it('scores bigger matches and cascades higher', () => {
    expect(pointsFor(3, 1)).toBe(30);
    expect(pointsFor(4, 1)).toBe(60);
    expect(pointsFor(3, 2)).toBe(60);
  });
  it('four in a row makes a line piece where the swap landed', () => {
    const grid = g([[1, 1, 1, 1, 2], [3, 4, 5, 0, 2], [0, 5, 4, 3, 5]]);
    const res = resolveMatches(grid, [{ row: 0, col: 2 }]);
    expect(res.made).toHaveLength(1);
    expect(res.made[0].pos).toEqual({ row: 0, col: 2 });
    expect(res.made[0].tile.special).toBe('row');
    const next = clearAndRefill(grid, res.cleared, Math.random, res.made);
    expect(next[0][2].special).toBe('row');
  });
  it('an L shape makes a star burst, and five makes a rainbow', () => {
    const l = g([[1, 1, 1, 2], [3, 4, 1, 2], [0, 5, 1, 3]]);
    expect(resolveMatches(l).made.map((m) => m.tile.special)).toEqual(['burst']);
    const five = g([[2, 2, 2, 2, 2], [3, 4, 5, 0, 1], [0, 5, 4, 3, 5]]);
    expect(resolveMatches(five).made.map((m) => m.tile.special)).toEqual(['rainbow']);
  });
  it('a line piece caught in a match clears its whole row', () => {
    const grid = g([[1, 1, 1, 2, 3], [3, 4, 5, 0, 2], [0, 5, 4, 3, 5]]);
    grid[0][0].special = 'col';
    const res = resolveMatches(grid);
    expect(res.fired.map((f) => f.special)).toEqual(['col']);
    expect(res.cleared.has('2,0')).toBe(true);
  });
  it('a rainbow swapped with a piece clears every piece of that kind', () => {
    const grid = g([[1, 2, 1], [3, 1, 2], [1, 0, 4]]);
    grid[0][1] = { id: 999, kind: -1, special: 'rainbow' };
    expect(wouldMatch(grid, { row: 0, col: 1 }, { row: 0, col: 0 })).toBe(true);
    const res = rainbowSwap(grid, { row: 0, col: 1 }, { row: 0, col: 0 })!;
    expect([...res.cleared].sort()).toEqual(['0,0', '0,1', '0,2', '1,1', '2,0'].sort());
  });
});
