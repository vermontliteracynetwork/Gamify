import { describe, expect, it } from 'vitest';
import { classicTheme } from '../../theme/classic';
import { STARTER_THEMES } from '../../theme/starters';
import { CLASSIC_STUDIO, studioLook } from './studio';

const starter = (id: string) => STARTER_THEMES.find((s) => s.gameId === 'game-show' && s.id === id)!.theme;

describe('Game Show studio look', () => {
  it('Classic wears the approved studio colors', () => {
    expect(studioLook(classicTheme('game-show'))).toBe(CLASSIC_STUDIO);
  });
  it('a theme draws the studio from its own colors and backdrop', () => {
    const ocean = studioLook(starter('ocean'));
    expect(ocean.back).toBe('#7cc8f0');
    expect(ocean.curtain).toBe('#fff3a6');
    expect(ocean.ground).toBeTruthy();
  });
  it('a dark ground gets a palette pastel spotlight, never a grey', () => {
    expect(studioLook(starter('arcade')).beam).toBe('#ddd6ff');
  });
  it('Classic colors the theme left alone stay Classic, unless they would vanish', () => {
    const base = classicTheme('game-show');
    const mint = studioLook({ ...base, colors: { ...base.colors, background: '#c8f0dc' } });
    expect(mint.curtain).toBe(CLASSIC_STUDIO.curtain);
    const pinkCards = studioLook({ ...base, colors: { ...base.colors, background: '#c8f0dc' }, pieces: { 'card-back': { color: '#f055a5' } } });
    expect(pinkCards.curtain).not.toBe('#f055a5');
  });
  it('the teacher\'s own stage color wins over the theme background', () => {
    const look = studioLook(starter('jungle'), '#22336e');
    expect(look.back).toBe('#22336e');
    expect(look.ground).toBeUndefined();
  });
});
