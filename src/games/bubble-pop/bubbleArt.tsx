import type { CSSProperties } from 'react';
import { Drop, Flower, Heart, Lightning, Moon, Star, type Icon } from '@phosphor-icons/react';
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
// never the only clue (WCAG 1.4.1; the mockup's "small mark").
export const SHAPES: Icon[] = [Star, Heart, Lightning, Drop, Flower, Moon];
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
  const art = patterns[k];
  return (
    <g key={key} className={cls} style={style}>
      <circle cx={x} cy={y} r={R * 0.9} fill={art ? `url(#bp-art-${k})` : BUBBLE_COLORS[k]} stroke={INK} strokeWidth={0.15} />
      {!art && <S x={x - 0.28} y={y - 0.22} size={0.76} weight="fill" color={MARK[k]} opacity={0.6} />}
      <circle cx={x - 0.34} cy={y - 0.36} r={0.17} fill="#fff" />
    </g>
  );
}
