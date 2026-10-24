// Bubble Pop board (logic borrowed from the Dashboard's Bubble Shooter,
// trimmed to the core rules). Pure logic, no drawing, so it can be tested.
//
// The board is a hex grid in world units: every bubble has radius 1, a row
// is 11 wide, and every other row is shifted half a bubble. "parity" flips
// when a new row is pushed in from the top.

export const COLS = 11;
export const R = 1;
export const ROW_H = Math.sqrt(3);
export const W = COLS * 2;
export const DANGER_ROW = 11; // a bubble on this row sets off a rescue
export const MAX_ROWS = 13;
export const SHOOTER = { x: W / 2, y: (MAX_ROWS + 1.4) * ROW_H };
export const H = SHOOTER.y + 2.2;
export const COLORS = 6;

export type Cell = number | null;
export interface Board { rows: Cell[][]; parity: number }
export type Rng = () => number;
export type Hit = [number, number, number]; // row, column, color

const shifted = (b: Board, r: number) => (r + b.parity) % 2 === 1;
export const rowLen = (b: Board, r: number) => (shifted(b, r) ? COLS - 1 : COLS);
export const center = (b: Board, r: number, c: number) => ({ x: R + c * 2 + (shifted(b, r) ? R : 0), y: R + r * ROW_H });
const get = (b: Board, r: number, c: number): Cell => b.rows[r]?.[c] ?? null;
const copy = (b: Board): Board => ({ rows: b.rows.map((row) => row.slice()), parity: b.parity });

export function neighbors(b: Board, r: number, c: number): [number, number][] {
  const d = shifted(b, r) ? [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]] : [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]];
  return d.map(([dr, dc]) => [r + dr, c + dc] as [number, number]).filter(([nr, nc]) => nr >= 0 && nr < MAX_ROWS && nc >= 0 && nc < rowLen(b, nr));
}

export function emptyBoard(): Board {
  const b: Board = { rows: [], parity: 0 };
  for (let r = 0; r < MAX_ROWS; r++) b.rows.push(Array(rowLen(b, r)).fill(null));
  return b;
}

// A friendly board: a few rows, with same-color clumps so pops come often.
// Later boards add a color and a row.
export function makeBoard(level: number, rng: Rng = Math.random): Board {
  const colors = Math.min(COLORS, 3 + level);
  const rows = Math.min(7, 4 + level);
  const b = emptyBoard();
  for (let r = 0; r < rows; r++) for (let c = 0; c < rowLen(b, r); c++) {
    const near = neighbors(b, r, c).map(([nr, nc]) => get(b, nr, nc)).filter((x): x is number => x !== null);
    b.rows[r][c] = near.length && rng() < 0.55 ? near[Math.floor(rng() * near.length)] : Math.floor(rng() * colors);
  }
  return b;
}

export const filled = (b: Board) => b.rows.reduce((n, row) => n + row.filter((x) => x !== null).length, 0);
export const colorsLeft = (b: Board) => [...new Set(b.rows.flat().filter((x): x is number => x !== null))].sort();
export const lowestRow = (b: Board) => { for (let r = MAX_ROWS - 1; r >= 0; r--) if (b.rows[r].some((x) => x !== null)) return r; return -1; };

// A new row slides in at the top (after several shots with no pop).
export function pushRow(b: Board, colors: number[], rng: Rng = Math.random): Board {
  const nb: Board = { rows: [[]], parity: 1 - b.parity };
  for (let r = 0; r < MAX_ROWS - 1; r++) nb.rows.push(b.rows[r].slice());
  nb.rows[0] = Array(rowLen(nb, 0)).fill(null).map(() => colors[Math.floor(rng() * colors.length)] ?? 0);
  return nb;
}

// Where a shot at this angle (radians; straight up is -PI/2) ends up: the
// path for the aim dots and the flight, and the empty cell it snaps into.
export function traceShot(b: Board, angle: number): { path: { x: number; y: number }[]; cell: [number, number] | null } {
  let x = SHOOTER.x, y = SHOOTER.y;
  let dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const path = [{ x, y }];
  for (let i = 0; i < 4000; i++) {
    x += dx * 0.12; y += dy * 0.12;
    if (x < R) { x = 2 * R - x; dx = -dx; path.push({ x: R, y }); }
    if (x > W - R) { x = 2 * (W - R) - x; dx = -dx; path.push({ x: W - R, y }); }
    let hit = y <= R;
    const rGuess = Math.round((y - R) / ROW_H);
    for (let r = Math.max(0, rGuess - 1); r <= Math.min(MAX_ROWS - 1, rGuess + 1) && !hit; r++) {
      for (let c = 0; c < rowLen(b, r); c++) {
        if (get(b, r, c) === null) continue;
        const p = center(b, r, c);
        if ((p.x - x) ** 2 + (p.y - y) ** 2 < (2 * R * 0.88) ** 2) { hit = true; break; }
      }
    }
    if (hit) { path.push({ x, y }); return { path, cell: snap(b, x, y) }; }
  }
  return { path, cell: null };
}

