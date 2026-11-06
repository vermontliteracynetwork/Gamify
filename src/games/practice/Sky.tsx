import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Star } from '@phosphor-icons/react';
import { pieceColor, pieceImage } from '../../theme/library';
import { classicTheme } from '../../theme/classic';
import type { GameTheme } from '../../theme/types';

// Question Tracker's play screen: a sky that fills up, one item (a star by
// default, or a theme's own items, like fish or safari animals) for every
// right answer. Items come in different sizes and slowly turn.

// Combo stars for answers right in a row (teacher, 2026-11-06): 3 glowing,
// 5 mega, 10 spinning, 15 shooting (it flies around the sky), 20 pulsing,
// 25 rainbow; then from 30 the same order again every 5. A miss starts the
// count over; every star in between is a regular one.
export type StarFx = 'glow' | 'mega' | 'spin' | 'shoot' | 'pulse' | 'rainbow';
const FX_ORDER: StarFx[] = ['glow', 'mega', 'spin', 'shoot', 'pulse', 'rainbow'];
const FIRST: Record<number, StarFx> = { 3: 'glow', 5: 'mega', 10: 'spin', 15: 'shoot', 20: 'pulse', 25: 'rainbow' };
export function comboFx(run: number): StarFx | undefined {
  if (run < 30) return FIRST[run];
  return run % 5 === 0 ? FX_ORDER[((run - 30) / 5) % FX_ORDER.length] : undefined;
}

const ITEM_PIECES = ['item-1', 'item-2', 'item-3', 'item-4', 'item-5', 'item-6'];

// Items fill the open sky around the question box (it sits over the sky),
// so every one stays in view as questions are answered (teacher,
// 2026-10-24). The box is measured on screen; the open strips above, below
// and beside it each get a jittered grid, shuffled with a fixed seed so the
// layout stays put. Sizes vary a lot, from small to big.
export interface Hole { l: number; t: number; r: number; b: number } // % of the sky
export interface SkySpot { x: number; y: number; size: number; spin: number; unit: string }
const DEFAULT_HOLE: Hole = { l: 15, t: 22, r: 85, b: 68 };

