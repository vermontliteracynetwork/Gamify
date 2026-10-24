import { describe, expect, it } from 'vitest';
import { balancedTeams, randomTeams } from './teamMaker';

describe('team maker', () => {
  const ids = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
  it('random teams use everyone once and differ in size by at most one', () => {
    const teams = randomTeams(ids, 3);
    expect(teams.flat().sort()).toEqual(ids);
    const sizes = teams.map((t) => t.length);
    expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1);
  });
  it('balanced teams snake-draft so the strongest two land on different teams', () => {
    const skill = { a: 0.95, b: 0.9, c: 0.6, d: 0.55, e: 0.3, f: 0.2, g: undefined };
    const teams = balancedTeams(ids, 2, skill, () => 0.5);
    expect(teams.flat().sort()).toEqual(ids);
    expect(teams.findIndex((t) => t.includes('a'))).not.toBe(teams.findIndex((t) => t.includes('b')));
    const even = balancedTeams(['a', 'b', 'c', 'd', 'e', 'f'], 2, skill, () => 0.5);
    const avg = (t: string[]) => t.reduce((s, id) => s + skill[id as 'a']!, 0) / t.length;
    expect(Math.abs(avg(even[0]) - avg(even[1]))).toBeLessThan(0.1);
  });
});
