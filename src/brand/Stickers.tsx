import { useId, useState, type ReactNode } from 'react';
import { Lock, MonitorPlay, Snowflake } from '@phosphor-icons/react';
import { PP } from './PaletteProposal';

// Sticker collections (PROPOSAL, teacher 2026-11-23): Classic die-cut stickers
// that decorate the site and fill a collect-em-all Achievement page.
// Redo (teacher, 2026-11-23): "original stickers should have a variety of fun
// unique shape edges and one sticker image with the label for each ... in
// circle with a white sticker edge border around each. match the classic
// color pallete". Each sticker: one solid palette bright (PP), a fun edge
// (circle, scallop, flower, burst, cloud, square, shield, stamp, heart,
// hexagon, sun, blob), a thick white die-cut border with a soft shadow, ONE
// big image (classic-art: flat fill, wobbly ink line), and the earn rule as a
// short label curving along the top arc in Grow Year. Her reference star had a
// face; brand art has none, so faces stay an open question. Drawn in code
// (original, nothing to license). Preview on /brand only.

type Img = { id: string; caption: string; earn: string; art: () => ReactNode; ground: string };

const INK = PP.ink;
const SW = 4.5;
const P = ({ d, fill, w = SW }: { d: string; fill: string; w?: number }) => (
  <path d={d} fill={fill} stroke={INK} strokeWidth={w} strokeLinejoin="round" strokeLinecap="round" />
);
const L = ({ d, color = INK, w = SW }: { d: string; color?: string; w?: number }) => (
  <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
);
const C = ({ cx, cy, r, fill }: { cx: number; cy: number; r: number; fill: string }) => (
  <circle cx={cx} cy={cy} r={r} fill={fill} stroke={INK} strokeWidth={SW} />
);
const Shine = ({ d }: { d: string }) => <L d={d} color="#ffffff" w={5} />;
function star(cx: number, cy: number, o: number, i: number) {
  let d = '';
  for (let k = 0; k < 10; k++) {
    const r = k % 2 ? i : o; const a = ((-90 + k * 36) * Math.PI) / 180;
    d += `${k ? 'L' : 'M'}${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)} `;
  }
  return d + 'Z';
}
const band = (cx: number, cy: number, r1: number, r2: number) =>
  `M${cx - r2} ${cy} A${r2} ${r2} 0 0 1 ${cx + r2} ${cy} L${cx + r1} ${cy} A${r1} ${r1} 0 0 0 ${cx - r1} ${cy} Z`;

