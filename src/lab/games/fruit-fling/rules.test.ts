import { describe, expect, it } from 'vitest';
import { fly, segmentHits, toss } from './rules';

describe('fruit fling rules', () => {
  it('a toss peaks where it was aimed and stays on screen', () => {
    for (let i = 0; i < 50; i++) {
      let p = toss(160, 30);
      let top = p.y;
      for (let k = 0; k < 400 && p.y <= 110; k++) { p = fly(p, 1 / 60); top = Math.min(top, p.y); expect(p.x).toBeGreaterThan(-5); expect(p.x).toBeLessThan(165); }
      expect(Math.abs(top - 30)).toBeLessThan(1.5);
    }
  });
  it('a swipe slices what it crosses and nothing else', () => {
    expect(segmentHits(0, 0, 10, 0, 5, 1, 2)).toBe(true);
    expect(segmentHits(0, 0, 10, 0, 5, 4, 2)).toBe(false);
    expect(segmentHits(0, 0, 10, 0, 14, 0, 2)).toBe(false);
    expect(segmentHits(3, 3, 3, 3, 4, 3, 2)).toBe(true);
  });
});
