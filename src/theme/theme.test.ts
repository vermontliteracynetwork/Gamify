import { describe, expect, it } from 'vitest';
import { contrastRatio, meetsAA } from './contrast';
import { classicTheme } from './classic';
import { calmVersion, themeProblems, themeStyle } from './validate';

describe('contrast', () => {
  it('black on white is 21:1', () => expect(contrastRatio('#000', '#ffffff')).toBeCloseTo(21, 0));
  it('light gray on white fails AA', () => expect(meetsAA('#cccccc', '#ffffff')).toBe(false));
});

describe('themes', () => {
  it('Classic passes every readability check', () => expect(themeProblems(classicTheme('peg-drop'))).toEqual([]));

  it('flags unreadable colors', () => {
    const t = classicTheme('peg-drop');
    expect(themeProblems({ ...t, colors: { ...t.colors, text: '#cfc8e8' } })).toHaveLength(2);
  });

  it('calm version keeps colors and quiets the backdrop and celebration', () => {
    const t = { ...classicTheme('peg-drop'), backdrop: { kind: 'pattern' as const, pattern: 'dots' as const } };
    const calm = calmVersion(t);
    expect(calm.backdrop).toEqual({ kind: 'color' });
    expect(calm.celebration).toBe('gentle');
    expect(calm.colors).toEqual(t.colors);
  });

  it('themes belong to one game', () => expect(classicTheme('match-up').gameId).toBe('match-up'));

  it('exposes stage CSS variables', () => expect(themeStyle(classicTheme('x'))['--stage-accent']).toBe('#fbdb6b'));
});
