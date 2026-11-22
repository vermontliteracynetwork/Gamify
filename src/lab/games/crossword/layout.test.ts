import { describe, expect, it } from 'vitest';
import { STARTER_WORDS } from '../../words';
import { cellsOf, entryAt, key, makePuzzle } from './layout';

describe('crossword', () => {
  for (let run = 0; run < 20; run++) it(`fits words together (run ${run})`, () => {
    const words = [...STARTER_WORDS].sort(() => Math.random() - 0.5).slice(0, 14);
    const p = makePuzzle(words);
    expect(p.entries.length).toBeGreaterThanOrEqual(4);
    for (const e of p.entries) expect(cellsOf(e).map(([r, c]) => p.letters[key(r, c)]).join('')).toBe(e.word);
    // Every run of two or more letters in a row or column is a real entry.
    const runs: string[] = [];
    for (let r = 0; r < p.rows; r++) { let s = ''; let start = 0; for (let c = 0; c <= p.cols; c++) { const l = p.letters[key(r, c)]; if (l) { if (!s) start = c; s += l; } else { if (s.length > 1) runs.push(`across ${r},${start} ${s}`); s = ''; } } }
    for (let c = 0; c < p.cols; c++) { let s = ''; let start = 0; for (let r = 0; r <= p.rows; r++) { const l = p.letters[key(r, c)]; if (l) { if (!s) start = r; s += l; } else { if (s.length > 1) runs.push(`down ${start},${c} ${s}`); s = ''; } } }
    expect(runs.sort()).toEqual(p.entries.map((e) => `${e.dir} ${e.r},${e.c} ${e.word}`).sort());
  });
  it('numbers clues in reading order and finds a cell\'s clue', () => {
    const p = makePuzzle(STARTER_WORDS.slice(0, 12));
    const first = p.entries.find((e) => e.num === 1)!;
    expect(first).toBeTruthy();
    expect(entryAt(p, first.r, first.c, first.dir)).toBe(p.entries.indexOf(first));
  });
});