// The drawings (one big simple image per sticker), on a 100 x 100 grid.
const IMAGES: Img[] = [
  { id: 'star', caption: 'Good job!', earn: 'Played your first game', ground: PP.butter, art: () => <><P d={star(50, 54, 44, 21)} fill={PP.lemon} /><Shine d="M34 40 L40 33" /></> },
  { id: 'heart', caption: 'Love it!', earn: 'Played one game 5 times', ground: PP.blush, art: () => <><P d="M50 88 C26 72 8 56 8 36 C8 22 18 12 31 12 C40 12 46 18 50 26 C54 18 60 12 69 12 C82 12 92 22 92 36 C92 56 74 72 50 88 Z" fill={PP.pink} /><Shine d="M22 32 C23 26 27 22 32 21" /></> },
  { id: 'sun', caption: 'Bright day!', earn: 'Played on 5 days this month', ground: PP.peach, art: () => <>{[0, 45, 90, 135, 180, 225, 270, 315].map((a) => { const r = (a * Math.PI) / 180; return <g key={a}><L d={`M${50 + 31 * Math.cos(r)} ${52 + 31 * Math.sin(r)} L${50 + 43 * Math.cos(r)} ${52 + 43 * Math.sin(r)}`} w={13} /><L d={`M${50 + 31 * Math.cos(r)} ${52 + 31 * Math.sin(r)} L${50 + 43 * Math.cos(r)} ${52 + 43 * Math.sin(r)}`} color={PP.orange} w={5} /></g>; })}<C cx={50} cy={52} r={24} fill={PP.lemon} /><Shine d="M38 44 C40 39 44 36 48 35" /></> },
  { id: 'rainbow', caption: 'Explorer!', earn: 'Tried 5 new themes', ground: PP.aqua, art: () => <><P d={band(50, 70, 34, 44)} fill={PP.pink} /><P d={band(50, 70, 24, 34)} fill={PP.lemon} /><P d={band(50, 70, 14, 24)} fill={PP.sky} /><C cx={14} cy={72} r={9} fill={PP.paper} /><C cx={24} cy={74} r={8} fill={PP.paper} /><C cx={86} cy={72} r={9} fill={PP.paper} /><C cx={76} cy={74} r={8} fill={PP.paper} /></> },
  { id: 'flower', caption: 'Growing!', earn: 'Added 10 students', ground: PP.mint, art: () => <><L d="M50 60 C50 72 48 82 50 94" w={12} /><L d="M50 60 C50 72 48 82 50 94" color={PP.kelly} w={5} /><P d="M50 82 C58 72 70 72 74 76 C68 84 58 86 50 82 Z" fill={PP.kelly} />{[0, 72, 144, 216, 288].map((a) => { const r = ((a - 90) * Math.PI) / 180; return <C key={a} cx={50 + 20 * Math.cos(r)} cy={40 + 20 * Math.sin(r)} r={14} fill={PP.pink} />; })}<C cx={50} cy={40} r={11} fill={PP.lemon} /></> },
  { id: 'apple', caption: 'Great start!', earn: 'Made your first question set', ground: PP.sage, art: () => <><P d="M50 28 C40 20 14 20 14 50 C14 74 32 92 44 90 C47 89 49 87 50 87 C51 87 53 89 56 90 C68 92 86 74 86 50 C86 20 60 20 50 28 Z" fill={PP.kelly} /><L d="M50 28 C50 20 52 14 56 10" /><P d="M55 18 C62 8 76 8 80 12 C74 22 62 24 55 18 Z" fill={PP.lime} /><Shine d="M26 44 C27 38 31 33 36 32" /></> },
  { id: 'melon', caption: 'So sweet!', earn: 'Sent your first homework link', ground: PP.blush, art: () => <><P d="M8 38 A42 42 0 0 0 92 38 Z" fill={PP.kelly} /><P d="M16 38 A34 34 0 0 0 84 38 Z" fill={PP.pink} />{[[34, 50], [50, 58], [66, 50], [42, 64], [58, 64]].map(([x, y]) => <ellipse key={x + '-' + y} cx={x} cy={y} rx={2.6} ry={4} fill={INK} />)}</> },
  { id: 'balloon', caption: 'Hooray!', earn: 'Ran your first Live game', ground: PP.blueCrystal, art: () => <><L d="M50 72 C44 80 56 86 48 96" w={3} /><P d="M50 6 C70 6 82 22 82 40 C82 58 66 70 50 70 C34 70 18 58 18 40 C18 22 30 6 50 6 Z" fill={PP.sky} /><P d="M44 76 L50 69 L56 76 Z" fill={PP.sky} w={3.5} /><Shine d="M30 34 C31 26 36 20 42 18" /></> },
  { id: 'bulb', caption: 'Brilliant!', earn: 'Tried every game', ground: PP.butter, art: () => <><L d="M14 30 L22 34 M86 30 L78 34 M50 2 L50 10 M24 10 L30 17 M76 10 L70 17" color={PP.orange} w={5} /><P d="M50 14 C68 14 80 28 80 44 C80 56 72 62 66 70 L34 70 C28 62 20 56 20 44 C20 28 32 14 50 14 Z" fill={PP.lemon} /><P d="M34 70 H66 V86 C66 90 62 94 58 94 H42 C38 94 34 90 34 86 Z" fill={PP.lavender} /><L d="M36 78 H64 M36 86 H64" w={3} /><Shine d="M32 40 C33 32 38 26 44 24" /></> },
  { id: 'rocket', caption: 'Blast off!', earn: 'Played 100 rounds', ground: PP.lavender, art: () => <><P d="M40 76 C38 86 44 94 50 98 C56 94 62 86 60 76 Z" fill={PP.orange} /><P d="M34 56 L16 74 L20 82 L36 74 Z" fill={PP.pink} /><P d="M66 56 L84 74 L80 82 L64 74 Z" fill={PP.pink} /><P d="M50 4 C64 14 70 32 68 52 L66 76 H34 L32 52 C30 32 36 14 50 4 Z" fill={PP.paper} /><P d="M50 4 C58 10 62 16 64 22 H36 C38 16 42 10 50 4 Z" fill={PP.pink} /><C cx={50} cy={44} r={10} fill={PP.sky} /></> },
  { id: 'moon', caption: 'So calm!', earn: 'Used Calm mode in a game', ground: PP.lavender, art: () => <><P d="M60 8 C38 12 22 30 22 52 C22 76 42 94 66 92 C78 91 86 86 90 80 C66 84 46 68 46 44 C46 28 52 16 60 8 Z" fill={PP.lemon} /><P d={star(74, 32, 11, 5)} fill={PP.paper} w={3.5} /><P d={star(84, 58, 7, 3)} fill={PP.paper} w={3} /></> },
  { id: 'crayon', caption: 'Creative!', earn: 'Made your own theme', ground: PP.gamify, art: () => <g transform="rotate(-35 50 50)"><P d="M26 36 H70 L92 50 L70 64 H26 C20 64 16 60 16 56 V44 C16 40 20 36 26 36 Z" fill={PP.periwinkle} /><P d="M70 36 L92 50 L70 64 Z" fill={PP.paper} /><P d="M84 45 L92 50 L84 55 Z" fill={PP.periwinkle} w={3} /><L d="M32 36 V64 M60 36 V64" w={3.5} /><L d="M38 46 C42 42 46 54 52 48" color="#ffffff" w={4} /></g> },
];

