import { describe, expect, it } from 'vitest';
import { cpuLetter, hidden, lost, missCount, shown, solved } from './rules';

describe('save the snow pal', () => {
  it('shows guessed letters and finds a solve', () => {
    expect(shown('CAT', ['A'])).toEqual([null, 'A', null]);
    expect(solved('CAT', ['C', 'A', 'T'])).toBe(true);
    expect(solved('CAT', ['C', 'A'])).toBe(false);
  });
  it('counts misses and pieces lost, with cocoa refreezing', () => {
    expect(missCount('CAT', ['Z', 'A', 'Q'])).toBe(2);
    expect(lost('CAT', ['Z', 'Q'], 1)).toBe(1);
    expect(lost('CAT', ['Z'], 3)).toBe(0);
    expect(lost('CAT', 'BDEFGHIJ'.split(''), 0)).toBe(6);
  });
  it('lists hidden letters once', () => {
    expect(hidden('APPLE', ['A'])).toEqual(['P', 'L', 'E']);
  });
  it('a sharp computer guesses a letter of the word, the most common first', () => {
    expect(cpuLetter('APPLE', ['A'], true)).toBe('P');
    const l = cpuLetter('CAT', ['C'], false, () => 0);
    expect(['A', 'B'].includes(l)).toBe(true);
  });
});
