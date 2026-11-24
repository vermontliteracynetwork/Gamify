import { createContext, memo, useContext, useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react';

// Territory's Classic art (teacher, 2026-11-24): her own Canva Territory pack
// (wall, baseboard, checker floor, arched mouse door, gray tabby, orange
// tabby, fluffy orange cat, brown, gray and white mice) redrawn as original
// code-drawn shapes in the Classic kit style; her files are reference only and
// never ship. Same hand as src/brand/CrayonKit.tsx (its Wax and CrayonFilter
// approach, copied here because games do not import from src/brand): smooth
// flat solid fills, a faint scribble at most, one slightly wobbly dark ink
// outline with rounded ends, chunky and a little lopsided shapes, palette
// pairs (src/brand/PaletteProposal) plus a few natural fur tones (FUR). The
// room adds scrapbook touches: cut-paper shapes with soft offset paper
// shadows, a ragged rug, a quiet doodle wallpaper, hand-ruled floor tiles.
// The animals are the game pieces, so they have simple faces (dot eyes, a
// tiny nose); never an expression of pain.

export const INK = '#1d1a33';
const P = {
  paper: '#fffaf0', cream: '#f6f0e4', butter: '#fff1b8', lemon: '#fabe37', peach: '#ffd9b3', orange: '#ff9b28',
  pink: '#f055a5', blush: '#ffd3e6', teal: '#1fb5a8', aqua: '#c9f1ee', kelly: '#22b04a', mint: '#c8f0dc',
  sky: '#4ba3e8', crystal: '#bfdff3', purple: '#7a88fe', gamify: '#b4c4fb', grape: '#6a45f0', lavender: '#ddd6ff',
};
// Nature tones (her pack: brown, gray and white mice; gray and orange cats; a
// wooden door), kept as named bright/deep pairs and used the same way
// everywhere (raised with the teacher as a "Nature tones" palette row).
const WOOD = { main: '#c47a45', deep: '#8a4f2a' };
const MOUSE_BROWN = { main: '#c9ac90', deep: '#8f7258' };
const GRAY = { main: '#aaa6bb', deep: '#5f5a76' };
const ORANGE_DEEP = '#b84300'; // the kit's orange deep shade (src/brand/CrayonKit)
const HOLE = INK;

// Team colors: Cats wear Orange with Peach, Mice wear Gamify purple with its pastel.
export const SIDE_COLOR = { defender: P.orange, invader: P.purple } as const;
export const SIDE_PASTEL = { defender: P.peach, invader: P.gamify } as const;

// The hand-drawn wobble on every outline (the kit's CrayonFilter: a small
// displacement, smooth fills, no grain). `big` is for the room's 1600 grid.
export function Wobble({ id, scale = 2.4, seed = 3, big }: { id: string; scale?: number; seed?: number; big?: boolean }) {
  return (
    <filter id={id} x="-12%" y="-12%" width="124%" height="124%">
      <feTurbulence type="fractalNoise" baseFrequency={big ? 0.012 : 0.045} numOctaves="2" seed={seed} result="w" />
      <feDisplacementMap in="SourceGraphic" in2="w" scale={big ? 9 : scale} xChannelSelector="R" yChannelSelector="G" />
    </filter>
  );
}
const cleanId = (s: string) => s.replace(/[^a-zA-Z0-9]/g, '');

// The kit's scribble: a faint back-and-forth fill, like a kid coloring in.
const SCRIBBLE = (() => {
  let d = 'M-30 -10';
  for (let k = 1; k < 46; k++) {
    const j = Math.sin(k * 7.13) * 2.5;
    d += k % 2 ? ` L${(-30 + k * 6 - 64 + j).toFixed(1)} 112` : ` L${(-30 + k * 6 + j).toFixed(1)} -12`;
  }
  return d;
})();
// One filled shape (the kit's Wax): flat fill, a faint scribble in the deep
// shade, one ink outline with rounded joins.
function Wax({ d, color, deep, w = 4.4, hatch = true }: { d: string; color: string; deep?: string; w?: number; hatch?: boolean }) {
  const clip = 'c' + cleanId(useId());
  return (
    <g>
      {hatch && deep && <clipPath id={clip}><path d={d} /></clipPath>}
      <path d={d} fill={color} />
      {hatch && deep && <path d={SCRIBBLE} clipPath={`url(#${clip})`} stroke={deep} strokeWidth="1.6" opacity="0.08" fill="none" />}
      <path d={d} fill="none" stroke={INK} strokeWidth={w} strokeLinejoin="round" strokeLinecap="round" />
    </g>
  );
}
// A thick colored line with an ink edge (the kit's Line with ink), for tails.
function Tube({ d, color, w = 8, dash }: { d: string; color: string; w?: number; dash?: { color: string; array: string } }) {
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke={INK} strokeWidth={w + 8} />
      <path d={d} stroke={color} strokeWidth={w} />
      {dash && <path d={d} stroke={dash.color} strokeWidth={w} strokeDasharray={dash.array} strokeLinecap="butt" />}
    </g>
  );
}
// Inside a RoomArt every piece shares one wobble filter per look (defined once
// for the whole stage); a piece on its own carries its own.
const SharedFilters = createContext<string | null>(null);
const PIECE_SEEDS = [3, 5, 7];
function Piece({ box = '0 0 100 100', grow = 1, seed = 0, children, className, style, label }: { box?: string; grow?: number; seed?: number; children: ReactNode; className?: string; style?: CSSProperties; label?: string }) {
  const own = 'w' + cleanId(useId());
  const shared = useContext(SharedFilters);
  const id = shared ? `${shared}${seed % PIECE_SEEDS.length}` : own;
  return (
    <svg viewBox={box} className={className} style={style} aria-hidden={label ? undefined : true} role={label ? 'img' : undefined} aria-label={label} overflow="visible">
      {!shared && <defs><Wobble id={id} seed={PIECE_SEEDS[seed % PIECE_SEEDS.length]} /></defs>}
      {/* a soft offset paper shadow under the feet */}
      <ellipse cx="54" cy="95" rx="38" ry="5" fill={INK} opacity="0.16" />
      <g transform={`translate(50 95) scale(${grow}) translate(-50 -95)`}>
        <g filter={`url(#${id})`} stroke={INK} strokeLinecap="round" strokeLinejoin="round">{children}</g>
      </g>
    </svg>
  );
}
// Kept for the poof (same family).
function Svg({ box, children, className, style }: { box: string; children: ReactNode; className?: string; style?: CSSProperties }) {
  const id = 'w' + cleanId(useId());
  return (
    <svg viewBox={box} className={className} style={style} aria-hidden="true" overflow="visible">
      <defs><Wobble id={id} /></defs>
      <g filter={`url(#${id})`} stroke={INK} strokeLinecap="round" strokeLinejoin="round">{children}</g>
    </svg>
  );
}
// A leg: a rounded stub, tilted for the stride, in the body color.
const leg = (x: number, top: number, w: number, h: number, tilt: number) => {
  const r = w / 2; const b = top + h;
  return { d: `M${x - r} ${top} L${x + r} ${top} L${x + r + 0.6} ${b - r} C${x + r + 0.6} ${b + 1.5} ${x - r - 0.6} ${b + 1.5} ${x - r - 0.6} ${b - r} Z`, t: `rotate(${tilt} ${x} ${top})` };
};
function Leg({ x, top, w = 12, h = 26, tilt = 0, color, deep, toe }: { x: number; top: number; w?: number; h?: number; tilt?: number; color: string; deep: string; toe?: string }) {
  const l = leg(x, top, w, h, tilt);
  return (
    <g transform={l.t}>
      <Wax d={l.d} color={color} deep={deep} w={4} />
      {toe && <path d={`M${x - w / 2 + 2} ${top + h - 5} C${x - 2} ${top + h - 7.5} ${x + 2} ${top + h - 7.5} ${x + w / 2 - 2} ${top + h - 5}`} fill="none" stroke={toe} strokeWidth="2.6" />}
    </g>
  );
}

