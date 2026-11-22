import type { WordPair } from '../../words';

// Word Search rules, kept apart so they can be tested. Words read forward
// only (across, down, and both diagonals going right), so early readers
// always read them left to right.

export type Cell = [number, number];
export interface Placed { word: string; clue: string; r: number; c: number; dr: number; dc: number }
export interface Search { size: number; grid: string[][]; placed: Placed[] }

export const DIRS: [number, number][] = [[0, 1], [1, 0], [1, 1], [-1, 1]];
const FILL = 'AABCDEEEFGHIIJKLMNOOPRSSTTUUVWY';

export const cellsOf = (p: Placed): Cell[] => [...p.word].map((_, i) => [p.r + p.dr * i, p.c + p.dc * i]);
export const keyOf = ([r, c]: Cell) => `${r},${c}`;

// A grid big enough for the longest word, never too small to read.
export const sizeFor = (words: WordPair[]) => Math.min(11, Math.max(8, ...words.map((w) => w.word.length + 1)));

export function makeSearch(words: WordPair[], size: number, rand: () => number = Math.random, max = 7): Search {
  const grid: string[][] = Array.from({ length: size }, () => Array(size).fill(''));
  const placed: Placed[] = [];
  const list = words.filter((w) => w.word.length <= size).slice(0, max + 4).sort((a, b) => b.word.length - a.word.length);
  let turn = Math.floor(rand() * DIRS.length);
  for (const w of list) {
    if (placed.length >= max) break;
    let done = false;
    for (let tries = 0; tries < 300 && !done; tries++) {
      // Rotate the directions so a puzzle mixes across, down and diagonal.
      const [dr, dc] = DIRS[(turn + Math.floor(tries / 60)) % DIRS.length];
      const len = w.word.length;
      const rMin = dr < 0 ? len - 1 : 0, rMax = dr > 0 ? size - len : size - 1;
      const cMax = dc > 0 ? size - len : size - 1;
      if (rMax < rMin || cMax < 0) continue;
      const r = rMin + Math.floor(rand() * (rMax - rMin + 1)), c = Math.floor(rand() * (cMax + 1));
      const p: Placed = { word: w.word, clue: w.clue, r, c, dr, dc };
      if (cellsOf(p).every(([y, x], i) => grid[y][x] === '' || grid[y][x] === w.word[i])) {
        cellsOf(p).forEach(([y, x], i) => { grid[y][x] = w.word[i]; });
        placed.push(p); done = true; turn++;
      }
    }
  }
  for (const row of grid) for (let x = 0; x < size; x++) if (!row[x]) row[x] = FILL[Math.floor(rand() * FILL.length)];
  return { size, grid, placed };
}

// The cells on a straight line from a to b (across, down or diagonal), or null.
export function lineCells(a: Cell, b: Cell): Cell[] | null {
  const dr = Math.sign(b[0] - a[0]), dc = Math.sign(b[1] - a[1]);
  const n = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]));
  if (dr !== 0 && dc !== 0 && Math.abs(b[0] - a[0]) !== Math.abs(b[1] - a[1])) return null;
  return Array.from({ length: n + 1 }, (_, i) => [a[0] + dr * i, a[1] + dc * i] as Cell);
}

// The hidden word that runs from a to b (either way round), if one does.
export function matchAt(s: Search, a: Cell, b: Cell, found: Set<string>): Placed | null {
  for (const p of s.placed) {
    if (found.has(p.word)) continue;
    const cells = cellsOf(p), first = cells[0], last = cells[cells.length - 1];
    const same = (x: Cell, y: Cell) => x[0] === y[0] && x[1] === y[1];
    if ((same(first, a) && same(last, b)) || (same(first, b) && same(last, a))) return p;
  }
  return null;
}

// Letter Rain: every letter that is not part of a hidden word changes.
export function reroll(s: Search, rand: () => number = Math.random): Search {
  const keep = new Set(s.placed.flatMap((p) => cellsOf(p).map(keyOf)));
  return { ...s, grid: s.grid.map((row, r) => row.map((l, c) => (keep.has(`${r},${c}`) ? l : FILL[Math.floor(rand() * FILL.length)]))) };
}
