// Lane Hop rules: an endless climb of lanes that change world every
// section (meadow, river, train tracks, ice, space). Every lane is worked
// out from its row number, and everything on it moves as a function of
// time, so the whole world can be tested without drawing it.

export const COLS = 9;
export const SECTION = 12;
export const WORLDS = ['meadow', 'river', 'tracks', 'ice', 'space'] as const;
export type World = (typeof WORLDS)[number];
export type Kind = 'grass' | 'hay' | 'bank' | 'water' | 'pads' | 'gravel' | 'rail' | 'snow' | 'ice' | 'moon' | 'void';
export const SAFE: Record<World, Kind> = { meadow: 'grass', river: 'bank', tracks: 'gravel', ice: 'snow', space: 'moon' };
const HAZARD: Record<World, Kind[]> = { meadow: ['hay'], river: ['water', 'pads'], tracks: ['rail'], ice: ['ice'], space: ['void'] };
const WRAP = COLS + 6;

export interface Obj { x0: number; len: number }
export interface Lane { row: number; world: World; kind: Kind; dir: 1 | -1; speed: number; objs: Obj[]; period: number; offset: number; star: number | null }

function rng(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export const worldOf = (row: number): World => WORLDS[Math.floor(Math.max(0, row) / SECTION) % WORLDS.length];
export const isSafe = (k: Kind) => k === 'grass' || k === 'bank' || k === 'gravel' || k === 'snow' || k === 'moon';
export const rides = (k: Kind) => k === 'water' || k === 'pads';

const cache = new Map<string, Lane>();
export function lane(row: number, seed = 1): Lane {
  const key = `${seed}:${row}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const r = rng(seed * 100003 + row * 7919);
  const world = worldOf(row);
  const at = ((row % SECTION) + SECTION) % SECTION;
  // The first rows and the start of each section are safe; a safe rest lane
  // comes every few rows so nobody is stuck.
  const safe = row < 3 || at === 0 || (at % 4 === 0 && r() < 0.8);
  const kind: Kind = safe ? SAFE[world] : HAZARD[world][Math.floor(r() * HAZARD[world].length)];
  const dir: 1 | -1 = r() < 0.5 ? 1 : -1;
  let speed = 0, objs: Obj[] = [], period = 0;
  const level = Math.min(1, row / 120); // later sections get a little quicker
  const spread = (n: number, len: () => number) => { const start = r() * WRAP; return Array.from({ length: n }, (_, i) => ({ x0: (start + (i * WRAP) / n + r() * 0.8) % WRAP, len: len() })); };
  if (kind === 'hay') { speed = 1 + r() * 1.2 + level; objs = spread(2 + Math.floor(r() * 2), () => 1); }
  if (kind === 'water') { speed = 0.8 + r() * 0.8 + level * 0.5; objs = spread(3, () => 2 + Math.floor(r() * 2)); }
  if (kind === 'pads') { speed = 0; const cols = [...Array(COLS).keys()].filter(() => r() < 0.5); if (cols.length < 3) cols.push(1, 4, 7); objs = [...new Set(cols)].map((c) => ({ x0: c + 3, len: 1 })); }
  if (kind === 'rail') { speed = 14; period = 4.5 + r() * 2.5 - level; objs = [{ x0: 0, len: 6 }]; }
  if (kind === 'ice') { speed = 2.2 + r() * 1.3 + level; objs = spread(2, () => 1); }
  if (kind === 'void') { speed = 0.6 + r() * 0.7 + level * 0.5; objs = spread(3, () => (r() < 0.3 ? 2 : 1)); }
  const star = safe && row > 2 && r() < 0.45 ? Math.floor(r() * COLS) : null;
  const l: Lane = { row, world, kind, dir, speed, objs, period, offset: r() * 10, star };
  cache.set(key, l);
  return l;
}

// The left edge (in cells) of an object at time t.
export function objX(l: Lane, o: Obj, t: number): number {
  if (l.kind === 'rail') {
    const c = (t + l.offset) % l.period;
    const head = -o.len - 1 + c * l.speed;
    return l.dir === 1 ? head : COLS - head - o.len;
  }
  if (l.speed === 0) return o.x0 - 3;
  return ((((o.x0 + l.dir * l.speed * t) % WRAP) + WRAP) % WRAP) - 3;
}

// The train's warning bell rings a moment before it comes.
export function trainWarn(l: Lane, t: number): boolean {
  if (l.kind !== 'rail') return false;
  const c = (t + l.offset) % l.period;
  const x = objX(l, l.objs[0], t);
  return c > l.period - 1.3 || (x + l.objs[0].len > -0.5 && x < COLS + 0.5);
}

export function covering(l: Lane, t: number, col: number): Obj | null {
  const cx = col + 0.5;
  for (const o of l.objs) { const x = objX(l, o, t); if (cx > x + 0.18 && cx < x + o.len - 0.18) return o; }
  return null;
}

// What happens to a hopper standing at col on this lane at time t.
export function danger(l: Lane, t: number, col: number): 'ok' | 'hit' | 'splash' {
  if (isSafe(l.kind)) return 'ok';
  if (rides(l.kind)) return covering(l, t, col) && col > -0.45 && col < COLS - 0.55 ? 'ok' : 'splash';
  return covering(l, t, col) ? 'hit' : 'ok';
}

// How far a log (or nothing) carries the hopper in dt.
export const carry = (l: Lane, dt: number) => (l.kind === 'water' ? l.dir * l.speed * dt : 0);

// The lowest safe row at or above `row` (for a jetpack landing).
export function safeAbove(row: number, seed = 1): number {
  let r = row;
  while (!isSafe(lane(r, seed).kind)) r++;
  return r;
}
// The safe row at or below `row` to start again from after a bump.
export function safeBelow(row: number, seed = 1): number {
  let r = row;
  while (r > 0 && !isSafe(lane(r, seed).kind)) r--;
  return r;
}

// The computer: hop up when the lane above will be safe when it lands,
// else step sideways or wait. A careless computer sometimes just goes.
export function cpuMove(row: number, col: number, t: number, careful: boolean, seed = 1): 'up' | 'left' | 'right' | 'wait' {
  const ok = (r: number, c: number) => c >= 0 && c <= COLS - 1 && [0.15, 0.3, 0.5].every((dt) => danger(lane(r, seed), t + dt, c) === 'ok');
  if (!careful) return 'up';
  if (danger(lane(row, seed), t + 0.4, col) !== 'ok') { for (const d of [-1, 1]) if (ok(row, col + d)) return d < 0 ? 'left' : 'right'; }
  if (ok(row + 1, col)) return 'up';
  if (ok(row + 1, col - 1) && ok(row, col - 1)) return 'left';
  if (ok(row + 1, col + 1) && ok(row, col + 1)) return 'right';
  return 'wait';
}
