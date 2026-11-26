import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { useSettings } from '../settings/SettingsContext';
import { playClip } from '../engine/music';
import { ND as ND0 } from './buddies';

// The kit wears the approved palette pairs (owner, 2026-11-26: "new colors for
// the classic themes"; classic-art skill: palette pairs only). The old New
// direction hues (cobalt, violet, coral...) map to their nearest palette
// bright, so every power-up, die and doodle shares the Classic colors. Hexes
// are written here (PaletteProposal imports this file, so it cannot be
// imported back).
const ND = {
  ...ND0,
  pink: '#f055a5', cobalt: '#4ba3e8', green: '#22b04a', yellow: '#fabe37', tangerine: '#ff9b28',
  violet: '#6a45f0', mint: '#1fb5a8', coral: '#f055a5',
  cobaltDeep: '#1f6fb8', violetDeep: '#4b2fc9',
};

// The Gamify crayon kit (proposal, teacher 2026-11-23): "i dont want
// characters, but rather i want the set powerups that are consistent between
// games ... in the crayon", plus "a crayon/pencil/handdrawn style dice ... one
// side shown at a time; add a double dice roll". Preview on /brand only until
// she approves. Every drawing is original, made in code (no files, no
// licenses). Style target: her commercial-use crayon clipart references
// (waxy crayon and colored-pencil tooth, visible scribble fill, uneven edges,
// bright kid colors, simple shapes on a clear ground). Nothing is copied.
//
// One family, five rules: a 100 x 100 grid with a 6-unit margin; chunky
// silhouettes; one main color plus one accent from the brand palette; a
// scribble fill in the deep shade of the same color; one white crayon shine at
// the top left. Doodle style (teacher refs, 2026-11-23): a thick, slightly
// wobbly ink outline (#1d1a33) with rounded ends around every shape, inner
// details in the same ink but thinner; on cards the art sits on a soft crayon
// blob patch with a little doodle confetti, never a frame.
// Solid, opaque, punchy fills (teacher, 2026-11-23: "more solid, punchier
// brighter colors that are less transparent"): texture is a light overlay in
// the strokes and edges and never makes a color look faded. The
// die is the one exception: it is tapped, so it keeps an ink edge.

const deep: Record<string, string> = {
  [ND.cobalt]: ND.cobaltDeep, [ND.pink]: ND.pinkDeep, [ND.green]: ND.greenDeep, [ND.tangerine]: ND.tangDeep,
  [ND.violet]: ND.violetDeep, [ND.yellow]: '#c98f00', [ND.mint]: '#1f8f7c',
};

// Waxy crayon: wobbly edges (displacement) and paper tooth (tiny holes).
function CrayonFilter({ id, seed, sticker }: { id: string; seed: number; sticker?: boolean }) {
  return (
    // A wide fixed region (teacher, 2026-11-24: power-ups are "never cut off"): the
    // crayon wobble and thick outlines can never be clipped by the filter box.
    <filter id={id} filterUnits="userSpaceOnUse" x="-30" y="-30" width="160" height="160">
      <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed={seed} result="warp" />
      <feDisplacementMap in="SourceGraphic" in2="warp" scale="2.4" xChannelSelector="R" yChannelSelector="G" result="wob" />
      {/* Smooth fills (teacher, 2026-11-23: "more smooth design, still handdrawn but less pencil/crayon marks"): no grain holes. */}
      <feMerge result="art"><feMergeNode in="wob" /></feMerge>
      {sticker && (
        <>
          <feMorphology in="art" operator="dilate" radius="4" result="fat" />
          <feFlood floodColor="#ffffff" />
          <feComposite in2="fat" operator="in" result="edge" />
          <feDropShadow in="edge" dx="0" dy="2" stdDeviation="1.6" floodColor="#1d1a33" floodOpacity="0.22" result="lift" />
          <feMerge><feMergeNode in="lift" /><feMergeNode in="art" /></feMerge>
        </>
      )}
    </filter>
  );
}

// A back-and-forth scribble covering the 100 x 100 grid, like a kid filling in.
const SCRIBBLE = (() => {
  let d = 'M-30 -10';
  for (let k = 1; k < 46; k++) {
    const j = Math.sin(k * 7.13) * 2.5;
    d += k % 2 ? ` L${(-30 + k * 6 - 64 + j).toFixed(1)} 112` : ` L${(-30 + k * 6 + j).toFixed(1)} -12`;
  }
  return d;
})();

const cleanId = (s: string) => s.replace(/[^a-zA-Z0-9]/g, '');

