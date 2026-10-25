import { describe, expect, it } from 'vitest';
import type { QuestionLogEntry, QuestionSet } from '../data/types';
import { makeDeck, reviewKey, reviewKeys } from './picker';

const entry = (prompt: string, at: string, outcome: QuestionLogEntry['outcome']): QuestionLogEntry =>
  ({ id: `${prompt}${at}`, at, setId: 's1', gameId: 'peg-drop', mode: 'solo', prompt, answer: 'x', tries: [], ms: 0, outcome });

describe('review pile', () => {
  it('keeps questions missed on an earlier day and not answered right since', () => {
    const keys = reviewKeys([
      entry('A', '2026-10-20T10:00:00Z', 'skipped'),
      entry('B', '2026-10-20T10:00:00Z', 'skipped'),
      entry('B', '2026-10-21T10:00:00Z', 'right'),
      entry('C', '2026-10-25T09:00:00Z', 'skipped'), // today: not yet
      entry('D', '2026-10-20T10:00:00Z', 'left'),
    ], '2026-10-25');
    expect([...keys]).toEqual([reviewKey('s1', 'A')]);
  });

  it('brings review questions back first, one in every three draws, once each', () => {
    const qs = Array.from({ length: 9 }, (_, i) => ({ id: `q${i}`, kind: 'mc' as const, prompt: `P${i}`, choices: ['a', 'b'], correctIndex: 0 }));
    const set = { id: 's1', name: 'S', questions: qs, ownerId: 't', visibility: 'private', createdAt: '', updatedAt: '' } as QuestionSet;
    const deck = makeDeck([{ set, starred: false }], Math.random, new Set([reviewKey('s1', 'P7'), reviewKey('s1', 'P8')]));
    const drawn = Array.from({ length: 6 }, () => deck.next().question.prompt);
    expect(drawn[0]).toMatch(/P7|P8/);
    expect(drawn[3]).toMatch(/P7|P8/);
    expect(drawn.filter((p) => p === 'P7' || p === 'P8').length).toBeGreaterThanOrEqual(2);
  });
});
