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

// The featured power-up of the week (teacher, 2026-11-13): one power-up per
// game, a new one each week, turns up three times as often and wears a
// "This week" ribbon on the setup cards. Same for everyone, so a class talks about it.
export function weekNumber(now = new Date()): number {
  return Math.floor((now.getTime() - Date.UTC(2026, 0, 5)) / (7 * 24 * 3600 * 1000));
}
export function featuredId(items: ThemeItem[], gameId: string, now = new Date()): string | null {
  if (!items.length) return null;
  const salt = [...gameId].reduce((a, c) => a + c.charCodeAt(0), 0);
  return items[((weekNumber(now) + salt) % items.length + items.length) % items.length].id;
}
export const withFeatured = (items: ThemeItem[], gameId: string): ThemeItem[] => {
  const f = featuredId(items, gameId);
  return items.map((it) => (it.id === f ? { ...it, often: ((it.often ?? 1) * 3) as ThemeItem['often'] } : it));
};
