import { beforeEach, describe, expect, it } from 'vitest';
import { cleanCode, commission, currentRef, saveRef, validCode } from './program';

describe('affiliate program', () => {
  beforeEach(() => localStorage.clear());
  it('pays 25% of what the customer pays in the first year (after the follower offer)', () => {
    expect(commission('plus', 'year')).toBe(17.28);
    expect(commission('pro', 'year')).toBe(32.4);
    expect(commission('plus', 'half')).toBe(19.38);
    // Monthly plans earn nothing (owner, 2026-11-27).
    expect(commission('plus', 'month')).toBe(0);
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
