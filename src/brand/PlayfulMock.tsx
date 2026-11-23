import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { Play, SpeakerHigh } from '@phosphor-icons/react';
import { ModeBadge } from '../games/ModeBadge';
import { Buddy, LogoMark, LogoWord, ND, Paper, Washi, star } from './buddies';

// "Playful mixed style mockup" (teacher, 2026-11-23: "give me a little mockup
// if it were a playful, mixed style"; her references: kids' crayon drawings,
// soft pencil sticker characters, a teacher scrapbook collage). A home hero and
// one game welcome card. Scrapbook papers (gingham, watercolor stripes, star
// print, checker) and pencil-grain sticker buddies live at the edges; the text
// and buttons stay clean (cream ground, cobalt main button, edge only on
// tappables, Grow Year and Inclusive Sans). Original drawings in code only.

const GY = { fontFamily: "'Grow Year', 'Segoe UI', system-ui, sans-serif" };
const STRIPES = ['#f7a8c8', '#ffd86b', '#8fd19e', '#9cc4ff', '#ffb27a', '#c7b2ff'];

function PaperPatterns() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
      <defs>
        <pattern id="pm-gingham" width="26" height="26" patternUnits="userSpaceOnUse">
          <rect width="26" height="26" fill="#fff8de" />
          <rect width="13" height="26" fill="#ffd86b" opacity="0.5" />
          <rect width="26" height="13" fill="#ffd86b" opacity="0.5" />
        </pattern>
        <pattern id="pm-stripes" width="80" height={STRIPES.length * 24} patternUnits="userSpaceOnUse">
          <rect width="80" height={STRIPES.length * 24} fill="#fffaf0" />
          {STRIPES.map((c, i) => <path key={c} d={`M-4 ${i * 24 + 8} q20 -3 44 0 t44 0 v8 q-20 3 -44 0 t-44 0 z`} fill={c} opacity="0.78" />)}
        </pattern>
        <pattern id="pm-starprint" width="46" height="46" patternUnits="userSpaceOnUse">
          <rect width="46" height="46" fill="#a9d0f5" />
          <polygon points={star(10, 11, 6, 2.8, 5)} fill="#ffd52e" />
          <polygon points={star(33, 20, 5, 2.3, 5, -70)} fill="#ec6fa8" />
          <polygon points={star(18, 36, 5.5, 2.5, 5, -100)} fill="#ffffff" />
          <polygon points={star(40, 41, 4, 1.8, 5)} fill="#ff6a1a" />
        </pattern>
        <pattern id="pm-pinstripe" width="18" height="18" patternUnits="userSpaceOnUse">
          <rect width="18" height="18" fill="#5f86c9" /><rect x="0" width="5" height="18" fill="#86a9e3" />
        </pattern>
        <pattern id="pm-dots" width="34" height="34" patternUnits="userSpaceOnUse">
          <rect width="34" height="34" fill="#fbf3e6" />
          <circle cx="8" cy="8" r="6" fill="#ec6fa8" opacity="0.7" /><circle cx="25" cy="25" r="6" fill="#8fd19e" opacity="0.8" />
        </pattern>
        <pattern id="pm-plaid" width="48" height="48" patternUnits="userSpaceOnUse">
          <rect width="48" height="48" fill="#fff6d6" />
          <rect x="6" width="10" height="48" fill="#f7a8c8" opacity="0.55" /><rect y="6" width="48" height="10" fill="#f7a8c8" opacity="0.55" />
          <rect x="30" width="5" height="48" fill="#8fd19e" opacity="0.6" /><rect y="30" width="48" height="5" fill="#9cc4ff" opacity="0.6" />
        </pattern>
        <pattern id="pm-pinkstripe" width="30" height="30" patternUnits="userSpaceOnUse">
          <rect width="30" height="30" fill="#e2558f" /><rect y="18" width="30" height="5" fill="#f7a8c8" /><rect y="25" width="30" height="2" fill="#8fd19e" />
        </pattern>
        <pattern id="pm-checker" width="40" height="40" patternUnits="userSpaceOnUse">
          <rect width="40" height="40" fill="#fffaf0" />
          <rect width="20" height="20" fill="#f7a8c8" /><rect x="20" y="20" width="20" height="20" fill="#f7a8c8" />
        </pattern>
      </defs>
    </svg>
  );
}

// Little crayon stars, scattered at the edges only.
function Stars({ spots }: { spots: [number, number, number, string][] }) {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <g filter="url(#nd-crayon)">
        {spots.map(([x, y, r, c], i) => <polygon key={i} points={star(x, y, r, r * 0.45, 5, -90 + i * 13)} fill={c} />)}
      </g>
    </svg>
  );
}