// One filled crayon shape: base wax, scribble strokes in the deep shade,
// a felt-tip ink outline (edge only tints the scribble).
export function Wax({ d, color, edge, rule, hatch = 0.3, width = 4.8 }: { d: string; color: string; edge?: string; rule?: 'evenodd'; hatch?: number; width?: number }) {
  const clip = 'c' + cleanId(useId());
  const e = edge && edge !== ND.ink ? edge : deep[color] ?? ND.quiet;
  return (
    <g>
      <clipPath id={clip}><path d={d} clipRule={rule} /></clipPath>
      <path d={d} fill={color} fillRule={rule} />
      <path d={SCRIBBLE} clipPath={`url(#${clip})`} stroke={e} strokeWidth="1.6" opacity={hatch * 0.3} fill="none" strokeLinejoin="round" />
      <path d={d} fill="none" fillRule={rule} stroke={ND.ink} strokeWidth={width} strokeLinejoin="round" strokeLinecap="round" />
    </g>
  );
}
// ink: an ink outline under a colored line, so thick lines read as shapes.
export function Line({ d, color, w = 5, o = 1, ink }: { d: string; color: string; w?: number; o?: number; ink?: boolean }) {
  const line = <path d={d} stroke={color} strokeWidth={w} opacity={o} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
  return ink ? <g><path d={d} stroke={ND.ink} strokeWidth={w + 8} fill="none" strokeLinecap="round" strokeLinejoin="round" />{line}</g> : line;
}
export const Shine = ({ d }: { d: string }) => <Line d={d} color="#ffffff" w={5} />;
const circ = (cx: number, cy: number, r: number) => `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0 Z`;
const rr = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y} H${x + w - r} Q${x + w} ${y} ${x + w} ${y + r} V${y + h - r} Q${x + w} ${y + h} ${x + w - r} ${y + h} H${x + r} Q${x} ${y + h} ${x} ${y + h - r} V${y + r} Q${x} ${y} ${x + r} ${y} Z`;
function starPath(cx: number, cy: number, o: number, i: number) {
  let d = '';
  for (let k = 0; k < 10; k++) {
    const r = k % 2 ? i : o; const a = ((-90 + k * 36) * Math.PI) / 180;
    d += `${k ? 'L' : 'M'}${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)} `;
  }
  return d + 'Z';
}
function wedge(cx: number, cy: number, r: number, a0: number, a1: number) {
  const p = (a: number) => `${(cx + r * Math.cos((a * Math.PI) / 180)).toFixed(1)} ${(cy + r * Math.sin((a * Math.PI) / 180)).toFixed(1)}`;
  return `M${cx} ${cy} L${p(a0)} A${r} ${r} 0 0 1 ${p(a1)} Z`;
}

// ---------- The die (the Board Game format: one side at a time) ----------
const PIPS: Record<number, [number, number][]> = {
  1: [[50, 50]], 2: [[29, 29], [71, 71]], 3: [[27, 27], [50, 50], [73, 73]],
  4: [[29, 29], [71, 29], [29, 71], [71, 71]], 5: [[27, 27], [73, 27], [50, 50], [27, 73], [73, 73]],
  6: [[30, 25], [70, 25], [30, 50], [70, 50], [30, 75], [70, 75]],
};
// A hand-drawn pip: a slightly lopsided blob, not a perfect circle.
// Smooth die (teacher, 2026-11-23: "improve dice design so it more closely
// matches the new, less textured design"): flat paper face, a solid
// Gamify-purple pastel base for depth, one ink outline, round solid pips.
function DieFace({ value }: { value: number }) {
  return (
    <g>
      {/* One simple face (teacher, 2026-11-23: "simple face so that it can easily be
          redesigned in themes"): a rounded square and its pips, nothing else, so a theme
          swaps the face color, the pip color or the whole face picture. */}
      <Wax d={rr(8, 8, 84, 84, 22)} color="#fffaf0" edge={ND.ink} hatch={0} width={3.6} />
      {PIPS[value].map(([x, y], k) => <circle key={k} cx={x} cy={y} r={value === 1 ? 11 : 8} fill={ND.ink} />)}
    </g>
  );
}
// Tumble frames: the die mid-air, three faces showing, with speed scribbles.
const TUMBLE: { rot: number; faces: [number, number, number] }[] = [
  { rot: -18, faces: [1, 2, 3] }, { rot: 14, faces: [5, 3, 6] }, { rot: -8, faces: [4, 6, 2] }, { rot: 24, faces: [2, 1, 5] },
];
function faceMatrix(o: [number, number], u: [number, number], v: [number, number]) {
  return `matrix(${u[0] / 100} ${u[1] / 100} ${v[0] / 100} ${v[1] / 100} ${o[0]} ${o[1]})`;
}
function DieTumble({ frame }: { frame: number }) {
  const f = TUMBLE[frame % TUMBLE.length];
  const faces: { d: string; fill: string; m: string; n: number }[] = [
    { d: 'M16 32 L50 16 L84 32 L50 48 Z', fill: '#fffaf0', m: faceMatrix([16, 32], [34, -16], [34, 16]), n: f.faces[0] },
    { d: 'M16 32 L50 48 L50 90 L16 74 Z', fill: '#ddd6ff', m: faceMatrix([16, 32], [34, 16], [0, 42]), n: f.faces[1] },
    { d: 'M50 48 L84 32 L84 74 L50 90 Z', fill: '#bfdff3', m: faceMatrix([50, 48], [34, -16], [0, 42]), n: f.faces[2] },
  ];
  return (
    <g>
      <Line d={frame % 2 ? 'M4 70 C2 58 4 46 10 38 M96 26 C98 36 96 46 92 52' : 'M6 26 C4 36 6 46 10 54 M94 64 C98 56 98 46 94 38'} color={ND.ink} w={3.6} />
      <g transform={`rotate(${f.rot} 50 53)`}>
        {faces.map((fc, k) => (
          <g key={k}>
            <Wax d={fc.d} color={fc.fill} edge={ND.ink} hatch={0} width={3.4} />
            <g transform={fc.m}>{PIPS[fc.n].map(([x, y], j) => <circle key={j} cx={x} cy={y} r={fc.n === 1 ? 12 : 9} fill={ND.ink} />)}</g>
          </g>
        ))}
      </g>
    </g>
  );
}

// ---------- The universal power-up set ----------
export type PowerId =
  | 'magnet' | 'double-dice' | 'double-points' | 'shield' | 'freeze' | 'extra-time' | 'slow-mo' | 'one-more'
  | 'hint' | 'second-chance' | 'tornado' | 'lightning' | 'mystery-box' | 'treasure-chest' | 'spin-wheel' | 'potion' | 'swap' | 'pop-out';

const ART: Record<PowerId, () => ReactNode> = {
  magnet: () => (<>
    <Wax d="M14 18 H42 V56 C42 62 46 66 50 66 C54 66 58 62 58 56 V18 H86 V56 C86 78 70 92 50 92 C30 92 14 78 14 56 Z" color={ND.coral} />
    <Wax d="M14 18 H42 V34 H14 Z" color={ND.paper} edge={ND.quiet} />
    <Wax d="M58 18 H86 V34 H58 Z" color={ND.paper} edge={ND.quiet} />
    <Line d="M22 11 L17 4 M34 11 L38 4 M66 11 L62 4 M78 11 L83 4" color={ND.ink} w={3.6} />
  </>),
  'double-dice': () => (<>
    <g transform="translate(4 14) rotate(-12 26 26) scale(0.52)"><DieFace value={5} /></g>
    <g transform="translate(44 36) rotate(9 26 26) scale(0.52)"><DieFace value={2} /></g>
  </>),
  'double-points': () => (<>
    <Wax d={starPath(50, 54, 46, 22)} color={ND.yellow} />
    <Line d="M32 47 L44 63 M44 47 L32 63" color={ND.ink} w={5.5} />
    <Line d="M50 49 C51 41 65 41 65 49 C65 55 55 58 50 64 H66" color={ND.ink} w={5.5} />
  </>),
  shield: () => (<>
    <Wax d="M50 8 L86 21 V48 C86 71 70 85 50 93 C30 85 14 71 14 48 V21 Z" color={ND.cobalt} />
    <Wax d="M50 8 L14 21 V48 C14 71 30 85 50 93 Z" color="#bfdff3" edge={ND.cobaltDeep} />
    <Shine d="M24 28 V46" />
  </>),
  freeze: () => (<>
    <Wax d={rr(14, 12, 72, 76, 14)} color={ND.mint} edge={ND.cobaltDeep} hatch={0.25} />
    <Line d="M50 26 V74 M29 38 L71 62 M29 62 L71 38" color={ND.cobaltDeep} w={5} />
    <Line d="M43 29 L50 36 L57 29 M43 71 L50 64 L57 71" color={ND.cobaltDeep} w={4} />
  </>),
  'extra-time': () => (<>
    <Wax d="M42 6 H58 V20 H42 Z" color={ND.tangerine} />
    <Wax d={circ(50, 57, 36)} color={ND.tangerine} />
    <Wax d={circ(50, 57, 26)} color={ND.paper} edge={ND.tangDeep} hatch={0.1} />
    <Line d="M50 57 V39 M50 57 L63 64" color={ND.ink} w={5} />
  </>),
  'slow-mo': () => (<>
    <Wax d="M6 84 C6 74 18 72 30 74 H76 C82 68 84 62 84 54 C92 54 96 66 92 76 C89 83 84 88 74 88 H10 C7 88 6 86 6 84 Z" color={ND.green} />
    <Wax d="M18 72 C12 58 16 36 32 26 C48 16 70 22 76 40 C82 58 72 74 54 76 Z" color={ND.violet} />
    <Wax d="M26 70 C22 58 26 44 38 38 C50 32 64 38 66 50 C68 62 60 70 50 71 Z" color={ND.pink} edge={ND.violet} hatch={0.25} width={3.4} />
    <Line d="M48 56 C46 52 50 49 53 51 C57 54 54 60 49 61 C42 62 38 56 40 50 C42 43 51 40 57 44" color={ND.ink} w={4} />
    <Line d="M85 56 L82 40 M90 58 L96 44" color={ND.ink} w={3.6} />
    <Wax d={circ(82, 38, 3.6)} color={ND.ink} edge={ND.ink} hatch={0} width={1.5} />
    <Wax d={circ(96, 42, 3.6)} color={ND.ink} edge={ND.ink} hatch={0} width={1.5} />
  </>),
  'one-more': () => (<>
    <Wax d={circ(50, 50, 42)} color={ND.green} />
    <Line d="M50 27 V73 M27 50 H73" color="#ffffff" w={11} />
  </>),
  hint: () => (<>
    <Wax d="M58 64 L66 56 L92 80 C94 82 94 86 92 88 L88 92 C86 94 82 94 80 92 Z" color={ND.tangerine} />
    <Wax d={`${circ(40, 40, 32)} ${circ(40, 40, 22)}`} color={ND.cobalt} rule="evenodd" />
    <Wax d={circ(40, 40, 22)} color={ND.paper} edge={ND.cobaltDeep} hatch={0.12} width={2} />
    <Line d="M28 36 C30 30 34 27 40 26" color="#ffffff" w={5} />
  </>),
  'second-chance': () => (<>
    <Wax d="M50 90 C28 74 8 60 8 38 C8 23 19 12 32 12 C40 12 46 17 50 25 C54 17 60 12 68 12 C81 12 92 23 92 38 C92 60 72 74 50 90 Z" color={ND.pink} />
    <Line d="M50 25 L44 38 L55 48 L45 60 L54 72 L50 90" color={ND.ink} w={4} />
    <g transform="rotate(-28 50 49)">
      <Wax d={rr(24, 40, 52, 18, 8)} color="#ffd9b3" edge="#c47a45" hatch={0.2} width={3.6} />
      <Wax d={rr(42, 41.5, 16, 15, 3)} color="#fffaf0" edge="#c47a45" hatch={0.1} width={2.4} />
      <Line d="M31 46 V46.5 M31 52 V52.5 M68 46 V46.5 M68 52 V52.5" color="#c47a45" w={3} />
    </g>
  </>),
  tornado: () => (<>
    <Line d="M42 92 C38 86 40 80 44 76" color={ND.violet} w={7} ink />
    <Wax d={rr(36, 68, 20, 11, 5.5)} color={ND.violet} width={4} />
    <Wax d={rr(36, 57, 32, 13, 6.5)} color={ND.violet} width={4} />
    <Wax d={rr(28, 44, 48, 15, 7.5)} color={ND.violet} width={4} />
    <Wax d={rr(20, 29, 62, 17, 8.5)} color={ND.violet} width={4} />
    <Wax d={rr(8, 10, 84, 21, 10.5)} color={ND.violet} width={4} />
    <Line d="M18 20 C34 15 58 15 74 18 M30 37 C42 34 56 34 66 36 M38 51 C46 49 56 49 62 51" color="#ffffff" w={3.6} o={0.9} />
    <Line d="M4 46 H14 M2 58 H20 M84 62 H96 M80 74 H92" color={ND.ink} w={3.2} />
  </>),
  lightning: () => (<>
    <Wax d="M58 4 L18 54 H44 L32 96 L84 40 H57 L70 4 Z" color={ND.yellow} />
  </>),
  'mystery-box': () => (<>
    <Wax d="M50 32 C38 12 20 20 32 32 Z" color={ND.yellow} />
    <Wax d="M50 32 C62 12 80 20 68 32 Z" color={ND.yellow} />
    <Wax d="M16 44 H84 V84 C84 88 82 90 78 90 H22 C18 90 16 88 16 84 Z" color={ND.pink} />
    <Wax d="M10 31 H90 V46 H10 Z" color={ND.pink} />
    <Wax d="M43 31 H57 V46 H43 Z" color={ND.yellow} />
    <g transform="translate(50.5 67) scale(0.68) translate(-50.5 -67)">
      <Line d="M40 59 C40 50 61 50 61 58 C61 65 51 65 51 73" color="#ffffff" w={8} />
      <Line d="M51 83 V83.5" color="#ffffff" w={9} />
    </g>
  </>),
  'treasure-chest': () => (<>
    <Wax d="M10 50 V38 C10 24 27 16 50 16 C73 16 90 24 90 38 V50 Z" color={ND.tangerine} />
    <Wax d="M10 50 H90 V84 C90 88 88 90 84 90 H16 C12 90 10 88 10 84 Z" color={ND.tangerine} />
    <Wax d="M8 45 H92 V56 H8 Z" color={ND.yellow} />
    <Wax d="M41 44 H59 V66 C59 69 57 71 54 71 H46 C43 71 41 69 41 66 Z" color={ND.yellow} />
    <Line d="M50 55 V62" color={ND.ink} w={4.5} />
  </>),
  'spin-wheel': () => (<>
    {[ND.pink, ND.cobalt, ND.green, ND.yellow, ND.tangerine, ND.mint].map((c, k) => <Wax key={c} d={wedge(50, 56, 38, -90 + k * 60, -30 + k * 60)} color={c} hatch={0.3} width={2.6} />)}
    <Wax d={circ(50, 56, 8)} color={ND.paper} edge={ND.ink} hatch={0} width={3} />
    <Wax d="M41 4 H59 L50 22 Z" color={ND.ink} edge={ND.ink} hatch={0} />
  </>),
  potion: () => (<>
    <Wax d="M40 14 H60 V36 C76 42 86 54 86 67 C86 83 70 93 50 93 C30 93 14 83 14 67 C14 54 24 42 40 36 Z" color={ND.paper} edge="#1f8f7c" hatch={0.1} />
    <Wax d="M15 62 C30 55 70 69 85 60 C86 63 86 65 86 67 C86 83 70 93 50 93 C30 93 14 83 14 67 Z" color={ND.green} />
    <Wax d="M37 4 H63 V17 H37 Z" color={ND.tangerine} />
    <Line d="M38 76 V76.5 M56 82 V82.5 M64 70 V70.5" color="#ffffff" w={6} />
    <Shine d="M24 56 C26 50 30 46 34 44" />
  </>),
  // One solid arrow each (teacher, 2026-11-24: "not have a break in the line
  // where the triangle is ... solid with the exterior outer black outline"):
  // both ink outlines go down first, then the shaft and head in one color on
  // top, so no ink line crosses where they meet.
  swap: () => (<>
    {([['M18 50 C18 30 34 18 52 18', 'M50 4 L76 18 L50 32 Z', ND.cobalt], ['M82 50 C82 70 66 82 48 82', 'M50 96 L24 82 L50 68 Z', ND.pink]] as const).map(([shaft, head, c]) => (
      <g key={c}>
        <path d={shaft} stroke={ND.ink} strokeWidth={20} fill="none" strokeLinecap="round" />
        <path d={head} fill={ND.ink} stroke={ND.ink} strokeWidth={8} strokeLinejoin="round" />
        <path d={shaft} stroke={c} strokeWidth={12} fill="none" strokeLinecap="round" />
        <path d={head} fill={c} />
      </g>
    ))}
  </>),
  // Pop Out (Four in a Row, 2026-11-26): a piece lifting out of the rack's
  // empty hole, with pop lines splaying up from the hole (no side ticks: at 48px they merged with the rack); the piece is the game's own Grape dot disc.
  'pop-out': () => (<>
    {/* A piece lifting out of its rack hole (Art Director fix, 2026-11-26). */}
    <Wax d={rr(8, 62, 84, 30, 12)} color={ND.cobalt} />
    <Wax d={circ(50, 77, 9)} color={ND.paper} edge={ND.ink} hatch={0} width={3.6} />
    <Line d="M38 54 V46 M50 56 V46 M62 54 V46" color={ND.ink} w={3.6} />
    <Wax d={circ(50, 24, 20)} color={ND.violet} />
    <Wax d={circ(50, 24, 6)} color={ND.paper} edge={ND.ink} hatch={0} width={2.6} />
    <Line d="M42 12 L50 4 L58 12" color={ND.ink} w={3.6} />
    <Shine d="M37 19 C39 13 43 10 48 9" />
  </>),
};

const SEED: Record<PowerId, number> = {
  magnet: 3, 'double-dice': 5, 'double-points': 7, shield: 11, freeze: 13, 'extra-time': 17, 'slow-mo': 19, 'one-more': 23,
  hint: 29, 'second-chance': 31, tornado: 37, lightning: 41, 'mystery-box': 43, 'treasure-chest': 47, 'spin-wheel': 53, potion: 59, swap: 61, 'pop-out': 73,
};

export function Shell({ size, title, seed, sticker, children }: { size: number; title?: string; seed: number; sticker?: boolean; children: ReactNode }) {
  const f = 'f' + cleanId(useId());
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true} overflow="visible" className="shrink-0">
      <defs><CrayonFilter id={f} seed={seed} sticker={sticker} /></defs>
      <g filter={`url(#${f})`}>{children}</g>
    </svg>
  );
}

