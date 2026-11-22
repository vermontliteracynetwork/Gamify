import { describe, expect, it } from 'vitest';
import { bestSquare, FREE, freshMarks, LINES, makeCard, matches, nearSquares, neighbors, newLines, norm, shuffleOpen } from './bingo';

const ten = ['map', 'pet', 'sit', 'hot', 'cup', 'bed', 'pig', 'fox', 'bug', 'hat'];

describe('bingo', () => {
  it('makes a 5 by 5 card with the free star in the middle', () => {
    const card = makeCard(ten);
    expect(card).toHaveLength(25);
    expect(card[FREE]).toBe('');
    // A small set repeats evenly: each answer two or three times.
    for (const a of ten) { const n = card.filter((v) => v === a).length; expect(n).toBeGreaterThanOrEqual(2); expect(n).toBeLessThanOrEqual(3); }
    const many = Array.from({ length: 30 }, (_, i) => `w${i}`);
    expect(new Set(makeCard(many).filter(Boolean)).size).toBe(24);
  });
  it('matches answers whatever their case or spaces', () => {
    const card = makeCard(ten);
    const m = matches(card, freshMarks(), ' MAP ');
    expect(m.length).toBeGreaterThan(0);
    m.forEach((i) => expect(norm(card[i])).toBe('map'));
  });
  it('finds new lines once', () => {
    const marks = freshMarks();
    [10, 11, 13, 14].forEach((i) => { marks[i] = true; });
    expect(newLines(marks, [])).toEqual([2]);
    expect(newLines(marks, [2])).toEqual([]);
    expect(LINES).toHaveLength(12);
  });
  it('picks the square closest to a bingo', () => {
    const marks = freshMarks();
    [0, 1, 2, 3].forEach((i) => { marks[i] = true; });
    expect(bestSquare(marks)).toBe(4);
    expect(nearSquares(marks)).toEqual([4]);
  });
  it('shuffles only the open squares', () => {
    const card = makeCard(ten), marks = freshMarks();
    marks[0] = true; marks[24] = true;
    const s = shuffleOpen(card, marks);
    expect(s[0]).toBe(card[0]); expect(s[24]).toBe(card[24]); expect(s[FREE]).toBe('');
    expect([...s].sort()).toEqual([...card].sort());
  });
  it('lists neighbors', () => {
    expect(neighbors(0).sort()).toEqual([1, 5]);
    expect(neighbors(12).sort((a, b) => a - b)).toEqual([7, 11, 13, 17]);
  });
});
