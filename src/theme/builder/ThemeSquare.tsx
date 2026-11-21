import ThemePreview from './ThemePreview';
import { backdropStyle, pieceImage } from '../library';
import type { GameTheme } from '../types';

// A theme's cover, always a 1:1 square (teacher, 2026-11-21: "always show
// theme covers as 1:1 square images in all places"). The theme's own Cover
// picture (600 x 600) when it has one; otherwise its whole game preview,
// never cut off (teacher, 2026-11-21: "every classic theme is showing the
// full game never cut off"), centered on the theme's own background.
export default function ThemeSquare({ theme, className = '' }: { theme: GameTheme; className?: string }) {
  const cover = theme.id.startsWith('blank-') ? undefined : pieceImage(theme, 'cover');
  return (
    <span className={`relative block aspect-square overflow-hidden rounded-panel border-bold border-border bg-white ${className}`}>
      {theme.id.startsWith('blank-') ? null : cover
        ? <img src={cover} alt="" className="absolute inset-0 w-full h-full object-cover" draggable="false" />
        // The game preview itself drawn square, so its own background fills
        // the card edge to edge and the whole board fits inside.
        : <span className="absolute inset-0 pointer-events-none [&>*]:!aspect-square [&>*]:!w-full [&>*]:!h-full [&>*]:!rounded-none [&>*]:!border-0" style={backdropStyle(theme, false)} aria-hidden="true"><ThemePreview theme={theme} /></span>}
    </span>
  );
}
