import { describe, expect, it } from 'vitest';
import { makeDealer, rollPowerUp } from './powerUps';
import type { ThemeItem } from '../theme/types';

const item = (id: string): ThemeItem => ({ id, name: id, ability: 'bonus', motion: 'none' });
const seeded = (s = 1) => () => { s = (s * 16807) % 2147483647; return s / 2147483647; };

describe('power-up rolls', () => {
  it('comes about a third of the time, never with no items', () => {
    expect(rollPowerUp([], () => 0)).toBeNull();
    expect(rollPowerUp([item('a')], () => 0.9)).toBeNull();
    expect(rollPowerUp([item('a')], () => 0.1)?.id).toBe('a');
  });
});

describe('the fair dealer', () => {
  const items = ['a', 'b', 'c', 'd'].map(item);
  it('never deals the same power-up twice in a row, and each comes up evenly', () => {
    const d = makeDealer(seeded(7), 1);
    const out: string[] = [];
    for (let i = 0; i < 400; i++) out.push(d.deal(items)!.id);
    for (let i = 1; i < out.length; i++) expect(out[i]).not.toBe(out[i - 1]);
    for (const id of ['a', 'b', 'c', 'd']) expect(out.filter((x) => x === id).length).toBe(100);
  });
  it('keeps every player within one power-up of the others', () => {
    const d = makeDealer(seeded(3));
    const everyone = ['p1', 'p2', 'p3'];
    const got: Record<string, number> = { p1: 0, p2: 0, p3: 0 };
    const rand = seeded(11);
    for (let i = 0; i < 600; i++) {
      // Some players answer right far more often than others.
      const who = rand() < 0.6 ? 'p1' : rand() < 0.7 ? 'p2' : 'p3';
      if (d.deal(items, who, everyone)) got[who]++;
      const n = Object.values(got);
      expect(Math.max(...n) - Math.min(...n)).toBeLessThanOrEqual(1);
    }
    expect(got.p3).toBeGreaterThan(10);
  });
  it('a player who is behind gets the next one for sure', () => {
    let r = 0;
    const d = makeDealer(() => r, 0.35);
    expect(d.deal(items, 'p1', ['p1', 'p2'])).not.toBeNull();
    // p1 waits until p2 has had one too.
    expect(d.deal(items, 'p1', ['p1', 'p2'])).toBeNull();
    // An unlucky roll still gives p2 one, because p2 is behind.
    r = 0.99;
    expect(d.deal(items, 'p2', ['p1', 'p2'])).not.toBeNull();
    // Now they are even, so the roll decides again.
    expect(d.deal(items, 'p2', ['p1', 'p2'])).toBeNull();
  });
  it('one item only: it can repeat, there is nothing else', () => {
    const d = makeDealer(seeded(), 1);
    expect(d.deal([item('a')])!.id).toBe('a');
    expect(d.deal([item('a')])!.id).toBe('a');
  });
});