export function CrayonPowerUp({ id, size = 96, title, sticker }: { id: PowerId; size?: number; title?: string; sticker?: boolean }) {
  return <Shell size={size} title={title} seed={SEED[id]} sticker={sticker}>{ART[id]()}</Shell>;
}
export function CrayonDie({ value, size = 96, tumble, title }: { value: number; size?: number; tumble?: number; title?: string }) {
  return <Shell size={size} title={title} seed={67}>{tumble === undefined ? <DieFace value={value} /> : <DieTumble frame={tumble} />}</Shell>;
}
// A game piece (pawn) for Share and team score boards: a piece, not a character.
export function CrayonPawn({ color, size = 48 }: { color: string; size?: number }) {
  return (
    <Shell size={size} seed={71}>
      <Wax d="M50 8 C61 8 69 16 69 27 C69 35 64 41 58 44 C66 56 72 70 78 82 C80 87 77 92 71 92 H29 C23 92 20 87 22 82 C28 70 34 56 42 44 C36 41 31 35 31 27 C31 16 39 8 50 8 Z" color={color} />
      <Shine d="M40 20 C42 16 45 14 49 14" />
    </Shell>
  );
}

// ---------- Doodle world: blob patch and confetti (teacher refs, 2026-11-23) ----------
// Solid pastel of each piece's main color (opaque, never a see-through tint).
// The palette's own pastels (Lavender, Blue crystal, Blush, Butter, Peach, Mint, Aqua).
export const KIT_PASTEL: Record<PowerId, string> = {
  magnet: '#ffd3e6', 'double-dice': '#ddd6ff', 'double-points': '#fff1b8', shield: '#bfdff3', freeze: '#c9f1ee',
  'extra-time': '#ffd9b3', 'slow-mo': '#ddd6ff', 'one-more': '#c8f0dc', hint: '#bfdff3', 'second-chance': '#ffd3e6',
  tornado: '#ddd6ff', lightning: '#fff1b8', 'mystery-box': '#ffd3e6', 'treasure-chest': '#ffd9b3', 'spin-wheel': '#fff1b8',
  potion: '#c8f0dc', swap: '#ffd3e6', 'pop-out': '#ddd6ff',
};
const PASTEL = KIT_PASTEL;
const BLOBS = [
  'M50 6 C72 4 94 20 95 46 C96 72 78 95 50 94 C24 93 4 76 6 50 C7 26 26 8 50 6 Z',
  'M46 5 C70 2 97 18 94 48 C92 76 74 96 47 95 C20 94 3 72 5 46 C7 22 24 7 46 5 Z',
  'M54 4 C78 7 96 28 94 54 C92 80 70 96 44 93 C18 90 4 70 7 44 C10 18 30 2 54 4 Z',
];
// A soft crayon patch behind a subject: no outline, scribble grain, lopsided.
export function BlobPatch({ color, variant = 0, size }: { color: string; variant?: number; size: number }) {
  const f = 'b' + cleanId(useId()); const clip = 'k' + cleanId(useId());
  const d = BLOBS[variant % BLOBS.length];
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" className="absolute inset-0 m-auto" style={{ transform: `rotate(${(variant % 5) * 17 - 30}deg)` }}>
      <defs><CrayonFilter id={f} seed={variant + 3} /><clipPath id={clip}><path d={d} /></clipPath></defs>
      <g filter={`url(#${f})`}>
        <path d={d} fill={color} />
      </g>
    </svg>
  );
}
export type DoodleKind = 'sparkle' | 'star' | 'dot' | 'heart' | 'squiggle' | 'drop' | 'moon';
const DOODLE: Record<DoodleKind, (c: string) => ReactNode> = {
  sparkle: (c) => <path d="M12 1 C13 8 16 11 23 12 C16 13 13 16 12 23 C11 16 8 13 1 12 C8 11 11 8 12 1 Z" fill={c} stroke={ND.ink} strokeWidth="1.8" strokeLinejoin="round" />,
  star: (c) => <path d={starPath(12, 12.5, 10.5, 5)} fill={c} stroke={ND.ink} strokeWidth="1.8" strokeLinejoin="round" />,
  dot: (c) => <circle cx="12" cy="12" r="4.5" fill={c} stroke={ND.ink} strokeWidth="1.8" />,
  heart: (c) => <path d="M12 21 C6 17 2 13 2 8.5 C2 5 4.5 3 7.5 3 C9.5 3 11 4.5 12 6.5 C13 4.5 14.5 3 16.5 3 C19.5 3 22 5 22 8.5 C22 13 18 17 12 21 Z" fill={c} stroke={ND.ink} strokeWidth="1.8" strokeLinejoin="round" />,
  squiggle: () => <path d="M2 14 C5 6 8 6 10 12 C12 18 15 18 17 11 C18 7 20 6 22 8" fill="none" stroke={ND.ink} strokeWidth="2.4" strokeLinecap="round" />,
  drop: (c) => <path d="M12 2 C15 7 19 11 19 15 C19 19 16 22 12 22 C8 22 5 19 5 15 C5 11 9 7 12 2 Z" fill={c} stroke={ND.ink} strokeWidth="1.8" strokeLinejoin="round" />,
  moon: (c) => <path d="M15 2 C9 3 5 8 5 13 C5 18 9 22 14 22 C17 22 20 21 22 18 C16 19 11 15 11 10 C11 6 13 3 15 2 Z" fill={c} stroke={ND.ink} strokeWidth="1.8" strokeLinejoin="round" />,
};
export function Doodle({ kind, color = ND.yellow, size = 18, className, style }: { kind: DoodleKind; color?: string; size?: number; className?: string; style?: CSSProperties }) {
  return <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" overflow="visible" className={className} style={style}>{DOODLE[kind](color)}</svg>;
}
const CONFETTI: [DoodleKind, string][] = [['sparkle', ND.yellow], ['dot', ND.pink], ['star', ND.mint], ['heart', ND.coral], ['sparkle', ND.paper], ['dot', ND.cobalt]];

