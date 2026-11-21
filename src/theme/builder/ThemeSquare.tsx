import ThemePreview from './ThemePreview';
import { pieceImage } from '../library';
import type { GameTheme } from '../types';

// A theme's cover, always a 1:1 square (teacher, 2026-11-21: "always show
// theme covers as 1:1 square images in all places"). The theme's own Cover
// picture (600 x 600) when it has one; otherwise the middle of its game
// preview, cropped to a square.
export default function ThemeSquare({ theme, className = '' }: { theme: GameTheme; className?: string }) {
  const cover = theme.id.startsWith('blank-') ? undefined : pieceImage(theme, 'cover');
  return (
    <span className={`relative block aspect-square overflow-hidden rounded-panel border-bold border-border bg-white ${className}`}>
      {theme.id.startsWith('blank-') ? null : cover
        ? <img src={cover} alt="" className="absolute inset-0 w-full h-full object-cover" draggable="false" />
        : <span className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[133.34%] pointer-events-none [&>*]:!rounded-none [&>*]:!border-0 [&>*]:h-full" aria-hidden="true"><ThemePreview theme={theme} /></span>}
    </span>
  );
}
