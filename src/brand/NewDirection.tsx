import { useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { GearSix, Play, SpeakerHigh, Star } from '@phosphor-icons/react';
import { useSettings } from '../settings/SettingsContext';

// "New direction" (proposal, teacher 2026-11-23): playful flat shapes from her
// moodboards, kept clearly different from the main competitor's look. Preview
// only: nothing here is used outside the Brand page until she approves.
// Every drawing below is original, made in code. Mirrors the Brand Kit doc tab
// "Direction: playful flat shapes (2026-11-23)".

// Grow Year by name: outside h1 the app maps .font-display to the heading font.
const GY = { fontFamily: "'Grow Year', 'Segoe UI', system-ui, sans-serif" };

export const ND = {
  cream: '#f6f0e4', paper: '#fffaf0', ink: '#1d1a33', quiet: '#57506e',
  pink: '#ec6fa8', cobalt: '#1f5fff', green: '#12a150', yellow: '#ffd52e', tangerine: '#ff6a1a',
  violet: '#8b5cf6', mint: '#3fd0b6', coral: '#f0524f',
  cobaltDeep: '#1748c9', pinkDeep: '#b3236a', violetDeep: '#6233d6', greenDeep: '#0b7a3c', tangDeep: '#b84300',
};

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

// ---------- Faces: two dot eyes (or happy ^^), a small smile, rosy cheeks. ----------
function Face({ x, y, s = 1, color = ND.ink, happy = false, cheeks = '#ffffff66' }: { x: number; y: number; s?: number; color?: string; happy?: boolean; cheeks?: string | null }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {happy ? (
        <>
          <path d="M-14 -2 q4 -6 8 0" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M6 -2 q4 -6 8 0" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <ellipse cx="-10" cy="-3" rx="3.2" ry="4.2" fill={color} />
          <ellipse cx="10" cy="-3" rx="3.2" ry="4.2" fill={color} />
        </>
      )}
      <path d="M-6 6 q6 6 12 0" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
      {cheeks && <><ellipse cx="-17" cy="5" rx="4.5" ry="3" fill={cheeks} /><ellipse cx="17" cy="5" rx="4.5" ry="3" fill={cheeks} /></>}
    </g>
  );
}

function star(cx: number, cy: number, outer: number, inner: number, points: number, rot = -90) {
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 ? inner : outer;
    const a = ((rot + (i * 180) / points) * Math.PI) / 180;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(' ');
}

// ---------- The Gamify buddies: 12 flat shapes, no outlines. ----------
type BuddyId = 'sunny' | 'twinkle' | 'bloop' | 'asta' | 'hartie' | 'piece' | 'puff' | 'archie' | 'ray' | 'wiggle' | 'pebble' | 'zip';
export const BUDDIES: { id: BuddyId; name: string; shape: string; color: string; use: string }[] = [
  { id: 'sunny', name: 'Sunny', shape: 'Flower', color: ND.yellow, use: 'Lead mascot' },
  { id: 'twinkle', name: 'Twinkle', shape: 'Star', color: ND.tangerine, use: 'Points, power-up' },
  { id: 'bloop', name: 'Bloop', shape: 'Blob', color: ND.mint, use: 'Team icon' },
  { id: 'asta', name: 'Asta', shape: 'Asterisk', color: ND.pink, use: 'Team icon, sparkle' },
  { id: 'hartie', name: 'Hartie', shape: 'Heart', color: ND.coral, use: 'Kind words, team icon' },
  { id: 'piece', name: 'Piece', shape: 'Puzzle piece', color: ND.green, use: 'Match and sort games' },
  { id: 'puff', name: 'Puff', shape: 'Cloud', color: '#9fc2ff', use: 'Answer target, Calm' },
  { id: 'archie', name: 'Archie', shape: 'Arch', color: ND.violet, use: 'Board frames' },
  { id: 'ray', name: 'Ray', shape: 'Sunburst', color: ND.yellow, use: 'Big moments, power-up' },
  { id: 'wiggle', name: 'Wiggle', shape: 'Wavy M', color: ND.cobalt, use: 'Team icon, word games' },
  { id: 'pebble', name: 'Pebble', shape: 'Soft square', color: ND.tangerine, use: 'Board token, tiles' },
  { id: 'zip', name: 'Zip', shape: 'Lightning bolt', color: ND.cobalt, use: 'Power-ups' },
];