// ---- Cats (defenders): gray tabby, orange tabby, fluffy orange -----------
// Walking side view, facing right (Stage flips them with `face`), on a
// square 100 x 100 piece, feet on y = 95, a little larger than the square.
export const CAT_LOOKS = ['Gray tabby', 'Orange tabby', 'Fluffy orange cat'] as const;
const CAT = [
  { body: GRAY.main, deep: GRAY.deep, chest: P.paper },
  { body: P.orange, deep: ORANGE_DEEP, chest: P.paper },
  // The fluffy one (her pack): solid Orange, no stripes, a Peach ruff on the
  // chest; it differs from the tabby by its cloud shape, plume and markings.
  { body: P.orange, deep: ORANGE_DEEP, chest: P.peach },
];
function CatFace({ cx, cy, flat }: { cx: number; cy: number; flat?: boolean }) {
  return (
    <g>
      <circle cx={cx - 7} cy={cy} r={flat ? 3.6 : 3.3} fill={INK} stroke="none" />
      <circle cx={cx + 7} cy={cy - 0.6} r={flat ? 3.6 : 3.3} fill={INK} stroke="none" />
      <path d={`M${cx - 2.6} ${cy + 6} C${cx - 1} ${cy + 5.2} ${cx + 1} ${cy + 5.2} ${cx + 2.6} ${cy + 6} C${cx + 1.6} ${cy + 8} ${cx - 1.6} ${cy + 8} ${cx - 2.6} ${cy + 6} Z`} fill={P.pink} strokeWidth="1.8" />
      <path d={`M${cx} ${cy + 8} C${cx - 0.6} ${cy + 10.4} ${cx - 3} ${cy + 11} ${cx - 4.6} ${cy + 10} M${cx} ${cy + 8} C${cx + 0.6} ${cy + 10.4} ${cx + 3} ${cy + 11} ${cx + 4.6} ${cy + 10}`} fill="none" strokeWidth="2" />
      <path d={`M${cx - 10} ${cy + 7} L${cx - 20} ${cy + 5.5} M${cx - 10} ${cy + 9.6} L${cx - 19} ${cy + 11.5} M${cx + 10} ${cy + 7} L${cx + 20} ${cy + 5.5} M${cx + 10} ${cy + 9.6} L${cx + 19} ${cy + 11.5}`} fill="none" strokeWidth="1.6" />
    </g>
  );
}
export function CatArt({ look = 0, className, style, label }: { look?: number; className?: string; style?: CSSProperties; label?: string }) {
  const k = look % CAT.length;
  const c = CAT[k];
  if (k === 2) {
    return (
      <Piece className={className} style={style} label={label} grow={1.12} seed={k}>
        {/* a big plume tail swept up behind */}
        <Wax d="M26 62 C12 60 4 48 6 34 C7 22 14 12 22 12 C30 12 34 20 30 26 C26 32 26 40 30 46 C34 54 34 62 26 62 Z" color={c.body} deep={c.deep} />
        <Leg x={30} top={70} w={14} h={24} tilt={6} color={c.body} deep={c.deep} />
        <Leg x={62} top={70} w={14} h={24} tilt={-5} color={c.body} deep={c.deep} />
        {/* the fluffy body, a lopsided cloud */}
        <Wax d="M18 66 C12 58 18 48 27 48 C30 40 42 38 48 43 C55 37 67 40 70 46 C78 47 84 55 80 63 C84 71 75 79 66 76 C59 82 46 81 40 77 C31 81 21 77 22 71 C17 71 15 68 18 66 Z" color={c.body} deep={c.deep} />
        <Leg x={42} top={72} w={15} h={23} tilt={-4} color={c.body} deep={c.deep} />
        <Leg x={72} top={70} w={15} h={25} tilt={4} color={c.body} deep={c.deep} />
        {/* ears, the ruff and the round flat face turned to us */}
        <Wax d="M60 34 C58 26 59 18 61 13 C66 16 71 20 74 24 Z" color={c.body} deep={c.deep} w={4} />
        <Wax d="M94 32 C96 24 95 17 93 12 C88 15 83 19 80 23 Z" color={c.body} deep={c.deep} w={4} />
        <path d="M63 26 C62 22 63 19 64 17 C66 19 68 21 69 23 Z M91 25 C92 21 91.6 18.6 90.6 16.6 C88.6 18.4 86.6 20.4 85.4 22.4 Z" fill={P.blush} stroke="none" />
        {/* two or three tufts in the orange deep shade, no stripes */}
        <path d="M14 32 C14 26 17 21 21 19 M30 56 C33 52 36 51 40 52 M46 68 C49 65 52 64 56 65" fill="none" stroke={c.deep} strokeWidth="3.2" />
        {/* the Peach ruff, on the chest only */}
        <Wax d="M66 72 C60 66 61 56 68 52 C75 49 84 53 85 61 C86 68 80 74 73 74 C70 74 68 73 66 72 Z" color={c.chest} hatch={false} w={3.6} />
        <Wax d="M77 19 C66 19 58 26 58 36 C58 47 66 53 77 53 C88 53 95 46 95 35 C95 25 87 19 77 19 Z" color={c.body} deep={c.deep} />
        <CatFace cx={77} cy={34} flat />
      </Piece>
    );
  }
  return (
    <Piece className={className} style={style} label={label} grow={1.12} seed={k}>
      {/* tail, raised with a hooked tip, a few bold stripes */}
      <Tube d="M22 52 C11 46 8 30 13 17 C15 12 21 11 22 16" color={c.body} w={5.4} dash={{ color: c.deep, array: '4 6' }} />
      {/* far legs */}
      <Leg x={26} top={66} tilt={10} color={c.body} deep={c.deep} toe={c.deep} />
      <Leg x={62} top={66} tilt={-8} color={c.body} deep={c.deep} toe={c.deep} />
      {/* the body: a lopsided bean */}
      <Wax d="M14 58 C12 46 25 40 45 41 C62 42 75 45 78 56 C81 69 67 75 46 75 C27 75 16 70 14 58 Z" color={c.body} deep={c.deep} />
      {/* three bold stripes, hand strokes from the back */}
      <path d="M28 43 C26 49 27 55 30 59 M40 42 C38 49 39 56 42 61 M52 42 C50 49 51 55 54 59" fill="none" stroke={c.deep} strokeWidth="5.4" />
      {/* near legs, mid stride */}
      <Leg x={36} top={68} tilt={-9} color={c.body} deep={c.deep} toe={c.deep} />
      <Leg x={70} top={66} tilt={9} color={c.body} deep={c.deep} toe={c.deep} />
      {/* ears, then the head turned a little toward us */}
      <Wax d="M60 30 C58 22 59 14 61 9 C66 12 71 16 74 21 Z" color={c.body} deep={c.deep} w={4} />
      <Wax d="M93 28 C95 20 94 13 92 8 C87 11 82 15 79 20 Z" color={c.body} deep={c.deep} w={4} />
      <path d="M63 23 C62 19 63 16 64 14 C66 16 68 18 69 20 Z M90 21 C91 17 90.6 14.6 89.6 12.6 C87.6 14.4 85.6 16.4 84.4 18.4 Z" fill={P.blush} stroke="none" />
      <Wax d="M77 15 C66 15 58 22 58 32 C58 43 66 49 77 49 C88 49 95 42 95 31 C95 21 87 15 77 15 Z" color={c.body} deep={c.deep} />
      <path d="M67 42 C67 37 71 35 77 35 C83 35 88 37 88 42 C86 47 69 47 67 42 Z" fill={c.chest} stroke="none" />
      <path d="M72 18 C72.6 21 73 23 73 25 M78 17 L78 23.6 M84 18 C83.4 21 83 23 83 25" fill="none" stroke={c.deep} strokeWidth="3" />
      <CatFace cx={77} cy={31} />
    </Piece>
  );
}

