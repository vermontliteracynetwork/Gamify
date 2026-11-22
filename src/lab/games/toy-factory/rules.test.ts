import { describe, expect, it } from 'vitest';
import { applyCard, bestCard, drawCards, MAX_LEVEL, shiftCoins, SLOTS, type Machine } from './rules';

describe('toy factory', () => {
  it('offers new machines on an empty floor', () => {
    const cards = drawCards([]);
    expect(cards.length).toBe(3);
    expect(cards.every((c) => c.kind === 'new')).toBe(true);
  });
  it('a full floor only offers level-ups', () => {
    const floor: Machine[] = Array.from({ length: SLOTS }, (_, i) => ({ id: i, type: 'duck', level: 1 }));
    expect(drawCards(floor).every((c) => c.kind === 'upgrade')).toBe(true);
  });
  it('a maxed full floor offers nothing', () => {
    const floor: Machine[] = Array.from({ length: SLOTS }, (_, i) => ({ id: i, type: 'duck', level: MAX_LEVEL }));
    expect(drawCards(floor)).toEqual([]);
  });
  it('adds and upgrades machines', () => {
    let f = applyCard([], { kind: 'new', type: 'teddy' }, 1);
    expect(f).toEqual([{ id: 1, type: 'teddy', level: 1 }]);
    f = applyCard(f, { kind: 'upgrade', id: 1, type: 'teddy' }, 2);
    expect(f[0].level).toBe(2);
  });
  it('makes coins in a shift', () => {
    expect(shiftCoins({ id: 1, type: 'duck', level: 1 }, 6)).toBe(18);
    expect(shiftCoins({ id: 1, type: 'duck', level: 1 }, 6, 2)).toBe(36);
    expect(shiftCoins({ id: 1, type: 'rocket', level: 1 }, 6, 1, 2)).toBe(88);
  });
  it('the computer takes the best card', () => {
    expect(bestCard([], [{ kind: 'new', type: 'duck' }, { kind: 'new', type: 'rocket' }])).toEqual({ kind: 'new', type: 'rocket' });
  });
});
