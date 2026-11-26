import { describe, expect, it } from 'vitest';
import { canPlayGame, schoolQuote } from './config';

describe('plans', () => {
  it('prices school seats with volume discounts', () => {
    expect(schoolQuote(4)).toBeNull();
    expect(schoolQuote(5)).toEqual({ perSeat: 126, total: 630 });
    expect(schoolQuote(10)?.perSeat).toBe(120);
    expect(schoolQuote(15)?.perSeat).toBe(113);
    expect(schoolQuote(30)?.perSeat).toBe(106);
  });
  it('free teachers play every game but the paid-only ones', () => {
    expect(canPlayGame('free', 'game-show')).toBe(true);
    expect(canPlayGame('free', 'bubble-pop')).toBe(true);
    expect(canPlayGame('free', 'googler')).toBe(false);
    expect(canPlayGame('plus', 'googler')).toBe(true);
    expect(canPlayGame('homeschool', 'googler')).toBe(true);
  });
});
