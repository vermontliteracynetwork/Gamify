// Match-3 grid engine, carried over from the Dashboard's clean-room
// matchThree.ts (the teacher's own code) and given tile ids so tiles can
// animate as they fall.

export const TILE_KINDS = 6;
// Special pieces (Golden Rule pass, 2026-10-31): a match of 4 makes a line
// piece that clears its row or column; an L or T shape makes a star burst
// that clears the 3 by 3 around it; a match of 5 makes a rainbow that, swapped
// with any piece, clears every piece of that kind. Rainbows have no kind (-1).
export type Special = 'row' | 'col' | 'burst' | 'rainbow';
export const RAINBOW = -1;
export interface Tile { id: number; kind: number; special?: Special }
export interface Pos { row: number; col: number }
export type Grid = Tile[][];

let nextId = 1;
const tile = (kind: number): Tile => ({ id: nextId++, kind });
export const newTile = tile;
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
  return new Set(findRuns(grid).flatMap((run) => run.cells.map((p) => `${p.row},${p.col}`)));
}

export function wouldMatch(grid: Grid, a: Pos, b: Pos): boolean {
  if (grid[a.row][a.col].special === 'rainbow' || grid[b.row][b.col].special === 'rainbow') return true;
  return findMatches(swapTiles(grid, a, b)).size > 0;
}

// Every run of 3 or more, with its direction.
export function findRuns(grid: Grid): { cells: Pos[]; dir: 'h' | 'v' }[] {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const runs: { cells: Pos[]; dir: 'h' | 'v' }[] = [];
  const same = (a: Tile, b: Tile) => a.kind === b.kind && a.kind !== RAINBOW;
  for (let r = 0; r < rows; r++) {
    let start = 0;
    for (let c = 1; c <= cols; c++) {
      if (c < cols && same(grid[r][c], grid[r][c - 1])) continue;
      if (c - start >= 3) runs.push({ dir: 'h', cells: Array.from({ length: c - start }, (_, k) => ({ row: r, col: start + k })) });
      start = c;
    }
  }
  for (let c = 0; c < cols; c++) {
    let start = 0;
    for (let r = 1; r <= rows; r++) {
      if (r < rows && same(grid[r][c], grid[r - 1][c])) continue;
      if (r - start >= 3) runs.push({ dir: 'v', cells: Array.from({ length: r - start }, (_, k) => ({ row: start + k, col: c })) });
      start = r;
    }
  }
  return runs;
}

export interface Clear {
  cleared: Set<string>; // cells that pop
  made: { pos: Pos; tile: Tile }[]; // new special pieces left behind
  fired: { pos: Pos; special: Special; kind?: number }[]; // specials that went off
}
const key = (p: Pos) => `${p.row},${p.col}`;

// One clear: the matched runs, the special pieces they make, and every
// special caught in the clear going off (which can set off others).
export function resolveMatches(grid: Grid, swapped: Pos[] = []): Clear {
  const runs = findRuns(grid);
  const cleared = new Set<string>();
  runs.forEach((run) => run.cells.forEach((p) => cleared.add(key(p))));
  const made: Clear['made'] = [];
  const taken = new Set<string>();
  const spot = (cells: Pos[]) => cells.find((p) => swapped.some((s) => s.row === p.row && s.col === p.col)) ?? cells[Math.floor((cells.length - 1) / 2)];
  const make = (pos: Pos, special: Special, kind: number) => {
    if (taken.has(key(pos))) return;
    taken.add(key(pos));
    made.push({ pos, tile: tile(special === 'rainbow' ? RAINBOW : kind) });
    made[made.length - 1].tile.special = special;
  };
  // Five in a row: a rainbow.
  runs.filter((r) => r.cells.length >= 5).forEach((r) => make(spot(r.cells), 'rainbow', RAINBOW));
  // A cell in both a row run and a column run (an L or T): a star burst.
  const h = new Set(runs.filter((r) => r.dir === 'h').flatMap((r) => r.cells.map(key)));
  runs.filter((r) => r.dir === 'v').forEach((r) => r.cells.forEach((p) => { if (h.has(key(p))) make(p, 'burst', grid[p.row][p.col].kind); }));
  // Four in a row: a line piece that clears the way it was made.
  runs.filter((r) => r.cells.length === 4).forEach((r) => make(spot(r.cells), r.dir === 'h' ? 'row' : 'col', grid[r.cells[0].row][r.cells[0].col].kind));
  const fired = fire(grid, cleared, taken);
  return { cleared, made, fired };
}

// A rainbow swapped with a piece clears every piece of that kind (two
// rainbows clear the whole board).
export function rainbowSwap(grid: Grid, a: Pos, b: Pos): Clear | null {
  const ta = grid[a.row][a.col], tb = grid[b.row][b.col];
  if (ta.special !== 'rainbow' && tb.special !== 'rainbow') return null;
  const [rain, other] = ta.special === 'rainbow' ? [a, tb] : [b, ta];
  const cleared = new Set<string>([key(a), key(b)]);
  const both = ta.special === 'rainbow' && tb.special === 'rainbow';
  grid.forEach((row, r) => row.forEach((tl, c) => { if (both || tl.kind === other.kind) cleared.add(`${r},${c}`); }));
  const fired: Clear['fired'] = [{ pos: rain, special: 'rainbow', kind: other.kind }];
  const rest = fire(grid, cleared, new Set([key(rain)]));
  return { cleared, made: [], fired: [...fired, ...rest] };
}

// Specials inside the cleared cells go off, adding their cells, in a chain.
function fire(grid: Grid, cleared: Set<string>, skip: Set<string>): Clear['fired'] {
  const rows = grid.length, cols = grid[0]?.length ?? 0;
  const fired: Clear['fired'] = [];
  const done = new Set<string>(skip);
  for (let changed = true; changed;) {
    changed = false;
    for (const k of [...cleared]) {
      if (done.has(k)) continue;
      const [r, c] = k.split(',').map(Number);
      const sp = grid[r][c].special;
      done.add(k);
      if (!sp) continue;
      changed = true;
      const add = (rr: number, cc: number) => { if (rr >= 0 && rr < rows && cc >= 0 && cc < cols) cleared.add(`${rr},${cc}`); };
      if (sp === 'row') for (let cc = 0; cc < cols; cc++) add(r, cc);
      if (sp === 'col') for (let rr = 0; rr < rows; rr++) add(rr, c);
      if (sp === 'burst') for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) add(r + dr, c + dc);
      let kind: number | undefined;
      if (sp === 'rainbow') {
        // Caught in a clear, a rainbow takes the most common piece with it.
        const counts = new Map<number, number>();
        grid.forEach((row) => row.forEach((tl) => { if (tl.kind !== RAINBOW) counts.set(tl.kind, (counts.get(tl.kind) ?? 0) + 1); }));
        kind = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
        grid.forEach((row, rr) => row.forEach((tl, cc) => { if (tl.kind === kind) add(rr, cc); }));
      }
      fired.push({ pos: { row: r, col: c }, special: sp, ...(kind === undefined ? {} : { kind }) });
    }
  }
  return fired;
}

// Clears matched cells, drops the rest down, fills the top with new tiles.
// New special pieces stay where they were made (then fall like the rest).
export function clearAndRefill(grid: Grid, matched: Set<string>, rand: () => number = Math.random, made: Clear['made'] = []): Grid {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const next = grid.map((row) => [...row]);
  matched = new Set(matched);
  made.forEach((m) => { next[m.pos.row][m.pos.col] = m.tile; matched.delete(key(m.pos)); });
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
  if (grid.some((row) => row.some((tl) => tl.special === 'rainbow'))) return true;
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
