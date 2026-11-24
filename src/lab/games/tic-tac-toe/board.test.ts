import { describe, expect, it } from 'vitest';
import { cpuPick, winLine } from './board';

describe('tic tac toe', () => {
  it('finds a winning line', () => {
    expect(winLine(['a', 'a', 'a', null, null, null, null, null, null])).toEqual([0, 1, 2]);
    expect(winLine(['a', 'b', 'a', null, null, null, null, null, null])).toBeNull();
  });
  it('computer wins, then blocks', () => {
    expect(cpuPick(['c', 'c', null, 'p', 'p', null, null, null, null], 'c', 'p')).toBe(2);
    expect(cpuPick(['p', 'p', null, null, 'c', null, null, null, null], 'c', 'p')).toBe(2);
  });
});
