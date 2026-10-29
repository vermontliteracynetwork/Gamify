import { classicTheme } from './classic';
import type { GameTheme } from './types';

// Starter themes by Gamify (teacher, 2026-10-25): simple looks that show how
// one game can suit different ages and interests. They play like library
// themes (Plus and Pro) and fill the public showcase until class-made and
// challenge themes arrive after launch. No made-up play counts or ratings.
export type Band = 'all' | 'k2' | '35' | '68' | 'adult';
export interface StarterTheme { id: string; name: string; gameId: string; band: Band; interest: string; order: number; theme: GameTheme }

function sample(id: string, name: string, gameId: string, band: Band, interest: string, order: number, change: (b: GameTheme) => Partial<GameTheme>): StarterTheme {
  const base = classicTheme(gameId);
  const extra = change(base);
  return { id, name, gameId, band, interest, order, theme: { ...base, ...extra, colors: { ...base.colors, ...extra.colors }, fonts: { ...base.fonts, ...extra.fonts }, id: `starter:${id}`, name, source: 'library', designedBy: 'Gamify' } };
}

export const STARTER_THEMES: StarterTheme[] = [
  sample('classic', 'Classic', 'game-show', 'all', 'Simple', 6, () => ({})),
  sample('ocean', 'Ocean Friends', 'game-show', 'k2', 'Animals', 1, () => ({ colors: { background: '#7cc8f0', accent: '#fff3a6' } as GameTheme['colors'], backdrop: { kind: 'pattern', pattern: 'waves' }, fonts: { display: 'Rounded' } as GameTheme['fonts'], pieces: { 'card-back': { color: '#fff3a6' }, square: { color: '#c9f0ff' } } })),
  sample('jungle', 'Jungle Quest', 'game-show', '35', 'Adventure', 2, () => ({ colors: { background: '#5fae6e', accent: '#ffd166' } as GameTheme['colors'], backdrop: { kind: 'pattern', pattern: 'dots' }, fonts: { display: 'Storybook' } as GameTheme['fonts'], pieces: { 'card-back': { color: '#ffd166' }, square: { color: '#e3f6c8' } } })),
  sample('arcade', 'Night Arcade', 'game-show', '68', 'Video games', 3, () => ({ colors: { background: '#2b2462', backgroundText: '#ffffff', accent: '#ff7ad9', accentText: '#000000' } as GameTheme['colors'], backdrop: { kind: 'pattern', pattern: 'checks' }, fonts: { display: 'Typewriter' } as GameTheme['fonts'], pieces: { 'card-back': { color: '#7af0ff' }, square: { color: '#ff7ad9' } } })),
  sample('slate', 'Clean Slate', 'game-show', 'adult', 'Calm', 8, () => ({ colors: { background: '#e9e6df', accent: '#ffffff' } as GameTheme['colors'], fonts: { display: 'Inclusive Sans' } as GameTheme['fonts'], pieces: { 'card-back': { color: '#ffffff' }, square: { color: '#f4f1ea' } } })),
  sample('candy', 'Candy Shop', 'match-three', 'k2', 'Sweets', 4, () => ({ colors: { background: '#f9c6e0', accent: '#fff3a6' } as GameTheme['colors'], backdrop: { kind: 'pattern', pattern: 'stripes' }, fonts: { display: 'Rounded' } as GameTheme['fonts'], pieces: { board: { color: '#fff7fb' } } })),
  sample('sports', 'Game Day', 'four-in-a-row', '68', 'Sports', 5, () => ({ colors: { background: '#24663a', backgroundText: '#ffffff', accent: '#ffffff' } as GameTheme['colors'], backdrop: { kind: 'pattern', pattern: 'stripes' }, pieces: { board: { color: '#1e3a8a' }, 'piece-1': { color: '#f97316' }, 'piece-2': { color: '#ffffff' } } })),
  sample('space', 'Deep Space', 'star-quiz', '35', 'Space', 7, () => ({ colors: { background: '#120f3a', backgroundText: '#ffffff' } as GameTheme['colors'], backdrop: { kind: 'pattern', pattern: 'dots' }, pieces: { star: { color: '#7af0ff' } } })),
];

export const BANDS: Band[] = ['all', 'k2', '35', '68', 'adult'];

// Games wear only Classic for now (teacher, 2026-10-29: "put only the
// classic theme on now for every game ... none other have been designed").
// The starters stay as labeled samples on the public showcase pages; turn
// this on again once real Gamify themes are designed.
export const STARTERS_IN_GAMES = false;

// The starter themes a game can wear (Classic is added by themesFor).
export const startersFor = (gameId: string) => (STARTERS_IN_GAMES ? STARTER_THEMES.filter((x) => x.gameId === gameId && x.id !== 'classic').map((x) => x.theme) : []);
