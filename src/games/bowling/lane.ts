// Bowling lane (rules borrowed from the Dashboard's Bowling,
// rebuilt flat for every device). Pure logic, so it can be tested.

export const LANES = 5;
export const LANE_X = [-1.0, -0.5, 0, 0.5, 1.0];
const PIN_GAP = 0.48;

// Ten pins in the classic triangle, head pin nearest the player: [x, row].
export const PIN_SPOTS: [number, number][] = (() => {
  const out: [number, number][] = [];
  for (let r = 0; r < 4; r++) for (let i = 0; i <= r; i++) out.push([(i - r / 2) * PIN_GAP, r]);
  return out;
})();
export const fullRack = () => PIN_SPOTS.map(() => true);

// Which pins a roll down a lane knocks over. Pins in the ball's path go
// down, and each falling pin can tip its neighbors behind and beside it, so
// the middle lane strikes often and the edges get a few.
export function knockPins(lane: number, standing: boolean[], rand: () => number = Math.random): { down: number[]; gutter: boolean } {
  const laneX = LANE_X[lane];
  if (Math.abs(laneX) >= 0.99 && rand() < 0.06) return { down: [], gutter: true };
  const x = laneX + (rand() - 0.5) * 0.24;
  const down = new Set<number>();
  PIN_SPOTS.forEach(([px], i) => { if (standing[i] && Math.abs(px - x) < 0.36) down.add(i); });
  const queue = [...down];
  while (queue.length) {
    const k = queue.shift()!;
    const [kx, kr] = PIN_SPOTS[k];
    PIN_SPOTS.forEach(([px, pr], i) => {
      if (!standing[i] || down.has(i)) return;
      const dr = pr - kr;
      const dx = Math.abs(px - kx);
      const p = dr === 1 && dx <= 0.3 ? 0.72 : dr === 0 && dx <= 0.55 ? 0.3 : dr === 2 && dx <= 0.05 ? 0.4 : 0;
      if (p > 0 && rand() < p) { down.add(i); queue.push(i); }
    });
  }
  return { down: [...down], gutter: false };
}

// Points for a roll: a pin each, plus 10 for a strike (all ten on the first
// roll) or 5 for a spare (the rest on the second).
export function rollPoints(down: number, roll: 0 | 1, left: number): { points: number; kind: 'strike' | 'spare' | null } {
  if (left === 0 && roll === 0) return { points: down + 10, kind: 'strike' };
  if (left === 0 && roll === 1) return { points: down + 5, kind: 'spare' };
  return { points: down, kind: null };
}

// The computer aims mostly for the middle.
export function cpuLane(rand: () => number = Math.random): number {
  const w = [0.1, 0.22, 0.36, 0.22, 0.1];
  let r = rand();
  for (let i = 0; i < w.length; i++) { r -= w[i]; if (r <= 0) return i; }
  return 2;
}

// A flat drawing of a lane seen from behind the ball: depth 0 is the near
// end, 1 the far end. Things shrink with depth.
export const scaleAt = (d: number) => 1 / (1 + 1.5 * d);
const FAR = scaleAt(1);
export const yAt = (d: number) => 120 - (88 * (1 - scaleAt(d))) / (1 - FAR); // in a 100 x 130 view
export const halfWidthAt = (d: number) => 42 * scaleAt(d);
export const xAt = (laneX: number, d: number) => 50 + (laneX / 1.25) * halfWidthAt(d);
export const pinDepth = (row: number) => 0.62 + row * 0.08;
