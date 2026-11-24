import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Broadcast, CornersOut, GearSix, Lightbulb, List, PersonArmsSpread, Play, SpeakerHigh, Television, User, X, type Icon } from '@phosphor-icons/react';
import { PP } from './PaletteProposal';
import { CrayonPowerUp, type PowerId } from './CrayonKit';

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

// Computer players get a fun name that rotates each game (teacher, 2026-11-24:
// "Goofy Lamp is thinking..."), never "Computer".
export const CPU_NAMES = ['Goofy Lamp', 'Silly Fox', 'Happy Rainbow', 'Sleepy Cloud', 'Bouncy Sock', 'Wiggly Worm'] as const;
export const cpuName = (n: number) => CPU_NAMES[((n % CPU_NAMES.length) + CPU_NAMES.length) % CPU_NAMES.length];

// Every die wiggles gently on hover so kids see it can be rolled (teacher,
// 2026-11-24): a small rotate and lift loop, only on hover devices, off in
// Calm (still prop) and the Still motion setting.
const WIGGLE_CSS = '@keyframes die-wiggle{0%,100%{transform:rotate(0) translateY(0)}25%{transform:rotate(-7deg) translateY(-2px)}50%{transform:rotate(5deg) translateY(0)}75%{transform:rotate(-3deg) translateY(-1px)}}@media (hover:hover){.die-wiggle:hover .die-wiggle-in{animation:die-wiggle .9s ease-in-out infinite}}html[data-motion="still"] .die-wiggle-in{animation:none!important}';
export function DieWiggle({ children, still }: { children: ReactNode; still?: boolean }) {
  return <span className={`${still ? '' : 'die-wiggle'} inline-grid`}><style>{WIGGLE_CSS}</style><span className="die-wiggle-in inline-grid">{children}</span></span>;
}

// Whose turn it is (teacher, 2026-11-24): the player's icon (no circle, no
// white backing) and name on Butter shading. No "pick a card" line, no glow.
export const TURN_SHADE = PP.butter;
export function TurnChip({ icon, name, size = 22 }: { icon: ReactNode; name: string; size?: number }) {
  return <span className="inline-flex items-center gap-2.5 rounded-full font-bold whitespace-nowrap" style={{ background: TURN_SHADE, border: `3px solid ${I}`, boxShadow: `0 4px 0 ${I}`, padding: `${size * 0.2}px ${size * 0.9}px ${size * 0.2}px ${size * 0.35}px`, fontSize: size }}>{icon}{name}</span>;
}
// One power-up as its own square card (teacher, 2026-11-24): no tray panel,
// no label above, no helper text, no circle behind the art. Teacher, 2026-11-24
// ("make the power up cards larger so they dont cut out anything"): the card is
// 1.3x the old size; the art sits in its own top area at 40% of the card with
// padding all round (the crayon strokes run a little past their box, so the
// area leaves room for them), and the name has its own area that holds two
// lines with room to spare. Nothing ever crosses the card edge.
export const POWER_CARD_GROW = 1.3;
export function PowerCard({ id, name, size = 80 }: { id: PowerId; name: string; size?: number }) {
  const side = Math.round(size * POWER_CARD_GROW);
  const fs = Math.max(13, Math.round(side * 0.125));
  const pad = Math.round(side * 0.09);
  return (
    <span aria-label={name} className="flex flex-col items-center rounded-[16px] text-center shrink-0 overflow-hidden" style={{ width: side, height: side, padding: `${pad}px ${Math.round(pad * 0.6)}px`, background: PP.paper, border: `2.5px solid ${I}`, boxShadow: `0 3px 0 ${I}` }}>
      <span className="flex-1 min-h-0 w-full grid place-items-center"><CrayonPowerUp id={id} size={Math.round(side * 0.4)} /></span>
      <span className="w-full grid place-items-center font-bold" style={{ height: fs * 2.3, fontSize: fs, lineHeight: 1.1 }}><span>{name}</span></span>
    </span>
  );
}
// The in-game hint button: a lightbulb round beside Settings (teacher, 2026-11-24).
export function HintIcon({ size = 20 }: { size?: number }) { return <Lightbulb weight="bold" size={size} />; }

