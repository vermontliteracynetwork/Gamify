import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle, HandTap, X as XIcon } from '@phosphor-icons/react';
import type { MultipleChoiceQuestion } from '../../../data/types';
import { TeamBadge } from '../../../engine/TeamBadge';
import type { LabCtx, LabDef, LabPower } from '../../types';
import { buildBoard, cpuPick, decoys, shuffle, type Pick, type Slot } from './board';

// Survey Showdown (Game Lab, inspired by TV survey shows): every board is
// built from one question. Its answers hide behind panels; the right answer
// is the top answer, worth the most. Teams answer a question to earn a pick,
// then tap an answer from the list. Not on the board (or a wrong answer) is a
// big red X; three strikes and the next team gets one pick to steal.

const POWERS: LabPower[] = [
  { id: 'reveal', name: 'Free Reveal', desc: 'A panel flips over for your team.', enter: 'spin', art: <Art kind="reveal" /> },
  { id: 'shield', name: 'Steal Shield', desc: 'Your next strike bounces off.', enter: 'drop', art: <Art kind="shield" /> },
  { id: 'double', name: 'Double Board', desc: 'Your next answer is worth two times the points.', enter: 'zoom', art: <Art kind="double" /> },
  { id: 'eraser', name: 'Strike Eraser', desc: 'Rub one strike off the board.', enter: 'wiggle', art: <Art kind="eraser" /> },
  { id: 'peek', name: 'Audience Peek', desc: 'The crowd boos the answers that are not on the board.', enter: 'zoom', art: <Art kind="peek" /> },
  { id: 'mic', name: 'Golden Mic', desc: 'Three bonus points. Mic drop!', enter: 'drop', art: <Art kind="mic" /> },
  { id: 'buzzer', name: 'Buzzer Mixup', desc: 'Honk! The answer list jumbles up.', silly: true, art: <Art kind="buzzer" /> },
  { id: 'chicken', name: 'Rubber Chicken', desc: 'Squawk! The chicken gives the next team one point.', silly: true, art: <Art kind="chicken" /> },
];

interface Board { q: MultipleChoiceQuestion; slots: Slot[]; list: Pick[] }
type Mode = 'wait' | 'pick' | 'busy';

