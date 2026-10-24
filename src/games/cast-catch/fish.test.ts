import { describe, expect, it } from 'vitest';
import { castQuality, catchFish, FISH, pointsFor } from './fish';

describe('cast and catch', () => {
  it('rates casts: the sweet spot is best, a short cast is worst', () => {
    expect(castQuality(0.62)).toBe(3);
    expect(castQuality(0.72)).toBe(2);
    expect(castQuality(0.1)).toBe(0);
  });
  it('a weak cast never lands a legendary fish; sizes stay in range', () => {
    for (let i = 0; i < 200; i++) {
      const { fish, cm } = catchFish(0);
      expect(fish.rarity).toBeLessThan(2);
      expect(cm).toBeGreaterThanOrEqual(fish.cm[0]);
      expect(cm).toBeLessThanOrEqual(fish.cm[1]);
    }
  });
  it('rarer and bigger fish are worth more', () => {
    const guppy = FISH.find((f) => f.id === 'guppy')!, koi = FISH.find((f) => f.id === 'goldfish')!;
    expect(pointsFor(koi, 40)).toBeGreaterThan(pointsFor(guppy, 5));
  });
});
