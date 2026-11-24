import { describe, expect, it } from 'vitest';
import { COLS, cpuMove, danger, isSafe, lane, objX, safeAbove, safeBelow, SECTION, worldOf } from './rules';

describe('lane hop', () => {
  it('changes world every section and starts each one safe', () => {
    expect(worldOf(0)).toBe('meadow');
    expect(worldOf(SECTION)).toBe('river');
    expect(worldOf(SECTION * 2 + 3)).toBe('tracks');
    expect(worldOf(SECTION * 5)).toBe('meadow');
    for (let s = 0; s < 6; s++) expect(isSafe(lane(s * SECTION).kind)).toBe(true);
    expect(isSafe(lane(0).kind) && isSafe(lane(1).kind) && isSafe(lane(2).kind)).toBe(true);
  });
  it('the same row is the same lane every time', () => {
    expect(lane(37)).toBe(lane(37));
  });
  it('things move with time', () => {
    for (let r = 3; r < 60; r++) {
      const l = lane(r);
      if (l.speed > 0 && l.kind !== 'rail') { expect(objX(l, l.objs[0], 0)).not.toBe(objX(l, l.objs[0], 0.5)); return; }
    }
  });
  it('water without a log is a splash, a hazard on you is a hit', () => {
    let found = 0;
    for (let r = 3; r < 200 && found < 3; r++) {
      const l = lane(r);
      for (let t = 0; t < 10; t += 0.1) for (let c = 0; c < COLS; c++) {
        const d = danger(l, t, c);
        if (l.kind === 'water' && d === 'splash') found |= 1;
        if (l.kind === 'hay' && d === 'hit') found |= 2;
      }
    }
    expect(found).toBe(3);
  });
  it('finds safe rows above and below', () => {
    const up = safeAbove(5);
    expect(isSafe(lane(up).kind)).toBe(true);
    expect(isSafe(lane(safeBelow(30)).kind)).toBe(true);
  });
  it('a careful computer never hops into a hazard it can see', () => {
    for (let t = 0; t < 20; t += 0.7) {
      const m = cpuMove(2, 4, t, true);
      if (m === 'up') expect(danger(lane(3), t + 0.3, 4)).toBe('ok');
    }
  });
});
