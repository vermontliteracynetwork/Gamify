import { describe, expect, it } from 'vitest';
import { layout, placePowers, spaceKinds, tornadoSpots, TRAIL_SPACES, wheelStop } from './board';

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
  it('tornado spreads players evenly and never back home', () => {
    for (let s = 1; s < 30; s++) {
      const pos = [5, 5, 12, 20];
      const out = tornadoSpots(pos, [true, true, true, false], 40, seeded(s));
      expect(out[3]).toBe(20);
      [0, 1, 2].forEach((i) => expect(out[i]).not.toBe(pos[i]));
      expect(new Set(out.slice(0, 3)).size).toBe(3);
    }
  });
  it('wheel stops on the half it picked', () => {
    for (let s = 1; s < 20; s++) {
      const fwd = (360 - (wheelStop(true, seeded(s)) % 360)) % 360;
      const back = (360 - (wheelStop(false, seeded(s)) % 360)) % 360;
      expect(fwd).toBeLessThan(180);
      expect(back).toBeGreaterThan(180);
    }
  });
});
