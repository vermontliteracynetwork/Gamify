import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowsLeftRight, CheckCircle, Coins, HandGrabbing, Trophy } from '@phosphor-icons/react';
import { playClip } from '../../../engine/music';
import { TeamBadge } from '../../../engine/TeamBadge';
import type { LabCtx, LabDef, LabPower } from '../../types';
import { applyChest, DOUBLE_CAP, heapRows, needsTarget, randomOther, rollChests, type Chest } from './rules';

// Treasure Quest (Game Lab, inspired by the general idea of chest-picking
// quiz games): answer right, then pick one of three wobbling chests on a
// treasure beach. Each holds a surprise: gold, double, a loss, a take, a
// swap, or a moth. Every team's gold heap grows beside the beach; the
// richest pile wins.

const A = '/lab/treasure-quest';
const COIN = `${A}/coin.webp`;

const POWERS: LabPower[] = [
  { id: 'map', name: 'Treasure Map', desc: 'Peek inside one chest before you pick.', enter: 'drop', art: <Art kind="map" /> },
  { id: 'clover', name: 'Lucky Clover', desc: 'No bad luck: every chest holds gold or better.', enter: 'spin', art: <Art kind="clover" /> },
  { id: 'shovel', name: 'Two Picks', desc: 'Dig in twice: open two chests this turn.', enter: 'wiggle', art: <Art kind="shovel" /> },
  { id: 'rush', name: 'Gold Rush', desc: 'Gold from your chest counts double.', enter: 'zoom', art: <ImgArt src={`${A}/lightning.webp`} ring="#fff6b0" /> },
  { id: 'magnet', name: 'Gold Magnet', desc: 'Pull 10 gold from every other team.', takes: true, enter: 'spin', art: <ImgArt src={`${A}/magnet.webp`} ring="#ffd9cf" /> },
  { id: 'shield', name: 'Pirate Shield', desc: 'Keeps your gold safe from the next take or swap.', enter: 'drop', art: <ImgArt src={`${A}/shield.webp`} ring="#cfe0ff" /> },
  { id: 'parrot', name: 'Parrot Pal', desc: 'A parrot flies by and drops 20 gold on your pile.', enter: 'wiggle', art: <Art kind="parrot" /> },
  { id: 'sneeze', name: 'Sneezy Chests', desc: 'Achoo! The chests sneeze and shuffle what is inside.', silly: true, art: <Art kind="sneeze" /> },
  { id: 'crab', name: 'Crab Pinch', desc: 'A crab grabs a coin, trips, and the coin rolls right back.', silly: true, art: <Art kind="crab" /> },
  // Chest surprises the teacher switches on in setup (they start off).
  { id: 'take', name: 'Take Chest', desc: 'Some chests take a little gold from a team that has some.', takes: true, enter: 'zoom', art: <Art kind="take" /> },
  { id: 'swap', name: 'Swap Chest', desc: 'Some chests swap gold piles with another team.', takes: true, enter: 'spin', art: <Art kind="swap" /> },
];
const SHIELD = POWERS.find((p) => p.id === 'shield')!;
// Chest outcomes listed as power-ups so setup can switch them; never dealt as cards.
const OUTCOMES = ['take', 'swap'];
const FLAT = 10; // gold for every right answer, before the chest
const TRY_COIN = 2; // a coin for trying after a miss

type Mode = 'wait' | 'busy' | 'pick' | 'target';
interface Box { id: number; c: Chest }
interface Fx { id: number; kind: string }
interface Pop { id: number; slot: number; text: string; good: boolean }

let uid = 0;
const sleep = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

function useBox() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 900, h: 600 });
  useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

// The app's page transition starts with initial={false}, which skips every
// mount animation on a freshly loaded game page (a code or a link opens one
// straight away); a fresh presence scope lets every piece animate in.
function Play({ ctx }: { ctx: LabCtx }) {
  return <AnimatePresence><Board key="board" ctx={ctx} /></AnimatePresence>;
}