export function skySpots(count: number, seed = 7, hole: Hole | null = DEFAULT_HOLE, aspect = 0.7, skipTop = false): SkySpot[] {
  let s = seed;
  const rand = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  // Open strips as [left, top, width, height] in %, kept if big enough to hold an item.
  const h = hole ?? { l: 50, t: 50, r: 50, b: 50 };
  const strips = (hole ? [[0, 0, 100, skipTop ? 0 : h.t], [0, h.b, 100, 100 - h.b], [0, h.t, h.l, h.b - h.t], [h.r, h.t, 100 - h.r, h.b - h.t]] : [[0, 0, 100, 100]])
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
    cells.slice(0, n).forEach((c) => { const spin = (rand() - 0.5) * 100; const size = 0.2 + rand() * 0.75; out.push({
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
// `bleed`: edge to edge, no rounded frame (the sky is the whole game space).
// `seed`: a new sky layout each game. `golden`: stars earned on a streak of
// first-try answers shine gold (Golden Rule pass, 2026-10-31).
// `hole` overrides the measured question box (the live big screen keeps a
// corner free for its leaderboard); `bottomGap` keeps a strip at the bottom
// (in % of the height) free for the goal bar (teacher, 2026-11-06).
export default function Sky({ theme, filled, total, still, label, colors, height = 'calc(100dvh - 11.875rem + var(--chrome-save, 0rem))', bleed = false, seed = 7, fx, hole: holeProp, bottomGap = 0 }: { theme: GameTheme; filled: number; total: number; still: boolean; label: string; colors?: string[]; height?: string; bleed?: boolean; seed?: number; fx?: (StarFx | undefined)[]; hole?: Hole | null; bottomGap?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const measured = useHole(ref);
  const aspect = measured.aspect;
  const hole = holeProp !== undefined ? holeProp : measured.hole;
  // A room theme: pets stand on the floor, below the wall, upright and evenly
  // sized; nothing hangs on the wall above the question box.
  const room = theme.room;
  const spots = room
    ? skySpots(total, seed, { l: hole?.l ?? 50, r: hole?.r ?? 50, t: room.floor, b: Math.max(hole?.b ?? 0, room.floor + 4) }, aspect, true).map((p) => ({ ...p, spin: 0, size: 0.6 + (p.size - 0.2) * 0.4 }))
    : skySpots(total, seed, hole, aspect).map((p) => (bottomGap ? { ...p, y: p.y * (100 - bottomGap) / 100 } : p));
  // Items a theme leaves empty keep the Classic look (the teacher's stars).
  const own = theme.itemImages?.length ? theme.itemImages : ITEM_PIECES.map((id) => pieceImage(theme, id)).filter(Boolean) as string[];
  const items = own.length ? own : ITEM_PIECES.map((id) => pieceImage(classicTheme(theme.gameId), id)).filter(Boolean) as string[];
  const dust = skySpots(36, 3, null, aspect);
  // Each star's kind differs from its near neighbors (teacher, 2026-10-31).
  const kinds = useMemo(() => pickKinds(spots, Math.max(1, items.length), aspect), [spots, items.length, aspect]);
  // Each new star arrives as a shooting star from a corner of the sky.
  const flying = !still && !room;
  const [comet, setComet] = useState<{ id: number; i: number; fromLeft: boolean } | null>(null);
  const prev = useRef(filled);
  useEffect(() => {
    if (filled > prev.current && flying) setComet({ id: Date.now(), i: filled - 1, fromLeft: Math.random() < 0.5 });
    prev.current = filled;
  }, [filled, flying]);
  return (
    <div ref={ref} className={`relative w-full overflow-hidden ${bleed ? '' : 'rounded-panel border-[2.5px] border-border'}`} role="img" aria-label={label}
      style={{ containerType: 'size', height, background: theme.pieces.background?.image ? `center / cover url("${theme.pieces.background.image}")` : `linear-gradient(180deg, #0d1638 0%, ${theme.colors.background} ${40 + (filled / total) * 60}%)` }}>
      {!theme.pieces.background?.image && dust.map((d, i) => (
        <span key={`d${i}`} className="absolute rounded-full bg-white" style={{ left: `${d.x}%`, top: `${d.y}%`, width: 2 + (i % 3), height: 2 + (i % 3), opacity: 0.25 + 0.5 * (filled / total) }} aria-hidden="true" />
      ))}
      {comet && spots[comet.i] && (() => {
        const to = spots[comet.i];
        const from = { x: comet.fromLeft ? -5 : 105, y: -5 };
        const ang = (Math.atan2((to.y - from.y) / Math.max(0.3, aspect), to.x - from.x) * 180) / Math.PI;
        return (
          <motion.span key={comet.id} aria-hidden="true" className="absolute pointer-events-none" style={{ width: 0, height: 0 }}
            initial={{ left: `${from.x}%`, top: `${from.y}%`, opacity: 1 }} animate={{ left: `${to.x}%`, top: `${to.y}%`, opacity: [1, 1, 0] }} transition={{ duration: 0.6, ease: 'easeIn', opacity: { duration: 0.75, times: [0, 0.8, 1] } }}>
            <span className="absolute right-0 top-0 h-[4px] w-[18cqw] -translate-y-1/2 rounded-full origin-right" style={{ transform: `rotate(${ang}deg)`, background: 'linear-gradient(90deg, transparent, rgba(255,240,180,0.9))' }} />
            <span className="absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" style={{ boxShadow: '0 0 12px 4px #ffe9a0' }} />
          </motion.span>
        );
      })()}
      {spots.map((p, i) => {
        if (i >= filled) return null;
        const img = items.length && !colors ? items[kinds[i] % items.length] : undefined;
        const f = fx?.[i];
        const glow = f === 'glow' || f === 'mega' || f === 'pulse' || f === 'shoot';
        const late = comet?.i === i ? 0.55 : 0; // pops in when its shooting star lands
        const grow = f === 'mega' ? 1.3 : f === 'rainbow' ? 1.2 : 1;
        const body = f === 'rainbow'
          ? <RainbowStar />
          : img
            ? <img src={img} alt="" className={`relative w-full h-full object-contain ${room ? 'object-bottom' : ''}`} style={{ ...(theme.pixelArt ? { imageRendering: 'pixelated' as const } : {}), ...(glow ? { filter: 'drop-shadow(0 0 6px #ffd23f) drop-shadow(0 0 2px #fff6c2)' } : {}) }} />
            : <Star weight="fill" className="relative w-full h-full drop-shadow-[0_0_10px_rgba(255,220,120,0.7)]" color={glow ? '#ffc93c' : colors?.[i] ?? pieceColor(theme, 'item-1', '#ffd166')} />;
        return (
          <motion.span key={i} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${p.x}%`, top: `${p.y}%`, width: `calc(${p.unit} * ${p.size * grow})`, height: `calc(${p.unit} * ${p.size * grow})`, zIndex: f ? 2 : undefined }}
            initial={still ? false : room ? { y: '-120%', opacity: 0, scale: 0.6 } : { scale: 0, rotate: -90, opacity: 0 }}
            animate={still ? { opacity: 1 } : room ? { y: ['0%', '-8%', '0%'], opacity: 1, scale: 1 } : { scale: 1, opacity: 1, rotate: [p.spin, p.spin + 12, p.spin - 8, p.spin] }}
            transition={still ? undefined : room
              ? { scale: { type: 'spring', stiffness: 300, damping: 12 }, opacity: { duration: 0.25 }, y: { duration: 1.4 + (i % 3) * 0.3, repeat: Infinity, ease: 'easeInOut', delay: 0.4 + (i % 5) * 0.2 } }
              : { scale: { type: 'spring', stiffness: 260, damping: 14, delay: late }, opacity: { duration: 0.3, delay: late }, rotate: { duration: 6 + (i % 4), repeat: Infinity, ease: 'easeInOut' } }}>
            {f ? (
              <span className={`absolute inset-0 qt-${f}`}>
                {(glow || f === 'rainbow') && <span aria-hidden="true" className="absolute -inset-[22%] rounded-full qt-gold" style={{ background: f === 'rainbow' ? 'radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(180,140,255,0.35) 45%, transparent 70%)' : 'radial-gradient(circle, rgba(255,215,90,0.8) 0%, rgba(255,200,60,0.35) 45%, transparent 70%)' }} />}
                {f === 'shoot' && <span aria-hidden="true" className="absolute right-1/2 top-1/2 -translate-y-1/2 h-[18%] w-[260%] rounded-pill" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,240,170,0.9))' }} />}
                {body}
              </span>
            ) : body}
          </motion.span>
        );
      })}
    </div>
  );
}

// Gives each spot a kind so no two close stars match: the kind least used
// that no nearby spot already has (in screen distance, using the sky's shape).
export function pickKinds(spots: SkySpot[], n: number, aspect = 1): number[] {
  const out: number[] = [];
  const used = Array.from({ length: n }, () => 0);
  spots.forEach((p, i) => {
    const near = new Set<number>();
    spots.slice(0, i).forEach((q, j) => { const dx = (p.x - q.x) * aspect, dy = p.y - q.y; if (Math.hypot(dx, dy) < 28) near.add(out[j]); });
    const order = Array.from({ length: n }, (_, k) => (k + i) % n).sort((a, b) => used[a] - used[b]);
    const k = order.find((c) => !near.has(c)) ?? order[0];
    out.push(k); used[k] += 1;
  });
  return out;
}

// The rainbow star, drawn here (teacher, 2026-11-06): striped bands in a star.
function RainbowStar() {
  const bands = ['#ff1f2d', '#ff9f00', '#ffde00', '#72c456', '#38b8f8', '#005fdf', '#ae1fc4'];
  return (
    <svg viewBox="0 0 100 100" className="relative w-full h-full" aria-hidden="true">
      <defs>
        <clipPath id="rainbow-star"><path d="M50 4 L62 34 L95 37 L70 59 L78 92 L50 75 L22 92 L30 59 L5 37 L38 34 Z" strokeLinejoin="round" /></clipPath>
      </defs>
      <g clipPath="url(#rainbow-star)">
        {bands.map((c, k) => <path key={c} d={`M0 ${k * 14} Q50 ${k * 14 + 10} 100 ${k * 14 + 2} L100 ${k * 14 + 16} Q50 ${k * 14 + 24} 0 ${k * 14 + 14} Z`} fill={c} />)}
        <rect x="0" y="96" width="100" height="10" fill="#ae1fc4" />
      </g>
    </svg>
  );
}
