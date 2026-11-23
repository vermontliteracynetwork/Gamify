import type { CSSProperties, ReactNode } from 'react';

// The Gamify buddies and the handmade paper kit (proposal, teacher 2026-11-23:
// "modern, simplistic in function ... playful, scrapbook, mixed media").
// Clean core, handmade edges: these pieces dress frames, covers, celebrations
// and the gallery, never the question card, answer tiles or buttons.
// Every drawing is original, made in code.

export const ND = {
  cream: '#f6f0e4', paper: '#fffaf0', ink: '#1d1a33', quiet: '#57506e',
  pink: '#ec6fa8', cobalt: '#1f5fff', green: '#12a150', yellow: '#ffd52e', tangerine: '#ff6a1a',
  violet: '#8b5cf6', mint: '#3fd0b6', coral: '#f0524f',
  cobaltDeep: '#1748c9', pinkDeep: '#b3236a', violetDeep: '#6233d6', greenDeep: '#0b7a3c', tangDeep: '#b84300',
};

// ---------- Faces: two dot eyes (or happy ^^), a small smile, rosy cheeks. ----------
export function Face({ x, y, s = 1, color = ND.ink, happy = false, cheeks = '#ffffff66' }: { x: number; y: number; s?: number; color?: string; happy?: boolean; cheeks?: string | null }) {
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

export function star(cx: number, cy: number, outer: number, inner: number, points: number, rot = -90) {
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 ? inner : outer;
    const a = ((rot + (i * 180) / points) * Math.PI) / 180;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(' ');
}

// ---------- The Gamify buddies: 12 flat shapes, no outlines. ----------
export type BuddyId = 'sunny' | 'twinkle' | 'bloop' | 'asta' | 'hartie' | 'piece' | 'puff' | 'archie' | 'ray' | 'wiggle' | 'pebble' | 'zip';
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

// paper (default): Classic is made by hand (2026-11-23), so each buddy is a cut
// construction-paper shape: uneven edge, paper grain, a soft lift. Needs <PaperDefs /> on the page.
export function Buddy({ id, size = 96, color, limbs = false, title, paper = true, look, sticker = false }: { id: BuddyId; size?: number; color?: string; limbs?: boolean; title?: string; paper?: boolean; look?: 'pencil'; sticker?: boolean }) {
  // look 'pencil': colored-pencil grain in the fill; sticker: a white die-cut edge.
  const fx = look === 'pencil' ? 'url(#nd-pencil)' : paper ? 'url(#nd-paper)' : undefined;
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
      <g filter={sticker ? 'url(#nd-sticker)' : undefined}><g filter={fx}>{body}</g></g>
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
// ---------- The paper kit ----------
// One hidden <svg> of filters, rendered once per page (not display:none, so
// the filters keep working). nd-paper: a cut construction-paper edge (a gentle
// warp), paper fibre specks and a soft lift. nd-paper-flat: the same without
// the lift. nd-crayon: waxy, broken crayon strokes. nd-clay: lumpy clay.
export function PaperDefs() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
      <defs>
        <filter id="nd-paper" x="-8%" y="-8%" width="116%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="3" result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="5" xChannelSelector="R" yChannelSelector="G" result="cut" />
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="9" result="fibre" />
          <feColorMatrix in="fibre" type="matrix" values="0 0 0 0 0.11  0 0 0 0 0.1  0 0 0 0 0.2  0.5 0 0 0 -0.17" result="specks" />
          <feComposite in="specks" in2="cut" operator="in" result="grain" />
          <feMerge result="sheet"><feMergeNode in="cut" /><feMergeNode in="grain" /></feMerge>
          <feDropShadow in="sheet" dx="0" dy="2" stdDeviation="1.4" floodColor="#1d1a33" floodOpacity="0.2" />
        </filter>
        <filter id="nd-paper-flat" x="-4%" y="-4%" width="108%" height="108%">
          <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="5" result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="6" xChannelSelector="R" yChannelSelector="G" result="cut" />
          <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="2" seed="4" result="fibre" />
          <feColorMatrix in="fibre" type="matrix" values="0 0 0 0 0.11  0 0 0 0 0.1  0 0 0 0 0.2  0.45 0 0 0 -0.16" result="specks" />
          <feComposite in="specks" in2="cut" operator="in" result="grain" />
          <feMerge><feMergeNode in="cut" /><feMergeNode in="grain" /></feMerge>
        </filter>
        <filter id="nd-pencil" x="-8%" y="-8%" width="116%" height="116%">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="11" result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="3.5" xChannelSelector="R" yChannelSelector="G" result="shape" />
          <feTurbulence type="fractalNoise" baseFrequency="0.9 0.22" numOctaves="2" seed="5" result="strokes" />
          <feColorMatrix in="strokes" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  1.7 0 0 0 -0.78" result="light" />
          <feComposite in="light" in2="shape" operator="in" result="hl" />
          <feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="1" seed="21" result="tooth" />
          <feColorMatrix in="tooth" type="matrix" values="0 0 0 0 0.11  0 0 0 0 0.1  0 0 0 0 0.2  0.55 0 0 0 -0.2" result="dk" />
          <feComposite in="dk" in2="shape" operator="in" result="grain" />
          <feMerge><feMergeNode in="shape" /><feMergeNode in="hl" /><feMergeNode in="grain" /></feMerge>
        </filter>
        <filter id="nd-sticker" x="-15%" y="-15%" width="130%" height="135%">
          <feMorphology in="SourceAlpha" operator="dilate" radius="5" result="fat" />
          <feFlood floodColor="#ffffff" />
          <feComposite in2="fat" operator="in" result="edge" />
          <feDropShadow in="edge" dx="0" dy="2.5" stdDeviation="2" floodColor="#1d1a33" floodOpacity="0.22" result="lifted" />
          <feMerge><feMergeNode in="lifted" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="nd-crayon" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="1" seed="2" result="wob" />
          <feDisplacementMap in="SourceGraphic" in2="wob" scale="2.5" xChannelSelector="R" yChannelSelector="G" result="line" />
          <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="1" seed="6" result="wax" />
          <feColorMatrix in="wax" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.6 0 0 0 -0.6" result="mask" />
          <feComposite in="line" in2="mask" operator="in" />
        </filter>
        <filter id="nd-clay" x="-15%" y="-15%" width="130%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="8" result="lump" />
          <feDisplacementMap in="SourceGraphic" in2="lump" scale="7" xChannelSelector="R" yChannelSelector="G" result="ball" />
          <feTurbulence type="turbulence" baseFrequency="0.5" numOctaves="1" seed="12" result="prints" />
          <feColorMatrix in="prints" type="matrix" values="0 0 0 0 0.1  0 0 0 0 0.05  0 0 0 0 0.05  0.35 0 0 0 -0.08" result="marks" />
          <feComposite in="marks" in2="ball" operator="in" result="tex" />
          <feMerge result="clay"><feMergeNode in="ball" /><feMergeNode in="tex" /></feMerge>
          <feDropShadow in="clay" dx="0" dy="3" stdDeviation="2" floodColor="#1d1a33" floodOpacity="0.28" />
        </filter>
      </defs>
    </svg>
  );
}

