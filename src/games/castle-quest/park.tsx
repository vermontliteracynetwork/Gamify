import { useId, type CSSProperties, type ReactNode } from 'react';
import { PATTERNS } from '../../brand/PatternProposal';

// The Board Game's Classic world (approved mockup, /brand Game mockups, Board
// Game, teacher 2026-11-24): a paper-craft park (sky, sun, clouds, two rolling
// hills, flowers) with the board on a quiet paper mat, pastel squares, bright
// crayon pawns and the one-side die. Drawn in code in the Classic kit's hand
// (src/brand/CrayonKit and mockKit ParkBack, copied here because games do not
// import from src/brand): flat solid palette fills, one wobbly ink outline.

export const INK = '#1d1a33';
export const PK = {
  sky: '#4ba3e8', lemon: '#fabe37', lime: '#ccd537', kelly: '#22b04a', pink: '#f055a5', paper: '#fffaf0', cream: '#f6f0e4',
  lavender: '#ddd6ff', crystal: '#bfdff3', blush: '#ffd3e6', butter: '#fff1b8', mint: '#c8f0dc', quiet: '#57506e',
};

const cloud = (x: number, y: number, s: number) => `M${x} ${y} c${-8 * s} 0 ${-12 * s} ${-10 * s} ${-4 * s} ${-14 * s} c${2 * s} ${-12 * s} ${18 * s} ${-14 * s} ${22 * s} ${-4 * s} c${8 * s} ${-8 * s} ${22 * s} ${-2 * s} ${20 * s} ${8 * s} c${8 * s} ${2 * s} ${8 * s} ${10 * s} 0 ${10 * s} Z`;

// The park, drawn to the size it fills (so the sun stays round on every screen).
function parkMarkup(w: number, h: number, still: boolean) {
  const k = Math.max(0.6, Math.min(w, h) / 625);
  const sw = Math.max(3, 4 * k);
  // Only in the open strip right of the board, heads and stems inside the frame (Art Director, 2026-11-25).
  const flowers = 3;
  return {
    sky: <rect width={w} height={h} fill={PK.sky} />,
    sun: (
      <g className={still ? '' : 'cq-sun'} style={{ transformOrigin: `${w * 0.92}px ${h * 0.47}px` }}>
        <circle cx={w * 0.92} cy={h * 0.47} r={h * 0.05} fill={PK.lemon} stroke={INK} strokeWidth={sw} />
        <path d={`M${w * 0.92 - 13 * k} ${h * 0.47 - 11 * k} q${6 * k} ${-8 * k} ${14 * k} ${-8 * k}`} stroke="#fff" strokeWidth={5 * k} fill="none" strokeLinecap="round" />
      </g>
    ),
    clouds: [[0.86, 0.16, 1.4, 0], [0.55, 0.07, 1.6, 1], [0.78, 0.3, 1.3, 2]].map(([x, y, s, i]) => (
      <g key={i} className={still ? '' : 'cq-cloud'} style={{ animationDelay: `${-i * 7}s` }}>
        <path d={cloud(w * x, h * y, s * k)} fill={PK.paper} stroke={INK} strokeWidth={sw * 0.9} strokeLinejoin="round" />
      </g>
    )),
    hills: (
      <>
        <path d={`M0 ${h * 0.62} C${w * 0.25} ${h * 0.5} ${w * 0.45} ${h * 0.56} ${w * 0.6} ${h * 0.6} C${w * 0.78} ${h * 0.5} ${w * 0.92} ${h * 0.52} ${w} ${h * 0.58} L${w} ${h} L0 ${h} Z`} fill={PK.lime} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
        <path d={`M0 ${h * 0.78} C${w * 0.3} ${h * 0.7} ${w * 0.6} ${h * 0.82} ${w} ${h * 0.72} L${w} ${h} L0 ${h} Z`} fill={PK.kelly} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
      </>
    ),
    flowers: Array.from({ length: flowers }, (_, i) => {
      const x = w * (0.86 + i * 0.05), y = Math.min(h * 0.8 + ((i * 29) % 50) * k, h * 0.9 - 18 * k);
      return (
        <g key={i} className={still ? '' : 'cq-sway'} style={{ transformOrigin: `${x}px ${y + 18 * k}px`, animationDelay: `${-(i % 5) * 0.6}s` }}>
          <path d={`M${x} ${y} v${18 * k}`} stroke={INK} strokeWidth={3 * k} strokeLinecap="round" />
          <circle cx={x} cy={y} r={7 * k} fill={[PK.pink, PK.paper, PK.lemon][i % 3]} stroke={INK} strokeWidth={2.5 * k} />
        </g>
      );
    }),
  };
}

export function ParkScene({ w, h, still }: { w: number; h: number; still: boolean }) {
  const p = parkMarkup(w, h, still);
  return (
    <svg className="absolute inset-0 pointer-events-none" width={w} height={h} aria-hidden="true">
      <style>{PARK_CSS}</style>
      {p.sky}{p.sun}{p.clouds}{p.hills}{p.flowers}
    </svg>
  );
}
// Slow drift and sway, so the world feels alive behind the board (never fast,
// never under the squares; Calm motion turns it off).
const PARK_CSS = `
@keyframes cq-cloud { 0%,100% { transform: translateX(0); } 50% { transform: translateX(18px); } }
@keyframes cq-sway { 0%,100% { transform: rotate(-5deg); } 50% { transform: rotate(5deg); } }
@keyframes cq-sun { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }
.cq-cloud { animation: cq-cloud 14s ease-in-out infinite; }
.cq-sway { animation: cq-sway 3.2s ease-in-out infinite; }
.cq-sun { animation: cq-sun 5s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { .cq-cloud, .cq-sway, .cq-sun { animation: none; } }
`;

