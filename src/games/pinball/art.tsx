import type { CSSProperties } from 'react';
import { pieceColor, pieceFill, pieceImage } from '../../theme/library';
import type { GameTheme } from '../../theme/types';
import { H, LAUNCH, PEG_R, W, type Pt } from './table';

// Pinball's table, pegs, stars, flippers, plunger, ball and pockets, drawn
// the same in the game and in the Theme Builder's preview (teacher,
// 2026-11-16). All in the table's 100 x 130 SVG units.

// The lane band's colors, like a painted alley (teacher reference, 2026-10-31).
export const LANE_COLORS = ['#f6c544', '#9b7be0', '#ef5d7a', '#4fb6d8', '#f39ac0'];
export const POCKET_COLORS = ['#ff9b54', '#fbc94a', '#f2735f', '#8fe3a0', '#8ec5ff', '#c9a3f5'];
// Pegs (teacher, 2026-11-13): each its own color, unless a theme colors them.
export const PEG_COLORS = ['#f2735f', '#6aa9e9', '#5cc3a0', '#f6c544', '#c9a3f5', '#f39ac0'];

export function TableDefs({ theme }: { theme: GameTheme }) {
  return (
    <>
      <defs>
        <radialGradient id="pb-ball" cx="35%" cy="30%" r="70%"><stop offset="0%" stopColor="#ffffff" /><stop offset="55%" stopColor={pieceColor(theme, 'ball', '#e7ecf5')} /><stop offset="100%" stopColor="#8a93a8" /></radialGradient>
        <radialGradient id="pb-spot" cx="50%" cy="55%" r="60%"><stop offset="0%" stopColor="#fff" stopOpacity={0.2} /><stop offset="100%" stopColor="#fff" stopOpacity={0} /></radialGradient>
        {pieceImage(theme, 'ball') && <pattern id="pb-ball-art" patternContentUnits="objectBoundingBox" width="1" height="1"><image href={pieceImage(theme, 'ball')} width="1" height="1" preserveAspectRatio="xMidYMid slice" /></pattern>}
      </defs>
    </>
  );
}

// Table art (Golden Rule pass, 2026-10-31), drawn over the table color so a
// theme's color still shows; a theme's own table picture replaces it.
export function TableDecor({ theme, blink }: { theme: GameTheme; blink: boolean }) {
  return (
    <>
      {!pieceImage(theme, 'board') && (
        <g aria-hidden="true">
          <rect x={0} y={0} width={W} height={H} fill="url(#pb-spot)" />
          {[[38, 36], [62, 36], [50, 40]].map(([x, y], i) => (
            <path key={`ar-${i}`} d={`M${x - 3} ${y + 2.4} L${x} ${y - 1.2} L${x + 3} ${y + 2.4}`} fill="none" stroke="#fdfd94" strokeWidth={1.1} strokeLinecap="round" strokeLinejoin="round" opacity={0.75} className={blink ? 'pb-blink' : ''} style={{ animationDelay: `${i * 0.25}s` }} />
          ))}
          {/* Only collectible stars on the table now (teacher, 2026-11-13). */}
          {[-1, 1].map((sd) => (
            <g key={`side-${sd}`}>
              <path d={sd < 0 ? 'M5.5 88 L22 109' : 'M94.5 88 L78 109'} stroke="#000" strokeWidth={2.4} strokeLinecap="round" />
              <path d={sd < 0 ? 'M5.5 88 L22 109' : 'M94.5 88 L78 109'} stroke="#c9d3ea" strokeWidth={1.2} strokeLinecap="round" />
              <path d={sd < 0 ? 'M12 84 L12 96 L19.5 99.5 Z' : 'M88 84 L88 96 L80.5 99.5 Z'} fill="#f2735f" stroke="#000" strokeWidth={0.6} strokeLinejoin="round" />
              <path d={sd < 0 ? 'M13.4 87.5 L13.4 94.6 L17.6 96.6' : 'M86.6 87.5 L86.6 94.6 L82.4 96.6'} fill="none" stroke="#fff" strokeWidth={0.7} strokeLinecap="round" />
            </g>
          ))}
        </g>
      )}
      <rect x={3} y={3} width={W - 6} height={H - 6} rx={9} fill="none" stroke="#fff" strokeOpacity={0.3} strokeWidth={0.7} />
    </>
  );
}