const IMG = Object.fromEntries(IMAGES.map((i) => [i.id, i.art])) as Record<string, () => ReactNode>;

// ---------- Sticker edges (teacher, 2026-11-23: "a variety of fun unique shape edges") ----------
// All centered on (60, 60) in a 120 grid; every edge keeps at least a 45-unit
// clear radius so the label on the top arc never leaves the color.
const R = (a: number) => (a * Math.PI) / 180;
function polar(fn: (t: number) => number, n = 180) {
  let d = '';
  for (let k = 0; k < n; k++) { const t = (k / n) * 2 * Math.PI; const r = fn(t); d += `${k ? 'L' : 'M'}${(60 + r * Math.cos(t)).toFixed(1)} ${(60 + r * Math.sin(t)).toFixed(1)} `; }
  return d + 'Z';
}
function points(n: number, outer: number, inner: number, rot = -90) {
  let d = '';
  for (let k = 0; k < n * 2; k++) { const r = k % 2 ? inner : outer; const a = R(rot + (k * 180) / n); d += `${k ? 'L' : 'M'}${(60 + r * Math.cos(a)).toFixed(1)} ${(60 + r * Math.sin(a)).toFixed(1)} `; }
  return d + 'Z';
}
function stamp() {
  const side = 100, x0 = 10, per = side * 4, n = 400, teeth = 44; let d = '';
  for (let k = 0; k < n; k++) {
    const u = (k / n) * per; const e = Math.floor(u / side); const f = u - e * side;
    const [x, y, nx, ny] = e === 0 ? [x0 + f, x0, 0, -1] : e === 1 ? [x0 + side, x0 + f, 1, 0] : e === 2 ? [x0 + side - f, x0 + side, 0, 1] : [x0, x0 + side - f, -1, 0];
    const o = 3.2 * Math.cos((u / per) * teeth * 2 * Math.PI);
    d += `${k ? 'L' : 'M'}${(x + nx * o).toFixed(1)} ${(y + ny * o).toFixed(1)} `;
  }
  return d + 'Z';
}
type Edge = 'circle' | 'scallop' | 'flower' | 'burst' | 'cloud' | 'square' | 'shield' | 'stamp' | 'heart' | 'hexagon' | 'sun' | 'blob';
const EDGE: Record<Edge, string> = {
  circle: polar(() => 53),
  scallop: polar((t) => 52 + 3.5 * Math.cos(14 * t)),
  flower: polar((t) => 52 + 7 * Math.cos(6 * t)),
  burst: points(18, 58, 50),
  cloud: polar((t) => 49 + 7 * Math.abs(Math.cos(4 * t + 0.4))),
  square: 'M34 8 H86 Q112 8 112 34 V86 Q112 112 86 112 H34 Q8 112 8 86 V34 Q8 8 34 8 Z',
  shield: 'M60 5 C78 13 94 13 110 10 V58 C110 88 88 106 60 117 C32 106 10 88 10 58 V10 C26 13 42 13 60 5 Z',
  stamp: stamp(),
  heart: 'M60 24 C66 8 86 2 102 12 C118 24 116 52 102 70 C90 86 74 98 60 112 C46 98 30 86 18 70 C4 52 2 24 18 12 C34 2 54 8 60 24 Z',
  hexagon: points(3, 58, 58, 0).replace(/Z$/, '') + 'Z',
  sun: points(12, 59, 48),
  blob: polar((t) => 52 + 3.5 * Math.sin(3 * t + 1) + 2.5 * Math.cos(5 * t)),
};