// The same park as a CSS background (the Theme Builder's 4:3 preview).
export const PARK_BG = (() => {
  const w = 1600, h = 1200, k = 1.9, sw = 7;
  const c = [[0.2, 0.2, 1.2], [0.55, 0.18, 1.1]].map(([x, y, s]) => `<path d="${cloud(w * x, h * y, s * k)}" fill="${PK.paper}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/>`).join('');
  const f = Array.from({ length: 6 }, (_, i) => { const x = w * (i < 3 ? 0.025 + i * 0.022 : 0.93 + (i - 3) * 0.022), y = h * 0.74 + ((i * 29) % 30) * k; return `<path d="M${x} ${y} v${18 * k}" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><circle cx="${x}" cy="${y}" r="${7 * k}" fill="${[PK.pink, PK.paper, PK.lemon][i % 3]}" stroke="${INK}" stroke-width="4"/>`; }).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="${PK.sky}"/><circle cx="${w * 0.935}" cy="${h * 0.24}" r="${h * 0.045}" fill="${PK.lemon}" stroke="${INK}" stroke-width="${sw}"/>${c}<path d="M0 ${h * 0.62} C${w * 0.25} ${h * 0.5} ${w * 0.45} ${h * 0.56} ${w * 0.6} ${h * 0.6} C${w * 0.78} ${h * 0.5} ${w * 0.92} ${h * 0.52} ${w} ${h * 0.58} L${w} ${h} L0 ${h} Z" fill="${PK.lime}" stroke="${INK}" stroke-width="${sw}"/><path d="M0 ${h * 0.78} C${w * 0.3} ${h * 0.7} ${w * 0.6} ${h * 0.82} ${w} ${h * 0.72} L${w} ${h} L0 ${h} Z" fill="${PK.kelly}" stroke="${INK}" stroke-width="${sw}"/>${f}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
})();

// The quiet paper mat under the board: the Brand Kit's own "Quiet doodle
// ground" (src/brand/PatternProposal, the /brand Board Game mockup; owner
// 2026-11-26), with its Calm version (dots only, fainter).
const quietPattern = PATTERNS.find((p) => p.id === 'quiet')!;
export const QUIET_MAT: CSSProperties = { backgroundColor: PK.cream, ...quietPattern.make(false) };
export const quietMat = (calm: boolean): CSSProperties => ({ backgroundColor: PK.cream, ...quietPattern.make(calm) });

// ---- Crayon pieces (the kit's Shell, Wax and Shine) ---------------------------

const cleanId = (s: string) => s.replace(/[^a-zA-Z0-9]/g, '');
function Shell({ size, seed, children }: { size: number | string; seed: number; children: ReactNode }) {
  const f = 'f' + cleanId(useId());
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" overflow="visible" className="shrink-0 block">
      <defs>
        <filter id={f} filterUnits="userSpaceOnUse" x="-30" y="-30" width="160" height="160">
          <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed={seed} result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="2.4" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      <g filter={`url(#${f})`}>{children}</g>
    </svg>
  );
}

// A game piece (pawn): a piece, not a character. Bright team color, ink edge,
// one white shine at the top left.
const PAWN = 'M50 8 C61 8 69 16 69 27 C69 35 64 41 58 44 C66 56 72 70 78 82 C80 87 77 92 71 92 H29 C23 92 20 87 22 82 C28 70 34 56 42 44 C36 41 31 35 31 27 C31 16 39 8 50 8 Z';
export function CrayonPawn({ color, size = 48 }: { color: string; size?: number | string }) {
  return (
    <Shell size={size} seed={71}>
      <path d={PAWN} fill={color} />
      <path d={PAWN} fill="none" stroke={INK} strokeWidth="4.8" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M40 20 C42 16 45 14 49 14" stroke="#ffffff" strokeWidth="5" fill="none" strokeLinecap="round" />
    </Shell>
  );
}

// The one-side die (her die, the kit's DieFace): a paper face, one ink
// outline, round ink pips (every pip ink, the 1 too; teacher 2026-11-24).
const PIPS: Record<number, [number, number][]> = {
  1: [[50, 50]], 2: [[29, 29], [71, 71]], 3: [[27, 27], [50, 50], [73, 73]],
  4: [[29, 29], [71, 29], [29, 71], [71, 71]], 5: [[27, 27], [73, 27], [50, 50], [27, 73], [73, 73]],
  6: [[30, 25], [70, 25], [30, 50], [70, 50], [30, 75], [70, 75]],
};
export function CrayonDieFace({ value, size }: { value: number; size: number | string }) {
  return (
    <Shell size={size} seed={67}>
      <rect x="8" y="13" width="84" height="84" rx="22" fill={INK} />
      <rect x="8" y="8" width="84" height="84" rx="22" fill={PK.paper} stroke={INK} strokeWidth="3.6" />
      {(PIPS[value] ?? PIPS[1]).map(([x, y], k) => <circle key={k} cx={x} cy={y} r={value === 1 ? 11 : 8} fill={INK} />)}
    </Shell>
  );
}
