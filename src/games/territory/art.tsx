import { useId, type CSSProperties, type ReactNode } from 'react';

// Territory's Classic art (teacher, 2026-11-24): a 2D living room in the
// Classic style, drawn in code (no files, no licenses): smooth flat fills, one
// slightly wobbly dark ink outline, palette pairs (src/brand/PaletteProposal).
// The animals are the game pieces, so they have simple faces (dot eyes, a
// tiny nose); never an expression of pain. The cat and mouse colors she asked
// for (brown, gray and white mice; gray and siamese cats) need a few natural
// fur colors beside the palette: FUR below.

export const INK = '#1d1a33';
const P = {
  paper: '#fffaf0', cream: '#f6f0e4', butter: '#fff1b8', lemon: '#fabe37', peach: '#ffd9b3', orange: '#ff9b28',
  pink: '#f055a5', blush: '#ffd3e6', teal: '#1fb5a8', aqua: '#c9f1ee', kelly: '#22b04a', mint: '#c8f0dc',
  sky: '#4ba3e8', crystal: '#bfdff3', purple: '#7a88fe', gamify: '#b4c4fb', grape: '#6a45f0', lavender: '#ddd6ff',
};
// Natural fur (her request: brown, gray and white mice; gray, black, siamese cats).
const FUR = { brown: '#b47a4e', brownDeep: '#7a4a2c', gray: '#a9a4ba', grayDeep: '#6e6884', black: '#34304a', point: '#6b4a3a' };

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

// ---- Cats (defenders): six original looks ---------------------------------
// Three defenders and three invaders, each drawn on a square 1:1 piece
// (teacher, 2026-11-24).
export const CAT_LOOKS = ['Orange tabby', 'Black cat', 'Gray cat'] as const;
const CAT = [
  { body: P.orange, ear: P.peach, eye: INK },
  { body: FUR.black, ear: P.blush, eye: P.lemon },
  { body: FUR.gray, ear: P.blush, eye: INK },
];
// A sitting cat seen from the front, 100 x 100, feet on y = 96.
export function CatArt({ look = 0, className, style, label }: { look?: number; className?: string; style?: CSSProperties; label?: string }) {
  const c = CAT[look % CAT.length];
  const k = look % CAT.length;
  const line = k === 1 ? '#110f1f' : INK;
  return (
    <Svg box="0 0 100 100" className={className} style={style} label={label}>
      {/* tail */}
      <path d="M70 88 C90 86 94 70 86 58 C83 54 79 56 81 60 C86 68 84 79 68 80" fill={k === 5 ? FUR.point : c.body} strokeWidth="3.6" stroke={line} />
      {/* body */}
      <path d="M30 96 C24 80 28 60 50 58 C72 60 76 80 70 96 Z" fill={c.body} strokeWidth="4" stroke={line} />
      {k === 3 && <path d="M33 92 C30 80 36 70 46 72 C46 82 42 90 33 92 Z" fill={P.orange} strokeWidth="0" />}
      {k === 3 && <path d="M58 66 C68 66 72 76 69 84 C62 82 56 74 58 66 Z" fill={FUR.black} strokeWidth="0" />}
      {k === 4 && <><circle cx="40" cy="80" r="5" fill={FUR.gray} strokeWidth="0" /><circle cx="60" cy="72" r="4" fill={FUR.gray} strokeWidth="0" /><circle cx="56" cy="88" r="3" fill={FUR.gray} strokeWidth="0" /></>}
      {k === 0 && <path d="M38 70 L44 72 M36 80 L44 81 M62 70 L56 72 M64 80 L56 81" fill="none" strokeWidth="2.4" stroke="#c4600a" />}
      {/* chest and paws */}
      <path d="M42 96 C42 86 45 80 50 80 C55 80 58 86 58 96" fill={k === 1 ? '#4a4566' : P.paper} strokeWidth="2.6" stroke={line} />
      <path d="M36 96 C36 91 44 91 44 96 M56 96 C56 91 64 91 64 96" fill={k === 5 ? FUR.point : c.body} strokeWidth="3" stroke={line} />
      {/* ears */}
      <path d="M27 34 L24 10 L44 24 Z" fill={c.body} strokeWidth="4" stroke={line} />
      <path d="M73 34 L76 10 L56 24 Z" fill={c.body} strokeWidth="4" stroke={line} />
      <path d="M29 28 L28 17 L37 24 Z M71 28 L72 17 L63 24 Z" fill={c.ear} strokeWidth="0" />
      {/* head */}
      <path d="M50 18 C72 18 80 32 78 44 C76 58 64 64 50 64 C36 64 24 58 22 44 C20 32 28 18 50 18 Z" fill={c.body} strokeWidth="4" stroke={line} />
      {k === 3 && <path d="M50 19 C64 19 74 26 77 36 C66 36 56 30 50 19 Z" fill={P.orange} strokeWidth="0" />}
      {k === 3 && <path d="M24 40 C26 28 34 22 40 21 C40 30 34 38 24 40 Z" fill={FUR.black} strokeWidth="0" />}
      {k === 4 && <circle cx="64" cy="32" r="6" fill={FUR.gray} strokeWidth="0" />}
      {k === 5 && <path d="M38 44 C38 36 62 36 62 44 C62 56 56 60 50 60 C44 60 38 56 38 44 Z" fill={FUR.point} strokeWidth="0" />}
      {k === 0 && <path d="M44 22 L46 30 M50 20 L50 29 M56 22 L54 30" fill="none" strokeWidth="2.4" stroke="#c4600a" />}
      {/* face: dot eyes, small nose, a little smile, whiskers */}
      <circle cx="40" cy="42" r="3.6" fill={c.eye} strokeWidth={c.eye === INK ? 0 : 1.6} stroke={line} />
      <circle cx="60" cy="42" r="3.6" fill={c.eye} strokeWidth={c.eye === INK ? 0 : 1.6} stroke={line} />
      {c.eye !== INK && <><circle cx="40" cy="42" r="1.4" fill={INK} strokeWidth="0" /><circle cx="60" cy="42" r="1.4" fill={INK} strokeWidth="0" /></>}
      <path d="M47 49 L53 49 L50 52 Z" fill={P.pink} strokeWidth="1.6" stroke={line} />
      <path d="M50 52 C49 55 46 56 44 55 M50 52 C51 55 54 56 56 55" fill="none" strokeWidth="2" stroke={k === 1 ? P.paper : line} />
      <path d="M33 50 L22 48 M33 53 L23 55 M67 50 L78 48 M67 53 L77 55" fill="none" strokeWidth="1.6" stroke={k === 1 ? P.paper : line} />
      {/* one cream shine, top left */}
      <path d="M32 30 C34 26 38 24 41 24" fill="none" strokeWidth="2.6" stroke={P.paper} opacity={k === 3 || k === 4 ? 0 : 0.9} />
    </Svg>
  );
}

