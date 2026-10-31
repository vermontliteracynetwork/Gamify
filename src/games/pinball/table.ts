// Pinball table math (teacher, 2026-10-31): the ball starts at the bottom
// center, is shot through one of five labeled zones, travels as far as the
// power bar says (bouncing off the walls) and drops into a scoring pocket.
// All sizes are in a 100 x 130 view.

export const W = 100, H = 130;
export const ZONES = 5;
export const ZONE_X = [14, 32, 50, 68, 86];
export const ZONE_Y = 76;
export const LAUNCH = { x: 50, y: 116 };
export const VALUES = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
export const MAX_POCKETS = 10;
export const POCKET_R = 6;
const WALL = 5;
const CAPTURE = 6.5; // the ball drops in when it rolls this close to a pocket
const ROLL_IN = 13; // where it stops, a pocket this close pulls it in

export interface Pt { x: number; y: number }
export interface Pocket extends Pt { value: number }

// Three pockets in round 1, one more each round, up to ten (teacher, 2026-10-31).
export const pocketCount = (round: number) => Math.min(MAX_POCKETS, 2 + Math.max(1, round));

// Point values: 10 to 100, higher ones rarer, and more common the further
// into the game (progress 0 = first round, 1 = last). Each value once a round.
export function pickValues(n: number, progress: number, rand = Math.random): number[] {
  const left = [...VALUES];
  const out: number[] = [];
  const power = 2 - 1.6 * Math.min(1, Math.max(0, progress));
  while (out.length < n && left.length) {
    const weights = left.map((v) => (11 - v / 10) ** power);
    let r = rand() * weights.reduce((a, b) => a + b, 0);
    let i = 0;
    while (i < left.length - 1 && r >= weights[i]) { r -= weights[i]; i++; }
    out.push(left.splice(i, 1)[0]);
  }
  return out;
}

// Pockets go anywhere in the upper table, never in order and never touching.
export function placePockets(values: number[], rand = Math.random): Pocket[] {
  const out: Pocket[] = [];
  for (const value of values) {
    let best: Pt | null = null;
    for (let tries = 0; tries < 400 && !best; tries++) {
      const p = { x: 12 + rand() * 76, y: 12 + rand() * 50 };
      if (out.every((o) => Math.hypot(o.x - p.x, o.y - p.y) >= 17)) best = p;
    }
    // Crowded: take the spot farthest from the others.
    if (!best) {
      let far = -1;
      for (let k = 0; k < 200; k++) {
        const p = { x: 12 + rand() * 76, y: 12 + rand() * 50 };
        const d = Math.min(...out.map((o) => Math.hypot(o.x - p.x, o.y - p.y)));
        if (d > far) { far = d; best = p; }
      }
    }
    out.push({ ...(best as Pt), value });
  }
  return out;
}

// The ball's straight runs: from the launcher through the zone, as far as the
// power says (40 to 160), bouncing off the side walls and the top.
export function shotPath(zone: number, power: number): Pt[] {
  const p = Math.min(1, Math.max(0, power));
  let left = 40 + p * 120;
  const pts: Pt[] = [{ ...LAUNCH }];
  let x = LAUNCH.x, y = LAUNCH.y;
  let dx = ZONE_X[zone] - LAUNCH.x, dy = ZONE_Y - LAUNCH.y;
  const len = Math.hypot(dx, dy);
  dx /= len; dy /= len;
  for (let bounce = 0; bounce < 8 && left > 0.01; bounce++) {
    const tx = dx > 0 ? (W - WALL - x) / dx : dx < 0 ? (WALL - x) / dx : Infinity;
    const ty = dy < 0 ? (WALL - y) / dy : dy > 0 ? (H - WALL - y) / dy : Infinity;
    const t = Math.min(tx, ty, left);
    x += dx * t; y += dy * t; left -= t;
    pts.push({ x, y });
    if (left <= 0.01) break;
    if (t === tx) dx = -dx;
    if (t === ty) dy = -dy;
  }
  return pts;
}

// Where the shot ends: the first pocket the ball rolls over, else a pocket
// near where it stops, else back down the drain. `sure` (Super Shooter)
// always finds the nearest pocket.
export function landing(path: Pt[], pockets: Pocket[], sure = false): { path: Pt[]; pocket: number | null } {
  const out: Pt[] = [path[0]];
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1], b = path[i];
    const seg = Math.hypot(b.x - a.x, b.y - a.y);
    for (let s = 0.5; s <= seg; s += 0.5) {
      const q = { x: a.x + ((b.x - a.x) * s) / seg, y: a.y + ((b.y - a.y) * s) / seg };
      const hit = pockets.findIndex((k) => Math.hypot(k.x - q.x, k.y - q.y) <= CAPTURE);
      if (hit >= 0) return { path: [...out, q, { x: pockets[hit].x, y: pockets[hit].y }], pocket: hit };
    }
    out.push(b);
  }
  const end = path[path.length - 1];
  let near = -1, nd = Infinity;
  pockets.forEach((k, i) => { const d = Math.hypot(k.x - end.x, k.y - end.y); if (d < nd) { nd = d; near = i; } });
  if (near >= 0 && (sure || nd <= ROLL_IN)) return { path: [...out, { x: pockets[near].x, y: pockets[near].y }], pocket: near };
  return { path: [...out, { x: LAUNCH.x, y: H - 4 }], pocket: null };
}

export const pathLength = (pts: Pt[]) => pts.slice(1).reduce((s, p, i) => s + Math.hypot(p.x - pts[i].x, p.y - pts[i].y), 0);

// The point a fraction of the way along a path.
export function pointAt(pts: Pt[], f: number): Pt {
  const total = pathLength(pts);
  let want = Math.min(1, Math.max(0, f)) * total;
  for (let i = 1; i < pts.length; i++) {
    const seg = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    if (want <= seg || i === pts.length - 1) {
      const k = seg ? Math.min(1, want / seg) : 1;
      return { x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * k, y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * k };
    }
    want -= seg;
  }
  return pts[pts.length - 1];
}
