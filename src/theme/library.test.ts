import { describe, expect, it } from 'vitest';
import { ALL_GAMES as GAMES } from '../games/registry';
import { classicTheme } from './classic';
import { pieceFill, themesFor } from './library';
import { STARTER_THEMES } from './starters';
import { themeProblems } from './validate';

describe('game themes', () => {
  it('every game wears only Classic for now, and it passes readability checks', () => {
    for (const g of GAMES) {
      const themes = themesFor(g.id);
      expect(themes.map((t) => t.name)).toEqual(['Classic']);
      expect(themeProblems(themes[0])).toEqual([]);
    }
  });
  it('the starter samples still pass readability checks, for when they come back', () => {
    for (const x of STARTER_THEMES) expect([x.name, themeProblems(x.theme)]).toEqual([x.name, []]);
  });
  it('adds only the made themes for that game', () => {
    const made = { ...classicTheme('match-three'), id: 'x', name: 'Ours', source: 'custom' as const };
    expect(themesFor('match-three', [made]).map((t) => t.name).slice(0, 2)).toEqual(['Classic', 'Ours']);
    expect(themesFor('game-show', [made]).map((t) => t.name)).not.toContain('Ours');
  });
  it('fills a piece with its picture over its color', () => {
    const th = { ...classicTheme('star-quiz'), pieces: { star: { color: '#ff0000', image: 'data:x' } } };
    expect(pieceFill(th, 'star', '#000').background).toBe('#ff0000 center / cover no-repeat url("data:x")');
    expect(pieceFill(th, 'other', '#000').background).toBe('#000');
  });
});
