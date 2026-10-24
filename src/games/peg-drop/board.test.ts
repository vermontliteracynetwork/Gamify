import { describe, expect, it } from 'vitest';
import { BUCKETS, bucketOf, dropPath, ROWS, ZONES } from './board';

describe('peg drop board', () => {
  it('every path moves half a space per row, stays on the board, and ends in a bucket', () => {
    for (let z = 0; z < ZONES; z++) for (let n = 0; n < 50; n++) {
      const p = dropPath(z);
      expect(p).toHaveLength(ROWS + 1);
      for (let i = 1; i < p.length; i++) expect(Math.abs(p[i] - p[i - 1])).toBe(0.5);
      expect(p.every((x) => x >= 0 && x <= ZONES - 1)).toBe(true);
      expect(Number.isInteger(p[p.length - 1])).toBe(true);
      expect(BUCKETS[bucketOf(p)]).toBeGreaterThan(0);
    }
  });
});
