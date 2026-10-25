// Match-3 grid engine, carried over from the Dashboard's clean-room
// matchThree.ts (the teacher's own code) and given tile ids so tiles can
// animate as they fall.

export const TILE_KINDS = 6;
export interface Tile { id: number; kind: number }
export interface Pos { row: number; col: number }
export type Grid = Tile[][];

let nextId = 1;
const tile = (kind: number): Tile => ({ id: nextId++, kind });
const randomKind = (rand: () => number) => Math.floor(rand() * TILE_KINDS);

// A fresh board with no run of 3 already on it, and at least one move.
export function createGrid(rows: number, cols: number, rand: () => number = Math.random): Grid {
  for (;;) {
    const grid: Grid = [];
    for (let r = 0; r < rows; r++) {
      const row: Tile[] = [];
      for (let c = 0; c < cols; c++) {
        let kind: number;
        do kind = randomKind(rand);
        while ((c >= 2 && row[c - 1].kind === kind && row[c - 2].kind === kind) || (r >= 2 && grid[r - 1][c].kind === kind && grid[r - 2][c].kind === kind));
        row.push(tile(kind));
      }
      grid.push(row);
    }
    if (hasAnyValidMove(grid)) return grid;
  }
}

export function isAdjacent(a: Pos, b: Pos): boolean {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;
}

export function swapTiles(grid: Grid, a: Pos, b: Pos): Grid {
  const next = grid.map((row) => [...row]);
  [next[a.row][a.col], next[b.row][b.col]] = [next[b.row][b.col], next[a.row][a.col]];
  return next;
}

// Every cell in a horizontal or vertical run of 3 or more, as "row,col".
export function findMatches(grid: Grid): Set<string> {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const matched = new Set<string>();
  for (let r = 0; r < rows; r++) {
    let start = 0;
    for (let c = 1; c <= cols; c++) {
      if (c < cols && grid[r][c].kind === grid[r][c - 1].kind) continue;
      if (c - start >= 3) for (let k = start; k < c; k++) matched.add(`${r},${k}`);
      start = c;
    }
  }
  for (let c = 0; c < cols; c++) {
    let start = 0;
    for (let r = 1; r <= rows; r++) {
      if (r < rows && grid[r][c].kind === grid[r - 1][c].kind) continue;
      if (r - start >= 3) for (let k = start; k < r; k++) matched.add(`${k},${c}`);
      start = r;
    }
  }
  return matched;
}

export function wouldMatch(grid: Grid, a: Pos, b: Pos): boolean {
  return findMatches(swapTiles(grid, a, b)).size > 0;
}

// Clears matched cells, drops the rest down, fills the top with new tiles.
export function clearAndRefill(grid: Grid, matched: Set<string>, rand: () => number = Math.random): Grid {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const next = grid.map((row) => [...row]);
  for (let c = 0; c < cols; c++) {
    const survivors: Tile[] = [];
    for (let r = 0; r < rows; r++) if (!matched.has(`${r},${c}`)) survivors.push(next[r][c]);
    const fresh = Array.from({ length: rows - survivors.length }, () => tile(randomKind(rand)));
    const column = [...fresh, ...survivors];
    for (let r = 0; r < rows; r++) next[r][c] = column[r];
  }
  return next;
}

export function hasAnyValidMove(grid: Grid): boolean {
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      if (c + 1 < grid[0].length && wouldMatch(grid, { row: r, col: c }, { row: r, col: c + 1 })) return true;
      if (r + 1 < grid.length && wouldMatch(grid, { row: r, col: c }, { row: r + 1, col: c })) return true;
    }
  }
  return false;
}

// Points for one clear: 10 per tile, more for bigger matches and cascades.
export function pointsFor(cleared: number, cascade: number): number {
  return cleared * 10 * cascade + (cleared >= 5 ? 50 : cleared === 4 ? 20 : 0);
}
