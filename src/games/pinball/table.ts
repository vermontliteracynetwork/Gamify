// Pinball table math (teacher, 2026-10-31). The ball starts at the bottom
// center and is shot up the lane the player picked (lanes 1 to 5 are only a
// choice: the ball never touches them), as hard as the power bar says,
// bouncing off the side walls. Reaching the top, it drops into one of the
// scoring pockets in a line across the top; too little power and it rolls
// back down the drain. All sizes are in a 100 x 130 view.

export const W = 100, H = 130;
export const WALL = 5;
export const ZONES = 5;
export const LANE_Y = 72; // the numbered lane band across the middle
export const LANE_H = 10;
export const ZONE_X = Array.from({ length: ZONES }, (_, i) => WALL + ((W - 2 * WALL) / ZONES) * (i + 0.5));
export const LAUNCH = { x: 50, y: 116 };
export const POCKET_TOP = 6;
export const POCKET_H = 17;
export const TOP_Y = POCKET_TOP + POCKET_H; // the ball drops into a pocket here
export const VALUES = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
export const MAX_POCKETS = 10;

export interface Pt { x: number; y: number }

// Three pockets in round 1, one more each round, up to ten (teacher, 2026-10-31).
export const pocketCount = (round: number) => Math.min(MAX_POCKETS, 2 + Math.max(1, round));

// Point values: 10 to 100, higher ones rarer, and more common the further
// into the game (progress 0 = first round, 1 = last). Each value once a
// round, in no set order.
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
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}

// The pocket under a spot across the top.
export function pocketAt(x: number, count: number): number {
  const w = (W - 2 * WALL) / count;
  return Math.min(count - 1, Math.max(0, Math.floor((x - WALL) / w)));
}
export const pocketCenter = (i: number, count: number) => WALL + ((W - 2 * WALL) / count) * (i + 0.5);

// The ball's straight runs: from the launcher toward the lane, as far as the
// power says (50 to 200), bouncing off the side walls. It stops at the top.
export function shotPath(zone: number, power: number): { pts: Pt[]; top: boolean } {
  const p = Math.min(1, Math.max(0, power));
  let left = 50 + p * 150;
  const pts: Pt[] = [{ ...LAUNCH }];
  let x = LAUNCH.x, y = LAUNCH.y;
  let dx = ZONE_X[zone] - LAUNCH.x, dy = LANE_Y - LAUNCH.y;
  const len = Math.hypot(dx, dy);
  dx /= len; dy /= len;
  for (let bounce = 0; bounce < 10 && left > 0.01; bounce++) {
    const tx = dx > 0 ? (W - WALL - x) / dx : dx < 0 ? (WALL - x) / dx : Infinity;
    const ty = (TOP_Y - y) / dy; // dy is always up
    const t = Math.min(tx, ty, left);
    x += dx * t; y += dy * t; left -= t;
    pts.push({ x, y });
    if (t === ty) return { pts, top: true };
    if (t === tx) dx = -dx;
  }
  return { pts, top: false };
}

// Where a shot ends: in the pocket it reaches, or back down the drain.
// `sure` (a super shot) always reaches the top.
export function landing(zone: number, power: number, count: number, sure = false): { path: Pt[]; pocket: number | null } {
  const shot = shotPath(zone, sure ? Math.max(power, 1) : power);
  if (shot.top) {
    const end = shot.pts[shot.pts.length - 1];
    const pocket = pocketAt(end.x, count);
    return { path: [...shot.pts, { x: end.x, y: POCKET_TOP + POCKET_H * 0.45 }], pocket };
  }
  return { path: [...shot.pts, { x: LAUNCH.x, y: H - 4 }], pocket: null };
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