// ---- Mice (invaders): brown, gray and white -------------------------------
export const MOUSE_LOOKS = ['Brown mouse', 'Gray mouse', 'White mouse'] as const;
const MOUSE = [FUR.brown, FUR.gray, P.paper];
// A little mouse in side view, facing left, on a square 100 x 100 piece, feet near the bottom.
export function MouseArt({ look = 0, className, style, label }: { look?: number; className?: string; style?: CSSProperties; label?: string }) {
  const body = MOUSE[look % MOUSE.length];
  return (
    <Svg box="-2 -28 104 104" className={className} style={style} label={label}>
      <path d="M72 52 C86 54 92 44 96 34" fill="none" strokeWidth="3.4" stroke={P.pink} />
      <path d="M72 52 C86 54 92 44 96 34" fill="none" strokeWidth="1" stroke={INK} opacity="0.5" />
      <path d="M14 50 C14 34 30 24 50 24 C68 24 80 36 78 50 C77 60 68 64 50 64 L24 64 C17 64 14 58 14 50 Z" fill={body} strokeWidth="3.8" />
      <path d="M8 48 C10 40 18 34 26 34" fill="none" strokeWidth="0" />
      {/* head and nose */}
      <path d="M4 50 C6 42 16 36 26 38 L30 56 C20 58 8 56 4 50 Z" fill={body} strokeWidth="3.4" />
      <circle cx="4.5" cy="49.5" r="3" fill={P.pink} strokeWidth="1.6" />
      {/* big round ear */}
      <circle cx="30" cy="26" r="12" fill={body} strokeWidth="3.6" />
      <circle cx="30" cy="26" r="6.5" fill={P.blush} strokeWidth="0" />
      <circle cx="16" cy="45" r="2.6" fill={INK} strokeWidth="0" />
      <path d="M8 52 L-2 50 M8 54 L-1 57" fill="none" strokeWidth="1.4" />
      {/* feet */}
      <path d="M30 64 L28 68 M60 64 L62 68" fill="none" strokeWidth="3" />
      <path d="M42 32 C48 29 56 29 60 31" fill="none" strokeWidth="2.4" stroke={P.paper} opacity={look === 2 ? 0 : 0.85} />
    </Svg>
  );
}

