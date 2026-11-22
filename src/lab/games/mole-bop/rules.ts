// Pure rules for Mole Bop: where the holes sit for the box's shape, which
// hole a mole pops out of next, and how long it stays up.

export interface Hole { x: number; y: number; size: number; row: number }

// A garden of holes that fits the world (width W, height 100, the banner
// across the top). Wide boxes get four columns, tall boxes four rows; back
// rows sit a little smaller for depth.
export function holeGrid(W: number, top = 24, bottom = 96): Hole[] {
  const cols = W > 150 ? 4 : 3;
  const rows = W < 95 ? 4 : 3;
  const rh = (bottom - top) / rows;
  const out: Hole[] = [];
  for (let r = 0; r < rows; r++) {
    const depth = 0.86 + (0.14 * r) / Math.max(1, rows - 1);
    const span = W - 22;
    const cw = span / cols;
    for (let c = 0; c < cols; c++) {
      const stagger = r % 2 ? cw * 0.12 : -cw * 0.12;
      out.push({ x: 18 + cw * (c + 0.5) + stagger, y: top + rh * (r + 1) - rh * 0.1, size: Math.min(cw * 0.78, rh * 0.95) * depth, row: r });
    }
  }
  return out;
}

// A random empty hole, never the one that was just used.
export function pickHole(busy: boolean[], last: number, random: () => number = Math.random): number {
  const free = busy.map((b, i) => (b || i === last ? -1 : i)).filter((i) => i >= 0);
  if (!free.length) return -1;
  return free[Math.floor(random() * free.length)];
}

// Seconds a mole stays up: shorter as the burst goes on, never too quick.
export function upTime(elapsed: number, random: () => number = Math.random): number {
  return Math.max(1.8, 3.2 - elapsed * 0.03) + random() * 1.1;
}

// How many moles may be up at once for a question with n answers.
export const maxUp = (n: number, holes: number) => Math.max(2, Math.min(n + 1, holes - 2));
