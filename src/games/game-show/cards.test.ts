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

describe('fair power-up cards (owner, 2026-11-27)', () => {
  const items = ['a', 'b', 'c'].map((id) => ({ id, name: id, ability: 'bonus', motion: 'none' as const }));
  it('each power-up as often as the others, never twice in a row in board order', () => {
    for (let s = 1; s < 20; s++) {
      let seed = s;
      const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      const deck = dealCards(36, rand, items);
      const powers = deck.flatMap((c) => (c.kind === 'power' ? [c.item.id] : []));
      for (let i = 1; i < powers.length; i++) expect(powers[i]).not.toBe(powers[i - 1]);
      const n = ['a', 'b', 'c'].map((x) => powers.filter((v) => v === x).length);
      expect(Math.max(...n) - Math.min(...n)).toBeLessThanOrEqual(1);
    }
  });
});