export function Buddy({ id, size = 96, color, limbs = false, title }: { id: BuddyId; size?: number; color?: string; limbs?: boolean; title?: string }) {
  const c = color ?? BUDDIES.find((b) => b.id === id)!.color;
  const dark = c === ND.cobalt || c === ND.violet || c === ND.cobaltDeep;
  const fc = dark ? '#ffffff' : ND.ink;
  const ch = dark ? '#ffffff55' : '#ffffff88';
  let body: ReactNode;
  switch (id) {
    case 'sunny':
      body = (<>
        {Array.from({ length: 7 }, (_, i) => { const a = (i / 7) * Math.PI * 2 - Math.PI / 2; return <circle key={i} cx={60 + 27 * Math.cos(a)} cy={54 + 27 * Math.sin(a)} r="19" fill={c} />; })}
        <circle cx="60" cy="54" r="28" fill={c} />
        <Face x={60} y={54} s={0.9} color={fc} cheeks={ND.tangerine + '88'} />
      </>);
      break;
    case 'twinkle':
      body = (<><polygon points={star(60, 62, 46, 22, 5)} fill={c} stroke={c} strokeWidth="12" strokeLinejoin="round" /><Face x={60} y={64} s={0.85} color={fc} cheeks={ch} /></>);
      break;
    case 'bloop':
      body = (<><path d="M60 14 C88 12 106 34 104 60 C102 88 84 106 58 104 C30 102 14 84 16 58 C18 32 34 16 60 14 Z" fill={c} /><Face x={60} y={58} color={fc} happy cheeks={ch} /></>);
      break;
    case 'asta':
      body = (<>{[0, 60, 120].map((r) => <rect key={r} x="48" y="10" width="24" height="100" rx="12" fill={c} transform={`rotate(${r} 60 60)`} />)}<circle cx="60" cy="60" r="22" fill={c} /><Face x={60} y={60} s={0.8} color={fc} cheeks={ch} /></>);
      break;
    case 'hartie':
      body = (<><path d="M60 104 C30 84 12 66 14 44 C16 26 30 18 42 18 C52 18 58 26 60 32 C62 26 68 18 78 18 C90 18 104 26 106 44 C108 66 90 84 60 104 Z" fill={c} /><Face x={60} y={52} color={fc} happy cheeks={ch} /></>);
      break;
    case 'piece':
      body = (<><rect x="22" y="34" width="68" height="68" rx="12" fill={c} /><circle cx="56" cy="30" r="14" fill={c} /><circle cx="94" cy="68" r="14" fill={c} /><Face x={56} y={70} color={fc} cheeks={ch} /></>);
      break;
    case 'puff':
      body = (<><circle cx="40" cy="66" r="24" fill={c} /><circle cx="64" cy="50" r="30" fill={c} /><circle cx="86" cy="68" r="22" fill={c} /><rect x="30" y="64" width="64" height="26" rx="13" fill={c} /><Face x={62} y={66} color={fc} happy cheeks={ch} /></>);
      break;
    case 'archie':
      body = (<><path d="M30 100 V62 a30 30 0 0 1 60 0 V100" stroke={c} strokeWidth="30" fill="none" strokeLinecap="round" /><Face x={60} y={42} s={0.8} color={fc} cheeks={ch} /></>);
      break;
    case 'ray':
      body = (<><polygon points={star(60, 60, 52, 38, 14)} fill={c} stroke={c} strokeWidth="5" strokeLinejoin="round" /><Face x={60} y={60} color={fc} cheeks={ND.tangerine + '77'} /></>);
      break;
    case 'wiggle':
      body = (<><path d="M16 98 V56 C16 26 46 26 46 52 C46 30 74 30 74 52 C74 26 104 26 104 56 V98 Z" fill={c} stroke={c} strokeWidth="10" strokeLinejoin="round" /><Face x={60} y={74} s={0.9} color={fc} cheeks={ch} /></>);
      break;
    case 'pebble':
      body = (<><rect x="16" y="20" width="88" height="82" rx="30" fill={c} transform="rotate(-5 60 60)" /><Face x={60} y={60} color={fc} happy cheeks={ch} /></>);
      break;
    case 'zip':
      body = (<><polygon points="68,8 26,66 56,66 46,112 94,46 62,46 76,8" fill={c} stroke={c} strokeWidth="8" strokeLinejoin="round" /><Face x={60} y={56} s={0.75} color={fc} cheeks={null} /></>);
      break;
  }
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true} overflow="visible">
      {body}
      {limbs && (
        <g stroke="#ffffff" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M50 92 L46 114 L38 116" /><path d="M70 92 L74 114 L82 116" />
          <path d="M30 70 L14 82 L10 74" />
          <path d="M90 66 L106 54" /><path d="M106 54 L106 44" /><path d="M104 56 h8 M104 61 h7" />
        </g>
      )}
    </svg>
  );
}

