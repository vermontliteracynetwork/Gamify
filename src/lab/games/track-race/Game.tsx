import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle, DiceFive, FlagCheckered } from '@phosphor-icons/react';
import { playClip } from '../../../engine/music';
import { TeamBadge } from '../../../engine/TeamBadge';
import { TEAM_COLORS } from '../../../engine/turns';
import type { LabCtx, LabDef, LabPower } from '../../types';
import Die from './Die';
import { aheadOf, hops, leaderId, makeSurprises, shellRoll, surpriseMove, trackLength, type Surprise } from './race';

// Track Race (Game Lab, inspired by classroom sprint-board games): a long
// running track, one lane per team, left to right. A right answer rolls the
// big die and the team's runner hops space by space. Hidden surprise spaces
// and silly power-ups keep every race different. First across the line wins.

const POWERS: LabPower[] = [
  { id: 'rocket', name: 'Rocket Shoes', desc: 'Your roll counts double this turn.', enter: 'zoom', art: <Art kind="rocket" /> },
  { id: 'jump', name: 'Super Jump', desc: 'One giant leap over three spaces.', enter: 'drop', art: <Art kind="jump" /> },
  { id: 'double', name: 'Double Roll', desc: 'Roll two dice and add them up.', enter: 'spin', art: <Art kind="double" /> },
  { id: 'shell', name: 'Turtle Shell', desc: 'The runner just ahead goes half speed on their next roll.', enter: 'drop', art: <Art kind="shell" /> },
  { id: 'swap', name: 'Teleport Swap', desc: 'Swap places with the runner just ahead of you.', takes: true, enter: 'zoom', art: <Art kind="swap" /> },
  { id: 'banana', name: 'Banana Peel', desc: 'Whoops! The leader slips back two spaces. Even if it is you!', silly: true, art: <Art kind="banana" /> },
  { id: 'wind', name: 'Gust of Giggles', desc: 'A giant giggle wind blows every runner one space ahead.', silly: true, art: <Art kind="wind" /> },
];

