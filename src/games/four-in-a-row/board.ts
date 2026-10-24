import type { CpuLevel } from '../../engine/turns';

// Four in a Row: a classic public-domain connection game. 7 columns, 6 rows.
export const COLS = 7;
export const ROWS = 6;
export type Cell = 0 | 1 | 2; // 0 empty, 1 player one, 2 player two
export type Board = Cell[][]; // board[row][col], row 0 at the top

export const emptyBoard = (): Board => Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(0));

export function dropRow(b: Board, col: number): number {
  for (let r = ROWS - 1; r >= 0; r--) if (b[r][col] === 0) return r;
  return -1;
}

export function drop(b: Board, col: number, who: 1 | 2): { board: Board; row: number } | null {
  const row = dropRow(b, col);
  if (row < 0) return null;
  const board = b.map((r) => [...r]);
  board[row][col] = who;
  return { board, row };
}

// The winning four cells, if any.
export function winningLine(b: Board): [number, number][] | null {
  const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const who = b[r][c];
    if (!who) continue;
    for (const [dr, dc] of dirs) {
      const line: [number, number][] = [[r, c]];
      for (let k = 1; k < 4; k++) {
        const rr = r + dr * k, cc = c + dc * k;
        if (rr < 0 || rr >= ROWS || cc < 0 || cc >= COLS || b[rr][cc] !== who) break;
        line.push([rr, cc]);
      }
      if (line.length === 4) return line;
    }
  }
  return null;
}

export const isFull = (b: Board) => b[0].every((c) => c !== 0);
export const openColumns = (b: Board) => Array.from({ length: COLS }, (_, c) => c).filter((c) => b[0][c] === 0);

// Simple position score for the computer: center control and open threes.
function score(b: Board, me: 1 | 2): number {
  let s = 0;
  for (let r = 0; r < ROWS; r++) if (b[r][3] === me) s += 3;
  const them = me === 1 ? 2 : 1;
  const windows: Cell[][] = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
    const w: Cell[] = [];
    for (let k = 0; k < 4; k++) { const rr = r + dr * k, cc = c + dc * k; if (rr < 0 || rr >= ROWS || cc < 0 || cc >= COLS) break; w.push(b[rr][cc]); }
    if (w.length === 4) windows.push(w);
  }
  for (const w of windows) {
    const mine = w.filter((x) => x === me).length, theirs = w.filter((x) => x === them).length, empty = w.filter((x) => x === 0).length;
    if (mine === 3 && empty === 1) s += 5; else if (mine === 2 && empty === 2) s += 2;
    if (theirs === 3 && empty === 1) s -= 4;
  }
  return s;
}

function minimax(b: Board, depth: number, alpha: number, beta: number, maximizing: boolean, me: 1 | 2): number {
  const line = winningLine(b);
  if (line) return b[line[0][0]][line[0][1]] === me ? 100000 + depth : -100000 - depth;
  if (depth === 0 || isFull(b)) return score(b, me);
  const who: 1 | 2 = maximizing ? me : me === 1 ? 2 : 1;
  let best = maximizing ? -Infinity : Infinity;
  for (const c of [3, 2, 4, 1, 5, 0, 6].filter((x) => b[0][x] === 0)) {
    const v = minimax(drop(b, c, who)!.board, depth - 1, alpha, beta, !maximizing, me);
    if (maximizing) { best = Math.max(best, v); alpha = Math.max(alpha, v); } else { best = Math.min(best, v); beta = Math.min(beta, v); }
    if (beta <= alpha) break;
  }
  return best;
}

// The computer's move. Easy: mostly random, takes an obvious win. Medium:
// wins or blocks, else leans to the middle. Hard: looks 5 moves ahead.
export function cpuMove(b: Board, me: 1 | 2, level: CpuLevel, rand: () => number = Math.random): number {
  const open = openColumns(b);
  const them: 1 | 2 = me === 1 ? 2 : 1;
  const winsFor = (who: 1 | 2) => open.find((c) => winningLine(drop(b, c, who)!.board));
  const win = winsFor(me);
  if (win !== undefined && level !== 'easy') return win;
  if (level === 'easy') return win !== undefined && rand() < 0.5 ? win : open[Math.floor(rand() * open.length)];
  const block = winsFor(them);
  if (block !== undefined) return block;
  if (level === 'medium') {
    const weighted = open.flatMap((c) => Array(4 - Math.abs(3 - c)).fill(c) as number[]);
    return weighted[Math.floor(rand() * weighted.length)];
  }
  let bestCol = open[0], bestVal = -Infinity;
  for (const c of [3, 2, 4, 1, 5, 0, 6].filter((x) => open.includes(x))) {
    const v = minimax(drop(b, c, me)!.board, 4, -Infinity, Infinity, false, me);
    if (v > bestVal) { bestVal = v; bestCol = c; }
  }
  return bestCol;
}