// ---- Mice (invaders): brown, gray and white -------------------------------
// Running side view, facing right (Stage flips them to run left), feet on
// y = 95; chunky enough to read at the back of the room.
export const MOUSE_LOOKS = ['Brown mouse', 'Gray mouse', 'White mouse'] as const;
const MOUSE = [
  { body: MOUSE_BROWN.main, deep: MOUSE_BROWN.deep },
  { body: GRAY.main, deep: GRAY.deep },
  { body: P.paper, deep: GRAY.main },
];
export function MouseArt({ look = 0, className, style, label }: { look?: number; className?: string; style?: CSSProperties; label?: string }) {
  const m = MOUSE[look % MOUSE.length];
  return (
    <Piece className={className} style={style} label={label} grow={1} seed={look}>
      <g transform="translate(50 95) scale(0.89) translate(-50 -95)">
      {/* long pink tail, curving back and up */}
      <Tube d="M18 76 C6 76 2 64 2 54 C2 47 8 45 11 49" color={P.blush} w={3.6} />
      {/* back foot, stretched out */}
      <Wax d="M22 84 C16 86 10 90 9 93 C14 95 22 93 28 89 Z" color={P.blush} w={3.4} hatch={false} />
      {/* the round body, a lopsided teardrop with the point at the nose */}
      <Wax d="M16 74 C13 58 28 47 48 47 C64 47 76 54 86 64 C92 70 93 75 88 78 C79 84 64 89 46 89 C29 89 18 84 16 74 Z" color={m.body} deep={m.deep} />
      {/* front foot reaching forward */}
      <Wax d="M64 84 C70 86 76 89 79 93 C74 95 66 93 60 89 Z" color={P.blush} w={3.4} hatch={false} />
      {/* big round ear */}
      <Wax d="M60 32 C50 32 46 40 47 48 C48 56 56 60 64 58 C72 56 75 48 72 40 C70 35 66 32 60 32 Z" color={m.body} deep={m.deep} w={4} />
      <path d="M60 39 C55 39 53 44 54 48 C55 52 59 53 63 52 C67 51 68 47 66.6 43.6 C65.6 41 63 39 60 39 Z" fill={P.blush} stroke="none" />
      <circle cx="76" cy="64" r="3.2" fill={INK} stroke="none" />
      <path d="M86.6 71 C89 68.6 93 69 94 72 C93 75 89 75.6 86.6 73.6 Z" fill={P.pink} strokeWidth="1.8" />
      <path d="M85 74 L97 71 M85 76.4 L97 78" fill="none" strokeWidth="1.5" />
      </g>
    </Piece>
  );
}

