import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { AnimatePresence, motion, useAnimate } from 'motion/react';
import { ArrowsClockwise, BowlFood, HandTap, Trophy } from '@phosphor-icons/react';
import { playClip } from '../../../engine/music';
import { TurnCard } from '../../../engine/ShareQuestion';
import type { MultipleChoiceQuestion } from '../../../data/types';
import type { LabCtx, LabDef, LabPower } from '../../types';
import type { WordPair } from '../../words';
import { nextTile, scramble, spelled, wordPoints } from './scramble';

// Word Scramble (Game Lab, inspired by classic anagram games): letter tiles
// jump out of a mixing bowl in a jumbled row on a kitchen counter. Read the
// clue on the recipe card, tap the tiles in order and they hop onto the
// shelf. The right word bursts into confetti. Teams take turns on a word
// each; solo plays a word a round against the egg timer.

const A = '/lab/unscramble';
const img = (f: string) => <img src={`${A}/${f}.webp`} alt="" className="w-full h-full object-contain" draggable={false} />;

const POWERS: LabPower[] = [
  { id: 'first', name: 'First Letter', desc: 'The first letter turns gold and hops onto the shelf for you.', enter: 'drop', art: <Art kind="first" /> },
  { id: 'owl', name: 'Hint Owl', desc: 'A wise owl flies in and points at the right tile, one after another.', enter: 'wiggle', art: <Art kind="owl" /> },
  { id: 'time', name: 'Extra Time', desc: 'Fifteen more seconds on the egg timer.', enter: 'spin', art: img('time') },
  { id: 'peek', name: 'Magic Peek', desc: 'The whole word glows on the shelf for a moment.', enter: 'zoom', art: <Art kind="peek" /> },
  { id: 'double', name: 'Double Points', desc: 'Your next word is worth double.', enter: 'spin', art: img('lightning') },
  { id: 'tornado', name: 'Tornado Tiles', desc: 'Whoosh! A little tornado whirls through your next word and mixes the tiles again.', silly: true, art: img('tornado') },
  { id: 'popcorn', name: 'Popcorn Tiles', desc: 'Pop pop! Your next word\'s tiles bounce like popcorn for a moment.', silly: true, art: <Art kind="popcorn" /> },
];

const asQuestion = (w: WordPair): MultipleChoiceQuestion => ({ id: `us-${w.word}`, kind: 'mc', prompt: w.clue, choices: [w.word], correctIndex: 0 });
const wait = (ms: number) => new Promise((r) => window.setTimeout(r, ms));
// The on-board timer choice, remembered per device. It starts from the
// teacher's Timers setting (ctx.timeScale: 0 off, 1 normal, 1.5 relaxed).
type Pace = 'relaxed' | 'none' | 'quick';
const PACES: Pace[] = ['relaxed', 'none', 'quick'];
const PACE_LABEL: Record<Pace, string> = { relaxed: 'Relaxed', none: 'No timer', quick: 'Quick' };
const PACE_KEY = 'gamify:lab:unscramble:timer';
const paceFrom = (scale: number): Pace => (scale === 0 ? 'none' : scale === 1 ? 'quick' : 'relaxed');
function loadPace(scale: number): Pace { try { const v = localStorage.getItem(PACE_KEY) as Pace | null; return v && PACES.includes(v) ? v : paceFrom(scale); } catch { return paceFrom(scale); } }
function savePace(v: Pace) { try { localStorage.setItem(PACE_KEY, v); } catch { /* private window */ } }
const wordMs = (pace: Pace, len: number) => (pace === 'none' ? Infinity : pace === 'quick' ? (28 + len * 4) * 1000 : (90 + len * 5) * 1000);
type Mode = 'turn' | 'play' | 'busy';

function useAspect() {
  const ref = useRef<HTMLDivElement>(null);
  const [aspect, setAspect] = useState(1.5);
  useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setAspect(e.contentRect.width / Math.max(1, e.contentRect.height)));
    ro.observe(el); return () => ro.disconnect();
  }, []);
  return [ref, aspect] as const;
}

