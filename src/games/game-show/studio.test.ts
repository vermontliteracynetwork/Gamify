import { describe, expect, it } from 'vitest';
import { classicTheme } from '../../theme/classic';
import { STARTER_THEMES } from '../../theme/starters';
import { apart, CLASSIC_STUDIO, CLEAR, PAIRS, studioLook, type StudioLook } from './studio';

const starter = (id: string) => STARTER_THEMES.find((s) => s.gameId === 'game-show' && s.id === id)!.theme;
const PALETTE = new Set([...PAIRS.flat(), '#1d1a33', '#f6f0e4', '#fffaf0']);
// The colors the studio adds itself (not the theme's own background, accent or floor).
const added = (l: StudioLook) => [l.beam, l.boards, l.rim, l.rimShadow, l.inner, l.bulbA, l.bulbB, l.dash, l.tie];

describe('Game Show studio look', () => {
  it('Classic wears the approved studio colors', () => {
    expect(studioLook(classicTheme('game-show'))).toBe(CLASSIC_STUDIO);
  });
  it('Classic stays Classic with a teacher stage color: only the backdrop changes', () => {
    const navy = studioLook(classicTheme('game-show'), '#22336e');
    expect(navy).toEqual({ ...CLASSIC_STUDIO, back: '#22336e' });
    const lilac = studioLook(classicTheme('game-show'), '#ddd6ff');
    expect(lilac).toEqual({ ...CLASSIC_STUDIO, back: '#ddd6ff', beam: '#fffaf0', inner: '#fffaf0' });
  });
  it('a theme draws the studio from its own colors and backdrop', () => {
    const ocean = studioLook(starter('ocean'));
    expect(ocean.back).toBe('#7cc8f0');
    expect(ocean.curtain).toBe('#fff3a6');
    expect(ocean.ground).toBeTruthy();
  });
  it('every color the studio adds is a palette color, never a blend', () => {
    for (const s of STARTER_THEMES.filter((x) => x.gameId === 'game-show')) {
      for (const c of added(studioLook(s.theme))) expect(PALETTE.has(c.toLowerCase()), `${s.id}: ${c}`).toBe(true);
      for (const c of added(studioLook(s.theme, '#22b04a'))) expect(PALETTE.has(c.toLowerCase()), `${s.id} stage: ${c}`).toBe(true);
    }
  });
  it('the rim stands apart from a dark or bright backdrop, and its shadow is Ink', () => {
    for (const id of ['arcade', 'slate', 'jungle']) {
      const l = studioLook(starter(id));
      expect(apart(l.rim, l.back)).toBeGreaterThanOrEqual(CLEAR);
      expect(l.rimShadow).toBe('#1d1a33');
    }
  });
  it('a dark ground gets a palette pastel spotlight, never a grey', () => {
    expect(studioLook(starter('arcade')).beam).toBe('#ddd6ff');
  });
  it('spotlights are opaque and off over a picture, which shows in the open stage', () => {
    const base = classicTheme('game-show');
    const pic = studioLook({ ...base, id: 'mine', backdrop: { kind: 'image', src: '/x.png', alt: 'A drawing' } });
    expect(pic.beams).toBe(false);
    expect(pic.picture?.backgroundPosition).toBe('center 35%');
  });
  it('Classic colors the theme left alone stay Classic, unless they would vanish', () => {
    const base = { ...classicTheme('game-show'), id: 'mine' };
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
  it('a blank draft built from Classic colors is the Classic studio (Art Director 2026-11-26)', () => {
    const l = studioLook({ ...classicTheme('game-show'), id: 'draft-1' });
    for (const k of ['rim', 'beam', 'curtain', 'floor', 'boards'] as const) expect(l[k]).toBe(CLASSIC_STUDIO[k]);
  });
});
