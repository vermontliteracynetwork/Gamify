import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowFatUp, CheckCircle, Factory, Trophy } from '@phosphor-icons/react';
import { playClip } from '../../../engine/music';
import { TeamBadge } from '../../../engine/TeamBadge';
import type { LabCtx, LabDef, LabPower } from '../../types';
import { applyCard, bestCard, coinsPerTick, drawCards, MACHINES, MAX_LEVEL, randomType, SHIFT, SLOTS, type Card, type Machine, type MachineType } from './rules';

// Toy Factory (Game Lab, inspired by the general idea of factory-building
// quiz games): every team has its own row on the factory floor. Answer
// right to earn coins and pick a machine card; then your row runs a shift:
// belts roll, gears whirl and toys pop out, each one making coins. Pick the
// same machine again to level it up. The factory visibly grows.

const A = '/lab/toy-factory';
const COIN = `${A}/coin.webp`;
const EARN = 25; // right answers pay well next to what machines make

const POWERS: LabPower[] = [
  { id: 'overtime', name: 'Overtime', desc: 'Your shift runs twice as long.', enter: 'spin', art: <ImgArt src={`${A}/time.webp`} ring="#e9eefe" /> },
  { id: 'wrench', name: 'Golden Wrench', desc: 'Level up your best machine for free.', enter: 'spin', art: <Art kind="wrench" /> },
  { id: 'magnet', name: 'Coin Magnet', desc: 'Pull 15 coins from every other team.', takes: true, enter: 'zoom', art: <ImgArt src={`${A}/magnet.webp`} ring="#ffd9cf" /> },
  { id: 'truck', name: 'Rush Order', desc: 'A delivery truck brings you 50 coins.', enter: 'wiggle', art: <Art kind="truck" /> },
  { id: 'helper', name: 'Robot Helper', desc: 'A free Robot Builder joins your floor.', enter: 'drop', art: <Art kind="helper" /> },
  { id: 'turbo', name: 'Turbo Belt', desc: 'Your machines work twice as fast this shift.', enter: 'zoom', art: <Art kind="turbo" /> },
  { id: 'mystery', name: 'Mystery Crate', desc: 'A surprise rare machine joins your floor.', enter: 'drop', art: <ImgArt src={`${A}/mystery.webp`} ring="#fff6b0" /> },
  { id: 'wrap', name: 'Bubble Wrap', desc: 'Pop pop pop! Everyone stops to pop bubble wrap and you get 10 coins.', silly: true, art: <Art kind="wrap" /> },
  { id: 'ducks', name: 'Duck Flood', desc: 'Quack! Rubber ducks flood the floor and waddle away.', silly: true, art: <Art kind="ducks" /> },
];

type Phase = 'ask' | 'busy' | 'cards' | 'shift';
interface Toy { id: number; row: string; slot: number; type: MachineType; coins: number }

