import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowFatLeft, ArrowFatRight, CheckCircle, Trophy } from '@phosphor-icons/react';
import { playClip } from '../../../engine/music';
import { TeamBadge } from '../../../engine/TeamBadge';
import type { LabCtx, LabDef, LabPower } from '../../types';
import { CHUTE_X, CLAW_MAX, CLAW_MIN, cpuAim, grabChance, makePile, refill, slipChance, under, VALUE, type Prize, type Rarity } from './rules';

// Prize Crane (Game Lab, inspired by the general idea of claw machine
// quiz games): a glass cabinet full of plush animals. A right answer gives a
// turn: slide the claw left or right (hold or tap), press the big button to
// drop it. It may grab, wobble and drop (aim plus a little luck). Prizes
// slide out of the chute onto your shelf; rare ones sparkle.

const A = '/lab/prize-crane';
const GLASS_AR = 4 / 3;
const PRIZE_W = 15; // % of the glass width
const PRIZE_H = PRIZE_W * GLASS_AR; // % of the glass height
const ROW_Y = [3, 3 + PRIZE_H * 0.62];
const SPEED = 0.42; // glass widths a second
const AIM_SECS = 16;

const POWERS: LabPower[] = [
  { id: 'grip', name: 'Super Grip', desc: 'The claw holds on tight: no slipping this turn.', enter: 'zoom', art: <ImgArt src={`${A}/magnet.webp`} ring="#ffd9cf" /> },
  { id: 'wide', name: 'Wide Claw', desc: 'The claw opens extra wide and grabs more easily.', enter: 'spin', art: <Art kind="wide" /> },
  { id: 'extra', name: 'Extra Try', desc: 'Drop the claw two times this turn.', enter: 'drop', art: <ImgArt src={`${A}/time.webp`} ring="#e9eefe" /> },
  { id: 'laser', name: 'Laser Guide', desc: 'A dotted laser shows right where the claw will land.', enter: 'zoom', art: <Art kind="laser" /> },
  { id: 'double', name: 'Double Prize', desc: 'The prize you win counts two times.', enter: 'spin', art: <Art kind="double" /> },
  { id: 'rare', name: 'Rare Drop', desc: 'A sparkly super rare plush drops into the machine.', enter: 'drop', art: <Art kind="rare" /> },
  { id: 'tilt', name: 'Tilt Shake', desc: 'The machine wobbles and a prize tumbles into the chute for you.', enter: 'wiggle', art: <Art kind="tilt" /> },
  { id: 'butter', name: 'Butter Fingers', desc: 'Oops! Butter drips off the claw, so it is a tiny bit slippery.', silly: true, art: <ImgArt src={`${A}/potion.webp`} ring="#fff6b0" /> },
  { id: 'tickle', name: 'Claw Tickle', desc: 'Hee hee! The claw giggles and wiggles to a new spot.', silly: true, art: <Art kind="tickle" /> },
];

type Phase = 'ask' | 'aim' | 'drop' | 'busy';
interface Flags { wide: boolean; grip: boolean; butter: boolean; laser: boolean; double: boolean }
const noFlags = (): Flags => ({ wide: false, grip: false, butter: false, laser: false, double: false });
interface Won { id: number; p: Prize }

