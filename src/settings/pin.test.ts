import { describe, expect, it } from 'vitest';
import { hashPin, isValidPin } from './pin';

describe('teacher PIN', () => {
  it('accepts exactly 4 digits', () => {
    expect(['1234', '0000'].map(isValidPin)).toEqual([true, true]);
    expect(['123', '12345', 'abcd', '12a4'].map(isValidPin)).toEqual([false, false, false, false]);
  });
  it('hashes the same PIN the same way and never stores the digits', async () => {
    const a = await hashPin('2580');
    expect(a).toBe(await hashPin('2580'));
    expect(a).not.toBe(await hashPin('2581'));
    expect(a).not.toContain('2580');
  });
});