type Fx = { k: 'hop' | 'leap' | 'spin' | 'teleport' | 'bonk' | 'shrug' | 'wobble' | 'zoom' | 'win'; n: number };
type Move = 'hop' | 'slow' | 'instant' | 'fast';
const sleep = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

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
  const len = useMemo(() => trackLength(ctx.rounds), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [surprises] = useState(() => Object.fromEntries(order.map((id) => [id, makeSurprises(len)])) as Record<string, Record<number, Surprise>>);
  const [pos, setPosState] = useState<Record<string, number>>(() => Object.fromEntries(order.map((id) => [id, 0])));
  const posRef = useRef(pos);
  const setPos = (next: Record<string, number>) => { posRef.current = next; setPosState(next); };
  const [fx, setFxState] = useState<Record<string, Fx>>({});
  const fxN = useRef(0);
  const setFx = (id: string, k: Fx['k']) => setFxState((f) => ({ ...f, [id]: { k, n: ++fxN.current } }));
  const [mv, setMv] = useState<Record<string, Move>>({});
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [pop, setPop] = useState<{ id: string; at: number; kind: Surprise; n: number } | null>(null);
  const [throwFx, setThrow] = useState<{ kind: 'banana' | 'shell'; to: string; n: number } | null>(null);
  const [shells, setShells] = useState<Set<string>>(new Set());
  const shellsRef = useRef(shells); shellsRef.current = shells;
  const [rocket, setRocket] = useState<string | null>(null);
  const [die, setDie] = useState<{ count: number; key: number; resolve: (v: number[]) => void } | null>(null);
  const [cheer, setCheer] = useState(0);
  const [winner, setWinner] = useState<string | null>(null);
  const stretch = useRef(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const { w, h } = useBox(boardRef);

  const name = (id: string) => players.find((p) => p.id === id)?.name ?? '';
  const color = (id: string) => TEAM_COLORS[(players.find((p) => p.id === id)?.colorIndex ?? 0) % TEAM_COLORS.length];
  const sync = () => c.current.setScores({ ...posRef.current });
  const place = (id: string, p: number, how: Move = 'hop') => { setMv((m) => ({ ...m, [id]: how })); setPos({ ...posRef.current, [id]: Math.max(0, Math.min(len, p)) }); };
  const roll = (count: number) => new Promise<number[]>((resolve) => setDie({ count, key: Date.now(), resolve }));

  // One space at a time, a jump sound on every hop.
  async function walk(id: string, n: number, fast = false) {
    const dir = n < 0 ? -1 : 1;
    for (let i = 0; i < Math.abs(n); i++) {
      const p = posRef.current[id] + dir;
      if (p < 0 || p > len) break;
      place(id, p, fast ? 'fast' : 'hop'); setFx(id, 'hop'); c.current.sfx.jump();
      await sleep(fast ? 190 : 330);
    }
    sync();
  }

  async function win(id: string) {
    const x = c.current;
    setWinner(id); setFx(id, 'win'); setCheer((n) => n + 1);
    playClip('/lab/track-race/finish.mp3', x.settings); x.sfx.cheer();
    x.say(`${name(id)} wins!`, 'big'); x.burst(0.78, 0.45, 'big');
    await sleep(2600);
    x.points(5, id);
    x.finish(`${name(id)} wins the race!`);
  }

  async function surprise(id: string) {
    const x = c.current;
    const at = posRef.current[id];
    let kind = surprises[id][at];
    if (!kind) return;
    setRevealed((r) => new Set(r).add(`${id}:${at}`));
    setPop({ id, at, kind, n: Date.now() });
    if (kind === 'mystery') {
      playClip('/lab/track-race/mystery.mp3', x.settings); x.say('Mystery box!');
      await sleep(1300);
      kind = (['boost', 'spring', 'mud'] as const)[Math.floor(Math.random() * 3)];
      setPop({ id, at, kind, n: Date.now() });
    }
    await sleep(350);
    if (kind === 'boost') { x.sfx.whoosh(); x.say('Speed pad!'); setFx(id, 'zoom'); await walk(id, surpriseMove('boost', at, len) - at, true); }
    else if (kind === 'spring') { x.sfx.boing(); x.say('Spring!'); setFx(id, 'leap'); place(id, surpriseMove('spring', at, len), 'slow'); await sleep(850); sync(); }
    else if (kind === 'mud') { x.sfx.splash(); x.say('Mud puddle!', 'oops'); setFx(id, 'wobble'); place(id, surpriseMove('mud', at, len), 'slow'); await sleep(800); sync(); }
  }

  async function applyPower(p: LabPower | null, me: string) {
    const x = c.current;
    if (!p) return;
    if (p.id === 'rocket') { setRocket(me); x.sfx.whoosh(); }
    if (p.id === 'double') x.sfx.dice();
    if (p.id === 'jump') {
      x.sfx.boing(); setFx(me, 'leap'); place(me, posRef.current[me] + 3, 'slow'); await sleep(900); sync();
    }
    if (p.id === 'banana') {
      const l = leaderId(posRef.current, order); if (!l) return;
      setThrow({ kind: 'banana', to: l, n: Date.now() }); await sleep(750);
      x.sfx.oops(); setFx(l, 'spin'); x.say(`${name(l)} slipped!`, 'oops');
      place(l, posRef.current[l] - 2, 'slow'); x.sfx.slideDown(); await sleep(1000); sync(); setThrow(null);
    }
    if (p.id === 'shell') {
      const t = aheadOf(posRef.current, order, me); if (!t) return;
      setThrow({ kind: 'shell', to: t, n: Date.now() }); await sleep(750);
      x.sfx.thud(); setFx(t, 'bonk'); setShells((s) => new Set(s).add(t)); x.say('Turtle shell!', 'oops'); await sleep(700); setThrow(null);
    }
    if (p.id === 'swap') {
      const t = aheadOf(posRef.current, order, me); if (!t) return;
      x.sfx.zap(); setFx(me, 'teleport'); setFx(t, 'teleport');
      await sleep(450);
      const a = posRef.current[me], b = posRef.current[t];
      setMv((m) => ({ ...m, [me]: 'instant', [t]: 'instant' }));
      setPos({ ...posRef.current, [me]: b, [t]: a });
      x.say('Swap!'); await sleep(700); sync();
    }
    if (p.id === 'wind') {
      x.sfx.wind();
      const next = { ...posRef.current };
      for (const id of order) next[id] = Math.max(next[id], Math.min(len - 1, next[id] + 1));
      setMv(Object.fromEntries(order.map((id) => [id, 'slow' as Move])));
      order.forEach((id) => setFx(id, 'wobble'));
      setPos(next); await sleep(1000); sync();
    }
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
        if (pw.id === 'banana') return !!leaderId(posRef.current, order);
        if (pw.id === 'swap' || pw.id === 'shell') return !!aheadOf(posRef.current, order, me);
        return true;
      });
      if (!live) return;
      await applyPower(p, me);
      if (!live) return;
      if (posRef.current[me] >= len) { await win(me); return; }
      const vals = await roll(p?.id === 'double' ? 2 : 1);
      if (!live) return;
      setDie(null);
      let n = vals.reduce((a, b) => a + b, 0);
      if (p?.id === 'rocket') n *= 2;
      if (shellsRef.current.has(me)) {
        n = shellRoll(n); c.current.say('Slow shell! Half speed', 'oops');
        setShells((s) => { const t = new Set(s); t.delete(me); return t; });
        await sleep(900);
      }
      await walk(me, hops(posRef.current[me], n, len).length, p?.id === 'rocket');
      setRocket(null);
      if (!live) return;
      if (posRef.current[me] >= len) { await win(me); return; }
      await surprise(me);
      if (!live) return;
      if (posRef.current[me] >= len) { await win(me); return; }
      // The final stretch: the crowd gets loud once someone is close.
      if (!stretch.current && posRef.current[me] >= len - 6) { stretch.current = true; setCheer((k) => k + 1); playClip('/lab/track-race/clap.mp3', c.current.settings, 0.7); c.current.say('Final stretch!'); await sleep(900); }
      await sleep(450);
      if (live) c.current.next();
    })();
    return () => { live = false; };
  }, [ctx.taken]); // eslint-disable-line react-hooks/exhaustive-deps

  // Layout from the box size: stands on top, the track, grass below.
  const L = players.length;
  const padL = Math.max(44, w * 0.075), padR = Math.max(30, w * 0.05);
  const sw = w > 0 ? (w - padL - padR) / len : 10;
  const Lh = Math.max(44, Math.min(h * 0.66 / L, 170, Math.max(sw * 4.5, 60)));
  const token = Math.round(Math.min(Lh * 0.78, Math.max(sw * 3.2, 40), 104));
  const trackH = Lh * L;
  const top = Math.max(18, (h - trackH) * 0.62);
  const cx = (p: number) => (p <= 0 ? padL * 0.5 : padL + (p - 0.5) * sw);
  const cy = (i: number) => top + i * Lh + Lh / 2;
  const lane = (id: string) => order.indexOf(id);
  const close = Math.max(...order.map((id) => pos[id])) >= len - 6;

  return (
    <div ref={boardRef} className="absolute inset-0 overflow-hidden rounded-panel border-heavy border-border" style={{ boxShadow: '0 8px 0 #000, 0 24px 40px rgba(36,28,61,0.3)' }}>
      {w > 0 && (
        <>
          <svg width={w} height={h} className="absolute inset-0" aria-hidden="true">
            <Stands w={w} top={top} cheer={cheer} close={close} still={ctx.still} />
            {/* The infield grass under the track, mowed in stripes. */}
            <rect x={0} y={top + trackH} width={w} height={h - top - trackH} fill="#7fc97a" />
            {Array.from({ length: Math.ceil(w / 60) }, (_, i) => <rect key={i} x={i * 60} y={top + trackH} width={30} height={h} fill="#8fd486" />)}
            {[0.07, 0.3, 0.55, 0.8].map((f, i) => <Bush key={i} x={w * f + (i % 2) * 30} y={Math.min(h - 18, top + trackH + (h - top - trackH) * (0.45 + (i % 2) * 0.2))} r={Math.min(28, (h - top - trackH) * 0.26)} />)}
            {h - top - trackH > 40 && Array.from({ length: 14 }, (_, i) => {
              const fx = ((i * 137) % 97) / 97 * w, fy = top + trackH + 16 + (((i * 61) % 89) / 89) * (h - top - trackH - 26);
              return <g key={i} stroke="#000" strokeWidth={1.3}><circle cx={fx} cy={fy} r={5} fill={['#fdfd94', '#ef7d96', '#fbfcf8', '#c58ce8'][i % 4]} /><circle cx={fx} cy={fy} r={1.8} fill="#f39a6b" /></g>;
            })}
            {/* The track itself. */}
            <rect x={-6} y={top - 10} width={w + 12} height={trackH + 20} fill="#c96f5d" stroke="#000" strokeWidth={3} />
            {order.map((id, i) => (
              <g key={id}>
                <rect x={0} y={top + i * Lh} width={w} height={Lh} fill={i % 2 ? '#ef9580' : '#f5a08c'} />
                <motion.rect x={padL} y={top + i * Lh + Lh * 0.12} height={Lh * 0.76} rx={Lh * 0.2} fill={color(id)} opacity={0.42}
                  initial={false} animate={{ width: Math.max(0, cx(pos[id]) - padL) }} transition={{ duration: ctx.still ? 0 : 0.35 }} />
              </g>
            ))}
            {Array.from({ length: len - 1 }, (_, k) => <line key={k} x1={padL + (k + 1) * sw} x2={padL + (k + 1) * sw} y1={top + 4} y2={top + trackH - 4} stroke="#fff" strokeOpacity={(k + 1) % 5 ? 0.35 : 0.7} strokeWidth={(k + 1) % 5 ? 1.5 : 3} strokeDasharray={(k + 1) % 5 ? '6 6' : undefined} />)}
            {order.slice(1).map((id, i) => <line key={id} x1={0} x2={w} y1={top + (i + 1) * Lh} y2={top + (i + 1) * Lh} stroke="#fff" strokeWidth={4} />)}
            <line x1={0} x2={w} y1={top - 2} y2={top - 2} stroke="#fff" strokeWidth={5} />
            <line x1={0} x2={w} y1={top + trackH + 2} y2={top + trackH + 2} stroke="#fff" strokeWidth={5} />
            {/* Start line and blocks. */}
            <rect x={padL - 5} y={top} width={10} height={trackH} fill="#fff" stroke="#000" strokeWidth={1.5} />
            {/* Finish: a checkered strip and flags. */}
            <Finish x={padL + len * sw} top={top} h={trackH} sq={Math.max(7, Math.min(16, Lh / 6))} />
            {order.map((id, i) => Object.entries(surprises[id]).map(([at, kind]) => revealed.has(`${id}:${at}`) && (
              <g key={`${id}${at}`} transform={`translate(${cx(+at)} ${cy(i)})`} opacity={0.9}>
                <SurpriseArt kind={kind} size={Math.min(sw * 1.3, Lh * 0.55)} />
              </g>
            )))}
          </svg>
          {/* A surprise pops up out of the track. */}
          <AnimatePresence>
            {pop && (
              <motion.div key={pop.n} className="absolute z-20 pointer-events-none" style={{ left: cx(pop.at) - token * 0.6, top: cy(lane(pop.id)) - token * 1.7, width: token * 1.2, height: token * 1.2 }}
                initial={ctx.still ? { opacity: 0 } : { scale: 0, y: token, rotate: -30 }} animate={{ scale: 1, y: 0, rotate: 0, opacity: 1 }} exit={{ opacity: 0, scale: 0.4, y: -20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 13 }} onAnimationComplete={() => window.setTimeout(() => setPop((q) => (q?.n === pop.n ? null : q)), 900)}>
                <svg viewBox="-50 -50 100 100" className="w-full h-full"><SurpriseArt kind={pop.kind} size={92} /></svg>
              </motion.div>
            )}
          </AnimatePresence>
          {/* Thrown banana or shell. */}
          <AnimatePresence>
            {throwFx && (
              <motion.div key={throwFx.n} className="absolute z-20 pointer-events-none" style={{ width: token * 0.9, height: token * 0.9, left: 0, top: 0 }}
                initial={{ x: w / 2, y: -token, rotate: 0 }} animate={{ x: cx(pos[throwFx.to]) - token * 0.45, y: cy(lane(throwFx.to)) - token * 0.45, rotate: 720 }} exit={{ opacity: 0, scale: 0.3 }}
                transition={{ duration: ctx.still ? 0 : 0.7, ease: 'easeIn' }}>
                <svg viewBox="0 0 100 100" className="w-full h-full">{throwFx.kind === 'banana' ? <BananaShape /> : <ShellShape />}</svg>
              </motion.div>
            )}
          </AnimatePresence>
          {/* The runners. */}
          {players.map((p, i) => {
            const f = fx[p.id];
            const how = mv[p.id] ?? 'hop';
            return (
              <motion.div key={p.id} className="absolute z-10 left-0 top-0 pointer-events-none" style={{ width: token, height: token }}
                initial={false} animate={{ x: cx(pos[p.id]) - token / 2, y: cy(i) - token / 2 - token * 0.08 }}
                transition={how === 'instant' || ctx.still ? { duration: 0 } : how === 'slow' ? { duration: 0.8, ease: 'easeInOut' } : how === 'fast' ? { duration: 0.17, ease: 'easeOut' } : { type: 'spring', stiffness: 320, damping: 24 }}>
                <span className="absolute left-[10%] right-[10%] bottom-[-12%] h-[22%] rounded-full bg-black/30" aria-hidden="true" />
                {rocket === p.id && !ctx.still && (
                  <motion.svg viewBox="0 0 60 30" className="absolute right-[78%] top-[38%] w-[90%]" animate={{ scaleX: [0.8, 1.2, 0.9], opacity: [0.8, 1, 0.8] }} transition={{ duration: 0.18, repeat: Infinity }} style={{ originX: 1 }} aria-hidden="true">
                    <path d="M60 15 Q30 -2 0 15 Q30 32 60 15z" fill="#f6c544" stroke="#000" strokeWidth="2.5" /><path d="M60 15 Q40 6 22 15 Q40 24 60 15z" fill="#ef7d96" />
                  </motion.svg>
                )}
                <motion.span key={f ? `${f.k}${f.n}` : 'rest'} className="block w-full h-full" style={{ originY: 1 }}
                  animate={ctx.still || !f ? undefined : FX[f.k](token)} transition={{ duration: FX_TIME[f?.k ?? 'hop'], ease: 'easeOut', repeat: f?.k === 'win' ? Infinity : 0 }}>
                  <TeamBadge colorIndex={p.colorIndex} size={token} />
                </motion.span>
                {shells.has(p.id) && (
                  <motion.svg viewBox="0 0 100 100" className="absolute -top-[42%] left-[12%] w-[76%]" initial={ctx.still ? false : { y: -30, scale: 0.4 }} animate={{ y: 0, scale: 1 }} aria-label="Turtle shell">
                    <ShellShape />
                  </motion.svg>
                )}
                {winner === p.id && <motion.span className="absolute -top-[70%] left-1/2 -translate-x-1/2 text-[1.6em]" initial={{ scale: 0 }} animate={{ scale: 1 }} aria-hidden="true"><Crown /></motion.span>}
              </motion.div>
            );
          })}
          {die && (
            <Die key={die.key} base="/lab/track-race/die" count={die.count} cpu={ctx.cpu} still={ctx.still} sfx={ctx.sfx} size={Math.round(Math.min(w / (die.count + 1.4), h * 0.36, 240))}
              onDone={(v) => die.resolve(v)} />
          )}
        </>
      )}
    </div>
  );
}

