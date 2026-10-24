import { describe, expect, it } from 'vitest';
import { DANGER_ROW, emptyBoard, filled, lowestRow, makeBoard, nextColor, place, pushRow, rescue, shotPoints, traceShot } from './board';

describe('bubble pop board', () => {
  it('three of a color pop, and bubbles left hanging fall', () => {
    const b = emptyBoard();
    b.rows[0][0] = 1; b.rows[0][1] = 1;
    b.rows[1][0] = 2; // hangs from the two 1s (row 1 is shifted)
    const res = place(b, 0, 2, 1);
    expect(res.popped).toHaveLength(3);
    expect(res.dropped).toEqual([[1, 0, 2]]);
    expect(filled(res.board)).toBe(0);
    expect(shotPoints(res)).toBe(50);
  });

  it('two of a color just stick', () => {
    const b = emptyBoard();
    b.rows[0][0] = 1;
    const res = place(b, 0, 1, 1);
    expect(res.popped).toHaveLength(0);
    expect(filled(res.board)).toBe(2);
  });

  it('a straight-up shot lands in an empty cell touching the bubbles', () => {
    const b = makeBoard(0, () => 0.3);
    const { cell, path } = traceShot(b, -Math.PI / 2);
    expect(cell).not.toBeNull();
    expect(path.length).toBeGreaterThan(1);
    const [r, c] = cell!;
    expect(b.rows[r][c]).toBeNull();
  });

  it('a rescue clears the bottom rows; a pushed row adds one at the top', () => {
    let b = makeBoard(2, () => 0.4);
    for (let i = 0; lowestRow(b) < DANGER_ROW && i < 10; i++) b = pushRow(b, [0, 1]);
    const before = lowestRow(b);
    expect(lowestRow(rescue(b).board)).toBeLessThan(before);
  });

  it('the next bubble is a color still on the board', () => {
    const b = emptyBoard();
    b.rows[0][3] = 4;
    expect(nextColor(b)).toBe(4);
  });
});
