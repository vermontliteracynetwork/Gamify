import { describe, expect, it } from 'vitest';
import { crackPoints, fits, grade, keyMarks } from './lock';

describe('letter lock', () => {
  it('colors right spots, wrong spots and misses', () => {
    expect(grade('HOUSE', 'HORSE').join('')).toBe('ggxgg');
    expect(grade('TRAIN', 'RIVER').join('')).toBe('xyxyx');
  });
  it('counts repeated letters only as often as the word has them', () => {
    expect(grade('APPLE', 'PAPER').join('')).toBe('yygxy');
    expect(grade('LLAMA', 'HELLO').join('')).toBe('yyxxx');
  });
  it('keys keep their best color', () => {
    const k = keyMarks([{ word: 'TRAIN', marks: grade('TRAIN', 'RIVER') }, { word: 'RIVER', marks: grade('RIVER', 'RIVER') }]);
    expect(k.R).toBe('g'); expect(k.T).toBe('x');
  });
  it('finds words that still fit', () => {
    const rows = [{ word: 'TRAIN', marks: grade('TRAIN', 'RIVER') }];
    expect(fits('RIVER', rows)).toBe(true);
    expect(fits('TRAIN', rows)).toBe(false);
  });
  it('scores fewer tries higher', () => {
    expect(crackPoints(1)).toBe(6); expect(crackPoints(4)).toBe(3); expect(crackPoints(8)).toBe(3);
  });
});
