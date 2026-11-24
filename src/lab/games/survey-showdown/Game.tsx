import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Heart, HandTap, Star, X as XIcon } from '@phosphor-icons/react';
import type { MultipleChoiceQuestion } from '../../../data/types';
import { TeamBadge } from '../../../engine/TeamBadge';
import type { LabCtx, LabDef, LabPower } from '../../types';
import { buildBoard, cpuPick, decoys, shuffle, topPoints, type Pick, type Slot } from './board';

// Top Answers (Game Lab): every board is one question. Its answers hide
// behind panels and the right answer is the top answer. On its turn a team
// taps one answer from the list: the top answer scores (more when found
// sooner), any other choice flips over as "Not this one", and an answer that
// is not on the board costs one of the board's three hearts. When the hearts
// are gone the top answer shows itself and a new board comes in. Power-ups
// earned with a top answer switch on at the start of the earner's next turn.

const POWERS: LabPower[] = [
  { id: 'reveal', name: 'Free Reveal', desc: 'On your turn, one panel that is not the top answer flips over.', enter: 'spin', art: <Art kind="reveal" /> },
  { id: 'shield', name: 'Second Chance', desc: 'Your next miss does not use a heart.', enter: 'drop', art: <Art kind="shield" /> },
  { id: 'double', name: 'Double Board', desc: 'Your next top answer counts two times.', enter: 'zoom', art: <Art kind="double" /> },
  { id: 'heart', name: 'Extra Heart', desc: 'The board gets one more heart on your turn.', enter: 'wiggle', art: <Art kind="heart" /> },
  { id: 'hint', name: 'Hint', desc: 'On your turn, the answers that are not on the board turn grey.', enter: 'zoom', art: <Art kind="hint" /> },
  { id: 'mic', name: 'Golden Mic', desc: 'Three bonus points. Mic drop!', enter: 'drop', art: <Art kind="mic" /> },
  { id: 'steal', name: 'Steal', desc: 'Take two points from the team in the lead.', takes: true, enter: 'spin', art: <Art kind="steal" /> },
  { id: 'buzzer', name: 'Buzzer Mixup', desc: 'Honk! The answer list jumbles up.', silly: true, art: <Art kind="buzzer" /> },
  { id: 'chicken', name: 'Rubber Chicken', desc: 'Bawk! A chicken runs across the stage. That is all.', silly: true, art: <Art kind="chicken" /> },
];

interface Board { q: MultipleChoiceQuestion; slots: Slot[]; list: Pick[] }
type Mode = 'pick' | 'busy';
const HEARTS = 3;