// The nearest empty cell to a point that touches the ceiling or a bubble.
export function snap(b: Board, x: number, y: number): [number, number] | null {
  let best: [number, number] | null = null;
  let bd = Infinity;
  const rGuess = Math.round((y - R) / ROW_H);
  for (let r = Math.max(0, rGuess - 2); r <= Math.min(MAX_ROWS - 1, rGuess + 2); r++) {
    for (let c = 0; c < rowLen(b, r); c++) {
      if (get(b, r, c) !== null) continue;
      if (r > 0 && !neighbors(b, r, c).some(([nr, nc]) => get(b, nr, nc) !== null)) continue;
      const p = center(b, r, c);
      const d = (p.x - x) ** 2 + (p.y - y) ** 2;
      if (d < bd) { bd = d; best = [r, c]; }
    }
  }
  return best;
}

function group(b: Board, r: number, c: number, col: number): [number, number][] {
  const seen = new Set([`${r},${c}`]);
  const out: [number, number][] = [[r, c]];
  for (let i = 0; i < out.length; i++) {
    for (const [nr, nc] of neighbors(b, out[i][0], out[i][1])) {
      if (seen.has(`${nr},${nc}`) || get(b, nr, nc) !== col) continue;
      seen.add(`${nr},${nc}`); out.push([nr, nc]);
    }
  }
  return out;
}

// Puts a bubble in a cell; 3 or more of one color touching pop, then every
// bubble no longer hanging from the top falls.
export function place(b0: Board, r: number, c: number, color: number): { board: Board; popped: Hit[]; dropped: Hit[] } {
  const b = copy(b0);
  const popped: Hit[] = [];
  const dropped: Hit[] = [];
  b.rows[r][c] = color;
  const g = group(b, r, c, color);
  if (g.length < 3) return { board: b, popped, dropped };
  for (const [gr, gc] of g) { popped.push([gr, gc, color]); b.rows[gr][gc] = null; }
  const anchored = new Set<string>();
  const stack: [number, number][] = [];
  for (let cc = 0; cc < rowLen(b, 0); cc++) if (get(b, 0, cc) !== null) { anchored.add(`0,${cc}`); stack.push([0, cc]); }
  while (stack.length) {
    const [sr, sc] = stack.pop()!;
    for (const [nr, nc] of neighbors(b, sr, sc)) if (get(b, nr, nc) !== null && !anchored.has(`${nr},${nc}`)) { anchored.add(`${nr},${nc}`); stack.push([nr, nc]); }
  }
  for (let rr = 0; rr < MAX_ROWS; rr++) for (let cc = 0; cc < rowLen(b, rr); cc++) {
    const k = get(b, rr, cc);
    if (k !== null && !anchored.has(`${rr},${cc}`)) { dropped.push([rr, cc, k]); b.rows[rr][cc] = null; }
  }
  return { board: b, popped, dropped };
}

// 10 points a pop, 20 a fall.
export const shotPoints = (res: { popped: Hit[]; dropped: Hit[] }) => res.popped.length * 10 + res.dropped.length * 20;

// A close call (a bubble reached the danger row): the bottom two rows puff
// away, so the game never ends in a loss.
export function rescue(b0: Board): { board: Board; removed: Hit[] } {
  const b = copy(b0);
  const low = lowestRow(b);
  const removed: Hit[] = [];
  for (let r = Math.max(0, low - 1); r <= low; r++) for (let c = 0; c < rowLen(b, r); c++) {
    const k = b.rows[r][c];
    if (k !== null) { removed.push([r, c, k]); b.rows[r][c] = null; }
  }
  return { board: b, removed };
}

// The aim never goes flatter than about 9 degrees above the side walls.
export const clampAngle = (a: number) => Math.max(-Math.PI + 0.16, Math.min(-0.16, a));

// The next bubble is always a color still on the board, so every shot can pop.
export const nextColor = (b: Board, rng: Rng = Math.random) => { const left = colorsLeft(b); return left.length ? left[Math.floor(rng() * left.length)] : 0; };