// A theme's own bumper color paints every peg; Classic gives each its color.
export function pegFill(theme: GameTheme, i: number) {
  const own = pieceColor(theme, 'bumper', '');
  return own && own.toLowerCase() !== '#f2735f' ? own : PEG_COLORS[i % PEG_COLORS.length];
}
export function PegArt({ b, i, theme, circleRef }: { b: Pt; i: number; theme: GameTheme; circleRef?: (el: SVGCircleElement | null) => void }) {
  const art = pieceImage(theme, 'bumper');
  return (
    <>
      <circle cx={b.x} cy={b.y + 0.8} r={PEG_R + 0.9} fill="#000" opacity={0.25} />
      <circle cx={b.x} cy={b.y} r={PEG_R + 0.7} fill="#fff" stroke="#000" strokeWidth={0.45} />
      <circle ref={circleRef} cx={b.x} cy={b.y} r={PEG_R} fill={pegFill(theme, i)} stroke="#000" strokeWidth={0.5} />
      {art ? <image href={art} x={b.x - 4} y={b.y - 4} width={8} height={8} /> : <circle cx={b.x - 1} cy={b.y - 1} r={1.1} fill="#fff" opacity={0.85} />}
    </>
  );
}

export function StarArt({ blink }: { blink: boolean }) {
  return (
    <>
      <circle r={4.4} fill="#fdfd94" opacity={0.25} className={blink ? 'pb-blink' : ''} />
      <path d="M0 -3.8 L1.1 -1.3 L3.8 -1.2 L1.7 0.6 L2.4 3.2 L0 1.7 L-2.4 3.2 L-1.7 0.6 L-3.8 -1.2 L-1.1 -1.3 Z" fill="#fdfd94" stroke="#000" strokeWidth={0.45} strokeLinejoin="round" />
    </>
  );
}

export function Flippers({ theme, moving }: { theme: GameTheme; moving: boolean }) {
  const fill = pieceColor(theme, 'flipper', '#fdfd94');
  return (
    <>
      <path d="M0 -1.6 L15 -0.6 L15 0.6 L0 1.6 Z" fill={fill} stroke="#000" strokeWidth={0.5} strokeLinejoin="round" transform="translate(26 118) rotate(18)" className={moving ? 'pb-flip-l' : ''} style={{ transformOrigin: '0 0', transformBox: 'view-box' as const }} />
      <path d="M0 -1.6 L-15 -0.6 L-15 0.6 L0 1.6 Z" fill={fill} stroke="#000" strokeWidth={0.5} strokeLinejoin="round" transform="translate(74 118) rotate(-18)" className={moving ? 'pb-flip-r' : ''} style={{ transformOrigin: '0 0', transformBox: 'view-box' as const }} />
    </>
  );
}

// The plunger under the ball.
export const Plunger = () => <rect x={LAUNCH.x - 3} y={LAUNCH.y + 3.6} width={6} height={6} rx={1} fill="#9aa3b5" stroke="#000" strokeWidth={0.5} />;

// The ball at 0,0 (needs TableDefs in the same SVG).
export function BallArt({ theme, aura }: { theme: GameTheme; aura: boolean }) {
  return (
    <>
      <circle cx={0.7} cy={1.1} r={3.1} fill="#000" opacity={0.3} />
      {aura && <circle r={4.8} fill="none" stroke="#fdfd94" strokeWidth={0.9} className="pb-aura" />}
      <circle r={3.1} fill={pieceImage(theme, 'ball') ? 'url(#pb-ball-art)' : 'url(#pb-ball)'} stroke="#000" strokeWidth={0.5} />
    </>
  );
}

// A scoring pocket's look: the theme's picture, else Classic's colored cup.
export function pocketStyle(theme: GameTheme, i: number, on: boolean): CSSProperties {
  const c = POCKET_COLORS[i % POCKET_COLORS.length];
  return {
    ...(pieceImage(theme, 'pocket') ? pieceFill(theme, 'pocket', c) : { background: on ? '#fdfd94' : `linear-gradient(180deg, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0) 32%), linear-gradient(180deg, ${c} 0%, ${c} 70%, rgba(255,255,255,0.35) 100%)` }),
    boxShadow: 'inset 0 -5px 0 rgba(0,0,0,0.18), inset 0 3px 6px rgba(0,0,0,0.25)', color: '#fff', fontFamily: "'Grow Year', var(--font-display)", WebkitTextStroke: '1.5px #000', paintOrder: 'stroke',
  };
}
