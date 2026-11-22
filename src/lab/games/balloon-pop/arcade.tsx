import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { AnimatePresence, motion, type TargetAndTransition, type Transition } from 'motion/react';
import { Play, SpeakerHigh } from '@phosphor-icons/react';
import type { MultipleChoiceQuestion } from '../../../data/types';
import { speak } from '../../../engine/feedback';
import { playClip } from '../../../engine/music';
import { TeamBadge } from '../../../engine/TeamBadge';
import { TEAM_COLORS } from '../../../engine/turns';
import { volume, type PlayerSettings } from '../../../settings/settings';
import type { LabCtx, LabPower } from '../../types';

// The shared runtime of the "Arcade answers" Game Lab games (Maze Dash, Sky
// Flyer, Fruit Fling, Balloon Pop, Mole Bop). A question sits on a banner at
// the top and its answers are the targets in the world below. Each player
// (or team, on its turn) plays one short timed burst: a right target scores
// and brings the next question (and sometimes a surprise power-up), a wrong
// one is a gentle boing and three seconds off the clock. The burst pauses
// while a power-up card is open. Lives in the Balloon Pop folder because the
// Lab kit has no shared folder for games (see the report); the other four
// games import it from here.

export type FxId = 'slow' | 'magnet' | 'shield' | 'double' | 'time' | 'freeze' | 'giant' | 'flip' | 'wobble' | 'chickens';
const FX_LEN: Partial<Record<FxId, number>> = { slow: 8, double: 10, freeze: 5, giant: 9, flip: 7, wobble: 6, chickens: 6 };
export const BURST_SECONDS = 30;
const WRONG_COST = 3;

export interface Floater { id: number; x: number; y: number; text: string; tone: 'good' | 'oops' | 'info' }
export interface Bit { id: number; x: number; y: number; color: string; kind: 'confetti' | 'juice' | 'star' | 'puff' | 'feather' }

export interface Arcade {
  phase: 'ready' | 'play' | 'done';
  running: boolean;
  cheering: boolean;
  q: MultipleChoiceQuestion | null;
  qn: number;
  left: number;
  seconds: number;
  t: number;
  speed: number;
  on: (id: FxId) => boolean;
  magnet: boolean;
  shield: boolean;
  W: number;
  H: number;
  u: number;
  turn: number;
  answer: (choice: number, x: number, y: number) => 'right' | 'wrong' | 'shielded' | 'ignored';
  hurt: (x: number, y: number, cost?: number) => boolean;
  start: () => void;
  float: (x: number, y: number, text: string, tone?: Floater['tone']) => void;
  bits: (x: number, y: number, n: number, kind: Bit['kind'], colors?: string[]) => void;
  burst: (x: number, y: number, size?: 'small' | 'big') => void;
  ctx: LabCtx;
}

interface Opts {
  seconds?: number;
  powerChance?: number;
  // Called every frame while the burst runs: dt is the world's time step
  // (slowed by Slow-mo, 0 under Freeze), real is the clock's.
  step: (dt: number, real: number, ar: Arcade) => void;
  onQuestion?: (q: MultipleChoiceQuestion, ar: Arcade) => void;
  onStart?: (ar: Arcade) => void;
  onPower?: (p: LabPower, ar: Arcade) => void;
  // Height of the world in units (width follows the box).
  minAspect?: number;
  maxAspect?: number;
}

const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