let uid = 100;
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
  const wide = size.w / Math.max(1, size.h) > 1.2;
  const [pile, setPile] = useState<Prize[]>(() => makePile(1));
  const pileRef = useRef(pile); pileRef.current = pile;
  const [x, setX] = useState(0.5);
  const xRef = useRef(0.5); xRef.current = x;
  const [glide, setGlide] = useState(0.7);
  const [depth, setDepth] = useState(0); // cable length, % of glass height
  const [drop, setDrop] = useState(1.1);
  const [open, setOpen] = useState(true);
  const [carry, setCarry] = useState<Prize | null>(null);
  const [falling, setFalling] = useState<{ p: Prize; from: number } | null>(null);
  const [chute, setChute] = useState<Prize | null>(null);
  const [phase, setPhase] = useState<Phase>('ask');
  const phaseRef = useRef(phase); phaseRef.current = phase;
  const [shelves, setShelves] = useState<Record<string, Won[]>>({});
  const [fx, setFx] = useState<{ id: number; kind: string } | null>(null);
  const [shake, setShake] = useState(0);
  const [tickle, setTickle] = useState(false);
  const [left, setLeft] = useState(1);
  const flags = useRef<Flags>(noFlags());
  const [flagView, setFlagView] = useState<Flags>(noFlags());
  const turn = useRef(0);
  const dropRef = useRef<(() => void) | null>(null);
  const hold = useRef(0);
  const missed = useRef<Record<string, number>>({});
  const aimSecs = ctx.timeScale ? AIM_SECS * ctx.timeScale : 0;
  const me = ctx.player;
  const players = ctx.turns.players;
  const alive = (t: number) => turn.current === t;
  useEffect(() => () => { turn.current = -1; }, []);

  const moveTo = async (to: number, secs: number) => { setGlide(secs); setX(Math.max(CLAW_MIN, Math.min(CLAW_MAX, to))); await sleep(secs * 1000); };

  useEffect(() => {
    const t = ++turn.current;
    const x0 = c.current;
    flags.current = noFlags(); setFlagView(noFlags()); setPhase('ask'); setLeft(1);
    void x0.ask().then(async (ok) => {
      if (!alive(t)) return;
      if (!ok) { c.current.sfx.wrong(); await sleep(700); if (alive(t)) c.current.next(); return; }
      c.current.sfx.bell(); setPhase('busy');
      const p = await c.current.power(0.45);
      if (!alive(t)) return;
      let drops = 1;
      if (p) { drops = await fire(p, t); if (!alive(t)) return; }
      setFlagView({ ...flags.current });
      for (let i = 0; i < drops; i++) {
        setLeft(drops - i);
        setPhase('aim'); c.current.sfx.whoosh();
        if (i === 0) c.current.say(drops > 1 ? 'Two tries!' : 'Move the claw!', 'good');
        await new Promise<void>((r) => { dropRef.current = r; });
        if (!alive(t)) return;
        await dropClaw(t);
        if (!alive(t)) return;
      }
      await topUp(t);
      if (!alive(t)) return;
      await moveTo(0.5, 0.8);
      if (alive(t)) c.current.next();
    });
  }, [ctx.taken]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fire(p: LabPower, t: number): Promise<number> {
    const x0 = c.current, f = flags.current;
    setFx({ id: uid++, kind: p.id });
    let drops = 1;
    if (p.id === 'grip') { f.grip = true; x0.sfx.magnet(); }
    if (p.id === 'wide') { f.wide = true; x0.sfx.boing(); }
    if (p.id === 'extra') { drops = 2; x0.sfx.bell(); }
    if (p.id === 'laser') { f.laser = true; x0.sfx.zap(); }
    if (p.id === 'double') { f.double = true; x0.sfx.power(); }
    if (p.id === 'butter') { f.butter = true; x0.sfx.splash(); }
    if (p.id === 'rare') {
      x0.sfx.slideDown(); await sleep(500); if (!alive(t)) return drops;
      const np = refill(pileRef.current, uid++, Math.random, 'super');
      setPile((l) => [...l, np]); x0.sfx.thud(); await sleep(400); x0.sfx.cheer();
    }
    if (p.id === 'tilt') {
      x0.sfx.crash(); if (c.current.shake) setShake((s) => s + 1); await sleep(700); if (!alive(t)) return drops;
      const pick = [...pileRef.current].sort((a, b) => a.x - b.x)[0];
      if (pick) { setPile((l) => l.filter((q) => q.id !== pick.id)); await win(pick, t); }
    }
    if (p.id === 'tickle') {
      setTickle(true); x0.sfx.boing();
      for (let i = 0; i < 6; i++) { await moveTo(CLAW_MIN + Math.random() * (CLAW_MAX - CLAW_MIN), 0.28); x0.sfx.blip(i * 3); if (!alive(t)) return drops; }
      setTickle(false);
    }
    await sleep(1100);
    return drops;
  }

  // Drop, close, lift; maybe slip; else carry to the chute.
  async function dropClaw(t: number) {
    const x0 = c.current, f = flags.current;
    setPhase('drop');
    const at = xRef.current;
    const reach = f.wide ? 0.15 : 0.09;
    const pid = x0.player.id;
    // Two misses in a row never happen: the second time a prize hops into the claw.
    const lucky = (missed.current[pid] ?? 0) >= 1;
    const target = under(pileRef.current, at, reach) ?? (lucky ? [...pileRef.current].sort((a, b) => Math.abs(a.x - at) - Math.abs(b.x - at) || b.row - a.row)[0] ?? null : null);
    const floorTop = 100 - ROW_Y[target ? target.row : 0] - (target ? PRIZE_H * 0.85 : PRIZE_H * 0.3);
    const down = Math.max(10, floorTop - 14);
    setOpen(true); x0.sfx.slideDown(); setDrop(1.3); setDepth(down);
    await sleep(1350); if (!alive(t)) return;
    setOpen(false); x0.sfx.thud();
    await sleep(380); if (!alive(t)) return;
    const got = target && (lucky || Math.random() < grabChance(target, at, f)) ? target : null;
    if (got && lucky && Math.abs(got.x - at) > reach) x0.say('Lucky bounce!', 'good');
    missed.current[pid] = got ? 0 : (missed.current[pid] ?? 0) + 1;
    if (got) { setPile((l) => l.filter((q) => q.id !== got.id)); setCarry(got); x0.sfx.tick(); }
    setDrop(1.2); setDepth(0); x0.sfx.slideUp();
    if (got && !lucky && Math.random() < slipChance(got, f)) {
      missed.current[pid] = 1;
      await sleep(620); if (!alive(t)) return;
      setCarry(null); setOpen(true); setFalling({ p: got, from: down * 0.5 });
      x0.sfx.boing(); x0.say('Oops! It slipped!', 'oops');
      await sleep(700); if (!alive(t)) return;
      setFalling(null);
      setPile((l) => [...l, { ...got, x: Math.max(0.24, Math.min(0.92, got.x + (Math.random() - 0.5) * 0.12)), row: l.some((q) => q.row === 0 && Math.abs(q.x - got.x) < 0.1) ? 1 : 0 }]);
      x0.sfx.thud();
      await sleep(700);
      setOpen(true);
      return;
    }
    await sleep(1250); if (!alive(t)) return;
    if (!got) {
      setOpen(true);
      const near = pileRef.current.some((q) => Math.abs(q.x - at) < 0.16);
      x0.sfx.oops(); x0.say(near ? 'So close!' : 'Missed!', 'oops');
      await sleep(900); return;
    }
    await moveTo(CHUTE_X, 1.1); if (!alive(t)) return;
    setOpen(true); setCarry(null);
    await win(got, t);
  }

  async function win(p: Prize, t: number) {
    const x0 = c.current, id = x0.player.id;
    setChute(p); x0.sfx.whoosh();
    await sleep(900); if (!alive(t)) return;
    setChute(null);
    setShelves((s) => ({ ...s, [id]: [...(s[id] ?? []), { id: uid++, p }] }));
    const pts = VALUE[p.rarity] * (flags.current.double ? 2 : 1);
    c.current.points(pts);
    if (p.rarity === 'common') { x0.sfx.coin(); x0.say(`+${pts}`, 'good'); }
    else { playClip(`${A}/win.mp3`, x0.settings, 0.5); x0.say(p.rarity === 'super' ? `Super rare! +${pts}` : `Rare! +${pts}`, 'big'); x0.burst(wide ? 0.8 : 0.5, wide ? 0.4 : 0.8, p.rarity === 'super' ? 'big' : 'small'); }
    await sleep(1100);
  }

  async function topUp(t: number) {
    let n = pileRef.current.length;
    while (n < 9) {
      const np = refill(pileRef.current, uid++);
      setPile((l) => [...l, np]); pileRef.current = [...pileRef.current, np];
      n++; c.current.sfx.thud();
      await sleep(350); if (!alive(t)) return;
    }
  }

  // Holding a button (or an arrow key) slides the claw.
  useEffect(() => {
    if (phase !== 'aim') return;
    let raf = 0, last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (hold.current) { setGlide(0); setX((v) => Math.max(CLAW_MIN, Math.min(CLAW_MAX, v + hold.current * SPEED * dt))); }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phase]);
  useEffect(() => {
    if (phase !== 'aim' || ctx.cpu) return;
    const down = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') { hold.current = -1; e.preventDefault(); }
      if (e.key === 'ArrowRight') { hold.current = 1; e.preventDefault(); }
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); pressDrop(); }
    };
    const up = (e: KeyboardEvent) => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') hold.current = 0; };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    // A gentle auto drop so a turn never stalls.
    const auto = aimSecs ? window.setTimeout(() => pressDrop(), aimSecs * 1000) : 0;
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.clearTimeout(auto); hold.current = 0; };
  }, [phase, ctx.cpu]); // eslint-disable-line react-hooks/exhaustive-deps

  function pressDrop() {
    if (phaseRef.current !== 'aim') return;
    hold.current = 0;
    const r = dropRef.current; dropRef.current = null; c.current.sfx.tap(); r?.();
  }
  function nudge(dir: number) { setGlide(0.25); setX((v) => Math.max(CLAW_MIN, Math.min(CLAW_MAX, v + dir * 0.05))); c.current.sfx.blip(dir > 0 ? 4 : 0); }

  // The computer glides the claw over a prize, then drops.
  useEffect(() => {
    if (!ctx.cpu || phase !== 'aim') return;
    let live = true;
    void (async () => {
      await sleep(900); if (!live) return;
      const to = cpuAim(pileRef.current, c.current.cpuRight());
      await moveTo(to, 1.2 + Math.abs(to - xRef.current) * 1.5); if (!live) return;
      await sleep(500); if (live) pressDrop();
    })();
    return () => { live = false; };
  }, [ctx.cpu, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const aiming = phase === 'aim' && !ctx.cpu;
  const target = flagView.laser && phase === 'aim' ? under(pile, x, flagView.wide ? 0.15 : 0.09) : null;
  return (
    <div ref={ref} className="absolute inset-0 rounded-panel border-heavy border-border overflow-clip" style={{ background: 'radial-gradient(120% 100% at 50% 0%, #ffe3ef 0%, #f5b8cf 55%, #d98fb4 100%)', boxShadow: '0 8px 0 #000, 0 24px 40px rgba(36,28,61,0.3)' }}>
      <Arcade still={ctx.still} />
      <div className="absolute inset-[2.5%] grid gap-[2.5%]" style={wide ? { gridTemplateColumns: 'minmax(0,1.7fr) minmax(0,1fr)' } : { gridTemplateRows: 'minmax(0,2.4fr) minmax(0,1fr)' }}>
        {/* The cabinet. */}
        <motion.div key={shake} className="relative min-w-0 min-h-0 grid grid-rows-[auto_minmax(0,1fr)_auto] rounded-[1.6rem] border-heavy border-border p-[2.5%] gap-[2%]"
          style={{ background: 'linear-gradient(180deg, #ef7d96, #d9607e)', boxShadow: '0 8px 0 #000, inset 0 0 0 6px rgba(255,255,255,0.25)' }}
          animate={shake && ctx.shake ? { rotate: [0, -3, 3, -2, 2, 0], x: [0, -10, 10, -6, 6, 0] } : undefined} transition={{ duration: 0.7 }}>
          <Marquee still={ctx.still} />
          <div className="relative min-h-0 grid place-items-center" style={{ containerType: 'size' }}>
            <div className="relative rounded-2xl border-heavy border-border overflow-clip" style={{ width: `min(100cqw, ${100 * GLASS_AR}cqh)`, aspectRatio: `${GLASS_AR}`, containerType: 'size', background: 'linear-gradient(180deg, #e6f8ff 0%, #cfeefc 70%, #b4c4fb 100%)' }}>
              {/* Back wall stripes and the rail. */}
              <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #fff 0 18px, transparent 18px 36px)' }} />
              <div className="absolute inset-x-0 top-0 h-[4%] bg-[#8a8399] border-b-[3px] border-black" />
              {/* The chute. */}
              <div className="absolute left-0 bottom-0 w-[17%] h-[40%] rounded-tr-2xl border-t-[4px] border-r-[4px] border-black" style={{ background: 'linear-gradient(180deg, #241c3d, #3a3170)' }}>
                <div className="absolute inset-x-[10%] top-[10%] h-[14%] rounded-md bg-[#fdfd94] border-2 border-black grid place-items-center"><ArrowFatLeft weight="fill" className="w-[60%] h-[70%] rotate-[-90deg]" /></div>
              </div>
              {/* The pile. */}
              {pile.map((p) => <PrizeArt key={p.id} p={p} still={ctx.still} glow={target?.id === p.id} style={{ left: `${p.x * 100 - PRIZE_W / 2}%`, bottom: `${ROW_Y[p.row]}%`, zIndex: 2 + p.row }} drop />)}
              {falling && <motion.div className="absolute z-[5]" style={{ left: `${x * 100 - PRIZE_W / 2}%`, width: `${PRIZE_W}%` }} initial={{ top: `${falling.from}%` }} animate={{ top: `${100 - ROW_Y[0] - PRIZE_H}%`, rotate: 200 }} transition={{ duration: 0.6, ease: 'easeIn' }}><PrizeImg p={falling.p} /></motion.div>}
              <AnimatePresence>
                {chute && <motion.div key={chute.id} className="absolute z-[6]" style={{ left: `${CHUTE_X * 100 - PRIZE_W / 2}%`, width: `${PRIZE_W}%` }} initial={{ top: '22%' }} animate={{ top: '110%', rotate: -30 }} exit={{ opacity: 0 }} transition={{ duration: 0.8, ease: 'easeIn' }}><PrizeImg p={chute} /></motion.div>}
              </AnimatePresence>
              {/* The laser. */}
              {flagView.laser && phase === 'aim' && <motion.div className="absolute top-[4%] bottom-0 w-0 z-[1] border-l-[4px] border-dashed border-[#ef4b4b]" style={{ left: `${x * 100}%` }} animate={{ left: `${x * 100}%` }} transition={{ duration: glide }} />}
              {/* The claw. */}
              <Claw x={x} glide={glide} depth={depth} drop={drop} open={open} carry={carry} wideClaw={flagView.wide} grip={flagView.grip} butter={flagView.butter} double={flagView.double} tickle={tickle} still={ctx.still} />
              <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(115deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 30%, rgba(255,255,255,0) 70%, rgba(255,255,255,0.25) 85%, rgba(255,255,255,0) 90%)' }} />
              <AnimatePresence>{fx && <PowerFx key={fx.id} kind={fx.kind} still={ctx.still} onDone={() => setFx(null)} />}</AnimatePresence>
            </div>
          </div>
          {/* Controls. */}
          <div className="flex items-center justify-center gap-[4%] rounded-2xl border-std border-border px-3 py-2" style={{ background: '#241c3d' }}>
            {(['left', 'right'] as const).map((d) => (
              <button key={d} type="button" disabled={!aiming} aria-label={d === 'left' ? 'Move the claw left' : 'Move the claw right'}
                onPointerDown={(e) => { e.currentTarget.setPointerCapture?.(e.pointerId); nudge(d === 'left' ? -1 : 1); hold.current = d === 'left' ? -1 : 1; }}
                onPointerUp={() => { hold.current = 0; }} onPointerCancel={() => { hold.current = 0; }} onLostPointerCapture={() => { hold.current = 0; }}
                className={`${d === 'left' ? 'order-1' : 'order-3'} w-[clamp(3.4rem,13cqmin,5rem)] aspect-square rounded-2xl border-heavy border-border bg-[#b4c4fb] grid place-items-center touch-none select-none disabled:opacity-40 motion-safe:hover:scale-105 motion-safe:active:scale-95 motion-safe:transition-transform`}
                style={{ boxShadow: '0 5px 0 #000' }}>
                {d === 'left' ? <ArrowFatLeft weight="fill" className="w-[45%] h-[45%]" aria-hidden="true" /> : <ArrowFatRight weight="fill" className="w-[45%] h-[45%]" aria-hidden="true" />}
                <span className="font-bold leading-none" style={{ fontSize: 'clamp(0.75rem, 2.6cqmin, 1rem)' }}>{d === 'left' ? 'Left' : 'Right'}</span>
              </button>
            ))}
            <motion.button type="button" disabled={!aiming} onClick={pressDrop} aria-label="Drop the claw"
              className="order-2 relative w-[clamp(4rem,16cqmin,6.2rem)] aspect-square rounded-full border-heavy border-border grid place-items-center disabled:opacity-50 font-display text-white"
              style={{ background: 'radial-gradient(circle at 35% 30%, #ff8a9e, #e23d5c 70%)', boxShadow: '0 6px 0 #000', fontSize: 'clamp(0.9rem, 3.4cqmin, 1.4rem)', WebkitTextStroke: '0.08em #000', paintOrder: 'stroke fill' }}
              animate={aiming && !ctx.still ? { scale: [1, 1.08, 1] } : { scale: 1 }} transition={{ duration: 1, repeat: aiming ? Infinity : 0 }} whileTap={{ scale: 0.9, y: 4 }}>
              Drop
              {/* The countdown: a ring that empties before a gentle auto drop. */}
              {aiming && aimSecs > 0 && (
                <svg viewBox="0 0 100 100" className="absolute -inset-[14%] w-[128%] h-[128%] -rotate-90 pointer-events-none" aria-hidden="true">
                  <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="6" />
                  <motion.circle key={`${ctx.taken}-${left}`} cx="50" cy="50" r="46" fill="none" stroke="#fdfd94" strokeWidth="6" strokeLinecap="round" initial={{ pathLength: 1 }} animate={{ pathLength: 0 }} transition={{ duration: aimSecs, ease: 'linear' }} />
                </svg>
              )}
            </motion.button>
            {left > 1 && phase === 'aim' && <span className="order-4 font-display text-white text-xl">x{left}</span>}
          </div>
        </motion.div>
        {/* Every team's prize shelf. */}
        <div className="relative min-w-0 min-h-0 grid gap-[3%]" style={{ gridTemplateRows: wide ? `repeat(${players.length}, minmax(0, 1fr))` : undefined, gridTemplateColumns: wide ? undefined : `repeat(${players.length}, minmax(0, 1fr))` }}>
          {players.map((p) => <Shelf key={p.id} won={shelves[p.id] ?? []} colorIndex={p.colorIndex} name={p.name} active={p.id === me.id} still={ctx.still} />)}
        </div>
      </div>
    </div>
  );
}

function Claw({ x, glide, depth, drop, open, carry, wideClaw, grip, butter, double, tickle, still }: {
  x: number; glide: number; depth: number; drop: number; open: boolean; carry: Prize | null; wideClaw: boolean; grip: boolean; butter: boolean; double: boolean; tickle: boolean; still: boolean;
}) {
  const metal = grip ? '#f6c544' : butter ? '#fdfd94' : '#c8c2b4';
  const spread = open ? (wideClaw ? 34 : 24) : carry ? 8 : 2;
  return (
    <motion.div className="absolute top-0 z-[4] w-[16%] -ml-[8%]" initial={false} animate={{ left: `${x * 100}%` }} transition={{ type: 'tween', ease: 'easeInOut', duration: glide }}>
      {/* Carriage on the rail. */}
      <div className="relative mx-auto w-[60%] h-[1.2rem] rounded-md border-std border-border bg-[#f5a08c]" />
      {/* Cable. */}
      <motion.div className="mx-auto w-[4px] bg-black" initial={false} animate={{ height: `${depth}cqh` }} transition={{ duration: drop, ease: 'easeInOut' }} style={{ minHeight: 6 }} />
      <motion.div className="relative mx-auto w-full" animate={tickle && !still ? { rotate: [0, -16, 16, -12, 12, 0] } : carry && !still ? { rotate: [0, -6, 6, -4, 0] } : { rotate: 0 }} transition={{ duration: tickle ? 0.4 : 1.2, repeat: tickle || carry ? Infinity : 0 }} style={{ originY: 0 }}>
        <svg viewBox="0 0 100 90" className="w-full overflow-visible" aria-hidden="true">
          <rect x="30" y="0" width="40" height="22" rx="8" fill={metal} stroke="#000" strokeWidth="5" />
          <circle cx="50" cy="11" r="5" fill="#241c3d" />
          {[-1, 1].map((s) => (
            <g key={s} style={{ transform: `rotate(${s * spread}deg)`, transformOrigin: '50px 20px', transformBox: 'view-box', transition: still ? undefined : 'transform 0.4s cubic-bezier(.3,1.5,.5,1)' }}>
              <path d={`M50 20 L${50 + s * 16} 52 Q${50 + s * 20} 66 ${50 + s * 8} 80`} stroke="#000" strokeWidth="12" fill="none" strokeLinecap="round" />
              <path d={`M50 20 L${50 + s * 16} 52 Q${50 + s * 20} 66 ${50 + s * 8} 80`} stroke={metal} strokeWidth="6" fill="none" strokeLinecap="round" />
            </g>
          ))}
          {butter && !still && [0, 1].map((i) => <motion.ellipse key={i} cx={36 + i * 28} cy="30" rx="4" ry="6" fill="#f6c544" stroke="#000" strokeWidth="2" initial={{ y: 0, opacity: 1 }} animate={{ y: [0, 50], opacity: [1, 0] }} transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.5 }} />)}
        </svg>
        {double && <span className="absolute -right-2 top-0 rounded-full bg-accent border-std border-border px-1.5 font-display text-sm">x2</span>}
        {carry && <div className="absolute left-[3%] top-[48%] w-[94%]"><PrizeImg p={carry} /></div>}
      </motion.div>
    </motion.div>
  );
}