// ---------- Doodles ----------
function Sparkle({ x, y, s = 1, c }: { x: number; y: number; s?: number; c: string }) {
  return <path transform={`translate(${x} ${y}) scale(${s})`} d="M0 -10 C1.5 -2 2 -1.5 10 0 C2 1.5 1.5 2 0 10 C-1.5 2 -2 1.5 -10 0 C-2 -1.5 -1.5 -2 0 -10 Z" fill={c} />;
}
// The Buddy sheet: tiny buddies and sparkles on an even offset grid.
function BuddySheet({ className = '' }: { className?: string }) {
  const ids: BuddyId[] = ['bloop', 'hartie', 'asta', 'twinkle', 'puff', 'pebble'];
  return (
    <svg className={className} width="100%" height="100%" aria-hidden="true">
      <defs>
        <pattern id="nd-sheet" width="160" height="140" patternUnits="userSpaceOnUse">
          <g transform="translate(14 12)"><Buddy id={ids[0]} size={38} /></g>
          <g transform="translate(94 12)"><Buddy id={ids[1]} size={38} /></g>
          <g transform="translate(54 80)"><Buddy id={ids[2]} size={38} /></g>
          <g transform="translate(134 80)"><Buddy id={ids[3]} size={38} /></g>
          <g transform="translate(-26 80)"><Buddy id={ids[3]} size={38} /></g>
          <Sparkle x={72} y={34} s={0.7} c={ND.cobalt} />
          <Sparkle x={150} y={128} s={0.6} c={ND.pink} />
          <circle cx="30" cy="124" r="3.5" fill={ND.green} />
          <circle cx="120" cy="62" r="3" fill={ND.tangerine} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#nd-sheet)" />
    </svg>
  );
}
function Doodles() {
  return (
    <svg viewBox="0 0 240 120" className="w-full h-full" aria-hidden="true">
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
// flat buddies. Photos here are neutral placeholders, clearly marked. ----------
function Grain() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none mix-blend-multiply opacity-[0.18]" aria-hidden="true">
      <filter id="nd-grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" /><feColorMatrix values="0 0 0 0 0.11  0 0 0 0 0.1  0 0 0 0 0.2  0 0 0 0.55 0" /></filter>
      <rect width="100%" height="100%" filter="url(#nd-grain)" />
    </svg>
  );
}
function Tape({ className = '', color = '#ffd52ecc', rotate = -6 }: { className?: string; color?: string; rotate?: number }) {
  return <span aria-hidden="true" className={`absolute h-6 w-20 ${className}`} style={{ background: color, transform: `rotate(${rotate}deg)`, clipPath: 'polygon(3% 0, 97% 4%, 100% 50%, 96% 100%, 2% 96%, 0 50%)' }} />;
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
function LoopSticker({ id, color, still, label }: { id: BuddyId; color?: string; still: boolean; label: string }) {
  return (
    <div className="grid justify-items-center gap-1">
      <motion.span className="block rounded-full p-2" style={{ background: '#ffffff' }}
        animate={still ? undefined : { y: [0, -14, 0, 0], scaleY: [1, 1.06, 0.9, 1], rotate: [0, -4, 3, 0] }}
        transition={still ? undefined : { duration: 1.4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.4 }}>
        <Buddy id={id} size={72} color={color} />
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
            <div className="relative"><Tape className="-top-3 left-6 z-10" /><PhotoSticker label="Clay board pieces" rotate={-4}><Buddy id="pebble" size={64} color="#d98a5f" /></PhotoSticker></div>
            <div className="relative mt-6"><Tape className="-top-3 left-8 z-10" color="#ec6fa8cc" rotate={4} /><PhotoSticker label="Felt and fabric theme" rotate={3}><Buddy id="hartie" size={64} color="#c95f7d" /></PhotoSticker></div>
            <div className="relative"><Tape className="-top-3 left-4 z-10" color="#3fd0b6cc" rotate={-2} /><PhotoSticker label="Crayon drawing theme" rotate={-2}><Buddy id="sunny" size={64} /></PhotoSticker></div>
          </div>
          <HandNote text="handmade!" color={ND.yellow} className="right-6 top-6" />
        </div>
        {/* A theme card as a scrapbook page */}
        <div className="relative rounded-[1.75rem] overflow-hidden p-5 min-h-[22rem]" style={{ background: 'repeating-linear-gradient(0deg, #fffaf0 0 26px, #e6eeff 26px 28px)' }}>
          <Grain />
          <span className="absolute left-0 top-0 bottom-0 w-6" style={{ background: 'repeating-conic-gradient(#ec6fa8 0 25%, #fffaf0 0 50%) 0 0 / 12px 12px' }} aria-hidden="true" />
          <div className="relative pl-6 grid gap-3">
            <div className="flex items-center gap-2"><span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: ND.green, color: ND.ink }}>Theme</span><span className="font-heading font-bold">Paper Garden</span></div>
            <div className="relative max-w-[24rem]"><Tape className="-top-3 right-8 z-10" rotate={8} /><PhotoSticker label="Cut paper flowers, glued and photographed" rotate={2}><div className="flex gap-1"><Buddy id="sunny" size={52} color={ND.pink} /><Buddy id="sunny" size={52} /></div></PhotoSticker></div>
            <p className="text-sm font-semibold" style={{ color: ND.quiet }}>For board games. 12 pieces. Made by a class.</p>
          </div>
          <HandNote text="our flowers" className="right-4 bottom-4" />
        </div>
      </div>
      <div className="rounded-[1.5rem] p-4 flex flex-wrap items-end justify-around gap-4" style={{ background: ND.paper }}>
        <LoopSticker id="twinkle" still={still} label="Right answer loop" />
        <LoopSticker id="ray" still={still} label="Big moment loop" />
        <LoopSticker id="zip" still={still} label="Power-up loop" />
        <LoopSticker id="bloop" still={still} label="Waiting loop" />
        <p className="text-xs font-semibold max-w-[16rem]" style={{ color: ND.quiet }}>GIF-style sticker loops: lively by default. Calm mode and the GIFs setting (Moving or Still pictures) hold them still. No flashing 3 or more times a second, no full-screen strobes.</p>
      </div>
    </div>
  );
}