function Play({ ctx }: { ctx: LabCtx }) {
  const c = useRef(ctx); c.current = ctx;
  const clip = (f: string, level = 0.7) => playClip(`${A}/${f}.mp3`, c.current.settings, level);
  const [box, aspect] = useAspect();
  const wide = aspect > 1.1;
  const ar = wide ? Math.min(1.9, Math.max(1.3, aspect)) : 0.82;
  const queue = useRef<WordPair[]>([]);
  const take = () => { if (!queue.current.length) queue.current = c.current.words({ min: 3, max: 8 }); return queue.current.shift()!; };
  const [pair, setPair] = useState<WordPair>(() => take());
  const pairRef = useRef(pair); pairRef.current = pair;
  const [gen, setGen] = useState(0);
  const letters = useMemo(() => [...pair.word], [pair]);
  const [tray, setTray] = useState<number[]>(() => scramble(pair.word)); // tray spot -> tile
  const trayRef = useRef(tray); trayRef.current = tray;
  const [slots, setSlotsState] = useState<(number | null)[]>(() => Array(pair.word.length).fill(null));
  const slotsRef = useRef(slots);
  const setSlots = (s: (number | null)[]) => { slotsRef.current = s; setSlotsState(s); };
  const [locked, setLocked] = useState<number | null>(null); // a slot the First Letter filled
  const lockedRef = useRef(locked); lockedRef.current = locked;
  const [hops, setHops] = useState<Record<number, number>>({});
  const [mode, setModeState] = useState<Mode>('busy');
  const modeRef = useRef(mode);
  const setMode = (m: Mode) => { modeRef.current = m; setModeState(m); };
  const [shake, setShake] = useState(0);
  const [boom, setBoom] = useState(false);
  const [won, setWon] = useState(false);
  const [owl, setOwl] = useState(false);
  const [peek, setPeek] = useState(false);
  const [twister, setTwister] = useState(0);
  const [popcorn, setPopcorn] = useState(false);
  const [double, setDoubleState] = useState(false);
  const doubleRef = useRef(false);
  const setDouble = (v: boolean) => { doubleRef.current = v; setDoubleState(v); };
  const [watch, setWatch] = useState(0);
  const [pace, setPaceState] = useState<Pace>(() => (ctx.timeScale === 0 ? 'none' : loadPace(ctx.timeScale)));
  const [shakeRef, animateShake] = useAnimate();
  const lastTap = useRef(0);
  const paceRef = useRef(pace); paceRef.current = pace;
  const [left, setLeft] = useState(1);
  const total = useRef(1), remain = useRef(1), paused = useRef(false);
  const pending = useRef<Record<string, LabPower[]>>({});
  const silly = useRef<LabPower[]>([]);

  const hop = (tiles: number[]) => setHops((h) => { const n = { ...h }; for (const t of tiles) n[t] = (n[t] ?? 0) + 1; return n; });

  // A new word every turn, tumbling out of the bowl.
  useEffect(() => {
    const x = c.current;
    const w = x.taken === 0 ? pairRef.current : take();
    pairRef.current = w; setPair(w); setGen((g) => g + 1);
    setTray(scramble(w.word)); setSlots(Array(w.word.length).fill(null)); setLocked(null);
    setBoom(false); setWon(false); setOwl(false); setPeek(false); setPopcorn(false); setDouble(false);
    total.current = wordMs(paceRef.current, w.word.length); remain.current = total.current; setLeft(1);
    if (x.taken > 0) clip('bloop');
    if (x.solo) void begin(); else setMode('turn');
  }, [ctx.taken]); // eslint-disable-line react-hooks/exhaustive-deps

  async function begin() {
    const x = c.current;
    const list = x.solo ? [] : pending.current[x.player.id] ?? [];
    if (!x.solo) { pending.current[x.player.id] = []; x.setHeld(x.player.id, []); }
    const oops = silly.current; silly.current = [];
    await wait(c.current.still ? 200 : 700 + pairRef.current.word.length * 110);
    setMode('play');
    for (const p of [...list, ...oops]) { fire(p); await wait(1400); }
  }

  function fire(p: LabPower) {
    const x = c.current;
    if (!p.silly) x.say(`${p.name} is on!`);
    if (p.id === 'double') { setDouble(true); x.sfx.coin(); }
    if (p.id === 'owl') { setOwl(true); clip('bloop'); x.sfx.whistle(); }
    if (p.id === 'peek') { setPeek(true); x.sfx.slideUp(); window.setTimeout(() => setPeek(false), 1800); }
    if (p.id === 'time') {
      setWatch((n) => n + 1); x.sfx.bell();
      if (Number.isFinite(total.current)) { total.current += 15_000; remain.current = Math.min(total.current, remain.current + 15_000); setLeft(remain.current / total.current); }
    }
    if (p.id === 'first') {
      const w = pairRef.current.word, s = [...slotsRef.current];
      const back: number[] = [];
      if (s[0] !== null && letters[s[0]] !== w[0]) { back.push(s[0]); s[0] = null; }
      if (s[0] === null) {
        const used = new Set(s.filter((v): v is number => v !== null));
        const t = letters.findIndex((l, i) => l === w[0] && !used.has(i));
        if (t >= 0) { s[0] = t; hop([t, ...back]); }
      }
      setSlots(s); setLocked(0); x.sfx.coin(); afterPlace();
    }
    if (p.id === 'tornado') {
      // Wait until nobody has placed a tile for a second, then whirl.
      const go = () => { if (Date.now() - lastTap.current < 1000) { window.setTimeout(go, 300); return; } whirl(); };
      const whirl = () => {
      x.say('Tornado Tiles!', 'oops'); x.sfx.wind(); setTwister((n) => n + 1);
      window.setTimeout(() => {
        const keep = lockedRef.current;
        const s = slotsRef.current.map((v, i) => (i === keep ? v : null));
        const moved = slotsRef.current.filter((v, i) => v !== null && i !== keep) as number[];
        setSlots(s); setTray(scramble(pairRef.current.word)); hop([...letters.keys()].filter((i) => !moved.includes(i)).concat(moved));
      }, 900);
      };
      go();
    }
    // Popcorn bounces for a couple of seconds, then the tiles sit still to be tapped.
    if (p.id === 'popcorn') { x.say('Popcorn Tiles!', 'oops'); x.sfx.boing(); setPopcorn(true); window.setTimeout(() => setPopcorn(false), 2500); }
  }

  // The egg timer.
  useEffect(() => {
    if (mode !== 'play') return;
    let last = Date.now();
    const id = window.setInterval(() => {
      const now = Date.now(), dt = now - last; last = now;
      if (paused.current || !Number.isFinite(total.current)) return;
      remain.current = Math.max(0, remain.current - dt);
      setLeft(remain.current / total.current);
      if (remain.current <= 0) void miss(true);
      else if (remain.current < 5000 && Math.floor(remain.current / 1000) !== Math.floor((remain.current + dt) / 1000)) clip('hop', 0.12);
    }, 100);
    return () => window.clearInterval(id);
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Shake the tiles (a stable layer, never remounted), only when allowed.
  useEffect(() => {
    if (!shake || !c.current.shake || !shakeRef.current) return;
    void animateShake(shakeRef.current, { x: [0, -10, 10, -7, 7, 0] }, { duration: 0.45 });
  }, [shake]); // eslint-disable-line react-hooks/exhaustive-deps

  function changePace() {
    const next = PACES[(PACES.indexOf(paceRef.current) + 1) % PACES.length];
    paceRef.current = next; setPaceState(next); savePace(next); c.current.sfx.tick();
    const share = Number.isFinite(total.current) ? remain.current / total.current : 1;
    total.current = wordMs(next, pairRef.current.word.length);
    remain.current = Number.isFinite(total.current) ? total.current * share : Infinity; setLeft(share);
  }

  function tap(t: number) {
    lastTap.current = Date.now();
    if (modeRef.current !== 'play') return;
    const s = [...slotsRef.current], at = s.indexOf(t);
    if (at >= 0) {
      if (at === lockedRef.current) return;
      s[at] = null; setSlots(s); hop([t]); clip('hop', 0.5); c.current.sfx.slideDown();
      return;
    }
    const free = s.findIndex((v) => v === null);
    if (free < 0) return;
    s[free] = t; setSlots(s); hop([t]); clip('hop', 0.6); c.current.sfx.note(free);
    afterPlace();
  }
  function afterPlace() {
    if (slotsRef.current.every((v) => v !== null)) { setMode('busy'); window.setTimeout(() => void check(), 420); }
  }
  function shuffle() {
    if (modeRef.current !== 'play') return;
    const t = [...trayRef.current];
    for (let i = t.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [t[i], t[j]] = [t[j], t[i]]; }
    setTray(t); hop(t.filter((v) => !slotsRef.current.includes(v))); clip('shuffle'); c.current.sfx.whoosh();
  }

  async function check() {
    const x = c.current, w = pairRef.current;
    if (spelled(slotsRef.current, letters) === w.word) {
      const pts = wordPoints(w.word) * (doubleRef.current ? 2 : 1);
      if (doubleRef.current) setDouble(false);
      setOwl(false); setWon(true); hop(slotsRef.current as number[]);
      clip('right'); x.sfx.right(); x.points(pts); x.log(asQuestion(w), true);
      await wait(c.current.still ? 200 : 650);
      setBoom(true); x.sfx.pop(); x.burst(0.42, 0.42, 'big'); x.say(`${w.word}! +${pts}`, 'big');
      await wait(1500);
      // No Extra Time when there is no timer.
      const pw = await c.current.power(0.45, (p) => p.id !== 'time' || paceRef.current !== 'none');
      if (pw) {
        // Every power-up, silly ones too, waits for the earner's own next word.
        if (pw.silly && x.solo) silly.current.push(pw);
        else if (x.solo) pending.current.solo = [...(pending.current.solo ?? []), pw];
        else { pending.current[x.player.id] = [...(pending.current[x.player.id] ?? []), pw]; x.setHeld(x.player.id, pending.current[x.player.id]); }
      }
      c.current.next();
      return;
    }
    await miss(false);
  }

  // A wrong word (or the timer ran out).
  async function miss(timeUp: boolean) {
    const x = c.current, w = pairRef.current;
    setMode('busy'); setOwl(false);
    if (!timeUp) { setShake((n) => n + 1); x.sfx.wrong(); }
    else { x.sfx.slideDown(); x.say("Let's look together"); }
    await wait(700);
    if (x.solo && !timeUp) {
      const keep = lockedRef.current;
      const back = slotsRef.current.filter((v, i) => v !== null && i !== keep) as number[];
      setSlots(slotsRef.current.map((v, i) => (i === keep ? v : null))); hop(back);
      x.say('Try again!', 'oops');
      setMode('play'); return;
    }
    // Show the right word, tile by tile.
    if (!x.cpu) x.log(asQuestion(w), false);
    setSlots(Array(w.word.length).fill(null)); hop([...letters.keys()]);
    await wait(400);
    const used = new Set<number>(), s: (number | null)[] = Array(w.word.length).fill(null);
    for (let i = 0; i < w.word.length; i++) {
      const t = letters.findIndex((l, k) => l === w.word[i] && !used.has(k)); used.add(t); s[i] = t;
      setSlots([...s]); hop([t]); x.sfx.note(i);
      await wait(180);
    }
    x.say(timeUp ? w.word : `It was ${w.word}`, timeUp ? 'good' : 'oops');
    await wait(2000);
    c.current.next();
  }

  // Solo's own power-ups switch on with the next word.
  useEffect(() => {
    if (!ctx.solo || mode !== 'play') return;
    const list = pending.current.solo ?? []; if (!list.length) return;
    pending.current.solo = [];
    void (async () => { for (const p of list) { fire(p); await wait(1400); } })();
  }, [mode, gen]); // eslint-disable-line react-hooks/exhaustive-deps

  // The keyboard: type a letter to send its tile up, Backspace to send one back.
  useEffect(() => {
    if (mode !== 'play' || ctx.cpu) return;
    const on = (ev: KeyboardEvent) => {
      if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
      if (/^[a-z]$/i.test(ev.key)) {
        const l = ev.key.toUpperCase(), s = slotsRef.current;
        const t = trayRef.current.find((i) => letters[i] === l && !s.includes(i));
        if (t !== undefined) { ev.preventDefault(); tap(t); }
      } else if (ev.key === 'Backspace') {
        const s = slotsRef.current; let i = s.length - 1;
        while (i >= 0 && (s[i] === null || i === lockedRef.current)) i--;
        if (i >= 0) { ev.preventDefault(); tap(s[i]!); }
      }
    };
    window.addEventListener('keydown', on); return () => window.removeEventListener('keydown', on);
  }, [mode, ctx.cpu, letters]); // eslint-disable-line react-hooks/exhaustive-deps

  // The computer taps its own tiles.
  useEffect(() => {
    if (!ctx.cpu || mode !== 'play') return;
    let live = true;
    const right = c.current.cpuRight(), slip = right ? -1 : Math.floor(Math.random() * letters.length);
    void (async () => {
      await wait(1200);
      for (let k = 0; k < letters.length && live && modeRef.current === 'play'; k++) {
        const s = slotsRef.current;
        if (s[k] !== null) continue;
        let t = nextTile(pairRef.current.word, s, letters);
        if (k === slip) { const others = trayRef.current.filter((i) => !s.includes(i) && i !== t); if (others.length) t = others[0]; }
        if (t < 0) break;
        tap(t); await wait(650);
      }
    })();
    return () => { live = false; };
  }, [ctx.cpu, mode, gen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Where everything sits (percent of the board).
  const n = letters.length;
  const tileW = Math.min(wide ? 8.4 : 12.5, (wide ? 80 : 92) / n / 1.14);
  const tileH = tileW * ar;
  const step = tileW * 1.14;
  const x0 = 50 - (step * (n - 1)) / 2 - tileW / 2;
  const SLOT_Y = wide ? 35 : 37, TRAY_Y = wide ? 61 : 59;
  const spot = (i: number) => ({ left: x0 + i * step, top: 0 });
  const posOf = (t: number) => {
    const at = slots.indexOf(t);
    if (at >= 0) return { left: spot(at).left, top: SLOT_Y - tileH / 2 };
    return { left: spot(tray.indexOf(t)).left, top: TRAY_Y - tileH / 2 };
  };
  const hint = owl && mode === 'play' ? nextTile(pair.word, slots, letters) : -1;
  const bowl = { w: wide ? 24 : 38, top: wide ? 73 : 74 };

  return (
    <div ref={box} className="absolute inset-0 grid place-items-center">
      <div className="lab-fit relative" style={{ '--ar': ar, containerType: 'size' } as CSSProperties}>
        <Kitchen wide={wide} />
        {/* The recipe card with the clue. */}
        <AnimatePresence mode="wait">
          <motion.div key={gen} className="absolute left-1/2 grid content-center justify-items-center text-center rounded-[1.2rem] border-heavy border-border px-[3%]"
            style={{ top: '3%', width: wide ? '62%' : '90%', height: wide ? '20%' : '19%', x: '-50%', background: '#fffdf0', boxShadow: '0 6px 0 #000, 0 16px 26px rgba(36,28,61,0.25)' }}
            initial={ctx.still ? false : { y: -40, rotate: -4, opacity: 0 }} animate={{ y: 0, rotate: -1, opacity: 1 }} exit={{ y: -30, opacity: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }} aria-live="polite">
            <span aria-hidden="true" className="absolute -top-[0.9rem] left-1/2 -translate-x-1/2 w-[18%] h-[1.5rem] rounded-md border-std border-border" style={{ background: 'rgba(253,253,148,0.9)', rotate: '3deg' }} />
            <span className="absolute inset-x-[4%] top-[22%] border-t-2 border-dashed" style={{ borderColor: '#f5a08c' }} aria-hidden="true" />
            <span className="font-bold leading-snug text-balance" style={{ fontSize: `max(1rem, ${(wide ? 4.6 : 4.2) * (pair.clue.length > 60 ? 0.75 : pair.clue.length > 35 ? 0.88 : 1)}${wide ? 'cqh' : 'cqw'})` }}>{pair.clue}</span>
          </motion.div>
        </AnimatePresence>

        {/* The shelf and its slots. */}
        <div className="absolute rounded-[0.8rem] border-heavy border-border" style={{ left: `${x0 - 2.5}%`, width: `${step * (n - 1) + tileW + 5}%`, top: `${SLOT_Y + tileH / 2 + 0.5}%`, height: '3.4%', background: '#c98a52', boxShadow: '0 5px 0 #000' }} aria-hidden="true" />
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          {letters.map((_, i) => (
            <div key={i} className="absolute rounded-[22%] border-[3px] border-dashed" style={{ left: `${spot(i).left}%`, top: `${SLOT_Y - tileH / 2}%`, width: `${tileW}%`, height: `${tileH}%`, borderColor: '#241c3d', background: 'rgba(251,252,248,0.5)' }}>
              <AnimatePresence>
                {peek && <motion.span className="absolute inset-0 grid place-items-center font-heading font-bold" style={{ fontSize: `calc(${tileW}cqw * 0.55)`, color: 'rgba(36,28,61,0.45)' }} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.06 }}>{pair.word[i]}</motion.span>}
              </AnimatePresence>
            </div>
          ))}
        </div>
        {/* The empty spots on the counter. */}
        {letters.map((_, i) => (
          <div key={`spot-${i}`} className="absolute rounded-[22%]" aria-hidden="true" style={{ left: `${spot(i).left + tileW * 0.08}%`, top: `${TRAY_Y + tileH * 0.32}%`, width: `${tileW * 0.84}%`, height: `${tileH * 0.25}%`, background: 'rgba(36,28,61,0.18)', filter: 'blur(2px)' }} />
        ))}

        {/* The mixing bowl. */}
        <motion.div className="absolute" style={{ left: `${50 - bowl.w / 2}%`, top: `${bowl.top}%`, width: `${bowl.w}%`, height: `${100 - bowl.top}%` }} key={`bowl-${gen}`}
          animate={ctx.still ? undefined : { rotate: [0, -4, 4, -2, 0], scaleY: [1, 0.92, 1.04, 1] }} transition={{ duration: 0.7 }}>
          <Bowl />
        </motion.div>

        {/* The letter tiles. */}
        <div ref={shakeRef} className="absolute inset-0" role="group" aria-label="Letter tiles">
          {letters.map((l, t) => {
            const p = posOf(t), inSlot = slots.includes(t), gold = locked !== null && slots[locked] === t;
            const k = hops[t] ?? 0;
            return (
              <motion.button key={`${gen}-${t}`} type="button" onClick={() => tap(t)} disabled={mode !== 'play' || ctx.cpu || gold}
                aria-label={inSlot ? `${l}, on the shelf` : l}
                className="absolute rounded-[22%] border-heavy border-border font-heading font-bold grid place-items-center disabled:cursor-default"
                style={{ width: `${tileW}%`, height: `${tileH}%`, fontSize: `calc(${tileW}cqw * 0.55)`, color: '#241c3d', background: won ? '#8fe3a0' : gold ? '#f6c544' : hint === t ? '#fdfd94' : '#fbfcf8', boxShadow: hint === t ? '0 0 0 4px #fdfd94, 0 6px 0 #000' : '0 6px 0 #000', zIndex: inSlot ? 3 : 2 }}
                initial={ctx.still ? { left: `${p.left}%`, top: `${p.top}%` } : { left: `${50 - tileW / 2}%`, top: `${bowl.top + 4}%`, scale: 0.3, rotate: 0, opacity: 0 }}
                animate={boom && !ctx.still ? { left: `${p.left + (t - n / 2) * 9}%`, top: `${p.top - 30 - ((t * 37) % 20)}%`, scale: 0.2, rotate: (t % 2 ? 1 : -1) * 400, opacity: 0 } : { left: `${p.left}%`, top: `${p.top}%`, scale: 1, rotate: 0, opacity: 1 }}
                transition={boom ? { duration: 0.9, ease: 'easeOut' } : { type: 'spring', stiffness: 170, damping: 17, delay: k === 0 && !ctx.still ? 0.15 + t * 0.11 : 0 }}
                whileHover={mode === 'play' && !ctx.cpu && !ctx.still ? { scale: 1.08 } : undefined} whileTap={{ scale: 0.9 }}>
                <motion.span key={k} className="grid place-items-center w-full h-full" initial={false}
                  animate={ctx.still ? undefined : popcorn && !inSlot ? { y: [0, -18, 0, -6, 0], scaleY: [1, 1.12, 0.86, 1] } : { y: [0, -26, 0], scaleX: [1, 0.9, 1.12, 1], scaleY: [1, 1.12, 0.86, 1] }}
                  transition={popcorn && !inSlot ? { duration: 0.7 + (t % 3) * 0.15, repeat: 2, delay: t * 0.1 } : { duration: 0.42, ease: 'easeOut' }}>
                  {l}
                </motion.span>
              </motion.button>
            );
          })}
        </div>

        {/* The owl points at the next tile. */}
        <AnimatePresence>
          {owl && hint >= 0 && (
            <motion.div key="owl" className="absolute pointer-events-none z-10" style={{ width: `${tileW * 1.1}%`, height: `${tileW * 1.1 * ar}%` }}
              initial={ctx.still ? false : { left: '-10%', top: '-10%', rotate: -30 }} animate={{ left: `${posOf(hint).left - tileW * 0.05}%`, top: `${posOf(hint).top - tileH * 1.05}%`, rotate: 0, y: ctx.still ? 0 : [0, -6, 0] }}
              exit={{ top: '-20%', opacity: 0 }} transition={{ type: 'spring', stiffness: 90, damping: 13, y: { duration: 0.8, repeat: 2 } }}>
              <Art kind="owl" />
            </motion.div>
          )}
        </AnimatePresence>
        {/* The tornado whirls through. */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-20"><AnimatePresence>
          {twister > 0 && !ctx.still && (
            <motion.div key={twister} className="absolute pointer-events-none z-20" style={{ width: '22%', top: '40%', aspectRatio: '1' }}
              initial={{ left: '-25%', rotate: 0 }} animate={{ left: '105%', rotate: 720, y: [0, -20, 10, -10, 0] }} transition={{ duration: 1.8, ease: 'easeInOut' }}
              onAnimationComplete={() => setTwister(0)}>{img('tornado')}</motion.div>
          )}
        </AnimatePresence></div>

        {/* Shuffle and the egg timer sit beside the bowl. */}
        <motion.button type="button" onClick={shuffle} disabled={mode !== 'play' || ctx.cpu} aria-label="Mix the tiles"
          className="absolute rounded-full border-heavy border-border bg-accent flex flex-col items-center justify-center gap-[4%] disabled:opacity-60"
          style={{ left: `${50 - bowl.w / 2 - (wide ? 14 : 22)}%`, top: `${bowl.top + 6}%`, width: `${wide ? 10 : 17}%`, aspectRatio: '1', minWidth: 48, boxShadow: '0 5px 0 #000' }}
          whileHover={ctx.still ? undefined : { scale: 1.08, rotate: 20 }} whileTap={{ scale: 0.9, rotate: 180 }}>
          <ArrowsClockwise weight="bold" className="w-[42%] h-[42%]" aria-hidden="true" />
          <span className="font-display leading-none" style={{ fontSize: `max(0.9rem, ${wide ? 2.6 : 3.4}cqh)` }}>Mix</span>
        </motion.button>
        {pace !== 'none' && <EggTimer left={left} watch={watch} double={double} still={ctx.still} style={{ left: `${50 + bowl.w / 2 + (wide ? 4 : 5)}%`, top: `${bowl.top + 4}%`, width: `${wide ? 9 : 15}%` }} />}
        {ctx.timeScale !== 0 && <button type="button" onClick={changePace} className="absolute min-h-11 px-3 rounded-pill border-std border-border bg-surface font-bold leading-none whitespace-nowrap motion-safe:hover:scale-105 motion-safe:transition-transform"
          style={{ right: '2%', bottom: '3%', fontSize: `max(0.8rem, ${wide ? 2.4 : 3}cqh)`, boxShadow: '0 3px 0 #000' }} aria-label={`Timer: ${PACE_LABEL[pace]}. Tap to change.`}>
          Timer: {PACE_LABEL[pace]}
        </button>}
      </div>
      {mode === 'turn' && !ctx.solo && <TurnCard key={ctx.taken} player={ctx.player} onStart={() => void begin()} />}
    </div>
  );
}

// The round egg timer, with a stopwatch that flies in for Extra Time.
function EggTimer({ left, watch, double, still, style }: { left: number; watch: number; double: boolean; still: boolean; style: CSSProperties }) {
  const low = left < 0.2;
  const r = 40, len = 2 * Math.PI * r;
  return (
    <div className="absolute aspect-square" style={{ ...style, minWidth: 48 }} role="progressbar" aria-label="Time left" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(left * 100)}>
      <motion.svg viewBox="0 0 100 100" className="w-full h-full" style={{ filter: 'drop-shadow(0 5px 0 #000)' }}>
        <circle cx="50" cy="50" r="46" fill="#fbfcf8" stroke="#000" strokeWidth="5" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={low ? '#ef7d96' : '#f6c544'} strokeWidth="11" strokeDasharray={`${len * left} ${len}`} transform="rotate(-90 50 50)" style={{ transition: 'stroke-dasharray .1s linear' }} />
        <path d="M38 30h24M38 70h24M41 31q0 14 9 19-9 5-9 19M59 31q0 14-9 19 9 5 9 19" stroke="#241c3d" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M44 66q6-7 12 0z" fill="#f5a08c" />
      </motion.svg>
      <AnimatePresence>
        {watch > 0 && !still && (
          <motion.span key={watch} className="absolute inset-0" initial={{ y: -160, scale: 1.4, opacity: 0 }} animate={{ y: [-160, 0, 0], scale: [1.4, 1, 0.2], opacity: [0, 1, 0] }} transition={{ duration: 1.3, times: [0, 0.5, 1] }}>
            {img('time')}
          </motion.span>
        )}
      </AnimatePresence>
      {double && <motion.span className="absolute -top-[18%] -right-[18%] w-[55%] aspect-square rounded-full border-heavy border-border bg-accent grid place-items-center font-display" style={{ fontSize: 'max(0.9rem, 2.6cqh)' }} initial={still ? false : { scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }}>x2</motion.span>}
    </div>
  );
}

// The Classic kitchen: a counter top under the tiled wall.
function Kitchen({ wide }: { wide: boolean }) {
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      <div className="absolute inset-x-0 rounded-[1.4rem] border-heavy border-border" style={{ top: '50%', bottom: 0, background: 'linear-gradient(180deg, #e7b98a 0%, #d49a62 12%, #c98a52 100%)', boxShadow: 'inset 0 10px 0 #f0cfa6, 0 -2px 0 rgba(0,0,0,0.1)' }} />
      <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="absolute inset-x-0 w-full" style={{ top: '56%', height: '40%', opacity: 0.25 }}>
        {[3, 8, 13, 17].map((y, i) => <path key={i} d={`M0 ${y} Q25 ${y - 1.5} 50 ${y} T100 ${y}`} stroke="#8a5a2e" strokeWidth="0.4" fill="none" />)}
      </svg>
      {/* A little jar and a whisk on the counter. */}
      <svg viewBox="0 0 40 50" className="absolute" style={{ right: '3%', top: wide ? '39%' : '42%', width: wide ? '7%' : '11%' }}>
        <rect x="6" y="14" width="28" height="34" rx="6" fill="#b4c4fb" stroke="#000" strokeWidth="2.5" /><rect x="4" y="6" width="32" height="10" rx="3" fill="#ef7d96" stroke="#000" strokeWidth="2.5" /><rect x="11" y="24" width="18" height="12" rx="3" fill="#fbfcf8" stroke="#000" strokeWidth="2" />
      </svg>
      <svg viewBox="0 0 60 20" className="absolute" style={{ left: '3%', top: wide ? '45%' : '46%', width: wide ? '10%' : '15%', rotate: '-12deg' }}>
        <rect x="0" y="7" width="26" height="6" rx="3" fill="#241c3d" stroke="#000" strokeWidth="1.5" /><path d="M26 10q16-12 32 0q-16 12-32 0zM26 10q16-6 32 0M26 10q16 6 32 0" stroke="#7383ad" strokeWidth="2" fill="none" />
      </svg>
    </div>
  );
}

function Bowl() {
  return (
    <svg viewBox="0 0 120 70" className="w-full h-full" preserveAspectRatio="xMidYMin meet" style={{ filter: 'drop-shadow(0 6px 0 #000)' }} aria-hidden="true">
      <ellipse cx="60" cy="14" rx="56" ry="11" fill="#241c3d" stroke="#000" strokeWidth="3" />
      <ellipse cx="60" cy="15" rx="48" ry="7" fill="#3a3160" />
      <path d="M4 14q4 50 56 52q52-2 56-52q-8 12-56 12T4 14z" fill="#ef7d96" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
      <path d="M16 30q8 20 30 26" stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.6" />
      {[30, 52, 74, 92].map((x, i) => <circle key={i} cx={x} cy={38 + (i % 2) * 6} r="3" fill="#fbfcf8" opacity="0.85" />)}
    </svg>
  );
}

// Classic power-up pictures, drawn in code.
function Art({ kind }: { kind: string }) {
  const ring = (fill: string) => <circle cx="50" cy="50" r="44" fill={fill} stroke="#000" strokeWidth="5" />;
  if (kind === 'owl') return (
    <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
      <ellipse cx="50" cy="58" rx="32" ry="36" fill="#a97b52" stroke="#000" strokeWidth="5" />
      <path d="M22 30l8-20 14 14M78 30l-8-20-14 14" fill="#a97b52" stroke="#000" strokeWidth="5" strokeLinejoin="round" />
      <ellipse cx="50" cy="70" rx="18" ry="20" fill="#f5d6b0" />
      <circle cx="37" cy="44" r="13" fill="#fff" stroke="#000" strokeWidth="4" /><circle cx="63" cy="44" r="13" fill="#fff" stroke="#000" strokeWidth="4" />
      <circle cx="39" cy="46" r="6" /><circle cx="61" cy="46" r="6" /><circle cx="41" cy="44" r="2" fill="#fff" /><circle cx="63" cy="44" r="2" fill="#fff" />
      <path d="M45 56l5 9 5-9z" fill="#f6c544" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
      <path d="M44 90l-4 6M56 90l4 6" stroke="#f6c544" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
      {kind === 'first' && <>{ring('#b4c4fb')}<rect x="26" y="26" width="48" height="48" rx="11" fill="#f6c544" stroke="#000" strokeWidth="5" /><text x="50" y="62" textAnchor="middle" fontSize="32" fontWeight="800" fontFamily="Inclusive Sans, sans-serif">A</text><path d="M78 20l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#fff" stroke="#000" strokeWidth="2" /></>}
      {kind === 'peek' && <>{ring('#241c3d')}<path d="M14 50q36-36 72 0q-36 36-72 0z" fill="#fbfcf8" stroke="#000" strokeWidth="4" /><circle cx="50" cy="50" r="14" fill="#8fe3a0" stroke="#000" strokeWidth="4" /><circle cx="50" cy="50" r="6" /><circle cx="54" cy="46" r="2.5" fill="#fff" />{[[50, 14], [80, 22], [20, 22]].map(([x, y], i) => <path key={i} d={`M${x} ${y - 6}l2 4 4 2-4 2-2 4-2-4-4-2 4-2z`} fill="#fdfd94" />)}</>}
      {kind === 'popcorn' && <>{ring('#fdfd94')}<path d="M30 48l6 38h28l6-38z" fill="#fbfcf8" stroke="#000" strokeWidth="4" strokeLinejoin="round" /><path d="M40 48l2 38M50 48v38M60 48l-2 38" stroke="#ef7d96" strokeWidth="5" />{[[34, 42], [46, 34], [58, 40], [66, 32], [42, 24], [56, 22]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="8" fill="#fffdf0" stroke="#000" strokeWidth="3" />)}</>}
    </svg>
  );
}

function Cover() {
  return (
    <svg viewBox="0 0 100 62" preserveAspectRatio="xMidYMid slice" style={{ background: 'linear-gradient(180deg, #c9d2ff 0 58%, #d49a62 58% 100%)' }}>
      <rect x="22" y="5" width="56" height="13" rx="2.5" fill="#fffdf0" stroke="#000" strokeWidth="0.7" transform="rotate(-1.5 50 11)" />
      <rect x="30" y="8.5" width="40" height="2" rx="1" fill="#cdd7fb" /><rect x="34" y="12.5" width="32" height="2" rx="1" fill="#cdd7fb" />
      {['C', 'A', 'K', 'E'].map((l, i) => (
        <g key={i} transform={`translate(${31 + i * 10} 23)`}><rect width="8.5" height="8.5" rx="2" fill={i === 0 ? '#f6c544' : '#fbfcf8'} stroke="#000" strokeWidth="0.8" /><text x="4.25" y="6.4" textAnchor="middle" fontSize="5.6" fontWeight="800" fontFamily="Inclusive Sans, sans-serif" fill="#241c3d">{l}</text></g>
      ))}
      <rect x="29" y="32.3" width="42" height="2" rx="0.8" fill="#c98a52" stroke="#000" strokeWidth="0.5" />
      {[['E', 18, 38, -14], ['K', 34, 41, 10], ['A', 66, 41, -8], ['C', 78, 39, 16]].map(([l, x, y, r], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}><rect x="-4.2" y="-4.2" width="8.4" height="8.4" rx="2" fill="#fbfcf8" stroke="#000" strokeWidth="0.8" /><text y="2.1" textAnchor="middle" fontSize="5.6" fontWeight="800" fontFamily="Inclusive Sans, sans-serif" fill="#241c3d">{l}</text></g>
      ))}
      <path d="M30 44q20 6 40 0q-2 16-20 16t-20-16z" fill="#ef7d96" stroke="#000" strokeWidth="0.8" /><ellipse cx="50" cy="44" rx="20" ry="3.4" fill="#241c3d" stroke="#000" strokeWidth="0.8" />
      <path d="M26 36q4-6 8-4M66 32q6-4 9 2" stroke="#000" strokeWidth="0.5" fill="none" strokeDasharray="1 1" />
    </svg>
  );
}

