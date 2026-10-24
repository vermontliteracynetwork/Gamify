import { describe, expect, it } from 'vitest';
import { buildDeck } from './deck';

const q = (id: string, answer: string) => ({ id, kind: 'mc' as const, prompt: `${id}?`, choices: [answer, 'x'], correctIndex: 0 });

describe('memory match deck', () => {
  it('makes a question card and an answer card per pair', () => {
    const deck = buildDeck([q('a', '1'), q('b', '2'), q('c', '3')], 2);
    expect(deck).toHaveLength(4);
    const pairs = new Set(deck.map((c) => c.pair));
    expect(pairs.size).toBe(2);
    for (const p of pairs) expect(deck.filter((c) => c.pair === p).map((c) => c.side).sort()).toEqual(['a', 'q']);
  });
  it('skips questions whose answer repeats another, so every match is unique', () => {
    const deck = buildDeck([q('a', 'cat'), q('b', 'Cat'), q('c', 'dog')], 5);
    expect(deck).toHaveLength(4);
  });
});
