import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle, DiceFive, Ladder } from '@phosphor-icons/react';
import { playClip } from '../../../engine/music';
import { TeamBadge } from '../../../engine/TeamBadge';
import type { LabCtx, LabDef, LabPower } from '../../types';
import Die from './Die';
import { above, alongPath, exactPath, hopsFrom, LADDERS, LAST, landing, nextLadder, rungs, SNAKES, smoothPath, snakePoints, spread, squareXY, type Pt } from './board';

// Snakes and Ladders (Game Lab): the traditional 10 by 10 board, drawn as a
// real wooden board with friendly cartoon snakes and wooden ladders. A right
// answer rolls the die and the piece hops square by square; ladders are
// climbed rung by rung and snakes slide you down along their wiggly bodies.

const POWERS: LabPower[] = [
  { id: 'charm', name: 'Snake Charmer', desc: 'The next snake you land on falls asleep and you stay put.', enter: 'spin', art: <Art kind="charm" /> },
  { id: 'boost', name: 'Ladder Boost', desc: 'Run to the next ladder ahead and climb it.', enter: 'drop', art: <Art kind="boost" /> },
  { id: 'double', name: 'Double Roll', desc: 'Roll two dice and add them up.', enter: 'spin', art: <Art kind="double" /> },
  { id: 'pogo', name: 'Pogo Stick', desc: 'Boing! Three extra hops after your roll.', enter: 'drop', art: <Art kind="pogo" /> },
  { id: 'balloon', name: 'Hot Air Balloon', desc: 'Float straight up one row.', enter: 'zoom', art: <Art kind="balloon" /> },
  { id: 'wiggle', name: 'Wiggle Shuffle', desc: 'Whoops! Every piece wiggles a square or two forward or back.', silly: true, art: <Art kind="wiggle" /> },
  { id: 'socks', name: 'Slippery Socks', desc: 'Whoops! Slide back two squares, then roll.', silly: true, art: <Art kind="socks" /> },
];

type Fx = { k: 'hop' | 'shrug' | 'wiggle' | 'float' | 'slip' | 'win' | 'climb' | 'pogo'; n: number };
type Vis = { pts: Pt[]; dur: number; mode: 'hop' | 'path' | 'slow' | 'rung' };
// Where a piece waits before square 1: the start mat beside the board.
const START: Pt = { x: -79, y: 927 };
const EXACT_KEY = 'gamify:lab:snakes-ladders:exact';
const spot = (n: number): Pt => (n <= 0 ? START : squareXY(n));
const sleep = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));
const SNAKE_COLORS = [['#8fe3a0', '#c8f0dc'], ['#ef7d96', '#fbd3dc'], ['#c58ce8', '#ead2f7'], ['#f6c544', '#fdf0b0'], ['#f39a6b', '#fbd9c4'], ['#6aa9e9', '#cfe3f8'], ['#5cc3a0', '#c8f0dc']];

