import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useAnimationControls } from 'motion/react';
import { CheckCircle, Drop, Heart, Leaf, Lightning, LockKey, Moon, Star, Trophy, type Icon } from '@phosphor-icons/react';
import { playClip } from '../../../engine/music';
import { TeamBadge } from '../../../engine/TeamBadge';
import type { LabCtx, LabDef, LabPower } from '../../types';
import { borrowOf, codeChoices, makeCode, rollBoxes, sameCode, type Code, type DataBox, type Sym } from './rules';

// Code Crackers (Game Lab, inspired by the general idea of hacking-themed
// quiz games): a friendly computer lab with a cute robot. Answer right, then
// pick one of five glitching data boxes for crystals. Some boxes are hacks:
// guess another team's three-symbol password to borrow some of theirs.

const A = '/lab/code-crackers';
const GEMS = ['green', 'blue', 'pink', 'purple', 'yellow'].map((c) => `${A}/gem-${c}.webp`);
const GLOW = '#3dff9a';
const BOXES = 5;
const FLAT = 10; // crystals for every right answer
const TRY = 2; // crystals for trying after a miss

const POWERS: LabPower[] = [
  { id: 'scan', name: 'Peek Scan', desc: 'See inside every box before you pick.', enter: 'zoom', art: <Art kind="scan" /> },
  { id: 'overclock', name: 'Speed Boost', desc: 'Crystals from your box count three times.', enter: 'spin', art: <ImgArt src={`${A}/lightning.webp`} /> },
  { id: 'twobox', name: 'Lucky Byte', desc: 'Open two boxes this turn.', enter: 'drop', art: <Art kind="twobox" /> },
  { id: 'rain', name: 'Crystal Rain', desc: '20 crystals rain into your server.', enter: 'drop', art: <Art kind="rain" /> },
  { id: 'autohack', name: 'Quick Crack', desc: 'Skip the boxes and crack a team\'s code right now.', takes: true, enter: 'zoom', art: <Art kind="autohack" /> },
  { id: 'firewall', name: 'Wall', desc: 'A wall keeps your crystals safe from the next code crack.', enter: 'drop', art: <Art kind="firewall" /> },
  { id: 'decoder', name: 'Code Helper', desc: 'Your next code crack shows only two codes.', enter: 'spin', art: <ImgArt src={`${A}/mystery.webp`} /> },
  { id: 'cat', name: 'Cat on the Keys', desc: 'A cat walks on the keyboard and scrambles the boxes.', silly: true, art: <Art kind="cat" /> },
  { id: 'hiccup', name: 'Robot Hiccups', desc: 'Hic! Byte drops a crystal, then catches it again.', silly: true, art: <Art kind="hiccup" /> },
  // Switched on in setup (starts off): some boxes let you crack a team's code.
  { id: 'hackbox', name: 'Code Boxes', desc: 'Some boxes let you crack a team\'s code to borrow crystals.', takes: true, enter: 'zoom', art: <Art kind="autohack" /> },
];
const FIREWALL = POWERS.find((p) => p.id === 'firewall')!;
const DECODER = POWERS.find((p) => p.id === 'decoder')!;

const SYM: Record<Sym, { icon: Icon; color: string; name: string }> = {
  star: { icon: Star, color: '#fdfd94', name: 'star' },
  heart: { icon: Heart, color: '#ef7d96', name: 'heart' },
  moon: { icon: Moon, color: '#b4c4fb', name: 'moon' },
  bolt: { icon: Lightning, color: '#f6c544', name: 'lightning' },
  drop: { icon: Drop, color: '#7fd6e3', name: 'drop' },
  leaf: { icon: Leaf, color: '#8fe3a0', name: 'leaf' },
};

type Mode = 'wait' | 'busy' | 'pick' | 'target' | 'crack';
interface Box { id: number; b: DataBox }
interface Crack { target: string; codes: Code[]; real: Code; picked: number | null }

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

