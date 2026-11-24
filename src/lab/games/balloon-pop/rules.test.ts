import { describe, expect, it } from 'vitest';
import { balloonKind, makeBag, spawnX } from './rules';

describe('balloon pop rules', () => {
  it('every answer comes up once in each bag', () => {
    const next = makeBag(4);
    for (let round = 0; round < 5; round++) {
      const seen = new Set([next(), next(), next(), next()]);
      expect(seen.size).toBe(4);
    }
  });
  it('never repeats an answer twice in a row', () => {
    const next = makeBag(3);
    let last = next();
    for (let i = 0; i < 200; i++) { const n = next(); expect(n).not.toBe(last); last = n; }
  });
  it('bigger balloons rise slower', () => {
    const lo = () => 0, hi = () => 0.999;
    expect(balloonKind(hi).r).toBeGreaterThan(balloonKind(lo).r);
    const big = balloonKind(() => 0.999), small = balloonKind(() => 0);
    expect(big.speed - 3).toBeLessThan(small.speed);
  });
  it('balloons start inside the sky and clear of the jar', () => {
    for (let i = 0; i < 100; i++) {
      const x = spawnX(160, 10);
      expect(x).toBeGreaterThanOrEqual(30);
      expect(x).toBeLessThanOrEqual(147);
    }
  });
});
