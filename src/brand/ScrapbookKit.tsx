import { createContext, useContext, useId, type CSSProperties, type ReactNode } from 'react';
import { PP } from './PaletteProposal';
import { PATTERNS } from './PatternProposal';
import { CrayonPowerUp, Doodle, Line, Shell, Shine, Wax, type DoodleKind, type PowerId } from './CrayonKit';

// The scrapbook kit, restored (MOCKUP ONLY, owner 2026-11-26: "there was a
// style for the public facing pages a while ago that was more colorful,
// scrapbook style and i want that to be the main art direction for public
// pages and the classic themes"). The pieces of the old PlayfulMock,
// HandmadeMock and the paper kit in buddies.tsx (removed in 453ef7e), redrawn
// with today's palette (PaletteProposal PP), today's patterns (PatternProposal)
// and today's crayon kit (smooth flat fills, one wobbly ink outline, no grain,
// no faces, no characters). Every drawing is original, made in code.
//
// One switch decides how strong it is, so she can pick (A, B or C):
//   A  Scrapbook, clean: papers, stickers, sunburst, one hand-lettered word,
//      all at the edges; no tape, nothing tilted.
//   B  Scrapbook, as mocked: A plus washi tape and small tilts (4 degrees at
//      most), edges only, never over words or buttons.
//   C  Full scrapbook: B plus tape and tilt on cards that hold words.
// The clean core (question card, answer tiles, score board, main button) is
// never taped or tilted, in any strength: nothing here wraps it.

export type Strength = 'A' | 'B' | 'C';
const Ctx = createContext<Strength>('A');
export const StrengthProvider = Ctx.Provider;
export const useStrength = () => useContext(Ctx);
const MAX_TILT = 4;
const clampTilt = (d: number) => Math.max(-MAX_TILT, Math.min(MAX_TILT, d));

const I = PP.ink;
export const SB = { ...PP, white: '#ffffff', wood: '#8a4f2a', gray: '#aaa6bb' };

// ---------------------------------------------------------------- papers
// Scrapbook papers like fabric swatches. Gingham, dots, stars, flowers and the
// painted blocks come straight from the universal pattern bank; the watercolor
// stripes, pinstripe, polka dot, plaid and checker of the old mockup are
// redrawn here in the palette pairs (opaque, no grain).
const enc = (w: number, h: number, body: string) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${body}</svg>`)}")`;
const tile = (w: number, h: number, bg: string, body: string): CSSProperties => ({ backgroundColor: bg, backgroundImage: enc(w, h, body), backgroundSize: `${w}px ${h}px` });
const bank = (id: string): CSSProperties => PATTERNS.find((p) => p.id === id)!.make(false);
const STRIPES = [PP.pink, PP.lemon, PP.kelly, PP.sky, PP.orange, PP.grape];
const wave = (y: number, c: string) => `<path d="M-4 ${y} q20 -4 44 0 t44 0 v9 q-20 4 -44 0 t-44 0 z" fill="${c}"/>`;

export type PaperId = 'gingham' | 'gingham-pink' | 'gingham-mint' | 'gingham-blue' | 'gingham-lavender' | 'stripes' | 'stars' | 'checker' | 'pinstripe' | 'polka' | 'plaid' | 'flowers' | 'dots' | 'blocks' | 'windowpane' | 'sprinkles' | 'cream' | 'paper';
const PAPER_CSS: Record<PaperId, () => CSSProperties> = {
  gingham: () => bank('gingham-butter'),
  'gingham-pink': () => bank('gingham-pink'),
  'gingham-mint': () => bank('gingham-mint'),
  'gingham-blue': () => bank('gingham-blue'),
  'gingham-lavender': () => bank('gingham-lavender'),
  stripes: () => tile(88, STRIPES.length * 24, PP.paper, STRIPES.map((c, i) => wave(i * 24 + 8, c)).join('')),
  stars: () => bank('stars'),
  checker: () => tile(40, 40, PP.paper, `<rect width="20" height="20" fill="${PP.pink}"/><rect x="20" y="20" width="20" height="20" fill="${PP.pink}"/>`),
  pinstripe: () => tile(18, 18, PP.grape, `<rect width="3" height="18" fill="${PP.paper}"/>`),
  polka: () => tile(34, 34, PP.paper, `<circle cx="8" cy="8" r="6" fill="${PP.pink}"/><circle cx="25" cy="25" r="6" fill="${PP.kelly}"/>`),
  plaid: () => tile(48, 48, PP.butter, `<rect x="6" width="12" height="48" fill="${PP.blush}"/><rect y="6" width="48" height="12" fill="${PP.blush}"/><rect x="6" y="6" width="12" height="12" fill="${PP.pink}"/><rect x="31" width="4" height="48" fill="${PP.kelly}"/><rect y="31" width="48" height="4" fill="${PP.sky}"/>`),
  flowers: () => bank('flowers'),
  dots: () => bank('dots'),
  blocks: () => bank('blocks'),
  windowpane: () => bank('windowpane'),
  sprinkles: () => bank('sprinkles'),
  cream: () => ({ background: PP.cream }),
  paper: () => ({ background: PP.paper }),
};
export const paperCss = (id: PaperId) => PAPER_CSS[id]();
export const PAPER_NAMES: [PaperId, string][] = [
  ['gingham', 'Gingham, Butter'], ['stripes', 'Watercolor stripes'], ['stars', 'Star print'], ['checker', 'Checker'],
  ['pinstripe', 'Pinstripe, Grape'], ['polka', 'Polka dot'], ['plaid', 'Plaid'], ['gingham-pink', 'Gingham, Blush'],
  ['flowers', 'Flower toss'], ['dots', 'Dot scatter'], ['gingham-mint', 'Gingham, Mint'], ['blocks', 'Painted blocks'],
];

