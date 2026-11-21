import ThemePreview from './ThemePreview';
import { backdropStyle, pieceImage } from '../library';
import type { GameTheme } from '../types';

// One way to show a theme (teacher, 2026-11-21: "i need more syncronisity in
// the classic themes and how they are presented"): the game preview itself,
// drawn to fill whatever box it sits in, with its own background edge to
// edge and the whole game inside, never cut off. Game cards, theme covers,
// the theme picker and the Theme Builder all show this same picture.
export function ThemeArt({ theme, className = '' }: { theme: GameTheme; className?: string }) {
  return (
    // A picture, not text: screen readers hear its name once, and the tiny
    // labels drawn inside the little game are part of the picture.
    <span className={`relative block overflow-hidden ${className}`} style={backdropStyle(theme, false)} role="img" aria-label={theme.name || 'Classic'} data-art="">
      <span className="absolute inset-0 pointer-events-none [&>*]:!aspect-auto [&>*]:!w-full [&>*]:!h-full [&>*]:!rounded-none [&>*]:!border-0" aria-hidden="true"><ThemePreview theme={theme} /></span>
    </span>
  );
}

// A theme's cover, always a 1:1 square (teacher, 2026-11-21: "always show
// theme covers as 1:1 square images in all places"). The theme's own Cover
// picture (600 x 600) when it has one; otherwise its whole game, never cut
// off ("every classic theme is showing the full game never cut off").
export default function ThemeSquare({ theme, className = '' }: { theme: GameTheme; className?: string }) {
  const blank = theme.id.startsWith('blank-');
  const cover = blank ? undefined : pieceImage(theme, 'cover');
  if (blank) return <span className={`block aspect-square rounded-panel border-bold border-border bg-white ${className}`} />;
  if (cover) return <span className={`relative block aspect-square overflow-hidden rounded-panel border-bold border-border bg-white ${className}`}><img src={cover} alt="" className="absolute inset-0 w-full h-full object-cover" draggable="false" /></span>;
  return <ThemeArt theme={theme} className={`aspect-square rounded-panel border-bold border-border ${className}`} />;
}
