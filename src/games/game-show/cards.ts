import type { ThemeItem } from '../../theme/types';

// Surprise cards for Game Show: mostly points, some power-ups (the theme's
// items: double, swap, steal). No card ever takes a team below zero.
export type CardKind = { kind: 'points'; points: number } | { kind: 'power'; item: ThemeItem };

// Card boards come as grids (teacher, 2026-10-26: "show the number of cards
// as a grid size").
export const CARD_GRIDS = [
  { cols: 4, rows: 3 }, { cols: 4, rows: 4 }, { cols: 5, rows: 4 }, { cols: 5, rows: 5 }, { cols: 6, rows: 6 },
];
export const gridFor = (count: number) => CARD_GRIDS.find((g) => g.cols * g.rows === count) ?? CARD_GRIDS[0];

// About one power-up per five cards; items marked "often" show up more.
export function dealCards(count: number, rand: () => number = Math.random, items: ThemeItem[] = []): CardKind[] {
  const pool = items.flatMap((it) => Array.from({ length: it.often ?? 1 }, () => it));
  const nPowers = pool.length ? Math.min(Math.floor(count / 3), Math.max(items.length, Math.round(count / 5))) : 0;
  const deck: CardKind[] = [];
  // Every item at least once, then by weight.
  for (let i = 0; i < nPowers; i++) deck.push({ kind: 'power', item: i < items.length ? items[i] : pool[Math.floor(rand() * pool.length)] });
  const values = [10, 20, 30, 40, 50];
  while (deck.length < count) deck.push({ kind: 'points', points: values[Math.floor(rand() * values.length)] });
  for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
  return deck;
}

export const GRID_POINTS = [100, 200, 300, 400, 500];
