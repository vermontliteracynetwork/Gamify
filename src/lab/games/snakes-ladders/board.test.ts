import { describe, expect, it } from 'vitest';
import { above, exactPath, alongPath, hopsFrom, LADDERS, landing, nextLadder, rungs, SNAKES, snakePoints, squareXY } from './board';

describe('snakes and ladders', () => {
  it('lays squares out back and forth', () => {
    expect(squareXY(1)).toEqual({ x: 50, y: 950 });
    expect(squareXY(10)).toEqual({ x: 950, y: 950 });
    expect(squareXY(11)).toEqual({ x: 950, y: 850 });
    expect(squareXY(100)).toEqual({ x: 50, y: 50 });
  });
  it('finds the square above', () => {
    expect(above(1)).toBe(20);
    expect(above(15)).toBe(26);
    expect(above(95)).toBeNull();
    for (let n = 1; n <= 90; n++) expect(squareXY(above(n)!).x).toBe(squareXY(n).x);
  });
  it('ladders go up, snakes go down, and never share squares', () => {
    for (const [a, b] of Object.entries(LADDERS)) expect(b).toBeGreaterThan(+a);
    for (const [a, b] of Object.entries(SNAKES)) expect(b).toBeLessThan(+a);
    const ends = [...Object.keys(LADDERS), ...Object.values(LADDERS), ...Object.keys(SNAKES), ...Object.values(SNAKES)].map(Number);
    expect(new Set(ends).size).toBe(ends.length);
    expect(landing(3)).toEqual({ kind: 'ladder', to: 22 });
    expect(landing(97)).toEqual({ kind: 'snake', to: 78 });
    expect(landing(5)).toEqual({ kind: null, to: 5 });
  });
  it('hops stop on the last square', () => {
    expect(hopsFrom(97, 6)).toEqual([98, 99, 100]);
    expect(hopsFrom(0, 2)).toEqual([1, 2]);
  });
  it('bounces back past the last square on an exact roll', () => {
    expect(exactPath(97, 5)).toEqual([98, 99, 100, 99, 98]);
    expect(exactPath(96, 4)).toEqual([97, 98, 99, 100]);
  });
  it('finds the next ladder in reach', () => {
    expect(nextLadder(0)).toBe(3);
    expect(nextLadder(72)).toBeNull();
  });
  it('a snake starts at its head and ends at its tail', () => {
    const p = snakePoints(97, 78);
    expect(p[0]).toEqual(squareXY(97));
    expect(p[p.length - 1]).toEqual(squareXY(78));
    const a = alongPath(p);
    expect(a[0].x).toBeCloseTo(p[0].x); expect(a[a.length - 1]).toEqual(p[p.length - 1]);
    expect(rungs(3, 22)[0]).toEqual(squareXY(3));
  });
});
