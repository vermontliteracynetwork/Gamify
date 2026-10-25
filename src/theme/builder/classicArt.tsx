import { Question, Sparkle, Star, Trophy } from '@phosphor-icons/react';
import { TEAM_ICONS } from '../../engine/TeamBadge';
import { TEAM_COLORS } from '../../engine/turns';
import { PICTURES } from '../../student/pictures';
import { classicTheme } from '../classic';
import type { ThemePieceSpec } from '../types';
import { isRound } from './template';

// The Classic look of one theme piece as plain SVG shapes, at the piece's own
// size. It is the example on the "Classic example" template pages and
// digital files, so designers see what each piece is and how it sits.
// Shapes and icons only, no text, so it turns into a PNG anywhere.
const INK = '#000000';
const ACCENT = '#fdfd94';

export function ClassicPiece({ piece, gameId }: { piece: ThemePieceSpec; gameId: string }) {
  const { width: w, height: h, id } = piece;
  const m = Math.min(w, h);
  const line = Math.max(2, m * 0.03);
  const round = isRound(piece);
  const icon = (I: typeof Star, color: string, size = m * 0.6) => <I weight="fill" color={color} size={size} x={(w - size) / 2} y={(h - size) / 2} />;

  if (id === 'background') {
    const bg = classicTheme(gameId).colors.background;
    return (
      <g>
        <rect width={w} height={h} fill={bg} />
        {gameId === 'star-quiz' && Array.from({ length: 40 }, (_, i) => <circle key={i} cx={(i * 397) % w} cy={(i * 211) % h} r={2 + (i % 3)} fill="#ffffff" opacity={0.8} />)}
      </g>
    );
  }
  if (id === 'board') {
    const fill = piece.color ?? (gameId === 'four-in-a-row' ? '#a8d8f0' : '#ffffff');
    const cols = gameId === 'four-in-a-row' ? 7 : gameId === 'match-three' ? 5 : 0;
    const rows = gameId === 'four-in-a-row' ? 6 : 5;
    const pad = m * 0.05, cw = (w - pad * 2) / (cols || 1), ch = (h - pad * 2) / rows;
    return (
      <g>
        <rect x={line / 2} y={line / 2} width={w - line} height={h - line} rx={m * 0.05} fill={fill} stroke={INK} strokeWidth={line} />
        {cols > 0 && Array.from({ length: cols * rows }, (_, i) => {
          const cx = pad + (i % cols) * cw + cw / 2, cy = pad + Math.floor(i / cols) * ch + ch / 2;
          return gameId === 'four-in-a-row'
            ? <circle key={i} cx={cx} cy={cy} r={Math.min(cw, ch) * 0.38} fill="#ffffff" stroke={INK} strokeWidth={line / 2} />
            : <rect key={i} x={cx - cw * 0.42} y={cy - ch * 0.42} width={cw * 0.84} height={ch * 0.84} rx={cw * 0.1} fill="#f4f4f4" stroke="#999" strokeWidth={line / 3} />;
        })}
      </g>
    );
  }
  if (id.startsWith('team-')) {
    const k = Number(id.slice(5)) - 1;
    return <g><circle cx={w / 2} cy={h / 2} r={m / 2 - line} fill={TEAM_COLORS[k % TEAM_COLORS.length]} stroke={INK} strokeWidth={line} />{icon(TEAM_ICONS[k % TEAM_ICONS.length], '#241c3d', m * 0.55)}</g>;
  }
  if (id.startsWith('pic-')) {
    const p = PICTURES.find((x) => `pic-${x.id}` === id);
    return <g><circle cx={w / 2} cy={h / 2} r={m / 2 - line} fill={p?.color ?? ACCENT} stroke={INK} strokeWidth={line} />{p && icon(p.icon, INK, m * 0.55)}</g>;
  }
  if (id === 'star') return icon(Star, piece.color ?? '#f6c544', m * 0.95);
  if (id === 'trophy') return icon(Trophy, piece.color ?? '#f6c544', m * 0.9);
  if (id === 'cover') return <g><rect width={w} height={h} rx={m * 0.08} fill={ACCENT} stroke={INK} strokeWidth={line} />{icon(Sparkle, INK, m * 0.5)}</g>;
  if (id === 'lane') {
    return (
      <g>
        <rect width={w} height={h} fill={piece.color ?? '#e8c48f'} />
        {[0.2, 0.4, 0.6, 0.8].map((x) => <line key={x} x1={w * x} y1={0} x2={w * x} y2={h} stroke="#c99a5b" strokeWidth={line} />)}
      </g>
    );
  }
  if (id === 'pin') {
    return (
      <g>
        <ellipse cx={w / 2} cy={h * 0.68} rx={w * 0.42} ry={h * 0.3} fill="#ffffff" stroke={INK} strokeWidth={line} />
        <ellipse cx={w / 2} cy={h * 0.22} rx={w * 0.26} ry={h * 0.2} fill="#ffffff" stroke={INK} strokeWidth={line} />
        <rect x={w * 0.22} y={h * 0.38} width={w * 0.56} height={h * 0.06} fill="#e5635f" />
      </g>
    );
  }
  if (round) return <circle cx={w / 2} cy={h / 2} r={m / 2 - line} fill={piece.color ?? ACCENT} stroke={INK} strokeWidth={line} />;
  // Cards, squares, tiles and the rest: a rounded card in the Classic yellow.
  return (
    <g>
      <rect x={line / 2} y={line / 2} width={w - line} height={h - line} rx={m * 0.12} fill={piece.color ?? ACCENT} stroke={INK} strokeWidth={line} />
      {id === 'card-back' && icon(Question, INK, m * 0.55)}
    </g>
  );
}

// The faint guide on a blank digital page: the piece's shape, so a design
// made in another app lines up with the game.
export function BlankGuide({ piece }: { piece: ThemePieceSpec }) {
  const { width: w, height: h } = piece;
  const m = Math.min(w, h), line = Math.max(2, m * 0.012);
  return isRound(piece)
    ? <circle cx={w / 2} cy={h / 2} r={m / 2 - line} fill="#ffffff" stroke="#b9b9b9" strokeWidth={line} strokeDasharray={`${line * 4} ${line * 3}`} />
    : <rect x={line / 2} y={line / 2} width={w - line} height={h - line} fill="#ffffff" stroke="#b9b9b9" strokeWidth={line} strokeDasharray={`${line * 4} ${line * 3}`} />;
}