// A line of terminal text that types itself out.
function useTyped(text: string, still: boolean) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (still) { setN(text.length); return; }
    setN(0);
    const id = window.setInterval(() => setN((k) => { if (k >= text.length) { window.clearInterval(id); return k; } return k + 1; }), 18);
    return () => window.clearInterval(id);
  }, [text, still]);
  return text.slice(0, n);
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
  const tall = size.h > size.w * 1.05;
  const [mode, setMode] = useState<Mode>('wait');
  const [boxes, setBoxes] = useState<Box[]>(() => Array.from({ length: BOXES }, () => ({ id: ++uid, b: { kind: 'empty' } as DataBox })));
  const boxesRef = useRef(boxes); boxesRef.current = boxes;
  const [opened, setOpened] = useState<number[]>([]);
  const openedRef = useRef(opened); openedRef.current = opened;
  const [seeAll, setSeeAll] = useState(false);
  const [line, setLine] = useState('> starting up...');
  const [peekCodes, setPeekCodes] = useState(false);
  const wobble = useAnimationControls();
  const [fx, setFx] = useState<{ id: number; kind: string } | null>(null);
  const [pop, setPop] = useState<{ id: number; slot: number; text: string; good: boolean } | null>(null);
  const [targets, setTargets] = useState<string[]>([]);
  const [crack, setCrack] = useState<Crack | null>(null);
  const [walls, setWalls] = useState<string[]>([]);
  const wallsRef = useRef(walls); wallsRef.current = walls;
  const decoders = useRef(new Set<string>());
  const [codes] = useState(() => new Map<string, Code>());
  const [flow, setFlow] = useState<{ id: number; from: string; to: string; n: number } | null>(null);
  const [robot, setRobot] = useState<'idle' | 'happy' | 'sad' | 'spin' | 'hic'>('idle');
  const turn = useRef(0);
  const picks = useRef(1);
  const triple = useRef(false);
  const chooseRef = useRef<((id: string) => void) | null>(null);
  const crackRef = useRef<((i: number) => void) | null>(null);
  const players = ctx.turns.players;
  const me = ctx.player;
  const typed = useTyped(line, ctx.still);
  for (const p of players) if (!codes.has(p.id)) codes.set(p.id, makeCode());

  const scores = () => Object.fromEntries(c.current.turns.players.map((p) => [p.id, p.score]));
  const alive = (t: number) => turn.current === t;
  useEffect(() => () => { turn.current = -1; }, []);
  const say = (s: string) => setLine(`> ${s}`);
  const shake = () => { if (c.current.shake) void wobble.start({ x: [0, -5, 4, 0], opacity: [1, 0.85, 1, 1], transition: { duration: 0.6, ease: 'easeInOut' } }); };
  const mood = (m: typeof robot, ms = 1400) => { setRobot(m); window.setTimeout(() => setRobot('idle'), ms); };
  const others = () => { const s = scores(), id = c.current.player.id; return Object.entries(s).filter(([k, v]) => k !== id && v > 0).map(([k]) => k); };
  const hackOn = () => { let on = false; void c.current.power(0, (p) => { if (p.id === 'hackbox') on = true; return false; }); return on; };
  const fresh = () => { const s = scores(), id = c.current.player.id; return rollBoxes({ others: others().length > 0, mine: s[id] ?? 0, hack: hackOn() }, BOXES).map((b) => ({ id: ++uid, b })); };

  useEffect(() => {
    const t = ++turn.current;
    const x = c.current;
    setMode('wait'); setOpened([]); setSeeAll(false); setTargets([]); setCrack(null); setPeekCodes(false);
    picks.current = 1; triple.current = false;
    say(`${x.player.name}: answer to open a box`);
    void x.ask().then(async (ok) => {
      if (!alive(t)) return;
      if (!ok) { c.current.sfx.wrong(); say(`not this time. +${TRY} crystals for trying`); mood('sad'); await sleep(600); if (!alive(t)) return; c.current.points(TRY); c.current.sfx.coin(); await sleep(1100); if (alive(t)) c.current.next(); return; }
      c.current.points(FLAT); c.current.sfx.coin(); c.current.say(`+${FLAT} crystals!`, 'good'); mood('happy');
      await sleep(800); if (!alive(t)) return;
      setBoxes(fresh()); setMode('busy'); c.current.sfx.blip(0); shake();
      say('new mystery boxes!');
      await sleep(600); if (!alive(t)) return;
      const p = await c.current.power(0.45, (pw) => pw.id !== 'hackbox');
      if (!alive(t)) return;
      if (p) { const go = await fire(p, t); if (!alive(t) || go === 'done') return; }
      say(picks.current > 1 ? 'pick two boxes' : 'pick a data box');
      setMode('pick');
    });
  }, [ctx.taken]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fire(p: LabPower, t: number): Promise<'go' | 'done'> {
    const x = c.current, id = x.player.id;
    setFx({ id: ++uid, kind: p.id });
    if (p.id === 'scan') { say('peeking inside...'); x.sfx.slideDown(); await sleep(900); setSeeAll(true); x.sfx.bell(); await sleep(700); }
    if (p.id === 'overclock') { triple.current = true; say('speed boost: crystals x3!'); x.sfx.zap(); mood('spin', 1600); await sleep(1500); }
    if (p.id === 'twobox') { picks.current = 2; say('lucky byte: pick two boxes'); x.sfx.note(2); await sleep(250); x.sfx.note(4); await sleep(900); }
    if (p.id === 'rain') {
      say('crystal rain!'); for (let i = 0; i < 5; i++) { await sleep(180); x.sfx.blip(i * 2); }
      if (!alive(t)) return 'done'; x.points(20); x.sfx.coin(); mood('happy'); await sleep(700);
    }
    if (p.id === 'firewall') { setWalls((w) => [...new Set([...w, id])]); x.setHeld(id, [...(x.held[id] ?? []).filter((h) => h.id !== 'firewall'), FIREWALL]); say('your wall is up!'); x.sfx.build(); await sleep(1300); }
    if (p.id === 'decoder') { decoders.current.add(id); x.setHeld(id, [...(x.held[id] ?? []).filter((h) => h.id !== 'decoder'), DECODER]); say('code helper saved for your next hack'); x.sfx.power(); await sleep(1300); }
    if (p.id === 'cat') {
      say('kjhsdf;;;mew;;;'); x.sfx.chomp(); await sleep(600); if (!alive(t)) return 'done';
      x.sfx.boing(); shake(); setBoxes((b) => { const f = fresh(); return [...b].reverse().map((bx, i) => ({ id: bx.id, b: f[i].b })); }); await sleep(1300);
      say('meow. boxes scrambled!');
    }
    if (p.id === 'hiccup') { say('hic! hic!'); mood('hic', 1800); x.sfx.boing(); await sleep(700); x.sfx.boing(); await sleep(500); if (!alive(t)) return 'done'; x.sfx.tick(); say('caught it! no crystals lost'); mood('happy'); await sleep(900); }
    if (p.id === 'autohack') { await sleep(500); if (!alive(t)) return 'done'; await hack(t); if (alive(t)) await endTurn(t); return 'done'; }
    await sleep(300);
    return 'go';
  }

  // Pick a team, then pick its code out of four (two with a Decoder).
  async function hack(t: number) {
    const x = c.current, id = x.player.id;
    const list = others();
    if (!list.length) { say('no crystals to borrow'); return; }
    // A memory game: every team's code shows for a moment before the crack
    // (with no clock, the codes stay up during the crack).
    const ts = x.timeScale;
    setMode('busy'); setPeekCodes(true); x.sfx.bell(); say('look at every code. remember them!');
    if (ts) { await sleep(3400 * ts); if (!alive(t)) return; setPeekCodes(false); }
    playClip(`${A}/hack.mp3`, x.settings, 0.5); shake(); mood('spin', 1200);
    say('crack a code: pick a team'); x.say('Crack the code!', 'big');
    let target = list[0];
    if (list.length > 1) {
      if (c.current.cpu) { await sleep(1300); target = list[Math.floor(Math.random() * list.length)]; }
      else { setTargets(list); setMode('target'); target = await new Promise<string>((r) => { chooseRef.current = r; }); setTargets([]); }
    }
    if (!alive(t)) return;
    const tName = c.current.turns.players.find((p) => p.id === target)?.name ?? '';
    if (wallsRef.current.includes(target)) {
      setWalls((w) => w.filter((v) => v !== target)); c.current.setHeld(target, (c.current.held[target] ?? []).filter((h) => h.id !== 'firewall'));
      say(`${tName}'s wall kept them safe!`); c.current.sfx.thud(); c.current.say('Wall!', 'oops'); await sleep(1600); setPeekCodes(false); return;
    }
    const real = codes.get(target)!;
    const two = decoders.current.has(id);
    if (two) { decoders.current.delete(id); c.current.setHeld(id, (c.current.held[id] ?? []).filter((h) => h.id !== 'decoder')); }
    const list4 = codeChoices(real, two ? 2 : 4);
    setCrack({ target, codes: list4, real, picked: null }); setMode('crack');
    say(`crack ${tName}'s code`);
    let pickI: number;
    if (c.current.cpu) {
      await sleep(2200);
      const right = list4.findIndex((cd) => sameCode(cd, real));
      pickI = c.current.cpuRight() ? right : Math.floor(Math.random() * list4.length);
    } else pickI = await new Promise<number>((r) => { crackRef.current = r; });
    if (!alive(t)) return;
    setCrack((k) => (k ? { ...k, picked: pickI } : k)); setMode('busy');
    c.current.sfx.tick();
    await sleep(900); if (!alive(t)) return;
    if (sameCode(list4[pickI], real)) {
      const s = scores(); const n = borrowOf(s[target]);
      s[target] -= n; s[id] += n; c.current.setScores(s);
      playClip(`${A}/unlock.mp3`, c.current.settings, 0.5);
      c.current.say(`You cracked it! +${n}`, 'big'); say(`borrowed ${n} crystals`); mood('happy');
      setFlow({ id: ++uid, from: target, to: id, n }); c.current.burst(0.5, 0.6);
      codes.set(target, makeCode()); // a cracked code changes
    } else {
      c.current.sfx.boing(); shake(); c.current.say('Not that code!', 'oops'); say('wrong code. it stays locked'); mood('sad');
    }
    await sleep(1700);
    setCrack(null); setPeekCodes(false);
  }

  async function pick(slot: number) {
    if (mode !== 'pick' || openedRef.current.includes(slot)) return;
    const t = turn.current, x = c.current;
    setMode('busy'); setOpened((o) => [...o, slot]);
    x.sfx.zap(); shake(); say('opening the box...');
    await sleep(700); if (!alive(t)) return;
    const b = boxesRef.current[slot].b;
    const show = (text: string, good: boolean) => setPop({ id: ++uid, slot, text, good });
    if (b.kind === 'crystals' || b.kind === 'mega') {
      // Speed Boost triples, but never adds more than 40 extra.
      const n = triple.current ? Math.min(b.n * 3, b.n + 40) : b.n;
      x.points(n); x.sfx.coin(); show(`+${n}`, true); say(`found ${n} crystals!`); mood('happy');
      if (b.kind === 'mega') { x.say('Mega crystals!', 'big'); x.sfx.cheer(); x.burst(0.45, 0.4, 'big'); } else x.burst(0.2 + slot * 0.15, 0.4);
      await sleep(1300);
    } else if (b.kind === 'virus') {
      x.sfx.boing(); show('Silly bug!', false); say('a silly bug wiggles... and gives the crystals back'); mood('hic', 1200); await sleep(1300);
    } else if (b.kind === 'empty') {
      x.sfx.slideDown(); show('Empty', false); say('empty box. try again next time'); mood('sad'); await sleep(1200);
    } else if (b.kind === 'hack') {
      show('Code box!', true); await sleep(500); await hack(t);
    }
    if (!alive(t)) return;
    picks.current -= 1;
    if (picks.current > 0) { setMode('pick'); say('pick one more box'); return; }
    await endTurn(t);
  }

  async function endTurn(t: number) {
    setSeeAll(true); c.current.sfx.tick();
    await sleep(1500); if (!alive(t)) return;
    c.current.next();
  }

  // The computer plays its own picks.
  useEffect(() => {
    if (!ctx.cpu || mode !== 'pick') return;
    const tid = window.setTimeout(() => {
      const open = boxesRef.current.map((_, i) => i).filter((i) => !openedRef.current.includes(i));
      const best = seeAll ? [...open].sort((a, b) => worth(boxesRef.current[b].b) - worth(boxesRef.current[a].b))[0] : open[Math.floor(Math.random() * open.length)];
      void pick(best);
    }, 1700);
    return () => window.clearTimeout(tid);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const can = mode === 'pick' && !ctx.cpu;
  const maxScore = Math.max(60, ...players.map((p) => p.score));
  return (
    <div ref={ref} className="absolute inset-0 rounded-panel border-heavy border-border overflow-clip" style={{ background: 'radial-gradient(120% 90% at 50% 0%, #2f2756 0%, #1b1533 70%)', boxShadow: '0 8px 0 #000, 0 24px 40px rgba(36,28,61,0.3)' }}>
      <LabRoom still={ctx.still} />
      <motion.div className="absolute inset-0 flex flex-col gap-[2%] p-[2.5%]" animate={wobble}>
        {/* The terminal line. */}
        <div className="shrink-0 rounded-xl border-std border-[#000] px-4 py-2 font-mono font-bold flex items-center gap-2" style={{ background: '#0c1a14', color: GLOW, boxShadow: `0 0 18px ${GLOW}55, inset 0 0 12px ${GLOW}33`, fontSize: 'clamp(0.95rem, 3cqmin, 1.6rem)' }} aria-live="polite">
          <span className="min-w-0 leading-snug">{typed}</span>
          <motion.span className="inline-block w-[0.6em] h-[1.1em]" style={{ background: GLOW }} animate={ctx.still ? undefined : { opacity: [1, 0.45, 1] }} transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }} />
        </div>
        {/* The data boxes, or the code to crack. */}
        <div className="relative flex-1 min-h-0 grid place-items-center">
          {crack ? (
            <CrackPanel crack={crack} still={ctx.still} can={mode === 'crack' && !ctx.cpu} name={players.find((p) => p.id === crack.target)?.name ?? ''} colorIndex={players.find((p) => p.id === crack.target)?.colorIndex ?? 0}
              onPick={(i) => { const r = crackRef.current; crackRef.current = null; c.current.sfx.tap(); r?.(i); }} />
          ) : (
            <div className={`w-full h-full grid gap-[3%] ${tall ? 'grid-cols-3 grid-rows-2' : 'grid-cols-5 grid-rows-1'} items-center justify-items-center`} style={{ padding: tall ? '2% 4%' : '4% 2%' }}>
              {boxes.map((b, i) => (
                <DataBoxButton key={b.id} slot={i} box={b.b} open={opened.includes(i)} show={opened.includes(i) || seeAll} can={can && !opened.includes(i)} still={ctx.still} waiting={mode === 'wait'}
                  pop={pop?.slot === i ? pop : null} onPick={() => void pick(i)} />
              ))}
            </div>
          )}
          <AnimatePresence>{fx && <PowerFx key={fx.id} kind={fx.kind} still={ctx.still} onDone={() => setFx(null)} />}</AnimatePresence>
        </div>
        {/* Every team's server, with its crystal tower and locked code. */}
        <div className="shrink-0 flex items-end gap-[2%]" style={{ height: tall ? '30%' : '34%' }}>
          <Robot mood={robot} still={ctx.still} />
          <div className="flex-1 min-w-0 h-full flex items-end justify-around gap-[2%]">
            {players.map((p) => (
              <Server key={p.id} code={peekCodes ? codes.get(p.id) : undefined} crystals={p.score} max={maxScore} colorIndex={p.colorIndex} name={p.name} active={p.id === me.id} wall={walls.includes(p.id)} still={ctx.still}
                target={targets.includes(p.id)} flowing={flow ? (flow.from === p.id ? 'out' : flow.to === p.id ? 'in' : null) : null} flowKey={flow?.id ?? 0} flowN={flow?.n ?? 0}
                onTarget={() => { const r = chooseRef.current; chooseRef.current = null; c.current.sfx.tap(); r?.(p.id); }} />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

const worth = (b: DataBox) => (b.kind === 'mega' ? 100 : b.kind === 'crystals' ? b.n : b.kind === 'hack' ? 30 : b.kind === 'empty' ? 0 : 1);

// A glitching data box: it flickers, then cracks open to show what is inside.
function DataBoxButton({ slot, box, open, show, can, still, waiting, pop, onPick }: { slot: number; box: DataBox; open: boolean; show: boolean; can: boolean; still: boolean; waiting: boolean; pop: { id: number; text: string; good: boolean } | null; onPick: () => void }) {
  const [seed] = useState(() => Math.random());
  return (
    <motion.button type="button" disabled={!can} onClick={onPick} aria-label={`Mystery box ${slot + 1}`}
      className="relative w-full max-w-[13rem] aspect-square max-h-full rounded-[18%] border-heavy border-[#000] grid place-items-center disabled:cursor-default focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#3dff9a]"
      style={{ background: open ? '#0c1a14' : 'linear-gradient(160deg, #3a3170, #241c3d)', boxShadow: `0 6px 0 #000, 0 0 ${can ? 26 : 10}px ${GLOW}${can ? 'aa' : '44'}`, opacity: show && !open ? 0.8 : 1 }}
      initial={still ? false : { scale: 0, rotate: -20 }}
      animate={still ? { scale: 1, rotate: 0 } : can ? { scale: 1, rotate: 0, x: [0, 0, -3, 4, 0, 0], skewX: [0, 0, 6, -4, 0, 0] } : { scale: 1, rotate: 0, x: waiting ? [0, -1, 1, 0] : 0 }}
      transition={can ? { scale: { type: 'spring', stiffness: 240, damping: 14, delay: slot * 0.07 }, rotate: { type: 'spring', delay: slot * 0.07 }, default: { duration: 1.6 + seed, repeat: Infinity, repeatDelay: seed * 1.5, times: [0, 0.8, 0.85, 0.9, 0.95, 1] } } : { type: 'spring', stiffness: 240, damping: 14, delay: slot * 0.07 }}
      whileHover={can && !still ? { scale: 1.07 } : undefined} whileTap={can && !still ? { scale: 0.94 } : undefined}>
      {!show ? (
        <svg viewBox="0 0 100 100" className="w-[70%] h-[70%]" aria-hidden="true">
          <rect x="18" y="18" width="64" height="64" rx="10" fill="none" stroke={GLOW} strokeWidth="5" strokeDasharray="10 6" />
          <text x="50" y="66" textAnchor="middle" fontSize="46" fontWeight="900" fontFamily="ui-monospace, monospace" fill={GLOW} style={{ filter: `drop-shadow(0 0 6px ${GLOW})` }}>?</text>
          <path d="M26 30h10M64 74h10" stroke="#ef7d96" strokeWidth="4" strokeLinecap="round" />
        </svg>
      ) : (
        <motion.span className="w-[78%] h-[78%] grid place-items-center" initial={still ? false : { scale: 0.3, opacity: 0 }} animate={{ scale: open ? 1 : 0.8, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 12 }}>
          <Contents b={box} />
        </motion.span>
      )}
      {open && !still && <motion.span className="absolute inset-0 rounded-[18%]" style={{ boxShadow: `0 0 0 4px ${GLOW}` }} initial={{ opacity: 1, scale: 1 }} animate={{ opacity: 0, scale: 1.5 }} transition={{ duration: 0.7 }} />}
      <AnimatePresence>
        {pop && (
          <motion.span key={pop.id} className="absolute -top-[30%] left-0 right-0 text-center font-display whitespace-nowrap pointer-events-none"
            style={{ fontSize: 'clamp(1.6rem, 5cqmin, 3.4rem)', color: pop.good ? '#fdfd94' : '#ffd2c2', WebkitTextStroke: '0.12em #000', paintOrder: 'stroke fill' }}
            initial={still ? { opacity: 0 } : { y: 20, scale: 0.4, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 12 }}>{pop.text}</motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

function Contents({ b }: { b: DataBox }) {
  if (b.kind === 'crystals' || b.kind === 'mega') {
    const n = b.kind === 'mega' ? 3 : b.n >= 30 ? 2 : 1;
    return (
      <span className="relative w-full h-full">
        {Array.from({ length: n }, (_, i) => <img key={i} src={GEMS[(i + (b.kind === 'mega' ? 3 : 0)) % GEMS.length]} alt="" className="absolute w-[62%] drop-shadow-[0_0_8px_rgba(61,255,154,0.6)]" style={{ left: `${19 + (i - (n - 1) / 2) * 26}%`, top: `${18 + (i % 2) * 8}%` }} />)}
        <span className="absolute bottom-0 inset-x-0 text-center font-mono font-black" style={{ color: GLOW, fontSize: 'clamp(0.9rem, 3cqmin, 1.6rem)' }}>{b.n}</span>
      </span>
    );
  }
  if (b.kind === 'hack') return <Art kind="autohack" />;
  if (b.kind === 'virus') return <Art kind="virus" />;
  return <span className="font-mono font-black text-center leading-none" style={{ color: '#ef7d96', fontSize: 'clamp(1rem, 3.6cqmin, 2rem)' }}>Empty</span>;
}

// Crack the code: four code cards (two with a Decoder), one is right.
function CrackPanel({ crack, still, can, name, colorIndex, onPick }: { crack: Crack; still: boolean; can: boolean; name: string; colorIndex: number; onPick: (i: number) => void }) {
  return (
    <motion.div className="w-full h-full grid grid-rows-[auto_1fr] gap-[3%] place-items-center p-[2%]" initial={still ? false : { scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 16 }}>
      <div className="flex items-center gap-3 rounded-full border-std border-[#000] px-4 py-1.5" style={{ background: '#0c1a14', color: GLOW }}>
        <LockKey weight="fill" size={28} aria-hidden="true" />
        <TeamBadge colorIndex={colorIndex} size={36} />
        <span className="font-display text-white text-[clamp(1.1rem,3.4cqmin,2rem)]">{name}</span>
      </div>
      <div className={`w-full h-full grid gap-[3%] ${crack.codes.length > 2 ? 'grid-cols-2 grid-rows-2' : 'grid-cols-2 grid-rows-1'} max-w-[46rem]`}>
        {crack.codes.map((cd, i) => {
          const picked = crack.picked === i;
          const right = sameCode(cd, crack.real);
          const state = crack.picked === null ? 'open' : picked ? (right ? 'yes' : 'no') : 'off';
          return (
            <motion.button key={i} type="button" disabled={!can} onClick={() => onPick(i)} aria-label={`Code ${cd.map((s) => SYM[s].name).join(', ')}`}
              className="relative rounded-2xl border-heavy border-[#000] flex items-center justify-center gap-[6%] px-[4%] disabled:cursor-default focus-visible:outline-4 focus-visible:outline-[#3dff9a]"
              style={{ background: state === 'yes' ? '#1f6b45' : state === 'no' ? '#6b1f33' : '#2b2357', boxShadow: `0 6px 0 #000, 0 0 16px ${GLOW}55`, opacity: state === 'off' ? 0.45 : 1 }}
              initial={still ? false : { y: 40, opacity: 0 }} animate={state === 'no' && !still ? { y: 0, opacity: 1, x: [0, -12, 12, -8, 8, 0] } : state === 'yes' && !still ? { y: 0, opacity: 1, scale: [1, 1.1, 1] } : { y: 0, opacity: state === 'off' ? 0.45 : 1 }}
              transition={{ delay: crack.picked === null ? i * 0.1 : 0, duration: 0.5 }} whileHover={can && !still ? { scale: 1.05 } : undefined}>
              {cd.map((s, k) => { const S = SYM[s]; return <span key={k} className="h-[64%] aspect-square rounded-full border-std border-[#000] grid place-items-center" style={{ background: '#0c1a14' }}><S.icon weight="fill" color={S.color} className="w-[62%] h-[62%]" /></span>; })}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

// A team's server rack: a crystal tower grows inside its glass.
function Server({ code, crystals, max, colorIndex, name, active, wall, still, target, flowing, flowKey, flowN, onTarget }: {
  code?: Code; crystals: number; max: number; colorIndex: number; name: string; active: boolean; wall: boolean; still: boolean; target: boolean; flowing: 'in' | 'out' | null; flowKey: number; flowN: number; onTarget: () => void;
}) {
  const gems = Math.min(12, Math.ceil((crystals / max) * 12));
  return (
    <motion.button type="button" disabled={!target} onClick={onTarget} aria-label={target ? `Crack ${name}'s code` : `${name}: ${crystals} crystals`}
      className="relative h-full flex-1 min-w-0 max-w-[11rem] rounded-2xl border-heavy border-[#000] flex flex-col items-center justify-end p-[4%] gap-1 disabled:cursor-default focus-visible:outline-4 focus-visible:outline-[#3dff9a]"
      style={{ background: 'linear-gradient(180deg, #3a3170, #2b2357)', boxShadow: active ? `0 6px 0 #000, 0 0 24px ${GLOW}` : '0 6px 0 #000' }}
      animate={target && !still ? { y: [0, -8, 0] } : { y: 0 }} transition={target ? { duration: 0.8, repeat: Infinity } : undefined} whileHover={target && !still ? { scale: 1.05 } : undefined}>
      {/* Blinking lights. */}
      <span className="absolute top-[5%] left-[8%] flex gap-1" aria-hidden="true">
        {[0, 1, 2].map((i) => <motion.span key={i} className="w-2 h-2 rounded-full" style={{ background: i === 1 ? '#ef7d96' : GLOW }} animate={still ? undefined : { opacity: [1, 0.55, 1] }} transition={{ ease: 'easeInOut', duration: 2.4 + i * 0.3, repeat: Infinity }} />)}
      </span>
      <div className="relative w-full flex-1 min-h-0 rounded-lg border-std border-[#000] overflow-clip flex flex-wrap-reverse content-start justify-center" style={{ background: '#0c1a14', containerType: 'size' }}>
        {Array.from({ length: gems }, (_, i) => (
          <motion.img key={i} src={GEMS[i % GEMS.length]} alt="" aria-hidden="true" className="shrink-0" style={{ width: 'min(33cqw, 24cqh)', margin: '-1%' }}
            initial={still ? false : { y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 280, damping: 14, delay: i * 0.02 }} />
        ))}
        {wall && <motion.div className="absolute inset-0 grid grid-cols-3 gap-[3px] p-[3px]" initial={still ? false : { y: '-100%' }} animate={{ y: 0 }} transition={{ type: 'spring', stiffness: 220, damping: 16 }}>
          {Array.from({ length: 6 }, (_, i) => <span key={i} className="rounded-sm border-2 border-[#000]" style={{ background: '#1f8f5a', opacity: 0.8 }} />)}
        </motion.div>}
        <AnimatePresence>
          {flowing && <motion.span key={flowKey} className="absolute inset-0 grid place-items-center font-display" style={{ background: flowing === 'in' ? `${GLOW}44` : '#ef7d9644', color: flowing === 'in' ? '#fdfd94' : '#ffd2c2', fontSize: 'clamp(1.2rem, 22cqw, 2.6rem)', WebkitTextStroke: '0.1em #000', paintOrder: 'stroke fill' }}
            initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 0] }} exit={{ opacity: 0 }} transition={{ duration: 2, times: [0, 0.15, 0.75, 1] }}>{flowing === 'in' ? `+${flowN}` : `-${flowN}`}</motion.span>}
        </AnimatePresence>
      </div>
      <span className="flex items-center gap-1.5 min-w-0">
        <TeamBadge colorIndex={colorIndex} size={34} />
        <span className="font-mono font-black text-white leading-none" style={{ fontSize: 'clamp(0.9rem, 2.6cqmin, 1.4rem)' }}>{crystals}</span>
      </span>
      <span className="flex gap-1" aria-label={code ? `Code: ${code.map((sy) => SYM[sy].name).join(', ')}` : 'Code hidden'}>
        {[0, 1, 2].map((i) => {
          const S = code ? SYM[code[i]] : null;
          return (
            <motion.span key={`${i}${code ? code[i] : ''}`} className="w-[clamp(1.2rem,5cqmin,2rem)] aspect-square rounded-full border-2 border-[#000] grid place-items-center" style={{ background: '#0c1a14' }}
              initial={still || !code ? false : { rotateY: 90 }} animate={{ rotateY: 0 }} transition={{ delay: i * 0.12 }}>
              {S && <S.icon weight="fill" color={S.color} className="w-[70%] h-[70%]" />}
            </motion.span>
          );
        })}
      </span>
      {target && <span className="absolute -inset-2 rounded-3xl border-4 border-dashed pointer-events-none" style={{ borderColor: GLOW }} />}
    </motion.button>
  );
}

// Byte, the lab's cute robot: blinks, cheers, droops, spins and hiccups.
function Robot({ mood, still }: { mood: 'idle' | 'happy' | 'sad' | 'spin' | 'hic'; still: boolean }) {
  const anim = still ? undefined : mood === 'happy' ? { y: [0, -24, 0, -12, 0], rotate: 0 } : mood === 'sad' ? { y: [0, 6, 6, 0], rotate: [0, -8, -8, 0] } : mood === 'spin' ? { rotate: [0, 360, 720] } : mood === 'hic' ? { y: [0, -18, 0, -18, 0], scaleY: [1, 0.85, 1.1, 0.85, 1] } : { y: [0, -4, 0], rotate: 0 };
  return (
    <motion.div className="h-full aspect-[3/4] shrink-0" animate={anim} transition={mood === 'idle' ? { duration: 2.2, repeat: Infinity } : { duration: mood === 'spin' ? 1.2 : 1 }} aria-hidden="true">
      <svg viewBox="0 0 90 120" className="w-full h-full overflow-visible">
        <path d="M45 18V6" stroke="#000" strokeWidth="4" />
        <motion.circle cx="45" cy="6" r="6" fill={mood === 'sad' ? '#ef7d96' : GLOW} stroke="#000" strokeWidth="3" animate={still ? undefined : { opacity: [1, 0.55, 1] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }} />
        <rect x="12" y="18" width="66" height="50" rx="16" fill="#b4c4fb" stroke="#000" strokeWidth="4" />
        <rect x="20" y="26" width="50" height="32" rx="10" fill="#0c1a14" stroke="#000" strokeWidth="3" />
        {mood === 'happy' ? <><path d="M28 44q6-8 12 0M50 44q6-8 12 0" stroke={GLOW} strokeWidth="4" fill="none" strokeLinecap="round" /></>
          : mood === 'sad' ? <><path d="M28 40h12M50 40h12" stroke="#ef7d96" strokeWidth="4" strokeLinecap="round" /></>
          : <motion.g animate={still ? undefined : { scaleY: [1, 1, 0.1, 1] }} transition={{ duration: 3, repeat: Infinity, times: [0, 0.9, 0.95, 1] }} style={{ originY: '42px' }}><circle cx="34" cy="42" r="6" fill={GLOW} /><circle cx="56" cy="42" r="6" fill={GLOW} /></motion.g>}
        <path d={mood === 'sad' ? 'M36 54q9-5 18 0' : 'M36 50q9 6 18 0'} stroke={mood === 'sad' ? '#ef7d96' : GLOW} strokeWidth="3" fill="none" strokeLinecap="round" />
        <circle cx="16" cy="56" r="4" fill="#ef7d96" opacity="0.7" /><circle cx="74" cy="56" r="4" fill="#ef7d96" opacity="0.7" />
        <rect x="22" y="72" width="46" height="34" rx="10" fill="#fdfd94" stroke="#000" strokeWidth="4" />
        <circle cx="45" cy="88" r="7" fill="#8fe3a0" stroke="#000" strokeWidth="3" />
        <path d="M22 82q-14 4-14 18M68 82q14 4 14 18" stroke="#000" strokeWidth="5" fill="none" strokeLinecap="round" />
        <rect x="26" y="106" width="12" height="10" rx="3" fill="#241c3d" /><rect x="52" y="106" width="12" height="10" rx="3" fill="#241c3d" />
        {mood === 'hic' && <text x="70" y="16" fontSize="16" fontWeight="900" fill="#fff" stroke="#000" strokeWidth="1">hic!</text>}
      </svg>
    </motion.div>
  );
}

// The lab: a glowing grid floor, scanlines and drifting code bits.
function LabRoom({ still }: { still: boolean }) {
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: `linear-gradient(${GLOW}33 1px, transparent 1px), linear-gradient(90deg, ${GLOW}33 1px, transparent 1px)`, backgroundSize: '2.4rem 2.4rem' }} />
      <div className="absolute inset-x-0 bottom-0 h-[40%]" style={{ background: `linear-gradient(0deg, ${GLOW}22, transparent)` }} />
      {Array.from({ length: 10 }, (_, i) => (
        <motion.span key={i} className="absolute font-mono font-bold" style={{ left: `${5 + i * 9.5}%`, color: `${GLOW}55`, fontSize: '1rem' }} initial={{ top: `${(i * 37) % 100}%` }}
          animate={still ? undefined : { top: ['-5%', '105%'] }} transition={{ duration: 9 + (i % 4) * 3, repeat: Infinity, ease: 'linear', delay: -i * 1.3 }}>{i % 2 ? '1 0 1' : '0 1'}</motion.span>
      ))}
      <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0 2px, transparent 2px 5px)' }} />
    </div>
  );
}

function PowerFx({ kind, still, onDone }: { kind: string; still: boolean; onDone: () => void }) {
  useEffect(() => { const id = window.setTimeout(onDone, 1500); return () => window.clearTimeout(id); }, [onDone]);
  const art = POWERS.find((p) => p.id === kind)?.art;
  const center = 'absolute left-1/2 top-1/2 w-[26cqmin] h-[26cqmin] -ml-[13cqmin] -mt-[13cqmin]';
  const base = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: 'absolute inset-0 pointer-events-none' };
  if (still) return <motion.div {...base}><div className={center}>{art}</div></motion.div>;
  if (kind === 'scan') return <motion.div {...base}><motion.div className="absolute inset-x-0 h-[6%]" style={{ background: `linear-gradient(180deg, transparent, ${GLOW}, transparent)`, boxShadow: `0 0 30px ${GLOW}` }} initial={{ top: '-6%' }} animate={{ top: ['-6%', '100%', '-6%'] }} transition={{ duration: 1.5, ease: 'easeInOut' }} /></motion.div>;
  if (kind === 'overclock') return <motion.div {...base}><motion.div className={center} animate={{ rotate: [0, 720], scale: [0.5, 1.2, 1] }} transition={{ duration: 1.2 }}>{art}</motion.div>{Array.from({ length: 8 }, (_, i) => <motion.span key={i} className="absolute left-1/2 top-1/2 w-2 h-8 rounded-full" style={{ background: '#fdfd94', rotate: `${i * 45}deg` }} initial={{ x: 0, y: 0, opacity: 1 }} animate={{ x: Math.cos((i * Math.PI) / 4) * 160, y: Math.sin((i * Math.PI) / 4) * 160, opacity: 0 }} transition={{ delay: 0.5, duration: 0.7 }} />)}</motion.div>;
  if (kind === 'twobox') return <motion.div {...base}>{[-1, 1].map((d) => <motion.div key={d} className="absolute left-1/2 top-1/2 w-[16cqmin] h-[16cqmin] -ml-[8cqmin] -mt-[8cqmin]" initial={{ x: 0, y: 40, scale: 0 }} animate={{ x: d * 120, y: [40, -60, 0], scale: 1, rotate: d * 20 }} transition={{ duration: 0.9, ease: 'easeOut' }}><Art kind="box" /></motion.div>)}</motion.div>;
  if (kind === 'rain') return <motion.div {...base}>{Array.from({ length: 16 }, (_, i) => <motion.img key={i} src={GEMS[i % GEMS.length]} alt="" className="absolute w-[7cqmin]" style={{ left: `${4 + (i * 6) % 92}%` }} initial={{ top: '-10%', rotate: 0 }} animate={{ top: '110%', rotate: 360 }} transition={{ delay: (i % 6) * 0.12, duration: 1.1, ease: 'easeIn' }} />)}</motion.div>;
  if (kind === 'autohack') return <motion.div {...base}><motion.div className="absolute inset-0" style={{ background: `repeating-linear-gradient(0deg, ${GLOW}22 0 4px, transparent 4px 12px)` }} initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.4, ease: 'easeInOut' }} /><motion.div className={center} animate={{ scale: [0.4, 1.2, 1], rotate: [0, -10, 10, 0] }} transition={{ duration: 0.8 }}>{art}</motion.div></motion.div>;
  if (kind === 'firewall') return <motion.div {...base}><div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 grid grid-cols-4 gap-1 w-[34cqmin]">{Array.from({ length: 12 }, (_, i) => <motion.span key={i} className="aspect-[2/1] rounded-sm border-[3px] border-black" style={{ background: '#1f8f5a' }} initial={{ y: -300, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: (11 - i) * 0.06, type: 'spring', stiffness: 260, damping: 14 }} />)}</div></motion.div>;
  if (kind === 'decoder') return <motion.div {...base}><motion.div className={center} animate={{ x: [-120, 120, -60, 0], rotate: [0, 20, -20, 0] }} transition={{ duration: 1.4 }}>{art}</motion.div></motion.div>;
  if (kind === 'cat') return <motion.div {...base}><motion.div className="absolute bottom-[2%] w-[24cqmin] h-[18cqmin]" initial={{ left: '-25%' }} animate={{ left: '105%', y: [0, -8, 0, -8, 0, -8, 0] }} transition={{ duration: 1.8, ease: 'linear' }}><Art kind="cat" /></motion.div>{['k', 'j', ';', 'm', 'w', '#', 'z'].map((ch, i) => <motion.span key={i} className="absolute font-mono font-black text-3xl" style={{ color: GLOW, left: `${10 + i * 12}%`, top: '30%' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: [0, 1, 0], y: -30 }} transition={{ delay: 0.2 + i * 0.18, duration: 0.7 }}>{ch}</motion.span>)}</motion.div>;
  if (kind === 'hiccup') return <motion.div {...base}>{[0, 1, 2].map((i) => <motion.span key={i} className="absolute left-[6%] bottom-[30%] rounded-full bg-white border-[3px] border-black px-2 font-black" initial={{ opacity: 0, y: 0, scale: 0.4 }} animate={{ opacity: [0, 1, 0], y: -100 - i * 20, scale: 1 }} transition={{ delay: i * 0.5, duration: 0.9 }}>hic!</motion.span>)}<motion.img src={GEMS[2]} alt="" className="absolute left-[8%] w-[6cqmin]" initial={{ bottom: '28%', opacity: 1 }} animate={{ bottom: ['28%', '4%', '20%', '28%'], rotate: [0, 200, 300, 360], opacity: 1 }} transition={{ delay: 0.8, duration: 1.1, ease: 'easeInOut' }} /></motion.div>;
  return null;
}

function ImgArt({ src }: { src: string }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="44" fill="#241c3d" stroke="#000" strokeWidth="5" />
      <circle cx="50" cy="50" r="38" fill="none" stroke={GLOW} strokeWidth="3" strokeDasharray="6 5" />
      <image href={src} x="22" y="20" width="56" height="60" preserveAspectRatio="xMidYMid meet" />
    </svg>
  );
}

function Art({ kind }: { kind: string }) {
  const ring = (fill = '#241c3d') => <><circle cx="50" cy="50" r="44" fill={fill} stroke="#000" strokeWidth="5" /><circle cx="50" cy="50" r="38" fill="none" stroke={GLOW} strokeWidth="3" strokeDasharray="6 5" /></>;
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className="w-full h-full overflow-visible">
      {kind === 'scan' && <>{ring()}<rect x="26" y="26" width="48" height="48" rx="8" fill="#0c1a14" stroke={GLOW} strokeWidth="4" /><path d="M24 50h52" stroke={GLOW} strokeWidth="5" /><circle cx="50" cy="44" r="8" fill="#fdfd94" stroke="#000" strokeWidth="3" /></>}
      {kind === 'twobox' && <>{ring()}<rect x="18" y="34" width="30" height="30" rx="6" fill="#3a3170" stroke={GLOW} strokeWidth="4" /><rect x="52" y="34" width="30" height="30" rx="6" fill="#3a3170" stroke={GLOW} strokeWidth="4" /><text x="33" y="57" textAnchor="middle" fontSize="20" fontWeight="900" fill={GLOW}>?</text><text x="67" y="57" textAnchor="middle" fontSize="20" fontWeight="900" fill={GLOW}>?</text></>}
      {kind === 'box' && <><rect x="8" y="8" width="84" height="84" rx="16" fill="#3a3170" stroke="#000" strokeWidth="6" /><rect x="20" y="20" width="60" height="60" rx="10" fill="none" stroke={GLOW} strokeWidth="5" strokeDasharray="10 6" /><text x="50" y="66" textAnchor="middle" fontSize="44" fontWeight="900" fill={GLOW}>?</text></>}
      {kind === 'rain' && <>{ring()}<path d="M30 30q10-14 24-6 16-4 20 10 10 4 4 14H26q-10-8 4-18z" fill="#b4c4fb" stroke="#000" strokeWidth="4" /><path d="M36 62l4 8 4-8-4-4zM54 66l4 8 4-8-4-4zM45 76l4 8 4-8-4-4z" fill="#8fe3a0" stroke="#000" strokeWidth="2.5" /></>}
      {kind === 'autohack' && <>{ring('#0c1a14')}<rect x="24" y="44" width="52" height="36" rx="8" fill="#f6c544" stroke="#000" strokeWidth="4" /><path d="M34 44V34q0-16 16-16t16 16" stroke="#000" strokeWidth="6" fill="none" transform="rotate(-18 66 34)" /><circle cx="50" cy="60" r="6" fill="#000" /><path d="M50 62v8" stroke="#000" strokeWidth="4" /></>}
      {kind === 'firewall' && <>{ring()}{[[24, 30], [50, 30], [37, 46], [63, 46], [24, 62], [50, 62]].map(([x, y], i) => <rect key={i} x={x} y={y} width="24" height="14" rx="2" fill="#1f8f5a" stroke="#000" strokeWidth="3" />)}<path d="M40 30q4-10 10-12 2 8 8 12" fill="#ef7d96" stroke="#000" strokeWidth="2" /></>}
      {kind === 'virus' && <><circle cx="50" cy="52" r="26" fill="#c58ce8" stroke="#000" strokeWidth="4" />{[0, 60, 120, 180, 240, 300].map((a) => <circle key={a} cx={50 + Math.cos((a * Math.PI) / 180) * 34} cy={52 + Math.sin((a * Math.PI) / 180) * 34} r="6" fill="#c58ce8" stroke="#000" strokeWidth="3" />)}<circle cx="42" cy="48" r="4" fill="#000" /><circle cx="58" cy="48" r="4" fill="#000" /><path d="M42 62q8 6 16 0" stroke="#000" strokeWidth="3" fill="none" strokeLinecap="round" /></>}
      {kind === 'cat' && <><path d="M18 84V46l8-20 12 14h24l12-14 8 20v38z" fill="#f39a6b" stroke="#000" strokeWidth="4" strokeLinejoin="round" /><circle cx="38" cy="56" r="4" fill="#000" /><circle cx="62" cy="56" r="4" fill="#000" /><path d="M46 66l4 4 4-4M30 66h-12M70 66h12" stroke="#000" strokeWidth="3" fill="none" strokeLinecap="round" /><path d="M82 70q14-8 10-26" stroke="#000" strokeWidth="6" fill="none" strokeLinecap="round" /></>}
      {kind === 'hiccup' && <>{ring('#e9eefe')}<rect x="28" y="30" width="44" height="34" rx="10" fill="#b4c4fb" stroke="#000" strokeWidth="4" /><circle cx="40" cy="46" r="4" fill="#000" /><circle cx="60" cy="46" r="4" fill="#000" /><ellipse cx="50" cy="56" rx="5" ry="3" fill="#000" /><text x="62" y="26" fontSize="14" fontWeight="900" fill="#000">hic!</text><path d="M44 66l6 14 6-14z" fill="#8fe3a0" stroke="#000" strokeWidth="3" /></>}
    </svg>
  );
}

function Cover() {
  return (
    <svg viewBox="0 0 100 62" preserveAspectRatio="xMidYMid slice">
      <rect width="100" height="62" fill="#1b1533" />
      <path d="M0 10H100M0 20H100M0 30H100M0 40H100M0 50H100M10 0V62M20 0V62M30 0V62M40 0V62M50 0V62M60 0V62M70 0V62M80 0V62M90 0V62" stroke="#3dff9a" strokeOpacity="0.15" strokeWidth="0.4" />
      <rect x="6" y="5" width="88" height="8" rx="2" fill="#0c1a14" stroke="#000" strokeWidth="0.6" />
      <text x="9" y="11" fontSize="5" fontFamily="monospace" fontWeight="900" fill="#3dff9a">{'> crack the code_'}</text>
      {[0, 1, 2].map((i) => <g key={i} transform={`translate(${30 + i * 17} 19)`}><rect width="14" height="14" rx="3" fill="#3a3170" stroke="#000" strokeWidth="0.7" /><rect x="2.5" y="2.5" width="9" height="9" rx="1.5" fill="none" stroke="#3dff9a" strokeWidth="0.8" strokeDasharray="2 1" /><text x="7" y="10.5" textAnchor="middle" fontSize="7" fontWeight="900" fill="#3dff9a">?</text></g>)}
      <g transform="translate(6 30)"><rect x="2" y="4" width="16" height="13" rx="4" fill="#b4c4fb" stroke="#000" strokeWidth="0.8" /><rect x="4" y="6" width="12" height="8" rx="2.5" fill="#0c1a14" /><circle cx="7.5" cy="10" r="1.5" fill="#3dff9a" /><circle cx="12.5" cy="10" r="1.5" fill="#3dff9a" /><rect x="4" y="18" width="12" height="9" rx="2.5" fill="#fdfd94" stroke="#000" strokeWidth="0.8" /><path d="M10 4V1" stroke="#000" strokeWidth="0.8" /><circle cx="10" cy="1" r="1.2" fill="#3dff9a" /></g>
      {[0, 1].map((i) => <g key={i} transform={`translate(${38 + i * 28} 36)`}><rect width="22" height="22" rx="3" fill="#2b2357" stroke="#000" strokeWidth="0.8" /><rect x="2" y="2" width="18" height="13" rx="1.5" fill="#0c1a14" />{[0, 1, 2].slice(0, i + 2).map((g) => <path key={g} d={`M${6 + g * 5} 13l2-4 2 4-2 1.5z`} fill={['#8fe3a0', '#7fd6e3', '#ef7d96'][g]} stroke="#000" strokeWidth="0.4" />)}<circle cx="11" cy="18.5" r="2" fill={['#f6c544', '#5cc3a0'][i]} stroke="#000" strokeWidth="0.5" /></g>)}
    </svg>
  );
}

const def: LabDef = {
  id: 'code-crackers',
  name: 'Code Crackers',
  description: 'Answer right to open a glitchy data box. Find crystals, or crack another team\'s code to borrow some.',
  ways: ['teams', 'solo'],
  minTeams: 2,
  maxTeams: 5,
  how: [
    { icon: <CheckCircle weight="fill" />, text: 'Answer the question' },
    { icon: <LockKey weight="fill" />, text: 'Right? Open a data box' },
    { icon: <Trophy weight="fill" />, text: 'Most crystals wins' },
  ],
  rounds: { label: 'Rounds', min: 3, max: 20, default: 8 },
  powers: POWERS,
  background: 'radial-gradient(120% 90% at 50% 10%, #3a3170 0%, #241c3d 70%)',
  cover: <Cover />,
  pieces: [
    { id: 'background', label: 'Computer lab', hint: 'The glowing room behind everything' },
    { id: 'box', label: 'Data box', hint: 'A closed box to pick' },
    { id: 'crystal', label: 'Crystal', hint: 'One crystal (the points)' },
    { id: 'server', label: 'Team server', hint: 'Where each team keeps its crystals' },
    { id: 'robot', label: 'Robot helper', hint: 'Byte, the lab robot' },
    { id: 'symbols', label: 'Code symbols', hint: 'The six symbols codes are made of' },
    { id: 'virus', label: 'Silly virus', hint: 'The oops picture in a box' },
    ...POWERS.map((p) => ({ id: `power-${p.id}`, label: p.name, hint: p.desc })),
  ],
  Play,
};
export default def;
