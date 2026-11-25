import { useLayoutEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { TEAM_COLORS } from '../../engine/turns';

// Game Show's Classic world (the approved mockup, /brand Games, teacher
// 2026-11-24): a flat crayon TV studio (pink curtains and scalloped valance,
// lavender spotlights on a Grape backdrop, a lemon stage floor) around a
// purple bulb marquee. Drawn from the mockup's StudioBack and Marquee (copied
// here because games do not import from src/brand), sized to the real screen.
export const STUDIO = {
  grape: '#6a45f0', grapeDeep: '#1d1a33', lavender: '#ddd6ff', pink: '#f055a5',
  lemon: '#fabe37', orange: '#ff9b28', butter: '#fff1b8', paper: '#fffaf0', ink: '#1d1a33',
};
const I = STUDIO.ink;

// A team's pastel for its won cards: the team color mixed with paper, so the
// small badge in the corner and the card read as one team.
// Each team color's own pastel pair from the palette (Art Director, 2026-11-25),
// never a computed tint, in TEAM_COLORS order.
const TEAM_PASTELS = ['#fff1b8', '#c8f0dc', '#bfdff3', '#ffd9b3', '#ddd6ff', '#ffd3e6', '#e8f0b4', '#c9f1ee', '#ddd6ff', '#fffaf0'];
export const teamPastel = (colorIndex: number) => TEAM_PASTELS[colorIndex % TEAM_COLORS.length];

// Measures a box so the studio is drawn at its real size (curtains never stretch).
// A callback ref, so it follows the box when it appears (play starts) or goes.
export function useBoxSize<T extends HTMLElement>() {
  const [el, ref] = useState<T | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0, rem: 16 });
  useLayoutEffect(() => {
    if (!el) return;
    const read = () => {
      const r = el.getBoundingClientRect();
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      setSize((s) => (Math.round(s.w) === Math.round(r.width) && Math.round(s.h) === Math.round(r.height) && s.rem === rem ? s : { w: r.width, h: r.height, rem }));
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    window.addEventListener('resize', read);
    return () => { ro.disconnect(); window.removeEventListener('resize', read); };
  }, [el]);
  return [ref, size] as const;
}

// The studio backdrop, edge to edge behind the board. `back` is the teacher's
// own background color for this game when she picked one (2026-11-01).
export function StudioBack({ w, h, rem, back = STUDIO.grape }: { w: number; h: number; rem: number; back?: string }) {
  if (w < 10 || h < 10) return null;
  // Curtains: about 8.5% of the width each side, never thinner than 2.6rem.
  const c = Math.max(w * 0.085, rem * 2.6);
  const band = rem * 1.5;
  const dip = rem * 2.4;
  const floor = h * 0.86;
  const curtain = (flip: boolean) => {
    const x = (v: number) => (flip ? w - v : v);
    return (
      <g>
        <path d={`M${x(-4)} 0 L${x(c)} 0 C${x(c - 14)} ${h * 0.28} ${x(c + 16)} ${h * 0.55} ${x(c - 4)} ${h * 0.84} L${x(c * 0.2)} ${h * 0.9} L${x(-4)} ${h * 0.9} Z`} fill={STUDIO.pink} stroke={I} strokeWidth="4" strokeLinejoin="round" />
        {[0.3, 0.62].map((f) => <path key={f} d={`M${x(c * f)} 8 C${x(c * f - 6)} ${h * 0.3} ${x(c * f + 8)} ${h * 0.6} ${x(c * f - 2)} ${h * 0.86}`} fill="none" stroke={I} strokeWidth="2.4" strokeLinecap="round" />)}
        {/* the tie-back */}
        <rect x={flip ? w - c - 4 : -6} y={h * 0.5} width={c + 10} height={rem * 0.85} rx={rem * 0.42} fill={STUDIO.lemon} stroke={I} strokeWidth="3" />
      </g>
    );
  };
  const n = Math.max(6, Math.round(w / (rem * 4.4)));
  const scallops = Array.from({ length: n }, (_, i) => {
    const a = (i * w) / n, b = ((i + 1) * w) / n;
    return <path key={i} d={`M${a} ${band - 4} Q${(a + b) / 2} ${band + dip} ${b} ${band - 4} Z`} fill={STUDIO.pink} stroke={I} strokeWidth="4" strokeLinejoin="round" />;
  });
  return (
    <svg className="absolute inset-0 pointer-events-none" width={w} height={h} aria-hidden="true" data-studio="">
      <rect width={w} height={h} fill={back} />
      {/* spotlight beams, opaque lavender, behind everything else */}
      <path d={`M${w * 0.2} 0 L${w * 0.28} 0 L${w * 0.46} ${floor} L${w * 0.08} ${floor} Z`} fill={STUDIO.lavender} />
      <path d={`M${w * 0.72} 0 L${w * 0.8} 0 L${w * 0.92} ${floor} L${w * 0.54} ${floor} Z`} fill={STUDIO.lavender} />
      {/* the stage floor and its boards */}
      <path d={`M-4 ${floor} C${w * 0.3} ${floor - 8} ${w * 0.7} ${floor + 6} ${w + 4} ${floor - 4} L${w + 4} ${h + 4} L-4 ${h + 4} Z`} fill={STUDIO.lemon} stroke={I} strokeWidth="4" strokeLinejoin="round" />
      {Array.from({ length: 9 }, (_, i) => <path key={i} d={`M${(w / 9) * i + 20} ${floor + 14} l14 ${Math.max(4, h - floor - 22)}`} stroke={STUDIO.orange} strokeWidth="5" strokeLinecap="round" />)}
      {curtain(false)}{curtain(true)}
      {scallops}
      <rect x="-4" y="-4" width={w + 8} height={band + 4} fill={STUDIO.pink} stroke={I} strokeWidth="4" />
    </svg>
  );
}

