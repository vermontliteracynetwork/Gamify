// Board Game rules and board (teacher redesign, 2026-11-08): a flat, classic
// board of square spaces that winds back and forth from Start to Finish, like
// a traditional race board game. Answer right, roll, move that many spaces,
// first to the end wins. Every hop lands on one square.

export type SpaceKind = 'regular' | 'lose' | 'again';
export type Power = 'double' | 'x2' | 'tornado' | 'wheel' | 'potion' | 'shield';
export const POWERS: Power[] = ['double', 'x2', 'tornado', 'wheel', 'potion', 'shield'];

export const TRAILS = ['short', 'medium', 'long', 'xlong'] as const;
export type Trail = (typeof TRAILS)[number];
// About 10 / 15 / 20 / 25 rounds per player: a right answer most turns and
// an average roll of 3.5 moves about 2.6 squares a turn.
export const TRAIL_SPACES: Record<Trail, number> = { short: 28, medium: 40, long: 52, xlong: 64 };
export const trailOf = (v: string | undefined): Trail => ((TRAILS as readonly string[]).includes(v ?? '') ? (v as Trail) : 'medium');

export type Rnd = () => number;
export const roll = (rnd: Rnd = Math.random) => 1 + Math.floor(rnd() * 6);

export interface Cell { x: number; y: number; dir: 'r' | 'l' | 'd' }
export interface Layout { cols: number; rows: number; cells: Cell[]; size: number }

// Lay `n` squares out as a snake: a full row, one square down at the end,
// the next row back the other way. The column count is the one that gives the
// biggest squares in a w x h box, so the board always fills the screen.
export function layout(n: number, w: number, h: number): Layout {
  let best: Layout | null = null;
  for (let cols = 4; cols <= 22; cols++) {
    const lanes = Math.ceil((n + 1) / (cols + 1));
    const rows = lanes * 2 - 1;
    const size = Math.min(w / cols, h / rows);
    if (!best || size > best.size) best = { cols, rows, size, cells: [] };
  }
  const L = best!;
  const cells: Cell[] = [];
  let lane = 0;
  while (cells.length < n) {
    const right = lane % 2 === 0;
    for (let k = 0; k < L.cols && cells.length < n; k++) cells.push({ x: right ? k : L.cols - 1 - k, y: lane * 2, dir: right ? 'r' : 'l' });
    if (cells.length < n) cells.push({ x: right ? L.cols - 1 : 0, y: lane * 2 + 1, dir: 'd' });
    lane++;
  }
  // Trim unused rows so a short last lane never leaves an empty band.
  const rows = Math.max(...cells.map((c) => c.y)) + 1;
  return { ...L, rows, size: Math.min(w / L.cols, h / rows), cells };
}

// Lose-a-turn and roll-again squares, scattered (never side by side, never
// in the first or last few squares). Everything else is a regular square.
export function spaceKinds(n: number, rnd: Rnd = Math.random): SpaceKind[] {
  const kinds: SpaceKind[] = Array.from({ length: n }, () => 'regular');
  // About one in seven squares is special: half lose a turn, half roll again.
  const want = Math.max(2, Math.round(n / 14));
  let tries = 0, made = 0;
  while (made < want * 2 && tries++ < 500) {
    const i = 3 + Math.floor(rnd() * (n - 6));
    if (kinds[i] !== 'regular' || kinds[i - 1] !== 'regular' || kinds[i + 1] !== 'regular') continue;
    kinds[i] = made % 2 ? 'again' : 'lose';
    made++;
  }
  return kinds;
}

// Hidden power-up squares (teacher, 2026-11-01: no sign of a power-up until
// you land on it): about one in six regular squares, placed at random.
export function placePowers(kinds: SpaceKind[], allowed: Power[], rnd: Rnd = Math.random): Map<number, Power> {
  const out = new Map<number, Power>();
  if (!allowed.length) return out;
  const n = kinds.length;
  const want = Math.max(3, Math.round(n / 6));
  let tries = 0;
  while (out.size < want && tries++ < 500) {
    const i = 2 + Math.floor(rnd() * (n - 4));
    if (kinds[i] !== 'regular' || out.has(i) || out.has(i - 1) || out.has(i + 1)) continue;
    out.set(i, allowed[out.size % allowed.length]);
  }
  // Shuffle which power sits where, so the order along the board is random.
  const keys = [...out.keys()];
  const vals = [...out.values()].sort(() => rnd() - 0.5);
  keys.forEach((k, j) => out.set(k, vals[j]));
  return out;
}

// Tornado (teacher, 2026-11-08): everyone it lifts lands evenly spaced along
// the board, in a random order, and never back on their own square.
export function tornadoSpots(pos: number[], lifted: boolean[], finish: number, rnd: Rnd = Math.random): number[] {
  const who = pos.map((_, i) => i).filter((i) => lifted[i]);
  if (!who.length) return [...pos];
  const span = finish - 2; // squares 1 .. finish-1
  const step = span / (who.length + 1);
  const spots = who.map((_, k) => Math.max(1, Math.min(finish - 1, Math.round(1 + step * (k + 1)))));
  for (let t = 0; t < 40; t++) {
    const order = [...spots].sort(() => rnd() - 0.5);
    if (who.every((i, k) => order[k] !== pos[i])) return pos.map((p, i) => (lifted[i] ? order[who.indexOf(i)] : p));
  }
  // Every order put someone back home: nudge the clashes one square on.
  return pos.map((p, i) => { if (!lifted[i]) return p; const s = spots[who.indexOf(i)]; return s === p ? Math.min(finish - 1, s + 1) : s; });
}

// The wheel (teacher, 2026-11-08): half forward, half back. Where it stops,
// in degrees, for a result; the pointer sits at the top.
export function wheelStop(forward: boolean, rnd: Rnd = Math.random, turns = 5): number {
  // Forward is the right half (0-180 under the pointer), back the left half.
  const inside = 20 + rnd() * 140;
  const at = forward ? inside : 180 + inside;
  return turns * 360 + (360 - at);
}
