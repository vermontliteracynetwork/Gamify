import { describe, expect, it } from 'vitest';
import { makeWave, pointAt, PATH, step, waveDone, type Tower } from './castle';

const run = (towers: Tower[], n = 1) => {
  let w = makeWave(n), tw = towers;
  for (let i = 0; i < 2000 && !waveDone(w); i++) ({ wave: w, towers: tw } = step(w, tw, 0.1));
  return w;
};

describe('Castle Guard', () => {
  it('the road starts in the woods and ends at the gate', () => {
    expect(pointAt(0)).toEqual(PATH[0]);
    expect(pointAt(1)).toEqual(PATH[PATH.length - 1]);
  });
  it('with no towers every critter gets in; nothing is lost but a wobble', () => {
    const w = run([]);
    expect(w.home).toBe(0);
    expect(w.snuck).toBe(6);
  });
  it('towers send critters home, and more towers send more', () => {
    const one = run([{ slot: 1, kind: 'bubble', tier: 1, wait: 0 }]);
    const many = run([0, 1, 2, 3, 4, 5].map((slot) => ({ slot, kind: 'bubble' as const, tier: 3 as const, wait: 0 })));
    expect(one.home).toBeGreaterThan(0);
    expect(many.home).toBeGreaterThan(one.home);
    expect(many.home + many.snuck).toBe(6);
  });
  it('snow towers slow critters so a bubble tower catches more', () => {
    const plain = run([{ slot: 1, kind: 'bubble', tier: 1, wait: 0 }], 2);
    const snowy = run([{ slot: 1, kind: 'bubble', tier: 1, wait: 0 }, { slot: 0, kind: 'snow', tier: 2, wait: 0 }], 2);
    expect(snowy.home).toBeGreaterThanOrEqual(plain.home);
  });
});
