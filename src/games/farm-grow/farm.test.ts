import { describe, expect, it } from 'vitest';
import { doJob, emptyField, jobFor, overnight } from './farm';

describe('Farm Grow', () => {
  it('plant, water, grow three nights, harvest', () => {
    let f = emptyField();
    expect(jobFor(f[0])).toBe('plant');
    f = doJob(f, 0, 'corn').field;
    for (let night = 0; night < 3; night++) {
      expect(jobFor(f[0])).toBe('water');
      f = doJob(f, 0, 'corn').field;
      expect(jobFor(f[0])).toBe('wait');
      f = overnight(f);
    }
    expect(jobFor(f[0])).toBe('harvest');
    const h = doJob(f, 0, 'corn');
    expect(h.harvested).toBe('corn');
    expect(h.field[0].crop).toBeNull();
  });
  it('crops that were not watered wait; rain waters everything', () => {
    let f = doJob(emptyField(), 1, 'pumpkin').field;
    f = overnight(f);
    expect(f[1].stage).toBe(0);
    f = overnight(f, true);
    expect(f[1].stage).toBe(1);
  });
});
