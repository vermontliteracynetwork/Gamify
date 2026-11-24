import { describe, expect, it } from 'vitest';
import { isPair, pairTiles, ringSpots, ringTiles, speedBonus } from './match';

describe('spot the match', () => {
  it('a ring has one right tile and no repeats', () => {
    const t = ringTiles(['Cat', 'Dog', 'cat', 'Fish'], 1, ['Bird', 'Dog', 'Frog', 'Bee', 'Ant'], 6);
    expect(t.filter((x) => x.right).map((x) => x.text)).toEqual(['Dog']);
    expect(new Set(t.map((x) => x.text.toLowerCase())).size).toBe(t.length);
    expect(t.length).toBe(6);
  });
  it('pairs match a question to its answer only', () => {
    const p = pairTiles([{ id: 'a', prompt: '1+1', answer: '2' }, { id: 'b', prompt: '2+2', answer: '4' }]);
    expect(p.length).toBe(4);
    const q = p.find((x) => x.pair === 'a' && x.kind === 'q')!, a = p.find((x) => x.pair === 'a' && x.kind === 'a')!, b = p.find((x) => x.pair === 'b' && x.kind === 'a')!;
    expect(isPair(q, a)).toBe(true);
    expect(isPair(q, b)).toBe(false);
    expect(isPair(q, q)).toBe(false);
  });
  it('fast taps earn a bonus', () => {
    expect(speedBonus(10, 12)).toBe(1);
    expect(speedBonus(5, 12)).toBe(0);
    expect(speedBonus(1, 0)).toBe(0);
  });
  it('ring spots start at the top', () => {
    const s = ringSpots(4);
    expect(s[0].x).toBeCloseTo(0.5);
    expect(s[0].y).toBeCloseTo(0.14);
  });
});
