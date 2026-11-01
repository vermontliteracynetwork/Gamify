import { describe, expect, it } from 'vitest';
import { H, LAUNCH, MAX_POCKETS, pickValues, pocketAt, pocketCount, seeded, simulateShot, TOP_Y, VALUES, W, ZONES } from './table';

describe('pinball table', () => {
  it('starts with three pockets and adds one each round, up to ten', () => {
    expect([1, 2, 3, 8, 9, 20].map(pocketCount)).toEqual([3, 4, 5, 10, 10, 10]);
  });
  it('values are 10 to 100, each once a round, and high values grow common later on', () => {
    for (let n = 1; n <= MAX_POCKETS; n++) {
      const v = pickValues(n, 0.5);
      expect(v).toHaveLength(n);
      expect(new Set(v).size).toBe(n);
      expect(v.every((x) => VALUES.includes(x))).toBe(true);
    }
    const avg = (p: number) => { let s = 0; for (let i = 0; i < 2000; i++) s += Math.max(...pickValues(3, p)); return s / 2000; };
    expect(avg(1)).toBeGreaterThan(avg(0) + 10);
  });
  it('pockets split the top evenly', () => {
    expect([pocketAt(6, 3), pocketAt(50, 3), pocketAt(94, 3)]).toEqual([0, 1, 2]);
  });
  it('shots start at the launcher, stay on the table, and end in a pocket at the top or the drain', () => {
    for (let seed = 1; seed < 40; seed++) for (let z = 0; z < ZONES; z++) for (const pw of [0, 0.3, 0.6, 1]) {
      const s = simulateShot(z, pw, { count: 5, rand: seeded(seed * 31 + z) });
      expect(s.frames[0]).toMatchObject(LAUNCH);
      expect(s.frames.every((q) => q.x >= 4.9 && q.x <= W - 4.9 && q.y >= 6 && q.y <= H)).toBe(true);
      expect(s.frames.every((q, i) => i === 0 || q.t >= s.frames[i - 1].t)).toBe(true);
      const end = s.frames[s.frames.length - 1];
      if (s.pocket === null) expect(end.y).toBeGreaterThan(110); else expect(end.y).toBeLessThan(TOP_Y);
    }
  });
  it('more power reaches the top more often, and no power never does without a lucky flip', () => {
    const rate = (pw: number) => { let n = 0; for (let k = 0; k < 300; k++) if (simulateShot(k % ZONES, pw, { count: 5, luck: 0, rand: seeded(k + 7) }).pocket !== null) n++; return n / 300; };
    expect(rate(0)).toBe(0);
    expect(rate(1)).toBeGreaterThan(0.9);
    expect(rate(1)).toBeGreaterThan(rate(0.4));
  });
  it('the same lane and power do not always land in the same place', () => {
    const spots = new Set<number>();
    for (let k = 0; k < 60; k++) { const s = simulateShot(1, 0.8, { count: 6, rand: seeded(k + 100) }); spots.add(s.pocket ?? -1); }
    expect(spots.size).toBeGreaterThan(1);
  });
  it('bumpers get hit, and a ball on a pocket line can rattle', () => {
    let bumps = 0, rattles = 0;
    for (let k = 0; k < 400; k++) { const s = simulateShot(k % ZONES, 0.5 + (k % 5) / 10, { count: 3 + (k % 8), rand: seeded(k + 9) }); bumps += s.bumps; if (s.rattled) rattles++; }
    expect(bumps).toBeGreaterThan(50);
    expect(rattles).toBeGreaterThan(0);
  });
  it('a sure shot always scores, and the magnet pulls it to the chosen pocket', () => {
    for (let k = 0; k < 100; k++) expect(simulateShot(k % ZONES, 0, { count: 4, sure: true, rand: seeded(k + 3) }).pocket).not.toBeNull();
    for (let k = 0; k < 50; k++) expect(simulateShot(k % ZONES, 0, { count: 6, sure: true, magnetTo: 4, rand: seeded(k + 5) }).pocket).toBe(4);
  });
});
