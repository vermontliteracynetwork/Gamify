import type { GameTheme } from './types';

// The free house look: deliberately simple (development plan Part 2). Flat
// brand colors, no artwork, so library themes and class-made themes stand
// out. Each game gets its own copy because themes are per game.
export function classicTheme(gameId: string): GameTheme {
  // Question Tracker's Classic look is a night sky (teacher, 2026-10-24).
  const night = gameId === 'star-quiz';
  return {
    id: `${gameId}:classic`,
    gameId,
    name: 'Classic',
    source: 'house',
    colors: {
      background: night ? '#22336e' : '#b4c4fb',
      backgroundText: night ? '#ffffff' : '#000000',
      surface: '#fbfcf8',
      text: '#000000',
      accent: '#fdfd94',
      accentText: '#000000',
      success: '#1f7a45',
      miss: '#9b2c3a',
    },
    fonts: { display: 'Grow Year', body: 'Inclusive Sans' },
    backdrop: { kind: 'color' },
    celebration: 'confetti',
    pieces: {},
  };
}
