import { describe, expect, it } from 'vitest';
import { H, landing, LAUNCH, MAX_POCKETS, pickValues, pocketAt, pocketCount, shotPath, TOP_Y, VALUES, W, ZONES } from './table';

describe('pinball table', () => {
  it('starts with three pockets and adds one each round, up to ten', () => {
    expect([1, 2, 3, 8, 9, 20].map(pocketCount)).toEqual([3, 4, 5, 10, 10, 10]);
  });
  it('values are 10 to 100, each once a round, and high values grow common later on', () => {
    for (let n = 1; n <= MAX_POCKETS; n++) {
      const v = pickValues(n, 0.5);
      expect(v).toHaveLength(n);
      expect(new Set(v).size).toBe(n);
      expect(v.every((x) => VALUES.includes(x))).toBe(true);
    }
    const avg = (p: number) => { let s = 0; for (let i = 0; i < 2000; i++) s += Math.max(...pickValues(3, p)); return s / 2000; };
    expect(avg(1)).toBeGreaterThan(avg(0) + 10);
  });
  it('pockets split the top evenly', () => {
    expect([pocketAt(6, 3), pocketAt(50, 3), pocketAt(94, 3)]).toEqual([0, 1, 2]);
  });
  it('shots start at the launcher, stay on the table, and end in a pocket at the top or the drain', () => {
    for (let z = 0; z < ZONES; z++) for (const pw of [0, 0.3, 0.6, 1]) {
      const p = shotPath(z, pw).pts;
      expect(p[0]).toEqual(LAUNCH);
      expect(p.every((q) => q.x >= 4.9 && q.x <= W - 4.9 && q.y >= TOP_Y - 0.01 && q.y <= H)).toBe(true);
      const l = landing(z, pw, 5);
      const end = l.path[l.path.length - 1];
      if (l.pocket === null) expect(end.y).toBeGreaterThan(110); else expect(end.y).toBeLessThan(TOP_Y);
    }
    expect(landing(2, 1, 5).pocket).not.toBeNull();
    expect(landing(0, 0, 5).pocket).toBeNull();
  });
  it('a super shot always scores', () => {
    for (let z = 0; z < ZONES; z++) expect(landing(z, 0, 4, true).pocket).not.toBeNull();
  });
});
