import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Broadcast, CornersOut, GearSix, PersonArmsSpread, Play, Television, User, X, type Icon } from '@phosphor-icons/react';
import { PP } from './PaletteProposal';

// Shared parts for the Brand page mockups (PROPOSAL, 2026-11-23): the team
// set, the one turn glow, the site's purple ground and the game theme backs.
// Universal views and Game mockups both import from here.

const I = PP.ink;

// Shape plus color for every team, so color is never the only cue (WCAG 1.4.1).
export const TEAMS = [
  { name: 'Team Purple', color: PP.periwinkle, shape: 'circle', text: I, soft: PP.gamify },
  { name: 'Team Sky', color: PP.sky, shape: 'star', text: I, soft: PP.blueCrystal },
  { name: 'Team Pink', color: PP.pink, shape: 'triangle', text: I, soft: PP.blush },
  { name: 'Team Lemon', color: PP.lemon, shape: 'square', text: I, soft: PP.butter },
] as const;
// Four more for the Teams step, up to eight teams (teacher, 2026-11-24).
export const MORE_TEAMS = [
  { name: 'Team Green', color: PP.kelly, shape: 'diamond', text: I, soft: PP.mint },
  { name: 'Team Orange', color: PP.orange, shape: 'hexagon', text: I, soft: PP.peach },
  { name: 'Team Teal', color: PP.teal, shape: 'heart', text: I, soft: PP.aqua },
  { name: 'Team Lime', color: PP.lime, shape: 'pentagon', text: I, soft: PP.sage },
] as const;
export type Team = { name: string; color: string; shape: string; text: string; soft: string };
export function Badge({ t, size = 40 }: { t: Team; size?: number }) {
  const d = t.shape === 'circle' ? <circle cx="20" cy="20" r="16" /> : t.shape === 'star'
    ? <path d="M20 3 L25 15 L38 15 L27.5 23 L31.5 36 L20 28 L8.5 36 L12.5 23 L2 15 L15 15 Z" />
    : t.shape === 'triangle' ? <path d="M20 4 L37 35 L3 35 Z" />
    : t.shape === 'diamond' ? <path d="M20 2 L37 20 L20 38 L3 20 Z" />
    : t.shape === 'hexagon' ? <path d="M11 4 L29 4 L38 20 L29 36 L11 36 L2 20 Z" />
    : t.shape === 'heart' ? <path d="M20 35 C6 25 2 18 4 12 C6 5 15 4 20 11 C25 4 34 5 36 12 C38 18 34 25 20 35 Z" />
    : t.shape === 'pentagon' ? <path d="M20 3 L37 15 L31 36 L9 36 L3 15 Z" />
    : <rect x="5" y="5" width="30" height="30" rx="6" />;
  return <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true"><g fill={t.color} stroke={I} strokeWidth="3" strokeLinejoin="round">{d}</g></svg>;
}

// The three ways to play in the new palette (teacher, 2026-11-24: "update ways
// to play colors to match new theme"): each wears its pastel fill with ink text
// and an ink outline, its bright on the icon circle. Same pair everywhere.
export const WAYS_STYLE: Record<'Share' | 'Live' | 'Solo', { bright: string; soft: string; icon: Icon; hint: string }> = {
  Share: { bright: PP.lemon, soft: PP.butter, icon: Television, hint: 'Play together on one screen' },
  Live: { bright: PP.sky, soft: PP.blueCrystal, icon: Broadcast, hint: 'Play together on your own devices' },
  Solo: { bright: PP.kelly, soft: PP.mint, icon: User, hint: 'Play on your own' },
};
export function WayRow({ way }: { way: keyof typeof WAYS_STYLE }) {
  const w = WAYS_STYLE[way]; const Ic = w.icon;
  return (
    <span className="grid grid-cols-[auto_5.5rem_1fr] items-center gap-x-3 rounded-[1rem] px-3 py-2 text-base leading-snug" style={{ background: w.soft, color: I, border: `2px solid ${I}` }}>
      <span className="w-9 h-9 rounded-full grid place-items-center" style={{ background: w.bright, border: `2px solid ${I}` }}><Ic weight="bold" size={20} aria-hidden="true" /></span>
      <span className="font-display font-bold text-lg">{way}</span>
      <span className="font-semibold">{w.hint}</span>
    </span>
  );
}
// Yellow go button (teacher, 2026-11-24): Next, Play and Start are #FDFD94 with ink text and an ink shadow.
export const GO_YELLOW = '#fdfd94';

