import { describe, expect, it } from 'vitest';
import { gust, pull, pullSize, winner } from './tug';

describe('team tug', () => {
  it('pulls toward the puller and stops at the line', () => {
    expect(pull(0, 'left', 0.3)).toBeCloseTo(-0.3);
    expect(pull(0.9, 'right', 0.3)).toBe(1);
    expect(winner(1)).toBe('right');
    expect(winner(-1)).toBe('left');
    expect(winner(0.5)).toBeNull();
  });
  it('extra pullers pull more and a grip halves it', () => {
    const r = () => 0.5;
    expect(pullSize({ extra: 1, rand: r })).toBeGreaterThan(pullSize({ rand: r }));
    expect(pullSize({ gripped: true, rand: r })).toBeCloseTo(pullSize({ rand: r }) / 2);
  });
  it('a gust blows the flag back toward the middle', () => {
    expect(gust(0.8)).toBeCloseTo(0.52);
  });
});
