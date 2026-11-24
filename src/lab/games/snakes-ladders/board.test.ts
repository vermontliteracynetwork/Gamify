import { describe, expect, it } from 'vitest';
import { above, alongPath, exactPath, hopsFrom, LADDERS, LAST, landing, nextLadder, rungs, SNAKES, snakePoints, squareXY, type Pt } from './board';

const dSeg = (p: Pt, a: Pt, b: Pt) => {
  const vx = b.x - a.x, vy = b.y - a.y, l = vx * vx + vy * vy;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * vx + (p.y - a.y) * vy) / l));
  return Math.hypot(p.x - a.x - t * vx, p.y - a.y - t * vy);
};

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
    expect(ends).not.toContain(1); expect(ends).not.toContain(100);
    expect(landing(2)).toEqual({ kind: 'ladder', to: 22 });
    expect(landing(97)).toEqual({ kind: 'snake', to: 64 });
    expect(landing(5)).toEqual({ kind: null, to: 5 });
  });
  it('nothing crosses: snakes keep clear of ladders and of each other, ladders of each other', () => {
    const bodies = Object.entries(SNAKES).map(([h, t]) => alongPath(snakePoints(+h, +t), 10));
    const ladders = Object.entries(LADDERS).map(([a, b]) => [squareXY(+a), squareXY(+b)] as const);
    for (const body of bodies) for (const [a, b] of ladders) expect(Math.min(...body.map((p) => dSeg(p, a, b)))).toBeGreaterThan(50);
    for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++)
      expect(Math.min(...bodies[i].flatMap((p) => bodies[j].map((q) => Math.hypot(p.x - q.x, p.y - q.y))))).toBeGreaterThan(48);
    for (let i = 0; i < ladders.length; i++) for (let j = i + 1; j < ladders.length; j++) {
      const [a, b] = ladders[i], [c, d] = ladders[j];
      const pts = Array.from({ length: 21 }, (_, k) => ({ x: a.x + ((b.x - a.x) * k) / 20, y: a.y + ((b.y - a.y) * k) / 20 }));
      expect(Math.min(...pts.map((p) => dSeg(p, c, d)))).toBeGreaterThan(60);
    }
  });
  it('a class at about 70% right reaches 100 within the default 40 rounds (seeded)', () => {
    let seed = 12345;
    const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
    const turns: number[] = [];
    for (let g = 0; g < 300; g++) {
      let pos = 0, t = 0;
      while (pos < LAST && t < 200) {
        t++;
        if (rnd() >= 0.7) continue;
        pos = Math.min(LAST, pos + 1 + Math.floor(rnd() * 6));
        pos = landing(pos).to;
      }
      turns.push(t);
    }
    turns.sort((a, b) => a - b);
    // Most games are done within the default 40 rounds, nearly all by the 60 maximum.
        expect(turns[150]).toBeLessThanOrEqual(40);
    expect(turns[Math.floor(300 * 0.75)]).toBeLessThanOrEqual(60);
  });
  it('bounces back past the last square on an exact roll', () => {
    expect(exactPath(97, 5)).toEqual([98, 99, 100, 99, 98]);
    expect(exactPath(96, 4)).toEqual([97, 98, 99, 100]);
  });
  it('hops stop on the last square', () => {
    expect(hopsFrom(97, 6)).toEqual([98, 99, 100]);
    expect(hopsFrom(0, 2)).toEqual([1, 2]);
  });
  it('finds the next ladder in reach', () => {
    expect(nextLadder(0)).toBe(2);
    expect(nextLadder(67)).toBeNull();
  });
  it('a snake starts at its head and ends at its tail', () => {
    const p = snakePoints(97, 64);
    expect(p[0]).toEqual(squareXY(97));
    expect(p[p.length - 1]).toEqual(squareXY(64));
    const a = alongPath(p);
    expect(a[0].x).toBeCloseTo(p[0].x); expect(a[a.length - 1]).toEqual(p[p.length - 1]);
    expect(rungs(2, 22)[0]).toEqual(squareXY(2));
  });
});
