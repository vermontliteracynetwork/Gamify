import { describe, expect, it } from 'vitest';
import { aheadOf, hops, leaderId, makeSurprises, shellRoll, surpriseMove, trackLength } from './race';

describe('track race', () => {
  it('sizes the track from the rounds', () => {
    expect(trackLength(12)).toBe(29);
    expect(trackLength(3)).toBe(16);
    expect(trackLength(40)).toBe(48);
  });
  it('hops one space at a time and stops at the finish', () => {
    expect(hops(2, 3, 30)).toEqual([3, 4, 5]);
    expect(hops(28, 6, 30)).toEqual([29, 30]);
  });
  it('hides surprises away from the ends and never side by side', () => {
    for (let k = 0; k < 50; k++) {
      const s = Object.keys(makeSurprises(29)).map(Number).sort((a, b) => a - b);
      expect(s.length).toBeGreaterThanOrEqual(2);
      s.forEach((x, i) => { expect(x).toBeGreaterThanOrEqual(3); expect(x).toBeLessThanOrEqual(26); if (i) expect(x - s[i - 1]).toBeGreaterThanOrEqual(2); });
    }
  });
  it('moves surprises inside the track', () => {
    expect(surpriseMove('boost', 28, 29)).toBe(29);
    expect(surpriseMove('mud', 0, 29)).toBe(0);
    expect(surpriseMove('spring', 4, 29)).toBe(7);
  });
  it('finds the leader and the runner just ahead', () => {
    const pos = { a: 3, b: 9, c: 5 };
    expect(leaderId(pos, ['a', 'b', 'c'])).toBe('b');
    expect(leaderId({ a: 0, b: 0 }, ['a', 'b'])).toBeNull();
    expect(aheadOf(pos, ['a', 'b', 'c'], 'a')).toBe('c');
    expect(aheadOf(pos, ['a', 'b', 'c'], 'b')).toBeNull();
  });
  it('halves a roll under a turtle shell', () => {
    expect(shellRoll(5)).toBe(3);
    expect(shellRoll(1)).toBe(1);
  });
});