const FX: Record<Fx['k'], (t: number) => Record<string, number[]>> = {
  hop: (t) => ({ y: [0, -t * 0.42, 0, 0], scaleY: [1, 1.12, 0.8, 1], scaleX: [1, 0.92, 1.12, 1] }),
  leap: (t) => ({ y: [0, -t * 1.5, 0, 0], rotate: [0, -25, 0, 0], scaleY: [0.8, 1.15, 0.75, 1] }),
  spin: () => ({ rotate: [0, 360, 720], scaleY: [1, 0.85, 1] }),
  teleport: () => ({ scale: [1, 0.1, 0.1, 1], opacity: [1, 0, 0, 1], rotate: [0, 180, 180, 360] }),
  bonk: () => ({ scaleY: [1, 0.65, 1.1, 1], scaleX: [1, 1.25, 0.95, 1] }),
  shrug: () => ({ rotate: [0, -12, 10, -6, 0] }),
  wobble: (t) => ({ rotate: [0, 18, -14, 8, 0], x: [0, t * 0.1, -t * 0.08, 0, 0] }),
  zoom: () => ({ scaleX: [1, 1.3, 0.9, 1], skewX: [0, -14, 6, 0] }),
  win: (t) => ({ y: [0, -t * 0.4, 0], rotate: [0, -8, 8, 0] }),
};
const FX_TIME: Record<Fx['k'], number> = { hop: 0.3, leap: 0.8, spin: 0.9, teleport: 0.9, bonk: 0.5, shrug: 0.6, wobble: 0.8, zoom: 0.5, win: 0.7 };

