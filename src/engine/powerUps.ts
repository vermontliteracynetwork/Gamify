import type { ThemeItem } from '../theme/types';

// Power-ups in question-break games (teacher, 2026-10-26: questions interrupt
// play and "effect things but not the actual game play"): a right answer
// sometimes brings one of the theme's power-ups. Items marked "often" turn
// up more; the chance itself is the same for every game.
export const POWER_UP_CHANCE = 0.35;

export function rollPowerUp(items: ThemeItem[], rand: () => number = Math.random, chance = POWER_UP_CHANCE): ThemeItem | null {
  if (!items.length || rand() >= chance) return null;
  const pool = items.flatMap((it) => Array.from({ length: it.often ?? 1 }, () => it));
  return pool[Math.floor(rand() * pool.length)] ?? null;
}

// An item's number, or the ability's default when the theme left it blank.
export const amountOf = (it: ThemeItem, fallback: number) => it.amount ?? fallback;
