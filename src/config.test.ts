import { describe, expect, it } from 'vitest';
import { canPlayGame, schoolQuote } from './config';

describe('plans', () => {
  it('prices school seats with volume discounts', () => {
    expect(schoolQuote(4)).toBeNull();
    expect(schoolQuote(5)).toEqual({ perSeat: 130, total: 650 });
    expect(schoolQuote(10)?.perSeat).toBe(115);
    expect(schoolQuote(30)?.perSeat).toBe(101);
  });
  it('free teachers play free games only', () => {
    expect(canPlayGame('free', 'game-show')).toBe(true);
    expect(canPlayGame('free', 'bubble-pop')).toBe(false);
    expect(canPlayGame('plus', 'bubble-pop')).toBe(true);
  });
});
