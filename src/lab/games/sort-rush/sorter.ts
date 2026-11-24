// Sort Rush rules, kept apart so they can be tested.
export const LANES = [0.14, 0.38, 0.62, 0.86];

// Points for one right sort: one each, one bonus on a run of five or more,
// two times with Double Points.
export function scoreFor(combo: number, double = false): number {
  const base = 1 + (combo >= 5 ? 1 : 0);
  return double ? base * 2 : base;
}

// Which bin a spot across the board (0..1) falls in.
export const binAt = (x: number, n: number) => Math.max(0, Math.min(n - 1, Math.floor(x * n)));

// A free lane for a new card, so cards never stack on top of each other.
export function freeLane(used: number[], rand: () => number = Math.random): number {
  const open = LANES.map((_, i) => i).filter((i) => !used.includes(i));
  const list = open.length ? open : LANES.map((_, i) => i);
  return list[Math.floor(rand() * list.length)];
}

// The computer sorts into the right bin as often as its level allows.
export function cpuBin(right: number, n: number, sharp: boolean, rand: () => number = Math.random): number {
  if (sharp || n < 2) return right;
  const others = Array.from({ length: n }, (_, i) => i).filter((i) => i !== right);
  return others[Math.floor(rand() * others.length)];
}

// Questions for the bins: no two with the same answer, so every card has one home.
export interface Q { id: string; prompt: string; answer: string }
export function pickBins(draw: () => Q, n: number, keep: Q[] = [], tries = 30): Q[] {
  const out = [...keep];
  const clash = (q: Q) => out.some((o) => o.id === q.id || o.answer.trim().toLowerCase() === q.answer.trim().toLowerCase() || o.prompt === q.prompt);
  let k = 0;
  while (out.length < n && k++ < tries) { const q = draw(); if (!clash(q)) out.push(q); }
  while (out.length < n) out.push(draw());
  return out;
}
