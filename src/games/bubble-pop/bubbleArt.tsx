import type { CSSProperties } from 'react';
import { Doodle, type DoodleKind } from '../../brand/CrayonKit';
import { pieceImage } from '../../theme/library';
import type { GameTheme } from '../../theme/types';
import { BUBBLE_COLORS } from './manifest';
import { R } from './board';

// Bubble Pop's bubbles, drawn the same in the game and in the Theme
// Builder's preview (teacher, 2026-11-16: the preview is the real game).

// The Classic look (approved mockup, owner 2026-11-24, classic-art skill):
// flat, solid brand brights with one ink outline and a white shine, top left.
export const INK = '#1d1a33';
export const PAPER = '#fffaf0';

// Every bubble has its own small ink mark as well as its color, so color is
// never the only clue (WCAG 1.4.1; the mockup's "small mark"). The marks are
// the crayon kit's doodles (owner, 2026-11-26: the crayon style for all art),
// not icon-font glyphs.
export const SHAPES: DoodleKind[] = ['star', 'heart', 'sparkle', 'drop', 'moon', 'dot'];
// Grape is dark, so its mark is paper, not ink.
const MARK = BUBBLE_COLORS.map((c) => (c === '#6a45f0' ? PAPER : INK));

// The theme's bubble pictures (undefined = Classic).
export const bubblePatterns = (theme: GameTheme) => BUBBLE_COLORS.map((_, i) => pieceImage(theme, `bubble-${i}`));

// The <pattern>s a theme's bubble pictures fill with; goes inside the board svg's <defs>.
export function BubblePatternDefs({ patterns }: { patterns: (string | undefined)[] }) {
  return (
    <>
      {patterns.map((src, i) => src && (
        <pattern key={i} id={`bp-art-${i}`} patternContentUnits="objectBoundingBox" width="1" height="1"><image href={src} width="1" height="1" preserveAspectRatio="xMidYMid slice" /></pattern>
      ))}
    </>
  );
}

// One bubble. A theme's picture fills it; Classic is the flat crayon bubble.
export function drawBubble(patterns: (string | undefined)[], k: number, x: number, y: number, key?: string, cls = '', style?: CSSProperties) {
  const S = SHAPES[k];
  const m = S === 'dot' ? 1.3 : 0.72; // the dot doodle is small in its box
  const art = patterns[k];
  return (
    <g key={key} className={cls} style={style}>
      <circle cx={x} cy={y} r={R * 0.9} fill={art ? `url(#bp-art-${k})` : BUBBLE_COLORS[k]} stroke={INK} strokeWidth={0.15} />
      {!art && <g transform={`translate(${x + 0.1 - m / 2} ${y + 0.16 - m / 2})`}><Doodle kind={S} color={MARK[k]} size={m} /></g>}
      <circle cx={x - 0.34} cy={y - 0.36} r={0.17} fill="#fff" />
    </g>
  );
}