export const UNIVERSAL_POWERS: { id: PowerId; name: string; job: string; games: string; optional?: boolean }[] = [
  { id: 'double-points', name: 'Double Points', job: 'Your next points count twice.', games: '22 games, the most used (Golden Pin, Double Star, Golden Hook, Double Tips, Double Coins...)' },
  { id: 'magnet', name: 'Magnet', job: 'Pulls the good stuff to you.', games: '14 games (Pin Magnet, Jackpot Magnet, Coin Magnet, Gold Magnet, Word Magnet...)' },
  { id: 'shield', name: 'Shield', job: 'Stops the next bad thing.', games: '12 games (Board Game, Bubble Shield, Pirate Shield, Sprinkle Shield...)' },
  { id: 'extra-time', name: 'Extra Time', job: 'Adds seconds to the clock.', games: '12 games (Pocket Watch, Overtime, Egg timer...)' },
  { id: 'slow-mo', name: 'Slow-mo', job: 'Everything moves slower for a bit.', games: '11 games (Slow Time, Slow Motion, Slow Pitch...)' },
  { id: 'hint', name: 'Hint', job: 'Shows a clue for this question.', games: '12 word and quiz games (Peek, Reveal a Letter, Vowel Finder, Remove Two, Flashlight...)' },
  { id: 'one-more', name: 'One More', job: 'One more move, try or turn.', games: '10 games (More Moves, Extra Try, Extra Digs, Extra Hops, Extra Plate...)' },
  { id: 'freeze', name: 'Freeze', job: 'Stops the clock for a bit.', games: '8 games (Freeze Clock, Time Freeze, Freeze Ray, Ice Cannon...)' },
  { id: 'tornado', name: 'Tornado', job: 'Mixes up the board.', games: '10 games (Board Game, Pin Twister, Shake Up, Card Shuffle, Spin Cycle...)' },
  { id: 'lightning', name: 'Lightning', job: 'Clears a row or blasts a spot.', games: '8 games (Fireball, Color Blast, Bomb Piece, Laser Sweep, Mega Laser...)' },
  { id: 'mystery-box', name: 'Mystery Box', job: 'Opens a surprise power-up.', games: '8 games (Mystery Box, Message in a Bottle, Mystery Crate, Surprise gift...)' },
  { id: 'treasure-chest', name: 'Prize Chest', job: 'Bonus points.', games: '8 games (Prize Chest, Tip Jar, Golden Box, Prize Bag...)' },
  { id: 'second-chance', name: 'Second Chance', job: 'Try again after a miss.', games: '4 games (Second Chance, Extra Heart, Heart Snack, Safe Shovel); proposed for every quiz game' },
  { id: 'double-dice', name: 'Double Dice', job: 'Roll two dice and move both.', games: 'Every dice game: Board Game, Snakes and Ladders, Track Race' },
  { id: 'spin-wheel', name: 'Spin Wheel', job: 'Spin to see what happens.', games: 'Board Game' },
  { id: 'potion', name: 'Potion', job: 'A boost for your next few turns.', games: 'Board Game; fits any turn game' },
  { id: 'pop-out', name: 'Pop Out', job: 'Pulls a piece out of the board.', games: 'Four in a Row' },
];