// A hand-lettered marker word: each letter its own brand color (deep shades,
// so it still passes contrast on cream), tipped a little, in a wavy frame.
function MarkerWord({ text, size = '1em' }: { text: string; size?: string }) {
  const colors = [ND.cobaltDeep, ND.pinkDeep, ND.greenDeep, ND.tangDeep, ND.violetDeep];
  return (
    <span className="relative inline-block px-[0.28em] py-[0.08em]" aria-label={text} style={{ fontSize: size }}>
      <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 200 80" preserveAspectRatio="none" aria-hidden="true">
        <path filter="url(#nd-crayon)" d={`M6 10 ${Array.from({ length: 12 }, (_, i) => `q8 ${i % 2 ? 6 : -6} 16 0`).join(' ')} V70 ${Array.from({ length: 12 }, (_, i) => `q-8 ${i % 2 ? -6 : 6} -16 0`).join(' ')} Z`}
          fill="#ffffff" stroke={ND.pink} strokeWidth="4" strokeLinejoin="round" />
      </svg>
      {text.split('').map((l, i) => (
        <span key={i} aria-hidden="true" className="relative inline-block" style={{ ...GY, color: colors[i % colors.length], transform: `rotate(${[-5, 4, -2, 6, -4][i % 5]}deg) translateY(${[0, -0.04, 0.03, -0.02, 0.02][i % 5]}em)` }}>{l}</span>
      ))}
    </span>
  );
}

// A cloud buddy with a rainbow tail, in pencil grain with a sticker edge.
function RainbowPuff({ size = 150 }: { size?: number }) {
  return (
    <span className="relative inline-block" style={{ width: size * 1.7, height: size }}>
      <svg viewBox="0 0 170 100" className="absolute inset-0 w-full h-full" overflow="visible" aria-hidden="true">
        <g filter="url(#nd-sticker)"><g filter="url(#nd-pencil)">
          {['#f0524f', '#ffb27a', '#ffd52e', '#8fd19e', '#9cc4ff', '#c7b2ff'].map((c, i) => (
            <path key={c} d={`M70 ${40 + i * 7} C 110 ${30 + i * 7}, 130 ${70 + i * 5}, 166 ${60 + i * 6}`} stroke={c} strokeWidth="8" fill="none" strokeLinecap="round" />
          ))}
        </g></g>
      </svg>
      <span className="absolute left-0 top-0"><Buddy id="puff" size={size * 0.75} color="#ffffff" look="pencil" sticker /></span>
    </span>
  );
}

function Btn({ main, children }: { main?: boolean; children: ReactNode }) {
  return (
    <button type="button" className="rounded-full font-bold inline-flex items-center gap-2 px-6 min-h-13 text-lg motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0.5 motion-safe:transition-transform"
      style={{ background: main ? ND.cobalt : ND.paper, color: main ? '#ffffff' : ND.ink, border: `2px solid ${ND.ink}`, boxShadow: `0 4px 0 ${main ? ND.cobaltDeep : '#d9cfbd'}` }}>
      {children}
    </button>
  );
}