function Crown() {
  return <svg viewBox="0 0 60 40" width="1.6em" height="1.1em"><path d="M4 36 L8 10 L20 24 L30 4 L40 24 L52 10 L56 36z" fill="#f6c544" stroke="#000" strokeWidth="3" strokeLinejoin="round" /></svg>;
}

// The grandstand above the track, its crowd bouncing when the race gets close.
function Stands({ w, top, cheer, close, still }: { w: number; top: number; cheer: number; close: boolean; still: boolean }) {
  const H = top - 12;
  // The stand is at most six rows; any room above it is sky with clouds.
  const rows = Math.max(1, Math.min(6, Math.floor((H - 18) / 30)));
  const roof = Math.min(22, H * 0.14);
  const rowH = Math.min(38, (H - roof) / (rows + 0.4));
  const y0 = H - rowH * (rows + 0.4) - roof;
  const fans = useMemo(() => {
    const cols = ['#f6c544', '#5cc3a0', '#6aa9e9', '#f39a6b', '#c58ce8', '#ef7d96', '#fbfcf8', '#9bd35a'];
    const out: { x: number; row: number; c: string; skin: string }[] = [];
    const skins = ['#f3d1b5', '#d9a47e', '#a8714f', '#f7dcc4', '#7a4f36'];
    for (let r = 0; r < rows; r++) for (let x = 14 + (r % 2) * 12; x < w; x += 24 + ((x * 7 + r * 13) % 9)) out.push({ x, row: r, c: cols[(x * 3 + r * 5) % cols.length], skin: skins[(x + r * 3) % skins.length] });
    return out;
  }, [w, rows]);
  if (H < 16) return null;
  return (
    <g>
      <rect x={0} y={0} width={w} height={H} fill="#c9e4ff" />
      {y0 > 40 && <>
        <circle cx={w * 0.86} cy={Math.min(y0 * 0.45, 80)} r={Math.min(34, y0 * 0.25)} fill="#fdfd94" stroke="#000" strokeWidth={2.5} />
        {[0.12, 0.42, 0.66].map((f, i) => <Cloud key={i} x={w * f} y={Math.min(y0 * (0.35 + (i % 2) * 0.25), y0 - 24)} s={Math.min(1.3, y0 / 110)} still={still} i={i} />)}
      </>}
      <rect x={0} y={y0} width={w} height={roof} fill="#241c3d" />
      {Array.from({ length: Math.ceil(w / 40) }, (_, i) => <path key={i} d={`M${i * 40} ${y0 + roof} l20 ${Math.min(12, roof * 0.7)} l20 -${Math.min(12, roof * 0.7)}z`} fill={['#fdfd94', '#ef7d96', '#8fe3a0', '#b4c4fb'][i % 4]} stroke="#000" strokeWidth={1.5} />)}
      {Array.from({ length: rows }, (_, r) => <rect key={r} x={0} y={y0 + roof + rowH * (r + 0.4)} width={w} height={rowH} fill={r % 2 ? '#8d9df0' : '#9aa8f2'} stroke="#000" strokeOpacity={0.25} />)}
      <motion.g key={cheer} animate={still ? undefined : { y: close ? [0, -6, 0, -4, 0] : [0, -4, 0] }} transition={{ duration: close ? 0.6 : 0.9, repeat: close ? Infinity : 1 }}>
        {fans.map((f, i) => {
          const y = y0 + roof + rowH * (f.row + 0.4) + rowH * 0.5;
          const r = Math.min(9, rowH * 0.3);
          return (
            <g key={i}>
              <rect x={f.x - r} y={y} width={r * 2} height={r * 1.4} rx={r * 0.5} fill={f.c} stroke="#000" strokeWidth={1.2} />
              <circle cx={f.x} cy={y - r * 0.35} r={r * 0.75} fill={f.skin} stroke="#000" strokeWidth={1.2} />
            </g>
          );
        })}
      </motion.g>
      <rect x={0} y={H - 4} width={w} height={8} fill="#fbfcf8" stroke="#000" strokeWidth={2} />
    </g>
  );
}

