import { useId, type CSSProperties, type ReactNode } from 'react';

// Territory's Classic art (teacher, 2026-11-24): a 2D living room in the
// Classic style, drawn in code (no files, no licenses): smooth flat fills, one
// slightly wobbly dark ink outline, palette pairs (src/brand/PaletteProposal).
// Since 2026-11-24 it redraws her own Canva Territory pack (wall, baseboard,
// checker floor, arched mouse door, gray tabby, orange tabby, fluffy orange
// cat, brown, gray and white mice) as original code-drawn shapes; her files
// are reference only and never ship. The animals are the game pieces, so they
// have simple faces (dot eyes, a tiny nose); never an expression of pain. The
// fur colors need a few natural tones beside the palette: FUR below.

export const INK = '#1d1a33';
const P = {
  paper: '#fffaf0', cream: '#f6f0e4', butter: '#fff1b8', lemon: '#fabe37', peach: '#ffd9b3', orange: '#ff9b28',
  pink: '#f055a5', blush: '#ffd3e6', teal: '#1fb5a8', aqua: '#c9f1ee', kelly: '#22b04a', mint: '#c8f0dc',
  sky: '#4ba3e8', crystal: '#bfdff3', purple: '#7a88fe', gamify: '#b4c4fb', grape: '#6a45f0', lavender: '#ddd6ff',
};
// Natural fur (her pack: brown, gray and white mice; gray and orange tabbies).
const FUR = { brown: '#b47a4e', brownDeep: '#7a4a2c', gray: '#a9a4ba', grayDeep: '#5f5a76', ginger: '#d9690c', taupe: '#c9ac90', slate: '#8f93a8' };

// Team colors: Cats wear Orange with Peach, Mice wear Gamify purple with its pastel.
export const SIDE_COLOR = { defender: P.orange, invader: P.purple } as const;
export const SIDE_PASTEL = { defender: P.peach, invader: P.gamify } as const;

// The hand-drawn wobble on every outline (a small displacement, no grain).
export function Wobble({ id, scale = 2.2, seed = 3 }: { id: string; scale?: number; seed?: number }) {
  return (
    <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed={seed} result="w" />
      <feDisplacementMap in="SourceGraphic" in2="w" scale={scale} xChannelSelector="R" yChannelSelector="G" />
    </filter>
  );
}
const cleanId = (s: string) => s.replace(/[^a-zA-Z0-9]/g, '');
function Svg({ box, children, className, style, label }: { box: string; children: ReactNode; className?: string; style?: CSSProperties; label?: string }) {
  const id = 'w' + cleanId(useId());
  return (
    <svg viewBox={box} className={className} style={style} aria-hidden={label ? undefined : true} role={label ? 'img' : undefined} aria-label={label} overflow="visible">
      <defs><Wobble id={id} /></defs>
      <g filter={`url(#${id})`} stroke={INK} strokeLinecap="round" strokeLinejoin="round">{children}</g>
    </svg>
  );
}