// THE one glow (teacher, 2026-11-24: exactly the live game's turn glow).
// Reuses src/index.css .turn-rays (yellow sun rays spinning clockwise) and
// .turn-halo (a soft halo that breathes), so the motion settings apply. Both
// sit centered and completely BEHIND what they wrap (rays 240%, halo 170% of
// its width); never a flat ring. Used on the your-turn icon, the current
// scoreboard row icon, the selected player and the winner.
export function TurnGlow({ children, className = '', style, rays = 2.4, halo = 1.7 }: { children: ReactNode; round?: boolean; radius?: number; className?: string; style?: CSSProperties; rays?: number; halo?: number }) {
  const at = (k: number): CSSProperties => ({ width: `${k * 100}%`, aspectRatio: '1 / 1', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' });
  return (
    <span className={`relative inline-grid isolate ${className}`} style={style}>
      <span aria-hidden="true" className="absolute pointer-events-none -z-10" style={at(rays)}><span className="turn-rays block w-full h-full rounded-full" /></span>
      <span aria-hidden="true" className="absolute pointer-events-none -z-10" style={at(halo)}><span className="turn-halo block w-full h-full rounded-full" /></span>
      <span className="relative">{children}</span>
    </span>
  );
}

// THE meter (teacher, 2026-11-24: "more modern and theme aligned"), built once
// for the round tracker, the start-menu step tracker and goal bars. One
// continuous rounded track (pale, soft inner shadow, ink edge); segments are
// gentle gaps inside it; done is Kelly, the current one Lemon with a small
// glowing marker at its edge, later ones stay track. Always 22px tall.
export const METER_H = 22;
export function Meter({ segments = 1, done = 0, part = 1, width = 360, label }: { segments?: number; done?: number; part?: number; width?: number | string; label?: string }) {
  const fill = (c: string) => `linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 55%), ${c}`;
  return (
    <span role="img" aria-label={label} className="inline-flex items-stretch gap-[4px] rounded-full p-[3px] shrink-0"
      style={{ width, height: METER_H, background: '#eeeaf8', border: `2.5px solid ${I}`, boxShadow: 'inset 0 2px 4px rgba(29,26,51,0.22)', boxSizing: 'border-box' }}>
      {Array.from({ length: segments }, (_, i) => {
        const cur = i === done && done < segments;
        return (
          <span key={i} className="flex-1 relative rounded-full" style={{ background: i < done ? fill(PP.kelly) : 'rgba(29,26,51,0.06)' }}>
            {cur && part > 0 && <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${Math.max(part, 0.12) * 100}%`, background: fill(PP.lemon) }}>
              <span className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 rounded-full" style={{ width: METER_H - 4, height: METER_H - 4, background: PP.paper, border: `2.5px solid ${I}`, boxShadow: `0 0 0 3px rgba(250,190,55,0.55), 0 0 10px 3px rgba(250,190,55,0.6)` }} />
            </span>}
          </span>
        );
      })}
    </span>
  );
}

// The site's purple ground, the same marble as App.tsx's AmbientBackground
// (periwinkle #B4C4FB with soft lighter and darker blobs).
const SWIRL = encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800"><filter id="m"><feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves="3" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="140" xChannelSelector="R" yChannelSelector="G"/></filter><g filter="url(#m)"><rect width="800" height="800" fill="#b4c4fb"/><circle cx="150" cy="150" r="180" fill="#c8d4fc"/><circle cx="650" cy="220" r="220" fill="#a3b6f7"/><circle cx="300" cy="600" r="240" fill="#c8d4fc"/><circle cx="700" cy="700" r="180" fill="#a3b6f7"/></g></svg>`);
export const PURPLE_GROUND: CSSProperties = { backgroundColor: '#b4c4fb', backgroundImage: `url("data:image/svg+xml,${SWIRL}")`, backgroundSize: 'cover', backgroundRepeat: 'no-repeat' };

// ---------- game theme backs (Classic), drawn in code ----------
export function StudioBack({ w, h }: { w: number; h: number }) {
  const c = w * 0.085;
  const curtain = (flip: boolean) => {
    const x = (v: number) => (flip ? w - v : v);
    return (
      <g>
        <path d={`M${x(0)} 0 L${x(c)} 0 C${x(c - 14)} ${h * 0.28} ${x(c + 16)} ${h * 0.55} ${x(c - 4)} ${h * 0.84} L${x(c * 0.2)} ${h * 0.9} L${x(0)} ${h * 0.9} Z`} fill={PP.pink} stroke={I} strokeWidth="4" strokeLinejoin="round" />
        {[0.3, 0.62].map((f) => <path key={f} d={`M${x(c * f)} 8 C${x(c * f - 6)} ${h * 0.3} ${x(c * f + 8)} ${h * 0.6} ${x(c * f - 2)} ${h * 0.86}`} fill="none" stroke={I} strokeWidth="2.4" strokeLinecap="round" />)}
        <rect x={flip ? w - c - 4 : -6} y={h * 0.5} width={c + 10} height="14" rx="7" fill={PP.lemon} stroke={I} strokeWidth="3" />
      </g>
    );
  };
  const n = Math.round(w / 70);
  const scallops = Array.from({ length: n }, (_, i) => { const a = (i * w) / n, b = ((i + 1) * w) / n; return <path key={i} d={`M${a} 24 Q${(a + b) / 2} 62 ${b} 24 Z`} fill={PP.pink} stroke={I} strokeWidth="4" strokeLinejoin="round" />; });
  const floor = h * 0.86;
  return (
    <svg className="absolute inset-0" width={w} height={h} aria-hidden="true">
      <rect width={w} height={h} fill={PP.grape} />
      {/* spotlight beams, opaque lavender, behind everything else */}
      <path d={`M${w * 0.2} 0 L${w * 0.28} 0 L${w * 0.46} ${floor} L${w * 0.08} ${floor} Z`} fill={PP.lavender} opacity="1" />
      <path d={`M${w * 0.72} 0 L${w * 0.8} 0 L${w * 0.92} ${floor} L${w * 0.54} ${floor} Z`} fill={PP.lavender} />
      <path d={`M0 ${floor} C${w * 0.3} ${floor - 8} ${w * 0.7} ${floor + 6} ${w} ${floor - 4} L${w} ${h} L0 ${h} Z`} fill={PP.lemon} stroke={I} strokeWidth="4" strokeLinejoin="round" />
      {Array.from({ length: 9 }, (_, i) => <path key={i} d={`M${(w / 9) * i + 20} ${floor + 14} l14 ${h - floor - 22}`} stroke={PP.orange} strokeWidth="5" strokeLinecap="round" />)}
      {curtain(false)}{curtain(true)}
      {scallops}
      <rect x="-4" y="-4" width={w + 8} height="30" fill={PP.pink} stroke={I} strokeWidth="4" />
    </svg>
  );
}

export function ParkBack({ w, h }: { w: number; h: number }) {
  const cloud = (x: number, y: number, s: number) => <path d={`M${x} ${y} c${-8 * s} 0 ${-12 * s} ${-10 * s} ${-4 * s} ${-14 * s} c${2 * s} ${-12 * s} ${18 * s} ${-14 * s} ${22 * s} ${-4 * s} c${8 * s} ${-8 * s} ${22 * s} ${-2 * s} ${20 * s} ${8 * s} c${8 * s} ${2 * s} ${8 * s} ${10 * s} 0 ${10 * s} Z`} fill={PP.paper} stroke={I} strokeWidth="3.5" strokeLinejoin="round" />;
  return (
    <svg className="absolute inset-0" width={w} height={h} aria-hidden="true">
      <rect width={w} height={h} fill={PP.sky} />
      <circle cx={w * 0.9} cy={h * 0.12} r={Math.min(w, h) * 0.07} fill={PP.lemon} stroke={I} strokeWidth="4" />
      <path d={`M${w * 0.9 - 18} ${h * 0.12 - 16} q6 -8 14 -8`} stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round" />
      {cloud(w * 0.08, h * 0.12, 2.2)}{cloud(w * 0.55, h * 0.07, 1.6)}{cloud(w * 0.78, h * 0.3, 1.3)}
      <path d={`M0 ${h * 0.62} C${w * 0.25} ${h * 0.5} ${w * 0.45} ${h * 0.56} ${w * 0.6} ${h * 0.6} C${w * 0.78} ${h * 0.5} ${w * 0.92} ${h * 0.52} ${w} ${h * 0.58} L${w} ${h} L0 ${h} Z`} fill={PP.lime} stroke={I} strokeWidth="4" strokeLinejoin="round" />
      <path d={`M0 ${h * 0.78} C${w * 0.3} ${h * 0.7} ${w * 0.6} ${h * 0.82} ${w} ${h * 0.72} L${w} ${h} L0 ${h} Z`} fill={PP.kelly} stroke={I} strokeWidth="4" strokeLinejoin="round" />
      {Array.from({ length: 12 }, (_, i) => { const x = (w / 12) * i + 30, y = h * 0.86 + ((i * 29) % 50); return <g key={i}><path d={`M${x} ${y} v18`} stroke={I} strokeWidth="3" strokeLinecap="round" /><circle cx={x} cy={y} r="7" fill={[PP.pink, PP.paper, PP.lemon][i % 3]} stroke={I} strokeWidth="2.5" /></g>; })}
    </svg>
  );
}

// Question Tracker, Classic: the night sky that fills with stars.
export function SkyBack({ w, h, stars = 14 }: { w: number; h: number; stars?: number }) {
  const pts = Array.from({ length: stars }, (_, i) => [((i * 197) % 97) / 97 * w, ((i * 131) % 89) / 89 * h * 0.8 + 20, 10 + (i % 3) * 6] as const);
  const star = (x: number, y: number, r: number) => Array.from({ length: 10 }, (_, k) => { const rr = k % 2 ? r * 0.45 : r; const a = (-90 + k * 36) * Math.PI / 180; return `${(x + rr * Math.cos(a)).toFixed(1)},${(y + rr * Math.sin(a)).toFixed(1)}`; }).join(' ');
  return (
    <svg className="absolute inset-0" width={w} height={h} aria-hidden="true">
      <rect width={w} height={h} fill="#241c3d" />
      <circle cx={w * 0.84} cy={h * 0.16} r={Math.min(w, h) * 0.07} fill={PP.butter} stroke={I} strokeWidth="4" />
      <circle cx={w * 0.86} cy={h * 0.14} r={Math.min(w, h) * 0.06} fill="#241c3d" />
      {pts.map(([x, y, r], i) => <polygon key={i} points={star(x, y, r)} fill={PP.lemon} stroke={I} strokeWidth="2.5" strokeLinejoin="round" />)}
      <path d={`M0 ${h * 0.9} C${w * 0.3} ${h * 0.84} ${w * 0.6} ${h * 0.94} ${w} ${h * 0.86} L${w} ${h} L0 ${h} Z`} fill={PP.grapeDeep} stroke={I} strokeWidth="4" />
    </svg>
  );
}
// Cast and Catch, Classic: sky, lake and the front half of the boat.
export function LakeBack({ w, h }: { w: number; h: number }) {
  const water = h * 0.42;
  return (
    <svg className="absolute inset-0" width={w} height={h} aria-hidden="true">
      <rect width={w} height={h} fill={PP.blueCrystal} />
      <circle cx={w * 0.85} cy={h * 0.14} r={Math.min(w, h) * 0.07} fill={PP.lemon} stroke={I} strokeWidth="4" />
      <rect y={water} width={w} height={h - water} fill={PP.sky} />
      {Array.from({ length: 7 }, (_, i) => <path key={i} d={`M${(i * w) / 7 + 20} ${water + 40 + (i % 3) * 70} q20 -12 40 0 t40 0`} stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.7" />)}
      <path d={`M0 ${water - 4} C${w * 0.3} ${water - 10} ${w * 0.7} ${water + 4} ${w} ${water - 6}`} stroke={I} strokeWidth="4" fill="none" />
      <path d={`M-10 ${h * 0.8} L${w * 0.32} ${h * 0.8} L${w * 0.26} ${h + 10} L-10 ${h + 10} Z`} fill="#a0683a" stroke={I} strokeWidth="4" strokeLinejoin="round" />
    </svg>
  );
}

// ---------- the five devices (teacher, 2026-11-24) ----------
// Every view is previewed on a big screen (interactive whiteboard, 16:9), a
// laptop (16:10), an iPad landscape AND portrait, and a phone portrait. One
// view component is rendered at each size and scaled; nothing is hand-copied.
// Landscape frames fit the 16:10 design to the frame on the same purple ground
// (seamless). Portrait frames hand the view the frame's own size through
// useFrame(), so start menus, the welcome and overlays reflow; a view with its
// own portrait design (`port`) uses it there.
export type FrameKind = 'board' | 'laptop' | 'ipadL' | 'ipadP' | 'phone';
export const FRAMES: Record<FrameKind, { w: number; h: number; label: string }> = {
  board: { w: 1600, h: 900, label: 'Big screen 16:9' }, laptop: { w: 1280, h: 800, label: 'Laptop 16:10' },
  ipadL: { w: 1180, h: 820, label: 'iPad landscape' }, ipadP: { w: 820, h: 1180, label: 'iPad portrait' }, phone: { w: 430, h: 932, label: 'Phone' },
};
type FrameInfo = { kind: FrameKind; w: number; h: number; portrait: boolean; adaptive: boolean };
const FrameCtx = createContext<FrameInfo>({ kind: 'laptop', w: 1280, h: 800, portrait: false, adaptive: false });
export const useFrame = () => useContext(FrameCtx);

// Scales its child (natural size) down to fit the box; used by reflowing views
// in portrait so nothing is cut off or runs past its box.
export function AutoFit({ children, width }: { children: ReactNode; width?: number }) {
  const box = useRef<HTMLDivElement>(null); const inner = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(1);
  useLayoutEffect(() => {
    const b = box.current, c = inner.current; if (!b || !c) return;
    const fit = () => { const cw = c.offsetWidth, ch = c.offsetHeight; if (!cw || !ch) return; setK(Math.min(1, b.clientWidth / cw, b.clientHeight / ch)); };
    const ro = new ResizeObserver(fit); ro.observe(b); ro.observe(c); fit();
    return () => ro.disconnect();
  }, []);
  // The child sits absolutely so it keeps its natural size; then it is scaled to fit and centered.
  return (
    <div ref={box} className="w-full h-full min-h-0 relative">
      <div ref={inner} className="absolute left-1/2 top-1/2 flex flex-col items-center justify-center" style={{ width: width ?? 'max-content', transform: `translate(-50%, -50%) scale(${k})`, transformOrigin: 'center' }}>{children}</div>
    </div>
  );
}

// Renders only once scrolled near, so a page of five-device sets stays light.
function Lazy({ children, ratio }: { children: ReactNode; ratio: number }) {
  const ref = useRef<HTMLDivElement>(null); const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { setOn(true); io.disconnect(); } }, { rootMargin: '600px' });
    io.observe(el); return () => io.disconnect();
  }, []);
  return <div ref={ref} style={{ aspectRatio: `${ratio}` }} className="w-full">{on ? children : null}</div>;
}
function Screen({ kind, land, port, landSize, portSize, adaptive, ground }: { kind: FrameKind; land: ReactNode; port?: ReactNode; landSize: [number, number]; portSize: [number, number]; adaptive?: boolean; ground: CSSProperties }) {
  const f = FRAMES[kind]; const portrait = f.h > f.w;
  let body: ReactNode;
  if (adaptive) {
    body = <FrameCtx.Provider value={{ kind, w: f.w, h: f.h, portrait, adaptive: true }}><div className="w-full h-full relative">{portrait && port ? port : land}</div></FrameCtx.Provider>;
  } else {
    const [dw, dh] = portrait && port ? portSize : landSize;
    const k = Math.min(f.w / dw, f.h / dh);
    body = (
      <div className="w-full h-full relative overflow-hidden" style={ground}>
        <div className="absolute" style={{ width: dw, height: dh, left: (f.w - dw * k) / 2, top: (f.h - dh * k) / 2, transform: `scale(${k})`, transformOrigin: 'top left' }}>{portrait && port ? port : land}</div>
      </div>
    );
  }
  return <Lazy ratio={f.w / f.h}><Scaled w={f.w} h={f.h}>{body}</Scaled></Lazy>;
}
function Bezel({ kind, children }: { kind: FrameKind; children: ReactNode }) {
  const dark = '#2a2740';
  if (kind === 'board') return (
    <div className="grid justify-items-center">
      <div className="w-full rounded-[0.6rem] p-[1.4%]" style={{ background: dark, border: `2px solid ${I}` }}><div className="rounded-[0.2rem] overflow-hidden">{children}</div></div>
      <div className="w-[40%] h-2.5 rounded-b-[0.5rem]" style={{ background: '#c9c4d6', border: `2px solid ${I}`, borderTop: 'none' }} />
    </div>
  );
  if (kind === 'laptop') return (
    <div className="grid justify-items-center">
      <div className="w-full rounded-t-[0.7rem] p-[2.4%] pb-[2.8%]" style={{ background: dark, border: `2px solid ${I}` }}><div className="rounded-[0.25rem] overflow-hidden">{children}</div></div>
      <div className="w-[106%] h-2 rounded-b-[0.6rem]" style={{ background: '#c9c4d6', border: `2px solid ${I}`, borderTop: 'none' }} />
    </div>
  );
  const phone = kind === 'phone';
  return <div className={`w-full ${phone ? 'rounded-[1.1rem] p-[6%]' : 'rounded-[0.9rem] p-[4.5%]'}`} style={{ background: dark, border: `2px solid ${I}` }}><div className={`${phone ? 'rounded-[0.6rem]' : 'rounded-[0.4rem]'} overflow-hidden`}>{children}</div></div>;
}
// The set: the big screen wide on top, then laptop, both iPads and the phone
// in one row at one height (widths follow each device's shape).
export function DeviceSet({ land, port, landSize = [1280, 800], portSize = [820, 1180], adaptive, ground = PURPLE_GROUND }: { land: ReactNode; port?: ReactNode; landSize?: [number, number]; portSize?: [number, number]; adaptive?: boolean; ground?: CSSProperties }) {
  const row: FrameKind[] = ['laptop', 'ipadL', 'ipadP', 'phone'];
  const pad: Record<FrameKind, number> = { board: 1.03, laptop: 1.08, ipadL: 1.09, ipadP: 1.13, phone: 1.18 };
  return (
    <div className="grid gap-3">
      <figure className="m-0 grid gap-1"><Bezel kind="board"><Screen kind="board" land={land} port={port} landSize={landSize} portSize={portSize} adaptive={adaptive} ground={ground} /></Bezel><figcaption className="text-xs font-bold text-muted text-center">{FRAMES.board.label}</figcaption></figure>
      <div className="flex gap-3 items-end">
        {row.map((kd) => { const f = FRAMES[kd]; return (
          <figure key={kd} className="m-0 grid gap-1 min-w-0" style={{ flex: `${(f.w / f.h) / pad[kd]} 1 0` }}>
            <Bezel kind={kd}><Screen kind={kd} land={land} port={port} landSize={landSize} portSize={portSize} adaptive={adaptive} ground={ground} /></Bezel>
            <figcaption className="text-xs font-bold text-muted text-center leading-tight">{f.label}</figcaption>
          </figure>); })}
      </div>
    </div>
  );
}

// ---------- device frames (shared by Universal views, Game mockups, Teacher portal) ----------
function Scaled({ w, h, children }: { w: number; h: number; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(0.5);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setK(el.clientWidth / w));
    ro.observe(el);
    setK(el.clientWidth / w);
    return () => ro.disconnect();
  }, [w]);
  return (
    <div ref={box} className="relative w-full overflow-hidden" style={{ aspectRatio: `${w} / ${h}` }}>
      <div className="absolute top-0 left-0 origin-top-left" style={{ width: w, height: h, transform: `scale(${k})`, color: I }}>{children}</div>
    </div>
  );
}
export function Laptop({ children, w = 1000 }: { children: ReactNode; w?: number }) {
  return (
    <div className="grid justify-items-center">
      <div className="w-full rounded-t-[1.1rem] p-[2.2%] pb-[2.6%]" style={{ background: '#2a2740', border: `2px solid ${I}` }}>
        <div className="rounded-[0.35rem] overflow-hidden"><Scaled w={w} h={w * 0.625}>{children}</Scaled></div>
      </div>
      <div className="w-[103%] h-3 rounded-b-[0.9rem]" style={{ background: '#c9c4d6', border: `2px solid ${I}`, borderTop: 'none' }} />
    </div>
  );
}
export function Tablet({ children }: { children: ReactNode }) {
  return (
    <div className="w-full max-w-[21rem] mx-auto rounded-[1.6rem] p-[4%]" style={{ background: '#2a2740', border: `2px solid ${I}` }}>
      <div className="rounded-[0.7rem] overflow-hidden"><Scaled w={820} h={1180}>{children}</Scaled></div>
    </div>
  );
}
// A cover or any art drawn at (w x h) and scaled to fill its box.
export function Fit({ w, h, children }: { w: number; h: number; children: ReactNode }) {
  return <Scaled w={w} h={h}>{children}</Scaled>;
}
// Every go button is yellow (teacher, 2026-11-24: Next, Play, Start, Roll).
export function MainBtn({ children, wide, big }: { children: ReactNode; wide?: boolean; big?: boolean; yellow?: boolean }) {
  const yellow = true;
  return (
    <span className={`${wide ? 'w-full' : ''} ${big ? 'min-h-[68px] text-[30px] px-10' : 'min-h-[60px] text-[24px] px-8'} rounded-full font-display font-bold inline-flex items-center justify-center gap-3 whitespace-nowrap shrink-0`}
      style={yellow ? { background: GO_YELLOW, color: I, border: `3px solid ${I}`, boxShadow: `0 6px 0 ${I}` } : { background: PP.periwinkle, color: I, border: `3px solid ${I}`, boxShadow: `0 6px 0 ${PP.grapeDeep}` }}>{children}</span>
  );
}

// Landscape: the 1280 x 800 design scaled to fit the frame and centered (the
// purple ground fills the rest, so it reads as one screen).
function fitDesign(f: FrameInfo, canvas: number): CSSProperties {
  if (!f.adaptive) return { transform: `scale(${canvas / 1280})` };
  const k = Math.min(f.w / 1280, f.h / 800);
  return { transform: `translate(${(f.w - 1280 * k) / 2}px, ${(f.h - 800 * k) / 2}px) scale(${k})` };
}
// ---------- THE start menu (teacher, 2026-11-23, newest: "improve the format
// so no white background, just the card buttons like the game types and power
// ups against the putple background. only show setting toggles and such when
// the specific game type relebant to them is selected"). One layout for every
// game's ways to play, question set, options, teams, power-ups, Live setup and
// lobby: the purple ground, the wordmark and icon buttons on top, the header
// row (Grow Year caps title left, step tracker right, no "Step X of Y" text),
// the choice cards straight on the ground, centered, the same Back and Next
// footer. No white panel. Drawn at 1280 x 800 and scaled to the frame's canvas.
const MK_GY: CSSProperties = { fontFamily: 'var(--font-display)', fontWeight: 400, lineHeight: 1, textTransform: 'uppercase' };
function MkRound({ children, label, size = 52 }: { children: ReactNode; label: string; size?: number }) {
  return <span aria-label={label} className="rounded-full grid place-items-center shrink-0" style={{ width: size, height: size, background: '#fff', border: `2px solid ${I}`, boxShadow: `0 3px 0 ${I}` }}>{children}</span>;
}
export function MenuGo({ children }: { children: ReactNode }) {
  return <span className="min-h-[60px] px-8 text-[24px] rounded-full font-display font-bold inline-flex items-center justify-center gap-3 whitespace-nowrap" style={{ background: GO_YELLOW, color: I, border: `3px solid ${I}`, boxShadow: `0 6px 0 ${I}` }}>{children}</span>;
}
export function MenuBack() {
  return <span className="min-h-[56px] px-6 rounded-full font-bold text-[20px] inline-flex items-center gap-2 whitespace-nowrap" style={{ background: '#fff', border: `3px solid ${I}`, boxShadow: `0 4px 0 ${I}` }}><ArrowLeft weight="bold" size={20} />Back</span>;
}
export function MenuStep({ title, step, total, children, go, back = true, extra, canvas = 1280 }: { title: string; step: number; total: number; children: ReactNode; go?: ReactNode; back?: boolean; extra?: ReactNode; canvas?: number }) {
  const f = useFrame();
  const footer = <div className="flex justify-center gap-5 items-center">{back && <MenuBack />}{extra}{go ?? <MenuGo>Next<ArrowRight weight="bold" size={24} /></MenuGo>}</div>;
  if (f.adaptive && f.portrait) {
    // Portrait reflow: the title row stays (title left, tracker right) on an
    // iPad; on a phone the tracker drops under the title. Cards and footer fit
    // the width, never cut off.
    const phone = f.w < 600, px = phone ? 20 : 40;
    return (
      <div className="w-full h-full flex flex-col" style={{ ...PURPLE_GROUND, color: I, padding: `${phone ? 20 : 28}px ${px}px ${phone ? 24 : 36}px` }}>
        <div className="flex items-center justify-between">
          <img src="/brand/gamify-wordmark.png" alt="Gamify" className={`${phone ? 'h-7' : 'h-10'} w-auto`} draggable={false} />
          <div className={`flex ${phone ? 'gap-1.5' : 'gap-3'}`}>
            <MkRound size={phone ? 38 : 52} label="Accessibility"><PersonArmsSpread weight="bold" size={phone ? 18 : 24} /></MkRound><MkRound size={phone ? 38 : 52} label="Settings"><GearSix weight="bold" size={phone ? 18 : 24} /></MkRound>
            <MkRound size={phone ? 38 : 52} label="Full screen"><CornersOut weight="bold" size={phone ? 18 : 24} /></MkRound><MkRound size={phone ? 38 : 52} label="Close"><X weight="bold" size={phone ? 18 : 24} /></MkRound>
          </div>
        </div>
        <div className={`mt-6 flex ${phone ? 'flex-col items-start gap-3' : 'items-center justify-between gap-4'}`}>
          <h2 style={{ ...MK_GY, fontSize: phone ? 34 : 48 }}>{title}</h2>
          <Meter segments={total} done={step - 1} part={1} width={total * (phone ? 40 : 52)} label={`Step ${step} of ${total}`} />
        </div>
        <div className="flex-1 min-h-0 my-5"><AutoFit width={phone ? 640 : f.w - 2 * px}>{children}</AutoFit></div>
        <div style={{ height: 72 }}><AutoFit>{footer}</AutoFit></div>
      </div>
    );
  }
  return (
    <div className="w-full h-full relative overflow-hidden" style={PURPLE_GROUND}>
      <div className="absolute top-0 left-0 origin-top-left" style={{ width: 1280, height: 800, color: I, ...fitDesign(f, canvas) }}>
        <div className="absolute left-10 right-10 top-7 flex items-center justify-between">
          <img src="/brand/gamify-wordmark.png" alt="Gamify" className="h-10 w-auto" draggable={false} />
          <div className="flex gap-3">
            <MkRound label="Accessibility"><PersonArmsSpread weight="bold" size={24} /></MkRound><MkRound label="Settings"><GearSix weight="bold" size={24} /></MkRound>
            <MkRound label="Full screen"><CornersOut weight="bold" size={24} /></MkRound><MkRound label="Close"><X weight="bold" size={24} /></MkRound>
          </div>
        </div>
        <div className="absolute left-[80px] right-[80px] top-[108px] bottom-[36px] flex flex-col gap-6">
          <div className="flex items-center justify-between gap-6">
            <h2 className="text-[50px]" style={MK_GY}>{title}</h2>
<Meter segments={total} done={step - 1} part={1} width={total * 62} label={`Step ${step} of ${total}`} />
          </div>
          <div className="flex-1 min-h-0 flex flex-col items-center justify-center text-center">{children}</div>
          {footer}
        </div>
      </div>
    </div>
  );
}

// ---------- THE game welcome (teacher, 2026-11-23: "revert to original welcome
// page, just space out the right text better"). Her original GameWelcome
// layout at 1280 x 800: the cover big on the left (about 60% of the width);
// the right column exactly as tall as the cover, a full-height column spread
// evenly (justify-between): the Grow Year title row level with the cover top
// (corner buttons at its right), the description and ways to play, the white
// How to play card, and a full-width 72px start button whose bottom lines up
// with the cover bottom.
export function WelcomeScreen({ name, desc, modes, steps, cover, go = 'Set up and play', canvas = 1280 }: { name: string; desc: string; modes: string[]; steps: [ReactNode, string][]; cover: ReactNode; go?: string; canvas?: number }) {
  const f = useFrame();
  if (f.adaptive && f.portrait) {
    // Portrait: the same parts stacked, cover on top at its own shape, then
    // the title, description and ways, How to play and the yellow start button.
    const phone = f.w < 600, px = phone ? 20 : 40, cw = f.w - 2 * px;
    return (
      <div className="w-full h-full flex flex-col" style={{ ...PURPLE_GROUND, color: I, padding: `${phone ? 20 : 28}px ${px}px ${phone ? 24 : 40}px` }}>
        <div className="flex items-center justify-between"><img src="/brand/gamify-wordmark.png" alt="Gamify" className={`${phone ? 'h-7' : 'h-10'} w-auto`} draggable={false} />
          <div className="flex gap-2"><MkRound label="Full screen" size={phone ? 38 : 52}><CornersOut weight="bold" size={phone ? 18 : 24} /></MkRound><MkRound label="Settings" size={phone ? 38 : 52}><GearSix weight="bold" size={phone ? 18 : 24} /></MkRound></div></div>
        <div className="mt-5 mx-auto rounded-[24px] overflow-hidden relative shrink-0" style={{ width: Math.min(cw, f.h * 0.4 * 720 / 648), height: Math.min(cw, f.h * 0.4 * 720 / 648) * 648 / 720, border: `3px solid ${I}`, boxShadow: `0 6px 0 ${I}` }}>
          <div className="absolute top-0 left-0 origin-top-left" style={{ width: 720, height: 648, transform: `scale(${(Math.min(cw, f.h * 0.4 * 720 / 648) - 6) / 720})` }}>{cover}</div>
        </div>
        <div className="flex-1 min-h-0 mt-5">
          <AutoFit width={phone ? 520 : cw}>
            <div className="w-full grid gap-5">
              <h1 style={{ ...MK_GY, fontSize: 60, lineHeight: 0.95 }}>{name}</h1>
              <p className="font-semibold text-[22px] leading-snug">{desc}</p>
              <div className="flex flex-wrap gap-2.5">{modes.map((m, i) => <span key={m} className="px-5 h-11 inline-flex items-center rounded-full font-bold text-[18px]" style={{ background: (WAYS_STYLE[m as keyof typeof WAYS_STYLE]?.soft) ?? [PP.gamify, PP.aqua, PP.butter][i % 3], border: `2.5px solid ${I}` }}>{m}</span>)}</div>
              <div className="rounded-[26px] px-7 py-5 grid gap-3.5" style={{ background: '#fff', border: `3px solid ${I}`, boxShadow: `0 5px 0 ${I}` }}>
                <h2 className="text-[26px]" style={MK_GY}>How to play</h2>
                {steps.map(([ic, t], i) => <div key={t} className="flex items-center gap-4 font-bold text-[22px] leading-tight"><span className="w-10 h-10 rounded-full grid place-items-center shrink-0" style={{ background: [PP.butter, PP.blush, PP.aqua][i % 3], border: `2.5px solid ${I}` }}>{ic}</span>{t}</div>)}
              </div>
              <span className="w-full h-[72px] rounded-full font-display font-bold text-[30px] inline-flex items-center justify-center gap-3" style={{ background: GO_YELLOW, color: I, border: `3px solid ${I}`, boxShadow: `0 6px 0 ${I}` }}><Play weight="fill" size={32} />{go}</span>
            </div>
          </AutoFit>
        </div>
      </div>
    );
  }
  return (
    <div className="w-full h-full relative overflow-hidden" style={PURPLE_GROUND}>
      <div className="absolute top-0 left-0 origin-top-left" style={{ width: 1280, height: 800, color: I, ...fitDesign(f, canvas) }}>
        <img src="/brand/gamify-wordmark.png" alt="Gamify" className="absolute left-10 top-7 h-10 w-auto" draggable={false} />
        <div className="absolute left-10 right-10 top-[108px] bottom-[44px] flex gap-10">
          <div className="w-[720px] h-full rounded-[30px] overflow-hidden relative shrink-0" style={{ border: `3px solid ${I}`, boxShadow: `0 6px 0 ${I}` }}>{cover}</div>
          <div className="flex-1 min-w-0 h-full flex flex-col justify-between">
            <div className="flex items-start gap-4">
              <h1 className="flex-1 min-w-0" style={{ ...MK_GY, fontSize: 64, lineHeight: 0.95 }}>{name}</h1>
              <div className="flex gap-3 pt-1"><MkRound label="Full screen" size={56}><CornersOut weight="bold" size={26} /></MkRound><MkRound label="Settings" size={56}><GearSix weight="bold" size={26} /></MkRound></div>
            </div>
            <div className="grid gap-4">
              <p className="font-semibold text-[22px] leading-snug">{desc}</p>
              <div className="flex flex-wrap gap-2.5">{modes.map((m, i) => <span key={m} className="px-5 h-11 inline-flex items-center rounded-full font-bold text-[18px]" style={{ background: (WAYS_STYLE[m as keyof typeof WAYS_STYLE]?.soft) ?? [PP.gamify, PP.aqua, PP.butter][i % 3], border: `2.5px solid ${I}` }}>{m}</span>)}</div>
            </div>
            <div className="rounded-[26px] px-7 py-5 grid gap-3.5" style={{ background: '#fff', border: `3px solid ${I}`, boxShadow: `0 5px 0 ${I}` }}>
              <h2 className="text-[26px]" style={MK_GY}>How to play</h2>
              {steps.map(([ic, t], i) => (
                <div key={t} className="flex items-center gap-4 font-bold text-[22px] leading-tight">
                  <span className="w-10 h-10 rounded-full grid place-items-center shrink-0" style={{ background: [PP.butter, PP.blush, PP.aqua][i % 3], border: `2.5px solid ${I}` }}>{ic}</span>{t}
                </div>
              ))}
            </div>
            <span className="w-full h-[72px] rounded-full font-display font-bold text-[30px] inline-flex items-center justify-center gap-3" style={{ background: GO_YELLOW, color: I, border: `3px solid ${I}`, boxShadow: `0 6px 0 ${I}` }}><Play weight="fill" size={32} />{go}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