// ---- The entrance: an arched wooden mouse door in the baseboard -----------
// Standing a little open, so the dark hole behind shows where mice come from.
export function HoleArt({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <Svg box="0 0 100 90" className={className} style={style}>
      <ellipse cx="54" cy="89" rx="44" ry="3.4" fill={INK} opacity="0.16" stroke="none" />
      <Wax d="M10 89 L10 44 C10 17 29 3 50 3 C71 3 90 17 90 44 L90 89 Z" color={WOOD.deep} w={4.6} hatch={false} />
      <Wax d="M19 89 L19 46 C19 25 33 12 50 12 C67 12 81 25 81 46 L81 89 Z" color={HOLE} w={3.4} hatch={false} />
      <Wax d="M31 89 L30 41 C31 25 40 14 52 13 C67 13 81 26 81 46 L81 89 Z" color={WOOD.main} deep={WOOD.deep} w={4} />
      <path d="M45 17 C46 40 45 64 46 86 M62 16 C61 40 62 64 61 86" fill="none" strokeWidth="2.6" stroke={WOOD.deep} />
      <circle cx="38" cy="56" r="4.6" fill={P.lemon} strokeWidth="2.6" />
    </Svg>
  );
}

// ---- The poof: a soft puff of little stars (no harm shown) -----------------
export function PoofArt({ className, style }: { className?: string; style?: CSSProperties }) {
  const star = (x: number, y: number, r: number, fill: string) => {
    const d = `M${x} ${y - r} C${x + r * 0.15} ${y - r * 0.3} ${x + r * 0.3} ${y - r * 0.15} ${x + r} ${y} C${x + r * 0.3} ${y + r * 0.15} ${x + r * 0.15} ${y + r * 0.3} ${x} ${y + r} C${x - r * 0.15} ${y + r * 0.3} ${x - r * 0.3} ${y + r * 0.15} ${x - r} ${y} C${x - r * 0.3} ${y - r * 0.15} ${x - r * 0.15} ${y - r * 0.3} ${x} ${y - r} Z`;
    return <path d={d} fill={fill} strokeWidth="2.4" />;
  };
  return (
    <Svg box="0 0 100 100" className={className} style={style}>
      <path d="M30 70 C18 70 14 58 22 52 C18 40 32 32 40 38 C44 26 62 26 64 38 C74 32 86 42 80 52 C88 58 82 72 70 70 C64 78 38 78 30 70 Z" fill={P.paper} strokeWidth="3.4" />
      {star(14, 22, 10, P.lemon)}
      {star(84, 18, 9, P.pink)}
      {star(90, 70, 8, P.lemon)}
      {star(8, 74, 7, P.crystal)}
      {star(50, 10, 7, P.mint)}
      <circle cx="70" cy="86" r="3.4" fill={P.pink} strokeWidth="1.8" />
      <circle cx="28" cy="90" r="3" fill={P.lemon} strokeWidth="1.8" />
    </Svg>
  );
}

