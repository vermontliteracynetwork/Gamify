import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as RPointerEvent, type KeyboardEvent as RKeyboardEvent, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle, HandTap, MagnifyingGlass, Trophy } from '@phosphor-icons/react';
import { playClip } from '../../../engine/music';
import { TurnCard } from '../../../engine/ShareQuestion';
import { TEAM_COLORS } from '../../../engine/turns';
import type { MultipleChoiceQuestion } from '../../../data/types';
import type { LabCtx, LabDef, LabPower } from '../../types';
import { cellsOf, keyOf, lineCells, makeSearch, matchAt, reroll, sizeFor, type Cell, type Placed, type Search } from './grid';

// Word Search (Game Lab, inspired by the classic paper puzzle): the words of
// the picked set hide in a letter grid on a clipboard, the word list sits
// beside it. Tap the first and last letter (or drag) to circle a word; it
// lifts out with sparkles and its clue shows. Solo races a timer bar; teams
// take turns finding one word each, the computer finds its own.

const A = '/lab/word-search';
const img = (f: string) => <img src={`${A}/${f}.webp`} alt="" className="w-full h-full object-contain" draggable={false} />;

const POWERS: LabPower[] = [
  { id: 'magnify', name: 'Magnifying Glass', desc: 'A glass glides over the grid and shows the first letter of a word.', enter: 'zoom', art: <Art kind="magnify" /> },
  { id: 'flash', name: 'Flashlight', desc: 'The lights go down and a beam lights the row a word starts in.', enter: 'spin', art: <Art kind="flash" /> },
  { id: 'freeze', name: 'Time Freeze', desc: 'The timer freezes solid for ten seconds.', enter: 'drop', art: img('ice') },
  { id: 'double', name: 'Double Points', desc: 'Your next word is worth double.', enter: 'spin', art: img('lightning') },
  { id: 'magnet', name: 'Word Magnet', desc: 'A magnet pulls a whole word out of the grid for you.', enter: 'zoom', art: img('magnet') },
  { id: 'rain', name: 'Letter Rain', desc: 'Whoops! Letters rain down and the grid shakes. The hidden words hold on tight.', silly: true, art: <Art kind="rain" /> },
  { id: 'jelly', name: 'Jelly Letters', desc: 'Wibble wobble! Every letter turns to jelly for the next turn.', silly: true, art: <Art kind="jelly" /> },
];

// Every word is worth the same (effort pays, not word length).
const WORD_POINTS = 3;
const MARKERS = ['#fdfd94', '#8fe3a0', '#f5a08c', '#b4c4fb', '#ef7d96', '#9fe0f0', '#f6c544', '#d9b8f5'];
// The on-board timer choice, remembered per device (default Relaxed).
type Pace = 'relaxed' | 'none' | 'quick';
const PACES: Pace[] = ['relaxed', 'none', 'quick'];
const PACE_LABEL: Record<Pace, string> = { relaxed: 'Relaxed', none: 'No timer', quick: 'Quick' };
const PACE_KEY = 'gamify:lab:word-search:timer';
// Starts from the teacher's Timers setting (ctx.timeScale: 0 off, 1 normal, 1.5 relaxed).
const paceFrom = (scale: number): Pace => (scale === 0 ? 'none' : scale === 1 ? 'quick' : 'relaxed');
function loadPace(scale: number): Pace { try { const v = localStorage.getItem(PACE_KEY) as Pace | null; return v && PACES.includes(v) ? v : paceFrom(scale); } catch { return paceFrom(scale); } }
function savePace(v: Pace) { try { localStorage.setItem(PACE_KEY, v); } catch { /* private window */ } }
function turnMs(pace: Pace, solo: boolean, words: number) {
  if (pace === 'none') return Infinity;
  if (solo) return pace === 'quick' ? Math.min(150_000, Math.max(60_000, words * 18_000)) : Math.max(180_000, words * 40_000);
  return pace === 'quick' ? 60_000 : 120_000;
}
const asQuestion = (p: Placed): MultipleChoiceQuestion => ({ id: `ws-${p.word}`, kind: 'mc', prompt: p.clue, choices: [p.word], correctIndex: 0 });
const same = (a: Cell | null, b: Cell | null) => !!a && !!b && a[0] === b[0] && a[1] === b[1];

type Mode = 'turn' | 'play' | 'busy';
interface Lift { id: number; p: Placed; color: string }

function useWide(at = 1.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [wide, setWide] = useState(true);
  useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setWide(e.contentRect.width / Math.max(1, e.contentRect.height) > at));
    ro.observe(el); return () => ro.disconnect();
  }, [at]);
  return [ref, wide] as const;
}

