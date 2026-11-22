import { describe, expect, it } from 'vitest';
import { advanceBall, cpuPlay, fieldGoalChance, runPlay } from './rules';

const seq = (...v: number[]) => { let i = 0; return () => v[i++ % v.length]; };

describe('touchdown drive', () => {
  it('runs gain a few yards, bombs gain a lot or fall', () => {
    const run = runPlay('run', { rand: () => 0.5 });
    expect(run.complete).toBe(true);
    expect(run.yards).toBeGreaterThan(2);
    expect(runPlay('bomb', { rand: () => 0.3 }).complete).toBe(false);
    expect(runPlay('bomb', { rand: seq(0.8, 0.5) }).yards).toBeGreaterThan(20);
    expect(runPlay('bomb', { rand: () => 0.01 }).picked).toBe(true);
  });
  it('juke never fails, turbo doubles, sprinklers halve', () => {
    expect(runPlay('bomb', { juke: true, rand: () => 0.3 }).complete).toBe(true);
    expect(runPlay('run', { turbo: true, rand: () => 0.5 }).yards).toBe(12);
    expect(runPlay('run', { sprinkler: true, rand: () => 0.5 }).yards).toBe(3);
  });
  it('reaching 100 is a touchdown', () => {
    expect(advanceBall(90, 15)).toEqual({ yard: 100, td: true });
    expect(advanceBall(5, -10).yard).toBe(1);
  });
  it('field goals only when close', () => {
    expect(fieldGoalChance(50)).toBe(0);
    expect(fieldGoalChance(85)).toBeGreaterThan(fieldGoalChance(70));
  });
  it('the computer runs near the goal and throws deep when far', () => {
    expect(cpuPlay(95, 3, true)).toBe('run');
    expect(cpuPlay(20, 2, true)).toBe('bomb');
  });
});
