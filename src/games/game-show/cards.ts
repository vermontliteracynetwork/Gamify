import type { ThemeItem } from '../../theme/types';

// Surprise cards for Game Show: mostly points, some power-ups (the theme's
// items: double, swap, steal). No card ever takes a team below zero.
export type CardKind = { kind: 'points'; points: number; lucky?: boolean; golden?: boolean } | { kind: 'power'; item: ThemeItem };

// Lines a team just filled (teacher, 2026-11-01: "fill a whole row or column,
// you get 10 bonus points"): how many full rows and columns through card `i`
// are all turned over and all won by the team that won card `i`.
export function linesFilled(cards: { open: boolean; by?: number }[], cols: number, i: number): number {
  const rows = Math.ceil(cards.length / cols);
  const mine = cards[i]?.by;
  if (mine === undefined || !cards[i].open) return 0;
  const r = Math.floor(i / cols), c = i % cols;
  const owned = (k: number) => cards[k]?.open && cards[k].by === mine;
  const row = Array.from({ length: cols }, (_, k) => r * cols + k).every(owned);
  const col = Array.from({ length: rows }, (_, k) => k * cols + c).every(owned);
  return (row ? 1 : 0) + (col ? 1 : 0);
}

// Card boards come as grids (teacher, 2026-10-26: "show the number of cards
// as a grid size").
export const CARD_GRIDS = [
  { cols: 4, rows: 3 }, { cols: 4, rows: 4 }, { cols: 5, rows: 4 }, { cols: 5, rows: 5 }, { cols: 6, rows: 6 },
];
export const gridFor = (count: number) => CARD_GRIDS.find((g) => g.cols * g.rows === count) ?? CARD_GRIDS[0];

// About one power-up per five cards. Each power-up shows up as often as the
// others, and two cards side by side never hold the same one (owner, 2026-11-27).
export function dealCards(count: number, rand: () => number = Math.random, items: ThemeItem[] = []): CardKind[] {
  const nPowers = items.length ? Math.min(Math.floor(count / 3), Math.max(items.length, Math.round(count / 5))) : 0;
  const values = [10, 20, 30, 40, 50];
  const deck: CardKind[] = [];
  for (let i = 0; i < count; i++) deck.push({ kind: 'points', points: values[Math.floor(rand() * values.length)] });
  // Shuffle where the power cards sit, then hand them the items in a
  // shuffled order, round and round, in board order.
  const spots = Array.from({ length: count }, (_, i) => i);
  for (let i = spots.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [spots[i], spots[j]] = [spots[j], spots[i]]; }
  const order = [...items];
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  spots.slice(0, nPowers).sort((a, b) => a - b).forEach((at, k) => { deck[at] = { kind: 'power', item: order[k % order.length] }; });
  return deck;
}

export const GRID_POINTS = [100, 200, 300, 400, 500];
