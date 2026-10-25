// Road Hop (roster Stage 9): a hopper crosses busy roads, one hop at a
// time. Traffic only moves when the hopper hops (or waits), so a young
// player can look, think and then go. Pure logic, so it can be tested.

export const COLS = 7;
export const ROWS = 9; // row 0 is the start grass at the bottom, ROWS - 1 the finish
export const HIDE = 2; // cars loop through two hidden cells on each side, so trucks fully leave
const WIDE = COLS + 2 * HIDE;

// x is 0..WIDE-1 and the screen column is x - HIDE; lap counts trips around,
// so a car that loops back in starts fresh on screen instead of sliding back.
export interface Car { id: number; x: number; len: 1 | 2; lap?: number }
export interface Lane { kind: 'grass' | 'road'; dir: 1 | -1; cars: Car[] }
export interface Pos { row: number; col: number }
export type Move = 'up' | 'down' | 'left' | 'right' | 'wait';

// Middle rows by level: a grass strip in the middle is a safe spot, and
// later maps have more road.
const PATTERNS: ('grass' | 'road')[][] = [
  ['road', 'road', 'grass', 'road', 'road', 'grass', 'road'],
  ['road', 'road', 'road', 'grass', 'road', 'road', 'road'],
  ['road', 'road', 'road', 'road', 'grass', 'road', 'road'],
];

export function makeMap(level: number, rand: () => number = Math.random): Lane[] {
  const middle = PATTERNS[Math.min(level, PATTERNS.length - 1)];
  let id = 0;
  return ['grass', ...middle, 'grass'].map((kind, r) => {
    const dir: 1 | -1 = r % 2 ? 1 : -1;
    if (kind === 'grass') return { kind: 'grass', dir, cars: [] };
    // Two cars on early maps, three later, always with gaps to hop through.
    const count = level >= 2 && rand() < 0.6 ? 3 : 2;
    const start = Math.floor(rand() * WIDE);
    const cars: Car[] = Array.from({ length: count }, (_, i) => ({ id: id++, x: (start + Math.round((i * WIDE) / count)) % WIDE, len: (level >= 1 && i === 0 && rand() < 0.5 ? 2 : 1) as 1 | 2 }));
    return { kind: 'road', dir, cars };
  });
}

export const START: Pos = { row: 0, col: Math.floor(COLS / 2) };

// Every car moves one cell along its lane.
export function stepTraffic(map: Lane[]): Lane[] {
  return map.map((lane) => (lane.kind === 'road' ? { ...lane, cars: lane.cars.map((c) => {
    const raw = c.x + lane.dir;
    return raw < 0 || raw >= WIDE ? { ...c, x: (raw + WIDE) % WIDE, lap: (c.lap ?? 0) + 1 } : { ...c, x: raw };
  }) } : lane));
}

// Screen columns a car covers (a truck covers two).
export function carCols(c: Car, dir: 1 | -1): number[] {
  return c.len === 1 ? [c.x - HIDE] : [c.x - HIDE, c.x - HIDE - dir];
}

export function carAt(map: Lane[], pos: Pos): boolean {
  const lane = map[pos.row];
  return lane.kind === 'road' && lane.cars.some((c) => carCols(c, lane.dir).includes(pos.col));
}

export function moveTo(pos: Pos, move: Move): Pos {
  const row = move === 'up' ? pos.row + 1 : move === 'down' ? pos.row - 1 : pos.row;
  const col = move === 'left' ? pos.col - 1 : move === 'right' ? pos.col + 1 : pos.col;
  return { row: Math.max(0, Math.min(ROWS - 1, row)), col: Math.max(0, Math.min(COLS - 1, col)) };
}

// The nearest grass at or below a row (where a bonked hopper goes back to).
export function safeRow(map: Lane[], row: number): number {
  for (let r = row; r > 0; r--) if (map[r].kind === 'grass') return r;
  return 0;
}

export interface HopResult { map: Lane[]; pos: Pos; bonked: boolean; across: boolean }

// One hop: the hopper moves, then traffic moves. Hopping into a car, or a
// car rolling into the hopper, is a bonk: back to the last grass strip.
export function hop(map: Lane[], pos: Pos, move: Move): HopResult {
  const to = moveTo(pos, move);
  const next = stepTraffic(map);
  if (carAt(map, to) || carAt(next, to)) return { map: next, pos: { row: safeRow(map, to.row), col: to.col }, bonked: true, across: false };
  return { map: next, pos: to, bonked: false, across: to.row === ROWS - 1 };
}

// The computer hops forward when it's safe, steps aside if it isn't, and
// waits when nothing is safe.
export function cpuMove(map: Lane[], pos: Pos, rand: () => number = Math.random): Move {
  const sides: Move[] = rand() < 0.5 ? ['left', 'right'] : ['right', 'left'];
  for (const m of ['up', ...sides, 'wait'] as Move[]) {
    const to = moveTo(pos, m);
    if (m !== 'wait' && to.row === pos.row && to.col === pos.col) continue;
    if (!hop(map, pos, m).bonked) return m;
  }
  return 'down';
}

// Points: one for each new row reached on this map, ten for getting across.
export function hopPoints(best: number, row: number, across: boolean): number {
  return Math.max(0, row - best) + (across ? 10 : 0);
}
