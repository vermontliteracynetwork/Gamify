import type { CSSProperties } from 'react';
import { Drop, Flower, Heart, Lightning, Moon, Star, type Icon } from '@phosphor-icons/react';
import { PUZZLE_PACK_CLEARED } from '../../config';
import { pieceImage } from '../../theme/library';
import type { GameTheme } from '../../theme/types';
import { BUBBLE_COLORS } from './manifest';
import { R } from './board';

// Bubble Pop's bubbles, drawn the same in the game and in the Theme
// Builder's preview (teacher, 2026-11-16: the preview is the real game).

// Every bubble has its own shape AND color (never color alone).
export const SHAPES: Icon[] = [Star, Heart, Lightning, Drop, Flower, Moon];

// The theme's bubble pictures (undefined = Classic).
export const bubblePatterns = (theme: GameTheme) => BUBBLE_COLORS.map((_, i) => pieceImage(theme, `bubble-${i}`));

// The <pattern>s the bubbles fill with; goes inside the board svg's <defs>.
export function BubblePatternDefs({ patterns }: { patterns: (string | undefined)[] }) {
  return (
    <>
      {patterns.map((src, i) => (src || PUZZLE_PACK_CLEARED) && (
        <pattern key={i} id={`bp-art-${i}`} patternContentUnits="objectBoundingBox" width="1" height="1"><image href={src ?? `/classic/bubble-pop/bubble-${i}.svg`} width="1" height="1" preserveAspectRatio={src ? 'xMidYMid slice' : 'xMidYMid meet'} /></pattern>
      ))}
    </>
  );
}

// One bubble. Classic bubbles are shiny balls (teacher, 2026-10-31) with
// their shape icon kept on top, so color is never the only clue.
export function drawBubble(patterns: (string | undefined)[], k: number, x: number, y: number, key?: string, cls = '', style?: CSSProperties) {
  const S = SHAPES[k];
  const fill = patterns[k] || PUZZLE_PACK_CLEARED ? `url(#bp-art-${k})` : BUBBLE_COLORS[k];
  return (
    <g key={key} className={cls} style={style}>
      <circle cx={x} cy={y} r={R * 0.94} fill={fill} stroke={PUZZLE_PACK_CLEARED && !patterns[k] ? 'none' : '#000'} strokeWidth={0.13} />
      {!patterns[k] && (PUZZLE_PACK_CLEARED ? <S x={x - 0.42} y={y - 0.36} size={0.84} weight="fill" color="#241c3d" opacity={0.8} /> : <S x={x - 0.55} y={y - 0.55} size={1.1} weight="fill" color="#241c3d" />)}
      {(patterns[k] || !PUZZLE_PACK_CLEARED) && <ellipse cx={x - 0.35} cy={y - 0.42} rx={0.26} ry={0.15} fill="#fff" opacity={0.7} />}
    </g>
  );
}