// ---- Cats (defenders): gray tabby, orange tabby, fluffy orange -----------
// Her Canva pack (teacher, 2026-11-24) is the layout reference only: these are
// original shapes drawn here in the Classic style, walking side view, facing
// right (Stage flips them with `face`), on a square 100 x 100 piece, feet on y = 94.
export const CAT_LOOKS = ['Gray tabby', 'Orange tabby', 'Fluffy orange cat'] as const;
const CAT = [
  { body: FUR.gray, stripe: FUR.grayDeep, ear: P.blush, chest: P.paper, paw: P.paper },
  { body: P.orange, stripe: FUR.ginger, ear: P.blush, chest: P.paper, paw: P.paper },
  { body: P.orange, stripe: FUR.ginger, ear: P.blush, chest: P.peach, paw: P.orange },
];
// A leg as an outlined tube: ink first, then the fur, then a paw tip.
function Leg({ d, fur, paw, w = 9 }: { d: string; fur: string; paw: string; w?: number }) {
  return (
    <>
      <path d={d} fill="none" stroke={INK} strokeWidth={w + 4} />
      <path d={d} fill="none" stroke={fur} strokeWidth={w} />
      <path d={d} fill="none" stroke={paw} strokeWidth={w} pathLength={10} strokeDasharray="2.4 7.6" strokeDashoffset={-7.6} />
    </>
  );
}
export function CatArt({ look = 0, className, style, label }: { look?: number; className?: string; style?: CSSProperties; label?: string }) {
  const k = look % CAT.length;
  const c = CAT[k];
  const clip = 'c' + cleanId(useId());
  const fluffy = k === 2;
  if (fluffy) {
    return (
      <Svg box="0 0 100 100" className={className} style={style} label={label}>
        {/* a big plume tail, swept up behind, with a fluffy edge */}
        <path d="M26 58 C14 56 6 46 6 34 C4 26 8 18 14 14 C16 8 24 4 30 8 C36 6 40 12 36 16 C38 20 34 24 30 24 C26 30 26 38 30 44 C34 50 34 56 26 58 Z" fill={c.body} strokeWidth="3.8" />
        <path d="M14 36 C12 28 14 20 20 16 M22 44 C18 40 18 34 20 30" fill="none" strokeWidth="2.2" stroke={c.stripe} />
        {/* far legs, short and thick */}
        <Leg d="M32 72 L28 90" fur={FUR.ginger} paw={FUR.ginger} w={12} />
        <Leg d="M62 72 L64 90" fur={FUR.ginger} paw={FUR.ginger} w={12} />
        {/* the fluffy body: a cloud with a scalloped edge */}
        <path d="M20 64 C14 58 18 48 26 48 C28 40 40 38 46 42 C52 36 64 38 68 44 C76 44 82 52 78 60 C82 68 74 76 66 74 C60 80 48 80 42 76 C34 80 24 76 24 70 C18 70 16 66 20 64 Z" fill={c.body} strokeWidth="4" />
        <path d="M30 56 C32 52 36 50 40 51 M44 62 C46 58 50 56 54 57 M28 68 C30 65 33 64 36 65" fill="none" strokeWidth="2.2" stroke={c.stripe} />
        {/* near legs, short and fluffy */}
        <Leg d="M40 74 L38 92" fur={c.body} paw={c.paw} w={12} />
        <Leg d="M70 72 L72 92" fur={c.body} paw={c.paw} w={12} />
        {/* the ruff and the round flat face, turned to us */}
        <path d="M62 60 C56 54 58 44 64 42 C70 36 84 36 88 44 C94 48 92 58 86 62 C80 68 68 68 62 60 Z" fill={c.chest} strokeWidth="3.4" />
        <path d="M60 34 L60 14 L72 24 Z M92 34 L94 14 L80 24 Z" fill={c.body} strokeWidth="3.6" />
        <path d="M62 28 L62 19 L68 24 Z M90 28 L91 19 L84 24 Z" fill={c.ear} strokeWidth="0" />
        <path d="M76 20 C66 20 58 26 58 36 C58 46 66 52 76 52 C86 52 94 46 94 36 C94 26 86 20 76 20 Z" fill={c.body} strokeWidth="4" />
        <path d="M60 30 C56 32 56 36 59 38 M92 30 C96 32 96 36 93 38" fill="none" strokeWidth="2.4" />
        <circle cx="69" cy="35" r="3.4" fill={INK} strokeWidth="0" />
        <circle cx="83" cy="35" r="3.4" fill={INK} strokeWidth="0" />
        <circle cx="68" cy="33.8" r="1.1" fill={P.paper} strokeWidth="0" />
        <circle cx="82" cy="33.8" r="1.1" fill={P.paper} strokeWidth="0" />
        <path d="M73.5 41 L78.5 41 L76 43.6 Z" fill={P.pink} strokeWidth="1.4" />
        <path d="M76 43.6 C75 46 73 46.4 71.6 45.6 M76 43.6 C77 46 79 46.4 80.4 45.6" fill="none" strokeWidth="1.8" />
        <path d="M66 42 L56 41 M66 45 L57 47 M86 42 L96 41 M86 45 L95 47" fill="none" strokeWidth="1.3" />
        <path d="M64 28 C66 25 69 23 72 23" fill="none" strokeWidth="2.4" stroke={P.paper} opacity="0.9" />
      </Svg>
    );
  }
  return (
    <Svg box="0 0 100 100" className={className} style={style} label={label}>
      <defs><clipPath id={clip}><path d="M16 54 C16 42 30 38 48 40 C62 41 72 44 74 54 C76 66 64 70 46 70 C28 70 16 66 16 54 Z" /></clipPath></defs>
      {/* tail, raised with a curl at the tip */}
      <path d="M20 50 C10 42 8 26 14 14 C16 9 22 9 22 14" fill="none" stroke={INK} strokeWidth="11" />
      <path d="M20 50 C10 42 8 26 14 14 C16 9 22 9 22 14" fill="none" stroke={c.body} strokeWidth="6.4" />
      <path d="M20 50 C10 42 8 26 14 14 C16 9 22 9 22 14" fill="none" stroke={c.stripe} strokeWidth="6.4" strokeDasharray="3 6" strokeLinecap="butt" />
      {/* far legs, a step behind */}
      <Leg d="M28 66 L22 90" fur={c.stripe} paw={c.paw} />
      <Leg d="M60 66 L58 90" fur={c.stripe} paw={c.paw} />
      {/* body with stripes */}
      <path d="M16 54 C16 42 30 38 48 40 C62 41 72 44 74 54 C76 66 64 70 46 70 C28 70 16 66 16 54 Z" fill={c.body} strokeWidth="4" />
      <g clipPath={`url(#${clip})`} fill="none" stroke={c.stripe} strokeWidth="4.2">
        <path d="M26 38 C24 48 26 56 30 62 M36 37 C34 48 36 56 40 64 M46 38 C44 48 46 56 50 66 M56 39 C54 48 56 56 60 64" />
      </g>
      <path d="M58 70 C58 60 64 52 72 52 C74 60 70 68 66 70 Z" fill={c.chest} strokeWidth="2.6" />
      {/* near legs, mid stride */}
      <Leg d="M34 68 L40 92" fur={c.body} paw={c.paw} />
      <Leg d="M66 66 L74 90" fur={c.body} paw={c.paw} />
      {/* ears */}
      <path d="M62 30 L60 10 L74 20 Z M88 28 L92 10 L78 18 Z" fill={c.body} strokeWidth="3.6" />
      <path d="M63.5 25 L63 15 L70 20 Z M87 24 L89 15 L82 19 Z" fill={c.ear} strokeWidth="0" />
      {/* head, turned a little toward us */}
      <path d="M76 16 C66 16 58 22 58 32 C58 42 66 48 76 48 C86 48 94 42 94 32 C94 22 86 16 76 16 Z" fill={c.body} strokeWidth="4" />
      <path d="M70 18 L72 24 M76 17 L76 23 M82 18 L80 24" fill="none" strokeWidth="2.4" stroke={c.stripe} />
      <path d="M68 42 C68 36 72 34 77 34 C82 34 88 36 88 42 C86 47 70 47 68 42 Z" fill={c.chest} strokeWidth="0" />
      <circle cx="70" cy="30" r="3.2" fill={INK} strokeWidth="0" />
      <circle cx="84" cy="30" r="3.2" fill={INK} strokeWidth="0" />
      <circle cx="69" cy="29" r="1" fill={P.paper} strokeWidth="0" />
      <circle cx="83" cy="29" r="1" fill={P.paper} strokeWidth="0" />
      <path d="M74.5 36 L79.5 36 L77 38.6 Z" fill={P.pink} strokeWidth="1.4" />
      <path d="M77 38.6 C76 41 74 41.4 72.6 40.6 M77 38.6 C78 41 80 41.4 81.4 40.6" fill="none" strokeWidth="1.8" />
      <path d="M68 37 L58 36 M68 40 L59 42 M86 37 L96 36 M86 40 L95 42" fill="none" strokeWidth="1.3" />
      <path d="M62 26 C64 22 67 20 70 20" fill="none" strokeWidth="2.4" stroke={P.paper} opacity="0.9" />
    </Svg>
  );
}

