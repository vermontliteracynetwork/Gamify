import { describe, expect, it } from 'vitest';
import { GAMES } from '../games/registry';
import { themesFor } from './library';
import { themeProblems } from './validate';

describe('library themes', () => {
  it('every game gets Classic, Space and Garden, and all pass readability checks', () => {
    for (const g of GAMES) {
      const themes = themesFor(g.id);
      expect(themes.map((t) => t.name)).toEqual(['Classic', 'Space', 'Garden']);
      for (const th of themes) {
        expect(th.gameId).toBe(g.id);
        expect(themeProblems(th)).toEqual([]);
      }
    }
  });
  it('library themes only color pieces the game declares', () => {
    for (const g of GAMES) {
      const declared = new Set(g.themePieces.map((p) => p.id));
      for (const th of themesFor(g.id)) for (const piece of Object.keys(th.pieces)) expect([g.id, piece, declared.has(piece)]).toEqual([g.id, piece, true]);
    }
  });
});
