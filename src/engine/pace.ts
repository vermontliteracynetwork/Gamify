import type { PlayerSettings } from '../settings/settings';

// How slowly the games move (teacher, 2026-11-01: "slow down computer menus
// and menu pop ups, game play in general, so students can see it all").
// Normal is now unhurried; the Game speed setting can go slower or faster.
export function pace(s: Pick<PlayerSettings, 'gameSpeed'>): number {
  return s.gameSpeed === 'slow' ? 2.2 : s.gameSpeed === 'fast' ? 1 : 1.6;
}

// A gentle, easy-to-follow entrance for pop-ups and menus.
export const POP_IN = { type: 'spring', stiffness: 170, damping: 20, mass: 1.1 } as const;
