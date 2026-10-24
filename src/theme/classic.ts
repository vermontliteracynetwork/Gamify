import type { GameTheme } from './types';

// The free house look: deliberately simple (development plan Part 2). Flat
// brand colors, no artwork, so library themes and class-made themes stand
// out. Each game gets its own copy because themes are per game.
export function classicTheme(gameId: string): GameTheme {
  return {
    id: `${gameId}:classic`,
    gameId,
    name: 'Classic',
    source: 'house',
    colors: {
      background: '#b9a9ec',
      backgroundText: '#241c3d',
      surface: '#ffffff',
      text: '#241c3d',
      accent: '#fbdb6b',
      accentText: '#241c3d',
      success: '#1f7a45',
      miss: '#9b2c3a',
    },
    fonts: { display: 'Baloo 2', body: 'Nunito' },
    backdrop: { kind: 'color' },
    celebration: 'confetti',
    pieces: {},
  };
}
