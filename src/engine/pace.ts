import type { PlayerSettings } from '../settings/settings';

// How slowly the games move (teacher, 2026-11-01: "slow down computer menus
// and menu pop ups, game play in general, so students can see it all").
// Normal is now unhurried; the Game speed setting can go slower or faster.
export function pace(s: Pick<PlayerSettings, 'gameSpeed'>): number {
  const test = testPace();
  if (test) return test;
  // Slower again (teacher, 2026-11-24: "slow everything down"): normal 2.2, slow 3, fast 1.4.
  return s.gameSpeed === 'slow' ? 3 : s.gameSpeed === 'fast' ? 1.4 : 2.2;
}

// Test runs only: the e2e sign-in state (e2e/teacher-session.json) sets this
// key so the suite plays the same games at a quicker pace and fits CI. The app
// never sets it, so classrooms always get the setting above.
function testPace(): number {
  try { return Number(localStorage.getItem('gamify:e2e-pace')) || 0; } catch { return 0; }
}

// The computer always thinks for a moment before it moves, so the class can
// follow its turn (teacher, 2026-11-24).
export const CPU_THINK_MS = 2500;

// A gentle, easy-to-follow entrance for pop-ups and menus.
export const POP_IN = { type: 'spring', stiffness: 110, damping: 18, mass: 1.1 } as const;
