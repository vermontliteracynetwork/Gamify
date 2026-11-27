import { describe, expect, it } from 'vitest';
import { layout, placePowers, spaceKinds, tornadoSpots, TRAIL_SPACES } from './board';

const seeded = (s = 1) => () => { s = (s * 16807) % 2147483647; return s / 2147483647; };

describe('Board Game board', () => {
  it('lays every square next to the one before it', () => {
    for (const n of Object.values(TRAIL_SPACES)) for (const [w, h] of [[1000, 600], [600, 900], [1400, 700]]) {
      const L = layout(n, w, h);
      expect(L.cells).toHaveLength(n);
      for (let i = 1; i < n; i++) expect(Math.abs(L.cells[i].x - L.cells[i - 1].x) + Math.abs(L.cells[i].y - L.cells[i - 1].y)).toBe(1);
      expect(L.cols * L.size).toBeLessThanOrEqual(w + 0.01);
      expect(L.rows * L.size).toBeLessThanOrEqual(h + 0.01);
    }
  });
  it('keeps special squares apart and off the ends', () => {
    const k = spaceKinds(40, seeded(3));
    k.forEach((v, i) => { if (v !== 'regular') { expect(i).toBeGreaterThan(2); expect(i).toBeLessThan(37); expect(k[i + 1]).toBe('regular'); } });
    expect(k.filter((v) => v === 'lose').length).toBeGreaterThan(0);
    expect(k.filter((v) => v === 'again').length).toBeGreaterThan(0);
  });
  it('hides power-ups only on regular squares', () => {
    const k = spaceKinds(52, seeded(5));
    const p = placePowers(k, ['double', 'tornado'], seeded(9));
    expect(p.size).toBeGreaterThan(2);
    for (const i of p.keys()) expect(k[i]).toBe('regular');
  });
  it('spreads power-ups evenly, never the same one twice in a row', () => {
    for (let seed = 1; seed < 20; seed++) {
      const k = spaceKinds(60, seeded(seed));
      const p = placePowers(k, ['double', 'x2', 'potion'], seeded(seed + 50));
      const along = [...p.keys()].sort((a, b) => a - b).map((i) => p.get(i));
      for (let i = 1; i < along.length; i++) expect(along[i]).not.toBe(along[i - 1]);
      const n = ['double', 'x2', 'potion'].map((x) => along.filter((v) => v === x).length);
      expect(Math.max(...n) - Math.min(...n)).toBeLessThanOrEqual(1);
    }
  });
  it('tornado spreads players evenly and never back home', () => {
    for (let s = 1; s < 30; s++) {
      const pos = [5, 5, 12, 20];
      const out = tornadoSpots(pos, [true, true, true, false], 40, seeded(s));
      expect(out[3]).toBe(20);
      [0, 1, 2].forEach((i) => expect(out[i]).not.toBe(pos[i]));
      expect(new Set(out.slice(0, 3)).size).toBe(3);
    }
  });
});