function PrizeImg({ p }: { p: Prize }) {
  return <img src={`${A}/${p.animal}.webp`} alt="" aria-hidden="true" className="w-full drop-shadow-[0_4px_0_rgba(0,0,0,0.35)]" draggable={false} />;
}

const SPARK: Record<Rarity, string | null> = { common: null, rare: '#6aa9e9', super: '#f6c544' };
function PrizeArt({ p, still, glow, style, drop }: { p: Prize; still: boolean; glow: boolean; style: CSSProperties; drop?: boolean }) {
  const s = SPARK[p.rarity];
  return (
    <motion.div className="absolute" style={{ ...style, width: `${PRIZE_W}%` }} initial={still || !drop ? false : { y: '-400%', rotate: -30 }} animate={{ y: 0, rotate: ((p.id * 37) % 24) - 12 }} transition={{ type: 'spring', stiffness: 140, damping: 12 }}>
      {s && <motion.span className="absolute -inset-[12%] rounded-full" style={{ background: `radial-gradient(circle, ${s}88, transparent 65%)` }} animate={still ? undefined : { scale: [0.9, 1.15, 0.9], opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.4, repeat: Infinity }} />}
      {glow && <span className="absolute -inset-[8%] rounded-2xl border-[4px] border-dashed border-[#ef4b4b]" />}
      <PrizeImg p={p} />
      {s && !still && [0, 1, 2].map((i) => (
        <motion.svg key={i} viewBox="0 0 20 20" className="absolute w-[30%]" style={{ left: `${[-10, 70, 30][i]}%`, top: `${[-10, 0, -30][i]}%` }} animate={{ scale: [0, 1, 0], rotate: [0, 90] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.4 }}>
          <path d="M10 0l2.5 7.5L20 10l-7.5 2.5L10 20l-2.5-7.5L0 10l7.5-2.5z" fill="#fff" stroke={s} strokeWidth="1.5" />
        </motion.svg>
      ))}
    </motion.div>
  );
}