// THE in-game tool group (teacher, 2026-11-24: "smaller round buttons with more
// room", a lightbulb hint "beside settings" in every game). One order in every
// game and mockup: Hint, Settings, Full screen, Close (teacher, 2026-11-24:
// accessibility lives inside Settings on every screen; the hint is only on
// in-play strips; 8px apart so the meter can sit at the exact center). 44px is the
// smallest touch target we allow (Apple HIG 44pt, WCAG 2.5.5), with 14px between.
export const TOOL_SIZE = 44;
export function GameTools({ size = TOOL_SIZE, access = false, close = true, hint = true, gap }: { size?: number; access?: boolean; close?: boolean; hint?: boolean; gap?: number }) {
  const s = Math.round(size * 0.45);
  const items: [Icon, string][] = [...(access ? [[PersonArmsSpread, 'Accessibility'] as [Icon, string]] : []), ...(hint ? [[Lightbulb, 'Hint'] as [Icon, string]] : []), [GearSix, 'Settings'], [CornersOut, 'Full screen'], ...(close ? [[X, 'Close'] as [Icon, string]] : [])];
  return (
    <span className="flex shrink-0" style={{ gap: gap ?? 8 }}>
      {items.map(([Ic, l]) => <span key={l} aria-label={l} className="rounded-full grid place-items-center shrink-0" style={{ width: size, height: size, background: PP.paper, border: `2px solid ${I}`, boxShadow: `0 3px 0 ${I}` }}><Ic weight="bold" size={s} /></span>)}
    </span>
  );
}

// THE icon badge (teacher, 2026-11-24: "always center icons against
// backgrounds by pixel and sight so they are always even"). One box of exactly
// `size`; the background (circle or soft blob) fills that box edge to edge and
// shares its center with the icon (grid place-items center, no stray offsets,
// no rotation, no oversize backing). Then an optical nudge for lopsided glyphs,
// as a fraction of the size: a lightbulb's glass is heavier than its base, a
// play triangle's mass sits left of its box, a star's points pull it up.
export type Optical = 'none' | 'bulb' | 'play' | 'star' | 'heart';
const NUDGE: Record<Optical, [number, number]> = { none: [0, 0], bulb: [0, 0.03], play: [0.05, 0], star: [0, 0.025], heart: [0, 0.03] };
// A soft blob, symmetric about the center so it can never look off to one side.
const SOFT_BLOB = 'M50 4 C74 4 96 18 96 50 C96 82 74 96 50 96 C26 96 4 82 4 50 C4 18 26 4 50 4 Z';
export function IconBadge({ size, bg, shape = 'circle', ring, optical = 'none', children, label }: { size: number; bg: string; shape?: 'circle' | 'blob'; ring?: boolean; optical?: Optical; children: ReactNode; label?: string }) {
  const [nx, ny] = NUDGE[optical];
  return (
    <span aria-label={label} aria-hidden={label ? undefined : true} className="relative inline-grid place-items-center shrink-0" style={{ width: size, height: size }}>
      {shape === 'circle'
        ? <span className="absolute inset-0 rounded-full" style={{ background: bg, border: ring ? `3px solid ${I}` : undefined }} />
        : <svg viewBox="0 0 100 100" width={size} height={size} className="absolute inset-0" aria-hidden="true"><path d={SOFT_BLOB} fill={bg} stroke={ring ? I : 'none'} strokeWidth={ring ? 3 : 0} /></svg>}
      <span className="relative grid place-items-center" style={{ transform: nx || ny ? `translate(${(nx * size).toFixed(1)}px, ${(ny * size).toFixed(1)}px)` : undefined }}>{children}</span>
    </span>
  );
}