function Cloud({ x, y, s, still, i }: { x: number; y: number; s: number; still: boolean; i: number }) {
  return (
    <motion.g animate={still ? undefined : { x: [0, 24, 0] }} transition={{ duration: 14 + i * 3, repeat: Infinity, ease: 'easeInOut' }}>
      <g transform={`translate(${x} ${y}) scale(${s})`} fill="#fff" stroke="#000" strokeWidth={2}>
        <path d="M-40 10 a16 16 0 0 1 10 -26 a22 22 0 0 1 40 -4 a16 16 0 0 1 28 14 a12 12 0 0 1 2 16z" />
      </g>
    </motion.g>
  );
}

function Finish({ x, top, h, sq }: { x: number; top: number; h: number; sq: number }) {
  const n = Math.ceil(h / sq);
  return (
    <g>
      {Array.from({ length: n }, (_, r) => [0, 1].map((c) => <rect key={`${r}${c}`} x={x + c * sq} y={top + r * sq} width={sq} height={Math.min(sq, top + h - (top + r * sq))} fill={(r + c) % 2 ? '#000' : '#fff'} />))}
      <rect x={x} y={top} width={sq * 2} height={h} fill="none" stroke="#000" strokeWidth={2} />
      <line x1={x + sq} x2={x + sq} y1={top - 6} y2={top - 46} stroke="#000" strokeWidth={4} />
      <path d={`M${x + sq} ${top - 46} l28 9 l-28 9z`} fill="#fdfd94" stroke="#000" strokeWidth={2.5} strokeLinejoin="round" />
    </g>
  );
}

