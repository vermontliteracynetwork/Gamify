// Snakes and Ladders rules and board geometry, kept apart so they can be
// tested. The board is the traditional 10 by 10: square 1 bottom left, rows
// snaking back and forth, square 100 top left. Coordinates are 0..1000.

export const LADDERS: Record<number, number> = { 2: 22, 8: 33, 16: 45, 43: 78, 52: 89, 66: 95 };
export const SNAKES: Record<number, number> = { 37: 4, 47: 14, 61: 40, 71: 50, 87: 54, 97: 64, 99: 79 };
export const LAST = 100;
// Each snake keeps to its own column (ladders have theirs), so nothing crosses;
// the snakes on the board's edges wiggle a little less.
export const SNAKE_AMP: Record<number, number> = { 37: 40, 47: -40, 61: 28, 71: -28, 87: 40, 97: -40, 99: 40 };

export interface Pt { x: number; y: number }

// The middle of a square (0 is the start, drawn on square 1).
export function squareXY(n: number): Pt {
  const k = Math.max(1, Math.min(LAST, n)) - 1;
  const row = Math.floor(k / 10);
  const col = row % 2 === 0 ? k % 10 : 9 - (k % 10);
  return { x: col * 100 + 50, y: 1000 - (row * 100 + 50) };
}

// The square straight above (one row up), for the hot air balloon.
export function above(n: number): number | null {
  const k = Math.max(1, n) - 1;
  const row = Math.floor(k / 10);
  if (row >= 9) return null;
  const col = row % 2 === 0 ? k % 10 : 9 - (k % 10);
  const r2 = row + 1;
  return r2 * 10 + (r2 % 2 === 0 ? col : 9 - col) + 1;
}

// Where landing on a square sends you: up a ladder, down a snake, or nowhere.
export function landing(n: number): { kind: 'ladder' | 'snake' | null; to: number } {
  if (LADDERS[n]) return { kind: 'ladder', to: LADDERS[n] };
  if (SNAKES[n]) return { kind: 'snake', to: SNAKES[n] };
  return { kind: null, to: n };
}

// The squares hopped through, stopping on the last square.
export function hopsFrom(from: number, roll: number): number[] {
  const out: number[] = [];
  for (let p = from + 1; p <= Math.min(LAST, from + roll); p++) out.push(p);
  return out;
}

// The nearest ladder bottom ahead, within `reach` squares.
export function nextLadder(from: number, reach = 10): number | null {
  const ahead = Object.keys(LADDERS).map(Number).filter((s) => s > from && s - from <= reach).sort((a, b) => a - b);
  return ahead[0] ?? null;
}

// A snake's body: control points that wiggle side to side from head to tail.
export function snakePoints(head: number, tail: number, amp = SNAKE_AMP[head] ?? 46): Pt[] {
  const a = squareXY(head), b = squareXY(tail);
  const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
  const nx = -dy / d, ny = dx / d;
  const waves = d > 450 ? 3 : 2;
  const n = waves * 2 + 2;
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const off = Math.sin(t * Math.PI * waves) * amp * (1 - 0.35 * t) * (i === 0 || i === n ? 0 : 1);
    pts.push({ x: a.x + dx * t + nx * off, y: a.y + dy * t + ny * off });
  }
  return pts;
}

// A smooth curve through points (Catmull-Rom), as an SVG path.
export function smoothPath(p: Pt[]): string {
  let d = `M${p[0].x.toFixed(1)} ${p[0].y.toFixed(1)}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] ?? p2;
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += ` C${c1.x.toFixed(1)} ${c1.y.toFixed(1)} ${c2.x.toFixed(1)} ${c2.y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

// Points along that same curve, for a piece sliding down a snake's body.
export function alongPath(p: Pt[], per = 8): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] ?? p2;
    for (let s = 0; s < per; s++) {
      const t = s / per, t2 = t * t, t3 = t2 * t;
      const f = (a: number, b: number, c: number, e: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - e) * t2 + (-a + 3 * b - 3 * c + e) * t3);
      out.push({ x: f(p0.x, p1.x, p2.x, p3.x), y: f(p0.y, p1.y, p2.y, p3.y) });
    }
  }
  out.push(p[p.length - 1]);
  return out;
}

// The rungs of a ladder, bottom to top (where a climbing piece steps).
export function rungs(from: number, to: number, gap = 70): Pt[] {
  const a = squareXY(from), b = squareXY(to);
  const n = Math.max(2, Math.round(Math.hypot(b.x - a.x, b.y - a.y) / gap));
  return Array.from({ length: n + 1 }, (_, i) => ({ x: a.x + ((b.x - a.x) * i) / n, y: a.y + ((b.y - a.y) * i) / n }));
}

// Pieces sharing a square sit side by side instead of on top of each other.
export function spread(i: number, of: number, r = 22): Pt {
  if (of <= 1) return { x: 0, y: 0 };
  const a = (i / of) * Math.PI * 2 + Math.PI;
  return { x: Math.cos(a) * r, y: Math.sin(a) * r };
}

// Exact roll to win: a roll past the last square bounces back the extra.
export function exactPath(from: number, roll: number): number[] {
  const out: number[] = [];
  let p = from, dir = 1;
  for (let i = 0; i < roll; i++) { if (p + dir > LAST) dir = -1; p += dir; out.push(p); }
  return out;
}