const WORD = 'Gamify';
const WORD_COLORS = [ND.cobalt, ND.pink, ND.green, ND.tangerine, ND.violet, ND.cobalt];
function Wordmark({ size = '2.5rem' }: { size?: string }) {
  return <span className="leading-none" style={{ ...GY, fontSize: size }} aria-label="Gamify">{WORD.split('').map((l, i) => <span key={i} aria-hidden="true" style={{ color: WORD_COLORS[i] }}>{l}</span>)}</span>;
}
function GMark({ size = 72 }: { size?: number }) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} aria-hidden="true">
      <path d="M96 40 A42 42 0 1 0 102 66 H64" stroke={ND.cobalt} strokeWidth="26" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Face x={19} y={60} s={0.5} color="#ffffff" cheeks={null} />
    </svg>
  );
}
function Seal({ size = 120 }: { size?: number }) {
  return (
    <svg viewBox="0 0 160 160" width={size} height={size} aria-hidden="true">
      <circle cx="80" cy="80" r="76" fill={ND.pink} />
      <defs><path id="nd-seal" d="M80 80 m-56 0 a56 56 0 1 1 112 0 a56 56 0 1 1 -112 0" /></defs>
      <text fontFamily="var(--font-heading)" fontWeight="700" fontSize="15" letterSpacing="3" fill={ND.ink}><textPath href="#nd-seal">PLAY TO LEARN * GAMIFY * PLAY TO LEARN *</textPath></text>
      <g transform="translate(46 46) scale(0.57)"><GMarkPaths /></g>
    </svg>
  );
}
function GMarkPaths() {
  return <><path d="M96 40 A42 42 0 1 0 102 66 H64" stroke={ND.cobalt} strokeWidth="26" fill="none" strokeLinecap="round" strokeLinejoin="round" /><Face x={19} y={60} s={0.5} color="#ffffff" cheeks={null} /></>;
}

