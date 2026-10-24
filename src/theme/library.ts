import { classicTheme } from './classic';
import type { GameTheme } from './types';

// Every game plays Classic for now (teacher call, 2026-10-24); other themes
// come only from the Theme Builder: the teacher's own designs and library
// themes made in the owner's developer view.
export function themesFor(gameId: string, made: GameTheme[] = []): GameTheme[] {
  return [classicTheme(gameId), ...made.filter((th) => th.gameId === gameId)];
}

export function pieceColor(theme: GameTheme | undefined, piece: string, fallback: string): string {
  return theme?.pieces[piece]?.color ?? fallback;
}

export function pieceImage(theme: GameTheme | undefined, piece: string): string | undefined {
  return theme?.pieces[piece]?.image;
}

// Background for a designed piece: its artwork over its color, or the color.
export function pieceFill(theme: GameTheme | undefined, piece: string, fallback: string): React.CSSProperties {
  const color = pieceColor(theme, piece, fallback);
  const image = pieceImage(theme, piece);
  return { background: image ? `${color} center / cover no-repeat url("${image}")` : color };
}

// CSS for a theme's backdrop. Patterns are drawn with gradients (no files).
export function backdropStyle(theme: GameTheme, plain: boolean): React.CSSProperties {
  const bg = theme.colors.background;
  if (plain || theme.backdrop.kind === 'color') return { background: bg };
  if (theme.backdrop.kind === 'image') return { background: `${bg} center / cover no-repeat url("${theme.backdrop.src}")` };
  const ink = theme.backdrop.pattern === 'dots' ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.35)';
  switch (theme.backdrop.pattern) {
    case 'dots': return { backgroundColor: bg, backgroundImage: `radial-gradient(${ink} 1.5px, transparent 1.6px), radial-gradient(${ink} 1px, transparent 1.1px)`, backgroundSize: '46px 46px, 23px 23px', backgroundPosition: '0 0, 11px 17px' };
    case 'checks': return { backgroundColor: bg, backgroundImage: `linear-gradient(45deg, ${ink} 25%, transparent 25%, transparent 75%, ${ink} 75%), linear-gradient(45deg, ${ink} 25%, transparent 25%, transparent 75%, ${ink} 75%)`, backgroundSize: '48px 48px', backgroundPosition: '0 0, 24px 24px' };
    case 'stripes': return { backgroundColor: bg, backgroundImage: `repeating-linear-gradient(135deg, ${ink} 0 14px, transparent 14px 28px)` };
    case 'waves': return { backgroundColor: bg, backgroundImage: `radial-gradient(circle at 50% 120%, ${ink} 30%, transparent 31%)`, backgroundSize: '60px 30px' };
  }
}