function Bush({ x, y, r }: { x: number; y: number; r: number }) {
  if (r < 6) return null;
  return <g stroke="#000" strokeWidth={2}><circle cx={x - r * 0.7} cy={y + r * 0.2} r={r * 0.7} fill="#4fae5c" /><circle cx={x + r * 0.7} cy={y + r * 0.2} r={r * 0.75} fill="#4fae5c" /><circle cx={x} cy={y - r * 0.15} r={r} fill="#5cc068" /></g>;
}

// The hidden surprise spaces, drawn around (0, 0).
function SurpriseArt({ kind, size }: { kind: Surprise; size: number }) {
  const s = size / 100;
  return (
    <g transform={`scale(${s})`} strokeLinejoin="round">
      {kind === 'boost' && <><rect x={-42} y={-42} width={84} height={84} rx={16} fill="#fdfd94" stroke="#000" strokeWidth={6} /><path d="M-26 -22 L0 0 L-26 22 M4 -22 L30 0 L4 22" stroke="#000" strokeWidth={10} fill="none" strokeLinecap="round" /></>}
      {kind === 'spring' && <><rect x={-34} y={26} width={68} height={14} rx={5} fill="#241c3d" stroke="#000" strokeWidth={5} /><path d="M-26 26 L26 14 L-26 2 L26 -10 L-26 -22 L26 -34" stroke="#9aa8f2" strokeWidth={9} fill="none" strokeLinecap="round" /><path d="M-26 26 L26 14 L-26 2 L26 -10 L-26 -22 L26 -34" stroke="#000" strokeWidth={3} fill="none" strokeLinecap="round" /></>}
      {kind === 'mud' && <><path d="M-44 6 C-44 -18 -12 -24 0 -14 C14 -28 46 -16 42 6 C46 26 10 34 -2 26 C-20 36 -46 26 -44 6z" fill="#8a5a3b" stroke="#000" strokeWidth={6} /><ellipse cx={-12} cy={-4} rx={10} ry={5} fill="#b07a52" /></>}
      {kind === 'mystery' && <><rect x={-40} y={-40} width={80} height={80} rx={14} fill="#c58ce8" stroke="#000" strokeWidth={6} /><text x={0} y={24} textAnchor="middle" fontSize={64} fontWeight={900} fill="#fff" stroke="#000" strokeWidth={4} paintOrder="stroke" fontFamily="system-ui">?</text></>}
    </g>
  );
}

