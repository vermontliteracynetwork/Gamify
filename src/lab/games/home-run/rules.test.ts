import { describe, expect, it } from 'vitest';
import { advance, cpuSwing, inningOver, openBase, swingResult } from './rules';

const fixed = (v: number) => () => v;

describe('home run derby', () => {
  it('a perfect swing is a home run, a late one a miss', () => {
    expect(swingResult(20, { rand: fixed(0.5) }).hit).toBe(4);
    expect(swingResult(90, { rand: fixed(0.5) }).hit).toBe(4);
    expect(swingResult(400, { rand: fixed(0.5) }).hit).toBe(0);
    expect(swingResult(null).hit).toBe(0);
  });
  it('a giant bat widens the timing', () => {
    expect(swingResult(420, { rand: fixed(0.5) }).hit).toBe(0);
    expect(swingResult(420, { giant: true, rand: fixed(0.5) }).hit).toBeGreaterThan(0);
  });
  it('rally cap adds a base and is never caught', () => {
    const r = swingResult(300, { rally: true, rand: fixed(0.05) });
    expect(r.caught).toBe(false);
    expect(r.hit).toBe(3);
  });
  it('runners advance and score', () => {
    expect(advance([1, 3], 1)).toEqual({ runners: [2, 1], runs: 1 });
    expect(advance([1, 2, 3], 4)).toEqual({ runners: [], runs: 4 });
    expect(advance([], 2)).toEqual({ runners: [2], runs: 0 });
  });
  it('finds an open base and ends innings', () => {
    expect(openBase([])).toBe(2);
    expect(openBase([2])).toBe(1);
    expect(openBase([1, 2, 3])).toBeNull();
    expect(inningOver(3, 3, 1)).toBe(true);
    expect(inningOver(3, 4, 1)).toBe(false);
    expect(inningOver(0, 3, 5)).toBe(true);
  });
  it('the computer swings close when sharp', () => {
    expect(cpuSwing(true, fixed(0.5))).toBe(85);
    expect(cpuSwing(false, fixed(0.7))).toBeNull();
  });
});