// ---- The mouse hole (entrance): a small arch in the baseboard --------------
export function HoleArt({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <Svg box="0 0 100 90" className={className} style={style}>
      <path d="M8 88 L8 46 C8 18 28 4 50 4 C72 4 92 18 92 46 L92 88 Z" fill={FUR.brownDeep} strokeWidth="5" />
      <path d="M20 88 L20 48 C20 26 34 16 50 16 C66 16 80 26 80 48 L80 88 Z" fill="#241f38" strokeWidth="3.4" />
      <path d="M26 44 C28 32 36 24 44 22" fill="none" strokeWidth="3" stroke={FUR.brown} />
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

// ---- The living room ------------------------------------------------------
// Wallpaper: butter with peach stripes and little lemon four-point flowers.
const WALLPAPER = `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><rect width='120' height='120' fill='${P.butter}'/><rect x='0' width='22' height='120' fill='${P.peach}'/><rect x='60' width='22' height='120' fill='${P.peach}'/><g fill='${P.lemon}' stroke='${INK}' stroke-width='2' stroke-linejoin='round'><path d='M41 14 C42 20 44 22 50 23 C44 24 42 26 41 32 C40 26 38 24 32 23 C38 22 40 20 41 14 Z'/><path d='M101 74 C102 80 104 82 110 83 C104 84 102 86 101 92 C100 86 98 84 92 83 C98 82 100 80 101 74 Z'/></g><circle cx='41' cy='84' r='3' fill='${P.pink}'/><circle cx='101' cy='24' r='3' fill='${P.pink}'/></svg>`)}")`;
// Floor: peach planks with soft orange seams.
const FLOOR = `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='240' height='60'><rect width='240' height='60' fill='#f7c58f'/><path d='M0 30 H240 M0 59 H240' stroke='#d9935a' stroke-width='3'/><path d='M70 0 V30 M190 0 V30 M20 30 V60 M140 30 V60' stroke='#d9935a' stroke-width='3'/></svg>`)}")`;

export const WALL_BOTTOM = 59; // % from the top where the floor starts
// The room's own width and height inside its box (16 x 10, fitted).
const RW = 'min(100cqw, 160cqh)';
const RH = 'min(100cqh, 62.5cqw)';

function Window() {
  return (
    <Svg box="0 0 200 180">
      <rect x="10" y="10" width="180" height="150" rx="10" fill={P.paper} strokeWidth="6" />
      <rect x="26" y="26" width="148" height="118" rx="4" fill={P.crystal} strokeWidth="4" />
      <circle cx="140" cy="60" r="18" fill={P.lemon} strokeWidth="4" />
      <path d="M40 112 C52 96 70 96 80 108 C92 94 112 96 118 112 Z" fill={P.paper} strokeWidth="3.4" />
      <path d="M100 26 V144 M26 85 H174" fill="none" strokeWidth="4" />
      <path d="M2 164 H198" fill="none" strokeWidth="8" />
      {/* curtains */}
      <path d="M0 4 C14 40 4 120 16 172 L-12 172 L-12 4 Z" fill={P.pink} strokeWidth="5" />
      <path d="M200 4 C186 40 196 120 184 172 L212 172 L212 4 Z" fill={P.pink} strokeWidth="5" />
    </Svg>
  );
}
function Couch() {
  return (
    <Svg box="0 0 300 150">
      <path d="M26 40 C26 18 40 12 60 12 L240 12 C260 12 274 18 274 40 L274 96 L26 96 Z" fill={P.teal} strokeWidth="6" />
      <path d="M40 70 C40 58 50 54 64 54 L236 54 C250 54 260 58 260 70 L260 112 L40 112 Z" fill={P.aqua} strokeWidth="5" />
      <path d="M150 56 V110" fill="none" strokeWidth="4" />
      <path d="M8 66 C8 52 18 48 30 48 C42 48 50 54 50 66 L50 128 L8 128 Z" fill={P.teal} strokeWidth="6" />
      <path d="M292 66 C292 52 282 48 270 48 C258 48 250 54 250 66 L250 128 L292 128 Z" fill={P.teal} strokeWidth="6" />
      <path d="M50 112 H250 V128 H50 Z" fill={P.teal} strokeWidth="5" />
      <path d="M24 128 L20 146 M276 128 L280 146" fill="none" strokeWidth="7" />
      <path d="M64 30 C82 26 104 26 118 30" fill="none" strokeWidth="4" stroke={P.aqua} />
      {/* a cushion */}
      <path d="M70 58 C66 40 76 30 96 34 C116 36 122 46 118 60 C104 64 84 64 70 58 Z" fill={P.lemon} strokeWidth="4" />
    </Svg>
  );
}
function Lamp() {
  return (
    <Svg box="0 0 80 240">
      <path d="M14 70 L26 12 L54 12 L66 70 Z" fill={P.lemon} strokeWidth="5" />
      <path d="M40 70 V222" fill="none" strokeWidth="6" />
      <path d="M18 230 C18 218 62 218 62 230 Z" fill={P.grape} strokeWidth="5" />
      <path d="M30 24 L26 50" fill="none" strokeWidth="3.4" stroke={P.paper} />
    </Svg>
  );
}
function Plant() {
  return (
    <Svg box="0 0 120 200">
      <path d="M60 130 C40 100 18 96 8 70 C30 72 50 90 60 120 Z" fill={P.kelly} strokeWidth="4" />
      <path d="M60 126 C66 90 60 50 72 20 C88 52 78 96 62 126 Z" fill={P.kelly} strokeWidth="4" />
      <path d="M62 128 C80 104 100 100 114 80 C100 112 84 124 64 132 Z" fill={P.kelly} strokeWidth="4" />
      <path d="M60 120 C58 100 50 90 40 84" fill="none" strokeWidth="2.6" />
      <path d="M28 130 L92 130 L84 194 L36 194 Z" fill={P.orange} strokeWidth="5" />
      <path d="M24 122 H96 V138 H24 Z" fill={P.orange} strokeWidth="5" />
    </Svg>
  );
}
function Frame() {
  return (
    <Svg box="0 0 140 110">
      <rect x="6" y="6" width="128" height="98" rx="8" fill={P.grape} strokeWidth="5" />
      <rect x="20" y="20" width="100" height="70" rx="4" fill={P.mint} strokeWidth="3.4" />
      <path d="M20 80 C40 56 56 56 70 70 C84 50 104 52 120 72 L120 90 L20 90 Z" fill={P.kelly} strokeWidth="3" />
      <circle cx="98" cy="38" r="9" fill={P.lemon} strokeWidth="3" />
    </Svg>
  );
}
function Rug() {
  return (
    <Svg box="0 0 400 120">
      <ellipse cx="200" cy="60" rx="194" ry="54" fill={P.pink} strokeWidth="6" />
      <ellipse cx="200" cy="60" rx="150" ry="38" fill={P.blush} strokeWidth="4" />
      <ellipse cx="200" cy="60" rx="96" ry="22" fill={P.pink} strokeWidth="3.4" />
    </Svg>
  );
}

