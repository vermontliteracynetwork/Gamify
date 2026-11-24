import { getGame } from '../games/registry';
import type { GameTheme } from './types';

// The free house look: deliberately simple (development plan Part 2). Flat
// brand colors, no artwork, so library themes and class-made themes stand
// out. Each game gets its own copy because themes are per game.
export function classicTheme(gameId: string): GameTheme {
  // Question Tracker's Classic look is a night sky (teacher, 2026-10-24).
  const night = gameId === 'star-quiz';
  // Bowling's Classic alley (teacher, 2026-11-24 redesign): a Lavender floor
  // under the cream confetti wall the game draws (was the 80s carpet).
  const alley = gameId === 'bowling';
  // Game Show's Classic stage was red (teacher, 2026-11-01); the approved studio
  // mockup (2026-11-24) puts it on Grape behind pink curtains (src/games/game-show/studio.tsx).
  const show = gameId === 'game-show';
  // Pinball's Classic page is the table's own navy (teacher, 2026-11-13).
  const pin = gameId === 'pinball';
  // Bubble Pop's Classic stage is the cream doodle scatter of the approved
  // mockup (owner, 2026-11-24: /brand Game mockups, Bubble Pop).
  const doodle = gameId === 'bubble-pop';
  // Four in a Row's Classic stage is cream with pastel squiggles (approved mockup, 2026-11-24).
  const four = gameId === 'four-in-a-row';
  return {
    id: `${gameId}:classic`,
    gameId,
    name: 'Classic',
    source: 'house',
    colors: {
      background: night ? '#22336e' : alley ? '#ddd6ff' : show ? '#6a45f0' : pin ? '#25365f' : doodle || four ? '#f6f0e4' : '#b4c4fb',
      backgroundText: night || show || pin ? '#ffffff' : alley ? '#1d1a33' : '#000000',
      surface: '#fbfcf8',
      text: '#000000',
      accent: '#fdfd94',
      accentText: '#000000',
      success: '#1f7a45',
      miss: '#9b2c3a',
    },
    fonts: { display: 'Grow Year', body: 'Inclusive Sans' },
    backdrop: doodle ? { kind: 'image', src: '/classic/bubble-pop/doodle.svg', alt: 'Pastel doodle shapes on cream', tile: true }
      : four ? { kind: 'image', src: '/classic/four-in-a-row/squiggles.svg', alt: 'Pastel squiggles and flowers on cream', tile: true } : { kind: 'color' },
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
