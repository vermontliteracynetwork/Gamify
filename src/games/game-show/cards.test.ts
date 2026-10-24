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
});
