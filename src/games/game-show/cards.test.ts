import { describe, expect, it } from 'vitest';
import { dealCards, gridFor, linesFilled } from './cards';
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

describe('row and column bonus', () => {
  const card = (by?: number) => ({ open: by !== undefined, by });
  it('counts a full row and a full column won by the same team', () => {
    // 3 x 2 board: team 0 has the whole top row and the first column.
    const cards = [card(0), card(0), card(0), card(0), card(1), card()];
    expect(linesFilled(cards, 3, 0)).toBe(2);
    expect(linesFilled(cards, 3, 1)).toBe(1);
    expect(linesFilled(cards, 3, 4)).toBe(0);
    expect(linesFilled(cards, 3, 5)).toBe(0);
  });
});
