import { describe, expect, it } from 'vitest';
import { nextTile, scramble, spelled, wordPoints } from './scramble';

describe('word scramble', () => {
  it('never hands out the word already spelled', () => {
    for (let i = 0; i < 200; i++) {
      const o = scramble('CAT');
      expect(o.map((k) => 'CAT'[k]).join('')).not.toBe('CAT');
      expect([...o].sort()).toEqual([0, 1, 2]);
    }
    expect(scramble('AAA')).toEqual([0, 1, 2]);
  });
  it('points the hint at the next letter', () => {
    const letters = ['T', 'A', 'C'];
    expect(nextTile('CAT', [null, null, null], letters)).toBe(2);
    expect(nextTile('CAT', [2, null, null], letters)).toBe(1);
    expect(nextTile('CAT', [2, 1, 0], letters)).toBe(-1);
    expect(spelled([2, 1, 0], letters)).toBe('CAT');
  });
  it('scores every word the same', () => {
    expect(wordPoints('CAT')).toBe(3);
    expect(wordPoints('GARDEN')).toBe(3);
  });
});
