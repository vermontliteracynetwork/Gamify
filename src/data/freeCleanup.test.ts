import { describe, expect, it } from 'vitest';
import { purgeBeforeToday } from './freeCleanup';

describe('Free nightly cleanup', () => {
  it('removes answers from before today (Eastern) and keeps today\'s', () => {
    localStorage.setItem('gamify:log', JSON.stringify([{ at: '2027-01-09T15:00:00Z' }, { at: '2027-01-10T14:00:00Z' }]));
    expect(purgeBeforeToday(new Date('2027-01-10T18:00:00Z'))).toBe(1);
    expect(JSON.parse(localStorage.getItem('gamify:log')!)).toEqual([{ at: '2027-01-10T14:00:00Z' }]);
  });
});