function Hero({ still }: { still: boolean }) {
  const bob = (d: number) => (still ? {} : { animate: { y: [0, -7, 0], rotate: [-2, 2, -2] }, transition: { duration: 3 + d, repeat: Infinity, ease: 'easeInOut' as const } });
  return (
    <div className="relative rounded-[2rem] overflow-hidden" style={{ background: ND.cream }}>
      <nav className="relative flex items-center gap-3 px-6 pt-4">
        <LogoWord h={34} />
        <span className="ml-auto"><Btn>Sign in</Btn></span>
      </nav>
      <div className="relative grid wide:grid-cols-[1fr_1.05fr] gap-6 px-6 sm:px-8 pb-8 pt-2 items-center">
        {/* Clean reading zone: plain cream behind the words, no stars or tape on it. */}
        <div className="grid gap-4 content-center py-4">
          <h3 className="leading-[1.05] text-[clamp(2.2rem,4.2vw,3.6rem)]" style={{ ...GY, color: ND.ink }}>
            Turn any lesson into <MarkerWord text="play" />
          </h3>
          <p className="text-lg max-w-[30rem] font-semibold" style={{ color: ND.quiet }}>Your questions, a game kids cheer for, and themes your class makes by hand.</p>
          <div className="flex flex-wrap gap-3">
            <Btn main><Play weight="fill" size={22} />Start an Activity</Btn>
            <Btn>Join with a code</Btn>
          </div>
        </div>
        {/* Handmade edge: layered scrapbook papers, tape, sticker buddies, stars. */}
        <div className="relative w-full max-w-[34rem] aspect-[1.15] justify-self-center" aria-hidden="true">
          <Paper color="url(#pm-gingham)" rx={10} tilt={-5} className="absolute left-[2%] top-[4%] w-[58%] h-[54%]"><Washi className="-top-2 left-[30%]" rotate={-8} color={ND.pink} /></Paper>
          <Paper color="url(#pm-stripes)" rx={10} tilt={4} className="absolute right-[1%] top-[16%] w-[56%] h-[50%]"><Washi className="-top-2 right-[18%]" rotate={7} color={ND.mint} /></Paper>
          <Paper color="url(#pm-starprint)" rx={10} tilt={-2} className="absolute left-[16%] bottom-[2%] w-[60%] h-[40%]"><Washi className="-bottom-2 left-[8%]" rotate={-3} color={ND.yellow} /></Paper>
          <motion.span className="absolute left-[8%] top-[8%]" {...bob(0)}><Buddy id="twinkle" size={128} look="pencil" sticker limbs={false} /></motion.span>
          <motion.span className="absolute right-[0%] top-[24%]" {...bob(0.7)}><RainbowPuff size={92} /></motion.span>
          <span className="absolute left-[30%] bottom-[6%]"><Buddy id="sunny" size={104} color={ND.pink} look="pencil" sticker /></span>
          <span className="absolute right-[8%] bottom-[4%] rotate-[8deg]"><Buddy id="hartie" size={72} look="pencil" sticker /></span>
          <span className="absolute right-[30%] top-[2%] rotate-[-8deg]"><LogoMark h={58} sticker /></span>
          <Stars spots={[[4, 70, 2.6, ND.yellow], [12, 92, 1.8, ND.pink], [62, 6, 2.2, ND.yellow], [92, 10, 1.6, ND.cobalt], [96, 78, 2.4, ND.yellow], [50, 52, 1.5, ND.tangerine], [80, 96, 1.7, ND.green]]} />
        </div>
      </div>
    </div>
  );
}

function WelcomeCard() {
  return (
    <div className="rounded-[1.75rem] overflow-hidden grid" style={{ background: '#ffffff' }}>
      {/* Cover: a handmade edge. */}
      <div className="relative h-48 overflow-hidden" aria-hidden="true">
        <Paper color="url(#pm-checker)" lift={false} rx={0} className="absolute inset-0" />
        <Paper color="url(#pm-stripes)" rx={8} tilt={-4} className="absolute -left-4 top-6 w-[62%] h-[70%]" />
        <Paper color="url(#pm-gingham)" rx={8} tilt={5} className="absolute -right-3 top-3 w-[46%] h-[62%]"><Washi className="-top-2 left-[25%]" rotate={-6} color={ND.cobalt} w="3.5rem" /></Paper>
        <span className="absolute left-[12%] top-[16%]"><Buddy id="piece" size={104} look="pencil" sticker /></span>
        <span className="absolute right-[12%] top-[24%] rotate-[-6deg]"><Buddy id="bloop" size={78} look="pencil" sticker /></span>
        <Stars spots={[[46, 18, 4, ND.yellow], [58, 78, 3, ND.pink], [90, 86, 3.4, ND.yellow], [8, 84, 2.6, ND.cobalt]]} />
      </div>
      {/* Clean core: title, one line, the buttons. */}
      <div className="grid gap-3 p-5">
        <span className="text-3xl leading-none" style={{ ...GY, color: ND.ink }}>Puzzle Party</span>
        <p className="font-semibold" style={{ color: ND.quiet }}>Answer a question, win a puzzle piece. Finish the picture together.</p>
        <div className="flex flex-wrap gap-2"><ModeBadge mode="share" /><ModeBadge mode="versus" /></div>
        <div className="flex items-center gap-3">
          <Btn main><Play weight="fill" size={22} />Play</Btn>
          <button type="button" aria-label="Listen" className="w-12 h-12 rounded-full grid place-items-center" style={{ background: ND.paper, border: `2px solid ${ND.ink}`, boxShadow: '0 4px 0 #d9cfbd' }}><SpeakerHigh weight="bold" size={22} /></button>
        </div>
      </div>
    </div>
  );
}