// A team's shelf: two wooden shelves fill with every prize won, bottom
// shelf first, the newest popping in.
function Shelf({ won, colorIndex, name, active, still }: { won: Won[]; colorIndex: number; name: string; active: boolean; still: boolean }) {
  const shown = won.slice(-8);
  return (
    <div className="relative min-w-0 min-h-0 rounded-2xl border-heavy border-border flex items-stretch gap-[3%] px-[3%] py-[3%]" aria-label={`${name}'s prize shelf, ${won.length} prizes`}
      style={{ background: active ? '#fff6b0' : '#fbfcf8', boxShadow: active ? '0 0 0 4px #fdfd94, 0 6px 0 #000' : '0 6px 0 #000' }}>
      <span className="self-center shrink-0"><TeamBadge colorIndex={colorIndex} size={40} /></span>
      <div className="relative flex-1 min-w-0 grid grid-cols-4 grid-rows-2 gap-x-[3%]" style={{ containerType: 'size' }}>
        {[0, 1].map((r) => <div key={r} className="absolute inset-x-0 h-[7%] min-h-2 rounded-md border-std border-border bg-[#d8a46b]" style={{ top: `${r * 50 + 45}%` }} />)}
        {shown.map((w, i) => (
          <motion.div key={w.id} className="relative self-end justify-self-center w-[min(100%,40cqh)] mb-[8%]" style={{ gridRow: 2 - Math.floor(i / 4), gridColumn: (i % 4) + 1 }}
            initial={still ? false : { scale: 0, y: -60, rotate: -40 }} animate={{ scale: 1, y: 0, rotate: 0 }} transition={{ type: 'spring', stiffness: 240, damping: 12 }}>
            {w.p.rarity !== 'common' && <span className="absolute -inset-[10%] rounded-full" style={{ background: `radial-gradient(circle, ${SPARK[w.p.rarity]}aa, transparent 65%)` }} />}
            <PrizeImg p={w.p} />
          </motion.div>
        ))}
      </div>
      {won.length > shown.length && <span className="absolute top-1 right-2 font-display text-lg">+{won.length - shown.length}</span>}
    </div>
  );
}

