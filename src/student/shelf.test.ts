import { beforeEach, describe, expect, it } from 'vitest';
import { allStickers, award, owned } from './shelf';

describe('My shelf', () => {
  beforeEach(() => localStorage.clear());
  it('gives new stickers until a game is complete, then repeats', () => {
    const pool = allStickers().filter((s) => s.gameId === 'castle-quest');
    expect(pool.length).toBeGreaterThan(0);
    for (let k = 0; k < pool.length; k++) expect(award('castle-quest')!.isNew).toBe(true);
    expect(award('castle-quest')!.isNew).toBe(false);
    expect(owned().size).toBe(pool.length);
  });
  it('games without power-ups give nothing', () => { expect(award('no-such-game')).toBeNull(); });
});
