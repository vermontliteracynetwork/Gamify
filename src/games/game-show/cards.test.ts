import { describe, expect, it } from 'vitest';
import { dealCards, gridFor } from './cards';
import { gameShowManifest } from './manifest';

const classic = gameShowManifest.items!.classic;

describe('surprise cards', () => {
  it('deals the asked number with every power-up at least once', () => {
    for (const n of [12, 16, 20, 25, 36]) {
      const deck = dealCards(n, Math.random, classic);
      expect(deck).toHaveLength(n);
      for (const it of classic) expect(deck.some((c) => c.kind === 'power' && c.item.id === it.id)).toBe(true);
    }
  });

  it('deals only points when every power-up is off', () => {
    expect(dealCards(12, Math.random, []).every((c) => c.kind === 'points')).toBe(true);
    expect(dealCards(16, Math.random, [classic[0]]).filter((c) => c.kind !== 'points').every((c) => c.kind === 'power' && c.item.id === classic[0].id)).toBe(true);
  });

  it('turns a card count into its grid', () => {
    expect(gridFor(36)).toEqual({ cols: 6, rows: 6 });
    expect(gridFor(13)).toEqual({ cols: 4, rows: 3 });
  });
});
