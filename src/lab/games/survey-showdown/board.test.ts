import { describe, expect, it } from 'vitest';
import { buildBoard, cpuPick, decoys } from './board';

describe('survey showdown', () => {
  it('puts the right answer on top, worth the most, falling after', () => {
    for (let k = 0; k < 50; k++) {
      const b = buildBoard(['Red', 'Blue', 'Green', 'Pink'], 2);
      expect(b[0].text).toBe('Green');
      expect(b[0].top).toBe(true);
      for (let i = 1; i < b.length; i++) { expect(b[i].points).toBeLessThan(b[i - 1].points); expect(b[i].points).toBeGreaterThan(0); }
      expect(b.length).toBe(4);
    }
  });
  it('handles two choices and repeats', () => {
    const b = buildBoard(['True', 'False', 'true'], 0);
    expect(b.map((s) => s.text)).toEqual(['True', 'False']);
  });
  it('decoys are never on the board', () => {
    const b = buildBoard(['Cat', 'Dog'], 0);
    const d = decoys(['cat', 'Fish', 'Fish', 'Bird'], b, 2);
    expect(d.sort()).toEqual(['Bird', 'Fish']);
  });
  it('a sharp computer finds a hidden answer', () => {
    const b = buildBoard(['A', 'B', 'C'], 1);
    const list = [...b.map((s) => ({ text: s.text, real: true })), { text: 'Z', real: false }];
    expect(b.some((s) => s.text === cpuPick(list, [], b, [false, false, false], true, () => 0.1))).toBe(true);
  });
});
