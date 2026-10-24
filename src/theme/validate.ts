import { meetsAA } from './contrast';
import type { GameTheme } from './types';

// The Theme Builder refuses themes that fail these (product plan section 4).
export function themeProblems(theme: GameTheme): string[] {
  const c = theme.colors;
  const pairs: [string, string, string][] = [
    ['Text on the background', c.backgroundText, c.background],
    ['Text on panels', c.text, c.surface],
    ['Button text on the main color', c.accentText, c.accent],
  ];
  const problems = pairs.filter(([, fg, bg]) => !meetsAA(fg, bg)).map(([label]) => `${label} is too hard to read. Pick colors with more contrast.`);
  if (theme.backdrop.kind === 'image' && !theme.backdrop.alt.trim()) problems.push('The background picture needs a short description.');
  return problems;
}

// Calm mode version of any theme: still backdrop, gentle celebration.
// Motion and sound are calmed by the settings layer, not the theme.
export function calmVersion(theme: GameTheme): GameTheme {
  return {
    ...theme,
    backdrop: theme.backdrop.kind === 'pattern' ? { kind: 'color' } : theme.backdrop,
    celebration: 'gentle',
  };
}

// CSS custom properties for a game stage, e.g. style={themeStyle(theme)}.
export function themeStyle(theme: GameTheme): Record<string, string> {
  const c = theme.colors;
  return {
    '--stage-bg': c.background,
    '--stage-surface': c.surface,
    '--stage-text': c.text,
    '--stage-bg-text': c.backgroundText,
    '--stage-accent': c.accent,
    '--stage-accent-text': c.accentText,
    '--stage-success': c.success,
    '--stage-miss': c.miss,
    '--stage-font-display': `'${theme.fonts.display}', system-ui, sans-serif`,
    '--stage-font-body': `'${theme.fonts.body}', system-ui, sans-serif`,
  };
}