export function useArcade(ctx: LabCtx, opts: Opts) {
  const c = useRef(ctx); c.current = ctx;
  const o = useRef(opts); o.current = opts;
  const seconds = opts.seconds ?? BURST_SECONDS;
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 1000, h: 700 });
  const [, setTick] = useState(0);
  const phase = useRef<Arcade['phase']>('ready');
  const pause = useRef<null | 'cheer' | 'card'>(null);
  const q = useRef<MultipleChoiceQuestion | null>(null);
  const qn = useRef(0);
  const left = useRef(seconds);
  const t = useRef(0);
  const fx = useRef<Partial<Record<FxId, number>>>({});
  const magnetLeft = useRef(0);
  const magnetOn = useRef(false);
  const shield = useRef(false);
  const missedQ = useRef(false);
  const token = useRef(0);
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [bitsList, setBits] = useState<Bit[]>([]);
  const [flash, setFlash] = useState<{ id: FxId; key: number } | null>(null);
  const ar = useRef<Arcade>(null as unknown as Arcade);

  useLayoutEffect(() => {
    const el = box.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const minA = opts.minAspect ?? 0.7, maxA = opts.maxAspect ?? 2.2;
  const aspect = Math.min(maxA, Math.max(minA, size.w / Math.max(1, size.h)));
  const H = 100, W = Math.round(H * aspect * 10) / 10;
  const u = Math.min(size.h / H, size.w / W);

  const on = (id: FxId) => (fx.current[id] ?? -1) > t.current;
  const speed = on('freeze') ? 0 : pause.current === 'cheer' ? 0.12 : on('slow') ? 0.45 : 1;

  // World points to the overlay's points (the world turns over on Upside Down).
  const sc = (x: number, y: number): [number, number] => ((fx.current.flip ?? -1) > t.current ? [ar.current.W - x, H - y] : [x, y]);
  const float = useCallback((x0: number, y0: number, text: string, tone: Floater['tone'] = 'good') => {
    const [x, y] = sc(x0, y0);
    const id = Date.now() + Math.random();
    setFloaters((f) => [...f.slice(-8), { id, x, y, text, tone }]);
    window.setTimeout(() => setFloaters((f) => f.filter((v) => v.id !== id)), 1300);
  }, []);
  const bits = useCallback((x0: number, y0: number, n: number, kind: Bit['kind'], colors = ['#fdfd94', '#ef7d96', '#8fe3a0', '#b4c4fb', '#f5a08c']) => {
    if (c.current.still) return;
    const [x, y] = sc(x0, y0);
    const list = Array.from({ length: n }, (_, i) => ({ id: Date.now() + Math.random() + i, x, y, color: colors[i % colors.length], kind }));
    setBits((b) => [...b.slice(-60), ...list]);
    window.setTimeout(() => setBits((b) => b.filter((v) => !list.includes(v))), 1300);
  }, []);
  const burst = useCallback((x0: number, y0: number, size2: 'small' | 'big' = 'small') => {
    const el = box.current; if (!el) return;
    const [x, y] = sc(x0, y0);
    const R = el.getBoundingClientRect();
    const fw = ar.current.W * ar.current.u, fh = H * ar.current.u;
    const r = { left: R.left + (R.width - fw) / 2, top: R.top + (R.height - fh) / 2, width: fw, height: fh };
    c.current.burst((r.left + (x / ar.current.W) * r.width) / window.innerWidth, (r.top + (y / H) * r.height) / window.innerHeight, size2);
  }, []);

  function newQuestion() {
    const x = c.current;
    q.current = x.draw();
    qn.current += 1;
    missedQ.current = false;
    magnetOn.current = magnetLeft.current > 0;
    if (magnetLeft.current > 0) magnetLeft.current -= 1;
    o.current.onQuestion?.(q.current, ar.current);
  }

  function apply(p: LabPower) {
    const x = c.current;
    const id = p.id as FxId;
    if (id === 'time') left.current += 5;
    else if (id === 'magnet') magnetLeft.current = 2;
    else if (id === 'shield') shield.current = true;
    else fx.current[id] = t.current + (FX_LEN[id] ?? 6);
    setFlash({ id, key: Date.now() });
    fxSound(id, x);
    x.say(`${p.name}!`, p.silly ? 'oops' : 'good');
    o.current.onPower?.(p, ar.current);
  }

  const answer: Arcade['answer'] = (choice, px, py) => {
    const x = c.current;
    if (phase.current !== 'play' || pause.current || !q.current) return 'ignored';
    const qq = q.current;
    if (choice === qq.correctIndex) {
      x.log(qq, !missedQ.current);
      const pts = on('double') ? 2 : 1;
      x.points(pts);
      x.sfx.right(); window.setTimeout(() => c.current.sfx.coin(), 120);
      float(px, py, `+${pts}`, 'good');
      bits(px, py, 14, 'star', ['#fdfd94', '#f6c544', '#fff']);
      burst(px, py);
      const my = token.current;
      pause.current = 'cheer';
      void (async () => {
        await wait(700);
        if (token.current !== my) return;
        pause.current = 'card';
        const p = await c.current.power(o.current.powerChance ?? 0.38);
        if (token.current !== my) return;
        if (p) apply(p);
        newQuestion();
        pause.current = null;
      })();
      return 'right';
    }
    if (shield.current) {
      shield.current = false;
      x.sfx.zap(); float(px, py, 'Shield!', 'info');
      return 'shielded';
    }
    missedQ.current = true;
    left.current = Math.max(0.5, left.current - WRONG_COST);
    x.sfx.boing();
    float(px, py, `-${WRONG_COST}s`, 'oops');
    return 'wrong';
  };

  const hurt: Arcade['hurt'] = (px, py, cost = 0) => {
    const x = c.current;
    if (phase.current !== 'play') return false;
    if (shield.current) { shield.current = false; x.sfx.zap(); float(px, py, 'Shield!', 'info'); return false; }
    x.sfx.boing();
    if (cost) left.current = Math.max(0.5, left.current - cost);
    float(px, py, cost ? `-${cost}s` : 'Oops!', 'oops');
    return true;
  };

  const start = () => {
    if (phase.current !== 'ready') return;
    const x = c.current;
    phase.current = 'play';
    x.sfx.whistle();
    newQuestion();
    o.current.onStart?.(ar.current);
    setTick((n) => n + 1);
  };

  // A fresh burst on every turn.
  useEffect(() => {
    token.current += 1;
    phase.current = 'ready'; pause.current = null; q.current = null;
    left.current = seconds; t.current = 0; fx.current = {}; magnetLeft.current = 0; magnetOn.current = false; shield.current = false;
    if (ar.current) o.current.onStart?.(ar.current);
    setTick((n) => n + 1);
    if (!c.current.cpu) return;
    const id = window.setTimeout(() => start(), 1800);
    return () => window.clearTimeout(id);
  }, [ctx.taken]); // eslint-disable-line react-hooks/exhaustive-deps

  // The one frame loop.
  useEffect(() => {
    let raf = 0, last = performance.now();
    const loop = (now: number) => {
      const real = Math.min(0.05, (now - last) / 1000); last = now;
      if (phase.current === 'play' && pause.current !== 'card') {
        const a = ar.current;
        if (!pause.current) { t.current += real; left.current -= real; }
        o.current.step(real * a.speed, real, a);
        if (left.current <= 0 && phase.current === 'play' && !pause.current) {
          phase.current = 'done';
          const x = c.current;
          x.sfx.whistle(); x.say("Time's up!", 'big');
          const my = token.current;
          window.setTimeout(() => { if (token.current === my) c.current.next(); }, 2000);
        }
        setTick((n) => (n + 1) % 1e6);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => () => { token.current += 1; }, []);

  ar.current = {
    phase: phase.current, running: phase.current === 'play' && !pause.current, cheering: pause.current === 'cheer',
    q: q.current, qn: qn.current, left: Math.max(0, left.current), seconds, t: t.current, speed,
    on, magnet: magnetOn.current, shield: shield.current, W, H, u, turn: ctx.taken,
    answer, hurt, start, float, bits, burst, ctx,
  };
  return { ar: ar.current, box, floaters, bits: bitsList, flash };
}

// Every power-up's own sound when it fires.
function fxSound(id: FxId, x: LabCtx) {
  const s = x.sfx;
  if (id === 'slow') s.slideDown();
  else if (id === 'magnet') s.magnet();
  else if (id === 'shield') { s.build(); window.setTimeout(() => s.bell(), 200); }
  else if (id === 'double') { s.coin(); window.setTimeout(() => s.coin(), 160); }
  else if (id === 'time') { s.tick(); window.setTimeout(() => s.tick(), 120); window.setTimeout(() => s.note(9), 260); }
  else if (id === 'freeze') s.freeze();
  else if (id === 'giant') s.slideUp();
  else if (id === 'flip') s.whoosh();
  else if (id === 'wobble') { s.boing(); window.setTimeout(() => s.boing(), 260); }
  else if (id === 'chickens') squawk(x.settings);
}

// A tiny synth for the squeaky sounds the kit has no clip for.
let audio: AudioContext | null = null;
export function synth(s: PlayerSettings, list: { f: number; to?: number; len: number; at?: number; type?: OscillatorType; gain?: number }[]) {
  if (typeof window === 'undefined') return;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  audio ??= new AC();
  if (audio.state === 'suspended') void audio.resume();
  const g0 = volume(s, 'effects') * 0.2;
  if (g0 <= 0) return;
  const wob = 0.93 + Math.random() * 0.14;
  for (const v of list) {
    const osc = audio.createOscillator(), g = audio.createGain();
    const st = audio.currentTime + (v.at ?? 0);
    osc.type = v.type ?? 'triangle';
    osc.frequency.setValueAtTime(v.f * wob, st);
    if (v.to) osc.frequency.exponentialRampToValueAtTime(v.to * wob, st + v.len);
    g.gain.setValueAtTime(0.0001, st);
    g.gain.exponentialRampToValueAtTime(g0 * (v.gain ?? 1), st + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, st + v.len);
    osc.connect(g).connect(audio.destination);
    osc.start(st); osc.stop(st + v.len + 0.02);
  }
}
export const squawk = (s: PlayerSettings) => synth(s, [{ f: 900, to: 1500, len: 0.12, type: 'sawtooth', gain: 0.35 }, { f: 1400, to: 700, len: 0.22, at: 0.1, type: 'sawtooth', gain: 0.3 }]);
export const squeak = (s: PlayerSettings) => synth(s, [{ f: 1800, to: 2600, len: 0.09, gain: 0.5 }, { f: 2500, to: 1500, len: 0.12, at: 0.08, gain: 0.45 }]);
export const clip = (src: string, s: PlayerSettings, level = 0.7) => playClip(src, s, level);

// ---------- Power-up list builder ----------

const img = (src: string) => <img src={src} alt="" aria-hidden="true" draggable={false} className="w-full h-full object-contain" />;
export function arcadePowers(game: string, names: Partial<Record<FxId, { name: string; desc: string }>>): LabPower[] {
  const base = `/lab/${game}`;
  const all: Record<FxId, Omit<LabPower, 'id' | 'name' | 'desc'>> = {
    slow: { art: <SnailArt />, enter: 'drop' },
    magnet: { art: img(`${base}/magnet.webp`), enter: 'spin' },
    shield: { art: img(`${base}/shield.webp`), enter: 'drop' },
    double: { art: <DoubleArt />, enter: 'spin' },
    time: { art: img(`${base}/time.webp`), enter: 'zoom' },
    freeze: { art: img(`${base}/ice.webp`), enter: 'drop' },
    giant: { art: img(`${base}/potion.webp`), enter: 'zoom' },
    flip: { art: <FlipArt />, silly: true },
    wobble: { art: <WobbleArt />, silly: true },
    chickens: { art: <ChickenArt />, silly: true },
  };
  return (Object.keys(names) as FxId[]).map((id) => ({ id, ...names[id]!, ...all[id] }));
}

export function SnailArt() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <path d="M10 78 Q30 70 52 72 L86 74 Q94 74 92 80 Q60 86 12 84 Z" fill="#8fe3a0" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <circle cx="46" cy="52" r="26" fill="#f5a08c" stroke="#000" strokeWidth="4" />
      <path d="M46 52 m-4 0 a4 4 0 1 1 8 0 a10 10 0 1 1 -18 0 a16 16 0 1 1 30 2" fill="none" stroke="#000" strokeWidth="4" strokeLinecap="round" />
      <path d="M78 74 L82 50 M86 74 L94 52" stroke="#000" strokeWidth="4" strokeLinecap="round" />
      <circle cx="82" cy="48" r="5" fill="#fff" stroke="#000" strokeWidth="3" /><circle cx="94" cy="50" r="5" fill="#fff" stroke="#000" strokeWidth="3" />
      <path d="M20 30 h14 M16 40 h10" stroke="#241c3d" strokeWidth="4" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}
export function DoubleArt() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="42" fill="#f6c544" stroke="#000" strokeWidth="5" />
      <circle cx="50" cy="50" r="32" fill="#fdfd94" stroke="#000" strokeWidth="3" />
      <text x="50" y="63" textAnchor="middle" fontFamily="var(--font-display, sans-serif)" fontSize="36" fontWeight="900" fill="#241c3d">x2</text>
      <path d="M22 26 l6 6 M76 22 l-5 7" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}
export function FlipArt() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="42" fill="#b4c4fb" stroke="#000" strokeWidth="5" />
      <g transform="rotate(180 50 50)">
        <circle cx="50" cy="50" r="22" fill="#fdfd94" stroke="#000" strokeWidth="4" />
        <circle cx="42" cy="45" r="3.5" fill="#000" /><circle cx="58" cy="45" r="3.5" fill="#000" />
        <path d="M40 57 Q50 66 60 57" stroke="#000" strokeWidth="4" fill="none" strokeLinecap="round" />
      </g>
      <path d="M18 40 a34 34 0 0 1 30 -28 M82 60 a34 34 0 0 1 -30 28" stroke="#000" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M44 6 l8 7 -9 5z M56 94 l-8 -7 9 -5z" fill="#000" />
    </svg>
  );
}
export function WobbleArt() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <path d="M22 80 Q14 50 26 34 Q50 14 74 34 Q86 50 78 80 Q50 90 22 80 Z" fill="#8fe3a0" stroke="#000" strokeWidth="5" strokeLinejoin="round" />
      <path d="M32 40 Q40 32 50 34" stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round" />
      <circle cx="40" cy="56" r="4" fill="#000" /><circle cx="60" cy="56" r="4" fill="#000" />
      <path d="M42 68 Q46 64 50 68 T58 68" stroke="#000" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M8 50 q4 -6 0 -12 M92 50 q-4 -6 0 -12" stroke="#000" strokeWidth="4" fill="none" strokeLinecap="round" />
    </svg>
  );
}
export function ChickenArt({ flat }: { flat?: boolean }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      {!flat && <circle cx="50" cy="50" r="44" fill="#f5a08c" stroke="#000" strokeWidth="5" />}
      <g transform={flat ? undefined : 'rotate(-18 50 50)'}>
        <path d="M30 70 Q22 56 30 46 L56 40 Q72 38 76 46 Q80 58 70 66 Q52 78 30 70 Z" fill="#fdfd94" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
        <path d="M30 46 Q26 30 34 22 Q44 18 46 30 L46 42" fill="#fdfd94" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
        <path d="M34 22 q2 -8 6 -6 q2 -6 6 -2 q4 -2 3 6" fill="#ef7d96" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
        <path d="M30 30 l-10 3 10 4z" fill="#f6a623" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
        <circle cx="37" cy="29" r="2.6" fill="#000" />
        <path d="M76 48 l12 -4 -4 10 8 2 -12 6" fill="#fdfd94" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
        <path d="M48 52 Q58 48 62 56" stroke="#000" strokeWidth="3" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}

