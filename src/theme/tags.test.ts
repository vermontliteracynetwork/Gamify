import { describe, expect, it } from 'vitest';
import { ALL_TAGS, SPECIAL_DAYS, challengeClose, challengeEntries, searchTags, winnerDate } from './tags';

describe('theme tags and special days', () => {
  it('has one special day a month, each with its own tag and known keyword tags', () => {
    expect(SPECIAL_DAYS.map((d) => Number(d.date.slice(5, 7)))).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    const ids = new Set(ALL_TAGS.map((x) => x.id));
    for (const d of SPECIAL_DAYS) {
      expect(ids.has(d.tag)).toBe(true);
      d.keywords.forEach((k) => expect(ids.has(k), k).toBe(true));
    }
    expect(ALL_TAGS.length).toBe(new Set(ALL_TAGS.map((x) => x.id)).size);
  });
  it('closes at 11:59 pm Eastern and announces 7 days later', () => {
    const socks = SPECIAL_DAYS[0];
    expect(challengeClose(socks).toISOString()).toBe('2027-01-22T04:59:00.000Z'); // EST
    const turtle = SPECIAL_DAYS[4];
    expect(challengeClose(turtle).toISOString()).toBe('2027-05-24T03:59:00.000Z'); // EDT
    expect(winnerDate(socks)).toBe('2027-01-28');
    expect(winnerDate(SPECIAL_DAYS[11])).toBe('2027-12-19');
  });
  it('pulls entries by the day tag or its keywords, entered before the close', () => {
    const day = SPECIAL_DAYS[1];
    const themes = [
      { id: 'a', tags: ['pizza'], challenge: true, gallery: { status: 'approved', at: '2027-01-05T10:00:00Z' } },
      { id: 'b', tags: ['pizza-day'], challenge: false, gallery: { status: 'approved', at: '2027-01-05T10:00:00Z' } },
      { id: 'c', tags: ['puppy'], challenge: true, gallery: { status: 'approved', at: '2027-01-05T10:00:00Z' } },
      { id: 'd', tags: ['pizza-day'], challenge: true, gallery: { status: 'pending', at: '2027-02-11T10:00:00Z' } },
      { id: 'e', tags: ['pizza-day'], challenge: true, gallery: { status: 'declined', at: '2027-01-05T10:00:00Z' } },
    ];
    expect(challengeEntries(themes, day).map((x) => x.id)).toEqual(['a']);
  });
  it('finds tags by word', () => {
    expect(searchTags('ice cream').map((x) => x.id)).toContain('ice-cream-sundae');
    expect(searchTags('')).toEqual([]);
  });
});
