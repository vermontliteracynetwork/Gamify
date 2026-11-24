import { describe, expect, it } from 'vitest';
import { buildBoard, cpuPick, decoys, topPoints } from './board';

describe('top answers', () => {
  it('marks only the right answer as the top answer', () => {
    const b = buildBoard(['Red', 'Blue', 'Green', 'Pink'], 2);
    expect(b.length).toBe(4);
    expect(b.filter((s) => s.top).map((s) => s.text)).toEqual(['Green']);
  });
  it('drops repeats', () => {
    expect(buildBoard(['True', 'False', 'true'], 0).length).toBe(2);
  });
  it('scores 1 to 5, at most two times', () => {
    expect(topPoints(0)).toBe(5);
    expect(topPoints(3)).toBe(2);
    expect(topPoints(9)).toBe(1);
    expect(topPoints(0, true)).toBe(10);
  });
  it('decoys are never on the board', () => {
    const b = buildBoard(['Cat', 'Dog'], 0);
    expect(decoys(['cat', 'Fish', 'Fish', 'Bird'], b, 2).sort()).toEqual(['Bird', 'Fish']);
  });
  it('the computer finds the top answer when right, and misses when not', () => {
    const b = buildBoard(['A', 'B', 'C'], 1);
    const list = [...b.map((s) => ({ text: s.text, real: true })), { text: 'Z', real: false }];
    expect(cpuPick(list, [], b, true)).toBe('B');
    expect(cpuPick(list, [], b, false)).not.toBe('B');
  });
});