type Sticker = { id: string; label: string; earn: string; edge: Edge; fill: string; text: string; img: string };
// Starter collection: her earn list first (themes, first game, 5 plays, days,
// students, every game), then the extra teacher firsts. White text only on
// Grape (5.6:1); every other bright takes ink text (WCAG 2.1 AA).
// Every sticker is a circle (teacher, 2026-11-24: "make all stickers circle and
// move the text closer to the images"); the other edges stay defined for later.
export const STARTER: Sticker[] = [
  { id: 'themes', label: 'TRIED 5 THEMES!', earn: 'Tried 5 new themes', edge: 'circle', fill: PP.grape, text: '#ffffff', img: 'star' },
  { id: 'first', label: 'FIRST GAME!', earn: 'Played your first game', edge: 'circle', fill: PP.pink, text: INK, img: 'rocket' },
  { id: 'plays', label: '5 PLAYS!', earn: 'Played one game 5 times', edge: 'circle', fill: PP.orange, text: INK, img: 'flower' },
  { id: 'days', label: '5 DAYS!', earn: 'Played on 5 days this month (any 5, not in a row)', edge: 'circle', fill: PP.sky, text: INK, img: 'sun' },
  { id: 'students', label: '10 STUDENTS!', earn: 'Added 10 students', edge: 'circle', fill: PP.lime, text: INK, img: 'heart' },
  { id: 'set', label: 'FIRST SET!', earn: 'Made your first question set', edge: 'circle', fill: PP.lemon, text: INK, img: 'apple' },
  { id: 'homework', label: 'HOMEWORK!', earn: 'Sent your first homework link', edge: 'circle', fill: PP.teal, text: INK, img: 'melon' },
  { id: 'live', label: 'LIVE GAME!', earn: 'Ran your first Live game', edge: 'circle', fill: PP.periwinkle, text: '#ffffff', img: 'rainbow' },
  { id: 'every', label: 'EVERY GAME!', earn: 'Tried every game', edge: 'circle', fill: PP.kelly, text: INK, img: 'bulb' },
  { id: 'rounds', label: '100 ROUNDS!', earn: 'Played 100 rounds', edge: 'circle', fill: PP.orange, text: INK, img: 'balloon' },
  { id: 'calm', label: 'CALM MODE!', earn: 'Used Calm mode in a game', edge: 'circle', fill: PP.grape, text: '#ffffff', img: 'moon' },
  { id: 'theme', label: 'MY THEME!', earn: 'Made your own theme', edge: 'circle', fill: PP.lemon, text: INK, img: 'crayon' },
];

// The label rides the top arc: 230 degrees on radius 34 (the heart, whose top dips, uses a lower, tighter arc).
function arc(cx: number, cy: number, r: number, span: number) {
  const a1 = R(270 - span / 2), a2 = R(270 + span / 2);
  return `M${(cx + r * Math.cos(a1)).toFixed(1)} ${(cy + r * Math.sin(a1)).toFixed(1)} A${r} ${r} 0 ${span > 180 ? 1 : 0} 1 ${(cx + r * Math.cos(a2)).toFixed(1)} ${(cy + r * Math.sin(a2)).toFixed(1)}`;
}

