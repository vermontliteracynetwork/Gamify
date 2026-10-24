import { describe, expect, it } from 'vitest';
import { isGuessing } from './useAsk';

describe('guessing check', () => {
  const miss = (at: number, ms = 1000) => ({ at, ms, right: false });
  it('catches 4 fast misses within 90 seconds', () => expect(isGuessing([miss(0), miss(5_000), miss(10_000), miss(15_000)])).toBe(true));
  it('ignores slow, thoughtful misses', () => expect(isGuessing([miss(0), miss(5_000, 8000), miss(10_000), miss(15_000)])).toBe(false));
  it('ignores misses spread over more than 90 seconds', () => expect(isGuessing([miss(0), miss(40_000), miss(80_000), miss(120_000)])).toBe(false));
  it('a right answer breaks the run', () => expect(isGuessing([miss(0), { at: 1, ms: 900, right: true }, miss(2), miss(3)])).toBe(false));
});
