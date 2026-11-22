import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as RPointerEvent, type RefObject } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Fire, HandTap, Timer, Tray } from '@phosphor-icons/react';
import type { MultipleChoiceQuestion } from '../../../data/types';
import type { LabCtx, LabDef, LabPower } from '../../types';
import { binAt, cpuBin, freeLane, LANES, pickBins, scoreFor, type Q } from './sorter';

// Sort Rush (Game Lab, a speed sort): answer cards slide down the chutes and
// each one belongs in the bin of the question it answers. Tap a card and then
// its bin (or drag it, or tap a bin to send the lowest card). Every team gets
// its own timed burst; a combo of right sorts brings a surprise power-up.

const POWERS: LabPower[] = [
  { id: 'slow', name: 'Slow Motion', desc: 'Cards fall slowly for a little while.', enter: 'zoom', art: <Art kind="slow" /> },
  { id: 'magnet', name: 'Magnet Bin', desc: 'Tap a card and it zooms to the right bin.', enter: 'spin', art: <Art kind="magnet" /> },
  { id: 'clear', name: 'Clear Lane', desc: 'Every card on the screen sorts itself.', enter: 'drop', art: <Art kind="clear" /> },
  { id: 'double', name: 'Double Points', desc: 'Two times the points for a little while.', enter: 'spin', art: <Art kind="double" /> },
  { id: 'time', name: 'Extra Time', desc: 'Eight more seconds on the clock.', enter: 'drop', art: <Art kind="time" /> },
  { id: 'flurry', name: 'Card Flurry', desc: 'Whoa! A flurry of extra cards rains down.', silly: true, art: <Art kind="flurry" /> },
  { id: 'shuffle', name: 'Bin Shuffle', desc: 'Whoops! The bins slide into new spots.', silly: true, art: <Art kind="shuffle" /> },
];

const BURST = 30; // seconds a team plays each turn
const BIN_COLORS = ['#f5a08c', '#8fe3a0', '#fdfd94'];
interface Bin { q: MultipleChoiceQuestion; key: number; color: string }
interface Card { id: number; qid: string; text: string; lane: number; y: number; speed: number; extra?: boolean; shake?: number }
interface Flyer { id: number; text: string; lane: number; y: number; bin: number; color: string }
type Phase = 'ready' | 'run' | 'pause' | 'over';

let uid = 1;
const asQ = (q: MultipleChoiceQuestion): Q => ({ id: q.id, prompt: q.prompt, answer: q.choices[q.correctIndex] ?? '' });

