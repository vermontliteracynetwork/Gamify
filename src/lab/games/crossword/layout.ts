import type { WordPair } from '../../words';

// Crossword rules, kept apart so they can be tested: the words of the set
// are fitted together so every word crosses another, with no two letters
// side by side unless they belong to the same word.

export type Dir = 'across' | 'down';
export interface Entry { num: number; dir: Dir; word: string; clue: string; r: number; c: number }
export interface Puzzle { rows: number; cols: number; letters: Record<string, string>; entries: Entry[] }

export const key = (r: number, c: number) => `${r},${c}`;
export const cellsOf = (e: Pick<Entry, 'dir' | 'r' | 'c' | 'word'>): [number, number][] =>
  [...e.word].map((_, i) => (e.dir === 'across' ? [e.r, e.c + i] : [e.r + i, e.c]));

interface Raw { word: string; clue: string; dir: Dir; r: number; c: number }

function fits(grid: Map<string, string>, w: string, dir: Dir, r: number, c: number): number {
  const dr = dir === 'down' ? 1 : 0, dc = dir === 'across' ? 1 : 0;
  if (grid.has(key(r - dr, c - dc)) || grid.has(key(r + dr * w.length, c + dc * w.length))) return -1;
  let cross = 0;
  for (let i = 0; i < w.length; i++) {
    const y = r + dr * i, x = c + dc * i, have = grid.get(key(y, x));
    if (have) { if (have !== w[i]) return -1; cross++; continue; }
    // A new letter may not touch another word from the side.
    if (grid.has(key(y + dc, x + dr)) || grid.has(key(y - dc, x - dr))) return -1;
  }
  return cross;
}

// `side` caps the puzzle at about 9 squares each way, so squares stay big.
// A crossword needs at least four words that cross; some word orders fit
// fewer, so a few shuffled tries keep the fullest grid.
export function makePuzzle(words: WordPair[], rand: () => number = Math.random, max = 7, side = 9): Puzzle {
  let best = buildPuzzle(words, rand, max, side);
  for (let k = 0; k < 12 && best.entries.length < Math.min(4, words.length); k++) {
    const next = buildPuzzle([...words].sort(() => rand() - 0.5), rand, max, side);
    if (next.entries.length > best.entries.length) best = next;
  }
  return best;
}

function buildPuzzle(words: WordPair[], rand: () => number, max: number, side: number): Puzzle {
  const list = words.filter((w) => w.word.length >= 3 && w.word.length <= side).slice(0, max + 6).sort((a, b) => b.word.length - a.word.length);
  const grid = new Map<string, string>();
  const placed: Raw[] = [];
  const put = (p: Raw) => { cellsOf(p).forEach(([y, x], i) => grid.set(key(y, x), p.word[i])); placed.push(p); };
  for (const w of list) {
    if (placed.length >= max) break;
    if (!placed.length) { put({ ...w, dir: 'across', r: 0, c: 0 }); continue; }
    let best: Raw | null = null, bestScore = -Infinity;
    for (const p of placed) {
      const dir: Dir = p.dir === 'across' ? 'down' : 'across';
      cellsOf(p).forEach(([y, x], i) => {
        for (let j = 0; j < w.word.length; j++) {
          if (w.word[j] !== p.word[i]) continue;
          const r = dir === 'down' ? y - j : y, c = dir === 'across' ? x - j : x;
          const cross = fits(grid, w.word, dir, r, c);
          if (cross < 1) continue;
          // Prefer more crossings and a compact, squarish puzzle.
          const all = [...grid.keys()].map((k) => k.split(',').map(Number)).concat(cellsOf({ ...w, dir, r, c }));
          const h = Math.max(...all.map((a) => a[0])) - Math.min(...all.map((a) => a[0])) + 1;
          const wd = Math.max(...all.map((a) => a[1])) - Math.min(...all.map((a) => a[1])) + 1;
          if (h > side || wd > side) continue;
          const score = cross * 10 - Math.max(h, wd) * 2 - Math.abs(h - wd) + rand() * 3;
          if (score > bestScore) { bestScore = score; best = { ...w, dir, r, c }; }
        }
      });
    }
    if (best) put(best);
  }
  const rs = placed.flatMap((p) => cellsOf(p).map(([y]) => y)), cs = placed.flatMap((p) => cellsOf(p).map(([, x]) => x));
  const r0 = Math.min(...rs), c0 = Math.min(...cs);
  const norm = placed.map((p) => ({ ...p, r: p.r - r0, c: p.c - c0 }));
  const letters: Record<string, string> = {};
  for (const p of norm) cellsOf(p).forEach(([y, x], i) => { letters[key(y, x)] = p.word[i]; });
  // Number the starts in reading order, as on a paper crossword.
  const starts = [...new Set(norm.map((p) => key(p.r, p.c)))].map((k) => k.split(',').map(Number)).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const numOf = new Map(starts.map(([y, x], i) => [key(y, x), i + 1]));
  const entries = norm.map((p) => ({ num: numOf.get(key(p.r, p.c))!, dir: p.dir, word: p.word, clue: p.clue, r: p.r, c: p.c }))
    .sort((a, b) => (a.dir === b.dir ? a.num - b.num : a.dir === 'across' ? -1 : 1));
  return { rows: Math.max(...rs) - r0 + 1, cols: Math.max(...cs) - c0 + 1, letters, entries };
}

// Which entry a tapped cell belongs to: the current direction first.
export function entryAt(p: Puzzle, r: number, c: number, prefer: Dir): number {
  const hits = p.entries.map((e, i) => [e, i] as const).filter(([e]) => cellsOf(e).some(([y, x]) => y === r && x === c));
  return (hits.find(([e]) => e.dir === prefer) ?? hits[0])?.[1] ?? -1;
}
