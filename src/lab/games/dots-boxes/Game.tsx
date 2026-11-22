import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle, PencilSimpleLine, SquaresFour } from '@phosphor-icons/react';
import { playClip } from '../../../engine/music';
import { TeamBadge } from '../../../engine/TeamBadge';
import { TEAM_COLORS } from '../../../engine/turns';
import type { LabCtx, LabDef, LabPower } from '../../types';
import { allBoxes, closes, cpuLine, loose, open, quake, sizeFor, threeSided, type Lines } from './boxes';

// Box Builder (Game Lab, dots and boxes): a right answer lets a team draw one
// line between two dots. Closing a box fills it with the team's color and
// picture and gives another line. Most boxes wins.

const POWERS: LabPower[] = [
  { id: 'two', name: 'Two Lines', desc: 'Draw two lines this turn.', enter: 'drop', art: <Art kind="two" /> },
  { id: 'bucket', name: 'Paint Bucket', desc: 'Pour paint on a box with three sides and it is yours.', enter: 'spin', art: <Art kind="bucket" /> },
  { id: 'eraser', name: 'Eraser', desc: 'Rub out any line that is not part of a box.', enter: 'zoom', art: <Art kind="eraser" /> },
  { id: 'gold', name: 'Golden Box', desc: 'A gold box appears. Whoever closes it gets 3 points.', enter: 'spin', art: <Art kind="gold" /> },
  { id: 'star', name: 'Star Stamp', desc: 'Two bonus points right now.', enter: 'drop', art: <Art kind="star" /> },
  { id: 'quake', name: 'Earthquake', desc: 'Whoops! The table shakes and some lines jump to new spots.', silly: true, art: <Art kind="quake" /> },
  { id: 'wobbly', name: 'Wobbly Pencil', desc: 'Whoops! Your pencil wobbles and draws a line wherever it lands.', silly: true, art: <Art kind="wobbly" /> },
];

type Mode = 'wait' | 'draw' | 'bucket' | 'erase' | 'busy';
type Sprite = { kind: 'bucket' | 'eraser' | 'pencil' | 'stamp'; x: number; y: number; n: number; path?: { x: number; y: number }[] };
const sleep = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));
const M = 50;

function ends(l: string) {
  const [k, r, c] = l.split('-'); const R = +r, C = +c;
  return k === 'h' ? { x1: C * 100, y1: R * 100, x2: C * 100 + 100, y2: R * 100 } : { x1: C * 100, y1: R * 100, x2: C * 100, y2: R * 100 + 100 };
}
const mid = (l: string) => { const e = ends(l); return { x: (e.x1 + e.x2) / 2, y: (e.y1 + e.y2) / 2 }; };