// ---------- The frame every arcade game draws inside ----------

export function ArcadeFrame({ ar, box, floaters, bits, flash, children, hint, label, extra, bg, banner = true, rain = true }: {
  ar: Arcade; box: RefObject<HTMLDivElement>; floaters: Floater[]; bits: Bit[]; flash: { id: FxId; key: number } | null;
  children: ReactNode; hint: ReactNode; label: string; extra?: ReactNode; bg: string; banner?: boolean; rain?: boolean;
}) {
  const ctx = ar.ctx;
  const still = ctx.still;
  const flip = ar.on('flip');
  const wobble = ar.on('wobble') && !still;
  const style = { '--u': `${ar.u}px`, background: bg } as CSSProperties;
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div ref={box} className="absolute inset-0" />
      <div className="relative rounded-panel border-heavy border-border overflow-hidden select-none touch-none" aria-label={label} role="application"
        style={{ ...style, width: ar.W * ar.u, height: ar.H * ar.u, boxShadow: '0 8px 0 #000, 0 24px 44px rgba(36,28,61,0.3)' }}>
        <motion.div className="absolute inset-0" animate={wobble ? { rotate: [0, -2.2, 2.2, -1.4, 1.4, 0], x: [0, -8, 8, -5, 5, 0] } : { rotate: flip ? 180 : 0, x: 0 }}
          transition={wobble ? { duration: 0.9, repeat: Infinity } : { type: 'spring', stiffness: 70, damping: 13 }}>
          {children}
        </motion.div>
        <Persist ar={ar} rain={rain} />
        <div className="absolute inset-0 pointer-events-none">
          {bits.map((b) => <BitView key={b.id} b={b} ar={ar} />)}
          <AnimatePresence>
            {floaters.map((f) => (
              <motion.span key={f.id} className="absolute font-display leading-none whitespace-nowrap" style={{ left: `${(f.x / ar.W) * 100}%`, top: `${f.y}%`, fontSize: `calc(var(--u) * ${f.tone === 'good' ? 9 : 6})`, color: f.tone === 'good' ? '#fdfd94' : f.tone === 'oops' ? '#ffd2c2' : '#b4f0ff', WebkitTextStroke: '0.12em #000', paintOrder: 'stroke fill', x: '-50%' }}
                initial={{ y: 0, opacity: 0, scale: 0.4 }} animate={{ y: still ? 0 : -60, opacity: [0, 1, 1, 0], scale: 1 }} transition={{ duration: 1.2, ease: 'easeOut' }}>{f.text}</motion.span>
            ))}
          </AnimatePresence>
        </div>
        <AnimatePresence>{flash && <FxFlash key={flash.key} id={flash.id} still={still} />}</AnimatePresence>
        {banner && <Banner ar={ar} />}
        {extra}
        <AnimatePresence>{ar.phase === 'ready' && <ReadyCard key={ar.turn} ar={ar} hint={hint} />}</AnimatePresence>
      </div>
    </div>
  );
}

