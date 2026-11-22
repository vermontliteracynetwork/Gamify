// Pixel Blaster rules, kept apart from the drawing so they can be tested.
// The screen is a fixed 720 x 540 world (drawn bigger or smaller to fit).

export const W = 720;
export const H = 540;
export const SHIP_Y = 500;
export const LANDED_Y = 360; // the answer row's top reaching this line means they landed

// Where answer slot k of n sits across the formation.
export function slotX(k: number, n: number, fx: number): number {
  const gap = Math.min(170, 640 / Math.max(1, n));
  return fx + (k - (n - 1) / 2) * gap;
}

// How far the formation can sweep left and right before it steps down.
export function sweep(n: number): number {
  const gap = Math.min(170, 640 / Math.max(1, n));
  return Math.max(20, (W - 40 - (n - 1) * gap - 130) / 2);
}

// An alien (with its answer sign under it) is hit by a bolt at (bx, by).
export function hits(ax: number, ay: number, bx: number, by: number): boolean {
  return Math.abs(bx - ax) <= 64 && by >= ay - 26 && by <= ay + 78;
}

// Points for the right alien: 3, plus a combo bonus that grows to 3.
export function rightPoints(combo: number): number {
  return 3 + Math.min(3, combo);
}

// Break an answer into lines that fit a sign about `max` characters wide.
export function wrap(text: string, max = 12): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    if (!line) line = w;
    else if ((line + ' ' + w).length <= max) line += ' ' + w;
    else { lines.push(line); line = w; }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

// The computer picks which alien to aim at: the right one when it "knows"
// the answer, otherwise any wrong one.
export function cpuTarget(n: number, right: number, knows: boolean, rand: () => number = Math.random): number {
  if (knows || n < 2) return right;
  const wrong = [...Array(n).keys()].filter((k) => k !== right);
  return wrong[Math.floor(rand() * wrong.length)];
}

// Shuffle the slot order (Disco Aliens), never leaving it unchanged.
export function shuffleSlots(n: number, rand: () => number = Math.random): number[] {
  const order = [...Array(n).keys()];
  if (n < 2) return order;
  do {
    for (let i = n - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  } while (order.every((v, i) => v === i));
  return order;
}