// Phones (teacher, 2026-11-24, "phones need a layout"): five tools do not fit
// beside a score at 390px, so a phone shows the Hint (the one tool kids reach
// in play) and one Menu button holding Settings (with accessibility inside),
// Full screen and Close. Still 44px rounds.
export function PhoneTools({ hint = true }: { hint?: boolean }) {
  const items: [Icon, string][] = [...(hint ? [[Lightbulb, 'Hint'] as [Icon, string]] : []), [List, 'Menu: settings, full screen, close']];
  return (
    <span className="flex shrink-0" style={{ gap: 8 }}>
      {items.map(([Ic, l]) => <span key={l} aria-label={l} className="rounded-full grid place-items-center shrink-0" style={{ width: TOOL_SIZE, height: TOOL_SIZE, background: PP.paper, border: `2px solid ${I}`, boxShadow: `0 3px 0 ${I}` }}><Ic weight="bold" size={20} /></span>)}
    </span>
  );
}
// ---------- THE question card (teacher, 2026-11-23/24) ----------
// One design for every game; games only swap the background around it. Inside
// the card: the player or team icon and name left (plain, no Butter), then only Settings
// (accessibility inside) and Listen (teacher, 2026-11-24), then Listen right; the
// question left-aligned in a fixed generous block whose font steps down for long
// questions; four A to D tiles of ONE fixed size.
export const SHORT_Q = 'Which one starts with a capital letter?';
export const LONG_Q = 'Read the sentence: "my dog likes to run in the park." Which one fixes it with a capital letter at the start and punctuation at the end?';
const Q_ANS = [['A', 'the dog ran.', PP.periwinkle, PP.gamify], ['B', 'The dog ran.', PP.sky, PP.blueCrystal], ['C', 'The dog ran', PP.pink, PP.blush], ['D', 'the dog ran', PP.lemon, PP.butter]] as const;
function qSize(q: string, big: boolean) { const n = q.length; return big ? (n <= 60 ? 54 : n <= 110 ? 44 : 36) : (n <= 60 ? 46 : n <= 110 ? 36 : 30); }
export function QuestionCard({ tablet, q = SHORT_Q, who, answers, right }: { tablet?: boolean; q?: string; who?: { icon: ReactNode; name: string }; answers?: readonly (readonly [string, string, string, string])[]; right?: number }) {
  const phone = useFrame().kind === 'phone';
  if (phone) return <QuestionCardPhone q={q} who={who} answers={answers ?? Q_ANS} right={right} />;
  const big = !!tablet;
  const b = big ? 60 : 52, ic = big ? 26 : 22;
  const ans = answers ?? Q_ANS;
  const round = (Ic: Icon, l: string) => <span key={l} aria-label={l} className="rounded-full grid place-items-center shrink-0" style={{ width: b, height: b, background: PP.paper, border: `2px solid ${I}`, boxShadow: `0 3px 0 ${I}` }}><Ic weight="bold" size={ic} /></span>;
  return (
    <div className={`${big ? 'w-[697px]' : 'w-[1088px]'} rounded-[30px] flex flex-col gap-5`} style={{ background: '#fff', border: `3px solid ${I}`, boxShadow: `0 6px 0 ${I}`, padding: big ? 28 : 26 }}>
      <div className="flex items-center gap-3">
        {/* Just the player icon (no circle) and the name as plain text: no yellow pill (teacher, 2026-11-24); Butter is only for the scoreboard row. No hint here (it stays in the board's tool group). */}
        <span className="flex-1 min-w-0 flex items-center gap-3">{who ? who.icon : <Badge t={TEAMS[1]} size={b * 0.9} />}<b className="truncate" style={{ fontSize: big ? 30 : 26 }}>{who ? who.name : 'Team Sky'}</b></span>
        {round(GearSix, 'Settings')}
        <span className="px-5 rounded-full inline-flex items-center gap-2 font-bold shrink-0" style={{ minHeight: b, fontSize: big ? 24 : 20, background: PP.blueCrystal, border: `2px solid ${I}`, boxShadow: `0 3px 0 ${I}` }}><SpeakerHigh weight="bold" size={ic} />Listen</span>
      </div>
      <div className="flex items-center" style={{ height: big ? 330 : 200 }}>
        <h2 className="font-bold text-left leading-snug" style={{ fontSize: qSize(q, big) }}>{q}</h2>
      </div>
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${big ? 1 : 2}, 1fr)` }}>
        {ans.map(([l, txt, c, bg], i) => (
          <div key={l} className="flex items-center gap-4 px-4 rounded-[20px] font-bold" style={{ height: big ? 92 : 84, fontSize: big ? 38 : 32, background: right === i ? PP.mint : bg, border: `3px solid ${I}`, boxShadow: `0 5px 0 ${I}` }}>
            <span className="shrink-0 rounded-full grid place-items-center" style={{ fontFamily: 'var(--font-display)', fontWeight: 400, lineHeight: 1, textTransform: 'uppercase', width: big ? 64 : 58, height: big ? 64 : 58, fontSize: big ? 36 : 32, background: right === i ? PP.kelly : c, color: right !== i && c === PP.grape ? '#ffffff' : I, border: `3px solid ${I}` }}>{l}</span>{txt}
          </div>
        ))}
      </div>
    </div>
  );
}

// The phone question card (390 x 844): 358px wide, the player icon and name,
// Settings (accessibility inside) and the Listen pill (44px rounds); the question 28/24/21px in a fixed 200px
// block, left aligned; answers in one column, 60px tall, 22px text.
function qPhone(q: string) { const n = q.length; return n <= 60 ? 28 : n <= 110 ? 24 : 21; }
function QuestionCardPhone({ q, who, answers, right }: { q: string; who?: { icon: ReactNode; name: string }; answers: readonly (readonly [string, string, string, string])[]; right?: number }) {
  const round = (Ic: Icon, l: string) => <span key={l} aria-label={l} className="rounded-full grid place-items-center shrink-0" style={{ width: TOOL_SIZE, height: TOOL_SIZE, background: PP.paper, border: `2px solid ${I}`, boxShadow: `0 3px 0 ${I}` }}><Ic weight="bold" size={20} /></span>;
  return (
    <div className="w-[358px] rounded-[24px] flex flex-col gap-3.5" style={{ background: '#fff', border: `3px solid ${I}`, boxShadow: `0 5px 0 ${I}`, padding: 14 }}>
      <div className="flex items-center gap-2">
        <span className="flex-1 min-w-0 flex items-center gap-2">{who ? who.icon : <Badge t={TEAMS[1]} size={36} />}<b className="text-[17px] leading-tight line-clamp-2">{who ? who.name : 'Team Sky'}</b></span>
        {round(GearSix, 'Settings')}<span className="h-11 px-3.5 rounded-full inline-flex items-center gap-1.5 font-bold text-[18px] shrink-0" style={{ background: PP.blueCrystal, border: `2px solid ${I}`, boxShadow: `0 3px 0 ${I}` }}><SpeakerHigh weight="bold" size={20} />Listen</span>
      </div>
      <div className="flex items-center" style={{ height: 200 }}>
        <h2 className="font-bold text-left leading-snug" style={{ fontSize: qPhone(q) }}>{q}</h2>
      </div>
      <div className="grid gap-2.5">
        {answers.map(([l, txt, c, bg], i) => (
          <div key={l} className="flex items-center gap-3 px-2.5 rounded-[16px] font-bold" style={{ height: 60, fontSize: 22, background: right === i ? PP.mint : bg, border: `3px solid ${I}`, boxShadow: `0 4px 0 ${I}` }}>
            <span className="shrink-0 rounded-full grid place-items-center" style={{ fontFamily: 'var(--font-display)', fontWeight: 400, lineHeight: 1, textTransform: 'uppercase', width: 42, height: 42, fontSize: 24, background: right === i ? PP.kelly : c, color: right !== i && c === PP.grape ? '#ffffff' : I, border: `3px solid ${I}` }}>{l}</span>{txt}
          </div>
        ))}
      </div>
    </div>
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
// (teacher, 2026-11-24: now Lavender #DDD6FF with soft lighter #EAE5FF and
// deeper #C9BFFB blobs, so it still reads as the site ground).
const SWIRL = encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800"><filter id="m"><feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves="3" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="140" xChannelSelector="R" yChannelSelector="G"/></filter><g filter="url(#m)"><rect width="800" height="800" fill="#ddd6ff"/><circle cx="150" cy="150" r="180" fill="#eae5ff"/><circle cx="650" cy="220" r="220" fill="#c9bffb"/><circle cx="300" cy="600" r="240" fill="#eae5ff"/><circle cx="700" cy="700" r="180" fill="#c9bffb"/></g></svg>`);
export const PURPLE_GROUND: CSSProperties = { backgroundColor: '#ddd6ff', backgroundImage: `url("data:image/svg+xml,${SWIRL}")`, backgroundSize: 'cover', backgroundRepeat: 'no-repeat' };

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
  ipadL: { w: 1180, h: 820, label: 'iPad landscape' }, ipadP: { w: 820, h: 1180, label: 'iPad portrait' }, phone: { w: 390, h: 844, label: 'Phone 390 x 844' },
};
type FrameInfo = { kind: FrameKind; w: number; h: number; portrait: boolean; adaptive: boolean };
const FrameCtx = createContext<FrameInfo>({ kind: 'laptop', w: 1280, h: 800, portrait: false, adaptive: false });
export const useFrame = () => useContext(FrameCtx);
export const usePhone = () => useContext(FrameCtx).kind === 'phone';

