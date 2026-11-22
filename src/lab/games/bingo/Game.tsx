import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { HandTap, SpeakerHigh, Star, Trophy } from '@phosphor-icons/react';
import type { MultipleChoiceQuestion } from '../../../data/types';
import { speak } from '../../../engine/feedback';
import { playClip } from '../../../engine/music';
import { TeamBadge } from '../../../engine/TeamBadge';
import { TEAM_COLORS } from '../../../engine/turns';
import type { LabCtx, LabDef, LabPower } from '../../types';
import { bestSquare, FREE, freshMarks, LINES, makeCard, matches, nearSquares, neighbors, newLines, shuffleOpen } from './bingo';

// Bingo (Game Lab): every team (or a solo player) has a 5 by 5 card of
// answers from the question set, with a free star in the middle. A ball
// rolls out of the spinning cage with a question; tap its answer on your
// card to daub it. Five in a row is BINGO.

const POWERS: LabPower[] = [
  { id: 'free', name: 'Free Daub', desc: 'Daub any square you like.', enter: 'drop', art: <Art kind="free" /> },
  { id: 'wild', name: 'Wild Star', desc: 'A star lands on one of your squares and counts as daubed.', enter: 'spin', art: <Art kind="wild" /> },
  { id: 'double', name: 'Double Ball', desc: 'Another ball rolls out for you right now.', enter: 'zoom', art: <Art kind="double" /> },
  { id: 'peek', name: 'Peek', desc: 'On your next ball, all but three squares fade away.', enter: 'zoom', art: <Art kind="peek" /> },
  { id: 'lucky', name: 'Lucky Ball', desc: 'A golden ball: three bonus points.', enter: 'spin', art: <Art kind="lucky" /> },
  { id: 'sticky', name: 'Sticky Dauber', desc: 'Whoops! Your dauber sticks and splats the square next door too.', silly: true, art: <Art kind="sticky" /> },
  { id: 'shuffle', name: 'Card Shuffle', desc: 'Whoops! Your open squares jump to new spots.', silly: true, art: <Art kind="shuffle" /> },
];

