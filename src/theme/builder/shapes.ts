// Pieces drawn in their own outline shape on the templates, cut out along it
// and drawn inside it in the game (teacher, 2026-11-02: "bowling pin template
// needs to be a bowling pin shape so ... they aren't cut out all the way").
// Each shape is the same curve the game draws, as cubic curves in a 0..1 box
// (x across, y down).

type Seg = [number, number, number, number, number, number]; // cubic: c1, c2, end
interface Shape { start: [number, number]; segs: Seg[] }

// Bowling's pin, from the game's pin drawing (x -3.2..3.2, y -11..0.3).
const pinRaw = { start: [0, -11] as [number, number], segs: [
  [1.6, -11, 2, -9.6, 1.6, -8.2], [1.3, -7.2, 1, -6.6, 1.7, -5.4], [2.9, -3.6, 3.2, -1.8, 2.6, -0.4], [2.3, 0.2, 1.6, 0.3, 0, 0.3],
  [-1.6, 0.3, -2.3, 0.2, -2.6, -0.4], [-3.2, -1.8, -2.9, -3.6, -1.7, -5.4], [-1, -6.6, -1.3, -7.2, -1.6, -8.2], [-2, -9.6, -1.6, -11, 0, -11],
] as Seg[] };
const norm = (x: number, y: number): [number, number] => [(x + 3.2) / 6.4, (y + 11) / 11.3];
const PIN: Shape = {
  start: norm(...pinRaw.start),
  segs: pinRaw.segs.map((s) => [...norm(s[0], s[1]), ...norm(s[2], s[3]), ...norm(s[4], s[5])] as Seg),
};

const SHAPES: Record<string, Shape> = { pin: PIN };
export const hasShape = (pieceId: string) => !!SHAPES[pieceId];

// The shape as an SVG path in a box.
export function shapePath(pieceId: string, x: number, y: number, w: number, h: number): string | null {
  const s = SHAPES[pieceId];
  if (!s) return null;
  const p = (u: number, v: number) => `${(x + u * w).toFixed(2)},${(y + v * h).toFixed(2)}`;
  return `M${p(...s.start)} ${s.segs.map((g) => `C${p(g[0], g[1])} ${p(g[2], g[3])} ${p(g[4], g[5])}`).join(' ')} Z`;
}

// The shape as PDF path operators in a box (PDF y runs up from the bottom).
export function shapePdf(pieceId: string, x: number, y: number, w: number, h: number, pageH: number): string[] {
  const s = SHAPES[pieceId];
  if (!s) return [];
  const p = (u: number, v: number) => `${(x + u * w).toFixed(2)} ${(pageH - (y + v * h)).toFixed(2)}`;
  return [`${p(...s.start)} m`, ...s.segs.map((g) => `${p(g[0], g[1])} ${p(g[2], g[3])} ${p(g[4], g[5])} c`), 'h'];
}

// Clips a canvas drawing to the shape filling the canvas.
export function clipToShape(ctx: CanvasRenderingContext2D, pieceId: string, w: number, h: number): boolean {
  const d = shapePath(pieceId, 0, 0, w, h);
  if (!d) return false;
  ctx.clip(new Path2D(d));
  return true;
}

// The pin as the game draws it (x -3.2..3.2, y -11..0.3), for clipping drawn pins.
export const PIN_OUTLINE = shapePath('pin', -3.2, -11, 6.4, 11.3)!;