// A hand-lettered phrase with a little face in every "o", letters in brand colors.
function FaceWord({ text }: { text: string }) {
  const colors = [ND.cobaltDeep, ND.pinkDeep, ND.greenDeep, ND.tangDeep, ND.violetDeep];
  let k = 0;
  return (
    <span className="leading-[1.1]" aria-label={text}>
      {text.split('').map((l, i) => {
        if (l === ' ') return <span key={i} aria-hidden="true"> </span>;
        const c = colors[k++ % colors.length];
        if (l.toLowerCase() === 'o') return (
          <svg key={i} viewBox="0 0 40 40" className="inline-block w-[0.62em] h-[0.62em] mx-[0.03em] align-[-0.02em]" aria-hidden="true">
            <circle cx="20" cy="20" r="16" fill="none" stroke={c} strokeWidth="6" />
            <circle cx="15" cy="18" r="2.4" fill={c} /><circle cx="25" cy="18" r="2.4" fill={c} />
            <path d="M14.5 24 q5.5 5 11 0" stroke={c} strokeWidth="2.6" fill="none" strokeLinecap="round" />
          </svg>
        );
        return <span key={i} aria-hidden="true" className="inline-block" style={{ ...GY, color: c, transform: `rotate(${[-4, 3, -2, 5][i % 4]}deg)` }}>{l}</span>;
      })}
    </span>
  );
}

// A sunburst card: rainbow rays and a sleepy smiling sun.
function Sunburst() {
  const rays = ['#f0524f', '#ffb27a', '#ffd52e', '#8fd19e', '#9cc4ff', '#c7b2ff', '#f7a8c8'];
  return (
    <svg viewBox="0 0 160 160" className="w-full h-full" aria-hidden="true">
      <rect width="160" height="160" fill="#fff3c4" />
      <g filter="url(#nd-crayon)">
        {Array.from({ length: 28 }, (_, i) => { const a = (i / 28) * Math.PI * 2; return <path key={i} d={`M${80 + 36 * Math.cos(a)} ${80 + 36 * Math.sin(a)} L${80 + 120 * Math.cos(a)} ${80 + 120 * Math.sin(a)}`} stroke={rays[i % rays.length]} strokeWidth="6" strokeLinecap="round" />; })}
      </g>
      <circle cx="80" cy="80" r="32" fill="#ffb347" filter="url(#nd-pencil)" />
      <path d="M64 76 q5 5 10 0 M86 76 q5 5 10 0" stroke={ND.ink} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M74 88 q6 5 12 0" stroke={ND.ink} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <ellipse cx="62" cy="88" rx="5" ry="3.2" fill="#f7a8c8" /><ellipse cx="98" cy="88" rx="5" ry="3.2" fill="#f7a8c8" />
    </svg>
  );
}

// School-object stickers: pencil-grain fill, white die-cut paper edge.
function SchoolSticker({ kind, size = 76 }: { kind: 'bus' | 'pencil' | 'notebook' | 'apple'; size?: number }) {
  const art = {
    bus: <><rect x="10" y="30" width="96" height="46" rx="10" fill="#ffd52e" /><rect x="96" y="44" width="16" height="32" rx="6" fill="#ffd52e" />
      {[18, 40, 62, 84].map((x) => <rect key={x} x={x} y="38" width="16" height="14" rx="3" fill="#e6eeff" />)}<rect x="10" y="60" width="102" height="5" fill={ND.ink} opacity="0.7" />
      <circle cx="32" cy="80" r="9" fill={ND.ink} /><circle cx="90" cy="80" r="9" fill={ND.ink} /></>,
    pencil: <g transform="rotate(-35 60 60)"><rect x="20" y="50" width="70" height="20" fill="#ffb347" /><rect x="10" y="50" width="12" height="20" rx="3" fill="#f7a8c8" /><rect x="20" y="50" width="6" height="20" fill="#c9c9c9" />
      <path d="M90 50 L108 60 L90 70 Z" fill="#f3d2a2" /><path d="M102 57 L108 60 L102 63 Z" fill={ND.ink} /></g>,
    notebook: <><rect x="26" y="16" width="70" height="88" rx="6" fill="#9cc4ff" /><rect x="40" y="34" width="44" height="14" rx="3" fill="#ffffff" />
      {[24, 40, 56, 72, 88].map((y) => <circle key={y} cx="26" cy={y} r="4" fill="#ffffff" stroke={ND.ink} strokeWidth="2" />)}</>,
    apple: <><path d="M60 38 C40 26 18 36 20 62 C22 88 42 104 60 96 C78 104 98 88 100 62 C102 36 80 26 60 38 Z" fill="#f0524f" /><path d="M60 38 C60 28 64 20 70 16" stroke="#7a4a2a" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M66 26 C76 14 92 18 92 18 C88 30 74 32 66 26 Z" fill="#12a150" /></>,
  }[kind];
  return <svg viewBox="0 0 120 120" width={size} height={size} overflow="visible" aria-hidden="true"><g filter="url(#nd-sticker)"><g filter="url(#nd-pencil)">{art}</g></g></svg>;
}

