import { describe, expect, it } from 'vitest';
import { readOnlyIds } from './downgrade';

describe('downgrade rules', () => {
  it('keeps the oldest items up to the limit editable and nothing else', () => {
    const items = [{ id: 'c', createdAt: '2026-03' }, { id: 'a', createdAt: '2026-01' }, { id: 'b', createdAt: '2026-02' }];
    expect([...readOnlyIds(items, 2)]).toEqual(['c']);
    expect(readOnlyIds(items, 3).size).toBe(0);
    expect(readOnlyIds(items, Infinity).size).toBe(0);
  });
});
