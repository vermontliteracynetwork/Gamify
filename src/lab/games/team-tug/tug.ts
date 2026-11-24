// Team Tug rules, kept apart so they can be tested. The rope's flag sits at
// -1 (the left team's line) to 1 (the right team's line); 0 is the middle.
export type Side = 'left' | 'right';
export const dir = (s: Side) => (s === 'left' ? -1 : 1);
export const clamp = (n: number) => Math.max(-1, Math.min(1, n));

// How far one pull moves the flag (sized so a default game plays about two
// or three tugs): a base with some luck, more with up to two extra
// pullers, half when the other team has Super Grip.
export function pullSize({ extra = 0, gripped = false, rand = Math.random }: { extra?: number; gripped?: boolean; rand?: () => number } = {}): number {
  const base = 0.3 + rand() * 0.15;
  return base * (1 + 0.3 * Math.min(2, extra)) * (gripped ? 0.5 : 1);
}

export function pull(pos: number, side: Side, size: number): number {
  return clamp(pos + dir(side) * size);
}

export function winner(pos: number): Side | null {
  if (pos <= -1) return 'left';
  if (pos >= 1) return 'right';
  return null;
}

// A gust blows the flag part of the way back to the middle.
export const gust = (pos: number, share = 0.35) => pos * (1 - share);
