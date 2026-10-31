import { describe, expect, it } from 'vitest';
import { BRIDGES, buildWorld, castleBlocks, castleStage, centerOf, clampPos, FINISH, isBad, openChest, PATH, placePowers, roll, spotOf, WORLD_H, WORLD_W } from './board';

const near = (a: readonly [number, number], b: readonly [number, number]) => { const p = centerOf(a[0], a[1]), q = centerOf(b[0], b[1]); return Math.hypot(p.x - q.x, p.y - q.y) < 70; };

describe('board game', () => {
  it('one trail: each space touches the next, and never touches any other space', () => {
    for (let i = 1; i < PATH.length; i++) expect(near(PATH[i - 1], PATH[i])).toBe(true);
    for (let i = 0; i < PATH.length; i++) for (let j = i + 2; j < PATH.length; j++) expect(near(PATH[i], PATH[j])).toBe(false);
    for (let i = 0; i <= FINISH; i++) { const s = spotOf(i); expect(s.x).toBeGreaterThan(0); expect(s.x).toBeLessThan(WORLD_W); expect(s.y).toBeGreaterThan(0); expect(s.y).toBeLessThan(WORLD_H); }
    expect(near(PATH[PATH.length - 1], [1, 13])).toBe(true);
  });
  it('bridges only go forward and cross water between two bends', () => {
    const water = new Set(buildWorld().cells.filter((c) => c.ground === 'water').map((c) => `${c.r},${c.c}`));
    for (const b of BRIDGES) {
      expect(b.to).toBeGreaterThan(b.from + 5);
      const steps = [PATH[b.from], ...b.over, PATH[b.to]];
      for (let k = 1; k < steps.length; k++) expect(near(steps[k - 1], steps[k])).toBe(true);
      for (const [r, c] of b.over) expect(water.has(`${r},${c}`)).toBe(true);
    }
  });
  it('power-up spaces are frequent, never on bridges or the start, never two in a row', () => {
    const ends = BRIDGES.flatMap((b) => [b.from, b.to]);
    for (let k = 0; k < 30; k++) {
      const p = placePowers();
      expect(p.size).toBeGreaterThan(10);
      for (const i of p.keys()) { expect(i).toBeGreaterThan(1); expect(p.has(i + 1)).toBe(false); expect(ends).not.toContain(i); }
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
  it('the castle rises in layers as the leader gets closer', () => {
    expect([0, 11, 22, 33, 44, FINISH].map(castleStage)).toEqual([0, 1, 2, 3, 4, 5]);
    const blocks = castleBlocks();
    for (let s = 1; s <= 5; s++) expect(blocks.some((b) => b.stage === s)).toBe(true);
    expect(Math.min(...blocks.map((b) => b.y))).toBeGreaterThan(0);
  });
  it('the world is the same every game, with a trail and water', () => {
    const a = buildWorld(), b = buildWorld();
    expect(a.props.length).toBe(b.props.length);
    expect(a.cells.filter((c) => c.ground === 'path').length).toBe(PATH.length);
  });
});
