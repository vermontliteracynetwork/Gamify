import type { CSSProperties, ReactNode } from 'react';

// The handmade paper kit (proposal, teacher 2026-11-23:
// "modern, simplistic in function ... playful, scrapbook, mixed media").
// Clean core, handmade edges: these pieces dress frames, covers, celebrations
// and the gallery, never the question card, answer tiles or buttons.
// Every drawing is original, made in code. The shape buddies were removed
// (teacher, 2026-11-23: no characters); power-ups live in CrayonKit.tsx.

export const ND = {
  cream: '#f6f0e4', paper: '#fffaf0', ink: '#1d1a33', quiet: '#57506e',
  pink: '#ec6fa8', cobalt: '#1f5fff', green: '#12a150', yellow: '#ffd52e', tangerine: '#ff6a1a',
  violet: '#8b5cf6', mint: '#3fd0b6', coral: '#f0524f',
  cobaltDeep: '#1748c9', pinkDeep: '#b3236a', violetDeep: '#6233d6', greenDeep: '#0b7a3c', tangDeep: '#b84300',
};

export function star(cx: number, cy: number, outer: number, inner: number, points: number, rot = -90) {
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 ? inner : outer;
    const a = ((rot + (i * 180) / points) * Math.PI) / 180;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(' ');
}

// ---------- The handmade paper kit (filters) ----------
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
          <feColorMatrix in="strokes" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0.9 0 0 0 -0.55" result="light" />
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
          <feColorMatrix in="wax" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  4 0 0 0 -0.4" result="mask" />
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

// Washi tape is retired (teacher, 2026-11-23: "the attatched tape, multilayer
// card is an example of something i do not like and need immediately removed").
// Kept as a no-op so older mockups still build; it draws nothing.
export function Washi(_props: { className?: string; color?: string; rotate?: number; w?: string }) {
  return null;
}

// Crayon doodles: sparkles, a swirl, an arrow and dots, drawn in wax.
export function CrayonSparkle({ x, y, s = 1, c }: { x: number; y: number; s?: number; c: string }) {
  return <path transform={`translate(${x} ${y}) scale(${s})`} d="M0 -12 L0 12 M-12 0 L12 0 M-7 -7 L7 7 M-7 7 L7 -7" stroke={c} strokeWidth="3.5" strokeLinecap="round" fill="none" />;
}

// ---------- The Gamify logo (teacher, 2026-11-23: "keep the main g as the logo
// and the grow year font"). The existing files only, never redrawn:
// /brand/gamify-mark.png (the G joystick) and /brand/gamify-wordmark.png.
// tone 'white' recolors the same file for dark blocks (as the site already
// does with a mask); sticker adds a white die-cut edge around the same mark.
export function LogoMark({ h = 64, tone, sticker = false }: { h?: number; tone?: 'white'; sticker?: boolean }) {
  const w = (h * 378) / 512;
  if (tone === 'white') return <span role="img" aria-label="Gamify" className="inline-block shrink-0" style={{ width: w, height: h, background: '#ffffff', WebkitMask: 'url(/brand/gamify-mark.png) center / contain no-repeat', mask: 'url(/brand/gamify-mark.png) center / contain no-repeat' }} />;
  return <img src="/brand/gamify-mark.png" alt="Gamify" width={w} height={h} draggable={false} className="shrink-0"
    style={sticker ? { filter: 'drop-shadow(3px 0 0 #fff) drop-shadow(-3px 0 0 #fff) drop-shadow(0 3px 0 #fff) drop-shadow(0 -3px 0 #fff) drop-shadow(0 3px 4px rgba(29,26,51,0.25))' } : undefined} />;
}
export function LogoWord({ h = 36, tone }: { h?: number; tone?: 'white' }) {
  const w = (h * 821) / 273;
  if (tone === 'white') return <span role="img" aria-label="Gamify" className="inline-block shrink-0" style={{ width: w, height: h, background: '#ffffff', WebkitMask: 'url(/brand/gamify-wordmark.png) center / contain no-repeat', mask: 'url(/brand/gamify-wordmark.png) center / contain no-repeat' }} />;
  return <img src="/brand/gamify-wordmark.png" alt="Gamify" width={w} height={h} draggable={false} className="shrink-0" />;
}
