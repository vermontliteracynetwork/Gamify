import { describe, expect, it } from 'vitest';
import { titleCase } from './Title';

describe('heading title case', () => {
  it('capitalizes every word, small words too (owner 2026-11-26)', () => {
    expect(titleCase('pick a theme')).toBe('Pick A Theme');
    expect(titleCase('the game of the year')).toBe('The Game Of The Year');
    expect(titleCase('Step 2 of 4: the board')).toBe('Step 2 Of 4: The Board');
    expect(titleCase("ava's arcade")).toBe("Ava's Arcade");
    expect(titleCase('US government basics')).toBe('US Government Basics');
  });
});
