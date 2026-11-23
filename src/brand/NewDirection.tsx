import { type ReactNode } from 'react';
import { motion } from 'motion/react';
import { GearSix, Play, SpeakerHigh, Star } from '@phosphor-icons/react';
import { useSettings } from '../settings/SettingsContext';
import { LogoMark, LogoWord, ND, Paper, PaperDefs, Washi } from './buddies';
import { CrayonDie, CrayonKitSection, CrayonPawn, CrayonPowerUp, type PowerId } from './CrayonKit';
import HandmadeMock from './HandmadeMock';
import { ModeBadge } from '../games/ModeBadge';
import PlayfulMock from './PlayfulMock';
import PaletteProposal from './PaletteProposal';

// "New direction" (proposal, teacher 2026-11-23): playful flat shapes from her
// moodboards, kept clearly different from the main competitor's look. Preview
// only: nothing here is used outside the Brand page until she approves.
// Every drawing below is original, made in code. Mirrors the Brand Kit doc tab
// "Direction: playful flat shapes (2026-11-23)", section "Clean core, handmade
// edges": the art is cut paper, tape and crayon; the controls stay clean.

// Grow Year by name: outside h1 the app maps .font-display to the heading font.
const GY = { fontFamily: "'Grow Year', 'Segoe UI', system-ui, sans-serif" };


const PALETTE: { name: string; hex: string; role: string; text: string; pair: string }[] = [
  { name: 'Cream', hex: ND.cream, role: 'Ground', text: ND.ink, pair: 'Ink 14.8:1' },
  { name: 'Paper', hex: ND.paper, role: 'Panels, question box', text: ND.ink, pair: 'Ink 16.2:1' },
  { name: 'Ink', hex: ND.ink, role: 'Text, faces, control edge', text: '#ffffff', pair: 'White 17:1' },
  { name: 'Bubblegum pink', hex: ND.pink, role: 'Lead block', text: ND.ink, pair: 'Ink 5.9:1' },
  { name: 'Cobalt', hex: ND.cobalt, role: 'Main button, lead block', text: '#ffffff', pair: 'White 5.1:1' },
  { name: 'Grass green', hex: ND.green, role: 'Lead block, right, done', text: ND.ink, pair: 'Ink 5.0:1' },
  { name: 'Sunny yellow', hex: ND.yellow, role: 'Accent only: stars, rewards', text: ND.ink, pair: 'Ink 11.9:1' },
  { name: 'Tangerine', hex: ND.tangerine, role: 'Warm accent, timers', text: ND.ink, pair: 'Ink 5.9:1' },
  { name: 'Violet', hex: ND.violet, role: 'Support only', text: ND.ink, pair: 'Large text only' },
  { name: 'Mint', hex: ND.mint, role: 'Calm accent', text: ND.ink, pair: 'Ink 8.7:1' },
  { name: 'Coral red', hex: ND.coral, role: 'Delete, stop', text: ND.ink, pair: 'Ink 4.8:1' },
];
const DEEP: [string, string, string][] = [
  ['Cobalt deep', ND.cobaltDeep, '6.6:1 on cream'], ['Pink deep', ND.pinkDeep, '5.5:1 on cream'], ['Violet deep', ND.violetDeep, '6.2:1 on cream'],
  ['Green deep', ND.greenDeep, '4.8:1 on cream'], ['Tangerine deep', ND.tangDeep, '4.8:1 on cream'], ['Quiet text', ND.quiet, '6.7:1 on cream'],
];


