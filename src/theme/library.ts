import { classicTheme } from './classic';
import type { GameTheme } from './types';

// Simple library themes, built from code (no bought art), one copy per game
// because themes are per game. Each game reads only the pieces it declares.

type PieceColors = Record<string, string>;

const SPACE_PIECES: Record<string, PieceColors> = {
  'bakery-match': { board: '#1d1b4f', 'tile-0': '#ffd166', 'tile-1': '#ef7dc4', 'tile-2': '#7ad3f5', 'tile-3': '#f7a072', 'tile-4': '#c3f584', 'tile-5': '#b9a3ff' },
  'four-in-a-row': { board: '#2b2a6b', 'piece-1': '#ffd166', 'piece-2': '#7ad3f5' },
  'game-show': { 'card-back': '#7ad3f5', square: '#b9a3ff' },
  'star-quiz': { star: '#ffd166' },
};
const GARDEN_PIECES: Record<string, PieceColors> = {
  'bakery-match': { board: '#e8f5d8', 'tile-0': '#f6c445', 'tile-1': '#f28fad', 'tile-2': '#8fd3c1', 'tile-3': '#f4a259', 'tile-4': '#b8e08a', 'tile-5': '#c8a2e8' },
  'four-in-a-row': { board: '#8cc47a', 'piece-1': '#f28fad', 'piece-2': '#f6c445' },
  'game-show': { 'card-back': '#b8e08a', square: '#f6c445' },
  'star-quiz': { star: '#f28fad' },
};

const asPieces = (colors: PieceColors = {}) => Object.fromEntries(Object.entries(colors).map(([k, color]) => [k, { color }]));

export function spaceTheme(gameId: string): GameTheme {
  return {
    id: `${gameId}:space`, gameId, name: 'Space', source: 'library',
    colors: { background: '#15143a', backgroundText: '#ffffff', surface: '#ffffff', text: '#1b1838', accent: '#ffd166', accentText: '#1b1838', success: '#1f7a45', miss: '#9b2c3a' },
    fonts: { display: 'Baloo 2', body: 'Inclusive Sans' },
    backdrop: { kind: 'pattern', pattern: 'dots' },
    celebration: 'stars',
    pieces: asPieces(SPACE_PIECES[gameId]),
  };
}

export function gardenTheme(gameId: string): GameTheme {
  return {
    id: `${gameId}:garden`, gameId, name: 'Garden', source: 'library',
    colors: { background: '#cfe9b8', backgroundText: '#22331b', surface: '#ffffff', text: '#22331b', accent: '#f6c445', accentText: '#22331b', success: '#1f7a45', miss: '#9b2c3a' },
    fonts: { display: 'Baloo 2', body: 'Inclusive Sans' },
    backdrop: { kind: 'pattern', pattern: 'checks' },
    celebration: 'bubbles',
    pieces: asPieces(GARDEN_PIECES[gameId]),
  };
}

export function themesFor(gameId: string): GameTheme[] {
  return [classicTheme(gameId), spaceTheme(gameId), gardenTheme(gameId)];
}

export function pieceColor(theme: GameTheme | undefined, piece: string, fallback: string): string {
  return theme?.pieces[piece]?.color ?? fallback;
}

// CSS for a theme's backdrop. Patterns are drawn with gradients (no files).
export function backdropStyle(theme: GameTheme, plain: boolean): React.CSSProperties {
  const bg = theme.colors.background;
  if (plain || theme.backdrop.kind === 'color') return { background: bg };
  if (theme.backdrop.kind === 'image') return { background: `${bg} center / cover no-repeat url("${theme.backdrop.src}")` };
  const ink = theme.backdrop.pattern === 'dots' ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.35)';
  switch (theme.backdrop.pattern) {
    case 'dots': return { backgroundColor: bg, backgroundImage: `radial-gradient(${ink} 1.5px, transparent 1.6px), radial-gradient(${ink} 1px, transparent 1.1px)`, backgroundSize: '46px 46px, 23px 23px', backgroundPosition: '0 0, 11px 17px' };
    case 'checks': return { backgroundColor: bg, backgroundImage: `linear-gradient(45deg, ${ink} 25%, transparent 25%, transparent 75%, ${ink} 75%), linear-gradient(45deg, ${ink} 25%, transparent 25%, transparent 75%, ${ink} 75%)`, backgroundSize: '48px 48px', backgroundPosition: '0 0, 24px 24px' };
    case 'stripes': return { backgroundColor: bg, backgroundImage: `repeating-linear-gradient(135deg, ${ink} 0 14px, transparent 14px 28px)` };
    case 'waves': return { backgroundColor: bg, backgroundImage: `radial-gradient(circle at 50% 120%, ${ink} 30%, transparent 31%)`, backgroundSize: '60px 30px' };
  }
}
