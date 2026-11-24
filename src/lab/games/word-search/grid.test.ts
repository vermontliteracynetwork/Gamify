import { describe, expect, it } from 'vitest';
import { STARTER_WORDS } from '../../words';
import { cellsOf, lineCells, makeSearch, matchAt, reroll, sizeFor } from './grid';

describe('word search', () => {
  const words = STARTER_WORDS.slice(0, 12);
  it('hides words that read forward in the grid', () => {
    const s = makeSearch(words, sizeFor(words));
    expect(s.placed.length).toBeGreaterThanOrEqual(5);
    for (const p of s.placed) expect(cellsOf(p).map(([r, c]) => s.grid[r][c]).join('')).toBe(p.word);
    for (const row of s.grid) for (const l of row) expect(l).toMatch(/^[A-Z]$/);
  });
  it('finds a word from either end, only once', () => {
    const s = makeSearch(words, 10);
    const p = s.placed[0], cells = cellsOf(p);
    expect(matchAt(s, cells[0], cells[cells.length - 1], new Set())?.word).toBe(p.word);
    expect(matchAt(s, cells[cells.length - 1], cells[0], new Set())?.word).toBe(p.word);
    expect(matchAt(s, cells[0], cells[cells.length - 1], new Set([p.word]))).toBeNull();
  });
  it('draws only straight lines', () => {
    expect(lineCells([0, 0], [2, 2])).toHaveLength(3);
    expect(lineCells([0, 0], [1, 3])).toBeNull();
  });
  it('letter rain keeps every hidden word', () => {
    const s = reroll(makeSearch(words, 10));
    for (const p of s.placed) expect(cellsOf(p).map(([r, c]) => s.grid[r][c]).join('')).toBe(p.word);
  });
});
