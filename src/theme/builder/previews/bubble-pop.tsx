import { backdropStyle, pieceFill } from '../../library';
import type { GameTheme } from '../../types';
import { center, DANGER_ROW, H, makeBoard, MAX_ROWS, R, rowLen, SHOOTER, W } from '../../../games/bubble-pop/board';
import { BubblePatternDefs, bubblePatterns, drawBubble, INK } from '../../../games/bubble-pop/bubbleArt';
import { BOARD_COLOR } from '../../../games/bubble-pop/manifest';

// Bubble Pop's play screen, still: the board with its bubbles, the launcher
// with the next bubble, the aim line, and the score beside it.
let seed = 11;
const BOARD = makeBoard(2, () => ((seed = (seed * 9301 + 49297) % 233280) / 233280));
const AIM = [{ x: SHOOTER.x, y: SHOOTER.y }, { x: SHOOTER.x - 6, y: SHOOTER.y - 9 }];

export default function BubblePopPreview({ theme }: { theme: GameTheme }) {
  const patterns = bubblePatterns(theme);
  const dangerY = R + DANGER_ROW * Math.sqrt(3) - R;
  return (
    <div className="relative rounded-panel border-bold border-border overflow-hidden aspect-[4/3] flex items-center justify-center gap-[3%] p-[3%]" style={backdropStyle(theme, false)} role="img" aria-label={`Preview of ${theme.name || 'this theme'}`}>
      <div className="relative h-full max-w-[70%] rounded-input overflow-hidden" style={{ ...pieceFill(theme, 'board', BOARD_COLOR), aspectRatio: `${W} / ${H}`, border: `3px solid ${INK}`, boxShadow: `0 4px 0 ${INK}` }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full" aria-hidden="true">
          <defs><BubblePatternDefs patterns={patterns} /></defs>
          <line x1={0} x2={W} y1={dangerY} y2={dangerY} stroke="#f055a5" strokeWidth={0.2} strokeDasharray="0.55 0.45" />
          {BOARD.rows.slice(0, MAX_ROWS).map((row, r) => row.slice(0, rowLen(BOARD, r)).map((k, c) => {
            if (k === null) return null;
            const p = center(BOARD, r, c);
            return drawBubble(patterns, k, p.x, p.y, `${r}-${c}`);
          }))}
          <polyline points={AIM.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={INK} strokeWidth={0.24} strokeLinecap="round" strokeDasharray="0.01 0.75" />
          {drawBubble(patterns, 1, SHOOTER.x, SHOOTER.y)}
          <g transform={`translate(${SHOOTER.x + 3.4} ${SHOOTER.y + 0.4}) scale(0.7) translate(${-SHOOTER.x - 3.4} ${-SHOOTER.y - 0.4})`}>{drawBubble(patterns, 3, SHOOTER.x + 3.4, SHOOTER.y + 0.4)}</g>
        </svg>
      </div>
      {/* The score, like the game's: a big number at the top right, no player icon (solo, 2026-11-23). */}
      <span className="self-start shrink-0 tabular-nums leading-none uppercase text-[2.5rem]" style={{ fontFamily: 'var(--font-display)', color: INK }}>120</span>
    </div>
  );
}