function Marquee({ still }: { still: boolean }) {
  return (
    <div className="relative rounded-xl border-std border-border px-3 py-1 text-center" style={{ background: '#241c3d' }}>
      <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none" aria-hidden="true">
        {Array.from({ length: 12 }, (_, i) => <motion.span key={i} className="w-2.5 h-2.5 rounded-full border border-black" style={{ background: i % 2 ? '#fdfd94' : '#8fe3a0' }} animate={still ? undefined : { opacity: [1, 0.25, 1] }} transition={{ duration: 0.9, repeat: Infinity, delay: (i % 2) * 0.45 }} />)}
      </div>
      <span className="relative font-display text-white leading-none" style={{ fontSize: 'clamp(1.1rem, 3cqmin, 2rem)', WebkitTextStroke: '0.1em #000', paintOrder: 'stroke fill' }}>Prize Crane</span>
    </div>
  );
}

function Arcade({ still }: { still: boolean }) {
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle, #fff 2px, transparent 2.5px)', backgroundSize: '2rem 2rem' }} />
      {[10, 50, 85].map((l, i) => <motion.span key={l} className="absolute top-[4%] w-[16%] aspect-square rounded-full" style={{ left: `${l - 8}%`, background: 'radial-gradient(circle, rgba(253,253,148,0.55), transparent 70%)' }} animate={still ? undefined : { opacity: [0.4, 0.9, 0.4] }} transition={{ duration: 2.5 + i, repeat: Infinity }} />)}
    </div>
  );
}

