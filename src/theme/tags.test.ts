import { describe, expect, it } from 'vitest';
import { entryLimitReached, ALL_TAGS, SPECIAL_DAYS, challengeClose, challengeEntries, closeDate, isOpen, winnerAt, nextOpenDay, searchTags, winnerDate } from './tags';

describe('theme tags and special days', () => {
  it('has one special day a month, each with its own tag, known keyword tags and ideas', () => {
    SPECIAL_DAYS.forEach((d) => expect(d.ideas.length).toBeGreaterThan(3));
    expect(SPECIAL_DAYS.map((d) => Number(d.date.slice(5, 7)))).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    const ids = new Set(ALL_TAGS.map((x) => x.id));
    for (const d of SPECIAL_DAYS) {
      expect(ids.has(d.tag)).toBe(true);
      d.keywords.forEach((k) => expect(ids.has(k), k).toBe(true));
    }
    expect(ALL_TAGS.length).toBe(new Set(ALL_TAGS.map((x) => x.id)).size);
  });
  it('closes entries and votes at 11:59 pm Eastern two days before, winner on the day', () => {
    const socks = SPECIAL_DAYS[0];
    expect(closeDate(socks)).toBe('2027-01-19');
    expect(challengeClose(socks).toISOString()).toBe('2027-01-20T04:59:00.000Z'); // EST
    expect(challengeClose(SPECIAL_DAYS[4]).toISOString()).toBe('2027-05-22T03:59:00.000Z'); // EDT, May 21
    expect(winnerDate(socks)).toBe('2027-01-21');
    expect(winnerAt(socks).toISOString()).toBe('2027-01-21T05:00:00.000Z');
    expect(isOpen(socks, new Date('2027-01-19T12:00:00Z'))).toBe(true);
    expect(isOpen(socks, new Date('2027-01-20T12:00:00Z'))).toBe(false);
    expect(nextOpenDay(new Date('2027-01-20T12:00:00Z')).tag).toBe('pizza-day');
  });
  it('pulls entries by the month they picked, entered before the close', () => {
    const day = SPECIAL_DAYS[1];
    const themes = [
      { id: 'a', challenge: true, challengeDay: 'pizza-day', gallery: { status: 'approved', at: '2027-01-05T10:00:00Z' } },
      { id: 'b', challenge: false, challengeDay: 'pizza-day', gallery: { status: 'approved', at: '2027-01-05T10:00:00Z' } },
      { id: 'c', challenge: true, challengeDay: 'puppy-day', gallery: { status: 'approved', at: '2027-01-05T10:00:00Z' } },
      { id: 'd', challenge: true, challengeDay: 'pizza-day', gallery: { status: 'pending', at: '2027-02-08T10:00:00Z' } },
      { id: 'e', challenge: true, challengeDay: 'pizza-day', gallery: { status: 'declined', at: '2027-01-05T10:00:00Z' } },
      { id: 'f', challenge: true, gallery: { status: 'approved', at: '2027-01-05T10:00:00Z' } },
    ];
    expect(challengeEntries(themes, day).map((x) => x.id)).toEqual(['a']);
  });
  it('finds tags by word', () => {
    expect(searchTags('ice cream').map((x) => x.id)).toContain('ice-cream-sundae');
    expect(searchTags('')).toEqual([]);
  });
  it('limits entries per plan: Free 1 in all, Plus 1 per game, Pro 5 per game', () => {
    const e = (id: string, gameId: string) => ({ id, gameId, challenge: true, challengeDay: 'pizza-day', gallery: { status: 'approved' } });
    expect(entryLimitReached([e('a', 'bowling')], 'free', 'pizza-day', 'game-show', 'x')).toBe(true);
    expect(entryLimitReached([e('a', 'bowling')], 'plus', 'pizza-day', 'game-show', 'x')).toBe(false);
    expect(entryLimitReached([e('a', 'game-show')], 'plus', 'pizza-day', 'game-show', 'x')).toBe(true);
    const four = ['a', 'b', 'c', 'd'].map((id) => e(id, 'game-show'));
    expect(entryLimitReached(four, 'pro', 'pizza-day', 'game-show', 'x')).toBe(false);
    expect(entryLimitReached([...four, e('f', 'game-show')], 'pro', 'pizza-day', 'game-show', 'x')).toBe(true);
    expect(entryLimitReached([e('a', 'game-show')], 'free', 'pizza-day', 'game-show', 'a')).toBe(false);
  });
});