// ---------- The roll demo ----------
const DICE = '/sounds/board/dice.mp3';
const rollOne = () => 1 + Math.floor(Math.random() * 6);
type Phase = 'ready' | 'rolling' | 'waiting';

// One die in the Board Game format: one side at a time; tumbles through
// hand-drawn frames with weight (a toss up, a squash on each landing, two
// smaller bounces), lands on a random face and waits for a tap.
function RollingDie({ value, phase, delay, dir, size, still, onTap, label }: { value: number; phase: Phase; delay: number; dir: 1 | -1; size: number; still: boolean; onTap: () => void; label: string }) {
  const [frame, setFrame] = useState<number | null>(null);
  useEffect(() => {
    if (phase !== 'rolling' || still) { setFrame(null); return; }
    let f = 0; setFrame(0);
    const tick = window.setInterval(() => { f++; setFrame(f); }, 85);
    // Land on the face at the second touch-down (0.8 of the toss).
    const stop = window.setTimeout(() => { window.clearInterval(tick); setFrame(null); }, (delay + 0.88) * 1000);
    return () => { window.clearInterval(tick); window.clearTimeout(stop); };
  }, [phase, still, delay]);
  const tossing = phase === 'rolling' && !still;
  return (
    <motion.button type="button" onClick={onTap} aria-label={label} className="relative rounded-[18%] focus-visible:outline-4 focus-visible:outline-offset-4"
      style={{ width: size, height: size, transformOrigin: '50% 100%', outlineColor: '#6a45f0' }}
      animate={tossing
        ? { y: [0, -size * 0.75, 0, -size * 0.26, 0, -size * 0.07, 0], scaleY: [1, 1.06, 0.76, 1.05, 0.9, 1, 1], scaleX: [1, 0.95, 1.2, 0.97, 1.08, 1, 1] }
        : phase === 'waiting' && !still ? { y: [0, -6, 0], scaleY: 1, scaleX: 1 } : { y: 0, scaleY: 1, scaleX: 1 }}
      transition={tossing
        ? { duration: 1.1, delay, times: [0, 0.28, 0.5, 0.64, 0.8, 0.9, 1], ease: ['easeOut', 'easeIn', 'easeOut', 'easeIn', 'easeOut', 'easeIn'] }
        : phase === 'waiting' && !still ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }}
      whileHover={phase !== 'rolling' && !still ? { scale: 1.05, rotate: [0, -6, 5, -3, 0], transition: { duration: 0.6, repeat: Infinity, repeatDelay: 0.4 } } : undefined}>
      <motion.span className="block w-full h-full" style={{ filter: phase === 'waiting' ? `drop-shadow(0 0 14px ${ND.yellow})` : undefined }}
        animate={tossing ? { rotate: [0, 200 * dir, 320 * dir, 350 * dir, 360 * dir, 360 * dir, 360 * dir] } : { rotate: 0 }}
        transition={tossing ? { duration: 1.1, delay, times: [0, 0.28, 0.5, 0.64, 0.8, 0.9, 1], ease: 'easeOut' } : { duration: 0 }}>
        {still ? (
          <motion.span key={`${phase}-${value}`} className="block" initial={{ opacity: 0 }} animate={{ opacity: phase === 'rolling' ? 0.25 : 1 }} transition={{ duration: 0.18 }}>
            <CrayonDie value={value} size={size} />
          </motion.span>
        ) : (
          <CrayonDie value={value} size={size} tumble={frame ?? undefined} />
        )}
      </motion.span>
    </motion.button>
  );
}