function PowerFx({ kind, still, onDone }: { kind: string; still: boolean; onDone: () => void }) {
  useEffect(() => { const id = window.setTimeout(onDone, 1900); return () => window.clearTimeout(id); }, [onDone]);
  const art = POWERS.find((p) => p.id === kind)?.art;
  const base = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: 'absolute inset-0 pointer-events-none z-[8]' };
  const center = 'absolute left-1/2 top-1/2 w-[30cqmin] h-[30cqmin] -ml-[15cqmin] -mt-[15cqmin]';
  if (still) return <motion.div {...base}><div className={center}>{art}</div></motion.div>;
  if (kind === 'grip') return <motion.div {...base}><motion.div className={center} animate={{ scale: [0.4, 1.2, 1], rotate: [0, -15, 15, 0] }} transition={{ duration: 0.9 }}>{art}</motion.div></motion.div>;
  if (kind === 'wide') return <motion.div {...base}><motion.div className={center} animate={{ scaleX: [0.4, 1.6, 0.9, 1.2, 1] }} transition={{ duration: 1 }}>{art}</motion.div></motion.div>;
  if (kind === 'extra') return <motion.div {...base}><motion.div className={center} animate={{ rotate: [0, 360], scale: [0.5, 1.1, 1] }} transition={{ duration: 1 }}>{art}</motion.div></motion.div>;
  if (kind === 'laser') return <motion.div {...base}><motion.div className="absolute top-0 bottom-0 w-[6px] bg-[#ef4b4b]" style={{ boxShadow: '0 0 16px #ef4b4b' }} initial={{ left: '0%' }} animate={{ left: ['5%', '95%', '50%'] }} transition={{ duration: 1.2 }} /></motion.div>;
  if (kind === 'double') return <motion.div {...base}><motion.div className={center} animate={{ scale: [0.3, 1.4, 1], rotate: [-30, 10, 0] }} transition={{ duration: 0.8 }}>{art}</motion.div></motion.div>;
  if (kind === 'rare') return <motion.div {...base}>{Array.from({ length: 14 }, (_, i) => <motion.svg key={i} viewBox="0 0 20 20" className="absolute w-[6%]" style={{ left: `${(i * 7) % 96}%` }} initial={{ top: '-10%' }} animate={{ top: '100%', rotate: 360 }} transition={{ delay: (i % 5) * 0.1, duration: 1.2 }}><path d="M10 0l2.5 7.5L20 10l-7.5 2.5L10 20l-2.5-7.5L0 10l7.5-2.5z" fill="#fdfd94" stroke="#000" strokeWidth="1.2" /></motion.svg>)}</motion.div>;
  if (kind === 'tilt') return <motion.div {...base}><motion.div className={center} animate={{ rotate: [0, -25, 25, -15, 15, 0] }} transition={{ duration: 0.8 }}>{art}</motion.div></motion.div>;
  if (kind === 'butter') return <motion.div {...base}>{Array.from({ length: 10 }, (_, i) => <motion.span key={i} className="absolute w-[4%] aspect-[2/3] rounded-full bg-[#f6c544] border-2 border-black" style={{ left: `${8 + i * 9}%` }} initial={{ top: '-5%' }} animate={{ top: '100%' }} transition={{ delay: i * 0.08, duration: 1, ease: 'easeIn' }} />)}<div className={center}>{art}</div></motion.div>;
  if (kind === 'tickle') return <motion.div {...base}>{['hee', 'hee', 'hee!'].map((w, i) => <motion.span key={i} className="absolute font-display text-3xl text-white" style={{ left: `${25 + i * 22}%`, top: '30%', WebkitTextStroke: '0.1em #000', paintOrder: 'stroke fill' }} initial={{ opacity: 0, y: 20, scale: 0.5 }} animate={{ opacity: [0, 1, 0], y: -30, scale: 1.2, rotate: [-10, 10] }} transition={{ delay: i * 0.4, duration: 0.9 }}>{w}</motion.span>)}</motion.div>;
  return null;
}

