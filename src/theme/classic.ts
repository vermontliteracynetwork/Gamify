import { getGame } from '../games/registry';
import type { GameTheme } from './types';

// The free house look: deliberately simple (development plan Part 2). Flat
// brand colors, no artwork, so library themes and class-made themes stand
// out. Each game gets its own copy because themes are per game.
export function classicTheme(gameId: string): GameTheme {
  // Question Tracker's Classic look is a night sky (teacher, 2026-10-24).
  const night = gameId === 'star-quiz';
  // Bowling's Classic look is a retro 80s bowling-alley carpet (teacher, 2026-10-31).
  const alley = gameId === 'bowling';
  // Game Show's Classic stage is red (teacher, 2026-11-01).
  const show = gameId === 'game-show';
  // Pinball's Classic page is the table's own navy (teacher, 2026-11-13).
  const pin = gameId === 'pinball';
  return {
    id: `${gameId}:classic`,
    gameId,
    name: 'Classic',
    source: 'house',
    colors: {
      background: night ? '#22336e' : alley ? '#07070f' : show ? '#c8282f' : pin ? '#25365f' : '#b4c4fb',
      backgroundText: night || alley || show || pin ? '#ffffff' : '#000000',
      surface: '#fbfcf8',
      text: '#000000',
      accent: '#fdfd94',
      accentText: '#000000',
      success: '#1f7a45',
      miss: '#9b2c3a',
    },
    fonts: { display: 'Grow Year', body: 'Inclusive Sans' },
    backdrop: alley ? { kind: 'image', src: '/classic/bowling/carpet.svg', alt: 'A retro bowling alley carpet with neon shapes', tile: true } : { kind: 'color' },
    celebration: 'confetti',
    // Question Tracker's Classic art is the teacher's own (2026-10-31): a
    // painted night sky and six hand-drawn stars. Seen in the game and the
    // theme guide only, never handed out.
    pieces: night ? {
      background: { image: '/classic/star-quiz/background.webp' },
      ...Object.fromEntries([1, 2, 3, 4, 5, 6].map((n) => [`item-${n}`, { image: `/classic/star-quiz/item-${n}.webp` }])),
    } : {},
    // Every power-up the game can do, in its Classic look (teacher, 2026-10-26).
    ...(getGame(gameId)?.items && { items: getGame(gameId)!.items!.classic.map((it) => ({ ...it })) }),
  };
}
