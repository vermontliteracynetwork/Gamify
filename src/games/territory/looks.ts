import type { GameTheme } from '../../theme/types';
import { pieceImage } from '../../theme/library';

// A theme may upload one, two or three defenders and invaders (each a square
// 1:1 piece). Only the uploaded ones are used (teacher, 2026-11-24: "if only
// one of each is uploaded, just have those only"); with none uploaded the
// three Classic drawings are used.
export function pieceFor(theme: GameTheme | undefined, side: 'defender' | 'invader', look: number): { img?: string; look: number } {
  const have = [1, 2, 3].map((n) => pieceImage(theme, `${side}-${n}`)).filter((u): u is string => !!u);
  if (!have.length) return { look: look % 3 };
  return { img: have[look % have.length], look: look % have.length };
}
