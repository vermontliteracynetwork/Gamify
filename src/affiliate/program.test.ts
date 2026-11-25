import { beforeEach, describe, expect, it } from 'vitest';
import { cleanCode, commission, currentRef, saveRef, validCode } from './program';

describe('affiliate program', () => {
  beforeEach(() => localStorage.clear());
  it('pays 25% of the first year', () => {
    expect(commission('plus', 'year')).toBe(19.2);
    expect(commission('pro', 'year')).toBe(36);
    expect(commission('plus', 'month')).toBe(24);
  });
  it('cleans codes to capitals and numbers', () => {
    expect(cleanCode(' @ms.rivera_3 ')).toBe('MSRIVERA3');
    expect(validCode('AB')).toBe(false);
    expect(validCode('MSRIVERA')).toBe(true);
  });
  it('remembers a referral for 60 days, last one wins', () => {
    saveRef('first', 0);
    saveRef('second', 1000);
    expect(currentRef(2000)).toBe('SECOND');
    expect(currentRef(1000 + 61 * 86_400_000)).toBe('');
    saveRef('x', 0);
    expect(currentRef(0)).toBe('SECOND');
  });
});
