import { describe, expect, it } from 'vitest';
import { evaluate } from './arithmetic';

describe('calculator', () => {
  it('follows order of operations', () => expect(evaluate('2+3×4')).toBe(14));
  it('handles division and decimals', () => expect(evaluate('7÷2−0.5')).toBe(3));
  it('rejects broken input', () => expect([evaluate('3+'), evaluate('×3'), evaluate('abc'), evaluate('1/0')]).toEqual([null, null, null, null]));
});
