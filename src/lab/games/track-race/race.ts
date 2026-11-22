// Track Race rules, kept apart so they can be tested.
export type Surprise = 'boost' | 'spring' | 'mud' | 'mystery';
export const SURPRISES: Surprise[] = ['boost', 'spring', 'mud', 'mystery'];

// The teacher's Rounds slider also sets the track: more rounds, a longer race,
// so the race ends close to the last round.
export function trackLength(rounds: number): number {
  return Math.max(14, Math.min(40, Math.round(rounds * 1.6)));
}

// Hidden surprise spaces for one lane: about one in six spaces, never on the
// first two or the last two, never side by side.
export function makeSurprises(len: number, rand: () => number = Math.random): Record<number, Surprise> {
  const want = Math.max(2, Math.round(len / 6));
  const out: Record<number, Surprise> = {};
  const spots: number[] = [];
  for (let tries = 0; spots.length < want && tries < 400; tries++) {
    const s = 3 + Math.floor(rand() * (len - 5));
    if (spots.some((x) => Math.abs(x - s) < 2)) continue;
    spots.push(s);
  }
  spots.forEach((s, i) => { out[s] = i === 0 ? 'boost' : SURPRISES[Math.floor(rand() * SURPRISES.length)]; });
  return out;
}

// Where a surprise sends a runner (never off the track at either end).
export function surpriseMove(kind: Exclude<Surprise, 'mystery'>, at: number, len: number): number {
  const d = kind === 'boost' ? 2 : kind === 'spring' ? 3 : -1;
  return Math.max(0, Math.min(len, at + d));
}

// The spaces a runner hops through, one at a time, stopping at the finish.
export function hops(from: number, roll: number, len: number): number[] {
  const out: number[] = [];
  for (let p = from + 1; p <= Math.min(len, from + roll); p++) out.push(p);
  return out;
}

// The runner in front (ties go to the earliest in the list).
export function leaderId(pos: Record<string, number>, order: string[]): string | null {
  let best: string | null = null;
  for (const id of order) if (best === null || pos[id] > pos[best]) best = id;
  return best && pos[best] > 0 ? best : null;
}

// The closest runner ahead of `me`, for swaps and turtle shells.
export function aheadOf(pos: Record<string, number>, order: string[], me: string): string | null {
  let best: string | null = null;
  for (const id of order) if (id !== me && pos[id] > pos[me] && (best === null || pos[id] < pos[best])) best = id;
  return best;
}

// A sticky mud ball halves a roll (rounded up, at least one).
export const shellRoll = (n: number) => Math.max(1, Math.ceil(n / 2));
