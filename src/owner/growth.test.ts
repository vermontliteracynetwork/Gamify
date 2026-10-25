import { describe, expect, it } from 'vitest';
import { growthTips } from './growth';

const base = { tier: 'free' as const, classes: 0, sets: 0, answersThisWeek: 0, answersLastWeek: 0, surveyAverage: null };
const ids = (x: Parameters<typeof growthTips>[0]) => growthTips(x).map((t) => t.id);

describe('growth tips', () => {
  it('nudges new and limited Free teachers', () => {
    expect(ids(base)).toEqual(['not-started']);
    expect(ids({ ...base, classes: 1, sets: 3 })).toEqual(['class-limit', 'set-limit']);
    expect(ids({ ...base, tier: 'plus', classes: 1, sets: 3 })).toEqual([]);
  });
  it('spots slowing play and survey moods', () => {
    expect(ids({ ...base, classes: 1, answersLastWeek: 90, answersThisWeek: 10 })).toContain('slowing');
    expect(ids({ ...base, classes: 1, surveyAverage: 2 })).toContain('unhappy');
    expect(ids({ ...base, classes: 1, surveyAverage: 5 })).toContain('fan');
  });
});
