// Googler's board logic (teacher, 2026-11-26): a falling-block puzzle that
// starts half full, pushes a new row up from the bottom after every drop,
// and offers only a few landing spots for each block (three, or five with
// the Lucky Key). Rows rebuilt from the rules of the classic falling-block
// genre; the teacher pointed at LoveDaisy/tetris_game for the rules only, no
// code is taken from it. Pure functions, so they are tested.

export const COLS = 8;
export const ROWS = 12;

// Every block is a classic four-unit falling-block shape (teacher,
// 2026-11-26: "i want the blocks to be tetris shapped"). Each shape is
// themed on its own.
export interface ShapeSpec { id: string; name: string; cells: [number, number][]; color: string }
export const SHAPES: ShapeSpec[] = [
  { id: 'line', name: 'Long line', cells: [[0, 0], [0, 1], [0, 2], [0, 3]], color: '#4ba3e8' },
  { id: 'square', name: 'Square', cells: [[0, 0], [0, 1], [1, 0], [1, 1]], color: '#fabe37' },
  { id: 'tee', name: 'Tee', cells: [[0, 0], [0, 1], [0, 2], [1, 1]], color: '#6a45f0' },
  { id: 'zig', name: 'Zig', cells: [[0, 1], [0, 2], [1, 0], [1, 1]], color: '#22b04a' },
  { id: 'zag', name: 'Zag', cells: [[0, 0], [0, 1], [1, 1], [1, 2]], color: '#f055a5' },
  { id: 'ell', name: 'L', cells: [[0, 0], [1, 0], [2, 0], [2, 1]], color: '#ff9b28' },
  { id: 'jay', name: 'J', cells: [[0, 1], [1, 1], [2, 1], [2, 0]], color: '#1fb5a8' },
];
// How often each shape comes (the friendlier shapes a little more).
const WEIGHTS = [1.3, 1.3, 1.2, 1, 1, 1.1, 1.1];

// A unit on the board: its shape (for its color and theme art), and maybe a
// googly eye (one of five looks) or a power-up (teacher, 2026-11-26: "some
// power ups should be 1:1 placed ... in the block stacks like the googly eyes
// and can be played when the row is cleared"). `power` is a roll the game
// turns into one of its switched-on power-ups.
export interface Cell { id: number; shape: number; eye?: number; power?: number }
export type Board = (Cell | null)[][];
export interface Spot { rotation: number; row: number; col: number; cells: [number, number][] }
export interface Block { shape: number; eyeAt?: number; eye?: number }

let nextId = 1;
const cell = (shape: number, eye?: number, power?: number): Cell => ({ id: nextId++, shape, ...(eye !== undefined ? { eye } : {}), ...(power !== undefined ? { power } : {}) });

export function pickShape(rng: () => number): number {
  const total = WEIGHTS.reduce((a, b) => a + b, 0);
  let x = rng() * total;
  for (let i = 0; i < WEIGHTS.length; i++) { x -= WEIGHTS[i]; if (x < 0) return i; }
  return 0;
}