// ---- Mice (invaders): brown, gray and white -------------------------------
// Running side view, facing right (Stage flips them to run left), feet near the bottom.
export const MOUSE_LOOKS = ['Brown mouse', 'Gray mouse', 'White mouse'] as const;
const MOUSE = [FUR.taupe, FUR.slate, P.paper];
export function MouseArt({ look = 0, className, style, label }: { look?: number; className?: string; style?: CSSProperties; label?: string }) {
  const body = MOUSE[look % MOUSE.length];
  return (
    <Svg box="0 0 100 100" className={className} style={style} label={label}>
      {/* long pink tail, curving back and up */}
      <path d="M24 76 C12 76 8 66 4 56 C2 50 6 46 10 48" fill="none" stroke={INK} strokeWidth="6.4" />
      <path d="M24 76 C12 76 8 66 4 56 C2 50 6 46 10 48" fill="none" stroke={P.blush} strokeWidth="3" />
      {/* back feet, stretched out behind */}
      <path d="M30 84 C24 88 18 90 14 90" fill="none" stroke={INK} strokeWidth="6.4" />
      <path d="M30 84 C24 88 18 90 14 90" fill="none" stroke={P.blush} strokeWidth="3" />
      {/* the round body, a teardrop with the point at the nose */}
      <path d="M20 74 C18 60 32 52 50 52 C64 52 74 58 84 66 C90 70 92 74 88 77 C80 82 66 86 48 86 C30 86 22 82 20 74 Z" fill={body} strokeWidth="3.8" />
      <circle cx="90" cy="74.5" r="3" fill={P.pink} strokeWidth="1.6" />
      {/* front feet, reaching forward */}
      <path d="M66 84 C72 88 76 90 80 90" fill="none" stroke={INK} strokeWidth="6.4" />
      <path d="M66 84 C72 88 76 90 80 90" fill="none" stroke={P.blush} strokeWidth="3" />
      {/* big round ear */}
      <circle cx="62" cy="50" r="11" fill={body} strokeWidth="3.6" />
      <circle cx="62.5" cy="50.5" r="6" fill={P.blush} strokeWidth="0" />
      <circle cx="76" cy="66" r="2.6" fill={INK} strokeWidth="0" />
      <circle cx="75.3" cy="65.2" r="0.8" fill={P.paper} strokeWidth="0" />
      <path d="M86 71 L96 68 M86 73 L97 74" fill="none" strokeWidth="1.2" />
      <path d="M34 60 C40 56 48 55 54 56" fill="none" strokeWidth="2.4" stroke={P.paper} opacity={look % MOUSE.length === 2 ? 0 : 0.85} />
    </Svg>
  );
}

