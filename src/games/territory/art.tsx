import { createContext, memo, useContext, useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react';

// Territory's Classic art (teacher, 2026-11-24): her own Canva Territory pack
// (wall, baseboard, checker floor, arched mouse door, gray tabby, orange
// tabby, tuxedo cat, brown, gray and white mice) redrawn as original
// code-drawn shapes in the Classic kit style; her files are reference only and
// never ship. Same hand as src/brand/CrayonKit.tsx (its Wax and CrayonFilter
// approach, copied here because games do not import from src/brand): smooth
// flat solid fills, a faint scribble at most, one slightly wobbly dark ink
// outline with rounded ends, chunky and a little lopsided shapes, palette
// pairs (src/brand/PaletteProposal) plus a few natural fur tones (FUR). The
// room adds scrapbook touches: cut-paper shapes with soft offset paper
// shadows, hand-ruled floor tiles. Matched to her Canva pack (2026-11-24): a plain
// wall, a two-tone baseboard, a perspective checker floor, the wooden door.
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
const TAN = '#f3cd8c'; // her pack's floor square, a Nature tone beside Butter
const MOUSE_BROWN = { main: '#c9ac90', deep: '#8f7258' };
const GRAY = { main: '#aaa6bb', deep: '#5f5a76' };
const SLATE = { main: '#8c8a9a', deep: '#55536a' }; // the gray mouse: darker than the gray cat (Art Director)
const ORANGE_DEEP = '#b84300'; // the kit's orange deep shade (src/brand/CrayonKit)

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
// One silhouette (teacher, 2026-11-24: "blend the legs of the cats into their
// bodies so it looks like one"): every part's ink edge first, at double width,
// then every fill on top, so only the outer edge shows and the legs grow out
// of the body with no seam. The scribble runs across the whole shape.
type Part = { d: string; t?: string };
function One({ parts, color, deep, w = 4.4, children }: { parts: Part[]; color: string; deep: string; w?: number; children?: ReactNode }) {
  const clip = 'o' + cleanId(useId());
  return (
    <g>
      <clipPath id={clip}>{parts.map((p, i) => <path key={i} d={p.d} transform={p.t} />)}</clipPath>
      {parts.map((p, i) => <path key={i} d={p.d} transform={p.t} fill={INK} stroke={INK} strokeWidth={w * 2} strokeLinejoin="round" />)}
      {parts.map((p, i) => <path key={i} d={p.d} transform={p.t} fill={color} stroke="none" />)}
      <path d={SCRIBBLE} clipPath={`url(#${clip})`} stroke={deep} strokeWidth="1.6" opacity="0.08" fill="none" />
      {children}
    </g>
  );
}
const legPart = (x: number, top: number, w = 12, h = 26, tilt = 0): Part => { const l = leg(x, top - 6, w, h + 6, tilt); return { d: l.d, t: l.t }; };
function Paw({ x, top, w = 12, h = 26, tilt = 0, color, toe }: { x: number; top: number; w?: number; h?: number; tilt?: number; color?: string; toe?: string }) {
  const l = leg(x, top, w, h, tilt); const paw = leg(x, top + h - 12, w, 12, 0);
  return (
    <g transform={l.t}>
      {color && <path d={paw.d} fill={color} stroke="none" />}
      {color && <path d={`M${x - w / 2 - 0.4} ${top + h - 12} H${x + w / 2 + 0.4}`} fill="none" stroke={INK} strokeWidth="2.6" />}
      {toe && <path d={`M${x - w / 2 + 2} ${top + h - 5} C${x - 2} ${top + h - 7.5} ${x + 2} ${top + h - 7.5} ${x + w / 2 - 2} ${top + h - 5}`} fill="none" stroke={toe} strokeWidth="2.6" />}
    </g>
  );
}

// ---- Cats (defenders): gray tabby, orange tabby, tuxedo, one shape -----
// Walking side view, facing right (Stage flips them with `face`), on a
// square 100 x 100 piece, feet on y = 95, a little larger than the square.
export const CAT_LOOKS = ['Gray tabby', 'Orange tabby', 'Tuxedo cat'] as const;
const CAT = [
  { body: GRAY.main, deep: GRAY.deep, chest: P.paper, stripes: true },
  { body: P.orange, deep: ORANGE_DEEP, chest: P.paper, stripes: true },
  // The tuxedo (teacher, 2026-11-24, in place of the fluffy cat): the same
  // walking shape, a soft charcoal coat so the ink edge still reads, a white
  // bib, white paws and a white muzzle, no stripes.
  { body: '#4a4560', deep: '#2c2840', chest: P.paper, stripes: false, muzzle: true },
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
  return (
    <Piece className={className} style={style} label={label} grow={1.12} seed={k}>
      {/* tail, raised with a hooked tip, a few bold stripes */}
      <Tube d="M22 52 C11 46 8 30 13 17 C15 12 21 11 22 16" color={c.body} w={5.4} dash={c.stripes ? { color: c.deep, array: '4 6' } : undefined} />
      {/* body and legs as one shape (no seams), a lopsided bean mid stride */}
      <One color={c.body} deep={c.deep} parts={[
        legPart(26, 66, 12, 26, 10), legPart(62, 66, 12, 26, -8),
        { d: 'M14 58 C12 46 25 40 45 41 C62 42 75 45 78 56 C81 69 67 75 46 75 C27 75 16 70 14 58 Z' },
        legPart(36, 68, 12, 26, -9), legPart(70, 66, 12, 26, 9),
      ]}>
        {/* white paws (her pack) and toe lines */}
        <Paw x={26} top={66} tilt={10} color={c.chest === P.paper ? P.paper : undefined} toe={c.chest === P.paper ? GRAY.main : c.deep} />
        <Paw x={62} top={66} tilt={-8} color={c.chest === P.paper ? P.paper : undefined} toe={c.chest === P.paper ? GRAY.main : c.deep} />
        <Paw x={36} top={68} tilt={-9} color={c.chest === P.paper ? P.paper : undefined} toe={c.chest === P.paper ? GRAY.main : c.deep} />
        <Paw x={70} top={66} tilt={9} color={c.chest === P.paper ? P.paper : undefined} toe={c.chest === P.paper ? GRAY.main : c.deep} />
        {/* white bib from under the chin down the front (her pack) */}
        <path d="M66 46 C72 46 78 50 78 57 C78 64 73 70 67 71 C63 66 62 58 63 52 C63 49 64 47 66 46 Z" fill={c.chest} stroke="none" />
        {/* three bold stripes, hand strokes from the back */}
        {c.stripes && <path d="M28 43 C26 49 27 55 30 59 M40 42 C38 49 39 56 42 61 M52 42 C50 49 51 55 54 59" fill="none" stroke={c.deep} strokeWidth="5.4" />}
      </One>
      {/* ears, then the head turned a little toward us */}
      <Wax d="M60 30 C58 22 59 14 61 9 C66 12 71 16 74 21 Z" color={c.body} deep={c.deep} w={4} />
      <Wax d="M93 28 C95 20 94 13 92 8 C87 11 82 15 79 20 Z" color={c.body} deep={c.deep} w={4} />
      <path d="M63 23 C62 19 63 16 64 14 C66 16 68 18 69 20 Z M90 21 C91 17 90.6 14.6 89.6 12.6 C87.6 14.4 85.6 16.4 84.4 18.4 Z" fill={P.blush} stroke="none" />
      <Wax d="M77 15 C66 15 58 22 58 32 C58 43 66 49 77 49 C88 49 95 42 95 31 C95 21 87 15 77 15 Z" color={c.body} deep={c.deep} />
      <path d="M67 42 C67 37 71 35 77 35 C83 35 88 37 88 42 C86 47 69 47 67 42 Z" fill={c.chest} stroke="none" />
      {c.stripes && <path d="M72 18 C72.6 21 73 23 73 25 M78 17 L78 23.6 M84 18 C83.4 21 83 23 83 25" fill="none" stroke={c.deep} strokeWidth="3" />}
      {c.muzzle && <path d="M77 24 C73 26 69 30 68 36 C70 41 84 41 86 36 C85 30 81 26 77 24 Z" fill={P.paper} stroke="none" />}
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
  { body: SLATE.main, deep: SLATE.deep },
  { body: P.paper, deep: GRAY.main },
];
export function MouseArt({ look = 0, className, style, label }: { look?: number; className?: string; style?: CSSProperties; label?: string }) {
  const m = MOUSE[look % MOUSE.length];
  return (
    <Piece className={className} style={style} label={label} grow={1} seed={look}>
      <g transform="translate(50 95) scale(0.89) translate(-50 -95)">
      {/* long thin pink tail trailing behind, rising gently (her pack) */}
      <Tube d="M18 76 C8 76 2 70 -6 60" color={P.blush} w={2.8} />
      {/* back foot, stretched out */}
      <Wax d="M22 84 C16 86 10 90 9 93 C14 95 22 93 28 89 Z" color={P.blush} w={3.4} hatch={false} />
      {/* the round body, a lopsided teardrop with the point at the nose */}
      <Wax d="M16 74 C13 58 28 47 48 47 C64 47 76 54 86 64 C92 70 93 75 88 78 C79 84 64 89 46 89 C29 89 18 84 16 74 Z" color={m.body} deep={m.deep} />
      {/* front foot reaching forward */}
      <Wax d="M64 84 C70 86 76 89 79 93 C74 95 66 93 60 89 Z" color={P.blush} w={3.4} hatch={false} />
      {/* the far ear, behind, in the deep shade */}
      <Wax d="M49 35 C39 35 35 43 36 51 C37 59 45 63 53 61 C61 59 64 51 61 43 C59 38 55 35 49 35 Z" color={m.body === P.paper ? P.cream : m.deep} w={4} hatch={false} />
      {/* big round ear */}
      <Wax d="M60 32 C50 32 46 40 47 48 C48 56 56 60 64 58 C72 56 75 48 72 40 C70 35 66 32 60 32 Z" color={m.body} deep={m.deep} w={4} />
      <path d="M60 39 C55 39 53 44 54 48 C55 52 59 53 63 52 C67 51 68 47 66.6 43.6 C65.6 41 63 39 60 39 Z" fill={P.blush} stroke="none" />
      <circle cx="76" cy="64" r="3.2" fill={INK} stroke="none" />
      <path d="M86.6 71 C89 68.6 93 69 94 72 C93 75 89 75.6 86.6 73.6 Z" fill={P.pink} strokeWidth="1.8" />
      <path d="M85 74 L97 71 M85 76.4 L97 78" fill="none" strokeWidth="1.5" />
      <path d="M84 76 C82 79 79 80 76 79" fill="none" strokeWidth="1.8" />
      </g>
    </Piece>
  );
}

// ---- The entrance: an arched wooden mouse door in the baseboard -----------
// Standing a little open, so the dark hole behind shows where mice come from.
export function HoleArt({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <Svg box="0 0 100 90" className={className} style={style}>
      <ellipse cx="50" cy="89" rx="44" ry="3.4" fill={INK} opacity="0.16" stroke="none" />
      {/* her pack's door: a tall rounded wooden door, plank frame, wavy grain, a lever handle */}
      <Wax d="M12 89 L11 42 C11 16 29 2 50 2 C72 2 89 16 89 42 L88 89 Z" color={WOOD.deep} w={4.6} hatch={false} />
      <Wax d="M20 89 L19 44 C19 22 33 10 50 10 C67 10 81 22 81 44 L80 89 Z" color={WOOD.main} deep={WOOD.deep} w={3.6} />
      <path d="M36 14 C33 34 38 54 34 87 M50 11 C53 32 47 58 51 87 M64 14 C61 38 66 60 63 87" fill="none" strokeWidth="2.4" stroke={WOOD.deep} />
      <path d="M14 30 L21 32 M12 52 L19 52 M12 72 L19 71 M86 30 L79 32 M88 52 L81 52 M88 72 L81 71" fill="none" strokeWidth="2.4" stroke={INK} />
      <path d="M70 46 C74 44 76 48 73 51 L72 62 C72 65 68 65 68 62 L69 51 C67 49 67 47 70 46 Z" fill={P.butter} strokeWidth="2.4" />
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
  // Her pack's floor: a checker in perspective, the squares growing toward the
  // front and the columns running back to the middle of the room.
  const t = 150; const cols = 60; const x0 = 800 - 30 * t;
  const rowsY: number[] = [FLOOR_Y]; let hgt = 34;
  while (rowsY[rowsY.length - 1] < FLOOR_Y + 2600) { rowsY.push(rowsY[rowsY.length - 1] + hgt); hgt *= 1.16; }
  const f = (y: number) => 0.42 + (y - FLOOR_Y) / 520;
  const pt = (i: number, j: number): [number, number] => { const y = rowsY[j] + (j ? jit(j, i) * 3 : 0); return [800 + (x0 + i * t - 800) * f(y) + jit(i, j) * 4, y]; };
  let d = '';
  for (let j = 0; j < rowsY.length - 1; j++) for (let i = 0; i < cols; i++) {
    if ((i + j) % 2) continue;
    const [a, b, c, e] = [pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1)];
    d += `M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}L${c[0].toFixed(1)} ${c[1].toFixed(1)}L${e[0].toFixed(1)} ${e[1].toFixed(1)}Z`;
  }
  return d;
})();
const W = 9; // room line weight, matched to the pieces' 4.4 on their own grid
// The room's scenery is static: memoized and on its own compositing layer, so
// the wobble filters run once and never again on animation frames.
const Scenery = memo(function Scenery() {
  const id = 'r' + cleanId(useId());
  return (
    <g stroke={INK} strokeLinecap="round" strokeLinejoin="round">
      <defs><Wobble id={id} big seed={5} /></defs>
      {/* her pack's room: a plain wall, a two-tone wooden baseboard, a checker floor */}
      <rect x="-1700" y="-1100" width="5000" height={FLOOR_Y + 1100} fill={P.crystal} stroke="none" />
      <rect x="-1700" y={FLOOR_Y} width="5000" height="3000" fill={P.butter} stroke="none" />
      <path d={TILES} fill={TAN} stroke="none" />
      <g filter={`url(#${id})`}>
        <rect x="-1700" y={BASE_Y} width="5000" height={FLOOR_Y - BASE_Y} fill={WOOD.main} strokeWidth={W} />
        <rect x="-1700" y={BASE_Y + (FLOOR_Y - BASE_Y) * 0.55} width="5000" height={(FLOOR_Y - BASE_Y) * 0.45} fill={WOOD.deep} stroke="none" />
        <path d={`M-1700 ${BASE_Y} H3300 M-1700 ${FLOOR_Y} H3300`} fill="none" strokeWidth={W} />
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
  // The back row's feet sit just in front of the baseboard: about half a back cat's height below the floor line.
  const first = floor + 0.55 * Math.min(18, 15 / ratio);
  const y = (ly: number) => (ly <= WALL_BOTTOM ? floor : first + ((ly - 64) / 23) * (90 - first));
  // Wide: the columns spread to the box's edges (Stage keeps each piece inside).
  const x = (lx: number) => aspect > 1.6 ? Math.max(4, Math.min(96, 50 + (lx - 50) * (aspect / 1.6))) : lx;
  return {
    rw, rh, s, coreLeft, floor, aspect, ratio, x, y,
    entrance: [toX(1290), floor], exit: [-14, floor + 6],
    door: { left: toX(1215), top: floor - toY(135), width: toX(1365) - toX(1215) },
  };
}
const FitContext = createContext<RoomFit>(fitFor(1600, 1000));
export const useRoomFit = () => useContext(FitContext);

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
  const filters = 'f' + cleanId(useId());
  return (
    <div ref={box} className={`${/\b(absolute|fixed)\b/.test(className) ? '' : 'relative'} grid place-items-center overflow-hidden ${className}`} style={{ background: background ? P.butter : P.crystal }}>
      {!background && (
        <svg viewBox="-1600 -1000 4800 4000" className="absolute" style={{ width: 4800 * s, height: 4000 * s, left: left - 1600 * s, top: top - 1000 * s, willChange: 'transform' }} aria-hidden="true"><Scenery /></svg>
      )}
      <div className="relative overflow-hidden" style={{ width: rw, height: rh, background: background ? `${P.butter} center / cover no-repeat url("${background}")` : undefined }}>
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