function useBox(ref: RefObject<HTMLElement | null>) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setBox({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return box;
}

function Play({ ctx }: { ctx: LabCtx }) {
  const c = useRef(ctx); c.current = ctx;
  const players = ctx.turns.players;
  const order = players.map((p) => p.id);
  const [pos, setPosState] = useState<Record<string, number>>(() => Object.fromEntries(order.map((id) => [id, 0])));
  const posRef = useRef(pos);
  const [vis, setVis] = useState<Record<string, Vis>>(() => Object.fromEntries(order.map((id) => [id, { pts: [START], dur: 0, mode: 'hop' as const }])));
  const [fx, setFxState] = useState<Record<string, Fx>>({});
  const fxN = useRef(0);
  const setFx = (id: string, k: Fx['k']) => setFxState((f) => ({ ...f, [id]: { k, n: ++fxN.current } }));
  const charms = useRef<Set<string>>(new Set());
  const [asleep, setAsleep] = useState<number | null>(null);
  const [gulp, setGulp] = useState<number | null>(null);
  const [climbing, setClimbing] = useState<number | null>(null);
  const [die, setDie] = useState<{ count: number; key: number; resolve: (v: number[]) => void } | null>(null);
  const [winner, setWinner] = useState<string | null>(null);
  const [balloon, setBalloon] = useState<string | null>(null);
  const fitRef = useRef<HTMLDivElement>(null);
  // Exact roll to win: picked on the board before the first roll, remembered on this device.
  const [exact, setExactState] = useState(() => { try { return localStorage.getItem(EXACT_KEY) === '1'; } catch { return false; } });
  const setExact = (v: boolean) => { setExactState(v); try { localStorage.setItem(EXACT_KEY, v ? '1' : '0'); } catch { /* private window */ } };
  const started = useRef(false);
  const [showExact, setShowExact] = useState(true);
  const { w } = useBox(fitRef);
  const name = (id: string) => players.find((p) => p.id === id)?.name ?? '';

  const setPos = (id: string, n: number) => { posRef.current = { ...posRef.current, [id]: Math.max(0, Math.min(LAST, n)) }; setPosState(posRef.current); };
  const show = (id: string, v: Vis) => setVis((m) => ({ ...m, [id]: v }));
  const sync = () => c.current.setScores({ ...posRef.current });
  const roll = (count: number) => new Promise<number[]>((resolve) => setDie({ count, key: Date.now(), resolve }));

  async function walk(id: string, n: number, pogo = false) {
    const dir = n < 0 ? -1 : 1;
    for (let i = 0; i < Math.abs(n); i++) {
      const p = posRef.current[id] + dir;
      if (p < 0 || p > LAST) break;
      setPos(id, p); show(id, { pts: [spot(p)], dur: 0, mode: 'hop' });
      setFx(id, pogo ? 'pogo' : 'hop');
      if (pogo) c.current.sfx.boing(); else c.current.sfx.jump();
      await sleep(pogo ? 480 : 340);
    }
    sync();
  }

  // Exact roll: hop up to the last square, then bounce back the extra.
  async function bounce(id: string, path: number[]) {
    c.current.say('Too far! Bounce back', 'oops');
    for (const p of path) {
      setPos(id, p); show(id, { pts: [spot(p)], dur: 0, mode: 'hop' }); setFx(id, 'hop'); c.current.sfx.jump();
      await sleep(340);
    }
    sync();
  }

  async function climb(id: string, from: number, to: number) {
    const x = c.current;
    setClimbing(from); playClip('/lab/snakes-ladders/climb.mp3', x.settings, 0.7); x.say('Up the ladder!');
    const r = rungs(from, to);
    for (let i = 1; i < r.length; i++) {
      show(id, { pts: [r[i]], dur: 0.16, mode: 'rung' }); setFx(id, 'climb'); x.sfx.blip(i * 2);
      await sleep(210);
    }
    setPos(id, to); sync(); setClimbing(null);
    x.burst((squareXY(to).x + 130) / 1160 * 0.6 + 0.1, 0.4);
    await sleep(300);
  }

  async function slide(id: string, head: number, tail: number) {
    const x = c.current;
    if (charms.current.has(id)) {
      charms.current.delete(id); x.setHeld(id, []);
      setAsleep(head); x.sfx.note(4); window.setTimeout(() => x.sfx.note(2), 220); window.setTimeout(() => x.sfx.note(5), 440);
      x.say('Snake charmed! Zzz'); await sleep(1700); setAsleep(null);
      return;
    }
    setGulp(head); x.sfx.chomp(); x.say('Sssslide!', 'oops');
    await sleep(500);
    const path = alongPath(snakePoints(head, tail));
    playClip('/lab/snakes-ladders/slide.mp3', x.settings, 0.8); x.sfx.slideDown();
    show(id, { pts: path, dur: x.still ? 0 : 1.6, mode: 'path' }); setFx(id, 'slip');
    await sleep(x.still ? 200 : 1700);
    // The piece settles beside any others on the tail square with a soft spring.
    setPos(id, tail); show(id, { pts: [squareXY(tail)], dur: 0, mode: 'hop' }); sync(); setGulp(null);
  }

  async function land(id: string) {
    const at = posRef.current[id];
    const l = landing(at);
    if (l.kind === 'ladder') await climb(id, at, l.to);
    else if (l.kind === 'snake') await slide(id, at, l.to);
  }

  async function win(id: string) {
    const x = c.current;
    setWinner(id); setFx(id, 'win');
    x.sfx.cheer(); x.say(`${name(id)} wins!`, 'big'); x.burst(0.3, 0.2, 'big');
    await sleep(2600);
    x.points(5, id);
    x.finish(`${name(id)} reached the top!`);
  }

  // Before the roll: power-ups that move pieces. Returns true when the power-up
  // replaces the roll.
  async function applyPower(p: LabPower | null, me: string): Promise<boolean> {
    const x = c.current;
    if (!p) return false;
    if (p.id === 'charm') { charms.current.add(me); x.setHeld(me, [p]); x.sfx.note(0); return false; }
    if (p.id === 'socks') {
      x.sfx.oops(); setFx(me, 'slip');
      const to = Math.max(0, posRef.current[me] - 2);
      setPos(me, to); show(me, { pts: [spot(to)], dur: 0.7, mode: 'slow' }); await sleep(900); sync();
      if (to > 0) await land(me);
      return false;
    }
    if (p.id === 'wiggle') {
      x.sfx.boing();
      for (const id of order) {
        const d = [-2, -1, 1, 2][Math.floor(Math.random() * 4)];
        const to = Math.max(0, Math.min(LAST - 1, posRef.current[id] + d));
        setPos(id, to); show(id, { pts: [spot(to)], dur: 0.8, mode: 'slow' }); setFx(id, 'wiggle');
      }
      await sleep(1100); sync();
      for (const id of order) if (posRef.current[id] > 0) await land(id);
      return false;
    }
    if (p.id === 'balloon') {
      const to = above(posRef.current[me]); if (!to) return false;
      setBalloon(me); x.sfx.slideUp();
      setPos(me, to); show(me, { pts: [squareXY(to)], dur: 1.4, mode: 'slow' }); setFx(me, 'float');
      await sleep(1600); setBalloon(null); sync();
      if (posRef.current[me] >= LAST) return true;
      await land(me);
      return true;
    }
    if (p.id === 'boost') {
      const l = nextLadder(posRef.current[me]); if (!l) return false;
      x.sfx.whoosh();
      await walk(me, l - posRef.current[me]);
      await land(me);
      return true;
    }
    if (p.id === 'double') x.sfx.dice();
    return false;
  }

  // Every turn: a question, then (if right) maybe a power-up, then the die.
  useEffect(() => {
    let live = true;
    void (async () => {
      const me = c.current.player.id;
      const ok = await c.current.ask();
      if (!live) return;
      if (!ok) { c.current.sfx.wrong(); setFx(me, 'shrug'); await sleep(800); if (live) c.current.next(); return; }
      const p = await c.current.power(0.45, (pw) => {
        const behind = order.some((id) => posRef.current[id] > posRef.current[me]);
        if (pw.id === 'boost') return behind && !!nextLadder(posRef.current[me]);
        if (pw.id === 'balloon') { const up = above(posRef.current[me]); return behind && !!up && !SNAKES[up]; }
        if (pw.id === 'socks') return posRef.current[me] >= 2 && !LADDERS[posRef.current[me] - 2];
        if (pw.id === 'charm') return !charms.current.has(me);
        return true;
      });
      if (!live) return;
      const skipRoll = await applyPower(p, me);
      if (!live) return;
      if (!skipRoll) {
        const vals = await roll(p?.id === 'double' ? 2 : 1);
        if (!live) return;
        setDie(null);
        started.current = true; setShowExact(false);
        const sum = vals.reduce((a, b) => a + b, 0);
        if (exact && posRef.current[me] + sum > LAST) await bounce(me, exactPath(posRef.current[me], sum));
        else await walk(me, hopsFrom(posRef.current[me], sum).length);
        if (p?.id === 'pogo' && posRef.current[me] < LAST) { c.current.say('Boing boing boing!'); await walk(me, hopsFrom(posRef.current[me], 3).length, true); }
        if (!live) return;
        if (posRef.current[me] < LAST) await land(me);
      }
      if (!live) return;
      if (posRef.current[me] >= LAST) { await win(me); return; }
      await sleep(500);
      if (live) c.current.next();
    })();
    return () => { live = false; };
  }, [ctx.taken]); // eslint-disable-line react-hooks/exhaustive-deps

  // Board coordinates (0..1000 inside a frame) to pixels.
  const k = w / 1160;
  const px = (v: number) => (v + 130) * k;
  const py = (v: number) => (v + 30) * k;
  const token = Math.round(w * (players.length > 3 ? 0.062 : 0.074));
  const snakes = useMemo(() => Object.entries(SNAKES).map(([h, t], i) => ({ head: +h, tail: +t, pts: snakePoints(+h, +t), color: SNAKE_COLORS[i % SNAKE_COLORS.length] })), []);
  const groups = useMemo(() => {
    const g: Record<number, string[]> = {};
    order.forEach((id) => { const s = pos[id]; (g[s] ??= []).push(id); });
    return g;
  }, [pos]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="absolute inset-0 grid place-items-center">
      <div ref={fitRef} className="relative lab-fit" style={{ '--ar': 1160 / 1060 } as React.CSSProperties}>
        <svg viewBox="-130 -30 1160 1060" className="absolute inset-0 w-full h-full" aria-label="Snakes and Ladders board" role="img">
          <defs>
            <linearGradient id="sl-wood" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#d9a46b" /><stop offset="1" stopColor="#b07a44" /></linearGradient>
            <radialGradient id="sl-shine" cx="0.3" cy="0.2" r="0.9"><stop offset="0" stopColor="#fff" stopOpacity="0.25" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
          </defs>
          {/* The start mat beside square 1, where every piece waits. */}
          <rect x={-126} y={846} width={94} height={150} rx={22} fill="#000" opacity={0.3} transform="translate(4 6)" />
          <rect x={-126} y={846} width={94} height={150} rx={22} fill="#8fe3a0" stroke="#000" strokeWidth={5} />
          <path d="M-102 990 h40 v-12 l20 18 -20 18 v-12 h-40z" fill="#fbfcf8" stroke="#000" strokeWidth={3} strokeLinejoin="round" transform="translate(0 -122)" />
          <rect x={-26} y={-22} width={1052} height={1052} rx={40} fill="#000" opacity={0.35} />
          <rect x={-28} y={-28} width={1056} height={1056} rx={40} fill="url(#sl-wood)" stroke="#000" strokeWidth={6} />
          {Array.from({ length: 100 }, (_, i) => {
            const n = i + 1, { x, y } = squareXY(n), row = Math.floor(i / 10);
            const light = (Math.floor(x / 100) + row) % 2 === 0;
            const fill = light ? ['#fbfcf8', '#fdfdc8', '#e8f8ec', '#edf0fe', '#fde7e0'][row % 5] : ['#fdfd94', '#c8f0dc', '#c9d2ff', '#fbd3c8', '#f7d7e0'][row % 5];
            return (
              <g key={n}>
                <rect x={x - 50} y={y - 50} width={100} height={100} fill={fill} stroke="#241c3d" strokeOpacity={0.25} strokeWidth={1.5} />
              </g>
            );
          })}
          <rect x={0} y={0} width={1000} height={1000} fill="url(#sl-shine)" stroke="#000" strokeWidth={5} />
          {/* The finish square wears a crown. */}
          <g transform={`translate(${squareXY(100).x} ${squareXY(100).y + 10})`}><path d="M-30 18 L-24 -16 L-10 2 L0 -26 L10 2 L24 -16 L30 18z" fill="#f6c544" stroke="#000" strokeWidth={4} strokeLinejoin="round" /></g>
          {Object.entries(LADDERS).map(([a, b]) => <LadderArt key={a} from={+a} to={+b} glow={climbing === +a} still={ctx.still} />)}
          {snakes.map((s, i) => <SnakeArt key={s.head} {...s} i={i} still={ctx.still} asleep={asleep === s.head} gulp={gulp === s.head} />)}
          {/* No numbers on squares: each row wears its own colors and a faint arrow shows where the path turns up. */}
          {Array.from({ length: 9 }, (_, r) => { const x = r % 2 ? 50 : 950, y = 950 - r * 100; return <path key={r} d={`M${x} ${y - 6} v-82 m-14 14 l14 -14 14 14`} stroke="#241c3d" strokeOpacity={0.28} strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" pointerEvents="none" />; })}
        </svg>
        {w > 0 && players.map((p) => {
          const v = vis[p.id];
          const s = pos[p.id];
          const g = groups[s] ?? [p.id];
          const off = spread(g.indexOf(p.id), g.length, g.length > 2 ? 28 : 24);
          const xs = v.pts.map((q) => px(q.x + off.x) - token / 2);
          const ys = v.pts.map((q) => py(q.y + off.y) - token / 2);
          const f = fx[p.id];
          const t = ctx.still ? { duration: 0 } : v.mode === 'path' ? { duration: v.dur, ease: 'linear' as const, times: v.pts.map((_, i) => i / Math.max(1, v.pts.length - 1)) } : v.mode === 'slow' ? { duration: v.dur, ease: 'easeInOut' as const } : v.mode === 'rung' ? { duration: v.dur, ease: 'easeOut' as const } : { type: 'spring' as const, stiffness: 300, damping: 24 };
          return (
            <motion.div key={p.id} className="absolute left-0 top-0 pointer-events-none" style={{ width: token, height: token, zIndex: p.id === ctx.player.id ? 12 : 10 }}
              initial={false} animate={{ x: xs.length > 1 ? xs : xs[0], y: ys.length > 1 ? ys : ys[0] }} transition={t}>
              <span className="absolute left-[12%] right-[12%] bottom-[-10%] h-[22%] rounded-full bg-black/30" aria-hidden="true" />
              {balloon === p.id && (
                <motion.svg viewBox="0 0 60 80" className="absolute bottom-[70%] left-[5%] w-[90%]" initial={{ scale: 0, y: 20 }} animate={{ scale: 1, y: 0 }} aria-hidden="true">
                  <ellipse cx="30" cy="28" rx="24" ry="26" fill="#ef7d96" stroke="#000" strokeWidth="3" /><path d="M14 22 Q30 6 46 22" stroke="#fdfd94" strokeWidth="5" fill="none" /><path d="M16 46 L24 66 M44 46 L36 66" stroke="#000" strokeWidth="2.5" /><rect x="22" y="64" width="16" height="12" rx="3" fill="#c98a4b" stroke="#000" strokeWidth="2.5" />
                </motion.svg>
              )}
              <motion.span key={f ? `${f.k}${f.n}` : 'rest'} className="block w-full h-full" style={{ originY: 1 }}
                animate={ctx.still || !f ? undefined : FX[f.k](token)} transition={{ duration: FX_TIME[f?.k ?? 'hop'], ease: 'easeOut', repeat: f?.k === 'win' ? Infinity : 0 }}>
                <TeamBadge colorIndex={p.colorIndex} size={token} />
              </motion.span>
              {winner === p.id && <span className="absolute -top-[60%] left-1/2 -translate-x-1/2" aria-hidden="true"><svg viewBox="0 0 60 40" width={token * 0.8}><path d="M4 36 L8 10 L20 24 L30 4 L40 24 L52 10 L56 36z" fill="#f6c544" stroke="#000" strokeWidth="3" strokeLinejoin="round" /></svg></span>}
            </motion.div>
          );
        })}
        <AnimatePresence>
          {die && w > 0 && <Die key={die.key} base="/lab/snakes-ladders/die" count={die.count} cpu={ctx.cpu} still={ctx.still} sfx={ctx.sfx} size={Math.round(w * (die.count > 1 ? 0.26 : 0.32))} onDone={(v) => die.resolve(v)} />}
        </AnimatePresence>
      </div>
      {showExact && ctx.taken === 0 && (
        <button type="button" onClick={() => { ctx.sfx.tap(); setExact(!exact); }} aria-pressed={exact}
          className="absolute left-2 top-2 z-20 min-h-11 rounded-pill border-std border-border bg-surface px-3 inline-flex items-center gap-2 font-bold text-sm motion-safe:hover:scale-105 motion-safe:transition-transform" style={{ boxShadow: 'var(--shadow-sticker)' }}
          title="On: you must land on 100 exactly. A roll past it bounces back.">
          <span className={`w-9 h-5 rounded-pill border-std border-border relative transition-colors ${exact ? 'bg-success' : 'bg-surface-2'}`}><span className={`absolute top-0.5 w-3 h-3 rounded-full bg-ink-night transition-all ${exact ? 'left-5' : 'left-0.5'}`} /></span>
          Exact roll to win
        </button>
      )}
    </div>
  );
}

const FX: Record<Fx['k'], (t: number) => Record<string, number[]>> = {
  hop: (t) => ({ y: [0, -t * 0.55, 0, 0], scaleY: [1, 1.12, 0.8, 1], scaleX: [1, 0.92, 1.12, 1] }),
  pogo: (t) => ({ y: [0, -t * 1.2, 0, -t * 0.2, 0], scaleY: [0.7, 1.2, 0.75, 1.05, 1] }),
  climb: (t) => ({ y: [0, -t * 0.15, 0], rotate: [-6, 6, 0] }),
  shrug: () => ({ rotate: [0, -12, 10, -6, 0] }),
  wiggle: () => ({ rotate: [0, 20, -20, 14, -10, 0], scaleX: [1, 1.2, 0.85, 1.1, 1] }),
  float: (t) => ({ y: [0, -t * 0.1, 0], rotate: [0, -4, 4, 0] }),
  slip: () => ({ rotate: [0, -30, 20, -360], scaleY: [1, 0.8, 1.1, 1] }),
  win: (t) => ({ y: [0, -t * 0.4, 0], rotate: [0, -8, 8, 0] }),
};
const FX_TIME: Record<Fx['k'], number> = { hop: 0.32, pogo: 0.46, climb: 0.2, shrug: 0.6, wiggle: 0.8, float: 1.4, slip: 1.5, win: 0.7 };

// A wooden ladder from one square up to another.
function LadderArt({ from, to, glow, still }: { from: number; to: number; glow: boolean; still: boolean }) {
  const a = squareXY(from), b = squareXY(to);
  const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
  const nx = (-dy / d) * 22, ny = (dx / d) * 22;
  const r = rungs(from, to, 46);
  return (
    <motion.g animate={glow && !still ? { scale: [1, 1.02, 1] } : undefined} transition={{ duration: 0.4, repeat: Infinity }} style={{ transformOrigin: `${(a.x + b.x) / 2}px ${(a.y + b.y) / 2}px` }}>
      <line x1={a.x + 6} y1={a.y + 8} x2={b.x + 6} y2={b.y + 8} stroke="#000" strokeOpacity={0.25} strokeWidth={56} strokeLinecap="round" />
      {r.slice(1, -1).map((q, i) => <line key={i} x1={q.x + nx} y1={q.y + ny} x2={q.x - nx} y2={q.y - ny} stroke="#000" strokeWidth={13} strokeLinecap="round" />)}
      {r.slice(1, -1).map((q, i) => <line key={`r${i}`} x1={q.x + nx} y1={q.y + ny} x2={q.x - nx} y2={q.y - ny} stroke={glow ? '#fdfd94' : '#e6b27a'} strokeWidth={7} strokeLinecap="round" />)}
      {[1, -1].map((s) => (
        <g key={s}>
          <line x1={a.x + nx * s} y1={a.y + ny * s} x2={b.x + nx * s} y2={b.y + ny * s} stroke="#000" strokeWidth={16} strokeLinecap="round" />
          <line x1={a.x + nx * s} y1={a.y + ny * s} x2={b.x + nx * s} y2={b.y + ny * s} stroke="#b9773f" strokeWidth={9} strokeLinecap="round" />
          <line x1={a.x + nx * s * 1.1} y1={a.y + ny * s * 1.1} x2={b.x + nx * s * 1.1} y2={b.y + ny * s * 1.1} stroke="#e6b27a" strokeWidth={2.5} strokeLinecap="round" />
        </g>
      ))}
    </motion.g>
  );
}

// A friendly cartoon snake: a wiggly striped body, a round smiling head
// with a flicking tongue. It gulps when a piece lands on it and snoozes
// when charmed.
function SnakeArt({ head, tail, pts, color, i, still, asleep, gulp }: { head: number; tail: number; pts: Pt[]; color: string[]; i: number; still: boolean; asleep: boolean; gulp: boolean }) {
  const d = smoothPath(pts);
  const h = pts[0], n = pts[1];
  const ang = (Math.atan2(h.y - n.y, h.x - n.x) * 180) / Math.PI;
  const end = pts[pts.length - 1], pre = pts[pts.length - 2];
  const tAng = (Math.atan2(end.y - pre.y, end.x - pre.x) * 180) / Math.PI;
  return (
    <g aria-label={`Snake from ${head} down to ${tail}`}>
      <path d={d} stroke="#000" strokeOpacity={0.22} strokeWidth={46} fill="none" strokeLinecap="round" transform="translate(6 9)" />
      <path d={d} stroke="#000" strokeWidth={44} fill="none" strokeLinecap="round" />
      <path d={d} stroke={color[0]} strokeWidth={35} fill="none" strokeLinecap="round" />
      <path d={d} stroke={color[1]} strokeWidth={13} fill="none" strokeLinecap="round" strokeDasharray="14 26" />
      <path d={d} stroke="#fff" strokeOpacity={0.35} strokeWidth={6} fill="none" strokeLinecap="round" transform="translate(-7 -7)" />
      <g transform={`translate(${end.x} ${end.y}) rotate(${tAng})`}><path d="M-6 -15 Q30 -4 38 0 Q30 4 -6 15z" fill={color[0]} stroke="#000" strokeWidth={4} strokeLinejoin="round" /></g>
      <g transform={`translate(${h.x} ${h.y}) rotate(${ang})`}>
        <motion.g animate={still || !gulp ? undefined : { scale: [1, 1.35, 1], rotate: [0, 10, -8, 0] }} transition={{ duration: 0.6 }}>
          {!asleep && <motion.path d="M30 0 L52 0 M52 0 l8 -6 M52 0 l8 6" stroke="#e5635f" strokeWidth={5} strokeLinecap="round" fill="none"
            animate={still ? undefined : { scaleX: [0, 1, 1, 0, 0] }} transition={{ duration: 3.6, repeat: Infinity, delay: i * 0.7, times: [0, 0.06, 0.14, 0.2, 1] }} style={{ originX: '30px' }} />}
          <ellipse cx={0} cy={0} rx={38} ry={32} fill={color[0]} stroke="#000" strokeWidth={5} />
          <ellipse cx={-6} cy={-12} rx={18} ry={8} fill="#fff" opacity={0.35} />
          {asleep ? (
            <>{[-12, 12].map((y) => <path key={y} d={`M4 ${y - 2} q8 6 16 0`} stroke="#000" strokeWidth={4} fill="none" strokeLinecap="round" />)}</>
          ) : (
            <>{[-13, 13].map((y) => <g key={y}><circle cx={10} cy={y} r={9} fill="#fff" stroke="#000" strokeWidth={3} /><circle cx={13} cy={y} r={4.5} fill="#000" /></g>)}</>
          )}
          <path d="M22 -10 Q32 0 22 10" stroke="#000" strokeWidth={4} fill="none" strokeLinecap="round" />
          {[-20, 20].map((y) => <circle key={y} cx={-4} cy={y} r={5} fill="#ef7d96" opacity={0.7} />)}
        </motion.g>
      </g>
      {asleep && (
        <g transform={`translate(${h.x + 30} ${h.y - 50})`}>
          {[0, 1, 2].map((k) => <motion.text key={k} x={k * 18} y={-k * 20} fontSize={26 + k * 6} fontWeight={900} fill="#241c3d" initial={{ opacity: 0, y: 10 }} animate={{ opacity: [0, 1, 0], y: [10, -10] }} transition={{ duration: 1.2, delay: k * 0.3, repeat: Infinity }}>z</motion.text>)}
        </g>
      )}
    </g>
  );
}

// Classic power-up pictures, drawn in code.
function Art({ kind }: { kind: string }) {
  const ring = (fill: string) => <circle cx="50" cy="50" r="44" fill={fill} stroke="#000" strokeWidth="5" />;
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      {kind === 'charm' && <>{ring('#fdfd94')}<path d="M24 74 Q20 50 40 48 Q58 46 52 30 Q48 20 60 18" stroke="#000" strokeWidth="13" fill="none" strokeLinecap="round" /><path d="M24 74 Q20 50 40 48 Q58 46 52 30 Q48 20 60 18" stroke="#8fe3a0" strokeWidth="7" fill="none" strokeLinecap="round" /><circle cx="62" cy="18" r="8" fill="#8fe3a0" stroke="#000" strokeWidth="3" /><path d="M70 44 v18 a5 5 0 1 1 -4 -5 M80 38 v18 a5 5 0 1 1 -4 -5 M70 44 l10 -6" stroke="#241c3d" strokeWidth="3.5" fill="none" strokeLinecap="round" /></>}
      {kind === 'boost' && <>{ring('#8fe3a0')}<path d="M36 84 L48 16 M64 84 L76 16" stroke="#000" strokeWidth="9" strokeLinecap="round" /><path d="M36 84 L48 16 M64 84 L76 16" stroke="#c98a4b" strokeWidth="4.5" strokeLinecap="round" /><path d="M41 66 h27 M44 48 h27 M47 30 h27" stroke="#000" strokeWidth="6" strokeLinecap="round" /><path d="M18 54 l10 -12 10 12" stroke="#ef7d96" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></>}
      {kind === 'double' && <>{ring('#c9d2ff')}<rect x="16" y="30" width="34" height="34" rx="7" fill="#fff" stroke="#000" strokeWidth="4" transform="rotate(-12 33 47)" /><rect x="50" y="38" width="34" height="34" rx="7" fill="#fff" stroke="#000" strokeWidth="4" transform="rotate(10 67 55)" /><circle cx="27" cy="40" r="4" /><circle cx="38" cy="52" r="4" /><circle cx="60" cy="48" r="4" /><circle cx="67" cy="56" r="4" /><circle cx="74" cy="64" r="4" /></>}
      {kind === 'pogo' && <>{ring('#f5a08c')}<path d="M50 14 V64" stroke="#000" strokeWidth="6" strokeLinecap="round" /><path d="M36 22 H64" stroke="#000" strokeWidth="7" strokeLinecap="round" /><path d="M42 64 L58 70 L42 76 L58 82" stroke="#241c3d" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" /><rect x="38" y="38" width="24" height="10" rx="4" fill="#fdfd94" stroke="#000" strokeWidth="3.5" /></>}
      {kind === 'balloon' && <>{ring('#c9e4ff')}<ellipse cx="50" cy="40" rx="24" ry="26" fill="#ef7d96" stroke="#000" strokeWidth="4" /><path d="M34 34 Q50 16 66 34" stroke="#fdfd94" strokeWidth="5" fill="none" /><path d="M34 58 L44 74 M66 58 L56 74" stroke="#000" strokeWidth="3" /><rect x="42" y="72" width="16" height="12" rx="3" fill="#c98a4b" stroke="#000" strokeWidth="3.5" /></>}
      {kind === 'wiggle' && <>{ring('#c58ce8')}<path d="M18 50 Q26 34 34 50 T50 50 T66 50 T82 50" stroke="#000" strokeWidth="9" fill="none" strokeLinecap="round" /><path d="M18 50 Q26 34 34 50 T50 50 T66 50 T82 50" stroke="#fdfd94" strokeWidth="4" fill="none" strokeLinecap="round" /><path d="M24 26 l-6 -6 M76 26 l6 -6 M24 74 l-6 6 M76 74 l6 6" stroke="#000" strokeWidth="4" strokeLinecap="round" /></>}
      {kind === 'socks' && <>{ring('#7fd6e3')}<path d="M40 16 H60 V54 Q60 74 42 78 Q24 80 24 66 Q26 56 40 54z" fill="#fbfcf8" stroke="#000" strokeWidth="4.5" strokeLinejoin="round" /><path d="M40 26 H60 M40 36 H60" stroke="#ef7d96" strokeWidth="5" /><path d="M66 70 q6 -4 12 0 M70 80 q6 -4 12 0" stroke="#6aa9e9" strokeWidth="4" fill="none" strokeLinecap="round" /></>}
    </svg>
  );
}

function Cover() {
  const sq = (r: number, cc: number) => ((r + cc) % 2 ? ['#fdfd94', '#c8f0dc', '#c9d2ff', '#fbd3c8'][r % 4] : '#fbfcf8');
  return (
    <svg viewBox="0 0 100 62" preserveAspectRatio="xMidYMid slice" style={{ background: 'radial-gradient(circle at 50% 30%, #c9d2ff, #8d9df0)' }}>
      <rect x="22" y="2" width="58" height="58" rx="4" fill="#c98a4b" stroke="#000" strokeWidth="0.9" />
      {Array.from({ length: 100 }, (_, i) => <rect key={i} x={25 + (i % 10) * 5.2} y={5 + Math.floor(i / 10) * 5.2} width="5.2" height="5.2" fill={sq(Math.floor(i / 10), i % 10)} stroke="#241c3d" strokeOpacity="0.2" strokeWidth="0.2" />)}
      <path d="M33 47 L46 18 M39 49 L52 20" stroke="#000" strokeWidth="1.6" strokeLinecap="round" /><path d="M33 47 L46 18 M39 49 L52 20" stroke="#c98a4b" strokeWidth="0.9" strokeLinecap="round" />
      {[0, 1, 2, 3, 4].map((k) => <line key={k} x1={35 + k * 2.4} y1={42 - k * 5.5} x2={41 + k * 2.4} y2={44 - k * 5.5} stroke="#000" strokeWidth="0.9" />)}
      <path d="M70 12 C60 18 76 26 64 32 S70 46 58 52" stroke="#000" strokeWidth="4.4" fill="none" strokeLinecap="round" /><path d="M70 12 C60 18 76 26 64 32 S70 46 58 52" stroke="#8fe3a0" strokeWidth="3.2" fill="none" strokeLinecap="round" />
      <circle cx="70.5" cy="11.5" r="3.4" fill="#8fe3a0" stroke="#000" strokeWidth="0.7" /><circle cx="70" cy="10.6" r="0.9" fill="#fff" stroke="#000" strokeWidth="0.3" /><circle cx="72" cy="11" r="0.9" fill="#fff" stroke="#000" strokeWidth="0.3" />
      <circle cx="47" cy="25" r="3" fill="#f6c544" stroke="#000" strokeWidth="0.7" /><circle cx="62" cy="40" r="3" fill="#5cc3a0" stroke="#000" strokeWidth="0.7" />
    </svg>
  );
}

const def: LabDef = {
  id: 'snakes-ladders',
  name: 'Snakes and Ladders',
  description: 'Answer right to roll the die. Climb the ladders, slide down the snakes and race to the top.',
  ways: ['teams'],
  minTeams: 2,
  maxTeams: 6,
  how: [
    { icon: <CheckCircle weight="fill" />, text: 'Answer the question' },
    { icon: <DiceFive weight="fill" />, text: 'Right? Tap the die to roll' },
    { icon: <Ladder weight="fill" />, text: 'Climb ladders, dodge snakes, reach 100' },
  ],
  rounds: { label: 'Rounds', min: 20, max: 60, default: 40 },
  powers: POWERS,
  background: 'radial-gradient(120% 90% at 50% 10%, #c9d2ff 0%, #9aa8f2 60%, #7d8be0 100%)',
  cover: <Cover />,
  pieces: [
    { id: 'background', label: 'Background', hint: 'Behind the board' },
    { id: 'frame', label: 'Board frame', hint: 'The wooden edge around the board' },
    { id: 'square-light', label: 'Light squares', hint: 'Every other square' },
    { id: 'square-dark', label: 'Colored squares', hint: 'The squares in between' },
    { id: 'finish', label: 'Top square', hint: 'Square 100 with its crown' },
    { id: 'ladder', label: 'Ladder', hint: 'A wooden ladder (stretches to fit)' },
    { id: 'snake-head', label: 'Snake head', hint: 'A friendly snake face' },
    { id: 'snake-body', label: 'Snake body', hint: 'The wiggly striped body' },
    { id: 'pieces', label: 'Pieces', hint: 'Each team\'s piece (the team picture)' },
    { id: 'die', label: 'Die', hint: 'All six sides of the die' },
    ...POWERS.map((p) => ({ id: `power-${p.id}`, label: p.name, hint: p.desc })),
  ],
  Play,
};
export default def;