function BananaShape() {
  return <g stroke="#000" strokeWidth={5} strokeLinejoin="round"><path d="M18 30 C30 78 74 84 88 56 C70 70 40 64 30 26z" fill="#f6e04a" /><path d="M30 26 L24 14 L34 20z" fill="#8a5a3b" /><path d="M40 60 C30 74 18 80 12 76 M62 72 C64 86 58 94 52 94" fill="none" /></g>;
}
function ShellShape() {
  return <g stroke="#000" strokeWidth={5} strokeLinejoin="round"><path d="M10 70 C10 30 90 30 90 70z" fill="#5cc068" /><path d="M30 68 L38 46 L62 46 L70 68 M38 46 L50 36 L62 46" fill="none" strokeWidth={4} /><rect x={6} y={66} width={88} height={12} rx={6} fill="#fdfd94" /></g>;
}

// Classic power-up pictures, drawn in code.
function Art({ kind }: { kind: string }) {
  const ring = (fill: string) => <circle cx="50" cy="50" r="44" fill={fill} stroke="#000" strokeWidth="5" />;
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      {kind === 'rocket' && <>{ring('#b4c4fb')}<path d="M14 60 Q22 50 30 58 Q22 66 14 60z" fill="#f6c544" stroke="#000" strokeWidth="3" /><path d="M30 46 L54 46 Q58 30 70 32 L74 52 Q86 54 84 66 L30 66z" fill="#ef7d96" stroke="#000" strokeWidth="4" strokeLinejoin="round" /><rect x="28" y="64" width="58" height="8" rx="4" fill="#fbfcf8" stroke="#000" strokeWidth="3.5" /><path d="M42 52 h10 M42 58 h14" stroke="#000" strokeWidth="3" /></>}
      {kind === 'jump' && <>{ring('#8fe3a0')}<path d="M26 72 Q50 8 74 60" stroke="#000" strokeWidth="5" fill="none" strokeDasharray="7 6" strokeLinecap="round" /><path d="M66 52 L76 64 L80 48z" fill="#000" /><path d="M30 82 L46 74 L30 66 L46 58" stroke="#241c3d" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></>}
      {kind === 'double' && <>{ring('#fdfd94')}<rect x="16" y="30" width="34" height="34" rx="7" fill="#fff" stroke="#000" strokeWidth="4" transform="rotate(-12 33 47)" /><rect x="50" y="38" width="34" height="34" rx="7" fill="#fff" stroke="#000" strokeWidth="4" transform="rotate(10 67 55)" /><circle cx="27" cy="40" r="4" /><circle cx="38" cy="52" r="4" /><circle cx="60" cy="48" r="4" /><circle cx="67" cy="56" r="4" /><circle cx="74" cy="64" r="4" /></>}
      {kind === 'shell' && <>{ring('#e9eefe')}<g transform="translate(0 4)"><ShellShape /></g><circle cx="86" cy="64" r="7" fill="#9bd35a" stroke="#000" strokeWidth="3.5" /></>}
      {kind === 'swap' && <>{ring('#c58ce8')}<ellipse cx="50" cy="50" rx="26" ry="30" fill="#241c3d" stroke="#000" strokeWidth="4" /><ellipse cx="50" cy="50" rx="16" ry="20" fill="#7fd6e3" /><path d="M20 36 h18 l-6 -6 M80 64 h-18 l6 6" stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" /><path d="M78 22 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" fill="#fdfd94" stroke="#000" strokeWidth="2" /></>}
      {kind === 'banana' && <>{ring('#fdfd94')}<g transform="translate(-2 -4)"><BananaShape /></g></>}
      {kind === 'wind' && <>{ring('#7fd6e3')}<path d="M18 40 Q50 22 70 36 Q82 46 70 54 Q60 58 58 50 M14 58 H62 Q76 58 76 68 Q76 78 64 76 M22 74 H40" stroke="#000" strokeWidth="5" fill="none" strokeLinecap="round" /><circle cx="40" cy="44" r="3.5" /><circle cx="52" cy="42" r="3.5" /><path d="M40 50 Q46 56 54 49" stroke="#000" strokeWidth="3" fill="none" strokeLinecap="round" /></>}
    </svg>
  );
}

