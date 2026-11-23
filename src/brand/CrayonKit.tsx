import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { useSettings } from '../settings/SettingsContext';
import { playClip } from '../engine/music';
import { ND } from './buddies';

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
// scribble fill in the deep shade of the same color and an edge in that deep
// shade (never black ink on art); one white crayon shine at the top left.
// Solid, opaque, punchy fills (teacher, 2026-11-23: "more solid, punchier
// brighter colors that are less transparent"): texture is a light overlay in
// the strokes and edges and never makes a color look faded. The
// die is the one exception: it is tapped, so it keeps an ink edge.

const deep: Record<string, string> = {
  [ND.cobalt]: ND.cobaltDeep, [ND.pink]: ND.pinkDeep, [ND.green]: ND.greenDeep, [ND.tangerine]: ND.tangDeep,
  [ND.violet]: ND.violetDeep, [ND.yellow]: '#c98f00', [ND.mint]: '#1f8f7c', [ND.coral]: '#b8322f',
};

// Waxy crayon: wobbly edges (displacement) and paper tooth (tiny holes).
function CrayonFilter({ id, seed, sticker }: { id: string; seed: number; sticker?: boolean }) {
  return (
    <filter id={id} x="-12%" y="-12%" width="124%" height="124%">
      <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed={seed} result="warp" />
      <feDisplacementMap in="SourceGraphic" in2="warp" scale="3.6" xChannelSelector="R" yChannelSelector="G" result="wob" />
      <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="2" seed={seed + 7} result="n" />
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -4 0 0 0 3.55" result="tooth" />
      <feComposite in="wob" in2="tooth" operator="in" result="art" />
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
// a hand-drawn edge in the same deep shade.
function Wax({ d, color, edge, rule, hatch = 0.3, width = 4.2 }: { d: string; color: string; edge?: string; rule?: 'evenodd'; hatch?: number; width?: number }) {
  const clip = 'c' + cleanId(useId());
  const e = edge ?? deep[color] ?? ND.ink;
  return (
    <g>
      <clipPath id={clip}><path d={d} clipRule={rule} /></clipPath>
      <path d={d} fill={color} fillRule={rule} />
      <path d={SCRIBBLE} clipPath={`url(#${clip})`} stroke={e} strokeWidth="1.9" opacity={hatch} fill="none" strokeLinejoin="round" />
      <path d={d} fill="none" fillRule={rule} stroke={e} strokeWidth={width} strokeLinejoin="round" />
    </g>
  );
}
function Line({ d, color, w = 5, o = 1 }: { d: string; color: string; w?: number; o?: number }) {
  return <path d={d} stroke={color} strokeWidth={w} opacity={o} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
}
const Shine = ({ d }: { d: string }) => <Line d={d} color="#ffffff" w={5} />;
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
const pip = (x: number, y: number, r: number) => `M${x - r} ${y} C${x - r} ${y - r * 1.05} ${x + r * 0.95} ${y - r * 1.1} ${x + r} ${y - r * 0.1} C${x + r * 1.05} ${y + r} ${x - r * 0.9} ${y + r * 1.1} ${x - r} ${y} Z`;
function DieFace({ value }: { value: number }) {
  return (
    <g>
      <path d={rr(8, 13, 84, 82, 20)} fill="#cdbfa6" />
      <Wax d={rr(8, 7, 84, 82, 20)} color={ND.paper} edge={ND.ink} hatch={0.12} width={3.6} />
      <Shine d="M20 22 C22 17 26 15 32 15" />
      {PIPS[value].map(([x, y], k) => <Wax key={k} d={pip(x, y - 2, value === 1 ? 12 : 8.5)} color={value === 1 ? ND.pink : ND.ink} edge={value === 1 ? ND.pinkDeep : ND.ink} hatch={0.3} width={2} />)}
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
    { d: 'M16 32 L50 16 L84 32 L50 48 Z', fill: ND.paper, m: faceMatrix([16, 32], [34, -16], [34, 16]), n: f.faces[0] },
    { d: 'M16 32 L50 48 L50 90 L16 74 Z', fill: '#efe5d2', m: faceMatrix([16, 32], [34, 16], [0, 42]), n: f.faces[1] },
    { d: 'M50 48 L84 32 L84 74 L50 90 Z', fill: '#e2d5bd', m: faceMatrix([50, 48], [34, -16], [0, 42]), n: f.faces[2] },
  ];
  return (
    <g>
      <Line d={frame % 2 ? 'M4 70 C2 58 4 46 10 38 M96 26 C98 36 96 46 92 52' : 'M6 26 C4 36 6 46 10 54 M94 64 C98 56 98 46 94 38'} color={ND.quiet} w={4} />
      <g transform={`rotate(${f.rot} 50 53)`}>
        {faces.map((fc, k) => (
          <g key={k}>
            <Wax d={fc.d} color={fc.fill} edge={ND.ink} hatch={0.12} width={3.4} />
            <g transform={fc.m}>{PIPS[fc.n].map(([x, y], j) => <path key={j} d={pip(x, y, fc.n === 1 ? 13 : 9.5)} fill={fc.n === 1 ? ND.pink : ND.ink} />)}</g>
          </g>
        ))}
      </g>
    </g>
  );
}

// ---------- The universal power-up set ----------
export type PowerId =
  | 'magnet' | 'double-dice' | 'double-points' | 'shield' | 'freeze' | 'extra-time' | 'slow-mo' | 'one-more'
  | 'hint' | 'second-chance' | 'tornado' | 'lightning' | 'mystery-box' | 'treasure-chest' | 'spin-wheel' | 'potion' | 'swap';

const ART: Record<PowerId, () => ReactNode> = {
  magnet: () => (<>
    <Wax d="M14 18 H42 V56 C42 62 46 66 50 66 C54 66 58 62 58 56 V18 H86 V56 C86 78 70 92 50 92 C30 92 14 78 14 56 Z" color={ND.coral} />
    <Wax d="M14 18 H42 V34 H14 Z" color={ND.paper} edge={ND.quiet} />
    <Wax d="M58 18 H86 V34 H58 Z" color={ND.paper} edge={ND.quiet} />
    <Shine d="M22 44 V62" />
    <Line d="M22 11 L17 4 M34 11 L38 4 M66 11 L62 4 M78 11 L83 4" color={ND.tangerine} w={4} />
  </>),
  'double-dice': () => (<>
    <g transform="translate(4 14) rotate(-12 26 26) scale(0.52)"><DieFace value={5} /></g>
    <g transform="translate(44 36) rotate(9 26 26) scale(0.52)"><DieFace value={2} /></g>
  </>),
  'double-points': () => (<>
    <Wax d={starPath(50, 54, 46, 22)} color={ND.yellow} />
    <Shine d="M44 22 L40 32" />
    <Line d="M32 47 L44 63 M44 47 L32 63" color={ND.ink} w={5.5} />
    <Line d="M50 49 C51 41 65 41 65 49 C65 55 55 58 50 64 H66" color={ND.ink} w={5.5} />
  </>),
  shield: () => (<>
    <Wax d="M50 8 L86 21 V48 C86 71 70 85 50 93 C30 85 14 71 14 48 V21 Z" color={ND.cobalt} />
    <Wax d="M50 8 L14 21 V48 C14 71 30 85 50 93 Z" color={ND.mint} edge={ND.cobaltDeep} />
    <Shine d="M24 28 V46" />
  </>),
  freeze: () => (<>
    <Wax d={rr(14, 12, 72, 76, 14)} color={ND.mint} edge={ND.cobaltDeep} hatch={0.25} />
    <Line d="M50 26 V74 M29 38 L71 62 M29 62 L71 38" color={ND.cobaltDeep} w={5} />
    <Line d="M43 29 L50 36 L57 29 M43 71 L50 64 L57 71" color={ND.cobaltDeep} w={4} />
    <Shine d="M24 22 H38" />
  </>),
  'extra-time': () => (<>
    <Wax d="M38 6 H58 V20 H38 Z" color={ND.tangerine} />
    <Wax d={circ(46, 58, 35)} color={ND.tangerine} />
    <Wax d={circ(46, 58, 25)} color={ND.paper} edge={ND.tangDeep} hatch={0.1} />
    <Line d="M46 58 V40 M46 58 L59 65" color={ND.ink} w={5} />
    <Wax d={circ(79, 24, 16)} color={ND.green} />
    <Line d="M79 15 V33 M70 24 H88" color="#ffffff" w={5.5} />
  </>),
  'slow-mo': () => (<>
    <Wax d="M6 84 C6 74 18 72 30 74 H76 C82 68 84 62 84 54 C92 54 96 66 92 76 C89 83 84 88 74 88 H10 C7 88 6 86 6 84 Z" color={ND.green} />
    <Wax d={circ(46, 50, 28)} color={ND.violet} />
    <Line d="M46 50 C46 44 54 44 54 50 C54 58 40 58 40 50 C40 39 61 39 61 50 C61 64 33 64 33 50" color="#ffffff" w={4.5} />
    <Line d="M85 56 L82 40 M90 58 L96 44" color={ND.greenDeep} w={4} />
  </>),
  'one-more': () => (<>
    <Wax d={circ(50, 50, 42)} color={ND.green} />
    <Line d="M50 27 V73 M27 50 H73" color="#ffffff" w={11} />
    <Shine d="M20 40 C22 32 26 26 32 22" />
  </>),
  hint: () => (<>
    <Wax d="M58 64 L66 56 L92 80 C94 82 94 86 92 88 L88 92 C86 94 82 94 80 92 Z" color={ND.tangerine} />
    <Wax d={`${circ(40, 40, 32)} ${circ(40, 40, 22)}`} color={ND.cobalt} rule="evenodd" />
    <Wax d={circ(40, 40, 22)} color={ND.paper} edge={ND.cobaltDeep} hatch={0.12} width={2} />
    <Line d="M28 36 C30 30 34 27 40 26" color="#ffffff" w={5} />
    <Line d="M84 6 V24 M75 15 H93" color={ND.tangerine} w={4} />
  </>),
  'second-chance': () => (<>
    <Wax d="M50 90 C28 74 8 60 8 38 C8 23 19 12 32 12 C40 12 46 17 50 25 C54 17 60 12 68 12 C81 12 92 23 92 38 C92 60 72 74 50 90 Z" color={ND.pink} />
    <Line d="M37 54 C34 43 41 34 51 34 C60 34 66 41 66 49 C66 57 59 63 51 63" color="#ffffff" w={6} />
    <Line d="M29 47 L37 56 L45 48" color="#ffffff" w={6} />
  </>),
  tornado: () => (<>
    <Wax d="M10 16 C26 4 74 4 90 16 C90 26 78 30 72 34 C74 41 66 47 60 50 C62 57 55 62 51 66 C53 73 49 81 44 92 C39 83 39 74 42 68 C35 64 33 58 37 52 C29 48 25 42 29 36 C18 31 10 26 10 16 Z" color={ND.violet} />
    <Line d="M22 17 C40 24 62 24 80 16 M33 36 C46 41 60 39 67 34 M41 54 C47 56 53 55 56 51" color="#ffffff" w={4.5} />
  </>),
  lightning: () => (<>
    <Wax d="M58 4 L18 54 H44 L32 96 L84 40 H57 L70 4 Z" color={ND.yellow} />
    <Shine d="M55 14 L38 38" />
  </>),
  'mystery-box': () => (<>
    <Wax d="M50 32 C38 12 20 20 32 32 Z" color={ND.yellow} />
    <Wax d="M50 32 C62 12 80 20 68 32 Z" color={ND.yellow} />
    <Wax d="M16 44 H84 V84 C84 88 82 90 78 90 H22 C18 90 16 88 16 84 Z" color={ND.pink} />
    <Wax d="M10 31 H90 V46 H10 Z" color={ND.pink} />
    <Wax d="M43 31 H57 V46 H43 Z" color={ND.yellow} />
    <Line d="M40 59 C40 50 61 50 61 58 C61 65 51 65 51 73" color="#ffffff" w={7} />
    <Line d="M51 83 V83.5" color="#ffffff" w={8} />
  </>),
  'treasure-chest': () => (<>
    <Wax d="M10 50 V38 C10 24 27 16 50 16 C73 16 90 24 90 38 V50 Z" color={ND.tangerine} />
    <Wax d="M10 50 H90 V84 C90 88 88 90 84 90 H16 C12 90 10 88 10 84 Z" color={ND.tangerine} />
    <Wax d="M8 45 H92 V56 H8 Z" color={ND.yellow} />
    <Wax d="M41 44 H59 V66 C59 69 57 71 54 71 H46 C43 71 41 69 41 66 Z" color={ND.yellow} />
    <Line d="M50 55 V62" color={ND.ink} w={4.5} />
    <Shine d="M20 34 C24 28 30 25 38 23" />
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
  swap: () => (<>
    <Line d="M18 50 C18 30 34 18 54 18" color={ND.cobalt} w={13} />
    <Wax d="M50 4 L76 18 L50 32 Z" color={ND.cobalt} />
    <Line d="M82 50 C82 70 66 82 46 82" color={ND.pink} w={13} />
    <Wax d="M50 96 L24 82 L50 68 Z" color={ND.pink} />
  </>),
};

const SEED: Record<PowerId, number> = {
  magnet: 3, 'double-dice': 5, 'double-points': 7, shield: 11, freeze: 13, 'extra-time': 17, 'slow-mo': 19, 'one-more': 23,
  hint: 29, 'second-chance': 31, tornado: 37, lightning: 41, 'mystery-box': 43, 'treasure-chest': 47, 'spin-wheel': 53, potion: 59, swap: 61,
};

function Shell({ size, title, seed, sticker, children }: { size: number; title?: string; seed: number; sticker?: boolean; children: ReactNode }) {
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
  { id: 'treasure-chest', name: 'Treasure Chest', job: 'Bonus points.', games: '8 games (Prize Bag, Tip Jar, Golden Box, Treasure chest...)' },
  { id: 'second-chance', name: 'Second Chance', job: 'Try again after a miss.', games: '4 games (Second Chance, Extra Heart, Heart Snack, Safe Shovel); proposed for every quiz game' },
  { id: 'double-dice', name: 'Double Dice', job: 'Roll two dice and move both.', games: 'Every dice game: Board Game, Snakes and Ladders, Track Race' },
  { id: 'spin-wheel', name: 'Spin Wheel', job: 'Spin to see what happens.', games: 'Board Game, Game Show (Swap Spinner)' },
  { id: 'potion', name: 'Potion', job: 'A boost for your next few turns.', games: 'Board Game; fits any turn game' },
  { id: 'swap', name: 'Swap', job: 'Trade places or points with a player.', games: 'Optional, Share only, off by default: Game Show, Bowling, Pinball, Top Answers, Treasure Quest, Track Race', optional: true },
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
      style={{ width: size, height: size, transformOrigin: '50% 100%', outlineColor: ND.cobalt }}
      animate={tossing
        ? { y: [0, -size * 0.75, 0, -size * 0.26, 0, -size * 0.07, 0], scaleY: [1, 1.06, 0.76, 1.05, 0.9, 1, 1], scaleX: [1, 0.95, 1.2, 0.97, 1.08, 1, 1] }
        : phase === 'waiting' && !still ? { y: [0, -6, 0], scaleY: 1, scaleX: 1 } : { y: 0, scaleY: 1, scaleX: 1 }}
      transition={tossing
        ? { duration: 1.1, delay, times: [0, 0.28, 0.5, 0.64, 0.8, 0.9, 1], ease: ['easeOut', 'easeIn', 'easeOut', 'easeIn', 'easeOut', 'easeIn'] }
        : phase === 'waiting' && !still ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }}
      whileHover={phase !== 'rolling' && !still ? { scale: 1.05 } : undefined}>
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
      <button type="button" onClick={tap} disabled={phase === 'rolling'}
        className="rounded-full font-bold px-6 min-h-12 text-lg motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0.5 motion-safe:transition-transform disabled:opacity-60"
        style={{ background: phase === 'waiting' ? ND.paper : ND.cobalt, color: phase === 'waiting' ? ND.ink : '#ffffff', border: `2px solid ${ND.ink}`, boxShadow: `0 4px 0 ${phase === 'waiting' ? '#d9cfbd' : ND.cobaltDeep}` }}>
        {phase === 'waiting' ? 'Go on' : count === 2 ? 'Roll both' : 'Roll'}
      </button>
    </div>
  );
}

// ---------- The /brand section ----------
export function CrayonKitSection() {
  return (
    <div className="grid gap-8">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(10.5rem,1fr))] gap-3">
        {UNIVERSAL_POWERS.map((p) => (
          <div key={p.id} className="rounded-[1.5rem] p-4 grid justify-items-center content-start gap-1 text-center" style={{ background: ND.paper }}>
            <CrayonPowerUp id={p.id} size={112} title={p.name} />
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
        <h3 className="font-heading font-bold text-lg">The die: six faces, one side at a time</h3>
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
          Tap the die (or Roll) to roll. It tumbles through four hand-drawn frames, lands with a squash and two small bounces, then waits, glowing, until it is tapped, the same as the Board Game. Double dice land side by side a beat apart with no total written: kids count the pips (your rule, 2026-11-13); a screen reader hears both numbers. Still motion: a quick fade to the new face.
        </p>
      </div>
    </div>
  );
}
