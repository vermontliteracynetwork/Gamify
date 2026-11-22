// Prize Crane rules, kept apart so they can be tested: the plush prizes,
// how the pile sits, and the chance a claw grabs and keeps a prize.

export const ANIMALS = ['rabbit', 'fox', 'frog', 'owl', 'squirrel', 'badger', 'bat', 'boar', 'dog', 'monkey', 'tiger', 'rooster', 'dragon'] as const;
export type Animal = (typeof ANIMALS)[number];
export type Rarity = 'common' | 'rare' | 'super';
// Rare prizes are worth at most three common ones (skill beats luck).
export const VALUE: Record<Rarity, number> = { common: 10, rare: 20, super: 30 };
const GRIP: Record<Rarity, number> = { common: 0.92, rare: 0.78, super: 0.62 };
const SLIP: Record<Rarity, number> = { common: 0.1, rare: 0.2, super: 0.3 };

export interface Prize { id: number; animal: Animal; rarity: Rarity; x: number; row: number }

// The chute is at the left; prizes sit between MIN_X and MAX_X.
export const CHUTE_X = 0.08, MIN_X = 0.24, MAX_X = 0.92, CLAW_MIN = 0.08, CLAW_MAX = 0.92;

export function rollRarity(rand: () => number = Math.random): Rarity {
  const r = rand();
  return r < 0.08 ? 'super' : r < 0.33 ? 'rare' : 'common';
}
export function makePrize(id: number, x: number, row: number, rand: () => number = Math.random, rarity?: Rarity): Prize {
  const r = rarity ?? rollRarity(rand);
  const list = r === 'super' ? (['dragon', 'tiger', 'owl'] as Animal[]) : ANIMALS.filter((a) => a !== 'dragon');
  return { id, animal: list[Math.floor(rand() * list.length)], rarity: r, x, row };
}

// A fresh pile: a bottom row of six and a top row of four tucked between.
export function makePile(start: number, rand: () => number = Math.random): Prize[] {
  const out: Prize[] = [];
  const step = (MAX_X - MIN_X) / 5;
  for (let i = 0; i < 6; i++) out.push(makePrize(start + i, MIN_X + i * step + (rand() - 0.5) * 0.02, 0, rand));
  for (let i = 0; i < 4; i++) out.push(makePrize(start + 6 + i, MIN_X + step * (0.5 + i * 1.25) + (rand() - 0.5) * 0.03, 1, rand));
  return out;
}

// The prize the claw comes down on: the nearest one, top row first.
export function under(pile: Prize[], x: number, reach = 0.09): Prize | null {
  let best: Prize | null = null;
  for (const p of pile) {
    const d = Math.abs(p.x - x);
    if (d > reach) continue;
    if (!best || p.row > best.row || (p.row === best.row && d < Math.abs(best.x - x))) best = p;
  }
  return best;
}

export interface GrabOpts { wide?: boolean; grip?: boolean; butter?: boolean }
// The chance to close on a prize: better when centered; rarer is harder.
export function grabChance(p: Prize, x: number, o: GrabOpts = {}): number {
  const reach = o.wide ? 0.15 : 0.09;
  const d = Math.abs(p.x - x);
  if (d > reach) return 0;
  const aim = 1 - (d / reach) ** 2 * 0.7;
  return Math.min(1, aim * GRIP[p.rarity] * (o.wide ? 1.1 : 1) * (o.grip ? 1.2 : 1));
}
export const slipChance = (p: Prize, o: GrabOpts = {}) => (o.grip ? 0 : Math.min(0.6, SLIP[p.rarity] + (o.butter ? 0.1 : 0)));

// The computer aims at the best prize it can reach, a little off when unlucky.
export function cpuAim(pile: Prize[], sharp: boolean, rand: () => number = Math.random): number {
  const tops = pile.filter((p) => !pile.some((q) => q.row > p.row && Math.abs(q.x - p.x) < 0.09));
  const pick = [...tops].sort((a, b) => VALUE[b.rarity] - VALUE[a.rarity] || rand() - 0.5)[sharp ? 0 : Math.floor(rand() * tops.length)] ?? pile[0];
  const err = sharp ? (rand() - 0.5) * 0.03 : (rand() - 0.5) * 0.16;
  return Math.max(CLAW_MIN, Math.min(CLAW_MAX, (pick?.x ?? 0.5) + err));
}

// Fill gaps after a prize leaves: a new one drops into the emptiest spot.
export function refill(pile: Prize[], nextId: number, rand: () => number = Math.random, rarity?: Rarity): Prize {
  let bestX = 0.5, bestGap = -1;
  for (let k = 0; k <= 20; k++) {
    const x = MIN_X + ((MAX_X - MIN_X) * k) / 20;
    const gap = Math.min(1, ...pile.filter((p) => p.row === 0).map((p) => Math.abs(p.x - x)));
    if (gap > bestGap) { bestGap = gap; bestX = x; }
  }
  const row = bestGap > 0.08 ? 0 : 1;
  return makePrize(nextId, bestX, row, rand, rarity);
}
