import { describe, expect, it } from 'vitest';
import { cpuAim, grabChance, makePile, makePrize, refill, slipChance, under, VALUE } from './rules';

describe('prize crane', () => {
  it('makes a pile of ten', () => {
    const pile = makePile(1);
    expect(pile).toHaveLength(10);
    expect(pile.filter((p) => p.row === 1)).toHaveLength(4);
  });
  it('grabs the top prize under the claw', () => {
    const pile = [makePrize(1, 0.5, 0, Math.random, 'common'), makePrize(2, 0.52, 1, Math.random, 'common')];
    expect(under(pile, 0.5)?.id).toBe(2);
    expect(under(pile, 0.9)).toBeNull();
  });
  it('centered grabs are likelier, rare ones harder', () => {
    const c = makePrize(1, 0.5, 0, Math.random, 'common'), s = makePrize(2, 0.5, 0, Math.random, 'super');
    expect(grabChance(c, 0.5)).toBeGreaterThan(grabChance(c, 0.57));
    expect(grabChance(c, 0.5)).toBeGreaterThan(grabChance(s, 0.5));
    expect(grabChance(c, 0.62)).toBe(0);
    expect(grabChance(c, 0.62, { wide: true })).toBeGreaterThan(0);
  });
  it('super grip never slips, butter fingers slip more', () => {
    const c = makePrize(1, 0.5, 0, Math.random, 'rare');
    expect(slipChance(c, { grip: true })).toBe(0);
    expect(slipChance(c, { butter: true })).toBeGreaterThan(slipChance(c));
  });
  it('the sharp computer aims at the best prize', () => {
    const pile = [makePrize(1, 0.3, 0, Math.random, 'common'), makePrize(2, 0.7, 0, Math.random, 'super')];
    expect(Math.abs(cpuAim(pile, true) - 0.7)).toBeLessThan(0.03);
    expect(VALUE.super).toBeGreaterThan(VALUE.common);
  });
  it('refills the biggest gap', () => {
    const pile = [makePrize(1, 0.3, 0), makePrize(2, 0.4, 0)];
    expect(refill(pile, 3).x).toBeGreaterThan(0.6);
  });
});
