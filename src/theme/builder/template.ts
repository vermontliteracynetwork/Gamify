import type { ThemePieceSpec } from '../types';

// The printable theme template (one page per designable piece) and where
// everything sits on it, in px on a 1700 x 2200 page (US Letter at 200 dpi).
// The same numbers draw the printed page and read a photo of it back, so
// students draw on paper and the Theme Builder cuts each piece out.
// Rebuilt from the Dashboard's Plinko template idea, not copied.

export const PAGE = { width: 1700, height: 2200 };

// Four solid corner squares; the top left one has a white center, so a photo
// taken sideways or upside down still reads the right way up.
export const MARKER = { size: 90, inset: 70 };
export const markerCenters = (): [number, number][] => {
  const a = MARKER.inset + MARKER.size / 2, bx = PAGE.width - a, by = PAGE.height - a;
  return [[a, a], [bx, a], [bx, by], [a, by]]; // top left, top right, bottom right, bottom left
};

// The page number as five squares across the top (filled = 1), so pages can
// be photographed in any order.
export const CODE = { size: 36, gap: 14, bits: 5, y: 92 };
export const codeX = (bit: number) => PAGE.width / 2 - (CODE.bits * CODE.size + (CODE.bits - 1) * CODE.gap) / 2 + bit * (CODE.size + CODE.gap);
export const codeBits = (page: number) => Array.from({ length: CODE.bits }, (_, b) => (page >> (CODE.bits - 1 - b)) & 1);

// The drawing area under the page's heading, and the outline inside it at
// the piece's own shape.
const AREA = { x: 150, y: 420, width: 1400, height: 1580 };
export const OUTLINE_STROKE = 10;

export function outlineBox(piece: Pick<ThemePieceSpec, 'width' | 'height'>) {
  const ratio = piece.width / piece.height;
  let width = AREA.width, height = width / ratio;
  if (height > AREA.height) { height = AREA.height; width = height * ratio; }
  return { x: AREA.x + (AREA.width - width) / 2, y: AREA.y + (AREA.height - height) / 2, width, height };
}

// Round pieces (discs, team icons, sign-in pictures, the star) are drawn in a circle.
export const isRound = (piece: ThemePieceSpec) => /^piece-|^team-|^pic-|^star$/.test(piece.id);