// ---- The entrance: an arched wooden mouse door in the baseboard -----------
// Standing a little open, so the dark hole behind shows where mice come from.
export function HoleArt({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <Svg box="0 0 100 90" className={className} style={style}>
      <path d="M12 89 L12 44 C12 18 30 4 50 4 C70 4 88 18 88 44 L88 89 Z" fill={FUR.brownDeep} strokeWidth="4.6" />
      <path d="M20 89 L20 46 C20 26 34 13 50 13 C66 13 80 26 80 46 L80 89 Z" fill="#241f38" strokeWidth="3" />
      <path d="M30 89 L30 40 C30 24 40 14 52 13 C66 14 80 26 80 46 L80 89 Z" fill={FUR.brown} strokeWidth="3.8" />
      <path d="M46 16 V87 M62 16 V87" fill="none" strokeWidth="2.2" stroke={FUR.brownDeep} />
      <path d="M38 34 C40 26 44 20 50 18" fill="none" strokeWidth="2.6" stroke={P.peach} opacity="0.8" />
      <path d="M38 52 C34 54 34 60 37 62" fill="none" strokeWidth="5.4" />
      <path d="M38 52 C34 54 34 60 37 62" fill="none" strokeWidth="2.4" stroke={P.lemon} />
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

// ---- The room (her layout): a blue wall, a wooden baseboard and a butter
// and peach checker-tile floor seen in a little perspective.
const WALL = P.crystal;
// The checker floor: rows grow toward the front, columns run to one point.
const FLOOR_TILES = (() => {
  const N = 7, W = 160, H = 40, vx = 80, vy = -70, cw = 14;
  const ys = Array.from({ length: N + 1 }, (_, k) => H * (k / N) ** 1.35);
  const xAt = (xb: number, y: number) => vx + (xb - vx) * (y - vy) / (H - vy);
  const cells: string[] = [];
  for (let k = 0; k < N; k++) for (let j = -14; j < 14; j++) {
    if ((j + k) % 2 === 0) continue;
    const a = vx + j * cw, b = a + cw, y0 = ys[k], y1 = ys[k + 1];
    cells.push(`M${xAt(a, y0).toFixed(2)} ${y0.toFixed(2)}L${xAt(b, y0).toFixed(2)} ${y0.toFixed(2)}L${xAt(b, y1).toFixed(2)} ${y1.toFixed(2)}L${xAt(a, y1).toFixed(2)} ${y1.toFixed(2)}Z`);
  }
  return { W, H, d: cells.join('') };
})();
function Floor() {
  return (
    <svg viewBox={`0 0 ${FLOOR_TILES.W} ${FLOOR_TILES.H}`} preserveAspectRatio="none" className="absolute inset-0 w-full h-full" aria-hidden="true">
      <rect width={FLOOR_TILES.W} height={FLOOR_TILES.H} fill={P.butter} />
      <path d={FLOOR_TILES.d} fill={P.peach} />
    </svg>
  );
}

// One small window, where scared cats hop out (logic EXIT is about 18%, 22%).
function Window() {
  return (
    <Svg box="0 0 200 180">
      <rect x="12" y="10" width="176" height="150" rx="10" fill={P.paper} strokeWidth="6" />
      <rect x="28" y="26" width="144" height="118" rx="4" fill={P.aqua} strokeWidth="4" />
      <circle cx="138" cy="60" r="16" fill={P.lemon} strokeWidth="4" />
      <path d="M42 112 C54 98 70 98 80 108 C92 96 110 98 116 112 Z" fill={P.paper} strokeWidth="3.4" />
      <path d="M100 26 V144 M28 85 H172" fill="none" strokeWidth="4" />
      <path d="M4 164 H196" fill="none" strokeWidth="8" stroke={FUR.brown} />
      <path d="M4 164 H196" fill="none" strokeWidth="2" />
    </Svg>
  );
}

export const WALL_BOTTOM = 59; // % from the top where the floor starts
// The room's own height inside its box (16 x 10, fitted).
const RH = 'min(100cqh, 62.5cqw)';

// The whole room, always 16 x 10 so every spot lands on the floor; it fits
// inside its box (container units) and the wall, baseboard and floor run the
// full width of the box. A theme's background picture replaces the drawn room.
export function RoomArt({ background, entrance, className = '', children }: { background?: string; entrance?: string; className?: string; children?: ReactNode }) {
  const line = (pct: number) => `calc(50% + ${(pct - 50) / 100} * ${RH})`;
  return (
    <div className={`${/\b(absolute|fixed)\b/.test(className) ? '' : 'relative'} grid place-items-center overflow-hidden ${className}`} style={{ containerType: 'size', background: background ? P.butter : WALL }}>
      {!background && (
        <>
          <div className="absolute inset-x-0 bottom-0 overflow-hidden" style={{ top: line(WALL_BOTTOM) }}><Floor /></div>
          {/* the baseboard: a wooden band with a cap on top */}
          <div className="absolute inset-x-0" style={{ top: line(WALL_BOTTOM - 4.5), height: `calc(0.045 * ${RH})`, background: FUR.brown, borderTop: `0.22rem solid ${INK}`, borderBottom: `0.22rem solid ${INK}`, boxShadow: `inset 0 0.3rem 0 ${FUR.brownDeep}` }} />
        </>
      )}
      <div className="relative overflow-hidden" style={{ width: 'min(100cqw, 160cqh)', aspectRatio: '16 / 10', background: background ? `${P.butter} center / cover no-repeat url("${background}")` : undefined }}>
        {!background && <div className="absolute" style={{ left: '10%', top: '8%', width: '16%' }}><Window /></div>}
        {/* The entrance always shows, so invaders have somewhere to come from. */}
        <div className="absolute" style={{ left: '76.5%', top: '49%', width: '7%', aspectRatio: '100 / 90' }}>
          {entrance ? <img src={entrance} alt="" className="w-full h-full object-contain" draggable="false" /> : <HoleArt className="w-full h-full" />}
        </div>
        {children}
      </div>
    </div>
  );
}

// A team badge: the side's color AND its animal (never color alone).
export function SideBadge({ side, look = 0, size = '3rem' }: { side: 'defender' | 'invader'; look?: number; size?: string }) {
  return (
    <span className="relative inline-flex items-center justify-center rounded-full shrink-0" style={{ width: size, height: size, background: SIDE_PASTEL[side], border: `0.16rem solid ${INK}` }} aria-hidden="true">
      {side === 'defender' ? <CatArt look={look} className="w-[78%] h-[78%]" /> : <MouseArt look={look} className="w-[80%] h-[80%]" />}
    </span>
  );
}
