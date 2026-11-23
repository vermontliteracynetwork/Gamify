import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { Play, SpeakerHigh } from '@phosphor-icons/react';
import { Buddy, ND, Paper, Washi, star } from './buddies';

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
        <span className="text-3xl" style={{ ...GY, color: ND.ink }}>Gamify</span>
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
        <div className="flex items-center gap-3">
          <Btn main><Play weight="fill" size={22} />Play</Btn>
          <button type="button" aria-label="Listen" className="w-12 h-12 rounded-full grid place-items-center" style={{ background: ND.paper, border: `2px solid ${ND.ink}`, boxShadow: '0 4px 0 #d9cfbd' }}><SpeakerHigh weight="bold" size={22} /></button>
        </div>
      </div>
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
      <p className="text-sm font-semibold max-w-prose" style={{ color: ND.quiet }}>
        Scrapbook papers (gingham, watercolor stripes, star print, checker), washi tape, pencil-grain sticker buddies with rosy cheeks and little crayon stars stay at the edges. Words and buttons sit on plain cream or white. One hand-lettered word per screen, decorative only. Original drawings made in code.
      </p>
    </div>
  );
}
