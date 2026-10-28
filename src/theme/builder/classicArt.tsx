import { Carrot, Hamburger, IceCream, Pizza, Question, Smiley, Sparkle, Star, Trophy } from '@phosphor-icons/react';
import { TEAM_ICONS } from '../../engine/TeamBadge';
import { TEAM_COLORS } from '../../engine/turns';
import { PICTURES } from '../../student/pictures';
import { classicTheme } from '../classic';
import type { ThemePieceSpec } from '../types';
import { isRound } from './template';
import { CLASSIC_ITEM_ART } from '../classicItems';

// The Classic look of one theme piece as plain SVG shapes, at the piece's own
// size. It is the example on the "Classic example" template pages and
// digital files, so designers see what each piece is and how it sits.
// Shapes and icons only, no text, so it turns into a PNG anywhere.
const INK = '#000000';
const ACCENT = '#fdfd94';
// Pieces that look round in the game, though they are drawn in a box.
export const ROUND_LOOK = /^(ball|peg|bobber|sun)$/;

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
  // A Classic power-up page (id item-<art>), scaled from its 100 x 100 drawing.
  if (id.startsWith('item-') && CLASSIC_ITEM_ART[id.slice(5)]) {
    const Art = CLASSIC_ITEM_ART[id.slice(5)];
    const s = m / 100;
    return <g transform={`translate(${(w - m) / 2} ${(h - m) / 2}) scale(${s})`}><Art /></g>;
  }
  if (id.startsWith('team-')) {
    const k = Number(id.slice(5)) - 1;
    return <g><circle cx={w / 2} cy={h / 2} r={m / 2 - line} fill={TEAM_COLORS[k % TEAM_COLORS.length]} stroke={INK} strokeWidth={line} />{icon(TEAM_ICONS[k % TEAM_ICONS.length], '#241c3d', m * 0.55)}</g>;
  }
  if (id.startsWith('pic-')) {
    const p = PICTURES.find((x) => `pic-${x.id}` === id);
    return <g><circle cx={w / 2} cy={h / 2} r={m / 2 - line} fill={p?.color ?? ACCENT} stroke={INK} strokeWidth={line} />{p && icon(p.icon, INK, m * 0.55)}</g>;
  }
  if (id.startsWith('food-')) {
    const F = { 'food-pizza': Pizza, 'food-burger': Hamburger, 'food-icecream': IceCream, 'food-carrot': Carrot }[id] ?? Star;
    return <g><circle cx={w / 2} cy={h / 2} r={m / 2 - line} fill={piece.color ?? ACCENT} stroke={INK} strokeWidth={line} />{icon(F, '#241c3d', m * 0.6)}</g>;
  }
  if (id.startsWith('guest-')) {
    const k = Number(id.slice(6)) - 1;
    return (
      <g>
        <path d={`M${w * 0.12},${h} Q${w * 0.12},${h * 0.66} ${w / 2},${h * 0.66} Q${w * 0.88},${h * 0.66} ${w * 0.88},${h} Z`} fill={['#6aa9e9', '#c58ce8', '#5cc3a0'][k % 3]} stroke={INK} strokeWidth={line} />
        <circle cx={w / 2} cy={h * 0.38} r={w * 0.28} fill={['#f5d0b5', '#c68a5e', '#e0ac85'][k % 3]} stroke={INK} strokeWidth={line} />
        <circle cx={w * 0.41} cy={h * 0.36} r={w * 0.035} fill="#241c3d" /><circle cx={w * 0.59} cy={h * 0.36} r={w * 0.035} fill="#241c3d" />
        <path d={`M${w * 0.4},${h * 0.45} Q${w / 2},${h * 0.52} ${w * 0.6},${h * 0.45}`} fill="none" stroke="#241c3d" strokeWidth={line} strokeLinecap="round" />
      </g>
    );
  }
  if (id === 'mascot') return icon(Smiley, '#f6c544', m * 0.9);
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
  // Round things that are not round template pieces.
  if (ROUND_LOOK.test(id)) {
    const fill = piece.color ?? ({ ball: ACCENT, peg: '#ffffff', bobber: '#e5635f', sun: '#ffd84d' } as Record<string, string>)[id] ?? ACCENT;
    return (
      <g>
        {id === 'sun' && Array.from({ length: 8 }, (_, k) => <line key={k} x1={w / 2} y1={h / 2} x2={w / 2 + Math.cos(k * Math.PI / 4) * m * 0.48} y2={h / 2 + Math.sin(k * Math.PI / 4) * m * 0.48} stroke="#f6a623" strokeWidth={line * 1.6} strokeLinecap="round" />)}
        <circle cx={w / 2} cy={h / 2} r={id === 'sun' ? m * 0.32 : m / 2 - line} fill={fill} stroke={INK} strokeWidth={line} />
        {id === 'bobber' && <path d={`M${w / 2 - m * 0.46} ${h / 2} H${w / 2 + m * 0.46}`} stroke={INK} strokeWidth={line} />}
        {id === 'bobber' && <path d={`M${w / 2 - m * 0.45} ${h / 2} A${m * 0.45} ${m * 0.45} 0 0 0 ${w / 2 + m * 0.45} ${h / 2} Z`} fill="#ffffff" stroke={INK} strokeWidth={line} />}
      </g>
    );
  }
  if (id === 'cloud') {
    return <path d={`M${w * 0.2} ${h * 0.82} Q${w * 0.02} ${h * 0.8} ${w * 0.06} ${h * 0.58} Q${w * 0.1} ${h * 0.38} ${w * 0.3} ${h * 0.42} Q${w * 0.36} ${h * 0.1} ${w * 0.58} ${h * 0.16} Q${w * 0.78} ${h * 0.2} ${w * 0.78} ${h * 0.42} Q${w * 0.98} ${h * 0.42} ${w * 0.96} ${h * 0.64} Q${w * 0.94} ${h * 0.82} ${w * 0.78} ${h * 0.82} Z`} fill="#ffffff" stroke={INK} strokeWidth={line} strokeLinejoin="round" />;
  }
  if (id === 'bucket' || id === 'bucket-big') {
    return (
      <g>
        <path d={`M${w * 0.08} ${h * 0.12} H${w * 0.92} L${w * 0.82} ${h * 0.92} H${w * 0.18} Z`} fill={piece.color ?? (id === 'bucket-big' ? '#ed9d75' : '#ffffff')} stroke={INK} strokeWidth={line} strokeLinejoin="round" />
        <path d={`M${w * 0.08} ${h * 0.12} H${w * 0.92}`} stroke={INK} strokeWidth={line * 2} />
      </g>
    );
  }
  if (id === 'rod') return <g><path d={`M${w * 0.15} ${h * 0.95} L${w * 0.75} ${h * 0.05}`} stroke="#9c6b45" strokeWidth={m * 0.08} strokeLinecap="round" /><path d={`M${w * 0.75} ${h * 0.05} Q${w * 0.95} ${h * 0.4} ${w * 0.85} ${h * 0.95}`} fill="none" stroke={INK} strokeWidth={line / 2} /></g>;
  if (id === 'dock') return <g>{[0, 1, 2, 3, 4].map((k) => <rect key={k} x={line / 2 + k * (w - line) / 5} y={h * 0.2} width={(w - line) / 5} height={h * 0.6} fill={k % 2 ? '#b98a5e' : '#c99a6b'} stroke={INK} strokeWidth={line} />)}</g>;
  if (id === 'barn') {
    return (
      <g>
        <path d={`M${w * 0.1} ${h * 0.42} L${w / 2} ${h * 0.1} L${w * 0.9} ${h * 0.42} V${h * 0.95} H${w * 0.1} Z`} fill="#e5635f" stroke={INK} strokeWidth={line} strokeLinejoin="round" />
        <rect x={w * 0.34} y={h * 0.56} width={w * 0.32} height={h * 0.39} fill="#fbfcf8" stroke={INK} strokeWidth={line} />
        <path d={`M${w * 0.34} ${h * 0.56} L${w * 0.66} ${h * 0.95} M${w * 0.66} ${h * 0.56} L${w * 0.34} ${h * 0.95}`} stroke="#e5635f" strokeWidth={line} />
      </g>
    );
  }
  if (id === 'sprout' || id.startsWith('crop-')) {
    const top = ({ 'crop-corn': '#f6c544', 'crop-pumpkin': '#f39a6b', 'crop-sunflower': '#ffd84d', 'crop-tomato': '#e5635f' } as Record<string, string>)[id];
    return (
      <g>
        <path d={`M${w / 2} ${h * 0.95} V${h * 0.4}`} stroke="#2f7d32" strokeWidth={line * 1.5} strokeLinecap="round" />
        <path d={`M${w / 2} ${h * 0.7} Q${w * 0.2} ${h * 0.6} ${w * 0.18} ${h * 0.42} Q${w * 0.4} ${h * 0.5} ${w / 2} ${h * 0.7} Z M${w / 2} ${h * 0.6} Q${w * 0.8} ${h * 0.5} ${w * 0.82} ${h * 0.32} Q${w * 0.6} ${h * 0.4} ${w / 2} ${h * 0.6} Z`} fill="#7cc66a" stroke={INK} strokeWidth={line / 1.5} />
        {top && <circle cx={w / 2} cy={h * 0.3} r={m * 0.22} fill={top} stroke={INK} strokeWidth={line} />}
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
