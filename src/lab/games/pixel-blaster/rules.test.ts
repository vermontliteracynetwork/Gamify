import { describe, expect, it } from 'vitest';
import { cpuTarget, hits, rightPoints, shuffleSlots, slotX, sweep, W, wrap } from './rules';

describe('pixel blaster', () => {
  it('spreads answer aliens evenly around the middle', () => {
    expect(slotX(0, 1, W / 2)).toBe(W / 2);
    expect(slotX(0, 4, 360) + slotX(3, 4, 360)).toBe(720);
    expect(sweep(4)).toBeGreaterThanOrEqual(20);
  });
  it('a bolt hits the alien or its sign, not the space beside it', () => {
    expect(hits(100, 100, 120, 110)).toBe(true);
    expect(hits(100, 100, 100, 170)).toBe(true); // the sign
    expect(hits(100, 100, 200, 110)).toBe(false);
  });
  it('combo points grow and stop at 6', () => {
    expect(rightPoints(0)).toBe(3);
    expect(rightPoints(9)).toBe(6);
  });
  it('wraps answers onto sign lines', () => {
    expect(wrap('big red fire truck', 9)).toEqual(['big red', 'fire', 'truck']);
    expect(wrap('cat')).toEqual(['cat']);
  });
  it('the computer aims right when it knows, wrong when it does not', () => {
    expect(cpuTarget(4, 2, true)).toBe(2);
    expect(cpuTarget(4, 2, false, () => 0)).not.toBe(2);
  });
  it('disco always moves someone', () => {
    const o = shuffleSlots(4);
    expect([...o].sort()).toEqual([0, 1, 2, 3]);
    expect(o.every((v, i) => v === i)).toBe(false);
  });
});