function BitView({ b, ar }: { b: Bit; ar: Arcade }) {
  const [dir] = useState(() => ({ a: Math.random() * Math.PI * 2, d: 6 + Math.random() * 14, r: Math.random() * 540 - 270 }));
  const dx = Math.cos(dir.a) * dir.d, dy = Math.sin(dir.a) * dir.d;
  const sz = b.kind === 'puff' ? 7 : b.kind === 'juice' ? 3.2 : b.kind === 'feather' ? 4 : 2.6;
  const shape = b.kind === 'star'
    ? <svg viewBox="0 0 20 20" className="w-full h-full"><path d="M10 1l2.6 6 6.4.6-4.9 4.2 1.5 6.3L10 14.8 4.4 18.1l1.5-6.3L1 7.6l6.4-.6z" fill={b.color} stroke="#000" strokeWidth="1.4" /></svg>
    : b.kind === 'feather'
      ? <svg viewBox="0 0 20 20" className="w-full h-full"><path d="M3 17 Q4 6 16 3 Q14 14 3 17Z" fill="#fdfd94" stroke="#000" strokeWidth="1.3" /></svg>
      : <span className="block w-full h-full" style={{ background: b.color, borderRadius: b.kind === 'confetti' ? '2px' : '50%', border: b.kind === 'puff' ? 'none' : '1.5px solid #000', opacity: b.kind === 'puff' ? 0.85 : 1 }} />;
  return (
    <motion.span className="absolute" style={{ left: `${(b.x / ar.W) * 100}%`, top: `${b.y}%`, width: `calc(var(--u) * ${sz})`, height: `calc(var(--u) * ${sz})`, marginLeft: `calc(var(--u) * ${-sz / 2})`, marginTop: `calc(var(--u) * ${-sz / 2})` }}
      initial={{ x: 0, y: 0, scale: b.kind === 'puff' ? 0.4 : 1, opacity: 1, rotate: 0 }}
      animate={{ x: `calc(var(--u) * ${dx})`, y: [`calc(var(--u) * 0)`, `calc(var(--u) * ${dy - 4})`, `calc(var(--u) * ${dy + (b.kind === 'juice' || b.kind === 'confetti' ? 14 : b.kind === 'feather' ? 10 : 2)})`], scale: b.kind === 'puff' ? 1.6 : 0.6, opacity: [1, 1, 0], rotate: dir.r }}
      transition={{ duration: b.kind === 'feather' ? 1.25 : 0.9, ease: 'easeOut' }}>{shape}</motion.span>
  );
}

