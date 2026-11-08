import { GAMES } from '../games/registry';
import type { ThemeItem } from '../theme/types';

// My shelf (engagement audit, 2026-11-08): every finished game earns a
// sticker of one of that game's Classic power-ups, kept on this device. A
// private collection to complete, never a ranking. No names, no accounts.
const KEY = 'gamify:shelf';
export interface Sticker { gameId: string; gameName: string; item: ThemeItem }

// Games with no power-ups still give stickers, drawn from the Classic art.
const EXTRA: Record<string, [string, string][]> = {
  'star-quiz': [['Lucky Star', 'double-star'], ['Rain Cloud', 'rain-cloud'], ['Snow Globe', 'snow-globe']],
};
export function allStickers(): Sticker[] {
  // Only the games on the list (hidden games join when they come back).
  return GAMES.flatMap((g) => {
    const items: ThemeItem[] = g.items?.classic?.length ? g.items.classic
      : (EXTRA[g.id] ?? []).map(([name, art]) => ({ id: `sticker-${art}`, name, ability: '', motion: 'bob', often: 1, art }));
    return items.map((item) => ({ gameId: g.id, gameName: g.name, item }));
  });
}
const keyOf = (s: { gameId: string; item: ThemeItem }) => `${s.gameId}:${s.item.id}`;
export function owned(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]') as string[]); } catch { return new Set(); }
}
export const has = (s: Sticker, mine = owned()) => mine.has(keyOf(s));

// A sticker for finishing this game: a new one while any are missing.
export function award(gameId: string, rnd: () => number = Math.random): { sticker: Sticker; isNew: boolean } | null {
  const pool = allStickers().filter((s) => s.gameId === gameId);
  if (!pool.length) return null;
  const mine = owned();
  const fresh = pool.filter((s) => !mine.has(keyOf(s)));
  const pick = (fresh.length ? fresh : pool)[Math.floor(rnd() * (fresh.length || pool.length))];
  mine.add(keyOf(pick));
  try { localStorage.setItem(KEY, JSON.stringify([...mine])); } catch { /* private mode: no shelf */ }
  return { sticker: pick, isNew: fresh.length > 0 };
}
