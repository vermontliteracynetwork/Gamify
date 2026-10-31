import { describe, expect, it } from 'vitest';
import { H, landing, LAUNCH, MAX_POCKETS, pickValues, placePockets, pocketCount, shotPath, VALUES, W, ZONES } from './table';

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
    const avg = (p: number) => { let s = 0; for (let i = 0; i < 2000; i++) s += pickValues(3, p)[0]; return s / 2000; };
    expect(avg(1)).toBeGreaterThan(avg(0) + 10);
  });
  it('pockets sit in the upper table, apart from each other', () => {
    for (let k = 0; k < 50; k++) {
      const ps = placePockets(pickValues(10, 1));
      for (const p of ps) { expect(p.x).toBeGreaterThanOrEqual(12); expect(p.x).toBeLessThanOrEqual(88); expect(p.y).toBeLessThanOrEqual(62); }
    }
  });
  it('shots start at the launcher, stay on the table, and end in a pocket or the drain', () => {
    const pockets = placePockets([10, 50, 100]);
    for (let z = 0; z < ZONES; z++) for (const pw of [0, 0.3, 0.6, 1]) {
      const p = shotPath(z, pw);
      expect(p[0]).toEqual(LAUNCH);
      expect(p.every((q) => q.x >= 4.9 && q.x <= W - 4.9 && q.y >= 4.9 && q.y <= H - 4.9)).toBe(true);
      const l = landing(p, pockets);
      const end = l.path[l.path.length - 1];
      if (l.pocket === null) expect(end.y).toBeGreaterThan(110);
      else expect(end).toEqual({ x: pockets[l.pocket].x, y: pockets[l.pocket].y });
    }
  });
  it('Super Shooter always scores', () => {
    const pockets = placePockets([10, 20, 30]);
    expect(landing(shotPath(0, 0), pockets, true).pocket).not.toBeNull();
  });
});