// ---------- Doodles ----------
function Sparkle({ x, y, s = 1, c }: { x: number; y: number; s?: number; c: string }) {
  return <path transform={`translate(${x} ${y}) scale(${s})`} d="M0 -10 C1.5 -2 2 -1.5 10 0 C2 1.5 1.5 2 0 10 C-1.5 2 -2 1.5 -10 0 C-2 -1.5 -1.5 -2 0 -10 Z" fill={c} />;
}
// The power-up sheet (no characters, teacher 2026-11-23): crayon power-ups
// and sparkles on an even offset grid, at the edges only.
const SHEET: PowerId[] = ['magnet', 'double-points', 'shield', 'lightning', 'mystery-box', 'hint', 'freeze', 'treasure-chest'];
function PowerSheet({ className = '' }: { className?: string }) {
  return (
    <div className={`grid gap-y-5 py-3 overflow-hidden ${className}`} aria-hidden="true">
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex gap-10 whitespace-nowrap" style={{ marginLeft: row % 2 ? '2.25rem' : '0.5rem' }}>
          {Array.from({ length: 16 }, (_, k) => <CrayonPowerUp key={k} id={SHEET[(k + row * 3) % SHEET.length]} size={38} />)}
        </div>
      ))}
    </div>
  );
}
function Doodles() {
  return (
    <svg viewBox="0 0 240 120" className="w-full h-full" aria-hidden="true" filter="url(#nd-crayon)">
      <Sparkle x={30} y={30} s={1.6} c={ND.yellow} />
      <Sparkle x={210} y={92} s={1.2} c={ND.pink} />
      <path d="M70 34 q10 -16 20 0 t20 0 t20 0" stroke={ND.cobalt} strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M160 26 a12 12 0 1 1 -2 18 a7 7 0 1 1 8 -8" stroke={ND.green} strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M40 92 C60 70 90 70 110 88 M100 78 l12 10 l-14 6" stroke={ND.tangerine} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="140" cy="90" r="5" fill={ND.violet} /><circle cx="156" cy="74" r="3.5" fill={ND.mint} /><circle cx="196" cy="40" r="4" fill={ND.coral} />
    </svg>
  );
}

// ---------- Controls in the new direction ----------
const shade = (c: string) => ({ [ND.cobalt]: ND.cobaltDeep, [ND.pink]: ND.pinkDeep, [ND.green]: ND.greenDeep, [ND.yellow]: '#d9a900', [ND.paper]: '#d9cfbd', [ND.coral]: '#c12f2c', [ND.tangerine]: ND.tangDeep } as Record<string, string>)[c] ?? ND.ink;
function NDButton({ bg, fg, children, big = false }: { bg: string; fg: string; children: ReactNode; big?: boolean }) {
  return (
    <button type="button" className={`rounded-full font-bold inline-flex items-center gap-2 motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0.5 motion-safe:transition-transform ${big ? 'px-7 min-h-14 text-xl' : 'px-5 min-h-12 text-lg'}`}
      style={{ background: bg, color: fg, border: `2px solid ${ND.ink}`, boxShadow: `0 4px 0 ${shade(bg)}` }}>
      {children}
    </button>
  );
}

function Block({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="grid gap-3">
      <div><h2 className="font-heading text-xl" style={{ color: ND.ink }}>{title}</h2>{note && <p className="text-sm font-semibold" style={{ color: ND.quiet }}>{note}</p>}</div>
      {children}
    </section>
  );
}


