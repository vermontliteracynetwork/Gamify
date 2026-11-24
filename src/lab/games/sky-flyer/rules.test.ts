import { describe, expect, it } from 'vitest';
import { BOTTOM, inCloud, lanes, steer, TOP } from './rules';

describe('sky flyer rules', () => {
  it('spreads clouds evenly from top to bottom', () => {
    expect(lanes(4)).toEqual([TOP, TOP + 21, TOP + 42, BOTTOM]);
    expect(lanes(1)).toHaveLength(1);
    expect(lanes(3)[1]).toBeCloseTo((TOP + BOTTOM) / 2);
  });
  it('climbs on up, dives on down and glides to a stop', () => {
    let p = { y: 60, vy: 0 };
    for (let i = 0; i < 20; i++) p = steer(p.y, p.vy, 1 / 60, -1);
    expect(p.y).toBeLessThan(60);
    let q = { y: 60, vy: 0 };
    for (let i = 0; i < 20; i++) q = steer(q.y, q.vy, 1 / 60, 1);
    expect(q.y).toBeGreaterThan(60);
    for (let i = 0; i < 200; i++) q = steer(q.y, q.vy, 1 / 60, 0);
    expect(Math.abs(q.vy)).toBeLessThan(1);
  });
  it('never leaves the sky', () => {
    let p = { y: 60, vy: 0 };
    for (let i = 0; i < 400; i++) p = steer(p.y, p.vy, 1 / 60, -1);
    expect(p.y).toBeGreaterThanOrEqual(TOP - 4);
  });
  it('flies to a tapped height', () => {
    let p = { y: 40, vy: 0 };
    for (let i = 0; i < 240; i++) p = steer(p.y, p.vy, 1 / 60, 0, 80);
    expect(Math.abs(p.y - 80)).toBeLessThan(4);
  });
  it('knows when the plane is in a cloud', () => {
    expect(inCloud(30, 50, 32, 52, 8, 6)).toBe(true);
    expect(inCloud(30, 50, 32, 62, 8, 6)).toBe(false);
  });
});
