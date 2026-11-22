import { describe, expect, it } from 'vitest';
import { holeGrid, maxUp, pickHole, upTime } from './rules';

describe('mole bop rules', () => {
  it('lays out a garden that fits wide and tall boxes', () => {
    expect(holeGrid(160)).toHaveLength(12);
    expect(holeGrid(140)).toHaveLength(9);
    expect(holeGrid(80)).toHaveLength(12);
    for (const W of [80, 120, 160, 210]) for (const h of holeGrid(W)) {
      expect(h.x - h.size / 2).toBeGreaterThan(0);
      expect(h.x + h.size / 2).toBeLessThan(W);
      expect(h.y).toBeLessThanOrEqual(97);
    }
  });
  it('back rows are smaller than front rows', () => {
    const g = holeGrid(140);
    expect(g[0].size).toBeLessThan(g[g.length - 1].size);
  });
  it('picks only empty holes and never the last one', () => {
    const busy = [true, false, false, true];
    for (let i = 0; i < 50; i++) { const h = pickHole(busy, 1); expect(h).toBe(2); }
    expect(pickHole([true, true], -1)).toBe(-1);
  });
  it('moles stay up long enough to read', () => {
    for (let t = 0; t < 60; t += 5) expect(upTime(t, () => 0)).toBeGreaterThanOrEqual(1.8);
    expect(maxUp(4, 9)).toBe(5);
    expect(maxUp(4, 6)).toBe(4);
  });
});
