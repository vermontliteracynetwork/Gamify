import { describe, expect, it } from 'vitest';
import { castVote, loadVotes, tally, votedToday } from './votes';

describe('challenge votes', () => {
  it('takes a top 3 once per device per day, plus one class vote, each pick worth one', async () => {
    let s = await castVote('pizza-day', ['a', 'b', 'c', 'd'], undefined, '2027-01-10');
    expect(s.ballots[0].picks).toEqual(['a', 'b', 'c']);
    s = await castVote('pizza-day', ['a'], undefined, '2027-01-10');
    expect(s.ballots).toHaveLength(1);
    s = await castVote('pizza-day', ['a'], 'class-1', '2027-01-10');
    s = await castVote('pizza-day', ['b'], undefined, '2027-01-11');
    expect(tally(s, 'pizza-day')).toEqual({ a: 2, b: 2, c: 1 });
    expect(votedToday(s, 'pizza-day', 'class-1', '2027-01-10')).toBe(true);
    expect(votedToday(s, 'puppy-day', undefined, '2027-01-10')).toBe(false);
    expect((await loadVotes()).ballots).toHaveLength(3);
  });
});
