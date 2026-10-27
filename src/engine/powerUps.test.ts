import { describe, expect, it } from 'vitest';
import { rollPowerUp } from './powerUps';
import type { ThemeItem } from '../theme/types';

const item = (id: string, often: 1 | 2 | 3): ThemeItem => ({ id, name: id, ability: 'bonus', motion: 'none', often });

describe('power-up rolls', () => {
  it('comes about a third of the time, never with no items', () => {
    expect(rollPowerUp([], () => 0)).toBeNull();
    expect(rollPowerUp([item('a', 1)], () => 0.9)).toBeNull();
    expect(rollPowerUp([item('a', 1)], () => 0.1)?.id).toBe('a');
  });
  it('items marked often turn up more', () => {
    let seed = 1;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const counts: Record<string, number> = { a: 0, b: 0 };
    for (let i = 0; i < 4000; i++) { const it = rollPowerUp([item('a', 1), item('b', 3)], rand, 1); if (it) counts[it.id]++; }
    expect(counts.b).toBeGreaterThan(counts.a * 2);
  });
});
