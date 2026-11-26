import { describe, expect, it } from 'vitest';
import { classicTheme } from '../theme/classic';
import type { GameTheme } from '../theme/types';
import { GAMES } from './registry';
import { showcaseThemes } from './scenes';

const made = (over: Partial<GameTheme>): GameTheme => ({ ...classicTheme('bowling'), id: 'custom:x', name: 'Space Lanes', source: 'custom', ...over });

describe('showcaseThemes (the Features page game pictures)', () => {
  it('starts every listed game on Classic', () => {
    for (const g of GAMES) expect(showcaseThemes(g.id)[0]).toMatchObject({ kind: 'classic', theme: { id: `${g.id}:classic` } });
  });
  it('adds Gamify library themes and labeled samples after Classic', () => {
    const four = showcaseThemes('four-in-a-row');
    expect(four.map((l) => l.kind)).toEqual(['classic', 'gamify', 'sample']);
    expect(showcaseThemes('game-show').filter((l) => l.kind === 'sample').map((l) => l.theme.name)).toEqual(['Ocean Friends', 'Jungle Quest', 'Night Arcade', 'Clean Slate']);
  });
  it('lets a theme made in the Theme Builder join its own game only, labeled by who made it', () => {
    const mine = made({});
    const shared = made({ id: 'custom:y', gallery: { status: 'approved', at: '2026-11-26' } });
    const library = made({ id: 'lib:z', source: 'library' });
    const looks = showcaseThemes('bowling', [mine, shared, library, { ...mine, id: 'custom:other', gameId: 'match-three' }]);
    expect(looks.map((l) => [l.theme.id, l.kind])).toEqual([['bowling:classic', 'classic'], ['custom:x', 'yours'], ['custom:y', 'shared'], ['lib:z', 'gamify']]);
  });
  it('never lists a theme twice', () => {
    const looks = showcaseThemes('bowling', [made({}), made({})]);
    expect(new Set(looks.map((l) => l.theme.id)).size).toBe(looks.length);
  });
});