function Play({ ctx }: { ctx: LabCtx }) {
  const c = useRef(ctx); c.current = ctx;
  const players = ctx.turns.players;
  const [size] = useState(() => sizeFor(players.length));
  const { R, C } = size;
  const VW = C * 100 + 2 * M, VH = R * 100 + 2 * M;
  const [lines, setLinesState] = useState<Lines>({});
  const linesRef = useRef(lines);
  const setLines = (l: Lines) => { linesRef.current = l; setLinesState(l); };
  const [claimed, setClaimedState] = useState<Record<string, string>>({});
  const claimedRef = useRef(claimed);
  const setClaimed = (b: Record<string, string>) => { claimedRef.current = b; setClaimedState(b); };
  const [gold, setGold] = useState<string | null>(null);
  const goldRef = useRef(gold); goldRef.current = gold;
  const [mode, setModeState] = useState<Mode>('wait');
  const modeRef = useRef(mode);
  const setMode = (m: Mode) => { modeRef.current = m; setModeState(m); };
  const left = useRef(0);
  const [sprite, setSprite] = useState<Sprite | null>(null);
  const [shake, setShake] = useState(0);
  const [erasing, setErasing] = useState<string | null>(null);
  const fitRef = useRef<HTMLDivElement>(null);
  const me = ctx.player;
  const color = (id: string) => TEAM_COLORS[(players.find((p) => p.id === id)?.colorIndex ?? 0) % TEAM_COLORS.length];
  const colorIndex = (id: string) => players.find((p) => p.id === id)?.colorIndex ?? 0;
  const pct = (x: number, y: number) => ({ left: `${((x + M) / VW) * 100}%`, top: `${((y + M) / VH) * 100}%` });
  // A spot on the board as 0..1 of the screen, for confetti.
  const screen = (x: number, y: number) => {
    const r = fitRef.current?.getBoundingClientRect();
    if (!r) return { x: 0.5, y: 0.5 };
    return { x: (r.left + ((x + M) / VW) * r.width) / window.innerWidth, y: (r.top + ((y + M) / VH) * r.height) / window.innerHeight };
  };

  const full = () => allBoxes(size).every((b) => claimedRef.current[b]);
  function endTurn(delay = 900) {
    setMode('busy');
    window.setTimeout(() => {
      if (full()) {
        const x = c.current;
        const top = [...x.turns.players].sort((a, b) => b.score - a.score);
        x.sfx.cheer(); x.say('Board full!', 'big');
        window.setTimeout(() => c.current.finish(top[0] && top[1] && top[0].score === top[1].score ? undefined : `${top[0].name} built the most boxes!`), 1800);
        return;
      }
      c.current.next();
    }, delay);
  }

  // Claim boxes for the current player (gold ones are worth 3).
  function claim(boxes: string[], owner: string) {
    if (!boxes.length) return 0;
    const x = c.current;
    const next = { ...claimedRef.current };
    let pts = 0;
    for (const b of boxes) {
      next[b] = owner;
      const g = goldRef.current === b;
      pts += g ? 3 : 1;
      if (g) setGold(null);
      const [r, cc] = b.split('-').map(Number);
      const s = screen(cc * 100 + 50, r * 100 + 50); x.burst(s.x, s.y, g ? 'big' : 'small');
    }
    setClaimed(next);
    x.points(pts, owner);
    playClip('/lab/dots-boxes/box.mp3', x.settings, 0.7); x.sfx.coin();
    x.say(pts >= 3 ? 'Golden box! +3' : boxes.length > 1 ? 'Double box!' : 'Box!', pts >= 3 ? 'big' : 'good');
    return pts;
  }

  // Draw one line; closing a box gives another line.
  function draw(l: string, owner: string) {
    const x = c.current;
    const closed = closes(linesRef.current, l, size);
    setLines({ ...linesRef.current, [l]: owner });
    x.sfx.build();
    if (closed.length) { window.setTimeout(() => claim(closed, owner), 300); }
    else left.current -= 1;
    if (open(linesRef.current, size).length === 0 || allBoxes(size).every((b) => claimedRef.current[b] || closed.includes(b))) { endTurn(1400); return; }
    if (left.current <= 0) endTurn();
  }

  async function startMove(p: LabPower | null) {
    const x = c.current, id = x.player.id;
    left.current = p?.id === 'two' ? 2 : 1;
    if (p?.id === 'two') x.say('Two lines!');
    if (p?.id === 'star') {
      setSprite({ kind: 'stamp', x: (C * 100) / 2, y: (R * 100) / 2, n: Date.now() }); await sleep(450);
      x.sfx.thud(); x.points(2); x.say('+2 stars!'); const s = screen(C * 50, R * 50); x.burst(s.x, s.y); await sleep(700); setSprite(null);
    }
    if (p?.id === 'gold') {
      const free = allBoxes(size).filter((b) => !claimedRef.current[b]);
      const pick = free[Math.floor(Math.random() * free.length)];
      if (pick) { setGold(pick); x.sfx.chest(); x.say('A golden box!'); await sleep(900); }
    }
    if (p?.id === 'quake') {
      x.sfx.crash(); setShake((k) => k + 1); x.say('Earthquake!', 'oops');
      await sleep(400);
      const q = quake(linesRef.current, claimedRef.current, size, 3);
      setLines(q.lines);
      await sleep(900);
    }
    if (p?.id === 'wobbly') {
      x.sfx.boing(); x.say('Wobbly pencil!', 'oops');
      const o = open(linesRef.current, size);
      const target = o[Math.floor(Math.random() * o.length)];
      if (target) {
        const m = mid(target);
        const path = [0, 1, 2].map(() => ({ x: Math.random() * C * 100, y: Math.random() * R * 100 })).concat([m]);
        setSprite({ kind: 'pencil', x: m.x, y: m.y, n: Date.now(), path });
        await sleep(ctx.still ? 200 : 1700);
        setSprite(null);
        left.current = 1;
        draw(target, id);
        if (modeRef.current === 'busy') return;
      }
      // A closed box gives another line; otherwise the wobble was the move.
      if (left.current <= 0) return;
    }
    if (p?.id === 'bucket') { setMode('bucket'); return; }
    if (p?.id === 'eraser') { setMode('erase'); return; }
    setMode('draw');
  }

  // Every turn: a question, then a line if it was right.
  useEffect(() => {
    let live = true;
    setMode('wait');
    void c.current.ask().then(async (ok) => {
      if (!live) return;
      if (!ok) { c.current.sfx.wrong(); window.setTimeout(() => live && c.current.next(), 600); return; }
      const p = await c.current.power(0.4, (pw) => {
        if (pw.id === 'bucket') return threeSided(linesRef.current, claimedRef.current, size).length > 0;
        if (pw.id === 'eraser') return loose(linesRef.current, claimedRef.current, size).length > 0;
        if (pw.id === 'quake') return loose(linesRef.current, claimedRef.current, size).length >= 2;
        if (pw.id === 'gold') return !goldRef.current && allBoxes(size).some((b) => !claimedRef.current[b]);
        return true;
      });
      if (!live) return;
      await startMove(p);
    });
    return () => { live = false; };
  }, [ctx.taken]); // eslint-disable-line react-hooks/exhaustive-deps

  async function pour(b: string) {
    const x = c.current, id = x.player.id;
    const [r, cc] = b.split('-').map(Number);
    setMode('busy');
    setSprite({ kind: 'bucket', x: cc * 100 + 50, y: r * 100 + 50, n: Date.now() }); x.sfx.splash();
    await sleep(800);
    const missing = ['h-' + r + '-' + cc, 'h-' + (r + 1) + '-' + cc, 'v-' + r + '-' + cc, 'v-' + r + '-' + (cc + 1)].find((s) => !linesRef.current[s]);
    if (missing) {
      const also = closes(linesRef.current, missing, size).filter((k) => k !== b);
      setLines({ ...linesRef.current, [missing]: id });
      claim([b, ...also], id);
    }
    await sleep(500); setSprite(null);
    if (full()) { endTurn(); return; }
    left.current = 1; setMode('draw');
  }

  async function rub(l: string) {
    const x = c.current;
    setMode('busy');
    const m = mid(l);
    setSprite({ kind: 'eraser', x: m.x, y: m.y, n: Date.now() }); setErasing(l); x.sfx.swish();
    await sleep(900);
    const next = { ...linesRef.current }; delete next[l]; setLines(next);
    setErasing(null); x.say('Rubbed out!');
    await sleep(400); setSprite(null);
    left.current = 1; setMode('draw');
  }

  function tapLine(l: string) {
    const x = c.current;
    if (modeRef.current === 'draw' && !linesRef.current[l]) { x.sfx.tap(); draw(l, x.player.id); return; }
    if (modeRef.current === 'erase' && linesRef.current[l] && loose(linesRef.current, claimedRef.current, size).includes(l)) void rub(l);
  }
  function tapBox(b: string) {
    if (modeRef.current === 'bucket' && threeSided(linesRef.current, claimedRef.current, size).includes(b)) void pour(b);
  }

  // The computer draws its own lines, after a little think.
  useEffect(() => {
    if (!ctx.cpu || (mode !== 'draw' && mode !== 'bucket' && mode !== 'erase')) return;
    const id = window.setTimeout(() => {
      const x = c.current;
      if (modeRef.current === 'draw') { const l = cpuLine(linesRef.current, size, x.cpuRight()); if (l) tapLine(l); }
      else if (modeRef.current === 'bucket') { const t = threeSided(linesRef.current, claimedRef.current, size); if (t[0]) tapBox(t[0]); }
      else { const lo = loose(linesRef.current, claimedRef.current, size); if (lo.length) tapLine(lo[Math.floor(Math.random() * lo.length)]); }
    }, 1400 + Math.random() * 600);
    return () => window.clearTimeout(id);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const canTap = !ctx.cpu && (mode === 'draw' || mode === 'erase' || mode === 'bucket');
  const looseNow = mode === 'erase' ? loose(lines, claimed, size) : [];
  const three = mode === 'bucket' ? threeSided(lines, claimed, size) : [];

  return (
    <div className="absolute inset-0 grid place-items-center">
      <motion.div key={shake} className="relative lab-fit" style={{ '--ar': VW / VH } as React.CSSProperties}
        animate={shake && !ctx.still ? { x: [0, -14, 12, -10, 8, -4, 0], rotate: [0, -1.5, 1.2, -1, 0.6, 0] } : undefined} transition={{ duration: 0.7 }}>
        <div ref={fitRef} className="absolute inset-[2%]">
          {/* The paper: a pinned sheet of graph paper on the desk. */}
          <div className="absolute inset-0 rounded-[2.5%] border-heavy border-border overflow-hidden" style={{ background: '#fbfcf8', boxShadow: '0 8px 0 #000, 0 26px 40px rgba(36,28,61,0.35)', transform: 'rotate(-0.6deg)' }}>
            <svg viewBox={`${-M} ${-M} ${VW} ${VH}`} className="absolute inset-0 w-full h-full" preserveAspectRatio="none" aria-hidden="true">
              {Array.from({ length: Math.ceil(VW / 25) + 1 }, (_, i) => <line key={`x${i}`} x1={-M + i * 25} x2={-M + i * 25} y1={-M} y2={VH} stroke="#b4c4fb" strokeOpacity={0.45} strokeWidth={1.2} />)}
              {Array.from({ length: Math.ceil(VH / 25) + 1 }, (_, i) => <line key={`y${i}`} y1={-M + i * 25} y2={-M + i * 25} x1={-M} x2={VW} stroke="#b4c4fb" strokeOpacity={0.45} strokeWidth={1.2} />)}
              <line x1={-M + 24} x2={-M + 24} y1={-M} y2={VH} stroke="#ef7d96" strokeWidth={2.5} strokeOpacity={0.7} />
            </svg>
          </div>
          {[[-1, -1, -12], [1, -1, 10], [-1, 1, 8], [1, 1, -14]].map(([sx, sy, rot], i) => (
            <span key={i} aria-hidden="true" className="absolute w-[11%] h-[6%] rounded-sm border-std border-border/40" style={{ background: 'rgba(253,253,148,0.85)', left: sx < 0 ? '-3%' : undefined, right: sx > 0 ? '-3%' : undefined, top: sy < 0 ? '-1.5%' : undefined, bottom: sy > 0 ? '-1.5%' : undefined, transform: `rotate(${rot}deg)` }} />
          ))}
          {/* Claimed boxes and the golden box. */}
          {allBoxes(size).map((b) => {
            const [r, cc] = b.split('-').map(Number);
            const owner = claimed[b];
            const isGold = gold === b;
            const target = three.includes(b) && canTap;
            const p = pct(cc * 100 + 6, r * 100 + 6);
            return (
              <button key={b} type="button" disabled={!target} onClick={() => tapBox(b)} aria-label={owner ? `Box of ${players.find((q) => q.id === owner)?.name}` : target ? 'Box with three sides: pour paint' : 'Empty box'}
                className="absolute grid place-items-center rounded-[10%] disabled:cursor-default motion-safe:enabled:hover:scale-105 motion-safe:transition-transform"
                style={{ ...p, width: `${(88 / VW) * 100}%`, height: `${(88 / VH) * 100}%`, outline: target ? `4px dashed ${color(me.id)}` : undefined, outlineOffset: -6 }}>
                {isGold && !owner && (
                  <motion.span className="absolute inset-0 rounded-[10%] border-std border-border grid place-items-center" style={{ background: 'linear-gradient(135deg, #fff6b0, #f6c544 60%, #e0a92a)' }}
                    initial={ctx.still ? false : { scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 220, damping: 12 }}>
                    <motion.svg viewBox="0 0 100 100" className="w-[55%] h-[55%]" animate={ctx.still ? undefined : { rotate: 360 }} transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}>
                      <path d="M50 8l11 27 29 2-22 19 7 28-25-15-25 15 7-28-22-19 29-2z" fill="#fffbe0" stroke="#000" strokeWidth="5" strokeLinejoin="round" />
                    </motion.svg>
                  </motion.span>
                )}
                <AnimatePresence>
                  {owner && (
                    <motion.span key={owner} className="absolute inset-0 rounded-[10%] grid place-items-center border-std border-border" style={{ background: color(owner) }}
                      initial={ctx.still ? false : { scale: 0, rotate: -25, borderRadius: '50%' }} animate={{ scale: 1, rotate: 0, borderRadius: '10%' }} transition={{ type: 'spring', stiffness: 260, damping: 13 }}>
                      <motion.span initial={ctx.still ? false : { scale: 2.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 400, damping: 14 }} className="w-[62%] h-[62%] [&>span]:!w-full [&>span]:!h-full [&_svg]:!w-[56%] [&_svg]:!h-[56%]">
                        <TeamBadge colorIndex={colorIndex(owner)} size={40} />
                      </motion.span>
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
          {/* Lines and dots. */}
          <svg viewBox={`${-M} ${-M} ${VW} ${VH}`} className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
            <AnimatePresence>
              {Object.entries(lines).map(([l, owner]) => {
                const e = ends(l);
                return (
                  <motion.g key={l} initial={false} exit={{ opacity: 0 }} animate={{ opacity: erasing === l ? [1, 0.4, 0.8, 0.2] : 1 }} transition={{ duration: erasing === l ? 0.9 : 0.2 }}>
                    <motion.line {...e} stroke="#000" strokeWidth={17} strokeLinecap="round" initial={ctx.still ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.35, ease: 'easeOut' }} />
                    <motion.line {...e} stroke={color(owner)} strokeWidth={10} strokeLinecap="round" initial={ctx.still ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.35, ease: 'easeOut' }} />
                  </motion.g>
                );
              })}
            </AnimatePresence>
            {Array.from({ length: (R + 1) * (C + 1) }, (_, i) => {
              const x = (i % (C + 1)) * 100, y = Math.floor(i / (C + 1)) * 100;
              return <g key={i}><circle cx={x + 2} cy={y + 4} r={12} fill="#000" opacity={0.25} /><circle cx={x} cy={y} r={12} fill="#241c3d" stroke="#000" strokeWidth={3} /><circle cx={x - 4} cy={y - 4} r={3.5} fill="#fff" opacity={0.7} /></g>;
            })}
          </svg>
          {/* The gaps to tap. */}
          {(mode === 'draw' ? open(lines, size) : mode === 'erase' ? looseNow : []).map((l) => {
            const m = mid(l), hz = l[0] === 'h';
            const w = hz ? 74 : 40, h = hz ? 40 : 74;
            return (
              <button key={l} type="button" disabled={!canTap} onClick={() => tapLine(l)} aria-label={mode === 'erase' ? 'Erase this line' : 'Draw a line here'}
                className="group absolute grid place-items-center rounded-full disabled:cursor-default"
                style={{ ...pct(m.x - w / 2, m.y - h / 2), width: `${(w / VW) * 100}%`, height: `${(h / VH) * 100}%` }}>
                <span className={`block rounded-full transition-all duration-150 ${mode === 'erase' ? 'opacity-70 group-hover:opacity-100' : 'opacity-0 group-hover:opacity-60 group-focus-visible:opacity-60'} group-hover:scale-110`}
                  style={{ width: hz ? '100%' : '28%', height: hz ? '28%' : '100%', background: mode === 'erase' ? 'repeating-linear-gradient(45deg, #fff 0 6px, #ef7d96 6px 12px)' : color(me.id), border: '2px solid #000' }} />
                {mode === 'draw' && canTap && !ctx.still && <span aria-hidden="true" className="absolute rounded-full border-2 border-dashed border-border-soft group-hover:opacity-0 motion-safe:animate-pulse" style={{ width: hz ? '82%' : '8%', height: hz ? '8%' : '82%' }} />}
              </button>
            );
          })}
          {/* Power-up sprites. */}
          <AnimatePresence>
            {sprite && <SpriteFx key={sprite.n} s={sprite} pct={pct} still={ctx.still} />}
          </AnimatePresence>
        </div>
        {(mode === 'bucket' || mode === 'erase') && canTap && (
          <motion.p className="absolute -top-1 inset-x-0 text-center font-display text-2xl text-white pointer-events-none" style={{ WebkitTextStroke: '0.1em #000', paintOrder: 'stroke fill' }} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} aria-live="polite">
            {mode === 'bucket' ? 'Tap a box with three sides' : 'Tap a line to rub it out'}
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}

function SpriteFx({ s, pct, still }: { s: Sprite; pct: (x: number, y: number) => { left: string; top: string }; still: boolean }) {
  const p = pct(s.x, s.y);
  const box = 'absolute pointer-events-none w-[16%] aspect-square -translate-x-1/2 -translate-y-1/2 z-20';
  if (s.kind === 'pencil' && s.path) {
    const pts = s.path.map((q) => pct(q.x, q.y));
    return (
      <motion.div className={box} initial={{ left: pts[0].left, top: pts[0].top, opacity: 0 }} animate={still ? { left: p.left, top: p.top, opacity: 1 } : { left: pts.map((q) => q.left), top: pts.map((q) => q.top), opacity: 1, rotate: [0, -30, 25, -20, 0] }}
        exit={{ opacity: 0 }} transition={{ duration: 1.5, ease: 'easeInOut' }}>
        <PencilArt />
      </motion.div>
    );
  }
  if (s.kind === 'bucket') return (
    <motion.div className={box} style={{ left: p.left, top: p.top }} initial={still ? false : { y: '-140%', rotate: 0, opacity: 0 }} animate={{ y: '-70%', rotate: [0, 0, 110], opacity: 1 }} exit={{ opacity: 0, y: '-120%' }} transition={{ duration: 0.8, times: [0, 0.4, 1] }}>
      <svg viewBox="0 0 100 100" className="w-full h-full"><BucketShape /></svg>
    </motion.div>
  );
  if (s.kind === 'eraser') return (
    <motion.div className={box} style={{ left: p.left, top: p.top }} initial={still ? false : { opacity: 0, scale: 0.5 }} animate={still ? { opacity: 1 } : { opacity: 1, scale: 1, x: [0, -22, 22, -22, 22, 0], rotate: [-20, -10, -30, -10, -30, -20] }} exit={{ opacity: 0, scale: 0.4 }} transition={{ duration: 0.9 }}>
      <svg viewBox="0 0 100 100" className="w-full h-full"><EraserShape /></svg>
    </motion.div>
  );
  return (
    <motion.div className="absolute pointer-events-none w-[34%] aspect-square -translate-x-1/2 -translate-y-1/2 z-20" style={{ left: p.left, top: p.top }} initial={still ? false : { scale: 3, opacity: 0, rotate: -30 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} exit={{ opacity: 0, scale: 1.3 }} transition={{ type: 'spring', stiffness: 300, damping: 15 }}>
      <svg viewBox="0 0 100 100" className="w-full h-full"><path d="M50 6l13 29 31 3-24 21 7 31-27-16-27 16 7-31-24-21 31-3z" fill="#f6c544" stroke="#000" strokeWidth="5" strokeLinejoin="round" /><text x="50" y="62" textAnchor="middle" fontSize="24" fontWeight="900" fill="#000">+2</text></svg>
    </motion.div>
  );
}

function PencilArt() {
  return <svg viewBox="0 0 100 100" className="w-full h-full"><g transform="rotate(40 50 50)" stroke="#000" strokeWidth="4" strokeLinejoin="round"><rect x="40" y="8" width="20" height="62" fill="#fdfd94" /><rect x="40" y="8" width="20" height="12" fill="#ef7d96" /><path d="M40 70 L50 92 L60 70z" fill="#f3d1b5" /><path d="M46 84 L50 92 L54 84z" fill="#241c3d" /></g></svg>;
}
function BucketShape() {
  return <g stroke="#000" strokeWidth="4.5" strokeLinejoin="round"><path d="M22 34 L30 86 H70 L78 34z" fill="#6aa9e9" /><ellipse cx="50" cy="34" rx="28" ry="9" fill="#ef7d96" /><path d="M24 34 Q50 4 76 34" fill="none" /><path d="M30 46 Q50 54 70 46" stroke="#fff" strokeOpacity="0.6" fill="none" /></g>;
}
function EraserShape() {
  return <g stroke="#000" strokeWidth="4.5" strokeLinejoin="round" transform="rotate(-25 50 50)"><rect x="18" y="34" width="64" height="32" rx="6" fill="#f5a08c" /><rect x="18" y="34" width="24" height="32" rx="6" fill="#6aa9e9" /></g>;
}

// Classic power-up pictures, drawn in code.
function Art({ kind }: { kind: string }) {
  const ring = (fill: string) => <circle cx="50" cy="50" r="44" fill={fill} stroke="#000" strokeWidth="5" />;
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      {kind === 'two' && <>{ring('#b4c4fb')}{[[22, 38, 78, 38], [22, 62, 78, 62]].map(([a, b, cc, d], i) => <g key={i}><line x1={a} y1={b} x2={cc} y2={d} stroke="#000" strokeWidth="12" strokeLinecap="round" /><line x1={a} y1={b} x2={cc} y2={d} stroke={i ? '#8fe3a0' : '#f6c544'} strokeWidth="6" strokeLinecap="round" /></g>)}{[22, 78].map((x) => [38, 62].map((y) => <circle key={`${x}${y}`} cx={x} cy={y} r="6" fill="#241c3d" stroke="#000" strokeWidth="2" />))}</>}
      {kind === 'bucket' && <>{ring('#fdfd94')}<g transform="translate(0 4)"><BucketShape /></g><path d="M62 80 q4 8 0 12 q-4 -4 0 -12z" fill="#ef7d96" stroke="#000" strokeWidth="2" /></>}
      {kind === 'eraser' && <>{ring('#e9eefe')}<EraserShape /><path d="M24 78 h12 M44 80 h16" stroke="#241c3d" strokeWidth="4" strokeLinecap="round" strokeDasharray="4 5" /></>}
      {kind === 'gold' && <>{ring('#fff6b0')}<rect x="24" y="24" width="52" height="52" rx="8" fill="#f6c544" stroke="#000" strokeWidth="5" /><path d="M50 32l5 11 12 1-9 8 3 12-11-7-11 7 3-12-9-8 12-1z" fill="#fffbe0" stroke="#000" strokeWidth="3" strokeLinejoin="round" /><text x="50" y="94" textAnchor="middle" fontSize="0" /></>}
      {kind === 'star' && <>{ring('#c8f0dc')}<path d="M50 16l10 22 24 2-18 16 6 24-22-13-22 13 6-24-18-16 24-2z" fill="#f6c544" stroke="#000" strokeWidth="4" strokeLinejoin="round" /></>}
      {kind === 'quake' && <>{ring('#f5a08c')}<path d="M10 56 L26 44 L36 60 L50 36 L62 62 L74 44 L90 54" stroke="#000" strokeWidth="6" fill="none" strokeLinejoin="round" strokeLinecap="round" /><path d="M30 76 l6 -8 M50 80 l0 -10 M70 76 l-6 -8 M30 24 l6 8 M70 24 l-6 8" stroke="#241c3d" strokeWidth="4" strokeLinecap="round" /></>}
      {kind === 'wobbly' && <>{ring('#c58ce8')}<path d="M18 72 Q30 50 44 70 T70 66 T86 74" stroke="#000" strokeWidth="4" fill="none" strokeDasharray="6 5" strokeLinecap="round" /><g transform="translate(14 -14) scale(0.72)"><PencilArt /></g></>}
    </svg>
  );
}

function Cover() {
  const own: Record<string, string> = { '0-0': '#f6c544', '0-1': '#f6c544', '1-0': '#5cc3a0', '1-2': '#f6c544', '0-3': '#5cc3a0' };
  return (
    <svg viewBox="0 0 100 62" preserveAspectRatio="xMidYMid slice" style={{ background: 'radial-gradient(circle at 50% 30%, #c9d2ff, #8d9df0)' }}>
      <rect x="17" y="5" width="66" height="52" rx="2" fill="#fbfcf8" stroke="#000" strokeWidth="0.9" transform="rotate(-1.2 50 31)" />
      {Object.entries(own).map(([b, f]) => { const [r, cc] = b.split('-').map(Number); return <rect key={b} x={25 + cc * 13 + 1} y={11 + r * 13 + 1} width="11" height="11" rx="1.5" fill={f} stroke="#000" strokeWidth="0.5" />; })}
      {[[0, 0, 1, 0], [1, 0, 2, 0], [0, 0, 0, 1], [1, 0, 1, 1], [2, 0, 2, 1], [0, 1, 1, 1], [1, 1, 2, 1], [0, 1, 0, 2], [1, 1, 1, 2], [3, 0, 4, 0], [3, 0, 3, 1], [4, 0, 4, 1], [3, 1, 4, 1], [2, 1, 3, 1], [2, 2, 3, 2], [2, 1, 2, 2], [3, 1, 3, 2], [1, 2, 2, 2]].map(([a, b, cc, d], i) => (
        <line key={i} x1={25 + a * 13} y1={11 + b * 13} x2={25 + cc * 13} y2={11 + d * 13} stroke="#241c3d" strokeWidth="1.6" strokeLinecap="round" />
      ))}
      {Array.from({ length: 20 }, (_, i) => <circle key={i} cx={25 + (i % 5) * 13} cy={11 + Math.floor(i / 5) * 13} r="1.6" fill="#241c3d" />)}
    </svg>
  );
}

const def: LabDef = {
  id: 'dots-boxes',
  name: 'Box Builder',
  description: 'Answer right to draw a line between two dots. Close a box to fill it and draw again. Most boxes wins.',
  ways: ['teams'],
  minTeams: 2,
  maxTeams: 4,
  how: [
    { icon: <CheckCircle weight="fill" />, text: 'Answer the question' },
    { icon: <PencilSimpleLine weight="fill" />, text: 'Right? Draw one line' },
    { icon: <SquaresFour weight="fill" />, text: 'Close a box to fill it and go again' },
  ],
  rounds: { label: 'Rounds', min: 5, max: 30, default: 15 },
  powers: POWERS,
  // A wooden classroom desk under the paper.
  background: 'radial-gradient(120% 80% at 50% 20%, rgba(255,255,255,0.25), rgba(0,0,0,0.12)), repeating-linear-gradient(90deg, #d9a46b 0 7rem, #d29d63 7rem 7.4rem, #dcaa72 7.4rem 13rem, #cf985d 13rem 13.3rem)',
  cover: <Cover />,
  pieces: [
    { id: 'background', label: 'Background', hint: 'Behind the paper' },
    { id: 'paper', label: 'Paper', hint: 'The sheet the dots sit on' },
    { id: 'dot', label: 'Dot', hint: 'One round dot' },
    { id: 'box', label: 'Filled box', hint: 'A box a team has closed (in its color)' },
    { id: 'gold-box', label: 'Golden box', hint: 'The box worth 3 points' },
    { id: 'teams', label: 'Team pictures', hint: 'The picture stamped in each box' },
    ...POWERS.map((p) => ({ id: `power-${p.id}`, label: p.name, hint: p.desc })),
  ],
  Play,
};
export default def;