let uid = 1;
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
  const players = ctx.turns.players;
  const [floors, setFloors] = useState<Record<string, Machine[]>>({});
  const floorsRef = useRef(floors); floorsRef.current = floors;
  const [made, setMade] = useState<Record<string, number>>({});
  const [phase, setPhase] = useState<Phase>('ask');
  const [cards, setCards] = useState<Card[]>([]);
  const [running, setRunning] = useState<string | null>(null);
  const [event, setEvent] = useState<'surge' | 'jam' | null>(null);
  const [turbo, setTurbo] = useState(false);
  const [toys, setToys] = useState<Toy[]>([]);
  const [fx, setFx] = useState<{ id: number; kind: string } | null>(null);
  const [fresh, setFresh] = useState<number | null>(null);
  const turn = useRef(0);
  const cardRef = useRef<((c: Card) => void) | null>(null);
  const alive = (t: number) => turn.current === t;
  useEffect(() => () => { turn.current = -1; }, []);
  const me = ctx.player;
  const tall = size.h > size.w;

  const floorOf = (id: string) => floorsRef.current[id] ?? [];
  const setFloor = (id: string, f: Machine[]) => setFloors((m) => { const n = { ...m, [id]: f }; floorsRef.current = n; return n; });
  const addMachine = (id: string, type: MachineType) => {
    const f = floorOf(id);
    // A full floor has no room: the caller pays coins instead.
    if (f.length >= SLOTS) return false;
    const nid = uid++; setFloor(id, [...f, { id: nid, type, level: 1 }]); setFresh(nid); return true;
  };

  useEffect(() => {
    const t = ++turn.current;
    const x = c.current;
    setPhase('ask'); setCards([]); setTurbo(false); setEvent(null);
    void x.ask().then(async (ok) => {
      if (!alive(t)) return;
      if (!ok) {
        // A miss still runs the machines you already have (no new card).
        c.current.sfx.wrong(); await sleep(700); if (!alive(t)) return;
        if (floorOf(c.current.player.id).length) { c.current.say('Your machines keep working', 'good'); await sleep(900); if (!alive(t)) return; await shift(t, SHIFT, 1); }
        await sleep(600); if (alive(t)) c.current.next(); return;
      }
      c.current.points(EARN); c.current.sfx.coin();
      setPhase('busy');
      await sleep(500); if (!alive(t)) return;
      const p = await c.current.power(0.45);
      if (!alive(t)) return;
      let secs = SHIFT, speed = 1;
      if (p) { const r = await fire(p, t); if (!alive(t)) return; secs *= r.secs; speed *= r.speed; }
      // Pick a machine card.
      const id = c.current.player.id;
      const deal = drawCards(floorOf(id));
      if (deal.length) {
        setCards(deal); setPhase('cards'); c.current.sfx.whoosh();
        const pick = await new Promise<Card>((r) => { cardRef.current = r; });
        if (!alive(t)) return;
        setCards([]);
        const before = floorOf(id);
        const nid = uid++;
        setFloor(id, applyCard(before, pick, nid));
        setFresh(pick.kind === 'new' ? nid : pick.id);
        if (pick.kind === 'new') { c.current.sfx.build(); c.current.say(MACHINES[pick.type].name, 'good'); } else { c.current.sfx.power(); c.current.say('Level up!', 'good'); }
        await sleep(1100); if (!alive(t)) return;
      }
      await shift(t, secs, speed);
      if (!alive(t)) return;
      await sleep(600);
      if (alive(t)) c.current.next();
    });
  }, [ctx.taken]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fire(p: LabPower, t: number): Promise<{ secs: number; speed: number }> {
    const x = c.current, id = x.player.id;
    setFx({ id: uid++, kind: p.id });
    let secs = 1, speed = 1;
    if (p.id === 'overtime') { secs = 2; x.sfx.bell(); }
    if (p.id === 'wrench') {
      x.sfx.build();
      const best = [...floorOf(id)].filter((m) => m.level < MAX_LEVEL).sort((a, b) => coinsPerTick(b) - coinsPerTick(a))[0];
      await sleep(800); if (!alive(t)) return { secs, speed };
      if (best) { setFloor(id, floorOf(id).map((m) => (m.id === best.id ? { ...m, level: m.level + 1 } : m))); setFresh(best.id); x.sfx.power(); }
      else { x.points(20); x.sfx.coin(); }
    }
    if (p.id === 'magnet') {
      x.sfx.magnet(); await sleep(900); if (!alive(t)) return { secs, speed };
      const s = Object.fromEntries(c.current.turns.players.map((pl) => [pl.id, pl.score]));
      let got = 0;
      for (const k of Object.keys(s)) if (k !== id) { const n = Math.min(15, s[k]); s[k] -= n; got += n; }
      s[id] += got; c.current.setScores(s); x.sfx.coin(); x.say(`+${got} coins!`);
    }
    if (p.id === 'truck') { x.sfx.whoosh(); await sleep(1100); if (!alive(t)) return { secs, speed }; x.points(50); x.sfx.coin(); x.burst(0.4, 0.5); }
    if (p.id === 'helper') { x.sfx.boing(); await sleep(800); if (!addMachine(id, 'robot')) { x.points(30); x.say('+30 coins!', 'good'); } x.sfx.build(); }
    if (p.id === 'turbo') { speed = 2; setTurbo(true); x.sfx.zap(); }
    if (p.id === 'mystery') { x.sfx.chest(); await sleep(800); if (!addMachine(id, randomType(Math.random, 'rare'))) { x.points(30); x.say('+30 coins!', 'good'); } x.sfx.build(); }
    if (p.id === 'wrap') { for (let i = 0; i < 6; i++) { await sleep(150); x.sfx.pop(); } x.points(10); x.sfx.coin(); x.say('+10 for popping!', 'good'); }
    if (p.id === 'ducks') { for (let i = 0; i < 4; i++) { await sleep(220); x.sfx.chomp(); } }
    await sleep(1200);
    return { secs, speed };
  }

  // A shift: this row's machines each make toys on their own timer.
  async function shift(t: number, secs: number, speed: number) {
    const x = c.current, id = x.player.id;
    const floor = floorOf(id);
    if (!floor.length) return;
    const roll = Math.random();
    const ev = roll < 0.13 ? 'surge' : roll < 0.24 ? 'jam' : null;
    setRunning(id); setPhase('shift'); x.sfx.whistle();
    if (ev === 'surge') { setEvent('surge'); x.say('Power surge! 2x', 'big'); x.sfx.zap(); }
    if (ev === 'jam') { x.say('Gear jam!', 'oops'); }
    // Relaxed timers stretch the shift but keep what it makes the same.
    const ts = c.current.timeScale > 1 ? c.current.timeScale : 1;
    secs *= ts; speed /= ts;
    const acc = floor.map(() => -Math.random() * 0.4);
    const start = performance.now();
    let last = start, jamLeft = ev === 'jam' ? 1.8 : 0, jamAt = 1.5, jamShown = false;
    await new Promise<void>((resolve) => {
      const tick = () => {
        if (!alive(t)) { resolve(); return; }
        const now = performance.now();
        const dt = (now - last) / 1000; last = now;
        const el = (now - start) / 1000;
        if (jamLeft > 0 && el > jamAt) {
          if (!jamShown) { jamShown = true; setEvent('jam'); c.current.sfx.boing(); }
          jamLeft -= dt; if (jamLeft <= 0) { setEvent(null); jamAt = Infinity; }
        } else {
          floor.forEach((m, i) => {
            acc[i] += dt * speed;
            const every = MACHINES[m.type].every;
            if (acc[i] >= every) {
              acc[i] -= every;
              const n = coinsPerTick(m, ev === 'surge' ? 2 : 1);
              c.current.points(n, id);
              setToys((l) => [...l.slice(-30), { id: uid++, row: id, slot: i, type: m.type, coins: n }]);
              setMade((mm) => ({ ...mm, [id]: (mm[id] ?? 0) + 1 }));
              if (i % 2) c.current.sfx.pop(); else c.current.sfx.blip(i * 2);
            }
          });
        }
        if (el >= secs + (ev === 'jam' ? 1.8 : 0)) { resolve(); return; }
        window.setTimeout(tick, 60);
      };
      tick();
    });
    setRunning(null); setEvent(null); setTurbo(false);
    if (alive(t)) { playClip(`${A}/rattle.mp3`, c.current.settings, 0.5); }
  }

  // The computer takes the best card.
  useEffect(() => {
    if (!ctx.cpu || phase !== 'cards' || !cards.length) return;
    const tid = window.setTimeout(() => { const r = cardRef.current; cardRef.current = null; c.current.sfx.tap(); r?.(c.current.cpuRight() ? bestCard(floorOf(c.current.player.id), cards) : cards[Math.floor(Math.random() * cards.length)]); }, 2000);
    return () => window.clearTimeout(tid);
  }, [ctx.cpu, phase, cards]); // eslint-disable-line react-hooks/exhaustive-deps

  const rowH = players.length === 1 ? (tall ? 40 : 56) : Math.min(46, 92 / players.length);
  return (
    <div ref={ref} className="absolute inset-0 rounded-panel border-heavy border-border overflow-clip" style={{ boxShadow: '0 8px 0 #000, 0 24px 40px rgba(36,28,61,0.3)' }}>
      <FactoryRoom still={ctx.still} />
      <div className="absolute inset-x-[2%] top-[13%] bottom-[3%] flex flex-col justify-center gap-[2%]">
        {players.map((p) => (
          <Row key={p.id} id={p.id} colorIndex={p.colorIndex} name={p.name} coins={p.score} floor={floors[p.id] ?? []} made={made[p.id] ?? 0} active={p.id === me.id} running={running === p.id}
            event={running === p.id ? event : null} turbo={running === p.id && turbo} toys={toys.filter((k) => k.row === p.id)} fresh={fresh} still={ctx.still} heightPct={rowH}
            onToyDone={(tid) => setToys((l) => l.filter((k) => k.id !== tid))} />
        ))}
      </div>
      <AnimatePresence>
        {phase === 'cards' && cards.length > 0 && (
          <motion.div className="absolute inset-0 z-10 grid place-items-center bg-ink-night/35 p-[3%]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className={`grid gap-[3%] w-full max-w-[56rem] ${tall ? 'grid-cols-1 max-w-[22rem]' : 'grid-cols-3'}`}>
              {cards.map((cd, i) => (
                <MachineCard key={i} card={cd} floor={floors[me.id] ?? []} i={i} still={ctx.still} disabled={ctx.cpu} compact={tall}
                  onPick={() => { const r = cardRef.current; cardRef.current = null; c.current.sfx.tap(); r?.(cd); }} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>{fx && <PowerFx key={fx.id} kind={fx.kind} still={ctx.still} onDone={() => setFx(null)} />}</AnimatePresence>
      <AnimatePresence>{event === 'surge' && !ctx.still && <motion.div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(253,253,148,0.35), rgba(253,253,148,0) 70%)' }} initial={{ opacity: 0 }} animate={{ opacity: 0.8 }} exit={{ opacity: 0 }} transition={{ duration: 1.2, ease: 'easeInOut' }} />}</AnimatePresence>
    </div>
  );
}

// A machine card: the machine, its name, and what it adds (or a level-up).
function MachineCard({ card, floor, i, still, disabled, compact, onPick }: { card: Card; floor: Machine[]; i: number; still: boolean; disabled: boolean; compact: boolean; onPick: () => void }) {
  const m = MACHINES[card.type];
  const level = card.kind === 'upgrade' ? (floor.find((x) => x.id === card.id)?.level ?? 1) + 1 : 1;
  const tick = coinsPerTick({ id: 0, type: card.type, level });
  const ring = m.rarity === 'epic' ? '#ef7d96' : m.rarity === 'rare' ? '#6aa9e9' : '#c8c2b4';
  return (
    <motion.button type="button" disabled={disabled} onClick={onPick} aria-label={`${card.kind === 'upgrade' ? 'Level up ' : ''}${m.name}`}
      className={`relative rounded-panel border-heavy border-border bg-surface grid justify-items-center gap-1 p-3 disabled:cursor-default focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#241c3d] ${compact ? 'grid-cols-[6rem_1fr] items-center text-left' : 'text-center'}`}
      style={{ boxShadow: `0 0 0 5px ${ring}, 0 7px 0 #000` }}
      initial={still ? false : { y: 200, rotate: (i - 1) * 8, opacity: 0 }} animate={{ y: 0, rotate: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 170, damping: 15, delay: i * 0.12 }}
      whileHover={disabled || still ? undefined : { scale: 1.05, y: -6 }} whileTap={disabled || still ? undefined : { scale: 0.96 }}>
      {m.rarity !== 'common' && !still && <span aria-hidden="true" className="absolute inset-0 rounded-panel pu-rays opacity-40 pointer-events-none" />}
      <span className={`relative ${compact ? 'w-24 h-24' : 'w-[70%] aspect-square'}`}><MachineArt type={card.type} level={level} spin={!still} /></span>
      <span className="relative grid gap-1 justify-items-center">
        <span className="font-display text-[clamp(1.1rem,2.6cqmin,1.8rem)] leading-tight">{m.name}</span>
        <span className="flex items-center gap-2 font-display text-xl">
          {card.kind === 'upgrade' && <span className="inline-flex items-center rounded-full bg-accent border-std border-border px-2 text-base"><ArrowFatUp weight="fill" size={16} aria-hidden="true" />Level {level}</span>}
          <span className="inline-flex items-center gap-1"><img src={COIN} alt="" className="w-6 h-6" />+{tick}</span>
        </span>
      </span>
    </motion.button>
  );
}

// One team's row: its badge and coin bin, the belt with up to five
// machines, and the toy box at the end.
function Row({ id, colorIndex, name, coins, floor, made, active, running, event, turbo, toys, fresh, still, heightPct, onToyDone }: {
  id: string; colorIndex: number; name: string; coins: number; floor: Machine[]; made: number; active: boolean; running: boolean; event: 'surge' | 'jam' | null; turbo: boolean;
  toys: Toy[]; fresh: number | null; still: boolean; heightPct: number; onToyDone: (id: number) => void;
}) {
  const belt = running && event !== 'jam';
  const [beltRef, beltSize] = useBox();
  const beltW = beltSize.w;
  return (
    <div className="relative flex items-stretch gap-[1.2%] rounded-[1.2rem] border-std border-border px-[1%] pt-[0.6%]" aria-label={`${name}'s factory row`} data-row={id}
      style={{ height: `${heightPct}%`, background: active ? 'rgba(253,253,148,0.45)' : 'rgba(251,252,248,0.35)', boxShadow: active ? '0 0 0 4px #fdfd94, 0 4px 0 #000' : '0 4px 0 rgba(0,0,0,0.4)', containerType: 'size' }}>
      {/* Badge and coins. */}
      <div className="w-[11%] min-w-[3.4rem] flex flex-col items-center justify-center gap-1">
        <motion.span animate={running && !still ? { y: [0, -6, 0] } : undefined} transition={{ duration: 0.5, repeat: Infinity }}><TeamBadge colorIndex={colorIndex} size={Math.round(Math.min(58, Math.max(30, heightPct * 1.4)))} /></motion.span>
        <span className="inline-flex items-center gap-1 font-display text-white leading-none" style={{ fontSize: 'clamp(1rem, 14cqh, 1.7rem)', WebkitTextStroke: '0.1em #000', paintOrder: 'stroke fill' }}><img src={COIN} alt="" className="w-[1.1em] h-[1.1em]" />{coins}</span>
      </div>
      {/* The belt and machines. */}
      <div ref={beltRef} className="relative flex-1 min-w-0" style={{ containerType: 'size' }}>
        <motion.div className="absolute inset-x-0 bottom-[4%] h-[17%] rounded-full border-std border-border"
          style={{ backgroundColor: '#5b5470', backgroundImage: 'repeating-linear-gradient(90deg, #4a4460 0 14px, #6e6786 14px 28px)', backgroundSize: '28px 100%' }}
          animate={belt && !still ? { backgroundPositionX: ['0px', '28px'] } : undefined} transition={{ duration: turbo ? 0.18 : 0.4, repeat: Infinity, ease: 'linear' }}>
          {[6, 30, 54, 78, 94].map((l) => <span key={l} className="absolute top-1/2 -translate-y-1/2 h-[70%] aspect-square rounded-full bg-[#c8c2b4] border-2 border-black" style={{ left: `${l}%` }} />)}
        </motion.div>
        <div className="absolute inset-x-0 top-0 bottom-[16%] grid grid-cols-5 gap-[2%] items-end">
          {Array.from({ length: SLOTS }, (_, i) => {
            const m = floor[i];
            if (!m) return <span key={`e${i}`} className="h-[70%] rounded-xl border-[3px] border-dashed border-white/60 mb-[4%]" aria-hidden="true" />;
            return (
              <motion.div key={m.id} className="relative h-full flex items-end justify-center" title={`${MACHINES[m.type].name}, level ${m.level}`}
                initial={still ? false : { y: -300, scaleY: 1.3 }} animate={{ y: 0, scaleY: running && !still && event !== 'jam' ? [1, 0.94, 1] : 1, rotate: event === 'jam' && !still ? [0, -4, 4, 0] : 0 }}
                transition={{ y: { type: 'spring', stiffness: 200, damping: 13 }, scaleY: { duration: 0.5, repeat: running ? Infinity : 0 }, rotate: { duration: 0.25, repeat: event === 'jam' ? Infinity : 0 } }}>
                <span className="h-full max-w-full aspect-square"><MachineArt type={m.type} level={m.level} spin={running && !still && event !== 'jam'} jam={event === 'jam' && !still} /></span>
                {fresh === m.id && !still && <motion.span className="absolute inset-0 rounded-full pointer-events-none" style={{ boxShadow: '0 0 0 6px #fdfd94' }} initial={{ opacity: 1, scale: 0.6 }} animate={{ opacity: 0, scale: 1.4 }} transition={{ duration: 0.9, delay: 0.3 }} />}
              </motion.div>
            );
          })}
        </div>
        {/* Toys pop out and ride the belt to the box. */}
        {toys.map((k) => (
          <motion.span key={k.id} data-toy="" className="absolute bottom-[12%] h-[26%] aspect-square pointer-events-none z-[2]" style={{ left: `${(k.slot + 0.5) * 20 - 6}%` }}
            initial={{ y: 0, x: 0, scale: 0.3, opacity: 0 }} animate={still ? { opacity: [0, 1, 0] } : { y: [-20, -110, 0, 0], scale: [0.3, 1.1, 1, 1], x: [0, 0, 0, ((100 - (k.slot + 0.5) * 20 + 2) / 100) * beltW], opacity: [0, 1, 1, 1] }}
            transition={{ duration: 1.6 * (turbo ? 0.6 : 1), times: [0, 0.25, 0.4, 1], ease: 'easeInOut' }} onAnimationComplete={() => onToyDone(k.id)}>
            <ToyArt type={k.type} />
            <motion.span className="absolute -top-[70%] left-1/2 -translate-x-1/2 font-display text-[#fdfd94] whitespace-nowrap" style={{ fontSize: 'clamp(0.9rem, 14cqh, 1.6rem)', WebkitTextStroke: '0.12em #000', paintOrder: 'stroke fill' }}
              initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 0], y: [0, -10, -20, -30] }} transition={{ duration: 1, times: [0, 0.2, 0.7, 1] }}>+{k.coins}</motion.span>
          </motion.span>
        ))}
      </div>
      {/* The toy box fills with toys. */}
      <div className="w-[10%] min-w-[3rem] flex items-end justify-center pb-[4%]">
        <ToyBox made={made} still={still} />
      </div>
    </div>
  );
}

function ToyBox({ made, still }: { made: number; still: boolean }) {
  const shown = Math.min(9, Math.ceil(made / 3));
  const kinds: MachineType[] = ['duck', 'teddy', 'ball', 'blocks', 'robot', 'yoyo', 'rocket', 'duck', 'ball'];
  return (
    <div className="relative w-full aspect-[5/4] max-h-full">
      <div className="absolute inset-x-[6%] bottom-[50%] h-[60%]">
        {kinds.slice(0, shown).map((k, i) => (
          <motion.span key={i} className="absolute w-[34%] aspect-square" style={{ left: `${(i % 3) * 30 + 2}%`, bottom: `${Math.floor(i / 3) * 30 - 10}%`, rotate: `${(i * 37) % 40 - 20}deg` }}
            initial={still ? false : { y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 12 }}><ToyArt type={k} /></motion.span>
        ))}
      </div>
      <svg viewBox="0 0 100 80" className="absolute inset-x-0 bottom-0 w-full" aria-hidden="true">
        <path d="M6 30h88l-6 46H12z" fill="#ef7d96" stroke="#000" strokeWidth="5" strokeLinejoin="round" />
        <path d="M14 44h72" stroke="#000" strokeWidth="3" opacity="0.3" />
        <path d="M30 56l8 8 8-8M54 56l8 8 8-8" stroke="#fdfd94" strokeWidth="5" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
}

// A machine: body, chute, a toy picture on the front and spinning gears.
function MachineArt({ type, level, spin, jam = false }: { type: MachineType; level: number; spin: boolean; jam?: boolean }) {
  const m = MACHINES[type];
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" aria-hidden="true">
      <ellipse cx="50" cy="96" rx="40" ry="5" fill="#000" opacity="0.25" />
      {/* Gears on top. */}
      <g transform="translate(32 22)"><Gear r={14} spin={spin} jam={jam} dir={1} fill="#c8c2b4" /></g>
      <g transform="translate(60 16)"><Gear r={10} spin={spin} jam={jam} dir={-1} fill="#f6c544" /></g>
      {level >= 3 && <g transform="translate(78 28)"><Gear r={8} spin={spin} jam={jam} dir={1} fill="#8fe3a0" /></g>}
      {/* Chimney with puffs. */}
      <rect x="72" y="18" width="12" height="20" fill="#8a8399" stroke="#000" strokeWidth="4" />
      {spin && [0, 1, 2].map((i) => <motion.circle key={i} cx="78" cy="12" r="6" fill="#fff" stroke="#000" strokeWidth="2.5" style={{ transformBox: 'fill-box', originX: '50%', originY: '50%' }} initial={{ opacity: 0 }} animate={{ y: [0, -26], opacity: [0, 1, 0], scale: [0.7, 1.5] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.4 }} />)}
      <rect x="10" y="32" width="80" height="58" rx="10" fill={m.color} stroke="#000" strokeWidth="5" />
      <rect x="10" y="32" width="80" height="12" rx="6" fill="#fff" opacity="0.35" />
      <rect x="24" y="48" width="52" height="34" rx="8" fill="#fbfcf8" stroke="#000" strokeWidth="4" />
      <g transform="translate(34 50) scale(0.32)"><ToyShape type={type} /></g>
      {/* Level lights. */}
      {Array.from({ length: MAX_LEVEL }, (_, i) => <circle key={i} cx={20 + i * 9} cy="38" r="3.4" fill={i < level ? '#5cc3a0' : '#444'} stroke="#000" strokeWidth="1.5" />)}
      <rect x="78" y="70" width="18" height="14" rx="3" fill="#8a8399" stroke="#000" strokeWidth="4" />
    </svg>
  );
}
function Gear({ r, spin, jam, dir, fill }: { r: number; spin: boolean; jam: boolean; dir: number; fill: string }) {
  const teeth = Array.from({ length: 8 }, (_, i) => i * 45);
  return (
    <motion.g animate={spin ? { rotate: 360 * dir } : jam ? { rotate: [0, 15 * dir, -10 * dir, 0] } : { rotate: 0 }} transition={spin ? { duration: 1.6, repeat: Infinity, ease: 'linear' } : { duration: 0.3, repeat: jam ? Infinity : 0 }}>
      {teeth.map((a) => <rect key={a} x={-r * 0.22} y={-r - r * 0.35} width={r * 0.44} height={r * 0.55} rx="1.5" fill={fill} stroke="#000" strokeWidth="2.5" transform={`rotate(${a})`} />)}
      <circle r={r} fill={fill} stroke="#000" strokeWidth="3.5" />
      <circle r={r * 0.35} fill="#fbfcf8" stroke="#000" strokeWidth="2.5" />
    </motion.g>
  );
}

function ToyArt({ type }: { type: MachineType }) {
  return <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" aria-hidden="true"><ToyShape type={type} /></svg>;
}
function ToyShape({ type }: { type: MachineType }) {
  if (type === 'duck') return <g><path d="M18 62q0 26 34 26t34-22q-14 4-22-6 10-6 6-22-6-14-22-12T28 40q0 10 6 16-16-6-16 6z" fill="#fdfd94" stroke="#000" strokeWidth="6" strokeLinejoin="round" /><path d="M66 34l18 4-16 6z" fill="#f39a6b" stroke="#000" strokeWidth="4" strokeLinejoin="round" /><circle cx="54" cy="32" r="5" fill="#000" /></g>;
  if (type === 'yoyo') return <g><circle cx="50" cy="58" r="30" fill="#f5a08c" stroke="#000" strokeWidth="6" /><circle cx="50" cy="58" r="12" fill="#fdfd94" stroke="#000" strokeWidth="5" /><path d="M50 46V6" stroke="#000" strokeWidth="4" /></g>;
  if (type === 'blocks') return <g><rect x="14" y="52" width="34" height="34" rx="4" fill="#6aa9e9" stroke="#000" strokeWidth="5" /><rect x="52" y="52" width="34" height="34" rx="4" fill="#ef7d96" stroke="#000" strokeWidth="5" /><rect x="32" y="16" width="34" height="34" rx="4" fill="#fdfd94" stroke="#000" strokeWidth="5" /><text x="49" y="42" textAnchor="middle" fontSize="22" fontWeight="900">A</text></g>;
  if (type === 'teddy') return <g><circle cx="26" cy="24" r="12" fill="#d8a46b" stroke="#000" strokeWidth="5" /><circle cx="74" cy="24" r="12" fill="#d8a46b" stroke="#000" strokeWidth="5" /><circle cx="50" cy="44" r="28" fill="#d8a46b" stroke="#000" strokeWidth="5" /><ellipse cx="50" cy="54" rx="12" ry="9" fill="#f4dca8" stroke="#000" strokeWidth="3" /><circle cx="40" cy="38" r="4" fill="#000" /><circle cx="60" cy="38" r="4" fill="#000" /><circle cx="50" cy="51" r="3.5" fill="#000" /><ellipse cx="50" cy="86" rx="24" ry="12" fill="#d8a46b" stroke="#000" strokeWidth="5" /></g>;
  if (type === 'ball') return <g><circle cx="50" cy="52" r="36" fill="#8fe3a0" stroke="#000" strokeWidth="6" /><path d="M14 52h72M50 16q-20 36 0 72" stroke="#000" strokeWidth="5" fill="none" /><ellipse cx="36" cy="34" rx="8" ry="5" fill="#fff" opacity="0.7" /></g>;
  if (type === 'robot') return <g><path d="M50 14V4" stroke="#000" strokeWidth="5" /><circle cx="50" cy="4" r="5" fill="#ef7d96" stroke="#000" strokeWidth="3" /><rect x="24" y="14" width="52" height="36" rx="8" fill="#7fd6e3" stroke="#000" strokeWidth="5" /><circle cx="40" cy="32" r="6" fill="#fff" stroke="#000" strokeWidth="3" /><circle cx="60" cy="32" r="6" fill="#fff" stroke="#000" strokeWidth="3" /><rect x="30" y="54" width="40" height="34" rx="6" fill="#b4c4fb" stroke="#000" strokeWidth="5" /><circle cx="50" cy="70" r="6" fill="#fdfd94" stroke="#000" strokeWidth="3" /></g>;
  return <g><path d="M50 6q22 20 18 56H32Q28 26 50 6z" fill="#fbfcf8" stroke="#000" strokeWidth="5" strokeLinejoin="round" /><circle cx="50" cy="36" r="9" fill="#7fd6e3" stroke="#000" strokeWidth="4" /><path d="M32 50l-14 22 16-4zM68 50l14 22-16-4z" fill="#ef7d96" stroke="#000" strokeWidth="4" strokeLinejoin="round" /><path d="M40 62q10 30 20 0" fill="#f6c544" stroke="#000" strokeWidth="4" /></g>;
}

// The factory hall: brick wall, round windows, hanging lamps, a floor.
function FactoryRoom({ still }: { still: boolean }) {
  return (
    <div className="absolute inset-0" aria-hidden="true">
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #c9b8e8 0%, #b4a2dc 62%, #8d7fb0 62%, #7a6c9e 100%)' }} />
      <div className="absolute inset-x-0 top-0 h-[62%] opacity-25" style={{ backgroundImage: 'linear-gradient(#000 2px, transparent 2px), linear-gradient(90deg, #000 2px, transparent 2px)', backgroundSize: '3.6rem 1.8rem', backgroundPosition: '0 0, 1.8rem 0' }} />
      {[12, 38, 64, 88].map((l, i) => (
        <div key={l} className="absolute top-[2%] w-[9%] aspect-square rounded-full border-heavy border-border" style={{ left: `${l - 4.5}%`, background: 'radial-gradient(circle at 35% 35%, #fdfd94, #b4c4fb 70%)' }}>
          <span className="absolute inset-[45%_0] h-[10%] bg-black/70" /><span className="absolute inset-[0_45%] w-[10%] bg-black/70" />
          <motion.span className="absolute -inset-1 rounded-full" animate={still ? undefined : { opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 3 + i, repeat: Infinity }} style={{ boxShadow: '0 0 30px 6px rgba(253,253,148,0.6)' }} />
        </div>
      ))}
      {[25, 51, 77].map((l) => (
        <motion.div key={l} className="absolute top-0" style={{ left: `${l}%`, originY: 0 }} animate={still ? undefined : { rotate: [-3, 3, -3] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
          <span className="block w-[3px] h-[3vh] bg-black mx-auto" />
          <span className="block w-10 h-5 rounded-t-full border-std border-border bg-[#f5a08c] -mt-px" />
        </motion.div>
      ))}
    </div>
  );
}

function PowerFx({ kind, still, onDone }: { kind: string; still: boolean; onDone: () => void }) {
  useEffect(() => { const id = window.setTimeout(onDone, 2000); return () => window.clearTimeout(id); }, [onDone]);
  const art = POWERS.find((p) => p.id === kind)?.art;
  const base = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: 'absolute inset-0 pointer-events-none z-20' };
  const center = 'absolute left-1/2 top-1/2 w-[26cqmin] h-[26cqmin] -ml-[13cqmin] -mt-[13cqmin]';
  if (still) return <motion.div {...base}><div className={center}>{art}</div></motion.div>;
  if (kind === 'overtime') return <motion.div {...base}><motion.div className={center} animate={{ rotate: [0, -20, 20, -20, 20, 0], scale: [0.5, 1.1, 1] }} transition={{ duration: 1.4 }}>{art}</motion.div></motion.div>;
  if (kind === 'wrench') return <motion.div {...base}><motion.div className={center} animate={{ rotate: [0, 360, 720], y: [0, -40, 0] }} transition={{ duration: 1.2, ease: 'easeInOut' }}>{art}</motion.div>{Array.from({ length: 10 }, (_, i) => <motion.span key={i} className="absolute left-1/2 top-1/2 w-3 h-3 rounded-full bg-[#fdfd94] border-2 border-black" animate={{ x: Math.cos(i * 0.63) * 200, y: Math.sin(i * 0.63) * 200, opacity: [1, 0] }} transition={{ delay: 1, duration: 0.6 }} />)}</motion.div>;
  if (kind === 'magnet') return <motion.div {...base}><motion.div className={center} animate={{ rotate: [0, -12, 12, -12, 0], scale: [0.6, 1.1, 1] }} transition={{ duration: 1.2 }}>{art}</motion.div>{Array.from({ length: 10 }, (_, i) => <motion.img key={i} src={COIN} alt="" className="absolute w-[5cqmin]" initial={{ left: `${(i * 11) % 100}%`, top: i % 2 ? '90%' : '20%' }} animate={{ left: '48%', top: '48%', opacity: [1, 1, 0] }} transition={{ delay: 0.2 + i * 0.07, duration: 0.8, ease: 'easeIn' }} />)}</motion.div>;
  if (kind === 'truck') return <motion.div {...base}><motion.div className="absolute bottom-[6%] w-[30cqmin] h-[20cqmin]" initial={{ left: '-35%' }} animate={{ left: ['-35%', '35%', '35%', '110%'], y: [0, -4, 0, -4, 0] }} transition={{ duration: 1.9, times: [0, 0.4, 0.6, 1] }}><Art kind="truckBig" /></motion.div></motion.div>;
  if (kind === 'helper') return <motion.div {...base}><motion.div className={center} initial={{ y: -500 }} animate={{ y: 0, rotate: [0, -10, 10, 0] }} transition={{ type: 'spring', stiffness: 160, damping: 10 }}>{art}</motion.div></motion.div>;
  if (kind === 'turbo') return <motion.div {...base}>{Array.from({ length: 8 }, (_, i) => <motion.span key={i} className="absolute h-2 rounded-full bg-white border-2 border-black" style={{ top: `${15 + i * 10}%`, width: '25%' }} initial={{ left: '-30%' }} animate={{ left: '110%' }} transition={{ delay: i * 0.06, duration: 0.6, repeat: 1 }} />)}<motion.div className={center} animate={{ scale: [0.4, 1.2, 1] }} transition={{ duration: 0.7 }}>{art}</motion.div></motion.div>;
  if (kind === 'mystery') return <motion.div {...base}><motion.div className={center} initial={{ y: -400 }} animate={{ y: [-400, 0, -30, 0], rotate: [0, 0, -8, 0] }} transition={{ duration: 1 }}>{art}</motion.div></motion.div>;
  if (kind === 'wrap') return <motion.div {...base}><div className="absolute inset-[15%] grid grid-cols-6 gap-2 rounded-2xl border-heavy border-border p-3" style={{ background: 'rgba(230,248,255,0.8)' }}>{Array.from({ length: 24 }, (_, i) => <motion.span key={i} className="rounded-full border-[3px] border-black bg-white/80" animate={{ scale: [1, 1, 0.4] }} transition={{ delay: 0.3 + ((i * 7) % 24) * 0.05, duration: 0.2 }} />)}</div></motion.div>;
  if (kind === 'ducks') return <motion.div {...base}>{Array.from({ length: 12 }, (_, i) => <motion.span key={i} className="absolute w-[9cqmin] h-[9cqmin]" style={{ top: `${20 + (i % 4) * 18}%` }} initial={{ left: '-12%' }} animate={{ left: '110%', y: [0, -10, 0, -10, 0], rotate: [0, -10, 10, 0] }} transition={{ delay: i * 0.1, duration: 1.6, ease: 'linear' }}><ToyArt type="duck" /></motion.span>)}</motion.div>;
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
  return (
    <svg viewBox={kind === 'truckBig' ? '0 0 150 100' : '0 0 100 100'} aria-hidden="true" className="w-full h-full overflow-visible">
      {kind === 'wrench' && <>{ring('#fff6b0')}<path d="M30 74l28-28a14 14 0 1 1 8 8L38 82z" fill="#f6c544" stroke="#000" strokeWidth="5" strokeLinejoin="round" /><path d="M64 28l6 8 8-2" stroke="#000" strokeWidth="4" fill="none" /></>}
      {kind === 'truck' && <>{ring('#dff7e4')}<rect x="16" y="38" width="42" height="28" rx="4" fill="#f5a08c" stroke="#000" strokeWidth="4" /><path d="M58 46h14l10 10v10H58z" fill="#b4c4fb" stroke="#000" strokeWidth="4" strokeLinejoin="round" /><circle cx="30" cy="68" r="7" fill="#241c3d" stroke="#000" strokeWidth="3" /><circle cx="70" cy="68" r="7" fill="#241c3d" stroke="#000" strokeWidth="3" /><circle cx="37" cy="52" r="7" fill="#f6c544" stroke="#000" strokeWidth="3" /></>}
      {kind === 'truckBig' && <><rect x="6" y="18" width="88" height="56" rx="8" fill="#f5a08c" stroke="#000" strokeWidth="6" /><path d="M94 36h28l20 22v16H94z" fill="#b4c4fb" stroke="#000" strokeWidth="6" strokeLinejoin="round" /><rect x="104" y="42" width="18" height="14" rx="3" fill="#e6f8ff" stroke="#000" strokeWidth="4" /><circle cx="30" cy="80" r="14" fill="#241c3d" stroke="#000" strokeWidth="5" /><circle cx="116" cy="80" r="14" fill="#241c3d" stroke="#000" strokeWidth="5" />{[[30, 44], [50, 38], [70, 46], [40, 58]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="9" fill="#f6c544" stroke="#000" strokeWidth="3" />)}</>}
      {kind === 'helper' && <>{ring('#d7f3ff')}<g transform="translate(18 14) scale(0.64)"><ToyShape type="robot" /></g></>}
      {kind === 'turbo' && <>{ring('#fff6b0')}<path d="M56 14L28 56h20l-6 30 30-44H52z" fill="#f6c544" stroke="#000" strokeWidth="5" strokeLinejoin="round" /><path d="M14 40h10M10 54h14M14 68h10" stroke="#000" strokeWidth="4" strokeLinecap="round" /></>}
      {kind === 'wrap' && <>{ring('#e6f8ff')}<rect x="20" y="24" width="60" height="52" rx="6" fill="#fff" stroke="#000" strokeWidth="4" />{[30, 50, 70].map((x) => [38, 56].map((y) => <circle key={`${x}${y}`} cx={x} cy={y} r="7" fill="#e6f8ff" stroke="#000" strokeWidth="2.5" />))}</>}
      {kind === 'ducks' && <>{ring('#fff6b0')}<g transform="translate(14 22) scale(0.38)"><ToyShape type="duck" /></g><g transform="translate(48 34) scale(0.38)"><ToyShape type="duck" /></g><g transform="translate(28 50) scale(0.38)"><ToyShape type="duck" /></g></>}
    </svg>
  );
}

function Cover() {
  return (
    <svg viewBox="0 0 100 62" preserveAspectRatio="xMidYMid slice">
      <rect width="100" height="62" fill="#c9b8e8" />
      <rect y="38" width="100" height="24" fill="#8d7fb0" />
      {[18, 50, 82].map((x) => <circle key={x} cx={x} cy="8" r="5" fill="#fdfd94" stroke="#000" strokeWidth="0.8" />)}
      {[0, 1].map((r) => (
        <g key={r} transform={`translate(0 ${18 + r * 21})`}>
          <rect x="4" y="13" width="92" height="4" rx="2" fill="#5b5470" stroke="#000" strokeWidth="0.6" />
          {[0, 1, 2].slice(0, 3 - r).map((i) => <g key={i} transform={`translate(${16 + i * 22} 0)`}><rect x="0" y="2" width="16" height="11" rx="2" fill={['#fdfd94', '#7fd6e3', '#ef7d96'][(i + r) % 3]} stroke="#000" strokeWidth="0.7" /><circle cx="5" cy="1.5" r="2.6" fill="#c8c2b4" stroke="#000" strokeWidth="0.5" /><rect x="4" y="5" width="8" height="6" rx="1" fill="#fbfcf8" stroke="#000" strokeWidth="0.5" /></g>)}
          <circle cx={r ? 66 : 84} cy="10.5" r="2.4" fill="#8fe3a0" stroke="#000" strokeWidth="0.5" />
          <path d="M86 8h10l-1 8h-8z" fill="#ef7d96" stroke="#000" strokeWidth="0.7" />
        </g>
      ))}
    </svg>
  );
}

const def: LabDef = {
  id: 'toy-factory',
  name: 'Toy Factory',
  description: 'Answer right to add a machine to your factory row. Belts roll, toys pop out, and coins pile up.',
  ways: ['teams', 'solo'],
  minTeams: 2,
  maxTeams: 4,
  how: [
    { icon: <CheckCircle weight="fill" />, text: 'Answer the question' },
    { icon: <Factory weight="fill" />, text: 'Right? Pick a machine' },
    { icon: <Trophy weight="fill" />, text: 'Most coins wins' },
  ],
  rounds: { label: 'Rounds', min: 3, max: 20, default: 8 },
  powers: POWERS,
  background: 'radial-gradient(120% 90% at 50% 10%, #ddd2f3 0%, #b4a2dc 60%, #8d7fb0 100%)',
  cover: <Cover />,
  pieces: [
    { id: 'background', label: 'Factory hall', hint: 'The wall, windows and lamps' },
    { id: 'belt', label: 'Conveyor belt', hint: 'The moving belt of each row' },
    { id: 'toybox', label: 'Toy box', hint: 'Where finished toys land' },
    { id: 'coin', label: 'Coin', hint: 'The coins machines make' },
    ...(Object.keys(MACHINES) as MachineType[]).map((t) => ({ id: `machine-${t}`, label: MACHINES[t].name, hint: 'A machine and the toy it makes' })),
    ...POWERS.map((p) => ({ id: `power-${p.id}`, label: p.name, hint: p.desc })),
  ],
  Play,
};
export default def;