function Board({ ctx }: { ctx: LabCtx }) {
  const c = useRef(ctx); c.current = ctx;
  const [ref, size] = useBox();
  const wide = size.w / Math.max(1, size.h) > 1.15;
  const [mode, setMode] = useState<Mode>('wait');
  const [boxes, setBoxes] = useState<Box[]>(() => [0, 1, 2].map(() => ({ id: ++uid, c: { kind: 'moth' } as Chest })));
  const boxesRef = useRef(boxes); boxesRef.current = boxes;
  const [opened, setOpened] = useState<number[]>([]);
  const openedRef = useRef(opened); openedRef.current = opened;
  const [reveal, setReveal] = useState(false);
  const [peek, setPeek] = useState<number | null>(null);
  const [glow, setGlow] = useState<'clover' | 'rush' | null>(null);
  const [fx, setFx] = useState<Fx | null>(null);
  const [pops, setPops] = useState<Pop[]>([]);
  const [targets, setTargets] = useState<string[]>([]);
  const [shields, setShields] = useState<string[]>([]);
  const shieldsRef = useRef(shields); shieldsRef.current = shields;
  const [sneeze, setSneeze] = useState(false);
  const turn = useRef(0);
  const picks = useRef(1);
  const rush = useRef(false);
  const chooseRef = useRef<((id: string) => void) | null>(null);
  const me = ctx.player;
  const players = ctx.turns.players;

  const scores = () => Object.fromEntries(c.current.turns.players.map((p) => [p.id, p.score]));
  const alive = (t: number) => turn.current === t;
  useEffect(() => () => { turn.current = -1; }, []);

  const freshChests = (clover = false) => {
    const s = scores(), id = c.current.player.id;
    const others = Object.entries(s).some(([k, v]) => k !== id && v > 0);
    // Which chest surprises are switched on: ask the kit which power-ups it would deal.
    const on = new Set<string>();
    void c.current.power(0, (p) => { on.add(p.id); return false; });
    return rollChests({ others, mine: s[id] ?? 0, clover, take: on.has('take'), swap: on.has('swap') }).map((ch) => ({ id: ++uid, c: ch }));
  };

  // Every turn: a question, a surprise power-up now and then, then a chest.
  useEffect(() => {
    const t = ++turn.current;
    const x = c.current;
    setMode('wait'); setOpened([]); setReveal(false); setPeek(null); setGlow(null); setTargets([]);
    picks.current = 1; rush.current = false;
    void x.ask().then(async (ok) => {
      if (!alive(t)) return;
      if (!ok) { c.current.sfx.wrong(); await sleep(500); if (!alive(t)) return; c.current.points(TRY_COIN); c.current.sfx.coin(); c.current.say(`+${TRY_COIN}: a coin for trying`, 'good'); await sleep(1300); if (alive(t)) c.current.next(); return; }
      c.current.points(FLAT); c.current.sfx.coin(); c.current.say(`+${FLAT} gold!`, 'good');
      await sleep(900); if (!alive(t)) return;
      setBoxes(freshChests()); setMode('busy');
      c.current.sfx.whoosh();
      await sleep(500);
      if (!alive(t)) return;
      const p = await c.current.power(0.45, (pw) => !OUTCOMES.includes(pw.id));
      if (!alive(t)) return;
      if (p) await fire(p, t);
      if (!alive(t)) return;
      setMode('pick');
    });
  }, [ctx.taken]); // eslint-disable-line react-hooks/exhaustive-deps

  function show(kind: string) { setFx({ id: ++uid, kind }); }

  // Each power-up plays its own little show, then the turn goes on.
  async function fire(p: LabPower, t: number) {
    const x = c.current, id = x.player.id;
    show(p.id);
    if (p.id === 'map') {
      x.sfx.slideUp();
      const good = boxesRef.current.findIndex((b) => b.c.kind === 'gold' || b.c.kind === 'double');
      await sleep(900); if (!alive(t)) return;
      setPeek(good >= 0 && Math.random() < 0.6 ? good : Math.floor(Math.random() * 3)); x.sfx.bell();
      await sleep(700);
    } else if (p.id === 'clover') {
      x.sfx.power(); await sleep(700); if (!alive(t)) return;
      setBoxes(freshChests(true)); setGlow('clover'); x.sfx.note(4); await sleep(800);
    } else if (p.id === 'shovel') {
      picks.current = 2; x.sfx.thud(); await sleep(450); x.sfx.thud(); await sleep(900);
    } else if (p.id === 'rush') {
      rush.current = true; x.sfx.zap(); await sleep(300); setGlow('rush'); x.sfx.coin(); await sleep(1000);
    } else if (p.id === 'magnet') {
      x.sfx.magnet();
      await sleep(900); if (!alive(t)) return;
      const s = scores(); let got = 0;
      for (const pl of c.current.turns.players) {
        if (pl.id === id || !s[pl.id]) continue;
        if (shieldsRef.current.includes(pl.id)) { dropShield(pl.id); continue; }
        const n = Math.min(10, s[pl.id]); s[pl.id] -= n; got += n;
      }
      s[id] += got; x.setScores(s); x.sfx.coin(); x.say(got ? `+${got} gold!` : 'Blocked!', got ? 'good' : 'oops');
      await sleep(900);
    } else if (p.id === 'shield') {
      setShields((list) => [...new Set([...list, id])]);
      x.setHeld(id, [...(x.held[id] ?? []).filter((h) => h.id !== 'shield'), SHIELD]); x.sfx.bell(); await sleep(1300);
    } else if (p.id === 'parrot') {
      x.sfx.whistle(); await sleep(900); if (!alive(t)) return;
      x.points(20); x.sfx.coin(); x.burst(wide ? 0.6 : 0.5, 0.55); await sleep(900);
    } else if (p.id === 'sneeze') {
      x.sfx.boing(); setSneeze(true); await sleep(700); setSneeze(false); if (!alive(t)) return;
      x.say('Achoo!', 'oops'); x.sfx.whoosh();
      const fresh = freshChests();
      setBoxes((b) => [b[2], b[0], b[1]].map((bx, i) => ({ id: bx.id, c: fresh[i].c })));
      await sleep(1200);
    } else if (p.id === 'crab') {
      x.sfx.chomp(); await sleep(1000); if (!alive(t)) return;
      x.sfx.boing(); x.say('Whoops! It rolled back!', 'oops'); await sleep(900); x.sfx.coin();
    }
  }

  function dropShield(id: string) {
    setShields((list) => list.filter((s) => s !== id));
    c.current.setHeld(id, (c.current.held[id] ?? []).filter((h) => h.id !== 'shield'));
    c.current.sfx.bell(); c.current.say('Shield blocked it!', 'oops');
  }

  function addPop(slot: number, text: string, good: boolean) {
    const p = { id: ++uid, slot, text, good };
    setPops((l) => [...l, p]);
    window.setTimeout(() => setPops((l) => l.filter((q) => q.id !== p.id)), 2200);
  }

  async function pick(slot: number) {
    if (mode !== 'pick' || openedRef.current.includes(slot)) return;
    const t = turn.current, x = c.current, id = x.player.id;
    setMode('busy'); setOpened((o) => [...o, slot]);
    x.sfx.chest(); playClip(`${A}/open.mp3`, x.settings, 0.5);
    await sleep(650); if (!alive(t)) return;
    const ch = boxesRef.current[slot].c;
    const before = scores();
    let target: string | undefined;
    if (needsTarget(ch)) {
      const list = Object.entries(before).filter(([k, v]) => k !== id && v > 0).map(([k]) => k);
      if (list.length === 1 || c.current.cpu) target = c.current.cpu ? randomOther(before, id) : list[0];
      else if (list.length > 1) {
        setTargets(list); setMode('target'); x.say(ch.kind === 'swap' ? 'Swap with who?' : 'Take from who?', 'big');
        target = await new Promise<string>((r) => { chooseRef.current = r; });
        setTargets([]); setMode('busy');
      }
      if (!alive(t)) return;
      if (target && shieldsRef.current.includes(target)) { dropShield(target); addPop(slot, 'Blocked!', false); target = undefined; await sleep(1200); }
    }
    const after = target || !needsTarget(ch) ? applyChest(before, id, ch, target, rush.current) : before;
    const delta = after[id] - before[id];
    c.current.setScores(after);
    const k = ch.kind;
    if (k === 'gold') { x.sfx.coin(); addPop(slot, `+${delta}`, true); x.burst(0.35 + slot * 0.15, 0.5); }
    if (k === 'double') { x.sfx.power(); addPop(slot, `+${delta}`, true); x.say('Double gold!', 'big'); x.burst(0.4, 0.45, 'big'); }
    if (k === 'lose') { x.sfx.slideDown(); addPop(slot, 'Oops!', false); x.say('Oops! The coins rolled back!', 'oops'); window.setTimeout(() => c.current.sfx.coin(), 900); }
    if (k === 'take' && target) { x.sfx.magnet(); addPop(slot, `+${delta}`, true); x.say('Got some!', 'good'); }
    if (k === 'swap' && target) { x.sfx.wind(); addPop(slot, 'Swap!', delta >= 0); x.say('Swap!', 'big'); }
    if (k === 'moth') { x.sfx.whoosh(); addPop(slot, 'Empty!', false); x.say('Just a moth!', 'oops'); }
    if (rush.current && k === 'gold') x.sfx.cheer();
    picks.current -= 1;
    await sleep(1400); if (!alive(t)) return;
    if (picks.current > 0 && openedRef.current.length < 3) { setMode('pick'); return; }
    setReveal(true); x.sfx.tick();
    await sleep(1700); if (!alive(t)) return;
    c.current.next();
  }

  // The computer picks a chest (the peeked one if it looked good).
  useEffect(() => {
    if (!ctx.cpu || mode !== 'pick') return;
    const tid = window.setTimeout(() => {
      const open = [0, 1, 2].filter((i) => !openedRef.current.includes(i));
      const good = peek !== null && open.includes(peek) && ['gold', 'double', 'take'].includes(boxesRef.current[peek].c.kind) && c.current.cpuRight();
      void pick(good ? peek! : open[Math.floor(Math.random() * open.length)]);
    }, 1600);
    return () => window.clearTimeout(tid);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  // Ten gold a coin, until the richest pile would pass 40 coins.
  const unit = Math.max(10, Math.ceil(Math.max(...players.map((p) => p.score)) / 40));
  const coinW = `min(${Math.round(88 / players.length / 4.4)}cqw, 7cqh)`;
  const can = mode === 'pick' && !ctx.cpu;
  return (
    <div ref={ref} className="absolute inset-0 rounded-panel border-heavy border-border overflow-clip" style={{ boxShadow: '0 8px 0 #000, 0 24px 40px rgba(36,28,61,0.3)' }}>
      <Beach still={ctx.still} />
      <div className="absolute inset-0 grid" style={wide ? { gridTemplateColumns: `minmax(0,1fr) ${Math.min(44, 12 + players.length * 9)}%` } : { gridTemplateRows: `minmax(0,1fr) ${Math.min(36, 22 + players.length * 2)}%` }}>
        {/* The three chests on the sand. */}
        <div className="relative min-w-0 min-h-0">
          <div className="absolute inset-x-[3%] bottom-[8%] top-[34%] flex items-end justify-center gap-[3%]">
            {boxes.map((b, i) => (
              <motion.div key={b.id} layout={!ctx.still} transition={{ type: 'spring', stiffness: 160, damping: 16 }} className="relative h-full flex-1 max-w-[32%] flex items-end">
                <div className="relative w-full">
                <ChestButton slot={i} box={b} open={opened.includes(i)} faded={reveal && !opened.includes(i)} show={opened.includes(i) || reveal || peek === i} peeked={peek === i && !opened.includes(i)}
                  glow={glow} can={can && !opened.includes(i)} still={ctx.still} sneeze={sneeze} waiting={mode === 'wait'} onPick={() => void pick(i)} />
                <AnimatePresence>
                  {pops.filter((p) => p.slot === i).map((p) => (
                    <motion.span key={p.id} className="absolute left-0 right-0 text-center bottom-[100%] font-display whitespace-nowrap pointer-events-none z-10" aria-live="polite"
                      style={{ fontSize: 'clamp(1.8rem, 5cqmin, 4rem)', color: p.good ? '#fdfd94' : '#ffd2c2', WebkitTextStroke: '0.12em #000', paintOrder: 'stroke fill' }}
                      initial={ctx.still ? { opacity: 0 } : { y: 30, scale: 0.4, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ opacity: 0, y: ctx.still ? 0 : -40 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 12 }}>{p.text}</motion.span>
                  ))}
                </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>
          <AnimatePresence>
            {can && opened.length === 0 && (
              <motion.p className="absolute top-[6%] inset-x-0 text-center font-display text-white pointer-events-none" style={{ fontSize: 'clamp(1.4rem, 4.5cqmin, 2.6rem)', WebkitTextStroke: '0.12em #000', paintOrder: 'stroke fill' }}
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{picks.current > 1 ? 'Pick two chests' : 'Pick a chest'}</motion.p>
            )}
          </AnimatePresence>
        </div>
        {/* Every team's gold heap. */}
        <div className={`relative min-w-0 min-h-0 flex items-end justify-around gap-1 px-[2%] pb-[3%] ${wide ? 'pt-[14%]' : 'pt-[2%]'}`} style={{ containerType: 'size' }}>
          {players.map((p) => (
            <Pile key={p.id} gold={p.score} unit={unit} coinW={coinW} colorIndex={p.colorIndex} name={p.name} active={p.id === me.id} shield={shields.includes(p.id)} still={ctx.still}
              target={targets.includes(p.id)} onTarget={() => { const r = chooseRef.current; chooseRef.current = null; c.current.sfx.tap(); r?.(p.id); }} />
          ))}
        </div>
      </div>
      <AnimatePresence>{fx && <PowerFx key={fx.id} kind={fx.kind} still={ctx.still} wide={wide} peek={peek} onDone={() => setFx(null)} />}</AnimatePresence>
    </div>
  );
}

// A wobbling chest; it flips open with rays, coins and its surprise.
function ChestButton({ slot, box, open, faded, show, peeked, glow, can, still, sneeze, waiting, onPick }: {
  slot: number; box: Box; open: boolean; faded: boolean; show: boolean; peeked: boolean; glow: 'clover' | 'rush' | null; can: boolean; still: boolean; sneeze: boolean; waiting: boolean; onPick: () => void;
}) {
  const [seed] = useState(() => Math.random());
  const ring = glow === 'clover' ? '#8fe3a0' : glow === 'rush' ? '#fdfd94' : null;
  return (
    <motion.button type="button" disabled={!can} onClick={onPick} aria-label={`Treasure chest ${slot + 1}`}
      className="relative w-full aspect-[6/5] max-h-full mx-auto disabled:cursor-default focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#241c3d] rounded-2xl"
      style={{ opacity: faded ? 0.75 : 1 }}
      animate={still || open ? { rotate: 0, scale: 1 } : sneeze ? { scale: [1, 1.18, 0.9, 1], rotate: [0, -6, 6, 0] } : can ? { rotate: [0, -4, 4, -2, 0, 0], y: [0, -6, 0, 0, 0, 0] } : waiting ? { rotate: [0, -1.5, 1.5, 0] } : { rotate: 0 }}
      transition={sneeze && !open ? { duration: 0.6 } : can ? { duration: 0.7, repeat: Infinity, repeatDelay: 2.4 + seed * 2, ease: 'easeInOut' } : { duration: 2.4, repeat: Infinity, repeatDelay: 1.5 + seed, ease: 'easeInOut' }}
      whileHover={can && !still ? { scale: 1.06 } : undefined} whileTap={can && !still ? { scale: 0.95 } : undefined}>
      {/* Shadow on the sand. */}
      <span className="absolute left-[8%] right-[8%] bottom-[-3%] h-[12%] rounded-[50%] bg-black/25 blur-[2px]" />
      {open && !still && <motion.span className="absolute inset-[-30%] rounded-full pu-rays pointer-events-none" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 0.9 }} transition={{ duration: 0.6, ease: 'easeOut' }} />}
      {ring && !open && <motion.span className="absolute inset-[4%] rounded-[30%]" style={{ boxShadow: `0 0 0 6px ${ring}, 0 0 40px 10px ${ring}` }} animate={still ? undefined : { opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.2, repeat: Infinity }} />}
      <svg viewBox="0 0 120 100" className="relative w-full h-full overflow-visible" aria-hidden="true">
        {/* The box. */}
        <rect x="10" y="46" width="100" height="48" rx="7" fill="#a8663a" stroke="#000" strokeWidth="4" />
        <path d="M14 62h92M14 78h92" stroke="#7d4826" strokeWidth="3" />
        <rect x="22" y="46" width="10" height="48" fill="#f6c544" stroke="#000" strokeWidth="3" />
        <rect x="88" y="46" width="10" height="48" fill="#f6c544" stroke="#000" strokeWidth="3" />
        {open && <ellipse cx="60" cy="48" rx="46" ry="7" fill="#3b2412" stroke="#000" strokeWidth="3" />}
        {open && <ellipse cx="60" cy="47" rx="38" ry="4" fill="#fdfd94" opacity="0.8" />}
        {/* The lid flips back on its hinge. */}
        <motion.g style={{ originX: '50%', originY: '100%' }} initial={false} animate={open ? (still ? { y: -24, scaleY: 0.55 } : { y: [0, 6, -30, -24], scaleY: [1, 0.9, 0.5, 0.55], rotate: [0, 0, -14, -10] }) : { y: 0, scaleY: 1, rotate: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}>
          <path d="M10 48V32Q10 12 60 12Q110 12 110 32V48Z" fill="#c07a45" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
          <path d="M22 48V20M98 48V20" stroke="#000" strokeWidth="1" />
          <rect x="22" y="17" width="10" height="31" fill="#f6c544" stroke="#000" strokeWidth="3" />
          <rect x="88" y="17" width="10" height="31" fill="#f6c544" stroke="#000" strokeWidth="3" />
          <path d="M26 26Q60 18 94 26" stroke="#fff" strokeOpacity="0.35" strokeWidth="4" fill="none" strokeLinecap="round" />
        </motion.g>
        {!open && <><rect x="50" y="40" width="20" height="22" rx="4" fill="#f6c544" stroke="#000" strokeWidth="3.5" /><circle cx="60" cy="49" r="3" fill="#000" /><path d="M60 50v6" stroke="#000" strokeWidth="3" /></>}
      </svg>
      {/* What is inside: shown when opened, peeked, or at the end of the turn. */}
      <AnimatePresence>
        {show && (
          <motion.span className="absolute left-1/2 top-[-14%] w-[54%] aspect-square -translate-x-1/2 pointer-events-none" style={{ opacity: peeked ? 0.85 : 1 }}
            initial={still ? { opacity: 0 } : { y: 40, scale: 0.2, opacity: 0 }} animate={{ y: open && !still ? [-4, -14, -4] : 0, scale: faded || peeked ? 0.75 : 1, opacity: 1 }}
            transition={open && !still ? { y: { duration: 1.6, repeat: Infinity }, default: { type: 'spring', stiffness: 220, damping: 12 } } : { type: 'spring', stiffness: 220, damping: 12 }}>
            <Inside c={box.c} still={still} open={open} />
            {peeked && <span className="absolute -right-2 -top-2 w-9 h-9 rounded-full bg-accent border-std border-border grid place-items-center"><Art kind="eye" /></span>}
          </motion.span>
        )}
      </AnimatePresence>
      {open && !still && box.c.kind !== 'moth' && box.c.kind !== 'lose' && <CoinSpray />}
    </motion.button>
  );
}

function CoinSpray() {
  const [coins] = useState(() => Array.from({ length: 9 }, () => ({ x: (Math.random() - 0.5) * 220, y: -80 - Math.random() * 120, r: Math.random() * 540 - 270, d: Math.random() * 0.15 })));
  return (
    <>
      {coins.map((k, i) => (
        <motion.img key={i} src={COIN} alt="" aria-hidden="true" className="absolute left-[44%] top-[38%] w-[14%] pointer-events-none"
          initial={{ x: 0, y: 0, opacity: 1, scale: 0.6 }} animate={{ x: k.x, y: [0, k.y, k.y + 260], rotate: k.r, opacity: [1, 1, 0], scale: 1 }} transition={{ duration: 1.3, delay: k.d, ease: 'easeOut' }} />
      ))}
    </>
  );
}

function Inside({ c, still, open }: { c: Chest; still: boolean; open: boolean }) {
  const badge = (node: ReactNode, bg: string) => <span className="w-full h-full rounded-full border-heavy border-border grid place-items-center" style={{ background: bg, boxShadow: '0 4px 0 #000' }}>{node}</span>;
  if (c.kind === 'gold') return <img src={COIN} alt="Gold" className="w-full h-full object-contain drop-shadow-[0_4px_0_rgba(0,0,0,0.5)]" />;
  if (c.kind === 'double') return badge(<span className="font-display text-[clamp(1.4rem,4cqmin,3rem)] leading-none">x2</span>, '#fdfd94');
  if (c.kind === 'lose') return <Art kind="hole" />;
  if (c.kind === 'take') return badge(<HandGrabbing weight="fill" className="w-[60%] h-[60%]" />, '#8fe3a0');
  if (c.kind === 'swap') return badge(<ArrowsLeftRight weight="bold" className="w-[60%] h-[60%]" />, '#b4c4fb');
  return (
    <motion.span className="block w-full h-full" animate={open && !still ? { x: [0, 30, -20, 60, 140], y: [0, -40, -90, -150, -260], opacity: [1, 1, 1, 1, 0] } : undefined} transition={{ duration: 2.2, ease: 'easeInOut' }}>
      <Art kind="moth" />
    </motion.span>
  );
}

// A team's gold heap: coins pile up row on row, the badge at the bottom.
function Pile({ gold, unit, coinW, colorIndex, name, active, shield, still, target, onTarget }: { gold: number; unit: number; coinW: string; colorIndex: number; name: string; active: boolean; shield: boolean; still: boolean; target: boolean; onTarget: () => void }) {
  const rows = heapRows(Math.min(40, Math.ceil(gold / unit)), 4);
  return (
    <div className="relative h-full flex-1 min-w-0 flex flex-col items-center justify-end gap-1">
      <div className="relative flex flex-col-reverse items-center">
        {rows.map((n, r) => (
          <div key={r} className="flex justify-center" style={{ marginBottom: r ? `calc(${coinW} * -0.22)` : 0 }}>
            {Array.from({ length: n }, (_, i) => (
              <motion.img key={i} src={COIN} alt="" aria-hidden="true" className="shrink-0" style={{ width: coinW, marginInline: `calc(${coinW} * -0.04)` }}
                initial={still ? false : { y: -120, opacity: 0, scale: 1.3 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 14, delay: i * 0.03 }} />
            ))}
          </div>
        ))}
        {shield && <motion.img src={`${A}/shield.webp`} alt="Shield" className="absolute -top-6 -right-6 w-12" initial={still ? false : { scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 12 }} />}
      </div>
      <motion.button type="button" disabled={!target} onClick={onTarget} aria-label={target ? `Pick ${name}` : name}
        className="relative rounded-full disabled:cursor-default focus-visible:outline-4 focus-visible:outline-[#241c3d]"
        animate={target && !still ? { scale: [1, 1.15, 1] } : { scale: active ? 1.08 : 1 }} transition={target ? { duration: 0.8, repeat: Infinity } : { type: 'spring' }}
        style={{ filter: active ? 'drop-shadow(0 0 10px #fdfd94)' : undefined }}>
        <TeamBadge colorIndex={colorIndex} size={target ? 84 : 46} />
        {target && <span className="absolute -inset-2 rounded-full border-4 border-dashed border-white" />}
      </motion.button>
      <span className="font-display text-white leading-none text-xl" style={{ WebkitTextStroke: '0.1em #000', paintOrder: 'stroke fill' }}>{gold}</span>
    </div>
  );
}

// The beach: sky, sun, drifting clouds, the sea with waves, sand and palms.
function Beach({ still }: { still: boolean }) {
  return (
    <div className="absolute inset-0" aria-hidden="true">
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #a9dcff 0%, #cfeeff 38%, #fef6d2 52%)' }} />
      <div className="absolute rounded-full border-std border-border" style={{ width: '11cqmin', height: '11cqmin', right: '14%', top: '6%', background: '#fdfd94', boxShadow: '0 0 40px 14px rgba(253,253,148,0.7)' }} />
      {[{ t: 8, w: 18, d: 60 }, { t: 18, w: 12, d: 85 }].map((cl, i) => (
        <motion.div key={i} className="absolute" style={{ top: `${cl.t}%`, width: `${cl.w}%` }} initial={{ left: `${i ? 55 : 8}%` }} animate={still ? undefined : { left: ['-20%', '110%'] }} transition={{ duration: cl.d, repeat: Infinity, ease: 'linear', delay: -cl.d * (i ? 0.6 : 0.2) }}>
          <svg viewBox="0 0 100 40"><path d="M10 34Q2 34 4 26Q6 18 16 20Q18 8 32 10Q40 0 54 8Q66 2 72 14Q86 12 88 24Q98 26 94 34Z" fill="#fff" stroke="#000" strokeWidth="2.5" /></svg>
        </motion.div>
      ))}
      {/* The sea. */}
      <div className="absolute inset-x-0 top-[36%] h-[22%]" style={{ background: 'linear-gradient(180deg, #5fb6e8, #3f95d4)' }} />
      <motion.svg viewBox="0 0 200 20" preserveAspectRatio="none" className="absolute inset-x-[-10%] top-[34%] h-[5%] w-[120%]" animate={still ? undefined : { x: ['0%', '-4%', '0%'] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}>
        <path d="M0 10Q10 0 20 10T40 10T60 10T80 10T100 10T120 10T140 10T160 10T180 10T200 10V20H0Z" fill="#5fb6e8" stroke="#000" strokeWidth="1.5" />
      </motion.svg>
      {[22, 44, 70].map((l, i) => <motion.span key={l} className="absolute h-[0.4rem] rounded-full bg-white/70" style={{ left: `${l}%`, top: `${42 + i * 4}%`, width: '8%' }} animate={still ? undefined : { x: [0, 14, 0], opacity: [0.4, 0.9, 0.4] }} transition={{ duration: 3 + i, repeat: Infinity }} />)}
      {/* The sand, with a curved shore. */}
      <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-[50%] w-full">
        <path d="M0 14Q50 0 100 10T200 8V100H0Z" fill="#f4d58d" stroke="#000" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
        <path d="M0 18Q50 6 100 15T200 13" stroke="#fff" strokeOpacity="0.8" strokeWidth="3" fill="none" vectorEffect="non-scaling-stroke" />
        {[[20, 50], [60, 80], [140, 40], [175, 75], [100, 62]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="3" ry="1.2" fill="#d9b56a" />)}
      </svg>
      {/* Palms on both sides. */}
      <Palm className="absolute left-[-6%] bottom-[38%] h-[50%]" still={still} />
      <Palm className="absolute right-[-5%] bottom-[40%] h-[40%] -scale-x-100" still={still} />
      <svg viewBox="0 0 60 30" className="absolute left-[1%] bottom-[1.5%] w-[6%]"><path d="M4 26Q10 6 30 8Q50 6 56 26Z" fill="#c9a0e8" stroke="#000" strokeWidth="2" /><path d="M30 8v18M18 12l6 14M42 12l-6 14" stroke="#000" strokeWidth="1.5" /></svg>
    </div>
  );
}
function Palm({ className, still }: { className: string; still: boolean }) {
  return (
    <motion.svg viewBox="0 0 100 160" className={className} style={{ originX: '40%', originY: '100%' }} animate={still ? undefined : { rotate: [0, 1.5, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}>
      <path d="M40 158Q36 100 50 50" stroke="#000" strokeWidth="13" fill="none" strokeLinecap="round" />
      <path d="M40 158Q36 100 50 50" stroke="#b07a45" strokeWidth="8" fill="none" strokeLinecap="round" />
      {['M50 50Q22 16 0 44Q26 56 50 50', 'M50 50Q78 12 100 34Q74 54 50 50', 'M50 50Q34 0 6 10Q30 34 50 50', 'M50 50Q70 -4 92 6Q74 34 50 50', 'M50 50Q76 52 86 84Q60 72 50 50', 'M50 50Q22 56 14 86Q42 70 50 50'].map((d) => (
        <path key={d} d={d} fill="#5cc3a0" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
      ))}
      <circle cx="46" cy="54" r="6" fill="#8a5a33" stroke="#000" strokeWidth="2.5" /><circle cx="55" cy="56" r="6" fill="#8a5a33" stroke="#000" strokeWidth="2.5" />
    </motion.svg>
  );
}

// Each power-up's own show over the beach.
function PowerFx({ kind, still, wide, peek, onDone }: { kind: string; still: boolean; wide: boolean; peek: number | null; onDone: () => void }) {
  useEffect(() => { const id = window.setTimeout(onDone, 2000); return () => window.clearTimeout(id); }, [onDone]);
  const center = 'absolute left-1/2 top-[40%] w-[22cqmin] h-[22cqmin] -translate-x-1/2 -translate-y-1/2';
  const fade = { exit: { opacity: 0 }, initial: { opacity: 0 } };
  if (still) return <motion.div {...fade} animate={{ opacity: 1 }} className={center}>{POWERS.find((p) => p.id === kind)?.art}</motion.div>;
  if (kind === 'map') return (
    <motion.div {...fade} animate={{ opacity: 1 }} className="absolute inset-0 pointer-events-none">
      <motion.div className={center} initial={{ scaleX: 0, rotate: -10 }} animate={{ scaleX: 1, rotate: 0 }} transition={{ duration: 0.6, ease: 'backOut' }}><Art kind="map" /></motion.div>
      {peek === null && <motion.svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full"><motion.path d="M50 45 Q40 60 50 75" stroke="#ef7d96" strokeWidth="1" strokeDasharray="2 2" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.5, duration: 0.7 }} vectorEffect="non-scaling-stroke" /></motion.svg>}
    </motion.div>
  );
  if (kind === 'clover') return (
    <motion.div {...fade} animate={{ opacity: 1 }} className="absolute inset-0 pointer-events-none">
      <motion.div className={center} initial={{ y: '-150%', rotate: -360 }} animate={{ y: 0, rotate: 0 }} transition={{ duration: 0.9, ease: 'easeOut' }}><Art kind="clover" /></motion.div>
      {Array.from({ length: 16 }, (_, i) => <motion.span key={i} className="absolute w-3 h-3 rounded-full bg-[#8fe3a0] border-2 border-black" style={{ left: `${8 + Math.random() * 60}%` }} initial={{ top: '-5%' }} animate={{ top: '90%', opacity: [1, 1, 0] }} transition={{ duration: 1.4, delay: 0.3 + i * 0.05 }} />)}
    </motion.div>
  );
  if (kind === 'shovel') return (
    <motion.div {...fade} animate={{ opacity: 1 }} className="absolute inset-0 pointer-events-none">
      <motion.div className={center} style={{ originX: '50%', originY: '90%' }} animate={{ rotate: [0, -40, 20, -40, 20, 0], y: ['0%', '12%', '0%', '12%', '0%'] }} transition={{ duration: 1.4 }}><Art kind="shovel" /></motion.div>
      {[0, 1].map((k) => Array.from({ length: 6 }, (_, i) => <motion.span key={`${k}${i}`} className="absolute w-3 h-3 rounded-full bg-[#d9b56a] border-2 border-black left-1/2 top-[52%]" initial={{ x: 0, y: 0 }} animate={{ x: (Math.random() - 0.5) * 200, y: [-20 - Math.random() * 80, 60], opacity: [1, 0] }} transition={{ delay: 0.3 + k * 0.5, duration: 0.8 }} />))}
    </motion.div>
  );
  if (kind === 'rush') return (
    <motion.div {...fade} animate={{ opacity: 1 }} className="absolute inset-0 pointer-events-none">
      <motion.div className="absolute inset-0 bg-white" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.9, 0, 0.6, 0] }} transition={{ duration: 0.6 }} />
      <motion.img src={`${A}/lightning.webp`} alt="" className="absolute left-1/2 top-0 h-[55%] -translate-x-1/2" initial={{ y: '-100%' }} animate={{ y: '0%' }} transition={{ duration: 0.25 }} />
    </motion.div>
  );
  if (kind === 'magnet') return (
    <motion.div {...fade} animate={{ opacity: 1 }} className="absolute inset-0 pointer-events-none">
      <motion.img src={`${A}/magnet.webp`} alt="" className={center} animate={{ rotate: [0, -12, 12, -12, 12, 0], scale: [0.6, 1.1, 1] }} transition={{ duration: 1.2 }} />
      {Array.from({ length: 10 }, (_, i) => <motion.img key={i} src={COIN} alt="" className="absolute w-[5cqmin]" style={{ top: '40%' }} initial={{ left: wide ? `${80 + Math.random() * 15}%` : `${10 + Math.random() * 80}%`, top: wide ? `${60 + Math.random() * 30}%` : '85%' }} animate={{ left: '48%', top: '40%', opacity: [1, 1, 0] }} transition={{ delay: 0.2 + i * 0.07, duration: 0.8, ease: 'easeIn' }} />)}
    </motion.div>
  );
  if (kind === 'shield') return (
    <motion.div {...fade} animate={{ opacity: 1 }} className="absolute inset-0 pointer-events-none">
      <motion.img src={`${A}/shield.webp`} alt="" className={center} initial={{ y: '-150%', scale: 1.6 }} animate={{ y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 10 }} />
      <motion.span className="absolute left-1/2 top-[40%] w-[30cqmin] h-[30cqmin] -translate-x-1/2 -translate-y-1/2 rounded-full border-8 border-[#b4c4fb]" initial={{ scale: 0.3, opacity: 1 }} animate={{ scale: 1.8, opacity: 0 }} transition={{ delay: 0.5, duration: 0.9 }} />
    </motion.div>
  );
  if (kind === 'parrot') return (
    <motion.div {...fade} animate={{ opacity: 1 }} className="absolute inset-0 pointer-events-none">
      <motion.div className="absolute top-[8%] w-[18cqmin] h-[18cqmin]" initial={{ left: '-20%' }} animate={{ left: '110%', y: [0, 20, -10, 15, 0] }} transition={{ duration: 1.9, ease: 'linear' }}><Art kind="parrot" /></motion.div>
      {Array.from({ length: 6 }, (_, i) => <motion.img key={i} src={COIN} alt="" className="absolute w-[5cqmin]" style={{ left: `${20 + i * 12}%` }} initial={{ top: '14%', opacity: 0 }} animate={{ top: '92%', opacity: [0, 1, 1, 0], rotate: 360 }} transition={{ delay: 0.25 + i * 0.18, duration: 0.9, ease: 'easeIn' }} />)}
    </motion.div>
  );
  if (kind === 'sneeze') return (
    <motion.div {...fade} animate={{ opacity: 1 }} className="absolute inset-0 pointer-events-none">
      {Array.from({ length: 7 }, (_, i) => <motion.span key={i} className="absolute rounded-full bg-white border-[3px] border-black" style={{ left: `${15 + i * 11}%`, top: '58%', width: '7cqmin', height: '7cqmin' }} initial={{ scale: 0 }} animate={{ scale: [0, 1.4, 0], y: -60 - i * 6 }} transition={{ delay: 0.5 + i * 0.04, duration: 1 }} />)}
    </motion.div>
  );
  if (kind === 'crab') {
    const pile = wide ? '80%' : '45%';
    return (
      <motion.div {...fade} animate={{ opacity: 1 }} className="absolute inset-0 pointer-events-none">
        <motion.div className="absolute bottom-[3%] w-[14cqmin] h-[14cqmin]" initial={{ left: '-15%' }} animate={{ left: ['-15%', pile, pile, '35%', '35%', '-15%'], rotate: [0, 0, 0, 0, 35, 0], y: [0, -6, 0, -6, 4, 0] }} transition={{ duration: 2, times: [0, 0.35, 0.42, 0.62, 0.7, 1] }}>
          <Art kind="crab" />
        </motion.div>
        {/* The coin: grabbed, dropped when the crab trips, and it rolls home. */}
        <motion.img src={COIN} alt="" className="absolute bottom-[12%] w-[6cqmin]" initial={{ left: pile, opacity: 0 }} animate={{ left: [pile, pile, '37%', '37%', pile], opacity: [0, 1, 1, 1, 1], y: [0, 0, 0, -40, 0], rotate: [0, 0, 0, -180, -540] }} transition={{ duration: 2, times: [0, 0.42, 0.62, 0.75, 1] }} />
      </motion.div>
    );
  }
  return null;
}

// A ring with one of her pack's power-up pictures inside.
function ImgArt({ src, ring }: { src: string; ring: string }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="44" fill={ring} stroke="#000" strokeWidth="5" />
      <image href={src} x="20" y="18" width="60" height="64" preserveAspectRatio="xMidYMid meet" />
    </svg>
  );
}

// Classic pictures, drawn in code.
function Art({ kind }: { kind: string }) {
  const ring = (fill: string) => <circle cx="50" cy="50" r="44" fill={fill} stroke="#000" strokeWidth="5" />;
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className="w-full h-full overflow-visible">
      {kind === 'map' && <>{ring('#fdfd94')}<path d="M22 30l18-6 20 6 18-6v46l-18 6-20-6-18 6z" fill="#f4e2b5" stroke="#000" strokeWidth="4" strokeLinejoin="round" /><path d="M40 24v46M60 30v46" stroke="#000" strokeWidth="2.5" /><path d="M28 60q10-14 22-6t20-18" stroke="#ef7d96" strokeWidth="3" strokeDasharray="4 4" fill="none" /><path d="M64 30l8 8M72 30l-8 8" stroke="#ef7d96" strokeWidth="4" strokeLinecap="round" /></>}
      {kind === 'clover' && <>{ring('#dff7e4')}{[[50, 32], [68, 50], [50, 68], [32, 50]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="14" fill="#5cc3a0" stroke="#000" strokeWidth="4" />)}<circle cx="50" cy="50" r="6" fill="#8fe3a0" stroke="#000" strokeWidth="3" /><path d="M56 62q10 14 4 24" stroke="#000" strokeWidth="5" fill="none" strokeLinecap="round" /></>}
      {kind === 'shovel' && <>{ring('#f5a08c')}<path d="M64 16l12 12-22 22-12-12z" fill="#8a5a33" stroke="#000" strokeWidth="4" strokeLinejoin="round" /><path d="M42 38l20 20-14 16q-12 8-22-2t-2-22z" fill="#c9d2e8" stroke="#000" strokeWidth="4" strokeLinejoin="round" /><text x="70" y="82" fontSize="24" fontWeight="900" fontFamily="sans-serif" stroke="#000" strokeWidth="1.5" fill="#fff">2</text></>}
      {kind === 'parrot' && <>{ring('#cdeefc')}<path d="M30 72q-6-30 18-40 20-6 26 12 4 14-8 22l-10 18-8-10z" fill="#ef4b4b" stroke="#000" strokeWidth="4" strokeLinejoin="round" /><path d="M36 60q14 6 26-6" stroke="#000" strokeWidth="3" fill="#6aa9e9" /><path d="M66 40q14 2 12 14-8-4-12-4z" fill="#f6c544" stroke="#000" strokeWidth="3.5" strokeLinejoin="round" /><circle cx="58" cy="40" r="5" fill="#fff" stroke="#000" strokeWidth="2.5" /><circle cx="59" cy="40" r="2" fill="#000" /><path d="M40 80l-6 10M48 82l2 10" stroke="#5cc3a0" strokeWidth="5" strokeLinecap="round" /></>}
      {kind === 'sneeze' && <>{ring('#ffe0d8')}<rect x="24" y="48" width="52" height="28" rx="5" fill="#a8663a" stroke="#000" strokeWidth="4" /><path d="M24 48v-6q0-12 26-12t26 12v6z" fill="#c07a45" stroke="#000" strokeWidth="4" /><path d="M38 58q4-4 8 0M54 58q4-4 8 0" stroke="#000" strokeWidth="3" fill="none" strokeLinecap="round" /><ellipse cx="50" cy="68" rx="5" ry="4" fill="#000" /><circle cx="80" cy="30" r="7" fill="#fff" stroke="#000" strokeWidth="3" /><circle cx="88" cy="18" r="4" fill="#fff" stroke="#000" strokeWidth="2.5" /></>}
      {kind === 'crab' && <>{ring('#ffd2c2')}<ellipse cx="50" cy="60" rx="26" ry="16" fill="#f0603c" stroke="#000" strokeWidth="4" /><path d="M24 54q-14-6-10-20 8 2 10 10M76 54q14-6 10-20-8 2-10 10" fill="#f0603c" stroke="#000" strokeWidth="4" strokeLinejoin="round" /><path d="M30 72l-8 10M38 75l-4 10M70 72l8 10M62 75l4 10" stroke="#000" strokeWidth="4" strokeLinecap="round" /><circle cx="42" cy="44" r="5" fill="#fff" stroke="#000" strokeWidth="3" /><circle cx="58" cy="44" r="5" fill="#fff" stroke="#000" strokeWidth="3" /><circle cx="42" cy="44" r="2" fill="#000" /><circle cx="58" cy="44" r="2" fill="#000" /><path d="M44 62q6 4 12 0" stroke="#000" strokeWidth="3" fill="none" strokeLinecap="round" /></>}
      {kind === 'moth' && <><path d="M50 50Q26 18 12 36Q8 58 46 56Q20 70 30 84Q44 86 50 58Q56 86 70 84Q80 70 54 56Q92 58 88 36Q74 18 50 50Z" fill="#d8cfc0" stroke="#000" strokeWidth="4" strokeLinejoin="round" /><circle cx="30" cy="40" r="5" fill="#a89a85" /><circle cx="70" cy="40" r="5" fill="#a89a85" /><ellipse cx="50" cy="56" rx="5" ry="14" fill="#8a7a66" stroke="#000" strokeWidth="3" /><path d="M48 44q-6-12-12-14M52 44q6-12 12-14" stroke="#000" strokeWidth="2.5" fill="none" /></>}
      {kind === 'hole' && <><ellipse cx="50" cy="62" rx="40" ry="20" fill="#3b2412" stroke="#000" strokeWidth="4" /><path d="M30 60q20 10 40 0" stroke="#000" strokeWidth="3" fill="none" /><circle cx="36" cy="40" r="10" fill="#f6c544" stroke="#000" strokeWidth="3" opacity="0.8" /><circle cx="62" cy="32" r="8" fill="#f6c544" stroke="#000" strokeWidth="3" opacity="0.6" /><path d="M36 30v-10M62 22v-8" stroke="#000" strokeWidth="2" strokeDasharray="3 3" /></>}
      {kind === 'take' && <>{ring('#dff7e4')}<path d="M30 58V38a5 5 0 0 1 10 0v14V30a5 5 0 0 1 10 0v22V34a5 5 0 0 1 10 0v20-12a5 5 0 0 1 10 0v20q0 18-18 18h-6q-12 0-18-10l-8-14a5 5 0 0 1 8-6z" fill="#fdfd94" stroke="#000" strokeWidth="4" strokeLinejoin="round" /></>}
      {kind === 'swap' && <>{ring('#e3e9ff')}<path d="M24 40h46l-10-10M76 62H30l10 10" stroke="#000" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round" /><circle cx="24" cy="62" r="8" fill="#f6c544" stroke="#000" strokeWidth="3" /><circle cx="76" cy="40" r="8" fill="#f6c544" stroke="#000" strokeWidth="3" /></>}
      {kind === 'eye' && <><path d="M15 50q35-36 70 0-35 36-70 0z" fill="#fff" stroke="#000" strokeWidth="8" /><circle cx="50" cy="50" r="13" fill="#000" /></>}
    </svg>
  );
}

function Cover() {
  return (
    <svg viewBox="0 0 100 62" preserveAspectRatio="xMidYMid slice">
      <rect width="100" height="62" fill="#bfe6ff" />
      <rect y="20" width="100" height="14" fill="#4aa3dc" />
      <path d="M0 30Q25 24 50 29T100 28V62H0Z" fill="#f4d58d" stroke="#000" strokeWidth="0.8" />
      <circle cx="84" cy="9" r="5" fill="#fdfd94" stroke="#000" strokeWidth="0.8" />
      {[[14, 0], [42, 1], [70, 0]].map(([x, o], i) => (
        <g key={i} transform={`translate(${x} 34)`}>
          <ellipse cx="8" cy="20" rx="9" ry="2" fill="#000" opacity="0.2" />
          <rect x="0" y="8" width="16" height="11" rx="1.5" fill="#a8663a" stroke="#000" strokeWidth="0.8" />
          {o ? <><path d="M0 8V5Q0 -1 8 -1T16 5V8" fill="#3b2412" stroke="#000" strokeWidth="0.8" transform="translate(0 -6) rotate(-12 8 8)" /><circle cx="8" cy="2" r="4.5" fill="#f6c544" stroke="#000" strokeWidth="0.8" /></> : <path d="M0 8V5Q0 1 8 1T16 5V8Z" fill="#c07a45" stroke="#000" strokeWidth="0.8" />}
          <rect x="6.5" y="6.5" width="3" height="4" fill="#f6c544" stroke="#000" strokeWidth="0.5" />
        </g>
      ))}
      {[0, 1, 2, 3, 4, 5].map((i) => <circle key={i} cx={90 + (i % 3) * 2.5 - 2.5} cy={56 - Math.floor(i / 3) * 3} r="1.8" fill="#f6c544" stroke="#000" strokeWidth="0.4" />)}
    </svg>
  );
}

const def: LabDef = {
  id: 'treasure-quest',
  name: 'Treasure Quest',
  description: 'Answer right for gold, then pick a treasure chest. More gold, double or a moth? The biggest pile wins.',
  ways: ['teams', 'solo'],
  minTeams: 2,
  maxTeams: 6,
  how: [
    { icon: <CheckCircle weight="fill" />, text: 'Answer the question' },
    { icon: <Coins weight="fill" />, text: 'Right? Pick a chest' },
    { icon: <Trophy weight="fill" />, text: 'The biggest gold pile wins' },
  ],
  rounds: { label: 'Rounds', min: 3, max: 20, default: 8 },
  powers: POWERS,
  background: 'radial-gradient(120% 90% at 50% 10%, #c9e9ff 0%, #8fc6ef 60%, #6aa6dc 100%)',
  cover: <Cover />,
  pieces: [
    { id: 'background', label: 'Beach', hint: 'Sky, sea and sand behind the chests' },
    { id: 'chest', label: 'Treasure chest', hint: 'A closed chest (the lid opens)' },
    { id: 'chest-open', label: 'Open chest', hint: 'The chest with its lid open' },
    { id: 'coin', label: 'Gold coin', hint: 'One coin of the gold piles' },
    { id: 'moth', label: 'Moth', hint: 'What flies out of an empty chest' },
    { id: 'hole', label: 'Lose some', hint: 'The oops picture when gold is lost' },
    { id: 'palm', label: 'Palm tree', hint: 'Scenery beside the beach' },
    ...POWERS.map((p) => ({ id: `power-${p.id}`, label: p.name, hint: p.desc })),
  ],
  Play,
};
export default def;