// The whole room, always 16 x 10 so every spot lands on the floor; it fits
// inside its box (container units) and the box around it wears the floor.
// A theme's background picture replaces the drawn room.
export function RoomArt({ background, entrance, className = '', children }: { background?: string; entrance?: string; className?: string; children?: ReactNode }) {
  const at = (l: number, t: number, w: number): CSSProperties => ({ position: 'absolute', left: `${l}%`, top: `${t}%`, width: `${w}%` });
  return (
    <div className={`${/\b(absolute|fixed)\b/.test(className) ? '' : 'relative'} grid place-items-center overflow-hidden ${className}`} style={{ containerType: 'size', background: '#f7c58f' }}>
      {/* The wall, baseboard and floor run the full width, so past the
          room's edges there is no dead space. */}
      {!background && (
        <>
          <div className="absolute inset-x-0 top-0" style={{ height: `calc(50% + ${(WALL_BOTTOM - 50) / 100} * ${RH})`, backgroundImage: WALLPAPER, backgroundSize: `calc(0.075 * ${RW}) auto`, backgroundPosition: 'center top' }} />
          <div className="absolute inset-x-0 bottom-0" style={{ top: `calc(50% + ${(WALL_BOTTOM - 50) / 100} * ${RH})`, backgroundImage: FLOOR, backgroundSize: `calc(0.15 * ${RW}) auto`, backgroundPosition: 'center top', borderTop: `0.3rem solid ${INK}` }} />
          <div className="absolute inset-x-0" style={{ top: `calc(50% + ${(WALL_BOTTOM - 55) / 100} * ${RH})`, height: `calc(0.05 * ${RH})`, background: P.paper, borderTop: `0.25rem solid ${INK}` }} />
        </>
      )}
      <div className="relative overflow-hidden" style={{ width: 'min(100cqw, 160cqh)', aspectRatio: '16 / 10', background: background ? `#f7c58f center / cover no-repeat url("${background}")` : undefined }}>
        {!background && (
          <>
            <div style={at(7, 6, 19)}><Window /></div>
            <div style={at(37, 12, 11)}><Frame /></div>
            <div style={at(22, 36, 30)}><Couch /></div>
            <div style={at(55, 35, 5)}><Lamp /></div>
            <div style={at(89, 35.5, 9)}><Plant /></div>
            <div style={at(20, 66, 58)}><Rug /></div>
          </>
        )}
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