const def: LabDef = {
  id: 'unscramble',
  name: 'Word Scramble',
  description: 'Letter tiles tumble out of the mixing bowl all jumbled. Read the clue and put the word back together.',
  ways: ['solo', 'teams'],
  minTeams: 2,
  maxTeams: 6,
  uses: 'words',
  how: [
    { icon: <BowlFood weight="fill" />, text: 'Read the clue on the card' },
    { icon: <HandTap weight="fill" />, text: 'Tap the tiles in order' },
    { icon: <Trophy weight="fill" />, text: 'The right word bursts into confetti' },
  ],
  rounds: { label: 'Rounds', min: 1, max: 20, default: 5 },
  powers: POWERS,
  background: 'linear-gradient(90deg, rgba(255,255,255,0.18) 2px, transparent 2px) 0 0 / 46px 46px, linear-gradient(0deg, rgba(255,255,255,0.18) 2px, transparent 2px) 0 0 / 46px 46px, linear-gradient(180deg, #c9d2ff 0%, #a8b6f6 70%, #93a3ee 100%)',
  cover: <Cover />,
  pieces: [
    { id: 'background', label: 'Wall', hint: 'The tiled kitchen wall behind everything' },
    { id: 'counter', label: 'Counter', hint: 'The counter top the tiles land on' },
    { id: 'bowl', label: 'Mixing bowl', hint: 'The bowl the tiles jump out of' },
    { id: 'tile', label: 'Letter tile', hint: 'One letter tile' },
    { id: 'shelf', label: 'Shelf', hint: 'The shelf the word is built on' },
    { id: 'card', label: 'Recipe card', hint: 'The card that shows the clue' },
    { id: 'timer', label: 'Egg timer', hint: 'The round timer by the bowl' },
    ...POWERS.map((p) => ({ id: `power-${p.id}`, label: p.name, hint: p.desc })),
  ],
  Play,
};
export default def;
