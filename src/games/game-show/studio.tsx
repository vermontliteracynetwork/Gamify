import { useLayoutEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { TEAM_COLORS } from '../../engine/turns';
import { TeamBadge } from '../../engine/TeamBadge';
import ItemArt from '../../theme/ItemArt';
import { backdropStyle, pieceColor } from '../../theme/library';
import type { GameTheme } from '../../theme/types';
import type { CardKind } from './cards';

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

// The studio's colors. Classic wears the approved ones; any other theme
// (starter, house, a teacher's or class-made one, the Features page's Try it)
// gets the same studio drawn from its own colors (owner, 2026-11-26): its
// background behind the curtains (its pattern or picture too), its accent on
// the curtains, its grid-square color on the stage floor, the spotlights and
// the marquee's lit panel tinted from its background. Whatever a theme leaves
// at Classic keeps Classic's color, and a color that would vanish into the
// one beside it steps to the next palette color, so every part stays readable.
export interface StudioLook {
  back: string; beam: string; beamOpacity: number; curtain: string; tie: string; floor: string; boards: string;
  rim: string; rimShadow: string; inner: string; bulbA: string; bulbB: string;
  // The dashed inset on a closed card, in a color that shows on the card.
  dash: string;
  // The theme's own backdrop (pattern or picture) behind the studio, when it has one.
  ground?: CSSProperties;
}
export const CLASSIC_STUDIO: StudioLook = {
  back: STUDIO.grape, beam: STUDIO.lavender, beamOpacity: 1, curtain: STUDIO.pink, tie: STUDIO.lemon, floor: STUDIO.lemon, boards: STUDIO.orange,
  rim: STUDIO.grape, rimShadow: STUDIO.grapeDeep, inner: STUDIO.lavender, bulbA: STUDIO.lemon, bulbB: STUDIO.paper, dash: STUDIO.orange,
};
// Classic Game Show's own theme colors (src/theme/classic.ts), to tell what a theme changed.
const CLASSIC_BG = '#6a45f0', CLASSIC_ACCENT = '#fdfd94';

const rgb = (hex: string) => {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return [128, 128, 128];
  const h = m[1].length === 3 ? m[1].split('').map((c) => c + c).join('') : m[1];
  return [0, 2, 4].map((k) => parseInt(h.slice(k, k + 2), 16));
};
const same = (a: string, b: string) => rgb(a).join() === rgb(b).join();
// Mixes a toward b by f (0..1), as a hex color.
export function mix(a: string, b: string, f: number): string {
  const x = rgb(a), y = rgb(b);
  return `#${x.map((v, k) => Math.round(v + (y[k] - v) * f).toString(16).padStart(2, '0')).join('')}`;
}
// How far apart two colors look (a weighted RGB distance, the "redmean" formula).
function apart(a: string, b: string): number {
  const [r1, g1, b1] = rgb(a), [r2, g2, b2] = rgb(b);
  const rm = (r1 + r2) / 2, dr = r1 - r2, dg = g1 - g2, db = b1 - b2;
  return Math.sqrt((2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db);
}
const CLEAR = 150;
// The first color that stands apart from every neighbour (or the first one, if none does).
const pick = (want: (string | undefined)[], near: string[]) => {
  const list = want.filter((c): c is string => !!c);
  return list.find((c) => near.every((n) => apart(c, n) >= CLEAR)) ?? list[0];
};

// `plain` and `calm` follow the teacher's Backgrounds and Calm settings, as the page backdrop does.
// A dark ground's spotlight is the palette pastel of its nearest hue (Classic's
// Grape gets Lavender), never a grey tint of the dark color.
const PAIRS: [string, string][] = [['#7a88fe', '#b4c4fb'], ['#6a45f0', '#ddd6ff'], ['#4ba3e8', '#bfdff3'], ['#f055a5', '#ffd3e6'], ['#fabe37', '#fff1b8'],
  ['#ff9b28', '#ffd9b3'], ['#22b04a', '#c8f0dc'], ['#1fb5a8', '#c9f1ee'], ['#ccd537', '#e8f0b4']];
const hue = (hex: string) => {
  const [r, g, b] = rgb(hex), mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  if (!d) return -1;
  const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
};
const dark = (hex: string) => { const [r, g, b] = rgb(hex); return 0.299 * r + 0.587 * g + 0.114 * b < 96; };
function pastelFor(hex: string): string {
  const h = hue(hex);
  if (h < 0) return STUDIO.lavender;
  const gap = (x: number) => Math.min(Math.abs(x - h), 360 - Math.abs(x - h));
  return PAIRS.reduce((best, p) => (gap(hue(p[0])) < gap(hue(best[0])) ? p : best))[1];
}

export function studioLook(theme: GameTheme, stage?: string, { plain = false, calm = false }: { plain?: boolean; calm?: boolean } = {}): StudioLook {
  const back = stage ?? theme.colors.background;
  const ownBack = !same(back, CLASSIC_BG);
  const ownAccent = !same(theme.colors.accent, CLASSIC_ACCENT);
  const card = pieceColor(theme, 'card-back', STUDIO.butter);
  const square = theme.pieces.square?.color;
  const picture = !stage && !plain && theme.backdrop.kind === 'image';
  const ground = !stage && !plain && theme.backdrop.kind !== 'color' ? backdropStyle(theme, false, calm) : undefined;
  if (!ownBack && !ownAccent && same(card, STUDIO.butter) && !square && !ground) return CLASSIC_STUDIO;
  const beam = !ownBack ? STUDIO.lavender : dark(back) ? pastelFor(back) : mix(back, '#ffffff', 0.62);
  const curtain = ownAccent ? pick([theme.colors.accent, STUDIO.pink, STUDIO.orange], [back]) : pick([STUDIO.pink, STUDIO.orange, '#4ba3e8', '#22b04a'], [back, card]);
  const floor = pick([square && !same(square, card) ? square : undefined, STUDIO.lemon, STUDIO.orange, STUDIO.paper], [curtain, back]);
  const rim = ownBack ? mix(back, I, 0.2) : STUDIO.grape;
  return {
    back, beam, beamOpacity: picture ? 0.45 : 1, curtain,
    tie: pick([STUDIO.lemon, STUDIO.paper, STUDIO.orange], [curtain]),
    floor, boards: same(floor, STUDIO.lemon) ? STUDIO.orange : mix(floor, I, 0.25),
    rim, rimShadow: mix(rim, I, 0.6), inner: beam,
    bulbA: pick([STUDIO.lemon, STUDIO.paper], [rim]), bulbB: STUDIO.paper,
    dash: pick([STUDIO.orange, mix(card, I, 0.45)], [card]),
    ground,
  };
}

// A team's pastel for its won cards: the team color mixed with paper, so the
// small badge in the corner and the card read as one team.
// Each team color's own pastel pair from the palette (Art Director, 2026-11-25),
// never a computed tint, in TEAM_COLORS order.
const TEAM_PASTELS = ['#fff1b8', '#c8f0dc', '#bfdff3', '#ffd9b3', '#ddd6ff', '#ffd3e6', '#e8f0b4', '#c9f1ee', '#f6f0e4', '#ddd6ff'];
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
// `look` is the theme's studio colors (studioLook); Classic by default.
export function StudioBack({ w, h, rem, back, look = CLASSIC_STUDIO }: { w: number; h: number; rem: number; back?: string; look?: StudioLook }) {
  const L = back ? { ...look, back, ground: undefined } : look;
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
        <path d={`M${x(-4)} 0 L${x(c)} 0 C${x(c - 14)} ${h * 0.28} ${x(c + 16)} ${h * 0.55} ${x(c - 4)} ${h * 0.84} L${x(c * 0.2)} ${h * 0.9} L${x(-4)} ${h * 0.9} Z`} fill={L.curtain} stroke={I} strokeWidth="4" strokeLinejoin="round" />
        {[0.3, 0.62].map((f) => <path key={f} d={`M${x(c * f)} 8 C${x(c * f - 6)} ${h * 0.3} ${x(c * f + 8)} ${h * 0.6} ${x(c * f - 2)} ${h * 0.86}`} fill="none" stroke={I} strokeWidth="2.4" strokeLinecap="round" />)}
        {/* the tie-back */}
        <rect x={flip ? w - c - 4 : -6} y={h * 0.5} width={c + 10} height={rem * 0.85} rx={rem * 0.42} fill={L.tie} stroke={I} strokeWidth="3" />
      </g>
    );
  };
  const n = Math.max(6, Math.round(w / (rem * 4.4)));
  const scallops = Array.from({ length: n }, (_, i) => {
    const a = (i * w) / n, b = ((i + 1) * w) / n;
    return <path key={i} d={`M${a} ${band - 4} Q${(a + b) / 2} ${band + dip} ${b} ${band - 4} Z`} fill={L.curtain} stroke={I} strokeWidth="4" strokeLinejoin="round" />;
  });
  return (
    <>
    {L.ground && <div className="absolute inset-0 pointer-events-none" style={L.ground} aria-hidden="true" />}
    <svg className="absolute inset-0 pointer-events-none" width={w} height={h} aria-hidden="true" data-studio="">
      {!L.ground && <rect width={w} height={h} fill={L.back} />}
      {/* spotlight beams, opaque lavender, behind everything else */}
      <path d={`M${w * 0.2} 0 L${w * 0.28} 0 L${w * 0.46} ${floor} L${w * 0.08} ${floor} Z`} fill={L.beam} opacity={L.beamOpacity} />
      <path d={`M${w * 0.72} 0 L${w * 0.8} 0 L${w * 0.92} ${floor} L${w * 0.54} ${floor} Z`} fill={L.beam} opacity={L.beamOpacity} />
      {/* the stage floor and its boards */}
      <path d={`M-4 ${floor} C${w * 0.3} ${floor - 8} ${w * 0.7} ${floor + 6} ${w + 4} ${floor - 4} L${w + 4} ${h + 4} L-4 ${h + 4} Z`} fill={L.floor} stroke={I} strokeWidth="4" strokeLinejoin="round" />
      {Array.from({ length: 9 }, (_, i) => <path key={i} d={`M${(w / 9) * i + 20} ${floor + 14} l14 ${Math.max(4, h - floor - 22)}`} stroke={L.boards} strokeWidth="5" strokeLinecap="round" />)}
      {curtain(false)}{curtain(true)}
      {scallops}
      <rect x="-4" y="-4" width={w + 8} height={band + 4} fill={L.curtain} stroke={I} strokeWidth="4" />
    </svg>
    </>
  );
}