// A cut-paper edge: a gently uneven outline (seeded, so it never jumps).
function rand(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const DECKLE: Record<number, string> = {};
function deckle(seed: number) {
  if (DECKLE[seed]) return DECKLE[seed];
  const r = rand(seed * 977 + 13), pts: string[] = [], n = 14, j = () => (r() * 0.9).toFixed(2);
  for (let k = 0; k <= n; k++) pts.push(`${((k / n) * 100).toFixed(1)}% ${j()}%`);
  for (let k = 1; k <= n; k++) pts.push(`${(100 - +j()).toFixed(2)}% ${((k / n) * 100).toFixed(1)}%`);
  for (let k = n - 1; k >= 0; k--) pts.push(`${((k / n) * 100).toFixed(1)}% ${(100 - +j()).toFixed(2)}%`);
  for (let k = n - 1; k >= 1; k--) pts.push(`${j()}% ${((k / n) * 100).toFixed(1)}%`);
  return (DECKLE[seed] = `polygon(${pts.join(', ')})`);
}

// ---------------------------------------------------------------- tape
// Washi tape (B and C only): opaque, a pastel with a bright stripe, zigzag
// torn ends. Never over words or buttons in B.
const ZIG = 'polygon(0% 0%, 100% 0%, 96% 17%, 100% 33%, 96% 50%, 100% 67%, 96% 83%, 100% 100%, 0% 100%, 4% 83%, 0% 67%, 4% 50%, 0% 33%, 4% 17%)';
const TAPES: [string, string][] = [[PP.blush, PP.pink], [PP.butter, PP.lemon], [PP.mint, PP.kelly], [PP.blueCrystal, PP.sky], [PP.lavender, PP.grape], [PP.peach, PP.orange]];
export function Tape({ tone = 0, w = 92, rot = -6, style, className = '' }: { tone?: number; w?: number; rot?: number; style?: CSSProperties; className?: string }) {
  const [a, b] = TAPES[tone % TAPES.length];
  return (
    <span aria-hidden="true" className={`absolute block pointer-events-none z-[3] ${className}`} style={{ width: w, height: Math.max(20, w * 0.28), transform: `rotate(${rot}deg)`, filter: 'drop-shadow(0 2px 0 rgba(29,26,51,0.14))', ...style }}>
      <span className="absolute inset-0" style={{ clipPath: ZIG, background: `repeating-linear-gradient(135deg, ${a} 0 9px, ${b} 9px 12px)` }} />
    </span>
  );
}

// ---------------------------------------------------------------- paper
// One sheet of scrapbook paper at the edges. Tilt and tape show from B on.
export function Paper({ id, style, className = '', tilt = 0, tape, seed = 1, children }: { id: PaperId; style?: CSSProperties; className?: string; tilt?: number; tape?: { tone?: number; at?: 'top' | 'tl' | 'tr' | 'bl' | 'br'; w?: number }; seed?: number; children?: ReactNode }) {
  const s = useStrength();
  const t = s === 'A' ? 0 : clampTilt(tilt);
  const at = tape?.at ?? 'top', tw = tape?.w ?? 84;
  const pos: CSSProperties = at === 'top' ? { left: '50%', top: -tw * 0.14, marginLeft: -tw / 2 } : at === 'tl' ? { left: -tw * 0.3, top: tw * 0.02 } : at === 'tr' ? { right: -tw * 0.3, top: tw * 0.02 } : at === 'bl' ? { left: -tw * 0.3, bottom: tw * 0.02 } : { right: -tw * 0.3, bottom: tw * 0.02 };
  const rot = at === 'top' ? -4 : at === 'tl' || at === 'br' ? -38 : 38;
  return (
    <div aria-hidden="true" className={`absolute ${className}`} style={{ filter: 'drop-shadow(0 4px 0 rgba(29,26,51,0.16))', transform: t ? `rotate(${t}deg)` : undefined, ...style }}>
      <div className="absolute inset-0" style={{ ...paperCss(id), clipPath: deckle(seed) }} />
      {children && <div className="relative w-full h-full">{children}</div>}
      {s !== 'A' && tape && <Tape tone={tape.tone} w={tw} rot={rot} style={pos} />}
    </div>
  );
}

// A sticker or any other edge piece: placed absolutely; tilts from B on.
export function Bit({ children, style, className = '', tilt = 0, tape }: { children: ReactNode; style?: CSSProperties; className?: string; tilt?: number; tape?: { tone?: number; w?: number } }) {
  const s = useStrength();
  const t = s === 'A' ? 0 : clampTilt(tilt);
  return (
    <span aria-hidden="true" className={`absolute block pointer-events-none ${className}`} style={{ transform: t ? `rotate(${t}deg)` : undefined, ...style }}>
      {children}
      {s !== 'A' && tape && <Tape tone={tape.tone} w={tape.w ?? 70} rot={-5} style={{ left: '50%', top: -10, marginLeft: -(tape.w ?? 70) / 2 }} />}
    </span>
  );
}

// A card that holds words. Plain and flat in A and B; in C it tilts a little
// and wears a strip of tape across its top edge (never over its words).
export function TextCard({ children, style, className = '', tilt = -1.2, tone = 1, as: Tag = 'div', tapeAt = 'top' }: { children: ReactNode; style?: CSSProperties; className?: string; tilt?: number; tone?: number; as?: 'div' | 'section' | 'article'; tapeAt?: 'top' | 'tr' }) {
  const c = useStrength() === 'C';
  return (
    <Tag className={`relative ${className}`} style={{ ...style, transform: c ? `rotate(${clampTilt(tilt)}deg)` : style?.transform }}>
      {children}
      {c && (tapeAt === 'tr' ? <Tape tone={tone} w={96} rot={36} style={{ right: -30, top: 4 }} /> : <Tape tone={tone} w={96} rot={tilt > 0 ? 4 : -4} style={{ left: '50%', top: -15, marginLeft: -48 }} />)}
    </Tag>
  );
}

// Little crayon stars and sparkles, placed by hand at the edges.
export function Sprinkle({ spots }: { spots: [number, number, number, string, DoodleKind?][] }) {
  return <>{spots.map(([x, y, s, c, k], i) => <Doodle key={i} kind={k ?? (i % 3 === 1 ? 'sparkle' : 'star')} color={c} size={s} className="absolute pointer-events-none" style={{ left: x, top: y, transform: `rotate(${(i * 29) % 40 - 20}deg)` }} />)}</>;
}

// ---------------------------------------------------------------- hand-lettering
// One hand-lettered word per screen, decorative (the screen reader gets the
// word once). Each letter a bright with a felt-tip ink edge, jiggled like
// handwriting, on a white wavy label.
const HAND = [PP.pink, PP.lemon, PP.sky, PP.kelly, PP.orange, PP.grape];
export function HandWord({ text, size = 56, label = true, style, className = '' }: { text: string; size?: number; label?: boolean; style?: CSSProperties; className?: string }) {
  let k = 0;
  return (
    <span role="img" aria-label={text} className={`relative inline-flex items-center ${className}`} style={{ fontSize: size, padding: label ? '0.18em 0.42em 0.26em' : 0, ...style }}>
      {label && (
        <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 200 80" preserveAspectRatio="none" aria-hidden="true">
          <path d={`M6 10 ${Array.from({ length: 12 }, (_, i) => `q8 ${i % 2 ? 5 : -5} 16 0`).join(' ')} V70 ${Array.from({ length: 12 }, (_, i) => `q-8 ${i % 2 ? -5 : 5} -16 0`).join(' ')} Z`}
            fill={SB.white} stroke={I} strokeWidth="3" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
      )}
      {text.split('').map((l, i) => l === ' '
        ? <span key={i} aria-hidden="true" style={{ width: '0.3em' }} />
        : <span key={i} aria-hidden="true" className="relative inline-block" style={{ fontFamily: 'var(--font-display)', lineHeight: 1, color: HAND[k++ % HAND.length], WebkitTextStroke: `${Math.max(2, size * 0.06)}px ${I}`, paintOrder: 'stroke fill', transform: `rotate(${[-6, 5, -3, 7, -5][i % 5]}deg) translateY(${[0, -0.05, 0.03, -0.03, 0.02][i % 5]}em)` }}>{l}</span>)}
    </span>
  );
}

// ---------------------------------------------------------------- sunburst
// The sunburst card: rays in the brights around a lemon sun (no face).
export function Sunburst({ size = 150 }: { size?: number }) {
  const f = 's' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const rays = [PP.pink, PP.orange, PP.lemon, PP.kelly, PP.sky, PP.grape];
  return (
    <span className="block relative" style={{ width: size, height: size, filter: 'drop-shadow(0 4px 0 rgba(29,26,51,0.16))' }}>
      <svg viewBox="0 0 160 160" width={size} height={size} aria-hidden="true">
        <defs>
          <filter id={f} filterUnits="userSpaceOnUse" x="-20" y="-20" width="200" height="200"><feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="5" result="w" /><feDisplacementMap in="SourceGraphic" in2="w" scale="3" xChannelSelector="R" yChannelSelector="G" /></filter>
          <clipPath id={`${f}c`}><rect width="160" height="160" rx="14" /></clipPath>
        </defs>
        <g clipPath={`url(#${f}c)`}>
          <rect width="160" height="160" fill={PP.butter} />
          <g filter={`url(#${f})`}>
            {Array.from({ length: 24 }, (_, i) => { const a = (i / 24) * Math.PI * 2; return <path key={i} d={`M${80 + 42 * Math.cos(a)} ${80 + 42 * Math.sin(a)} L${80 + 118 * Math.cos(a)} ${80 + 118 * Math.sin(a)}`} stroke={rays[i % rays.length]} strokeWidth="8" strokeLinecap="round" />; })}
            <circle cx="80" cy="80" r="32" fill={PP.lemon} stroke={I} strokeWidth="5" />
            <path d="M62 68 q6 -10 16 -12" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" fill="none" />
          </g>
        </g>
      </svg>
    </span>
  );
}

// ---------------------------------------------------------------- kind-word books
// A stack of books with kind words on their spines: the line after an answer.
const BOOKS: [string, string, number][] = [['You tried', PP.blueCrystal, 6], ['Kind', PP.pink, 0], ['Brave', PP.lime, 10], ['Curious', PP.peach, 3], ['Keep going', PP.blush, 8]];
export function BookStack({ width = 220 }: { width?: number }) {
  const s = useStrength();
  const h = Math.round(width * 0.16);
  return (
    <span role="img" aria-label="Kind words: you tried, kind, brave, curious, keep going" className="grid gap-[3px]" style={{ width }}>
      {BOOKS.map(([w, c, off], i) => (
        <span key={w} aria-hidden="true" className="relative flex items-center justify-center font-bold uppercase rounded-[6px]"
          style={{ height: h, fontSize: h * 0.42, letterSpacing: '0.06em', background: c, color: I, border: `2.5px solid ${I}`, marginLeft: off * (width / 220), marginRight: (12 - off) * (width / 220), boxShadow: `inset -${h * 0.4}px 0 0 ${PP.paper}, inset -${h * 0.4 + 2.5}px 0 0 ${I}`, transform: s === 'A' ? undefined : `rotate(${[-1.5, 1, -0.6, 1.4, -1][i]}deg)` }}>
          <span style={{ paddingRight: h * 0.4 }}>{w}</span>
        </span>
      ))}
    </span>
  );
}

// ---------------------------------------------------------------- school stickers
// School things with a white die-cut paper edge, drawn in the crayon kit's
// smooth style (flat fills, one wobbly ink outline, one white shine).
export type SchoolKind = 'bus' | 'apple' | 'pencil' | 'notebook' | 'crayon' | 'ruler';
const SCHOOL: Record<SchoolKind, () => ReactNode> = {
  bus: () => (<>
    <Wax d="M8 34 Q8 26 16 26 H76 Q84 26 88 34 L94 50 V70 Q94 76 88 76 H14 Q8 76 8 70 Z" color={PP.lemon} />
    {[18, 36, 54].map((x) => <Wax key={x} d={`M${x} 34 H${x + 13} V48 H${x} Z`} color={PP.blueCrystal} width={3} />)}
    <Wax d="M72 34 H82 L88 48 H72 Z" color={PP.blueCrystal} width={3} />
    <Wax d="M8 58 H94 V63 H8 Z" color={PP.orange} width={3} />
    <Wax d="M16 76 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0 Z" color={I} width={3} /><Wax d="M66 76 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0 Z" color={I} width={3} />
    <Shine d="M16 31 H30" />
  </>),
  apple: () => (<>
    <Wax d="M50 30 C34 18 12 26 14 52 C16 78 34 94 50 86 C66 94 84 78 86 52 C88 26 66 18 50 30 Z" color={PP.kelly} />
    <Line d="M49 30 C49 22 52 15 57 11" color={SB.wood} w={4} ink />
    <Wax d="M55 22 C63 10 78 13 78 13 C75 24 63 27 55 22 Z" color={PP.lime} width={3.6} />
    <Shine d="M26 44 C28 38 32 34 37 33" />
  </>),
  pencil: () => (<g transform="rotate(-35 50 50)">
    <Wax d="M18 40 H74 V60 H18 Z" color={PP.lemon} />
    <Wax d="M8 40 Q4 40 4 44 V56 Q4 60 8 60 H18 V40 Z" color={PP.blush} width={3.6} />
    <Wax d="M18 40 H25 V60 H18 Z" color={SB.gray} width={3} />
    <Wax d="M74 40 L94 50 L74 60 Z" color={PP.peach} width={3.6} />
    <Wax d="M88 47 L94 50 L88 53 Z" color={I} width={2} />
    <Shine d="M30 45 H62" />
  </g>),
  notebook: () => (<>
    <Wax d="M22 12 H82 Q88 12 88 18 V84 Q88 90 82 90 H22 Z" color={PP.sky} />
    <Wax d="M36 28 H76 V42 H36 Z" color={PP.paper} width={3} />
    {[22, 36, 50, 64, 78].map((y) => <Wax key={y} d={`M16 ${y} a5 5 0 1 0 12 0 a5 5 0 1 0 -12 0 Z`} color={PP.paper} width={2.6} />)}
    <Shine d="M40 52 H60" />
  </>),
  crayon: () => (<g transform="rotate(30 50 50)">
    <Wax d="M10 40 H72 V60 H10 Z" color={PP.pink} />
    <Wax d="M72 40 Q84 42 92 50 Q84 58 72 60 Z" color={PP.pink} width={3.6} />
    <Wax d="M22 40 H30 V60 H22 Z M56 40 H64 V60 H56 Z" color={PP.blush} width={3} />
    <Shine d="M34 45 H50" />
  </g>),
  ruler: () => (<g transform="rotate(-20 50 50)">
    <Wax d="M6 38 H94 V62 H6 Z" color={PP.orange} />
    {Array.from({ length: 9 }, (_, i) => <path key={i} d={`M${14 + i * 9} 38 V${i % 2 ? 46 : 51}`} stroke={I} strokeWidth="2.6" strokeLinecap="round" />)}
    <Shine d="M14 56 H40" />
  </g>),
};
const SCHOOL_SEED: Record<SchoolKind, number> = { bus: 81, apple: 83, pencil: 89, notebook: 97, crayon: 101, ruler: 103 };
export function SchoolSticker({ kind, size = 76 }: { kind: SchoolKind; size?: number }) {
  return <Shell size={size} seed={SCHOOL_SEED[kind]} sticker>{SCHOOL[kind]()}</Shell>;
}
// A crayon power-up sticker (no characters: the shared power-ups carry the art).
export function PowerSticker({ id, size = 84 }: { id: PowerId; size?: number }) {
  return <CrayonPowerUp id={id} size={size} sticker />;
}
// A photo corner (scrapbook mounting, no tape): a little paper triangle.
export function PhotoCorner({ at, size = 34, color = PP.grape }: { at: 'tl' | 'tr' | 'bl' | 'br'; size?: number; color?: string }) {
  const rot = { tl: 0, tr: 90, br: 180, bl: 270 }[at];
  const pos: CSSProperties = { [at[0] === 't' ? 'top' : 'bottom']: -4, [at[1] === 'l' ? 'left' : 'right']: -4 };
  return <svg aria-hidden="true" viewBox="0 0 40 40" width={size} height={size} className="absolute z-[4] pointer-events-none" style={{ ...pos, transform: `rotate(${rot}deg)`, filter: 'drop-shadow(0 2px 0 rgba(29,26,51,0.18))' }}><path d="M2 2 H38 L2 38 Z" fill={color} stroke={I} strokeWidth="2.5" strokeLinejoin="round" /></svg>;
}