// ---- The room (her layout): a Blue crystal wall with a quiet doodle
// wallpaper, a wooden baseboard and a Butter and Peach checker floor in
// slightly uneven hand-ruled squares, plus cut-paper furniture. Drawn on a
// 1600 x 1000 grid (the room), with the wall and floor running well past the
// edges so a wide or tall box never shows dead space.
export const WALL_BOTTOM = 59; // % from the top where the floor starts
const FLOOR_Y = WALL_BOTTOM * 10;
const BASE_Y = FLOOR_Y - 46;
// A tiny repeatable jitter so hand-ruled lines are the same on every render.
const jit = (a: number, b: number) => Math.sin(a * 12.9898 + b * 78.233) * 43758.5453 % 1;
const TILES = (() => {
  const t = 112; const cols = 44; const rows = 24; const x0 = -1664;
  const pt = (i: number, j: number): [number, number] => [x0 + i * t + jit(i, j) * 7, FLOOR_Y + j * t * 0.86 + jit(j, i) * 6];
  let d = '';
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    if ((i + j) % 2) continue;
    const [a, b, c, e] = [pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1)];
    d += `M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}L${c[0].toFixed(1)} ${c[1].toFixed(1)}L${e[0].toFixed(1)} ${e[1].toFixed(1)}Z`;
  }
  return d;
})();
const WALLPAPER = (() => {
  let spark = ''; let dots = '';
  for (let j = 0; j < 12; j++) for (let i = 0; i < 30; i++) {
    const x = -1600 + i * 160 + (j % 2) * 80 + jit(i, j) * 16; const y = -1000 + j * 130 + 40 + jit(j, i) * 14;
    if (y > BASE_Y - 40) continue;
    if ((i + j) % 2) spark += `M${x} ${y - 14} C${x + 2} ${y - 4} ${x + 4} ${y - 2} ${x + 14} ${y} C${x + 4} ${y + 2} ${x + 2} ${y + 4} ${x} ${y + 14} C${x - 2} ${y + 4} ${x - 4} ${y + 2} ${x - 14} ${y} C${x - 4} ${y - 2} ${x - 2} ${y - 4} ${x} ${y - 14} Z`;
    else dots += `M${x - 6} ${y} a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0 Z`;
  }
  return { spark, dots };
})();
// The rug: a cut-paper oval with a ragged, hand-cut edge.
const ragged = (cx: number, cy: number, rx: number, ry: number, n: number, amp: number, seed: number) => {
  let d = '';
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2; const r = 1 + jit(k, seed) * amp;
    d += `${k ? 'L' : 'M'}${(cx + Math.cos(a) * rx * r).toFixed(1)} ${(cy + Math.sin(a) * ry * r).toFixed(1)}`;
  }
  return d + 'Z';
};
const W = 9; // room line weight, matched to the pieces' 4.4 on their own grid
// A cut-paper shape: an offset soft paper shadow, then the shape.
function Cut({ d, color, w = W, shadow = true }: { d: string; color: string; w?: number; shadow?: boolean }) {
  return (
    <g>
      {shadow && <path d={d} fill={INK} opacity="0.14" transform="translate(12 14)" stroke="none" />}
      <path d={d} fill={color} stroke="none" />
      <path d={d} fill="none" strokeWidth={w} />
    </g>
  );
}
// The room's scenery is static: memoized and on its own compositing layer, so
// the wobble filters run once and never again on animation frames.
const Scenery = memo(function Scenery() {
  const id = 'r' + cleanId(useId());
  return (
    <g stroke={INK} strokeLinecap="round" strokeLinejoin="round">
      <defs><Wobble id={id} big seed={5} /></defs>
      {/* wall and its quiet doodle wallpaper (low contrast, no ink) */}
      <rect x="-1700" y="-1100" width="5000" height={FLOOR_Y + 1100} fill={P.crystal} stroke="none" />
      <path d={WALLPAPER.spark} fill={P.paper} stroke="none" />
      <path d={WALLPAPER.dots} fill={P.gamify} stroke="none" />
      {/* floor: Butter ground, Peach hand-ruled squares */}
      <rect x="-1700" y={FLOOR_Y} width="5000" height="3000" fill={P.butter} stroke="none" />
      <path d={TILES} fill={P.peach} stroke="none" />
      <g filter={`url(#${id})`}>
        {/* the baseboard: warm wood with a cap and a few grain strokes */}
        <rect x="-1700" y={BASE_Y} width="5000" height={FLOOR_Y - BASE_Y} fill={WOOD.main} strokeWidth={W} />
        <path d={`M-1700 ${BASE_Y + 12} H3300`} fill="none" strokeWidth="5" stroke={WOOD.deep} />
        <path d="M-200 568 H-80 M180 574 H330 M560 566 H640 M900 576 H1040 M1460 568 H1560 M1800 574 H1900" fill="none" strokeWidth="4" stroke={WOOD.deep} />
        {/* the window (where scared cats hop out, logic EXIT about 18%, 22%) */}
        <Cut d="M120 60 H460 C470 60 476 66 476 76 V376 C476 386 470 392 460 392 H120 C110 392 104 386 104 376 V76 C104 66 110 60 120 60 Z" color={P.paper} />
        <path d="M140 96 H440 V356 H140 Z" fill={P.aqua} strokeWidth="7" />
        <circle cx="372" cy="160" r="34" fill={P.lemon} strokeWidth="7" />
        <path d="M170 300 C190 270 226 268 246 290 C266 266 306 270 314 300 Z" fill={P.paper} strokeWidth="6" />
        <path d="M290 96 V356 M140 226 H440" fill="none" strokeWidth="7" />
        <Cut d="M86 392 H494 C502 392 506 398 506 404 V414 C506 420 502 424 494 424 H86 C78 424 74 420 74 414 V404 C74 398 78 392 86 392 Z" color={WOOD.main} />
        <Cut d="M70 44 C120 120 96 300 120 440 L60 440 C50 300 54 140 40 44 Z" color={P.pink} />
        <Cut d="M510 44 C460 120 484 300 460 440 L520 440 C530 300 526 140 540 44 Z" color={P.pink} />
        <path d="M40 40 H540" fill="none" strokeWidth="11" />
        {/* a framed picture above the couch */}
        <Cut d="M640 140 H900 C910 140 914 146 914 154 V320 C914 328 910 334 900 334 H640 C630 334 626 328 626 320 V154 C626 146 630 140 640 140 Z" color={P.grape} />
        <path d="M656 170 H884 V304 H656 Z" fill={P.mint} strokeWidth="6" />
        <path d="M656 290 C700 236 740 236 770 268 C800 226 850 230 884 274 V304 H656 Z" fill={P.kelly} strokeWidth="6" />
        <circle cx="836" cy="208" r="18" fill={P.lemon} strokeWidth="6" />
        {/* a round wall clock */}
        <Cut d="M1330 110 C1380 106 1424 146 1424 196 C1424 248 1384 286 1332 286 C1282 286 1240 248 1242 196 C1244 146 1282 112 1330 110 Z" color={P.lemon} />
        <path d="M1333 140 C1366 140 1394 166 1394 198 C1394 230 1366 256 1333 256 C1300 256 1272 230 1272 198 C1272 166 1300 140 1333 140 Z" fill={P.paper} strokeWidth="6" />
        <path d="M1333 198 V160 M1333 198 L1362 214" fill="none" strokeWidth="8" />
        {/* the couch */}
        <Cut d="M560 470 C556 420 582 400 620 400 H980 C1018 400 1044 420 1040 470 L1040 560 H560 Z" color={P.teal} />
        <Cut d="M590 520 C590 498 608 490 630 490 H970 C992 490 1010 498 1010 520 V590 H590 Z" color={P.aqua} shadow={false} />
        <path d="M800 494 V588" fill="none" strokeWidth="7" />
        <Cut d="M520 510 C520 484 538 476 560 476 C582 476 598 486 598 510 V640 H520 Z" color={P.teal} />
        <Cut d="M1080 510 C1080 484 1062 476 1040 476 C1018 476 1002 486 1002 510 V640 H1080 Z" color={P.teal} />
        <Cut d="M598 590 H1002 V640 H598 Z" color={P.teal} shadow={false} />
        <Cut d="M640 496 C630 462 650 446 690 450 C726 452 740 468 734 496 C710 506 664 506 640 496 Z" color={P.lemon} shadow={false} w={7} />
        {/* a floor lamp */}
        <Cut d="M1100 640 C1100 624 1180 624 1180 640 Z" color={P.grape} />
        <path d="M1140 630 V380" fill="none" strokeWidth="11" />
        <Cut d="M1092 384 L1110 300 H1170 L1188 384 Z" color={P.lemon} />
        {/* a potted plant by the door */}
        <Cut d="M1450 520 C1420 470 1386 462 1372 420 C1410 424 1440 456 1452 506 Z" color={P.kelly} />
        <Cut d="M1452 512 C1462 460 1452 400 1472 360 C1496 404 1484 462 1458 514 Z" color={P.kelly} />
        <Cut d="M1460 516 C1488 482 1520 476 1544 448 C1528 496 1500 514 1464 524 Z" color={P.kelly} />
        <Cut d="M1404 530 H1528 L1512 640 H1420 Z" color={P.orange} />
        <Cut d="M1396 516 H1536 V546 H1396 Z" color={P.orange} shadow={false} />
      </g>
    </g>
  );
});

