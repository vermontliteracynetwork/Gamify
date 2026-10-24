import { describe, expect, it } from 'vitest';
import { GAMES } from '../games/registry';
import { classicTheme } from './classic';
import { pieceFill, themesFor } from './library';
import { themeProblems } from './validate';

describe('game themes', () => {
  it('every game plays only Classic until a theme is made, and Classic passes readability checks', () => {
    for (const g of GAMES) {
      const themes = themesFor(g.id);
      expect(themes.map((t) => t.name)).toEqual(['Classic']);
      expect(themeProblems(themes[0])).toEqual([]);
    }
  });
  it('adds only the made themes for that game', () => {
    const made = { ...classicTheme('bakery-match'), id: 'x', name: 'Ours', source: 'custom' as const };
    expect(themesFor('bakery-match', [made]).map((t) => t.name)).toEqual(['Classic', 'Ours']);
    expect(themesFor('game-show', [made]).map((t) => t.name)).toEqual(['Classic']);
  });
  it('fills a piece with its picture over its color', () => {
    const th = { ...classicTheme('star-quiz'), pieces: { star: { color: '#ff0000', image: 'data:x' } } };
    expect(pieceFill(th, 'star', '#000').background).toBe('#ff0000 center / cover no-repeat url("data:x")');
    expect(pieceFill(th, 'other', '#000').background).toBe('#000');
  });
});
