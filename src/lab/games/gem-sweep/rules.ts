// Gem Sweep rules: a grid with hidden grumpy rocks (and a few gems), kept
// apart from the drawing so they can be tested.

export interface Board { cols: number; rows: number; rocks: number; rock: boolean[]; gem: boolean[]; open: boolean[]; flag: boolean[]; made: boolean }

export function emptyBoard(cols = 9, rows = 8, rocks = 11): Board {
  const n = cols * rows;
  return { cols, rows, rocks, rock: Array(n).fill(false), gem: Array(n).fill(false), open: Array(n).fill(false), flag: Array(n).fill(false), made: false };
}

export function neighbors(b: Board, i: number): number[] {
  const x = i % b.cols, y = Math.floor(i / b.cols), out: number[] = [];
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    if (!dx && !dy) continue;
    const nx = x + dx, ny = y + dy;
    if (nx >= 0 && ny >= 0 && nx < b.cols && ny < b.rows) out.push(ny * b.cols + nx);
  }
  return out;
}

export const count = (b: Board, i: number) => neighbors(b, i).filter((j) => b.rock[j]).length;

// Rocks are placed on the first dig, never on or next to it, so the first
// dig always opens a patch.
export function place(b: Board, first: number, rand: () => number = Math.random, gems = 3): Board {
  const keep = new Set([first, ...neighbors(b, first)]);
  const spots = [...Array(b.cols * b.rows).keys()].filter((i) => !keep.has(i));
  for (let i = spots.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [spots[i], spots[j]] = [spots[j], spots[i]]; }
  const rock = Array(b.cols * b.rows).fill(false), gem = Array(b.cols * b.rows).fill(false);
  spots.slice(0, b.rocks).forEach((i) => { rock[i] = true; });
  spots.slice(b.rocks, b.rocks + gems).forEach((i) => { gem[i] = true; });
  return { ...b, rock, gem, made: true };
}

// Dig a cell: opens it, and an empty one (no rocks around) opens its whole
// patch. Returns the opened cells in the order they open (nearest first).
export function dig(b: Board, i: number): { board: Board; opened: number[]; rock: boolean } {
  if (b.open[i] || b.flag[i]) return { board: b, opened: [], rock: false };
  const open = [...b.open];
  if (b.rock[i]) { open[i] = true; return { board: { ...b, open }, opened: [i], rock: true }; }
  const opened: number[] = [];
  const queue = [i];
  open[i] = true;
  while (queue.length) {
    const c = queue.shift()!;
    opened.push(c);
    if (count(b, c) === 0) for (const n of neighbors(b, c)) if (!open[n] && !b.rock[n] && !b.flag[n]) { open[n] = true; queue.push(n); }
  }
  return { board: { ...b, open }, opened, rock: false };
}

export const cleared = (b: Board) => b.made && b.rock.every((r, i) => r || b.open[i]);

// Cells the open numbers prove safe, and cells they prove are rocks.
export function deduce(b: Board): { safe: number[]; rocks: number[] } {
  const safe = new Set<number>(), rocks = new Set<number>();
  for (let i = 0; i < b.rock.length; i++) {
    if (!b.open[i] || b.rock[i]) continue;
    const n = count(b, i);
    const hidden = neighbors(b, i).filter((j) => !b.open[j]);
    const known = hidden.filter((j) => b.flag[j] || rocks.has(j));
    if (n === known.length) hidden.forEach((j) => { if (!b.flag[j] && !rocks.has(j)) safe.add(j); });
    else if (n === hidden.length) hidden.forEach((j) => rocks.add(j));
  }
  return { safe: [...safe], rocks: [...rocks] };
}

// The computer digs: a proven safe cell if there is one, else a guess
// (a sharp computer guesses again once when its first guess is a rock).
export function cpuDig(b: Board, sharp: boolean, rand: () => number = Math.random): number {
  const { safe } = deduce(b);
  if (safe.length) return safe[Math.floor(rand() * safe.length)];
  const hidden = b.open.map((o, i) => (!o && !b.flag[i] ? i : -1)).filter((i) => i >= 0);
  let pick = hidden[Math.floor(rand() * hidden.length)];
  if (sharp && b.rock[pick]) pick = hidden[Math.floor(rand() * hidden.length)];
  return pick;
}

// Rock Party: every hidden rock hops to a new hidden spot.
export function shuffleRocks(b: Board, rand: () => number = Math.random): Board {
  const hidden = b.rock.map((r, i) => (r && !b.open[i] ? i : -1)).filter((i) => i >= 0);
  const free = b.open.map((o, i) => (!o && !b.flag[i] ? i : -1)).filter((i) => i >= 0);
  for (let i = free.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [free[i], free[j]] = [free[j], free[i]]; }
  const rock = b.rock.map((r, i) => r && b.open[i]);
  // Flagged rocks stay put.
  b.rock.forEach((r, i) => { if (r && b.flag[i] && !b.open[i]) rock[i] = true; });
  const moving = hidden.filter((i) => !b.flag[i]);
  free.slice(0, moving.length).forEach((i) => { rock[i] = true; });
  return { ...b, rock, gem: b.gem.map((g, i) => g && !rock[i]) };
}
