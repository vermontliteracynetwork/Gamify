import { describe, expect, it } from 'vitest';
import { allSpots, chooseSpots, clearRows, COLS, createBoard, fullRows, landing, place, pushRow, risingRow, ROWS, rotations, SHAPES, squish, xpFor, type Board } from './googler';

const seeded = (s = 7) => () => ((s = (s * 9301 + 49297) % 233280) / 233280);
const empty = (): Board => Array.from({ length: ROWS }, () => Array(COLS).fill(null));

describe('Googler board', () => {
  it('starts half full, with gaps so no row is already clear', () => {
    const b = createBoard(seeded());
    expect(b.slice(0, ROWS / 2).every((r) => r.every((x) => x === null))).toBe(true);
    expect(b[ROWS - 1].filter(Boolean).length).toBeGreaterThan(COLS - 3);
    expect(fullRows(b)).toEqual([]);
  });
  it('rising rows always leave a gap', () => {
    const rng = seeded(3);
    for (let i = 0; i < 50; i++) { const row = risingRow(COLS, rng); expect(row.some((x) => x === null)).toBe(true); expect(row.filter((x) => x?.eye !== undefined).length).toBeLessThanOrEqual(1); }
  });
  it('every shape is made of units and has its turns', () => {
    expect(SHAPES).toHaveLength(7);
    expect(rotations(1)).toHaveLength(1);
    expect(rotations(0)).toHaveLength(2);
    expect(rotations(2)).toHaveLength(4);
    SHAPES.forEach((_, i) => { expect(SHAPES[i].cells).toHaveLength(4); rotations(i).forEach((cells) => expect(cells.length).toBe(4)); });
  });
  it('drops a block to the floor or onto the stack', () => {
    const b = empty();
    expect(landing(b, [[0, 0], [0, 1]], 3)).toBe(ROWS - 1);
    b[ROWS - 1][3] = { id: 1, shape: 0 };
    expect(landing(b, [[0, 0], [0, 1]], 3)).toBe(ROWS - 2);
  });
  it('clears a filled row and hands back its googly eyes and power-ups', () => {
    const b = empty();
    for (let c = 0; c < COLS - 4; c++) b[ROWS - 1][c] = { id: c + 10, shape: 1, ...(c === 2 ? { eye: 3 } : {}), ...(c === 1 ? { power: 7 } : {}) };
    b[ROWS - 2][0] = { id: 99, shape: 2 };
    const spot = allSpots(b, 0).find((s) => s.col === COLS - 4 && s.row === ROWS - 1)!;
    const after = place(b, { shape: 0 }, spot);
    expect(fullRows(after)).toEqual([ROWS - 1]);
    const res = clearRows(after, fullRows(after));
    expect(res.eyes).toEqual([{ row: ROWS - 1, col: 2, eye: 3, id: 12 }]);
    expect(res.powers).toEqual([{ row: ROWS - 1, col: 1, power: 7, id: 11 }]);
    expect(res.board[ROWS - 1][0]?.id).toBe(99);
  });
  it('offers three spots, one of them the best, and five with the power-up', () => {
    const b = createBoard(seeded(5));
    const three = chooseSpots(b, { shape: 2 }, 3, seeded(9));
    const five = chooseSpots(b, { shape: 0 }, 5, seeded(9));
    expect(three).toHaveLength(3);
    expect(five).toHaveLength(5);
    expect(new Set(three.map((s) => `${s.rotation}:${s.col}`)).size).toBe(3);
  });
  it('a new row pushes everything up and says when the top spills', () => {
    const b = empty();
    b[0][0] = { id: 5, shape: 0 };
    const res = pushRow(b, risingRow(COLS, seeded()));
    expect(res.spilled).toBe(true);
    expect(squish(res.board).slice(0, ROWS - 4).every((r) => r.every((x) => x === null))).toBe(true);
  });
  it('xp grows with rows cleared at once and every eye', () => {
    expect(xpFor(1, 0)).toBe(10);
    expect(xpFor(2, 1)).toBe(40);
    expect(xpFor(4, 0)).toBeGreaterThan(xpFor(1, 0) * 4);
  });
});