// The purple bulb marquee round the board: bulbs on the top and bottom edges
// that chase (lemon and paper swap) when motion is full.
export function Marquee({ children, bulbs, chase, className = '', style }: { children: ReactNode; bulbs: number; chase: boolean; className?: string; style?: CSSProperties }) {
  return (
    <div className={`relative rounded-[1.6rem] ${className}`} style={{ background: STUDIO.grape, border: `4px solid ${I}`, boxShadow: `0 6px 0 ${STUDIO.grapeDeep}`, padding: 'var(--gs-rim)', ...style }}>
      {(['top', 'bottom'] as const).map((s) => (
        <span key={s} className="absolute inset-x-[1.4rem] flex justify-between pointer-events-none" style={{ [s]: 'calc(var(--gs-rim) / 2 - 0.34rem)' }} aria-hidden="true">
          {Array.from({ length: bulbs }, (_, i) => (
            <span key={i} className={`w-[0.68rem] h-[0.68rem] rounded-full ${chase ? (i % 2 ? 'gs-bulb gs-bulb-b' : 'gs-bulb') : ''}`}
              style={{ background: i % 2 ? STUDIO.paper : STUDIO.lemon, border: `1.5px solid ${I}` }} />
          ))}
        </span>
      ))}
      <div className="rounded-[0.9rem]" style={{ background: STUDIO.lavender, border: `3px solid ${I}`, padding: 'var(--gs-inner)' }}>{children}</div>
    </div>
  );
}

// The crayon sparkle on every closed card, and the doodle confetti round the prize card.
export type DoodleKind = 'sparkle' | 'star' | 'dot' | 'heart';
const star = (cx: number, cy: number, r: number) => Array.from({ length: 10 }, (_, k) => { const rr = k % 2 ? r * 0.45 : r; const a = (-90 + k * 36) * Math.PI / 180; return `${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`; }).join(' ');
export function Doodle({ kind, color, size, className, style }: { kind: DoodleKind; color: string; size: number | string; className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" overflow="visible" className={className} style={style}>
      {kind === 'sparkle' && <path d="M12 1 C13 8 16 11 23 12 C16 13 13 16 12 23 C11 16 8 13 1 12 C8 11 11 8 12 1 Z" fill={color} stroke={I} strokeWidth="1.8" strokeLinejoin="round" />}
      {kind === 'star' && <polygon points={star(12, 12.5, 10.5)} fill={color} stroke={I} strokeWidth="1.8" strokeLinejoin="round" />}
      {kind === 'dot' && <circle cx="12" cy="12" r="4.5" fill={color} stroke={I} strokeWidth="1.8" />}
      {kind === 'heart' && <path d="M12 21 C6 17 2 13 2 8.5 C2 5 4.5 3 7.5 3 C9.5 3 11 4.5 12 6.5 C13 4.5 14.5 3 16.5 3 C19.5 3 22 5 22 8.5 C22 13 18 17 12 21 Z" fill={color} stroke={I} strokeWidth="1.8" strokeLinejoin="round" />}
    </svg>
  );
}
// Placed by hand round the prize card so it stays at the edges, never on text.
export const PRIZE_CONFETTI: [DoodleKind, string, string, string, number][] = [
  ['sparkle', STUDIO.lemon, '-1.6rem', '8%', 2.1], ['star', STUDIO.pink, '96%', '6%', 1.8], ['dot', '#4ba3e8', '-1.2rem', '72%', 1],
  ['heart', STUDIO.pink, '97%', '70%', 1.5], ['sparkle', STUDIO.paper, '46%', '-1.7rem', 1.6], ['star', '#22b04a', '-2rem', '38%', 1.4], ['dot', STUDIO.lemon, '100%', '36%', 0.9],
];
