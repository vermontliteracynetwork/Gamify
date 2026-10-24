// Themes are designed per game (teacher rule, 2026-10-24): each game declares
// the pieces a theme can design, and every theme belongs to one game.

export interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  accent: string;
  accentText: string;
  success: string;
  miss: string;
}

// Only fonts with a commercial license recorded in docs/asset-ledger.md.
export const APPROVED_FONTS = ['Baloo 2', 'Nunito'] as const;
export type FontName = (typeof APPROVED_FONTS)[number];

export type Backdrop =
  | { kind: 'color' }
  | { kind: 'pattern'; pattern: 'dots' | 'stripes' | 'waves' | 'checks' }
  | { kind: 'image'; src: string; alt: string };

export type Celebration = 'confetti' | 'stars' | 'bubbles' | 'gentle';

// A designable piece a game declares, e.g. Peg Drop's "ball" at 96x96.
// Sizes drive the printable theme template and the Theme Builder cards.
export interface ThemePieceSpec {
  id: string;
  label: string;
  width: number;
  height: number;
  // Shown on the template so students know what they're drawing.
  hint: string;
}

// What a theme puts in a piece: a flat color (house themes) or artwork.
export interface PieceArt {
  color?: string;
  image?: string;
  alt?: string;
}

export interface GameTheme {
  id: string;
  gameId: string;
  name: string;
  source: 'house' | 'library' | 'custom';
  colors: ThemeColors;
  fonts: { display: FontName; body: FontName };
  backdrop: Backdrop;
  celebration: Celebration;
  pieces: Record<string, PieceArt>;
  cover?: string;
  designedBy?: string;
}
