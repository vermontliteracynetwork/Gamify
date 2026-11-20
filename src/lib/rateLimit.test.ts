import { describe, expect, it } from 'vitest';
import { limited } from './rateLimit';

describe('rate limit', () => {
  it('lets a few tries through, then stops more in the same window', () => {
    const now = 1_000_000;
    for (let i = 0; i < 5; i++) expect(limited('t1', 5, 60_000, now + i)).toBe(false);
    expect(limited('t1', 5, 60_000, now + 10)).toBe(true);
    expect(limited('t1', 5, 60_000, now + 120_000)).toBe(false);
  });
});
