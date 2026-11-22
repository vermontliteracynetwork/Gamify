// Treasure Quest rules, kept apart so they can be tested. A right answer
// opens one of three chests; each chest holds one surprise.

export type Chest =
  | { kind: 'gold'; n: number }
  | { kind: 'double' }
  | { kind: 'lose'; pct: number }
  | { kind: 'take'; pct: number }
  | { kind: 'swap' }
  | { kind: 'moth' };

export interface RollOpts {
  // Someone else has gold (takes and swaps never come up otherwise).
  others: boolean;
  // Take and swap chests are switched on in setup (they start off).
  take?: boolean;
  swap?: boolean;
  // My gold (double and oops never come up at zero).
  mine: number;
  // Lucky Clover: only gold, double, take or swap.
  clover?: boolean;
}

// Weighted surprises: gold most of the time, the wild ones now and then.
export function rollChest(o: RollOpts, rand: () => number = Math.random): Chest {
  const list: [number, () => Chest][] = [
    [52, () => ({ kind: 'gold', n: 10 + 5 * Math.floor(rand() * 9) })],
    [o.mine > 0 ? 10 : 0, () => ({ kind: 'double' })],
    [o.mine > 0 && !o.clover ? 10 : 0, () => ({ kind: 'lose', pct: 25 })],
    [o.others && o.take ? 10 : 0, () => ({ kind: 'take', pct: 25 })],
    [o.others && o.swap ? 6 : 0, () => ({ kind: 'swap' })],
    [o.clover ? 0 : 12, () => ({ kind: 'moth' })],
  ];
  const total = list.reduce((s, [w]) => s + w, 0);
  let r = rand() * total;
  for (const [w, make] of list) { if (w && r < w) return make(); r -= w; }
  return { kind: 'gold', n: 20 };
}

export const rollChests = (o: RollOpts, rand: () => number = Math.random): Chest[] => [0, 1, 2].map(() => rollChest(o, rand));

// Does this chest need another team picked?
export const needsTarget = (c: Chest) => c.kind === 'take' || c.kind === 'swap';

// A share of some gold, rounded to fives, never under 5.
export const lossOf = (gold: number, pct: number) => Math.max(5, Math.round((gold * pct) / 100 / 5) * 5);

// Double never adds more than this.
export const DOUBLE_CAP = 50;

// What a chest does to the scores. `rush` doubles plain gold.
export function applyChest(scores: Record<string, number>, me: string, c: Chest, target?: string, rush = false): Record<string, number> {
  const s = { ...scores };
  const mine = s[me] ?? 0;
  if (c.kind === 'gold') s[me] = mine + c.n * (rush ? 2 : 1);
  if (c.kind === 'double') s[me] = mine + Math.min(mine, DOUBLE_CAP);
  // 'lose' is a funny oops: the coins roll away and bounce back (no loss).
  if (c.kind === 'take' && target) {
    const theirs = s[target] ?? 0;
    const n = Math.min(theirs, lossOf(theirs, c.pct));
    s[target] = theirs - n; s[me] = mine + n;
  }
  if (c.kind === 'swap' && target) { s[me] = s[target] ?? 0; s[target] = mine; }
  return s;
}

// The computer takes from (or swaps with) a random team that has gold.
export function randomOther(scores: Record<string, number>, me: string, rand: () => number = Math.random): string | undefined {
  const list = Object.entries(scores).filter(([id, n]) => id !== me && n > 0).map(([id]) => id);
  return list.length ? list[Math.floor(rand() * list.length)] : undefined;
}

// A coin heap: how many coins sit in each row, bottom row first. Rows
// alternate wide and one narrower, like bricks, so the pile climbs.
export function heapRows(coins: number, width = 5): number[] {
  const rows: number[] = [];
  let left = coins;
  while (left > 0) { const n = Math.min(left, rows.length % 2 ? width - 1 : width); rows.push(n); left -= n; }
  return rows;
}
