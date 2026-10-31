import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Star } from '@phosphor-icons/react';
import { pieceColor, pieceImage } from '../../theme/library';
import { classicTheme } from '../../theme/classic';
import type { GameTheme } from '../../theme/types';

// Question Tracker's play screen: a sky that fills up, one item (a star by
// default, or a theme's own items, like fish or safari animals) for every
// right answer. Items come in different sizes and slowly turn.

const ITEM_PIECES = ['item-1', 'item-2', 'item-3', 'item-4', 'item-5', 'item-6'];

// Items fill the open sky around the question box (it sits over the sky),
// so every one stays in view as questions are answered (teacher,
// 2026-10-24). The box is measured on screen; the open strips above, below
// and beside it each get a jittered grid, shuffled with a fixed seed so the
// layout stays put. Sizes vary a lot, from small to big.
export interface Hole { l: number; t: number; r: number; b: number } // % of the sky
export interface SkySpot { x: number; y: number; size: number; spin: number; unit: string }
const DEFAULT_HOLE: Hole = { l: 15, t: 22, r: 85, b: 68 };

export function skySpots(count: number, seed = 7, hole: Hole | null = DEFAULT_HOLE, aspect = 0.7): SkySpot[] {
  let s = seed;
  const rand = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  // Open strips as [left, top, width, height] in %, kept if big enough to hold an item.
  const h = hole ?? { l: 50, t: 50, r: 50, b: 50 };
  const strips = (hole ? [[0, 0, 100, h.t], [0, h.b, 100, 100 - h.b], [0, h.t, h.l, h.b - h.t], [h.r, h.t, 100 - h.r, h.b - h.t]] : [[0, 0, 100, 100]])
    .filter(([, , w, ht]) => w * aspect >= 6 && ht >= 6);
  const area = (st: number[]) => st[2] * aspect * st[3];
  const total = strips.reduce((n, st) => n + area(st), 0) || 1;
  const counts = strips.map((st) => Math.floor((count * area(st)) / total));
  const byArea = strips.map((_, i) => i).sort((x, y) => area(strips[y]) - area(strips[x]));
  for (let i = 0; counts.reduce((n, c) => n + c, 0) < count; i++) counts[byArea[i % byArea.length]] += 1;
  const out: { spot: SkySpot; order: number }[] = [];
  strips.forEach(([left, top, w, ht], si) => {
    const n = counts[si];
    if (!n) return;
    const ratio = (w * aspect) / ht; // the strip's width over its height, on screen
    const rows = Math.max(1, Math.round(Math.sqrt(n / ratio)));
    const cols = Math.ceil(n / rows);
    const unit = `min(${(w / cols).toFixed(2)}cqw, ${(ht / rows).toFixed(2)}cqh)`;
    const cells = Array.from({ length: cols * rows }, (_, i) => i);
    for (let i = cells.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [cells[i], cells[j]] = [cells[j], cells[i]]; }
    cells.slice(0, n).forEach((c) => { const spin = (rand() - 0.5) * 100; const size = 0.3 + rand() * 0.55; out.push({
      order: rand(),
      spot: {
        x: left + (((c % cols) + 0.4 + rand() * 0.2) / cols) * w,
        y: top + ((Math.floor(c / cols) + 0.4 + rand() * 0.2) / rows) * ht,
        // Small to big, each tipped its own way (teacher, 2026-10-31); a tipped
        // item stays inside its cell (and so never under the question box).
        size: Math.min(size, 0.9 / (Math.abs(Math.cos(((Math.abs(spin) + 12) * Math.PI) / 180)) + Math.abs(Math.sin(((Math.abs(spin) + 12) * Math.PI) / 180)))),
        spin,
        unit,
      },
    }); });
  });
  // Mix the strips so items appear all around in turn.
  return out.sort((x, y) => x.order - y.order).map((o) => o.spot);
}