// ---------- Mixed media layer (teacher, 2026-11-23): photo stickers with white
// edges, torn paper, tape, hand-lettered notes and gentle grain, on top of the
// crayon power-ups. Photos here are neutral placeholders, clearly marked. ----------
function Grain() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none mix-blend-multiply opacity-[0.1]" aria-hidden="true">
      <filter id="nd-grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" /><feColorMatrix values="0 0 0 0 0.11  0 0 0 0 0.1  0 0 0 0 0.2  0 0 0 0.55 0" /></filter>
      <rect width="100%" height="100%" filter="url(#nd-grain)" />
    </svg>
  );
}
function Tape({ className = '', color = '#ffd52e', rotate = -6 }: { className?: string; color?: string; rotate?: number }) {
  return <Washi className={`${className}`} color={color.slice(0, 7)} rotate={rotate} />;
}
function torn(w: number, h: number, seed: number) {
  let d = `M0 0 H${w} V${h - 8}`;
  for (let x = w; x > 0; x -= 10) { const j = ((Math.sin(x * 12.9898 + seed) * 43758.5453) % 1 + 1) % 1; d += ` L${x - 5} ${h - 8 + j * 8} L${x - 10} ${h - 8}`; }
  return d + ' Z';
}
function TornPaper({ color, children, className = '', seed = 1 }: { color: string; children: ReactNode; className?: string; seed?: number }) {
  return (
    <div className={`relative ${className}`}>
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none" aria-hidden="true"><path d={torn(300, 100, seed)} fill={color} /></svg>
      <div className="relative px-5 pt-3 pb-5">{children}</div>
    </div>
  );
}
// A photo sticker: a white die-cut edge around a photo. Placeholder art only.
function PhotoSticker({ label, children, rotate = 0, className = '' }: { label: string; children: ReactNode; rotate?: number; className?: string }) {
  return (
    <figure className={`relative rounded-[1.25rem] p-2 ${className}`} style={{ background: '#ffffff', transform: `rotate(${rotate}deg)`, boxShadow: '0 6px 16px rgba(29,26,51,0.16)' }}>
      <div className="relative rounded-[0.9rem] overflow-hidden aspect-[4/3] grid place-items-center" style={{ background: 'repeating-linear-gradient(45deg,#e9e1d2 0 10px,#f1eadd 10px 20px)' }}>
        {children}
        <span className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider" style={{ background: ND.ink, color: '#ffffff' }}>Placeholder photo</span>
      </div>
      <figcaption className="text-xs font-semibold pt-1.5 text-center" style={{ color: ND.quiet }}>{label}</figcaption>
    </figure>
  );
}
function HandNote({ text, color = ND.pinkDeep, className = '' }: { text: string; color?: string; className?: string }) {
  return (
    <span className={`absolute flex items-end gap-1 ${className}`} aria-hidden="true">
      <svg viewBox="0 0 50 40" className="w-10 h-8"><path d="M46 6 C30 4 14 14 8 32 M8 32 l-2 -12 M8 32 l10 -6" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
      <span className="text-xl leading-none" style={{ ...GY, color, transform: 'rotate(-6deg)' }}>{text}</span>
    </span>
  );
}
// A GIF-style looping sticker: a short bounce loop, stopped in Still.
function LoopSticker({ id, still, label }: { id: PowerId; still: boolean; label: string }) {
  return (
    <div className="grid justify-items-center gap-1">
      <motion.span className="block rounded-full p-2" style={{ background: '#ffffff' }}
        animate={still ? undefined : { y: [0, -14, 0, 0], scaleY: [1, 1.06, 0.9, 1], rotate: [0, -4, 3, 0] }}
        transition={still ? undefined : { duration: 1.4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.4 }}>
        <CrayonPowerUp id={id} size={72} />
      </motion.span>
      <span className="text-xs font-bold" style={{ color: ND.quiet }}>{label}</span>
    </div>
  );
}
function MixedMedia({ still }: { still: boolean }) {
  // GIF-style loops follow the GIFs sensory setting (Calm sets it to Still).
  return (
    <div className="grid gap-5">
      <div className="grid wide:grid-cols-[1.3fr_1fr] gap-5">
        {/* Home page "Made by teachers" gallery strip */}
        <div className="relative rounded-[1.75rem] overflow-hidden p-6 pb-10 min-h-[22rem]" style={{ background: ND.cobalt }}>
          <Grain />
          <TornPaper color={ND.paper} className="relative inline-block max-w-[22rem]" seed={3}>
            <span className="text-3xl leading-tight" style={GY}><span style={{ color: ND.pinkDeep }}>Made</span> <span style={{ color: ND.greenDeep }}>by</span> <span style={{ color: ND.cobaltDeep }}>teachers</span> <span style={{ color: ND.tangDeep }}>and kids</span></span>
          </TornPaper>
          <div className="relative grid grid-cols-3 gap-4 mt-6 items-start">
            <div className="relative"><Tape className="-top-3 left-6 z-10" /><PhotoSticker label="Clay board pieces" rotate={-4}><span className="flex gap-1"><CrayonPawn color="#d98a5f" size={52} /><CrayonPawn color={ND.cobalt} size={52} /></span></PhotoSticker></div>
            <div className="relative mt-6"><Tape className="-top-3 left-8 z-10" color="#ec6fa8cc" rotate={4} /><PhotoSticker label="Felt and fabric theme" rotate={3}><CrayonPowerUp id="second-chance" size={64} /></PhotoSticker></div>
            <div className="relative"><Tape className="-top-3 left-4 z-10" color="#3fd0b6cc" rotate={-2} /><PhotoSticker label="Crayon drawing theme" rotate={-2}><CrayonPowerUp id="double-points" size={64} /></PhotoSticker></div>
          </div>
          <HandNote text="handmade!" color={ND.yellow} className="right-6 top-6" />
        </div>
        {/* A theme card as a scrapbook page */}
        <div className="relative rounded-[1.75rem] overflow-hidden p-5 min-h-[22rem]" style={{ background: 'repeating-linear-gradient(0deg, #fffaf0 0 26px, #e6eeff 26px 28px)' }}>
          <Grain />
          <span className="absolute left-0 top-0 bottom-0 w-6" style={{ background: 'repeating-conic-gradient(#ec6fa8 0 25%, #fffaf0 0 50%) 0 0 / 12px 12px' }} aria-hidden="true" />
          <div className="relative pl-6 grid gap-3">
            <div className="flex items-center gap-2"><span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: ND.green, color: ND.ink }}>Theme</span><span className="font-heading font-bold">Paper Garden</span></div>
            <div className="relative max-w-[24rem]"><Tape className="-top-3 right-8 z-10" rotate={8} /><PhotoSticker label="Cut paper power-ups, glued and photographed" rotate={2}><div className="flex gap-1"><CrayonPowerUp id="potion" size={52} /><CrayonPowerUp id="magnet" size={52} /></div></PhotoSticker></div>
            <p className="text-sm font-semibold" style={{ color: ND.quiet }}>For board games. 12 pieces. Made by a class.</p>
          </div>
          <HandNote text="we made these" className="right-4 bottom-4" />
        </div>
      </div>
      <div className="rounded-[1.5rem] p-4 flex flex-wrap items-end justify-around gap-4" style={{ background: ND.paper }}>
        <LoopSticker id="double-points" still={still} label="Right answer loop" />
        <LoopSticker id="lightning" still={still} label="Big moment loop" />
        <LoopSticker id="mystery-box" still={still} label="Power-up loop" />
        <LoopSticker id="extra-time" still={still} label="Waiting loop" />
        <p className="text-xs font-semibold max-w-[16rem]" style={{ color: ND.quiet }}>GIF-style sticker loops: lively by default. Calm mode and the GIFs setting (Moving or Still pictures) hold them still. No flashing 3 or more times a second, no full-screen strobes.</p>
      </div>
    </div>
  );
}