// Kind-word book stack: one idea for the encouragement line after an answer.
const BOOKS: [string, string, string, number][] = [
  ['You tried', '#9cc4ff', ND.ink, 6], ['Kind', '#f0524f', ND.ink, 0], ['Brave', '#c9d46a', ND.ink, 10], ['Curious', '#ffb27a', ND.ink, 3], ['Keep going', '#f7a8c8', ND.ink, 8],
];
function BookStack() {
  return (
    <div className="grid gap-1 w-full max-w-[15rem]" aria-label="Kind words: you tried, kind, brave, curious, keep going">
      {BOOKS.map(([w, c, t, off], i) => (
        <div key={w} aria-hidden="true" className="relative h-9 rounded-[6px] flex items-center justify-center font-bold uppercase tracking-wider text-[0.95rem]"
          style={{ background: c, color: t, marginLeft: off, marginRight: 12 - off, boxShadow: 'inset -14px 0 0 #fffaf0, inset -16px 0 0 rgba(29,26,51,0.12), 0 2px 0 rgba(29,26,51,0.12)', transform: `rotate(${[-1, 0.6, -0.4, 1, -0.8][i]}deg)` }}>
          <span className="pr-3" style={i === 0 ? { ...GY, textTransform: 'none', fontSize: '1.15rem', letterSpacing: 0 } : undefined}>{w}</span>
        </div>
      ))}
    </div>
  );
}

function Swatch({ fill, tilt, children, label }: { fill: string; tilt: number; children: ReactNode; label: string }) {
  return (
    <figure className="grid gap-1.5">
      <Paper color={fill} rx={12} tilt={tilt} className="min-h-52">
        <div className="h-full min-h-52 grid place-items-center p-4">{children}</div>
      </Paper>
      <figcaption className="text-xs font-semibold text-center" style={{ color: ND.quiet }}>{label}</figcaption>
    </figure>
  );
}

function ScrapbookBand() {
  return (
    <div className="grid grid-cols-2 wide:grid-cols-4 gap-5 rounded-[1.75rem] p-5" style={{ background: ND.cream }}>
      <Swatch fill="url(#pm-pinstripe)" tilt={-1.5} label="Sunburst card: lobby and big moments">
        <div className="relative w-40 h-40 rotate-[3deg]" style={{ boxShadow: '0 6px 14px rgba(29,26,51,0.2)' }}><Sunburst /><Washi className="-top-3 left-10" rotate={-6} color={ND.yellow} w="4rem" /></div>
      </Swatch>
      <Swatch fill="url(#pm-dots)" tilt={1} label="Hand-lettered praise, faces in the letters">
        <div className="relative rounded-[10px] px-4 py-5 text-center text-[2.1rem]" style={{ background: '#fffaf0', boxShadow: '0 6px 14px rgba(29,26,51,0.16)' }}>
          <FaceWord text="Good job, you!" />
          <Washi className="-top-3 right-6" rotate={8} color={ND.mint} w="3.5rem" />
        </div>
      </Swatch>
      <Swatch fill="url(#pm-plaid)" tilt={-0.8} label="Kind-word books: the line after an answer">
        <BookStack />
      </Swatch>
      <Swatch fill="url(#pm-pinkstripe)" tilt={1.4} label="School stickers with a paper edge">
        <div className="grid grid-cols-2 gap-2 justify-items-center">
          <SchoolSticker kind="bus" /><SchoolSticker kind="apple" /><SchoolSticker kind="pencil" /><SchoolSticker kind="notebook" />
        </div>
      </Swatch>
    </div>
  );
}

export default function PlayfulMock({ still }: { still: boolean }) {
  return (
    <div className="grid gap-3">
      <PaperPatterns />
      <div className="grid wide:grid-cols-[2.2fr_1fr] gap-5 items-start">
        <Hero still={still} />
        <WelcomeCard />
      </div>
      <ScrapbookBand />
      <p className="text-sm font-semibold max-w-prose" style={{ color: ND.quiet }}>
        Scrapbook papers like fabric swatches (gingham, watercolor stripes, star print, checker, pinstripe, polka dot, plaid), washi tape, a sunburst card, school stickers, kind-word books, pencil-grain sticker buddies with rosy cheeks and little crayon stars stay at the edges. Words and buttons sit on plain cream or white. One hand-lettered word per screen, decorative only. Original drawings made in code.
      </p>
    </div>
  );
}
