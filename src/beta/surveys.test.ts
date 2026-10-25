import { describe, expect, it } from 'vitest';
import { dueSurvey, recommendScore } from './surveys';

const start = '2026-10-01T00:00:00.000Z';
const at = (days: number) => new Date(new Date(start).getTime() + days * 86400000);

describe('beta surveys', () => {
  it('comes due at week 1, month 1 and month 3, one at a time', () => {
    expect(dueSurvey(start, at(3), [])).toBeNull();
    expect(dueSurvey(start, at(8), [])).toBe('week-1');
    expect(dueSurvey(start, at(31), ['week-1'])).toBe('month-1');
    expect(dueSurvey(start, at(95), [])).toBe('month-3');
    expect(dueSurvey(start, at(95), ['week-1', 'month-1', 'month-3'])).toBeNull();
  });
  it('waits while snoozed', () => {
    expect(dueSurvey(start, at(8), [], at(9).toISOString())).toBeNull();
    expect(dueSurvey(start, at(10), [], at(9).toISOString())).toBe('week-1');
  });
  it('scores how likely teachers are to recommend', () => {
    expect(recommendScore([])).toBeNull();
    expect(recommendScore([10, 9, 7, 3])).toBe(25);
  });
});
