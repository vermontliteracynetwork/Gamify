import { classicTheme } from './classic';
import type { GameTheme } from './types';

// Themes designed by Gamify from licensed art packs (teacher, 2026-10-31).
// They play like library themes (Plus and Pro) and are offered on each
// game's theme step next to Classic. Every pack is in docs/asset-ledger.md.
function house(gameId: string, id: string, name: string, change: (base: GameTheme) => Partial<GameTheme>): GameTheme {
  const base = classicTheme(gameId);
  const extra = change(base);
  return { ...base, ...extra, colors: { ...base.colors, ...extra.colors }, fonts: { ...base.fonts, ...extra.fonts }, pieces: { ...base.pieces, ...extra.pieces }, id: `house:${id}`, name, source: 'library', designedBy: 'Gamify' };
}

const ANIMALS = ['panda', 'penguin', 'monkey', 'elephant', 'giraffe', 'hippo', 'parrot', 'pig', 'rabbit', 'snake'];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const HOUSE_THEMES: GameTheme[] = [
  // Four in a Row: Animal Friends, ten round animals from Kenney's Animal Pack (CC0).
  house('four-in-a-row', 'animal-friends', 'Animal Friends', () => ({
    colors: { background: '#9fd88a' } as GameTheme['colors'],
    backdrop: { kind: 'pattern', pattern: 'dots' },
    pieces: { board: { color: '#f7d488' } },
    discs: ANIMALS.map((a) => ({ id: a, name: cap(a), image: `/themes/animals/${a}.webp` })),
  })),
];

export const houseFor = (gameId: string) => HOUSE_THEMES.filter((th) => th.gameId === gameId);