// Scales its child (natural size) down to fit the box; used by reflowing views
// in portrait so nothing is cut off or runs past its box.
export function AutoFit({ children, width }: { children: ReactNode; width?: number }) {
  const box = useRef<HTMLDivElement>(null); const inner = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(1);
  // A given width is a minimum: if fixed-size content still overflows it (it
  // sits centered, so it spills on both sides), the width grows just enough,
  // then the whole thing scales to fit. Phones get real-size text where it fits.
  const [ww, setWw] = useState(width);
  const grows = useRef(0);
  useLayoutEffect(() => { grows.current = 0; setWw(width); }, [width]);
  useLayoutEffect(() => {
    const b = box.current, c = inner.current; if (!b || !c) return;
    const fit = () => {
      const cw = c.offsetWidth, ch = c.offsetHeight; if (!cw || !ch) return;
      // Grow at most a few times: content that widens with its box (a w-full row) would chase it forever.
      if (ww && c.scrollWidth > cw + 1 && grows.current < 3) { grows.current += 1; setWw(cw + 2 * (c.scrollWidth - cw)); return; }
      setK(Math.min(1, b.clientWidth / cw, b.clientHeight / ch));
    };
    const ro = new ResizeObserver(fit); ro.observe(b); ro.observe(c); fit();
    return () => ro.disconnect();
  }, [ww]);
  // The child sits absolutely so it keeps its natural size; then it is scaled to fit and centered.
  return (
    <div ref={box} className="w-full h-full min-h-0 relative">
      <div ref={inner} className="absolute left-1/2 top-1/2 flex flex-col items-center justify-center" style={{ width: ww ?? 'max-content', transform: `translate(-50%, -50%) scale(${k})`, transformOrigin: 'center' }}>{children}</div>
    </div>
  );
}