// One die-cut sticker: thick white edge with a soft shadow, a solid bright
// shape with a wobbly ink line, one big image, the label curving along the top.
export function StickerArt({ s, size = 120, locked }: { s: Sticker; size?: number | string; locked?: boolean }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const heart = s.edge === 'heart';
  // Label arc pulled in toward the picture (r 29, was 32), and the picture sits
  // a little higher and bigger, so the words hug it; tuned by eye on /brand.
  const path = heart ? arc(60, 68, 27, 200) : arc(60, 60, 29, 220);
  const len = heart ? 94 : 111;
  const fs = Math.min(16, len / (s.label.length * 0.6));
  const d = EDGE[s.edge];
  return (
    <svg viewBox="-7 -7 134 134" width={size} height={size} role="img" aria-label={locked ? `${s.label} sticker, not earned yet` : `${s.label} sticker`}
      style={locked ? { filter: 'grayscale(1)', opacity: 0.35 } : undefined}>
      <defs>
        <filter id={`w${id}`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed={s.id.length * 7} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="2" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id={`s${id}`} x="-15%" y="-15%" width="130%" height="130%"><feDropShadow dx="0" dy="2.5" stdDeviation="2" floodColor={INK} floodOpacity="0.28" /></filter>
        <path id={`a${id}`} d={path} />
      </defs>
      <path d={d} fill="#ffffff" stroke="#ffffff" strokeWidth="13" strokeLinejoin="round" filter={`url(#s${id})`} />
      <path d={d} fill={s.fill} />
      <path d={d} fill="none" stroke={INK} strokeWidth="2.6" strokeLinejoin="round" filter={`url(#w${id})`} />
      <g filter={`url(#w${id})`} transform={heart ? 'translate(39 56) scale(0.42)' : 'translate(32 40) scale(0.56)'}>{IMG[s.img]()}</g>
      <text fontFamily="var(--font-display)" fontSize={fs.toFixed(1)} fill={s.text} letterSpacing="0.4">
        <textPath href={`#a${id}`} startOffset="50%" textAnchor="middle">{s.label}</textPath>
      </text>
    </svg>
  );
}

const card = { background: PP.paper, border: `2px solid ${INK}` };
const quiet = { color: PP.quiet };

function StickerSheet() {
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(15rem, 1fr))' }}>
      {STARTER.map((s) => (
        <div key={s.id} className="rounded-[1.25rem] p-3 grid gap-2" style={card}>
          <div className="flex items-center justify-around">
            <figure className="grid justify-items-center gap-1"><StickerArt s={s} size={96} /><figcaption className="text-xs font-bold">Earned</figcaption></figure>
            <figure className="grid justify-items-center gap-1"><StickerArt s={s} size={96} locked /><figcaption className="text-xs font-bold">Not yet</figcaption></figure>
          </div>
          <p className="text-sm font-bold">{s.label}</p>
          <p className="text-sm font-semibold" style={quiet}>How to earn: {s.earn}</p>
        </div>
      ))}
    </div>
  );
}

const EARNED = new Set(['themes', 'first', 'plays', 'days', 'set', 'live', 'calm']);