// Shadow on the table: shrinks while the die is in the air.
function TableShadow({ phase, delay, size, still }: { phase: Phase; delay: number; size: number; still: boolean }) {
  const tossing = phase === 'rolling' && !still;
  return (
    <motion.span aria-hidden="true" className="block rounded-[50%] mx-auto -mt-2" style={{ width: size * 0.8, height: size * 0.12, background: 'rgba(29,26,51,0.16)' }}
      animate={tossing ? { scaleX: [1, 0.5, 1, 0.8, 1, 0.95, 1], opacity: [1, 0.45, 1, 0.8, 1, 1, 1] } : { scaleX: 1, opacity: 1 }}
      transition={tossing ? { duration: 1.1, delay, times: [0, 0.28, 0.5, 0.64, 0.8, 0.9, 1] } : { duration: 0.2 }} />
  );
}

export function DiceDemo({ count }: { count: 1 | 2 }) {
  const { settings } = useSettings();
  const still = settings.motion === 'still';
  const [values, setValues] = useState<number[]>(count === 2 ? [5, 2] : [1]);
  const [phase, setPhase] = useState<Phase>('ready');
  const timer = useRef<number>();
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const size = count === 2 ? 112 : 136;
  function roll() {
    if (phase !== 'ready') return;
    setValues(Array.from({ length: count }, rollOne));
    setPhase('rolling');
    playClip(DICE, settings, 0.8);
    // Same pacing as the Board Game: the toss, then the die waits for a tap.
    timer.current = window.setTimeout(() => setPhase('waiting'), still ? 350 : (1.1 + (count - 1) * 0.14) * 1000);
  }
  function tap() { if (phase === 'ready') roll(); else if (phase === 'waiting') setPhase('ready'); }
  const shows = values.length === 2 ? `The dice show ${values[0]} and ${values[1]}.` : `The die shows ${values[0]}.`;
  const label = phase === 'waiting' ? `${shows} Tap to go on.` : phase === 'rolling' ? 'Rolling' : count === 2 ? 'Roll the dice' : 'Roll the die';
  return (
    <div className="grid justify-items-center gap-4">
      <div className="flex items-end gap-6 min-h-[11rem] pt-12">
        {values.map((v, k) => (
          <div key={k} className="grid">
            <RollingDie value={v} phase={phase} delay={k * 0.14} dir={k ? -1 : 1} size={size} still={still} onTap={tap} label={label} />
            <TableShadow phase={phase} delay={k * 0.14} size={size} still={still} />
          </div>
        ))}
      </div>
      <p className="sr-only" aria-live="polite">{phase === 'waiting' ? shows : ''}</p>
      {/* No Roll button (teacher, 2026-11-24): the die itself is the button. It
          wiggles on hover and rolls on a tap; after a roll it waits for a tap. */}
      <p className="font-semibold text-sm" style={{ color: ND.quiet }} aria-hidden="true">{phase === 'waiting' ? 'Tap the die to go on' : phase === 'rolling' ? ' ' : count === 2 ? 'Tap a die to roll both' : 'Tap the die to roll'}</p>
    </div>
  );
}

