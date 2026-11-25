import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { t } from '../../i18n';
import { TeamBadge } from '../../engine/TeamBadge';
import type { TurnPlayer } from '../../engine/turns';
import { scaleAt } from './lane';

// Bowling's Classic alley (teacher, 2026-11-24: "massive improvements needed
// for bowling layout and design"; the approved /brand mockup, Game mockups,
// Bowling). Drawn from scratch in the brand palette: a cream wall band of
// cut-paper confetti over a Lemon rail, a Lavender floor, a big warm lane in
// one-point perspective, chunky white pins with Pink stripes, flat balls.

export const INK = '#1d1a33';
export const C = {
  ink: INK, paper: '#fffaf0', cream: '#f6f0e4', lavender: '#ddd6ff', grape: '#6a45f0', peach: '#ffd9b3', orange: '#ff9b28',
  lemon: '#fabe37', butter: '#fff1b8', pink: '#f055a5', teal: '#1fb5a8', lime: '#ccd537', sky: '#4ba3e8', kelly: '#22b04a',
};

// Ten Classic balls, one per player color: the brand brights (Ink last, with paper finger holes).
export const BALL_COLORS = [C.grape, C.pink, C.kelly, C.sky, C.orange, C.teal, C.lemon, C.lime, C.lavender, INK];
const holeFor = (c: string) => (c === INK ? C.paper : INK);
// A flat ball as an SVG file, so it can be each player's icon everywhere
// (scores, question header, results) as well as the ball they roll.
export function ballUrl(k: number): string {
  const c = BALL_COLORS[k % BALL_COLORS.length];
  const h = holeFor(c);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="${c}" stroke="${INK}" stroke-width="6"/><circle cx="42" cy="34" r="6" fill="${h}"/><circle cx="58" cy="32" r="6" fill="${h}"/><circle cx="52" cy="48" r="6" fill="${h}"/><path d="M28 36 q4 -10 14 -12" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
// The rolling ball on the lane (radius 50 units, centered): the finger holes
// turn with the roll, the shine stays top left.
export function FlatBall({ color, spin }: { color: string; spin: number }) {
  const h = holeFor(color);
  return (
    <>
      <circle r={45} fill={color} stroke={INK} strokeWidth={6} />
      <g transform={`rotate(${spin})`}>{[[-8, -16], [8, -18], [2, -2]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={6} fill={h} />)}</g>
      <path d="M-22 -14 q4 -10 14 -12" stroke="#fff" strokeWidth={7} fill="none" strokeLinecap="round" />
    </>
  );
}

// The chunky Classic pin (64 x 200 units, base at y 196): small round head,
// thin neck, wide belly, flat base, two Pink stripes.
export const PIN_PATH = 'M32 6 C44 6 46 24 42 40 C40 50 38 56 44 72 C56 104 60 140 54 172 C52 186 44 194 32 194 C20 194 12 186 10 172 C4 140 8 104 20 72 C26 56 24 50 22 40 C18 24 20 6 32 6 Z';
export function ClassicPin({ fill, k }: { fill: string; k: number }) {
  return (
    <g transform="translate(-32 -196)">
      <path d={PIN_PATH} fill={fill} stroke={INK} strokeWidth={Math.max(2.5, Math.min(4, k * 9))} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <path d="M22 58 H42 M20 70 H44" stroke={C.pink} strokeWidth={9} strokeLinecap="round" />
      <path d="M26 16 C24 22 24 28 26 32" stroke="#fff" strokeWidth={6} fill="none" strokeLinecap="round" />
    </g>
  );
}

// The lane in screen pixels. Physics depth d runs 0 (foul line) to 1 (pit);
// the lane narrows in true perspective, so pins and ball shrink with depth
// the way the edges do (half width = near half width x scaleAt(d)).
export type Alley = { W: number; H: number; cx: number; top: number; near: number; hN: number; Y: (d: number) => number; HW: (d: number) => number; X: (laneX: number, d: number) => number; S: (d: number) => number; ballR: number; portrait: boolean; edgeAt: (y: number) => number };
const FAR = scaleAt(1);
export function alley(W: number, H: number, top: number, portrait: boolean): Alley {
  const hN = portrait ? Math.min(W * 0.34, H * 0.3) : Math.min(W * 0.235, H * 0.42);
  const near = H - Math.max(14, H * 0.045);
  const frac = (d: number) => (1 - scaleAt(d)) / (1 - FAR); // 0 near, 1 far end
  const Y = (d: number) => near - frac(d) * (near - top);
  const S = (d: number) => scaleAt(d);
  const HW = (d: number) => hN * scaleAt(d);
  // Half width at any screen y (straight edges), for the gutters and the tap.
  const edgeAt = (y: number) => { const f = (near - y) / (near - top); return hN * (1 - (1 - FAR) * f); };
  return { W, H, cx: W / 2, top, near, hN, Y, HW, S, X: (laneX, d) => W / 2 + (laneX / 1.25) * HW(d), ballR: hN * 0.24, portrait, edgeAt };
}

// Cut-paper confetti on the cream wall (teal blobs, Pink and Grape crosses,
// Lime and Sky triangles, Orange and Kelly dots), placed on a jittered grid
// from a fixed seed so it never jumps between turns.
function rng(seed: number) { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
// Pastels only, so the pins and the meter stand out from the wall.
const WALL_PASTELS = ['#ddd6ff', '#ffd3e6', '#bfdff3', '#fff1b8', '#c8f0dc'];
export function WallConfetti({ w, h, calm }: { w: number; h: number; calm: boolean }) {
  const r = rng(7);
  const cell = Math.max(58, Math.min(86, Math.max(w, h * 1.6) / 16));
  const marks: ReactNode[] = [];
  let n = 0;
  for (let y = cell * 0.35; y < h - cell * 0.15; y += cell * 0.82) {
    for (let x = (n % 2) * cell * 0.5; x < w + cell; x += cell) {
      n++;
      if (r() < (calm ? 0.55 : 0.12)) continue;
      const px = x + (r() - 0.5) * cell * 0.6, py = y + (r() - 0.5) * cell * 0.45;
      // Quiet wall (Art Director, 2026-11-25): clear behind the pin deck.
      if (Math.abs(px - w / 2) < w * 0.2) continue;
      // Mostly blobs, crosses and triangles (the mockup's wall), a few bars and dots.
      const kind = [0, 1, 2, 1, 2, 0, 3, 4][Math.floor(r() * 8)];
      const s = cell * (kind === 4 ? 0.05 : 0.11 + r() * 0.06) * (calm ? 0.8 : 1);
      const c = WALL_PASTELS[Math.floor(r() * WALL_PASTELS.length)];
      const rot = Math.round((r() - 0.5) * 60);
      const shape = kind === 0
        ? <path d={`M${-s} ${-s * 0.2} C${-s} ${-s * 1.1} ${s * 0.9} ${-s * 1.1} ${s} ${-s * 0.1} C${s * 1.1} ${s * 0.9} ${-s * 0.2} ${s * 1.1} ${-s * 0.7} ${s * 0.6} C${-s * 1.1} ${s * 0.3} ${-s} ${0} ${-s} ${-s * 0.2} Z`} fill={c} />
        : kind === 1
          ? <path d={`M${-s * 0.32} ${-s} h${s * 0.64} v${s * 0.68} h${s * 0.68} v${s * 0.64} h${-s * 0.68} v${s * 0.68} h${-s * 0.64} v${-s * 0.68} h${-s * 0.68} v${-s * 0.64} h${s * 0.68} Z`} fill={c} stroke={c} strokeWidth={3} strokeLinejoin="round" />
          : kind === 2
            ? <polygon points={`0,${-s * 0.95} ${s * 0.9},${s * 0.6} ${-s * 0.9},${s * 0.6}`} fill={c} stroke={c} strokeWidth={4} strokeLinejoin="round" />
            : kind === 3
              ? <rect x={-s} y={-s * 0.3} width={s * 2} height={s * 0.6} rx={s * 0.3} fill={c} />
              : <circle r={s * 1.4} fill={c} />;
      marks.push(<g key={n} transform={`translate(${px.toFixed(1)} ${py.toFixed(1)}) rotate(${rot})`} opacity={calm ? 0.45 : 1}>{shape}</g>);
    }
  }
  return <g aria-hidden="true">{marks}</g>;
}

// One frame on the sheet: X for a strike, / for a spare, else the running total.
// Grow Year, all capitals, for totals and result pills (the mockup's display line).
export const GY = { fontFamily: 'var(--font-display)', fontWeight: 400, textTransform: 'uppercase' as const, letterSpacing: '0.01em' };

export type FrameMark = { mark: string };

// The player list (Brand Kit scoreboard rows, teacher 2026-11-24): the ball,
// the name and the total; Butter shading is the only turn signal; whoever is
// up opens to show their frames as a small strip (the standard score sheet,
// teacher 2026-11-23: "show bowling as regular format socreboard not rounds").
export function BowlCards({ players, now, sheet, frames, frame, compact, row, playing, still }: {
  players: TurnPlayer[]; now: string | null; sheet: Record<string, FrameMark[]>; frames: number; frame: number; compact: boolean; row: boolean; playing: boolean; still: boolean;
}) {
  const nowP = players.find((p) => p.id === now);
  return (
    <aside aria-label={t('share.scores')} className="min-w-0">
      <ol className={`list-none m-0 p-0 flex ${row ? 'flex-row flex-wrap justify-center items-start' : 'flex-col'} ${compact ? 'gap-1.5' : 'gap-2.5'}`}>
        {players.map((p) => {
          const on = playing && p.id === now;
          const marks = sheet[p.id] ?? [];
          return (
            <li key={p.id} aria-current={on ? 'true' : undefined} className={`grid ${compact && !on ? 'gap-1 rounded-[1rem] px-2 py-1' : 'gap-2 rounded-[1.35rem] p-2.5'} ${row ? (compact ? 'w-[12.5rem]' : 'w-[15rem]') : 'w-full'}`}
              style={{ background: on ? 'var(--butter)' : 'var(--paper)', border: `3px solid ${INK}`, boxShadow: `0 4px 0 ${INK}`, order: row && on ? -1 : undefined }}>
              <span className="flex items-center gap-2.5 min-w-0">
                <TeamBadge colorIndex={p.colorIndex} size={compact && !on ? 28 : 40} />
                {/* Whole names, never cut off (teacher, 2026-11-16). */}
                <b className={`flex-1 min-w-0 break-words leading-tight ${compact && !on ? 'text-base' : 'text-lg'}`}>{p.name}</b>
                <motion.span key={p.score} initial={still ? false : { scale: 1.3 }} animate={{ scale: 1 }} className={`tabular-nums leading-none ${compact && !on ? 'text-2xl' : 'text-[2.25rem]'}`} style={GY} aria-label={t('share.points', { count: p.score })}>{p.score}</motion.span>
              </span>
              {on && (
                <span className="grid grid-cols-5 gap-1 justify-items-center" role="img" aria-label={t('sb.sheet', { name: p.name, marks: marks.map((m) => m.mark).join(', ') || '-' })}>
                  {Array.from({ length: frames }, (_, fi) => {
                    const mark = marks[fi]?.mark ?? '';
                    return (
                      <span key={fi} className="w-[1.9rem] h-[1.9rem] grid place-items-center rounded-[0.5rem] font-display tabular-nums leading-none"
                        style={{ fontSize: mark.length > 2 ? '0.7rem' : mark.length > 1 ? '0.85rem' : '1.05rem', background: fi === frame ? 'var(--lemon)' : 'var(--paper)', border: `2px solid ${INK}` }}>{mark}</span>
                    );
                  })}
                </span>
              )}
            </li>
          );
        })}
      </ol>
      {nowP && playing && <p className="sr-only" aria-live="polite">{t('share.whoseTurn', { name: nowP.name })}</p>}
    </aside>
  );
}
