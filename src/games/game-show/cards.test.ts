import { describe, expect, it } from 'vitest';
import { dealCards } from './cards';

describe('surprise cards', () => {
  it('deals the asked number with at least one twist', () => {
    for (const n of [12, 16, 20]) {
      const deck = dealCards(n);
      expect(deck).toHaveLength(n);
      expect(deck.some((c) => c.kind !== 'points')).toBe(true);
    }
  });

  it('deals only points when every twist is off', () => {
    expect(dealCards(12, Math.random, []).every((c) => c.kind === 'points')).toBe(true);
    expect(dealCards(16, Math.random, ['double']).filter((c) => c.kind !== 'points').every((c) => c.kind === 'double')).toBe(true);
  });
});