// A cut-paper sheet behind any content: the shape is cut and grainy, the
// content on top stays crisp (text is never run through the filter).
export function Paper({ color, children, className = '', rx = 22, tilt = 0, lift = true, style }: { color: string; children?: ReactNode; className?: string; rx?: number; tilt?: number; lift?: boolean; style?: CSSProperties }) {
  return (
    <div className={`${/\babsolute\b/.test(className) ? '' : 'relative '}${className}`} style={{ transform: tilt ? `rotate(${tilt}deg)` : undefined, ...style }}>
      <svg className="absolute inset-[3px] w-[calc(100%-6px)] h-[calc(100%-6px)]" overflow="visible" aria-hidden="true">
        <rect width="100%" height="100%" rx={rx} fill={color} filter={lift ? 'url(#nd-paper)' : 'url(#nd-paper-flat)'} />
      </svg>
      <div className="relative h-full">{children}</div>
    </div>
  );
}

// Washi tape: see-through, faint stripes, zigzag torn ends.
export function Washi({ className = '', color = '#ffd52e', rotate = -6, w = '5rem' }: { className?: string; color?: string; rotate?: number; w?: string }) {
  return (
    <span aria-hidden="true" className={`absolute h-6 pointer-events-none ${className}`}
      style={{ width: w, opacity: 0.82, transform: `rotate(${rotate}deg)`, background: `repeating-linear-gradient(90deg, ${color} 0 7px, color-mix(in srgb, ${color} 70%, white) 7px 11px)`,
        clipPath: 'polygon(0 0, 4% 12%, 0 25%, 4% 38%, 0 50%, 4% 62%, 0 75%, 4% 88%, 0 100%, 100% 100%, 96% 88%, 100% 75%, 96% 62%, 100% 50%, 96% 38%, 100% 25%, 96% 12%, 100% 0)' }} />
  );
}

// Crayon doodles: sparkles, a swirl, an arrow and dots, drawn in wax.
export function CrayonSparkle({ x, y, s = 1, c }: { x: number; y: number; s?: number; c: string }) {
  return <path transform={`translate(${x} ${y}) scale(${s})`} d="M0 -12 L0 12 M-12 0 L12 0 M-7 -7 L7 7 M-7 7 L7 -7" stroke={c} strokeWidth="3.5" strokeLinecap="round" fill="none" />;
}