type Mark = 'dab' | 'star' | 'goo';
type Phase = 'spin' | 'roll' | 'ask';
const sleep = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));
const LETTERS = ['B', 'I', 'N', 'G', 'O'];
const LETTER_COLORS = ['#6aa9e9', '#ef7d96', '#fbfcf8', '#8fe3a0', '#f6c544'];
const BALL_COLORS = ['#6aa9e9', '#ef7d96', '#f6c544', '#8fe3a0', '#c58ce8', '#f39a6b'];

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
  // The set's questions, gathered once from the deck.
  const pool = useMemo(() => {
    const m = new Map<string, MultipleChoiceQuestion>();
    for (let i = 0; i < 80; i++) { const q = ctx.draw(); if (!m.has(q.id)) m.set(q.id, q); }
    return [...m.values()];
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const answers = useMemo(() => pool.map((q) => q.choices[q.correctIndex]).filter((a) => a && a.trim()), [pool]);
  const [cards, setCardsState] = useState<Record<string, string[]>>(() => Object.fromEntries(players.map((p) => [p.id, makeCard(answers)])));
  const cardsRef = useRef(cards);
  const setCards = (v: Record<string, string[]>) => { cardsRef.current = v; setCardsState(v); };
  const [marks, setMarksState] = useState<Record<string, boolean[]>>(() => Object.fromEntries(players.map((p) => [p.id, freshMarks()])));
  const marksRef = useRef(marks);
  const setMarks = (v: Record<string, boolean[]>) => { marksRef.current = v; setMarksState(v); };
  const [kinds, setKinds] = useState<Record<string, Record<number, Mark>>>({});
  const counted = useRef<Record<string, number[]>>({});
  const [glow, setGlow] = useState<number[]>([]);
  const [call, setCall] = useState<{ q: MultipleChoiceQuestion; n: number; phase: Phase; color: string } | null>(null);
  const calls = useRef(0);
  const [mode, setModeState] = useState<'wait' | 'call' | 'free' | 'busy'>('wait');
  const modeRef = useRef(mode);
  const setMode = (m: typeof mode) => { modeRef.current = m; setModeState(m); };
  const tapWait = useRef<((i: number) => void) | null>(null);
  const [hint, setHint] = useState<number[]>([]);
  const [shake, setShake] = useState<{ i: number; n: number } | null>(null);
  const [peekSet, setPeekSet] = useState<number[] | null>(null);
  const peeks = useRef<Set<string>>(new Set());
  const [flip, setFlip] = useState(0);
  const [cheer, setCheer] = useState(0);
  const [sprite, setSprite] = useState<{ kind: 'star' | 'gold'; to: number; n: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const { w, h } = useBox(rootRef);
  const me = ctx.player;
  const color = (id: string) => TEAM_COLORS[(players.find((p) => p.id === id)?.colorIndex ?? 0) % TEAM_COLORS.length];

  const answerOf = (q: MultipleChoiceQuestion) => q.choices[q.correctIndex];
  const waitTap = () => new Promise<number>((r) => { tapWait.current = r; });
  // Confetti from a square of the big card.
  const at = (i: number) => {
    const r = cardRef.current?.getBoundingClientRect();
    if (!r) return { x: 0.5, y: 0.5 };
    const cw = r.width / 5, top = r.top + r.height - r.width;
    return { x: (r.left + (i % 5 + 0.5) * cw) / window.innerWidth, y: (top + (Math.floor(i / 5) + 0.5) * cw) / window.innerHeight };
  };

  // A question whose answer sits open on this player's card; now and then a
  // lucky one that finishes the line closest to done.
  function pick(id: string): MultipleChoiceQuestion {
    const card = cardsRef.current[id], mk = marksRef.current[id];
    const near = nearSquares(mk).map((i) => card[i]);
    const fits = (q: MultipleChoiceQuestion) => matches(card, mk, answerOf(q)).length > 0;
    const lucky = Math.random() < 0.3 ? pool.filter((q) => fits(q) && near.some((a) => matches([a], [false], answerOf(q)).length)) : [];
    if (lucky.length) return lucky[Math.floor(Math.random() * lucky.length)];
    for (let i = 0; i < 40; i++) { const q = c.current.draw(); if (fits(q)) return pool.find((p) => p.id === q.id) ?? q; }
    const any = pool.filter(fits);
    return any[Math.floor(Math.random() * any.length)] ?? pool[0];
  }

  function mark(id: string, i: number, kind: Mark) {
    setMarks({ ...marksRef.current, [id]: marksRef.current[id].map((v, k) => v || k === i) });
    setKinds((m) => ({ ...m, [id]: { ...(m[id] ?? {}), [i]: kind } }));
  }

  async function checkLines(id: string) {
    const x = c.current;
    const done = newLines(marksRef.current[id], counted.current[id] ?? []);
    if (!done.length) return;
    counted.current[id] = [...(counted.current[id] ?? []), ...done];
    setGlow(done.flatMap((l) => LINES[l])); setCheer((n) => n + 1);
    playClip('/lab/bingo/bingo.mp3', x.settings, 0.9); x.sfx.cheer();
    x.points(5 * done.length, id);
    x.say(done.length > 1 ? 'DOUBLE BINGO!' : 'BINGO!', 'big');
    const m = at(12); x.burst(m.x, m.y, 'big'); window.setTimeout(() => { x.burst(0.2, 0.3, 'big'); x.burst(0.8, 0.3, 'big'); }, 500);
    await sleep(2600);
    setGlow([]);
    // A card with every square daubed starts fresh.
    if (marksRef.current[id].every(Boolean)) {
      x.say('Full card! A new card');
      await sleep(900);
      setCards({ ...cardsRef.current, [id]: makeCard(answers) });
      setMarks({ ...marksRef.current, [id]: freshMarks() });
      setKinds((k) => ({ ...k, [id]: {} })); counted.current[id] = []; setFlip((f) => f + 1);
    }
  }

  async function dab(id: string, i: number, kind: Mark = 'dab') {
    const x = c.current;
    mark(id, i, kind);
    playClip('/lab/bingo/daub.mp3', x.settings, 0.8); x.sfx.pop();
    const p = at(i); x.burst(p.x, p.y);
    await sleep(500);
  }

  async function ball(id: string) {
    const x = c.current;
    const q = pick(id);
    const n = ++calls.current;
    setCall({ q, n, phase: 'spin', color: BALL_COLORS[n % BALL_COLORS.length] });
    x.sfx.wind();
    for (let k = 0; k < 8; k++) window.setTimeout(() => c.current.sfx.tick(), k * 120);
    await sleep(1200);
    setCall((cl) => (cl ? { ...cl, phase: 'roll' } : cl)); x.sfx.whoosh();
    await sleep(800);
    setCall((cl) => (cl ? { ...cl, phase: 'ask' } : cl)); x.sfx.boing();
    if (peeks.current.has(id)) {
      peeks.current.delete(id); x.setHeld(id, []);
      const right = matches(cardsRef.current[id], marksRef.current[id], answerOf(q));
      const others = cardsRef.current[id].map((_, k) => k).filter((k) => !marksRef.current[id][k] && !right.includes(k)).sort(() => Math.random() - 0.5).slice(0, 2);
      setPeekSet([...right.slice(0, 1), ...others]); x.say('Peek!');
    }
    return q;
  }

  // Every turn: a ball for the current player.
  useEffect(() => {
    let live = true;
    void (async () => {
      const id = c.current.player.id;
      let left = 1;
      while (left-- > 0 && live) {
        const q = await ball(id);
        if (!live) return;
        setMode('call');
        const i = await waitTap();
        if (!live) return;
        setMode('busy'); setPeekSet(null);
        const x = c.current;
        const hits = matches(cardsRef.current[id], marksRef.current[id], answerOf(q));
        if (!hits.includes(i)) {
          x.log(q, false); x.sfx.wrong(); setShake({ i, n: Date.now() }); setHint(hits);
          await sleep(2000); setHint([]);
          break;
        }
        x.log(q, true); x.sfx.right(); x.points(1, id);
        await dab(id, i);
        await checkLines(id);
        if (!live) return;
        setCall(null);
        const p = await c.current.power(0.45, (pw) => {
          const open = marksRef.current[id].filter((v) => !v).length;
          if (pw.id === 'free' || pw.id === 'wild') return open > 0;
          if (pw.id === 'sticky') return neighbors(i).some((k) => !marksRef.current[id][k]);
          if (pw.id === 'shuffle') return open > 2;
          if (pw.id === 'peek') return !peeks.current.has(id);
          return true;
        });
        if (!live) return;
        if (p?.id === 'double') { left++; c.current.say('Another ball!'); await sleep(600); }
        if (p?.id === 'lucky') { setSprite({ kind: 'gold', to: 12, n: Date.now() }); c.current.sfx.coin(); await sleep(900); c.current.points(3, id); c.current.say('+3 lucky points!'); await sleep(600); setSprite(null); }
        if (p?.id === 'peek') { peeks.current.add(id); c.current.setHeld(id, [p]); }
        if (p?.id === 'free') {
          c.current.say('Tap any square'); setMode('free');
          const k = await waitTap(); if (!live) return;
          setMode('busy'); await dab(id, k, 'dab'); await checkLines(id);
        }
        if (p?.id === 'wild') {
          const open = marksRef.current[id].map((v, k) => (v ? -1 : k)).filter((k) => k >= 0);
          const k = open[Math.floor(Math.random() * open.length)];
          setSprite({ kind: 'star', to: k, n: Date.now() }); c.current.sfx.power(); await sleep(900); setSprite(null);
          await dab(id, k, 'star'); await checkLines(id);
        }
        if (p?.id === 'sticky') {
          const nb = neighbors(i).filter((k) => !marksRef.current[id][k]);
          const k = nb[Math.floor(Math.random() * nb.length)];
          c.current.sfx.splash(); await dab(id, k, 'goo'); await checkLines(id);
        }
        if (p?.id === 'shuffle') {
          c.current.sfx.whoosh(); setFlip((f) => f + 1);
          await sleep(300);
          setCards({ ...cardsRef.current, [id]: shuffleOpen(cardsRef.current[id], marksRef.current[id]) });
          await sleep(900);
        }
      }
      if (!live) return;
      setCall(null); setMode('busy');
      await sleep(600);
      if (live) c.current.next();
    })();
    return () => { live = false; tapWait.current = null; };
  }, [ctx.taken]); // eslint-disable-line react-hooks/exhaustive-deps

  function tap(i: number) {
    const id = c.current.player.id;
    if (!tapWait.current || i === FREE) return;
    if (modeRef.current === 'free' && marksRef.current[id][i]) return;
    if (modeRef.current === 'call' && marksRef.current[id][i]) return;
    if (modeRef.current !== 'call' && modeRef.current !== 'free') return;
    const r = tapWait.current; tapWait.current = null; r(i);
  }

  // The computer daubs on its own, after a little look at its card.
  useEffect(() => {
    if (!ctx.cpu || (mode !== 'call' && mode !== 'free') || !call && mode === 'call') return;
    const t = window.setTimeout(() => {
      const id = c.current.player.id, mk = marksRef.current[id];
      if (modeRef.current === 'free') { tap(bestSquare(mk)); return; }
      if (!call) return;
      const hits = matches(cardsRef.current[id], mk, answerOf(call.q));
      const wrong = mk.map((v, k) => (!v && !hits.includes(k) ? k : -1)).filter((k) => k >= 0);
      tap(c.current.cpuRight() || !wrong.length ? hits[0] : wrong[Math.floor(Math.random() * wrong.length)]);
    }, 1800 + Math.random() * 900);
    return () => window.clearTimeout(t);
  }, [mode, call?.n, ctx.cpu]); // eslint-disable-line react-hooks/exhaustive-deps

  // Layout from the box: side by side when wide, stacked when tall.
  const land = w > h * 1.05;
  const others = players.filter((p) => p.id !== me.id);
  const gap = 12;
  const callerW = land ? Math.min(w * 0.44, h * 0.95) : w;
  const callerH = land ? h : Math.min(h * 0.3, w * 0.5);
  const miniH = !land && others.length ? Math.min(h * 0.12, 110) : 0;
  const areaW = land ? w - callerW - gap : w;
  const areaH = land ? h : h - callerH - miniH - gap * 2;
  const cardW = Math.max(120, Math.min(areaW * 0.96, areaH / 1.23));

  return (
    <div ref={rootRef} className="absolute inset-0 overflow-hidden">
      {w > 0 && (
        <div className={`absolute inset-0 flex ${land ? 'flex-row' : 'flex-col'} items-center justify-center`} style={{ gap }}>
          <div className="relative shrink-0 flex flex-col" style={{ width: callerW, height: callerH, gap }}>
            <Caller call={call} still={ctx.still} land={land} cheer={cheer} onListen={() => call && speak(call.q.prompt, ctx.settings)} />
            {land && others.length > 0 && (
              <div className="shrink-0 flex gap-3 justify-center flex-wrap" style={{ height: Math.min(h * 0.24, 150) }}>
                {others.map((p) => <Mini key={p.id} card={cards[p.id]} marks={marks[p.id]} colorIndex={p.colorIndex} color={color(p.id)} size={Math.min(h * 0.24, 150) - 8} />)}
              </div>
            )}
          </div>
          <div className="relative grid place-items-center" style={{ width: areaW, height: areaH }}>
            <motion.div key={me.id} ref={cardRef} className="relative" style={{ width: cardW, height: cardW * 1.17 }}
              initial={ctx.still ? false : { y: 40, opacity: 0, rotate: -3 }} animate={{ y: 0, opacity: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 160, damping: 16 }}>
              <span className="absolute -right-[4%] -bottom-[3%] z-10" aria-hidden="true"><TeamBadge colorIndex={me.colorIndex} size={Math.round(cardW * 0.13)} /></span>
              <Card card={cards[me.id]} marks={marks[me.id]} kinds={kinds[me.id] ?? {}} team={color(me.id)} colorIndex={me.colorIndex} size={cardW}
                canTap={!ctx.cpu && (mode === 'call' || mode === 'free')} free={mode === 'free'} glow={glow} hint={hint} shake={shake} peek={mode === 'call' ? peekSet : null}
                flip={flip} cheer={cheer} still={ctx.still} onTap={tap} />
              <AnimatePresence>
                {sprite && (
                  <motion.div key={sprite.n} className="absolute pointer-events-none z-20" style={{ width: cardW / 4, height: cardW / 4 }}
                    initial={{ x: -cardW * 0.6, y: -cardW * 0.3, rotate: 0, scale: 0.5 }} animate={{ x: ((sprite.to % 5) + 0.5) * (cardW / 5) - cardW / 8, y: cardW * 0.17 + (Math.floor(sprite.to / 5) + 0.5) * (cardW / 5) - cardW / 8, rotate: 540, scale: 1 }} exit={{ opacity: 0, scale: 1.6 }}
                    transition={{ duration: ctx.still ? 0 : 0.8, ease: 'easeOut' }}>
                    <svg viewBox="0 0 100 100" className="w-full h-full">{sprite.kind === 'star' ? <StarShape /> : <><circle cx="50" cy="50" r="42" fill="#f6c544" stroke="#000" strokeWidth="5" /><circle cx="50" cy="50" r="22" fill="#fffbe0" stroke="#000" strokeWidth="3" /><text x="50" y="59" textAnchor="middle" fontSize="26" fontWeight="900">+3</text></>}</svg>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
          {!land && others.length > 0 && (
            <div className="shrink-0 flex gap-3 justify-center" style={{ height: miniH }}>
              {others.map((p) => <Mini key={p.id} card={cards[p.id]} marks={marks[p.id]} colorIndex={p.colorIndex} color={color(p.id)} size={miniH - 4} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// The caller: a wire cage that spins, a ball that rolls out, and the
// question on a big white card with a listen button.
function Caller({ call, still, land, cheer, onListen }: { call: { q: MultipleChoiceQuestion; n: number; phase: Phase; color: string } | null; still: boolean; land: boolean; cheer: number; onListen: () => void }) {
  const spinning = call?.phase === 'spin';
  const out = call && call.phase !== 'spin';
  const len = call?.q.prompt.length ?? 0;
  return (
    <div className={`relative flex-1 min-h-0 flex ${land ? 'flex-col' : 'flex-row'} gap-3`}>
      <div className={`relative ${land ? 'h-[46%]' : 'w-[38%]'} shrink-0 flex items-center justify-center gap-2`}>
        <div className="relative h-full aspect-square">
          <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full" aria-hidden="true">
            <path d="M60 180 L80 120 M140 180 L120 120" stroke="#000" strokeWidth="12" strokeLinecap="round" />
            <path d="M60 180 L80 120 M140 180 L120 120" stroke="#c98a4b" strokeWidth="6" strokeLinecap="round" />
            <rect x="40" y="176" width="120" height="14" rx="7" fill="#241c3d" stroke="#000" strokeWidth="4" />
            <motion.g style={{ transformOrigin: '100px 92px' }} animate={still ? undefined : { rotate: spinning ? 720 : cheer ? [0, 40, 0] : 0 }} transition={{ duration: spinning ? 1.2 : 0.8, ease: 'easeInOut' }}>
              <circle cx="100" cy="92" r="70" fill="rgba(251,252,248,0.55)" stroke="#000" strokeWidth="6" />
              {[0, 30, 60, 90, 120, 150].map((a) => <ellipse key={a} cx="100" cy="92" rx="70" ry="22" fill="none" stroke="#241c3d" strokeWidth="3" transform={`rotate(${a} 100 92)`} />)}
              {[[78, 70, '#ef7d96'], [118, 64, '#6aa9e9'], [96, 110, '#f6c544'], [130, 102, '#8fe3a0'], [70, 108, '#c58ce8'], [104, 84, '#f39a6b']].map(([x, y, f], i) => (
                <motion.circle key={i} cx={x as number} cy={y as number} r="13" fill={f as string} stroke="#000" strokeWidth="3"
                  animate={still ? undefined : spinning ? { x: [0, 14, -12, 0], y: [0, -16, 10, 0] } : { x: 0, y: [0, -2, 0] }}
                  transition={{ duration: spinning ? 0.3 : 2 + i * 0.2, repeat: spinning ? 3 : Infinity }} />
              ))}
            </motion.g>
            <circle cx="100" cy="92" r="9" fill="#fdfd94" stroke="#000" strokeWidth="4" />
            <path d="M168 92 h18 v22" stroke="#000" strokeWidth="8" strokeLinecap="round" fill="none" />
            <circle cx="186" cy="118" r="8" fill="#ef7d96" stroke="#000" strokeWidth="3" />
          </svg>
        </div>
      </div>
      <div className="relative flex-1 min-h-0 min-w-0 flex items-center gap-3">
        <div className={`relative ${land ? 'w-[30%]' : 'w-[26%]'} shrink-0 aspect-square`}>
          <AnimatePresence>
            {out && (
              <motion.div key={call.n} className="absolute inset-0" initial={still ? { opacity: 0 } : { x: land ? '-40%' : '-160%', y: land ? '-140%' : 0, rotate: -360, scale: 0.4 }} animate={{ x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 }} exit={{ opacity: 0, scale: 0.3, y: 40 }}
                transition={{ type: 'spring', stiffness: 120, damping: 13 }}>
                <svg viewBox="0 0 100 100" className="w-full h-full" aria-label={`Ball ${call.n}`}>
                  <circle cx="52" cy="54" r="44" fill="#000" opacity="0.25" />
                  <circle cx="50" cy="50" r="44" fill={call.color} stroke="#000" strokeWidth="5" />
                  <circle cx="50" cy="50" r="26" fill="#fbfcf8" stroke="#000" strokeWidth="3" />
                  <text x="50" y="62" textAnchor="middle" fontSize={call.n > 99 ? 24 : 32} fill="#000" style={{ fontFamily: 'var(--font-display)' }}>{call.n}</text>
                  <ellipse cx="34" cy="28" rx="10" ry="6" fill="#fff" opacity="0.6" transform="rotate(-30 34 28)" />
                </svg>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="relative flex-1 min-w-0 h-full max-h-full flex items-center">
          <AnimatePresence mode="wait">
            {call?.phase === 'ask' && (
              <motion.div key={call.n} className="relative w-full rounded-panel border-heavy border-border bg-white px-4 py-3 grid gap-2 content-center" style={{ boxShadow: '0 6px 0 #000, 0 16px 30px rgba(36,28,61,0.3)', maxHeight: '100%' }}
                initial={still ? { opacity: 0 } : { scale: 0.6, opacity: 0, rotate: 4 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }}>
                {call.q.imageUrl && <img src={call.q.imageUrl} alt={call.q.imageAlt ?? ''} className="max-h-[30cqh] object-contain mx-auto" />}
                <h2 className="m-0 font-bold leading-tight text-balance" style={{ fontSize: len < 30 ? 'clamp(1.3rem, 6cqmin, 3.2rem)' : len < 70 ? 'clamp(1.05rem, 3.8cqmin, 2.2rem)' : 'clamp(0.9rem, 2.8cqmin, 1.6rem)' }}>{call.q.prompt}</h2>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={onListen} aria-label="Listen" title="Listen" className="w-11 h-11 shrink-0 rounded-full border-std border-border bg-accent grid place-items-center motion-safe:hover:scale-110 motion-safe:transition-transform"><SpeakerHigh weight="fill" size={22} /></button>
                  <span className="text-sm font-bold text-muted inline-flex items-center gap-1"><HandTap weight="fill" size={18} aria-hidden="true" />Find it on the card</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function Card({ card, marks, kinds, team, colorIndex, size, canTap, free, glow, hint, shake, peek, flip, cheer, still, onTap }: {
  card: string[]; marks: boolean[]; kinds: Record<number, Mark>; team: string; colorIndex: number; size: number; canTap: boolean; free: boolean; glow: number[]; hint: number[];
  shake: { i: number; n: number } | null; peek: number[] | null; flip: number; cheer: number; still: boolean; onTap: (i: number) => void;
}) {
  const cell = size / 5;
  const fs = (t: string) => { const n = t.length; return cell * (n <= 3 ? 0.34 : n <= 6 ? 0.25 : n <= 10 ? 0.19 : n <= 18 ? 0.15 : 0.12); };
  return (
    <div className="absolute inset-0 rounded-[6%] border-heavy border-border overflow-hidden" style={{ background: team, boxShadow: '0 8px 0 #000, 0 26px 40px rgba(36,28,61,0.35)' }}>
      <div className="absolute inset-x-0 top-0 flex items-center justify-around" style={{ height: size * 0.17 }}>
        {LETTERS.map((l, i) => (
          <motion.span key={`${l}${cheer}`} className="grid place-items-center rounded-full border-std border-border font-display" style={{ width: cell * 0.78, height: cell * 0.78, background: LETTER_COLORS[i], fontSize: cell * 0.46, boxShadow: '0 3px 0 #000' }}
            animate={cheer && !still ? { y: [0, -cell * 0.3, 0], rotate: [0, -10, 0] } : undefined} transition={{ delay: i * 0.08, duration: 0.5 }}>{l}</motion.span>
        ))}
      </div>
      <div className="absolute inset-x-[2.5%] bottom-[2.5%] grid grid-cols-5 grid-rows-5 gap-[1.5%] rounded-[4%]" style={{ top: size * 0.17 }}>
        {card.map((v, i) => {
          const on = marks[i];
          const k = kinds[i];
          const dim = peek && !peek.includes(i) && !on;
          const can = canTap && !on && i !== FREE;
          return (
            <motion.button key={`${i}-${flip}`} type="button" disabled={!can} onClick={() => onTap(i)} aria-label={i === FREE ? 'Free star' : `${v}${on ? ', daubed' : ''}`}
              className={`relative rounded-[14%] border-std border-border bg-surface grid place-items-center overflow-hidden px-[6%] text-center font-bold leading-[1.05] disabled:cursor-default ${can ? 'motion-safe:hover:scale-[1.06] hover:z-10 cursor-pointer' : ''}`}
              style={{ fontSize: fs(v), boxShadow: glow.includes(i) ? '0 0 0 4px #fdfd94, 0 0 18px 6px #fdfd94' : hint.includes(i) ? '0 0 0 4px #8fe3a0, 0 0 14px 4px #8fe3a0' : '0 3px 0 rgba(0,0,0,0.35)', opacity: dim ? 0.25 : 1, outline: free && can ? '3px dashed #241c3d' : undefined, outlineOffset: -5, transition: 'opacity 0.3s, transform 0.15s', overflowWrap: 'break-word', hyphens: 'none' }}
              initial={flip && !still ? { rotateY: 180 } : false} animate={shake?.i === i && !still ? { x: [0, -8, 8, -6, 6, 0], rotateY: 0 } : glow.includes(i) && !still ? { scale: [1, 1.08, 1], rotateY: 0 } : { rotateY: 0 }}
              transition={shake?.i === i ? { duration: 0.5 } : glow.includes(i) ? { duration: 0.6, repeat: 3 } : { duration: 0.5, delay: (i % 5) * 0.04 }}>
              {i === FREE ? (
                <span className="w-[78%] h-[78%]"><svg viewBox="0 0 100 100" className="w-full h-full"><StarShape /></svg></span>
              ) : <span className="relative z-[1] w-full" style={{ textWrap: 'balance' } as React.CSSProperties}>{v}</span>}
              <AnimatePresence>
                {on && i !== FREE && (
                  <motion.span key="dab" className="absolute inset-0 pointer-events-none" initial={still ? false : { scale: 1.8, opacity: 0, rotate: -40 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 420, damping: 14 }}>
                    <svg viewBox="0 0 100 100" className="w-full h-full">{k === 'star' ? <g opacity="0.85" transform="translate(10 10) scale(0.8)"><StarShape /></g> : <Splat kind={k ?? 'dab'} colorIndex={colorIndex} i={i} />}</svg>
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// A dauber splat: a round blob of ink with drops around it.
function Splat({ kind, colorIndex, i }: { kind: Mark; colorIndex: number; i: number }) {
  const ink = kind === 'goo' ? '#5cc068' : ['#e5635f', '#6aa9e9', '#c58ce8', '#f39a6b', '#5cc3a0', '#ef7d96', '#9bd35a', '#f6c544', '#7fd6e3', '#d8a46b'][(colorIndex + 1) % 10];
  const r = (k: number) => 4 + ((i * 7 + k * 13) % 6);
  return (
    <g opacity={0.72}>
      <path d="M50 14 C64 12 70 22 80 24 C92 30 86 44 88 52 C90 66 80 72 72 80 C62 90 48 86 38 86 C24 86 16 74 14 62 C10 50 18 42 20 32 C24 18 38 16 50 14z" fill={ink} stroke="#000" strokeWidth="2.5" />
      {[[12, 16], [88, 12], [90, 88], [10, 86], [50, 94]].map(([x, y], k) => (k + i) % 2 ? <circle key={k} cx={x} cy={y} r={r(k)} fill={ink} /> : null)}
      {kind === 'goo' && <path d="M30 84 q0 10 4 12 q4 -2 4 -12 M60 86 q0 8 3 10 q3 -2 3 -10" fill={ink} />}
    </g>
  );
}

function StarShape() {
  return <path d="M50 6l13 29 31 3-24 21 7 31-27-16-27 16 7-31-24-21 31-3z" fill="#f6c544" stroke="#000" strokeWidth="5" strokeLinejoin="round" />;
}

// Another team's card, small: their daubs show as dots in their color.
function Mini({ card, marks, colorIndex, color, size }: { card: string[]; marks: boolean[]; colorIndex: number; color: string; size: number }) {
  return (
    <div className="relative rounded-[12%] border-bold border-border p-[5%] grid grid-cols-5 gap-[4%]" style={{ width: size, height: size, background: color, boxShadow: '0 4px 0 #000' }} aria-label="Another team's card" role="img">
      {card.map((_, i) => <span key={i} className="rounded-[25%] border-thin border-border/60" style={{ background: marks[i] ? (i === FREE ? '#f6c544' : '#241c3d') : '#fbfcf8' }} />)}
      <span className="absolute -top-3 -left-3"><TeamBadge colorIndex={colorIndex} size={Math.max(24, Math.round(size * 0.32))} /></span>
    </div>
  );
}

// Classic power-up pictures, drawn in code.
function Art({ kind }: { kind: string }) {
  const ring = (fill: string) => <circle cx="50" cy="50" r="44" fill={fill} stroke="#000" strokeWidth="5" />;
  const dauber = (ink: string) => <g stroke="#000" strokeWidth="4" strokeLinejoin="round"><rect x="38" y="14" width="24" height="40" rx="6" fill={ink} /><rect x="34" y="50" width="32" height="22" rx="5" fill="#fbfcf8" /><path d="M36 72 h28 l-4 10 h-20z" fill={ink} /></g>;
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      {kind === 'free' && <>{ring('#fdfd94')}{dauber('#ef7d96')}<path d="M18 30 l6 4 M80 28 l-6 5 M16 64 l7 -2" stroke="#000" strokeWidth="4" strokeLinecap="round" /></>}
      {kind === 'wild' && <>{ring('#c58ce8')}<g transform="translate(14 14) scale(0.72)"><StarShape /></g><path d="M78 20 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z M22 70 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" fill="#fff" stroke="#000" strokeWidth="2" /></>}
      {kind === 'double' && <>{ring('#b4c4fb')}<circle cx="36" cy="54" r="20" fill="#6aa9e9" stroke="#000" strokeWidth="4" /><circle cx="36" cy="54" r="9" fill="#fff" stroke="#000" strokeWidth="2.5" /><circle cx="64" cy="44" r="20" fill="#ef7d96" stroke="#000" strokeWidth="4" /><circle cx="64" cy="44" r="9" fill="#fff" stroke="#000" strokeWidth="2.5" /></>}
      {kind === 'peek' && <>{ring('#c8f0dc')}<circle cx="44" cy="44" r="20" fill="#e9eefe" stroke="#000" strokeWidth="6" /><path d="M58 58 L78 78" stroke="#000" strokeWidth="10" strokeLinecap="round" /><path d="M58 58 L78 78" stroke="#c98a4b" strokeWidth="5" strokeLinecap="round" /><circle cx="38" cy="38" r="5" fill="#fff" /></>}
      {kind === 'lucky' && <>{ring('#fff6b0')}<circle cx="50" cy="50" r="28" fill="#f6c544" stroke="#000" strokeWidth="5" /><circle cx="50" cy="50" r="14" fill="#fffbe0" stroke="#000" strokeWidth="3" /><path d="M20 22 l3 6 6 3 -6 3 -3 6 -3 -6 -6 -3 6 -3z" fill="#fff" stroke="#000" strokeWidth="2" /></>}
      {kind === 'sticky' && <>{ring('#f5a08c')}{dauber('#5cc068')}<path d="M40 82 q0 10 4 12 q4 -2 4 -12 M54 82 q0 6 3 8 q3 -2 3 -8" fill="#5cc068" stroke="#000" strokeWidth="2.5" /></>}
      {kind === 'shuffle' && <>{ring('#7fd6e3')}<rect x="20" y="30" width="30" height="30" rx="5" fill="#fbfcf8" stroke="#000" strokeWidth="4" transform="rotate(-14 35 45)" /><rect x="50" y="40" width="30" height="30" rx="5" fill="#fdfd94" stroke="#000" strokeWidth="4" transform="rotate(12 65 55)" /><path d="M30 20 Q50 8 70 22 M70 80 Q50 92 30 78" stroke="#000" strokeWidth="4" fill="none" strokeLinecap="round" /><path d="M66 14 l6 8 -10 2z M34 86 l-6 -8 10 -2z" fill="#000" /></>}
    </svg>
  );
}

function Cover() {
  return (
    <svg viewBox="0 0 100 62" preserveAspectRatio="xMidYMid slice" style={{ background: 'radial-gradient(circle at 50% 30%, #c9d2ff, #8d9df0)' }}>
      <circle cx="22" cy="26" r="15" fill="rgba(251,252,248,0.6)" stroke="#000" strokeWidth="1" />
      {[0, 45, 90, 135].map((a) => <ellipse key={a} cx="22" cy="26" rx="15" ry="5" fill="none" stroke="#241c3d" strokeWidth="0.6" transform={`rotate(${a} 22 26)`} />)}
      {[[18, 22, '#ef7d96'], [26, 24, '#6aa9e9'], [21, 31, '#f6c544']].map(([x, y, f], i) => <circle key={i} cx={x as number} cy={y as number} r="3" fill={f as string} stroke="#000" strokeWidth="0.5" />)}
      <path d="M14 52 L18 40 M30 52 L26 40" stroke="#000" strokeWidth="1.4" /><rect x="10" y="51" width="24" height="3" rx="1.5" fill="#241c3d" />
      <circle cx="36" cy="46" r="6" fill="#8fe3a0" stroke="#000" strokeWidth="0.8" /><circle cx="36" cy="46" r="3" fill="#fff" stroke="#000" strokeWidth="0.4" />
      <rect x="48" y="4" width="46" height="54" rx="3" fill="#f6c544" stroke="#000" strokeWidth="1" />
      {LETTERS.map((l, i) => <g key={l}><circle cx={53.5 + i * 8.8} cy="10" r="3.4" fill={LETTER_COLORS[i]} stroke="#000" strokeWidth="0.5" /><text x={53.5 + i * 8.8} y="11.8" textAnchor="middle" fontSize="4.6" fontWeight="900">{l}</text></g>)}
      {Array.from({ length: 25 }, (_, i) => <rect key={i} x={50 + (i % 5) * 8.8} y={15 + Math.floor(i / 5) * 8.4} width="8" height="7.6" rx="1.2" fill="#fbfcf8" stroke="#000" strokeWidth="0.4" />)}
      {[0, 6, 12, 18, 24, 3, 14].map((i) => <circle key={i} cx={54 + (i % 5) * 8.8} cy={18.8 + Math.floor(i / 5) * 8.4} r="3.4" fill={i === 12 ? '#f6c544' : '#ef7d96'} opacity="0.8" stroke="#000" strokeWidth="0.4" />)}
      <line x1="54" y1="18.8" x2="89.2" y2="52.4" stroke="#fdfd94" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

const def: LabDef = {
  id: 'bingo',
  name: 'Bingo',
  description: 'A ball rolls out with a question. Find the answer on your card and daub it. Five in a row is BINGO!',
  ways: ['teams', 'solo'],
  minTeams: 1,
  maxTeams: 4,
  how: [
    { icon: <Star weight="fill" />, text: 'A ball rolls out with a question' },
    { icon: <HandTap weight="fill" />, text: 'Tap the answer on your card' },
    { icon: <Trophy weight="fill" />, text: 'Five in a row is BINGO' },
  ],
  rounds: { label: 'Balls each', min: 5, max: 30, default: 15 },
  powers: POWERS,
  background: 'radial-gradient(120% 90% at 50% 10%, #c9d2ff 0%, #9aa8f2 60%, #7d8be0 100%)',
  cover: <Cover />,
  pieces: [
    { id: 'background', label: 'Background', hint: 'Behind the cage and cards' },
    { id: 'cage', label: 'Ball cage', hint: 'The spinning wire cage' },
    { id: 'ball', label: 'Ball', hint: 'A called ball (the number goes in the middle)' },
    { id: 'card', label: 'Card', hint: 'The 5 by 5 card with BINGO across the top' },
    { id: 'square', label: 'Square', hint: 'One answer square' },
    { id: 'free', label: 'Free star', hint: 'The middle square' },
    { id: 'daub', label: 'Dauber splat', hint: 'The mark a daub leaves' },
    ...POWERS.map((p) => ({ id: `power-${p.id}`, label: p.name, hint: p.desc })),
  ],
  uses: 'questions',
  Play,
};
export default def;
