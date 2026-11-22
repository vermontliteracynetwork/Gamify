// Block Drop rules: a well of 10 x 20 cells and falling four-square pieces,
// kept apart from the drawing so they can be tested. A cell is 0 (empty), a
// candy color 1..7, or BOMB.

export const COLS = 10;
export const ROWS = 20;
export const BOMB = 8;
export type Grid = number[][]; // [row][col], row 0 at the top

// The seven four-square shapes (and the one-square bomb), as cells in a box.
export const SHAPES: [number, number][][] = [
  [[0, 1], [1, 1], [2, 1], [3, 1]], // long stick
  [[0, 0], [1, 0], [0, 1], [1, 1]], // square
  [[1, 0], [0, 1], [1, 1], [2, 1]], // tee
  [[1, 0], [2, 0], [0, 1], [1, 1]], // step right
  [[0, 0], [1, 0], [1, 1], [2, 1]], // step left
  [[0, 0], [0, 1], [1, 1], [2, 1]], // hook left
  [[2, 0], [0, 1], [1, 1], [2, 1]], // hook right
  [[0, 0]], // bomb
];
const BOX = [4, 2, 3, 3, 3, 3, 3, 1];

export interface Piece { kind: number; rot: number; x: number; y: number }

export const emptyGrid = (): Grid => Array.from({ length: ROWS }, () => Array(COLS).fill(0));

// The cells a piece covers, as [col, row].
export function cells(p: Piece): [number, number][] {
  const n = BOX[p.kind];
  return SHAPES[p.kind].map(([cx, cy]) => {
    let x = cx, y = cy;
    for (let r = 0; r < ((p.rot % 4) + 4) % 4; r++) [x, y] = [n - 1 - y, x];
    return [p.x + x, p.y + y];
  });
}

export function fits(g: Grid, p: Piece): boolean {
  return cells(p).every(([x, y]) => x >= 0 && x < COLS && y < ROWS && (y < 0 || g[y][x] === 0));
}

export function spawn(kind: number): Piece {
  return { kind, rot: 0, x: Math.floor((COLS - BOX[kind]) / 2), y: kind === 0 ? -1 : 0 };
}

// Turn a piece, nudging it off a wall if it needs to.
export function rotate(g: Grid, p: Piece, dir = 1): Piece | null {
  for (const dx of [0, -1, 1, -2, 2]) {
    const t = { ...p, rot: p.rot + dir, x: p.x + dx };
    if (fits(g, t)) return t;
  }
  return null;
}

export function move(g: Grid, p: Piece, dx: number, dy: number): Piece | null {
  const t = { ...p, x: p.x + dx, y: p.y + dy };
  return fits(g, t) ? t : null;
}

// Where the piece lands if dropped straight down.
export function dropped(g: Grid, p: Piece): Piece {
  let t = p;
  for (let n = move(g, t, 0, 1); n; n = move(g, t, 0, 1)) t = n;
  return t;
}

export function merge(g: Grid, p: Piece): Grid {
  const out = g.map((r) => [...r]);
  for (const [x, y] of cells(p)) if (y >= 0) out[y][x] = p.kind === 7 ? BOMB : p.kind + 1;
  return out;
}

export const fullRows = (g: Grid) => g.map((r, i) => (r.every(Boolean) ? i : -1)).filter((i) => i >= 0);

export function clearRows(g: Grid, rows: number[]): Grid {
  const keep = g.filter((_, i) => !rows.includes(i));
  return [...Array.from({ length: rows.length }, () => Array(COLS).fill(0)), ...keep];
}

export const LINE_POINTS = [0, 2, 5, 8, 12];

// A bomb blows a 3 x 3 hole around where it lands.
export function explode(g: Grid, x: number, y: number): Grid {
  return g.map((r, ry) => r.map((v, rx) => (Math.abs(rx - x) <= 1 && Math.abs(ry - y) <= 1 ? 0 : v)));
}

// Gravity Squish: every block falls straight down to fill the holes.
export function squish(g: Grid): Grid {
  const out = emptyGrid();
  for (let x = 0; x < COLS; x++) {
    const col = g.map((r) => r[x]).filter(Boolean);
    col.forEach((v, i) => { out[ROWS - col.length + i][x] = v; });
  }
  return out;
}

// How tall the stack is (0 = empty well).
export function height(g: Grid): number {
  const top = g.findIndex((r) => r.some(Boolean));
  return top < 0 ? 0 : ROWS - top;
}

function score(g: Grid): number {
  let agg = 0, holes = 0, bump = 0, prev = -1;
  for (let x = 0; x < COLS; x++) {
    let h = 0, seen = false;
    for (let y = 0; y < ROWS; y++) { if (g[y][x]) { if (!seen) h = ROWS - y; seen = true; } else if (seen) holes++; }
    agg += h;
    if (prev >= 0) bump += Math.abs(h - prev);
    prev = h;
  }
  return -0.51 * agg - 0.36 * holes * 2 - 0.18 * bump;
}

// The computer's pick: the turn and column that leave the tidiest stack.
// `sharp` false picks a random spot sometimes, so Easy plays sloppier.
export function bestPlace(g: Grid, p: Piece, sharp = true, rand: () => number = Math.random): { rot: number; x: number } {
  let best = { rot: p.rot, x: p.x }, top = -Infinity;
  const options: { rot: number; x: number }[] = [];
  for (let rot = 0; rot < 4; rot++) for (let x = -2; x < COLS + 2; x++) {
    const t = { ...p, rot, x, y: p.y };
    if (!fits(g, t)) continue;
    options.push({ rot, x });
    const land = dropped(g, t);
    let after = merge(g, land);
    const lines = fullRows(after).length;
    after = clearRows(after, fullRows(after));
    const v = score(after) + lines * 0.76 * 3;
    if (v > top) { top = v; best = { rot, x }; }
  }
  if (!sharp && options.length && rand() < 0.4) return options[Math.floor(rand() * options.length)];
  return best;
}

// A bag of all seven shapes, shuffled, so droughts never happen.
export function bag(rand: () => number = Math.random): number[] {
  const b = [0, 1, 2, 3, 4, 5, 6];
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
}