// Renders only once scrolled near, so a page of five-device sets stays light.
function Lazy({ children, ratio, device }: { children: ReactNode; ratio: number; device?: string }) {
  const ref = useRef<HTMLDivElement>(null); const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { setOn(true); io.disconnect(); } }, { rootMargin: '600px' });
    io.observe(el); return () => io.disconnect();
  }, []);
  return <div ref={ref} data-device={device} style={{ aspectRatio: `${ratio}` }} className="w-full">{on ? children : null}</div>;
}
function Screen({ kind, land, port, landSize, portSize, adaptive, ground }: { kind: FrameKind; land: ReactNode; port?: ReactNode; landSize: [number, number]; portSize: [number, number]; adaptive?: boolean; ground: CSSProperties }) {
  const f = FRAMES[kind]; const portrait = f.h > f.w;
  let body: ReactNode;
  if (adaptive) {
    body = <FrameCtx.Provider value={{ kind, w: f.w, h: f.h, portrait, adaptive: true }}><div className="w-full h-full relative">{portrait && port ? port : land}</div></FrameCtx.Provider>;
  } else if (kind === 'phone') {
    // Phones get their own layout at real size (teacher, 2026-11-24, "phones
    // need a layout"): the portrait view is drawn at 390 x 844 with usePhone()
    // true, so each view swaps in its phone design; never a scaled-down iPad.
    body = <FrameCtx.Provider value={{ kind, w: f.w, h: f.h, portrait: true, adaptive: false }}><div className="w-full h-full relative overflow-hidden" style={ground}>{port ?? land}</div></FrameCtx.Provider>;
  } else {
    const [dw, dh] = portrait && port ? portSize : landSize;
    const k = Math.min(f.w / dw, f.h / dh);
    body = (
      <FrameCtx.Provider value={{ kind, w: dw, h: dh, portrait, adaptive: false }}><div className="w-full h-full relative overflow-hidden" style={ground}>
        <div className="absolute" style={{ width: dw, height: dh, left: (f.w - dw * k) / 2, top: (f.h - dh * k) / 2, transform: `scale(${k})`, transformOrigin: 'top left' }}>{portrait && port ? port : land}</div>
      </div></FrameCtx.Provider>
    );
  }
  return <Lazy ratio={f.w / f.h} device={`${kind}:${f.w}`}><Scaled w={f.w} h={f.h}>{body}</Scaled></Lazy>;
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
        <div className="rounded-[0.35rem] overflow-hidden" data-device={`laptop:${w}`}><Scaled w={w} h={w * 0.625}>{children}</Scaled></div>
      </div>
      <div className="w-[103%] h-3 rounded-b-[0.9rem]" style={{ background: '#c9c4d6', border: `2px solid ${I}`, borderTop: 'none' }} />
    </div>
  );
}
export function Tablet({ children }: { children: ReactNode }) {
  return (
    <div className="w-full max-w-[21rem] mx-auto rounded-[1.6rem] p-[4%]" style={{ background: '#2a2740', border: `2px solid ${I}` }}>
      <div className="rounded-[0.7rem] overflow-hidden" data-device="ipadP:820"><Scaled w={820} h={1180}>{children}</Scaled></div>
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
      style={yellow ? { background: GO_YELLOW, color: I, border: `3px solid ${I}`, boxShadow: `0 6px 0 ${I}` } : { background: PP.periwinkle, color: '#ffffff', border: `3px solid ${I}`, boxShadow: `0 6px 0 ${PP.grapeDeep}` }}>{children}</span>
  );
}

// Landscape: the 1280 x 800 design scaled to fit the frame and centered (the
// purple ground fills the rest, so it reads as one screen).
function fitDesign(f: FrameInfo, canvas: number): CSSProperties {
  if (!f.adaptive) return { transform: `scale(${canvas / 1280})` };
  const k = Math.min(f.w / 1280, f.h / 800);
  return { transform: `translate(${(f.w - 1280 * k) / 2}px, ${(f.h - 800 * k) / 2}px) scale(${k})` };
}
// The site's own white top menu bar, full width across the frame (teacher,
// 2026-11-24: "bring back the top white bar ... this main tab top menu").
function SiteBar({ f, canvas }: { f: FrameInfo; canvas: number }) { const k = f.adaptive ? Math.min(f.w / 1280, f.h / 800) : canvas / 1280; const dx = f.adaptive ? (f.w - 1280 * k) / 2 : 0; return (
        <div className="absolute left-0 right-0 top-0 z-10 flex items-center" style={{ height: 68 * k, paddingLeft: dx + 40 * k, background: '#fbfcf8', borderBottom: `${Math.max(2, 3 * k)}px solid #000` }}>
          <img src="/brand/gamify-wordmark.png" alt="Gamify" className="w-auto" style={{ height: 36 * k }} draggable={false} />
          {/* The site's own top menu, as a signed-in teacher sees it in a game. */}
          <span className="ml-auto flex items-center" style={{ gap: 10 * k, paddingRight: dx + 40 * k }}>
            {['Home', 'Features', 'Pricing', 'Research', 'Blog'].map((l) => <span key={l} className="font-bold whitespace-nowrap" style={{ fontSize: 17 * k, padding: `0 ${8 * k}px` }}>{l}</span>)}
            {[['Join', '#e4eafe'], ['Log in', '#fdfd94']].map(([l, bg]) => <span key={l} className="rounded-full font-bold whitespace-nowrap" style={{ fontSize: 17 * k, padding: `${6 * k}px ${16 * k}px`, border: `${Math.max(1.5, 2.5 * k)}px solid #000`, background: bg }}>{l}</span>)}
          </span>
        </div>); }