// A shape's distinct turns, each normalized to start at row 0, col 0.
export function rotations(shape: number): [number, number][][] {
  const out: [number, number][][] = [];
  const seen = new Set<string>();
  let cur = SHAPES[shape].cells;
  for (let k = 0; k < 4; k++) {
    const minR = Math.min(...cur.map(([r]) => r)), minC = Math.min(...cur.map(([, c]) => c));
    const norm = cur.map(([r, c]) => [r - minR, c - minC] as [number, number]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const key = norm.map((p) => p.join(',')).join(';');
    if (!seen.has(key)) { seen.add(key); out.push(norm); }
    cur = cur.map(([r, c]) => [c, -r] as [number, number]);
  }
  return out;
}

// A new row from the bottom: full but for one or two gaps, and now and then
// a googly eye in one of its units (teacher: "sporadically") and, less
// often, a power-up in another.
export function risingRow(cols: number, rng: () => number, eyeChance = 0.45, powerChance = 0.18): (Cell | null)[] {
  const gaps = new Set<number>();
  const want = rng() < 0.55 ? 1 : 2;
  while (gaps.size < want) gaps.add(Math.floor(rng() * cols));
  const open = [...Array(cols).keys()].filter((c) => !gaps.has(c));
  const eyeCol = rng() < eyeChance ? open[Math.floor(rng() * open.length)] : -1;
  const rest = open.filter((c) => c !== eyeCol);
  const powerCol = rng() < powerChance ? rest[Math.floor(rng() * rest.length)] : -1;
  return Array.from({ length: cols }, (_, c) => (gaps.has(c) ? null : cell(pickShape(rng), c === eyeCol ? Math.floor(rng() * 5) : undefined, c === powerCol ? Math.floor(rng() * 1000) : undefined)));
}

// The starting board: the bottom half filled (teacher: "start out with a
// halfway filled board"), with more gaps higher up so it looks hand-stacked.
export function createBoard(rng: () => number, rows = ROWS, cols = COLS): Board {
  const board: Board = Array.from({ length: rows }, () => Array<Cell | null>(cols).fill(null));
  const filled = Math.floor(rows / 2);
  for (let k = 0; k < filled; k++) {
    const r = rows - 1 - k;
    const row = risingRow(cols, rng, 0.5, 0.2);
    // Upper rows of the pile get a few more gaps, so its top is uneven.
    if (k >= filled - 2) for (let c = 0; c < cols; c++) if (rng() < 0.35) row[c] = null;
    board[r] = row;
  }
  return board;
}

const fits = (board: Board, cells: [number, number][], row: number, col: number) =>
  cells.every(([r, c]) => { const rr = row + r, cc = col + c; return cc >= 0 && cc < board[0].length && rr < board.length && (rr < 0 || board[rr][cc] === null); });

// Where a block lands when dropped straight down in a column with one turn.
export function landing(board: Board, cells: [number, number][], col: number): number | null {
  const h = Math.max(...cells.map(([r]) => r)) + 1;
  if (!fits(board, cells, -h, col)) return null;
  let row = -h;
  while (fits(board, cells, row + 1, col)) row++;
  // A block that would stick out above the top does not fit there.
  return row >= 0 ? row : null;
}

export function allSpots(board: Board, shape: number): Spot[] {
  const out: Spot[] = [];
  rotations(shape).forEach((cells, rotation) => {
    const w = Math.max(...cells.map(([, c]) => c)) + 1;
    for (let col = 0; col + w <= board[0].length; col++) {
      const row = landing(board, cells, col);
      if (row !== null) out.push({ rotation, row, col, cells });
    }
  });
  return out;
}

export function place(board: Board, block: Block, spot: Spot): Board {
  const next = board.map((r) => r.slice());
  spot.cells.forEach(([r, c], i) => { next[spot.row + r][spot.col + c] = cell(block.shape, block.eyeAt === i ? block.eye : undefined); });
  return next;
}

export function fullRows(board: Board): number[] {
  return board.map((row, r) => (row.every((x) => x !== null) ? r : -1)).filter((r) => r >= 0);
}

// Clear the full rows: the rows above fall down. Returns the eyes caught in
// the cleared rows, with where they were, so they can fly to the counter.
export function clearRows(board: Board, rows: number[]): { board: Board; eyes: { row: number; col: number; eye: number; id: number }[]; powers: { row: number; col: number; power: number; id: number }[] } {
  const gone = new Set(rows);
  const eyes: { row: number; col: number; eye: number; id: number }[] = [];
  const powers: { row: number; col: number; power: number; id: number }[] = [];
  rows.forEach((r) => board[r].forEach((x, c) => {
    if (x?.eye !== undefined) eyes.push({ row: r, col: c, eye: x.eye, id: x.id });
    if (x?.power !== undefined) powers.push({ row: r, col: c, power: x.power, id: x.id });
  }));
  const kept = board.filter((_, r) => !gone.has(r));
  const empty = Array.from({ length: rows.length }, () => Array<Cell | null>(board[0].length).fill(null));
  return { board: [...empty, ...kept], eyes, powers };
}

// Push a new row in at the bottom; everything moves up one. `spilled` is
// true when a unit was pushed off the top.
export function pushRow(board: Board, row: (Cell | null)[]): { board: Board; spilled: boolean } {
  const spilled = board[0].some((x) => x !== null);
  return { board: [...board.slice(1), row], spilled };
}

// Too full to play on: the top half is squished away (funny, not mean:
// no points are lost, the eyes in it just pop off).
export function squish(board: Board): Board {
  const rows = board.length, cols = board[0].length;
  const keep = Math.floor(rows / 3);
  const kept = board.slice(rows - keep);
  return [...Array.from({ length: rows - keep }, () => Array<Cell | null>(cols).fill(null)), ...kept];
}

const heights = (board: Board) => board[0].map((_, c) => { const r = board.findIndex((row) => row[c] !== null); return r < 0 ? 0 : board.length - r; });
function holes(board: Board): number {
  let n = 0;
  for (let c = 0; c < board[0].length; c++) { let roof = false; for (let r = 0; r < board.length; r++) { if (board[r][c]) roof = true; else if (roof) n++; } }
  return n;
}
// How good a spot is: rows cleared and eyes freed are great; holes and a tall stack are not.
export function rate(board: Board, block: Block, spot: Spot): number {
  const after = place(board, block, spot);
  const full = fullRows(after);
  const eyes = full.reduce((n, r) => n + after[r].filter((x) => x?.eye !== undefined || x?.power !== undefined).length, 0);
  const cleared = clearRows(after, full).board;
  const h = heights(cleared);
  return full.length * 12 + eyes * 6 - holes(cleared) * 3 - Math.max(...h) * 0.6 - h.reduce((a, b) => a + b, 0) * 0.08;
}

// The few spots a player may choose from (teacher: "three choices", five
// with the power-up): always the best one, then others spread across the
// board, in left-to-right order so swiping reads naturally.
export function chooseSpots(board: Board, block: Block, n: number, rng: () => number): Spot[] {
  const all = allSpots(board, block.shape);
  if (all.length <= n) return all.sort((a, b) => a.col - b.col || a.rotation - b.rotation);
  const scored = all.map((s) => ({ s, v: rate(board, block, s) + rng() * 2 })).sort((a, b) => b.v - a.v);
  const out: Spot[] = [scored[0].s];
  const rest = scored.slice(1);
  // Then a mix: the other picks are random, but never the same columns twice
  // when that can be helped.
  while (out.length < n && rest.length) {
    const fresh = rest.filter((x) => !out.some((o) => o.col === x.s.col));
    const pool = fresh.length ? fresh : rest;
    const pick = pool[Math.floor(rng() * pool.length)];
    out.push(pick.s);
    rest.splice(rest.indexOf(pick), 1);
  }
  return out.sort((a, b) => a.col - b.col || a.row - b.row);
}

// XP (teacher: "xp is gained both by collecting googly eyes and rows cleared"):
// more rows at once pay more; every eye is worth a lot.
export const ROW_XP = [0, 10, 25, 45, 70, 100];
export const EYE_XP = 15;
export const xpFor = (rows: number, eyes: number) => ROW_XP[Math.min(rows, ROW_XP.length - 1)] + eyes * EYE_XP;

export function newBlock(rng: () => number, eyeChance = 0.15): Block {
  const shape = pickShape(rng);
  if (rng() >= eyeChance) return { shape };
  return { shape, eyeAt: Math.floor(rng() * SHAPES[shape].cells.length), eye: Math.floor(rng() * 5) };
}

export const countEyes = (board: Board) => board.reduce((n, row) => n + row.filter((x) => x?.eye !== undefined).length, 0);