const DONTS: [string, string][] = [
  ['Cream ground; pink, cobalt and green blocks lead', 'Yellow ground with purple type and purple buttons'],
  ['Solid flat headline letters, no outline, no shadow', 'Outlined headline text with an offset drop shadow'],
  ['Flat buddies with dot eyes and white line-art limbs', 'Black-outlined, googly-eyed cartoon animals and "WOW" bursts'],
  ['A tidy Buddy sheet at the edges', 'Scattered confetti dashes and worm squiggles as the main texture'],
  ['Our own mark: the G buddy, seal and wordmark', 'A bubbly outlined logo with a smiley in a letter'],
];

export default function NewDirection() {
  const { settings } = useSettings();
  const still = settings.motion === 'still';
  const [picked, setPicked] = useState<number | null>(null);
  const wiggle = still ? undefined : { rotate: [0, -8, 6, -3, 0], scale: [1, 1.08, 1] };
  return (
    <div className="rounded-[2rem] p-5 sm:p-8 grid gap-10" style={{ background: ND.cream, color: ND.ink }}>
      <p className="font-semibold max-w-prose" style={{ color: ND.quiet }}>
        A proposal from your moodboards (2026-11-23): flat joyful shapes, no outlines on art, cream ground, and a set of Gamify buddies. Nothing on the site uses this yet. Full rules are in the Brand Kit doc tab "Direction: playful flat shapes".
      </p>

      {/* Mock hero for the home page */}
      <Block title="Home page hero (mockup)" note="Real layout widths. Cream page, one color-block collage, a solid headline with no outline or shadow.">
        <div className="rounded-[2rem] overflow-hidden" style={{ background: ND.paper }}>
          <nav className="flex items-center gap-4 px-6 py-4">
            <GMark size={44} /><Wordmark size="2rem" />
            <span className="ml-auto hidden sm:flex gap-5 font-bold" style={{ color: ND.ink }}><span>Games</span><span>Blog</span><span>Pricing</span></span>
            <NDButton bg={ND.paper} fg={ND.ink}>Sign in</NDButton>
          </nav>
          <div className="grid wide:grid-cols-[1.05fr_1fr] gap-8 px-6 sm:px-10 pb-10 pt-4 items-center">
            <div className="grid gap-5 content-center">
              <h3 className="leading-[1.02] text-[clamp(2.6rem,5.2vw,4.6rem)]" style={{ ...GY, color: ND.ink }}>
                Any lesson, <span style={{ color: ND.cobaltDeep }}>a game</span> your class will cheer for
              </h3>
              <svg viewBox="0 0 220 16" className="w-56 -mt-3" aria-hidden="true"><path d="M4 10 q14 -10 28 0 t28 0 t28 0 t28 0 t28 0 t28 0 t28 0" stroke={ND.pink} strokeWidth="5" fill="none" strokeLinecap="round" /></svg>
              <p className="text-lg max-w-[34rem]" style={{ color: ND.quiet }}>Bring your own questions. Pick a game. Kids join with a code and play on any screen.</p>
              <div className="flex flex-wrap gap-3">
                <NDButton bg={ND.cobalt} fg="#ffffff" big><Play weight="fill" size={22} />Start an Activity</NDButton>
                <NDButton bg={ND.paper} fg={ND.ink} big>Join with a code</NDButton>
              </div>
            </div>
            <div className="grid grid-cols-2 grid-rows-2 gap-3 aspect-[1.1] w-full max-w-[32rem] justify-self-center">
              <div className="rounded-[1.75rem] grid place-items-center relative" style={{ background: ND.pink }}><Buddy id="sunny" size={150} limbs title="Sunny, the Gamify flower buddy" /></div>
              <div className="rounded-[1.75rem] grid place-items-center" style={{ background: ND.cobalt }}><Buddy id="twinkle" size={110} color={ND.yellow} /></div>
              <div className="rounded-[1.75rem] grid place-items-center" style={{ background: ND.green }}><Buddy id="puff" size={120} color={ND.paper} /></div>
              <div className="rounded-[1.75rem] grid place-items-center relative overflow-hidden" style={{ background: ND.cream }}>
                <div className="absolute inset-x-0 top-0 h-1/2"><Doodles /></div>
                <span className="mt-16"><Buddy id="hartie" size={96} /></span>
              </div>
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

      <Block title="The Gamify buddies" note="Twelve flat shapes, no outlines. Two dot eyes or happy eyes, a small smile, rosy cheeks. No googly eyes, tongues or teeth. Point at one to see it wiggle.">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] gap-3">
          {BUDDIES.map((b, i) => (
            <motion.button key={b.id} type="button" onClick={() => setPicked(i)} whileHover={wiggle} transition={{ duration: 0.5 }}
              className="rounded-[1.5rem] p-3 grid justify-items-center gap-1 text-center" style={{ background: picked === i ? ND.paper : '#ffffff80' }} aria-pressed={picked === i}>
              <Buddy id={b.id} size={84} title={`${b.name}, ${b.shape}`} />
              <span className="font-heading font-bold">{b.name}</span>
              <span className="text-xs font-semibold" style={{ color: ND.quiet }}>{b.shape}: {b.use}</span>
            </motion.button>
          ))}
        </div>
      </Block>

      <Block title="Logo system" note="Gamify's own mark: the G buddy, a round seal and the wordmark. Multicolor letters only in the logo.">
        <div className="flex flex-wrap items-center gap-6 rounded-[1.5rem] p-6" style={{ background: ND.paper }}>
          <GMark size={96} />
          <Seal size={128} />
          <div className="grid justify-items-center gap-1"><GMark size={64} /><Wordmark size="2.25rem" /></div>
          <div className="rounded-[1.5rem] px-6 py-4" style={{ background: ND.cobalt }}><span className="text-4xl" style={{ ...GY, color: '#ffffff' }}>Gamify</span></div>
        </div>
      </Block>

      <Block title="Patterns and doodles" note="The Buddy sheet is the main texture, at the edges only. Doodles: sparkles, a swirl, an arrow, dots. One squiggle may underline a word.">
        <div className="grid sm:grid-cols-[2fr_1fr] gap-4">
          <div className="rounded-[1.5rem] h-48 overflow-hidden" style={{ background: ND.cream, boxShadow: `inset 0 0 0 2px ${ND.paper}` }}><BuddySheet /></div>
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
            {[['Cosmic Waffle', 'wiggle', 12, ND.cobalt], ['Wiggly Penguin', 'hartie', 9, ND.coral], ['Turbo Unicorn', 'piece', 15, ND.green]].map(([n, id, s, c], i) => (
              <div key={n as string} className="flex items-center gap-3 rounded-[1.25rem] px-3 py-2" style={{ background: i === 0 ? ND.cream : 'transparent', boxShadow: i === 0 ? `inset 0 0 0 2px ${ND.cobalt}` : undefined }}>
                <Buddy id={id as BuddyId} size={40} color={c as string} />
                <span className="font-bold flex-1">{n as string}</span>
                <span className="text-3xl tabular-nums" style={GY}>{s as number}</span>
              </div>
            ))}
            <span className="text-xs font-semibold" style={{ color: ND.quiet }}>Ring shows whose turn it is.</span>
          </div>
          <div className="grid gap-3">
            <div className="rounded-[1.75rem] p-5 text-center font-heading font-bold text-[clamp(1.4rem,3vw,2.2rem)]" style={{ background: ND.paper }}>Which word starts with a capital letter?</div>
            <div className="grid grid-cols-2 gap-3">
              {([['hartie', ND.pink, 'Monday'], ['twinkle', ND.yellow, 'apple'], ['pebble', ND.green, 'blue'], ['puff', ND.mint, 'run']] as [BuddyId, string, string][]).map(([id, bg, w]) => (
                <button key={w} type="button" className="min-h-20 rounded-[1.25rem] flex items-center gap-3 px-4 font-bold text-2xl motion-safe:hover:-translate-y-0.5 motion-safe:transition-transform"
                  style={{ background: bg, color: ND.ink, border: `2px solid ${ND.ink}`, boxShadow: `0 4px 0 ${shade(bg) === ND.ink ? '#2aa58f' : shade(bg)}` }}>
                  <Buddy id={id} size={44} color={ND.paper} />{w}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-3">
          {([['Board games', ND.pink, 'sunny', ND.yellow], ['Word games', ND.cobalt, 'wiggle', ND.yellow], ['Arcade', ND.green, 'zip', ND.paper]] as [string, string, BuddyId, string][]).map(([t, bg, id, bc]) => (
            <div key={t} className="rounded-[1.75rem] p-5 pr-20 min-h-40 grid content-between relative overflow-hidden" style={{ background: bg }}>
              <span className="text-3xl" style={{ ...GY, color: bg === ND.cobalt ? '#ffffff' : ND.ink }}>{t}</span>
              <span className="flex items-center gap-1 font-bold" style={{ color: bg === ND.cobalt ? '#ffffff' : ND.ink }}><Star weight="fill" size={18} />Classic theme family</span>
              <span className="absolute right-3 top-3"><Buddy id={id} size={64} color={bc} /></span>
            </div>
          ))}
        </div>
      </Block>

      <Block title="Mixed media layer" note="Photo stickers with white edges, torn paper, tape, hand-lettered notes and soft grain on top of the flat buddies. The star is the themes teachers and kids make by hand. Photos below are placeholders; only owned, licensed or permission-given photos ever ship. Teacher search: GIFs from GIPHY (Powered by GIPHY) and photos from Unsplash (with credit), pending the GIPHY production key and attorney review.">
        <MixedMedia still={still || settings.gifs === 'still'} />
      </Block>

      <Block title="Classic game board (sketch)" note="The board zone stays Paper; only the frame wears a color block and a strip of the Buddy sheet. Pieces are buddies.">
        <div className="rounded-[1.75rem] p-4 sm:p-6 grid gap-3 relative overflow-hidden" style={{ background: ND.pink }}>
          <div className="absolute inset-x-0 top-0 h-14 opacity-90"><BuddySheet /></div>
          <div className="relative rounded-[1.5rem] p-4 grid grid-cols-6 gap-2 mt-10" style={{ background: ND.paper }}>
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i} className="aspect-square rounded-[0.9rem] grid place-items-center" style={{ background: [ND.cream, '#ffe9f2', '#e6eeff', '#e3f6ea'][i % 4], border: `2px solid ${ND.ink}` }}>
                {i === 2 && <Buddy id="wiggle" size={46} />}
                {i === 7 && <Buddy id="hartie" size={46} />}
                {i === 11 && <Buddy id="ray" size={52} />}
              </div>
            ))}
          </div>
        </div>
      </Block>
    </div>
  );
}
