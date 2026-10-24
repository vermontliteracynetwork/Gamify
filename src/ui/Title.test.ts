import { describe, expect, it } from 'vitest';
import { titleCase } from './Title';

describe('heading title case', () => {
  it('capitalizes words but not small ones in the middle', () => {
    expect(titleCase('pick a theme')).toBe('Pick a Theme');
    expect(titleCase('the game of the year')).toBe('The Game of the Year');
    expect(titleCase('what is it for')).toBe('What Is It For');
    expect(titleCase('Step 2 of 4: the board')).toBe('Step 2 of 4: The Board');
    expect(titleCase("ava's arcade")).toBe("Ava's Arcade");
    expect(titleCase('US government basics')).toBe('US Government Basics');
  });
});
