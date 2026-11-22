import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CirclesFour, HandTap, MagnifyingGlass, Timer } from '@phosphor-icons/react';
import type { MultipleChoiceQuestion } from '../../../data/types';
import type { LabCtx, LabDef, LabPower } from '../../types';
import { isPair, pairTiles, ringSpots, ringTiles, shuffle, speedBonus, type PairTile, type Tile } from './match';

// Spot the Match (Game Lab, find-the-match): a question sign floats in the
// middle of a pond and a ring of lily pads pops up around it, slowly
// drifting. Tap the pad with the matching answer before the clock runs out.
// Pairs mode mixes question signs and answer pads; tap a sign, then its pad.
// Each team plays its own short burst.

const POWERS: LabPower[] = [
  { id: 'spot', name: 'Spotlight', desc: 'A spotlight shines near the match.', enter: 'zoom', art: <Art kind="spot" /> },
  { id: 'freeze', name: 'Freeze Clock', desc: 'The clock freezes for a little while.', enter: 'drop', art: <Art kind="freeze" /> },
  { id: 'remove', name: 'Remove Two', desc: 'Two pads that do not match hop away.', enter: 'spin', art: <Art kind="remove" /> },
  { id: 'double', name: 'Double Points', desc: 'Your next three matches count two times.', enter: 'spin', art: <Art kind="double" /> },
  { id: 'star', name: 'Bonus Star', desc: 'Three bonus points!', enter: 'drop', art: <Art kind="star" /> },
  { id: 'spin', name: 'Spin Cycle', desc: 'Wheee! The pads spin into new spots.', silly: true, art: <Art kind="spin" /> },
  { id: 'jelly', name: 'Jiggle Jelly', desc: 'Wobble wobble! The pads turn to jelly.', silly: true, art: <Art kind="jelly" /> },
];

type Mode = 'ring' | 'pairs' | 'mix';
const MODES: { id: Mode; name: string }[] = [{ id: 'ring', name: 'Ring' }, { id: 'pairs', name: 'Pairs' }, { id: 'mix', name: 'Both' }];
const MODE_KEY = 'gamify:lab:spot-match:mode';
function readMode(): Mode { try { const v = localStorage.getItem(MODE_KEY); if (v === 'ring' || v === 'pairs' || v === 'mix') return v; } catch { /* storage blocked */ } return 'mix'; }
function saveMode(m: Mode) { try { localStorage.setItem(MODE_KEY, m); } catch { /* storage blocked */ } }

const RING_QS = 5, RING_TIME = 12, PAIRS = 4, PAIR_TIME = 45;
type Phase = 'ready' | 'run' | 'pause' | 'over';
const norm = (s: string) => s.trim().toLowerCase();

