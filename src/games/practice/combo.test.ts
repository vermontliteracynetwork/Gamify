import { describe, expect, it } from 'vitest';
import { comboFx } from './Sky';

describe('combo stars (teacher, 2026-11-06)', () => {
  it('follows the ladder, then repeats every 5 from 30', () => {
    expect([1, 2, 3, 4, 5, 9, 10, 15, 20, 25, 26].map(comboFx)).toEqual([undefined, undefined, 'glow', undefined, 'mega', undefined, 'spin', 'shoot', 'pulse', 'rainbow', undefined]);
    expect([30, 35, 40, 45, 50, 55, 60, 61].map(comboFx)).toEqual(['glow', 'mega', 'spin', 'shoot', 'pulse', 'rainbow', 'glow', undefined]);
  });
});
