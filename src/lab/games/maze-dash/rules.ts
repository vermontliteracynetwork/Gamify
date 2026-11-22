// Pure rules for Maze Dash: a fresh maze every burst (a winding maze with a
// few extra loops so the runner can dodge), four answer rooms in the
// corners, a path finder for taps and the computer, and grid movement that
// glides from cell to cell.

export const N = 1, E = 2, S = 4, W = 8;
export type Dir = 0 | 1 | 2 | 3; // up, right, down, left
export const DIRS: { bit: number; dc: number; dr: number }[] = [{ bit: N, dc: 0, dr: -1 }, { bit: E, dc: 1, dr: 0 }, { bit: S, dc: 0, dr: 1 }, { bit: W, dc: -1, dr: 0 }];
const OPP = [S, W, N, E];

export interface Maze { cols: number; rows: number; walls: number[]; zones: number[][]; start: number }

// Rooms in the corners, each 3 by 2 cells (2 by 2 on small mazes), open inside.
function zoneCells(cols: number, rows: number): number[][] {
  const zw = cols >= 11 ? 3 : 2, zh = 2;
  const at = (c0: number, r0: number) => { const out: number[] = []; for (let r = r0; r < r0 + zh; r++) for (let c = c0; c < c0 + zw; c++) out.push(r * cols + c); return out; };
  return [at(0, 0), at(cols - zw, 0), at(0, rows - zh), at(cols - zw, rows - zh)];
}

export function makeMaze(cols: number, rows: number, random: () => number = Math.random, loops = 0.35): Maze {
  const walls = Array(cols * rows).fill(N | E | S | W);
  const seen = new Array(cols * rows).fill(false);
  const start = Math.floor(rows / 2) * cols + Math.floor(cols / 2);
  const stack = [start]; seen[start] = true;
  const open = (i: number, d: number) => { const c = i % cols, r = Math.floor(i / cols); const j = (r + DIRS[d].dr) * cols + c + DIRS[d].dc; walls[i] &= ~DIRS[d].bit; walls[j] &= ~OPP[d]; };
  const nb = (i: number, d: number) => { const c = i % cols + DIRS[d].dc, r = Math.floor(i / cols) + DIRS[d].dr; return c < 0 || r < 0 || c >= cols || r >= rows ? -1 : r * cols + c; };
  while (stack.length) {
    const i = stack[stack.length - 1];
    const ds = [0, 1, 2, 3].filter((d) => { const j = nb(i, d); return j >= 0 && !seen[j]; });
    if (!ds.length) { stack.pop(); continue; }
    const d = ds[Math.floor(random() * ds.length)];
    const j = nb(i, d); open(i, d); seen[j] = true; stack.push(j);
  }
  // Extra loops: knock through some dead ends.
  for (let i = 0; i < walls.length; i++) {
    const shut = [0, 1, 2, 3].filter((d) => walls[i] & DIRS[d].bit && nb(i, d) >= 0);
    if (shut.length >= 3 && random() < loops) open(i, shut[Math.floor(random() * shut.length)]);
  }
  const zones = zoneCells(cols, rows);
  for (const z of zones) for (const i of z) for (let d = 0; d < 4; d++) { const j = nb(i, d); if (j >= 0 && z.includes(j)) open(i, d); }
  // Every room has at least two ways in.
  for (const z of zones) {
    const doors = z.flatMap((i) => [0, 1, 2, 3].map((d) => ({ i, d, j: nb(i, d) }))).filter(({ j }) => j >= 0 && !z.includes(j));
    const already = doors.filter(({ i, d }) => !(walls[i] & DIRS[d].bit)).length;
    for (let k = already; k < 2 && doors.length; k++) { const p = doors.splice(Math.floor(random() * doors.length), 1)[0]; open(p.i, p.d); }
  }
  return { cols, rows, walls, zones, start };
}

export const canGo = (m: Maze, i: number, d: Dir) => !(m.walls[i] & DIRS[d].bit);
export const step = (m: Maze, i: number, d: Dir) => i + DIRS[d].dr * m.cols + DIRS[d].dc;
export const zoneOf = (m: Maze, i: number) => m.zones.findIndex((z) => z.includes(i));

// Shortest path (cells, not counting the start) from a cell to any target.
export function path(m: Maze, from: number, targets: number[]): number[] {
  const prev = new Map<number, number>([[from, -1]]);
  const q = [from];
  while (q.length) {
    const i = q.shift()!;
    if (targets.includes(i) && i !== from) { const out: number[] = []; for (let k = i; k !== from; k = prev.get(k)!) out.unshift(k); return out; }
    for (let d = 0 as Dir; d < 4; d = (d + 1) as Dir) if (canGo(m, i, d)) { const j = step(m, i, d); if (!prev.has(j)) { prev.set(j, i); q.push(j); } }
  }
  return [];
}

// Which way to go from one cell to the next one beside it.
export function dirTo(m: Maze, from: number, to: number): Dir | null {
  for (let d = 0 as Dir; d < 4; d = (d + 1) as Dir) if (canGo(m, from, d) && step(m, from, d) === to) return d;
  return null;
}

// Answers for the rooms: shuffled, and the right one never in the room the
// runner is standing in (so a new question is never answered by itself).
export function dealZones(n: number, right: number, avoid: number, random: () => number = Math.random): number[] {
  const rooms = n <= 2 ? [0, 3] : n === 3 ? [0, 1, 3] : [0, 1, 2, 3];
  const choices = [...Array(n).keys()];
  for (let i = choices.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [choices[i], choices[j]] = [choices[j], choices[i]]; }
  const out = [-1, -1, -1, -1];
  rooms.forEach((z, k) => { out[z] = choices[k]; });
  if (avoid >= 0 && out[avoid] === right) {
    const other = rooms.find((z) => z !== avoid)!;
    [out[avoid], out[other]] = [out[other], out[avoid]];
  }
  return out;
}

// A wandering cloud picks its next way at a crossing: never straight back
// unless stuck; leaning toward (or away from) the runner.
export function ghostDir(m: Maze, at: number, came: Dir | null, toward: number, lean: number, random: () => number = Math.random): Dir {
  const back = came === null ? -1 : (came + 2) % 4;
  let ds = ([0, 1, 2, 3] as Dir[]).filter((d) => canGo(m, at, d) && d !== back);
  if (!ds.length) ds = ([0, 1, 2, 3] as Dir[]).filter((d) => canGo(m, at, d));
  const tc = toward % m.cols, tr = Math.floor(toward / m.cols);
  const dist = (d: Dir) => { const j = step(m, at, d); return Math.abs(j % m.cols - tc) + Math.abs(Math.floor(j / m.cols) - tr); };
  if (random() < Math.abs(lean)) ds.sort((a, b) => (lean > 0 ? dist(a) - dist(b) : dist(b) - dist(a)));
  else ds.sort(() => random() - 0.5);
  return ds[0];
}
