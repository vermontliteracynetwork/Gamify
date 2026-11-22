import { describe, expect, it } from 'vitest';
import { aimAt, cpuAim, landErr, RELEASE_Y, simulate, SPOTS } from './rules';

const shot = (angle: number, spot: 'two' | 'three' = 'two', ideal = 56) => ({ from: { x: SPOTS[spot].x + 2, y: RELEASE_Y }, angle, ideal, gravity: 86, rimR: 4.6 });

describe('hoop shot', () => {
  it('the ideal angle drops right in the middle', () => {
    expect(Math.abs(landErr(shot(56)))).toBeLessThan(0.01);
    expect(simulate(shot(66, 'two', 66)).made).toBe(true);
    expect(simulate(shot(58, 'three', 58)).made).toBe(true);
  });
  it('a wild aim misses', () => {
    expect(simulate(shot(80, 'two', 66)).made).toBe(false);
    expect(simulate(shot(40, 'three', 58)).made).toBe(false);
  });
  it('a 3 point shot is touchier than a 2', () => {
    expect(Math.abs(landErr(shot(62, 'three', 58)))).toBeGreaterThan(Math.abs(landErr(shot(70, 'two', 66))));
  });
  it('the aim arrow swings and the computer aims', () => {
    expect(aimAt(0, 2)).toBe(55);
    expect(Math.abs(cpuAim(56, true, () => 0.5) - 56)).toBeLessThan(0.01);
    expect(Math.abs(cpuAim(56, false, () => 0.9) - 56)).toBeGreaterThan(4);
  });
});