// Watches where the question box (or results box) sits over the sky. The
// hole only grows, so items never move under a taller box later.
function useHole(ref: React.RefObject<HTMLDivElement | null>) {
  const [hole, setHole] = useState<Hole>(DEFAULT_HOLE);
  const [aspect, setAspect] = useState(0.7);
  const seen = useRef<Hole | null>(null);
  useEffect(() => {
    const look = () => {
      const c = ref.current?.getBoundingClientRect();
      const d = document.querySelector('[role=dialog] > div')?.getBoundingClientRect();
      if (!c || !c.width || !c.height) return;
      setAspect((a) => (Math.abs(a - c.width / c.height) > 0.02 ? c.width / c.height : a));
      if (!d || !d.width) return;
      const pad = 10;
      const pct = (v: number, size: number) => Math.max(0, Math.min(100, (v / size) * 100));
      const now = { l: pct(d.left - pad - c.left, c.width), t: pct(d.top - pad - c.top, c.height), r: pct(d.right + pad - c.left, c.width), b: pct(d.bottom + pad - c.top, c.height) };
      const was = seen.current;
      const next = was ? { l: Math.min(was.l, now.l), t: Math.min(was.t, now.t), r: Math.max(was.r, now.r), b: Math.max(was.b, now.b) } : now;
      if (!was || Math.abs(next.l - was.l) + Math.abs(next.t - was.t) + Math.abs(next.r - was.r) + Math.abs(next.b - was.b) > 0.5) {
        seen.current = next;
        setHole(next);
      }
    };
    look();
    const id = window.setInterval(look, 400);
    return () => window.clearInterval(id);
  }, [ref]);
  return { hole, aspect };
}

// `colors` tints each filled star (a class sky where every student has a
// color); `height` sizes the sky when it is not the whole game screen.
export default function Sky({ theme, filled, total, still, label, colors, height = 'calc(100dvh - 11.875rem + var(--chrome-save, 0rem))' }: { theme: GameTheme; filled: number; total: number; still: boolean; label: string; colors?: string[]; height?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { hole, aspect } = useHole(ref);
  const spots = skySpots(total, 7, hole, aspect);
  // Items a theme leaves empty keep the Classic look (the teacher's stars).
  const own = ITEM_PIECES.map((id) => pieceImage(theme, id)).filter(Boolean) as string[];
  const items = own.length ? own : ITEM_PIECES.map((id) => pieceImage(classicTheme(theme.gameId), id)).filter(Boolean) as string[];
  const dust = skySpots(36, 3, null, aspect);
  return (
    <div ref={ref} className="relative w-full overflow-hidden rounded-panel border-[2.5px] border-border" role="img" aria-label={label}
      style={{ containerType: 'size', height, background: theme.pieces.background?.image ? `center / cover url("${theme.pieces.background.image}")` : `linear-gradient(180deg, #0d1638 0%, ${theme.colors.background} ${40 + (filled / total) * 60}%)` }}>
      {!theme.pieces.background?.image && dust.map((d, i) => (
        <span key={`d${i}`} className="absolute rounded-full bg-white" style={{ left: `${d.x}%`, top: `${d.y}%`, width: 2 + (i % 3), height: 2 + (i % 3), opacity: 0.25 + 0.5 * (filled / total) }} aria-hidden="true" />
      ))}
      {spots.map((p, i) => {
        if (i >= filled) return null;
        const img = items.length && !colors ? items[i % items.length] : undefined;
        return (
          <motion.span key={i} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${p.x}%`, top: `${p.y}%`, width: `calc(${p.unit} * ${p.size})`, height: `calc(${p.unit} * ${p.size})` }}
            initial={still ? false : { scale: 0, rotate: -90, opacity: 0 }}
            animate={still ? { opacity: 1 } : { scale: 1, opacity: 1, rotate: [p.spin, p.spin + 12, p.spin - 8, p.spin] }}
            transition={still ? undefined : { scale: { type: 'spring', stiffness: 260, damping: 14 }, opacity: { duration: 0.3 }, rotate: { duration: 6 + (i % 4), repeat: Infinity, ease: 'easeInOut' } }}>
            {img
              ? <img src={img} alt="" className="w-full h-full object-contain" />
              : <Star weight="fill" className="w-full h-full drop-shadow-[0_0_10px_rgba(255,220,120,0.7)]" color={colors?.[i] ?? pieceColor(theme, 'item-1', '#ffd166')} />}
          </motion.span>
        );
      })}
    </div>
  );
}
