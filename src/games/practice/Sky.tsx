import { motion } from 'motion/react';
import { Star } from '@phosphor-icons/react';
import { pieceColor, pieceImage } from '../../theme/library';
import type { GameTheme } from '../../theme/types';

// Question Tracker's play screen: a sky that fills up, one item (a star by
// default, or a theme's own items, like fish or safari animals) for every
// right answer. Items come in different sizes and slowly turn.

const ITEM_PIECES = ['item-1', 'item-2', 'item-3', 'item-4', 'item-5', 'item-6'];

// Spread positions over the sky with no two items on top of each other:
// a jittered grid, shuffled with a fixed seed so the layout stays put.
export function skyGrid(count: number) {
  const cols = Math.ceil(Math.sqrt(count * 1.6));
  return { cols, rows: Math.ceil(count / cols) };
}

export function skySpots(count: number, seed = 7): { x: number; y: number; size: number; spin: number }[] {
  let s = seed;
  const rand = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const { cols, rows } = skyGrid(count);
  const cells = Array.from({ length: cols * rows }, (_, i) => i);
  for (let i = cells.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [cells[i], cells[j]] = [cells[j], cells[i]]; }
  return cells.slice(0, count).map((c) => ({
    x: ((c % cols) + 0.35 + rand() * 0.3) / cols * 100,
    y: (Math.floor(c / cols) + 0.35 + rand() * 0.3) / rows * 100,
    size: 0.5 + rand() * 0.5,
    spin: (rand() - 0.5) * 30,
  }));
}

export default function Sky({ theme, filled, total, still, label }: { theme: GameTheme; filled: number; total: number; still: boolean; label: string }) {
  const spots = skySpots(total);
  const items = ITEM_PIECES.map((id) => pieceImage(theme, id)).filter(Boolean) as string[];
  const { cols, rows } = skyGrid(total);
  // Each item fits its own cell of the sky (container units), so nothing hangs off the edge.
  const unit = `min(${(100 / cols).toFixed(2)}cqw, ${(100 / rows).toFixed(2)}cqh)`;
  const dust = skySpots(36, 3);
  return (
    <div className="relative w-full overflow-hidden rounded-panel border-[2.5px] border-border" role="img" aria-label={label}
      style={{ containerType: 'size', height: 'calc(100dvh - 180px)', background: theme.pieces.background?.image ? `center / cover url("${theme.pieces.background.image}")` : `linear-gradient(180deg, #0d1638 0%, ${theme.colors.background} ${40 + (filled / total) * 60}%)` }}>
      {!theme.pieces.background?.image && dust.map((d, i) => (
        <span key={`d${i}`} className="absolute rounded-full bg-white" style={{ left: `${d.x}%`, top: `${d.y}%`, width: 2 + (i % 3), height: 2 + (i % 3), opacity: 0.25 + 0.5 * (filled / total) }} aria-hidden="true" />
      ))}
      {spots.map((p, i) => {
        if (i >= filled) return null;
        const img = items.length ? items[i % items.length] : undefined;
        return (
          <motion.span key={i} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${p.x}%`, top: `${p.y}%`, width: `calc(${unit} * ${p.size})`, height: `calc(${unit} * ${p.size})` }}
            initial={still ? false : { scale: 0, rotate: -90, opacity: 0 }}
            animate={still ? { opacity: 1 } : { scale: 1, opacity: 1, rotate: [p.spin, p.spin + 12, p.spin - 8, p.spin] }}
            transition={still ? undefined : { scale: { type: 'spring', stiffness: 260, damping: 14 }, opacity: { duration: 0.3 }, rotate: { duration: 6 + (i % 4), repeat: Infinity, ease: 'easeInOut' } }}>
            {img
              ? <img src={img} alt="" className="w-full h-full object-contain" />
              : <Star weight="fill" className="w-full h-full drop-shadow-[0_0_10px_rgba(255,220,120,0.7)]" color={pieceColor(theme, 'item-1', '#ffd166')} />}
          </motion.span>
        );
      })}
    </div>
  );
}
