import { describe, expect, it } from 'vitest';
import { BOARD_H, BOARD_W, BRIDGES, castleStage, clampPos, FINISH, isBad, openChest, placePowers, roll, spotOf, TILES } from './board';

describe('castle quest board', () => {
  it('every tile sits on the board, and neighbors along the path touch', () => {
    for (let i = 0; i < TILES; i++) {
      const s = spotOf(i);
      expect(s.x).toBeGreaterThan(0); expect(s.x).toBeLessThan(BOARD_W);
      expect(s.y).toBeGreaterThan(0); expect(s.y).toBeLessThan(BOARD_H);
      if (i > 0) { const p = spotOf(i - 1); expect(Math.hypot(s.x - p.x, s.y - p.y)).toBeLessThan(70); }
    }
  });
  it('bridges only go forward', () => { for (const [a, b] of BRIDGES) expect(b).toBeGreaterThan(a); });
  it('power-up tiles are frequent, never on bridges or the start, never two in a row', () => {
    for (let k = 0; k < 30; k++) {
      const p = placePowers();
      expect(p.size).toBeGreaterThan(5);
      for (const i of p.keys()) { expect(i).toBeGreaterThan(0); expect(p.has(i + 1)).toBe(false); expect(BRIDGES.flat()).not.toContain(i); }
    }
  });
  it('chests hold good and bad surprises, rolls are 1 to 6, and moves stay on the board', () => {
    const seen = new Set<string>();
    for (let k = 0; k < 2000; k++) seen.add(JSON.stringify(openChest()));
    expect(seen.size).toBe(11);
    expect(isBad({ kind: 'move', n: -3 })).toBe(true);
    for (let k = 0; k < 200; k++) { const r = roll(); expect(r).toBeGreaterThanOrEqual(1); expect(r).toBeLessThanOrEqual(6); }
    expect([clampPos(-4), clampPos(99)]).toEqual([0, FINISH]);
  });
  it('the castle grows as the leader gets closer', () => {
    expect([0, 20, 40, 53, 54].map(castleStage)).toEqual([0, 1, 2, 3, 4]);
  });
});