// How the room fits its box (teacher, 2026-11-24, Art Director: no empty
// bands). A box wider than 16 x 10 shows a 16 x 10 room in the middle with the
// wall and floor running on past its edges. A taller box fills completely: the
// room takes the whole box and the floor line rises (59% down to 45%), so the
// floor rows spread over the space and nothing is a bare band. `y` maps a
// logic spot row (logic.ts rows 64 to 87, the hole on 59) onto this floor.
export interface RoomFit {
  floor: number; aspect: number; ratio: number; // ratio = room height / width
  x: (logicX: number) => number; y: (logicY: number) => number;
  entrance: [number, number]; exit: [number, number];
  door: { left: number; top: number; width: number };
}
// The room is the whole box (a theme's picture keeps a 16 x 10 room). The
// scenery is drawn on a 1600-wide core: scaled by height and centered on a
// wide box, by width on a tall one, with the wall and floor running on past it.
function fitFor(w: number, h: number, themed?: boolean): RoomFit & { rw: number; rh: number; s: number; coreLeft: number } {
  const rw = themed ? Math.min(w, h * 1.6) : w;
  const rh = themed ? rw / 1.6 : h;
  const aspect = rw / rh; const ratio = rh / rw;
  const coreW = Math.min(rw, rh * 1.6);
  const s = coreW / 1600; const coreLeft = (rw - coreW) / 2;
  const toX = (u: number) => ((coreLeft + u * s) / rw) * 100;
  const toY = (u: number) => ((u * s) / rh) * 100;
  const floor = aspect >= 1.6 ? WALL_BOTTOM : Math.max(45, WALL_BOTTOM - ((1.6 - aspect) / 0.8) * 14);
  // The back row's feet sit in front of the couch: about half a back cat's height below the floor line.
  const first = floor + 0.55 * Math.min(18, 15 / ratio);
  const y = (ly: number) => (ly <= WALL_BOTTOM ? floor : first + ((ly - 64) / 23) * (90 - first));
  // Wide: the columns spread to the box's edges (Stage keeps each piece inside).
  const x = (lx: number) => aspect > 1.6 ? Math.max(4, Math.min(96, 50 + (lx - 50) * (aspect / 1.6))) : lx;
  return {
    rw, rh, s, coreLeft, floor, aspect, ratio, x, y,
    entrance: [toX(1280), floor], exit: [toX(290), Math.max(6, floor - toY(365))],
    door: { left: toX(1200), top: floor - toY(144), width: toX(1360) - toX(1200) },
  };
}
const FitContext = createContext<RoomFit>(fitFor(1600, 1000));
export const useRoomFit = () => useContext(FitContext);

