import { describe, expect, it } from 'vitest';
import { ranked, reduceHost, type LiveState } from './protocol';

const base: LiveState = { code: 'BCDFG', gameId: 'cast-catch', setId: 's', phase: 'lobby', players: [], locks: {}, roomLocked: false, at: 0, round: 1 };

describe('live host', () => {
  it('names wait for approval when asked, and a locked room takes no one new', () => {
    const a = reduceHost(base, { t: 'join', pid: 'p1', name: ' Ava ' }, true, 1);
    expect(a.players).toMatchObject([{ pid: 'p1', name: 'Ava', status: 'pending' }]);
    const b = reduceHost(base, { t: 'join', pid: 'p1', name: 'Ava' }, false, 1);
    expect(b.players[0].status).toBe('in');
    expect(reduceHost({ ...base, roomLocked: true }, { t: 'join', pid: 'p2', name: 'Ben' }, false).players).toHaveLength(0);
  });
  it('a removed name stays out even if it joins again', () => {
    const s = { ...base, players: [{ pid: 'p1', name: 'Ava', status: 'removed' as const, answered: 0, right: 0, askedAt: null, lastSeen: 0 }] };
    expect(reduceHost(s, { t: 'join', pid: 'p1', name: 'Ava' }, false).players[0].status).toBe('removed');
  });
  it('progress from an old round is ignored; the board ranks right answers, then accuracy', () => {
    let s = reduceHost(base, { t: 'join', pid: 'p1', name: 'Ava' }, false);
    s = reduceHost(s, { t: 'join', pid: 'p2', name: 'Ben' }, false);
    s = reduceHost(s, { t: 'progress', pid: 'p1', round: 1, answered: 6, right: 4, askedAt: null }, false);
    s = reduceHost(s, { t: 'progress', pid: 'p2', round: 1, answered: 4, right: 4, askedAt: 5 }, false);
    s = reduceHost(s, { t: 'progress', pid: 'p2', round: 0, answered: 99, right: 99, askedAt: null }, false);
    expect(ranked(s.players).map((p) => p.name)).toEqual(['Ben', 'Ava']);
  });
});