function ImgArt({ src, ring }: { src: string; ring: string }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="44" fill={ring} stroke="#000" strokeWidth="5" />
      <image href={src} x="20" y="18" width="60" height="64" preserveAspectRatio="xMidYMid meet" />
    </svg>
  );
}

function Art({ kind }: { kind: string }) {
  const ring = (fill: string) => <circle cx="50" cy="50" r="44" fill={fill} stroke="#000" strokeWidth="5" />;
  const claw = (spread: number, fill = '#c8c2b4') => <g><rect x="38" y="16" width="24" height="14" rx="5" fill={fill} stroke="#000" strokeWidth="4" />{[-1, 1].map((s) => <path key={s} d={`M50 28L${50 + s * spread} 54Q${50 + s * (spread + 4)} 66 ${50 + s * (spread - 8)} 76`} stroke="#000" strokeWidth="9" fill="none" strokeLinecap="round" />)}{[-1, 1].map((s) => <path key={s} d={`M50 28L${50 + s * spread} 54Q${50 + s * (spread + 4)} 66 ${50 + s * (spread - 8)} 76`} stroke={fill} strokeWidth="4" fill="none" strokeLinecap="round" />)}</g>;
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className="w-full h-full overflow-visible">
      {kind === 'wide' && <>{ring('#dff7e4')}{claw(26)}<path d="M14 50h10M76 50h10M18 44l-6 6 6 6M82 44l6 6-6 6" stroke="#000" strokeWidth="4" fill="none" strokeLinecap="round" /></>}
      {kind === 'laser' && <>{ring('#ffe0d8')}{claw(14)}<path d="M50 74v18" stroke="#ef4b4b" strokeWidth="5" strokeDasharray="4 4" /></>}
      {kind === 'double' && <>{ring('#fff6b0')}<circle cx="38" cy="48" r="18" fill="#ef7d96" stroke="#000" strokeWidth="4" /><circle cx="62" cy="54" r="18" fill="#7fd6e3" stroke="#000" strokeWidth="4" /><text x="50" y="88" textAnchor="middle" fontSize="20" fontWeight="900" stroke="#000" strokeWidth="1" fill="#fff">x2</text></>}
      {kind === 'rare' && <>{ring('#fff6b0')}<path d="M50 14l9 22 24 2-18 16 6 24-21-13-21 13 6-24-18-16 24-2z" fill="#f6c544" stroke="#000" strokeWidth="4" strokeLinejoin="round" /><path d="M76 16l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#fff" stroke="#000" strokeWidth="2" /></>}
      {kind === 'tilt' && <>{ring('#e9eefe')}<rect x="30" y="22" width="40" height="56" rx="6" fill="#ef7d96" stroke="#000" strokeWidth="4" transform="rotate(-12 50 50)" /><rect x="36" y="30" width="28" height="26" rx="4" fill="#e6f8ff" stroke="#000" strokeWidth="3" transform="rotate(-12 50 50)" /><path d="M18 30q-6 10 0 20M82 50q6 10 0 20" stroke="#000" strokeWidth="4" fill="none" strokeLinecap="round" /></>}
      {kind === 'tickle' && <>{ring('#ffe0ec')}{claw(18, '#fdfd94')}<path d="M40 22q4 4 8 0M52 22q4 4 8 0" stroke="#000" strokeWidth="2.5" fill="none" /><path d="M16 36l8 4M84 36l-8 4M14 56h8M86 56h-8" stroke="#000" strokeWidth="4" strokeLinecap="round" /></>}
    </svg>
  );
}

