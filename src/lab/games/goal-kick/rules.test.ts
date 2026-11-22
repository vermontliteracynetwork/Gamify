import { describe, expect, it } from 'vitest';
import { cpuKick, goalieDive, kickOutcome, windPush, zonePoints } from './rules';

const seq = (...v: number[]) => { let i = 0; return () => v[i++ % v.length]; };

describe('goal kick', () => {
  it('corners are worth more', () => {
    expect(zonePoints(0)).toBe(3);
    expect(zonePoints(4)).toBe(2);
  });
  it('the goalie saves its own zone, never an empty net', () => {
    expect(kickOutcome(4, 4, { rand: () => 0.9 })).toBe('save');
    expect(kickOutcome(4, null, { rand: () => 0.9 })).toBe('goal');
    expect(kickOutcome(3, 1, { rand: () => 0.9 })).toBe('goal');
  });
  it('a tiny goalie misses half the time, corners can ping the post', () => {
    expect(kickOutcome(4, 4, { tiny: true, rand: () => 0.2 })).toBe('goal');
    expect(kickOutcome(0, 5, { rand: () => 0.05 })).toBe('post');
  });
  it('the goalie guesses as often as its level', () => {
    expect(goalieDive(2, 'hard', seq(0.1))).toBe(2);
    expect(goalieDive(2, 'easy', seq(0.9, 0))).not.toBe(2);
  });
  it('wind stays inside the goal', () => {
    expect(windPush(0)).toBe(1);
    expect(windPush(5)).toBe(4);
    expect([0, 2]).toContain(windPush(1, () => 0.2) === 0 ? 0 : 2);
  });
  it('the computer aims for corners when sharp', () => {
    expect([0, 2]).toContain(cpuKick('hard', seq(0.1, 0.3)));
  });
});