function Play({ ctx }: { ctx: LabCtx }) {
  const c = useRef(ctx); c.current = ctx;
  const [board, setBoard] = useState<Board | null>(null);
  const boardRef = useRef(board); boardRef.current = board;
  const [open, setOpen] = useState<boolean[]>([]);
  const openRef = useRef(open); openRef.current = open;
  const [used, setUsed] = useState<string[]>([]);
  const usedRef = useRef(used); usedRef.current = used;
  const [strikes, setStrikes] = useState(0);
  const strikesRef = useRef(0); strikesRef.current = strikes;
  const [steal, setSteal] = useState(false);
  const stealRef = useRef(false); stealRef.current = steal;
  const [mode, setMode] = useState<Mode>('wait');
  const [bigX, setBigX] = useState(0);
  const [gen, setGen] = useState(0);
  const [booed, setBooed] = useState(false);
  const [order, setOrder] = useState<string[]>([]);
  const [fx, setFx] = useState<{ kind: string; id: number } | null>(null);
  const [float, setFloat] = useState<{ i: number; n: number; id: number } | null>(null);
  const topFound = useRef(false);
  const perks = useRef<Record<string, { shield?: LabPower; double?: LabPower }>>({});
  const box = useRef<HTMLDivElement>(null);
  const tall = useTall(box);

  function syncHeld(id: string) {
    const p = perks.current[id] ?? {};
    c.current.setHeld(id, [p.shield, p.double].filter(Boolean) as LabPower[]);
  }

  function newBoard() {
    const x = c.current;
    let q = x.draw();
    for (let k = 0; k < 6 && q.choices.filter((s) => s.trim()).length < 2; k++) q = x.draw();
    const slots = buildBoard(q.choices, q.correctIndex);
    const others: string[] = [];
    for (let k = 0; k < 3; k++) { const o = x.draw(); if (o.id !== q.id) others.push(...o.choices); }
    const fake = decoys(others, slots, 2);
    const list = shuffle([...slots.map((s) => ({ text: s.text, real: true })), ...fake.map((t) => ({ text: t, real: false }))]);
    const b = { q, slots, list };
    setBoard(b); boardRef.current = b;
    const o = slots.map(() => false); setOpen(o); openRef.current = o;
    setUsed([]); usedRef.current = [];
    setStrikes(0); strikesRef.current = 0;
    setSteal(false); stealRef.current = false;
    setBooed(false); setOrder(list.map((p) => p.text));
    topFound.current = false;
    setGen((g) => g + 1);
    x.sfx.slideUp();
  }

  // The board is done: flip what is left, count the top answer for review.
  function endBoard(delay = 2400) {
    const b = boardRef.current; if (!b) return;
    if (!topFound.current) c.current.log(b.q, false);
    window.setTimeout(() => { const o = b.slots.map(() => true); setOpen(o); openRef.current = o; c.current.sfx.whoosh(); }, 700);
    window.setTimeout(() => { boardRef.current = null; if (c.current.next()) setBoard(null); }, delay + 700);
  }

  // Every turn: a question first; right earns one pick.
  useEffect(() => {
    let live = true;
    const x = c.current;
    if (!boardRef.current) newBoard();
    setMode('wait');
    if (stealRef.current) x.say('Steal!', 'big');
    void x.ask().then(async (ok) => {
      if (!live) return;
      if (!ok) { strike(true); return; }
      const p = await c.current.power(0.45, (pw) => {
        const b = boardRef.current, o = openRef.current;
        if (pw.id === 'reveal') return !stealRef.current && o.filter((v) => !v).length > 1;
        if (pw.id === 'eraser') return strikesRef.current > 0 && !stealRef.current;
        if (pw.id === 'peek') return !!b && b.list.some((l) => !l.real && !usedRef.current.includes(l.text));
        if (pw.id === 'chicken') return c.current.turns.players.length > 1;
        return true;
      });
      if (!live) return;
      if (p) await fire(p);
      if (!live || !boardRef.current) return;
      setMode('pick');
    });
    return () => { live = false; };
  }, [ctx.taken]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fire(p: LabPower) {
    const x = c.current, me = x.player.id;
    setFx({ kind: p.id, id: Date.now() });
    const wait = (ms: number) => new Promise((r) => window.setTimeout(r, ms));
    if (p.id === 'reveal') {
      x.sfx.whoosh(); await wait(900);
      const b = boardRef.current; if (!b) return;
      const hidden = b.slots.map((_, i) => (openRef.current[i] ? -1 : i)).filter((i) => i >= 0);
      const i = hidden[hidden.length - 1];
      flip(i, me, 1);
      await wait(900);
    }
    if (p.id === 'shield') { perks.current[me] = { ...perks.current[me], shield: p }; syncHeld(me); x.sfx.bump(); }
    if (p.id === 'double') { perks.current[me] = { ...perks.current[me], double: p }; syncHeld(me); x.sfx.coin(); }
    if (p.id === 'eraser') { x.sfx.swish(); await wait(700); setStrikes((n) => Math.max(0, n - 1)); strikesRef.current = Math.max(0, strikesRef.current - 1); x.say('Erased!'); }
    if (p.id === 'peek') { x.sfx.oops(); setBooed(true); x.say('Boo!', 'oops'); }
    if (p.id === 'mic') { x.points(3); x.sfx.thud(); x.burst(0.5, 0.35); x.say('Mic drop!'); }
    if (p.id === 'buzzer') { x.sfx.zap(); await wait(200); setOrder((o) => shuffle(o)); x.sfx.boing(); }
    if (p.id === 'chicken') {
      x.sfx.boing();
      const s = x.turns, idx = s.players.findIndex((pl) => pl.id === me);
      const nextP = s.players[(idx + 1) % s.players.length];
      await wait(900); x.points(1, nextP.id); x.say('Squawk!', 'oops');
    }
  }

  // A panel flips over and its points go to a team.
  function flip(i: number, to: string, times: number) {
    const b = boardRef.current; if (!b || openRef.current[i]) return;
    const o = [...openRef.current]; o[i] = true; setOpen(o); openRef.current = o;
    const pts = b.slots[i].points * times;
    c.current.points(pts, to);
    setFloat({ i, n: pts, id: Date.now() });
    c.current.sfx.bell(); window.setTimeout(() => c.current.sfx.coin(), 200);
    if (b.slots[i].top && !topFound.current) { topFound.current = true; c.current.log(b.q, true); c.current.say('Top answer!', 'big'); c.current.burst(0.45, 0.35, 'big'); }
  }

  function strike(fromQuestion = false) {
    const x = c.current, me = x.player.id;
    setMode('busy');
    const shield = perks.current[me]?.shield;
    if (shield && !fromQuestion) {
      perks.current[me] = { ...perks.current[me], shield: undefined }; syncHeld(me);
      x.sfx.bump(); x.say('Shield!');
      setFx({ kind: 'shield', id: Date.now() });
      window.setTimeout(() => c.current.next(), 1400);
      return;
    }
    setBigX((n) => n + 1);
    x.sfx.wrong(); window.setTimeout(() => c.current.sfx.crash(), 120);
    if (stealRef.current) {
      window.setTimeout(() => { c.current.say('No steal!', 'oops'); endBoard(); }, 900);
      return;
    }
    const n = strikesRef.current + 1; setStrikes(n); strikesRef.current = n;
    if (n >= 3 && x.turns.players.length > 1) {
      setSteal(true); stealRef.current = true;
      window.setTimeout(() => c.current.next(), 1800);
      return;
    }
    if (n >= 3) { endBoard(); return; }
    window.setTimeout(() => c.current.next(), 1500);
  }

  function pick(text: string) {
    const x = c.current, b = boardRef.current;
    if (!b || mode !== 'pick' || usedRef.current.includes(text)) return;
    const u = [...usedRef.current, text]; setUsed(u); usedRef.current = u;
    const i = b.slots.findIndex((s) => s.text === text);
    if (i < 0 || openRef.current[i]) { strike(); return; }
    setMode('busy');
    const me = x.player.id;
    const dbl = perks.current[me]?.double;
    if (dbl) { perks.current[me] = { ...perks.current[me], double: undefined }; syncHeld(me); }
    const times = (dbl ? 2 : 1) * (stealRef.current ? 2 : 1);
    flip(i, me, times);
    if (stealRef.current) {
      x.say('Stolen!', 'big'); x.sfx.cheer(); x.burst(0.5, 0.4, 'big');
      endBoard(2600);
      return;
    }
    if (openRef.current.every(Boolean)) {
      x.points(5); x.sfx.cheer(); x.say('Board cleared!', 'big'); x.burst(0.5, 0.4, 'big');
      endBoard(2400);
      return;
    }
    window.setTimeout(() => c.current.next(), 1800);
  }

  // The computer picks on its own, after a little think.
  useEffect(() => {
    if (!ctx.cpu || mode !== 'pick' || !board) return;
    const id = window.setTimeout(() => {
      pick(cpuPick(board.list, usedRef.current, board.slots, openRef.current, c.current.cpuRight()));
    }, 1800 + Math.random() * 1000);
    return () => window.clearTimeout(id);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const still = ctx.still;
  const b = board;
  const n = b?.slots.length ?? 4;
  const cols = n > 3 ? 2 : 1;
  const prompt = b?.q.prompt ?? '';
  const pSize = prompt.length > 110 ? 3.2 : prompt.length > 60 ? 4 : 5;
  const canPick = mode === 'pick' && !ctx.cpu;
  const listed = order.map((t) => b?.list.find((p) => p.text === t)).filter(Boolean) as Pick[];

  return (
    <div ref={box} className="absolute inset-0 grid place-items-center">
      <motion.div className="relative lab-fit" style={{ '--ar': tall ? 0.85 : 1.55, '--u': tall ? '0.7cqw' : '1cqh', containerType: 'size' } as CSSProperties}
        key={`x${bigX}`} animate={bigX && !still ? { x: [0, -12, 10, -6, 0] } : undefined} transition={{ duration: 0.45 }}>
        {/* The studio: a navy stage with twinkling marquee lights. */}
        <div className="absolute inset-0 rounded-[calc(var(--u)*4)] border-heavy border-border overflow-hidden" style={{ background: 'radial-gradient(120% 80% at 50% 0%, #3b2f66 0%, #241c3d 70%)', boxShadow: '0 calc(var(--u)*1) 0 #000, 0 calc(var(--u)*3) calc(var(--u)*6) rgba(36,28,61,0.4)' }}>
          <Spotlights still={still} />
          <Bulbs still={still} />
        </div>

        <div className={`absolute inset-[calc(var(--u)*4)] grid gap-[calc(var(--u)*2.2)] ${tall ? 'grid-rows-[auto_1fr_auto_auto]' : 'grid-rows-[auto_1fr_auto]'}`}>
          {/* The survey question. */}
          <motion.div key={`q${gen}`} className="relative rounded-[calc(var(--u)*2.5)] border-bold border-border bg-surface px-[calc(var(--u)*3)] py-[calc(var(--u)*1.6)] text-center" style={{ boxShadow: '0 calc(var(--u)*0.8) 0 #000' }}
            initial={still ? false : { y: -40, opacity: 0, scale: 0.9 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}>
            <p className="m-0 font-bold uppercase tracking-wider text-muted text-[calc(var(--u)*2.6)]">We asked 100 kids</p>
            <p className="m-0 font-bold leading-snug text-balance" style={{ fontSize: `calc(var(--u)*${pSize})` }}>{prompt}</p>
          </motion.div>

          <div className={`grid gap-[calc(var(--u)*2.5)] min-h-0 ${tall ? 'grid-cols-1 grid-rows-[1fr_auto]' : 'grid-cols-[1fr_auto]'}`}>
            {/* The board with its hidden answers. */}
            <div className="relative rounded-[calc(var(--u)*3)] border-bold border-border p-[calc(var(--u)*2)] grid gap-[calc(var(--u)*1.6)] min-h-0"
              style={{ background: 'linear-gradient(180deg, #6aa9e9, #3f6fc2)', boxShadow: 'inset 0 0 0 calc(var(--u)*0.8) #fdfd94, 0 calc(var(--u)*0.8) 0 #000', gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridAutoRows: '1fr' }}
              aria-label="Survey board">
              {b?.slots.map((s, i) => (
                <SlotPanel key={`${gen}-${i}`} slot={s} open={open[i]} i={i} still={still} float={float?.i === i ? float : null} />
              ))}
              <AnimatePresence>
                {fx?.kind === 'double' && !still && (
                  <motion.span key={fx.id} className="absolute inset-0 grid place-items-center pointer-events-none font-display text-[calc(var(--u)*22)] text-[#f6c544]" style={{ WebkitTextStroke: 'calc(var(--u)*0.8) #000', paintOrder: 'stroke fill' }}
                    initial={{ scale: 3, opacity: 0, rotate: -20 }} animate={{ scale: [3, 1, 1.1, 1], opacity: [0, 1, 1, 0], rotate: -8 }} transition={{ duration: 1.6 }}>x2</motion.span>
                )}
                {fx?.kind === 'reveal' && !still && (
                  <motion.span key={fx.id} className="absolute inset-y-0 w-[30%] pointer-events-none" style={{ background: 'radial-gradient(closest-side, rgba(253,253,148,0.75), transparent)' }}
                    initial={{ left: '-30%' }} animate={{ left: ['-30%', '100%', '40%'] }} transition={{ duration: 1.2 }} exit={{ opacity: 0 }} />
                )}
              </AnimatePresence>
            </div>
            {/* Three strikes and the steal sign. */}
            <div className={`grid gap-[calc(var(--u)*1.6)] content-center justify-items-center ${tall ? 'grid-flow-col auto-cols-max justify-center' : ''}`} aria-label={`${strikes} of 3 strikes`}>
              {[0, 1, 2].map((k) => (
                <div key={k} className="relative w-[calc(var(--u)*11)] h-[calc(var(--u)*11)] rounded-[calc(var(--u)*2)] border-bold border-border grid place-items-center" style={{ background: k < strikes ? '#e5635f' : '#3b2f66', boxShadow: '0 calc(var(--u)*0.6) 0 #000' }}>
                  <AnimatePresence>
                    {k < strikes && (
                      <motion.span key="x" initial={still ? false : { scale: 3, rotate: -40, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} exit={still ? { opacity: 0 } : { scale: 0, rotate: 90, opacity: 0 }} transition={{ type: 'spring', stiffness: 380, damping: 14 }}>
                        <XIcon weight="bold" className="w-[calc(var(--u)*8)] h-[calc(var(--u)*8)] text-white" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {fx?.kind === 'eraser' && k === strikes && !still && (
                    <motion.span key={fx.id} className="absolute w-[calc(var(--u)*9)] [&>svg]:w-full pointer-events-none" initial={{ x: -30, rotate: -20 }} animate={{ x: [-20, 20, -20, 20, 0], rotate: [-20, 10, -20, 10, 0], opacity: [1, 1, 1, 1, 0] }} transition={{ duration: 1 }}><Art kind="eraser" /></motion.span>
                  )}
                </div>
              ))}
              <AnimatePresence>
                {steal && (
                  <motion.span key="steal" className="font-display text-[calc(var(--u)*4.6)] px-[calc(var(--u)*2)] py-[calc(var(--u)*0.6)] rounded-full border-std border-border bg-accent inline-flex items-center gap-[calc(var(--u)*1)]"
                    initial={still ? false : { scale: 0, rotate: -20 }} animate={{ scale: [1, 1.08, 1], rotate: 0 }} transition={{ scale: { duration: 1, repeat: Infinity }, rotate: { type: 'spring' } }}>
                    <TeamBadge colorIndex={ctx.player.colorIndex} size={22} />Steal
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* The answers to pick from. */}
          <div className="grid grid-cols-3 gap-[calc(var(--u)*1.6)]" aria-label="Answers to pick">
            {listed.map((p, i) => {
              const done = used.includes(p.text);
              const onBoard = b?.slots.findIndex((s) => s.text === p.text) ?? -1;
              const hit = done && onBoard >= 0;
              const boo = booed && !p.real;
              return (
                <motion.button key={`${gen}-${p.text}`} layout={!still} type="button" disabled={!canPick || done || (onBoard >= 0 && open[onBoard])} onClick={() => pick(p.text)}
                  className={`relative min-h-[calc(var(--u)*10)] rounded-[calc(var(--u)*2)] border-std border-border px-[calc(var(--u)*1.5)] font-bold leading-tight text-balance disabled:cursor-default ${hit || (onBoard >= 0 && open[onBoard]) ? 'bg-[#9fe7a0]' : done ? 'bg-[#f5a08c] line-through decoration-[0.2em]' : boo ? 'bg-[#cdd7fb] text-[#7383ad]' : 'bg-surface'}`}
                  style={{ fontSize: `calc(var(--u)*${p.text.length > 28 ? 2.6 : p.text.length > 12 ? 3.4 : 4.4})`, boxShadow: done ? 'none' : '0 calc(var(--u)*0.6) 0 #000' }}
                  initial={still ? false : { y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1, rotate: fx?.kind === 'buzzer' && !still ? [0, -8, 8, 0] : 0 }} transition={{ type: 'spring', stiffness: 260, damping: 18, delay: i * 0.05 }}
                  whileHover={canPick && !done && !still ? { scale: 1.05 } : undefined} whileTap={canPick && !done ? { scale: 0.95 } : undefined}>
                  {p.text}
                  {boo && <motion.span className="absolute -top-[calc(var(--u)*1.6)] -right-[calc(var(--u)*1)] font-display text-[calc(var(--u)*3)] px-[calc(var(--u)*1)] rounded-full border-thin border-border bg-[#f5a08c] text-black" initial={still ? false : { scale: 0, rotate: 30 }} animate={{ scale: 1, rotate: 8 }}>Boo</motion.span>}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* The big red X. */}
        <AnimatePresence>
          {bigX > 0 && (
            <motion.div key={bigX} className="absolute inset-0 grid place-items-center pointer-events-none z-10" initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ delay: 0.9, duration: 0.4 }}>
              <motion.svg viewBox="0 0 100 100" className="w-[46%] h-[46%]" initial={still ? false : { scale: 2.6, rotate: -25 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 12 }} aria-hidden="true">
                <path d="M18 18L82 82M82 18L18 82" stroke="#000" strokeWidth="26" strokeLinecap="round" />
                <path d="M18 18L82 82M82 18L18 82" stroke="#e5635f" strokeWidth="16" strokeLinecap="round" />
              </motion.svg>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Power-up moments on the stage. */}
        <AnimatePresence>
          {fx && !still && ['mic', 'chicken', 'shield', 'peek'].includes(fx.kind) && (
            <motion.span key={fx.id} className="absolute z-10 w-[22%] [&>svg]:w-full pointer-events-none"
              initial={fx.kind === 'chicken' ? { left: '-25%', top: '55%' } : { left: '39%', top: '-30%', rotate: -30 }}
              animate={fx.kind === 'chicken' ? { left: '105%', top: ['55%', '40%', '55%', '40%', '55%'], rotate: [0, 15, -15, 15, 0] } : { top: ['-30%', '30%', '26%', '30%'], rotate: [-30, 10, -5, 0], opacity: [1, 1, 1, 0] }}
              transition={{ duration: fx.kind === 'chicken' ? 1.8 : 1.5 }} onAnimationComplete={() => setFx(null)}>
              <Art kind={fx.kind} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function SlotPanel({ slot, open, i, still, float }: { slot: Slot; open: boolean; i: number; still: boolean; float: { n: number; id: number } | null }) {
  return (
    <div className="relative min-h-0" style={{ perspective: '60em' }}>
      <motion.div className="absolute inset-0" style={{ transformStyle: 'preserve-3d' }} initial={still ? false : { rotateX: -90, opacity: 0 }}
        animate={{ rotateX: open ? 180 : 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 140, damping: 15, delay: open ? 0 : i * 0.08 }}>
        {/* Hidden face */}
        <div className="absolute inset-0 rounded-[calc(var(--u)*1.8)] border-std border-border grid place-items-center" style={{ backfaceVisibility: 'hidden', background: 'linear-gradient(180deg, #2f4f9e, #22397a)', boxShadow: 'inset 0 calc(var(--u)*0.5) 0 rgba(255,255,255,0.25)' }}>
          <svg viewBox="0 0 40 40" className="h-[60%] max-h-[calc(var(--u)*8)]" aria-hidden="true"><path d="M20 4l4.6 10 10.8 1-8.2 7.2 2.6 10.6L20 27l-9.8 5.8 2.6-10.6L4.6 15l10.8-1z" fill="#fdfd94" stroke="#000" strokeWidth="2" strokeLinejoin="round" /></svg>
        </div>
        {/* Answer face */}
        <div className="absolute inset-0 rounded-[calc(var(--u)*1.8)] border-std border-border flex items-stretch overflow-hidden" style={{ backfaceVisibility: 'hidden', transform: 'rotateX(180deg)', background: slot.top ? '#fdfd94' : '#fbfcf8' }}>
          <span className="flex-1 flex items-center justify-center text-center px-[calc(var(--u)*2)] font-bold leading-tight text-balance" style={{ fontSize: `calc(var(--u)*${slot.text.length > 26 ? 2.8 : slot.text.length > 12 ? 3.8 : 5.4})` }}>{slot.text}</span>
          <span className="shrink-0 w-[calc(var(--u)*12)] grid place-items-center font-display text-[calc(var(--u)*5.5)] border-l-2 border-border" style={{ background: slot.top ? '#f6c544' : '#e9eefe' }}>{slot.points}</span>
        </div>
      </motion.div>
      <AnimatePresence>
        {float && (
          <motion.span key={float.id} className="absolute right-[10%] top-0 z-10 font-display text-[calc(var(--u)*6)] text-[#fdfd94] pointer-events-none" style={{ WebkitTextStroke: 'calc(var(--u)*0.5) #000', paintOrder: 'stroke fill' }}
            initial={{ y: 0, opacity: 0, scale: 0.5 }} animate={{ y: '-120%', opacity: [0, 1, 1, 0], scale: 1.2 }} transition={{ duration: 1.4 }}>+{float.n}</motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

function Bulbs({ still }: { still: boolean }) {
  const n = 22;
  const spots: [number, number][] = [];
  for (let i = 0; i < n; i++) { spots.push([2 + (96 * i) / (n - 1), 1.6]); spots.push([2 + (96 * i) / (n - 1), 98.4]); }
  for (let i = 1; i < 12; i++) { spots.push([1.2, (100 * i) / 12]); spots.push([98.8, (100 * i) / 12]); }
  return (
    <>
      {spots.map(([x, y], i) => (
        <motion.span key={i} className="absolute w-[calc(var(--u)*1.4)] h-[calc(var(--u)*1.4)] rounded-full -translate-x-1/2 -translate-y-1/2" style={{ left: `${x}%`, top: `${y}%`, background: '#fdfd94', boxShadow: '0 0 calc(var(--u)*1.2) #fdfd94' }}
          animate={still ? undefined : { opacity: [1, 0.35, 1] }} transition={{ duration: 1.2, repeat: Infinity, delay: (i % 3) * 0.4 }} />
      ))}
    </>
  );
}

function Spotlights({ still }: { still: boolean }) {
  return (
    <>
      {[18, 82].map((x, i) => (
        <motion.span key={x} className="absolute top-[-20%] w-[30%] h-[140%] origin-top" style={{ left: `${x - 15}%`, background: 'linear-gradient(180deg, rgba(253,253,148,0.22), transparent 80%)', clipPath: 'polygon(40% 0, 60% 0, 100% 100%, 0 100%)' }}
          animate={still ? undefined : { rotate: i ? [12, -6, 12] : [-12, 6, -12] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} />
      ))}
    </>
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
      {kind === 'reveal' && <>{ring('#6aa9e9')}<rect x="26" y="34" width="48" height="32" rx="5" fill="#fdfd94" stroke="#000" strokeWidth="4" /><path d="M26 34l24-14 24 14" fill="#2f4f9e" stroke="#000" strokeWidth="4" strokeLinejoin="round" /><path d="M50 40v20M40 50h20" stroke="#000" strokeWidth="4" strokeLinecap="round" /></>}
      {kind === 'shield' && <>{ring('#c8f0dc')}<path d="M50 18l26 10v18c0 18-12 28-26 34-14-6-26-16-26-34V28z" fill="#6aa9e9" stroke="#000" strokeWidth="4.5" strokeLinejoin="round" /><path d="M40 50l8 8 14-16" stroke="#fff" strokeWidth="6" fill="none" strokeLinecap="round" /></>}
      {kind === 'double' && <>{ring('#fff6b0')}<text x="50" y="64" textAnchor="middle" fontSize="38" fontWeight="900" fontFamily="sans-serif" stroke="#000" strokeWidth="2" fill="#f6c544">x2</text></>}
      {kind === 'eraser' && <>{ring('#fbe3ea')}<path d="M24 60l28-28 22 22-28 28H32z" fill="#ef7d96" stroke="#000" strokeWidth="4" strokeLinejoin="round" /><path d="M36 48l22 22" stroke="#000" strokeWidth="4" /><path d="M30 82h40" stroke="#000" strokeWidth="4" strokeLinecap="round" /></>}
      {kind === 'peek' && <>{ring('#f5a08c')}<circle cx="34" cy="56" r="12" fill="#fbfcf8" stroke="#000" strokeWidth="4" /><circle cx="66" cy="56" r="12" fill="#fbfcf8" stroke="#000" strokeWidth="4" /><circle cx="50" cy="44" r="12" fill="#fbfcf8" stroke="#000" strokeWidth="4" /><path d="M29 60q5-4 10 0M61 60q5-4 10 0M45 48q5-4 10 0" stroke="#000" strokeWidth="3" fill="none" /><path d="M50 30v-12M36 22l4 8M64 22l-4 8" stroke="#000" strokeWidth="3.5" strokeLinecap="round" /></>}
      {kind === 'mic' && <>{ring('#fff6b0')}<rect x="38" y="18" width="24" height="34" rx="12" fill="#f6c544" stroke="#000" strokeWidth="4" /><path d="M30 46a20 20 0 0 0 40 0M50 66v14M38 82h24" stroke="#000" strokeWidth="4.5" fill="none" strokeLinecap="round" /><path d="M44 28h12M44 36h12" stroke="#000" strokeWidth="3" /></>}
      {kind === 'buzzer' && <>{ring('#e9eefe')}<rect x="24" y="58" width="52" height="16" rx="4" fill="#241c3d" stroke="#000" strokeWidth="4" /><path d="M30 58a20 20 0 0 1 40 0z" fill="#e5635f" stroke="#000" strokeWidth="4" /><path d="M20 30l8 6M80 30l-8 6M50 16v10" stroke="#000" strokeWidth="4" strokeLinecap="round" /></>}
      {kind === 'chicken' && <>{ring('#fdfd94')}<ellipse cx="50" cy="60" rx="20" ry="16" fill="#fbfcf8" stroke="#000" strokeWidth="4" /><circle cx="58" cy="36" r="12" fill="#fbfcf8" stroke="#000" strokeWidth="4" /><path d="M68 36l10 3-10 4z" fill="#f6c544" stroke="#000" strokeWidth="3" strokeLinejoin="round" /><path d="M54 24q4-8 8 0q4-6 6 2" fill="#e5635f" stroke="#000" strokeWidth="3" /><circle cx="60" cy="34" r="2.4" /><path d="M42 76v8M54 76v8" stroke="#f39a6b" strokeWidth="4" strokeLinecap="round" /></>}
    </svg>
  );
}

function Cover() {
  return (
    <svg viewBox="0 0 100 62" preserveAspectRatio="xMidYMid slice" style={{ background: 'radial-gradient(120% 80% at 50% 0%, #3b2f66, #241c3d)' }}>
      {Array.from({ length: 18 }, (_, i) => <circle key={i} cx={4 + i * 5.4} cy="3" r="1" fill="#fdfd94" />)}
      <rect x="14" y="8" width="72" height="9" rx="2" fill="#fbfcf8" stroke="#000" strokeWidth="0.8" />
      <rect x="30" y="11" width="40" height="3" rx="1.5" fill="#cdd7fb" />
      <rect x="14" y="20" width="58" height="30" rx="3" fill="#6aa9e9" stroke="#000" strokeWidth="0.9" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x={17 + (i % 2) * 27} y={23 + Math.floor(i / 2) * 13} width="25" height="11" rx="1.6" fill={i === 0 ? '#fdfd94' : i === 3 ? '#fbfcf8' : '#2f4f9e'} stroke="#000" strokeWidth="0.7" />
          {(i === 0 || i === 3) && <rect x={36 + (i % 2) * 27} y={23 + Math.floor(i / 2) * 13} width="6" height="11" fill={i === 0 ? '#f6c544' : '#e9eefe'} stroke="#000" strokeWidth="0.6" />}
        </g>
      ))}
      {[0, 1, 2].map((i) => <g key={i}><rect x="76" y={21 + i * 10} width="9" height="9" rx="1.5" fill={i < 2 ? '#e5635f' : '#3b2f66'} stroke="#000" strokeWidth="0.7" />{i < 2 && <path d={`M78 ${23 + i * 10}l5 5M83 ${23 + i * 10}l-5 5`} stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />}</g>)}
      {[0, 1, 2].map((i) => <rect key={i} x={14 + i * 25} y="53" width="22" height="6" rx="1.5" fill="#fbfcf8" stroke="#000" strokeWidth="0.7" />)}
    </svg>
  );
}

const def: LabDef = {
  id: 'survey-showdown',
  name: 'Survey Showdown',
  description: 'The right answer is the top answer on the survey board. Find it, flip the panels and watch out for strikes!',
  ways: ['teams'],
  minTeams: 2,
  maxTeams: 4,
  how: [
    { icon: <CheckCircle weight="fill" />, text: 'Answer right to earn a pick' },
    { icon: <HandTap weight="fill" />, text: 'Tap an answer to flip its panel' },
    { icon: <XIcon weight="bold" />, text: 'Three strikes and the next team can steal' },
  ],
  rounds: { label: 'Rounds', min: 3, max: 20, default: 10 },
  powers: POWERS,
  background: 'radial-gradient(120% 90% at 50% 0%, #c9d2ff 0%, #9aa8f2 60%, #7d8be0 100%)',
  cover: <Cover />,
  pieces: [
    { id: 'background', label: 'Background', hint: 'Behind the studio' },
    { id: 'stage', label: 'Studio', hint: 'The stage behind the board, with its lights' },
    { id: 'board', label: 'Survey board', hint: 'The frame around the answer panels' },
    { id: 'panel', label: 'Hidden panel', hint: 'The front of an answer panel before it flips' },
    { id: 'strike', label: 'Strike', hint: 'The big X' },
    { id: 'answer-button', label: 'Answer button', hint: 'One answer to pick' },
    ...POWERS.map((p) => ({ id: `power-${p.id}`, label: p.name, hint: p.desc })),
  ],
  Play,
};
export default def;
