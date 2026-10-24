import { describe, expect, it } from 'vitest';
import { rollName } from './nameDice';
import { addPoints, current, leaders, nextTurn, setScores, startTurns, undo, type TurnPlayer } from './turns';

const p = (id: string, kind: TurnPlayer['kind'] = 'team'): TurnPlayer => ({ id, name: id, kind, colorIndex: 0, score: 0 });

describe('turns', () => {
  it('cycles turns and counts rounds', () => {
    let s = startTurns([p('a'), p('b')]);
    s = nextTurn(s);
    expect([current(s).id, s.round]).toEqual(['b', 1]);
    s = nextTurn(s);
    expect([current(s).id, s.round]).toEqual(['a', 2]);
  });
  it('adds points, never below zero, and undoes', () => {
    let s = startTurns([p('a'), p('b')]);
    s = addPoints(s, 'a', 30);
    s = addPoints(s, 'b', -10);
    expect(s.players.map((x) => x.score)).toEqual([30, 0]);
    s = undo(undo(s));
    expect(s.players.map((x) => x.score)).toEqual([0, 0]);
  });
  it('swaps scores and finds ties', () => {
    let s = addPoints(startTurns([p('a'), p('b')]), 'a', 20);
    s = setScores(s, { a: 0, b: 20 });
    s = addPoints(s, 'a', 20);
    expect(leaders(s).map((x) => x.id)).toEqual(['a', 'b']);
  });
});

describe('name dice', () => {
  it('makes two-word names and avoids taken ones', () => {
    const first = rollName(() => 0);
    expect(first.split(' ')).toHaveLength(2);
    expect(rollName(() => 0, [first])).not.toBe(first);
  });
});