function Cover() {
  const animals = ['fox', 'frog', 'rabbit', 'owl', 'tiger'];
  return (
    <svg viewBox="0 0 100 62" preserveAspectRatio="xMidYMid slice">
      <rect width="100" height="62" fill="#f5b8cf" />
      <rect x="22" y="2" width="56" height="58" rx="5" fill="#ef7d96" stroke="#000" strokeWidth="1" />
      <rect x="26" y="5" width="48" height="6" rx="1.5" fill="#241c3d" />
      <text x="50" y="10" textAnchor="middle" fontSize="4.4" fontWeight="900" fill="#fff">PRIZE CRANE</text>
      <rect x="26" y="13" width="48" height="36" rx="2" fill="#e6f8ff" stroke="#000" strokeWidth="0.8" />
      <path d="M26 15H74" stroke="#8a8399" strokeWidth="1.6" />
      <path d="M52 15V24" stroke="#000" strokeWidth="0.6" />
      <path d="M49 24h6l-1 2h-4z" fill="#c8c2b4" stroke="#000" strokeWidth="0.5" /><path d="M50 26l-2 4M54 26l2 4" stroke="#000" strokeWidth="0.9" strokeLinecap="round" />
      {animals.map((a, i) => <image key={a} href={`${A}/${a}.webp`} x={33 + i * 8} y={i % 2 ? 36 : 39} width="9" height="9" />)}
      <rect x="26" y="37" width="7" height="12" fill="#241c3d" />
      <rect x="30" y="51" width="40" height="7" rx="1.5" fill="#241c3d" />
      <circle cx="50" cy="54.5" r="2.6" fill="#e23d5c" stroke="#000" strokeWidth="0.5" />
      <rect x="38" y="52.5" width="5" height="4" rx="1" fill="#b4c4fb" /><rect x="57" y="52.5" width="5" height="4" rx="1" fill="#b4c4fb" />
    </svg>
  );
}

const def: LabDef = {
  id: 'prize-crane',
  name: 'Prize Crane',
  description: 'Answer right to work the claw. Slide it, drop it, and grab a plush prize. Rare ones sparkle.',
  ways: ['teams', 'solo'],
  minTeams: 2,
  maxTeams: 4,
  how: [
    { icon: <CheckCircle weight="fill" />, text: 'Answer the question' },
    { icon: <ArrowFatRight weight="fill" />, text: 'Right? Slide the claw and drop it' },
    { icon: <Trophy weight="fill" />, text: 'The best prize shelf wins' },
  ],
  rounds: { label: 'Rounds', min: 3, max: 20, default: 8 },
  powers: POWERS,
  background: 'radial-gradient(120% 90% at 50% 10%, #ffe3ef 0%, #f5b8cf 60%, #d98fb4 100%)',
  cover: <Cover />,
  pieces: [
    { id: 'background', label: 'Arcade', hint: 'Behind the claw machine' },
    { id: 'cabinet', label: 'Claw machine', hint: 'The cabinet, its sign and the glass' },
    { id: 'claw', label: 'Claw', hint: 'The claw (open and closed)' },
    { id: 'chute', label: 'Prize chute', hint: 'Where won prizes drop out' },
    { id: 'buttons', label: 'Buttons', hint: 'Left, right and the big drop button' },
    { id: 'prize-common', label: 'Plush prize', hint: 'An everyday plush toy' },
    { id: 'prize-rare', label: 'Rare plush', hint: 'A rare plush (it sparkles blue)' },
    { id: 'prize-super', label: 'Super rare plush', hint: 'A super rare plush (it sparkles gold)' },
    { id: 'shelf', label: 'Prize shelf', hint: 'Where each team keeps its prizes' },
    ...POWERS.map((p) => ({ id: `power-${p.id}`, label: p.name, hint: p.desc })),
  ],
  Play,
};
export default def;

