// Tic Tac Toe rules, kept apart so they can be tested.
export type Cell = string | null; // the player id in the square
export const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];

export function winLine(b: Cell[]): number[] | null {
  for (const l of LINES) if (b[l[0]] && b[l[0]] === b[l[1]] && b[l[1]] === b[l[2]]) return l;
  return null;
}
export const full = (b: Cell[]) => b.every(Boolean);

// The computer: win if it can, block if it must, else the middle, a corner, anything.
// `sharp` false sometimes plays a random square, so Easy can lose.
export function cpuPick(b: Cell[], me: string, them: string, sharp = true, rand: () => number = Math.random): number {
  const open = b.map((c, i) => (c ? -1 : i)).filter((i) => i >= 0);
  if (!sharp && rand() < 0.5) return open[Math.floor(rand() * open.length)];
  for (const who of [me, them]) for (const i of open) { const t = [...b]; t[i] = who; if (winLine(t)) return i; }
  if (open.includes(4)) return 4;
  const corners = [0, 2, 6, 8].filter((i) => open.includes(i));
  if (corners.length) return corners[Math.floor(rand() * corners.length)];
  return open[Math.floor(rand() * open.length)];
}
