import { describe, expect, it } from 'vitest';
import { carAt, carCols, COLS, cpuMove, hop, hopPoints, makeMap, ROWS, safeRow, START, stepTraffic, type Lane } from './road';

const grass = (): Lane => ({ kind: 'grass', dir: 1, cars: [] });
const road = (dir: 1 | -1, xs: number[]): Lane => ({ kind: 'road', dir, cars: xs.map((x, id) => ({ id, x, len: 1 })) });
const plain = (lanes: Lane[]) => [...lanes, ...Array.from({ length: ROWS - lanes.length }, grass)];

describe('Road Hop', () => {
  it('makes maps with grass at both ends and gaps in every road', () => {
    for (let level = 0; level < 4; level++) {
      const map = makeMap(level);
      expect(map).toHaveLength(ROWS);
      expect(map[0].kind).toBe('grass');
      expect(map[ROWS - 1].kind).toBe('grass');
      for (const lane of map.filter((l) => l.kind === 'road')) {
        const blocked = new Set(lane.cars.flatMap((c) => carCols(c, lane.dir)).filter((x) => x >= 0 && x < COLS));
        expect(blocked.size).toBeLessThan(COLS);
      }
    }
  });
  it('moves cars one cell and loops them around', () => {
    const map = plain([grass(), road(1, [10, 3])]);
    expect(stepTraffic(map)[1].cars.map((c) => c.x)).toEqual([0, 4]);
    expect(stepTraffic(map)[1].cars[0].lap).toBe(1);
  });
  it('a safe hop moves up; a car in the way is a bonk back to the grass', () => {
    const map = plain([grass(), road(1, [6])]); // car shows in column 4, moving right
    const safe = hop(map, { row: 0, col: 1 }, 'up');
    expect(safe).toMatchObject({ bonked: false, pos: { row: 1, col: 1 } });
    const into = hop(map, { row: 0, col: 4 }, 'up');
    expect(into).toMatchObject({ bonked: true, pos: { row: 0, col: 4 } });
    const rolledInto = hop(map, { row: 0, col: 5 }, 'up');
    expect(rolledInto.bonked).toBe(true);
  });
  it('goes back to the nearest grass strip', () => {
    const map = plain([grass(), road(1, []), grass(), road(1, [])]);
    expect(safeRow(map, 3)).toBe(2);
    expect(safeRow(map, 1)).toBe(0);
  });
  it('reaching the top row is across', () => {
    const map = plain([]);
    expect(hop(map, { row: ROWS - 2, col: 3 }, 'up').across).toBe(true);
  });
  it('the computer never hops into a car when a safe move exists', () => {
    const map = plain([grass(), road(1, [6])]);
    const m = cpuMove(map, { row: 0, col: 4 }, () => 0.1);
    expect(hop(map, { row: 0, col: 4 }, m).bonked).toBe(false);
    expect(carAt(map, START)).toBe(false);
  });
  it('scores new rows and crossing', () => {
    expect(hopPoints(2, 3, false)).toBe(1);
    expect(hopPoints(3, 1, false)).toBe(0);
    expect(hopPoints(7, 8, true)).toBe(11);
  });
});
