import type { PlayerSettings } from '../settings/settings';

// How slowly the games move (teacher, 2026-11-01: "slow down computer menus
// and menu pop ups, game play in general, so students can see it all").
// Normal is now unhurried; the Game speed setting can go slower or faster.
export function pace(s: Pick<PlayerSettings, 'gameSpeed'>): number {
  // Slower again (teacher, 2026-11-24: "slow everything down"): normal 2.2, slow 3, fast 1.4.
  return s.gameSpeed === 'slow' ? 3 : s.gameSpeed === 'fast' ? 1.4 : 2.2;
}

// The computer always thinks for a moment before it moves, so the class can
// follow its turn (teacher, 2026-11-24).
export const CPU_THINK_MS = 2500;

// A gentle, easy-to-follow entrance for pop-ups and menus.
export const POP_IN = { type: 'spring', stiffness: 110, damping: 18, mass: 1.1 } as const;