function Cover() {
  const lanes = ['#f6c544', '#5cc3a0', '#6aa9e9'];
  const at = [62, 44, 30];
  return (
    <svg viewBox="0 0 100 62" preserveAspectRatio="xMidYMid slice" style={{ background: '#9aa8f2' }}>
      <rect width="100" height="10" fill="#241c3d" />
      {Array.from({ length: 34 }, (_, i) => <circle key={i} cx={2 + i * 3} cy={13 + (i % 2) * 2.5} r="1.3" fill={['#f6c544', '#ef7d96', '#8fe3a0', '#fbfcf8'][i % 4]} stroke="#000" strokeWidth="0.3" />)}
      <rect y="18" width="100" height="32" fill="#f5a08c" stroke="#000" strokeWidth="0.8" />
      {[28.6, 39.3].map((y) => <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="#fff" strokeWidth="0.9" />)}
      {Array.from({ length: 16 }, (_, i) => <line key={i} x1={12 + i * 5} x2={12 + i * 5} y1="18" y2="50" stroke="#fff" strokeOpacity="0.4" strokeWidth="0.4" />)}
      {Array.from({ length: 8 }, (_, r) => [0, 1].map((k) => <rect key={`${r}${k}`} x={88 + k * 2} y={18 + r * 4} width="2" height="4" fill={(r + k) % 2 ? '#000' : '#fff'} />))}
      {lanes.map((c, i) => <g key={c}><rect x="10" y={20 + i * 10.7} width={at[i] - 10} height="6.5" rx="3" fill={c} opacity="0.45" /><circle cx={at[i]} cy={23.3 + i * 10.7} r="4.2" fill={c} stroke="#000" strokeWidth="0.8" /></g>)}
      <rect y="50" width="100" height="12" fill="#7fc97a" />
      <rect x="70" y="2" width="13" height="13" rx="2.5" fill="#fff" stroke="#000" strokeWidth="0.8" transform="rotate(12 76 8)" />
      {[[73, 5], [79, 11], [76, 8]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.2" />)}
    </svg>
  );
}

const def: LabDef = {
  id: 'track-race',
  name: 'Track Race',
  description: 'Answer right to roll the big die. Hop down your lane and be first across the finish line.',
  ways: ['teams'],
  minTeams: 2,
  maxTeams: 6,
  how: [
    { icon: <CheckCircle weight="fill" />, text: 'Answer the question' },
    { icon: <DiceFive weight="fill" />, text: 'Right? Tap the die to roll' },
    { icon: <FlagCheckered weight="fill" />, text: 'First across the finish wins' },
  ],
  rounds: { label: 'Rounds', min: 6, max: 20, default: 12 },
  powers: POWERS,
  background: 'linear-gradient(180deg, #c9d2ff 0%, #9aa8f2 100%)',
  cover: <Cover />,
  pieces: [
    { id: 'background', label: 'Background', hint: 'Behind the stadium' },
    { id: 'stands', label: 'Grandstand', hint: 'The crowd above the track' },
    { id: 'lane', label: 'Lane', hint: 'One running lane, left to right' },
    { id: 'start', label: 'Start line', hint: 'Where every runner starts' },
    { id: 'finish', label: 'Finish line', hint: 'The checkered line and flag' },
    { id: 'grass', label: 'Infield', hint: 'The grass under the track' },
    { id: 'runner', label: 'Runners', hint: 'Each team\'s runner (the team picture)' },
    { id: 'die', label: 'Die', hint: 'All six sides of the die' },
    { id: 'surprise-boost', label: 'Speed pad', hint: 'Hidden space: zoom two ahead' },
    { id: 'surprise-spring', label: 'Spring', hint: 'Hidden space: bounce three ahead' },
    { id: 'surprise-mud', label: 'Mud puddle', hint: 'Hidden space: slide back one' },
    { id: 'surprise-mystery', label: 'Mystery box', hint: 'Hidden space: any of the three' },
    ...POWERS.map((p) => ({ id: `power-${p.id}`, label: p.name, hint: p.desc })),
  ],
  Play,
};
export default def;
