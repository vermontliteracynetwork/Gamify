// Pure rules for Sky Flyer: the lanes a wave of answer clouds flies in, the
// plane's springy climb and dive, and when the plane flies into a cloud.

export const TOP = 27;
export const BOTTOM = 90;

// Evenly spaced lane heights for n clouds between the banner and the hills.
export function lanes(n: number, top = TOP, bottom = BOTTOM): number[] {
  if (n <= 1) return [(top + bottom) / 2];
  const gap = (bottom - top) / (n - 1);
  return Array.from({ length: n }, (_, i) => top + gap * i);
}

// One step of the plane: input -1 (climb), 0 (glide) or 1 (dive), or a
// target height to fly toward. Returns the new height and speed.
export function steer(y: number, vy: number, dt: number, input: number, target: number | null = null): { y: number; vy: number } {
  const accel = 260, max = 62, drag = 5.5;
  let want = input;
  if (target !== null && input === 0) want = Math.max(-1, Math.min(1, (target - y) / 6));
  vy += want * accel * dt;
  vy -= vy * Math.min(1, drag * dt) * (want === 0 ? 1.4 : 0.5);
  vy = Math.max(-max, Math.min(max, vy));
  let ny = y + vy * dt;
  if (ny < TOP - 4) { ny = TOP - 4; vy = Math.max(0, vy) * 0.3; }
  if (ny > BOTTOM + 4) { ny = BOTTOM + 4; vy = Math.min(0, vy) * 0.3; }
  return { y: ny, vy };
}

// Is the plane inside a cloud (world units)?
export function inCloud(px: number, py: number, cx: number, cy: number, halfW: number, halfH: number): boolean {
  return Math.abs(px - cx) < halfW && Math.abs(py - cy) < halfH;
}