// The purple bulb marquee round the board: bulbs on the top and bottom edges
// that chase (lemon and paper swap) when motion is full.
export function Marquee({ children, bulbs, chase, className = '', style, look = CLASSIC_STUDIO }: { children: ReactNode; bulbs: number; chase: boolean; className?: string; style?: CSSProperties; look?: StudioLook }) {
  return (
    <div className={`relative rounded-[1.6rem] ${className}`} style={{ background: look.rim, border: `4px solid ${I}`, boxShadow: `0 6px 0 ${look.rimShadow}`, padding: 'var(--gs-rim)', ...style }}>
      {(['top', 'bottom'] as const).map((s) => (
        <span key={s} className="absolute inset-x-[1.4rem] flex justify-between pointer-events-none" style={{ [s]: 'calc(var(--gs-rim) / 2 - 0.34rem)' }} aria-hidden="true">
          {Array.from({ length: bulbs }, (_, i) => (
            <span key={i} className={`w-[0.68rem] h-[0.68rem] rounded-full ${chase ? (i % 2 ? 'gs-bulb gs-bulb-b' : 'gs-bulb') : ''}`}
              style={{ background: i % 2 ? look.bulbB : look.bulbA, border: `1.5px solid ${I}` }} />
          ))}
        </span>
      ))}
      <div className="rounded-[0.9rem]" style={{ background: look.inner, border: `3px solid ${I}`, padding: 'var(--gs-inner)' }}>{children}</div>
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

// A closed card (approved mockup): butter with a dashed orange inset and a
// crayon sparkle, never a number (golden rule: no numbers on spaces). A theme's
// own card-back art shows instead when it has one.
export function ClosedFace({ fill, art, w, edge, style, dash = STUDIO.orange }: { fill: CSSProperties; art: boolean; w: number; edge?: boolean; style?: CSSProperties; dash?: string }) {
  return (
    <span className="absolute inset-0 grid place-items-center overflow-hidden" style={{ ...fill, borderRadius: '0.9rem', ...(edge ? { border: `3px solid ${STUDIO.ink}` } : {}), ...style }}>
      {art && (
        <>
          <span className="absolute" style={{ inset: Math.max(4, w * 0.04), borderRadius: '0.6rem', border: `2px dashed ${dash}` }} />
          <Doodle kind="sparkle" color={STUDIO.lemon} size={Math.round(Math.max(18, w * 0.3))} />
        </>
      )}
    </span>
  );
}

// A won card: the team's pastel, its badge small in the corner and the prize
// (+points or the power-up), so the board shows who won what at a glance.
export function OpenFace({ kind, by, w, edge, style }: { kind: CardKind; by: number; w: number; edge?: boolean; style?: CSSProperties }) {
  const gold = isGolden(kind);
  return (
    <span className="absolute inset-0 grid place-items-center overflow-hidden" style={{ background: gold ? STUDIO.lemon : teamPastel(by), borderRadius: '0.9rem', ...(edge ? { border: `3px solid ${STUDIO.ink}` } : {}), ...style }}>
      <span className="absolute" style={{ top: Math.max(3, w * 0.035), left: Math.max(3, w * 0.035) }}><TeamBadge colorIndex={by} size={Math.round(Math.max(16, Math.min(40, w * 0.17)))} /></span>
      {kind.kind === 'power'
        ? <ItemArt item={kind.item} size={Math.round(Math.max(24, w * 0.4))} still />
        : <b className="font-display tabular-nums leading-none" style={{ fontSize: Math.max(16, w * 0.26), color: STUDIO.ink }}>+{kind.points}</b>}
    </span>
  );
}

export const isGolden = (k: CardKind) => k.kind === 'points' && !!k.golden;