function Play({ ctx }: { ctx: LabCtx }) {
  const c = useRef(ctx); c.current = ctx;
  const [board, setBoard] = useState<Board | null>(null);
  const boardRef = useRef(board); boardRef.current = board;
  const [open, setOpen] = useState<boolean[]>([]);
  const openRef = useRef(open); openRef.current = open;
  const [used, setUsed] = useState<string[]>([]);
  const usedRef = useRef(used); usedRef.current = used;
  const [hearts, setHearts] = useState(HEARTS);
  const heartsRef = useRef(HEARTS); heartsRef.current = hearts;
  const misses = useRef(0);
  const helped = useRef(false);
  const [mode, setMode] = useState<Mode>('busy');
  const modeRef = useRef(mode); modeRef.current = mode;
  const [gen, setGen] = useState(0);
  const [hint, setHint] = useState(false);
  const [order, setOrder] = useState<string[]>([]);
  const [fx, setFx] = useState<{ kind: string; id: number } | null>(null);
  const [wobble, setWobble] = useState(0);
  const [found, setFound] = useState<{ n: number; id: number } | null>(null);
  const held = useRef<Record<string, LabPower[]>>({});
  const perks = useRef<{ shield: boolean; double: boolean }>({ shield: false, double: false });
  const box = useRef<HTMLDivElement>(null);
  const tall = useTall(box);
  const wait = (ms: number) => new Promise((r) => window.setTimeout(r, ms));

  function flash(kind: string, ms = 1600) {
    const id = Date.now() + Math.random();
    setFx({ kind, id });
    window.setTimeout(() => setFx((f) => (f?.id === id ? null : f)), ms);
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
    setHearts(HEARTS); heartsRef.current = HEARTS;
    misses.current = 0; helped.current = false;
    setHint(false); setFx(null); setFound(null);
    setOrder(list.map((p) => p.text));
    setGen((g) => g + 1);
    x.sfx.slideUp();
  }

  // Every turn: held power-ups switch on, then the team picks one answer.
  // The board itself is the turn's question.
  useEffect(() => {
    let live = true;
    const x = c.current;
    if (!boardRef.current) newBoard();
    setHint(false);
    perks.current = { shield: false, double: false };
    const mine = held.current[x.player.id] ?? [];
    held.current[x.player.id] = [];
    x.setHeld(x.player.id, []);
    void (async () => {
      await wait(500);
      for (const p of mine) { if (!live) return; await switchOn(p); await wait(700); }
      if (live) setMode('pick');
    })();
    return () => { live = false; };
  }, [ctx.taken]); // eslint-disable-line react-hooks/exhaustive-deps

  async function switchOn(p: LabPower) {
    const x = c.current;
    x.say(`${p.name} is on!`);
    if (p.id === 'reveal') {
      const b = boardRef.current; if (!b) return;
      const wrong = b.slots.map((s, i) => (!s.top && !openRef.current[i] ? i : -1)).filter((i) => i >= 0);
      if (!wrong.length) return;
      flash('reveal', 1300); x.sfx.whoosh(); await wait(700);
      const i = wrong[Math.floor(Math.random() * wrong.length)];
      const o = [...openRef.current]; o[i] = true; setOpen(o); openRef.current = o;
      const u = [...usedRef.current, b.slots[i].text]; setUsed(u); usedRef.current = u;
      helped.current = true;
    }
    if (p.id === 'shield') { perks.current.shield = true; x.sfx.bump(); flash('shield'); }
    if (p.id === 'double') { perks.current.double = true; x.sfx.coin(); flash('double'); }
    if (p.id === 'heart') { const n = Math.min(HEARTS + 1, heartsRef.current + 1); setHearts(n); heartsRef.current = n; x.sfx.chest(); }
    if (p.id === 'hint') { setHint(true); helped.current = true; x.sfx.magnet(); }
  }

  // Right away when it comes up (silly ones and points).
  async function fireNow(p: LabPower) {
    const x = c.current;
    if (p.id === 'mic') { x.points(3); x.sfx.thud(); x.burst(0.5, 0.35); flash('mic'); return true; }
    if (p.id === 'steal') {
      const s = x.turns, me = x.player.id;
      const lead = [...s.players].filter((pl) => pl.id !== me).sort((a, b) => b.score - a.score)[0];
      if (lead && lead.score > 0) { const n = Math.min(2, lead.score); x.points(-n, lead.id); x.points(n); x.sfx.whoosh(); x.say('Swiped two!'); }
      return true;
    }
    if (p.id === 'buzzer') { x.sfx.zap(); flash('buzzer', 1200); await wait(200); setOrder((o) => shuffle(o)); x.sfx.boing(); return true; }
    if (p.id === 'chicken') { x.sfx.boing(); flash('chicken', 1900); x.say('Bawk!', 'oops'); await wait(1200); return true; }
    return false;
  }

  function pick(text: string) {
    const x = c.current, b = boardRef.current;
    if (!b || modeRef.current !== 'pick' || usedRef.current.includes(text)) return;
    setMode('busy'); modeRef.current = 'busy';
    x.sfx.tap();
    const u = [...usedRef.current, text]; setUsed(u); usedRef.current = u;
    const i = b.slots.findIndex((s) => s.text === text);
    // The top answer.
    if (i >= 0 && b.slots[i].top) {
      const o = [...openRef.current]; o[i] = true; setOpen(o); openRef.current = o;
      const pts = topPoints(misses.current, perks.current.double);
      x.points(pts);
      x.log(b.q, misses.current === 0 && !helped.current);
      setFound({ n: pts, id: Date.now() });
      x.sfx.bell(); window.setTimeout(() => c.current.sfx.cheer(), 250);
      x.say('Top answer!', 'big'); x.burst(0.45, 0.4, 'big');
      void (async () => {
        await wait(1900);
        const p = await c.current.power(0.5);
        if (p && !(await fireNow(p))) {
          const id = c.current.player.id;
          held.current[id] = [...(held.current[id] ?? []), p];
          c.current.setHeld(id, held.current[id]);
        }
        boardRef.current = null;
        if (c.current.next()) setBoard(null);
      })();
      return;
    }
    // Another choice, or one that is not on the board.
    misses.current += 1;
    if (i >= 0) { const o = [...openRef.current]; o[i] = true; setOpen(o); openRef.current = o; }
    x.sfx.wrong();
    setWobble((n) => n + 1);
    if (perks.current.shield) { perks.current.shield = false; x.say('Second chance!'); flash('shield'); }
    else {
      const n = heartsRef.current - 1; setHearts(n); heartsRef.current = n;
      if (n <= 0) {
        x.log(b.q, false);
        window.setTimeout(() => {
          const t = b.slots.findIndex((s) => s.top);
          const o = [...openRef.current]; o[t] = true; setOpen(o); openRef.current = o;
          c.current.sfx.whoosh(); c.current.say('Here it is!');
        }, 900);
        window.setTimeout(() => { boardRef.current = null; if (c.current.next()) setBoard(null); }, 3200);
        return;
      }
    }
    x.say(i >= 0 ? 'Not this one' : 'Not on the board', 'oops');
    window.setTimeout(() => c.current.next(), 1600);
  }

  // The computer picks on its own, after a little think.
  useEffect(() => {
    if (!ctx.cpu || mode !== 'pick' || !board) return;
    const id = window.setTimeout(() => pick(cpuPick(board.list, usedRef.current, board.slots, c.current.cpuRight())), 2000 + Math.random() * 1200);
    return () => window.clearTimeout(id);
  }, [ctx.cpu, mode, board, ctx.taken]); // eslint-disable-line react-hooks/exhaustive-deps

  const still = ctx.still;
  const b = board;
  const n = b?.slots.length ?? 4;
  const cols = n > 3 ? 2 : 1;
  const prompt = b?.q.prompt ?? '';
  const pSize = prompt.length > 110 ? 4 : prompt.length > 60 ? 4.6 : 5.6;
  const canPick = mode === 'pick' && !ctx.cpu;
  const listed = order.map((t) => b?.list.find((p) => p.text === t)).filter(Boolean) as Pick[];

  return (
    <div ref={box} className="absolute inset-0 grid place-items-center">
      <motion.div className="relative lab-fit" style={{ '--ar': tall ? 0.85 : 1.55, '--u': tall ? '0.7cqw' : '1cqh', containerType: 'size' } as CSSProperties}
        animate={wobble && ctx.shake ? { x: wobble % 2 ? [0, -8, 6, -3, 0] : [0, 8, -6, 3, 0] } : { x: 0 }} transition={{ duration: 0.4 }}>
        {/* The stage: the periwinkle sticker look, soft and bright. */}
        <div className="absolute inset-0 rounded-[calc(var(--u)*4)] border-heavy border-border overflow-hidden" style={{ background: 'radial-gradient(120% 90% at 50% 0%, #dbe3ff 0%, #b4c4fb 60%, #9aa8f2 100%)', boxShadow: '0 calc(var(--u)*1) 0 #000, 0 calc(var(--u)*3) calc(var(--u)*6) rgba(36,28,61,0.3)' }}>
          <svg viewBox="0 0 300 200" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full" aria-hidden="true">
            {[[20, 30, '#fdfd94'], [270, 40, '#f5a08c'], [40, 170, '#8fe3a0'], [260, 175, '#ef7d96'], [150, 12, '#fbfcf8']].map(([x, y, f], i) => <circle key={i} cx={x as number} cy={y as number} r="14" fill={f as string} opacity="0.55" />)}
          </svg>
        </div>

        <div className={`absolute inset-[calc(var(--u)*3.5)] grid gap-[calc(var(--u)*2.2)] ${tall ? 'grid-rows-[auto_1fr_auto_auto]' : 'grid-rows-[auto_1fr_auto]'}`}>
          {/* The question, with whose pick it is. */}
          <motion.div key={`q${gen}`} className="relative rounded-[calc(var(--u)*2.5)] border-bold border-border bg-surface px-[calc(var(--u)*3)] py-[calc(var(--u)*2)] flex items-center gap-[calc(var(--u)*2)]" style={{ boxShadow: '0 calc(var(--u)*0.8) 0 #000' }}
            initial={still ? false : { y: -30, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 16 }}>
            <span className="shrink-0 rounded-full" style={{ boxShadow: '0 0 0 calc(var(--u)*0.7) #fdfd94' }}><TeamBadge colorIndex={ctx.player.colorIndex} size={40} /></span>
            <p className="m-0 flex-1 text-center font-bold leading-snug text-balance" style={{ fontSize: `calc(var(--u)*${pSize})` }}>{prompt}</p>
          </motion.div>

          <div className={`grid gap-[calc(var(--u)*2.5)] min-h-0 ${tall ? 'grid-cols-1 grid-rows-[1fr_auto]' : 'grid-cols-[1fr_auto]'}`}>
            {/* The board with its hidden answers. */}
            <div className="relative rounded-[calc(var(--u)*3)] border-bold border-border bg-surface p-[calc(var(--u)*2)] grid gap-[calc(var(--u)*1.6)] min-h-0"
              style={{ boxShadow: '0 calc(var(--u)*0.8) 0 #000', gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridAutoRows: '1fr' }} aria-label="Answer board">
              {b?.slots.map((s, i) => <SlotPanel key={`${gen}-${i}`} slot={s} open={open[i]} i={i} still={still} found={s.top ? found : null} />)}
              <AnimatePresence>
                {fx?.kind === 'double' && !still && (
                  <motion.span key={fx.id} className="absolute inset-0 grid place-items-center pointer-events-none font-display text-[calc(var(--u)*18)] text-[#f6c544]" style={{ WebkitTextStroke: 'calc(var(--u)*0.7) #000', paintOrder: 'stroke fill' }}
                    initial={{ scale: 2.4, opacity: 0, rotate: -16 }} animate={{ scale: [2.4, 1, 1], opacity: [0, 1, 0], rotate: -8 }} exit={{ opacity: 0 }} transition={{ duration: 1.5 }}>x2</motion.span>
                )}
                {fx?.kind === 'reveal' && !still && (
                  <motion.span key={fx.id} className="absolute inset-y-0 w-[30%] pointer-events-none" style={{ background: 'radial-gradient(closest-side, rgba(253,253,148,0.8), transparent)' }}
                    initial={{ left: '-30%', opacity: 1 }} animate={{ left: '100%', opacity: [1, 1, 0] }} exit={{ opacity: 0 }} transition={{ duration: 1.2 }} />
                )}
              </AnimatePresence>
            </div>
            {/* The board's hearts. */}
            <div className={`grid gap-[calc(var(--u)*1.6)] content-center justify-items-center ${tall ? 'grid-flow-col auto-cols-max justify-center' : ''}`} aria-label={`${hearts} hearts left`}>
              {Array.from({ length: Math.max(HEARTS, hearts) }, (_, k) => (
                <motion.span key={k} className="w-[calc(var(--u)*10)] h-[calc(var(--u)*10)] rounded-full border-std border-border grid place-items-center bg-surface" style={{ boxShadow: '0 calc(var(--u)*0.5) 0 #000' }}
                  initial={false} animate={{ scale: k < hearts ? 1 : 0.85, opacity: k < hearts ? 1 : 0.5 }} transition={{ type: 'spring', stiffness: 300, damping: 14 }}>
                  <Heart weight={k < hearts ? 'fill' : 'regular'} className="w-[62%] h-[62%]" style={{ color: k < hearts ? '#ef7d96' : '#7383ad' }} />
                </motion.span>
              ))}
            </div>
          </div>

          {/* The answers to pick from. */}
          <div className="grid grid-cols-3 gap-[calc(var(--u)*1.6)]" aria-label="Answers to pick">
            {listed.map((p, i) => {
              const done = used.includes(p.text);
              const onBoard = b?.slots.findIndex((s) => s.text === p.text) ?? -1;
              const top = onBoard >= 0 && b!.slots[onBoard].top;
              const grey = hint && !p.real;
              return (
                <motion.button key={`${gen}-${p.text}`} layout={!still} type="button" disabled={!canPick || done || grey} onClick={() => pick(p.text)}
                  className={`relative min-h-[calc(var(--u)*11)] rounded-[calc(var(--u)*2)] border-std border-border px-[calc(var(--u)*2)] font-bold leading-tight text-balance inline-flex items-center justify-center gap-[calc(var(--u)*1)] disabled:cursor-default ${done && top ? 'bg-[#9fe7a0]' : done ? 'bg-[#e9eefe] text-[#314677]' : grey ? 'bg-[#e9eefe] text-[#7383ad]' : 'bg-surface'}`}
                  style={{ fontSize: `calc(var(--u)*${p.text.length > 28 ? 4 : 4.8})`, boxShadow: done || grey ? 'none' : '0 calc(var(--u)*0.6) 0 #000' }}
                  initial={still ? false : { y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 18, delay: i * 0.05 }}
                  whileHover={canPick && !done && !still ? { scale: 1.05 } : undefined} whileTap={canPick && !done ? { scale: 0.95 } : undefined}
                  aria-label={`${p.text}${done ? (top ? ', the top answer' : ', not this one') : grey ? ', not on the board' : ''}`}>
                  {done && (top ? <Check weight="bold" className="w-[calc(var(--u)*4.5)] h-[calc(var(--u)*4.5)] shrink-0" /> : <XIcon weight="bold" className="w-[calc(var(--u)*4)] h-[calc(var(--u)*4)] shrink-0" />)}
                  {p.text}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Power-up moments on the stage. */}
        <AnimatePresence>
          {fx && !still && ['mic', 'chicken', 'shield'].includes(fx.kind) && (
            <motion.span key={fx.id} className="absolute z-10 w-[20%] [&>svg]:w-full pointer-events-none"
              initial={fx.kind === 'chicken' ? { left: '-25%', top: '55%' } : { left: '40%', top: '-30%', rotate: -30 }}
              animate={fx.kind === 'chicken' ? { left: '105%', top: ['55%', '45%', '55%', '45%', '55%'], rotate: [0, 12, -12, 12, 0] } : { top: ['-30%', '30%', '28%', '30%'], rotate: [-30, 8, -4, 0], opacity: [1, 1, 1, 0] }}
              exit={{ opacity: 0 }} transition={{ duration: fx.kind === 'chicken' ? 1.8 : 1.4 }}>
              <Art kind={fx.kind} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function SlotPanel({ slot, open, i, still, found }: { slot: Slot; open: boolean; i: number; still: boolean; found: { n: number; id: number } | null }) {
  return (
    <div className="relative min-h-0" style={{ perspective: '60em' }}>
      <motion.div className="absolute inset-0" style={{ transformStyle: 'preserve-3d' }} initial={still ? false : { rotateX: -90, opacity: 0 }}
        animate={{ rotateX: open ? 180 : 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 140, damping: 16, delay: open ? 0 : i * 0.08 }}>
        {/* Hidden face */}
        <div className="absolute inset-0 rounded-[calc(var(--u)*1.8)] border-std border-border grid place-items-center" style={{ backfaceVisibility: 'hidden', background: 'linear-gradient(180deg, #c9d2ff, #9aa8f2)', boxShadow: 'inset 0 calc(var(--u)*0.5) 0 rgba(255,255,255,0.5)' }}>
          <span className="font-display text-[calc(var(--u)*7)] text-[#241c3d]/50" aria-hidden="true">?</span>
        </div>
        {/* Answer face */}
        <div className="absolute inset-0 rounded-[calc(var(--u)*1.8)] border-std border-border grid grid-rows-[1fr_auto] place-items-center text-center overflow-hidden px-[calc(var(--u)*2)] py-[calc(var(--u)*1)]"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateX(180deg)', background: slot.top ? '#fdfd94' : '#e9eefe' }}>
          <span className="font-bold leading-tight text-balance self-end" style={{ fontSize: `calc(var(--u)*${slot.text.length > 26 ? 4 : 5.4})` }}>{slot.text}</span>
          <span className="inline-flex items-center gap-[calc(var(--u)*1)] font-bold text-[calc(var(--u)*4)] self-start" style={{ color: slot.top ? '#1f7a45' : '#314677' }}>
            {slot.top ? <><Star weight="fill" className="w-[calc(var(--u)*4.4)] h-[calc(var(--u)*4.4)] text-[#f6c544]" style={{ filter: 'drop-shadow(0 0 1px #000)' }} />Top answer!</> : <><XIcon weight="bold" className="w-[calc(var(--u)*3.6)] h-[calc(var(--u)*3.6)]" />Not this one</>}
          </span>
        </div>
      </motion.div>
      <AnimatePresence>
        {found && (
          <motion.span key={found.id} className="absolute right-[8%] top-0 z-10 font-display text-[calc(var(--u)*6)] text-[#fdfd94] pointer-events-none" style={{ WebkitTextStroke: 'calc(var(--u)*0.5) #000', paintOrder: 'stroke fill' }}
            initial={{ y: 0, opacity: 0, scale: 0.5 }} animate={{ y: '-110%', opacity: [0, 1, 1, 0], scale: 1.2 }} exit={{ opacity: 0 }} transition={{ duration: 1.5 }}>+{found.n}</motion.span>
        )}
      </AnimatePresence>
    </div>
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
      {kind === 'reveal' && <>{ring('#b4c4fb')}<rect x="26" y="34" width="48" height="32" rx="5" fill="#e9eefe" stroke="#000" strokeWidth="4" /><path d="M26 34l24-14 24 14" fill="#9aa8f2" stroke="#000" strokeWidth="4" strokeLinejoin="round" /><path d="M42 50l6 6 12-12" stroke="#000" strokeWidth="4" fill="none" strokeLinecap="round" /></>}
      {kind === 'shield' && <>{ring('#c8f0dc')}<path d="M50 18l26 10v18c0 18-12 28-26 34-14-6-26-16-26-34V28z" fill="#6aa9e9" stroke="#000" strokeWidth="4.5" strokeLinejoin="round" /><path d="M40 50l8 8 14-16" stroke="#fff" strokeWidth="6" fill="none" strokeLinecap="round" /></>}
      {kind === 'double' && <>{ring('#fff6b0')}<text x="50" y="64" textAnchor="middle" fontSize="38" fontWeight="900" fontFamily="sans-serif" stroke="#000" strokeWidth="2" fill="#f6c544">x2</text></>}
      {kind === 'heart' && <>{ring('#fbe3ea')}<path d="M50 78S20 60 20 40a14 14 0 0 1 30-6 14 14 0 0 1 30 6c0 20-30 38-30 38z" fill="#ef7d96" stroke="#000" strokeWidth="4.5" strokeLinejoin="round" /><path d="M72 20v14M65 27h14" stroke="#000" strokeWidth="4.5" strokeLinecap="round" /></>}
      {kind === 'hint' && <>{ring('#fdfd94')}<path d="M50 18a20 20 0 0 1 12 36v8H38v-8a20 20 0 0 1 12-36z" fill="#fbfcf8" stroke="#000" strokeWidth="4.5" strokeLinejoin="round" /><path d="M40 70h20M43 78h14" stroke="#000" strokeWidth="4.5" strokeLinecap="round" /></>}
      {kind === 'mic' && <>{ring('#fff6b0')}<rect x="38" y="18" width="24" height="34" rx="12" fill="#f6c544" stroke="#000" strokeWidth="4" /><path d="M30 46a20 20 0 0 0 40 0M50 66v14M38 82h24" stroke="#000" strokeWidth="4.5" fill="none" strokeLinecap="round" /><path d="M44 28h12M44 36h12" stroke="#000" strokeWidth="3" /></>}
      {kind === 'steal' && <>{ring('#e9eefe')}<path d="M24 58q26-30 52 0" stroke="#000" strokeWidth="5" fill="none" strokeLinecap="round" /><path d="M70 46l7 13-14 1z" fill="#000" /><circle cx="30" cy="68" r="10" fill="#f6c544" stroke="#000" strokeWidth="4" /><circle cx="70" cy="68" r="10" fill="#f6c544" stroke="#000" strokeWidth="4" /></>}
      {kind === 'buzzer' && <>{ring('#e9eefe')}<rect x="24" y="58" width="52" height="16" rx="4" fill="#241c3d" stroke="#000" strokeWidth="4" /><path d="M30 58a20 20 0 0 1 40 0z" fill="#ef7d96" stroke="#000" strokeWidth="4" /><path d="M20 30l8 6M80 30l-8 6M50 16v10" stroke="#000" strokeWidth="4" strokeLinecap="round" /></>}
      {kind === 'chicken' && <>{ring('#fdfd94')}<ellipse cx="50" cy="60" rx="20" ry="16" fill="#fbfcf8" stroke="#000" strokeWidth="4" /><circle cx="58" cy="36" r="12" fill="#fbfcf8" stroke="#000" strokeWidth="4" /><path d="M68 36l10 3-10 4z" fill="#f6c544" stroke="#000" strokeWidth="3" strokeLinejoin="round" /><path d="M54 24q4-8 8 0q4-6 6 2" fill="#ef7d96" stroke="#000" strokeWidth="3" /><circle cx="60" cy="34" r="2.4" /><path d="M42 76v8M54 76v8" stroke="#f39a6b" strokeWidth="4" strokeLinecap="round" /></>}
    </svg>
  );
}

function Cover() {
  return (
    <svg viewBox="0 0 100 62" preserveAspectRatio="xMidYMid slice" style={{ background: 'radial-gradient(120% 90% at 50% 0%, #dbe3ff, #9aa8f2)' }}>
      <rect x="12" y="6" width="76" height="10" rx="2.5" fill="#fbfcf8" stroke="#000" strokeWidth="0.8" />
      <rect x="32" y="9.5" width="36" height="3" rx="1.5" fill="#cdd7fb" />
      <rect x="12" y="19" width="62" height="30" rx="3" fill="#fbfcf8" stroke="#000" strokeWidth="0.9" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x={15 + (i % 2) * 29} y={22 + Math.floor(i / 2) * 13} width="27" height="11" rx="1.8" fill={i === 1 ? '#fdfd94' : i === 2 ? '#e9eefe' : '#b4c4fb'} stroke="#000" strokeWidth="0.7" />
          {i === 1 && <path d="M57.5 25l1.3 2.7 3 .3-2.2 2 .6 3-2.7-1.5-2.7 1.5.6-3-2.2-2 3-.3z" fill="#f6c544" stroke="#000" strokeWidth="0.4" />}
          {(i === 0 || i === 3) && <text x={28.5 + (i % 2) * 29} y={30 + Math.floor(i / 2) * 13} textAnchor="middle" fontSize="6" fontWeight="900" fill="#241c3d" opacity="0.5">?</text>}
        </g>
      ))}
      {[0, 1, 2].map((i) => <path key={i} d={`M${80.5} ${24 + i * 9}c-2-3-6-1-4 2l4 4 4-4c2-3-2-5-4-2z`} fill={i < 2 ? '#ef7d96' : '#fbfcf8'} stroke="#000" strokeWidth="0.6" />)}
      {[0, 1, 2].map((i) => <rect key={i} x={12 + i * 26} y="53" width="24" height="6" rx="1.5" fill="#fbfcf8" stroke="#000" strokeWidth="0.7" />)}
    </svg>
  );
}

const def: LabDef = {
  id: 'survey-showdown',
  name: 'Top Answers',
  description: 'The right answer is the top answer, hiding on the board. Find it before the hearts run out!',
  ways: ['teams'],
  minTeams: 2,
  maxTeams: 4,
  how: [
    { icon: <HandTap weight="fill" />, text: 'Tap the answer you think is right' },
    { icon: <Star weight="fill" />, text: 'The top answer scores' },
    { icon: <Heart weight="fill" />, text: 'Other answers cost a heart' },
  ],
  rounds: { label: 'Rounds', min: 3, max: 20, default: 10 },
  powers: POWERS,
  background: 'radial-gradient(120% 90% at 50% 0%, #c9d2ff 0%, #9aa8f2 60%, #7d8be0 100%)',
  cover: <Cover />,
  pieces: [
    { id: 'background', label: 'Background', hint: 'Behind the stage' },
    { id: 'stage', label: 'Stage', hint: 'The panel behind the board' },
    { id: 'board', label: 'Answer board', hint: 'The frame around the answer panels' },
    { id: 'panel', label: 'Hidden panel', hint: 'The front of an answer panel before it flips' },
    { id: 'heart', label: 'Heart', hint: 'One of the board\'s three hearts' },
    { id: 'answer-button', label: 'Answer button', hint: 'One answer to pick' },
    ...POWERS.map((p) => ({ id: `power-${p.id}`, label: p.name, hint: p.desc })),
  ],
  Play,
};
export default def;