function Play({ ctx }: { ctx: LabCtx }) {
  const c = useRef(ctx); c.current = ctx;
  const [mode, setMode] = useState<Mode>(readMode);
  const [started, setStarted] = useState(false);
  const [phase, setPhaseS] = useState<Phase>('ready');
  const phaseRef = useRef<Phase>('ready');
  const setPhase = (p: Phase) => { phaseRef.current = p; setPhaseS(p); };
  const [kind, setKind] = useState<'ring' | 'pairs'>('ring');
  const kindRef = useRef(kind); kindRef.current = kind;
  // Ring
  const [q, setQ] = useState<MultipleChoiceQuestion | null>(null);
  const qRef = useRef(q); qRef.current = q;
  const [tiles, setTiles] = useState<Tile[]>([]);
  const tilesRef = useRef(tiles); tilesRef.current = tiles;
  const [wrong, setWrong] = useState<number[]>([]);
  const [gone, setGone] = useState<number[]>([]);
  const [lit, setLit] = useState<number[] | null>(null);
  const [found, setFound] = useState<number | null>(null);
  const [qi, setQi] = useState(0);
  const qiRef = useRef(0); qiRef.current = qi;
  const first = useRef(true);
  const [turn, setTurn] = useState(0);
  // Pairs
  const [ptiles, setPtiles] = useState<PairTile[]>([]);
  const ptRef = useRef(ptiles); ptRef.current = ptiles;
  const pq = useRef<Map<string, MultipleChoiceQuestion>>(new Map());
  const [matched, setMatched] = useState<string[]>([]);
  const matchedRef = useRef(matched); matchedRef.current = matched;
  const [sel, setSel] = useState<number | null>(null);
  const selRef = useRef(sel); selRef.current = sel;
  const tried = useRef<Set<string>>(new Set());
  const [shake, setShake] = useState<{ ids: number[]; id: number } | null>(null);
  // Clock and power-ups
  const [left, setLeft] = useState(RING_TIME);
  const leftRef = useRef(RING_TIME); leftRef.current = left;
  const total = useRef(RING_TIME);
  const frozen = useRef(0);
  const jelly = useRef(0);
  const dbl = useRef(0);
  const pending = useRef<{ spot?: boolean; remove?: boolean; spin?: boolean }>({});
  const [fx, setFx] = useState<{ kind: string; id: number } | null>(null);
  const [score, setScore] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const tall = useTall(box);
  const still = ctx.still;
  const wait = (ms: number) => new Promise((r) => window.setTimeout(r, ms));

  function pickMode(m: Mode) { setMode(m); saveMode(m); c.current.sfx.pop(); setStarted(true); }
  useEffect(() => {
    if (started || !ctx.cpu) return;
    const id = window.setTimeout(() => pickMode(mode), 1800);
    return () => window.clearTimeout(id);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  // A new turn: ring or pairs, then Go!
  useEffect(() => {
    if (!started) return;
    const x = c.current;
    const k = mode === 'mix' ? (x.round % 2 === 1 ? 'ring' : 'pairs') : mode;
    setKind(k); kindRef.current = k;
    setScore(0); setFound(null); setSel(null); setMatched([]); matchedRef.current = [];
    dbl.current = 0; frozen.current = 0; jelly.current = 0; pending.current = {};
    x.setHeld(x.player.id, []);
    if (k === 'ring') { setQi(0); qiRef.current = 0; setupRing(); } else setupPairs();
    setPhase('ready');
    setTurn((t) => t + 1);
    if (x.cpu) { const id = window.setTimeout(() => go(), 1600); return () => window.clearTimeout(id); }
  }, [ctx.taken, started]); // eslint-disable-line react-hooks/exhaustive-deps

  function go() { if (phaseRef.current !== 'ready') return; c.current.sfx.whistle(); c.current.say('Go!', 'big'); setPhase('run'); }

  function setupRing() {
    const x = c.current;
    let nq = x.draw();
    for (let k = 0; k < 4 && nq.id === qRef.current?.id; k++) nq = x.draw();
    const others: string[] = [];
    for (let k = 0; k < 3; k++) { const o = x.draw(); if (o.id !== nq.id) others.push(...o.choices); }
    const t = ringTiles(nq.choices, nq.correctIndex, others, tall ? 6 : 8);
    setQ(nq); qRef.current = nq;
    setTiles(t); tilesRef.current = t;
    setWrong([]); setFound(null); setLit(null);
    first.current = true;
    total.current = RING_TIME; setLeft(RING_TIME); leftRef.current = RING_TIME;
    const p = pending.current; pending.current = {};
    const wrongs = t.filter((v) => !v.right).map((v) => v.id);
    if (p.remove) setGone(shuffle(wrongs).slice(0, 2)); else setGone([]);
    if (p.spot) { const r = t.find((v) => v.right)!.id; setLit([r, shuffle(wrongs)[0]]); }
    if (p.spin) setFx({ kind: 'spin', id: Date.now() });
  }

  function setupPairs() {
    const x = c.current;
    const list: MultipleChoiceQuestion[] = [];
    for (let k = 0; k < 40 && list.length < PAIRS; k++) {
      const nq = x.draw(); const a = nq.choices[nq.correctIndex] ?? '';
      if (!a.trim() || list.some((o) => o.id === nq.id || o.prompt === nq.prompt || norm(o.choices[o.correctIndex] ?? '') === norm(a))) continue;
      list.push(nq);
    }
    pq.current = new Map(list.map((v) => [v.id, v]));
    const t = pairTiles(list.map((v) => ({ id: v.id, prompt: v.prompt, answer: v.choices[v.correctIndex] ?? '' })));
    setPtiles(t); ptRef.current = t;
    tried.current = new Set();
    total.current = PAIR_TIME; setLeft(PAIR_TIME); leftRef.current = PAIR_TIME;
  }

  // The clock.
  useEffect(() => {
    if (phase !== 'run') return;
    const id = window.setInterval(() => {
      if (phaseRef.current !== 'run' || Date.now() < frozen.current) return;
      const n = Math.max(0, leftRef.current - 0.1);
      leftRef.current = n; setLeft(n);
      if (n <= 3 && Math.abs(n - Math.round(n)) < 0.05 && n > 0) c.current.sfx.tick();
      if (n <= 0) timeUp();
    }, 100);
    return () => window.clearInterval(id);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  function timeUp() {
    const x = c.current;
    setPhase('pause');
    if (kindRef.current === 'ring') {
      const b = qRef.current; if (b) x.log(b, false);
      setFound(tilesRef.current.find((t) => t.right)?.id ?? null);
      x.sfx.oops(); x.say('Time!', 'oops');
      window.setTimeout(() => nextQ(), 1500);
    } else {
      for (const [id, v] of pq.current) if (!matchedRef.current.includes(id)) x.log(v, false);
      x.sfx.whistle(); endTurn();
    }
  }

  function nextQ() {
    const n = qiRef.current + 1;
    if (n >= RING_QS) { endTurn(); return; }
    setQi(n); qiRef.current = n;
    setupRing();
    setPhase('run');
  }

  function endTurn() {
    setPhase('over');
    c.current.say('Nice spotting!', 'big');
    window.setTimeout(() => c.current.next(), 2000);
  }

  function gain(n: number) {
    const times = dbl.current > 0 ? 2 : 1;
    if (dbl.current > 0) { dbl.current -= 1; if (!dbl.current) c.current.setHeld(c.current.player.id, []); }
    c.current.points(n * times); setScore((s) => s + n * times);
    return n * times;
  }

  async function earn(chance: number) {
    const x = c.current;
    setPhase('pause');
    const isRing = kindRef.current === 'ring';
    const p = await x.power(chance, (pw) => {
      if (pw.id === 'remove' && !isRing) return ptRef.current.length / 2 - matchedRef.current.length > 1;
      if (pw.id === 'spot' && !isRing) return ptRef.current.length / 2 - matchedRef.current.length > 0;
      if (isRing && ['spot', 'remove', 'spin'].includes(pw.id)) return qiRef.current < RING_QS - 1;
      return true;
    });
    if (!p) return;
    setFx({ kind: p.id, id: Date.now() });
    if (p.id === 'freeze') { frozen.current = Date.now() + 6000 + (isRing ? 700 : 0); x.sfx.freeze(); }
    if (p.id === 'double') { dbl.current = 3; x.setHeld(x.player.id, [p]); x.sfx.coin(); }
    if (p.id === 'star') { gain(3); x.sfx.chest(); x.burst(0.75, 0.15); }
    if (p.id === 'jelly') { jelly.current = Date.now() + 5000; x.sfx.boing(); }
    if (isRing) {
      if (p.id === 'spot') pending.current.spot = true;
      if (p.id === 'remove') pending.current.remove = true;
      if (p.id === 'spin') { pending.current.spin = true; x.sfx.whoosh(); }
      if (p.id === 'spot') x.sfx.magnet();
      if (p.id === 'remove') x.sfx.jump();
      return;
    }
    if (p.id === 'spot') {
      x.sfx.magnet();
      const open = [...pq.current.keys()].filter((id) => !matchedRef.current.includes(id));
      const pick = open[Math.floor(Math.random() * open.length)];
      setLit(ptRef.current.filter((t) => t.pair === pick).map((t) => t.id));
      window.setTimeout(() => setLit(null), 2600);
    }
    if (p.id === 'remove') {
      x.sfx.jump();
      const open = [...pq.current.keys()].filter((id) => !matchedRef.current.includes(id));
      const pick = open[0];
      await wait(400);
      matchPair(pick, false);
    }
    if (p.id === 'spin') { x.sfx.whoosh(); const t = shuffle(ptRef.current); setPtiles(t); ptRef.current = t; }
  }

  // Ring: tap a pad.
  async function tapRing(t: Tile) {
    const x = c.current;
    if (phaseRef.current !== 'run' || wrong.includes(t.id) || gone.includes(t.id)) return;
    if (!t.right) {
      setWrong((w) => [...w, t.id]); first.current = false;
      leftRef.current = Math.max(0.5, leftRef.current - 2); setLeft(leftRef.current);
      x.sfx.boing(); return;
    }
    setPhase('pause');
    setFound(t.id);
    const b = qRef.current!;
    x.log(b, first.current);
    const pts = gain(1 + (first.current ? speedBonus(leftRef.current, total.current) : 0));
    x.sfx.coin(); x.sfx.note(qiRef.current + 2);
    if (pts >= 3) x.say(pts >= 4 ? 'Super fast!' : 'Quick!');
    const spot = ringSpots(tilesRef.current.length)[tilesRef.current.findIndex((v) => v.id === t.id)];
    x.burst(0.08 + spot.x * 0.62, 0.15 + spot.y * 0.75);
    await wait(700);
    await earn(0.35);
    await wait(300);
    nextQ();
  }

  // Pairs: tap a sign and then its pad (or the other way around).
  function matchPair(pair: string, clean: boolean) {
    const x = c.current;
    const m = [...matchedRef.current, pair]; setMatched(m); matchedRef.current = m;
    const v = pq.current.get(pair); if (v) x.log(v, clean && !tried.current.has(pair));
    gain(2); x.sfx.coin(); x.sfx.note(m.length + 2);
    if (m.length >= pq.current.size) {
      setPhase('pause');
      const bonus = Math.ceil(leftRef.current / 8);
      if (bonus > 0) { gain(bonus); x.say(`All matched! +${bonus}`, 'big'); } else x.say('All matched!', 'big');
      x.burst(0.45, 0.4, 'big'); x.sfx.cheer();
      window.setTimeout(() => { setPhase('over'); window.setTimeout(() => c.current.next(), 1600); }, 900);
      return true;
    }
    return false;
  }
  async function tapPair(t: PairTile) {
    const x = c.current;
    if (phaseRef.current !== 'run' || matchedRef.current.includes(t.pair)) return;
    const s = selRef.current;
    if (s == null) { setSel(t.id); x.sfx.tap(); return; }
    if (s === t.id) { setSel(null); return; }
    const a = ptRef.current.find((v) => v.id === s)!;
    setSel(null);
    if (isPair(a, t)) {
      if (matchPair(t.pair, true)) return;
      await earn(0.3);
      if ((phaseRef.current as Phase) === 'pause' && matchedRef.current.length < pq.current.size) setPhase('run');
    } else {
      tried.current.add(a.pair); tried.current.add(t.pair);
      setShake({ ids: [a.id, t.id], id: Date.now() });
      x.sfx.boing();
    }
  }

  // The computer plays its own burst.
  useEffect(() => {
    if (!ctx.cpu || phase !== 'run') return;
    const id = window.setTimeout(() => {
      const x = c.current;
      if (kindRef.current === 'ring') {
        const open = tilesRef.current.filter((t) => !wrong.includes(t.id) && !gone.includes(t.id));
        const right = open.find((t) => t.right);
        const pick = x.cpuRight() || !right ? right : open.filter((t) => !t.right)[Math.floor(Math.random() * Math.max(1, open.length - 1))];
        if (pick) void tapRing(pick);
      } else {
        const open = ptRef.current.filter((t) => !matchedRef.current.includes(t.pair));
        if (selRef.current == null) { const t = open[Math.floor(Math.random() * open.length)]; if (t) void tapPair(t); return; }
        const s = ptRef.current.find((v) => v.id === selRef.current)!;
        const mate = open.find((v) => isPair(v, s));
        const pick = x.cpuRight() && mate ? mate : open.filter((v) => v.id !== s.id)[Math.floor(Math.random() * Math.max(1, open.length - 1))];
        if (pick) void tapPair(pick);
      }
    }, 1300 + Math.random() * 1400);
    return () => window.clearTimeout(id);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const on = (e: KeyboardEvent) => { if (!c.current.cpu && (e.key === ' ' || e.key === 'Enter') && phaseRef.current === 'ready' && started) { e.preventDefault(); go(); } };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const isJelly = Date.now() < jelly.current && !still;
  const isFrozen = Date.now() < frozen.current;
  const canTap = phase === 'run' && !ctx.cpu;
  const prompt = q?.prompt ?? '';
  const spots = ringSpots(tiles.length, 0.4, 0.38, fx?.kind === 'spin' ? 0.6 : 0);
  const pad = tall ? 22 : 19;
  const cols = tall ? 2 : 4;

  return (
    <div ref={box} className="absolute inset-0 grid place-items-center">
      <div className="relative lab-fit rounded-[calc(var(--u)*4)] border-heavy border-border overflow-hidden" style={{ '--ar': tall ? 0.85 : 1.5, '--u': tall ? '0.75cqw' : '1cqh', containerType: 'size', boxShadow: '0 calc(var(--u)*1) 0 #000, 0 calc(var(--u)*3) calc(var(--u)*6) rgba(36,28,61,0.35)' } as CSSProperties}>
        <Pond still={still} />

        {/* The top strip: the clock and progress. */}
        <div className="absolute top-[calc(var(--u)*2)] inset-x-[calc(var(--u)*3)] h-[calc(var(--u)*8)] flex items-center gap-[calc(var(--u)*2)] z-10">
          <span className="relative w-[calc(var(--u)*8)] h-[calc(var(--u)*8)] rounded-full border-std border-border grid place-items-center shrink-0" style={{ background: isFrozen ? '#c9ecff' : '#fbfcf8' }} aria-hidden="true">
            <Timer weight="fill" className="w-[60%] h-[60%]" />
            {isFrozen && !still && <motion.span className="absolute inset-0 rounded-full border-[calc(var(--u)*0.6)] border-[#6aa9e9]" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1, repeat: Infinity }} />}
          </span>
          <div className="relative flex-1 h-[calc(var(--u)*4)] rounded-full border-std border-border bg-surface overflow-hidden" role="timer" aria-label={`${Math.ceil(left)} seconds left`}>
            <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${(left / total.current) * 100}%`, background: isFrozen ? '#7fd6e3' : left / total.current < 0.25 ? '#e5635f' : left / total.current < 0.5 ? '#f6c544' : '#8fe3a0', transition: 'width 0.1s linear' }} />
          </div>
          <span className="shrink-0 flex gap-[calc(var(--u)*1)]" aria-label={kind === 'ring' ? `Question ${qi + 1} of ${RING_QS}` : `${matched.length} of ${ptiles.length / 2} pairs`}>
            {Array.from({ length: kind === 'ring' ? RING_QS : ptiles.length / 2 }, (_, i) => {
              const done = kind === 'ring' ? i < qi : i < matched.length;
              const now = kind === 'ring' && i === qi;
              return <motion.span key={i} className="w-[calc(var(--u)*4)] h-[calc(var(--u)*4)] rounded-full border-std border-border" style={{ background: done ? '#8fe3a0' : now ? '#fdfd94' : '#fbfcf8' }} animate={now && !still ? { scale: [1, 1.2, 1] } : { scale: 1 }} transition={{ duration: 1, repeat: now ? Infinity : 0 }} />;
            })}
          </span>
          {score > 0 && <motion.span key={score} className="shrink-0 font-display text-[calc(var(--u)*5)] px-[calc(var(--u)*2)] rounded-full border-std border-border bg-accent" initial={still ? false : { scale: 1.6 }} animate={{ scale: 1 }}>+{score}</motion.span>}
        </div>

        {/* Ring mode: the question in the middle, pads around it. */}
        {kind === 'ring' && started && (
          <div className="absolute inset-x-0 bottom-0 top-[calc(var(--u)*10)]">
            <motion.div key={`q${turn}-${qi}`} className="absolute left-1/2 top-1/2 w-[34%] rounded-[calc(var(--u)*3)] border-bold border-border bg-surface px-[calc(var(--u)*2.5)] py-[calc(var(--u)*2.5)] text-center z-[1]"
              style={{ x: '-50%', y: '-50%', boxShadow: '0 calc(var(--u)*0.9) 0 #000, 0 calc(var(--u)*2) calc(var(--u)*4) rgba(0,0,0,0.2)' }}
              initial={still ? false : { scale: 0.3, rotate: -10, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 14 }}>
              <span className="absolute -top-[calc(var(--u)*3.5)] left-1/2 -translate-x-1/2 w-[calc(var(--u)*7)] h-[calc(var(--u)*7)] rounded-full border-std border-border bg-accent grid place-items-center" aria-hidden="true"><MagnifyingGlass weight="bold" className="w-[55%] h-[55%]" /></span>
              <p className="m-0 font-bold leading-snug text-balance" style={{ fontSize: `calc(var(--u)*${prompt.length > 80 ? 3 : prompt.length > 40 ? 3.8 : 4.8})` }}>{prompt}</p>
            </motion.div>
            <motion.div className="absolute inset-0" animate={still || phase !== 'run' ? undefined : { rotate: fx?.kind === 'spin' ? [0, 720] : [0, 6, 0, -6, 0] }} transition={fx?.kind === 'spin' ? { duration: 1.2 } : { duration: 14, repeat: Infinity, ease: 'easeInOut' }}>
              {tiles.map((t, i) => {
                const s = spots[i];
                const isWrong = wrong.includes(t.id), isGone = gone.includes(t.id), isFound = found === t.id;
                const dim = lit && !lit.includes(t.id);
                return (
                  <AnimatePresence key={`${turn}-${qi}-${t.id}`}>
                    {!isGone && (
                      <motion.button type="button" disabled={!canTap || isWrong || found != null} onClick={() => void tapRing(t)}
                        className="absolute rounded-full grid place-items-center disabled:cursor-default"
                        style={{ left: `${s.x * 100}%`, top: `${s.y * 100}%`, width: `calc(var(--u)*${pad})`, height: `calc(var(--u)*${pad})`, x: '-50%', y: '-50%' }}
                        initial={still ? false : { scale: 0, rotate: -200 }}
                        animate={isFound ? { scale: [1, 1.35, 1.2], rotate: 0 } : isWrong && !still ? { scale: 0.85, rotate: [0, -14, 14, -8, 0], opacity: 0.55 } : isJelly ? { scaleX: [1, 1.15, 0.9, 1.1, 1], scaleY: [1, 0.85, 1.1, 0.9, 1], rotate: 0 } : { scale: 1, rotate: 0, opacity: dim ? 0.35 : 1 }}
                        exit={still ? { opacity: 0 } : { scale: 0, y: '-150%', opacity: 0, rotate: 90 }}
                        transition={isJelly ? { duration: 0.7, repeat: 6 } : { type: 'spring', stiffness: 260, damping: 13, delay: isFound || isWrong ? 0 : i * 0.06 }}
                        whileHover={canTap && !isWrong && !still ? { scale: 1.08 } : undefined} whileTap={canTap ? { scale: 0.94 } : undefined}
                        aria-label={`Pad: ${t.text}`}>
                        <LilyPad good={isFound} lit={!!lit?.includes(t.id) && !dim} turn={t.id * 53 + qi * 31} />
                        <span className="relative font-bold leading-tight text-balance px-[18%] text-[#13301f]" style={{ fontSize: `calc(var(--u)*${t.text.length > 18 ? 2.4 : t.text.length > 9 ? 3 : 5})` }}>{t.text}</span>
                      </motion.button>
                    )}
                  </AnimatePresence>
                );
              })}
            </motion.div>
          </div>
        )}

        {/* Pairs mode: signs and pads mixed up on the pond. */}
        {kind === 'pairs' && started && (
          <div className="absolute inset-x-[calc(var(--u)*3)] bottom-[calc(var(--u)*3)] top-[calc(var(--u)*12)] grid gap-[calc(var(--u)*2.2)]" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {ptiles.map((t, i) => {
              const done = matched.includes(t.pair);
              const picked = sel === t.id;
              const glow = lit?.includes(t.id);
              const shaking = shake?.ids.includes(t.id) && !still;
              return (
                <motion.button key={`${turn}-${t.pair}-${t.kind}`} layout={!still} type="button" disabled={!canTap || done} onClick={() => void tapPair(t)}
                  className={`relative grid place-items-center min-h-0 disabled:cursor-default ${t.kind === 'q' ? 'rounded-[calc(var(--u)*2.5)] border-bold border-border' : 'rounded-full aspect-square h-full max-w-full justify-self-center self-center'}`}
                  style={t.kind === 'q' ? { background: '#fbfcf8', boxShadow: picked || glow ? '0 0 0 calc(var(--u)*0.9) #fdfd94, 0 calc(var(--u)*0.8) 0 #000' : '0 calc(var(--u)*0.8) 0 #000' } : undefined}
                  initial={still ? false : { scale: 0, rotate: -120 }}
                  animate={done ? { scale: 0, opacity: 0, rotate: 180, y: -30 } : shaking ? { x: [0, -10, 10, -6, 0], scale: 1, rotate: 0 } : isJelly ? { scaleX: [1, 1.12, 0.92, 1.08, 1], scaleY: [1, 0.88, 1.08, 0.92, 1] } : { scale: picked ? 1.08 : 1, rotate: 0, opacity: 1 }}
                  transition={isJelly && !done ? { duration: 0.7, repeat: 6 } : { type: 'spring', stiffness: 240, damping: 14, delay: done || shaking ? 0 : i * 0.05 }}
                  whileHover={canTap && !done && !still ? { scale: 1.05 } : undefined}
                  aria-label={`${t.kind === 'q' ? 'Question' : 'Answer'}: ${t.text}`} aria-pressed={picked}>
                  {t.kind === 'a' && <LilyPad good={picked} lit={!!glow} turn={t.id * 67} />}
                  <span className={`relative font-bold leading-tight text-balance ${t.kind === 'a' ? 'px-[18%] text-[#13301f]' : 'px-[calc(var(--u)*2)]'}`}
                    style={{ fontSize: `calc(var(--u)*${t.text.length > 60 ? 2.6 : t.text.length > 24 ? 3.4 : t.kind === 'a' && t.text.length < 8 ? 6 : 4.6})` }}>{t.text}</span>
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Power-up moments. */}
        <AnimatePresence>
          {fx && !still && ['star', 'freeze', 'spot', 'remove'].includes(fx.kind) && (
            <motion.span key={fx.id} className="absolute left-[40%] top-[30%] w-[20%] [&>svg]:w-full pointer-events-none z-20"
              initial={{ scale: 0, rotate: -90, opacity: 0 }} animate={fx.kind === 'star' ? { scale: [0, 1.2, 0.6], rotate: 0, x: ['0%', '0%', '180%'], y: ['0%', '0%', '-160%'], opacity: [0, 1, 0] } : { scale: [0, 1.2, 1], rotate: 0, opacity: [0, 1, 0] }}
              transition={{ duration: 1.4 }} onAnimationComplete={() => setFx((f) => (f?.kind === 'spin' ? f : null))}>
              <Art kind={fx.kind} />
            </motion.span>
          )}
        </AnimatePresence>

        {/* Before the first turn: pick how to play. Then Go! each turn. */}
        <AnimatePresence>
          {!started && (
            <motion.div key="mode" className="absolute inset-[calc(var(--u)*4)] z-30 rounded-[calc(var(--u)*3)] border-heavy border-border bg-[#fbfcf8]/95 grid grid-rows-[auto_1fr] gap-[calc(var(--u)*3)] p-[calc(var(--u)*4)]" style={{ boxShadow: '0 calc(var(--u)*1) 0 #000' }}
              initial={still ? false : { y: '-6%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={still ? { opacity: 0 } : { y: '-120%' }} transition={{ type: 'spring', stiffness: 140, damping: 16 }}>
              <h2 className="m-0 text-center font-heading font-bold text-[calc(var(--u)*5.5)]">How do you want to play?</h2>
              <div className={`grid gap-[calc(var(--u)*3)] min-h-0 ${tall ? 'grid-rows-3' : 'grid-cols-3'}`}>
                {MODES.map((m, i) => (
                  <motion.button key={m.id} type="button" onClick={() => pickMode(m.id)} disabled={ctx.cpu}
                    className={`grid grid-rows-[1fr_auto] rounded-[calc(var(--u)*2.5)] border-bold border-border overflow-hidden bg-white min-h-0 ${mode === m.id ? 'ring-[calc(var(--u)*0.8)] ring-[#fdfd94]' : ''}`}
                    style={{ boxShadow: '0 calc(var(--u)*0.8) 0 #000' }} initial={still ? false : { y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 + i * 0.08 }}
                    whileHover={still ? undefined : { scale: 1.04, y: -4 }} whileTap={{ scale: 0.97 }}>
                    <ModePic id={m.id} />
                    <span className="font-bold text-[calc(var(--u)*4.4)] py-[calc(var(--u)*1.4)] border-t-2 border-border bg-surface">{m.name}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
          {started && phase === 'ready' && (
            <motion.div key={`go${turn}`} className="absolute inset-0 z-30 grid place-items-center bg-[#241c3d]/25" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="grid justify-items-center gap-[calc(var(--u)*3)]">
                <span className="inline-flex items-center gap-[calc(var(--u)*1.5)] font-bold text-[calc(var(--u)*4.2)] rounded-full bg-surface border-std border-border px-[calc(var(--u)*3)] py-[calc(var(--u)*1)]" style={{ boxShadow: '0 calc(var(--u)*0.6) 0 #000' }}>
                  {kind === 'ring' ? <><MagnifyingGlass weight="bold" className="w-[calc(var(--u)*5)] h-[calc(var(--u)*5)]" aria-hidden="true" />Find the match</> : <><CirclesFour weight="fill" className="w-[calc(var(--u)*5)] h-[calc(var(--u)*5)]" aria-hidden="true" />Match the pairs</>}
                </span>
                <motion.button type="button" onClick={go} disabled={ctx.cpu} className="min-w-[calc(var(--u)*34)] min-h-[calc(var(--u)*16)] rounded-full border-heavy border-border bg-accent font-display text-[calc(var(--u)*9)] disabled:cursor-default"
                  style={{ boxShadow: '0 calc(var(--u)*1) 0 #000' }} animate={still ? undefined : { scale: [1, 1.07, 1] }} transition={{ duration: 1, repeat: Infinity }} whileHover={still ? undefined : { scale: 1.1 }} whileTap={{ scale: 0.94 }}>
                  Go!
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function LilyPad({ good, lit, turn = 0 }: { good: boolean; lit: boolean; turn?: number }) {
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" aria-hidden="true">
      {lit && <circle cx="50" cy="50" r="49" fill="#fdfd94" opacity="0.8" />}
      <ellipse cx="50" cy="56" rx="45" ry="40" fill="#000" opacity="0.15" />
      <g transform={`rotate(${turn % 360} 50 50)`}>
        <path d="M50 50L62 7A44 44 0 1 1 38 7z" fill={good ? '#9fe7a0' : '#8fd6a0'} stroke="#000" strokeWidth="3.5" strokeLinejoin="round" />
        <path d="M50 50L50 90M50 50L22 72M50 50L78 72M50 50L14 42M50 50L86 42" stroke="#5cae86" strokeWidth="2.5" strokeLinecap="round" />
      </g>
      <circle cx="50" cy="52" r="30" fill="#e8f8ec" opacity="0.92" />
    </svg>
  );
}

// The pond: water, ripples, reeds, a frog and fish drifting by.
function Pond({ still }: { still: boolean }) {
  return (
    <svg viewBox="0 0 300 200" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full" aria-hidden="true">
      <defs><radialGradient id="sm-water" cx="0.5" cy="0.45" r="0.75"><stop offset="0" stopColor="#9fe0ee" /><stop offset="1" stopColor="#5fb6d8" /></radialGradient></defs>
      <rect x="-100" y="-100" width="500" height="400" fill="url(#sm-water)" />
      {!still && [[60, 60], [240, 140], [150, 170], [40, 160]].map(([x, y], i) => (
        <motion.ellipse key={i} cx={x} cy={y} rx="10" ry="4" fill="none" stroke="#fff" strokeWidth="1.2" animate={{ scale: [0.4, 2.2], opacity: [0.8, 0] }} transition={{ duration: 3, repeat: Infinity, delay: i * 0.8 }} style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
      ))}
      {!still && [0, 1].map((i) => (
        <motion.path key={`f${i}`} d="M0 0q10-6 20 0q-10 6-20 0zM20 0l7-5v10z" fill="#3f8fb5" opacity="0.5" initial={{ x: i ? 340 : -40, y: i ? 120 : 70 }} animate={{ x: i ? -40 : 340 }} transition={{ duration: 16 + i * 5, repeat: Infinity, ease: 'linear', delay: i * 3 }} style={{ scaleX: i ? -1 : 1 }} />
      ))}
      {/* Reeds and a little frog at the edges. */}
      {[[-6, 200], [8, 200], [292, 200], [306, 200]].map(([x, y], i) => <path key={i} d={`M${x} ${y}q${i % 2 ? 4 : -4}-30 0-60`} stroke="#3c8f5c" strokeWidth="4" fill="none" strokeLinecap="round" />)}
      {[[2, 138], [298, 136]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="3" ry="9" fill="#8a5a3b" stroke="#000" strokeWidth="1" />)}
      <g transform="translate(284 192) scale(0.7)">
        <ellipse cx="0" cy="6" rx="26" ry="10" fill="#8fd6a0" stroke="#000" strokeWidth="1.5" />
        <ellipse cx="0" cy="0" rx="11" ry="8" fill="#5cc3a0" stroke="#000" strokeWidth="1.5" />
        <circle cx="-5" cy="-7" r="3.5" fill="#fff" stroke="#000" strokeWidth="1.2" /><circle cx="5" cy="-7" r="3.5" fill="#fff" stroke="#000" strokeWidth="1.2" />
        <circle cx="-5" cy="-7" r="1.4" /><circle cx="5" cy="-7" r="1.4" />
        <path d="M-5 1q5 3 10 0" stroke="#000" strokeWidth="1.2" fill="none" />
      </g>
    </svg>
  );
}

function ModePic({ id }: { id: Mode }) {
  return (
    <svg viewBox="0 0 120 80" preserveAspectRatio="xMidYMid meet" className="w-full h-full min-h-0" style={{ background: 'radial-gradient(circle, #9fe0ee, #5fb6d8)' }} aria-hidden="true">
      {(id === 'ring' || id === 'mix') && <g transform={id === 'mix' ? 'translate(-26 0) scale(0.9)' : undefined}>
        <rect x="46" y="32" width="28" height="16" rx="3" fill="#fbfcf8" stroke="#000" strokeWidth="1.6" />
        {Array.from({ length: 6 }, (_, i) => { const a = -Math.PI / 2 + (i / 6) * Math.PI * 2; return <circle key={i} cx={60 + Math.cos(a) * 30} cy={40 + Math.sin(a) * 28} r="8" fill="#8fd6a0" stroke="#000" strokeWidth="1.6" />; })}
      </g>}
      {(id === 'pairs' || id === 'mix') && <g transform={id === 'mix' ? 'translate(52 10) scale(0.6)' : 'translate(10 6)'}>
        {[0, 1, 2, 3, 4, 5].map((i) => (i % 2 ? <circle key={i} cx={16 + (i % 3) * 34} cy={18 + Math.floor(i / 3) * 34} r="12" fill="#8fd6a0" stroke="#000" strokeWidth="1.8" /> : <rect key={i} x={4 + (i % 3) * 34} y={8 + Math.floor(i / 3) * 34} width="24" height="20" rx="3" fill="#fbfcf8" stroke="#000" strokeWidth="1.8" />))}
      </g>}
    </svg>
  );
}

function useTall(ref: RefObject<HTMLDivElement | null>) {
  const [tall, setTall] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setTall(e.contentRect.height / Math.max(1, e.contentRect.width) > 0.95));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return tall;
}

function Art({ kind }: { kind: string }) {
  const ring = (fill: string) => <circle cx="50" cy="50" r="44" fill={fill} stroke="#000" strokeWidth="5" />;
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      {kind === 'spot' && <>{ring('#241c3d')}<path d="M40 16h20l14 60H26z" fill="#fdfd94" opacity="0.85" /><rect x="38" y="12" width="24" height="10" rx="3" fill="#7383ad" stroke="#000" strokeWidth="3.5" /><ellipse cx="50" cy="76" rx="24" ry="7" fill="#fdfd94" stroke="#000" strokeWidth="3" /></>}
      {kind === 'freeze' && <>{ring('#c9ecff')}<circle cx="50" cy="52" r="26" fill="#fbfcf8" stroke="#000" strokeWidth="4.5" /><path d="M50 52V36M50 52l10 6" stroke="#000" strokeWidth="5" strokeLinecap="round" /><path d="M22 22l10 10M78 22l-10 10M50 14v8" stroke="#6aa9e9" strokeWidth="5" strokeLinecap="round" /></>}
      {kind === 'remove' && <>{ring('#c8f0dc')}<circle cx="36" cy="56" r="14" fill="#8fd6a0" stroke="#000" strokeWidth="4" /><circle cx="64" cy="56" r="14" fill="#8fd6a0" stroke="#000" strokeWidth="4" /><path d="M28 30l-6-8M72 30l6-8M50 26v-10" stroke="#000" strokeWidth="4" strokeLinecap="round" /><path d="M30 50l12 12M42 50L30 62M58 50l12 12M70 50L58 62" stroke="#e5635f" strokeWidth="4.5" strokeLinecap="round" /></>}
      {kind === 'double' && <>{ring('#fff6b0')}<text x="50" y="64" textAnchor="middle" fontSize="38" fontWeight="900" fontFamily="sans-serif" stroke="#000" strokeWidth="2" fill="#f6c544">x2</text></>}
      {kind === 'star' && <>{ring('#fff6b0')}<path d="M50 16l10 21 23 3-17 16 4 23-20-11-20 11 4-23-17-16 23-3z" fill="#f6c544" stroke="#000" strokeWidth="4" strokeLinejoin="round" /><text x="50" y="62" textAnchor="middle" fontSize="18" fontWeight="900" fontFamily="sans-serif">+3</text></>}
      {kind === 'spin' && <>{ring('#f5a08c')}<path d="M28 50a22 22 0 0 1 38-15M72 50a22 22 0 0 1-38 15" stroke="#000" strokeWidth="6" fill="none" strokeLinecap="round" /><path d="M62 24l6 12-13 1zM38 76l-6-12 13-1z" fill="#000" /></>}
      {kind === 'jelly' && <>{ring('#e9eefe')}<path d="M24 70q0-40 26-40t26 40q-6 6-13 0-6 6-13 0-6 6-13 0-6 6-13 0z" fill="#ef7d96" stroke="#000" strokeWidth="4" strokeLinejoin="round" /><circle cx="42" cy="52" r="3.4" /><circle cx="58" cy="52" r="3.4" /><path d="M44 60q6 4 12 0" stroke="#000" strokeWidth="3" fill="none" /></>}
    </svg>
  );
}

function Cover() {
  return (
    <svg viewBox="0 0 300 186" preserveAspectRatio="xMidYMid slice" style={{ background: 'radial-gradient(circle at 50% 45%, #9fe0ee, #5fb6d8)' }}>
      <rect x="110" y="72" width="80" height="40" rx="8" fill="#fbfcf8" stroke="#000" strokeWidth="2.5" />
      <rect x="126" y="86" width="48" height="8" rx="4" fill="#cdd7fb" />
      {Array.from({ length: 8 }, (_, i) => { const a = -Math.PI / 2 + (i / 8) * Math.PI * 2; const x = 150 + Math.cos(a) * 110, y = 92 + Math.sin(a) * 70; return <g key={i}><circle cx={x} cy={y} r="19" fill={i === 2 ? '#9fe7a0' : '#8fd6a0'} stroke="#000" strokeWidth="2" /><circle cx={x} cy={y + 1} r="12" fill="#e8f8ec" />{i === 2 && <circle cx={x} cy={y} r="23" fill="none" stroke="#fdfd94" strokeWidth="4" />}</g>; })}
    </svg>
  );
}

const def: LabDef = {
  id: 'spot-match',
  name: 'Spot the Match',
  description: 'A question floats in the middle of the pond. Spot the lily pad with its answer before the clock runs out!',
  ways: ['teams', 'solo'],
  how: [
    { icon: <MagnifyingGlass weight="bold" />, text: 'Read the question in the middle' },
    { icon: <HandTap weight="fill" />, text: 'Tap the pad that matches' },
    { icon: <Timer weight="fill" />, text: 'Beat the clock for bonus points' },
  ],
  rounds: { label: 'Rounds', min: 1, max: 10, default: 4 },
  powers: POWERS,
  background: 'radial-gradient(120% 90% at 50% 0%, #dbe6ff 0%, #b4c4fb 55%, #93a5ee 100%)',
  cover: <Cover />,
  pieces: [
    { id: 'background', label: 'Background', hint: 'Behind the pond' },
    { id: 'pond', label: 'Pond', hint: 'The water, reeds and frog' },
    { id: 'sign', label: 'Question sign', hint: 'The card in the middle and the question tiles in Pairs' },
    { id: 'pad', label: 'Lily pad', hint: 'One answer pad' },
    ...POWERS.map((p) => ({ id: `power-${p.id}`, label: p.name, hint: p.desc })),
  ],
  Play,
};
export default def;