const DONTS: [string, string][] = [
  ['Cream ground; pink, cobalt and green blocks lead', 'Yellow ground with purple type and purple buttons'],
  ['Solid flat headline letters, no outline, no shadow', 'Outlined headline text with an offset drop shadow'],
  ['Crayon power-ups and pieces: objects, no faces, no characters', 'Black-outlined, googly-eyed cartoon mascots and "WOW" bursts'],
  ['A tidy power-up sheet at the edges', 'Scattered confetti dashes and worm squiggles as the main texture'],
  ['Our own logo: the G joystick mark and the Grow Year wordmark, kept as they are', 'A bubbly outlined logo with a smiley in a letter'],
];

export default function NewDirection() {
  const { settings } = useSettings();
  const still = settings.motion === 'still';
  return (
    <div className="relative rounded-[2rem] p-5 sm:p-8 grid gap-10 overflow-x-clip" style={{ background: ND.cream, color: ND.ink }}>
      <PaperDefs />
      <PaletteProposal />
      <Block title="Playful mixed style mockup" note="Your references of 2026-11-23: kids' crayon drawings, soft pencil stickers, a scrapbook collage (no characters: power-ups and pieces carry the art). A home page hero and one game welcome card. Mess at the edges, a clean reading zone in the middle.">
        <PlayfulMock still={still} />
      </Block>

      <p className="font-semibold max-w-prose" style={{ color: ND.quiet }}>
        A proposal from your moodboards and your note of 2026-11-23: very modern and simple in function, playful scrapbook and mixed media around it. Classic is made by hand (cut paper, tape, crayon) so a kid's clay, crayon or fabric theme sits naturally beside it. Nothing on the site uses this yet. Full rules are in the Brand Kit doc tab "Direction: playful flat shapes", section "Clean core, handmade edges".
      </p>

      <Block title="Clean core, handmade edges (mockup)" note="One rule for every screen. What kids read, answer and tap is modern and plain, the same in every game. Frames, backgrounds, covers, celebrations and the gallery are made by hand.">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-[1.5rem] p-5 grid gap-1.5 content-start" style={{ background: '#ffffff' }}>
            <span className="font-heading font-bold text-lg">Clean core (never themed)</span>
            {['Question card, answer tiles, main button', 'Board play zone, score board, timer', 'Menu controls, settings, teacher forms', 'Flat fill, ink text at 7:1 or more, no tilt, no tape, no texture', 'Same place in every game'].map((t) => <span key={t} className="font-semibold">{t}</span>)}
          </div>
          <Paper color={ND.paper} rx={24} tilt={-0.6}>
            <div className="p-5 grid gap-1.5 content-start">
              <span className="font-heading font-bold text-lg">Handmade edges (the theme's to change)</span>
              {['Frames, backgrounds, game covers', 'Celebrations, results decorations, lobby', 'Gallery, Blog guides, marketing', 'Cut paper, grain, crayon, tape, stickers, photos', 'Tilt up to 4 degrees, outside the reading zone'].map((t) => <span key={t} className="font-semibold" style={{ color: ND.quiet }}>{t}</span>)}
            </div>
            <Washi className="-top-2 right-10" rotate={6} color={ND.pink} />
          </Paper>
        </div>
        <HandmadeMock still={still} />
      </Block>

      {/* Mock hero for the home page */}
      <Block title="Home page hero (mockup)" note="Real layout widths. Cream page, one color-block collage, a solid headline with no outline or shadow.">
        <div className="rounded-[2rem] overflow-hidden" style={{ background: ND.paper }}>
          <nav className="flex items-center gap-4 px-6 py-4">
            <LogoWord h={34} />
            <span className="ml-auto hidden sm:flex gap-5 font-bold" style={{ color: ND.ink }}><span>Games</span><span>Blog</span><span>Pricing</span></span>
            <NDButton bg={ND.paper} fg={ND.ink}>Sign in</NDButton>
          </nav>
          <div className="grid wide:grid-cols-[1.05fr_1fr] gap-8 px-6 sm:px-10 pb-10 pt-4 items-center">
            <div className="grid gap-5 content-center">
              <h3 className="leading-[1.02] text-[clamp(2.6rem,5.2vw,4.6rem)]" style={{ ...GY, color: ND.ink }}>
                Every Question <span style={{ color: ND.cobaltDeep }}>Becomes a Game</span>
              </h3>
              <svg viewBox="0 0 220 16" className="w-56 -mt-3" aria-hidden="true"><path d="M4 10 q14 -10 28 0 t28 0 t28 0 t28 0 t28 0 t28 0 t28 0" stroke={ND.pink} strokeWidth="5" fill="none" strokeLinecap="round" /></svg>
              <p className="text-lg max-w-[34rem]" style={{ color: ND.quiet }}>Bring your own questions. Pick a game. Kids join with a code and play on any screen.</p>
              <div className="flex flex-wrap gap-3">
                <NDButton bg={ND.cobalt} fg="#ffffff" big><Play weight="fill" size={22} />Start an Activity</NDButton>
                <NDButton bg={ND.paper} fg={ND.ink} big>Join with a code</NDButton>
              </div>
            </div>
            <div className="grid grid-cols-2 grid-rows-2 gap-3 aspect-[1.1] w-full max-w-[32rem] justify-self-center">
              <Paper color={ND.pink} rx={26} tilt={-1.5} className="grid"><span className="h-full grid place-items-center"><CrayonPowerUp id="magnet" size={150} title="Magnet power-up" /></span></Paper>
              <Paper color={ND.cobalt} rx={26} tilt={1.5} className="grid"><span className="h-full grid place-items-center"><CrayonPowerUp id="double-points" size={120} /></span><Washi className="-top-2 left-1/3" rotate={-5} color={ND.mint} /></Paper>
              <Paper color={ND.green} rx={26} tilt={1} className="grid"><span className="h-full grid place-items-center"><CrayonDie value={5} size={116} /></span></Paper>
              <Paper color={ND.cream} rx={26} tilt={-1} className="grid overflow-visible">
                <div className="absolute inset-x-0 top-0 h-1/2"><Doodles /></div>
                <span className="h-full grid place-items-center pt-16"><CrayonPowerUp id="treasure-chest" size={96} /></span>
              </Paper>
            </div>
          </div>
        </div>
      </Block>

      <Block title="How we differ from the competitor look" note="A ship check: if a screen could pass for the competitor at a glance, it is not done.">
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="rounded-[1.5rem] p-5 grid gap-2 content-start" style={{ background: ND.green }}>
            <span className="font-heading font-bold text-lg">Do</span>
            {DONTS.map(([d]) => <span key={d} className="font-semibold">{d}</span>)}
          </div>
          <div className="rounded-[1.5rem] p-5 grid gap-2 content-start" style={{ background: ND.paper }}>
            <span className="font-heading font-bold text-lg">Do not</span>
            {DONTS.map(([, n]) => <span key={n} className="font-semibold" style={{ color: ND.quiet }}>{n}</span>)}
          </div>
        </div>
      </Block>

      <Block title="Palette" note="Pink, cobalt and green lead. Yellow is an accent, never the ground. Each chip shows the text color that passes 4.5:1 on it.">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] gap-3">
          {PALETTE.map((p) => (
            <div key={p.name} className="rounded-[1.5rem] p-4 min-h-32 grid content-between" style={{ background: p.hex, color: p.text, boxShadow: p.hex === ND.cream ? `inset 0 0 0 2px ${ND.paper}` : undefined }}>
              <span className="font-bold">{p.name}</span>
              <span className="grid"><span className="text-sm font-mono">{p.hex}</span><span className="text-xs font-semibold">{p.role}</span><span className="text-xs font-semibold">{p.pair}</span></span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {DEEP.map(([n, h, r]) => <span key={n} className="rounded-full px-4 py-2 font-bold text-sm" style={{ background: h, color: '#ffffff' }}>{n} {h}, {r}</span>)}
        </div>
      </Block>

      <Block title="Universal power-ups (crayon)" note="Your direction, 2026-11-23: no characters; one set of power-ups shared across games, all drawn in one crayon and colored-pencil style. A game picks the ones it uses from this set and adds its own only when none fits. Names and jobs stay the same in every game.">
        <CrayonKitSection />
      </Block>

      <Block title="Logo (kept as is)" note="Your decision, 2026-11-23: the G joystick stays the logo and Grow Year stays the title font. The existing files, never redrawn: on cream, on color blocks, white on cobalt, and as a sticker on scrapbook pages.">
        <div className="flex flex-wrap items-center gap-6 rounded-[1.5rem] p-6" style={{ background: ND.paper }}>
          <LogoMark h={96} />
          <LogoWord h={48} />
          <div className="rounded-[1.5rem] px-6 py-4 flex items-center gap-3" style={{ background: ND.cobalt }}><LogoMark h={56} tone="white" /><LogoWord h={36} tone="white" /></div>
          <div className="rounded-[1.5rem] px-6 py-4 flex items-center gap-3" style={{ background: ND.pink }}><LogoMark h={56} /><LogoWord h={36} /></div>
          <Paper color="url(#pm-gingham)" rx={10} tilt={-3} className="w-32 h-32 grid place-items-center"><span className="h-full grid place-items-center"><LogoMark h={84} sticker /></span><Washi className="-top-2 left-8" rotate={-6} color={ND.mint} w="3.5rem" /></Paper>
        </div>
      </Block>

      <Block title="Ways to play (kept as they are)" note="Your decision, 2026-11-23: three ways only, with their names, icons and colors. Versus is not a category anywhere.">
        <div className="grid gap-2 max-w-[36rem]">
          <ModeBadge mode="share" withHint /><ModeBadge mode="live" withHint /><ModeBadge mode="solo" withHint />
        </div>
      </Block>

      <Block title="Patterns and doodles" note="The power-up sheet is the main texture, at the edges only. Doodles: sparkles, a swirl, an arrow, dots. One squiggle may underline a word.">
        <div className="grid sm:grid-cols-[2fr_1fr] gap-4">
          <div className="rounded-[1.5rem] h-48 overflow-hidden" style={{ background: ND.cream, boxShadow: `inset 0 0 0 2px ${ND.paper}` }}><PowerSheet /></div>
          <div className="rounded-[1.5rem] h-48 p-3" style={{ background: ND.paper }}><Doodles /></div>
        </div>
      </Block>

      <Block title="Type" note="Kept: Grow Year (logo, titles, scores) and Inclusive Sans. Optional third font: Fredoka or Baloo 2 (both OFL), not installed yet, so not shown.">
        <div className="rounded-[1.5rem] p-6 grid gap-4" style={{ background: ND.paper }}>
          <div><p className="text-xs font-bold uppercase tracking-wider" style={{ color: ND.quiet }}>Grow Year: solid letters, never outlined</p><p className="text-5xl" style={{ ...GY, color: ND.pinkDeep }}>Three in a row!</p></div>
          <div><p className="text-xs font-bold uppercase tracking-wider" style={{ color: ND.quiet }}>Inclusive Sans bold: headings and buttons</p><p className="font-heading font-bold text-2xl">Pick your question set</p></div>
          <div><p className="text-xs font-bold uppercase tracking-wider" style={{ color: ND.quiet }}>Inclusive Sans: body</p><p className="text-lg max-w-prose">Answer the question, then tap the board to make your move. Right answers can bring a surprise power-up.</p></div>
        </div>
      </Block>

      <Block title="Buttons, answer tiles, cards and score board" note="Tappable things keep a thin ink edge and a press shade in their own color. Cards and art have no outline.">
        <div className="flex flex-wrap items-center gap-3">
          <NDButton bg={ND.cobalt} fg="#ffffff" big><Play weight="fill" size={22} />Set up and play</NDButton>
          <NDButton bg={ND.cobalt} fg="#ffffff">Next</NDButton>
          <NDButton bg={ND.paper} fg={ND.ink}>Back</NDButton>
          <NDButton bg={ND.coral} fg={ND.ink}>Delete</NDButton>
          {[<GearSix key="g" weight="bold" size={24} />, <SpeakerHigh key="s" weight="bold" size={24} />].map((ic, i) => (
            <button key={i} type="button" aria-label={i ? 'Listen' : 'Settings'} className="w-12 h-12 rounded-full grid place-items-center motion-safe:hover:scale-105 motion-safe:transition-transform" style={{ background: ND.paper, border: `2px solid ${ND.ink}`, boxShadow: `0 4px 0 ${shade(ND.paper)}` }}>{ic}</button>
          ))}
        </div>
        <div className="grid lg:grid-cols-[19rem_1fr] gap-5 items-start">
          <div className="rounded-[1.75rem] p-4 grid gap-2" style={{ background: ND.paper }}>
            <div className="flex items-center justify-between"><span className="font-heading font-bold text-lg">Scores</span><span className="rounded-full px-3 py-1 text-sm font-bold" style={{ background: ND.cream }}>Rounds 3/8</span></div>
            {[['Cosmic Waffle', 12, ND.cobalt], ['Wiggly Penguin', 9, ND.coral], ['Turbo Unicorn', 15, ND.green]].map(([n, s, c], i) => (
              <div key={n as string} className="flex items-center gap-3 rounded-[1.25rem] px-3 py-2" style={{ background: i === 0 ? ND.cream : 'transparent', boxShadow: i === 0 ? `inset 0 0 0 2px ${ND.cobalt}` : undefined }}>
                <CrayonPawn color={c as string} size={40} />
                <span className="font-bold flex-1">{n as string}</span>
                <span className="text-3xl tabular-nums" style={GY}>{s as number}</span>
              </div>
            ))}
            <span className="text-xs font-semibold" style={{ color: ND.quiet }}>Ring shows whose turn it is.</span>
          </div>
          <div className="grid gap-3">
            <div className="rounded-[1.75rem] p-5 text-left font-heading font-bold text-[clamp(1.4rem,3vw,2.2rem)]" style={{ background: ND.paper }}>Which word starts with a capital letter?</div>
            <div className="grid grid-cols-2 gap-3">
              {([['A', ND.pink, 'Monday'], ['B', ND.yellow, 'apple'], ['C', ND.green, 'blue'], ['D', ND.mint, 'run']] as [string, string, string][]).map(([letter, bg, w]) => (
                <button key={w} type="button" className="min-h-20 rounded-[1.25rem] flex items-center gap-3 px-4 font-bold text-2xl motion-safe:hover:-translate-y-0.5 motion-safe:transition-transform"
                  style={{ background: bg, color: ND.ink, border: `2px solid ${ND.ink}`, boxShadow: `0 4px 0 ${shade(bg) === ND.ink ? '#2aa58f' : shade(bg)}` }}>
                  <span className="w-10 h-10 rounded-full grid place-items-center text-lg" style={{ background: ND.paper }}>{letter}</span>{w}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-3">
          {([['Board games', ND.pink, 'double-dice'], ['Word games', ND.cobalt, 'hint'], ['Arcade', ND.green, 'lightning']] as [string, string, PowerId][]).map(([t, bg, id]) => (
            <Paper key={t} color={bg} rx={26} className="min-h-40">
              <div className="p-5 pr-20 min-h-40 grid content-between">
                <span className="text-3xl" style={{ ...GY, color: bg === ND.cobalt ? '#ffffff' : ND.ink }}>{t}</span>
                <span className="flex items-center gap-1 font-bold" style={{ color: bg === ND.cobalt ? '#ffffff' : ND.ink }}><Star weight="fill" size={18} />Classic theme family</span>
              </div>
              <span className="absolute right-3 top-3"><CrayonPowerUp id={id} size={64} sticker /></span>
              <Washi className="-top-2 left-6" rotate={-4} color={ND.yellow} w="3.5rem" />
            </Paper>
          ))}
        </div>
      </Block>

      <Block title="Mixed media layer" note="Photo stickers with white edges, torn paper, tape, hand-lettered notes and soft grain around the crayon power-ups. The star is the themes teachers and kids make by hand. Photos below are placeholders; only owned, licensed or permission-given photos ever ship. Teacher search: GIFs from GIPHY (Powered by GIPHY) and photos from Unsplash (with credit), pending the GIPHY production key and attorney review.">
        <MixedMedia still={still || settings.gifs === 'still'} />
      </Block>

      <Block title="Classic game board (sketch)" note="The board zone stays plain; only the frame is cut paper with a strip of the power-up sheet. Pieces are crayon pawns; a power-up space shows its power-up.">
        <div className="rounded-[1.75rem] p-4 sm:p-6 grid gap-3 relative overflow-hidden" style={{ background: ND.cream }}>
          <Paper color={ND.pink} lift={false} rx={28} className="absolute inset-1" />
          <div className="absolute inset-x-0 top-0 h-14 opacity-90 overflow-hidden"><PowerSheet /></div>
          <div className="relative rounded-[1.5rem] p-4 grid grid-cols-6 gap-2 mt-10" style={{ background: ND.paper }}>
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i} className="aspect-square rounded-[0.9rem] grid place-items-center" style={{ background: [ND.cream, '#ffe9f2', '#e6eeff', '#e3f6ea'][i % 4], border: `2px solid ${ND.ink}` }}>
                {i === 2 && <CrayonPawn color={ND.cobalt} size={46} />}
                {i === 7 && <CrayonPawn color={ND.pink} size={46} />}
                {i === 11 && <CrayonPowerUp id="magnet" size={50} />}
              </div>
            ))}
          </div>
        </div>
      </Block>
    </div>
  );
}
