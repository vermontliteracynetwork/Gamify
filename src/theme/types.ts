// Themes are designed per game (teacher rule, 2026-10-24): each game declares
// the pieces a theme can design, and every theme belongs to one game.

export interface ThemeColors {
  background: string;
  // Text that sits straight on the background (titles, banners).
  backgroundText: string;
  surface: string;
  text: string;
  accent: string;
  accentText: string;
  success: string;
  miss: string;
}

// Title fonts a theme can pick. Grow Year and Inclusive Sans ship with
// Gamify (licenses in docs/asset-ledger.md); the others are fonts already on
// the device, so nothing is downloaded or licensed. Question and answer text
// always stays in Inclusive Sans.
export const THEME_FONTS = {
  'Grow Year': "'Grow Year', 'Segoe UI', system-ui, sans-serif",
  'Inclusive Sans': "'Inclusive Sans', 'Segoe UI', system-ui, sans-serif",
  Rounded: "ui-rounded, 'Arial Rounded MT Bold', 'Segoe UI', system-ui, sans-serif",
  Storybook: "Georgia, 'Times New Roman', serif",
  Typewriter: "ui-monospace, 'Courier New', monospace",
} as const;
export type FontName = keyof typeof THEME_FONTS;
export const APPROVED_FONTS = Object.keys(THEME_FONTS) as FontName[];

// Sound packs a theme can pick; every sound is made in code (no files).
export const SOUND_PACKS = ['classic', 'soft', 'chimes', 'bloops', 'zaps'] as const;
export type SoundPack = (typeof SOUND_PACKS)[number];

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
  // The Classic color a theme can change (pieces without one are art only).
  color?: string;
}

// Power-up items (teacher, 2026-10-26): things a game can make happen, like a
// boot that takes away 100 points or a rainbow fish worth 1000. Each game
// declares the abilities its code can do; a theme adds items with its own
// art and picks each item's ability, amount, motion and how often it shows.
export interface AbilitySpec {
  id: string;
  label: string;
  hint: string;
  // Abilities with a number (points, seconds) show a slider.
  amount?: { label: string; min: number; max: number; step: number; default: number };
}
export const ITEM_MOTIONS = ['wiggle', 'bob', 'sparkle', 'spin', 'none'] as const;
export type ItemMotion = (typeof ITEM_MOTIONS)[number];
// How often an item turns up: 1 rarely, 2 sometimes, 3 often.
export type ItemOften = 1 | 2 | 3;
export interface ItemSlotsSpec {
  label: string;
  hint: string;
  max: number;
  width: number;
  height: number;
  abilities: AbilitySpec[];
  // One Classic item per ability (Classic mode, the example pack, and the
  // example shown beside each ability in the Theme Builder).
  classic: ThemeItem[];
}
export interface ThemeItem {
  id: string;
  name: string;
  ability: string;
  amount?: number;
  motion: ItemMotion;
  often: ItemOften;
  image?: string;
  color?: string;
  // Classic art drawn in code (src/theme/classicItems.tsx), used until a
  // picture is added.
  art?: string;
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
  // Power-up items this theme adds (games that declare item abilities).
  items?: ThemeItem[];
  cover?: string;
  designedBy?: string;
  // Optional first name or nickname of the student who designed it.
  studentDesigner?: string;
  sounds?: SoundPack;
  // Sharing beyond the teacher's own classes (teacher, 2026-10-25): sent to
  // the public gallery, where the owner reviews it before anyone sees it.
  gallery?: { status: 'pending' | 'approved' | 'declined'; at: string; reason?: GalleryReason };
  // Entered in the Theme Building Challenge, in one of its two tracks
  // (teacher, 2026-10-26): drawn by hand (needs a signed permission slip for
  // each student artist) or built in the Theme Builder studio.
  challenge?: boolean;
  challengeTrack?: 'hand' | 'studio';
  permissionOnFile?: boolean;
}

export const GALLERY_REASONS = ['hard-to-read', 'brand', 'unfinished', 'other'] as const;
export type GalleryReason = (typeof GALLERY_REASONS)[number];