// The rug: cut paper with a ragged edge, drawn for the floor's own shape so it
// never stretches, spanning the floor rows.
function Rug({ w, h }: { w: number; h: number }) {
  const id = 'g' + cleanId(useId());
  const vw = 1000; const vh = Math.max(120, (1000 * h) / Math.max(1, w));
  return (
    <svg viewBox={`0 0 ${vw} ${vh}`} className="absolute inset-0 w-full h-full" overflow="visible" aria-hidden="true">
      <defs><Wobble id={id} big seed={7} /></defs>
      <g filter={`url(#${id})`} stroke={INK} strokeLinecap="round" strokeLinejoin="round">
        <Cut d={ragged(500, vh / 2, 470, vh / 2 - 8, 90, 0.035, 1)} color={P.pink} w={W * 0.62} />
        <Cut d={ragged(500, vh / 2, 360, vh / 2 - 8 - Math.min(110, vh * 0.16), 70, 0.04, 2)} color={P.blush} w={W * 0.42} shadow={false} />
      </g>
    </svg>
  );
}

// The whole room. A theme's background picture replaces the drawn room (and
// keeps the 16 x 10 fit it was made for).
export function RoomArt({ background, entrance, className = '', children }: { background?: string; entrance?: string; className?: string; children?: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 1600, h: 1000 });
  useEffect(() => {
    const el = box.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => { const { width, height } = e.contentRect; if (width && height) setDims({ w: width, h: height }); });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const fit = fitFor(dims.w, dims.h, !!background);
  const { rw, rh, s, coreLeft } = fit;
  const left = (dims.w - rw) / 2 + coreLeft; const top = (dims.h - rh) / 2 + (fit.floor / 100) * rh - FLOOR_Y * s;
  // The rug spans the floor rows but never grows taller than a third of its width.
  const rugH = Math.min(93 - fit.floor - 2.5, ((0.82 * rw * 0.36) / rh) * 100);
  const filters = 'f' + cleanId(useId());
  return (
    <div ref={box} className={`${/\b(absolute|fixed)\b/.test(className) ? '' : 'relative'} grid place-items-center overflow-hidden ${className}`} style={{ background: background ? P.butter : P.crystal }}>
      {!background && (
        <svg viewBox="-1600 -1000 4800 4000" className="absolute" style={{ width: 4800 * s, height: 4000 * s, left: left - 1600 * s, top: top - 1000 * s, willChange: 'transform' }} aria-hidden="true"><Scenery /></svg>
      )}
      <div className="relative overflow-hidden" style={{ width: rw, height: rh, background: background ? `${P.butter} center / cover no-repeat url("${background}")` : undefined }}>
        {!background && (
          <div className="absolute" style={{ left: '9%', width: '82%', top: `${fit.floor + 2.5 + (93 - fit.floor - 2.5 - rugH) / 2}%`, height: `${rugH}%` }}>
            <Rug w={rw * 0.82} h={(rh * rugH) / 100} />
          </div>
        )}
        {/* The entrance always shows, so invaders have somewhere to come from:
            a big arched door standing in the baseboard, its foot on the floor line. */}
        <div className="absolute" style={{ left: `${fit.door.left}%`, top: `${fit.door.top}%`, width: `${fit.door.width}%`, aspectRatio: '100 / 90' }}>
          {entrance ? <img src={entrance} alt="" className="w-full h-full object-contain" draggable="false" /> : <HoleArt className="w-full h-full" />}
        </div>
        {/* one wobble filter per look, shared by every piece on the stage */}
        <svg width="0" height="0" className="absolute" aria-hidden="true"><defs>{PIECE_SEEDS.map((sd, k) => <Wobble key={k} id={`${filters}${k}`} seed={sd} />)}</defs></svg>
        <SharedFilters.Provider value={filters}><FitContext.Provider value={fit}>{children}</FitContext.Provider></SharedFilters.Provider>
      </div>
    </div>
  );
}

// A team badge: the side's color AND its animal (never color alone).
export function SideBadge({ side, look = 0, size = '3rem' }: { side: 'defender' | 'invader'; look?: number; size?: string }) {
  return (
    <span className="relative inline-flex items-center justify-center rounded-full shrink-0" style={{ width: `max(2.5rem, ${size})`, height: `max(2.5rem, ${size})`, background: SIDE_PASTEL[side], border: `0.16rem solid ${INK}` }} aria-hidden="true">
      {side === 'defender' ? <CatArt look={look} className="w-[72%] h-[72%]" /> : <MouseArt look={look} className="w-[74%] h-[74%]" />}
    </span>
  );
}