function Play({ ctx }: { ctx: LabCtx }) {
  const c = useRef(ctx); c.current = ctx;
  const [, setTick] = useState(0);
  const phase = useRef<Phase>('ready');
  const [phaseView, setPhaseView] = useState<Phase>('ready');
  const bins = useRef<Bin[]>([]);
  const cards = useRef<Card[]>([]);
  const [flyers, setFlyers] = useState<Flyer[]>([]);
  const [pops, setPops] = useState<{ id: number; bin: number; text: string; good: boolean }[]>([]);
  const time = useRef(BURST);
  const clock = useRef(0);
  const until = useRef({ slow: 0, magnet: 0, double: 0 });
  const combo = useRef(0);
  const sorted = useRef(0);
  const missed = useRef<Set<string>>(new Set());
  const spawns = useRef<{ at: number; qid: string; extra?: boolean }[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const selRef = useRef(selected); selRef.current = selected;
  const [drag, setDrag] = useState<{ id: number; x: number; y: number; moved: boolean; sx: number; sy: number } | null>(null);
  const dragRef = useRef(drag); dragRef.current = drag;
  const endRef = useRef<() => void>(() => {});
  const [shakeBin, setShakeBin] = useState<{ i: number; id: number } | null>(null);
  const [fx, setFx] = useState<{ kind: string; id: number } | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const shape = useShape(box);
  const tall = shape > 0.95;
  const mid = !tall && shape > 0.72;
  const still = ctx.still;

  const nBins = () => (c.current.round <= 1 ? 2 : 3);
  const binOf = (qid: string) => bins.current.findIndex((b) => b.q.id === qid);
  const setPhase = (p: Phase) => { phase.current = p; setPhaseView(p); };

  function queueCard(qid: string, delay: number, extra = false) { spawns.current.push({ at: clock.current + delay, qid, extra }); }
  function spawn(qid: string, extra = false) {
    const b = bins.current.find((x) => x.q.id === qid); if (!b) return;
    const used = [...cards.current].sort((a, b) => a.y - b.y).slice(0, 3).map((k) => k.lane);
    const r = c.current.round;
    cards.current.push({ id: uid++, qid, text: b.q.choices[b.q.correctIndex] ?? '', lane: freeLane(used), y: 0, speed: (extra ? 0.15 : 0.075 + Math.random() * 0.035) + r * 0.008, extra });
  }

  // A new turn: fresh bins, a fresh clock, then Go!
  useEffect(() => {
    const x = c.current;
    const qs: MultipleChoiceQuestion[] = [];
    const byId = new Map<string, MultipleChoiceQuestion>();
    const draw = () => { const q = x.draw(); byId.set(q.id, q); return asQ(q); };
    for (const q of pickBins(draw, nBins())) { const full = byId.get(q.id); if (full) qs.push(full); }
    bins.current = qs.map((q, i) => ({ q, key: uid++, color: BIN_COLORS[i % 3] }));
    cards.current = []; spawns.current = []; setFlyers([]); setPops([]);
    time.current = BURST; combo.current = 0; sorted.current = 0; missed.current = new Set();
    until.current = { slow: 0, magnet: 0, double: 0 };
    clock.current = 0;
    bins.current.forEach((b, i) => queueCard(b.q.id, 0.3 + i * 1.6));
    setSelected(null);
    setPhase('ready');
    setTick((t) => t + 1);
    if (x.cpu) { const id = window.setTimeout(() => go(), 1600); return () => window.clearTimeout(id); }
  }, [ctx.taken]); // eslint-disable-line react-hooks/exhaustive-deps

  function go() { if (phase.current !== 'ready') return; c.current.sfx.whistle(); c.current.say('Go!', 'big'); setPhase('run'); }

  // The game clock: cards fall, the timer runs, new cards come out of the chutes.
  useEffect(() => {
    let raf = 0, last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (phase.current === 'run') {
        clock.current += dt;
        const slow = until.current.slow > clock.current ? 0.4 : 1;
        for (const k of cards.current) if (!(dragRef.current && dragRef.current.id === k.id && dragRef.current.moved)) k.y += k.speed * dt * slow;
        // A card that reaches the bins unsorted goes back up its chute.
        const fell = cards.current.filter((k) => k.y >= 1);
        if (fell.length) {
          cards.current = cards.current.filter((k) => k.y < 1);
          for (const k of fell) { if (!k.extra) { missed.current.add(k.qid); queueCard(k.qid, 0.5); } }
          combo.current = 0; c.current.sfx.bump();
          if (selRef.current && fell.some((k) => k.id === selRef.current)) setSelected(null);
        }
        const due = spawns.current.filter((s) => s.at <= clock.current);
        if (due.length) { spawns.current = spawns.current.filter((s) => s.at > clock.current); due.forEach((s) => spawn(s.qid, s.extra)); }
        const before = Math.ceil(time.current);
        time.current -= dt;
        if (Math.ceil(time.current) !== before && time.current <= 5 && time.current > 0) c.current.sfx.tick();
        if (time.current <= 0) endRef.current();
        setTick((t) => (t + 1) % 1000000);
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  endRef.current = end;
  function end() {
    const x = c.current;
    time.current = 0; setPhase('over'); setSelected(null); setDrag(null);
    for (const b of bins.current) if (missed.current.has(b.q.id)) x.log(b.q, false);
    x.sfx.whistle(); x.say(sorted.current ? `${sorted.current} sorted!` : 'Time!', 'big');
    if (sorted.current >= 6) x.burst(0.45, 0.4, 'big');
    window.setTimeout(() => c.current.next(), 2400);
  }

  function sort(id: number, bin: number) {
    const x = c.current;
    if (phase.current !== 'run') return;
    const k = cards.current.find((v) => v.id === id); if (!k) return;
    const right = binOf(k.qid);
    if (right < 0) return;
    if (until.current.magnet > clock.current) bin = right;
    setSelected(null);
    if (bin === right) {
      cards.current = cards.current.filter((v) => v.id !== id);
      const b = bins.current[right];
      setFlyers((f) => [...f, { id: k.id, text: k.text, lane: k.lane, y: k.y, bin: right, color: b.color }]);
      window.setTimeout(() => setFlyers((f) => f.filter((v) => v.id !== k.id)), 650);
      const pts = scoreFor(combo.current, until.current.double > clock.current);
      combo.current += 1; sorted.current += 1;
      x.points(pts); x.sfx.note(Math.min(12, combo.current)); x.sfx.coin();
      setPops((p) => [...p, { id: uid++, bin: right, text: `+${pts}`, good: true }]);
      if (k.extra) return;
      x.log(b.q, !missed.current.has(b.q.id));
      // The bin gets a new question; its card comes out of a chute.
      window.setTimeout(() => {
        const others = bins.current.filter((v) => v.q.id !== b.q.id).map((v) => asQ(v.q));
        const byId = new Map<string, MultipleChoiceQuestion>();
        const draw = () => { const q = c.current.draw(); byId.set(q.id, q); return asQ(q); };
        const fresh = pickBins(draw, others.length + 1, others).slice(-1)[0];
        const full = byId.get(fresh.id);
        if (!full) return;
        const i = binOf(b.q.id); if (i < 0) return;
        cards.current = cards.current.filter((v) => v.qid !== b.q.id);
        bins.current = bins.current.map((v, j) => (j === i ? { q: full, key: uid++, color: v.color } : v));
        queueCard(full.id, 0.6);
        setTick((t) => t + 1);
      }, 450);
      if (combo.current % 4 === 0) void earnPower();
    } else {
      k.y = Math.max(0, k.y - 0.18); k.shake = Date.now();
      combo.current = 0; missed.current.add(k.qid);
      x.sfx.boing();
      setShakeBin({ i: bin, id: Date.now() });
      setPops((p) => [...p, { id: uid++, bin, text: 'Oops!', good: false }]);
    }
  }

  async function earnPower() {
    const x = c.current;
    setPhase('pause');
    const p = await x.power(0.75, (pw) => (pw.id !== 'clear' || cards.current.length > 0) && (pw.id !== 'shuffle' || bins.current.length > 1));
    if (p) {
      setFx({ kind: p.id, id: Date.now() });
      window.setTimeout(() => setFx((f) => (f && Date.now() - f.id > 1800 ? null : f)), 2200);
      if (p.id === 'slow') { until.current.slow = clock.current + 8; x.sfx.freeze(); }
      if (p.id === 'magnet') { until.current.magnet = clock.current + 8; x.sfx.magnet(); }
      if (p.id === 'double') { until.current.double = clock.current + 8; x.sfx.coin(); }
      if (p.id === 'time') { time.current += 8; x.sfx.bell(); x.say('+8 seconds!'); }
      if (p.id === 'flurry') { x.sfx.wind(); for (let i = 0; i < 4; i++) queueCard(bins.current[i % bins.current.length].q.id, 0.2 + i * 0.35, true); }
      if (p.id === 'shuffle') {
        x.sfx.whoosh();
        const b = [...bins.current];
        b.push(b.shift()!);
        bins.current = b;
      }
      if (p.id === 'clear') {
        x.sfx.swish();
        const list = [...cards.current];
        list.forEach((k, i) => window.setTimeout(() => { const r = binOf(k.qid); if (r >= 0) sort(k.id, r); }, 250 + i * 220));
      }
    }
    if (time.current > 0) setPhase('run');
  }

  // The computer sorts on its own.
  useEffect(() => {
    if (!ctx.cpu || phaseView !== 'run') return;
    const id = window.setInterval(() => {
      if (phase.current !== 'run') return;
      const k = [...cards.current].sort((a, b) => b.y - a.y)[0];
      if (!k || k.y < 0.15) return;
      sort(k.id, cpuBin(binOf(k.qid), bins.current.length, c.current.cpuRight()));
    }, 1300 + Math.random() * 500);
    return () => window.clearInterval(id);
  }, [ctx.cpu, phaseView, ctx.taken]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keys 1, 2, 3 send the lowest (or picked) card to that bin.
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (c.current.cpu) return;
      if ((e.key === ' ' || e.key === 'Enter') && phase.current === 'ready') { e.preventDefault(); go(); return; }
      const n = Number(e.key);
      if (n >= 1 && n <= bins.current.length) tapBin(n - 1);
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  function tapBin(i: number) {
    if (phase.current !== 'run' || c.current.cpu) return;
    const id = selRef.current ?? [...cards.current].sort((a, b) => b.y - a.y)[0]?.id;
    if (id != null) sort(id, i);
  }

  // Tap a card to pick it up; drag it onto a bin.
  function rel(e: RPointerEvent) {
    const r = stage.current!.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  }
  function down(e: RPointerEvent, id: number) {
    if (phase.current !== 'run' || ctx.cpu) return;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    const p = rel(e);
    setDrag({ id, x: p.x, y: p.y, sx: p.x, sy: p.y, moved: false });
  }
  function move(e: RPointerEvent) {
    if (!drag) return;
    const p = rel(e);
    const moved = drag.moved || Math.hypot(p.x - drag.sx, p.y - drag.sy) > 0.02;
    setDrag({ ...drag, x: p.x, y: p.y, moved });
  }
  function up(e: RPointerEvent) {
    if (!drag) return;
    const p = rel(e);
    const d = drag; setDrag(null);
    if (!d.moved) {
      if (until.current.magnet > clock.current) { const k = cards.current.find((v) => v.id === d.id); if (k) sort(k.id, binOf(k.qid)); return; }
      setSelected((s) => (s === d.id ? null : d.id)); c.current.sfx.tap(); return;
    }
    if (p.y > FIELD.top + FIELD.h) { sort(d.id, binAt(p.x, bins.current.length)); return; }
    const k = cards.current.find((v) => v.id === d.id);
    if (k) k.y = Math.max(0, Math.min(0.95, (p.y - FIELD.top) / FIELD.h));
  }

  const n = bins.current.length;
  const on = (k: keyof typeof until.current) => until.current[k] > clock.current;
  const left = Math.max(0, time.current);
  const comboN = combo.current;
  const FIELD_STYLE = { top: `${FIELD.top * 100}%`, height: `${FIELD.h * 100}%` };

  return (
    <div ref={box} className="absolute inset-0 grid place-items-center">
      <div ref={stage} className="relative lab-fit rounded-[calc(var(--u)*4)] border-heavy border-border overflow-hidden touch-none select-none"
        style={{ '--ar': tall ? 0.85 : mid ? 1.2 : 1.5, '--u': tall ? '0.75cqw' : mid ? '0.75cqw' : '1cqh', containerType: 'size', boxShadow: '0 calc(var(--u)*1) 0 #000, 0 calc(var(--u)*3) calc(var(--u)*6) rgba(36,28,61,0.35)' } as CSSProperties}
        onPointerMove={move} onPointerUp={up} onPointerCancel={() => setDrag(null)}>
        <Room still={still} slow={on('slow')} />

        {/* The top strip: clock, combo and what is switched on. */}
        <div className="absolute top-[calc(var(--u)*2)] inset-x-[calc(var(--u)*3)] h-[calc(var(--u)*8)] flex items-center gap-[calc(var(--u)*2)]">
          <span className="w-[calc(var(--u)*8)] h-[calc(var(--u)*8)] rounded-full border-std border-border bg-surface grid place-items-center shrink-0" aria-hidden="true"><Timer weight="fill" className="w-[60%] h-[60%]" /></span>
          <div className="relative flex-1 h-[calc(var(--u)*4)] rounded-full border-std border-border bg-surface overflow-hidden" role="timer" aria-label={`${Math.ceil(left)} seconds left`}>
            <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${Math.min(100, (left / BURST) * 100)}%`, background: left < 6 ? '#e5635f' : left < 12 ? '#f6c544' : '#8fe3a0', transition: 'background 0.3s' }} />
          </div>
          <motion.span key={comboN} className="shrink-0 inline-flex items-center gap-[calc(var(--u)*0.8)] px-[calc(var(--u)*2)] h-[calc(var(--u)*7)] rounded-full border-std border-border font-display text-[calc(var(--u)*4.4)]"
            style={{ background: comboN >= 8 ? '#ef7d96' : comboN >= 4 ? '#f6c544' : '#fbfcf8' }} initial={still || comboN === 0 ? false : { scale: 1.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 12 }}
            aria-label={`Combo ${comboN}`}>
            <Fire weight="fill" className="w-[calc(var(--u)*4.4)] h-[calc(var(--u)*4.4)]" style={{ color: comboN >= 4 ? '#241c3d' : '#7383ad' }} />x{comboN}
            <span className="flex gap-[calc(var(--u)*0.5)] ml-[calc(var(--u)*0.6)]" aria-hidden="true">{[0, 1, 2, 3].map((i) => <span key={i} className="w-[calc(var(--u)*1.6)] h-[calc(var(--u)*1.6)] rounded-full border-thin border-border" style={{ background: i < comboN % 4 ? '#241c3d' : 'transparent' }} />)}</span>
          </motion.span>
          {(['slow', 'magnet', 'double'] as const).filter(on).map((k) => (
            <motion.span key={k} className="shrink-0 w-[calc(var(--u)*7)] h-[calc(var(--u)*7)] [&>svg]:w-full [&>svg]:h-full" initial={still ? false : { scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} title={POWERS.find((p) => p.id === k)?.name}><Art kind={k} /></motion.span>
          ))}
        </div>

        {/* The falling field. */}
        <div className="absolute inset-x-0" style={FIELD_STYLE}>
          {cards.current.map((k) => {
            const dragging = drag?.id === k.id && drag.moved;
            const pick = selected === k.id;
            const style: CSSProperties = dragging
              ? { left: `${drag!.x * 100}%`, top: `${((drag!.y - FIELD.top) / FIELD.h) * 100}%`, zIndex: 5 }
              : { left: `${LANES[k.lane] * 100}%`, top: `${k.y * 100}%` };
            return (
              <motion.button key={k.id} type="button" disabled={phaseView !== 'run' || ctx.cpu}
                className="absolute w-[22%] min-h-[calc(var(--u)*11)] rounded-[calc(var(--u)*2)] border-std border-border bg-surface px-[calc(var(--u)*1.6)] py-[calc(var(--u)*1)] font-bold leading-tight text-balance cursor-grab disabled:cursor-default"
                style={{ ...style, x: '-50%', y: '-50%', fontSize: `calc(var(--u)*${k.text.length > 24 ? 2.6 : k.text.length > 12 ? 3.4 : 4.4})`, boxShadow: pick ? '0 0 0 calc(var(--u)*0.9) #fdfd94, 0 calc(var(--u)*1.2) 0 #000' : '0 calc(var(--u)*0.7) 0 #000', background: k.extra ? '#e9f7ff' : undefined }}
                onPointerDown={(e) => down(e, k.id)}
                initial={still ? false : { scale: 0.2, opacity: 0 }} animate={{ scale: pick || dragging ? 1.12 : 1, opacity: 1, rotate: k.shake && !still ? [0, -10, 10, -6, 0] : still ? 0 : ((k.id % 5) - 2) * 1.5 }}
                transition={{ type: 'spring', stiffness: 380, damping: 16 }} whileHover={still || ctx.cpu ? undefined : { scale: 1.08 }}
                aria-label={`Card: ${k.text}`}>
                {k.text}
              </motion.button>
            );
          })}
          {/* Sorted cards fly into their bin. */}
          {flyers.map((f) => (
            <motion.span key={`f${f.id}`} className="absolute z-20 w-[22%] min-h-[calc(var(--u)*11)] rounded-[calc(var(--u)*2)] border-std border-border bg-surface grid place-items-center font-bold text-[calc(var(--u)*3.4)] pointer-events-none" style={{ x: '-50%', y: '-50%' }}
              initial={{ left: `${LANES[f.lane] * 100}%`, top: `${f.y * 100}%`, scale: 1, rotate: 0 }} animate={{ left: `${((f.bin + 0.5) / n) * 100}%`, top: '118%', scale: 0.5, rotate: still ? 0 : 200, opacity: [1, 1, 0] }}
              transition={{ duration: 0.55, ease: 'easeIn' }}>{f.text}</motion.span>
          ))}
          {fx?.kind === 'clear' && !still && (
            <motion.span key={fx.id} className="absolute top-[30%] w-[20%] [&>svg]:w-full pointer-events-none" initial={{ left: '-20%', rotate: -20 }} animate={{ left: '110%', rotate: [-20, 10, -20, 10] }} transition={{ duration: 1.4 }}><Art kind="clear" /></motion.span>
          )}
        </div>

        {/* The bins. */}
        <div className="absolute inset-x-[calc(var(--u)*2)] bottom-[calc(var(--u)*2)] grid gap-[calc(var(--u)*2)]" style={{ top: `${(FIELD.top + FIELD.h) * 100 + 1}%`, gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
          {bins.current.map((b, i) => (
            <motion.button key={b.key} layout={!still} type="button" onClick={() => tapBin(i)} disabled={phaseView !== 'run' || ctx.cpu}
              className="relative rounded-[calc(var(--u)*2.5)] border-bold border-border grid grid-rows-[auto_1fr] overflow-hidden disabled:cursor-default"
              style={{ background: b.color, boxShadow: '0 calc(var(--u)*0.9) 0 #000, inset 0 calc(var(--u)*-2) 0 rgba(0,0,0,0.12)' }}
              initial={still ? false : { y: 60, opacity: 0 }}
              animate={shakeBin?.i === i && !still ? { x: [0, -10, 10, -6, 0], y: 0, opacity: 1 } : { y: 0, opacity: 1, x: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 16 }} whileHover={still || ctx.cpu ? undefined : { scale: 1.03 }} whileTap={{ scale: 0.97 }}
              aria-label={`Bin ${i + 1}: ${b.q.prompt}`}>
              <span className="h-[calc(var(--u)*3.4)] mx-[calc(var(--u)*2)] mt-[calc(var(--u)*1.2)] rounded-full bg-[#241c3d]/60" style={{ boxShadow: 'inset 0 calc(var(--u)*0.8) 0 rgba(0,0,0,0.35)' }} aria-hidden="true" />
              <span className="m-[calc(var(--u)*1.6)] rounded-[calc(var(--u)*1.6)] border-std border-border bg-surface px-[calc(var(--u)*1.6)] py-[calc(var(--u)*1)] font-bold leading-snug text-balance grid place-items-center"
                style={{ fontSize: `calc(var(--u)*${b.q.prompt.length > 70 ? 2.4 : b.q.prompt.length > 34 ? 3 : 3.8})` }}>{b.q.prompt}</span>
              {on('magnet') && !still && <motion.span className="absolute -top-[calc(var(--u)*0.5)] left-1/2 -translate-x-1/2 w-[calc(var(--u)*7)] [&>svg]:w-full" animate={{ y: [0, -6, 0] }} transition={{ duration: 0.6, repeat: Infinity }}><Art kind="magnet" /></motion.span>}
              <AnimatePresence>
                {pops.filter((p) => p.bin === i).map((p) => (
                  <motion.span key={p.id} className="absolute left-1/2 top-[20%] -translate-x-1/2 font-display text-[calc(var(--u)*6)] pointer-events-none" style={{ color: p.good ? '#fdfd94' : '#ffd2c2', WebkitTextStroke: 'calc(var(--u)*0.5) #000', paintOrder: 'stroke fill' }}
                    initial={{ y: 0, opacity: 0, scale: 0.4 }} animate={{ y: '-160%', opacity: [0, 1, 1, 0], scale: 1.2 }} transition={{ duration: 1 }} onAnimationComplete={() => setPops((l) => l.filter((x) => x.id !== p.id))}>{p.text}</motion.span>
                ))}
              </AnimatePresence>
            </motion.button>
          ))}
        </div>

        {/* Ready: one big Go! */}
        <AnimatePresence>
          {phaseView === 'ready' && (
            <motion.div key="ready" className="absolute inset-x-0 grid place-items-center gap-[calc(var(--u)*3)] z-10" style={FIELD_STYLE} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: still ? 1 : 1.3 }}>
              <div className="flex items-center gap-[calc(var(--u)*2)] font-bold text-[calc(var(--u)*4)] rounded-full bg-surface border-std border-border px-[calc(var(--u)*3)] py-[calc(var(--u)*1)]" style={{ boxShadow: '0 calc(var(--u)*0.6) 0 #000' }}>
                <HandTap weight="fill" className="w-[calc(var(--u)*5)] h-[calc(var(--u)*5)]" aria-hidden="true" /> Card <span aria-hidden="true">→</span> <Tray weight="fill" className="w-[calc(var(--u)*5)] h-[calc(var(--u)*5)]" aria-hidden="true" /> Bin
              </div>
              <motion.button type="button" onClick={go} disabled={ctx.cpu} className="min-w-[calc(var(--u)*34)] min-h-[calc(var(--u)*16)] rounded-full border-heavy border-border bg-accent font-display text-[calc(var(--u)*9)] disabled:cursor-default"
                style={{ boxShadow: '0 calc(var(--u)*1) 0 #000' }} animate={still ? undefined : { scale: [1, 1.07, 1] }} transition={{ duration: 1, repeat: Infinity }} whileHover={still ? undefined : { scale: 1.1 }} whileTap={{ scale: 0.94 }}>
                Go!
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const FIELD = { top: 0.13, h: 0.55 };

// The sorting room: a back wall, pipes and four chutes the cards drop from.
function Room({ still, slow }: { still: boolean; slow: boolean }) {
  return (
    <svg viewBox="0 0 300 200" preserveAspectRatio="none" className="absolute inset-0 w-full h-full" aria-hidden="true">
      <defs>
        <linearGradient id="sr-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#c9d2ff" /><stop offset="1" stopColor="#e9eefe" /></linearGradient>
      </defs>
      <rect width="300" height="200" fill="url(#sr-wall)" />
      {Array.from({ length: 9 }, (_, i) => <path key={i} d={`M0 ${30 + i * 18}H300`} stroke="#b4c4fb" strokeWidth="0.8" />)}
      {Array.from({ length: 30 }, (_, i) => <path key={`v${i}`} d={`M${(i * 23 + (Math.floor(i / 6) % 2) * 11) % 300} ${30 + (i % 9) * 18}v18`} stroke="#b4c4fb" strokeWidth="0.8" />)}
      <path d="M8 26V200M292 26V200" stroke="#6aa9e9" strokeWidth="5" />
      <path d="M8 26V200M292 26V200" stroke="#000" strokeWidth="0.8" strokeDasharray="0.1 30" strokeLinecap="round" />
      {LANES.map((x) => (
        <g key={x}>
          <rect x={x * 300 - 16} y="14" width="32" height="14" rx="3" fill="#241c3d" stroke="#000" strokeWidth="1" />
          <rect x={x * 300 - 19} y="25" width="38" height="5" rx="2" fill="#3b2f66" stroke="#000" strokeWidth="1" />
          {!still && <motion.circle cx={x * 300 + 11} cy="20" r="1.8" fill="#8fe3a0" animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.1, repeat: Infinity, delay: x }} />}
        </g>
      ))}
      <rect y="134" width="300" height="66" fill="#7d8be0" />
      <path d="M0 134H300" stroke="#000" strokeWidth="1.2" />
      {slow && <rect width="300" height="200" fill="#7fd6e3" opacity="0.18" />}
    </svg>
  );
}

// Height over width of the board's box: tall boxes stack, middling ones get a squarer board.
function useShape(ref: RefObject<HTMLDivElement | null>) {
  const [shape, setShape] = useState(0.6);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setShape(e.contentRect.height / Math.max(1, e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return shape;
}

function Art({ kind }: { kind: string }) {
  const ring = (fill: string) => <circle cx="50" cy="50" r="44" fill={fill} stroke="#000" strokeWidth="5" />;
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      {kind === 'slow' && <>{ring('#c9ecff')}<circle cx="50" cy="52" r="26" fill="#fbfcf8" stroke="#000" strokeWidth="4.5" /><path d="M50 52V36M50 52l10 6" stroke="#000" strokeWidth="5" strokeLinecap="round" /><path d="M22 30q-6 10-2 22M78 30q6 10 2 22" stroke="#6aa9e9" strokeWidth="4" fill="none" strokeLinecap="round" /></>}
      {kind === 'magnet' && <>{ring('#fdfd94')}<path d="M28 30v22a22 22 0 0 0 44 0V30H58v22a8 8 0 0 1-16 0V30z" fill="#e5635f" stroke="#000" strokeWidth="4.5" strokeLinejoin="round" /><rect x="28" y="26" width="14" height="10" fill="#e9eefe" stroke="#000" strokeWidth="4" /><rect x="58" y="26" width="14" height="10" fill="#e9eefe" stroke="#000" strokeWidth="4" /></>}
      {kind === 'clear' && <>{ring('#c8f0dc')}<path d="M64 18L42 58" stroke="#8a5a3b" strokeWidth="7" strokeLinecap="round" /><path d="M30 54l22 10-6 18H22z" fill="#f6c544" stroke="#000" strokeWidth="4" strokeLinejoin="round" /><path d="M28 70l-2 10M36 72l-2 10M44 74l-2 8" stroke="#000" strokeWidth="3" /></>}
      {kind === 'double' && <>{ring('#fff6b0')}<text x="50" y="64" textAnchor="middle" fontSize="38" fontWeight="900" fontFamily="sans-serif" stroke="#000" strokeWidth="2" fill="#f6c544">x2</text></>}
      {kind === 'time' && <>{ring('#e9eefe')}<circle cx="46" cy="54" r="24" fill="#fbfcf8" stroke="#000" strokeWidth="4.5" /><path d="M46 54V40M46 54l10 0" stroke="#000" strokeWidth="5" strokeLinecap="round" /><rect x="40" y="22" width="12" height="8" rx="2" fill="#000" /><text x="76" y="40" textAnchor="middle" fontSize="20" fontWeight="900" fontFamily="sans-serif" fill="#1f7a45">+8</text></>}
      {kind === 'flurry' && <>{ring('#f5a08c')}{[[30, 30, -14], [56, 24, 10], [40, 56, 6], [64, 52, -10]].map(([x, y, r], i) => <rect key={i} x={x - 10} y={y - 7} width="20" height="14" rx="3" fill="#fbfcf8" stroke="#000" strokeWidth="3.5" transform={`rotate(${r} ${x} ${y})`} />)}<path d="M20 76q30-10 60 0" stroke="#000" strokeWidth="3.5" fill="none" strokeLinecap="round" /></>}
      {kind === 'shuffle' && <>{ring('#b4c4fb')}<rect x="20" y="52" width="22" height="24" rx="3" fill="#8fe3a0" stroke="#000" strokeWidth="4" /><rect x="58" y="52" width="22" height="24" rx="3" fill="#f5a08c" stroke="#000" strokeWidth="4" /><path d="M30 44q20-24 40 0M66 36l4 8-9 1M34 36l-4 8 9 1" stroke="#000" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></>}
    </svg>
  );
}

function Cover() {
  return (
    <svg viewBox="0 0 300 186" preserveAspectRatio="xMidYMid slice">
      <rect width="300" height="186" fill="#dfe4ff" />
      {LANES.map((x) => <rect key={x} x={x * 300 - 16} y="8" width="32" height="12" rx="3" fill="#241c3d" stroke="#000" strokeWidth="1" />)}
      <rect y="122" width="300" height="64" fill="#7d8be0" />
      {[[0.14, 40, -6, '4 x 2'], [0.62, 64, 5, '8'], [0.86, 30, -3, 'Ocean']].map(([x, y, r, t], i) => (
        <g key={i} transform={`rotate(${r} ${(x as number) * 300} ${y})`}><rect x={(x as number) * 300 - 30} y={(y as number) - 12} width="60" height="24" rx="5" fill="#fbfcf8" stroke="#000" strokeWidth="2" /><text x={(x as number) * 300} y={(y as number) + 5} textAnchor="middle" fontSize="13" fontWeight="800" fontFamily="sans-serif">{t as string}</text></g>
      ))}
      {['#f5a08c', '#8fe3a0', '#fdfd94'].map((col, i) => <g key={col}><rect x={10 + i * 96} y="110" width="88" height="68" rx="9" fill={col} stroke="#000" strokeWidth="2.5" /><rect x={18 + i * 96} y="118" width="72" height="28" rx="5" fill="#fbfcf8" stroke="#000" strokeWidth="1.8" /><rect x={30 + i * 96} y="128" width="48" height="6" rx="3" fill="#cdd7fb" /></g>)}
    </svg>
  );
}

const def: LabDef = {
  id: 'sort-rush',
  name: 'Sort Rush',
  description: 'Answer cards slide down the chutes. Sort each card into the bin of the question it answers before the clock runs out!',
  ways: ['teams', 'solo'],
  how: [
    { icon: <HandTap weight="fill" />, text: 'Tap a card (or drag it)' },
    { icon: <Tray weight="fill" />, text: 'Tap the bin of its question' },
    { icon: <Fire weight="fill" />, text: 'Sort in a row for a combo' },
  ],
  rounds: { label: 'Rounds', min: 1, max: 10, default: 3 },
  powers: POWERS,
  background: 'radial-gradient(120% 90% at 50% 0%, #dbe6ff 0%, #b4c4fb 55%, #93a5ee 100%)',
  cover: <Cover />,
  pieces: [
    { id: 'background', label: 'Background', hint: 'Behind the sorting room' },
    { id: 'room', label: 'Sorting room', hint: 'The back wall, pipes and floor' },
    { id: 'chute', label: 'Chute', hint: 'Where the cards come out' },
    { id: 'card', label: 'Answer card', hint: 'One falling card' },
    ...BIN_COLORS.map((_, i) => ({ id: `bin-${i + 1}`, label: `Bin ${i + 1}`, hint: 'A bin with its question sign' })),
    ...POWERS.map((p) => ({ id: `power-${p.id}`, label: p.name, hint: p.desc })),
  ],
  Play,
};
export default def;
