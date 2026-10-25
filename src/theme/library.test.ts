import { describe, expect, it } from 'vitest';
import { GAMES } from '../games/registry';
import { classicTheme } from './classic';
import { pieceFill, themesFor } from './library';
import { themeProblems } from './validate';

describe('game themes', () => {
  it('every game starts on Classic, plus its starter themes, and every one passes readability checks', () => {
    for (const g of GAMES) {
      const themes = themesFor(g.id);
      expect(themes[0].name).toBe('Classic');
      expect(themes.slice(1).every((t) => t.source === 'library' && t.designedBy === 'Gamify')).toBe(true);
      for (const th of themes) expect([th.name, themeProblems(th)]).toEqual([th.name, []]);
    }
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