// The question on a banner at the top, the clock on its right.
function Banner({ ar }: { ar: Arcade }) {
  const q = ar.q;
  const long = (q?.prompt.length ?? 0) > 70;
  const frac = ar.left / ar.seconds;
  const low = ar.left < 6;
  return (
    <div className="absolute left-[1.5%] right-[1.5%] top-[2%] flex items-stretch gap-[1.5%] pointer-events-none" style={{ height: 'calc(var(--u) * 15)' }}>
      <AnimatePresence mode="popLayout">
        <motion.div key={ar.qn} className="flex-1 min-w-0 bg-surface border-heavy border-border rounded-panel flex items-center gap-3 px-3 pointer-events-auto"
          style={{ boxShadow: '0 5px 0 #000' }} initial={ar.ctx.still ? false : { y: -80, rotate: -2, opacity: 0 }} animate={{ y: 0, rotate: 0, opacity: 1 }} exit={{ y: -80, opacity: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }}>
          {q && (
            <button type="button" aria-label="Read the question aloud" onClick={() => speak(q.prompt, ar.ctx.settings)}
              className="shrink-0 w-11 h-11 rounded-full border-bold border-border bg-accent grid place-items-center motion-safe:hover:scale-110 motion-safe:transition-transform">
              <SpeakerHigh weight="fill" size={22} aria-hidden="true" />
            </button>
          )}
          <h2 className="flex-1 min-w-0 font-bold text-center leading-tight text-balance m-0" style={{ fontSize: `calc(var(--u) * ${long ? 3.6 : 4.8})`, color: '#241c3d' }} aria-live="polite">
            {q ? q.prompt : ' '}
          </h2>
          {q?.imageUrl && <img src={q.imageUrl} alt={q.imageAlt ?? ''} className="h-[85%] w-auto rounded-lg border-std border-border object-contain bg-white" />}
        </motion.div>
      </AnimatePresence>
      <motion.div className="shrink-0 aspect-square h-full rounded-full border-heavy border-border grid place-items-center relative" aria-label={`${Math.ceil(ar.left)} seconds left`}
        style={{ background: `conic-gradient(${low ? '#ef7d96' : '#8fe3a0'} ${frac * 360}deg, #fbfcf8 0deg)`, boxShadow: '0 5px 0 #000' }}
        animate={low && !ar.ctx.still && ar.running ? { scale: [1, 1.08, 1] } : { scale: 1 }} transition={{ duration: 0.5, repeat: low ? Infinity : 0 }}>
        <span className="font-display leading-none rounded-full bg-surface border-std border-border grid place-items-center" style={{ width: '64%', height: '64%', fontSize: 'calc(var(--u) * 5)' }}>{Math.ceil(ar.left)}</span>
      </motion.div>
      <FxChips ar={ar} />
    </div>
  );
}

