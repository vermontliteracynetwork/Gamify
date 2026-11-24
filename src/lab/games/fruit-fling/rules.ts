// Pure rules for Fruit Fling: the toss (a launch that peaks inside the
// screen, under the question banner), gravity, and the swipe that slices.

export const GRAVITY = 42; // world units per second squared

export interface Toss { x: number; y: number; vx: number; vy: number }

// A toss from below the bottom edge that peaks at `peak` (world y, smaller
// is higher) and drifts toward the middle so it stays on screen.
export function toss(W: number, peak: number, random: () => number = Math.random, H = 100): Toss {
  const x = 22 + random() * (W - 34);
  const y = H + 8;
  const vy = -Math.sqrt(2 * GRAVITY * (y - peak));
  const flight = (2 * -vy) / GRAVITY;
  const toward = W / 2 + (random() - 0.5) * W * 0.4;
  const vx = ((toward - x) / flight) * (0.6 + random() * 0.5);
  return { x, y, vx, vy };
}

// One step of a flying piece.
export function fly(p: Toss, dt: number, g = GRAVITY): Toss {
  return { x: p.x + p.vx * dt, y: p.y + p.vy * dt + 0.5 * g * dt * dt, vx: p.vx, vy: p.vy + g * dt };
}

// Does the swipe segment a-b pass within r of the center c?
export function segmentHits(ax: number, ay: number, bx: number, by: number, cx: number, cy: number, r: number): boolean {
  const dx = bx - ax, dy = by - ay;
  const len = dx * dx + dy * dy;
  const t = len ? Math.max(0, Math.min(1, ((cx - ax) * dx + (cy - ay) * dy) / len)) : 0;
  const px = ax + t * dx - cx, py = ay + t * dy - cy;
  return px * px + py * py <= r * r;
}
