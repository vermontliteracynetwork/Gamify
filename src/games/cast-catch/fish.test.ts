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

import { catchItem, itemEffect } from './fish';
import type { ThemeItem } from '../../theme/types';
describe('power-up catches', () => {
  const boot: ThemeItem = { id: 'b', name: 'Boot', ability: 'lose', amount: 100, motion: 'bob', often: 3 };
  const rainbow: ThemeItem = { id: 'r', name: 'Rainbow fish', ability: 'points', amount: 1000, motion: 'sparkle', often: 1 };
  it('turns up on its chance, otherwise a fish', () => {
    expect(catchItem([], () => 0)).toBeNull();
    expect(catchItem([boot, rainbow], () => 0.1)?.name).toBe('Boot');
    expect(catchItem([boot, rainbow], () => 0.21)?.name).toBe('Rainbow fish');
    expect(catchItem([boot, rainbow], () => 0.5)).toBeNull();
  });
  it('caps every item together at 60 percent', () => {
    const many = Array.from({ length: 8 }, (_, i) => ({ ...boot, id: `b${i}` }));
    expect(catchItem(many, () => 0.59)).not.toBeNull();
    expect(catchItem(many, () => 0.61)).toBeNull();
  });
  it('does what its ability says', () => {
    expect(itemEffect(boot).points).toBe(-100);
    expect(itemEffect(rainbow).points).toBe(1000);
    expect(itemEffect({ ...boot, ability: 'time', amount: 15 }).seconds).toBe(15);
    expect(itemEffect({ ...boot, ability: 'double' }).double).toBe(true);
    expect([-50, 50, 100, 250, 500]).toContain(itemEffect({ ...boot, ability: 'mystery' }, () => 0.99).points);
  });
});