const CHIP: Partial<Record<FxId, string>> = { slow: 'Slow-mo', double: 'x2', freeze: 'Freeze', giant: 'Giant', flip: 'Upside down', wobble: 'Wobble', chickens: 'Chickens' };
function FxChips({ ar }: { ar: Arcade }) {
  const list = (Object.keys(CHIP) as FxId[]).filter((id) => ar.on(id));
  const tags = [...list.map((id) => CHIP[id]!), ...(ar.shield ? ['Shield'] : []), ...(ar.magnet ? ['Magnet'] : [])];
  if (!tags.length) return null;
  return (
    <div className="absolute right-0 flex gap-1.5 justify-end flex-wrap" style={{ top: 'calc(var(--u) * 16.5)' }}>
      {tags.map((s) => (
        <motion.span key={s} layout initial={{ scale: 0 }} animate={{ scale: 1 }} className="rounded-full border-std border-border bg-accent font-bold px-2.5 py-0.5 whitespace-nowrap" style={{ fontSize: 'calc(var(--u) * 2.8)', boxShadow: '0 2px 0 #000' }}>{s}</motion.span>
      ))}
    </div>
  );
}

function ReadyCard({ ar, hint }: { ar: Arcade; hint: ReactNode }) {
  const p = ar.ctx.player;
  const still = ar.ctx.still;
  useEffect(() => {
    if (ar.ctx.cpu) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ar.start(); } };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [ar]);
  return (
    <motion.div className="absolute inset-0 z-30 grid place-items-center bg-ink-night/45" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="grid justify-items-center gap-[calc(var(--u)*3)]" initial={still ? false : { scale: 0.6, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 1.2, opacity: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}>
        <span className="relative grid place-items-center" style={{ width: 'calc(var(--u) * 34)', height: 'calc(var(--u) * 34)' }}>
          <span aria-hidden="true" className="absolute inset-0 rounded-full pu-rays" />
          <span className={still ? '' : 'pu-bob'}><TeamBadge colorIndex={p.colorIndex} size={Math.round(ar.u * 20)} /></span>
        </span>
        <span className="bg-surface border-std border-border rounded-full px-4 py-1.5 font-bold flex items-center gap-2" style={{ fontSize: 'calc(var(--u) * 3.6)' }}>{hint}</span>
        {!ar.ctx.cpu && (
          <motion.button type="button" onClick={() => ar.start()} autoFocus className="min-h-16 px-10 rounded-panel border-heavy border-border bg-accent font-display inline-flex items-center gap-3"
            style={{ fontSize: 'calc(var(--u) * 7)', boxShadow: 'var(--shadow-sticker)' }} whileHover={still ? undefined : { scale: 1.05 }} whileTap={{ scale: 0.94 }}
            animate={still ? undefined : { scale: [1, 1.04, 1] }} transition={{ duration: 1.4, repeat: Infinity }}>
            <Play weight="fill" aria-hidden="true" />Go!
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  );
}

// Effects that stay on screen while a power-up lasts.
function Persist({ ar, rain }: { ar: Arcade; rain: boolean }) {
  const still = ar.ctx.still;
  return (
    <div className="absolute inset-0 pointer-events-none">
      {ar.on('slow') && <div className="absolute inset-0" style={{ boxShadow: 'inset 0 0 calc(var(--u) * 14) rgba(110,140,255,0.55)', background: 'rgba(120,140,255,0.08)' }} />}
      {ar.on('freeze') && (
        <div className="absolute inset-0" style={{ boxShadow: 'inset 0 0 calc(var(--u) * 12) rgba(220,245,255,0.95), inset 0 0 0 calc(var(--u) * 1.4) rgba(190,235,255,0.9)', background: 'rgba(200,240,255,0.18)' }}>
          {[8, 30, 55, 80, 94].map((x, i) => <span key={x} className="absolute" style={{ left: `${x}%`, top: i % 2 ? '-1%' : '95%', width: 'calc(var(--u) * 6)', height: 'calc(var(--u) * 6)' }}><Flake /></span>)}
        </div>
      )}
      {ar.on('double') && (
        <motion.div className="absolute inset-0" style={{ boxShadow: 'inset 0 0 calc(var(--u) * 10) rgba(253,220,80,0.75)' }} animate={still ? undefined : { opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.2, repeat: Infinity }} />
      )}
      {rain && ar.on('chickens') && <ChickenRain still={still} />}
      {ar.on('slow') && (
        <motion.span className="absolute" style={{ bottom: '2%', width: 'calc(var(--u) * 12)', height: 'calc(var(--u) * 12)' }} initial={{ left: '16%' }} animate={{ left: '105%' }} transition={{ duration: 8, ease: 'linear' }}><SnailArt /></motion.span>
      )}
    </div>
  );
}

function Flake() {
  return <svg viewBox="0 0 20 20" className="w-full h-full"><path d="M10 1v18M2 5.5l16 9M2 14.5l16-9" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" /><path d="M10 1v18M2 5.5l16 9M2 14.5l16-9" stroke="#7fc8f0" strokeWidth="1" strokeLinecap="round" /></svg>;
}

function ChickenRain({ still }: { still: boolean }) {
  const [list] = useState(() => Array.from({ length: 9 }, (_, i) => ({ id: i, x: 4 + i * 11 + Math.random() * 5, d: 1.6 + Math.random() * 1.4, delay: Math.random() * 1.8, r: Math.random() * 720 - 360, s: 7 + Math.random() * 5 })));
  if (still) return null;
  return (
    <>
      {list.map((c2) => (
        <motion.span key={c2.id} className="absolute" style={{ left: `${c2.x}%`, width: `calc(var(--u) * ${c2.s})`, height: `calc(var(--u) * ${c2.s})` }}
          initial={{ top: '-15%', rotate: 0 }} animate={{ top: '110%', rotate: c2.r }} transition={{ duration: c2.d, delay: c2.delay, repeat: Infinity, ease: 'easeIn' }}>
          <ChickenArt flat />
        </motion.span>
      ))}
    </>
  );
}

// The one-shot animation every power-up plays when it fires.
function FxFlash({ id, still }: { id: FxId; still: boolean }) {
  const pic = (node: ReactNode, anim: TargetAndTransition, trans: Transition = { duration: 1.3 }) => (
    <motion.span className="absolute left-1/2 top-1/2" style={{ width: 'calc(var(--u) * 30)', height: 'calc(var(--u) * 30)', marginLeft: 'calc(var(--u) * -15)', marginTop: 'calc(var(--u) * -15)' }}
      animate={anim} transition={trans}>{node}</motion.span>
  );
  if (still) return null;
  return (
    <motion.div className="absolute inset-0 pointer-events-none z-20" initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {id === 'slow' && <motion.div className="absolute inset-0" style={{ background: 'radial-gradient(circle, rgba(120,140,255,0.5), transparent 70%)' }} initial={{ scale: 0.2, opacity: 1 }} animate={{ scale: 2, opacity: 0 }} transition={{ duration: 1.2 }} />}
      {id === 'slow' && pic(<SnailArt />, { x: ['-60vw', '0vw', '0vw', '60vw'], scale: [0.8, 1, 1, 0.8] }, { duration: 2, times: [0, 0.35, 0.65, 1] })}
      {id === 'magnet' && <>
        {[0, 1, 2].map((i) => <motion.span key={i} className="absolute left-1/2 top-1/2 rounded-full border-[6px] border-[#ef4f5f]" style={{ width: 'calc(var(--u) * 20)', height: 'calc(var(--u) * 20)', marginLeft: 'calc(var(--u) * -10)', marginTop: 'calc(var(--u) * -10)' }} initial={{ scale: 3, opacity: 0 }} animate={{ scale: 0.3, opacity: [0, 1, 0] }} transition={{ duration: 0.8, delay: i * 0.25 }} />)}
        {pic(<img src="/lab/balloon-pop/magnet.webp" alt="" className="w-full h-full" />, { rotate: [0, -25, 25, -15, 0], scale: [0, 1.1, 1, 1, 0] }, { duration: 1.5 })}
      </>}
      {id === 'shield' && <>
        <motion.span className="absolute left-1/2 top-1/2 rounded-full border-[8px] border-[#7fd6e3]" style={{ width: 'calc(var(--u) * 30)', height: 'calc(var(--u) * 30)', marginLeft: 'calc(var(--u) * -15)', marginTop: 'calc(var(--u) * -15)' }} initial={{ scale: 0.5, opacity: 1 }} animate={{ scale: 4, opacity: 0 }} transition={{ duration: 0.9, delay: 0.4 }} />
        {pic(<img src="/lab/balloon-pop/shield.webp" alt="" className="w-full h-full" />, { y: ['-70vh', '0vh', '0vh', '0vh'], scale: [1, 1.15, 1, 0], rotate: [-20, 0, 0, 0] }, { duration: 1.5, times: [0, 0.3, 0.75, 1] })}
      </>}
      {id === 'double' && pic(<DoubleArt />, { rotateY: [0, 720], scale: [0, 1.3, 1, 0] }, { duration: 1.4 })}
      {id === 'time' && pic(<img src="/lab/balloon-pop/time.webp" alt="" className="w-full h-full" />, { rotate: [0, 360, 360], scale: [0, 1.1, 0] }, { duration: 1.4 })}
      {id === 'freeze' && <>
        <motion.div className="absolute inset-0" style={{ background: 'radial-gradient(circle, rgba(230,250,255,0.9), rgba(170,225,255,0.35) 60%, transparent 80%)' }} initial={{ scale: 0, opacity: 1 }} animate={{ scale: 2.4, opacity: 0 }} transition={{ duration: 1.1 }} />
        {Array.from({ length: 8 }, (_, i) => <motion.span key={i} className="absolute left-1/2 top-1/2" style={{ width: 'calc(var(--u) * 8)', height: 'calc(var(--u) * 8)' }} initial={{ x: 0, y: 0, rotate: 0 }} animate={{ x: `${Math.cos(i * 0.785) * 40}vw`, y: `${Math.sin(i * 0.785) * 30}vh`, rotate: 360, opacity: [1, 1, 0] }} transition={{ duration: 1.1 }}><Flake /></motion.span>)}
      </>}
      {id === 'giant' && <>
        {pic(<img src="/lab/balloon-pop/potion.webp" alt="" className="w-full h-full" />, { rotate: [0, -60, -60, 0], scale: [0.4, 1, 1.6, 0] }, { duration: 1.4 })}
        {Array.from({ length: 6 }, (_, i) => <motion.span key={i} className="absolute left-1/2 top-1/2 font-display text-[#8fe3a0]" style={{ fontSize: 'calc(var(--u) * 10)', WebkitTextStroke: '0.1em #000', paintOrder: 'stroke fill' }} initial={{ x: 0, y: 0, opacity: 0 }} animate={{ x: `${Math.cos(i * 1.047) * 30}vw`, y: `${Math.sin(i * 1.047) * 25}vh`, opacity: [0, 1, 0], rotate: i * 60 + 90 }} transition={{ duration: 1.1, delay: 0.3 }}>{'↑'}</motion.span>)}
      </>}
      {id === 'flip' && pic(<FlipArt />, { rotate: [0, 540], scale: [0, 1.2, 0] }, { duration: 1.3 })}
      {id === 'wobble' && pic(<WobbleArt />, { scaleX: [0, 1.4, 0.8, 1.2, 0.9, 0], scaleY: [0, 0.7, 1.3, 0.85, 1.1, 0] }, { duration: 1.5 })}
      {id === 'chickens' && pic(<ChickenArt />, { y: ['-60vh', '0vh', '-8vh', '0vh', '0vh'], rotate: [0, 0, -15, 0, 0], scale: [1, 1, 1, 1, 0] }, { duration: 1.5 })}
    </motion.div>
  );
}

// ---------- The goal that builds: stars filling a jar ----------

export function StarJar({ ar, style, cap = 12 }: { ar: Arcade; style?: CSSProperties; cap?: number }) {
  const score = ar.ctx.player.score;
  const n = Math.min(cap, score);
  const full = score >= cap;
  const color = TEAM_COLORS[ar.ctx.player.colorIndex % TEAM_COLORS.length];
  // Stars stack from the bottom in rows of 3, a little jumbled.
  const spots = Array.from({ length: cap }, (_, i) => ({ x: 22 + (i % 3) * 22 + ((i * 7) % 5) - 2, y: 108 - Math.floor(i / 3) * 17 - ((i * 3) % 4), r: (i * 37) % 50 - 25 }));
  return (
    <div className="absolute pointer-events-none" style={{ width: 'calc(var(--u) * 15)', height: 'calc(var(--u) * 20)', ...style }} aria-label={`${score} stars in the jar`} role="img">
      <svg viewBox="0 0 88 130" className="w-full h-full overflow-visible">
        <ellipse cx="44" cy="126" rx="36" ry="5" fill="rgba(0,0,0,0.25)" />
        <rect x="20" y="4" width="48" height="14" rx="4" fill={color} stroke="#000" strokeWidth="4" />
        <path d="M14 22 Q14 16 22 16 L66 16 Q74 16 74 22 L80 40 Q84 50 84 62 L84 112 Q84 124 72 124 L16 124 Q4 124 4 112 L4 62 Q4 50 8 40 Z" fill="rgba(235,245,255,0.55)" stroke="#000" strokeWidth="4" />
        {spots.slice(0, n).map((s, i) => (
          <motion.path key={i} d="M0 -8 l2.4 5.4 5.8 .5 -4.4 3.8 1.4 5.7 -5.2 -3.1 -5.2 3.1 1.4 -5.7 -4.4 -3.8 5.8 -.5z" fill="#fdfd94" stroke="#000" strokeWidth="1.6"
            initial={ar.ctx.still ? false : { x: s.x, y: -40, scale: 2, rotate: 0 }} animate={{ x: s.x, y: s.y, scale: 1.25, rotate: s.r }} transition={{ type: 'spring', stiffness: 160, damping: 11 }} />
        ))}
        <path d="M14 40 Q10 60 12 100" stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.8" />
        {full && <motion.circle cx="44" cy="70" r="50" fill="none" stroke="#fdfd94" strokeWidth="5" animate={ar.ctx.still ? undefined : { opacity: [0.2, 0.9, 0.2], scale: [0.95, 1.05, 0.95] }} transition={{ duration: 1.2, repeat: Infinity }} />}
      </svg>
      <span className="absolute -top-[18%] left-1/2 -translate-x-1/2"><TeamBadge colorIndex={ar.ctx.player.colorIndex} size={Math.round(ar.u * 6)} /></span>
    </div>
  );
}

// Pointer position in world units from an event on the frame's world layer.
export function worldPoint(e: { clientX: number; clientY: number }, el: Element, ar: Arcade, flipped = ar.on('flip')): [number, number] {
  const r = el.getBoundingClientRect();
  let x = ((e.clientX - r.left) / r.width) * ar.W, y = ((e.clientY - r.top) / r.height) * ar.H;
  if (flipped) { x = ar.W - x; y = ar.H - y; }
  return [x, y];
}

export const rand = (a: number, b: number) => a + Math.random() * (b - a);
export const pick = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)];
export function shuffle<T>(list: T[]): T[] { const a = [...list]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
// A short answer label size (world units) that fits a target of a given width.
export function labelSize(text: string, width: number, max = 5.2): number {
  const longest = Math.max(...text.split(/\s+/).map((w) => w.length), 1);
  return Math.max(2.2, Math.min(max, (width * 1.7) / Math.max(longest, Math.sqrt(text.length * 2.2))));
}
