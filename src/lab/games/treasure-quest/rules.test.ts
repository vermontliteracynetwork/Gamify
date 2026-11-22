import { describe, expect, it } from 'vitest';
import { applyChest, heapRows, richest, rollChest } from './rules';

const seq = (...v: number[]) => { let i = 0; return () => v[i++ % v.length]; };

describe('treasure quest', () => {
  it('never rolls takes or swaps when no one else has gold', () => {
    for (let i = 0; i < 300; i++) expect(['take', 'swap']).not.toContain(rollChest({ others: false, mine: 50 }).kind);
  });
  it('never rolls double or lose at zero gold', () => {
    for (let i = 0; i < 300; i++) expect(['double', 'lose']).not.toContain(rollChest({ others: true, mine: 0 }).kind);
  });
  it('lucky clover has no lose or moth', () => {
    for (let i = 0; i < 300; i++) expect(['lose', 'moth']).not.toContain(rollChest({ others: true, mine: 40, clover: true }).kind);
  });
  it('gold is 10 to 50', () => {
    const c = rollChest({ others: false, mine: 0 }, seq(0, 0.99));
    expect(c).toEqual({ kind: 'gold', n: 50 });
  });
  it('applies every chest', () => {
    const s = { a: 40, b: 100 };
    expect(applyChest(s, 'a', { kind: 'gold', n: 20 })).toEqual({ a: 60, b: 100 });
    expect(applyChest(s, 'a', { kind: 'gold', n: 20 }, undefined, true)).toEqual({ a: 80, b: 100 });
    expect(applyChest(s, 'a', { kind: 'double' })).toEqual({ a: 80, b: 100 });
    expect(applyChest(s, 'a', { kind: 'lose', pct: 25 })).toEqual({ a: 30, b: 100 });
    expect(applyChest(s, 'a', { kind: 'take', pct: 25 }, 'b')).toEqual({ a: 65, b: 75 });
    expect(applyChest(s, 'a', { kind: 'swap' }, 'b')).toEqual({ a: 100, b: 40 });
    expect(applyChest(s, 'a', { kind: 'moth' })).toEqual(s);
    expect(applyChest({ a: 3 }, 'a', { kind: 'lose', pct: 25 })).toEqual({ a: 0 });
  });
  it('picks the richest other team', () => {
    expect(richest({ a: 90, b: 10, c: 50 }, 'a')).toBe('c');
    expect(richest({ a: 90, b: 0 }, 'a')).toBeUndefined();
  });
  it('builds a heap', () => {
    expect(heapRows(12)).toEqual([5, 4, 3]);
    expect(heapRows(0)).toEqual([]);
  });
});
