import type { CSSProperties } from 'react';
import { Cards } from '@phosphor-icons/react';
import { pieceFill, pieceImage } from '../../theme/library';
import type { GameTheme } from '../../theme/types';

// Memory Match's cards, drawn the same in the game and the Theme Builder
// preview (teacher, 2026-11-16: "ALWAYS show preview as the actual game template").
export const cardClass = (won: boolean) => `rounded-input border-[2.5px] border-border p-1.5 flex items-center justify-center text-center overflow-hidden ${won ? 'ring-4 ring-[#9fe7a0]' : ''}`;
export function cardStyle(theme: GameTheme, up: boolean, side: 'q' | 'a'): CSSProperties {
  return { boxShadow: 'var(--shadow-sticker)', ...(up ? { background: side === 'q' ? '#fbfcf8' : '#fdfd94' } : pieceFill(theme, 'card-back', '#b4c4fb')) };
}
export function CardFace({ theme, up, side, text, image, alt }: { theme: GameTheme; up: boolean; side: 'q' | 'a'; text: string; image?: string; alt?: string }) {
  if (!up) return pieceImage(theme, 'card-back') ? null : <Cards weight="fill" size={30} aria-hidden="true" />;
  return (
    <span className="grid gap-1 justify-items-center">
      {image && <img src={image} alt={alt ?? ''} className="max-h-12 object-contain" />}
      <span className={`font-bold leading-tight break-words ${side === 'a' ? 'text-lg sm:text-2xl' : 'text-xs sm:text-base lg:text-lg'}`}>{text}</span>
    </span>
  );
}
