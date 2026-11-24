import { describe, expect, it } from 'vitest';
import { canGo, dealZones, dirTo, cloudDir, makeMaze, path, step, zoneOf, type Dir } from './rules';

function reach(m: ReturnType<typeof makeMaze>) {
  const seen = new Set([m.start]); const q = [m.start];
  while (q.length) { const i = q.shift()!; for (let d = 0 as Dir; d < 4; d = (d + 1) as Dir) if (canGo(m, i, d)) { const j = step(m, i, d); if (!seen.has(j)) { seen.add(j); q.push(j); } } }
  return seen;
}

describe('maze dash rules', () => {
  it('every cell of every maze can be reached', () => {
    for (const [c, r] of [[9, 9], [13, 9], [17, 9], [9, 7]]) {
      const m = makeMaze(c, r);
      expect(reach(m).size).toBe(c * r);
    }
  });
  it('walls agree on both sides and the edge is closed', () => {
    const m = makeMaze(13, 9);
    for (let i = 0; i < m.walls.length; i++) for (let d = 0 as Dir; d < 4; d = (d + 1) as Dir) {
      const c = i % 13 + [0, 1, 0, -1][d], r = Math.floor(i / 13) + [-1, 0, 1, 0][d];
      if (c < 0 || r < 0 || c >= 13 || r >= 9) expect(canGo(m, i, d)).toBe(false);
      else if (canGo(m, i, d)) expect(canGo(m, step(m, i, d), ((d + 2) % 4) as Dir)).toBe(true);
    }
  });
  it('has four corner rooms and a path to each from the start', () => {
    const m = makeMaze(13, 9);
    expect(m.zones).toHaveLength(4);
    for (const z of m.zones) {
      const p = path(m, m.start, z);
      expect(p.length).toBeGreaterThan(0);
      let at = m.start;
      for (const j of p) { expect(dirTo(m, at, j)).not.toBeNull(); at = j; }
      expect(zoneOf(m, at)).toBe(m.zones.indexOf(z));
    }
  });
  it('deals answers to rooms, never the right one where the runner stands', () => {
    for (let k = 0; k < 200; k++) {
      const out = dealZones(4, 2, 1);
      expect(out[1]).not.toBe(2);
      expect([...out].sort()).toEqual([0, 1, 2, 3]);
    }
    expect(dealZones(2, 0, -1).filter((v) => v >= 0)).toHaveLength(2);
    expect(dealZones(3, 0, -1).filter((v) => v >= 0)).toHaveLength(3);
    for (let k = 0; k < 100; k++) { const six = dealZones(6, 5, 0); expect(six).toContain(5); expect(six[0]).not.toBe(5); expect(new Set(six).size).toBe(4); }
  });
  it('a wandering cloud never walks through a wall', () => {
    const m = makeMaze(13, 9);
    let at = m.start, came: Dir | null = null;
    for (let k = 0; k < 300; k++) { const d = cloudDir(m, at, came, 0, 0.5); expect(canGo(m, at, d)).toBe(true); at = step(m, at, d); came = d; }
  });
});