// ---------- The /brand section ----------
export function CrayonKitSection() {
  return (
    <div className="grid gap-8">
      <p className="flex items-center gap-2 font-heading font-bold" aria-hidden="true">
        <Doodle kind="sparkle" /><Doodle kind="star" color={ND.mint} size={16} /><Doodle kind="dot" color={ND.pink} size={10} /><Doodle kind="heart" color={ND.coral} size={15} /><Doodle kind="squiggle" size={22} />
      </p>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(10.5rem,1fr))] gap-3">
        {UNIVERSAL_POWERS.map((p, i) => (
          <div key={p.id} className="rounded-[1.5rem] p-4 grid justify-items-center content-start gap-1 text-center" style={{ background: ND.paper }}>
            <span className="relative grid place-items-center" style={{ width: 132, height: 132 }}>
              <BlobPatch color={PASTEL[p.id]} variant={i} size={132} />
              <span className="relative"><CrayonPowerUp id={p.id} size={104} title={p.name} /></span>
              <Doodle kind={CONFETTI[i % 6][0]} color={CONFETTI[i % 6][1]} size={16} className="absolute" style={{ top: 2, right: 4 }} />
              <Doodle kind={CONFETTI[(i + 3) % 6][0]} color={CONFETTI[(i + 3) % 6][1]} size={11} className="absolute" style={{ bottom: 8, left: 2 }} />
            </span>
            <span className="flex items-center gap-2 pt-1">
              <span className="font-heading font-bold text-lg leading-tight">{p.name}</span>
              <CrayonPowerUp id={p.id} size={32} />
            </span>
            <span className="font-semibold leading-snug">{p.job}</span>
            {p.optional && <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: ND.cream }}>Optional</span>}
            <span className="text-xs font-semibold" style={{ color: ND.quiet }}>{p.games}</span>
          </div>
        ))}
      </div>
      <div className="grid gap-2">
        <h3 className="font-heading font-bold text-lg">At 48px on the cream ground, and on color-block stages with the white sticker edge</h3>
        {[ND.cream, ND.cobalt, ND.pink, ND.green].map((bg) => (
          <div key={bg} className="rounded-[1.25rem] px-4 py-3 flex flex-wrap gap-3" style={{ background: bg }}>
            {UNIVERSAL_POWERS.map((p) => <CrayonPowerUp key={p.id} id={p.id} size={48} title={p.name} sticker={bg !== ND.cream} />)}
          </div>
        ))}
      </div>
      <div className="grid gap-3">
        <h3 className="font-heading font-bold text-lg flex items-center gap-2">The die: six faces, one side at a time <Doodle kind="sparkle" size={18} /><Doodle kind="dot" color={ND.pink} size={10} /></h3>
        <div className="rounded-[1.5rem] p-4 flex flex-wrap gap-4 items-center" style={{ background: ND.paper }}>
          {[1, 2, 3, 4, 5, 6].map((n) => <CrayonDie key={n} value={n} size={88} title={`Die face ${n}`} />)}
          <span className="w-px self-stretch" style={{ background: '#e4dccb' }} aria-hidden="true" />
          {TUMBLE.map((_, k) => <CrayonDie key={k} value={1} tumble={k} size={88} title={`Tumble frame ${k + 1}`} />)}
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-[1.75rem] p-5 grid gap-2" style={{ background: ND.green }}>
            <span className="font-heading font-bold text-lg">One die</span>
            <div className="rounded-[1.25rem] p-4" style={{ background: ND.cream }}><DiceDemo count={1} /></div>
          </div>
          <div className="rounded-[1.75rem] p-5 grid gap-2" style={{ background: ND.cobalt }}>
            <span className="font-heading font-bold text-lg" style={{ color: '#ffffff' }}>Double dice</span>
            <div className="rounded-[1.25rem] p-4" style={{ background: ND.cream }}><DiceDemo count={2} /></div>
          </div>
        </div>
        <p className="text-sm font-semibold max-w-prose" style={{ color: ND.quiet }}>
          Tap the die to roll (no Roll button; it wiggles on hover). It tumbles through four hand-drawn frames, lands with a squash and two small bounces, then waits, glowing, until it is tapped, the same as the Board Game. Double dice land side by side a beat apart with no total written: kids count the pips (your rule, 2026-11-13); a screen reader hears both numbers. Still motion: a quick fade to the new face.
        </p>
      </div>
    </div>
  );
}