function AchievementMock() {
  const [pick, setPick] = useState('every');
  const sel = STARTER.find((s) => s.id === pick) ?? STARTER[0];
  const got = STARTER.filter((s) => EARNED.has(s.id)).length;
  return (
    <div className="rounded-[1.5rem] p-4 sm:p-5 grid gap-4" style={{ background: PP.gamify, border: `2px solid ${INK}` }}>
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <h3 className="font-display text-3xl" style={{ color: INK }}>Achievements</h3>
        <div className="flex gap-2 text-sm font-bold">
          <span className="rounded-full px-3 py-1.5" style={{ background: PP.periwinkle, color: '#ffffff', border: `2px solid ${INK}` }}>Class stickers</span>
          <span className="rounded-full px-3 py-1.5" style={card}>Student sticker books</span>
          <span className="rounded-full px-3 py-1.5 inline-flex items-center gap-1.5" style={card}><MonitorPlay size={18} weight="bold" aria-hidden />Show on screen</span>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_17rem]">
        <section className="rounded-[1.25rem] p-4 grid gap-3 content-start" style={card} aria-label="Starter collection">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h4 className="font-heading font-bold text-lg">Starter collection</h4>
            <span className="text-sm font-bold">{got} of {STARTER.length}</span>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ background: PP.lavender, border: `2px solid ${INK}` }} role="progressbar" aria-valuenow={got} aria-valuemin={0} aria-valuemax={STARTER.length} aria-label="Starter collection progress">
            <div className="h-full" style={{ width: `${(got / STARTER.length) * 100}%`, background: PP.kelly }} />
          </div>
          <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))' }}>
            {STARTER.map((s) => {
              const has = EARNED.has(s.id);
              return (
                <button key={s.id} type="button" onClick={() => setPick(s.id)} aria-pressed={pick === s.id}
                  className="rounded-[1rem] p-1 grid justify-items-center relative"
                  style={{ background: pick === s.id ? PP.butter : 'transparent', border: `2px solid ${pick === s.id ? INK : 'transparent'}`, maxWidth: '8rem' }}>
                  <StickerArt s={s} size="100%" locked={!has} />
                  {!has && <Lock size={18} weight="bold" className="absolute top-1 right-1" aria-hidden />}
                </button>
              );
            })}
          </div>
        </section>
        <div className="grid gap-3 content-start">
          <section className="rounded-[1.25rem] p-4 grid justify-items-center gap-2 text-center" style={card} aria-live="polite">
            <StickerArt s={sel} size={128} locked={!EARNED.has(sel.id)} />
            <p className="font-heading font-bold text-lg">{sel.label}</p>
            <p className="text-sm font-semibold">{EARNED.has(sel.id) ? `Earned: ${sel.earn}` : `How to earn: ${sel.earn}`}</p>
          </section>
          <section className="rounded-[1.25rem] p-4 grid gap-2" style={{ background: PP.blueCrystal, border: `2px dashed ${INK}` }} aria-label="Winter collection, coming">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-heading font-bold">Winter collection</h4>
              <span className="rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ background: PP.lemon, border: `2px solid ${INK}` }}>Coming</span>
            </div>
            <div className="flex gap-2" aria-hidden>
              {[0, 1, 2, 3].map((k) => <span key={k} className="grid place-items-center rounded-full w-12 h-12" style={{ background: '#ffffff', opacity: 0.6, border: `2px dashed ${PP.quiet}` }}><Snowflake size={22} weight="bold" color={PP.quiet} /></span>)}
            </div>
            <p className="text-sm font-semibold">10 stickers, Dec 1 to Feb 28. Earn them by playing on 10 winter days, trying 3 winter themes and more.</p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function Stickers() {
  return (
    <section className="grid gap-5 rounded-[2rem] p-5 sm:p-6" style={{ background: PP.paper, border: `3px dashed ${PP.periwinkle}`, color: INK }} aria-labelledby="st-title">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full px-3 py-1 text-sm font-bold" style={{ background: PP.lemon, border: `2px solid ${INK}` }}>Approved, live</span>
        <h2 id="st-title" className="font-heading text-xl">Sticker collections</h2>
      </div>
      <p className="text-sm font-semibold max-w-prose" style={quiet}>
        Your request of 2026-11-23: Classic stickers in collect-em-all collections, a page to see and share what the class earned, and see-through stickers that say how to earn them. Starter collection: 12 round-ish die-cut stickers, each a different fun edge, one solid palette bright, one big image and its label curving along the top (your reference, 2026-11-23). Your reference star had a face; these have none (no faces in brand art), so that is a question for you. Full brainstorm: docs/stickers.md.
      </p>
      <h3 className="font-heading font-bold text-lg">Starter collection: earned and not yet</h3>
      <StickerSheet />
      <h3 className="font-heading font-bold text-lg">Achievement page (mockup, teacher view)</h3>
      <AchievementMock />
      <ul className="text-sm font-semibold grid gap-1 list-disc pl-5" style={quiet}>
        <li>Not yet = 35% see-through and gray, with a lock; the "How to earn" words stay full strength so they are easy to read.</li>
        <li>Show on screen: one collection fills the projector, big and calm; student names are never shown there.</li>
        <li>Just earned: the sticker drops in and settles with a soft peel sound; in Calm mode it fades in with no sound.</li>
      </ul>
    </section>
  );
}
