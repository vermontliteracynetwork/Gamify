import { describe, expect, it } from 'vitest';
import { cleared, count, cpuDig, deduce, dig, emptyBoard, neighbors, place, shuffleRocks } from './rules';

describe('gem sweep', () => {
  it('first dig is always safe and opens a patch', () => {
    for (let k = 0; k < 30; k++) {
      const b = place(emptyBoard(), 40);
      expect(b.rock.filter(Boolean).length).toBe(11);
      const r = dig(b, 40);
      expect(r.rock).toBe(false);
      expect(r.opened.length).toBeGreaterThanOrEqual(1);
      expect(count(b, 40)).toBe(0);
    }
  });
  it('counts rocks around a cell', () => {
    const b = emptyBoard(3, 3, 0);
    b.rock[0] = true; b.rock[2] = true; b.made = true;
    expect(count(b, 4)).toBe(2);
    expect(neighbors(b, 0).length).toBe(3);
  });
  it('a rock dig is a rock; all safe open is cleared', () => {
    let b = emptyBoard(2, 1, 0); b.rock[0] = true; b.made = true;
    expect(dig(b, 0).rock).toBe(true);
    b = dig(b, 1).board;
    expect(cleared(b)).toBe(true);
  });
  it('deduces safe cells and rocks', () => {
    const b = emptyBoard(3, 1, 0); b.rock[2] = true; b.made = true; b.open[0] = true; b.open[1] = true;
    expect(deduce(b).rocks).toEqual([2]);
    const b2 = emptyBoard(3, 1, 0); b2.made = true; b2.rock[2] = true; b2.flag[2] = true; b2.open[1] = true;
    expect(deduce(b2).safe).toEqual([0]);
    expect(cpuDig(b2, true)).toBe(0);
  });
  it('rock party keeps the number of rocks', () => {
    const b = place(emptyBoard(), 0);
    const opened = dig(b, 0).board;
    const s = shuffleRocks(opened);
    expect(s.rock.filter(Boolean).length).toBe(11);
    expect(s.rock.every((r, i) => !r || !opened.open[i])).toBe(true);
  });
});
