// Surprise cards for Team Board: mostly points, some twists. No card ever
// takes a team below zero.
export type CardKind = { kind: 'points'; points: number } | { kind: 'double' } | { kind: 'swap' } | { kind: 'steal'; points: number };

export type Twist = 'double' | 'swap' | 'steal';
export const ALL_TWISTS: Twist[] = ['double', 'swap', 'steal'];

// `allowed` lets the teacher turn twists off (none = points cards only).
export function dealCards(count: number, rand: () => number = Math.random, allowed: Twist[] = ALL_TWISTS): CardKind[] {
  const twists: CardKind[] = allowed.map((k) => (k === 'steal' ? { kind: 'steal', points: 20 } : { kind: k }));
  const nTwists = twists.length ? Math.max(1, Math.round(count / 5)) : 0;
  const deck: CardKind[] = [];
  for (let i = 0; i < nTwists; i++) deck.push(twists[i % twists.length]);
  const values = [10, 20, 30, 40, 50];
  while (deck.length < count) deck.push({ kind: 'points', points: values[Math.floor(rand() * values.length)] });
  for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
  return deck;
}

export const GRID_POINTS = [100, 200, 300, 400, 500];
