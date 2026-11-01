import { useSyncExternalStore } from 'react';

// The background color behind each game, picked by the teacher (2026-11-01:
// "background color of game should be editable for each game"). Kept on
// this device, one per game; empty means the theme's own background.
const KEY = 'gamify:stage-colors';
const listeners = new Set<() => void>();
let cache: Record<string, string> | null = null;

function read(): Record<string, string> {
  if (cache) return cache;
  try { cache = JSON.parse(localStorage.getItem(KEY) ?? '{}') ?? {}; } catch { cache = {}; }
  return cache!;
}

export function setStageColor(gameId: string, color: string | null) {
  const next = { ...read() };
  if (color) next[gameId] = color; else delete next[gameId];
  cache = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* private window */ }
  listeners.forEach((l) => l());
}

export function useStageColor(gameId: string): string | undefined {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => read()[gameId], () => undefined);
}

// Black or white text, whichever has more contrast on the color (WCAG).
export function inkFor(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return '#000000';
  const n = parseInt(m[1], 16);
  const lin = (v: number) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const L = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  return (L + 0.05) / 0.05 >= 1.05 / (L + 0.05) ? '#000000' : '#ffffff';
}

// The swatches offered: the brand palette plus a game-show red.
export const STAGE_SWATCHES = ['#b4c4fb', '#c8282f', '#22336e', '#9fe7a0', '#ed9d75', '#fdfd94', '#c9a3f5', '#07070f'];