function Play({ ctx }: { ctx: LabCtx }) {
  const c = useRef(ctx); c.current = ctx;
  const clip = (f: string, level = 0.7) => playClip(`${A}/${f}.mp3`, c.current.settings, level);
  const [box, wide] = useWide();
  // The grid never gets so many cells that one is under 44px.
  const cap = () => {
    const r = box.current?.getBoundingClientRect();
    const bw = r?.width || window.innerWidth * 0.7, bh = r?.height || window.innerHeight - 120;
    const side = (bw / Math.max(1, bh) > 1.15 ? Math.min(bh, bw / 1.75) : Math.min(bw, bh * 0.56)) * 0.86;
    return Math.max(6, Math.min(11, Math.floor(side / 44)));
  };
  const fresh = () => { const w = c.current.words({ min: 3, max: 10 }); const n = Math.min(cap(), sizeFor(w.slice(0, 9))); return makeSearch(w.filter((x) => x.word.length <= n), n); };
  const [search, setSearch] = useState<Search>(fresh);
  const sRef = useRef(search); sRef.current = search;
  const [found, setFound] = useState<Record<string, string>>({}); // word -> player id
  const foundRef = useRef(found); foundRef.current = found;
  const [mode, setMode] = useState<Mode>('busy');
  const modeRef = useRef(mode); modeRef.current = mode;
  const [start, setStart] = useState<Cell | null>(null);
  const [end, setEnd] = useState<Cell | null>(null);
  const dragging = useRef(false);
  const [cursor, setCursor] = useState<Cell>([0, 0]);
  const [miss, setMiss] = useState<{ id: number; a: Cell; b: Cell } | null>(null);
  const [lift, setLift] = useState<Lift | null>(null);
  const [lastClue, setLastClue] = useState<Placed | null>(null);
  const [shake, setShake] = useState(0);
  const [drops, setDrops] = useState<{ id: number; l: string; x: number; d: number; r: number }[]>([]);
  // This turn's switched-on helpers.
  const [glass, setGlass] = useState<Cell | null>(null);
  const [beam, setBeam] = useState<number | null>(null);
  const [double, setDoubleState] = useState(false);
  const doubleRef = useRef(false);
  const setDouble = (v: boolean) => { doubleRef.current = v; setDoubleState(v); };
  const [jelly, setJelly] = useState(false);
  const [cluesOnly, setCluesOnly] = useState(false);
  const [pace, setPaceState] = useState<Pace>(() => loadPace(ctx.timeScale));
  const paceRef = useRef(pace); paceRef.current = pace;
  const [shown, setShown] = useState<Placed | null>(null);
  const [magnet, setMagnet] = useState<Placed | null>(null);
  const [revealAll, setRevealAll] = useState(false);
  // The timer bar: solo races the whole puzzle, teams get a turn each.
  const [left, setLeft] = useState(1);
  const total = useRef(1);
  const remain = useRef(1);
  const frozenUntil = useRef(0);
  const [frozen, setFrozen] = useState(false);
  const paused = useRef(false);
  const pending = useRef<Record<string, LabPower[]>>({});
  const [cpuHunt, setCpuHunt] = useState<Cell | null>(null);
  const me = ctx.player;
  const color = (id: string) => TEAM_COLORS[(ctx.turns.players.find((p) => p.id === id)?.colorIndex ?? 0) % TEAM_COLORS.length];
  // Solo circles every word in a new marker color; teams circle in their own.
  const markOf = (word: string) => (ctx.solo ? MARKERS[Math.max(0, search.placed.findIndex((p) => p.word === word)) % MARKERS.length] : color(found[word]));
  const unfound = (s = sRef.current, f = foundRef.current) => s.placed.filter((p) => !f[p.word]);

  // A new turn (teams) or a new puzzle (solo).
  useEffect(() => {
    const x = c.current;
    setStart(null); setEnd(null); setGlass(null); setBeam(null); setDouble(false); setMagnet(null); setRevealAll(false); setCpuHunt(null);
    setJelly(false); setShown(null);
    if (x.solo || unfound().length === 0) {
      if (x.taken > 0 || unfound().length === 0) { const s = fresh(); sRef.current = s; setSearch(s); foundRef.current = {}; setFound({}); setLastClue(null); }
    }
    if (x.solo) {
      total.current = turnMs(paceRef.current, true, sRef.current.placed.length);
      remain.current = total.current; setLeft(1);
      if (x.taken > 0) { clip('swipe'); x.say('New puzzle!'); }
      setMode('play');
    } else setMode('turn');
  }, [ctx.taken]); // eslint-disable-line react-hooks/exhaustive-deps

  async function beginTurn() {
    const x = c.current;
    total.current = turnMs(paceRef.current, false, 0); remain.current = total.current; setLeft(1);
    const list = pending.current[x.player.id] ?? [];
    pending.current[x.player.id] = [];
    x.setHeld(x.player.id, []);
    setMode('play');
    for (const p of list) { fire(p); await wait(1500); }
  }

  // Switch a power-up on, with its own animation and sound.
  function fire(p: LabPower) {
    const x = c.current, open = unfound();
    if (!p.silly) x.say(`${p.name} is on!`);
    if (p.id === 'magnify' && open.length) { const t = open[Math.floor(Math.random() * open.length)]; setGlass([t.r, t.c]); x.sfx.slideUp(); }
    if (p.id === 'flash' && open.length) { const t = open[Math.floor(Math.random() * open.length)]; setBeam(t.r); x.sfx.zap(); }
    if (p.id === 'freeze') { frozenUntil.current = Date.now() + 10_000; setFrozen(true); x.sfx.freeze(); }
    if (p.id === 'double') { setDouble(true); x.sfx.coin(); }
    if (p.id === 'magnet' && open.length) {
      const t = open[Math.floor(Math.random() * open.length)];
      setMagnet(t); x.sfx.magnet();
      window.setTimeout(() => { setMagnet(null); if (!foundRef.current[t.word]) win(t, true); }, 1600);
    }
    if (p.id === 'rain') {
      x.sfx.wind(); x.say('Letter Rain!', 'oops'); setShake((n) => n + 1);
      setStart(null); setEnd(null); dragging.current = false;
      paused.current = true; window.setTimeout(() => { paused.current = false; }, 2300);
      setDrops(Array.from({ length: 16 }, (_, i) => ({ id: Date.now() + i, l: 'ABCDEFGHIJKLMNOPRSTUW'[Math.floor(Math.random() * 21)], x: 4 + Math.random() * 92, d: Math.random() * 0.7, r: Math.random() * 300 - 150 })));
      window.setTimeout(() => { setSearch((s) => { const n = reroll(s); sRef.current = n; return n; }); x.sfx.thud(); }, 800);
      window.setTimeout(() => setDrops([]), 2200);
    }
    // Jelly lasts three seconds, then the letters hold still for aiming.
    if (p.id === 'jelly') { x.sfx.boing(); x.say('Jelly Letters!', 'oops'); setJelly(true); window.setTimeout(() => setJelly(false), 3000); }
  }

  // The timer bar ticks while a player is hunting (never under a card).
  useEffect(() => {
    if (mode !== 'play') return;
    let last = Date.now();
    const id = window.setInterval(() => {
      const now = Date.now(), dt = now - last; last = now;
      if (paused.current || !Number.isFinite(total.current)) return;
      if (frozenUntil.current > now) return;
      if (frozenUntil.current) { frozenUntil.current = 0; setFrozen(false); }
      remain.current = Math.max(0, remain.current - dt);
      setLeft(remain.current / total.current);
      if (remain.current <= 0) timeUp();
    }, 100);
    return () => window.clearInterval(id);
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  function timeUp() {
    const x = c.current;
    setMode('busy'); setStart(null); setEnd(null);
    // A gentle stop: no whistle, the words are shown so everyone learns them.
    x.sfx.slideDown(); x.say("Let's look together");
    if (x.solo) {
      for (const p of unfound()) x.log(asQuestion(p), false);
      setRevealAll(true);
      window.setTimeout(() => c.current.next(), 4200);
    } else {
      const open = unfound(), p = open[Math.floor(Math.random() * open.length)];
      if (p) { setShown(p); setLastClue(p); }
      window.setTimeout(() => { setShown(null); c.current.next(); }, 3200);
    }
  }

  // A word is circled.
  async function win(p: Placed, byMagnet = false) {
    const x = c.current;
    if (foundRef.current[p.word]) return;
    const f = { ...foundRef.current, [p.word]: x.player.id };
    foundRef.current = f; setFound(f);
    setStart(null); setEnd(null); setGlass(null); setBeam(null); setCpuHunt(null);
    const pts = WORD_POINTS * (doubleRef.current ? 2 : 1);
    if (doubleRef.current) setDouble(false);
    x.points(pts); clip('found'); x.sfx.note(Object.keys(f).length + 2);
    setLift({ id: Date.now(), p, color: x.solo ? MARKERS[Math.max(0, sRef.current.placed.indexOf(p)) % MARKERS.length] : color(x.player.id) }); setLastClue(p);
    x.log(asQuestion(p), true);
    const cells = cellsOf(p), mid = cells[Math.floor(cells.length / 2)], n = sRef.current.size;
    x.burst(0.12 + (mid[1] / n) * 0.5, 0.2 + (mid[0] / n) * 0.6);
    x.say(byMagnet ? `Magnet! ${p.word}` : `${p.word}! +${pts}`);
    const left = unfound(sRef.current, f).length;
    if (x.solo) {
      if (left === 0) {
        setMode('busy');
        window.setTimeout(() => { x.sfx.cheer(); x.say('Puzzle done!', 'big'); x.burst(0.4, 0.4, 'big'); }, 900);
        window.setTimeout(() => c.current.next(), 3000);
        return;
      }
      if (byMagnet) return;
      paused.current = true;
      await wait(900);
      const pw = await c.current.power(0.35, (pw) => pw.id !== 'magnet' || left > 1);
      paused.current = false;
      if (pw) fire(pw);
      return;
    }
    setMode('busy');
    await wait(1200);
    const pw = await c.current.power(0.45, (pw) => pw.id !== 'magnet' || left > 1);
    if (pw) {
      // Silly ones too wait for the earner's own next turn.
      { const id = c.current.player.id; pending.current[id] = [...(pending.current[id] ?? []), pw]; c.current.setHeld(id, pending.current[id]); }
    }
    if (left === 0) { x.sfx.cheer(); x.say('Grid cleared!', 'big'); x.burst(0.4, 0.4, 'big'); await wait(1600); }
    c.current.next();
  }

  function attempt(a: Cell, b: Cell) {
    const x = c.current;
    if (same(a, b)) return;
    const m = matchAt(sRef.current, a, b, new Set(Object.keys(foundRef.current)));
    if (m) { void win(m); return; }
    setMiss({ id: Date.now(), a, b }); x.sfx.boing();
    setStart(null); setEnd(null);
    window.setTimeout(() => setMiss(null), 700);
  }

  // The computer hunts with its own glass, then circles a word (or not).
  useEffect(() => {
    if (!ctx.cpu || mode !== 'play') return;
    let live = true;
    const x = c.current, n = sRef.current.size;
    const hops = 3 + Math.floor(Math.random() * 3);
    let k = 0;
    const id = window.setInterval(() => {
      if (!live) return;
      if (k++ < hops) { setCpuHunt([Math.floor(Math.random() * n), Math.floor(Math.random() * n)]); x.sfx.tick(); return; }
      window.clearInterval(id);
      const open = unfound();
      const t = open[Math.floor(Math.random() * open.length)];
      if (t && c.current.cpuRight()) {
        const cells = cellsOf(t);
        setCpuHunt(cells[0]); setStart(cells[0]); setEnd(cells[0]);
        cells.forEach((cell, i) => window.setTimeout(() => { if (live) { setEnd(cell); x.sfx.blip(i); } }, 400 + i * 160));
        window.setTimeout(() => { if (live) void win(t); }, 600 + cells.length * 160);
      } else {
        const a: Cell = [Math.floor(Math.random() * n), 0], b: Cell = [a[0], Math.min(n - 1, 2 + Math.floor(Math.random() * 3))];
        setStart(a); setEnd(b);
        window.setTimeout(() => { if (!live) return; setMiss({ id: Date.now(), a, b }); setStart(null); setEnd(null); x.sfx.boing(); x.say('So close!', 'oops'); setMode('busy'); }, 900);
        // The turn ends even though this effect has been cleaned up by the mode change.
        const turn = x.taken;
        window.setTimeout(() => { if (c.current.taken === turn) c.current.next(); }, 2300);
      }
    }, 650);
    return () => { live = false; window.clearInterval(id); };
  }, [ctx.cpu, mode, ctx.taken]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pointer: tap first then last letter, or drag along the word.
  const gridRef = useRef<HTMLDivElement>(null);
  const canPlay = mode === 'play' && !ctx.cpu;
  function cellAt(e: RPointerEvent): Cell | null {
    const el = gridRef.current; if (!el) return null;
    const r = el.getBoundingClientRect(), n = sRef.current.size;
    const col = Math.floor(((e.clientX - r.left) / r.width) * n), row = Math.floor(((e.clientY - r.top) / r.height) * n);
    if (col < 0 || row < 0 || col >= n || row >= n) return null;
    return [row, col];
  }
  function snap(a: Cell, raw: Cell): Cell {
    const n = sRef.current.size, dr = raw[0] - a[0], dc = raw[1] - a[1];
    const ang = Math.round(Math.atan2(dr, dc) / (Math.PI / 4)) * (Math.PI / 4);
    const len = Math.max(Math.abs(dr), Math.abs(dc));
    const sr = Math.round(Math.sin(ang)), sc = Math.round(Math.cos(ang));
    let k = len;
    while (k > 0 && (a[0] + sr * k < 0 || a[0] + sr * k >= n || a[1] + sc * k < 0 || a[1] + sc * k >= n)) k--;
    return [a[0] + sr * k, a[1] + sc * k];
  }
  function down(e: RPointerEvent) {
    if (!canPlay) return;
    const cell = cellAt(e); if (!cell) return;
    e.preventDefault();
    if (start && !same(start, cell)) { attempt(start, snap(start, cell)); return; }
    if (start && same(start, cell)) { setStart(null); setEnd(null); return; }
    clip('tap', 0.5);
    setStart(cell); setEnd(cell); setCursor(cell);
    dragging.current = true;
    (e.target as Element).releasePointerCapture?.(e.pointerId);
  }
  function move(e: RPointerEvent) {
    if (!dragging.current || !start) return;
    const cell = cellAt(e); if (!cell) return;
    const s = snap(start, cell);
    if (!same(s, end)) { setEnd(s); c.current.sfx.tick(); }
  }
  function up() {
    if (!dragging.current) return;
    dragging.current = false;
    if (start && end && !same(start, end)) attempt(start, end);
  }
  function key(e: RKeyboardEvent) {
    const n = sRef.current.size;
    const d: Record<string, Cell> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    if (d[e.key]) {
      e.preventDefault();
      const nc: Cell = [Math.min(n - 1, Math.max(0, cursor[0] + d[e.key][0])), Math.min(n - 1, Math.max(0, cursor[1] + d[e.key][1]))];
      setCursor(nc); if (start) setEnd(snap(start, nc));
      (gridRef.current?.querySelector(`[data-cell="${keyOf(nc)}"]`) as HTMLElement | null)?.focus();
    } else if ((e.key === 'Enter' || e.key === ' ') && canPlay) {
      e.preventDefault();
      if (!start) { setStart(cursor); setEnd(cursor); clip('tap', 0.5); } else if (same(start, cursor)) { setStart(null); setEnd(null); } else attempt(start, snap(start, cursor));
    } else if (e.key === 'Escape') { setStart(null); setEnd(null); }
  }

  const n = search.size;
  const sel = start && end ? lineCells(start, end) : null;
  const selKeys = new Set(sel?.map(keyOf));
  const foundKeys = useMemo(() => new Set(search.placed.filter((p) => found[p.word]).flatMap((p) => cellsOf(p).map(keyOf))), [search, found]);
  const S = wide ? '100cqh' : '100cqw';
  const letterSize = `calc(${S} * 0.84 / ${n} * 0.62)`;
  const centre = ([r, c2]: Cell) => [c2 + 0.5, r + 0.5];
  const capsule = (a: Cell, b: Cell) => { const [x1, y1] = centre(a), [x2, y2] = centre(b); return { x1, y1, x2, y2 }; };

  return (
    <div ref={box} className="absolute inset-0 grid place-items-center">
      <DeskBits still={ctx.still} />
      <div className="lab-fit relative" style={{ '--ar': wide ? 1.62 : 0.64, containerType: 'size' } as CSSProperties}>
        <div className={`absolute inset-0 flex ${wide ? 'flex-row' : 'flex-col'} gap-[2.2%]`}>
          {/* The clipboard and its puzzle page. */}
          <motion.div className="relative shrink-0 aspect-square" style={wide ? { height: '100%' } : { width: '100%' }}
            animate={!ctx.shake || !shake ? undefined : { x: [0, -14, 12, -9, 7, -3, 0], rotate: [0, -1.5, 1.2, -0.8, 0.4, 0] }} key={`shake-${shake}`} transition={{ duration: 0.8 }}>
            <Clipboard />
            <div className="absolute left-[6%] right-[6%] top-[12.5%] bottom-[5%]">
              <div ref={gridRef} role="grid" aria-label="Letter grid" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onKeyDown={key}
                className="absolute inset-0 grid touch-none select-none" style={{ gridTemplateColumns: `repeat(${n}, 1fr)`, gridTemplateRows: `repeat(${n}, 1fr)`, cursor: canPlay ? 'pointer' : 'default' }}>
                {/* Found words, circled in the finder's color. */}
                <svg viewBox={`0 0 ${n} ${n}`} className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
                  {search.placed.filter((p) => found[p.word] || revealAll || shown?.word === p.word).map((p) => {
                    const cells = cellsOf(p), l = capsule(cells[0], cells[cells.length - 1]);
                    const fill = found[p.word] ? markOf(p.word) : '#ffffff';
                    return (
                      <g key={p.word}>
                        <motion.line {...l} stroke="#000" strokeWidth={0.86} strokeLinecap="round" initial={ctx.still ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.45 }} strokeDasharray={found[p.word] ? undefined : '0.2 0.15'} />
                        <motion.line {...l} stroke={fill} strokeWidth={0.74} strokeLinecap="round" initial={ctx.still ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.45 }} opacity={0.92} />
                      </g>
                    );
                  })}
                  {sel && start && end && <line {...capsule(start, end)} stroke="#241c3d" strokeWidth={0.84} strokeLinecap="round" opacity={0.9} />}
                  {sel && start && end && <line {...capsule(start, end)} stroke="#fdfd94" strokeWidth={0.72} strokeLinecap="round" />}
                  <AnimatePresence>
                    {miss && <motion.line key={miss.id} {...capsule(miss.a, miss.b)} stroke="#ef7d96" strokeWidth={0.7} strokeLinecap="round" initial={{ opacity: 0.9 }} animate={ctx.still ? { opacity: 0 } : { opacity: [0.9, 0.9, 0], x: [0, -0.2, 0.2, -0.15, 0.1, 0] }} transition={{ duration: 0.65 }} />}
                  </AnimatePresence>
                </svg>
                {search.grid.map((row, r) => row.map((l, col) => {
                  const k = `${r},${col}`, on = selKeys.has(k), isFound = foundKeys.has(k);
                  const dim = beam !== null && beam !== r;
                  return (
                    <button key={`${k}-${l}`} type="button" data-cell={k} tabIndex={same(cursor, [r, col]) ? 0 : -1} aria-label={`${l}, row ${r + 1}, column ${col + 1}`}
                      className="relative grid place-items-center font-heading font-bold leading-none rounded-full outline-none focus-visible:ring-4 focus-visible:ring-ink-night"
                      style={{ fontSize: letterSize, color: '#241c3d', opacity: dim ? 0.22 : 1, transition: 'opacity .4s' }}
                      onFocus={() => setCursor([r, col])}>
                      <motion.span className="block"
                        initial={ctx.still ? false : { y: -30, opacity: 0, scale: 0.4 }}
                        animate={jelly && !ctx.still ? { y: 0, opacity: 1, scaleX: [1, 1.25, 0.85, 1.1, 1], scaleY: [1, 0.8, 1.2, 0.9, 1], rotate: [0, -6, 6, 0] } : { y: 0, opacity: 1, scale: on ? 1.22 : isFound ? 1.06 : 1 }}
                        transition={jelly ? { duration: 0.9 + ((r * 7 + col * 3) % 5) * 0.12, repeat: Infinity, delay: ((r + col) % 6) * 0.08 } : { type: 'spring', stiffness: 420, damping: 18, delay: ctx.still ? 0 : (r + col) * 0.012 }}
                        whileHover={canPlay && !ctx.still ? { scale: 1.2 } : undefined}>
                        {l}
                      </motion.span>
                    </button>
                  );
                }))}
                {/* Magnifying glass over a first letter. */}
                <AnimatePresence>
                  {glass && (
                    <motion.div key="glass" className="absolute pointer-events-none" style={{ width: `${(100 / n) * 2.2}%`, height: `${(100 / n) * 2.2}%`, left: `${((glass[1] + 0.5) / n) * 100}%`, top: `${((glass[0] + 0.5) / n) * 100}%`, translateX: '-34%', translateY: '-34%' }}
                      initial={ctx.still ? { opacity: 0 } : { x: '-260%', y: '-200%', rotate: -40, opacity: 0 }} animate={{ x: 0, y: ctx.still ? 0 : [0, -4, 0], rotate: 0, opacity: 1 }} exit={{ opacity: 0, scale: 0.6 }}
                      transition={{ x: { type: 'spring', stiffness: 60, damping: 12 }, y: { duration: 1.2, repeat: 2 }, rotate: { type: 'spring', stiffness: 60, damping: 12 } }}>
                      <Art kind="glass-on" />
                    </motion.div>
                  )}
                </AnimatePresence>
                {/* The computer's own glass, wandering. */}
                {cpuHunt && ctx.cpu && (
                  <motion.div className="absolute pointer-events-none" style={{ width: `${(100 / n) * 1.6}%`, height: `${(100 / n) * 1.6}%`, translateX: '-30%', translateY: '-30%' }}
                    animate={{ left: `${((cpuHunt[1] + 0.5) / n) * 100}%`, top: `${((cpuHunt[0] + 0.5) / n) * 100}%` }} transition={{ type: 'spring', stiffness: 80, damping: 14 }}>
                    <Art kind="glass-on" />
                  </motion.div>
                )}
                {/* Flashlight beam on one row. */}
                <AnimatePresence>
                  {beam !== null && (
                    <motion.div key="beam" className="absolute -left-[5%] -right-[2%] pointer-events-none rounded-full" style={{ top: `${(beam / n) * 100}%`, height: `${100 / n}%`, background: 'linear-gradient(90deg, rgba(253,253,148,0.95), rgba(253,253,148,0.55) 70%, rgba(253,253,148,0.15))', mixBlendMode: 'multiply' }}
                      initial={ctx.still ? { opacity: 0 } : { scaleX: 0, originX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }} />
                  )}
                </AnimatePresence>
                {beam !== null && (
                  <motion.div className="absolute pointer-events-none" style={{ left: '-9%', top: `${((beam + 0.5) / n) * 100}%`, width: '12%', height: '12%', translateY: '-50%' }} initial={ctx.still ? false : { x: -40, rotate: -30 }} animate={{ x: 0, rotate: 0 }} transition={{ type: 'spring', stiffness: 120, damping: 12 }}>
                    <Art kind="torch" />
                  </motion.div>
                )}
                {/* The magnet pulls a word. */}
                <AnimatePresence>
                  {magnet && (
                    <motion.div key="magnet" className="absolute pointer-events-none" style={{ width: '24%', height: '24%', left: `${((cellsOf(magnet)[0][1]) / n) * 100}%`, top: `${((cellsOf(magnet)[0][0] - 2.4) / n) * 100}%` }}
                      initial={ctx.still ? { opacity: 0 } : { y: '-160%', rotate: 30, opacity: 0 }} animate={{ y: ctx.still ? 0 : [0, 6, 0], rotate: [0, -6, 6, 0], opacity: 1 }} exit={{ opacity: 0, y: -80 }}
                      transition={{ duration: 0.8, repeat: 1 }}>
                      {img('magnet')}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {/* Letter Rain. */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
                {!ctx.still && drops.map((d) => (
                  <motion.span key={d.id} className="absolute top-0 font-heading font-bold" style={{ left: `${d.x}%`, fontSize: letterSize, color: '#ef7d96', WebkitTextStroke: '0.06em #000' }}
                    initial={{ y: '-20%', rotate: 0, opacity: 1 }} animate={{ y: ['-20%', '900%'], rotate: d.r, opacity: [1, 1, 0] }} transition={{ duration: 1.4, delay: d.d, ease: [0.5, 0, 0.9, 0.6] }}>{d.l}</motion.span>
                ))}
              </div>
              {/* The found word lifts out with sparkles. */}
              <AnimatePresence>
                {lift && <LiftOut key={lift.id} lift={lift} n={n} still={ctx.still} size={letterSize} onDone={() => setLift(null)} />}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* The word list, the timer bar and the latest clue. */}
          <div className="relative flex-1 min-w-0 min-h-0 flex flex-col gap-[3%]">
            <Timer left={left} frozen={frozen} double={double} still={ctx.still} solo={ctx.solo} hide={mode === 'turn'} h={wide ? '6.5cqh' : '5.4cqw'} />
            <div className="relative flex-1 min-h-0 rounded-[1.4rem] border-heavy border-border bg-surface px-[6%] py-[4%] flex flex-col" style={{ boxShadow: '0 6px 0 #000, 0 18px 30px rgba(36,28,61,0.25)' }}>
              {wide && <p className="flex items-center gap-2 font-heading font-bold uppercase tracking-wider text-muted" style={{ fontSize: 'max(0.75rem, 2.2cqh)' }}><MagnifyingGlass weight="bold" aria-hidden="true" /> Find these words</p>}
              <ul className={`list-none m-0 p-0 flex-1 min-h-0 ${wide ? 'grid content-evenly' : 'flex flex-wrap content-center justify-center gap-x-[4%] gap-y-[6%]'}`} aria-label="Words to find">
                {search.placed.map((p) => {
                  const by = found[p.word];
                  return (
                    <motion.li key={`${p.word}-${search.grid[0].join('')}`} layout className="relative flex items-center gap-2 font-heading font-bold leading-none" title={by ? p.clue : undefined}
                      style={{ fontSize: wide ? `min(5.2cqh, ${100 / Math.max(6, search.placed.length)}cqh * 0.62)` : '4.6cqw' }}
                      initial={ctx.still ? false : { x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1, scale: by ? [1, 1.2, 1] : 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }}>
                      <span className="shrink-0 rounded-full border-std border-border grid place-items-center" style={{ width: '1.1em', height: '1.1em', background: by ? markOf(p.word) : '#fff' }} aria-hidden="true">
                        {by && <CheckCircle weight="fill" size="0.9em" color="#241c3d" />}
                      </span>
                      <span className="relative" style={{ color: by ? '#5b6390' : '#241c3d' }}>
                        {p.word}
                        {by && <motion.span className="absolute left-0 right-0 top-1/2 h-[0.12em] bg-ink-night rounded-full" initial={ctx.still ? false : { scaleX: 0, originX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.4, delay: 0.3 }} />}
                      </span>
                      <span className="sr-only">{by ? `found: ${p.clue}` : 'not found yet'}</span>
                    </motion.li>
                  );
                })}
              </ul>
            </div>
            <ClueCard p={lastClue} still={ctx.still} wide={wide} color={lastClue && found[lastClue.word] ? markOf(lastClue.word) : '#fdfd94'} />
          </div>
        </div>
      </div>
      {mode === 'turn' && !ctx.solo && <TurnCard key={ctx.taken} player={me} onStart={() => void beginTurn()} />}
    </div>
  );
}

const wait = (ms: number) => new Promise((r) => window.setTimeout(r, ms));

// The found word floats up off the page, sparkling, with its clue.
function LiftOut({ lift, n, still, size, onDone }: { lift: Lift; n: number; still: boolean; size: string; onDone: () => void }) {
  const cells = cellsOf(lift.p);
  useEffect(() => { const id = window.setTimeout(onDone, still ? 1200 : 1900); return () => window.clearTimeout(id); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const sparks = useMemo(() => cells.flatMap((_, i) => [0, 1].map((k) => ({ i, a: Math.random() * Math.PI * 2, d: 30 + Math.random() * 50, k }))), [lift.id]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <motion.div className="absolute inset-0 pointer-events-none" aria-hidden="true" exit={{ opacity: 0 }}>
      {cells.map(([r, col], i) => (
        <motion.span key={i} className="absolute grid place-items-center font-heading font-bold rounded-full border-std border-border"
          style={{ left: `${(col / n) * 100}%`, top: `${(r / n) * 100}%`, width: `${100 / n}%`, height: `${100 / n}%`, fontSize: size, background: lift.color, color: '#241c3d', boxShadow: '0 4px 0 #000' }}
          initial={{ y: 0, scale: 1 }} animate={still ? { opacity: [1, 1, 0] } : { y: ['0%', '-60%', '-140%'], scale: [1, 1.35, 1.1], rotate: [0, (i % 2 ? 1 : -1) * 12, 0], opacity: [1, 1, 0] }}
          transition={{ duration: 1.6, delay: i * 0.05, ease: 'easeOut', times: [0, 0.35, 1] }}>
          {lift.p.word[i]}
        </motion.span>
      ))}
      {!still && sparks.map((s, k) => {
        const [r, col] = cells[s.i];
        return (
          <motion.svg key={k} viewBox="0 0 20 20" className="absolute" style={{ left: `${((col + 0.3) / n) * 100}%`, top: `${((r + 0.3) / n) * 100}%`, width: `${40 / n}%` }}
            initial={{ x: 0, y: 0, scale: 0, rotate: 0 }} animate={{ x: Math.cos(s.a) * s.d, y: Math.sin(s.a) * s.d - 30, scale: [0, 1.3, 0], rotate: 180 }} transition={{ duration: 1, delay: 0.1 + s.i * 0.05 + s.k * 0.1 }}>
            <path d="M10 0l2.6 7.4L20 10l-7.4 2.6L10 20l-2.6-7.4L0 10l7.4-2.6z" fill={s.k ? '#fdfd94' : '#ffffff'} stroke="#000" strokeWidth="1.2" />
          </motion.svg>
        );
      })}
    </motion.div>
  );
}

// The latest found word with its clue, like a sticky note.
function ClueCard({ p, still, wide, color }: { p: Placed | null; still: boolean; wide: boolean; color: string }) {
  return (
    <div className="relative shrink-0 rounded-[1.2rem] border-heavy border-border px-[5%] py-[3%] grid content-center" style={{ background: p ? '#fffdf0' : 'rgba(251,252,248,0.55)', boxShadow: '0 5px 0 #000', minHeight: wide ? '24%' : '34%' }} aria-live="polite">
      <AnimatePresence mode="wait">
        {p ? (
          <motion.div key={p.word} initial={still ? false : { rotate: -4, scale: 0.7, opacity: 0 }} animate={{ rotate: 0, scale: 1, opacity: 1 }} exit={{ opacity: 0, y: -10 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }} className="grid gap-1">
            <span className="font-display leading-none" style={{ fontSize: wide ? '4.4cqh' : '4.6cqw' }}><span className="rounded-full border-std border-border px-3" style={{ background: color }}>{p.word}</span></span>
            <span className="font-bold leading-snug text-balance" style={{ fontSize: wide ? 'max(0.85rem, 3cqh)' : 'max(0.85rem, 3.2cqw)' }}>{p.clue}</span>
          </motion.div>
        ) : (
          <motion.span key="none" className="font-bold text-muted text-center" style={{ fontSize: wide ? 'max(0.8rem, 2.4cqh)' : 'max(0.8rem, 2.8cqw)' }}>Find a word to see its clue</motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

// A pencil-shaped timer bar that shrinks.
function Timer({ left, frozen, double, still, solo, hide, h }: { left: number; frozen: boolean; double: boolean; still: boolean; solo: boolean; hide: boolean; h: string }) {
  const low = left < 0.2 && !frozen;
  return (
    <div className="relative shrink-0 min-h-7 flex items-center gap-2" style={{ opacity: hide ? 0.4 : 1, height: h }} aria-label={solo ? 'Time left for the puzzle' : 'Time left for this turn'} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(left * 100)}>
      <span className="shrink-0 h-full aspect-square rounded-full border-heavy border-border grid place-items-center" style={{ background: frozen ? '#bfe6ff' : '#fbfcf8', boxShadow: '0 4px 0 #000' }} aria-hidden="true">
        <motion.svg viewBox="0 0 20 20" className="w-[70%] h-[70%]" ><circle cx="10" cy="11" r="7.5" fill="#fff" stroke="#000" strokeWidth="2" /><path d="M10 11V6.5M10 11l3 2" stroke="#000" strokeWidth="2" strokeLinecap="round" /><rect x="8" y="0.8" width="4" height="2.6" rx="1" /></motion.svg>
      </span>
      <div className="relative flex-1 h-full rounded-full border-heavy border-border bg-surface overflow-hidden" style={{ boxShadow: '0 4px 0 #000' }}>
        <motion.div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${left * 100}%`, background: frozen ? 'repeating-linear-gradient(45deg,#bfe6ff 0 10px,#e8f7ff 10px 20px)' : low ? '#ef7d96' : 'linear-gradient(180deg,#fdfd94,#f6c544)', borderRight: '3px solid #000', transition: 'width .1s linear, background .3s' }}
          />
      </div>
      <AnimatePresence>
        {double && (
          <motion.span key="x2" className="shrink-0 h-full aspect-square rounded-full border-heavy border-border bg-accent grid place-items-center font-display" style={{ fontSize: `calc(${h} * 0.42)` }}
            initial={still ? false : { scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }}>x2</motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

// Desk things peeking out around the clipboard: a pencil, an eraser, a paper clip.
function DeskBits({ still }: { still: boolean }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      <motion.svg viewBox="0 0 120 20" className="absolute w-[18%] min-w-24 -left-[2%] bottom-[3%]" style={{ rotate: -14 }} animate={still ? undefined : { y: [0, -3, 0] }} transition={{ duration: 4, repeat: Infinity }}>
        <path d="M14 3h88v14H14z" fill="#f6c544" stroke="#000" strokeWidth="2" /><path d="M14 3L1 10l13 7z" fill="#f5d6b0" stroke="#000" strokeWidth="2" strokeLinejoin="round" /><path d="M1 10l5-2.7v5.4z" fill="#241c3d" />
        <path d="M102 3h10a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4h-10z" fill="#ef7d96" stroke="#000" strokeWidth="2" /><path d="M98 3v14" stroke="#000" strokeWidth="2" /><path d="M20 10h76" stroke="#e0a92c" strokeWidth="2" />
      </motion.svg>
      <svg viewBox="0 0 40 24" className="absolute w-[7%] min-w-12 right-[1%] top-[1%]" style={{ rotate: '18deg' }}><rect x="1" y="1" width="38" height="22" rx="5" fill="#ef7d96" stroke="#000" strokeWidth="2" /><path d="M24 1v22" stroke="#000" strokeWidth="2" /><rect x="25" y="2" width="13" height="20" rx="4" fill="#b4c4fb" /></svg>
      <svg viewBox="0 0 20 50" className="absolute w-[2.5%] min-w-5 right-[3%] bottom-[6%]" style={{ rotate: '-24deg' }}><path d="M6 44V10a4 4 0 0 1 8 0v30a7 7 0 0 1-14 0V6a10 10 0 0 1 20 0v38" stroke="#241c3d" strokeWidth="3" fill="none" strokeLinecap="round" /></svg>
    </div>
  );
}

// The Classic clipboard: a salmon board with a navy clip and a lined page.
function Clipboard() {
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" aria-hidden="true" style={{ filter: 'drop-shadow(0 6px 0 #000) drop-shadow(0 18px 18px rgba(36,28,61,0.35))' }}>
      <rect x="1.5" y="3" width="97" height="95.5" rx="6" fill="#f5a08c" stroke="#000" strokeWidth="1.2" />
      <rect x="1.5" y="3" width="97" height="95.5" rx="6" fill="url(#ws-wood)" opacity="0.35" />
      <rect x="4.5" y="9" width="91" height="87" rx="2.5" fill="#fbfcf8" stroke="#000" strokeWidth="0.8" />
      <path d="M36 0.8h28a3 3 0 0 1 3 3V8a2 2 0 0 1-2 2H35a2 2 0 0 1-2-2V3.8a3 3 0 0 1 3-3z" fill="#241c3d" stroke="#000" strokeWidth="0.8" />
      <rect x="45" y="2.6" width="10" height="2.4" rx="1.2" fill="#b4c4fb" />
      <circle cx="39" cy="5.4" r="1.2" fill="#b4c4fb" /><circle cx="61" cy="5.4" r="1.2" fill="#b4c4fb" />
      <defs>
        <pattern id="ws-wood" width="8" height="4" patternUnits="userSpaceOnUse"><path d="M0 2 Q2 0.8 4 2 T8 2" stroke="#c9705c" strokeWidth="0.4" fill="none" /></pattern>
      </defs>
    </svg>
  );
}

// Classic power-up pictures, drawn in code.
function Art({ kind }: { kind: string }): ReactNode {
  const ring = (fill: string) => <circle cx="50" cy="50" r="44" fill={fill} stroke="#000" strokeWidth="5" />;
  if (kind === 'glass-on') return (
    <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true" style={{ filter: 'drop-shadow(0 4px 0 rgba(0,0,0,0.6))' }}>
      <circle cx="34" cy="34" r="27" fill="rgba(253,253,148,0.35)" stroke="#000" strokeWidth="7" />
      <circle cx="34" cy="34" r="27" fill="none" stroke="#f6c544" strokeWidth="3" />
      <path d="M24 20q6-6 14-4" stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M54 54l28 28" stroke="#000" strokeWidth="14" strokeLinecap="round" /><path d="M56 56l25 25" stroke="#ef7d96" strokeWidth="8" strokeLinecap="round" />
    </svg>
  );
  if (kind === 'torch') return (
    <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
      <rect x="6" y="36" width="50" height="28" rx="8" fill="#241c3d" stroke="#000" strokeWidth="5" />
      <path d="M56 30l24-10v60l-24-10z" fill="#f6c544" stroke="#000" strokeWidth="5" strokeLinejoin="round" />
      <rect x="18" y="44" width="10" height="12" rx="3" fill="#ef7d96" />
    </svg>
  );
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      {kind === 'magnify' && <>{ring('#b4c4fb')}<circle cx="44" cy="44" r="20" fill="#fdfd94" stroke="#000" strokeWidth="6" /><text x="44" y="52" textAnchor="middle" fontSize="22" fontWeight="800" fontFamily="Inclusive Sans, sans-serif">A</text><path d="M58 58l18 18" stroke="#000" strokeWidth="10" strokeLinecap="round" /></>}
      {kind === 'flash' && <>{ring('#241c3d')}<path d="M48 40l34-16v52L48 60z" fill="#fdfd94" opacity="0.9" /><rect x="14" y="40" width="34" height="20" rx="5" fill="#f5a08c" stroke="#000" strokeWidth="4" /><rect x="44" y="36" width="8" height="28" rx="2" fill="#f6c544" stroke="#000" strokeWidth="4" /></>}
      {kind === 'rain' && <>{ring('#e9eefe')}<path d="M22 44a14 14 0 0 1 22-14 16 16 0 0 1 30 6 10 10 0 0 1 0 20H28a10 10 0 0 1-6-12z" fill="#fff" stroke="#000" strokeWidth="4" />{[['A', 30, 76], ['B', 50, 84], ['C', 68, 74]].map(([l, x, y]) => <text key={l as string} x={x as number} y={y as number} textAnchor="middle" fontSize="16" fontWeight="800" fill="#ef7d96" stroke="#000" strokeWidth="1" fontFamily="Inclusive Sans, sans-serif">{l}</text>)}</>}
      {kind === 'jelly' && <>{ring('#8fe3a0')}<path d="M26 66q0-34 24-36t24 36q-6 6-12 0-6 6-12 0-6 6-12 0-6 6-12 0z" fill="#ef7d96" stroke="#000" strokeWidth="4" strokeLinejoin="round" /><circle cx="42" cy="48" r="4" /><circle cx="58" cy="48" r="4" /><path d="M44 58q6 5 12 0" stroke="#000" strokeWidth="3.5" fill="none" strokeLinecap="round" /><path d="M36 38q4-4 8-3" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" /></>}
    </svg>
  );
}

function Cover() {
  const letters = ['CATRS', 'OSUNE', 'DOGKA', 'FROGT', 'BIRDM'];
  return (
    <svg viewBox="0 0 100 62" preserveAspectRatio="xMidYMid slice" style={{ background: 'radial-gradient(circle at 50% 30%, #c9d2ff, #8d9df0)' }}>
      <rect x="24" y="4" width="52" height="56" rx="3.5" fill="#f5a08c" stroke="#000" strokeWidth="0.8" />
      <rect x="27" y="9" width="46" height="48" rx="1.5" fill="#fbfcf8" stroke="#000" strokeWidth="0.5" />
      <rect x="41" y="2.5" width="18" height="5" rx="1.5" fill="#241c3d" stroke="#000" strokeWidth="0.5" />
      <line x1="32" y1="15" x2="58" y2="15" stroke="#000" strokeWidth="6.4" strokeLinecap="round" /><line x1="32" y1="15" x2="58" y2="15" stroke="#f6c544" strokeWidth="5.6" strokeLinecap="round" />
      <line x1="32" y1="24" x2="58" y2="51" stroke="#000" strokeWidth="6.4" strokeLinecap="round" opacity="0" />
      <line x1="32" y1="24" x2="32" y2="51" stroke="#000" strokeWidth="6.4" strokeLinecap="round" /><line x1="32" y1="24" x2="32" y2="51" stroke="#5cc3a0" strokeWidth="5.6" strokeLinecap="round" />
      {letters.map((row, r) => [...row].map((l, k) => <text key={`${r}${k}`} x={32 + k * 8.6} y={17.4 + r * 9} textAnchor="middle" fontSize="6.4" fontWeight="800" fill="#241c3d" fontFamily="Inclusive Sans, sans-serif">{l}</text>))}
      <g transform="translate(70 36) rotate(-20)"><circle r="9" fill="rgba(253,253,148,0.45)" stroke="#000" strokeWidth="2.2" /><path d="M6 6l9 9" stroke="#000" strokeWidth="4.4" strokeLinecap="round" /><path d="M6.6 6.6l8 8" stroke="#ef7d96" strokeWidth="2.4" strokeLinecap="round" /></g>
      {[[14, 14], [86, 12], [12, 50], [88, 52]].map(([x, y], i) => <path key={i} d={`M${x} ${y - 3}l1 2 2 1-2 1-1 2-1-2-2-1 2-1z`} fill="#fdfd94" stroke="#000" strokeWidth="0.4" />)}
    </svg>
  );
}

const def: LabDef = {
  id: 'word-search',
  name: 'Word Search',
  description: 'Words from your set hide in the letter grid. Circle them to see their clues.',
  ways: ['solo', 'teams'],
  minTeams: 2,
  maxTeams: 6,
  uses: 'words',
  how: [
    { icon: <MagnifyingGlass weight="fill" />, text: 'Look for a word from the list' },
    { icon: <HandTap weight="fill" />, text: 'Tap its first and last letter' },
    { icon: <Trophy weight="fill" />, text: 'Find the most words to win' },
  ],
  rounds: { label: 'Rounds', min: 1, max: 10, default: 3 },
  powers: POWERS,
  background: 'radial-gradient(circle at 2px 2px, rgba(36,28,61,0.10) 1.5px, transparent 0) 0 0 / 26px 26px, radial-gradient(120% 90% at 50% 10%, #c9d2ff 0%, #9aa8f2 60%, #7d8be0 100%)',
  cover: <Cover />,
  pieces: [
    { id: 'background', label: 'Background', hint: 'Behind the clipboard' },
    { id: 'clipboard', label: 'Clipboard', hint: 'The board the puzzle page is clipped to' },
    { id: 'page', label: 'Puzzle page', hint: 'The paper under the letters' },
    { id: 'marker', label: 'Word marker', hint: 'The round highlighter that circles a found word' },
    { id: 'timer', label: 'Timer bar', hint: 'The bar that shrinks as time runs out' },
    { id: 'glass', label: 'Hunting glass', hint: 'The glass that points at a letter' },
    ...POWERS.map((p) => ({ id: `power-${p.id}`, label: p.name, hint: p.desc })),
  ],
  Play,
};
export default def;