export function SiteBarSmall({ phone }: { phone: boolean }) {
  return (
    <div className="flex items-center shrink-0" style={{ padding: `0 ${phone ? 20 : 40}px`, height: phone ? 48 : 64, background: '#fbfcf8', borderBottom: '3px solid #000' }}>
      <img src="/brand/gamify-wordmark.png" alt="Gamify" className={`${phone ? 'h-6' : 'h-8'} w-auto`} draggable={false} />
      {phone
        ? <span className="ml-auto w-11 h-11 rounded-full grid place-items-center font-bold" style={{ border: "2px solid #000", background: "#fff" }} aria-label="Menu">☰</span>
        : <span className="ml-auto flex items-center gap-3">{['Home', 'Features', 'Pricing', 'Research', 'Blog'].map((l) => <span key={l} className="font-bold text-[15px]">{l}</span>)}{[['Join', '#e4eafe'], ['Log in', '#fdfd94']].map(([l, bg]) => <span key={l} className="rounded-full font-bold px-3 py-1 text-[15px]" style={{ border: '2px solid #000', background: bg }}>{l}</span>)}</span>}
    </div>
  );
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
function MkRound({ children, label, size = 46 }: { children: ReactNode; label: string; size?: number }) {
  return <span aria-label={label} className="rounded-full grid place-items-center shrink-0" style={{ width: size, height: size, background: '#fff', border: `2px solid ${I}`, boxShadow: `0 3px 0 ${I}` }}>{children}</span>;
}
// Next stays off (the blip state, teacher 2026-11-23 sounds) until a card is
// picked on a card-choice step (teacher, 2026-11-24): pale, no lift, still 60px.
export function MenuGo({ children, disabled }: { children: ReactNode; disabled?: boolean }) {
  return <span aria-disabled={disabled || undefined} className="min-h-[60px] px-8 text-[24px] rounded-full font-display font-bold inline-flex items-center justify-center gap-3 whitespace-nowrap" style={disabled ? { background: '#efeee6', color: '#57506e', border: `3px dashed ${I}`, boxShadow: 'none', transform: 'translateY(6px)' } : { background: GO_YELLOW, color: I, border: `3px solid ${I}`, boxShadow: `0 6px 0 ${I}` }}>{children}</span>;
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
        {/* The white top bar with the logo, then one even row: title left, step
            meter in the middle, round buttons right (teacher, 2026-11-24). */}
        <div style={{ margin: `-${phone ? 20 : 28}px -${px}px 0` }}><SiteBarSmall phone={phone} /></div>
        {/* Phone (teacher, 2026-11-24, "stack center"): title, meter and round buttons stacked and centered. */}
        <div className={`mt-5 ${phone ? 'grid gap-3 justify-items-center text-center' : 'grid grid-cols-[1fr_auto_1fr] items-center gap-4'}`}>
          <h2 className={phone ? 'text-center' : 'text-left'} style={{ ...MK_GY, fontSize: phone ? 30 : 38 }}>{title}</h2>
          <Meter segments={total} done={step - 1} part={1} width={total * (phone ? 34 : 44)} label={`Step ${step} of ${total}`} />
          <div className={`flex ${phone ? 'gap-2 justify-center' : 'gap-2 justify-self-end'}`}>
            <MkRound size={phone ? 44 : 48} label="Settings"><GearSix weight="bold" size={phone ? 20 : 22} /></MkRound>
            <MkRound size={phone ? 44 : 48} label="Full screen"><CornersOut weight="bold" size={phone ? 20 : 22} /></MkRound><MkRound size={phone ? 44 : 48} label="Close"><X weight="bold" size={phone ? 20 : 22} /></MkRound>
          </div>
        </div>
        <div className="flex-1 min-h-0 my-5"><AutoFit width={f.w - 2 * px}>{children}</AutoFit></div>
        {/* On a phone an extra button (Add team) takes its own row above Back and Next, so all stay 56px+ and real size. */}
        {phone && extra
          ? <div className="grid gap-3 justify-items-center"><div>{extra}</div><div className="flex justify-center gap-4 items-center">{back && <MenuBack />}{go ?? <MenuGo>Next<ArrowRight weight="bold" size={24} /></MenuGo>}</div></div>
          : phone
            // Back and Next share a row when they fit; a long start button (Start the race) wraps above Back. Both stay real size.
            ? <div className="flex flex-wrap-reverse justify-center items-center gap-3">{back && <MenuBack />}{go ?? <MenuGo>Next<ArrowRight weight="bold" size={24} /></MenuGo>}</div>
          : <div style={{ height: 72 }}><AutoFit>{footer}</AutoFit></div>}
      </div>
    );
  }
  return (
    <div className="w-full h-full relative overflow-hidden" style={PURPLE_GROUND}>
      <SiteBar f={f} canvas={canvas} />
      <div className="absolute top-0 left-0 origin-top-left" style={{ width: 1280, height: 800, color: I, ...fitDesign(f, canvas) }}>
        {/* The white top bar with the logo, then one even row: title fully left,
            step meter in the middle, round buttons right (teacher, 2026-11-24). */}
        <div className="absolute left-10 right-10 top-[96px] bottom-[36px] flex flex-col gap-6">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-6">
            <h2 className="text-[40px] text-left" style={MK_GY}>{title}</h2>
            <Meter segments={total} done={step - 1} part={1} width={total * 52} label={`Step ${step} of ${total}`} />
            <div className="flex gap-2 justify-self-end">
              {/* 50px in the 1280 design so they stay 44px+ when it is fit to an iPad landscape (0.92). */}
              <MkRound label="Settings" size={50}><GearSix weight="bold" size={22} /></MkRound>
              <MkRound label="Full screen" size={50}><CornersOut weight="bold" size={22} /></MkRound><MkRound label="Close" size={50}><X weight="bold" size={22} /></MkRound>
            </div>
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
// A Grow Year title on ONE line (teacher, 2026-11-24: "have the white buttons
// above the title text so the title can be in one row"): starts at `max` and
// shrinks to fit its column; only a name too long even at `min` wraps, onto
// two balanced lines at `min`.
export function FitTitle({ children, max, min, center, style }: { children: string; max: number; min: number; center?: boolean; style?: CSSProperties }) {
  const box = useRef<HTMLHeadingElement>(null);
  const [fs, setFs] = useState(max); const [wrap, setWrap] = useState(false);
  useLayoutEffect(() => {
    const el = box.current; if (!el) return;
    const fit = () => {
      const w = el.clientWidth; if (!w) return;
      // Measure on a hidden copy so React's own inline styles are never touched.
      const probe = el.cloneNode(true) as HTMLElement;
      probe.style.cssText += `;position:absolute;visibility:hidden;white-space:nowrap;width:auto;font-size:${max}px`;
      el.parentElement?.appendChild(probe);
      const natural = probe.scrollWidth; probe.remove();
      const k = Math.floor((max * w) / Math.max(natural, 1));
      if (k >= min) { setFs(Math.min(max, k)); setWrap(false); } else { setFs(min); setWrap(true); }
    };
    fit(); const ro = new ResizeObserver(fit); ro.observe(el);
    document.fonts?.ready.then(fit);
    return () => ro.disconnect();
  }, [children, max, min]);
  return <h1 ref={box} className={`w-full ${center ? 'text-center' : 'text-left'}`} style={{ ...MK_GY, fontSize: fs, lineHeight: wrap ? 1.05 : 0.95, whiteSpace: wrap ? 'normal' : 'nowrap', textWrap: 'balance', ...style } as CSSProperties}>{children}</h1>;
}
// The welcome, newest (teacher, 2026-11-24): the right column, as tall as the
// cover and spread evenly: the round buttons top right (level with the cover
// top), the title on one line across the full column, the description right
// under it (24px, two or three lines), the ways to play, How to play, and the
// yellow start button level with the cover bottom. One left edge for all.
export function WelcomeScreen({ name, desc, modes, steps, cover, go = 'Set up and play', canvas = 1280 }: { name: string; desc: string; modes: string[]; steps: [ReactNode, string][]; cover: ReactNode; go?: string; canvas?: number }) {
  const f = useFrame();
  const chips = (sz: number) => <div className="flex flex-wrap gap-2.5">{modes.map((m, i) => <span key={m} className="px-5 inline-flex items-center rounded-full font-bold" style={{ height: sz * 2.4, fontSize: sz, background: (WAYS_STYLE[m as keyof typeof WAYS_STYLE]?.soft) ?? [PP.gamify, PP.aqua, PP.butter][i % 3], border: `2.5px solid ${I}` }}>{m}</span>)}</div>;
  const how = (big: number) => (
    <div className="rounded-[26px] px-6 py-4 grid gap-3" style={{ background: '#fff', border: `3px solid ${I}`, boxShadow: `0 5px 0 ${I}` }}>
      <h2 style={{ ...MK_GY, fontSize: big + 4 }}>How to play</h2>
      {steps.map(([ic, t], i) => <div key={t} className="flex items-center gap-4 font-bold leading-tight" style={{ fontSize: big }}><IconBadge size={40} bg={[PP.butter, PP.blush, PP.aqua][i % 3]} ring>{ic}</IconBadge>{t}</div>)}
    </div>
  );
  const start = (h: number, fs: number) => <span className="w-full rounded-full font-display font-bold inline-flex items-center justify-center gap-3" style={{ height: h, fontSize: fs, background: GO_YELLOW, color: I, border: `3px solid ${I}`, boxShadow: `0 6px 0 ${I}` }}><Play weight="fill" size={fs + 2} />{go}</span>;
  if (f.adaptive && f.portrait) {
    // Portrait and phone: the round buttons share the white top bar's row, so
    // the title gets its own full line under the cover.
    const phone = f.w < 600, px = phone ? 20 : 40, cw = f.w - 2 * px;
    const coverW = Math.min(cw, f.h * (phone ? 0.34 : 0.4) * 720 / 648);
    const rs = 44;
    return (
      <div className="w-full h-full flex flex-col" style={{ ...PURPLE_GROUND, color: I, padding: `0 ${px}px ${phone ? 20 : 40}px` }}>
        <div style={{ margin: `0 -${px}px` }}>
          <div className="flex items-center shrink-0" style={{ padding: `0 ${phone ? 14 : 40}px 0 ${px}px`, height: phone ? 60 : 68, background: '#fbfcf8', borderBottom: '3px solid #000' }}>
            <img src="/brand/gamify-wordmark.png" alt="Gamify" className={`${phone ? 'h-6' : 'h-8'} w-auto`} draggable={false} />
            <span className="ml-auto flex gap-2.5">
              <MkRound label="Full screen" size={rs}><CornersOut weight="bold" size={20} /></MkRound><MkRound label="Settings" size={rs}><GearSix weight="bold" size={20} /></MkRound>
              {phone ? <MkRound label="Menu" size={rs}><List weight="bold" size={20} /></MkRound> : <span className="flex items-center gap-3 ml-3">{['Home', 'Features', 'Pricing', 'Research', 'Blog'].map((l) => <span key={l} className="font-bold text-[15px]">{l}</span>)}</span>}
            </span>
          </div>
        </div>
        <div aria-hidden="true" className="mt-4 mx-auto rounded-[24px] overflow-hidden relative shrink-0" style={{ width: coverW, height: coverW * 648 / 720, border: `3px solid ${I}`, boxShadow: `0 6px 0 ${I}` }}>
          <div className="absolute top-0 left-0 origin-top-left" style={{ width: 720, height: 648, transform: `scale(${(coverW - 6) / 720})` }}>{cover}</div>
        </div>
        <div className="flex-1 min-h-0 mt-4">
          <AutoFit width={cw}>
            <div className="w-full grid gap-4">
              <div className="grid gap-2"><FitTitle max={phone ? 52 : 64} min={phone ? 32 : 44}>{name}</FitTitle><p className="font-semibold leading-snug" style={{ fontSize: phone ? 20 : 24 }}>{desc}</p></div>
              {chips(phone ? 17 : 18)}
              {how(phone ? 19 : 22)}
              {start(phone ? 64 : 72, phone ? 26 : 30)}
            </div>
          </AutoFit>
        </div>
      </div>
    );
  }
  return (
    <div className="w-full h-full relative overflow-hidden" style={PURPLE_GROUND}>
      <SiteBar f={f} canvas={canvas} />
      <div className="absolute top-0 left-0 origin-top-left" style={{ width: 1280, height: 800, color: I, ...fitDesign(f, canvas) }}>
        <div className="absolute left-10 right-10 top-[100px] bottom-[44px] flex gap-10">
          <div aria-hidden="true" className="w-[720px] h-full rounded-[30px] overflow-hidden relative shrink-0" style={{ border: `3px solid ${I}`, boxShadow: `0 6px 0 ${I}` }}>{cover}</div>
          <div className="flex-1 min-w-0 h-full flex flex-col justify-between">
            <div className="flex justify-end gap-3"><MkRound label="Full screen" size={52}><CornersOut weight="bold" size={24} /></MkRound><MkRound label="Settings" size={52}><GearSix weight="bold" size={24} /></MkRound></div>
            <div className="grid gap-3">
              <FitTitle max={72} min={48}>{name}</FitTitle>
              <p className="font-semibold text-[24px] leading-snug">{desc}</p>
            </div>
            {chips(18)}
            {how(22)}
            {start(72, 30)}
          </div>
        </div>
      </div>
    </div>
  );
}
