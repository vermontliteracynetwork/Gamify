import { describe, expect, it } from 'vitest';
import { binAt, cpuBin, freeLane, pickBins, scoreFor } from './sorter';

describe('sort rush', () => {
  it('scores more on a combo and doubles', () => {
    expect(scoreFor(0)).toBe(1);
    expect(scoreFor(4)).toBe(1);
    expect(scoreFor(5)).toBe(2);
    expect(scoreFor(9, true)).toBe(4);
  });
  it('finds the bin under a spot', () => {
    expect(binAt(0.1, 3)).toBe(0);
    expect(binAt(0.5, 3)).toBe(1);
    expect(binAt(0.99, 3)).toBe(2);
    expect(binAt(1.2, 2)).toBe(1);
  });
  it('picks a lane nobody is using', () => {
    expect(freeLane([0, 1, 2])).toBe(3);
  });
  it('the computer misses into another bin', () => {
    expect(cpuBin(1, 3, true)).toBe(1);
    expect(cpuBin(1, 3, false, () => 0)).toBe(0);
  });
  it('bins never share an answer', () => {
    const qs = [{ id: 'a', prompt: '1+1', answer: '2' }, { id: 'b', prompt: '4-2', answer: '2' }, { id: 'c', prompt: '2+1', answer: '3' }, { id: 'd', prompt: '2+2', answer: '4' }];
    let i = 0;
    const bins = pickBins(() => qs[i++ % qs.length], 3);
    expect(new Set(bins.map((b) => b.answer)).size).toBe(3);
  });
});
