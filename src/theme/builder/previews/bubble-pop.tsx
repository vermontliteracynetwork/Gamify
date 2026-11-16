import { backdropStyle, pieceFill, pieceImage } from '../../library';
import type { GameTheme } from '../../types';
import { TeamBadge } from '../../../engine/TeamBadge';
import { center, DANGER_ROW, H, makeBoard, MAX_ROWS, R, rowLen, SHOOTER, W } from '../../../games/bubble-pop/board';
import { BubblePatternDefs, bubblePatterns, drawBubble } from '../../../games/bubble-pop/bubbleArt';

// Bubble Pop's play screen, still: the board with its bubbles, the launcher
// with the next bubble, the aim line, and the player's score card beside it.
let seed = 11;
const BOARD = makeBoard(2, () => ((seed = (seed * 9301 + 49297) % 233280) / 233280));
const AIM = [{ x: SHOOTER.x, y: SHOOTER.y }, { x: SHOOTER.x - 6, y: SHOOTER.y - 9 }];

export default function BubblePopPreview({ theme }: { theme: GameTheme }) {
  const patterns = bubblePatterns(theme);
  const player = pieceImage(theme, 'player');
  const dangerY = R + DANGER_ROW * Math.sqrt(3) - R;
  return (
    <div className="relative rounded-panel border-[2.5px] border-border overflow-hidden aspect-[4/3] flex items-center justify-center gap-[3%] p-[3%]" style={backdropStyle(theme, false)} role="img" aria-label={`Preview of ${theme.name || 'this theme'}`}>
      <div className="relative flex-1 min-w-0 max-h-full rounded-input border-[2.5px] border-border overflow-hidden" style={{ ...pieceFill(theme, 'board', '#314677'), aspectRatio: `${W} / ${H}`, boxShadow: '0 4px 0 #000' }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full" aria-hidden="true">
          <defs><BubblePatternDefs patterns={patterns} /></defs>
          <line x1={0} x2={W} y1={dangerY} y2={dangerY} stroke="#fff" strokeOpacity={0.35} strokeWidth={0.12} strokeDasharray="0.5 0.4" />
          {BOARD.rows.slice(0, MAX_ROWS).map((row, r) => row.slice(0, rowLen(BOARD, r)).map((k, c) => {
            if (k === null) return null;
            const p = center(BOARD, r, c);
            return drawBubble(patterns, k, p.x, p.y, `${r}-${c}`);
          }))}
          <polyline points={AIM.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#fff" strokeWidth={0.22} strokeLinecap="round" strokeDasharray="0.05 0.7" />
          <circle cx={SHOOTER.x} cy={SHOOTER.y} r={R * 1.5} fill="#000" opacity={0.25} />
          {drawBubble(patterns, 1, SHOOTER.x, SHOOTER.y)}
          <g transform={`translate(${SHOOTER.x + 3.4} ${SHOOTER.y + 0.4}) scale(0.7) translate(${-SHOOTER.x - 3.4} ${-SHOOTER.y - 0.4})`} opacity={0.9}>{drawBubble(patterns, 3, SHOOTER.x + 3.4, SHOOTER.y + 0.4)}</g>
        </svg>
      </div>
      {/* The score card, like the game's: the player icon and the score. */}
      <div className="score-card shrink-0 grid justify-items-center gap-1 px-3 py-2">
        {player ? <img src={player} alt="" className="w-10 h-10 rounded-full border-[2px] border-border bg-surface object-contain" /> : <TeamBadge colorIndex={0} size={40} />}
        <span className="font-display text-3xl tabular-nums leading-none">120</span>
        <span className="flex gap-1">{[0, 1, 2, 3].map((i) => <span key={i} className={`w-3 h-3 rounded-full border-[1.5px] border-border ${i < 3 ? 'bg-accent' : 'bg-surface-2'}`} />)}</span>
      </div>
    </div>
  );
}
