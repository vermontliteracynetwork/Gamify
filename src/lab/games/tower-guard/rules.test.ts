import { describe, expect, it } from 'vitest';
import { cpuBuild, newSim, PATH, PATH_LEN, pointAt, SPOTS, startWave, step, waveOf } from './rules';

const distToPath = (x: number, y: number) => {
  let best = Infinity;
  for (let d = 0; d <= PATH_LEN; d += 4) { const p = pointAt(d); best = Math.min(best, Math.hypot(p[0] - x, p[1] - y)); }
  return best;
};

describe('tower guard', () => {
  it('walks the path end to end', () => {
    expect(pointAt(0)).toEqual(PATH[0]);
    expect(pointAt(PATH_LEN + 10)).toEqual(PATH[PATH.length - 1]);
  });
  it('keeps every tower spot off the path', () => {
    for (const [x, y] of SPOTS) expect(distToPath(x, y)).toBeGreaterThan(70);
  });
  it('waves grow', () => {
    expect(waveOf(1).length).toBe(3);
    expect(waveOf(8).length).toBeGreaterThan(waveOf(2).length);
  });
  it('with no towers every blob bites the cake', () => {
    const s = newSim(); startWave(s, 1, () => 0.5);
    let bites = 0, done = false;
    for (let i = 0; i < 2000 && !done; i++) { const o = step(s, 0.05); bites += o.bites; done = o.done; }
    expect(done).toBe(true);
    expect(bites).toBe(3);
  });
  it('towers pop blobs and score for their owner', () => {
    const s = newSim(); startWave(s, 1, () => 0.5);
    s.towers = SPOTS.map((_, i) => ({ id: i + 1, spot: i, type: 'bubble' as const, level: 3, owner: 'a', cool: 0, fired: 0 }));
    let points = 0, done = false;
    for (let i = 0; i < 2000 && !done; i++) { const o = step(s, 0.05); points += o.pops.reduce((n, p) => n + p.points, 0); done = o.done; }
    expect(points).toBe(3);
  });
  it('the computer builds what it can afford', () => {
    const s = newSim();
    expect(cpuBuild(s, 'c', 10)).toBeNull();
    expect(cpuBuild(s, 'c', 40)?.kind).toBe('place');
  });
});
