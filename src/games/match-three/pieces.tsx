import { useId } from 'react';

// Match Three's Classic pieces (approved game mockup, /brand Game mockups,
// teacher 2026-11-24): six bold shapes in six brand brights, each with the
// ink outline and one white shine at the top left, so shape alone tells them
// apart (WCAG 1.4.1, dual coding for pre-readers). Drawn in code, no files.
// Kind order matches the spoken names (bm.gem.0 to 5).

export const INK = '#1d1a33';
export const PIECE_COLORS = ['#4ba3e8', '#f055a5', '#22b04a', '#fabe37', '#6a45f0', '#ff9b28'];

// Each path on a 100 x 100 box.
const SHAPES: string[] = [
  // 0 blue diamond
  'M50 7 L90 50 L50 93 L10 50 Z',
  // 1 pink heart
  'M50 88 C22 70 6 52 8 34 C10 14 38 10 50 30 C62 10 90 14 92 34 C94 52 78 70 50 88 Z',
  // 2 green square
  'M14 20 Q14 14 20 14 L80 14 Q86 14 86 20 L86 80 Q86 86 80 86 L20 86 Q14 86 14 80 Z',
  // 3 yellow star
  'M50 8 L62 36 L92 38 L69 58 L77 90 L50 73 L23 90 L31 58 L8 38 L38 36 Z',
  // 4 purple circle
  'M50 10 A40 40 0 1 0 50.01 10 Z',
  // 5 orange triangle
  'M50 10 L92 86 L8 86 Z',
];
// One white shine per shape, top left, inside the outline.
const SHINES = ['M34 40 L44 29', 'M22 34 q3 -9 12 -10', 'M26 34 q2 -8 10 -9', 'M42 40 L48 26', 'M26 40 q4 -11 15 -14', 'M40 52 L48 37'];
const SHINE = 'M28 36 q4 -10 14 -12';
const RAINBOW = ['#f055a5', '#ff9b28', '#fabe37', '#22b04a', '#4ba3e8'];

export type MadeKind = 'row' | 'col' | 'burst' | 'rainbow';

// One piece. A piece made by a combo is its own design (teacher, 2026-11-18,
// like a wrapped candy; no badge or outline added): line pieces wear two white
// stripes across (or down), the bomb a dotted wrap ring, the rainbow is rings
// of every bright.
export function ClassicPiece({ kind, made, className }: { kind: number; made?: MadeKind; className?: string }) {
  const clip = `m3c${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  if (made === 'rainbow') {
    return (
      <svg viewBox="0 0 100 100" className={className} aria-hidden="true" overflow="visible">
        {RAINBOW.map((c, i) => <circle key={c} cx="50" cy="50" r={42 - i * 7.5} fill={c} stroke={INK} strokeWidth={i === 0 ? 5.5 : 2.2} />)}
        <path d={SHINE} stroke="#fff" strokeWidth="7" fill="none" strokeLinecap="round" />
      </svg>
    );
  }
  const k = ((kind % 6) + 6) % 6;
  const fit = made === 'burst' ? 'translate(50 50) scale(0.8) translate(-50 -50)' : undefined;
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true" overflow="visible">
      {made === 'burst' && <circle cx="50" cy="50" r="49" fill="#fff1b8" stroke={INK} strokeWidth="4" strokeDasharray="9 7" strokeLinecap="round" />}
      <clipPath id={clip}><path d={SHAPES[k]} /></clipPath>
      <g transform={fit}>
        <path d={SHAPES[k]} fill={PIECE_COLORS[k]} />
        {/* The stripes stay inside the shape; the outline is drawn over them. */}
        <g clipPath={`url(#${clip})`}>
          {made === 'row' && [43, 59].map((y) => <path key={y} d={`M0 ${y} H100`} stroke="#fff" strokeWidth="7" />)}
          {made === 'col' && [43, 57].map((x) => <path key={x} d={`M${x} 0 V100`} stroke="#fff" strokeWidth="7" />)}
        </g>
        <path d={SHAPES[k]} fill="none" stroke={INK} strokeWidth="5.5" strokeLinejoin="round" />
        {(!made || made === 'burst') && <path d={SHINES[k]} stroke="#fff" strokeWidth="7" fill="none" strokeLinecap="round" />}
      </g>
    </svg>
  );
}
